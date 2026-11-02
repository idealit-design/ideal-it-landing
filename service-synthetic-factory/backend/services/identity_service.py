from datetime import date, datetime, timedelta, timezone
import json
import random
import sqlite3
from pathlib import Path
from typing import Any
from uuid import uuid4

from faker import Faker

from database import get_connection
from generators.dni import generate_dni_image
from generators.medical import generate_medical_assets
from models import GeneratedAsset, IdentityRecord


FAKE = Faker("es_AR")
SPECIALTIES = (
    "Medicina general ficticia",
    "Cardiologia de demostracion",
    "Pediatria sintetica",
    "Dermatologia ficticia",
    "Traumatologia de prueba",
)


def _synthetic_cuit(document_number: str) -> str:
    digits = f"00{document_number[-8:]}"
    weights = (5, 4, 3, 2, 7, 6, 5, 4, 3, 2)
    remainder = sum(int(digit) * weight for digit, weight in zip(digits, weights)) % 11
    check_digit = 11 - remainder
    if check_digit == 11:
        check_digit = 0
    elif check_digit == 10:
        check_digit = 9
    return f"00-{digits[2:]}-{check_digit}"


def identity_payload(record_id: str) -> dict[str, Any]:
    first_name = FAKE.first_name()
    last_name = FAKE.last_name()
    full_name = f"{first_name} {last_name}"
    document_number = f"000{random.randint(0, 99_999_999):08d}"
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
        "tax_identifier": _synthetic_cuit(document_number),
        "tax_identifier_namespace": "SYNTHETIC-NOT-REGISTERED",
        "birth_date": FAKE.date_of_birth(minimum_age=21, maximum_age=75).isoformat(),
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


def medical_payload(record_id: str) -> dict[str, Any]:
    payload = identity_payload(record_id)
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
    return payload


def record_from_database(
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


def persist_record(
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
            [(record_id, asset.filename, asset.media_type) for asset in assets],
        )
        return record_from_database(connection, record_id)


def generate_identity(
    database_path: Path, assets_dir: Path, document_type: str
) -> IdentityRecord:
    record_id = uuid4().hex
    payload = (
        medical_payload(record_id)
        if document_type == "medical_license"
        else identity_payload(record_id)
    )
    if document_type == "medical_license":
        jpeg_filename = f"{record_id}-medical.jpeg"
        pdf_filename = f"{record_id}-medical.pdf"
        generate_medical_assets(
            payload, assets_dir / jpeg_filename, assets_dir / pdf_filename
        )
        assets = [
            GeneratedAsset(pdf_filename, "application/pdf"),
            GeneratedAsset(jpeg_filename, "image/jpeg"),
        ]
    else:
        jpeg_filename = f"{record_id}-dni.jpeg"
        generate_dni_image(payload, assets_dir / jpeg_filename)
        assets = [GeneratedAsset(jpeg_filename, "image/jpeg")]

    try:
        return persist_record(database_path, record_id, document_type, payload, assets)
    except Exception:
        for asset in assets:
            path = assets_dir / asset.filename
            if path.exists():
                path.unlink()
        raise
