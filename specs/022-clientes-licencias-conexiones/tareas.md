# 022 · Tareas

Autor: `arquitecto` · 22/11/2026 · Fuente: `diseno.md` corregido con `dictamen-diseno-2.md` y con la revisión del `revisor`, confirmado por el auditor en `dictamen-diseno-3.md` (0 B, 0 M); P1 abierta por delegación D-036 el 22/11/2026, con N-1 a N-7 como condiciones de tarea. Orden, previas, catálogo de pruebas, bloqueos, riesgos y rutas críticas: `plan.md`. Ninguna prueba se ha ejecutado.

Un agente por tarea. `[P]`: en paralelo (sin archivos compartidos). «010·T-nnn»: tarea de otra función. **Persona**: lo que hace una persona. Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Partes** (D-029): (a), (b)… en ese orden; por tarea, un `verificar`, una revisión, un dictamen si RC es `C` o `D` y una aprobación (D-036). Una parte «aparte» se integra sola.
- **Prueba primero:** `plan.md`, «Cómo se integra un par prueba–código». La prueba que cierra cada tarea se escribe en rojo en su primer commit; si es de otra tarea (T-007, T-008), ya está en `main`.
- **RC:** `C` = ruta crítica (`plan.md`, «Rutas críticas tocadas»); `D` = no crítica, con dictamen; `R` = solo `revisor`. **CI**: cambia la configuración de CI (D-036).
- **Rutas:** `lc/` = `src/lib/clientes/`; `ac/` = `src/app/admin/clientes/`; `cc/` = `src/components/clientes/`; `mc/` = `src/app/muestra/clientes/`; `tu/` = `tests/unit/clientes/`; `te/` = `tests/e2e/clientes/`; `st/` = `supabase/tests/`; `sm/` = `supabase/migrations/`; `ev/` = `evidencias/` de esta función.
- **Evidencias:** sin valores de datos, códigos, HMAC, claves ni salidas con nombres reales; los testigos de PRUEBA-025 son cadenas ficticias.

## Bloque 1 · Previas

### T-001 · T-P1: `Nido` (Unicode, registros, ajustes por rol)
`qa` · D · pendiente · Depende de: (a) nada, `[P]`; (b) T-006 · **Persona:** ejecuta las consultas · REQ-077, REQ-080, REQ-082 · CA-049, CA-050
- (a) Puntos 1 y 3 a 6 de `plan.md`, T-P1, solo lectura (lo que escribe, en `begin … rollback`), con la lista de excepciones de `Nido` (m-17). (b) Punto 2, con `nombres.json` en `main`. Prueba de cada parte: evidencia en `ev/T-001/` (en (b), recuentos sin valores) y dictamen sobre ella.

### T-002 `[P]` · T-P2: campo dentro del diálogo de alerta
`qa` · D · pendiente · Depende de: 020·T-001 (PRUEBA-011 de la 020) · REQ-071, REQ-037 · CA-043
- En una copia desechable, lo de `plan.md`, T-P2, en tres motores. Nada entra en `main`. Prueba: evidencia en `ev/T-002/`.

### T-003 `[P]` · T-P3: el código en producción
`qa` · D · pendiente · Depende de: 002·T-003 (app en `main`) · REQ-021, REQ-022, REQ-024, REQ-046 · CA-015, CA-017
- Los cinco puntos de `plan.md`, T-P3 (m-8), con código ficticio fuera de Crockford (DD-27). Prueba: evidencia en `ev/T-003/`; primera ejecución exploratoria de PRUEBA-009 (código).

### T-004 `[P]` · T-P4: exposición, lectores directos y tiempo real
`qa` · D · pendiente · **Persona:** consultas en `Nido` · REQ-031, REQ-032, REQ-065, REQ-081 · CA-022, CA-023
- Los cuatro puntos de `plan.md`, T-P4. Prueba: evidencia en `ev/T-004/`; lo que no case, al arquitecto antes de T-010 y T-016.

### T-005 · ADR
`arquitecto` · C · pendiente · Depende de: P1 · REQ-013, REQ-017, REQ-020, REQ-032
- Propuestas de `diseno.md`, «Decisiones que requieren ADR»: ampliar ADR-0003 (los dashboards solo escriben por funciones), enmendar ADR-0006 punto 7 (dos causas con fecha), ADR-0002 punto 4 (15 minutos y un código vivo). Las aplica la coordinación. Prueba: dictamen del `auditor-seguridad` sobre cada una.

