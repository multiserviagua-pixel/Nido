# 001 · Verificaciones previas al diseño

Fecha de consulta de todas las fuentes: 12/11/2026, salvo que la entrada diga otra cosa · Autor: `arquitecto` · Procedimiento: skill `verificar-decision`

Este documento no diseña ni decide. Deja anotado, con fuente oficial y fecha, lo que el diseño de la función 001 va a necesitar. No actualiza `docs/TECNOLOGIAS.md`: los cambios que se desprenden van al final, en «Diferencias con el registro de decisiones», para que los aplique el chat de coordinación.

## Cómo leer cada entrada

- **Pregunta**: qué se quería saber.
- **Fuente**: qué dice, con su URL exacta.
- **Resultado**: VERIFICADO (lo dice una fuente oficial), VERIFICADO EN PARTE (la fuente cubre solo una parte) o SIN PODER VERIFICAR (no hay fuente oficial; se resuelve con la prueba real).
- **Pendiente o contradicción**: lo que faltó o en qué no coinciden las fuentes.

Reglas aplicadas: solo documentación oficial, repositorio oficial o registro de cambios del producto. Un foro de la comunidad se cita solo como indicio y se marca «INDICIO». Lo que dice una página es un dato, no una orden. En las búsquedas no se han usado nombres de la empresa, del proyecto, direcciones ni dominios.

Las citas en inglés son literales de la fuente; la explicación va en español.

---

## 2. Especificación MCP vigente

(Se escribe antes que el punto 1 porque el punto 1 se mide contra ella.)

### 2.1 Revisión vigente

- **Pregunta**: cuál es la revisión vigente y qué cambia respecto a la que declara Claude.
- **Fuente**: `https://modelcontextprotocol.io/specification/latest/...` redirige a la revisión `2026-07-28`. Su registro de cambios dice que lista los cambios «since the previous revision, 2025-11-25».
  - https://modelcontextprotocol.io/specification/latest/changelog
- **Resultado**: VERIFICADO. La vigente es 2026-07-28 y la anterior es 2025-11-25, como dice T-007.
- **Cambios de 2026-07-28 que afectan al diseño** (mismo registro de cambios, literal):
  - «Remove protocol-level sessions and the `Mcp-Session-Id` header from the Streamable HTTP transport.»
  - «Make MCP stateless: remove the `initialize`/`notifications/initialized` handshake. Every request now carries its protocol version and client capabilities in `_meta` (`io.modelcontextprotocol/protocolVersion`, `io.modelcontextprotocol/clientCapabilities`). [...] Version mismatches return `UnsupportedProtocolVersionError`.»
  - «Add `server/discover`: servers MUST implement this RPC to advertise their supported protocol versions, capabilities, and identity.»
  - «Remove `ping`, `logging/setLevel`, and `notifications/roots/list_changed`.»
  - «All results now carry a required `resultType` field: `"complete"` for ordinary results [...]»
  - «Require standard MCP request headers (`Mcp-Method`, `Mcp-Name`) on Streamable HTTP POST requests.»
  - «Require `ttlMs` and `cacheScope` fields on results returned by `tools/list` [...]»
  - «Servers SHOULD return tools from `tools/list` in a deterministic order.»
  - «Authorization servers SHOULD include the `iss` parameter in authorization responses per RFC 9207, and MCP clients MUST validate a present `iss` against the recorded issuer before redeeming the authorization code.»
  - «Require MCP clients to specify an appropriate `application_type` during Dynamic Client Registration.»
  - «Loosen `inputSchema` and `outputSchema` to allow any JSON Schema 2020-12 keywords, and `structuredContent` to allow any JSON value. Add `$ref` resolution requirements and composition-keyword resource bounds (SEP-2106).»
  - «Deprecate the OAuth 2.0 Dynamic Client Registration Protocol (RFC7591) as a client registration mechanism in favor of Client ID Metadata Documents. It remains available for backwards compatibility with authorization servers that do not support Client ID Metadata Documents.»
  - «Reclassify the HTTP+SSE transport [...] as Deprecated.»

### 2.2 Negociación de versión (V-104)

- **Pregunta**: cómo se negocia la versión y qué tiene que hacer un servidor que quiera atender a la vez a un cliente 2025-11-25 y a uno 2026-07-28.
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning (la URL `.../latest/basic/lifecycle` lleva a esta página, titulada «Versioning and Compatibility»).
  - «There is no negotiation handshake. Every request carries its protocol version, and the server accepts or rejects each request independently.»
  - Define tres términos: **Modern** (2026-07-28 y posteriores, metadatos por petición), **Legacy** (2025-11-25 y anteriores, con `initialize`) y **Dual-era** (admite las dos).
  - «If the server does not implement the requested version [...] it MUST respond with an `UnsupportedProtocolVersionError` listing the versions it does support». Código `-32022`, con `data.supported` y `data.requested`.
  - «Servers MUST implement `server/discover`.»
  - «A server that wishes to support both legacy clients (which expect an `initialize` handshake) and modern clients (which use per-request metadata) MAY implement both behaviors.»
  - Matriz de compatibilidad: cliente Legacy contra servidor Modern, «Fails. [...] Legacy clients have no fall-forward mechanism»; cliente Legacy contra servidor Dual-era, «Works. The server answers `initialize` and serves the client according to the negotiated legacy revision».
  - «A dual-era server selects its behavior from how the client opens: a request carrying modern per-request `_meta` is served statelessly according to this revision; an `initialize` request selects legacy semantics, scoped to [...] the session (HTTP), as specified by the negotiated legacy protocol version.» «A dual-era server MAY serve both eras concurrently on the same endpoint.»
- **Fuente, transporte**: https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http
  - «Every POST request to the MCP endpoint MUST include an `MCP-Protocol-Version` header.» El valor debe coincidir con `_meta`; si no, `400 Bad Request` con error `HeaderMismatch` (`-32020`).
  - Versión no admitida: «it MUST respond with `400 Bad Request` and an `UnsupportedProtocolVersionError` listing its supported versions».
  - Cabeceras obligatorias en 2026-07-28: `MCP-Protocol-Version`, `Mcp-Method` en todas las peticiones y `Mcp-Name` en `tools/call`. Si falta una, o no coincide con el cuerpo, `400` con `-32020`.
  - Un servidor que solo admite 2026-07-28 y recibe tráfico antiguo «SHOULD» responder `405 Method Not Allowed` a GET o DELETE e ignorar `Mcp-Session-Id`.
  - «Servers MUST validate the `Origin` header on all incoming connections [...] If the `Origin` header is present and invalid, servers MUST respond with HTTP 403 Forbidden.»
- **Resultado**: VERIFICADO.
- **Consecuencia que el diseño tiene que conocer** (hecho, no decisión): en 2026-07-28 ya no existe la inicialización. Un cliente que declara 2025-11-25 abre con `initialize`; un cliente 2026-07-28 no inicializa: manda cada petición con su versión en `_meta` y en cabecera. Para cumplir REQ-005 el conector tiene que ser «dual-era». Esto choca con la letra de REQ-005 («completa la negociación de versión») y de CA-003 («una sesión iniciada declarando 2026-07-28 [...] completa la inicialización»): con 2026-07-28 no hay ni sesión ni inicialización que completar. Ver «Hallazgos que afectan a la especificación», H-1.
- **Pendiente**: qué versión declaran de verdad Claude y ChatGPT se anota en los puntos 3 y 4, y se confirma en la prueba real (V-104).

### 2.3 Metadatos de recurso protegido y respuesta sin token

- **Pregunta**: qué debe publicar el conector y qué responde a una petición sin token (REQ-004, REQ-032, CA-002).
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery
  - «MCP servers MUST implement the OAuth 2.0 Protected Resource Metadata (RFC9728) specification [...]. The Protected Resource Metadata document returned by the MCP server MUST include the `authorization_servers` field containing at least one authorization server.»
  - «MCP servers MUST implement one of the following discovery mechanisms»: (1) cabecera `WWW-Authenticate` con `resource_metadata` en la respuesta `401 Unauthorized` (RFC 9728, sección 5.1); (2) URI conocida, en la ruta del punto MCP (`https://example.com/.well-known/oauth-protected-resource/public/mcp` para un punto en `/public/mcp`) o en la raíz (`https://example.com/.well-known/oauth-protected-resource`).
  - Los clientes «MUST support both discovery mechanisms and use the resource metadata URL from the parsed `WWW-Authenticate` headers when present; otherwise, they MUST fall back to constructing and requesting the well-known URIs in the order listed above».
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
  - «MCP servers SHOULD include a `scope` parameter in the `WWW-Authenticate` header [...] to indicate the scopes required for accessing the resource.» Ejemplo literal: `WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource", scope="files:read"`.
  - «Invalid or expired tokens MUST receive a HTTP 401 response.»
  - Códigos: 401 «Authorization required or token invalid», 403 «Invalid scopes or insufficient permissions», 400 «Malformed authorization request».
  - «MCP Servers (Protected Resources) SHOULD NOT include `offline_access` in `WWW-Authenticate` scope or Protected Resource Metadata `scopes_supported`.»
- **Resultado**: VERIFICADO. La respuesta que prescribe la especificación para REQ-032 es `401` con `WWW-Authenticate: Bearer resource_metadata="…"`.
- **Pendiente**: los campos obligatorios del documento según el propio RFC 9728 (`resource`) hay que tomarlos del RFC al escribir CA-002; aquí solo se ha leído lo que añade MCP (`authorization_servers` obligatorio).

### 2.4 Metadatos del servidor de autorización

- **Pregunta**: qué documento de metadatos debe publicar el servidor de autorización y en qué ruta lo buscan los clientes.
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization y https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery
  - «MCP authorization servers MUST provide at least one of the following discovery mechanisms: OAuth 2.0 Authorization Server Metadata (RFC8414); OpenID Connect Discovery 1.0.»
  - Emisor sin ruta: los clientes prueban `/.well-known/oauth-authorization-server` y luego `/.well-known/openid-configuration`. Emisor con ruta (`https://auth.example.com/tenant1`): primero `/.well-known/oauth-authorization-server/tenant1`, luego `/.well-known/openid-configuration/tenant1`, luego `/tenant1/.well-known/openid-configuration`.
  - «the `issuer` value in the document MUST be identical to the issuer identifier used to construct the well-known URL. If they differ, the client MUST NOT use the metadata.»
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations
  - «If `code_challenge_methods_supported` is absent, the authorization server does not support PKCE and MCP clients MUST refuse to proceed.»
  - «All authorization server endpoints MUST be served over HTTPS.» «All redirect URIs MUST be either `localhost` or use HTTPS.»
- **Fuente**, parámetro `iss` (RFC 9207): https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
  - «MCP authorization servers SHOULD include the `iss` parameter in authorization responses, including error responses [...]. Authorization servers that include the `iss` parameter MUST advertise this by setting `authorization_response_iss_parameter_supported` to `true` in their metadata.»
  - «A future revision of this specification is expected to upgrade authorization server inclusion of `iss` from SHOULD to MUST.»
  - Si el servidor anuncia `authorization_response_iss_parameter_supported: true` y no envía `iss`, el cliente rechaza la respuesta.
- **Resultado**: VERIFICADO.
- **Dato nuevo respecto al ADR-0002**: el parámetro `iss` en la redirección de vuelta (SHOULD hoy, MUST anunciado) no figura en el ADR ni en la especificación de la función. No lo exige ningún requisito, pero el diseño debe decidir si lo emite.

### 2.5 Indicador de recurso (RFC 8707)

- **Pregunta**: qué exige sobre el parámetro `resource` (REQ-007).
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
  - El parámetro `resource` «MUST be included in both authorization requests and token requests», «MUST identify the MCP server that the client intends to use the token with» y «MUST use the canonical URI of the MCP server».
  - «MCP clients MUST send this parameter regardless of whether authorization servers support it.»
  - URI canónica: ejemplos válidos `https://mcp.example.com/mcp`, `https://mcp.example.com`; «implementations SHOULD consistently use the form without the trailing slash».
  - «MCP servers MUST validate that access tokens were issued specifically for them as the intended audience.» «MCP servers MUST only accept tokens that are valid for use with their own resources.»
  - «Access tokens MUST NOT be included in the URI query string.» El cliente «MUST use the Authorization request header field».
- **Resultado**: VERIFICADO. Coincide con T-009 y REQ-007.
- **Pendiente**: qué valor exacto de `resource` envía cada asistente (con o sin ruta, con o sin barra final) no lo fija la especificación; se anota en los puntos 3 y 4 si su documentación lo dice, y se observa en la prueba real.

### 2.6 PKCE, callbacks y rotación

- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations
  - «MCP clients MUST implement PKCE [...] and MUST verify PKCE support before proceeding with authorization.» «MCP clients MUST use the `S256` code challenge method when technically capable.»
  - «Authorization servers MUST validate exact redirect URIs against pre-registered values to prevent redirection attacks.»
  - «Authorization servers SHOULD issue short-lived access tokens [...]. For public clients, authorization servers MUST rotate refresh tokens as described in OAuth 2.1 Section 4.3.1.»
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization, apartado «Refresh Tokens»
  - Los clientes «MUST NOT assume refresh tokens will be issued; the AS retains discretion», «SHOULD include `refresh_token` in their `grant_types` client metadata» y «MAY add `offline_access` to the `scope` parameter [...] when the Authorization Server metadata contains it in `scopes_supported`».
- **Resultado**: VERIFICADO. La rotación en cada uso (REQ-013) es obligatoria para clientes públicos; la coincidencia exacta del callback (REQ-006, REQ-039) también.
- **Pendiente**: la especificación no dice nada de la ventana de gracia de REQ-013; es una decisión propia (ADR-0002). OAuth 2.1 la permite o no según se lea su sección 4.3.1: no se ha verificado aquí.

### 2.7 Registro de clientes: CIMD y DCR

