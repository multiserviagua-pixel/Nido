# T-008 · Verde y equivalencias (21/11/2026)

Ayudas, `01_estructura` (36 aserciones) y `07_informes` (30) en pgTAP, y L 2. **pgTAP en CI (`supabase test db`): NO EJECUTADO** hasta T-013 (sin Docker aquí, REQ-028, artículo 13). Lo que sí se ejecutó aquí es el mismo SQL de 01 y 07 contra PGlite 0.5.17 (PostgreSQL 18.7 simulado) con `@electric-sql/pglite-pgtap` 0.0.18, con las diez migraciones y el seed cargados como en CI (`supabase/tests/pglite/pgtap.ts` y `pgtap.test.ts`). No es Supabase: no tiene el servicio de identidad ni los esquemas de la plataforma; no se anota como superada en CI.

## Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `npx vitest run --maxWorkers=2 tests/unit/bd/contrato-informe.test.ts` | 17 de 17 en verde (antes, 15 en rojo: `rojo-previo.md`) |
| `npm audit` (D-034) | found 0 vulnerabilities (ejecutado el 22/11/2026 tras la instalación de `@electric-sql/pglite-pgtap` 0.0.18, hecha en T-008 con `--save-exact --ignore-scripts`) |
| `npx vitest run --maxWorkers=2 supabase/tests/pglite/pgtap.test.ts` | 39 de 39 en verde (con L 2, 56 de 56): 01 con 36 de 36 `ok`, 07 con 30 de 30 `ok`, 31 mutaciones que hacen fallar la aserción esperada, la vuelta a verde, las sombras y las ayudas. Las 12 mutaciones del auditor se subieron antes en rojo (`09c8692`: las 12 fallaron); la 13.ª (m-3, check de `version_prompt`) se añadió con la corrección y no se vio en rojo aparte |
| `npm run tipos` | exit 0 |
| `npm run estilo` (Prettier y ESLint) | exit 0 |
| `node scripts/comprobar-specs.mjs` | SUPERADO (incluye el escáner de secretos) |

No se ejecutó la suite completa, el build ni Playwright (instrucción del encargo).

## Aserciones de 01 y su equivalente en el arnés PGlite

Equivalente «directo» = prueba ya existente de T-001 a T-007 que comprueba lo mismo; toda aserción tiene además su ejecución real en `pgtap.test.ts` y, donde se indica, su mutación (el control puede fallar).

