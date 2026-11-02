from pathlib import Path

from fastapi.testclient import TestClient
import pytest

from database import get_database_path
from main import app


def test_default_database_is_inside_the_module(monkeypatch):
    monkeypatch.delenv("FRIGORIFICO_DATABASE_PATH", raising=False)

    assert get_database_path() == Path(__file__).resolve().parents[1] / "data" / "db" / "frigorifico_mvp.db"


def test_database_path_rejects_other_subsystems(monkeypatch):
    outside_path = Path.home() / "frigorifico-other-subsystem.db"
    monkeypatch.setenv("FRIGORIFICO_DATABASE_PATH", str(outside_path))

    with pytest.raises(ValueError, match="dentro del módulo o del directorio temporal"):
        get_database_path()


def test_catalog_providers_intake_processing_and_report(monkeypatch, tmp_path):
    database_path = tmp_path / "frigorifico_test.db"
    monkeypatch.setenv("FRIGORIFICO_DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        assert client.get("/health").json()["mvp"] == "alantia-frigorifico"

        proveedor = client.post(
            "/api/proveedores",
            json={
                "razon_social": "Proveedor de prueba",
                "tipo": "FRIGORIFICO",
                "matricula_frigorifico": "TEST-001",
            },
        )
        assert proveedor.status_code == 201
        assert client.get("/api/proveedores").json()[0]["razon_social"] == "Proveedor de prueba"
        proveedor_extra = client.post(
            "/api/proveedores",
            json={"razon_social": "Proveedor secundario", "tipo": "OTRO"},
        )
        proveedor_actualizado = client.put(
            f"/api/proveedores/{proveedor_extra.json()['id']}",
            json={"razon_social": "Proveedor actualizado", "tipo": "AVICOLA"},
        )
        assert proveedor_actualizado.status_code == 200
        assert client.delete(f"/api/proveedores/{proveedor_extra.json()['id']}").status_code == 204

        media_res = client.post(
            "/api/catalogo",
            json={"nombre": "Media res de prueba", "tipo": "MEDIA_RES", "categoria": "Vacuno"},
        )
        corte = client.post(
            "/api/catalogo",
            json={"nombre": "Corte de prueba", "tipo": "CORTE", "categoria": "Vacuno"},
        )
        assert media_res.status_code == corte.status_code == 201
        assert client.get(f"/api/catalogo/{corte.json()['id']}").json()["nombre"] == "Corte de prueba"
        catalogo_extra = client.post(
            "/api/catalogo",
            json={"nombre": "Producto descartable", "tipo": "CORTE"},
        )
        catalogo_actualizado = client.put(
            f"/api/catalogo/{catalogo_extra.json()['id']}",
            json={"nombre": "Producto actualizado", "tipo": "ELABORADO", "categoria": "General"},
        )
        assert catalogo_actualizado.status_code == 200
        assert client.delete(f"/api/catalogo/{catalogo_extra.json()['id']}").status_code == 204

        ingreso = client.post(
            "/api/ingresos",
            json={
                "proveedor_id": proveedor.json()["id"],
                "catalogo_id": media_res.json()["id"],
                "fecha_faena": "2026-10-30",
                "numero_tropa": "T-TEST",
                "numero_garron": "G-TEST",
                "lateralidad": "I",
                "peso_kg": 120,
            },
        )
        assert ingreso.status_code == 201
        ingreso_id = ingreso.json()["id"]
        assert ingreso.json()["estado"] == "CAMARA"
        ingreso_actualizado = client.put(
            f"/api/ingresos/{ingreso_id}",
            json={
                "proveedor_id": proveedor.json()["id"],
                "catalogo_id": media_res.json()["id"],
                "fecha_faena": "2026-10-30",
                "numero_tropa": "T-TEST",
                "numero_garron": "G-TEST",
                "lateralidad": "I",
                "peso_kg": 120,
                "observaciones": "Corrección previa al desposte",
            },
        )
        assert ingreso_actualizado.status_code == 200
        assert ingreso_actualizado.json()["observaciones"] == "Corrección previa al desposte"
        assert client.get(f"/api/saldos/{media_res.json()['id']}").json()["cantidad_kg"] == 120

        invalid_desposte = client.post(
            "/api/despostes",
            json={
                "ingreso_id": ingreso_id,
                "items": [{"catalogo_id": corte.json()["id"], "peso_kg": 121}],
            },
        )
        assert invalid_desposte.status_code == 422

        desposte = client.post(
            "/api/despostes",
            json={
                "ingreso_id": ingreso_id,
                "items": [{"catalogo_id": corte.json()["id"], "peso_kg": 80}],
                "observaciones": "Procesamiento de prueba",
            },
        )
        assert desposte.status_code == 201
        assert desposte.json()[0]["ingreso_id"] == ingreso_id
        assert client.get(f"/api/ingresos/{ingreso_id}").json()["estado"] == "PARCIAL"
        assert client.get(f"/api/saldos/{media_res.json()['id']}").json()["cantidad_kg"] == 40
        assert client.get(f"/api/saldos/{corte.json()['id']}").json()["cantidad_kg"] == 80

        ajuste = client.put(
            f"/api/saldos/{corte.json()['id']}/ajuste",
            json={"saldo_fisico_kg": 78.5, "motivo": "Conteo físico de prueba"},
        )
        assert ajuste.status_code == 200
        assert ajuste.json()["saldo_anterior_kg"] == 80
        assert len(client.get(f"/api/saldos/{corte.json()['id']}/ajustes").json()) == 1

        trazabilidad = client.get("/api/despostes", params={"ingreso_id": ingreso_id})
        assert len(trazabilidad.json()) == 1
        reporte = client.get("/api/reportes/operativo").json()
        assert reporte["ingresos_registrados"] == 1
        assert reporte["kg_ingresados"] == 120
        assert reporte["kg_despostados"] == 80

        assert client.delete(f"/api/proveedores/{proveedor.json()['id']}").status_code == 409
        assert client.delete(f"/api/ingresos/{ingreso_id}").status_code == 409
        assert client.delete(f"/api/saldos/{corte.json()['id']}").status_code == 409
        zeroed = client.put(
            f"/api/saldos/{corte.json()['id']}",
            json={"saldo_fisico_kg": 0, "motivo": "Baja de stock de prueba"},
        )
        assert zeroed.status_code == 200
        assert client.delete(f"/api/saldos/{corte.json()['id']}").status_code == 204

        segundo_ingreso = client.post(
            "/api/ingresos",
            json={
                "proveedor_id": proveedor.json()["id"],
                "catalogo_id": media_res.json()["id"],
                "fecha_faena": "2026-10-30",
                "numero_tropa": "T-REVERSIBLE",
                "numero_garron": "G-REVERSIBLE",
                "lateralidad": "D",
                "peso_kg": 10,
            },
        )
        assert segundo_ingreso.status_code == 201
        assert client.delete(f"/api/ingresos/{segundo_ingreso.json()['id']}").status_code == 204

    assert database_path.exists()
