import numpy as np
import os
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import LSTM, Dense # type: ignore
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping # type: ignore

# --- CONFIGURAÇÕES ---
# Caminho onde estão os arquivos .npy gerados pelo preprocess_data.py
PATH_PROCESSED = os.path.join('data', 'processed')
PATH_MODELS = os.path.join('models')

def carregar_dados():
    """Carrega os arrays numpy salvos anteriormente"""
    try:
        print(f"Carregando dados de: {PATH_PROCESSED}")
        X_train = np.load(os.path.join(PATH_PROCESSED, 'X_train.npy'))
        X_test = np.load(os.path.join(PATH_PROCESSED, 'X_test.npy'))
        y_train = np.load(os.path.join(PATH_PROCESSED, 'y_train.npy'))
        y_test = np.load(os.path.join(PATH_PROCESSED, 'y_test.npy'))
        return X_train, X_test, y_train, y_test
    except FileNotFoundError as e:
        print(f"ERRO CRÍTICO: Não encontrei os arquivos .npy.")
        print(f"Detalhe do erro: {e}")
        print("Dica: Verifique se a pasta 'data/processed' existe e tem os arquivos X_train.npy dentro.")
        exit()

def construir_modelo(input_shape, num_classes):
    """
    Arquitetura da Rede Neural LSTM
    """
    model = Sequential()
    
    # Camadas LSTM
    model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=input_shape))
    model.add(LSTM(128, return_sequences=True, activation='relu'))
    model.add(LSTM(64, return_sequences=False, activation='relu'))
    
    # Camadas de Decisão
    model.add(Dense(64, activation='relu'))
    model.add(Dense(32, activation='relu'))
    
    # Saída (Softmax = Probabilidade)
    model.add(Dense(num_classes, activation='softmax'))
    
    return model

if __name__ == "__main__":
    print("--- Iniciando Treinamento do Modelo ---")
    
    # 1. Carrega dados já processados
    X_train, X_test, y_train, y_test = carregar_dados()
    
    # 2. Define parâmetros baseados nos dados
    num_classes = y_train.shape[1] # Quantas colunas tem o label (ex: 3 colunas = 3 ações)
    input_shape = (X_train.shape[1], X_train.shape[2]) # (Frames, Features)
    
    print(f"Dados carregados com sucesso!")
    print(f"Ações detectadas: {num_classes}")
    print(f"Formato da entrada (Frames, Keypoints): {input_shape}")
    
    # 3. Cria a IA
    model = construir_modelo(input_shape, num_classes)
    
    # Compila (Define como ela aprende)
    model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])
    
    # Cria pasta models se não existir
    if not os.path.exists(PATH_MODELS):
        os.makedirs(PATH_MODELS)

    # 4. Configura Callbacks
    # Salva o melhor modelo (para não perder o treino se cair a luz)
    checkpoint = ModelCheckpoint(
        os.path.join(PATH_MODELS, 'melhor_modelo.keras'), 
        monitor='categorical_accuracy', 
        save_best_only=True, 
        mode='max',
        verbose=1
    )
    
    # Para se não melhorar mais (economiza tempo)
    early_stop = EarlyStopping(monitor='val_loss', patience=30, restore_best_weights=True)

    # 5. TREINA!
    history = model.fit(
        X_train, y_train, 
        epochs=200, 
        batch_size=32,
        validation_data=(X_test, y_test),
        callbacks=[checkpoint, early_stop]
    )
    
    # Salva versão final
    model.save(os.path.join(PATH_MODELS, 'modelo_final.h5'))
    print("\n--- Treinamento Concluído! ---")