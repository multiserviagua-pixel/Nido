# 001 · Tareas

Autor: `arquitecto` (opus) · 20/11/2026 · Reagrupación por D-029 de las 64 tareas del 19/11 (historial de git) en 19, con el mismo alcance, las mismas pruebas, dependencias y RC. Fuente: `diseno.md` (cuarta versión). Orden, frontera con la 002, cobertura, acciones de una persona (`AR-`) y decisiones pendientes (`DP-`): `plan.md`. Equivalencias con la numeración antigua: al final.

Cada tarea tiene un solo agente responsable y las pruebas que dicen cuándo está hecha. `[P]` marca las que pueden ir en paralelo porque no comparten archivos (con sus dependencias cumplidas). «002·T-nnn» es una tarea de la 002.

Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Agrupación (D-029).** Cada tarea tiene partes (a), (b)…, que se hacen en ese orden; cada parte, con su prueba en rojo en su commit antes que su código. Por tarea: un `npm run verificar`, una revisión, un dictamen si es `C` y un «sí». Relevo solo al cerrar un bloque o al llegar al tope de contexto.
- **Rama y puerta** (002 diseño §Integración; `plan.md`, «Integración»): `tarea/T-1NN`; `npm run verificar` por el orquestador; `revisor`; `auditor-seguridad` si RC es `C`; «sí» del responsable (AR-17); `merge --squash` con `T-1NN (001): …`.
- **Prueba primero.** Canarios y valores marcados, compuestos en ejecución. «Parte»: la parte cubre ese caso; la prueba entera la cierran todas sus partes.
- **Rutas**: `sql` = `supabase/conector-prueba/001_estado.sql`; `bd/` = `supabase/conector-prueba/`; `tu/` = `tests/unit/conector/`; `ta/` = `tests/conector/`; `tp/` = `tests/unit/plataforma/`; `mcp/` = `src/mcp/`; `oauth/` = `src/lib/oauth/`; `sb/` = `src/lib/supabase/`; `sc/` = `scripts/conector/`; `ev/` = `evidencias/` de esta función. Sin ruta, la prueba de cada parte va en `tu/`.
- **RC**: `C` = ruta crítica (diseño §Orden de construcción: pasos 1 a 7): `revisor` y `auditor-seguridad` sobre el código; `R` = solo `revisor`. **Res.**: reservada; el «sí» la nombra.
- **Vuelta atrás**: `git revert` por el mismo camino; SQL ya aplicado en `Nido`, además la reversión por una persona (`LEEME.md`); despliegue, la de T-117.
- `JSON.parse` y `new URL` sobre entradas, solo en los dos `entrada.ts`; cada `route.ts` usa `manejador.ts`. Pruebas L: credenciales de la persona, nunca impresas.
- **Lo hace una persona** (`AR-`; D-019): cuentas, proyectos, variables, contraseñas, credencial de operación, despliegue, OAuth real con Claude.
- **P1 parcial** (`plan.md`, «Aprobación», 19/11, con la numeración antigua «T-101 a T-149 y T-151») equivale a T-101 a T-114 de esta lista. T-115 a T-119, sin abrir.

## Bloque 1 · Base del conector

### T-101 `[P]` · Dependencias y escáner
`plataforma` · C, Res. · hecha · Depende de: 002·T-003 · REQ-001, REQ-009, REQ-015 · CA-001, CA-009, CA-015
- (a) Dependencias exactas de diseño §Dependencias nuevas, con fecha (7 días o más) y licencia verificadas; detalle en `plan.md`, «T-101, dimensionada». Prueba: `tu/humo-sdk.test.ts` (V-1; PRUEBA-002, parte; V-4, parte); `npm audit` sin altas ni críticas.
- (b) Escáner: `hia_a_`, `hia_r_` y `hia_op_` con 43 base64url; código de activación (12 Crockford en tres grupos). Prueba: `tp/patrones-conector.test.ts`, PRUEBA-019 (parte: cada forma detectada sin imprimir el valor); `arnes` en verde.
- Archivos: `package.json`, `package-lock.json`, `scripts/patrones-secretos.mjs`, pruebas.

### T-102 `[P]` · Apoyo de la batería
`qa` · C · hecha · Depende de: 002·T-003 · REQ-010, REQ-015 · CA-010, CA-015
- Fuera de `src/`: PGlite con `bd/*.sql` y roles de Supabase imitados como `probar-modelo.mjs`; reloj (también el de la base de datos); sumidero; doble de red; adaptador PGlite del almacén; fábrica de licencias, conexiones y tokens sembrados por HMAC (función inyectada). Prueba: `ta/apoyo.test.ts`: el sumidero halla un valor sembrado (PRUEBA-019, parte); roles imitados sin privilegios (PRUEBA-022, parte); el reloj mueve `now()`.
- Archivos: `ta/apoyo/**`, `ta/apoyo.test.ts`.

