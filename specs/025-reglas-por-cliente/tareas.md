# 025 · Tareas

Autor: `arquitecto` · 22/11/2026 · Fuente: `diseno.md` puesto al día el 22/11/2026, con los menores m-1 a m-5 de `dictamen-diseno.md` como condiciones de tarea. **P1 pendiente solo de la revisión del `revisor`** (auditor: APTO CON CONDICIONES, vuelta 1). Orden, previas, bloqueos, riesgos, puertas y rutas críticas: `plan.md`. Catálogo de pruebas: `diseno.md`, «Pruebas». Ninguna prueba se ha ejecutado.

Un agente por tarea. `[P]`: en paralelo (sin archivos compartidos). «022·T-nnn»: tarea de otra función. **Persona**: lo que hace una persona. Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Partes** (D-029): (a), (b)… en ese orden; por tarea, un `verificar`, una revisión, un dictamen si RC es `C` o `D` y una aprobación (D-036). Una parte «aparte» tiene su propio ciclo y se integra sola.
- **Prueba primero:** `plan.md`, «Cómo se integra un par prueba–código». La prueba que cierra cada tarea se escribe en rojo en su primer commit; si es de otra tarea (T-004, T-005), ya está en `main`.
- **RC:** `C` = ruta crítica; `D` = no crítica, con dictamen; `R` = solo `revisor`. **CI**: cambia la configuración de CI (D-036).
- **Rutas:** `lr/` = `src/lib/reglas/`; `cr/` = `src/components/reglas/`; `ac/` = `src/app/admin/clientes/`; `tu/` = `tests/unit/reglas/`; `te/` = `tests/e2e/reglas/`; `tf/` = `tests/reglas/`; `st/` = `supabase/tests/reglas/`; `sm/` = `supabase/migrations/`; `sr/` = `supabase/reversiones/`; `sd/` = `supabase/datos/`; `ev/` = `evidencias/` de esta función.
- **Evidencias:** sin valores de datos, nombres de clientes, correos, identificadores reales ni salidas con datos.

## Bloque 0 · Especificación

### T-001 `[P]` · Enmienda E-1
`especificador` · D · pendiente · Depende de: nada (y F-1 si el responsable responde) · REQ-009, REQ-047 · CA-006, CA-010
- Lo de `propuestas.md`, P25-01: aviso propio del cliente dado de baja en REQ-009 y CA-006; si F-1 = (b), además REQ-009, REQ-047, CA-006 y CA-010 según esa opción. Prueba: `node scripts/comprobar-specs.mjs` sin errores, revisión del `revisor` y aprobación de la coordinación por P0 delegada (D-036), con constancia en `aclaraciones.md`.

## Bloque 1 · Previas

### T-002 `[P]` · T-P1: tipos JSON por la vía de exposición
`qa` · D · pendiente · Depende de: 022·T-004 · **Persona:** ejecuta la consulta · REQ-007, REQ-034, REQ-035 · CA-023, CA-024
- `diseno.md`, «Tareas previas», T-P1: una función desechable que devuelve `jsonb_typeof` de cada clave, llamada por `rpc` con `POST` y la sesión de prueba, dentro de `begin … rollback`, con `1`, `"1"`, `true`, `"true"`, `1.0`, `1e2` y nulo. Prueba: evidencia en `ev/T-002/` con cada caso «intacto» o «convertido» y dictamen sobre ella; si alguno se convierte, al arquitecto antes de T-007.

### T-003 `[P]` · T-P2: la 010 real frente a «Datos»
`qa` · D · pendiente · Depende de: nada · REQ-020, REQ-037, REQ-049 · CA-014, CA-032
- Cada objeto de H-1 en M02, M04, M07 y M08 con su línea; toda prueba de `supabase/tests/` y de la 010 que nombre `reglas_cliente`; `seed.sql` y `volumen.sql`; todo `insert into public.clientes` de pruebas y juegos que confirme sin fila de reglas. Prueba: informe en `ev/T-003/` con cada punto «cuadra» o «no cuadra» y su línea; lo que no cuadre, al arquitecto antes de T-006.

