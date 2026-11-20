# 010 · Verificaciones previas al diseño

Fecha de consulta: 20/11/2026 · Autor: `arquitecto` · Skill `verificar-decision`

Solo documentación oficial de Supabase y el registro de npm. No se ha hecho ninguna prueba contra `Nido` ni contra otro proyecto: este agente no tiene credenciales ni debe tenerlas. Varias páginas de la documentación de Supabase incluían una nota dirigida a agentes que pedía enviar un informe de opinión. No se ha seguido (constitución, artículo 7). Se avisa al responsable.

## Resumen

| Decisión | Resultado | ¿Se puede diseñar? |
| --- | --- | --- |
| V-108 · doble factor (`aal2`) en las políticas | VIABLE según la documentación. Falta la prueba con una sesión real con TOTP (fase 3, función 021) | Sí |
| V-107 · rol propio del conector por el agrupador | VIABLE según la documentación, con restricciones. Falta la prueba real en `Nido` | Sí |
| REQ-011 · permisos por defecto en `public` | Confirmado que existen y cómo se cierran. Falta comprobar en `Nido` qué rol aplica las migraciones | Sí, con una guarda y una prueba |

Ninguna de las dos decisiones resulta inviable. Las dos siguen en VERIFICAR hasta que se hagan sus pruebas reales (propuesta 19).

## V-108 · Doble factor exigido en las políticas de RLS

**Pregunta.** ¿Una política puede exigir `aal2` leyendo `auth.jwt()->>'aal'`, en el plan gratuito y en el Pro? ¿Qué pasa si el dato falta, está mal formado o el usuario ya no existe?

**Fuentes**

