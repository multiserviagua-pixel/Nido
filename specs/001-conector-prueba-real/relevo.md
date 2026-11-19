# Relevo de la fase 1 · 19/11/2026, 22:20

Reescrito entero (regla «Relevo auténtico» de la skill `orquestar`). La historia está en `git log` y en `docs/TECNOLOGIAS.md`.

## Estado (comprobado en `main` a las 22:15)
- 002·T-001 (esqueleto) integrada en `main` con `merge --squash` y el «sí» del responsable: commit `f9f0494`. Rama `tarea/T-001` conservada.
- Arnés: D-023, D-029 y D-030 en `main`, commit `df885a6`.
- `npx vitest run`: 16 de 16 en verde. `npx tsc --noEmit`: sin errores. `npm audit`: 0 vulnerabilidades. `node scripts/comprobar-specs.mjs`: SUPERADO, con 27 avisos de tamaño.
- `npm run tipos` completo: sin comprobar; necesita `src/app`, que llega con T-002 (D-028).
- Dictámenes de la tercera vuelta de T-001: revisor y auditor APTO CON CONDICIONES, sin bloqueantes, según el informe del orquestador anterior. Este relevo no los ha contrastado.
- Estados: 002 PLANIFICADA, con T-001 hecha. 001 DISEÑADA, P1 parcial.

## Falta, por orden
1. **Reagrupar `specs/001-conector-prueba-real/tareas.md`** (64 tareas) en unas 15 (D-029), con el `arquitecto`. Recortar antes `plan.md` y `tareas.md` si el comprobador avisa.
2. 002: T-002 (páginas), T-003 (`npm run verificar`), T-004, T-005, T-006, T-009 y T-010. T-007 y T-008 bloqueadas por R-1.
3. D-030: tarea de `plataforma` para que el CI ejecute Vitest y `npm audit` y contraste las fechas de las excepciones con el registro. Es ruta crítica (CI): revisor y auditor.
4. 001: las tres herramientas del conector, después OAuth, el despliegue en Vercel `arn1` y la prueba real con Claude Max.

## Proceso (D-029)
Fuera de rutas críticas, prueba delante y `revisor`, sin relevo por tarea. En rutas críticas (OAuth y licencias, RLS y migraciones, webhooks, entrega del prompt, CI), revisor y auditor. Integración en `main` con el «sí» del responsable, pedido agrupado.

## Decisiones del responsable pendientes
- R-1: migraciones y RLS fuera de la spec 002. Se enmienda la 002 o se mueven a la 010; hasta entonces, T-007 y T-008 bloqueadas.
- R-3, R-4 y R-6 de la 002.
- C-4 de la 001: la cabecera de `/oauth/autorizar` depende del orden de reglas de Next 16 («la última gana»).
- DP-1 a DP-5 de la 001 (calendario; si el despliegue y la supervisión salen de la 001). AR-01 y T-150 sin P1.
- Push al remoto: sigue sin autorizar. Sin él, D-030 no se aplica.

## Avisos
- La prueba de excepciones de dependencias falla a partir del 24/11 por diseño (la salida está en D-027).
- eslint 9.39.5 figura como obsoleto en el registro de npm (nota del auditor; anterior a T-001).

## Siguiente paso
Chat nuevo de la fase 1: paso 1 de «Falta».