### T-103 · Esquema, validación y funciones SQL de las tres herramientas
`ingeniero-bd` · C · hecha · Depende de: T-102 · REQ-007, REQ-010, REQ-011, REQ-013, REQ-014, REQ-015, REQ-019 · CA-006, CA-010, CA-011, CA-013, CA-014, CA-015, CA-024
- (a) `001_estado.sql` base (diseño §Datos): esquema, dos roles, revocaciones M-4, 12 tablas con RLS sin políticas; reversión; `semilla.sql` (A y B); `LEEME.md` (aplicar, revertir, contraseñas, paso 13 de N-1). Prueba: `tu/bd/esquema.test.ts`, PRUEBA-022 (B: aplicar → revertir → aplicar; roles sin tablas; roles de Supabase sin nada); PRUEBA-019 (parte: ninguna columna de token, código, dirección ni texto libre).
- (b) `raiz-supabase.crt` de la fuente oficial; URL, fecha y huella en `LEEME.md` (V-10). Prueba: `tu/bd/raiz.test.ts`: CA autofirmada, vigente, con la huella anotada (PRUEBA-018, parte).
- (c) `validar_acceso` y `registrar_suceso` (20 000 al día y un `registro_saturado`). Prueba: `tu/bd/validar.test.ts`, PRUEBA-011 (parte BD, con reloj: 5 min 1 s, tipo, recurso, revocada → falso); PRUEBA-019 (parte: suceso cerrado).
- (d) `mcp_obtener_instrucciones` (diseño §Datos, «Reglas»). Prueba: `tu/bd/obtener.test.ts`, PRUEBA-015 (parte BD), PRUEBA-014 (parte: A no ve nada de B; B idéntico).
- (e) `mcp_enviar_informe`. Prueba: `tu/bd/informe.test.ts`, PRUEBA-017 (parte BD), PRUEBA-007 (parte: 10 → 1 informe), PRUEBA-014 (parte).
- (f) `mcp_confirmar_orden`. Prueba: `tu/bd/confirmar.test.ts`, PRUEBA-007 (parte: 10 → 1 `confirmada`), PRUEBA-015 (parte), PRUEBA-014 (parte).
- Condiciones del dictamen de T-102 (apoyo `tests/conector/apoyo/bd.ts`): la hora en el SQL solo con `now()` o `current_timestamp` (sin `pg_catalog.now()`, sin `age()` de un argumento, sin `clock_timestamp()` para caducidades); cuerpos de función entre `$$`, no entre comillas simples; caducidad acotada por los dos lados. PRUEBA-007 parte B no demuestra carreras (una sola conexión): queda para la 008 (L) y así se anota en su evidencia.
- Aviso de la 010 (propuesta 25): su M01 revoca de forma global los permisos por defecto de `postgres` (`revoke all on tables, sequences, functions from public, anon, authenticated, service_role, conector`); toda tabla, secuencia o función creada después en `conector_prueba` lleva su `grant` explícito (ya previsto en M-4).
- Archivos: `sql`, `bd/{001_estado.reversion,semilla}.sql`, `bd/raiz-supabase.crt`, `bd/LEEME.md`, pruebas.

### T-104 `[P]` · Configuración, secretos, contratos y prompt
`ingeniero-backend` · C, Res. · hecha · Depende de: T-101, 002·T-006 · REQ-008, REQ-009, REQ-012, REQ-014, REQ-015, REQ-018, REQ-019 · CA-007, CA-009, CA-012, CA-014, CA-015, CA-018, CA-024
- (a) C-1 y C-2 (diseño §Configuración; N-3): grupo «conector» en `configuracion.ts`; dos códigos nuevos; nombres en `.env.example` y `entornos.md`. Prueba: PRUEBA-018 (parte: cada variable ausente o mal formada, `?sslmode=disable`, `?options=…`, secreto corto → su código, nunca su valor); PRUEBA-021 (parte); `/api/salud` igual con el grupo inválido.
- (b) `secretos.ts` (diseño §Tokens: HKDF, HMAC con tipo, par derivado, origen, tiempo constante). Prueba: PRUEBA-012 (parte: mil pares sin parte común; misma sal, mismo par); PRUEBA-019 (parte: sal sin secreto → 0 tokens).
- (c) `contratos.ts`: Ajv 2020-12 estricto, `uuid` propio; publicado sin `$schema`, `$id` ni `x-version-esquema`; tolera las `x-` vigentes. Prueba: PRUEBA-003 (parte: compilan; publicado = contrato).
- (d) `0.1.md` y `arranque.md` desde `propuestas-diseno/textos-ficticios.md`; `prompts/` en `.prettierignore` si Prettier los cambiaría. Prueba: `tu/prompt-texto.test.ts`: marca, final `\n`, sin dirección ni URL (PRUEBA-016 y 019, partes); el `revisor` confirma el contenido permitido.
- (e) `prompt-ficticio.ts`: lectura única, huella fijada en el código; distinta, ilegible o vacía → 503; reglas constantes. Prueba: PRUEBA-016 (B).
- Archivos: `src/lib/plataforma/configuracion.ts`, `src/lib/registro/codigos.ts`, `.env.example`, `docs/operacion/entornos.md`, `oauth/secretos.ts`, `mcp/esquemas/contratos.ts`, `prompts/agente-prueba/{0.1,arranque}.md`, `.prettierignore`, `mcp/prompt-ficticio.ts`, pruebas.

