# 023 · Plan

Autor: `arquitecto` · Fecha: 22/11/2026

Diseño: `diseno.md` del 14/11/2026, al día con D-040 y con el estado real de la 010, la 021, la 022 y la 024 el 22/11/2026 («Puesta al día del 22/11/2026») y corregido tras el dictamen de la vuelta 1 del `auditor-seguridad` (`dictamen-diseno.md`; `diseno.md`, «Respuesta al dictamen (vuelta 1)»). **P1 abierta por delegación D-036 el 22/11/2026** (auditor, vuelta 2: APTO; revisor corregido); la función pasa a PLANIFICADA. Especificación APROBADA (P0, 13/11/2026); este plan no cambia su estado. 36 tareas en seis bloques (`tareas.md`). **No se ha ejecutado ninguna prueba** ni el comprobador (`node scripts/comprobar-specs.mjs`): este encargo no tiene terminal. El catálogo de pruebas está en `diseno.md`, «Lista de pruebas» (PRUEBA-001 a PRUEBA-038), y cada criterio con sus pruebas y su etapa, en «Cada criterio, con su prueba y cuándo se puede cerrar»; aquí no se copian.

## Orden de trabajo

### Los bloques, en orden

| Bloque | Tareas | Qué deja hecho | Por qué va ahí |
| --- | --- | --- | --- |
| 1. Previas | T-001 a T-006 | T-P1 a T-P5 con evidencia; ADR propuestos | Deciden controles: exposición, archivo grande, días de Madrid, gráfico, la 010 real |
| 2. Pruebas delante | T-007, T-008 | Estática con trampas, ficticios y arnés de navegador | La prueba existe antes que el código que cierra |
| 3. Base de datos | T-009 a T-017 | M23-0 a M23-5, datos ficticios y casos de varias conexiones | La base de datos decide acceso, estado, transición y auditoría |
| 4. Servidor | T-018 a T-023 | Lectura cerrada, periodos, archivo, validadores, fuentes, acciones y manejador | Las pantallas solo llaman a esto |
| 5. Pantallas | T-024 a T-031 | Textos, menú, sección de informes, página «Informes», Resumen, órdenes, exportación y páginas reales | Última capa |
| 6. Verificación | T-032 a T-036 | Accesibilidad y textos, pruebas B, privacidad, agente y plataforma, `verificacion.md` | Con CI, conector y plataforma |

### Etapas (`diseno.md`, «Construcción en etapas»)

A, en la muestra con la fuente ficticia: T-008, T-018 a T-020, T-021 (a), T-024 a T-030; solo evidencia de interfaz, cierra CA-006, CA-025 a CA-028 y CA-031. A' (PGlite) sirve de borrador al bloque 3 y **no cierra nada**. B, con las migraciones en CI (`bd.yml`, 010·T-013), la migración de auditoría de la 024 y las de la 022 que se citan. C, conector de la fase 2 con agente de prueba. D, plataforma de despliegue (D-016).

### Qué va en paralelo

- **Antes de P1** (no construyen producto; solo evidencia): T-001, T-002 (a), T-003, T-004 y T-005, `[P]` entre sí.
- **Tras P1, `[P]`:** T-007, T-008, T-018, T-019, T-020, T-024; T-025 en cuanto estén T-007 y T-008 (b), cuyas pruebas la cierran (m-3 de la revisión). T-006 tras P1.
- **Bloque 3 en serie** (T-015 (a) → T-009 → T-010 → T-011 → T-012 (b) → T-013 → T-014 → T-015 (b) → T-016 → T-017; T-015 (b) sigue al final porque cierra la matriz entera de PRUEBA-016): mismas tablas y pruebas; un archivo de migración por tarea, que no se edita después de integrado. **T-015 (a) va aparte** (D-029, MAYOR-1 de la revisión): su propio `verificar`, revisión, dictamen y aprobación, y se integra en `main` antes que T-009 sin esperar a T-015 (b). Así no hay ciclo: la migración de la 024 (que necesitan T-009, T-013 y T-014) solo espera a T-015 (a), y T-015 (b) espera a T-014. T-012 (c) va aparte, cuando la 013 tenga su función.
- **Regla de orden (DD-34, M-3 del dictamen; MAYOR-2 de la revisión):** ninguna migración retira `ordenes_auditar` ni `catalogo_problemas_auditar` mientras `authenticated` pueda escribir en `ordenes` o en `catalogo_problemas`. T-015 (a) (M23-0) se integra en `main` y se aplica en `Nido` **antes o a la vez** que la migración de auditoría de la 024; esa migración lo comprueba con una guarda sobre las dos tablas (P23-09 d). T-015 (a) no espera a la 024, a la 021, a P23-15 ni a T-015 (b).
- **Bloque 4:** T-018 a T-020 a la vez que el bloque 3; T-021 (a) tras T-018 y T-020; T-021 (b) → T-022 → T-023 tras el bloque 3.
- **Bloque 5:** T-026, T-028 y T-029 pueden ir a la vez (componentes distintos) si no tocan `textos.ts` (lo escribe solo T-024); T-027 tras T-026; T-030 tras T-026; T-031 al final.
- **Límite de la cuenta** (D-032 y memoria de uso): como mucho dos subagentes de máximo nivel a la vez; revisiones y dictámenes, en cola.

