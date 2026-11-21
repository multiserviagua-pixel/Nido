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
| `leer_cliente(client_id)` | `conector_prueba_gestion` | `desconocido`; `conocido` con `origen`, `redirect_uris` y `vigente` |
| `guardar_cliente_cimd(client_id, callbacks)` | gestión | `guardado`, `no_valido`, `cerrada` |
| `registrar_cliente_dcr(origen_hmac, client_id, callbacks)` | gestión | `registrado`, `limite` (50 sin uso), `origen_bloqueado` (5 por origen y hora), `no_valido`, `cerrada` |
| `abrir_solicitud(client_id, redirect_uri, desafio, recurso, state_hmac, cookie_hmac)` | gestión | `abierta` (con `solicitud`), `no_valida` (un desafío PKCE que no mide 43 caracteres se rechaza antes de insertar), `cerrada` |
| `activar(solicitud, cookie_hmac, state_hmac, origen_hmac, codigo_hmac, autorizacion_hmac)` | gestión | `activada` (con `redirect_uri`), `solicitud_no_valida`, `origen_bloqueado`, `codigo_no_valido`, `cerrada` |
| `canjear_codigo(codigo_hmac, client_id, redirect_uri, desafio, recurso, acceso_hmac, renovacion_hmac)` | gestión | `emitido` (`expires_in` 300), `no_valido` |
| `renovar(presentado_hmac, client_id, recurso, sal, acceso_hmac, renovacion_hmac)` | gestión | `rotado`, `repetido` (con la `sal` guardada), `reutilizado`, `no_valido` |
| `operar_contar_fallo(origen_hmac)` | gestión | `contado`, `bloqueado`, `invalido` |
| `operar_generar_codigo`, `operar_suspender_licencia`, `operar_reactivar_licencia`, `operar_crear_orden`, `operar_revocar_conexion` | gestión | resultados cerrados; `origen_bloqueado`; `cerrada` tras el cierre |
| `operar_listar_conexiones`, `operar_resumen`, `operar_exportar_sucesos` | gestión | resultados cerrados; siguen disponibles tras el cierre |
| `cerrar_prueba(origen_hmac)` | gestión | `prueba_cerrada`, `ya_cerrada`, `origen_bloqueado`; **terminal, sin vuelta** |

Las funciones de autorización y operación las ejecuta solo `conector_prueba_gestion`; el rol `mcp` no puede. La credencial de operación (`hia_op_`) la comprueba la app en tiempo constante contra su huella: la base de datos no guarda ninguna y solo limita por origen (5 fallos en 15 min bloquean 15 min). `cerrar_prueba` es terminal y deja una fila en `cierre`, revoca licencias, conexiones y tokens, invalida los códigos sin usar e impide, con un disparador, volver a crear o reactivar licencias: **ni siquiera `semilla.sql` vuelve a abrirlas**; para empezar de nuevo hay que revertir y reaplicar.

`ejecucion` y `orden` son los identificadores que devolvió `mcp_obtener_instrucciones`, como texto (en minúsculas o mayúsculas): lo que no es un identificador válido, o es de otra licencia o conexión, da el mismo resultado que lo inexistente.

`operar_revocar_conexion(origen_hmac, conexion)` es la única función que recibe un identificador de conexión (texto, el que dio `operar_listar_conexiones`): solo sirve para revocar esa conexión, tras la credencial de operación y la puerta por origen.

## Resultados por función

Lo que el diseño (`diseno.md`) no listaba y la base de datos devuelve. Todos son de lista cerrada; la app los traduce.

| Función | Resultados añadidos al diseño | Tras el cierre de la prueba |
| --- | --- | --- |
| `leer_cliente` | `conocido` (con `origen`, `redirect_uris`, `vigente`) | sigue respondiendo |
| `guardar_cliente_cimd` | `no_valido`, `cerrada` | `cerrada`, sin escribir |
| `registrar_cliente_dcr` | `no_valido`, `cerrada` | `cerrada`, sin escribir |
| `abrir_solicitud` | `cerrada` | `cerrada` |
| `activar` | `cerrada` | `cerrada` |
| `canjear_codigo` | `no_valido` (también para el cierre y para reutilizar un código) | `no_valido` |
| `renovar` | `no_valido` (también para el cierre) | `no_valido` |
| `mcp_obtener_instrucciones`, `mcp_enviar_informe`, `mcp_confirmar_orden`, `validar_acceso` | `no_autorizado` / `false` | `no_autorizado` / `false` |
| `registrar_suceso` | `registrado`, `saturado`, `descartado`, `invalido` | sigue escribiendo |
| `operar_generar_codigo` | `generado`, `no_valido`, `licencia_desconocida`, `licencia_no_activa`, `origen_bloqueado`, `cerrada` | `cerrada` |
| `operar_suspender_licencia`, `operar_reactivar_licencia` | `suspendida`/`reactivada`, `sin_cambio`, `no_valido`, `licencia_desconocida`, `origen_bloqueado`, `cerrada` | `cerrada` |
| `operar_crear_orden` | `creada`, `no_valido`, `licencia_desconocida`, `origen_bloqueado`, `cerrada` | `cerrada` |
| `operar_revocar_conexion` | `revocada`, `sin_cambio`, `conexion_desconocida`, `origen_bloqueado`, `cerrada` | `cerrada` |
| `cerrar_prueba` | `prueba_cerrada`, `ya_cerrada`, `origen_bloqueado` | `ya_cerrada` |

