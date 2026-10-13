import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv1D, BatchNormalization, Dropout,
    Bidirectional, GRU, Dense
)
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam
from tensorflow.keras import regularizers

# --- CONFIGURAÇÕES ---
PATH_PROCESSED = os.path.join('data', 'processed')
PATH_MODELS = os.path.join('models')
BEST_MODEL_NAME = 'melhor_modelo_v2.keras'
FINAL_MODEL_NAME = 'modelo_final_v2.h5'

np.random.seed(42)
tf.random.set_seed(42)

def carregar_dados():
    """Carrega os arrays numpy gerados pelo preprocess_data.py"""
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
        print(f"ERRO CRÍTICO: Não encontrei os arquivos .npy em {PATH_PROCESSED}.")
        print(f"Detalhe do erro: {e}")
        exit(1)

def augment_data(X, y):
    """
    Data augmentation para keypoints normalizados de Libras:
    1. Jitter suave somente nas coordenadas detectadas
    2. Pequena variação na velocidade de execução do gesto
    Multiplica por 3x os dados de treino para evitar overfitting.
    """
    X_aug_list = [X]
    y_aug_list = [y]

    # Jitter leve apenas em coordenadas detectadas. Os campos visibility da
    # pose e os landmarks ausentes devem permanecer inalterados.
    coordinate_mask = np.ones(X.shape[-1], dtype=np.float32)
    coordinate_mask[3:132:4] = 0.0
    detected_mask = (np.abs(X) > 1e-6).astype(np.float32)
    noise1 = np.random.normal(0, 0.004, size=X.shape)
    noise1 *= detected_mask * coordinate_mask.reshape(1, 1, -1)
    X_aug1 = X + noise1
    X_aug_list.append(X_aug1)
    y_aug_list.append(y)

    # Variação temporal sem inserir frames artificiais zerados.
    frame_count = X.shape[1]
    center = (frame_count - 1) / 2.0
    X_aug2 = np.empty_like(X)
    for sample_idx in range(X.shape[0]):
        speed = np.random.uniform(0.9, 1.1)
        indices = center + (np.arange(frame_count) - center) * speed
        indices = np.rint(np.clip(indices, 0, frame_count - 1)).astype(np.int32)
        X_aug2[sample_idx] = X[sample_idx, indices]
    X_aug_list.append(X_aug2)
    y_aug_list.append(y)

    X_total = np.concatenate(X_aug_list, axis=0)
    y_total = np.concatenate(y_aug_list, axis=0)

    idx = np.random.permutation(len(X_total))
    return X_total[idx], y_total[idx]

def construir_modelo(input_shape, num_classes):
    """
    Arquitetura Híbrida Conv1D + Bi-GRU:
    - Conv1D captura movimento local entre frames (essencial para datilologia/dedos).
    - Bi-GRU analisa o sinal nas duas direções temporais.
    - Dropout e L2 combatem ativamente a memorização (overfitting).
    """
    model = Sequential([
        Conv1D(64, kernel_size=3, padding='same', activation='relu', input_shape=input_shape),
        BatchNormalization(),
        Dropout(0.2),

        Conv1D(64, kernel_size=3, padding='same', activation='relu'),
        BatchNormalization(),
        Dropout(0.2),

        Bidirectional(GRU(64, return_sequences=True, dropout=0.25)),
        Bidirectional(GRU(64, return_sequences=False, dropout=0.25)),

        Dense(64, activation='relu', kernel_regularizer=regularizers.l2(0.001)),
        BatchNormalization(),
        Dropout(0.4),

        Dense(32, activation='relu', kernel_regularizer=regularizers.l2(0.001)),
        Dropout(0.3),

        Dense(num_classes, activation='softmax')
    ])
    return model

def main():
    print("=" * 70)
    print("   TREINAMENTO APRIMORADO (CONV1D + BI-GRU + DATA AUGMENTATION)")
    print("=" * 70)

    # 1. Carrega dados
    X_train, X_val, X_test, y_train, y_val, y_test, classes = carregar_dados()

    num_classes = y_train.shape[1]
    input_shape = (X_train.shape[1], X_train.shape[2])

    print(f"\nClasses detectadas ({num_classes}): {classes.tolist() if classes is not None else num_classes}")
    print(f"Dimensões de Entrada (Frames, Features): {input_shape}")
    print(f"Amostras Originais -> Treino: {X_train.shape[0]} | Val: {X_val.shape[0]} | Teste: {X_test.shape[0]}")

    # 2. Data Augmentation
    print("\nAplicando Data Augmentation no Treino...")
    X_train_aug, y_train_aug = augment_data(X_train, y_train)
    print(f"Treino Expandido: {X_train.shape[0]} -> {X_train_aug.shape[0]} amostras (3x)")

    # 3. Pesos balanceados proporcionais
    class_indices = np.argmax(y_train_aug, axis=1)
    counts = np.bincount(class_indices, minlength=num_classes)
    total_samples = counts.sum()
    class_weight = {
        idx: (total_samples / (num_classes * count)) if count > 0 else 0.0
        for idx, count in enumerate(counts)
    }

    # 4. Constrói modelo
    model = construir_modelo(input_shape, num_classes)
    optimizer = Adam(learning_rate=0.0006, clipnorm=1.0)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])

    if not os.path.exists(PATH_MODELS):
        os.makedirs(PATH_MODELS)

    # 5. Salva label_encoder.npy sincronizado
    if classes is not None:
        encoder_dict = {str(name): idx for idx, name in enumerate(classes.tolist())}
        np.save(os.path.join(PATH_MODELS, 'label_encoder.npy'), encoder_dict)
        print(f"Label encoder atualizado em: {os.path.join(PATH_MODELS, 'label_encoder.npy')}")

    # 6. Callbacks
    checkpoint = ModelCheckpoint(
        os.path.join(PATH_MODELS, BEST_MODEL_NAME),
        monitor='val_categorical_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    )

    early_stop = EarlyStopping(
        monitor='val_loss',
        patience=25,
        restore_best_weights=True
    )

    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=8,
        min_lr=1e-5,
        verbose=1,
    )

    # 7. Treino
    print("\nIniciando Treinamento (120 épocas)...")
    model.fit(
        X_train_aug, y_train_aug,
        epochs=120,
        batch_size=32,
        validation_data=(X_val, y_val),
        callbacks=[checkpoint, early_stop, reduce_lr],
        class_weight=class_weight,
    )

    # 8. Salva versão final
    model.save(os.path.join(PATH_MODELS, FINAL_MODEL_NAME))

    # 9. Avaliação com o melhor modelo
    print("\nAvaliando o Melhor Modelo salvo no conjunto de TESTE...")
    melhor_modelo = tf.keras.models.load_model(os.path.join(PATH_MODELS, BEST_MODEL_NAME))
    test_loss, test_acc = melhor_modelo.evaluate(X_test, y_test, verbose=0)
    print("\n" + "=" * 60)
    print(f"RESULTADO NO TESTE: Loss = {test_loss:.4f} | Acurácia (acc) = {test_acc*100:.2f}%")
    print("=" * 60)

if __name__ == "__main__":
    main()
