from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import json
import os
import random
import secrets
import sqlite3
from typing import Any, AsyncIterator
from uuid import uuid4

from faker import Faker
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from database import DATABASE_PATH, initialize_database, get_connection
from generators.dni import generate_dni_image
from generators.medical import generate_medical_assets
from models import GeneratedAsset, IdentityRecord
from routers import converters, generators, mcp_bridge, validators
from schemas import HealthResponse, IdentityResponse


VERSION = "0.1.0"
BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_ASSETS_DIR = BACKEND_DIR / "data" / "generated"
ASSETS_DIR = Path(
    os.environ.get("FACTORY_ASSETS_DIR", str(DEFAULT_ASSETS_DIR))
).expanduser()
DEFAULT_CORS_ORIGINS = (
    "http://127.0.0.1:4209",
    "http://localhost:4209",
)
FAKE = Faker("es_AR")
SPECIALTIES = (
    "Medicina general ficticia",
    "Cardiologia de demostracion",
    "Pediatria sintetica",
    "Dermatologia ficticia",
    "Traumatologia de prueba",
)


def _document_number() -> str:
    return f"000{random.randint(0, 99_999_999):08d}"


def _identity_payload(record_id: str) -> dict[str, Any]:
    first_name = FAKE.first_name()
    last_name = FAKE.last_name()
    full_name = f"{first_name} {last_name}"
    birth_date = FAKE.date_of_birth(minimum_age=21, maximum_age=75).isoformat()
    document_number = _document_number()
    return {
        "synthetic": True,
        "notice": (
            "Datos completamente ficticios para pruebas locales. "
            "No representan una identidad real ni tienen validez oficial."
        ),
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name,
        "document_number": document_number,
        "birth_date": birth_date,
        "nationality": "Argentina (dato de muestra)",
        "sex": random.choice(("F", "M", "X")),
        "address": FAKE.street_address(),
        "schema_adapters": {
            "mvp_personal": {
                "dni": document_number,
                "nombre": first_name,
                "apellido": last_name,
                "legajo": f"SYN-{record_id[:8].upper()}",
                "activo": True,
            },
            "mvp_auditoria": {
                "nombre": full_name,
                "documento": document_number,
                "matricula": f"SYN-MED-{record_id[:8].upper()}",
                "especialidad": "Especialidad ficticia",
            },
            "mvp_visitor_pass": {
                "dni": document_number,
                "nombre_apellido": full_name,
                "empresa_origen": "EMPRESA DE DEMOSTRACION",
                "telefono": "000-000-0000",
            },
            "app_portal_ciudadano": {
                "documento": document_number,
                "nombre": full_name,
            },
            "web_pos_comercial": {
                "codigo": f"DEMO-{record_id[:8].upper()}",
                "nombre": "Articulo de demostracion",
                "categoria": "DEMO",
                "precio": "0.00",
                "activo": False,
            },
        },
    }


def _medical_payload(record_id: str) -> dict[str, Any]:
    payload = _identity_payload(record_id)
    issue_date = date.today()
    payload.update(
        {
            "license_number": f"SYN-MED-{record_id[:8].upper()}",
            "specialty": random.choice(SPECIALTIES),
            "issue_date": issue_date.isoformat(),
            "expiry_date": (issue_date + timedelta(days=365 * 5)).isoformat(),
            "institution": "Instituto Medico de Demostracion (ficticio)",
        }
    )
    payload["schema_adapters"]["mvp_auditoria"].update(
        {
            "matricula": payload["license_number"],
            "especialidad": payload["specialty"],
        }
    )
    payload["schema_adapters"]["mvp_personal"]["dni"] = payload["document_number"]
    return payload


def _record_from_database(
    connection: sqlite3.Connection, record_id: str
) -> IdentityRecord:
    row = connection.execute(
        "SELECT * FROM identities WHERE id = ?", (record_id,)
    ).fetchone()
    if row is None:
        raise RuntimeError(f"Generated identity {record_id} was not persisted.")
    assets = connection.execute(
        "SELECT filename, media_type FROM generated_assets "
        "WHERE identity_id = ? ORDER BY id",
        (record_id,),
    ).fetchall()
    return IdentityRecord.from_rows(row, assets)


