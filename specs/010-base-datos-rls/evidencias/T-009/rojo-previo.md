# T-009 · Rojo previo (22/11/2026)

Orden: primero L 1 en rojo y, tras él, el código (`02_matriz_acceso.test.sql`, ayudas y arnés).

## L 1 en rojo

Comando: `npx vitest run --maxWorkers=2 tests/unit/bd/matriz.test.ts`

Resultado antes de escribir `supabase/tests/02_matriz_acceso.test.sql`: **4 fallos y 4 pruebas en verde de 8**. Los 4 fallos son los que leen 02 (`ENOENT … supabase/tests/02_matriz_acceso.test.sql`): la transcripción = D-6, la detección de letras cambiadas, los bloques de sentencias y negativos, y el plan de 844. Las 4 en verde solo leen `diseno.md`: D-6 tiene 23 objetos y 9 perfiles, las letras de cada operación son las admitidas, la lista de lectura de UA es la de REQ-057 y el lector de D-6 falla si la tabla cambia de forma.

## Rojo de las mutaciones del dictamen del `revisor` (22/11/2026, commit d704ffb)

Antes de corregir `02_matriz_acceso.test.sql` se añadieron a `supabase/tests/pglite/matriz.test.ts` las mutaciones del dictamen. Comando: `npx vitest run --maxWorkers=2 supabase/tests/pglite/matriz.test.ts`. Resultado: **8 fallos y 36 en verde de 44** (las 36 anteriores seguían en verde; 02 aún no veía ninguna de las ocho):

| Mutación | Qué no veía 02 (hallazgo) |
| --- | --- |
| M4 `grant select (id, estado_manual) on licencias to service_role` | la «X» de `SR · licencias · leer` (R-M-1) |
| M5 `grant select (id) on licencias to conector` y política `using (true)` | la «X» de `CON · licencias · leer` (R-M-1) |
| M7 `grant update (anulada_en) on ordenes to service_role` | la «X» de `SR · ordenes · modificar` (R-M-1) |
| M8 `grant update (usado_en) on codigos_activacion to authenticated` y política abierta | la «X» de `AD2 · codigos_activacion · modificar` (R-M-1) |
| M12 `grant select on metricas_version to conector` | la «X» de `CON · metricas_version · leer` (R-m-4) |
| M13 política de modificar `clientes` para el propio cliente | `UB · clientes · modificar · 0` (R-m-2; UA ya fallaba) |
| M16 política de insertar `ordenes` para el propio cliente | `UB · ordenes · insertar · X` (R-m-2; UA ya fallaba) |
| F1 quitar `versiones_prompt` de las sentencias | las celdas de leer T y C pasaban con nulo = nulo (R-m-1) |

Tras la corrección (02 con `pg_temp.actual`, la sonda por pasos, el permiso exigido y la sonda sobre B): 46 de 46 en verde (`verde.md`; 44 más V1 y V2 de la precondición de REQ-057, R-m-6, que son pruebas nuevas y no tuvieron rojo previo porque comprueban una protección que ya existía). Una mutación anterior cambió a mejor: la política de modificar `licencias` abierta ahora hace fallar también `UB · licencias · modificar · 0` (antes estaba en `sobran`).

## Rojo de las mutaciones del segundo dictamen del `auditor-seguridad` (22/11/2026, commit 9038055)

Antes de corregir 02, 01 y las ayudas se añadieron a `supabase/tests/pglite/matriz.test.ts` (10 mutaciones) y a `supabase/tests/pglite/pgtap.test.ts` (5) las del dictamen. Comando: `npx vitest run --maxWorkers=2 supabase/tests/pglite/matriz.test.ts supabase/tests/pglite/pgtap.test.ts`. Resultado: **15 fallos y 86 en verde de 101**: ninguna de las 15 la veían 02 ni 01 (la base queda insegura con 02 en 844/844 y 01 en 36/36).

| Mutación | Qué no veía la prueba (hallazgo) |
| --- | --- |
| A8 `es_admin()` reducida a `aal = 'aal2'` | `USV · clientes · leer · 0`, `USV · auditoria · leer · 0`, `USV · clientes · modificar · 0` (ningún perfil tenía doble factor sin ser administrador; A-M-1) |
| A9 `informes_select_usuario` con `or cliente_id::text = user_metadata->>'cliente_id'` | `UA · informes · leer · P`, `UB · …`, `USV · informes · leer · 0` (los perfiles no llevaban metadatos; A-M-2) |
| A5 `usuarios_cliente_insert_admin` abierta al propio cliente | `UA`, `UB` y `UAB · usuarios_cliente · insertar · X` (la sonda insertaba en C; A-M-3) |
| A6 `licencias_insert_admin` abierta al propio cliente | `UA`, `UB` y `UAB · licencias · insertar · X` (la sonda insertaba en el cliente sin licencia; A-M-3) |
| A7 `reglas_cliente_insert_admin` abierta al propio cliente | `UA`, `UB` y `UAB · reglas_cliente · insertar · X` (idem; A-M-3) |
| A1 `grant truncate on informes, clientes to conector` | `CON · informes · borrar · X`, `CON · clientes · borrar · X` (A-M-4) |
| A2 `grant references, trigger on licencias to conector` | `CON · licencias · borrar · X` (A-M-4) |
| A3 `grant maintain on informes to conector` | `CON · informes · borrar · X` (A-M-4) |
| TRUNCATE para `authenticated` y `service_role` en `informes` | `UA`, `AD2` y `SR · informes · borrar · X` (A-M-4, resto de perfiles) |
| A4 política de lectura de `auditoria` para el propio cliente | `UA`, `UB`, `UAB · auditoria · leer · 0` y la aserción REQ-057 (sin filas de A, B y C en `auditoria` el 0 no probaba nada; A-M-5) |
| 01: A1, A2, A3, un `select (id)` por columna y A10 (secuencia nueva en `public` con permisos para el conector) | N-4 (j) (A-M-4 y A-m-1): 01 no tenía instantánea del conector |

A11 (esquema nuevo con una tabla para `anon`) se añadió con la corrección de 01 (N-4 (k)), junto con una variante con usage para PUBLIC y sin tablas: no tuvo commit de rojo propio: el fallo previo (01 en 36/36 con A11) lo reprodujo el auditor en su dictamen y aquí no se volvió a ejecutar antes de escribir N-4 (k); sí se ejecuta ahora y falla N-4 (k).

## Rojo de las mutaciones de la 2.ª vuelta del `revisor` (22/11/2026, commit bfa7a74)

Antes de tocar 02 se añadieron a `supabase/tests/pglite/matriz.test.ts` cinco mutaciones del dictamen. Comando: `npx vitest run --maxWorkers=2 supabase/tests/pglite/matriz.test.ts -t "R2-|E5|E1\)"`. Resultado: **4 de 5 fallan** sin corregir (E1 ya lo veía 02: se añade como prueba, MENOR-1).

| Mutación | Qué no veía la prueba |
| --- | --- |
| E9 `reglas_cliente_update_admin` abierta (`using (true) with check (true)`) | `UA`, `UB`, `UAB`, `USV` y `AD1 · reglas_cliente · modificar · 0` (R2-M-1) |
| E10 `alertas_update_admin` abierta | las mismas cinco celdas de `alertas` |
| E11 `conexiones_update_admin` abierta | las mismas cinco celdas de `conexiones` |
| E5 política de modificar `reglas_cliente` para el propio cliente | `UA` y `UB · reglas_cliente · modificar · 0` |

