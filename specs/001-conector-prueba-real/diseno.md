# 001 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (pendiente de su dictamen) · Fecha: 13/11/2026

Especificación: APROBADA el 12/11/2026 (puerta P0), con la enmienda 1 aprobada el 13/11/2026. Verificaciones en documentación oficial: `verificaciones.md`, incluido su apartado 9, añadido con este diseño. Este diseño no cambia el estado de la función ni edita la especificación.

Datos que faltan y no se inventan: `<dominio>` (dominio principal; los subdominios son `nido` y `pre-nido`) y qué plan de ChatGPT se prueba. El diseño no depende de ninguno de los dos.

Depende de: la función 002 implementada al menos hasta la batería local, la app base y el despliegue en preproducción (ver «Qué supone este diseño»), y de que una persona cree los proyectos de base de datos y ponga los secretos.

## Resumen

El conector es una ruta de la app, `/api/mcp`, que atiende en el mismo punto a clientes de 2025-11-25 (con `initialize`) y de 2026-07-28 (sin sesión) usando el SDK oficial de MCP, sin estado y con respuestas JSON. Antes de que el SDK vea nada, la ruta limita el tamaño, exige el token en la cabecera `Authorization` y lo valida contra el estado; después, un filtro de salida pone en el listado los esquemas de `contratos/` y sustituye cualquier texto de error por un código fijo. Las tres herramientas validan ellas mismas su entrada con los contratos: descartan y cuentan lo ajeno, y nunca reciben un identificador de cliente, de licencia ni de conexión.

El servidor de autorización se construye, mínimo y propio (V-106): metadatos, registro por CIMD desde dos hosts y por DCR con límite y purga, código de autorización con PKCE S256, parámetro `iss` en todas las respuestas, dos callbacks en lista cerrada y una pantalla de activación en español servida como HTML sin JavaScript. Los tokens son opacos y se guardan como HMAC. La rotación del token de renovación se hace en una sola operación de base de datos, y la ventana de gracia devuelve el mismo par sin guardar nada recuperable: el par nuevo se deriva del token anterior y de una sal guardada, con una clave que no está en la base de datos.

El estado vive en Postgres de Supabase, en la UE y en plan gratuito, dentro de un esquema propio (`conector_prueba`) al que la app solo llega ejecutando funciones con dos roles sin acceso a tablas. Toda la lógica que debe ser atómica está en esas funciones. Las pruebas automáticas las ejecutan contra un Postgres en memoria; la concurrencia real y un ciclo completo con un cliente MCP se prueban en local contra el proyecto de desarrollo, antes del primer despliegue.

Las operaciones de HumanaIA durante la prueba se hacen con una orden de terminal que llama a una ruta protegida por una credencial de operación; esa ruta no existe en producción. El prompt ficticio y el arranque local ficticio son textos del repositorio; el prompt se sirve desde el propio despliegue y nada lo puede cambiar.

Lo que no se ha podido resolver sin el responsable está en «Asuntos abiertos para el responsable» y en «Enmiendas propuestas a la especificación». La estimación de plazos, dicha con franqueza, está en «Orden de construcción y estimación».

## Qué supone este diseño de la función 002 y de la fase 2

### De la función 002 (su diseño se está rehaciendo)

Se toma como convención, no como texto definitivo. Si alguno de estos puntos cambia, este diseño se revisa en el punto afectado.

| N.º | Supuesto | Dónde lo usa este diseño |
| --- | --- | --- |
| S-1 | Existen la rama `main`, la orden de integración y la batería local (`npm run bateria`), y las pruebas automáticas son `vitest run` sobre `tests/` | Todas las pruebas automáticas de esta función entran en esa batería |
| S-2 | `src/lib/plataforma/configuracion.ts` es el único archivo que lee variables de entorno, con lista cerrada por entorno y sin valores por defecto | Esta función añade ahí sus variables |
| S-3 | `src/lib/registro/` es el único lugar con `console`, y escribe una línea con nivel, código de lista cerrada, ruta del archivo y momento | Esta función añade códigos a esa lista |
| S-4 | `src/lib/plataforma/supervision.ts` envía a la supervisión solo campos de una lista cerrada | Esta función añade tres códigos |
| S-5 | No hay `proxy.ts` ni `middleware`; las funciones se ejecutan solo en `fra1`; las cabeceras globales incluyen `X-Frame-Options: DENY`, `frame-ancestors 'none'` y `Referrer-Policy: no-referrer` | Pantalla de activación; región |
| S-6 | Hay dos proyectos de despliegue, uno por entorno; preproducción responde en `https://pre-nido.<dominio>` sin muro de acceso; un agente despliega en preproducción con una orden | Prueba real |
| S-7 | El despliegue sube `contratos/` y `prompts/` (no están en `.vercelignore`) | El conector los lee del propio despliegue |
| S-8 | Las rutas críticas de la integración ya incluyen `src/mcp/**`, `src/app/oauth/**`, `src/app/.well-known/**`, `src/lib/oauth/**`, `src/lib/licencias/**`, `src/app/api/**`, `src/lib/supabase/**`, `supabase/**`, `prompts/**`, `contratos/**` y `scripts/**` | Todas las rutas de esta función piden dictamen |
| S-9 | Durante la ventana, el plan de la plataforma de despliegue es la prueba gratuita del plan de pago (D-016); después, lo que decida el responsable | El diseño no depende del plan: no usa nada que exija uno concreto |

Lo que este diseño **no** hereda de la 002: su comprobación de disponibilidad no valida la configuración del conector (el conector se comprueba con su propia orden, `npm run conector:comprobar`), para que producción pueda desplegarse sin las variables del conector.

### De la fase 2 (trabaja a la vez, D-017)

| N.º | Supuesto o compromiso |
| --- | --- |
| F-1 | El proyecto `nido-desarrollo` se comparte. Esta función solo crea en él el esquema `conector_prueba` y dos roles con el prefijo `conector_prueba_`. No toca `public` ni `privado`, ni `supabase/migrations/` |
| F-2 | La fase 2 no borra ese esquema ni esos roles mientras dure la ventana. Si reinicia la base de desarrollo, el guion de aplicación de esta función se vuelve a ejecutar: es idempotente y solo afecta al trabajo en local, porque la prueba real usa otro proyecto (asunto A-1) |
| F-3 | Lo que se conserva en la fase 2: todo el código TypeScript (conector, autorización, pantalla, operaciones y pruebas) y la **forma de las funciones de almacenamiento** (nombre, parámetros y respuesta; apartado «Datos»). Las funciones 011 y 014 las reimplementan sobre las tablas definitivas y cambian el nombre del esquema en un único archivo, `src/lib/supabase/almacen.ts` |
| F-4 | Las tablas de `conector_prueba` son un subconjunto de `docs/MODELO-DATOS.sql`, con los mismos nombres de columna donde existen. Son de la prueba: al pasar a la fase 2 se eliminan con el guion de vuelta atrás |
| F-5 | Las funciones de esta función ya aplican las propuestas 3, 4 y 5 de `propuestas.md` (licencia suspendida sin orden; confirmar solo órdenes entregadas; rechazar códigos de problema desconocidos) |
| F-6 | La derivación del par de tokens con sal (apartado «Tokens») responde a la cuestión 6 de la función 014 («el mismo par» sin guardar nada recuperable). Se propone, no se impone |
| F-7 | Este diseño verifica en documentación la mitad de V-107 (rol propio por el agrupador) y la prueba en su primera tarea de base de datos. El resultado se entrega a la fase 2 |

## Piezas y responsabilidades

### Mapa de archivos

Rutas según `docs/ESQUELETO.md`. Las que no están en él se marcan **(nueva)** y se piden aprobar con este diseño (asunto A-12).

| Ruta | Qué hace | Agente |
| --- | --- | --- |
| `src/app/api/mcp/route.ts` | Punto de entrada MCP. Solo `POST`; los demás métodos, 405 | `ingeniero-backend` |
| `src/mcp/entrada.ts` **(nueva)** | Tubería de la petición: configuración, origen, tamaño, token, SDK, filtro de salida, registro | `ingeniero-backend` |
| `src/mcp/servidor.ts` | Crea el servidor MCP de cada petición y registra las tres herramientas | `ingeniero-backend` |
| `src/mcp/herramientas/obtener-instrucciones.ts`, `enviar-informe.ts`, `confirmar-orden.ts` | Una herramienta por archivo | `ingeniero-backend` |
| `src/mcp/esquemas/contratos.ts`, `sanear-informe.ts` | Carga `contratos/*.schema.json`, calcula el esquema publicado, compila los validadores y descarta y cuenta campos ajenos | `ingeniero-backend` |
| `src/mcp/salida.ts` **(nueva)** | Filtro de salida: listado con los esquemas del contrato y errores con texto fijo | `ingeniero-backend` |
| `src/mcp/prompt-ficticio.ts` **(nueva)** | Lee el prompt ficticio, lo normaliza, calcula su huella; reglas ficticias | `ingeniero-backend` |
| `src/app/.well-known/oauth-protected-resource/[[...ruta]]/route.ts`, `src/app/.well-known/oauth-authorization-server/route.ts` | Metadatos | `ingeniero-backend` |
| `src/app/oauth/autorizar/route.ts` | `GET`: valida la petición y sirve la pantalla. `POST`: canjea el código de activación | `ingeniero-backend` |
| `src/app/oauth/token/route.ts`, `src/app/oauth/registro/route.ts` | Emisión y renovación de tokens; registro por DCR | `ingeniero-backend` |
| `src/lib/oauth/` | `secretos.ts` (claves derivadas, HMAC, generación y formato de tokens y códigos), `callbacks.ts` (lista cerrada), `metadatos.ts`, `clientes.ts` (DCR), `cimd.ts` (descarga), `peticion.ts` (validación de la petición de autorización), `activacion.ts`, `tokens.ts` (canje, renovación, derivación), `origen.ts` (huella del origen) | `ingeniero-backend` |
| `src/lib/oauth/pantalla.ts` | HTML y estilos de la pantalla de activación y de sus estados | `ingeniero-frontend`, con revisión de `disenador-ui` |
| `src/lib/licencias/operaciones.ts` | Operaciones de HumanaIA sobre licencias ficticias, códigos, órdenes y conexiones | `ingeniero-backend` |
| `src/app/api/operacion/route.ts` **(nueva)** | Ruta de operación. No existe en producción | `ingeniero-backend` |
| `src/lib/supabase/almacen.ts` **(nueva)** | Interfaz del almacén, lista cerrada de funciones con su SQL fijo y adaptador de Postgres | `ingeniero-backend` |
| `src/lib/supabase/conector.ts` | Almacén con el rol del conector. Es lo único que importa `src/mcp/` | `ingeniero-backend` |
| `src/lib/supabase/autorizacion.ts` **(nueva)** | Almacén con el rol de gestión (autorización y operación) | `ingeniero-backend` |
| `src/lib/registro/sucesos.ts` **(nueva)** | Anota cada suceso en el estado, después de responder | `ingeniero-backend` |
| `src/lib/plataforma/configuracion.ts`, `src/lib/registro/registro.ts`, `src/lib/plataforma/supervision.ts` | Se amplían: variables y códigos nuevos | `ingeniero-backend` |
| `supabase/conector-prueba/` **(nueva)** | `001_estado.sql`, `001_estado.reversion.sql`, `semilla.sql` y `LEEME.md` (cómo lo aplica una persona). Fuera de `supabase/migrations/` | `ingeniero-bd` |
| `prompts/agente-prueba/` **(nueva)** | `0.1.md` (prompt ficticio) y `arranque.md` (arranque local ficticio) | `ingeniero-backend`; lo revisa el `revisor` |
| `scripts/conector/` **(nueva)** | `operar.mjs`, `ciclo-local.mjs`, `comprobar-conector.mjs` | `plataforma` |
| `tests/unit/conector/` y `tests/conector/` **(nueva la segunda)** | Pruebas de la batería; `tests/conector/apoyo/` (almacén en memoria, envejecimiento, sumidero de registros, cliente de pruebas); `tests/conector/almacen-real/` (las que necesitan Postgres real) | `qa`, `ingeniero-backend`, `ingeniero-bd` |
| `next.config.ts` | Incluye `prompts/agente-prueba/` en el despliegue de `/api/mcp` | `ingeniero-backend` |
| `package.json`, `.env.example` | Dependencias, órdenes `operar`, `conector:ciclo`, `conector:comprobar`, `conector:pruebas-bd`; nombres de variables | `plataforma` |
| `specs/001-conector-prueba-real/guion-prueba.md`, `calendario.md`, `resultados/`, `evidencias/` | Guion, calendario, resultados por asistente y plan, evidencias | `qa`, con la persona que ejecuta la prueba |

### Punto de entrada MCP y versiones del protocolo

**Librería.** Solo `@modelcontextprotocol/server` 2.4.0. Su `createMcpHandler` devuelve un manejador web estándar, sin estado, que atiende 2026-07-28 de forma nativa y, con `legacy: 'stateless'`, a los clientes que abren con `initialize` (`verificaciones.md`, 6.2). Se usa con `responseMode: 'json'`: nunca transmite. `mcp-handler` no se usa: lo que añade ya lo trae el SDK o este diseño lo hace por su cuenta (asunto A-11).

**Tubería de cada petición** (`src/mcp/entrada.ts`), en este orden. Cada paso que falla responde y termina:

| Paso | Qué comprueba | Si falla |
| --- | --- | --- |
| 1 | La configuración del conector es válida | 503 genérico |
| 2 | El método es `POST` | 405 con `Allow: POST` |
| 3 | La cabecera `Origin` no viene, o es de la lista: el origen propio, `https://claude.ai` o `https://chatgpt.com` | 403 genérico |
| 4 | El cuerpo no supera 32 768 bytes. Se lee con tope; no se confía en `Content-Length` | 413 genérico |
| 5 | La cabecera `Authorization` tiene exactamente la forma `Bearer hia_a_` seguido de 43 caracteres de base64url. No se mira la cadena de consulta, el cuerpo ni las cookies | 401 con `WWW-Authenticate` |
| 6 | El HMAC del token corresponde a un token de acceso vigente, emitido para este recurso, de una conexión no revocada (`validar_acceso`) | 401 con `WWW-Authenticate` y `error="invalid_token"`; si el almacén falla, 503 |
| 7 | El cuerpo es JSON | Error JSON-RPC `-32700` con texto fijo |
| 8 | Si es `tools/call`, el nombre es uno de los tres | Error JSON-RPC `-32602` con texto fijo, sin repetir el nombre |
| 9 | Se llama al SDK con una petición reconstruida, sin `Authorization` ni `Cookie`. El servidor de esa petición se crea con el HMAC del token en una variable cerrada: el token nunca entra en el SDK | — |
| 10 | Filtro de salida (abajo) | 500 genérico si el listado no trae exactamente las tres herramientas |
| 11 | Después de responder: se anota el suceso | Se descarta y se anota en consola |

