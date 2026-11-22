# 025 · Plan

Autor: `arquitecto` · Fecha: 22/11/2026

Diseño: `diseno.md`, puesto al día el 22/11/2026 (DISEÑADA). Dictamen del `auditor-seguridad` (rutas críticas «RLS y migraciones» y «entrega del prompt»): APTO CON CONDICIONES, vuelta 1 (`dictamen-diseno.md`), sin bloqueantes ni mayores; sus menores m-1 a m-5 son condiciones de T-006, T-007, T-008, T-010, T-011, T-021 y T-024 (`diseno.md`, «Dictamen vuelta 1»). **P1 abierta por delegación D-036 el 22/11/2026** (revisor: APTO CON MENORES, corregidos); función PLANIFICADA. Especificación DISEÑADA, con una enmienda mecánica en CA-010 y la enmienda E-1 pedida (`propuestas.md`, P25-01). Ficha F-1 para el responsable, que no bloquea la P1. 24 tareas en siete bloques (`tareas.md`). **No se ha ejecutado ninguna prueba.** El comprobador (`node scripts/comprobar-specs.mjs`) se ejecutó el 22/11/2026: SUPERADO, documental. El catálogo de pruebas (PRUEBA-001 a PRUEBA-018) y cada criterio con su prueba están en `diseno.md`, «Pruebas»; aquí no se copian.

## Orden de trabajo

### Los bloques, en orden

| Bloque | Tareas | Qué deja hecho | Por qué va ahí |
| --- | --- | --- | --- |
| 0. Especificación | T-001 | Enmienda E-1 aprobada | El texto del aviso de baja no puede ir por delante de la especificación (art. 5) |
| 1. Previas | T-002, T-003 | T-P1 y T-P2 con evidencia | Deciden si `jsonb` llega intacto y qué pruebas de la 010 cambian |
| 2. Pruebas delante | T-004, T-005 | Estática con trampas, fuente ficticia y arnés de navegador | La prueba existe antes que el código que cierra |
| 3. Base de datos | T-006 a T-011 | M25-1 a M25-3, juegos, varias conexiones y alta con reglas | La base de datos decide quién escribe, qué y cuándo |
| 4. Servidor | T-012 a T-014 | Catálogo, textos, diferencias, entrada, fuente y acciones | Las pantallas solo llaman a esto |
| 5. Pantallas | T-015 a T-018 | Valores y formulario, diálogos, historial y sección | Última capa |
| 6. Verificación | T-019 a T-024 | Accesibilidad y textos, pruebas B, agente, volumen, privacidad, `verificacion.md` | Con CI, conector y entorno previo |

### Etapas (`diseno.md`, «Construcción en etapas»)

A, en la muestra de la 020 con la fuente ficticia: T-004, T-005, T-012, T-013, T-015, T-016, T-017 y T-018 (a); cierra solo evidencia de interfaz. B, con M24-1 y M25-1 a M25-3 en CI (`bd.yml`, 010·T-013) y las funciones de la 021, 022 y 024 integradas. C, conector de la fase 2 con P25-03. D, entorno previo con volumen (D-016).

### Qué va en paralelo

- **Antes de P1** (solo evidencia, no producto): T-001, T-002 y T-003, `[P]` entre sí.
- **Tras P1, `[P]`:** T-004, T-005 y T-012. T-013 tras T-012. T-015, T-016 y T-017 a la vez en cuanto estén T-005 y T-012 (componentes y archivos distintos; los textos los deja T-012).
- **Bloque 3 en serie:** T-006 → T-007 → T-008 (un archivo de migración por tarea, que no se edita después de integrado). T-009 tras T-007. T-010 tras T-007 y 022·T-019. T-011 tras T-006 y 022·T-013.
- **Regla de orden:** M25-1 se integra **después de M24-1** (024·T-009, su DD-37) y **antes de 022·T-013** (O-1 llama a `reglas_por_defecto()`). M25-3 solo con P25-03 integrada en la fase 2.
- **Bloque 4:** T-014 tras T-013, T-007 y la guardia de la 021; su parte de LR-1 tras T-008.
- **Bloque 5:** T-018 (a) tras T-015 a T-017; T-018 (b) tras T-014 y 022·T-028.
- **Límite de la cuenta** (memoria de uso): como mucho dos subagentes de máximo nivel a la vez; revisiones y dictámenes, en cola.

