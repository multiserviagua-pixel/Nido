# ADR-0007: Servidor de autorización propio, rotación con par derivado y operación sin panel

Estado: CONFIRMADO; conexión con rol propio en VERIFICAR (V-107) y URL del documento CIMD de Claude en VERIFICAR (V-6) · Fecha: 20/11/2026 · Decisiones: V-106, T-008, T-010, D-006, D-020, AR-01 (por delegación D-036) · Precisa el ADR-0002, matiza el ADR-0003 y aplica el ADR-0004 · Origen: `specs/001-conector-prueba-real/propuestas-diseno/adr-borrador-autorizacion-del-conector.md` (13/11/2026) y `specs/001-conector-prueba-real/diseno.md`

## Contexto

El ADR-0002 dejó en VERIFICAR si el servidor de autorización se construía o se tomaba de una librería (V-106), y fijó tres callbacks, tokens guardados como HMAC y una ventana de gracia «que devuelve el mismo par». La verificación del 12 y 13/11/2026 (`specs/001-conector-prueba-real/verificaciones.md`) encontró que:

- ninguna librería revisada cubre a la vez tokens opacos como HMAC, conexión ligada a una licencia, ventana de gracia con el mismo par y pantalla con código de activación;
- los dos callbacks de ChatGPT son alternativos: usa el estable si el servidor de autorización emite y anuncia el parámetro `iss` (RFC 9207);
- los documentos de cliente que publican Claude y ChatGPT declaran un callback cada uno;
- guardar solo HMAC impide, en principio, devolver el mismo par dentro de la ventana (cuestión 6 de la función 014);
- el SDK oficial de MCP 2.x ya trae el manejador web sin estado para las dos épocas del protocolo.

Además, el contrato de `obtener_instrucciones` la declaraba de solo lectura con una cuestión abierta: la herramienta abre una ejecución y marca la orden como entregada.

## Decisión

1. **Servidor de autorización propio y mínimo**, dentro de la app: metadatos, registro por CIMD y por DCR, código de autorización con PKCE S256 y renovación. Cierra V-106.
2. **`iss` en toda vuelta al callback**, correcta o de error, y `authorization_response_iss_parameter_supported` en `true` en los metadatos.
3. **Lista cerrada de dos callbacks**, con comparación exacta: el de Claude y el estable de ChatGPT. El de ChatGPT con parte variable y el bucle local no se admiten. Cambia el punto 2 del ADR-0002 y T-010.
4. **CIMD solo por URL exacta de una lista constante**, comprobada antes de cualquier petición de red y sin seguir redirecciones; un documento que declare un callback de fuera de la lista se rechaza entero. Mientras la URL del documento de Claude no esté comprobada (V-6), el metadato de CIMD va en `false` y se usa DCR, con límite y purga.
5. **Rotación con par derivado.** El par nuevo es un HMAC, con una clave que no está en la base de datos, del token de renovación presentado y de una sal aleatoria guardada en la fila sustituida. Repetir el token dentro de la ventana devuelve la sal y la app deriva el mismo par. No se guarda nada recuperable. Precisa el punto 6 del ADR-0002.
6. **La rotación, la activación y el canje son cada uno una función de la base de datos**: una llamada, una transacción.
7. **Dos roles de base de datos sin permisos sobre tablas.** El del conector (`conector_prueba_mcp`) ejecuta `validar_acceso`, las tres funciones `mcp_*` y `registrar_suceso`; el de gestión (`conector_prueba_gestion`), las de autorización, las `operar_*` y `registrar_suceso`. Lo que recibe entradas de un modelo no emite tokens, no crea conexiones ni opera. Precisa el punto 4 del ADR-0003 para la función 001: las «tres funciones» de ese punto pasan, solo para la 001, a cinco (`validar_acceso`, `mcp_obtener_instrucciones`, `mcp_enviar_informe`, `mcp_confirmar_orden` y `registrar_suceso`) y se añade un segundo rol, el de gestión. La parte del punto 4 que dice que cada función recibe el HMAC del token y deriva el cliente en la base de datos rige para `validar_acceso` y las tres `mcp_*`, que reciben `hmac` y `recurso` (diseño, §Datos). Para `registrar_suceso` el diseño no da firma ni dice que reciba el HMAC, de modo que este ADR no lo extiende a ella; el punto 4 sigue prohibiendo en todo caso que el identificador del cliente sea un parámetro.
8. **Solo el SDK oficial de MCP**; `mcp-handler` no se usa. Cambia T-008.
9. **Frontera temporal «operador → app»**: mientras no exista el panel, las operaciones de HumanaIA se hacen por una ruta protegida con una credencial de operación, de la que el entorno solo guarda la huella. Con `ENTORNO=produccion`, la ruta responde 404 antes de leer nada.
10. **Estado en `Nido` y funciones en `arn1`** (D-020), en el esquema `conector_prueba`, separado de `public` y `privado`.
11. **`readOnlyHint: false` en las tres herramientas** (AR-01). `obtener_instrucciones` escribe: abre una ejecución y marca como entregada la orden pendiente. Declararla de solo lectura no sería veraz y podría relajar la confirmación en el anfitrión (artículo 8, ADR-0004). Si un asistente pide confirmar en cada ejecución, se anota como resultado y la anotación no vuelve a `true` (RD-016).
12. **Concesiones a `PUBLIC` y ajenas en `Nido`** (AR-01): PRUEBA-022 lista las concesiones (ACL) de los objetos del proyecto. Es decisión de la coordinación (D-036, 20/11/2026) y sustituye, para la 001, a «decide el responsable» del diseño (§Datos, línea 132) y de `plan.md` (AR-14, línea 153); la coordinación debe retocar esas dos líneas. Postgres no permite revocar de `PUBLIC` solo para un rol: `REVOKE … FROM PUBLIC` quita el acceso a todos los roles que lo tienen por esa vía, incluidos `anon` y `authenticated`. Por eso el alcance es este, por los artículos 3 y 11:
    - **(a) Línea base aceptada por escrito en PRUEBA-022**, sin revocar: los esquemas de sistema, `CONNECT` y `TEMPORARY` sobre la base y las funciones `security invoker` sin acceso a tablas.
    - **(b) Funciones `security definer`, tablas, vistas y secuencias alcanzables por `PUBLIC` en esquemas del proyecto**: `REVOKE … FROM PUBLIC` más un `GRANT` explícito, en la misma transacción, a todo rol que hoy dependa de esa concesión según el listado. Si el objeto es de otra función (la 010, por ejemplo), no lo decide la 001: se escala al responsable.
    - **(c) Esquemas gestionados por Supabase** (`extensions`, `auth`, `storage`, `graphql*`, `realtime`, `net`): no se tocan; decide el responsable.
    - **(d)** La revocación la hace una persona (R-2) después de ver el listado que dé PRUEBA-022; ningún agente ni script la aplica solo, y la persona puede decidir no revocar.
    - **(e) Restauración probada en PRUEBA-022.** Antes de revocar se guardan el listado de ACL (`aclexplode`) y el script que lo restaura. La prueba toma el listado, revoca, restaura y comprueba que el listado de después es idéntico al de antes, y que `has_function_privilege('authenticated', …)` no cambia sobre las funciones de otras funciones.
