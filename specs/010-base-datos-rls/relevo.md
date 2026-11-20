# 010 · Relevo (20/11/2026, fin del chat del carril B)

Chat de la fase 2, función 010. Empieza por este archivo. `Estado: EN CURSO`. La carpeta principal sigue en `main`; nada de esto está en `main` salvo lo ya commiteado.

## Estado

- Retoques de `diseno.md` (arquitecto): hechos, sin commit. Tamaño comprobado: 39.207 → 40.620 bytes (+1,4 KB, aviso de D-023; el comprobador da SUPERADO). Para volver a 0 neto se podría acortar «Lo que queda para el plan».
- `pglite-pgtap` 0.0.18: VERIFICADA con Node 26.13.0 en un directorio aislado (`ok()`, `is()`, `finish()` correctos, `npm audit` 0). Anotada en `verificaciones.md`. Aún NO instalada en el repositorio (lo hace la tarea que la necesite, T-008).
- T-001: `en revisión` en `tareas.md`. Rama vigente `tarea/010-T-001-v3`, en el worktree `.claude/worktrees/agent-a42966b03a8b49f66`, commits 790a496, c2f3dcd y 7e96b65, encima de 2df0ffe, 72230cf y 0bf1b0f (ramas v2 y original conservadas). Comprobado por mí: `npx vitest run supabase/tests/pglite tests/unit/bd` 65 en verde; `tsc` limpio; `comprobar-specs` SUPERADO.
- Dictámenes del `revisor` y del `auditor-seguridad` (3 vueltas, 0 bloqueantes, APTO CON CONDICIONES): `evidencias/T-001/dictamenes.md`. Las condiciones abiertas están en su tabla de la vuelta 3.
- `npm test` completo: 118 de 119 en verde en el worktree; falla de forma intermitente `tests/unit/plataforma/reglas-eslint.test.ts` (002) por tiempo de espera de 5 s al coincidir con PGlite. Propuesta n.º 33 en `propuestas.md`.
- Propuestas nuevas 33 (timeout 002) y 34 (D-1 atomicidad por `do` único; D-9 R-4 `statement_timeout`) en `propuestas.md`.

## Falta (en orden)

1. Una última pasada pequeña de `ingeniero-bd` en T-001 (esfuerzo normal, mismas ramas): hallazgos 1, 2 y 4 del auditor (una línea cada uno, con prueba delante) y la regla L 14 del 3 si se quiere cerrar ya. Luego revisión acotada de lo cambiado (`auditor-seguridad`).
2. Integrar T-001 en `main` (sí agrupado del responsable). Deja el nombre de rama `tarea/010-T-001` apuntando a v3 (el worktree original la tiene ocupada).
3. T-002 (depende de T-001 y de L 14 del hallazgo 3). T-003 espera a la enmienda de `search_path` (punto 2 del relevo anterior: una persona/coordinación enmienda `.claude/rules/bd.md`, ADR-0003, `ingeniero-bd.md`, `migracion-bd`, `docs/SEGURIDAD.md`, `docs/TECNOLOGIAS.md`) y a avisar a la 001 antes de aplicar SQL en `Nido`.
4. Pasar `comprobaciones-cli.md` a `verificaciones.md` (comprobaciones 1 y 3 confirmadas; 2 confirmada por código fuente sin ejecutar; 4 VERIFICAR en T-013).

## Decisiones del responsable pendientes

- **Sí agrupado para `main`**: commit de los retoques de `diseno.md`, `verificaciones.md`, `propuestas.md`, `tareas.md`, `especificacion.md` (EN CURSO), `evidencias/T-001/` y la integración de la rama v3. Sin push.
- Confirmar que la atomicidad de M01 y de su reversión (guarda + un único `do`) sustituye a `begin/commit` de D-1.
- Aceptar o resolver el fallo intermitente de la 002 (propuesta 33) antes de integrar.

## Siguiente paso

Chat nuevo que empiece por este archivo: punto 1 de «Falta», con un solo subagente opus a la vez.
