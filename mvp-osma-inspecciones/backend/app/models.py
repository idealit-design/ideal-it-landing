from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Inspector(Base):
    __tablename__ = "inspectores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    legajo: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    zona_asignada: Mapped[str] = mapped_column(String(120), nullable=False)

    inspecciones: Mapped[list["InspeccionCampo"]] = relationship(back_populates="inspector")


class Afiliado(Base):
    __tablename__ = "afiliados"
    __table_args__ = (
        CheckConstraint(
            "estado IN ('ACTIVO', 'SUSPENDIDO')",
            name="ck_afiliado_estado",
        ),
    )

    dni: Mapped[str] = mapped_column(String(20), primary_key=True)
    nombre_apellido: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    plan_social: Mapped[str] = mapped_column(String(120), nullable=False)
    estado: Mapped[str] = mapped_column(String(12), nullable=False, index=True)

    inspecciones: Mapped[list["InspeccionCampo"]] = relationship(back_populates="afiliado")


class InspeccionCampo(Base):
    __tablename__ = "inspecciones_campo"
    __table_args__ = (
        CheckConstraint(
            "estado_planillla IN ('COMPLETA', 'PENDIENTE_SYNC')",
            name="ck_inspeccion_estado_planilla",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inspector_id: Mapped[int] = mapped_column(
        ForeignKey("inspectores.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    afiliado_dni: Mapped[str] = mapped_column(
        ForeignKey("afiliados.dni", ondelete="RESTRICT"), nullable=False, index=True
    )
    fecha_inspeccion: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    observaciones: Mapped[str] = mapped_column(Text, nullable=False, default="")
    estado_planillla: Mapped[str] = mapped_column(
        String(20), nullable=False, default="COMPLETA"
    )
    datos_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

    inspector: Mapped[Inspector] = relationship(back_populates="inspecciones")
    afiliado: Mapped[Afiliado] = relationship(back_populates="inspecciones")
