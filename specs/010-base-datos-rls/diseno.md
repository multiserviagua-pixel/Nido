# 010 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (`dictamen-diseno.md`, vuelta 1: NO APTO; `dictamen-diseno-2.md`, vuelta 2: APTO CON CONDICIONES, 0 bloqueantes; N-1 a N-8 pasan a las tareas) · 20/11/2026 · Estado: DISEÑADA, P1 aprobada el 20/11/2026

Fuentes: `especificacion.md` (APROBADA 20/11/2026), `aclaraciones.md`, `propuestas.md`, `verificaciones.md`, `dictamen-diseno.md`, `docs/MODELO-DATOS.sql` (§1 a §10), ADR-0003, ADR-0005, `docs/SEGURIDAD.md`.

## Resumen

Diez migraciones SQL a mano, cada una con su vuelta atrás; las tablas nacen con RLS y sin permisos, y los permisos llegan al final. Base: `docs/MODELO-DATOS.sql` con D-2. Aislamiento: políticas por orden, permisos por columna, permisos por defecto cerrados, disparadores de autoría, inmutabilidad y huella, `conector` sin permisos sobre tablas y `search_path = pg_catalog, pg_temp` en `privado`. Prueba: matriz D-6, 1.318 aserciones pgTAP y 33 comprobaciones de CI. Solo en `Nido` (D-020); producción, en simulación.

## Piezas y responsabilidades

Rutas de `docs/ESQUELETO.md`; todo es nuevo salvo «cambia». Agente `ingeniero-bd`, salvo donde se indica.

