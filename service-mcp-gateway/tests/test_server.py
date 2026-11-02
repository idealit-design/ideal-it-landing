import asyncio
import json
import sqlite3
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


def _create_database(path: Path, table: str, rows: int = 0) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.execute(f'CREATE TABLE "{table}" (id INTEGER PRIMARY KEY, detail TEXT)')
        connection.executemany(
            f'INSERT INTO "{table}" (detail) VALUES (?)',
            [(f"synthetic-{index}",) for index in range(rows)],
        )


def test_database_resource_exposes_only_schema_and_counts(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    _create_database(tmp_path / "store.sqlite", "products", rows=3)
    monkeypatch.setattr(server, "PROJECT_ROOT", tmp_path)
    monkeypatch.setitem(
        server.DATABASES,
        "tienda-virtual",
        server.DatabaseConfig("Tienda de prueba", Path("store.sqlite")),
    )

    overview = server._database_overview("tienda-virtual")
    serialized = json.dumps(overview)

    assert overview["available"] is True
    assert overview["tables"] == [
        {"name": "products", "columns": ["id", "detail"], "row_count": 3}
    ]
    assert "synthetic-" not in serialized


def test_database_connection_is_read_only(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    database_path = tmp_path / "store.sqlite"
    _create_database(database_path, "products")
    monkeypatch.setattr(server, "PROJECT_ROOT", tmp_path)
    monkeypatch.setitem(
        server.DATABASES,
        "tienda-virtual",
        server.DatabaseConfig("Tienda de prueba", Path("store.sqlite")),
    )

    with server._open_database("tienda-virtual") as connection:
        with pytest.raises(sqlite3.OperationalError):
            connection.execute('INSERT INTO "products" (detail) VALUES ("blocked")')


def test_statistics_use_allowlisted_tables_and_mark_missing_sources(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    source_tables = {
        "osma-inspecciones": ("osma.sqlite", "inspecciones_campo", 2),
        "formularios": ("forms.sqlite", "inscripciones_ciudadanos", 4),
        "tienda-virtual": ("store.sqlite", "productos", 6),
        "logistica-fleet": ("fleet.sqlite", "Envio", 1),
    }
    test_databases = {
        database_id: server.DatabaseConfig(
            database_id, Path(filename)
        )
        for database_id, (filename, _, _) in source_tables.items()
    }
    test_databases["personal"] = server.DatabaseConfig(
        "personal", Path("missing.sqlite")
    )
    for filename, table, count in source_tables.values():
        _create_database(tmp_path / filename, table, rows=count)

    monkeypatch.setattr(server, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(server, "DATABASES", test_databases)

    result = server.get_portfolio_statistics()

    assert result["totals"] == {
        "inspecciones": 2,
        "tramites": 4,
        "productos": 6,
        "envios": 1,
        "personas": None,
    }
    assert result["unavailable_sources"] == ["personal"]


@pytest.mark.parametrize(
    ("client", "host", "expected"),
    [
        (("127.0.0.1", 5000), b"127.0.0.1:8020", True),
        (("::1", 5000), b"[::1]:8020", True),
        (("127.0.0.1", 5000), b"localhost:8021", False),
        (("127.0.0.1", 5000), b"localhost/path", False),
        (("127.0.0.1", 5000), b"localh\xffost:8020", False),
        (("127.0.0.1", 5000), b"local\nhost:8020", False),
        (("192.0.2.10", 5000), b"localhost:8020", False),
        (("127.0.0.1", 5000), b"attacker.example", False),
        (None, b"localhost:8020", False),
    ],
)
def test_request_requires_loopback_peer_and_host(
    client: tuple[str, int] | None, host: bytes, expected: bool
) -> None:
    scope = {"client": client, "headers": [(b"host", host)]}
    assert server._is_local_request(scope) is expected


def test_middleware_rejects_non_local_requests() -> None:
    messages = []

    async def app(scope, receive, send):
        raise AssertionError("A non-local request must not reach the MCP app.")

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        messages.append(message)

    scope = {
        "type": "http",
        "client": ("192.0.2.10", 5000),
        "headers": [(b"host", b"127.0.0.1:8020")],
    }

    asyncio.run(server.LoopbackOnlyMiddleware(app)(scope, receive, send))

    assert messages[0]["status"] == 403
