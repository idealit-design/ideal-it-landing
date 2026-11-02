from __future__ import annotations

import hmac
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

from app.database import MODULE_DB_PATH, Database
from app.simulator import DuplicateEventError, Simulator

MODULE_ROOT = Path(__file__).resolve().parents[2]


class TradingSignal(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str | None = None
    token: str | None = None
    event_id: str | None = Field(default=None, min_length=1, max_length=120)
    strategy: str = Field(default="TradingView", min_length=1, max_length=100)
    symbol: str = Field(min_length=1, max_length=40)
    action: Literal["buy", "sell"]
    quantity: float = Field(
        gt=0, allow_inf_nan=False, validation_alias=AliasChoices("quantity", "1")
    )
    price: float = Field(gt=0, allow_inf_nan=False)
    tp: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    sl: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    probability: float | None = Field(default=None, ge=0, le=100, allow_inf_nan=False)

    @field_validator("symbol", "strategy")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned


def create_app(
    webhook_secret: str | None = None, database_path: Path | None = None
) -> FastAPI:
    active_database_path = database_path or MODULE_DB_PATH

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        application.state.simulator = Simulator(Database(active_database_path))
        yield

    app = FastAPI(
        title="App Valentín Cripto", version="0.1.0", lifespan=lifespan
    )
    app.state.webhook_secret = (
        os.getenv("WEBHOOK_SECRET", "") if webhook_secret is None else webhook_secret
    )

    @app.get("/", include_in_schema=False)
    def dashboard() -> FileResponse:
        return FileResponse(MODULE_ROOT / "frontend" / "dashboard.html")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": "0.1.0"}

    @app.get("/api/telemetry")
    def telemetry(request: Request) -> dict[str, Any]:
        return request.app.state.simulator.telemetry()

    @app.get("/api/simulator/balance")
    def simulator_balance(request: Request) -> dict[str, Any]:
        return request.app.state.simulator.balance()

    @app.post("/api/webhook/tradingview", status_code=202)
    def receive_tradingview_signal(
        request: Request, signal: TradingSignal
    ) -> dict[str, Any]:
        secret = request.app.state.webhook_secret
        if not secret:
            raise HTTPException(
                status_code=503, detail="Webhook authentication is not configured"
            )

        supplied_secret = signal.token or signal.key or ""
        if not hmac.compare_digest(supplied_secret.encode(), secret.encode()):
            raise HTTPException(status_code=401, detail="Invalid webhook credentials")

        payload = signal.model_dump(exclude={"key", "token"})
        try:
            record = request.app.state.simulator.process_signal(payload)
        except DuplicateEventError as error:
            raise HTTPException(
                status_code=409, detail="event_id has already been processed"
            ) from error

        return {
            "status": "accepted",
            "simulated": True,
            "event_id": signal.event_id,
            "order": record["order"],
        }

    return app


app = create_app()
