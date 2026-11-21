# T-006 · Condiciones del auditor-seguridad (MAYOR 1, MENORES 2 y 5) (21/11/2026)

Cambios en `supabase/migrations/20261120000800_funciones_conector.sql` y pruebas nuevas al final de `supabase/tests/pglite/m08_m10.test.ts` (bloque «dictamen del auditor»). No se tocan MENORES 3, 4, 6 ni 7.

## Rojo previo (migración sin cambios, pruebas nuevas)

`npx vitest run supabase/tests/pglite/m08_m10.test.ts -t "dictamen del auditor"`: 5 fallan, 0 pasan.

- MAYOR 1: la respuesta entregaba la orden pese a estar «anulada» (`expected { …(2) } to be null`).
- MENOR 5: los tres `grant` previos (select a PUBLIC, update de columna a PUBLIC, miembro del conector) no hacían fallar M08 (el error era nulo).
- MENOR 2: la primera ejecución falló por un error mío en la prueba (`$$` mal escapado), no cuenta como rojo. Rojo real, con la migración anterior (`git show HEAD:`) y la prueba corregida: `expected 0 to be greater than 0` (ningún bloqueo `RowShareLock`).

## Cambios

- MAYOR 1: el `update` a «entregada» lleva `and cliente_id = v_cliente and estado = 'pendiente'`; después se vuelve a leer la orden (`estado <> 'anulada'`) y, si ya no hay fila, no se devuelve (`orden` nulo).
- MENOR 2: las tres `mcp_*` hacen `perform 1 from public.clientes where id = v_cliente and estado = 'activo' for share;` al entrar en el bloque protegido; sin fila, `{"autorizado": false}`.
- MENOR 5: comprobación final con `has_table_privilege` y `has_column_privilege` (cubren PUBLIC y herencia) sobre `public` y `privado`, y pertenencia con `or m.roleid = conector`.

## Verde

- `npx vitest run supabase/tests/pglite/m08_m10.test.ts --maxWorkers=2`: 70 pasan, 0 fallan (214 s).
- `npx vitest run tests/unit/bd --maxWorkers=2`: 3 archivos, 135 pasan.
- `node scripts/comprobar-specs.mjs`: SUPERADO.

## Límites

- MAYOR 1 se simula con un disparador ficticio, sin concurrencia real: demuestra que el `update` ya no pisa «anulada», no el comportamiento bajo carga.
- MENOR 2: no se puede simular una baja concurrente sin falsearla. La prueba comprueba que el bloqueo `for share` se toma antes de insertar (vía `pg_locks` en un disparador BEFORE) y que el caso normal de las tres funciones sigue igual. La carrera real queda para pgTAP/CI (no hay Docker aquí).
- Efecto residual de MAYOR 1: si la orden anulada era de pausa, el estado ya calculado (`pausada`) no se recalcula en esa llamada; la siguiente lo hace.