### T-035 `[P]` · Verificar V-109 (validadores)
`explorador`, con la skill `verificar-decision` · R · pendiente · REQ-036, REQ-055
- V-109 en la documentación oficial, con fuente y fecha; la coordinación anota el resultado en `docs/TECNOLOGIAS.md`. Refutada o sin verificar: T-022 no empieza y vuelve al arquitecto. Prueba: fila de V-109 con estado, fecha y fuente, revisada por el `revisor`.

## Bloque 2 · Pruebas delante

### T-006 `[P]` · Vectores de nombres (m-13, m-14, m-15)
`qa` · C · pendiente · REQ-051, REQ-052, REQ-053, REQ-077, REQ-080 · CA-002, CA-035, CA-049
- `tests/vectores/unicode-tp.txt` (extracto de `UnicodeData.txt`, solo los puntos de TP, con versión, fuente y fecha en su cabecera; licencia de Unicode anotada), `tests/vectores/generar-nombres.mjs` y `tests/vectores/nombres.json`: por cada punto de código de TP, admitido y clave esperada; vecinos de fuera de cada tramo; U+FEFF, U+2028, U+3000, U+2007 y tabulador en los extremos; NFD, U+0130, U+0131, U+0138, U+0149, U+0178, U+017F, ß; cada signo plegado de DD-33 frente a su ASCII (con U+00AB, U+00BB, U+00B4 y U+0060; «A–Z» = «a-z», «Uno…» = «uno...»); 480 y 481 puntos; nombres de CA-002, CA-006, CA-035 y CA-049. Unicode de `Nido` (T-001); hasta entonces, el de Node, como provisional.
- Prueba: `generar-nombres.mjs` reproduce `nombres.json` byte a byte (unitaria en `tu/vectores.test.ts`); revisión caso a caso del `revisor` contra `diseno.md`.

### T-007 `[P]` · PRUEBA-005: estática con trampas
`qa` · C · pendiente · Depende de: 021·T-011 (a) (su PRUEBA-003) · REQ-012, REQ-024, REQ-032, REQ-036, REQ-055 · CA-008, CA-023
- `tu/estatica.test.ts`: importaciones prohibidas (`diseno.md`, «Mapa de archivos»); `exigirAdministradorEnAccion()` primero en `ac/acciones.ts` y guardia primero en cada página; sin cachés ni borrados; ningún objeto de error a `registro.ts` ni a la supervisión; `fuente-bd.ts` sin `GET` ni filtros de PostgREST (m-16); el código solo en `generar-codigo.ts` y `DialogoCodigo`. Prueba: en verde sobre el árbol vacío; cada trampa sembrada en una copia desechable la pone en rojo.

### T-008 · Arnés en navegador y datos ficticios
`qa` · D · pendiente · Depende de: 020·T-009 (convenciones), 020·T-005 (muestra) · REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-007, REQ-010, REQ-030, REQ-037, REQ-038, REQ-039, REQ-040, REQ-042, REQ-064, REQ-074, REQ-078 · CA-001, CA-004, CA-021, CA-027, CA-028, CA-029, CA-030, CA-038, CA-044, CA-047
- (a) `tests/ficticios/clientes/` (D-12: 1.000 clientes, ficha de 50 conexiones y 200 códigos, todos los estados, motivos, causas y canales, nombres de CA-006, CA-035 y CA-049). Prueba: unitaria de forma y recuentos.
- (b) `te/rutas.ts` y, generadas desde él, PRUEBA-007 a 011 (A) y 020 a 024 (B). Prueba: en verde con `rutas.ts` vacío; una ruta sembrada en una copia desechable las pone en rojo.

## Bloque 3 · Base de datos

Todas salvo T-020: `ingeniero-bd`, RC `C`, migración nueva tras M10 y la de auditoría de la 024 (D-10), con `.claude/rules/bd.md` y `migracion-bd`, pgTAP de acceso cruzado entre dos clientes, PRUEBA-019 (aplicar → revertir → aplicar) y suite acumulada en verde. Dependen de P1, T-001 (a), T-004 y M02 a M10 de la 010. Cada tarea de M22-3, **su propio archivo**. Cerrojos de DD-34 antes de anotar (DD-35). **Regla global (N-2, P-53 c):** toda función que escriba en `clientes`, `licencias`, `codigos_activacion` o `conexiones` toma el cliente y luego la licencia antes de su primera fila de auditoría; la revisión de cada tarea lo comprueba función a función.

