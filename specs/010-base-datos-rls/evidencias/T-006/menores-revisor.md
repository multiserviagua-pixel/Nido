# T-006 · Menores del revisor 2, 3, 4, 7 y 8 (21/11/2026)

Los menores 1, 5 y 6 los lleva la coordinación.

## Cambios

- Menor 2: la prueba vacua se rehízo. Concede `execute` de `privado.es_admin()` a `conector_prueba` antes de M08 y comprueba que M08 lo deja tal cual (M08 solo mira sus cinco funciones) y que no concede nada a ese rol en ellas.
- Menor 3: M08 usa `coalesce(v_pausa_global, true)` (sin fila de ajustes se pausa, art. 3). La reversión de M10 falla con `reversion_datos_modificados`, sin cambiar nada, si `pausa_global` es true o `stripe_en_observacion` es false.
- Menor 4: la reversión de M10 falla igual si algún código de los doce tiene `activo` falso o una descripción distinta de la de M10. Los códigos añadidos por un superadmin se conservan. No hizo falta la nota en `rol-conector.md`.
- Menor 7: M09 ordena la última orden con `o2.creada_en desc, o2.id`. M08 ya lo tenía (`o.creada_en desc, o.id`); la prueba cubre ambas.
- Menor 8: la comprobación final de M08 falla con `migracion_concesiones_ajenas` si `conector` es miembro de algún rol (`pg_auth_members`).

## Rojo previo (antes de tocar las migraciones)

`npx vitest run supabase/tests/pglite/m08_m10.test.ts -t "<las pruebas nuevas>"`: 7 fallan, 2 pasan (la reescrita del menor 2, que documenta conducta ya correcta, y la del código propio del superadmin, que ya se conservaba). Fallaban: conector miembro de un rol; sin fila de ajustes (M08 no pausaba); empate de órdenes (M09); reversión de M10 con pausa_global activa, con Stripe fuera de observación, con código desactivado y con descripción cambiada.

## Verde

- `npx vitest run supabase/tests/pglite/m08_m10.test.ts --maxWorkers=2`: 65 pasan, 0 fallan.
- `npx vitest run tests/unit/bd --maxWorkers=2`: 3 archivos, 135 pasan.
- No se ejecutó pgTAP (sin Docker; corre en CI) ni la suite completa.
