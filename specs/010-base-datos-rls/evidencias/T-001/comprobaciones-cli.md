# 010 · T-001 · Comprobaciones de la CLI de Supabase

Autor: `ingeniero-bd` · 20/11/2026 · Método: skill `verificar-decision`, solo documentación y código fuente oficial (sin ejecutar la CLI: esta máquina no tiene Docker ni la CLI). Sin datos del proyecto enviados a ningún servicio.

Versión de referencia: CLI `v3.2.0` (última publicada el 16/11/2026, rama `develop`). La CLI está reescrita en TypeScript; el código citado es el de `develop`. **T-013 fija la versión exacta** (decisión T-013) y debe repetir 1 y 2 con la fijada.

Las fuentes de la columna «Fuente» se consultaron el 20/11/2026.

| N.º | Pregunta | Resultado | Estado |
| --- | --- | --- | --- |
| 1 | Nombre del archivo de migración | `<timestamp>_<nombre>.sql` | CONFIRMADA |
| 2 | `db push` y `start`: ¿una transacción por archivo? | Sí, por código fuente; falta la prueba real | CONFIRMADA por fuente, prueba real en T-013 |
| 3 | `[db.seed] enabled` | Existe, por defecto `true`; `false` impide la carga | CONFIRMADA |
| 4 | `postgres` puede hacer `alter database postgres set app.entorno` | La documentación no lo resuelve | VERIFICAR (T-013) |

## 1. Nombre del archivo

