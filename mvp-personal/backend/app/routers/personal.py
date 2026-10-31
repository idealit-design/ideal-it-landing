from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models import Area, Person

router = APIRouter(prefix="/api/personal", tags=["Personal"])


class AreaInput(BaseModel):
    nombre_area: str = Field(min_length=2, max_length=100)
    piso: str = Field(min_length=1, max_length=30)
    departamento: str = Field(min_length=2, max_length=100)


class AreaUpdate(BaseModel):
    nombre_area: str | None = Field(default=None, min_length=2, max_length=100)
    piso: str | None = Field(default=None, min_length=1, max_length=30)
    departamento: str | None = Field(default=None, min_length=2, max_length=100)


class PersonInput(BaseModel):
    dni: str = Field(pattern=r"^\d{7,8}$")
    nombre: str = Field(min_length=1, max_length=80)
    apellido: str = Field(min_length=1, max_length=80)
    legajo: str = Field(min_length=1, max_length=30)
    area_id: int | None = None
    activo: bool = True
    fecha_alta: date = Field(default_factory=date.today)


class PersonUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=80)
    apellido: str | None = Field(default=None, min_length=1, max_length=80)
    legajo: str | None = Field(default=None, min_length=1, max_length=30)
    area_id: int | None = None
    activo: bool | None = None


@router.get("/areas")
def list_areas(session: Session = Depends(get_session)) -> list[dict[str, object]]:
    areas = session.scalars(select(Area).order_by(Area.nombre_area)).all()
    return [
        {
            "id": area.id,
            "nombre_area": area.nombre_area,
            "piso": area.piso,
            "departamento": area.departamento,
            "fecha_creacion": area.fecha_creacion.isoformat() if area.fecha_creacion else None,
        }
        for area in areas
    ]


@router.post("/areas", status_code=201)
def create_area(payload: AreaInput, session: Session = Depends(get_session)) -> dict[str, object]:
    area = Area(**payload.model_dump())
    session.add(area)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Ya existe un área con ese nombre.") from exc
    session.refresh(area)
    return {
        "id": area.id,
        "nombre_area": area.nombre_area,
        "piso": area.piso,
        "departamento": area.departamento,
        "fecha_creacion": area.fecha_creacion.isoformat(),
    }


@router.patch("/areas/{area_id}")
def update_area(
    area_id: int, payload: AreaUpdate, session: Session = Depends(get_session)
) -> dict[str, object]:
    area = session.get(Area, area_id)
    if area is None:
        raise HTTPException(status_code=404, detail="No existe el área.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(area, field, value)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Ya existe un área con ese nombre.") from exc
    session.refresh(area)
    return {
        "id": area.id,
        "nombre_area": area.nombre_area,
        "piso": area.piso,
        "departamento": area.departamento,
        "fecha_creacion": area.fecha_creacion.isoformat(),
    }


@router.get("")
def list_people(
    dni: str | None = Query(default=None, pattern=r"^\d{7,8}$"),
    activo: bool | None = None,
    session: Session = Depends(get_session),
) -> list[dict[str, object]]:
    query = select(Person).order_by(Person.apellido, Person.nombre)
    if dni:
        query = query.where(Person.dni == dni)
    if activo is not None:
        query = query.where(Person.activo.is_(activo))
    return [_person_dict(person) for person in session.scalars(query).all()]


@router.post("", status_code=201)
def create_person(payload: PersonInput, session: Session = Depends(get_session)) -> dict[str, object]:
    person = Person(**payload.model_dump())
    session.add(person)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=409, detail="DNI o legajo duplicado, o el área no existe."
        ) from exc
    return _person_dict(person)


@router.patch("/{dni}")
def update_person(
    dni: str, payload: PersonUpdate, session: Session = Depends(get_session)
) -> dict[str, object]:
    person = session.get(Person, dni)
    if person is None:
        raise HTTPException(status_code=404, detail="No existe personal con ese DNI.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(person, field, value)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="El legajo ya existe o el área no existe.") from exc
    return _person_dict(person)


def _person_dict(person: Person) -> dict[str, object]:
    return {
        "dni": person.dni,
        "nombre": person.nombre,
        "apellido": person.apellido,
        "legajo": person.legajo,
        "area_id": person.area_id,
        "activo": person.activo,
        "fecha_alta": person.fecha_alta.isoformat(),
    }
