import argparse
import re
from pathlib import Path
from typing import List


def extract_first_number(text: str) -> int:
    match = re.search(r"(\d+)", text)
    if match:
        return int(match.group(1))
    return 10**9


def list_video_files(folder: Path) -> List[Path]:
    allowed_ext = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    files = [
        p
        for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in allowed_ext and not p.name.startswith(".")
    ]
    files.sort(key=lambda p: (extract_first_number(p.stem), p.name.lower()))
    return files


def normalize_prefix(prefix: str) -> str:
    prefix = prefix.strip().lower().replace(" ", "_")
    prefix = re.sub(r"[^a-z0-9_-]", "", prefix)
    if not prefix:
        raise ValueError("Prefixo invalido depois da normalizacao.")
    return prefix


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Renomeia videos em lote no formato <prefixo>_0001.ext"
    )
    parser.add_argument(
        "--folder",
        type=Path,
        required=True,
        help="Pasta com os videos a renomear (ou raiz para varredura recursiva).",
    )
    parser.add_argument(
        "--prefix",
        default="",
        help="Prefixo do nome final (ex: saude). Se omitido, usa nome da pasta.",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=1,
        help="Indice inicial da sequencia (default: 1).",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Percorre subpastas e renomeia cada pasta com videos usando o proprio nome como prefixo.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mostra as alteracoes sem renomear os arquivos.",
    )
    return parser


def rename_videos_in_folder(folder: Path, prefix: str, start: int, dry_run: bool) -> int:
    files = list_video_files(folder)
    if not files:
        return 0

    temp_names = []
    for i, file_path in enumerate(files, start=start):
        temp_name = f"__tmp_rename_{i:04d}{file_path.suffix.lower()}"
        temp_path = folder / temp_name
        temp_names.append((file_path, temp_path))

    final_names = []
    for i, (_, temp_path) in enumerate(temp_names, start=start):
        final_name = f"{prefix}_{i:04d}{temp_path.suffix.lower()}"
        final_path = folder / final_name
        final_names.append((temp_path, final_path))

    print(f"\nPasta: {folder}")
    print(f"Prefixo: {prefix}")
    print(f"Total de videos: {len(files)}")
    print("Preview da renomeacao:")
    for original, (_, final_path) in zip(files, final_names):
        print(f"- {original.name} -> {final_path.name}")

    if dry_run:
        return len(files)

    for original, temp_path in temp_names:
        original.rename(temp_path)

    for temp_path, final_path in final_names:
        temp_path.rename(final_path)

    return len(files)


def collect_target_folders(root_folder: Path, recursive: bool) -> List[Path]:
    if not recursive:
        return [root_folder]

    targets = []
    for folder in [root_folder] + [p for p in root_folder.rglob("*") if p.is_dir()]:
        if list_video_files(folder):
            targets.append(folder)
    return targets


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    folder: Path = args.folder
    if not folder.exists() or not folder.is_dir():
        raise FileNotFoundError(f"Pasta nao encontrada: {folder}")

    if args.start < 1:
        raise ValueError("--start deve ser maior ou igual a 1.")

    target_folders = collect_target_folders(folder, args.recursive)
    if not target_folders:
        print("Nenhum video encontrado para renomear.")
        return

    total_renamed = 0
    for target in target_folders:
        prefix_source = args.prefix if args.prefix else target.name
        prefix = normalize_prefix(prefix_source)
        total_renamed += rename_videos_in_folder(
            folder=target,
            prefix=prefix,
            start=args.start,
            dry_run=args.dry_run,
        )

    if args.dry_run:
        print(f"\nDry-run ativo: {total_renamed} videos seriam renomeados.")
        return

    print(f"\nRenomeacao concluida com sucesso. Total renomeado: {total_renamed}")


if __name__ == "__main__":
    main()
