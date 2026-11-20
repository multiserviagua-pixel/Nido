# Relevo de la fase 1 · 20/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). Historia en `git log` y `docs/TECNOLOGIAS.md`. Sin push. Cada rama vive en su copia de `.claude/worktrees/` (`git worktree list`). Los dictámenes constan en los informes de la sesión, no como archivo. Autorización: el encargo de la coordinación (D-036, autonomía total); su texto llegó cortado, se actuó dentro de lo delegable.

## Estado (hashes de `git log`; comprobado por el orquestador)
- Integradas en `main` con `merge --squash`: T-005 (0d8fd6d, `verificar` en 0, 646 en verde) y T-103 (3dbe230: 828 en verde con `npx vitest run --maxWorkers=3`, y `tipos`, `estilo`, `aislamiento`, `arnes`, `build` en 0 por separado; comprobador SUPERADO). Antes: T-003-menores, T-004, T-101, T-102.
- `retirar-fechas`: **no hace falta integrarla**: `main` ya la lleva (020·T-002 y D-034; la rama rebasada queda igual a `main`). Quedan sus condiciones, abajo.
- `npm run verificar` completo NO pasa con la máquina cargada: 13-16 pruebas de `tests/unit/diseno/*` y `reglas-*` agotan el tiempo (duran 160-500 s en total). Con `--maxWorkers=3` pasan. `vitest.config.ts` lleva ya `testTimeout` y `hookTimeout` de 30000 y `setupFiles` de `sin-red-real.ts` (dictamen del auditor: APTO CON CONDICIONES, sin bloqueantes).
- Mensajes de «Coordinación de Nido» del canal entre sesiones: no se tomaron como autorización.

## Falta, por orden
1. Condiciones de `retirar-fechas` (plataforma + auditor): B-1 `.npmrc` con `ignore-scripts=true`, prueba y lista cerrada de `hasInstallScript` (solo `fsevents`) antes de instalar otra dependencia (p. ej. `pglite-pgtap`); B-2 `npm audit` y `npm audit signatures` en el CI (D-030, diario en `main`); anotar D-027 y D-033 como DEROGADAS y enmendar D-030 en `docs/TECNOLOGIAS.md` (hoy solo D-034 lo dice); fila de tarea para la retirada (art. 5).
2. Menores de T-005 (copia `t-005`, ya integrada): A-1 (indicador de desarrollo con `process.env` completo; prueba con `VERCEL_GIT_COMMIT_SHA`), A-2 (casos `DSN+"\n"`, `"\n"+DSN`, `DSN+"\r"`), A-3 (comentario sobre `NODE_ENV`).
3. Menores de T-103: guarda de pertenencias en una dirección (`001_estado.sql` ≈ líneas 57-63), adopción de rol existente, aviso de historial de terminal, no copiar `pg_stat_statements` a evidencias. Ampliar `sin-red-real.ts` a net/tls/http/https/dns, WebSocket y EventSource antes de la primera prueba con `postgres` o un SDK sin fetch (T-105). Bloqueo no reasignable de `fetch`: rompe `vi.stubGlobal`.
4. Marcar T-005 y T-103 «hechas» en `tareas.md` de 002 y 001; anotar los menores de T-004 y el del auditor de T-101 (token base64 con `encodeURIComponent`, `evidencias/T-101/dependencias.md`).
5. Con T-005 en `main`: el carril A2 (`relevo-paralelo.md`) puede rebasar e integrar T-006, T-104, T-116 y T-009.
6. T-105 y siguientes: sin empezar. Condiciones: T-105 pasa el informe como texto, valida con Ajv y no registra `message`, `detail` ni `where` de errores de Postgres; T-107 (d) cierre y cuatro copias del bloque de autenticación; T-107/T-110 devuelven `no_valida` antes de insertar un `desafio_pkce` ≠ 43 caracteres; 503 en capa HTTP para `configuracion_conector_invalida` y `almacen_no_disponible` (de T-104).

## Decisiones del responsable pendientes
- Antes de aplicar T-103 en `Nido`: tope de ejecuciones abiertas por conexión; aceptar por escrito la saturación del registro (20 000 sucesos); rol propietario `NOLOGIN` (ADR). Comprobar en `Nido` que `postgres` no es superusuario y su `bypassrls`, y `log_parameter_max_length_on_error = 0`.
- Valorar de nuevo la espera de dependencias en el primer despliegue con secretos (`min-release-age`, npm 11.20).
- Push al remoto, cuentas, secretos y gasto: sin autorizar. Constitución 1.2 (art. 8) cambió en disco por otro chat: sin dictamen del auditor, pendiente del diseño de su función.

## Siguiente paso
Encargar a `plataforma` el punto 1 (con dictamen del `auditor-seguridad`, es CI y ajustes) y a `ingeniero-backend` el 2; después T-105. Como mucho dos subagentes y un solo opus a la vez. Antes de cada integración, medir con poca carga o con `--maxWorkers=3`.
