"""Unit tests for image_parser extract functions - no Tesseract needed."""

import json
import pytest

from app.parsers.models import ParsedScan
from app.parsers.image_parser import (
    _safe_float,
    _safe_int,
    _find,
    _extract_header,
    _extract_body_composition,
    _extract_scores_and_controls,
    _extract_obesity,
    _extract_research,
    _extract_segmental,
    _extract_impedance,
)


# ── _safe_float ─────────────────────────────────────────────────


class TestSafeFloat:
    def test_normal_float(self):
        assert _safe_float("3.14") == 3.14

    def test_comma_decimal(self):
        assert _safe_float("96,9") == 96.9

    def test_integer_string(self):
        assert _safe_float("100") == 100.0

    def test_empty_string(self):
        assert _safe_float("") is None

    def test_none_input(self):
        assert _safe_float(None) is None

    def test_garbage(self):
        assert _safe_float("abc") is None

    def test_double_dot_ocr_artifact(self):
        # "31.6.2" -> "31.62"
        assert _safe_float("31.6.2") == 31.62

    def test_whitespace(self):
        assert _safe_float("  96.9  ") == 96.9

    def test_negative(self):
        assert _safe_float("-18.9") == -18.9

    def test_ocr_junk_chars(self):
        # non-digit/dot/minus chars stripped
        assert _safe_float("96.9kg") == 96.9


# ── _safe_int ───────────────────────────────────────────────────


class TestSafeInt:
    def test_normal(self):
        assert _safe_int("30") == 30

    def test_float_rounds(self):
        assert _safe_int("30.6") == 31

    def test_rounds_down(self):
        assert _safe_int("30.4") == 30

    def test_none_on_garbage(self):
        assert _safe_int("abc") is None


# ── _find ───────────────────────────────────────────────────────


class TestFind:
    def test_finds_number_after_pattern(self):
        text = "Total Body Water 46.6 ("
        result = _find(text, r"Total\s*Body\s*Water\s*.*?(\d+[,.]?\d*)\s*\(")
        assert result == 46.6

    def test_no_match(self):
        assert _find("nothing here", r"Weight\s*(\d+[,.]?\d*)") is None

    def test_case_insensitive(self):
        result = _find("total body water 46.6 (", r"Total\s*Body\s*Water\s*.*?(\d+[,.]?\d*)\s*\(")
        assert result == 46.6


# ── _extract_header ─────────────────────────────────────────────


class TestExtractHeader:
    def test_date_ddmmyyyy(self):
        scan = ParsedScan()
        _extract_header("24.07.2025 10:58\nID 130125-1", scan)
        assert scan.test_date == "2025-07-24"

    def test_date_with_slash(self):
        scan = ParsedScan()
        _extract_header("24/07/2025 10:58", scan)
        assert scan.test_date == "2025-07-24"

    def test_date_with_comma_artifact(self):
        scan = ParsedScan()
        _extract_header("24.07.2025, 10:58", scan)
        assert scan.test_date == "2025-07-24"

    def test_patient_id(self):
        scan = ParsedScan()
        _extract_header("ID 130125-1\n(Matus Pavliscak)\n184 cm", scan)
        assert scan.patient_id == "130125-1"

    def test_patient_id_with_colon(self):
        scan = ParsedScan()
        _extract_header("ID: 130125-1\n(Matus Pavliscak)", scan)
        assert scan.patient_id == "130125-1"

    def test_patient_id_with_pipe(self):
        scan = ParsedScan()
        _extract_header("ID| 130125-1", scan)
        assert scan.patient_id == "130125-1"

    def test_patient_id_skips_keyword(self):
        """ID value 'Height' or 'Age' should be rejected."""
        scan = ParsedScan()
        _extract_header("ID Height\n184 cm", scan)
        assert scan.patient_id is None

    def test_patient_name(self):
        scan = ParsedScan()
        _extract_header("(Matus Pavliscak)\n184 cm", scan)
        assert scan.patient_name == "Matus Pavliscak"

    def test_height(self):
        scan = ParsedScan()
        _extract_header("184 cm Age: 30 Male", scan)
        assert scan.height_cm == 184.0

    def test_age(self):
        scan = ParsedScan()
        _extract_header("Age: 30\nMale", scan)
        assert scan.age == 30

    def test_age_no_colon(self):
        scan = ParsedScan()
        _extract_header("Age 30", scan)
        assert scan.age == 30

    def test_gender_male(self):
        scan = ParsedScan()
        _extract_header("Gender Male", scan)
        assert scan.gender == "Male"

    def test_gender_female(self):
        scan = ParsedScan()
        _extract_header("Gender Female", scan)
        assert scan.gender == "Female"

    def test_gender_lowercase_capitalized(self):
        scan = ParsedScan()
        _extract_header("gender male", scan)
        assert scan.gender == "Male"

    def test_full_header(self):
        scan = ParsedScan()
        text = "24.07.2025 10:58\nID 130125-1 (Matus Pavliscak)\n184 cm Age: 30 Male"
        _extract_header(text, scan)
        assert scan.test_date == "2025-07-24"
        assert scan.patient_id == "130125-1"
        assert scan.patient_name == "Matus Pavliscak"
        assert scan.height_cm == 184.0
        assert scan.age == 30
        assert scan.gender == "Male"

    def test_empty_text(self):
        scan = ParsedScan()
        _extract_header("", scan)
        assert scan.test_date == ""
        assert scan.patient_id is None


