import cv2
import numpy as np
import os
import mediapipe as mp

# --- CONFIGURAÇÕES ---
DATA_PATH = os.path.join('data', 'features') 
# Ajuste aqui para as palavras que você quer gravar agora
actions = np.array(['saude'])
no_sequences = 30
sequence_length = 30

mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, face, lh, rh])

def main():
    # Garante que as pastas existem
    for action in actions:
        action_path = os.path.join(DATA_PATH, action)
        if not os.path.exists(action_path):
            os.makedirs(action_path)

    cap = cv2.VideoCapture(0) 
    
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        
        # Loop 1: Palavras (Agua -> Dor -> ...)
        for action in actions:
            # Loop 2: Vídeos (0 a 29)
            for sequence in range(no_sequences):
                
                window = [] # <--- IMPORTANTE: Zera a lista aqui, ANTES de começar os frames
                
                # Loop 3: Frames (0 a 29)
                for frame_num in range(sequence_length):
                    ret, frame = cap.read()
                    if not ret: break

                    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    image.flags.writeable = False
                    results = holistic.process(image)
                    image.flags.writeable = True
                    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                    
                    # --- INTERFACE ---
                    if frame_num == 0:
                        cv2.putText(image, 'PREPARE-SE...', (120,200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255, 0), 4, cv2.LINE_AA)
                        cv2.putText(image, f'Gravando: {action} | Video: {sequence}', (15,12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                        cv2.imshow('Coleta', image)
                        cv2.waitKey(2000)
                    else: 
                        cv2.putText(image, f'GRAVANDO "{action}" [{sequence}/{no_sequences}]', (15,12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                        cv2.imshow('Coleta', image)

                    # Coleta os dados
                    keypoints = extract_keypoints(results)
                    window.append(keypoints) # <--- Adiciona o frame na lista

                    if cv2.waitKey(10) & 0xFF == ord('q'):
                        break
                
                # --- HORA DA VERDADE ---
                # Isso roda FORA do loop de frames, mas DENTRO do loop de video
                final_array = np.array(window)
                
                print(f"Vídeo {sequence} finalizado. Shape: {final_array.shape}")
                
                if final_array.shape == (30, 1662):
                    npy_path = os.path.join(DATA_PATH, action, str(sequence))
                    np.save(npy_path, final_array)
                else:
                    print(f"ERRO: O vídeo ficou com tamanho errado: {final_array.shape}. Não salvando.")

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()