### T-009 · M22-1: funciones puras
`ingeniero-bd` · C · pendiente · Depende de: T-006, 021·T-007 (a) (lista de PRUEBA-048) · REQ-002, REQ-017, REQ-077, REQ-080 · CA-011, CA-049
- `privado.normalizar_nombre()` y `privado.clave_nombre()` (`immutable`; tabla generada desde `nombres.json`, plegado de DD-33 y tope; `diseno.md`, «Regla de nombres») y D-7 (`situacion_licencia`, `estado_cliente_lista`, `estado_codigo`: reciben valores, `stable`, sin leer tablas ni `security definer`); `execute` de D-7 para `authenticated` y en la lista de PRUEBA-048 de la 021. Prueba: PRUEBA-002 (cada vector de `nombres.json`), PRUEBA-013 (permisos y `provolatile` de las cinco), PRUEBA-019 (M22-1).

### T-010 · M22-2: columnas, índices y lecturas de la 010
`ingeniero-bd` · C · pendiente · Depende de: T-009, migración de auditoría de la 024 aplicada en CI con P-49 (D-10) · REQ-008, REQ-013, REQ-017, REQ-025, REQ-034, REQ-051, REQ-053, REQ-057, REQ-068, REQ-072 · CA-009, CA-035, CA-037, CA-049
- (a) D-1, D-3 y D-4: columnas, restricciones (`nombre = normalizar_nombre(nombre)`, `nombre_clave` de `clave_nombre()`, `baja_en` si y solo si baja, motivo si y solo si revocada), índices únicos (`nombre_clave`, código vivo). `auditoria` no se toca (la migra la 024). Prueba: PRUEBA-002 (restricciones; CA-049 también como `postgres` o con concesión solo de prueba, comprobando el código, m-20 b), PRUEBA-019 (esta parte).
- (b) D-2, índice de licencia vigente y, en la misma migración, las lecturas de la 010 con D-7 (`licencia_vigente`, `resolver_token` con cliente activo en su consulta, m-18, `resumen_cliente` y lo que liste T-004). Prueba: `m08_m10.test.ts` y pgTAP de M08 y M09 en verde; `resolver_token` con cliente de baja, no autorizado; PRUEBA-022 (`resumen_cliente`); PRUEBA-019 (con una revocada sin motivo deducible).

### T-011 · M22-3 (a): funciones internas y baja (D-4b)
`ingeniero-bd` · C · pendiente · Depende de: T-010, P-45, P-53, 021·T-007 (a) · REQ-011, REQ-025, REQ-027, REQ-033, REQ-034, REQ-062, REQ-073 · CA-007, CA-025
- `privado.revocar_conexion_interna()`, `privado.crear_codigo_interno()` (DD-26, M-1) sin `execute` para nadie más que su dueño; `create or replace` de `privado.al_dar_de_baja()` con `security definer`, `search_path` y permisos repetidos (m-11) y la I-03 de esta transacción con `into strict` por `principal_de_esta_transaccion` (DD-35, m-10), que solo acepta una principal de la lista local con clave `pg_current_xact_id()` que la sesión no puede sembrar y que además existe en `public.auditoria` (N-4, P-53 a). **N-6:** D-4b revoca solo conexiones que O-3 ya bloqueó en su paso 2; no toma cerrojos nuevos tras la I-03. Prueba: PRUEBA-017 (baja sin I-03, con una I-03 previa confirmada y con una I-03 sembrada a mano en la lista sin fila en `public.auditoria`: `baja_sin_auditoria`; revocación fallida provocada como propietario: el cliente no queda de baja, m-20 b), PRUEBA-018 (N-6, en T-019), PRUEBA-019 (`prosecdef`, `proconfig`, `proacl` tras aplicar y al revertir; N-7: tras revertir este archivo, la baja de un cliente con conexiones activas se rechaza entera, sin baja ni revocaciones a medias), PRUEBA-048 de la 021 en verde; `m07.test.ts` actualizado.

