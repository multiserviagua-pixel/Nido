# 023 · Tareas

Autor: `arquitecto` · 22/11/2026 · Fuente: `diseno.md` al día el 22/11/2026 y corregido tras el dictamen de la vuelta 1 (`dictamen-diseno.md`; cambian T-001, T-005, T-009, T-010, T-013, T-015, T-016, T-017, T-020, T-023, T-033 y T-035) y tras la revisión del `revisor` del 22/11/2026 (cambian la convención de partes, el bloque 3, T-015, T-021, T-022, T-023, T-025 y T-031; `diseno.md`, «Revisión del revisor»), **pendiente de que el `auditor-seguridad` compruebe la corrección y de la revisión del `revisor`; P1 sin abrir**. Orden, previas, bloqueos, riesgos, puertas y rutas críticas: `plan.md`. Catálogo de pruebas: `diseno.md`, «Lista de pruebas». Ninguna prueba se ha ejecutado.

Un agente por tarea. `[P]`: en paralelo (sin archivos compartidos). «022·T-nnn»: tarea de otra función. **Persona**: lo que hace una persona. Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Partes** (D-029): (a), (b)… en ese orden; por tarea, un `verificar`, una revisión, un dictamen si RC es `C` o `D` y una aprobación (D-036). Una parte «aparte» (T-012 (c), T-015 (a)) tiene su propio `verificar`, su revisión, su dictamen y su aprobación, y se integra sola, sin esperar a las demás partes de su tarea ni seguir su orden (MAYOR-1 de la revisión).
- **Prueba primero:** `plan.md`, «Cómo se integra un par prueba–código». La prueba que cierra cada tarea se escribe en rojo en su primer commit; si es de otra tarea (T-007, T-008), ya está en `main`.
- **RC:** `C` = ruta crítica (`plan.md`, «Rutas críticas tocadas»); `D` = no crítica, con dictamen; `R` = solo `revisor`. **CI**: cambia lo que ejecuta CI (D-036).
- **Rutas:** `li/` = `src/lib/informes/`; `lo/` = `src/lib/ordenes/`; `lr/` = `src/lib/resumen/`; `ci/` = `src/components/informes/`; `co/` = `src/components/ordenes/`; `cr/` = `src/components/resumen/`; `tu/` = `tests/unit/informes/` y `tests/unit/ordenes/`; `te/` = `tests/e2e/informes-ordenes/`; `tf/` = `tests/ficticios/informes-ordenes/`; `st/` = `supabase/tests/`; `sm/` = `supabase/migrations/`; `ev/` = `evidencias/` de esta función.
- **Evidencias:** sin valores de datos, nombres de clientes, identificadores reales ni salidas con datos; los testigos de PRUEBA-030 y PRUEBA-031 son cadenas ficticias.

## Bloque 1 · Previas

### T-001 `[P]` · T-P1: exposición y 50.000 filas
`qa` · D · pendiente · Depende de: 022·T-004 (punto 1; se reutiliza su evidencia) · **Persona:** ejecuta las consultas · REQ-002, REQ-035, REQ-072 · CA-003, CA-007, CA-039
- `diseno.md`, «Tareas previas», T-P1; P23-06. Anota además la versión mayor de PostgreSQL de `Nido` (`show server_version_num`, solo lectura; DD-35). Prueba: evidencia en `ev/T-001/` y dictamen sobre ella; si la 010 no fija la exposición, la función no pasa de la etapa A.

### T-002 · T-P2: archivo grande y descarga
`qa` · D · pendiente · Depende de: (a) 002 (app en `main`), `[P]`; (b) plataforma (D-016) · **Persona:** (b) despliega · REQ-032, REQ-033, REQ-072, REQ-079 · CA-026, CA-027, CA-039, CA-040
- (a) Tres motores en una copia desechable: el navegador recibe, comprueba tamaño y líneas y ofrece desde un diálogo con teclado; una respuesta cortada no ofrece nada; `no-store`. (b) En la plataforma: 8 MB por partes. Nada entra en `main`. Prueba: evidencia en `ev/T-002/`; si falla (b), exportación por partes y al arquitecto.

