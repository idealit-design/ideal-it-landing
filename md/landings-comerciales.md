# Landings comerciales

Cinco experiencias de marketing autocontenidas para nichos distintos. Cada subdirectorio es un proyecto React + TypeScript + Vite con Tailwind CSS 4, Lucide, configuración y README propios. No hay un backend compartido: formularios, selección de planes, precios, reseñas y solicitudes son prototipos locales en memoria.

## Catálogo

| Proyecto | Concepto | Interacciones principales | Guía |
|---|---|---|---|
| El Rincón Gourmet | Restaurante de cocina de estación | Menú por categoría y búsqueda, carrusel de reseñas, mapa y reserva demostrativa | [README](../landings/el-rincon-gourmet/README.md) |
| Pluma y Tinta | Autora independiente | Catálogo de libros, modal de fragmentos, agenda y newsletter local | [README](../landings/pluma-y-tinta/README.md) |
| Manos Maestras | Carpintería y cerámica artesanal | Galería masonry con lightbox, estado ilustrativo de stock y consulta personalizada | [README](../landings/manos-maestras/README.md) |
| EcoHuerta Urbana | Suscripción agroecológica | Plan semanal/mensual, calculadora estimativa y FAQ acordeón | [README](../landings/ecohuerta-urbana/README.md) |
| FixIt Express | Reparación tecnológica exprés | Cotizador de tres pasos, reseñas rotativas y solicitud con franja horaria | [README](../landings/fixit-express/README.md) |

## Desarrollo independiente

Requiere Node.js 20 o superior. Instalar y arrancar desde el directorio de cada demo:

```powershell
cd landings\el-rincon-gourmet
npm install
npm run dev
```

Puertos locales fijos y estrictos para ejecutarlas simultáneamente: Gourmet `5180`, Pluma y Tinta `5181`, Manos Maestras `5182`, EcoHuerta `5183` y FixIt `5184`. Cada proyecto incluye su propio `package.json`, `vite.config.ts`, `index.html`, `src/` y `README.md`. El build autónomo de Vite se obtiene con `npm run build`.

Vite configura un `base` por demo; en desarrollo, abrir `/landings/<slug>/` en el puerto indicado, por ejemplo `http://127.0.0.1:5180/landings/el-rincon-gourmet/`.

Cada proyecto incluye sus imágenes optimizadas en su propio `public/images/`; no depende de un servidor externo para las fotografías. Google Fonts se descarga online si hay conexión y tiene alternativas locales en la pila CSS.

## Demos Hub

El catálogo Angular enlaza a `/landings/<slug>/`. Para generar el preview estático que sirve el Hub, ejecutar desde la raíz:

```powershell
npm run build:hub --prefix landings\el-rincon-gourmet
npm run build:hub --prefix landings\pluma-y-tinta
npm run build:hub --prefix landings\manos-maestras
npm run build:hub --prefix landings\ecohuerta-urbana
npm run build:hub --prefix landings\fixit-express
npm run build --prefix ideal-it-portfolio
```

Los cinco primeros comandos copian cada build a `ideal-it-portfolio/public/landings/<slug>/`, conservando en paralelo el build autónomo `landings/<slug>/dist/` cuando se usa `npm run build`. El paso de integración es explícito: ejecutar solo el build Angular no instala ni compila los subsistemas. Los `previewUrl` de las tarjetas se activan al publicar el Hub con estos assets.

La guía canónica está en [PORTFOLIO_HUB.md](../PORTFOLIO_HUB.md). Las acciones de reservar, comprar, suscribirse, contactar, solicitar reparaciones y calcular ahorros no generan pedidos ni transmiten datos. Reseñas, disponibilidad, estadísticas, precios y estimaciones son ficticios.
