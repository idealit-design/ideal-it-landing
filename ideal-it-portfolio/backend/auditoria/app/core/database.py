import os
import sqlite3
from pathlib import Path
from typing import Iterator

DEFAULT_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "db" / "auditoria_mvp.db"


def get_db_path() -> Path:
    return Path(os.getenv("AUDITORIA_DATABASE_PATH", str(DEFAULT_DB_PATH))).expanduser()


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
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS audit_documents (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                document_type TEXT NOT NULL,
                page_count INTEGER NOT NULL CHECK (page_count > 0),
                status TEXT NOT NULL DEFAULT 'demo'
            );
            CREATE TABLE IF NOT EXISTS audit_cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                specialty TEXT NOT NULL,
                nomenclator_code TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'open',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS nomenclator (
                code TEXT PRIMARY KEY,
                description TEXT NOT NULL,
                specialty TEXT NOT NULL
            );
            INSERT OR IGNORE INTO audit_documents
                (id, title, document_type, page_count, status)
            VALUES
                (1, 'Resumen clínico de muestra', 'informe', 2, 'demo'),
                (2, 'Orden de práctica de muestra', 'orden', 1, 'demo'),
                (3, 'Constancia de atención de muestra', 'constancia', 1, 'demo');
            INSERT OR IGNORE INTO nomenclator (code, description, specialty)
            VALUES
                ('SIM-CLI-001', 'Consulta clínica de demostración', 'Clínica médica'),
                ('SIM-CAR-001', 'Evaluación cardiológica de demostración', 'Cardiología'),
                ('SIM-IMA-001', 'Estudio por imágenes de demostración', 'Diagnóstico por imágenes');
            """
        )


def row_to_dict(row: sqlite3.Row) -> dict[str, object]:
    return dict(row)
