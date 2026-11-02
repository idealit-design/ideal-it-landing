import hashlib
import json
import re
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from pydantic import BaseModel, ConfigDict, Field, ValidationError, create_model

from services.validation_service import (
    DocumentType,
    Region,
    domain_has_mx,
    validate_email_syntax,
    validate_identity_format,
)
from services.utility_log import log_utility_run


router = APIRouter()
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
SCHEMA_TYPES: dict[str, type[Any]] = {
    "string": str,
    "integer": int,
    "number": float,
    "boolean": bool,
    "array": list[Any],
    "object": dict[str, Any],
}
SIGNATURES = (
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"%PDF-", "application/pdf"),
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
    (b"MZ", "application/x-msdownload"),
    (b"\x7fELF", "application/x-executable"),
    (b"RIFF", "application/octet-stream"),
    (b"PK\x03\x04", "application/zip"),
)
ALLOWED_MIME_TYPES = {
    "application/json",
    "application/pdf",
    "application/xml",
    "image/gif",
    "image/jpeg",
    "image/png",
    "text/csv",
    "text/plain",
}
BLOCKED_SUFFIXES = {
    ".bat", ".cmd", ".com", ".dll", ".exe", ".htm", ".html",
    ".js", ".msi", ".ps1", ".scr", ".sh", ".svg", ".vbs",
}


class StructureRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    data: str = Field(max_length=1_000_000)
    schema_definition: dict[str, Any] | None = Field(default=None, alias="schema")
    formats: dict[str, str] = Field(default_factory=dict)


class FileValidationResponse(BaseModel):
    filename: str
    size_bytes: int
    sha256: str
    detected_mime: str
    declared_mime: str
    safe_for_demo: bool
    warnings: list[str]
    scan_scope: str = "MIME/hash check only; no malware scan"


class EmailValidationRequest(BaseModel):
    email: str = Field(max_length=320)
    check_mx: bool = True


class IdentityValidationRequest(BaseModel):
    region: Region
    document_type: DocumentType
    value: str = Field(min_length=1, max_length=40)


def _create_schema_model(schema: dict[str, Any], model_name: str) -> type[BaseModel]:
    if schema.get("type", "object") != "object":
        raise ValueError("El esquema raíz debe ser un objeto.")
    properties = schema.get("properties")
    if not isinstance(properties, dict) or not properties:
        raise ValueError("El esquema debe declarar al menos una propiedad.")
    required = schema.get("required", [])
    if not isinstance(required, list) or not all(
        isinstance(field, str) for field in required
    ):
        raise ValueError("'required' debe ser una lista.")
    if not set(required).issubset(properties):
        raise ValueError("'required' contiene propiedades no declaradas.")

    fields: dict[str, tuple[Any, Any]] = {}
    for name, definition in properties.items():
        if not isinstance(name, str) or not name.isidentifier():
            raise ValueError("Nombre de propiedad inválido.")
        if not isinstance(definition, dict):
            raise ValueError(f"Definición inválida: {name}.")
        kind = definition.get("type", "string")
        annotation = SCHEMA_TYPES.get(kind)
        if annotation is None:
            raise ValueError(f"Tipo de esquema no soportado: {kind}.")
        if kind == "object" and "properties" in definition:
            annotation = _create_schema_model(definition, f"{model_name}_{name}")
        elif kind == "array":
            item_schema = definition.get("items")
            if isinstance(item_schema, dict):
                item_type = SCHEMA_TYPES.get(item_schema.get("type", "string"))
                if item_type is None:
                    raise ValueError(f"Tipo de elemento no soportado en {name}.")
                if item_schema.get("type") == "object" and "properties" in item_schema:
                    item_type = _create_schema_model(
                        item_schema, f"{model_name}_{name}_item"
                    )
                annotation = list[item_type]
        if "enum" in definition:
            allowed = definition["enum"]
            if not isinstance(allowed, list) or not allowed:
                raise ValueError(f"Enum inválido en {name}.")
            from typing import Literal

            annotation = Literal.__getitem__(tuple(allowed))
        default = ... if name in required else None
        fields[name] = (annotation, default)

    return create_model(
        model_name,
        __config__=ConfigDict(extra="forbid"),
        **fields,
    )


def _validate_dynamic_schema(
    payload: Any, schema: dict[str, Any]
) -> list[dict[str, str]]:
    try:
        dynamic_model = _create_schema_model(schema, "DynamicValidationModel")
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    try:
        dynamic_model.model_validate(payload)
    except ValidationError as error:
        return [
            {
                "field": ".".join(str(part) for part in item["loc"]),
                "message": item["msg"],
            }
            for item in error.errors()
        ]

    return []


def _format_errors(formats: dict[str, str]) -> list[dict[str, str]]:
    errors: list[dict[str, str]] = []
    for field, value in formats.items():
        if field == "email" and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            errors.append({"field": field, "message": "Formato de correo inválido."})
        elif field == "phone":
            digits = re.sub(r"\D", "", value)
            if not 7 <= len(digits) <= 15:
                errors.append(
                    {"field": field, "message": "Debe contener entre 7 y 15 dígitos."}
                )
        elif field == "tax_identifier":
            match = re.fullmatch(r"00-(\d{8})-(\d)", value)
            if not match:
                errors.append(
                    {
                        "field": field,
                        "message": "Use el formato sintético reservado 00-XXXXXXXX-D.",
                    }
                )
            else:
                digits = f"00{match.group(1)}"
                weights = (5, 4, 3, 2, 7, 6, 5, 4, 3, 2)
                remainder = sum(
                    int(digit) * weight
                    for digit, weight in zip(digits, weights)
                ) % 11
                expected = 11 - remainder
                expected = 0 if expected == 11 else 9 if expected == 10 else expected
                if int(match.group(2)) != expected:
                    errors.append(
                        {
                            "field": field,
                            "message": "Dígito verificador no válido para el namespace sintético.",
                        }
                    )
        elif field not in {"email", "phone", "tax_identifier"}:
            errors.append(
                {"field": field, "message": "Formato no soportado por este validador."}
            )
    return errors


