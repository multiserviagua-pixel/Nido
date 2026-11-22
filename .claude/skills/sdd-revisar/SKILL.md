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
   - Modelo (D-043): antes de elegirlo, compara `git diff --name-only` con las rutas críticas de `docs/SEGURIDAD.md` y con las «Críticas» de `specs/002-plataforma-base/diseno.md` (§Integración). Si alguna coincide, usa el modelo de su cabecera y llama al `auditor-seguridad`, diga lo que diga la etiqueta RC. Solo si la etiqueta es `R` y el diff no toca ninguna, encárgalo con `model: sonnet`. En especificaciones, diseños y planes, siempre el de su cabecera.
3. Si toca una ruta crítica o la tarea es RC `D`, encarga a la vez al agente `auditor-seguridad`, con el mismo material: en el mismo mensaje que al revisor, sin esperar su dictamen (D-043). Revisor y auditor sobre el mismo cambio cuentan como una sola revisión a efectos del límite de subagentes. Un dictamen que no termina con «Sin bloqueantes» o «N bloqueantes» no cuenta: sin los dictámenes completos, la tarea no pasa a `hecha`.
4. Si el cambio maneja entradas, registros o errores, aplica la skill `revision-privacidad`.
5. Reúne los hallazgos:
   - **BLOQUEANTE**: vuelve a quien implementó, con el hallazgo literal. Tras la corrección, se revisa otra vez.
   - **MAYOR**: se corrige antes de cerrar la función, o el responsable acepta el riesgo por escrito. Solo cuenta como MAYOR si trae su escenario de fallo concreto (D-043, `docs/CALIDAD.md`); si no, devuélveselo a quien lo dictaminó para que lo concrete o lo deje como sospecha, salvo los de los artículos 1 a 4, 8 y 9 de la constitución, y cualquier hallazgo en una ruta crítica, que conservan su gravedad. El orquestador nunca reclasifica un hallazgo; si discrepa, para y lo escribe en el relevo.
   - **MENOR**: se anota; se corrige si es barato. No detiene la integración: lo que no se corrija en la misma vuelta va a una tarea de limpieza en `tareas.md` (como T-125 de la 001). En una ruta crítica, cualquier cambio posterior al dictamen, también el arreglo de un MENOR, pasa una vuelta del `auditor-seguridad` limitada a ese diff: el criterio de integración de D-036 se refiere al dictamen del último commit.
   - **Sospecha** (D-043): va, con la prueba que la confirmaría, a la tabla de dictámenes de `verificacion.md` o a la tarea de limpieza; no se pierde.
   - **Segunda vuelta** (D-043): encárgala solo sobre las correcciones y los hallazgos abiertos. No abre hallazgos nuevos, salvo cualquier BLOQUEANTE (anterior o nuevo), cualquier hallazgo de los artículos 1 a 4, 8 y 9, o un MAYOR que haya introducido la propia corrección.
   - **Lecciones** (D-043): un MAYOR que ya salió en otra tarea de la misma ruta se añade, en el mismo cambio que lo corrige, a la sección «Lecciones de revisión» de la regla de esa ruta en `.claude/rules/` (o a la lista de su skill), con la tarea de origen. Una lección solo añade comprobaciones: nunca declara que algo no es hallazgo, y la revisan el revisor y el auditor del cambio que la añade.
6. Guarda los dictámenes en `specs/NNN/evidencias/` y añade una fila a la tabla de dictámenes de `verificacion.md`.
7. Sin bloqueantes: marca la tarea `hecha` en `tareas.md`.

## No

- Quien implementó no revisa su propio cambio.
- No rebajes la gravedad de un hallazgo para avanzar.
- No des por revisado un cambio en ruta crítica sin el `auditor-seguridad`.
- El dictamen no sustituye a la protección de la rama ni a la aprobación del responsable.
