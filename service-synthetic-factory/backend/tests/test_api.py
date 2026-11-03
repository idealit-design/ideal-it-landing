import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from database import get_connection


def test_health_reports_semver_version(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}


def test_generates_synthetic_dni_and_persists_assets(client: TestClient) -> None:
    response = client.post("/api/v1/generate/dni")

    assert response.status_code == 201
    record = response.json()
    assert record["document_type"] == "dni"
    assert record["payload"]["synthetic"] is True
    assert record["payload"]["document_number"].startswith("000")
    assert len(record["assets"]) == 1
    asset = client.get(record["assets"][0]["url"])
    assert asset.status_code == 200
    assert asset.headers["content-type"] == "image/jpeg"
    downloadable = client.get(
        record["assets"][0]["url"], params={"download": "true"}
    )
    assert downloadable.headers["content-disposition"].startswith("attachment;")
    assert asset.content.startswith(b"\xff\xd8")

    listed = client.get("/api/v1/identities")
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == record["id"]
    assets_dir = Path(client.app.state.assets_dir)
    assert (assets_dir / record["assets"][0]["filename"]).is_file()


def test_generates_medical_pdf_and_jpeg(client: TestClient) -> None:
    response = client.post("/api/v1/generate/medical-license")

    assert response.status_code == 201
    record = response.json()
    assert record["document_type"] == "medical_license"
    assert record["payload"]["license_number"].startswith("SYN-MED-")
    assert {asset["media_type"] for asset in record["assets"]} == {
        "application/pdf",
        "image/jpeg",
    }
    assets = {
        asset["media_type"]: client.get(asset["url"])
        for asset in record["assets"]
    }
    assert assets["application/pdf"].status_code == 200
    assert assets["application/pdf"].content.startswith(b"%PDF")
    assert assets["image/jpeg"].content.startswith(b"\xff\xd8")


def test_foreign_keys_are_enabled_and_enforced(client: TestClient) -> None:
    database_path = Path(client.app.state.database_path)
    with get_connection(database_path) as connection:
        assert connection.execute("PRAGMA foreign_keys").fetchone()[0] == 1
        try:
            connection.execute(
                "INSERT INTO generated_assets "
                "(identity_id, filename, media_type) VALUES (?, ?, ?)",
                ("missing-identity", "orphan.jpeg", "image/jpeg"),
            )
        except sqlite3.IntegrityError:
            pass
        else:
            raise AssertionError("SQLite accepted an asset without an identity.")


def test_asset_endpoint_rejects_traversal_and_unknown_files(
    client: TestClient,
) -> None:
    assert client.get("/api/v1/assets/../factory_mvp.db").status_code == 404
    assert client.get("/api/v1/assets/missing.jpeg").status_code == 404


def test_cors_is_limited_to_the_local_frontend(client: TestClient) -> None:
    allowed = client.options(
        "/api/v1/identities",
        headers={
            "Origin": "http://127.0.0.1:4209",
            "Access-Control-Request-Method": "GET",
        },
    )
    denied = client.options(
        "/api/v1/identities",
        headers={
            "Origin": "https://example.invalid",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert allowed.headers.get("access-control-allow-origin") == (
        "http://127.0.0.1:4209"
    )
    assert "access-control-allow-origin" not in denied.headers
