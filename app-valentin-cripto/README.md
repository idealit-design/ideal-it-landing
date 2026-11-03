# App Valentín Cripto 0.1.0

Aplicación local e independiente para recibir señales de trading simuladas, validarlas con un secreto de webhook y registrar señales, órdenes y estado del simulador en su SQLite propia. Incluye un dashboard ligero servido por FastAPI.

> **Límites de seguridad y alcance:** el módulo no usa claves API reales, no se conecta a Binance ni a ningún exchange, y no envía órdenes fuera de este proceso. El balance, las posiciones y el PnL son ficticios; no existe riesgo financiero ni asesoramiento de inversión. Use secretos y datos de prueba, y no exponga el servicio a Internet sin controles adicionales.

## Requisitos

- Python 3.11 o superior.
- PowerShell en Windows, o una terminal compatible.

## Inicio aislado en Windows

Desde la raíz del monorepo:

```powershell
cd app-valentin-cripto\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:WEBHOOK_SECRET = "reemplazar-por-un-secreto-largo-y-aleatorio"
uvicorn app.main:app --host 127.0.0.1 --port 8006
```

Abra el dashboard en `http://127.0.0.1:8006`, la documentación OpenAPI en `/docs` y el estado de salud en `/health`. API y frontend comparten origen; el puerto `8006` es independiente de los otros MVP del portfolio.

La única base de datos es `backend/data/db/cripto_mvp.db`. Se crea automáticamente al iniciar la API y conserva señales aceptadas, órdenes simuladas, balance y posiciones entre reinicios. No comparta esta base con otros subsistemas.

## Webhook autenticado

`POST /api/webhook/tradingview` recibe JSON y responde `202` si el secreto configurado en `WEBHOOK_SECRET` coincide:

```json
{
  "key": "el-mismo-secreto-configurado-en-WEBHOOK_SECRET",
  "event_id": "demo-001",
  "strategy": "Estrategia de prueba",
  "symbol": "BTCUSDT",
  "action": "buy",
  "quantity": 0.01,
  "price": 60000
}
```

Se admite `token` como alternativa a `key` y el campo legado `"1"` como alternativa a `quantity`. `event_id` es opcional; si se repite, la API responde `409` para evitar procesar dos veces el mismo evento. Sin secreto configurado devuelve `503`; credenciales incorrectas, `401`; payload inválido, `422`. El secreto nunca se almacena en SQLite.

## API local

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/` | Dashboard del simulador. |
| `GET` | `/health` | Estado y versión. |
| `GET` | `/api/telemetry` | Métricas, últimas señales, órdenes y estado del simulador. |
| `GET` | `/api/simulator/balance` | Balance y posiciones simulados persistidos. |
| `POST` | `/api/webhook/tradingview` | Autentica y procesa una señal exclusivamente simulada. |
| `GET` | `/docs` | Especificación OpenAPI local. |

## Pruebas

```powershell
cd app-valentin-cripto\backend
pip install -r requirements-dev.txt
py -m pytest
```

Las pruebas usan bases temporales; no escriben datos en la SQLite del módulo.

## Documentación y catálogo

- [Arquitectura](docs/ARCHITECTURE.md).
- [Hub del portfolio](../PORTFOLIO_HUB.md).
- [Contexto de planificación](../md/planning/portfolio-planificacion.md).
- [Resumen de integraciones y webhooks](../md/domains/04-integraciones-accesos.md).

Este directorio es una aplicación nueva y separada del subsistema anterior `mvp-valentin-cripto`; no reemplaza ni modifica su funcionamiento.

## Estrategia de Despliegue y Migración

**Prioridad 1 — demo interactiva en VM.** Propuesta: dashboard/API en `127.0.0.1:8014`, `mem_limit: 128m` y SQLite propia en volumen persistente. No está desplegado. Usar solo eventos sintéticos y un `WEBHOOK_SECRET` de prueba inyectado desde un gestor local de secretos; nunca incorporar su valor en Git. No reutilizar la base del MVP de señales ni habilitar órdenes reales.
