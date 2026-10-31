from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.schemas import SyncInspectionIn, SyncResult
from app.services.sync_service import sync_inspections


router = APIRouter(tags=["sincronización"])


@router.get("/api/sync/estado")
def sync_status() -> dict[str, str]:
    return {"estado": "disponible"}


@router.post("/api/sync/inspecciones", response_model=SyncResult)
def sync_inspection_batch(
    records: list[SyncInspectionIn] = Body(..., max_length=100),
    session: Session = Depends(get_session),
) -> SyncResult:
    return sync_inspections(session, records)
