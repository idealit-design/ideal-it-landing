from fastapi.testclient import TestClient

from app.main import app


def test_personal_workflows_use_the_personal_database(monkeypatch, tmp_path):
    database_path = tmp_path / "data" / "db" / "personal_mvp.db"
    monkeypatch.setenv("PERSONAL_DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        assert client.get("/health").json()["mvp"] == "personal"

        areas = client.get("/api/personal/areas")
        assert areas.status_code == 200
        assert areas.json()[0]["name"] == "Área Demo"

        staff = client.post(
            "/api/personal/staff",
            json={"dni": "12345678", "full_name": "Persona de prueba", "area_id": 1},
        )
        assert staff.status_code == 201

        leave = client.post(
            "/api/personal/leaves",
            json={
                "dni": "12345678",
                "leave_type": "vacation",
                "start_date": "2026-10-12",
                "end_date": "2026-10-16",
            },
        )
        assert leave.status_code == 201

        report = client.get(
            "/api/personal/biometrics/reports",
            params={"period": "week", "dni": "12345678", "reference_date": "2026-10-14"},
        )
        assert report.status_code == 200
        assert report.json()["simulated"] is True
        assert len(report.json()["records"]) == 5

    assert database_path.exists()
    assert not (tmp_path / "data" / "db" / "auditoria_mvp.db").exists()
