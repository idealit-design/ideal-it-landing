# Portfolio Ideal-IT — estado y planificación

**Revisión documental base:** 2026-10-31  
**Auditoría complementaria:** 2026-11-01; se validaron las versiones, stacks, puertos, previews y landings descritos en esta guía.
**Catálogo del Hub:** 18 tarjetas: ocho MVP locales, cinco fichas de referencia/propuesta y cinco landings comerciales. Tres MVP tienen preview sintética Angular; las demás fichas sin preview solicitan demo y muestran mockups conceptuales.
**Landings comerciales:** cinco demos estáticas autónomas añadidas a `landings/`; sus previews del Hub se generan con el script `build:hub` de cada proyecto.
**Nota de alcance:** `web-pos-comercial/` es un subsistema local independiente incorporado fuera de los ocho MVP del catálogo; no valida el software POS histórico ni su conciliación Excel.
**Alcance de la revisión:** raíz, manual de trabajo, documentación activa de MVP y servicios, y catálogo Angular. El directorio histórico `portfolio/` queda excluido; no se interpretan los README de dependencias vendorizadas como documentación de productos.

## Estado general

| Sistema | Evidencia actual | Estado para el portfolio | Demos Hub |
|---|---|---|---|
| Personal `0.2.0` | Angular standalone + Tailwind, FastAPI + SQLAlchemy + SQLite exclusiva; dashboard operativo, simulador biométrico, licencias y reportes. UI `4203`, API `8001`. | MVP local modular documentado; dispositivos y marcas son simulados. | Preview sintética `/mvp/personal`; no llama a la API local. |
| Auditoría `0.1.2` | Angular standalone + FastAPI + SQLAlchemy + SQLite exclusiva y archivos locales. UI `4201`, API `8002`. | MVP local modular documentado; no consulta fuentes oficiales ni es un sistema clínico productivo. | Preview sintética `/mvp/auditoria`; no llama a la API local. |
| Formularios `0.1.2` | Angular standalone + Bootstrap, FastAPI + SQLAlchemy + SQLite exclusiva; eventos, inscripciones, QR y asistencia. UI `4202`, API `8003`. | MVP local modular documentado. Cámara y API pertenecen al subsistema local. | Preview sintética `/mvp/formularios`; QR no operativo y datos efímeros. |
| Inspecciones `0.2.0` | React PWA + FastAPI + SQLAlchemy + SQLite exclusiva; cola/cachés privadas AES-GCM en IndexedDB y sincronización idempotente por `client_id`. PWA `5175`, API `8005`. | MVP local modular documentado; no hay autenticación/autorización y el cifrado local no sustituye TLS ni controles de acceso. | Tarjeta de MVP local, sin preview conectada. |
| Automatización de Señales `0.1.1` | HTML/Tailwind + FastAPI; webhook autenticado, simulador de órdenes en memoria y log local. UI/API `8004`. | MVP local documentado; **no** opera en Binance, no conserva saldo/posiciones y no deduplica webhooks. | Tarjeta de MVP local, sin demo pública. VM descrita, no se toma como desplegada. |
| App Valentín Cripto | HTML/Tailwind + FastAPI + SQLite exclusiva; webhook autenticado, señales/órdenes persistidas y simulador local. | Aplicación standalone `0.1.0`; datos y estado simulados persisten en `backend/data/db/cripto_mvp.db`. No usa API keys ni conecta a exchanges. | Dashboard/API local `8006`; sin preview pública. |
| Portal Ciudadano | React PWA + FastAPI + SQLite exclusiva para trámites, reclamos, seguimiento y turnos de demostración. | Prototipo local `0.1.0`; no verifica identidad ni integra servicios oficiales. Los datos deben ser ficticios. | Frontend `5174`; API `8011`; sin preview pública. |
| Logística & Smart Fleet `0.1.1` | Node.js/TypeScript + Express + Prisma 7 + SQLite exclusiva. UI/API `4100`. | MVP local modular documentado; respaldo SSH/SFTP es una simulación sin tráfico de red. | Tarjeta de MVP local, sin preview pública. |
| AgroTech & Telemetría `0.1.1` | Vue 3/Vite + Go/Gin + PostgreSQL exclusiva. UI `5173`, API `8080`. | MVP local modular documentado; ingesta por API, no conexión física a sensores/drones. | Tarjeta de MVP local, sin preview pública. |
| Control de Visitantes `0.1.1` | PHP 8/PDO + SQLite exclusiva + HTML/Tailwind. UI/API `8000`. | MVP local documentado; sin autenticación ni integración con acceso físico. | Tarjeta de MVP local, sin preview pública. |
| Service Synthetic Factory | React/Vite + FastAPI + Faker/Pillow/ReportLab + SQLite exclusiva. | Utilitario local `0.1.0`; genera fixtures y documentos sintéticos marcados como no válidos; no se conecta a otros MVP. | UI `4209` y API `8009`; sin preview pública. |
| Web POS Comercial | React/Vite/Tailwind + FastAPI/SQLModel + SQLite exclusiva. | MVP local independiente `0.1.0`, con catálogo sintético y pagos simulados; no reutiliza el sistema histórico. | Sin preview pública; frontend `4204` y API `8007`. |
| Tienda Virtual | React/Vite + FastAPI/SQLModel + SQLite exclusiva. | MVP local `0.1.0`; catálogo sintético, carrito y checkout de demostración, sin pagos reales. | Sin preview pública; frontend `4206` y API `8010`. |
| ALANTIA Frigorífico | React/TypeScript/Vite + FastAPI/SQLAlchemy + SQLite exclusiva. | Subsistema local `0.1.0`; catálogo, proveedores, ingreso de medias res, saldos y desposte trazable con datos sintéticos. | Sin preview pública; frontend `4205` y API `8008`. |
| Landings comerciales | Cinco apps React/Vite independientes con Tailwind CSS 4 y Lucide. | Demos front-end estáticas; datos, cotizadores y formularios son ilustrativos y efímeros. | Se enlazan en el Hub en `/landings/<slug>/` tras generar los builds `build:hub`. |
| Portal municipal | React/Vite/Tailwind, sin backend. | Landing ficticia `0.1.0`; contenido e interacciones locales, sin trámites ni integración real. | Frontend local `5176`; no es despliegue público. |

