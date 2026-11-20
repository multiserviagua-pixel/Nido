# 001 · Diseño

Autor: `arquitecto` (opus, D-023) · Amenazas: `auditor-seguridad` (pendiente) · 19/11/2026, cuarta versión (corrige `dictamen-diseno-3.md`)

Numeración de la especificación del 14/11/2026; `RD-`/`CAD-`: anexo; «V§n»: `verificaciones.md`; «002§X»: apartado X del diseño de la 002. Siguen valiendo `propuestas-diseno/{textos-ficticios,adr-borrador-autorizacion-del-conector}.md`.

Lo anterior, cerrado según `dictamen-diseno-3.md`. Tercera vuelta: N-1 → paso 13, PRUEBA-023, R-8; N-2 → Datos, V-10, PRUEBA-008; N-3 → Configuración, PRUEBA-018; N-4 → C-4.

**D-025** (19/11/2026): «ancla», «cambio firmado», carpeta sellada y calendario firmado quedan en suspenso hasta la 003; rige 002§Integración y `plan.md`.

## Resumen

`/api/mcp` en la app de la 002, sin estado y en JSON, sobre `@modelcontextprotocol/server` 2.4.0 (2025-11-25 y 2026-07-28 en el mismo punto). Tubería propia antes del SDK; filtro de salida con los contratos; Ajv; lo ajeno se descarta y se cuenta; ningún identificador de cliente como entrada. Servidor de autorización propio (V-106): CIMD por URL exacta, DCR con límite, PKCE S256, `iss`, dos callbacks, pantalla HTML sin JavaScript. Tokens opacos guardados como HMAC; par de gracia derivado. Estado en `Nido` (`eu-north-1`, D-020), esquema `conector_prueba`, solo por funciones `security definer` con dos roles sin tablas; funciones en `arn1`.

## Lo que toma de la 002

Reutiliza sin repetir 002§Esqueleto, §App base (errores; `configuracion.ts`, único lector), §Supervisión, §Entornos (WAF de `/api/*`), despliegue, vuelta atrás, ventana y carpeta sellada. Integra tras el ancla y reúne lo reservado en **un cambio firmado**. Cambios pedidos a la 002:

- **C-1** `configuracion.ts`: grupo «conector» validado solo por las rutas del conector, no por `/api/salud`; con `ENTORNO=produccion` no se lee y el conector queda cerrado.
- **C-2** `codigos.ts` y etiqueta `codigo` de supervisión: `almacen_no_disponible`, `configuracion_conector_invalida`.
- **C-3** Órdenes de la persona (carpeta sellada): `operar` y `conector:ciclo`, solo con `preproduccion`.
- **C-4** `next.config.ts`: trazar `prompts/agente-prueba/` y `contratos/` en las rutas del conector; `inventario-rutas.json`: rutas de este diseño; en `/oauth/autorizar`, `Referrer-Policy: same-origin` (con `no-referrer` el `POST` llega con `Origin: null`): la regla global de `headers()` excluye esa ruta en su `source` y otra le pone `same-origin`, sin depender del orden (gana la última); la excepción va al inventario de cabeceras; PRUEBA-009.
- **C-5** 002§Ventana: el periodo programado empieza el día D, no en D+1.
- **C-6** Fase 2: no borra ni reinicia `conector_prueba` ni sus roles en `Nido` hasta el cierre de la 001.

## Piezas y responsabilidades

### Archivos

`(n)`: nueva respecto a `docs/ESQUELETO.md`, aprobada por delegación. Agente por defecto: `ingeniero-backend`.

| Ruta | Qué |
| --- | --- |
| `src/app/api/mcp/route.ts`; `src/mcp/entrada.ts` (n), `salida.ts` (n), `servidor.ts`, `herramientas/*.ts` | Punto MCP, tubería, filtro, tres herramientas |
| `src/mcp/esquemas/{contratos,sanear-informe}.ts`; `src/mcp/prompt-ficticio.ts` (n) | Contratos y Ajv; descarte; prompt y huella |
| `src/app/.well-known/oauth-protected-resource/[[...ruta]]/`, `.well-known/oauth-authorization-server/`; `src/app/oauth/{autorizar,token,registro}/` | Metadatos; autorización |
| `src/lib/oauth/{secretos,callbacks,metadatos,clientes,cimd,peticion,activacion,tokens,origen}.ts` | HKDF y HMAC; lista; CIMD/DCR; canje y rotación |
| `src/lib/oauth/pantalla.ts` | `ingeniero-frontend`, revisa `disenador-ui` |
| `src/lib/licencias/operaciones.ts`; `src/app/api/operacion/route.ts` (n) | Operaciones de HumanaIA |
| `src/lib/supabase/almacen.ts` (n), `conector.ts`, `autorizacion.ts` (n) | SQL fijo; rol mcp (único que importa `src/mcp/`); rol de gestión |
| `src/lib/registro/sucesos.ts` (n) | Suceso tras responder |
| `supabase/conector-prueba/` (n) | `001_estado.sql`, `.reversion.sql`, `semilla.sql`, `LEEME.md`, `raiz-supabase.crt` · `ingeniero-bd` |
| `prompts/agente-prueba/` (n) | `0.1.md`, `arranque.md` · revisa `revisor` |
| `scripts/conector/` (n) | `operar`, `ciclo-local`, `comprobar-conector`, `pruebas-bd` (`.mjs`) · `plataforma` |
| `tests/unit/conector/`, `tests/conector/` (n) | Batería y apoyo (PGlite, reloj, sumidero, doble de red) · `qa` |
| `specs/001-…/guion-prueba.md`, `calendario.md`, `resultados/`, `evidencias/` | `qa` y la persona |

### Punto MCP

`createMcpHandler` con `legacy: 'stateless'` y `responseMode: 'json'` (V§6.2; V-1). Sin `mcp-handler`. Tubería; cada fallo responde y termina:

