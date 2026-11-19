# 001 · Tareas

Autor: `arquitecto` (opus) · 19/11/2026 · Camino corto por D-025. Fuente: `diseno.md` (cuarta versión). Orden, frontera con la 002, cobertura, acciones de una persona (`AR-`) y decisiones pendientes (`DP-`): `plan.md`. Sustituye a las tareas de las 20:12 (historial de git).

Cada tarea es pequeña, tiene un solo agente responsable y una prueba que dice cuándo está hecha. `[P]` marca las que pueden ir en paralelo porque no comparten archivos (con sus dependencias cumplidas). «002·T-nnn» es una tarea de la 002.

Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Rama y puerta** (002 diseño §Integración; `plan.md`, «Integración»): `tarea/T-1NN`; prueba en su commit y en rojo, después el código; `npm run verificar` por el orquestador; `revisor`; `auditor-seguridad` si RC es `C`; «sí» del responsable (AR-17); `merge --squash` con `T-1NN (001): …`.
- **Prueba primero.** Canarios y valores marcados, compuestos en ejecución. «Parte»: la tarea cubre ese caso; la prueba entera la cierran todas sus tareas.
- **Rutas**: `sql` = `supabase/conector-prueba/001_estado.sql`; `bd/` = `supabase/conector-prueba/`; `tu/` = `tests/unit/conector/`; `ta/` = `tests/conector/`; `tp/` = `tests/unit/plataforma/`; `mcp/` = `src/mcp/`; `oauth/` = `src/lib/oauth/`; `sb/` = `src/lib/supabase/`; `sc/` = `scripts/conector/`; `ev/` = `evidencias/` de esta función; «test» = la prueba de la tarea en `tu/`.
- **RC**: `C` = `revisor` y `auditor-seguridad` sobre el código; `R` = solo `revisor`. **Res.**: reservada; el «sí» la nombra.
- **Vuelta atrás**: `git revert` por el mismo camino; SQL ya aplicado en `Nido`, además la reversión por una persona (`LEEME.md`); despliegue, la de T-153.
- `JSON.parse` y `new URL` sobre entradas, solo en los dos `entrada.ts`; cada `route.ts` usa `manejador.ts`. Pruebas L: credenciales de la persona, nunca impresas.
- **Lo hace una persona** (`AR-`; D-019): cuentas, proyectos, variables, contraseñas, credencial de operación, despliegue, OAuth real con Claude.

## Bloque 1 · Base del conector

