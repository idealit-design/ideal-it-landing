# Portfolio Hub — Ideal-IT

## Estado de las demos y migración

La SPA Angular se publica estáticamente en Vercel y contiene cinco landings comerciales compiladas en `public/landings/`. Las previews de Personal, Auditoría y Formularios son sintéticas y no consumen APIs ni la VM. Las 26 pruebas reportadas del portfolio están aprobadas.

La VM ejecuta `idealit-hub` (Nginx saludable en `127.0.0.1:8080`) y `app-alantia-frigorifico` (saludable en `127.0.0.1:8012`, límite de 128 MiB y SQLite exclusiva). La demo ALANTIA no está conectada a Vercel. La matriz de 18 subsistemas del repositorio no es lo mismo que el conteo de tarjetas del Hub; los demás destinos `127.0.0.1:80XX` siguen siendo propuestas para demos privadas.

| Prioridad | Subsistemas |
|---|---|
| 1 — demo interactiva local en VM | `app-alantia-frigorifico` (desplegado); `app-portal-ciudadano`, `app-valentin-cripto`, `mvp-agrotech-iot` (condicionado por RAM/PostgreSQL), `mvp-auditoria`, `mvp-formularios`, `mvp-logistica-fleet`, `mvp-osma-inspecciones`, `mvp-personal`, `mvp-visitor-pass`, `service-devops-monitor`, `service-synthetic-factory`, `web-pos-comercial`, `web-tienda-virtual` (pendientes). |
| 2 — Cloud/MCP/webhook/CI | `mvp-valentin-cripto`, `service-docs-hub-automator`, `service-mcp-gateway`, `web-landing-municipal`. |

Ver [plan de migración](../md/planning/portfolio-planificacion.md) y [estado VM](../docs/operations/VM_CONTEXT.md).

## Matriz de soluciones

| Subsistema | Versión | README | Directorios principales | Markdown |
|---|---|---|---|---:|
| `app-alantia-frigorifico` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `app-portal-ciudadano` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `app-valentin-cripto` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-agrotech-iot` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-auditoria` | `0.1.2` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-formularios` | `0.1.2` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-logistica-fleet` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/`, `mvp-logistica-fleet/` | 2 |
| `mvp-osma-inspecciones` | `0.2.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-personal` | `0.2.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-valentin-cripto` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-visitor-pass` | `0.1.1` | Disponible | `docs/` | 2 |
| `service-devops-monitor` | `0.1.0` | Disponible | `backend/`, `config/`, `frontend/` | 1 |
| `service-docs-hub-automator` | `0.1.0` | Disponible | `tests/` | 1 |
| `service-mcp-gateway` | `0.1.0` | Disponible | `tests/` | 1 |
| `service-synthetic-factory` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `web-landing-municipal` | `0.1.0` | Disponible | `docs/`, `src/` | 2 |
| `web-pos-comercial` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `web-tienda-virtual` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |

## Landing y navegación

La landing Angular 18 se despliega como una SPA estática en Vercel. Demos Hub es la página de inicio (`/`) y las rutas SPA admiten navegación directa y refresco.

Las tarjetas del Hub presentan primero la categoría, el nombre de la solución y un resumen conciso. Muestran como máximo tres tecnologías representativas, priorizando variedad entre frontend, backend y datos, y agrupan navegación y acción principal en una fila. Un borde de acento sutil en los cuatro lados conserva la identidad de cada categoría sin recargar la grilla.

Las previews interactivas solo son de presentación: emplean datos ficticios efímeros en el navegador, no persisten, no abren cámara ni conectan con APIs locales. Los subsistemas locales conservan frontend/API/DB separados; no se publican junto con la SPA.

La matriz de avance, el plan de migración, las referencias originales y los resúmenes técnicos se mantienen en el [índice documental central](../md/README.md). El manual íntegro está disponible en [md/manual.md](../md/manual.md).
