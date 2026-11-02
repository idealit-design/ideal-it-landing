# Portfolio Ideal-IT — plan de migración y prioridades

**Actualización documental:** 2026-11-01
**Inventario:** 18 subsistemas de producto/soporte, según `../../docs/ECOSYSTEM_STATUS.md`.
**Alcance:** planificación, no autorización de despliegue. Los puertos, límites de memoria y variables por integrar son propuestas futuras.

## Resumen ejecutivo del estado real

- Portfolio Angular publicado como SPA estática en Vercel. Cinco landings comerciales están compiladas en `ideal-it-portfolio/public/landings/`.
- Personal, Auditoría y Formularios tienen previews sintéticas en memoria. No consumen sus APIs locales ni conectan con la VM. Las pruebas reportadas del portfolio: 26/26.
- Algunos MVPs standalone tienen frontends y APIs locales configurados con `localhost`/`loopback`; esto no implica despliegue remoto.
- La VM observada ejecuta Ubuntu Server 26.04.1 LTS, 4 vCPU, Docker Engine 29.9.2 y Compose 5.6.1. Tiene 1.5 GiB RAM visible y 39 GB disponibles en disco; la lectura previa al arranque de la demo mostró 622 MiB disponibles y 514 MiB de swap en uso.
- `idealit-hub` sigue saludable en `127.0.0.1:8080`. `app-alantia-frigorifico` está desplegado y saludable en `127.0.0.1:8012`, limitado a 128 MiB y con SQLite en volumen exclusivo. No hay otros contenedores de MVP/API desplegados. IP DHCP observada: `172.24.151.30/20`, sujeta a cambio.

## Prioridad 1 — demo funcional e interactiva en VM

Objetivo: ejecutar una demo autónoma con datos sintéticos, API real del módulo y persistencia aislada. El endpoint de cada demo se propone ligado a `127.0.0.1:80XX`, visible solo desde la VM o mediante un túnel SSH autorizado. Esto no hace que Vercel alcance la VM ni permite a visitantes públicos acceder al servicio.

| Subsistema | Endpoint VM (propuesto o activo) | Límite | Almacenamiento y prerrequisitos |
|---|---:|---:|---|
| `app-alantia-frigorifico` | `127.0.0.1:8012` — desplegado/healthy | `128m` | SQLite exclusiva en `app-alantia-frigorifico-sqlite`; UI/API en un contenedor. Sin datos reales ni conexión a Vercel. |
| `app-portal-ciudadano` | `127.0.0.1:8013` | `128m` | SQLite exclusiva; configurar origen API, usar datos ficticios y no presentar el login como identidad verificada. |
| `app-valentin-cripto` | `127.0.0.1:8014` | `128m` | SQLite exclusiva; secreto de prueba fuera del repositorio y eventos locales simulados. |
| `mvp-agrotech-iot` | `127.0.0.1:8015` | API `128m` + PostgreSQL `192m` | PostgreSQL dedicado en red Docker privada, sin puerto de DB publicado; volumen/credenciales exclusivos. **Condicionado:** medir RAM antes; los límites suman un techo de 320 MiB, además del hub y el SO, pero no representan consumo garantizado. |
| `mvp-auditoria` | `127.0.0.1:8016` | `128m` | SQLite y carpeta de documentos exclusivas; limitar archivos, retención y usar documentos sintéticos. |
| `mvp-formularios` | `127.0.0.1:8017` | `128m` | SQLite exclusiva; configurar CORS/origen; cámara solo bajo `localhost` o HTTPS. |
| `mvp-logistica-fleet` | `127.0.0.1:8018` | `128m` | SQLite exclusiva vía Prisma; volumen y migraciones controladas; SFTP permanece simulado. |
| `mvp-osma-inspecciones` | `127.0.0.1:8019` | `128m` | SQLite exclusiva; cola IndexedDB queda en el navegador; HTTPS y autenticación antes de cualquier red pública. |
| `mvp-personal` | `127.0.0.1:8021` | `128m` | SQLite exclusiva; datos ficticios y simulador biométrico, sin conexión física. |
| `mvp-visitor-pass` | `127.0.0.1:8022` | `96m` | SQLite exclusiva; no exponer sin autenticación, permisos y política de retención. |
| `service-devops-monitor` | `127.0.0.1:8023` | `96m` | SQLite exclusiva; lista explícita de objetivos locales; revisar la red Docker antes de sondear servicios. |
| `service-synthetic-factory` | `127.0.0.1:8024` | `128m` | SQLite y assets en volúmenes propios; límites de generación/almacenamiento; solo uso interno. |
| `web-pos-comercial` | `127.0.0.1:8027` | `128m` | SQLite exclusiva, datos sintéticos y pagos simulados; no representa el POS histórico. |
| `web-tienda-virtual` | `127.0.0.1:8028` | `128m` | SQLite exclusiva; carrito/datos sintéticos y checkout sin pasarela real. |

