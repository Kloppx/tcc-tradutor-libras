import os
import numpy as np
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.preprocessing.sequence import pad_sequences

# --- CORREÇÃO DO CAMINHO ---
# Agora apontando para onde seus arquivos estão de verdade
DATA_PATH = os.path.join('data', 'features') 

ACTIONS = np.array(['agua', 'dor', 'febre', 'hospital', 'rapido', 'saude'])
MAX_LENGTH = 30 # Mantendo o corte curto para o vídeo ficar ágil

def process_data():
    sequences, labels = [], []
    
    print(f"Lendo dados de: {os.path.abspath(DATA_PATH)}")
    
    for action_idx, action in enumerate(ACTIONS):
        action_path = os.path.join(DATA_PATH, action)
        
        # Verificação de segurança
        if not os.path.exists(action_path):
            print(f"AVISO: Pasta não encontrada: {action_path}")
            continue
            
        files = [f for f in os.listdir(action_path) if f.endswith('.npy')]
        print(f" - Processando '{action}': {len(files)} arquivos.")
        
        for file_name in files:
            # Carrega o arquivo
            res = np.load(os.path.join(action_path, file_name))
            
            # --- CORTE AGRESSIVO (O segredo da agilidade) ---
            # Pega só os primeiros 30 frames (1 segundo)
            if len(res) > MAX_LENGTH:
                res = res[:MAX_LENGTH]
            
            sequences.append(res)
            labels.append(action_idx)

    # Padding (preenche com zeros se tiver menos de 30)
    X = pad_sequences(sequences, maxlen=MAX_LENGTH, padding='post', dtype='float32')
    y = to_categorical(labels).astype(int)

    # Salva na pasta processed
    save_path = os.path.join('data', 'processed')
    if not os.path.exists(save_path):
        os.makedirs(save_path)
        
    np.save(os.path.join(save_path, 'X_train.npy'), X)
    np.save(os.path.join(save_path, 'y_train.npy'), y)
    np.save(os.path.join(save_path, 'X_test.npy'), X)
    np.save(os.path.join(save_path, 'y_test.npy'), y)
    
    print(f"\nSUCESSO! Dados processados e cortados em 30 frames.")
    print(f"Formato final: {X.shape}") 

if __name__ == "__main__":
    process_data()