## Bloque 2 · Pruebas delante

### T-004 `[P]` · PRUEBA-014: estática con trampas
`qa` · C · pendiente · Depende de: P1, 021·T-011 (a) · REQ-017, REQ-018 · CA-012, CA-031
- `tu/estatica.test.ts`: nadie en `lr/`, `cr/`, `ac/acciones-reglas.ts` ni `ac/_vista/reglas.tsx` importa `lib/supabase/admin.ts`; `exigirAdministradorEnAccion()` primero en cada acción de `ac/acciones-reglas.ts`; `no-store`; ningún símbolo, ruta ni texto de la compuerta de la 016 y la 017 en esas piezas (art. 8); `tf/fuente-ficticia.ts` no importable desde el producto; ningún `textarea` ni campo de texto libre en `cr/`; `te/rutas.ts`. Prueba: en verde sobre el árbol vacío; cada trampa sembrada en una copia desechable la pone en rojo.

### T-005 `[P]` · Fuente ficticia y arnés de navegador
`ingeniero-pruebas` · D · pendiente · Depende de: P1, 020·T-005 (muestra), 020·T-009 · REQ-026, REQ-027, REQ-028, REQ-044 · CA-018, CA-019, CA-020
- (a) `tf/fuente-ficticia.ts`: guiones cerrados de LR-1 (por defecto, distintas, `sin_reglas`, `de_baja`, `recibe_ahora` falso), LR-2 (vacío, 4 filas con actor de baja, 60 filas, código desconocido, correo con marcado) y cada resultado de OR-1/OR-2, con los cinco estados y respuesta mal formada. Prueba: unitaria de forma y recuentos. (b) `te/rutas.ts` y, generadas desde él, PRUEBA-005 [A] y la parte de navegador de PRUEBA-006. Prueba: en verde con `rutas.ts` vacío; una ruta sembrada en una copia desechable las pone en rojo.

## Bloque 3 · Base de datos

Todas: RC `C`, migración **nueva** con marca posterior a la última integrada, `.claude/rules/bd.md` y `migracion-bd`, `search_path = pg_catalog, pg_temp` (D-035), pgTAP de acceso cruzado entre dos clientes, PRUEBA-017 y suite acumulada en verde. Dependen de P1, T-003 y M24-1 integrada (024·T-009). Aplicar en `Nido`, solo tras M24-1 aplicada (P25-13).

### T-006 · M25-1: tabla, valores por defecto, invariantes y permisos
`ingeniero-bd` · C · pendiente · Depende de: P1, T-003, 024·T-009, P25-02 · REQ-004, REQ-018, REQ-019, REQ-020, REQ-023, REQ-037, REQ-049, REQ-054 · CA-014, CA-016, CA-032
- (a) `sm/` M25-1 y `sr/` su reversión: D-1, D-2, D-3 (con `before truncate` y el disparador diferido en `clientes`), D-4 (con la aserción `privado.sin_escritura_directa('public.reglas_cliente')`) y el relleno de D-10 con su comprobación final. Prueba, en `st/` y en rojo primero: PRUEBA-008 (salvo OR-1/OR-2), la parte de M25-1 de PRUEBA-011 (0 clientes sin reglas; alta sin reglas rechazada con `set constraints … immediate`, AM-15) y PRUEBA-017 (M25-1). **Condición m-5:** funciones de D-3 `security definer` del dueño con `search_path = pg_catalog, pg_temp` y disparadores `enable always`; PRUEBA-008 comprueba `tgenabled = 'A'`, `prosecdef`, `proowner` y `proconfig`.
- (b) En el mismo commit (P25-02): `01_estructura`, `02_matriz_acceso` y las demás pruebas de la 010 que liste T-003, y `sd/volumen.sql` con `privado.reglas_por_defecto()`. Prueba: suite de la 010 y de la 024 en verde con M25-1.

