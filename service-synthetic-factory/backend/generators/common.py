from pathlib import Path
import unicodedata

from PIL import Image, ImageDraw, ImageFont


CARD_SIZE = (1080, 680)
INK = "#172b4d"
ACCENT = "#175d7a"
PALE = "#e7f2f4"
WARNING = "#a32323"


def load_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = (
        ("arialbd.ttf", "DejaVuSans-Bold.ttf")
        if bold
        else ("arial.ttf", "DejaVuSans.ttf")
    )
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_text(
    draw: ImageDraw.ImageDraw,
    position: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: str,
) -> None:
    try:
        draw.text(position, text, font=font, fill=fill)
    except UnicodeEncodeError:
        ascii_text = (
            unicodedata.normalize("NFKD", text)
            .encode("ascii", "ignore")
            .decode("ascii")
        )
        draw.text(position, ascii_text, font=font, fill=fill)


def draw_avatar(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int]) -> None:
    left, top, right, bottom = bounds
    center_x = (left + right) // 2
    draw.rounded_rectangle(bounds, radius=28, fill="#d2e3e7")
    draw.ellipse(
        (center_x - 76, top + 44, center_x + 76, top + 196),
        fill="#f3c7a6",
    )
    draw.pieslice(
        (center_x - 82, top + 38, center_x + 82, top + 202),
        start=180,
        end=360,
        fill="#49352d",
    )
    draw.rounded_rectangle(
        (center_x - 118, top + 204, center_x + 118, bottom - 20),
        radius=72,
        fill=ACCENT,
    )
    draw_text(
        draw,
        (left + 14, bottom - 52),
        "AVATAR ILUSTRADO",
        load_font(18, bold=True),
        INK,
    )


def draw_fingerprint_mock(
    draw: ImageDraw.ImageDraw, center: tuple[int, int]
) -> None:
    x, y = center
    for inset in range(0, 62, 9):
        draw.arc(
            (x - 55 + inset, y - 64 + inset, x + 55 - inset, y + 64 - inset),
            start=25,
            end=330,
            fill="#59808b",
            width=3,
        )
    draw.line((x - 42, y + 42, x + 40, y - 42), fill="#59808b", width=3)


def add_synthetic_watermark(image: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    font = load_font(68, bold=True)
    for y in (190, 420):
        draw.text(
            (60, y),
            "DEMO - FICTICIO - NO VALIDO",
            font=font,
            fill=(163, 35, 35, 105),
            stroke_width=2,
            stroke_fill=(255, 255, 255, 150),
        )
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def draw_document_card(
    *,
    title: str,
    subtitle: str,
    full_name: str,
    identifier_label: str,
    identifier: str,
    detail_lines: list[tuple[str, str]],
    output_path: Path,
    fingerprint: bool,
) -> None:
    image = Image.new("RGB", CARD_SIZE, "#f7fafb")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((24, 24, 1056, 656), radius=34, fill=PALE)
    draw.rounded_rectangle((24, 24, 1056, 138), radius=34, fill=INK)
    draw.rectangle((24, 92, 1056, 138), fill=INK)
    draw_text(draw, (60, 48), title, load_font(42, bold=True), "#ffffff")
    draw_text(draw, (62, 98), subtitle, load_font(22), "#d8edf2")

    draw_avatar(draw, (60, 174, 326, 534))
    draw_text(draw, (372, 184), "NOMBRE FICTICIO", load_font(19, bold=True), ACCENT)
    draw_text(draw, (372, 216), full_name, load_font(36, bold=True), INK)
    draw_text(
        draw,
        (372, 278),
        identifier_label.upper(),
        load_font(18, bold=True),
        ACCENT,
    )
    draw_text(draw, (372, 307), identifier, load_font(29, bold=True), INK)

    y = 365
    for label, value in detail_lines:
        draw_text(draw, (372, y), label.upper(), load_font(16, bold=True), ACCENT)
        draw_text(draw, (372, y + 23), value, load_font(22), INK)
        y += 78

    if fingerprint:
        draw_fingerprint_mock(draw, (888, 430))
        draw_text(draw, (815, 508), "HUELLA MOCK", load_font(16, bold=True), INK)

    draw.rounded_rectangle((60, 574, 1020, 628), radius=12, fill="#f9e3e3")
    draw_text(
        draw,
        (87, 586),
        "MATERIAL SINTETICO - SIN VALIDEZ - NO ES DOCUMENTO OFICIAL",
        load_font(21, bold=True),
        WARNING,
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    add_synthetic_watermark(image).save(output_path, format="JPEG", quality=90)
