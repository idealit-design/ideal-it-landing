from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import ConfigDict, Field, model_validator
from sqlmodel import SQLModel


PaymentMethod = Literal["EFECTIVO", "TARJETA_SIMULADA", "QR_SIMULADO"]


class CajaAperturaCreate(SQLModel):
    monto_inicial: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class CajaCierreCreate(SQLModel):
    monto_cierre_declarado: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class VentaItemCreate(SQLModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(gt=0, le=999)


class PagoCreate(SQLModel):
    medio: PaymentMethod
    monto: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class VentaCreate(SQLModel):
    items: list[VentaItemCreate] = Field(min_length=1)
    pagos: list[PagoCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_entries(self) -> "VentaCreate":
        product_ids = [item.producto_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Cada producto debe aparecer una sola vez en el detalle.")
        methods = [payment.medio for payment in self.pagos]
        if len(methods) != len(set(methods)):
            raise ValueError("Cada medio de pago debe aparecer una sola vez.")
        return self


class ProductoRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    nombre: str
    categoria: str
    precio: Decimal
    activo: bool


class DetalleVentaRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    nombre_producto: str
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal


class MedioPagoRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medio: str
    monto: Decimal
    monto_recibido: Decimal


class VentaRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caja_id: int
    fecha: datetime
    total: Decimal
    vuelto: Decimal
    detalles: list[DetalleVentaRead]
    medios_pago: list[MedioPagoRead]


class CajaRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha_apertura: datetime
    monto_inicial: Decimal
    estado: str


class CajaReporte(SQLModel):
    caja_id: int
    fecha_apertura: datetime
    monto_inicial: Decimal
    ventas_total: Decimal
    ventas_cantidad: int
    efectivo_aplicado: Decimal
    tarjeta_simulada: Decimal
    qr_simulado: Decimal
    efectivo_esperado: Decimal


class CajaCierreRead(CajaReporte):
    fecha_cierre: datetime
    monto_cierre_declarado: Decimal
    diferencia: Decimal
