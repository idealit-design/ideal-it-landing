import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_session
from app.models import Afiliado, InspeccionCampo, Inspector
from app.schemas import InspeccionCreate, InspeccionOut, InspectorCreate, InspectorOut


router = APIRouter(tags=["inspectores e inspecciones"])


@router.get("/api/inspectores", response_model=list[InspectorOut])
def list_inspectors(session: Session = Depends(get_session)) -> list[Inspector]:
    return list(session.scalars(select(Inspector).order_by(Inspector.nombre)))


@router.post(
    "/api/inspectores",
    response_model=InspectorOut,
    status_code=status.HTTP_201_CREATED,
)
def create_inspector(
    payload: InspectorCreate, session: Session = Depends(get_session)
) -> Inspector:
    inspector = Inspector(**payload.model_dump())
    session.add(inspector)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(status_code=409, detail="El legajo ya está registrado.") from error
    session.refresh(inspector)
    return inspector


def inspection_out(inspection: InspeccionCampo) -> InspeccionOut:
    return InspeccionOut(
        id=inspection.id,
        inspector_id=inspection.inspector_id,
        inspector_nombre=inspection.inspector.nombre,
        afiliado_dni=inspection.afiliado_dni,
        afiliado_nombre=inspection.afiliado.nombre_apellido,
        fecha_inspeccion=inspection.fecha_inspeccion,
        observaciones=inspection.observaciones,
        estado_planillla=inspection.estado_planillla,
        datos_json=json.loads(inspection.datos_json),
    )


@router.get("/api/inspecciones", response_model=list[InspeccionOut])
def list_inspections(
    inspector_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[InspeccionOut]:
    statement = (
        select(InspeccionCampo)
        .options(joinedload(InspeccionCampo.inspector), joinedload(InspeccionCampo.afiliado))
        .order_by(InspeccionCampo.fecha_inspeccion.desc(), InspeccionCampo.id.desc())
    )
    if inspector_id is not None:
        statement = statement.where(InspeccionCampo.inspector_id == inspector_id)
    return [inspection_out(row) for row in session.scalars(statement).all()]


@router.post(
    "/api/inspecciones",
    response_model=InspeccionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_inspection(
    payload: InspeccionCreate, session: Session = Depends(get_session)
) -> InspeccionOut:
    inspector = session.get(Inspector, payload.inspector_id)
    if inspector is None:
        raise HTTPException(status_code=404, detail="No existe el inspector indicado.")
    affiliate = session.get(Afiliado, payload.afiliado_dni)
    if affiliate is None:
        raise HTTPException(status_code=404, detail="No existe el afiliado indicado.")
    if affiliate.estado != "ACTIVO":
        raise HTTPException(status_code=409, detail="La cobertura del afiliado está suspendida.")

    inspection = InspeccionCampo(
        **payload.model_dump(exclude={"datos_json"}),
        datos_json=json.dumps(payload.datos_json, ensure_ascii=False),
        estado_planillla="COMPLETA",
    )
    session.add(inspection)
    session.commit()
    session.refresh(inspection)
    return inspection_out(inspection)
