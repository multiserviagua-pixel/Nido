---
name: sdd-verificar
description: Paso 7 del ciclo SDD. Ejecuta la verificación de una función contra todos sus criterios de aceptación y recoge las evidencias. Úsala cuando todas las tareas de una función estén hechas.
argument-hint: "[NNN-nombre de la función]"
---

# Verificar

Sale: `specs/NNN/verificacion.md` completo, evidencias en `specs/NNN/evidencias/` y la función en estado VERIFICADA.

## Pasos

1. Comprueba que todas las tareas de `tareas.md` están `hecha` y que no quedan hallazgos BLOQUEANTES ni MAYORES sin resolver o aceptar.
2. Encarga al agente `qa`:
   - Leer: `especificacion.md`, `diseno.md`, `tareas.md`, `docs/CALIDAD.md`.
   - Entregar: `verificacion.md` con una fila por prueba `PRUEBA-NNN`, y la evidencia de cada ejecución.
   - Todo `REQ-` y todo `CA-` debe aparecer en la matriz.
3. Aplica las puertas que indique `plan.md`:
   - **P3 Integración**: aislamiento, extremo a extremo, repetición, concurrencia.
   - **P4 Seguridad y privacidad**: escáneres en verde, dictámenes sin bloqueantes, `revision-privacidad`.
   - **P5 Experiencia** (si hay interfaz): encarga la revisión al agente `disenador-ui`.
   - **P6 Operación** (si toca datos, despliegue o prompt): encarga al agente `plataforma` la prueba de vuelta atrás.
4. Comprueba tú:
   - Ejecuta al menos las pruebas automáticas principales y compara con lo anotado.
   - Cada evidencia tiene commit, prueba, fecha, entorno, comando y resultado.
   - Ninguna evidencia contiene secretos ni datos reales.
   - Lo no ejecutado está anotado como «no ejecutada», con motivo y dónde se ejecutará.
5. `node scripts/comprobar-specs.mjs`.
6. Si todos los `CA-` tienen evidencia de «superada»: `Estado: VERIFICADA`. Sigue con `cerrar-fase`.
7. Si alguno falla o no se ha ejecutado: la función sigue EN CURSO. Informa al responsable de qué falta.

## No

- No marques «superada» una prueba que no se ha ejecutado.
- No reinterpretes un criterio para que pase. Si está mal escrito, vuelve a `sdd-aclarar`.
- No verifiques tú en lugar de `qa`.