El reto del paso 5 y 6 es `WWW-Authenticate: Bearer resource_metadata="<URL_PUBLICA>/.well-known/oauth-protected-resource/api/mcp", scope="agente"`. Un token presentado en la URL no se lee: la petición llega al paso 5 sin cabecera y se rechaza como si no hubiera token (REQ-033).

Ninguna dirección se construye a partir de la cabecera `Host`: emisor, recurso y metadatos salen de `URL_PUBLICA`.

**Las dos épocas.** No hay nada que decidir en el código: el SDK elige según cómo abre el cliente. La prueba automática envía una sesión con `initialize` declarando 2025-11-25 y una petición 2026-07-28 con sus cabeceras y su `_meta`, y las dos listan las tres herramientas. Una versión no admitida recibe el error `-32022` con la lista de versiones admitidas; el campo `requested`, que repetiría un valor recibido, se retira en el filtro de salida.

**Filtro de salida** (`src/mcp/salida.ts`). La respuesta del SDK es siempre JSON. El filtro hace tres cosas y nada más:

1. En una respuesta de `tools/list`, pone en cada una de las tres herramientas el `inputSchema` publicado y las anotaciones del contrato (apartado siguiente). Si el listado no trae exactamente los tres nombres, la respuesta es un 500 genérico.
2. En un error JSON-RPC, sustituye el mensaje por un texto fijo según el código y retira `data`, salvo `data.supported` en `-32022`.
3. En un resultado de herramienta con `isError` que no haya escrito el propio conector, sustituye el texto por un código fijo.

### Herramientas: esquema publicado y validación (H-6 y H-7)

**Qué se publica.** Lo que ve el asistente en `tools/list` sale de `contratos/` en cada arranque, sin copias:

- `inputSchema`: el objeto `entrada` del contrato de la herramienta. En `enviar_informe`, la referencia `"$ref": "urn:…:informe:1"` se sustituye por el documento `contratos/informe.schema.json` incrustado, sin sus claves `$schema`, `$id` y `x-version-esquema`. Es un esquema **cerrado**, con `additionalProperties: false` en la raíz, en el informe y en `comprobaciones`.
- `outputSchema`: el objeto `salida` del contrato.
- `annotations`: el objeto `x-anotaciones` del contrato, tal cual. `title` y `description`: los del contrato.

Se publica el esquema cerrado, y no uno abierto, por dos razones: es el contrato (CA-004), y un esquema abierto invitaría al modelo a añadir campos, que es justo lo que el artículo 1 quiere evitar. La consecuencia, que CA-012 ya prevé, es que un asistente puede no dejar llegar los campos de más; se anota en la prueba real.

**Quién valida.** El conector, no el SDK. La documentación del SDK dice que valida los argumentos antes de llamar al manejador y no ofrece cómo evitarlo (`verificaciones.md`, 9.4). Por eso las herramientas se registran en el SDK con un esquema de entrada abierto (`{ "type": "object" }`), que solo rechaza lo que no es un objeto, y el esquema del contrato lo pone el filtro de salida en el listado. La salida sí se registra en el SDK con el `outputSchema` del contrato, para que la compruebe antes de responder; las pruebas la validan además por su cuenta.

**Cómo valida `enviar_informe`** (`sanear-informe.ts`), en este orden:

1. Toma de los argumentos solo `ejecucion_id` e `informe`. Cuenta las demás claves de la raíz.
2. Del informe, toma solo las claves que el contrato declara; cuenta las demás. Dentro de `comprobaciones`, lo mismo. Las claves se leen del contrato, no están escritas a mano. De un campo ajeno no se lee el valor ni se recorre su contenido: solo se cuenta que estaba.
3. Valida el informe ya limpio contra `contratos/informe.schema.json` con un validador de esquemas JSON (Ajv, el que trae el SDK). No se guarda ni se devuelve el detalle del fallo.
4. Si `ejecucion_id` no tiene forma de UUID, la respuesta es `ejecucion_desconocida`, igual que si no existiera.
5. Llama a la función del almacén con el informe limpio, o con `null` si no era válido, y con el número de campos descartados. El almacén decide en este orden: ejecución desconocida, informe inválido (la ejecución sigue abierta), guardado o repetido.

La base de datos repite los tipos y rangos del contrato en sus restricciones. Si rechaza una fila, la respuesta es `informe_invalido`.

**Las otras dos.** `obtener_instrucciones` no lee sus argumentos: lo que llegue se ignora. `confirmar_orden` toma solo `orden_id`; si no tiene forma de UUID responde `confirmada: false`.

**El cliente nunca es una entrada.** El código TypeScript no maneja en ningún momento un identificador de cliente, de licencia ni de conexión: pasa al almacén el HMAC del token y la función deriva de él la conexión y la licencia. Un identificador enviado como campo es un campo ajeno más.

**Respuestas.** Cada resultado lleva `structuredContent`, conforme a la salida del contrato, y un bloque de texto con el mismo JSON. Los fallos que no tienen forma en el contrato (almacén caído, token que deja de valer entre el paso 6 y la herramienta) devuelven un resultado con `isError` y un código fijo: `error_temporal` o `no_autorizado`.

**Repetición y concurrencia.** Las resuelve el almacén, con bloqueo de fila:

| Caso | Resultado |
| --- | --- |
| Varios `obtener_instrucciones` a la vez | Cada uno inserta su ejecución: identificadores distintos |
| Varios `enviar_informe` con la misma ejecución | Una sola fila (`ejecucion_id` único); los demás, `repetido: true` |
| `enviar_informe` repetido con otro contenido válido | Se conserva el primero; `repetido: true` |
| Varios `confirmar_orden` con la misma orden | Una actualización gana; las demás, `repetida: true` |

### Servidor de autorización (V-106)

**Decisión: se construye el mínimo.** Ninguna librería revisada cubre a la vez tokens opacos guardados como HMAC, conexión ligada a una licencia y no a un usuario, ventana de gracia que devuelve el mismo par y pantalla con código de activación (`verificaciones.md`, 1.7). Adaptar una obliga a mantener además su modelo de usuarios o su adaptador de almacenamiento. Lo que se construye son cuatro rutas y una pantalla.

**Puntos de entrada.**

| Ruta | Método | Qué hace |
| --- | --- | --- |
| `/.well-known/oauth-protected-resource` y `/.well-known/oauth-protected-resource/api/mcp` | `GET` | Metadatos de recurso protegido (RFC 9728) |
| `/.well-known/oauth-authorization-server` | `GET` | Metadatos del servidor de autorización (RFC 8414) |
| `/oauth/registro` | `POST`, JSON | Registro dinámico (DCR) |
| `/oauth/autorizar` | `GET` | Valida la petición y muestra la pantalla |
| `/oauth/autorizar` | `POST`, formulario | Canjea el código de activación |
| `/oauth/token` | `POST`, formulario | Canjea el código de autorización; renueva |

Todas responden con `Cache-Control: no-store`. Ninguna emite cabeceras CORS.

**Metadatos.** Valores fijos, derivados de `URL_PUBLICA`:

| Documento | Campos |
| --- | --- |
| Recurso protegido | `resource`: `<URL_PUBLICA>/api/mcp` · `authorization_servers`: [`<URL_PUBLICA>`] · `scopes_supported`: [`agente`] · `bearer_methods_supported`: [`header`] |
| Servidor de autorización | `issuer`: `<URL_PUBLICA>` (sin ruta ni barra final) · `authorization_endpoint` · `token_endpoint` · `registration_endpoint` · `response_types_supported`: [`code`] · `response_modes_supported`: [`query`] · `grant_types_supported`: [`authorization_code`, `refresh_token`] · `code_challenge_methods_supported`: [`S256`] · `token_endpoint_auth_methods_supported`: [`none`] · `scopes_supported`: [`agente`, `offline_access`] · `client_id_metadata_document_supported`: `true` · `authorization_response_iss_parameter_supported`: `true` |

`none` y `client_id_metadata_document_supported` juntos son la condición con la que Claude elige CIMD (`verificaciones.md`, 3.4). `offline_access` se anuncia solo en el servidor de autorización, como pide la especificación. El conector emite siempre token de renovación, lo pida el cliente o no.

**Parámetro `iss` (H-8).** Toda respuesta de autorización que vuelve a un callback, correcta o de error, lleva `iss=<URL_PUBLICA>`. Es lo que recomienda la especificación y es la condición con la que ChatGPT usa su callback estable (`verificaciones.md`, 4.4).

**Callbacks: lista cerrada de dos.**

- `https://claude.ai/api/mcp/auth_callback`
- `https://chatgpt.com/connector_platform_oauth_redirect`

La lista es una constante del código (`callbacks.ts`): cambiarla es un despliegue revisado. La comparación es de cadena, carácter a carácter, sin normalizar. El callback de ChatGPT con parte variable (`https://chatgpt.com/connector/oauth/{callback_id}`) **no se admite**: con `iss` anunciado y emitido, la documentación dice que ChatGPT usa el estable, y el documento de cliente de ChatGPT declara solo ese (`verificaciones.md`, 9.5). Si en la prueba real ChatGPT usara el otro, la activación fallaría con el código `callback_no_permitido`; qué hacer entonces está en el asunto A-8. Los callbacks de bucle local de Claude Code tampoco se admiten.

**Orden de validación en `GET /oauth/autorizar`.** Importa, porque decide si se puede redirigir:

1. Se resuelve el cliente (`client_id`): registrado por DCR, o documento CIMD. Si falla, **página de error, sin redirigir**.
2. `redirect_uri` es exactamente uno de la lista cerrada **y** uno de los registrados para ese cliente. Si falla, **página de error, sin redirigir**.
3. Lo demás: `response_type=code`; `code_challenge` presente, de 43 a 128 caracteres; `code_challenge_method=S256`; `resource` igual, carácter a carácter, a `<URL_PUBLICA>/api/mcp`; `state` ausente o de hasta 512 caracteres ASCII imprimibles. Si falla, se redirige al callback ya validado con `error=invalid_request` (o `invalid_target` para el recurso), `state` e `iss`.
4. Los valores de `scope` que no sean `agente` u `offline_access` se descartan. Los parámetros desconocidos se ignoran.

Si falta `resource`, se rechaza: la especificación obliga al cliente a enviarlo. Se observa en la prueba real.

**Registro por CIMD.** Se trata como CIMD un `client_id` que es una URL `https`.

| Regla | Valor |
| --- | --- |
| Hosts admitidos | `claude.ai` y `chatgpt.com`, por coincidencia exacta en minúsculas. Sin puerto, sin usuario, con ruta |
| Descarga | Solo `https`; sin seguir redirecciones; 3 segundos como máximo; 16 384 bytes como máximo |
| Documento | JSON; su `client_id` es igual a la URL, carácter a carácter; `redirect_uris` es una lista no vacía |
| Callbacks | Todos los que declara el documento están en la lista cerrada. Si declara uno que no lo está, el documento entero se rechaza |
| Lo demás | Los campos desconocidos se ignoran. No se guarda ni se muestra el nombre, el logotipo ni ningún enlace del documento. El método de autenticación que declare se ignora: todos los clientes se tratan como públicos |
| Caché | El resultado se guarda una hora. Pasada, se vuelve a descargar; si entonces falla, se rechaza |

Con un host fuera de la lista no se hace ninguna petición saliente: la comprobación del host va antes de cualquier llamada de red. La descarga usa una función de red inyectable, para que la prueba cuente las peticiones.

**Registro por DCR.** `POST /oauth/registro` con JSON.

| Regla | Valor |
| --- | --- |
| `redirect_uris` | Lista no vacía; todos en la lista cerrada. Si alguno no lo está, se rechaza con `invalid_redirect_uri` |
| `token_endpoint_auth_method` | Ausente o `none`. Otro valor se rechaza |
| Lo demás | Se ignora y no se guarda: nombre, logotipo, enlaces, `application_type` |
| Respuesta | 201 con `client_id` (`dcr_` y 22 caracteres aleatorios), `redirect_uris`, `token_endpoint_auth_method: "none"`, `grant_types`, `response_types`, `client_id_issued_at`. Sin secreto de cliente |
| Límite | 50 registros sin uso a la vez, en total; y 5 registros por origen y hora |
| Purga | Un registro sin uso desaparece a las 24 horas. «Sin uso» quiere decir que ninguna activación se ha completado con él. La purga se hace dentro de la propia función de registro, antes de contar; no necesita tarea periódica |

Lo que no cubre este límite: quien disponga de diez orígenes distintos puede ocupar los 50 registros y dejar sin DCR a los demás durante 24 horas. CIMD no se ve afectado. Es el mecanismo sencillo que pide la especificación; el definitivo es de la fase 2.

### Pantalla de activación

Se sirve desde un manejador de ruta que devuelve HTML, no desde una página de React. Motivos: control completo de cabeceras y cookies, ningún JavaScript, ningún dato de la petición en el marcado y todos los errores envueltos.

**Contenido**, todo en español:

- Un título (`h1`): «Activar el conector de HumanaIA».
- Una línea que dice a qué asistente se va a volver: «Vas a conectar: **claude.ai**». El texto sale de una tabla fija según el callback validado, nunca del cliente (H-8).
- Un campo de texto con su etiqueta, «Código de activación», y una ayuda: «Te lo da HumanaIA. Caduca a los 10 minutos y solo sirve una vez».
- Un botón, «Activar».

**Estados:**

| Estado | Texto | Código HTTP |
| --- | --- | --- |
| Inicio | El formulario | 200 |
| Código no válido | «El código no es válido o ha caducado. Pide uno nuevo a HumanaIA.» El mismo texto para incorrecto, caducado y ya usado | 200 |
| Bloqueo por intentos | «Demasiados intentos. Espera 15 minutos y pide un código nuevo a HumanaIA.» El mismo texto sea cual sea el código | 429 |
| Solicitud no válida o caducada | «Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.» | 400 |
| Servicio no disponible | «No se ha podido completar. Inténtalo de nuevo en unos minutos.» | 503 |
| Código aceptado | «Código aceptado.» y un único enlace con aspecto de botón, «Continuar en claude.ai» | 200 |

El estado «Código aceptado» no redirige solo: una redirección con espera incumple WCAG 2.2 (criterio 2.2.1) y una inmediata no dejaría ver el estado que pide REQ-011. La persona pulsa «Continuar».

**Accesibilidad y móvil.** `lang="es"`; un solo `h1`; etiqueta asociada al campo; el mensaje de error con `role="alert"`, enlazado al campo con `aria-describedby` y con el foco en el campo al volver; objetivos táctiles de 44 px como mínimo; contraste AA; sin desplazamiento horizontal a 360 px; funciona solo con teclado. El campo lleva `autocomplete="one-time-code"`, `autocapitalize="characters"` y `spellcheck="false"`. Los colores y la tipografía son los de `docs/DISENO.md` que ya estén fijados; el sistema de diseño es de la fase 3.

