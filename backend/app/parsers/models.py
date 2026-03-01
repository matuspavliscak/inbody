from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class ParsedScan:
    test_date: str = ""
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

    # Additional scans from history pages
    history_scans: list = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d.pop("history_scans", None)
        return {k: v for k, v in d.items() if v is not None}
