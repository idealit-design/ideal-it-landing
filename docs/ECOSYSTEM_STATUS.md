# Estado del ecosistema Ideal-IT

Informe generado por `service-docs-hub-automator/automate.py`.

## Métricas

| Métrica | Valor |
|---|---:|
| Subsistemas detectados (`mvp-*`, `service-*`, `app-*`, `web-*`) | 18 |
| Subsistemas con `VERSION` | 18 |
| Subsistemas con `README.md` | 18 |
| Directorios internos | 161 |
| Archivos en subsistemas | 406 |
| Documentos Markdown en subsistemas | 33 |
| Hallazgos de integridad | 0 |

## Estado de despliegue verificado y fases

Este informe conserva el inventario de 18 subsistemas. La documentación de migración que sigue es una actualización editorial manual; no ejecutar el automatizador documental para recrear este archivo mientras la herramienta no preserve esta sección.

| Fase | Estado |
|---|---|
| Portfolio web | Angular SPA estática en Vercel; cinco bundles comerciales en `ideal-it-portfolio/public/landings/`. Tres previews sintéticas (Personal, Auditoría y Formularios), no conectadas a API. Pruebas reportadas: 26/26. |
| Subsistemas locales | Ocho MVP, tres apps, cuatro servicios y tres web apps registrados en el inventario. Su presencia y README no acreditan despliegue remoto. |
| VM — fase actual | Ubuntu Server 26.04.1 LTS, 4 vCPU, 1.5 GiB RAM y 39 GB libres. Lectura del host previa al arranque de la demo: 622 MiB disponibles y 514 MiB de swap usados. Docker Engine 29.9.2 y Compose 5.6.1 operativos. `idealit-hub` sigue saludable en `127.0.0.1:8080`; `app-alantia-frigorifico` está saludable en `127.0.0.1:8012`, limitado a 128 MiB y respaldado por SQLite en un volumen exclusivo. |
| Fase 1 — en curso | Primera demo autónoma desplegada: ALANTIA Frigorífico. Los demás servicios candidatos siguen pendientes y requieren despliegue secuencial, puerto loopback, límite de memoria y almacenamiento exclusivo por subsistema. AgroTech/PostgreSQL queda condicionado a validar memoria. |
| Fase 2 — pendiente | Hosting estático, webhooks y MCP requieren diseño de conectividad, TLS/autenticación, variables por ambiente y revisión de exposición. No hay integraciones cloud/MCP declaradas como desplegadas. |

Los puertos `127.0.0.1:80XX`, límites de memoria y variables por integrar de [md/planning/portfolio-planificacion.md](../md/planning/portfolio-planificacion.md) son objetivos de diseño salvo `127.0.0.1:8012`, ya verificado para ALANTIA Frigorífico. La VM usa DHCP (`172.24.151.30/20` al auditarse); la IP puede cambiar. Un túnel SSH da acceso al operador que lo establece y no hace que una web Vercel sea accesible a la VM o a visitantes externos.

## Inventario

| Subsistema | Versión | Archivo(s) VERSION | README(s) | Directorios principales | Archivos | Markdown |
|---|---|---|---|---|---:|---:|
| `app-alantia-frigorifico` | `0.1.0` | `VERSION` | [`README.md`](../app-alantia-frigorifico/README.md) | `backend/`, `docs/`, `frontend/` | 22 | 2 |
| `app-portal-ciudadano` | `0.1.0` | `VERSION` | [`README.md`](../app-portal-ciudadano/README.md) | `backend/`, `docs/`, `frontend/` | 27 | 2 |
| `app-valentin-cripto` | `0.1.0` | `VERSION` | [`README.md`](../app-valentin-cripto/README.md) | `backend/`, `docs/`, `frontend/` | 13 | 2 |
| `mvp-agrotech-iot` | `0.1.1` | `VERSION` | [`README.md`](../mvp-agrotech-iot/README.md) | `backend/`, `docs/`, `frontend/` | 25 | 2 |
| `mvp-auditoria` | `0.1.2` | `VERSION` | [`README.md`](../mvp-auditoria/README.md) | `backend/`, `docs/`, `frontend/` | 34 | 2 |
| `mvp-formularios` | `0.1.2` | `VERSION` | [`README.md`](../mvp-formularios/README.md) | `backend/`, `docs/`, `frontend/` | 35 | 2 |
| `mvp-logistica-fleet` | `0.1.1` | `VERSION` | [`README.md`](../mvp-logistica-fleet/README.md) | `backend/`, `docs/`, `frontend/`, `mvp-logistica-fleet/` | 23 | 2 |
| `mvp-osma-inspecciones` | `0.2.0` | `VERSION` | [`README.md`](../mvp-osma-inspecciones/README.md) | `backend/`, `docs/`, `frontend/` | 36 | 2 |
| `mvp-personal` | `0.2.0` | `VERSION` | [`README.md`](../mvp-personal/README.md) | `backend/`, `docs/`, `frontend/` | 44 | 2 |
| `mvp-valentin-cripto` | `0.1.1` | `VERSION` | [`README.md`](../mvp-valentin-cripto/README.md) | `backend/`, `docs/`, `frontend/` | 15 | 2 |
| `mvp-visitor-pass` | `0.1.1` | `VERSION` | [`README.md`](../mvp-visitor-pass/README.md) | `docs/` | 5 | 2 |
| `service-devops-monitor` | `0.1.0` | `VERSION` | [`README.md`](../service-devops-monitor/README.md) | `backend/`, `config/`, `frontend/` | 19 | 1 |
| `service-docs-hub-automator` | `0.1.0` | `VERSION` | [`README.md`](../service-docs-hub-automator/README.md) | `tests/` | 4 | 1 |
| `service-mcp-gateway` | `0.1.0` | `VERSION` | [`README.md`](../service-mcp-gateway/README.md) | `tests/` | 6 | 1 |
| `service-synthetic-factory` | `0.1.0` | `VERSION` | [`README.md`](../service-synthetic-factory/README.md) | `backend/`, `docs/`, `frontend/` | 41 | 2 |
| `web-landing-municipal` | `0.1.0` | `VERSION` | [`README.md`](../web-landing-municipal/README.md) | `docs/`, `src/` | 12 | 2 |
| `web-pos-comercial` | `0.1.0` | `VERSION` | [`README.md`](../web-pos-comercial/README.md) | `backend/`, `docs/`, `frontend/` | 23 | 2 |
| `web-tienda-virtual` | `0.1.0` | `VERSION` | [`README.md`](../web-tienda-virtual/README.md) | `backend/`, `docs/`, `frontend/` | 22 | 2 |