### Cómo se integra un par prueba–código

Igual que `specs/021-acceso-superadmin/plan.md`, «Cómo se integra un par prueba–código», puntos 1 a 5, con rama `tarea/023-T-0NN` y commit `T-0NN (023): …`, y lo que añade `specs/022-clientes-licencias-conexiones/plan.md` en el mismo apartado:

1. **pgTAP y unitarias**, en rojo en su commit antes que el código, por quien escribe el código.
2. **Estática y en navegador**, de `qa` en T-007 y T-008, generadas desde `tests/e2e/informes-ordenes/rutas.ts`; la tarea que crea una ruta la añade en el mismo commit.
3. **Suite acumulada:** cada tarea del bloque 3 deja en verde las pgTAP de las anteriores y las de la 010, la 021, la 022 y la 024 que toque (`m07.test.ts`, `m08_m10.test.ts`, `02_matriz_acceso`, `03_acceso_cruzado`, `08_baja`).
4. **Lo que necesita un entorno inexistente** (CI sin primera ejecución, conector, plataforma, persona) se escribe y revisa igual, y figura como «no ejecutable aún»; bloquea VERIFICADA, no integrar (art. 13).
5. **Ninguna migración de la 023 se aplica en `Nido`** antes de que P23-04 (el conector con `clock_timestamp()`) esté integrada: con M08 de hoy, D-2 haría fallar entregas legítimas (AM-34). **Salvo M23-0**, que no toca la entrega y se aplica antes o a la vez que la migración de auditoría de la 024 (DD-34).

## Tareas previas

Primeras del plan; detalle y regla de decisión en `diseno.md`, «Tareas previas» (T-P1 a T-P5). Evidencia en `evidencias/T-00N/` de esta función, solo con booleanos, recuentos, nombres de objetos y versiones; nunca valores de datos ni secretos. En `Nido`, **solo lectura**: prepara `qa`, ejecuta una persona; lo que se pruebe a escribir, dentro de `begin … rollback`.

- **T-P1 (T-001):** reutiliza la evidencia de la 022·T-004 (punto 1, exposición de `privado`) y añade si una llamada por `rpc` puede devolver 50.000 filas de 20 columnas y cuánto tarda, y la versión mayor de PostgreSQL de `Nido` (DD-35).
- **T-P2 (T-002):** (a) en una copia desechable, en Chromium, Firefox y WebKit; (b) en la plataforma, cuando exista (D-016).
- **T-P3 (T-003):** juego compartido de instantes (23:59, 00:01 y los dos días de cambio de hora) contra `Nido` y contra `diaDeMadrid` de la 020.
- **T-P4 (T-004):** en la muestra de la 020.
- **T-P5 (T-005):** en `main`, sin ejecutar nada; incluye la versión mayor de PostgreSQL que usa CI (DD-35).

Sin T-001 y T-005, solo etapa A.

## Pruebas y criterios

Las 38 pruebas y su tipo, en `diseno.md`. Etapa de cierre de cada criterio, en `diseno.md`; tarea que aporta cada prueba, en `tareas.md`, «Cobertura». Resumen:

- **A:** CA-006, CA-025, CA-026 (salvo exportar, que se repite en B), CA-027, CA-028, CA-031.
- **B, base de datos en CI:** CA-002, CA-003, CA-008, CA-009, CA-015, CA-017, CA-019, CA-020, CA-029, CA-036, CA-038, CA-041; **varias conexiones:** CA-016, CA-022 (baja), CA-023, CA-034.
- **B, navegador contra desarrollo:** CA-004, CA-005, CA-007, CA-010, CA-012, CA-013, CA-014, CA-018, CA-021, CA-024, CA-030, CA-032, CA-033, CA-035, CA-037, CA-040.
- **B, con la regla de la 013:** CA-011.
- **C:** CA-001. **D:** la parte de archivo grande de CA-039.