El estado funcional se deriva de README, arquitectura y estructura de cada módulo; la verificación ejecutada en este repaso se detalla debajo. Ninguna ficha debe rotularse “live” hasta que exista un entorno público real, seguro y verificado.

La estructura, README y comandos de cada landing están en [landings comerciales](landings-comerciales.md). Los assets estáticos del Hub no se generan en cada build Angular por defecto: el paso `build:hub` debe ejecutarse por landing antes de compilar/publicar el Hub.

## Matriz de verificación de la consolidación inicial (2026-10-31)

| Sistema/superficie | Resultado |
|---|---|
| Landing | `npm run build` exitoso; `npm test -- --watch=false`: 13/13 pruebas exitosas. Smoke test del servidor local: HTTP 200 y 13 tarjetas visibles. |
| Personal | Backend `pytest`: 1/1; frontend Angular build exitoso. |
| Auditoría | Backend `pytest`: 1/1; frontend Angular build exitoso. |
| Formularios | Backend `pytest`: 2/2; frontend Angular build exitoso con un warning de selector de Bootstrap (`.form-floating>~label`). |
| Inspecciones | Backend `pytest`: 5/5; frontend Vite build exitoso con el cliente apuntando a `8005`. |
| Automatización de Señales | Backend `pytest`: 6/6. |
| App Valentín Cripto | Backend `pytest`: 6/6; webhook autenticado, deduplicación, persistencia SQLite entre reinicios y dashboard local. |
| Logística | TypeScript `npm run build` exitoso. No hay suite de pruebas automatizadas localizada. |
| AgroTech | Frontend Vite build exitoso. La verificación de Go no pudo ejecutarse porque `go` no está instalado/disponible en PATH. |
| Control de Visitantes | El lint de PHP no pudo ejecutarse porque `php` no está instalado/disponible en PATH. No hay suite automatizada localizada. |
| Web POS Comercial | Backend `pytest`: 10/10; frontend Vite/Tailwind build exitoso. No se valida el POS histórico ni su conciliación. |

