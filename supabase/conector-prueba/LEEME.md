# Estado del conector de prueba (001): cómo aplicarlo y revertirlo

Esto lo hace **una persona** en el editor SQL de `Nido` (proyecto de pruebas de Supabase, `eu-north-1`). Ningún agente lo aplica y producción no tiene estado. No se toca `public`, `privado` ni `supabase/migrations/`.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `001_estado.sql` | Crea el esquema `conector_prueba`, los dos roles, las tablas (con RLS y sin políticas) y las funciones. Transaccional y reejecutable. |
| `semilla.sql` | Dos licencias ficticias, A y B, de dos clientes distintos. Sin secretos. Reejecutable. |
| `001_estado.reversion.sql` | Borra el esquema con todo su contenido y los dos roles. Reejecutable. |
| `raiz-supabase.crt` | Raíz pública de Supabase para verificar el TLS (ver «Raíz de Supabase»). |

## Funciones del conector

Todas son `security definer` con `search_path = pg_catalog, pg_temp`, devuelven `jsonb` con un `resultado` de lista cerrada, usan la hora de la base de datos y derivan la licencia del HMAC del token: ninguna recibe un identificador de cliente ni de licencia. Cada una lleva su `revoke all` (también a los roles del conector) y su `grant execute` explícito.

| Función | Rol que la ejecuta | Resultados |
| --- | --- | --- |
| `validar_acceso(hmac, recurso)` | `conector_prueba_mcp` | booleano |
| `registrar_suceso(...)` | los dos roles | `registrado`, `saturado`, `descartado`, `invalido` |
| `mcp_obtener_instrucciones(hmac, recurso)` | `conector_prueba_mcp` | `no_autorizado`; `servido` con `estado` (`activa`, `pausada`, `suspendida`), `ejecucion_id` y `orden` (o nula) |
| `mcp_enviar_informe(hmac, recurso, ejecucion, informe, descartados)` | `conector_prueba_mcp` | `no_autorizado`, `ejecucion_desconocida`, `informe_invalido`, `guardado`, `repetido` |
| `mcp_confirmar_orden(hmac, recurso, orden)` | `conector_prueba_mcp` | `no_autorizado`, `no_confirmada`, `confirmada`, `repetida` |
| `informe_es_valido(informe)` | ninguno (auxiliar de `mcp_enviar_informe`) | booleano |

`ejecucion` y `orden` son los identificadores que devolvió `mcp_obtener_instrucciones`, como texto (en minúsculas o mayúsculas): lo que no es un identificador válido, o es de otra licencia o conexión, da el mismo resultado que lo inexistente. El resto de funciones del diseño (autorización y operación) llegan en las tareas siguientes.


## Aplicar

1. Comprueba que estás en `Nido` y no en otro proyecto.
2. Pega y ejecuta `001_estado.sql` entero. Si algo falla, no queda nada a medias (una transacción).
3. Pega y ejecuta `semilla.sql`.
4. Comprueba con el editor: `select tipo, estado from conector_prueba.licencias order by tipo;` devuelve A y B.

## Contraseñas de los roles

El SQL **no** lleva contraseñas (artículo 4). Los dos roles (`conector_prueba_mcp` y `conector_prueba_gestion`) nacen con inicio de sesión pero sin contraseña, y así no pueden entrar.

1. La persona genera dos contraseñas largas (20 caracteres o más, ASCII imprimible) y distintas.
2. Para cada una, calcula **en su máquina** el verificador SCRAM-SHA-256 con `node scripts/conector/verificador-scram.mjs`. El script no acepta argumentos: lee la contraseña de la variable de entorno `CONTRASENA_CONECTOR` o de la entrada estándar (en una terminal la pide sin eco), no usa la red, no escribe en disco e imprime solo el verificador (`SCRAM-SHA-256$4096:…`).
3. En el editor se pega **solo el verificador**, nunca la contraseña: `alter role conector_prueba_mcp password 'SCRAM-SHA-256$4096:…';` (y lo mismo con `conector_prueba_gestion`). Postgres lo guarda tal cual, sin volver a derivarlo. Así la contraseña en claro no pasa por Supabase: no queda en `pg_stat_statements`, en el registro de errores ni en el historial del editor (artículo 4).
4. Comprobación: `select query from pg_stat_statements where query ilike '%conector_prueba%password%';` solo puede mostrar verificadores `SCRAM-SHA-256$…`, nunca la contraseña.
5. Las pone solo en el gestor de variables de Vercel. Nunca en el repositorio, en un prompt, en un registro ni en una evidencia.
6. Al revertir y reaplicar, los roles renacen **sin contraseña**: hay que repetir los pasos 1 a 4.

