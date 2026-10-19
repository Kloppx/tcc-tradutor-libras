#!/usr/bin/env python3
"""Executa a inclusão incremental de vídeos e o treinamento completo do modelo."""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import List, Optional, Sequence, Tuple


Command = Tuple[Sequence[str], str]


def run_commands(steps: List[Command]) -> bool:
    total_steps = len(steps)
    for step_index, (command, message) in enumerate(steps, start=1):
        print(f"\n[ETAPA {step_index}/{total_steps}] {message}")
        print("=" * 70)
        print("Comando:", " ".join(str(part) for part in command))
        result = subprocess.run(command, cwd=".")
        if result.returncode != 0:
            print(f"\nERRO ao executar: {' '.join(str(part) for part in command)}")
            return False
    return True


def preparation_steps(new_videos: Optional[Path]) -> List[Command]:
    steps: List[Command] = []
    if new_videos is not None:
        steps.append(
            (
                [
                    sys.executable,
                    "scripts/organize_new_videos.py",
                    "--source-root",
                    str(new_videos),
                ],
                "Adicionando somente os vídeos novos ao dataset...",
            )
        )
        steps.append(
            (
                [
                    sys.executable,
                    "scripts/trim_dataset_videos.py",
                    "--input-root",
                    "dataset/raw",
                    "--output-root",
                    "dataset/trimmed/raw",
                    "--recursive",
                ],
                "Recortando somente os vídeos que ainda não foram tratados...",
            )
        )

    steps.extend(
        [
            (
                [
                    sys.executable,
                    "src/feature_extraction.py",
                    "--raw-root",
                    "dataset/trimmed/raw",
                    "--export-root",
                    "data/features",
                ],
                "Extraindo MediaPipe somente dos vídeos sem features...",
            ),
            ([sys.executable, "src/preprocess_data.py"], "Recompondo os arrays com todo o histórico..."),
        ]
    )
    return steps


def training_steps(report_dir: Path) -> List[Command]:
    return [
        ([sys.executable, "src/train_v2.py"], "Treinando o modelo v2 com todas as classes..."),
        ([sys.executable, "scripts/calibrate_model.py"], "Calibrando a confiança do modelo..."),
        (
            [
                sys.executable,
                "scripts/evaluate_model.py",
                "--model-path",
                "models/melhor_modelo_v2.keras",
                "--report-dir",
                str(report_dir),
            ],
            "Avaliando o novo modelo...",
        ),
    ]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Adiciona vídeos novos sem sobrescrever o dataset e treina novamente o modelo."
    )
    parser.add_argument(
        "--new-videos",
        type=Path,
        help="Pasta com subpastas por palavra. Se omitida, usa o dataset já organizado.",
    )
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=Path("reports") / "latest",
        help="Pasta dos relatórios do novo treinamento.",
    )
    parser.add_argument(
        "--prepare-only",
        action="store_true",
        help="Organiza, recorta e processa os dados, mas não inicia o treinamento.",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()

    steps = preparation_steps(args.new_videos)
    if args.prepare_only:
        if not run_commands(steps):
            raise SystemExit(1)
        print("\nPreparação concluída. O treinamento não foi iniciado.")
        return

    steps.extend(training_steps(args.report_dir))
    if not run_commands(steps):
        raise SystemExit(1)

    print("\nPipeline concluído com sucesso.")


if __name__ == "__main__":
    main()