Estos resultados verifican builds y tests locales concretos, no aceptación funcional completa, seguridad de producción ni despliegues cloud. No se instalaron toolchains faltantes.

## Verificación complementaria (2026-11-01)

| Sistema/superficie | Resultado |
|---|---|
| Portfolio Angular | `npm run build` exitoso, incluidos los cinco builds `build:hub`; `npm test -- --watch=false`: 26/26 pruebas. |
| Personal `0.2.0` | Backend `pytest`: 1/1; build Angular exitoso con navegación lazy y dashboard. |
| Auditoría `0.1.2` | Backend `pytest`: 1/1; build Angular exitoso. |
| Formularios `0.1.2` | Backend `pytest`: 2/2; build Angular exitoso (warning existente del selector Bootstrap `.form-floating>~label`). |
| OSMA Inspecciones `0.2.0` | Backend `pytest`: 5/5; frontend Node: 3/3; build Vite exitoso en puerto `5175`. |
| ALANTIA Frigorífico | Build React/TypeScript/Vite exitoso tras restaurar dependencias desde el lockfile. |
| Service Synthetic Factory | Backend `pytest`: 17/17; build Vite exitoso; `/health` devuelve SemVer `0.1.0`. |
| DevOps Monitor | Backend `unittest`: 3/3; build Vite exitoso. |
| MCP Gateway | Backend `pytest`: 13/13. |
| Web Landing Municipal | Build Vite exitoso con puerto local fijo `5176`. |
| Automatizador documental | `unittest`: 10/10; `automate.py --check` sin enlaces rotos, colisiones, conflictos ni versiones inválidas. |

Estos resultados son validaciones locales, no certificación de despliegue o aceptación productiva.

## Service Synthetic Factory

Nuevo utilitario autónomo para generar perfiles ficticios, tarjetas JPEG y credenciales PDF/JPEG de muestra. La API local usa `8009`, la UI usa `4209` y la base SQLite se mantiene dentro del módulo. Los payloads incluyen ejemplos de estructuras para Personal, Auditoría, Visitor Pass, Portal Ciudadano y POS, sin integración runtime ni acceso a sus bases. Los activos llevan marcas de ficción/no validez; no se trata de una fuente de identidad ni de matrícula.

## Cobertura de casos históricos

La landing presenta los trabajos agrupados sin duplicar los MVP que ya los representan:

| Caso | Presentación prevista | Decisión / siguiente paso |
|---|---|---|
| App educativa infantil | Ficha interactiva de referencia/propuesta. | Confirmar alcance de las secciones y cuál de las copias Flutter/Expo fue la entrega usada. |
| Formularios municipales | MVP Formularios. | Ya dispone de tarjeta y preview de presentación; corroborar el permiso para divulgar cliente/capturas antes de añadir material identificable. |
| Operación frigorífica | Subsistema local nuevo `app-alantia-frigorifico`, separado de la ficha histórica. | La implementación local cubre catálogo, proveedores, saldos, ingreso de medias res, desposte parcial y reportes básicos en SQLite propia. La documentación histórica permanece como antecedente de flujos, no evidencia de código/despliegue reutilizable; conteos, rindes, sucursales e integración histórica siguen fuera de alcance. |
| Sistema de prestadores | Excluido de la landing y de cualquier demo. | No copiar código, nombres, datos, credenciales, pantallas ni identificadores. Si se presenta una capacidad de dominio, hacerlo como producto nuevo, sintético y sin vínculo con el cliente. |
| Inspecciones de campo | MVP Inspecciones, con nombre neutral. | Módulo React PWA separado; corregido el conflicto local de puerto con Formularios. |
| POS y caja | Ficha interactiva de propuesta; existe además un subsistema local nuevo y neutral. | `web-pos-comercial/` prueba flujos sintéticos propios, no carga el dump histórico. Revisar operaciones y respaldo original por separado antes de afirmar conciliación Excel. |
| Landing municipal | Ficha de referencia/propuesta. | Manifest identifica React 19, Vite 7 y Tailwind 4. No atribuir backend. Confirmar autorización de publicación. |
| Sitio de servicios digitales | Ficha de referencia/propuesta. | Manifest actual identifica React/Vite/Tailwind, no Bootstrap. Confirmar contenido y stack histórico. |
| Automatización cripto | MVP Automatización de Señales. | Mostrar webhook y simulador únicamente; sin Binance real. Las claves Pine originales no se copian al frontend. |

“Propuesta” significa que la tarjeta comunica un problema y una dirección técnica a explorar; no afirma que exista software funcional, cliente, despliegue o integración.

## Trabajo ejecutado en la consolidación inicial

- Catálogo de landing alineado con los ocho directorios `mvp-*`; los tres previews se describen por separado de las APIs locales.
- Se incorporó `web-pos-comercial/` como MVP local independiente, sin añadir una preview pública ni reutilizar el respaldo POS.
- Cinco tarjetas históricas/propuestas con etiquetas técnicas y detalle interactivo, sin falso estado de demo pública.
- Rutas del archivo fuente histórico y referencia al proyecto de cliente retiradas de los detalles públicos de tarjetas; solo se muestran directorios `mvp-*`.
- Se mantuvieron dos copias del hub sincronizadas y se añadió este índice central con resúmenes por categoría.
- Se fijó la API local de Inspecciones en `8005` (Formularios conserva `8003`) y la PWA en `5175` (AgroTech conserva `5173`), con puertos de desarrollo sin colisión.
- Validación ejecutada: landing (13 pruebas), cinco suites backend Python (15 pruebas), seis builds frontend y build de TypeScript de Logística. Go/PHP requieren toolchains ausentes; no se certifica despliegue cloud.

## Plan priorizado

### P0 — Cierre de esta consolidación

1. **Hecho:** build de la landing y 13 pruebas de UI; renderiza catálogo de ocho MVP y cinco propuestas, y conserva las tres previews.
2. **Hecho:** 5 pruebas de API de Inspecciones; cliente/guías usan `8005`, sin referencias de configuración a `8003` en el subsistema.
3. **Hecho:** `git diff --check` limpio; enlaces de diez archivos Markdown modificados verificados y SHA-256 de la copia del manual coincidente con la fuente.
4. **Hecho:** las tarjetas no muestran archivos del archivo histórico; fichas propuestas declaran sus límites. No se declaran despliegues cloud ni integraciones reales.

### P1 — Producto y demostración

1. **Parcialmente hecho:** ejecutar en CI las suites verificables del cuadro; agregar/verificar pruebas de backend para Logística, AgroTech y Visitor Pass, disponer de toolchains Go/PHP y guardar resultados ligados a versión.
2. Incorporar un guion de demo de 3–5 minutos por módulo, datos 100% sintéticos, imágenes propias y una sección visible de alcance/límites.
3. Añadir preview browser-only para los MVP sin ruta interactiva solo cuando un flujo represente una decisión real de negocio; no clonar todo el frontend local en la landing.
4. Para los casos históricos, confirmar operación/despliegue de Frigorífico y POS, alcance educativo de ULP y permiso de publicación para sitios/capturas; definir nombre neutral, usuarios y métricas demostrables.

