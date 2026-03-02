"""Parse InBody270 reports from images using OCR."""
import re
import json
import logging
from typing import Optional

from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

from .models import ParsedScan

logger = logging.getLogger(__name__)

# Number pattern that handles both comma and dot decimals
NUM = r'(\d+[,.]?\d*)'


def preprocess_for_ocr(img: Image.Image) -> Image.Image:
    """Preprocess image for better OCR accuracy."""
    gray = img.convert("L")
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(2.0)
    sharpened = enhanced.filter(ImageFilter.SHARPEN)
    threshold = sharpened.point(lambda x: 255 if x > 140 else 0)
    return threshold


def ocr_inbody_image(img: Image.Image) -> ParsedScan:
    """OCR a full InBody270 report page image and extract all data."""
    scan = ParsedScan()
    processed = preprocess_for_ocr(img)
    text = pytesseract.image_to_string(processed, config="--psm 6")
    logger.info(f"Full page OCR ({len(text)} chars)")
    logger.debug(f"OCR text:\n{text}")

    _extract_header(text, scan)
    _extract_body_composition(text, scan)
    _extract_scores_and_controls(text, scan)
    _extract_obesity(text, scan)
    _extract_research(text, scan)
    _extract_segmental(text, scan)
    _extract_impedance(text, scan)

    return scan


def _safe_float(val: str) -> Optional[float]:
    """Convert string to float, handling commas and OCR artifacts."""
    if not val:
        return None
    val = val.strip().replace(",", ".")
    val = re.sub(r'[^\d.\-]', '', val)
    # Handle double dots from OCR
    parts = val.split(".")
    if len(parts) > 2:
        val = parts[0] + "." + "".join(parts[1:])
    try:
        return float(val)
    except ValueError:
        return None


def _safe_int(val: str) -> Optional[int]:
    f = _safe_float(val)
    return int(round(f)) if f is not None else None


def _find(text: str, pattern: str) -> Optional[float]:
    """Find a number following a pattern in text."""
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        return _safe_float(m.group(1))
    return None


def _extract_header(text: str, scan: ParsedScan):
    """Extract header: ID, Height, Age, Gender, Test Date."""
    # Test Date — DD.MM.YYYY format
    m = re.search(r'(\d{2})[./](\d{2})[./](\d{4})[.,]?\s*(\d{2}[:.]\d{2})?', text)
    if m:
        scan.test_date = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

    # ID — first non-space token after "ID"
    m = re.search(r'\bID\b\s*[:\|]?\s*(\S+)', text)
    if m:
        val = m.group(1).strip()
        if val.lower() not in ("height", "age", "gender"):
            scan.patient_id = val

    # Name in parentheses after ID line, e.g. "(John Smith)"
    m = re.search(r'\(([A-Z][a-zA-Zéáíóúčšžťďňřůý]+\s+[A-Z][a-zA-Zéáíóúčšžťďňřůý]+)\)', text)
    if m:
        scan.patient_name = m.group(1)

    m = re.search(r'(\d{3})\s*cm', text)
    if m:
        scan.height_cm = _safe_float(m.group(1))

    m = re.search(r'Age\s*[:\|]?\s*(\d{1,3})', text, re.IGNORECASE)
    if m:
        scan.age = _safe_int(m.group(1))

    m = re.search(r'(Male|Female)', text, re.IGNORECASE)
    if m:
        scan.gender = m.group(1).capitalize()


