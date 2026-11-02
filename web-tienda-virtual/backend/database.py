import os
import tempfile
from collections.abc import Generator
from functools import lru_cache
from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

MODULE_ROOT = Path(__file__).resolve().parents[1]


class Base(DeclarativeBase):
    pass


def get_database_path() -> Path:
    database_path = Path(
        os.environ.get(
            "TIENDA_DATABASE_PATH",
            str(Path(__file__).parent / "data" / "db" / "tienda_mvp.db"),
        )
    ).resolve()
    temp_root = Path(tempfile.gettempdir()).resolve()
    if not database_path.is_relative_to(MODULE_ROOT) and not database_path.is_relative_to(
        temp_root
    ):
        raise ValueError(
            "TIENDA_DATABASE_PATH debe estar dentro del módulo o del directorio temporal."
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
    def enable_foreign_keys(connection, _record) -> None:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()

    return engine


def get_engine() -> Engine:
    return _engine_for_path(str(get_database_path()))


def get_db_session() -> Generator[Session, None, None]:
    factory = sessionmaker(bind=get_engine(), expire_on_commit=False)
    with factory() as session:
        yield session


def create_database() -> None:
    from models import Categoria, Producto

    Base.metadata.create_all(bind=get_engine())
    engine = get_engine()
    with Session(engine) as session:
        if session.query(Categoria.id).first() is not None:
            return

        categorias = [
            Categoria(nombre="Hogar", slug="hogar", descripcion="Objetos para todos los días"),
            Categoria(nombre="Tecnología", slug="tecnologia", descripcion="Accesorios y dispositivos"),
            Categoria(nombre="Accesorios", slug="accesorios", descripcion="Detalles que hacen la diferencia"),
        ]
        session.add_all(categorias)
        session.flush()
        session.add_all(
            [
                Producto(
                    nombre="Taza Aurora",
                    descripcion="Cerámica artesanal, terminada a mano para acompañar tus mañanas.",
                    precio=18.50,
                    stock=12,
                    categoria_id=categorias[0].id,
                ),
                Producto(
                    nombre="Lámpara Nube",
                    descripcion="Luz cálida y diseño simple para crear rincones acogedores.",
                    precio=46.00,
                    stock=8,
                    categoria_id=categorias[0].id,
                ),
                Producto(
                    nombre="Auriculares Studio",
                    descripcion="Sonido envolvente y comodidad para escuchar sin apuro.",
                    precio=89.90,
                    stock=5,
                    categoria_id=categorias[1].id,
                ),
                Producto(
                    nombre="Parlante Mini",
                    descripcion="Tu música favorita en un formato compacto y portátil.",
                    precio=59.00,
                    stock=9,
                    categoria_id=categorias[1].id,
                ),
                Producto(
                    nombre="Bolso Siena",
                    descripcion="Lona resistente y espacio para llevar lo esencial.",
                    precio=38.00,
                    stock=7,
                    categoria_id=categorias[2].id,
                ),
                Producto(
                    nombre="Cuaderno Botánico",
                    descripcion="Tapa ilustrada y hojas punteadas para tus ideas.",
                    precio=14.00,
                    stock=15,
                    categoria_id=categorias[2].id,
                ),
            ]
        )
        session.commit()
