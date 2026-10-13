#!/usr/bin/env python3
"""
Script para monitorar o progress do trimming e rodar o pipeline completo
"""
import os
import subprocess
import sys
import time

def wait_for_trimming():
    """Aguarda até que a pasta trimmed/raw tenha conteúdo"""
    trimmed_path = "dataset/trimmed/raw"
    print(f"⏳ Aguardando término do trimming...")
    
    while True:
        if os.path.exists(trimmed_path):
            # Contar quantos vídeos foram gerados
            videos = []
            for root, dirs, files in os.walk(trimmed_path):
                videos.extend([f for f in files if f.endswith('.mp4')])
            
            if videos:
                print(f"✅ Trimming concluído: {len(videos)} vídeos gerados\n")
                return len(videos)
        
        time.sleep(5)  # Verificar a cada 5 segundos

def run_pipeline():
    """Executa o pipeline completo"""
    steps = [
        ([sys.executable, "src/feature_extraction.py", "--raw-root", "dataset/trimmed/raw", "--export-root", "data/features"], "Extraindo features MediaPipe..."),
        ([sys.executable, "src/preprocess_data.py"], "Pré-processando e normalizando dados..."),
        ([sys.executable, "src/train_v2.py"], "Treinando modelo v2..."),
        ([sys.executable, "scripts/calibrate_model.py"], "Calibrando confiança do modelo..."),
        ([sys.executable, "scripts/evaluate_model.py", "--model-path", "models/melhor_modelo_v2.keras", "--report-dir", "reports/v2"], "Avaliando modelo v2..."),
    ]
    
    for cmd, message in steps:
        print(f"\n🔄 {message}")
        print("=" * 60)

        result = subprocess.run(cmd, cwd=".")
        
        if result.returncode != 0:
            print(f"\n❌ Erro ao executar: {' '.join(cmd)}")
            return False
    
    return True

if __name__ == "__main__":
    # Aguardar trimming
    video_count = wait_for_trimming()
    
    # Rodar pipeline
    if run_pipeline():
        print("\n🎉 Pipeline concluído com sucesso!")
    else:
        print("\n❌ Pipeline falhou")
        sys.exit(1)
