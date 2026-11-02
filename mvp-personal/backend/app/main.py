import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.database import create_database
from app.routers import asistencia, biometric_sim, licencias, personal, reportes


FRONTEND_DIR = Path(__file__).resolve().parent / "static"
APP_VERSION = (Path(__file__).resolve().parents[2] / "VERSION").read_text(
    encoding="utf-8"
).strip()


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database()
    yield


app = FastAPI(title="MVP Personal", version=APP_VERSION, lifespan=lifespan)
cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "PERSONAL_MVP_CORS_ORIGINS",
        "http://localhost:4203,http://127.0.0.1:4203,"
        "http://localhost:8021,http://127.0.0.1:8021",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(biometric_sim.router)
app.include_router(personal.router)
app.include_router(asistencia.router)
app.include_router(reportes.router)
app.include_router(licencias.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mvp": "personal", "version": APP_VERSION}


if FRONTEND_DIR.is_dir():
    frontend_root = FRONTEND_DIR.resolve()

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str) -> FileResponse:
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404)

        requested_file = (frontend_root / full_path).resolve()
        if not requested_file.is_relative_to(frontend_root):
            raise HTTPException(status_code=404)
        if not requested_file.is_file():
            requested_file = frontend_root / "index.html"
        return FileResponse(requested_file)
