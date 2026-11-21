# Relevo de la fase 1 · 21/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). Historia en `git log` y `docs/TECNOLOGIAS.md`. Sin push (lo hace la coordinación). Cada rama vive en su copia de `.claude/worktrees/`. Autorización: encargo de la coordinación (D-036, autonomía total, sin pausas). Prioridad: la prueba real del conector; la prueba Pro de Vercel acaba el 27/11.

## Estado (comprobado por el orquestador al reescribir)
- Integradas en `main`: T-101 a T-109 y T-115, T-116, T-118 (a), T-120 a T-123 (a)(c) (ver `git log`; T-109 = 1d7dc4b, T-122 = 913ec82, T-121 = e72c148, T-123 a y c = 317ab0a). El carril A2 terminó (`relevo-paralelo.md`).
- **T-110: HECHA e integrada en `main` (9c0faac, 21/11/2026, aprobado por delegación D-036).** El código principal entró antes en e44def3 por el incidente del índice compartido (no se reescribe el historial); 9c0faac añade las correcciones, los dictámenes y la evidencia (`evidencias/T-110/resultado.md`: vitest 3069 en verde y 3 fallos por memoria que pasan solos 120/120; tipos, estilo, aislamiento, arnés y build en 0). Vuelta corta: revisor APTO CON MENORES; auditor APTO CON CONDICIONES con un MAYOR nuevo (caída del almacén sin supervisión), corregido en eaff1bb. **Condición abierta, no código: regla WAF de límite por IP en `/oauth/*` (coordinación) antes de T-117 y comprobación en T-119.** Aceptado: riesgo residual del enlace de autorización ajeno; anotarlo en la tabla de amenazas del diseño. Los dos registros `aviso` de `cerrada` y del resultado de la prueba no emiten evento (no son caída).

## Falta, por orden
1. **T-124 + CI (copia `.claude/worktrees/t-124`, rama `tarea/T-124`, 4 commits rebasados sobre main, sin integrar).** Revisor: APTO CON MENORES; auditor-seguridad (2 vueltas): APTO CON CONDICIONES, sin bloqueantes (informes en `evidencias/T-124/`). **Falta solo la evidencia completa**: la lancé a las 18:45 con el candado y el sistema la mató por memoria baja (19:08); candado soltado, salida parcial borrada. NO relanzarla sin que la máquina esté libre. Receta (en la copia t-124, con el candado, regla A): `npx vitest run --maxWorkers=3`, `npm run tipos`, `estilo`, `aislamiento`, `arnes`, `build`, y después `git diff --exit-code AGENTS.md` (guardar en `evidencias/T-124/agents-md.txt`; si cambia, `git checkout -- AGENTS.md`). Si pasa: escribir `evidencias/T-124/resultado.md`, marcar T-124 «hecha» en `tareas.md`, commit, y en main un solo comando `git merge --squash tarea/T-124` + `git commit -- rutas explícitas` (índice de main vacío antes).
   - Menores abiertos del auditor (aceptados, no bloquean): línea `* @multiserviagua-pixel` primero en CODEOWNERS y exigirla en la prueba; escanear `.github/` entero en `acciones-fijadas.test.ts`; `cooldown` de Dependabot. Del revisor: V-115 de `docs/TECNOLOGIAS.md` a «CERRADA» (la coordinación).
   - Personas: activar en `main` la protección de rama con revisión de propietarios de código (CODEOWNERS no hace nada sin ella; si el propietario abre los PR, no puede aprobarse a sí mismo); confirmar `@multiserviagua-pixel` como propietario; comprobar Dependabot activo.
2. T-111 (`plataforma`; incluye exportación de sucesos por páginas u horas si el arquitecto la recomienda como código), T-112 (`qa`), T-113 (`disenador-ui`), T-117 (a) (`plataforma`, despliegue en `pre-nido`), T-119 (`qa`, navegador real), T-114 (`qa`, necesita AR-05 y AR-06: personas; preparar sus pasos al llegar).
3. Anotar en `plan.md` las decisiones de la coordinación del 21/11/2026 (D-036): pendiente.
4. Un solo subagente opus a la vez; candado de suite antes de suite completa o build.

## Decisiones de la coordinación por D-036, 21/11/2026 (a anotar en `plan.md`)
1. T-108: la regla del WAF de Vercel para `/api/operacion` la pone la coordinación. Exportación de sucesos: opción recomendada por el arquitecto, decide la orquestación; si es código, va en T-111.
2. T-106/T-117: si el arquitecto recomienda fijar `buildCommand` y `framework` en `vercel.json`, se acepta el cambio del diseño 002 §Región con dictamen del auditor. El procedimiento de T-117 recoge los metadatos de git de la CLI de Vercel y cómo evitarlos o aceptarlos. Builds fuera de la UE: riesgo a comprobar en el primer despliegue, no bloquea.
3. CI: SHA de actions y CODEOWNERS (punto 2 arriba), tras T-110.
4. T-124 nueva (punto 2 arriba).
5. `docs/TECNOLOGIAS.md` lo actualiza la coordinación.
6. T-114: pasos de la persona preparados abajo.