| 01 | Qué comprueba | Equivalente en el arnés | Mutación |
| --- | --- | --- | --- |
| 1 | RLS en todas las tablas de public y privado | `m02_m03` «cada tabla de public tiene RLS»; `m06` estructura; `m01` (tabla de privado) | sí (RLS apagada en `tokens`) |
| 2 | Las 21 tablas | `m02_m03` «exactamente las 15 tablas», `m06` (3), `m04_m05`, `m07` «42501 en las 21 tablas» | solo ejecución (las 21 juntas no tenían equivalente) |
| 3 | Toda columna fuera de la lista blanca de tipos (base resuelta por dominio y lista) = las 26 de D-7 más las 3 de metadatos de `privado.permisos_por_defecto_previos` | `m02_m03` «las columnas de texto de M02 y M03 son exactamente las de D-7», `m06` (informes) | sí (`informes.nota`; `bytea`; dominio sobre `text`; `xml` en reglas) |
| 4 | Cada columna de texto con un check de expresión regular anclada (no cualquier check) | `m02_m03` «rechaza cada valor sin formato y acepta los válidos» | sí (el check de `version_prompt` sustituido por `<> ''`) |
| 5 | `informes` y `reglas_cliente`: columnas y tipos exactos (30, `set_eq`) | `m02_m03` «reglas_cliente no tiene ninguna columna de texto», `m06` | sí (`bytea`, dominio, `xml`) |
| 6 a 8 | Un HMAC sin formato se rechaza (3 columnas) | `m02_m03` «rechaza cada valor sin formato» (`tokens`, `codigos_*`) | solo ejecución |
| 9 | Ninguna columna de token o código sin HMAC | `m02_m03` «ninguna columna de token o código en claro» | solo ejecución |
| 10, 12 | Segunda fila de ajustes; segunda licencia no revocada | `m02_m03` «ajustes_globales…» y «se rechaza la segunda licencia…» | solo ejecución |
| 11 | Segundo informe de una ejecución | `m06` «el segundo informe de una ejecución se rechaza» | solo ejecución |
| 13 | Índice en las columnas de las políticas | `m07` «las columnas de las políticas tienen índice» | solo ejecución |
| 14 | Dueños `postgres` | `m06`, `m07` «dueño postgres», `m08_m10` | solo ejecución |
| 15 | Vistas `security_invoker` | `m08_m10` «las dos vistas tienen security_invoker = true» | solo ejecución |
| 16 | `search_path` en todo `privado` | `m06`, `m07`, `m08_m10` y L 13 (`search-path.test.ts`, estático) | solo ejecución |
| 17 | Inmutabilidad `tgenabled = 'A'` | `m04_m05` «los seis disparadores de inmutabilidad… (tgenabled = 'A')» | sí (`enable trigger` en vez de `enable always trigger` en `auditoria_solo_insercion`) |
| 18 | `privado` sin usage para `anon` ni PUBLIC | `m01` y `m07` «usage en privado solo para él» | sí (`grant usage on schema privado to anon`: fallan también N-4 (e) y (f)) |
| 19, 20 | Instantáneas de `authenticated` y `service_role` = D-5 | `m07` «permisos de authenticated con aclexplode», «los de service_role» | sí (`select` en `tokens`; `insert` de `service_role`) |
| 21 | Valor **efectivo** de `pg_default_acl` cerrado para `r`, `S` y `f`: fila global con `coalesce(defaclacl, acldefault(...))` y filas por esquema tal cual | `m01` (0 filas para los cinco, global y por esquema) | sí (permiso por defecto a `anon`; y `alter default privileges for role postgres grant execute on functions to public`, que borra la fila global por volver al valor de serie: con la versión anterior de 21 esta mutación pasaba, ahora falla) |
| 22 | Tablas de `privado`: RLS y sin permisos | `m01` «permisos_por_defecto_previos: RLS, ninguna política, sin permisos» | solo ejecución |
| 23 | Cada permiso de escritura con su disparador de auditoría | `m07` «auditoría de las escrituras de authenticated», `m04_m05` | sí (`insert` de `service_role` en `informes`; `disable trigger` y `enable replica trigger` sobre `clientes_auditar`: la 23 mira `tgenabled in ('O','A')`) |
| N-1 | `pg_catalog, pg_temp` en toda `security definer` o de disparador, fuera de la plataforma | L 13 y `m07` «las funciones nuevas: … search_path», `m08_m10` | sí (función `privado.intrusa()`) |
| N-2 (a) | Lista cerrada de `security definer`, **por firma** | sin equivalente anterior (se crea aquí) | sí (función intrusa; **sobrecarga nueva** de `es_admin(uuid)`) |
| N-2 (b) | Escribe en tabla auditada y llama a `registrar_auditoria()`, como la lista | `m07` «al_dar_de_baja() escribe con registrar_auditoria()» y `m08_m10` (sin auditoría en las `mcp_*`) | sí |
| N-2 (c) | Quien escribe en tabla auditada llama a `registrar_auditoria()`, salvo las tres `mcp_*` (por firma exacta, no por prefijo) | ídem | sí (función que actualiza `clientes` sin auditar) |
| N-4 (a) a (c) | `relacl`, `attacl`, `proacl` con destinatarios en {`postgres`, `authenticated`, `service_role`, `conector`} (`acldefault` si el acl es nulo) | `m07` «anon, conector y PUBLIC no tienen nada…», `m08_m10` (comprobación final N-4) | sí (`anon` con `select`; `execute` a PUBLIC) |
| N-4 (d) | Tipos sin usage para nadie más que su dueño | `m02_m03` «los 17 tipos sin USAGE para nadie más que su dueño» | sí (`grant usage on type public.canal to public`) |
| N-4 (g) | Ningún permiso con `is_grantable` para quien no sea `postgres`, en `relacl`, `attacl`, `proacl`, `typacl` y `nspacl` de privado (cubre 19 y 20, que comparan solo el permiso) | sin equivalente anterior | sí (`grant select on public.clientes to authenticated with grant option`) |
| N-4 (e) | `privado` solo da permisos a la lista; nadie crea en `public` | `m08_m10` (comprobación final) | sí (`usage` en privado para `anon`) |
| N-4 (f) | `usage` en `privado` = {`authenticated`, `conector`} | `m07` «usage en privado solo para él»; `m08_m10` | sí (`usage` en privado para `anon`) |
| N-4 (h) | Destinatarios exactos de `execute` en funciones de `public` y `privado`, sin el dueño: `clientes_del_usuario()` y `es_admin()` para `authenticated`, las tres `mcp_*` para `conector` | `m07`, `m08_m10` (comprobación final) | sí (tres: `registrar_auditoria` a `authenticated` más envoltorio en `public`; `licencia_vigente` a `authenticated`; `mcp_enviar_informe` a `service_role`) |
| N-4 (i) | `anon`, `authenticated`, `service_role` y `conector` no son miembros de ningún rol (`pg_auth_members`) | sin equivalente anterior | sí (`grant authenticated to anon`) |

