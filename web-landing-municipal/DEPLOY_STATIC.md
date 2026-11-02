# Despliegue estático

La landing es una aplicación React/Vite estática. No requiere backend, API,
SQLite ni contenedores adicionales. El build genera los archivos en `dist/` y
usa rutas relativas para funcionar bajo una subruta.

**Estado:** build y preview local verificados. La publicación y la URL de la VM
no se pudieron verificar porque el alias SSH `server-idealit` no resuelve en el
entorno de trabajo actual.

## Compilar

Desde `/home/admin-idealit/workspace/web-landing-municipal`:

```bash
npm ci
npm run build
```

## Publicar en la VM

Copiar el contenido de `dist/` (no la carpeta contenedora) a:

```text
/home/admin-idealit/workspace/idealit-hub/www/landings/municipal/
```

Por ejemplo, desde el directorio del proyecto:

```bash
install -d /home/admin-idealit/workspace/idealit-hub/www/landings/municipal
cp -a dist/. /home/admin-idealit/workspace/idealit-hub/www/landings/municipal/
```

El Nginx nativo o el hub existente debe exponer esa carpeta bajo
`/landings/municipal/`. No se requiere ni se debe crear otro contenedor Docker;
este procedimiento no modifica configuraciones globales de Nginx.

## Validar

Desde la VM, si el hub atiende en `127.0.0.1:8080`:

```bash
curl -I http://127.0.0.1:8080/landings/municipal/
```

Una respuesta `200` confirma que el `index.html` estático es accesible. Verificar
también en el navegador que carguen los recursos bajo esa misma subruta.
