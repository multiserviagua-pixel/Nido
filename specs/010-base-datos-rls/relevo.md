# 010 · Relevo (20/11/2026, fin del chat del carril B, 2.ª parte)

Chat de la fase 2, función 010. Empieza por este archivo. `Estado: EN CURSO`. La carpeta principal sigue en `main`. Sin push.

## Estado

- **T-001 integrada en `main`** (88001ca, `merge --squash`, aprobada por delegación D-036 el 20/11/2026). Cinco vueltas de dictamen en `evidencias/T-001/dictamenes.md`; la última del auditor, APTO. Rama `tarea/010-T-001` y `-v3` apuntan a lo integrado (1d31923, el contenido está en 88001ca).
- **Propuesta 34 aceptada** (D-036) y anotada en D-1 y D-9 R-4. L 14 = forma de las sentencias; el entorno pasa a L 15. `diseno.md` pesa ~40,7 KB (aviso del comprobador, SUPERADO).
- **Propuesta 33**: `npm test` tres veces en la rama rebasada: 2 de 3 limpias; la que falló fue `tests/conector/apoyo.test.ts` (001) por 5 s de espera, no `reglas-eslint.test.ts`. No se puso límite de 30 s, porque la prueba de la 002 no falló. Queda anotado para la fase 1: `apoyo.test.ts` se agota si coincide con PGlite. Las demás ejecuciones de `npm run verificar` han salido en verde (exit 0).
- **T-002 integrada en `main`** (e48328a, aprobada por delegación D-036, 20/11/2026): M02, M03, detector del MENOR A (rechaza todo `declare` posterior al inicial) y revoke de USAGE de los 17 tipos. Dictámenes en `evidencias/T-002/dictamenes.md` (revisor y auditor APTO CON CONDICIONES, auditor APTO en la vuelta 2). `npm run verificar`: 382 pruebas, 45 de 45 comprobaciones, exit 0. Rama `tarea/010-T-002` (worktree `.claude/worktrees/agent-a6f16c114aa232f45`) queda como está.
- Mensaje de la coordinación (relevo de Nido): **T-003 NO está bloqueada**. La enmienda de `search_path` (D-035) está en `main` desde 9eb19fd y el aviso a la 001 entró en 900b4ee; verificado por mí (9eb19fd es ancestro de `main`). Sigue con T-003.

## Falta (en orden)

1. **T-003 (M04 `auditoria` y M05 `versiones_prompt`, protegidas)**. Antes de encargarla, una decisión de diseño que el arquitecto debe resolver (la dejó anotada en `tareas.md`, Convenciones): las funciones de M04, M07 y M08 llevan cuerpos con `declare` propio y, si declaran tipos de `public`, la regla del detector (solo `pg_catalog`) los rechazaría. Opciones: exigir `pg_catalog` también ahí, o permitir tipos calificados dentro de cuerpos `$f$` con su propio `search_path`. El detector `esDoConGuarda` (`tests/unit/bd/estaticas.test.ts`) hoy rechaza todo `declare` posterior; hay que ampliarlo con prueba negativa en rojo antes (condición MENOR A). Cambio de rutas críticas: dictamen del `auditor-seguridad` además del `revisor`. Sigue la regla de un solo subagente opus a la vez y D-1 con un único `do`.
2. Pendientes anotados de T-002 para tareas posteriores: M07 debe conceder `USAGE` explícito en los tipos que cada rol necesite; MENOR 2 del auditor (caracteres de control y bidireccionales en `clientes.nombre` y `catalogo_problemas.descripcion`) al `arquitecto` (D-7) antes de M04; MENOR 3 (registro dinámico OAuth) a la fase 3; `tokens.sustituido_por` para M08; `docs/MODELO-DATOS.sql` desalineado (propuesta 20: cierre o T-015); `^[!-~]{1,300}$` implementado como `char_length <= 300` y `+` (anotar en D-7).
3. Pasar `comprobaciones-cli.md` a `verificaciones.md` (comprobaciones 1 y 3 confirmadas; 2 por código fuente sin ejecutar; 4 VERIFICAR en T-013).
4. Instalar `pglite-pgtap` 0.0.18 en T-008 (verificada, no instalada).

## Siguiente paso

Chat nuevo que empiece por este archivo: punto 1 de «Falta» (arquitecto sobre `declare` en funciones, luego T-003 con `ingeniero-bd`), con un solo subagente opus a la vez. Al integrar en `main`, mismo procedimiento que T-001 y T-002: `npm run verificar` en verde, dictámenes registrados en `evidencias/T-NNN/`, `merge --squash` con mensaje `T-NNN (010): ...`.