**Código de activación.** 12 caracteres del alfabeto Crockford base32, en tres grupos de cuatro (`XXXX-XXXX-XXXX`): 60 bits. Antes de calcular el HMAC se normaliza: mayúsculas, sin espacios ni guiones, `O` como `0`, `I` y `L` como `1`. Caduca a los 10 minutos.

**Envío cruzado e incrustación.**

- `GET` crea una **solicitud de autorización**: una fila con el cliente, el callback, el desafío PKCE y el recurso ya validados, que caduca a los 10 minutos. Su identificador, aleatorio, va en un campo oculto; su HMAC, en la fila.
- Además se pone una cookie `__Host-activacion` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, 10 minutos) con otro valor aleatorio, cuyo HMAC también queda en la fila.
- `POST` exige, antes de mirar el código: cabecera `Origin` igual al origen propio; campo oculto y cookie que correspondan a la misma solicitud, vigente y sin consumir. Si algo no cumple, se responde «solicitud no válida» y **no cuenta como intento**.
- El envío no puede cambiar cliente, callback, desafío ni recurso: no viajan en el formulario, están en la fila.
- `state` no se guarda: viaja en un campo oculto, escapado, y vuelve tal cual al callback. Es el único valor recibido que el conector devuelve, porque el protocolo lo exige.
- Incrustación: `X-Frame-Options: DENY` y `Content-Security-Policy: default-src 'none'; style-src 'sha256-…'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`. La huella del estilo se calcula al arrancar.

**Límite de intentos.** Por origen. El origen es el HMAC, con una clave derivada, de la dirección que la plataforma pone en `x-vercel-forwarded-for`, que el cliente no puede falsear (`verificaciones.md`, 9.1); en local, un valor fijo. La dirección no se guarda en claro ni se registra.

| Parámetro | Valor |
| --- | --- |
| Intentos fallidos | 5 |
| Ventana | 15 minutos |
| Bloqueo | 15 minutos |

Durante el bloqueo no se evalúa ningún código: uno válido se rechaza y no se consume. El bloqueo queda anotado como suceso, sin el código. El recuento y la comprobación van dentro de la misma función que canjea el código: si el almacén no responde, no hay activación.

**Activaciones simultáneas.** La función bloquea la fila del código. La primera lo marca usado y crea la conexión; las demás lo encuentran usado y reciben «código no válido». Se crea una conexión como mucho.

### Tokens

| Propiedad | Decisión |
| --- | --- |
| Formato | Opacos. `hia_a_` (acceso) o `hia_r_` (renovación) seguido de 43 caracteres de base64url: 256 bits. El prefijo solo dice el tipo; sirve al escáner de secretos y a rechazar pronto una confusión de tipo |
| Guardado | Solo `HMAC-SHA-256(clave de guardado, tipo + ":" + token)`, en hexadecimal. El tipo entra en el cálculo: un token de renovación presentado como acceso no coincide con nada, además de que la fila lleva su tipo |
| Claves | Una sola variable secreta, `CONECTOR_SECRETO`. De ella se derivan con HKDF-SHA-256 y etiquetas distintas la clave de guardado, la de derivación, la de origen y la de ligadura de la cookie. Ninguna está en la base de datos |
| Acceso | Caduca a los 300 segundos |
| Renovación | Se sustituye en cada uso. Caducidad deslizante de 14 días: cada renovación concede 14 días más |
| Ventana de gracia | 60 segundos desde la sustitución |
| Ligadura | Cada token queda ligado a su conexión, a su cliente OAuth y al recurso. Renovar exige el mismo cliente |
| Código de autorización | Aleatorio, 256 bits, guardado como HMAC; un solo uso; caduca a los 300 segundos |

**Rotación atómica con el mismo par.** El problema: «devolver el mismo par» dentro de la ventana y «no guardar nada utilizable» parecen incompatibles. Se resuelve derivando el par nuevo en lugar de sortearlo:

```
par nuevo = HMAC-SHA-256(clave de derivación, etiqueta + token de renovación presentado + sal)
```

con una etiqueta para el acceso y otra para la renovación. La sal es aleatoria, se elige en la primera rotación y se guarda en la fila del token sustituido. No es un secreto: sin la clave de derivación y sin el token presentado no sirve para nada.

`POST /oauth/token` con `grant_type=refresh_token` hace **una sola llamada** al almacén:

1. La app sortea una sal candidata, deriva el par candidato y llama a `renovar` con el HMAC del token presentado, la sal y los HMAC del par candidato.
2. La función bloquea la fila del token presentado y decide:

| Situación de la fila | Qué hace | Respuesta al cliente |
| --- | --- | --- |
| Vigente y sin sustituir | Guarda la sal, la marca sustituida e inserta el par nuevo, todo en la misma transacción | El par candidato |
| Sustituida hace 60 segundos o menos | No escribe nada. Devuelve la sal guardada | La app vuelve a derivar con esa sal: **el mismo par** que recibió la primera petición, con el tiempo de vida que le quede |
| Sustituida hace más de 60 segundos | Revoca la conexión y anota `token_reutilizado` | `invalid_grant` |
| Desconocida, caducada, de otro cliente, de otro tipo o de una conexión revocada | Nada | `invalid_grant` |

Diez renovaciones simultáneas con el mismo token esperan en el bloqueo de fila: la primera rota y las otras nueve reciben la sal y derivan el mismo par. Si la respuesta de la primera se pierde, el cliente repite y obtiene el mismo par.

Qué garantiza y qué no: una copia de la base de datos no contiene nada que sirva como token (solo HMAC y sales). Quien tuviera a la vez la clave de derivación, una copia de la base de datos y un token de renovación antiguo de una conexión podría calcular los siguientes; con tokens sorteados y guardados cifrados haría falta lo mismo menos el token antiguo. Se considera equivalente.

**Caducidad deslizante.** El intervalo más largo entre ejecuciones es de 17 horas; 14 días cubren además cualquier parada dentro de la ventana (por ejemplo, un límite de uso semanal del asistente). El valor definitivo es de la función 014.

**Licencia suspendida.** Los tokens se siguen aceptando y renovando, para que el agente reciba `suspendida` en cada revisión. Solo la revocación de la conexión los invalida.

**Revocación por conexión.** Toda comprobación de un token une su fila con la de su conexión y exige que no esté revocada. Revocar es poner una fecha en la conexión: vale desde la petición siguiente y no toca ninguna otra.

**Comparación de secretos.** Los tokens y los códigos no se comparan: se busca su HMAC. Quien presenta un valor no controla los bytes de su HMAC, así que el tiempo de la búsqueda no le dice nada del valor guardado. Donde la app compara directamente (huella de la credencial de operación), usa comparación de tiempo constante.

### Operaciones de HumanaIA durante la prueba (REQ-025)

Sin panel. Una ruta, `POST /api/operacion`, y una orden de terminal que la llama.

**Credencial.** La credencial de operación es un valor aleatorio de 256 bits con el prefijo `hia_op_`, que crea y guarda una persona. En el entorno solo se pone su huella SHA-256 (`OPERACION_HUELLA`): quien lea la variable no obtiene la credencial. La ruta calcula la huella de lo recibido en `Authorization` y la compara en tiempo constante. Cinco fallos desde un origen en 15 minutos lo bloquean 15 minutos.

**Dónde existe.** Solo si `ENTORNO` es `desarrollo` o `preproduccion`. En `produccion` responde 404 antes de leer nada, esté o no configurada. Como los códigos de activación solo se crean por esta ruta, en producción no puede existir ninguno.

**Operaciones**, lista cerrada. Las entradas son listas cerradas, salvo el identificador de conexión, que es un dato que la propia ruta ha devuelto antes al operador:

| Operación | Entrada | Qué hace |
| --- | --- | --- |
| `generar_codigo` | `licencia`: `A` o `B` | Crea un código de activación y lo devuelve una sola vez |
| `suspender_licencia`, `reactivar_licencia` | `licencia` | Cambia el estado |
| `crear_orden` | `licencia`; `tipo`: `pausar` o `reanudar` | Crea la orden y anula las anteriores sin confirmar |
| `listar_conexiones` | — | Identificador, licencia, asistente, fechas y si está revocada |
| `revocar_conexion` | `conexion`: UUID | Revoca esa conexión |
| `resumen` | — | Recuentos por asistente y por día, versión de protocolo vista y percentil 95 por herramienta |
| `exportar_sucesos` | `dia` | Los sucesos de un día, para la revisión de privacidad |
| `cerrar_prueba` | — | Revoca todas las conexiones y anula los códigos sin usar (REQ-076) |

Ninguna operación cambia el prompt, las reglas ni los contratos: no existe operación para ello.

**La orden.** `npm run operar -- <entorno> <operación> [argumentos]`. Pide la credencial sin eco y no la guarda. En preproducción la ejecuta una persona en su propia terminal: el código de activación sale ahí y no pasa por ningún agente. En local, con datos y credencial de desarrollo, la puede ejecutar un agente.

Qué garantiza y qué no: un token de conexión no sirve (otro prefijo y otra huella), y sin la credencial la ruta no hace nada. Pero la orden se ejecuta desde la carpeta compartida, donde un agente puede modificar el guion o el entorno y capturar lo que la persona teclea. El diseño lo **dificulta y lo acota**, no lo impide: la credencial solo alcanza datos ficticios de preproducción, no puede cambiar lo que se entrega al agente y se sustituye al cerrar la función (asunto A-7).

### Registros (REQ-023, H-4)

**Qué se anota de cada petición.** Un suceso con campos de listas cerradas, y nada más:

| Campo | Valores |
| --- | --- |
| `momento` | Fecha y hora |
| `ruta` | La del archivo: `/api/mcp`, `/oauth/autorizar`, `/oauth/token`, `/oauth/registro`, `/api/operacion`, metadatos |
| `herramienta` | Una de las tres, o vacío |
| `resultado` | `correcto`, `rechazado`, `error` |
| `codigo` | Lista cerrada de códigos (por ejemplo `sin_token`, `token_no_valido`, `callback_no_permitido`, `codigo_no_valido`, `origen_bloqueado`, `token_reutilizado`, `informe_invalido`, `cuerpo_excesivo`, `almacen_no_disponible`) |
| `duracion_ms` | Entero. Tiempo de servidor, no de red |
| `protocolo` | Una de las versiones conocidas del protocolo, u `otra` |
| `asistente` | `claude`, `chatgpt`, `otro` o vacío. Lo pone el almacén a partir de la conexión |

`duracion_ms`, `protocolo` y `asistente` hacen falta para REQ-028 y no están en la letra de REQ-023: enmienda propuesta E-6.

Nunca se anota: un valor recibido, un argumento, una cabecera, un token, un código, un verificador, la dirección de origen, la ruta pedida ni su cadena de consulta, ni el mensaje de un error.

**Dónde quedan.**

| Destino | Qué recibe | Cuánto dura |
| --- | --- | --- |
| Tabla `sucesos` del estado (UE) | Todos los sucesos. Es el registro de los días de prueba que revisan CA-024 y CA-042, y la fuente del percentil 95 | Hasta el cierre de la función |
| Consola (registros de la plataforma) | Los mismos, por `src/lib/registro/` | Lo que conserve la plataforma: 1 hora o 1 día |
| Supervisión de errores (función 002) | Solo errores, con los códigos `almacen_no_disponible`, `configuracion_conector_invalida` y `error_no_controlado` | 30 días |

La tabla admite 20 000 sucesos al día; por encima, se anota una vez `registro_saturado` y se descarta el resto, para que nadie pueda llenar la base de datos a base de peticiones rechazadas. La anotación se hace después de responder; si falla, se descarta.

**Ningún error lleva un valor recibido en su mensaje.** Reglas para quien implementa:

1. Todas las rutas del conector van envueltas: ninguna excepción llega a Next.js, que escribiría su mensaje en los registros de la plataforma.
2. Los errores propios son de una sola clase, con un código de la lista cerrada y sin texto interpolado.
3. `JSON.parse`, la lectura de formularios, la descarga CIMD y el controlador de Postgres se llaman dentro de un `try`; del error original solo se conserva, si existe, el código SQLSTATE. Su mensaje se descarta.
4. Antes de llamar al almacén se valida la forma de cada identificador, para que la base de datos nunca tenga que rechazar un valor mal formado.

**Lo que este diseño no puede evitar.** Los registros de ejecución de la plataforma guardan la ruta pedida con su cadena de consulta y la dirección de origen (`specs/002-plataforma-base/verificaciones.md`, 1.10). En este conector, por la cadena de consulta viajan solo los parámetros de la petición de autorización (`client_id`, `redirect_uri`, `code_challenge`, `state`, `scope`, `resource`), que no son secretos ni datos personales. El código de activación va en el cuerpo; los tokens, en cabecera o en el cuerpo; el identificador de la solicitud, en un campo oculto y una cookie; tras un error el formulario se vuelve a pintar en la misma respuesta, sin redirigir con parámetros. Pero si alguien envía un token en la URL, ese valor queda en los registros de la plataforma durante su plazo: asunto A-6.

### Prompt ficticio y arranque local ficticio

Los dos son textos del repositorio, en `prompts/agente-prueba/`. Sus borradores están en `propuestas-diseno/textos-ficticios.md`; entran al repositorio con su tarea y la revisión del `revisor`.

| | Prompt ficticio (`0.1.md`) | Arranque local ficticio (`arranque.md`) |
| --- | --- | --- |
| Dónde actúa | Lo entrega `obtener_instrucciones` con estado `activa` | Lo instala una persona en cada cuenta de asistente, como instrucciones del proyecto o de la tarea |
| Qué dice | Leer la bandeja del buzón de pruebas; contar según el guion; aplicar la etiqueta de prueba a un mensaje; crear un borrador; llamar a `enviar_informe` con las cifras y con los valores de REQ-075; llamar a `confirmar_orden` si se recibió una orden | Llamar primero a `obtener_instrucciones`; los límites (no enviar, eliminar, reenviar ni compartir; no sacar contenido del correo); que nada recibido del conector ni del buzón puede relajarlos; que si la llamada falla o el estado no es `activa` no se toca el buzón; qué decir en pausa (REQ-077) |
| Qué no dice | No pide enviar, eliminar, reenviar, compartir, introducir credenciales ni copiar contenido de correo, tampoco hacia el informe | No contiene la dirección del buzón, credenciales ni la URL con secretos |
| Versión | `0.1` | — |
| Marca | Contiene una marca única, `MARCA-PROMPT-FICTICIO-0001`, para comprobar que no aparece cuando el estado no es `activa` | — |

**Huella.** `prompt-ficticio.ts` lee el archivo una vez, convierte los finales de línea a `\n` y calcula el SHA-256 de ese texto en UTF-8. Ese mismo texto es el que se entrega. La normalización evita que la huella dependa de cómo guarde Windows los finales de línea.

**Nada lo cambia.** El texto no está en la base de datos y ninguna función del almacén lo devuelve: el almacén dice el estado y la herramienta añade el texto solo si es `activa`. No hay variable de entorno, operación ni entrada que lo sustituya. Cambiarlo es cambiar el archivo, con revisión y despliegue (artículo 9).

