import hashlib
import hmac
import io
import json
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

from routers import validators


def test_generator_routes_create_local_synthetic_assets(client: TestClient) -> None:
    profile = client.post("/api/v1/generators/profiles")
    assert profile.status_code == 201
    profile_data = profile.json()
    assert profile_data["payload"]["synthetic"] is True
    assert profile_data["payload"]["tax_identifier_namespace"] == "SYNTHETIC-NOT-REGISTERED"
    assert profile_data["assets"][0]["media_type"] == "image/jpeg"
    assert client.get(profile_data["assets"][0]["url"]).content.startswith(b"\xff\xd8")
    tax_identifier = profile_data["payload"]["tax_identifier"]
    valid_tax = client.post(
        "/api/v1/validators/structure",
        json={"data": "{}", "formats": {"tax_identifier": tax_identifier}},
    )
    assert valid_tax.json()["valid"] is True
    prefix, number, check_digit = tax_identifier.split("-")
    invalid_tax = client.post(
        "/api/v1/validators/structure",
        json={
            "data": "{}",
            "formats": {
                "tax_identifier": f"{prefix}-{number}-{(int(check_digit) + 1) % 10}"
            },
        },
    )
    assert invalid_tax.json()["valid"] is False

    invoice = client.post(
        "/api/v1/generators/invoices",
        json={"item_count": 2, "payment_method": "simulado"},
    )
    assert invoice.status_code == 201
    assert invoice.json()["invoice"]["synthetic"] is True
    pdf = client.get(invoice.json()["assets"][0]["url"])
    assert pdf.status_code == 200
    assert pdf.content.startswith(b"%PDF")


def test_structure_validator_reports_json_schema_and_format_errors(
    client: TestClient,
) -> None:
    valid = client.post(
        "/api/v1/validators/structure",
        json={
            "data": '{"user":{"id":"SYN-1","active":true},"status":"ready"}',
            "schema": {
                "type": "object",
                "required": ["user", "status"],
                "properties": {
                    "user": {
                        "type": "object",
                        "required": ["id", "active"],
                        "properties": {
                            "id": {"type": "string"},
                            "active": {"type": "boolean"},
                        },
                    },
                    "status": {"type": "string", "enum": ["ready", "pending"]},
                },
            },
            "formats": {
                "email": "demo@example.invalid",
                "phone": "000-000-0000",
            },
        },
    )
    assert valid.status_code == 200
    assert valid.json() == {"valid": True, "errors": []}

    invalid = client.post(
        "/api/v1/validators/structure",
        json={
            "data": '{"id":3}',
            "schema": {
                "type": "object",
                "required": ["id"],
                "properties": {"id": {"type": "string"}},
            },
            "formats": {"email": "no-es-email", "phone": "12"},
        },
    )
    assert invalid.status_code == 200
    assert invalid.json()["valid"] is False
    assert {error["field"] for error in invalid.json()["errors"]} >= {
        "id",
        "email",
        "phone",
    }


def test_structure_validator_reports_malformed_json(client: TestClient) -> None:
    response = client.post(
        "/api/v1/validators/structure",
        json={"data": '{"unfinished":', "formats": {}},
    )
    assert response.status_code == 200
    assert response.json()["errors"][0]["field"] == "json"
    assert "línea" in response.json()["errors"][0]["message"]


def test_email_validator_checks_syntax_and_optional_mx(
    client: TestClient, monkeypatch
) -> None:
    monkeypatch.setattr(validators, "domain_has_mx", lambda domain: domain == "mail.test")
    valid = client.post(
        "/api/v1/validators/email",
        json={"email": "demo@mail.test", "check_mx": True},
    )
    assert valid.status_code == 200
    assert valid.json()["syntax_valid"] is True
    assert valid.json()["mx_valid"] is True
    assert valid.json()["valid"] is True

    invalid_mx = client.post(
        "/api/v1/validators/email",
        json={"email": "demo@nomx.test", "check_mx": True},
    )
    assert invalid_mx.json()["mx_valid"] is False
    assert invalid_mx.json()["valid"] is False

    invalid_syntax = client.post(
        "/api/v1/validators/email",
        json={"email": "not-an-email", "check_mx": True},
    )
    assert invalid_syntax.json()["syntax_valid"] is False
    assert invalid_syntax.json()["mx_valid"] is None

    syntax_only = client.post(
        "/api/v1/validators/email",
        json={"email": "demo@mail.test", "check_mx": False},
    )
    assert syntax_only.json()["valid"] is True
    assert syntax_only.json()["mx_valid"] is None


