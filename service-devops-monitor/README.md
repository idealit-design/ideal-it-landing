# Service DevOps Monitor

**Versión:** `0.1.0`

Panel local para comprobar la disponibilidad de los MVP del monorepo. El monitor solo consulta direcciones `127.0.0.1` y los puertos definidos en `config/services.json`; no inicia, modifica ni detiene esos servicios.

## MVP incluidos

La configuración descubre los módulos presentes entre Personal, Auditoría, Formularios, Valentín Cripto, OSMA Inspecciones, Logística Fleet, AgroTech IoT y Visitor Pass. Los servicios con `/health` se evalúan mediante `GET`; Visitor Pass, que no publica ese endpoint, se comprueba por TCP. Los puertos de interfaz también se comprueban por TCP.

OSMA Inspecciones usa el puerto `5175` y AgroTech IoT el `5173`; sus frontends pueden ejecutarse simultáneamente sin colisión.

## Requisitos

- Python 3.11+ y Node.js 20+
- Dependencias instaladas para backend y frontend según los manifiestos locales

## Inicio en Windows / PowerShell

Terminal 1, desde la raíz del monorepo:

```powershell
cd service-devops-monitor\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8765
```

Terminal 2:

```powershell
cd service-devops-monitor\frontend
npm install
npm run dev
```

Abrir `http://127.0.0.1:4175`. La API consolidada está en `http://127.0.0.1:8765/api/summary` y la documentación FastAPI en `/docs`.

## API

- `GET /api/health`: estado del propio monitor.
- `GET /api/services`: sondea endpoints configurados y devuelve el reporte consolidado.
- `GET /api/summary`: reporte y conteos agregados.
- `GET /api/incidents?limit=50`: historial local de cambios de disponibilidad.
- `POST /api/alerts/simulate`: registra una simulación webhook en SQLite; no envía tráfico HTTP a un webhook externo.

Las incidencias se crean al observar el estado inicial de cada MVP y cuando cambia entre `online` y `offline`; las lecturas repetidas no generan duplicados. La base local se guarda en `backend/data/monitor.db`. El uso de memoria es una estimación RSS del proceso que escucha en el puerto API y puede no estar disponible si el sistema operativo no permite consultar el proceso.

Para sumar o ajustar un MVP, edite `config/services.json`. El monitor solo incluye entradas cuyo directorio existe en la raíz y nunca realiza escaneos de rangos de puertos o destinos remotos.

## Pruebas y compilación

```powershell
cd service-devops-monitor\backend
py -m unittest discover -s tests
```

```powershell
cd service-devops-monitor\frontend
npm run build
```

## Estrategia de Despliegue y Migración

**Prioridad 1 — observabilidad local de demos.** Propuesta: dashboard/API bajo `127.0.0.1:8023`, límite `96m` y SQLite propia en volumen persistente. No está desplegado. Prerrequisitos: configurar una lista explícita de objetivos para los servicios locales y comprobar el alcance de red del contenedor; no habilitar escaneo de puertos ni destinos remotos. Alertas externas/webhooks quedan en Prioridad 2 y requerirán adaptador autenticado, HTTPS y secretos por ambiente; actualmente la simulación no envía tráfico.
