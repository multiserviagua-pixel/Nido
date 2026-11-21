# 010 · Relevo (21/11/2026, carril B, 4.ª parte)

Chat de la fase 2, función 010. Empieza por este archivo. `Estado: EN CURSO`. La carpeta principal sigue en `main`. Sin push. Las decisiones de la coordinación por D-036 del 21/11/2026 están al final de `tareas.md`.

## Estado

- **T-001 a T-005 integradas en `main`.** Dictámenes en `evidencias/T-00N/`. T-005 (M07 `reglas_de_acceso`) integrada el 21/11/2026 con `merge --squash`, revisor APTO en 2.ª vuelta y auditor-seguridad APTO, sin bloqueantes ni mayores; aprobada por delegación D-036, revocable. Evidencia de integración en `evidencias/T-005/integracion.md`.
- **Condiciones heredadas de T-005** (en `tareas.md` y `evidencias/T-005/dictamenes.md`): T-006 hace que el canje de código y `resolver_token()` comprueben `clientes.estado = 'activo'` en cada llamada, con prueba contra un cliente de baja; las reversiones de M08 y M09 no se apoyan en el `cascade` de M07; M09, vista para el dashboard de cliente sin `ordenes.creada_por` ni `licencias.estado_manual`; al cierre de la 010, atar el nombre de política y disparador de la reversión de M07 a su tabla y probar la homónima.
- **Decisiones de diseño de T-003** (en `diseno.md`): D-11 (detectores de `declare`, `execute` y escapes) y formato TP de D-7. L 10 solo vigila reversiones; M07 y M09 pueden nombrar tablas protegidas. L 13 y L 14 se aplican a todas las migraciones nuevas.
- **Entorno**: en la carpeta principal ya está hecho `npm ci --ignore-scripts` (21/11/2026) y `build` pasa. ESLint en la carpeta principal recorre `.claude/worktrees/**` (su `.next`) y falla: ejecútalo con `--ignore-pattern ".claude/worktrees/**"` o desde un worktree. Si `tipos` falla con `.next/dev/types/validator.ts`, borra `.next/dev` (resto de un `next dev` ajeno). El worktree no puede hacer `next build` (junction a `node_modules`): el `build` se comprueba en la carpeta principal tras el squash.

## Falta (en orden)

1. **T-006 (M08 `funciones_conector`, M09 `vistas`, M10 `datos_de_referencia`)** con `ingeniero-bd`, prueba delante, `revisor` y `auditor-seguridad`. Después T-007 y siguientes según `tareas.md`. Un solo subagente opus a la vez.
2. Pendientes anotados:
   - MENOR 3 de T-002 (registro dinámico OAuth) a la fase 3; `tokens.sustituido_por` para M08; `docs/MODELO-DATOS.sql` desalineado (propuesta 20: cierre o T-015).
   - T-014 debe comprobar que `pg_db_role_setting` no fija `app.reversion_protegida` (`evidencias/T-003/pendientes-T-014.md`).
   - Fase 6: anonimizar el actor de `auditoria` choca con su inmutabilidad.
   - MENOR aceptado: `escapesProhibidos` da falso positivo con un literal que termina en « e» (rechaza por exceso).
   - Falta la prueba de que el ciclo de CI (instantánea del catálogo, T-012 y T-013) cubre lo que los detectores solo vigilan.
   - Primera pasada de `vitest` de T-005 con la máquina cargada: 9 fallos y 7 errores no reproducidos en la segunda; si reaparecen, investigar (posible dependencia de carga).
3. Pasar `comprobaciones-cli.md` a `verificaciones.md` (1 y 3 confirmadas; 2 por código fuente sin ejecutar; 4 VERIFICAR en T-013), sin bloquear las migraciones.
4. Instalar `pglite-pgtap` 0.0.18 en T-008 (D-034; verificada, no instalada).
5. Retirar las copias de trabajo y ramas de T-001 a T-004 (`agent-a42966b03a8b49f66`, `agent-ac5d104eb060dc5d5`, `agent-a9ab7b477a6d819cb`, `agent-a6f16c114aa232f45`, `agent-a41fe38e466fb8fdd`, `agent-a3479416dbf775468`), y la de T-005 (`.claude/worktrees/010-t-005`, rama `tarea/010-T-005`) cuando no hagan falta.

## Siguiente paso

Encargar T-006 al `ingeniero-bd` en su worktree y rama `tarea/010-T-006`, partiendo de `main`. Al integrar: rebasar sobre `main`, `verificar` en verde por partes (ver Entorno), dictámenes en `evidencias/T-006/`, `merge --squash` con mensaje `T-006 (010): ... aprobado por delegación D-036`, y reescribir este archivo entero. Al auditor, solo huecos reales y explotables.
