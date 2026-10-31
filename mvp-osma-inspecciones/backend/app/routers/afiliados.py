from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models import Afiliado
from app.schemas import AfiliadoOut


router = APIRouter(tags=["afiliados"])


@router.get("/api/afiliados", response_model=list[AfiliadoOut])
def search_affiliates(
    q: str = Query(default="", max_length=120),
    limit: int = Query(default=30, ge=1, le=100),
    session: Session = Depends(get_session),
) -> list[Afiliado]:
    statement = select(Afiliado).order_by(Afiliado.nombre_apellido).limit(limit)
    if q.strip():
        term = q.strip()
        statement = statement.where(
            or_(Afiliado.dni == term, Afiliado.nombre_apellido.ilike(f"%{term}%"))
        )
    return list(session.scalars(statement))