| ID | Tarea | REQ · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-101 `[P]` | Dependencias exactas de diseño §Dependencias nuevas, con fecha (7 días o más) y licencia verificadas; detalle en `plan.md`, «T-101, dimensionada» | REQ-001, REQ-009 · CA-001, CA-009 | 002·T-003 | `plataforma` | `tu/humo-sdk.test.ts` (V-1; PRUEBA-002, parte; V-4, parte); `npm audit` sin altas ni críticas | `package.json`, `package-lock.json`, test | C, Res. | pendiente |
| T-102 `[P]` | Escáner: `hia_a_`, `hia_r_` y `hia_op_` con 43 base64url; código de activación (12 Crockford en tres grupos) | REQ-015 · CA-015 | 002·T-003 | `plataforma` | PRUEBA-019 (parte: cada forma detectada sin imprimir el valor); `arnes` en verde | `scripts/patrones-secretos.mjs`, `tp/patrones-conector.test.ts` | C, Res. | pendiente |
| T-103 | C-1 y C-2 (diseño §Configuración; N-3): grupo «conector» en `configuracion.ts`; dos códigos nuevos; nombres en `.env.example` y `entornos.md` | REQ-014, REQ-019 · CA-014, CA-024 | 002·T-006 | `ingeniero-backend` | PRUEBA-018 (parte: cada variable ausente o mal formada, `?sslmode=disable`, `?options=…`, secreto corto → su código, nunca su valor); PRUEBA-021 (parte); `/api/salud` igual con el grupo inválido | `src/lib/plataforma/configuracion.ts`, `src/lib/registro/codigos.ts`, `.env.example`, `docs/operacion/entornos.md`, test | C, Res. | pendiente |
| T-104 `[P]` | Apoyo de la batería, fuera de `src/`: PGlite con `bd/*.sql` y roles de Supabase imitados como `probar-modelo.mjs`; reloj (también el de la base de datos); sumidero; doble de red; adaptador PGlite del almacén; fábrica de licencias, conexiones y tokens sembrados por HMAC (función inyectada) | REQ-010, REQ-015 · CA-010, CA-015 | 002·T-003 | `qa` | `ta/apoyo.test.ts`: el sumidero halla un valor sembrado (PRUEBA-019, parte); roles imitados sin privilegios (PRUEBA-022, parte); el reloj mueve `now()` | `ta/apoyo/**`, `ta/apoyo.test.ts` | C | pendiente |
| T-105 | `001_estado.sql` base (diseño §Datos): esquema, dos roles, revocaciones M-4, 12 tablas con RLS sin políticas; reversión; `semilla.sql` (A y B); `LEEME.md` (aplicar, revertir, contraseñas, paso 13 de N-1) | REQ-010, REQ-015, REQ-019 · CA-010, CA-015, CA-024 | T-104 | `ingeniero-bd` | PRUEBA-022 (B: aplicar → revertir → aplicar; roles sin tablas; roles de Supabase sin nada); PRUEBA-019 (parte: ninguna columna de token, código, dirección ni texto libre) | `sql`, `bd/{001_estado.reversion,semilla}.sql`, `bd/LEEME.md`, `tu/bd/esquema.test.ts` | C | pendiente |
| T-106 `[P]` | `raiz-supabase.crt` de la fuente oficial; URL, fecha y huella en `LEEME.md` (V-10) | REQ-014 · CA-014 | T-105 | `ingeniero-bd` | `tu/bd/raiz.test.ts`: CA autofirmada, vigente, con la huella anotada (PRUEBA-018, parte) | `bd/raiz-supabase.crt`, `bd/LEEME.md`, test | C | pendiente |
| T-107 `[P]` | `validar_acceso` y `registrar_suceso` (20 000 al día y un `registro_saturado`) | REQ-007, REQ-015 · CA-006, CA-015 | T-105 | `ingeniero-bd` | PRUEBA-011 (parte BD, con reloj: 5 min 1 s, tipo, recurso, revocada → falso); PRUEBA-019 (parte: suceso cerrado) | `sql`, `tu/bd/validar.test.ts` | C | pendiente |
| T-108 | `almacen.ts` (diseño §Datos, «Conexión»; adaptador inyectable) y `conector.ts` (rol mcp) | REQ-014 · CA-014 | T-103, T-106, T-107 | `ingeniero-backend` | PRUEBA-018 (parte: caído; 5 s; certificado no confiable → fallo sin consultar); solo `src/mcp/` importa `conector.ts` | `sb/{almacen,conector}.ts`, test | C | pendiente |
| T-109 `[P]` | `secretos.ts` (diseño §Tokens: HKDF, HMAC con tipo, par derivado, origen, tiempo constante) | REQ-008, REQ-015 · CA-007, CA-015 | T-103 | `ingeniero-backend` | PRUEBA-012 (parte: mil pares sin parte común; misma sal, mismo par); PRUEBA-019 (parte: sal sin secreto → 0 tokens) | `oauth/secretos.ts`, test | C | pendiente |
| T-110 | `sucesos.ts`: suceso tras responder; si falla, se descarta | REQ-015 · CA-015 | T-108 | `ingeniero-backend` | PRUEBA-019 (parte: marcados → 0 en sucesos y consola; el fallo no cambia la respuesta) | `src/lib/registro/sucesos.ts`, test | C | pendiente |
| T-111 `[P]` | `contratos.ts`: Ajv 2020-12 estricto, `uuid` propio; publicado sin `$schema`, `$id` ni `x-version-esquema`; tolera las `x-` vigentes | REQ-009 · CA-009 | T-101 | `ingeniero-backend` | PRUEBA-003 (parte: compilan; publicado = contrato) | `mcp/esquemas/contratos.ts`, test | C | pendiente |
| T-112 `[P]` | `0.1.md` y `arranque.md` desde `propuestas-diseno/textos-ficticios.md`; `prompts/` en `.prettierignore` si Prettier los cambiaría | REQ-012, REQ-018 · CA-012, CA-018 | 002·T-001 | `ingeniero-backend` | `tu/prompt-texto.test.ts`: marca, final `\n`, sin dirección ni URL (PRUEBA-016 y 019, partes); el `revisor` confirma el contenido permitido | `prompts/agente-prueba/{0.1,arranque}.md`, `.prettierignore`, test | C, Res. | pendiente |
| T-113 | `prompt-ficticio.ts`: lectura única, huella fijada en el código; distinta, ilegible o vacía → 503; reglas constantes | REQ-012 · CA-012 | T-103, T-112 | `ingeniero-backend` | PRUEBA-016 (B) | `mcp/prompt-ficticio.ts`, test | C | pendiente |

