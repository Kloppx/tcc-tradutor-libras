import argparse
import csv
import os
from pathlib import Path

import numpy as np
from tensorflow.keras.models import load_model


DEFAULT_PROCESSED = Path("data") / "processed"
DEFAULT_MODELS = Path("models")
DEFAULT_REPORTS = Path("reports")


def load_artifacts(processed_path: Path):
    x_test = np.load(processed_path / "X_test.npy")
    y_test = np.load(processed_path / "y_test.npy")
    classes_path = processed_path / "classes.npy"

    if classes_path.exists():
        classes = np.load(classes_path, allow_pickle=True).tolist()
    else:
        classes = [f"classe_{idx}" for idx in range(y_test.shape[1])]

    return x_test, y_test, classes


def confusion_matrix(y_true, y_pred, num_classes):
    matrix = np.zeros((num_classes, num_classes), dtype=int)
    for true_label, pred_label in zip(y_true, y_pred):
        matrix[true_label, pred_label] += 1
    return matrix


def format_percentage(value):
    return f"{value * 100:.2f}%"


def classification_report_from_matrix(matrix, class_names):
    rows = []
    total = matrix.sum()
    accuracy = np.trace(matrix) / total if total else 0.0

    for idx, class_name in enumerate(class_names):
        tp = matrix[idx, idx]
        fp = matrix[:, idx].sum() - tp
        fn = matrix[idx, :].sum() - tp
        support = matrix[idx, :].sum()

        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

        rows.append(
            {
                "class": class_name,
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "support": int(support),
            }
        )

    macro_precision = float(np.mean([row["precision"] for row in rows])) if rows else 0.0
    macro_recall = float(np.mean([row["recall"] for row in rows])) if rows else 0.0
    macro_f1 = float(np.mean([row["f1"] for row in rows])) if rows else 0.0

    weighted_precision = 0.0
    weighted_recall = 0.0
    weighted_f1 = 0.0
    if rows and total:
        weighted_precision = float(sum(row["precision"] * row["support"] for row in rows) / total)
        weighted_recall = float(sum(row["recall"] * row["support"] for row in rows) / total)
        weighted_f1 = float(sum(row["f1"] * row["support"] for row in rows) / total)

    summary = {
        "accuracy": accuracy,
        "macro_precision": macro_precision,
        "macro_recall": macro_recall,
        "macro_f1": macro_f1,
        "weighted_precision": weighted_precision,
        "weighted_recall": weighted_recall,
        "weighted_f1": weighted_f1,
    }
    return rows, summary


def print_confusion_matrix(matrix, class_names):
    header = ["true\\pred"] + class_names
    print("\nMatriz de confusao:")
    print(" | ".join(f"{item:>12}" for item in header))
    print("-" * (15 * len(header)))
    for class_name, row in zip(class_names, matrix):
        print(" | ".join([f"{class_name:>12}"] + [f"{int(val):>12}" for val in row]))


def print_report(rows, summary):
    print("\nRelatorio por classe:")
    print(f"{'Classe':>14} | {'Precision':>10} | {'Recall':>10} | {'F1':>10} | {'Support':>8}")
    print("-" * 66)
    for row in rows:
        print(
            f"{row['class']:>14} | {format_percentage(row['precision']):>10} | {format_percentage(row['recall']):>10} | {format_percentage(row['f1']):>10} | {row['support']:>8}"
        )

    print("\nResumo geral:")
    print(f"Accuracy: {format_percentage(summary['accuracy'])}")
    print(f"Macro avg precision: {format_percentage(summary['macro_precision'])}")
    print(f"Macro avg recall: {format_percentage(summary['macro_recall'])}")
    print(f"Macro avg F1: {format_percentage(summary['macro_f1'])}")
    print(f"Weighted avg precision: {format_percentage(summary['weighted_precision'])}")
    print(f"Weighted avg recall: {format_percentage(summary['weighted_recall'])}")
    print(f"Weighted avg F1: {format_percentage(summary['weighted_f1'])}")


def save_reports(report_dir: Path, matrix, class_names, rows, summary):
    report_dir.mkdir(parents=True, exist_ok=True)

    csv_path = report_dir / "classification_report.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["class", "precision", "recall", "f1", "support"],
        )
        writer.writeheader()
        writer.writerows(rows)

    matrix_path = report_dir / "confusion_matrix.csv"
    with matrix_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["true\\pred"] + class_names)
        for class_name, row in zip(class_names, matrix):
            writer.writerow([class_name] + row.tolist())

    summary_path = report_dir / "evaluation_summary.txt"
    with summary_path.open("w", encoding="utf-8") as fh:
        fh.write(f"Accuracy: {format_percentage(summary['accuracy'])}\n")
        fh.write(f"Macro avg precision: {format_percentage(summary['macro_precision'])}\n")
        fh.write(f"Macro avg recall: {format_percentage(summary['macro_recall'])}\n")
        fh.write(f"Macro avg F1: {format_percentage(summary['macro_f1'])}\n")
        fh.write(f"Weighted avg precision: {format_percentage(summary['weighted_precision'])}\n")
        fh.write(f"Weighted avg recall: {format_percentage(summary['weighted_recall'])}\n")
        fh.write(f"Weighted avg F1: {format_percentage(summary['weighted_f1'])}\n")


def build_parser():
    parser = argparse.ArgumentParser(description="Avalia o modelo treinado com matriz de confusao e relatorio por classe.")
    parser.add_argument(
        "--model-path",
        default=str(DEFAULT_MODELS / "melhor_modelo.keras"),
        help="Caminho do modelo para avaliacao.",
    )
    parser.add_argument(
        "--processed-path",
        default=str(DEFAULT_PROCESSED),
        help="Pasta com os arrays processados (.npy).",
    )
    parser.add_argument(
        "--report-dir",
        default=str(DEFAULT_REPORTS),
        help="Pasta onde os relatorios serao salvos.",
    )
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    model_path = Path(args.model_path)
    processed_path = Path(args.processed_path)
    report_dir = Path(args.report_dir)

    if not model_path.exists():
        raise FileNotFoundError(f"Modelo nao encontrado: {model_path}")
    if not processed_path.exists():
        raise FileNotFoundError(f"Pasta processed nao encontrada: {processed_path}")

    print(f"Carregando modelo: {model_path}")
    model = load_model(model_path)

    print(f"Carregando dados de teste: {processed_path}")
    x_test, y_test, class_names = load_artifacts(processed_path)

    if len(x_test) == 0:
        raise RuntimeError("X_test vazio. Nao ha dados para avaliacao.")

    y_true = np.argmax(y_test, axis=1)
    y_prob = model.predict(x_test, verbose=0)
    y_pred = np.argmax(y_prob, axis=1)

    matrix = confusion_matrix(y_true, y_pred, len(class_names))
    rows, summary = classification_report_from_matrix(matrix, class_names)

    print(f"\nClasses: {class_names}")
    print_confusion_matrix(matrix, class_names)
    print_report(rows, summary)

    save_reports(report_dir, matrix, class_names, rows, summary)
    print(f"\nRelatorios salvos em: {report_dir}")


if __name__ == "__main__":
    main()
