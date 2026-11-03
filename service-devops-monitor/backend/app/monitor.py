import asyncio
import json
import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

import httpx
import psutil


LOGGER = logging.getLogger(__name__)
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "services.json"
DATABASE_PATH = Path(__file__).resolve().parents[2] / "data" / "monitor.db"
PROBE_TIMEOUT_SECONDS = 1.5


def load_services() -> list[dict[str, Any]]:
    with CONFIG_PATH.open(encoding="utf-8") as config_file:
        configured_services = json.load(config_file)

    return [
        service
        for service in configured_services
        if (REPOSITORY_ROOT / service["directory"]).is_dir()
    ]


async def check_port(port: int | None) -> bool | None:
    if port is None:
        return None

    writer: asyncio.StreamWriter | None = None
    try:
        _, writer = await asyncio.wait_for(
            asyncio.open_connection("127.0.0.1", port),
            timeout=PROBE_TIMEOUT_SECONDS,
        )
        return True
    except (OSError, TimeoutError):
        return False
    finally:
        if writer is not None:
            writer.close()
            try:
                await writer.wait_closed()
            except OSError:
                LOGGER.debug("Could not close the local probe socket for port %s", port)


def listener_memory_by_port() -> dict[int, float]:
    try:
        connections = psutil.net_connections(kind="inet")
    except psutil.Error:
        LOGGER.warning("Listener process details are unavailable; memory estimates will be omitted")
        return {}

    process_ids_by_port: dict[int, set[int]] = {}
    for connection in connections:
        if (
            connection.status == psutil.CONN_LISTEN
            and connection.laddr
            and connection.pid is not None
        ):
            process_ids_by_port.setdefault(connection.laddr.port, set()).add(connection.pid)

    memory_by_port: dict[int, float] = {}
    for port, process_ids in process_ids_by_port.items():
        rss_by_process: list[int] = []
        for process_id in process_ids:
            try:
                rss_by_process.append(psutil.Process(process_id).memory_info().rss)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                LOGGER.debug("Memory is unavailable for listener process %s", process_id)
        if rss_by_process:
            memory_by_port[port] = round(sum(rss_by_process) / (1024 * 1024), 1)

    return memory_by_port


async def check_service(
    client: httpx.AsyncClient,
    service: dict[str, Any],
    memory_by_port: dict[int, float],
) -> dict[str, Any]:
    api_port = service.get("api_port")
    frontend_port = service.get("frontend_port")
    api_port_task = asyncio.create_task(check_port(api_port))
    frontend_port_task = asyncio.create_task(check_port(frontend_port))

    health_ok: bool | None = None
    health_status: int | None = None
    latency_ms: float | None = None
    health_error: str | None = None

    if api_port is not None and service.get("health_path"):
        health_url = f"http://127.0.0.1:{api_port}{service['health_path']}"
        started = asyncio.get_running_loop().time()
        try:
            response = await client.get(health_url)
            latency_ms = round((asyncio.get_running_loop().time() - started) * 1000, 1)
            health_status = response.status_code
            health_ok = response.is_success
            if not health_ok:
                health_error = f"HTTP {response.status_code}"
        except httpx.RequestError:
            latency_ms = round((asyncio.get_running_loop().time() - started) * 1000, 1)
            health_ok = False
            health_error = "Health endpoint unavailable"

    api_port_open, frontend_port_open = await asyncio.gather(
        api_port_task,
        frontend_port_task,
    )
    primary_port = api_port if api_port is not None else frontend_port

    if health_ok is not None:
        status = "online" if health_ok else "offline"
    else:
        status = "online" if frontend_port_open else "offline"

    return {
        **service,
        "status": status,
        "api_port_open": api_port_open,
        "health_ok": health_ok,
        "health_status": health_status,
        "health_error": health_error,
        "frontend_port_open": frontend_port_open,
        "latency_ms": latency_ms,
        "memory_mb": memory_by_port.get(primary_port) if primary_port is not None else None,
    }


class MonitoringStore:
    def __init__(self, database_path: Path = DATABASE_PATH) -> None:
        self.database_path = database_path

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.database_path, timeout=5)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS service_status (
                    service_id TEXT PRIMARY KEY,
                    service_name TEXT NOT NULL,
                    current_status TEXT NOT NULL,
                    checked_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS incidents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    service_id TEXT NOT NULL,
                    service_name TEXT NOT NULL,
                    previous_status TEXT,
                    current_status TEXT NOT NULL,
                    occurred_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS webhook_simulations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    destination TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    simulated_at TEXT NOT NULL
                );
                """
            )

    def record_snapshot(self, services: list[dict[str, Any]], checked_at: str) -> None:
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            for service in services:
                previous = connection.execute(
                    "SELECT current_status FROM service_status WHERE service_id = ?",
                    (service["id"],),
                ).fetchone()
                previous_status = previous["current_status"] if previous else None
                if previous_status != service["status"]:
                    connection.execute(
                        """
                        INSERT INTO incidents (
                            service_id, service_name, previous_status, current_status, occurred_at
                        ) VALUES (?, ?, ?, ?, ?)
                        """,
                        (
                            service["id"],
                            service["name"],
                            previous_status,
                            service["status"],
                            checked_at,
                        ),
                    )

                connection.execute(
                    """
                    INSERT INTO service_status (service_id, service_name, current_status, checked_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(service_id) DO UPDATE SET
                        service_name = excluded.service_name,
                        current_status = excluded.current_status,
                        checked_at = excluded.checked_at
                    """,
                    (service["id"], service["name"], service["status"], checked_at),
                )

    def get_incidents(self, limit: int = 50) -> list[dict[str, Any]]:
        with self.connect() as connection:
            rows = connection.execute(
                """
                SELECT id, service_id, service_name, previous_status, current_status, occurred_at
                FROM incidents
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(row) for row in rows]

    def record_webhook_simulation(self, payload: dict[str, Any], simulated_at: str) -> int:
        with self.connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO webhook_simulations (destination, payload, simulated_at)
                VALUES (?, ?, ?)
                """,
                ("local://webhook-simulator", json.dumps(payload, ensure_ascii=False), simulated_at),
            )
            return int(cursor.lastrowid)


async def create_snapshot(
    store: MonitoringStore,
) -> tuple[str, list[dict[str, Any]]]:
    services = load_services()
    memory_by_port = await asyncio.to_thread(listener_memory_by_port)
    async with httpx.AsyncClient(
        timeout=PROBE_TIMEOUT_SECONDS,
        follow_redirects=False,
        trust_env=False,
    ) as client:
        results = await asyncio.gather(
            *(check_service(client, service, memory_by_port) for service in services)
        )

    checked_at = datetime.now(timezone.utc).isoformat()
    store.record_snapshot(results, checked_at)
    return checked_at, results
