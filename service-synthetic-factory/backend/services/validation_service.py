import re
from typing import Literal

import dns.exception
import dns.resolver


Region = Literal["AR", "CL", "UY"]
DocumentType = Literal["dni", "cuit", "rut", "ci"]

EMAIL_LOCAL_PATTERN = re.compile(
    r"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$"
)


def validate_email_syntax(email: str) -> tuple[bool, str | None]:
    if len(email) > 254 or email.count("@") != 1:
        return False, None
    local, domain = email.rsplit("@", 1)
    if not local or len(local) > 64 or not EMAIL_LOCAL_PATTERN.fullmatch(local):
        return False, None
    try:
        ascii_domain = domain.encode("idna").decode("ascii").lower()
    except UnicodeError:
        return False, None
    if len(ascii_domain) > 253 or "." not in ascii_domain:
        return False, None
    labels = ascii_domain.split(".")
    if any(
        not label
        or len(label) > 63
        or not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", label)
        for label in labels
    ):
        return False, None
    return True, ascii_domain


def domain_has_mx(domain: str) -> bool:
    records = dns.resolver.resolve(domain, "MX", lifetime=3)
    return any(str(record.exchange) != "." for record in records)


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def _valid_argentina_cuit(value: str) -> bool:
    normalized = _digits(value)
    if len(normalized) != 11 or normalized[:2] not in {
        "00", "20", "23", "24", "27", "30", "33", "34",
    }:
        return False
    weights = (5, 4, 3, 2, 7, 6, 5, 4, 3, 2)
    remainder = sum(
        int(digit) * weight
        for digit, weight in zip(normalized[:10], weights)
    ) % 11
    check_digit = 11 - remainder
    check_digit = 0 if check_digit == 11 else 9 if check_digit == 10 else check_digit
    return int(normalized[-1]) == check_digit


def _valid_chile_rut(value: str) -> bool:
    normalized = re.sub(r"[.\-\s]", "", value).upper()
    if len(normalized) < 2 or not normalized[:-1].isdigit():
        return False
    if not 7 <= len(normalized[:-1]) <= 8:
        return False
    total = sum(
        int(digit) * (index % 6 + 2)
        for index, digit in enumerate(reversed(normalized[:-1]))
    )
    remainder = 11 - total % 11
    expected = "0" if remainder == 11 else "K" if remainder == 10 else str(remainder)
    return normalized[-1] == expected


def _valid_uruguay_ci(value: str) -> bool:
    normalized = _digits(value)
    if len(normalized) != 8:
        return False
    weights = (2, 9, 8, 7, 6, 3, 4)
    total = sum(
        int(digit) * weight
        for digit, weight in zip(normalized[:7], weights)
    )
    return int(normalized[-1]) == (10 - total % 10) % 10


def validate_identity_format(
    region: Region, document_type: DocumentType, value: str
) -> tuple[bool, str, str | None]:
    if region == "AR" and document_type == "dni":
        normalized = _digits(value)
        valid = (
            re.fullmatch(r"(?:\d{7,8}|\d{1,2}(?:\.\d{3}){2})", value.strip())
            is not None
            and 7 <= len(normalized) <= 8
        )
        return valid, normalized, None if valid else "El DNI argentino debe tener 7 u 8 dígitos."
    if region == "AR" and document_type == "cuit":
        normalized = _digits(value)
        valid = (
            re.fullmatch(r"(?:\d{11}|\d{2}-\d{8}-\d)", value.strip()) is not None
            and _valid_argentina_cuit(value)
        )
        return valid, normalized, None if valid else "El CUIT no tiene un formato o dígito verificador válido."
    if region == "CL" and document_type == "rut":
        normalized = re.sub(r"[.\-\s]", "", value).upper()
        valid = (
            re.fullmatch(r"[\d.Kk\-]+", value) is not None
            and _valid_chile_rut(value)
        )
        return valid, normalized, None if valid else "El RUT chileno no tiene un formato o dígito verificador válido."
    if region == "UY" and document_type == "ci":
        normalized = _digits(value)
        valid = (
            re.fullmatch(r"(?:\d{8}|\d\.\d{3}\.\d{3}-\d)", value.strip())
            is not None
            and _valid_uruguay_ci(value)
        )
        return valid, normalized, None if valid else "La cédula uruguaya debe tener 8 dígitos y verificador válido."
    return False, value.strip(), "El tipo de documento no está disponible para esta región."
