from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
import ipaddress
import re
import sqlite3
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from app.core.database import get_db, get_db_path, init_db, row_to_dict

DNI_PATTERN = re.compile(r"^\d{7,8}$")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Ideal-IT MVP Personal & Biométrico", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class StaffCreate(BaseModel):
    dni: str
    full_name: str = Field(min_length=2, max_length=120)
    area_id: int | None = None

    @field_validator("dni")
    @classmethod
    def valid_dni(cls, value: str) -> str:
        if not DNI_PATTERN.fullmatch(value):
            raise ValueError("dni debe tener 7 u 8 dígitos.")
        return value


class AreaCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    floor: str = Field(min_length=1, max_length=30)
    department: str = Field(min_length=2, max_length=80)


class LeaveCreate(BaseModel):
    dni: str
    leave_type: Literal["medical", "vacation"]
    start_date: date
    end_date: date
    notes: str = Field(default="", max_length=300)

    @field_validator("dni")
    @classmethod
    def valid_dni(cls, value: str) -> str:
        if not DNI_PATTERN.fullmatch(value):
            raise ValueError("dni debe tener 7 u 8 dígitos.")
        return value

    @field_validator("end_date")
    @classmethod
    def valid_date_range(cls, value: date, info) -> date:
        start_date = info.data.get("start_date")
        if start_date is not None and value < start_date:
            raise ValueError("end_date no puede ser anterior a start_date.")
        return value


class BiometricConnectionRequest(BaseModel):
    device_ip: str = Field(min_length=1, max_length=64)

    @field_validator("device_ip")
    @classmethod
    def valid_abstract_ip(cls, value: str) -> str:
        try:
            return str(ipaddress.ip_address(value))
        except ValueError as exc:
            raise ValueError("device_ip debe ser una IP válida de referencia.") from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mvp": "personal", "database": get_db_path().name}


@app.get("/api/personal/staff")
def list_staff(connection: sqlite3.Connection = Depends(get_db)) -> list[dict[str, object]]:
    rows = connection.execute(
        "SELECT dni, full_name, area_id FROM staff ORDER BY full_name"
    ).fetchall()
    return [row_to_dict(row) for row in rows]


@app.post("/api/personal/staff", status_code=201)
def create_staff(
    payload: StaffCreate, connection: sqlite3.Connection = Depends(get_db)
) -> dict[str, object]:
    try:
        connection.execute(
            "INSERT INTO staff (dni, full_name, area_id) VALUES (?, ?, ?)",
            (payload.dni, payload.full_name.strip(), payload.area_id),
        )
        connection.commit()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="DNI duplicado o área inexistente.") from exc
    return {"dni": payload.dni, "full_name": payload.full_name.strip(), "area_id": payload.area_id}


@app.get("/api/personal/areas")
def list_areas(connection: sqlite3.Connection = Depends(get_db)) -> list[dict[str, object]]:
    rows = connection.execute(
        "SELECT id, name, floor, department FROM areas ORDER BY floor, name"
    ).fetchall()
    return [row_to_dict(row) for row in rows]


@app.post("/api/personal/areas", status_code=201)
def create_area(
    payload: AreaCreate, connection: sqlite3.Connection = Depends(get_db)
) -> dict[str, object]:
    try:
        cursor = connection.execute(
            "INSERT INTO areas (name, floor, department) VALUES (?, ?, ?)",
            (payload.name.strip(), payload.floor.strip(), payload.department.strip()),
        )
        connection.commit()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Ya existe un área con ese nombre.") from exc
    return {
        "id": cursor.lastrowid,
        "name": payload.name.strip(),
        "floor": payload.floor.strip(),
        "department": payload.department.strip(),
    }


@app.get("/api/personal/leaves")
def list_leaves(connection: sqlite3.Connection = Depends(get_db)) -> list[dict[str, object]]:
    rows = connection.execute(
        """
        SELECT id, dni, leave_type, start_date, end_date, notes
        FROM leave_records ORDER BY start_date DESC, id DESC
        """
    ).fetchall()
    return [row_to_dict(row) for row in rows]


@app.post("/api/personal/leaves", status_code=201)
def create_leave(
    payload: LeaveCreate, connection: sqlite3.Connection = Depends(get_db)
) -> dict[str, object]:
    try:
        cursor = connection.execute(
            """
            INSERT INTO leave_records (dni, leave_type, start_date, end_date, notes)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload.dni,
                payload.leave_type,
                payload.start_date.isoformat(),
                payload.end_date.isoformat(),
                payload.notes.strip(),
            ),
        )
        connection.commit()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=404, detail="No existe personal con ese DNI.") from exc
    return {"id": cursor.lastrowid, **payload.model_dump(mode="json")}


@app.post("/api/personal/biometrics/connect")
def simulate_biometric_connection(payload: BiometricConnectionRequest) -> dict[str, object]:
    return {
        "connected": True,
        "device_ip": payload.device_ip,
        "mode": "simulated",
        "message": "Conexión simulada; no se contactó ningún dispositivo.",
    }


@app.get("/api/personal/biometrics/reports")
def attendance_report(
    period: Literal["day", "week"] = Query(default="day"),
    dni: str | None = Query(default=None, pattern=r"^\d{7,8}$"),
    reference_date: date | None = Query(default=None),
    connection: sqlite3.Connection = Depends(get_db),
) -> dict[str, object]:
    anchor = reference_date or date.today()
    if period == "day":
        dates = [anchor]
    else:
        monday = anchor - timedelta(days=anchor.weekday())
        dates = [monday + timedelta(days=offset) for offset in range(5)]
    query = "SELECT dni FROM staff"
    parameters: tuple[object, ...] = ()
    if dni:
        query += " WHERE dni = ?"
        parameters = (dni,)
    staff = [row["dni"] for row in connection.execute(query, parameters).fetchall()]
    records = [
        {
            "dni": staff_dni,
            "date": report_date.isoformat(),
            "check_in": "08:30",
            "check_out": "16:30",
            "status": "simulated",
        }
        for report_date in dates
        if report_date.weekday() < 5
        for staff_dni in staff
    ]
    return {
        "period": period,
        "generated_at": datetime.now().astimezone().isoformat(),
        "dni_filter": dni,
        "simulated": True,
        "records": records,
    }