## Bloques 2 a 4 · Las tres herramientas, una a una

Cada herramienta cierra (función SQL, herramienta y su prueba en `main`) antes de empezar la siguiente.

| ID | Tarea | REQ · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-114 | `mcp_obtener_instrucciones` (diseño §Datos, «Reglas») | REQ-010, REQ-011 · CA-010, CA-011 | T-107 | `ingeniero-bd` | PRUEBA-015 (parte BD), PRUEBA-014 (parte: A no ve nada de B; B idéntico) | `sql`, `tu/bd/obtener.test.ts` | C | pendiente |
| T-115 | Herramienta `obtener_instrucciones` (diseño §Herramientas) | REQ-011, REQ-012, REQ-014 · CA-011, CA-012, CA-014 | T-108, T-111, T-113, T-114 | `ingeniero-backend` | PRUEBA-015 (tres estados; 0 marcas sin `activa`), PRUEBA-016 (→ 503), PRUEBA-018 (parte: caído → `error_temporal`) | `mcp/herramientas/obtener-instrucciones.ts`, `sb/conector.ts`, test | C | pendiente |
| T-116 | `mcp_enviar_informe` | REQ-010, REQ-013 · CA-010, CA-013 | T-114 | `ingeniero-bd` | PRUEBA-017 (parte BD), PRUEBA-007 (parte: 10 → 1 informe), PRUEBA-014 (parte) | `sql`, `tu/bd/informe.test.ts` | C | pendiente |
| T-117 `[P]` | `sanear-informe.ts` (diseño §Herramientas) | REQ-013 · CA-013 | T-111 | `ingeniero-backend` | PRUEBA-017 (parte: `campos_descartados: 3`, 0 apariciones, `__proto__`, `constructor`) | `mcp/esquemas/sanear-informe.ts`, test | C | pendiente |
| T-118 | Herramienta `enviar_informe` | REQ-013 · CA-013 | T-115, T-116, T-117 | `ingeniero-backend` | PRUEBA-017 (herramienta), PRUEBA-007 (parte: 10 → 1 `guardado`) | `mcp/herramientas/enviar-informe.ts`, `sb/conector.ts`, test | C | pendiente |
| T-119 | `mcp_confirmar_orden` | REQ-010, REQ-011, REQ-013 · CA-010, CA-011, CA-013 | T-116 | `ingeniero-bd` | PRUEBA-007 (parte: 10 → 1 `confirmada`), PRUEBA-015 (parte), PRUEBA-014 (parte) | `sql`, `tu/bd/confirmar.test.ts` | C | pendiente |
| T-120 | Herramienta `confirmar_orden` | REQ-011, REQ-013 · CA-011, CA-013 | T-118, T-119 | `ingeniero-backend` | PRUEBA-007 (parte), PRUEBA-017 (parte) | `mcp/herramientas/confirmar-orden.ts`, `sb/conector.ts`, test | C | pendiente |

## Bloque 5 · Punto MCP