- Documentación: «All schema migration files must be created in this directory following the pattern `<timestamp>_<name>.sql`» ([supabase migration new](https://supabase.com/docs/reference/cli/supabase-migration-new)).
- Código: el filtro local es `/^([0-9]+)_(.*)\.sql$/` (`apps/cli/src/command-internal/migration-pending.ts`) y el nombre lo construye `supabase/migrations/<timestamp>_<name>.sql` con la marca `YYYYMMDDHHMMSS` en UTC, 14 dígitos (`migration-file.ts`). Fuente: [migration-pending.ts](https://raw.githubusercontent.com/supabase/cli/develop/apps/cli/src/command-internal/migration-pending.ts) y [migration-file.ts](https://raw.githubusercontent.com/supabase/cli/develop/apps/cli/src/command-internal/migration-file.ts).
- Consecuencia: el nombre `2026112000NN00_<nombre>.sql` de las convenciones (14 dígitos, `<nombre>` con letras, dígitos y guion bajo) es válido. **Se confirma tal cual.** `supabase/reversiones/` queda fuera de `supabase/migrations/`, así que la CLI no la aplica.
- Efecto lateral: la versión que se registra en `supabase_migrations.schema_migrations` es el número entero antes del guion bajo; dos archivos con el mismo número chocarían. Los `NN` son distintos.

## 2. ¿Una transacción por archivo?

- Documentación: «After successfully applying a migration, a new row will be inserted into the migration history table»; no dice nada de transacciones ([supabase db push](https://supabase.com/docs/reference/cli/supabase-db-push)). No resuelve la pregunta.
- Código (`migration-apply.ts`, [fuente](https://raw.githubusercontent.com/supabase/cli/develop/apps/cli/src/command-internal/migration-apply.ts)):
  - «Statements batch inside an implicit transaction»; la fila del historial va en el último lote, así que se registra solo si todas las sentencias han ido bien.
  - Un archivo que ya trae `BEGIN`, `COMMIT`, etc. se ejecuta «exactamente como está escrito» (la CLI no añade nada) y el historial se anota después.
  - Las sentencias que no admiten transacción (p. ej. `create index concurrently`, `vacuum`) se ejecutan fuera del lote; la guía de errores dice que deben ir en su propio archivo.
  - Solo un archivo cuya primera línea es `-- pg-delta: transaction=false` se ejecuta sentencia a sentencia sin transacción. Ninguna de las nuestras la lleva.
- `supabase start` aplica las migraciones con el mismo ejecutor (`migrate-and-seed.ts`, [fuente](https://raw.githubusercontent.com/supabase/cli/develop/apps/cli/src/command-internal/migrate-and-seed.ts)), por lo que el comportamiento es el mismo.
- Decisión para las migraciones (D-1, REQ-030): **no llevan `begin; … commit;`** y la guarda de rol es la primera sentencia (L 11). Un archivo sin transacción explícita ya es atómico; con ella, la CLI renuncia a envolverlo y la atomicidad pasaría a depender de nosotros.
- **Segunda vuelta (20/11/2026): decisión del orquestador que sustituye a `begin/commit` de D-1 y que el responsable debe confirmar.** La atomicidad ya no depende del cliente ni de la transacción externa: tras la guarda, todo el resto de M01, y todo el resto de su reversión (comprobaciones, restauración y los tres `drop`), va en **un solo bloque `do $$ … $$`**, que es una sola sentencia y falla entera o no cambia nada aunque se ejecute sentencia a sentencia (autocommit). No hay tablas temporales `on commit drop`: la copia es la propia `privado.permisos_por_defecto_previos`. La prueba `A` de `m01.test.ts` ejecuta M01 y la reversión sentencia a sentencia con fallos tardíos y compara la instantánea del catálogo. Con la segunda vuelta, el hallazgo 1 del revisor queda cubierto en cuanto a atomicidad; el «siempre» de D-1 y el hallazgo 2 del auditor **no** quedaban cerrados del todo (ver la tercera vuelta).
- **Tercera vuelta (20/11/2026).** La guarda de la línea 1 es una sentencia aparte: con `psql -f` en autocommit y sin `ON_ERROR_STOP`, si falla, el `do` único se ejecutaba igual (sondas del auditor: otro superusuario, y un rol `createrole` miembro de `postgres`). Ahora cada bloque `do` de M01 y de su reversión repite la guarda como primera instrucción (L 11 interna) y fija `search_path = pg_catalog, pg_temp` justo después (L 13). Con eso, el «siempre» de D-1 y el hallazgo 2 del auditor quedan cubiertos **en cuanto a guarda y atomicidad**: probado en PGlite con una variante de autocommit que sigue tras cada error (`ejecutarSigueTrasError`). **Sigue PENDIENTE de confirmación del responsable** la sustitución de `begin/commit` de D-1 por la guarda más un `do` único, y que el diseño (D-1) lo refleje; T-012 no necesita envolver M01. La prueba real con la CLI sigue siendo CA-025 (T-013).
- Pendiente (VERIFICAR para T-013): la lectura del código no sustituye una ejecución. CA-025 (migración de prueba que falla tras crear una tabla, catálogo sin diferencias) lo prueba con la CLI fijada. Hasta entonces, REQ-030 queda «verificada por fuente, no ejecutada».
- Riesgo anotado: el código es de `develop`; si T-013 fija una versión anterior de la CLI (la Go anterior a 3.x), la prueba de CA-025 es la que manda.

## 3. `[db.seed] enabled`

- Documentación: `db.seed.enabled`, por defecto `true`: «Enables running seeds when starting or resetting the database» ([config.toml](https://supabase.com/docs/guides/local-development/cli/config)). Además `db.seed.sql_paths`, por defecto `["./seed.sql"]`.
- Código: `applySeedFiles` vuelve sin hacer nada cuando `config.enabled` es falso (`seed.ts`, [fuente](https://raw.githubusercontent.com/supabase/cli/develop/apps/cli/src/command-internal/seed.ts)).
- Consecuencia: `[db.seed] enabled = false` en `supabase/config.toml` (T-007) desactiva la carga automática al arrancar o reiniciar y el seed va con `psql` y `app.entorno` (D-10, CA-003). **Confirmada.**
- Queda por ver en T-013 que `supabase start` con `enabled = false` no carga `seed.sql` (una línea de comprobación: contar filas de `clientes` tras arrancar).

## 4. `alter database postgres set app.entorno`

- La documentación de Supabase muestra `alter database postgres set timezone to '…'` para un parámetro estándar ([Postgres configuration](https://supabase.com/docs/guides/database/postgres/configuration)); no habla de parámetros personalizados con prefijo ni de si el rol `postgres` de la plataforma es el dueño de la base.
- La regla general de PostgreSQL es que cambia los valores por defecto de la base su dueño o un superusuario ([ALTER DATABASE](https://www.postgresql.org/docs/current/sql-alterdatabase.html)); un parámetro con prefijo (`app.entorno`) no exige permiso especial. Que el dueño de la base de Supabase sea `postgres` no se ha podido comprobar con documentación.
- Estado: **VERIFICAR en la primera ejecución de T-013**: en CI, `alter database postgres set app.entorno = 'ci';` seguido de `select current_setting('app.entorno', true)` en una conexión nueva; y, por una persona en `Nido`, T-014. Si falla, plan B: fijarlo por rol (`alter role postgres set app.entorno`) o con la variable `PGOPTIONS` del `psql` del seed; la guarda de `seed.sql` no cambia. No se usa mientras no esté verificado.
- Nota del diseño (N-8): la variable protege de accidentes, no de quien actúa a propósito con `postgres`.

## Resumen para `verificaciones.md`

- 1 y 3: confirmadas con fuente y fecha (20/11/2026).
- 2: confirmada por código fuente de la CLI; prueba real en CA-025 (T-013). Las migraciones no llevan `begin/commit`.
- 4: VERIFICAR en T-013, con plan B anotado.
- No ejecutado aquí: ninguna comprobación contra una base Supabase ni la CLI real.
