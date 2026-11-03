from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from threading import RLock
from typing import Any
from uuid import uuid4

from app.database import Database


class DuplicateEventError(Exception):
    pass


class Simulator:
    def __init__(self, database: Database) -> None:
        self.database = database
        self._lock = RLock()

    def process_signal(self, signal: dict[str, Any]) -> dict[str, Any]:
        with self._lock, self.database.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                return self._process_signal(connection, signal)
            except sqlite3.IntegrityError as error:
                if signal.get("event_id") and "signals.event_id" in str(error):
                    raise DuplicateEventError from error
                raise

    def _process_signal(
        self, connection: sqlite3.Connection, signal: dict[str, Any]
    ) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        cursor = connection.execute(
            """
            INSERT INTO signals (
                event_id, strategy, symbol, action, quantity, price,
                take_profit, stop_loss, probability, received_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                signal.get("event_id"),
                signal["strategy"],
                signal["symbol"],
                signal["action"],
                signal["quantity"],
                signal["price"],
                signal.get("tp"),
                signal.get("sl"),
                signal.get("probability"),
                now,
            ),
        )
        signal_id = cursor.lastrowid

        position_row = connection.execute(
            "SELECT quantity, entry_price FROM positions WHERE symbol = ?",
            (signal["symbol"],),
        ).fetchone()
        current_quantity = position_row["quantity"] if position_row else 0.0
        entry_price = position_row["entry_price"] if position_row else 0.0
        signed_quantity = (
            signal["quantity"] if signal["action"] == "buy" else -signal["quantity"]
        )
        realized_pnl = 0.0

        if current_quantity == 0 or current_quantity * signed_quantity > 0:
            total_quantity = abs(current_quantity) + signal["quantity"]
            entry_price = (
                abs(current_quantity) * entry_price
                + signal["quantity"] * signal["price"]
            ) / total_quantity
            current_quantity += signed_quantity
        else:
            closed_quantity = min(abs(current_quantity), signal["quantity"])
            direction = 1.0 if current_quantity > 0 else -1.0
            realized_pnl = (
                (signal["price"] - entry_price) * closed_quantity * direction
            )
            current_quantity += signed_quantity
            if current_quantity == 0:
                entry_price = 0.0
            elif (current_quantity > 0) != (direction > 0):
                entry_price = signal["price"]

        realized_pnl = round(realized_pnl, 8)
        current_quantity = round(current_quantity, 8)
        entry_price = round(entry_price, 8)
        balance_row = connection.execute(
            "SELECT value FROM simulator_state WHERE key = 'balance'"
        ).fetchone()
        balance = round(balance_row["value"] + realized_pnl, 8)
        connection.execute(
            "UPDATE simulator_state SET value = ? WHERE key = 'balance'", (balance,)
        )
        connection.execute(
            """
            INSERT INTO positions (symbol, quantity, entry_price) VALUES (?, ?, ?)
            ON CONFLICT(symbol) DO UPDATE SET
                quantity = excluded.quantity,
                entry_price = excluded.entry_price
            """,
            (signal["symbol"], current_quantity, entry_price),
        )

        order = {
            "order_id": str(uuid4()),
            "symbol": signal["symbol"],
            "side": signal["action"],
            "status": "FILLED",
            "simulated": True,
            "filled_quantity": signal["quantity"],
            "average_price": signal["price"],
            "realized_pnl": realized_pnl,
            "balance": balance,
            "position_quantity": current_quantity,
        }
        connection.execute(
            """
            INSERT INTO simulated_orders (
                order_id, signal_id, symbol, side, status, filled_quantity,
                average_price, realized_pnl, balance, position_quantity, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order["order_id"],
                signal_id,
                order["symbol"],
                order["side"],
                order["status"],
                order["filled_quantity"],
                order["average_price"],
                order["realized_pnl"],
                order["balance"],
                order["position_quantity"],
                now,
            ),
        )
        return {
            "timestamp": now,
            "signal": {
                key: value
                for key, value in signal.items()
                if key not in {"key", "token"}
            },
            "order": order,
        }

    def balance(self) -> dict[str, Any]:
        with self.database.connect() as connection:
            state = {
                row["key"]: row["value"]
                for row in connection.execute(
                    "SELECT key, value FROM simulator_state"
                )
            }
            positions = {
                row["symbol"]: {
                    "quantity": row["quantity"],
                    "entry_price": row["entry_price"],
                }
                for row in connection.execute(
                    "SELECT symbol, quantity, entry_price FROM positions "
                    "WHERE quantity != 0 ORDER BY symbol"
                )
            }
        return {
            "initial_balance": state["initial_balance"],
            "balance": state["balance"],
            "positions": positions,
            "simulated": True,
        }

    def telemetry(self) -> dict[str, Any]:
        with self.database.connect() as connection:
            metrics = connection.execute(
                """
                SELECT
                    COUNT(*) AS orders,
                    COALESCE(SUM(side = 'buy'), 0) AS buys,
                    COALESCE(SUM(side = 'sell'), 0) AS sells,
                    COALESCE(SUM(realized_pnl), 0) AS realized_pnl
                FROM simulated_orders
                """
            ).fetchone()
            signal_rows = connection.execute(
                """
                SELECT event_id, strategy, symbol, action, quantity, price,
                       take_profit, stop_loss, probability, received_at
                FROM signals ORDER BY id DESC LIMIT 20
                """
            ).fetchall()
            order_rows = connection.execute(
                """
                SELECT s.received_at, s.strategy, s.symbol, s.action,
                       s.quantity, s.price, s.take_profit, s.stop_loss,
                       s.probability, s.event_id, o.order_id, o.status,
                       o.filled_quantity, o.average_price, o.realized_pnl,
                       o.balance, o.position_quantity
                FROM simulated_orders o
                JOIN signals s ON s.id = o.signal_id
                ORDER BY o.id DESC LIMIT 20
                """
            ).fetchall()
            latest = signal_rows[0] if signal_rows else None
            signals = [self._signal_record(row) for row in signal_rows]
            orders = [self._order_record(row) for row in order_rows]

        return {
            "simulator_status": "active",
            "strategy_active": latest["strategy"] if latest else None,
            "last_signal": signals[0]["signal"] if signals else None,
            "metrics": {
                "orders": metrics["orders"],
                "buys": metrics["buys"],
                "sells": metrics["sells"],
                "realized_pnl": round(metrics["realized_pnl"], 8),
            },
            "recent_signals": signals,
            "recent_orders": orders,
            "balance": self.balance(),
        }

    @staticmethod
    def _signal_record(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "timestamp": row["received_at"],
            "signal": {
                "event_id": row["event_id"],
                "strategy": row["strategy"],
                "symbol": row["symbol"],
                "action": row["action"],
                "quantity": row["quantity"],
                "price": row["price"],
                "tp": row["take_profit"],
                "sl": row["stop_loss"],
                "probability": row["probability"],
            },
        }

    @staticmethod
    def _order_record(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "timestamp": row["received_at"],
            "signal": {
                "event_id": row["event_id"],
                "strategy": row["strategy"],
            },
            "order": {
                "order_id": row["order_id"],
                "symbol": row["symbol"],
                "side": row["action"],
                "status": row["status"],
                "simulated": True,
                "filled_quantity": row["filled_quantity"],
                "average_price": row["average_price"],
                "realized_pnl": row["realized_pnl"],
                "balance": row["balance"],
                "position_quantity": row["position_quantity"],
            },
        }
