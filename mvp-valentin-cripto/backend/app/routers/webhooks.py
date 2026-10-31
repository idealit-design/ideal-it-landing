from __future__ import annotations

import hmac
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

router = APIRouter(prefix="/api/webhook", tags=["webhooks"])


class TradingViewAlert(BaseModel):
    model_config = ConfigDict(extra="allow")

    key: str | None = None
    token: str | None = None
    event_id: str | None = None
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


@router.post("/tradingview", status_code=202)
def receive_tradingview_alert(request: Request, alert: TradingViewAlert) -> dict[str, Any]:
    secret = request.app.state.webhook_secret
    if not secret:
        raise HTTPException(status_code=503, detail="Webhook authentication is not configured")

    supplied_secret = alert.token or alert.key or ""
    if not hmac.compare_digest(supplied_secret.encode(), secret.encode()):
        raise HTTPException(status_code=401, detail="Invalid webhook credentials")

    engine = getattr(request.app.state, "strategy_engine", None)
    if engine is None:
        raise HTTPException(status_code=503, detail="Strategy engine is unavailable")

    signal = alert.model_dump(exclude={"key", "token", "event_id"})
    try:
        record = engine.process_signal(signal)
    except OSError as error:
        raise HTTPException(status_code=500, detail="Could not write the trading audit log") from error
    return {
        "status": "accepted",
        "simulated": True,
        "event_id": alert.event_id,
        "order": record["order"],
    }
