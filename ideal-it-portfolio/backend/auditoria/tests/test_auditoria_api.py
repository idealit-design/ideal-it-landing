from fastapi.testclient import TestClient

from app.main import app


def test_auditoria_mock_workflows_use_an_independent_database(monkeypatch, tmp_path):
    database_path = tmp_path / "data" / "db" / "auditoria_mvp.db"
    monkeypatch.setenv("AUDITORIA_DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        assert client.get("/health").json()["mvp"] == "auditoria"

        documents = client.get("/api/auditoria/documents")
        assert documents.status_code == 200
        assert documents.json()[0]["demo_only"] is True

        renaper = client.get("/api/auditoria/registry/renaper/12345678")
        assert renaper.status_code == 200
        assert renaper.json()["simulated"] is True

        codes = client.get(
            "/api/auditoria/nomenclator",
            params={"specialty": "Cardiología", "q": "SIM-CAR"},
        )
        assert codes.status_code == 200
        assert [item["code"] for item in codes.json()] == ["SIM-CAR-001"]

        case = client.post(
            "/api/auditoria/cases",
            json={
                "specialty": "Cardiología",
                "nomenclator_code": "SIM-CAR-001",
                "notes": "Prueba ficticia",
            },
        )
        assert case.status_code == 201

        invalid_case = client.post(
            "/api/auditoria/cases",
            json={
                "specialty": "Clínica médica",
                "nomenclator_code": "SIM-CAR-001",
                "notes": "",
            },
        )
        assert invalid_case.status_code == 422

    assert database_path.exists()
    assert not (tmp_path / "data" / "db" / "personal_mvp.db").exists()