### T-012 · M22-3 (b): lecturas L-1 a L-7
`ingeniero-bd` · C · pendiente · Depende de: T-011, 021·T-007 (c) · REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-023, REQ-025, REQ-031, REQ-041, REQ-042, REQ-046, REQ-074, REQ-078 · CA-002, CA-016, CA-018, CA-022, CA-044
- (a) L-1 a L-6 (`diseno.md`, «Superficie de lectura»): `es_admin()` antes de leer parámetros, cero filas sin él (DD-17), L-4 sin `codigo_hmac`, búsqueda por fragmento de la clave con comodines literales. Prueba: PRUEBA-013, PRUEBA-020 (B), PRUEBA-022 (lecturas).
- (b) **Aparte**, tras el diseño de la 023: L-7. Prueba: PRUEBA-020 (columna de indicaciones).
- N-6 (`dictamen-diseno-3.md` la manda a T-011 y T-012): L-1 a L-7 no toman cerrojos de fila, así que en esta tarea la revisión solo comprueba que ninguna lectura lleva `for update` ni `for share`; el bloqueo del paso 2 de O-3 está en T-013 y su uso en D-4b, en T-011.

### T-013 · M22-3 (c): O-1, O-2 y O-3
`ingeniero-bd` · C · pendiente · Depende de: T-012, P-50 y reglas por defecto de la 025 · REQ-008, REQ-009, REQ-011, REQ-047, REQ-049, REQ-051, REQ-053, REQ-054, REQ-055, REQ-058, REQ-065, REQ-069, REQ-071, REQ-079 · CA-005, CA-007, CA-033, CA-035, CA-039, CA-048
- Los ocho pasos de «Operaciones»; O-1 con reglas por defecto; O-2 con `version` y, **N-3**, el cliente `for update` (no `for no key update`) en el paso 2, porque el renombre cambia `nombre_clave`, con índice único; O-3 con el tecleado comparado por clave con el nombre actual y tope de 480 (m-15), I-03 e `update` sin captura de excepciones entre ellos (m-10) y, **N-6**, en el paso 2 el cliente y después, por identificador, la licencia vigente, sus conexiones activas y el código pendiente, todos `for update`, antes de la I-03. Captura `unique_violation` y `check_violation` (M-2). Prueba: PRUEBA-002 (altas repetidas: `repetido`), PRUEBA-012 (B), PRUEBA-017 (O-1 a O-3), PRUEBA-018 (N-3, renombre contra inserción hija; N-6, 0 esperas en `pg_locks` tras la I-03; en T-019), PRUEBA-024 (fallos provocados, CA-048).

### T-014 · M22-3 (d): O-5 a O-9
`ingeniero-bd` · C · pendiente · Depende de: T-013; (a) también P-53 · REQ-011, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-043, REQ-048, REQ-050, REQ-056, REQ-060, REQ-069, REQ-072, REQ-073 · CA-009, CA-011, CA-012, CA-013, CA-034, CA-037
- (a) O-5 a O-7 («Transiciones de la licencia»); en O-7, la I-07 antes de quitar `suspension_manual_en` (DD-35). (b) O-8 (tecleado; conexiones por `revocar_conexion_interna`; I-11 al pendiente) y O-9. Prueba de cada parte, en sus operaciones: PRUEBA-015, PRUEBA-017, PRUEBA-023, PRUEBA-024.

### T-015 · M22-3 (e): O-10 y O-11
`ingeniero-bd` · C · pendiente · Depende de: T-014 · REQ-020, REQ-024, REQ-026, REQ-028, REQ-029, REQ-044, REQ-045, REQ-063, REQ-068, REQ-070, REQ-075 · CA-014, CA-020, CA-031, CA-042, CA-046
- O-10 por `crear_codigo_interno` (retira vivos caducados, compara solo el pendiente no caducado, anula el esperado; DD-20); O-11 por `revocar_conexion_interna`. Prueba: PRUEBA-016 (con un caducado vivo: `hecha`, «Caducado», 0 I-11, un vivo), PRUEBA-017 (O-10, O-11), PRUEBA-023, PRUEBA-024.

