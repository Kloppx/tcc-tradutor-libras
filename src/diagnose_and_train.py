import os
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import TensorBoard, EarlyStopping
from tensorflow.keras.optimizers import Adam

# --- CONFIGURAÇÕES ---
DATA_PATH = os.path.join('data', 'processed') 
MODEL_PATH = os.path.join('models', 'modelo_final.h5')

def run():
    print("--- 1. DIAGNÓSTICO DOS DADOS ---")
    try:
        X_train = np.load(os.path.join(DATA_PATH, 'X_train.npy'))
        y_train = np.load(os.path.join(DATA_PATH, 'y_train.npy'))
    except FileNotFoundError:
        print("❌ ERRO: Arquivos X_train/y_train não achados. Rode o preprocess_data.py!")
        return

    print(f"Shape dos Dados: {X_train.shape}")
    
    # Verifica se os dados são apenas zeros
    max_val = np.max(X_train)
    mean_val = np.mean(X_train)
    print(f"Valor Máximo encontrado: {max_val:.4f}")
    print(f"Média dos valores: {mean_val:.4f}")

    if max_val == 0:
        print("\n❌❌ PROBLEMA CRÍTICO DETECTADO ❌❌")
        print("Os seus dados estão todos ZERADOS.")
        print("Causa provável: O MediaPipe não detectou seu corpo/mãos durante a gravação.")
        print("Solução: Você precisa gravar de novo num ambiente mais iluminado ou chegando mais perto.")
        return
    else:
        print("✅ Dados parecem válidos (contêm movimento).")

    print("\n--- 2. INICIANDO TREINAMENTO OTIMIZADO ---")
    
    # Modelo Simplificado (Menos camadas = Menor chance de travar com poucos dados)
    model = Sequential()
    # Camada 1: LSTM mais simples
    model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(30, 1662)))
    # Camada 2: LSTM final
    model.add(LSTM(128, return_sequences=False, activation='relu'))
    
    # Camadas de Classificação
    model.add(Dense(64, activation='relu'))
    model.add(Dense(32, activation='relu'))
    model.add(Dense(y_train.shape[1], activation='softmax'))

    # Compilação com Learning Rate ajustado
    opt = Adam(learning_rate=0.0005) # Um pouco mais lento para não se perder
    model.compile(optimizer=opt, loss='categorical_crossentropy', metrics=['categorical_accuracy'])

    # Treinamento (Epochs altas para garantir, EarlyStopping para parar se ficar bom)
    # Vamos rodar até 500 épocas. Se parar de melhorar por 20 épocas, ele encerra.
    es = EarlyStopping(monitor='categorical_accuracy', patience=30, restore_best_weights=True)
    
    model.fit(X_train, y_train, epochs=500, callbacks=[es])
    
    # Salva
    model.save(MODEL_PATH)
    print(f"\n--- FIM ---")
    print(f"Modelo salvo em: {MODEL_PATH}")

if __name__ == "__main__":
    run()