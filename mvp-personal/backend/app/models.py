from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Area(Base):
    __tablename__ = "areas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre_area: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    piso: Mapped[str] = mapped_column(String(30), nullable=False)
    departamento: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    personal: Mapped[list["Person"]] = relationship(back_populates="area")


class Person(Base):
    __tablename__ = "personal"

    dni: Mapped[str] = mapped_column(String(8), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    apellido: Mapped[str] = mapped_column(String(80), nullable=False)
    legajo: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    area_id: Mapped[int | None] = mapped_column(
        ForeignKey("areas.id", ondelete="SET NULL"), nullable=True
    )
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    fecha_alta: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)

    area: Mapped[Area | None] = relationship(back_populates="personal")
    fichajes: Mapped[list["BiometricMark"]] = relationship(back_populates="persona")
    licencias: Mapped[list["Leave"]] = relationship(back_populates="persona")


class BiometricMark(Base):
    __tablename__ = "fichajes_biometricos"
    __table_args__ = (
        CheckConstraint("tipo_evento IN ('ENTRADA', 'SALIDA')", name="ck_fichaje_tipo_evento"),
        CheckConstraint(
            "estado_verificacion IN ('VERIFIED', 'FAILED')",
            name="ck_fichaje_estado_verificacion",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dni: Mapped[str] = mapped_column(
        ForeignKey("personal.dni", ondelete="CASCADE"), nullable=False, index=True
    )
    ip_dispositivo: Mapped[str] = mapped_column(String(45), nullable=False)
    marca_tiempo: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    tipo_evento: Mapped[str] = mapped_column(String(8), nullable=False)
    estado_verificacion: Mapped[str] = mapped_column(String(8), nullable=False)
    dispositivo_modelo: Mapped[str] = mapped_column(
        String(40), nullable=False, default="ZKBio-Simulator", server_default="ZKBio-Simulator"
    )

    persona: Mapped[Person] = relationship(back_populates="fichajes")


class Leave(Base):
    __tablename__ = "licencias_vacaciones"
    __table_args__ = (
        CheckConstraint(
            "tipo IN ('MEDICA', 'VACACION', 'OTRO')",
            name="ck_licencia_tipo",
        ),
        CheckConstraint(
            "estado IN ('PENDING', 'APPROVED', 'REJECTED')",
            name="ck_licencia_estado",
        ),
        CheckConstraint("fecha_fin >= fecha_inicio", name="ck_licencia_rango_fechas"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dni: Mapped[str] = mapped_column(
        ForeignKey("personal.dni", ondelete="CASCADE"), nullable=False, index=True
    )
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    motivo: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    estado: Mapped[str] = mapped_column(String(10), nullable=False, default="APPROVED")

    persona: Mapped[Person] = relationship(back_populates="licencias")
