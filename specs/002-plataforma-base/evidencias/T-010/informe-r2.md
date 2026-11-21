# T-010 · Repetición (2.ª pasada) en un clon limpio de `main`

- Commit probado: `9e629f1` (HEAD de `main`; la copia de trabajo `t-010b` está en el mismo commit). Clon limpio fuera del repositorio: `C:\dev\qa-t010b` (`git reset --hard 9e629f1` y `git clean` antes de cada caso).
- Fecha: 21/11/2026. Entorno: Windows 11, Git Bash, Node v26.13.0, npm 11.20.0, Vitest 5.1.0, 14 procesadores lógicos, 16 GB de RAM.
- Datos ficticios. Sin secretos: el canario se compone en ejecución (`gh""p_` + repetición) y no aparece en ninguna evidencia (0 apariciones en la salida del caso 7 y 0 en `grep` de todo `r2-11-*`); el DSN y los demás valores del entorno ficticio de `start` van solo en el entorno del proceso y no se imprimen (0 coincidencias en `r2-12-*`).
- Condición de la máquina (dato, no excusa): durante toda la pasada hubo otras sesiones ejecutando Vitest y `next` en paralelo (decenas de procesos `node`; memoria libre 2,3 GB de 16 al empezar). Eso explica las caídas del intento 1 de PRUEBA-055 (abajo) y la lentitud (un `verificar` sin defectos tardó 567 s; en la 1.ª pasada, 310 s).
- Entorno medido: `r2-entorno.txt` (Node v26.13.0, npm 11.20.0, 14 CPU, 15,5 GB de RAM; libre al cerrar 3,3 GB). La memoria libre de 2,3 GB del arranque es la que anotó la pasada al empezar, no está medida en ese archivo.
- Modo de Vitest: orden exacta de `r2-02`: `npx vitest run --maxWorkers=3`; `--maxWorkers=3` en la orden suelta de la 2.ª pasada (r2-02) y `VITEST_MAX_WORKERS=3` (variable que lee Vitest) en las cadenas `npm run verificar` de r2-11. Timeouts de Vitest sin tocar (30 s de la configuración). Con el número de trabajadores por defecto (14) la cadena cayó (r2-10b).

- Privacidad de red: en `r2-06-dev-servidor.txt`, `r2-07-start-ficticio-servidor.txt` y `r2-08-start-desarrollo-servidor.txt` la IP de red local que imprime Next se sustituyó por `<IP-local>`. Para el caso de `ENTORNO=desarrollo` con `start` se creó un `.env.local` con solo `ENTORNO=desarrollo` en el clon y se borró después.

## Tabla de pruebas

| Prueba | Resultado | Duración | Archivos |
| --- | --- | --- | --- |
| `npm ci --ignore-scripts` | SUPERADA (salida 0; 470 paquetes; 0 vulnerabilidades) | 35 s | `r2-01-npm-ci.txt` |
| `npx vitest run --maxWorkers=3` | SUPERADA (salida 0; 83 archivos, 2291 de 2291) | 340 s | `r2-02-vitest.txt` |
| `tipos` solo | SUPERADA (0) | 5 s | `r2-05-tipos.txt` |
| `estilo` solo | SUPERADA (0) | 21 s | `r2-05-estilo.txt` |
| `aislamiento` solo | SUPERADA (0; 45 de 45) | 3 s | `r2-05-aislamiento.txt` |
| `arnes` solo | SUPERADA (0) | 3 s | `r2-05-arnes.txt` |
| `build` solo | SUPERADA (0) | 8 s | `r2-05-build.txt` |
| `npm run verificar` sin defectos (caso 0 de PRUEBA-055) | SUPERADA (salida 0; 83 archivos, 2291 de 2291) | 567 s | `r2-11-prueba-055/0-sin-defectos.txt` |
| PRUEBA-059, parte de existencia | 1 «fallo» del script, sin juicio (ver más abajo): `NO LISTADO 56555dd`; el resto OK | 1 s | `r2-03-prueba-059-historial.txt`, `r2-p059.sh.txt` |
| PRUEBA-059, un commit añadido sin `aprobacion.md` lo detecta el paso 6 | SUPERADA en la simulación (sin `aprobacion.md`: FALLA; con los tres archivos: OK; asunto sin forma: FALLA) | 2 s | `r2-04-prueba-059-paso6.txt` (secciones «simulacion») |
| PRUEBA-024 con `npm run start` y entorno ficticio no de desarrollo, `fetch` de Node | SUPERADA (7 de 7) | 3 s (tras `build` de 16 s) | `r2-12-start-ficticio-fetch.txt`, `r2-12-start-build.txt`; antes `r2-07-*` |
| PRUEBA-024 con `npm run dev`, `fetch` de Node | 6 de 7: FALLA `POST /` sin 2xx (da 200) | 8 s | `r2-12-dev-fetch.txt`; antes `r2-06-*` |
| PRUEBA-024 con `start` y `ENTORNO=desarrollo` | `/api/salud` da 503 `{"estado":"error"}` (cierre en fallo previsto; el criterio dice que es correcto y no se toca) | 5 s | `r2-12-start-desarrollo-fetch.txt`; antes `r2-08-*` |
| PRUEBA-055, 8 defectos y sin defectos | ver tabla propia | | `r2-11-prueba-055/` |
| T-008 | No ejecutada: bloqueada (R-1), como en la 1.ª pasada | | |