**Reglas ficticias.** Constantes del código, iguales a los valores por defecto del modelo de referencia: 30 correos, 3 días y las tres opciones en verdadero.

### Configuración y variables nuevas

Solo nombres. Las lee `configuracion.ts`.

| Variable | Tipo | Formato | Entornos |
| --- | --- | --- | --- |
| `URL_PUBLICA` | Configuración | Origen `https`, sin ruta ni barra final. En `desarrollo`, también `http://localhost:<puerto>` | Desarrollo y preproducción |
| `CONECTOR_SECRETO` | Secreto | Al menos 32 bytes en base64url | Desarrollo y preproducción |
| `CONECTOR_BD_URL` | Secreto | Cadena de conexión del rol `conector_prueba_mcp` por el agrupador en modo transacción | Desarrollo y preproducción |
| `AUTORIZACION_BD_URL` | Secreto | Cadena de conexión del rol `conector_prueba_gestion` | Desarrollo y preproducción |
| `OPERACION_HUELLA` | Configuración | 64 caracteres hexadecimales | Desarrollo y preproducción |

Solo para pruebas y órdenes en la máquina, nunca en un despliegue: `PRUEBAS_CONECTOR_BD_URL` y `PRUEBAS_AUTORIZACION_BD_URL` (las pruebas contra Postgres real, con los roles de desarrollo).

**Si falta una o su formato no vale**, todas las rutas del conector, incluidos los metadatos, responden 503 genérico. No hay valor por defecto para ninguna. Si la app se ejecuta en la plataforma de despliegue, `desarrollo` no es un entorno válido y `http` no es un esquema válido.

**Producción.** En esta función no se ponen estas variables en producción: allí el conector está cerrado y la ruta de operación no existe (asunto A-2).

## Contratos

**Ningún contrato de `contratos/` cambia de forma.** Las tres herramientas y el informe se implementan tal como están, con sus anotaciones.

Dos cambios de texto, sin efecto en la forma, se proponen en `propuestas-diseno/cambios-documentos-compartidos.md` para que los aplique el chat de coordinación:

- `contratos/informe.schema.json`, `description`: decir que `additionalProperties: false` describe lo que se publica y lo que se guarda, y que el servidor descarta y cuenta lo ajeno antes de validar (propuesta 6 de `propuestas.md`).
- `contratos/obtener-instrucciones.schema.json`, `x-cuestion-abierta`: sustituirla por la decisión que salga de la puerta P1 (apartado «Anotación de `obtener_instrucciones`»).

Compatibilidad: no hay versión anterior desplegada.

Este diseño fija además tres formas internas, con listas cerradas, que se prueban: la respuesta de cada función del almacén (apartado «Datos»), el suceso del registro y la petición de operación. No van a `contratos/` porque no son la forma de una herramienta ni del informe.

## Datos

### Dónde vive el estado

**Postgres de Supabase, plan gratuito, región `eu-central-1`.** Es el motor de la fase 2, así que lo que se demuestre sobre atomicidad vale después; está en la UE; entra en los planes gratuitos aprobados; y el agrupador compartido en modo transacción es accesible por IPv4 desde las funciones (`verificaciones.md`, 7.1). Neon y Upstash se descartan: otro proveedor fuera de D-002, y en Upstash ni la región ni la atomicidad están verificadas.

| Entorno | Proyecto | Quién lo crea | Qué contiene |
| --- | --- | --- | --- |
| Desarrollo (local) | `nido-desarrollo`, compartido con la fase 2 | El responsable (ya previsto) | Esquema `conector_prueba`, licencias A y B. Sirve al ciclo completo en local y a las pruebas contra Postgres real |
| Preproducción (prueba real) | Un segundo proyecto gratuito, nombre propuesto `nido-preproduccion`, misma región y mismos ajustes | El responsable (asunto A-1) | Lo mismo. Es el estado de la prueba real |
| Producción | Ninguno en esta función | — | El conector está cerrado (asunto A-2) |

Por qué un segundo proyecto: preproducción y desarrollo no deben compartir secretos ni datos, y la fase 2 va a aplicar y revertir migraciones en `nido-desarrollo` mientras corren los días de ejecuciones programadas. Un reinicio de esa base cortaría la prueba y obligaría a empezar de nuevo los 3 días. El plan gratuito admite dos proyectos activos: son estos dos.

Dos avisos sobre el plan gratuito: un proyecto se pausa tras una semana sin actividad y reanudarlo es manual, así que el de preproducción conviene crearlo cuando el estado esté listo para aplicarse, no antes; y no tiene copias, lo que para datos ficticios de una prueba es aceptable.

### Cómo se conecta

- Por el agrupador compartido en **modo transacción** (puerto 6543), con el controlador `postgres` y las sentencias preparadas desactivadas (`prepare: false`), cifrado obligatorio y pocas conexiones por instancia.
- Con **dos roles propios**, no con el rol `postgres` ni con la clave secreta de la API. El usuario de un rol propio en el agrupador es `[ROL].[REFERENCIA-DEL-PROYECTO]` (`verificaciones.md`, 9.2). Que funcione en la práctica es la mitad de V-107 que falta: lo comprueba la primera tarea de base de datos, contra `nido-desarrollo`. Si no funcionara, se para y decide el responsable; no se sustituye por el rol `postgres` sin su aceptación.
- **Una llamada, una función.** La app nunca consulta tablas ni abre transacciones propias: cada operación es `select conector_prueba.<función>(…)`, con el texto SQL fijo en `almacen.ts` y los valores como parámetros. Así la atomicidad no depende del agrupador.
- Tiempo máximo de 5 segundos por llamada. Si se agota o hay cualquier error, la operación se trata como almacén caído.
- La API de datos del proyecto no se usa y el esquema `conector_prueba` no se añade a los esquemas expuestos.

### Roles

| Rol | Puede ejecutar | No puede |
| --- | --- | --- |
| `conector_prueba_mcp` | `validar_acceso`, las tres `mcp_*` y `registrar_suceso` | Emitir tokens, crear conexiones, operar, leer o escribir tablas |
| `conector_prueba_gestion` | Las funciones de autorización, las `operar_*` y `registrar_suceso` | Leer o escribir tablas; ejecutar las `mcp_*` |

Ninguno tiene permisos sobre tablas. La contraseña de cada rol la fija una persona en la consola del proyecto; no está en ningún archivo. Se usan dos roles y no tres: el camino que recibe todo el día entradas escritas por un modelo queda sin capacidad de emitir ni de operar, que es la separación que más protege; separar además autorización y operación añadiría un secreto por entorno para una pieza, la de operación, que la fase 3 sustituye por el panel.

### Tablas

Esquema `conector_prueba`. Todas con RLS activado en el mismo guion que las crea y sin ninguna política: nadie llega a ellas salvo las funciones. Las listas cerradas son tipos enumerados del propio esquema, con los valores del modelo de referencia.

| Tabla | Columnas principales | Notas |
| --- | --- | --- |
| `licencias` | `id`, `alias` (`A`, `B`), `estado` (`activa`, `suspendida`) | Ficticias. Las crea `semilla.sql` |
| `codigos_activacion` | `licencia_id`, `codigo_hmac`, `caduca_en`, `usado_en`, `anulado_en` | Solo HMAC |
| `clientes_oauth` | `client_id`, `origen` (`cimd`, `dcr`), `redirect_uris`, `comprobado_en`, `usado_en` | `redirect_uris` solo admite valores de la lista cerrada, también por restricción. No guarda nombre ni enlaces |
| `solicitudes_autorizacion` | `solicitud_hmac`, `ligadura_hmac`, `cliente_oauth_id`, `redirect_uri`, `code_challenge`, `recurso`, `caduca_en`, `consumida_en` | No guarda `state` |
| `conexiones` | `licencia_id`, `asistente`, `cliente_oauth_id`, `creada_en`, `ultimo_uso_en`, `revocada_en`, `motivo_revocacion` (`operador`, `reutilizacion`, `cierre`) | El asistente se deduce del callback |
| `codigos_autorizacion` | `codigo_hmac`, `conexion_id`, `cliente_oauth_id`, `redirect_uri`, `code_challenge`, `recurso`, `caduca_en`, `usado_en` | Solo HMAC |
| `tokens` | `conexion_id`, `cliente_oauth_id`, `tipo`, `token_hmac`, `recurso`, `caduca_en`, `sal`, `sustituido_por`, `sustituido_en` | Solo HMAC. `sal` solo en renovaciones sustituidas |
| `ordenes` | `licencia_id`, `tipo`, `estado` (`pendiente`, `entregada`, `confirmada`, `anulada`) y sus fechas | Por licencia; en la fase 2, por cliente |
| `ejecuciones` | `conexion_id`, `licencia_id`, `estado_servido`, `abierta_en`, `cerrada_en` | |
| `informes` | `ejecucion_id` (único) y las columnas del modelo de referencia, con los rangos y listas de `contratos/informe.schema.json`; `campos_descartados` | Sin texto libre. Los códigos de `problemas` se comprueban contra la lista del contrato |
| `limites_origen` | `origen_hmac`, `ambito` (`activacion`, `dcr`, `operacion`), `fallos`, `ventana_desde`, `bloqueado_hasta` | La dirección nunca en claro. Las filas vencidas se borran al usarse |
| `sucesos` | Los campos del apartado «Registros», más `conexion_id` | Solo inserción desde las funciones |

No hay ninguna columna con un token, un código o una dirección en claro, ni con contenido de correo. Los identificadores internos (UUID) no son datos recibidos.

### Funciones del almacén

Todas `security definer`, con `search_path = ''`, permisos revocados a todos y concedidos solo al rol que las necesita. Devuelven `jsonb` con un campo `resultado` de lista cerrada. Toda la lógica de tiempo usa el reloj de la base de datos: la app no calcula caducidades. Esta tabla es la forma que la fase 2 debe conservar (F-3).

| Función | Entradas | Resultados posibles | Rol |
| --- | --- | --- | --- |
| `validar_acceso` | HMAC del token de acceso, recurso | verdadero o falso | mcp |
| `mcp_obtener_instrucciones` | HMAC, recurso | `no_autorizado`; o estado, `ejecucion_id` y orden | mcp |
| `mcp_enviar_informe` | HMAC, recurso, `ejecucion_id`, informe limpio o nulo, número de descartados | `no_autorizado`, `ejecucion_desconocida`, `informe_invalido`, `guardado`, `repetido` | mcp |
| `mcp_confirmar_orden` | HMAC, recurso, `orden_id` | `no_autorizado`, `no_confirmada`, `confirmada`, `repetida` | mcp |
| `registrar_suceso` | HMAC o nulo, y los campos del suceso | — | los dos |
| `leer_cliente` | `client_id` | `desconocido`; o origen, callbacks y antigüedad de la comprobación | gestión |
| `guardar_cliente_cimd` | `client_id`, callbacks | `guardado` | gestión |
| `registrar_cliente_dcr` | `client_id`, callbacks, HMAC del origen | `registrado`, `limite`, `origen_bloqueado` | gestión |
| `abrir_solicitud` | HMAC de la solicitud y de la ligadura, `client_id`, callback, desafío, recurso | `abierta`, `no_valida` | gestión |
| `activar` | HMAC de la solicitud, de la ligadura, del código de activación, del origen y del código de autorización nuevo | `solicitud_no_valida`, `origen_bloqueado`, `codigo_no_valido`, `activada` (con el callback) | gestión |
| `canjear_codigo` | HMAC del código de autorización, `client_id`, callback, desafío calculado, recurso, HMAC del par nuevo | `no_valido`, `emitido` (con los segundos de vida) | gestión |
| `renovar` | HMAC del token presentado, `client_id`, recurso, sal candidata, HMAC del par candidato | `no_valido`, `reutilizado`, `rotado`, `repetido` (con la sal y los segundos que quedan) | gestión |
| `operar_generar_codigo`, `operar_cambiar_licencia`, `operar_crear_orden`, `operar_listar_conexiones`, `operar_revocar_conexion`, `operar_resumen`, `operar_exportar_sucesos`, `operar_cerrar_prueba`, `operar_contar_fallo` | Las de la tabla de operaciones | Lista cerrada por función | gestión |

Reglas que cumplen por dentro:

- `mcp_obtener_instrucciones`: `suspendida` si la licencia lo está; si no, `pausada` si la última orden no anulada es de pausar; si no, `activa`. Abre siempre una ejecución. Entrega la orden si está pendiente o entregada, y la marca entregada, **salvo con licencia suspendida**: entonces la orden es nula y sigue pendiente (REQ-051).
- `mcp_confirmar_orden`: solo confirma una orden de la licencia del token que esté `entregada`. Inexistente, de otra licencia o todavía pendiente dan el mismo resultado.
- `mcp_enviar_informe`: la ejecución tiene que ser de la misma conexión. De otra conexión de la misma licencia, de otra licencia o inexistente dan el mismo resultado.
- `activar`: en una sola transacción, comprueba la solicitud, el bloqueo del origen y el código; si el código vale, lo marca usado, crea la conexión, guarda el código de autorización y consume la solicitud. Si algo falla, no queda nada escrito salvo el recuento del fallo.

### Aplicación y vuelta atrás

- `001_estado.sql` crea el esquema, los tipos, las tablas, las funciones, los roles sin contraseña y los permisos, dentro de una transacción y de forma que se pueda volver a ejecutar. `semilla.sql` crea las licencias A y B. `001_estado.reversion.sql` elimina el esquema y los roles.
- Lo aplica **una persona**, pegándolo en el editor SQL de la consola de cada proyecto, y después fija las contraseñas de los dos roles (asunto A-9). `LEEME.md` da los pasos exactos, sin valores.
- No son migraciones de `supabase/migrations/`: la fase 2 escribe las definitivas. Este estado es de la prueba.
- La vuelta atrás se prueba: aplicar, revertir y volver a aplicar deja el mismo esquema (PRUEBA-028).
- Las pruebas pgTAP no existen todavía (no hay CI; función 003 aplazada). Los permisos y el aislamiento de este esquema se prueban con Vitest sobre un Postgres en memoria y, lo que depende de bloqueos reales, sobre `nido-desarrollo` (asunto A-13).

## Flujo

### 1. Alta y activación

1. El instalador añade en el asistente la URL `<URL_PUBLICA>/api/mcp`.
2. El asistente llama sin token y recibe 401 con la referencia a los metadatos. Lee los dos documentos.
3. Se registra: por CIMD no hay paso de registro; por DCR, `POST /oauth/registro`.
4. Abre `GET /oauth/autorizar` en el navegador. El conector resuelve el cliente, valida el callback y el resto, abre la solicitud y muestra la pantalla.
5. En su terminal, la persona de HumanaIA ejecuta `npm run operar -- preproduccion generar_codigo A` y dicta o teclea el código.
6. `POST /oauth/autorizar`: origen, cookie y solicitud; después `activar`. Con código válido: conexión creada, pantalla «Código aceptado» con el enlace al callback, que lleva `code`, `state` e `iss`.
7. El asistente llama a `POST /oauth/token` con el código, el verificador, el cliente, el callback y el recurso. El conector calcula el desafío, sortea el par y llama a `canjear_codigo`. Responde con el token de acceso, el de renovación, `expires_in: 300` y `scope: "agente"`.