### T-003 `[P]` · T-P3: días de Madrid en `Nido`
`qa` · D · pendiente · Depende de: 020 (`diaDeMadrid` en `main`) · **Persona:** consultas de solo lectura · REQ-009, REQ-014 · CA-008, CA-010
- Juego compartido de instantes (23:59, 00:01, dos cambios de hora). Prueba: evidencia en `ev/T-003/` con coincidencias por instante; si difiere, manda la base de datos y se corrige la 020.

### T-004 `[P]` · T-P4: gráfico de 366 puntos
`qa` · R · pendiente · Depende de: 020 (`GraficoLineas` y `TablaEquivalente` en su muestra) · REQ-009, REQ-032, REQ-033 · CA-008, CA-026, CA-027
- Cuatro series de 366 puntos a 320 px y su tabla con teclado. Prueba: evidencia y capturas en `ev/T-004/`; si no pasa, la 020 ajusta el componente (P23-10).

### T-005 `[P]` · T-P5: la 010 real frente a «Datos»
`qa` · D · pendiente · REQ-010, REQ-023, REQ-024, REQ-052, REQ-053, REQ-066 · CA-009, CA-015
- `diseno.md`, «Tareas previas», T-P5: M02, M04, M07, M08 y M09 frente a D-1 a D-12 y D-11, pruebas de la 010 que cambian y órdenes del seed (también empates de `creada_en`); predicado de `ordenes_select_usuario` (D-6); columnas de `ordenes` que lee `describir_auditoria` de la 024; versión mayor de PostgreSQL de CI en `bd.yml`, frente a la de `Nido` de T-001 (DD-35). Prueba: informe en `ev/T-005/` con cada punto «cuadra» o «no cuadra» y su línea; lo que no cuadre, al arquitecto antes de T-009.

### T-006 · ADR
`arquitecto` · C · pendiente · Depende de: P1 · REQ-023, REQ-025, REQ-072
- Las tres propuestas de `diseno.md`, «Decisiones que requieren ADR» (operaciones del panel, ciclo de una orden, exportación de cifras), como borradores en esta carpeta; las aplica la coordinación (P23-14). Prueba: dictamen del `auditor-seguridad` sobre cada una.

## Bloque 2 · Pruebas delante

### T-007 `[P]` · PRUEBA-005: estática con trampas
`qa` · C · pendiente · Depende de: P1, 021·T-011 (a) (su PRUEBA-003), P23-08 · REQ-002, REQ-010, REQ-011, REQ-020, REQ-021, REQ-061, REQ-072 · CA-003, CA-005, CA-009, CA-018
- `tu/estatica.test.ts`: lo de PRUEBA-005 (importaciones prohibidas, guardia primero en páginas, acciones y `route.ts`, sin cachés, un solo `route.ts` con `POST`, `descarga.ts` solo desde `DialogoExportar`, ningún control sobre informes, ningún campo de texto en diálogos de órdenes, ficticios fuera del producto, `fuente-bd.ts` sin `GET` ni filtros de PostgREST). Prueba: en verde sobre el árbol vacío; cada trampa sembrada en una copia desechable la pone en rojo.

### T-008 `[P]` · Ficticios y arnés en navegador
`qa` · D · pendiente · Depende de: P1, 020·T-005 (muestra), 020·T-009 (convenciones) · REQ-004, REQ-005, REQ-006, REQ-009, REQ-012, REQ-014, REQ-015, REQ-019, REQ-027, REQ-031, REQ-054, REQ-055, REQ-056, REQ-062, REQ-068 · CA-004, CA-006, CA-010, CA-018, CA-025, CA-031, CA-037
- (a) `tf/`: guiones cerrados (sin reglas de negocio) con los casos de D-13 (siete situaciones de pausa, cuatro casos de sustitución, catálogo activo, retirado y ausente, esquema posterior, 3 campos de más, nombres con marcado, cliente sin informes, cada motivo y `incierta`). Prueba: unitaria de forma y recuentos. (b) `te/rutas.ts` y, generadas desde él, PRUEBA-007 a 015 [A] y 027 a 031 [B]. Prueba: en verde con `rutas.ts` vacío; una ruta sembrada en una copia desechable las pone en rojo.

