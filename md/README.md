# Documentación central — Ideal-IT

Este directorio es el índice de documentación funcional y de planificación. Las
guías operativas de infraestructura están en [`../docs/README.md`](../docs/README.md);
la documentación técnica específica permanece junto a cada subsistema. Los
respaldos de `portfolio/` no se mueven ni se copian en bloque.

## Índice por tema

- **Planificación:** [plan de portfolio y migración](planning/portfolio-planificacion.md) —
  inventario, prioridades, estados de despliegue, puertos y condiciones.
- **Dominios:** resúmenes de [personas y auditoría](domains/01-personas-auditoria.md),
  [trámites e inspecciones](domains/02-tramites-inspecciones.md),
  [operaciones, logística e IoT](domains/03-operaciones-logistica-iot.md) e
  [integraciones y accesos](domains/04-integraciones-accesos.md).
- **Landings:** [catálogo y ejecución](landings/landings-comerciales.md).
- **Referencias:** [antecedentes históricos y límites de evidencia](references/referencias-historicas.md).
- **Manual:** [guía íntegra de trabajo](manual.md), copia con enlaces adaptados
  del manual canónico en `ideal-it-portfolio/docs/`.
- **Arquitectura de proyectos:** [ALANTIA Frigorífico](../app-alantia-frigorifico/docs/ARCHITECTURE.md)
  y [Web POS Comercial](../web-pos-comercial/README.md).

## Fuentes de autoridad

1. El [hub raíz](../PORTFOLIO_HUB.md) es el catálogo canónico. El conteo de
   tarjetas comerciales es distinto del inventario de 18 subsistemas en
   [`../docs/ECOSYSTEM_STATUS.md`](../docs/ECOSYSTEM_STATUS.md).
2. El [manual original](../ideal-it-portfolio/docs/MANUAL_TRABAJO_ANGULAR_MVPS.md)
   define las reglas de trabajo Angular; `manual.md` adapta únicamente sus
   enlaces relativos.
3. Las arquitecturas y README dentro de cada MVP son la referencia técnica de
   cada subsistema.
4. `portfolio/` es un archivo histórico, no una fuente para publicar o conectar
   automáticamente a los MVP.

**Vigencia:** los resúmenes describen arquitectura y alcance; no certifican
disponibilidad productiva. Registrar todo despliegue con evidencia y fecha. A
2026-11-01, `app-alantia-frigorifico` está activo solo en `127.0.0.1:8012`;
permanece separado de Vercel y de datos reales.