# ── _extract_body_composition ───────────────────────────────────


class TestExtractBodyComposition:
    def test_total_body_water(self):
        scan = ParsedScan()
        _extract_body_composition("Total Body Water 46,6 (38.0 - 48.0)", scan)
        assert scan.total_body_water == 46.6

    def test_protein(self):
        scan = ParsedScan()
        _extract_body_composition("Protein 14,0 (11.0 - 14.0)", scan)
        assert scan.protein == 14.0

    def test_minerals(self):
        scan = ParsedScan()
        _extract_body_composition("Minerals 3,19 (2.8 - 3.5)", scan)
        assert scan.minerals == 3.19

    def test_mineral_singular(self):
        scan = ParsedScan()
        _extract_body_composition("Mineral 3,19 (2.8 - 3.5)", scan)
        assert scan.minerals == 3.19

    def test_body_fat_mass(self):
        scan = ParsedScan()
        _extract_body_composition("Body Fat Mass 32,4 (8.0 - 20.0)", scan)
        assert scan.body_fat_mass == 32.4

    def test_weight_sum_of_above(self):
        scan = ParsedScan()
        _extract_body_composition(
            "Sum of the above Weight kg) 96,9 (60.0 - 80.0)", scan
        )
        assert scan.weight == 96.9

    def test_weight_fallback(self):
        scan = ParsedScan()
        _extract_body_composition("Weight (kg) 96,9 (60.0 - 80.0)", scan)
        assert scan.weight == 96.9

    def test_weight_simple(self):
        scan = ParsedScan()
        _extract_body_composition("Weight kg 96,9 (60.0 - 80.0)", scan)
        assert scan.weight == 96.9

    def test_smm_last_valid_number(self):
        scan = ParsedScan()
        _extract_body_composition("SMM owen | 29,5 32,1 36,4", scan)
        assert scan.smm == 36.4

    def test_smm_single_valid(self):
        scan = ParsedScan()
        _extract_body_composition("SMM 35.0", scan)
        assert scan.smm == 35.0

    def test_smm_out_of_range_rejected(self):
        """SMM values outside 25-60 range should be skipped."""
        scan = ParsedScan()
        _extract_body_composition("SMM 12.5", scan)
        assert scan.smm is None

    def test_smm_high_out_of_range(self):
        scan = ParsedScan()
        _extract_body_composition("SMM 65.0", scan)
        assert scan.smm is None


# ── _extract_scores_and_controls ────────────────────────────────


class TestExtractScoresAndControls:
    def test_score_slash(self):
        scan = ParsedScan()
        _extract_scores_and_controls("64/100 Points", scan)
        assert scan.inbody_score == 64.0

    def test_score_space_slash(self):
        scan = ParsedScan()
        _extract_scores_and_controls("64 /100", scan)
        assert scan.inbody_score == 64.0

    def test_score_ocr_artifact_647_00(self):
        """OCR reads '64/100' as '647 00 Points'."""
        scan = ParsedScan()
        _extract_scores_and_controls("647 00 Points", scan)
        assert scan.inbody_score == 64.0

    def test_score_pipe(self):
        scan = ParsedScan()
        _extract_scores_and_controls("64|100", scan)
        assert scan.inbody_score == 64.0

    def test_score_xx_100_points(self):
        scan = ParsedScan()
        _extract_scores_and_controls("64 - 100 Points", scan)
        assert scan.inbody_score == 64.0

    def test_target_weight(self):
        scan = ParsedScan()
        _extract_scores_and_controls("Target Weight 78,0", scan)
        assert scan.target_weight == 78.0

    def test_weight_control_negative(self):
        scan = ParsedScan()
        _extract_scores_and_controls("Weight Control -18,9", scan)
        assert scan.weight_control == -18.9

    def test_fat_control_negative(self):
        scan = ParsedScan()
        _extract_scores_and_controls("Fat Control -20,4", scan)
        assert scan.fat_control == -20.4

    def test_muscle_control_positive(self):
        scan = ParsedScan()
        _extract_scores_and_controls("Muscle Control 1,5", scan)
        assert scan.muscle_control == 1.5

    def test_waist_hip_ratio_next_line(self):
        scan = ParsedScan()
        _extract_scores_and_controls("Waist-Hip Ratio\nabc 0,95", scan)
        assert scan.waist_hip_ratio == 0.95

    def test_waist_hip_ratio_same_line(self):
        scan = ParsedScan()
        _extract_scores_and_controls("Waist-Hip Ratio 0.95", scan)
        assert scan.waist_hip_ratio == 0.95

    def test_waist_hip_ratio_dot_separator(self):
        scan = ParsedScan()
        _extract_scores_and_controls("Waist.Hip Ratio\nabc 0.92", scan)
        assert scan.waist_hip_ratio == 0.92

    def test_visceral_fat_level(self):
        scan = ParsedScan()
        _extract_scores_and_controls("Level 12", scan)
        assert scan.visceral_fat_level == 12


