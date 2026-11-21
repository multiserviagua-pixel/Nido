# 002 · Tareas

Autor: `arquitecto` · 19/11/2026 · Camino corto por D-025. Fuente: `diseno.md` (§Esqueleto, §App base, §Integración, §Entornos, §Mapa). Orden, cobertura y asuntos del responsable (R-1 a R-6): `plan.md`. Sustituye a las 53 tareas anteriores (historial de git).

Cada tarea es pequeña, tiene un solo agente responsable y una prueba que dice cuándo está hecha. `[P]` marca las que pueden ir en paralelo porque no comparten archivos (con sus dependencias cumplidas).

Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Rama y puerta**: `tarea/T-NNN` desde `main`; entra por diseño §Integración: `npm run verificar` ejecutado por quien no implementa, `revisor`, `auditor-seguridad` si RC es C, «sí» del responsable y `merge --squash` con mensaje `T-NNN (002): …`.
- **Prueba primero**: en su propio commit y en rojo antes del código; el rojo se cita en `revision.md`. Canarios con forma de secreto, compuestos en ejecución (el gancho bloquea escribirlos literales).
- **Evidencias**: `specs/002-plataforma-base/evidencias/T-NNN/` con `verificar.md`, `revision.md`, `dictamen.md` (si C) y `aprobacion.md`. Sin valores de secretos.
- **RC** (ruta crítica): `C` = `revisor` y `auditor-seguridad`; `R` = solo `revisor`. **Res.**: reservada; el «sí» la nombra como tal.
- **Vuelta atrás** de cada tarea: `git revert` de su commit por el mismo camino (diseño §Integración, paso 7).

## Bloque 1 · Esqueleto

| ID | Tarea | Requisitos · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-001 | Manifiesto de diseño §Esqueleto solo con las órdenes directas (`dev`, `build`, `start`, `test`, `tipos`, `estilo`, `arnes`; las de control, aplazadas) y bloqueo con `--save-exact --ignore-scripts`; fija los VERIFICAR (`@types/*`, TypeScript 6.0.x, ESLint 10 o 9 frente a `eslint-config-next`, JSX en Vitest) con `verificar-decision`, fuente y fecha. TypeScript estricto (`strict`, `noUncheckedIndexedAccess`, `allowJs: false`). Vitest: `passWithNoTests: false`, `allowOnly: false`, incluye `tests/**` y `supabase/tests/pglite/**`. `next.config.ts`: `poweredByHeader: false` y las cabeceras de §App base | REQ-009, REQ-002 (parte) · CA-010 | P1 | `plataforma` | `tests/unit/plataforma/manifiesto.test.ts`: versiones exactas, `engines.node` `26.x`, ningún script de instalación (`preinstall`, `install`, `postinstall`, `prepare`), `tsconfig` estricto, opciones de Vitest. `tests/unit/plataforma/cabeceras.test.ts`: `headers()` da las de §App base. PRUEBA-024 (parte): `npm ci --ignore-scripts`, `tipos`, `estilo`, `test`, `arnes` en verde | `package.json`, `package-lock.json`, `.node-version`, `.gitattributes`, `.gitignore`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `vitest.config.ts` | C, Res. | hecha (f9f0494) |
| T-002 | Páginas de §App base: `/` («Servicio en funcionamiento»), 404 «Página no encontrada», `error` y `global-error` con texto fijo y «Reintentar», sin mensaje ni traza; `lang="es"`, un `h1`, `role="alert"`, todo por teclado. Pruebas con `renderToStaticMarkup` de `react-dom/server`, sin dependencias nuevas | REQ-009, REQ-019 · CA-010, CA-021 | T-001 | `ingeniero-frontend` | `tests/unit/app/paginas.test.tsx`: un `h1` por página, `lang="es"`, `role="alert"`, botón nativo; un error con un valor marcado en `message` y `digest` no lo muestra (PRUEBA-026, parte). `npm run build` en verde (PRUEBA-024, parte) | `src/app/{layout,page,not-found,error,global-error}.tsx`, `tests/unit/app/` | R | hecha (revisor APTO, 2.ª vuelta) |
| T-003 | `npm run verificar` de diseño §Integración: `aislamiento` (`node scripts/probar-modelo.mjs`) y `verificar` (`tipos && estilo && test && aislamiento && arnes && build`); `@electric-sql/pglite` 0.5.17 exacta; en `eslint.config.mjs`, las reglas de §Batería «Umbrales» que se expresan con ESLint (`eslint-plugin-security`, `no-restricted-properties` para `process.env` fuera de `configuracion.ts`, `no-console` fuera de `src/lib/registro/`, `runtime = 'edge'` y `preferredRegion`, `JSON.parse` y `new URL` fuera de `entrada.ts`) | REQ-002, REQ-003, REQ-004, REQ-006 · CA-002, CA-003, CA-005 (partes) | T-002 | `plataforma` | PRUEBA-055: `tests/unit/plataforma/verificar.test.ts` (la cadena exacta y en ese orden) y las 8 negativas en un clon temporal fuera del repositorio, anotadas en `verificar-negativas.md` | `package.json`, `package-lock.json`, `eslint.config.mjs`, `tests/unit/plataforma/` | C, Res. | hecha (revisor APTO con condición: regla `new Error` sin tarea; auditor APTO CON CONDICIONES sobre D-033) |