### T-016 · M22-4: D-5, D-6 y DD-29
`ingeniero-bd` · C · pendiente · Depende de: T-015, P-46, P-53, T-004 (puntos 2 a 4) · REQ-012, REQ-029, REQ-057, REQ-059, REQ-060, REQ-061, REQ-076, REQ-081 · CA-008, CA-020, CA-022, CA-045
- (a) Disparadores de D-5 con `create or replace trigger`, **sin mirar `current_user`** ni eximir a ningún rol (MA-1), cliente y luego licencia `for share` en dos sentencias (m-19, DD-34); `suspension_manual_en` solo a nulo con una I-07 de esa licencia en esta transacción (DD-35), si no `reactivacion_sin_auditoria` (R-MA-3); fuera los de M04 sobre las cuatro tablas. Prueba: PRUEBA-014, PRUEBA-015 (R-MA-3; N-4, con la I-07 sembrada a mano en la lista local sin fila en `public.auditoria`: `reactivacion_sin_auditoria`), PRUEBA-019 (al revertir siguen los rechazos).
- (b) D-6 y DD-29: `revoke` de `insert` y `update` de M07; en `clientes`, `licencias` y `conexiones`, `revoke select on <tabla>` y `grant select (<columnas>)` (m-12); política de licencias con `revocada_en is null`. Prueba: PRUEBA-013 (columnas), PRUEBA-022 (usuario de cliente), PRUEBA-019 (al revertir, 0 permisos de escritura sobre `revocada_en`, `anulado_en`, `usado_en` y `baja_en`; m-20 a).

### T-017 · Ajustes de registro por rol (DD-30, P-47)
`ingeniero-bd` · C · pendiente · Depende de: T-001 (puntos 4 y 5), P-47 · **Persona:** aplica en `Nido`, reinicia la API y Supavisor · REQ-082 · CA-050
- Migración nueva: guarda en `privado.ajustes_rol_previos` el valor previo de los cuatro ajustes por rol (DD-30) y los fija en `authenticator` y en los roles del conector (con guarda si el rol no existe). **N-5:** la tabla lleva un `check` que solo admite los cuatro ajustes; el SQL dinámico usa `format()` con `%I` para el rol y el ajuste y `%L` para el valor; si ya hay un valor previo guardado para ese rol y ajuste, no se sobrescribe (aplicar dos veces conserva el original). Vuelta atrás: cada uno a su valor previo, o `reset <ajuste>`; **nunca `reset all`**; al terminar, la tabla queda vacía. Excepciones: la lista de CI, en la prueba; la de `Nido`, de T-001 (a). Prueba (en rojo antes): PRUEBA-031 [B] (falla con un rol de prueba con inicio de sesión, sin ajustes y fuera de la lista, m-17); PRUEBA-019 (con los casos de N-5). Si no se pueden fijar (T-001), bloqueada y al responsable (A-12).

### T-018 · Datos ficticios en `supabase/seed.sql`
`ingeniero-bd` · C · pendiente · Depende de: T-016, 010·T-007 (guarda de entorno) · REQ-001, REQ-006 · CA-001, CA-003, CA-004
- Los de D-12, con dos usuarios de cliente de dos clientes distintos (para PRUEBA-022), coherentes con D-5 (ninguna conexión activa en licencia revocada ni cliente de baja) y con auditoría coherente. Prueba: pgTAP de recuentos y estados; la guarda de 010·T-007 sigue rechazando otro entorno.

### T-019 · Varias conexiones: `concurrencia-clientes.mjs`
`ingeniero-bd` · C · pendiente · Depende de: T-016, 021·T-008 (b) (`admin_dar_de_baja`, para PRUEBA-030) · REQ-043, REQ-045, REQ-048, REQ-050, REQ-053, REQ-068, REQ-075 · CA-009, CA-034, CA-035, CA-042
- `scripts/bd/concurrencia-clientes.mjs` (DD-31; casos en `plan.md`, «Pruebas y criterios»), con PRUEBA-030 y PRUEBA-018 entera: el bucle del conector y los casos N-1 (con el simulado del conector), N-2 (anotador de prueba, con su control positivo en orden invertido), N-3 y N-6. Prueba: en una base desechable, una operación rota a propósito, un caso que falta y los cerrojos de DD-34 invertidos dan salida distinta de 0.

### T-020 · Paso de `bd.yml`
`plataforma` · C, CI · pendiente · Depende de: T-019, 010·T-013, P-48 · REQ-048, REQ-053, REQ-068 · CA-009, CA-034, CA-035, CA-042
- Paso tras `supabase test db` y su número en `declaradas.json` de la 010. Prueba: la ejecución del CI en verde y, en una rama de prueba, el paso en rojo con el caso roto de T-019.

