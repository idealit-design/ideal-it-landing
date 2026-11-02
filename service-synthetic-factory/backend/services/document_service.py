from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def create_invoice_pdf(invoice: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = A4
    document = canvas.Canvas(str(output_path), pagesize=A4)
    document.setTitle("Factura sintetica de demostracion - no valida")
    document.setFillColor(colors.HexColor("#f5f8fa"))
    document.rect(0, 0, page_width, page_height, fill=1, stroke=0)
    document.setFillColor(colors.HexColor("#173a50"))
    document.rect(0, page_height - 128, page_width, 128, fill=1, stroke=0)
    document.setFillColor(colors.white)
    document.setFont("Helvetica-Bold", 24)
    document.drawString(48, page_height - 66, "COMPROBANTE DE PRUEBA")
    document.setFont("Helvetica-Bold", 12)
    document.drawString(48, page_height - 96, "FICTICIO - SIN VALIDEZ FISCAL")

    y = page_height - 174
    document.setFillColor(colors.HexColor("#173a50"))
    document.setFont("Helvetica", 12)
    document.drawString(52, y, f"Referencia: {invoice['invoice_id']}")
    document.drawString(52, y - 22, f"Comercio: {invoice['merchant']}")
    document.drawString(52, y - 44, f"Fecha: {invoice['issued_at']}")
    y -= 92

    for item in invoice["items"]:
        document.setFont("Helvetica-Bold", 11)
        document.drawString(56, y, item["description"][:52])
        document.setFont("Helvetica", 11)
        document.drawRightString(page_width - 56, y, f"${item['total']:.2f}")
        y -= 25
    y -= 20
    document.setFont("Helvetica-Bold", 16)
    document.drawRightString(page_width - 56, y, f"TOTAL MOCK: ${invoice['total']:.2f}")
    document.saveState()
    document.translate(page_width / 2, page_height / 2)
    document.rotate(35)
    document.setFillColor(colors.Color(0.64, 0.14, 0.14, alpha=0.18))
    document.setFont("Helvetica-Bold", 38)
    document.drawCentredString(0, 0, "DEMO - NO VALIDO")
    document.restoreState()
    document.setFillColor(colors.HexColor("#a32323"))
    document.roundRect(45, 50, page_width - 90, 48, 9, fill=1, stroke=0)
    document.setFillColor(colors.white)
    document.setFont("Helvetica-Bold", 11)
    document.drawCentredString(
        page_width / 2, 68, "DATOS SINTETICOS - NO ES UN COMPROBANTE FISCAL"
    )
    document.save()
