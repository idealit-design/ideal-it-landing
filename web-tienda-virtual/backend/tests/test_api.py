from decimal import Decimal

from fastapi.testclient import TestClient

from database import get_engine
from main import app


def test_catalog_product_crud_and_category_constraints(monkeypatch, tmp_path):
    monkeypatch.setenv("TIENDA_DATABASE_PATH", str(tmp_path / "tienda-test.db"))
    with TestClient(app) as client:
        categories = client.get("/api/categorias")
        assert categories.status_code == 200
        category_id = categories.json()[0]["id"]

        created = client.post(
            "/api/productos",
            json={
                "nombre": "Vaso de prueba",
                "descripcion": "Vidrio reciclado",
                "precio": "12.50",
                "stock": 6,
                "categoria_id": category_id,
            },
        )
        assert created.status_code == 201
        product_id = created.json()["id"]
        assert created.json()["categoria"]["id"] == category_id
        assert client.get("/api/productos", params={"q": "prueba"}).json()[0]["id"] == product_id
        assert client.get(
            "/api/productos", params={"categoria_id": category_id}
        ).status_code == 200

        updated = client.patch(
            f"/api/productos/{product_id}",
            json={"precio": "15.00", "stock": 4},
        )
        assert updated.status_code == 200
        assert updated.json()["precio"] == "15.00"
        assert updated.json()["stock"] == 4
        assert client.delete(f"/api/categorias/{category_id}").status_code == 409
        assert client.delete(f"/api/productos/{product_id}").status_code == 204
        assert client.get(f"/api/productos/{product_id}").status_code == 404

        new_category = client.post(
            "/api/categorias",
            json={
                "nombre": "Categoría temporal",
                "slug": "categoria-temporal",
                "descripcion": "Para verificar el CRUD",
            },
        )
        assert new_category.status_code == 201
        category_id = new_category.json()["id"]
        assert client.patch(
            f"/api/categorias/{category_id}", json={"nombre": "Categoría actualizada"}
        ).json()["nombre"] == "Categoría actualizada"
        assert client.delete(f"/api/categorias/{category_id}").status_code == 204


def test_cart_checkout_order_and_inventory_are_consistent(monkeypatch, tmp_path):
    monkeypatch.setenv("TIENDA_DATABASE_PATH", str(tmp_path / "checkout-test.db"))
    cart_headers = {"X-Cart-ID": "pytest-cart-checkout"}
    with TestClient(app) as client:
        product = client.get("/api/productos").json()[0]
        assert client.post(
            "/api/carrito/items",
            headers=cart_headers,
            json={"producto_id": product["id"], "cantidad": 2},
        ).status_code == 200

        cart = client.get("/api/carrito", headers=cart_headers).json()
        assert len(cart["items"]) == 1
        assert Decimal(cart["total"]) == Decimal(product["precio"]) * 2

        response = client.post(
            "/api/checkout",
            headers=cart_headers,
            json={"cliente_nombre": "Ada Lovelace", "cliente_email": "ada@example.com"},
        )
        assert response.status_code == 201
        order = response.json()
        assert order["estado"] == "confirmada_demo"
        assert order["estado_pago"] == "simulado_aprobado"
        assert len(order["items"]) == 1
        assert order["items"][0]["cantidad"] == 2
        assert client.get("/api/carrito", headers=cart_headers).json()["items"] == []
        assert client.get(f"/api/ordenes/{order['id']}").json()["numero"] == order["numero"]
        assert client.get(f"/api/productos/{product['id']}").json()["stock"] == product["stock"] - 2
        assert client.post(
            "/api/checkout",
            headers=cart_headers,
            json={"cliente_nombre": "Ada Lovelace", "cliente_email": "ada@example.com"},
        ).status_code == 400


def test_cart_rejects_excess_quantity_and_supports_updates(monkeypatch, tmp_path):
    monkeypatch.setenv("TIENDA_DATABASE_PATH", str(tmp_path / "cart-test.db"))
    cart_headers = {"X-Cart-ID": "pytest-cart-updates"}
    with TestClient(app) as client:
        product = client.get("/api/productos").json()[0]
        assert client.post(
            "/api/carrito/items",
            headers=cart_headers,
            json={"producto_id": product["id"], "cantidad": product["stock"] + 1},
        ).status_code == 409

        assert client.post(
            "/api/carrito/items",
            headers=cart_headers,
            json={"producto_id": product["id"], "cantidad": 1},
        ).status_code == 200
        updated = client.patch(
            f"/api/carrito/items/{product['id']}",
            headers=cart_headers,
            json={"cantidad": 2},
        )
        assert updated.status_code == 200
        assert updated.json()["items"][0]["cantidad"] == 2
        removed = client.delete(
            f"/api/carrito/items/{product['id']}", headers=cart_headers
        )
        assert removed.status_code == 200
        assert removed.json()["items"] == []


def test_sqlite_foreign_keys_are_enabled(monkeypatch, tmp_path):
    database_path = tmp_path / "isolated-tienda.db"
    monkeypatch.setenv("TIENDA_DATABASE_PATH", str(database_path))
    with TestClient(app):
        with get_engine().connect() as connection:
            assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar_one() == 1
    assert database_path.exists()
