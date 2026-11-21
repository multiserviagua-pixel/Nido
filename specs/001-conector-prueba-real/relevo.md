# Relevo de la fase 1 · 21/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). Historia en `git log` y `docs/TECNOLOGIAS.md`. Sin push (lo hace la coordinación). Cada rama vive en su copia de `.claude/worktrees/`. Autorización: encargo de la coordinación (D-036, autonomía total, sin pausas). Prioridad: la prueba real del conector; la prueba Pro de Vercel acaba el 27/11.

## Estado (comprobado por el orquestador al reescribir)
- Integradas en `main`: T-101 a T-109 y T-115, T-116, T-118 (a), T-120 a T-123 (a)(c) (ver `git log`; T-109 = 1d7dc4b, T-122 = 913ec82, T-121 = e72c148, T-123 a y c = 317ab0a). El carril A2 terminó (`relevo-paralelo.md`).
- **T-110: revisada y corregida, EN `main` pero SIN la evidencia de integración completa.** Revisor: APTO CON MENORES (sin bloqueantes ni mayores). Auditor-seguridad: APTO CON CONDICIONES (1 mayor: un solo origen puede ocupar el cupo global de 1000 solicitudes vigentes de `abrir_solicitud` vía GET `/oauth/autorizar`; menor: avalancha sobre el rol de gestión). Decisión D-036 de la orquestación (21/11/2026): se resuelve con regla de límite por IP del WAF de Vercel para `/oauth/*` (igual que `/api/operacion`), **condición previa del despliegue de T-117 y comprobación de T-119**; la alternativa (límite por origen en `abrir_solicitud`, SQL de T-107) queda si el WAF no basta. Menores aplicados en la rama (commit de correcciones: pantalla «no disponible» con almacén caído, tope 64 sin duplicar, WWW-Authenticate, state obligatorio, texto «continúa solo si has empezado tú», CSP frame-ancestors en respuestas sin pantalla, plazo de la prueba inestable). Aceptados sin cambio: asistente del campo oculto tomado del formulario al repetir tras código erróneo (solo el propio navegador; Origin propio); riesgo residual del enlace de autorización ajeno (auditor 3), mitigado por el texto y `listar_conexiones`; anotarlo en la tabla de amenazas del diseño.
- **Incidente de integración:** hice `git merge --squash tarea/T-110` en `main` y lancé `npx vitest run --maxWorkers=3`; el sistema la mató por memoria baja. Antes de que pudiera deshacer el índice, el chat de la Fase 3 (020) hizo el commit **e44def3** («020: plan.md anota H-1…») que arrastró todo T-110 (22 archivos). Resultado: el código de T-110 está en `main` (sin push) bajo ese mensaje, sin que corra la suite completa tras las correcciones. NO reescribir historial. Pendiente: con la máquina libre, `npx vitest run --maxWorkers=3` y `tipos`, `estilo`, `aislamiento`, `arnes`, `build` por separado en `main`; si pasa, anotar en un commit de documentación que T-110 queda integrada con esa evidencia (por delegación D-036) y marcarla «hecha» en `tareas.md`. Revisor y auditor revisaron la versión previa a las correcciones; las correcciones son menores y las revisé yo en el diff, pero conviene un vistazo del `revisor` a ese commit (215a023 en la rama, ahora rebasada).

## Falta, por orden
1. T-110: solo la evidencia de integración (ver incidente arriba).
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
Parada por memoria baja de la máquina, no por decisión pendiente. Con la máquina libre: evidencia de T-110 en `main`; después T-124 y el CI (SHA, CODEOWNERS), T-111, T-112, T-113, T-117 (a). Un solo subagente opus a la vez; no lanzar dos suites a la vez.
