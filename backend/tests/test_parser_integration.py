"""Integration tests: real OCR against sample InBody image.

Skipped automatically if tesseract is not installed.
"""

import re
import shutil
from pathlib import Path

import pytest

FIXTURE_DIR = Path(__file__).parent / "fixtures"
SAMPLE_IMAGE = FIXTURE_DIR / "sample_inbody.jpg"

pytestmark = pytest.mark.skipif(
    not shutil.which("tesseract"),
    reason="tesseract not installed",
)


@pytest.fixture(scope="module")
def ocr_result():
    """Run OCR once on the sample image; all tests share the result."""
    if not SAMPLE_IMAGE.exists():
        pytest.skip("Sample fixture image not found")
    from PIL import Image
    from app.parsers.image_parser import ocr_inbody_image

    img = Image.open(SAMPLE_IMAGE)
    return ocr_inbody_image(img)


# ── Header ──────────────────────────────────────────────────────


class TestHeader:
    def test_date_extracted(self, ocr_result):
        assert ocr_result.test_date and len(ocr_result.test_date) == 10

    def test_date_iso_format(self, ocr_result):
        assert re.match(r"\d{4}-\d{2}-\d{2}", ocr_result.test_date)

    def test_height_reasonable(self, ocr_result):
        assert ocr_result.height_cm == pytest.approx(184, abs=10)

    def test_gender_valid(self, ocr_result):
        assert ocr_result.gender in ("Male", "Female")


# ── Body Composition ────────────────────────────────────────────


class TestBodyComposition:
    def test_weight(self, ocr_result):
        assert ocr_result.weight == pytest.approx(97, abs=5)

    def test_total_body_water(self, ocr_result):
        assert ocr_result.total_body_water == pytest.approx(47, abs=5)

    def test_body_fat_mass(self, ocr_result):
        assert ocr_result.body_fat_mass == pytest.approx(32, abs=5)

    def test_smm(self, ocr_result):
        assert ocr_result.smm == pytest.approx(36, abs=5)


# ── Obesity Analysis ────────────────────────────────────────────


class TestObesity:
    def test_bmi(self, ocr_result):
        assert ocr_result.bmi == pytest.approx(29, abs=3)

    def test_pbf(self, ocr_result):
        assert ocr_result.pbf == pytest.approx(33, abs=5)


# ── Scores and Controls ────────────────────────────────────────


class TestScores:
    def test_inbody_score(self, ocr_result):
        assert ocr_result.inbody_score == pytest.approx(64, abs=5)

    def test_target_weight(self, ocr_result):
        assert ocr_result.target_weight == pytest.approx(78, abs=5)

    def test_waist_hip_ratio(self, ocr_result):
        if ocr_result.waist_hip_ratio is None:
            pytest.skip("OCR did not extract waist-hip ratio from this image")
        assert 0.7 <= ocr_result.waist_hip_ratio <= 1.2


# ── Research Parameters ────────────────────────────────────────


class TestResearch:
    def test_fat_free_mass(self, ocr_result):
        assert ocr_result.fat_free_mass == pytest.approx(65, abs=5)

    def test_basal_metabolic_rate(self, ocr_result):
        assert 1500 <= ocr_result.basal_metabolic_rate <= 2200


# ── Completeness ────────────────────────────────────────────────


class TestCompleteness:
    def test_core_metrics_present(self, ocr_result):
        """Upload validation requires these six fields."""
        d = ocr_result.to_dict()
        core = {"weight", "bmi", "pbf", "smm", "body_fat_mass", "total_body_water"}
        assert core.issubset(d.keys())

    def test_to_dict_no_none_values(self, ocr_result):
        d = ocr_result.to_dict()
        assert all(v is not None for v in d.values())