## Aserciones de 07 y su equivalente

| 07 | Qué comprueba | Equivalente | Mutación |
| --- | --- | --- | --- |
| 1 a 7 | Siete casos de CA-018 como dueño, con el SQLSTATE exacto; los casos 1, 2, 3, 5 y 7 con el mensaje o el nombre de la restricción (`informe_problema_desconocido`, `informe_problema_repetido`, `informes_problemas_check`, `informes_tratados_check`, `ejecucion_cliente_incoherente`) | `m06` «CA-018: … se rechaza como dueño y deja 0 filas» (siete) | sí (renombrar `informes_tratados_check` falla 5; renombrar `informes_problemas_check` falla 3) |
| 8 a 14 | Los mismos siete como `service_role`: 42501 exacto en 8, 9, 10, 12, 13 y 14; 22P02 en 11 (el error de tipo salta al analizar, antes de los permisos, como la 4) | `m06` «… se rechaza como service_role (sin permisos) y deja 0 filas» | sí (permiso y política permisivos, sin disparador; y con disparadores, para ver que ya no basta «cualquier rechazo»: fallan 8, 9, 10, 12 y 13) |
| 15 | Caso positivo: la sentencia base de un informe válido se inserta (subbloque que se deshace) | `m06` (informe válido) | sí (restricción que rechaza la base) |
| 16 | 0 filas nuevas en `informes` y `ejecuciones` (el «+1» del diseño) | `m06` `contar(...)` tras cada caso | solo ejecución |
| 17 a 30 | CA-017, una por propiedad del contrato frente al catálogo | `m06` «el formato y las listas del contrato», «índices», L 2 | sí (rango de `tratados` cambiado) |

L 2 (`contrato-informe.test.ts`) cubre contrato → transcripción de 07; las aserciones 17 a 30 de 07 cubren transcripción → catálogo.

## Petición de la 021 (m-45, m-49): lista por firma

La lista cerrada de N-2 y su comparación van por firma (`regprocedure`), sobre todo esquema que no sea de la plataforma (lista N-1) más `privado`. Las tareas futuras de la 021 solo añaden firmas a `funciones_definer` de `01_estructura.test.sql`; una versión nueva (otra firma) hace fallar N-2 (a) hasta que se quita la antigua de la lista y de la base con `drop` y `revoke` (mutación «sobrecarga nueva de `es_admin(uuid)`»). La comparación equivalente en el arnés es `pgtap.test.ts`, que ejecuta 01 contra PGlite.

## Lo no ejecutado y las diferencias con CI

