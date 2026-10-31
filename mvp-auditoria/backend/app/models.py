from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditedProvider(Base):
    __tablename__ = "prestadores_auditados"
    __table_args__ = (
        CheckConstraint(
            "estado_matricula IN ('ACTIVA', 'INACTIVA')", name="ck_prestador_matricula"
        ),
        CheckConstraint(
            "estado_renaper IN ('VALIDADO', 'NO_VALIDADO')", name="ck_prestador_renaper"
        ),
    )

    dni: Mapped[str] = mapped_column(String(8), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    apellido: Mapped[str] = mapped_column(String(80), nullable=False)
    cuit: Mapped[str] = mapped_column(String(11), nullable=False, unique=True)
    especialidad: Mapped[str] = mapped_column(String(100), nullable=False)
    estado_matricula: Mapped[str] = mapped_column(
        String(10), nullable=False, default="ACTIVA", server_default="ACTIVA"
    )
    estado_renaper: Mapped[str] = mapped_column(
        String(12), nullable=False, default="VALIDADO", server_default="VALIDADO"
    )
    documentos: Mapped[list["VaultDocument"]] = relationship(back_populates="prestador")
    casos: Mapped[list["AuditCase"]] = relationship(back_populates="prestador")


class VaultDocument(Base):
    __tablename__ = "documentos_boveda"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dni_prestador: Mapped[str] = mapped_column(
        ForeignKey("prestadores_auditados.dni", ondelete="CASCADE"), nullable=False, index=True
    )
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo_documento: Mapped[str] = mapped_column(String(80), nullable=False)
    ruta_local: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    extension: Mapped[str] = mapped_column(String(10), nullable=False)
    prestador: Mapped[AuditedProvider] = relationship(back_populates="documentos")


class NationalCatalogItem(Base):
    __tablename__ = "nomenclador_nacional"

    codigo: Mapped[str] = mapped_column(String(30), primary_key=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    especialidad: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    requisitos_exigidos: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    casos: Mapped[list["AuditCase"]] = relationship(back_populates="nomenclador")


class AuditCase(Base):
    __tablename__ = "casos_auditoria"
    __table_args__ = (
        CheckConstraint(
            "estado_autorizacion IN ('APROBADO', 'RECHAZADO', 'PENDIENTE')",
            name="ck_caso_estado_autorizacion",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dni_prestador: Mapped[str] = mapped_column(
        ForeignKey("prestadores_auditados.dni", ondelete="RESTRICT"), nullable=False, index=True
    )
    codigo_nomenclador: Mapped[str] = mapped_column(
        ForeignKey("nomenclador_nacional.codigo", ondelete="RESTRICT"), nullable=False, index=True
    )
    estado_autorizacion: Mapped[str] = mapped_column(
        String(10), nullable=False, default="PENDIENTE", server_default="PENDIENTE"
    )
    observaciones: Mapped[str] = mapped_column(String(1000), nullable=False, default="")
    auditor_id: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    prestador: Mapped[AuditedProvider] = relationship(back_populates="casos")
    nomenclador: Mapped[NationalCatalogItem] = relationship(back_populates="casos")
