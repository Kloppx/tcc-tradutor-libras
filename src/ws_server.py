"""FastAPI server for recorded-video sign prediction and the clinical API.

The mobile app uploads a short recording to ``/predict_video``. The legacy
WebSocket endpoint remains available for experiments with frame sequences.

Usage (local):
    .\venv\Scripts\Activate.ps1
    pip install fastapi uvicorn python-multipart opencv-python mediapipe
    uvicorn src.ws_server:app --host 0.0.0.0 --port 8000

The mobile app should point ``EXPO_PUBLIC_API_URL`` to this server.
"""
import json
import os
from typing import Dict, List

import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse
from starlette.concurrency import run_in_threadpool
import tempfile
import uuid
from tensorflow.keras.models import load_model

try:
    from .backend_api import router as api_router
    from .landmark_pipeline import prepare_sequence, sequence_detection_quality
except ImportError:
    from backend_api import router as api_router
    from landmark_pipeline import prepare_sequence, sequence_detection_quality


# --- Config ---
MODEL_PATHS = [
    os.path.join('models', 'melhor_modelo_v2.keras'),
    os.path.join('models', 'modelo_final_v2.h5'),
]
LABELS_PATH = os.path.join('models', 'label_encoder.npy')
INFERENCE_CONFIG_PATH = os.path.join('models', 'inference_config_v2.json')
DEFAULT_THRESHOLD = 0.75
DEFAULT_MARGIN = 0.15
TEMPERATURE = 1.0
MIN_HAND_DETECTION_RATIO = 0.35
MAX_UPLOAD_BYTES = 40 * 1024 * 1024
MAX_VIDEO_FRAMES = 1800
UPLOAD_CHUNK_BYTES = 1024 * 1024
ALLOWED_VIDEO_SUFFIXES = {'.mp4', '.mov', '.webm', '.avi', '.mkv'}


app = FastAPI()
app.include_router(api_router)

# MediaPipe
mp_holistic = mp.solutions.holistic


def load_artifacts():
    global DEFAULT_THRESHOLD, DEFAULT_MARGIN, TEMPERATURE
    model = None
    loaded_path = None
    for p in MODEL_PATHS:
        if os.path.exists(p):
            try:
                model = load_model(p)
                loaded_path = p
                print(f"Loaded model: {p}")
                break
            except Exception as e:
                print(f"Failed to load model {p}: {e}")

    if model is None:
        raise FileNotFoundError("Modelo v2 não encontrado em models/. Execute src/train_v2.py.")

    if os.path.exists(LABELS_PATH):
        labels = np.load(LABELS_PATH, allow_pickle=True).item()
        # labels may be dict class->idx, build ordered list by idx
        if isinstance(labels, dict):
            class_names = [k for k, v in sorted(labels.items(), key=lambda it: it[1])]
        else:
            class_names = list(labels)
    else:
        class_names = None

    if loaded_path and loaded_path.endswith('melhor_modelo_v2.keras') and os.path.exists(INFERENCE_CONFIG_PATH):
        try:
            with open(INFERENCE_CONFIG_PATH, 'r', encoding='utf-8') as config_file:
                inference_config = json.load(config_file)
            TEMPERATURE = float(inference_config.get('temperature', TEMPERATURE))
            DEFAULT_THRESHOLD = float(inference_config.get('confidence_threshold', DEFAULT_THRESHOLD))
            DEFAULT_MARGIN = float(inference_config.get('margin_threshold', DEFAULT_MARGIN))
        except (OSError, ValueError, TypeError) as exc:
            print(f"Failed to load inference config: {exc}")

    # infer input length
    try:
        seq_len = model.input_shape[1]
    except Exception:
        seq_len = 45

    return model, class_names, seq_len


def extract_keypoints_from_image(image, holistic):
    # image is BGR from cv2
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = holistic.process(image_rgb)

    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])


def prediction_response(probs, class_names):
    """Build a prediction response with uncertainty rejection and top-3."""
    probabilities = np.clip(np.asarray(probs, dtype=np.float32), 1e-7, 1.0)
    if TEMPERATURE != 1.0:
        logits = np.log(probabilities) / TEMPERATURE
        logits -= np.max(logits)
        probabilities = np.exp(logits)
        probabilities /= np.sum(probabilities)
    order = np.argsort(probabilities)[::-1]
    best_idx = int(order[0])
    confidence = float(probabilities[best_idx])
    second_confidence = float(probabilities[order[1]]) if len(order) > 1 else 0.0
    margin = confidence - second_confidence

    def class_name(index):
        return class_names[index] if class_names else str(index)

    top3 = [
        {"word": class_name(int(index)), "confidence": float(probabilities[index])}
        for index in order[:3]
    ]
    accepted = confidence >= DEFAULT_THRESHOLD and margin >= DEFAULT_MARGIN

    if not accepted:
        return {
            "status": "uncertain",
            "message": "Sinal não reconhecido com segurança. Tente novamente.",
            "word": None,
            "confidence": confidence,
            "margin": margin,
            "top3": top3,
        }

    return {
        "status": "predicted",
        "word": class_name(best_idx),
        "confidence": confidence,
        "margin": margin,
        "top3": top3,
    }


