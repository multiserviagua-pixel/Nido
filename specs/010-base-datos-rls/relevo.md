# 010 · Relevo (20/11/2026)

Chat de la fase 2, función 010. Empieza por este archivo y lee solo lo que indica.

## Estado

- `especificacion.md`: `Estado: PLANIFICADA`. P1 abierta por el responsable el 20/11/2026 (respuestas expresas en el chat); anotada en la tabla de aprobación de `plan.md`.
- `diseno.md` (≈39 KB): dictamen vuelta 2 `specs/010-base-datos-rls/dictamen-diseno-2.md`: APTO CON CONDICIONES, 0 bloqueantes (N-1 a N-8 repartidos en tareas). Vuelta 1: `dictamen-diseno.md`.
- `plan.md` y `tareas.md`: 15 tareas T-001 a T-015 (T-013 `plataforma` y T-014 `qa` con pasos de una persona, reservadas, art. 14). Todos los REQ y CA aparecen en `tareas.md` (comprobado por mí).
- Decisiones de P1: `bd.yml` y protección de `main` sí; `@electric-sql/pglite-pgtap` 0.0.18 ya (D-034); enmienda de `search_path = pg_catalog, pg_temp` con alcance N-1 y CA-009/REQ-012 con lista residual; cliente de baja sin reactivar; `service_role` solo sobre `versiones_prompt`; riesgo residual de `postgres`; políticas en M07 y pgTAP en T-008 a T-011; rutas de `ingeniero-bd` autorizadas por el encargo.
- Sin comprobar: ninguna prueba (no hay código). Sin commits ni cambios de rama míos.

## Falta (en orden)

1. Retoques menores de `diseno.md` por apartado, sin añadir volumen (arquitecto): texto de N-2(a) y N-6 en D-3; N-5 en D-9 R-4; N-8 en D-1 y D-10; recuento de pruebas (1.351) antes de T-015; cinco archivos que faltan en «Piezas»; lista cerrada de esquemas de plataforma (N-1); escáner de secretos en CA-020.
2. Una persona enmienda `.claude/rules/bd.md`, ADR-0003, `ingeniero-bd.md`, `migracion-bd`, `docs/SEGURIDAD.md` y `docs/TECNOLOGIAS.md` (`search_path`, propuesta 29) antes de T-003, y la coordinación avisa a la 001 antes de que aplique SQL en `Nido`.
3. `sdd-implementar` T-001 (una tarea cada vez, `ingeniero-bd`, prueba delante; luego `revisor` y `auditor-seguridad`).

## Decisiones del responsable pendientes

Ninguna de P1. Pendiente de una persona: las enmiendas del punto 2 y la instalación de `pglite-pgtap` tras verificar su README con Node 26 (`verificar-decision`).

## Siguiente paso

Retoques del diseño (punto 1) y después T-001. `propuestas.md` n.º 17 a 32 las traslada la coordinación a los documentos compartidos.
