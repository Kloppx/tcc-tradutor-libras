"""Calibrate model confidence and choose a rejection threshold on validation data."""

import argparse
import json
from pathlib import Path

import numpy as np
from scipy.optimize import minimize_scalar
from tensorflow.keras.models import load_model


def calibrated_probabilities(probabilities, temperature):
    probabilities = np.clip(probabilities, 1e-7, 1.0)
    logits = np.log(probabilities) / temperature
    logits -= logits.max(axis=1, keepdims=True)
    exp_logits = np.exp(logits)
    return exp_logits / exp_logits.sum(axis=1, keepdims=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-path', default='models/melhor_modelo_v2.keras')
    parser.add_argument('--processed-path', default='data/processed')
    parser.add_argument('--output', default='models/inference_config_v2.json')
    parser.add_argument('--target-precision', type=float, default=0.90)
    parser.add_argument('--margin-threshold', type=float, default=0.15)
    args = parser.parse_args()

    processed = Path(args.processed_path)
    x_val = np.load(processed / 'X_val.npy')
    y_val = np.argmax(np.load(processed / 'y_val.npy'), axis=1)
    model = load_model(args.model_path)
    probabilities = np.clip(model.predict(x_val, verbose=0), 1e-7, 1.0)

    def negative_log_likelihood(temperature):
        calibrated = calibrated_probabilities(probabilities, temperature)
        return float(-np.log(calibrated[np.arange(len(y_val)), y_val]).mean())

    result = minimize_scalar(negative_log_likelihood, bounds=(0.5, 10.0), method='bounded')
    temperature = float(result.x)
    calibrated = calibrated_probabilities(probabilities, temperature)
    order = np.argsort(calibrated, axis=1)[:, ::-1]
    predictions = order[:, 0]
    confidence = calibrated[np.arange(len(y_val)), predictions]
    margin = confidence - calibrated[np.arange(len(y_val)), order[:, 1]]
    correct = predictions == y_val

    candidates = []
    for threshold in np.arange(0.40, 0.951, 0.01):
        accepted = (confidence >= threshold) & (margin >= args.margin_threshold)
        if not accepted.any():
            continue
        precision = float(correct[accepted].mean())
        coverage = float(accepted.mean())
        if precision >= args.target_precision:
            candidates.append((coverage, precision, float(threshold)))

    if candidates:
        coverage, accepted_precision, threshold = max(candidates)
    else:
        threshold = 0.75
        accepted = (confidence >= threshold) & (margin >= args.margin_threshold)
        coverage = float(accepted.mean())
        accepted_precision = float(correct[accepted].mean()) if accepted.any() else 0.0

    config = {
        'temperature': round(temperature, 6),
        'confidence_threshold': round(threshold, 2),
        'margin_threshold': args.margin_threshold,
        'validation_accuracy': round(float(correct.mean()), 6),
        'validation_accepted_accuracy': round(accepted_precision, 6),
        'validation_coverage': round(coverage, 6),
        'target_precision': args.target_precision,
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(config, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(config, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
