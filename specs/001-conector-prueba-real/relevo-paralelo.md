# Relevo del carril A2 (paralelo a Fase 1 d) · 20/11/2026

Alcance: 002·T-006, 001·T-104, T-115, T-116, T-118 (a), 002·T-009 y T-010. Sin push. Cada rama en su copia de `.claude/worktrees/` (`git worktree list`). Un solo opus a la vez. Los dictámenes viven en los informes de sesión, no en archivos.

## Integrado en `main` (por D-036, `verificar` en 0 por el orquestador)
- T-115 (001) → 4ae33b7 (243 de 243). Revisor y auditor APTO CON CONDICIONES, aplicadas. AR-01 registrada en diseño, plan y aclaraciones.
- T-118 (a) (001) → 6c1473e (339 de 339). Revisor APTO, 6 menores aplicados. La parte (b) espera a AR-03, AR-04 y AR-08 (personas).

## Integradas en `main` tras entrar T-005 (por D-036, 20/11/2026; `verificar` en 0 en cada copia tras rebasar)
- T-006 (002) → 50b01c3 (661 pruebas). T-104 (001) → fafaa91 (758). T-116 (001) → 6a47fe4 (952). T-009 (002) → d852217 (961). `Estado` de las cuatro ya en «hecha».
- Pendiente de T-116: M2 (`after()` de next/server) para el despliegue (CAD-034); la persona activa «no almacenar IP» en Sentry UE.
- Condiciones de T-104 para T-105: 503 en capa HTTP para `configuracion_conector_invalida` y `almacen_no_disponible`.
- La guía (`docs/operacion/GUIA.md`, línea 79) aún pide anotar el hash del primer commit integrado por el procedimiento; `docs/operacion/**` es reservada.
- Aviso: bajo carga las pruebas de PGlite agotan los 5 s sin ser fallos; con `--maxWorkers=1 --testTimeout=60000 --hookTimeout=60000` pasan todas. Next 16.4.6 escribe en AGENTS.md con `npm run dev` (`agentRules: false`, ruta reservada).

## Sin empezar
- **002·T-010** (qa, clon limpio de `main`): lanzada con T-009 ya en `main`; resultado pendiente.
- T-118 (b): personas (AR-03, AR-04, AR-08).

## Para la coordinación / el responsable
1. T-005 (Fase 1 d) bloquea la integración de T-006, T-104, T-116 y T-009.
2. Propuesta: código propio `prompt_no_valido` en C-2 (el prompt alterado hoy usa `configuracion_conector_invalida`).
3. Duda abierta: si el HMAC del token (ADR-0003 punto 4) vale para `registrar_suceso`.
4. `scripts/patrones-secretos.mjs`: patrón de DSN de Sentry (ruta crítica; tarea aparte).
5. Personas: crear proyecto Sentry UE (DP-2) con «no almacenar IP»; generar `CONECTOR_SECRETO` (43 caracteres base64url, comando en `docs/operacion/entornos.md`); en preproducción las URL de BD usan el puerto 6543 y deben exponerse las variables de sistema de Vercel.
6. Resumen al responsable (D-036): AR-01 decidida por delegación, con el límite m-3 vigente solo hasta el cierre de la 001; punto 12 del ADR-0007 (revocar concesiones ajenas a `PUBLIC`: la ejecuta una persona, R-2).
7. `specs/001-conector-prueba-real/relevo.md` es de Fase 1 d: no se ha tocado.

## Siguiente paso
Resultado de 002·T-010; después, con las personas, T-118 (b).
