from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AuditedProvider, AuditCase, VaultDocument

DOCUMENT_REQUIREMENT_KEYWORDS = {
    "orden": ("orden",),
    "informe": ("informe",),
    "certificado": ("certificado",),
    "historia clinica": ("historia clinica", "historia clínica"),
    "documento": ("documento",),
}


def approval_issues(session: Session, case: AuditCase) -> list[str]:
    provider = session.get(AuditedProvider, case.dni_prestador)
    if provider is None:
        return ["El prestador ya no existe."]

    issues: list[str] = []
    if provider.estado_matricula != "ACTIVA":
        issues.append("La matrícula del prestador no está activa.")
    if provider.estado_renaper != "VALIDADO":
        issues.append("La identidad del prestador no está validada.")

    document_types = session.scalars(
        select(VaultDocument.tipo_documento).where(
            VaultDocument.dni_prestador == case.dni_prestador
        )
    ).all()
    normalized_types = [document_type.casefold() for document_type in document_types]
    for requirement in case.nomenclador.requisitos_exigidos.split(","):
        normalized_requirement = requirement.strip().casefold()
        keywords = next(
            (
                values
                for keyword, values in DOCUMENT_REQUIREMENT_KEYWORDS.items()
                if keyword in normalized_requirement
            ),
            (),
        )
        if keywords and not any(
            any(keyword in document_type for keyword in keywords)
            for document_type in normalized_types
        ):
            issues.append(f"Falta documentación requerida: {requirement.strip()}.")
    return issues
