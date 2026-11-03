# Contexto de infraestructura — VM Idealit

> Documento de contexto para trabajar desde Visual Studio Code conectado por Remote - SSH.
> Infraestructura base verificada el 2026-11-01T22:19Z; estado de despliegue actualizado el 2026-11-01T22:51Z. Los recursos y la IP pueden cambiar.

## Identificación

| Campo | Valor |
|---|---|
| Nombre de la VM en Hyper-V | `vm-idealit` |
| Perfil / configuración | `virtualizador` |
| Hostname de Ubuntu | `server-idealit` |
| Sistema operativo | Ubuntu Server `26.04.1 LTS` |
| Kernel observado | `7.0.0-30-generic` |
| Arquitectura | `x86_64` / `amd64` |
| Usuario Linux | `admin-idealit` |
| Home del usuario | `/home/admin-idealit` |
| Directorio de proyectos previsto | `/home/admin-idealit/workspace` |

## Recursos observados en Ubuntu

| Recurso | Valor |
|---|---:|
| CPU | 4 vCPU visibles |
| Disco visible por la VM (`/dev/sda`) | 50 GB |
| Volumen raíz (`/`) | 47 GB; 39 GB disponibles |
| Memoria visible para Ubuntu | 1.5 GiB; 550 MiB disponibles |
| Swap | 2.0 GiB; 409 MiB usados |

`/dev/sda1` es EFI (1 GB), `/dev/sda2` es `/boot` ext4 (2 GB) y `/dev/sda3` es un PV LVM (46.9 GB). El LV `ubuntu-vg/ubuntu-lv` ocupa 46.9 GB y contiene `/` ext4 (47 GB). No se observó discrepancia entre el disco, la partición LVM, el LV y el filesystem raíz. No se ejecutó ninguna operación de resize.

**Diferencias con el inventario anterior:** el informe previo decía 25 GB para `/dev/sda` y 11 GB para `/`; ahora se observan 50 GB y 47 GB respectivamente. La memoria visible sigue siendo 1.5 GiB frente a los 2 GB declarados como referencia. Confirmar la asignación de memoria desde Hyper-V; no asumir el motivo de la diferencia. En esta verificación había 409 MiB de swap en uso.

## Red

| Campo | Valor |
|---|---|
| Hipervisor | Microsoft Hyper-V |
| Conmutador virtual observado en Windows | `Default Switch` |
| Interfaz de red Ubuntu | `eth0` |
| Driver | `hv_netvsc` (Hyper-V) |
| MAC observada | `00:15:5d:01:19:01` |
| IPv4 observada el 2026-11-01T22:19Z | `172.24.151.30/20` |
| Gateway y DNS observados | `172.24.144.1` |
| Asignación IPv4 | DHCP |

### Advertencia sobre la IP

La IP documentada anteriormente (`172.24.154.170`) ya no es la actual: en esta auditoría respondió `172.24.151.30/20`. La dirección es dinámica por DHCP; Hyper-V `Default Switch` puede cambiar la subred o la IP al reiniciar. Antes de conectarse, comprobar la IP vigente en Ubuntu con:

```bash
hostname -I
ip -4 addr show eth0
ip route
```

No fijar una IP estática ni cambiar Netplan / DHCP / gateway sin analizar primero el `Default Switch` y explicar el impacto. Si cambia la IP, actualizar el alias SSH de Windows.

## Acceso remoto

| Campo | Valor |
|---|---|
| Servicio | OpenSSH Server (`ssh.service`) |
| Estado observado | `active (running)` y `enabled` |
| Puerto | TCP `22` |
| Usuario | `admin-idealit` |
| Host/IP observado | `server-idealit` / `172.24.151.30` (puede cambiar) |
| Alias configurado en Windows | `idealit-vm` |
| Comando desde Windows | `ssh idealit-vm` |
| Autenticación | Conexión por llave verificada con `ssh -o BatchMode=yes idealit-vm hostnamectl --static`; respondió `server-idealit` |

`ssh.service` está `active` y `enabled`; el puerto 22 escucha en IPv4 e IPv6. Los permisos observados son `700` en `/home/admin-idealit/.ssh` y `600` en `authorized_keys`, ambos del usuario `admin-idealit`. No se leyó el contenido de ninguna clave. La conexión SSH por llave funcionó. La configuración efectiva de `sshd` y la autenticación por contraseña siguen pendientes: `sshd -T` no pudo leer un archivo incluido de configuración sin privilegios.

### Higiene de credenciales

Se compartieron credenciales de acceso durante la conversación. Cambiar la contraseña de Ubuntu y proteger la llave privada con una frase de paso nueva y única. No guardar contraseñas ni frases de paso en el repositorio, documentos, scripts, logs o historial de shell. No deshabilitar la autenticación por contraseña hasta confirmar por separado una segunda sesión SSH con llave.

## Estado técnico comprobado el 2026-11-01T22:19Z

