# T-008 · Dictámenes (22/11/2026)

Prefijos: `R-` revisor (M = mayor, m = menor; `R2-` en su 2.ª vuelta), `A-` auditor-seguridad (M = mayor, m = menor; `A2-` en su 2.ª vuelta). Los números son los de este archivo, no los de los dictámenes originales.

| Quién | Vuelta | Veredicto |
| --- | --- | --- |
| `revisor` (sobre 2cb4adc) | 1.ª | NO APTO: 1 mayor y 10 menores |
| `auditor-seguridad` (sobre 7ba0834) | 1.ª | APTO CON CONDICIONES: 0 bloqueantes, 3 mayores y 4 menores |
| `revisor` (sobre 4eb0c9e) | 2.ª | APTO CON MENORES: 7 menores (R2-1 a R2-7) |
| `auditor-seguridad` (sobre 4eb0c9e) | 2.ª | APTO: 3 menores (A2-1 a A2-3) |

Aprobada por delegación D-036 (revocable). Sigue siendo cierto: pgTAP en CI (`supabase test db`) NO EJECUTADO hasta T-013. Lo ejecutado aquí es el mismo SQL contra PGlite con `@electric-sql/pglite-pgtap`, que no sustituye a CI.

## Revisor, 1.ª vuelta (NO APTO, sobre 2cb4adc)

Corregidos en `7ba0834`; el rojo previo está en `c4668df` (solo `pgtap.test.ts`, ver `rojo-previo.md`).

| Hallazgo | Qué se hizo | Mutación o prueba |
| --- | --- | --- |
| R-M-1 (mayor): la aserción 21 no veía que se deshiciera el cierre de permisos por defecto de funciones; la sonda `alter default privileges for role postgres grant execute on functions to public` seguida de `revoke` dejaba la fila global borrada (PostgreSQL la borra al volver al valor de serie) y 21 pasaba | 21 calcula el valor efectivo con `coalesce(defaclacl, acldefault(...))` para la fila global; las filas por esquema, tal cual | Mutación: esa sonda y un permiso por defecto a `anon`. Con la 21 anterior pasaba; ahora falla |
| R-m-1: las aserciones 8 a 14 de 07 aceptaban cualquier rechazo | Exigen el SQLSTATE exacto como `service_role`: 42501 en 8, 9, 10, 12, 13 y 14; 22P02 en la 11 (el error de tipo salta al analizar, antes de los permisos, igual que en la 4) | Mutación con permiso y política permisivos; y con disparadores (fallan 8, 9, 10, 12 y 13) |
| R-m-2: N-2 (c) excluía las `mcp_*` por prefijo | Exclusión por firma exacta (`regprocedure`) | Mutación: función que actualiza `clientes` sin auditar |
| R-m-3: N-4 no miraba `is_grantable` | Nueva N-4 (g) sobre `relacl`, `attacl`, `proacl`, `typacl` y `nspacl` de `privado` | `grant select on public.clientes to authenticated with grant option` |
| R-m-4: sin mutación para 17 ni 18 | Mutaciones nuevas | 17: `enable trigger` en vez de `enable always trigger` en `auditoria_solo_insercion`. 18: `grant usage on schema privado to anon` (fallan también N-4 (e) y (f)) |
| R-m-5: sin mutación para N-4 (d), (e) y (f) | Mutaciones nuevas | (d): `grant usage on type public.canal to public`. (e) y (f): `usage` en `privado` para `anon` |
| R-m-6: tabla muerta en el código de la prueba | Retirada | Sin cambio de comportamiento; las 56 pruebas siguen en verde |
| R-m-7: `pg_temp.id()` devolvía nulo con un nombre desconocido; 'OA' con un identificador escrito a mano | `id` cierra en fallo (error) ante un nombre desconocido; 'OA' entra en la tabla de identificadores | Prueba en `pgtap.test.ts` (nombre desconocido falla) |
| R-m-8: nombre de la dependencia sin ámbito; falta `npm audit` | `@electric-sql/pglite-pgtap` 0.0.18 en `diseno.md`, `plan.md` y propuestas; `npm audit` | `npm audit`: found 0 vulnerabilities |
| R-m-9: la aserción 17 recorre todos los disparadores sin filtrar esquema | Anotado, no cambiado: VERIFICAR en T-013 | Nota en `verde.md`: si aparece uno de la plataforma con `tgenabled = 'A'`, se filtra por `public` y `privado` con su caso |
| R-m-10: las sombras de N-3 no cubren secuencias | Anotado como residual de N-3 | Nota en `verde.md`: los permisos de las dos secuencias de identidad los cubren 19, 20 y N-4 (a); solo falla el nombre sin calificar |

## Auditor, 1.ª vuelta (APTO CON CONDICIONES, sobre 7ba0834)

Mutaciones en rojo en `09c8692`; correcciones en `4eb0c9e`. Las 12 mutaciones del auditor fallaron antes de corregir; la de A-m-3 se añadió con la corrección.

