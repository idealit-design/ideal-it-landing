# MVP Logística Last-Mile & Smart Fleet 0.1.1

Subsistema local, independiente y aislado para gestión de flota, conductores, tracking de última milla y telemetría básica. El backend usa Node.js, TypeScript, Express, Prisma ORM 7 y una base SQLite propia del módulo, conectada mediante el adaptador de Prisma para `better-sqlite3`.

> **Alcance de seguridad:** el endpoint SSH/SFTP es un simulador. Genera un reporte JSON en memoria y registra una transferencia ficticia; no abre conexiones de red ni transmite datos a servidores.

## Requisitos

- Node.js 20 o superior y npm.
- Windows, macOS o Linux.

## Instalación y ejecución local

Desde la raíz del subsistema:

```powershell
cd ideal-it-portfolio\mvp-logistica-fleet\backend
Copy-Item .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

La API y el dashboard se sirven juntos en `http://127.0.0.1:4100`. Configure `PORT` en `backend/.env` si necesita otro puerto. `DATABASE_URL="file:./prisma/dev.db"` mantiene la base local dentro de `backend/prisma/`. No se comparte base de datos con los demás MVP.

Para comprobar tipos y generar Prisma Client:

```powershell
npm run db:generate
npm run build
```

Para ejecutar la compilación de producción después de construir:

```powershell
npm start
```

## Funcionalidades

- Alta y consulta de vehículos y conductores; cambio de estado operativo de vehículos.
- Registro de envíos con tracking único. Se asigna automáticamente un vehículo disponible y un conductor sin envíos activos; si no hay recursos, queda pendiente para asignación posterior.
- Asignación posterior y actualización del estado del envío. Al entregar el último envío activo, el vehículo vuelve a estar disponible.
- Resumen visual de flota, envíos y conductores; formulario de alta de vehículos y envíos.
- Generación de reporte diario y registro de respaldo remoto SSH/SFTP simulado.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el ERD, endpoints y reglas operativas.
