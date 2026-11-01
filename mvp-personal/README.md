# MVP Personal 0.2.0

Subsistema local e independiente para administración de personal, asistencia, licencias y simulación de fichajes biométricos. Incluye una API FastAPI con SQLite propia y una aplicación Angular standalone con Tailwind CSS.

## Requisitos

- Python 3.10 o superior
- Node.js 20.11.1 o superior y npm

## Ejecución local

### API (terminal 1)

```powershell
cd mvp-personal\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

La API crea el esquema al iniciar en `backend\data\db\personal_mvp.db`. `PERSONAL_MVP_DATABASE_PATH` solo acepta rutas dentro del módulo o del directorio temporal de pruebas, nunca una base de otro subsistema. La documentación interactiva queda en `http://127.0.0.1:8001/docs`.

### Interfaz (terminal 2)

```powershell
cd mvp-personal\frontend
npm install
npm start
```

Abre `http://localhost:4203`. La interfaz consume exclusivamente la API local en el puerto `8001`; la landing Ideal-IT permanece en `4200`.

La aplicación organiza sus capacidades con rutas standalone: `/dashboard` (resumen operativo), `/fichajes`, `/personal`, `/asistencia`, `/licencias` y `/reportes`. Al iniciar, el dashboard muestra estados reales devueltos por la API; si la API no está disponible, presenta el error y no sustituye los datos con valores ficticios.

### Pruebas del backend

```powershell
cd mvp-personal\backend
pip install -r requirements-dev.txt
py -m pytest
```

## Funcionalidades

- Alta, consulta, filtro por DNI y activación/desactivación de personal; organización por área, piso y departamento.
- Simulación de marcas con IP privada de referencia, evento y estado de verificación, con perfiles ZKBio, Suprema e Hikvision. No se conecta a ningún dispositivo.
- Historial de marcas por DNI y altas de licencias médicas, vacaciones u otros motivos.
- Reportes diarios/semanales con cómputos de presencia, ausencia y licencia aprobada; los fines de semana quedan fuera de los cálculos.

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el modelo de datos, endpoints y estrategia de aislamiento.

## Privacidad y límites de la demo

El simulador genera datos sintéticos. No usar información personal real, no configurar conexiones a dispositivos de producción y no interpretar los reportes como registros oficiales de asistencia.
