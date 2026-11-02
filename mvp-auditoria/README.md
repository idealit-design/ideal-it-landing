# MVP Auditoría 0.1.2

Subsistema local e independiente para registrar prestadores, consultar validaciones simuladas, almacenar documentos y resolver casos de auditoría. Los datos se guardan en una SQLite propia y los archivos se almacenan en disco local.

## Requisitos

- Python 3.10 o superior
- Node.js 20.11.1 o superior y npm

## Ejecución local

### API (terminal 1)

```powershell
cd mvp-auditoria\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

La API crea el esquema en `backend\data\db\auditoria_mvp.db` y los documentos en `backend\data\storage`. `AUDITORIA_MVP_DATABASE_PATH` solo acepta rutas dentro del módulo o del directorio temporal de pruebas; `AUDITORIA_MVP_STORAGE_PATH` permite elegir otra carpeta local. La documentación interactiva está en `http://127.0.0.1:8002/docs`.

### Interfaz (terminal 2)

```powershell
cd mvp-auditoria\frontend
npm install
npm start
```

Abre `http://localhost:4201`. La interfaz consume únicamente la API local del puerto `8002`.

### Pruebas del backend

```powershell
cd mvp-auditoria\backend
pip install -r requirements-dev.txt
py -m pytest
```

## Funcionalidades

- Alta y consulta de prestadores; verificación mock de identidad RENAPER y matrícula nacional.
- Carga local y previsualización de PDF, PNG y JPEG; los documentos no se envían a ningún servicio externo.
- Búsqueda del nomenclador por código, descripción o especialidad.
- Apertura de casos y resolución de prácticas. La aprobación valida los estados del prestador y los documentos requeridos por el código.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el modelo de datos, contratos REST y aislamiento.

## Privacidad y límites de la demo

Los conectores de validación son mocks locales y no consultan RENAPER, entidades de matrícula, aseguradoras ni servicios remotos. Utilice datos y documentos sintéticos; esta demo no es un sistema oficial de auditoría médica.

## Estrategia de Despliegue y Migración

**Prioridad 1 — demo interactiva en VM.** Propuesta: endpoint `127.0.0.1:8016`, límite `128m`, SQLite propia en volumen persistente y documentos en directorio de almacenamiento exclusivo. No está desplegado; la preview del portfolio sigue siendo sintética y no invoca esta API. Prerrequisitos: CORS/origen del cliente, cuotas para archivos, política de borrado y datos ficticios. No exponer sin autenticación/autorización; nunca cargar documentos clínicos reales.
