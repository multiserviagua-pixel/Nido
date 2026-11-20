# Relevo de la fase 1 · 20/11/2026

Reescrito entero (regla «Relevo auténtico» de la skill `orquestar`). La historia está en `git log` y en `docs/TECNOLOGIAS.md`.

## Estado (comprobado en `main`, HEAD `12044a1`, sin push)
- 001: `tareas.md` reagrupado de 64 a **19 tareas** (T-101 a T-119; el arquitecto no pudo bajar a 15 por dependencias), commit `194472a`. 21 KB; `plan.md` 19 KB. Cobertura de REQ-001..020 y CA-001..025 comprobada con grep. Tabla de equivalencias antigua → nueva al final de `tareas.md`. Estado 001: DISEÑADA; la P1 parcial del 19/11 equivale a T-101 a T-114.
- 002·T-002 (páginas) y T-003 (`npm run verificar`) integradas con `merge --squash` y el «sí» del responsable: `12044a1`. Rama conservada: `tarea/T-002-T-003`. Revisor: APTO en segunda vuelta (T-002) y sin bloqueantes (T-003). Auditor: APTO CON CONDICIONES sobre la excepción de pglite (condiciones a y b cumplidas).
- D-033 (excepción de calendario para pglite 0.5.17, hasta el 26/11) en `0b1e264`.
- `npx vitest run`: 54 de 54 en verde (3 de 4 ejecuciones; la primera dio 1 fallo no reproducido, posible tiempo de arranque de ESLint, sin comprobar). `npx tsc --noEmit`: sin errores. `npm run verificar` en la rama: salida 0. `node scripts/comprobar-specs.mjs`: SUPERADO, 27 avisos de tamaño.
- Cambios sin commit de otros chats en `specs/010` y `specs/020`: no son de este chat.
- Dictámenes: no se guardaron como archivo; constan en los informes de la sesión.

## Falta, por orden
1. 002: T-004 `[P]`, T-005, T-006, T-009, T-010 (T-007 y T-008 bloqueadas por R-1). Añadir a T-004 (o tarea nueva) la regla «`new Error` no literal / `throw` distinto de `ErrorDeAplicacion`» de diseno §Umbrales: el revisor la marca como condición antes de cerrar la 002.
2. Menores de T-003 sin corregir: `toThrow()` sin mensaje en las dos negativas de `manifiesto.test.ts`; `reportUnusedDisableDirectives` solo con `toBeDefined()`; falta prueba de `satisfies`; D-027 sin referencia a D-033.
3. D-030: tarea de `plataforma` para el CI (Vitest, `npm audit`, contraste de fechas con el registro). Ruta crítica: revisor y auditor. Sin push no se aplica.
4. 001: T-101 en adelante; antes, P1 de T-115 a T-119 (sigue sin abrir).

## Proceso
D-029: fuera de rutas críticas, prueba delante y `revisor`. D-032: un solo subagente `opus` a la vez por chat; código en copia de trabajo (worktree) y rama propia. T-003 tocó `package.json` y `eslint.config.mjs` (marcada C y reservada en la tabla): el responsable pidió solo revisor, y el auditor entró únicamente para la excepción.

## Decisiones del responsable pendientes
- «Nido» como nombre visible (h1 de `/` y `title`): ningún documento lo aprueba.
- R-1 (migraciones y RLS fuera de la 002: T-007 y T-008 bloqueadas), R-3, R-4 y R-6 de la 002.
- C-4 de la 001 (orden de reglas de cabeceras en Next 16); DP-1 a DP-5; AR-01 y T-115 (a) sin P1.
- Push al remoto: sin autorizar.

## Avisos
- La prueba de excepciones de dependencias falla desde el 24/11 por diseño (salida en D-027; la de pglite caduca el 26/11).
- eslint 9.39.5 figura como obsoleto en el registro de npm.
- `npm run tipos` completo y `build` funcionan desde T-002.

## Siguiente paso
Chat nuevo: punto 1 de «Falta» (T-004 de la 002, con la regla añadida).