## Bloque 2 · Las tres herramientas y el punto MCP

### T-105 · Almacén, herramientas y punto MCP (hito)
`ingeniero-backend` · C, Res. · hecha · Depende de: T-103, T-104, 002·T-004 · REQ-001, REQ-007, REQ-009, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015 · CA-001, CA-006, CA-009, CA-011, CA-012, CA-013, CA-014, CA-015

Las herramientas, una a una y en este orden: cada una, con su prueba en verde antes de empezar la siguiente. **Hito**: al cerrar, las tres responden por `/api/mcp` en local con tokens sembrados.

- (a) `almacen.ts` (diseño §Datos, «Conexión»; adaptador inyectable) y `conector.ts` (rol mcp). Prueba: PRUEBA-018 (parte: caído; 5 s; certificado no confiable → fallo sin consultar); solo `src/mcp/` importa `conector.ts`.
- (b) `sucesos.ts`: suceso tras responder; si falla, se descarta. Prueba: PRUEBA-019 (parte: marcados → 0 en sucesos y consola; el fallo no cambia la respuesta).
- (c) Herramienta `obtener_instrucciones` (diseño §Herramientas). Prueba: PRUEBA-015 (tres estados; 0 marcas sin `activa`), PRUEBA-016 (→ 503), PRUEBA-018 (parte: caído → `error_temporal`).
- (d) `sanear-informe.ts` (diseño §Herramientas). Prueba: PRUEBA-017 (parte: `campos_descartados: 3`, 0 apariciones, `__proto__`, `constructor`).
- (e) Herramienta `enviar_informe`. Prueba: PRUEBA-017 (herramienta), PRUEBA-007 (parte: 10 → 1 `guardado`).
- (f) Herramienta `confirmar_orden`. Prueba: PRUEBA-007 (parte), PRUEBA-017 (parte).
- (g) `servidor.ts` y `salida.ts` (diseño §Punto MCP, pasos 8 y 9). Prueba: PRUEBA-003 (listado = contratos; salidas válidas; distinto de 3 → 500), PRUEBA-002 (parte: dos épocas).
- (h) `src/mcp/entrada.ts` y `src/app/api/mcp/route.ts` (pasos 1 a 7 y 10); `entrada.ts`, excepción de la regla de `JSON.parse` en `eslint.config.mjs`. Prueba: PRUEBA-011, PRUEBA-001 (parte: reto), PRUEBA-002 (405), PRUEBA-017 (parte: lotes, sin eco), PRUEBA-018 (parte: 413, 503).
- Archivos: `sb/{almacen,conector}.ts`, `src/lib/registro/sucesos.ts`, `mcp/herramientas/{obtener-instrucciones,enviar-informe,confirmar-orden}.ts`, `mcp/esquemas/sanear-informe.ts`, `mcp/{servidor,salida,entrada}.ts`, `src/app/api/mcp/route.ts`, `eslint.config.mjs`, pruebas.

### T-106 · Trazado y región
`plataforma` · C, Res. · hecha · Depende de: T-105 · REQ-002, REQ-009, REQ-012 · CA-002, CA-009, CA-012
- (a) C-4: trazar `prompts/agente-prueba/`, `contratos/` y `bd/raiz-supabase.crt` en las rutas del conector; `headers()` no se toca. Prueba: `tp/trazado.test.ts`, PRUEBA-016 (parte V-3: la traza de `next build` los incluye).
- (b) `vercel.json` y `.vercelignore` (002 diseño §Batería, «Región»): `regions` `["arn1"]`, sin conmutación ni regiones en `functions`, `installCommand` `npm ci --ignore-scripts`. Prueba: `tp/region.test.ts`: casos de archivo de «Región» (PRUEBA-012 de la 002, parte).
- Archivos: `next.config.ts`, `vercel.json`, `.vercelignore`, pruebas.

## Bloque 3 · Autorización OAuth y operación

### T-107 `[P]` · Funciones SQL de autorización y operación
`ingeniero-bd` · C · hecha · Depende de: T-103 · REQ-003, REQ-004, REQ-006, REQ-008, REQ-014, REQ-017, REQ-019 · CA-003, CA-004, CA-007, CA-008, CA-014, CA-017, CA-024
- (a) `leer_cliente`, `guardar_cliente_cimd`, `registrar_cliente_dcr` (límites, purga). Prueba: `tu/bd/clientes.test.ts`, PRUEBA-005 (parte BD).
- (b) `abrir_solicitud`, `activar` (una transacción; bloqueo por origen). Prueba: `tu/bd/activar.test.ts`, PRUEBA-006 (parte BD), PRUEBA-007 (10 → 1 conexión), PRUEBA-018 (parte: fallo → solo recuento).
- (c) `canjear_codigo`, `renovar`. Prueba: `tu/bd/tokens.test.ts`, PRUEBA-012 (parte BD, con reloj), PRUEBA-005 (doble canje).
- (d) `operar_*`, `operar_contar_fallo`, `cerrar_prueba` terminal. Prueba: `tu/bd/operar.test.ts`, PRUEBA-020 (parte BD), PRUEBA-013, PRUEBA-023 (B).
- Archivos: `sql`, pruebas.

