# T-110: revisión, vuelta corta del commit de correcciones 215a023

Revisor: `revisor`, 21/11/2026. Alcance: solo `git show 215a023`, que es posterior al dictamen previo (APTO CON MENORES). Ruta crítica (OAuth y licencias): necesita también el dictamen del `auditor-seguridad`.

## Dictamen: APTO CON MENORES

Cada corrección cierra el menor que decía cerrar. No hay regresiones ni incumplimientos de los artículos 1, 2, 3 y 7.

| Corrección | Comprobación | Resultado |
| --- | --- | --- |
| Almacén caído: pantalla fija 503 | `peticion.ts:274-297` y `activacion.ts:213-236`: `tramitar` va envuelto. Solo `ErrorDeAplicacion` con el código `almacen_no_disponible` da `pantalla({tipo:"no_disponible"})` (503, HTML, CSP propia, sin cookie y sin `code`). Lo demás se relanza tal cual hacia el manejador, y la configuración inválida sigue subiendo, porque se lee fuera del `try`. El registro lleva solo el código. Las pruebas comprueban que el canario del error de postgres no aparece en la consola. | Cierra |
| Tope único del código (64) | `activacion.ts` ya no tiene `LONGITUD_MAXIMA_CODIGO`. El único tope es `codigo-activacion.ts:4,21`. La prueba con 65 caracteres sigue en `activar-autorizar.test.ts:222`. | Cierra |
| `WWW-Authenticate` en `invalid_client` | `tokens.ts:85-88` responde `Basic realm="oauth"` en el 401 cuando llega `Authorization` (RFC 6749 §5.2). La prueba está en `token.test.ts:312`. | Cierra |
| `state` obligatorio | `peticion.ts:89-91`: sin `state`, se devuelve `no_valida` (400 sin redirigir y sin abrir solicitud). Desaparece `hayState`, y la redirección de error siempre lleva `state` e `iss`. Hay pruebas nuevas en `autorizar-peticion.test.ts:321-324` y `422-425`. | Cierra |
| CSP `frame-ancestors 'none'` en las respuestas sin pantalla | Las respuestas 302 de error, 405 y 503 de `FALLO_FIJO` de las dos funciones llevan ahora `CSP_SIN_PANTALLA`, con sus aserciones. | Cierra |
| Texto «Continúa solo si has empezado tú…» | `pantalla.ts:40,133`: el texto es constante, no lleva datos de la petición y solo aparece en el estado formulario. La prueba está en `pantalla.test.ts:50`. | Cierra |
| Plazo de la prueba inestable | `registro-clientes.test.ts:383`: el plazo pasa a 60 s y solo afecta a esa prueba. | Cierra |

## Hallazgos

1. **MENOR**: comentarios de cabecera desfasados en `src/lib/oauth/peticion.ts:18` y `src/lib/oauth/activacion.ts:18`. Siguen diciendo que un resultado desconocido da «503 por el manejador», y ahora da la pantalla «no disponible» 503 de la propia función. Afecta al art. 10 (operación y claridad). Corrección: actualizar las dos líneas.
2. **MENOR** (solo para dejar constancia): `state=` vacío pero presente se sigue admitiendo (`RE_STATE` acepta de 0 a 512, `peticion.ts:45`; prueba en `autorizar-peticion.test.ts:212`). Es coherente con el diseño (`state` ≤ 512) y no abre ninguna vía, porque el valor solo se compara con su HMAC. Si se quería que «obligatorio» significara «no vacío», habría que pasar a `{1,512}` y ajustar esa prueba. No exige cambio.
3. **Nota**, sin gravedad: las respuestas que genera `manejador.ts` en `/oauth/autorizar` (configuración inválida 503 y 500) no llevan CSP, porque la regla global excluye esa ruta. Sí llevan `X-Frame-Options: DENY` de `cabecerasAutorizar`, y su cuerpo es JSON fijo, así que no hay riesgo de enmarcado. No existía en el dictamen previo ni lo introduce este commit.

Privacidad (art. 1): ningún texto añadido refleja valores recibidos y ningún registro nuevo lleva otra cosa que la ruta y el código. Aislamiento (art. 2): no cambia. Cierre en fallo (art. 3): el `catch` solo convierte en pantalla el código del almacén y nunca entrega `code`. Entradas no confiables (art. 7): `state` se sigue validando antes de usarlo y ahora se exige.

## Comandos ejecutados

- `git show 215a023`: diff completo leído.
- `npx vitest run` sobre los seis archivos de prueba de `tests/unit/conector` tocados por el commit (`activar-autorizar`, `autorizar-peticion`, `pantalla`, `registro-clientes`, `ruta-oauth`, `token`): 6 archivos y 332 pruebas en verde, 201 s.
- `npx eslint` sobre `src/lib/oauth/{activacion,peticion,pantalla,tokens}.ts`: 0.
- `node scripts/comprobar-specs.mjs`: SUPERADO, con avisos de tamaño en otras especificaciones ajenas a T-110.

## No comprobado

- `tests/unit/plataforma/trazado.test.ts`: no se ejecutó porque necesita la compilación. El commit solo cambia el título y un comentario.
- La suite completa, los tipos (`tsc`) y la compilación no se ejecutaron, por el candado de la máquina.
- El comportamiento en un navegador real y con `next start`.
