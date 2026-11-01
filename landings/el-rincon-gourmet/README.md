# El Rincón Gourmet

Landing independiente para un restaurante de cocina de estación. Identidad cálida en verdes, lino y serif editorial; menú filtrable, reseñas, mapa ilustrativo y solicitud de reserva.

## Ejecutar

Requiere Node.js 20+ y npm. Desde este directorio:

```powershell
npm install
npm run dev
```

Abrir `http://127.0.0.1:5180/landings/el-rincon-gourmet/`.

Para generar la versión estática autónoma: `npm run build`. Para incluirla en el Demos Hub, ejecutar `npm run build:hub` y luego compilar `ideal-it-portfolio`; la salida queda en `ideal-it-portfolio/public/landings/el-rincon-gourmet/`.

El menú, mapa, reseñas y reservas son demostrativos; los formularios mantienen el estado solo en memoria y no envían información. Las fotografías están en `public/images/`; Google Fonts se carga online con fuentes de sistema como fallback.
