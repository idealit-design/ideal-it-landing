from __future__ import annotations

import ipaddress
import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator
from urllib.parse import urlsplit

import uvicorn
from mcp.server.fastmcp import FastMCP
from starlette.types import ASGIApp, Receive, Scope, Send


PROJECT_ROOT = Path(__file__).resolve().parents[1]
HOST = "127.0.0.1"
PORT = 8020


@dataclass(frozen=True)
class DatabaseConfig:
    name: str
    relative_path: Path


DATABASES: dict[str, DatabaseConfig] = {
    "osma-inspecciones": DatabaseConfig(
        "MVP OSMA Inspecciones",
        Path("mvp-osma-inspecciones/backend/data/db/osma_mvp.db"),
    ),
    "personal": DatabaseConfig(
        "MVP Personal",
        Path("mvp-personal/backend/data/db/personal_mvp.db"),
    ),
    "formularios": DatabaseConfig(
        "MVP Formularios",
        Path("mvp-formularios/backend/data/db/formularios_mvp.db"),
    ),
    "tienda-virtual": DatabaseConfig(
        "Web Tienda Virtual",
        Path("web-tienda-virtual/backend/data/db/tienda_mvp.db"),
    ),
    "logistica-fleet": DatabaseConfig(
        "MVP Logistica Fleet",
        Path("mvp-logistica-fleet/backend/prisma/dev.db"),
    ),
}

STATISTIC_TABLES: dict[str, tuple[str, str]] = {
    "inspecciones": ("osma-inspecciones", "inspecciones_campo"),
    "tramites": ("formularios", "inscripciones_ciudadanos"),
    "productos": ("tienda-virtual", "productos"),
    "envios": ("logistica-fleet", "Envio"),
    "personas": ("personal", "personal"),
}

mcp = FastMCP(
    "ideal-it-local-portfolio",
    instructions=(
        "Consulta únicamente metadatos y conteos agregados de bases SQLite locales "
        "de demostración. Nunca devuelve filas personales ni permite escrituras."
    ),
)


def _database_path(database_id: str) -> Path:
    config = DATABASES.get(database_id)
    if config is None:
        raise ValueError(f"Base de datos no permitida: {database_id}")

    path = (PROJECT_ROOT / config.relative_path).resolve(strict=True)
    if not path.is_relative_to(PROJECT_ROOT.resolve()):
        raise PermissionError("La base de datos debe permanecer dentro del monorepo.")
    if not path.is_file():
        raise FileNotFoundError(f"No existe la base local {database_id}.")
    return path


@contextmanager
def _open_database(database_id: str) -> Iterator[sqlite3.Connection]:
    path = _database_path(database_id)
    connection = sqlite3.connect(
        f"{path.as_uri()}?mode=ro",
        uri=True,
        timeout=1.0,
    )
    try:
        connection.execute("PRAGMA query_only = ON")
        yield connection
    finally:
        connection.close()


def _quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _table_names(connection: sqlite3.Connection) -> list[str]:
    rows = connection.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    return [row[0] for row in rows]


def _database_overview(database_id: str) -> dict[str, object]:
    config = DATABASES.get(database_id)
    if config is None:
        raise ValueError(f"Base de datos no permitida: {database_id}")

    try:
        with _open_database(database_id) as connection:
            tables = []
            for table_name in _table_names(connection):
                quoted_table = _quote_identifier(table_name)
                columns = [
                    row[1]
                    for row in connection.execute(f"PRAGMA table_info({quoted_table})")
                ]
                row_count = connection.execute(
                    f"SELECT COUNT(*) FROM {quoted_table}"
                ).fetchone()[0]
                tables.append(
                    {"name": table_name, "columns": columns, "row_count": row_count}
                )
    except FileNotFoundError:
        return {
            "id": database_id,
            "name": config.name,
            "available": False,
            "tables": [],
        }

    return {
        "id": database_id,
        "name": config.name,
        "available": True,
        "tables": tables,
    }


def _count_table(database_id: str, table_name: str) -> int:
    with _open_database(database_id) as connection:
        if table_name not in _table_names(connection):
            raise RuntimeError(
                f"La tabla esperada {table_name} no existe en {database_id}."
            )
        return connection.execute(
            f"SELECT COUNT(*) FROM {_quote_identifier(table_name)}"
        ).fetchone()[0]


def _is_local_request(scope: Scope) -> bool:
    client = scope.get("client")
    if not isinstance(client, (tuple, list)) or not client:
        return False
    try:
        if not ipaddress.ip_address(str(client[0])).is_loopback:
            return False
    except ValueError:
        return False

    headers = dict(scope.get("headers", []))
    try:
        host_header = headers.get(b"host", b"").decode("ascii")
    except UnicodeDecodeError:
        return False
    if any(
        character.isspace() or ord(character) < 0x21 or ord(character) == 0x7F
        for character in host_header
    ):
        return False
    try:
        parsed_host = urlsplit(f"//{host_header}")
        hostname = parsed_host.hostname
        port = parsed_host.port
    except ValueError:
        return False
    return (
        not parsed_host.path
        and not parsed_host.query
        and not parsed_host.fragment
        and parsed_host.username is None
        and parsed_host.password is None
        and (port is None or port == PORT)
        and hostname is not None
        and hostname.lower() in {"localhost", "127.0.0.1", "::1"}
    )


class LoopbackOnlyMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] in {"http", "websocket"} and not _is_local_request(scope):
            if scope["type"] == "websocket":
                await send({"type": "websocket.close", "code": 1008})
                return
            await send(
                {
                    "type": "http.response.start",
                    "status": 403,
                    "headers": [(b"content-type", b"text/plain; charset=utf-8")],
                }
            )
            await send(
                {
                    "type": "http.response.body",
                    "body": b"Este servicio solo acepta conexiones locales.",
                }
            )
            return
        await self.app(scope, receive, send)


@mcp.resource("portfolio://databases")
def list_local_databases() -> str:
    """Lista las bases permitidas y sus tablas, columnas y conteos."""
    return json.dumps(
        {"databases": [_database_overview(database_id) for database_id in DATABASES]},
        ensure_ascii=False,
    )


@mcp.resource("portfolio://databases/{database_id}")
def get_local_database(database_id: str) -> str:
    """Expone el esquema y los conteos de una base local permitida."""
    return json.dumps(_database_overview(database_id), ensure_ascii=False)


@mcp.tool()
def get_portfolio_statistics() -> dict[str, object]:
    """Devuelve conteos agregados de inspecciones, trámites, productos y más."""
    totals: dict[str, int | None] = {}
    unavailable_sources: set[str] = set()
    for metric, (database_id, table_name) in STATISTIC_TABLES.items():
        try:
            totals[metric] = _count_table(database_id, table_name)
        except FileNotFoundError:
            totals[metric] = None
            unavailable_sources.add(database_id)
    return {
        "totals": totals,
        "unavailable_sources": sorted(unavailable_sources),
        "note": "Conteos locales de demostración; null indica una base no disponible.",
    }


@mcp.tool()
def get_mvp_statistics(database_id: str) -> dict[str, object]:
    """Devuelve el esquema y conteos de una base identificada por su ID permitido."""
    return _database_overview(database_id)


def create_app() -> ASGIApp:
    app = mcp.streamable_http_app()
    app.add_middleware(LoopbackOnlyMiddleware)
    return app


if __name__ == "__main__":
    uvicorn.run(create_app(), host=HOST, port=PORT, access_log=False)
