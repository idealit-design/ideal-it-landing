from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch) -> Iterator[TestClient]:
    monkeypatch.setenv(
        "OSMA_MVP_DATABASE_PATH",
        str(tmp_path / "osma_test.db"),
    )
    with TestClient(app) as test_client:
        yield test_client


def test_health_and_isolated_schema(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "mvp": "osma-inspecciones",
        "version": "0.1.1",
    }

    from app.core.database import get_engine
    from sqlalchemy import inspect

    schema = inspect(get_engine())
    assert {"inspectores", "afiliados", "inspecciones_campo"} <= set(schema.get_table_names())
    columns = {column["name"] for column in schema.get_columns("inspecciones_campo")}
    assert "estado_planillla" in columns


def test_affiliate_search_and_suspended_coverage_validation(client: TestClient) -> None:
    response = client.get("/api/afiliados", params={"q": "30000001"})
    assert response.status_code == 200
    assert response.json()[0]["estado"] == "ACTIVO"

    payload = {
        "inspector_id": 1,
        "afiliado_dni": "30000003",
        "fecha_inspeccion": "2026-10-31T12:00:00",
        "observaciones": "",
        "datos_json": {"numero_acta": "SUSP-1"},
    }
    response = client.post("/api/inspecciones", json=payload)
    assert response.status_code == 409
    assert "suspendida" in response.json()["detail"]
    assert client.get("/api/inspecciones").json() == []


def test_offline_sync_is_idempotent_and_preserves_form_fields(client: TestClient) -> None:
    payload = [
        {
            "client_id": "demo-client-0001",
            "inspector_id": 1,
            "afiliado_dni": "30000001",
            "fecha_inspeccion": "2026-10-31T12:00:00Z",
            "observaciones": "Observación 1: documentación revisada",
            "datos_json": {
                "numero_acta": "000123",
                "direccion": "Calle de prueba 100",
                "nombre_contacto": "Contacto Demo",
                "cuit": "",
                "tipo": "nueva",
                "observacion1": "Documentación revisada",
                "observacion2": "",
            },
        }
    ]

    first_response = client.post("/api/sync/inspecciones", json=payload)
    second_response = client.post("/api/sync/inspecciones", json=payload)
    assert first_response.status_code == 200
    assert first_response.json()["creadas"] == 1
    assert second_response.status_code == 200
    assert second_response.json()["duplicadas"] == 1
    assert first_response.json()["inspecciones"][0]["inspeccion_id"] == second_response.json()[
        "inspecciones"
    ][0]["inspeccion_id"]

    inspections = client.get("/api/inspecciones").json()
    assert len(inspections) == 1
    assert inspections[0]["estado_planillla"] == "COMPLETA"
    assert inspections[0]["datos_json"]["numero_acta"] == "000123"
    assert inspections[0]["datos_json"]["client_id"] == "demo-client-0001"


def test_sync_rejects_reused_client_id_with_changed_payload(client: TestClient) -> None:
    record = {
        "client_id": "demo-client-conflict",
        "inspector_id": 1,
        "afiliado_dni": "30000001",
        "fecha_inspeccion": "2026-10-31T12:00:00",
        "observaciones": "",
        "datos_json": {"numero_acta": "ACTA-1"},
    }
    assert client.post("/api/sync/inspecciones", json=[record]).status_code == 200

    changed = {**record, "datos_json": {"numero_acta": "ACTA-OTRA"}}
    response = client.post("/api/sync/inspecciones", json=[changed])
    assert response.status_code == 409


def test_inspector_registration_reports_duplicate_employee_number(client: TestClient) -> None:
    payload = {
        "nombre": "Inspector de prueba",
        "legajo": "DEMO-001",
        "zona_asignada": "Zona Norte",
    }
    response = client.post("/api/inspectores", json=payload)
    assert response.status_code == 409