def _extract_body_composition(text: str, scan: ParsedScan):
    """Extract Body Composition Analysis — values appear after the label with range in parens."""
    # Pattern: "Total Body Water ... 46,6 ( range )"
    scan.total_body_water = _find(text, rf'Total\s*Body\s*Water\s*.*?{NUM}\s*\(')
    scan.protein = _find(text, rf'Protein\s*.*?{NUM}\s*\(')
    scan.minerals = _find(text, rf'Minerals?\s*.*?{NUM}\s*\(')
    scan.body_fat_mass = _find(text, rf'Body\s*Fat\s*Mass\s*.*?{NUM}\s*\(')
    # Weight line: "Weight kg) 96,9 ( range )"
    scan.weight = _find(text, rf'Sum\s*of\s*the\s*above\s*Weight\s*.*?{NUM}\s*\(')
    if not scan.weight:
        scan.weight = _find(text, rf'\bWeight\s*(?:\(?kg\)?)?\s*{NUM}\s*\(')

    # SMM — appears in history section as last value on the SMM row
    # e.g. "SMM owen "| ... 36,4"
    # Find last reasonable number (25-60 range) on any SMM line
    smm_lines = [l for l in text.split('\n') if re.search(r'\bSMM\b', l, re.IGNORECASE)]
    for line in smm_lines:
        nums = re.findall(r'(\d{2}[,.]?\d)', line)
        # Take last number in valid SMM range (25-60 kg)
        for n in reversed(nums):
            v = _safe_float(n)
            if v and 25 <= v <= 60:
                scan.smm = v
                break
        if scan.smm:
            break


def _extract_scores_and_controls(text: str, scan: ParsedScan):
    """Extract InBody Score, Weight Control section, WHR, VFL."""
    # InBody Score: "64/100", "65 /100", or OCR artifact "647 00 Points"
    m = re.search(r'(\d{2})\s*[/|]\s*100', text)
    if m:
        scan.inbody_score = _safe_float(m.group(1))
    if not scan.inbody_score:
        # OCR artifact: "647 00 Points" = "64/100 Points"
        m = re.search(r'(\d{2})7\s*00\s*(?:Points|points)', text)
        if m:
            scan.inbody_score = _safe_float(m.group(1))
    if not scan.inbody_score:
        # "XX / 100" with various separators
        m = re.search(r'(\d{2})\s*\D\s*100\s*(?:Points|points)', text)
        if m:
            scan.inbody_score = _safe_float(m.group(1))
    if not scan.inbody_score:
        # "InBody Score" label followed by number on same or next line
        m = re.search(r'InBody\s*Score\D*?(\d{2})\b', text, re.IGNORECASE)
        if m:
            v = _safe_float(m.group(1))
            if v and 30 <= v <= 100:
                scan.inbody_score = v

    scan.target_weight = _find(text, rf'Target\s*Weight\s*{NUM}')
    scan.weight_control = _find(text, r'Weight\s*Control\s*(-?\s*\d+[,.]?\d*)')
    scan.fat_control = _find(text, r'Fat\s*Control\s*(-?\s*\d+[,.]?\d*)')
    scan.muscle_control = _find(text, r'Muscle\s*Control\s*(-?\s*\d+[,.]?\d*)')

    # Waist-Hip Ratio — value on next line, typically 0.8-1.3
    m = re.search(r'Waist[.-]?\s*Hip\s*Ratio.*?\n.*?(\d[,.]\d{2})', text, re.IGNORECASE)
    if m:
        scan.waist_hip_ratio = _safe_float(m.group(1))
    if not scan.waist_hip_ratio:
        # Try same line
        m = re.search(r'Waist[.-]?\s*Hip\s*Ratio\D*(\d[,.]\d{2})', text, re.IGNORECASE)
        if m:
            scan.waist_hip_ratio = _safe_float(m.group(1))

    scan.visceral_fat_level = _safe_int(
        str(_find(text, r'Level\s+(\d{1,2})\b') or "")
    )


