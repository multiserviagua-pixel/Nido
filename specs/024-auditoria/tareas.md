# 024 · Tareas

Autor: `arquitecto` · 22/11/2026 · Fuente: `diseno.md` puesto al día el 22/11/2026. **P1 abierta por delegación D-036 el 22/11/2026** tras el APTO del `auditor-seguridad` (vuelta 2), pendiente solo de la revisión del `revisor`. Condiciones del dictamen (MN-1 a MN-4, vuelta 1; MN-5 a MN-8, vuelta 2) en T-004, T-005, T-009, T-013 y T-014. Orden, previas, bloqueos, riesgos, puertas y rutas críticas: `plan.md`. Catálogo de pruebas: `diseno.md`, «Pruebas». Ninguna prueba se ha ejecutado.

Un agente por tarea. `[P]`: en paralelo (sin archivos compartidos). «022·T-nnn»: tarea de otra función. **Persona**: lo que hace una persona. Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Partes** (D-029): (a), (b)… en ese orden; por tarea, un `verificar`, una revisión, un dictamen si RC es `C` o `D` y una aprobación (D-036). Una parte «aparte» tiene su propio ciclo y se integra sola.
- **Prueba primero:** `plan.md`, «Cómo se integra un par prueba–código». La prueba que cierra cada tarea se escribe en rojo en su primer commit; si es de otra tarea (T-007, T-008), ya está en `main`.
- **RC:** `C` = ruta crítica; `D` = no crítica, con dictamen; `R` = solo `revisor`.
- **Rutas:** `la/` = `src/lib/auditoria/`; `ca/` = `src/components/auditoria/`; `pa/` = `src/app/admin/auditoria/`; `tu/` = `tests/unit/auditoria/`; `te/` = `tests/e2e/auditoria/`; `tf/` = `tests/auditoria/`; `st/` = `supabase/tests/` (de la 024, `st/auditoria/`); `sm/` = `supabase/migrations/`; `sr/` = `supabase/reversiones/`; `ev/` = `evidencias/` de esta función.
- **Evidencias:** sin valores de datos, nombres de clientes, correos, identificadores reales ni salidas con datos.

## Bloque 0 · Especificación

### T-001 `[P]` · Enmienda E-1
`especificador` · D · pendiente · Depende de: nada · REQ-002, REQ-012, REQ-018, REQ-021, REQ-022, REQ-029, REQ-031, REQ-054 · CA-001, CA-002, CA-003, CA-005, CA-009, CA-010, CA-027, CA-029
- Lo de `propuestas.md`, P24-01: retirar I-04 e I-32 sin reutilizar número; I-11 vinculable también a I-06 e I-03; I-12 también a I-03; I-28 sin I-32; entradas I-42 a I-45 (I-45 con sus 12 motivos y su texto visible); periodo en I-18 (REQ-002, REQ-018, REQ-029, REQ-031, REQ-054; CA-005, CA-009, CA-029); REQ-012 con D-040; recuentos (48 entradas, 38 principales, 7 vinculables) en CA-001, CA-002, CA-003 y CA-010; casos de baja y suspensión en CA-027. Prueba: `node scripts/comprobar-specs.mjs` sin errores, revisión del `revisor` y aprobación de la coordinación por P0 delegada (D-036), con constancia en `aclaraciones.md`.

## Bloque 1 · Previas

### T-002 `[P]` · T-P1: exposición de las lecturas
`qa` · D · pendiente · Depende de: 022·T-004 (punto 1), 023·T-001 · **Persona:** ejecuta las consultas · REQ-032, REQ-033 · CA-019, CA-020
- `diseno.md`, «Tareas previas», T-P1. Prueba: evidencia en `ev/T-002/` y dictamen sobre ella; sin exposición fijada, solo etapa A.

### T-003 `[P]` · T-P2: programador de H-05
`qa` · D · pendiente · Depende de: nada · **Persona:** consulta en `Nido` · REQ-058, REQ-062 · CA-018, CA-030
- `pg_cron` en el plan de `Nido` (`pg_available_extensions`, solo lectura), versión, rol con que corre un trabajo y si la 013 ya tiene programador. Prueba: evidencia en `ev/T-003/`; con gasto, ficha F-2 al responsable; sin programador, al arquitecto.

