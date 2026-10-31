from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models import AuditedProvider

router = APIRouter(prefix="/api/validaciones", tags=["Validaciones mock"])


class ProviderInput(BaseModel):
    dni: str = Field(pattern=r"^\d{7,8}$")
    nombre: str = Field(min_length=1, max_length=80)
    apellido: str = Field(min_length=1, max_length=80)
    cuit: str = Field(pattern=r"^\d{11}$")
    especialidad: str = Field(min_length=2, max_length=100)
    estado_matricula: Literal["ACTIVA", "INACTIVA"] = "ACTIVA"
    estado_renaper: Literal["VALIDADO", "NO_VALIDADO"] = "VALIDADO"


@router.get("/prestadores")
def list_providers(session: Session = Depends(get_session)) -> list[dict[str, str]]:
    providers = session.scalars(
        select(AuditedProvider).order_by(AuditedProvider.apellido, AuditedProvider.nombre)
    ).all()
    return [_provider_dict(provider) for provider in providers]


@router.post("/prestadores", status_code=201)
def create_provider(
    payload: ProviderInput, session: Session = Depends(get_session)
) -> dict[str, str]:
    provider = AuditedProvider(**payload.model_dump())
    session.add(provider)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="DNI o CUIT duplicado.") from exc
    return _provider_dict(provider)


@router.get("/renaper/{dni}")
def validate_identity(dni: str, session: Session = Depends(get_session)) -> dict[str, str]:
    provider = _get_provider(dni, session)
    return {
        "dni": provider.dni,
        "estado": provider.estado_renaper,
        "nombre": provider.nombre,
        "apellido": provider.apellido,
        "origen": "MOCK_LOCAL",
    }


@router.get("/matricula/{dni}")
def validate_registration(dni: str, session: Session = Depends(get_session)) -> dict[str, str]:
    provider = _get_provider(dni, session)
    return {
        "dni": provider.dni,
        "estado": provider.estado_matricula,
        "especialidad": provider.especialidad,
        "origen": "MOCK_LOCAL",
    }


def _get_provider(dni: str, session: Session) -> AuditedProvider:
    provider = session.get(AuditedProvider, dni)
    if provider is None:
        raise HTTPException(status_code=404, detail="No existe el prestador.")
    return provider


def _provider_dict(provider: AuditedProvider) -> dict[str, str]:
    return {
        "dni": provider.dni,
        "nombre": provider.nombre,
        "apellido": provider.apellido,
        "cuit": provider.cuit,
        "especialidad": provider.especialidad,
        "estado_matricula": provider.estado_matricula,
        "estado_renaper": provider.estado_renaper,
    }
