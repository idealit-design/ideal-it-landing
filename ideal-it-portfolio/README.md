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
    ├── personal-mvp/             # Preview sintética en memoria; no llama a la API
    ├── auditoria-mvp/             # Bóveda ilustrativa; no llama a la API
    └── formularios-preview/      # Preview en memoria; no llama a la API

../mvp-personal/                  # Angular local + FastAPI + DB personal_mvp.db
../mvp-auditoria/                 # Angular local + FastAPI + DB auditoria_mvp.db
```

El estándar para crear y adaptar MVPs Angular, incluyendo la política de aislamiento, el workflow y las previews del Demos Hub, está en [docs/MANUAL_TRABAJO_ANGULAR_MVPS.md](docs/MANUAL_TRABAJO_ANGULAR_MVPS.md).

Los MVPs no comparten módulos, servicios, modelos de dominio ni tablas. Cada uno conserva su backend y almacenamiento aislados. El catálogo público muestra únicamente referencias a los directorios `mvp-*`; no expone las rutas locales ni los archivos de los respaldos históricos.

El Demos Hub reúne 18 proyectos en tres categorías, con tres previews interactivas y cinco landings comerciales navegables. Las fichas sin preview pública muestran vistas conceptuales y permiten seleccionar el sistema para solicitar una demo; el envío permanece pendiente hasta configurar un canal de contacto. Las previews de `/mvp/formularios`, `/mvp/personal` y `/mvp/auditoria` usan datos sintéticos en memoria; no llaman a APIs locales o privadas, no se conectan a la VM, no persisten y no contienen documentos sensibles. Actualmente, ninguna experiencia del Hub está conectada a un entorno de demo activo en la VM. Las cinco landings comerciales se integran como bundles estáticos independientes.

### Estado de despliegue y migración

Vercel sirve la SPA y los bundles estáticos de las cinco landings. En la VM siguen activos el hub Nginx en `127.0.0.1:8080` y la demo ALANTIA Frigorífico en `127.0.0.1:8012` (límite 128 MiB, SQLite exclusiva). Esta demo no está conectada a Vercel; las demás propuestas `127.0.0.1:80XX` aún no están desplegadas. Los previews permanecen separados de los backends. La planificación está en [plan central](../md/planning/portfolio-planificacion.md); el túnel SSH solo permite acceso privado al operador.

Las tarjetas priorizan categoría, título y descripción, muestran hasta tres tecnologías representativas (frontend, backend y datos cuando están disponibles) y mantienen el enlace de categoría y la acción principal en una sola fila. El borde sutil a color identifica la categoría comercial y el contenido usa una altura compacta y consistente.

Puertos locales actuales: Personal frontend/API `4203`/`8001`; Auditoría `4201`/`8002`; Formularios `4202`/`8003`; OSMA PWA/API `5175`/`8005`. El resto de los MVP se ejecuta de forma independiente según sus README. La guía y planificación centralizadas están en [md/README.md](../md/README.md), y la copia íntegra del manual en [md/manual.md](../md/manual.md).

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

Abre `http://localhost:4200`. Las categorías se visitan en `/desarrollos`, `/aplicaciones` y `/paginas-comerciales` (las rutas anteriores `/categorias/...` redirigen a estas). Las rutas de los módulos/preview son `/mvp/personal`, `/mvp/auditoria` y `/mvp/formularios`.

## Despliegue de la landing en Vercel

Importa el repositorio en Vercel y configura **Root Directory** como `ideal-it-portfolio`. El archivo `vercel.json` establece `npm run build`, publica `dist/ideal-it-portfolio/browser` y reescribe las rutas de categorías y MVP a `index.html`; las rutas Angular responden al navegar y al refrescar.

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

API Personal (terminal 1, desde la raíz del monorepo):

```powershell
cd mvp-personal\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

API Auditoría (terminal 2, desde la raíz del monorepo):

```powershell
cd mvp-auditoria\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

Sus interfaces Angular standalone se ejecutan en terminales separadas con `npm install` y `npm start`, desde `mvp-personal\frontend` (puerto `4203`) y `mvp-auditoria\frontend` (puerto `4201`). Las bases tienen variables y archivos separados:

```powershell
$env:PERSONAL_MVP_DATABASE_PATH = "data\db\personal_mvp.db"
$env:AUDITORIA_MVP_DATABASE_PATH = "data\db\auditoria_mvp.db"
```

La API de personal simula los dispositivos biométricos y reportes; nunca contacta una IP. Auditoría usa documentos, respuestas de padrón y códigos del nomenclador sintéticos: sus endpoints no consultan RENAPER ni una matrícula oficial y no contienen documentación clínica real. No cargar datos personales, documentos médicos ni notas clínicas reales en estos MVPs.

## Endpoints locales

Los contratos REST completos y diagramas ERD están en [la arquitectura de Personal](../mvp-personal/docs/ARCHITECTURE.md) y [la arquitectura de Auditoría](../mvp-auditoria/docs/ARCHITECTURE.md). Las previews del Demos Hub no consumen estos endpoints.

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
