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
        ("feature_extraction", "Extraindo features MediaPipe..."),
        ("preprocess_data", "Pré-processando dados..."),
        ("model_training", "Treinando modelo..."),
        ("evaluate_model", "Avaliando modelo..."),
    ]
    
    for script_name, message in steps:
        print(f"\n🔄 {message}")
        print("=" * 60)
        
        if script_name == "evaluate_model":
            script_path = f"scripts/{script_name}.py"
        else:
            script_path = f"src/{script_name}.py"
        
        if script_name == "feature_extraction":
            cmd = [sys.executable, script_path, "--raw-root", "dataset/trimmed/raw", "--export-root", "data/features"]
        else:
            cmd = [sys.executable, script_path]
        
        result = subprocess.run(cmd, cwd=".")
        
        if result.returncode != 0:
            print(f"\n❌ Erro em {script_name}")
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
