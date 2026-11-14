# ADR (borrador): Servidor de autorización propio, rotación con par derivado y operación sin panel

Estado: BORRADOR, para que lo registre el chat de coordinación tras la puerta P1 de la función 001 · Fecha: 13/11/2026 · Autor: `arquitecto` · Decisiones: V-106, T-008, T-010, T-011, D-006 · Precisa el ADR-0002 y matiza el ADR-0003

## Contexto

El ADR-0002 dejó en VERIFICAR si el servidor de autorización se construía o se tomaba de una librería (V-106), y fijó tres callbacks, tokens guardados como HMAC y una ventana de gracia «que devuelve el mismo par». La verificación del 12 y 13/11/2026 (`specs/001-conector-prueba-real/verificaciones.md`) encontró que:

- ninguna librería revisada cubre a la vez tokens opacos como HMAC, conexión ligada a una licencia, ventana de gracia con el mismo par y pantalla con código de activación;
- los dos callbacks de ChatGPT son alternativos: usa el estable si el servidor de autorización emite y anuncia el parámetro `iss` (RFC 9207);
- los documentos de cliente que publican Claude y ChatGPT declaran un callback cada uno;
- guardar solo HMAC impide, en principio, devolver el mismo par dentro de la ventana (cuestión 6 de la función 014);
- el SDK oficial de MCP 2.x ya trae el manejador web sin estado para las dos épocas del protocolo.

## Decisión

1. **Servidor de autorización propio y mínimo**, dentro de la app: metadatos, registro por CIMD y por DCR, código de autorización con PKCE S256 y renovación. Cierra V-106.
2. **`iss` en toda respuesta de autorización**, correcta o de error, anunciado en los metadatos.
3. **Lista cerrada de dos callbacks**: el de Claude y el estable de ChatGPT. El de ChatGPT con parte variable no se admite. Cambia el punto 2 del ADR-0002 y T-010.
4. **CIMD solo desde `claude.ai` y `chatgpt.com`**, sin seguir redirecciones; un documento que declare un callback de fuera de la lista se rechaza entero.
5. **Rotación con par derivado.** El par nuevo es un HMAC, con una clave que no está en la base de datos, del token de renovación presentado y de una sal aleatoria guardada en la fila sustituida. Repetir el token dentro de la ventana devuelve la sal y la app deriva el mismo par. No se guarda nada recuperable. Precisa el punto 6 del ADR-0002.
6. **La rotación, la activación y el canje son cada uno una función de la base de datos**: una llamada, una transacción.
7. **El servidor de autorización usa un rol de base de datos distinto del conector.** El rol del conector no puede emitir tokens ni crear conexiones. Precisa el punto 4 del ADR-0003 y adelanta una respuesta a la cuestión 16 de la función 014.
8. **Solo el SDK oficial de MCP**; `mcp-handler` no se usa. Cambia T-008.
9. **Frontera temporal «operador → app»**: mientras no exista el panel, las operaciones de HumanaIA se hacen por una ruta protegida con una credencial de operación, de la que el entorno solo guarda la huella. La ruta no existe en producción. Desaparece con la fase 3.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| `oidc-provider` | Revoca la cadena al repetir un token; CIMD experimental; adaptador y montaje propios |
| Better Auth | Liga la autorización a un usuario con sesión; tokens JWT; tablas propias |
| Guardar cifrado el par durante la ventana | Guarda algo recuperable y obliga a borrarlo |
| Un par distinto por repetición | El ADR-0002 pide el mismo par |
| Admitir el callback variable por patrón | Deja de ser una lista cerrada |
| Operar desde la consola de la base de datos | No puede generar códigos: el HMAC necesita una clave que no está allí |

## Consecuencias

- El servidor de autorización es código propio en ruta crítica: revisión y dictamen en cada cambio.
- Si la clave de la que se derivan los tokens se filtra junto con una copia de la base de datos y un token de renovación antiguo, se pueden calcular los tokens siguientes de esa conexión. La rotación de esa clave invalida todas las conexiones; su procedimiento es de la fase 6.
- Si un asistente cambia su callback o usa el variable, hay que cambiar la lista con un despliegue revisado.
- La fase 2 hereda la forma de las funciones de almacenamiento y decide los valores definitivos (caducidades, ventana, límites).
- La ruta de operación es una superficie más mientras dure; su credencial se sustituye al cerrar la función 001.
