from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def make_client(tmp_path: Path) -> TestClient:
    return TestClient(
        create_app(webhook_secret="test-secret", audit_path=tmp_path / "audit.log")
    )


def test_tradingview_alert_is_authenticated_and_simulated(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    response = client.post(
        "/api/webhook/tradingview",
        json={
            "key": "test-secret",
            "strategy": "JOKER PRO",
            "symbol": "SOLUSDT.P",
            "action": "buy",
            "1": 0.03,
            "price": 150,
        },
    )

    assert response.status_code == 202
    assert response.json()["simulated"] is True
    assert response.json()["order"]["status"] == "FILLED"
    assert response.json()["order"]["position_quantity"] == 0.03
    audit = (tmp_path / "audit.log").read_text(encoding="utf-8")
    assert len(audit.splitlines()) == 1
    assert "test-secret" not in audit


def test_invalid_credentials_do_not_execute_orders(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    response = client.post(
        "/api/webhook/tradingview",
        json={
            "key": "wrong-secret",
            "symbol": "BTCUSDT",
            "action": "buy",
            "quantity": 0.01,
            "price": 50_000,
        },
    )

    assert response.status_code == 401
    assert not (tmp_path / "audit.log").exists()


def test_invalid_alert_is_rejected(tmp_path: Path) -> None:
    client = make_client(tmp_path)
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
    assert not (tmp_path / "audit.log").exists()


def test_missing_webhook_secret_disables_order_processing(tmp_path: Path) -> None:
    client = TestClient(create_app(webhook_secret="", audit_path=tmp_path / "audit.log"))
    response = client.post(
        "/api/webhook/tradingview",
        json={
            "key": "any-value",
            "symbol": "BTCUSDT",
            "action": "buy",
            "quantity": 0.01,
            "price": 50_000,
        },
    )

    assert response.status_code == 503
    assert not (tmp_path / "audit.log").exists()


def test_dashboard_and_health_endpoints_are_served(tmp_path: Path) -> None:
    client = make_client(tmp_path)

    dashboard = client.get("/")
    health = client.get("/health")

    assert dashboard.status_code == 200
    assert "Valentín Cripto" in dashboard.text
    assert health.json() == {"status": "ok", "version": "0.1.1"}


def test_telemetry_reports_orders_and_realized_pnl(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    for action, price in (("buy", 100), ("sell", 110)):
        response = client.post(
            "/api/webhook/tradingview",
            json={
                "token": "test-secret",
                "strategy": "demo",
                "symbol": "BTCUSDT",
                "action": action,
                "quantity": 1,
                "price": price,
            },
        )
        assert response.status_code == 202

    telemetry = client.get("/api/telemetry").json()
    assert telemetry["metrics"] == {
        "orders": 2,
        "buys": 1,
        "sells": 1,
        "realized_pnl": 10,
    }
    assert telemetry["balance"]["balance"] == 10_010
