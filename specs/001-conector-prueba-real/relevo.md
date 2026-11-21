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
Pendiente de redactar al llegar a T-114 a partir de `supabase/conector-prueba/LEEME.md` (SQL a ejecutar, roles y contraseñas a crear sin mostrarlas, comprobaciones: `postgres` sin superusuario ni `bypassrls`, `log_parameter_max_length_on_error = 0`, rol propietario `NOLOGIN`) y del endurecimiento de T-123 (b) (`t.tipo = 'acceso'` en `registrar_suceso`, con la reaplicación de SQL, R-2).

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

## Siguiente paso
Parada por memoria baja de la máquina (no por decisión pendiente). Con la máquina libre: evidencia completa de T-124 (receta arriba), integrarla, y seguir con T-111.
