# 010 · Relevo (21/11/2026, carril B, 5.ª parte)

Chat de la fase 2, función 010. Empieza por este archivo. `Estado: EN CURSO`. La carpeta principal sigue en `main`. Sin push. Las decisiones de la coordinación por D-036 del 21/11/2026 están al final de `tareas.md`.

## Estado

- **T-001 a T-006 integradas en `main`.** Dictámenes en `evidencias/T-00N/`. T-006 (M08 `funciones_conector`, M09 `vistas`, M10 `datos_de_referencia`): revisor APTO CON MENORES y auditor-seguridad APTO CON CONDICIONES, ambos cumplidos (el MAYOR del auditor, la entrega de una orden que pisaba una anulación concurrente, está corregido con prueba); aprobada por delegación D-036, revocable. Dictámenes en `evidencias/T-006/dictamenes.md`; decisiones de diseño en `diseno.md`, «Decisiones de T-006» (1 a 12).
- **Menores anotados de T-006** (sin corregir; destinos en `propuestas.md`, n.º 35 a 39): traspasos a 014 y 011 (baja → denegación, `error_interno`, canje de código con cliente `activo`), validación del informe contra el contrato en la 011, supervisión de `error_interno` en T-014, `tokens.recurso` en el diseño de la 014, informes de ejecuciones antiguas y `confirmar_orden` sobre órdenes no entregadas.
- **Condiciones heredadas de T-005 aún abiertas:** al cierre de la 010, atar el nombre de política y disparador de la reversión de M07 a su tabla y probar la homónima. Cerradas en T-006: estado `activo` en cada llamada, reversiones de M08 y M09 sin `cascade`, vista sin `creada_por` ni `estado_manual`.
- **Decisiones de diseño de T-003** (en `diseno.md`): D-11 (detectores de `declare`, `execute` y escapes) y formato TP de D-7. L 10 solo vigila reversiones; M07 y M09 pueden nombrar tablas protegidas. L 13 y L 14 se aplican a todas las migraciones nuevas.
- **Entorno**: `npm ci --ignore-scripts` hecho en la carpeta principal y `build` pasa. ESLint en la carpeta principal recorre `.claude/worktrees/**`: ejecútalo con `--ignore-pattern ".claude/worktrees/**"` o desde un worktree. Si `tipos` falla con `.next/dev/types/validator.ts`, borra `.next/dev`. El worktree no puede hacer `next build` (junction a `node_modules`): el `build` se comprueba en la carpeta principal tras el squash. Candado de suite: `until mkdir C:/dev/agentes-correo-humanaia/.git/suite-completa.lock 2>/dev/null; do sleep 30; done` antes de la suite completa o del build, y `rmdir` al terminar. Una prueba de `m08_m10` tarda unos 80 a 280 s según la carga.

## Falta (en orden)

1. **T-007 `[P]` (seed, volumen y `config.toml`)** y siguientes según `tareas.md`, con `ingeniero-bd`, prueba delante, `revisor` y, si toca ruta crítica, `auditor-seguridad`. El seed no repite las filas de M10 (la de `ajustes_globales` y los doce códigos). Un solo subagente opus a la vez.
2. Pendientes anotados:
   - MENOR 3 de T-002 (registro dinámico OAuth) a la 014; `docs/MODELO-DATOS.sql` desalineado (propuesta 20: cierre o T-015).
   - T-014 debe comprobar que `pg_db_role_setting` no fija `app.reversion_protegida` (`evidencias/T-003/pendientes-T-014.md`) y decidir cómo se supervisa `error_interno`.
   - Fase 6: anonimizar el actor de `auditoria` choca con su inmutabilidad.
   - MENOR aceptado: `escapesProhibidos` da falso positivo con un literal que termina en « e».
   - Falta la prueba de que el ciclo de CI (instantánea del catálogo, T-012 y T-013) cubre lo que los detectores solo vigilan.
   - Primera pasada de `vitest` de T-005 con la máquina cargada: 9 fallos y 7 errores no reproducidos; en T-006 hubo un `Array buffer allocation failed` por memoria baja. Si reaparecen, investigar (posible dependencia de carga).
3. Pasar `comprobaciones-cli.md` a `verificaciones.md` (1 y 3 confirmadas; 2 por código fuente sin ejecutar; 4 VERIFICAR en T-013), sin bloquear las migraciones.
4. Instalar `pglite-pgtap` 0.0.18 en T-008 (D-034; verificada, no instalada).
5. Retirar las copias de trabajo y ramas ya integradas de T-001 a T-006 (`agent-a42966b03a8b49f66`, `agent-ac5d104eb060dc5d5`, `agent-a9ab7b477a6d819cb`, `agent-a6f16c114aa232f45`, `agent-a41fe38e466fb8fdd`, `agent-a3479416dbf775468`, `agent-afc90e26641d12e16`, `t-005`, `t-005-menores`, `t-006`, `010-t-005`, `010-t-006`) cuando no hagan falta.

## Siguiente paso

Encargar T-007 al `ingeniero-bd` en un worktree y rama nuevos `tarea/010-T-007` partiendo de `main`. Al integrar: rebasar sobre `main`, evidencia por partes (ver Entorno) en la rama rebasada y dentro de su copia, dictámenes en `evidencias/T-007/`, comprobar `git diff --cached --stat` vacío en `main`, `git merge --squash` y a continuación `git commit -m "T-007 (010): ... aprobado por delegación D-036" -- rutas`, y reescribir este archivo entero. Al auditor, solo huecos reales y explotables.
