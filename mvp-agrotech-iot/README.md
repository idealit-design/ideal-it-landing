# MVP AgroTech Smart Crop & Drone Telemetry 0.1.1

Subsistema local, independiente y aislado para gestionar lotes agrícolas, telemetría de sensores IoT y vuelos de drones. La API está implementada en Go/Gin y persiste en PostgreSQL; el dashboard es una SPA Vue 3 + Vite.

## Requisitos

- Go 1.22 o superior.
- Node.js 20 o superior y npm.
- PostgreSQL 14 o superior, o Docker Desktop.

## 1. Iniciar PostgreSQL

Con Docker:

```powershell
docker run --name agrotech-postgres `
  -e POSTGRES_USER=agrotech `
  -e POSTGRES_PASSWORD=agrotech_local `
  -e POSTGRES_DB=agrotech_iot `
  -p 5432:5432 `
  -d postgres:16
```

La API crea las tablas e índices al iniciar. Para reutilizar una instancia existente, configure `DATABASE_URL` como variable de entorno, por ejemplo:

```powershell
$env:DATABASE_URL = "postgres://agrotech:agrotech_local@localhost:5432/agrotech_iot?sslmode=disable"
```

No comparta esta base con otros MVP. Los valores predeterminados son para desarrollo local únicamente.

## 2. Ejecutar backend Go/Gin

Desde la carpeta del backend:

```powershell
cd mvp-agrotech-iot\backend
go mod tidy
go run main.go
```

La API queda en `http://localhost:8080`. `PORT` cambia el puerto. `CORS_ORIGIN` acepta el origen del frontend y por defecto es `http://localhost:5173`. La comprobación de disponibilidad es `GET /health`.

## 3. Ejecutar Vue/Vite

En otra terminal, desde la raíz del subsistema:

```powershell
cd mvp-agrotech-iot\frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. El cliente usa `http://localhost:8080` como API por defecto. Para cambiarlo, cree `frontend/.env.local` con:

```dotenv
VITE_API_URL=http://localhost:8080
```

## Funcionalidades

- ABM de lotes y cultivos, con estado sanitario y humedad más reciente.
- Ingesta atómica de hasta 1000 lecturas y vuelos de drones por solicitud.
- Actualización del estado hídrico al recibir humedad: hasta 20% `CRITICO`, hasta 35% `ALERTA_HIDRICA` y más de 35% `OPTIMO`.
- Dashboard con superficie, alertas, distribución visual de lotes, humedad reciente e historial.
- Descarga de auditoría y rendimiento en CSV o PDF.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el ERD y los contratos REST. La muestra es local: no integra proveedores de drones ni servicios externos de mapas.