### P2 — Migración profunda de las propuestas

Para cada producto faltante: validar alcance/propiedad y datos; modelar roles, flujos y estados; elegir stack por costo operativo y experiencia de usuarios; crear frontend/API/storage propios; implementar validación y errores; pruebas unitarias/API/contracto; demo aislada; documentación; observabilidad; despliegue y rollback; aprobación del cliente antes de usar datos reales.

Prioridad comercial sugerida: POS/caja (flujo demostrable y necesidades frecuentes), trazabilidad/inventario frigorífico (alto valor si se confirma el dominio), educación móvil (validar alcance y medios), y luego landings municipales/servicios como casos de interfaz. Esto es una hipótesis de priorización, no un compromiso comercial.

### P3 — Integraciones y despliegues configurables

- **Landing:** build estático y CDN/hosting frontend; previews sin conexión a servicios locales.
- **APIs cloud:** VM Ubuntu en AWS u OCI (incluido Free Tier solo si región/cupo/precio vigente lo permiten); servicio con usuario no privilegiado, TLS en proxy, firewall mínimo, API en loopback o red privada, secretos fuera del repositorio, health check, logs con retención, backup y prueba de restauración. El puerto interno nunca se abre de forma pública por defecto.
- **Servicios locales/terceros:** adaptadores por integración detrás de contratos internos, credenciales por ambiente, scopes mínimos, timeout, retry acotado, circuit breaker/estado visible e idempotencia. Empezar con mocks y sandbox antes de habilitar tráfico real.
- **TradingView/exchange:** validar firma/secreto, limitar tamaño y tasa, deduplicar `event_id`, permitir lista de símbolos/acciones, registrar auditoría sin secretos, límites de riesgo y entorno testnet. No habilitar órdenes reales sin autorización explícita y controles operativos.
- **Hardware simulado/real:** interfaz de adaptador para biometría IP, QR/cámara, balanza o lectores; simulador como implementación por defecto; red privada/VPN, allowlist, autenticación de dispositivo, validación de payload, fallos seguros y registro de eventos al conectar equipo real.
- **Datos:** una base y credenciales por subsistema/cliente. SQLite para demo local o baja concurrencia; PostgreSQL separado cuando el servicio multiusuario/concurrente lo requiera. Rutas/URLs con variables exclusivas; migraciones versionadas, cifrado/secretos, backup-retención y pruebas de restore por base. Nunca compartir SQLite o esquema de dominio entre MVP.
- **Administración/auditoría:** no hay un “superadmin central” común demostrado en los ocho MVP. Si se incorpora, definir roles y permisos por módulo, auditoría append-only, exportación controlada y tenant isolation; el servicio central no accede directamente a las bases de los subsistemas.

## Puertos locales documentados

| Servicio | UI | API |
|---|---:|---:|
| Landing | `4200` | — |
| Auditoría | `4201` | `8002` |
| Formularios | `4202` | `8003` |
| Personal | `4203` | `8001` |
| Automatización de Señales | — | `8004` |
| App Valentín Cripto | `8006` | `8006` |
| Inspecciones PWA | `5175` | `8005` |
| Portal Ciudadano | `5174` | `8011` |
| Logística | UI y API juntas | `4100` |
| AgroTech | `5173` | `8080` |
| Visitor Pass | UI y API juntas | `8000` |
| Service Synthetic Factory | `4209` | `8009` |
| Web POS Comercial | `4204` | `8007` |
| Tienda Virtual | `4206` | `8010` |
| ALANTIA Frigorífico | `4205` | `8008` |
| Portal municipal | `5176` | — |
| DevOps Monitor | `4175` | `8765` |
| MCP Gateway | — | `8020` |

Los procesos que abren listeners HTTP independientes deben usar puertos distintos. Una UI servida por el mismo listener de su API puede compartir ese puerto, como App Valentín Cripto.
