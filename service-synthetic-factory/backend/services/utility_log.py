from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any
from uuid import uuid4

from database import get_connection


def log_utility_run(
    database_path: Path,
    operation: str,
    input_data: dict[str, Any],
    result_data: dict[str, Any],
    status: str = "success",
) -> None:
    with get_connection(database_path) as connection:
        connection.execute(
            """
            INSERT INTO utility_runs
                (id, operation, status, input_json, result_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                uuid4().hex,
                operation,
                status,
                json.dumps(input_data, ensure_ascii=False, sort_keys=True),
                json.dumps(result_data, ensure_ascii=False, sort_keys=True),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
