import os
import tempfile
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "db" / "osma_mvp.db"


def get_database_path() -> Path:
    configured_path = os.environ.get("OSMA_MVP_DATABASE_PATH")
    database_path = (
        Path(configured_path).expanduser().resolve()
        if configured_path
        else DEFAULT_DATABASE_PATH
    )
    temp_root = Path(tempfile.gettempdir()).resolve()
    if not database_path.is_relative_to(BACKEND_DIR) and not database_path.is_relative_to(
        temp_root
    ):
        raise ValueError(
            "OSMA_MVP_DATABASE_PATH debe estar dentro del módulo o del directorio temporal."
        )
    return database_path


def get_allowed_origins() -> list[str]:
    configured_origins = os.environ.get("OSMA_MVP_CORS_ORIGINS")
    if configured_origins:
        return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    return ["http://localhost:5175", "http://127.0.0.1:5175"]