## Pasos de la persona para T-114 (AR-05 y AR-06, Supabase `Nido`) — por preparar
Ejecuta la coordinación en el editor SQL de `Nido` (eu-north-1); las contraseñas las pone el responsable. Fuente: `supabase/conector-prueba/LEEME.md`. Nada de contraseñas en claro en el editor, en chat ni en evidencias (art. 4).

**0. Previo.** Comprobar que el proyecto es `Nido` (no otro). Antes del paso 1, aplicar T-123 (b) en `001_estado.sql` (una línea: en `registrar_suceso`, el `join` de `tokens` añade `and t.tipo = 'acceso'`, como ya hacen las otras funciones). Es un cambio de migración: tarea aparte `T-123 (b)`, con revisor y auditor, **antes** de la primera aplicación en `Nido` (así no hace falta reaplicar). Si no está integrada, no se ejecuta el paso 1.

**1. Estado (SQL, en este orden).**
1. Pegar y ejecutar `supabase/conector-prueba/001_estado.sql` entero (una transacción; se detiene si hay dueños o concesiones ajenas: no forzar, avisar).
2. Pegar y ejecutar `supabase/conector-prueba/semilla.sql`.
3. Comprobación: `select tipo, estado from conector_prueba.licencias order by tipo;` → dos filas, `A` y `B`, ambas `activa`.
4. Comprobación de roles: `select rolname, rolcanlogin, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolreplication, rolconnlimit from pg_roles where rolname in ('conector_prueba_mcp','conector_prueba_gestion','postgres') order by 1;` → los dos del conector: login `true`, el resto `false`, límite 10; `postgres`: `rolsuper = false` y `rolbypassrls = false` (si `postgres` sale `true` en alguno, parar y avisar al responsable).
5. Comprobación de que sus tablas tienen RLS y ninguna política: `select c.relname, c.relrowsecurity, (select count(*) from pg_policies p where p.schemaname='conector_prueba' and p.tablename=c.relname) as politicas from pg_class c where c.relnamespace='conector_prueba'::regnamespace and c.relkind='r' order by 1;` → todas `true` y `0`.
6. Registro de errores (decisión A-12 del responsable, D-040; `specs/022-clientes-licencias-conexiones/aclaraciones.md`). Supabase deniega estos ajustes a nivel de base de datos (`42501`), solo valen por rol. Ejecutar: `alter role conector_prueba_mcp set log_min_messages = panic, log_min_error_statement = panic, log_parameter_max_length = 0, log_parameter_max_length_on_error = 0;` y lo mismo con `conector_prueba_gestion`. Comprobación: `select rolname, rolconfig from pg_roles where rolname in ('conector_prueba_mcp','conector_prueba_gestion') order by 1;` → en ambos, `rolconfig` contiene los cuatro ajustes (`log_min_messages=panic`, `log_min_error_statement=panic`, `log_parameter_max_length=0`, `log_parameter_max_length_on_error=0`). Si el editor no permite el `alter role`, parar y avisar.
7. Comprobación del rol propietario: `select rolname, rolcanlogin from pg_roles where rolname = current_user;` y `select distinct pg_get_userbyid(relowner) from pg_class where relnamespace='conector_prueba'::regnamespace;` → un solo dueño; si ese rol permite inicio de sesión y no es el del editor, anotarlo (decisión del responsable). Esperado: ningún objeto del esquema pertenece a los roles `conector_prueba_mcp` ni `conector_prueba_gestion`.

**2. Contraseñas (el responsable, en su máquina; AR-05).**
1. Generar dos contraseñas distintas de 20 o más caracteres ASCII imprimibles.
2. Para cada una: `node scripts/conector/verificador-scram.mjs` y escribir la contraseña en la entrada sin eco (nunca como argumento ni como `CONTRASENA_CONECTOR=` en la línea de órdenes). Copiar solo la línea `SCRAM-SHA-256$4096:…`.
3. Pasar a la coordinación **solo los verificadores** (no las contraseñas). Ella ejecuta: `alter role conector_prueba_mcp password '<verificador 1>';` y `alter role conector_prueba_gestion password '<verificador 2>';`.
4. Comprobación: `select rolname, rolpassword is not null as tiene from pg_authid where rolname like 'conector_prueba_%';` (si el editor no deja leer `pg_authid`, usar `select usename, passwd is not null from pg_shadow where usename like 'conector_prueba_%';`) → `true` en ambos. Y `select query from pg_stat_statements where query ilike '%conector_prueba%password%';` solo puede mostrar `SCRAM-SHA-256$…`; **no copiar esa salida a ninguna evidencia**.
5. El responsable pone las contraseñas en Vercel `pre-nido` (Production y Preview): `CONECTOR_BD_URL` (rol `mcp`) y `AUTORIZACION_BD_URL` (rol `gestion`), ambas con puerto 6543 del agrupador, `sslmode` verificado con `raiz-supabase.crt`. Nunca en chat ni en el repositorio.