# ── _extract_obesity ────────────────────────────────────────────


class TestExtractObesity:
    def test_bmi_with_dot(self):
        scan = ParsedScan()
        _extract_obesity("Body Mass Index (Kg/m2) 28.6\nFat Free Mass", scan)
        assert scan.bmi == 28.6

    def test_bmi_with_comma(self):
        scan = ParsedScan()
        _extract_obesity("Body Mass Index (Kg/m2) 28,6\nFat Free Mass", scan)
        assert scan.bmi == 28.6

    def test_bmi_3digit_divided_by_10(self):
        """OCR artifact: '286' should become 28.6."""
        scan = ParsedScan()
        _extract_obesity("Body Mass Index (Kg/m2) 286\nFat Free Mass", scan)
        assert scan.bmi == 28.6

    def test_bmi_316_ocr(self):
        scan = ParsedScan()
        _extract_obesity("Body Mass index: (Kg/m2) a a a 316\nFat Free Mass", scan)
        assert scan.bmi == 31.6

    def test_bmi_out_of_range_low(self):
        scan = ParsedScan()
        _extract_obesity("Body Mass Index 10\nFat Free Mass", scan)
        assert scan.bmi is None

    def test_bmi_out_of_range_high(self):
        scan = ParsedScan()
        _extract_obesity("Body Mass Index 700\nFat Free Mass", scan)
        assert scan.bmi is None

    def test_pbf_dot(self):
        scan = ParsedScan()
        _extract_obesity("Percent Body Fat 33.4", scan)
        assert scan.pbf == 33.4

    def test_pbf_space_separator(self):
        """OCR: 'Percent Body Fat 33 4' -> 33.4"""
        scan = ParsedScan()
        _extract_obesity("Percent Body Fat 33 4", scan)
        assert scan.pbf == 33.4

    def test_pbf_comma(self):
        scan = ParsedScan()
        _extract_obesity("Percent Body Fat 33,4", scan)
        assert scan.pbf == 33.4

    def test_pbf_out_of_range_low(self):
        scan = ParsedScan()
        _extract_obesity("Percent Body Fat 03 2", scan)
        assert scan.pbf is None

    def test_pbf_out_of_range_high(self):
        scan = ParsedScan()
        _extract_obesity("Percent Body Fat 75 0", scan)
        assert scan.pbf is None


# ── _extract_research ───────────────────────────────────────────


class TestExtractResearch:
    def test_fat_free_mass(self):
        scan = ParsedScan()
        _extract_research("Fat Free Mass 64,5", scan)
        assert scan.fat_free_mass == 64.5

    def test_basal_metabolic_rate(self):
        scan = ParsedScan()
        _extract_research("Basal Metabolic Rate 1850", scan)
        assert scan.basal_metabolic_rate == 1850.0

    def test_obesity_degree(self):
        scan = ParsedScan()
        _extract_research("Obesity Degree 150,5", scan)
        assert scan.obesity_degree == 150.5

    def test_smi(self):
        scan = ParsedScan()
        _extract_research("SMI 10,8", scan)
        assert scan.smi == 10.8

    def test_recommended_calories(self):
        scan = ParsedScan()
        _extract_research("Recommended calorie intake 2590", scan)
        assert scan.recommended_calories == 2590.0

    def test_recommended_calories_rcmd(self):
        scan = ParsedScan()
        _extract_research("Rcmd. calorie intake 2590", scan)
        assert scan.recommended_calories == 2590.0

    def test_no_match(self):
        scan = ParsedScan()
        _extract_research("nothing here", scan)
        assert scan.fat_free_mass is None
        assert scan.basal_metabolic_rate is None


