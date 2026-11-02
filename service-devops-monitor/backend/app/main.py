from contextlib import asynccontextmanager
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.monitor import MonitoringStore, create_snapshot, load_services


logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)
store = MonitoringStore()


@asynccontextmanager
async def lifespan(_: FastAPI):
    store.initialize()
    yield


app = FastAPI(
    title="Service DevOps Monitor",
    description="Monitor local, configured MVP endpoints and keep availability history.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:4175",
        "http://localhost:4175",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class AlertSimulationRequest(BaseModel):
    service_id: str | None = None


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "service-devops-monitor"}


@app.get("/api/services")
async def services_report() -> dict[str, Any]:
    checked_at, services = await create_snapshot(store)
    return {"checked_at": checked_at, "services": services}


@app.get("/api/incidents")
async def incidents(limit: int = Query(default=50, ge=1, le=100)) -> dict[str, Any]:
    return {"incidents": store.get_incidents(limit)}


@app.post("/api/alerts/simulate")
async def simulate_alert(request: AlertSimulationRequest) -> dict[str, Any]:
    if request.service_id is not None and not any(
        service["id"] == request.service_id for service in load_services()
    ):
        raise HTTPException(status_code=404, detail="MVP not found")

    checked_at, services = await create_snapshot(store)
    if request.service_id is not None:
        services = [service for service in services if service["id"] == request.service_id]

    payload = {
        "event": "service_health_snapshot",
        "generated_at": checked_at,
        "services": services,
    }
    simulation_id = store.record_webhook_simulation(payload, checked_at)
    LOGGER.info("Recorded simulated webhook %s for %s service(s)", simulation_id, len(services))
    return {
        "id": simulation_id,
        "delivery_status": "simulated",
        "destination": "local://webhook-simulator",
        "generated_at": checked_at,
        "payload": payload,
        "notice": "No se realizó ninguna solicitud HTTP externa.",
    }


@app.get("/api/summary")
async def summary() -> dict[str, Any]:
    checked_at, services = await create_snapshot(store)
    online = sum(service["status"] == "online" for service in services)
    return {
        "checked_at": checked_at,
        "total": len(services),
        "online": online,
        "offline": len(services) - online,
        "services": services,
        "incidents": store.get_incidents(10),
    }
