# 024 · Plan

Autor: `arquitecto` · Fecha: 22/11/2026

Diseño: `diseno.md`, puesto al día el 22/11/2026 (DISEÑADA). **P1 abierta por delegación D-036 el 22/11/2026** tras el APTO del `auditor-seguridad` en la vuelta 2 (`dictamen-diseno-2.md`: 0 bloqueantes, 0 mayores; MN-5 a MN-8 como condiciones de T-004, T-009 y T-014, `diseno.md`, «Dictamen vuelta 2»); **revisión del `revisor` corregida; función PLANIFICADA**. La vuelta 1 (`dictamen-diseno.md`: APTO CON CONDICIONES, 2 mayores y 4 menores) quedó corregida (`diseno.md`, «Respuesta al dictamen (vuelta 1)»). Especificación DISEÑADA; su enmienda E-1 está pedida (`propuestas.md`, P24-01). 25 tareas en siete bloques (`tareas.md`). **No se ha ejecutado ninguna prueba** ni el comprobador (`node scripts/comprobar-specs.mjs`): este encargo no tiene terminal. El catálogo de pruebas (PRUEBA-001 a PRUEBA-035) y cada criterio con su prueba están en `diseno.md`, «Pruebas»; aquí no se copian.

## Orden de trabajo

### Los bloques, en orden

| Bloque | Tareas | Qué deja hecho | Por qué va ahí |
| --- | --- | --- | --- |
| 0. Especificación | T-001 | Enmienda E-1 aprobada | El catálogo de la base de datos no puede ir por delante de la especificación (art. 5) |
| 1. Previas | T-002 a T-006 | T-P1 a T-P4 con evidencia; ADR propuesto | Deciden controles: exposición, programador, orden y contexto, estado real de la 010 |
| 2. Pruebas delante | T-007, T-008 | Estática con trampas, fuente ficticia y arnés de navegador | La prueba existe antes que el código que cierra |
| 3. Base de datos | T-009 a T-014 | M24-1 a M24-3, datos ficticios, matriz de operaciones y cobertura por acción | La base de datos decide quién escribe, qué y cuándo |
| 4. Servidor | T-015, T-016 | Catálogo, entrada, periodo, fecha, presentación, fuente y acciones | Las pantallas solo llaman a esto |
| 5. Pantallas | T-017 a T-019 | Filtros, tabla con grupos y página | Última capa |
| 6. Verificación | T-020 a T-025 | Accesibilidad y textos, pruebas B, conector, volumen, privacidad, `verificacion.md` | Con CI, conector y entorno previo |

### Etapas (`diseno.md`, «Construcción en etapas»)

A, en la muestra de la 020 con la fuente ficticia: T-008, T-015, T-017, T-018, T-019 (a); cierra solo evidencia de interfaz (CA-010, CA-011, CA-022 a CA-025 en su parte A). A' (PGlite) sirve de borrador a T-009 y **no cierra nada**. B, con M24-1 a M24-3 en CI (`bd.yml`, 010·T-013) y las funciones de la 021, 022, 023 y 025 integradas. C, conector de la fase 2. D, entorno previo con volumen (D-016).

### Qué va en paralelo