## Bloque 2 · Errores, configuración y entornos sin secretos

| ID | Tarea | Requisitos · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-004 `[P]` | Regla «Ningún error lleva un valor recibido» de §App base, puntos 1 a 3: `ErrorDeAplicacion(codigo)` con códigos de `codigos.ts`; `manejador.ts` (captura, código, 500 `{"estado":"error"}`, registro); `entrada.ts` (único `JSON.parse` y `new URL`; lanza `entrada_invalida` sin `cause`); `registro.ts` (línea JSON `{nivel, codigo, ruta, momento}`). `/api/salud`: GET y HEAD 200 `{"estado":"ok"}`, `Cache-Control: no-store`, sin leer la petición; el resto, 405 | REQ-009, REQ-019 · CA-010, CA-021 | T-003 | `ingeniero-backend` | `tests/unit/plataforma/errores.test.ts`: excepción con valor marcado → 500 genérico y registro sin el valor; `entrada.ts` sin `cause` (PRUEBA-026). `tests/unit/api/salud.test.ts`: cuerpo exacto de un solo campo, `no-store`, POST, PUT, PATCH y DELETE 405 (PRUEBA-025 y 044, partes L). `tests/unit/plataforma/rutas.test.ts`: todo `src/app/**/route.ts` usa `manejador.ts` | `src/lib/plataforma/{errores,manejador,entrada}.ts`, `src/lib/registro/{registro,codigos}.ts`, `src/app/api/salud/route.ts`, sus pruebas | C | hecha |
| T-005 | `configuracion.ts` de §App base «Configuración»: único lector de `process.env`, lista cerrada sin valores por defecto (`ENTORNO`, `SUPERVISION_DSN`, `COMMIT_DESPLEGADO`, `VERCEL`, `VERCEL_ENV`, `VERCEL_REGION`, `VERCEL_URL`); exporta la lista de nombres. `/api/salud` la valida: ausente o mal formada → 503 `{"estado":"error"}`; fuera de `desarrollo`, `VERCEL_REGION` distinta de `arn1` → 503; con alguna `VERCEL*`, `desarrollo` no vale. `instrumentation.ts`, punto 4 (fuera de `desarrollo`, `console.*` → `{nivel, codigo: "salida_no_estructurada"}` sin argumentos) | REQ-005 (parte), REQ-011, REQ-019 · CA-006 (parte), CA-012 (parte), CA-021 | T-004 | `ingeniero-backend` | `tests/unit/plataforma/configuracion.test.ts`: cada variable ausente o mal formada da su código y nunca su valor; sin valores por defecto. PRUEBA-012 (parte L): sin `VERCEL_REGION` o con `desarrollo` en la plataforma, 503. PRUEBA-044 (parte L): 503 con configuración inválida. `tests/unit/plataforma/instrumentacion.test.ts`: un `console.log` con valor marcado no lo emite | `src/lib/plataforma/{configuracion,region}.ts`, `src/app/api/salud/route.ts`, `src/instrumentation.ts`, sus pruebas | C | hecha |
| T-006 | Lista de variables por entorno, sin valores: `.env.example` solo con los nombres de `configuracion.ts` que pone una persona (las de otras funciones las añade cada una con su configuración; desaparecen las de fase 0 y la región `eu-central-1`); `docs/operacion/entornos.md`: variable × entorno (`desarrollo`, `preproduccion`, `produccion`), quién la pone, si es secreta, dónde vive, sin valores | REQ-011, REQ-012 · CA-012, CA-013 (partes) | T-005 | `plataforma` | PRUEBA-028 (parte L): `tests/unit/plataforma/entornos.test.ts`: los nombres de `.env.example`, de la lista exportada por `configuracion.ts` y de `entornos.md` coinciden; ningún valor (también lo exige `arnes`); un `.env.example` con un valor hace fallar `verificar` | `.env.example`, `docs/operacion/entornos.md`, su prueba | C, Res. | hecha |