### T-108 · Metadatos, CIMD, origen, rol de gestión y operaciones
`ingeniero-backend` · C · hecha · Depende de: T-104 a T-107 · REQ-001, REQ-003, REQ-004, REQ-014, REQ-017, REQ-019 · CA-001, CA-003, CA-004, CA-014, CA-017, CA-024
- (a) `callbacks.ts`, `metadatos.ts` y rutas `.well-known`; CIMD en `false` sin URL comprobada. Prueba: PRUEBA-001 (V-2; CAD-002; `no-store`; 503 sin configuración; `Host` falso sin efecto).
- (b) `cimd.ts` (lista vacía sin V-6). Prueba: PRUEBA-005 (parte: 0 peticiones fuera de la lista).
- (c) `origen.ts`. Prueba: PRUEBA-006 (parte: sin cabecera fuera de local → rechazo sin evaluar).
- (d) `autorizacion.ts` (rol de gestión). Prueba: PRUEBA-018 (parte: caído en cada función).
- (e) `operaciones.ts` y `POST /api/operacion`. Prueba: PRUEBA-020, PRUEBA-021 (404 antes de leer), PRUEBA-023 (parte B).
- Archivos: `oauth/{callbacks,metadatos,cimd,origen}.ts`, `src/app/.well-known/**`, `sb/autorizacion.ts`, `src/lib/licencias/operaciones.ts`, `src/app/api/operacion/route.ts`, pruebas.

### T-109 `[P]` · Pantalla de activación
`ingeniero-frontend` (revisa también `disenador-ui`) · C · hecha (pendiente de revisión) · Depende de: T-108 · REQ-005 · CA-005
- `pantalla.ts`. Prueba: PRUEBA-009 (B: sin JavaScript, `state` escapado, estados, CSP), PRUEBA-010 (parte automática).
- Archivos: `oauth/pantalla.ts`, prueba.

### T-110 · Registro, autorización y tokens
`ingeniero-backend` · C · hecha (integrada el 21/11/2026 por delegación D-036: revisor APTO CON MENORES y auditor-seguridad APTO CON CONDICIONES, mayor de supervisión y menores corregidos en eaff1bb y comprobados en vuelta corta; condición abierta: regla WAF en `/oauth/*`, antes de T-117 y comprobación de T-119) · Depende de: T-108, T-109 · REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-014 · CA-003, CA-004, CA-005, CA-006, CA-007, CA-014
- (a) `clientes.ts` y `/oauth/registro`. Prueba: PRUEBA-005 (DCR).
- (b) `peticion.ts` y `GET /oauth/autorizar`. Prueba: PRUEBA-005 (sin redirigir; `state` e `iss`), PRUEBA-009 (parte: solicitud y cookie).
- (c) `activacion.ts` y `POST /oauth/autorizar`. Prueba: PRUEBA-006, PRUEBA-009 (`Origin` ajeno o `null` sin contar intento), PRUEBA-018 (parte: no disponible).
- (d) `tokens.ts` y `/oauth/token`. Prueba: PRUEBA-012, PRUEBA-005 (PKCE), PRUEBA-011 (parte), PRUEBA-018 (parte: emitir y renovar).
- Archivos: `oauth/{clientes,peticion,activacion,tokens}.ts`, `src/app/oauth/{registro,autorizar,token}/route.ts`, pruebas; añadidos en la implementación: `next.config.ts`, `tests/unit/plataforma/{cabeceras,trazado}.test.ts`, `src/lib/oauth/cuerpo.ts`, `src/lib/oauth/pantalla.ts`.

### T-111 · Órdenes de la persona
`plataforma` · C, Res. · pendiente · Depende de: T-110 · REQ-001, REQ-002, REQ-006, REQ-015, REQ-017 · CA-001, CA-002, CA-008, CA-015, CA-017
- (a) `operar.mjs` y `npm run operar` (C-3 sin carpeta sellada: la persona, desde un clon limpio de `main`; solo `preproduccion`). Prueba: `tp/operar.test.ts`, PRUEBA-020 (parte: sin eco ni guardado; otro entorno, rechazo antes de pedir la credencial).
- (b) `ciclo-local.mjs` (`npm run conector:ciclo`; tokens solo en memoria). Prueba: `tp/ciclo.test.ts`, PRUEBA-004 (parte: salida sin tokens ni código).
- (c) `pruebas-bd.mjs` y `comprobar-conector.mjs` (`conector:comprobar`: metadatos, reto, 405, cabeceras, `arn1`, V-3). Prueba: `tp/conector.test.ts`, PRUEBA-019 (parte: sin URL ni credencial en la salida), PRUEBA-001 (parte, en local).
- Archivos: `sc/{operar,ciclo-local,pruebas-bd,comprobar-conector}.mjs`, `package.json`, pruebas.

## Bloque 4 · Transversales en local y `Nido`

