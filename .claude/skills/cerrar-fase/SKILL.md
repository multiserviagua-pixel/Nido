---
name: cerrar-fase
description: Paso 8 del ciclo SDD y puerta P7. Cierra una función verificada o una fase completa del plan, con la aprobación expresa del responsable, y deja al día el plan y el registro de decisiones. Úsala cuando una función esté VERIFICADA o cuando se pida cerrar una fase.
argument-hint: "[NNN-nombre de la función | fase N]"
---

# Cerrar una función o una fase

Solo el responsable cierra. Tú preparas el cierre y lo anotas.

## Cerrar una función

1. Comprueba: estado VERIFICADA; todos los `CA-` con evidencia; dictámenes sin bloqueantes; `node scripts/comprobar-specs.mjs` sin errores.
2. Presenta al responsable, en una pantalla:
   - Qué se ha entregado.
   - Criterios de aceptación y su resultado.
   - Lo que no se ha podido comprobar y dónde se comprobará.
   - Riesgos aceptados y hallazgos MENORES pendientes.
   - Decisiones que han cambiado.
3. **Puerta P7**: con su aprobación expresa, `Estado: CERRADA` y tabla de cierre de `verificacion.md` con fecha y commit.
4. Actualiza `docs/TECNOLOGIAS.md`: las decisiones VERIFICAR resueltas pasan a CONFIRMADO con su evidencia; las sustituidas, a SUPERADO con referencia.

## Cerrar una fase

1. Comprueba que todas las funciones de la fase están CERRADAS.
2. Repasa uno a uno los criterios de aceptación de la fase en `docs/PLAN.md`. Marca solo los que tengan evidencia y di dónde está.
3. Comprueba que no queda ninguna decisión VERIFICAR asignada a esa fase.
4. Presenta al responsable el resultado y lo que queda pendiente para la fase siguiente (cuentas, gasto, decisiones).
5. Con su aprobación expresa: actualiza la tabla de seguimiento de `docs/PLAN.md` (estado, quién, fecha) y el estado en `CLAUDE.md`.

## Fase 0

Su cierre exige dos respuestas del responsable: ratificar la constitución (D-012) y aprobar `docs/ESQUELETO.md`. Al ratificar, cambia el estado de `docs/CONSTITUCION.md` a RATIFICADA con fecha y D-012 a CONFIRMADO.

## No

- No cierres nada sin respuesta expresa. El silencio no es aprobación.
- No marques un criterio sin evidencia.
- Las fases se cierran en orden. Especificar y diseñar una fase posterior puede ir en paralelo; implementarla, solo cuando se cumplan sus dependencias (`docs/PLAN.md`).
