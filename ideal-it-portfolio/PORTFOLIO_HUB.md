# Portfolio Hub — Ideal-IT

## Matriz de soluciones

| Solución | Versión | Tecnologías | Despliegue | Descripción |
|---|---|---|---|---|
| Landing & Demos Hub | `v1.0.0` | Angular 18, Tailwind CSS | Vercel | Catálogo del portfolio, previews estáticas y accesos a módulos independientes. |
| MVP Formularios (Turismo Municipio) | `v0.1.1` | Angular standalone, Bootstrap, FastAPI, SQLite | Standalone local / preview en Demos Hub | Eventos municipales gratuitos, inscripciones, aprobación opcional, QR y asistencia. |
| MVP Personal | `v0.1.1` | Angular standalone, FastAPI, SQLite | Standalone local | Gestión de personal, asistencia biométrica simulada, licencias y reportes. |
| MVP Auditoría | `v0.1.1` | Angular standalone, FastAPI, SQLite | Standalone local | Prestadores, bóveda documental local y validaciones demostrativas. |

## Landing y navegación

La landing Angular 18 se despliega como una SPA estática en Vercel. Demos Hub es la página de inicio (`/`) y presenta el catálogo de soluciones. La ficha de Formularios abre una preview interactiva en `/mvp/formularios`; las rutas SPA se reescriben a `index.html` para admitir enlaces directos y refrescos.

La preview demuestra visualmente la gestión de eventos, el portal de inscripción, aprobación o rechazo por cupo, un código QR ilustrativo y la validación simulada de asistencia. Utiliza datos ficticios en memoria del navegador: no persiste, no abre la cámara, no emite QR reales y no realiza llamadas al backend.

## Aislamiento de MVP Formularios

El producto funcional permanece en `..\mvp-formularios`: su frontend independiente utiliza Angular + Bootstrap y su backend FastAPI persiste exclusivamente en `backend/data/db/formularios_mvp.db`. La preview en Vercel no contiene copias del backend ni del esquema SQLite, y no se conecta al servicio local. Para ejecutar el módulo completo, consulte [la guía del MVP Formularios](../mvp-formularios/README.md) y [su arquitectura](../mvp-formularios/docs/ARCHITECTURE.md).

Personal y Auditoría siguen siendo subsistemas standalone con backends FastAPI y bases SQLite propias; la landing no despliega esas APIs.
