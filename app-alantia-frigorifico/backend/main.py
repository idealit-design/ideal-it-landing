from contextlib import asynccontextmanager
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import TypeVar
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from database import create_database, get_db
from models import AjusteSaldo, Catalogo, Desposte, IngresoMediasRes, Proveedor, Saldo
from schemas import (
    CatalogoCreate,
    CatalogoRead,
    DesposteCreate,
    DesposteRead,
    IngresoCreate,
    IngresoRead,
    IngresoUpdate,
    ProveedorCreate,
    ProveedorRead,
    ReporteOperativo,
    SaldoAjuste,
    SaldoAjusteRead,
    SaldoRead,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database()
    yield


app = FastAPI(title="ALANTIA Frigorífico API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4205", "http://127.0.0.1:4205"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Record = TypeVar("Record")


def _commit(session: Session) -> None:
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La operación viola una restricción o referencia existente.",
        ) from error


def _require_record(record: Record | None, resource: str) -> Record:
    if record is None:
        raise HTTPException(status_code=404, detail=f"{resource} no encontrado.")
    return record


def _active_catalog_item(session: Session, catalogo_id: int) -> Catalogo:
    item = session.get(Catalogo, catalogo_id)
    if item is None or not item.activo:
        raise HTTPException(status_code=422, detail="El producto no existe o está inactivo.")
    return item


def _saldo_for(session: Session, catalogo_id: int) -> Saldo:
    saldo = session.scalar(select(Saldo).where(Saldo.catalogo_id == catalogo_id))
    if saldo is None:
        saldo = Saldo(catalogo_id=catalogo_id, cantidad_kg=Decimal("0"))
        session.add(saldo)
        session.flush()
    return saldo


def _saldo_read(saldo: Saldo) -> SaldoRead:
    return SaldoRead(
        id=saldo.id,
        catalogo_id=saldo.catalogo_id,
        producto=saldo.catalogo.nombre,
        tipo=saldo.catalogo.tipo,
        cantidad_kg=float(saldo.cantidad_kg),
        actualizado_en=saldo.actualizado_en,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mvp": "alantia-frigorifico", "version": "0.1.0"}


@app.get("/api/catalogo", response_model=list[CatalogoRead])
def list_catalogo(
    activo: bool | None = None,
    session: Session = Depends(get_db),
) -> list[Catalogo]:
    query = select(Catalogo).order_by(Catalogo.nombre)
    if activo is not None:
        query = query.where(Catalogo.activo.is_(activo))
    return list(session.scalars(query))


@app.post("/api/catalogo", response_model=CatalogoRead, status_code=201)
def create_catalogo(data: CatalogoCreate, session: Session = Depends(get_db)) -> Catalogo:
    item = Catalogo(**data.model_dump())
    session.add(item)
    _commit(session)
    session.refresh(item)
    return item


@app.get("/api/catalogo/{catalogo_id}", response_model=CatalogoRead)
def get_catalogo(catalogo_id: int, session: Session = Depends(get_db)) -> Catalogo:
    return _require_record(session.get(Catalogo, catalogo_id), "Producto")


@app.put("/api/catalogo/{catalogo_id}", response_model=CatalogoRead)
def update_catalogo(
    catalogo_id: int, data: CatalogoCreate, session: Session = Depends(get_db)
) -> Catalogo:
    item = _require_record(session.get(Catalogo, catalogo_id), "Producto")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    _commit(session)
    session.refresh(item)
    return item


@app.delete("/api/catalogo/{catalogo_id}", status_code=204)
def delete_catalogo(catalogo_id: int, session: Session = Depends(get_db)) -> Response:
    item = _require_record(session.get(Catalogo, catalogo_id), "Producto")
    session.delete(item)
    _commit(session)
    return Response(status_code=204)


@app.get("/api/proveedores", response_model=list[ProveedorRead])
def list_proveedores(
    activo: bool | None = None,
    session: Session = Depends(get_db),
) -> list[Proveedor]:
    query = select(Proveedor).order_by(Proveedor.razon_social)
    if activo is not None:
        query = query.where(Proveedor.activo.is_(activo))
    return list(session.scalars(query))


@app.post("/api/proveedores", response_model=ProveedorRead, status_code=201)
def create_proveedor(data: ProveedorCreate, session: Session = Depends(get_db)) -> Proveedor:
    proveedor = Proveedor(**data.model_dump())
    session.add(proveedor)
    _commit(session)
    session.refresh(proveedor)
    return proveedor


@app.get("/api/proveedores/{proveedor_id}", response_model=ProveedorRead)
def get_proveedor(proveedor_id: int, session: Session = Depends(get_db)) -> Proveedor:
    return _require_record(session.get(Proveedor, proveedor_id), "Proveedor")


@app.put("/api/proveedores/{proveedor_id}", response_model=ProveedorRead)
def update_proveedor(
    proveedor_id: int, data: ProveedorCreate, session: Session = Depends(get_db)
) -> Proveedor:
    proveedor = _require_record(session.get(Proveedor, proveedor_id), "Proveedor")
    for key, value in data.model_dump().items():
        setattr(proveedor, key, value)
    _commit(session)
    session.refresh(proveedor)
    return proveedor


@app.delete("/api/proveedores/{proveedor_id}", status_code=204)
def delete_proveedor(proveedor_id: int, session: Session = Depends(get_db)) -> Response:
    proveedor = _require_record(session.get(Proveedor, proveedor_id), "Proveedor")
    session.delete(proveedor)
    _commit(session)
    return Response(status_code=204)


@app.get("/api/ingresos", response_model=list[IngresoRead])
def list_ingresos(
    estado: str | None = Query(default=None, pattern="^(CAMARA|PARCIAL|DESPOSTADA)$"),
    session: Session = Depends(get_db),
) -> list[IngresoMediasRes]:
    query = (
        select(IngresoMediasRes)
        .options(joinedload(IngresoMediasRes.catalogo), joinedload(IngresoMediasRes.proveedor))
        .order_by(IngresoMediasRes.creado_en.desc(), IngresoMediasRes.id.desc())
    )
    if estado is not None:
        query = query.where(IngresoMediasRes.estado == estado)
    return list(session.scalars(query).unique())


@app.post("/api/ingresos", response_model=IngresoRead, status_code=201)
def create_ingreso(data: IngresoCreate, session: Session = Depends(get_db)) -> IngresoMediasRes:
    proveedor = session.get(Proveedor, data.proveedor_id)
    if proveedor is None or not proveedor.activo:
        raise HTTPException(status_code=422, detail="El proveedor no existe o está inactivo.")
    catalogo = _active_catalog_item(session, data.catalogo_id)
    if catalogo.tipo != "MEDIA_RES":
        raise HTTPException(status_code=422, detail="El producto seleccionado no es una media res.")

    ingreso = IngresoMediasRes(
        **data.model_dump(),
        peso_restante_kg=Decimal(str(data.peso_kg)),
        estado="CAMARA",
    )
    session.add(ingreso)
    saldo = _saldo_for(session, catalogo.id)
    saldo.cantidad_kg += Decimal(str(data.peso_kg))
    _commit(session)
    session.refresh(ingreso)
    return ingreso


@app.get("/api/ingresos/{ingreso_id}", response_model=IngresoRead)
def get_ingreso(ingreso_id: int, session: Session = Depends(get_db)) -> IngresoMediasRes:
    return _require_record(session.get(IngresoMediasRes, ingreso_id), "Ingreso")


@app.put("/api/ingresos/{ingreso_id}", response_model=IngresoRead)
def update_ingreso(
    ingreso_id: int,
    data: IngresoUpdate,
    session: Session = Depends(get_db),
) -> IngresoMediasRes:
    ingreso = _require_record(session.get(IngresoMediasRes, ingreso_id), "Ingreso")
    if ingreso.despostes:
        raise HTTPException(
            status_code=409, detail="Un ingreso con desposte no se puede modificar."
        )
    proveedor = session.get(Proveedor, data.proveedor_id)
    if proveedor is None or not proveedor.activo:
        raise HTTPException(status_code=422, detail="El proveedor no existe o está inactivo.")
    catalogo = _active_catalog_item(session, data.catalogo_id)
    if catalogo.tipo != "MEDIA_RES":
        raise HTTPException(status_code=422, detail="El producto seleccionado no es una media res.")

    saldo_anterior = _saldo_for(session, ingreso.catalogo_id)
    peso_anterior = Decimal(ingreso.peso_restante_kg)
    if saldo_anterior.cantidad_kg < peso_anterior:
        raise HTTPException(status_code=409, detail="El saldo no permite modificar este ingreso.")
    saldo_anterior.cantidad_kg -= peso_anterior
    _saldo_for(session, catalogo.id).cantidad_kg += Decimal(str(data.peso_kg))

    for key, value in data.model_dump().items():
        setattr(ingreso, key, value)
    ingreso.peso_restante_kg = Decimal(str(data.peso_kg))
    ingreso.estado = "CAMARA"
    _commit(session)
    session.refresh(ingreso)
    return ingreso


@app.delete("/api/ingresos/{ingreso_id}", status_code=204)
def delete_ingreso(ingreso_id: int, session: Session = Depends(get_db)) -> Response:
    ingreso = _require_record(session.get(IngresoMediasRes, ingreso_id), "Ingreso")
    if ingreso.despostes:
        raise HTTPException(status_code=409, detail="Un ingreso con desposte no se puede eliminar.")
    saldo = _saldo_for(session, ingreso.catalogo_id)
    peso = Decimal(ingreso.peso_restante_kg)
    if saldo.cantidad_kg < peso:
        raise HTTPException(status_code=409, detail="El saldo no permite revertir este ingreso.")
    saldo.cantidad_kg -= peso
    session.delete(ingreso)
    _commit(session)
    return Response(status_code=204)


@app.get("/api/despostes", response_model=list[DesposteRead])
def list_despostes(
    ingreso_id: int | None = None,
    session: Session = Depends(get_db),
) -> list[Desposte]:
    query = select(Desposte).order_by(Desposte.creado_en.desc(), Desposte.id.desc())
    if ingreso_id is not None:
        query = query.where(Desposte.ingreso_id == ingreso_id)
    return list(session.scalars(query))


@app.post("/api/despostes", response_model=list[DesposteRead], status_code=201)
def create_desposte(data: DesposteCreate, session: Session = Depends(get_db)) -> list[Desposte]:
    ingreso = _require_record(
        session.scalar(
            select(IngresoMediasRes)
            .options(joinedload(IngresoMediasRes.despostes))
            .where(IngresoMediasRes.id == data.ingreso_id)
        ),
        "Ingreso",
    )
    if ingreso.estado == "DESPOSTADA":
        raise HTTPException(status_code=409, detail="La media res ya fue despostada.")
    if len({item.catalogo_id for item in data.items}) != len(data.items):
        raise HTTPException(status_code=422, detail="Cada producto debe aparecer una sola vez.")

    products: list[tuple[Catalogo, Decimal]] = []
    for item in data.items:
        catalogo = _active_catalog_item(session, item.catalogo_id)
        if catalogo.tipo == "MEDIA_RES":
            raise HTTPException(status_code=422, detail="Un resultado de desposte no puede ser media res.")
        products.append((catalogo, Decimal(str(item.peso_kg))))

    peso_total = sum((peso for _, peso in products), Decimal("0"))
    peso_restante = Decimal(ingreso.peso_restante_kg)
    if peso_total > peso_restante:
        raise HTTPException(status_code=422, detail="El peso de los cortes supera el peso disponible.")

    saldo_origen = _saldo_for(session, ingreso.catalogo_id)
    if saldo_origen.cantidad_kg < peso_total:
        raise HTTPException(status_code=409, detail="El saldo de cámara es insuficiente.")

    operacion_id = str(uuid4())
    resultados = []
    for catalogo, peso in products:
        desposte = Desposte(
            operacion_id=operacion_id,
            ingreso_id=ingreso.id,
            catalogo_id=catalogo.id,
            peso_kg=peso,
            observaciones=data.observaciones,
        )
        session.add(desposte)
        _saldo_for(session, catalogo.id).cantidad_kg += peso
        resultados.append(desposte)

    saldo_origen.cantidad_kg -= peso_total
    ingreso.peso_restante_kg = peso_restante - peso_total
    ingreso.estado = "DESPOSTADA" if ingreso.peso_restante_kg == 0 else "PARCIAL"
    _commit(session)
    for resultado in resultados:
        session.refresh(resultado)
    return resultados


@app.get("/api/saldos", response_model=list[SaldoRead])
def list_saldos(
    solo_con_stock: bool = False,
    session: Session = Depends(get_db),
) -> list[SaldoRead]:
    query = select(Saldo).options(joinedload(Saldo.catalogo)).order_by(Saldo.catalogo_id)
    if solo_con_stock:
        query = query.where(Saldo.cantidad_kg > 0)
    return [_saldo_read(saldo) for saldo in session.scalars(query).unique()]


@app.get("/api/saldos/{catalogo_id}", response_model=SaldoRead)
def get_saldo(catalogo_id: int, session: Session = Depends(get_db)) -> SaldoRead:
    saldo = session.scalar(
        select(Saldo)
        .options(joinedload(Saldo.catalogo))
        .where(Saldo.catalogo_id == catalogo_id)
    )
    if saldo is None:
        catalogo = _require_record(session.get(Catalogo, catalogo_id), "Producto")
        return SaldoRead(
            id=0,
            catalogo_id=catalogo.id,
            producto=catalogo.nombre,
            tipo=catalogo.tipo,
            cantidad_kg=0,
            actualizado_en=date.today(),
        )
    return _saldo_read(saldo)


@app.put("/api/saldos/{catalogo_id}", response_model=SaldoAjusteRead)
@app.put("/api/saldos/{catalogo_id}/ajuste", response_model=SaldoAjusteRead)
def adjust_saldo(
    catalogo_id: int,
    data: SaldoAjuste,
    session: Session = Depends(get_db),
) -> AjusteSaldo:
    _active_catalog_item(session, catalogo_id)
    saldo = _saldo_for(session, catalogo_id)
    previous = Decimal(saldo.cantidad_kg)
    target = Decimal(str(data.saldo_fisico_kg))

    carcass_stock = session.scalar(
        select(func.coalesce(func.sum(IngresoMediasRes.peso_restante_kg), 0)).where(
            IngresoMediasRes.catalogo_id == catalogo_id,
            IngresoMediasRes.estado != "DESPOSTADA",
        )
    )
    if saldo.catalogo.tipo == "MEDIA_RES" and target < Decimal(carcass_stock):
        raise HTTPException(
            status_code=409,
            detail="El ajuste no puede ser inferior al peso trazable de medias res en cámara.",
        )

    saldo.cantidad_kg = target
    ajuste = AjusteSaldo(
        catalogo_id=catalogo_id,
        saldo_anterior_kg=previous,
        saldo_fisico_kg=target,
        motivo=data.motivo,
    )
    session.add(ajuste)
    _commit(session)
    session.refresh(ajuste)
    return ajuste


@app.delete("/api/saldos/{catalogo_id}", status_code=204)
def delete_zero_saldo(catalogo_id: int, session: Session = Depends(get_db)) -> Response:
    saldo = session.scalar(select(Saldo).where(Saldo.catalogo_id == catalogo_id))
    if saldo is None:
        raise HTTPException(status_code=404, detail="Saldo no encontrado.")
    if saldo.cantidad_kg != 0:
        raise HTTPException(
            status_code=409,
            detail="El saldo solo se puede eliminar después de registrar un conteo físico en cero.",
        )
    session.delete(saldo)
    _commit(session)
    return Response(status_code=204)


@app.get("/api/saldos/{catalogo_id}/ajustes", response_model=list[SaldoAjusteRead])
def list_saldo_adjustments(
    catalogo_id: int,
    session: Session = Depends(get_db),
) -> list[AjusteSaldo]:
    _require_record(session.get(Catalogo, catalogo_id), "Producto")
    return list(
        session.scalars(
            select(AjusteSaldo)
            .where(AjusteSaldo.catalogo_id == catalogo_id)
            .order_by(AjusteSaldo.creado_en.desc(), AjusteSaldo.id.desc())
        )
    )


@app.get("/api/reportes/operativo", response_model=ReporteOperativo)
def report_operativo(
    desde: date | None = None,
    hasta: date | None = None,
    session: Session = Depends(get_db),
) -> ReporteOperativo:
    if desde and hasta and desde > hasta:
        raise HTTPException(status_code=422, detail="'desde' no puede ser posterior a 'hasta'.")
    ingreso_query = select(IngresoMediasRes)
    desposte_query = select(Desposte)
    if desde is not None:
        ingreso_query = ingreso_query.where(IngresoMediasRes.fecha_faena >= desde)
        desposte_query = desposte_query.where(func.date(Desposte.creado_en) >= desde.isoformat())
    if hasta is not None:
        ingreso_query = ingreso_query.where(IngresoMediasRes.fecha_faena <= hasta)
        desposte_query = desposte_query.where(func.date(Desposte.creado_en) <= hasta.isoformat())

    ingresos = list(session.scalars(ingreso_query))
    despostes = list(session.scalars(desposte_query))
    saldos = list(
        session.scalars(
            select(Saldo)
            .join(Saldo.catalogo)
            .options(joinedload(Saldo.catalogo))
            .where(Catalogo.activo.is_(True))
            .order_by(Catalogo.nombre)
        ).unique()
    )
    return ReporteOperativo(
        desde=desde,
        hasta=hasta,
        productos_activos=session.scalar(
            select(func.count()).select_from(Catalogo).where(Catalogo.activo.is_(True))
        )
        or 0,
        ingresos_registrados=len(ingresos),
        kg_ingresados=sum((Decimal(row.peso_kg) for row in ingresos), Decimal("0")),
        kg_despostados=sum((Decimal(row.peso_kg) for row in despostes), Decimal("0")),
        stock_total_kg=sum((Decimal(saldo.cantidad_kg) for saldo in saldos), Decimal("0")),
        stock_por_producto=[_saldo_read(saldo) for saldo in saldos],
    )


frontend_dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