- **Antes de P1** (solo evidencia, no producto): T-001, T-002, T-003, T-004 (a) y T-005 (a), `[P]` entre sí. T-005 (b), tras integrar T-009 y antes de aplicar M24-1 en `Nido`.
- **Tras P1, `[P]`:** T-007, T-008, T-015; T-017 y T-018 en cuanto estén T-008 y T-015. T-006 tras P1.
- **Bloque 3 en serie:** T-009 → T-010 → T-011 (un archivo de migración por tarea, que no se edita después de integrado). T-012 tras T-009. T-013 (a) tras T-009, en rojo hasta su parte (b). T-014 por partes, cada una cuando su función tenga sus operaciones en `main`.
- **Regla de orden (DD-37):** M24-1 se integra **justo después de M10 y antes que cualquier migración de la 021 a la 025**; ninguna de ellas escribe filas de auditoría antes. La 022 (su R-MA-2) y la 023 (T-009, T-013, T-014) esperan a M24-1 en CI.
- **La barrera no exige orden** (DD-23): las migraciones de la 022, la 023 y la 025 que retiren escritura directa pueden ir antes o después de M24-1; desde M24-1 esa escritura ya se rechaza. Solo la 021 (`administradores`) y la 015 (`versiones_prompt`) necesitan retirar su barrera con la guarda D-12 para escribir desde la API (P24-09, P24-10 c).
- **Bloque 4:** T-015 con el bloque 2; T-016 tras T-010 y la guardia de la 021.
- **Bloque 5:** T-017 y T-018 a la vez (componentes distintos); T-019 (a) tras ellos; T-019 (b) tras T-016.
- **Límite de la cuenta** (D-032 y memoria de uso): como mucho dos subagentes de máximo nivel a la vez; revisiones y dictámenes, en cola.

### Cómo se integra un par prueba–código

Igual que `specs/023-informes-ordenes/plan.md`, mismo apartado, con rama `tarea/024-T-0NN` y commit `T-0NN (024): …`:

1. **pgTAP y unitarias**, en rojo en su commit antes que el código, por quien escribe el código.
2. **Estática y en navegador**, de `qa` en T-007 y T-008, generadas desde `tests/e2e/auditoria/rutas.ts`; la tarea que crea una ruta la añade en el mismo commit.
3. **Suite acumulada:** cada tarea del bloque 3 deja en verde las pgTAP de las anteriores y las de la 010, la 021, la 022 y la 023 que toque. T-009 actualiza en el mismo commit las de la 010 que cambian con M24-1 (P24-02).
4. **Lo que necesita un entorno inexistente** (CI sin primera ejecución, conector, entorno previo, persona) se escribe y revisa igual, y figura como «no ejecutable aún»; bloquea VERIFICADA, no integrar (art. 13).
5. **Ninguna migración de la 024 se aplica en `Nido`** antes de que exista el procedimiento de I-19 de la 021 (P24-16 a): con M24-1, el de la 010 falla cerrado y no se podría crear el primer administrador con su fila.
6. **En `Nido` no se ejecuta nada entre M10 y M24-1** (MN-3, DD-42, P24-16 b): ni el procedimiento de la 010 ni inserciones como dueño en `administradores` o `versiones_prompt`; cualquiera dejaría filas que no se borran y M24-1 no se aplicaría nunca. Por eso en `Nido` no hay administradores hasta M24-1 y el procedimiento de la 021. Justo antes de M24-1, recuento de `auditoria` = 0 filas (T-005 b), con evidencia en `ev/T-005/`.

## Tareas previas

Primeras del plan; detalle y regla de decisión en `diseno.md`, «Tareas previas» (T-P1 a T-P4). Evidencia en `evidencias/T-00N/` de esta función, solo con booleanos, recuentos, nombres de objetos y versiones; nunca valores de datos ni secretos. En `Nido`, **solo lectura** o dentro de `begin … rollback`: prepara `qa`, ejecuta una persona.

- **T-P1 (T-002):** reutiliza la evidencia de 022·T-004 (punto 1) y 023·T-001.
- **T-P2 (T-003):** `pg_cron` en el plan de `Nido`; si exige gasto, ficha F-2.
- **T-P3 (T-004):** (a) en PGlite, lista local, `savepoint`, disparador diferido y `contexto_peticion()` con `set role`; (b) con dos conexiones y el agrupador, en CI y en `Nido` dentro de `begin … rollback`.
- **T-P4 (T-005):** (a) en `main`, sin ejecutar nada salvo lo de CI; (b) en `Nido`, solo lectura, recuento de `auditoria` justo antes de aplicar M24-1 (MN-3).

Sin T-002 y T-005, solo etapa A. Sin T-004, T-009 no se integra.

## Pruebas y criterios

Las 35 pruebas, su tipo y su etapa, en `diseno.md`. Tarea que aporta cada prueba, en `tareas.md`, «Cobertura». Resumen:

- **A:** CA-010, CA-011, CA-022 a CA-025 (parte de interfaz).
- **B, base de datos en CI:** CA-001 a CA-009, CA-012, CA-013, CA-018 (H-05), CA-019 (base de datos), CA-026 a CA-028, CA-030, CA-032, CA-033.
- **B, navegador contra desarrollo:** CA-014, CA-015, CA-017, CA-019, CA-020, CA-021, CA-029, CA-031.
- **C:** CA-001 y CA-018 para H-01 a H-04. **D:** CA-016.

**Varias conexiones:** PRUEBA-018 (orden de números) y PRUEBA-034 (lista local) necesitan dos conexiones: van al paso de `bd.yml` que fijó D-040 (propuesta 24 de la 010; `scripts/bd/concurrencia-clientes.mjs` de la 022, P24-06). Sin pgTAP ni ese paso en CI no hay VERIFICADA (art. 13).

## Lo que bloquea y a quién

| Asunto | Estado | Bloquea |
| --- | --- | --- |
| P1 | Abierta por delegación D-036 el 22/11/2026 tras el APTO de la vuelta 2; **pendiente solo de la revisión del `revisor`** | Todo salvo T-001 a T-005 |
| P24-17 (022: tiempos por rol en P-47; 021: en `acceso`) | Sin respuesta | T-009 (PRUEBA-013, parte MN-4) |
| E-1 (P24-01) | Pedida al `especificador`; P0 delegada (D-036) | T-009 y todo lo que use I-42 a I-45, el periodo de I-18 o los vínculos nuevos |
| F-1 (riesgo residual del propietario, responsable) | Sin respuesta | P7 |
| F-2 (gasto de `pg_cron`, solo si T-003 lo exige) | Condicionada | T-011, CA-018 (H-05) |
| P24-02 (010 acepta que M24-1 altere M04 y sus pruebas) | Sin respuesta | T-009 |
| P24-03 y P24-07 (conector anota H-01 a H-04) | Sin respuesta | T-022 (CA-001 y CA-018 de H-01 a H-04) |
| P24-05 (exposición de lecturas; lista de PRUEBA-048 de la 021) | Sin respuesta | T-010, T-016 |
| P24-10 (021: códigos, roles sin permisos sobre la auditoría, barrera de `administradores`, I-19) | Sin respuesta | T-009 (nombres de roles en `contexto_peticion()`), T-012 (juegos de CA-001 y CA-010 completos; parciales mientras tanto), T-013 (b), T-014 (c), aplicar en `Nido` |
| P24-11 y P24-12 (022 y 023 aceptan `principal_de_esta_transaccion()` y R-2) | Sin respuesta | 022·T-010 y siguientes; 023·T-013 |
| 021: `es_admin()` (021·T-007 c), guardias y `leerDelArea()` (021·T-012) | Pendientes | T-010, T-016, T-019 (b) |
| 022: P-46, `situacion_licencia()` (022·T-009), `listarClientes` | Pendientes | T-010, T-011, T-017 |
| 020: componentes y muestra | Pendientes | T-008, T-017 a T-019 |
| `bd.yml` sin primera ejecución (010·T-013) | Pendiente | Cierre de todo criterio B de base de datos |
| Conector de la fase 2 y entorno previo | No existen | T-022, T-023 |

## Tareas de una persona

