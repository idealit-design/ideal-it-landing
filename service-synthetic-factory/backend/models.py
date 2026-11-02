from dataclasses import dataclass
import json
import sqlite3
from typing import Any


@dataclass(frozen=True)
class GeneratedAsset:
    filename: str
    media_type: str


@dataclass(frozen=True)
class IdentityRecord:
    id: str
    document_type: str
    full_name: str
    identifier: str
    payload: dict[str, Any]
    created_at: str
    assets: list[GeneratedAsset]

    @classmethod
    def from_rows(
        cls, row: sqlite3.Row, asset_rows: list[sqlite3.Row]
    ) -> "IdentityRecord":
        return cls(
            id=row["id"],
            document_type=row["document_type"],
            full_name=row["full_name"],
            identifier=row["identifier"],
            payload=json.loads(row["payload_json"]),
            created_at=row["created_at"],
            assets=[
                GeneratedAsset(
                    filename=asset["filename"],
                    media_type=asset["media_type"],
                )
                for asset in asset_rows
            ],
        )