| ID | Tarea | REQ · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-121 | `servidor.ts` y `salida.ts` (diseño §Punto MCP, pasos 8 y 9) | REQ-001, REQ-009, REQ-013 · CA-001, CA-009, CA-013 | T-120 | `ingeniero-backend` | PRUEBA-003 (listado = contratos; salidas válidas; distinto de 3 → 500), PRUEBA-002 (parte: dos épocas) | `mcp/{servidor,salida}.ts`, test | C | pendiente |
| T-122 | `src/mcp/entrada.ts` y `src/app/api/mcp/route.ts` (pasos 1 a 7 y 10); `src/mcp/entrada.ts`, excepción de la regla de `JSON.parse` | REQ-001, REQ-007, REQ-014 · CA-001, CA-006, CA-014 | T-109, T-110, T-121, 002·T-004 | `ingeniero-backend` | PRUEBA-011, PRUEBA-001 (parte: reto), PRUEBA-002 (405), PRUEBA-017 (parte: lotes, sin eco), PRUEBA-018 (parte: 413, 503) | `mcp/entrada.ts`, `src/app/api/mcp/route.ts`, `eslint.config.mjs`, test | C, Res. | pendiente |
| T-123 | C-4: trazar `prompts/agente-prueba/`, `contratos/` y `bd/raiz-supabase.crt` en las rutas del conector; `headers()` no se toca | REQ-009, REQ-012 · CA-009, CA-012 | T-122 | `plataforma` | PRUEBA-016 (parte V-3: la traza de `next build` los incluye) | `next.config.ts`, `tp/trazado.test.ts` | C, Res. | pendiente |

## Bloque 6 · Autorización OAuth y operación

