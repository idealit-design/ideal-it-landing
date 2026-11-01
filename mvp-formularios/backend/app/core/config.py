import os
from pathlib import Path
import tempfile

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "db" / "formularios_mvp.db"


def get_database_path() -> Path:
    configured_path = os.environ.get("FORMULARIOS_MVP_DATABASE_PATH")
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
            "FORMULARIOS_MVP_DATABASE_PATH debe estar dentro del módulo o del directorio temporal."
        )
    return database_path