## Estructura recursiva

- **`app-alantia-frigorifico/`**: `backend/`, `backend/data/`, `backend/data/db/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/src/`.
- **`app-portal-ciudadano/`**: `backend/`, `backend/data/`, `backend/data/db/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/public/`, `frontend/src/`.
- **`app-valentin-cripto/`**: `backend/`, `backend/app/`, `backend/data/`, `backend/data/db/`, `backend/tests/`, `docs/`, `frontend/`.
- **`mvp-agrotech-iot/`**: `backend/`, `backend/config/`, `backend/controllers/`, `backend/models/`, `backend/services/`, `docs/`, `frontend/`, `frontend/src/`, `frontend/src/components/`, `frontend/src/stores/`, `frontend/src/views/`.
- **`mvp-auditoria/`**: `backend/`, `backend/app/`, `backend/app/core/`, `backend/app/routers/`, `backend/app/services/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/src/`, `frontend/src/app/`, `frontend/src/app/core/`, `frontend/src/app/core/services/`, `frontend/src/app/features/`, `frontend/src/app/features/auditoria-dashboard/`, `frontend/src/app/features/boveda-visual/`, `frontend/src/app/features/nomenclador-vinculacion/`, `frontend/src/app/features/validador-identidad/`.
- **`mvp-formularios/`**: `backend/`, `backend/app/`, `backend/app/core/`, `backend/app/routers/`, `backend/app/services/`, `backend/data/`, `backend/data/db/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/src/`, `frontend/src/app/`, `frontend/src/app/core/`, `frontend/src/app/features/`, `frontend/src/app/features/gestion-eventos/`, `frontend/src/app/features/portal-ciudadano/`, `frontend/src/app/features/scanner-asistencia/`.
- **`mvp-logistica-fleet/`**: `backend/`, `backend/prisma/`, `backend/prisma/migrations/`, `backend/prisma/migrations/20261031080450_init/`, `backend/src/`, `backend/src/config/`, `backend/src/routes/`, `backend/src/services/`, `docs/`, `frontend/`, `frontend/public/`, `mvp-logistica-fleet/`, `mvp-logistica-fleet/backend/`.
- **`mvp-osma-inspecciones/`**: `backend/`, `backend/app/`, `backend/app/core/`, `backend/app/routers/`, `backend/app/services/`, `backend/data/`, `backend/data/db/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/public/`, `frontend/src/`, `frontend/test/`.
- **`mvp-personal/`**: `backend/`, `backend/app/`, `backend/app/core/`, `backend/app/models/`, `backend/app/routers/`, `backend/app/services/`, `backend/data/`, `backend/data/db/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/src/`, `frontend/src/app/`, `frontend/src/app/core/`, `frontend/src/app/core/services/`, `frontend/src/app/features/`, `frontend/src/app/features/asistencia/`, `frontend/src/app/features/biometric-sim/`, `frontend/src/app/features/dashboard/`, `frontend/src/app/features/licencias/`, `frontend/src/app/features/personal-mgmt/`, `frontend/src/app/features/reportes/`.
- **`mvp-valentin-cripto/`**: `backend/`, `backend/app/`, `backend/app/routers/`, `backend/app/services/`, `backend/scripts/`, `backend/tests/`, `docs/`, `frontend/`.
- **`mvp-visitor-pass/`**: `docs/`.
- **`service-devops-monitor/`**: `backend/`, `backend/app/`, `backend/tests/`, `config/`, `frontend/`, `frontend/src/`.
- **`service-docs-hub-automator/`**: `tests/`.
- **`service-mcp-gateway/`**: `tests/`.
- **`service-synthetic-factory/`**: `backend/`, `backend/data/`, `backend/data/db/`, `backend/data/generated/`, `backend/generators/`, `backend/routers/`, `backend/services/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/src/`, `frontend/src/components/`, `frontend/src/modules/`.
- **`web-landing-municipal/`**: `docs/`, `src/`.
- **`web-pos-comercial/`**: `backend/`, `backend/data/`, `backend/data/db/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/src/`.
- **`web-tienda-virtual/`**: `backend/`, `backend/data/`, `backend/data/db/`, `backend/tests/`, `docs/`, `frontend/`, `frontend/src/`.

## Integridad

Sin enlaces rotos, colisiones de puertos, conflictos de dependencias ni errores de versión detectados.