## Bloque 3 · Base de datos

Todas salvo T-017: `ingeniero-bd`, RC `C`, migración **nueva** con marca posterior a la última integrada, `.claude/rules/bd.md` y `migracion-bd`, `search_path = pg_catalog, pg_temp` (D-035), pgTAP de acceso cruzado entre dos clientes, PRUEBA-026 (aplicar → revertir → aplicar) y suite acumulada en verde. Dependen de P1, T-005, M01 a M10 de la 010 y 021·T-007 (c) (`es_admin()`), salvo T-015 (a), que no usa `es_admin()` de la 021. Orden: T-015 (a) (aparte, integrada antes que T-009) → T-009 → … → T-014 → T-015 (b) (`plan.md`, «Qué va en paralelo»). Cerrojos de `diseno.md`, «Operaciones», antes de la primera fila de auditoría; anotar, el último paso. Ninguna se aplica en `Nido` antes de P23-04 (`plan.md`, punto 5), salvo M23-0.

### T-009 · M23-1: `ordenes` con hechos, índices y D-4
- **Condición n-2 (`dictamen-diseno-2.md`, P1 22/11/2026):** disparador `before truncate` por sentencia en `ordenes` que rechace el vaciado, como `auditoria_sin_vaciado` de M04. Prueba: PRUEBA-017, `truncate` como dueño rechazado. (n-1 va a P23-09 (d) y a la tarea de la 024: `has_any_column_privilege` solo con `INSERT` y `UPDATE`; `DELETE` con `has_table_privilege`.)
`ingeniero-bd` · C · pendiente · Depende de: T-015 (a), T-005, P23-01 (a, b), migración de auditoría de la 024 (retira `ordenes_auditar`) · REQ-021, REQ-023, REQ-024, REQ-025, REQ-052, REQ-066, REQ-075 · CA-015, CA-016
- D-1 (`anulacion`, `sustituida_por` con clave ajena compuesta `(sustituida_por, cliente_id)` diferible y distinta de su `id`, `creada_por` obligatorio, restricción de `estado` con los hechos, `creada_en` por disparador con `clock_timestamp()` y posterior a la última del cliente), D-2, D-3 (índice único parcial), D-4 (`privado.validar_orden()` en lugar de `ordenes_valores`, sin mirar `current_user`; nacer pendiente; todo borrado rechazado, también en cascada) y D-12 (único `(cliente_id, creada_en desc)` y `(id, cliente_id)`). Prueba: PRUEBA-017 (cada rechazo de D-4 como `postgres` sin `set role`, desde una `security definer` de prueba y con `set role authenticated` y claims de superadmin, con su código fijo; `insert` con hechos puestos; borrado en cascada), PRUEBA-018 (restricciones de D-2), PRUEBA-019 (índice único insertando a mano; misma `creada_en` rechazada), PRUEBA-037 (restricción de `estado`, `sustituida_por` propio o de otro cliente, reloj), PRUEBA-026 (M23-1, también el rechazo de revertir con órdenes anuladas), `m07.test.ts` y `m08_m10.test.ts` en verde.

### T-010 · M23-2: reglas de estado (D-6)
- **Condición n-3 (`dictamen-diseno-2.md`, P1 22/11/2026):** la «visibilidad» de D-6 se decide por dueño de la tabla, superusuario o `bypassrls`, además de `es_admin()` y el predicado de `ordenes_select_usuario`, y lee solo las columnas de P23-02. Prueba: PRUEBA-034 (rol real de M08) y PRUEBA-016 (usuario de cliente con M23-5).
`ingeniero-bd` · C · pendiente · Depende de: T-009 · REQ-019, REQ-026, REQ-027, REQ-028 · CA-017, CA-018, CA-019
- `privado.situacion_pausa()`, `privado.pausa_efectiva()` y `privado.orden_fuera_de_plazo()`: `stable`, `security invoker`, `execute` solo a `authenticated` y al dueño; sin visibilidad del cliente, nulo y `pausa_sin_visibilidad` (M-1). Prueba: PRUEBA-023 (siete situaciones; plazo con 24 y 168 horas a 2·F ± 1 minuto; la frecuencia de los informes no cuenta; sin visibilidad), PRUEBA-016 (permisos; un usuario de cliente con el identificador de otro y un rol `nobypassrls` de prueba obtienen nulo y `pausa_sin_visibilidad`, nunca «sin pausa», también con el otro cliente en pausa), PRUEBA-026.

