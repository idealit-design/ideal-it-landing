from contextlib import asynccontextmanager
from datetime import datetime, timezone
import re
import sqlite3

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.core.database import get_db, init_db, row_to_dict

IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9-]{3,20}$")
DNI_PATTERN = re.compile(r"^\d{7,8}$")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Ideal-IT MVP Auditoría Médica", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuditCaseCreate(BaseModel):
    specialty: str = Field(min_length=2, max_length=80)
    nomenclator_code: str = Field(min_length=3, max_length=24)
    notes: str = Field(default="", max_length=500)


def validate_mock_identifier(value: str, pattern: re.Pattern[str], label: str) -> str:
    if not pattern.fullmatch(value):
        raise HTTPException(status_code=422, detail=f"{label} inválido para una consulta demo.")
    return value


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mvp": "auditoria", "database": "auditoria_mvp.db"}


@app.get("/api/auditoria/documents")
def list_documents(
    connection: sqlite3.Connection = Depends(get_db),
) -> list[dict[str, object]]:
    rows = connection.execute(
        "SELECT id, title, document_type, page_count, status FROM audit_documents ORDER BY id"
    ).fetchall()
    return [{**row_to_dict(row), "demo_only": True} for row in rows]


@app.get("/api/auditoria/registry/matricula/{license_number}")
def simulate_license_lookup(license_number: str) -> dict[str, object]:
    validate_mock_identifier(license_number, IDENTIFIER_PATTERN, "matricula")
    return {
        "source": "MATRICULA_NACIONAL",
        "query": license_number,
        "simulated": True,
        "result": "consulta simulada",
        "message": "Respuesta ficticia. No se consultó una matrícula oficial.",
    }


@app.get("/api/auditoria/registry/renaper/{dni}")
def simulate_identity_lookup(dni: str) -> dict[str, object]:
    validate_mock_identifier(dni, DNI_PATTERN, "dni")
    return {
        "source": "RENAPER",
        "query": dni,
        "simulated": True,
        "result": "consulta simulada",
        "message": "Respuesta ficticia. No se consultó RENAPER ni se verificó identidad.",
    }


@app.get("/api/auditoria/nomenclator")
def search_nomenclator(
    specialty: str | None = Query(default=None, max_length=80),
    q: str | None = Query(default=None, max_length=80),
    connection: sqlite3.Connection = Depends(get_db),
) -> list[dict[str, object]]:
    clauses: list[str] = []
    values: list[str] = []
    if specialty:
        clauses.append("specialty = ?")
        values.append(specialty.strip())
    if q and q.strip():
        clauses.append("(code LIKE ? OR description LIKE ?)")
        search = f"%{q.strip()}%"
        values.extend((search, search))
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = connection.execute(
        f"SELECT code, description, specialty FROM nomenclator{where} ORDER BY specialty, code",
        values,
    ).fetchall()
    return [{**row_to_dict(row), "demo_only": True} for row in rows]


@app.post("/api/auditoria/cases", status_code=201)
def create_audit_case(
    payload: AuditCaseCreate,
    connection: sqlite3.Connection = Depends(get_db),
) -> dict[str, object]:
    code = connection.execute(
        "SELECT specialty FROM nomenclator WHERE code = ?", (payload.nomenclator_code,)
    ).fetchone()
    if code is None or code["specialty"] != payload.specialty:
        raise HTTPException(
            status_code=422,
            detail="El código debe pertenecer al catálogo demo y a la especialidad seleccionada.",
        )
    cursor = connection.execute(
        """
        INSERT INTO audit_cases (specialty, nomenclator_code, notes, status)
        VALUES (?, ?, ?, 'open')
        """,
        (payload.specialty, payload.nomenclator_code, payload.notes.strip()),
    )
    connection.commit()
    return {
        "id": cursor.lastrowid,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
