# Service Synthetic Factory `0.1.0`

Command Center standalone para datos sintéticos, validación de formatos, conversión de archivos y conectores simulados. La base SQLite y los archivos pertenecen exclusivamente a este subsistema; no lee ni escribe las bases de otros MVP.

> **Solo demostración:** todos los documentos, perfiles, matrículas, facturas, identificadores y webhooks son ficticios. No tienen validez legal, fiscal, clínica ni de acceso. El MVP no implementa autenticación: ejecutarlo únicamente en loopback; no publicarlo bajo un dominio sin incorporar autenticación y controles de despliegue.

## Requisitos

- Python 3.10 o superior.
- Node.js 20 o superior y npm.

## Inicio local en PowerShell

### API (puerto `8009`)

```powershell
cd service-synthetic-factory\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8009
```

La primera ejecución crea `backend/data/db/factory_mvp.db`; los assets se guardan en `backend/data/generated/`. La base, imágenes y PDFs locales están excluidos de Git.

### Frontend (puerto `4209`)

En otra terminal, desde la raíz del subsistema:

```powershell
cd frontend
npm install
npm run dev
```

Abre <http://127.0.0.1:4209>. Vite reenvía `/api` y `/health` a la API local. CORS solo permite `localhost:4209` y `127.0.0.1:4209`.

## Command Center

La grilla permite filtrar y buscar tarjetas en cuatro categorías:

1. **Identidades y documentos:** perfil/DNI y CUIT de namespace sintético, credencial médica PDF/JPEG y factura mock JSON/PDF.
2. **Validadores:** JSON y esquemas dinámicos Pydantic; correo con sintaxis y consulta MX opcional; DNI/CUIT argentino, RUT chileno y CI uruguaya con dígitos de control; integridad SHA-256 y MIME. La verificación de archivo no es un análisis antimalware.
3. **Conversores:** JSON ↔ YAML, CSV ↔ JSON, tablas Markdown a HTML escapado, archivos CSV a JSON, Markdown a PDF (ReportLab), compresión JPEG/PNG/WebP y datasets de hasta 500 filas en JSON/CSV/SQL.
4. **Seguridad:** inspección de integridad, recursos/tools MCP simulados en proceso y webhook local con firma HMAC efímera. No abre puertos MCP ni envía peticiones HTTP salientes; la validación MX sí consulta DNS cuando se solicita.

Los resultados se muestran como JSON y, cuando corresponde, previsualización/descarga JPEG, PDF o archivos convertidos; el panel permite copiar el JSON estructurado. Las entradas de validación/conversión y los payloads webhook no se guardan en los logs de auditoría; solo se conservan metadatos de ejecución.

## API local

Base local: `http://127.0.0.1:8009`. Swagger: <http://127.0.0.1:8009/docs>.

| Método | Ruta | Resultado |
|---|---|---|
| `GET` | `/health` | Estado y versión. |
| `POST` | `/api/v1/generators/profiles` | Perfil ficticio, JPEG y registro. |
| `POST` | `/api/v1/generators/medical-credentials` | Credencial médica sintética, PDF/JPEG y registro. |
| `POST` | `/api/v1/generators/invoices` | Factura mock en JSON y PDF. |
| `POST` | `/api/v1/validators/structure` | Errores detallados de JSON, esquema y formatos básicos. |
| `POST` | `/api/v1/validators/email` | Sintaxis y consulta MX opcional (`email`, `check_mx`). |
| `POST` | `/api/v1/validators/identity` | DNI/CUIT, RUT o CI por región (`region`, `document_type`, `value`). |
| `POST` | `/api/v1/validators/file-integrity` | MIME, SHA-256 y revisión local (máximo 10 MB). |
| `POST` | `/api/v1/converters/convert` | Conversión de payloads entre formatos compatibles. |
| `POST` | `/api/v1/converters/mock-data` | CSV, SQL INSERT o JSON (máximo 500 filas). |
| `POST` | `/api/v1/converters/files/csv-to-json` | CSV UTF-8 subido como JSON descargable (máximo 10 MB). |
| `POST` | `/api/v1/converters/files/markdown-to-pdf` | Markdown UTF-8 convertido a PDF con ReportLab. |
| `POST` | `/api/v1/converters/files/compress-image` | JPEG/PNG/WebP convertido a JPEG optimizado; calidad 20–95. |
| `GET/POST` | `/api/v1/mcp-bridge/*` | Recursos/tools locales y webhook simulado. |
| `GET` | `/api/v1/identities?limit=50` | Historial de perfiles y credenciales. |
| `GET` | `/api/v1/assets/{filename}` | Sirve assets con nombre seguro; añade `?download=true` para descargar. |

Se mantienen las rutas anteriores `/api/v1/generate/dni` y `/api/v1/generate/medical-license` por compatibilidad.

## Verificación

```powershell
cd backend
python -m pytest
```

Las pruebas usan SQLite y assets temporales. Para compilar la UI:

```powershell
cd frontend
npm run build
```

## Aislamiento y configuración

- DB exclusiva: `backend/data/db/factory_mvp.db`. Cada conexión activa `PRAGMA foreign_keys=ON`.
- Assets locales: `backend/data/generated/`.
- `FACTORY_DATABASE_PATH` solo acepta rutas dentro del módulo o del directorio temporal de pruebas. `FACTORY_ASSETS_DIR` permite elegir otra carpeta local de assets.
- La tabla `utility_runs` conserva resultados resumidos y metadatos, no los contenidos enviados, emails completos, identificadores ni archivos.
- La consulta MX transmite el dominio del correo al resolvedor DNS configurado en el sistema; no envía el buzón completo ni intenta entregar correo.
- Los payloads `schema_adapters` son fixtures ilustrativos, no conectores runtime ni contratos garantizados. No importes el módulo desde otros MVP ni conectes sus SQLite.

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para entidades, contratos y límites.

## Estrategia de Despliegue y Migración

**Demo interactiva privada en VM.** Docker Compose construye la UI estática y la API FastAPI en una sola imagen; Nginx sirve la UI y reenvía `/api/` y `/health` a FastAPI. El único puerto publicado es `127.0.0.1:8024`; la API escucha solo en el loopback interno del contenedor. Compose limita memoria y swap a `128m`, conecta a `idealit-internal` y a `idealit-hub-publish` (necesaria para publicar el loopback con el patrón Docker existente), y monta exclusivamente `backend/data/` en el volumen `service-synthetic-factory-data`. Las marcas visibles de ficción siguen activas.

Desde la raíz del subsistema en la VM:

```bash
docker compose config
docker compose up -d --build
docker compose logs --no-color --tail=100
curl -I http://127.0.0.1:8024/
curl -fsS http://127.0.0.1:8024/health
docker stats --no-stream service-synthetic-factory
```

La demo no implementa autenticación ni es fuente de identidad. No publicar el contenedor en interfaces externas ni exponerlo bajo un dominio.