### T-004 · T-P3: orden, lista local y contexto
`qa` · C · pendiente · Depende de: (a) nada, `[P]`; (b) 010·T-013 (`bd.yml`) · **Persona:** (b) en `Nido` dentro de `begin … rollback` · REQ-007, REQ-008, REQ-015, REQ-019, REQ-026, REQ-043, REQ-050 · CA-003, CA-007, CA-012
- (a) Prototipo desechable en PGlite (no entra en `main`): `privado.auditoria_transaccion` con `pg_current_xact_id()`, `savepoint` revertido, disparador de restricción diferido `security definer`; `contexto_peticion()` con `set role` a cada rol, dentro de `security definer` y de un disparador; efecto de `set statement_timeout` en una función. (b) Dos conexiones con el agrupador: 1.000 acciones, orden de números igual al de confirmación; lista local nunca vista desde otra transacción; `session_user` y `current_setting('role')` reales de la API, el conector, `acceso`, el servicio de identidad y `pg_cron`, y que `acceso` y el conector entran con rol de conexión propio, no por PostgREST (DD-29); con `role` igual a `conector`, `acceso` o el rol del servicio de identidad, su contexto tras `set role` desde su rol de conexión y `otro` desde `authenticator`, que no es miembro de ellos (`diseno.md`, `contexto_peticion()`; Menor 4 del `revisor`); (MN-4) con `idle_in_transaction_session_timeout` y `lock_timeout` fijados por rol, que actúan con el agrupador en la API, el conector y `acceso`, y que una transacción inactiva tras tomar el cerrojo global se corta en el plazo y lo suelta; (MN-5) qué roles de la plataforma son miembros del dueño y de `pg_write_all_data` en `Nido` (`pg_auth_members`, solo lectura): si alguno lo es, D-12 no dejará retirar ninguna barrera y va al arquitecto antes de T-009. Prueba: evidencia en `ev/T-004/` con cada punto «cumple» o «no cumple»; si falla, al arquitecto antes de T-009.

### T-005 `[P]` · T-P4: la 010 real frente a «Datos»
`qa` · D · pendiente · Depende de: (a) nada; (b) T-009 integrada · **Persona:** (b) consulta en `Nido` · REQ-021, REQ-025, REQ-042, REQ-062 · CA-002, CA-006
- (b) (MN-3, DD-42) Consulta de solo lectura del recuento de `public.auditoria` en `Nido`, que una persona ejecuta justo antes de aplicar M24-1, y constancia de que entre M10 y M24-1 no se ha ejecutado nada en `Nido`. Prueba: evidencia en `ev/T-005/` con el recuento (debe ser 0) y sin datos; si no es 0, M24-1 no se aplica y va al arquitecto.
- (a) M04 a M10, `seed.sql`, `procedimientos/administradores.sql` y las pruebas de la 010 que cambian con M24-1 (`m04_m05`, `m06`, `m07`, `m08_m10`, `seed`, `pgtap`, `matriz`, `01_estructura`, `02_matriz_acceso`), cada `*_auditar` con su condición, cada concesión de escritura directa por rol; `auditoria` vacía tras M10 y tras `seed.sql`; versión mayor de PostgreSQL de CI. Prueba: informe en `ev/T-005/` con cada punto «cuadra» o «no cuadra» y su línea.

### T-006 · ADR
`arquitecto` · C · pendiente · Depende de: P1 · REQ-018, REQ-021, REQ-022
- Borrador en esta carpeta de «Auditoría de acciones del dominio» (`diseno.md`, «Decisiones que requieren ADR»); lo aplica la coordinación (P24-15). Prueba: dictamen del `auditor-seguridad`.

## Bloque 2 · Pruebas delante

### T-007 `[P]` · PRUEBA-008: estática con trampas
`qa` · C · pendiente · Depende de: P1, 021·T-011 (a) · REQ-024, REQ-033, REQ-061, REQ-067 · CA-006, CA-020, CA-030
- `tu/estatica.test.ts`: ningún control ni ruta de editar, borrar, ocultar, vaciar o exportar auditoría; guardia primero en `pa/page.tsx` y `pa/acciones.ts`; `no-store`; nadie en `la/` ni `pa/` importa `lib/supabase/admin.ts`; la fuente ficticia fuera del producto; `te/rutas.ts`. Prueba: en verde sobre el árbol vacío; cada trampa sembrada en una copia desechable la pone en rojo.