| Hallazgo | Qué se hizo | Mutación o prueba |
| --- | --- | --- |
| A-M-1 (A-11, A-09; arts. 2 y 3; REQ-011): nada cerraba quién ejecuta funciones; `authenticated` o `service_role` podían ganar `execute` sin que 01 fallase | N-4 (h): `set_eq` de `firma\|destinatario\|EXECUTE` sobre `aclexplode(coalesce(proacl, acldefault('f', proowner)))` de `public` y `privado`, sin el dueño. Hoy: `clientes_del_usuario()` y `es_admin()` para `authenticated`, las tres `mcp_*` para `conector` | (a) `registrar_auditoria` a `authenticated` más envoltorio `public.anotar`; (b) `licencia_vigente(uuid)` a `authenticated`; (c) `mcp_enviar_informe` a `service_role` |
| A-M-2 (A-14; art. 1; REQ-020 y 023): el control de texto libre reconocía seis tipos por nombre; se escapaban dominio sobre `text`, `bytea`, `xml`, `name`, `"char"`, `tsvector` y compuestos; 07 no exigía que `informes` no tuviese columnas de más | Aserción 3 con lista blanca del tipo base (resuelto por `typbasetype` y `typelem`); aserción 5 con `set_eq` exacto `columna:tipo` de `informes` (23) y `reglas_cliente` (7) | `bytea` en `informes`; dominio sobre `text` en `informes`; `xml` en `reglas_cliente`: fallan 3 y 5 |
| A-M-3 (A-11; art. 3): la aserción 23 no miraba `tgenabled` | `and g.tgenabled in ('O','A')` | `disable trigger` y `enable replica trigger` sobre `clientes_auditar` |
| A-m-1: N-1 y N-2 no ven funciones `security definer` de esquemas de la plataforma | No corregido aquí: propuesta 46 (VERIFICAR en T-013, lista cerrada por firma) | Sin mutación posible en PGlite |
| A-m-2: membresías de los cuatro roles | N-4 (i): ningún rol de `anon`, `authenticated`, `service_role`, `conector` es miembro de otro (`pg_auth_members`) | `grant authenticated to anon`. VERIFICAR en T-013 lo que deje Supabase |
| A-m-3: la aserción 4 aceptaba cualquier check | Exige expresión regular anclada (`~ '^`) en el check de cada columna de texto | Sustituir el check de `informes.version_prompt` por `<> ''` (no se vio en rojo aparte) |
| A-m-4: 07 comparaba solo el SQLSTATE y no tenía caso positivo | Casos 1, 2, 3, 5 y 7 con mensaje o nombre de la restricción; caso positivo 15 en subbloque que se deshace; 07 con 30 aserciones | Renombrar `informes_tratados_check` falla 5; renombrar `informes_problemas_check` falla 3; una restricción que rechaza la sentencia base falla 15 |

Adicional de A-M-2: la lista blanca deja fuera, y por tanto la aserción 3 lista, las tres columnas de `privado.permisos_por_defecto_previos` (`esquema` `name`, `tipo` `"char"`, `acl` `aclitem[]`): metadatos de M01, sin permisos para nadie; exentas del check de la 4.

## Revisor, 2.ª vuelta (APTO CON MENORES, sobre 4eb0c9e)

Quedan abiertos R2-4 y R2-5; los otros cinco están corregidos.

| Hallazgo | Estado y destino |
| --- | --- |
| R2-1: el resumen del dictamen del revisor en este archivo era incompleto (arts. 6 y 13) | Corregido al reescribir este archivo con una tabla por dictamen y vuelta |
| R2-2: `tareas.md` decía 33 y 29 aserciones | Corregido: 36 y 30 |
| R2-3: numeración antigua en `verde.md` («16 a 29» de 07) | Corregido: 17 a 30 |
| R2-4: casos 3 y 5 de 07 comparan el mensaje en inglés (REQ-028) | Abierto, falla en cerrado. VERIFICAR en T-013: comparar `constraint_name` con `get stacked diagnostics` (igual que A2-3) |
| R2-5: la aserción 4 se satisface con un check de varias columnas cuya expresión regular nombre otra columna | Abierto. Anotado en `verde.md` y en la propuesta 46 |
| R2-6: el rojo de las correcciones solo constaba en mensajes de commit (art. 13) | Corregido: reproducido en `rojo-previo.md` (c4668df: 5 fallos; 09c8692: 12 fallos) |
| R2-7: la propuesta 43 no reflejaba lo aplicado | Corregido: marcada «aplicada en parte»; pendiente `docs/TECNOLOGIAS.md` (coordinación) |

## Auditor, 2.ª vuelta (APTO, sobre 4eb0c9e)

Los tres menores **quedan abiertos, sin corregir**. Ninguno es explotable por la API (sin permisos).

| Hallazgo | Corrección mínima | Destino |
| --- | --- | --- |
| A2-1: la aserción 3 identifica columnas sin esquema; una tabla homónima en `privado` con una columna repetida no se ve | Identificar por `(esquema, tabla, columna)` en la aserción 3 | Cierre de la 010 o T-011 |
| A2-2: no se fija el tipo de las tres columnas exceptuadas de `privado.permisos_por_defecto_previos`; pasarlas a `text` deja 01 en verde | Aserción `set_eq` de `columna:tipo` para esas tres (`name`, `"char"`, `aclitem[]`) | Cierre de la 010 o T-011 |
| A2-3: los casos 3 y 5 de 07 comparan el mensaje en inglés; falla en cerrado si `lc_messages` difiere | Comparar SQLSTATE y `constraint_name` con `get stacked diagnostics` | T-013 (VERIFICAR en la primera ejecución en CI) |