### T-112 `[P]` · Inventario y pruebas transversales en local
`qa` · C · pendiente · Depende de: T-110 · REQ-001, REQ-005, REQ-006, REQ-010, REQ-012, REQ-013, REQ-014, REQ-015 · CA-001, CA-005, CA-008, CA-010, CA-012, CA-013, CA-014, CA-015
- (a) Inventario de rutas y cabeceras de la 001 contra `next start` (`same-origin` solo en `/oauth/autorizar`) en `tests/plataforma/inventario-rutas-001.json`. Prueba: `tp/inventario-001.test.ts`, PRUEBA-009 (parte); PRUEBA-025 de la 002 en verde.
- (b) A, B y dos conexiones de A por HTTP en proceso. Prueba: `ta/aislamiento.test.ts`, PRUEBA-014 (CAD-015 entero; B idéntico), PRUEBA-013.
- (c) Fallos y huella. Prueba: `ta/fallos.test.ts`, PRUEBA-018 (cada paso, variable y punto), PRUEBA-016 (antes y después de operaciones y hostiles).
- (d) Entradas hostiles y valores marcados. Prueba: `ta/hostiles.test.ts`, PRUEBA-017, PRUEBA-019 (también en `id`; copia del estado → 0 tokens).
- (e) Ciclo completo con el cliente oficial (RD-079). Prueba: `ta/ciclo.test.ts`, PRUEBA-004 (B), PRUEBA-002 (2 de 2), PRUEBA-001 (CAD-002).

### T-113 `[P]` · WCAG 2.2 AA de la pantalla
`disenador-ui` · R · pendiente · Depende de: T-110 · REQ-005 · CA-005
- Prueba: PRUEBA-010 (V: 0 bloqueantes; 360 px; contraste; teclado). Archivo: `ev/T-113/wcag.md`.

### T-114 · Pruebas L en `Nido`
`qa` · C · pendiente · Depende de: T-111, T-112, AR-05; (c), además AR-06 · REQ-001, REQ-002, REQ-004, REQ-008, REQ-010, REQ-013, REQ-014, REQ-015 · CA-001, CA-002, CA-004, CA-007, CA-010, CA-013, CA-014, CA-015
- (a) `npm run pruebas-bd`. Prueba: PRUEBA-022 (L; ajenas a `PUBLIC` → AR-14), PRUEBA-008 (6543, 10 a la vez), PRUEBA-018 (L), PRUEBA-047 (parte: `eu-north-1`); V-5, V-10, V-107.
- (b) Ciclo con el cliente oficial contra `Nido`. Prueba: PRUEBA-004 (L).
- (c) Tras AR-06, la contraseña local ya no conecta tras revertir y reaplicar. Prueba: PRUEBA-022 (L, parte).
- Aviso de la 010 (propuesta 25): M01 revoca de forma global los permisos por defecto de `postgres`; las pruebas de privilegios no dan por supuesto ningún permiso por defecto y comprueban el `grant` explícito de cada tabla, secuencia y función de `conector_prueba`.
- Archivos: `ev/T-114/`.

## Bloque 5 · Contratos, supervisión y despliegue en Vercel (`arn1`)

### T-115 `[P]` · Contratos y ADR de autorización
`arquitecto` · C · hecha (revisor y auditor APTO CON CONDICIONES, aplicadas; 20/11/2026, integrada por delegación D-036) · Depende de: (a) AR-01 resuelta (delegación D-036, 20/11/2026); (b) nada · REQ-003, REQ-008, REQ-009, REQ-011 · CA-003, CA-007, CA-009
- (a) Contratos (diseño §Contratos): `readOnlyHint: false`, fuera `x-cuestion-abierta`, dos `description`. Prueba: PRUEBA-003 en verde con los nuevos; `comprobar-specs`.
- (b) ADR desde `propuestas-diseno/adr-borrador-autorizacion-del-conector.md`. Prueba: `comprobar-specs` sin errores; revisión. Puede hacerse ya; la tarea cierra con (a).
- Archivos: `contratos/{obtener-instrucciones,informe}.schema.json`, `docs/adr/`.

### T-116 `[P]` · Supervisión
`ingeniero-backend` · C · hecha · Depende de: T-104 · REQ-014, REQ-015 · CA-014, CA-015
- `supervision.ts` (002 diseño §Supervisión) con los códigos de C-2. Prueba: PRUEBA-046 de la 002 (evento cerrado con valores marcados; fallo sin bloqueo), con doble de red. (b) conectar `enviarEvento` en `manejador.ts`, `/api/salud` e `instrumentation.ts`.
- Archivos: `src/lib/plataforma/supervision.ts`, `src/lib/plataforma/manejador.ts`, `src/app/api/salud/route.ts`, `src/instrumentation.ts`, pruebas.

