from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

from app.routers.binance_sim import BinanceSimulator


class StrategyEngine:
    def __init__(self, simulator: BinanceSimulator, audit_path: Path) -> None:
        self.simulator = simulator
        self.audit_path = audit_path
        self._lock = Lock()

    def process_signal(self, signal: dict[str, Any]) -> dict[str, Any]:
        order = self.simulator.execute_order(
            symbol=signal["symbol"],
            action=signal["action"],
            quantity=signal["quantity"],
            price=signal["price"],
        )
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "strategy": signal["strategy"],
            "signal": {
                key: value
                for key, value in signal.items()
                if key not in {"key", "token", "event_id"}
            },
            "order": order,
        }
        with self._lock:
            self.audit_path.parent.mkdir(parents=True, exist_ok=True)
            with self.audit_path.open("a", encoding="utf-8") as audit_file:
                audit_file.write(json.dumps(record, separators=(",", ":")) + "\n")
        return record

    def telemetry(self) -> dict[str, Any]:
        records: list[dict[str, Any]] = []
        if self.audit_path.exists():
            with self._lock:
                with self.audit_path.open("r", encoding="utf-8") as audit_file:
                    records = [json.loads(line) for line in audit_file if line.strip()]

        latest = records[-1] if records else None
        return {
            "strategy_active": latest["strategy"] if latest else None,
            "last_signal": latest["signal"] if latest else None,
            "metrics": {
                "orders": len(records),
                "buys": sum(r["order"]["side"] == "buy" for r in records),
                "sells": sum(r["order"]["side"] == "sell" for r in records),
                "realized_pnl": round(
                    sum(r["order"]["realized_pnl"] for r in records), 8
                ),
            },
            "recent_orders": list(reversed(records[-20:])),
            "balance": self.simulator.snapshot(),
        }
