import cv2
import mediapipe as mp

# 1. Configurações do MediaPipe (O "Cérebro")
mp_holistic = mp.solutions.holistic      # Modelo que detecta corpo, rosto e mãos
mp_drawing = mp.solutions.drawing_utils  # Utilitário para desenhar os traços na tela

def mediapipe_detection(image, model):
    """Função auxiliar para fazer a detecção"""
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) # Converte cor (OpenCV usa BGR, MediaPipe usa RGB)
    image.flags.writeable = False                  # Trava a imagem para escrita (otimização de performance)
    results = model.process(image)                 # Faz a mágica acontecer
    image.flags.writeable = True                   # Destrava
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR) # Converte de volta para BGR
    return image, results

def draw_styled_landmarks(image, results):
    """Função para desenhar os esqueletos com cores bonitinhas"""
    # Desenhar Rosto
    mp_drawing.draw_landmarks(
        image, results.face_landmarks, mp_holistic.FACEMESH_TESSELATION, 
        mp_drawing.DrawingSpec(color=(80,110,10), thickness=1, circle_radius=1),
        mp_drawing.DrawingSpec(color=(80,256,121), thickness=1, circle_radius=1)
    ) 
    # Desenhar Pose (Corpo)
    mp_drawing.draw_landmarks(
        image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS,
        mp_drawing.DrawingSpec(color=(80,22,10), thickness=2, circle_radius=4),
        mp_drawing.DrawingSpec(color=(80,44,121), thickness=2, circle_radius=2)
    )
    # Desenhar Mão Esquerda
    mp_drawing.draw_landmarks(
        image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
        mp_drawing.DrawingSpec(color=(121,22,76), thickness=2, circle_radius=4),
        mp_drawing.DrawingSpec(color=(121,44,250), thickness=2, circle_radius=2)
    )
    # Desenhar Mão Direita
    mp_drawing.draw_landmarks(
        image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
        mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=4),
        mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
    )

# 2. Captura do Vídeo
# IMPORTANTE: Troque o caminho abaixo por um vídeo REAL do seu dataset
caminho_do_video = r"dataset\agua\agua_0001.mp4" 

# Se quiser testar na WEBCAM, troque o caminho acima pelo número 0:
# cap = cv2.VideoCapture(0) 
cap = cv2.VideoCapture(caminho_do_video)

# Inicia o modelo Holistic
with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
    
    while cap.isOpened():
        ret, frame = cap.read()
        
        # Se acabar o vídeo, para o loop
        if not ret:
            print("Fim do vídeo ou erro ao ler arquivo.")
            break

        frame = cv2.resize(frame, (640, 480))

        # Faz a detecção
        image, results = mediapipe_detection(frame, holistic)
        
        # Desenha os pontos na tela
        draw_styled_landmarks(image, results)

        # Mostra na tela
        cv2.imshow('OpenCV Feed - Pressione Q para sair', image)

        # Sai se apertar 'q'
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()