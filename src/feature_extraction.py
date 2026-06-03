import argparse
import cv2
import numpy as np
import os
import mediapipe as mp

# --- CONFIGURAÇÕES ---
# Caminho onde estão os vídeos brutos organizados por split
RAW_PATH = os.path.join('dataset', 'raw')

# Caminho onde vamos salvar os dados numéricos
EXPORT_PATH = os.path.join('data', 'features')

SPLITS = ['train', 'val', 'test']

# --- CONFIGURAÇÃO DO MEDIAPIPE ---
mp_holistic = mp.solutions.holistic

def extract_keypoints(results):
    """
    Transforma os resultados do MediaPipe em um array plano (1D) com todos os pontos.
    Se não detectar algo (ex: mão esquerda sumiu), preenche com zeros para não quebrar a IA.
    """
    # 1. Pose (33 pontos x 4 coordenadas: x, y, z, visibility) = 132 valores
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    
    # 2. Mão Esquerda (21 pontos x 3 coordenadas) = 63 valores
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    
    # 3. Mão Direita (21 pontos x 3 coordenadas) = 63 valores
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    
    # Mantem apenas pose + maos para reduzir ruido e dimensionalidade.
    return np.concatenate([pose, lh, rh])

def processar_videos(raw_path, export_path):
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Pasta de videos nao encontrada: {raw_path}")

    if not os.path.exists(export_path):
        os.makedirs(export_path)

    # Inicia o modelo Holistic
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        
        for split in SPLITS:
            split_input_path = os.path.join(raw_path, split)
            if not os.path.exists(split_input_path):
                print(f"AVISO: Split nao encontrado, pulando: {split_input_path}")
                continue

            classes = sorted(
                [
                    pasta
                    for pasta in os.listdir(split_input_path)
                    if os.path.isdir(os.path.join(split_input_path, pasta))
                ]
            )

            for action in classes:
                save_path = os.path.join(export_path, split, action)
                if not os.path.exists(save_path):
                    os.makedirs(save_path)

                folder_path = os.path.join(split_input_path, action)
                video_files = [
                    f for f in os.listdir(folder_path) if f.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm'))
                ]

                print(f"--- [{split}] Processando classe: {action} ({len(video_files)} videos) ---")

                for video_file in video_files:
                    video_path = os.path.join(folder_path, video_file)
                    cap = cv2.VideoCapture(video_path)

                    video_frames = []

                    frame_num = 0
                    while cap.isOpened():
                        ret, frame = cap.read()
                        if not ret:
                            break

                        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        image.flags.writeable = False
                        results = holistic.process(image)

                        keypoints = extract_keypoints(results)
                        video_frames.append(keypoints)

                        frame_num += 1

                    cap.release()

                    npy_filename = os.path.splitext(video_file)[0]
                    npy_path = os.path.join(save_path, npy_filename)

                    np.save(npy_path, np.array(video_frames))

                    print(f"Video {video_file} processado: {frame_num} frames salvos.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extrai keypoints dos videos de Libras.")
    parser.add_argument("--raw-root", default=RAW_PATH, help="Pasta raiz dos videos (default: dataset/raw).")
    parser.add_argument("--export-root", default=EXPORT_PATH, help="Pasta de saida das features (default: data/features).")
    args = parser.parse_args()

    processar_videos(args.raw_root, args.export_root)