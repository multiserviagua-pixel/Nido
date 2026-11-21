# T-110: auditoría de seguridad, vuelta corta del commit de correcciones 215a023

Auditor: `auditor-seguridad`, 21/11/2026. Alcance: solo `git show 215a023` (posterior a mi dictamen previo, APTO CON CONDICIONES). Ruta crítica OAuth. He leído el informe del `revisor` (`revision-vuelta-correcciones.md`), pero el juicio es mío.

## Dictamen: APTO CON CONDICIONES

No hay bloqueantes. Ninguna corrección abre una vía de acceso. La condición es el hallazgo 1, que es una regresión de supervisión y no de acceso. Siguen en pie las condiciones del dictamen previo: la regla WAF en `/oauth/*` y el menor sobre la avalancha contra el rol de gestión.

## Comprobaciones

| Punto | Resultado |
| --- | --- |
| Cierre en fallo (art. 3) | `peticion.ts:285-297` y `activacion.ts:224-236`: el `catch` solo convierte en pantalla `ErrorDeAplicacion` con el código `almacen_no_disponible`. Lo demás se relanza tal cual y la configuración se lee fuera del `try`. La pantalla `no_disponible` da 503 sin `Set-Cookie` (en `peticion.ts:145-159` solo se pone cookie con un 200, y `activacion` la llama sin `limpiarCookie`) y sin `code`. Si `activar` falla, no se entrega ningún código. |
| Origin, cookie, state y PKCE | Los pasos 1 a 5 de `activacion.ts` no cambian: solo se mueven dentro de `tramitar`. En `peticion.ts` solo cambian la exigencia de `state` y las cabeceras. `tokens.ts` solo añade la cabecera en el 401: PKCE y la renovación no cambian. |
| Tope del código | `normalizarCodigo` (`codigo-activacion.ts:21`) devuelve `null` con más de 64 caracteres antes de procesar. Un `null` se convierte en el HMAC de `sin-forma` y cuenta como intento, igual que antes. |
| `WWW-Authenticate` (`tokens.ts:85-88`) | Es constante y no refleja nada de la petición. `json()` crea un `new Response` con cabeceras mutables. No hay fuga. |
| `state` obligatorio | Si falta, la pantalla da 400 sin redirigir. La redirección de error lleva siempre `state` codificado con `encodeURIComponent`, después de validarlo con `RE_STATE`. |
| CSP `frame-ancestors` | La llevan la 302, la 405 y la de `FALLO_FIJO`. La pantalla tiene la suya. Las respuestas del manejador en esa ruta conservan `X-Frame-Options: DENY` (`next.config.ts:16-21`). |
| Privacidad (arts. 1 y 4) | Los registros nuevos solo anotan el código y la ruta. El texto nuevo de la pantalla es constante. La prueba del canario sigue en `activar-autorizar.test.ts`. |

## Hallazgos

1. **MAYOR**: la caída del almacén en `/oauth/autorizar` ya no llega a la supervisión.
   - Dónde: `src/lib/oauth/peticion.ts:294` y `src/lib/oauth/activacion.ts:233`.
   - Qué afecta: el art. 10 (supervisión y operación) y el art. 3 en su parte de detección. Contradice `specs/001-conector-prueba-real/diseno.md:22` (C-2), que dice que `almacen_no_disponible` se supervisa y que la capa HTTP responde 503 `{"estado":"error"}`.
   - Qué pasa: antes, el error subía a `manejador.ts:44-51`, que llama a `registrar("error", …)` y a `enviarEvento(...)`. Ahora el `catch` interno lo absorbe con `registrar("aviso", …)`: el registro sale por `console.log` y no por `console.error`, y no se envía ningún evento. Si cae la base de datos, la ruta OAuth más usada (GET y POST) solo deja líneas de aviso. Una alerta por eventos o por nivel `error` no se dispararía hasta que fallaran `/oauth/token` o `/oauth/registro`. No concede acceso, pero oculta una caída y deja sin rastro un posible abuso que la provoque (agotar conexiones del rol de gestión, el menor del dictamen previo).
   - Prueba: en `ruta-oauth.test.ts`, con el almacén caído en GET y en POST, sustituir `enviarEvento` (o el `fetch` de supervisión) y comprobar que se llama una vez con `codigo: "almacen_no_disponible"` y que la línea lleva `"nivel":"error"`.
   - Corrección mínima: en los dos `catch`, `registrar("error", "almacen_no_disponible", RUTA)` y `void enviarEvento({ ruta, codigo: "almacen_no_disponible", metodo })`, o una utilidad común en `manejador.ts`. Además, ajustar C-2 en el diseño: en `/oauth/autorizar`, el 503 es la pantalla HTML y no el JSON fijo.

2. **MENOR**: un `state` vacío sigue siendo válido.
   - Dónde: `src/lib/oauth/peticion.ts:45` y `src/lib/oauth/pantalla.ts:94`, ambos con `{0,512}`.
   - Qué afecta: el art. 7.
   - Qué pasa: «obligatorio» solo exige que el parámetro esté presente. Con `state=` el cliente renuncia a su propia protección CSRF. En el servidor no tiene efecto, porque la ligadura de la cookie sigue vigente. No es explotable contra nosotros. Coincido con el revisor.
   - Corrección, opcional: `{1,512}` en los dos sitios y ajustar `autorizar-peticion.test.ts:212`.

3. **MENOR**: comentarios desfasados en `peticion.ts:18` y `activacion.ts:18`, que siguen diciendo «503 por el manejador». Coincido con el revisor. Conviene corregirlos junto con el hallazgo 1, porque confunden sobre dónde se supervisa.

Sin bloqueantes.

## Comandos ejecutados

- `git show --stat 215a023` y `git show 215a023 -- src/ specs/ tests/unit/conector/{ruta-oauth,activar-autorizar}.test.ts`: leídos.
- Lectura con grep de `manejador.ts`, `supervision.ts` (`EXCLUIDOS`), `registro.ts`, `codigo-activacion.ts`, `pantalla.ts`, `next.config.ts`, `autorizacion.ts` (origen de `almacen_no_disponible`) y diseño C-2.
- `npx vitest run --config vitest.config.ts tests/unit/conector/ruta-oauth.test.ts`: 18 de 18 en verde.

## No comprobado

- El hallazgo 1 lo he comprobado leyendo, no con una prueba: ninguna prueba actual comprueba `enviarEvento` en esta ruta.
- No he ejecutado los demás archivos de prueba tocados (el revisor informa de 332 en verde), ni `tsc`, ni la compilación, ni `next start`.
- No he comprobado las cabeceras efectivas en Vercel ni el comportamiento en un navegador real.
- No he comprobado cómo alertará la supervisión real, porque depende de su configuración externa.