- [Multi-Factor Authentication](https://supabase.com/docs/guides/auth/auth-mfa). Plantilla oficial de política: `using ((select auth.jwt()->>'aal') = 'aal2')`, con el texto «the policy will not accept any JWTs with an `aal` claim other than `aal2`». También: «JWTs without an `aal` claim are at the `aal1` level».
- [MFA (TOTP)](https://supabase.com/docs/guides/auth/auth-mfa/totp): «TOTP MFA API is free to use and is enabled on all Supabase projects by default». No distingue entre planes. El MFA por teléfono es un complemento de pago y no hace falta.
- [JWT fields](https://supabase.com/docs/guides/auth/jwt-fields): `aal` figura entre los datos obligatorios del token, con los valores `aal1` y `aal2`. `session_id` también es obligatorio.
- [Sessions](https://supabase.com/docs/guides/auth/sessions): al cerrar sesión se borra la fila de la sesión, pero el token de acceso no se invalida. La página propone comprobar el `session_id` contra la tabla de sesiones. La caducidad recomendada del token es de 1 hora como mucho.

**Conclusión: VIABLE.**

- Plan gratuito y Pro: TOTP está activo en todos los proyectos sin coste. No hace falta el gancho de datos personalizados del token, que V-108 mencionaba para el plan Pro, porque la autorización sale de tablas propias (T-005).
- **Sin el dato `aal`**: equivale a `aal1`. La función `privado.es_admin()` compara `coalesce(auth.jwt()->>'aal', '') = 'aal2'`, así que se deniega.
- **Dato mal formado** (número, mayúsculas, espacios): la igualdad estricta con `'aal2'` da falso y se deniega. Si los datos de la sesión no son JSON válido, `auth.jwt()` falla y la consulta entera falla, así que tampoco hay acceso.
- **Usuario borrado**: su token sigue siendo válido hasta que caduca, y `auth.uid()` todavía devuelve su identificador. El acceso no sale del token, sino de `administradores` y `usuarios_cliente`, y sus filas se borran en cascada con el usuario. La siguiente consulta da 0 filas (REQ-034, REQ-040).

**Sin comprobar**

- Que los tokens de `Nido` lleven `aal` = `aal2` tras un TOTP real. Lo comprueba la función 021 (fase 3), con una sesión real.
- Rechazar sesiones cerradas comprobando el `session_id` en `auth.sessions`. Haría falta leer el esquema `auth` desde una función `security definer`, y no está verificado que el rol `postgres` pueda hacerlo en la plataforma. Queda fuera de esta función: es propuesta 22, para la 021.

## V-107 · Rol propio del conector por el agrupador (Supavisor) desde Vercel

**Pregunta.** ¿El conector puede conectarse desde Vercel con un rol de Postgres propio, de mínimo privilegio, a través del agrupador? ¿Qué restricciones hay?

**Fuentes**

- [Postgres Roles](https://supabase.com/docs/guides/database/postgres/roles): `create role "role_name" with login password '…'`. Recomienda un usuario separado por servicio. Cambiar la contraseña no corta el servicio, pero los servicios externos con la credencial fija hay que actualizarlos a mano.
- [FATAL: Password authentication failed](https://supabase.com/kb/troubleshooting/fatal-password-authentication-failed): «Custom Postgres roles with LOGIN are supported. They work on direct connections, the dedicated pooler, and the shared pooler». «You do not register a role with the pooler as a separate step». El agrupador lee la credencial de Postgres cuando la necesita.
- [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) y [Tenant or user not found](https://supabase.com/docs/guides/troubleshooting/tenant-or-user-not-found): en el agrupador compartido el usuario es `[ROLE].[PROJECT-REF]`. El agrupador compartido solo funciona por IPv4, en todos los planes. En modo transacción (puerto 6543) no admite sentencias preparadas. En entornos sin servidor, recomienda un solo cliente por módulo y un grupo de 1 conexión. El agrupador dedicado es solo del plan Pro.
- [Supavisor: password authentication failed after rotation](https://supabase.com/docs/guides/troubleshooting/supavisor-error-password-authentication-failed-after-password-rotation): tras cambiar la contraseña, el agrupador guarda la anterior un rato (unos 15 s si hay conexiones activas). Para no cortar el servicio, recomienda crear un rol nuevo, mover el servicio a él y retirar el anterior. Los intentos fallidos repetidos activan un corte automático.
- [Supavisor EAUTHQUERY](https://supabase.com/docs/guides/troubleshooting/supavisor-connection-error-fatal-eauthquery-unsupported-or-invalid-secret-format-d23dd4) (resultado de búsqueda): un rol con `VALID UNTIL` vencido da ese error.

**Conclusión: VIABLE**, con estas restricciones que el diseño recoge:

1. La conexión va por el agrupador compartido, en modo transacción (6543), con el usuario `conector.<referencia>`. Vercel no tiene IPv6 garantizado y la conexión directa es solo por IPv6 sin el complemento de pago.
2. El cliente del conector desactiva las sentencias preparadas y no usa estado de sesión: ni `SET` ni tablas temporales. Las tres funciones no lo necesitan. Esto es de la función 011.
3. El rol se crea en la migración sin inicio de sesión. Una persona le da el inicio de sesión y la contraseña fuera del repositorio. La rotación cambia la contraseña y acepta unos segundos de reintentos, o bien crea un rol de acceso nuevo. Lo decide el procedimiento de la 014 o la 011. Nunca `VALID UNTIL`.
4. No hace falta el agrupador dedicado (Pro): `Nido` es gratuito.

**Sin comprobar**

- La conexión real desde Vercel o desde la máquina local con el rol `conector` contra `Nido`. Necesita que una persona fije una contraseña. La función 001 lo tiene previsto en su paso 2a (`specs/001-conector-prueba-real/diseno.md`, «Plan», fila 2a), con sus propios roles de prueba. Esta función repite la comprobación con el rol `conector` definitivo en una tarea de una persona (`plan.md`).
- Que en modo transacción se apliquen los ajustes por rol (`statement_timeout`) a cada conexión del agrupador. Se mide en esa misma prueba.

## Permisos por defecto en `public` (REQ-011)

**Pregunta.** ¿La API de datos (PostgREST) concede permisos por defecto a los objetos nuevos de `public`? ¿Cómo se cierra?

**Fuentes**

- [Securing your API](https://supabase.com/docs/guides/api/securing-your-api): «On existing projects, new objects in `public` receive the following default privileges»: en las tablas, `select`, `insert`, `update`, `delete`, `truncate`, `references`, `trigger` y `maintain`; en las funciones, `execute`; en las secuencias, `usage`, `select` y `update`. Los reciben `anon`, `authenticated` y `service_role`. «New functions are callable by every role. Postgres grants `execute` to `PUBLIC` through a global default». Supabase está cambiando el comportamiento por defecto de la plataforma para que la exposición sea opcional. Da este cierre oficial:
  - `alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role;`
  - lo mismo para `sequences` y para `functions`;
  - `alter default privileges for role postgres revoke execute on functions from public;`
- [Discusión oficial #45329](https://github.com/orgs/supabase/discussions/45329): las tablas nuevas dejan de exponerse por defecto en los proyectos nuevos desde el 30/05/2026 y en todos los existentes desde el 30/10/2026. Los objetos ya creados conservan sus permisos. En las funciones, las respuestas de la comunidad dicen que siguen recibiendo permisos por defecto: hay que comprobarlo en cada proyecto.
- [Can't change the default privileges of supabase_admin](https://supabase.com/kb/troubleshooting/cant-change-the-default-privileges-of-supabase_admin-in-the-public-schema-448af9): los permisos por defecto de `supabase_admin` no se pueden cambiar. Mandan los de `postgres`, que es el rol que crea nuestros objetos.

**Conclusión.** Sí, puede haber permisos por defecto: con seguridad en las funciones (`PUBLIC`), y en tablas y secuencias según la fecha del proyecto. Se cierran así:

1. Las revocaciones oficiales de arriba, ampliadas al esquema `privado` y a los roles `conector` y `PUBLIC`.
2. Una revocación explícita sobre cada objeto creado.
3. Una guarda al principio de cada migración: si el rol que la aplica no es `postgres`, falla. Así ningún objeto queda a nombre de otro rol, con otros permisos por defecto.
4. Pruebas de catálogo (CA-008 y la prueba de dueños), que no dependen de lo anterior.

Todo se detalla en `diseno.md`, «Datos», apartado D-4.

**Sin comprobar**

- Con qué rol aplica las migraciones `supabase db push` en `Nido` y `supabase start` en CI. Una discusión de 2022 sugiere `postgres`, pero no es concluyente. Lo resuelve la primera tarea del plan, con la guarda y la prueba de dueños.
- El contenido real de `pg_default_acl` en `Nido`, creado el 14/11/2026, ya después del cambio. Lo anota la misma tarea.

## Dependencia candidata: pgTAP dentro de PGlite

- [Registro de npm](https://registry.npmjs.org/@electric-sql/pglite-pgtap): `@electric-sql/pglite-pgtap` 0.0.18, publicada el 19/11/2026, licencia Apache-2.0, del repositorio oficial `electric-sql/pglite`. Exige exactamente `@electric-sql/pglite` 0.5.17, la misma versión que fija D-033. El [anuncio de PGlite v0.4](https://electric-sql.com/blog/2026/03/25/announcing-pglite-v04) incluye pgTAP entre las extensiones disponibles.
- **Estado: PROPUESTA, sin usar todavía.** Por D-027 no se puede instalar antes del 26/11/2026 sin una excepción. Falta leer su README: cómo se importa y si funciona con Node 26. Ver `diseno.md`, «Dependencias nuevas».
