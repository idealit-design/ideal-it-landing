from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models import BiometricMark, Person
from app.services.sim_service import SimulationRequest, generate_frame

router = APIRouter(prefix="/api/biometric", tags=["Simulador biométrico"])


@router.post("/simular", status_code=201)
def simulate_mark(
    payload: SimulationRequest, session: Session = Depends(get_session)
) -> dict[str, object]:
    if payload.dni:
        person = session.get(Person, payload.dni)
    else:
        person = session.scalar(
            select(Person)
            .where(Person.activo.is_(True))
            .order_by(Person.dni)
            .limit(1)
        )
    if person is None or not person.activo:
        raise HTTPException(
            status_code=404,
            detail="No existe una persona activa para la simulación.",
        )
    frame = generate_frame(payload, person.dni)
    mark = BiometricMark(**frame)
    session.add(mark)
    session.commit()
    session.refresh(mark)
    return _mark_dict(mark)


def _mark_dict(mark: BiometricMark) -> dict[str, object]:
    return {
        "id": mark.id,
        "dni": mark.dni,
        "ip_dispositivo": mark.ip_dispositivo,
        "marca_tiempo": mark.marca_tiempo.isoformat(),
        "tipo_evento": mark.tipo_evento,
        "estado_verificacion": mark.estado_verificacion,
        "dispositivo_modelo": mark.dispositivo_modelo,
        "simulado": True,
    }
