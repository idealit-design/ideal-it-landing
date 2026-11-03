from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from models import AperturaCaja, DetalleVenta, MediosPago, ProductosPOS, Ventas
from schemas import CajaReporte, VentaCreate


ZERO = Decimal("0.00")


def caja_abierta(session: Session) -> AperturaCaja | None:
    return session.exec(
        select(AperturaCaja).where(AperturaCaja.estado == "ABIERTA")
    ).first()


def reporte_caja(session: Session, caja: AperturaCaja) -> CajaReporte:
    sales_total = session.exec(
        select(func.sum(Ventas.total)).where(Ventas.caja_id == caja.id)
    ).one()
    sales_count = session.exec(
        select(func.count(Ventas.id)).where(Ventas.caja_id == caja.id)
    ).one()
    grouped_payments = session.exec(
        select(MediosPago.medio, func.sum(MediosPago.monto))
        .join(Ventas, MediosPago.venta_id == Ventas.id)
        .where(Ventas.caja_id == caja.id)
        .group_by(MediosPago.medio)
    ).all()
    amounts = {method: amount or ZERO for method, amount in grouped_payments}
    cash = amounts.get("EFECTIVO", ZERO)

    return CajaReporte(
        caja_id=caja.id,
        fecha_apertura=caja.fecha_apertura,
        monto_inicial=caja.monto_inicial,
        ventas_total=sales_total or ZERO,
        ventas_cantidad=sales_count,
        efectivo_aplicado=cash,
        tarjeta_simulada=amounts.get("TARJETA_SIMULADA", ZERO),
        qr_simulado=amounts.get("QR_SIMULADO", ZERO),
        efectivo_esperado=caja.monto_inicial + cash,
    )


def registrar_venta(session: Session, caja: AperturaCaja, payload: VentaCreate) -> Ventas:
    product_ids = [item.producto_id for item in payload.items]
    products = {
        product.id: product
        for product in session.exec(
            select(ProductosPOS).where(ProductosPOS.id.in_(product_ids))
        ).all()
    }
    if len(products) != len(product_ids):
        raise HTTPException(status_code=404, detail="Uno o más productos no existen.")
    if any(not product.activo for product in products.values()):
        raise HTTPException(status_code=409, detail="La venta contiene productos inactivos.")

    details: list[tuple[ProductosPOS, int, Decimal, Decimal]] = []
    total = ZERO
    for item in payload.items:
        product = products[item.producto_id]
        subtotal = product.precio * item.cantidad
        details.append((product, item.cantidad, product.precio, subtotal))
        total += subtotal

    non_cash = sum(
        (payment.monto for payment in payload.pagos if payment.medio != "EFECTIVO"),
        ZERO,
    )
    cash_received = sum(
        (payment.monto for payment in payload.pagos if payment.medio == "EFECTIVO"),
        ZERO,
    )
    cash_due = total - non_cash
    if cash_due < ZERO:
        raise HTTPException(
            status_code=409,
            detail="Los medios no efectivos no pueden exceder el total de la venta.",
        )
    if cash_received < cash_due:
        raise HTTPException(status_code=409, detail="El importe recibido no cubre el total.")
    change = cash_received - cash_due

    sale = Ventas(caja_id=caja.id, total=total, vuelto=change)
    session.add(sale)
    session.flush()
    session.add_all(
        [
            DetalleVenta(
                venta_id=sale.id,
                producto_id=product.id,
                cantidad=quantity,
                precio_unitario=price,
                subtotal=subtotal,
            )
            for product, quantity, price, subtotal in details
        ]
    )
    session.add_all(
        [
            MediosPago(
                venta_id=sale.id,
                medio=payment.medio,
                monto=cash_due if payment.medio == "EFECTIVO" else payment.monto,
                monto_recibido=(
                    cash_received if payment.medio == "EFECTIVO" else payment.monto
                ),
            )
            for payment in payload.pagos
        ]
    )
    session.commit()
    session.refresh(sale)
    return sale
