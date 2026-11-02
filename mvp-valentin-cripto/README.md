# MVP Cripto Automation Bot — Valentín Cripto 0.1.1

Subsistema aislado para recibir señales de TradingView, validar su autenticidad, simular órdenes y consultar telemetría desde un dashboard HTML/Tailwind. Está implementado con FastAPI y Python 3.11+.

> **Modo seguro de la demo:** todas las órdenes se ejecutan en un ledger simulado local. No se conecta a Binance, no usa API keys y no transmite órdenes a un exchange. No use esta demo como asesoramiento financiero ni como sistema de trading con fondos reales.

## Ejecución local en Windows

Desde la raíz del portfolio:

```powershell
cd mvp-valentin-cripto\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:WEBHOOK_SECRET = "reemplazar-por-un-secreto-largo-y-aleatorio"
uvicorn app.main:app --host 127.0.0.1 --port 8004
```

Abra `http://127.0.0.1:8004`. La telemetría se actualiza cada cinco segundos. La documentación interactiva de la API está disponible en `http://127.0.0.1:8004/docs`.

Para ejecutar pruebas:

```powershell
pip install -r requirements-dev.txt
py -m pytest
```

El backend crea `backend\data\logs\trading_audit.log` al procesar la primera orden. `TRADING_AUDIT_PATH` permite establecer otra ruta local. El saldo inicial del simulador es de 10.000 unidades y se reinicia al reiniciar el proceso; las métricas de auditoría se conservan en el archivo.

## Webhook de TradingView

Configure en TradingView el endpoint público HTTPS:

```text
https://TU-DOMINIO/api/webhook/tradingview
```

Ejemplo de cuerpo JSON compatible con el formato de los scripts Pine del portfolio:

```json
{
  "key": "EL_MISMO_SECRETO_CONFIGURADO_EN_WEBHOOK_SECRET",
  "strategy": "JOKER PRO",
  "symbol": "SOLUSDT.P",
  "action": "buy",
  "1": 0.03,
  "price": 150.25,
  "tp": 154.0,
  "sl": 148.0,
  "probability": 75
}
```

También se acepta `token` en lugar de `key` y `quantity` en lugar del campo legado `"1"`. `action` debe ser `buy` o `sell`; símbolo, cantidad y precio son obligatorios. `event_id` es opcional y sirve para correlacionar el webhook en la respuesta; TradingView puede reintentar solicitudes, por lo que este MVP no ofrece deduplicación persistente.

La respuesta correcta es `202` e incluye `simulated: true`. Credenciales incorrectas devuelven `401`; secreto sin configurar devuelve `503`; JSON o valores inválidos devuelven `422`. Mantenga el secreto largo, aleatorio y exclusivo de este módulo. No lo escriba en repositorios, capturas ni logs.

## Despliegue en VM gratuita OCI o AWS

La disponibilidad de instancias gratuitas, arquitecturas ARM/x86 y cuotas depende de la región y de las condiciones vigentes del proveedor. Verifique la elegibilidad de su cuenta y seleccione Ubuntu 22.04/24.04 LTS. No hay dependencia de una instancia ARM específica.

### 1. Crear la instancia y limitar la red

- **OCI:** cree una instancia elegible en Compute; en la subnet/NSG añada ingreso TCP `22` solo desde su IP administrativa y TCP `80`/`443` desde Internet. En Ubuntu, revise también las reglas de `ufw`.
- **AWS:** cree una instancia elegible en EC2; en el Security Group permita TCP `22` solo desde su IP administrativa y TCP `80`/`443` desde Internet. No habilite el puerto `8004` en el Security Group.
- Asigne IP pública estable o reserve una IP pública/Elastic IP si la política gratuita actual lo permite. Configure DNS `A` para su dominio antes de solicitar el certificado TLS.

### 2. Instalar el servicio

