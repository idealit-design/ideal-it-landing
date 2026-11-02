import csv
import base64
import html
import io
import json
import random
import re
from typing import Any, Literal
from xml.sax.saxutils import escape

import yaml
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from PIL import Image, UnidentifiedImageError
from starlette.responses import Response

from services.utility_log import log_utility_run


router = APIRouter()
MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000


class ConversionRequest(BaseModel):
    source: Literal["json", "yaml", "csv", "markdown"]
    target: Literal["json", "yaml", "csv", "html"]
    content: str = Field(max_length=1_000_000)


class MockDataRequest(BaseModel):
    rows: int = Field(default=50, ge=1, le=500)
    dataset: Literal["users", "transactions"] = "users"
    format: Literal["json", "csv", "sql"] = "json"


def _json_to_csv(value: Any) -> str:
    if not isinstance(value, list) or not all(isinstance(row, dict) for row in value):
        raise HTTPException(
            status_code=422, detail="JSON a CSV requiere una lista de objetos."
        )
    columns = list(dict.fromkeys(key for row in value for key in row))
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
    if columns:
        writer.writeheader()
        for row in value:
            writer.writerow(
                {
                    key: json.dumps(item, ensure_ascii=False)
                    if isinstance(item, (dict, list))
                    else item
                    for key, item in row.items()
                }
            )
    return output.getvalue()


def _markdown_to_html(content: str) -> str:
    rows = [
        [cell.strip() for cell in line.strip().strip("|").split("|")]
        for line in content.splitlines()
        if line.strip()
    ]
    rows = [
        row
        for row in rows
        if not all(set(cell.replace(":", "").replace("-", "")) == set() for cell in row)
    ]
    if not rows:
        raise HTTPException(status_code=422, detail="No se encontró una tabla Markdown.")
    width = max(len(row) for row in rows)
    head = rows[0] + [""] * (width - len(rows[0]))
    body = [row + [""] * (width - len(row)) for row in rows[1:]]
    headers = "".join(f"<th>{html.escape(cell)}</th>" for cell in head)
    table_rows = "".join(
        "<tr>" + "".join(f"<td>{html.escape(cell)}</td>" for cell in row) + "</tr>"
        for row in body
    )
    return (
        "<!doctype html><html lang=\"es\"><meta charset=\"utf-8\">"
        "<title>Tabla de demostración</title>"
        "<style>body{font:15px sans-serif;margin:2rem;color:#173a50}"
        "table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccd8df;"
        "padding:.7rem;text-align:left}th{background:#e8f2f5}</style>"
        "<table><thead><tr>"
        f"{headers}</tr></thead><tbody>{table_rows}</tbody></table></html>"
    )


def convert_content(body: ConversionRequest) -> tuple[str, str, str]:
    if body.source == "markdown" and body.target == "html":
        return _markdown_to_html(body.content), "text/html", "tabla.html"
    if body.source == body.target and body.source in {"json", "yaml", "csv"}:
        return body.content, f"text/{body.target}", f"convertido.{body.target}"
    if body.source == "json":
        try:
            value = json.loads(body.content)
        except json.JSONDecodeError as error:
            raise HTTPException(status_code=422, detail=f"JSON inválido: {error.msg}.")
        if body.target == "yaml":
            return yaml.safe_dump(value, allow_unicode=True, sort_keys=False), "text/yaml", "convertido.yaml"
        if body.target == "csv":
            return _json_to_csv(value), "text/csv", "convertido.csv"
    elif body.source == "yaml" and body.target == "json":
        try:
            value = yaml.safe_load(body.content)
        except yaml.YAMLError as error:
            raise HTTPException(status_code=422, detail=f"YAML inválido: {error}.")
        return json.dumps(value, ensure_ascii=False, indent=2), "application/json", "convertido.json"
    elif body.source == "csv" and body.target == "json":
        try:
            rows = list(csv.DictReader(io.StringIO(body.content)))
        except csv.Error as error:
            raise HTTPException(status_code=422, detail=f"CSV inválido: {error}.")
        if not rows and body.content.strip():
            raise HTTPException(status_code=422, detail="El CSV debe incluir encabezados.")
        return json.dumps(rows, ensure_ascii=False, indent=2), "application/json", "convertido.json"
    raise HTTPException(
        status_code=422,
        detail=f"Conversión no soportada: {body.source} a {body.target}.",
    )


@router.post("/convert")
def convert(body: ConversionRequest, request: Request) -> dict[str, Any]:
    output, media_type, filename = convert_content(body)
    result = {
        "content": output,
        "media_type": media_type,
        "filename": filename,
        "size_bytes": len(output.encode("utf-8")),
    }
    log_utility_run(
        request.app.state.database_path,
        "convert_content",
        {
            "source": body.source,
            "target": body.target,
            "input_bytes": len(body.content.encode("utf-8")),
        },
        {"filename": filename, "output_bytes": len(output.encode("utf-8"))},
    )
    return result


def _mock_rows(dataset: str, count: int) -> list[dict[str, Any]]:
    if dataset == "users":
        return [
            {
                "id": f"SYN-USR-{index + 1:05d}",
                "name": f"Usuario Demo {index + 1}",
                "email": f"usuario{index + 1}@example.invalid",
                "active": index % 5 != 0,
            }
            for index in range(count)
        ]
    return [
        {
            "id": f"SYN-TXN-{index + 1:05d}",
            "amount": round(random.uniform(50, 50_000), 2),
            "currency": "ARS",
            "status": random.choice(("pending", "paid", "cancelled")),
        }
        for index in range(count)
    ]


def _sql_literal(value: Any) -> str:
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


async def _read_upload(file: UploadFile) -> bytes:
    content = await file.read(MAX_FILE_BYTES + 1)
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera el límite de 10 MB.")
    if not content:
        raise HTTPException(status_code=422, detail="El archivo está vacío.")
    return content