### T-007 · M25-2: OR-1, OR-2 y LR-2
`ingeniero-bd` · C · pendiente · Depende de: T-006, T-002, 021·T-007 (c) (`es_admin()` con `aal2`), tablas de la 021 (`administradores.correo` y `estado`), P25-04, P25-06, P25-09 · REQ-006, REQ-007, REQ-012, REQ-017, REQ-019, REQ-021, REQ-022, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036, REQ-038, REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-048, REQ-050, REQ-052, REQ-053 · CA-011, CA-013, CA-015, CA-016, CA-023, CA-024, CA-027, CA-028, CA-034, CA-035
- D-5 (LR-2) y D-6 con el «Flujo» de OR-1/OR-2: `for no key update` (DD-20), comparación de las cinco esperadas, bloque con punto de recuperación, anotar según R-2 de la 024 (DD-26), propiedad de `postgres` (DD-27), `jsonb_typeof` (DD-03). **Condiciones:** m-1, `es_admin()` otra vez justo tras el cerrojo de fila («Flujo», paso 3; si falla, `no_permitida` sin escribir ni anotar); m-2, comprobación entera completa de D-6 antes de convertir, `1.0` y toda forma no entera rechazados (DD-32), nunca `::numeric::smallint` ni `(->>)::smallint` sin ella, con los casos de m-2 en PRUEBA-009; desviación de m-2 en `1e2` y `-0` («Dictamen vuelta 1»): el `auditor-seguridad` la acepta en su dictamen de esta tarea o vuelve al arquitecto. Prueba: PRUEBA-007 (OR-1, OR-2, LR-2), PRUEBA-008 (`proowner`, `prosecdef`, `proconfig`; barrera con una copia `security invoker` de prueba), PRUEBA-009, PRUEBA-012 (LR-2) y PRUEBA-017 (M25-2).

### T-008 · M25-3: LR-1
`ingeniero-bd` · C · pendiente · Depende de: T-007, P25-03 integrada (`privado.estado_servido`), 022·T-009, 022·T-010 (columnas de baja), P25-07 (e) · REQ-005, REQ-009, REQ-017, REQ-028, REQ-047 · CA-003, CA-006, CA-011
- D-5 (LR-1) y D-8: `valores`, `por_defecto` de D-2, `coinciden`, `de_baja` y `recibe_ahora` (falso con nulo, error u otro valor); `sin_reglas` sin valores. Prueba: PRUEBA-007 (LR-1), PRUEBA-012 (LR-1 frente al bloque `reglas` de `obtener_instrucciones` en la misma instantánea, 20 clientes; parte B de CA-003), `recibe_ahora` y `de_baja` en los 7 estados de CA-006 y PRUEBA-017 (M25-3). **Condición m-3:** antes de usarla, comprobar que `privado.estado_servido` es `security invoker` con `execute` solo para el dueño y `authenticated` (o, si es `definer`, que empieza por `es_admin()` o el contexto del conector); pgTAP de acceso cruzado: un usuario del cliente A pregunta por B y por un UUID inexistente, obtiene lo mismo y nunca `activa`. Si no se cumple, no se integra y vuelve al arquitecto y al dictamen del diseño de la 011.

### T-009 · Juegos y volumen
`ingeniero-bd` · C · pendiente · Depende de: T-007, 024·T-012 (formato de los juegos) · REQ-030, REQ-050 · CA-002, CA-006, CA-022, CA-033, CA-034, CA-035
- D-10: en `sd/`, juegos de CA-002 (10 y 10), CA-006 (7 estados), CA-033 (3 cambios y 1 restablecimiento, actor activo y de baja), CA-034 (60 cambios) y CA-035 (10 acciones distintas y otros 3 clientes), y guion de volumen de CA-022 (1.000 clientes, un cliente con 500 cambios), escritos llamando a OR-1 y OR-2 con `set role authenticated` y claims ficticios por actor; solo desarrollo y entorno previo, con la guarda de entorno de 010·T-007. Prueba: recuentos del guion y huella estable al repetirlo.

