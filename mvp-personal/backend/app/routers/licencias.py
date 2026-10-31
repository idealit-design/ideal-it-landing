from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models import Leave, Person

router = APIRouter(prefix="/api/licencias", tags=["Licencias"])


class LeaveInput(BaseModel):
    dni: str = Field(pattern=r"^\d{7,8}$")
    tipo: Literal["MEDICA", "VACACION", "OTRO"]
    fecha_inicio: date
    fecha_fin: date
    motivo: str = Field(default="", max_length=300)
    estado: Literal["PENDING", "APPROVED", "REJECTED"] = "APPROVED"

    @model_validator(mode="after")
    def validate_date_range(self) -> "LeaveInput":
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError("fecha_fin no puede ser anterior a fecha_inicio.")
        return self


@router.get("")
def list_leaves(
    dni: str | None = None, session: Session = Depends(get_session)
) -> list[dict[str, object]]:
    query = select(Leave).order_by(Leave.fecha_inicio.desc(), Leave.id.desc())
    if dni:
        query = query.where(Leave.dni == dni)
    return [_leave_dict(leave) for leave in session.scalars(query).all()]


@router.post("", status_code=201)
def create_leave(payload: LeaveInput, session: Session = Depends(get_session)) -> dict[str, object]:
    if session.get(Person, payload.dni) is None:
        raise HTTPException(status_code=404, detail="No existe personal con ese DNI.")
    leave = Leave(**payload.model_dump())
    session.add(leave)
    session.commit()
    session.refresh(leave)
    return _leave_dict(leave)


def _leave_dict(leave: Leave) -> dict[str, object]:
    return {
        "id": leave.id,
        "dni": leave.dni,
        "tipo": leave.tipo,
        "fecha_inicio": leave.fecha_inicio.isoformat(),
        "fecha_fin": leave.fecha_fin.isoformat(),
        "motivo": leave.motivo,
        "estado": leave.estado,
    }