def _extract_obesity(text: str, scan: ParsedScan):
    """Extract BMI and PBF actual values from Obesity Analysis section."""
    # BMI: OCR varies widely:
    #   "Body Mass index: (Kg/m²) a a a 316" (316 = 31.6)
    #   "Body Mass Index 3) 5" (3)5 = 30.5 with ')' as OCR for '0')
    # Strategy: find all digit sequences on the Body Mass Index line,
    # pick the one that makes a valid BMI (15-60)
    m = re.search(r'Body\s*Mass\s*[Ii]ndex.*?(?:Fat\s*Free|$)', text, re.DOTALL)
    if m:
        line = m.group(0)
        # Try "XX.X" or "XX,X" pattern first
        bmi_match = re.search(r'(\d{2})[,.](\d)', line)
        if bmi_match:
            val = _safe_float(f"{bmi_match.group(1)}.{bmi_match.group(2)}")
            if val and 15 <= val <= 60:
                scan.bmi = val
        if not scan.bmi:
            # Try 3-digit number / 10
            nums = re.findall(r'(\d{2,3})', line)
            for n in nums:
                val = _safe_float(n)
                if val:
                    if val > 100:
                        val = val / 10
                    if 15 <= val <= 60:
                        scan.bmi = round(val, 1)
                        break

    # PBF: "Percent Body Fat a ag 33.4" or "Percent Body Fat 34 3"
    # Use .*? to skip OCR artifacts between label and number
    m = re.search(r'Percent\s*Body\s*Fat\D*?(\d{2})[,. ]\s*(\d)', text)
    if m:
        val = _safe_float(f"{m.group(1)}.{m.group(2)}")
        if val and 5 <= val <= 70:
            scan.pbf = val


def _extract_research(text: str, scan: ParsedScan):
    """Extract Research Parameters section."""
    scan.fat_free_mass = _find(text, rf'Fat\s*Free\s*Mass\s*{NUM}')
    scan.basal_metabolic_rate = _find(text, rf'Basal\s*Metabolic\s*Rate\s*{NUM}')
    scan.obesity_degree = _find(text, rf'Obesity\s*Degree\s*{NUM}')
    scan.smi = _find(text, rf'\bSMI\b\s*{NUM}')
    scan.recommended_calories = _find(text, rf'[Rr]ecommended\s*calorie\s*intake\s*{NUM}')
    if not scan.recommended_calories:
        scan.recommended_calories = _find(text, rf'Rcmd.*?calorie.*?{NUM}')


def _extract_segmental(text: str, scan: ParsedScan):
    """Extract Segmental Lean and Fat Analysis — best effort."""
    segments = ["RA", "LA", "TR", "RL", "LL"]

    # Look for kg values in segmental lean section
    lean_section = re.search(
        r'Segmental\s*Lean\s*Analysis(.*?)Segmental\s*Fat\s*Analysis',
        text, re.DOTALL | re.IGNORECASE
    )
    if lean_section:
        nums = re.findall(r'(\d+[,.]?\d*)\s*kg', lean_section.group(1))
        if len(nums) >= 5:
            scan.segmental_lean = json.dumps(
                {s: _safe_float(n) for s, n in zip(segments, nums[:5])}
            )

    fat_section = re.search(
        r'Segmental\s*Fat\s*Analysis(.*?)(?:Calorie|Impedance|Body\s*Composition\s*History)',
        text, re.DOTALL | re.IGNORECASE
    )
    if fat_section:
        nums = re.findall(r'(\d+[,.]?\d*)\s*kg', fat_section.group(1))
        if len(nums) >= 5:
            scan.segmental_fat = json.dumps(
                {s: _safe_float(n) for s, n in zip(segments, nums[:5])}
            )


def _extract_impedance(text: str, scan: ParsedScan):
    """Extract impedance values — two rows of 5 numbers after 'Impedance'."""
    m = re.search(r'Impedance.*?RA\s+LA\s+TR\s+RL\s+LL', text, re.IGNORECASE | re.DOTALL)
    if m:
        rest = text[m.end():]
        rows = re.findall(r'[\d,.]+', rest[:200])
        if len(rows) >= 10:
            segments = ["RA", "LA", "TR", "RL", "LL"]
            # Two frequency rows (20kHz and 100kHz typically)
            imp = {}
            for i, seg in enumerate(segments):
                v1 = _safe_float(rows[i])
                v2 = _safe_float(rows[i + 5]) if i + 5 < len(rows) else None
                if v1:
                    imp[f"{seg}_20"] = v1
                if v2:
                    imp[f"{seg}_100"] = v2
            if imp:
                scan.impedance = json.dumps(imp)
