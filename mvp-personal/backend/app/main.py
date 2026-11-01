from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_database
from app.routers import asistencia, biometric_sim, licencias, personal, reportes


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database()
    yield


app = FastAPI(title="MVP Personal", version="0.1.1", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4203", "http://127.0.0.1:4203"],
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
    return {"status": "ok", "mvp": "personal", "version": "0.1.1"}
