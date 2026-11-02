from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, Index, Numeric, text
from sqlmodel import Field, Relationship, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AperturaCaja(SQLModel, table=True):
    __table_args__ = (
        Index(
            "uq_apertura_caja_abierta",
            "estado",
            unique=True,
            sqlite_where=text("estado = 'ABIERTA'"),
        ),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    fecha_apertura: datetime = Field(default_factory=utc_now, nullable=False)
    monto_inicial: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )
    fecha_cierre: Optional[datetime] = Field(default=None)
    monto_cierre_declarado: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(Numeric(12, 2), nullable=True),
    )
    estado: str = Field(default="ABIERTA", index=True, max_length=20)

    ventas: list["Ventas"] = Relationship(back_populates="caja")


class Ventas(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    caja_id: int = Field(foreign_key="aperturacaja.id", index=True)
    fecha: datetime = Field(default_factory=utc_now, nullable=False)
    total: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))
    vuelto: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    caja: Optional[AperturaCaja] = Relationship(back_populates="ventas")
    detalles: list["DetalleVenta"] = Relationship(back_populates="venta")
    medios_pago: list["MediosPago"] = Relationship(back_populates="venta")


class ProductosPOS(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(index=True, unique=True, max_length=40)
    nombre: str = Field(max_length=120)
    categoria: str = Field(max_length=80)
    precio: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))
    activo: bool = Field(default=True, nullable=False)

    detalles: list["DetalleVenta"] = Relationship(back_populates="producto")


class DetalleVenta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    venta_id: int = Field(foreign_key="ventas.id", index=True)
    producto_id: int = Field(foreign_key="productospos.id")
    cantidad: int = Field(gt=0)
    precio_unitario: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))
    subtotal: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    venta: Optional[Ventas] = Relationship(back_populates="detalles")
    producto: Optional[ProductosPOS] = Relationship(back_populates="detalles")


class MediosPago(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    venta_id: int = Field(foreign_key="ventas.id", index=True)
    medio: str = Field(max_length=30)
    monto: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))
    monto_recibido: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    venta: Optional[Ventas] = Relationship(back_populates="medios_pago")
