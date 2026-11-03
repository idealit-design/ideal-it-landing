# Tienda Virtual Ideal-IT 0.1.0

Subsistema local e independiente para explorar un catálogo, filtrar productos, administrar un carrito y confirmar órdenes de demostración. La API FastAPI y la interfaz React/Vite se ejecutan localmente y no dependen de la landing ni de otros MVP.

## Requisitos

- Python 3.10 o superior
- Node.js 20.11.1 o superior y npm

## Ejecución local

### API (terminal 1)

```powershell
cd web-tienda-virtual\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

La API crea el esquema y datos iniciales sintéticos en `backend\data\db\tienda_mvp.db`. `TIENDA_DATABASE_PATH` solo acepta rutas dentro del módulo o del directorio temporal de pruebas. La documentación interactiva está en `http://127.0.0.1:8010/docs`.

### Interfaz (terminal 2)

```powershell
cd web-tienda-virtual\frontend
npm install
npm run dev
```

Abre `http://localhost:4206`. El cliente se conecta únicamente a la API local `http://127.0.0.1:8010`; no usa servicios remotos ni la API de la landing.

### Pruebas del backend

```powershell
cd web-tienda-virtual\backend
pip install -r requirements-dev.txt
py -m pytest
```

## Funcionalidades

- Catálogo con búsqueda por nombre, filtros por categoría y ficha de detalle.
- Alta, consulta, actualización y eliminación de productos; gestión básica de categorías por API.
- Carrito reactivo con ajuste de cantidades, cálculo de subtotales y validación de stock.
- Checkout que registra la orden, descuenta inventario y muestra una confirmación persistida.
- Estado de pago `simulado_aprobado`: no se recopilan datos de tarjeta ni se invoca una pasarela.

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el ERD, contratos de API y límites de la demo.

## Límites de la demo

Esta tienda usa datos y pagos sintéticos. El carrito vive en memoria en la API y se identifica por una clave anónima del navegador; se borra al reiniciar el backend. Las órdenes y el catálogo sí se guardan en la SQLite del módulo. No utilizar con pagos, clientes o inventario reales.

## Estrategia de Despliegue y Migración

**Prioridad 1 — demo interactiva en VM.** Propuesta: endpoint `127.0.0.1:8028`, límite `128m` y SQLite `tienda_mvp.db` exclusiva en volumen persistente. No está desplegado. Prerrequisitos: configurar el origen API, mantener datos sintéticos y preservar el carácter simulado del checkout. No exponer sin autenticación ni integrar pasarelas de pago reales.