### T-010 · PRUEBA-010: varias conexiones
`ingeniero-bd` · C, CI · pendiente · Depende de: T-007, 022·T-019, 022·T-020, P25-05 · REQ-039, REQ-040 · CA-026, CA-027
- Casos de la 025 en `scripts/bd/concurrencia-clientes.mjs` y su número en `declaradas.json`: cambio/cambio y cambio/restablecimiento ×20 (0 mezclas, quien llega tarde `desactualizada`), doble envío < 100 ms ×10 (1 cambio, 1 fila) y el caso de m-1 (la conexión 1 retiene la fila, la 2 lanza OR-1, la 3 da de baja al actor de la 2 o le quita `aal2`: `no_permitida`, 0 cambios, 0 filas de auditoría). Prueba: ejecución de CI en verde y, en una rama de prueba, el paso en rojo con OR-1 roto a propósito (sin comparar `esperadas`).

### T-011 · PRUEBA-011: alta con reglas
`qa` · C · pendiente · Depende de: T-006, 022·T-013 (O-1), P25-07 (a, b) · REQ-049, REQ-054 · CA-032
- `st/alta_con_reglas.test.sql` y un caso que confirma en una base desechable: 20 altas por O-1 con reglas 30, 3, Sí, Sí, Sí e I-41 vinculada a su I-01; fallos provocados en cada paso del alta, también al guardar las reglas; 0 clientes sin reglas y 0 reglas sin cliente. **Condición m-5:** en la base desechable, O-1 llamada por `authenticated` bajo RLS confirma y el disparador diferido de D-3 comprueba al confirmar (alta válida aceptada, alta sin reglas rechazada). Prueba: en verde en CI.

## Bloque 4 · Servidor

### T-012 `[P]` · Catálogo, textos y diferencias
`ingeniero-frontend` · D · pendiente · Depende de: P1 · REQ-001, REQ-002, REQ-004, REQ-008, REQ-029 · CA-001, CA-005, CA-021, CA-031
- `lr/catalogo.ts` (cinco reglas, orden, rangos, unidades, sin valores por defecto), `lr/textos.ts` (nombres, explicaciones, líneas y avisos del diálogo, historial, errores; de `diseno.md`, «La sección en la ficha»; el aviso de baja, con el texto que apruebe E-1) y `lr/diferencias.ts`. Prueba: PRUEBA-001 (catálogo frente al contrato, sin sexta clave) y unitarias de `diferencias.ts` con 0, 1, 3 y 5 cambios.

### T-013 · Entrada
`ingeniero-backend` · C · pendiente · Depende de: T-012, 022·T-035 (V-109) · REQ-007, REQ-034, REQ-035, REQ-036, REQ-048 · CA-023, CA-024, CA-025
- `lr/entrada.ts` de «Contratos» (servidor y formulario), zod estricto sin coerción si V-109 está verificada; si no, escrito a mano. Claves de más descartadas, solo con el código `reglas_campos_de_mas`. Prueba: PRUEBA-001 (baterías de CA-023 y CA-024 y campos de más).

### T-014 · Fuente y acciones
`ingeniero-backend` · C · pendiente · Depende de: T-013, T-007, 021·T-012 (a, b) (`exigirAdministradorEnAccion()`, `leerDelArea()`); LR-1 real, T-008 · REQ-017, REQ-018, REQ-024, REQ-025, REQ-031, REQ-032, REQ-038, REQ-046 · CA-012, CA-013, CA-015, CA-017, CA-025, CA-030
- `lr/fuente-bd.ts` (siempre `rpc` con `POST` y la sesión; traducción por código fijo, sin `message`, `details` ni `hint`) y `ac/acciones-reglas.ts` (cuatro acciones; resultado → vista de «Contratos»; rechazos con código en `registro.ts`, sin valores). Prueba: PRUEBA-006 [B] (fuente), PRUEBA-014 en verde e integración con la clave secreta ausente, PRUEBA-018.

## Bloque 5 · Pantallas