### T-011 · M23-3 (a): lecturas L-1 a L-4
`ingeniero-bd` · C · pendiente · Depende de: T-010 · REQ-001, REQ-003, REQ-004, REQ-005, REQ-006, REQ-009, REQ-035, REQ-054, REQ-055, REQ-057, REQ-058, REQ-068, REQ-069, REQ-070, REQ-077 · CA-004, CA-006, CA-007, CA-008, CA-029, CA-037, CA-038
- `security definer`, `es_admin()` antes de leer parámetros, cero filas sin él, sin cerrojos, columnas con nombre, periodo validado con el reloj de la base de datos, días de Madrid (T-003). Prueba: PRUEBA-016 (L-1 a L-4), PRUEBA-023 (totales, páginas, evolución de CA-008, filtros de CA-037), PRUEBA-026.

### T-012 · M23-3 (b) y (c): lecturas de órdenes y del Resumen
`ingeniero-bd` · C · pendiente · Depende de: T-011, 022·T-009 y 022·T-010 (b) (`situacion_licencia()` y licencias con hechos); (c) también P23-11 · REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-019, REQ-020, REQ-027, REQ-028, REQ-063 · CA-010, CA-011, CA-012, CA-018, CA-019
- (b) L-5 a L-7 y L-9 a L-11 (L-5 con baja, licencia vigente y conexiones activas por las reglas de la 022; autor por `administradores.correo`). Prueba: PRUEBA-016, PRUEBA-023 (cifras de CA-010 con 23:59 y 00:01; variación de CA-012; fuera de plazo de CA-019), PRUEBA-026. (c) **Aparte**, cuando la 013 tenga su función: L-12. Prueba: PRUEBA-024 (mismo conjunto que la 013 a los dos lados del margen; 0 alertas creadas o cerradas).

### T-013 · M23-4 (a): O-1, O-2 y auditoría obligada (D-4b)
`ingeniero-bd` · C · pendiente · Depende de: T-012 (b), P23-09 (a, c), migración de auditoría de la 024 con P-53 de la 022, P23-15 (REQ-046) · REQ-022, REQ-024, REQ-025, REQ-026, REQ-029, REQ-030, REQ-039, REQ-040, REQ-041, REQ-042, REQ-045, REQ-046, REQ-047, REQ-048, REQ-049, REQ-050, REQ-051, REQ-052, REQ-060, REQ-064, REQ-065, REQ-066, REQ-075, REQ-076 · CA-014, CA-015, CA-016, CA-017, CA-020, CA-021, CA-022, CA-023, CA-024, CA-032, CA-033, CA-034, CA-035
- Los pasos de O-1 y O-2 (`diseno.md`, «Operaciones»): `es_admin()`, cliente `for no key update` y orden `for update`, `es_admin()` otra vez, estado esperado, sustitución con identificador generado, `clock_timestamp()`, auditoría como último paso con `anotar_auditoria()` y `anotar_auditoria_vinculada()`; D-4b diferido con `principal_de_esta_transaccion()`, que exige la acción del tipo de la orden, con su función `security definer` del dueño, `search_path = pg_catalog, pg_temp`, sin `execute` para nadie y sin mirar `current_user` (DD-35); `authenticated` sigue sin `execute` sobre `principal_de_esta_transaccion()`. Captura solo por SQLSTATE, códigos fijos. Prueba: PRUEBA-017 (O-1, O-2), PRUEBA-018 (matriz de transiciones por las operaciones), PRUEBA-020 (coherencia, baja, sin licencia, sin conexiones, estado esperado de CA-035, orden de otro cliente), PRUEBA-021 (30 operaciones, fallos provocados), PRUEBA-037 (auditoría obligada; acción de otro tipo; caso positivo con `set role authenticated` y claims de administrador de prueba, en la versión de `Nido`), PRUEBA-026.

