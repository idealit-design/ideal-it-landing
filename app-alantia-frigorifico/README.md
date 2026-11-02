# ALANTIA Frigorífico — 0.1.0

Subsistema local e independiente para registrar proveedores y catálogo, recibir medias res, seguir el desposte y consultar/ajustar saldos. La estructura es una base operativa inicial: no reutiliza la API, los datos, los servicios de identidad ni las bases de los antecedentes históricos.

## Stack y puertos

- **API:** FastAPI + SQLAlchemy + SQLite, `http://127.0.0.1:8008`.
- **Interfaz:** React + TypeScript + Vite, `http://127.0.0.1:4205`.
- **Base exclusiva:** `backend/data/db/frigorifico_mvp.db`, creada en el primer inicio de la API.
- **Versión:** `0.1.0`.

La interfaz solo consulta la API local de este módulo. La API limita CORS a los dos hostnames locales del frontend. No se conecta a servicios externos ni a los sistemas históricos del portfolio.

## Inicio local en Windows

### Backend

```powershell
cd app-alantia-frigorifico\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8008
```

La documentación interactiva queda disponible en `http://127.0.0.1:8008/docs`.

### Frontend

En otra terminal, desde la raíz del módulo:

```powershell
cd app-alantia-frigorifico\frontend
npm install
npm run start
```

Abrir `http://127.0.0.1:4205`. Para registrar ingresos primero se necesita cargar al menos un proveedor y un producto tipo `MEDIA_RES`, desde **Catálogo y proveedores**.

### Pruebas

```powershell
cd app-alantia-frigorifico\backend
python -m pytest
```

La prueba establece `FRIGORIFICO_DATABASE_PATH` a una ruta temporal. No crea ni altera la base local de desarrollo.

## Flujos disponibles

1. Alta/listado/edición/baja de catálogo y proveedores.
2. Alta y consulta de ingreso de media res; cada ingreso comienza en `CAMARA` y suma kilogramos al saldo de cámara.
3. Registro de desposte por producto y peso. Se permite desposte parcial; cada operación conserva la referencia al ingreso de origen, resta cámara y suma stock de los cortes en una transacción.
4. Consulta de saldos y ajustes a conteo físico con motivo y registro de auditoría.
5. Reporte operativo con cantidades ingresadas, procesadas y stock por producto.

Los ingresos con desposte no se pueden borrar. Los productos/proveedores referenciados no se pueden borrar por la restricción referencial. Los registros de desposte son inmutables para conservar trazabilidad.

## API local

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/health` | Estado y versión. |
| `GET`, `POST` | `/api/catalogo` | Consulta y alta de productos. |
| `GET`, `PUT`, `DELETE` | `/api/catalogo/{id}` | Consulta, reemplazo y baja con integridad referencial. |
| `GET`, `POST` | `/api/proveedores` | Consulta y alta de proveedores. |
| `GET`, `PUT`, `DELETE` | `/api/proveedores/{id}` | Consulta, reemplazo y baja con integridad referencial. |
| `GET`, `POST` | `/api/ingresos` | Trazabilidad de ingresos y registro de media res. |
| `GET`, `PUT`, `DELETE` | `/api/ingresos/{id}` | Consulta, corrección previa al desposte y reversión de ingreso no procesado. |
| `GET`, `POST` | `/api/despostes` | Consulta por ingreso y registro de cortes obtenidos. |
| `GET` | `/api/saldos` | Consulta de existencias (`?solo_con_stock=true`). |
| `GET`, `PUT`, `DELETE` | `/api/saldos/{catalogo_id}` | Consulta, ajuste físico auditado y baja solo cuando el saldo quedó en cero. |
| `GET` | `/api/saldos/{catalogo_id}/ajustes` | Historial de conteos físicos con motivo. |
| `GET` | `/api/reportes/operativo` | Reporte; admite `desde` y `hasta` (`YYYY-MM-DD`). |

Los pesos se expresan en kg. `FRIGORIFICO_DATABASE_PATH` solo acepta rutas dentro del módulo o del directorio temporal de pruebas, para evitar apuntar accidentalmente a la base de otro subsistema. En operación normal se usa exclusivamente la SQLite incluida en este módulo.

## Documentación

- [Especificación de arquitectura modular](docs/ARCHITECTURE.md).
- [Fuentes y límites documentales](../md/references/referencias-historicas.md).

Este MVP no incluye autenticación, permisos de roles, sucursales, cálculo de rindes, ingresos directos, transferencias, conteos formales ni migraciones de esquema. El Compose incluido es una demo privada y no reemplaza el diseño de controles requerido para un entorno productivo.

## Despliegue en Docker

El Compose de este módulo ejecuta la API y la interfaz compilada en un único contenedor, limitado a 128 MiB. El servicio publica únicamente `127.0.0.1:8012`, se conecta a la red Docker externa `idealit-internal` y a una bridge propia sin masquerade para el acceso del host; persiste SQLite en el volumen exclusivo `app-alantia-frigorifico-sqlite`, montado sobre `backend/data/db`. La ruta de producción es `backend/data/db/frigorifico_app.db`; no se reutilizan datos ni volúmenes de otros subsistemas.

Desde la raíz del proyecto:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --no-color
docker stats --no-stream app-alantia-frigorifico-frigorifico-1
curl -fsS http://127.0.0.1:8012/health
```

La red `idealit-internal` debe existir antes del arranque. Para detener el servicio sin eliminar los datos:

```bash
docker compose down
```

No ejecutar `docker compose down -v` salvo que se quiera borrar explícitamente la base persistente. El acceso desde otra máquina requiere un túnel SSH hacia el loopback; el puerto no se publica en interfaces externas.