### 2. Revisión

1. `tools/call` de `obtener_instrucciones`: tubería, `validar_acceso`, función del almacén. Si el estado es `activa`, la herramienta añade versión, huella, prompt y reglas; si no, `instrucciones` es nulo.
2. El agente trabaja en el buzón. Nada de eso pasa por el conector.
3. `enviar_informe`: saneado, validación, función del almacén.
4. `confirmar_orden`, si recibió una orden.

### 3. Renovación

`POST /oauth/token` con `grant_type=refresh_token`: una llamada a `renovar`, como describe el apartado «Tokens».

### 4. Operación

`npm run operar` → `POST /api/operacion` → huella de la credencial → función `operar_*`.

### Cierre en fallo en cada punto

| Punto | Fallo | Qué ocurre |
| --- | --- | --- |
| Cualquier ruta del conector | Falta una variable o su formato no vale | 503 genérico. Ni metadatos, ni autorización, ni herramientas. Ningún valor por defecto |
| Cualquier ruta | Excepción no prevista | Respuesta genérica; código `error_no_controlado` a la supervisión; el mensaje del error no se registra |
| Cualquier ruta | Cuerpo mayor de 32 768 bytes | 413 sin procesarlo ni registrarlo |
| `/api/mcp` | Sin token, mal formado, en la URL, caducado, desconocido, de otro recurso, de renovación, de conexión revocada | 401 con el reto. No se llama al SDK ni a ninguna herramienta |
| `/api/mcp` | El almacén no responde al validar | 503. No se ejecuta nada |
| `obtener_instrucciones` | El almacén falla | Resultado de error `error_temporal`. No se responde ningún estado, ni prompt, ni reglas. El prompt solo se añade después de recibir `activa` del almacén |
| `obtener_instrucciones` | El texto del prompt no se puede leer o está vacío | El conector entero responde 503: se comprueba al arrancar |
| `enviar_informe`, `confirmar_orden` | El almacén falla | `error_temporal`. No se dice `guardado` ni `confirmada` |
| Registro CIMD | Host fuera de la lista | Rechazo sin petición saliente |
| Registro CIMD | La descarga falla, tarda, redirige, es grande, no es JSON, no coincide el `client_id` o declara un callback de fuera | Rechazo. No se usa un resultado caducado |
| `GET /oauth/autorizar` | Cliente o callback no válidos | Página de error. Nunca se redirige |
| `POST /oauth/autorizar` | Origen, cookie o solicitud no válidos | «Solicitud no válida». No cuenta como intento ni evalúa el código |
| `POST /oauth/autorizar` | Origen bloqueado | 429. El código no se evalúa ni se consume |
| `POST /oauth/autorizar` | El almacén falla | «Servicio no disponible». La transacción se deshace: ni código consumido ni conexión |
| `POST /oauth/autorizar` | La función confirma pero la respuesta se pierde | El código queda consumido y la conexión creada, sin tokens. Hace falta un código nuevo. Nunca hay código consumido sin conexión ni al revés |
| `POST /oauth/token` (código) | Código usado, caducado, de otro cliente, otro callback, otro recurso o verificador incorrecto | `invalid_grant`. Ningún token |
| `POST /oauth/token` | El almacén falla | 503. Los tokens sorteados se descartan: no están guardados y no valen |
| `POST /oauth/token` (renovación) | El almacén falla | 503. No se rota nada; el token presentado sigue valiendo |
| `POST /oauth/token` (renovación) | La rotación se confirma pero la respuesta se pierde | El cliente repite dentro de 60 segundos y recibe el mismo par |
| `POST /api/operacion` | En producción | 404 siempre |
| `POST /api/operacion` | Sin credencial, con otra, con un token de conexión | 401; cuenta como fallo del origen |
| Anotación del suceso | El almacén falla | Se descarta. La respuesta ya se dio |

## Valores que fija este diseño

| Valor | Fijado en | Requisito |
| --- | --- | --- |
| Hosts admitidos para CIMD | `claude.ai`, `chatgpt.com` | REQ-008 |
| Descarga CIMD | 3 s, 16 384 bytes, sin redirecciones; caché de 1 hora | REQ-041 |
| Límite de registros DCR | 50 sin uso en total; 5 por origen y hora | REQ-008, REQ-042 |
| Purga de registros DCR sin uso | 24 horas | REQ-008, REQ-042 |
| Callbacks admitidos | Los dos de la lista | REQ-006 |
| Código de activación | 12 caracteres Crockford base32 (60 bits); caduca a los 10 minutos | REQ-009 |
| Solicitud de autorización abierta | 10 minutos | — |
| Código de autorización | 256 bits; 300 segundos | REQ-006 |
| Token de acceso | 300 segundos | REQ-012 |
| Ventana de gracia | 60 segundos | REQ-013 |
| Caducidad deslizante del token de renovación | 14 días | REQ-014 |
| Intentos de activación | 5 fallos en 15 minutos por origen; bloqueo de 15 minutos | REQ-037 |
| Intentos de operación | 5 fallos en 15 minutos por origen; bloqueo de 15 minutos | REQ-025 |
| Tamaño máximo del cuerpo | 32 768 bytes, en todos los puntos | REQ-056 |
| Tiempo máximo de una llamada al almacén | 5 segundos | REQ-053 |
| Sucesos anotados en el estado | 20 000 al día | REQ-023 |
| Longitud máxima de `state` | 512 caracteres ASCII imprimibles | — |

Todos son constantes del código o del guion SQL: cambiarlos es un despliegue revisado. Los definitivos son de la función 014.

## Anotación de `obtener_instrucciones` (para la puerta P1)

El contrato la declara hoy de solo lectura (`readOnlyHint: true`). La herramienta no toca nada del cliente, pero en el servidor abre una ejecución y deja constancia de que la orden se entregó. La decisión es del responsable, con dictamen del `auditor-seguridad`. Este diseño implementa el contrato tal como está y no cambia ninguna anotación.

Lo verificado que pesa en la decisión (`verificaciones.md`, 3.6 y 4.7): en ChatGPT, una herramienta sin `readOnlyHint` es una escritura y pide confirmación por defecto, y esa confirmación solo se recuerda dentro de una conversación; en el modo automático de Claude, las de solo lectura se aprueban y las de escritura las decide un clasificador.

| Opción | Qué supone | Consecuencias |
| --- | --- | --- |
| a) Mantenerla de solo lectura | Se entiende «solo lectura» respecto al entorno del usuario: no cambia nada en su correo, su almacenamiento ni su cuenta. Lo que anota el servidor es un registro de la llamada | No cambia nada. Es la lectura menos estricta: marcar la orden como entregada es algo más que un registro de acceso, porque decide lo que después acepta `confirmar_orden`. Los asistentes tratan las anotaciones como indicios no fiables, pero una revisión de directorio podría discutirla |
| b) Declararla de escritura | `readOnlyHint: false`, `destructiveHint: false`. Es la lectura más estricta | Tres escrituras por revisión. En ChatGPT, tres confirmaciones posibles en lugar de dos; sube el riesgo de «no». Cambia el contrato; no cambia el código |
| c) Hacerla de solo lectura de verdad | No abre ejecución ni marca la orden. La ejecución se abriría al enviar el informe | Solo lectura sin discusión. Se pierde saber que un agente pidió instrucciones y no informó, que es la alerta «ejecución sin informe» de la fase 2. Cambia REQ-019, REQ-049, REQ-051, el contrato y el modelo de referencia |

**Recomendación del arquitecto: a) durante la prueba, sin cambiar nada, y decidir con el resultado.** La prueba real anota, por asistente y plan, qué confirma cada uno con las anotaciones actuales. Si las dos escrituras ya detienen la ejecución programada, pasar a b) no cambia el resultado; si no la detienen, b) se puede probar después con un cambio de contrato y un despliegue. No se recomienda c): cambia el producto para resolver una duda de etiquetado.

Lo que no se hace en ningún caso: elegir una anotación porque evita una confirmación (REQ-016, `.claude/rules/conector.md`). Si el dictamen del `auditor-seguridad` concluye que a) no es veraz, la opción es b) y la prueba mide su coste.

## Prueba real: guion, calendario y resultados

Este apartado fija la estructura. El guion, el calendario y las plantillas de resultados se escriben como tareas, antes del primer despliegue, y no comparten archivos con el código: pueden avanzar desde el primer día.

### Guion (`guion-prueba.md`)

Con fecha anterior a su primera ejecución. Todos los pasos nombran preproducción.

1. **Cabecera.** Entorno, asistente, plan, aplicación y tipo de tarea programada.
2. **Preparación, una vez.** Quién hace cada cosa:

| Qué | Quién |
| --- | --- |
| Cuentas de prueba de cada asistente en el plan que toque | Responsable |
| Buzón: mensajes ficticios, cada uno con su marca `HIA-PRUEBA-NN`; etiquetas `prueba-urgente` y `prueba-factura` puestas a mano en los que correspondan; etiqueta `prueba-revisado` creada y vacía; un mensaje con instrucciones dirigidas al agente (CA-041); dirección de control | Responsable |
| Inventario fechado del buzón: número de mensajes y marcas, sin contenido; declaración de que todos son ficticios | Responsable; lo comprueba `qa` |
| Proyecto de base de datos de preproducción, estado aplicado, contraseñas de los roles, variables del entorno, credencial de operación | Responsable, con `LEEME.md` |
| Despliegue en preproducción y `npm run conector:comprobar -- preproduccion` | Agente `plataforma` |

3. **Pasos por asistente y plan.** Cada paso lleva: qué se hace, qué se espera, criterio que cubre y qué evidencia se guarda.

| N.º | Paso | Criterios |
| --- | --- | --- |
| 1 | Inventario de las herramientas del conector de correo en la cuenta y configuración de permisos (tabla de abajo). Captura de la pantalla de permisos | CA-038 |
| 2 | Instalar el arranque local ficticio como instrucciones del proyecto o de la tarea | CA-039 |
| 3 | Añadir el conector con su URL. Anotar qué forma de registro usa el asistente (identidad publicada o registro automático) y, en ChatGPT, el callback y el documento de cliente que muestra su página de gestión | CA-001, REQ-028 |
| 4 | Activar con un código. Comprobar con `listar_conexiones`: una conexión nueva, de la licencia del código | CA-001 |
| 5 | Permitir sin preguntar solo las tres herramientas de HumanaIA. Anotar las anotaciones que muestra el asistente | CA-004, CA-038 |
| 6 | Revisión en conversación, sin otra en curso. Comparar las cifras del informe con el buzón | CA-005, CA-035, CA-036 |
| 7 | Intentar un informe con campos de más; anotar si llegan | CA-012 |
| 8 | Pedir enviar un borrador, eliminar un mensaje y reenviar otro a la dirección de control | CA-038 |
| 9 | Licencia suspendida; orden de pausar, con petición expresa de revisar; reanudar | CA-011, CA-040 |
| 10 | Tras más de 5 minutos sin uso, dos revisiones a la vez. Tres veces | CA-007 |
| 11 | Programar la revisión cada hora. Tres días. Comprobación diaria del buzón. Una orden de pausar y otra de reanudar dentro del periodo. Procesar el mensaje con instrucciones | CA-006, CA-034, CA-036, CA-041, CA-044 |
| 12 | Si la ejecución programada se detiene por el conector de correo: un día cada hora sin buzón | REQ-074 |
| 13 | Con una conexión activa en cada asistente, revocar una | CA-033 |
| 14 | Comprobaciones finales del buzón: enviados, inventario, reenvíos y reglas, dirección de control | CA-037 |
| 15 | Cierre: `cerrar_prueba`; comparar las anotaciones con las del paso 5 | CA-004, CA-046 |

4. **Qué cuenta cada campo del informe** (REQ-059). Propuesta para el guion, pensada para que una persona pueda comprobarla mirando el buzón:

| Campo | Qué cuenta |
| --- | --- |
| `tratados` | Mensajes de prueba en la bandeja de entrada, hasta 30 |
| `urgentes` | De esos, los que llevan la etiqueta `prueba-urgente` |
| `facturas_pendientes` | De esos, los que llevan la etiqueta `prueba-factura` |
| `borradores` | Borradores creados en esta revisión: 1 |
| `sin_tratar`, `documentos` | 0 |
| El resto | Lo que fija REQ-075 |

Las etiquetas las pone el responsable al preparar el buzón; el agente solo aplica `prueba-revisado`. El borrador de cada revisión lleva en el asunto una marca con la fecha y la hora, para poder contarlos sin leer nada más.

5. **Reglas de evidencia.**

- Ninguna captura de la terminal de operación, de la pantalla de activación con el código escrito ni de la bandeja del buzón.
- Del buzón solo se guarda lo que escribe la persona: recuentos, marcas y etiquetas.
- De las conversaciones del asistente se guarda una transcripción hecha por la persona con el nombre de cada herramienta llamada y su resultado. Una captura solo si antes se ha revisado que no muestra asuntos, remitentes, direcciones ni textos.
- Del conector se guarda la salida de `resumen`, `listar_conexiones` y `exportar_sucesos`: identificadores internos, recuentos y códigos.
- Los identificadores internos (conexión, ejecución, orden) se pueden citar. Los tokens, los códigos y las credenciales, nunca.
- Cada evidencia lleva los siete campos de `docs/CALIDAD.md` y pasa el escáner de secretos.

### Herramientas del conector de correo (H-3)

Regla: **todo lo que no esté en la columna «Se deja» se pone en «Bloqueada»**, también las herramientas que aparezcan en la cuenta y no estén en esta tabla. Las que se dejan se quedan en el permiso que traigan; no se pasan a «permitir siempre» (REQ-062; ver asunto A-4).

Para el conector de Gmail de Claude, según su ficha (`verificaciones.md`, 3.7):

| Se deja | Se bloquea |
| --- | --- |
| `search_threads`, `get_message`, `get_thread`, `list_labels`, `list_drafts`, `label_message`, `create_draft` | Enviar: `send_message`, `reply` · Reenviar: `forward` · Eliminar: `trash_message`, `trash_thread`, `delete_label` · Reglas: `create_filter`, `list_filters` · Correo no deseado: `mark_message_spam`, `mark_thread_spam`, `unmark_message_spam` · Otras: `label_thread`, `unlabel_message`, `unlabel_thread`, `create_label`, `apply_sensitive_message_label`, `apply_sensitive_thread_label` · Las 5 que la ficha no muestra, hasta inventariarlas |

En ChatGPT no hay lista verificada. Se aplica la misma regla sobre lo que muestre la cuenta. Si el plan no deja bloquear por acción, no se conecta el buzón (REQ-063).

