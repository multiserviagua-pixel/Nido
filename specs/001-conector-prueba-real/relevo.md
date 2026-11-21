# Relevo de la fase 1 · 21/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). Historia en `git log` y `docs/TECNOLOGIAS.md`. Sin push (lo hace la coordinación). Cada rama vive en su copia de `.claude/worktrees/`. Autorización: encargo de la coordinación (D-036, autonomía total, sin pausas). Prioridad: la prueba real del conector; la prueba Pro de Vercel acaba el 27/11.

## Estado (comprobado por el orquestador al reescribir)
- Integradas en `main`: T-101 a T-109 y T-115, T-116, T-118 (a), T-120 a T-123 (a)(c) (ver `git log`; T-109 = 1d7dc4b, T-122 = 913ec82, T-121 = e72c148, T-123 a y c = 317ab0a). El carril A2 terminó (`relevo-paralelo.md`).
- **T-110 implementada entera y SIN REVISAR**, copia `.claude/worktrees/t-110`, rama `tarea/T-110`, rebasada sobre `main` (1a91bf6): 30ad58e (a y b: registro DCR, GET `/oauth/autorizar`) y 8e9d6e3 (c y d: POST `/oauth/autorizar`, `/oauth/token`). Ruta crítica OAuth: `revisor` y `auditor-seguridad` obligatorios. Después: hallazgos, evidencia, integrar.

## Falta, por orden
1. T-110: revisión, hallazgos, evidencia (`npx vitest run --maxWorkers=3` + tipos, estilo, aislamiento, arnés y build en 0 por separado), integración con `merge --squash`.
2. Tras T-110: **T-124** (`plataforma`, revisor): `agentRules: false` en `next.config.ts` (next dev/build/start escriben en `AGENTS.md`; si aparece, `git checkout -- AGENTS.md`, no commitear). Cambio de CI delegado (D-036, con dictamen del auditor): `actions/checkout` y `actions/setup-node` por SHA; `CODEOWNERS` sobre `.github/`, `.npmrc`, `package-lock.json`.
3. T-111 (`plataforma`; incluye exportación de sucesos por páginas u horas si el arquitecto la recomienda como código), T-112 (`qa`), T-113 (`disenador-ui`), T-117 (a) (`plataforma`, despliegue en `pre-nido`), T-119 (`qa`, navegador real), T-114 (`qa`, necesita AR-05 y AR-06: personas).
4. Un solo subagente opus a la vez; no lanzar dos suites completas a la vez (máquina justa de memoria).

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
Lanzar `revisor` sobre `tarea/T-110` (copia `.claude/worktrees/t-110`) y, en serie, `auditor-seguridad`.
