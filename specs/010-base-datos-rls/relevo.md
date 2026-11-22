# 010 · Relevo (22/11/2026, carril B, 9.ª parte)

Chat de la fase 2, función 010. Empieza por este archivo. `Estado: EN CURSO`. La carpeta principal sigue en `main`. Sin push. Las decisiones de la coordinación por D-036 están al final de `tareas.md`.

## Estado

- **T-001 a T-009 integradas en `main`.** T-009 (`02_matriz_acceso` con 844 aserciones y L 1, `01_estructura` con 38 con N-4 (j) y (k)): integrada en 9cd0855 (evidencia 4a86771); revisor APTO CON MENORES (3.ª vuelta) y auditor-seguridad APTO CON CONDICIONES (2.ª vuelta); puerta abierta por delegación D-036 (revocable) el 22/11/2026. Build y `trazado.test.ts` en 0 en la carpeta principal. pgTAP en CI no ejecutado hasta T-013. Detalle en `evidencias/T-009/`.
- **T-010 en revisión (NO integrada; puerta cerrada).** Copia `.claude/worktrees/010-t-010`, rama `tarea/010-T-010`, commits 0445f03 (rojo) y d79b24f: `03_acceso_cruzado` (91), `08_baja` (91), `supabase/tests/ayudas/acceso.psql`, L 16 (`tests/unit/bd/acceso-baja.test.ts`), evidencias en `evidencias/T-010/`, propuesta 51. Dictamen del `revisor` 1.ª vuelta: **NO APTO, 0 bloqueantes, 2 MAYOR, 3 menores.** Falta corregirlos (encargar a `ingeniero-bd` con prueba en rojo primero), 2.ª vuelta del revisor, `auditor-seguridad` (máximo dos vueltas, solo huecos explotables), evidencia con candado y `esperar-memoria.sh`, integrar.
- **Siguiente:** cerrar T-010 (arriba) y después T-011 (precondición P1-g, condición 3; con el `auditor-seguridad` nominal en `dictamen.md`). Un solo subagente opus a la vez.
  - **M-2 (CA-039, REQ-064, REQ-039):** «el resto de la matriz da 0 discrepancias» se mide solo en parte: `perfiles_08` no incluye a AD1A (08:64-65), `resto_desv` solo compara lecturas (217-223, 520-524); no se miden tras la baja las lecturas de AD1A ni inserciones y modificaciones de UB, UAB, USV, AD1, AD1A, AD2, SS, CON y SR. Mutaciones X1 (`clientes_del_usuario()` sin filtro de estado para quien está en `administradores`) y X2 (política con función de ayuda que deja a UB modificar alertas de un cliente de baja): 03 y 08 en 0 fallos. Corrección: incluir a AD1A y meter `atacar()` antes y después de la baja para el resto de perfiles con lo esperado de D-6; o declararlo en `verde.md` (línea 81 y 89) y en la propuesta 51 para que la coordinación lo acepte.
  - **Menores:** m-1 TRUNCATE y permisos por columna no vistos por 03 y 08 (W7, W8; los ve 02): declararlo o añadir `truncate public.%I` ciego en `borrar_de` (`acceso.psql:288-309`, `08:96-117`) con 42501; m-2 la aserción `auditoria sin cambios` no cubre la ronda `borrado` (03:246 y 263; `verde.md:62`): tomar `aud|post` tras esa ronda; m-3 trazabilidad: `tareas.md:49` sin `acceso.psql`, `acceso-baja.test.ts` ni `pgtap.test.ts`; L 16 no está en `diseno.md:266` ni en la propuesta 51; L 16 cambió entre 0445f03 y d79b24f (`acceso-baja.test.ts:66-77`) sin anotarlo; `verde.md:81` cita un comentario como si fuera el nombre de una prueba. El revisor reprodujo las 42 cifras de «claves que fallan» (aceptable que la instrumentación no esté en el repositorio, declarado en `verde.md:160`).
- **Siguiente: T-010 `[P]` y T-011** (según `tareas.md`). T-011 tiene como precondición P1-g (condición 3). Un solo subagente opus a la vez.
- **Decisiones anteriores:** T-007 en `diseno.md`, «Decisiones de T-007»; T-006 en «Decisiones de T-006» (1 a 12); de T-003: D-11 y formato TP de D-7; L 10 solo vigila reversiones; L 13 y L 14 se aplican a todas las migraciones nuevas. Dictámenes en `evidencias/T-00N/`.
- **Condiciones heredadas de T-005 aún abiertas:** al cierre de la 010, atar el nombre de política y disparador de la reversión de M07 a su tabla y probar la homónima.

## Menores abiertos

