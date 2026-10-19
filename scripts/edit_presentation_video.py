"""Create a concise presentation cut from the recorded mobile demo."""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2


SEGMENTS = [
    # Start on a clean home screen captured at the end of the recording.
    {"kind": "freeze", "at": 24.5, "duration": 2.0},
    # AI analysis and the successful HOSPITAL prediction.
    {"kind": "clip", "start": 18.0, "end": 23.5, "speed": 1.0},
    {"kind": "freeze", "at": 22.5, "duration": 2.0},
    # Patient flow: reception, registration and generated ticket.
    {"kind": "clip", "start": 24.5, "end": 32.0, "speed": 1.0},
    {"kind": "clip", "start": 32.0, "end": 68.0, "speed": 5.0, "label": "PREENCHIMENTO ACELERADO 5x"},
    {"kind": "clip", "start": 68.0, "end": 73.0, "speed": 1.0},
    # Nursing flow, omitting the failed login and password-manager popup.
    {"kind": "clip", "start": 95.5, "end": 98.0, "speed": 1.0},
    {"kind": "clip", "start": 97.0, "end": 132.0, "speed": 4.0, "label": "TRIAGEM ACELERADA 4x"},
    {"kind": "clip", "start": 132.0, "end": 136.0, "speed": 1.0},
    # Medical flow, excluding test text and the exit dialog.
    {"kind": "clip", "start": 154.5, "end": 157.0, "speed": 1.0},
    # Finish on the application home screen.
    {"kind": "freeze", "at": 24.5, "duration": 3.0},
]


def add_speed_label(frame, label: str):
    font = cv2.FONT_HERSHEY_SIMPLEX
    scale = 0.46
    thickness = 1
    (text_width, text_height), baseline = cv2.getTextSize(label, font, scale, thickness)
    padding_x = 10
    padding_y = 7
    x = frame.shape[1] - text_width - (padding_x * 2) - 10
    y = 52
    overlay = frame.copy()
    cv2.rectangle(
        overlay,
        (x, y),
        (x + text_width + padding_x * 2, y + text_height + padding_y * 2 + baseline),
        (10, 35, 55),
        -1,
    )
    cv2.addWeighted(overlay, 0.82, frame, 0.18, 0, frame)
    cv2.putText(
        frame,
        label,
        (x + padding_x, y + padding_y + text_height),
        font,
        scale,
        (255, 255, 255),
        thickness,
        cv2.LINE_AA,
    )
    return frame


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    capture = cv2.VideoCapture(str(args.source))
    if not capture.isOpened():
        raise RuntimeError(f"Could not open {args.source}")

    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    source_fps = capture.get(cv2.CAP_PROP_FPS)
    output_fps = 30.0

    output_plan: list[tuple[int, str | None]] = []
    for segment in SEGMENTS:
        if segment["kind"] == "freeze":
            source_index = round(segment["at"] * source_fps)
            count = round(segment["duration"] * output_fps)
            output_plan.extend((source_index, None) for _ in range(count))
            continue

        start = segment["start"]
        end = segment["end"]
        speed = segment["speed"]
        label = segment.get("label")
        output_duration = (end - start) / speed
        count = round(output_duration * output_fps)
        for index in range(count):
            source_time = min(start + (index / output_fps) * speed, end - 0.001)
            output_plan.append((round(source_time * source_fps), label))

    needed_indices = {source_index for source_index, _ in output_plan}
    last_needed_index = max(needed_indices)
    encoded_frames = {}
    source_index = 0
    while source_index <= last_needed_index:
        ok, frame = capture.read()
        if not ok:
            raise RuntimeError(f"Source ended unexpectedly at frame {source_index}")
        if source_index in needed_indices:
            encoded_ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 96])
            if not encoded_ok:
                raise RuntimeError(f"Could not cache source frame {source_index}")
            encoded_frames[source_index] = encoded
        source_index += 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(args.output),
        cv2.VideoWriter_fourcc(*"mp4v"),
        output_fps,
        (width, height),
    )
    if not writer.isOpened():
        capture.release()
        raise RuntimeError(f"Could not create {args.output}")

    written_frames = 0
    try:
        for source_index, label in output_plan:
            frame = cv2.imdecode(encoded_frames[source_index], cv2.IMREAD_COLOR)
            if label:
                frame = add_speed_label(frame, label)
            writer.write(frame)
            written_frames += 1
    finally:
        writer.release()
        capture.release()

    print(f"Created: {args.output}")
    print(f"Duration: {written_frames / output_fps:.2f}s")
    print(f"Resolution: {width}x{height} at {output_fps:.0f} fps")


if __name__ == "__main__":
    main()