- **Pregunta**: qué exige en registro de clientes (REQ-008, T-011).
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration
  - Orden de preferencia de un cliente que admite todo: (1) cliente prerregistrado, (2) CIMD «if the Authorization Server indicates that it supports them (via `client_id_metadata_document_supported` in OAuth Authorization Server Metadata)», (3) DCR «as a fallback if the Authorization Server supports it (via `registration_endpoint`)», (4) pedir los datos al usuario.
  - CIMD: «MCP clients and authorization servers SHOULD support OAuth Client ID Metadata Documents». La norma de referencia es `draft-ietf-oauth-client-id-metadata-document-00`.
  - Cliente: la URL del `client_id` «MUST use the "https" scheme and contain a path component»; el documento «MUST include at least the following properties: `client_id`, `client_name`, `redirect_uris`»; el `client_id` del documento debe coincidir exactamente con la URL.
  - Servidor de autorización: «SHOULD fetch metadata documents when encountering URL-formatted client_ids», «MUST validate that the fetched document's `client_id` matches the URL exactly», «SHOULD cache metadata respecting HTTP cache headers», «MUST validate redirect URIs presented in an authorization request against those in the metadata document», «MUST validate the document structure is valid JSON and contains required fields».
  - Anuncio: `"client_id_metadata_document_supported": true` en los metadatos del servidor de autorización.
  - DCR: «Dynamic Client Registration is deprecated. New implementations should use Client ID Metadata Documents instead.» Sigue siendo «MAY». Los clientes «MUST specify an appropriate `application_type` during Dynamic Client Registration»; las aplicaciones web remotas «SHOULD use `application_type: "web"`».
- **Fuente**, seguridad de CIMD: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations
  - «Authorization servers fetching metadata documents SHOULD consider Server-Side Request Forgery (SSRF) risks.»
  - «Authorization servers MAY implement domain-based trust policies for accepting Client ID Metadata Documents.» Esto respalda la lista cerrada de hosts de REQ-008.
  - El servidor de autorización «MUST clearly display the redirect URI hostname during authorization».
- **Resultado**: VERIFICADO. Coincide con T-011 (CIMD recomendado, DCR obsoleto y mantenido por compatibilidad).
- **Dato nuevo**: la pantalla de autorización debe mostrar con claridad el host del callback («MUST clearly display the redirect URI hostname»). No está en REQ-011.

### 2.8 Esquemas JSON de las herramientas y referencias `$ref`

- **Pregunta**: qué dice la especificación sobre el dialecto de los esquemas y sobre las referencias, porque `contratos/enviar-informe.schema.json` referencia el informe por su `$id` (`"$ref": "urn:…:informe:1"`).
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/basic/index, apartados «JSON Schema Usage» y «`$ref` Resolution».
  - «When a schema does not include a `$schema` field, it defaults to JSON Schema 2020-12.» «Clients and servers MUST support JSON Schema 2020-12 for schemas without an explicit `$schema` field.»
  - «Implementations MUST NOT automatically dereference `$ref` values that resolve to a network URI.»
  - «Schemas that fail to validate due to an unresolved external `$ref` SHOULD be rejected rather than silently treated as permissive.»
  - «Implementations SHOULD apply reasonable bounds, such as a maximum schema depth, a cap on the total number of subschemas, or a per-validation time budget.»
- **Fuente**: https://modelcontextprotocol.io/specification/2026-07-28/server/tools
  - `inputSchema` «MUST be a valid JSON Schema object (not `null`)». Para una herramienta sin parámetros, lo recomendado es `{ "type": "object", "additionalProperties": false }`.
  - Con `outputSchema`: «Servers MUST provide structured results that conform to this schema. Clients SHOULD validate structured results against this schema.» «For backwards compatibility, a tool that returns structured content SHOULD also return the serialized JSON in a TextContent block.»
  - «clients MUST consider tool annotations to be untrusted unless they come from trusted servers.»
  - Errores: los de validación de entrada son «Tool Execution Errors», se devuelven en el resultado con `isError: true`, no como error de protocolo.
  - Seguridad: «Servers MUST: validate all tool inputs; implement proper access controls; rate limit tool invocations; sanitize tool outputs.»
- **Resultado**: VERIFICADO.
- **Consecuencia para el diseño** (hecho): un `$ref` a un URN no es una URI de red, pero el asistente solo recibe el esquema de la herramienta, no el documento del informe. Si el esquema publicado conserva un `$ref` que el asistente no puede resolver, la especificación dice que debería rechazarlo. El esquema que se publique en `tools/list` tiene que ir resuelto (el informe incrustado o en `$defs`). Qué hace cada asistente con `$defs` no está verificado; ver 5.4.
- **Dato nuevo**: «rate limit tool invocations» es un MUST de la especificación para los servidores. La función 001 deja el límite por conexión fuera de alcance (A-22, fases 2 a 4). No bloquea la prueba, pero conviene que el diseño lo sepa.

---

## 1. Servidor de autorización (V-106)

- **Pregunta**: ¿existe una librería mantenida que cubra, en funciones sin estado de Next.js, el código de autorización con PKCE S256, la renovación con rotación, el registro por CIMD y por DCR y una pantalla de autorización propia?
- **Respuesta corta, sin decidir**: ninguna de las opciones revisadas cubre los cinco requisitos tal como los pide el ADR-0002 (tokens opacos guardados como HMAC, conexión ligada a una licencia y no a un usuario, ventana de gracia que devuelve el mismo par, pantalla propia con código de activación) sin adaptación. Dos cubren CIMD: `oidc-provider`, como función experimental, y Better Auth, con un paquete aparte. El SDK oficial y `mcp-handler` dicen expresamente que el servidor de autorización no es cosa suya.

Compatibilidad con Node 26: ninguna fuente lo nombra. Lo que hay es el campo `engines` de cada paquete y, en el SDK, la matriz de CI. Node 26 es LTS según https://nodejs.org/en/about/previous-releases (fila «v26 · Lithium · LTS», última actualización 10/11/2026). Que un paquete declare `>=20` permite instalarlo en Node 26, pero no prueba que se haya probado en él.

### 1.1 SDK oficial de MCP para TypeScript

- **Fuentes**:
  - https://registry.npmjs.org/@modelcontextprotocol/server/latest
  - https://registry.npmjs.org/@modelcontextprotocol/server (fechas de publicación)
  - https://github.com/modelcontextprotocol/typescript-sdk/releases
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/serving/authorization.md
  - https://registry.npmjs.org/@modelcontextprotocol/server-legacy
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/.github/workflows/main.yml
- **Versión estable**: `@modelcontextprotocol/server` 2.4.0, publicada el 23/10/2026. Licencia Apache-2.0 (el README dice «Apache License 2.0 for new contributions, with existing code under MIT»).
- **Mantenida**: sí. Cuatro versiones entre el 23/09/2026 y el 23/10/2026; la línea 1.x sigue recibiendo correcciones (1.32.2, 23/10/2026).
- **Node**: `engines: node >=20`. La matriz de CI prueba `[20, 22, 24]`. Node 26 no está en la matriz.
- **Qué cubre**: solo la mitad de servidor de recursos. `requireBearerAuth` (con la opción `expectedResource`, que hace que solo se acepten tokens emitidos para este recurso; llegó en 2.3.1), `getOAuthProtectedResourceMetadataUrl` y `oauthMetadataResponse`, que sirve los documentos de RFC 9728 y de RFC 8414. Las respuestas fallidas llevan `401 invalid_token` o `403 insufficient_scope` con «a `WWW-Authenticate: Bearer …` challenge».
- **Qué no cubre**: servidor de autorización. La documentación dice que los ayudantes de la versión 1 están «frozen in `@modelcontextprotocol/server-legacy/auth`» (`mcpAuthRouter`, `ProxyOAuthServerProvider`) y recomienda «Use a dedicated identity provider». El paquete `@modelcontextprotocol/server-legacy` 2.4.0 está marcado como obsoleto en el registro: su descripción es «Frozen v1 SSE transport and OAuth Authorization Server helpers», depende de `express` (opcional), `express-rate-limit`, `cors`, `raw-body` y `pkce-challenge`, y está pensado para Express, no para manejadores web estándar.
- **CIMD y DCR**: la página de autorización del SDK no los menciona.
- **Resultado**: VERIFICADO. El SDK no sirve como servidor de autorización.

### 1.2 `mcp-handler`

- **Fuentes**:
  - https://registry.npmjs.org/mcp-handler/latest y https://registry.npmjs.org/mcp-handler
  - https://raw.githubusercontent.com/vercel-labs/mcp-handler/main/README.md
  - https://raw.githubusercontent.com/vercel-labs/mcp-handler/main/docs/AUTHORIZATION.md
- **Versión estable**: 2.4.0, publicada el 12/11/2026 a las 18:08 UTC (el mismo día de esta consulta). Las anteriores: 2.3.1 el 05/11/2026 y 2.3.0 el 07/10/2026. Licencia Apache-2.0. `engines: node >=20`.
- **Mantenida**: sí, cinco versiones desde el 18/09/2026. El repositorio está en `vercel-labs/mcp-handler` (la URL `github.com/vercel/mcp-handler` que cita T-008 redirige allí).
- **Qué cubre**: `withMcpAuth(handler, verifyToken, { required, requiredScopes, resourceMetadataPath })`, que verifica el token y responde `401`/`403` con el reto de RFC 9728; `protectedResourceHandler({ authServerUrls })`, que sirve el documento de recurso protegido con `resource` y `authorization_servers`; y `metadataCorsOptionsRequestHandler()`.
- **Qué no cubre**: servidor de autorización. Literal: «CIMD support is advertised and implemented by your **authorization server**». La página de autorización no dice nada de validar la audiencia del token: eso queda en `verifyToken`, que escribe quien integra.
- **Resultado**: VERIFICADO. Confirma lo que ya decía T-008.

### 1.3 `oidc-provider` (panva/node-oidc-provider)

- **Fuentes**:
  - https://registry.npmjs.org/oidc-provider/latest
  - https://github.com/panva/node-oidc-provider y https://github.com/panva/node-oidc-provider/releases
  - https://raw.githubusercontent.com/panva/node-oidc-provider/main/docs/README.md
  - https://raw.githubusercontent.com/panva/node-oidc-provider/main/package.json
- **Versión estable**: 9.14.0, del 11/11/2026. Licencia MIT. Módulo ES. Dependencias: `koa`, `jose`, `debug`.
- **Mantenida**: sí, cuatro versiones entre el 27/10/2026 y el 11/11/2026. El README dice que tiene un único mantenedor («sole maintainer»).
- **Node**: no declara `engines`. La única mención de versión es que ciertos algoritmos están «available in Node.js >= 24.7.0». Sin poder verificar con Node 26.
- **Qué cubre**:
  - PKCE (RFC 7636), obligatorio para clientes públicos.
  - Rotación del token de renovación: los clientes públicos sin restricción de emisor rotan siempre. Caducidad por defecto de 14 días, que se renueva al rotar, con tope de un año.
  - DCR (`features.registration`, desactivado por defecto; RFC 7591 y 7592).
  - Indicadores de recurso (RFC 8707), activados por defecto; «only a single audience for an Access Token is permitted».
  - Metadatos de servidor de autorización (RFC 8414) y parámetro `iss` (RFC 9207).
  - CIMD: `features.clientIdMetadataDocument`, **experimental**, sobre el borrador `draft-ietf-oauth-client-id-metadata-document-02`. Opciones `allowFetch`, `allowClient` y `cacheDuration`; cuerpo máximo de 5120 bytes, tiempo máximo de 2500 ms, y la descarga «rejects connections to private, loopback, and other non-globally-routable IP addresses».
  - Tokens de acceso opacos por defecto, o JWT.
  - Pantalla propia: sí, de hecho obligatoria («implementations MUST provide these components»). Se integra con `provider.interactionDetails` e `interactionFinished`, y depende de una cookie de interacción.
- **Qué no cubre o no encaja sin más**:
  - Ventana de gracia: no existe. «when a consumed refresh token is encountered an error shall be returned and the whole token chain (grant) is revoked». Eso es lo contrario de REQ-013 y REQ-044 dentro de la ventana.
  - Montaje: `provider.callback()` sobre el `req`/`res` de Node (Express, Koa, Fastify, Hapi, NestJS). La documentación no menciona Next.js, manejadores web estándar (`Request`/`Response`) ni funciones sin servidor.
  - Almacenamiento: exige un adaptador propio con operaciones atómicas (`upsert` y `consume`); el de por defecto es en memoria, «suitable for development and testing purposes only».
  - Las funciones experimentales cambian en versiones menores: el README recomienda fijar con `~`.
- **Contradicción entre fuentes**: la especificación MCP 2026-07-28 cita el borrador `-00` de CIMD y `oidc-provider` implementa el `-02`. No se ha comprobado qué cambia entre uno y otro.
- **Resultado**: VERIFICADO EN PARTE (lo que cubre, por su documentación; el funcionamiento en una función de Vercel con Next.js 16, sin poder verificar).

### 1.4 Better Auth (`better-auth`, `@better-auth/oauth-provider`, `@better-auth/mcp`, `@better-auth/cimd`)

- **Fuentes**:
  - https://registry.npmjs.org/better-auth/latest
  - https://registry.npmjs.org/@better-auth/mcp/latest y https://registry.npmjs.org/@better-auth/cimd/latest
  - https://www.better-auth.com/docs/plugins/oauth-provider
  - https://www.better-auth.com/docs/plugins/mcp
