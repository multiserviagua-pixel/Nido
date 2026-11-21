# T-007 · Correcciones del dictamen del revisor (APTO CON MENORES), 21/11/2026

## Rojo previo
Pruebas añadidas antes de tocar el SQL; `npx vitest run supabase/tests/pglite/seed.test.ts tests/unit/bd --maxWorkers=2`:
1 fallo, 211 pasan: «la baja bloquea la tabla antes de comprobar…» (`expected -1 to be greater than -1`: no existía el `lock table`).

Mayor («sin la variable»): las pruebas nuevas pasan con el SQL correcto, así que su rojo se demuestra por mutación,
en una copia temporal fuera del repositorio (ya borrada): `coalesce(..., 'ci')` en seed.sql y volumen.sql.
Resultado: 5 fallos. Los dos de la base nueva (seed y volumen, `seed_entorno_no_permitido` no aparece: el NULL real
cae en 'ci' y carga), los dos del literal completo en `seed-config.test.ts` (L 9, ambos archivos) y uno de la guía
(artefacto de la copia, que no llevaba `docs/`; no es de la mutación).

## Verde
- `npx vitest run supabase/tests/pglite/seed.test.ts tests/unit/bd --maxWorkers=2`: 5 archivos, 212 pasan, 0 fallan.
- `npx tsc --noEmit`: sin salida.

## Cambios
1. seed.test.ts: base nueva sin `set_config`, afirma `current_setting('app.entorno', true) is null` y que seed y volumen
   fallan con `seed_entorno_no_permitido` sin cargar nada. seed-config.test.ts: literal completo `coalesce(pg_catalog.current_setting('app.entorno', true), '')`.
2. administradores.sql: `lock table public.administradores in share row exclusive mode;` en la rama de baja, antes del
   `exists` y del `count`. El rol es el dueño (postgres), que la guarda ya exige y es quien posee la tabla. La prueba
   no puede ser concurrente en PGlite (un solo hilo): se comprueba el orden del texto y que el caso normal sigue igual
   (bajas, inexistente y último administrador, sin cambios).
3. Prueba de `procedimiento_auditoria_no_registrada`: `alter table … disable trigger administradores_auditar`
   (el disparador es normal, no `enable always`; el dueño puede), alta falla y no cambia nada; reactivación en `finally`
   y comprobación de `tgenabled = 'O'`.

No ejecutado: pgTAP, psql real, concurrencia real del bloqueo.
