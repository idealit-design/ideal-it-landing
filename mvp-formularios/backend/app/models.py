from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Organizer(Base):
    __tablename__ = "organizadores_turismo"
    __table_args__ = (
        CheckConstraint(
            "categoria IN ('MUSEO', 'BOLICHE', 'RESTAURANTE', 'SECRETARIA_MUNICIPAL')",
            name="ck_organizador_categoria",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    categoria: Mapped[str] = mapped_column(String(32), nullable=False)
    contacto: Mapped[str] = mapped_column(String(160), nullable=False)
    eventos: Mapped[list["TourismEvent"]] = relationship(back_populates="organizador")


class TourismEvent(Base):
    __tablename__ = "eventos_turisticos"
    __table_args__ = (
        CheckConstraint("cupo_maximo > 0", name="ck_evento_cupo_positivo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    organizador_id: Mapped[int] = mapped_column(
        ForeignKey("organizadores_turismo.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    titulo: Mapped[str] = mapped_column(String(160), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False, default="")
    fecha_evento: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    cupo_maximo: Mapped[int] = mapped_column(Integer, nullable=False)
    requiere_aprobacion: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="0"
    )

    organizador: Mapped[Organizer] = relationship(back_populates="eventos")
    inscripciones: Mapped[list["CitizenRegistration"]] = relationship(
        back_populates="evento"
    )


class CitizenRegistration(Base):
    __tablename__ = "inscripciones_ciudadanos"
    __table_args__ = (
        CheckConstraint(
            "estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')",
            name="ck_inscripcion_estado",
        ),
        UniqueConstraint("evento_id", "dni_ciudadano", name="uq_inscripcion_evento_dni"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evento_id: Mapped[int] = mapped_column(
        ForeignKey("eventos_turisticos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    dni_ciudadano: Mapped[str] = mapped_column(String(20), nullable=False)
    nombre_apellido: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    estado: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    codigo_qr: Mapped[str | None] = mapped_column(String(80), nullable=True, unique=True)
    asistencia_confirmada: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="0"
    )
    evento: Mapped[TourismEvent] = relationship(back_populates="inscripciones")