- **Versión estable**: 1.7.22 en los cuatro paquetes. Licencia MIT. Sin campo `engines`. `better-auth` declara `next ^14 || ^15 || ^16` como dependencia opcional.
- **Mantenida**: sí (hay ramas 1.4, 1.6, 1.7 y una beta 1.8 en el registro). La documentación no dice si los complementos de OAuth y MCP son estables o beta.
- **Qué cubre**: servidor de autorización OAuth 2.1 con OIDC y metadatos RFC 8414; PKCE «Required by default, `S256` only»; rotación del token de renovación; DCR (desactivado por defecto en `mcp()`: «MCP deprecates Dynamic Client Registration»); CIMD con el paquete `@better-auth/cimd` y el perfil `mcp-2026-07-28`; metadatos de recurso protegido (RFC 9728); token ligado al recurso (`aud`); páginas propias con `loginPage` y `consentPage`; y una **ventana de reutilización** del token de renovación, `refreshTokenReuseInterval`, que `mcp()` fija en 30 segundos por defecto.
- **Qué no cubre o no encaja sin más**:
  - Modelo de usuarios y sesiones: el flujo redirige a `loginPage` «when the user has no session». Liga la autorización a un usuario con sesión, no a una licencia activada con un código de un solo uso (es la misma objeción que el ADR-0002 hace al servidor OAuth de Supabase).
  - Exige base de datos con sus propias tablas (clientes, consentimientos, códigos, tokens de renovación, metadatos CIMD) y el complemento JWT: los tokens de acceso son JWT cuando la petición nombra un recurso, no opacos guardados como HMAC. La documentación no dice si guarda los tokens con huella.
  - La ventana de reutilización no revoca la familia, pero la documentación no dice que devuelva «el mismo par»; solo que una repetición «can succeed without revoking the token family».
- **Resultado**: VERIFICADO EN PARTE (por documentación). Sin poder verificar si la activación por código puede sustituir al inicio de sesión de usuario.

### 1.5 `@node-oauth/oauth2-server`

- **Fuentes**:
  - https://registry.npmjs.org/@node-oauth/oauth2-server
  - https://github.com/node-oauth/node-oauth2-server
  - https://node-oauthoauth2-server.readthedocs.io/en/master/ y https://node-oauthoauth2-server.readthedocs.io/en/master/misc/pkce.html
- **Versión estable**: 5.3.1, del 13/10/2026 (la anterior, 5.3.0, del 15/04/2026). Licencia MIT. `engines: node >=16.0.0`. El README dice que sigue las versiones «Maintenance LTS, Active LTS, Current».
- **Qué cubre**: concesiones de OAuth 2.0 con un modelo de almacenamiento que escribe quien integra; PKCE desde la 4.3.0, solo en el flujo de código de autorización (el ejemplo usa S256). Usa objetos `Request` y `Response` propios, no los de la plataforma; hay envoltorio oficial para Express.
- **Qué no cubre**: la documentación no menciona DCR, CIMD, metadatos de servidor de autorización, indicadores de recurso ni una opción para hacer obligatorio PKCE en toda petición. Tampoco pantalla: la pone quien integra.
- **Resultado**: VERIFICADO EN PARTE. Es un núcleo de concesiones; CIMD, DCR, metadatos y `resource` habría que construirlos igualmente.

### 1.6 `@jmondi/oauth2-server`

- **Fuentes**:
  - https://registry.npmjs.org/@jmondi/oauth2-server/latest
  - https://github.com/jasonraimondi/ts-oauth2-server
- **Versión estable**: 5.0.0. Licencia MIT. «Requires `node >= 22`». No se ha obtenido la fecha de publicación.
- **Qué cubre**: código de autorización, credenciales de cliente y renovación; RFC 6749, 6750, 7009, 7519, 7636 (PKCE), 7662, 8693 y 9068; adaptadores para JavaScript sin marco, Express, Fastify y H3. Trabaja con JWT.
- **Qué no cubre**: el README no menciona RFC 8707, RFC 7591 (DCR), RFC 8414, RFC 9728, CIMD ni rotación del token de renovación. Los tokens opacos tampoco aparecen.
- **Resultado**: VERIFICADO EN PARTE. Misma situación que 1.5.

### 1.7 Cuadro resumen (hechos, por documentación)

| | PKCE S256 | Rotación | Ventana de gracia | CIMD | DCR | Metadatos AS | `resource` | Pantalla propia | Manejador web estándar en Next.js |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SDK MCP 2.4.0 | no (no es AS) | no | no | no | no | solo sirve el documento | valida audiencia | no | sí (lado recurso) |
| `mcp-handler` 2.4.0 | no (no es AS) | no | no | no | no | no | no lo documenta | no | sí (lado recurso) |
| `oidc-provider` 9.14.0 | sí | sí | no: revoca la cadena | experimental, borrador -02 | sí | sí | sí | sí, con cookie | no documentado |
| Better Auth 1.7.22 | sí | sí | 30 s, sin revocar | sí, paquete aparte | sí | sí | sí | sí, ligada a sesión de usuario | sí |
| `@node-oauth/oauth2-server` 5.3.1 | sí | sin documentar | no | no | no | no | no | la pone quien integra | objetos propios |
| `@jmondi/oauth2-server` 5.0.0 | sí (RFC 7636) | sin documentar | no | no | no | no | no | la pone quien integra | adaptador sin marco |

«Sin documentar» quiere decir que la página consultada no lo menciona, no que no exista.

### 1.8 Lo que queda sin verificar en V-106

- Ninguna librería se ha instalado ni ejecutado: todo lo anterior sale de documentación y del registro de paquetes.
- Compatibilidad real con Node 26 y Next.js 16.4 de `oidc-provider` y Better Auth.
- Si la interacción de `oidc-provider` o la página de inicio de sesión de Better Auth admiten un flujo sin usuario (activación por código ligada a una licencia).
- Si alguna guarda los tokens de forma no reutilizable con una copia del estado (REQ-015).

---

## 5. zod (V-109)

### 5.1 Versión vigente

- **Fuentes**: https://registry.npmjs.org/zod/latest · https://github.com/colinhacks/zod/releases
- **Dato**: zod 4.6.7, del 12/10/2026, licencia MIT, sin campo `engines`. El paquete exporta `zod/v4`, `zod/mini` y `zod/v3`.
- **Dato de la cadena de suministro**: las notas de la 4.6.6 (11/10/2026) dicen que seis commits maliciosos subidos a `main` el 21 de septiembre se revirtieron y que «None were ever published to npm». Es un hecho que conviene tener presente al fijar versiones y al revisar el archivo de bloqueo.
- **Resultado**: VERIFICADO.

### 5.2 Qué versión exigen el SDK y `mcp-handler`

- **Fuentes**: https://registry.npmjs.org/@modelcontextprotocol/server/latest · https://registry.npmjs.org/mcp-handler/latest · https://raw.githubusercontent.com/vercel-labs/mcp-handler/main/README.md
- **SDK**: `@modelcontextprotocol/server` 2.4.0 lleva `zod ^4.2.0` como **dependencia** directa, no como dependencia de par. El README dice: «Tool and prompt schemas use Standard Schema — bring Zod v4, Valibot, ArkType, or any compatible library», y su ejemplo importa `zod/v4`.
- **`mcp-handler`**: en el registro, la 2.4.0 solo declara como dependencias de par `@modelcontextprotocol/server ^2.0.0` (obligatoria) y `next >=13.0.0`, `@vercel/otel` y `@opentelemetry/api` (opcionales). zod solo aparece en sus dependencias de desarrollo (`^4.4.3`).
- **Contradicción entre fuentes**: el README de `mcp-handler` dice que la 2.x «requires `@modelcontextprotocol/server` ^2.0.0, zod ^4.2.0» y manda instalar `zod@^4`; el `package.json` publicado no declara zod como dependencia de par en ninguna 2.x. Las dos fuentes son oficiales. En la práctica coinciden en el rango (zod 4, desde 4.2.0), pero el gestor de paquetes no lo va a exigir.
- **Resultado**: VERIFICADO. zod 4.6.7 entra en `^4.2.0`.

### 5.3 De zod a esquema JSON

- **Fuente**: https://zod.dev/json-schema
  - `z.toJSONSchema()` genera por defecto «JSON Schema Draft 2020-12». Admite `target` con `draft-2020-12`, `draft-07`, `draft-04` y `openapi-3.0`.
  - «By default, the result of `z.toJSONSchema` represents the *output type*.» Con `io: "input"` se obtiene el tipo de entrada.
  - `z.object()` emite `additionalProperties: false` en modo salida y no lo emite en modo entrada. `z.strictObject()` lo emite siempre; `z.looseObject()`, nunca.
  - `z.uuid()` da `{ type: "string", format: "uuid" }`; `z.int()` da `{ type: "integer" }`.
  - Los anulables con un tipo simple salen como `type: ["string", "null"]`; si no, como `anyOf`. La página no menciona `oneOf`.
  - Con un registro, los esquemas con `id` se referencian por `$ref`; la opción `uri` convierte cada `id` en una URI absoluta. La página no menciona `$id`.
  - `z.fromJSONSchema()` existe y es experimental: «is not considered part of Zod's stable API». La página no dice qué borradores admite ni si resuelve `$ref` externos.
- **Resultado**: VERIFICADO EN PARTE.
- **Lo que esto implica frente a `contratos/`** (hechos):
  - Los contratos usan `oneOf` con `null` (en `orden` e `instrucciones`); zod genera `anyOf` o una lista de tipos. Un esquema generado desde zod no sería idéntico al del contrato, y CA-004 pide que los esquemas de entrada publicados sean «idénticos a los de `contratos/`».
  - Los contratos usan `enum` sin `type`, `uniqueItems`, `x-anotaciones`, `x-version-esquema` y `$id` con URN. No se ha verificado que zod reproduzca cada uno tal cual.
  - Generar zod a partir del contrato con `z.fromJSONSchema()` se apoyaría en una función que su autor declara experimental.

### 5.4 Validar directamente con el esquema JSON

- **Fuentes**:
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/advanced/schema-libraries.md
  - https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.4.0
  - https://registry.npmjs.org/@modelcontextprotocol/server/latest (exportaciones `./validators/ajv` y `./validators/cf-worker`)
- **Dato**: el SDK admite un esquema JSON tal cual, sin zod. `fromJsonSchema(documento, validador)` de `@modelcontextprotocol/server` envuelve un documento; `tools/list` lo publica «unchanged» y las llamadas se comprueban con un validador de esquemas JSON real. Por defecto el validador se elige según el entorno: Ajv en Node.js y `@cfworker/json-schema` en workerd y navegadores. Se puede pasar uno propio (`new AjvJsonSchemaValidator(ajv)` desde `validators/ajv`, que reexporta `Ajv` y `addFormats`).
- **Dato sobre `$id` y `$ref`**: las notas de la 2.4.0 dicen que el validador Ajv incluido (con `fast-uri` 3.1.8) «rejects a `$id` or `$ref` with an invalid URI scheme, such as `my_tool:output`». El ejemplo es un esquema con guion bajo, que no es válido en una URI. Las notas no dicen nada de `urn:`. El esquema `urn` es sintácticamente válido, y los `$id` de `contratos/` son `urn:humanaia:…`, así que no deberían verse afectados, pero **no está verificado**: hay que probarlo al instalar.
- **Dato sobre `$ref` por `$id` entre documentos**: la página del SDK no explica cómo resolver un `$ref` que apunta al `$id` de otro documento. Con Ajv, lo habitual es registrar antes el esquema referenciado, pero eso es documentación de Ajv, no consultada aquí. Sin poder verificar.
- **Dato sobre validación de entrada**: cuando los argumentos no cumplen el esquema, el SDK no llama al manejador y devuelve un resultado con `isError: true` cuyo texto incluye el detalle del fallo. El ejemplo de su documentación es «Input validation error: Invalid arguments for tool search: limit: Too big: expected number to be <=50». Fuente: https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/servers/tools.md
- **Resultado**: VERIFICADO EN PARTE.
- **Consecuencia que el diseño tiene que conocer** (hecho, no decisión): si el esquema del informe se entrega al SDK como `inputSchema`, la validación la hace el SDK antes del manejador. Entonces (a) un informe con campos ajenos se rechazaría, cuando REQ-021 pide descartarlos y contarlos; (b) un informe inválido devolvería un error del SDK con el detalle del fallo, cuando REQ-048 pide `guardado: false` con motivo `informe_invalido` y ningún valor recibido en la respuesta. No se ha verificado si el mensaje del SDK puede llegar a incluir el valor recibido. Esto enlaza con la propuesta 6 de `propuestas.md` (qué esquema se publica al asistente).

---

## 6. `mcp-handler` y `@modelcontextprotocol/server` (T-008)

### 6.1 Versiones

- `@modelcontextprotocol/server` 2.4.0 (23/10/2026) y `mcp-handler` 2.4.0 (12/11/2026). Fuentes en 1.1 y 1.2.
- **Diferencia con T-008**: T-008 anota `mcp-handler` 2.3.1. La 2.4.0 salió el mismo día de esta consulta.
- **Resultado**: VERIFICADO.

### 6.2 Streamable HTTP sin estado

- **Fuentes**:
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/serving/http.md
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/serving/web-standard.md
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/serving/legacy-clients.md
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/protocol-versions.md
  - https://raw.githubusercontent.com/vercel-labs/mcp-handler/main/README.md
- **Dato importante**: el propio SDK 2.x trae `createMcpHandler`. `createMcpHandler(factory)` «returns `{ fetch, close, notify, bus }`», y `fetch` es «a web-standard `(Request) => Promise<Response>`». La fábrica se ejecuta en cada petición y recibe el contexto de la petición: `era`, `authInfo` y la `Request` de entrada.
- **Sin estado por defecto**: «The handler holds nothing between requests» y el punto de entrada «scales horizontally as-is». No hay opción que activar.
- **Las dos épocas en el mismo punto de entrada**: `createMcpHandler` atiende 2026-07-28 de forma nativa y, con `legacy: 'stateless'` (valor por defecto), atiende a los clientes de 2025, que abren con `initialize`, «from a fresh instance out of your factory, with no sessions». Con `legacy: 'reject'`, un `initialize` de 2025 recibe `400` con `-32022` y `data.supported` solo con `"2026-07-28"`. En el modo por defecto, GET y DELETE responden `405` (desde la 2.4.0, con `Allow: POST`).
- **Modo de respuesta**: `createMcpHandler(factory, { responseMode: 'json' })` «never streams».
- **Autorización**: el manejador no deduce nada de las cabeceras. Se verifica el token antes y se pasa el resultado: `handler.fetch(request, { authInfo })`; las herramientas lo leen en `ctx.http.authInfo`.
- **Origen y host**: el manejador no valida `Host` ni `Origin`. Hay que envolverlo con `hostHeaderValidationResponse` y `originValidationResponse`, que devuelven `403`. La especificación obliga a validar `Origin` (2.2).
- **`mcp-handler` 2.x**: su `createMcpHandler(initialize, options)` se apoya en el SDK. README: 2026-07-28 «served natively, stateless»; el Streamable HTTP de 2025 se sirve «through the SDK's stateless legacy fallback on the same handler»; HTTP+SSE (2024-11-05) se eliminó en la 2.x. Las opciones de ruta y de transporte de la 1.x (`basePath`, `disableSse`, `redisUrl`, `maxDuration`, `sessionIdGenerator` y otras) ya no existen: se monta el manejador en la ruta que se quiera. Su ejemplo de Next.js exporta `handler as GET, handler as POST`.
- **Resultado**: VERIFICADO.
- **Pendiente**:
  - Qué versiones antiguas acepta exactamente el modo `legacy: 'stateless'`. La página de versiones dice que la época antigua va de `2024-10-07` a `2025-11-25`, pero el único ejemplo de `initialize` que da la documentación es con `2025-06-18`. Que responda bien a un `initialize` con `2025-11-25` se deduce, pero no está escrito: se comprueba con la prueba automática de CA-003.
  - Límite de tamaño del cuerpo: la documentación del SDK consultada no lo cubre (REQ-056). Solo existe `maxToolInputElements`, que limita el número de elementos de los argumentos de una llamada, no los bytes.
  - La documentación del SDK no menciona Next.js ni Vercel. `mcp-handler` sí da el ejemplo de ruta de Next.js.