### T-008 `[P]` · Fuente ficticia y arnés de navegador
`ingeniero-pruebas` · D · pendiente · Depende de: P1, T-001, 020·T-005 (muestra), 020·T-009 · REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-036, REQ-057 · CA-010, CA-011, CA-022
- (a) `tf/fuente-ficticia.ts`: guiones cerrados con una fila por código, grupos de 1, 4 y 250 vinculadas, actores de cada origen y de baja, clientes de baja y eliminados, dos conexiones iguales, objeto que no existe, 10 nombres con marcado y los cinco estados. Prueba: unitaria de forma y recuentos. (b) `te/rutas.ts` y, generadas desde él, PRUEBA-004 a 007 [A] y 020, 022 y 023 [B]. Prueba: en verde con `rutas.ts` vacío; una ruta sembrada en una copia desechable las pone en rojo.

## Bloque 3 · Base de datos

Todas: RC `C`, migración **nueva** con marca posterior a la última integrada, `.claude/rules/bd.md` y `migracion-bd`, `search_path = pg_catalog, pg_temp` (D-035), pgTAP de acceso cruzado entre dos clientes, PRUEBA-031 y suite acumulada en verde. Dependen de P1, T-005 (a) y M01 a M10. Aplicar M24-1 en `Nido` depende además de T-005 (b) (DD-42).

### T-009 · M24-1: auditoría de acciones, barrera y guarda
`ingeniero-bd` · C · pendiente · Depende de: T-001 (E-1 aprobada), T-004, T-005 (a), P24-02, P24-10 (e) (nombres de roles) · REQ-015, REQ-017, REQ-018, REQ-019, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-029, REQ-030, REQ-042, REQ-043, REQ-044, REQ-045, REQ-047, REQ-054, REQ-062 · CA-002, CA-003, CA-005, CA-006, CA-007, CA-009, CA-030
- (a) `sm/` M24-1 y `sr/` su reversión: guarda de vacía; D-1 (en su sitio), D-2 (59 códigos), D-3, D-4, D-5, D-7, D-11, D-12 y `contexto_peticion()`. Prueba, en `st/auditoria/` y en rojo primero: PRUEBA-001 (base de datos), 009, 010, 031 (M24-1), 032, 033, 034 (una conexión), 035 y la parte estática de 012 (ninguna función salvo las auxiliares inserta en `auditoria`).
- (b) En el mismo commit, `supabase/seed.sql` (anota I-19 con las auxiliares antes de cada alta en `administradores`, MA-2) y las pruebas de la 010 que cambian (lista de T-005): la forma nueva de `auditoria`, la barrera en lugar de las filas genéricas, `al_dar_de_baja()` y el procedimiento de la 010 fallando cerrado. Prueba: suite de la 010 en verde con M24-1.
- Condición n-1 del dictamen 2 de la 023 y MA-1 (DD-38): D-12 recorre `pg_roles` (salvo dueño, superusuarios y roles predefinidos, `oid < 16384`; MN-5) y PUBLIC; `has_table_privilege` con `INSERT, UPDATE, DELETE, TRUNCATE` y `has_any_column_privilege` solo con `INSERT, UPDATE`; y falla si un rol que no sea el dueño ni superusuario es miembro de `pg_write_all_data` o del dueño (MN-5) (PRUEBA-033).
- MA-2 (DD-39) y MN-7: regla del dueño directo en `administradores` de D-11, con la principal atada a la operación (I-19 solo `insert`; I-43 solo `update` de las columnas de bloqueo de la 021, ninguno mientras no existan) (PRUEBA-032).
- MN-1 (DD-40) y MN-8: columna `contextos` en el catálogo con las listas de D-2 y comprobación en D-3 (5); vacía significa «no admite nada» y así quedan, hasta P24-10 (h), las entradas que D-2 declara vacías; I-27 e I-35, `{api_autenticada, servicio_identidad}` (PRUEBA-035).
- MN-2 (DD-41): D-3 (0), `for key share` del actor antes de `pg_advisory_xact_lock` (PRUEBA-013 y 018, partes de dos conexiones, por P24-06).
- MA-R1 (`revisor`): D-4 y D-5 no nombran `acceso` ni el rol del servicio de identidad, que crea después la 021 (P24-10 j); PRUEBA-031 aplica M24-1 sobre M01 a M10 sin ningún rol de la 021.
- MN-4 (DD-43): PRUEBA-013, parte de transacción inactiva, con los tiempos de P24-17; sin ellos en CI, «no ejecutable aún» (art. 13).