### T-117 · Despliegue en `pre-nido`
`plataforma` · C, Res. · (a) **hecha, corregida tras el dictamen del revisor (NO APTO: 1 MAYOR y 11 menores), pendiente de nueva revisión** (21/11/2026: `docs/operacion/despliegue-preproduccion.md`; propone `framework` y `buildCommand` en `vercel.json` y `min-release-age` en `.npmrc` sin aplicarlos, a decidir con dictamen del auditor); (b) **bloqueada** · Depende de: (a) T-106, **DP-1**; (b) T-113, T-114, T-115, T-116, AR-02, AR-06, AR-07 · REQ-001, REQ-002, REQ-019 · CA-001, CA-002, CA-024
- (a) Procedimiento de despliegue y vuelta atrás de preproducción para la persona: clon limpio de `main`, CLI de Vercel verificada (versión, opciones, fuente), `COMMIT_DESPLEGADO`, sin `--regions`, `vercel rollback`; nombres de variables, nunca valores. Prueba: revisión (cada orden con fuente oficial; ningún valor); `arnes` en verde.
- (b) Primer despliegue: **lo hace una persona** (AR-06, AR-07); el agente comprueba desde fuera. Vuelta atrás: dos despliegues del mismo commit, `rollback` al primero y vuelta. Prueba: `conector:comprobar`: PRUEBA-047 (`arn1`), PRUEBA-001 (V), V-3; PRUEBA-013 y 027 de la 002; vuelta atrás en 10 min.
- Archivos: `docs/operacion/despliegue-preproduccion.md`, `ev/T-117/`.

## Bloque 6 · Prueba real con Claude Max (`qa` anota; ejecuta la persona)

### T-118 `[P]` · Guion y pasos 1 y 2
`qa` · R · (a) hecha (revisor APTO, menores aplicados; 20/11/2026, por delegación D-036); (b) pendiente de AR-03, AR-04 y AR-08 · Depende de: (a) nada; (b) AR-03, AR-04, AR-08 · REQ-016, REQ-018, REQ-019, REQ-020 · CA-016, CA-018, CA-024, CA-025
- (a) Guion fechado (pasos 1 a 13 con su CA; ChatGPT «no ejecutado»), `calendario.md` (documento normal; AR-08) y plantillas de resultados. Prueba: PRUEBA-053 (parte: fechado; 0 pasos sin CA).
- (b) Preparación y pasos 1 y 2. Prueba: PRUEBA-049, PRUEBA-048 (inventario).
- Archivos: `guion-prueba.md`, `calendario.md`, `resultados/`, `ev/T-118/`.

### T-119 · Navegador real, pasos 3 a 13 y resultados
`qa` · C (por la parte (f); el resto, R) · pendiente · Depende de: T-117, T-118, AR-16; por partes, AR-09, AR-10, AR-11, AR-12 · REQ-001, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-011, REQ-015, REQ-016, REQ-018, REQ-019, REQ-020 · CA-004, CA-005, CA-008, CA-009, CA-011, CA-015, CA-016, CA-018, CA-019, CA-020, CA-021, CA-022, CA-023, CA-024, CA-025
- (a) Antes del paso 3: V-6 y navegador real (AR-16). Prueba: PRUEBA-009 (R: GET y POST), PRUEBA-006 (V-6). Además, ráfaga de más de 100 peticiones por minuto desde una IP a `/api/salud` y a `/oauth/token`, con 429 o 403 en cada ruta y aciertos en Firewall overview (WAF; dictamen del auditor sobre T-117 (a), 21/11/2026).
- (b) Pasos 3 a 5 (alta y activación en Claude: AR-11). Prueba: PRUEBA-040, PRUEBA-041 (inicio).
- (c) Pasos 6 a 8 (tras AR-09). Prueba: PRUEBA-042, PRUEBA-049 (paso 7), PRUEBA-045.
- (d) Pasos 9, 10 y 12. Prueba: PRUEBA-043, 044, 050 y 048 (diaria).
- (e) Paso 11 (AR-11). Prueba: PRUEBA-046.
- (f) Paso 13 (tras AR-10 y AR-12). Prueba: PRUEBA-052, PRUEBA-023 (tras redesplegar: todo 503, 0 sesiones, despliegue anterior sin `emitido`, contraseña antigua sin conexión), PRUEBA-041 (final).
- (g) Resultados y conclusiones (RD-028, RD-067, RD-073, V-101 a V-104). Prueba: PRUEBA-051, PRUEBA-053.
- Archivos: `ev/T-119/` (una carpeta por parte), `resultados/`.

## Bloque 7 · Condiciones de plataforma (carril A)

### T-120 · Condiciones de la retirada de fechas
`plataforma` · C, Res. · hecha · Depende de: 002·T-003, T-101 integrada · sin REQ propio; D-030, D-034 y diseño 002 §Suministro
- (a) B-1: `.npmrc` con `ignore-scripts=true` y lista cerrada de paquetes con `hasInstallScript` (hoy solo `fsevents`). Prueba: `tp/npmrc.test.ts`.
- (b) B-2: en `arnes.yml`, `npm ci`, `npm audit` y `npm audit signatures`, también en un diario programado sobre `main` (D-030), con `contents: read`. Prueba: `tp/ci-npm.test.ts` (estática; el CI no se ha ejecutado, sin remoto).
- Archivos: `.npmrc`, `.github/workflows/arnes.yml`, `tp/npmrc.test.ts`, `tp/ci-npm.test.ts`.
- D-030: Vitest en el CI solo para la carpeta `tests/unit/plataforma` (`npx vitest run tests/unit/plataforma`, sin red real ni secretos), donde viven `npmrc.test.ts` y `ci-npm.test.ts`; el resto de las pruebas en el CI queda pendiente de la tarea de CI completo, aún sin identificador. El CI no se ha ejecutado (sin remoto).
- Pendientes antes del primer push (dictamen del auditor-seguridad): fijar por SHA las acciones de `arnes.yml` (V-115) y definir el canal de aviso del diario sobre `main` (función 003).