def _attachment(content: bytes, filename: str, media_type: str) -> Response:
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/files/csv-to-json")
async def convert_csv_file(
    request: Request, file: UploadFile = File(...)
) -> Response:
    content = await _read_upload(file)
    try:
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text, newline=""))
        if not reader.fieldnames or any(not name.strip() for name in reader.fieldnames):
            raise HTTPException(status_code=422, detail="El CSV debe incluir encabezados.")
        if len(set(reader.fieldnames)) != len(reader.fieldnames):
            raise HTTPException(status_code=422, detail="El CSV contiene encabezados duplicados.")
        rows = list(reader)
    except UnicodeDecodeError as error:
        raise HTTPException(status_code=422, detail="El CSV debe estar codificado en UTF-8.") from error
    except csv.Error as error:
        raise HTTPException(status_code=422, detail=f"CSV inválido: {error}.") from error
    if any(None in row for row in rows):
        raise HTTPException(status_code=422, detail="Hay filas con más columnas que el encabezado.")
    output = json.dumps(rows, ensure_ascii=False, indent=2).encode("utf-8")
    log_utility_run(
        request.app.state.database_path,
        "convert_csv_file",
        {"input_bytes": len(content)},
        {"output_bytes": len(output), "rows": len(rows)},
    )
    return _attachment(output, "convertido.json", "application/json")


def _markdown_paragraph(text: str) -> str:
    escaped = escape(text)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", escaped)
    return re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', escaped)


def _markdown_pdf(content: str) -> bytes:
    output = io.BytesIO()
    document = SimpleDocTemplate(output, pagesize=A4, title="Documento convertido")
    styles = getSampleStyleSheet()
    story: list[Any] = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 7))
            continue
        heading = re.match(r"^(#{1,3})\s+(.+)$", stripped)
        bullet = re.match(r"^[-*]\s+(.+)$", stripped)
        if heading:
            style = styles[f"Heading{min(len(heading.group(1)), 3)}"]
            story.append(Paragraph(_markdown_paragraph(heading.group(2)), style))
        elif bullet:
            story.append(
                Paragraph(_markdown_paragraph(bullet.group(1)), styles["BodyText"], bulletText="-")
            )
        else:
            story.append(Paragraph(_markdown_paragraph(stripped), styles["BodyText"]))
    document.build(story or [Paragraph("Documento vacío", styles["BodyText"])])
    return output.getvalue()


@router.post("/files/markdown-to-pdf")
async def convert_markdown_file(
    request: Request, file: UploadFile = File(...)
) -> Response:
    content = await _read_upload(file)
    try:
        markdown = content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise HTTPException(status_code=422, detail="Markdown debe estar codificado en UTF-8.") from error
    output = _markdown_pdf(markdown)
    log_utility_run(
        request.app.state.database_path,
        "convert_markdown_file",
        {"input_bytes": len(content)},
        {"output_bytes": len(output)},
    )
    return _attachment(output, "convertido.pdf", "application/pdf")


@router.post("/files/compress-image")
async def compress_image_file(
    request: Request,
    file: UploadFile = File(...),
    quality: int = Form(default=75, ge=20, le=95),
) -> Response:
    content = await _read_upload(file)
    try:
        image = Image.open(io.BytesIO(content))
        if image.width * image.height > MAX_IMAGE_PIXELS:
            raise HTTPException(status_code=413, detail="La imagen supera el límite de 40 megapíxeles.")
        image.load()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise HTTPException(status_code=422, detail="El archivo no contiene una imagen válida.") from error
    if image.format not in {"JPEG", "PNG", "WEBP"}:
        raise HTTPException(status_code=422, detail="Formato de imagen no soportado; usa JPEG, PNG o WebP.")
    if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
        rgba = image.convert("RGBA")
        background = Image.new("RGB", rgba.size, "white")
        background.paste(rgba, mask=rgba.getchannel("A"))
        image = background
    else:
        image = image.convert("RGB")
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=quality, optimize=True)
    compressed = output.getvalue()
    log_utility_run(
        request.app.state.database_path,
        "compress_image",
        {"input_bytes": len(content), "quality": quality},
        {"output_bytes": len(compressed), "media_type": "image/jpeg"},
    )
    return _attachment(compressed, "imagen-comprimida.jpg", "image/jpeg")


@router.post("/mock-data")
def create_mock_data(body: MockDataRequest, request: Request) -> dict[str, Any]:
    rows = _mock_rows(body.dataset, body.rows)
    columns = list(rows[0])
    if body.format == "json":
        content = json.dumps(rows, ensure_ascii=False, indent=2)
        media_type = "application/json"
        extension = "json"
    elif body.format == "csv":
        output = io.StringIO(newline="")
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
        content = output.getvalue()
        media_type = "text/csv"
        extension = "csv"
    else:
        table = "synthetic_users" if body.dataset == "users" else "synthetic_transactions"
        names = ", ".join(f'"{column}"' for column in columns)
        statements = [
            f"INSERT INTO {table} ({names}) VALUES "
            f"({', '.join(_sql_literal(row[column]) for column in columns)});"
            for row in rows
        ]
        content = "\n".join(statements)
        media_type = "application/sql"
        extension = "sql"

    result = {
        "dataset": body.dataset,
        "rows": body.rows,
        "format": body.format,
        "content": content,
        "filename": f"synthetic-{body.dataset}.{extension}",
        "media_type": media_type,
    }
    log_utility_run(
        request.app.state.database_path,
        "generate_mock_data",
        body.model_dump(),
        {
            "filename": result["filename"],
            "media_type": media_type,
            "content_bytes": len(content.encode("utf-8")),
        },
    )
    return result
