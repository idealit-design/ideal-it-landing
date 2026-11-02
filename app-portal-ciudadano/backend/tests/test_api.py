from datetime import datetime, timedelta, timezone


def test_health_y_creacion_y_seguimiento_de_reclamo(client):
    assert client.get("/health").json()["status"] == "ok"
    assert {item["nombre"] for item in client.get("/api/tipos-tramite").json()} >= {
        "Certificado de domicilio",
        "Habilitación comercial",
    }

    response = client.post(
        "/api/reclamos",
        json={
            "documento": "30123456789",
            "nombre": "Ciudadana Demo",
            "asunto": "Alumbrado público",
            "descripcion": "La luminaria de la plaza está apagada.",
            "ubicacion": "Plaza de prueba, esquina norte",
        },
    )

    assert response.status_code == 201
    codigo = response.json()["codigo"]
    assert len(codigo) == 16
    assert codigo.startswith("REC-")
    assert codigo[4:].isalnum()

    tracking = client.get(f"/api/seguimiento/{codigo.lower()}")
    assert tracking.status_code == 200
    assert tracking.json()["estado_actual"] == "Recibido"
    assert [item["estado"] for item in tracking.json()["historial"]] == ["Recibido"]
    assert len(client.get("/api/reclamos", params={"documento": "30123456789"}).json()) == 1

    updated = client.patch(
        f"/api/seguimiento/{codigo}/estado",
        json={"estado": "En Proceso", "observacion": "Asignado al área correspondiente."},
    )
    assert updated.status_code == 200
    assert updated.json()["estado_actual"] == "En Proceso"
    assert [item["estado"] for item in updated.json()["historial"]] == [
        "Recibido",
        "En Proceso",
    ]


def test_creacion_de_tramite_y_reserva_de_turno(client):
    tipos = client.get("/api/tipos-tramite").json()
    tramite = client.post(
        "/api/tramites",
        json={
            "documento": "12345678",
            "nombre": "Ciudadano Demo",
            "tipo_id": tipos[0]["id"],
            "descripcion": "Solicito iniciar el trámite de certificación.",
        },
    )
    assert tramite.status_code == 201
    assert tramite.json()["tipo"] == tipos[0]["nombre"]
    assert client.get(f"/api/seguimiento/{tramite.json()['codigo']}").json()["recurso"] == "Trámite"

    cita = client.post(
        "/api/turnos",
        json={
            "documento": "12345678",
            "nombre": "Ciudadano Demo",
            "motivo": "Consulta de trámite",
            "fecha_hora": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "sede": "Sede central",
        },
    )
    assert cita.status_code == 201
    assert cita.json()["ciudadano_documento"] == "12345678"
    turnos = client.get("/api/turnos", params={"documento": "12345678"}).json()
    assert len(turnos) == 1
    assert turnos[0]["fecha_hora"].endswith(("Z", "+00:00"))


def test_codigos_de_reclamos_son_unicos_y_tipo_invalido_no_se_crea(client):
    payload = {
        "documento": "30123456789",
        "nombre": "Ciudadana Demo",
        "asunto": "Alumbrado público",
        "descripcion": "La luminaria de la plaza está apagada.",
    }
    first = client.post("/api/reclamos", json=payload)
    second = client.post("/api/reclamos", json=payload)

    assert first.status_code == second.status_code == 201
    assert first.json()["codigo"] != second.json()["codigo"]

    invalid_type = client.post(
        "/api/tramites",
        json={
            "documento": "30123456789",
            "nombre": "Ciudadana Demo",
            "tipo_id": 9999,
            "descripcion": "Solicitud de prueba para validar el catálogo.",
        },
    )
    assert invalid_type.status_code == 404


def test_catalogo_permite_crear_tipos_y_rechaza_duplicados(client):
    payload = {
        "nombre": "  Permiso de obra  ",
        "descripcion": "Solicitud de permiso para una obra.",
    }
    created = client.post("/api/tipos-tramite", json=payload)

    assert created.status_code == 201
    assert created.json()["nombre"] == "Permiso de obra"
    assert any(
        item["id"] == created.json()["id"]
        for item in client.get("/api/tipos-tramite").json()
    )
    assert client.post("/api/tipos-tramite", json=payload).status_code == 409


def test_codigo_de_seguimiento_inexistente_responde_404(client):
    response = client.get("/api/seguimiento/REC-NO-EXISTE")

    assert response.status_code == 404


def test_actualizacion_rechaza_estado_desconocido(client):
    complaint = client.post(
        "/api/reclamos",
        json={
            "documento": "30123456789",
            "nombre": "Ciudadana Demo",
            "asunto": "Alumbrado público",
            "descripcion": "La luminaria de la plaza está apagada.",
        },
    )
    response = client.patch(
        f"/api/seguimiento/{complaint.json()['codigo']}/estado",
        json={"estado": "Archivado"},
    )
    assert response.status_code == 404
