import argparse
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np


VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}


def list_videos(root: Path, recursive: bool) -> List[Path]:
    if recursive:
        return [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in VIDEO_EXTS]
    return [p for p in root.iterdir() if p.is_file() and p.suffix.lower() in VIDEO_EXTS]


def smooth_signal(signal: np.ndarray, window: int) -> np.ndarray:
    if len(signal) == 0:
        return signal
    window = max(1, window)
    kernel = np.ones(window, dtype=np.float32) / window
    return np.convolve(signal, kernel, mode="same")


def extract_motion_signal(video_path: Path, resize_width: int = 320) -> Tuple[np.ndarray, float, int]:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return np.array([], dtype=np.float32), 0.0, 0

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0

    motion_scores = []
    prev_gray = None
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        h, w = frame.shape[:2]
        if w > resize_width:
            scale = resize_width / float(w)
            frame = cv2.resize(frame, (resize_width, int(h * scale)), interpolation=cv2.INTER_AREA)

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)

        if prev_gray is None:
            motion_scores.append(0.0)
        else:
            diff = cv2.absdiff(gray, prev_gray)
            motion_scores.append(float(np.mean(diff)))

        prev_gray = gray

    cap.release()
    return np.array(motion_scores, dtype=np.float32), float(fps), frame_count


def find_segments(
    signal: np.ndarray,
    fps: float,
    threshold_percentile: float,
    min_duration_s: float,
    max_duration_s: float,
    min_gap_s: float,
    pad_s: float,
) -> List[Tuple[int, int]]:
    if len(signal) == 0:
        return []

    smooth_win = max(3, int(0.15 * fps))
    smoothed = smooth_signal(signal, smooth_win)

    threshold = float(np.percentile(smoothed, threshold_percentile))
    active = smoothed >= threshold

    min_frames = max(1, int(min_duration_s * fps))
    max_frames = max(min_frames, int(max_duration_s * fps))
    min_gap = max(1, int(min_gap_s * fps))
    pad = int(pad_s * fps)

    raw_segments = []
    start = None
    for i, is_active in enumerate(active):
        if is_active and start is None:
            start = i
        elif not is_active and start is not None:
            raw_segments.append((start, i - 1))
            start = None
    if start is not None:
        raw_segments.append((start, len(active) - 1))

    filtered = []
    for s, e in raw_segments:
        if (e - s + 1) >= min_frames:
            filtered.append((s, e))

    if not filtered:
        return []

    merged = [filtered[0]]
    for s, e in filtered[1:]:
        last_s, last_e = merged[-1]
        if s - last_e <= min_gap:
            merged[-1] = (last_s, e)
        else:
            merged.append((s, e))

    clipped = []
    for s, e in merged:
        s = max(0, s - pad)
        e = min(len(signal) - 1, e + pad)
        seg_len = e - s + 1

        if seg_len <= max_frames:
            clipped.append((s, e))
            continue

        chunk_start = s
        while chunk_start <= e:
            chunk_end = min(e, chunk_start + max_frames - 1)
            if (chunk_end - chunk_start + 1) >= min_frames:
                clipped.append((chunk_start, chunk_end))
            chunk_start = chunk_end + 1

    return clipped


def top_motion_windows(
    signal: np.ndarray,
    fps: float,
    window_s: float,
    max_windows: int,
) -> List[Tuple[int, int]]:
    if len(signal) == 0:
        return []

    win = max(1, int(window_s * fps))
    if win >= len(signal):
        return [(0, len(signal) - 1)]

    smoothed = smooth_signal(signal, max(3, int(0.12 * fps)))
    cumulative = np.cumsum(np.insert(smoothed, 0, 0.0))

    candidates = []
    for start in range(0, len(smoothed) - win + 1):
        end = start + win - 1
        score = cumulative[end + 1] - cumulative[start]
        candidates.append((float(score), start, end))

    candidates.sort(key=lambda x: x[0], reverse=True)

    selected = []
    for _, s, e in candidates:
        overlaps = False
        for ss, ee in selected:
            if not (e < ss or s > ee):
                overlaps = True
                break
        if not overlaps:
            selected.append((s, e))
        if len(selected) >= max_windows:
            break

    selected.sort(key=lambda t: t[0])
    return selected


def write_segment(
    src_video: Path,
    dst_video: Path,
    start_frame: int,
    end_frame: int,
) -> None:
    cap = cv2.VideoCapture(str(src_video))
    if not cap.isOpened():
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    dst_video.parent.mkdir(parents=True, exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(dst_video), fourcc, fps, (width, height))

    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx > end_frame:
            break

        if start_frame <= frame_idx <= end_frame:
            writer.write(frame)

        frame_idx += 1

    writer.release()
    cap.release()


