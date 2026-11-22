# Relevo de la fase 1 · 22/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). Historia en `git log` y `docs/TECNOLOGIAS.md`. Sin push (lo hace la coordinación). Cada rama vive en su copia de `.claude/worktrees/`. Autorización: encargo de la coordinación (D-036, autonomía total, sin pausas). Prioridad: la prueba real del conector; la prueba Pro de Vercel acaba el 27/11.

## Integrado hoy (22/11, 2.ª reescritura)
- T-125 = a92ec95 (menores de T-124 en CI; revisor y auditor APTO CON MENORES; anotados: `usoFijado` admite `./x@sha`, la prueba de CODEOWNERS no fija el propietario de cada ruta, `tipos.txt` y `estilo.txt` vacíos).
- `diseno.md` al día con T-107 = 85885bc (cierre, cerrada, resultados de SQL, límites L-1 a L-5; propone un caso de canje y cierre simultáneos en PRUEBA-008).
- T-119, preparación sin despliegue = 1a41f55: guion y plantillas en `evidencias/T-119/`, `scripts/conector/rafaga-waf.mjs` con 41 pruebas locales; MAYOR-1 del revisor corregido y comprobado por el orquestador; nada ejecutado contra Vercel. Decisión de la coordinación (MENOR-4): la URL va por `RAFAGA_URL_BASE` frente a la convención sin eco. `despliegue-preproduccion.md` §8 propone 120 `curl`, que puede dar un falso fallo: usar el script (≥201 peticiones).
- Las tres con pruebas de la tarea, tipos y comprobar-specs en verde; suite completa sin ejecutar.
- `trazado.test.ts` lanza un `next build` si no hay traza y falla con `node_modules` enlazado: no ejecutar `tests/unit/plataforma` entero en copias con enlace.

## Suite completa de `main` (paso 1 del encargo): PENDIENTE
Copia `.claude/worktrees/suite-main` (igualada a `main`). Un trabajo en segundo plano tiene el candado y espera `esperar-memoria.sh 4000`; hubo ~2,5 GB libres durante horas. Cuando corra, anotar el resultado en `evidencias/T-112/resultado.md`. Después, T-112 (a) con `next start` en el puerto 3110 o superior. Si el candado pasa de 45 minutos sin suite, está abandonado.

## Estado (comprobado por el orquestador al reescribir)
- Integradas en `main`: T-101 a T-111, T-115, T-116, T-117 (a), T-118 (a), T-120 a T-124 (T-110 = 9c0faac; T-123 (b) = 75b1c2f; T-117 (a) = 1690947; T-124 = c53728f; T-111 = f5af7ab; T-112 = d420e84; T-113 = ver `git log`). El carril A2 terminó (`relevo-paralelo.md`).
- T-124: evidencia completa en verde (3231 pruebas). T-111: suite 3494 de 3495 y el fallo (manifiesto) corregido; tipos, estilo, aislamiento, arnés y build en 0. Candado de suite y espera de memoria (regla D): el sistema mató una pasada por memoria; se repitió con el script.
- T-123 (b): en el repositorio, falta aplicar el SQL en `Nido` (una vez, con el paso 1 de T-114).
- T-117 (a): `docs/operacion/despliegue-preproduccion.md`; no se ha ejecutado nada contra Vercel. Propuestas sin aplicar (apartado 10): `framework` y `buildCommand` en `vercel.json` y `min-release-age=7` en `.npmrc` (ambas con dictamen del auditor y cambio de `region.test.ts` y `npmrc.test.ts`). Riesgo abierto: dónde se compila (fuera de la UE).
- T-111: `operar` y `conector:ciclo` solo en PowerShell o Windows Terminal (no Git Bash); confirman el destino (`issuer` y `SI`); `conector:comprobar` pide la dirección y la huella del commit desplegado. Menores aceptados: la confirmación solo protege si la persona lee el host.

## Falta, por orden
1. T-112 (a) contra `next start` (`INVENTARIO_BASE_URL`; con la máquina libre, en T-114 o antes del despliegue), T-117 (b) (persona), T-119 (`qa`, navegador real; añadidas la ráfaga del WAF, PRUEBA-010 y los menores M1 a M5 de T-113), T-114 (`qa`, necesita AR-05 y AR-06: personas). Suite completa sin ejecutar en T-112 (tres intentos muertos por memoria): repetirla cuando haya RAM.
2. Un solo subagente opus a la vez; candado de suite antes de suite completa o build; `bash scripts/esperar-memoria.sh 4000` después del candado.
3. Coordinación: actualizar `docs/TECNOLOGIAS.md` (V-115 «CERRADA»), regla WAF (`/api/*` y `/oauth/*` con «Starts with», acción 429; el gasto lo acepta una persona), aplicar SQL en `Nido` (T-114), decidir las propuestas del apartado 10 del doc de despliegue.
4. Menores abiertos de T-124: línea `* @multiserviagua-pixel` primera en CODEOWNERS y exigirla en la prueba; escanear `.github/` entero en `acciones-fijadas.test.ts`; `cooldown` de Dependabot. Personas: activar la protección de rama con revisión de propietarios; confirmar `@multiserviagua-pixel`; comprobar Dependabot.

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

## Siguiente paso (22/11/2026)
- Carril A sin tareas ejecutables por agentes hasta AR-05/AR-06 (T-114) y el primer despliegue (T-117 b, persona). Repetir la suite completa en `main`. Cada integración: rebasar, evidencia con candado y memoria, un solo comando `git merge --squash` más `git commit -- rutas`.