## Bloque 3 · Base de datos en local (bloqueado por R-1)

No empieza sin la decisión R-1 del responsable (artículo 5). Nada se aplica a `Nido` ni a otro proyecto de Supabase. Reglas: `.claude/rules/bd.md`.

| ID | Tarea | Requisitos · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-007 `[P]` | Migración base `supabase/migrations/0001_base.sql`: secciones 1 a 10 de `docs/MODELO-DATOS.sql` sin cambios de contenido, con cabecera de origen y huella SHA-256 del modelo; RLS en la misma migración que cada tabla. Reversión `supabase/reversiones/0001_base.sql`, en orden inverso. `aislamiento` añade `&& node scripts/probar-modelo.mjs supabase/migrations/0001_base.sql`. Nombre de archivo para la CLI de Supabase: VERIFICAR en la 003 | Fuera de los REQ de la 002 (R-1) | T-003, R-1 | `ingeniero-bd` | PRUEBA-056: todos los casos de `probar-modelo.mjs` SUPERADA sobre la migración. PRUEBA-057: `supabase/tests/pglite/reversion.test.ts`, aplicar → revertir (no queda objeto de la migración en `public` ni `privado`) → aplicar → aislamiento en verde | `supabase/migrations/0001_base.sql`, `supabase/reversiones/0001_base.sql`, `supabase/tests/pglite/`, `package.json` (solo `aislamiento`) | C, Res. | bloqueada |
| T-008 | Pruebas pgTAP de la migración base: acceso cruzado entre dos clientes en cada tabla, RLS activado en todas, funciones del conector solo para su rol, `versiones_prompt` y `auditoria` de solo inserción, ninguna entrada con identificador de cliente | Fuera de los REQ de la 002 (R-1) | T-007 | `ingeniero-bd` | PRUEBA-058: escritas, **NO EJECUTADAS** hasta el CI de la 003; la cierran `revisor` y `auditor-seguridad` comprobando que cada caso tiene su equivalente en PRUEBA-056 | `supabase/tests/0001_aislamiento.test.sql` | C | bloqueada |

## Bloque 4 · Guía y comprobación del camino corto

| ID | Tarea | Requisitos · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-009 | `docs/operacion/GUIA.md`, apartado «Trabajo local»: requisitos (Node 26, npm 11), `npm ci --ignore-scripts`, `npm run dev`, `npm run verificar` y qué hace cada orden; el procedimiento de diseño §Integración contado para el responsable (qué recibe al pedirle el «sí», cómo mirar `git log --first-parent main`, cómo se vuelve atrás). Sin secretos | REQ-006, REQ-009, REQ-020 (parte) · CA-010, CA-022 (parte) | T-006 | `plataforma` | PRUEBA-024 (parte): seguir la guía al pie de la letra en un clon temporal da `verificar` en verde. PRUEBA-048 (parte L): la guía no contiene valores; `arnes` en verde | `docs/operacion/GUIA.md` | R, Res. | hecha |
| T-010 | Comprobación del camino corto en un clon limpio de `main`, con evidencias | REQ-006, REQ-007, REQ-008, REQ-009 · CA-007, CA-008, CA-009 (partes), CA-010 | T-009, T-011, T-012 (y T-008 si no está bloqueada) | `qa` | PRUEBA-059 y PRUEBA-024 completa (las dos reformuladas el 21/11/2026, abajo); repite PRUEBA-055 y mide la duración de `verificar` | `specs/002-plataforma-base/evidencias/T-010/` | R | pendiente: 1.ª pasada (20/11/2026, `d852217`) NO superada (`evidencias/T-010/informe.md`); repetición tras T-011 y T-012, ver «Repetición de T-010» |

