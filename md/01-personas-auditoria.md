# Personas y auditoría

Resumen de referencia; las guías por MVP siguen siendo la autoridad de operación y contratos.

## MVP Personal `0.2.0`

- **Propósito:** personal/áreas, dashboard operativo, fichajes simulados, licencias y reportes laborables.
- **Stack:** Angular standalone + Tailwind, FastAPI + SQLAlchemy, SQLite exclusiva `personal_mvp.db`.
- **Ejecución documentada:** frontend `4203`; API `8001`; rutas standalone lazy-load; preview sintética en `/mvp/personal` sin conexión a la API local.
- **Datos e integración:** IP/dispositivo biométrico es una simulación local; no se conecta a terminales ni usa un backend externo.
- **Límites:** sin datos personales reales ni considerar sus cálculos como registros oficiales.
- **Siguiente paso:** probar frontend/API con DB temporal; definir autenticación/roles y estrategia de migración antes de datos reales.

Fuentes: [README](../mvp-personal/README.md), [arquitectura](../mvp-personal/docs/ARCHITECTURE.md).

## MVP Auditoría `0.1.2`

- **Propósito:** prestadores, documentos locales, nomenclador y resolución demostrativa de casos.
- **Stack:** Angular standalone, FastAPI + SQLAlchemy, SQLite exclusiva `auditoria_mvp.db` y almacenamiento separado por módulo.
- **Ejecución documentada:** frontend `4201`; API `8002`; preview sintética en `/mvp/auditoria`.
- **Datos e integración:** identidad/matrícula y catálogos se simulan; PDFs/imágenes quedan en almacenamiento local; no conectar fuentes oficiales.
- **Límites:** no cargar historias clínicas ni documentación real; definir autenticación, permisos, cifrado, retención y auditoría antes de uso real.
- **Configuración:** `AUDITORIA_MVP_DATABASE_PATH` solo acepta una ruta dentro del módulo o del directorio temporal de pruebas.
- **Siguiente paso:** probar controles de archivos y autorización; revisar almacenamiento temporal y borrado/retención.

Fuentes: [README](../mvp-auditoria/README.md), [arquitectura](../mvp-auditoria/docs/ARCHITECTURE.md).

## Decisión compartida

El hub no conecta estos MVP a fuentes, usuarios o servicios de un sistema de cliente. No hay un panel global de superadmin/auditoría implementado como capacidad común; la futura administración debe aplicar permisos localmente y no acceder directamente a bases ajenas.
