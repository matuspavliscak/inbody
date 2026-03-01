import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import Scan
from ..schemas import ScanOut, ScanSummary, ScanUpdate, TrendPoint

router = APIRouter()

GOALS_FILE = Path(__file__).parent.parent.parent / "goals.json"


class Goals(BaseModel):
    target_weight: Optional[float] = None
    target_pbf: Optional[float] = None


@router.get("/api/goals", response_model=Goals)
def get_goals():
    if GOALS_FILE.exists():
        return Goals(**json.loads(GOALS_FILE.read_text()))
    return Goals()


@router.put("/api/goals", response_model=Goals)
def set_goals(goals: Goals):
    GOALS_FILE.write_text(json.dumps(goals.model_dump(), indent=2))
    return goals


SAMPLE_DATA = [
    # (date, weight, smm, pbf, bmi, score)
    ("2025-01-11", 92.0, 32.8, 28.5, 29.0, 65),
    ("2025-02-08", 89.5, 33.2, 26.8, 28.3, 68),
    ("2025-03-15", 87.0, 33.9, 24.5, 27.5, 71),
    ("2025-04-12", 85.2, 34.3, 22.8, 26.9, 74),
    ("2025-05-17", 83.8, 34.8, 21.0, 26.5, 76),
    ("2025-06-14", 82.5, 35.1, 19.8, 26.1, 78),
    ("2025-07-19", 84.3, 34.6, 22.2, 26.6, 74),
    ("2025-08-16", 86.8, 34.0, 25.0, 27.4, 70),
    ("2025-09-13", 84.5, 34.5, 22.5, 26.7, 73),
    ("2025-10-18", 82.0, 35.2, 19.5, 25.9, 79),
    ("2025-11-15", 80.5, 35.6, 17.8, 25.4, 82),
    ("2025-12-20", 83.0, 35.0, 21.0, 26.2, 76),
    ("2026-01-17", 81.0, 35.5, 18.5, 25.6, 80),
    ("2026-02-21", 79.8, 36.0, 16.9, 25.2, 84),
]


@router.post("/api/sample-data")
def seed_sample_data(db: Session = Depends(get_db)):
    if db.query(Scan).count() > 0:
        raise HTTPException(400, "Database already has scans. Clear all data first.")

    for date, weight, smm, pbf, bmi, score in SAMPLE_DATA:
        bfm = round(weight * pbf / 100, 1)
        tbw = round((weight - bfm) * 0.73, 1)
        protein = round((weight - bfm) * 0.22, 1)
        minerals = round((weight - bfm) * 0.05, 1)
        ffm = round(weight - bfm, 1)
        idx = [r[0] for r in SAMPLE_DATA].index(date)
        seg_lean = json.dumps({
            "RA": round(smm * 0.13, 2), "LA": round(smm * 0.127, 2),
            "TR": round(smm * 0.44, 2), "RL": round(smm * 0.155, 2),
            "LL": round(smm * 0.152, 2),
        })
        seg_fat = json.dumps({
            "RA": round(bfm * 0.12, 2), "LA": round(bfm * 0.11, 2),
            "TR": round(bfm * 0.52, 2), "RL": round(bfm * 0.13, 2),
            "LL": round(bfm * 0.12, 2),
        })
        scan = Scan(
            test_date=date, patient_name="Alex Johnson", patient_id="AJ-1042",
            height_cm=178, age=32, gender="Male",
            source_file=f"InBody_{date}.pdf",
            total_body_water=tbw, protein=protein, minerals=minerals,
            body_fat_mass=bfm, weight=weight, smm=smm, bmi=bmi, pbf=pbf,
            inbody_score=score, target_weight=78.0,
            weight_control=round(78.0 - weight, 1),
            fat_control=round(-(bfm - 12.0), 1),
            muscle_control=round(smm - 34.0, 1),
            waist_hip_ratio=round(0.91 - 0.005 * idx, 2),
            visceral_fat_level=max(6, 14 - idx // 2),
            fat_free_mass=ffm,
            basal_metabolic_rate=round(1580 + smm * 9, 0),
            obesity_degree=round(pbf / 18 * 100, 1),
            smi=round(smm / (1.78 ** 2), 1),
            recommended_calories=round((1580 + smm * 9) * 1.4, 0),
            segmental_lean=seg_lean, segmental_fat=seg_fat,
        )
        db.add(scan)

    # Set sample goals
    GOALS_FILE.write_text(json.dumps({"target_weight": 78.0, "target_pbf": 15.0}, indent=2))

    db.commit()
    return {"ok": True, "count": len(SAMPLE_DATA)}


@router.delete("/api/scans")
def clear_all_scans(db: Session = Depends(get_db)):
    count = db.query(Scan).count()
    db.query(Scan).delete()
    db.commit()
    if GOALS_FILE.exists():
        GOALS_FILE.unlink()
    return {"ok": True, "deleted": count}


@router.get("/api/scans", response_model=list[ScanSummary])
def list_scans(db: Session = Depends(get_db)):
    scans = db.query(Scan).order_by(Scan.test_date.desc()).all()
    return scans


@router.get("/api/scans/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    return scan


@router.delete("/api/scans/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    db.delete(scan)
    db.commit()
    return {"ok": True}


@router.patch("/api/scans/{scan_id}", response_model=ScanOut)
def update_scan(scan_id: int, update: ScanUpdate, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(scan, key, value)

    db.commit()
    db.refresh(scan)
    return scan


@router.get("/api/trends", response_model=list[TrendPoint])
def get_trends(db: Session = Depends(get_db)):
    scans = db.query(Scan).order_by(Scan.test_date.asc()).all()
    return [
        TrendPoint(
            test_date=s.test_date,
            weight=s.weight,
            smm=s.smm,
            pbf=s.pbf,
            bmi=s.bmi,
            body_fat_mass=s.body_fat_mass,
            total_body_water=s.total_body_water,
            inbody_score=s.inbody_score,
            visceral_fat_level=s.visceral_fat_level,
            basal_metabolic_rate=s.basal_metabolic_rate,
            waist_hip_ratio=s.waist_hip_ratio,
        )
        for s in scans
    ]
