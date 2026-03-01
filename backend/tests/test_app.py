from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_scans():
    response = client.get("/api/scans")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_goals():
    response = client.get("/api/goals")
    assert response.status_code == 200