### T-010 · M24-2: lecturas
`ingeniero-bd` · C · pendiente · Depende de: T-009, T-002, 021·T-007 (c) (`es_admin()`), 022 P-46 (columnas), tablas de la 021 (`invitaciones_administrador`, `factores_administrador`), P24-05 · REQ-007, REQ-008, REQ-009, REQ-013, REQ-016, REQ-031, REQ-032, REQ-034, REQ-035, REQ-040, REQ-041, REQ-048, REQ-049, REQ-050, REQ-057, REQ-064 · CA-012, CA-013, CA-014, CA-016, CA-019, CA-032
- D-6: `leer_auditoria`, `leer_grupo_auditoria` y `actores_auditoria` (`security invoker`) y `describir_auditoria` (`security definer`, solo columnas de «Objeto»), `es_admin()` primero, entradas acotadas, `execute` solo para `authenticated`. Prueba: PRUEBA-018 (base de datos), 019 (base de datos), 020 (base de datos), parte de base de datos de 002 (filtros manipulados) y 031 (M24-2).

### T-011 · M24-3: hechos de caducidad (H-05)
`ingeniero-bd` · C · pendiente · Depende de: T-009, T-003 (y F-2 si hace falta), 022·T-009 (`situacion_licencia()`) · REQ-017, REQ-058 · CA-018
- D-8: `privado.anotar_caducidades()` y su trabajo cada 5 minutos con el programador de T-003, como dueño y sin más permisos. Prueba: PRUEBA-030 y 031 (M24-3).

### T-012 · Datos ficticios y de volumen
`ingeniero-bd` · C · pendiente · Depende de: T-009 · REQ-013, REQ-059 · CA-012, CA-013, CA-016, CA-028
- D-10: juegos de CA-001, CA-010, CA-012, CA-013 y CA-028 (los de CA-001 y CA-010, **parciales** hasta P24-10 (e) y (h): faltan las entradas que D-3 (5) aún rechaza; se completan en una parte aparte cuando la 021 responda, sin bloquear esta tarea, D-036) y guion de volumen en `supabase/datos/`, escritos con las auxiliares (filas de persona con `set role authenticated` y claims ficticios por actor), solo desarrollo y entorno previo. Prueba: recuentos del guion (500.000 filas, 1.000 clientes, 30 actores, 10 de baja) y huella estable al repetirlo.

### T-013 · PRUEBA-012: matriz de operaciones
`qa` · C · pendiente · Depende de: (a) T-009; (b) todas las migraciones de la 021, 022, 023 y 025 integradas · REQ-021, REQ-022 · CA-002
- (a) `st/auditoria/matriz_operaciones.test.sql`: cada función ejecutable por un rol de la aplicación o por el responsable, cada concesión de escritura y cada disparador sobre el servicio de identidad, asignado a una entrada o a «Lo que no es acción»; cada entrada con su `contextos` (MN-1); ninguna función con `for update`, `delete` o cambio de columna única sobre `administradores` (R-2, MN-2); ningún `TRUNCATE` concedido en tablas con `*_auditar` (MA-1); en rojo mientras falten funciones. (b) En verde con todas: 0 operaciones sin asignar; cada escritura aceptada deja su principal; `acceso` y el rol del servicio de identidad, ya creados por la 021, sin ningún permiso sobre `auditoria`, el catálogo, la lista local, la secuencia ni las funciones de D-4, D-6, D-12 y `contexto_peticion()` (MA-R1, P24-10 j). Prueba: la propia matriz, y una función o concesión sembrada sin asignar la pone en rojo.

