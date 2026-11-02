import hashlib
import hmac
import json
from time import perf_counter
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from services.utility_log import log_utility_run


router = APIRouter()
RESOURCES = {
    "factory://status": {
        "name": "Estado local",
        "text": "Simulador MCP local activo. Sin conexiones externas.",
    },
    "factory://templates": {
        "name": "Plantillas sintéticas",
        "text": "Perfiles, transacciones y validaciones de demostración.",
    },
}
TOOLS = {
    "echo_fixture": "Devuelve un fixture de texto suministrado por el usuario.",
    "list_capabilities": "Lista las capacidades simuladas del Command Center.",
}


class ToolCall(BaseModel):
    text: str = Field(default="", max_length=4000)


class WebhookSimulation(BaseModel):
    event: str = Field(default="payment.updated", min_length=1, max_length=80)
    payload: dict[str, Any] = Field(default_factory=dict)


@router.get("/status")
def get_status() -> dict[str, Any]:
    return {
        "transport": "in-process",
        "status": "simulated",
        "resources": list(RESOURCES),
        "tools": list(TOOLS),
        "outbound_connections": False,
    }


@router.get("/resources")
def list_resources() -> dict[str, Any]:
    return {"resources": RESOURCES}


@router.get("/tools")
def list_tools() -> dict[str, Any]:
    return {
        "tools": [{"name": name, "description": description} for name, description in TOOLS.items()]
    }


@router.post("/tools/{tool_name}")
def call_tool(
    tool_name: str, body: ToolCall, request: Request
) -> dict[str, Any]:
    if tool_name not in TOOLS:
        raise HTTPException(status_code=404, detail="Herramienta simulada inexistente.")
    if tool_name == "echo_fixture":
        result = {"content": [{"type": "text", "text": body.text}], "synthetic": True}
    else:
        result = {"content": [{"type": "text", "text": ", ".join(TOOLS)}], "synthetic": True}
    log_utility_run(
        request.app.state.database_path,
        f"mcp_tool:{tool_name}",
        {"text_characters": len(body.text)},
        {"synthetic": True, "content_items": len(result["content"])},
    )
    return result


@router.post("/webhooks/simulate")
def simulate_webhook(
    body: WebhookSimulation, request: Request
) -> dict[str, Any]:
    started_at = perf_counter()
    serialized = json.dumps(
        {"event": body.event, "payload": body.payload},
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    signing_key: bytes = request.app.state.webhook_signing_key
    signature = hmac.new(signing_key, serialized, hashlib.sha256).hexdigest()
    elapsed_ms = round((perf_counter() - started_at) * 1000, 3)
    result = {
        "received": True,
        "simulated": True,
        "destination": "localhost-only; no HTTP request sent",
        "event": body.event,
        "headers": {
            "content-type": "application/json",
            "x-synthetic-event": body.event,
            "x-simulated-signature": f"sha256={signature}",
        },
        "payload": body.payload,
        "response": {"status_code": 202, "body": {"accepted": True}},
        "elapsed_ms": elapsed_ms,
    }
    log_utility_run(
        request.app.state.database_path,
        "simulate_webhook",
        {
            "event": body.event,
            "payload_bytes": len(
                json.dumps(body.payload, ensure_ascii=False).encode("utf-8")
            ),
        },
        {
            "simulated": True,
            "response_status": 202,
            "elapsed_ms": elapsed_ms,
        },
    )
    return result
