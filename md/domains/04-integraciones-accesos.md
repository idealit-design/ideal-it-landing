# Integraciones y control de accesos

## MVP Automatización de Señales `0.1.1`

- **Propósito:** recibir webhooks de TradingView, validar secreto, simular órdenes y mostrar telemetría.
- **Stack:** Python/FastAPI, dashboard HTML/Tailwind y log de auditoría JSONL local. No tiene una DB transaccional.
- **Ejecución documentada:** API/UI `8004`; despliegue en VM AWS/OCI descrito como guía, no como instancia existente.
- **Límite duro:** las órdenes, posiciones y balance son simulados en memoria; no hay cliente Binance ni operación real. Los reintentos pueden duplicar señales y el dashboard no requiere login.
- **Siguiente paso antes de webhooks externos:** idempotencia persistente, rate limit, control de tamaño, autenticación/autoridad de lectura, límites de riesgo, alertas, retención de logs y entorno sandbox/testnet. No usar fondos reales.

Fuentes: [README](../../mvp-valentin-cripto/README.md), [arquitectura](../../mvp-valentin-cripto/docs/ARCHITECTURE.md).

## App Valentín Cripto `0.1.0`

- **Propósito:** aplicación aislada para recibir webhooks autenticados, guardar el log de señales y el historial de órdenes simuladas, y visualizar el estado del simulador.
- **Stack:** Python/FastAPI, dashboard HTML/Tailwind y SQLite exclusiva `backend/data/db/cripto_mvp.db`.
- **Persistencia:** señales, órdenes, balance y posiciones sobreviven reinicios; `event_id` opcional previene reprocesar eventos repetidos.
- **Límite duro:** no usa claves API reales, no conecta a Binance ni a otros exchanges y no transmite órdenes. Balance y PnL son ficticios; no implica riesgo financiero.
- **Acceso documentado:** dashboard/API local `8006`; no es una demo pública ni debe exponerse sin controles adicionales.
- **Relación:** aplicación nueva e independiente del MVP anterior descrito arriba; no sustituye ni comparte base de datos con `mvp-valentin-cripto`.

Fuentes: [README](../../app-valentin-cripto/README.md), [arquitectura](../../app-valentin-cripto/docs/ARCHITECTURE.md).

## MVP Control de Visitantes `0.1.1`

- **Propósito:** alta/consulta local de visitantes, pase temporal y registro de egreso.
- **Stack:** PHP 8 + PDO, SQLite exclusiva `visitors_mvp.db`, HTML/Tailwind.
- **Ejecución documentada:** servidor PHP y API en `8000`, mismo origen.
- **Límites:** no implementa login, roles, QR, notificaciones ni conexión a control físico; nombres/teléfonos se guardan en la DB local sin cifrado.
- **Siguiente paso:** usar datos ficticios; no exponer a redes; antes de una instalación real añadir autenticación, minimización de datos, permisos, retención y auditoría.

Fuentes: [README](../../mvp-visitor-pass/README.md), [arquitectura](../../mvp-visitor-pass/docs/ARCHITECTURE.md).

## Service Synthetic Factory `0.1.0`

- **Propósito:** crear perfiles y documentos visuales ficticios para pruebas locales.
- **Stack:** React/Vite, FastAPI, Faker, Pillow, ReportLab y SQLite exclusiva.
- **Ejecución:** UI `4209`; API `8009`; archivos separados por módulo.
- **Límites:** sin autenticación, fuentes oficiales ni integraciones runtime. Sus tarjetas y PDFs están marcados como ficticios/no válidos; no se usan para identificación ni atención real.
- **Relación con otros MVP:** solo ofrece payloads JSON de muestra para Personal, Auditoría, Visitor Pass, Portal Ciudadano y POS; no accede a sus bases ni importa sus modelos.

Fuentes: [README](../../service-synthetic-factory/README.md), [arquitectura](../../service-synthetic-factory/docs/ARCHITECTURE.md).

## Integraciones físicas o de terceros

Aplicar un adaptador por proveedor/dispositivo, con contrato explícito, secretos por ambiente, permisos mínimos, timeout, reintentos acotados, idempotencia, trazabilidad y estado visible. Mantener simulador como implementación predeterminada. Validar QR dentro de su módulo; no convertir una ilustración en credencial válida. El backend de cada integración conserva sus propios datos y credenciales.

## Estrategia de despliegue y migración

| Subsistema | Prioridad | Propuesta y conectividad | Prerrequisitos |
|---|---|---|---|
| MVP Automatización de Señales (`mvp-valentin-cripto`) | 2 — webhook/Cloud | Mantener listener en loopback interno `8025`; para TradingView se necesita endpoint HTTPS en proxy/cloud, no exposición directa de la VM. | Simulación solamente. `.env.example` futuro: `WEBHOOK_SECRET` (vacío/placeholder, valor en gestor de secretos) y `TRADING_AUDIT_PATH` (ruta de datos persistente, no secreta). Antes de tráfico externo: límite de tasa/tamaño, idempotencia persistente, auth del dashboard, logs con retención y sandbox/testnet. |
| App Valentín Cripto | 1 — demo interactiva | Puerto `127.0.0.1:8014`, límite 128 MiB; SQLite propia persistente en volumen exclusivo. | Crear secreto de prueba fuera del repositorio en `WEBHOOK_SECRET`; usar emisor local de eventos, no Exchange. La app y el MVP anterior no comparten DB. |
| Visitor Pass | 1 — demo interactiva | Puerto `127.0.0.1:8022`, límite 96 MiB; SQLite exclusiva en volumen propio. | Mantener datos ficticios. No exponer sin autenticación, permisos de archivo y política de retención; no conectar control físico. |
| Synthetic Factory | 1 — demo interactiva interna | Puerto `127.0.0.1:8024`, límite 128 MiB; SQLite y assets en volúmenes separados del resto de módulos. | Mantener loopback, cuotas de generación/almacenamiento y marcas de contenido sintético; no autenticación en el estado actual. No entregar acceso público. |
| MCP Gateway | 2 — integración MCP | Conservar el modo local `127.0.0.1:8020`; no publicar, tunelizar ni reenviar a clientes remotos. Futuro servidor remoto requeriría rediseño autenticado y fuentes allowlisted de solo lectura. | Cliente compatible co-localizado y bases permitidas existentes. `.env.example` futuro podría declarar `MCP_SERVER_URL` y `MCP_AUTH_TOKEN`; hoy el servicio no requiere claves ni autenticación, y no deben añadirse hasta implementar ese transporte. |

La configuración de cualquier extensión cloud debe documentar nombres y propósito de variables en `.env.example`, sin valores reales. Una URL de webhook, token MCP o secreto de firma debe permanecer del lado del servidor/gestor de secretos, nunca en el frontend ni en el repositorio. La simulación local sigue siendo el comportamiento por defecto.
