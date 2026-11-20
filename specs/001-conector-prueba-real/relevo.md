# Relevo de la fase 1 · 20/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). Historia en `git log` y `docs/TECNOLOGIAS.md`. Sin push (lo hace la coordinación). Cada rama vive en su copia de `.claude/worktrees/` (`git worktree list`). Los dictámenes constan en los informes de la sesión, no como archivo. Autorización: encargo de la coordinación (D-036, autonomía total, sin pausas). Decisiones de la coordinación del 20/11 ya anotadas en `plan.md` («Aprobación»).

## Estado (hashes de `git log`; comprobado por el orquestador)
- Integradas en `main` con `merge --squash`, evidencia con `npx vitest run --maxWorkers=3` más `tipos`, `estilo`, `aislamiento`, `arnes` y `build` en 0 por separado: T-003-menores, T-004, T-101, T-102, T-005 y T-103 (antes); **T-120** (4f684f3: `.npmrc` con `ignore-scripts=true`, `npm ci --ignore-scripts`, `npm audit`, `npm audit signatures`, Vitest de `tests/unit/plataforma` y diario en el CI; revisor y auditor sin bloqueantes ni mayores); **menores de T-005** (5a1b9ab: A-1, A-2, A-3; revisor sin bloqueantes); **T-105** (eabb959: almacén, tres herramientas y `/api/mcp`; revisor y auditor, 2 mayores de cada uno aplicados; 1775 en verde). El carril A2 integró T-006, T-104, T-116 y T-009.
- `tareas.md` de 001: T-101 a T-105, T-115, T-116, T-118 (a) y T-120 «hecha»; `tareas.md` de 002: T-004 y T-005 «hecha».
- **En curso**: T-107 (`ingeniero-bd`, copia `t-107`, rama `tarea/T-107`), partes a-d más las condiciones de abajo.

## Falta, por orden
1. **T-107** (en curso): al volver, comprobar yo mismo, `revisor` y `auditor-seguridad` (SQL), aplicar hallazgos, rebasar sobre `main`, integrar. Condiciones: `desafio_pkce` de longitud distinta de 43 → `no_valida` antes de insertar; cierre de (d) y las cuatro copias del bloque de autenticación idénticas (con prueba); menores de T-103 (guarda de pertenencias en una dirección, adopción de rol existente, aviso del historial de terminal, no copiar `pg_stat_statements` a evidencias).
2. **T-106** (`plataforma`, R, trazado y región: `next.config.ts`, `vercel.json`, `.vercelignore`; `installCommand` `npm ci --ignore-scripts`). Lleva además `process.cwd()` para `raiz-supabase.crt`: comprobar que la traza de `next build` lo incluye.
3. **T-108** (`ingeniero-backend`, C), **T-109** (`ingeniero-frontend` + `disenador-ui`), **T-110** (C), **T-111** (`plataforma`, C, Res.), **T-112** (`qa`), **T-113** (`disenador-ui`), **T-114** (`qa`, necesita AR-05 y AR-06: personas), **T-117 (a)** (`plataforma`; depende de T-106 y DP-1). Condiciones: T-107/T-110 devuelven `no_valida` antes de insertar `desafio_pkce` ≠ 43; T-110 y siguientes mantienen 503 en capa HTTP para `configuracion_conector_invalida` y `almacen_no_disponible` (ya hecho en `manejador.ts`).
4. Anotar los menores de T-004 y el del auditor de T-101 (token base64 con `encodeURIComponent`, `evidencias/T-101/dependencias.md`) donde corresponda al cerrar.
5. T-005 en `main` desbloqueó T-010 (002, `qa`, carril A2 en curso en otro chat).

## Condiciones abiertas que no son código
- Para el primer push (coordinación): fijar `actions/checkout` y `actions/setup-node` por SHA (V-115); definir quién recibe el aviso del CI diario (función 003); `CODEOWNERS` sobre `.github/`, `.npmrc`, `package-lock.json`; poner el resto de Vitest en el CI (tarea de «CI completo», aún sin identificador).
- `docs/TECNOLOGIAS.md` lo toca solo la coordinación: anotar D-027 y D-033 derogadas y enmendar D-030 (hecho en el CI: `npm ci`, `npm audit`, firmas, Vitest de plataforma; pendiente: resto de Vitest).
- Antes de aplicar T-103 en `Nido` (decisiones ya tomadas por D-036): rol propietario `NOLOGIN`; saturación del registro a 20 000 sucesos aceptada; el tope de ejecuciones abiertas por conexión lo fija el arquitecto (opción recomendada) y lo decide la orquestación; en AR-05 la persona comprueba `postgres` sin superusuario ni `bypassrls` y `log_parameter_max_length_on_error = 0`.
- Espera de dependencias: se revalora en T-117 (`min-release-age`, npm 11.20).
- Constitución 1.2/1.3 (art. 8, D-037) y `specs/016`: de otro chat; no se tocan.
- Observaciones de T-105 sin tarea: el plazo de 5 s del almacén no cancela la consulta en cola (A-22; `statement_timeout`); `console.warn` fijo del SDK; `notifications/cancelled`, `resources/*`, `prompts/*` y `subscriptions/listen` dan -32601 (lista cerrada de métodos); postgres.js sigue con TLS aunque el servidor responda `N` (dictaminado sin riesgo, con prueba); prueba L pendiente de postgres.js contra el agrupador de Supabase (V-107). Las pruebas de PRUEBA-007 con concurrencia real quedan para la 008 (L).

## Siguiente paso
Esperar a `ingeniero-bd` (T-107) y seguir el punto 1. Como mucho un subagente opus a la vez. Antes de cada integración: rebasar sobre `main`, `npx vitest run --maxWorkers=3` y el resto por separado, comprobador y `git add` con rutas explícitas (carpeta principal con cambios ajenos sin commitear: `marketing/`, `specs/016-…`, `specs/002-plataforma-base/evidencias/`).
