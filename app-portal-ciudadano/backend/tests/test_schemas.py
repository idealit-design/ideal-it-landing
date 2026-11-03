import pytest
from pydantic import ValidationError

from schemas import ReclamoCreate, TurnoCreate


def test_reclamo_valida_dni_cuit_y_normaliza_nombre():
    reclamo = ReclamoCreate(
        documento="30123456789",
        nombre="  Persona de prueba  ",
        asunto="Alumbrado",
        descripcion="Luminaria apagada en la esquina.",
    )

    assert reclamo.nombre == "Persona de prueba"
    assert reclamo.documento == "30123456789"


def test_reclamo_rechaza_documento_con_letras():
    with pytest.raises(ValidationError):
        ReclamoCreate(
            documento="DNI-123",
            nombre="Persona de prueba",
            asunto="Alumbrado",
            descripcion="Luminaria apagada.",
        )


def test_turno_requiere_fecha_con_zona_horaria():
    with pytest.raises(ValidationError):
        TurnoCreate(
            documento="12345678",
            nombre="Persona de prueba",
            motivo="Consulta general",
            fecha_hora="2030-01-01T10:00:00",
            sede="Sede central",
        )
