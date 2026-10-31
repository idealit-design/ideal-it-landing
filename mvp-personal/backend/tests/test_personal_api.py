from datetime import date

from fastapi.testclient import TestClient

from app.main import app


def test_personal_biometric_history_and_workday_reports(monkeypatch, tmp_path):
    database_path = tmp_path / "personal_mvp.db"
    monkeypatch.setenv("PERSONAL_MVP_DATABASE_PATH", str(database_path))

    with TestClient(app) as client:
        area = client.post(
            "/api/personal/areas",
            json={"nombre_area": "Administración", "piso": "1", "departamento": "RRHH"},
        )
        assert area.status_code == 201
        updated_area = client.patch(
            f"/api/personal/areas/{area.json()['id']}",
            json={"piso": "2"},
        )
        assert updated_area.status_code == 200
        assert updated_area.json()["piso"] == "2"
        person = client.post(
            "/api/personal",
            json={
                "dni": "12345678",
                "nombre": "Ada",
                "apellido": "Lovelace",
                "legajo": "A-001",
                "area_id": area.json()["id"],
            },
        )
        assert person.status_code == 201
        updated_person = client.patch(
            "/api/personal/12345678",
            json={"apellido": "Byron"},
        )
        assert updated_person.status_code == 200
        assert updated_person.json()["apellido"] == "Byron"
        justified_person = client.post(
            "/api/personal",
            json={
                "dni": "23456789",
                "nombre": "Grace",
                "apellido": "Hopper",
                "legajo": "A-002",
                "area_id": area.json()["id"],
            },
        )
        assert justified_person.status_code == 201
        absent_person = client.post(
            "/api/personal",
            json={
                "dni": "34567890",
                "nombre": "Katherine",
                "apellido": "Johnson",
                "legajo": "A-003",
                "area_id": area.json()["id"],
            },
        )
        assert absent_person.status_code == 201

        mark = client.post(
            "/api/biometric/simular",
            json={
                "dni": "12345678",
                "ip_dispositivo": "192.168.1.105",
                "tipo_evento": "ENTRADA",
                "estado_verificacion": "VERIFIED",
                "dispositivo_modelo": "Suprema",
                "marca_tiempo": "2026-10-30T09:00:00",
            },
        )
        assert mark.status_code == 201
        assert client.get("/api/asistencia/12345678").json()["historial"][0]["id"] == mark.json()["id"]

        failed_mark = client.post(
            "/api/biometric/simular",
            json={
                "dni": "34567890",
                "tipo_evento": "ENTRADA",
                "estado_verificacion": "FAILED",
                "marca_tiempo": "2026-10-30T09:00:00",
            },
        )
        assert failed_mark.status_code == 201

        leave = client.post(
            "/api/licencias",
            json={
                "dni": "12345678",
                "tipo": "VACACION",
                "fecha_inicio": "2026-10-30",
                "fecha_fin": "2026-10-30",
                "motivo": "Descanso",
            },
        )
        assert leave.status_code == 201

        justified_leave = client.post(
            "/api/licencias",
            json={
                "dni": "23456789",
                "tipo": "MEDICA",
                "fecha_inicio": "2026-10-30",
                "fecha_fin": "2026-10-30",
                "motivo": "Licencia aprobada",
            },
        )
        assert justified_leave.status_code == 201

        workday = client.get("/api/reportes/diario", params={"fecha": "2026-10-30"}).json()
        assert workday["resumen"] == {"presente": 1, "ausente": 1, "justificada": 1}
        assert {row["dni"]: row["estado"] for row in workday["registros"]} == {
            "12345678": "PRESENTE",
            "23456789": "JUSTIFICADA",
            "34567890": "AUSENTE",
        }

        daily = client.get("/api/reportes/diario", params={"fecha": "2026-10-31"}).json()
        assert daily["dia_habil"] is False
        assert daily["registros"] == []

        weekly = client.get("/api/reportes/semanal", params={"fecha": "2026-10-31"}).json()
        assert weekly["dias_incluidos"] == [
            "2026-10-26",
            "2026-10-27",
            "2026-10-28",
            "2026-10-29",
            "2026-10-30",
        ]
        assert all(date.fromisoformat(day).weekday() < 5 for day in weekly["dias_incluidos"])

    assert database_path.exists()
