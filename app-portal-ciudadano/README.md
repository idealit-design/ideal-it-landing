# Portal Ciudadano 0.1.0

Subsistema local e independiente para iniciar trámites y reclamos, consultar su seguimiento y reservar turnos web. La UI es una PWA React; la API utiliza FastAPI y una base SQLite exclusiva.

## Requisitos

- Python 3.11 o superior
- Node.js 20 o superior y npm
- Navegador moderno

## Inicio local

### API (terminal 1, PowerShell)

```powershell
cd app-portal-ciudadano\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8011
```

La primera ejecución crea `backend\data\db\portal_ciudadano.db`, los estados de seguimiento y un catálogo inicial de tipos de trámite. La documentación interactiva está en `http://127.0.0.1:8011/docs`.

### PWA (terminal 2)

```powershell
cd app-portal-ciudadano\frontend
npm install
npm start
```

Abrí `http://localhost:5174`. El cliente React utiliza Tailwind CSS para utilidades de interfaz y estilos propios para conservar la identidad visual. Se conecta a `http://127.0.0.1:8011`. Para cambiar la dirección de API en el build, definí `VITE_API_BASE_URL`.

### Pruebas

```powershell
cd app-portal-ciudadano\backend
pip install -r requirements-dev.txt
py -m pytest
```

Las pruebas usan una base temporal dentro del directorio de pytest; no leen ni modifican la base local del módulo.

## Flujo de demostración

1. Ingresá con un DNI/CUIT numérico genérico (7 a 11 dígitos) y un nombre de prueba.
2. Revisá el tablero, cargá un reclamo o iniciá un trámite.
3. Guardá el código generado para consultar las etapas del seguimiento.
4. Reservá un turno en una sede de demostración.
5. Para simular la gestión interna de un estado, usá `PATCH /api/seguimiento/{codigo}/estado` desde la documentación interactiva.

La geolocalización del formulario de reclamos es simulada. El inicio de sesión no autentica identidad ni debe usarse con datos personales reales.

## Aislamiento

- Persistencia exclusiva en `backend/data/db/portal_ciudadano.db`.
- `PORTAL_CIUDADANO_DATABASE_PATH` solo acepta rutas dentro del módulo o del directorio temporal de pruebas; no puede apuntar a bases de otros MVP.
- Frontend, dependencias, configuración CORS y puertos son propios del subsistema (`5174` / `8011`).
- No se conecta a servicios municipales ni fuentes externas. Usar únicamente datos sintéticos.
- La administración de tipos y el cambio de estado no tienen autenticación: son operaciones de demostración para ejecución local y no deben exponerse en una red pública.

Consultá [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para entidades, contratos y límites del MVP.

## Estrategia de Despliegue y Migración

**Prioridad 1 — demo interactiva en VM.** Propuesta: endpoint `127.0.0.1:8013`, límite de contenedor `128m` y SQLite exclusiva en volumen persistente. No está desplegado. Prerrequisitos: configurar el origen de API para el frontend, persistencia aislada y datos ficticios. La autenticación actual no verifica identidad; mantener el servicio privado y no usar datos personales reales.
