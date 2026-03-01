from pydantic import BaseModel
from typing import Optional
import json


class ScanBase(BaseModel):
    test_date: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    height_cm: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    source_file: Optional[str] = None

    total_body_water: Optional[float] = None
    protein: Optional[float] = None
    minerals: Optional[float] = None
    body_fat_mass: Optional[float] = None
    weight: Optional[float] = None

    smm: Optional[float] = None
    bmi: Optional[float] = None
    pbf: Optional[float] = None

    inbody_score: Optional[float] = None
    target_weight: Optional[float] = None
    weight_control: Optional[float] = None
    fat_control: Optional[float] = None
    muscle_control: Optional[float] = None

    waist_hip_ratio: Optional[float] = None
    visceral_fat_level: Optional[int] = None
    fat_free_mass: Optional[float] = None
    basal_metabolic_rate: Optional[float] = None
    obesity_degree: Optional[float] = None
    smi: Optional[float] = None
    recommended_calories: Optional[float] = None

    segmental_lean: Optional[str] = None
    segmental_fat: Optional[str] = None
    impedance: Optional[str] = None


class ScanCreate(ScanBase):
    pass


class ScanUpdate(BaseModel):
    test_date: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    height_cm: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None

    total_body_water: Optional[float] = None
    protein: Optional[float] = None
    minerals: Optional[float] = None
    body_fat_mass: Optional[float] = None
    weight: Optional[float] = None

    smm: Optional[float] = None
    bmi: Optional[float] = None
    pbf: Optional[float] = None

    inbody_score: Optional[float] = None
    target_weight: Optional[float] = None
    weight_control: Optional[float] = None
    fat_control: Optional[float] = None
    muscle_control: Optional[float] = None

    waist_hip_ratio: Optional[float] = None
    visceral_fat_level: Optional[int] = None
    fat_free_mass: Optional[float] = None
    basal_metabolic_rate: Optional[float] = None
    obesity_degree: Optional[float] = None
    smi: Optional[float] = None
    recommended_calories: Optional[float] = None

    segmental_lean: Optional[str] = None
    segmental_fat: Optional[str] = None
    impedance: Optional[str] = None


class ScanOut(ScanBase):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ScanSummary(BaseModel):
    id: int
    test_date: str
    weight: Optional[float] = None
    smm: Optional[float] = None
    pbf: Optional[float] = None
    bmi: Optional[float] = None
    inbody_score: Optional[float] = None
    source_file: Optional[str] = None

    class Config:
        from_attributes = True


class TrendPoint(BaseModel):
    test_date: str
    weight: Optional[float] = None
    smm: Optional[float] = None
    pbf: Optional[float] = None
    bmi: Optional[float] = None
    body_fat_mass: Optional[float] = None
    total_body_water: Optional[float] = None
    inbody_score: Optional[float] = None
    visceral_fat_level: Optional[int] = None
    basal_metabolic_rate: Optional[float] = None
    waist_hip_ratio: Optional[float] = None
