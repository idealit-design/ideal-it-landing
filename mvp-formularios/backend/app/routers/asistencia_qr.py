from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_session
from app.models import CitizenRegistration
from app.schemas import AttendanceScan, RegistrationStatus
from app.services.qr_service import validate_qr_format

router = APIRouter(prefix="/api/asistencia", tags=["asistencia QR"])


@router.post("/validar")
def validate_attendance(
    payload: AttendanceScan,
    session: Session = Depends(get_session),
) -> dict[str, str | int | bool]:
    code = validate_qr_format(payload.codigo_qr)
    registration = session.scalar(
        select(CitizenRegistration)
        .options(joinedload(CitizenRegistration.evento))
        .where(CitizenRegistration.codigo_qr == code)
    )
    if registration is None or registration.estado != RegistrationStatus.APROBADO:
        raise HTTPException(status_code=404, detail="QR inválido o inscripción no aprobada.")
    if registration.asistencia_confirmada:
        raise HTTPException(status_code=409, detail="La asistencia ya fue registrada.")

    registration.asistencia_confirmada = True
    session.commit()
    return {
        "asistencia_confirmada": True,
        "inscripcion_id": registration.id,
        "nombre_apellido": registration.nombre_apellido,
        "evento": registration.evento.titulo,
        "fecha_hora": datetime.now().isoformat(timespec="seconds"),
    }
