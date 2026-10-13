"""WebSocket server for real-time prediction from mobile app.

Receives base64 JPEG frames via WebSocket, extracts MediaPipe keypoints,
maintains a short sequence per-connection and runs the Keras model.

Usage (local):
    .\venv\Scripts\Activate.ps1
    pip install fastapi uvicorn python-multipart opencv-python mediapipe
    uvicorn src.ws_server:app --host 0.0.0.0 --port 8000

The mobile app should point to ws://<HOST>:8000/ws/predict
"""
import asyncio
import base64
import json
import os
import time
from typing import Dict, List

import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import HTMLResponse
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
REALTIME_WINDOW_SECONDS = 3.0
MIN_REALTIME_FRAMES = 12


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


def decode_image(base64_str: str):
    try:
        img_bytes = base64.b64decode(base64_str)
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


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


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)


manager = ConnectionManager()


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
    return HTMLResponse("WebSocket prediction server is running.")


@app.post('/predict_video')
async def predict_video(file: UploadFile = File(...)):
    """Accept a short video (mp4/webm) and return the predicted word.

    The server will sample `seq_len` frames evenly across the video,
    extract MediaPipe keypoints and run the model.
    """
    # load artifacts
    model, class_names, seq_len = ensure_artifacts()

    # save upload to a temporary file
    suffix = os.path.splitext(file.filename)[1] if file.filename else '.mp4'
    tmp_name = os.path.join(tempfile.gettempdir(), f"upload_{uuid.uuid4().hex}{suffix}")
    try:
        contents = await file.read()
        with open(tmp_name, 'wb') as f:
            f.write(contents)

        cap = cv2.VideoCapture(tmp_name)
        frames = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()

        if len(frames) == 0:
            return {"status": "error", "message": "no_frames"}

        selected_frames = uniform_sample(frames, seq_len)
        kp_sequence = []
        with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
            for img in selected_frames:
                kp = extract_keypoints_from_image(img, holistic)
                kp_sequence.append(kp)

        prepared, quality = prepare_detected_sequence(kp_sequence, seq_len)
        if prepared is None:
            return {
                "status": "uncertain",
                "message": "As mãos não ficaram visíveis durante tempo suficiente.",
                "quality": quality,
            }

        seq_arr = np.expand_dims(prepared, axis=0)
        # run prediction
        try:
            res = model.predict(seq_arr, 0)
            response = prediction_response(res[0], class_names)
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
        except Exception as e:
            return {"status": "error", "message": str(e)}

    finally:
        try:
            if os.path.exists(tmp_name):
                os.remove(tmp_name)
        except Exception:
            pass


@app.post('/predict_frames')
async def predict_frames(payload: Dict):
    """Accept JSON payload with key 'frames' -> list of base64 JPEG strings."""
    if 'frames' not in payload:
        return {"status": "error", "message": "missing_frames"}

    frames_b64 = payload['frames']
    if not isinstance(frames_b64, list) or len(frames_b64) == 0:
        return {"status": "error", "message": "no_frames"}

    model, class_names, seq_len = ensure_artifacts()

    imgs = []
    for b64 in frames_b64:
        img = decode_image(b64)
        if img is not None:
            imgs.append(img)

    if len(imgs) == 0:
        return {"status": "error", "message": "invalid_frames"}

    selected_images = uniform_sample(imgs, seq_len)
    kp_sequence = []
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for img in selected_images:
            kp = extract_keypoints_from_image(img, holistic)
            kp_sequence.append(kp)

    prepared, quality = prepare_detected_sequence(kp_sequence, seq_len)
    if prepared is None:
        return {
            "status": "uncertain",
            "message": "As mãos não ficaram visíveis durante tempo suficiente.",
            "quality": quality,
        }

    seq_arr = np.expand_dims(prepared, axis=0)
    try:
        res = model.predict(seq_arr, 0)
        response = prediction_response(res[0], class_names)
        response["quality"] = quality
        return response
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    await manager.connect(websocket)
    # per-connection state
    sequence = []
    predictions = []

    # load model/artifacts lazily on first connection
    model, class_names, seq_len = load_artifacts()

    # MediaPipe context per connection
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        try:
            while True:
                data = await websocket.receive_text()

                # Expect base64 JPEG string
                if not data:
                    continue

                img = decode_image(data)
                if img is None:
                    await websocket.send_text(json.dumps({"status": "error", "message": "invalid_image"}))
                    continue

                # extract keypoints
                kp = extract_keypoints_from_image(img, holistic)
                now = time.monotonic()
                sequence.append((now, kp))
                sequence = [item for item in sequence if now - item[0] <= REALTIME_WINDOW_SECONDS]

                window_duration = sequence[-1][0] - sequence[0][0] if len(sequence) > 1 else 0.0
                if len(sequence) >= MIN_REALTIME_FRAMES and window_duration >= REALTIME_WINDOW_SECONDS * 0.8:
                    # run prediction in threadpool to avoid blocking
                    prepared, quality = prepare_detected_sequence([item[1] for item in sequence], seq_len)
                    if prepared is None:
                        await websocket.send_text(json.dumps({
                            "status": "uncertain",
                            "message": "Mantenha as mãos visíveis no enquadramento.",
                            "quality": quality,
                        }))
                        continue

                    seq_arr = np.expand_dims(prepared, axis=0)
                    loop = asyncio.get_running_loop()
                    res = await loop.run_in_executor(None, model.predict, seq_arr, 0)
                    response = prediction_response(res[0], class_names)
                    response["quality"] = quality
                    predicted_word = response.get("word")
                    predictions.append(predicted_word)
                    predictions = predictions[-10:]

                    # Require three equal accepted predictions before publishing a word.
                    stable = (
                        predicted_word is not None
                        and len(predictions) >= 3
                        and len(set(predictions[-3:])) == 1
                    )

                    if response["status"] == "predicted" and not stable:
                        response["status"] = "partial"
                    await websocket.send_text(json.dumps(response))

        except WebSocketDisconnect:
            manager.disconnect(websocket)
        except Exception as e:
            try:
                await websocket.send_text(json.dumps({"status": "error", "message": str(e)}))
            except Exception:
                pass
            manager.disconnect(websocket)