def prepare_detected_sequence(keypoints, seq_len):
    raw_sequence = np.asarray(keypoints, dtype=np.float32)
    quality = sequence_detection_quality(raw_sequence)
    if quality["hand_ratio"] < MIN_HAND_DETECTION_RATIO:
        return None, quality
    return prepare_sequence(raw_sequence, target_length=seq_len), quality


def uniform_sample(items, target_length):
    """Sample the complete recording without decoding landmarks unnecessarily."""
    if len(items) <= target_length:
        return items
    indices = np.rint(np.linspace(0, len(items) - 1, target_length)).astype(np.int32)
    return [items[int(index)] for index in indices]


# simple artifact cache to avoid reloading model every request
_MODEL_CACHE = {
    'model': None,
    'class_names': None,
    'seq_len': None,
}

def ensure_artifacts():
    if _MODEL_CACHE['model'] is None:
        model, class_names, seq_len = load_artifacts()
        _MODEL_CACHE['model'] = model
        _MODEL_CACHE['class_names'] = class_names
        _MODEL_CACHE['seq_len'] = seq_len
    return _MODEL_CACHE['model'], _MODEL_CACHE['class_names'], _MODEL_CACHE['seq_len']


@app.get("/")
async def index():
    return HTMLResponse("InterpreteArte API is running.")


def _sample_video_file(video_path: str, seq_len: int) -> List[np.ndarray]:
    cap = cv2.VideoCapture(video_path)
    try:
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if total_frames > MAX_VIDEO_FRAMES:
            raise ValueError("video_too_long")

        frames: List[np.ndarray] = []
        if total_frames > 0:
            indexes = np.linspace(0, total_frames - 1, min(seq_len, total_frames)).astype(int)
            for frame_index in indexes:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_index))
                ret, frame = cap.read()
                if ret:
                    frames.append(frame)
            return frames

        while len(frames) <= MAX_VIDEO_FRAMES:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        if len(frames) > MAX_VIDEO_FRAMES:
            raise ValueError("video_too_long")
        return uniform_sample(frames, seq_len) if frames else []
    finally:
        cap.release()


def _predict_video_file(video_path: str, model, class_names, seq_len: int) -> Dict:
    selected_frames = _sample_video_file(video_path, seq_len)
    if not selected_frames:
        return {"status": "error", "message": "no_frames"}

    kp_sequence = []
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for image in selected_frames:
            kp_sequence.append(extract_keypoints_from_image(image, holistic))

    prepared, quality = prepare_detected_sequence(kp_sequence, seq_len)
    if prepared is None:
        return {
            "status": "uncertain",
            "message": "As mãos não ficaram visíveis durante tempo suficiente.",
            "quality": quality,
        }

    result = model.predict(np.expand_dims(prepared, axis=0), 0)
    response = prediction_response(result[0], class_names)
    response["quality"] = quality
    top3_info = ", ".join(
        f"{item['word']}: {item['confidence'] * 100:.1f}%"
        for item in response.get("top3", [])
    )
    print(
        f"[IA] status={response['status']} palavra={response.get('word')} "
        f"confiança={response.get('confidence', 0) * 100:.1f}% | {top3_info}",
        flush=True,
    )
    return response


@app.post('/predict_video')
async def predict_video(file: UploadFile = File(...)):
    """Accept a short video (mp4/webm) and return the predicted word.

    The server will sample `seq_len` frames evenly across the video,
    extract MediaPipe keypoints and run the model.
    """
    suffix = os.path.splitext(file.filename)[1].lower() if file.filename else '.mp4'
    if suffix not in ALLOWED_VIDEO_SUFFIXES:
        raise HTTPException(status_code=415, detail="Formato de vídeo não suportado")
    if file.content_type and not file.content_type.startswith('video/'):
        raise HTTPException(status_code=415, detail="O arquivo enviado não é um vídeo")

    tmp_name = os.path.join(tempfile.gettempdir(), f"upload_{uuid.uuid4().hex}{suffix}")
    try:
        received_bytes = 0
        with open(tmp_name, 'wb') as f:
            while chunk := await file.read(UPLOAD_CHUNK_BYTES):
                received_bytes += len(chunk)
                if received_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Vídeo excede o limite de 40 MB")
                f.write(chunk)

        model, class_names, seq_len = await run_in_threadpool(ensure_artifacts)
        try:
            return await run_in_threadpool(_predict_video_file, tmp_name, model, class_names, seq_len)
        except ValueError as exc:
            if str(exc) == "video_too_long":
                raise HTTPException(status_code=413, detail="Vídeo longo demais para análise") from exc
            raise
        except Exception as exc:
            print(f"[IA] falha ao processar vídeo: {type(exc).__name__}", flush=True)
            raise HTTPException(status_code=422, detail="Não foi possível analisar o vídeo") from exc

    finally:
        await file.close()
        try:
            if os.path.exists(tmp_name):
                os.remove(tmp_name)
        except Exception:
            pass