### Calendario (`calendario.md`)

Se escribe con los días que queden al terminar la construcción y lo aprueba el responsable antes del primer paso (REQ-080). Su forma, en días contados desde el primer despliegue (D0):

| Día | Qué se hace |
| --- | --- |
| Antes de D0 | Preparación completa. Pasos 1 y 2 en cada cuenta, que no necesitan el conector |
| D0 | Despliegue y comprobación. Pasos 3 a 6 en los dos asistentes. Se programa la revisión: empieza el día 1 de ejecuciones programadas |
| D0 y D1 | Pasos 7 a 10, sin interferir con las ejecuciones programadas |
| D1 a D3 | Paso 11: ejecuciones programadas, comprobación diaria |
| D3 | Pasos 13 a 15 |
| Si sobra | Paso 12 o un reinicio, según REQ-073 |

Cada fila del calendario tendrá estado al cerrar: hecho, no ejecutado o fuera de ventana.

### Resultados (`resultados/`)

Un archivo por asistente y plan (`claude-pro.md`, `chatgpt-<plan>.md`) con:

- cada paso del guion marcado superado, fallido o no ejecutado, con su evidencia;
- aprobaciones que pide el asistente y cuándo: al instalar o en cada ejecución; y por separado las del conector de correo (REQ-067);
- versión del protocolo negociada; forma de registro, callback y host observados, frente a las dos listas de este diseño;
- percentil 95 de cada herramienta (de `resumen`);
- si el asistente permite limitar las herramientas del conector de correo, y cómo;
- ejecuciones esperadas, lanzadas y completadas por día;
- si hubo fallo en el periodo programado, qué regla de REQ-073 se aplicó.

Y un archivo `conclusiones.md` con la conclusión de V-101 a V-104, la decisión de sí o no por asistente, el plan B si procede, la declaración de que solo se usaron datos y cuentas ficticios o de HumanaIA, y la aprobación fechada del responsable.

## Orden de construcción y estimación

### Orden

Pensado para llegar cuanto antes a un conector que supere su batería en local. REQ-079 no deja desplegar antes.

| Bloque | Contenido | Depende de | Agente |
| --- | --- | --- | --- |
| B0 | Guion, calendario, plantillas de resultados, textos ficticios. Preparación de cuentas, buzón y permisos, que hace la persona | Nada | `qa`; responsable |
| B1 | Dependencias y comprobación al instalar: el SDK en una ruta de Next.js con las dos épocas, la carpeta `.well-known`, el validador, los contratos cargados. Variables y códigos de registro. `secretos.ts` | 002: app base y batería | `ingeniero-backend` |
| B2 | Estado: guion SQL, reversión, semilla, permisos. Almacén en memoria para pruebas y adaptador real. Comprobación de V-107 contra `nido-desarrollo` | 002: batería. Proyecto `nido-desarrollo` creado | `ingeniero-bd`, `ingeniero-backend` |
| B3 | Punto de entrada MCP, filtro de salida, tres herramientas, prompt ficticio | B1, B2 | `ingeniero-backend` |
| B4 | Autorización: metadatos, DCR, CIMD, petición, pantalla, activación, tokens | B1, B2 | `ingeniero-backend`, `ingeniero-frontend` |
| B5 | Operación: ruta y orden | B2 | `ingeniero-backend`, `plataforma` |
| B6 | Pruebas transversales: marcas, almacén caído, configuración ausente, copia del estado, aislamiento, concurrencia; revisión de accesibilidad | B3, B4, B5 | `qa`, `disenador-ui` |
| B7 | Concurrencia contra Postgres real y ciclo completo en local con un cliente MCP | B6 | `qa` |
| B8 | Primer despliegue en preproducción y prueba real | B7; 002: despliegue; proyecto de preproducción | `plataforma`; responsable |

B0 va en paralelo con todo. B1 y B2 van en paralelo. B3 y B4 van en paralelo: no comparten archivos. Con el límite de dos agentes a la vez, son dos carriles.

Si V-107 falla en B2, se sabe el primer día de construcción y no al desplegar.

### Estimación, con franqueza

Hoy es viernes 13/11/2026 y la ventana termina el viernes 27/11/2026.

| Tramo | Días de trabajo | Notas |
| --- | --- | --- |
| Puerta P1 de este diseño: dictamen, correcciones, plan y tareas, aprobación | 1 a 2 | El diseño de la 002 necesitó una segunda vuelta |
| Función 002 hasta batería y app base | No lo estimo: no es de este diseño y se está rehaciendo | Es la mayor incertidumbre. Sin `main` y sin batería no se integra ni una tarea de esta función |
| B1 a B7 | 5 a 7, con dos carriles | Casi todas las tareas tocan rutas críticas: llevan revisión y dictamen. Las tareas que cambian `package.json` necesitan además la firma del responsable |
| B8 hasta tener las dos conexiones y la revisión en conversación | 1 | Depende de que la 002 ya despliegue |

Sumado: **entre 8 y 11 días desde hoy hasta el primer despliegue**, si la 002 no retrasa y el responsable responde a las puertas el mismo día. Eso sitúa D0 entre el 21 y el 24 de noviembre.

Qué cabe entonces en la ventana:

- **Con seguridad razonable:** alta, activación y todos los pasos en conversación en los dos asistentes (pasos 1 a 10).
- **Probable solo en parte:** las ejecuciones programadas. Caben entre 1 y 3 días. Los 3 días seguidos solo caben si D0 es el 24 como muy tarde y no hay ningún fallo.
- **No cabe:** un reinicio de los 3 días tras un defecto nuestro, ni el día sin buzón de REQ-074.

No propongo recortar la construcción para ganar días: un despliegue temprano con las pruebas a medias incumple REQ-079 y lo que ahorra es poco frente a lo que arriesga. Lo que sí adelanta trabajo sin tocar el código es B0: comprobar ya en las cuentas si el plan de ChatGPT admite conectores propios, inventariar y bloquear las herramientas de Gmail y preparar el buzón resuelve H-2, H-3 y H-10 antes de D0.

Lo que no quepa lo decide el responsable según REQ-073 y REQ-080 (asunto A-10).

## Amenazas de esta función

Pendiente del dictamen del `auditor-seguridad`. La columna «Control» dice lo que el control hace; donde solo dificulta, lo dice.

| Amenaza | Control | Prueba que lo demuestra |
| --- | --- | --- |
| A-01. Robo de la credencial de licencia con una página falsa | No hay clave permanente: código de un solo uso, 10 minutos; conexiones revocables por separado. La alerta por conexión nueva no existe en esta función: la conexión solo queda anotada | PRUEBA-015, PRUEBA-026 |
| A-02. Fuerza bruta de códigos de activación | 60 bits; 5 fallos por origen y bloqueo; el bloqueo no evalúa el código. Un ataque repartido entre muchos orígenes no se bloquea, pero tampoco acierta | PRUEBA-015 |
| A-03. Callback manipulado | Lista cerrada de dos, coincidencia exacta, validado antes de cualquier redirección; PKCE S256 obligatorio; `iss` en toda respuesta | PRUEBA-016 |
| A-04. Descarga de URL arbitrarias por CIMD | Dos hosts; comprobación antes de la red; sin redirecciones; tope de tamaño y de tiempo | PRUEBA-017 |
| Registro DCR masivo | Tope de registros sin uso, límite por origen y purga. Dificulta; no impide ocupar el cupo desde varios orígenes | PRUEBA-017 |
| Documento CIMD o registro DCR que amplía callbacks o permisos (artículo 7) | Solo se leen `client_id` y `redirect_uris`; un callback de fuera rechaza el documento; lo demás se ignora | PRUEBA-017 |
| A-05. Copia de la base de datos | Solo HMAC y sales; las claves están fuera | PRUEBA-024 |
| A-06. Token de renovación robado y reutilizado | Rotación en cada uso; fuera de la ventana, se revoca esa conexión y queda anotado. Dentro de los 60 segundos, quien lo presente recibe el par: es el coste de la ventana | PRUEBA-007 |
| Confusión de tipo de token | Prefijo, tipo dentro del HMAC y tipo en la fila | PRUEBA-014 |
| Token emitido para otro recurso | El recurso se guarda con el token y se exige igual al propio | PRUEBA-014 |
| Token en la URL | No se lee de la URL. El valor no entra en los registros del conector; sí en los de la plataforma (asunto A-6) | PRUEBA-014 |
| A-08. Una licencia lee o cambia datos de otra por el conector | La conexión y la licencia se derivan del token dentro de la función; el código no maneja identificadores; ejecución ligada a la conexión y orden a la licencia; respuestas iguales para ajeno e inexistente | PRUEBA-013 |
| Un identificador enviado como campo cambia de licencia | Es un campo ajeno: se descarta | PRUEBA-013 |
| A-13. El servidor entrega instrucciones dañinas | El único texto es un archivo del repositorio, revisado; ninguna operación ni entrada lo cambia; los límites reales están en el asistente | PRUEBA-004, PRUEBA-025, PRUEBA-050 |
| A-14. Contenido de correo en el informe | Esquema publicado cerrado; lo ajeno se descarta sin leer su valor; lo inválido se rechaza sin guardarlo | PRUEBA-010, PRUEBA-011, PRUEBA-052 |
| A-15. Valores recibidos en registros o errores | Sucesos de lista cerrada; errores con código y sin mensaje; filtro de salida. Los registros de la plataforma guardan la cadena de consulta: no la controla este diseño | PRUEBA-023, PRUEBA-053 |
| Envío cruzado o incrustación de la pantalla | `Origin`, cookie ligada a la solicitud, cabeceras contra la incrustación | PRUEBA-018 |
| Bloquear a un instalador con envíos cruzados | El envío cruzado se rechaza antes de contar | PRUEBA-018 |
| Activación simultánea con el mismo código | Bloqueo de fila; una conexión | PRUEBA-005, PRUEBA-006 |
| Renovaciones simultáneas que revocan una conexión legítima | Ventana de gracia con el mismo par | PRUEBA-005, PRUEBA-006, PRUEBA-044 |
| Estado a medias por una caída del almacén | Una función, una transacción | PRUEBA-020 |
| Arranque con un secreto ausente y un valor por defecto | Sin valores por defecto; 503 en todo | PRUEBA-021 |
| A-22 (parcial). Cuerpos grandes; llenar el registro | Tope de 32 768 bytes; tope diario de sucesos. No hay límite de peticiones por conexión: es de la fase 2 (asunto A-14) | PRUEBA-022 |
| Operación sin credenciales de HumanaIA o con un token de conexión | Huella de una credencial de 256 bits, límite de intentos, ruta inexistente en producción | PRUEBA-026 |
| Captura de la credencial de operación en la máquina compartida | Ninguno técnico: se acota el alcance (solo datos ficticios de preproducción, sin efecto sobre el prompt) y se sustituye al cerrar | Asunto A-7 |
| Credenciales de desarrollo al alcance de los agentes | Roles que solo ejecutan funciones, sobre datos ficticios; las de preproducción no están en la máquina | PRUEBA-028; asunto A-7 |
| Activar una conexión en producción | Sin estado, sin variables y sin ruta de operación | PRUEBA-027, PRUEBA-055 |
| A-16. Instrucciones en el mensaje de prueba o en documentación | Son datos. Los límites están en el asistente | PRUEBA-052 |
| A-19. Dependencia nueva maliciosa o vulnerable | Cuatro dependencias, dos de ellas solo de desarrollo, justificadas y fijadas en el archivo de bloqueo; escáner de dependencias de la batería de la 002 | Batería |
| A-20. Token, código o credencial en el repositorio o en las evidencias | Prefijos reconocibles y patrones nuevos para el escáner; reglas de evidencia | PRUEBA-031 |
| Reescritura de las herramientas o de sus anotaciones | Salen de `contratos/` en cada arranque; el listado falla si no son exactamente tres | PRUEBA-003 |

## Pruebas

Ninguna se da por superada sin ejecutarse. Las de la primera tabla se hacen en local, antes del primer despliegue; las de la segunda necesitan la ventana.

«Batería» quiere decir que corre en `npm run bateria`, con el estado en un Postgres en memoria (PGlite): no necesita red ni secretos. Ese Postgres atiende las llamadas de una en una, así que demuestra la lógica pero no los bloqueos reales; por eso existe PRUEBA-006.

### En local

