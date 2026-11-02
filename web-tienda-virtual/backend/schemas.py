from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CategoriaCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=80)
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    descripcion: str = Field(default="", max_length=240)


class CategoriaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=80)
    slug: str | None = Field(
        default=None, min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    )
    descripcion: str | None = Field(default=None, max_length=240)


class CategoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    slug: str
    descripcion: str


class ProductoCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    descripcion: str = Field(default="", max_length=2000)
    precio: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    stock: int = Field(ge=0, le=1_000_000)
    categoria_id: int = Field(gt=0)


class ProductoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    precio: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    stock: int | None = Field(default=None, ge=0, le=1_000_000)
    categoria_id: int | None = Field(default=None, gt=0)


class ProductoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str
    precio: Decimal
    stock: int
    categoria_id: int
    categoria: CategoriaOut


class CartItemInput(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(gt=0, le=1_000_000)


class CartQuantityUpdate(BaseModel):
    cantidad: int = Field(gt=0, le=1_000_000)


class CartItemOut(BaseModel):
    producto: ProductoOut
    cantidad: int
    subtotal: Decimal


class CartOut(BaseModel):
    items: list[CartItemOut]
    total: Decimal


class CheckoutInput(BaseModel):
    cliente_nombre: str = Field(min_length=2, max_length=120)
    cliente_email: EmailStr


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    nombre_producto: str
    cantidad: int
    precio_unitario: Decimal


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str
    cliente_nombre: str
    cliente_email: EmailStr
    total: Decimal
    estado: str
    estado_pago: str
    fecha_creacion: datetime
    items: list[OrderItemOut]