## PRUEBA-055 (un defecto cada vez, `npm run verificar`)

Orden: `VITEST_MAX_WORKERS=3 npm run verificar` (cadena `tipos` → `estilo` → `test` → `aislamiento` → `arnes` → `build`). Guion: `r2-negativas2.sh.txt` (cadena) y `r2-negativas-solo.sh.txt` (paso solo). Resumen: `r2-11-prueba-055/resumen.txt` y `resumen-solo.txt`.

| N.º | Defecto | Cadena completa: salida y duración | Paso que falló en la cadena | Paso del defecto ejecutado solo |
| --- | --- | --- | --- | --- |
| 0 | ninguno | 0, 567 s | ninguno | no hace falta |
| 1 | error de tipos | 2, 9 s | `tipos` (TS2322) | no hace falta |
| 2 | `process.env` fuera de `configuracion.ts` | 1, 45 s | `estilo` (`no-restricted-properties`) | no hace falta |
| 3 | prueba fallida | 1, 674 s | `test` (1 falla la añadida; 2291 pasan) | no hace falta |
| 4 | `.only` | 1, 1175 s | `test` («Unexpected .only modifier») | no hace falta |
| 5 | ninguna prueba | 1, 48 s | `test` («No test files found») | no hace falta |
| 6 | política RLS quitada en la copia del SQL | 1, 1151 s | `test` (2260 pasan y un error de proceso: «Worker forks emitted error ... exit code 3221226505»), NO llegó a `aislamiento` | `npm run aislamiento` solo: salida 1, 44 de 45, FALLIDA «Superadmin con doble factor: ve todos los clientes» (`solo-6-politica-rls.txt`, 2 s) |
| 7 | canario de secreto compuesto en ejecución | 127, 264 s | cayó Node dentro de `test` (sin mensaje); NO llegó a `arnes` | `npm run arnes` solo: salida 1, «Posible secreto en src/lib/qa_canario.txt: token de GitHub»; canario en la salida: 0 (`solo-7-canario.txt`, 2 s) |
| 8 | prerender roto (`/qa-rota`) | 127, 389 s | cayó Node dentro de `test` (sin mensaje, como el caso 7); NO llegó a `build` | `npm run build` solo: salida 1, «Export encountered an error on /qa-rota/page» (`solo-8-compilacion.txt`, 18 s) |

Resultado: sin defectos 0; los 8 defectos dan salida distinta de 0. En la cadena `npm run verificar` completa, 5 de 8 (casos 1 a 5) fallan en el paso que les corresponde. Los casos 6, 7 y 8 no llegaron a su paso (el 6 por un error de proceso de Vitest, el 7 y el 8 por caídas de Node/Windows con la máquina sin memoria); su detección se demostró ejecutando ese paso solo, con la misma copia con defecto, tal como permite «Repetición de T-010». No es la lectura literal «8 de 8 con la cadena completa».

Nota sobre el caso 6: en la cadena el paso `test` falló con 2260 de 2260 pruebas en verde y un «Unhandled Error» de un trabajador, no por una prueba; es una caída del entorno, no un fallo atribuible al defecto.

Intentos invalidados (se dejan, no se usan como evidencia):

- `r2-10b-prueba-055-intento-invalido-salida-127-por-caida-de-vitest/` (antes `r2-10-prueba-055/`): sin `VITEST_MAX_WORKERS`; casos 0, 3, 6, 7, 8 con salida 127 (V8 abortó dentro de Vitest, volcado de pila en `3-prueba-fallida.txt`), el caso 4 tardó 495 s. No vale.
- `r2-10a-prueba-055-intento-invalido-por-next-dev/`: con `next dev` corriendo a la vez (salió de `r2-negativas.sh.txt`); salida 2 en todos salvo el caso 7, que dio 1. No vale.