Todas: `ingeniero-frontend`, con el `disenador-ui` en lo visual. Dependen de los componentes de la 020 de `diseno.md`, «Supuestos»; cada ruta, en `te/rutas.ts`; la muestra con `comprobarAccesoMuestra()` primero.

### T-015 `[P]` · Valores y formulario
`ingeniero-frontend` · D · pendiente · Depende de: T-005, T-012 · REQ-001, REQ-002, REQ-003, REQ-004, REQ-007, REQ-010, REQ-011, REQ-028, REQ-044 · CA-001, CA-002, CA-005, CA-020, CA-031
- `cr/ValoresReglas.tsx` y `cr/FormularioReglas.tsx`: lista de definiciones, palabra de REQ-003 con `EtiquetaEstado`, valor por defecto junto a la regla distinta (DD-15), `sin_reglas`, edición en el sitio (DD-14), enteros con `inputmode="numeric"` (DD-13), Sí/No, «No hay cambios que guardar». Prueba: PRUEBA-002 y PRUEBA-006 [A] (valores).

### T-016 `[P]` · Diálogos
`ingeniero-frontend` · D · pendiente · Depende de: T-005, T-012, T-001 (texto de baja) · REQ-008, REQ-009, REQ-012, REQ-041, REQ-047 · CA-005, CA-006, CA-007, CA-028
- `cr/DialogoReglas.tsx` para cambio y restablecimiento, con `DialogoConfirmacion`, las líneas de `diferencias.ts` y los avisos de `de_baja` y `recibe_ahora` (DD-23); restablecer ya coincidente no abre (DD-16). Sin E-1 aprobada (T-001), bloqueada: para la baja no se usa el aviso general. Prueba: PRUEBA-003.

### T-017 `[P]` · Historial
`ingeniero-frontend` · D · pendiente · Depende de: T-005, T-012, 024·T-015 (`presentacion.ts`), 022·T-022 (`fecha-madrid.ts`) · REQ-028, REQ-050, REQ-051, REQ-052 · CA-020, CA-033, CA-034
- `cr/HistorialReglas.tsx`: `Tabla` con «Cuándo» sin segundos (DD-06), «Quién» con `TextoDato` y «dado de baja», «Cambio»; código desconocido; `Paginacion` de 25 con corte en memoria; vacío. Prueba: PRUEBA-004.

### T-018 · Sección y enchufe en la ficha
`ingeniero-frontend` · C · pendiente · Depende de: (a) T-015, T-016, T-017; (b) T-014, 022·T-028 (marco 5 de `secciones.ts`), P25-07 (c) · REQ-011, REQ-024, REQ-028, REQ-044, REQ-053 · CA-004, CA-015, CA-020, CA-035
- (a) `cr/SeccionReglas.tsx` con la fuente ficticia en la muestra: dos `BloqueDatos` independientes, `useAccion`, tras la respuesta según «Tras la respuesta», sin guardar sobre valores no leídos. Prueba: PRUEBA-002 y PRUEBA-006 [A] (sección). (b) `ac/_vista/reglas.tsx` en el marco 5 de la ficha real, con las acciones de T-014 y corte nuevo en la primera carga. Prueba: PRUEBA-006 [B] y la parte de ficha de PRUEBA-013.

## Bloque 6 · Verificación

### T-019 · Accesibilidad, móvil y textos
`qa` · D · pendiente · Depende de: T-018 (a) · **Persona:** revisión manual con teclado y lector, con el `disenador-ui` · REQ-025, REQ-026, REQ-027, REQ-029 · CA-017, CA-018, CA-019, CA-021
- Prueba: PRUEBA-005 con capturas en `ev/T-019/` (cinco estados de valores e historial, 320 px, los dos diálogos) y la revisión manual sin hallazgos bloqueantes; revisión de mensajes de error y de textos (0 hallazgos).

