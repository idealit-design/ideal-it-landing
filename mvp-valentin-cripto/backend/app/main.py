from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse

from app.routers.binance_sim import BinanceSimulator, router as simulator_router
from app.routers.webhooks import router as webhook_router
from app.services.strategy_engine import StrategyEngine

MODULE_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_AUDIT_PATH = MODULE_ROOT / "data" / "logs" / "trading_audit.log"


def create_app(
    webhook_secret: str | None = None,
    audit_path: Path | None = None,
    simulator: BinanceSimulator | None = None,
) -> FastAPI:
    app = FastAPI(title="MVP Valentín Cripto", version="0.1.1")
    app.state.webhook_secret = (
        os.getenv("WEBHOOK_SECRET", "") if webhook_secret is None else webhook_secret
    )
    active_simulator = simulator or BinanceSimulator()
    app.state.simulator = active_simulator
    app.state.strategy_engine = StrategyEngine(
        active_simulator,
        audit_path or Path(os.getenv("TRADING_AUDIT_PATH", str(DEFAULT_AUDIT_PATH))),
    )
    app.include_router(webhook_router)
    app.include_router(simulator_router)

    @app.get("/", include_in_schema=False)
    def dashboard() -> FileResponse:
        return FileResponse(MODULE_ROOT / "frontend" / "dashboard.html")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": "0.1.1"}

    @app.get("/api/telemetry")
    def telemetry() -> dict[str, object]:
        return app.state.strategy_engine.telemetry()

    return app


app = create_app()
