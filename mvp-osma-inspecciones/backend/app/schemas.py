from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class InspectorCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    legajo: str = Field(min_length=1, max_length=40)
    zona_asignada: str = Field(min_length=1, max_length=120)


class InspectorOut(InspectorCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class AfiliadoOut(BaseModel):
    dni: str
    nombre_apellido: str
    plan_social: str
    estado: Literal["ACTIVO", "SUSPENDIDO"]


class InspeccionCreate(BaseModel):
    inspector_id: int = Field(gt=0)
    afiliado_dni: str = Field(min_length=1, max_length=20)
    fecha_inspeccion: datetime
    observaciones: str = Field(default="", max_length=10000)
    datos_json: dict[str, Any] = Field(default_factory=dict)


class SyncInspectionIn(InspeccionCreate):
    client_id: str = Field(min_length=1, max_length=80)


class InspeccionOut(BaseModel):
    id: int
    inspector_id: int
    inspector_nombre: str
    afiliado_dni: str
    afiliado_nombre: str
    fecha_inspeccion: datetime
    observaciones: str
    estado_planillla: Literal["COMPLETA", "PENDIENTE_SYNC"]
    datos_json: dict[str, Any]


class SyncedInspectionOut(BaseModel):
    client_id: str
    inspeccion_id: int
    resultado: Literal["CREADA", "YA_SINCRONIZADA"]


class SyncResult(BaseModel):
    creadas: int
    duplicadas: int
    inspecciones: list[SyncedInspectionOut]