## Bloque 4 · Servidor

Todas: `ingeniero-backend`, RC `C`, primero la unitaria en rojo. Dependen de 002·T-003.

### T-021 `[P]` · `nombre.ts` y `caracteres.ts`
`ingeniero-backend` · C · pendiente · Depende de: T-006 · REQ-051, REQ-052, REQ-077, REQ-080 · CA-006, CA-035, CA-049
- `lc/nombre.ts` (`normalizarNombre()`, `claveNombre()` con la tabla y el plegado de `nombres.json`, tope de 480) y `lc/caracteres.ts` (TP rango a rango). Prueba: PRUEBA-001 (cada vector, igual que la clave esperada), PRUEBA-012 (A).

### T-022 `[P]` · Fechas, entradas y resultados
`ingeniero-backend` · C · pendiente · Depende de: T-035 (V-109 verificada) · REQ-019, REQ-036, REQ-040, REQ-054, REQ-055, REQ-056 · CA-013, CA-026, CA-036
- `lc/fecha-madrid.ts` (DD-10), `lc/entradas.ts` (listas cerradas, UUID y fecha validados antes de llamar, m-16; topes de 480 y 120) y `lc/resultados.ts` (formas de «Contratos»). Prueba: PRUEBA-003, PRUEBA-004.

### T-023 · Fuentes
`ingeniero-backend` · C · pendiente · Depende de: T-021, T-022, T-008 (a); (b), T-015 y 021·T-012 (a) · REQ-032, REQ-035, REQ-036, REQ-058 · CA-023, CA-024
- (a) `lc/fuente.ts` (`FuenteClientes`) y la fuente ficticia, solo en muestra y pruebas (DD-15). Prueba: PRUEBA-006 [A].
- (b) `lc/fuente-bd.ts`: siempre `rpc` por `POST` con la sesión (`leerDelArea()`), traducción solo por SQLSTATE y código fijo, sin `message`, `details` ni `hint` (m-16). Prueba: PRUEBA-006 [B], PRUEBA-024 (fuente), PRUEBA-005 en verde.

### T-024 · `acciones.ts`
`ingeniero-backend` · C · pendiente · Depende de: T-023, 021·T-012 (b), 020·T-008 (c) · REQ-031, REQ-035, REQ-041, REQ-042, REQ-043, REQ-055, REQ-064, REQ-074 · CA-022, CA-036, CA-038, CA-044
- `ac/acciones.ts`: nueve operaciones (O-1 a O-3, O-5 a O-9 y O-11), `listarClientes`, `leerSeccion` y `comprobarNombre`; `exigirAdministradorEnAccion()` primero; códigos de `registro.ts` de «Contratos». La acción de O-10 **no** va aquí (T-025). Prueba: PRUEBA-021 (B, nueve operaciones), PRUEBA-022 (acciones), PRUEBA-023, PRUEBA-005 en verde.

### T-025 · `generar-codigo.ts`
`ingeniero-backend` · C · pendiente · Depende de: T-024, T-015, 001·T-104 (b) (`secretos.ts`) · **Persona:** clave HMAC de desarrollo en el gestor local · REQ-020, REQ-021, REQ-024, REQ-045, REQ-058, REQ-068, REQ-075 · CA-017, CA-032
- `src/lib/licencias/generar-codigo.ts` (sorteo de la 001, HMAC con tipo, O-10 con `pendiente_esperado`; el código sale solo tras la transacción; sin respuesta o con `40P01`, `incierta`) y la acción `generarCodigo` en `ac/acciones.ts`, con `exigirAdministradorEnAccion()` primero. Prueba: unitaria (nunca registra ni devuelve el código salvo en `hecha`), PRUEBA-016 (desde la acción), PRUEBA-021 (O-10), PRUEBA-025 (parte de app).

## Bloque 5 · Pantallas

Todas: `ingeniero-frontend`, con el `disenador-ui` en lo visual. Dependen de 020·T-007 (c), 020·T-010 (a), (c), (d) y (j), 020·T-016 (a), (c) y (d) y 021·T-014; cada ruta, en `te/rutas.ts`; la muestra con `page.muestra.tsx` y `comprobarAccesoMuestra()` primero (m-9).