### T-014 · Cobertura por acción
`qa` · C · pendiente · Depende de: T-009 y, por parte, (a) operaciones de la 022 (022·T-010 a T-016), (b) de la 023 (023·T-013, T-014), (c) de la 021 (021·T-008, T-009 y su I-19; repite PRUEBA-032 en `administradores` tras su migración, P24-10 g, con los casos de MN-7, y PRUEBA-033 con `acceso` y el rol del servicio de identidad ya creados, P24-10 j; sus procedimientos del dueño en `administradores` siguen el orden de D-11, fila en `for no key update`, anotar y actualizar, y PRUEBA-013 añade el caso de dos conexiones de MN-6), (d) de la 025 (OR-1, OR-2) · REQ-015, REQ-018, REQ-019, REQ-020, REQ-023, REQ-027, REQ-028, REQ-029, REQ-030, REQ-044, REQ-045, REQ-046, REQ-051, REQ-052, REQ-054, REQ-055, REQ-066, REQ-068 · CA-001, CA-003, CA-004, CA-005, CA-008, CA-009, CA-027, CA-033
- Por cada entrada de su función: PRUEBA-011 (fila exacta con dos administradores y dos clientes; vinculadas de CA-027, con baja y suspensión), 013 (fallo forzado, conexión cortada, sin esperas en `pg_locks` tras la primera fila; con dos conexiones y actor compartido, sin `40P01`), 014 (rechazos, repeticiones, 20 dobles envíos), 015 (campos de más), 016 (bajas, reactivación, renombre, bloqueo desde otro origen) y 017 (marcadores). Prueba: esas pgTAP en verde en CI para la parte.

## Bloque 4 · Servidor

### T-015 `[P]` · Catálogo, entrada, periodo, fecha y presentación
`ingeniero-backend` · D · pendiente · Depende de: P1, T-001, 022·T-022 (`fecha-madrid.ts`) · REQ-002, REQ-003, REQ-004, REQ-005, REQ-016, REQ-017, REQ-039, REQ-048 · CA-010, CA-014, CA-025
- `la/catalogo.ts` (59 códigos, 48 textos, motivos de I-45), `la/entrada.ts` (esquema cerrado de «Contratos»), `la/periodo.ts`, `la/fecha.ts` (`formatoFechaHoraSegundos`), `la/presentacion.ts`. Prueba: unitarias en `tu/`, PRUEBA-001 (app), 002 (parte de entrada), 007 (formato, enero y julio con otra zona).

### T-016 · Fuente y acciones
`ingeniero-backend` · C · pendiente · Depende de: T-015, T-010, 021·T-012 (a, b) (`exigirAdministradorEnAccion()`, `leerDelArea()`) · REQ-010, REQ-012, REQ-031, REQ-032, REQ-033, REQ-048, REQ-053, REQ-056, REQ-063 · CA-014, CA-015, CA-020, CA-021, CA-031
- `la/fuente-bd.ts` (siempre con la sesión; traducción por código fijo, sin `message`, `details` ni `hint`) y `pa/acciones.ts` (cuatro acciones; rechazos con código en `registro.ts`, sin valores). Prueba: PRUEBA-002 [B], 003 (registros), 021 (sin la clave secreta) y 022 (fallos de la fuente).

## Bloque 5 · Pantallas

### T-017 `[P]` · Filtros
`ingeniero-frontend` · D · pendiente · Depende de: T-008, T-015, 023 (`FiltroCliente`), 022·T-024 (`listarClientes` con bajas) · REQ-009, REQ-010, REQ-011, REQ-012, REQ-037, REQ-038, REQ-059 · CA-013, CA-015, CA-023, CA-024, CA-028
- `ca/FiltrosAuditoria`, `ca/FiltroActor` (búsqueda local), `ca/AvisoPeriodo` («Ver todo el historial»), dirección por `estado-direccion.ts` con las claves de DD-34. Prueba: PRUEBA-003 [A], 004 (filtros), 005 y 006 (filtros).

### T-018 `[P]` · Tabla con grupos
`ingeniero-frontend` · D · pendiente · Depende de: T-008, T-015 · REQ-002, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-036, REQ-037, REQ-038, REQ-049, REQ-057 · CA-010, CA-011, CA-022, CA-027
- `ca/TablaAuditoria` (un `tbody` por grupo), `ca/GrupoAuditoria` («Detalle», «Fuera del filtro», «y N detalles más», carga de 200 en 200), `ca/CeldaObjeto` (referencia y enlace), con `TextoDato` y `Paginacion` de la 020. Prueba: PRUEBA-004, 005 y 006 (tabla).

### T-019 · Página
`ingeniero-frontend` · C · pendiente · Depende de: (a) T-017, T-018; (b) T-016, 021·T-014 (`/admin`) · REQ-001, REQ-014, REQ-034, REQ-036, REQ-040, REQ-041, REQ-053, REQ-056, REQ-060 · CA-017, CA-019, CA-021, CA-022, CA-029
- (a) `ca/PaginaAuditoria` con la fuente ficticia en la muestra: cinco estados, datos parciales y «Reintentar nombres». (b) `pa/page.tsx` real: `exigirAdministrador()` primero, dinámica, `no-store`, corte nuevo en la primera carga. Prueba: (a) PRUEBA-004 (estados); (b) PRUEBA-020 (página), 022 y 023.

