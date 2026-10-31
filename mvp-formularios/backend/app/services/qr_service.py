import base64
import secrets
from io import BytesIO

import qrcode
from fastapi import HTTPException, status

QR_PREFIX = "MVPF:"


def generate_qr_token() -> str:
    return f"{QR_PREFIX}{secrets.token_urlsafe(32)}"


def qr_data_url(code: str) -> str:
    image = qrcode.make(code)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def validate_qr_format(code: str) -> str:
    normalized = code.strip()
    if not normalized.startswith(QR_PREFIX) or len(normalized) <= len(QR_PREFIX):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código QR no pertenece al MVP Formularios.",
        )
    return normalized