1. Configuración del conector (C-1) → 503.
2. Solo `POST` → 405 `Allow: POST`.
3. `Origin` ausente o propio, `https://claude.ai`, `https://chatgpt.com` → 403.
4. Cuerpo ≤ 32 768 bytes leído con tope → 413.
5. `Authorization` = `Bearer hia_a_` + 43 base64url; consulta, cuerpo y cookies no se miran (token en la URL = sin token) → 401 con `WWW-Authenticate: Bearer resource_metadata="<URL_PUBLICA>/.well-known/oauth-protected-resource/api/mcp", scope="agente"`.
6. `validar_acceso` → 401 `invalid_token`; almacén caído → 503.
7. JSON (por `entrada.ts`) → `-32700`; lote o cuerpo que no sea objeto → `-32600`; `tools/call` con nombre ajeno → `-32602` sin eco.
8. SDK con petición sin `Authorization` ni `Cookie`; el HMAC del token va en un cierre, el token nunca entra.
9. Filtro: en `tools/list`, `inputSchema`, `outputSchema`, `title`, `description` y `annotations` del contrato (500 si no son exactamente tres); errores JSON-RPC con texto fijo y sin `data` salvo `supported` de `-32022`; `isError` ajeno → código fijo.
10. `registrar_suceso` tras responder; si falla, se descarta.

Emisor, recurso y metadatos salen de `URL_PUBLICA`, nunca de `Host`.

### Herramientas

Publicado: `entrada` del contrato; en `enviar_informe`, `informe.schema.json` incrustado sin `$schema`, `$id` ni `x-version-esquema`. Las herramientas se registran en el SDK con entrada abierta y sin `outputSchema`; valida el conector con Ajv (2020-12, estricto, formato `uuid` propio), también la salida antes de responder (`error_interno` si no valida).

`enviar_informe`: toma `ejecucion_id` e `informe`; del informe y `comprobaciones`, solo las claves propias del contrato, contando las demás (también `__proto__` y `constructor`) sin leer su valor; valida lo limpio; UUID mal formado → `ejecucion_desconocida`; el almacén recibe informe limpio o `null` y el recuento y decide: desconocida, `informe_invalido` (ejecución abierta), `guardado`, `repetido`. `obtener_instrucciones` ignora argumentos; `confirmar_orden` toma solo `orden_id`. Respuestas con `structuredContent` y texto con el mismo JSON; fallos sin forma en el contrato: `isError` con `error_temporal` o `no_autorizado`. Concurrencia por bloqueo de fila: una ejecución por llamada, un informe por ejecución (el primero; los demás `repetido`), una confirmación (las demás `repetida`).

### Servidor de autorización

Propio (V§1.7). `Cache-Control: no-store`, sin CORS.

- `/.well-known/oauth-protected-resource[/api/mcp]`: `resource`, `authorization_servers`, `scopes_supported` [`agente`], `bearer_methods_supported` [`header`].
- `/.well-known/oauth-authorization-server`: `issuer` sin barra final, tres puntos, `code`, `authorization_code` y `refresh_token`, `S256`, auth `none`, scopes `agente` y `offline_access`, `client_id_metadata_document_supported` (si hay URL comprobada) y `authorization_response_iss_parameter_supported` en `true` (condición de CIMD en Claude, V§3.4).
- `/oauth/registro` (DCR), `/oauth/autorizar` (GET pantalla, POST activación), `/oauth/token` (código y renovación; siempre emite renovación).

`iss` en toda vuelta al callback (RFC 9207; callback estable de ChatGPT, V§4.4). **Callbacks**, constante y comparación exacta: `https://claude.ai/api/mcp/auth_callback`, `https://chatgpt.com/connector_platform_oauth_redirect`; ni el variable de T-010 ni bucle local.

`GET /oauth/autorizar`: (1) cliente y (2) `redirect_uri` en la lista y del cliente, o página de error **sin redirigir**; (3) `response_type=code`, desafío de 43 a 128, `S256`, `resource` = `<URL_PUBLICA>/api/mcp` obligatorio, `state` ≤ 512 ASCII imprimibles, o redirección con `invalid_request`/`invalid_target`, `state` e `iss`; (4) otros `scope` se descartan.

**CIMD**: antes de cualquier red, `client_id` igual a una URL de una lista constante (`https:`, sin puerto, usuario ni fragmento, `hostname` exacto); sin URL comprobada (V-6), el metadato CIMD va en `false` y se usa DCR; sin redirecciones, 3 s, 16 384 bytes, red inyectable; `client_id` idéntico a la URL y todos los `redirect_uris` en la lista (si no, rechazo entero); nada más se guarda; todos públicos; caché 1 h, sin usar caducada. **DCR**: callbacks en la lista (`invalid_redirect_uri`), auth ausente o `none`, resto ignorado; 201 con `client_id` `dcr_` + 22 aleatorios; 50 sin uso en total y 5 por origen y hora; purga a 24 h sin activación, dentro de la propia función. Desde muchos orígenes se ocupa el cupo, no CIMD (A-22 completo: fase 2).

### Pantalla de activación

Manejador que devuelve HTML: sin JavaScript ni datos de la petición salvo `state`, escapado para HTML en el campo y codificado para URL en el enlace. `h1` «Activar el conector de HumanaIA»; «Vas a conectar: **claude.ai**» de tabla fija por callback; campo «Código de activación» con «Te lo da HumanaIA. Caduca a los 10 minutos y solo sirve una vez»; botón «Activar». Estados: código no válido, igual para incorrecto, caducado y usado (200, «El código no es válido o ha caducado. Pide uno nuevo a HumanaIA.»); bloqueo (429, «Demasiados intentos. Espera 15 minutos y pide un código nuevo a HumanaIA.»); solicitud no válida (400, «Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.»); no disponible (503, «No se ha podido completar. Inténtalo de nuevo en unos minutos.»); aceptado (200, «Código aceptado.» y enlace-botón «Continuar en claude.ai», sin redirección automática por WCAG 2.2.1).

