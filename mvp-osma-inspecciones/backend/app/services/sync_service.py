import json
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Afiliado, InspeccionCampo, Inspector
from app.schemas import SyncInspectionIn, SyncResult, SyncedInspectionOut


def normalized_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def sync_inspections(
    session: Session, records: list[SyncInspectionIn]
) -> SyncResult:
    existing_by_client_id: dict[str, InspeccionCampo] = {}
    existing_rows = session.scalars(
        select(InspeccionCampo).options(
            joinedload(InspeccionCampo.inspector), joinedload(InspeccionCampo.afiliado)
        )
    ).all()
    for row in existing_rows:
        stored_data: dict[str, Any] = json.loads(row.datos_json)
        client_id = stored_data.get("client_id")
        if isinstance(client_id, str):
            existing_by_client_id[client_id] = row

    results: list[SyncedInspectionOut] = []
    created = 0
    for record in records:
        existing = existing_by_client_id.get(record.client_id)
        if existing is not None:
            expected_data = record.datos_json.copy()
            expected_data["client_id"] = record.client_id
            actual_data = json.loads(existing.datos_json)
            if (
                existing.inspector_id != record.inspector_id
                or existing.afiliado_dni != record.afiliado_dni
                or existing.fecha_inspeccion != normalized_utc(record.fecha_inspeccion)
                or existing.observaciones != record.observaciones
                or actual_data != expected_data
            ):
                raise HTTPException(
                    status_code=409,
                    detail=f"El identificador de sincronización {record.client_id} ya pertenece a otra inspección.",
                )
            results.append(
                SyncedInspectionOut(
                    client_id=record.client_id,
                    inspeccion_id=existing.id,
                    resultado="YA_SINCRONIZADA",
                )
            )
            continue

        if session.get(Inspector, record.inspector_id) is None:
            raise HTTPException(
                status_code=404,
                detail=f"No existe el inspector {record.inspector_id} para la sincronización.",
            )
        affiliate = session.get(Afiliado, record.afiliado_dni)
        if affiliate is None:
            raise HTTPException(
                status_code=404,
                detail=f"No existe el afiliado {record.afiliado_dni} para la sincronización.",
            )
        if affiliate.estado != "ACTIVO":
            raise HTTPException(
                status_code=409,
                detail=f"La cobertura del afiliado {record.afiliado_dni} está suspendida.",
            )

        data = record.datos_json.copy()
        data["client_id"] = record.client_id
        inspection = InspeccionCampo(
            inspector_id=record.inspector_id,
            afiliado_dni=record.afiliado_dni,
            fecha_inspeccion=normalized_utc(record.fecha_inspeccion),
            observaciones=record.observaciones,
            estado_planillla="COMPLETA",
            datos_json=json.dumps(data, ensure_ascii=False),
        )
        session.add(inspection)
        session.flush()
        inspection = session.scalar(
            select(InspeccionCampo)
            .options(
                joinedload(InspeccionCampo.inspector),
                joinedload(InspeccionCampo.afiliado),
            )
            .where(InspeccionCampo.id == inspection.id)
        )
        if inspection is None:
            raise RuntimeError("La inspección recién insertada no pudo recuperarse.")
        existing_by_client_id[record.client_id] = inspection
        results.append(
            SyncedInspectionOut(
                client_id=record.client_id,
                inspeccion_id=inspection.id,
                resultado="CREADA",
            )
        )
        created += 1

    session.commit()
    return SyncResult(
        creadas=created,
        duplicadas=len(results) - created,
        inspecciones=results,
    )
