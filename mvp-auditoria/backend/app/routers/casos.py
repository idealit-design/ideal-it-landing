from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models import AuditedProvider, AuditCase, NationalCatalogItem
from app.services.audit_service import approval_issues

router = APIRouter(prefix="/api/casos", tags=["Casos de auditoría"])


class CaseInput(BaseModel):
    dni_prestador: str = Field(pattern=r"^\d{7,8}$")
    codigo_nomenclador: str = Field(min_length=1, max_length=30)
    observaciones: str = Field(default="", max_length=1000)
    auditor_id: str = Field(default="", max_length=80)


class CaseUpdate(BaseModel):
    estado_autorizacion: Literal["APROBADO", "RECHAZADO", "PENDIENTE"] | None = None
    observaciones: str | None = Field(default=None, max_length=1000)
    auditor_id: str | None = Field(default=None, max_length=80)


@router.get("")
def list_cases(
    dni_prestador: str | None = None, session: Session = Depends(get_session)
) -> list[dict[str, object]]:
    query = select(AuditCase).order_by(AuditCase.id.desc())
    if dni_prestador:
        query = query.where(AuditCase.dni_prestador == dni_prestador)
    return [_case_dict(case) for case in session.scalars(query).all()]


@router.post("", status_code=201)
def create_case(payload: CaseInput, session: Session = Depends(get_session)) -> dict[str, object]:
    if session.get(AuditedProvider, payload.dni_prestador) is None:
        raise HTTPException(status_code=404, detail="No existe el prestador.")
    if session.get(NationalCatalogItem, payload.codigo_nomenclador) is None:
        raise HTTPException(status_code=404, detail="No existe el código de nomenclador.")
    case = AuditCase(**payload.model_dump(), estado_autorizacion="PENDIENTE")
    session.add(case)
    session.commit()
    session.refresh(case)
    return _case_dict(case)


@router.patch("/{case_id}")
def update_case(
    case_id: int, payload: CaseUpdate, session: Session = Depends(get_session)
) -> dict[str, object]:
    case = session.get(AuditCase, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="No existe el caso.")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("estado_autorizacion") == "APROBADO":
        issues = approval_issues(session, case)
        if issues:
            raise HTTPException(status_code=409, detail=issues)
    for field, value in updates.items():
        setattr(case, field, value)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="No se pudo actualizar el caso.") from exc
    session.refresh(case)
    return _case_dict(case)


def _case_dict(case: AuditCase) -> dict[str, object]:
    return {
        "id": case.id,
        "dni_prestador": case.dni_prestador,
        "codigo_nomenclador": case.codigo_nomenclador,
        "estado_autorizacion": case.estado_autorizacion,
        "observaciones": case.observaciones,
        "auditor_id": case.auditor_id,
    }
