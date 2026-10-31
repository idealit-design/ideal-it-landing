import base64
import binascii
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_storage_path
from app.core.database import get_session
from app.models import AuditedProvider, VaultDocument

router = APIRouter(prefix="/api/boveda", tags=["Bóveda documental"])
MAX_FILE_BYTES = 15 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


class DocumentInput(BaseModel):
    dni_prestador: str = Field(pattern=r"^\d{7,8}$")
    nombre_archivo: str = Field(min_length=1, max_length=255)
    tipo_documento: str = Field(min_length=2, max_length=80)
    contenido_base64: str = Field(min_length=1)


@router.get("")
def list_documents(
    dni_prestador: str | None = Query(default=None, pattern=r"^\d{7,8}$"),
    session: Session = Depends(get_session),
) -> list[dict[str, object]]:
    query = select(VaultDocument).order_by(VaultDocument.id.desc())
    if dni_prestador:
        query = query.where(VaultDocument.dni_prestador == dni_prestador)
    return [_document_dict(document) for document in session.scalars(query).all()]


@router.post("", status_code=201)
def upload_document(
    payload: DocumentInput, session: Session = Depends(get_session)
) -> dict[str, object]:
    if session.get(AuditedProvider, payload.dni_prestador) is None:
        raise HTTPException(status_code=404, detail="No existe el prestador.")

    extension = Path(payload.nombre_archivo).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Solo se admiten PDF, PNG y JPG/JPEG.")
    try:
        content = base64.b64decode(payload.contenido_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=422, detail="El contenido Base64 no es válido.") from exc
    if not content:
        raise HTTPException(status_code=422, detail="El archivo está vacío.")
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera el límite de 15 MiB.")

    storage_path = get_storage_path()
    storage_path.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{extension}"
    target = storage_path / stored_name
    target.write_bytes(content)
    document = VaultDocument(
        dni_prestador=payload.dni_prestador,
        nombre_archivo=Path(payload.nombre_archivo).name,
        tipo_documento=payload.tipo_documento,
        ruta_local=stored_name,
        extension=extension.removeprefix("."),
    )
    session.add(document)
    try:
        session.commit()
    except SQLAlchemyError:
        session.rollback()
        target.unlink(missing_ok=True)
        raise
    session.refresh(document)
    return _document_dict(document)


@router.get("/{document_id}/contenido")
def get_document_content(
    document_id: int, session: Session = Depends(get_session)
) -> FileResponse:
    document = session.get(VaultDocument, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="No existe el documento.")

    storage_root = get_storage_path().resolve()
    file_path = (storage_root / document.ruta_local).resolve()
    if not file_path.is_relative_to(storage_root) or not file_path.is_file():
        raise HTTPException(status_code=404, detail="No se encuentra el archivo local.")
    media_type = {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
    }[document.extension]
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=document.nombre_archivo,
        content_disposition_type="inline",
    )


def _document_dict(document: VaultDocument) -> dict[str, object]:
    return {
        "id": document.id,
        "dni_prestador": document.dni_prestador,
        "nombre_archivo": document.nombre_archivo,
        "tipo_documento": document.tipo_documento,
        "ruta_local": document.ruta_local,
        "extension": document.extension,
        "url_contenido": f"/api/boveda/{document.id}/contenido",
    }