def process_video(
    video_path: Path,
    input_root: Path,
    output_root: Path,
    threshold_percentile: float,
    min_duration_s: float,
    max_duration_s: float,
    min_gap_s: float,
    pad_s: float,
    fallback_window_s: float,
    fallback_max_windows: int,
    dry_run: bool,
) -> int:
    signal, fps, total_frames = extract_motion_signal(video_path)
    if total_frames == 0:
        print(f"[SKIP] {video_path} (nao foi possivel ler)")
        return 0

    segments = find_segments(
        signal=signal,
        fps=fps,
        threshold_percentile=threshold_percentile,
        min_duration_s=min_duration_s,
        max_duration_s=max_duration_s,
        min_gap_s=min_gap_s,
        pad_s=pad_s,
    )

    if not segments:
        segments = top_motion_windows(
            signal=signal,
            fps=fps,
            window_s=fallback_window_s,
            max_windows=fallback_max_windows,
        )

    rel_parent = video_path.parent.relative_to(input_root)
    stem = video_path.stem

    print(f"\nVideo: {video_path}")
    print(f"FPS: {fps:.2f} | Frames: {total_frames} | Segmentos: {len(segments)}")

    if not segments:
        print("- Nenhum segmento detectado com os parametros atuais.")
        return 0

    for idx, (s, e) in enumerate(segments, start=1):
        out_name = f"{stem}_seg_{idx:02d}.mp4"
        out_path = output_root / rel_parent / out_name
        start_s = s / fps
        end_s = e / fps
        print(f"- {out_name} | frames {s}-{e} | tempo {start_s:.2f}s-{end_s:.2f}s")

        if not dry_run:
            write_segment(video_path, out_path, s, e)

    return len(segments)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Recorta automaticamente segmentos com movimento relevante em videos de Libras."
    )
    parser.add_argument("--input-root", type=Path, required=True, help="Pasta raiz de videos.")
    parser.add_argument(
        "--output-root",
        type=Path,
        default=Path("dataset") / "trimmed" / "raw",
        help="Pasta de saida para os recortes.",
    )
    parser.add_argument("--recursive", action="store_true", help="Percorre subpastas.")
    parser.add_argument("--dry-run", action="store_true", help="Somente previsualiza cortes.")
    parser.add_argument(
        "--threshold-percentile",
        type=float,
        default=75.0,
        help="Percentil do sinal de movimento usado como limiar (default: 75).",
    )
    parser.add_argument(
        "--min-duration",
        type=float,
        default=0.7,
        help="Duracao minima de segmento em segundos (default: 0.7).",
    )
    parser.add_argument(
        "--max-duration",
        type=float,
        default=3.0,
        help="Duracao maxima por segmento em segundos (default: 3.0).",
    )
    parser.add_argument(
        "--min-gap",
        type=float,
        default=0.25,
        help="Gap maximo para mesclar segmentos vizinhos em segundos (default: 0.25).",
    )
    parser.add_argument(
        "--pad",
        type=float,
        default=0.2,
        help="Padding em segundos adicionado no inicio/fim de cada segmento (default: 0.2).",
    )
    parser.add_argument(
        "--fallback-window",
        type=float,
        default=1.8,
        help="Duracao em segundos da janela fallback quando nao houver segmento (default: 1.8).",
    )
    parser.add_argument(
        "--fallback-max-windows",
        type=int,
        default=2,
        help="Numero maximo de janelas fallback por video (default: 2).",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if not args.input_root.exists() or not args.input_root.is_dir():
        raise FileNotFoundError(f"Pasta de entrada nao encontrada: {args.input_root}")

    videos = list_videos(args.input_root, args.recursive)
    if not videos:
        print("Nenhum video encontrado.")
        return

    print(f"Total de videos encontrados: {len(videos)}")

    total_segments = 0
    for video in sorted(videos):
        total_segments += process_video(
            video_path=video,
            input_root=args.input_root,
            output_root=args.output_root,
            threshold_percentile=args.threshold_percentile,
            min_duration_s=args.min_duration,
            max_duration_s=args.max_duration,
            min_gap_s=args.min_gap,
            pad_s=args.pad,
            fallback_window_s=args.fallback_window,
            fallback_max_windows=args.fallback_max_windows,
            dry_run=args.dry_run,
        )

    if args.dry_run:
        print(f"\nDry-run: {total_segments} segmentos seriam gerados.")
    else:
        print(f"\nConcluido: {total_segments} segmentos gerados em {args.output_root}")


if __name__ == "__main__":
    main()
