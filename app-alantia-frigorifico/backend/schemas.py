from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TipoCatalogo = Literal["MEDIA_RES", "CORTE", "ELABORADO", "SUBPRODUCTO", "AVE"]
TipoProveedor = Literal["FRIGORIFICO", "AVICOLA", "OTRO"]


class ReadModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CatalogoCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    tipo: TipoCatalogo
    categoria: str = Field(default="General", min_length=1, max_length=80)
    unidad: str = Field(default="kg", min_length=1, max_length=12)
    activo: bool = True


class CatalogoRead(CatalogoCreate, ReadModel):
    id: int
    creado_en: datetime


class ProveedorCreate(BaseModel):
    razon_social: str = Field(min_length=2, max_length=160)
    tipo: TipoProveedor
    cuit: str | None = Field(default=None, max_length=20)
    matricula_frigorifico: str | None = Field(default=None, max_length=40)
    activo: bool = True


class ProveedorRead(ProveedorCreate, ReadModel):
    id: int
    creado_en: datetime


class IngresoCreate(BaseModel):
    proveedor_id: int = Field(gt=0)
    catalogo_id: int = Field(gt=0)
    fecha_faena: date
    numero_tropa: str = Field(min_length=1, max_length=40)
    numero_garron: str = Field(min_length=1, max_length=40)
    lateralidad: Literal["I", "D"]
    peso_kg: float = Field(gt=0, le=10000)
    observaciones: str | None = Field(default=None, max_length=1000)


class IngresoRead(IngresoCreate, ReadModel):
    id: int
    peso_restante_kg: float
    estado: Literal["CAMARA", "PARCIAL", "DESPOSTADA"]
    creado_en: datetime


class IngresoUpdate(IngresoCreate):
    pass


class DesposteItem(BaseModel):
    catalogo_id: int = Field(gt=0)
    peso_kg: float = Field(gt=0, le=10000)


class DesposteCreate(BaseModel):
    ingreso_id: int = Field(gt=0)
    items: list[DesposteItem] = Field(min_length=1, max_length=100)
    observaciones: str | None = Field(default=None, max_length=1000)


class DesposteRead(ReadModel):
    id: int
    operacion_id: str
    ingreso_id: int
    catalogo_id: int
    peso_kg: float
    observaciones: str | None
    creado_en: datetime


class SaldoRead(BaseModel):
    id: int
    catalogo_id: int
    producto: str
    tipo: TipoCatalogo
    cantidad_kg: float
    actualizado_en: datetime


class SaldoAjuste(BaseModel):
    saldo_fisico_kg: float = Field(ge=0, le=1000000)
    motivo: str = Field(min_length=3, max_length=240)


class SaldoAjusteRead(ReadModel):
    id: int
    catalogo_id: int
    saldo_anterior_kg: float
    saldo_fisico_kg: float
    motivo: str
    creado_en: datetime


class ReporteOperativo(BaseModel):
    desde: date | None
    hasta: date | None
    productos_activos: int
    ingresos_registrados: int
    kg_ingresados: float
    kg_despostados: float
    stock_total_kg: float
    stock_por_producto: list[SaldoRead]
