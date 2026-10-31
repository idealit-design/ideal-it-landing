from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_database
from app.routers import asistencia_qr, eventos, inripciones


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database()
    yield


app = FastAPI(title="MVP Formularios Municipales", version="0.1.1", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4202", "http://127.0.0.1:4202"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(eventos.router)
app.include_router(inripciones.router)
app.include_router(asistencia_qr.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mvp": "formularios", "version": "0.1.1"}