def test_regional_identity_validators_check_document_formats(client: TestClient) -> None:
    cases = (
        ("AR", "dni", "12.345.678", True),
        ("AR", "cuit", "20-12345678-6", True),
        ("CL", "rut", "11.111.111-1", True),
        ("UY", "ci", "12345672", True),
        ("AR", "dni", "123", False),
        ("AR", "cuit", "20-12345678-5", False),
        ("CL", "rut", "11.111.111-2", False),
        ("UY", "ci", "12345673", False),
        ("CL", "cuit", "20-12345678-6", False),
    )
    for region, document_type, value, expected in cases:
        response = client.post(
            "/api/v1/validators/identity",
            json={
                "region": region,
                "document_type": document_type,
                "value": value,
            },
        )
        assert response.status_code == 200
        assert response.json()["valid"] is expected
        assert bool(response.json()["errors"]) is (not expected)


def test_file_converters_produce_downloadable_files(client: TestClient) -> None:
    csv_result = client.post(
        "/api/v1/converters/files/csv-to-json",
        files={"file": ("sample.csv", b"name,active\nAda,true\n", "text/csv")},
    )
    assert csv_result.status_code == 200
    assert csv_result.headers["content-disposition"].endswith('filename="convertido.json"')
    assert json.loads(csv_result.content) == [{"name": "Ada", "active": "true"}]

    pdf_result = client.post(
        "/api/v1/converters/files/markdown-to-pdf",
        files={"file": ("sample.md", b"# Demo\n\nTexto **seguro**.", "text/markdown")},
    )
    assert pdf_result.status_code == 200
    assert pdf_result.headers["content-type"] == "application/pdf"
    assert pdf_result.content.startswith(b"%PDF")

    image_buffer = io.BytesIO()
    Image.new("RGBA", (16, 16), (20, 80, 120, 128)).save(image_buffer, format="PNG")
    image_result = client.post(
        "/api/v1/converters/files/compress-image",
        files={"file": ("sample.png", image_buffer.getvalue(), "image/png")},
        data={"quality": "60"},
    )
    assert image_result.status_code == 200
    assert image_result.headers["content-type"] == "image/jpeg"
    assert image_result.content.startswith(b"\xff\xd8")

    invalid_image = client.post(
        "/api/v1/converters/files/compress-image",
        files={"file": ("sample.png", b"not an image", "image/png")},
    )
    assert invalid_image.status_code == 422


def test_file_integrity_uses_content_mime_and_sha256(client: TestClient) -> None:
    content = b"%PDF-1.7\nsynthetic demo"
    response = client.post(
        "/api/v1/validators/file-integrity",
        files={"file": ("sample.txt", content, "text/plain")},
    )
    assert response.status_code == 200
    result = response.json()
    assert result["sha256"] == hashlib.sha256(content).hexdigest()
    assert result["detected_mime"] == "application/pdf"
    assert result["safe_for_demo"] is True
    assert "no malware scan" in result["scan_scope"]
    assert result["warnings"]

    executable = client.post(
        "/api/v1/validators/file-integrity",
        files={"file": ("sample.exe", b"MZ\x00synthetic", "text/plain")},
    )
    assert executable.status_code == 200
    assert executable.json()["safe_for_demo"] is False

    oversized = client.post(
        "/api/v1/validators/file-integrity",
        files={"file": ("large.txt", b"x" * (10 * 1024 * 1024 + 1), "text/plain")},
    )
    assert oversized.status_code == 413