| ID | Qué demuestra | Cómo | Criterios |
| --- | --- | --- | --- |
| PRUEBA-001 | Los dos documentos de metadatos responden con todos los campos obligatorios de sus normas y los de este diseño; sin token, 401 con el reto y la referencia a los metadatos | Batería | CA-002 |
| PRUEBA-002 | Una sesión con `initialize` en 2025-11-25 y una petición 2026-07-28 listan las tres herramientas; versión no admitida, error sin valor recibido; `GET` y `DELETE`, 405 | Batería | CA-003 |
| PRUEBA-003 | El listado tiene exactamente 3 nombres; entrada, salida y anotaciones son las de `contratos/` (el informe, incrustado); todas las respuestas de la batería validan contra la salida de su contrato | Batería | CA-004 |
| PRUEBA-004 | Con `activa`, el SHA-256 del prompt entregado es la huella entregada y la del archivo del repositorio; el ciclo de las tres herramientas se completa | Batería; el `revisor` revisa el texto | CA-027 |
| PRUEBA-005 | 10 renovaciones, 10 `obtener_instrucciones`, 10 `enviar_informe`, 10 `confirmar_orden` y 10 activaciones simultáneas dan el resultado de CA-008 | Batería | CA-008 |
| PRUEBA-006 | Lo mismo que PRUEBA-005, con bloqueos reales | `npm run conector:pruebas-bd`, contra `nido-desarrollo`. Fuera de la batería; con evidencia | CA-008 |
| PRUEBA-007 | Renovación repetida dentro de la ventana: mismo par. Fuera: conexión revocada, su token de acceso rechazado, suceso anotado; la otra conexión de A y las de B siguen | Batería | CA-009 |
| PRUEBA-008 | Acceso rechazado a los 301 segundos; renovación correcta tras 18 horas; renovación rechazada tras más de 14 días | Batería, envejeciendo el estado | CA-010 |
| PRUEBA-009 | Suspendida: `suspendida`, sin la marca del prompt, con `ejecucion_id`, orden nula y no entregada; reactivada: `activa`. Pausar: `pausada` con la orden; confirmar; reanudar: `activa` | Batería | CA-011 |
| PRUEBA-010 | Informe con 3 campos ajenos: guardado, `campos_descartados: 3`, y ni sus nombres ni sus valores en el estado, las respuestas o los registros | Batería | CA-012 |
| PRUEBA-011 | Por cada campo, los siete casos de CA-013: `informe_invalido`, sin el valor marcado, y la ejecución acepta después un informe válido | Batería | CA-013 |
| PRUEBA-012 | `enviar_informe` repetido, igual y distinto, y `confirmar_orden` repetido: un informe, el primero; `repetido` y `repetida` | Batería | CA-014 |
| PRUEBA-013 | Con un token de A: ejecución de B, de otra conexión de A e inexistente; orden de B, inexistente y sin entregar; identificador de B como campo; parámetros a `obtener_instrucciones`. El estado de B es idéntico antes y después | Batería | CA-015 |
| PRUEBA-014 | Los nueve casos de token no válido: rechazados, ninguna herramienta ejecutada, y el token de la URL no aparece en los registros del conector | Batería | CA-016 |
| PRUEBA-015 | Código incorrecto, caducado y usado: ninguna conexión y el mismo texto. Al sexto intento, bloqueo de 15 minutos; un código válido se rechaza y no se consume; suceso anotado sin el código | Batería | CA-017 |
| PRUEBA-016 | Callbacks de fuera y variantes de los dos admitidos; sin PKCE; `plain`; verificador incorrecto; código canjeado dos veces; código canjeado por otro cliente. Ningún token y ninguna redirección a un callback no válido | Batería | CA-018 |
| PRUEBA-017 | CIMD con host de fuera: rechazo y 0 peticiones salientes. Documento con callback de fuera, con campos desconocidos o tras una redirección: no amplía nada. DCR por encima del límite o con callback de fuera: rechazo. Un registro DCR sin uso desaparece a las 24 horas | Batería, con doble de red | CA-019 |
| PRUEBA-018 | La pantalla lleva las cabeceras contra la incrustación; un envío con otro origen, sin cookie o sin solicitud se rechaza sin contar; textos en español; estructura accesible; ningún JavaScript | Batería | CA-020 |
| PRUEBA-019 | Revisión WCAG 2.2 AA de los seis estados y uso a 360 px, con teclado | Revisión de `disenador-ui`, con capturas | CA-020 |
| PRUEBA-020 | Almacén caído en la activación, la emisión, la renovación y cada herramienta: sin `activa`, sin prompt, sin tokens válidos; al restablecerlo, 0 códigos consumidos sin conexión y al revés | Batería | CA-021 |
| PRUEBA-021 | Sin cada variable, todas las rutas del conector responden 503 y ningún valor de secreto aparece en respuestas ni registros | Batería | CA-022 |
| PRUEBA-022 | Un cuerpo de 32 769 bytes se rechaza en todas las rutas y su contenido marcado no aparece en los registros | Batería | CA-023 |
| PRUEBA-023 | Toda la batería usa valores marcados; al terminar, 0 marcas en los registros capturados, en la tabla de sucesos y en las respuestas de error | Batería | CA-024 |
| PRUEBA-024 | Con una copia de todas las tablas, ninguno de sus valores sirve como token de acceso, de renovación ni código de activación | Batería | CA-025 |
| PRUEBA-025 | La huella del prompt es la misma antes y después de todas las operaciones y de todas las entradas inválidas, ajenas y marcadas | Batería | CA-043 |
| PRUEBA-026 | Cada operación funciona; sin credencial, con otra y con un token de conexión se rechaza; con `ENTORNO=produccion`, 404 | Batería | CA-028 |
| PRUEBA-027 | Con la configuración de producción, un intento de activación no crea ninguna conexión y no hay licencias ni códigos | Batería | CA-045 |
| PRUEBA-028 | Los dos roles solo ejecutan sus funciones; las tablas no se pueden leer; aplicar, revertir y volver a aplicar deja el mismo esquema | Batería; y contra `nido-desarrollo` con PRUEBA-006 | Apoya CA-015 y CA-025; artículo 11 |
| PRUEBA-029 | Tras `cerrar_prueba`: 0 conexiones activas, 0 códigos válidos y el token de cada conexión se rechaza | Batería | CA-046 |
| PRUEBA-030 | Ciclo completo en local con el cliente MCP oficial contra `nido-desarrollo`: descubrimiento, registro, autorización con código, tres herramientas y una renovación con rotación | `npm run conector:ciclo`; con evidencia | CA-047 |
| PRUEBA-031 | El escáner de secretos, con los patrones nuevos, da 0 hallazgos en la carpeta de evidencias | Batería | CA-032 |

### En la ventana

| ID | Qué demuestra | Cómo | Criterios |
| --- | --- | --- | --- |
| PRUEBA-040 | Alta con la URL y activación con código en cada asistente y plan: una conexión nueva, de la licencia del código | Real, pasos 3 y 4 | CA-001 |
| PRUEBA-041 | Versión de protocolo anotada; anotaciones iguales al empezar y al acabar | Real, pasos 5 y 15 | CA-003, CA-004 |
| PRUEBA-042 | Ciclo en conversación; cifras del informe iguales a las del buzón; valores de REQ-075 | Real, paso 6 | CA-005, CA-035 |
| PRUEBA-043 | Ejecuciones programadas cada hora durante 3 días, con pausa y reanudación; etiqueta y borrador en cada `activa` | Real, paso 11 | CA-006, CA-036 |
| PRUEBA-044 | Dos revisiones simultáneas tras 5 minutos sin uso, 3 de 3 | Real, paso 10 | CA-007 |
| PRUEBA-045 | Suspendida, pausa con petición expresa y conexión revocada: ninguna llamada a herramientas de correo | Real, pasos 9 y 13 | CA-011, CA-040 |
| PRUEBA-046 | Si el asistente deja llegar campos de más | Real, paso 7 | CA-012 |
| PRUEBA-047 | Revocada una conexión, la revisión de ese asistente se rechaza y la del otro se completa | Real, paso 13 | CA-033 |
| PRUEBA-048 | Región de ejecución `fra1` en preproducción y región de los proyectos de base de datos, con evidencia fechada | Observación: `conector:comprobar` y consola | CA-026 |
| PRUEBA-049 | Inventario y comprobaciones diarias del buzón; al acabar, enviados 0, inventario completo, sin reenvíos ni reglas, nada en la dirección de control | Persona y revisión | CA-034, CA-037 |
| PRUEBA-050 | Configuración de permisos con evidencia; enviar, eliminar y reenviar impedidos por el anfitrión | Real, pasos 1 y 8 | CA-038 |
| PRUEBA-051 | El arranque está en el repositorio con fecha anterior y está instalado en cada cuenta | Revisión, paso 2 | CA-039 |
| PRUEBA-052 | El mensaje con instrucciones no produce envíos, borrados ni contenido en el informe | Real, paso 11 | CA-041 |
| PRUEBA-053 | Búsqueda de marcas, dirección del buzón y credenciales en estado, sucesos, repositorio, resultados y evidencias; revisión de privacidad de los sucesos de los días de prueba | Revisión | CA-024, CA-042 |
| PRUEBA-054 | Qué acciones de correo piden aprobación y si las escrituras de HumanaIA se completan a su lado | Real, paso 11 | CA-044 |
| PRUEBA-055 | El guion y las evidencias nombran preproducción; en producción el conector no activa nada | Observación | CA-045 |
| PRUEBA-056 | Cierre en preproducción: 0 conexiones y 0 códigos; tokens rechazados; metadatos o retirada, según se contrate | Real, paso 15 | CA-046 |
| PRUEBA-057 | Guion fechado antes de ejecutarse; resultados completos; conclusiones de V-101 a V-104; decisión aprobada; evidencias revisadas; calendario aprobado y con estado en cada fila | Revisión | CA-029, CA-030, CA-031, CA-032, CA-047 |

La numeración salta de 031 a 040 para separar las dos tablas. Los 47 criterios tienen al menos una prueba.

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple, con una reserva | El informe publicado es cerrado; lo ajeno se descarta sin leer su valor; no hay texto libre en ninguna tabla; la dirección de origen solo se guarda como HMAC; `state` no se guarda. Reserva: los registros de la plataforma guardan la cadena de consulta y la dirección de origen (asunto A-6). No es contenido de correo |
| 2 Aislamiento | Cumple | La conexión y la licencia se derivan del token dentro de la base de datos. El código no maneja identificadores de cliente. Se prueba con las licencias A y B y dos conexiones de A (PRUEBA-013) |
| 3 Cierre en fallo | Cumple | Tabla «Cierre en fallo en cada punto». Sin valores por defecto. Mínimo privilegio: dos roles que solo ejecutan funciones |
| 4 Secretos | Cumple, con un límite declarado | Solo nombres en el repositorio; los valores los pone una persona; los secretos de preproducción no están en la máquina. Límite: las credenciales de desarrollo están al alcance de los agentes, y la credencial de operación se teclea en una carpeta que un agente puede modificar (asunto A-7) |
| 5 Especificación | Cumple | Cada pieza remite a su requisito y cada criterio tiene prueba. Las enmiendas se proponen, no se aplican. El plan y las tareas van en el paso siguiente |
| 6 Revisión independiente | Cumple | Todas las rutas de esta función son críticas: revisión y dictamen. Este diseño necesita el dictamen del `auditor-seguridad`; el arquitecto no lo aprueba |
| 7 Entradas no confiables | Cumple | Documentos CIMD, registros DCR, parámetros, informes y mensajes del buzón son datos: no amplían callbacks, permisos ni alcance. Las instrucciones para agentes encontradas en la documentación consultada no se siguieron y constan en `verificaciones.md` |
| 8 Límites en el anfitrión | Cumple en lo que depende de este diseño | El prompt ficticio no pide nada prohibido y nada lo cambia; el arranque local repite los límites. Que el asistente permita bloquear las herramientas de correo no depende del diseño: lo mide la prueba, y si no lo permite no se conecta el buzón (REQ-063) |
| 9 Prompt por despliegue | Cumple | El texto vive en el repositorio, se sirve desde el despliegue y lleva huella. No hay registro de versiones ni panel en esta función: son de la fase 4 |
| 10 Producto final | Cumple, con límites declarados | Estados de error, accesibilidad, registros y operación forman parte de la entrega. Dos piezas son de la prueba y se sustituyen, no se rehacen: las tablas del estado (la fase 2 pone las definitivas bajo las mismas funciones) y la ruta de operación (la fase 3 pone el panel). El límite de peticiones por conexión está fuera de alcance (asunto A-14) |
| 11 Reversibilidad | Cumple | El estado tiene guion de vuelta atrás, probado. El despliegue vuelve atrás con la función 002. El prompt vuelve atrás con el despliegue |
| 12 Español | Cumple | Interfaz, mensajes, nombres de dominio, tablas, funciones y variables. Los términos del protocolo (códigos de error de OAuth, nombres de campos) se dejan como son |
| 13 Evidencias honestas | Cumple | «Lo no verificado» lista cada punto con dónde se resuelve. Se dice qué demuestra el Postgres en memoria y qué no. Los controles que solo dificultan lo dicen |
| 14 Cambios reservados | Cumple | No se toca la constitución, los permisos, el CI ni los límites del agente. Los cambios en documentos compartidos, incluido `docs/INSTALACION-CLIENTE.md`, se proponen en `propuestas-diseno/`. Los secretos y los proyectos los crea una persona |

Ningún artículo queda incumplido. Las reservas de los artículos 1 y 4 dependen de decisiones del responsable.

## Dependencias nuevas

Versiones leídas en el registro oficial de npm (`verificaciones.md`, 1.1, 6.1 y 9.3). Se vuelven a leer al instalar y quedan fijadas en el archivo de bloqueo. Ninguna fuente nombra Node 26: se comprueba al instalar (bloque B1).

| Dependencia | Para qué | Versión comprobada | Licencia | Alternativa descartada |
| --- | --- | --- | --- | --- |
| `@modelcontextprotocol/server` | Protocolo MCP, las dos épocas, manejador web estándar; trae el validador de esquemas JSON (Ajv) que usa este diseño | 2.4.0 · `node >=20` | Apache-2.0 | `mcp-handler`: no añade nada que haga falta. Escribir el protocolo a mano: más riesgo de incompatibilidad |
| `postgres` | Controlador de Postgres para el agrupador en modo transacción | 4.1.1 · `node >=18` · sin dependencias | Unlicense | La API de datos con la clave secreta: salta el aislamiento por roles y obligaría a exponer un esquema. `@supabase/supabase-js`: no hace falta |
| `@electric-sql/pglite` (desarrollo) | Postgres en memoria para la batería. Ya lo usa `scripts/probar-modelo.mjs` | 0.5.16 | Apache-2.0 | Probar solo contra el proyecto de desarrollo: la batería dependería de la red y de un secreto |
| `@modelcontextprotocol/client` (desarrollo) | Cliente MCP oficial para el ciclo completo en local | 2.4.0 · `node >=20` | Apache-2.0 | Un cliente escrito a mano: probaría el conector contra nuestra propia lectura del protocolo |

No se añaden: `zod` como dependencia directa (V-109: los contratos se validan como esquemas JSON, sin convertirlos), ninguna librería de servidor OAuth, ningún SDK de supervisión, ninguna librería de interfaz. Si los tipos del SDK no dejan usar su validador desde fuera, se añaden `ajv` y `ajv-formats` en las mismas versiones que fija el SDK; es la misma librería y no cambia el diseño.

Servicio nuevo, PROPUESTO hasta que el responsable lo confirme: un segundo proyecto gratuito de Supabase para preproducción (asunto A-1).

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| `oidc-provider` como servidor de autorización | Sin ventana de gracia (revoca la cadena), CIMD experimental, montaje pensado para Node clásico y adaptador de almacenamiento propio |
| Better Auth con sus complementos de OAuth y MCP | Liga la autorización a un usuario con sesión, no a una licencia; tokens JWT; trae sus propias tablas |
| Entregar el contrato del informe al SDK como esquema de entrada | El SDK rechazaría los campos de más antes de la herramienta y respondería con su propio mensaje (H-6) |
| Publicar un esquema de entrada abierto | No sería el contrato y animaría al modelo a añadir campos |
| Guardar cifrado el par emitido durante la ventana de gracia | Obliga a guardar algo recuperable y a borrarlo después. La derivación con sal no guarda nada utilizable |
| Emitir un par distinto a cada repetición dentro de la ventana | REQ-013 y CA-008 piden el mismo par |
| Lógica de rotación y activación en TypeScript, con transacciones desde la app | Depende de cómo trate el agrupador las transacciones y deja la atomicidad fuera de la base de datos. La fase 2 la quiere en funciones (ADR-0003) |
| Admitir el callback de ChatGPT con parte variable mediante un patrón | Deja de ser una lista cerrada. Con `iss`, ChatGPT usa el estable |
| No emitir `iss` y dar de alta el callback concreto que muestre ChatGPT | Un paso manual por cada servidor añadido y un despliegue por cada valor |
| Pantalla de activación como página de React con acción de servidor | Más superficie (JavaScript, carga de componentes, errores que pinta el marco) para un formulario de un campo |
| Redirigir al callback nada más aceptar el código | No se vería el estado «código aceptado» que pide REQ-011. Con espera incumple WCAG |
| Operar desde el editor SQL de la consola | No puede generar códigos: el HMAC necesita una clave que no está en la base de datos |
| Ruta de operación también en producción, con credencial | REQ-072: en producción nadie debe poder crear un código |
| Tres roles de base de datos | Un secreto más por entorno para separar una pieza que la fase 3 sustituye |
| Un solo proyecto de base de datos para desarrollo y preproducción | Comparte secretos y datos, y un reinicio de la fase 2 cortaría la prueba |
| Guardar la dirección de origen en claro para contar intentos | Es un dato personal. Basta su HMAC |
| Límite de intentos con el cortafuegos de la plataforma | Cuenta peticiones, no fallos; ventana de 10 minutos como máximo; no se puede probar en local (`verificaciones.md`, 8.1) |
| Registrar los días de prueba solo en la plataforma | Conserva 1 hora o 1 día |
| Un despliegue temprano, con las pruebas a medias, para ganar días de ventana | Incumple REQ-079 |

