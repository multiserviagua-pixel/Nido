# Versiones y comprobaciones de dependencias (020, T-002)

Fecha de lectura: 20/11/2026. Fuente de cada versión: `registry.npmjs.org/<paquete>`, leída con `npm view <paquete>@<versión> version license --json` y la fecha de publicación de la versión con `npm view <paquete> time --json` (el campo `time.modified` es del paquete entero, no de la versión, y no se usa como fecha de publicación). Versiones exactas en `package.json`; árbol completo en `package-lock.json`.

## Dependencias directas nuevas

| Dependencia | Versión | Fuente (leída el 20/11/2026) | Publicada | Licencia |
| --- | --- | --- | --- | --- |
| `tailwindcss` (desarrollo) | 4.3.5 | `registry.npmjs.org/tailwindcss` | 06/11/2026 | MIT |
| `@tailwindcss/postcss` (desarrollo) | 4.3.5 | `registry.npmjs.org/@tailwindcss/postcss` | 06/11/2026 | MIT |
| `postcss` (desarrollo) | 8.5.32 | `registry.npmjs.org/postcss` | 26/10/2026 | MIT |
| `@radix-ui/react-alert-dialog` | 1.2.1 | `registry.npmjs.org/@radix-ui/react-alert-dialog` | 12/10/2026 | MIT |
| `@radix-ui/react-dialog` | 1.3.1 | `registry.npmjs.org/@radix-ui/react-dialog` | 12/10/2026 | MIT |
| `recharts` | 3.11.0 | `registry.npmjs.org/recharts` | 17/11/2026 | MIT |
| `react-is` | 19.3.1 | `registry.npmjs.org/react-is` | 14/10/2026 | MIT |
| `@playwright/test` (desarrollo) | 1.65.1 | `registry.npmjs.org/@playwright/test` | 13/11/2026 | Apache-2.0 |
| `@axe-core/playwright` (desarrollo) | 4.14.0 | `registry.npmjs.org/@axe-core/playwright` | 15/10/2026 | MPL-2.0 |
| `web-vitals` (desarrollo) | 6.2.3 | `registry.npmjs.org/web-vitals` | 05/10/2026 | Apache-2.0 |

La espera de 7 días está derogada por D-034; se anota la fecha de publicación solo como dato (recharts 3.11.0 tiene 3 días).

## Licencias del bloqueo

Entradas del bloqueo que no estaban en `main` (por ruta, 97): MIT 77, ISC 11, Apache-2.0 4, MPL-2.0 1 (`axe-core`), 0BSD 1, BSD-3-Clause 1, BlueOak-1.0.0 1, `victory-vendor` «MIT AND ISC AND BSD-3-Clause» 1. Contadas por nombre y versión (95 entradas, porque dos paquetes que ya estaban en `main` solo cambian de sitio por la hoist) salen MIT 75 y el resto igual; la diferencia son esas reubicaciones. Ninguna licencia es copyleft fuerte; MPL-2.0 (`axe-core`, `@axe-core/playwright`) es solo de desarrollo y no se distribuye.

## «No verificado, se comprueba al instalar» (diseno.md, ~806)

| Punto | Resultado |
| --- | --- |
| `@axe-core/playwright` 4.14.0 admite Playwright 1.65 | Comprobado. Declara `peerDependencies: playwright-core >= 1.0.0` y el bloqueo tiene `playwright-core` 1.65.1. En ejecución (Chromium 159.0.8154.6 de Playwright 1.65.1) `AxeBuilder.analyze()` funcionó sobre una página de prueba. Requiere un contexto creado con `browser.newContext()` (con `browser.newPage()` falla; es una exigencia de la librería, no un error). Guion desechable, no guardado |
| La regla de tamaño de objetivo se activa con la etiqueta WCAG 2.2 AA | Comprobado con una página de dos botones de 10 px: con las etiquetas `wcag2a`, `wcag2aa`, `wcag22aa` la violación `target-size` aparece; sin `wcag22aa` no aparece. Solo prueba que la regla se activa con esa etiqueta; no valida el criterio completo (T-020) |
| Tailwind 4.3.5 compila con Next.js 16.4 en Windows | Comprobado a medias. `next build` (Turbopack) termina en verde con `postcss.config.mjs` presente (`navegador.txt`), pero ningún CSS de `src/` importa todavía Tailwind, así que el build no lo ejercita. La compilación de Tailwind se comprobó, en el clon limpio, llamando directamente a PostCSS con `@tailwindcss/postcss` (ver `tailwind-compila.txt`); funciona en Windows. Que compile con el CSS real de la 020 queda para T-003 |
| Tailwind y Playwright funcionan con instalación sin scripts | Comprobado. El bloqueo se regeneró con `npm install --package-lock-only --ignore-scripts`. La única entrada con `hasInstallScript` es `fsevents` (opcional, solo macOS). Tailwind compiló con el motor nativo ya instalado y Playwright lanzó Chromium sin pasos de instalación. `npm ci --ignore-scripts` probado en un clon limpio de la punta de la rama (fb45d63, 20/11/2026): `npm ci --ignore-scripts` y `npm audit` se repitieron el 20/11/2026 en un clon desechable de la punta 42b3e76 (470 paquetes añadidos, 0 vulnerabilidades; salida en bruto en `npm-ci-y-audit.txt`); en el clon de fb45d63: `npm ls` con salida 0 y sin ELSPROBLEMS, `npm run verificar` y `npm run navegador` en verde (ver `bloqueo-npm-ls.txt`, `verificar-correccion.txt`, `navegador-correccion.txt`) |
| Playwright no descarga navegadores al instalar | Comprobado por el bloqueo: ningún paquete de Playwright tiene script de instalación (`npm view playwright@1.65.1 scripts.install` vacío). Además, `navegador-sin-navegador-descargado.txt (histórica, de la orden anterior)` muestra la orden fallando por falta de navegador cuando no se ha descargado; la descarga se hizo después con una orden expresa (`descarga-navegador.txt`) |
| Versión de `react-is` | 19.3.1, igual que React y `react-dom` 19.3.1; `recharts` 3.11.0 admite `react-is` `^16.8 \|\| ... \|\| ^19`. Hay además `react-is` 16.13.1 anidado en `prop-types` (ya estaba en `main`) |

