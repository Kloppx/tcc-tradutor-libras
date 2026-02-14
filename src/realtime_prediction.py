import cv2
import numpy as np
import os
import mediapipe as mp
# Correção para o TF 2.15
from tensorflow.keras.models import load_model 

# --- CONFIGURAÇÕES ---
PATH_MODEL = os.path.join('models', 'modelo_final.h5') 
PATH_LABELS = os.path.join('models', 'label_encoder.npy')

# Configuração do MediaPipe
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, face, lh, rh])

def prob_viz(res, actions, input_frame, colors):
    """
    Desenha as barras de probabilidade na tela.
    """
    output_frame = input_frame.copy()
    for num, prob in enumerate(res):
        color = colors[num % len(colors)]
        
        # Desenha barra
        cv2.rectangle(output_frame, (0, 60+num*40), (int(prob*100), 90+num*40), color, -1)
        
        # --- AJUSTE DE COR: PRETO (0, 0, 0) ---
        text = f"{actions[num]}: {prob*100:.1f}%"
        
        # Borda branca fina para garantir leitura em qualquer fundo (Opcional, mas ajuda)
        # cv2.putText(output_frame, text, (0, 85+num*40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 3, cv2.LINE_AA)
        
        # Texto Principal em PRETO
        cv2.putText(output_frame, text, (0, 85+num*40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,0), 2, cv2.LINE_AA)
        
    return output_frame

def main():
    # 1. Carrega Modelo
    print("--- Carregando modelo e etiquetas ---")
    try:
        model = load_model(PATH_MODEL)
        label_map = np.load(PATH_LABELS, allow_pickle=True).item()
        actions = [k for k, v in sorted(label_map.items(), key=lambda item: item[1])]
        print(f"Modelo carregado! Classes: {actions}")
    except Exception as e:
        print(f"ERRO: {e}")
        return

    # 2. Variáveis
    sequence = []
    sentence = []
    predictions = []
    threshold = 0.8 # Confiança mínima para escrever a frase
    
    colors = [(245,117,16), (117,245,16), (16,117,245), (200, 100, 200), (0, 255, 255), (255, 0, 255)] 

    try:
        input_shape = model.input_shape[1]
    except:
        input_shape = 30 
        
    print(f"O modelo espera sequências de {input_shape} frames.")

    # 3. Câmera
    cap = cv2.VideoCapture(0) 

    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("Erro na câmera.")
                break

            # Processamento Visual
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = holistic.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            # 4. Lógica de Predição
            keypoints = extract_keypoints(results)
            sequence.append(keypoints)
            sequence = sequence[-input_shape:]
            
            if len(sequence) == input_shape:
                res = model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
                
                # Visualização (Barras)
                image = prob_viz(res, actions, image, colors)
                
                best_class_index = np.argmax(res)
                predictions.append(best_class_index)
                
                # Estabilidade (últimos 10 frames iguais)
                if np.unique(predictions[-10:])[0] == best_class_index:
                    if res[best_class_index] > threshold:
                        current_action = actions[best_class_index]
                        if len(sentence) > 0:
                            if current_action != sentence[-1]:
                                sentence.append(current_action)
                        else:
                            sentence.append(current_action)

                if len(sentence) > 5: 
                    sentence = sentence[-5:]

            # 5. Desenha Interface
            # Faixa Laranja no topo (Mantive texto branco pois o fundo é laranja)
            cv2.rectangle(image, (0,0), (640, 40), (245, 117, 16), -1)
            cv2.putText(image, ' '.join(sentence), (10,30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
            
            # Status do Buffer (Texto em PRETO agora)
            if len(sequence) < input_shape:
                cv2.putText(image, f"Carregando: {len(sequence)}/{input_shape}", (120, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,0), 2)

            cv2.imshow('Tradutor Libras (Real Time)', image)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()