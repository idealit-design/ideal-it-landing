# Referencias históricas y límites de evidencia

Este índice conserva un resumen de una revisión documental anterior sobre `portfolio/`; el contenido histórico queda excluido de la revisión actual y no se revalida. Los respaldos se conservan sin modificación; no se copian fuentes, datos, secretos, medios ni dependencias a la landing. Los README que son plantillas de CLI no prueban que el producto descrito esté implementado.

El inventario recursivo encontró 5.144 archivos `.md` bajo `portfolio/`; 29 quedan fuera de árboles reconocidos como SDK, vendor, librerías, cachés o dependencias. La mayor parte del volumen corresponde a documentación empaquetada con proyectos de terceros (por ejemplo, Flutter y librerías); se inventarió, no se reprodujo en `/md`. La consolidación sintetiza documentación propia/relevante y mantiene los respaldos originales intactos.

## Proyectos

| Referencia local | Evidencia encontrada | Tratamiento |
|---|---|---|
| `App ULP Educativa/` | `cientificossl/README.md` y `pubspec.yaml`/`lib/` de Flutter; `cientificos3/MiApp/` contiene proyecto Expo/React Native. La cantidad de capítulos/secciones procede del recuerdo del equipo, no del README inspeccionado. | Tarjeta de propuesta; confirmar cuál proyecto corresponde a la entrega educativa y su alcance antes de demo o reescritura. |
| `Sistema ALANTIA Formularios/` | Varias copias de `panel*/README.md` son plantillas de Angular CLI. Hay respaldos, capturas y código fuente. El MVP actual documenta un producto separado y datos sintéticos. | El MVP Formularios representa el caso funcional con nombre genérico. No publicar organización, usuario, captura o datos sin autorización. |
| `Sistema ALANTIA Frigorifico/` | Guías de interfaz/login y documentación de API para catálogo, proveedores, saldos, ingreso de medias res, desposte, ingresos directos, transferencias y conteos. Especificación documentada, no prueba de ejecución actual. | Antecedente de dominio para el nuevo `app-alantia-frigorifico`, que posee código, SQLite, API y fixtures propios. No publicar URL de API, IDs de autenticación ni ejemplos identificables de los manuales; el módulo nuevo no reutiliza servicios ni datos históricos. |
| Archivo de prestadores de cliente | Hay múltiples snapshots, guías y changelogs de una aplicación de cliente. La documentación describe datos y flujos operativos. | Excluido del catálogo y de ejemplos públicos por decisión explícita del equipo. No importar código ni reutilizar nombres, datos, credenciales o capturas. El MVP Auditoría debe seguir siendo un caso nuevo, neutro y sintético. |
| `Sistema OSMA Inspecciones/` | Respaldos de UI y consultas; los README de frontend son plantillas React/Vite. El MVP actual tiene arquitectura propia React PWA/FastAPI/SQLite y datos ficticios. | Se presenta como “Inspecciones de Campo”; no se integra con bases ni datos del sistema original. |
| `Sistema RKS Caja/RKZ/` | `frontend/package.json`: React 19/Vite/Tailwind; `backend/requirements.txt`: FastAPI, SQLModel, PostgreSQL; hay backup SQL y scripts. El README de frontend es una plantilla. | La ficha POS sigue siendo histórica/propuesta. `web-pos-comercial/` es un MVP neutral e independiente con datos sintéticos; no importa el dump ni demuestra conciliación Excel. Revisar el respaldo en entorno aislado antes de cualquier afirmación sobre el sistema histórico. |
| `Web ALANTIA Municipium/muni/` | `package.json`: React 19, Vite 7 y Tailwind 4; README genérico de React/Vite. | Ficha de referencia de interfaz sin atribuir backend. Validar autorización para reutilizar contenido/marca. |
| `Web IdealSEO/IdealSEO/` | `package.json`: React 19, Vite 7 y Tailwind 4; README genérico React/Vite. | La memoria de Bootstrap no coincide con el manifest actual; conservarlo como dato pendiente, no como etiqueta confirmada. |
| `Web Valentin Cripto/` | Scripts Pine y snapshots de estrategias; no se localizó README Markdown propio. El MVP `mvp-valentin-cripto` documenta webhook autenticado y simulación local. | El MVP público es solo el simulador; no usar estrategias, credenciales, endpoints o afirmaciones de Binance real. |

Un documento interno del archivo contiene contexto de planificación provisto por el equipo; no es una especificación funcional ni evidencia de aceptación. Mantenerlo como antecedente interno.

## Nota de seguridad documental

Los respaldos históricos pueden incluir configuraciones de servicios, identificadores, muestras de datos o archivos de cliente. No copiar su contenido a `ideal-it-portfolio`, commits, capturas, videos o docs públicos sin una revisión y autorización específicas. Al preparar un demo, generar fixtures sintéticos nuevos y buscar secretos/PII antes de publicar.