Notas:

- T-108/T-110 deben traducir `cerrada` a un estado fijo (el mismo para el usuario, sin detalle); un resultado desconocido nunca es éxito: ante cualquier valor que la app no reconozca, se deniega.
- `registrar_suceso` sigue escribiendo tras el cierre (observabilidad; decisión de la coordinación, D-036): sin concesión de acceso, guarda solo la forma cerrada y lo acota el tope de 20 000 al día.

## Aplicar

1. Comprueba que estás en `Nido` y no en otro proyecto.
2. Pega y ejecuta `001_estado.sql` entero. Si algo falla, no queda nada a medias (una transacción).
3. Pega y ejecuta `semilla.sql`.
4. Comprueba con el editor: `select tipo, estado from conector_prueba.licencias order by tipo;` devuelve A y B.

## Contraseñas de los roles

El SQL **no** lleva contraseñas (artículo 4). Los dos roles (`conector_prueba_mcp` y `conector_prueba_gestion`) nacen con inicio de sesión pero sin contraseña, y así no pueden entrar.

1. La persona genera dos contraseñas largas (20 caracteres o más, ASCII imprimible) y distintas.
2. Para cada una, calcula **en su máquina** el verificador SCRAM-SHA-256 con `node scripts/conector/verificador-scram.mjs`. El script no acepta argumentos: lee la contraseña de la variable de entorno `CONTRASENA_CONECTOR` o de la entrada estándar (en una terminal la pide sin eco), no usa la red, no escribe en disco e imprime solo el verificador (`SCRAM-SHA-256$4096:…`).
**Aviso (historial de la terminal).** Escribe la contraseña solo en la entrada sin eco; no la escribas en la línea de órdenes: `CONTRASENA_CONECTOR=...` o un argumento quedarían en el historial de la terminal (PowerShell guarda el historial en disco; bash, en `~/.bash_history`). Usa la entrada sin eco que pide el script. Si alguna vez la escribiste en una orden, bórrala del historial y cambia la contraseña.
3. En el editor se pega **solo el verificador**, nunca la contraseña: `alter role conector_prueba_mcp password 'SCRAM-SHA-256$4096:…';` (y lo mismo con `conector_prueba_gestion`). Postgres lo guarda tal cual, sin volver a derivarlo. Así la contraseña en claro no pasa por Supabase: no queda en `pg_stat_statements`, en el registro de errores ni en el historial del editor (artículo 4).
4. Comprobación: `select query from pg_stat_statements where query ilike '%conector_prueba%password%';` solo puede mostrar verificadores `SCRAM-SHA-256$…`, nunca la contraseña. No copies a las evidencias la salida de `pg_stat_statements`: aunque solo lleve verificadores, ni ella ni ninguna captura de esa consulta entra en `evidencias/` (artículo 4).
5. Las pone solo en el gestor de variables de Vercel. Nunca en el repositorio, en un prompt, en un registro ni en una evidencia.
6. Al revertir y reaplicar, los roles renacen **sin contraseña**: hay que repetir los pasos 1 a 4.

## Revertir (artículo 11)

1. Cierra las sesiones de los dos roles: `select pg_terminate_backend(pid) from pg_stat_activity where usename in ('conector_prueba_mcp', 'conector_prueba_gestion');`
2. Ejecuta `001_estado.reversion.sql`. Borra el esquema, todos sus datos y los dos roles. No hay copias: los datos no se recuperan.
3. **Adopción de un rol existente.** Si los roles ya existen (por ejemplo, tras una aplicación anterior), `001_estado.sql` los adopta sin elevarlos: no recupera el inicio de sesión de un rol con `nologin` (lo decide una persona), no sube un límite de conexiones más estricto, solo restringe la herencia y un límite ilimitado, y se detiene si el rol es miembro de otro o si otros roles (salvo quien aplica y los superusuarios) son miembros de él. También se detiene si el rol es dueño de algún objeto o tiene concesiones fuera del esquema `conector_prueba`, y si algún objeto del esquema tiene otro dueño que quien aplica. **Al adoptar un rol se conserva la contraseña anterior**: el script no la toca; si no la reconoces, fija otra con `alter role … password` (paso 3) antes de usar el rol.
4. Para volver a empezar: aplicar de nuevo (`001_estado.sql` y `semilla.sql`). La reversión se prueba automáticamente: aplicar, revertir y aplicar deja el mismo esquema, las mismas funciones, los mismos permisos y los mismos roles.

## Cierre de la prueba (paso 13 del diseño, N-1)

Al terminar la prueba real:

1. Se borra **todo** el grupo de variables «conector» de Vercel y se despliega `preproduccion` del mismo commit.
2. En `Nido`, para cada uno de los dos roles: `alter role conector_prueba_mcp nologin password null;` (igual con `conector_prueba_gestion`) y después `pg_terminate_backend` de sus sesiones.
3. La barrera es la base de datos (`cerrar_prueba`, estado terminal, y roles sin acceso), no la variable: los despliegues anteriores conservan la variable, así que no se confía en ella.
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