Accesibilidad: `lang="es"`, un `h1`, etiqueta asociada, error con `role="alert"` y `aria-describedby`, foco al volver, objetivos ≥ 44 px, contraste AA, 360 px sin desplazamiento horizontal, teclado; `autocomplete="one-time-code"`. Colores de `docs/DISENO.md`.

Código: 12 Crockford base32 en tres grupos (60 bits), normalizado antes del HMAC, 10 min. `GET` abre una solicitud de 10 min (cliente, callback, desafío, recurso, HMAC de `state`) con identificador en campo oculto y cookie `__Host-activacion` (`HttpOnly`, `Secure`, `SameSite=Strict`), ambos solo como HMAC. `POST` exige `Origin` propio (nunca `null` ni otro), ambos de la misma solicitud vigente y `state` revalidado con el HMAC guardado; si no, «solicitud no válida» **sin contar intento**. Cabeceras: `Referrer-Policy: same-origin` (C-4) y CSP `default-src 'none'; style-src 'sha256-…'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`, más las demás globales de la 002. Intentos por origen = HMAC de `x-vercel-forwarded-for` (V§9.1; fijo en local; ausente fuera de local → rechazo sin evaluar, también en DCR y operación): 5 fallos en 15 min bloquean 15 min sin evaluar ni consumir; recuento dentro de la función que canjea. Activaciones simultáneas: bloqueo de fila, una conexión.

### Tokens

Opacos `hia_a_`/`hia_r_` + 43 base64url (256 bits). Guardado: `HMAC-SHA-256(clave, tipo:token)`, tipo también en la fila. `CONECTOR_SECRETO` → HKDF-SHA-256 con etiquetas de guardado, derivación, origen y ligadura; nada en la base de datos. Acceso 300 s, ligado a conexión, cliente y recurso. Renovación rotada en cada uso, deslizante 14 días (RD-014), mismo cliente. Gracia 60 s. Código de autorización 256 bits, un uso, 300 s; un segundo canje revoca la conexión (`reutilizacion`). Verificador PKCE: 43-128 caracteres no reservados.

Mismo par (`kd`: clave de derivación; `t`: token presentado): `acceso = HMAC(kd, "acceso" ‖ 0x00 ‖ t ‖ sal)`, `renovacion = HMAC(kd, "renovacion" ‖ 0x00 ‖ t ‖ sal)`, 32 bytes en base64url tras el prefijo. La app solo sortea la sal (128 bits, generador criptográfico), deriva y llama una vez a `renovar`, que bloquea la fila: vigente → guarda sal, marca sustituida e inserta el par; sustituida ≤ 60 s → devuelve sal y emisión, y la app deriva **el mismo par** (`expires_in` desde la emisión guardada); > 60 s → revoca **esa** conexión, `token_reutilizado`, `invalid_grant`; desconocida, caducada, de otro cliente, tipo o conexión revocada → `invalid_grant`. Con licencia suspendida los tokens siguen valiendo (para servir `suspendida`); revocar es fechar la conexión y toda validación lo exige. Se busca el HMAC, no se compara; la huella de operación, en tiempo constante.

### Operaciones (REQ-017)

`POST /api/operacion` (credencial en `Authorization`, argumentos en el cuerpo; consulta no vacía → 400) y `npm run operar -- <entorno> <operación> [argumentos]`, orden de la persona desde la carpeta sellada (C-3); credencial sin eco y no guardada. Credencial `hia_op_` + 256 bits creada por una persona; en el entorno solo su SHA-256 (`OPERACION_HUELLA`); 5 fallos por origen en 15 min bloquean 15 min. Con `ENTORNO=produccion`, 404 antes de leer nada. Lista cerrada: `generar_codigo` (`A`|`B`, mostrado una vez en la terminal de la persona), `suspender_licencia`, `reactivar_licencia`, `crear_orden` (`pausar`|`reanudar`, anula las no confirmadas), `listar_conexiones`, `revocar_conexion` (UUID que dio la ruta), `resumen` (recuentos, protocolo, percentil 95), `exportar_sucesos` (`dia`), `cerrar_prueba` (RD-076): estado terminal sin vuelta; después se rechazan generar, activar, canjear, renovar, validar y toda operación salvo `resumen`, `listar_conexiones` y `exportar_sucesos`. Ninguna toca prompt, reglas ni contratos.

### Registros

Suceso: `momento`, `ruta` (del archivo), `herramienta`, `resultado` (`correcto`, `rechazado`, `error`), `codigo`, `duracion_ms`, `protocolo` (conocidas u `otra`) y `asistente` (`claude`, `chatgpt`, `otro`, desde la conexión). Los tres últimos, por RD-028: enmienda E-1. Nunca valores recibidos, cabeceras, tokens, códigos, origen, ruta pedida ni mensajes. Destinos: tabla `sucesos` (hasta el cierre; 20 000 al día y después un `registro_saturado`), consola por `src/lib/registro/` y Sentry UE con C-2. Código, tokens y errores nunca van en la URL; la consulta de `/oauth/autorizar`, que guarda la plataforma, solo trae parámetros OAuth públicos.

### Prompt y arranque ficticios

`prompts/agente-prueba/0.1.md`: leer la bandeja, contar según el guion, `prueba-revisado` a un mensaje, un borrador con fecha y hora en el asunto, `enviar_informe` con RD-075, `confirmar_orden` si hay orden; nada de enviar, eliminar, reenviar, compartir, credenciales ni contenido; marca `MARCA-PROMPT-FICTICIO-0001`. `arranque.md`: primero `obtener_instrucciones`; límites que nada relaja; sin `activa` no se toca el buzón (RD-070); en pausa, decirlo (RD-077); sin dirección ni URL. Huella: lectura única, finales `\n`, SHA-256 del UTF-8 entregado, comparada con la esperada fijada en `prompt-ficticio.ts` (distinta → 503). Fuera de la base de datos y de variables; el almacén da el estado y la herramienta añade el texto solo con `activa`; ilegible o vacío → 503. Reglas constantes: `max_correos_por_revision` 30, `ventana_dias` 3, `preparar_borradores` `true`, `guardar_adjuntos` y `descargar_facturas_por_enlace` `false`.

