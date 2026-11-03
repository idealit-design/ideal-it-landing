from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from generators.common import (
    ACCENT,
    INK,
    WARNING,
    draw_document_card,
)


def generate_medical_assets(
    professional: dict[str, Any], jpeg_path: Path, pdf_path: Path
) -> None:
    draw_document_card(
        title="CREDENCIAL DE PRACTICA",
        subtitle="PROFESIONAL Y MATRICULA COMPLETAMENTE FICTICIOS",
        full_name=professional["full_name"],
        identifier_label="Matricula de demostracion",
        identifier=professional["license_number"],
        detail_lines=[
            ("Especialidad ficticia", professional["specialty"]),
            ("Emision / vencimiento", (
                f'{professional["issue_date"]} / {professional["expiry_date"]}'
            )),
        ],
        output_path=jpeg_path,
        fingerprint=False,
    )
    _generate_medical_pdf(professional, pdf_path)


def _generate_medical_pdf(professional: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = A4
    document = canvas.Canvas(str(output_path), pagesize=A4)
    document.setTitle("Documento sintetico de prueba - no valido")
    document.setFillColor(colors.HexColor("#f7fafb"))
    document.rect(0, 0, page_width, page_height, fill=1, stroke=0)

    document.setFillColor(colors.HexColor(INK))
    document.rect(0, page_height - 152, page_width, 152, fill=1, stroke=0)
    document.setFillColor(colors.white)
    document.setFont("Helvetica-Bold", 24)
    document.drawString(48, page_height - 76, "CREDENCIAL MEDICA DE PRUEBA")
    document.setFont("Helvetica", 12)
    document.drawString(48, page_height - 105, "Datos y entidad completamente ficticios")

    document.setFillColor(colors.HexColor(ACCENT))
    document.setFont("Helvetica-Bold", 11)
    document.drawString(55, page_height - 208, "PROFESIONAL")
    document.setFillColor(colors.HexColor(INK))
    document.setFont("Helvetica-Bold", 20)
    document.drawString(55, page_height - 240, professional["full_name"])

    rows = (
        ("Matricula de demostracion", professional["license_number"]),
        ("Especialidad ficticia", professional["specialty"]),
        ("Fecha de emision", professional["issue_date"]),
        ("Vencimiento de muestra", professional["expiry_date"]),
        ("Institucion", professional["institution"]),
    )
    y = page_height - 300
    for label, value in rows:
        document.setFillColor(colors.HexColor(ACCENT))
        document.setFont("Helvetica-Bold", 10)
        document.drawString(55, y, label.upper())
        document.setFillColor(colors.HexColor(INK))
        document.setFont("Helvetica", 14)
        document.drawString(55, y - 22, value)
        y -= 70

    document.saveState()
    document.translate(page_width / 2, page_height / 2)
    document.rotate(35)
    document.setFillColor(colors.Color(0.64, 0.14, 0.14, alpha=0.20))
    document.setFont("Helvetica-Bold", 38)
    document.drawCentredString(0, 0, "FICTICIO - NO VALIDO")
    document.restoreState()

    document.setFillColor(colors.HexColor(WARNING))
    document.roundRect(45, 54, page_width - 90, 58, 10, fill=1, stroke=0)
    document.setFillColor(colors.white)
    document.setFont("Helvetica-Bold", 13)
    document.drawCentredString(
        page_width / 2,
        77,
        "DEMO SINTETICA - NO ES UNA MATRICULA NI CREDENCIAL OFICIAL",
    )
    document.save()
