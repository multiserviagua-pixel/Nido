# T-005 (020) · Esqueleto de la muestra: evidencias

Fecha: 20/11/2026. Rama `tarea/020-T-005` desde `main` (f316ce6). Agente: `ingeniero-frontend`. RC D: pendiente de `revisor` y `auditor-seguridad` (este ve el control 2 al cerrar T-005).

## Qué se cambió

- `src/app/muestra/_datos/acceso-muestra.ts` (nuevo): `comprobarAccesoMuestra()`. Lo primero que hace es `await headers()`, sin try/catch, para que la página se pinte en cada petición. Luego lee solo `host` y lo compara de forma exacta con `NOMBRES_DE_SERVIDOR`: `localhost` y `127.0.0.1`, cada uno con puerto opcional de 1 a 65535 y sin ceros delante. La lista no lleva el dominio de producción. Después lee `leerEntorno()`, que debe dar `desarrollo` o `preproduccion`. En cualquier otro caso, o si algo lanza, llama a `notFound()` (D-036), sin mensaje ni motivo. **PENDIENTE**: `pre-nido.<dominio>` (sin puerto) se añadirá cuando la 002 entregue `<dominio>`. Hasta entonces la muestra en preproducción da 404, que es el lado seguro.
- `src/app/muestra/layout.muestra.tsx` y `src/app/muestra/page.muestra.tsx` (índice): los dos llaman a la comprobación como primera instrucción. El índice sale del inventario y no pinta ningún dato de la petición.
- `src/app/muestra/inventario.ts`: tipos `pagina | componente`, `rutaDeEstado` y `buscarEstado`, que busca de forma exacta. Todo está congelado. La primera entrada es `indice` en `/muestra`.
- `src/lib/plataforma/configuracion.ts`: `leerEntorno()` devuelve `undefined` si `VERCEL_ENV === "production"` (condición 1). He confirmado el comentario sobre el control 2 y lo he concretado (condición 4).
- `vitest.config.ts`: solo `resolve.alias` `@/` → `src/` (D-036).
- `tests/unit/diseno/apoyo/fronteras.ts`: regla R9, «nada fuera de `src/app/muestra/` importa la muestra», en cualquier forma, también solo de tipo. `apoyo/control-acceso.ts`: añadidos `forbidden` y `unauthorized` (condición 3).

## Qué prueba cubre cada cosa

| Requisito o condición | Prueba |
| --- | --- |
| REQ-061, control 2: Host exacto, puerto, sin X-Forwarded-Host, `headers()` primero, 404 ante la duda | `tests/unit/diseno/comprobar-acceso-muestra.test.ts` (nuevo) |
| PRUEBA-024, control 2 en cada punto de entrada (antes «NO APLICABLE AÚN») | `tests/unit/diseno/acceso-muestra.test.ts`: los 4 casos se ejecutan ahora sobre la muestra real y están en verde |
| Condición 1 | `tests/unit/plataforma/extensiones-muestra.test.ts`: 5 casos nuevos (`leerEntorno` y `pageExtensions`) |
| PRUEBA-008, R9, `forbidden` y `unauthorized` | `fronteras.test.ts` (4 sembrados) y `acceso-muestra.test.ts` (1 sembrado) |
| Inventario e índice (REQ-084) | `tests/unit/diseno/inventario-muestra.test.ts` (nuevo) |

Primero se subió el commit en rojo (9fc33a1): 8 pruebas fallaban y 2 archivos no cargaban.

## Comandos (código de salida real)

| Orden | Salida | Resultado |
| --- | --- | --- |
| `npm run tipos` | 0 | |
| `npm run estilo` | 0 | |
| `npx vitest run --maxWorkers=3` | 0 | 53 archivos, 1272 pruebas en verde |
| `node scripts/comprobar-specs.mjs` | 0 | SUPERADO |
| `ENTORNO=produccion npm run build` | 0 | rutas `/`, `/_not-found`, `/api/salud`. Ningún archivo de `.next` contiene «Muestra de componentes» |
| `ENTORNO=preproduccion VERCEL_ENV=production npm run build` | 0 | las mismas rutas, sin la muestra; 0 archivos |
| `ENTORNO=preproduccion npm run build` | 0 | además `ƒ /muestra` (dinámica, no se pinta al compilar) |

## Compilación de preproducción servida con `next start -p 3123`

| `ENTORNO` al servir | Host `localhost:3123` / `127.0.0.1:3123` | Producción, desconocido, `localhost.example.com`, `LOCALHOST:3123` | Host de producción con X-Forwarded-Host `localhost:3123` |
| --- | --- | --- | --- |
| `preproduccion` | 200, con el índice | 404, sin índice | 404 |
| `desconocido` | 404 | 404 | 404 |
| vacío | 404 | 404 | 404 |
| `preproduccion` + `VERCEL_ENV=production` | 404 | 404 | 404 |

Una dirección inexistente y `/muestra/valores` dan 404 en todos los casos. Los procesos se pararon por su PID.

## Lo que no se ha comprobado y hallazgos

