# T-008 · Rojo previo (21/11/2026)

Orden: primero la dependencia, después L 2 en rojo y, tras él, el código (ayudas, 01 y 07).

## Dependencia

`npm install --save-dev --save-exact @electric-sql/pglite-pgtap@0.0.18 --ignore-scripts` desde la copia de trabajo (D-034). El nombre real del paquete lleva el ámbito `@electric-sql/`: `pglite-pgtap` sin ámbito no existe en el registro (`npm view pglite-pgtap` da E404). Versión 0.0.18, Apache-2.0, `peerDependencies` `@electric-sql/pglite` 0.5.17 (la instalada). `node_modules` es un junction a la carpeta principal: la instalación también deja el paquete allí.

## L 2 en rojo

Comando: `npx vitest run --maxWorkers=2 tests/unit/bd/contrato-informe.test.ts`

Resultado antes de escribir `supabase/tests/07_informes.test.sql`: 15 fallos y 2 pruebas en verde de 17 (las dos que solo leen el contrato). Los 15 fallos: `ENOENT … supabase/tests/07_informes.test.sql`.

## Correcciones del revisor en rojo (`c4668df`, 22/11/2026)

`c4668df` cambia solo `supabase/tests/pglite/pgtap.test.ts`; los SQL siguen siendo los de `2cb4adc`. Reproducido el 22/11/2026 en una copia de trabajo temporal fuera del repositorio en ese commit (`git worktree add --detach`, `node_modules` por junction): `npx vitest run --maxWorkers=2 supabase/tests/pglite/pgtap.test.ts`. Resultado: **5 fallos y 20 en verde de 25**.

```
× 01_estructura.test.sql: 34 aserciones declaradas, todas ejecutadas y ninguna fallida     (expected 33 to be 34)
× execute de PUBLIC por defecto para funciones (la fila global de pg_default_acl desaparece al volver al valor de serie): falla 21 en 01_estructura.test.sql
× authenticated con grant option sobre un permiso ya admitido (is_grantable): falla N-4 (g) en 01_estructura.test.sql
× service_role con permiso y política, pero con los disparadores: el error ya no es 42501 (exacto): falla 8, 9, 10, 12, 13 en 07_informes.test.sql
× pg_temp.como da la sesión de cada perfil, y pg_temp.huella cambia si cambia la tabla     (esperaba 'perfil_desconocido'; la transacción sigue abortada)
```

Cada fallo corresponde a un hallazgo del revisor: R-M-1 (la sonda de `execute` por defecto no hace fallar la 21), R-m-3 (N-4 (g) no existe: 33 aserciones en lugar de 34 y sin fallo con `grant option`), R-m-1 (8 a 14 sin SQLSTATE exacto) y R-m-7 (`pg_temp.id` con un nombre desconocido).

## Mutaciones del auditor en rojo (`09c8692`, 22/11/2026)

`09c8692` cambia solo `pgtap.test.ts`; los SQL siguen siendo los de `7ba0834`. Reproducido el 22/11/2026 en otra copia temporal en ese commit con el mismo comando. Resultado: **12 fallos y 26 en verde de 38**. Los 12 fallos son las 12 mutaciones nuevas, que con el SQL anterior no hacen fallar la aserción esperada:

```
× execute para authenticated en una función interna más un envoltorio de invocador en public (A-11, M-1 a): falla N-4 (h)
× execute de licencia_vigente para authenticated (M-1 b): falla N-4 (h)
× execute de mcp_enviar_informe para service_role (M-1 c): falla N-4 (h)
× una columna bytea en informes (A-14, M-2): falla 3, 5
× un dominio sobre text como columna de informes (A-14, M-2): falla 3, 5
× una columna xml en reglas_cliente (A-14, M-2): falla 3, 5
× un disparador de auditoría desactivado (tgenabled = D, A-11, M-3): falla 23
× un disparador de auditoría solo en réplica (tgenabled = R, A-11, M-3): falla 23
× un rol de la plataforma miembro de otro (authenticated dentro de anon, m-2): falla N-4 (i)
× el check de rango de tratados con otro nombre: el caso 5 ya no se rechaza por él (m-4): falla 5
× el check de cardinalidad con otro nombre: el caso 3 ya no se rechaza por él (m-4): falla 3
× una restricción que rechaza también la sentencia base: el caso positivo falla (m-4): falla 15
```

Son pruebas de mutación: «fallo» aquí significa que la aserción de 01 o 07 que debería detectar la mutación no la detectó con el SQL anterior (lo que se quiere ver en rojo antes de corregir). Con `4eb0c9e` todas pasan. La mutación de A-m-3 (check de `version_prompt`) se añadió con la corrección y no se vio en rojo aparte.
