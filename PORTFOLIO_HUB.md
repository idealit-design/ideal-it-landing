# Portfolio Hub — Ideal-IT

## Matriz de soluciones

| Subsistema | Versión | README | Directorios principales | Markdown |
|---|---|---|---|---:|
| `app-alantia-frigorifico` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `app-portal-ciudadano` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `app-valentin-cripto` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-agrotech-iot` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-auditoria` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-formularios` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-logistica-fleet` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/`, `mvp-logistica-fleet/` | 2 |
| `mvp-osma-inspecciones` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-personal` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-valentin-cripto` | `0.1.1` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `mvp-visitor-pass` | `0.1.1` | Disponible | `docs/` | 2 |
| `service-devops-monitor` | `0.1.0` | Disponible | `backend/`, `config/`, `frontend/` | 1 |
| `service-docs-hub-automator` | `0.1.0` | Disponible | `tests/` | 1 |
| `service-mcp-gateway` | `0.1.0` | Disponible | `tests/` | 1 |
| `service-synthetic-factory` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `web-landing-municipal` | `0.1.0` | Disponible | `docs/`, `src/` | 2 |
| `web-pos-comercial` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |
| `web-tienda-virtual` | `0.1.0` | Disponible | `backend/`, `docs/`, `frontend/` | 2 |

## MVP Personal

Subsistema local de gestión de personal, licencias y asistencia. Su simulador biométrico crea marcas sintéticas y no intenta conectarse a relojes reales. El backend usa una SQLite exclusiva y no requiere SQL Server PJE ni el esquema de Prestadores/Auditoría.

- **Tecnologías:** Angular standalone + Tailwind CSS, FastAPI, SQLAlchemy y SQLite.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Acceso desde Demos Hub:** `/mvp/personal` en la landing local `http://localhost:4200`. Es una preview ficticia en memoria, sin llamadas a FastAPI; el producto standalone se ejecuta en `http://localhost:4203` y su API en `http://127.0.0.1:8001`.
- **Documentación del subsistema:** [Arquitectura MVP Personal](mvp-personal/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP Personal](mvp-personal/README.md).

## MVP Auditoría

Subsistema local e independiente para auditoría de prestadores y prácticas. Los documentos se almacenan en una carpeta local, los metadatos en una SQLite dedicada y las validaciones de identidad/matrícula son exclusivamente mocks locales.

- **Tecnologías:** Angular standalone, FastAPI, SQLAlchemy y SQLite.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Acceso desde Demos Hub:** `/mvp/auditoria` en la landing local `http://localhost:4200`. Es una preview sintética en memoria; el producto standalone se ejecuta en `http://localhost:4201` y su API en `http://127.0.0.1:8002`.
- **Documentación del subsistema:** [Arquitectura MVP Auditoría](mvp-auditoria/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP Auditoría](mvp-auditoria/README.md).

## MVP Formularios

Subsistema local e independiente para turismo y eventos municipales. Gestiona organizadores, eventos gratuitos, inscripción ciudadana, aprobación opcional, emisión de códigos QR y validación de asistencia por cámara o ingreso manual.

- **Tecnologías:** Angular standalone + Bootstrap, FastAPI, SQLAlchemy y SQLite.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP Formularios](mvp-formularios/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP Formularios](mvp-formularios/README.md).

## MVP OSMA Inspecciones

PWA local para inspecciones de campo, con sincronización idempotente y cola offline cifrada en IndexedDB. Usa datos ficticios y una SQLite propia; no se conecta a registros OSMA reales.

- **Tecnologías:** React PWA, FastAPI, SQLAlchemy y SQLite.
- **Estado:** MVP local; sin autenticación/autorización y sin despliegue productivo.
- **Versión:** `0.1.1`.
- **Acceso local:** PWA `http://127.0.0.1:5175`; API `http://127.0.0.1:8005`.
- **Documentación:** [arquitectura](mvp-osma-inspecciones/docs/ARCHITECTURE.md) y [README](mvp-osma-inspecciones/README.md).