**Varias conexiones:** el procedimiento de la 022 (su plan, «Varias conexiones (DD-31)»), con los casos de PRUEBA-019, 022 y 038 añadidos a `scripts/bd/concurrencia-clientes.mjs` (T-017) y su número en `declaradas.json` de la 010. Sin pgTAP ni ese paso en CI no hay VERIFICADA (art. 13).

## Lo que bloquea y a quién

| Asunto | Estado | Bloquea |
| --- | --- | --- |
| P1 | **Abierta el 22/11/2026 (D-036)**; condiciones n-1 a n-3 de `dictamen-diseno-2.md` | Todo salvo T-001 a T-005 |
| F-1 (riesgo residual, responsable) | Sin respuesta | P7. Si la respuesta es B o C, T-013 y T-014 vuelven al arquitecto |
| Migración de auditoría de la 024 (su D-1 a D-5, con P-49 y P-53 de la 022) | Sin tareas en la 024 | T-009 (retira `ordenes_auditar`), T-013, T-014. **Ella misma no se integra ni se aplica antes que T-015 (a)** (DD-34; guarda de P23-09 d sobre `ordenes` y `catalogo_problemas`). Las demás tablas que pierden su disparador en ella son de otras funciones (P23-17) |
| Versión mayor de PostgreSQL de `Nido` y de CI (DD-35) | Sin anotar | Nada se bloquea (D-4b se diseña para 17 o anterior); si difieren, PRUEBA-037 no cierra CA-020 hasta igualarlas |
| P23-09 (c): `principal_de_esta_transaccion()` desde un disparador diferido; T-P3 de la 024 | Sin respuesta | T-013 (D-4b) |
| P23-09 (b): periodo en I-18 (A-1 vi de la 024) | Sin decidir | T-014 |
| P23-01, P23-02, P23-03 (a la 010) | Sin respuesta | T-015 (a) (P23-01 c, d y P23-03), T-009 (P23-01 a, b), T-015 (b) (P23-02) |
| P23-04 (conector: `clock_timestamp()`, `pausa_efectiva()`, solo vivas, confirmar solo entregadas) | Sin respuesta | T-017 (PRUEBA-022), T-035; aplicar M23 en `Nido` |
| P23-05 (`resumen_cliente.en_pausa`) | Sin respuesta | Nada de la 023; sin ella quedan dos expresiones de la regla de pausa (riesgo) |
| P23-06 (exposición, 50.000 filas) | Sin respuesta | T-021 (b), T-014 |
| P23-07 (022: L-7, `listarClientes`, `fecha-madrid.ts`, marcos, casos de varias conexiones) | Sin respuesta | T-026 (bloque «Señal»), T-027, T-018, T-031, T-017 |
| P23-08 (021) | Sin respuesta | T-007, T-031 |
| P23-10 (020: sexta entrada, estados, `GraficoLineas` de 366) | Sin respuesta | T-025, T-027; T-004 |
| P23-11 (013: función de «sin señal») | 013 en PROPUESTA | T-012 (c), CA-011; el bloque «Agentes sin señal» del Resumen se prueba sin cerrar |
| P23-13 (D-013; V-112) | D-013 PROPUESTO; V-112 VERIFICAR | Texto final del diálogo de pausa (T-024); T-035; cierre de CA-030 |
| P23-15 (enmiendas de texto de la especificación) | Sin respuesta | T-013 (REQ-046), T-014 (REQ-078), T-024 (REQ-043); el cierre de CA-002 (REQ-001, REQ-038), no T-015 (DD-34) |
| 021: `es_admin()` (021·T-007 c), guardia y `leerDelArea()` (021·T-012 a y b), `/admin` (021·T-014), PRUEBA-003 (021·T-011 a) | Pendientes | T-011 a T-014, T-015 (b) (su PRUEBA-016), T-021 (b) a T-023, T-007, T-031; T-015 (a) no (su prueba usa claims de prueba) |
| 022: `situacion_licencia()` (022·T-009), licencias con hechos (022·T-010 b), `fecha-madrid.ts` (022·T-022), `listarClientes` (022·T-024), ficha (022·T-028), L-7 (022·T-012 b), ajustes por rol (022·T-017), varias conexiones (022·T-019, T-020) | Pendientes | T-012 (L-5, L-11), T-018, T-027, T-031, T-017, CA-030 |
| 020: componentes y muestra | Pendientes | T-008, T-024 a T-030 |
| `bd.yml` sin primera ejecución (010·T-013) | Pendiente | Cierre de todo criterio B de base de datos |
| Conector de la fase 2 en desarrollo, agente de prueba y versión publicada | No existen | T-035 (CA-001) |
| Plataforma de despliegue (D-016) | No existe | T-002 (b), T-035 (PRUEBA-035) |

