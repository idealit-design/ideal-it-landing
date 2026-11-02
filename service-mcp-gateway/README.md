# Service MCP Gateway experimental

**Versión:** `0.1.0`

Servidor MCP local para consultar metadatos y estadísticas agregadas de las bases SQLite de demostración del monorepo. Expone recursos de esquema/conteos y herramientas de consulta predefinidas; no expone filas, SQL arbitrario ni operaciones de escritura.

## Requisitos

- Python 3.10 o superior
- Las bases SQLite locales de los MVP que se quieran consultar

## Instalación y ejecución (Windows / PowerShell)

Desde la raíz del monorepo:

```powershell
py -m venv service-mcp-gateway\.venv
.\service-mcp-gateway\.venv\Scripts\Activate.ps1
python -m pip install -r service-mcp-gateway\requirements.txt
python service-mcp-gateway\server.py
```

El endpoint MCP Streamable HTTP queda disponible en `http://127.0.0.1:8020/mcp`. El servidor escucha exclusivamente en `127.0.0.1` y también rechaza solicitudes cuyo cliente o encabezado `Host` no sea local.

## Conectar un cliente MCP

En un cliente compatible con MCP Streamable HTTP, registra la URL `http://127.0.0.1:8020/mcp`. Por ejemplo, la configuración de VS Code (`.vscode\mcp.json`) usa:

```json
{
  "servers": {
    "ideal-it-portfolio": {
      "type": "http",
      "url": "http://127.0.0.1:8020/mcp"
    }
  }
}
```

En clientes que usan `mcpServers`, como Claude Desktop, configura:

```json
{
  "mcpServers": {
    "ideal-it-portfolio": {
      "url": "http://127.0.0.1:8020/mcp"
    }
  }
}
```

Inicia el servidor antes de conectar el cliente. No se requieren tokens ni claves API.

## Recursos y herramientas

- `portfolio://databases`: lista las bases permitidas y muestra tablas, columnas y cantidad de filas.
- `portfolio://databases/{database_id}`: muestra los metadatos de una base permitida.
- `get_portfolio_statistics`: devuelve conteos de inspecciones, trámites (inscripciones), productos, envíos y personas.
- `get_mvp_statistics(database_id)`: devuelve metadatos y conteos de una base por su identificador.

Identificadores permitidos: `osma-inspecciones`, `personal`, `formularios`, `tienda-virtual` y `logistica-fleet`. Las rutas de base de datos están fijadas dentro del monorepo. Si una fuente opcional no existe, sus estadísticas aparecen como `null` y se enumera en `unavailable_sources`; un esquema inesperado se informa como error en vez de presentarse como un conteo válido.

## Seguridad y alcance

- Cada conexión SQLite usa `mode=ro` y `PRAGMA query_only=ON`; no se crean, inicializan ni modifican bases.
- No hay herramienta de consulta SQL ni lectura de registros: las consultas se limitan a metadatos y `COUNT(*)` sobre tablas detectadas en fuentes explícitamente permitidas.
- No se devuelven nombres, documentos, emails, observaciones ni otros campos de filas.
- El servidor no acepta conexiones de red externas. No lo publiques mediante túneles, proxies ni reenvíos de puertos.
- Las bases y los conteos corresponden a datos locales de demostración; no son un servicio de producción.

## Pruebas

Desde la raíz:

```powershell
python -m pip install -r service-mcp-gateway\requirements-dev.txt
python -m pytest service-mcp-gateway\tests
```

## Estrategia de Despliegue y Migración

**Prioridad 2 — integración MCP restringida.** La configuración actual es exclusivamente local en `127.0.0.1:8020`; no está desplegada en la VM. No publicar el puerto, usar proxy ni túnel SSH para conectar clientes remotos. La única evolución admisible requiere cliente co-localizado y fuentes SQLite allowlisted/read-only. Un futuro servicio remoto exigiría rediseño con autenticación, autorización, transporte seguro y revisión de cada fuente. No se requieren variables secretas hoy; `MCP_SERVER_URL` y credenciales de transporte serían parámetros futuros y no deben inventarse en el frontend ni almacenarse en Git.
