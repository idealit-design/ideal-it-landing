import os
import sqlite3
from pathlib import Path
from typing import Iterator

DEFAULT_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "db" / "personal_mvp.db"


def get_db_path() -> Path:
    return Path(os.getenv("PERSONAL_DATABASE_PATH", str(DEFAULT_DB_PATH))).expanduser()


def get_db() -> Iterator[sqlite3.Connection]:
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=10, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    try:
        yield connection
    finally:
        connection.close()


def init_db() -> None:
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path, timeout=10) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS areas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                floor TEXT NOT NULL,
                department TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS staff (
                dni TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                area_id INTEGER,
                FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS leave_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dni TEXT NOT NULL,
                leave_type TEXT NOT NULL CHECK (leave_type IN ('medical', 'vacation')),
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                CHECK (end_date >= start_date),
                FOREIGN KEY (dni) REFERENCES staff(dni) ON DELETE CASCADE
            );
            INSERT OR IGNORE INTO areas (id, name, floor, department)
            VALUES (1, 'Área Demo', '1', 'Administración');
            INSERT OR IGNORE INTO staff (dni, full_name, area_id)
            VALUES ('00000001', 'Alex Demo', 1);
            """
        )


def row_to_dict(row: sqlite3.Row) -> dict[str, object]:
    return dict(row)
