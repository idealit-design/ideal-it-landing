import base64

from fastapi.testclient import TestClient

from app.main import app


def test_audit_module_local_workflow(monkeypatch, tmp_path):
    database_path = tmp_path / "auditoria_mvp.db"
    storage_path = tmp_path / "storage"
    monkeypatch.setenv("AUDITORIA_MVP_DATABASE_PATH", str(database_path))
    monkeypatch.setenv("AUDITORIA_MVP_STORAGE_PATH", str(storage_path))

    with TestClient(app) as client:
        provider = client.post(
            "/api/validaciones/prestadores",
            json={
                "dni": "12345678",
                "nombre": "Ada",
                "apellido": "Lovelace",
                "cuit": "20123456789",
                "especialidad": "Cardiología",
            },
        )
        assert provider.status_code == 201
        assert client.get("/api/validaciones/renaper/12345678").json()["origen"] == "MOCK_LOCAL"
        assert client.get("/api/validaciones/matricula/12345678").json()["estado"] == "ACTIVA"

        catalog = client.post(
            "/api/nomenclador",
            json={
                "codigo": "CARD-01",
                "descripcion": "Consulta cardiológica",
                "especialidad": "Cardiología",
                "requisitos_exigidos": "Orden médica, Informe clínico",
            },
        )
        assert catalog.status_code == 201
        assert len(client.get("/api/nomenclador", params={"especialidad": "cardio"}).json()) == 1

        case = client.post(
            "/api/casos",
            json={"dni_prestador": "12345678", "codigo_nomenclador": "CARD-01"},
        )
        assert case.status_code == 201
        denied = client.patch(
            f"/api/casos/{case.json()['id']}", json={"estado_autorizacion": "APROBADO"}
        )
        assert denied.status_code == 409

        for document_type, name in (("ORDEN", "orden.pdf"), ("INFORME", "informe.png")):
            upload = client.post(
                "/api/boveda",
                json={
                    "dni_prestador": "12345678",
                    "nombre_archivo": name,
                    "tipo_documento": document_type,
                    "contenido_base64": base64.b64encode(b"demo").decode(),
                },
            )
            assert upload.status_code == 201
            content = client.get(upload.json()["url_contenido"])
            assert content.content == b"demo"

        approved = client.patch(
            f"/api/casos/{case.json()['id']}", json={"estado_autorizacion": "APROBADO"}
        )
        assert approved.status_code == 200
        assert approved.json()["estado_autorizacion"] == "APROBADO"
        assert client.get("/health").json()["mvp"] == "auditoria"

    assert database_path.exists()
    assert len(list(storage_path.iterdir())) == 2
