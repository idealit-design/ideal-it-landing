import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "db" / "auditoria_mvp.db"
DEFAULT_STORAGE_PATH = BACKEND_DIR / "data" / "storage"


def get_database_path() -> Path:
    configured_path = os.environ.get("AUDITORIA_MVP_DATABASE_PATH")
    if configured_path:
        return Path(configured_path).expanduser().resolve()
    return DEFAULT_DATABASE_PATH


def get_storage_path() -> Path:
    configured_path = os.environ.get("AUDITORIA_MVP_STORAGE_PATH")
    if configured_path:
        return Path(configured_path).expanduser().resolve()
    return DEFAULT_STORAGE_PATH