### T-014 · M23-4 (b): E-1
`ingeniero-bd` · C · pendiente · Depende de: T-013, P23-09 (b), P23-06, P23-15 (REQ-078) · REQ-072, REQ-073, REQ-074, REQ-078, REQ-079, REQ-080 · CA-039, CA-040, CA-041
- Una sola lectura de 50.001 filas como mucho, I-18 con el periodo como último paso, sin cerrojos de fila. Prueba: PRUEBA-025 (dos clientes en 366 días, los seis rechazos de CA-041 sin fila, el tope, número igual a filas), PRUEBA-021 (10 exportaciones con su fila y periodo; fallo de auditoría: nada devuelto), PRUEBA-026.

### T-015 · M23-0 y M23-5: permisos (D-5)
`ingeniero-bd` · C · pendiente · Depende de: (a) **aparte**: P1, T-005, P23-01 (c, d), P23-03, M01 a M10 de la 010; **antes o a la vez** que la migración de auditoría de la 024, que la comprueba con su guarda (P23-09 d); sin depender de la 024, de la 021, de P23-15 ni de (b) (DD-34); (b) T-014, P23-02 · REQ-001, REQ-002, REQ-010, REQ-037, REQ-038, REQ-052, REQ-053 · CA-002, CA-009
- (a) **Aparte** (MAYOR-1 de la revisión; su propio `verificar`, revisión, dictamen y aprobación) y **M23-0, la primera del bloque 3** (M-3): retirar a `authenticated` (y `anon`) `insert`, `update` y `delete` de `ordenes`, de `informes` si M07 los da y de `catalogo_problemas` (MAYOR-2), y las políticas `ordenes_insert_admin`, `ordenes_update_admin`, `catalogo_problemas_insert_admin` y `catalogo_problemas_update_admin`; su vuelta atrás no repone nada. Se integra en `main` antes que T-009, sin esperar a (b). Prueba: PRUEBA-017 (escritura directa con `set role authenticated` y claims de un superadmin de prueba con sesión completa: 3 de 3 en informes, cada intento de REQ-052 y crear, cambiar y borrar en `catalogo_problemas`, 0 filas cambiadas), escrita y **en rojo antes de M23-0** (m-4): con M01 a M10 aplicadas, el superadmin de prueba cumple el `es_admin()` vigente, el de M07 de la 010 (fila en `administradores` con su `usuario_id` como `sub` y `aal` exactamente `aal2`), sin presuponer el de la 021, y la escritura por M07 tiene que funcionar en `ordenes` y `catalogo_problemas`; si no funciona, los claims están mal y el rojo no vale. PRUEBA-026 (al revertir M23-0, la escritura sigue cerrada en las dos tablas), `m07.test.ts` y `02_matriz_acceso` actualizadas en verde (P23-01 d, P23-03). (b) **M23-5**: columnas del usuario de cliente sobre `ordenes` (DD-31). No espera a P23-15: solo estrecha lo que la 010 ya concede; la enmienda condiciona el cierre de CA-002 y de las filas de PRUEBA-016 sobre DD-31, no la tarea (excepción declarada en `diseno.md`, art. 5). Prueba: PRUEBA-016 (matriz entera, con DD-27 y DD-31), PRUEBA-017 y PRUEBA-026 con cualquier subconjunto de vueltas atrás de M23-0 a M23-5 (`authenticated` nunca inserta ni actualiza `ordenes` ni `catalogo_problemas`), `02_matriz_acceso` en verde.

### T-016 · Datos ficticios en `supabase/`
`ingeniero-bd` · C · pendiente · Depende de: T-015 (b) · REQ-035, REQ-058 · CA-007, CA-010, CA-011, CA-019
- D-13: volumen de referencia (1.000 clientes, 200.000 informes, 20.000 de un cliente en 366 días, 5.000 órdenes) y los casos citados, con la guarda de entorno de la 010 y sin datos reales. Prueba: recuentos sin valores en `ev/T-016/`; PRUEBA-026 con los datos cargados.

