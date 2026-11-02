from datetime import datetime, timezone
from pathlib import Path
import random
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from models import IdentityRecord
from schemas import IdentityResponse
from services.document_service import create_invoice_pdf
from services.identity_service import generate_identity
from services.utility_log import log_utility_run


router = APIRouter()


class InvoiceRequest(BaseModel):
    item_count: int = Field(default=3, ge=1, le=10)
    payment_method: str = Field(default="simulado", max_length=30)


def _identity_response(record: IdentityRecord, request: Request) -> IdentityResponse:
    return IdentityResponse(
        id=record.id,
        document_type=record.document_type,  # type: ignore[arg-type]
        full_name=record.full_name,
        identifier=record.identifier,
        payload=record.payload,
        created_at=record.created_at,
        assets=[
            {
                "filename": asset.filename,
                "media_type": asset.media_type,
                "url": str(request.url_for("get_asset", filename=asset.filename)),
            }
            for asset in record.assets
        ],
    )


@router.post("/profiles", response_model=IdentityResponse, status_code=201)
def create_profile(request: Request) -> IdentityResponse:
    record = generate_identity(
        request.app.state.database_path,
        request.app.state.assets_dir,
        "dni",
    )
    log_utility_run(
        request.app.state.database_path,
        "generate_profile",
        {},
        {"id": record.id, "synthetic": True},
    )
    return _identity_response(record, request)


@router.post("/medical-credentials", response_model=IdentityResponse, status_code=201)
def create_medical_credential(request: Request) -> IdentityResponse:
    record = generate_identity(
        request.app.state.database_path,
        request.app.state.assets_dir,
        "medical_license",
    )
    log_utility_run(
        request.app.state.database_path,
        "generate_medical_credential",
        {},
        {"id": record.id, "synthetic": True},
    )
    return _identity_response(record, request)


@router.post("/invoices", status_code=201)
def create_invoice(body: InvoiceRequest, request: Request) -> dict[str, Any]:
    invoice_id = f"DEMO-{uuid4().hex[:10].upper()}"
    items = [
        {
            "description": f"Producto sintetico {index + 1}",
            "quantity": 1,
            "unit_price": round(random.uniform(100, 25_000), 2),
        }
        for index in range(body.item_count)
    ]
    for item in items:
        item["total"] = item["quantity"] * item["unit_price"]
    invoice = {
        "synthetic": True,
        "notice": "Comprobante de demostracion. No tiene validez fiscal.",
        "invoice_id": invoice_id,
        "merchant": "Comercio de prueba Ideal-IT",
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "payment_method": body.payment_method,
        "items": items,
        "total": round(sum(item["total"] for item in items), 2),
    }
    filename = f"{invoice_id.lower()}-invoice.pdf"
    create_invoice_pdf(invoice, request.app.state.assets_dir / filename)
    log_utility_run(
        request.app.state.database_path,
        "generate_invoice",
        body.model_dump(),
        invoice,
    )
    return {
        "invoice": invoice,
        "assets": [
            {
                "filename": filename,
                "media_type": "application/pdf",
                "url": str(request.url_for("get_asset", filename=filename)),
            }
        ],
    }
