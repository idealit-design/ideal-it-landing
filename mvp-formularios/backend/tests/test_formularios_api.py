from fastapi.testclient import TestClient

from app.main import app


def test_event_registration_approval_qr_and_attendance(monkeypatch, tmp_path):
    database_path = tmp_path / "formularios_mvp.db"
    monkeypatch.setenv("FORMULARIOS_MVP_DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        organizer = client.post(
            "/api/organizadores",
            json={
                "nombre": "Museo Municipal",
                "categoria": "MUSEO",
                "contacto": "museo@example.com",
            },
        )
        assert organizer.status_code == 201
        event = client.post(
            "/api/eventos",
            json={
                "organizador_id": organizer.json()["id"],
                "titulo": "Visita guiada",
                "descripcion": "Recorrido por el museo",
                "fecha_evento": "2027-01-15T18:00:00",
                "cupo_maximo": 2,
                "requiere_aprobacion": True,
            },
        )
        assert event.status_code == 201

        pending = client.post(
            f"/api/inscripciones?evento_id={event.json()['id']}",
            json={
                "dni_ciudadano": "12345678",
                "nombre_apellido": "Ada Lovelace",
                "email": "ada@example.com",
            },
        )
        assert pending.status_code == 201
        assert pending.json()["estado"] == "PENDIENTE"
        assert pending.json()["codigo_qr"] is None

        approved = client.patch(
            f"/api/inscripciones/{pending.json()['id']}/estado",
            json={"estado": "APROBADO"},
        )
        assert approved.status_code == 200
        assert approved.json()["estado"] == "APROBADO"
        assert approved.json()["qr_data_url"].startswith("data:image/png;base64,")
        refreshed = client.get(f"/api/inscripciones/{pending.json()['id']}")
        assert refreshed.json()["codigo_qr"] == approved.json()["codigo_qr"]

        rejected = client.post(
            f"/api/inscripciones?evento_id={event.json()['id']}",
            json={
                "dni_ciudadano": "87654321",
                "nombre_apellido": "Grace Hopper",
                "email": "grace@example.com",
            },
        ).json()
        assert client.patch(
            f"/api/inscripciones/{rejected['id']}/estado",
            json={"estado": "RECHAZADO"},
        ).json()["estado"] == "RECHAZADO"

        code = approved.json()["codigo_qr"]
        attendance = client.post("/api/asistencia/validar", json={"codigo_qr": code})
        assert attendance.status_code == 200
        assert attendance.json()["asistencia_confirmada"] is True
        assert attendance.json()["evento"] == "Visita guiada"
        assert client.post("/api/asistencia/validar", json={"codigo_qr": code}).status_code == 409
        assert client.get("/health").json()["version"] == "0.1.1"

    assert database_path.exists()


def test_immediate_approval_capacity_and_event_crud(monkeypatch, tmp_path):
    monkeypatch.setenv("FORMULARIOS_MVP_DATABASE_PATH", str(tmp_path / "formularios.db"))
    with TestClient(app) as client:
        organizer = client.post(
            "/api/organizadores",
            json={
                "nombre": "Secretaría de Turismo",
                "categoria": "SECRETARIA_MUNICIPAL",
                "contacto": "turismo@example.com",
            },
        ).json()
        event = client.post(
            "/api/eventos",
            json={
                "organizador_id": organizer["id"],
                "titulo": "Feria gastronómica",
                "fecha_evento": "2027-02-01T12:00:00",
                "cupo_maximo": 1,
                "requiere_aprobacion": False,
            },
        ).json()
        registration = client.post(
            f"/api/inscripciones?evento_id={event['id']}",
            json={
                "dni_ciudadano": "12345678",
                "nombre_apellido": "Ada Lovelace",
                "email": "ada@example.com",
            },
        )
        assert registration.status_code == 201
        assert registration.json()["estado"] == "APROBADO"
        assert registration.json()["codigo_qr"]
        assert client.post(
            f"/api/inscripciones?evento_id={event['id']}",
            json={
                "dni_ciudadano": "87654321",
                "nombre_apellido": "Grace Hopper",
                "email": "grace@example.com",
            },
        ).status_code == 409
        assert client.patch(
            f"/api/eventos/{event['id']}", json={"cupo_maximo": 2}
        ).json()["cupo_maximo"] == 2
        assert client.delete(f"/api/eventos/{event['id']}").status_code == 409