## Bloque 6 · Verificación

### T-020 · Accesibilidad, móvil y textos
`qa` · D · pendiente · Depende de: T-019 (a) · **Persona:** revisión manual con teclado y lector, con el `disenador-ui` · REQ-037, REQ-038, REQ-039 · CA-023, CA-024, CA-025
- Prueba: PRUEBA-005, 006 y 007 con capturas en `ev/T-020/` y la revisión manual sin hallazgos bloqueantes.

### T-021 · Pruebas B de la página
`qa` · C · pendiente · Depende de: T-019 (b), T-012, T-014 · REQ-014, REQ-032, REQ-034, REQ-035, REQ-040, REQ-041, REQ-053, REQ-056, REQ-060, REQ-063, REQ-065 · CA-012, CA-013, CA-017, CA-019, CA-021, CA-026, CA-028, CA-029, CA-031
- En navegador contra desarrollo: PRUEBA-018 (recorrido), 019 (filtros, simulacro A-11, periodo inicial), 020, 022, 023, 026 y 028. Prueba: esas pruebas en verde.

### T-022 · Etapa C: hechos del conector
`qa` · C · pendiente · Depende de: T-014, conector de la fase 2 con P24-03 y P24-07 · REQ-017, REQ-047, REQ-058 · CA-001, CA-018
- PRUEBA-011 y 025 para H-01 a H-04 con agente de prueba. Prueba: en verde; si el conector no existe, «no ejecutable aún».

### T-023 · Etapa D y procesos programados
`qa` · C · pendiente · Depende de: T-012, T-021, entorno previo (D-016) · **Persona:** prepara el entorno · REQ-013, REQ-062, REQ-067 · CA-016, CA-030
- PRUEBA-024 (200 mediciones por operación; 1.000.000 por página) y 027 (recuento antes y después de todas las tareas programadas; revisión de procesos). Prueba: percentil 95 bajo 2 s en todas; recuento igual o mayor.

### T-024 · Privacidad
`qa` · C · pendiente · Depende de: T-014, T-021 · REQ-029, REQ-030, REQ-031 · CA-009
- PRUEBA-017 revisada y PRUEBA-029 (skill `revision-privacidad`) sobre filas, respuestas y registros. Prueba: 0 hallazgos.

### T-025 · `verificacion.md`
`qa` · R · pendiente · Depende de: T-001 a T-024 · REQ-001 a REQ-068 · CA-001 a CA-033
- Cada REQ y cada CA con su prueba, su resultado y su evidencia; lo no ejecutado, como tal (art. 13). Prueba: `node scripts/comprobar-specs.mjs` sin errores con la especificación en VERIFICADA.

## Cobertura

Cada REQ-001 a REQ-068 está en la cabecera de alguna tarea anterior a T-025, que los cierra todos. Cada criterio con su prueba: `diseno.md`, «Pruebas». Prueba → tarea que la escribe o la cierra:

| Pruebas | Tarea |
| --- | --- |
| 001 | T-009 (base de datos), T-015 (app) |
| 002 | T-010 (base de datos), T-015, T-016 |
| 003 | T-016, T-017 |
| 004 | T-008, T-017, T-018, T-019 |
| 005, 006, 007 | T-008, T-017, T-018, T-020; 007 también T-015 |
| 008 | T-007 |
| 009, 010, 031 a 035 | T-009 (031 también T-010 y T-011; 033 también T-014 c) |
| 011, 013 a 017 | T-014 (011 de H-01 a H-04, T-022; 017, también T-024) |
| 012 | T-009 (estática), T-013 |
| 018, 019, 020 | T-010 (base de datos), T-021 (navegador); 020, también T-019 |
| 021, 022 | T-016; 022 también T-019 y T-021 |
| 023, 026, 028 | T-021; 023 también T-019 |
| 024, 027 | T-023 |
| 025 | T-022 |
| 029 | T-024 |
| 030 | T-011 |

## Escalados

Tareas que han subido de nivel de modelo o de esfuerzo, y por qué (`docs/EQUIPO.md`).

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
