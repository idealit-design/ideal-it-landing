from collections.abc import Generator
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from database import get_engine, get_session
from main import app
from models import ProductosPOS


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all(
            [
                ProductosPOS(
                    codigo="TEST-001",
                    nombre="Producto de prueba",
                    categoria="Prueba",
                    precio=Decimal("1000.00"),
                ),
                ProductosPOS(
                    codigo="TEST-002",
                    nombre="Segundo producto",
                    categoria="Prueba",
                    precio=Decimal("250.50"),
                ),
            ]
        )
        session.commit()

    def test_session() -> Generator[Session, None, None]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = test_session
    test_client = TestClient(app)
    yield test_client
    test_client.close()
    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(engine)
    engine.dispose()


def test_health_and_seeded_catalog(client: TestClient) -> None:
    assert client.get("/health").json()["mvp"] == "web-pos-comercial"
    products = client.get("/api/productos").json()
    assert len(products) == 2
    assert products[0]["precio"] == "1000.00"


def test_cors_allows_only_the_pos_frontend_origins(client: TestClient) -> None:
    allowed = client.options(
        "/api/productos",
        headers={
            "Origin": "http://127.0.0.1:4204",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert allowed.headers["access-control-allow-origin"] == "http://127.0.0.1:4204"

    rejected = client.options(
        "/api/productos",
        headers={
            "Origin": "http://127.0.0.1:4201",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" not in rejected.headers


def test_database_initialization_isolated_to_configured_path(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    database_path = tmp_path / "pos-test.db"
    monkeypatch.setenv("POS_COMERCIAL_DATABASE_PATH", str(database_path))
    engine = get_engine()
    try:
        with TestClient(app) as startup_client:
            assert startup_client.get("/health").status_code == 200
            assert len(startup_client.get("/api/productos").json()) == 6
        assert database_path.exists()
    finally:
        engine.dispose()


def test_sqlite_connections_enable_foreign_keys(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv(
        "POS_COMERCIAL_DATABASE_PATH",
        str(tmp_path / "foreign-keys" / "pos_test.db"),
    )
    with get_engine().connect() as connection:
        assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar_one() == 1


def test_opening_is_required_and_only_one_register_can_be_open(client: TestClient) -> None:
    assert client.get("/api/caja/actual").json() is None
    sale_without_register = client.post(
        "/api/ventas",
        json={
            "items": [{"producto_id": 1, "cantidad": 1}],
            "pagos": [{"medio": "EFECTIVO", "monto": "1000"}],
        },
    )
    assert sale_without_register.status_code == 409
    opened = client.post("/api/caja/aperturas", json={"monto_inicial": "5000.00"})
    assert opened.status_code == 201
    assert client.post("/api/caja/aperturas", json={"monto_inicial": "0"}).status_code == 409


def test_mixed_sale_uses_catalog_prices_and_calculates_change(client: TestClient) -> None:
    caja = client.post("/api/caja/aperturas", json={"monto_inicial": "5000.00"}).json()
    response = client.post(
        "/api/ventas",
        json={
            "items": [{"producto_id": 1, "cantidad": 2}],
            "pagos": [
                {"medio": "TARJETA_SIMULADA", "monto": "900.00"},
                {"medio": "QR_SIMULADO", "monto": "300.00"},
                {"medio": "EFECTIVO", "monto": "1000.00"},
            ],
        },
    )
    assert response.status_code == 201
    sale = response.json()
    assert sale["caja_id"] == caja["id"]
    assert sale["total"] == "2000.00"
    assert sale["vuelto"] == "200.00"
    assert sale["detalles"][0]["nombre_producto"] == "Producto de prueba"
    assert {payment["medio"]: payment["monto"] for payment in sale["medios_pago"]} == {
        "TARJETA_SIMULADA": "900.00",
        "QR_SIMULADO": "300.00",
        "EFECTIVO": "800.00",
    }


@pytest.mark.parametrize(
    ("payments", "message"),
    [
        ([{"medio": "EFECTIVO", "monto": "999.99"}], "no cubre el total"),
        ([{"medio": "TARJETA_SIMULADA", "monto": "1000.01"}], "no efectivos"),
    ],
)
def test_invalid_payment_does_not_create_sale(
    client: TestClient,
    payments: list[dict[str, str]],
    message: str,
) -> None:
    client.post("/api/caja/aperturas", json={"monto_inicial": "0"})
    response = client.post(
        "/api/ventas",
        json={"items": [{"producto_id": 1, "cantidad": 1}], "pagos": payments},
    )
    assert response.status_code == 409
    assert message in response.json()["detail"]
    assert client.get("/api/ventas").json() == []


def test_cash_report_and_closing_reconcile_only_cash(client: TestClient) -> None:
    caja = client.post("/api/caja/aperturas", json={"monto_inicial": "3000"}).json()
    sale = client.post(
        "/api/ventas",
        json={
            "items": [{"producto_id": 1, "cantidad": 1}],
            "pagos": [
                {"medio": "TARJETA_SIMULADA", "monto": "400"},
                {"medio": "QR_SIMULADO", "monto": "100"},
                {"medio": "EFECTIVO", "monto": "500"},
            ],
        },
    )
    assert sale.status_code == 201
    report = client.get("/api/caja/actual/reporte").json()
    assert report["ventas_total"] == "1000.00"
    assert report["tarjeta_simulada"] == "400.00"
    assert report["qr_simulado"] == "100.00"
    assert report["efectivo_aplicado"] == "500.00"
    assert report["efectivo_esperado"] == "3500.00"

    closed = client.post("/api/caja/cierre", json={"monto_cierre_declarado": "3400"})
    assert closed.status_code == 200
    assert closed.json()["diferencia"] == "-100.00"
    assert client.get("/api/caja/actual").json() is None
    assert client.post("/api/caja/cierre", json={"monto_cierre_declarado": "0"}).status_code == 409
    assert client.get(f"/api/ventas?caja_id={caja['id']}").status_code == 200


def test_invalid_product_and_duplicate_items_are_rejected(client: TestClient) -> None:
    client.post("/api/caja/aperturas", json={"monto_inicial": "0"})
    missing_product = client.post(
        "/api/ventas",
        json={
            "items": [{"producto_id": 999, "cantidad": 1}],
            "pagos": [{"medio": "EFECTIVO", "monto": "1000"}],
        },
    )
    assert missing_product.status_code == 404
    duplicate_product = client.post(
        "/api/ventas",
        json={
            "items": [
                {"producto_id": 1, "cantidad": 1},
                {"producto_id": 1, "cantidad": 1},
            ],
            "pagos": [{"medio": "EFECTIVO", "monto": "2000"}],
        },
    )
    assert duplicate_product.status_code == 422
