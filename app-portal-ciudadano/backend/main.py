from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import create_database, get_db
from models import (
    Ciudadano,
    Estado,
    HistorialEstado,
    Reclamo,
    Tramite,
    TipoTramite,
    Turno,
)
from schemas import (
    EstadoUpdate,
    EstadoHistorialResponse,
    ReclamoCreate,
    ReclamoResponse,
    SeguimientoResponse,
    SolicitudResponse,
    TramiteCreate,
    TipoTramiteCreate,
    TipoTramiteResponse,
    TurnoCreate,
    TurnoResponse,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_database()
    yield


app = FastAPI(
    title="Portal Ciudadano",
    description="API local para trámites, reclamos, seguimiento y turnos.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)


def _codigo(prefijo: str) -> str:
    return f"{prefijo}-{uuid4().hex[:12].upper()}"


def _ciudadano(session: Session, documento: str, nombre: str) -> Ciudadano:
    ciudadano = session.scalar(
        select(Ciudadano).where(Ciudadano.documento == documento)
    )
    if ciudadano is None:
        ciudadano = Ciudadano(documento=documento, nombre=nombre)
        session.add(ciudadano)
        session.flush()
    else:
        ciudadano.nombre = nombre
    return ciudadano


def _estado_recibido(session: Session) -> Estado:
    estado = session.scalar(select(Estado).where(Estado.nombre == "Recibido"))
    if estado is None:
        raise HTTPException(status_code=503, detail="No hay estados iniciales configurados.")
    return estado


def _tipo_tramite(session: Session, payload: TramiteCreate) -> TipoTramite:
    if payload.tipo_id is not None:
        tipo = session.get(TipoTramite, payload.tipo_id)
        if tipo is None or not tipo.activo:
            raise HTTPException(status_code=404, detail="El tipo de trámite no está disponible.")
        return tipo

    tipo = session.scalar(select(TipoTramite).where(TipoTramite.nombre == payload.tipo))
    if tipo is None:
        tipo = TipoTramite(nombre=payload.tipo or "")
        session.add(tipo)
        session.flush()
    return tipo


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "subsystem": "portal-ciudadano", "version": "0.1.0"}


@app.get("/api/tipos-tramite", response_model=list[TipoTramiteResponse])
def listar_tipos_tramite(
    session: Session = Depends(get_db),
) -> list[TipoTramiteResponse]:
    records = session.scalars(
        select(TipoTramite)
        .where(TipoTramite.activo.is_(True))
        .order_by(TipoTramite.nombre)
    ).all()
    return [
        TipoTramiteResponse(
            id=item.id, nombre=item.nombre, descripcion=item.descripcion
        )
        for item in records
    ]


@app.post("/api/tipos-tramite", response_model=TipoTramiteResponse, status_code=201)
def crear_tipo_tramite(
    payload: TipoTramiteCreate,
    session: Session = Depends(get_db),
) -> TipoTramiteResponse:
    existing = session.scalar(
        select(TipoTramite).where(TipoTramite.nombre == payload.nombre)
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Ya existe un tipo de trámite con ese nombre.")

    tipo = TipoTramite(
        nombre=payload.nombre,
        descripcion=payload.descripcion.strip(),
    )
    session.add(tipo)
    session.commit()
    return TipoTramiteResponse(
        id=tipo.id,
        nombre=tipo.nombre,
        descripcion=tipo.descripcion,
    )


@app.post("/api/reclamos", response_model=ReclamoResponse, status_code=201)
def crear_reclamo(
    payload: ReclamoCreate, session: Session = Depends(get_db)
) -> ReclamoResponse:
    ciudadano = _ciudadano(session, payload.documento, payload.nombre)
    estado = _estado_recibido(session)
    reclamo = Reclamo(
        codigo=_codigo("REC"),
        asunto=payload.asunto,
        descripcion=payload.descripcion,
        ubicacion=payload.ubicacion,
        ciudadano=ciudadano,
        estado=estado,
    )
    session.add(reclamo)
    session.flush()
    session.add(
        HistorialEstado(
            reclamo_id=reclamo.id,
            estado=estado,
            observacion="Reclamo ingresado por el Portal Ciudadano.",
        )
    )
    session.commit()
    return ReclamoResponse(
        codigo=reclamo.codigo,
        asunto=reclamo.asunto,
        descripcion=reclamo.descripcion,
        ubicacion=reclamo.ubicacion,
        estado=estado.nombre,
        creado_en=reclamo.creado_en,
    )


@app.post("/api/tramites", response_model=SolicitudResponse, status_code=201)
def crear_tramite(
    payload: TramiteCreate, session: Session = Depends(get_db)
) -> SolicitudResponse:
    ciudadano = _ciudadano(session, payload.documento, payload.nombre)
    estado = _estado_recibido(session)
    tipo = _tipo_tramite(session, payload)
    tramite = Tramite(
        codigo=_codigo("TRA"),
        tipo_tramite=tipo,
        descripcion=payload.descripcion,
        ciudadano=ciudadano,
        estado=estado,
    )
    session.add(tramite)
    session.flush()
    session.add(
        HistorialEstado(
            tramite_id=tramite.id,
            estado=estado,
            observacion="Trámite iniciado desde el Portal Ciudadano.",
        )
    )
    session.commit()
    return SolicitudResponse(
        codigo=tramite.codigo,
        tipo=tipo.nombre,
        descripcion=tramite.descripcion,
        estado=estado.nombre,
        creado_en=tramite.creado_en,
    )


@app.get("/api/seguimiento/{codigo}", response_model=SeguimientoResponse)
def consultar_seguimiento(
    codigo: str, session: Session = Depends(get_db)
) -> SeguimientoResponse:
    tramite = session.scalar(select(Tramite).where(Tramite.codigo == codigo.upper()))
    reclamo = session.scalar(select(Reclamo).where(Reclamo.codigo == codigo.upper()))
    recurso: Tramite | Reclamo | None = tramite or reclamo
    if recurso is None:
        raise HTTPException(status_code=404, detail="No se encontró un trámite o reclamo con ese código.")

    es_tramite = isinstance(recurso, Tramite)
    historial_query = select(HistorialEstado).where(
        HistorialEstado.tramite_id == recurso.id
        if es_tramite
        else HistorialEstado.reclamo_id == recurso.id
    ).order_by(HistorialEstado.actualizado_en, HistorialEstado.id)
    historial = session.scalars(historial_query).all()
    estado_actual = recurso.estado.nombre
    return SeguimientoResponse(
        codigo=recurso.codigo,
        recurso="Trámite" if es_tramite else "Reclamo",
        titulo=recurso.tipo_tramite.nombre if es_tramite else recurso.asunto,
        descripcion=recurso.descripcion,
        estado_actual=estado_actual,
        creado_en=recurso.creado_en,
        historial=[
            EstadoHistorialResponse(
                estado=item.estado.nombre,
                descripcion=item.estado.descripcion,
                actualizado_en=item.actualizado_en,
                observacion=item.observacion,
            )
            for item in historial
        ],
    )


@app.patch("/api/seguimiento/{codigo}/estado", response_model=SeguimientoResponse)
def actualizar_estado(
        codigo: str,
        payload: EstadoUpdate,
        session: Session = Depends(get_db),
) -> SeguimientoResponse:
        normalized_code = codigo.upper()
        tramite = session.scalar(select(Tramite).where(Tramite.codigo == normalized_code))
        reclamo = session.scalar(select(Reclamo).where(Reclamo.codigo == normalized_code))
        recurso: Tramite | Reclamo | None = tramite or reclamo
        if recurso is None:
            raise HTTPException(status_code=404, detail="No se encontró un trámite o reclamo con ese código.")
        estado = session.scalar(select(Estado).where(Estado.nombre == payload.estado))
        if estado is None:
            raise HTTPException(status_code=404, detail="El estado indicado no existe.")

        es_tramite = isinstance(recurso, Tramite)
        recurso.estado = estado
        session.add(
            HistorialEstado(
                tramite_id=recurso.id if es_tramite else None,
                reclamo_id=None if es_tramite else recurso.id,
                estado=estado,
                observacion=payload.observacion,
            )
        )
        session.commit()
        return consultar_seguimiento(normalized_code, session)


@app.get("/api/tramites", response_model=list[SolicitudResponse])
def listar_tramites(
    documento: str = Query(min_length=7, max_length=11),
    session: Session = Depends(get_db),
) -> list[SolicitudResponse]:
    records = session.scalars(
        select(Tramite)
        .join(Ciudadano)
        .where(Ciudadano.documento == documento)
        .order_by(Tramite.creado_en.desc())
    ).all()
    return [
        SolicitudResponse(
            codigo=item.codigo,
            tipo=item.tipo_tramite.nombre,
            descripcion=item.descripcion,
            estado=item.estado.nombre,
            creado_en=item.creado_en,
        )
        for item in records
    ]


@app.get("/api/reclamos", response_model=list[ReclamoResponse])
def listar_reclamos(
    documento: str = Query(min_length=7, max_length=11),
    session: Session = Depends(get_db),
) -> list[ReclamoResponse]:
    records = session.scalars(
        select(Reclamo)
        .join(Ciudadano)
        .where(Ciudadano.documento == documento)
        .order_by(Reclamo.creado_en.desc())
    ).all()
    return [
        ReclamoResponse(
            codigo=item.codigo,
            asunto=item.asunto,
            descripcion=item.descripcion,
            ubicacion=item.ubicacion,
            estado=item.estado.nombre,
            creado_en=item.creado_en,
        )
        for item in records
    ]


@app.post("/api/turnos", response_model=TurnoResponse, status_code=201)
def reservar_turno(
    payload: TurnoCreate, session: Session = Depends(get_db)
) -> TurnoResponse:
    ciudadano = _ciudadano(session, payload.documento, payload.nombre)
    turno = Turno(
        codigo=_codigo("TUR"),
        motivo=payload.motivo,
        fecha_hora=payload.fecha_hora,
        sede=payload.sede,
        ciudadano=ciudadano,
    )
    session.add(turno)
    session.commit()
    return TurnoResponse(
        codigo=turno.codigo,
        motivo=turno.motivo,
        fecha_hora=turno.fecha_hora,
        sede=turno.sede,
        ciudadano_documento=ciudadano.documento,
    )


@app.get("/api/turnos", response_model=list[TurnoResponse])
def listar_turnos(
    documento: str = Query(min_length=7, max_length=11),
    session: Session = Depends(get_db),
) -> list[TurnoResponse]:
    records = session.scalars(
        select(Turno)
        .join(Ciudadano)
        .where(Ciudadano.documento == documento)
        .order_by(Turno.fecha_hora)
    ).all()
    return [
        TurnoResponse(
            codigo=item.codigo,
            motivo=item.motivo,
            fecha_hora=item.fecha_hora,
            sede=item.sede,
            ciudadano_documento=item.ciudadano.documento,
        )
        for item in records
    ]