### T-017 · Varias conexiones: casos de la 023
`ingeniero-bd` · C · CI · pendiente · Depende de: T-015 (b), 022·T-019, P23-07 (e), P23-04 · REQ-025, REQ-040, REQ-041, REQ-046, REQ-075 · CA-016, CA-022, CA-023, CA-034
- Casos de PRUEBA-019 (50 rondas y 20 dobles envíos), PRUEBA-022 (20 de anular contra entregar y 20 contra confirmar, con las funciones del conector) y PRUEBA-038 (carreras con la 022 y el conector en bucle) en `scripts/bd/concurrencia-clientes.mjs`, y su número en `declaradas.json`. Prueba: en rojo antes, contra una operación sin cerrojo sembrada en una copia desechable; en CI, 0 dos vivas, 0 `40P01` y recuentos de auditoría exactos.

## Bloque 4 · Servidor

### T-018 `[P]` · `campos.ts`, `lectura.ts` y `periodo.ts`
`ingeniero-backend` · D · pendiente · Depende de: P1, 022·T-022 (`fecha-madrid.ts`, P23-07 c) · REQ-005, REQ-006, REQ-007, REQ-008, REQ-054, REQ-055, REQ-057 · CA-004, CA-006, CA-029
- `li/campos.ts` (los veinte datos), `li/lectura.ts` (lista cerrada; lo demás, `desconocido`), `li/periodo.ts`. Prueba: PRUEBA-001, PRUEBA-002.

### T-019 `[P]` · `exportacion.ts`
`ingeniero-backend` · C · pendiente · Depende de: P1 · REQ-011, REQ-073 · CA-005, CA-039
- Función pura que compone el CSV de DD-10 validando cada celda (DD-14). Prueba: PRUEBA-003.

### T-020 `[P]` · Entradas y resultados
`ingeniero-backend` · C · pendiente · Depende de: P1 · REQ-003, REQ-048, REQ-049, REQ-050, REQ-051, REQ-077, REQ-078 · CA-021, CA-038, CA-041
- `li/entradas.ts`, `li/resultados.ts`, `lo/entradas.ts`, `lo/resultados.ts`: listas cerradas, UUID y días validados antes de llamar (también el segmento `[cliente]` de la ruta de exportación, m-3), objeto plano, cuerpo de 1 KB, campos de más sin leer ni registrar. Prueba: PRUEBA-004.

### T-021 · Fuentes
`ingeniero-backend` · C · pendiente · Depende de: (a) T-018, T-020; (b) T-011 a T-014, T-015 (b) (matriz de permisos final; T-015 (a) ya integrada antes que T-009), P23-06, 021·T-012 (a) (`leerDelArea()`) · REQ-002, REQ-018, REQ-036, REQ-060 · CA-003, CA-013, CA-030
- (a) `li/fuente.ts`, `lo/fuente.ts`, `lr/fuente.ts` (tipos) y PRUEBA-006 contra las ficticias [A]. (b) Los tres `fuente-bd.ts`, fijos, por `POST` (`rpc`), traducción solo por SQLSTATE y códigos fijos, sin `message`, `details` ni `hint`. Prueba: PRUEBA-006 contra las reales [B], PRUEBA-032 (sin clave secreta).

### T-022 · Acciones
`ingeniero-backend` · C · pendiente · Depende de: T-021 (b), T-007 (PRUEBA-005), T-008 (b) (PRUEBA-028 a 030), 021·T-012 (b) (guardia) · REQ-001, REQ-003, REQ-020, REQ-030, REQ-036, REQ-037, REQ-039, REQ-047, REQ-061, REQ-067 · CA-002, CA-014, CA-017, CA-021, CA-036
- `src/app/admin/acciones.ts` (`leerBloqueResumen`), `src/app/admin/informes/acciones.ts` (solo lecturas), `src/app/admin/ordenes/acciones.ts` (`crearOrden`, `anularOrden` y tres lecturas); `exigirAdministradorEnAccion()` primero; códigos de `registro.ts` de «Contratos». Prueba: PRUEBA-005 en verde, PRUEBA-028, PRUEBA-029 (acciones), PRUEBA-030.

