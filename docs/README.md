# Documentación general — Ideal-IT

Este directorio organiza la documentación transversal del ecosistema. Las
guías de operación de la VM y los prompts de trabajo están separados por tema;
las arquitecturas específicas permanecen junto a cada proyecto.

## Índice

- [Estado del ecosistema](./ECOSYSTEM_STATUS.md) — inventario y despliegues comprobados.
- [Operaciones de VM y Docker](./operations/README.md) — contexto de infraestructura,
  operación del hub y estado de servicios en la VM.
- [Guías de trabajo](./guides/COPILOT_SETUP_PROMPT.md) — prompt operativo para
  preparar la VM desde VS Code Remote - SSH.
- [Planificación transversal](../md/planning/portfolio-planificacion.md).
- [Índice documental del portfolio](../md/README.md).

La IP de la VM es dinámica por utilizar Hyper-V Default Switch; comprueba el
estado vigente antes de conectarte. `VM_CONTEXT.local.md` es un archivo local
con información sensible: no se incluye en este índice, no se copia ni se
comparte.