@router.post("/email")
def validate_email(body: EmailValidationRequest, request: Request) -> dict[str, Any]:
    syntax_valid, domain = validate_email_syntax(body.email)
    mx_valid: bool | None = None
    if syntax_valid and body.check_mx:
        try:
            mx_valid = domain_has_mx(domain or "")
        except dns.resolver.NXDOMAIN:
            mx_valid = False
        except dns.resolver.NoAnswer:
            mx_valid = False
        except (dns.exception.Timeout, dns.resolver.NoNameservers) as error:
            raise HTTPException(
                status_code=503,
                detail="No se pudo completar la consulta DNS. Inténtalo nuevamente.",
            ) from error
    result = {
        "email": body.email,
        "syntax_valid": syntax_valid,
        "mx_valid": mx_valid,
        "valid": syntax_valid and (mx_valid is not False),
        "checked_mx": syntax_valid and body.check_mx,
        "domain": domain,
    }
    log_utility_run(
        request.app.state.database_path,
        "validate_email",
        {"email_domain": domain, "checked_mx": body.check_mx},
        {key: value for key, value in result.items() if key != "email"},
        status="success" if result["valid"] else "invalid",
    )
    return result


@router.post("/identity")
def validate_identity(
    body: IdentityValidationRequest, request: Request
) -> dict[str, Any]:
    valid, normalized, error = validate_identity_format(
        body.region, body.document_type, body.value
    )
    result = {
        "valid": valid,
        "region": body.region,
        "document_type": body.document_type,
        "normalized": normalized,
        "errors": [] if valid else [error],
    }
    log_utility_run(
        request.app.state.database_path,
        "validate_identity",
        {"region": body.region, "document_type": body.document_type},
        {"valid": valid},
        status="success" if valid else "invalid",
    )
    return result


@router.post("/structure")
def validate_structure(body: StructureRequest, request: Request) -> dict[str, Any]:
    errors: list[dict[str, str]] = []
    json_is_valid = True
    try:
        payload = json.loads(body.data)
    except json.JSONDecodeError as error:
        errors.append(
            {
                "field": "json",
                "message": f"{error.msg} (línea {error.lineno}, columna {error.colno}).",
            }
        )
        payload = None
        json_is_valid = False

    if json_is_valid and body.schema_definition is not None:
        errors.extend(_validate_dynamic_schema(payload, body.schema_definition))
    errors.extend(_format_errors(body.formats))
    result = {"valid": not errors, "errors": errors}
    log_utility_run(
        request.app.state.database_path,
        "validate_structure",
        {
            "data_bytes": len(body.data.encode("utf-8")),
            "schema_present": body.schema_definition is not None,
            "format_fields": sorted(body.formats),
        },
        result,
        status="success" if not errors else "invalid",
    )
    return result


def _detect_mime(content: bytes, filename: str) -> str:
    for signature, media_type in SIGNATURES:
        if content.startswith(signature):
            if signature == b"RIFF" and content[8:12] == b"WEBP":
                return "image/webp"
            return media_type
    if content.startswith((b"{", b"[")):
        try:
            json.loads(content.decode("utf-8"))
            return "application/json"
        except (UnicodeDecodeError, json.JSONDecodeError):
            return "text/plain"
    try:
        content.decode("utf-8")
    except UnicodeDecodeError:
        return "application/octet-stream"
    suffix = Path(filename).suffix.lower()
    if suffix == ".csv":
        return "text/csv"
    if suffix in {".txt", ".md"}:
        return "text/plain"
    if suffix == ".xml":
        return "application/xml"
    return "text/plain"


@router.post("/file-integrity", response_model=FileValidationResponse)
async def validate_file(
    request: Request, file: UploadFile = File(...)
) -> FileValidationResponse:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera el límite de 10 MB.")
    filename = Path(file.filename or "archivo").name
    detected_mime = _detect_mime(content, filename)
    warnings: list[str] = []
    extension_blocked = Path(filename).suffix.lower() in BLOCKED_SUFFIXES
    mime_allowed = detected_mime in ALLOWED_MIME_TYPES
    if not mime_allowed or extension_blocked:
        warnings.append("Tipo no permitido para fixtures; no almacenar ni ejecutar.")
    if file.content_type and file.content_type != detected_mime:
        warnings.append("El MIME declarado no coincide con el contenido detectado.")
    result = FileValidationResponse(
        filename=filename,
        size_bytes=len(content),
        sha256=hashlib.sha256(content).hexdigest(),
        detected_mime=detected_mime,
        declared_mime=file.content_type or "desconocido",
        safe_for_demo=mime_allowed and not extension_blocked,
        warnings=warnings,
    )
    log_utility_run(
        request.app.state.database_path,
        "validate_file",
        {"filename": filename, "size_bytes": len(content)},
        result.model_dump(),
        status="success" if result.safe_for_demo else "invalid",
    )
    return result
