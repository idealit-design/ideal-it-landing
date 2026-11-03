# Ideal-IT — portfolio y ecosistema

Ideal-IT reúne un portfolio Angular con previews y landings estáticas, además de 18 subsistemas independientes. Las experiencias públicas del portfolio no implican que sus APIs estén desplegadas o conectadas.

## Estado verificado — 2026-11-01

- Portfolio Angular publicado como SPA estática en Vercel; integra cinco landings comerciales compiladas en `ideal-it-portfolio/public/landings/`.
- Hay tres previews sintéticas (Personal, Auditoría y Formularios); no llaman a sus APIs ni a la VM. Las pruebas reportadas del portfolio son 26/26.
- En la VM están activos `idealit-hub` en `127.0.0.1:8080` y `app-alantia-frigorifico` en `127.0.0.1:8012`. El segundo es una demo autónoma con límite de 128 MiB y SQLite en un volumen dedicado; no está conectada a Vercel.
- Lectura del host previa al arranque de la demo: 4 vCPU, 1.5 GiB RAM visible, 622 MiB disponibles, 514 MiB de swap usados y 39 GB libres. Luego, `docker stats` midió 55.82 MiB / 128 MiB para ALANTIA. Son mediciones puntuales; revisar memoria antes de sumar servicios.
- Las bases de proveedores y catálogo de la demo ALANTIA comienzan vacías; las pruebas se ejecutaron con registros sintéticos en bases temporales.
- No publicar puertos de API fuera del loopback ni usar datos reales. La IP `172.24.151.30/20` es dinámica y puede cambiar.

## Prioridades de migración

| Prioridad | Objetivo | Alcance |
|---|---|---|
| 1 — Demo interactiva en VM | Desplegar, de forma secuencial, aplicaciones autónomas con backend local y almacenamiento aislado. | ALANTIA Frigorífico ya está en `127.0.0.1:8012`; los demás puertos `127.0.0.1:80XX` y límites del plan son propuestas. Acceso por túnel SSH; no equivale a publicación para visitantes de Vercel. |
| 2 — Cloud, MCP y webhooks | Resolver primero el requisito de conectividad, autenticación, HTTPS y secretos para integraciones externas o publicación estática. | No exponer MCP ni webhooks de prueba. Los servicios externos y variables sugeridas siguen pendientes de implementación. |

La matriz de los 18 subsistemas y las condiciones por módulo están en [PORTFOLIO_HUB.md](./PORTFOLIO_HUB.md) y [md/planning/portfolio-planificacion.md](./md/planning/portfolio-planificacion.md). El estado y límites de VM están en [docs/operations/VM_CONTEXT.md](./docs/operations/VM_CONTEXT.md) y [docs/operations/WORKSPACE_DOCKER.md](./docs/operations/WORKSPACE_DOCKER.md).

## Documentación

- [Estado del ecosistema](./docs/ECOSYSTEM_STATUS.md)
- [Índice documental general](./docs/README.md)
- [Hub del portfolio](./PORTFOLIO_HUB.md)
- [Índice por dominios, planificación y referencias](./md/README.md)
- [Plan de migración](./md/planning/portfolio-planificacion.md)
- [Módulos por dominio](./md/domains/01-personas-auditoria.md), [trámites e inspecciones](./md/domains/02-tramites-inspecciones.md), [operaciones e IoT](./md/domains/03-operaciones-logistica-iot.md) e [integraciones y accesos](./md/domains/04-integraciones-accesos.md)
- [Guías y estado de infraestructura](./docs/README.md)

## Regla de despliegue

Mantener cada MVP en su propio proyecto, puerto y base de datos. La VM tiene una demo activa; desplegar como máximo una demo adicional por vez y verificar memoria/swap. Usar SQLite aislada en volumen dedicado cuando el producto ya la soporte. AgroTech requiere PostgreSQL propio y queda condicionado a medir memoria disponible. Todo listener debe permanecer en loopback o red Docker privada hasta que una etapa separada apruebe autenticación, TLS, firewall, respaldo y monitoreo.