### T-023 · Manejador de exportación
`ingeniero-backend` · C · pendiente · Depende de: T-019, T-021 (b), T-002 (a), T-007 (PRUEBA-005), T-008 (b) (PRUEBA-030 y 031), 021·T-012 (b) (guardia de `route.ts`) · REQ-061, REQ-072, REQ-074, REQ-079 · CA-021, CA-040
- `src/app/admin/clientes/[cliente]/informes/exportacion/route.ts`, solo `POST`, en el orden de «Exportación»; tras la guardia, `[cliente]` validado con `entradas.ts` y 404 sin llamar si no es UUID (m-3). Prueba: PRUEBA-005, PRUEBA-030 (otro origen, marco, cuerpo de más; `TEXTO-CANARIO-123` como segmento: 0 llamadas a E-1 y 0 apariciones en registros), PRUEBA-031 (fallo de base de datos y de auditoría: 0 archivos).

## Bloque 5 · Pantallas

### T-024 `[P]` · Textos y estados
`disenador-ui` · R · pendiente · Depende de: P1, 020 (`textos.ts`, `catalogo.ts` en `main`), P23-15 (REQ-043), P23-13 (D-013, para el texto final de pausa) · REQ-008, REQ-022, REQ-034, REQ-043, REQ-044, REQ-056, REQ-064, REQ-065 · CA-014, CA-022, CA-028, CA-032, CA-033
- Textos de `diseno.md` («Diálogos», vacíos, avisos, errores) en `textos.ts` y los estados nuevos en `catalogo.ts`; las dos variantes del diálogo de pausa hasta D-013. Prueba: PRUEBA-014 (búsqueda automática de apoyo) y revisión del `revisor`.

### T-025 `[P]` · Rutas y entrada del menú
`ingeniero-frontend` · R · pendiente · Depende de: P1, P23-10 (enmienda de la 020), T-007 (PRUEBA-005), T-008 (b) (PRUEBA-009) · REQ-071 · CA-037
- Plantillas de ruta de la 023 en `rutas.ts` y «Informes» en `AREAS_SUPERADMIN` (DD-26). Prueba: PRUEBA-009 (entrada del menú, con teclado), PRUEBA-005 en verde.

### T-026 · Sección de informes de la ficha
`ingeniero-frontend` · R · pendiente · Depende de: T-008, T-018, T-021 (a), T-024, T-004, P23-07 (a) · REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-015, REQ-031, REQ-056, REQ-057, REQ-062 · CA-004, CA-006, CA-008, CA-025, CA-029, CA-031
- `ci/`: `SeccionInformes`, `TablaInformes`, `DetalleInforme`, `EvolucionCifras`, `PeriodoInformes`, bloque «Señal»; en la muestra. Prueba: PRUEBA-007, PRUEBA-008.

### T-027 · Página «Informes»
`ingeniero-frontend` · R · pendiente · Depende de: T-026, T-025, 022·T-024 (`listarClientes`, P23-07 b) · REQ-068, REQ-069, REQ-070, REQ-071, REQ-077 · CA-037, CA-038
- `FiltrosInformes`, `FiltroCliente`, filtros aplicados y manipulados (DD-19). Prueba: PRUEBA-009.

### T-028 · Resumen
`ingeniero-frontend` · R · pendiente · Depende de: T-008, T-021 (a), T-024 · REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-059, REQ-063 · CA-010, CA-011, CA-012, CA-013
- `cr/`: los cuatro bloques independientes. Prueba: PRUEBA-010.

### T-029 · Órdenes: sección, página y diálogos
`ingeniero-frontend` · D · pendiente · Depende de: T-008, T-021 (a), T-024 · REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-026, REQ-027, REQ-028, REQ-030, REQ-042, REQ-043, REQ-044, REQ-064, REQ-065, REQ-076 · CA-014, CA-018, CA-019, CA-022, CA-032, CA-033, CA-035
- `co/`: `SeccionOrdenes`, `EstadoPausa`, `TablaOrdenes`, `DialogoCrearOrden`, `DialogoAnularOrden`; página «Órdenes» solo de consulta; cliente de baja (DD-29). Prueba: PRUEBA-011.

