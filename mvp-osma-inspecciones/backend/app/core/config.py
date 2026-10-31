import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "db" / "osma_mvp.db"


def get_database_path() -> Path:
    configured_path = os.environ.get("OSMA_MVP_DATABASE_PATH")
    if configured_path:
        return Path(configured_path).expanduser().resolve()
    return DEFAULT_DATABASE_PATH


def get_allowed_origins() -> list[str]:
    configured_origins = os.environ.get("OSMA_MVP_CORS_ORIGINS")
    if configured_origins:
        return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    return ["http://localhost:5173", "http://127.0.0.1:5173"]
