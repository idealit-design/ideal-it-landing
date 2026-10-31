# MVP Visitor Pass & Corporate Access Control 0.1.1

Subsistema local e independiente para registrar visitantes, emitir pases temporales y controlar ingresos y salidas desde recepción. Utiliza PHP 8 nativo con PDO, SQLite y una interfaz HTML5/Tailwind.

## Requisitos

- PHP 8.0 o superior.
- Extensiones PHP `PDO` y `pdo_sqlite` habilitadas.
- Conexión a Internet para cargar Tailwind CSS desde su CDN.

## Ejecución local

Desde la raíz del portfolio, en PowerShell:

```powershell
cd mvp-visitor-pass
php -S localhost:8000
```

Abre `http://localhost:8000`. La primera petición a `api.php` crea automáticamente `data/visitors_mvp.db` y sus tablas. El proceso de PHP debe tener permiso de escritura en `data/` (la carpeta también se crea automáticamente).

Para verificar la configuración de extensiones:

```powershell
php -m
```

Confirma que aparezcan `PDO` y `pdo_sqlite`.

## Flujo operativo

1. Busca al visitante por DNI.
2. Si no está registrado, completa nombre, empresa de origen y teléfono.
3. Indica el anfitrión y motivo para emitir el pase; el ingreso se registra al crearlo.
4. En **Actualmente dentro**, registra la salida al finalizar la visita.

La API devuelve JSON y puede probarse directamente con un cliente HTTP. Por ejemplo:

```powershell
Invoke-RestMethod -Method Get "http://localhost:8000/api.php?action=active"
```

## Alcance y privacidad

Es una demo local sin autenticación, roles, QR, notificaciones ni integraciones de control físico. No debe exponerse a Internet ni utilizarse como registro oficial. Usa datos ficticios: el DNI y demás datos personales se almacenan localmente sin cifrado. Protege el equipo y los permisos del directorio de datos.

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el modelo relacional, endpoints y límites del diseño.
