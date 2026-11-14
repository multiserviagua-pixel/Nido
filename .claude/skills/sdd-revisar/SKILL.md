---
name: sdd-revisar
description: Paso 6 del ciclo SDD. Somete un cambio a revisión independiente (revisor, y auditor-seguridad si toca una ruta crítica) y gestiona los hallazgos. Úsala cuando una tarea esté en revisión, o cuando se pida revisar un cambio antes de integrarlo.
argument-hint: "[NNN-nombre de la función] [T-NNN]"
---

# Revisar un cambio

Sale: dictamen sin bloqueantes y la tarea en estado `hecha`, o los hallazgos devueltos a quien implementó.

## Pasos

1. Determina si el cambio toca una **ruta crítica** (`docs/SEGURIDAD.md`): autorización y licencias; migraciones, RLS, funciones y roles; herramientas del conector y contratos; webhook y suscripciones; versiones y entrega del prompt; `.claude/settings.json`, ganchos, CI y despliegue.
2. Encarga al agente `revisor`:
   - Qué revisar: la tarea `T-NNN` y los archivos o el `git diff` del cambio.
   - Leer: la tarea, sus requisitos, el diseño y los contratos.
   - No le des tu valoración ni el resumen del autor.
3. Si toca una ruta crítica, encarga a la vez al agente `auditor-seguridad`, con el mismo material.
4. Si el cambio maneja entradas, registros o errores, aplica la skill `revision-privacidad`.
5. Reúne los hallazgos:
   - **BLOQUEANTE**: vuelve a quien implementó, con el hallazgo literal. Tras la corrección, se revisa otra vez.
   - **MAYOR**: se corrige antes de cerrar la función, o el responsable acepta el riesgo por escrito.
   - **MENOR**: se anota; se corrige si es barato.
6. Guarda los dictámenes en `specs/NNN/evidencias/` y añade una fila a la tabla de dictámenes de `verificacion.md`.
7. Sin bloqueantes: marca la tarea `hecha` en `tareas.md`.

## No

- Quien implementó no revisa su propio cambio.
- No rebajes la gravedad de un hallazgo para avanzar.
- No des por revisado un cambio en ruta crítica sin el `auditor-seguridad`.
- El dictamen no sustituye a la protección de la rama ni a la aprobación del responsable.
