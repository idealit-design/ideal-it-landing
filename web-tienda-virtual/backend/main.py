from collections import defaultdict
from contextlib import asynccontextmanager
from decimal import Decimal
from threading import RLock
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from database import create_database, get_db_session
from models import Categoria, ItemsOrden, Orden, Producto
from schemas import (
    CartItemInput,
    CartOut,
    CartQuantityUpdate,
    CheckoutInput,
    CategoriaCreate,
    CategoriaOut,
    CategoriaUpdate,
    OrderOut,
    ProductoCreate,
    ProductoOut,
    ProductoUpdate,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database()
    yield


app = FastAPI(title="Tienda Virtual Ideal-IT", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4206",
        "http://127.0.0.1:4206",
    ],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-Cart-ID"],
)

_carts: dict[str, dict[int, int]] = defaultdict(dict)
_cart_lock = RLock()


def _cart_id(x_cart_id: str = Header(alias="X-Cart-ID", min_length=8, max_length=64)) -> str:
    return x_cart_id


def _product_or_404(session: Session, product_id: int) -> Producto:
    product = session.scalar(
        select(Producto)
        .options(joinedload(Producto.categoria))
        .where(Producto.id == product_id)
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


def _cart_response(session: Session, cart_id: str) -> CartOut:
    lines = []
    total = Decimal("0.00")
    for product_id, quantity in sorted(_carts[cart_id].items()):
        product = _product_or_404(session, product_id)
        if quantity > product.stock:
            raise HTTPException(
                status_code=409,
                detail=f"Stock insuficiente para {product.nombre}; disponible: {product.stock}",
            )
        subtotal = product.precio * quantity
        total += subtotal
        lines.append(
            {
                "producto": product,
                "cantidad": quantity,
                "subtotal": subtotal,
            }
        )
    return CartOut(items=lines, total=total)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mvp": "web-tienda-virtual", "version": "0.1.0"}


@app.get("/api/categorias", response_model=list[CategoriaOut])
def list_categories(session: Session = Depends(get_db_session)):
    return session.scalars(select(Categoria).order_by(Categoria.nombre)).all()


@app.post(
    "/api/categorias",
    response_model=CategoriaOut,
    status_code=status.HTTP_201_CREATED,
)
def create_category(payload: CategoriaCreate, session: Session = Depends(get_db_session)):
    category = Categoria(**payload.model_dump())
    session.add(category)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=409, detail="Ya existe una categoría con ese nombre o slug"
        ) from error
    session.refresh(category)
    return category


@app.patch("/api/categorias/{category_id}", response_model=CategoriaOut)
def update_category(
    category_id: int,
    payload: CategoriaUpdate,
    session: Session = Depends(get_db_session),
):
    category = session.get(Categoria, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(category, key, value)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=409, detail="La categoría ya existe o tiene productos asociados"
        ) from error
    session.refresh(category)
    return category


