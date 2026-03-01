"""Parse InBody270 PDF reports.

The PDFs from LookinBody Web are image-based (no extractable text),
so we convert each page to an image and OCR it.
"""
import re
import json
import logging
from pathlib import Path
from typing import Optional

from pdf2image import convert_from_path
from PIL import Image
import pytesseract

from .models import ParsedScan
from .image_parser import ocr_inbody_image, preprocess_for_ocr

logger = logging.getLogger(__name__)


def parse_pdf(file_path: str) -> list[ParsedScan]:
    """Parse an InBody PDF. Returns list of scans (main + history)."""
    images = convert_from_path(file_path, dpi=300)
    scans = []

    if not images:
        raise ValueError("Could not extract any pages from PDF")

    # Page 1 is always the main report
    main_scan = ocr_inbody_image(images[0])
    scans.append(main_scan)

    # Page 2+ may contain Body Composition History
    for i, img in enumerate(images[1:], start=2):
        history = _parse_history_page(img)
        if history:
            for h in history:
                # Don't add duplicate of the main scan date
                if h.test_date and h.test_date != main_scan.test_date:
                    scans.append(h)

    return scans


def _parse_history_page(img: Image.Image) -> list[ParsedScan]:
    """Try to extract history data from a history page image."""
    processed = preprocess_for_ocr(img)
    text = pytesseract.image_to_string(processed, config="--psm 6")
    logger.debug(f"History page OCR text:\n{text}")

    scans = []
    # History pages have dates and corresponding values
    # Try to extract date patterns (DD.MM.YYYY or DD.MM.YY)
    date_pattern = r'(\d{2}[./]\d{2}[./]\d{2,4})'
    dates = re.findall(date_pattern, text)

    # Try to find weight, SMM, BFM, PBF, BMI values near dates
    # This is best-effort — the main scan from page 1 is more reliable
    for date_str in dates:
        scan = ParsedScan(test_date=_normalize_date(date_str))
        scans.append(scan)

    return scans


def _normalize_date(date_str: str) -> str:
    """Convert DD.MM.YYYY or DD.MM.YY to ISO format YYYY-MM-DD."""
    parts = re.split(r'[./]', date_str)
    if len(parts) == 3:
        day, month, year = parts
        if len(year) == 2:
            year = "20" + year
        try:
            return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
        except ValueError:
            pass
    return date_str
