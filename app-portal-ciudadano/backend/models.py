from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UTCDateTime(TypeDecorator[datetime]):
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, _dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            return value.replace(tzinfo=timezone.utc).replace(tzinfo=None)
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, _dialect) -> datetime | None:
        if value is None or value.tzinfo is not None:
            return value
        return value.replace(tzinfo=timezone.utc)


class Ciudadano(Base):
    __tablename__ = "ciudadanos"

    id: Mapped[int] = mapped_column(primary_key=True)
    documento: Mapped[str] = mapped_column(String(11), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120))
    creado_en: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)

    tramites: Mapped[list["Tramite"]] = relationship(back_populates="ciudadano")
    reclamos: Mapped[list["Reclamo"]] = relationship(back_populates="ciudadano")
    turnos: Mapped[list["Turno"]] = relationship(back_populates="ciudadano")


class Estado(Base):
    __tablename__ = "estados"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(40), unique=True)
    descripcion: Mapped[str] = mapped_column(String(180))


class TipoTramite(Base):
    __tablename__ = "tipos_tramite"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    descripcion: Mapped[str] = mapped_column(String(240), default="")
    activo: Mapped[bool] = mapped_column(default=True)

    tramites: Mapped[list["Tramite"]] = relationship(back_populates="tipo_tramite")


class Tramite(Base):
    __tablename__ = "tramites"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    descripcion: Mapped[str] = mapped_column(Text)
    creado_en: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    ciudadano_id: Mapped[int] = mapped_column(ForeignKey("ciudadanos.id"))
    tipo_id: Mapped[int] = mapped_column(ForeignKey("tipos_tramite.id"))
    estado_id: Mapped[int] = mapped_column(ForeignKey("estados.id"))

    ciudadano: Mapped[Ciudadano] = relationship(back_populates="tramites")
    tipo_tramite: Mapped[TipoTramite] = relationship(back_populates="tramites")
    estado: Mapped[Estado] = relationship()


class Reclamo(Base):
    __tablename__ = "reclamos"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    asunto: Mapped[str] = mapped_column(String(120))
    descripcion: Mapped[str] = mapped_column(Text)
    ubicacion: Mapped[str | None] = mapped_column(String(180), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    ciudadano_id: Mapped[int] = mapped_column(ForeignKey("ciudadanos.id"))
    estado_id: Mapped[int] = mapped_column(ForeignKey("estados.id"))

    ciudadano: Mapped[Ciudadano] = relationship(back_populates="reclamos")
    estado: Mapped[Estado] = relationship()


class HistorialEstado(Base):
    __tablename__ = "historial_estados"
    __table_args__ = (
        CheckConstraint(
            "(tramite_id IS NOT NULL AND reclamo_id IS NULL) OR "
            "(tramite_id IS NULL AND reclamo_id IS NOT NULL)",
            name="ck_historial_un_solo_recurso",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    estado_id: Mapped[int] = mapped_column(ForeignKey("estados.id"))
    tramite_id: Mapped[int | None] = mapped_column(
        ForeignKey("tramites.id"), nullable=True
    )
    reclamo_id: Mapped[int | None] = mapped_column(
        ForeignKey("reclamos.id"), nullable=True
    )
    actualizado_en: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    observacion: Mapped[str] = mapped_column(String(240), default="")

    estado: Mapped[Estado] = relationship()


class Turno(Base):
    __tablename__ = "turnos"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    motivo: Mapped[str] = mapped_column(String(100))
    fecha_hora: Mapped[datetime] = mapped_column(UTCDateTime())
    sede: Mapped[str] = mapped_column(String(120))
    creado_en: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    ciudadano_id: Mapped[int] = mapped_column(ForeignKey("ciudadanos.id"))

    ciudadano: Mapped[Ciudadano] = relationship(back_populates="turnos")
