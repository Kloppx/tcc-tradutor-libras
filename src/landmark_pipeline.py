"""Shared preparation utilities for MediaPipe pose and hand sequences.

The model consumes 45 frames with 258 values per frame:
33 pose landmarks (x, y, z, visibility) and 21 landmarks for each hand
(x, y, z). Keeping this transformation in one module prevents training and
inference from preparing the same gesture in different ways.
"""

from __future__ import annotations

import numpy as np


POSE_LANDMARKS = 33
HAND_LANDMARKS = 21
POSE_VALUES = POSE_LANDMARKS * 4
HAND_VALUES = HAND_LANDMARKS * 3
FEATURE_DIM = POSE_VALUES + 2 * HAND_VALUES
DEFAULT_SEQUENCE_LENGTH = 45

LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
MIN_BODY_SCALE = 1e-3


def _as_sequence(sequence: np.ndarray) -> np.ndarray:
    array = np.asarray(sequence, dtype=np.float32)
    if array.ndim != 2 or array.shape[1] != FEATURE_DIM:
        raise ValueError(
            f"Expected sequence with shape (frames, {FEATURE_DIM}), got {array.shape}."
        )
    if len(array) == 0:
        raise ValueError("Cannot prepare an empty landmark sequence.")
    return array


def normalize_keypoints(keypoints: np.ndarray) -> np.ndarray:
    """Normalize a frame relative to the shoulder midpoint and shoulder width.

    Image position and distance from the camera should not define the class.
    Pose visibility is preserved. Missing pose/hands remain zero so the model
    can still learn detection masks.
    """
    frame = np.asarray(keypoints, dtype=np.float32)
    if frame.shape != (FEATURE_DIM,):
        raise ValueError(f"Expected {FEATURE_DIM} keypoints, got {frame.shape}.")

    pose = frame[:POSE_VALUES].reshape(POSE_LANDMARKS, 4).copy()
    left_hand = frame[POSE_VALUES:POSE_VALUES + HAND_VALUES].reshape(HAND_LANDMARKS, 3).copy()
    right_hand = frame[POSE_VALUES + HAND_VALUES:].reshape(HAND_LANDMARKS, 3).copy()

    pose_present = np.any(np.abs(pose[:, :3]) > 1e-6)
    if pose_present:
        left_shoulder = pose[LEFT_SHOULDER, :3]
        right_shoulder = pose[RIGHT_SHOULDER, :3]
        center = (left_shoulder + right_shoulder) / 2.0
        scale = float(np.linalg.norm(left_shoulder[:2] - right_shoulder[:2]))
        if scale < MIN_BODY_SCALE:
            visible_xy = pose[np.any(np.abs(pose[:, :2]) > 1e-6, axis=1), :2]
            scale = float(np.ptp(visible_xy, axis=0).max()) if len(visible_xy) else 1.0
        scale = max(scale, MIN_BODY_SCALE)

        pose_mask = np.any(np.abs(pose[:, :3]) > 1e-6, axis=1)
        pose[pose_mask, :3] = (pose[pose_mask, :3] - center) / scale

        for hand in (left_hand, right_hand):
            hand_mask = np.any(np.abs(hand) > 1e-6, axis=1)
            if not np.any(hand_mask):
                continue
            wrist_z = float(hand[0, 2])
            hand[hand_mask, 0] = (hand[hand_mask, 0] - center[0]) / scale
            hand[hand_mask, 1] = (hand[hand_mask, 1] - center[1]) / scale
            hand[hand_mask, 2] = (hand[hand_mask, 2] - wrist_z) / scale

    return np.concatenate((pose.reshape(-1), left_hand.reshape(-1), right_hand.reshape(-1))).astype(np.float32)


def normalize_sequence(sequence: np.ndarray) -> np.ndarray:
    array = _as_sequence(sequence)
    return np.stack([normalize_keypoints(frame) for frame in array]).astype(np.float32)


def resample_sequence(sequence: np.ndarray, target_length: int = DEFAULT_SEQUENCE_LENGTH) -> np.ndarray:
    """Select frames uniformly over the complete gesture duration."""
    array = _as_sequence(sequence)
    if target_length <= 0:
        raise ValueError("target_length must be greater than zero.")
    if len(array) == target_length:
        return array.copy()

    indices = np.linspace(0, len(array) - 1, target_length)
    indices = np.rint(indices).astype(np.int32)
    return array[indices].copy()


def prepare_sequence(sequence: np.ndarray, target_length: int = DEFAULT_SEQUENCE_LENGTH) -> np.ndarray:
    """Normalize and uniformly resample one gesture sequence."""
    normalized = normalize_sequence(sequence)
    return resample_sequence(normalized, target_length)


def sequence_detection_quality(sequence: np.ndarray) -> dict[str, float]:
    """Return landmark detection ratios used to reject unusable recordings."""
    array = _as_sequence(sequence)
    pose = array[:, :POSE_VALUES].reshape(-1, POSE_LANDMARKS, 4)
    left = array[:, POSE_VALUES:POSE_VALUES + HAND_VALUES]
    right = array[:, POSE_VALUES + HAND_VALUES:]

    pose_detected = np.any(np.abs(pose[:, :, :3]) > 1e-6, axis=(1, 2))
    left_detected = np.any(np.abs(left) > 1e-6, axis=1)
    right_detected = np.any(np.abs(right) > 1e-6, axis=1)
    hand_detected = left_detected | right_detected

    return {
        "pose_ratio": float(np.mean(pose_detected)),
        "hand_ratio": float(np.mean(hand_detected)),
        "both_hands_ratio": float(np.mean(left_detected & right_detected)),
    }
