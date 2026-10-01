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
except ImportError:
    from backend_api import router as api_router


# --- Config ---
MODEL_PATHS = [
    os.path.join('models', 'melhor_modelo.keras'),
    os.path.join('models', 'modelo_final.h5'),
]
LABELS_PATH = os.path.join('models', 'label_encoder.npy')
DEFAULT_THRESHOLD = 0.75


app = FastAPI()
app.include_router(api_router)

# MediaPipe
mp_holistic = mp.solutions.holistic


def load_artifacts():
    model = None
    for p in MODEL_PATHS:
        if os.path.exists(p):
            try:
                model = load_model(p)
                print(f"Loaded model: {p}")
                break
            except Exception as e:
                print(f"Failed to load model {p}: {e}")

    if model is None:
        raise FileNotFoundError("No model found in models/ (tried melhor_modelo.keras and modelo_final.h5)")

    if os.path.exists(LABELS_PATH):
        labels = np.load(LABELS_PATH, allow_pickle=True).item()
        # labels may be dict class->idx, build ordered list by idx
        if isinstance(labels, dict):
            class_names = [k for k, v in sorted(labels.items(), key=lambda it: it[1])]
        else:
            class_names = list(labels)
    else:
        class_names = None

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

        # sample seq_len frames evenly
        if len(frames) >= seq_len:
            idxs = np.linspace(0, len(frames) - 1, seq_len).astype(int)
        else:
            # if fewer frames, repeat last frame to reach seq_len
            idxs = list(range(len(frames))) + [len(frames) - 1] * (seq_len - len(frames))

        kp_sequence = []
        with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
            for i in idxs:
                img = frames[int(i)]
                kp = extract_keypoints_from_image(img, holistic)
                kp_sequence.append(kp)

        seq_arr = np.expand_dims(np.array(kp_sequence), axis=0)
        # run prediction
        try:
            res = model.predict(seq_arr, 0)
            probs = res[0]
            best_idx = int(np.argmax(probs))
            conf = float(probs[best_idx])
            return {"status": "predicted", "word": class_names[best_idx] if class_names else str(best_idx), "confidence": conf}
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

    # sample or pad to seq_len
    if len(imgs) >= seq_len:
        idxs = np.linspace(0, len(imgs) - 1, seq_len).astype(int)
    else:
        idxs = list(range(len(imgs))) + [len(imgs) - 1] * (seq_len - len(imgs))

    kp_sequence = []
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for i in idxs:
            kp = extract_keypoints_from_image(imgs[int(i)], holistic)
            kp_sequence.append(kp)

    seq_arr = np.expand_dims(np.array(kp_sequence), axis=0)
    try:
        res = model.predict(seq_arr, 0)
        probs = res[0]
        best_idx = int(np.argmax(probs))
        conf = float(probs[best_idx])
        return {"status": "predicted", "word": class_names[best_idx] if class_names else str(best_idx), "confidence": conf}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    await manager.connect(websocket)
    # per-connection state
    sequence: List[np.ndarray] = []
    predictions: List[int] = []

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
                sequence.append(kp)
                sequence = sequence[-seq_len:]

                if len(sequence) == seq_len:
                    # run prediction in threadpool to avoid blocking
                    seq_arr = np.expand_dims(np.array(sequence), axis=0)
                    loop = asyncio.get_running_loop()
                    res = await loop.run_in_executor(None, model.predict, seq_arr, 0)
                    # model.predict returns array shape (1, num_classes)
                    probs = res[0]
                    best_idx = int(np.argmax(probs))
                    conf = float(probs[best_idx])
                    predictions.append(best_idx)

                    # simple stability: last 5 preds equal and above threshold
                    stable = False
                    if len(predictions) >= 5 and len(set(predictions[-5:])) == 1 and conf >= DEFAULT_THRESHOLD:
                        stable = True

                    response = {
                        "status": "predicted" if stable else "partial",
                        "word": class_names[best_idx] if class_names else str(best_idx),
                        "confidence": conf,
                    }
                    await websocket.send_text(json.dumps(response))

        except WebSocketDisconnect:
            manager.disconnect(websocket)
        except Exception as e:
            try:
                await websocket.send_text(json.dumps({"status": "error", "message": str(e)}))
            except Exception:
                pass
            manager.disconnect(websocket)
