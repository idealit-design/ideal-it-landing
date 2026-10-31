# Ideal-IT Portfolio

Portfolio interactivo de demos construido con Angular 18, componentes standalone y Tailwind CSS 3.

## Requisitos

- Node.js 20.11.1 o superior (Angular 18)
- npm
- Python 3.10 o superior para las APIs FastAPI

## Estructura

```text
src/app/
├── core/                         # Tipos y servicios exclusivos del hub
├── shared/components/            # Presentación reutilizable, sin lógica de negocio
└── features/
    ├── demos-hub/
    ├── personal-mvp/             # UI y cliente API de Personal & Biométrico
    ├── auditoria-mvp/            # UI y cliente API de Auditoría documental
    └── formularios-preview/     # Preview en memoria; no llama a la API del MVP

backend/
├── personal/                     # App FastAPI, esquema y DB propios
│   └── data/db/personal_mvp.db
└── auditoria/                    # App FastAPI, esquema y DB propios
    └── data/db/auditoria_mvp.db
```

Los MVPs no comparten módulos, servicios, modelos de dominio ni tablas. Solo reutilizan patrones de UI (Angular standalone y Tailwind). Los backends y sus esquemas SQLite están aislados. El catálogo del hub mapea los MVP actuales con sus antecedentes en `portfolio/` mediante referencias relativas visibles en el detalle, sin importar ni modificar código de esos proyectos.

Las tarjetas muestran el estado **MVP local**. Formularios agrega una preview interactiva en `/mvp/formularios` para recorrer la publicación de eventos, inscripción, aprobación y validación simulada de asistencia. La preview usa datos ficticios en memoria del navegador: no se conecta a FastAPI, no persiste y no emite QR escaneables. El MVP completo conserva Angular + Bootstrap, FastAPI y su SQLite exclusiva en `..\mvp-formularios`. Personal y Auditoría requieren sus APIs locales y no tienen URLs públicas configuradas. OSMA es una PWA React y se presenta como referencia del portfolio; no se migra a Angular ni se integra en este frontend.

## Crear el frontend desde cero

```powershell
npx --yes @angular/cli@18 new ideal-it-portfolio --standalone --routing --style css
cd ideal-it-portfolio
npm install --save-dev tailwindcss@^3 postcss autoprefixer
npx tailwindcss init
```

`tailwind.config.js` escanea templates y componentes Angular:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: { extend: {} },
  plugins: [],
};
```

`src/styles.css` comienza con:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Ejecutar

Frontend:

```powershell
npm start
```

Abre `http://localhost:4200`. Las rutas de los módulos/preview son `/mvp/personal`, `/mvp/auditoria` y `/mvp/formularios`.

## Despliegue de la landing en Vercel

Importa el repositorio en Vercel y configura **Root Directory** como `ideal-it-portfolio`. El archivo `vercel.json` establece `npm run build`, publica `dist/ideal-it-portfolio/browser` y reescribe las rutas SPA hacia `index.html`; las rutas Angular responden al navegar y al refrescar.

Vercel publica esta aplicación Angular estática. `vercel.json` reescribe las rutas de la SPA a `index.html`, incluido el acceso directo o refresco de `/mvp/formularios`. La preview de Formularios es código Angular de presentación con datos temporales, no una conexión al backend. El MVP standalone de Turismo/Eventos, Personal y Auditoría permanecen independientes: sus APIs FastAPI y bases SQLite no se despliegan con la landing ni se exponen como servicios públicos.

### Ejecutar el MVP Formularios local completo (opcional)

La preview alojada en la landing no necesita backend. Para probar el subsistema real con FastAPI, QR y SQLite en una terminal separada desde `ideal-it-portfolio`:

```powershell
cd ..\mvp-formularios\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

La guía completa de ejecución de Angular + Bootstrap y pruebas está en [la documentación del MVP Formularios](../mvp-formularios/README.md). Este backend corre localmente y no es una API de Vercel.

WhatsApp, LinkedIn y correo se muestran como canales pendientes de configurar; no hay enlaces ficticios activos.

API Personal (terminal 1):

```powershell
cd backend\personal
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8001
```

API Auditoría (terminal 2):

```powershell
cd backend\auditoria
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8002
```

Se pueden cambiar las ubicaciones de las bases de datos sin modificar código:

```powershell
$env:PERSONAL_DATABASE_PATH = "data\db\personal_mvp.db"
$env:AUDITORIA_DATABASE_PATH = "data\db\auditoria_mvp.db"
```

La API de personal simula los dispositivos biométricos y reportes; nunca contacta una IP. Auditoría usa documentos, respuestas de padrón y códigos del nomenclador sintéticos: sus endpoints no consultan RENAPER ni una matrícula oficial y no contienen documentación clínica real. No cargar datos personales, documentos médicos ni notas clínicas reales en estos MVPs.

## Endpoints locales

Personal (`http://127.0.0.1:8001`):

- `GET /api/personal/staff`, `POST /api/personal/staff`
- `GET /api/personal/areas`, `POST /api/personal/areas`
- `GET /api/personal/leaves`, `POST /api/personal/leaves`
- `POST /api/personal/biometrics/connect` (simulado)
- `GET /api/personal/biometrics/reports?period=day|week&dni=...`

Auditoría (`http://127.0.0.1:8002`):

- `GET /api/auditoria/documents`
- `GET /api/auditoria/registry/matricula/{license_number}` (simulado)
- `GET /api/auditoria/registry/renaper/{dni}` (simulado)
- `GET /api/auditoria/nomenclator?specialty=...&q=...`
- `POST /api/auditoria/cases`

## Pruebas y compilación

```powershell
npm run build
npm test -- --watch=false
```

Con las dependencias de desarrollo instaladas:

```powershell
cd backend\personal
py -m pytest
cd ..\auditoria
py -m pytest
```