## MVP Valentín Cripto

Subsistema aislado para recibir alertas autenticadas de TradingView, procesarlas con FastAPI, simular órdenes y publicar telemetría en un dashboard HTML/Tailwind. No se conecta a Binance ni ejecuta operaciones reales.

- **Tecnologías:** HTML5 + Tailwind CSS, Python y FastAPI.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP Valentín Cripto](mvp-valentin-cripto/docs/ARCHITECTURE.md).
- **Guía de ejecución y despliegue:** [README MVP Valentín Cripto](mvp-valentin-cripto/README.md).

## App Valentín Cripto

Aplicación standalone separada del MVP histórico: autentica webhooks, guarda señales, órdenes simuladas y estado del simulador en una SQLite exclusiva, y ofrece un dashboard local. No usa claves API reales, no se conecta a exchanges ni asume riesgo financiero.

- **Tecnologías:** HTML5 + Tailwind CSS, FastAPI, Python y SQLite.
- **Estado:** Local Standalone / Isolated App.
- **Versión:** `0.1.0`.
- **Acceso local:** dashboard y API en `http://127.0.0.1:8006`.
- **Documentación de arquitectura:** [App Valentín Cripto](app-valentin-cripto/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README App Valentín Cripto](app-valentin-cripto/README.md).

## Portal Ciudadano

PWA y API locales para explorar trámites, reclamos, seguimiento y turnos con datos de demostración. La geolocalización es simulada; el acceso no verifica identidad ni debe recibir datos personales reales.

- **Tecnologías:** React PWA, FastAPI y SQLite exclusiva.
- **Estado:** prototipo local; no integra sistemas municipales ni servicios oficiales.
- **Versión:** `0.1.0`.
- **Acceso local:** frontend `http://127.0.0.1:5174`; API `http://127.0.0.1:8011`.
- **Documentación:** [arquitectura](app-portal-ciudadano/docs/ARCHITECTURE.md) y [README](app-portal-ciudadano/README.md).

## MVP Logística Last-Mile & Smart Fleet

Subsistema local e independiente para gestionar vehículos, conductores y envíos de última milla. Utiliza una base SQLite exclusiva y una simulación local de respaldo SSH/SFTP que no realiza conexiones de red.

- **Tecnologías:** Node.js, TypeScript, Express, Prisma ORM, SQLite, HTML y Tailwind CSS.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP Logística Last-Mile & Smart Fleet](mvp-logistica-fleet/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP Logística Last-Mile & Smart Fleet](mvp-logistica-fleet/README.md).

## MVP AgroTech Smart Crop & Drone Telemetry

Subsistema local e independiente para monitorear lotes agrícolas, recibir telemetría IoT y registrar vuelos de drones. Persiste los datos en una base PostgreSQL exclusiva y ofrece reportes analíticos CSV/PDF.

- **Tecnologías:** Vue.js 3 + Vite + Tailwind CSS + Pinia, Go + Gin y PostgreSQL.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP AgroTech](mvp-agrotech-iot/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP AgroTech](mvp-agrotech-iot/README.md).

## MVP Visitor Pass & Corporate Access Control

Subsistema local e independiente para registrar visitantes, emitir pases temporales y conocer quién permanece dentro del edificio. Utiliza PHP 8 nativo con PDO y una SQLite exclusiva del módulo; no se integra con sistemas de acceso físico ni con otros MVP.

- **Tecnologías:** PHP 8 nativo + PDO, SQLite, HTML5 y Tailwind CSS.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP Visitor Pass](mvp-visitor-pass/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP Visitor Pass](mvp-visitor-pass/README.md).

## Web POS Comercial

Subsistema local e independiente para ventas de mostrador y control básico de turnos. Usa catálogo sintético y pagos declarativos; no procesa transacciones ni reutiliza código, datos o credenciales del respaldo POS histórico.

