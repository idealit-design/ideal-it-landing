from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@dataclass
class Position:
    quantity: float = 0.0
    entry_price: float = 0.0


class BinanceSimulator:
    """Local futures-style ledger; no Binance credentials or network calls are used."""

    def __init__(self, initial_balance: float = 10_000.0) -> None:
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.positions: dict[str, Position] = {}
        self._lock = Lock()

    def execute_order(
        self, symbol: str, action: str, quantity: float, price: float
    ) -> dict[str, float | str | bool]:
        signed_quantity = quantity if action == "buy" else -quantity
        with self._lock:
            position = self.positions.setdefault(symbol, Position())
            current = position.quantity
            realized_pnl = 0.0

            if current == 0 or current * signed_quantity > 0:
                total_quantity = abs(current) + quantity
                position.entry_price = (
                    abs(current) * position.entry_price + quantity * price
                ) / total_quantity
                position.quantity = current + signed_quantity
            else:
                closed_quantity = min(abs(current), quantity)
                direction = 1.0 if current > 0 else -1.0
                realized_pnl = (
                    (price - position.entry_price) * closed_quantity * direction
                )
                self.balance += realized_pnl
                remaining = current + signed_quantity
                if remaining == 0:
                    position.quantity = 0.0
                    position.entry_price = 0.0
                elif current * remaining > 0:
                    position.quantity = remaining
                else:
                    position.quantity = remaining
                    position.entry_price = price

            return {
                "order_id": str(uuid4()),
                "symbol": symbol,
                "side": action,
                "status": "FILLED",
                "simulated": True,
                "filled_quantity": quantity,
                "average_price": price,
                "realized_pnl": round(realized_pnl, 8),
                "balance": round(self.balance, 8),
                "position_quantity": round(position.quantity, 8),
            }

    def snapshot(self) -> dict[str, float | dict[str, float]]:
        with self._lock:
            return {
                "initial_balance": self.initial_balance,
                "balance": round(self.balance, 8),
                "positions": {
                    symbol: {
                        "quantity": round(position.quantity, 8),
                        "entry_price": round(position.entry_price, 8),
                    }
                    for symbol, position in self.positions.items()
                },
            }


@router.get("/balance")
def get_simulated_balance(request: Request) -> dict[str, object]:
    simulator = getattr(request.app.state, "simulator", None)
    if simulator is None:
        raise HTTPException(status_code=503, detail="Simulator is unavailable")
    return simulator.snapshot()
