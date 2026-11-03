# Portal municipal de demostración

**Versión:** `0.1.0`

Landing frontend autónoma para explorar una experiencia municipal ficticia. Usa
React 19, Vite 7, Tailwind CSS 4 y Lucide React. No representa una integración
con un municipio, cliente o servicio público real.

## Alcance

La navegación, las noticias, los servicios y el presupuesto son contenido de
demostración. Las interacciones se resuelven en el navegador; no se envían
trámites, reclamos ni datos a una API, y no hay persistencia.

## Ejecución local

Requiere Node.js y npm. Desde este directorio:

```powershell
npm install
npm run dev
```

Abrir `http://127.0.0.1:5176`. El puerto es fijo y estricto para evitar colisiones
con otros frontends locales.

## Build

```powershell
npm run build
```

El build estático queda en `dist/` y usa rutas relativas para poder servirse
bajo una subruta. Para publicarlo en la VM, consultá
[DEPLOY_STATIC.md](./DEPLOY_STATIC.md).

## Estrategia de Despliegue y Migración

**Hosting estático, sin backend.** El sitio puede servirse con Nginx nativo o desde el hub existente, sin contenedor adicional ni base de datos. Las interacciones siguen en el navegador y no envían trámites. Si se agrega un formulario real, documentar por separado el webhook/API serverless, consentimiento y antispam. `.env.example` del backend futuro debería declarar `CONTACT_WEBHOOK_URL` y `CONTACT_WEBHOOK_SECRET` como placeholders vacíos; sus valores permanecerían del lado servidor/gestor de secretos, nunca en Vite/frontend.
