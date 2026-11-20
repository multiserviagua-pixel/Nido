# T-007 (partes a a e) · Resultado

Fecha: 20/11/2026 · Rama `tarea/020-T-007` · Autor: `ingeniero-frontend`. Las partes (f) y (g) no están hechas (esperan T-006).

## Comando y resultado

`npm ci --ignore-scripts` -> salida 0, 0 vulnerabilidades.

`npm run verificar` (tipos, estilo, test, aislamiento, arnes, build) -> **salida 0**, a la primera sin timeouts de `tests/conector/apoyo.test.ts`.

- tipos: sin errores.
- estilo: Prettier y ESLint (`--max-warnings 0`) sin hallazgos.
- test: **25 archivos, 676 pruebas, todas superadas** (`tests/unit/diseno/`: 9 archivos, 337 pruebas; ninguna saltada).
- aislamiento: 45 de 45 comprobaciones superadas.
- arnes (`comprobar-specs`): salida 0; avisos de tamaño de especificaciones ajenas (041), anteriores a esta tarea.
- build: compilado correctamente.

## Pruebas por parte (cada una escrita en rojo en su commit antes del código)

| Parte | Archivo de prueba | Pruebas | PRUEBA / CA |
| --- | --- | --- | --- |
| a | `tests/unit/diseno/formato-fechas.test.ts` | 56 | 001 (fechas), 002; CA-037, CA-038 |
| b | `tests/unit/diseno/formato-numeros.test.ts` | 20 | 001 (números), 003; CA-037, CA-039, CA-040, CA-008 |
| c | `tests/unit/diseno/texto-dato.test.tsx` | 19 | 004; CA-041 |
| d | `tests/unit/diseno/direccion.test.ts` | 28 | 009; CA-044 |
| e | `tests/unit/diseno/textos-estados.test.ts` | 18 | 007, 003 (estados); CA-009, CA-013, CA-017, CA-036, CA-051 |

Las fronteras de T-003 (PRUEBA-008) siguen en verde con el código nuevo en `src/components/`.

## No ejecutado

PRUEBA-017 y las demás pruebas en navegador (TextoDato dentro de la muestra), PRUEBA-019 (navegador en inglés y en otras zonas): dependen de la muestra (T-005 en adelante). Aquí solo hay la parte unitaria.

## Segunda vuelta (dictamen NO APTO del revisor)

- MAYOR-1: `construirRuta` recibe `{esquema, estado}` y escribe la consulta con `escribirEstadoDireccion`; ya no admite una consulta en cadena. En plantillas del panel se descartan los campos de tipo identificador (`?busqueda=ana` y `?cliente=<uuid>` dan la dirección sin consulta). Prueba: `direccion.test.ts`.
- MAYOR-2: `texto-dato.test.tsx` sin caracteres invisibles literales (todo con `\uXXXX`); prueba nueva `estatica-caracteres-y-direccion.test.ts` que recorre `src/components/**` y `tests/unit/diseno/**` y falla ante Cc, Cf, U+2028 o U+2029 literales (salvo salto de línea, retorno y tabulador). Comprobado además con `grep -P` sobre los bytes UTF-8 de esos caracteres: sin coincidencias.
- Menores: fechas imposibles no se convierten en otra y años acotados a 1000-9999; valores de lista `[a-z0-9_-]+`; `SoloLector` con `children: string`; comprobación estática de que `admin_cliente` no se usa fuera de `rutas.ts` y de que `src/app/panel/**` no lleva un campo identificador de cliente (la carpeta aún no existe: la comprobación se activa sola cuando la cree la 030).

## Límites conocidos y avisos

- `textoPlano` no repara surrogados sueltos (mitades de par UTF-16 mal formadas): se dejan pasar tal cual; es un límite conocido, no un hueco de privacidad.
- El catálogo `agente.*` de `textos.ts` y los iconos de estado son PROVISIONALES. Aviso a T-006(b): confirmar o sustituir ambos al hacer la muestra.

## Verificación de la segunda vuelta (honesta)

- `npx vitest run tests/unit/diseno` con `--testTimeout=60000`: 10 archivos, 349 pruebas, todas superadas. Con el tiempo por defecto, 19 pruebas de `fronteras.test.ts` agotaron 5 s por carga de la máquina.
- `npx vitest run tests/conector/apoyo.test.ts` con tiempos de 60 s: 104 de 104 superadas.
- `npm run verificar` completo, 3 intentos: intento 1 salida 1 (timeouts de 5 s en apoyo y fronteras), intento 2 salida 1 (688 pruebas: 684 superadas, 4 con timeout; 2 de ellas en `acceso-muestra.test.ts`, 1 aserción en cascada tras el timeout), intento 3 abortado por el sistema por falta de memoria. **No hay un `verificar` completo en verde en esta vuelta**: los fallos son todos timeouts por carga, ninguno por aserción propia, pero hay que repetirlo con la máquina libre.

## Comprobación del orquestador tras rebasar sobre `main` (20/11/2026, commit f7f93c2)

Máquina cargada (cuatro chats a la vez); regla de la coordinación (D-036, punto 4): `npx vitest run --maxWorkers=3` más el resto por separado. Tiempo máximo explícito de 60 s en las tres pruebas lentas de `td/`.

- `npm run tipos` → salida 0.
- `npm run estilo` → salida 0.
- `npx vitest run --maxWorkers=3` → salida 0; 48 archivos, 1136 pruebas en verde (540 s).
- `npm run aislamiento` → salida 0.
- `npm run arnes` → salida 0 (SUPERADO).
- `npm run build` → salida 0.
- `npm run verificar` completo en una sola orden: no ejecutado en esta vuelta; sustituido por lo anterior.
