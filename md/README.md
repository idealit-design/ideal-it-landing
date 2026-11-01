# Documentación central — Ideal-IT

Este directorio es el punto de entrada documental del portfolio. Los documentos técnicos completos siguen junto a cada MVP para mantenerlos cerca de su código; aquí se conservan el manual canónico, la planificación transversal y resúmenes compactos por categoría. Los respaldos de `portfolio/` no se mueven ni se copian en bloque.

## Índice

- [Manual de trabajo íntegro](manual.md) — copia completa del manual Angular vigente en `ideal-it-portfolio/docs/`.
- [Planificación, estado y tareas](portfolio-planificacion.md) — 18 tarjetas del Hub, ocho MVP locales, tres previews sintéticas, cinco landings comerciales y alcance de las referencias/propuestas.
- [Web POS Comercial](../web-pos-comercial/README.md) — subsistema local independiente de venta rápida y control básico de caja.
- [ALANTIA Frigorífico](../app-alantia-frigorifico/docs/ARCHITECTURE.md) — especificación modular y límites del subsistema local.
- [Landings comerciales](landings-comerciales.md) — cinco demos React/Vite autónomas, guía de ejecución y conexión con el Demos Hub.
- [Referencias originales](referencias-historicas.md) — contraste entre la memoria del proyecto, los archivos realmente encontrados y sus límites de publicación.
- [Personas y auditoría](01-personas-auditoria.md) — MVP Personal y MVP Auditoría.
- [Trámites e inspecciones](02-tramites-inspecciones.md) — MVP Formularios y MVP Inspecciones.
- [Operaciones, logística e IoT](03-operaciones-logistica-iot.md) — MVP Logística y MVP AgroTech.
- [Integraciones y accesos](04-integraciones-accesos.md) — MVP Automatización de Señales y MVP Control de Visitantes.

`manual.md` es una copia de referencia con enlaces relativos adaptados al índice central; la versión canónica está en `../ideal-it-portfolio/docs/MANUAL_TRABAJO_ANGULAR_MVPS.md`.

## Fuentes de autoridad

1. El [hub raíz](../PORTFOLIO_HUB.md) es el catálogo canónico de soluciones y enlaza este índice. Sus 18 tarjetas incluyen ocho MVP locales (tres previews sintéticas en Angular), cinco referencias/propuestas y cinco landings integradas como assets estáticos mediante `npm run build:hub`.
2. El [manual original](../ideal-it-portfolio/docs/MANUAL_TRABAJO_ANGULAR_MVPS.md) define las reglas de trabajo Angular. `manual.md` conserva su contenido operativo y adapta únicamente los enlaces relativos.
3. Las arquitecturas y README dentro de cada `mvp-*` son la referencia técnica específica de ese subsistema.
4. `portfolio/` es un archivo histórico, no una fuente que deba publicarse ni conectarse automáticamente a los MVP.

**Regla de vigencia:** los resúmenes describen la arquitectura y el alcance documentados, no certifican disponibilidad productiva. Toda afirmación de despliegue, integración real o cumplimiento debe probarse y aprobarse antes de publicarse.
