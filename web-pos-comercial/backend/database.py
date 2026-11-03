import os
import tempfile
from collections.abc import Generator
from functools import lru_cache
from pathlib import Path

from sqlalchemy import Engine, create_engine, event, func
from sqlmodel import Session, SQLModel, select


MODULE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE_PATH = Path(__file__).parent / "data" / "db" / "pos_mvp.db"


def get_database_path() -> Path:
    database_path = Path(
        os.getenv("POS_COMERCIAL_DATABASE_PATH", str(DEFAULT_DATABASE_PATH))
    ).resolve()
    temp_root = Path(tempfile.gettempdir()).resolve()
    if not database_path.is_relative_to(MODULE_ROOT) and not database_path.is_relative_to(
        temp_root
    ):
        raise ValueError(
            "POS_COMERCIAL_DATABASE_PATH debe estar dentro del módulo o del directorio temporal."
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
    def enable_sqlite_settings(connection, _record) -> None:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()

    return engine


def get_engine() -> Engine:
    return _engine_for_path(str(get_database_path()))


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session


def create_database() -> None:
    from models import ProductosPOS

    engine = get_engine()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        product_count = session.exec(select(func.count(ProductosPOS.id))).one()
        if product_count == 0:
            session.add_all(
                [
                    ProductosPOS(codigo="DEMO-001", nombre="Café de especialidad", categoria="Bebidas", precio="1800.00"),
                    ProductosPOS(codigo="DEMO-002", nombre="Té en hebras", categoria="Bebidas", precio="1450.00"),
                    ProductosPOS(codigo="DEMO-003", nombre="Medialunas x 2", categoria="Panadería", precio="2200.00"),
                    ProductosPOS(codigo="DEMO-004", nombre="Tostado clásico", categoria="Cocina", precio="4800.00"),
                    ProductosPOS(codigo="DEMO-005", nombre="Budín del día", categoria="Panadería", precio="2600.00"),
                    ProductosPOS(codigo="DEMO-006", nombre="Jugo natural", categoria="Bebidas", precio="3200.00"),
                ]
            )
            session.commit()