13. **Límite m-3 aceptado** (AR-01): todas las funciones de la app ven las mismas variables de entorno; la separación de roles del punto 7 protege de errores de lógica, no de un proceso comprometido. Vigente solo hasta el cierre de la 001; la fase 2 lo vuelve a decidir; debe constar en el resumen al responsable.

AR-01 la tomó la coordinación el 20/11/2026 por delegación del responsable (D-036), que puede revocarla.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| `oidc-provider` | Revoca la cadena al repetir un token; CIMD experimental; adaptador y montaje propios |
| Better Auth | Liga la autorización a un usuario con sesión; tokens JWT; tablas propias |
| Guardar cifrado el par durante la ventana | Guarda algo recuperable y obliga a borrarlo |
| Un par distinto por repetición | El ADR-0002 pide el mismo par |
| Admitir el callback variable por patrón | Deja de ser una lista cerrada |
| Operar desde la consola de la base de datos | No puede generar códigos: el HMAC necesita una clave que no está allí |
| Mantener `readOnlyHint: true` en `obtener_instrucciones` | No es veraz y en modo automático relajaría al anfitrión (artículo 8) |
| Tres roles de base de datos | Descartado en el diseño de la 001 («Alternativas descartadas») |

## Consecuencias

- El servidor de autorización es código propio en ruta crítica: revisión y dictamen en cada cambio.
- Si la clave de la que se derivan los tokens se filtra junto con una copia de la base de datos y un token de renovación antiguo, se pueden calcular los tokens siguientes de esa conexión. La rotación de esa clave invalida todas las conexiones; su procedimiento es de la fase 6.
- Si un asistente cambia su callback o usa el variable, hay que cambiar la lista con un despliegue revisado.
- La fase 2 hereda la forma de las funciones de almacenamiento, cambiando solo `almacen.ts`, y decide los valores definitivos (caducidades, ventana, límites).
- La ruta de operación es una superficie más mientras dure; su credencial se sustituye al cerrar la función 001.
- Un asistente puede pedir confirmación en cada llamada a `obtener_instrucciones`; se mide en la prueba real y no se corrige cambiando la anotación.
- Revocar concesiones a `PUBLIC` en `Nido` lo hace una persona en el editor SQL, como el resto del SQL de la 001.
