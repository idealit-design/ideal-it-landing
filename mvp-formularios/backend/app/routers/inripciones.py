from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_session
from app.models import CitizenRegistration, TourismEvent
from app.routers.eventos import event_registration_count
from app.schemas import (
    RegistrationCreate,
    RegistrationDecision,
    RegistrationOut,
    RegistrationStatus,
)
from app.services.qr_service import generate_qr_token, qr_data_url

router = APIRouter(prefix="/api/inscripciones", tags=["inscripciones"])


def serialize_registration(registration: CitizenRegistration) -> RegistrationOut:
    return RegistrationOut(
        id=registration.id,
        evento_id=registration.evento_id,
        evento_titulo=registration.evento.titulo,
        dni_ciudadano=registration.dni_ciudadano,
        nombre_apellido=registration.nombre_apellido,
        email=registration.email,
        estado=registration.estado,
        codigo_qr=registration.codigo_qr,
        qr_data_url=qr_data_url(registration.codigo_qr) if registration.codigo_qr else None,
        asistencia_confirmada=registration.asistencia_confirmada,
    )


@router.get("", response_model=list[RegistrationOut])
def list_registrations(
    evento_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[RegistrationOut]:
    query = select(CitizenRegistration).options(joinedload(CitizenRegistration.evento))
    if evento_id is not None:
        query = query.where(CitizenRegistration.evento_id == evento_id)
    rows = session.scalars(query.order_by(CitizenRegistration.id.desc())).all()
    return [serialize_registration(row) for row in rows]


@router.get("/{registration_id}", response_model=RegistrationOut)
def get_registration(
    registration_id: int,
    session: Session = Depends(get_session),
) -> RegistrationOut:
    registration = session.scalar(
        select(CitizenRegistration)
        .options(joinedload(CitizenRegistration.evento))
        .where(CitizenRegistration.id == registration_id)
    )
    if registration is None:
        raise HTTPException(status_code=404, detail="No existe la inscripción solicitada.")
    return serialize_registration(registration)


@router.post("", response_model=RegistrationOut, status_code=status.HTTP_201_CREATED)
def create_registration(
    evento_id: int,
    payload: RegistrationCreate,
    session: Session = Depends(get_session),
) -> RegistrationOut:
    event = session.scalar(
        select(TourismEvent)
        .options(joinedload(TourismEvent.organizador))
        .where(TourismEvent.id == evento_id)
    )
    if event is None:
        raise HTTPException(status_code=404, detail="No existe el evento solicitado.")
    if session.scalar(
        select(CitizenRegistration.id).where(
            CitizenRegistration.evento_id == evento_id,
            CitizenRegistration.dni_ciudadano == payload.dni_ciudadano,
        )
    ):
        raise HTTPException(
            status_code=409,
            detail="Ya existe una inscripción para este DNI en el evento.",
        )
    if event_registration_count(session, evento_id) >= event.cupo_maximo:
        raise HTTPException(status_code=409, detail="El evento no tiene cupos disponibles.")

    approved = not event.requiere_aprobacion
    registration = CitizenRegistration(
        evento_id=evento_id,
        dni_ciudadano=payload.dni_ciudadano,
        nombre_apellido=payload.nombre_apellido,
        email=str(payload.email),
        estado=RegistrationStatus.APROBADO if approved else RegistrationStatus.PENDIENTE,
        codigo_qr=generate_qr_token() if approved else None,
    )
    session.add(registration)
    session.commit()
    session.refresh(registration)
    registration = session.scalar(
        select(CitizenRegistration)
        .options(joinedload(CitizenRegistration.evento))
        .where(CitizenRegistration.id == registration.id)
    )
    return serialize_registration(registration)


@router.patch("/{registration_id}/estado", response_model=RegistrationOut)
def decide_registration(
    registration_id: int,
    payload: RegistrationDecision,
    session: Session = Depends(get_session),
) -> RegistrationOut:
    if payload.estado == RegistrationStatus.PENDIENTE:
        raise HTTPException(status_code=422, detail="La decisión debe ser aprobar o rechazar.")
    registration = session.scalar(
        select(CitizenRegistration)
        .options(joinedload(CitizenRegistration.evento))
        .where(CitizenRegistration.id == registration_id)
    )
    if registration is None:
        raise HTTPException(status_code=404, detail="No existe la inscripción solicitada.")
    if registration.estado != RegistrationStatus.PENDIENTE:
        raise HTTPException(status_code=409, detail="La solicitud ya fue resuelta.")
    if payload.estado == RegistrationStatus.APROBADO:
        event = registration.evento
        if event_registration_count(session, event.id) > event.cupo_maximo:
            raise HTTPException(
                status_code=409,
                detail="No hay cupo disponible para aprobar esta inscripción.",
            )
        registration.codigo_qr = generate_qr_token()
    registration.estado = payload.estado
    session.commit()
    session.refresh(registration)
    return serialize_registration(registration)


@router.get("/{registration_id}/qr", response_model=dict[str, str])
def get_registration_qr(
    registration_id: int,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    registration = session.get(CitizenRegistration, registration_id)
    if registration is None:
        raise HTTPException(status_code=404, detail="No existe la inscripción solicitada.")
    if registration.estado != RegistrationStatus.APROBADO or not registration.codigo_qr:
        raise HTTPException(status_code=409, detail="La inscripción todavía no tiene un QR válido.")
    return {"codigo_qr": registration.codigo_qr, "qr_data_url": qr_data_url(registration.codigo_qr)}
