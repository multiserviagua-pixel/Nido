# 010 · Relevo (22/11/2026, carril B, 7.ª parte)

Chat de la fase 2, función 010. Empieza por este archivo. `Estado: EN CURSO`. La carpeta principal sigue en `main`. Sin push. Las decisiones de la coordinación por D-036 están al final de `tareas.md`.

## Estado

- **T-001 a T-008 hechas.** T-001 a T-007 integradas en `main`. **T-008 hecha en local** (ayudas, `01_estructura` con 36 aserciones, `07_informes` con 30, L 2 en verde; el mismo SQL ejecutado en PGlite con `@electric-sql/pglite-pgtap` 0.0.18): revisor APTO CON MENORES y auditor-seguridad APTO, ambos en la 2.ª vuelta; aprobada por delegación D-036, revocable. **pgTAP en CI no ejecutado: falta T-013.** Dictámenes y qué se hizo con cada hallazgo en `evidencias/T-008/dictamenes.md`; verde y equivalencias en `verde.md`.
- **Menores abiertos de T-008** (detalle en `evidencias/T-008/dictamenes.md`): R2-4 y A2-3 (casos 3 y 5 de 07 comparan el mensaje en inglés; T-013: SQLSTATE y `constraint_name` con `get stacked diagnostics`); R2-5 (la aserción 4 se satisface con un check de varias columnas cuya expresión regular nombre otra columna), A2-1 (aserción 3 sin esquema) y A2-2 (tipo de las tres columnas de `privado.permisos_por_defecto_previos` sin fijar): cierre de la 010 o T-011. Los demás R2 están corregidos.
- **Siguiente: T-009 `[P]` y T-010 `[P]`** (según `tareas.md`, ambas dependen de T-008). Un solo subagente opus a la vez.
- **Decisiones de T-007 y anteriores:** T-007 (seed, volumen, `config.toml`, procedimiento de administradores): APTO CON MENORES y APTO; decisiones en `diseno.md`, «Decisiones de T-007». T-006 (M08, M09, M10): decisiones en «Decisiones de T-006» (1 a 12). De T-003: D-11 y formato TP de D-7; L 10 solo vigila reversiones; L 13 y L 14 se aplican a todas las migraciones nuevas. Dictámenes en `evidencias/T-00N/`.
- **Condiciones heredadas de T-005 aún abiertas:** al cierre de la 010, atar el nombre de política y disparador de la reversión de M07 a su tabla y probar la homónima.

## Pendientes

1. **T-014 (A-12):** `log_statement`, `log_min_duration_statement` y `log_min_error_statement` en `Nido` (P-36 de la 022). Además: comprobar que `pg_db_role_setting` no fija `app.reversion_protegida` (`evidencias/T-003/pendientes-T-014.md`) y decidir cómo se supervisa `error_interno`.
2. **Incorporadas en T-008:** m-45 y m-49 (lista de `security definer` por firma; propuesta 45).
3. **Recuento total pgTAP: 1.332** (1.318 + 36 - 23 + 1; propuesta 44) y `declaradas.json` por actualizar antes de T-015. El `arquitecto` actualiza el total.
4. **`docs/TECNOLOGIAS.md`:** anotar «`@electric-sql/pglite-pgtap` instalada en T-008» (propuesta 43; lo hace la coordinación). `diseno.md` y `plan.md` ya dicen el nombre con ámbito.
5. **T-013 (VERIFICAR en la primera ejecución en CI):** `\ir ayudas/perfiles.psql` relativo al archivo; pgTAP en `extensions`; lista de esquemas de la plataforma de N-1 y funciones `security definer` ajenas (propuesta 46, m-1); disparadores de la plataforma en la aserción 17; membresías de roles en N-4 (i); funciones de extensiones con `execute` para PUBLIC en N-4 (h); A2-3.
6. MENOR 3 de T-002 (registro dinámico OAuth) a la 014; `docs/MODELO-DATOS.sql` desalineado (propuesta 20: cierre o T-015). Menores de T-006 en propuestas 35 a 39 y de T-007 en 40 a 42.
7. Fase 6: anonimizar el actor de `auditoria` choca con su inmutabilidad.
8. MENOR aceptado: `escapesProhibidos` da falso positivo con un literal que termina en « e».
9. Falta la prueba de que el ciclo de CI (instantánea del catálogo, T-012 y T-013) cubre lo que los detectores solo vigilan.
10. Primera pasada de `vitest` de T-005 con la máquina cargada: 9 fallos y 7 errores no reproducidos; en T-006 un `Array buffer allocation failed` por memoria baja. Si reaparecen, investigar.
11. Pasar `comprobaciones-cli.md` a `verificaciones.md` (1 y 3 confirmadas; 2 por código fuente sin ejecutar; 4 VERIFICAR en T-013), sin bloquear las migraciones.
12. Retirar copias de trabajo y ramas ya integradas de T-001 a T-007 (`010-t-007`, `tarea/010-T-007` incluidas): `agent-a42966b03a8b49f66`, `agent-ac5d104eb060dc5d5`, `agent-a9ab7b477a6d819cb`, `agent-a6f16c114aa232f45`, `agent-a41fe38e466fb8fdd`, `agent-a3479416dbf775468`, `agent-afc90e26641d12e16`, `t-005`, `t-005-menores`, `t-006`, `010-t-005`, `010-t-006`; y tras integrar T-008, `010-t-008` y `tarea/010-T-008`.

## Entorno y receta de integración

- `npm ci --ignore-scripts` hecho en la carpeta principal. ESLint en la carpeta principal recorre `.claude/worktrees/**`: ejecútalo con `--ignore-pattern ".claude/worktrees/**"` o desde un worktree. Si `tipos` falla con `.next/dev/types/validator.ts`, borra `.next/dev`. El worktree tiene `node_modules` como junction (`cmd //c "mklink /J …"`) y no puede hacer `next build`.
- **Receta:**
  1. Rebasar la rama sobre `main`.
  2. Candado: `until mkdir C:/dev/agentes-correo-humanaia/.git/suite-completa.lock 2>/dev/null; do sleep 30; done`; `rmdir` al terminar.
  3. `bash scripts/esperar-memoria.sh 4000` antes de la suite.
  4. `npx vitest run --maxWorkers=2` (una prueba de `m08_m10` tarda 80 a 280 s según la carga).
  5. `build` en la carpeta principal tras el squash.
  6. Comprobar `git diff --cached --stat` vacío en `main`; `git merge --squash tarea/010-T-00N`; `git commit -m "T-00N (010): ... aprobado por delegación D-036" -- rutas explícitas`.
  7. Reescribir este archivo entero.
- Al auditor, solo huecos reales y explotables.
