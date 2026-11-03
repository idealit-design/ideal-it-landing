from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    descripcion: Mapped[str] = mapped_column(String(240), nullable=False, default="")
    productos: Mapped[list["Producto"]] = relationship(back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"
    __table_args__ = (
        CheckConstraint("precio > 0", name="ck_producto_precio_positivo"),
        CheckConstraint("stock >= 0", name="ck_producto_stock_no_negativo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False, default="")
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    categoria_id: Mapped[int] = mapped_column(
        ForeignKey("categorias.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    categoria: Mapped[Categoria] = relationship(back_populates="productos")


class Orden(Base):
    __tablename__ = "ordenes"
    __table_args__ = (
        CheckConstraint("total >= 0", name="ck_orden_total_no_negativo"),
        CheckConstraint(
            "estado_pago IN ('simulado_aprobado')",
            name="ck_orden_estado_pago_demo",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    cliente_nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    cliente_email: Mapped[str] = mapped_column(String(254), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="confirmada_demo")
    estado_pago: Mapped[str] = mapped_column(
        String(30), nullable=False, default="simulado_aprobado"
    )
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    items: Mapped[list["ItemsOrden"]] = relationship(
        back_populates="orden", cascade="all, delete-orphan"
    )


class ItemsOrden(Base):
    __tablename__ = "items_orden"
    __table_args__ = (
        CheckConstraint("cantidad > 0", name="ck_item_cantidad_positiva"),
        CheckConstraint("precio_unitario > 0", name="ck_item_precio_positivo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    orden_id: Mapped[int] = mapped_column(
        ForeignKey("ordenes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    producto_id: Mapped[int] = mapped_column(
        ForeignKey("productos.id", ondelete="RESTRICT"), nullable=False
    )
    nombre_producto: Mapped[str] = mapped_column(String(120), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    orden: Mapped[Orden] = relationship(back_populates="items")