## Bloque 5 · Correcciones tras la 1.ª pasada de T-010 (coordinación, D-036, 21/11/2026)

| ID | Tarea | Requisitos · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-011 `[P]` | `docs/operacion/GUIA.md` según PRUEBA-024 reformulada: en desarrollo se arranca con `npm run dev`; `npm run start` (fija `NODE_ENV=production`) solo con un entorno no de desarrollo ficticio, con los nombres de `configuracion.ts` y sin ningún valor con forma de secreto ni de DSN (que `/api/salud` dé 503 con `ENTORNO=desarrollo` tras `start` es el cierre en fallo previsto y se dice así). Línea 79: anota `f9f0494` (T-001) como primer commit integrado por este procedimiento y que la carpeta completa es obligatoria desde `0d8fd6d` (T-005); T-001 a T-004 con evidencia mínima a posteriori; excepciones admitidas: `12044a1` (T-002 y T-003). Autorización: `docs/operacion/**` queda autorizada para esta tarea por D-036 (21/11/2026), con `plataforma` y `revisor` | REQ-009, REQ-020 (parte) · CA-010, CA-022 (parte) | T-009 | `plataforma` | `tests/unit/plataforma/guia.test.ts` en rojo antes del cambio: la guía nombra `npm run start` solo junto a un entorno distinto de `desarrollo` y `VERCEL_REGION`; contiene `f9f0494` y `0d8fd6d`; ya no contiene «su hash se anota aquí cuando exista»; conserva «primer commit integrado por este procedimiento»; `buscarSecretos` vacío. `arnes` en verde | `docs/operacion/GUIA.md`, `tests/unit/plataforma/guia.test.ts` | R, Res. | pendiente |
| T-012 `[P]` | Evidencias a posteriori en `main`: `evidencias/T-NNN/` con `verificar.md`, `revision.md`, `aprobacion.md` y, si fue crítica, `dictamen.md` para T-001 a T-006 y T-009. Fuentes: mensaje del commit (`git log --first-parent main`), fila de esta tabla y `specs/001-conector-prueba-real/relevo-paralelo.md`; cada dato cita su fuente; «no consta» donde falte; nada inventado (art. 13). `aprobacion.md`: la constancia «aprobado por delegación D-036» del mensaje del commit, copiada literal con su hash; en T-001 a T-004, «no consta» si el mensaje no la lleva. T-002 y T-003: una carpeta cada una, las dos apuntan a `12044a1` | REQ-006, REQ-008 · CA-007, CA-009 (partes) | — | `plataforma` | PRUEBA-059 reformulada, parte de existencia: el recorrido del paso 6 sobre `main` da OK para T-001 a T-006 y T-009; el `revisor` coteja cada dato con `git log` y marca como bloqueante cualquiera sin fuente. `arnes` en verde | `specs/002-plataforma-base/evidencias/T-00{1,2,3,4,5,6,9}/` | R | pendiente |

Hallazgo ajeno (no se arregla aquí): `tests/unit/diseno/acceso-muestra.test.ts` agota los 30 s bajo la carga de la ejecución completa (5 de 7 pasadas; solo, 8,6 s). Dueño: función 020 (Fase 3 d). Hasta que lo corrija, un rojo solo por ese archivo en `verificar` se repite con la orden de abajo antes de darlo por fallo.

### Repetición de T-010 (pendiente)

`qa`, en un clon limpio de `main` tras integrar T-011 y T-012: `npm ci --ignore-scripts`; `npx vitest run --maxWorkers=3` (o `--maxWorkers=1 --testTimeout=60000 --hookTimeout=60000`) en verde, y `tipos`, `estilo`, `aislamiento`, `arnes` y `build` con salida 0, cada uno por separado; PRUEBA-059 y PRUEBA-024 reformuladas; PRUEBA-055 de nuevo, con el paso del defecto ejecutado solo cuando la cadena no llegue a él (anotado así). Evidencias nuevas en `evidencias/T-010/` sin borrar las de la 1.ª pasada.

## Pruebas nuevas

Se suman al mapa de diseño (PRUEBA-001 a 054). L: local.

