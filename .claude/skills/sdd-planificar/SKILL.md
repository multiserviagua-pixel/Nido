---
name: sdd-planificar
description: Paso 4 del ciclo SDD y puerta P1. Convierte el diseño en un plan y en tareas T- con agente y prueba, y pide al responsable que apruebe diseño y plan. Úsala cuando una función esté en estado DISEÑADA.
argument-hint: "[NNN-nombre de la función]"
---

# Planificar y aprobar

Sale: `specs/NNN/plan.md` y `specs/NNN/tareas.md`. Con la aprobación del responsable, la función pasa a PLANIFICADA.

## Pasos

1. Encarga al agente `arquitecto`:
   - Leer: `especificacion.md`, `diseno.md`, `docs/EQUIPO.md` (qué hace cada agente).
   - Entregar: `plan.md` y `tareas.md` con las plantillas de `specs/_plantillas/`.
2. Comprueba las tareas:
   - Cada tarea tiene un solo agente, sus requisitos, sus dependencias y **la prueba que la cierra**.
   - Son pequeñas: un cambio revisable de una vez.
   - Todo `REQ-` aparece en al menos una tarea.
   - `[P]` solo en tareas que no comparten archivos.
   - Las pruebas van antes o en la misma tarea que el código, nunca en una tarea posterior «de pruebas».
   - El `plan.md` lista las rutas críticas tocadas y las puertas que aplican (P5 si hay interfaz, P6 si toca datos, despliegue o prompt).
3. Ejecuta `node scripts/comprobar-specs.mjs`.
4. **Puerta P1**: presenta al responsable, en una pantalla:
   - Cómo se resuelve (resumen del diseño).
   - Qué se crea o cambia, y qué dependencias nuevas entran.
   - Riesgos y rutas críticas.
   - Número de tareas y orden.
   - Lo que tendrá que hacer una persona (crear cuentas, poner secretos, aprobar gasto).
5. Solo con su aprobación expresa: `Estado: PLANIFICADA`, tabla de aprobación de `plan.md` con fecha, y comprobador otra vez.

## No

- No empieces a implementar sin la puerta abierta.
- No aceptes tareas sin prueba ni tareas que mezclen varios agentes.