### T-030 · Exportar: diálogo y descarga
`ingeniero-frontend` · C · pendiente · Depende de: T-002 (a), T-026, T-020 · REQ-011, REQ-072, REQ-079, REQ-080 · CA-039, CA-040, CA-041
- `DialogoExportar` y `li/descarga.ts` (lectura completa, comprobación de tamaño y líneas, cuatro resultados). Prueba: PRUEBA-012.

### T-031 · Páginas reales y enchufe en la ficha
`ingeniero-frontend` · D · pendiente · Depende de: T-022, T-023, T-026 a T-030, T-007 (PRUEBA-005, guardia primero), T-008 (b) (PRUEBA-027 y 029), 022·T-028 (ficha y `secciones.ts`, P23-07 d), 021·T-014 (`/admin`), P23-08 · REQ-001, REQ-012, REQ-031, REQ-037, REQ-038 · CA-002, CA-010, CA-036
- `src/app/admin/page.tsx`, `informes/page.tsx`, `ordenes/page.tsx`, los `_vista/` y las dos secciones en `secciones.ts`; guardia primero. Prueba: PRUEBA-027, PRUEBA-029 (vistas).

## Bloque 6 · Verificación

### T-032 · Accesibilidad, 320 px, textos y marcado
`qa` · R · pendiente · Depende de: T-026 a T-031 · **Persona:** revisión manual con el `disenador-ui` · REQ-031, REQ-032, REQ-033, REQ-034, REQ-062 · CA-025, CA-026, CA-027, CA-028, CA-031
- Prueba: PRUEBA-013, PRUEBA-014, PRUEBA-015 (A y B); 25 capturas.

### T-033 · Pruebas B contra desarrollo
`qa` · D · pendiente · Depende de: T-016, T-017, T-031 · REQ-035, REQ-036, REQ-058, REQ-059, REQ-060 · CA-007, CA-013, CA-024, CA-030
- Prueba: PRUEBA-027 a PRUEBA-033 con el volumen cargado; percentil 95 de 20 cargas y de 20 exportaciones; latencia de `mcp_obtener_instrucciones` y de O-1 durante 10 exportaciones de 20.000 filas (m-4; por encima del objetivo, al arquitecto); cierre de CA-030 solo con V-112 verificada (P23-13).

### T-034 · Revisión de privacidad
`revisor`, con la skill `revision-privacidad` · R · pendiente · Depende de: T-033 · REQ-011, REQ-021, REQ-036, REQ-070, REQ-073 · CA-005, CA-039
- Prueba: PRUEBA-036 con 0 hallazgos, sobre vistas, mensajes, diálogos, registros, filas de auditoría y un archivo exportado ficticio.

### T-035 · Agente y plataforma [C, D]
`qa` · D · pendiente · Depende de: T-033, P23-04, conector de la fase 2 con agente de prueba y versión publicada, D-013 (P23-13), T-002 (b) · **Persona:** despliegue y agente · REQ-019, REQ-022, REQ-023, REQ-027, REQ-030, REQ-072 · CA-001, CA-039
- Prueba: PRUEBA-034 (10 órdenes alternas; con la orden de pausa no visible para el rol del conector, `pausada` y nunca el prompt, M-1) y PRUEBA-035 (archivo de más de 4,5 MB desde la app desplegada).

### T-036 · `verificacion.md`
`qa` · R · pendiente · Depende de: T-001 a T-035 · REQ-001 a REQ-080 · CA-001 a CA-041
- Cada requisito y criterio con su prueba, su evidencia y su estado real (art. 13); lo no ejecutado, como tal. Prueba: `node scripts/comprobar-specs.mjs` sin errores y revisión del `revisor`.

## Cobertura

Los 80 requisitos figuran en la cabecera de al menos una tarea de construcción (comprobado con búsqueda el 22/11/2026; el comprobador no se ha ejecutado); el reparto por grupo, en `diseno.md`, «Cobertura de requisitos». Criterios: cada uno figura en la cabecera de al menos una tarea, con las pruebas de `diseno.md`, «Cada criterio, con su prueba y cuándo se puede cerrar»; PRUEBA-037 se suma a CA-020 y PRUEBA-038 a CA-022.

## Escalados

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
| — | — | — | Ninguno todavía |
