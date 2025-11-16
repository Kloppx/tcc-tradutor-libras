import os
import cv2
import mediapipe as mp
import numpy as np
import pandas as pd

# --- Configurações ---
MAP_FILE_PATH = '/app/data/processed/dataset_map.csv'
SAVE_DIR = '/app/data/processed/sequences' # Nova pasta para salvar os "esqueletos"

# Defina um tamanho fixo para as sequências (ex: 30 frames)
# Isso é crucial para o modelo de IA.
MAX_FRAMES = 30 
# ---------------------

def extract_keypoints(results):
    """Extrai os pontos-chave do resultado do MediaPipe."""
    # Pose: 33 landmarks * 4 valores (x, y, z, visibilidade) = 132
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() \
        if results.pose_landmarks else np.zeros(33 * 4)
    
    # Rosto: 468 landmarks * 3 valores (x, y, z) = 1404
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() \
        if results.face_landmarks else np.zeros(468 * 3)
    
    # Mão Esquerda: 21 landmarks * 3 valores (x, y, z) = 63
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() \
        if results.left_hand_landmarks else np.zeros(21 * 3)
    
    # Mão Direita: 21 landmarks * 3 valores (x, y, z) = 63
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() \
        if results.right_hand_landmarks else np.zeros(21 * 3)
    
    # Concatena tudo em um único array gigante (132 + 1404 + 63 + 63 = 1662 valores)
    return np.concatenate([pose, face, lh, rh])

def process_video(video_path):
    """Lê um vídeo e extrai os pontos-chave de MAX_FRAMES frames."""
    cap = cv2.VideoCapture(video_path)
    video_landmarks = [] # Lista para guardar os landmarks de cada frame

    # Inicializa o MediaPipe Holistic
    with mp.solutions.holistic.Holistic(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as holistic:
        
        frame_count = 0
        while cap.isOpened() and frame_count < MAX_FRAMES:
            success, image = cap.read()
            if not success:
                break # Fim do vídeo

            # Converte a imagem de BGR (OpenCV) para RGB (MediaPipe)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Processa a imagem
            image.flags.writeable = False # Otimização
            results = holistic.process(image)
            image.flags.writeable = True # Reabilita escrita

            # Extrai e salva os pontos-chave
            keypoints = extract_keypoints(results)
            video_landmarks.append(keypoints)
            frame_count += 1
            
    cap.release()

    # --- Tratamento de Tamanho Fixo (Padding) ---
    # Se o vídeo tiver menos frames que MAX_FRAMES, preenchemos com zeros
    if frame_count < MAX_FRAMES:
        padding_needed = MAX_FRAMES - frame_count
        # Criamos 'padding_needed' frames de zeros, com o mesmo n° de features (1662)
        zero_padding = np.zeros((padding_needed, 1662), dtype=np.float32)
        
        # Se o vídeo não tiver frames (ex: corrompido), cria um array de zeros
        if video_landmarks:
            video_landmarks = np.concatenate([np.array(video_landmarks), zero_padding])
        else:
            video_landmarks = np.zeros((MAX_FRAMES, 1662), dtype=np.float32)

    return np.array(video_landmarks)


def main():
    print("Iniciando Fase 2: Extração de Features (Pontos-Chave)")
    
    # 1. Carrega o mapa do dataset
    try:
        df = pd.read_csv(MAP_FILE_PATH)
    except FileNotFoundError:
        print(f"ERRO: Mapa do dataset não encontrado em {MAP_FILE_PATH}")
        print("Por favor, crie o arquivo CSV manualmente (Passo 2).")
        return

    # 2. Cria o diretório para salvar as sequências
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    print(f"Encontrados {len(df)} vídeos no mapa. Iniciando processamento...")
    
    # 3. Itera por cada vídeo no mapa
    for index, row in df.iterrows():
        video_path = row['video_path']
        label = row['label']
        
        # Define um caminho único para salvar o arquivo .npy
        # Ex: /app/data/processed/sequences/Obrigado_0.npy
        # Ex: /app/data/processed/sequences/Obrigado_1.npy
        
        # Conta quantos já existem com esse rótulo para criar um ID único
        label_count = len([f for f in os.listdir(SAVE_DIR) if f.startswith(f"{label}_")])
        save_path = os.path.join(SAVE_DIR, f"{label}_{label_count}.npy")

        if not os.path.exists(video_path):
            print(f"AVISO: Vídeo não encontrado em {video_path}. Pulando.")
            continue
            
        print(f"Processando: {video_path} (Rótulo: {label})")
        
        # 4. Processa o vídeo
        sequence_data = process_video(video_path)
        
        # 5. Salva os dados como um arquivo NumPy
        np.save(save_path, sequence_data)
        
    print("\nFase 2 concluída com sucesso!")
    print(f"Sequências de pontos-chave salvas em: {SAVE_DIR}")

if __name__ == '__main__':
    main()