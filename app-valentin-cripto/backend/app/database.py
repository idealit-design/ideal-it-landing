from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

MODULE_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "db" / "cripto_mvp.db"
INITIAL_BALANCE = 10_000.0

SCHEMA = """
CREATE TABLE IF NOT EXISTS simulator_state (
    key TEXT PRIMARY KEY,
    value REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE,
    strategy TEXT NOT NULL,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
    quantity REAL NOT NULL CHECK (quantity > 0),
    price REAL NOT NULL CHECK (price > 0),
    take_profit REAL,
    stop_loss REAL,
    probability REAL,
    received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS simulated_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL UNIQUE,
    signal_id INTEGER NOT NULL UNIQUE REFERENCES signals(id),
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    status TEXT NOT NULL,
    filled_quantity REAL NOT NULL,
    average_price REAL NOT NULL,
    realized_pnl REAL NOT NULL,
    balance REAL NOT NULL,
    position_quantity REAL NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
    symbol TEXT PRIMARY KEY,
    quantity REAL NOT NULL,
    entry_price REAL NOT NULL
);
"""


class Database:
    def __init__(self, path: Path = MODULE_DB_PATH) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(SCHEMA)
            connection.execute(
                "INSERT OR IGNORE INTO simulator_state (key, value) VALUES (?, ?)",
                ("initial_balance", INITIAL_BALANCE),
            )
            connection.execute(
                "INSERT OR IGNORE INTO simulator_state (key, value) VALUES (?, ?)",
                ("balance", INITIAL_BALANCE),
            )