### Cómo se integra un par prueba–código

Igual que `specs/024-auditoria/plan.md`, mismo apartado, con rama `tarea/025-T-0NN` y commit `T-0NN (025): …`:

1. **pgTAP y unitarias**, en rojo en su commit antes que el código, por quien escribe el código.
2. **Estática y en navegador**, de `qa` en T-004 y de `ingeniero-pruebas` en T-005, generadas desde `tests/e2e/reglas/rutas.ts`; la tarea que crea una ruta la añade en el mismo commit.
3. **Suite acumulada:** cada tarea del bloque 3 deja en verde las pgTAP de las anteriores y las de la 010, la 021, la 022, la 023 y la 024 que toque. T-006 actualiza en el mismo commit las de la 010 que cambian con M25-1 y `volumen.sql` (P25-02).
4. **Lo que necesita un entorno inexistente** (CI sin primera ejecución, conector, entorno previo, persona) se escribe y revisa igual, y figura como «no ejecutable aún»; bloquea VERIFICADA, no integrar (art. 13).
5. **Ninguna migración de la 025 se aplica en `Nido`** antes que M24-1 (P25-13; P24-16 de la 024).

## Tareas previas

Primeras del plan; detalle y regla de decisión en `diseno.md`, «Tareas previas». Evidencia en `evidencias/T-00N/` de esta función, solo con booleanos, recuentos, nombres de objetos y versiones; nunca valores de datos ni secretos. En `Nido`, solo dentro de `begin … rollback`: prepara `qa`, ejecuta una persona.

- **T-P1 (T-002):** tipos JSON por la vía de exposición de 022·T-004.
- **T-P2 (T-003):** la 010 real frente a «Datos» (H-1, H-7, H-8).

Sin T-002, M25-2 no se integra. Sin T-003, M25-1 no se integra.

## Pruebas y criterios

Las 18 pruebas, su tipo y su etapa, en `diseno.md`. Tarea que aporta cada prueba, en `tareas.md`, «Cobertura». Resumen:

- **A:** CA-001, CA-002, CA-005, CA-020, CA-023, CA-024, CA-031, CA-033 y CA-034 (parte de interfaz).
- **B, base de datos en CI:** CA-011, CA-013 a CA-016, CA-023, CA-024, CA-026 a CA-028, CA-032, CA-034, CA-035; parte de CA-003.
- **B, navegador contra desarrollo:** CA-001, CA-002, CA-004, CA-006, CA-011, CA-013, CA-015, CA-017 a CA-021, CA-025, CA-030, CA-033.
- **C:** CA-003, CA-004, CA-007 a CA-010, CA-025, CA-029. **D:** CA-022.

**Varias conexiones:** PRUEBA-010 va al paso de `bd.yml` que fijó D-040 (propuesta 24 de la 010; `scripts/bd/concurrencia-clientes.mjs` de la 022; P25-05). Sin pgTAP ni ese paso en CI no hay VERIFICADA (art. 13).

## Lo que bloquea y a quién

