from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models import NationalCatalogItem

router = APIRouter(prefix="/api/nomenclador", tags=["Nomenclador"])


class CatalogInput(BaseModel):
    codigo: str = Field(min_length=1, max_length=30)
    descripcion: str = Field(min_length=2, max_length=255)
    especialidad: str = Field(min_length=2, max_length=100)
    requisitos_exigidos: str = Field(default="", max_length=500)


@router.get("")
def list_catalog(
    especialidad: str | None = None,
    q: str | None = Query(default=None, max_length=100),
    session: Session = Depends(get_session),
) -> list[dict[str, str]]:
    query = select(NationalCatalogItem).order_by(NationalCatalogItem.codigo)
    if especialidad:
        query = query.where(NationalCatalogItem.especialidad.ilike(f"%{especialidad}%"))
    if q:
        query = query.where(
            or_(
                NationalCatalogItem.codigo.ilike(f"%{q}%"),
                NationalCatalogItem.descripcion.ilike(f"%{q}%"),
                NationalCatalogItem.especialidad.ilike(f"%{q}%"),
            )
        )
    return [_catalog_dict(item) for item in session.scalars(query).all()]


@router.post("", status_code=201)
def create_catalog_item(
    payload: CatalogInput, session: Session = Depends(get_session)
) -> dict[str, str]:
    item = NationalCatalogItem(**payload.model_dump())
    session.add(item)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="El código de nomenclador ya existe.") from exc
    return _catalog_dict(item)


def _catalog_dict(item: NationalCatalogItem) -> dict[str, str]:
    return {
        "codigo": item.codigo,
        "descripcion": item.descripcion,
        "especialidad": item.especialidad,
        "requisitos_exigidos": item.requisitos_exigidos,
    }
