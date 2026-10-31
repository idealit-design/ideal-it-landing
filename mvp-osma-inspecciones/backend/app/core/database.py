from collections.abc import Generator
from functools import lru_cache
from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_database_path


class Base(DeclarativeBase):
    pass


@lru_cache(maxsize=8)
def _engine_for_path(database_path: str) -> Engine:
    resolved_path = Path(database_path).resolve()
    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        f"sqlite:///{resolved_path.as_posix()}",
        connect_args={"check_same_thread": False, "timeout": 10},
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _record) -> None:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()

    return engine


def get_engine() -> Engine:
    return _engine_for_path(str(get_database_path()))


def get_session() -> Generator[Session, None, None]:
    factory = sessionmaker(bind=get_engine(), expire_on_commit=False)
    with factory() as session:
        yield session


def create_database() -> None:
    from app import models

    Base.metadata.create_all(bind=get_engine())
    with Session(get_engine()) as session:
        if session.query(models.Inspector).count() == 0:
            session.add(
                models.Inspector(
                    nombre="Inspector Demo",
                    legajo="DEMO-001",
                    zona_asignada="Zona Centro",
                )
            )
        if session.query(models.Afiliado).count() == 0:
            session.add_all(
                [
                    models.Afiliado(
                        dni="30000001",
                        nombre_apellido="Afiliado Demo Uno",
                        plan_social="OSMA Básico",
                        estado="ACTIVO",
                    ),
                    models.Afiliado(
                        dni="30000002",
                        nombre_apellido="Afiliada Demo Dos",
                        plan_social="OSMA Integral",
                        estado="ACTIVO",
                    ),
                    models.Afiliado(
                        dni="30000003",
                        nombre_apellido="Afiliado Demo Suspendido",
                        plan_social="OSMA Básico",
                        estado="SUSPENDIDO",
                    ),
                ]
            )
        session.commit()
