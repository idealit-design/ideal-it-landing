# Hub Docker Compose del workspace

Esta guía conserva una receta de referencia para `/home/admin-idealit/workspace`;
no describe la configuración activa. En la verificación remota del
2026-11-01T22:51Z, `idealit-hub` seguía activo en `127.0.0.1:8080` y
`app-alantia-frigorifico` estaba desplegado y saludable en `127.0.0.1:8012`.
El segundo servicio tiene un límite de 128 MiB y una SQLite en un volumen
dedicado. Consultar [VM_CONTEXT.md](./VM_CONTEXT.md) y el
[Compose de ALANTIA Frigorífico](../../app-alantia-frigorifico/docker-compose.yml)
para los detalles comprobados.
El contenedor respondía en `127.0.0.1:8080`, pero su mapeo observado era
`127.0.0.1:8080` hacia el puerto `8080` del contenedor (no el puerto `80` de
esta receta). La raíz respondió `200` y `/landings/el-rincon-gourmet/`
respondió `404`. No reemplazar ni desplegar esta receta sin revisar primero la
configuración activa y acordar la migración. Consultar [VM_CONTEXT.md](./VM_CONTEXT.md)
para los recursos y el estado observados.

## Migración de demos — estado y propuestas

El host dispone de 1.5 GiB RAM visible y 39 GB libres en disco. En la lectura previa al arranque había 622 MiB disponibles y 514 MiB de swap en uso; son valores puntuales. No desplegar todos los subsistemas a la vez. La estrategia es habilitar una sola demo adicional por vez, con límites de contenedor de 96–128 MiB para servicios simples, un volumen y SQLite exclusivos por módulo, y endpoint publicado únicamente en `127.0.0.1:80XX`. Los topes son límites, no memoria reservada; comprobar la presión real del host antes de cada servicio.

Los puertos `8013`–`8019`, `8021`–`8024`, `8027` y `8028` siguen propuestos en el plan central. `8012` está asignado al demo ALANTIA Frigorífico activo. `8020` es el puerto local documentado del MCP Gateway y no debe publicarse ni tunelizarse; los puertos de integraciones externas permanecen internos. No desplegar otros MVP sin verificar primero memoria disponible y estado del host.

SQLite debe residir en un volumen distinto por subsistema, nunca compartido. AgroTech es la excepción con PostgreSQL dedicado en red Docker privada y un límite de memoria propio; posponerlo hasta validar que la VM tenga margen suficiente para API, base y sistema. No mapear el puerto de PostgreSQL al host. Las previews Vercel no pueden consumir una API en el loopback privado de la VM; para una demo pública se requiere una arquitectura Cloud autorizada, HTTPS, autenticación y controles de acceso, que no forman parte del estado actual.

La receta de esta guía es una referencia para un Nginx que serviría una página
estática con 18 tarjetas de demostración. Son marcadores: no despliegan ni
enrutan a los 18 proyectos del portfolio. La página que hoy sirve la VM es una
página mínima de estado; no son estas 18 tarjetas ni la SPA Angular publicada
en Vercel.

## Requisitos y directorios

Se requiere Docker Engine y el plugin Docker Compose. Crear los directorios
y asignarlos al usuario de trabajo:

```bash
sudo install -d -o admin-idealit -g admin-idealit -m 0750 \
  /home/admin-idealit/workspace/site
```

Crear los archivos siguientes como `admin-idealit` (por ejemplo, desde VS Code
Remote - SSH).

## `docker-compose.yml`

Guardar en `/home/admin-idealit/workspace/docker-compose.yml`:

```yaml
services:
  hub:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - ./site:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
    mem_limit: 96m
    cpus: 0.25
    pids_limit: 32
    networks:
      - idealit-internal

networks:
  idealit-internal:
    name: idealit-internal
    driver: bridge
    internal: true
```

Los límites mantienen acotado el servicio; no son una reserva de memoria para
la VM. El puerto está ligado al loopback para no exponerlo en la red. La red
interna permite conectar otros proyectos en la misma red Docker, pero sus
contenedores no tendrán salida externa por esa red.

## `nginx.conf`

Guardar en `/home/admin-idealit/workspace/nginx.conf`:

```nginx
worker_processes 1;
pid /var/run/nginx.pid;

events {
    worker_connections 128;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 15;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;
    }
}
```

## Página inicial

Guardar como `/home/admin-idealit/workspace/site/index.html`:

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ideal-IT | Demos</title>
  <style>
    body { font: 16px system-ui, sans-serif; margin: 2rem auto; max-width: 1100px; padding: 0 1rem; color: #172033; }
    h1 { margin-bottom: .4rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-top: 2rem; }
    article { border: 1px solid #d8deea; border-radius: 10px; padding: 1rem; }
    article h2 { font-size: 1.1rem; margin: 0 0 .5rem; }
    article p { color: #596579; margin: 0; }
  </style>
</head>
<body>
  <h1>Ideal-IT — Demos</h1>
  <p>Hub inicial. Configura el destino de cada tarjeta cuando estén disponibles las demos.</p>
  <main class="grid" id="demos"></main>
  <script>
    const grid = document.querySelector("#demos");
    for (let i = 1; i <= 18; i++) {
      const card = document.createElement("article");
      const number = String(i).padStart(2, "0");
      card.innerHTML = `<h2>Demo ${number}</h2><p>Destino pendiente</p>`;
      grid.append(card);
    }
  </script>
</body>
</html>
```

## `README.md` local

Crear `/home/admin-idealit/workspace/README.md` con instrucciones operativas
para el equipo:

````markdown
# Workspace Ideal-IT

Hub estático Nginx para organizar las 18 demos. Las tarjetas son marcadores;
agrega sus destinos cuando estén definidos.

## Iniciar

```bash
cd /home/admin-idealit/workspace
docker compose up -d
```

## Ver estado y logs

```bash
docker compose ps
docker compose logs -f hub
```

## Apagar

```bash
cd /home/admin-idealit/workspace
docker compose down
```

El hub escucha en `127.0.0.1:8080` de la VM. Para verlo desde Windows, crea un
túnel SSH:

```bash
ssh -L 8080:127.0.0.1:8080 idealit-vm
```

Luego abre `http://localhost:8080`. La red Docker `idealit-internal` puede
compartirse con otros Compose conectándolos a ella como red externa.
````

## Arranque y acceso

Comprobar primero que todos los archivos pertenecen a `admin-idealit` y validar
la configuración:

```bash
sudo chown -R admin-idealit:admin-idealit /home/admin-idealit/workspace
sudo chmod 0750 /home/admin-idealit/workspace /home/admin-idealit/workspace/site
cd /home/admin-idealit/workspace
docker compose config
docker compose up -d
docker compose ps
```

Desde Windows, abrir un túnel SSH (sustituir la IP por la actual; la IP del
Default Switch de Hyper-V puede cambiar) y navegar a `http://localhost:8080`:

```bash
ssh -L 8080:127.0.0.1:8080 idealit-vm
```

Para apagar el servicio, ejecutar `docker compose down` desde el workspace.
Esto elimina el contenedor y la red de este proyecto, pero no los archivos de
la página.

En Compose de otros proyectos, declarar la red compartida así:

```yaml
networks:
  idealit-internal:
    external: true
    name: idealit-internal
```

Conectar a ella sólo los servicios que deban comunicarse con el hub. La red
`internal` está aislada de redes externas; no se debe añadir una red pública ni
publicar puertos adicionales sin revisar antes el alcance.
