# Trámites e inspecciones

## MVP Formularios `0.1.2`

- **Propósito:** organizadores/eventos, inscripciones, aprobación opcional, QR y control de asistencia.
- **Stack local:** Angular standalone + Bootstrap, FastAPI + SQLAlchemy, SQLite exclusiva `formularios_mvp.db`.
- **Ejecución documentada:** frontend `4202`; API `8003`; preview de landing `/mvp/formularios`.
- **Configuración:** `FORMULARIOS_MVP_DATABASE_PATH` solo acepta una ruta dentro del módulo o del directorio temporal de pruebas.
- **Diferencia crítica:** el producto local consume su API; la preview es un flujo sintético separado, sin cámara, persistencia, API ni QR escaneable.
- **Siguiente paso:** ejecutar pruebas con base temporal; definir autenticación, autorización, retención y protección de datos antes de una institución real.

Fuentes: [README](../mvp-formularios/README.md), [arquitectura](../mvp-formularios/docs/ARCHITECTURE.md).

## MVP Inspecciones de Campo `0.2.0`

- **Propósito:** digitalizar planillas de campo, consultar afiliados ficticios y sincronizar inspecciones guardadas offline.
- **Stack:** React PWA/Vite, FastAPI + SQLAlchemy, SQLite exclusiva `osma_mvp.db`.
- **Ejecución documentada:** PWA `5175`; API `8005`; la API se separó de `8003` y la PWA de AgroTech (`5173`).
- **Datos e integración:** cola y cachés privadas cifradas con AES-GCM en IndexedDB; la cola anterior de `localStorage` se migra cifrada. La sincronización es idempotente por `client_id`; no carga registros reales.
- **Límites:** el MVP no implementa autenticación/autorización; no exponer públicamente hasta añadir controles de acceso, TLS y protección del dispositivo.
- **Límites:** el cifrado en el dispositivo no sustituye autenticación, autorización, TLS ni protección frente a XSS; proteger el dispositivo y definir retención antes de uso real.
- **Siguiente paso:** probar persistencia offline, reintentos, payload duplicado/conflictivo y recuperación de red.

Fuentes: [README](../mvp-osma-inspecciones/README.md), [arquitectura](../mvp-osma-inspecciones/docs/ARCHITECTURE.md).
