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

## 002·T-010 (qa, 20/11/2026): NO superada, `Estado` sigue «pendiente»
Evidencias en `specs/002-plataforma-base/evidencias/T-010/` (resumen en `informe.md`). Comprobado por el orquestador: `main` no tiene ninguna carpeta `evidencias/` de la 002; la guía no menciona `npm run start`.
1. **PRUEBA-059 falla**: los commits `(002)` T-001 a T-009 no llevan `evidencias/T-NNN/` con `verificar.md`, `revision.md`, `aprobacion.md` y `dictamen.md`; T-002 y T-003 comparten commit; la constancia D-036 solo está en T-005, T-006 y T-009. Decisión de coordinación: reformular el criterio (evidencias desde T-005) o rellenarlas a posteriori con lo que consta, sin inventar.
2. **PRUEBA-024 falla en 2 de 7**: `/api/salud` da 503 tras `npm run start` con `ENTORNO=desarrollo` (`next start` fija `NODE_ENV=production`; cierra en fallo, coherente con el diseño). Con entorno no-desarrollo ficticio pasan 7 de 7. Reformular el criterio o la guía (`docs/operacion/**` es reservada: tarea aparte).
3. **`acceso-muestra.test.ts` (función 020) agota 30 s bajo carga** (5 de 7 pasadas completas); solo, 8,6 s. `verificar` es inestable en esta máquina: un rojo puede ser falso. Dueño: función 020.
4. PRUEBA-055: 8 de 8 defectos dan salida distinta de 0 (los pasos `aislamiento`, `arnes` y `build` se ejecutaron por separado). `verificar` verde en 310 s (Vitest 250 s); `npm ci` 118 s. T-008 sigue bloqueada (R-1).
Los clones de qa en `C:\dev\qa-t010\` se pueden borrar.
