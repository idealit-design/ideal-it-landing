# Arquitectura — Web Landing Municipal

**Versión:** `0.1.0`

## Alcance

Portal institucional de demostración para la Municipalidad ficticia de Villa del Lago. Incluye accesos a trámites, un directorio con búsqueda y filtros, un presupuesto interactivo y noticias institucionales. No autentica personas, persiste cambios ni se conecta a servicios municipales.

## Tecnologías

- React 19 y React DOM para la interfaz y el estado local.
- Vite 7 como servidor de desarrollo y empaquetador.
- Tailwind CSS 4 mediante el plugin oficial de Vite; los estilos de identidad visual y componentes viven en `src/styles.css`.
- Lucide React para iconografía.

## Estructura

```text
web-landing-municipal/
├── docs/ARCHITECTURE.md
├── src/
│   ├── App.jsx       # Secciones, controles y estado de la landing
│   ├── data.js       # Contenido de demostración local
│   ├── main.jsx      # Punto de entrada React
│   └── styles.css    # Tailwind y estilos responsivos de la identidad
├── index.html
├── package.json
├── VERSION
└── vite.config.js
```

## Flujo y límites de datos

El directorio filtra el catálogo local por categoría y texto. El panel presupuestario selecciona una de tres vistas cuyos importes y porcentajes son ilustrativos. Las noticias y los accesos directos muestran un diálogo informativo de demostración; ningún formulario se envía ni se realiza una operación real. `src/data.js` es el punto de partida para sustituir estos datos por un JSON local o una API liviana en una integración futura.

## Desarrollo y compilación

Desde esta carpeta:

```bash
npm install
npm run dev
npm run build
npm run preview
```

El servidor de desarrollo y la preview usan `127.0.0.1:5176`.
