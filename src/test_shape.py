import numpy as np
import os

# Caminho para o primeiro vídeo da água
path = os.path.join('data', 'features', 'agua', '0.npy')

if os.path.exists(path):
    data = np.load(path)
    print(f"\n--- RESULTADO DA GRAVAÇÃO ---")
    print(f"Shape do arquivo: {data.shape}")
    
    if data.shape == (30, 1662):
        print("✅ SUCESSO! O vídeo tem 30 frames e todos os pontos.")
        print("Pode seguir para o 'preprocess_data.py'.")
    else:
        print(f"❌ AINDA NÃO. O formato está {data.shape}.")
        print("Deveria ser (30, 1662).")
else:
    print(f"Arquivo não encontrado em: {path}")
    print("Você gravou a classe 'agua'?")