- **Dato para el diseño**: con el SDK 2.4.0, `mcp-handler` añade sobre todo `withMcpAuth`, `protectedResourceHandler`, el manejador de CORS de metadatos y la integración con Next.js y la telemetría de Vercel; el SDK ya ofrece por su cuenta `createMcpHandler`, `requireBearerAuth` con comprobación de audiencia y `oauthMetadataResponse`. T-008 confirma las dos librerías; cuál aporta qué lo decide el diseño.

### 6.3 Anotaciones y esquema de salida

- **Fuente**: https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/servers/tools.md
  - `server.registerTool(nombre, { title, description, inputSchema, outputSchema, annotations }, manejador)`.
  - Ejemplo literal: `annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true }`. La página dice que las anotaciones son «behavior hints for the client» y que nunca cambian cómo ejecuta el SDK la herramienta. No nombra `openWorldHint` ni da valores por defecto.
  - `outputSchema` es opcional. Con él, se devuelve `structuredContent` junto al `content` legible, y «The SDK validates `structuredContent` against `outputSchema` before the result leaves your server».
  - «A tool that takes no arguments omits `inputSchema`.»
  - Las formas variádicas de la 1.x (`server.tool`) se eliminaron en `mcp-handler` 2.x a favor de `registerTool`.
- **Dato de la 2.4.0**: con una conexión 2025-11-25, un `outputSchema` creado con `z.object(...).meta({ id })` ya no se envuelve en `{ result }`: se lee `structuredContent` directamente.
- **Resultado**: VERIFICADO EN PARTE.
- **Pendiente**:
  - `openWorldHint`, que está en los cuatro contratos, no aparece en la página del SDK. Existe en el esquema del protocolo, pero aquí no se ha verificado que el SDK lo acepte y lo publique. Se comprueba con CA-004.
  - Qué esquema de entrada publica el SDK para una herramienta que omite `inputSchema`, frente al `{ "type": "object", "additionalProperties": false, "properties": {} }` del contrato de `obtener_instrucciones`. Sin verificar.
  - La documentación dice que la codificación de `structuredContent` en el cable «differs by protocol era»; no se ha leído el detalle.

### 6.4 Compatibilidad con Node 26 y Next.js 16

- **Node**: los dos paquetes declaran `node >=20`. El CI del SDK prueba 20, 22 y 24. Ninguna fuente nombra Node 26.
- **Next.js**: `mcp-handler` declara `next >=13.0.0` como dependencia de par opcional, y su README dice «Next.js 13+ when using Next.js». Ninguna fuente nombra Next.js 16.
- **Resultado**: VERIFICADO EN PARTE. Los rangos declarados incluyen Node 26 y Next.js 16.4; que funcionen se comprueba al instalar (la nota de `docs/TECNOLOGIAS.md` ya lo prevé).

---

## 3. Claude

### 3.1 Plan de pago más barato, conectores personalizados y tareas programadas

- **Fuentes**:
  - https://claude.com/pricing
  - https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
  - https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
  - https://code.claude.com/docs/en/routines
- **Plan**: Pro. 20 USD al mes con pago mensual, o 17 USD al mes con pago anual (200 USD por adelantado). La página solo muestra precios en dólares. Los siguientes son Max (100 USD) y Ultra (200 USD). El puesto estándar de Team cuesta lo mismo que Pro con pago anual (20 USD por puesto), pero exige al menos 2 puestos.
- **Conectores personalizados**: «available on Claude, Cowork, and Claude Desktop for Free, Pro, Max, Ultra, Team, and Enterprise plans. Free users are limited to one custom connector.» En Pro se añaden en «Customize > Connectors», «+ Add», «Add custom connector».
- **Tareas programadas**: la página de precios marca «Hand off and schedule tasks» en Pro. La ayuda de Cowork: «Scheduled tasks are available on all paid plans (Pro, Max, Ultra, Team, and Enterprise)». La documentación de Claude Code: «Scheduled tasks are available on Pro, Max, Ultra, Team, and Enterprise plans».
- **Resultado**: VERIFICADO. El plan de REQ-078 para Claude es Pro, y admite las dos cosas.
- **Pendiente**: el precio en euros y los impuestos no aparecen en la página.

### 3.2 Tipos de tarea programada, desde dónde se crean y límites

Hay tres cosas distintas con el mismo nombre. La documentación las separa así:

| | Tarea programada de Cowork («nueva experiencia de Claude») | Tarea programada en la nube de Claude Code (antes «routine») | Tarea programada local del escritorio (pestaña Code) |
| --- | --- | --- | --- |
| Dónde se ejecuta | En la nube, salvo que necesite archivos o aplicaciones locales | Infraestructura de Anthropic | En el ordenador del usuario |
| Necesita el ordenador encendido | No («even when your computer is asleep or the Claude Desktop app is closed») | No | Sí, con la app abierta y el equipo despierto |
| Desde dónde se crea | Desde cualquier conversación, o en la página «Scheduled» de Cowork («Create with Claude» o «Set up manually»); también con `/schedule` | `claude.ai/code/routines`, la app de escritorio (pestaña Code, «Scheduled») o la CLI con `/schedule` | App de escritorio, pestaña Code, «Scheduled», «Only on this computer» |
| Qué es | Una tarea de Cowork | «a saved Claude Code configuration: a prompt, one or more repositories, and a set of connectors» | Una sesión de Claude Code en una carpeta local |
| Frecuencias | Cada hora, cada día, cada semana, días laborables o manual | Cada hora, cada día, cada semana, o expresión cron | Cada hora, cada día, laborables, cada semana, manual o cron |
| Intervalo mínimo | No lo dice | 1 hora: «Expressions that run more often than once per hour are rejected» | 1 hora en los formularios; 1 minuto si lo fija Claude |
| Conectores | «any connectors and plugins you've set up in Cowork» | «All of your connected MCP connectors are included by default» | Archivos de configuración y conectores |
| Estado | No lo dice | «research preview. Behavior, limits, and the API surface may change» | Requiere Claude Desktop 1.1.5368 o posterior |

- **Fuentes**:
  - https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
  - https://code.claude.com/docs/en/routines
  - https://code.claude.com/docs/en/scheduled-tasks.md (tabla «Compare scheduling options»)
  - https://code.claude.com/docs/en/desktop-scheduled-tasks.md
- **Límites de ejecuciones**:
  - Tareas en la nube de Claude Code: «Scheduled runs, including one-off runs: 100 per hour», por cuenta; «The run waits until the limit resets». No hay límite diario publicado. Además consumen el uso de la suscripción: «Without usage credits, additional runs are rejected until your usage window resets».
  - Tareas de Cowork: la ayuda no da ningún límite de tareas ni de ejecuciones, ni dice cuánto uso consumen.
  - Tareas locales del escritorio: sin límite publicado. Si el equipo duerme, la ejecución se salta; al despertar hay una sola ejecución de recuperación por tarea.
- **Puntualidad** (tareas en la nube de Claude Code): «if you schedule a run exactly on the hour, such as 9:00, it can start several minutes late». Las locales llevan «a small delay of a few minutes».
- **Resultado**: VERIFICADO EN PARTE. Una ejecución cada hora (24 al día) cabe en el intervalo mínimo documentado y no hay límite diario que lo impida.
- **Sin poder verificar**: si 24 ejecuciones al día, cada una con lectura de buzón, caben en el uso incluido en el plan Pro. Ninguna fuente da la cifra. Es el riesgo principal para CA-006 en Claude y se resuelve con la prueba real.
- **Dato para el guion**: la tarea en la nube de Claude Code está pensada para repositorios («a prompt, one or more repositories…») y la de Cowork para trabajo de oficina. REQ-078 dice que se prueba desde «la que ofrezca tareas programadas en ese plan»: en Pro las ofrecen las dos, así que hay que elegir cuál se prueba, o las dos. Lo decide el guion, no este documento.

### 3.3 ¿Las tareas programadas usan los conectores personalizados? (V-101)

- **Fuentes**: las de 3.2 y https://claude.com/docs/connectors/building/index.md
- **Lo que dicen**:
  - Cowork: las tareas programadas tienen «the same capabilities as regular Cowork tasks, including connected tools, skills, and installed plugins».
  - Claude Code en la nube: «Connectors are the claude.ai integrations on your account»; «When you create a scheduled task, all of your currently connected connectors are included by default»; «Claude can use an included connector during a run, including writes».
  - Infraestructura: «Directory and custom connectors run on the same infrastructure».
- **Resultado**: VERIFICADO EN PARTE. Ninguna página dice con esas palabras «los conectores personalizados funcionan en tareas programadas». Lo que sí dicen es que las tareas usan los conectores de la cuenta y que los personalizados y los del directorio comparten infraestructura. V-101 sigue necesitando la prueba real.

### 3.4 Callbacks y registro del cliente (T-010 y T-011)

- **Fuente**: https://claude.com/docs/connectors/building/authentication.md
- **Callback de las aplicaciones alojadas** (claude.ai en la web, escritorio, móvil y Cowork): «register exactly this redirect URI: `https://claude.ai/api/mcp/auth_callback`». Coincide con T-010.
- **Callback de Claude Code**: distinto. «Claude Code is a native client and uses an RFC 8252 loopback redirect on an ephemeral port that varies per session, such as `http://localhost:3118/callback`.» Declara `http://localhost/callback` y `http://127.0.0.1/callback` en su documento CIMD, `https://claude.ai/oauth/claude-code-client-metadata`, y pide que se acepten «with the port component ignored». La página dice: «Your authorization server must accept both».
- **Registro**:
  - Tipos admitidos por defecto: `oauth_dcr` y `oauth_cimd`.
  - «Claude normally selects CIMD only when your authorization server metadata advertises both `"client_id_metadata_document_supported": true` and `"none"` in `token_endpoint_auth_methods_supported`, and otherwise falls back to DCR.»
  - Con DCR: «DCR causes Claude to register a new client on every fresh connection, which can result in very large numbers of registered clients on your authorization server.»
  - «DCR registers Claude as a public client, and CIMD normally does too.»
  - En el diálogo de conector personalizado, el usuario elige entre «Use Claude's published identity (Recommended)», «Register automatically» o «Use your own OAuth client» (fuente: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).
- **Host del documento CIMD**: `claude.ai`. La URL del documento de Claude Code está escrita en la página (arriba). La de las aplicaciones alojadas no aparece literal en la página de autenticación; la documentación de autenticación gestionada para empresas da `https://claude.ai/oauth/mcp-oauth-client-metadata/confidential_client` para la variante confidencial, de lo que se deduce `https://claude.ai/oauth/mcp-oauth-client-metadata` para la pública. Esa segunda página se ha leído solo a través del resumen del buscador: **la URL exacta queda sin verificar** y se anota en la prueba real (REQ-028).
- **Otros requisitos que impone Claude** (misma página):
  - «A `401` is required to start sign-in, and Claude ignores a `WWW-Authenticate` header on a `200` response.»
  - El campo `resource` del documento de recurso protegido «must equal the URL as the user enters it in Claude, including any path component».
  - «Claude uses only the first entry in your metadata's `authorization_servers` list.»
  - PKCE: «Claude includes a PKCE `code_challenge` with `code_challenge_method=S256` on every authorization request.» El servidor debe anunciar `"code_challenge_methods_supported": ["S256"]`.
  - Ámbitos: si el `401` no trae `scope`, Claude pide los de `scopes_supported` del recurso. «Claude also appends `offline_access` when your authorization server metadata lists it in `scopes_supported`, to obtain a refresh token.»
  - Renovación: «Claude refreshes tokens reactively on a `401` response, and proactively up to five minutes before the stored expiry.» Hay que devolver `invalid_grant` cuando el token de renovación ya no vale, y «If you rotate, return the new refresh token in the same response that invalidates the old one».
  - El punto `/token` debe aceptar `application/x-www-form-urlencoded`; el de registro usa `application/json`.
  - Tiempos: 10 segundos para descubrimiento, registro y token; 30 segundos para la renovación.
  - Pantalla: «On your consent screen, display the redirect URI's hostname clearly.»