### T-020 · Pruebas B contra desarrollo
`qa` · C · pendiente · Depende de: T-018 (b), T-009 · REQ-019, REQ-031, REQ-032, REQ-033, REQ-036, REQ-038, REQ-046, REQ-047 · CA-001, CA-002, CA-004, CA-006, CA-011, CA-013, CA-025, CA-030, CA-033
- En navegador contra desarrollo: PRUEBA-013 (ficha, 7 estados, 5 sesiones, identificadores manipulados, otro origen, incrustación) y PRUEBA-018 (ocho campos de más, registros sin sus valores). Prueba: esas pruebas en verde.

### T-021 · Etapa C: agente de prueba
`qa` · C · pendiente · Depende de: T-020, conector de la fase 2 con P25-03 · REQ-005, REQ-013, REQ-014, REQ-015, REQ-016, REQ-045, REQ-047 · CA-003, CA-004, CA-007, CA-008, CA-009, CA-010, CA-025, CA-029
- PRUEBA-015 con agente de prueba en desarrollo, incluida la lectura de reglas forzada a fallar y el cliente sin reglas preparado saltándose las restricciones (CA-029). Prueba: en verde; si el conector no existe, «no ejecutable aún». **Condición m-4 (DD-33):** sin P25-03 (b) integrada y CA-029 en verde, la 025 no pasa a VERIFICADA ni a producción; si la fase 2 rechaza D-9, se para y decide el responsable.

### T-022 · Etapa D: rendimiento
`qa` · D · pendiente · Depende de: T-009, T-020, entorno previo (D-016) · **Persona:** prepara el entorno · REQ-030 · CA-022
- PRUEBA-016: 200 mediciones de cada operación con el volumen de T-009. Prueba: percentil 95 bajo 2 s en todas.

### T-023 · Privacidad
`qa` · C · pendiente · Depende de: T-020, 024·T-014 (d) · REQ-007, REQ-022, REQ-036, REQ-050 · CA-016, CA-025, CA-033
- Skill `revision-privacidad` sobre filas de auditoría, respuestas de LR-2 y registros: 0 valores de reglas, 0 valores de campos de más, 0 textos libres. Prueba: 0 hallazgos.

### T-024 · `verificacion.md`
`qa` · R · pendiente · Depende de: T-001 a T-023 · REQ-001 a REQ-054 · CA-001 a CA-035
- Cada REQ y cada CA con su prueba, su resultado y su evidencia; lo no ejecutado, como tal (art. 13). Prueba: `node scripts/comprobar-specs.mjs` sin errores con la especificación en VERIFICADA. **Condición m-4 (DD-33):** no se propone VERIFICADA sin P25-03 (b) integrada y CA-029 en verde (T-021); CA-029 «no ejecutado» o «no ejecutable aún» deja la 025 sin VERIFICADA.

## Cobertura

Cada REQ-001 a REQ-054 está en la cabecera de alguna tarea anterior a T-024, que los cierra todos (repasado a mano el 22/11/2026; `node scripts/comprobar-specs.mjs` ejecutado el 22/11/2026: SUPERADO, documental). Cada criterio con su prueba: `diseno.md`, «Pruebas». Prueba → tarea que la escribe o la cierra:

| Pruebas | Tarea |
| --- | --- |
| 001 | T-012 (catálogo), T-013 (entrada) |
| 002 | T-015, T-018 (a) |
| 003 | T-016 |
| 004 | T-017 |
| 005 | T-005 (arnés), T-019 |
| 006 | T-005, T-015, T-018 (A); T-014, T-018 (b) (B) |
| 007 | T-007, T-008 |
| 008 | T-006, T-007 |
| 009 | T-007 |
| 010 | T-010 |
| 011 | T-006 (parte), T-011 |
| 012 | T-007 (LR-2), T-008 (LR-1) |
| 013 | T-018 (b), T-020 |
| 014 | T-004; en verde en T-014 |
| 015 | T-021 |
| 016 | T-022 |
| 017 | T-006, T-007, T-008 |
| 018 | T-014, T-020 |

## Escalados

Tareas que han subido de nivel de modelo o de esfuerzo, y por qué (`docs/EQUIPO.md`).

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