- **Navegación RSC** (`RSC: 1`) con un Host fuera de la lista. Next responde 307 a `?_rsc=` y después 200 `text/x-component`, sin el índice y con `NEXT_HTTP_ERROR_FALLBACK;404`. No devuelve la carga, pero el código no es 404. Lo tiene que juzgar PRUEBA-024 y PRUEBA-034 en el navegador (T-009).
- **El 404 de `/muestra` no es igual al de una dirección inexistente** en la compilación de preproducción con un Host fuera de la lista. `/muestra` devuelve `<html id="__next_error__">`, sin `lang`; la dirección inexistente devuelve la página `not-found` prerenderizada. Lo provoca el `notFound()` de la página dinámica, no el `layout`: lo comprobé quitando la llamada del `layout`, sin commit, y el resultado fue el mismo. En producción no aplica, porque la ruta no existe (control 1). Afecta a la regla V-1 y a `sinAcceso()`, porque es el mismo mecanismo. Lo dejo al `arquitecto` y a PRUEBA-034.
- **Preproducción en Vercel.** Si el proyecto `pre-nido` sirve su dominio como despliegue `production` de Vercel, con la condición 1 la muestra queda cerrada también allí. Es el lado seguro, pero el control positivo en preproducción no se cumpliría. Lo tienen que decidir el `auditor-seguridad` y el `arquitecto` cuando exista preproducción.
- No he ejecutado pruebas en navegador ni `axe`: T-009 aún no existe.

## Segunda vuelta: MAYOR del `auditor-seguridad` (art. 3, A-3)

Hallazgo: el control 1 y el control 2 leían la misma variable `ENTORNO`, y `localhost` lo pone el cliente en `Host`. En un proyecto de Vercel que no es de producción con `ENTORNO=preproduccion`, bastaba `Host: localhost` para abrir la muestra.

Corrección:

- `src/lib/plataforma/configuracion.ts`: el criterio «alguna variable `VERCEL*` con valor» pasa a `hayVariablesDePlataforma()`, que usa el predicado de desarrollo sin cambiar lo que hace. Se expone `fueraDeLaPlataforma()`, que no mira `ENTORNO` ni `NODE_ENV`. Sigue siendo el único archivo que lee `process.env`.
- `src/app/muestra/_datos/acceso-muestra.ts`: cada nombre de la lista lleva `soloFueraDeLaPlataforma`. `localhost` y `127.0.0.1` lo llevan a `true`, así que solo valen si `fueraDeLaPlataforma()` devuelve exactamente `true`. Si algo lanza, se cierra. El comentario explica que la independencia entre controles ya no descansa solo en `Host`. `pre-nido.<dominio>` sigue PENDIENTE, solo con `preproduccion`. No se ha añadido ni se ha inventado ningún dominio.

Pruebas (commit en rojo 3f554a0, con 37 fallos; luego en verde):

| Caso | Prueba |
| --- | --- |
| `fueraDeLaPlataforma()` con cada `VERCEL*`, incluida `VERCEL_GIT_COMMIT_SHA`, y sin ninguna | `tests/unit/plataforma/extensiones-muestra.test.ts` |
| `Host` `localhost`/`127.0.0.1`, con y sin puerto, × `VERCEL=1`, `VERCEL_ENV=preview`/`development`, solo `VERCEL_URL`, solo `VERCEL_GIT_COMMIT_SHA` × los tres `ENTORNO` → `notFound`. En local, sin `VERCEL*`, con `desarrollo`/`preproduccion` → abre. Orden `headers` → plataforma → entorno, y cierre si la plataforma lanza | `tests/unit/diseno/comprobar-acceso-muestra.test.ts` |
| PRUEBA-024 en cada punto de entrada con 12 casos de plataforma, y defecto sembrado «admite localhost en la plataforma» detectado | `tests/unit/diseno/acceso-muestra.test.ts`, `apoyo/control-acceso.ts`. `preparar()` limpia las variables entre casos |

Ningún caso anterior simulaba Vercel con un Host local esperando que abriera. Los que ya había siguen en verde sin cambios de aserción. Lo único que cambia en los dobles de `configuracion` es que ahora también ofrecen `fueraDeLaPlataforma`.

Comandos de esta vuelta, con su código de salida real:

| Orden | Salida | Resultado |
| --- | --- | --- |
| Pruebas nuevas, antes de la corrección (3 archivos) | 1 | 37 fallos y 181 en verde: el rojo esperado |
| `npm run tipos` | 0 | |
| `npm run estilo` | 0 | Antes, Prettier dio 1 en `apoyo/control-acceso.ts`. Se formateó y luego dio 0 |
| `npx vitest run` de `comprobar-acceso-muestra`, `acceso-muestra`, `extensiones-muestra`, `fronteras` y `configuracion` | 0 | 5 archivos, 360 pruebas en verde |
| `npx vitest run --maxWorkers=3` (suite completa) y `node scripts/comprobar-specs.mjs` | **NO EJECUTADO** | El sistema paró el proceso por falta de memoria antes de que terminara. No hay resultado |
| `npm run build` | **NO EJECUTADO** | Se dejó para no cargar más la máquina. Esta vuelta no cambia `next.config.ts` |

## Vuelta atrás

`git revert` de los commits de T-005. Con eso vuelven `leerEntorno` sin el corte por `VERCEL_ENV`, el config de Vitest sin alias y el estado de T-004.

## Comprobación del orquestador tras la segunda vuelta (20/11/2026, commit 7a86c68)

Máquina cargada; regla de la coordinación (D-036, punto 4): `npx vitest run --maxWorkers=3` más el resto por separado.

- `npm run tipos` → salida 0.
- `npm run estilo` → salida 0.
- `npx vitest run --maxWorkers=3` → salida 0; 53 archivos, 1364 pruebas en verde.
- `node scripts/comprobar-specs.mjs` → salida 0 (SUPERADO).
- `npm run build` → salida 0.
- `npm run aislamiento`: no ejecutado en esta vuelta (no toca la base de datos); `npm run verificar` completo en una sola orden: no ejecutado, sustituido por lo anterior.