### Configuración

Grupo «conector» (C-1), sin valores por defecto; si falta o no vale, 503 en todas sus rutas, metadatos incluidos (rutas dinámicas, nunca prerrenderizadas). `URL_PUBLICA` (origen `https`; en `desarrollo`, `http://localhost`), `CONECTOR_SECRETO` (≥ 32 bytes), `CONECTOR_BD_URL` y `AUTORIZACION_BD_URL` (agrupador, roles `conector_prueba_mcp` y `conector_prueba_gestion`; con consulta, no valen: postgres.js la enviaría al arrancar; `ssl` solo por código), `OPERACION_HUELLA`; en desarrollo y preproducción, nunca en producción. Solo en la máquina: `PRUEBAS_CONECTOR_BD_URL`, `PRUEBAS_AUTORIZACION_BD_URL`.

## Contratos

Forma sin cambios. Primera tarea del plan, con dictamen y P1:

- `obtener-instrucciones.schema.json`: `readOnlyHint: false` (las demás, igual) y fuera `x-cuestion-abierta`. Escribe (ejecución, orden entregada): «solo lectura» no es veraz y en Cowork automático relajaría al anfitrión (art. 8). **P1 recoge la respuesta expresa del responsable (RD-016); no se da por delegación.** Si ChatGPT pide confirmar en cada ejecución, se anota como resultado y nunca se vuelve a `true`. En el mismo cambio, la `description` dice que la orden llega salvo con `suspendida` (REQ-011), no «solo con `activa`».
- `informe.schema.json`, `description`: `additionalProperties: false` describe lo publicado y lo guardado; el servidor descarta y cuenta lo ajeno antes (propuesta 6 de `propuestas.md`).

Formas internas cerradas y probadas (respuesta de las funciones, suceso, operación).

## Datos

`Nido`, plan gratuito (se pausa a 7 días sin uso; sin copias), esquema `conector_prueba`; no se toca `public`, `privado` ni `supabase/migrations/`. Tras las pruebas L se revierte y reaplica: los roles renacen sin contraseña, una persona fija otras **solo** en Vercel y las locales mueren con los roles. Eso, con la semilla, es el estado de la prueba real. Producción no tiene estado.

Conexión: `postgres` por el agrupador en modo transacción (6543), `prepare: false`, TLS que verifica certificado y nombre (`ssl: { ca, rejectUnauthorized: true }`) con `raiz-supabase.crt`, raíz pública de Supabase (V-10); certificado no confiable → 503 sin consultar; usuario `[rol].[referencia]` (V§9.2; V-107: si falla, para y decide el responsable, nunca el rol `postgres`). Una llamada, una función (`select conector_prueba.f(…)`, SQL fijo, parámetros), 5 s; error = almacén caído. `max: 2` por instancia (cinco por rol con `CONNECTION LIMIT 10`); el resto, en cola. Sin API de datos ni esquema expuesto.

Roles sin permisos sobre tablas, contraseñas por una persona: `conector_prueba_mcp` ejecuta `validar_acceso`, `mcp_*` y `registrar_suceso`; `conector_prueba_gestion`, autorización, `operar_*` y `registrar_suceso`. Lo que recibe entradas de un modelo no emite ni opera. Límite (m-3): todas las funciones ven las mismas variables; la separación protege de errores de lógica, no de un proceso comprometido.

`001_estado.sql` (M-4): `revoke all on schema conector_prueba from public`; `revoke execute` de todas sus funciones a `public`, `anon`, `authenticated` y `service_role`, también con `alter default privileges`; roles `NOINHERIT NOBYPASSRLS`, `CONNECTION LIMIT 10` y `statement_timeout '5s'`. Lo concedido a `PUBLIC` fuera del esquema no se toca: si PRUEBA-022 lo halla, decide el responsable.

Tablas con RLS sin políticas y enumerados de `docs/MODELO-DATOS.sql`: `licencias` (A, B), `codigos_activacion`, `clientes_oauth` (callbacks restringidos a la lista), `solicitudes_autorizacion` (HMAC de `state`), `conexiones` (asistente por callback, `revocada_en`, motivo `operador`/`reutilizacion`/`cierre`), `codigos_autorizacion`, `tokens` (HMAC, `sal`, sustitución), `ordenes` (`pendiente`, `entregada`, `confirmada`, `anulada`), `ejecuciones`, `informes` (`ejecucion_id` único, rangos del contrato, `campos_descartados`), `limites_origen` (HMAC, ámbito), `sucesos`. Ninguna columna con token, código, dirección ni texto libre. Purga a 24 h, en las funciones que escriben, de solicitudes caducadas y `limites_origen` vencidos; ejecuciones, informes y sucesos, hasta la reversión tras el cierre (C-6).

Funciones `security definer`, `search_path = pg_catalog, pg_temp` (`pg_temp` el último; todo lo que no sea de `pg_catalog`, calificado con su esquema: `conector_prueba.licencias`; D-035, 20/11/2026), `execute` solo al rol, `jsonb` con `resultado` cerrado, reloj de la base de datos. La fase 2 conserva su forma cambiando solo `almacen.ts`:

| Función | Resultados |
| --- | --- |
| `validar_acceso(hmac, recurso)` | booleano |
| `mcp_obtener_instrucciones(hmac, recurso)` | `no_autorizado` o estado, ejecución, orden |
| `mcp_enviar_informe(hmac, recurso, ejecución, informe o null, descartados)` | `no_autorizado`, `ejecucion_desconocida`, `informe_invalido`, `guardado`, `repetido` |
| `mcp_confirmar_orden(hmac, recurso, orden)` | `no_autorizado`, `no_confirmada`, `confirmada`, `repetida` |
| `leer_cliente`, `guardar_cliente_cimd`, `registrar_cliente_dcr` | `desconocido`; `guardado`; `registrado`, `limite`, `origen_bloqueado` |
| `abrir_solicitud`, `activar` | `abierta`, `no_valida`; `solicitud_no_valida`, `origen_bloqueado`, `codigo_no_valido`, `activada` |
| `canjear_codigo`, `renovar` | `no_valido`, `emitido`; `no_valido`, `reutilizado`, `rotado`, `repetido` |
| `operar_*`, `operar_contar_fallo`, `registrar_suceso` | Cerrados |

Reglas: estado `suspendida` si la licencia lo está, `pausada` si la última orden no anulada es pausar, si no `activa`; siempre abre ejecución; entrega y marca la orden pendiente o entregada **salvo suspendida** (nula y sigue pendiente). Confirmar solo órdenes `entregada` de la licencia del token. Informe solo para ejecución de la **misma conexión**. Ajeno = inexistente. `activar`, en una transacción: solicitud, bloqueo, código, conexión, código de autorización; si falla, solo el recuento. Aplican las propuestas 3 a 5 de `propuestas.md`.

Vuelta atrás (artículo 11): `001_estado.sql` transaccional y reejecutable; `semilla.sql`; reversión que borra esquema y roles; los aplica **una persona** en el editor SQL con `LEEME.md`; aplicar-revertir-aplicar se prueba (PRUEBA-022). Sin pgTAP hasta la 003: Vitest sobre PGlite y contra `Nido`.

## Flujo

Alta (401 con reto, metadatos, CIMD o DCR) → activación (`GET`; la persona ejecuta `operar preproduccion generar_codigo A` y teclea; `POST` → `activar`; enlace con `code`, `state`, `iss`) → canje (`canjear_codigo`, `expires_in: 300`) → revisión (`obtener_instrucciones`, buzón fuera del conector, `enviar_informe`, `confirmar_orden`); renovación: una llamada a `renovar`.

**Cierre en fallo** (REQ-014), además de la tubería: excepción → genérico y `error_no_controlado`; almacén caído → `error_temporal` en herramientas (sin estado, prompt, `guardado` ni `confirmada`), «no disponible» al activar (transacción deshecha), 503 al emitir (par descartado) o renovar (el token sigue valiendo); respuesta perdida tras `activar` → conexión sin tokens y otro código (nunca código consumido sin conexión); tras rotar → repetición en 60 s, mismo par.

## Prueba real

Solo Claude Max con la cuenta del responsable (D-021), en tarea programada de **Cowork** con aprobación automática (V§3.6), que aprueba lo de solo lectura de **todos** los conectores de esa cuenta personal: de ahí el paso 1 y R-7. Pro, el más barato (RD-078): «no probado».

**Guion** (`guion-prueba.md`, fechado antes de ejecutarse; todo en preproducción). Preparación: buzón con mensajes ficticios `HIA-PRUEBA-NN`, etiquetas `prueba-urgente` y `prueba-factura` a mano, `prueba-revisado` vacía, un mensaje con órdenes, dirección de control e inventario fechado (responsable; comprueba `qa`); estado, contraseñas y variables (persona); despliegue y `conector:comprobar` (`plataforma`).

| N.º | Paso | CA |
| --- | --- | --- |
| 1 | Gmail: se dejan `search_threads`, `get_message`, `get_thread`, `list_labels`, `list_drafts`, `label_message`, `create_draft`, con su permiso de serie; **todo lo demás «Blocked»**, también lo no inventariado (V§3.7). Declaración escrita de la persona, sin la dirección: el Gmail enlazado es el de pruebas y no hay otro correo. Inventario fechado de conectores, complementos y capacidades (Drive, web, navegador, carpetas): en la tarea solo Gmail de pruebas y HumanaIA, lo demás desactivado o «Blocked»; lo que no se pueda, R-7 antes del paso 6. Capturas recortadas, sin la cuenta | CA-018 |
| 2 | Arranque ficticio instalado | CA-018 |
| 3–4 | Alta (anotar CIMD o DCR, callback, protocolo) y activación; `listar_conexiones` | CA-021, CA-025 |
| 5 | Tres herramientas de HumanaIA en «Always allow»; anotar anotaciones | CA-009, CA-018 |
| 6 | Revisión en conversación; cifras frente al buzón | CA-021, CA-022 |
| 7 | Pedir enviar, eliminar y reenviar a la dirección de control | CA-018 |
| 8 | Suspendida; pausa pidiendo revisar; reanudar | CA-011, CA-020 |
| 9 | Periodo programado cada hora con pausa y reanudación, mensaje con órdenes (enviar, «abre esta URL», «guárdalo en Drive») y comprobación diaria con `listar_conexiones` | CA-019, CA-022, CA-023 |
| 10 | Tres veces, tras > 5 min sin uso, dos tareas en el mismo minuto | CA-023 |
| 11 | Revocar la conexión de Claude con una segunda de A abierta por la persona con `conector:ciclo -- preproduccion` (toma `code` del enlace de la pantalla sin seguir el callback; tokens solo en memoria, sin imprimir): la de Claude se rechaza, la otra completa y después se revoca. «Otro asistente»: no ejecutado hasta tener ChatGPT | CA-008 |
| 12 | Si Gmail pide aprobación: un bloque sin buzón (RD-074) | CA-023 |
| 13 | Final del buzón; `cerrar_prueba`; `resumen` y `exportar_sucesos`; anotaciones frente al paso 5. La persona: borra **todo** el grupo «conector»; `desplegar preproduccion` del mismo commit; en `Nido`, `alter role … nologin password null` y `pg_terminate_backend` de los dos roles (`LEEME.md`). La barrera es la base de datos (estado terminal, roles sin acceso), no la variable: los despliegues anteriores la conservan | CA-009, CA-016, CA-019, CA-024 |

