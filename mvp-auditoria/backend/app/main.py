from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_storage_path
from app.core.database import create_database
from app.routers import boveda, casos, nomenclador, validaciones


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database()
    get_storage_path().mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="MVP Auditoría", version="0.1.1", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4201", "http://127.0.0.1:4201"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(boveda.router)
app.include_router(validaciones.router)
app.include_router(nomenclador.router)
app.include_router(casos.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mvp": "auditoria", "version": "0.1.1"}
