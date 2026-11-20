# Negativas de las reglas ESLint de T-003 (PRUEBA-055)

Ejecutadas el 20/11/2026 en un clon temporal fuera del repositorio (`%TEMP%/clon-neg-t003b`, commit `f76d617`, `npm ci --ignore-scripts`). En cada caso se creó un archivo con la infracción y se ejecutó la misma orden ESLint que usa el script `estilo`, sin opciones añadidas: `npx eslint --config eslint.config.mjs --max-warnings 0 <archivo>`. La configuración fija `linterOptions.noInlineConfig: true`, así que no hace falta `--no-inline-config` aparte. Todas salieron con código 1. Un archivo limpio (`src/lib/ok.ts`) salió con código 0.

| N.º | Infracción | Archivo | Regla que salta | Resultado |
| --- | --- | --- | --- | --- |
| 1 | `process.env` fuera de `configuracion.ts` | `src/lib/otro/n1.ts` | `no-restricted-properties` | SUPERADA (salta) |
| 2 | `console` fuera de `src/lib/registro/` | `src/lib/otro/n2.ts` | `no-console` | SUPERADA |
| 3 | `runtime = 'edge'` | `src/app/x/n3.ts` | `no-restricted-syntax` | SUPERADA |
| 4 | `preferredRegion` | `src/app/x/n4.ts` | `no-restricted-syntax` | SUPERADA |
| 5 | `JSON.parse` fuera de `entrada.ts` | `src/lib/otro/n5.ts` | `no-restricted-properties` | SUPERADA |
| 6 | `new URL` fuera de `entrada.ts` | `src/lib/otro/n6.ts` | `no-restricted-syntax` | SUPERADA |
| 7 | `child_process.exec` con argumento no literal | `src/lib/otro/n7.ts` | `security/detect-child-process` | SUPERADA |
| 8 | `// @ts-ignore` | `src/lib/otro/n8.ts` | `@typescript-eslint/ban-ts-comment` | SUPERADA |
| 9 | `// eslint-disable-next-line no-restricted-properties` + `process.env` | `src/lib/otro/n9.ts` | `no-restricted-properties` (error) y aviso de `noInlineConfig` | SUPERADA |
| 10 | `export const runtime = "edge" as const` | `src/app/x/n10.ts` | `no-restricted-syntax` | SUPERADA |
| 11 | ``export const runtime = `edge` `` (plantilla) | `src/app/x/n11.ts` | `no-restricted-syntax` | SUPERADA |
| 12 | `const runtime = "edge"; export { runtime }` | `src/app/x/n12.ts` | `no-restricted-syntax` | SUPERADA |
| 13 | `import { env } from "node:process"` | `src/lib/otro/n13.ts` | `no-restricted-imports` | SUPERADA |
| 14 | `globalThis.JSON.parse(...)` | `src/lib/otro/n14.ts` | `no-restricted-syntax` | SUPERADA |
| 15 | `URL.parse(...)` | `src/lib/otro/n15.ts` | `no-restricted-properties` | SUPERADA |
| 16 | `process.env` en `proxy.ts` de la raíz | `proxy.ts` | `no-restricted-properties` | SUPERADA |

Todas las negativas, más los tres casos permitidos (`process.env` en `configuracion.ts`, `console` en `src/lib/registro/`, `JSON.parse` y `new URL` en `entrada.ts`) y la comprobación del conjunto efectivo de reglas en `src/**` (15 reglas de `eslint-plugin-security`, 11 en error y 4 apagadas por diseño, más `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`, `react/no-danger` y `ban-ts-comment`), están automatizadas en `tests/unit/plataforma/reglas-eslint.test.ts`.

Alcance: las reglas se aplican a `src/**` y a `proxy.ts` de la raíz (Next 16), que se incluyó en `files` para que el límite no quede abierto. No cubren `scripts/` ni `tests/`.

Límites conocidos (no cubiertos por selectores):

- `export { runtime }` y `export { preferredRegion }` se prohíben siempre, aunque el valor fuera `nodejs`: el valor no se puede resolver con un selector, y se declara en el propio `export const`.
- `import * as p from "node:process"; p.env`, `globalThis.process.env` y `new globalThis.URL(...)` no se detectan.
- `route.ts` sin `manejador.ts` y la clave secreta (fase 2) no se expresan en esta configuración: lo primero lo comprueba `tests/unit/plataforma/rutas.test.ts` (T-004) y lo segundo queda para la fase 2. `new Error` no literal y `throw` de otra cosa que `ErrorDeAplicacion` sí se cubren (T-004, ver abajo).

## Negativas de la regla de errores (T-004)

Ejecutadas con la API `ESLint.lintText` sobre texto, con `eslint.config.mjs`, en `tests/unit/plataforma/reglas-errores.test.ts`. Todas saltan por `no-restricted-syntax`: 17 `throw new Error(variable)`; 18 `throw "x"`; 19 `throw new TypeError()`; 20 `throw new Error("x")` (lanzar `Error` tampoco vale); 21 `new Error` con plantilla; 22 `Error(variable)` sin `new`; 23 `throw e` de lo capturado; 24 el caso 17 en `entrada.ts`. Permitidos: `throw new ErrorDeAplicacion("…")`, `new Error("literal")` como valor, la definición en `errores.ts` y `new URL`/`JSON.parse` en `entrada.ts`. Límite: `Promise.reject(...)` y `new Error` con argumento literal fuera de `throw` no se detectan. Tampoco se detectan, por la misma razón, `new TypeError(v)` ni `new globalThis.Error(v)` usados como valor (sin `throw`): la regla deja pasar ambos.