## PRUEBA-059

Guion: `r2-p059.sh.txt` (el recorrido manual del paso 6 del diseño no tiene herramienta oficial).

- A. Asunto con forma `T-NNN (002): ` o `T-NNN y T-NNN (002): ` en los 9 commits de la lista (`f9f0494`, `12044a1`, `03b82c0`, `6791036`, `0d8fd6d`, `50b01c3`, `d852217`, `5a1b9ab`, `9e629f1`): OK. «aprobado por delegación D-036» en el mensaje: sí en los 5 desde T-005 (`0d8fd6d` en adelante), no en los 4 anteriores (no exigida).
- B. Hallazgo para el revisor: el recorrido de `first-parent` de `main` con `(002)` en el asunto encuentra `56555dd`, no incluido en la lista. Dato: asunto «001 y 002: reformula PRUEBA-059 y PRUEBA-024, tareas T-011 y T-012 (002) y T-121 a T-123 (001), C-2 con prompt_no_valido, HMAC de registrar_suceso decidido ...». Es un commit de coordinación de las funciones 001 y 002 (cambia el plan, no implementa una tarea), con «(002)» en mitad del asunto y no con la forma `T-NNN (002): `; su mensaje sí lleva «aprobado por delegación D-036, 21/11/2026». No lo declaro ni fallo ni superado: el juicio (si la prueba se refiere solo a commits de implementación) es del revisor.
- C. En el árbol de `9e629f1`, `evidencias/T-001` a `T-006` y `T-009` existen con `verificar.md`, `revision.md`, `aprobacion.md` y, donde procede (T-001, T-003, T-004, T-005, T-006), `dictamen.md`: OK (7 de 7).
- D. «no consta» en `aprobacion.md` de T-001 a T-004: OK. Literal de la delegación (T-005, T-006, T-009) coincide con `git log`: OK (4 de 4).
- E. Un commit añadido sin `aprobacion.md` (clon temporal con commits ficticios): detectado (`r2-04`, secciones de simulación).
- F. Resultado nuevo tras el dictamen del revisor (21/11/2026): en la 1.ª ejecución de este guion el punto E decía «admitido por la tabla» para T-011 y T-012 sin carpeta; el revisor lo dictaminó BLOQUEANTE (la prueba exige carpeta desde T-005). Se crearon `evidencias/T-011/`, `evidencias/T-012/` y los tres archivos nuevos de T-010 (`verificar.md`, `revision.md`, `aprobacion.md`). Repetido el recorrido (`r2-13-prueba-059-repeticion.txt`): A, C, D y los nuevos controles F en OK (T-011 y T-012: tres archivos y literal de la delegación igual al de `git log 9e629f1`; T-010: tres archivos). La línea E del guion es texto fijo anterior y queda superada por F. El único «fallo» del guion sigue siendo B (`56555dd`).
- Sobre B: `56555dd` y `b25a1a1` (esta última, «002 T-010: evidencias del clon limpio...») son commits de coordinación o de evidencia, no de implementación de una tarea; el revisor los considera fuera del paso 5. El texto de PRUEBA-059 lo precisa el orquestador.
- Aviso sobre `r2-04`: el primer bloque («commits reales») aplica el script de la 1.ª pasada al árbol propio de cada commit histórico y da FALLA en casi todos. Es una limitación del script, no una conclusión: las carpetas a posteriori de T-012 solo existen desde `9e629f1`, y el script no entiende el asunto «T-011 y T-012 (002)». No lo uso como resultado; vale el bloque C, sobre el árbol de HEAD.

## PRUEBA-024: `fetch` de Node en desarrollo y en `start`

Guion: `r2-servir.mjs.txt` (arranca `npm run dev` o `npm run start`, hace las peticiones con `fetch` y mata el árbol de procesos). Desarrollo: sin ninguna variable `VERCEL*`, `ENTORNO=desarrollo`. `start`: tras `npm run build`, `ENTORNO=preproduccion`, `VERCEL=1`, `VERCEL_ENV=preview`, `VERCEL_REGION=arn1`, `COMMIT_DESPLEGADO` y `SUPERVISION_DSN` ficticios, solo en el entorno del proceso.