| ID | Tarea | REQ · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-124 | `leer_cliente`, `guardar_cliente_cimd`, `registrar_cliente_dcr` (límites, purga) | REQ-003 · CA-003 | T-119 | `ingeniero-bd` | PRUEBA-005 (parte BD) | `sql`, `tu/bd/clientes.test.ts` | C | pendiente |
| T-125 | `abrir_solicitud`, `activar` (una transacción; bloqueo por origen) | REQ-004, REQ-014 · CA-004, CA-014 | T-124 | `ingeniero-bd` | PRUEBA-006 (parte BD), PRUEBA-007 (10 → 1 conexión), PRUEBA-018 (parte: fallo → solo recuento) | `sql`, `tu/bd/activar.test.ts` | C | pendiente |
| T-126 | `canjear_codigo`, `renovar` | REQ-003, REQ-006, REQ-008 · CA-003, CA-007 | T-125 | `ingeniero-bd` | PRUEBA-012 (parte BD, con reloj), PRUEBA-005 (doble canje) | `sql`, `tu/bd/tokens.test.ts` | C | pendiente |
| T-127 | `operar_*`, `operar_contar_fallo`, `cerrar_prueba` terminal | REQ-006, REQ-017, REQ-019 · CA-008, CA-017, CA-024 | T-126 | `ingeniero-bd` | PRUEBA-020 (parte BD), PRUEBA-013, PRUEBA-023 (B) | `sql`, `tu/bd/operar.test.ts` | C | pendiente |
| T-128 `[P]` | `callbacks.ts`, `metadatos.ts` y rutas `.well-known`; CIMD en `false` sin URL comprobada | REQ-001, REQ-003 · CA-001, CA-003 | T-123 | `ingeniero-backend` | PRUEBA-001 (V-2; CAD-002; `no-store`; 503 sin configuración; `Host` falso sin efecto) | `oauth/{callbacks,metadatos}.ts`, `src/app/.well-known/**`, test | C | pendiente |
| T-129 `[P]` | `cimd.ts` (lista vacía sin V-6) | REQ-003 · CA-003 | T-128 | `ingeniero-backend` | PRUEBA-005 (parte: 0 peticiones fuera de la lista) | `oauth/cimd.ts`, test | C | pendiente |
| T-130 `[P]` | `pantalla.ts`; revisa `disenador-ui` | REQ-005 · CA-005 | T-128 | `ingeniero-frontend` | PRUEBA-009 (B: sin JavaScript, `state` escapado, estados, CSP), PRUEBA-010 (parte automática) | `oauth/pantalla.ts`, test | C | pendiente |
| T-131 `[P]` | `origen.ts` | REQ-004 · CA-004 | T-109, T-123 | `ingeniero-backend` | PRUEBA-006 (parte: sin cabecera fuera de local → rechazo sin evaluar) | `oauth/origen.ts`, test | C | pendiente |
| T-132 | `autorizacion.ts` (rol de gestión) | REQ-014 · CA-014 | T-108, T-127 | `ingeniero-backend` | PRUEBA-018 (parte: caído en cada función) | `sb/autorizacion.ts`, test | C | pendiente |
| T-133 | `clientes.ts` y `/oauth/registro` | REQ-003 · CA-003 | T-129, T-131, T-132 | `ingeniero-backend` | PRUEBA-005 (DCR) | `oauth/clientes.ts`, `src/app/oauth/registro/route.ts`, test | C | pendiente |
| T-134 | `peticion.ts` y `GET /oauth/autorizar` | REQ-003, REQ-005 · CA-003, CA-005 | T-130, T-133 | `ingeniero-backend` | PRUEBA-005 (sin redirigir; `state` e `iss`), PRUEBA-009 (parte: solicitud y cookie) | `oauth/peticion.ts`, `src/app/oauth/autorizar/route.ts`, test | C | pendiente |
| T-135 | `activacion.ts` y `POST /oauth/autorizar` | REQ-004, REQ-005, REQ-006, REQ-014 · CA-004, CA-005, CA-014 | T-134 | `ingeniero-backend` | PRUEBA-006, PRUEBA-009 (`Origin` ajeno o `null` sin contar intento), PRUEBA-018 (parte: no disponible) | `oauth/activacion.ts`, `src/app/oauth/autorizar/route.ts`, test | C | pendiente |
| T-136 | `tokens.ts` y `/oauth/token` | REQ-003, REQ-007, REQ-008, REQ-014 · CA-003, CA-006, CA-007, CA-014 | T-135 | `ingeniero-backend` | PRUEBA-012, PRUEBA-005 (PKCE), PRUEBA-011 (parte), PRUEBA-018 (parte: emitir y renovar) | `oauth/tokens.ts`, `src/app/oauth/token/route.ts`, test | C | pendiente |
| T-137 `[P]` | `operaciones.ts` y `POST /api/operacion` | REQ-017, REQ-019 · CA-017, CA-024 | T-131, T-132 | `ingeniero-backend` | PRUEBA-020, PRUEBA-021 (404 antes de leer), PRUEBA-023 (parte B) | `src/lib/licencias/operaciones.ts`, `src/app/api/operacion/route.ts`, test | C | pendiente |
| T-138 | `operar.mjs` y `npm run operar` (C-3 sin carpeta sellada: la persona, desde un clon limpio de `main`; solo `preproduccion`) | REQ-015, REQ-017 · CA-015, CA-017 | T-137 | `plataforma` | PRUEBA-020 (parte: sin eco ni guardado; otro entorno, rechazo antes de pedir la credencial) | `sc/operar.mjs`, `package.json`, `tp/operar.test.ts` | C, Res. | pendiente |
| T-139 | `ciclo-local.mjs` (`npm run conector:ciclo`; tokens solo en memoria) | REQ-001, REQ-006 · CA-001, CA-008 | T-136, T-138 | `plataforma` | PRUEBA-004 (parte: salida sin tokens ni código) | `sc/ciclo-local.mjs`, `package.json`, `tp/ciclo.test.ts` | C, Res. | pendiente |
| T-140 | `pruebas-bd.mjs` y `comprobar-conector.mjs` (`conector:comprobar`: metadatos, reto, 405, cabeceras, `arn1`, V-3) | REQ-001, REQ-002, REQ-015 · CA-001, CA-002, CA-015 | T-139 | `plataforma` | PRUEBA-019 (parte: sin URL ni credencial en la salida), PRUEBA-001 (parte, en local) | `sc/{pruebas-bd,comprobar-conector}.mjs`, `package.json`, `tp/conector.test.ts` | C, Res. | pendiente |
| T-141 | Inventario de rutas y cabeceras de la 001 contra `next start` (`same-origin` solo en `/oauth/autorizar`) | REQ-005 · CA-005 | T-136, T-137 | `qa` | PRUEBA-009 (parte); PRUEBA-025 de la 002 en verde | `tests/plataforma/inventario-rutas-001.json`, `tp/inventario-001.test.ts` | C | pendiente |

## Bloques 7 y 8 · Transversales en local y `Nido`