## Bloque 8 · Condiciones del carril A2

Decididas por la coordinación (D-036, 21/11/2026). T-121 y T-122 no comparten archivos con T-105 a T-114 ni T-117 salvo los que citan; T-122 rebasa sobre lo que haya en `main`.

### T-121 `[P]` · Patrón de DSN de Sentry en el escáner
`plataforma` · C, Res. · hecha (revisor sin bloqueantes ni mayores y auditor APTO; 21/11/2026, D-036; menores abiertos para una tarea aparte: patrón `sentry_key=<32 hex>` de la cabecera X-Sentry-Auth y de la URL del SDK, que hoy no se detecta; regla de retaguardia `(?<=[0-9a-f]{32})(?:@|%40)…` más barata en tiradas largas; caso de JSON con barras escapadas) · Depende de: T-101, T-116 · REQ-015 · CA-015
- Entrada nueva en `PATRONES`: nombre «DSN de Sentry», `/[0-9a-f]{32}(?::[0-9a-f]{32})?(?:@|%40)(?:[a-z0-9-]+\.)*sentry\.io/i` (clave pública, con o sin la secreta antigua, `@` o `%40`, cualquier subdominio de `sentry.io`), sin exclusión por la izquierda, como las del conector. El gancho y `comprobar-specs.mjs` la toman sin más cambios.
- Prueba (primero, en rojo): `tp/patrones-supervision.test.ts`, con el DSN compuesto en ejecución: se detecta suelto, en `SUPERVISION_DSN=…`, en JSON, codificado en URL y con la parte secreta; solo devuelve el nombre, nunca el valor. No se detectan la URL de ingreso sin clave (`/api/<n>/envelope/`), 31 hexadecimales ni otro dominio. `arnes` en verde en todo el árbol (las pruebas actuales componen el DSN en ejecución; Grep de `[0-9a-f]{32}@` sin coincidencias el 21/11/2026).
- Archivos: `scripts/patrones-secretos.mjs`, `tp/patrones-supervision.test.ts`.

### T-122 · Código propio `prompt_no_valido` (C-2)
`ingeniero-backend` (revisan `revisor` y `auditor-seguridad`) · C · hecha (revisor sin bloqueantes ni mayores, auditor APTO; 21/11/2026, D-036; menor del auditor: el suceso de prompt_no_valido solo queda en consola y Sentry, no en sucesos, como antes de T-122) · Depende de: T-105, T-116 · REQ-012, REQ-014 · CA-012, CA-014
- Diseño §Lo que toma de la 002, C-2, y §Prompt y arranque ficticios. Sin cambio en `contratos/` (no lista códigos internos), en `001_estado.sql` ni en `sucesos.ts` (el código cumple `^[a-z0-9_]{1,40}$`), ni en lo que sigue con `configuracion_conector_invalida` por C-1: `configuracion.ts`, `oauth/secretos.ts`, `mcp/entrada.ts`, `licencias/operaciones.ts`, `sb/{conector,autorizacion}.ts`; tampoco en `supervision.ts`, cuya lista sale de `CODIGOS` (el código nuevo no va a `EXCLUIDOS`).
- Pruebas (primero, en rojo): `tu/prompt-ficticio.test.ts` (`falla`, l. 35) y `tu/obtener-instrucciones.test.ts` (l. 167, 173) esperan `prompt_no_valido`; `tu/servidor.test.ts` (l. 326, 339), igual; `tp/manejador-503.test.ts` (l. 25, 43): tres códigos con 503; `tp/supervision.test.ts`: `prompt_no_valido` en `CODIGOS_ESPERADOS` (l. 68-78) y en l. 171; `tu/configuracion.test.ts` l. 83: `CODIGOS` lo contiene. Nueva en `tu/ruta-mcp.test.ts`: con `vi.mock` de `src/mcp/prompt-ficticio` que falla, `tools/call obtener_instrucciones` por `/api/mcp` → 503, `{"estado":"error"}`, `no-store`, registro con `prompt_no_valido` y sin `configuracion_conector_invalida`, 0 ejecuciones (PRUEBA-016, parte HTTP).
- Código: `codigos.ts` (`"prompt_no_valido"` tras `configuracion_conector_invalida`); `manejador.ts` (`NO_DISPONIBLES`); `prompt-ficticio.ts` l. 52, 54 y 58; comentarios de `mcp/herramientas/obtener-instrucciones.ts` (l. 8, 20) y `mcp/servidor.ts` (l. 11, 29).
- Archivos: `src/lib/registro/codigos.ts`, `src/lib/plataforma/manejador.ts`, `mcp/prompt-ficticio.ts`, `mcp/herramientas/obtener-instrucciones.ts`, `mcp/servidor.ts`, las siete pruebas citadas.