def _persist_record(
    database_path: Path,
    record_id: str,
    document_type: str,
    payload: dict[str, Any],
    assets: list[GeneratedAsset],
) -> IdentityRecord:
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection(database_path) as connection:
        connection.execute(
            """
            INSERT INTO identities
                (id, document_type, full_name, identifier, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                record_id,
                document_type,
                payload["full_name"],
                payload["license_number"]
                if document_type == "medical_license"
                else payload["document_number"],
                json.dumps(payload, ensure_ascii=False, sort_keys=True),
                created_at,
            ),
        )
        connection.executemany(
            "INSERT INTO generated_assets (identity_id, filename, media_type) "
            "VALUES (?, ?, ?)",
            [
                (record_id, asset.filename, asset.media_type)
                for asset in assets
            ],
        )
        return _record_from_database(connection, record_id)


def _response(record: IdentityRecord, request: Request) -> IdentityResponse:
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
                "url": str(
                    request.url_for("get_asset", filename=asset.filename)
                ),
            }
            for asset in record.assets
        ],
    )


def _remove_generated_files(directory: Path, filenames: list[str]) -> None:
    for filename in filenames:
        path = directory / filename
        if path.exists():
            path.unlink()


def create_app(
    database_path: Path = DATABASE_PATH,
    assets_dir: Path = ASSETS_DIR,
    cors_origins: tuple[str, ...] = DEFAULT_CORS_ORIGINS,
) -> FastAPI:
    database_path = Path(database_path)
    assets_dir = Path(assets_dir)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        initialize_database(database_path)
        assets_dir.mkdir(parents=True, exist_ok=True)
        yield

    app = FastAPI(
        title="Service Synthetic Factory",
        version=VERSION,
        description="Generador local de documentos y datos completamente ficticios.",
        lifespan=lifespan,
    )
    app.state.database_path = database_path
    app.state.assets_dir = assets_dir
    app.state.webhook_signing_key = secrets.token_bytes(32)
    app.include_router(generators.router, prefix="/api/v1/generators", tags=["generators"])
    app.include_router(validators.router, prefix="/api/v1/validators", tags=["validators"])
    app.include_router(converters.router, prefix="/api/v1/converters", tags=["converters"])
    app.include_router(mcp_bridge.router, prefix="/api/v1/mcp-bridge", tags=["mcp-bridge"])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(status="ok", version=VERSION)

    @app.post(
        "/api/v1/generate/dni",
        response_model=IdentityResponse,
        status_code=201,
    )
    def generate_dni(request: Request) -> IdentityResponse:
        record_id = uuid4().hex
        payload = _identity_payload(record_id)
        filename = f"{record_id}-dni.jpeg"
        generate_dni_image(payload, assets_dir / filename)
        assets = [GeneratedAsset(filename, "image/jpeg")]
        try:
            record = _persist_record(
                database_path, record_id, "dni", payload, assets
            )
        except Exception:
            _remove_generated_files(assets_dir, [filename])
            raise
        return _response(record, request)

    @app.post(
        "/api/v1/generate/medical-license",
        response_model=IdentityResponse,
        status_code=201,
    )
    def generate_medical_license(request: Request) -> IdentityResponse:
        record_id = uuid4().hex
        payload = _medical_payload(record_id)
        jpeg_filename = f"{record_id}-medical.jpeg"
        pdf_filename = f"{record_id}-medical.pdf"
        jpeg_path = assets_dir / jpeg_filename
        pdf_path = assets_dir / pdf_filename
        generate_medical_assets(payload, jpeg_path, pdf_path)
        assets = [
            GeneratedAsset(pdf_filename, "application/pdf"),
            GeneratedAsset(jpeg_filename, "image/jpeg"),
        ]
        try:
            record = _persist_record(
                database_path, record_id, "medical_license", payload, assets
            )
        except Exception:
            _remove_generated_files(
                assets_dir, [jpeg_filename, pdf_filename]
            )
            raise
        return _response(record, request)

    @app.get("/api/v1/identities", response_model=list[IdentityResponse])
    def list_identities(
        request: Request,
        limit: int = Query(default=50, ge=1, le=100),
    ) -> list[IdentityResponse]:
        with get_connection(database_path) as connection:
            rows = connection.execute(
                "SELECT id FROM identities ORDER BY created_at DESC, rowid DESC "
                "LIMIT ?",
                (limit,),
            ).fetchall()
            records = [
                _record_from_database(connection, row["id"]) for row in rows
            ]
        return [_response(record, request) for record in records]

    @app.get("/api/v1/assets/{filename}", name="get_asset")
    def get_asset(
        filename: str, download: bool = Query(default=False)
    ) -> FileResponse:
        safe_name = Path(filename).name
        if (
            safe_name != filename
            or not filename.lower().endswith((".pdf", ".jpeg", ".png"))
        ):
            raise HTTPException(status_code=404, detail="Asset not found.")
        asset_path = (assets_dir / safe_name).resolve()
        if asset_path.parent != assets_dir.resolve() or not asset_path.is_file():
            raise HTTPException(status_code=404, detail="Asset not found.")
        media_type = (
            "application/pdf"
            if asset_path.suffix.lower() == ".pdf"
            else "image/jpeg"
        )
        return FileResponse(
            asset_path,
            media_type=media_type,
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{safe_name}"'
                    if download
                    else f'inline; filename="{safe_name}"'
                )
            },
        )

    return app


app = create_app()
