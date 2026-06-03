import argparse
import csv
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, Optional


def slugify(text: str) -> str:
    """Converts label text to a safe folder name."""
    text = text.strip().lower()
    text = re.sub(r"\s+", "_", text)
    text = re.sub(r"[^a-z0-9_-]", "", text)
    return text or "sem_rotulo"


def ensure_gdown():
    try:
        import gdown  # type: ignore

        return gdown
    except ImportError as exc:
        raise RuntimeError(
            "Dependencia faltando: gdown. Rode 'pip install gdown' e tente de novo."
        ) from exc


def ensure_dirs(dataset_root: Path) -> Dict[str, Path]:
    raw_dir = dataset_root / "raw"
    metadata_dir = dataset_root / "metadata"
    raw_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)
    return {
        "raw": raw_dir,
        "metadata": metadata_dir,
    }


def init_log_file(log_path: Path) -> None:
    if log_path.exists():
        return

    with log_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "downloaded_at",
                "label",
                "signer",
                "split",
                "source_url",
                "local_path",
                "status",
                "error",
            ],
        )
        writer.writeheader()


def append_log(log_path: Path, row: Dict[str, str]) -> None:
    with log_path.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "downloaded_at",
                "label",
                "signer",
                "split",
                "source_url",
                "local_path",
                "status",
                "error",
            ],
        )
        writer.writerow(row)


def infer_kind(url: str) -> str:
    if "drive.google.com/drive/folders/" in url:
        return "folder"
    return "file"


def download_file(
    gdown,
    url: str,
    output_path: Path,
) -> Optional[str]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    return gdown.download(
        url=url,
        output=str(output_path),
        quiet=False,
        fuzzy=True,
    )


def download_folder(
    gdown,
    url: str,
    output_dir: Path,
) -> Optional[Iterable[str]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    return gdown.download_folder(
        url=url,
        output=str(output_dir),
        quiet=False,
        use_cookies=False,
        remaining_ok=True,
    )


def run_single_url(args) -> None:
    gdown = ensure_gdown()
    dirs = ensure_dirs(args.dataset_root)
    log_path = dirs["metadata"] / "download_log.csv"
    init_log_file(log_path)

    label_slug = slugify(args.label)
    target_dir = dirs["raw"] / label_slug
    target_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = args.filename or f"{label_slug}_{timestamp}.mp4"

    local_path = ""
    status = "ok"
    error = ""

    try:
        kind = infer_kind(args.url)
        if kind == "folder":
            folder_path = target_dir / f"folder_{timestamp}"
            result = download_folder(gdown, args.url, folder_path)
            if not result:
                raise RuntimeError("Download da pasta retornou vazio.")
            local_path = str(folder_path)
        else:
            output_path = target_dir / file_name
            result = download_file(gdown, args.url, output_path)
            if not result:
                raise RuntimeError("Download do arquivo falhou.")
            local_path = str(output_path)
    except Exception as exc:  # broad except to always persist log
        status = "error"
        error = str(exc)

    append_log(
        log_path,
        {
            "downloaded_at": datetime.now().isoformat(timespec="seconds"),
            "label": args.label,
            "signer": args.signer,
            "split": args.split,
            "source_url": args.url,
            "local_path": local_path,
            "status": status,
            "error": error,
        },
    )

    if status == "error":
        raise RuntimeError(f"Falha no download: {error}")

    print(f"Download concluido: {local_path}")
    print(f"Log atualizado em: {log_path}")


def read_manifest(path: Path) -> Iterable[Dict[str, str]]:
    with path.open("r", newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            yield {
                "label": (row.get("label") or "").strip(),
                "source_url": (row.get("source_url") or "").strip(),
                "signer": (row.get("signer") or "").strip(),
                "split": (row.get("split") or "").strip() or "train",
                "filename": (row.get("filename") or "").strip(),
            }


def run_manifest(args) -> None:
    gdown = ensure_gdown()
    dirs = ensure_dirs(args.dataset_root)
    log_path = dirs["metadata"] / "download_log.csv"
    init_log_file(log_path)

    rows = list(read_manifest(args.manifest))
    if not rows:
        raise RuntimeError("Manifest vazio. Nada para baixar.")

    print(f"Total de linhas no manifest: {len(rows)}")

    for idx, row in enumerate(rows, start=1):
        label = row["label"]
        url = row["source_url"]
        signer = row["signer"]
        split = row["split"]
        filename = row["filename"]

        if not label or not url:
            append_log(
                log_path,
                {
                    "downloaded_at": datetime.now().isoformat(timespec="seconds"),
                    "label": label,
                    "signer": signer,
                    "split": split,
                    "source_url": url,
                    "local_path": "",
                    "status": "error",
                    "error": "Linha sem label ou source_url.",
                },
            )
            print(f"[{idx}] Linha ignorada por falta de dados.")
            continue

        label_slug = slugify(label)
        target_dir = dirs["raw"] / label_slug
        target_dir.mkdir(parents=True, exist_ok=True)

        local_path = ""
        status = "ok"
        error = ""

        try:
            kind = infer_kind(url)
            if kind == "folder":
                folder_path = target_dir / f"folder_{idx:04d}"
                result = download_folder(gdown, url, folder_path)
                if not result:
                    raise RuntimeError("Download da pasta retornou vazio.")
                local_path = str(folder_path)
            else:
                default_name = f"{label_slug}_{idx:04d}.mp4"
                output_path = target_dir / (filename or default_name)
                result = download_file(gdown, url, output_path)
                if not result:
                    raise RuntimeError("Download do arquivo falhou.")
                local_path = str(output_path)

            print(f"[{idx}] OK - {label}")
        except Exception as exc:  # broad except to continue processing manifest
            status = "error"
            error = str(exc)
            print(f"[{idx}] ERRO - {label}: {error}")

        append_log(
            log_path,
            {
                "downloaded_at": datetime.now().isoformat(timespec="seconds"),
                "label": label,
                "signer": signer,
                "split": split,
                "source_url": url,
                "local_path": local_path,
                "status": status,
                "error": error,
            },
        )

    print(f"Processo finalizado. Veja o log em: {log_path}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Baixa videos do Google Drive para o dataset local."
    )
    parser.add_argument(
        "--dataset-root",
        type=Path,
        default=Path("dataset"),
        help="Pasta raiz do dataset local (default: dataset).",
    )

    subparsers = parser.add_subparsers(dest="mode", required=True)

    single = subparsers.add_parser("single", help="Baixar um arquivo/pasta por URL.")
    single.add_argument("--url", required=True, help="URL compartilhada do Drive.")
    single.add_argument("--label", required=True, help="Rotulo da classe (ex: dor_cabeca).")
    single.add_argument("--signer", default="", help="Nome/codigo do sinalizante.")
    single.add_argument(
        "--split",
        default="train",
        choices=["train", "val", "test"],
        help="Particao desejada para esse item.",
    )
    single.add_argument(
        "--filename",
        default="",
        help="Nome do arquivo de saida para downloads de arquivo.",
    )
    single.set_defaults(handler=run_single_url)

    manifest = subparsers.add_parser(
        "manifest", help="Baixar em lote usando CSV de manifest."
    )
    manifest.add_argument(
        "--manifest",
        type=Path,
        required=True,
        help="CSV com colunas: label,source_url,signer,split,filename",
    )
    manifest.set_defaults(handler=run_manifest)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
