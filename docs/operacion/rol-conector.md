# Rol `conector` de la base de datos

Estado: función 010 (T-006). Aquí solo hay **procedimientos y nombres**: ningún valor, ni de ejemplo. La contraseña la pone una persona; no está ni estará en el repositorio, en las migraciones, en las pruebas, en los registros ni en las evidencias (artículo 4; REQ-012, REQ-025).

Diseño de referencia: `specs/010-base-datos-rls/diseno.md`, D-9 (rol del conector) y D-3 (funciones `security definer`).

## Qué es y qué puede hacer

El rol `conector` es el que usa el conector MCP de Vercel para hablar con la base de datos. Lo crea la migración M01 y no se crea a mano.

- Atributos fijados por M01: `nologin`, `noinherit`, `nobypassrls`, `nocreatedb`, `nocreaterole`, `connection limit 10` y `statement_timeout = '5s'`. Nace **sin inicio de sesión**: mientras una persona no lo active (abajo) no entra nadie. Si M01 se revierte y se reaplica, vuelve a nacer sin inicio de sesión (fallo seguro).
- Permisos que le da M08, y solo estos:
  - `usage` en el esquema `privado`;
  - `execute` en las tres funciones `privado.mcp_obtener_instrucciones`, `privado.mcp_enviar_informe` y `privado.mcp_confirmar_orden`.
- Sin permisos sobre ninguna tabla ni vista, ni siquiera de lectura. Todo lo hace a través de esas tres funciones, que corren con el dueño de la base y derivan el cliente **dentro** de la base a partir del HMAC del token. Ninguna recibe un identificador de cliente ni de licencia, ni lee `auth.*`: fijar `request.jwt.claims` en la conexión no le sirve.
- `licencia_vigente()` y `resolver_token()` son internas: no las ejecuta ni el conector.
- Un cliente dado de baja recibe `{"autorizado": false}` de las tres, en cada llamada.
- Un fallo del motor (por ejemplo, una restricción violada al guardar un informe) no devuelve nunca el mensaje ni el `DETAIL`, que llevan valores de la fila: la función responde solo un código (`informe_invalido` o `error_interno`).

Lo que la plataforma da a `PUBLIC` y no se puede quitar a un solo rol queda como lista residual aceptada (D-9, R-1 a R-4); la comprueba la prueba pgTAP `04_funciones` en CI.

## Activar el inicio de sesión (una persona, una vez por entorno)

Solo en `Nido`, tras aplicar las migraciones y con aprobación del responsable (D-025). Nunca desde el editor SQL del panel, que guarda historial de lo que se escribe.

1. Abrir una sesión `psql` con un rol que pueda modificar roles, desde una terminal propia (no desde un script del repositorio).
2. Abrir una transacción y fijar, con `set local`, los parámetros que evitan que la contraseña llegue a los registros, según la guía de Supabase de aprovisionamiento de credenciales sin exposición en registros: `log_statement`, `log_min_error_statement`, `log_min_messages`, `pg_stat_statements.track` y `pgaudit.log` (valores que apaguen el registro de la sentencia).
3. Dentro de la misma transacción: `alter role conector login;` y después `\password conector`. El comando `\password` de `psql` calcula la huella SCRAM en el cliente: la contraseña en claro no viaja al servidor. Escribirla dos veces cuando `psql` la pida.
4. `commit;`.

Nunca se usa `alter role conector password '…'` con la contraseña escrita en la sentencia, porque quedaría en el historial y en los registros.

**Pendiente de verificar en T-014** (condición 4 del dictamen del diseño, M-3): que `\password` funciona dentro de `begin; … commit;` con los `set local`, y que en los registros de `Nido` hay 0 líneas con el verificador o con la palabra `password` del conector. Hasta entonces el procedimiento es el de la guía, sin comprobar en esta base.

## Conectar desde Vercel

- Usuario: `conector.<referencia del proyecto>` (el agrupador de Supabase exige ese formato).
- Agrupador compartido (Supavisor), puerto 6543, modo transacción, sin consultas preparadas.
- La cadena de conexión vive solo en las variables del entorno de Vercel (nombre en `docs/operacion/entornos.md`); nunca en el repositorio.
- Cada llamada del conector es una sola sentencia `select privado.mcp_…(…)` con el HMAC del token como parámetro. El conector no abre transacciones largas.

## Rotación y baja

- Rotación: por el mismo camino (transacción con los `set local`, `\password conector`, `commit`), y después se actualiza la variable de Vercel. Mientras no se actualice, el conector falla cerrado.
- Baja de emergencia: `alter role conector nologin;` y, si hace falta, `pg_terminate_backend` de sus sesiones. No hace falta tocar permisos: sin sesión no hay acceso.
- Revertir M08 retira `usage` en `privado` y `execute` en las tres funciones; revertir M01 borra el rol (solo si no queda ningún objeto suyo).

## Comprobaciones

| Qué | Dónde |
| --- | --- |
| El conector no lee ninguna tabla ni vista; las tres funciones responden | `supabase/tests/pglite/m08_m10.test.ts` (local, PGlite) y pgTAP `04_funciones` (CI, T-011) |
| `anon`, `authenticated` y `service_role` no ejecutan las tres funciones | ídem |
| Con el token de un cliente y el identificador de otro, la respuesta es igual que con uno inexistente | ídem |
| 0 filas en `pg_largeobject_metadata` con `lomowner = 'conector'::regrole` (N-5) | T-014, y como supervisión periódica |
| El conector sin `usage` en `net` (`pg_net`) | `04_funciones` y T-014 |

Las pruebas pgTAP no se han ejecutado todavía: corren en CI (T-013). Las de PGlite comprueban SQL válido y comportamiento, y no sustituyen a las de CI ni a lo observado en `Nido`.