Informe (RD-059): `tratados`, mensajes de prueba en la bandeja (≤ 30); `urgentes` y `facturas_pendientes`, por etiqueta; `borradores` 1; `sin_tratar` y `documentos` 0; resto, RD-075. Evidencia: nunca capturas de la terminal de operación, del código tecleado, de la bandeja, de la cuenta ni de la dirección del buzón; del buzón, recuentos y marcas escritos por la persona; de las conversaciones, argumentos y resultados (cerrados) de las tres herramientas de HumanaIA y, de las de Gmail, **solo nombre y número de llamadas**; del conector, `resumen`, `listar_conexiones` y `exportar_sucesos`; campos de `docs/CALIDAD.md` y escáner de secretos. **Resultados**: `resultados/claude-max.md`, `resultados/chatgpt.md` (todo «no ejecutado») y `conclusiones.md`, con RD-028, RD-067, RD-073, CA-025 y V-101 a V-104.

**Calendario.** La ventana acaba el 27/11 y `decision-pago` es el 26/11. Día de prueba = **bloque de 24 h desde la primera ejecución programada** (≥ 8 lanzadas, CA-023); el periodo empieza el día D, tras los pasos 1 a 8 (C-5). Objetivo: antes del 22/11 (queda un bloque para RD-074 o el paso 11); último inicio con tres bloques, 23/11 a las 08:00; después, R-5. Un reinicio de RD-073 no cabe. `calendario.md` lo aprueba el responsable antes del primer paso (RD-080).

## Orden de construcción: camino mínimo

No se recortan pruebas (RD-079); dos carriles.

| Paso | Contenido | Depende de | Quién |
| --- | --- | --- | --- |
| 0 | `<dominio>`; pasos 1 y 2 en Claude Max; buzón e inventario | — | Responsable, desde hoy |
| 1 | Cambio de contratos | P1 | `arquitecto` |
| 2a | SQL, reversión, semilla, almacén PGlite y real; V-107 | Ancla de la 002; SQL aplicado | `ingeniero-bd` |
| 2b | Cambio firmado (dependencias, C-1 a C-4), `secretos.ts`, contratos y Ajv, prompt, patrón del código en el escáner; V-1 a V-4 | Ancla de la 002 | `ingeniero-backend` |
| 3a / 3b | `/api/mcp`, filtro, herramientas / metadatos, CIMD, DCR, pantalla, activación, tokens | 2a, 2b | Carriles A / B |
| 4 | Operación y `operar` | 2a | A |
| 5 | Pruebas transversales; WCAG | 3a, 3b, 4 | `qa`, `disenador-ui` |
| 6 | PRUEBA-004 y 008 en `Nido`; revertir, reaplicar, contraseñas a Vercel | 5 | `qa`, persona |
| 7 | `pre-nido`, `conector:comprobar`, pasos 3 a 8, inicio del periodo | 6; 002 tramos 2a y 2b | `plataforma`, persona |
| Aparte | Guion, calendario, plantillas, textos | — | `qa` |

Todo de 1 a 7 es ruta crítica (`revisor` y `auditor-seguridad` por tarea). Empezar antes del 22/11 exige el ancla de la 002 en `main` y P1 el 20/11; si no, manda el 23/11. En el periodo solo se despliegan correcciones del conector.

## Amenazas de esta función

| Amenaza | Control | Prueba |
| --- | --- | --- |
| A-01, A-02 | Código de un uso, 60 bits, 10 min; bloqueo que no evalúa; revocación por conexión. Sin alerta de conexión nueva en la 001: `listar_conexiones` diario (paso 9) | 006, 007 |
| A-03, A-04; DCR masivo (art. 7) | Callbacks exactos antes de redirigir; S256; `iss`; CIMD por URL exacta antes de la red; topes; límite y purga (solo dificulta) | 005 |
| A-05, A-06 | Solo HMAC y sales; dos derivaciones con etiqueta; rotación; fuera de gracia revoca esa conexión | 012, 019 |
| Tipo, recurso, token en URL | Prefijo y tipo en HMAC; recurso exigido; la URL no se lee | 011 |
| A-08, A-09 | Licencia y conexión dentro de la función; tablas sin permisos; `PUBLIC` revocado (M-4) | 014, 022 en `Nido` |
| A-12 | Huella esperada fijada en el código | 016 |
| A-13, A-16 | Prompt con huella; límites en anfitrión y arranque; solo Gmail de pruebas y HumanaIA en la cuenta (M-2) | 049, 050 |
| A-14, A-15 | Esquema cerrado; ajeno sin leer; sin eco; evidencias sin Gmail (B-1) | 017, 019, 051 |
| A-19, A-20 | Versiones fijadas con enfriamiento; TLS verificado; prefijos y patrón del código de activación en el escáner | 018, 019 |
| A-21 | `Origin` propio con `same-origin`, cookie ligada, CSP; no cuenta intento | 009 |
| Carreras; caídas; secreto ausente | Bloqueo de fila, transacción única; sin valores por defecto | 007, 008, 018 |
| A-22 parcial | 32 768 bytes; 20 000 sucesos; WAF; purga a 24 h | 018 |
| Operación ajena; producción; cierre | Huella, límite, 404, sin estado; `cerrar_prueba` terminal y roles sin acceso (M-5) | 020, 021, 023 |
## Pruebas y mapa

B: batería (PGlite, sin red). L: contra `Nido`. R: real. V: revisión.

