# MVP OSMA Inspecciones 0.1.1

Subsistema local e independiente para digitalizar las planillas de inspección de campo de OSMA. Incluye una interfaz React instalable como PWA, consulta local de afiliados y una cola persistente en el dispositivo para trabajar sin conexión y sincronizar al recuperar conectividad.

## Requisitos

- Python 3.11 o superior
- Node.js 20 o superior y npm
- Navegador moderno; HTTPS o `localhost` para instalar la PWA

## Ejecución local

### API (terminal 1, PowerShell)

```powershell
cd mvp-osma-inspecciones\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8003
```

La API crea el esquema y los datos ficticios de demostración en `backend\data\db\osma_mvp.db`. La ruta se puede cambiar mediante `OSMA_MVP_DATABASE_PATH`. La documentación interactiva está en `http://127.0.0.1:8003/docs`.

### PWA React (terminal 2)

```powershell
cd mvp-osma-inspecciones\frontend
npm install
npm start
```

Abrí `http://localhost:5173`. La PWA usa la API local en el puerto `8003`. Si la API se despliega en otra dirección, definí `VITE_API_BASE_URL` en el entorno de compilación de Vite antes de ejecutar `npm run build`.

### Pruebas

```powershell
cd mvp-osma-inspecciones\backend
pip install -r requirements-dev.txt
py -m pytest
```

## Uso del módulo

1. Seleccioná el inspector y buscá un afiliado por DNI o nombre. La interfaz muestra el plan y bloquea la carga si la cobertura está suspendida.
2. Completá el acta de campo con número, fecha, dirección, contacto, CUIT, tipo y las dos observaciones de la planilla física.
3. Guardá la planilla. Se persiste en el dispositivo primero y se envía al backend si hay conexión; sin conexión queda en la cola local.
4. En **Sincronización**, enviá la cola cuando vuelva la conectividad. El servidor usa el identificador local para evitar duplicados si se reintenta un envío.

La primera ejecución crea un inspector y tres afiliados de demostración, todos ficticios. El backend también permite registrar inspectores por `POST /api/inspectores`. No se importan los datos personales del sistema OSMA de referencia.

## Despliegue en VM

En Ubuntu Server, instalá Python, crea un entorno virtual y ejecutá Uvicorn escuchando en el puerto `8003`. Para servir la API directamente en una red privada:

```bash
cd mvp-osma-inspecciones/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8003
```

Configurá `OSMA_MVP_CORS_ORIGINS` con los orígenes reales del frontend, separados por comas. Para un entorno expuesto, terminá TLS en un proxy inverso y restringí el acceso al puerto/API: esta demo no implementa autenticación ni autorización.

## Privacidad y límites

La base SQLite y la cola offline del navegador son locales a este MVP; no se conectan con las bases ni APIs del sistema de referencia ni con servicios externos. La cola usa `localStorage` del dispositivo y no cifra los datos. Usá datos ficticios durante la demostración y protegé el dispositivo de campo. La solución no sustituye un sistema oficial ni una política de retención de datos.

Consultá [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el modelo relacional, contratos REST y estrategia offline.