| Tarea | Qué hace | Cuándo |
| --- | --- | --- |
| T-002, T-003, T-004 (b) | Ejecuta en `Nido` las consultas que prepara `qa` (solo lectura o con `rollback`) y entrega la salida sin datos | Al empezar |
| T-005 (b) | Recuento de `auditoria` en `Nido` (solo lectura) justo antes de M24-1; si no es 0, no aplica | Antes de M24-1 |
| Bloque 3 | Aplica en `Nido` M24-1 a M24-3 con el procedimiento de la 010 (010·T-014), cada una tras integrarse y tras P24-16; entre M10 y M24-1 no ejecuta nada en `Nido` | Tras integrar (art. 14) |
| T-003 | Si `pg_cron` exige activar algo con gasto, lo decide el responsable (F-2) | Tras T-003 |
| T-020 | Revisión manual con teclado y lector de pantalla, con el `disenador-ui` | Bloque 6 |
| T-023 | Prepara el entorno previo con volumen (D-016; cuentas y gasto, reservados) | Etapa D |

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| Alguna migración anterior deja filas en `auditoria` | T-005 o la guarda de M24-1 (`auditoria_con_filas_antiguas`) | M24-1 no se aplica; al arquitecto. Nunca se borran filas |
| `contexto_peticion()` no distingue los contextos dentro de `security definer` | T-004 (a) o PRUEBA-035 en rojo | Se rehace D-3 (5) antes de integrar T-009 |
| El orden de números no es el de confirmación o la lista local falla con el agrupador | T-004 (b), PRUEBA-018 o PRUEBA-034 en rojo | Al arquitecto: plan B de paginación por cursor; nunca identificar la principal por hora |
| La barrera rompe algo que hoy funciona por escritura directa | PRUEBA-032 o la suite de la 010 en rojo | Lo que se rompe se escribía sin acción auditada: se queda roto hasta que su función dueña lo haga con una acción del catálogo (P24-04, P24-09); nunca se relaja la barrera |
| La 015 o la 021 necesitan escribir desde la API antes de tener su entrada o su guarda | Peticiones `escritura_sin_accion_auditada` | Su función añade la entrada con especificación aprobada y retira la barrera con D-12 |
| Bloqueo mutuo con la 022, la 023 o el conector | PRUEBA-013 con esperas o `40P01` | La tarea no se integra; al arquitecto (R-2, R-3, D-3 (0)) |
| La espera del cerrojo global supera `lock_timeout` (2 s) | `55P03` en PRUEBA-018 o PRUEBA-024 | La acción se deshace entera (art. 3); al arquitecto |
| La 021 retira la barrera de `administradores` sin la regla del dueño directo | PRUEBA-032 en rojo tras su migración (T-014 c) | No se integra (P24-10 g) |
| El cerrojo global retrasa al conector | PRUEBA-033 de la 023 o PRUEBA-024 por encima del objetivo | Al arquitecto |
| `pg_cron` no está o exige gasto | T-003 | F-2; mientras, H-05 no se anota y CA-018 no cierra |
| E-1 se rechaza | Respuesta en coordinación | T-009 sin I-42 a I-45 ni periodo; la 021 y la 023 bloqueadas en esas acciones; al arquitecto |
| Rendimiento | PRUEBA-024 | Al arquitecto (recuentos diarios precalculados) |
| Fase 2 tarde | Sin conector | Criterios de etapa C «no ejecutados»; la 024 no pasa a VERIFICADA |

## Entornos y despliegue

- **Local:** unitarias, estática y navegador sobre la compilación de producción, con la fuente ficticia solo en la muestra. PGlite solo de borrador.
- **CI:** `supabase test db` (pgTAP de la 010, la 021, la 022, la 023 y la 024) y el paso de varias conexiones. Lo de B no se cierra sin CI.
- **`Nido`:** solo lectura en las previas; nada entre M10 y M24-1, y recuento = 0 antes de M24-1 (DD-42); las migraciones, por una persona con el procedimiento de la 010, tras integrarse y tras P24-16.
- **Entorno previo y producción:** no existen (D-016). Nada de la 024 va a producción sin T-020 a T-024.
- **Vuelta atrás:** `diseno.md`, «Vuelta atrás»: M24-3 y M24-2 por reversión; M24-1 solo con `auditoria` vacía; en producción, la app anterior. PRUEBA-031 en CI. App con `git revert`.

## Cambios en CI

Ningún cambio en `.github/workflows/`. Los casos de dos conexiones de PRUEBA-018 y PRUEBA-034 se añaden al paso de varias conexiones de `bd.yml` (P24-06): se tratan como cambio de CI por D-036, con dictamen del `auditor-seguridad`.

