import unittest

import numpy as np

from src.landmark_pipeline import (
    FEATURE_DIM,
    normalize_keypoints,
    prepare_sequence,
    resample_sequence,
    sequence_detection_quality,
)


def synthetic_frame(scale=1.0, shift_x=0.0, shift_y=0.0):
    pose = np.zeros((33, 4), dtype=np.float32)
    pose[11, :3] = [0.4, 0.4, 0.0]
    pose[12, :3] = [0.6, 0.4, 0.0]
    pose[15, :3] = [0.35, 0.65, -0.1]
    pose[16, :3] = [0.65, 0.65, -0.1]
    pose[[11, 12, 15, 16], 3] = 1.0

    left = np.tile([0.35, 0.65, -0.1], (21, 1)).astype(np.float32)
    right = np.tile([0.65, 0.65, -0.1], (21, 1)).astype(np.float32)
    left[:, 0] += np.linspace(0.0, 0.04, 21)
    right[:, 0] -= np.linspace(0.0, 0.04, 21)

    pose_present = np.any(np.abs(pose[:, :3]) > 1e-6, axis=1)
    pose[pose_present, 0] = pose[pose_present, 0] * scale + shift_x
    pose[pose_present, 1] = pose[pose_present, 1] * scale + shift_y
    pose[pose_present, 2] *= scale
    for hand in (left, right):
        hand[:, 0] = hand[:, 0] * scale + shift_x
        hand[:, 1] = hand[:, 1] * scale + shift_y
        hand[:, 2] *= scale

    return np.concatenate([pose.reshape(-1), left.reshape(-1), right.reshape(-1)])


class LandmarkPipelineTests(unittest.TestCase):
    def test_normalization_is_invariant_to_image_translation_and_scale(self):
        base = normalize_keypoints(synthetic_frame())
        transformed = normalize_keypoints(synthetic_frame(scale=1.7, shift_x=0.13, shift_y=-0.08))
        np.testing.assert_allclose(base, transformed, atol=1e-5)

    def test_resampling_uses_the_complete_sequence(self):
        sequence = np.zeros((90, FEATURE_DIM), dtype=np.float32)
        sequence[:, 0] = np.arange(90)
        sampled = resample_sequence(sequence, 45)
        self.assertEqual(sampled.shape, (45, FEATURE_DIM))
        self.assertEqual(sampled[0, 0], 0)
        self.assertEqual(sampled[-1, 0], 89)

    def test_prepare_sequence_has_model_shape(self):
        sequence = np.stack([synthetic_frame() for _ in range(83)])
        prepared = prepare_sequence(sequence, 45)
        self.assertEqual(prepared.shape, (45, FEATURE_DIM))
        self.assertEqual(prepared.dtype, np.float32)

    def test_detection_quality_reports_visible_hands(self):
        sequence = np.stack([synthetic_frame() for _ in range(10)])
        quality = sequence_detection_quality(sequence)
        self.assertEqual(quality["pose_ratio"], 1.0)
        self.assertEqual(quality["hand_ratio"], 1.0)
        self.assertEqual(quality["both_hands_ratio"], 1.0)


if __name__ == "__main__":
    unittest.main()