### T-026 `[P]` · `DialogoConfirmacionTecleada`
`ingeniero-frontend` · D · pendiente · Depende de: T-002, T-021 · REQ-037, REQ-038, REQ-071, REQ-077 · CA-043
- `src/components/dialogo/DialogoConfirmacionTecleada.tsx` («Confirmación tecleada»). Prueba: PRUEBA-009 (tecleado: 10 que no actúan y 3 que sí), PRUEBA-010.

### T-027 `[P]` · Lista
`ingeniero-frontend` · D · pendiente · Depende de: T-024 (o la fuente ficticia en A) · REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-010, REQ-039, REQ-078 · CA-001, CA-002, CA-029, CA-047
- `ac/page.tsx`, `ListaClientes`, `mc/`. Prueba: PRUEBA-007, PRUEBA-010, PRUEBA-011, PRUEBA-020 (B).

### T-028 · Ficha
`ingeniero-frontend` · D · pendiente · Depende de: T-027 · REQ-007, REQ-012, REQ-023, REQ-025, REQ-039, REQ-065, REQ-074 · CA-004, CA-016, CA-018, CA-039, CA-044
- `ac/[cliente]/page.tsx` (guardia primero; inexistente, ajeno o mal formado, V-1), `secciones.ts`, `FichaCliente`, una `Seccion…` por sección y el aviso permanente de baja (DD-16). Prueba: PRUEBA-008, PRUEBA-010, PRUEBA-020, PRUEBA-022 (V-1).

### T-029 · Formularios
`ingeniero-frontend` · D · pendiente · Depende de: T-028 · REQ-008, REQ-009, REQ-019, REQ-035, REQ-049, REQ-051, REQ-053, REQ-054, REQ-079 · CA-005, CA-013, CA-035, CA-048
- `ac/nuevo/`, `ac/[cliente]/editar/`, `FormularioCliente`, `FormularioCaducidad`; alta `incierta` con «Comprobar» (L-6). Prueba: PRUEBA-003 (en pantalla), PRUEBA-012, PRUEBA-021, PRUEBA-024 (interfaz).

### T-030 · Diálogos de acción
`ingeniero-frontend` · D · pendiente · Depende de: T-026, T-029 · REQ-011, REQ-015, REQ-016, REQ-018, REQ-026, REQ-030, REQ-047, REQ-067 · CA-021, CA-033, CA-041
- Los seis de «Diálogos de confirmación», con `textos.ts`; baja y revocar licencia con `DialogoConfirmacionTecleada`. Prueba: PRUEBA-009 (diálogos), PRUEBA-011, PRUEBA-021.

### T-031 · `DialogoCodigo`
`ingeniero-frontend` · C · pendiente · Depende de: T-030, T-025, T-003 (puntos 1 y 4 superados) · REQ-021, REQ-022, REQ-024, REQ-046, REQ-068 · CA-015, CA-017, CA-042
- `cc/DialogoCodigo.tsx` y el diálogo previo (REQ-068): solo en memoria, borrado al cerrar, desmontar, ocultar y en `pagehide`; solo «He terminado» lo cierra (DD-11). Prueba: PRUEBA-009 (código), PRUEBA-013 (CA-015, cinco vías), PRUEBA-021 (dos envíos en <100 ms).

## Bloque 6 · Verificación

### T-032 · Registros y rendimiento [B, D]
`qa` · C · pendiente · Depende de: T-017, T-031, entorno previo (D-016), V-112 · **Persona:** ejecuta en `Nido` y en el entorno previo · REQ-006, REQ-024, REQ-036, REQ-082 · CA-003, CA-017, CA-050
- PRUEBA-025 (testigos, con un UUID y una fecha mal formados por la API, m-16), PRUEBA-031 [D] (efecto, con control positivo), PRUEBA-028. Prueba: las tres, con evidencia sin valores; lo no ejecutado, como tal.

