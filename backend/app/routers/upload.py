import os
import shutil
import logging
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Scan
from ..schemas import ScanOut
from ..parsers.pdf_parser import parse_pdf
from ..parsers.image_parser import ocr_inbody_image
from PIL import Image

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/api/upload", response_model=list[ScanOut])
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload an InBody PDF or image file, parse it, and store the scan(s)."""
    if not file.filename:
        raise HTTPException(400, "No filename")

    ext = Path(file.filename).suffix.lower()
    if ext not in (".pdf", ".jpg", ".jpeg", ".png"):
        raise HTTPException(400, f"Unsupported file type: {ext}")

    # Save uploaded file
    dest = UPLOAD_DIR / file.filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        if ext == ".pdf":
            parsed_scans = parse_pdf(str(dest))
        else:
            img = Image.open(dest)
            parsed_scans = [ocr_inbody_image(img)]

        # Reject if nothing meaningful was parsed
        core_metrics = {"weight", "bmi", "pbf", "smm", "body_fat_mass", "total_body_water"}
        meaningful = [p for p in parsed_scans if core_metrics & p.to_dict().keys()]
        if not meaningful:
            os.remove(dest)
            raise HTTPException(
                422,
                "No InBody metrics could be extracted from this file. "
                "Please check that the image/PDF is a clear, complete InBody result sheet.",
            )
        parsed_scans = meaningful

        created = []
        for parsed in parsed_scans:
            data = parsed.to_dict()
            data["source_file"] = file.filename

            # Check for duplicate (same date)
            existing = db.query(Scan).filter(Scan.test_date == data.get("test_date")).first()
            if existing:
                # Update existing scan with new data
                for k, v in data.items():
                    if v is not None:
                        setattr(existing, k, v)
                db.commit()
                db.refresh(existing)
                created.append(existing)
            else:
                scan = Scan(**data)
                db.add(scan)
                db.commit()
                db.refresh(scan)
                created.append(scan)

        return created

    except Exception as e:
        logger.exception("Failed to parse file")
        raise HTTPException(500, f"Parse error: {str(e)}")
