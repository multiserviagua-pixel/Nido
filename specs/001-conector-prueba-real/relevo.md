# Relevo del orquestador de la fase 1 · 19/11/2026 (tarde)

Ciclo: 001 y 002 en **DISEÑADA** (diseños de 39.692 y 39.675 bytes, tras tres vueltas del auditor: APTO CON CONDICIONES, sin bloqueantes; dictámenes `dictamen-diseno*.md` en cada carpeta). 003 APROBADA (D-019).

## Hecho
- Diseños rehechos y corregidos por apartado (D-023); comprobador SUPERADO (solo documental).
- Estado de 001 y 002 cambiado a DISEÑADA por el orquestador.

## Falta (un subagente a la vez, `arquitecto` con `model: "opus"`)
1. sdd-planificar de 002 (prioridad: esqueleto/package.json y arranque) y de 001: `plan.md` y `tareas.md` ≤25 KB cada uno, T-NNN con agente y prueba delante, `[P]` solo donde proceda. Incluir las tareas de contrato de la 001 (`readOnlyHint` y descripción del informe).
2. **P1 NO se abre por delegación** (dictámenes): 002 exige aceptaciones escritas del responsable A-1, A-3, A-4, A-14 d; 001 exige su respuesta expresa a `readOnlyHint: false` (RD-016), a R-7 (cuenta Max) y a R-8 (CAD-046 frente a 503 total tras el cierre: enmendar CAD-046 o conservar el grupo sin `OPERACION_HUELLA`).
3. Enmiendas cruzadas por registrar: REQ-019 y CA-021 de la 002 (A-1, firma del responsable); RD-023 del anexo 001 (E-1: duración, protocolo, asistente como valores cerrados); C-1 a C-6 (002/fase 2) citadas en el diseño 002 como cambio firmado pendiente; poner al día `propuestas-diseno/` (ADR: `arn1`, `Nido`, sin `mcp-handler`) y `docs/ESQUELETO.md`.
4. `pendiente-del-responsable.md`: quitar «crear nido-desarrollo», ajustar ChatGPT a D-021, añadir SQL en `Nido`, Claude Max, R-7, R-8, cuenta de Windows aparte, token de GitHub y credencial de GCM, `decision-pago` antes del 26/11.

## Observaciones del auditor para el responsable
`gh` tiene sesión activa con `repo`, `workflow`, `gist`, `read:org` y `.claude/settings.json` no restringe `gh` (cambiar ajustes es reservado, art. 14). Pesa en A-3/N-2 de la 002.

## Calendario
Prueba real ≥3 días antes del 22/11 (límite 23/11 08:00; Vercel de prueba hasta 27/11). Depende de `<dominio>` y de que el responsable abra P1 pronto.

## Reglas
Un solo subagente a la vez (D-018). Sin commits, push, cuentas ni secretos. Sin sleeps. Relevo a ~150k tokens.

## Plan acelerado (D-024, 19/11/2026) — manda sobre lo anterior
1. Terminar la corrección de los hallazgos del auditor en los diseños de 001 y 002 (≤ 40 KB). No hay segunda vuelta de auditoría sobre el diseño: la segunda revisión de seguridad será sobre el código.
2. `plan.md` y `tareas.md` de 002 y 001 (≤ 25 KB cada uno), tareas pequeñas con su prueba delante; abrir P1 por delegación.
3. Implementar en este orden: esqueleto (`package.json`, Next.js 16, Supabase local con la migración base y RLS), después `obtener_instrucciones`, `enviar_informe` y `confirmar_orden`, cada una con su prueba; después la autorización. Revisor en cada tarea; `auditor-seguridad` en las rutas críticas, sobre el código.
4. La 003 (CI) queda aplazada hasta después de la prueba real.
5. Hasta dos subagentes a la vez si las tareas están marcadas `[P]`. La fase 3 está parada: ningún otro chat escribe en `specs/00*`.

## Plan recortado (D-025, 19/11/2026, 20:15) — manda sobre todo lo anterior
El plan de la 002 escrito el 19/11 (53 tareas; camino mínimo de 39 tareas y 13 firmas) **no se sigue**. El plan y las tareas de la 001 escritos a las 20:12 dependen de él: se rehacen.
1. `arquitecto` (opus): en `specs/002-plataforma-base/diseno.md` cambia **solo** el apartado de integración y aprobaciones por D-025 (git normal + `npm run verificar` + revisor/auditor + «sí» del responsable). Mueve a un apartado «Aplazado a la 003» el sistema de firmas, ancla, delegaciones, `aprobar` y calendario. Rehace `plan.md` y `tareas.md` de la 002 con el camino corto (≈ 8–10 tareas): esqueleto (`package.json`, Next.js 16, TypeScript estricto, `npm run verificar`), Supabase local con migración base + RLS + pruebas de aislamiento (sobre `docs/MODELO-DATOS.sql`), configuración de entornos sin secretos.
2. Después, igual con `plan.md` y `tareas.md` de la 001: las tres herramientas del conector, una a una, y la autorización OAuth; despliegue en Vercel (arn1) y prueba real con la cuenta Claude Max.
3. P1 por delegación (D-019) y **empezar a implementar T-001 en el mismo chat**.
4. Calidad intacta: prueba primero, `revisor` en cada tarea, `auditor-seguridad` sobre el código en rutas críticas, aislamiento probado. Integración en `main` solo con el «sí» del responsable (pídelo agrupado). Sin push, cuentas ni secretos.

