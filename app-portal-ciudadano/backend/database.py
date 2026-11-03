import os
from collections.abc import Generator
from functools import lru_cache
import tempfile
from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "db" / "portal_ciudadano.db"


class Base(DeclarativeBase):
    pass


def get_database_path() -> Path:
    configured_path = os.environ.get("PORTAL_CIUDADANO_DATABASE_PATH")
    database_path = (
        Path(configured_path).expanduser().resolve()
        if configured_path
        else DEFAULT_DATABASE_PATH
    )
    module_root = BACKEND_DIR.parent.resolve()
    temp_root = Path(tempfile.gettempdir()).resolve()
    if not database_path.is_relative_to(module_root) and not database_path.is_relative_to(
        temp_root
    ):
        raise ValueError(
            "PORTAL_CIUDADANO_DATABASE_PATH debe estar dentro del módulo o del directorio temporal."
        )
    return database_path


@lru_cache(maxsize=8)
def _engine_for_path(database_path: str) -> Engine:
    path = Path(database_path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        f"sqlite:///{path.as_posix()}",
        connect_args={"check_same_thread": False, "timeout": 10},
    )

    @event.listens_for(engine, "connect")
    def enable_sqlite_options(connection, _record) -> None:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()

    return engine


def get_engine() -> Engine:
    return _engine_for_path(str(get_database_path()))


def get_db() -> Generator[Session, None, None]:
    factory = sessionmaker(bind=get_engine(), expire_on_commit=False)
    with factory() as session:
        yield session


def create_database() -> None:
    from models import Estado, TipoTramite

    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        for nombre, descripcion in (
            ("Recibido", "Solicitud registrada correctamente"),
            ("En Proceso", "La solicitud está siendo evaluada"),
            ("Resuelto", "La solicitud fue resuelta"),
        ):
            if session.query(Estado).filter_by(nombre=nombre).first() is None:
                session.add(Estado(nombre=nombre, descripcion=descripcion))
        for nombre, descripcion in (
            ("Certificado de domicilio", "Solicitud de constancia de domicilio."),
            ("Habilitación comercial", "Inicio o consulta de una habilitación comercial."),
            ("Libre deuda municipal", "Solicitud de certificado de libre deuda."),
            ("Solicitud de poda", "Pedido de poda o mantenimiento de arbolado."),
        ):
            if session.query(TipoTramite).filter_by(nombre=nombre).first() is None:
                session.add(TipoTramite(nombre=nombre, descripcion=descripcion))
        session.commit()