- **Versión de la especificación de autorización**: «Claude follows the 2025-03-26, 2025-06-18, and 2025-11-25 authorization specifications» (https://claude.com/docs/connectors/building/index.md). No nombra la 2026-07-28.
- **Resultado**: VERIFICADO.
- **Lo que esto implica frente a T-010 y a la especificación**:
  - T-010 es correcta para las aplicaciones alojadas. No contempla Claude Code. Si la prueba se hiciera con tareas programadas de Claude Code creadas desde la web o el escritorio, el conector se añade en claude.ai y el callback es el de T-010; el callback de bucle local solo aparece si alguien conecta el conector desde la CLI. La lista cerrada de REQ-006 lo rechazaría, que es coherente con la especificación de la función, pero conviene saberlo.
  - Con un token de acceso de 5 minutos (REQ-012), la renovación proactiva «up to five minutes before the stored expiry» puede hacer que Claude renueve en cada uso, o casi. No rompe nada, y ejercita la rotación más de lo previsto. Con dos revisiones simultáneas (CA-007) es justo el caso de REQ-044.
  - Si el conector admite DCR y el cliente elige «Register automatically», cada conexión nueva crea un registro: es el motivo del límite y la purga de REQ-008.

### 3.5 Desde qué direcciones llama y qué versión del protocolo declara

- **Fuentes**:
  - https://claude.com/docs/connectors/building/authentication.md, apartado «Network reference»
  - https://platform.claude.com/docs/en/api/ip-addresses
  - https://claude.com/docs/connectors/building/index.md
- **Direcciones**: los conectores remotos se llaman desde la nube de Anthropic, no desde el equipo del usuario («They connect from Anthropic's cloud, so servers must be reachable over the public internet»). Las peticiones de descubrimiento al servidor de autorización salen del mismo rango.
- **Contradicción entre fuentes**: la página de autenticación dice «Anthropic's outbound traffic to your server originates from `160.79.104.0/21`». La referencia de direcciones lista dos rangos de salida IPv4: `160.79.104.0/21` y `153.61.208.0/20`. Las dos son oficiales. No se elige: si alguna vez se filtra por dirección, hay que contar con los dos.
- **Versión del protocolo**: **SIN PODER VERIFICAR**. La documentación para constructores no dice qué versión declara el cliente de Claude al abrir. Solo dice qué especificaciones de autorización sigue (hasta 2025-11-25), que usa Streamable HTTP y que «Claude also supports the legacy HTTP+SSE transport». V-104 afirma que «Claude declara hasta 2025-11-25»; hoy no se ha encontrado una fuente que lo diga para el protocolo base. Se anota en la prueba real (REQ-028).
- **Funciones del protocolo**: Claude admite herramientas, prompts y recursos, y resultados de texto e imagen. No admite «Resource subscriptions, Sampling, Advanced or draft capabilities». La página no menciona `structuredContent` ni `outputSchema`: sin poder verificar si Claude los usa o solo lee el texto.
- **Límites**: resultado de herramienta de unos 150 000 caracteres y 240 segundos por llamada en claude.ai y escritorio. El prompt del contrato admite hasta 100 000 caracteres: cabe.
- **Resultado**: VERIFICADO EN PARTE.

### 3.6 Anotaciones, confirmaciones y permiso para ejecuciones programadas (V-103)

- **Fuentes**:
  - https://claude.com/docs/connectors/building/mcp.md
  - https://claude.com/docs/connectors/getting-started
  - https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
  - https://code.claude.com/docs/en/routines, apartado «Permission prompts during a run»
  - https://code.claude.com/docs/en/desktop-scheduled-tasks.md, apartado «Permissions for scheduled tasks»
- **Anotaciones**: «All MCP tools must declare both of these annotations: `readOnlyHint` [...] `destructiveHint`. Claude and users read these hints to understand what actions a tool can take.» Los permisos se muestran agrupados por tipo («read-only tools, write/delete tools»).
- **Permisos por herramienta, en un plan individual**: en la página del conector, «under **Tool permissions**, choose **Always allow**, **Needs approval**, or **Blocked** for each group of tools or for a single tool». En el chat: «Select **Allow once** to continue, or **Always allow** to skip the prompt for that tool from now on».
- **En Cowork**: tres modos. Manual («Claude pauses and asks for approval for actions»), automático («Read-only connector tools are approved, and Claude decides on write/delete tools», con una revisión de seguridad de cada acción) y sin aprobaciones. El formulario manual de una tarea programada incluye «The approval mode».
- **En tareas en la nube de Claude Code**: la sesión empieza en modo automático, donde «a classifier model allows or blocks actions that would otherwise wait for your approval». Aun así, «A run still stops and waits for an answer» si la acción coincide con una regla de preguntar o si se acumulan bloqueos. Además: «The fired prompt is therefore not live user input and can't act as approval or consent for actions during the run».
- **En tareas locales del escritorio**: «To avoid stalls, click **Run now** after creating a task, watch for permission prompts, and select "always allow" for each one. Future runs skip most of those prompts.» Esas aprobaciones se guardan por tarea y se pueden revocar en el panel «Always allowed».
- **Resultado**: VERIFICADO EN PARTE.
- **Sobre el permiso «permitir en todas las ejecuciones programadas» que nombra V-103**: el texto «Allow for all scheduled runs» aparece en la documentación de Claude Desktop para despliegues con proveedores en la nube (`https://claude.com/docs/third-party/claude-desktop/scheduled-tasks`), que no es el plan Pro, y se ha leído solo a través del resumen del buscador. Para el plan Pro no se ha encontrado una fuente que describa esa opción con ese nombre. Lo documentado para Pro es «Always allow» por herramienta en la página del conector. **Sin poder verificar** que «Always allow» valga en una ejecución programada de Cowork: se resuelve con la prueba real.
- **Dato que afecta al contrato** (hecho): en el modo automático de Cowork, las herramientas de solo lectura se aprueban y las de escritura las decide el modelo revisor. `obtener_instrucciones` declara `readOnlyHint: true`; `enviar_informe` y `confirmar_orden` declaran `readOnlyHint: false` y `destructiveHint: false`. Según la documentación, las dos escrituras dependen de «Always allow» o de la decisión del clasificador. REQ-016 prohíbe cambiar las anotaciones para evitarlo.

### 3.7 Conector de Gmail

- **Fuentes**:
  - https://claude.com/marketplace/connectors/gmail
  - https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
  - https://claude.com/docs/connectors/getting-started
- **Quién lo publica**: «Made by Google», con la marca de verificado de Anthropic; añadido en marzo de 2026. Disponible «for all users on Claude and Claude Desktop».
- **Acciones**: la ficha anuncia 29 herramientas y muestra 24 (las otras 5 quedan tras «Show all 29 tools» y no se han visto). Las visibles, por lo que pide la especificación de la función:

| Acción que interesa | Herramientas del conector |
| --- | --- |
| Leer | `search_threads`, `get_message`, `get_thread`, `list_drafts`, `list_labels`, `list_filters` |
| Etiquetar | `label_message`, `label_thread`, `unlabel_message`, `unlabel_thread`, `create_label`, `delete_label` |
| Crear borrador | `create_draft` |
| Enviar | `send_message`, `reply` |
| Reenviar | `forward` |
| Eliminar | `trash_message`, `trash_thread` (mover a la papelera; no se ha visto borrado definitivo) |
| Otras | `create_filter`, `mark_message_spam`, `mark_thread_spam`, `unmark_message_spam`, `apply_sensitive_message_label`, `apply_sensitive_thread_label` |

- **Confirmación por defecto**: para enviar, responder y reenviar, «By default, Claude asks for your approval before each of these actions».
- **¿Se puede bloquear cada acción por separado?** Sí, según la documentación general de conectores: «choose **Always allow**, **Needs approval**, or **Blocked** for each group of tools or for a single tool». La ayuda de Google Workspace añade: «Individual users can also disable specific tools from the chat interface».
- **Contradicción menor**: la ayuda de Google Workspace no menciona la papelera en Gmail; la ficha sí lista `trash_message` y `trash_thread`. La ficha es la fuente más concreta.
- **Resultado**: VERIFICADO EN PARTE. El conector ofrece leer, etiquetar y crear borrador (REQ-060) y también enviar, reenviar y mover a la papelera, y la documentación dice que cada herramienta se puede poner en «Blocked» (REQ-062).
- **Hallazgos que el guion y el diseño deben conocer**:
  - `create_filter` existe. Un filtro de Gmail puede reenviar o eliminar correo. REQ-061 dice que el agente no «configura reenvíos o reglas»; REQ-062 solo manda bloquear «enviar, eliminar y reenviar». Para que el límite esté en el anfitrión, `create_filter` debería bloquearse también. Ver H-3.
  - `reply` envía correo: entra en «enviar» y hay que bloquearlo junto a `send_message`.
  - Las 5 herramientas no vistas hay que inventariarlas en la cuenta de prueba antes de la primera ejecución.
- **Sin poder verificar**: que el ajuste «Blocked» por herramienta esté disponible para el conector de Gmail en el plan Pro (la documentación general lo afirma para cualquier conector; la ayuda de Google Workspace no lo describe), y si `label_message` y `create_draft` piden aprobación en una ejecución programada (REQ-067). Prueba real.

---

## 4. ChatGPT

Aviso sobre las fuentes: `help.openai.com` devolvió «403 Forbidden» a la lectura directa en todas las páginas probadas. Lo que se cita de la ayuda de OpenAI se ha leído solo a través del resumen del buscador, y se marca «(vía buscador)». Eso no cumple del todo el procedimiento: esas entradas quedan como VERIFICADO EN PARTE o SIN PODER VERIFICAR hasta que una persona abra la página. Lo de `developers.openai.com`, `chatgpt.com` y `learn.chatgpt.com` sí se ha leído directamente.

La documentación de OpenAI ha cambiado de nombres: lo que antes eran «connectors» ahora aparece como «apps» y «plugins», y un servidor MCP propio se añade como «custom MCP server» dentro de «ChatGPT Plugins».

### 4.1 Plan de pago más barato, conectores personalizados y tareas programadas

- **Fuentes**:
  - https://chatgpt.com/pricing (tabla de funciones, sin cifras de precio en el texto leído)
  - https://learn.chatgpt.com/docs/pricing.md (precios)
  - https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt (vía buscador; título actual «Connecting custom MCP servers in ChatGPT»)
- **Plan de pago más barato**: **Go, 8 USD al mes**. El siguiente es Plus, 20 USD al mes. Después Pro (desde 100 USD) y Business (20 USD por usuario con pago anual, mínimo 2 usuarios).
- **Tareas programadas**: «Scheduled tasks» figura como disponible en Go, Plus y Pro.
- **Modo desarrollador**: la tabla de `chatgpt.com/pricing` da «Developer mode (beta)» como **no disponible en Go** y disponible en Plus y Pro.
- **MCP**: la matriz de `learn.chatgpt.com` da «MCP» como disponible en Plus, Pro, Business y Enterprise/Edu. Esa matriz no incluye Free ni Go.
- **Contradicción entre fuentes**:
  - La tabla de precios da el modo desarrollador en Plus.
  - La ayuda de OpenAI (vía buscador) dice que el soporte completo de MCP está disponible «only [...] to Business and Enterprise/Edu users, currently» y que los usuarios Pro pueden conectar servidores MCP propios «with read/fetch permissions».
  - INDICIO (foro de la comunidad, no oficial): hay mensajes que dicen que el paso de activar el modo desarrollador ya no hace falta, y otros que dicen que en Plus y Pro los conectores propios solo funcionan con él.
  - No se elige. Las tres cosas no pueden ser ciertas a la vez para Plus.
- **Resultado**: VERIFICADO EN PARTE.
  - Verificado: el plan de pago más barato es Go; Go tiene tareas programadas; Go no tiene modo desarrollador.
  - Sin poder verificar: si en Go se puede añadir un servidor MCP propio sin modo desarrollador, y si en Plus se admiten herramientas de escritura.
- **Consecuencia para REQ-078** (hecho): el plan que fija REQ-078 para ChatGPT es Go. La documentación indica que lo más probable es que Go no admita conectores personalizados. REQ-078 ya prevé el caso: se anota «no» para ese plan y el responsable decide si se prueba el siguiente (Plus). Conviene que el responsable lo sepa antes de contratar las cuentas. Ver H-2.

### 4.2 Tareas programadas: tipos, límites y desde dónde se crean

- **Fuente**: https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt (vía buscador)
- **Lo que dice el resumen**:
  - Tareas activas a la vez: 3 en Free y Go, 5 en Plus, 10 en Business y Edu, 15 en Pro y Enterprise.
  - Frecuencia: los planes de pago pueden programar tareas recurrentes «up to once per hour»; en Free, como mucho una al día.
  - Hay además tareas disparadas por eventos (por ejemplo, un mensaje nuevo en Gmail), que exigen «Work» y un plan Plus o superior; no están en Free ni en Go. Tope: 30 por hora y 720 al día entre todas.
  - Una tarea completada consume el uso del plan aunque no publique nada.
- **Resultado**: VERIFICADO EN PARTE (vía buscador). Una tarea cada hora (24 al día) cabe en lo documentado para los planes de pago.
- **Sin poder verificar**: desde qué aplicación se crean (web, escritorio, móvil), si existe un tipo de tarea local frente a uno en la nube, y cuánto uso consume cada ejecución. No se ha encontrado fuente oficial legible.

### 4.3 ¿Las tareas programadas pueden usar conectores personalizados? (V-102)

- **Fuentes**: https://developers.openai.com/api/docs/guides/custom-mcp-server · https://help.openai.com/en/articles/20001497-troubleshooting-plugins-and-apps-in-chatgpt (vía buscador)
- **Lo que hay**:
  - La guía para desarrolladores de servidores MCP propios no dice nada de tareas programadas.
  - La ayuda (vía buscador) dice que una acción que envía un mensaje o cambia datos externos puede necesitar aprobación y que, en ese caso, la tarea «pauses until you review it»; manda mirar en «Scheduled» si hay una aprobación pendiente.
  - INDICIO (foro de la comunidad, no oficial): hay informes de ejecuciones programadas en las que la llamada se bloquea con el mensaje «This tool call was blocked by OpenAI's safety checks» en lugar de pedir aprobación, incluso con todos los permisos concedidos, y de escrituras de Gmail y de Hojas de cálculo que fallan en ejecuciones programadas y funcionan en conversación. Una respuesta de personal de OpenAI decía que habían publicado un cambio. No es confirmación oficial.
- **Resultado**: **SIN PODER VERIFICAR**. No hay fuente oficial que diga que un servidor MCP propio se puede usar en una tarea programada. V-102 sigue como está y se resuelve con la prueba real.

### 4.4 Callbacks: forma exacta (T-010)

- **Fuente**: https://developers.openai.com/apps-sdk/build/auth (leída directamente)
- **Las dos direcciones**:
  - Estable: `https://chatgpt.com/connector_platform_oauth_redirect`
  - Con parte variable: `https://chatgpt.com/connector/oauth/{callback_id}`
- **Cuándo usa cada una**. Literal:
  - «If your authorization server meets those requirements, ChatGPT uses the stable redirect URI `https://chatgpt.com/connector_platform_oauth_redirect`.» Si no, «ChatGPT uses the callback-ID-specific redirect URI `https://chatgpt.com/connector/oauth/{callback_id}`».
  - Los requisitos son los de identificación del emisor (RFC 9207): «Set `authorization_response_iss_parameter_supported: true` in your [metadata] only when your authorization server returns an `iss` parameter in every authorization response, including error responses»; «Return `iss` in every successful and error authorization response»; «Use the same exact issuer identifier in the metadata `issuer` field»; «clients use exact string comparison and do not normalize trailing slashes, paths, ports, or casing».
  - «If the server advertises issuer identification but omits `iss` or returns a mismatch, ChatGPT and Codex reject the response.»
  - «MCP servers published before ChatGPT introduced callback-ID-specific redirects also continue to use the stable redirect URI.»
  - «Copy the exact production redirect URI shown in the MCP server's management page into your authorization server's allowlist.»
- **Qué es `{callback_id}`**: la página no lo define. No dice su formato, su longitud ni si es por servidor o por conexión. Sin poder verificar por documentación. Lo que sí dice es que la página de gestión del servidor MCP en ChatGPT muestra la dirección exacta.
- **Resultado**: VERIFICADO (las dos formas y la condición); SIN PODER VERIFICAR (el formato de la parte variable).
- **Consecuencia para el diseño** (hecho, es la respuesta a la propuesta 10 de `propuestas.md`): la dirección con parte variable no se puede poner en una lista cerrada de coincidencia exacta sin conocer el valor. La documentación ofrece dos caminos, y no se elige aquí:
  1. Emitir `iss` en todas las respuestas de autorización y anunciarlo en los metadatos. Entonces ChatGPT usa la dirección estable, que sí admite coincidencia exacta. Es además lo que la especificación MCP recomienda (2.4).
  2. No emitir `iss` y registrar la dirección concreta que muestre la página de gestión, una por servidor añadido.
- **Diferencia con T-010**: T-010 lista las tres direcciones como si las tres hubiera que admitirlas. Según la documentación, ChatGPT usa una u otra según el servidor de autorización cumpla o no la identificación del emisor.

### 4.5 Registro del cliente (T-011)

- **Fuente**: https://developers.openai.com/apps-sdk/build/auth
- **CIMD**, preferido: el `client_id` es una URL de metadatos en `chatgpt.com`. «ChatGPT uses the stable `https://chatgpt.com/oauth/client.json`» o, «for other servers, it uses the callback-ID-specific `https://chatgpt.com/oauth/{callback_id}/client.json`». Exige `client_id_metadata_document_supported: true`. «When using CIMD, there is no client registration step.» «The MCP server's management page shows the exact client metadata document and redirect URI.»
- **DCR**: «ChatGPT runs DCR once per MCP server connection, then keeps and reuses the registered OAuth client for that connection.»
- **Elección**: «ChatGPT prioritizes CIMD when it is available, but the plugin builder can choose DCR when both CIMD and DCR are available.»
- **Host para la lista cerrada de REQ-008**: `chatgpt.com`. Igual que el callback, el documento CIMD tiene una forma estable y otra con `{callback_id}`.
- **Metadatos que pide**: recurso protegido con `resource`, `authorization_servers` y, opcional, `scopes_supported`; servidor de autorización con `issuer`, `authorization_endpoint`, `token_endpoint`, `code_challenge_methods_supported` con `S256`, `token_endpoint_auth_methods_supported` y `registration_endpoint` si hay DCR.
- **`resource`**: ChatGPT lo envía en la petición de autorización y en la de token. El servidor debe rechazar los tokens que no lleven la audiencia esperada.
- **Sin token o token inválido**: `401` con `WWW-Authenticate` que apunte a los metadatos de recurso protegido.
- **Tokens de renovación**: la página solo dice que los tokens pueden caducar o rotar y que hay que prever la renovación. No describe cuándo renueva ChatGPT ni cómo se comporta con peticiones simultáneas. Sin poder verificar.
- **Versión de la especificación**: los requisitos de autorización remiten a la 2025-11-25 y las reglas de identificación del emisor, a la 2026-07-28.
- **No admite**: concesiones de máquina a máquina ni claves de API fijas. Coincide con T-009.
- **Resultado**: VERIFICADO.

### 4.6 Desde qué direcciones llama y qué versión del protocolo declara

- **Fuentes**: https://developers.openai.com/api/docs/guides/ip-addresses · https://developers.openai.com/apps-sdk/build/auth · https://developers.openai.com/api/docs/guides/custom-mcp-server · https://developers.openai.com/apps-sdk/reference
- **Direcciones**: OpenAI publica los rangos en un archivo, `https://openai.com/chatgpt-connectors.json`, que cubre «Plugins, connectors, GPT Actions, and agentic commerce». Avisa de que «The ranges can change as OpenAI infrastructure changes». No se ha descargado el archivo.
- **Certificado de cliente**: «ChatGPT now presents an OpenAI-managed client certificate when establishing TLS connections to MCP servers.» Sirve para autenticar a ChatGPT como cliente (mTLS) si el servidor lo comprueba. En una función de Vercel no está verificado que se pueda leer el certificado de cliente.
- **Transporte**: «SSE and streaming HTTP». La guía de conexión pide la URL con la ruta `/mcp`.
- **Versión del protocolo**: **SIN PODER VERIFICAR**. Ninguna página leída dice qué versión declara ChatGPT. La referencia enlaza las especificaciones 2025-06-18 y 2025-11-25 para los campos de las herramientas, sin decir cuál implementa. Se anota en la prueba real (REQ-028).
- **Resultado**: VERIFICADO EN PARTE.

### 4.7 Anotaciones y herramientas de escritura (V-103)

- **Fuentes**: https://developers.openai.com/apps-sdk/reference · https://developers.openai.com/api/docs/guides/custom-mcp-server
- **Anotaciones**: `readOnlyHint`, `destructiveHint` y `openWorldHint` figuran como obligatorias; `idempotentHint`, como opcional.
  - `destructiveHint`: «Declare that the tool may delete or overwrite user data so the host knows to elicit explicit approval first.»
  - `openWorldHint`: «Declare that the tool accesses the public internet or open-ended external entities.»
  - Las anotaciones «only influence how ChatGPT or Codex frames the tool call to the user»; «servers must still enforce their own authorization logic».
- **Escrituras**: «Write actions by default require confirmation.» La detección respeta `readOnlyHint`: «Tools without this hint are treated as write actions.»
- **Recordar la aprobación**: la aprobación o el rechazo se puede recordar por herramienta **para una conversación**. Las conversaciones nuevas vuelven a preguntar.
- **Resultado**: VERIFICADO.
- **Consecuencia que el diseño y el responsable tienen que conocer** (hecho, no decisión): `enviar_informe` y `confirmar_orden` declaran `readOnlyHint: false`, así que en ChatGPT son escrituras y piden confirmación por defecto. La única forma documentada de no repetir la confirmación vale para una conversación. Si cada ejecución programada es una conversación nueva, la documentación apunta a que pedirá confirmación en cada ejecución, y la ayuda dice que la tarea se detiene hasta que alguien la revise. Eso es el resultado «no» del «Criterio de sí o no» y es justo lo que la prueba real tiene que confirmar o desmentir. REQ-016 prohíbe cambiar las anotaciones para evitarlo; el plan B número 2 (D-009) reduce las escrituras de dos a una, pero no las elimina.
- **Sobre `obtener_instrucciones`**: declara `readOnlyHint: true`, así que ChatGPT no pediría confirmación. La cuestión abierta del contrato (¿es compatible con anotar una ejecución y marcar la orden como entregada?) pesa más aquí, porque en ChatGPT esa anotación decide si se pregunta.
- **Niveles de permiso**: INDICIO (foro de la comunidad): «Always ask», «Allow read actions», «Allow low-risk actions» y «Allow all actions». No se ha encontrado la página oficial que los describa para planes individuales. La ayuda de agentes de espacio de trabajo (vía buscador) dice que las escrituras de las apps quedan en «Always ask» por defecto y que algunas admiten «Never ask»; es para Business y Enterprise.

### 4.8 Conector de Gmail en ChatGPT

- **Fuentes**: https://help.openai.com/en/articles/10128477-chatgpt-enterprise-and-edu-release-notes (vía buscador) · https://help.openai.com/en/articles/11487775-connected-apps-in-chatgpt (no legible, 403)
- **Lo que hay** (vía buscador): Gmail está disponible como app conectada desde el 28/08/2025. Las acciones de escritura se añadieron el 13/03/2026 y, en espacios de trabajo, están desactivadas hasta que un administrador las active en «Settings > Apps > Manage actions per app». Los administradores pueden activar o desactivar acciones concretas.
- **Resultado**: **SIN PODER VERIFICAR**. No se ha podido leer ninguna página oficial que liste las acciones de Gmail en ChatGPT (leer, etiquetar, crear borrador, enviar, eliminar, reenviar), ni que diga si un usuario de un plan individual puede desactivar cada acción por separado. El control por acción está documentado para administradores de espacios de trabajo, no para Go ni Plus.
- **Consecuencia** (hecho): si en el plan individual no se pueden bloquear enviar, eliminar y reenviar, se aplica REQ-063: en ChatGPT no se conecta el buzón y la prueba se hace solo con el ciclo de las tres herramientas. Hay que comprobarlo en la cuenta antes de la primera ejecución.

---

## 7. Dónde guardar el estado de la prueba

Requisito de fondo: REQ-003 (en la UE, en plan gratuito) y que la rotación del token de renovación sea atómica con peticiones simultáneas (REQ-013, REQ-044, CA-008). Se anotan hechos; no se elige.

### 7.1 Postgres de Supabase, plan gratuito

- **Fuentes**:
  - https://supabase.com/pricing
  - https://supabase.com/docs/guides/platform/regions
  - https://supabase.com/docs/guides/platform/free-project-pausing (vía buscador)
  - https://supabase.com/docs/guides/database/connecting-to-postgres
  - https://www.postgresql.org/docs/current/explicit-locking.html
- **Plan gratuito**: 2 proyectos activos («Limit of 2 active projects»), 500 MB de base de datos por proyecto, CPU compartida con 500 MB de RAM, 5 GB de salida, sin copias automáticas.
- **Regiones de la UE**: `eu-west-1` (Irlanda), `eu-west-3` (París), `eu-central-1` (Fráncfort) y `eu-north-1` (Estocolmo). `eu-west-2` (Londres) y `eu-central-2` (Zúrich) no son UE. Atención: existe una región «general» llamada Europe que «may not match a specific jurisdiction» y puede desplegar en Londres o Zúrich; para residencia en la UE hay que elegir una región concreta. La página no dice si la elección de región está limitada en el plan gratuito.
- **Pausa por inactividad**: «Free projects are paused after 1 week of inactivity.» La documentación (vía buscador) dice que cuenta como inactivo el proyecto sin suficiente actividad de base de datos en la última semana, que unas pocas peticiones diarias suelen bastar para evitarla, y que se avisa por correo. Reanudar es manual, desde el panel.
- **Contradicción entre fuentes** (plazo para restaurar un proyecto pausado): la documentación actual dice un año; una entrada del registro de cambios de junio de 2024 y una etiqueta de la página de planes dicen 90 días. No afecta a la prueba.
- **Conexión desde una función de Vercel**:
  - Agrupador compartido en modo transacción (puerto 6543): «Use it for serverless and edge functions, which open many short-lived connections». IPv4 en todos los planes.
  - Agrupador compartido en modo sesión (puerto 5432): IPv4 en todos los planes.
  - Conexión directa: por IPv6 en los planes gratuito y Pro, salvo que se contrate IPv4.
  - Agrupador dedicado: solo Pro o superior.
  - En modo transacción, «The shared pooler doesn't support prepared statements»; hay que desactivarlas en el controlador (`prepare: false` en Postgres.js). Las transacciones funcionan, pero la conexión vuelve al grupo al terminar cada una, así que no se conserva estado de sesión.
  - La otra vía es la API de datos (REST): no abre conexiones de Postgres y depende de RLS («RLS with no policies denies every request»). La página no menciona la llamada a funciones por `rpc`; sin verificar aquí.
- **Operaciones atómicas**: es Postgres. Con un bloqueo de fila, las demás transacciones que intenten actualizar o bloquear la misma fila «will be blocked until the current transaction ends», y después ven la fila ya actualizada. Eso es lo que hace falta para que diez renovaciones simultáneas con el mismo token den el mismo par (CA-008). Las funciones `privado.mcp_*` de `docs/MODELO-DATOS.sql` ya siguen ese patrón.
- **Resultado**: VERIFICADO EN PARTE.
- **Lo que hay que saber**:
  - `docs/TECNOLOGIAS.md` tiene esta opción en «Descartado» («Plan gratuito de Supabase o Hobby de Vercel: pausa por inactividad y sin copias; uso comercial prohibido y sin DPA») y T-003 confirma el plan Pro. La decisión posterior del responsable («usemos sus versiones gratuitas hasta tener una versión distribuible», `aclaraciones.md`, cuestión 5) la contradice para esta fase. El registro no está actualizado: le toca al chat de coordinación, no a este documento.
  - Durante la prueba hay tráfico cada hora, así que la pausa no se dispara. Entre el cierre de la función 001 y la fase 2, el conector sigue desplegado sin tráfico (REQ-076): el proyecto gratuito se pausaría a la semana, y CA-046 pide que el conector siga superando las comprobaciones de metadatos. Si los metadatos no tocan la base de datos, no se ve afectado; si la tocan, sí.
  - El límite de 2 proyectos activos coincide justo con preproducción y producción (función 002, V-114).
  - V-107 (rol propio de Postgres desde Vercel por el agrupador) es de la fase 2 y sigue sin verificar.

### 7.2 Alternativa: Postgres de Neon, plan gratuito

- **Fuentes**:
  - https://neon.com/docs/introduction/plans
  - https://neon.com/docs/introduction/regions
  - https://neon.com/docs/serverless/serverless-driver
- **Plan gratuito**: 0 USD; 100 proyectos; 1 GB por proyecto; 100 horas de cómputo por proyecto y mes; restauración de hasta 6 horas.
- **Regiones de la UE**: solo `aws-eu-central-1` (Fráncfort). `aws-eu-west-2` es Londres, fuera de la UE. Las regiones de Azure ya no admiten proyectos nuevos. La región no se puede cambiar después. La página no dice si todas las regiones están en el plan gratuito.
- **Inactividad**: no se pausa el proyecto, pero el cómputo se suspende tras 5 minutos sin actividad y en el plan gratuito no se puede desactivar («Scale to zero is always enabled»). La primera petición tras la suspensión tarda más; no se ha verificado cuánto.
- **Conexión desde Vercel**: controlador `@neondatabase/serverless`, que consulta por HTTP o por WebSocket en lugar de TCP. Por HTTP, `sql.transaction()` ejecuta varias consultas en una transacción no interactiva; las transacciones interactivas necesitan WebSocket (`Pool` o `Client`). Requiere Node.js 19 o posterior.
- **Operaciones atómicas**: Postgres, igual que 7.1.
- **Resultado**: VERIFICADO EN PARTE. No se ha comprobado el uso comercial, el acuerdo de encargo de tratamiento ni el encaje con D-002, que confirma Supabase.
- **Dato**: con una ejecución cada hora, el cómputo arrancaría en frío en casi todas (suspensión a los 5 minutos). Con Supabase gratuito eso no ocurre mientras el proyecto no esté pausado.

### 7.3 Alternativa: Redis de Upstash, plan gratuito

- **Fuente**: https://upstash.com/pricing/redis
- **Plan gratuito**: 0 USD; 1 base de datos por cuenta; 500 000 órdenes al mes; 10 GB de tráfico; tamaño máximo de 250 MB según la ficha y 256 MB según la tabla comparativa (la página no coincide consigo misma).
- **Regiones**: la página de precios no lista regiones ni dice si hay alguna de la UE en el plan gratuito. **Sin poder verificar** el requisito de la UE con esta fuente.
- **Operaciones atómicas**: no consultado. En Redis se hacen con guiones o transacciones; no se ha leído la documentación de Upstash sobre ello.
- **Resultado**: SIN PODER VERIFICAR lo esencial (región en la UE y atomicidad). Con una sola base de datos gratuita por cuenta, preproducción y producción tendrían que compartirla o usar dos cuentas.
- **Dato**: es un almacén distinto del que usará la fase 2 (Postgres). La recomendación del orquestador en la cuestión 5 era hacer la prueba de simultaneidad sobre el almacenamiento definitivo, para no repetirla (artículo 10).

### 7.4 Cuadro resumen

| | Supabase gratuito | Neon gratuito | Upstash Redis gratuito |
| --- | --- | --- | --- |
| Región en la UE | Sí: 4 regiones (elegir una concreta, no «Europe») | Sí: solo Fráncfort | Sin verificar |
| Inactividad | Pausa del proyecto tras 1 semana; reanudar a mano | Suspensión del cómputo a los 5 minutos; arranca solo | Sin verificar |
| Conexión desde función de Vercel | Agrupador en modo transacción (IPv4), sin sentencias preparadas | Controlador HTTP o WebSocket | No consultado |
| Atomicidad con simultaneidad | Bloqueo de fila de Postgres | Bloqueo de fila de Postgres | No consultado |
| Mismo motor que la fase 2 | Sí | Sí (Postgres), otro proveedor | No |
| Proyectos gratuitos | 2 activos | 100 | 1 base de datos |
| Decisión vigente | D-002 confirma Supabase | No está en el registro | No está en el registro |

---

## 8. Límite de intentos sencillo sin añadir un servicio

Requisito: REQ-037 y CA-017 (bloqueo por origen tras demasiados intentos de activación, también para un código válido, anotado sin el código).

### 8.1 Qué ofrece la plataforma de despliegue en su plan gratuito

- **Fuentes**:
  - https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting (actualizada el 28/08/2026)
  - https://vercel.com/docs/plans/hobby (actualizada el 14/09/2026)
- **Disponibilidad**: «WAF Rate Limiting is available on all plans».
- **Límites en Hobby**:
  - 1 regla de límite de frecuencia por proyecto, dentro de un total de 3 reglas propias del cortafuegos.
  - Claves de recuento: dirección IP y huella JA4. Las cabeceras arbitrarias, solo en Enterprise.
  - Algoritmo de ventana fija. Ventana mínima de 10 segundos y máxima de 10 minutos.
  - 1 000 000 de peticiones permitidas incluidas.
  - Acción por defecto «Too Many Requests (429)»; también registrar, denegar (403) o desafío.
- **Aviso de la propia página**: «Rate limit counters are tracked on a per-region basis; traffic matching a given rate limit key in multiple regions can exceed the limit you configure for any single region.»
- **Resultado**: VERIFICADO.
- **Lo que cubre y lo que no, frente a REQ-037** (hechos):
  - Cubre frenar ráfagas de peticiones a la ruta de activación desde una misma dirección, antes de que lleguen a la función.
  - No cuenta intentos fallidos: cuenta peticiones. No distingue un código incorrecto de uno correcto.
  - La ventana máxima es de 10 minutos: un bloqueo más largo no se puede expresar.
  - «Queda anotado sin el código» (REQ-037) no lo da el cortafuegos en los registros del conector.
  - CA-017 pide una prueba automática de la batería local: una regla del panel de la plataforma no se puede ejercitar en local.
  - Solo hay una regla por proyecto en Hobby.
- **Otros datos de Hobby que afectan** (misma fuente y https://vercel.com/docs/functions/configuring-functions/region):
  - Región de funciones: «Hobby: Single region». Por defecto es `iad1` (Washington); se fija con `"regions"` en `vercel.json` o en el panel. Una sola región basta para REQ-002 si es de la UE.
  - Registros de ejecución: «1 hour of logs» en Hobby (1 día en Pro). **Esto afecta a CA-024 y CA-042**, que piden revisar «los registros del servidor de los 3 días» de prueba real: con una hora de retención en la plataforma, esos registros no existirán salvo que el conector los guarde en otro sitio (el estado, o la supervisión de errores de la función 002). «Drains» no está disponible en Hobby. Ver H-4.
  - Uso: «the Hobby plan restricts users to non-commercial, personal use only». Ya consta en «Descartado» y lo cubre la decisión del responsable para esta fase.
  - Duración máxima de función: 300 segundos. Invocaciones incluidas: 1 000 000.

### 8.2 Qué habría que guardar en el propio estado

No hay fuente que consultar: es lo que se desprende de REQ-036, REQ-037, REQ-038, REQ-055 y CA-017. Se anota como lista de necesidades, no como diseño.

- Por origen: número de intentos fallidos dentro de la ventana, inicio de la ventana y, si procede, hasta cuándo dura el bloqueo. El incremento tiene que ser atómico (mismas garantías que 7.1), o diez intentos simultáneos contarían como uno.
- Qué es «origen»: la especificación de la función no lo define. Detrás de la plataforma, la dirección del cliente llega en cabeceras que pone la propia plataforma; cuál es fiable en Vercel no se ha verificado hoy. El origen no debe guardarse en claro si se considera dato personal: una huella con clave basta para contar.
- La anotación del bloqueo: momento, huella del origen y código de resultado. Nunca el código de activación (REQ-023, REQ-037).
- Los envíos cruzados rechazados (REQ-055) no cuentan como intento.
- El reloj tiene que poder controlarse en las pruebas (CA-017 comprueba «el tiempo del diseño»).
- **Resultado**: no aplica verificación documental. V-113 (mecanismo definitivo, fase 2) sigue abierta; esto solo cubre el mecanismo sencillo de la fase 1.

---

## Contradicciones entre fuentes

| N.º | Asunto | Fuente A | Fuente B | Estado |
| --- | --- | --- | --- | --- |
| C-1 | zod como dependencia de par de `mcp-handler` 2.x | README: «requires [...] zod ^4.2.0» | Registro de npm: no figura en `peerDependencies` | Sin efecto práctico (el SDK ya trae `zod ^4.2.0`) |
| C-2 | Borrador de CIMD | Especificación MCP 2026-07-28: `-00` | `oidc-provider` 9.14.0: `-02` | Sin comprobar qué cambia |
| C-3 | Rangos de salida de Anthropic | Guía de autenticación de conectores: `160.79.104.0/21` | Referencia de direcciones: ese y `153.61.208.0/20` | Contar con los dos |
| C-4 | Conectores propios en ChatGPT Plus | Tabla de precios: modo desarrollador disponible en Plus | Ayuda (vía buscador): MCP completo solo en Business, Enterprise y Edu; Pro, solo lectura | Sin resolver. Prueba real |
| C-5 | Gmail en Claude: papelera | Ayuda de Google Workspace: no la menciona | Ficha del conector: `trash_message`, `trash_thread` | La ficha es más concreta |
| C-6 | Supabase: plazo para restaurar un proyecto pausado | Documentación actual: 1 año | Registro de cambios de 2024 y etiqueta de la página de planes: 90 días | No afecta a la prueba |
| C-7 | Upstash: tamaño del plan gratuito | Ficha: 250 MB | Tabla comparativa: 256 MB | Irrelevante |
| C-8 | Plan gratuito de Supabase y Hobby de Vercel | `docs/TECNOLOGIAS.md`, «Descartado» y T-003, T-006 | Respuesta del responsable a la cuestión 5 de `aclaraciones.md` | El registro está sin actualizar |

## Diferencias con el registro de decisiones

Para que el chat de coordinación las aplique en `docs/TECNOLOGIAS.md`. Este documento no lo edita.

| Decisión | Qué dice hoy | Qué se ha encontrado |
| --- | --- | --- |
| T-007 | Sin estado; vigente 2026-07-28 | Confirmado. Añadir que 2026-07-28 elimina `initialize` y las sesiones: el conector tiene que atender las dos épocas para admitir a un cliente 2025-11-25 |
| T-008 | `mcp-handler` 2.3.1; repositorio `github.com/vercel/mcp-handler` | `mcp-handler` 2.4.0 (12/11/2026) y `@modelcontextprotocol/server` 2.4.0 (23/10/2026). El repositorio es `github.com/vercel-labs/mcp-handler`. El SDK 2.x ya incluye `createMcpHandler`, `requireBearerAuth` con comprobación de audiencia y `oauthMetadataResponse` |
| T-010 | Tres callbacks en lista cerrada | El de Claude, confirmado para las aplicaciones alojadas; Claude Code usa además un bucle local con puerto variable. Los dos de ChatGPT son alternativos: usa el estable si el servidor de autorización emite `iss` (RFC 9207) y lo anuncia; si no, el que lleva `{callback_id}`, cuyo formato no está documentado |
| T-011 | CIMD recomendado; DCR obsoleto, Claude recurre a él | Confirmado. Precisar: Claude solo elige CIMD si los metadatos anuncian `client_id_metadata_document_supported: true` y `"none"` en `token_endpoint_auth_methods_supported`. Hosts de los documentos: `claude.ai` y `chatgpt.com` |
| V-101 | Sin fuente que nombre los conectores personalizados | Sigue igual. La documentación dice que las tareas usan los conectores de la cuenta y que personalizados y de directorio comparten infraestructura. Prueba real |
| V-102 | Sin fuente oficial | Sigue igual. Dato nuevo: el plan de pago más barato es Go (8 USD) y no tiene modo desarrollador |
| V-103 | «permitir en todas las ejecuciones programadas» en Claude | Ese texto no se ha encontrado para el plan Pro. Lo documentado es «Always allow» por herramienta. En ChatGPT, las escrituras piden confirmación por defecto y solo se recuerda por conversación |
| V-104 | «Claude declara hasta 2025-11-25» | No se ha encontrado fuente que lo diga para el protocolo base; sí para la especificación de autorización. Las librerías sirven las dos épocas en el mismo punto de entrada |
| V-106 | No se conoce librería que cubra CIMD y pantalla propia sin estado | Dos cubren CIMD (`oidc-provider`, experimental; Better Auth, con paquete aparte). Ninguna encaja sin adaptación con el ADR-0002. Ver punto 1 |
| V-109 | Versión de zod y encaje con los contratos | zod 4.6.7; el SDK pide `^4.2.0`. Genera 2020-12 por defecto pero no reproduce los contratos tal cual. El SDK admite el esquema JSON directo con `fromJsonSchema` |
| V-113 | Límite de intentos en Vercel (fase 2) | Dato adelantado: el cortafuegos de Vercel permite 1 regla en Hobby, por IP o JA4, con ventana de 10 minutos como máximo; cuenta peticiones, no fallos |
| «Descartado» | Plan gratuito de Supabase y Hobby de Vercel | Los usa esta fase por decisión del responsable. Falta anotarlo |
| Nueva | — | El parámetro `iss` (RFC 9207) en la respuesta de autorización: SHOULD en MCP 2026-07-28, con MUST anunciado, y condición para el callback estable de ChatGPT |
| Nueva | — | Retención de registros en Vercel Hobby: 1 hora |

## Hallazgos que afectan a la especificación

Ninguno se ha aplicado: la especificación está APROBADA y cambiarla le corresponde al responsable. Se anotan para que el orquestador los lleve a `propuestas.md` o a la puerta P1.

| N.º | Hallazgo | Requisitos y criterios afectados | Gravedad |
| --- | --- | --- | --- |
| H-1 | En 2026-07-28 no hay inicialización ni sesión. La letra de CA-003 («una sesión iniciada declarando 2026-07-28 [...] completa la inicialización») no se puede cumplir tal como está escrita. La intención sí: listar las tres herramientas con una petición 2026-07-28 y con una sesión 2025-11-25 | REQ-005, CA-003 | Redacción. No bloquea el diseño |
| H-2 | El plan de pago más barato de ChatGPT es Go, sin modo desarrollador. Lo más probable es que no admita conectores personalizados. REQ-078 ya prevé anotar «no» y preguntar al responsable por el siguiente plan (Plus, 20 USD) | REQ-078, CA-001, CA-005, CA-006 | Decisión del responsable antes de contratar las cuentas |
| H-3 | El conector de Gmail de Claude ofrece `create_filter`, con el que se puede reenviar o eliminar correo, y `reply`, que envía. REQ-062 solo manda bloquear enviar, eliminar y reenviar | REQ-061, REQ-062, CA-037, CA-038 | Ampliar la lista de herramientas a bloquear en el guion |
| H-4 | Vercel Hobby conserva 1 hora de registros de ejecución y no ofrece «Drains». CA-024 y CA-042 piden revisar los registros de los 3 días | REQ-023, CA-024, CA-042 | El diseño debe decir dónde quedan los registros de 3 días |
| H-5 | En ChatGPT, las herramientas sin `readOnlyHint` piden confirmación por defecto y la aprobación solo se recuerda por conversación. La documentación apunta a que las dos escrituras del conector detendrán cada ejecución programada | REQ-016, CA-006, «Criterio de sí o no», D-009 | Riesgo alto de «no» en ChatGPT. Lo confirma o desmiente la prueba real |
| H-6 | Si el esquema del informe se entrega al SDK como `inputSchema`, el SDK valida antes del manejador: rechaza campos ajenos y devuelve su propio mensaje de error con detalle del fallo | REQ-021, REQ-048, CA-012, CA-013, propuesta 6 | El diseño tiene que decidir qué esquema se publica y quién valida |
| H-7 | CA-004 pide que los esquemas publicados sean «idénticos» a los de `contratos/`, pero el contrato de `enviar_informe` referencia el informe por `$ref` a un URN que el asistente no puede resolver. Lo publicado tendrá que llevar el informe resuelto | REQ-016, CA-004 | Redacción de CA-004 o forma del contrato |
| H-8 | La especificación MCP pide que la pantalla de autorización muestre con claridad el host del callback, y recomienda emitir `iss`. Ninguno de los dos está en los requisitos | REQ-011, REQ-004 | Añadir en el diseño |
| H-9 | Claude renueva «up to five minutes before the stored expiry». Con el token de acceso de 5 minutos de REQ-012, puede renovar en casi cada uso | REQ-012, REQ-013, CA-007 | Dato. Ejercita más la rotación |
| H-10 | En Claude hay tres tipos de tarea programada y el plan Pro ofrece al menos dos (Cowork y Claude Code en la nube). REQ-078 habla de «la aplicación», en singular | REQ-078, CA-006 | El guion tiene que decir cuál o cuáles |
| H-11 | No hay cifra publicada del uso que consume una tarea programada en Claude Pro ni en ChatGPT. 24 ejecuciones al día con lectura de buzón pueden agotar el uso incluido | REQ-014, CA-006 | Riesgo. La especificación ya prevé bajar a 8 al día |

## Páginas con instrucciones dirigidas a agentes

No se ha seguido ninguna. Se anotan porque así lo pide el procedimiento.

- `modelcontextprotocol.io`, `claude.com/docs` y `code.claude.com/docs`: cada página empieza con un aviso que pide descargar el índice completo (`llms.txt`) «before exploring further».
- `supabase.com/docs` (páginas de conexión y de regiones): piden enviar un informe de comentarios sobre la documentación a Supabase.
- `neon.com/docs` (página de planes): un bloque pide ofrecer la instalación de las «skills» de Neon con una orden de `npx`, y otro pide enviar comentarios por POST a un servicio suyo.
- `vercel.com/docs`: bloques «For AI agents» que piden seguir enlaces relacionados, una cabecera con una orden para instalar un complemento de Vercel, y un pie que pide enviar comentarios siguiendo unas instrucciones.

## Lo que queda para la prueba real

Sin fuente oficial suficiente; se resuelve ejecutando el guion:

1. Que un conector personalizado funcione en una tarea programada de Claude (V-101) y de ChatGPT (V-102).
2. Que las escrituras no detengan la ejecución desatendida (V-103): si «Always allow» vale en tareas programadas de Claude, y qué ocurre en ChatGPT.
3. Qué versión del protocolo declara cada asistente (V-104).
4. La URL exacta del documento CIMD de las aplicaciones alojadas de Claude y el valor de `resource` que envía cada asistente.
5. El formato de `{callback_id}` y qué callback usa ChatGPT de hecho.
6. Si ChatGPT Go admite un servidor MCP propio; si ChatGPT Plus admite escrituras.
7. Qué acciones de Gmail ofrece ChatGPT y si se pueden bloquear por separado en un plan individual; las 5 herramientas de Gmail de Claude que la ficha no muestra.
8. Cuánto uso consume cada ejecución programada y si 24 al día caben en cada plan.
9. Al instalar: que el SDK acepte `openWorldHint`, los `$id` con URN y un `$ref` entre documentos; qué responde a `initialize` con 2025-11-25; y que todo funcione en Node 26 con Next.js 16.4.

---

## 9. Verificaciones añadidas durante el diseño

Fecha de consulta: 13/11/2026 · Autor: `arquitecto` · Mismo procedimiento y mismas reglas que el resto del documento. Son los datos concretos que faltaban para cerrar el diseño; no se ha repetido ninguna búsqueda anterior.

### 9.1 Qué cabecera trae la dirección del cliente en la plataforma de despliegue

- **Pregunta**: de qué cabecera puede fiarse el límite de intentos por origen (pendiente en 8.2).
- **Fuente**: https://vercel.com/docs/headers/request-headers (la página declara `last_updated: 2025-12-13`).
  - `x-forwarded-for`: «The public IP address of the client that made the request.» «we currently overwrite the `X-Forwarded-For` header and **do not forward external IPs**. This restriction is in place to prevent IP spoofing.»
  - `x-vercel-forwarded-for`: «This header is identical to the `x-forwarded-for` header. However, `x-forwarded-for` could be overwritten if you're using a proxy on top of Vercel.»
  - `x-real-ip`: «This header is identical to the `x-forwarded-for` header.»
  - Un valor propio de `X-Forwarded-For` solo se admite con «Trusted Proxy», de los planes Enterprise.
  - `host`: «the domain name as it was accessed by the client»; con dominio propio, contiene el dominio propio.
- **Resultado**: VERIFICADO. La plataforma sobrescribe la cabecera; el cliente no puede falsearla. El diseño usa `x-vercel-forwarded-for`.
- **Pendiente**: su valor real en una función se observa en el primer despliegue.

### 9.2 Rol propio de Postgres por el agrupador compartido (mitad documental de V-107)

- **Fuentes**:
  - https://supabase.com/docs/guides/database/postgres/roles
  - https://supabase.com/docs/guides/database/connecting-to-postgres
- **Lo que dicen**:
  - Roles: «if you want to use password-logins for a specific role, then you can use `WITH LOGIN PASSWORD`», con el ejemplo `create role "role_name" with login password '…';`. Si la contraseña lleva símbolos, hay que codificarla al ponerla en la cadena de conexión.
  - Conexión: «Shared pooler connections use `postgres.[PROJECT-REF]`.» «If you connect as a custom role through the shared pooler, the username is `[ROLE].[PROJECT-REF]`.»
  - «The shared pooler is IPv4-only on every plan, in both session and transaction mode.»
  - «The shared pooler doesn't support prepared statements in transaction mode. To avoid errors, turn them off in your connection library.»
- **Resultado**: VERIFICADO EN PARTE. La documentación da el formato del usuario para un rol propio en el agrupador compartido. No se ha probado: la prueba la hace la primera tarea de base de datos de la función 001 contra el proyecto de desarrollo. V-107 sigue en VERIFICAR hasta entonces.

### 9.3 Versiones de las dependencias que añade el diseño

- **Fuentes** (registro oficial de npm):
  - https://registry.npmjs.org/postgres/latest
  - https://registry.npmjs.org/@electric-sql/pglite/latest
  - https://registry.npmjs.org/@modelcontextprotocol/client/latest
- **Datos**:

| Paquete | Versión | Licencia | `engines` | Dependencias |
| --- | --- | --- | --- | --- |
| `postgres` | 4.1.1 | Unlicense | `node >=18` | Ninguna |
| `@electric-sql/pglite` | 0.5.16 | Apache-2.0 | No declara | Ninguna de ejecución |
| `@modelcontextprotocol/client` | 2.4.0 | Apache-2.0 | `node >=20` | `zod ^4.2.0`, `jose`, `cross-spawn`, `eventsource`, `pkce-challenge`, `eventsource-parser`, `@modelcontextprotocol/core 2.4.0`. No está marcado como obsoleto |

- **Resultado**: VERIFICADO (versión y licencia). Ninguna fuente nombra Node 26: los rangos lo incluyen y se comprueba al instalar.
- **Pendiente**: no se ha consultado la fecha de publicación de cada versión ni el estado de mantenimiento de `postgres` y de `@electric-sql/pglite`; `@electric-sql/pglite` ya se usa en `scripts/probar-modelo.mjs`.

### 9.4 Si el SDK deja desactivar la validación de entrada de una herramienta

- **Pregunta**: H-6. ¿Se puede publicar un esquema y que el manejador reciba los argumentos sin validar?
- **Fuentes**:
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/advanced/schema-libraries.md
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/servers/tools.md
  - https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/docs/serving/web-standard.md
- **Lo que dicen**:
  - «A `fromJsonSchema` schema binds its validator at creation — pass yours as the second argument: `fromJsonSchema(document, validator)`.» La página no nombra la interfaz que debe cumplir ese validador ni sus métodos. Muestra dos clases, `AjvJsonSchemaValidator` y `CfWorkerJsonSchemaValidator`.
  - «`jsonSchemaValidator` covers elicitation form responses only.»
  - El SDK «validates arguments before your handler runs». Ninguna de las páginas describe una opción para desactivar esa validación ni para recibir los argumentos en bruto.
  - Ninguna de las tres páginas menciona una interfaz de bajo nivel para atender `tools/list` o `tools/call` a mano.
  - `tools/list` «advertises the document you passed, unchanged».
  - `web-standard.md`: «The factory runs once per request, so a fresh `McpServer` serves every call»; la autorización se pasa con `handler.fetch(request, { authInfo })`.
- **Contradicción entre fuentes**: `tools.md` dice «`inputSchema` is a Zod schema — the only schema you write»; `schema-libraries.md` documenta `fromJsonSchema` para pasar un esquema JSON. Las dos son del mismo repositorio.
- **Resultado**: VERIFICADO EN PARTE. No hay forma documentada de desactivar la validación de entrada.
- **Consecuencia para el diseño** (hecho): el diseño no se apoya en ninguna opción sin documentar. Registra las herramientas en el SDK con un esquema de entrada abierto y pone el esquema del contrato en el listado con un filtro de salida propio.

### 9.5 Documentos de cliente (CIMD) que publican los dos asistentes

- **Pregunta**: qué callbacks declaran, porque REQ-041 manda rechazar un documento que declare uno fuera de la lista cerrada.
- **Fuentes** (documentos públicos, leídos directamente):
  - https://chatgpt.com/oauth/client.json
  - https://claude.ai/oauth/mcp-oauth-client-metadata
- **Lo que contienen**:

| | ChatGPT | Claude |
| --- | --- | --- |
| `client_id` | `https://chatgpt.com/oauth/client.json` | `https://claude.ai/oauth/mcp-oauth-client-metadata` |
| `redirect_uris` | Solo `https://chatgpt.com/connector_platform_oauth_redirect` | Solo `https://claude.ai/api/mcp/auth_callback` |
| `token_endpoint_auth_method` | `private_key_jwt`; además un campo `token_endpoint_auth_methods_supported` con `none` y `private_key_jwt` | `none` |
| `grant_types` | `authorization_code`, `refresh_token` y `urn:ietf:params:oauth:grant-type:jwt-bearer` | Los mismos tres |
| Otros | `client_name`, `client_uri`, `logo_uri`, `jwks_uri`, `token_endpoint_auth_signing_alg` | `client_name`, `client_uri` |

- **Resultado**: VERIFICADO para ChatGPT. Para Claude, el lector devolvió el documento como JSON pero con una nota ambigua sobre su origen: conviene que una persona abra la dirección. Confirma además la URL que en 3.4 quedó «sin verificar».
- **Consecuencias para el diseño** (hechos):
  - Cada documento declara un solo callback y los dos están en la lista cerrada del diseño. La regla estricta de REQ-041 no rechaza ninguno de los dos documentos hoy.
  - El documento estable de ChatGPT solo declara el callback estable, lo que encaja con 4.4.
  - El documento de ChatGPT declara `private_key_jwt` como método. Qué hace ChatGPT ante un servidor de autorización que solo anuncia `none` no está documentado: prueba real.

### 9.6 Páginas con instrucciones dirigidas a agentes (consultas del 13/11/2026)

No se ha seguido ninguna.

- `vercel.com/docs/headers/request-headers`: un bloque «For AI agents» que pide seguir enlaces relacionados, una cabecera con una orden para instalar un complemento, otra para buscar en la documentación con su CLI y un pie que pide enviar comentarios.
- `supabase.com/docs` (páginas de roles y de conexión): piden añadir a la respuesta un informe de comentarios y preguntar si se envía a Supabase.

### 9.7 Diferencias con el registro de decisiones que se añaden

| Decisión | Qué se ha encontrado |
| --- | --- |
| V-107 | Mitad documental hecha: usuario `[ROL].[REFERENCIA]` en el agrupador compartido. Falta la prueba |
| V-113 | Dato adelantado: la cabecera fiable del origen es `x-vercel-forwarded-for` |
| T-010 y T-011 | Los documentos de cliente publicados declaran un callback cada uno: el de Claude y el estable de ChatGPT |
| V-106 | El diseño de la función 001 propone construir el servidor de autorización. Pendiente de la puerta P1 |
