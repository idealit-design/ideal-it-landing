from collections.abc import Generator
from functools import lru_cache
import os
from pathlib import Path
import tempfile

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


MODULE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE_PATH = MODULE_ROOT / "backend" / "data" / "db" / "frigorifico_mvp.db"


class Base(DeclarativeBase):
    pass


def get_database_path() -> Path:
    database_path = Path(
        os.environ.get("FRIGORIFICO_DATABASE_PATH", DEFAULT_DATABASE_PATH)
    ).resolve()
    temp_root = Path(tempfile.gettempdir()).resolve()
    if not database_path.is_relative_to(MODULE_ROOT) and not database_path.is_relative_to(temp_root):
        raise ValueError(
            "FRIGORIFICO_DATABASE_PATH debe estar dentro del módulo o del directorio temporal."
        )
    return database_path


@lru_cache(maxsize=8)
def _engine_for_path(database_path: str) -> Engine:
    path = Path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        f"sqlite:///{path.as_posix()}",
        connect_args={"check_same_thread": False, "timeout": 10},
    )

    @event.listens_for(engine, "connect")
    def enable_sqlite_safety(connection, _record) -> None:
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
    from models import AjusteSaldo, Catalogo, Desposte, IngresoMediasRes, Proveedor, Saldo  # noqa: F401

    Base.metadata.create_all(bind=get_engine())