| Prueba | Qué comprueba | Dónde |
| --- | --- | --- |
| PRUEBA-055 | `verificar` cierra en fallo: en un clon temporal, un solo defecto cada vez (error de tipos, `process.env` fuera de `configuracion.ts`, prueba fallida, `.only`, ninguna prueba, una política de RLS quitada en una copia del SQL, canario de secreto compuesto en ejecución, compilación rota) da salida distinta de 0 (8 de 8) y el canario no aparece en la salida; sin defectos, 0 | L |
| PRUEBA-056 | Aislamiento entre clientes sobre la migración base en PGlite (casos de `probar-modelo.mjs`: conector, órdenes, suspensión, usuario A, usuario B, superadmin, anónimo, solo inserción) | L |
| PRUEBA-057 | Reversión de la migración base: aplicar → revertir → aplicar en PGlite | L |
| PRUEBA-058 | pgTAP contra Supabase real. NO EJECUTADA hasta el CI de la 003 | CI |
| PRUEBA-059 | Historial integrado (reformulada el 21/11/2026 por D-036, que sustituyó el «sí» por tarea de D-025): cada commit de `main` de la 002 lleva `T-NNN (002): `; desde T-005 (0d8fd6d) la aprobación consta en su mensaje («aprobado por delegación D-036»); para T-001 a T-004 (anteriores o contemporáneos de la delegación) se anota «no consta» en su evidencia a posteriori, sin exigir esa frase. Los commits de menores (03b82c0, 5a1b9ab) se admiten dentro de la carpeta de su tarea. Desde T-005, su carpeta `evidencias/T-NNN/` con `verificar.md` (sobre ese árbol), `revision.md`, `aprobacion.md` y, si es crítica, `dictamen.md` es obligatoria. T-001 a T-004: evidencia mínima a posteriori con lo que consta en `git log` y en esta tabla, «no consta» donde falte (art. 13; T-012). Se admite que T-002 y T-003 compartan `12044a1`; `03b82c0` (menores de T-003) se admite igual (D-036, 21/11/2026). Se mantiene: en un clon temporal, un commit añadido sin `aprobacion.md` lo detecta el recorrido de diseño §Integración, paso 6. La autoría no se puede comprobar técnicamente hasta las firmas (asunto A-4) | L |

PRUEBA-024 completa (T-010; reformulada el 21/11/2026 por D-036): en el clon limpio, `npm ci --ignore-scripts` y `verificar` (con el criterio de «Repetición de T-010»). En desarrollo se arranca con `npm run dev`. `npm run start` solo se prueba con un entorno no de desarrollo ficticio (`ENTORNO` distinto de `desarrollo`, `VERCEL_REGION=arn1` y el resto de nombres de `configuracion.ts` con valores ficticios puestos en el entorno del proceso, nunca en un archivo del repositorio ni en una evidencia), como en la 1.ª pasada (7 de 7), y peticiones con `fetch` de Node: `/` 200 con `lang="es"`; ruta inexistente 404; `POST /` sin 2xx; `/api/salud` 200 con cuerpo exacto; `POST /api/salud` 405. Que `ENTORNO=desarrollo` con `NODE_ENV=production` cierre en fallo (503 en `/api/salud`) es correcto y no se toca.

## Requisitos sin tarea en este plan

Destino a decidir por el responsable (`plan.md`, R-3). No se dan por cubiertos.

| REQ | Qué falta |
| --- | --- |
| REQ-001 | Copia diaria fuera del disco, restauración y remoto |
| REQ-002 a REQ-005 | Batería de 10 comprobaciones, Gitleaks, dependencias, región en `vercel.json`, purga y `buscar-valor` (T-003 y T-005 cubren una parte) |
| REQ-007, REQ-008 | Firmas y comprobación 10 automática (aplazadas a la 003: diseño §Aplazado a la 003) |
| REQ-010 | Proyectos `pre-nido` y `nido`, DNS en Axarnet |
| REQ-012 | Credenciales en DPAPI y CLI aislada |
| REQ-013 | Verificaciones con fecha |
| REQ-014 a REQ-018 | Ventana, despliegue, producción (aplazada: R-4), vuelta atrás desplegada, supervisión y avisos |
| REQ-019, REQ-020 | Diagnósticos, Sentry y el resto de la guía y el registro |

## Escalados

Tareas que han subido de nivel de modelo o de esfuerzo, y por qué (`docs/EQUIPO.md`).

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