- `supabase test db` y `pg_prove`: NO EJECUTADO. VERIFICAR en T-013: que `\ir ayudas/perfiles.psql` se resuelve relativo al archivo (si no, repetir el texto en cada archivo, ya previsto), que pgTAP se instala en `extensions`, y la lista de esquemas de la plataforma de N-1.
- En PGlite no hay `supabase_admin` con objetos propios ni funciones de la plataforma: lo que 01 recorre «fuera de la plataforma» solo contiene `public` y `privado`. En CI puede aparecer una función `security definer` ajena (N-1, N-2) que no esté en la lista de esquemas: es lo que la primera ejecución debe fijar (T-011).
- Permisos por defecto de esquemas (`defaclobjtype = 'n'`): 21 se limita a `r`, `S` y `f` (lo que cierra D-4, como `m01.test.ts`); el preámbulo de PGlite deja un permiso por defecto de esquemas a `anon`, `authenticated` y `service_role` que Supabase quizá no tenga igual.
- N-4 sobre el esquema `public`: no se le aplica el subconjunto de destinatarios (la plataforma da usage a `anon` y PUBLIC, R-2); solo se exige que nadie más que su dueño pueda crear en él.
- Límites del cálculo heurístico de N-2 (b) y (c) (`escribe`, `llama`): es una expresión regular sobre `prosrc`. No ve identificadores entre comillas, `update only`, `merge into`, SQL dinámico (`execute`) ni distingue comentarios. Se queda así porque ampliarla no la haría exacta; el control real es la lista cerrada por firma de N-2 (a), que obliga a que una persona revise cada función nueva.
- Las sombras de N-3 no cubren secuencias (una secuencia sin calificar no cae en la sombra): residual de N-3. Hoy las únicas secuencias son las de identidad de `auditoria.id` y `versiones_prompt.id`; sus permisos sí los cubren 19, 20 y N-4 (a), solo falla el nombre sin calificar.
- VERIFICAR en T-013 (aserción 17): recorre todos los disparadores no internos de toda la base sin filtrar por esquema; en CI puede aparecer un disparador de la plataforma (`auth`, `storage`, `realtime`) con `tgenabled = 'A'`. Si aparece, filtrar por `public` y `privado` con su caso; la primera ejecución lo fija.
- VERIFICAR en T-013 (N-4 (i), m-2): que en Supabase real `anon`, `authenticated`, `service_role` y `conector` no tengan membresías; si la plataforma deja alguna (p. ej. de `supabase_admin` o `authenticator`), la primera ejecución la fija y se filtra con su caso, nunca se borra la aserción.
- VERIFICAR en T-013 (N-4 (h)): la lista de `execute` está medida en PGlite; en CI puede aparecer una función de la plataforma en `public` (extensiones) con `execute` para PUBLIC o `anon`; se decide con la primera ejecución.
- m-1 (auditor), pendiente de T-013 / T-009: N-1 y N-2 no miran funciones `security definer` de los esquemas de la plataforma (`auth`, `storage`, `extensions`...). Propuesta: en CI, una lista cerrada por firma de las de la plataforma que se aceptan y un fallo ante una nueva (propuesta 46).
- Límite de la aserción 4 (m-3): exige una expresión regular anclada, no mide lo estricta que es (`^.*$` pasaría); la estrictitud la prueban los valores límite de `m02_m03` y `m06`. Si T-009 quiere más, exigir longitud máxima por columna o un valor sobrelargo rechazado por columna.
- Las 3 columnas de `privado.permisos_por_defecto_previos` (`name`, `"char"`, `aclitem[]`) salen como «texto» por la lista blanca y están declaradas en la aserción 3 y exentas de la 4 (metadatos de la migración 1, sin permisos).
- Las ayudas dependen de `set local role` desde funciones de `pg_temp` y de que las funciones de ayuda tengan `execute` para PUBLIC por `grant` explícito (los permisos por defecto de D-4 las cerrarían): en PGlite funciona; en CI se confirma. Bajo un rol que no es el dueño no se llama a pgTAP (sus funciones también quedan cerradas por D-4): se usa `pg_temp.intentar()` y se compara de vuelta como dueño.

## Pendientes de la 2.ª vuelta (sin corregir; ver `dictamenes.md`)

- **R2-5** (revisor, menor; anotado también en la propuesta 46): la aserción 4 se satisface con un check de varias columnas cuya expresión regular nombre otra columna. Corrección mínima: exigir que el check sea de una sola columna (`conkey` de longitud 1 y esa columna). Cierre de la 010 o T-011.
- **A2-1** (auditor, menor): la aserción 3 identifica las columnas sin esquema; una tabla homónima en `privado` con una columna repetida no se ve (sin permisos, no explotable por la API). Corrección mínima: identificar por esquema, tabla y columna. Cierre de la 010 o T-011.
- **A2-2** (auditor, menor): no se fija el tipo de las tres columnas exceptuadas de `privado.permisos_por_defecto_previos`; pasarlas a `text` deja 01 en verde (sin permisos). Corrección mínima: `set_eq` de `columna:tipo` (`name`, `"char"`, `aclitem[]`). Cierre de la 010 o T-011.
- **A2-3** (auditor, menor): los casos 3 y 5 de 07 comparan el mensaje en inglés; falla en cerrado si `lc_messages` difiere. Corrección mínima: SQLSTATE y `constraint_name` con `get stacked diagnostics`. VERIFICAR en T-013.