| PRUEBA | Tipo | CA |
| --- | --- | --- |
| 001 metadatos y reto; 002 dos épocas, 405 | B | CA-001 |
| 003 listado = contratos; salidas válidas | B | CA-009 |
| 004 ciclo con el cliente oficial | L | CA-001 |
| 005 callbacks, PKCE, CIMD (URL exacta), DCR, purga, doble canje | B | CA-003 |
| 006 códigos y bloqueo; sin `x-vercel-forwarded-for` | B | CA-004 |
| 007 / 008 concurrencia (10×; 008 por el 6543, sin errores de límite del rol) | B / L | CA-004, CA-007, CA-013 |
| 009 pantalla, `state`; GET y POST con navegador real (local o V-6, antes del paso 3); POST de otro origen sin contar intento; 010 WCAG | B, R; V | CA-005 |
| 011 tokens no válidos con reloj | B | CA-006 |
| 012 gracia, 18 h, 14 días; mil pares sin parte común entre acceso y renovación; par de gracia idéntico byte a byte | B | CA-007; CAD-025 |
| 013 revocar una conexión | B | CA-008 |
| 014 cruzados A/B | B | CA-010 |
| 015 suspendida, pausada, reanudada | B | CA-011 |
| 016 huella invariable; huella distinta → 503 | B, V | CA-012 |
| 017 ajenos, inválidos, repeticiones, lotes, no objeto, `__proto__`/`constructor` | B | CA-013 |
| 018 caídas, variables (URL de BD con `?sslmode=disable` u `?options=…` → no válida), cuerpo; certificado no confiable → 503 sin consultar | B | CA-014 |
| 019 marcas (también en `id`), copia del estado (sal sin secreto → 0 tokens), escáner | B | CA-015; CAD-025 |
| 020 operaciones (consulta → 400); 021 producción; 023 `cerrar_prueba`: generar rechazado, renovar `invalid_grant`; tras el paso 13 y el redespliegue, todas las rutas del conector en 503, metadatos incluidos; `pg_stat_activity` con 0 sesiones de los dos roles; un despliegue anterior no obtiene `emitido`; la contraseña antigua no conecta (6543) | B, L | CA-017; CA-024, CAD-046 |
| 022 roles y reversión; en `Nido`, `has_{function,schema,table}_privilege` de cada rol en esquemas no de sistema: solo lo previsto, roles de Supabase 0 en `conector_prueba`; contraseña local muerta tras reaplicar | B, L | CA-010, CA-015 |
| 040 alta y activación; 042 conversación | R | CA-021, CA-022 |
| 041 protocolo y anotaciones | R | CA-009, CA-025 |
| 043 periodo; 044 pares simultáneos | R | CA-022, CA-023 |
| 045 suspendida, pausada, revocada | R | CA-011, CA-020 |
| 046 revocación (paso 11) | R | CA-008 |
| 047 `arn1` y `eu-north-1` | V | CA-002 |
| 048 buzón; 050 mensaje con órdenes: 0 llamadas fuera de las 7 de Gmail y las 3 de HumanaIA | V; R | CA-016, CA-019 |
| 049 permisos, arranque, declaración e inventario de la cuenta (umbral de 050) | R | CA-018 |
| 051 marcas, credenciales, dirección del buzón (dada en la orden, fuera del repositorio), asuntos y cuerpos del inventario en `evidencias/` y `resultados/`: 0 | V | CA-015, CA-016 |
| 052 cierre; 053 guion y resultados | R, V | CA-024, CA-025 |

| REQ | Pieza | Pruebas |
| --- | --- | --- |
| REQ-001 | `api/mcp`, metadatos | 001, 002, 004, 040 |
| REQ-002 | `arn1`, `Nido` | 047 |
| REQ-003 | `callbacks`, `cimd`, `clientes`, `peticion` | 005 |
| REQ-004 | `activacion`, `limites_origen` | 006, 007, 008, 040 |
| REQ-005 | `pantalla.ts` | 009, 010 |
| REQ-006 | `conexiones`, revocación | 012, 013, 046 |
| REQ-007 | `entrada.ts`, `validar_acceso` | 011, 043 |
| REQ-008 | `tokens.ts`, `renovar` | 007, 008, 012, 019, 044 |
| REQ-009 | `servidor.ts`, `salida.ts`, los cuatro contratos | 003, 041 |
| REQ-010 | `mcp_*`, concesiones de `001_estado.sql` | 014, 022, 040 |
| REQ-011 | `mcp_obtener_instrucciones` | 015, 045 |
| REQ-012 | `prompt-ficticio.ts`, `0.1.md` | 016 |
| REQ-013 | `sanear-informe`, `mcp_enviar_informe`, `mcp_confirmar_orden` | 007, 008, 017 |
| REQ-014 | C-1, `almacen.ts` (TLS) | 018 |
| REQ-015 | `secretos.ts`, registros, escáner | 019, 051 |
| REQ-016 | Guion (paso 1), evidencias sin Gmail, informe sin texto libre | 048, 049, 051, 053 |
| REQ-017 | `api/operacion`, `operar` | 020 |
| REQ-018 | `arranque.md`, permisos | 042, 043, 045, 049, 050 |
| REQ-019 | Orden, `ENTORNO`, `cerrar_prueba` | 004, 021, 023, 052 |
| REQ-020 | Guion, calendario, resultados | 040 a 053 |

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Informe cerrado; ajeno sin leer; origen y `state` como HMAC con purga; evidencias sin Gmail (B-1) |
| 2 Aislamiento | Cumple | Cliente derivado del token en la función; PRUEBA-013, 014, 022 |
| 3 Cierre en fallo | Cumple, con límite | «Cierre en fallo»; sin valores por defecto; roles sin tablas ni `PUBLIC`; TLS verificado; cierre terminal. Límite: m-3 (Datos) |
| 4 Secretos | Cumple, con límite | Solo nombres; valores por una persona; preproducción nunca local. Límite: credenciales de `Nido` locales en PRUEBA-008 (002 asunto A-3) |
| 5 Especificación | Cumple | Mapa completo; E-1 propuesta |
| 6 Revisión | Cumple | Todo es ruta crítica |
| 7 Entradas | Cumple | Nada recibido amplía el alcance |
| 8 Anfitrión | Cumple en lo que depende del diseño | Prompt inmutable; arranque; `readOnlyHint: false`; cuenta acotada (paso 1, R-7) |
| 9 Prompt | Cumple | Archivo con huella servido por el despliegue |
| 10 Producto final | Cumple | Errores, accesibilidad, registros, operación; la fase 2 conserva las formas |
| 11 Reversibilidad | Cumple | Reversión probada; `volver-atras` de la 002 |
| 12 Español | Cumple | Términos del protocolo como son |
| 13 Evidencias | Cumple | Límites de PGlite; ChatGPT «no ejecutado»; Max no es Pro |
| 14 Reservados | Cumple | A personas o como asuntos R-n |