### T-033 · Agente con el conector [C]
`qa` · C · pendiente · Depende de: fase 2 (conector, activación, D-11 con cliente activo, m-18), T-031 · REQ-011, REQ-015, REQ-016, REQ-018, REQ-019, REQ-020, REQ-027, REQ-028, REQ-063, REQ-073 · CA-005, CA-007, CA-010, CA-012, CA-013, CA-014, CA-019, CA-046
- PRUEBA-026, PRUEBA-027 (también el canje, m-4), PRUEBA-018 (C). **N-1 y N-2 (P-52):** comprueba que el conector, tras el `for share` del cliente, vuelve a comprobar conexión y licencia sin revocar (o repite `resolver_token`) antes de escribir, y que trata `40P01` en la reutilización como denegación con reintento; PRUEBA-018 (C): una llamada resuelta antes de O-11 devuelve `autorizado: false` y no deja `ultimo_uso_en` posterior a `revocada_en`. Sin P-52 aceptada por la fase 2, esta tarea queda bloqueada. Prueba: las tres en el entorno de desarrollo.

### T-034 · Verificación
`qa` · R · pendiente · Depende de: T-001 a T-033, 010·T-013 · **Persona:** revisión manual (CA-027) y capturas (CA-028, CA-029) · REQ-001 a REQ-082 · CA-001 a CA-050
- `verificacion.md`: cada REQ y CA con su prueba y evidencia; PRUEBA-029 (`revision-privacidad`); lo no ejecutado, como tal (art. 13). Prueba: `comprobar-specs.mjs` sin errores y revisión del `revisor`.

## Cobertura

Cada REQ (81; el 066 se retiró) está en la cabecera de alguna tarea anterior a T-034, que los cierra todos; cada CA, con su prueba en `plan.md`, «Pruebas y criterios»; cada prueba, en la tarea que la escribe o la cierra (repasado a mano el 22/11; el comprobador lo ejecutó el `revisor` sobre la versión anterior, SUPERADO, y no se ha vuelto a ejecutar).

## Respuesta a `dictamen-diseno-2.md`

| Hallazgo | Tareas |
| --- | --- |
| MA-1 / m-19 | T-016 (a) |
| m-10 / m-11 | T-011, T-013 / T-011 |
| m-12 | T-016 (b) |
| m-13 / m-14 / m-15 | T-006, T-009, T-021 / T-006, T-009, T-021 / T-013, T-021, T-022 |
| m-16 | T-007, T-022, T-023, T-032 |
| m-17 | T-001, T-017; `plan.md`, persona |
| m-18 | T-010 (b) (`resolver_token`), T-033 (fase 2) |
| m-20 (a) / (b) | T-016 / T-010, T-011 |
| Sin comprobar por el auditor | T-001 (puntos 3, 4 y 6), T-004 (puntos 1 y 3) |

## Respuesta a la revisión del `revisor` (22/11/2026)

| Hallazgo | Tareas |
| --- | --- |
| R-MA-1 (bloqueo mutuo con el conector) | T-011 a T-016 (DD-34), T-019 (bucle), T-025 (`40P01` → `incierta`) |
| R-MA-2 (auditoría de la 024) | T-010 y bloque 3 (dependencia expresa) |
| R-MA-3 (`suspension_manual_en`) | T-014 (a), T-016 (a) |
| R-m1, R-m2 | `propuestas.md` (P-46, P-51) |
| R-m3 / R-m4 / R-m6 | T-009 / T-006 / T-011, T-016 (a) (DD-35) |
| R-m7 / R-m8 / R-m9 / R-m10 | T-016 (a) / T-016 (a) / T-017 / T-017 |
| R-m11 / R-m12 / R-m13 | T-001 (a) y (b), `plan.md` / T-035, T-022 / T-024, T-025 |
| R-m14 / R-m15 / R-m16 / R-m17 | T-009, T-011, T-019 / bloque 3 (un archivo por tarea) / T-010 y T-014 en (a) y (b) / T-010 (b) |

## Condiciones de `dictamen-diseno-3.md` (N-1 a N-7)

| N.º | Tareas y pruebas | Peticiones |
| --- | --- | --- |
| N-1 | T-033; T-019 (simulado); PRUEBA-018 | P-52 |
| N-2 | Bloque 3 (regla global); T-019, T-033; PRUEBA-018 (anotador de prueba) | P-52, P-53 (c) |
| N-3 | T-013; T-019; PRUEBA-018 (renombre contra inserción hija) | — |
| N-4 | T-011, T-016 (a); PRUEBA-015, PRUEBA-017 | P-53 (a) |
| N-5 | T-017; PRUEBA-019 | — |
| N-6 | T-011, T-013 (T-012, solo revisión); T-019; PRUEBA-018 | — |
| N-7 | T-011; PRUEBA-019 | — |

## Escalados

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
