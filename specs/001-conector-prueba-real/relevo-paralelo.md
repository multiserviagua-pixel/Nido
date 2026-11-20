# Relevo del carril A2 (paralelo a Fase 1 d) · 20/11/2026

Alcance: 002·T-006, 001·T-104, T-115, T-116, T-118 (a), 002·T-009 y T-010. Sin push. Cada rama en su copia de `.claude/worktrees/` (`git worktree list`). Un solo opus a la vez. Los dictámenes viven en los informes de sesión, no en archivos.

## Integrado en `main` (por D-036, `verificar` en 0 por el orquestador)
- T-115 (001) → 4ae33b7 (243 de 243). Revisor y auditor APTO CON CONDICIONES, aplicadas. AR-01 registrada en diseño, plan y aclaraciones.
- T-118 (a) (001) → 6c1473e (339 de 339). Revisor APTO, 6 menores aplicados. La parte (b) espera a AR-03, AR-04 y AR-08 (personas).

## Hechas y dictaminadas, SIN integrar (apiladas sobre `tarea/T-005`, que es de Fase 1 d y aún no está en `main`)
Pila: `tarea/T-005` → `tarea/T-006` (8539fd3) → `tarea/T-104` → `tarea/T-116`; `tarea/T-009` sale de `tarea/T-006`. Al entrar T-005 en `main`: rebasar cada una (`git rebase --onto main <base anterior>`), repetir `npm run verificar` y `merge --squash` en orden T-006, T-104, T-116, T-009, con la carpeta principal limpia.
- **T-006** (002, copia `t-006`): revisor y auditor APTO CON CONDICIONES, corregido (15 de 15). `Estado` en tareas.md de 002: pendiente de cambiar a «hecha» al integrar.
- **T-104** (001, copia `t-104`, partes a a e): revisor APTO CON CONDICIONES; auditor 2.ª vuelta APTO, 3 menores aplicados (e26f6e9, 012ba5b); `verificar` en 0 con 408 pruebas. `Estado` en tareas.md: cambiar a «hecha» al integrar. Condiciones para T-105: 503 en capa HTTP para `configuracion_conector_invalida` y `almacen_no_disponible`; propuesta (arranque.md contiene las palabras de la lista prohibida, en negativo: no tocar por la huella).
- **T-116** (001, copia `t-116`, partes a y b): revisor APTO CON CONDICIONES (aplicadas) y auditor APTO sin bloqueantes ni mayores; sus menores M1 (límite por huella), M3 y M4 aplicados en 2a96561 y f634a60; `verificar` en 0 (435 pruebas). Pendiente M2 (`after()` de next/server para no perder el evento tras responder) para el despliegue (CAD-034). La persona debe activar «no almacenar IP» en el proyecto Sentry UE.
- **T-009** (002, copia `t-009`): revisor APTO CON CONDICIONES (3 MAYOR de contenido, ya aplicados en a6349be y aa01c28; 9 de 9); `verificar` en 0 según el revisor antes de los cambios. Avisos: la guía debe anotar el hash del primer commit integrado cuando exista; Next 16.4.6 escribe en AGENTS.md al ejecutar `npm run dev` un agente (`agentRules: false` en next.config.ts, ruta reservada). `docs/operacion/**` es reservada.

## Sin empezar
- **002·T-010** (qa, clon limpio de `main`): depende de T-009 integrada en `main`.
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
Dictamen del `auditor-seguridad` sobre T-116; revisión de T-009; integrar lo apilado cuando T-005 esté en `main`; después 002·T-010 y, con las personas, T-118 (b).
