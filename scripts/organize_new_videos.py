#!/usr/bin/env python3
"""Adiciona novos vídeos ao dataset sem alterar os arquivos já cadastrados."""

import argparse
import hashlib
import random
import re
import shutil
import unicodedata
from collections import Counter
from pathlib import Path
from typing import Dict, List, Sequence, Tuple


VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
SPLITS = ("train", "val", "test")


def print_progress(label: str, current: int, total: int, width: int = 32) -> None:
    if total <= 0:
        return
    ratio = min(1.0, current / total)
    filled = int(width * ratio)
    bar = "#" * filled + "-" * (width - filled)
    print(f"\r{label}: [{bar}] {current}/{total} ({ratio * 100:5.1f}%)", end="", flush=True)
    if current >= total:
        print()


def normalize_class_key(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    words = re.sub(r"[^a-z0-9]+", " ", without_accents.lower()).strip().split()
    return " ".join(words)


def list_videos(folder: Path) -> List[Path]:
    return sorted(
        path
        for path in folder.iterdir()
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    )


def discover_existing_classes(dataset_root: Path) -> Dict[str, str]:
    classes: Dict[str, str] = {}
    for split in SPLITS:
        split_path = dataset_root / split
        if not split_path.exists():
            continue
        for folder in split_path.iterdir():
            if folder.is_dir():
                classes.setdefault(normalize_class_key(folder.name), folder.name)
    return classes


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file_handle:
        for chunk in iter(lambda: file_handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def existing_hashes(dataset_root: Path, class_name: str) -> set[str]:
    hashes: set[str] = set()
    for split in SPLITS:
        class_path = dataset_root / split / class_name
        if not class_path.exists():
            continue
        for video in list_videos(class_path):
            hashes.add(file_sha256(video))
    return hashes


def next_class_index(dataset_root: Path, class_name: str) -> int:
    highest = 0
    for split in SPLITS:
        class_path = dataset_root / split / class_name
        if not class_path.exists():
            continue
        for video in list_videos(class_path):
            match = re.search(r"(\d+)$", video.stem)
            if match:
                highest = max(highest, int(match.group(1)))
    return highest + 1


def calculate_split_counts(total: int, val_ratio: float, test_ratio: float) -> Dict[str, int]:
    if total <= 0:
        return {"train": 0, "val": 0, "test": 0}

    test_count = round(total * test_ratio)
    val_count = round(total * val_ratio)

    if val_ratio > 0 and total >= 5:
        val_count = max(1, val_count)
    if test_ratio > 0 and total >= 7:
        test_count = max(1, test_count)

    while val_count + test_count >= total:
        if test_count > 0:
            test_count -= 1
        elif val_count > 0:
            val_count -= 1

    return {
        "train": total - val_count - test_count,
        "val": val_count,
        "test": test_count,
    }


def split_videos(
    videos: Sequence[Path],
    val_ratio: float,
    test_ratio: float,
    random_generator: random.Random,
) -> List[Tuple[str, Path]]:
    shuffled = list(videos)
    random_generator.shuffle(shuffled)
    counts = calculate_split_counts(len(shuffled), val_ratio, test_ratio)

    assignments: List[Tuple[str, Path]] = []
    position = 0
    for split in SPLITS:
        end = position + counts[split]
        assignments.extend((split, video) for video in shuffled[position:end])
        position = end
    return assignments


def safe_filename_prefix(class_name: str) -> str:
    return normalize_class_key(class_name).replace(" ", "_")


def organize_new_videos(
    source_root: Path,
    dataset_root: Path,
    val_ratio: float = 0.20,
    test_ratio: float = 0.0,
    seed: int = 42,
    move_files: bool = False,
    dry_run: bool = False,
) -> Counter:
    if not source_root.exists() or not source_root.is_dir():
        raise FileNotFoundError(f"Pasta de vídeos novos não encontrada: {source_root}")
    if val_ratio < 0 or test_ratio < 0 or val_ratio + test_ratio >= 1:
        raise ValueError("As proporções de validação e teste devem ser positivas e somar menos que 1.")

    class_folders = sorted(folder for folder in source_root.iterdir() if folder.is_dir())
    if not class_folders:
        raise RuntimeError(
            "Nenhuma pasta de classe encontrada. Use a estrutura <origem>/<palavra>/<vídeos>."
        )

    existing_classes = discover_existing_classes(dataset_root)
    random_generator = random.Random(seed)
    summary: Counter = Counter()
    total_source_videos = sum(len(list_videos(folder)) for folder in class_folders)
    inspected_videos = 0

    for source_class in class_folders:
        class_key = normalize_class_key(source_class.name)
        if not class_key:
            print(f"[AVISO] Nome de classe inválido, ignorando: {source_class.name}")
            continue
        class_name = existing_classes.get(class_key, class_key)
        videos = list_videos(source_class)
        if not videos:
            print(f"[AVISO] Nenhum vídeo em: {source_class}")
            continue

        known_hashes = existing_hashes(dataset_root, class_name)
        unique_videos: List[Path] = []
        batch_hashes: set[str] = set()
        for video in videos:
            digest = file_sha256(video)
            if digest in known_hashes or digest in batch_hashes:
                if dry_run:
                    print(f"[IGNORADO] Vídeo duplicado: {video.name}")
                summary["duplicados"] += 1
                inspected_videos += 1
                if not dry_run:
                    print_progress("Organizando vídeos", inspected_videos, total_source_videos)
                continue
            batch_hashes.add(digest)
            unique_videos.append(video)

        if not unique_videos:
            continue

        assignments = split_videos(unique_videos, val_ratio, test_ratio, random_generator)
        next_index = next_class_index(dataset_root, class_name)
        prefix = safe_filename_prefix(class_name)

        print(f"\nClasse: {source_class.name} -> {class_name}")
        print(f"Novos vídeos: {len(unique_videos)}")

        for split, source_video in assignments:
            destination_folder = dataset_root / split / class_name
            destination_name = f"{prefix}_{next_index:04d}{source_video.suffix.lower()}"
            destination = destination_folder / destination_name
            next_index += 1

            if dry_run:
                print(f"[{split}] {source_video.name} -> {destination}")
            summary[split] += 1
            summary["adicionados"] += 1

            if dry_run:
                continue

            destination_folder.mkdir(parents=True, exist_ok=True)
            if move_files:
                shutil.move(str(source_video), str(destination))
            else:
                shutil.copy2(source_video, destination)
            inspected_videos += 1
            print_progress("Organizando vídeos", inspected_videos, total_source_videos)

    return summary


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Adiciona vídeos novos ao dataset sem sobrescrever os existentes."
    )
    parser.add_argument(
        "--source-root",
        type=Path,
        required=True,
        help="Pasta com subpastas por palavra, por exemplo novos_videos/hospital/*.mp4.",
    )
    parser.add_argument(
        "--dataset-root",
        type=Path,
        default=Path("dataset") / "raw",
        help="Raiz do dataset organizado (default: dataset/raw).",
    )
    parser.add_argument("--val-ratio", type=float, default=0.20)
    parser.add_argument(
        "--test-ratio",
        type=float,
        default=0.0,
        help="O padrão mantém o conjunto de teste atual intacto.",
    )
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--move", action="store_true", help="Move em vez de copiar os vídeos.")
    parser.add_argument("--dry-run", action="store_true", help="Mostra as alterações sem copiar.")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    summary = organize_new_videos(
        source_root=args.source_root,
        dataset_root=args.dataset_root,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio,
        seed=args.seed,
        move_files=args.move,
        dry_run=args.dry_run,
    )

    mode = "SIMULAÇÃO" if args.dry_run else "CONCLUÍDO"
    print(f"\n{mode}")
    print(
        f"Adicionados: {summary['adicionados']} | "
        f"train: {summary['train']} | val: {summary['val']} | test: {summary['test']} | "
        f"duplicados ignorados: {summary['duplicados']}"
    )


if __name__ == "__main__":
    main()
