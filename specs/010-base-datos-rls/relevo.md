# 010 · Relevo (20/11/2026, fin del chat del carril B, 3.ª parte)

Chat de la fase 2, función 010. Empieza por este archivo. `Estado: EN CURSO`. La carpeta principal sigue en `main`. Sin push.

## Estado

- **T-001 y T-002 integradas** (88001ca, e48328a). Ver sus dictámenes en `evidencias/T-001/` y `evidencias/T-002/`.
- **T-003 integrada en `main`** (M04 `auditoria` y M05 `versiones_prompt`, protegidas, con sus reversiones; formato TP de D-7 en M02; detector de D-11). Aprobada por delegación D-036 el 20/11/2026, revocable. Seis vueltas de dictamen en `evidencias/T-003/dictamenes.md` (sin bloqueantes; última del `revisor`, APTO). Rojo previo en `evidencias/T-003/rojo-previo.md`. Rama `tarea/010-T-003` y su worktree (`.claude/worktrees/agent-a41fe38e466fb8fdd`) quedan como están.
- **Decisiones de diseño tomadas en T-003** (en `diseno.md`): D-11 (secciones `declare` solo con `pg_catalog`; regla 5: `execute` solo como `execute function` o `execute pg_catalog.format` con literal de `[A-Za-z0-9_ ,.]` y marcadores `%I`/`%L`; regla 6: sin `E'…'`, `U&'…'` ni `U&"…"`); formato TP de D-7 como lista blanca de rangos Unicode explícitos en `contenido`, `notas`, `clientes.nombre` y `catalogo_problemas.descripcion`; L 10 solo en reversiones.
- **`npm run verificar`**: en la rama rebasada sobre `main`, `tipos`, `estilo`, `vitest --maxWorkers=3` (1527 pruebas en 56 archivos), `aislamiento`, `arnes` y `build`, todo con exit 0. Sin `--maxWorkers=3`, `apoyo.test.ts` y `acceso-muestra.test.ts` agotan sus 5 s por carga (pasan solos y con `--testTimeout=60000`).

## Falta (en orden)

1. **T-004 (M06 `ejecuciones_informes_alertas`)** y siguientes según `tareas.md`, con `ingeniero-bd`, un solo subagente opus a la vez (dos como máximo). Las reglas de pruebas L 10, L 13 y L 14 de T-003 se aplican a todas las migraciones nuevas; M07 y M09 pueden nombrar las tablas protegidas (L 10 solo vigila las reversiones).
2. Pendientes anotados:
   - M07 debe conceder `USAGE` explícito en los tipos que cada rol necesite.
   - MENOR 3 de T-002 (registro dinámico OAuth) a la fase 3; `tokens.sustituido_por` para M08; `docs/MODELO-DATOS.sql` desalineado (propuesta 20: cierre o T-015).
   - T-014 debe comprobar que `pg_db_role_setting` no fija `app.reversion_protegida` (`evidencias/T-003/pendientes-T-014.md`).
   - Fase 6: anonimizar el actor de `auditoria` choca con su inmutabilidad.
   - MENOR aceptados de la vuelta 6: `escapesProhibidos` da falso positivo con un literal que termina en « e» (rechaza por exceso).
   - Falta la prueba de que el ciclo de CI (instantánea del catálogo, T-012 y T-013) cubre lo que los detectores solo vigilan.
3. Pasar `comprobaciones-cli.md` a `verificaciones.md` (comprobaciones 1 y 3 confirmadas; 2 por código fuente sin ejecutar; 4 VERIFICAR en T-013).
4. Instalar `pglite-pgtap` 0.0.18 en T-008 (verificada, no instalada).

## Siguiente paso

Chat nuevo que empiece por este archivo: T-004 con `ingeniero-bd` (prueba delante; revisor y `auditor-seguridad` por ser ruta crítica). Al integrar en `main`: `verificar` en verde (usa `--maxWorkers=3` si la máquina está cargada), dictámenes en `evidencias/T-NNN/`, `merge --squash` con mensaje `T-NNN (010): ...`. Las condiciones de los detectores de texto llevaron seis vueltas en T-003: al encargar M06 en adelante, pide al auditor solo huecos reales y explotables, y deja el control definitivo al ciclo de CI.
