from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from database import create_database, get_session
from models import AperturaCaja, DetalleVenta, MediosPago, ProductosPOS, Ventas
from schemas import (
    CajaAperturaCreate,
    CajaCierreCreate,
    CajaCierreRead,
    CajaRead,
    CajaReporte,
    DetalleVentaRead,
    MedioPagoRead,
    ProductoRead,
    VentaCreate,
    VentaRead,
)
from services import caja_abierta, registrar_venta, reporte_caja


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database()
    yield


app = FastAPI(title="Web POS Comercial", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:4204", "http://localhost:4204"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mvp": "web-pos-comercial", "version": "0.1.0"}


@app.get("/api/productos", response_model=list[ProductoRead])
def listar_productos(session: Session = Depends(get_session)) -> list[ProductosPOS]:
    return session.exec(
        select(ProductosPOS)
        .where(ProductosPOS.activo.is_(True))
        .order_by(ProductosPOS.categoria, ProductosPOS.nombre)
    ).all()


@app.get("/api/caja/actual", response_model=CajaRead | None)
def obtener_caja_actual(session: Session = Depends(get_session)) -> AperturaCaja | None:
    return caja_abierta(session)


@app.post("/api/caja/aperturas", response_model=CajaRead, status_code=201)
def abrir_caja(
    payload: CajaAperturaCreate,
    session: Session = Depends(get_session),
) -> AperturaCaja:
    if caja_abierta(session):
        raise HTTPException(status_code=409, detail="Ya existe una caja abierta.")
    caja = AperturaCaja(monto_inicial=payload.monto_inicial, estado="ABIERTA")
    session.add(caja)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(status_code=409, detail="Ya existe una caja abierta.") from error
    session.refresh(caja)
    return caja


@app.get("/api/caja/actual/reporte", response_model=CajaReporte)
def obtener_reporte_caja(session: Session = Depends(get_session)) -> CajaReporte:
    caja = caja_abierta(session)
    if caja is None:
        raise HTTPException(status_code=409, detail="No hay una caja abierta.")
    return reporte_caja(session, caja)


@app.post("/api/caja/cierre", response_model=CajaCierreRead)
def cerrar_caja(
    payload: CajaCierreCreate,
    session: Session = Depends(get_session),
) -> CajaCierreRead:
    caja = caja_abierta(session)
    if caja is None:
        raise HTTPException(status_code=409, detail="No hay una caja abierta.")
    report = reporte_caja(session, caja)
    closed_at = datetime.now(timezone.utc)
    caja.fecha_cierre = closed_at
    caja.monto_cierre_declarado = payload.monto_cierre_declarado
    caja.estado = "CERRADA"
    session.add(caja)
    session.commit()
    return CajaCierreRead(
        **report.model_dump(),
        fecha_cierre=closed_at,
        monto_cierre_declarado=payload.monto_cierre_declarado,
        diferencia=payload.monto_cierre_declarado - report.efectivo_esperado,
    )


@app.post("/api/ventas", response_model=VentaRead, status_code=201)
def crear_venta(payload: VentaCreate, session: Session = Depends(get_session)) -> VentaRead:
    caja = caja_abierta(session)
    if caja is None:
        raise HTTPException(status_code=409, detail="Debe abrir la caja antes de vender.")
    sale = registrar_venta(session, caja, payload)
    details = session.exec(
        select(DetalleVenta).where(DetalleVenta.venta_id == sale.id)
    ).all()
    payments = session.exec(
        select(MediosPago).where(MediosPago.venta_id == sale.id)
    ).all()
    products = {
        product.id: product.nombre
        for product in session.exec(
            select(ProductosPOS).where(
                ProductosPOS.id.in_([detail.producto_id for detail in details])
            )
        ).all()
    }
    return VentaRead(
        id=sale.id,
        caja_id=sale.caja_id,
        fecha=sale.fecha,
        total=sale.total,
        vuelto=sale.vuelto,
        detalles=[
            DetalleVentaRead(
                id=detail.id,
                producto_id=detail.producto_id,
                nombre_producto=products[detail.producto_id],
                cantidad=detail.cantidad,
                precio_unitario=detail.precio_unitario,
                subtotal=detail.subtotal,
            )
            for detail in details
        ],
        medios_pago=[MedioPagoRead.model_validate(payment) for payment in payments],
    )


@app.get("/api/ventas", response_model=list[VentaRead])
def listar_ventas(
    caja_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=50, ge=1, le=200),
    session: Session = Depends(get_session),
) -> list[VentaRead]:
    statement = select(Ventas).order_by(Ventas.id.desc()).limit(limit)
    if caja_id is not None:
        statement = statement.where(Ventas.caja_id == caja_id)
    sales = session.exec(statement).all()
    output = []
    for sale in sales:
        details = session.exec(
            select(DetalleVenta).where(DetalleVenta.venta_id == sale.id)
        ).all()
        payments = session.exec(
            select(MediosPago).where(MediosPago.venta_id == sale.id)
        ).all()
        products = {
            product.id: product.nombre
            for product in session.exec(
                select(ProductosPOS).where(
                    ProductosPOS.id.in_([detail.producto_id for detail in details])
                )
            ).all()
        }
        output.append(
            VentaRead(
                id=sale.id,
                caja_id=sale.caja_id,
                fecha=sale.fecha,
                total=sale.total,
                vuelto=sale.vuelto,
                detalles=[
                    DetalleVentaRead(
                        id=detail.id,
                        producto_id=detail.producto_id,
                        nombre_producto=products[detail.producto_id],
                        cantidad=detail.cantidad,
                        precio_unitario=detail.precio_unitario,
                        subtotal=detail.subtotal,
                    )
                    for detail in details
                ],
                medios_pago=[MedioPagoRead.model_validate(payment) for payment in payments],
            )
        )
    return output