| Asunto | Estado | Bloquea |
| --- | --- | --- |
| P1 | **Abierta el 22/11/2026 (D-036)** (auditor: APTO CON CONDICIONES; revisor: APTO CON MENORES) | Todo salvo T-001 a T-003 |
| E-1 (P25-01) | Pedida al `especificador`; P0 delegada (D-036) | T-016 (aviso de baja) |
| F-1 (edición de clientes de baja, responsable) | Sin respuesta; sin ella rige la especificación aprobada (opción a) | Nada; si elige (b), reabre T-001, T-007, T-015 y T-016 |
| P25-02 (010 acepta los cambios de M25-1 en sus pruebas) | Sin respuesta | T-006 |
| P25-03 (`estado_servido` y D-9 en el conector) | Sin respuesta | T-008, T-014 (LR-1), T-021 |
| P25-04 y P25-06 (exposición; lista de PRUEBA-048 de la 021) | Sin respuesta | T-007, T-008, T-014 |
| P25-05 (casos en `bd.yml`) | Sin respuesta | T-010 |
| P25-07 (022: O-1, disparador diferido, marco 5, columnas de baja) | Sin respuesta | T-008, T-011, T-018 (b) |
| P25-09 (024: `contextos` y cobertura) | Sin respuesta | T-007 |
| 024: M24-1 (024·T-009) y `presentacion.ts` (024·T-015) | Pendientes | T-006, T-017 |
| 021: `es_admin()` con `aal2` (021·T-007 c), guardias y `leerDelArea()` (021·T-012) | Pendientes | T-007, T-014 |
| 022: `situacion_licencia` (022·T-009), O-1 (022·T-013), V-109 (022·T-035), ficha (022·T-028), `fecha-madrid.ts` (022·T-022) | Pendientes | T-008, T-011, T-013, T-017, T-018 |
| 023: `pausa_efectiva` (023·T-010) | Pendiente | T-008 (a través de P25-03) |
| 020: componentes y muestra | Pendientes | T-005, T-015 a T-018 |
| `bd.yml` sin primera ejecución (010·T-013) | Pendiente | Cierre de todo criterio B de base de datos |
| Conector de la fase 2 y entorno previo | No existen | T-021, T-022 |

## Tareas de una persona

| Tarea | Qué hace | Cuándo |
| --- | --- | --- |
| T-002 | Ejecuta en el proyecto de desarrollo la consulta que prepara `qa`, dentro de `begin … rollback`, y entrega la salida sin datos | Al empezar |
| Bloque 3 | Aplica en `Nido` M25-1 a M25-3 con el procedimiento de la 010 (010·T-014), cada una tras integrarse y siempre después de M24-1 (P25-13) | Tras integrar (art. 14) |
| T-019 | Revisión manual con teclado y lector de pantalla, con el `disenador-ui` | Bloque 6 |
| T-022 | Prepara el entorno previo con volumen (D-016; cuentas y gasto, reservados) | Etapa D |
| F-1 | Responde la ficha (opcional; sin respuesta rige la especificación) | Cuando quiera |

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| La RPC convierte tipos JSON (`"1"` en `1`) | T-002 | Al arquitecto antes de M25-2; nunca parámetros SQL tipados (alternativa descartada) |
| Una prueba de la 010 o de la 022 confirma clientes sin reglas | `cliente_sin_reglas` en la suite | Esa prueba inserta la fila en su transacción (P25-02, P25-07); nunca se relaja D-3 |
| OR-1/OR-2 no quedan del dueño y activan la barrera | PRUEBA-008 (`proowner`) o `escritura_sin_accion_auditada` | No se integra; nunca se exime a otro rol en la barrera |
| La fase 2 tarda con P25-03 | Sin `estado_servido` | M25-3 y LR-1 esperan; T-015 a T-018 siguen en la etapa A; nada calcula el estado con otra regla (DD-17) |
| La fase 2 rechaza D-9 | Respuesta en coordinación | CA-029 no cierra; REQ-045 está aprobado: se para y decide el responsable, no se acepta como riesgo por delegación; sin P25-03 (b) y CA-029 en verde no hay VERIFICADA ni producción (m-4; DD-33) |
| Bloqueo mutuo con la 022 o con el cerrojo de la 024 | `40P01` o `55P03` en PRUEBA-009 o 010 | `no_aplicada`, sin cambios (art. 3); al arquitecto |
| La 052 necesita borrar reglas | Diseño de la 052 | Su vía con especificación (P25-10); D-3 no se retira sin ella |
| Rendimiento | PRUEBA-016 | Al arquitecto |
| Fase 2 tarde | Sin conector | Criterios de etapa C «no ejecutados»; la 025 no pasa a VERIFICADA |

## Entornos y despliegue