Conéctese por SSH y ejecute:

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip git curl
sudo adduser --system --group --home /opt/mvp-valentin-cripto cripto
sudo mkdir -p /opt/mvp-valentin-cripto
sudo chown cripto:cripto /opt/mvp-valentin-cripto
```

Copie o clone el portfolio en `/opt/mvp-valentin-cripto` usando su método de despliegue. Luego:

```bash
cd /opt/mvp-valentin-cripto/mvp-valentin-cripto/backend
sudo -u cripto python3 -m venv .venv
sudo -u cripto .venv/bin/pip install -r requirements.txt
sudo -u cripto mkdir -p data/logs
sudo install -o root -g cripto -m 0640 /dev/null /etc/mvp-valentin-cripto.env
sudoedit /etc/mvp-valentin-cripto.env
```

Guarde en el archivo de entorno un secreto propio y, si desea separar los datos del código, una ruta absoluta para la auditoría:

```dotenv
WEBHOOK_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_LARGO
TRADING_AUDIT_PATH=/var/lib/mvp-valentin-cripto/trading_audit.log
```

Si establece la ruta `/var/lib/...`, cree y asigne el directorio a `cripto` antes de iniciar el servicio. Restrinja los permisos del archivo de entorno y no incluya sus valores en comandos registrados en el historial.

Cree `/etc/systemd/system/mvp-valentin-cripto.service`:

```ini
[Unit]
Description=MVP Valentín Cripto webhook simulator
After=network-online.target
Wants=network-online.target

[Service]
User=cripto
Group=cripto
WorkingDirectory=/opt/mvp-valentin-cripto/mvp-valentin-cripto/backend
EnvironmentFile=/etc/mvp-valentin-cripto.env
ExecStart=/opt/mvp-valentin-cripto/mvp-valentin-cripto/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8004
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Active y compruebe el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mvp-valentin-cripto
sudo systemctl status mvp-valentin-cripto
curl --fail http://127.0.0.1:8004/health
```

El servicio escucha únicamente en loopback. No exponga directamente Uvicorn ni el puerto `8004`.

### 3. TLS y firewall del sistema

Instale Caddy según la guía oficial de su distribución y cree `/etc/caddy/Caddyfile` con el dominio:

```caddyfile
bot.TU-DOMINIO {
    reverse_proxy 127.0.0.1:8004
}
```

Caddy obtiene y renueva TLS automáticamente cuando DNS apunta a la VM y los puertos 80/443 están permitidos. Habilite el firewall del sistema sin perder acceso SSH:

```bash
sudo ufw allow from TU_IP_ADMINISTRATIVA to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Adapte la regla SSH a su IP antes de activarlo. Conserve también las reglas equivalentes de OCI NSG/security list o AWS Security Group. TradingView debe llamar al dominio HTTPS; el puerto `8004` permanece cerrado hacia Internet.

### 4. Monitoreo de disponibilidad

El script `backend/scripts/check_uptime.sh` consulta `/health` y devuelve código distinto de cero ante error. Puede ejecutarlo localmente en la VM o desde un monitor externo:

```bash
bash /opt/mvp-valentin-cripto/mvp-valentin-cripto/backend/scripts/check_uptime.sh https://bot.TU-DOMINIO/health
```

Para una comprobación local periódica con cron cada cinco minutos:

```cron
*/5 * * * * /opt/mvp-valentin-cripto/mvp-valentin-cripto/backend/scripts/check_uptime.sh http://127.0.0.1:8004/health >> /var/log/mvp-valentin-cripto-uptime.log 2>&1
```

Consulte fallos y reinicios con `sudo journalctl -u mvp-valentin-cripto -f` y `sudo journalctl -u caddy -f`.

## Límites operativos

- La simulación, las posiciones y el saldo residen en memoria y se reinician al reiniciar el proceso. El log de auditoría persiste localmente, pero no restaura el estado del saldo.
- Ejecute un solo worker Uvicorn: el saldo y las posiciones no se comparten entre workers.
- El MVP no implementa deduplicación, base de datos, gestión de riesgo, comisiones, liquidez ni conexión real a Binance. El PnL es indicativo y solo simulado.
- Proteja el acceso al dashboard/API con controles de infraestructura si no deben ser públicos y configure rotación/retención del log en producción.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para contratos de API, componentes y límites del diseño.

## Estrategia de Despliegue y Migración

**Prioridad 2 — webhook/Cloud.** La simulación se puede probar localmente, pero recibir TradingView requiere endpoint HTTPS accesible desde Internet. La VM no aloja este servicio y su loopback no es accesible para el proveedor; el puerto interno `8025` es solo una reserva de diseño, sin publicación al host. Antes de integrar: proxy HTTPS autenticado, `WEBHOOK_SECRET` inyectado desde gestor de secretos (solo el nombre en `.env.example`), límite de tamaño/tasa, idempotencia persistente, protección del dashboard, retención de auditoría y prueba en sandbox. Mantener órdenes simuladas; no usar claves de exchange ni fondos reales.
