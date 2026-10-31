import ipaddress
import random
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

DeviceModel = Literal["ZKBio", "Suprema", "Hikvision"]
EventType = Literal["ENTRADA", "SALIDA"]
VerificationStatus = Literal["VERIFIED", "FAILED"]


class SimulationRequest(BaseModel):
    dni: str | None = Field(default=None, pattern=r"^\d{7,8}$")
    ip_dispositivo: str = "192.168.1.105"
    marca_tiempo: datetime | None = None
    tipo_evento: EventType | None = None
    estado_verificacion: VerificationStatus | None = None
    dispositivo_modelo: DeviceModel = "ZKBio"

    @field_validator("ip_dispositivo")
    @classmethod
    def require_local_ip(cls, value: str) -> str:
        try:
            address = ipaddress.ip_address(value)
        except ValueError as exc:
            raise ValueError("ip_dispositivo debe ser una IP local válida.") from exc
        if not (address.is_private or address.is_loopback or address.is_link_local):
            raise ValueError("ip_dispositivo debe pertenecer a una red local.")
        return str(address)


def generate_frame(request: SimulationRequest, dni: str) -> dict[str, object]:
    return {
        "dni": dni,
        "ip_dispositivo": request.ip_dispositivo,
        "marca_tiempo": request.marca_tiempo or datetime.now().astimezone(),
        "tipo_evento": request.tipo_evento or random.choice(("ENTRADA", "SALIDA")),
        "estado_verificacion": request.estado_verificacion
        or random.choices(("VERIFIED", "FAILED"), weights=(9, 1), k=1)[0],
        "dispositivo_modelo": request.dispositivo_modelo,
    }