- **Local:** unitarias, estática y navegador sobre la compilación de producción, con la fuente ficticia solo en la muestra.
- **CI:** `supabase test db` (pgTAP de la 010 y de la 021 a la 025) y el paso de varias conexiones. Lo de B no se cierra sin CI.
- **`Nido`:** T-002 dentro de `begin … rollback`; las migraciones, por una persona con el procedimiento de la 010, tras integrarse y tras M24-1.
- **Entorno previo y producción:** no existen (D-016). Nada de la 025 va a producción sin T-019 a T-023.
- **Vuelta atrás:** `diseno.md`, «Vuelta atrás»: M25-3 y M25-2 quitando funciones; M25-1 solo junto con la app sin la función. PRUEBA-017 en CI. App con `git revert`.

## Cambios en CI

Ningún cambio en `.github/workflows/`. Los casos de PRUEBA-010 se añaden al paso de varias conexiones de `bd.yml` (P25-05): se tratan como cambio de CI por D-036, con dictamen del `auditor-seguridad`.

## Puertas que aplican

| Puerta | Aplica | Nota |
| --- | --- | --- |
| P1 Diseño y plan | Sí | **Abierta por delegación D-036 el 22/11/2026.** Dictamen del `auditor-seguridad` recibido (APTO CON CONDICIONES, vuelta 1, 22/11/2026; m-1 a m-5 como condiciones de tarea). Por D-036 la abre la coordinación si no quedan bloqueantes ni mayores sin corregir, con constancia; F-1 no la bloquea |
| P2 Código | Sí | Tipos, estilo, unitarias y pgTAP en cada tarea |
| P3 Integración | Sí | CI, varias conexiones, fallos (PRUEBA-009) |
| P4 Seguridad y privacidad | Sí | `revisor` siempre; `auditor-seguridad` en RC `C` y `D`; PRUEBA-014 y T-023 |
| P5 Experiencia | Sí | PRUEBA-002 a 006, revisión manual (CA-018), capturas (CA-019, CA-020) |
| P6 Operación | Sí | Migraciones, vuelta atrás, aplicación en `Nido` tras M24-1 |
| P7 Cierre | Sí | Lo de etapa C y D sin ejecutar figura como tal; sin P25-03 (b) integrada y CA-029 en verde no hay VERIFICADA (m-4; DD-33) |

## Rutas críticas tocadas

Todas con dictamen del `auditor-seguridad` además del `revisor`.

| Ruta | Tareas |
| --- | --- |
| `supabase/migrations/`, `supabase/reversiones/`, `supabase/tests/` (M25-1 a M25-3; pruebas de la 010 que cambian) | T-006, T-007, T-008, T-011 |
| `supabase/datos/` (juegos y `volumen.sql`) | T-006, T-009 |
| Paso de varias conexiones de `bd.yml` (CI) | T-010 |
| `src/lib/reglas/entrada.ts`, `src/lib/reglas/fuente-bd.ts`, `src/app/admin/clientes/acciones-reglas.ts` | T-013, T-014 |
| Enchufe de la sección en la ficha real | T-018 (b) |
| La estática con trampas (es un control) | T-004 |
| Entrega de las reglas por el conector (D-9; la hace la fase 2) | P25-03; T-021 lo comprueba |

T-002 y T-003 no tocan producto, pero deciden controles: dictamen sobre su evidencia. DD-03, DD-09 a DD-12, DD-17, DD-19, DD-20 y DD-24 a DD-28 son decisiones en ruta crítica que el auditor tiene que confirmar.

## Aprobación

Puerta P1. Por D-036 la anota la coordinación, con fecha y constancia para que el responsable pueda revocarla.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 22/11/2026 | `auditor-seguridad` | APTO CON CONDICIONES (vuelta 1, `dictamen-diseno.md`): sin bloqueantes ni mayores; m-1 a m-5 incorporados como condiciones de tarea |
| 22/11/2026 | `revisor` | APTO CON MENORES (4 menores corregidos por el `arquitecto`); desviación de m-2 aceptada por el revisor, a confirmar por el `auditor-seguridad` en el dictamen de T-007 |
| 22/11/2026 | Coordinación, por delegación D-036 | **P1 abierta, aprobado por delegación D-036 (22/11/2026)**; revocable por el responsable. F-1 (reglas de un cliente de baja) queda para el responsable y no la bloquea; sin P25-03 (b) y CA-029 en verde no hay VERIFICADA ni producción (m-4) |
