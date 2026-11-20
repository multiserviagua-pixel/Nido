# T-101 (a) · Dependencias nuevas: verificación

Procedimiento: skill `verificar-decision`. Fuente: `https://registry.npmjs.org/<paquete>` (campos `time`, `versions[v].license` y `versions[v].engines`). Consulta: 20/11/2026. Regla de enfriamiento: 7 días o más publicada (límite: 13/11/2026).

| Paquete | Versión | Publicada (`time`) | Días al 20/11 | Licencia | `engines` | Dónde |
| --- | --- | --- | --- | --- | --- | --- |
| `@modelcontextprotocol/server` | 2.4.0 | 2026-10-23T18:20:13Z | 28 | Apache-2.0 | node >=20 | dependencies |
| `ajv` | 8.20.0 | 2026-04-24T15:22:16Z | 210 | MIT | (sin campo) | dependencies |
| `postgres` | 3.4.9 | 2026-04-05T15:18:33Z | 229 | Unlicense | node >=12 | dependencies |
| `@modelcontextprotocol/client` | 2.4.0 | 2026-10-23T18:21:05Z | 28 | Apache-2.0 | node >=20 | devDependencies |

- `@modelcontextprotocol/server` 2.4.0 y `@modelcontextprotocol/client` 2.4.0 son la `latest` del registro. `ajv` 8.20.0 también. `postgres`: la `latest` es 4.1.1 (11/11/2026); se mantiene 3.4.9 por el diseño (mayor reciente sin revisar el diff).
- Las cuatro cumplen el enfriamiento y la licencia es la del diseño. Ninguna cambia la API que usa el diseño: `createMcpHandler(fábrica, { legacy: 'stateless', responseMode: 'json' })` existe con esas opciones (`CreateMcpHandlerOptions`), y `McpServer.registerTool` con `fromJsonSchema` admite entrada abierta (`additionalProperties: true`).
- Sin `zod` directo, sin `mcp-handler`, sin `@electric-sql/pglite` nuevo (ya estaba, D-033).

## Transitiva con menos de 7 días: `jose`

`@modelcontextprotocol/client` 2.4.0 trae `jose`; la resolución normal daba `jose` 6.2.18 (2026-11-18T21:41:11Z, 2 días), que habría exigido una excepción nueva en `fechas-publicacion.json`. Se ha fijado en el bloqueo `jose` 6.2.17 (2026-11-09T18:41:21Z, 11 días, MIT), que cumple el rango del cliente (`npm ls jose` sin avisos). Sin `overrides` (prohibidos por la prueba del manifiesto) y sin dependencia directa: solo el bloqueo. `jose` es solo de `devDependencies` (cuelga del cliente). Si en el futuro un `npm install` sin bloqueo vuelve a resolver 6.2.18, vale la misma regla.

## Excepciones de D-027 y D-033

Siguen intactas: `@electric-sql/pglite@0.5.17` y los 11 paquetes de `typescript-eslint@8.73.0` son los únicos posteriores al límite (`node scripts/generar-fechas-bloqueo.mjs`: 465 paquetes, 12 posteriores a 2026-11-12T23:59:59Z, exactamente esas 12). `tests/unit/plataforma/fechas-publicacion.json` se ha regenerado con ese script para incluir los paquetes nuevos (lo exige `manifiesto.test.ts`).

## Prueba de humo (V-1, V-4, parte)

`tests/unit/conector/humo-sdk.test.ts`, en Node 26, en proceso y sin red:

- `initialize` con 2025-11-25: responde `protocolVersion` 2025-11-25; `tools/list` lista la herramienta de entrada abierta.
- 2026-07-28: la revisión moderna no tiene `initialize`; se prueba `server/discover` (anuncia 2026-07-28), `tools/list` y `tools/call` con la envoltura `_meta` (`protocolVersion`, `clientCapabilities`, `clientInfo`) y la cabecera `Mcp-Method` (más `Mcp-Name` en `tools/call`). Con `initialize` pidiendo 2026-07-28, el SDK negocia 2025-11-25.
- Ajv 2020-12 con `strict: true` compila `contratos/informe.schema.json`, registrando como conocida la palabra `x-version-esquema` (única extensión del contrato, solo informativa).

## `npm audit`

`npm audit` tras la instalación: `found 0 vulnerabilities` (sin altas ni críticas).

## Notas tras los dictámenes (revisor y auditor)

- **Vía legada del SDK (para T-104 y la regla de `console`).** Con `legacy: 'stateless'` y `responseMode: 'json'`, la vía legada responde igualmente `text/event-stream`; con `Accept: application/json` solo devuelve 406. Además escribe un aviso en consola al crear el manejador. T-104 debe contar con ambas cosas (cabecera `Accept` de los clientes y excepción acotada en la regla de `console`).
- **V-1 queda parcial.** La prueba de humo no cubre Next.js 16.4.6 (el manejador se ejercita en proceso, sin la ruta real) ni `structuredContent` por época de protocolo.
- **`postgres` 3.4.9: riesgo residual aceptado.** Dos fallos se corrigieron solo en 4.x («also in v3», sin GHSA, por lo que `npm audit` no los ve): bytes NUL en `database`, `user` o `connection`, y una columna llamada `__proto__`. Regla de revisión para T-104 y siguientes: sin `sql.unsafe`, sin identificadores ni alias derivados de la entrada, sin parámetros de conexión fuera del entorno.
- **Límites del escáner de secretos.** El patrón del código de activación solo detecta la forma canónica (mayúsculas, con guiones) y marca falsos positivos con marcadores de posición de tres grupos de cuatro equis; la vía es poner en ejemplos letras fuera de Crockford, nunca una excepción de ruta. Un token partido en dos líneas no se detecta (límite conocido). Los patrones `hia_a_`, `hia_r_` y `hia_op_` admiten ahora cuerpo en base64 estándar (con o sin `=`) y no exigen frontera por la izquierda.
- **Condición para la tarea de operación.** `/api/operacion` debe rechazar, antes del hash, todo lo que no cumpla `^hia_op_[A-Za-z0-9_-]{43}$`, y AR-06 debe fijar la generación en base64url.
