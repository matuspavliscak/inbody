from sqlalchemy import Column, Integer, Float, Text, text
from .database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    test_date = Column(Text, nullable=False)
    patient_id = Column(Text)
    patient_name = Column(Text)
    height_cm = Column(Float)
    age = Column(Integer)
    gender = Column(Text)
    source_file = Column(Text)

    # Body Composition
    total_body_water = Column(Float)
    protein = Column(Float)
    minerals = Column(Float)
    body_fat_mass = Column(Float)
    weight = Column(Float)

    # Muscle-Fat / Obesity
    smm = Column(Float)
    bmi = Column(Float)
    pbf = Column(Float)

    # Scores & Controls
    inbody_score = Column(Float)
    target_weight = Column(Float)
    weight_control = Column(Float)
    fat_control = Column(Float)
    muscle_control = Column(Float)

    # Additional metrics
    waist_hip_ratio = Column(Float)
    visceral_fat_level = Column(Integer)
    fat_free_mass = Column(Float)
    basal_metabolic_rate = Column(Float)
    obesity_degree = Column(Float)
    smi = Column(Float)
    recommended_calories = Column(Float)

    # Segmental (JSON)
    segmental_lean = Column(Text)
    segmental_fat = Column(Text)
    impedance = Column(Text)

    created_at = Column(Text, server_default=text("(datetime('now'))"))
