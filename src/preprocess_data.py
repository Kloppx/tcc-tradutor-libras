import os
import numpy as np
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.preprocessing.sequence import pad_sequences

# --- CONFIGURAÇÕES ---
DATA_PATH = os.path.join('data', 'features')
SAVE_PATH = os.path.join('data', 'processed')
SPLITS = ['train', 'val', 'test']
MAX_LENGTH = 45


def infer_feature_dim(base_path):
    for split in SPLITS:
        split_path = os.path.join(base_path, split)
        if not os.path.exists(split_path):
            continue

        for class_name in os.listdir(split_path):
            class_path = os.path.join(split_path, class_name)
            if not os.path.isdir(class_path):
                continue

            npy_files = [f for f in os.listdir(class_path) if f.endswith('.npy')]
            for file_name in npy_files:
                arr = np.load(os.path.join(class_path, file_name))
                if arr.ndim == 2 and arr.shape[1] > 0:
                    return arr.shape[1]

    raise RuntimeError("Nao foi possivel inferir dimensao das features em data/features.")


def discover_actions(base_path):
    actions = set()
    for split in SPLITS:
        split_path = os.path.join(base_path, split)
        if not os.path.exists(split_path):
            continue

        for class_name in os.listdir(split_path):
            class_path = os.path.join(split_path, class_name)
            if os.path.isdir(class_path):
                actions.add(class_name)

    return sorted(actions)


def load_split_data(split, actions, max_length):
    split_path = os.path.join(DATA_PATH, split)
    sequences, labels = [], []
    feature_dim = infer_feature_dim(DATA_PATH)

    if not os.path.exists(split_path):
        print(f"AVISO: Split nao encontrado: {split_path}")
        return np.empty((0, max_length, feature_dim), dtype='float32'), np.empty((0, len(actions)), dtype='int32')

    for action_idx, action in enumerate(actions):
        action_path = os.path.join(split_path, action)
        if not os.path.exists(action_path):
            print(f" - [{split}] Classe ausente, pulando: {action}")
            continue

        files = [f for f in os.listdir(action_path) if f.endswith('.npy')]
        print(f" - [{split}] Processando '{action}': {len(files)} arquivos.")

        for file_name in files:
            res = np.load(os.path.join(action_path, file_name))

            if len(res) > max_length:
                res = res[:max_length]

            sequences.append(res)
            labels.append(action_idx)

    if not sequences:
        return np.empty((0, max_length, feature_dim), dtype='float32'), np.empty((0, len(actions)), dtype='int32')

    X = pad_sequences(sequences, maxlen=max_length, padding='post', dtype='float32')
    y = to_categorical(labels, num_classes=len(actions)).astype(int)
    return X, y

def process_data():
    print(f"Lendo dados de: {os.path.abspath(DATA_PATH)}")

    actions = discover_actions(DATA_PATH)
    if not actions:
        raise RuntimeError("Nenhuma classe encontrada em data/features/<split>/<classe>.")

    print(f"Classes detectadas: {actions}")

    X_train, y_train = load_split_data('train', actions, MAX_LENGTH)
    X_val, y_val = load_split_data('val', actions, MAX_LENGTH)
    X_test, y_test = load_split_data('test', actions, MAX_LENGTH)

    if X_train.shape[0] == 0:
        raise RuntimeError("Split train vazio. Nao e possivel treinar o modelo.")

    if not os.path.exists(SAVE_PATH):
        os.makedirs(SAVE_PATH)

    np.save(os.path.join(SAVE_PATH, 'X_train.npy'), X_train)
    np.save(os.path.join(SAVE_PATH, 'y_train.npy'), y_train)
    np.save(os.path.join(SAVE_PATH, 'X_val.npy'), X_val)
    np.save(os.path.join(SAVE_PATH, 'y_val.npy'), y_val)
    np.save(os.path.join(SAVE_PATH, 'X_test.npy'), X_test)
    np.save(os.path.join(SAVE_PATH, 'y_test.npy'), y_test)
    np.save(os.path.join(SAVE_PATH, 'classes.npy'), np.array(actions))

    print("\nSUCESSO! Dados processados e separados por split.")
    print(f"Train: X={X_train.shape}, y={y_train.shape}")
    print(f"Val:   X={X_val.shape}, y={y_val.shape}")
    print(f"Test:  X={X_test.shape}, y={y_test.shape}")

if __name__ == "__main__":
    process_data()