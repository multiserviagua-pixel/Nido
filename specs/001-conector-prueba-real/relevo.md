# Relevo de la fase 1 · 20/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). La historia está en `git log` y en `docs/TECNOLOGIAS.md`. Sin push. Cada rama vive en su copia de `.claude/worktrees/` (`git worktree list`). `main` avanzó por otros chats (35808be al escribir esto): al integrar, rebasar sobre él.

## Estado (HEAD de `git rev-parse`; pruebas y `npm run verificar` ejecutados por el orquestador)
- `tarea/T-003-menores` (ea09f86): revisor APTO, 3 menores aplicados. `verificar` completo en 0; 56 de 56 en verde.
- `tarea/T-004` (4c0349f, 002): revisor 2.ª vuelta APTO. `verificar` en 0; 105 de 105 en la última ejecución del revisor. Menores aceptados para después: eslint para el diagnóstico no capturado, columna de archivos de la fila T-004 (`specs/002-plataforma-base/tareas.md`), tipo cerrado de `ruta`, `error.codigo` leído una vez en `manejador.ts`, comas en `rutas.test.ts`. `Estado` de T-004 en `tareas.md`: sin cambiar.
- `tarea/T-101` (14c4410, 001): revisor APTO; auditor 2.ª vuelta APTO (1 MENOR: token base64 estándar con `encodeURIComponent`; anotar como límite en `evidencias/T-101/dependencias.md`). `verificar` en 0; 71 de 71.
- `tarea/T-102` (e0c16b7, 001): revisor APTO CON CONDICIONES, auditor en 3 vueltas, última APTO CON CONDICIONES; las condiciones de rama (menores 1 a 5 y cosmético) están aplicadas en 201cee3 y anotadas en T-103 (e0c16b7). Sin 4.ª vuelta del auditor: los cambios son las correcciones que él prescribió. 158 de 158 en `npm test`; `verificar` falló una vez por el timeout conocido de `reglas-eslint.test.ts` (corregido en T-003-menores) y no se repitió completo. Pendiente: registrar `tests/conector/apoyo/sin-red-real.ts` como `setupFiles` (toca `vitest.config.ts`, art. 14; en T-103).
- `tarea/T-005` (d208ebb, 002, adelantada sobre T-004): 139 de 139, `verificar` en 0. Revisor: 2 MAYOR corregidos. Auditor: sin bloqueantes y 1 MAYOR de diseño abierto (ver «Decisiones»). No integrar hasta resolverlo.

## Falta, por orden
1. «Sí» agrupado del responsable. Orden de entrada en `main`: `T-003-menores`, `T-004`, `T-101`, `T-102`, cada una con `merge --squash` y mensaje `T-NNN (fn): …`, rebasando la siguiente; `npm run verificar` por el orquestador en cada una.
2. T-005: tras la decisión, corregir MENOR 2 (sustitutos de `console` con el nivel original; `assert` no emite), 3 (símbolo en `globalThis` no enumerable), 5 (un predicado para `esDesarrollo` y la validación) y el DSN exacto si se acepta; después 2.ª vuelta del auditor.
3. D-030 (plataforma, CI), T-115 a T-119 de la 001 y 002·T-006, T-009, T-010: sin empezar.

## Decisiones del responsable pendientes
- El «sí» agrupado (T-004, T-101 y T-102 son C; T-101 y T-102, además, de la 001, cubiertas por la P1 parcial del 19/11).
- T-005, MAYOR del auditor: `ENTORNO=desarrollo` en Vercel sin las `VERCEL*` (casilla de variables de sistema desactivada) deja la salud en 200 y la consola sin sustituir. Propuesta: exigir además `NODE_ENV !== "production"` para `desarrollo`. Y: exigir `VERCEL` y `VERCEL_ENV` fuera de desarrollo sí; `VERCEL_URL` no (puede faltar con la protección estándar); DSN con forma exacta `^https://[0-9a-f]{32}@o[0-9]+\.ingest\.de\.sentry\.io/[0-9]+$`.
- «Nido» como nombre visible; R-1, R-3, R-4 y R-6 de la 002; C-4 de la 001, DP-1 a DP-5, AR-01 y T-115 (a) sin P1. Push al remoto: sin autorizar.

## Avisos
- La prueba de excepciones de dependencias falla desde el 24/11 por diseño (D-027; la de pglite caduca el 26/11).
- `jose` queda en 6.2.17 solo en el bloqueo: un `npm install` sin él puede subir a 6.2.18 y `manifiesto.test.ts` fallará.
- Cambios sin commit de otros chats en `specs/010`: no son de este chat.
- Los dictámenes no se guardan como archivo; constan en los informes de la sesión.

## Siguiente paso
Con el «sí»: integrar en el orden indicado. Después, T-005 y lo demás de «Falta». Como mucho dos subagentes y un solo opus a la vez.
