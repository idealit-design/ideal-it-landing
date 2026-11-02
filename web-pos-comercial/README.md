# Web POS Comercial

MVP local e independiente para venta rápida y operación básica de caja. La interfaz React consume únicamente la API FastAPI de este módulo; la API persiste en su SQLite exclusiva.

**Versión:** 0.1.0
**Estado:** demostración local, sin autenticación ni integraciones de pago reales. Tarjeta y QR son medios simulados.

## Requisitos

- Python 3.10 o superior.
- Node.js 20 o superior y npm.

## Inicio local

Terminal 1 — API:

```powershell
cd web-pos-comercial\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8007
```

Terminal 2 — interfaz:

```powershell
cd web-pos-comercial\frontend
npm install
npm run dev
```

Abrir http://127.0.0.1:4204. La documentación interactiva de la API está en http://127.0.0.1:8007/docs. Los puertos `4204` (UI) y `8007` (API) son exclusivos del POS; Vite falla en vez de ocupar silenciosamente otro puerto.

La primera ejecución crea `backend/data/db/pos_mvp.db` y carga productos ficticios. `POS_COMERCIAL_DATABASE_PATH` solo acepta rutas dentro del módulo o del directorio temporal de pruebas; no puede apuntar a bases de otros módulos.

## Funcionalidades

- Apertura de turno con fondo inicial y bloqueo de aperturas concurrentes.
- Catálogo en grilla táctil, búsqueda por nombre/código/categoría y agregado rápido con Enter o lector tipo teclado; carrito con modificación de cantidades.
- Registro de ventas con varios medios: efectivo, tarjeta simulada y QR simulado.
- Validación del importe y cálculo de vuelto en el backend.
- Comprobante HTML en pantalla, con opción del navegador para imprimirlo o guardarlo como PDF.
- Cierre con efectivo esperado, total vendido, desglose por medio y diferencia declarada.
- Pruebas API aisladas con SQLite temporal.

## Verificación

```powershell
cd web-pos-comercial\backend
pip install -r requirements-dev.txt
pytest
```

```powershell
cd web-pos-comercial\frontend
npm install
npm run build
```

## Límites

Este MVP local independiente no procesa pagos, no emite comprobantes fiscales, no gestiona inventario, usuarios ni permisos, y no reemplaza una conciliación contable. Los pagos con tarjeta y QR solo registran una modalidad declarativa para probar el flujo. Es una implementación nueva con datos sintéticos: no importa código, datos ni credenciales del respaldo POS histórico, y no valida conciliación Excel ni operación de ese sistema.

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el modelo, contratos y reglas.

## Estrategia de Despliegue y Migración

**Prioridad 1 — demo interactiva en VM.** Propuesta: endpoint `127.0.0.1:8027`, límite `128m` y SQLite `pos_mvp.db` exclusiva en volumen persistente. No está desplegado ni conectado al Hub. Prerrequisitos: persistencia y datos ficticios; no habilitar medios de pago reales. No exponer sin autenticación y autorización; no representa ni reemplaza el POS histórico o la conciliación contable.
