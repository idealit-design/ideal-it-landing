from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_session
from app.models import CitizenRegistration, Organizer, TourismEvent
from app.schemas import EventCreate, EventOut, EventUpdate, OrganizerCreate, OrganizerOut

router = APIRouter(tags=["eventos"])


@router.get("/api/organizadores", response_model=list[OrganizerOut])
def list_organizers(session: Session = Depends(get_session)) -> list[Organizer]:
    return list(session.scalars(select(Organizer).order_by(Organizer.nombre)))


@router.post(
    "/api/organizadores",
    response_model=OrganizerOut,
    status_code=status.HTTP_201_CREATED,
)
def create_organizer(
    payload: OrganizerCreate, session: Session = Depends(get_session)
) -> Organizer:
    organizer = Organizer(**payload.model_dump())
    session.add(organizer)
    session.commit()
    session.refresh(organizer)
    return organizer


def serialize_event(event: TourismEvent, registration_count: int) -> EventOut:
    return EventOut(
        id=event.id,
        organizador_id=event.organizador_id,
        organizador_nombre=event.organizador.nombre,
        categoria_organizador=event.organizador.categoria,
        titulo=event.titulo,
        descripcion=event.descripcion,
        fecha_evento=event.fecha_evento,
        cupo_maximo=event.cupo_maximo,
        requiere_aprobacion=event.requiere_aprobacion,
        inscriptos=registration_count,
        cupos_disponibles=max(event.cupo_maximo - registration_count, 0),
    )


def event_registration_count(session: Session, event_id: int) -> int:
    return int(
        session.scalar(
            select(func.count(CitizenRegistration.id)).where(
                CitizenRegistration.evento_id == event_id,
                CitizenRegistration.estado != "RECHAZADO",
            )
        )
        or 0
    )


@router.get("/api/eventos", response_model=list[EventOut])
def list_events(session: Session = Depends(get_session)) -> list[EventOut]:
    events = session.scalars(
        select(TourismEvent)
        .options(joinedload(TourismEvent.organizador))
        .order_by(TourismEvent.fecha_evento)
    ).all()
    return [
        serialize_event(event, event_registration_count(session, event.id))
        for event in events
    ]


@router.post("/api/eventos", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, session: Session = Depends(get_session)) -> EventOut:
    organizer = session.get(Organizer, payload.organizador_id)
    if organizer is None:
        raise HTTPException(status_code=404, detail="No existe el organizador indicado.")
    event = TourismEvent(**payload.model_dump())
    session.add(event)
    session.commit()
    session.refresh(event)
    return serialize_event(event, 0)


@router.patch("/api/eventos/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    session: Session = Depends(get_session),
) -> EventOut:
    event = session.scalar(
        select(TourismEvent)
        .options(joinedload(TourismEvent.organizador))
        .where(TourismEvent.id == event_id)
    )
    if event is None:
        raise HTTPException(status_code=404, detail="No existe el evento solicitado.")

    updates = payload.model_dump(exclude_unset=True)
    if any(value is None for value in updates.values()):
        raise HTTPException(status_code=422, detail="Los campos enviados no admiten valores nulos.")
    if "organizador_id" in updates and session.get(Organizer, updates["organizador_id"]) is None:
        raise HTTPException(status_code=404, detail="No existe el organizador indicado.")
    if "cupo_maximo" in updates:
        registered = event_registration_count(session, event_id)
        if updates["cupo_maximo"] < registered:
            raise HTTPException(
                status_code=409,
                detail="El cupo no puede ser menor a las inscripciones vigentes.",
            )
    for field, value in updates.items():
        setattr(event, field, value)
    session.commit()
    session.refresh(event)
    return serialize_event(event, event_registration_count(session, event_id))


@router.delete("/api/eventos/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, session: Session = Depends(get_session)) -> Response:
    event = session.get(TourismEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="No existe el evento solicitado.")
    if session.scalar(
        select(func.count(CitizenRegistration.id)).where(
            CitizenRegistration.evento_id == event_id
        )
    ):
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar un evento con inscripciones; conserve su historial.",
        )
    session.delete(event)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
