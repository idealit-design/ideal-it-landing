import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class TipoTramiteResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str


class TipoTramiteCreate(BaseModel):
    nombre: str = Field(min_length=3, max_length=100)
    descripcion: str = Field(default="", max_length=240)

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El nombre del tipo es obligatorio.")
        return normalized


class EstadoUpdate(BaseModel):
    estado: str = Field(min_length=1, max_length=40)
    observacion: str = Field(default="", max_length=240)


class PersonaSolicitud(BaseModel):
    documento: str = Field(min_length=7, max_length=11)
    nombre: str = Field(min_length=2, max_length=120)

    @field_validator("documento")
    @classmethod
    def documento_numerico(cls, value: str) -> str:
        if not re.fullmatch(r"\d{7,11}", value):
            raise ValueError("El DNI/CUIT debe contener entre 7 y 11 dígitos.")
        return value

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("El nombre es obligatorio.")
        return value.strip()


class TramiteCreate(PersonaSolicitud):
    tipo: str | None = Field(default=None, min_length=3, max_length=100)
    tipo_id: int | None = Field(default=None, gt=0)
    descripcion: str = Field(min_length=5, max_length=2000)

    @model_validator(mode="after")
    def requiere_tipo(self) -> "TramiteCreate":
        if self.tipo is None and self.tipo_id is None:
            raise ValueError("Seleccioná un tipo de trámite.")
        if self.tipo is not None and self.tipo_id is not None:
            raise ValueError("Indicá el tipo de trámite una sola vez.")
        if self.tipo is not None:
            self.tipo = self.tipo.strip()
            if not self.tipo:
                raise ValueError("El tipo de trámite es obligatorio.")
        return self


class ReclamoCreate(PersonaSolicitud):
    asunto: str = Field(min_length=3, max_length=120)
    descripcion: str = Field(min_length=5, max_length=2000)
    ubicacion: str | None = Field(default=None, max_length=180)


class SolicitudResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    codigo: str
    tipo: str
    descripcion: str
    estado: str
    creado_en: datetime


class ReclamoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    codigo: str
    asunto: str
    descripcion: str
    ubicacion: str | None
    estado: str
    creado_en: datetime


class EstadoHistorialResponse(BaseModel):
    estado: str
    descripcion: str
    actualizado_en: datetime
    observacion: str


class SeguimientoResponse(BaseModel):
    codigo: str
    recurso: str
    titulo: str
    descripcion: str
    estado_actual: str
    creado_en: datetime
    historial: list[EstadoHistorialResponse]


class TurnoCreate(PersonaSolicitud):
    motivo: str = Field(min_length=3, max_length=100)
    fecha_hora: datetime
    sede: str = Field(min_length=3, max_length=120)

    @field_validator("fecha_hora")
    @classmethod
    def fecha_hora_con_zona(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("La fecha y hora deben incluir zona horaria.")
        return value


class TurnoResponse(BaseModel):
    codigo: str
    motivo: str
    fecha_hora: datetime
    sede: str
    ciudadano_documento: str
