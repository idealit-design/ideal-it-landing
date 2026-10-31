from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models import BiometricMark, Person

router = APIRouter(prefix="/api/asistencia", tags=["Asistencia"])


@router.get("/{dni}")
def attendance_history(
    dni: str,
    limite: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(get_session),
) -> dict[str, object]:
    person = session.get(Person, dni)
    if person is None:
        raise HTTPException(status_code=404, detail="No existe personal con ese DNI.")
    marks = session.scalars(
        select(BiometricMark)
        .where(BiometricMark.dni == dni)
        .order_by(BiometricMark.marca_tiempo.desc())
        .limit(limite)
    ).all()
    return {
        "dni": dni,
        "historial": [
            {
                "id": mark.id,
                "ip_dispositivo": mark.ip_dispositivo,
                "marca_tiempo": mark.marca_tiempo.isoformat(),
                "tipo_evento": mark.tipo_evento,
                "estado_verificacion": mark.estado_verificacion,
                "dispositivo_modelo": mark.dispositivo_modelo,
            }
            for mark in marks
        ],
    }
