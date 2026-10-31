import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "db" / "personal_mvp.db"


def get_database_path() -> Path:
    configured_path = os.environ.get("PERSONAL_MVP_DATABASE_PATH")
    if configured_path:
        return Path(configured_path).expanduser().resolve()
    return DEFAULT_DATABASE_PATH