| ID | Tarea | REQ · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-142 `[P]` | A, B y dos conexiones de A por HTTP en proceso | REQ-006, REQ-010 · CA-008, CA-010 | T-141 | `qa` | PRUEBA-014 (CAD-015 entero; B idéntico), PRUEBA-013 | `ta/aislamiento.test.ts` | C | pendiente |
| T-143 `[P]` | Fallos y huella | REQ-012, REQ-014 · CA-012, CA-014 | T-141 | `qa` | PRUEBA-018 (cada paso, variable y punto), PRUEBA-016 (antes y después de operaciones y hostiles) | `ta/fallos.test.ts` | C | pendiente |
| T-144 `[P]` | Entradas hostiles y valores marcados | REQ-013, REQ-015 · CA-013, CA-015 | T-141 | `qa` | PRUEBA-017, PRUEBA-019 (también en `id`; copia del estado → 0 tokens) | `ta/hostiles.test.ts` | C | pendiente |
| T-145 `[P]` | Ciclo completo con el cliente oficial (RD-079) | REQ-001 · CA-001 | T-141 | `qa` | PRUEBA-004 (B), PRUEBA-002 (2 de 2), PRUEBA-001 (CAD-002) | `ta/ciclo.test.ts` | C | pendiente |
| T-146 `[P]` | WCAG 2.2 AA de la pantalla | REQ-005 · CA-005 | T-135 | `disenador-ui` | PRUEBA-010 (V: 0 bloqueantes; 360 px; contraste; teclado) | `ev/T-146/wcag.md` | R | pendiente |
| T-147 | Pruebas L en `Nido` (`npm run pruebas-bd`) | REQ-002, REQ-004, REQ-008, REQ-010, REQ-013, REQ-014 · CA-002, CA-004, CA-007, CA-010, CA-013, CA-014 | T-140, T-142 a T-145, AR-05 | `qa` | PRUEBA-022 (L; ajenas a `PUBLIC` → AR-14), PRUEBA-008 (6543, 10 a la vez), PRUEBA-018 (L), PRUEBA-047 (parte: `eu-north-1`); V-5, V-10, V-107 | `ev/T-147/` | C | pendiente |
| T-148 | Ciclo con el cliente oficial contra `Nido` | REQ-001 · CA-001 | T-147 | `qa` | PRUEBA-004 (L) | `ev/T-148/` | C | pendiente |
| T-149 | La contraseña local ya no conecta tras revertir y reaplicar | REQ-015 · CA-015 | T-148, AR-06 | `qa` | PRUEBA-022 (L, parte) | `ev/T-149/` | C | pendiente |

## Bloque 9 · Contratos y despliegue en Vercel (`arn1`)

| ID | Tarea | REQ · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-150 `[P]` | Contratos (diseño §Contratos): `readOnlyHint: false`, fuera `x-cuestion-abierta`, dos `description` | REQ-009, REQ-011 · CA-009 | **AR-01** | `arquitecto` | PRUEBA-003 en verde con los nuevos; `comprobar-specs` | `contratos/{obtener-instrucciones,informe}.schema.json` | C | **bloqueada** |
| T-151 `[P]` | `vercel.json` y `.vercelignore` (002 diseño §Batería, «Región»): `regions` `["arn1"]`, sin conmutación ni regiones en `functions`, `installCommand` `npm ci --ignore-scripts` | REQ-002 · CA-002 | 002·T-003 | `plataforma` | `tp/region.test.ts`: casos de archivo de «Región» (PRUEBA-012 de la 002, parte) | `vercel.json`, `.vercelignore`, test | C, Res. | pendiente |
| T-152 | `supervision.ts` (002 diseño §Supervisión) con los códigos de C-2 | REQ-014, REQ-015 · CA-014, CA-015 | T-103, **DP-2** | `ingeniero-backend` | PRUEBA-046 de la 002 (evento cerrado con valores marcados; fallo sin bloqueo), con doble de red | `src/lib/plataforma/supervision.ts`, test | C | **bloqueada** |
| T-153 | Procedimiento de despliegue y vuelta atrás de preproducción para la persona: clon limpio de `main`, CLI de Vercel verificada (versión, opciones, fuente), `COMMIT_DESPLEGADO`, sin `--regions`, `vercel rollback`; nombres de variables, nunca valores | REQ-002, REQ-019 · CA-002, CA-024 | T-151, **DP-1** | `plataforma` | Revisión: cada orden con fuente oficial; ningún valor; `arnes` en verde | `docs/operacion/despliegue-preproduccion.md` | C, Res. | **bloqueada** |
| T-154 | Primer despliegue en `pre-nido`: **lo hace una persona** (AR-06, AR-07); el agente comprueba desde fuera. Vuelta atrás: dos despliegues del mismo commit, `rollback` al primero y vuelta | REQ-001, REQ-002, REQ-019 · CA-001, CA-002, CA-024 | T-146, T-149, T-150, T-152, T-153, AR-02, AR-06, AR-07 | `plataforma` | `conector:comprobar`: PRUEBA-047 (`arn1`), PRUEBA-001 (V), V-3; PRUEBA-013 y 027 de la 002; vuelta atrás en 10 min | `ev/T-154/` | C | pendiente |
| T-155 | Antes del paso 3: V-6 y navegador real (AR-16) | REQ-004, REQ-005 · CA-004, CA-005 | T-154, AR-16 | `qa` | PRUEBA-009 (R: GET y POST), PRUEBA-006 (V-6) | `ev/T-155/` | C | pendiente |

