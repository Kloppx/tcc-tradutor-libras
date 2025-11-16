import os
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import TensorBoard, EarlyStopping

# --- Configurações ---
DATA_DIR = '/app/data/processed/sequences'
MODELS_DIR = '/app/models'
MODEL_NAME = 'libras_model.keras' # Salva no novo formato .keras
LABEL_ENCODER_PATH = os.path.join(MODELS_DIR, 'label_encoder.npy')

# Parâmetros do Modelo
EPOCHS = 75 # Número de "rodadas" de treino
BATCH_SIZE = 16 # Quantos vídeos processar por vez
MAX_FRAMES = 30 # Deve ser O MESMO valor da Fase 2
NUM_FEATURES = 1662 # Deve ser O MESMO valor da Fase 2 (132 pose + 1404 face + 63 left + 63 right)
# ---------------------

def load_data():
    """Carrega os dados .npy da pasta e extrai os rótulos dos nomes."""
    sequences = [] # (X) Os dados do esqueleto
    labels = []    # (y) Os rótulos (texto)
    
    print(f"Carregando dados de {DATA_DIR}...")
    
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.npy'):
            # Extrai o rótulo do nome do arquivo
            # Ex: "oi_0.npy" -> "oi"
            # Ex: "posto_de_saude_1.npy" -> "posto_de_saude"
            label = '_'.join(filename.split('_')[:-1])
            
            # Carrega o arquivo .npy
            sequence_path = os.path.join(DATA_DIR, filename)
            data = np.load(sequence_path)
            
            sequences.append(data)
            labels.append(label)

    print(f"Encontrados {len(sequences)} vídeos.")
    print(f"Rótulos únicos encontrados: {np.unique(labels)}")
    
    return np.array(sequences), np.array(labels)

def main():
    """Orquestra o processo de treino: carregar, preparar, treinar, salvar."""
    
    # --- 1. Carregar Dados ---
    X, y = load_data()
    
    if X.shape[0] == 0:
        print("Erro: Nenhum dado .npy encontrado. Rode a Fase 2 primeiro.")
        return
        
    # --- 2. Preparar Rótulos (y) ---
    # Converte rótulos de texto ("oi", "saude") para números (0, 1)
    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y)
    
    # Salva o "dicionário" (encoder) para podermos traduzir de volta na Fase 4
    os.makedirs(MODELS_DIR, exist_ok=True)
    np.save(LABEL_ENCODER_PATH, encoder.classes_)
    print(f"Encoder de rótulos salvo em {LABEL_ENCODER_PATH}")
    
    # Converte os números (0, 1, 2) para o formato "one-hot"
    # Ex: 7 rótulos -> [0, 0, 1, 0, 0, 0, 0]
    # Isso é o que a rede neural espera como saída
    y_categorical = to_categorical(y_encoded)
    
    num_classes = len(encoder.classes_)
    print(f"Número total de classes (rótulos): {num_classes}")

    # --- 3. Dividir Dados (Treino e Teste) ---
    # Isso é CRUCIAL para seu TCC.
    # Usamos 80% para treinar e 20% para testar a performance.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_categorical, test_size=0.20, random_state=42, stratify=y_categorical
    )

    print(f"Vídeos para treino: {len(X_train)}")
    print(f"Vídeos para teste: {len(X_test)}")

    # --- 4. Definir a Arquitetura do Modelo (LSTM) ---
    model = Sequential()
    
    # Camada de entrada + 1ª Camada LSTM
    # input_shape = (frames, features) -> (30, 1662)
    model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(MAX_FRAMES, NUM_FEATURES)))
    model.add(Dropout(0.2)) # Dropout para evitar overfitting
    
    # 2ª Camada LSTM
    model.add(LSTM(128, return_sequences=True, activation='relu'))
    model.add(Dropout(0.2))
    
    # 3ª Camada LSTM (não retorna sequência, apenas o resultado final)
    model.add(LSTM(64, return_sequences=False, activation='relu'))
    
    # Camada "normal" (Densa)
    model.add(Dense(64, activation='relu'))
    model.add(Dropout(0.2))
    
    # Camada de Saída
    # O número de neurônios DEVE ser igual ao número de classes (rótulos)
    # A ativação 'softmax' nos dá a probabilidade de cada classe
    model.add(Dense(num_classes, activation='softmax'))

    # Compila o modelo
    model.compile(
        optimizer='Adam', 
        loss='categorical_crossentropy', # Formato de "perda" para classificação
        metrics=['accuracy'] # Queremos ver a acurácia
    )
    
    model.summary() # Imprime um resumo da arquitetura

    # --- 5. Treinar o Modelo ---
    print("\n--- Iniciando Treinamento ---")
    
    # Callback para parar o treino se não houver melhora
    early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

    history = model.fit(
        X_train, 
        y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_data=(X_test, y_test), # Usa os dados de teste para validar
        callbacks=[early_stop]
    )
    
    print("--- Treinamento Concluído ---")

    # --- 6. Avaliar o Modelo ---
    print("\n--- Avaliando Modelo ---")
    val_loss, val_accuracy = model.evaluate(X_test, y_test)
    print(f"Acurácia no set de Teste: {val_accuracy * 100:.2f}%")
    print(f"Perda (Loss) no set de Teste: {val_loss:.4f}")

    # --- 7. Salvar o Modelo ---
    model_path = os.path.join(MODELS_DIR, MODEL_NAME)
    model.save(model_path)
    print(f"\nModelo salvo com sucesso em: {model_path}")

if __name__ == '__main__':
    # Verifica se os dados de teste são suficientes
    try:
        main()
    except ValueError as e:
        print("\n" + "="*50)
        print(f"ERRO: {e}")
        print("\nIsso geralmente acontece porque seu dataset é MUITO PEQUENO.")
        print("O 'train_test_split' não conseguiu criar um set de teste")
        print("com pelo menos uma amostra de cada rótulo.")
        print("\nSOLUÇÃO: Adicione mais vídeos, pelo menos 5-10 POR RÓTULO.")
        print("="*50)