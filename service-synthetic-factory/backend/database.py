from contextlib import contextmanager
import os
import sqlite3
import tempfile
from pathlib import Path
from typing import Iterator


BACKEND_DIR = Path(__file__).resolve().parent
MODULE_ROOT = BACKEND_DIR.parent.resolve()
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "db" / "factory_mvp.db"


def _validated_database_path(database_path: Path) -> Path:
    resolved_path = Path(database_path).expanduser().resolve()
    temp_root = Path(tempfile.gettempdir()).resolve()
    if not resolved_path.is_relative_to(MODULE_ROOT) and not resolved_path.is_relative_to(
        temp_root
    ):
        raise ValueError(
            "FACTORY_DATABASE_PATH debe estar dentro del módulo o del directorio temporal."
        )
    return resolved_path


DATABASE_PATH = _validated_database_path(
    Path(os.environ.get("FACTORY_DATABASE_PATH", str(DEFAULT_DATABASE_PATH)))
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS identities (
    id TEXT PRIMARY KEY,
    document_type TEXT NOT NULL
        CHECK (document_type IN ('dni', 'medical_license')),
    full_name TEXT NOT NULL,
    identifier TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_identities_created_at
    ON identities (created_at DESC);
CREATE TABLE IF NOT EXISTS generated_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identity_id TEXT NOT NULL,
    filename TEXT NOT NULL UNIQUE,
    media_type TEXT NOT NULL,
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assets_identity_id
    ON generated_assets (identity_id);
CREATE TABLE IF NOT EXISTS utility_runs (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'invalid')),
    input_json TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_utility_runs_created_at
    ON utility_runs (created_at DESC);
"""


@contextmanager
def get_connection(
    database_path: Path | None = None,
) -> Iterator[sqlite3.Connection]:
    path = _validated_database_path(database_path or DATABASE_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=5.0)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database(database_path: Path | None = None) -> None:
    with get_connection(database_path) as connection:
        connection.executescript(SCHEMA)
