import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import Scan


@pytest.fixture()
def db_session():
    """Fresh in-memory SQLite database for each test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session, tmp_path, monkeypatch):
    """TestClient with DB and GOALS_FILE isolation."""

    app.dependency_overrides[get_db] = lambda: db_session
    monkeypatch.setattr("app.routers.scans.GOALS_FILE", tmp_path / "goals.json")

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture()
def sample_scan(db_session):
    """A realistic scan row in the test database."""
    scan = Scan(
        test_date="2025-07-24",
        patient_id="130125-1",
        patient_name="Matus Pavliscak",
        height_cm=184.0,
        age=30,
        gender="Male",
        weight=96.9,
        smm=36.4,
        bmi=28.6,
        pbf=33.4,
        body_fat_mass=32.4,
        total_body_water=46.6,
        protein=14.0,
        minerals=3.19,
        inbody_score=64.0,
        target_weight=78.0,
        weight_control=-18.9,
        fat_control=-20.4,
        muscle_control=1.5,
        waist_hip_ratio=0.95,
        visceral_fat_level=12,
        fat_free_mass=64.5,
        basal_metabolic_rate=1850.0,
        source_file="test_inbody.jpg",
    )
    db_session.add(scan)
    db_session.commit()
    db_session.refresh(scan)
    return scan