## Relevo de la sesión del 19/11/2026 (noche) — D-025 en marcha
**Hecho**
- 002: `diseno.md` (38 KB) con integración D-025 y «Aplazado a la 003»; `plan.md` y `tareas.md` rehechos (T-001 a T-010). P1 abierta por delegación (D-019) salvo T-007/T-008. Estado 002: PLANIFICADA.
- 001: `plan.md` (19 KB) y `tareas.md` (22 KB) rehechos, T-101 a T-164. P1 **parcial** (no T-150 ni AR-01). Estado 001: DISEÑADA. Alerta: 64 tareas, calendario del 23/11 en riesgo (DP-5).
- 002·T-001 en rama `tarea/T-001` (commits c2120c8, ee7a508). Revisor: 0 bloqueantes, 3 importantes. Auditor: APTO CON CONDICIONES (2 mayores, 2 menores). Corrección en curso (incremental en tsconfig, ESLint 9.39.5, bloqueo con espera de 7 días, prueba del manifiesto más estricta).
**Falta**
- Tras la corrección: segunda vuelta del revisor y del auditor solo sobre lo cambiado; anotar en `docs/TECNOLOGIAS.md` las versiones fijadas con fuente y fecha del 19/11 (la tabla está en el informe de plataforma), `"type": "module"` y la regla de espera de 7 días; subir al historial los documentos de specs/ antes de integrar (hallazgo 8 del revisor); pedir el «sí» agrupado para pasar a `main`.
- Decisiones del responsable: R-1 (migraciones/RLS fuera de la spec 002: T-007/T-008 bloqueadas), R-3, R-4, R-6; C-4 de la 001 (la excepción de `/oauth/autorizar` depende del orden de reglas en Next, «la última gana»); DP-1 a DP-5; AR-01.
**Siguiente paso**: T-002 (`ingeniero-frontend`), luego T-003; T-004 [P] con T-007 solo tras T-003.

### Actualización (misma noche): T-001 de la 002, segunda vuelta
Rama `tarea/T-001`, 6 commits locales (c2120c8 … da7853f), 16 pruebas en verde, `npm audit` 0, ESLint 9.39.5. **No integrable aún.** Dictámenes: revisor NO APTO; auditor APTO CON CONDICIONES. Pendiente, por este orden:
1. Excepción de 7 días demasiado amplia (D-027, ahora PROPUESTA): regenerar bloqueo con `--before=2026-11-12T23:59:59Z`, subir solo typescript-eslint a 8.73.0, `npm audit` en 0, lista de excepciones reducida con motivo por paquete (la prueba debe cerrar la estructura del JSON y hacer caducar `revisarDespues` con la fecha real; una fecha por excepción). Si no, vuelve al responsable.
2. `npm run tipos` falla hasta T-002 (falta `src/app`): decidir y anotar que la puerta de T-001 usa `tsc --noEmit` y que `tipos` completo se comprueba en T-002.
3. Commitear `docs/TECNOLOGIAS.md` (D-026, D-027) y los documentos de `specs/` en la rama antes de integrar (el revisor lo pide). Integrar con `merge --squash` (el commit 56ec76c deja la prueba en rojo).
4. Tras ello, tercera vuelta corta y «sí» del responsable para `main`.
Lección: no dar por buena una justificación de un subagente sin contrastarla (error mío con D-027).

### Actualización (tercera vuelta): T-001 de la 002, lista para el «sí»
Rama `tarea/T-001`, commits 791e81f, b80a11b, ea90d39, 4776b73 sobre da7853f. D-027 corregida y CONFIRMADA (bloqueo con `--before=2026-11-12T23:59:59Z`, única excepción typescript-eslint 8.73.0 ×11, `npm audit` 0); D-028 anotada (puerta de T-001 = `tsc --noEmit`; `npm run tipos` completo en T-002). Dictámenes de la tercera vuelta: revisor y auditor APTO CON CONDICIONES, sin bloqueantes; menores de prueba y D-027 ya corregidos. Pendientes del responsable: (1) «sí» para `main` con `merge --squash`; (2) aprobar cambio de CI (art. 14): vitest y `npm audit` en el CI y contraste de fechas con el registro; (3) la fila D-029 de `docs/TECNOLOGIAS.md` sigue sin commit y no es de este chat. La prueba de excepciones falla desde el 24/11 (salida en D-027).