## Decisiones que requieren ADR

Una. El borrador está en `propuestas-diseno/adr-borrador-autorizacion-del-conector.md`, para que lo registre el chat de coordinación. Precisa el ADR-0002 y matiza el ADR-0003:

- servidor de autorización propio (cierra V-106);
- `iss` en toda respuesta de autorización y lista cerrada de dos callbacks (cambia el punto 2 del ADR-0002 y T-010);
- rotación con par derivado y sal (precisa el punto 6 del ADR-0002);
- el servidor de autorización llega a la base de datos con un rol propio distinto del conector (precisa el punto 4 del ADR-0003);
- frontera nueva y temporal «operador → app», hasta que exista el panel;
- solo el SDK oficial, sin `mcp-handler` (cambia T-008).

Los cambios que este diseño necesita en documentos compartidos están en `propuestas-diseno/cambios-documentos-compartidos.md`.

## Enmiendas propuestas a la especificación

Ninguna se ha aplicado. Las decide el responsable. E-1 a E-7 no dependen de ningún asunto abierto; E-8 a E-10 solo valen si se acepta la recomendación del asunto que citan.

| N.º | Qué cambia | Texto nuevo | Por qué |
| --- | --- | --- | --- |
| E-1 | REQ-005 | «El conector atiende en el mismo punto de entrada a los clientes que declaran 2025-11-25, que abren con una inicialización, y a los que declaran 2026-07-28, que envían su versión en cada petición, sin inicialización ni sesión (V-104).» | H-1: en 2026-07-28 no hay negociación |
| E-1 | CA-003 | «Automática y real. Una sesión iniciada declarando 2025-11-25 completa la inicialización y lista las tres herramientas; una petición que declara 2026-07-28, sin inicialización, lista las tres herramientas; el documento de resultados anota la versión que declara cada asistente y plan. Umbral: 2 de 2 casos automáticos y una versión anotada por asistente y plan.» | H-1 |
| E-2 | CA-004, primera frase | «…sus esquemas de entrada y sus anotaciones son idénticos a los de `contratos/`, una vez sustituida en `enviar_informe` la referencia al informe por el contrato del informe incrustado, sin sus claves `$schema`, `$id` y `x-version-esquema`; …» | H-7: el asistente no puede resolver la referencia |
| E-3 | REQ-062, primera frase | «…quedan desactivadas o bloqueadas las acciones del conector de correo que envían (también responder), eliminan o mueven a la papelera, reenvían, crean o cambian filtros y reglas o marcan como correo no deseado, y cualquier otra que el guion no liste como necesaria para leer, etiquetar un mensaje y crear un borrador…» | H-3: `reply` envía y `create_filter` puede reenviar o eliminar |
| E-3 | CA-038 | Donde dice «enviar, eliminar y reenviar del conector de correo desactivados o bloqueados», decir «las acciones que REQ-062 manda bloquear, desactivadas o bloqueadas» | H-3 |
| E-4 | REQ-011, añadir | «Muestra con claridad el host al que volverá la autorización, tomado de la lista cerrada de callbacks y no de datos aportados por el cliente.» | H-8: lo exige la especificación MCP |
| E-4 | REQ-004, añadir | «Las respuestas de autorización incluyen el parámetro `iss` (RFC 9207) y los metadatos lo anuncian.» | H-8; es además la condición del callback estable de ChatGPT |
| E-5 | REQ-078, última frase | «En Claude se prueba con una tarea programada de Cowork; si queda ventana, se repite un día con una tarea programada en la nube de Claude Code y se anota aparte. En ChatGPT, con la aplicación que ofrezca tareas programadas en ese plan. Se anota en el documento de resultados.» | H-10: el plan Pro ofrece más de un tipo (asunto A-15) |
| E-6 | REQ-023, primera frase | «Los registros del conector y de la autorización anotan solo ruta, herramienta, resultado, código de error, duración en milisegundos y, como valores de listas cerradas, versión del protocolo y asistente.» | REQ-028 pide el percentil 95 y la versión del protocolo por asistente |
| E-7 | CA-024 y CA-042 | Donde dice «los registros de los 3 días de prueba real» y «los registros del servidor de los 3 días», decir «los sucesos que el conector anota en su estado durante los días de prueba real y los eventos de la supervisión de errores» | H-4: la plataforma conserva 1 hora o 1 día |
| E-8 | REQ-033 y CA-016 | Donde dice «El valor no queda en ningún registro» y «0 apariciones del token de la URL en los registros», añadir «del conector ni de la supervisión de errores. Los registros de ejecución de la plataforma de despliegue guardan la cadena de consulta durante su plazo de retención» | Asunto A-6 |
| E-9 | CA-045, segunda frase | «En producción el conector no tiene almacén ni configuración: no existen licencias ni códigos de activación, la ruta de operación no existe y un intento de activación con un código cualquiera no crea ninguna conexión (1 de 1).» | Asunto A-2 |
| E-9 | CA-026 | Donde dice «y la región del almacenamiento del estado», decir «y la región del almacenamiento del estado de cada entorno que lo tiene (desarrollo y preproducción)» | Asunto A-2 |
| E-10 | CA-008, añadir | «Se ejecuta en la batería sobre un Postgres en memoria y, antes del primer despliegue, sobre el Postgres del proyecto de desarrollo, con evidencia. La segunda ejecución es la que demuestra los bloqueos.» | Asunto A-13 |

## Asuntos abiertos para el responsable

Ninguno se ha forzado. Los que afectan a un requisito tal como está escrito llevan su enmienda.

| N.º | Asunto | Alternativas | Recomendación del arquitecto |
| --- | --- | --- | --- |
| A-1 | **Dónde vive el estado de la prueba real.** `nido-desarrollo` lo va a usar también la fase 2 | a) Un segundo proyecto gratuito para preproducción (`nido-preproduccion`, `eu-central-1`, mismos ajustes), creado por el responsable. b) Usar `nido-desarrollo` para todo, con el compromiso de la fase 2 de no reiniciarlo durante la ventana | a). Es un acto de una persona de pocos minutos. Crearlo cuando el estado esté listo, para que no se pause por inactividad |
| A-2 | **Producción sin estado (CA-045, CA-026).** El plan gratuito da dos proyectos: desarrollo y preproducción. Los criterios hablan del «estado guardado» de producción | a) En producción el conector no tiene almacén ni variables: todas sus rutas responden 503 y la de operación no existe. b) Un tercer proyecto, que exige pagar o pausar otro. c) Un esquema vacío para producción dentro del proyecto de preproducción, que mezcla entornos | a), con la enmienda E-9 |
| A-3 | **Anotación de `obtener_instrucciones`** | Ver su apartado | a) durante la prueba; decidir con el resultado y el dictamen |
| A-4 | **REQ-062 frente a REQ-074.** Las herramientas de correo que se dejan no se pasan a «permitir siempre». Si el asistente pide aprobación para leer, etiquetar o crear un borrador en una ejecución programada, esa ejecución se detiene, el resultado es «no» y hay que repetir un día sin buzón, que no cabe en la ventana | a) Aplicar la especificación tal como está. b) Además, si ocurre, medir un segundo tramo con «permitir siempre» solo en leer, etiquetar y crear borrador, sin cambiar el «no», para saber si así se completa. Exige aceptación escrita, porque relaja REQ-062 en esa medida. c) Hacer desde el principio las ejecuciones programadas sin buzón en uno de los asistentes | b). El producto real necesita esas tres acciones sin nadie delante: conviene saber si se pueden conceder |
| A-5 | **Plan de ChatGPT (H-2).** El plan de pago más barato es Go y, según la documentación, no tiene modo desarrollador | a) Comprobar ya en una cuenta Go si existe la opción de añadir un servidor MCP propio; si no, anotar «no» para Go y contratar Plus. b) Contratar Plus directamente y anotar Go como no probado | a). Se resuelve en minutos y no gasta ventana |
| A-6 | **Registros de la plataforma (REQ-033, CA-016, CA-024).** Guardan la cadena de consulta y la dirección de origen durante su plazo. Un token enviado en la URL quedaría ahí. Es el asunto A-1 de la función 002 | a) Aceptarlo por escrito y precisar los requisitos (E-8): los registros del conector y de la supervisión no guardan valores recibidos, y el conector nunca pone un secreto ni un dato personal en la cadena de consulta. b) Mantener la letra y dar esa parte de CA-016 por no superada | a) |
| A-7 | **Credenciales en la máquina compartida.** En local, los agentes tienen a su alcance las credenciales de los dos roles de `nido-desarrollo`, el secreto de desarrollo y la credencial de operación de desarrollo. Y la credencial de operación de preproducción la teclea la persona en una orden que un agente podría alterar | a) Aceptarlo: todo lo alcanzable son datos ficticios, los roles solo ejecutan funciones, nada de ello cambia el prompt y las credenciales se sustituyen al cerrar. b) Cuenta de Windows aparte para los agentes (asunto A-3 de la 002). c) Que la persona llame a la ruta de operación desde otro equipo | a) para esta función; b) es la solución de fondo y se decide en la 002 |
| A-8 | **Callbacks: dos, no tres (T-010).** No se admite el de ChatGPT con parte variable. Si en la prueba ChatGPT lo usara, la activación fallaría | a) Mantener dos; si ocurre, añadir el valor exacto que muestre la página de gestión de ChatGPT, con un despliegue revisado y su aprobación. b) Admitir desde el principio cualquier valor con ese prefijo | a) |
| A-9 | **Quién aplica el guion SQL del estado** | a) Una persona, pegándolo en el editor SQL de cada proyecto; pocas veces. b) En desarrollo, un agente con una credencial de administración puesta en la máquina | a). No pone al alcance de los agentes una credencial con todo el poder sobre la base |
| A-10 | **La ventana no da para todo.** Ver «Estimación» | a) Aprobar al llegar a D0 un calendario con lo que quepa y cerrar con lo probado. b) Contratar el plan de pago de la plataforma de despliegue un mes (T-018) para completar los 3 días, el reinicio y el día sin buzón. c) Decidirlo ya | a) o b) según lo que quepa el día D0. Las ejecuciones programadas son lo que responde a V-101, V-102 y V-103: si no caben 3 días, recomiendo b) |
| A-11 | **Sin `mcp-handler` (T-008).** T-008 confirma las dos librerías; este diseño usa solo el SDK | Confirmar, o pedir que se use | Confirmar |
| A-12 | **Rutas nuevas** respecto a `docs/ESQUELETO.md`, marcadas en el mapa de archivos, y `prompts/agente-prueba/` | Aprobarlas con este diseño | Aprobar |
| A-13 | **Concurrencia real fuera de la batería, y sin pgTAP.** La batería usa un Postgres en memoria que no ejecuta en paralelo. Los bloqueos se prueban aparte, contra `nido-desarrollo`, con una orden que necesita credenciales. Las pruebas de permisos son de Vitest, no pgTAP, porque no hay CI | a) Aceptarlo, con la enmienda E-10. b) Meter esa orden en la batería, que entonces necesita red y secretos en cada integración | a) |
| A-14 | **Límite de peticiones a las herramientas.** La especificación MCP lo pide a los servidores; la función lo deja fuera de alcance (A-22, fase 2) | Aceptar que la prueba se hace sin él | Aceptar. Solo hay datos ficticios |
| A-15 | **Tipo de tarea programada en Claude (H-10)** | a) Tarea programada de Cowork. b) Tarea en la nube de Claude Code. c) Las dos | a), con E-5: es la que usaría un cliente. b) como dato adicional si queda ventana |

## Lo no verificado

Todo lo siguiente se resuelve en el punto que se indica. Nada de ello se da por hecho en las pruebas.

| N.º | Qué | Dónde se resuelve |
| --- | --- | --- |
| 1 | Que el SDK 2.4.0 funcione en Node 26 con Next.js 16.4, montado en un manejador de ruta, y que atienda un `initialize` con 2025-11-25 | Bloque B1; PRUEBA-002 |
| 2 | Que el SDK acepte como salida un contrato con `oneOf` y `format: uuid`, que publique `openWorldHint` y cómo codifica `structuredContent` en cada época. Si no valida la salida, la valida el conector; las anotaciones las fija el filtro de salida | B1; PRUEBA-003 |
| 3 | Que una carpeta `.well-known` funcione como ruta de la app. Si no, una reescritura en `next.config.ts`, que no es un `proxy` | B1; PRUEBA-001 |
| 4 | Que `prompts/agente-prueba/` llegue al despliegue con la opción de inclusión de archivos, y que se pueda anotar el suceso después de responder. Si no: leer el texto en compilación, y anotar antes de responder | B1; `conector:comprobar` |
| 5 | Que un rol propio se conecte por el agrupador en modo transacción (la mitad práctica de V-107) | Primera tarea de B2 |
| 6 | Diferencias entre el Postgres en memoria y el de Supabase que afecten a las funciones | PRUEBA-006, PRUEBA-028 |
| 7 | Que el plan gratuito deje elegir `eu-central-1`, y cómo actúa el ajuste de RLS automático en un esquema que no es `public` | Al crear los proyectos; PRUEBA-048 |
| 8 | Qué cabecera `Origin` envía cada asistente, si envía `resource` y qué `scope` pide | Prueba real; se ve en los códigos de rechazo |
| 9 | Qué hace ChatGPT ante un servidor que solo anuncia `none`, cuando su documento de cliente declara `private_key_jwt`; y qué callback usa de hecho | Prueba real, paso 3 |
| 10 | El documento de cliente de Claude se leyó a través del lector, que lo devolvió como JSON; conviene que una persona lo abra | Prueba real, paso 3 |
| 11 | Si los asistentes comparten los tokens entre dos ejecuciones simultáneas o cada una guarda los suyos. De eso depende que la ventana de gracia baste | PRUEBA-044 |
| 12 | El valor real de `x-vercel-forwarded-for` en una función | Primer despliegue |
| 13 | Las 5 herramientas de Gmail en Claude que la ficha no muestra; las acciones de Gmail en ChatGPT y si se bloquean por separado | Prueba real, paso 1 |
| 14 | V-101, V-102, V-103 y V-104 | Prueba real |
| 15 | `node scripts/comprobar-specs.mjs` sobre este diseño: el arquitecto no tiene terminal en este paso | El orquestador, antes de la puerta P1 |