## Tareas de una persona

| Tarea | Qué hace | Cuándo |
| --- | --- | --- |
| T-001, T-003 | Ejecuta en `Nido` las consultas de solo lectura que prepara `qa` y entrega la salida sin datos | Al empezar |
| Bloque 3 | Aplica en `Nido` cada M23 integrada, con el procedimiento de la 010 (010·T-014), y solo tras P23-04; M23-0, antes o a la vez que la migración de auditoría de la 024 (DD-34) | Tras integrar cada una (art. 14) |
| T-002 (b), T-035 | Despliega la app y activa lo que haga falta de la plataforma (D-016; cuentas y gasto, reservados) | Etapas C y D |
| T-032 | Revisión manual con teclado y lector de pantalla, con el `disenador-ui` (CA-026) | Bloque 6 |

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| La 010 no acepta P23-01 a P23-03 | Sin respuesta en su `propuestas.md` | T-009 y T-015 bloqueadas; no se tocan migraciones auditadas de la 010 ni se eximen roles. Sin P23-01 (c) y P23-03, la migración de auditoría de la 024 tampoco puede retirar `ordenes_auditar` ni `catalogo_problemas_auditar` (DD-34) |
| La migración de la 024 llega antes que M23-0 | Su guarda falla (P23-09 d) o PRUEBA-017 en rojo en un estado intermedio | Se integra T-015 (a) primero; nunca se quita la guarda |
| El disparador diferido falla al confirmar con `authenticated` | PRUEBA-037, caso positivo, en rojo | Al arquitecto; nunca dar `execute` a `authenticated` (DD-35, N-4 de la 022) |
| La exportación retrasa al conector (cerrojo global de la 024, m-4) | PRUEBA-033 por encima del objetivo | Al arquitecto |
| La lista local de la 024 no sirve desde un disparador diferido | T-P3 de la 024 en rojo o PRUEBA-037 en rojo | T-013 no se integra; al arquitecto (nunca identificar la fila por hora) |
| La 024 no admite el periodo en I-18 | P23-09 (b) rechazada | T-014 bloqueada; al especificador y al responsable (REQ-074) |
| El conector sigue con `now()` | PRUEBA-022 con entregas en `error_interno` | No se aplica M23 en `Nido`; P23-04 pasa a obligatoria |
| El reloj de la base de datos retrocede y O-1 falla con `orden_reloj_no_valido` | PRUEBA-037 o supervisión con `ordenes_resultado_incierto` | Al arquitecto; nunca relajar la comprobación |
| Bloqueo mutuo con la 022 o el conector | PRUEBA-038 con algún `40P01` | T-013 no se integra; al arquitecto |
| T-P2 no pasa en la plataforma | T-002 (b) | Exportación por partes (`diseno.md`, «Exportación»); vuelve al arquitecto |
| La 013 no fija su regla | P23-11 sin respuesta | L-12 sin construir; CA-011 sin cerrar; la función no pasa a VERIFICADA |
| El responsable revoca DD-31 | Respuesta en coordinación | T-015 cambia (sin lectura del usuario de cliente y con `resumen_cliente` resuelto); al arquitecto |
| Rendimiento | PRUEBA-033 | Al arquitecto (índices, consulta) |
| Fase 2 tarde | Sin conector | Criterios de etapa C «no ejecutados»; la 023 no pasa a VERIFICADA |

## Entornos y despliegue

- **Local:** unitarias, estática y navegador sobre la compilación de producción, con la fuente ficticia solo en la muestra (DD-25). PGlite solo de borrador.
- **CI:** `supabase test db` (pgTAP de la 010, la 021, la 022, la 024 y la 023) y el paso de varias conexiones de la 022 con los casos de la 023. Lo de B no se cierra sin CI.
- **`Nido`:** solo lectura en T-001 y T-003; las M23, por una persona con el procedimiento de la 010, cada una tras integrarse y tras P23-04.
- **Entorno previo y producción:** no existen (D-016). Nada de la 023 va a producción sin T-032 a T-035.
- **Vuelta atrás:** `diseno.md`, «Migración y vuelta atrás» (orden M23-5 → M23-0; ninguna vuelta atrás, ni parcial, reabre la escritura directa, y la de M23-0 no repone nada; M23-1 no se revierte si se perdería cómo se anuló una orden), PRUEBA-026 y PRUEBA-017 en cada estado intermedio; app con `git revert`. Las órdenes vivas siguen en vigor al revertir: la guía de operación dice anularlas o confirmarlas antes.