### T-123 · HMAC de `registrar_suceso`: prueba de la decisión
`ingeniero-bd` · C · hecha en (a) y (c) (decisión A, 21/11/2026, D-036; revisor sin bloqueantes ni mayores y auditor APTO CON CONDICIONES, menores aplicados; (c) cubierta hoy por la lista cerrada `FUNCIONES_GESTION` y una prueba estática, y exigirá una prueba en la ruta de gestión cuando registre sucesos; (b) hecha en el repositorio, con revisor APTO CON MENORES y auditor APTO (21/11/2026), y pendiente solo de reaplicar el SQL en `Nido`) · Depende de: esa decisión, T-103 · REQ-010, REQ-015 · CA-010, CA-015
- (a) Prueba, en `tu/bd/validar.test.ts`, junto a las de `registrar_suceso`: con A y B sembrados, HMAC de A, de B, inexistente, mal formado y nulo → mismo `resultado`; `huellaDeLicencia` de A y de B igual antes y después; `asistente`, el de la conexión del HMAC o nulo (PRUEBA-014 y 019, partes).
- (b) HECHA y revisada (revisor APTO CON MENORES, auditor APTO; 21/11/2026, D-036): `t.tipo = 'acceso'` en el join de `registrar_suceso` que resuelve el HMAC recibido (`001_estado.sql`, l. 489) y prueba en `tests/unit/conector/bd/validar.test.ts` (HMAC de renovación = HMAC inexistente, asistente nulo; roja sin el cambio, verde con él). Exige reaplicar el SQL en `Nido` (R-2, persona); sin aplicar allí todavía.
- (c) Condición del auditor (21/11/2026): prueba o comentario de que la gestión pasa siempre `p_token_hmac` nulo. (b) ya está en el repositorio; falta reaplicar el SQL en `Nido`.
- Archivos: `tu/bd/validar.test.ts`; `sql`, solo con (b).

### T-124 · `agentRules: false` en `next.config.ts`
`plataforma` · C · hecha (evidencia completa en verde, 21/11/2026; revisor APTO CON MENORES, auditor APTO CON CONDICIONES) · Depende de: T-110 · REQ-015 · CA-015
- `next dev`, `next build` y `next start` escriben un bloque en `AGENTS.md` (hallazgo del carril A2). Fijar `agentRules: false` en `next.config.ts` y comprobar que tras `next build` `AGENTS.md` no cambia. Decisión de la coordinación, 21/11/2026 (D-036).
- Cambio de CI incluido (D-036, 21/11/2026, con dictamen del `auditor-seguridad`): acciones de `.github/workflows` fijadas por SHA completo de commit con la versión en comentario; `.github/CODEOWNERS` sobre CI, `.npmrc`, bloqueo, scripts, pruebas de plataforma, migraciones, prompts, contratos, constitución, `.claude` y demás rutas críticas (solo surte efecto si una persona activa la revisión de propietarios en la protección de rama); `.github/dependabot.yml` solo para `github-actions`. Pruebas en `tests/unit/plataforma` (`acciones-fijadas`, `ci-npm`, `agent-rules`).
- La comprobación de que `AGENTS.md` no cambia tras `next build` consta en `evidencias/T-124/agents-md.txt` (la ejecuta el responsable, no hay build en esta máquina de agente).
- Revisión: `revisor`. Archivos: `next.config.ts`, `.github/` (flujos, `CODEOWNERS`, `dependabot.yml`), pruebas en `tests/unit/plataforma`.

## Equivalencias (numeración del 19/11 → actual)

| Actual | Antiguas | Actual | Antiguas |
| --- | --- | --- | --- |
| T-101 | T-101, T-102 | T-111 | T-138 a T-140 |
| T-102 | T-104 | T-112 | T-141 a T-145 |
| T-103 | T-105 a T-107, T-114, T-116, T-119 | T-113 | T-146 |
| T-104 | T-103, T-109, T-111 a T-113 | T-114 | T-147 a T-149 |
| T-105 | T-108, T-110, T-115, T-117, T-118, T-120 a T-122 | T-115 | T-150, T-157 |
| T-106 | T-123, T-151 | T-116 | T-152 |
| T-107 | T-124 a T-127 | T-117 | T-153, T-154 |
| T-108 | T-128, T-129, T-131, T-132, T-137 | T-118 | T-156, T-158 |
| T-109 | T-130 | T-119 | T-155, T-159 a T-164 |
| T-110 | T-133 a T-136 | | |

T-120 a T-123 actuales son tareas nuevas (bloques 7 y 8): no son las antiguas del mismo número de esta tabla.

## Escalados

Tareas que han subido de nivel de modelo o de esfuerzo, y por qué (`docs/EQUIPO.md`).

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
