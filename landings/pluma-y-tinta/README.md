# Pluma y Tinta

Sitio editorial para una autora independiente: paleta de papel y tinta, serif literaria, cubierta destacada, catálogo con extractos en modal, agenda de lecturas y newsletter.

## Ejecutar

Requiere Node.js 20+ y npm. Desde este directorio:

```powershell
npm install
npm run dev
```

Abrir `http://127.0.0.1:5181/landings/pluma-y-tinta/`.

`npm run build` genera una app estática autónoma. Para incorporarla al Demos Hub ejecutar `npm run build:hub` y luego compilar `ideal-it-portfolio`; los archivos se escriben en `ideal-it-portfolio/public/landings/pluma-y-tinta/`.

Compra, agenda y newsletter son interacciones demostrativas en memoria, no procesan pagos ni envían correo. Las cubiertas fotográficas se incluyen en `public/images/`; Google Fonts es opcional y tiene fuentes de sistema como fallback.