## Cambios en CI

Ningún cambio en `.github/workflows/`. T-017 añade casos a `scripts/bd/concurrencia-clientes.mjs` de la 022 y su número a `declaradas.json`, que `bd.yml` ejecuta: se trata como cambio de CI por D-036, con dictamen del `auditor-seguridad`.

## Puertas que aplican

| Puerta | Aplica | Nota |
| --- | --- | --- |
| P1 Diseño y plan | Sí | **Abierta el 22/11/2026 por delegación D-036** tras el dictamen de la vuelta 2 del `auditor-seguridad` (APTO) y la revisión del `revisor` corregida. Por D-036 la abre la coordinación si el dictamen no deja bloqueantes ni mayores sin corregir; incluye aprobar el tiempo máximo de exportación (A-4) |
| P2 Código | Sí | Tipos, estilo, unitarias y pgTAP en cada tarea |
| P3 Integración | Sí | CI, varias conexiones, fallos (PRUEBA-031) |
| P4 Seguridad y privacidad | Sí | `revisor` siempre; `auditor-seguridad` en RC `C` y `D`; PRUEBA-036 |
| P5 Experiencia | Sí | PRUEBA-013 a 015, revisión manual (CA-026), capturas (CA-025) |
| P6 Operación | Sí | Migraciones, vuelta atrás, aplicación en `Nido`, guía de órdenes vivas |
| P7 Cierre | Sí | Necesita la respuesta del responsable a F-1; lo de etapa C y D sin ejecutar figura como tal |

## Rutas críticas tocadas

Todas con dictamen del `auditor-seguridad` además del `revisor` (órdenes y entrega al agente, RLS y migraciones).

| Ruta | Tareas |
| --- | --- |
| `supabase/migrations/`, `supabase/tests/` | T-015 (a) (M23-0), T-009 a T-014, T-015 (b) |
| Datos ficticios de `supabase/` (volumen y casos) | T-016 |
| `scripts/bd/concurrencia-clientes.mjs` y `declaradas.json` (CI) | T-017 |
| `src/lib/ordenes/`, `src/lib/informes/entradas.ts` | T-020, T-021 |
| `src/lib/informes/exportacion.ts`, `descarga.ts`, `DialogoExportar` | T-019, T-030 |
| `src/app/admin/ordenes/acciones.ts`, `src/app/admin/informes/acciones.ts`, `src/app/admin/acciones.ts` | T-022 |
| `src/app/admin/clientes/[cliente]/informes/exportacion/route.ts` | T-023 |
| La estática con trampas (es un control) | T-007 |
| `docs/adr/` (propuesta; la aplica la coordinación) | T-006 |

T-001, T-003 y T-005 no tocan producto, pero deciden controles: dictamen sobre su evidencia. DD-30 (estado atado a hechos y reloj), DD-31 (lectura del usuario de cliente) y DD-32 (auditoría obligada diferida) son decisiones nuevas en ruta crítica que el auditor tiene que confirmar; también DD-34 (M23-0 y orden de migraciones) y DD-35 (disparador `security definer`, caso peor PostgreSQL 17), que responden a su dictamen.

## Aprobación

Puerta P1. Por D-036 la anota la coordinación, con fecha y constancia para que el responsable pueda revocarla.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 22/11/2026 | `auditor-seguridad` | Vuelta 1: APTO CON CONDICIONES (0 bloqueantes, 3 mayores, 6 menores), `dictamen-diseno.md`. Corregidos por el `arquitecto` el 22/11/2026; pendiente de comprobación |
| 22/11/2026 | `auditor-seguridad` | Vuelta 2: APTO (0 bloqueantes, 0 mayores, 3 menores n-1 a n-3 como condiciones de tarea), `dictamen-diseno-2.md` |
| 22/11/2026 | `revisor` | NO APTO (2 mayores, 4 menores) corregidos por el `arquitecto` el mismo día; el auditor comprobó los cambios en su vuelta 2; sin nueva vuelta del revisor |
| 22/11/2026 | Coordinación, por delegación D-036 | **P1 abierta, aprobado por delegación D-036 (22/11/2026)**; revocable por el responsable. Condiciones: n-1 en P23-09 (d) y la tarea de la 024; n-2 en T-009; n-3 en T-010 (`dictamen-diseno-2.md`). La ficha F-1 (`propuestas.md`) sigue abierta para el responsable y bloquea P7 |
