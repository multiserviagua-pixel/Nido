# Relevo del carril A2 (paralelo a Fase 1 j) · 21/11/2026

Alcance: 002·T-006, T-009, T-010; 001·T-104, T-115, T-116, T-118 (a), T-121, T-122, T-123. Sin push. Un solo opus a la vez. Los dictámenes viven en los informes de sesión y en `evidencias/` de la 002, no aquí. `specs/016-compuerta-envio-por-regla/` y `marketing/` son de otro chat; tareas T-109 a T-114 y T-117 son de Fase 1 j.

## Integrado en `main` (por D-036, 21/11/2026; copias y ramas del carril retiradas)
- T-115 (4ae33b7), T-118 (a) (6c1473e), T-006 (50b01c3), T-104 (fafaa91), T-116 (6a47fe4), T-009 (d852217): ya constaban.
- 56555dd (reformulación de PRUEBA-059 y PRUEBA-024, tareas T-011, T-012, T-121 a T-123), T-122 (913ec82), T-011 y T-012 (9e629f1): del chat anterior.
- **002·T-010** → `f108bb8`. 2.ª pasada sobre `9e629f1` superada (`evidencias/T-010/informe-r2.md`). PRUEBA-055: 5 de 8 con la cadena completa y 3 de 8 (casos 6, 7 y 8) con el paso del defecto ejecutado solo, anotado así (Node sin memoria con la máquina cargada). PRUEBA-024: `start` con entorno ficticio 7 de 7; `POST /` da 200 en `npm run dev` y con `application/x-www-form-urlencoded` (comportamiento de Next, sin acciones de servidor en `src/`), criterio precisado en la tabla. PRUEBA-059: el revisor halló 1 bloqueante (T-011 y T-012 sin carpeta de evidencias); resuelto con `evidencias/T-010`, `T-011` y `T-012` a posteriori; alcance de la prueba precisado (solo cuentan las integraciones de tarea; `56555dd` y `b25a1a1` quedan fuera). Revisor: sin más bloqueantes ni mayores.
- **001·T-121** → `e72c148`. Patrón «DSN de Sentry» en `scripts/patrones-secretos.mjs` con `tests/unit/plataforma/patrones-supervision.test.ts` (7 pruebas, en rojo antes). Revisor sin bloqueantes ni mayores; auditor APTO. Menores abiertos, tarea aparte: patrón `sentry_key=<32 hex>` (cabecera `X-Sentry-Auth` y URL del SDK, hoy no se detecta, y el propio producto lo envía en `supervision.ts`); variante más barata `(?<=[0-9a-f]{32})(?:@|%40)…` (2 MB de hexadecimales: 1,35 s frente a 10 ms); caso de JSON con barras escapadas.
- **001·T-123 (a) y (c)** → `317ab0a`. Pruebas de la decisión A en `validar.test.ts` (20 de 20); mutaciones (oráculo, revocar, borrar token, mal formado, `cierre`) fallan. Revisor sin bloqueantes ni mayores; auditor APTO CON CONDICIONES, menores aplicados (la lista de tablas ahora es la de `./comun`, con `cierre`). (c) se cumple por la lista cerrada `FUNCIONES_GESTION` y una prueba estática; cuando una ruta de gestión registre sucesos hará falta una prueba en esa ruta de que pasa `tokenHmac: null`.

## Pendiente
- **T-118 (b)**: espera a personas (AR-03, AR-04, AR-08). Nada que ejecutar hasta que respondan; la parte (a) (guion fechado, calendario y plantillas) está en `main` (6c1473e) y su rama ya está retirada.
- **T-123 (b)**: el endurecimiento `t.tipo = 'acceso'` en `registrar_suceso` NO se aplica; irá con la próxima reaplicación de SQL en `Nido` (R-2, persona).
- T-116: M2 (`after()` de next/server) para el despliegue (CAD-034); activar «no almacenar IP» en Sentry UE (persona).
- Personas: crear proyecto Sentry UE (DP-2); generar `CONECTOR_SECRETO` (comando en `docs/operacion/entornos.md`); en preproducción, URL de BD con puerto 6543 y variables de sistema de Vercel; punto 12 del ADR-0007 (revocar concesiones ajenas a `PUBLIC`, R-2).

## Hallazgos ajenos al carril, para quien corresponda
- `tests/unit/diseno/acceso-muestra.test.ts` (función 020) agota 30 s bajo carga; `verificar` es inestable en esta máquina (con 14 trabajadores V8 se queda sin memoria; con `--maxWorkers=3` pasa, 340 s Vitest, 567 s `verificar`).
- `next dev`, `build` y `start` escriben un bloque en `AGENTS.md` (`agentRules: false` en `next.config.ts`, relacionado con el art. 14; tarea aparte con revisor).
- `npm run tipos` falla tras `npm run dev` por tipos obsoletos en `.next/dev`; pasa tras borrar `.next`.
- Procesos `node` ajenos de la sesión del 20/11 (`next start -p 3411`, pids 3240 y 27932) y clones `C:\dev\qa-t010\` y `C:\dev\qa-t010b\`: se pueden parar y borrar.

## Siguiente paso
Nada propio del carril A2 queda por ejecutar sin una persona. Si se retoma: tarea aparte del patrón `sentry_key=`; T-118 (b) cuando haya respuesta de AR-03, AR-04 y AR-08.
