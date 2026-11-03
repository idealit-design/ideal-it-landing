from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Proveedor(Base):
    __tablename__ = "proveedores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    razon_social: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    cuit: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
    matricula_frigorifico: Mapped[str | None] = mapped_column(String(40), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    creado_en: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    ingresos: Mapped[list["IngresoMediasRes"]] = relationship(back_populates="proveedor")


class Catalogo(Base):
    __tablename__ = "catalogo"
    __table_args__ = (
        CheckConstraint(
            "tipo IN ('MEDIA_RES', 'CORTE', 'ELABORADO', 'SUBPRODUCTO', 'AVE')",
            name="ck_catalogo_tipo",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    categoria: Mapped[str] = mapped_column(String(80), nullable=False, default="General")
    unidad: Mapped[str] = mapped_column(String(12), nullable=False, default="kg")
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    creado_en: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    ingresos: Mapped[list["IngresoMediasRes"]] = relationship(back_populates="catalogo")
    saldo: Mapped["Saldo | None"] = relationship(back_populates="catalogo", uselist=False)


class IngresoMediasRes(Base):
    __tablename__ = "ingresos_medias_res"
    __table_args__ = (
        UniqueConstraint(
            "numero_tropa", "numero_garron", "lateralidad", name="uq_ingreso_identificacion"
        ),
        CheckConstraint("peso_kg > 0", name="ck_ingreso_peso"),
        CheckConstraint("peso_restante_kg >= 0", name="ck_ingreso_peso_restante"),
        CheckConstraint(
            "estado IN ('CAMARA', 'PARCIAL', 'DESPOSTADA')", name="ck_ingreso_estado"
        ),
        CheckConstraint("lateralidad IN ('I', 'D')", name="ck_ingreso_lateralidad"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedores.id"), nullable=False)
    catalogo_id: Mapped[int] = mapped_column(ForeignKey("catalogo.id"), nullable=False)
    fecha_faena: Mapped[date] = mapped_column(Date, nullable=False)
    numero_tropa: Mapped[str] = mapped_column(String(40), nullable=False)
    numero_garron: Mapped[str] = mapped_column(String(40), nullable=False)
    lateralidad: Mapped[str] = mapped_column(String(1), nullable=False)
    peso_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    peso_restante_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    estado: Mapped[str] = mapped_column(String(12), nullable=False, default="CAMARA")
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    proveedor: Mapped[Proveedor] = relationship(back_populates="ingresos")
    catalogo: Mapped[Catalogo] = relationship(back_populates="ingresos")
    despostes: Mapped[list["Desposte"]] = relationship(back_populates="ingreso")


class Desposte(Base):
    __tablename__ = "despostes"
    __table_args__ = (CheckConstraint("peso_kg > 0", name="ck_desposte_peso"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    operacion_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    ingreso_id: Mapped[int] = mapped_column(ForeignKey("ingresos_medias_res.id"), nullable=False)
    catalogo_id: Mapped[int] = mapped_column(ForeignKey("catalogo.id"), nullable=False)
    peso_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    ingreso: Mapped[IngresoMediasRes] = relationship(back_populates="despostes")
    catalogo: Mapped[Catalogo] = relationship()


class Saldo(Base):
    __tablename__ = "saldos"
    __table_args__ = (CheckConstraint("cantidad_kg >= 0", name="ck_saldo_no_negativo"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    catalogo_id: Mapped[int] = mapped_column(
        ForeignKey("catalogo.id"), nullable=False, unique=True
    )
    cantidad_kg: Mapped[Decimal] = mapped_column(
        Numeric(12, 3), nullable=False, default=Decimal("0")
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    catalogo: Mapped[Catalogo] = relationship(back_populates="saldo")


class AjusteSaldo(Base):
    __tablename__ = "ajustes_saldo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    catalogo_id: Mapped[int] = mapped_column(ForeignKey("catalogo.id"), nullable=False)
    saldo_anterior_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    saldo_fisico_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    motivo: Mapped[str] = mapped_column(String(240), nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    catalogo: Mapped[Catalogo] = relationship()
