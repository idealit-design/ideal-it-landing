from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


DocumentType = Literal["dni", "medical_license"]


class AssetResponse(BaseModel):
    filename: str
    media_type: str
    url: str


class IdentityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_type: DocumentType
    full_name: str
    identifier: str
    payload: dict[str, Any]
    created_at: datetime
    assets: list[AssetResponse]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str