| Ruta | Qué hace |
| --- | --- |
| `supabase/migrations/2026112000NN00_<nombre>.sql` y `supabase/reversiones/<mismo nombre>.sql` (10 + 10) | Estructura y vuelta atrás (D-1). Marca de tiempo como pide la CLI ([migration new](https://supabase.com/docs/reference/cli/supabase-migration-new)); T-001 lo confirma |
| `supabase/seed.sql`, `supabase/datos/volumen.sql` | D-10. Nunca en producción |
| `supabase/config.toml` (cambia) | `[api] schemas = ["public"]`, `extra_search_path = ["public", "extensions"]` (CA-028); `[db.seed] enabled = false` (D-10) |
| `supabase/tests/0N_<tema>.test.sql` (9), `declaradas.json`, `ayudas/perfiles.psql`, `ayudas/sombras.psql` | pgTAP, número declarado (CA-023) y ayudas: `como(perfil)` con `set local`, identificadores del seed, huella de una tabla; sombras en `pg_temp` generadas del catálogo (N-3). Si `pg_prove` no admite `\ir`, se repiten en cada archivo |
| `supabase/tests/pglite/` | Arnés local con el preámbulo y los casos de `scripts/probar-modelo.mjs` |
| `scripts/bd/ciclo-migraciones.mjs`, `instantanea-catalogo.sql`, `concurrencia-licencia.sh`, `casos/` | CI: ciclo por migración y catálogo ordenado de `public` y `privado` (CA-024, CA-025, CA-031), con una migración que falla en `casos/`; dos sesiones `psql` (CA-021) |
| `scripts/bd/aplicar-produccion.mjs`, `revertir.mjs`, `entornos.mjs`; `supabase/aprobaciones-produccion.md` | Producción con simulación (CA-026, CA-032), entorno derivado del destino (D-1); aprobaciones (fecha, commit, migración, responsable) |
| `supabase/procedimientos/administradores.sql`; `docs/operacion/administradores.md`, `rol-conector.md`, `migraciones.md` | Administradores fuera de la API (REQ-060); guías del rol `conector` (D-9) y de migraciones y reversiones (D-1, N-8) |
| `tests/unit/bd/*.test.ts`; `tests/unit/plataforma/bd-flujo.test.ts` | L 1 a 14 («Pruebas»); orden y fallos de `bd.yml` (REQ-051) |
| `.github/workflows/bd.yml`; `package.json` y `package-lock.json` (cambian: `aislamiento`, P1-b) | CI y orden local sobre el arnés. Agente `plataforma`. **Cambio de CI: aprobación humana** (artículo 14) |

## Contratos

Sin cambios. `contratos/informe.schema.json` manda sobre `informes` (D-2, 5 y 7). CA-017: L 2 compara el contrato con la transcripción de `07_informes.test.sql`, y pgTAP la compara con el catálogo. Las funciones del conector conservan la forma de §5.

## Datos

### D-1 · Migraciones: orden, contenido y vuelta atrás

Cada archivo empieza con la guarda `do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;` (L 11); el resto va en un único bloque `do` que repite la guarda como primera instrucción, lee la ruta previa, fija `set_config('search_path', 'pg_catalog, pg_temp', true)` y la restaura como última instrucción (L 13). Forma (L 14): tras la guarda, solo bloques `do` con comillas de dólar que empiezan por ella; tipos de `declare` como `pg_catalog.<tipo>`, sin inicializadores; sin `begin; … commit;` ni `on commit drop` (propuesta 34, D-036, 20/11/2026; `evidencias/T-001/comprobaciones-cli.md`). Un bloque es una sentencia: aun en autocommit o con `psql` sin `ON_ERROR_STOP`, falla entero o no cambia nada (REQ-030). Sin sentencias que no admitan transacción.

| N.º | Nombre | Crea | Reversión |
| --- | --- | --- | --- |
| M01 | `privado_rol_y_permisos` | `privado` (`revoke all … from public`); `conector` (D-9); `privado.permisos_por_defecto_previos` (RLS, `revoke all`) con la copia de `pg_default_acl` de `postgres`; cierre (D-4) | Falla si queda otro objeto en `public` o `privado`; si no, restaura los permisos por defecto y borra tabla, rol y esquema, sin `cascade` |
| M02 | `clientes_y_acceso` | Tipos de §2; `clientes`, `administradores`, `usuarios_cliente`, `licencias`, `codigos_activacion`, `conexiones`, `reglas_cliente`, `ordenes`, `ajustes_globales`, `catalogo_problemas`, `suscripciones`, con RLS y `revoke all`, sin políticas ni permisos | Borra tablas y tipos |
| M03 | `internas_autorizacion_y_cobro` | `clientes_oauth`, `codigos_autorizacion`, `tokens`, `eventos_stripe`, igual (REQ-008) | Borra las tablas |
| M04 | `auditoria` · **PROTEGIDA** | `auditoria`; `privado.impedir_cambios()`, `privado.registrar_auditoria()`, `privado.auditar()` (D-3); inmutabilidad (`enable always`) y auditoría de las tablas de M02 | Solo en CI, ni en `Nido`: guarda SQL que exige `current_setting('app.reversion_protegida', true) = 'ci'`, que solo fija `ciclo-migraciones.mjs`. Variable de sesión: guarda contra accidentes, no contra quien actúa a propósito con `postgres` (N-8; P1-h) |
| M05 | `versiones_prompt` · **PROTEGIDA** | `versiones_prompt` (D-8) y `publicaciones`, con inmutabilidad (`enable always`) y auditoría | Igual que M04 |
| M06 | `ejecuciones_informes_alertas` | `ejecuciones`, `informes`, `alertas`, integridad (D-2, 5 y 6), índices, auditoría de `alertas` | Borra disparadores, funciones y tablas |
| M07 | `reglas_de_acceso` | `privado.es_admin()`, `privado.clientes_del_usuario()`, valores fijados y baja (D-3), políticas y permisos (D-5) | Quita lo creado |
| M08 | `funciones_conector` | `privado.licencia_vigente()`, `privado.resolver_token()` y las tres `privado.mcp_*` (§5; D-2, 10); `execute` solo a `conector` | Quita lo creado |
| M09 | `vistas` | `resumen_cliente` y `metricas_version` (§9), `security_invoker = true` (D-2, 1) | Borra las vistas |
| M10 | `datos_de_referencia` | Fila de `ajustes_globales` y catálogo de §10 | Borra esas filas como dueño, sin auditoría (D-3) |

**REQ-053, REQ-054, CA-031 y CA-032**

- Las protegidas (M04, M05) son una constante de `revertir.mjs` (L 8 la compara con los archivos que crean `public.auditoria` o `public.versiones_prompt`).
- `revertir.mjs` y `aplicar-produccion.mjs` derivan el entorno de la referencia del proyecto en la cadena de conexión, con la lista cerrada de `entornos.mjs` (CI, `Nido` y, cuando exista, producción), nunca de un argumento; desconocida, se niegan (L 15).
- En producción, una protegida no se revierte nunca (CA-032); las demás exigen una fila de `aprobaciones-produccion.md` con el commit actual (CA-026).
- Las reversiones de M06 en adelante y las futuras no contienen `drop`, `delete`, `truncate`, `update` ni `alter` sobre `auditoria` o `versiones_prompt`, ni `cascade` sobre `privado.impedir_cambios`, `privado.auditar`, `privado.registrar_auditoria` o el esquema `privado`, ni `execute` (L 10). En CI, con filas en las dos tablas, `ciclo-migraciones.mjs` aplica, revierte y reaplica cada migración posterior y compara la huella de ambas (CA-031).

### D-2 · Cambios exactos al modelo de referencia

De `propuestas.md`, 1 a 7:

1. Vistas: `revoke all … from public, anon, authenticated, service_role, conector;` y después `grant select … to authenticated`.
2. D-4. 3. D-3 (`ordenes` deja de auditar al conector, REQ-061).
4. Autoría (`creado_por`, `creada_por`, `publicada_por`, `resuelta_por`): fuera de los permisos por columna (escribirla da error); un disparador `BEFORE` la fija a `(select auth.uid())`; ningún rol la cambia después.
5. `informes.problemas`: `check (array_position(problemas, null) is null and array_to_string(problemas, ',') ~ '^([a-z_]{3,40}(,[a-z_]{3,40}){0,4})?$')`, y `privado.validar_informe()` (`BEFORE INSERT OR UPDATE`): cada código existe en el catálogo y no se repite; si no, `23514`, que `mcp_enviar_informe` ya captura.
6. `ejecuciones` gana `unique (id, cliente_id)` e `informes`, la clave ajena `(ejecucion_id, cliente_id) references ejecuciones (id, cliente_id)`. `privado.validar_ejecucion()` (`BEFORE INSERT OR UPDATE`, `security definer`) exige el cliente de la licencia de su conexión. `privado.impedir_cambio_de_pertenencia()` impide a cualquier rol cambiar `licencias.cliente_id`, `conexiones.licencia_id`, `ejecuciones.conexion_id` y `ejecuciones.cliente_id`.
7. `char_length(…) <= 12` en `informes.version_prompt` y en `versiones_prompt.version`.

De la especificación o de este diseño:

8. D-8 (REQ-055).
9. Sin políticas `administradores_propio` ni `usuarios_cliente_propio` (REQ-057, CA-035); `authenticated` sin `insert` ni `delete` en `administradores` (REQ-063).
10. Baja (REQ-064): `clientes_del_usuario()` solo devuelve clientes `activo`, y `resolver_token()` exige `clientes.estado = 'activo'`: las tres funciones responden `{"autorizado": false}` sin abrir ejecución.
11. Baja como marca (REQ-059, REQ-062): nadie de la API ni `service_role` borra en `clientes`, `licencias`, `conexiones`, `ejecuciones`, `informes` ni `alertas`. De `baja` a `activo` se rechaza en la fase 2 (P1-c).
12. Una política por operación permitida, no `for all` (§7). 13. Permisos por columna (D-5).
14. Índices (REQ-032): `licencias_por_cliente (cliente_id)`, `alertas_por_cliente (cliente_id, abierta_en desc)`, `ejecuciones_por_conexion (conexion_id)`.
15. Formatos ★ de D-7. 16. `conector` sin `if not exists`: si ya existe, M01 falla.
17. Valores fijados por disparador: `actualizado_en` de `reglas_cliente` y `ajustes_globales`; `ordenes.anulada_en` (`authenticated` solo pasa de `pendiente` o `entregada` a `anulada`); `conexiones.revocada_en`, `alertas.resuelta_en` y `resuelta_por`, solo de nulo a `now()` y a la sesión; `revocada_en` nunca vuelve atrás, con ningún rol.
18. `privado.registrar_auditoria()`, punto único de escritura en la auditoría, también para la 014 (REQ-061).

### D-3 · Auditoría, autoría y baja

**Regla para toda función de `privado` y toda `security definer` o de disparador de dueño `postgres` fuera de la plataforma** (B-1, N-1):

- `set search_path = pg_catalog, pg_temp`: con `''`, `pg_temp` iría primero para tipos y relaciones, y un dominio `pg_temp.uuid` del conector (`temporary` por `PUBLIC`, D-9) correría su `check` como dueño. Referencias fuera de `pg_catalog`, calificadas (`public.`, `privado.`, `auth.`).
- Esquemas de la plataforma (lista cerrada, N-1): `pg_catalog`, `information_schema`, `pg_toast*`, `pg_temp*`, `auth`, `storage`, `realtime`, `_realtime`, `extensions`, `graphql`, `graphql_public`, `vault`, `pgsodium`, `pgsodium_masks`, `pgbouncer`, `net`, `cron`, `supabase_functions`, `supabase_migrations`. La primera ejecución de T-013 la confirma y el `auditor-seguridad` la acepta (T-011); un esquema no listado cae en la regla.
- Errores: los `raise` propios (`validar_*`, `impedir_*`, `al_dar_de_baja`) llevan solo el código (A-15); los del motor (`DETAIL: Failing row contains …`) llevan valores de la fila a quien escribe y al registro (N-6, riesgo declarado): las `mcp_*` los capturan y devuelven solo un código; T-014 anota qué registra `Nido`.
- Pruebas: 01 (toda la base), 04, L 12 y 13. Enmienda de `.claude/rules/bd.md`, ADR-0003 y los documentos de N-1: de una persona (propuesta 29, P1-f).

**`privado.registrar_auditoria(p_accion text, p_objeto_tipo text, p_objeto_id text, p_cliente uuid)`**: `security definer`, sin `execute` para nadie; solo la llaman funciones y disparadores del dueño. El actor es siempre `(select auth.uid())`.

**`privado.auditar()`** (`AFTER`, por fila): `accion` (`insert`, `update`, `delete`); `objeto_tipo` (la tabla); `objeto_id` (`id`, o `codigo` en `catalogo_problemas`, `usuario_id` en `administradores` y `usuarios_cliente`, `cliente_id` en `reglas_cliente`, `global` en `ajustes_globales`); `cliente_id` (`id` en `clientes`, la columna donde existe, el cliente de la licencia en `codigos_activacion` y `conexiones`; si no, nulo). No lee ningún otro valor (REQ-018).

| Clase | Condición | Tablas y operaciones |
| --- | --- | --- |
| Cualquier rol salvo el dueño (REQ-017) | `WHEN (current_user <> 'postgres')`: `authenticated` y cualquier escritor futuro (`service_role`, fases 4 a 6). No ve a las `security definer` (regla N-2, abajo); sin auditoría, las `mcp_*` (REQ-061, CA-038), el seed y M10 | `clientes` (I, U), `usuarios_cliente` (I, D), `licencias` (I, U), `codigos_activacion` (I), `conexiones` (U), `publicaciones` (I), `reglas_cliente` (I, U), `ordenes` (I, U), `ajustes_globales` (U), `catalogo_problemas` (I, U), `alertas` (U) |
| Siempre (REQ-060, REQ-061) | Ninguna | `administradores` (I, U, D), `versiones_prompt` (I) |

`current_user`, no `auth.uid()` (Alternativas). **Regla N-2 (opción a)**: toda `security definer` que escriba en una tabla auditada llama a `privado.registrar_auditoria()`, salvo las tres `mcp_*` y `al_dar_de_baja` (abajo); 01 lleva su lista cerrada (escribe, llama) y una fuera de ella falla; 06 lo prueba. Todo permiso de escritura nuevo trae su disparador de auditoría (01).

**Inmutabilidad.** Los disparadores de solo inserción (`BEFORE UPDATE OR DELETE`, por fila) y sin vaciado (`BEFORE TRUNCATE`) de `auditoria`, `versiones_prompt` y `publicaciones` llevan `enable always trigger`, para correr también con `session_replication_role = replica` (01: `tgenabled = 'A'`; 05). Residual (P1-h): `postgres` y `supabase_admin` pueden con DDL quitar disparadores y tablas, y en modo réplica, que no se registra por defecto, saltar auditoría, claves ajenas y demás disparadores; son credenciales de personas, vigiladas con `log_statement = 'ddl'` (T-014) y la 014.

**Baja de cliente.** `privado.al_dar_de_baja()` (`AFTER UPDATE OF estado ON clientes`, `WHEN (old.estado = 'activo' and new.estado = 'baja')`, `security definer`) revoca en la misma sentencia las conexiones no revocadas de sus licencias y escribe una fila `revocar_por_baja` por conexión con `registrar_auditoria`; la del cliente la escribe `auditar()`. Un error deshace la sentencia: el cliente no queda de baja (CA-036).

### D-4 · Cierre de permisos por defecto (REQ-011)

En M01, como `postgres` (`verificaciones.md`). Los permisos por defecto por esquema se suman a los globales, y lo concedido globalmente no se revoca por esquema ([ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html)):

1. Global: `alter default privileges for role postgres revoke all on tables, sequences, functions from public, anon, authenticated, service_role, conector;` (cubre esquemas futuros).
2. La misma con `in schema` para `public`, `privado` y cada esquema con fila de `postgres` en `pg_default_acl` al aplicar M01 (bucle con `format('%I')`). Solo a esos cinco destinatarios: los de otros roles, como los de la 001 en `conector_prueba`, no se tocan.
3. En cada migración, `revoke all` explícito sobre cada objeto antes de sus `grant`.
4. 01: 0 filas de `pg_default_acl` de `postgres` que concedan algo a esos cinco, en cualquier esquema; todos los objetos de `public` y `privado` son de `postgres` (los de `supabase_admin` no se pueden cerrar).
5. CA-008 (04), en una transacción de prueba: función en `privado`; tabla, vista y función (invocable por `rpc`) en `public`; tabla y función en un esquema nuevo. 0 permisos para `anon`, `authenticated`, `conector` y `service_role`.

Solo `public` está expuesto por la API (`config.toml`; en `Nido`, CA-028). `usage` en `privado`: solo `authenticated` (funciones de apoyo) y `conector`.

### D-5 · Permisos (después de `revoke all`)

`anon` y `PUBLIC`: ninguno sobre objetos nuestros. `conector`: D-9. Tablas internas: nadie de la API (REQ-008). 01 compara con esta tabla la instantánea de `authenticated` y `service_role` (objeto, columna, privilegio): ninguno tiene `TRUNCATE`, `REFERENCES`, `TRIGGER` ni `MAINTAIN`.

| Tabla | `authenticated` (la política limita las filas) | `service_role` |
| --- | --- | --- |
| `clientes` | S; I (`nombre`, `canal`, `frecuencia_esperada_horas`); U (los mismos y `estado`) | — |
| `administradores` | S | — |
| `usuarios_cliente` | S; I (`usuario_id`, `cliente_id`); D | — |
| `licencias` | S; I (`cliente_id`, `estado_manual`, `caduca_en`); U (`estado`, `estado_manual`, `caduca_en`) | — |
| `codigos_activacion` | S (todas menos `codigo_hmac`); I (`licencia_id`, `codigo_hmac`, `caduca_en`) | — |
| `conexiones` | S; U (`revocada_en`) | — |
| `versiones_prompt` | S | S; I (`version`, `contenido`, `huella_sha256`, `commit_sha`, `notas`) |
| `publicaciones` | S; I (`canal`, `version_id`, `motivo`) | — |
| `reglas_cliente` | S; I (`cliente_id` y los 5 parámetros); U (los 5 parámetros) | — |
| `ordenes` | S; I (`cliente_id`, `tipo`); U (`estado`) | — |
| `ajustes_globales` | S; U (`pausa_global`, `stripe_en_observacion`) | — |
| `catalogo_problemas` | S; I (`codigo`, `descripcion`, `activo`); U (`descripcion`, `activo`) | — |
| `alertas` | S; U (`resuelta_en`) | — |
| `ejecuciones`, `informes`, `suscripciones`, `auditoria`, vistas | S | — |

Políticas: superadmin, `(select privado.es_admin())`, una por operación concedida; usuario de cliente, `id in (select privado.clientes_del_usuario())` en `clientes`, `cliente_id in (…)` en `licencias`, `ordenes`, `ejecuciones`, `informes` y `suscripciones`, y `exists (select 1 from privado.clientes_del_usuario())` en `catalogo_problemas`. `es_admin()` queda como en §4; las funciones de apoyo solo devuelven datos del propio usuario (REQ-010). Las fases 3 a 6 añaden sus permisos con su migración y sus pruebas (REQ-056).

### D-6 · Matriz de acceso esperada (CA-005)

Perfiles de `especificacion.md`: SS (`anon`), UA, UB, UAB, USV (sin vínculo), AD1 (superadmin sin doble factor, no vinculado), AD2 (con doble factor), CON (`conector`), SR (`service_role`). Letras: leer, insertar, modificar, borrar. `X`: error (`42501`), 0 filas cambiadas. `0`: sin error, 0 filas. `P`: exactamente las de sus clientes activos, 0 de C. `T`: todas. `C`: con las condiciones de D-2 y D-5 (negativos en 02). La prueba lee esta tabla (L 1); lo agrupado tiene las mismas letras. **SS y CON: `XXXX` en los 23 objetos. SR: `XXXX` salvo `versiones_prompt`, `TCXX`.**

| Objetos | UA, UB, UAB | USV, AD1 | AD2 |
| --- | --- | --- | --- |
| clientes, licencias, ordenes | PX0X | 0X0X | TCCX |
| reglas_cliente | 0X0X | 0X0X | TCCX |
| catalogo_problemas | TX0X | 0X0X | TCCX |
| conexiones, ajustes_globales, alertas | 0X0X | 0X0X | TXCX |
| usuarios_cliente | 0XX0 | 0XX0 | TCXT |
| codigos_activacion | 0XXX | 0XXX | CCXX |
| publicaciones | 0XXX | 0XXX | TCXX |
| administradores, versiones_prompt, auditoria | 0XXX | 0XXX | TXXX |
| ejecuciones, informes, suscripciones, resumen_cliente, metricas_version | PXXX | 0XXX | TXXX |
| clientes_oauth, codigos_autorizacion, tokens, eventos_stripe | XXXX | XXXX | XXXX |

`T` en `catalogo_problemas` para el usuario de cliente: todo el catálogo mientras tenga un cliente activo. `P` en `metricas_version`: agrega solo sus informes. AD1 vinculado a A (REQ-039): 03; cliente de baja: 08.

### D-7 · Lista cerrada de columnas de texto (REQ-023, CA-016)

Texto: `text`, `varchar`, `char`, `citext`, `json`, `jsonb` y sus listas. 26 columnas, agrupadas por formato. ★ = nuevo respecto al modelo.

| Columnas | Límite o formato | Justificación |
| --- | --- | --- |
| `codigos_activacion.codigo_hmac`, `codigos_autorizacion.codigo_hmac`, `tokens.token_hmac`, `versiones_prompt.huella_sha256` | `^[0-9a-f]{64}$`; la huella, ★ igual a la de `contenido` (D-8) | HMAC (A-05); REQ-055 |
| `clientes_oauth.client_id`, `codigos_autorizacion.redirect_uri`, `codigos_autorizacion.recurso`, `tokens.recurso` | ★ `^[!-~]{1,300}$` | Identificador OAuth, callback exacto, indicador de recurso |
| `clientes_oauth.redirect_uris` | 1–5 elementos, sin nulos; ★ cada uno `^[!-~]{1,300}$` | Callbacks (ADR-0002) |
| `codigos_autorizacion.code_challenge` | ★ `^[A-Za-z0-9_-]{43,128}$` | PKCE S256 (RFC 7636) |
| `versiones_prompt.version`, `informes.version_prompt` | `^[0-9]+\.[0-9]+(\.[0-9]+)?$`, ★ ≤ 12 | Versión; contrato |
| `catalogo_problemas.codigo`, `auditoria.accion`, `auditoria.objeto_tipo` | `^[a-z_]{3,40}$` | Código, acción, tabla |
| `informes.problemas` | ★ ≤ 5, sin nulos, cada uno `^[a-z_]{3,40}$`; del catálogo y sin repetir | Contrato, D-008 |
| `auditoria.objeto_id` | ★ `^[A-Za-z0-9_-]{1,64}$` | uuid, número, código o `global` |
| `suscripciones.stripe_customer_id`, `suscripciones.stripe_subscription_id`, `eventos_stripe.id` | ★ `^cus_`, `^sub_`, `^evt_` + `[A-Za-z0-9]{1,250}$` | Stripe |
| `eventos_stripe.tipo` | `^[a-z_.]{3,80}$` | Tipo de evento |
| `versiones_prompt.commit_sha` | `^[0-9a-f]{7,40}$` | Commit |
| `clientes.nombre` | 1–120 | Nombre comercial; dato personal si es autónomo (cuestión 13) |
| `catalogo_problemas.descripcion` | ★ 1–200 | Texto de HumanaIA, del superadmin |
| `versiones_prompt.contenido`, `versiones_prompt.notas` | 1–100.000; ≤ 500 | Del repositorio, por el despliegue; nunca datos de clientes |

`reglas_cliente` no tiene texto. Token o código (REQ-024, CA-019): las tres `*_hmac`; ninguna otra se llama `token`, `codigo`, `secreto` ni `clave`, salvo `catalogo_problemas.codigo`, que no es secreto. Toda columna de texto nueva entra aquí con su migración; la 024 y la 014 usan el formato de `accion`.

### D-8 · Huella = texto (REQ-055)

`check (huella_sha256 = encode(sha256(convert_to(contenido, 'UTF8')), 'hex'))`, con `sha256()` del núcleo. Rige para cualquier rol, también el dueño. No es columna generada, porque CA-033 exige rechazar la huella incorrecta. El despliegue (fase 4) calcula la huella sobre los mismos bytes UTF-8: un final de línea distinto se rechaza, no se corrige.

Riesgo residual (A-10, A-12): con la clave secreta se puede registrar antes que el despliegue una versión con número legítimo, texto cualquiera y su huella correcta. Servirla exige que un superadmin la publique, y el registro deja auditoría. Requisito para la fase 4 (propuesta 31, P1-i): el despliegue falla si la versión ya existe con otra huella, y el panel compara la huella con el manifiesto de la compilación antes de publicar.

### D-9 · Rol del conector (V-107)

M01: `create role conector nologin noinherit nobypassrls nocreatedb nocreaterole connection limit 10; alter role conector set statement_timeout = '5s';`. Concedido: `usage` en `privado` y `execute` en las tres `mcp_*`, que no leen `auth.*` (04): fijar `request.jwt.claims` no le sirve.

**Lista residual aceptada** (A-2): lo que la plataforma da a `PUBLIC` y no se puede quitar a un solo rol.

- R-1: `connect` y `temporary` en la base; `temporary` lo neutraliza D-3.
- R-2: `usage` en esquemas abiertos a `PUBLIC` por la plataforma (p. ej., `public`, `extensions`), sin permisos sobre sus tablas.
- R-3: `execute` de `PUBLIC` en funciones de esquemas de la plataforma (`auth`, `extensions`…); sin acceso a datos, porque el conector no tiene permisos sobre tablas. Una `security definer` de la plataforma solo entra con aceptación nominal del `auditor-seguridad`.
- R-4: funciones de `pg_catalog` de `PUBLIC`, incluidas las de objetos grandes (`lo_create`, `lo_open`…; no `lo_import` ni `lo_export` de servidor), limitadas por `connection limit` (`statement_timeout` es solo un valor por defecto: el conector lo anula y `set role` no lo aplica); supervisión: 0 filas de `pg_largeobject_metadata` con `lomowner = 'conector'::regrole` (N-5, T-014).
- Fuera: `net` (`pg_net`), sin uso. Si el conector tiene `usage` en `net`, 04 falla y decide el responsable (P1-h).

Prueba (04): los privilegios efectivos de `conector` (`has_*_privilege`) sobre esquemas, tablas, vistas, secuencias y funciones de todo esquema salvo `pg_catalog`, `information_schema`, `pg_toast*` y `pg_temp*` son exactamente las tres `mcp_*`, `usage` en `privado` y R-2 y R-3 escritos literalmente. T-011 fija la enumeración con la primera ejecución en CI y la acepta el `auditor-seguridad`; un cambio de la plataforma la hace fallar. CA-009 se lee con esta lista: «cada otra función» son las de `public` y `privado` (propuesta 30, P1-g).

**Procedimiento de una persona** (`docs/operacion/rol-conector.md`): `alter role conector login;` y la contraseña con `\password conector` de `psql` (huella SCRAM calculada en el cliente), dentro de `begin; … commit;` con los `set local` de la [guía de Supabase](https://supabase.com/kb/troubleshooting/provisioning-credentials-without-log-exposure) (`log_statement`, `log_min_error_statement`, `log_min_messages`, `pg_stat_statements.track`, `pgaudit.log`). Nunca `alter role … password` ni el editor SQL del panel, que guarda historial. La tarea 14 VERIFICA `\password` dentro de la transacción. En Vercel: usuario `conector.<referencia>`, agrupador compartido, puerto 6543. Rotación, por el mismo camino.

La contraseña nunca está en el repositorio, las migraciones ni las pruebas (REQ-012, REQ-025); en CI, `set role conector`. Revertir M01 borra el rol; al reaplicar queda sin inicio de sesión: fallo seguro.

### D-10 · Datos ficticios y volumen

`supabase/seed.sql`:

- Guarda: falla salvo que `current_setting('app.entorno', true) in ('ci', 'desarrollo')`; sin la variable, falla. La fija cada base de desarrollo con `alter database postgres set app.entorno = …` (CI en su base; una persona, una vez, en `Nido`); producción nunca. Por eso `config.toml` desactiva la carga automática y el seed va con `psql` (nunca `--include-seed` en producción, CA-003). T-001 VERIFICA `[db.seed] enabled` y que `postgres` puede fijar el parámetro. Protege de accidentes, no de quien actúa a propósito con `postgres`, que puede fijarla (N-8).
- «Cliente A ficticio», «Cliente B ficticio» y «Cliente C ficticio»; en `auth.users`, con correos `@example.com`, UA, UB, UAB, USV, AD1, AD2, AD1A (sin doble factor, vinculado a A, REQ-039) y AD3 (CA-037), sin contraseña (`encrypted_password` nulo) ni `auth.identities`.
- Filas de A, B y C en cada tabla con cliente y filas en las demás (HMAC `a`, `b` o `c` × 64; huella calculada en SQL; `cus_ficticioA`…), con identificadores fijos.

`supabase/datos/volumen.sql`: la misma guarda; con `generate_series`, 10 clientes con licencia, conexión y 365 ejecuciones e informes diarios. Sin datos reales ni secretos.

## Flujo

1. **Local**: `npm run aislamiento` aplica, revierte y reaplica en PGlite (SQL válido, no criterios) y, si `pglite-pgtap` pasa su VERIFICAR (P1-b), pgTAP.
2. **CI** (`bd.yml`): `npx supabase start`; `app.entorno = 'ci'` y seed con `psql`; `npx supabase test db`, `ciclo-migraciones.mjs`, `concurrencia-licencia.sh`, el procedimiento de administradores y el escáner de secretos; número comparado con `declaradas.json`. Base que no arranca, prueba que falta o número distinto: falla (REQ-051). La protección de rama, una persona (CA-022).
3. **`Nido`**: una persona, con `npx supabase db push` (T-012), tras P1, CI en verde y el «sí» del responsable (D-025); después `app.entorno = 'desarrollo'`, seed y volumen con `psql`, y CA-027. No se toca `conector_prueba` de la 001.
4. **Producción**: no existe en la fase 2; `--simulacion` sin aprobación no aplica nada (CA-026).
5. **Fallos**: una migración fallida deja la base como estaba (CA-025); en desarrollo se revierte con `revertir.mjs` (M04 y M05, solo en CI); en producción, M04 y M05 se corrigen con una migración nueva (REQ-053).

## Pruebas

Sin Docker aquí, pgTAP y lo que depende de Supabase solo se dan por superados en CI (REQ-028); lo demás, «no ejecutada en CI» (CA-023). De la 002 (R-1): su T-007 pasa a las migraciones y al arnés; su T-008, a 01 a 09; `npm run aislamiento`, al arnés (una línea de `package.json`, con la fase 1).

**Número declarado (CA-023): 1.318 aserciones pgTAP + 33 comprobaciones de CI = 1.351** (`declaradas.json`), más 14 pruebas locales sin base de datos. Es la base: lo que añaden N-1 a N-4 y N-7 (T-008, T-011) va a `declaradas.json` con su origen, y el `arquitecto` actualiza este número y la tabla antes de T-015, que compara con el actualizado.

| Archivo | Criterios | Aserciones |
| --- | --- | --- |
| `01_estructura` | CA-004, CA-016, CA-019, CA-021 (en serie), CA-027 (índices), CA-034, REQ-011 | 23: RLS en todas; las 21 tablas; texto solo de D-7, con su restricción (3); 3 HMAC sin formato rechazados; `*_hmac`; segunda fila de ajustes, segundo informe, segunda licencia vigente (3); índices de política; dueños `postgres`; vistas `security_invoker`; `search_path = pg_catalog, pg_temp` en todo `privado`; inmutabilidad con `tgenabled = 'A'`; `privado` sin `usage` para `anon`; instantáneas de `authenticated` y `service_role` = D-5 (2); `pg_default_acl` cerrado; tablas de `privado` con RLS y sin permisos; cada permiso de escritura con su disparador de auditoría |
| `02_matriz_acceso` | CA-005, CA-035 | 844 = 23 × 9 perfiles × 4 + 1 (REQ-057) + 15 negativos de «C»: `licencias.cliente_id` (AD2 y dueño); `conexiones.licencia_id`, `ejecuciones.conexion_id`, `ejecuciones.cliente_id` (dueño); `codigos_activacion.usado_en` en el alta; `catalogo_problemas.codigo` y `reglas_cliente.cliente_id` en el cambio; `ordenes` a `confirmada` y de `anulada` a `pendiente`; `revocada_en` a nulo (AD2 y dueño); `resuelta_en` a nulo; `actualizado_en` explícito; cliente nuevo de `baja` |
| `03_acceso_cruzado` | CA-006, CA-029, CA-030, REQ-039 | 91 = 3 × 23 lecturas ajenas + 12 escrituras + 1 (auditoría) + 1 (resumen) + 2 (CA-029) + 5 (CA-030: sin `aal`, numérico, mayúsculas, usuario borrado, sesión no JSON) + 1 (AD1A) |
| `04_funciones` | CA-007 a CA-011, CA-038 | 75 = 27 (catálogos, 8 perfiles × 3 funciones, efectos) + 6 (CA-008, D-4) + 26 (CA-009: 23 objetos, otras funciones, catálogo con la lista residual, `net`) + 2 (sin parámetros de cliente; sin `auth.*`) + 4 (CA-011) + 3 (sin auditoría) + 7 (B-1: como `conector`, dominios `uuid`, `jsonb`, `text` y `timestamptz` en `pg_temp` cuyo `check` marca una tabla; precondición; 3 funciones × token falso y válido: 0 marcas) |
| `05_inmutables` | CA-012, CA-033, CA-038 | 103 = 9 roles × 3 tablas (con `publicaciones`) × 3 operaciones + 2 huellas + 9 como dueño + 2 en modo réplica (rechazo del `update` o, si la plataforma no deja fijar el modo, del `set`) + 8 (CA-033) + 1 |
| `06_auditoria` | CA-013 a CA-015 | 34 = 17 operaciones + 9 inserciones directas + 2 (CA-014) + 4 (CA-015) + 2 (rol creado en la transacción: 1 fila; como `postgres`: 0) |
| `07_informes` | CA-017, CA-018 | 29 = 7 casos × 2 roles + 1 + 14 (contrato) |
| `08_baja` | CA-036, CA-039 | 91 = 5 + 1 (vuelta a `activo`) + 9 × 6 borrados + 31 (CA-039) |
| `09_administradores` | CA-037 (API) | 28 = 9 × 3 + 1 |
| `ciclo-migraciones.mjs` | CA-004, CA-024, CA-025, CA-031, REQ-053 | 30 = 10 × 2 (catálogo; RLS) + 2 (migración fallida) + 5 (huella de las protegidas) + 1 (M01 se niega con objetos) + 2 (M04 y M05 sin la marca de CI) |
| `concurrencia-licencia.sh`; procedimiento de administradores | CA-021; CA-037 | 1; 2 |

Locales (`tests/unit/bd/`): L 1 matriz D-6 = 02; L 2 contrato = transcripción de 07; L 3 `config.toml` solo con `public`; L 4 y 5 CA-026 sin aprobación y con la de otro commit; L 6 y 7 CA-032 en M04 y M05; L 8 lista de protegidas; L 9 seed y guarda de `seed.sql` y `volumen.sql` (D-10); L 10 reversiones sin los patrones prohibidos; L 11 guarda de rol primero y al principio de cada `do`, con `operator(pg_catalog.<>)`; L 12 `raise` con literal, sin `%` ni concatenación; L 13 ruta leída, fijada y restaurada en cada `do`, y `search_path` en todo `privado`; L 14 forma de las sentencias (D-1); L 15 entorno derivado del destino, desconocido se niega.

**CA-020**: escáner de secretos (`node scripts/comprobar-specs.mjs`, paso de `bd.yml`) con 0 hallazgos, más dictamen del `auditor-seguridad` en T-015. **Fuera de CI, evidencia de una persona**: CA-001, CA-022, CA-027 (credencial en su entorno; el script no la guarda), CA-028, V-107 real; en `Nido`, `pg_default_acl`, `pg_net`, `log_statement` y `session_replication_role`; `\password`.

## Amenazas de esta función

| Amenaza | Control | Prueba |
| --- | --- | --- |
| A-07: un cliente lee datos de otro | RLS por orden; vistas `security_invoker` | 02, 03 |
| A-08: el conector cruza clientes | Cliente del token, sin parámetro; ejecución de la misma conexión | 04 |
| A-08, A-09: credencial del conector filtrada; tipos suplantados en `pg_temp` | `search_path` y referencias calificadas (D-3) | 01, 04, L 13 |
| A-09: llamada directa a funciones del conector | `privado` no expuesto; `execute` solo a `conector`; D-4 | 04 |
| El conector usa lo heredado de `PUBLIC` | Lista residual cerrada, sin `net` (D-9) | 04 |
| A-11: superadmin sin doble factor | `aal2` y tabla en `es_admin()`; alta fuera de la API. La sesión robada no se cubre aquí: va a la 021 (propuesta 22) | 02, 03, 09 |
| A-05: fuga de la tabla de tokens | Solo HMAC; sin lectura por la API | 01, 02 |
| A-14: texto libre por el informe | D-7; catálogo en `problemas` | 01, 07 |
| A-10: clave secreta filtrada; prompt con huella ajena | Solo registra versiones, con huella válida (D-8); publicar exige superadmin. Versión adelantada: fase 4 | 02, 05 |
| Permisos por defecto en objetos nuevos de cualquier esquema | D-4; guarda de rol; dueños | 01, 04 |
| Permisos de más; transiciones «C»; autoría falsificada | Instantánea = D-5; columnas y disparadores | 01, 02, 06 |
| Escritor nuevo sin auditar; `request.jwt.claims` fijado en conexión directa | `current_user <> 'postgres'`; escritura ⇒ disparador | 01, 06 |
| Cliente incoherente entre informe, ejecución y conexión | Clave ajena compuesta; pertenencia | 07 |
| Reescritura de auditoría, versiones o publicaciones, también en modo réplica | Inmutabilidad `enable always` | 01, 05 |
| `postgres` o `supabase_admin` por DDL o réplica | Personas; `log_statement = 'ddl'`; 014. Residual (P1-h) | Tarea 14 |
| Cliente de baja que sigue con acceso | Solo clientes activos (D-2, 10) | 08 |
| Migración o reversión a medias | Transacción; guarda | `ciclo`, L 11 |
| Contraseña del conector en registros; valores de fila en errores (A-15) | `\password` sin registro (D-9); solo el código (D-3) | Tarea 14, L 12 |
| Seed fuera de desarrollo | Lista de permitidos; sin contraseñas | L 9 |
| Vuelta atrás de protegidas fuera de CI, o de M01 con datos | D-1 | L 6, 7, 10, 15; `ciclo` |

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Sin texto libre en informes ni reglas; D-7; auditoría sin valores |
| 2 Aislamiento | Cumple | Matriz con negativos; el cliente nunca es entrada; sin suplantación de tipos |
| 3 Cierre en fallo | Cumple, con riesgo residual | Permisos al final; `aal` raro deniega; baja sin acceso; D-4 global y por esquema; lista residual probada; seed y entorno cerrados. Residual: `postgres`, `supabase_admin` (P1-h) |
| 4 Secretos | Cumple | `\password` sin registro; `set role` en pruebas; HMAC ficticios; seed sin contraseñas |
| 5 Especificación | Cumple | Cada CA con prueba |
| 6 Revisión independiente | Cumple | `revisor` + `auditor-seguridad` por tarea; puertas de una persona |
| 7 Entradas no confiables | Cumple | Notas para agentes en la documentación, ignoradas |
| 8 Límites en el anfitrión | No aplica | — |
| 9 Prompt por despliegue | Cumple, con riesgo residual | Versiones y publicaciones inmutables, huella comprobada; versión adelantada (P1-i) |
| 10 Producto final | Cumple | Índices, rendimiento medido, operación |
| 11 Reversibilidad | Cumple | Reversiones probadas, en transacción; protegidas, hacia delante (cuestión 14) |
| 12 Español | Cumple | — |
| 13 Evidencias honestas | Cumple | Nada de pgTAP superado en local |
| 14 Cambios reservados | Cumple, con acción pendiente | CI, rama, contraseña, `app.entorno` y `Nido`, de una persona (P1-a); enmienda de `bd.md` y ADR-0003 (P1-f) |

## Dependencias nuevas

| Paquete | Para qué | Versión y fuente | Estado |
| --- | --- | --- | --- |
| `@electric-sql/pglite-pgtap` (desarrollo, opcional) | pgTAP en PGlite antes de CI | 0.0.18, Apache-2.0, exige `@electric-sql/pglite` 0.5.17 ([registro](https://registry.npmjs.org/@electric-sql/pglite-pgtap), 20/11/2026) | Aprobada en P1 (20/11/2026), sin esperar al 26/11 (D-034); VERIFICAR README y Node 26 antes de instalar. Sin ella, arnés en JavaScript |
| `supabase` (CLI) | `start`, `test db`, `db push` | Decidida (T-013) | Sin cambio |

`psql`: en el ejecutor de CI y en el equipo de quien haga T-014.

## Alternativas descartadas

Migración única (su vuelta atrás borraría auditoría y versiones, REQ-053); una por tabla (dependencias cruzadas); políticas `for all` (un permiso de más abriría filas); auditar si `auth.uid()` no es nulo (`request.jwt.claims` se fija en conexión directa); huella en columna generada (impide probar el rechazo de CA-033); `informes_problemas` normalizada (cambia el contrato sin más garantía); disparador en lugar de clave ajena compuesta (la clave es declarativa y visible); `session_id` en `es_admin()` (sin verificar; a la 021, propuesta 22); disparador de eventos que revoque permisos (privilegio sin verificar; D-4 basta); rol de acceso aparte del conector (más piezas); PGlite como evidencia (REQ-028, artículo 13); exponer `graphql_public` (no se usa); `search_path = ''` (`pg_temp` va primero para tipos y relaciones, B-1); `enable always` en todos los disparadores (correrían auditoría y validaciones al restaurar en modo réplica; solo la inmutabilidad lo necesita).

## Decisiones que requieren ADR

Solo en `propuestas.md` (el encargo limita la escritura a esta carpeta): n.º 21 (enmienda de ADR-0003), n.º 15 (migraciones hacia delante) y n.º 29 (ADR-0003, punto 6, y `.claude/rules/bd.md`; de una persona).

## Lo que queda para el plan

`plan.md` y `tareas.md` (T-001 a T-015), todas ruta crítica (D-029). Ninguna se cierra contra los criterios hasta T-013, que exige aprobar el CI (artículo 14; D-024).

## Dudas para el responsable (puerta P1)

- **P1-a.** Aprobar `bd.yml` y la protección de `main` (artículo 14); sin eso, casi ningún criterio se cierra.
- **P1-b.** `@electric-sql/pglite-pgtap` 0.0.18 desde el 26/11/2026, o no usarla.
- **P1-c.** Un cliente de baja no vuelve a `activo` en la fase 2. ¿Se acepta, o se reactiva sin restaurar conexiones?
- **P1-d.** `service_role` solo tiene permisos sobre `versiones_prompt`; la 014, la 021 y la 050 añaden los suyos.
- **P1-e.** La 021 da de alta administradores desde el panel; REQ-060 y REQ-063 lo prohíben (propuesta 22).
- **P1-f.** Enmendar `.claude/rules/bd.md` y el punto 6 de ADR-0003 a `search_path = pg_catalog, pg_temp` (propuesta 29); mientras, el diseño contradice esa regla a propósito.
- **P1-g.** ¿CA-009 y REQ-012 («ninguna otra función») se leen con la lista residual de D-9, o se enmienda su texto (propuesta 30)?
- **P1-h.** ¿Se acepta el riesgo residual de `postgres` y `supabase_admin` (DDL, réplica) con `log_statement = 'ddl'` y la 014? Si `pg_net` está activo en `Nido`, ¿se desactiva?
- **P1-i.** Versión adelantada con la clave secreta: requisito para la fase 4 (propuesta 31).

## Respuesta al dictamen (vuelta 1)

| Hallazgo | Dónde se corrigió |
| --- | --- |
| B-1 | D-3; Pruebas 01, 04 (+7), L 13; P1-f; propuesta 29 |
| A-1 | D-4; Pruebas 01, 04 |
| A-2 | D-9; Pruebas 04; P1-g, P1-h; propuesta 30 |
| M-1 | D-3 (Inmutabilidad); D-1; Pruebas 01, 05; P1-h |
| M-2 | D-3 (clase y regla); D-2, 3; Pruebas 01, 06 |
| M-3 | D-9; tarea 14 |
| M-4 | D-10; Piezas; Flujo; L 9 |
| M-5 | D-5; Pruebas 01, 02 (+15) |
| M-6 | D-1; Flujo 5; `ciclo` (+3); L 15 |
| M-7 | D-8; P1-i; propuesta 31 |
| L-1 a L-6 | Amenazas (A-11); D-1 (M01, patrones, M05); D-3 (`auditar()`, mensajes); Pruebas 01, 05; L 10 a 12 |
| Tamaño (D-023) | Compactado sin quitar controles |
| Vuelta 2: N-1, N-2 (a), N-5, N-6, N-8 | D-3; D-9 R-4; D-1; D-10; Piezas; Pruebas. N-3, N-4, N-7: `tareas.md`. Propuesta 34 (D-036): D-1, D-9 R-4 |