## Desviaciones respecto a la tabla del diseño

| Dependencia | Diseño | Instalada | Motivo |
| --- | --- | --- | --- |
| `recharts` | 3.10.1 | 3.11.0 | Versión estable publicada el 17/11/2026, posterior a la lectura del 13/11. Misma licencia. D-034 permite versiones sin espera. Está dentro de lo que admite el diseño (misma serie 3) |
| `@playwright/test` | 1.65.0 | 1.65.1 | Parche de la serie 1.65 publicado el 13/11/2026; mismo `playwright-core` 1.65.1 |
| `postcss` | «8.5.25 o posterior; exacta al instalar» | 8.5.32 | Es la versión que ya pedía `vite` (anidada en `main`) y cumple «o posterior». No sube nada: `main` tenía postcss 8.5.23 (el de `next`) y 8.5.32 (el de `vite`); ahora 8.5.32 pasa a estar en la raíz y 8.5.23 queda anidado en `next/node_modules`. Mismo conjunto de versiones |

## Comparación del bloqueo con `main`

Comparando nombre y versión de todas las entradas de `main` con el bloqueo actual: ninguna versión de `main` desaparece ni cambia (solo se reubican por hoist `postcss` 8.5.23 / 8.5.32 y `react-is` 16.13.1). Entradas nuevas: 95. Entre ellas, repetidos con otra versión de un nombre que ya estaba: `@emnapi/core` 1.11.3, `@emnapi/wasi-threads` 1.2.3, `@napi-rs/wasm-runtime` 1.2.2, `@tybys/wasm-util` 0.10.3, `tslib` 2.8.1 y `react-is` 19.3.1; son versiones añadidas por las dependencias nuevas, no cambios de las existentes.

El bloqueo no contiene `@radix-ui/react-toast`, `@radix-ui/react-collection` ni `@radix-ui/react-visually-hidden` (lo comprueba una prueba unitaria desde esta corrección).

## Cómo se obtuvo `tailwind-compila.txt`

Guion desechable (no guardado) con `node`, ejecutado desde la raíz del proyecto: carga `postcss.config.mjs`, escribe sus plugins y procesa con `postcss` + `@tailwindcss/postcss` la entrada `@import "tailwindcss"; @source "./x.html";` con `x.html` = `<div class="flex p-4"></div>`; imprime los bytes de CSS generado y si contiene `.flex` y `.p-4`. Resultado en el clon limpio (el que guarda `tailwind-compila.txt`): 10437 bytes, ambas clases presentes. Una ejecución anterior de este guion dio 4725 bytes; el guion no se conservó y la causa de la diferencia queda no determinada. Lo que se comprueba, que Tailwind compile y genere las utilidades, se cumple en ambos casos.

## Orden `navegador` tras la corrección (MAYOR-2)

`ENTORNO=preproduccion` se fija en el `env` del `webServer` de `playwright.config.ts`, cuyo comando es `next build && next start ...` (sin `npx`; la orden se lanza con `npm run navegador`, que pone `node_modules/.bin` en el PATH) y que también fija `NEXT_TELEMETRY_DISABLED: "1"`: compilación y servicio ven el mismo valor en cualquier shell. `package.json` → `navegador`: `playwright test --config playwright.config.ts`. Hoy nada del código lee `ENTORNO`, así que el efecto en la compilación no es observable aún.

## Exención inBundle y scripts de instalación del bloqueo

Una prueba unitaria cierra la exención `inBundle`: solo vale en ruta anidada, con el nombre en `bundleDependencies` del padre, sin `resolved` ni `integrity` en la entrada, con el padre del registro e integridad, y con el padre en una lista cerrada (hoy solo `node_modules/@tailwindcss/oxide-wasm32-wasi`, 6 entradas). Otra prueba fija como lista cerrada las entradas con `hasInstallScript` (hoy solo `node_modules/fsevents`). Ambas tienen casos negativos.

## Clon limpio (M-2)

Clon local de la punta de la rama en `C:\dev\tmp-t002` (borrado al final). Primera ejecución de `npm run verificar` con carga: 2 pruebas de `tests/conector/apoyo.test.ts` agotaron los 5 s; repetido ese archivo solo pasó (104/104) y la segunda ejecución completa del conjunto terminó en verde (12 archivos, 230 pruebas). Aviso: en `tailwind-compila.txt` salen 10437 bytes (antes 4725; causa no determinada, ver arriba; ambos con `.flex` y `.p-4`). El navegador usado fue Chrome Headless Shell 159.0.8154.6, ya descargado en la caché de usuario de Playwright (`descarga-navegador.txt`); un clon nuevo no lo descarga, por eso la descarga es una orden expresa (`npx playwright install chromium-headless-shell`, no se ejecutó de nuevo).

## Aviso para T-003 y T-004 (m-3)

Las pruebas en navegador compilan en `.next` con `ENTORNO=preproduccion`. Cuando el código lea `ENTORNO`, esa `.next` no debe servirse ni desplegarse. T-003/T-004 deben dar a las pruebas en navegador un `distDir` propio (por ejemplo `.next-pruebas`, ignorado por git, prettier y eslint) o limpiar `.next` antes de compilar para despliegue.