Solo `app-alantia-frigorifico` está desplegado; las otras filas son propuestas pendientes. Los límites son topes de contenedor, no memoria reservada ni garantías de que un stack arranque dentro del presupuesto. Mantener los servicios existentes y desplegar como máximo una demo adicional de negocio a la vez. Comprobar memoria disponible, uso de swap, persistencia, health check y rollback antes de aceptar cada demo. La siguiente prioridad debe elegirse tras observar el consumo del servicio activo; reservar AgroTech para después de validar la capacidad de PostgreSQL.

Para SQLite: volumen distinto por módulo, propiedad/permisos restringidos, backup restaurable y ninguna DB montada en común. Para el API y frontend, un endpoint local puede servir la app/API desde el mismo puerto o usar un proxy controlado; mantener listeners internos en red privada. Nunca mapear PostgreSQL a la interfaz de host.

## Prioridad 2 — Cloud, webhooks, MCP y CI

| Subsistema | Destino de diseño | Requisitos previos / estado |
|---|---|---|
| `mvp-valentin-cripto` | Receptor de webhook con HTTPS mediante proxy/servicio Cloud; listener interno reservado en `8025`. | Aún no desplegado. `WEBHOOK_SECRET` solo en gestor de secretos/entorno del servidor; nombrarlo sin valor en `.env.example`. Antes de tráfico externo: autenticación del dashboard, límites de tamaño/tasa, idempotencia persistente, logs con retención y prueba sandbox. No conectar exchanges ni usar fondos reales. |
| `service-mcp-gateway` | Mantener local en `127.0.0.1:8020`; posible integración MCP remota requiere un diseño separado. | Actualmente read-only y limitado a clientes/host locales. No publicar, tunelizar ni reenviar el puerto. Para futuro transporte remoto: autenticación/autorización, TLS, allowlist de fuentes y revisión de privacidad; nombres futuros como `MCP_SERVER_URL`/token no son configuración vigente. |
| `service-docs-hub-automator` | Ejecución por CLI o runner de CI, sin servicio web. | No requiere puerto/VM ni secretos ahora. Si se integra a CI, usar permisos mínimos y secretos del proveedor, nunca valores en el repositorio. |
| `web-landing-municipal` | Hosting estático/CDN aprobado; no backend ni base. | La landing es local y no se verificó un despliegue independiente. Si en el futuro envía formularios, especificar flujo serverless/webhook, consentimiento y antispam. `.env.example` del backend futuro: `CONTACT_WEBHOOK_URL` y `CONTACT_WEBHOOK_SECRET` como placeholders vacíos; secretos solo en el backend/gestor de secretos. |

Las cinco landings comerciales siguen como bundles frontend estáticos del portfolio en Vercel. Sus formularios/cotizadores son ilustrativos y no necesitan API para esta demo. Un build estático no se migra a la VM salvo decisión de hosting específica.

