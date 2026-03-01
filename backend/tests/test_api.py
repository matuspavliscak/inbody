"""Full CRUD tests for all API endpoints."""

import json
import pytest

from app.models import Scan


# ── GET /api/scans ──────────────────────────────────────────────


class TestListScans:
    def test_empty_list(self, client):
        r = client.get("/api/scans")
        assert r.status_code == 200
        assert r.json() == []

    def test_returns_scans(self, client, sample_scan):
        r = client.get("/api/scans")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["test_date"] == "2025-07-24"

    def test_ordered_by_date_desc(self, client, db_session):
        db_session.add(Scan(test_date="2025-06-01", weight=97.0))
        db_session.add(Scan(test_date="2025-08-01", weight=95.0))
        db_session.commit()
        r = client.get("/api/scans")
        dates = [s["test_date"] for s in r.json()]
        assert dates == ["2025-08-01", "2025-06-01"]

    def test_summary_fields(self, client, sample_scan):
        data = client.get("/api/scans").json()[0]
        assert set(data.keys()) == {
            "id", "test_date", "weight", "smm", "pbf", "bmi",
            "inbody_score", "source_file",
        }


# ── GET /api/scans/{id} ────────────────────────────────────────


class TestGetScan:
    def test_existing(self, client, sample_scan):
        r = client.get(f"/api/scans/{sample_scan.id}")
        assert r.status_code == 200
        data = r.json()
        assert data["weight"] == 96.9
        assert data["patient_name"] == "Matus Pavliscak"

    def test_not_found(self, client):
        r = client.get("/api/scans/999")
        assert r.status_code == 404

    def test_full_fields(self, client, sample_scan):
        data = client.get(f"/api/scans/{sample_scan.id}").json()
        assert "id" in data
        assert "created_at" in data
        assert "waist_hip_ratio" in data


# ── DELETE /api/scans/{id} ──────────────────────────────────────


class TestDeleteScan:
    def test_delete_existing(self, client, sample_scan):
        r = client.delete(f"/api/scans/{sample_scan.id}")
        assert r.status_code == 200
        assert r.json()["ok"] is True
        # Verify gone
        assert client.get(f"/api/scans/{sample_scan.id}").status_code == 404

    def test_delete_not_found(self, client):
        r = client.delete("/api/scans/999")
        assert r.status_code == 404


# ── PATCH /api/scans/{id} ──────────────────────────────────────


class TestUpdateScan:
    def test_patch_single_field(self, client, sample_scan):
        r = client.patch(
            f"/api/scans/{sample_scan.id}", json={"weight": 95.0}
        )
        assert r.status_code == 200
        assert r.json()["weight"] == 95.0

    def test_patch_multiple_fields(self, client, sample_scan):
        r = client.patch(
            f"/api/scans/{sample_scan.id}",
            json={"weight": 95.0, "bmi": 27.5},
        )
        data = r.json()
        assert data["weight"] == 95.0
        assert data["bmi"] == 27.5

    def test_patch_preserves_unset_fields(self, client, sample_scan):
        r = client.patch(
            f"/api/scans/{sample_scan.id}", json={"weight": 95.0}
        )
        assert r.json()["patient_name"] == "Matus Pavliscak"

    def test_patch_not_found(self, client):
        r = client.patch("/api/scans/999", json={"weight": 95.0})
        assert r.status_code == 404


# ── DELETE /api/scans (clear all) ──────────────────────────────


class TestClearAllScans:
    def test_clear_empty(self, client):
        r = client.delete("/api/scans")
        assert r.status_code == 200
        assert r.json() == {"ok": True, "deleted": 0}

    def test_clear_with_data(self, client, sample_scan):
        r = client.delete("/api/scans")
        assert r.json()["deleted"] == 1
        assert client.get("/api/scans").json() == []

    def test_clear_removes_goals(self, client, sample_scan):
        client.put("/api/goals", json={"target_weight": 78.0})
        client.delete("/api/scans")
        r = client.get("/api/goals")
        assert r.json()["target_weight"] is None


# ── GET /api/goals ──────────────────────────────────────────────


class TestGetGoals:
    def test_empty_goals(self, client):
        r = client.get("/api/goals")
        assert r.status_code == 200
        assert r.json() == {"target_weight": None, "target_pbf": None}


# ── PUT /api/goals ──────────────────────────────────────────────


class TestSetGoals:
    def test_set_both(self, client):
        r = client.put(
            "/api/goals",
            json={"target_weight": 78.0, "target_pbf": 15.0},
        )
        assert r.status_code == 200
        assert r.json() == {"target_weight": 78.0, "target_pbf": 15.0}

    def test_goals_persist(self, client):
        client.put("/api/goals", json={"target_weight": 78.0})
        r = client.get("/api/goals")
        assert r.json()["target_weight"] == 78.0

    def test_partial_goals(self, client):
        r = client.put("/api/goals", json={"target_weight": 78.0})
        assert r.json()["target_pbf"] is None


# ── POST /api/sample-data ──────────────────────────────────────


class TestSampleData:
    def test_seed(self, client):
        r = client.post("/api/sample-data")
        assert r.status_code == 200
        assert r.json()["count"] == 14
        assert len(client.get("/api/scans").json()) == 14

    def test_seed_sets_goals(self, client):
        client.post("/api/sample-data")
        goals = client.get("/api/goals").json()
        assert goals["target_weight"] == 78.0
        assert goals["target_pbf"] == 15.0

    def test_seed_rejects_if_data_exists(self, client, sample_scan):
        r = client.post("/api/sample-data")
        assert r.status_code == 400


# ── GET /api/trends ─────────────────────────────────────────────


class TestTrends:
    def test_empty(self, client):
        r = client.get("/api/trends")
        assert r.status_code == 200
        assert r.json() == []

    def test_with_data(self, client, sample_scan):
        r = client.get("/api/trends")
        data = r.json()
        assert len(data) == 1
        assert data[0]["test_date"] == "2025-07-24"
        assert data[0]["weight"] == 96.9

    def test_ordered_asc(self, client, db_session):
        db_session.add(Scan(test_date="2025-08-01", weight=95.0))
        db_session.add(Scan(test_date="2025-06-01", weight=97.0))
        db_session.commit()
        r = client.get("/api/trends")
        dates = [t["test_date"] for t in r.json()]
        assert dates == ["2025-06-01", "2025-08-01"]

    def test_trend_fields(self, client, sample_scan):
        data = client.get("/api/trends").json()[0]
        expected_keys = {
            "test_date", "weight", "smm", "pbf", "bmi",
            "body_fat_mass", "total_body_water", "inbody_score",
            "visceral_fat_level", "basal_metabolic_rate", "waist_hip_ratio",
        }
        assert set(data.keys()) == expected_keys


# ── POST /api/upload (error cases) ─────────────────────────────


class TestUploadErrors:
    def test_unsupported_file_type(self, client):
        r = client.post(
            "/api/upload",
            files={"file": ("test.txt", b"hello", "text/plain")},
        )
        assert r.status_code == 400
        assert "Unsupported" in r.json()["detail"]