- **Tecnologías:** React, Vite, Tailwind CSS, FastAPI, SQLModel y SQLite exclusiva.
- **Estado:** Local Standalone / Isolated MVP; no tiene preview en el Demos Hub ni despliegue público.
- **Versión:** `0.1.0`.
- **Acceso local:** frontend `http://127.0.0.1:4204`; API `http://127.0.0.1:8007`.
- **Documentación del subsistema:** [Arquitectura Web POS Comercial](web-pos-comercial/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README Web POS Comercial](web-pos-comercial/README.md).
- **Límites:** no afirma operación del sistema histórico ni conciliación Excel; tarjeta y QR son simulados.

## Tienda Virtual

Aplicación local de catálogo, carrito y órdenes de demostración. Los productos son sintéticos y el checkout no procesa pagos reales.

- **Tecnologías:** React, Vite, FastAPI, SQLModel y SQLite exclusiva.
- **Estado:** MVP local; sin servicios remotos ni despliegue público.
- **Versión:** `0.1.0`.
- **Acceso local:** frontend `http://127.0.0.1:4206`; API `http://127.0.0.1:8010`.
- **Documentación:** [arquitectura](web-tienda-virtual/docs/ARCHITECTURE.md) y [README](web-tienda-virtual/README.md).

## ALANTIA Frigorífico

Subsistema local e independiente para catálogo, proveedores, ingresos de medias res, control de saldos, desposte trazable e informes operativos. Su implementación es nueva y usa datos sintéticos; no reutiliza ni se conecta con el software histórico.

- **Tecnologías:** React + TypeScript + Vite, FastAPI, SQLAlchemy y SQLite exclusiva.
- **Estado:** Local Standalone / Isolated MVP; sin preview del Demos Hub ni despliegue público.
- **Versión:** `0.1.0`.
- **Acceso local:** frontend `http://127.0.0.1:4205`; API `http://127.0.0.1:8008`.
- **Documentación del subsistema:** [Especificación modular](app-alantia-frigorifico/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README ALANTIA Frigorífico](app-alantia-frigorifico/README.md).
- **Límites:** no implementa autenticación, cálculo de rindes, sucursales ni integración con el sistema histórico.

## Portal Municipal de demostración

Landing estática de una municipalidad ficticia. Las secciones y acciones son ilustrativas; no envía trámites, no tiene API ni persistencia y no representa una integración o despliegue real.

- **Tecnologías:** React, Vite, Tailwind CSS y Lucide React.
- **Versión:** `0.1.0`.
- **Acceso local:** `http://127.0.0.1:5176`.
- **Documentación:** [arquitectura](web-landing-municipal/docs/ARCHITECTURE.md) y [README](web-landing-municipal/README.md).

## Landings comerciales independientes

Cinco demos React/Vite con Tailwind CSS 4, componentes, configuración, dependencias y README propios. No comparten estado ni backend; cada formulario, suscripción, cotizador y acción de contacto es demostrativa y local.

| Landing | Enfoque | Código y guía |
|---|---|---|
| El Rincón Gourmet | Restaurante, menú filtrable, reseñas y reservas | [landings/el-rincon-gourmet/README.md](landings/el-rincon-gourmet/README.md) |
| Pluma y Tinta | Autora, libros, fragmentos y newsletter | [landings/pluma-y-tinta/README.md](landings/pluma-y-tinta/README.md) |
| Manos Maestras | Oficios, galería lightbox y encargos | [landings/manos-maestras/README.md](landings/manos-maestras/README.md) |
| EcoHuerta Urbana | Bolsones, planes y calculadora de ahorro | [landings/ecohuerta-urbana/README.md](landings/ecohuerta-urbana/README.md) |
| FixIt Express | Reparación, cotizador y turnos | [landings/fixit-express/README.md](landings/fixit-express/README.md) |