# ── _extract_segmental ──────────────────────────────────────────


class TestExtractSegmental:
    SEGMENTAL_TEXT = (
        "Segmental Lean Analysis\n"
        "RA 3.5 kg\nLA 3.4 kg\nTR 25.0 kg\nRL 8.5 kg\nLL 8.3 kg\n"
        "Segmental Fat Analysis\n"
        "RA 1.8 kg\nLA 1.7 kg\nTR 15.0 kg\nRL 2.5 kg\nLL 2.4 kg\n"
        "Calorie"
    )

    def test_lean_values(self):
        scan = ParsedScan()
        _extract_segmental(self.SEGMENTAL_TEXT, scan)
        lean = json.loads(scan.segmental_lean)
        assert lean == {"RA": 3.5, "LA": 3.4, "TR": 25.0, "RL": 8.5, "LL": 8.3}

    def test_fat_values(self):
        scan = ParsedScan()
        _extract_segmental(self.SEGMENTAL_TEXT, scan)
        fat = json.loads(scan.segmental_fat)
        assert fat == {"RA": 1.8, "LA": 1.7, "TR": 15.0, "RL": 2.5, "LL": 2.4}

    def test_no_segmental_data(self):
        scan = ParsedScan()
        _extract_segmental("nothing here", scan)
        assert scan.segmental_lean is None
        assert scan.segmental_fat is None

    def test_lean_only_when_fat_missing(self):
        scan = ParsedScan()
        text = (
            "Segmental Lean Analysis\n"
            "RA 3.5 kg\nLA 3.4 kg\nTR 25.0 kg\nRL 8.5 kg\nLL 8.3 kg\n"
            "Segmental Fat Analysis\n"
            "Calorie"
        )
        _extract_segmental(text, scan)
        assert scan.segmental_lean is not None
        assert scan.segmental_fat is None

    def test_insufficient_lean_values(self):
        scan = ParsedScan()
        text = (
            "Segmental Lean Analysis\n"
            "RA 3.5 kg\nLA 3.4 kg\n"
            "Segmental Fat Analysis\n"
            "Calorie"
        )
        _extract_segmental(text, scan)
        assert scan.segmental_lean is None


# ── _extract_impedance ──────────────────────────────────────────


class TestExtractImpedance:
    def test_two_frequency_rows(self):
        scan = ParsedScan()
        text = (
            "Impedance\nRA LA TR RL LL\n"
            "300.1 310.2 25.5 280.3 290.4\n"
            "250.1 260.2 20.5 230.3 240.4"
        )
        _extract_impedance(text, scan)
        imp = json.loads(scan.impedance)
        assert imp["RA_20"] == 300.1
        assert imp["LA_20"] == 310.2
        assert imp["TR_20"] == 25.5
        assert imp["RL_20"] == 280.3
        assert imp["LL_20"] == 290.4
        assert imp["RA_100"] == 250.1
        assert imp["LA_100"] == 260.2
        assert imp["TR_100"] == 20.5
        assert imp["RL_100"] == 230.3
        assert imp["LL_100"] == 240.4

    def test_no_impedance_data(self):
        scan = ParsedScan()
        _extract_impedance("nothing here", scan)
        assert scan.impedance is None

    def test_insufficient_values(self):
        """Less than 10 values should not set impedance."""
        scan = ParsedScan()
        text = "Impedance\nRA LA TR RL LL\n300.1 310.2 25.5"
        _extract_impedance(text, scan)
        assert scan.impedance is None

    def test_ten_keys_present(self):
        scan = ParsedScan()
        text = (
            "Impedance\nRA LA TR RL LL\n"
            "300 310 25 280 290\n"
            "250 260 20 230 240"
        )
        _extract_impedance(text, scan)
        imp = json.loads(scan.impedance)
        assert len(imp) == 10


# ── ParsedScan.to_dict ─────────────────────────────────────────


class TestParsedScanToDict:
    def test_excludes_none(self):
        scan = ParsedScan(test_date="2025-07-24", weight=96.9)
        d = scan.to_dict()
        assert "weight" in d
        assert "protein" not in d

    def test_excludes_history_scans(self):
        scan = ParsedScan(test_date="2025-07-24")
        scan.history_scans = ["something"]
        d = scan.to_dict()
        assert "history_scans" not in d

    def test_empty_date_included(self):
        scan = ParsedScan()
        d = scan.to_dict()
        # empty string is falsy but not None, so included
        assert "test_date" in d