## Dependencias nuevas

Leídas en `registry.npmjs.org/<paquete>/latest` el 19/11/2026; exactas en el bloqueo, en el cambio firmado. **Enfriamiento:** ninguna versión se adopta con menos de 7 días publicada; el cambio firmado anota la fecha de cada una (VERIFICAR las no anotadas aquí).

| Paquete | Versión | Licencia | Para qué; descartada |
| --- | --- | --- | --- |
| `@modelcontextprotocol/server` | 2.4.0, node ≥ 20 (trae `zod` ^4.2.0) | Apache-2.0 | Protocolo; `mcp-handler` no aporta nada |
| `ajv` | 8.20.0 | MIT | Contratos 2020-12 (el SDK ya no lo trae); `ajv-formats` sobra para un formato |
| `postgres` | 3.4.9 (05/04/2026), node ≥ 12 | Unlicense | Agrupador; `supabase-js` salta los roles; 4.x (29/10 y 11/11/2026, sin atestación) no: mayor reciente sin revisar el diff |
| `@electric-sql/pglite` (des.) | VERIFICAR: la última con ≥ 7 días (0.5.17 es del 19/11) | Apache-2.0 | Batería sin red |
| `@modelcontextprotocol/client` (des.) | 2.4.0 | Apache-2.0 | PRUEBA-004 y paso 11; cliente propio |

`zod` directo solo si el SDK lo exige para una entrada abierta (V-1).

## Alternativas descartadas

`oidc-provider` y Better Auth; contrato como entrada del SDK; par cifrado, otro par o par por un solo HMAC; atomicidad en TypeScript; patrón de callback; pantalla en React o con redirección; operar desde el editor SQL o en producción; tres roles; otro proyecto de Supabase (D-020); origen en claro; límite con el WAF (V§8.1); aceptar `Origin: null`; tarea sin aprobaciones (RD-062); desplegar antes de la batería.

## Decisiones que requieren ADR

Una, desde el borrador de `propuestas-diseno/`: servidor propio (V-106); `iss` y dos callbacks (T-010); par derivado (ADR-0002); rol de gestión (ADR-0003); frontera temporal «operador → app»; sin `mcp-handler` (T-008); `Nido` y `arn1` (D-020).

## Asuntos para el responsable

No delegables (lo delegado, en `aclaraciones.md`):

- **R-1** `<dominio>` ya; la alternativa `vercel.app` está en VERIFICAR y cambiaría 002§Entornos.
- **R-2** SQL en `Nido`, contraseñas (Datos) y credencial de operación.
- **R-3** Claude Max (pasos 1 y 2), buzón e inventario antes de D.
- **R-4** Opcional y por escrito: si Gmail detiene la tarea, medir un tramo con «Always allow» en leer, etiquetar y borrador, sin cambiar el «no».
- **R-5** Sin inicio el 23/11: cerrar con lo probado o contratar Pro un mes.
- **R-6** Cuentas de ChatGPT y Claude Pro para V-102 y RD-078.
- **R-7** Antes del paso 6: si algo de la cuenta Max no se puede desactivar para la tarea, ¿se prueba igual? (M-2).
- **R-8** Con plan de pago, CAD-046 pide metadatos de CAD-002 tras el cierre y N-1 todo en 503: enmendar CAD-046 o conservar el grupo sin `OPERACION_HUELLA`.
- **P1** Respuesta expresa a `readOnlyHint: false` (RD-016); y si PRUEBA-022 halla concesiones ajenas a `PUBLIC`.

**E-1** (la aplica el orquestador), RD-023: «…ruta, herramienta, resultado, código de error y, como valores de listas cerradas, duración en milisegundos, versión del protocolo y asistente».

## Pendiente de verificar

- **V-1** SDK 2.4.0 en Node 26 y Next.js 16.4.6 (`stateless`, `json`, entrada abierta, `structuredContent` por época): paso 2b, PRUEBA-002 y 003.
- **V-2** `.well-known` como ruta (si no, reescritura): PRUEBA-001.
- **V-3** Trazado de `prompts/` y `contratos/`; suceso tras responder: `conector:comprobar`.
- **V-4** Ajv con los contratos en modo estricto: PRUEBA-003.
- **V-5** V-107 y diferencias PGlite/Supabase: paso 2a, PRUEBA-008 y 022.
- **V-6** `x-vercel-forwarded-for` (¿falsificable?); `Origin` del navegador con `same-origin`; `resource` y `scope` de Claude: primer despliegue, antes del paso 3. URL del documento CIMD de Claude: antes del cambio firmado.
- **V-7** Tokens compartidos entre tareas simultáneas; «Always allow» y modo automático en Cowork; herramientas de Gmail no listadas; conectores desactivables por tarea: pasos 1, 5 y 10.
- **V-8** V-101, V-103 y V-104: prueba real.
- **V-9** `node scripts/comprobar-specs.mjs`: orquestador, antes de P1.
- **V-10** Certificado del agrupador encadenado a la raíz de Supabase y con su nombre; `ssl` de postgres.js 3.4.9; caché de contraseñas en el agrupador; tamaño de su grupo por usuario frente a `CONNECTION LIMIT 10` y `max: 2`: paso 2a, PRUEBA-008, 018 y 023.