Cada aplicación se inicia desde su directorio con `npm install` y `npm run dev`. Para que sus accesos del Demos Hub apunten a una preview estática, ejecutar el script `npm run build:hub` de cada landing antes de compilar el portfolio; este paso copia los archivos a `ideal-it-portfolio/public/landings/<slug>/`. El [índice de landings comerciales](md/landings-comerciales.md) documenta la ejecución independiente y la integración.

## Service Synthetic Factory

Command Center standalone con cards de identidades y documentos, validadores, conversores y conectores simulados para pruebas manuales de Personal, Auditoría, Visitor Pass, Portal Ciudadano y POS. No se conecta a esos MVP ni comparte sus datos. Todas las tarjetas/PDF muestran marcas destacadas de ficción y no validez; el simulador MCP/webhook no realiza conexiones salientes.

- **Tecnologías:** React 19 + Vite, FastAPI, Faker, Pillow, ReportLab, PyYAML y SQLite exclusiva.
- **Estado:** herramienta de pruebas local, sin autenticación; no es una fuente de identidad ni credenciales y no debe exponerse públicamente.
- **Versión:** `0.1.0`.
- **Acceso local:** UI `http://127.0.0.1:4209`; API `http://127.0.0.1:8009`.
- **Módulos:** generadores de perfiles/matrículas/facturas; validadores de JSON, formatos y archivos; conversiones y mock data; recursos/tools MCP y webhook local simulados.
- **Persistencia:** `service-synthetic-factory/backend/data/db/factory_mvp.db`; claves foráneas activas y directorio de assets propio.
- **Documentación de arquitectura:** [Service Synthetic Factory](service-synthetic-factory/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README Service Synthetic Factory](service-synthetic-factory/README.md).

## Servicios de soporte locales

- **DevOps Monitor `0.1.0`:** dashboard `4175` y API `8765`; consulta únicamente servicios configurados en loopback y no los inicia ni detiene. [README](service-devops-monitor/README.md).
- **MCP Gateway `0.1.0`:** endpoint local `8020`; expone metadatos y estadísticas agregadas de bases permitidas, sin filas, SQL arbitrario ni escrituras. [README](service-mcp-gateway/README.md).
- **Documentación `0.1.0`:** utilidad sin servidor para sincronizar matrices y validar enlaces, puertos, dependencias y SemVer; excluye el archivo histórico `portfolio/`. [README](service-docs-hub-automator/README.md).

## Mapa de documentación

- [Índice documental central](md/README.md) — catálogo, planificación, referencias históricas y resúmenes por categoría.
- [Planificación y avance](md/portfolio-planificacion.md) — estado de los MVP locales, las ocho demos públicas, cinco fichas históricas/propuestas, prioridades y estrategia de integración/despliegue.
- [Manual íntegro de trabajo](md/manual.md) — copia completa del estándar Angular, previews seguras, aislamiento, versionado y validación.
- [Gestión de personas y auditoría](md/01-personas-auditoria.md) — resúmenes de Personal y Auditoría.
- [Trámites e inspecciones](md/02-tramites-inspecciones.md) — resúmenes de Formularios y OSMA.
- [Operaciones, logística e IoT](md/03-operaciones-logistica-iot.md) — resúmenes de Logística y AgroTech.
- [Integraciones y control de accesos](md/04-integraciones-accesos.md) — resúmenes de Cripto y Visitor Pass.
- [Referencias originales](md/referencias-historicas.md) — evidencia localizada, incertidumbres y límites de publicación; los archivos fuente permanecen en `portfolio/`.

El catálogo público de la landing incluye ocho MVP locales y fichas interactivas de referencia/propuesta. Portal Ciudadano, Tienda Virtual, Web POS Comercial, ALANTIA Frigorífico y los servicios utilitarios son subsistemas locales adicionales sin despliegue público. Una preview del navegador no equivale a despliegue público ni a conexión con la API local. No se publica ni reutiliza el archivo de trabajo de clientes restringidos.
