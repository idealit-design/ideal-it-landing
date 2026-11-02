# Operaciones, logística e IoT

## MVP Logística & Smart Fleet `0.1.1`

- **Propósito:** vehículos, conductores, asignación de envíos, tracking y resumen de operación.
- **Stack:** Node.js + TypeScript + Express, Prisma 7 y SQLite exclusiva vía adaptador local; UI HTML/Tailwind servida junto a la API.
- **Ejecución documentada:** UI/API `4100`.
- **Datos e integración:** el reporte SSH/SFTP se genera y registra localmente; no abre sockets ni transfiere archivos.
- **Siguiente paso:** ejecutar build/tipos con las migraciones Prisma en una copia de DB de prueba; añadir autenticación/roles, protección de datos y estrategia de backup antes de desplegar.

Fuentes: [README](../../mvp-logistica-fleet/README.md), [arquitectura](../../mvp-logistica-fleet/docs/ARCHITECTURE.md).

## MVP AgroTech & Telemetría `0.1.1`

- **Propósito:** lotes/cultivos, lecturas de sensores, vuelos de drones, estados hídricos y reportes.
- **Stack:** Vue 3 + Vite + Pinia, Go/Gin y PostgreSQL exclusivo por `DATABASE_URL`.
- **Ejecución documentada:** UI `5173`; API `8080`.
- **Datos e integración:** ingesta por API; no hay conexión directa a sensores, drones ni proveedor externo. La ingesta por lotes es transaccional.
- **Siguiente paso:** configurar credenciales PostgreSQL por ambiente, migraciones versionadas, TLS/auth de API, límites de ingesta, monitoreo y retención; mantener dispositivos simulados hasta aprobación.

Fuentes: [README](../../mvp-agrotech-iot/README.md), [arquitectura](../../mvp-agrotech-iot/docs/ARCHITECTURE.md).

## App ALANTIA Frigorífico `0.1.0`

- **Propósito:** registrar proveedores y catálogo, recibir medias res, trazar despostes y consultar/ajustar saldos.
- **Stack:** React + TypeScript, FastAPI, SQLAlchemy y SQLite exclusiva.
- **Estado VM:** desplegada y saludable en `127.0.0.1:8012`; UI y API se sirven desde el mismo contenedor, limitado a 128 MiB.
- **Persistencia:** volumen dedicado `app-alantia-frigorifico-sqlite`; no comparte DB ni volumen con otros subsistemas.
- **Datos:** proveedores y catálogo iniciales vacíos; las pruebas usan datos ficticios en bases temporales. No cargar información real en la demo.
- **Fuentes:** [README](../../app-alantia-frigorifico/README.md), [arquitectura](../../app-alantia-frigorifico/docs/ARCHITECTURE.md).

## Política común

No compartir DB o credenciales entre productos. Elegir SQLite para demos locales y PostgreSQL cuando el patrón de concurrencia/despliegue lo justifique. Sensores, telemetría y respaldos remotos son simulados salvo que se especifique y verifique un adaptador real.

## Estrategia de despliegue y migración

| Subsistema | Prioridad | Propuesta VM y persistencia | Prerrequisitos |
|---|---|---|---|
| ALANTIA Frigorífico | 1 — desplegada | Puerto `127.0.0.1:8012`, límite de 128 MiB; SQLite exclusiva en volumen propio. | Salud verificada; UI/API desde un contenedor; no conectada al Hub de Vercel. Mantener el loopback y revisar memoria antes de sumar servicios. |
| Logística & Fleet | 1 — demo interactiva | Puerto `127.0.0.1:8018`, límite de 128 MiB; SQLite propia mediante volumen exclusivo de Prisma. | Ruta de datos persistente y migraciones explícitas; reporte SSH/SFTP sigue simulado, sin conexiones salientes. |
| AgroTech & IoT | 1 — demo interactiva, condicionada | Puerto `127.0.0.1:8015`; API limitada a 128 MiB y PostgreSQL separado con límite inicial propuesto de 192 MiB, en red privada sin puerto publicado. | Medir RAM real antes de iniciar; usar DB y credenciales exclusivas, migraciones y datos sintéticos. Postergar si el host entra en presión de memoria/swap. Sensores y drones siguen simulados. |

Salvo ALANTIA Frigorífico, los puertos y límites son objetivos de diseño y no servicios desplegados. Ejecutar demos nuevas de a una; no compartir bases ni credenciales.
