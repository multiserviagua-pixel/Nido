# T-010 · Comprobación del camino corto en un clon limpio de `main`

- Commit probado: `d852217` (HEAD de `main`), clon local `C:\dev\qa-t010\clon` (clonado de la copia local, fuera del repositorio).
- Fecha: 20/11/2026. Entorno: Windows 11, Git Bash, Node v26.13.0, npm 11.20.0, 14 procesadores lógicos.
- Datos ficticios; `.env.local` con solo `ENTORNO=desarrollo` (ignorado por git y borrado al terminar). Sin secretos.

| Prueba | Resultado | Archivos |
| --- | --- | --- |
| `npm ci --ignore-scripts` | SUPERADA (salida 0, 118 s, 0 vulnerabilidades) | 01 |
| `npm run verificar`, 1.ª pasada | FALLIDA (salida 1, 292 s): 3 pruebas de `tests/unit/diseno/acceso-muestra.test.ts` con «Test timed out in 30000ms» (bajo carga; 958 de 961) | 02 |
| Ese archivo solo | SUPERADA (33 de 33, 8,6 s) | 05 |
| `npm run verificar`, repetición | SUPERADA (salida 0, 310 s, 961 de 961; Vitest 250 s) | 06 |
| PRUEBA-059 (historial integrado) | FALLIDA | 03, 04 |
| PRUEBA-024 completa, `start` con solo `ENTORNO=desarrollo` | FALLIDA en 2 de 7 comprobaciones: `/api/salud` da 503 `{"estado":"error"}` | 07-start, 08 |
| PRUEBA-024 completa, `start` con entorno no-desarrollo ficticio completo | SUPERADA (7 de 7) | 07-start-preproduccion-ficticia, 09 |
| PRUEBA-055, parte automática (`verificar.test.ts`) | SUPERADA (3 de 3) | 10 |
| PRUEBA-055, 8 defectos de uno en uno | Salida distinta de 0 en 8 de 8, pero la atribución al paso correcto solo está demostrada en parte (ver abajo) | 11, 12 |
| T-008 | No ejecutada: bloqueada (R-1) | |

## PRUEBA-059

Los 7 commits de `main` con `(002)` (T-001 a T-009) no tienen ninguna carpeta `specs/002-plataforma-base/evidencias/T-NNN/` (no existe `evidencias/` de la 002 en `main`), así que ninguno tiene `verificar.md`, `revision.md`, `aprobacion.md` ni `dictamen.md`. Además, `12044a1` agrupa T-002 y T-003 y `03b82c0` es un commit de «menores» de T-003: no hay un commit por tarea. La constancia «aprobado por delegación D-036» sí está en el mensaje de T-005, T-006 y T-009 (la guía la admite en el mensaje del commit), pero no en T-001 a T-004. La segunda mitad de la prueba (un commit añadido sin `aprobacion.md` lo detecta el recorrido, paso 6) está comprobada con un script de recorrido (`recorrido-paso6.sh.txt`) en un clon temporal con commits ficticios: sin `aprobacion.md` da FALLA, con los tres archivos da OK (04). Ese script lo escribió QA; el paso 6 del diseño es un recorrido manual y no hay herramienta oficial.

## PRUEBA-024

`npm run start` ejecuta `next start`, que fija `NODE_ENV=production`; por diseño (`predicadoDesarrollo`) con `NODE_ENV=production` el entorno `desarrollo` no vale, y `/api/salud` cierra en fallo con 503. Por tanto el criterio «`/api/salud` 200 tras `npm run start`» no se cumple con la configuración que describe la guía (solo `ENTORNO=desarrollo`); exige un entorno no-desarrollo completo (`ENTORNO`, `SUPERVISION_DSN`, `COMMIT_DESPLEGADO`, `VERCEL=1`, `VERCEL_ENV`, `VERCEL_REGION=arn1`), que se probó con valores ficticios. `/`, 404, `POST /` (405) y `POST /api/salud` (405) pasan en ambos casos.

## PRUEBA-055

Defectos aplicados en una copia del clon limpio, uno a la vez, con `npm run verificar` (archivos 11 y 12; las primeras versiones de los casos 3, 4 y 8 fallaron por formato de Prettier de mis archivos y se repitieron formateados, ver 12):

| N.º | Defecto | Salida | Paso que falló |
| --- | --- | --- | --- |
| 1 | error de tipos | 2 | `tipos` (TS2322) |
| 2 | `process.env` fuera de `configuracion.ts` | 1 | `estilo` (`no-restricted-properties`) |
| 3 | prueba fallida | 1 | `test` (961 pasan, 1 falla la mía) |
| 4 | `.only` | 1 | `test` («Unexpected .only modifier»), mezclado con 6 timeouts por carga |
| 5 | ninguna prueba | 1 | `test` («No test files found») |
| 6 | política RLS quitada en la copia del SQL | 1 | `aislamiento` ejecutado solo (FALLIDA «Superadmin con doble factor»); en cadena completa el paso `test` falló antes por timeouts (11) |
| 7 | canario de secreto compuesto en ejecución | 1 | `arnes` ejecutado solo («Posible secreto ... token de GitHub»); el valor no aparece en ninguna evidencia; en cadena completa falló antes `test` por un timeout (11) |
| 8 | prerender roto (`/qa-rota`) | 1 | `build` ejecutado solo (28 s); en cadena completa falló antes `test` por timeouts (12) |

Sin defectos: 0 (06). Por tanto 8 de 8 dan salida distinta de 0, pero en 6, 7 y 8 la cadena `verificar` completa no llegó al paso del defecto por la inestabilidad de `acceso-muestra`; la detección se demostró ejecutando ese paso solo. Eso no es igual a lo escrito en la prueba («8 de 8 con `verificar`»). Nota: `aislamiento` solo ejecuta `docs/MODELO-DATOS.sql`, no hay migración en `main`.

## Inestabilidad observada

`tests/unit/diseno/acceso-muestra.test.ts` (función 020, no PGlite) agota los 30 s del tiempo de prueba bajo la carga de la ejecución completa: falló en 5 de las 7 pasadas que llegaron al paso `test` (02; 11 casos 6 y 7; 12 casos 4 y 8), con 1 a 6 timeouts cada vez, y pasa solo en 8,6 s. En la pasada limpia posterior (06) pasó. No es un fallo del código bajo prueba, pero hace que `npm run verificar` a veces dé rojo en esta máquina sin cambios.
