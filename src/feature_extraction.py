import cv2
import numpy as np
import os
import mediapipe as mp

# --- CONFIGURAÇÕES ---
# Caminho onde estão os vídeos brutos
DATA_PATH = os.path.join('dataset') 

# Caminho onde vamos salvar os dados numéricos (dentro de data/features)
EXPORT_PATH = os.path.join('data', 'features')

# Lista das ações (classes) que vamos processar
# Dica: O código vai pegar todas as pastas que estiverem dentro de 'dataset' automaticamente
actions = np.array([pasta for pasta in os.listdir(DATA_PATH) if os.path.isdir(os.path.join(DATA_PATH, pasta))])

# --- CONFIGURAÇÃO DO MEDIAPIPE ---
mp_holistic = mp.solutions.holistic

def extract_keypoints(results):
    """
    Transforma os resultados do MediaPipe em um array plano (1D) com todos os pontos.
    Se não detectar algo (ex: mão esquerda sumiu), preenche com zeros para não quebrar a IA.
    """
    # 1. Pose (33 pontos x 4 coordenadas: x, y, z, visibility) = 132 valores
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    
    # 2. Face (468 pontos x 3 coordenadas: x, y, z) = 1404 valores
    # Nota: Usamos apenas x,y,z aqui. Se quiser economizar espaço, pode reduzir isso depois.
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    
    # 3. Mão Esquerda (21 pontos x 3 coordenadas) = 63 valores
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    
    # 4. Mão Direita (21 pontos x 3 coordenadas) = 63 valores
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    
    # Junta tudo num linguição só
    return np.concatenate([pose, face, lh, rh])

def processar_videos():
    # Cria a pasta MP_Data se não existir
    if not os.path.exists(EXPORT_PATH):
        os.makedirs(EXPORT_PATH)

    # Inicia o modelo Holistic
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        
        # Loop pelas pastas (Agua, Obrigado, etc)
        for action in actions:
            # Cria a pasta da ação dentro de MP_Data
            save_path = os.path.join(EXPORT_PATH, action)
            if not os.path.exists(save_path):
                os.makedirs(save_path)
            
            # Pega os vídeos daquela pasta
            folder_path = os.path.join(DATA_PATH, action)
            video_files = [f for f in os.listdir(folder_path) if f.endswith(('.mp4', '.avi'))]
            
            print(f"--- Processando classe: {action} ({len(video_files)} vídeos) ---")

            for video_file in video_files:
                video_path = os.path.join(folder_path, video_file)
                cap = cv2.VideoCapture(video_path)
                
                # Vamos acumular todos os frames deste vídeo aqui
                video_frames = []
                
                frame_num = 0
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    # Processamento do MediaPipe
                    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    image.flags.writeable = False
                    results = holistic.process(image)
                    
                    # Extração dos números (pontos)
                    keypoints = extract_keypoints(results)
                    video_frames.append(keypoints)
                    
                    frame_num += 1

                cap.release()
                
                # Salva o arquivo .npy (Um arquivo por vídeo)
                # O nome será o mesmo do vídeo, mas com extensão .npy
                npy_filename = os.path.splitext(video_file)[0]
                npy_path = os.path.join(save_path, npy_filename)
                
                # Converte a lista de frames para um array numpy e salva
                np.save(npy_path, np.array(video_frames))
                
                print(f"Vídeo {video_file} processado: {frame_num} frames salvos.")

if __name__ == "__main__":
    processar_videos()