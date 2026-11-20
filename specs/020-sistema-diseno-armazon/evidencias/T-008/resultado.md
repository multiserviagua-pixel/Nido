# T-008 (partes a y b) · Resultado

Fecha: 20/11/2026 · Rama `tarea/020-T-008` · Autor: `ingeniero-backend`. La parte (c) no está hecha (espera a la 002·T-004).

## Archivos

- `src/lib/errores/referencia.ts`: `FORMATO_DE_REFERENCIA` (`^[SN]-[0-9A-HJKMNP-TV-Z]{10}$`), `crearReferencia(origen)` con origen `"servidor"` (`S-`) o `"navegador"` (`N-`), y `leerReferencia(valor)`, que devuelve la referencia o `null`.
- `src/lib/errores/sin-acceso.ts`: `sinAcceso(): never`, sin parámetros, llama a `notFound()` de Next.js (404).
- `tests/unit/diseno/referencia.test.ts`, `tests/unit/diseno/sin-acceso.test.ts`.

## Pruebas por parte (cada una en rojo en su commit antes del código)

| Parte | Commits (rojo -> verde) | Prueba | PRUEBA / REQ / CA |
| --- | --- | --- | --- |
| a | e7503d1 -> 92ae81c; corrección 73e7570 -> 4cb4ec5 | `referencia.test.ts`, 12 pruebas | PRUEBA-010 (formato); REQ-057; CA-042 |
| b | c723f73 -> 23683dd | `sin-acceso.test.ts`, 4 pruebas | unitaria propia; PRUEBA-008 (fronteras, en verde); REQ-027, REQ-077; CA-046 |

Parte (a): formato exacto en las dos letras de origen; 10.000 sin repetir; los 32 símbolos aparecen; usa `crypto.getRandomValues` y nunca `Math.random`; con el reloj parado da referencias distintas; si el generador falla, lanza y no hay respaldo; un origen fuera de la lista da `ErrorDeAplicacion("entrada_invalida")` sin eco. `leerReferencia` descarta la cadena testigo (sola, delante, detrás), la vacía, 9 y 11 caracteres, minúsculas, otro origen, otro separador, letras I, L, O, U, espacios, salto de línea, NUL, cifra de ancho completo y todo lo que no es una cadena primitiva.

La corrección: la regla de ESLint del proyecto solo admite `throw new ErrorDeAplicacion(codigo)`. `referencia.ts` importa por eso `../plataforma/errores` (sin `node:` ni paquetes); la prueba admite esa única importación.

Parte (b): sin parámetros; lanza el error de Next.js con `digest` `NEXT_HTTP_ERROR_FALLBACK;404`; igual con o sin argumentos, sin eco; solo importa `notFound`; no menciona 403, `forbidden`, `unauthorized`, registro ni consola.

## Comandos (20/11/2026, máquina cargada)

- `npm ci` -> salida 0.
- `npm run tipos` -> salida 0.
- `npm run estilo` -> salida 0.
- `npx vitest run --maxWorkers=3` -> salida 0; 50 archivos, 1157 pruebas en verde.
- `node scripts/comprobar-specs.mjs` -> salida 0 (SUPERADO).
- `npm run verificar` completo, `aislamiento` y `build`: no ejecutados (por instrucción, máquina cargada).

## No ejecutado

- PRUEBA-010 (registro): `registrarFallo` y el campo `referencia` en `registro.ts` son la parte (c).
- Código real de respuesta de `sinAcceso` en carga completa y en navegación: PRUEBA-034 (T-009 (j)).
