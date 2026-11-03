from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def make_client(database_path: Path, secret: str = "test-secret") -> TestClient:
    return TestClient(create_app(webhook_secret=secret, database_path=database_path))


def send_signal(
    client: TestClient,
    *,
    action: str = "buy",
    price: float = 100,
    event_id: str | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "key": "test-secret",
        "strategy": "demo",
        "symbol": "BTCUSDT",
        "action": action,
        "quantity": 1,
        "price": price,
    }
    if event_id:
        payload["event_id"] = event_id
    response = client.post("/api/webhook/tradingview", json=payload)
    assert response.status_code == 202
    return response.json()


def test_authenticated_signal_is_logged_and_simulated(tmp_path: Path) -> None:
    database_path = tmp_path / "cripto_mvp.db"
    with make_client(database_path) as client:
        response = client.post(
            "/api/webhook/tradingview",
            json={
                "key": "test-secret",
                "strategy": "demo",
                "symbol": "BTCUSDT",
                "action": "buy",
                "1": 0.5,
                "price": 100,
                "event_id": "evt-1",
            },
        )

        assert response.status_code == 202
        assert response.json()["simulated"] is True
        assert response.json()["order"]["position_quantity"] == 0.5
        assert database_path.exists()
        telemetry = client.get("/api/telemetry").json()
        assert telemetry["metrics"]["orders"] == 1
        assert telemetry["recent_signals"][0]["signal"]["event_id"] == "evt-1"
        assert "test-secret" not in database_path.read_bytes().decode(
            "utf-8", errors="ignore"
        )


def test_invalid_credentials_do_not_create_orders(tmp_path: Path) -> None:
    with make_client(tmp_path / "cripto_mvp.db") as client:
        response = client.post(
            "/api/webhook/tradingview",
            json={
                "key": "wrong-secret",
                "symbol": "BTCUSDT",
                "action": "buy",
                "quantity": 1,
                "price": 100,
            },
        )

        assert response.status_code == 401
        assert client.get("/api/telemetry").json()["metrics"]["orders"] == 0


def test_invalid_signal_is_rejected(tmp_path: Path) -> None:
    with make_client(tmp_path / "cripto_mvp.db") as client:
        response = client.post(
            "/api/webhook/tradingview",
            json={
                "key": "test-secret",
                "symbol": "BTCUSDT",
                "action": "hold",
                "quantity": 0,
                "price": -1,
            },
        )

        assert response.status_code == 422
        assert client.get("/api/telemetry").json()["metrics"]["orders"] == 0


def test_duplicate_event_id_is_rejected_without_second_order(tmp_path: Path) -> None:
    with make_client(tmp_path / "cripto_mvp.db") as client:
        send_signal(client, event_id="evt-duplicate")
        response = client.post(
            "/api/webhook/tradingview",
            json={
                "key": "test-secret",
                "symbol": "BTCUSDT",
                "action": "buy",
                "quantity": 1,
                "price": 100,
                "event_id": "evt-duplicate",
            },
        )

        assert response.status_code == 409
        assert client.get("/api/telemetry").json()["metrics"]["orders"] == 1


def test_simulator_balance_survives_app_restart(tmp_path: Path) -> None:
    database_path = tmp_path / "cripto_mvp.db"
    with make_client(database_path) as client:
        send_signal(client, action="buy", price=100)
    with make_client(database_path) as client:
        send_signal(client, action="sell", price=110)

    with make_client(database_path) as restarted_client:
        balance = restarted_client.get("/api/simulator/balance").json()
        assert balance["balance"] == 10_010
        assert balance["positions"] == {}
        assert (
            restarted_client.get("/api/telemetry").json()["metrics"]["realized_pnl"]
            == 10
        )


def test_missing_secret_disables_webhook_and_dashboard_is_served(
    tmp_path: Path,
) -> None:
    with make_client(tmp_path / "cripto_mvp.db", secret="") as client:
        response = client.post(
            "/api/webhook/tradingview",
            json={
                "key": "any-value",
                "symbol": "BTCUSDT",
                "action": "buy",
                "quantity": 1,
                "price": 100,
            },
        )

        assert response.status_code == 503
        assert client.get("/").status_code == 200
        assert client.get("/health").json() == {"status": "ok", "version": "0.1.0"}
