# EcoHuerta Urbana

Landing fresca y natural para suscripción de bolsones agroecológicos. Incluye pasos de suscripción, comparativa semanal/mensual, calculadora estimativa de ahorro e FAQ accesible.

## Ejecutar

Requiere Node.js 20+ y npm. Desde este directorio:

```powershell
npm install
npm run dev
```

Abrir `http://127.0.0.1:5183/landings/ecohuerta-urbana/`.

`npm run build` genera una app estática autónoma. Para publicarla dentro del Demos Hub ejecutar `npm run build:hub` y compilar `ideal-it-portfolio`; la salida queda en `ideal-it-portfolio/public/landings/ecohuerta-urbana/`.

Los precios, el ahorro y la suscripción son estimativos y demostrativos; no se procesan pedidos. La fotografía está incluida en `public/images/`; Google Fonts es opcional y tiene fuentes de sistema como fallback.
