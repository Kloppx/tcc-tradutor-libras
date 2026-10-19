import tempfile
import unittest
from pathlib import Path

from scripts.organize_new_videos import calculate_split_counts, organize_new_videos


class OrganizeNewVideosTests(unittest.TestCase):
    def test_small_batch_stays_in_train(self):
        self.assertEqual(
            calculate_split_counts(total=1, val_ratio=0.20, test_ratio=0.0),
            {"train": 1, "val": 0, "test": 0},
        )

    def test_adds_files_after_highest_existing_index(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "novos" / "Hospital"
            dataset = root / "dataset" / "raw"
            source.mkdir(parents=True)
            existing = dataset / "test" / "hospital"
            existing.mkdir(parents=True)
            (existing / "hospital_0025.mp4").write_bytes(b"video antigo")
            (source / "novo_a.mp4").write_bytes(b"video novo a")
            (source / "novo_b.mp4").write_bytes(b"video novo b")

            summary = organize_new_videos(source.parent, dataset, val_ratio=0, seed=10)

            self.assertEqual(summary["adicionados"], 2)
            added = sorted((dataset / "train" / "hospital").glob("*.mp4"))
            self.assertEqual([path.name for path in added], ["hospital_0026.mp4", "hospital_0027.mp4"])

    def test_reuses_existing_class_name_and_skips_duplicate_content(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "novos" / "Posto de Saúde"
            dataset = root / "dataset" / "raw"
            source.mkdir(parents=True)
            existing = dataset / "train" / "posto de saude"
            existing.mkdir(parents=True)
            (existing / "posto_de_saude_0001.mp4").write_bytes(b"mesmo video")
            (source / "copia.mp4").write_bytes(b"mesmo video")

            summary = organize_new_videos(source.parent, dataset)

            self.assertEqual(summary["adicionados"], 0)
            self.assertEqual(summary["duplicados"], 1)
            self.assertFalse((dataset / "train" / "posto de saúde").exists())


if __name__ == "__main__":
    unittest.main()