| Petición | `npm run dev` | `npm run start` (entorno ficticio) |
| --- | --- | --- |
| `GET /` 200 con `lang="es"` | 200, `lang="es"` | 200, `lang="es"` |
| ruta inexistente | 404 | 404 |
| `POST /` con `fetch` y cuerpo de texto (`"{}"`, el Content-Type por defecto es `text/plain`) | **200 (el criterio «sin 2xx» falla)** | 405 |
| `GET /api/salud` | 200, cuerpo exacto `{"estado":"ok"}` | 200, cuerpo exacto |
| `POST /api/salud` | 405 | 405 |
| Resultado | 6 de 7 | 7 de 7 |

Dato adicional (informativo, dos intentos cada uno, resultados idénticos): `POST /` según Content-Type. En `dev`: json 200, text/plain 200, urlencoded 200, sin cuerpo 200, multipart 409. En `start`: json 405, text/plain 405, sin cuerpo 405, **urlencoded 200**, multipart 409. Es el comportamiento de Next (la página acepta `POST` como una acción de servidor), no código del proyecto; no se ha tocado nada.

Lectura honesta: el texto de la prueba acota las peticiones a `npm run start` con entorno ficticio («como en la 1.ª pasada»), y ahí `POST /` con cuerpo de texto da 405 (7 de 7). En `dev` da 200, y en `start` un `POST /` con cuerpo `application/x-www-form-urlencoded` también da 200; por tanto «`POST /` sin 2xx» no es una propiedad general de la ruta. Si el criterio se lee para cualquier modo o cualquier cuerpo, no se cumple.

## No se pudo comprobar o queda limitado

- `npm run verificar` completo a la primera con el número de trabajadores por defecto: no se pudo en esta máquina con la carga de otras sesiones (ver r2-10b); solo con `VITEST_MAX_WORKERS=3`.
- PRUEBA-055 casos 6, 7 y 8: la cadena no llegó al paso del defecto (arriba); no se pudo repetir en cadena por el tiempo (cada caso tardó entre 4 y 20 minutos bajo carga) y por la memoria de la máquina. No ejecutada la variante «cadena completa» de esos tres.
- Timeouts de Vitest a 60 s: no hizo falta; `acceso-muestra` no falló en ninguna de las ejecuciones con 3 trabajadores.
- PRUEBA-058 (pgTAP) y T-008: no ejecutadas, no son de esta tarea.
- Autoría de los commits: no se puede comprobar técnicamente hasta las firmas (A-4).

## Observaciones

1. `npm run tipos` falló tras `npm run dev` con tipos de `.next/dev/types/validator.ts` obsoletos (TS2344, «Type 'Route' does not satisfy the constraint '"/"'»); pasa tras borrar `.next` (`r2-09-tipos-tras-dev.txt`). Un desarrollador que alterne `dev` y `verificar` puede ver ese rojo.
2. `next dev` (o `build`/`start`) añade a `AGENTS.md` un bloque «nextjs-agent-rules» de 10 líneas (visto con `git status` en el clon tras las pruebas de `dev`/`start`: ` M AGENTS.md`). Ensucia el árbol de trabajo; no se ha tocado nada y se restauró en el clon con `git checkout`.
3. Quedan procesos `node` ajenos de la sesión del 20/11 (`next start -p 3411`, pids 3240 y 27932, y un `detached-flush` de `worktrees\t-009`); no son de esta pasada y no los he parado.

## Recomendación por prueba (el estado final lo decide el orquestador)

| Prueba | Recomendación |
| --- | --- |
| `npm ci`, Vitest 2291 de 2291, `tipos`, `estilo`, `aislamiento`, `arnes`, `build` | Superada |
| `verificar` sin defectos | Superada (con `VITEST_MAX_WORKERS=3`; con 14 trabajadores y la máquina cargada cayó) |
| PRUEBA-055 | Superada con la anotación que prevé «Repetición de T-010» (5 de 8 en cadena completa, 3 de 8 con el paso solo, sin defectos 0, canario sin aparecer). No «8 de 8 con la cadena completa» |
| PRUEBA-059 | Superada, con las carpetas `T-011`, `T-012` y `T-010` creadas tras el dictamen (`r2-13`). Queda el punto B (`56555dd`, `b25a1a1`): commits de coordinación o evidencia fuera del paso 5 según el revisor; si el orquestador no lo recoge en el texto de la prueba, el guion lo seguirá marcando |
| PRUEBA-024 | Superada si se lee como en la 1.ª pasada y en el texto de la prueba (`start` con entorno ficticio, 7 de 7, más el 503 previsto con `ENTORNO=desarrollo`). No superada si «`POST /` sin 2xx» se exige también en `npm run dev`, donde da 200 |