- Ubuntu Server `26.04.1 LTS`, kernel `7.0.0-30-generic`, arquitectura `amd64`, hostname `server-idealit`; virtualización Microsoft Hyper-V; 4 vCPU.
- Usuario actual `admin-idealit`, HOME `/home/admin-idealit`; pertenece a los grupos `sudo` y `docker`. La comprobación no interactiva de `sudo` requiere autenticación adicional.
- Memoria visible: 1.5 GiB, con 550 MiB disponibles; swap 2.0 GiB, con 409 MiB usados.
- Almacenamiento: `/dev/sda` 50 GB; `/dev/sda1` EFI 1 GB; `/dev/sda2` `/boot` ext4 2 GB; `/dev/sda3` PV LVM 46.9 GB; LV raíz ext4 47 GB, con 39 GB disponibles. Inodos raíz: 4 % usados.
- Docker Engine `29.9.2`, Docker Compose `v5.6.1` y Buildx `v0.38.1` están instalados; `docker.service` está activo.
- `docker ps -a` muestra un único contenedor: `idealit-hub`, imagen `nginx:alpine`, estado `healthy`, uso observado de 5.3 MiB de un límite de 96 MiB. El proyecto Compose `idealit-hub` usa `/home/admin-idealit/workspace/docker-compose.yml`.
- El puerto publicado es `127.0.0.1:8080` hacia el puerto `8080` del contenedor. `http://127.0.0.1:8080/` respondió `200` y sirve una página HTML mínima de estado, no la SPA Angular ni el Hub de 18 tarjetas; `/landings/el-rincon-gourmet/` respondió `404`. La ruta de landings no está publicada en este servicio.
- Existen las redes Docker `idealit-internal` e `idealit-hub-publish`; `docker volume ls` no mostró volúmenes. No se observaron contenedores de MVP ni puertos de API en escucha.
- `/home/admin-idealit/workspace` existe. No se inspeccionaron archivos `.env` ni contenidos de credenciales.
- Red: `eth0`, driver `hv_netvsc`, DHCPv4 `172.24.151.30/20`, gateway y DNS `172.24.144.1`. DNS resolvió `archive.ubuntu.com` y una petición HTTPS de cabeceras a ese host respondió `200`.
- `ss` muestra SSH en `0.0.0.0:22` y `[::]:22`, además del hub ligado al loopback. La política de firewall no se pudo determinar.

## Comprobaciones pendientes por privilegios

Las consultas `sudo -n` indicaron que se requiere autenticación interactiva. Por eso quedan pendientes los detalles de `pvs`, `vgs`, `lvs`, UFW/nftables y la configuración efectiva completa de `sshd` (incluida la autenticación por contraseña). No se solicitó ni almacenó una contraseña para completar estas consultas. Antes de exponer servicios, pedir a un administrador que ejecute las comprobaciones de solo lectura y registre únicamente los resultados no sensibles.

## Convenciones de trabajo

- Carpeta raíz: `/home/admin-idealit/workspace` (existe; contiene el proyecto Compose `idealit-hub`).
- Para la receta del hub estático de 18 tarjetas, límites de recursos, red
  Docker interna y comandos de operación, consultar [WORKSPACE_DOCKER.md](./WORKSPACE_DOCKER.md).
- El hub es una página estática de demostración con tarjetas de marcador; no
  implica que las 18 demos estén desplegadas o conectadas.
- Mantener cada proyecto en una subcarpeta independiente.
- Preferir Docker Compose por proyecto para bases de datos, cachés y servicios auxiliares.
- No instalar PostgreSQL, Redis, Node.js, Python u otros runtimes globalmente sin justificarlo por las necesidades del proyecto. Priorizar contenedores o Dev Containers cuando corresponda.
- No abrir puertos a Internet. Para desarrollo, mantener el acceso limitado a la red local de Hyper-V.
- No exponer el socket Docker ni publicar puertos sin explicar el alcance y el riesgo.

## Estado de despliegue de aplicaciones — 2026-11-01T22:51Z

- `idealit-hub` continúa activo en `127.0.0.1:8080`; la ruta de landings del hub sigue sin estar publicada.
- `app-alantia-frigorifico` está desplegado en `/home/admin-idealit/workspace/app-alantia-frigorifico`, saludable en Docker y publicado únicamente en `127.0.0.1:8012`. `GET /health` y `HEAD /` respondieron `200`.
- El contenedor tiene un límite estricto de 128 MiB; `docker stats --no-stream` midió 55.82 MiB en la verificación final. Está conectado a `idealit-internal` y a una bridge propia para el port mapping; el binding del host es loopback.
- SQLite opera en `/app/backend/data/db/frigorifico_app.db`, respaldada por el volumen exclusivo `app-alantia-frigorifico-sqlite`. Los endpoints de proveedores y catálogo devolvieron listas vacías; no se cargaron datos de prueba en producción.
- En una lectura del host durante el despliegue: 1.5 GiB RAM visible, 622 MiB disponibles y 514 MiB de swap usados; son cifras puntuales. No desplegar otro servicio sin volver a revisar la presión de memoria.

La fase siguiente sigue siendo desplegar demos autónomas en secuencia, con endpoints de host ligados a `127.0.0.1:80XX`, presupuestos de memoria y almacenamiento exclusivo por subsistema. No iniciar varios MVP simultáneamente con los recursos actuales. AgroTech/PostgreSQL requiere una revisión de memoria antes de aprobarse. Los puertos candidatos y el orden están en [../../md/planning/portfolio-planificacion.md](../../md/planning/portfolio-planificacion.md).

El loopback y el túnel SSH son para acceso de desarrollo autorizado. No publican automáticamente la demo a Internet, no permiten que Vercel alcance la VM y no constituyen una ruta segura para webhooks de terceros. Las integraciones cloud/MCP se mantienen pendientes de autenticación, TLS, firewall y gestión de secretos.
