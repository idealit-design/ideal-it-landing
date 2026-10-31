# Portfolio Hub — Ideal-IT

## Matriz de soluciones

| Solución | Versión | Tecnologías | Estado | Casos de uso demostrables |
|---|---|---|---|---|
| MVP Personal | `v0.1.1` | Angular standalone, Tailwind CSS, FastAPI, SQLAlchemy, SQLite | Local Standalone / Isolated MVP | Control biométrico IP simulado (ZKBio/Suprema/Hikvision); gestión de nómina y licencias; reportes de días hábiles de lunes a viernes. |
| MVP Auditoría | `v0.1.1` | Angular standalone, FastAPI, SQLAlchemy, SQLite | Local Standalone / Isolated MVP | Gestión de prestadores, bóveda documental local, validaciones mock de identidad/matrícula y autorización de prácticas. |
| MVP Formularios | `0.1.1` | Angular standalone, Bootstrap, FastAPI, SQLAlchemy, SQLite | Local Standalone / Isolated MVP | Publicación de eventos turísticos gratuitos, inscripción y aprobación ciudadana, emisión de QR y registro local de asistencia. |
| MVP Valentín Cripto | `0.1.1` | HTML5, Tailwind CSS, FastAPI, Python | Local Standalone / Isolated MVP | Recepción autenticada de señales TradingView, simulación local de órdenes/balance y telemetría de estrategia. |
| MVP OSMA Inspecciones | `0.1.1` | React PWA, FastAPI, SQLAlchemy, SQLite | Local Standalone / Isolated MVP | Digitalización mobile-first de planillas de campo, consulta de afiliados y sincronización offline/online simulada. |
| MVP Logística Last-Mile & Smart Fleet | `0.1.1` | Node.js, TypeScript, Express, Prisma ORM, SQLite, HTML, Tailwind CSS | Local Standalone / Isolated MVP | Gestión de flota y conductores, asignación de envíos de última milla, tracking y respaldo SSH/SFTP simulado. |
| MVP AgroTech Smart Crop & Drone Telemetry | `0.1.1` | Vue.js 3, Vite, Tailwind CSS, Pinia, Go, Gin, PostgreSQL | Local Standalone / Isolated MVP | Monitoreo de humedad y salud de lotes, ingesta de sensores y vuelos de drones, reportes CSV/PDF. |
| MVP Visitor Pass & Corporate Access Control | `0.1.1` | PHP 8 nativo con PDO, SQLite, HTML5, Tailwind CSS | Local Standalone / Isolated MVP | Registro de visitantes, emisión de pases temporales y control de ingresos y salidas corporativas. |

## MVP Personal

Subsistema local de gestión de personal, licencias y asistencia. Su simulador biométrico crea marcas sintéticas y no intenta conectarse a relojes reales. El backend usa una SQLite exclusiva y no requiere SQL Server PJE ni el esquema de Prestadores/Auditoría.

- **Tecnologías:** Angular standalone + Tailwind CSS, FastAPI, SQLAlchemy y SQLite.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP Personal](mvp-personal/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP Personal](mvp-personal/README.md).

## MVP Auditoría

Subsistema local e independiente para auditoría de prestadores y prácticas. Los documentos se almacenan en una carpeta local, los metadatos en una SQLite dedicada y las validaciones de identidad/matrícula son exclusivamente mocks locales.

- **Tecnologías:** Angular standalone, FastAPI, SQLAlchemy y SQLite.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP Auditoría](mvp-auditoria/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP Auditoría](mvp-auditoria/README.md).

## MVP Formularios

Subsistema local e independiente para turismo y eventos municipales. Gestiona organizadores, eventos gratuitos, inscripción ciudadana, aprobación opcional, emisión de códigos QR y validación de asistencia por cámara o ingreso manual.

- **Tecnologías:** Angular standalone + Bootstrap, FastAPI, SQLAlchemy y SQLite.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP Formularios](mvp-formularios/docs/ARCHITECTURE.md).
- **Guía de ejecución:** [README MVP Formularios](mvp-formularios/README.md).

## MVP Valentín Cripto

Subsistema aislado para recibir alertas autenticadas de TradingView, procesarlas con FastAPI, simular órdenes y publicar telemetría en un dashboard HTML/Tailwind. No se conecta a Binance ni ejecuta operaciones reales.

- **Tecnologías:** HTML5 + Tailwind CSS, Python y FastAPI.
- **Estado:** Local Standalone / Isolated MVP.
- **Versión:** `0.1.1`.
- **Documentación del subsistema:** [Arquitectura MVP Valentín Cripto](mvp-valentin-cripto/docs/ARCHITECTURE.md).
- **Guía de ejecución y despliegue:** [README MVP Valentín Cripto](mvp-valentin-cripto/README.md).

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

## Mapa de documentación

- [Arquitectura MVP Personal v0.1.1](mvp-personal/docs/ARCHITECTURE.md) — ER, contrato REST, reglas laborables y aislamiento.
- [Guía rápida MVP Personal](mvp-personal/README.md) — instalación y ejecución local de API, interfaz y pruebas.
- [Arquitectura MVP Auditoría v0.1.1](mvp-auditoria/docs/ARCHITECTURE.md) — ER, contrato REST y aislamiento.
- [Guía rápida MVP Auditoría](mvp-auditoria/README.md) — instalación y ejecución local de API, interfaz y pruebas.
- [Arquitectura MVP Formularios v0.1.1](mvp-formularios/docs/ARCHITECTURE.md) — ERD, endpoints y estrategia de aislamiento.
- [Guía rápida MVP Formularios](mvp-formularios/README.md) — instalación y ejecución local de FastAPI y Angular/Bootstrap.
- [Arquitectura MVP Valentín Cripto v0.1.1](mvp-valentin-cripto/docs/ARCHITECTURE.md) — flujo de webhooks, contratos API, simulador y aislamiento.
- [Guía de despliegue MVP Valentín Cripto](mvp-valentin-cripto/README.md) — ejecución local y despliegue en VM Oracle Cloud/AWS con HTTPS.
- [Arquitectura MVP OSMA Inspecciones v0.1.1](mvp-osma-inspecciones/docs/ARCHITECTURE.md) — ERD, endpoints REST y sincronización offline/online.
- [Guía rápida MVP OSMA Inspecciones](mvp-osma-inspecciones/README.md) — instalación y ejecución local de FastAPI y React/PWA.
- [Arquitectura MVP Logística Last-Mile & Smart Fleet v0.1.1](mvp-logistica-fleet/docs/ARCHITECTURE.md) — ERD, contratos REST y simulador de respaldo.
- [Guía rápida MVP Logística Last-Mile & Smart Fleet](mvp-logistica-fleet/README.md) — instalación y ejecución local de Node.js, TypeScript y Prisma.
- [Arquitectura MVP AgroTech v0.1.1](mvp-agrotech-iot/docs/ARCHITECTURE.md) — ERD, contratos API REST y exportación analítica.
- [Guía rápida MVP AgroTech](mvp-agrotech-iot/README.md) — instalación y ejecución local de PostgreSQL, Go/Gin y Vue/Vite.
- [Arquitectura MVP Visitor Pass v0.1.1](mvp-visitor-pass/docs/ARCHITECTURE.md) — ERD, API JSON y flujo de control de ingresos y salidas.
- [Guía rápida MVP Visitor Pass](mvp-visitor-pass/README.md) — ejecución local de PHP 8, PDO y SQLite.
