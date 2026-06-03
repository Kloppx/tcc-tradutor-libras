#!/usr/bin/env python3
"""
Organiza vídeos de D:\Sinais IA para a estrutura dataset/raw/{train,val,test}/{classe}/
e distribui entre train (70%), val (15%), test (15%)
"""
import os
import shutil
import random
from pathlib import Path

def main():
    source_root = r"D:\Sinais IA"
    
    # Verificar se a pasta raiz existe
    if not os.path.exists(source_root):
        print(f"❌ Pasta não encontrada: {source_root}")
        return
    
    # Listar classes (subpastas)
    classes_dirs = [d for d in os.listdir(source_root) 
                   if os.path.isdir(os.path.join(source_root, d))]
    
    if not classes_dirs:
        print(f"❌ Nenhuma subpasta encontrada em {source_root}")
        return
    
    print(f"✅ Classes encontradas: {', '.join(classes_dirs)}\n")
    
    # Criar estrutura de pastas
    splits = ['train', 'val', 'test']
    
    for split in splits:
        for classe_orig in classes_dirs:
            classe = classe_orig.lower().replace('ç', 'c').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
            path = f"dataset/raw/{split}/{classe}"
            os.makedirs(path, exist_ok=True)
    
    print("✅ Estrutura de pastas criada\n")
    
    # Processar cada classe
    total_videos = 0
    
    for classe_orig in classes_dirs:
        classe_path = os.path.join(source_root, classe_orig)
        videos = [f for f in os.listdir(classe_path) if f.lower().endswith('.mp4')]
        
        if not videos:
            print(f"⚠️  {classe_orig}: nenhum vídeo encontrado")
            continue
        
        # Normalizar nome da classe
        classe = classe_orig.lower().replace('ç', 'c').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
        
        print(f"📂 {classe_orig} ({classe}): {len(videos)} vídeos")
        
        # Distribuir vídeos: 70% train, 15% val, 15% test
        random.shuffle(videos)
        
        total = len(videos)
        train_count = int(total * 0.70)
        val_count = int(total * 0.15)
        test_count = total - train_count - val_count
        
        print(f"   Train: {train_count} | Val: {val_count} | Test: {test_count}")
        
        # Copiar e renomear vídeos
        video_counter = 1
        
        # Train
        for video in videos[:train_count]:
            src = os.path.join(classe_path, video)
            dst = f"dataset/raw/train/{classe}/{classe}_{video_counter:03d}.mp4"
            shutil.copy2(src, dst)
            video_counter += 1
        
        # Val
        for video in videos[train_count:train_count+val_count]:
            src = os.path.join(classe_path, video)
            dst = f"dataset/raw/val/{classe}/{classe}_{video_counter:03d}.mp4"
            shutil.copy2(src, dst)
            video_counter += 1
        
        # Test
        for video in videos[train_count+val_count:]:
            src = os.path.join(classe_path, video)
            dst = f"dataset/raw/test/{classe}/{classe}_{video_counter:03d}.mp4"
            shutil.copy2(src, dst)
            video_counter += 1
        
        total_videos += total
        print(f"   ✅ Copiados e renomeados\n")
    
    print(f"🎉 Processamento concluído!")
    print(f"📊 Total de vídeos: {total_videos}\n")
    
    # Verificar o resultado
    print("📊 Verificação final:")
    for split in splits:
        split_path = f"dataset/raw/{split}"
        classes = [d for d in os.listdir(split_path) if os.path.isdir(os.path.join(split_path, d))]
        print(f"\n  {split.upper()}:")
        for classe in sorted(classes):
            count = len([f for f in os.listdir(os.path.join(split_path, classe)) if f.endswith('.mp4')])
            print(f"    {classe}: {count} vídeos")

if __name__ == "__main__":
    main()
