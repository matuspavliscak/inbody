from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Scan
from ..schemas import ScanOut, ScanSummary, ScanUpdate, TrendPoint

router = APIRouter()


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