def test_converters_escape_markdown_and_convert_json_yaml(client: TestClient) -> None:
    html_result = client.post(
        "/api/v1/converters/convert",
        json={
            "source": "markdown",
            "target": "html",
            "content": "| Nombre |\n| --- |\n| <script>alert(1)</script> |",
        },
    )
    assert html_result.status_code == 200
    assert "<script>" not in html_result.json()["content"]
    assert "&lt;script&gt;" in html_result.json()["content"]

    yaml_result = client.post(
        "/api/v1/converters/convert",
        json={"source": "json", "target": "yaml", "content": '{"ok": true}'},
    )
    assert yaml_result.status_code == 200
    assert "ok: true" in yaml_result.json()["content"]


def test_bulk_data_is_capped_and_exports_sql(client: TestClient) -> None:
    response = client.post(
        "/api/v1/converters/mock-data",
        json={"rows": 4, "dataset": "users", "format": "sql"},
    )
    assert response.status_code == 200
    assert response.json()["content"].count("INSERT INTO") == 4
    assert "synthetic_users" in response.json()["content"]
    assert client.post(
        "/api/v1/converters/mock-data",
        json={"rows": 501, "dataset": "users", "format": "json"},
    ).status_code == 422


def test_mcp_and_webhook_simulations_do_not_use_external_connections(
    client: TestClient,
) -> None:
    status = client.get("/api/v1/mcp-bridge/status")
    assert status.json()["outbound_connections"] is False
    assert client.get("/api/v1/mcp-bridge/resources").json()["resources"]
    tool = client.post(
        "/api/v1/mcp-bridge/tools/echo_fixture", json={"text": "fixture"}
    )
    assert tool.json()["content"][0]["text"] == "fixture"

    event = {"event": "payment.updated", "payload": {"id": "SYN-1"}}
    webhook = client.post("/api/v1/mcp-bridge/webhooks/simulate", json=event)
    assert webhook.status_code == 200
    result = webhook.json()
    expected = hmac.new(
        client.app.state.webhook_signing_key,
        json.dumps(event, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode(),
        hashlib.sha256,
    ).hexdigest()
    assert result["headers"]["x-simulated-signature"] == f"sha256={expected}"
    assert result["response"]["status_code"] == 202
    assert "no HTTP request sent" in result["destination"]


def test_utility_runs_are_persisted_in_factory_database(client: TestClient) -> None:
    sensitive_fixture = "LOCAL-ONLY-TEST-PAYLOAD"
    client.post(
        "/api/v1/validators/structure",
        json={"data": json.dumps({"value": sensitive_fixture}), "formats": {}},
    )
    client.post(
        "/api/v1/validators/email",
        json={"email": "private-part@example.test", "check_mx": False},
    )
    client.post(
        "/api/v1/validators/identity",
        json={"region": "AR", "document_type": "dni", "value": "12345678"},
    )
    client.post(
        "/api/v1/mcp-bridge/webhooks/simulate",
        json={"event": "fixture.received", "payload": {"token": sensitive_fixture}},
    )
    database_path = Path(client.app.state.database_path)
    import sqlite3

    with sqlite3.connect(database_path) as connection:
        row = connection.execute(
            "SELECT operation, status, input_json, result_json FROM utility_runs "
            "WHERE operation = 'validate_structure'"
        ).fetchone()
        webhook_row = connection.execute(
            "SELECT input_json, result_json FROM utility_runs "
            "WHERE operation = 'simulate_webhook'"
        ).fetchone()
        email_row = connection.execute(
            "SELECT input_json, result_json FROM utility_runs "
            "WHERE operation = 'validate_email'"
        ).fetchone()
        identity_row = connection.execute(
            "SELECT input_json, result_json FROM utility_runs "
            "WHERE operation = 'validate_identity'"
        ).fetchone()
    assert row[:2] == ("validate_structure", "success")
    assert sensitive_fixture not in json.dumps(row[2:])
    assert sensitive_fixture not in json.dumps(webhook_row)
    assert "private-part" not in json.dumps(email_row)
    assert "12345678" not in json.dumps(identity_row)