@app.delete("/api/categorias/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, session: Session = Depends(get_db_session)):
    category = session.get(Categoria, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    session.delete(category)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=409, detail="No se puede eliminar una categoría con productos"
        ) from error


@app.get("/api/productos", response_model=list[ProductoOut])
def list_products(
    categoria_id: int | None = Query(default=None, gt=0),
    q: str | None = Query(default=None, min_length=1, max_length=120),
    session: Session = Depends(get_db_session),
):
    query = select(Producto).options(joinedload(Producto.categoria))
    if categoria_id is not None:
        query = query.where(Producto.categoria_id == categoria_id)
    if q is not None:
        query = query.where(Producto.nombre.ilike(f"%{q.strip()}%"))
    return session.scalars(query.order_by(Producto.id)).all()


@app.get("/api/productos/{product_id}", response_model=ProductoOut)
def get_product(product_id: int, session: Session = Depends(get_db_session)):
    return _product_or_404(session, product_id)


@app.post("/api/productos", response_model=ProductoOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductoCreate, session: Session = Depends(get_db_session)):
    if session.get(Categoria, payload.categoria_id) is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    product = Producto(**payload.model_dump())
    session.add(product)
    session.commit()
    session.refresh(product)
    return _product_or_404(session, product.id)


@app.patch("/api/productos/{product_id}", response_model=ProductoOut)
def update_product(
    product_id: int,
    payload: ProductoUpdate,
    session: Session = Depends(get_db_session),
):
    product = session.get(Producto, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    changes = payload.model_dump(exclude_unset=True)
    category_id = changes.get("categoria_id")
    if category_id is not None and session.get(Categoria, category_id) is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for key, value in changes.items():
        if value is not None:
            setattr(product, key, value)
    session.commit()
    return _product_or_404(session, product_id)


@app.delete("/api/productos/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, session: Session = Depends(get_db_session)):
    product = session.get(Producto, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    session.delete(product)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=409, detail="No se puede eliminar un producto incluido en una orden"
        ) from error
    with _cart_lock:
        for cart in _carts.values():
            cart.pop(product_id, None)


@app.get("/api/carrito", response_model=CartOut)
def get_cart(
    cart_id: str = Depends(_cart_id),
    session: Session = Depends(get_db_session),
):
    with _cart_lock:
        return _cart_response(session, cart_id)


@app.post("/api/carrito/items", response_model=CartOut)
def add_cart_item(
    payload: CartItemInput,
    cart_id: str = Depends(_cart_id),
    session: Session = Depends(get_db_session),
):
    with _cart_lock:
        product = _product_or_404(session, payload.producto_id)
        new_quantity = _carts[cart_id].get(payload.producto_id, 0) + payload.cantidad
        if new_quantity > product.stock:
            raise HTTPException(
                status_code=409,
                detail=f"Stock insuficiente para {product.nombre}; disponible: {product.stock}",
            )
        _carts[cart_id][payload.producto_id] = new_quantity
        return _cart_response(session, cart_id)


@app.patch("/api/carrito/items/{product_id}", response_model=CartOut)
def update_cart_item(
    product_id: int,
    payload: CartQuantityUpdate,
    cart_id: str = Depends(_cart_id),
    session: Session = Depends(get_db_session),
):
    with _cart_lock:
        if product_id not in _carts[cart_id]:
            raise HTTPException(status_code=404, detail="El producto no está en el carrito")
        product = _product_or_404(session, product_id)
        if payload.cantidad > product.stock:
            raise HTTPException(
                status_code=409,
                detail=f"Stock insuficiente para {product.nombre}; disponible: {product.stock}",
            )
        _carts[cart_id][product_id] = payload.cantidad
        return _cart_response(session, cart_id)


@app.delete("/api/carrito/items/{product_id}", response_model=CartOut)
def remove_cart_item(
    product_id: int,
    cart_id: str = Depends(_cart_id),
    session: Session = Depends(get_db_session),
):
    with _cart_lock:
        if product_id not in _carts[cart_id]:
            raise HTTPException(status_code=404, detail="El producto no está en el carrito")
        del _carts[cart_id][product_id]
        return _cart_response(session, cart_id)


@app.delete("/api/carrito", response_model=CartOut)
def clear_cart(
    cart_id: str = Depends(_cart_id),
    session: Session = Depends(get_db_session),
):
    with _cart_lock:
        _carts.pop(cart_id, None)
        return _cart_response(session, cart_id)


@app.post("/api/checkout", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutInput,
    cart_id: str = Depends(_cart_id),
    session: Session = Depends(get_db_session),
):
    with _cart_lock:
        cart = _carts[cart_id]
        if not cart:
            raise HTTPException(status_code=400, detail="El carrito está vacío")

        products: list[tuple[Producto, int]] = []
        total = Decimal("0.00")
        for product_id, quantity in sorted(cart.items()):
            product = _product_or_404(session, product_id)
            if quantity > product.stock:
                raise HTTPException(
                    status_code=409,
                    detail=f"Stock insuficiente para {product.nombre}; disponible: {product.stock}",
                )
            products.append((product, quantity))
            total += product.precio * quantity

        order = Orden(
            numero=f"TV-{uuid4().hex[:12].upper()}",
            cliente_nombre=payload.cliente_nombre,
            cliente_email=str(payload.cliente_email),
            total=total,
            estado="confirmada_demo",
            estado_pago="simulado_aprobado",
        )
        for product, quantity in products:
            product.stock -= quantity
            order.items.append(
                ItemsOrden(
                    producto_id=product.id,
                    nombre_producto=product.nombre,
                    cantidad=quantity,
                    precio_unitario=product.precio,
                )
            )
        session.add(order)
        try:
            session.commit()
        except IntegrityError as error:
            session.rollback()
            raise HTTPException(
                status_code=409, detail="No se pudo confirmar la orden por un conflicto de datos"
            ) from error
        session.refresh(order)
        _carts.pop(cart_id, None)
        return order


@app.get("/api/ordenes/{order_id}", response_model=OrderOut)
def get_order(order_id: int, session: Session = Depends(get_db_session)):
    order = session.scalar(
        select(Orden).options(selectinload(Orden.items)).where(Orden.id == order_id)
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return order
