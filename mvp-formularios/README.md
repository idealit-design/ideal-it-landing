# MVP Formularios 0.1.2

Subsistema local e independiente para eventos turísticos y municipales gratuitos. Incluye gestión de organizadores y eventos, inscripción ciudadana, aprobación de solicitudes, emisión de QR y control de asistencia con cámara o ingreso manual.

## Requisitos

- Python 3.11 o superior
- Node.js 20.11.1 o superior y npm
- Cámara y navegador compatible para leer QR (opcional; el validador manual también está disponible)

## Ejecución local

### API (terminal 1)

```powershell
cd mvp-formularios\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

La API crea las tablas y la base aislada `backend\data\db\formularios_mvp.db` al iniciar. `FORMULARIOS_MVP_DATABASE_PATH` solo acepta rutas dentro del módulo o del directorio temporal de pruebas y no puede apuntar a la base de otro subsistema. La documentación interactiva de FastAPI está en `http://127.0.0.1:8003/docs`.

### Interfaz Angular + Bootstrap (terminal 2)

```powershell
cd mvp-formularios\frontend
npm install
npm start
```

Abre `http://localhost:4202`. La interfaz consume exclusivamente la API local en el puerto `8003`. El acceso a cámara funciona en localhost (o HTTPS) tras conceder permiso al navegador.

### Pruebas del backend

```powershell
cd mvp-formularios\backend
pip install -r requirements-dev.txt
py -m pytest
```

## Flujo de uso

1. En **Gestión de eventos**, registre primero un organizador (museo, boliche, restaurante o secretaría municipal) y publique un evento.
2. En **Portal ciudadano**, el evento aparece como formulario disponible. Al inscribirse, los eventos sin aprobación emiten QR inmediatamente; los que requieren aprobación quedan pendientes.
3. En **Gestión de eventos**, apruebe o rechace las solicitudes pendientes. La aprobación genera el QR de acceso.
4. En **Escáner de asistencia**, lea el QR desde la cámara o pegue su contenido. Cada QR aprobado registra asistencia una sola vez.

Las fechas y cupos se muestran como parte de la oferta gratuita. La eliminación de eventos con inscripciones se bloquea para proteger el historial.

## Privacidad y límites de la demo

La base de datos se crea exclusivamente en este módulo y no se conecta a servicios externos. Utilice datos ficticios: la aplicación no implementa autenticación ni es un sistema oficial de registro municipal. El código QR es un identificador de acceso aleatorio, no una prueba criptográfica de identidad.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el modelo relacional, contratos de API y aislamiento.

## Estrategia de Despliegue y Migración

**Prioridad 1 — demo interactiva en VM.** Propuesta: UI/API tras endpoint `127.0.0.1:8017`, límite `128m` y SQLite exclusiva en volumen del módulo. No está desplegado; la preview actual no se conecta a este backend. Prerrequisitos: configurar origen de API y CORS; cámara solo bajo `localhost` o HTTPS; datos ficticios. No exponer sin autenticación ni presentar el QR como identidad criptográfica.
