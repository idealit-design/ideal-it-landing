# Automatizador del hub documental

**Versión:** `0.1.0`

## Requisitos

- Python 3.10 o superior

Herramienta Python sin dependencias de terceros para inventariar los subsistemas
`mvp-*`, `service-*`, `app-*` y `web-*`, actualizar las matrices de ambos `PORTFOLIO_HUB.md`
y generar el informe global [`docs/ECOSYSTEM_STATUS.md`](../docs/ECOSYSTEM_STATUS.md).

## Uso

Desde la raíz del monorepo:

```powershell
py service-docs-hub-automator\automate.py
```

El comando sincroniza las matrices y el informe, y luego muestra cualquier
problema de integridad. El código de salida es `1` si se detectan enlaces o
anclas internas rotas, puertos asignados a más de un subsistema, versiones
SemVer ausentes/inválidas o versiones fijadas incompatibles en manifiestos de
dependencias.

Para validar sin escribir archivos:

```powershell
py service-docs-hub-automator\automate.py --check
```

Para ejecutar las pruebas unitarias:

```powershell
py -m unittest discover -s service-docs-hub-automator\tests -v
```

El inventario busca `VERSION`, `README.md` y directorios de forma recursiva.
Ignora el archivo histórico `portfolio/`, dependencias instaladas, cachés y resultados de compilación. Las matrices
actualizadas muestran metadatos verificables (versión, README y estructura de
primer nivel); el reporte incluye la estructura recursiva completa.
También valida los puertos de desarrollo y preview configurados para las cinco
landings comerciales.

## Estrategia de Despliegue y Migración

**Prioridad 2 — integración CI, sin despliegue de servicio.** Es una utilidad de línea de comandos, no una demo web; no necesita puerto, contenedor ni base de datos en la VM. Mantenerla en el repositorio y ejecutarla en un runner controlado de CI cuando exista ese flujo. La VM no la aloja actualmente. No requiere secretos ni variables `.env`; cualquier token de CI futuro debe gestionarse como secreto del proveedor y no incluirse en `.env.example` con un valor real.