## Revertir (artículo 11)

1. Cierra las sesiones de los dos roles: `select pg_terminate_backend(pid) from pg_stat_activity where usename in ('conector_prueba_mcp', 'conector_prueba_gestion');`
2. Ejecuta `001_estado.reversion.sql`. Borra el esquema, todos sus datos y los dos roles. No hay copias: los datos no se recuperan.
3. Para volver a empezar: aplicar de nuevo (`001_estado.sql` y `semilla.sql`). La reversión se prueba automáticamente: aplicar, revertir y aplicar deja el mismo esquema, las mismas funciones, los mismos permisos y los mismos roles.

## Cierre de la prueba (paso 13 del diseño, N-1)

Al terminar la prueba real:

1. Se borra **todo** el grupo de variables «conector» de Vercel y se despliega `preproduccion` del mismo commit.
2. En `Nido`, para cada uno de los dos roles: `alter role conector_prueba_mcp nologin password null;` (igual con `conector_prueba_gestion`) y después `pg_terminate_backend` de sus sesiones.
3. La barrera es la base de datos (estado terminal, que llega con T-107 (d), y roles sin acceso), no la variable: los despliegues anteriores conservan la variable, así que no se confía en ella.
4. Revertir con `001_estado.reversion.sql` cuando ya no hagan falta los datos (informes, sucesos y ejecuciones se conservan hasta entonces, para `exportar_sucesos`).

## Límites conocidos

- **Repetir `semilla.sql` con la licencia A (o B) revocada falla** por el identificador fijo de la semilla (la fila revocada sigue existiendo y el `insert` choca con su clave). Para empezar de nuevo, usa la reversión y reaplica (`001_estado.sql` y `semilla.sql`).
- **«Al día» de `registrar_suceso` es una ventana móvil de 24 horas**, no el día natural.
- **Su recuento no se serializa**: con peticiones concurrentes puede pasar algo de 20 000 sucesos antes de saturar. Solo la marca `registro_saturado` se serializa. Las carreras las cubre la 008.

## Permisos de lo que se añada después

La 010 revoca de forma global los permisos por defecto de `postgres`. En este esquema, cada tabla, secuencia o función nueva lleva su `grant` explícito, y cada función nueva su `revoke all … from public, anon, authenticated, service_role` (`alter default privileges` en un esquema no quita el permiso de `PUBLIC` sobre funciones).

## Raíz de Supabase para el TLS (V-10)

`raiz-supabase.crt` es la raíz **pública** de Supabase (no es un secreto): la conexión usa `ssl: { ca, rejectUnauthorized: true }` con ella y verifica certificado y nombre.

- Sujeto: `CN=Supabase Root 2021 CA` (CA autofirmada), válida del 28/04/2021 al 26/04/2031.
- URL de descarga: `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt` (el archivo `prod-ca-2021.crt` que cita la documentación de Supabase, «SSL enforcement»; el enlace es el del bucket de descargas de Supabase).
- Fecha de descarga: 2026-11-20
- Huella SHA-256: `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`

Antes de fiarse de él, una persona puede repetir la descarga y comparar la huella con `openssl x509 -noout -fingerprint -sha256 -in raiz-supabase.crt`. Que el certificado del agrupador de `Nido` encadene a esta raíz y lleve el nombre del servidor se comprueba contra el proyecto real en T-114 (PRUEBA-018); si no encadena, se para y decide el responsable.