## Bloque 10 · Prueba real con Claude Max (`qa` anota; ejecuta la persona)

| ID | Tarea | REQ · CA | Depende de | Agente | Prueba (primero) | Archivos | RC | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-156 `[P]` | Guion fechado (pasos 1 a 13 con su CA; ChatGPT «no ejecutado»), `calendario.md` (documento normal; AR-08) y plantillas de resultados | REQ-016, REQ-019, REQ-020 · CA-024, CA-025 | — | `qa` | PRUEBA-053 (parte: fechado; 0 pasos sin CA) | `guion-prueba.md`, `calendario.md`, `resultados/` | R | pendiente |
| T-157 `[P]` | ADR desde `propuestas-diseno/adr-borrador-autorizacion-del-conector.md` | REQ-003, REQ-008 · CA-003, CA-007 | — | `arquitecto` | `comprobar-specs` sin errores; revisión | `docs/adr/` | R | pendiente |
| T-158 | Preparación y pasos 1 y 2 | REQ-016, REQ-018 · CA-016, CA-018 | T-156, AR-03, AR-04, AR-08 | `qa` | PRUEBA-049, PRUEBA-048 (inventario) | `ev/T-158/`, `resultados/` | R | pendiente |
| T-159 | Pasos 3 a 5 (alta y activación en Claude: AR-11) | REQ-001, REQ-004, REQ-009 · CA-009, CA-021, CA-025 | T-155, T-158, AR-11 | `qa` | PRUEBA-040, PRUEBA-041 (inicio) | `ev/T-159/`, `resultados/` | R | pendiente |
| T-160 | Pasos 6 a 8 | REQ-011, REQ-018, REQ-020 · CA-011, CA-018, CA-020, CA-021, CA-022 | T-159, AR-09 | `qa` | PRUEBA-042, PRUEBA-049 (paso 7), PRUEBA-045 | `ev/T-160/`, `resultados/` | R | pendiente |
| T-161 | Pasos 9, 10 y 12 | REQ-007, REQ-008, REQ-018, REQ-020 · CA-016, CA-019, CA-022, CA-023 | T-160 | `qa` | PRUEBA-043, 044, 050 y 048 (diaria) | `ev/T-161/`, `resultados/` | R | pendiente |
| T-162 | Paso 11 | REQ-006 · CA-008 | T-160, AR-11 | `qa` | PRUEBA-046 | `ev/T-162/`, `resultados/` | R | pendiente |
| T-163 | Paso 13 | REQ-009, REQ-019 · CA-009, CA-024 | T-161, T-162, AR-10, AR-12 | `qa` | PRUEBA-052, PRUEBA-023 (tras redesplegar: todo 503, 0 sesiones, despliegue anterior sin `emitido`, contraseña antigua sin conexión), PRUEBA-041 (final) | `ev/T-163/`, `resultados/` | C | pendiente |
| T-164 | Resultados y conclusiones (RD-028, RD-067, RD-073, V-101 a V-104) | REQ-015, REQ-016, REQ-020 · CA-015, CA-016, CA-025 | T-163 | `qa` | PRUEBA-051, PRUEBA-053 | `resultados/` | R | pendiente |

## Escalados

Tareas que han subido de nivel de modelo o de esfuerzo, y por qué (`docs/EQUIPO.md`).

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