## Puertas que aplican

| Puerta | Aplica | Nota |
| --- | --- | --- |
| P1 Diseño y plan | Sí | Abierta por delegación D-036 el 22/11/2026 tras el APTO del `auditor-seguridad` en la vuelta 2 (MA-1 y MA-2 corregidos; MN-1 a MN-8, condiciones de T-004, T-005, T-009, T-013 y T-014); **pendiente solo de la revisión del `revisor`**. Por D-036 la abre la coordinación si el dictamen no deja bloqueantes ni mayores sin corregir; F-1 queda para el responsable y no bloquea P1 |
| P2 Código | Sí | Tipos, estilo, unitarias y pgTAP en cada tarea |
| P3 Integración | Sí | CI, varias conexiones, fallos (PRUEBA-022) |
| P4 Seguridad y privacidad | Sí | `revisor` siempre; `auditor-seguridad` en RC `C` y `D`; PRUEBA-017 y 029 |
| P5 Experiencia | Sí | PRUEBA-004 a 007, revisión manual (CA-023), capturas (CA-022, CA-024) |
| P6 Operación | Sí | Migraciones, vuelta atrás, aplicación en `Nido`, trabajo programado de H-05 |
| P7 Cierre | Sí | Necesita la respuesta del responsable a F-1; lo de etapa C y D sin ejecutar figura como tal |

## Rutas críticas tocadas

Todas con dictamen del `auditor-seguridad` además del `revisor` («RLS y migraciones»; además, la barrera toca la escritura de licencias, conexiones y órdenes de otras funciones).

| Ruta | Tareas |
| --- | --- |
| `supabase/migrations/`, `supabase/reversiones/`, `supabase/tests/` (M24-1 a M24-3, la barrera, la guarda, las pruebas de la 010 que cambian) | T-009, T-010, T-011, T-013, T-014 |
| Datos ficticios y de volumen de `supabase/datos/` | T-012 |
| Paso de varias conexiones de `bd.yml` (CI) | T-004 (b), T-013 |
| `src/lib/auditoria/fuente-bd.ts`, `src/app/admin/auditoria/acciones.ts`, `src/app/admin/auditoria/page.tsx` | T-016, T-019 |
| La estática con trampas (es un control) | T-007 |
| `docs/adr/` (borrador; lo aplica la coordinación) | T-006 |

T-002 a T-005 no tocan producto, pero deciden controles: dictamen sobre su evidencia. DD-23 (barrera), DD-24 (guarda), DD-25 (tabla alterada en su sitio), DD-26 (lista local), DD-27 y DD-28 (reglas de cerrojos), DD-29 (contexto), DD-30 (`describir_auditoria` `security definer`) y DD-38 a DD-43 (correcciones del dictamen, vuelta 1) son decisiones en ruta crítica que el auditor tiene que confirmar.

## Aprobación

Puerta P1. Por D-036 la anota la coordinación, con fecha y constancia para que el responsable pueda revocarla.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 22/11/2026 | `auditor-seguridad`, vuelta 1 | APTO CON CONDICIONES (0 bloqueantes, 2 mayores, 4 menores); corregido |
| 22/11/2026 | `auditor-seguridad`, vuelta 2 (D-11 y D-12) | APTO (0 bloqueantes, 0 mayores, 4 menores: MN-5 a MN-8, condiciones de tarea), `dictamen-diseno-2.md` |
| 22/11/2026 | `revisor` | NO APTO (1 mayor MA-R1, 5 menores) corregidos por el `arquitecto` el mismo día; sin nueva vuelta del revisor |
| 22/11/2026 | Coordinación, por delegación D-036 | **P1 abierta, aprobado por delegación D-036 (22/11/2026)**; función PLANIFICADA; revocable por el responsable. Condición añadida por la coordinación: el cambio de `contexto_peticion()` del menor 4 del revisor (rol `conector`, `acceso` o del servicio de identidad por `session_user`) lo confirma el `auditor-seguridad` en el dictamen de T-004 (b) y de T-009, que son ruta crítica |
