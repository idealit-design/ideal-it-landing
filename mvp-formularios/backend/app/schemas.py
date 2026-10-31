from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrganizerCategory(StrEnum):
    MUSEO = "MUSEO"
    BOLICHE = "BOLICHE"
    RESTAURANTE = "RESTAURANTE"
    SECRETARIA_MUNICIPAL = "SECRETARIA_MUNICIPAL"


class RegistrationStatus(StrEnum):
    PENDIENTE = "PENDIENTE"
    APROBADO = "APROBADO"
    RECHAZADO = "RECHAZADO"


class OrganizerCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    categoria: OrganizerCategory
    contacto: str = Field(min_length=3, max_length=160)


class OrganizerOut(OrganizerCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class EventCreate(BaseModel):
    organizador_id: int = Field(gt=0)
    titulo: str = Field(min_length=3, max_length=160)
    descripcion: str = Field(default="", max_length=5000)
    fecha_evento: datetime
    cupo_maximo: int = Field(gt=0, le=100_000)
    requiere_aprobacion: bool = False


class EventUpdate(BaseModel):
    organizador_id: int | None = Field(default=None, gt=0)
    titulo: str | None = Field(default=None, min_length=3, max_length=160)
    descripcion: str | None = Field(default=None, max_length=5000)
    fecha_evento: datetime | None = None
    cupo_maximo: int | None = Field(default=None, gt=0, le=100_000)
    requiere_aprobacion: bool | None = None


class EventOut(BaseModel):
    id: int
    organizador_id: int
    organizador_nombre: str
    categoria_organizador: OrganizerCategory
    titulo: str
    descripcion: str
    fecha_evento: datetime
    cupo_maximo: int
    requiere_aprobacion: bool
    inscriptos: int
    cupos_disponibles: int


class RegistrationCreate(BaseModel):
    dni_ciudadano: str = Field(min_length=6, max_length=20, pattern=r"^[0-9]+$")
    nombre_apellido: str = Field(min_length=3, max_length=160)
    email: EmailStr


class RegistrationOut(BaseModel):
    id: int
    evento_id: int
    evento_titulo: str
    dni_ciudadano: str
    nombre_apellido: str
    email: EmailStr
    estado: RegistrationStatus
    codigo_qr: str | None
    qr_data_url: str | None
    asistencia_confirmada: bool


class RegistrationDecision(BaseModel):
    estado: RegistrationStatus


class AttendanceScan(BaseModel):
    codigo_qr: str = Field(min_length=10, max_length=80)
