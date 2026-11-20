# Relevo de la fase 1 · 20/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). La historia está en `git log` y en `docs/TECNOLOGIAS.md`. `main` sigue en `c29e8ec`, sin push; las 4 ramas de abajo no están integradas y cada una vive en su copia de `.claude/worktrees/` (`git worktree list`).

## Estado (cada rama: HEAD de `git rev-parse`; pruebas ejecutadas por el orquestador)
- `tarea/T-003-menores` (4b64ae5): menores de T-003 y calentamiento de ESLint con plazo propio. 56 de 56 en verde, `tsc` y ESLint en 0. Sin revisor todavía.
- `tarea/T-004` (4c0349f, 002): errores, manejador, entrada, registro, `/api/salud` y la regla de `new Error`/`throw` de §Umbrales. 105 de 105 en verde en la última ejecución. Revisor 1.ª vuelta: APTO CON CONDICIONES; los hallazgos 1, 3, 4, 5 y 6 están corregidos. Falta la 2.ª vuelta, solo sobre lo cambiado. Pendientes (no corregidos): 2 (el diagnóstico no capturado necesita una excepción de ESLint solo para ese archivo; anotarla en el diseño al llegar), 7 (añadir `eslint.config.mjs` y `reglas-errores.test.ts` a la columna de archivos de la fila T-004) y 8 (tipo cerrado para `ruta` del registro). `Estado` de T-004 en `tareas.md`: sin cambiar (pendiente).
- `tarea/T-101` (14c4410, 001, C): dependencias y escáner. Revisor: APTO. Auditor: APTO CON CONDICIONES; sus dos MAYOR (base64 estándar y exclusión por la izquierda) están corregidos con prueba delante. 17 de 17 en verde en esas pruebas; `comprobar-specs` SUPERADO. Falta la 2.ª vuelta del auditor sobre `scripts/patrones-secretos.mjs` y la evidencia. Condiciones para tareas futuras, anotadas en `evidencias/T-101/dependencias.md`: operación valida `^hia_op_[A-Za-z0-9_-]{43}$` antes del hash y AR-06 fija base64url (T-1xx de operación); reglas de revisión para `postgres` 3.4.9.
- `tarea/T-102` (b77c089, 001, C): apoyo de la batería. 14 de 14 en verde. Revisor: APTO CON CONDICIONES (2 MAYOR y 10 MENOR; resumen en «Falta»). Sin auditor.
- Aviso: `reglas-eslint.test.ts` (caso 1) agota 5 s con la máquina cargada; la corrección está solo en `tarea/T-003-menores`. Integrar esa rama antes que las demás, o `verificar` sale intermitente.
- Dictámenes: no se guardan como archivo; constan en los informes de la sesión.

## Falta, por orden
1. Revisor sobre `tarea/T-003-menores` (rápido).
2. T-102, corregir (encargo a `qa` en su copia `agent-a0c07ac246efbe954`): MAYOR-1 (el sumidero debe registrar también `util.inspect` completo y probar `Error` con propiedades, `Map`, `Headers`, `Buffer`); MAYOR-2 (el reloj: fallar a la vista ante `current_date`, `localtimestamp`, `'now'::timestamptz`, `timeofday()` y `pg_catalog.now()`; `now()` estable dentro de la transacción); MENOR 1, 2, 6 (`ErrorAlmacen.causa` solo SQLSTATE), 8 (quitar `nombre` y alinear campos), 9 (sin consulta de URL en el mensaje). Anotar en T-103 (orquestador/arquitecto): hora en el SQL solo con `now()` o `current_timestamp` y caducidad con límite por los dos lados; PRUEBA-007 B no prueba carreras. Después auditor-seguridad y 2.ª vuelta.
3. 2.ª vuelta del revisor sobre T-004 y del auditor sobre T-101.
4. «Sí» agrupado del responsable. Orden de entrada en `main`: `T-003-menores`, `T-004`, `T-101`, `T-102`, cada una con `merge --squash` y mensaje `T-NNN (fn): …`, rebasando la siguiente; `npm run verificar` por el orquestador en cada una.
5. D-030 (plataforma, CI), T-115 a T-119 de la 001 y 002·T-005, T-006, T-009, T-010: sin empezar.

## Decisiones del responsable pendientes
- El «sí» agrupado de arriba (T-004, T-101 y T-102 son C o tocan la regla de errores; T-101 y T-102, además, son de la 001, cubiertas por la P1 parcial del 19/11).
- «Nido» como nombre visible; R-1, R-3, R-4 y R-6 de la 002; C-4 de la 001, DP-1 a DP-5, AR-01 y T-115 (a) sin P1. Push al remoto: sin autorizar.

## Avisos
- La prueba de excepciones de dependencias falla desde el 24/11 por diseño (D-027; la de pglite caduca el 26/11).
- `jose` queda en 6.2.17 solo en el bloqueo: un `npm install` sin él puede subir a 6.2.18 y `manifiesto.test.ts` fallará (seguro).
- Cambios sin commit de otros chats en `specs/010` y `specs/020`: no son de este chat.

## Siguiente paso
Chat nuevo: puntos 1 a 3 de «Falta», y pedir el «sí» agrupado. Como mucho dos subagentes y un solo opus a la vez.