**3. Qué se anota (sin valores).** En `ev/T-114/`: resultado de cada comprobación (esperado/obtenido, sin contraseñas, sin URL, sin salida de `pg_stat_statements`), fecha y quién lo ejecutó. Con AR-05 hecha, T-114 (a) y (b) arrancan; con AR-06 (revertir, reaplicar y comprobar que la contraseña vieja ya no conecta), (c).

**4. Vuelta atrás.** `LEEME.md` §Revertir: `pg_terminate_backend` de las sesiones de los dos roles y `001_estado.reversion.sql`; los roles renacen sin contraseña (repetir 2.1 a 2.4).

## Condiciones abiertas que no son código
- T-108 (auditor): WAF de límite de peticiones en `/api/operacion` (coordinación); exportación de sucesos paginada (un día de 20 001 sucesos ≈ 4 MB). `/api/operacion` usa el predicado de entorno del conector; origen IPv6 agrupado por /64.
- T-107: `cierre` terminal; `tokens.cliente_oauth_id not null` (falla si `Nido` tiene filas antiguas: decidir a mano); posible interbloqueo `canjear_codigo`/`cerrar_prueba`; carreras reales solo en PRUEBA-008 en `Nido`; el script de roles se para si hay dueños o concesiones ajenas. `diseno.md` no recoge aún `cierre`, `cerrada` ni los resultados añadidos (arquitecto).
- T-106/T-117: ver decisión 2; comprobar `x-vercel-forwarded-for` en el primer despliegue (V§9.1).
- T-105: plazo de 5 s sin cancelar la consulta en cola; `console.warn` fijo del SDK; métodos fuera de lista dan -32601; prueba L de postgres.js contra el agrupador (V-107); PRUEBA-007 con concurrencia real.
- T-110 (del relevo anterior, a comprobar en la revisión): reutilizar `codigo-activacion.ts`; `cerrada` y resultados desconocidos de SQL → denegación; `no_valida` antes de insertar `desafio_pkce` ≠ 43; claves en `outputFileTracingIncludes` y `trazado.test.ts`; 503 en capa HTTP para `configuracion_conector_invalida` y `almacen_no_disponible`; S256, `Origin` propio, cookie `__Host-` nueva, no registrar el objeto de error de postgres.js.
- Menores de T-004 y el del auditor de T-101 (`encodeURIComponent` del token base64, `evidencias/T-101/dependencias.md`): anotar al cerrar.
- Menores abiertos de T-121: patrón `sentry_key=<32 hex>` (tarea aparte).
- Personas: DP-1, DP-2 (Sentry UE), `CONECTOR_SECRETO`, URL de BD con puerto 6543, AR-03, AR-04, AR-05, AR-06, AR-08, punto 12 del ADR-0007.
- Espera de dependencias: revalorar en T-117 (`min-release-age`).
- `specs/016-…` y `marketing/` son de otro chat: no se tocan; `git add` con rutas explícitas.

## Siguiente paso (21/11/2026, tarde)
- T-124: la copia `t-124` está rebasada sobre `main` y con `npm ci` hecho (antes no tenía `node_modules`: por eso fallaban `build` y `trazado.test.ts`). Añadido el commit 2001742 (prettier de `supabase/tests/pglite/m08_m10.test.ts`, de la 010, solo formato; avisar a ese chat). Primera pasada: vitest 3230/3231 (el fallo era el build), tipos, aislamiento, arnés y AGENTS.md en 0; estilo y build en 1 por las dos causas dichas.
- Segunda pasada lanzada con el candado (`salida/` en `evidencias/T-124/`). Un vigilante en segundo plano fue parado por memoria baja (1,6 GB libres); el sistema pide no relanzar nada sin que haya memoria. Al reanudar: mirar `salida/codigos.txt` (si no existe y no hay candado, la pasada murió: soltar candado, esperar 10 min y repetir con `--maxWorkers=2`), borrar `salida/` antes de repetir, y si todo da 0, `resultado.md`, tareas.md, commit e integrar (regla C).
- Después: T-123 (b) (una línea en `001_estado.sql`, revisor y auditor, antes de aplicar en `Nido`), T-111, T-112, T-113, T-117 (a), y anotar en `plan.md` las decisiones de arriba.