- **T-008** (`evidencias/T-008/dictamenes.md`): R2-4 y A2-3 (casos 3 y 5 de 07 comparan el mensaje en inglés; T-013: SQLSTATE y `constraint_name` con `get stacked diagnostics`); R2-5, A2-1 y A2-2: cierre de la 010 o T-011.
- **T-009** (`evidencias/T-009/`): A2-m-1 (propuesta 49: aserción en 01 sobre `metadata`; T-011); A2-m-3 (propuesta 50: regla estática de esquemas en `tests/unit/bd/estaticas.test.ts`; T-013 o T-011); `m07.test.ts` sin filas de `auditoria` de A en su semilla (su «0» no prueba el acceso cruzado; lo prueba 02); N-4 (k) depende de la lista de esquemas de la plataforma (T-013); propuesta 48 (a confirmar en T-013).

## Pendientes

1. **T-014 (A-12):** `log_statement`, `log_min_duration_statement` y `log_min_error_statement` en `Nido` (P-36 de la 022). Además: comprobar que `pg_db_role_setting` no fija `app.reversion_protegida` (`evidencias/T-003/pendientes-T-014.md`) y decidir cómo se supervisa `error_interno`.
2. **Incorporadas en T-008:** m-45 y m-49 (lista de `security definer` por firma; propuesta 45).
3. **Recuento total pgTAP: 1.334** (propuesta 44) y `declaradas.json` por actualizar antes de T-015. El `arquitecto` actualiza el total.
4. **`docs/TECNOLOGIAS.md`:** anotar «`@electric-sql/pglite-pgtap` instalada en T-008» (propuesta 43; lo hace la coordinación).
5. **Propuesta 47:** ajustar D-6 en las vistas (55000 en lugar de 42501 en la «X» de escribir).
6. **T-013 (VERIFICAR en la primera ejecución en CI):** `\ir ayudas/perfiles.psql` relativo al archivo; pgTAP en `extensions`; lista de esquemas de la plataforma de N-1 y funciones `security definer` ajenas (propuesta 46); disparadores de la plataforma en la aserción 17; membresías de roles en N-4 (i); funciones de extensiones con `execute` para PUBLIC en N-4 (h); A2-3; propuesta 48.
7. MENOR 3 de T-002 (registro dinámico OAuth) a la 014; `docs/MODELO-DATOS.sql` desalineado (propuesta 20: cierre o T-015). Menores de T-006 en propuestas 35 a 39 y de T-007 en 40 a 42.
8. Fase 6: anonimizar el actor de `auditoria` choca con su inmutabilidad.
9. MENOR aceptado: `escapesProhibidos` da falso positivo con un literal que termina en « e».
10. Falta la prueba de que el ciclo de CI (instantánea del catálogo, T-012 y T-013) cubre lo que los detectores solo vigilan.
11. Primera pasada de `vitest` de T-005 con la máquina cargada: 9 fallos y 7 errores no reproducidos; en T-006 un `Array buffer allocation failed` por memoria baja. Si reaparecen, investigar.
12. Pasar `comprobaciones-cli.md` a `verificaciones.md` (1 y 3 confirmadas; 2 por código fuente sin ejecutar; 4 VERIFICAR en T-013), sin bloquear las migraciones.
13. Retirar copias de trabajo y ramas ya integradas de T-001 a T-007 (`agent-a42966b03a8b49f66`, `agent-ac5d104eb060dc5d5`, `agent-a9ab7b477a6d819cb`, `agent-a6f16c114aa232f45`, `agent-a41fe38e466fb8fdd`, `agent-a3479416dbf775468`, `agent-afc90e26641d12e16`, `t-005`, `t-005-menores`, `t-006`, `010-t-005`, `010-t-006`, `010-t-007`, `tarea/010-T-007`); y tras integrar T-008 y T-009, `010-t-008`, `tarea/010-T-008`, `010-t-009` y `tarea/010-T-009`.

## Entorno y receta de integración

- ESLint en la carpeta principal recorre `.claude/worktrees/**`: ejecútalo con `--ignore-pattern ".claude/worktrees/**"` o desde un worktree. Si `tipos` falla con `.next/dev/types/validator.ts`, borra `.next/dev`. El worktree tiene `node_modules` como junction y no puede hacer `next build`.
- **Receta:**
  1. Rebasar la rama sobre `main`.
  2. Candado: `until mkdir C:/dev/agentes-correo-humanaia/.git/suite-completa.lock 2>/dev/null; do sleep 30; done`; `rmdir` al terminar.
  3. `bash scripts/esperar-memoria.sh 4000` antes de la suite.
  4. `npx vitest run --maxWorkers=2` (una prueba de `m08_m10` tarda 80 a 280 s según la carga).
  5. `build` en la carpeta principal tras el squash; si falta una dependencia, `npm ci --ignore-scripts` allí antes.
  6. Comprobar `git diff --cached --stat` vacío en `main`; `git merge --squash tarea/010-T-00N`; `git commit -m "T-00N (010): ... aprobado por delegación D-036" -- rutas explícitas`.
  7. Reescribir este archivo entero.
- Al auditor, solo huecos reales y explotables.
