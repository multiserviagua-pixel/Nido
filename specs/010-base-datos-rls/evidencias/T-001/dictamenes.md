# T-001 · Dictámenes (20/11/2026)

Cambio: rama `tarea/010-T-001`, commits 0bf1b0f y 72230cf. Resumen de los informes del `revisor` y del `auditor-seguridad`; lo que sigue es lo que dijeron, no una prueba mía.

## Revisor: APTO CON CONDICIONES (0 bloqueantes)

| N.º | Sev. | Art. | Resumen |
| --- | --- | --- | --- |
| 1 | MAYOR | 3, 5, 11 | La reversión de M01 no lleva `begin/commit` y D-1 dice «siempre»; sentencia a sentencia deja la base irreversible |
| 2 | MAYOR | 10, 13 | `npm test` completo falla por timeout de 5 s en `tests/unit/plataforma/reglas-eslint.test.ts` (002) al coincidir con PGlite; en 5c907d7 pasa (54/54). Fuera de T-001 |
| 3 | MENOR | 11 | La rama `acldefault` de la migración no tiene prueba (preámbulo sin filas globales) |
| 4 | MENOR | 1 | `permisos_por_defecto_previos.esquema` y `.tipo` son `text` fuera de la lista D-7 (CA-016) |
| 5 | MENOR | 6, 13 | Cambio no declarado en `m01.test.ts:188` (`aclexplode`) |
| 6 | MENOR | 11 | La comprobación de objetos ajenos no cubre operadores, intercalaciones ni otros |
| 7 | MENOR | — | Dos líneas defensivas no cazables por prueba (sin acción) |
| 8 | MENOR | — | `listarReversiones()` en `arnes.ts` sin uso |

## Auditor de seguridad: APTO CON CONDICIONES (0 bloqueantes)

| N.º | Sev. | Art. | Resumen |
| --- | --- | --- | --- |
| 1 | MEDIO | 3, 11 | M01 depende de una transacción externa (temporal `on commit drop`); en autocommit quedan abiertos los permisos por defecto por esquema |
| 2 | MEDIO | 3, 4, 11 | La reversión sin transacción falla abierta: guarda eludible, copia perdida, `conector` con `login` sobrevive |
| 3 | BAJO | 3 | `revoke … on schema privado` solo a PUBLIC; ampliar a `anon, authenticated, service_role, conector` |
| 4 | BAJO | 3 | `statement_timeout` es un valor por defecto, no un límite; decirlo en D-9 R-4 |
| 5 | BAJO | 2, 3 | Falta aserción de que `conector` no tiene miembros ni pertenece a nadie (`authenticator`) |
| 6 | BAJO | 1 | L 12 no entiende comillas de dólar ni `assert`; corregir antes de T-003 |
| 7 | BAJO | 3 | Informativo: el cierre afecta también a esquemas de la plataforma; supervisar `pg_default_acl` en T-014 |

Condiciones del auditor: 1 y 2 corregidos (o enmienda de D-1 y prueba de autocommit) antes de aplicar en `Nido`; 3 y 5 en T-001 o T-011; 4 anotado; 6 antes de T-003.

## Vuelta 2 (rama `tarea/010-T-001-v2`, cca5ac0 y 2df0ffe): auditor APTO CON CONDICIONES

Cerrados 1, 3, 5 y 6 de la vuelta 1. Nuevo MAYOR: la guarda de la línea 1 es una sentencia aparte y con `psql -f` en autocommit el `do` se ejecuta igual (sondas con otro superusuario y con `createrole`). Nuevos MENOR: `privado` y la copia heredan concesiones por defecto a roles ajenos; `search_path` de los `do`; documentación.

## Vuelta 3 (rama `tarea/010-T-001-v3`, 790a496, c2f3dcd y 7e96b65): auditor APTO CON CONDICIONES, 0 bloqueantes, 0 mayores

Cerrado el MAYOR (guarda dentro de cada `do`; P1, P3 y P7b repetidas). Abiertos, todos MENOR:

| N.º | Resumen | Condición |
| --- | --- | --- |
| 1 | `set_config('search_path', …, true)` queda fijado para lo que siga en la misma transacción; guardar y restaurar la ruta al final de cada `do` | Una línea; T-001 o siguiente migración |
| 2 | La guarda interna usa `<>` resuelto por el `search_path` de la sesión; escribir `operator(pg_catalog.<>)` o fijar la ruta antes de la guarda (ajustar `GUARDA` y `GUARDA_INTERNA` en los detectores) | Una línea; T-001 o siguiente |
| 3 | L 11 interna y L 13 se burlan (cuerpo con comillas simples, inicializador de `declare`, DDL suelto fuera de un `do`); falta una regla L 14: cada sentencia tras la línea 1 es un `do` con guarda | Antes de T-002 y T-003 |
| 4 | El `revoke` de P6 es silencioso: falta comprobar tras los bucles que `privado` y la copia no tienen concesiones ajenas, y supervisar `pg_default_acl` (incluido tipo `n`) | T-001 o T-011; supervisión en T-014 |
| 5 | Informativo: la reversión no valida el contenido de la copia; anotarlo en su límite | — |

Sin comprobar por el auditor: nada contra Supabase real ni la CLI; sigue pendiente de confirmación del responsable la sustitución de `begin/commit` de D-1 por la guarda más un `do` único.

## Vueltas 4 y 5 (rama `tarea/010-T-001-v3`)

| Vuelta | Dictamen (`auditor-seguridad`) | Hallazgos | Cerrado en |
| --- | --- | --- | --- |
| 4 | NO APTO | MAYOR 1: tipos de `declare` sin calificar (se resuelven al compilar, antes de la guarda). MENOR 2: prueba J. MENOR 3: regla L 14 | Hallazgos 1, 2 y 4 de la vuelta 3 y la regla L 14: 381d45d (pruebas) y 4c545bc |
| 5 (20/11/2026) | APTO, 0 bloqueantes, 0 mayores | MENOR A abierto: `esDoConGuarda` solo examina el primer `declare` (condición de T-002, `tareas.md`, Convenciones) | MAYOR 1: 58651bb (pruebas) y 5b7d908 |

No se ejecutó pgTAP ni nada contra Supabase real: solo el arnés PGlite y las pruebas L locales.

Integración de T-001 por delegación (D-036), 20/11/2026, con el dictamen APTO de la vuelta 5. El responsable puede revocarla.
