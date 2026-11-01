# Operaciones, logística e IoT

## MVP Logística & Smart Fleet `0.1.1`

- **Propósito:** vehículos, conductores, asignación de envíos, tracking y resumen de operación.
- **Stack:** Node.js + TypeScript + Express, Prisma 7 y SQLite exclusiva vía adaptador local; UI HTML/Tailwind servida junto a la API.
- **Ejecución documentada:** UI/API `4100`.
- **Datos e integración:** el reporte SSH/SFTP se genera y registra localmente; no abre sockets ni transfiere archivos.
- **Siguiente paso:** ejecutar build/tipos con las migraciones Prisma en una copia de DB de prueba; añadir autenticación/roles, protección de datos y estrategia de backup antes de desplegar.

Fuentes: [README](../mvp-logistica-fleet/README.md), [arquitectura](../mvp-logistica-fleet/docs/ARCHITECTURE.md).

## MVP AgroTech & Telemetría `0.1.1`

- **Propósito:** lotes/cultivos, lecturas de sensores, vuelos de drones, estados hídricos y reportes.
- **Stack:** Vue 3 + Vite + Pinia, Go/Gin y PostgreSQL exclusivo por `DATABASE_URL`.
- **Ejecución documentada:** UI `5173`; API `8080`.
- **Datos e integración:** ingesta por API; no hay conexión directa a sensores, drones ni proveedor externo. La ingesta por lotes es transaccional.
- **Siguiente paso:** configurar credenciales PostgreSQL por ambiente, migraciones versionadas, TLS/auth de API, límites de ingesta, monitoreo y retención; mantener dispositivos simulados hasta aprobación.

Fuentes: [README](../mvp-agrotech-iot/README.md), [arquitectura](../mvp-agrotech-iot/docs/ARCHITECTURE.md).

## Política común

No compartir DB o credenciales entre productos. Elegir SQLite para demos locales y PostgreSQL cuando el patrón de concurrencia/despliegue lo justifique. Sensores, telemetría y respaldos remotos son simulados salvo que se especifique y verifique un adaptador real.
