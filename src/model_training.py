import numpy as np
import os
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import LSTM, Dense # type: ignore
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau # type: ignore
from tensorflow.keras.optimizers import Adam # type: ignore

# --- CONFIGURAÇÕES ---
# Caminho onde estão os arquivos .npy gerados pelo preprocess_data.py
PATH_PROCESSED = os.path.join('data', 'processed')
PATH_MODELS = os.path.join('models')
# Classes com maior confusao no teste anterior recebem um reforco leve no treino.
TARGET_CLASS_WEIGHTS = {
    'curar': 1.5,
    'doenca': 1.5,
}

def carregar_dados():
    """Carrega os arrays numpy salvos anteriormente"""
    try:
        print(f"Carregando dados de: {PATH_PROCESSED}")
        X_train = np.load(os.path.join(PATH_PROCESSED, 'X_train.npy'))
        X_val = np.load(os.path.join(PATH_PROCESSED, 'X_val.npy'))
        X_test = np.load(os.path.join(PATH_PROCESSED, 'X_test.npy'))
        y_train = np.load(os.path.join(PATH_PROCESSED, 'y_train.npy'))
        y_val = np.load(os.path.join(PATH_PROCESSED, 'y_val.npy'))
        y_test = np.load(os.path.join(PATH_PROCESSED, 'y_test.npy'))
        classes_path = os.path.join(PATH_PROCESSED, 'classes.npy')
        classes = np.load(classes_path, allow_pickle=True) if os.path.exists(classes_path) else None
        return X_train, X_val, X_test, y_train, y_val, y_test, classes
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
    X_train, X_val, X_test, y_train, y_val, y_test, classes = carregar_dados()
    
    # 2. Define parâmetros baseados nos dados
    num_classes = y_train.shape[1] # Quantas colunas tem o label (ex: 3 colunas = 3 ações)
    input_shape = (X_train.shape[1], X_train.shape[2]) # (Frames, Features)
    
    print(f"Dados carregados com sucesso!")
    print(f"Ações detectadas: {num_classes}")
    print(f"Formato da entrada (Frames, Keypoints): {input_shape}")
    print(f"Train: {X_train.shape} | Val: {X_val.shape} | Test: {X_test.shape}")

    # 2a. Pesos por classe para compensar desbalanceamento
    class_indices = np.argmax(y_train, axis=1)
    counts = np.bincount(class_indices, minlength=num_classes)
    total_samples = counts.sum()
    class_weight = {
        idx: (total_samples / (num_classes * count)) if count > 0 else 0.0
        for idx, count in enumerate(counts)
    }

    if classes is not None:
        class_names = [str(item) for item in classes.tolist()]
        for idx, class_name in enumerate(class_names):
            boost = TARGET_CLASS_WEIGHTS.get(class_name, 1.0)
            class_weight[idx] *= boost
        print("Pesos por classe:")
        for idx, weight in class_weight.items():
            class_name = class_names[idx] if idx < len(class_names) else str(idx)
            print(f"- {class_name}: {weight:.4f}")
    else:
        print(f"Pesos por classe (indices): {class_weight}")
    
    # 3. Cria a IA
    model = construir_modelo(input_shape, num_classes)
    
    # Compila (Define como ela aprende)
    optimizer = Adam(learning_rate=0.0003, clipnorm=1.0)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])
    
    # Cria pasta models se não existir
    if not os.path.exists(PATH_MODELS):
        os.makedirs(PATH_MODELS)

    # 4. Configura Callbacks
    # Salva o melhor modelo (para não perder o treino se cair a luz)
    checkpoint = ModelCheckpoint(
        os.path.join(PATH_MODELS, 'melhor_modelo.keras'), 
        monitor='val_categorical_accuracy', 
        save_best_only=True, 
        mode='max',
        verbose=1
    )
    
    # Para se não melhorar mais (economiza tempo)
    early_stop = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)

    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=8,
        min_lr=1e-5,
        verbose=1,
    )

    # 5. TREINA!
    history = model.fit(
        X_train, y_train, 
        epochs=200, 
        batch_size=32,
        validation_data=(X_val, y_val),
        callbacks=[checkpoint, early_stop, reduce_lr],
        class_weight=class_weight,
    )
    
    # Salva versão final
    model.save(os.path.join(PATH_MODELS, 'modelo_final.h5'))

    # Avaliacao final no teste (nunca usado para ajustar treino)
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"Resultado em TESTE -> loss: {test_loss:.4f} | acc: {test_acc:.4f}")
    print("\n--- Treinamento Concluído! ---")