### Contrato de configuración para futuras integraciones

Cada servicio nuevo documentará en su `.env.example` solo nombres, propósito y placeholders no utilizables; no añadir secretos, URLs privadas ni credenciales reales. Variables previstas solo cuando se implemente cada integración:

- Webhook: `WEBHOOK_SECRET`, `TRADING_AUDIT_PATH`; almacenar el secreto fuera de Git y nunca exponerlo al navegador.
- AgroTech: `DATABASE_URL` por entorno, con credenciales exclusivas y acceso únicamente en red Docker privada.
- MCP remoto futuro: URL y credencial de transporte definidas con el cliente/servidor elegido; no asumir soporte actual ni abrir el endpoint local `8020`.
- Formulario Cloud futuro: `CONTACT_WEBHOOK_URL` y `CONTACT_WEBHOOK_SECRET` en el backend; no pasar el secreto al frontend.

En cada flujo externo: proveedor → endpoint autenticado/validado → adaptador del subsistema → almacenamiento separado → respuesta/estado visible. Aplicar timeout, límites, reintentos acotados, idempotencia y auditoría sin secretos. Usar mocks/sandbox hasta aprobar la integración real.

## Fases de trabajo

1. **Fase 0 — baseline (hecha):** portfolio estático en Vercel, cinco landings compiladas y tres previews sintéticas; hub Nginx en VM.
2. **Fase 1 — primera demo privada VM (hecha):** `app-alantia-frigorifico` saludable en loopback `127.0.0.1:8012`, límite `128m`, volumen SQLite exclusivo y datos de producción vacíos. El endpoint de salud, la UI, logs y publicación se verificaron.
3. **Fase 2 — demos adicionales (pendiente):** habilitar una por vez, observar memoria/swap, y revertir si el host queda presionado. AgroTech/PostgreSQL requiere una aprobación explícita basada en mediciones.
4. **Fase 3 — exposición Cloud/integraciones (pendiente):** decidir alcance público, identidad/autorización, TLS, firewall y secretos; preparar entorno aislado/sandbox; validar backups, logs, alertas y rollback antes de recibir tráfico externo.

## Puertos ya documentados en desarrollo local

Estos puertos pertenecen a los entornos locales de desarrollo y **no** son puertos VM:

| Subsistema/superficie | UI local | API local |
|---|---:|---:|
| Portfolio Angular | `4200` | — |
| Auditoría | `4201` | `8002` |
| Formularios | `4202` | `8003` |
| Personal | `4203` | `8001` |
| Automatización de Señales | — | `8004` |
| App Valentín Cripto | `8006` | `8006` |
| OSMA Inspecciones | `5175` | `8005` |
| Portal Ciudadano | `5174` | `8011` |
| Logística | `4100` | `4100` |
| AgroTech | `5173` | `8080` |
| Visitor Pass | `8000` | `8000` |
| Synthetic Factory | `4209` | `8009` |
| Web POS Comercial | `4204` | `8007` |
| Tienda Virtual | `4206` | `8010` |
| ALANTIA Frigorífico | `4205` | `8008` |
| Portal municipal | `5176` | — |
| DevOps Monitor | `4175` | `8765` |
| MCP Gateway | — | `8020` |

## Referencias

- [Estado verificado del ecosistema](../../docs/ECOSYSTEM_STATUS.md)
- [Hub del portfolio](../../PORTFOLIO_HUB.md)
- [Contexto de la VM](../../docs/operations/VM_CONTEXT.md)
- [Guía del workspace Docker](../../docs/operations/WORKSPACE_DOCKER.md)
- [Personas y auditoría](../domains/01-personas-auditoria.md), [trámites e inspecciones](../domains/02-tramites-inspecciones.md), [operaciones/logística/IoT](../domains/03-operaciones-logistica-iot.md) e [integraciones/accesos](../domains/04-integraciones-accesos.md)
