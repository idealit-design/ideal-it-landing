from pathlib import Path
from typing import Any

from generators.common import draw_document_card


def generate_dni_image(
    profile: dict[str, Any], output_path: Path
) -> None:
    draw_document_card(
        title="IDENTIDAD DE PRUEBA",
        subtitle="TARJETA DE DEMOSTRACION - NO OFICIAL",
        full_name=profile["full_name"],
        identifier_label="Identificador ficticio",
        identifier=profile["document_number"],
        detail_lines=[
            ("Nacimiento (ficticio)", profile["birth_date"]),
            ("Nacionalidad / sexo", f'{profile["nationality"]} / {profile["sex"]}'),
        ],
        output_path=output_path,
        fingerprint=True,
    )
