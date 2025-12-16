import numpy as np
import os
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical

# --- CONFIGURAÇÕES ---
DATA_PATH = os.path.join('data', 'features')
ACTIONS = np.array([pasta for pasta in os.listdir(DATA_PATH) if os.path.isdir(os.path.join(DATA_PATH, pasta))])

def carregar_e_processar_dados():
    sequences, labels = [], []
    
    # 1. Cria um dicionário para converter PALAVRA -> NÚMERO
    # Ex: {'agua': 0, 'obrigado': 1, 'saude': 2}
    label_map = {label:num for num, label in enumerate(ACTIONS)}
    
    print(f"Classes encontradas: {label_map}")

    # 2. Carrega os dados
    max_length = 0 # Vamos descobrir qual é o vídeo mais longo
    
    for action in ACTIONS:
        folder_path = os.path.join(DATA_PATH, action)
        file_names = os.listdir(folder_path)
        
        for file_name in file_names:
            if file_name.endswith('.npy'):
                res = np.load(os.path.join(folder_path, file_name))
                sequences.append(res)
                labels.append(label_map[action])
                
                # Guarda o tamanho do maior vídeo
                if len(res) > max_length:
                    max_length = len(res)

    print(f"Total de vídeos: {len(sequences)}")
    print(f"Vídeo mais longo tem: {max_length} frames")

    # 3. PADRONIZAÇÃO (Zero Padding)
    # Todos os vídeos devem ter o mesmo tamanho (max_length)
    # Quem for menor, preenchemos com zeros no final
    X = np.zeros((len(sequences), max_length, 1662)) # 1662 é o total de keypoints do MediaPipe Holistic
    
    for i, seq in enumerate(sequences):
        length = len(seq)
        X[i, :length, :] = seq # Copia os dados originais
        # O restante já é zero automaticamente pela inicialização do array

    # 4. Converte labels para categorias binárias (One Hot Encoding)
    # Ex: 0 vira [1,0,0], 1 vira [0,1,0]
    y = to_categorical(labels).astype(int)

    return X, y, max_length, label_map

if __name__ == "__main__":
    print("--- Iniciando Pré-processamento ---")
    
    X, y, max_len, actions_map = carregar_e_processar_dados()
    
    # 5. Divisão Treino e Teste (O Padrão Ouro do TCC)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.10, random_state=42) # 10% para teste

    print("\n--- Relatório Final ---")
    print(f"Dados de Treino: {X_train.shape}") # (Qtd Videos, Frames, Features)
    print(f"Dados de Teste:  {X_test.shape}")
    
    # 6. Salvar tudo processado para a IA pegar pronto
    # Cria pasta 'processed' se não existir
    if not os.path.exists('data/processed'):
        os.makedirs('data/processed')

    np.save('data/processed/X_train.npy', X_train)
    np.save('data/processed/X_test.npy', X_test)
    np.save('data/processed/y_train.npy', y_train)
    np.save('data/processed/y_test.npy', y_test)
    
    # Salva o mapa de classes (pra saber quem é quem depois)
    np.save('models/label_encoder.npy', actions_map) # Salva em models ou data
    
    print("Dados salvos em 'data/processed/'. Pronto para treinar!")