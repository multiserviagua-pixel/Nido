# 022 · Plan

Autor: `arquitecto` · Fecha: 22/11/2026

Diseño: `diseno.md`, corregido con `dictamen-diseno-2.md` (0 B, 1 M, 10 m) y con la revisión del `revisor` (0 B, 4 M, 19 m); el auditor confirmó la corrección en su última vuelta (`dictamen-diseno-3.md`: 0 bloqueantes, 0 mayores, 7 menores). **P1 abierta por delegación D-036 el 22/11/2026**, tras `dictamen-diseno-3.md`, con N-1 a N-7 como condiciones de tarea (llevadas a sus tareas, a sus pruebas y a P-52 y P-53). Especificación APROBADA; este plan no cambia su estado. 35 tareas en seis bloques (`tareas.md`). **No se ha ejecutado ninguna prueba.** El comprobador lo ejecutó el `revisor` sobre la versión anterior (SUPERADO); tras esta corrección no se ha vuelto a ejecutar. El catálogo de pruebas y cada criterio con su prueba están aquí, en «Pruebas y criterios» (trasladados desde `diseno.md` por D-023).

## Orden de trabajo

### Los bloques, en orden

| Bloque | Tareas | Qué deja hecho | Por qué va ahí |
| --- | --- | --- | --- |
| 1. Previas | T-001 a T-005, T-035 | T-P1 a T-P4 con evidencia; ADR; V-109 | Deciden controles: Unicode, registros, exposición, diálogos, validadores |
| 2. Pruebas delante | T-006 a T-008 | Vectores de nombres, estática, arnés de navegador y ficticios | La prueba existe antes que el código que cierra |
| 3. Base de datos | T-009 a T-020 | M22-1 a M22-4, ajustes por rol, datos ficticios, varias conexiones y su paso de CI | La base de datos decide acceso, estado y transición |
| 4. Servidor | T-021 a T-025 | Nombres, entradas, fuentes, acciones y código | Las pantallas solo llaman a esto |
| 5. Pantallas | T-026 a T-031 | Lista, ficha, formularios, diálogos y `DialogoCodigo` | Última capa |
| 6. Verificación | T-032 a T-034 | Registros y rendimiento [D], agente [C], `verificacion.md` | Con entorno previo y conector |

### Etapas (`diseno.md`, «Supuestos y dependencias»)

A, en la muestra con la fuente ficticia: T-008, T-021, T-022, la parte ficticia de T-023 y T-026 a T-031; solo evidencia de interfaz. A' (PGlite) sirve de borrador a T-009 a T-016 y **no cierra nada**. B, con migraciones en CI (`bd.yml`), la migración de auditoría de la 024, T-P1 y T-P4. C, conector de la fase 2. D, entorno previo (D-016).

### Qué va en paralelo

- **Al empezar (`[P]`):** T-001 (a), T-002, T-003, T-004, T-006, T-007 y T-035. T-001 (b), tras T-006 (necesita `nombres.json`). T-005, tras P1.
- **Bloque 3 en serie** (T-009 → T-010 (a) → T-010 (b) → T-011 → T-012 → T-013 → T-014 (a) → T-014 (b) → T-015 → T-016): mismas tablas y pruebas. **M22-3 va en un archivo de migración por tarea** (T-011 a T-015; `diseno.md`, «Migración»), de modo que ninguno se edita después de integrado. T-017, tras T-001 (a) y en paralelo con el bloque 3 (otra migración). T-018, tras T-016. T-019 → T-020, tras T-016.
- **Bloque 4:** T-021 a la vez que el bloque 3; T-022 tras T-035, también a la vez. T-023 → T-024 → T-025 (T-024 escribe nueve operaciones y las lecturas en `acciones.ts`; T-025 añade allí la de O-10 con `generar-codigo.ts`).
- **Bloque 5:** T-026 en paralelo con T-027; T-028 → T-029 → T-030 → T-031 (comparten `src/components/clientes/` y `textos.ts`).
- **Límite de la cuenta** (D-032): revisiones y dictámenes, en cola; como mucho dos subagentes de máximo nivel a la vez.

### Cómo se integra un par prueba–código

Igual que `specs/021-acceso-superadmin/plan.md`, «Cómo se integra un par prueba–código», puntos 1 a 5, con rama `tarea/022-T-0NN` y commit `T-0NN (022): …`. Además:

1. **pgTAP y unitarias**, en rojo en su commit antes que el código, por quien escribe el código.
2. **Estática y en navegador**, de `qa` en T-007 y T-008, generadas desde `tests/e2e/clientes/rutas.ts`; la tarea que crea una ruta la añade en el mismo commit.
3. **Suite acumulada:** cada tarea del bloque 3 deja en verde las pgTAP de las anteriores y las de la 010, la 021 y la 024 que toque (`m07.test.ts`, `m08_m10.test.ts`, `04_funciones`, PRUEBA-048 de la 021).
4. **Lo que necesita un entorno inexistente** (CI, conector, entorno previo, persona) se escribe y revisa igual, y figura como «no ejecutable aún»; bloquea VERIFICADA, no integrar (art. 13).

## Tareas previas

Primeras del plan. Evidencia en `evidencias/T-00N/`, solo con booleanos, recuentos, nombres de ajustes, roles y tablas y versiones; nunca valores de datos ni secretos. En `Nido`, **solo lectura**: prepara `qa`, ejecuta una persona; lo que se pruebe a escribir, dentro de `begin … rollback`.

**T-P1 (T-001), `Nido`:**

1. Versión de PostgreSQL, `server_encoding` y versión de Unicode de `normalize()` (`unicode_version()` si existe); la de Node 26 (`process.versions.unicode`). Si difieren, el extracto de `UnicodeData.txt` de T-006 usa la de `Nido` y se anota.
2. DD-28: las expresiones de M22-1 (`normalize()`, `translate()` con la tabla y el plegado de DD-33, `replace()`), evaluadas en consultas sueltas sin crear objetos, dan en cada vector de `tests/vectores/nombres.json` lo mismo que Node. **Es la parte (b), tras T-006.**
3. Qué se registra: `log_min_messages`, `log_min_error_statement`, `log_statement`, `log_min_duration_statement`, `log_parameter_max_length`, `log_parameter_max_length_on_error`, `auto_explain`; si `pgaudit` está activo, con `pgaudit.log`, `pgaudit.log_parameter` y sus valores por rol (`pg_db_role_setting`). Lo que no corten los ajustes de DD-30, al arquitecto.
4. Si `postgres` puede fijar en `authenticator` los cuatro ajustes de CA-050, uno a uno (contexto en `pg_settings`, lista de supautils si es visible y un `alter role … set` dentro de `begin … rollback`), en especial `log_parameter_max_length_on_error`; y los valores previos de esos cuatro en cada rol (para la vuelta atrás de DD-30).
5. Cada rol con `rolcanlogin`: de la plataforma (lista cerrada de excepciones de `Nido`, con su motivo, para PRUEBA-031) o de la app y el conector (llevan los cuatro ajustes; m-17).
6. Si una sesión que entra como `authenticator` y hace `set role authenticated`, como PostgREST, sigue con los ajustes de `authenticator` (`current_setting()`); el efecto por la API queda para PRUEBA-031 [D].

**T-P2 (T-002):** un campo de texto multilínea dentro del diálogo de alerta de la 020 (su PRUEBA-011), en Chromium, Firefox y WebKit: foco inicial en «Cancelar», pegar, `aria-describedby`, Intro no confirma, botón con `aria-disabled` enfocable, lector de pantalla. Si falla en un motor, al arquitecto antes de T-026.

**T-P3 (T-003):** en una copia desechable, con `next build` y `next start` y una acción mínima que devuelve un código ficticio: (1) el código solo en el cuerpo de la respuesta de su acción, nunca en la carga RSC de la página, cabeceras ni registros (V-112); (2) `Cache-Control: no-store` en página y acción; (3) copiar con teclado; (4) con el diálogo **abierto**: atrás y adelante (caché de páginas del navegador) y navegación de cliente de Next 16 no lo repintan; `pagehide`, desmontar y ocultar lo borran (m-8); (5) cerrado: recargar, atrás y otra pestaña, 0 apariciones. Si (1) o (4) fallan, `DialogoCodigo` (T-031) no se integra y vuelve al arquitecto.

**T-P4 (T-004), repositorio y `Nido`:**

1. Exposición de la 010 (REQ-010 de la 010): qué esquemas sirve PostgREST; si `privado` está expuesto; qué funciones de `privado` puede ejecutar `anon` o `authenticated` por la API; que `revocar_conexion_interna`, `crear_codigo_interno`, `al_dar_de_baja`, `registrar_auditoria` y `principal_de_esta_transaccion` no las ejecuta nadie más que su dueño (PRUEBA-048 de la 021).
2. Quién lee `licencias.estado`, `licencias.estado_manual`, `clientes.canal`, `licencias.creada_por` o `conexiones.*` sin función `security definer` (código del repositorio y diseños de 023, 024, 025 y 030): lista para D-2 y DD-29.
3. Publicación de tiempo real: si `clientes`, `licencias`, `codigos_activacion` o `conexiones` están en `supabase_realtime` o en otra publicación. Si están, al arquitecto antes de T-016.
4. Qué pruebas de la 010 cambian con P-45 y P-46 (`m07.test.ts`, `m08_m10.test.ts`, `04_funciones`), y qué funciones de la 010 escriben en `conexiones` o `codigos_activacion` sin tomar antes el cliente (P-52).

Sin T-001 y T-004 en `main`, solo etapa A.

## Pruebas y criterios

Tipos y reglas: `diseno.md`, «Pruebas». Etapa entre corchetes. «Concesión solo de prueba»: un `grant` dentro de la transacción de la prueba, que se deshace.

**Catálogo.** 001 nombres en TypeScript, clave esperada de cada punto de TP [A]. 002 nombres en la base de datos, comodines, 20 carreras de altas; los rechazos de CA-049 también como `postgres` o con concesión solo de prueba, comprobando el código de la restricción y no `42501` (m-20 b) [B]. 003 validadores, tope de 480 y campos de más [A]. 004 `fecha-madrid.ts` [A]. 005 estática: importaciones, guardia primero (amplía la 003 de la 021), sin cachés ni borrados, ningún error al registro, `fuente-bd.ts` sin `GET` ni filtros de PostgREST (m-16) [A]. 006 contrato de `FuenteClientes` [A, B]. 007 lista en la muestra [A]. 008 ficha en la muestra [A]. 009 diálogos; tecleado en baja y en revocar licencia (10 que no actúan y 3 que sí en cada uno); `DialogoCodigo` [A]. 010 `axe` A y AA, 320 px, teclado y lector [A]. 011 textos [A]. 012 nombres de CA-006 [A, B]. 013 matriz, `codigo_hmac` ilegible, permisos de las 17 y de D-7, `provolatile` (`s` en las tres de D-7, `i` en las dos de nombres), columnas de DD-29 [B]. 014 escritura directa y D-5 (MA-1, R-m7): **todos** los rechazos de D-5 de CA-007 (devolver a activo, quitar `baja_en`), CA-020 (quitar y cambiar `revocada_en`, cambiar el motivo), CA-037 (cambiar `cliente_id` de una licencia, `licencia_id` de un código y de una conexión, `creado_por`) y CA-045 (quitar `anulado_en` y `usado_en`, cambiar `anulado_en`, alargar `caduca_en`), más volver `vivo` a verdadero e insertar o tocar una conexión activa en licencia revocada y en cliente de baja: con concesión solo de prueba a `authenticated`, como `postgres` sin `set role` y desde una `security definer` de prueba, cada uno con su código fijo [B]. 015 licencias: carreras, transiciones, causas; **R-MA-3:** quitar `suspension_manual_en` sin una I-07 de esa licencia en la transacción, 10 intentos como `postgres` y 10 desde una `security definer` de prueba (el «proceso automático» de CA-011), y también con una I-07 de otra licencia o de otra transacción ya confirmada: todos `reactivacion_sin_auditoria`; **N-4:** sembrar a mano en la lista local de transacción (`privado`, clave `pg_current_xact_id()`) una I-07 de esa licencia sin su fila en `public.auditoria`, como `authenticated`, como `postgres` y desde una `security definer` de prueba: la sesión no puede escribir en la lista (`42501`) y, sembrada como propietario, la comprobación en `public.auditoria` la descarta: `reactivacion_sin_auditoria`; cambiar una fecha por otra, rechazado [B]. 016 códigos: esperado, carreras, anulaciones; con un caducado vivo, generar da `hecha`, «Caducado», 0 I-11 y un vivo [B]. 017 auditoría de las 10, fallos sin efecto (también en la baja), baja sin I-03 rechazada, y también con una I-03 de ese cliente confirmada en otra transacción (m-10, DD-35) y con una I-03 sembrada a mano en la lista local de transacción sin su fila en `public.auditoria` (N-4): `baja_sin_auditoria` y el cliente sigue activo; la revocación fallida de CA-007 se provoca como propietario o con concesión solo de prueba y se comprueba su código, no `42501` (m-20 b) [B]. 018 carreras cruzadas; activación contra revocación y contra baja; **conector en bucle (DD-34):** conexiones con el rol del conector llaman sin parar a `mcp_obtener_instrucciones` (y a renovación y activación cuando existan) contra O-3, O-8 y O-11 del mismo cliente, 20 repeticiones de cada una, 0 errores `40P01` y las tres terminan `hecha`. **N-1 (revocación frente a llamada en curso):** una llamada del conector que resolvió su token antes de O-11 y espera en el `for share` del cliente devuelve `autorizado: false` al seguir, y no queda ningún `ultimo_uso_en` posterior a `revocada_en` [C; en B, con el simulado del conector]. **N-2 (regla global):** un anotador de prueba, función que escribe en `licencias` y `conexiones` de un cliente tomando cliente y luego licencia antes de su primera fila de auditoría, en bucle contra O-3, O-8 y O-11: 0 `40P01`; la misma con el orden invertido da `40P01` en alguna repetición (control positivo) [B]. **N-3:** O-2 que renombra (cambia `nombre_clave`) contra inserciones hijas del mismo cliente (licencia, código, conexión) a la vez: 0 `40P01`, el renombre `hecha` y cada hija `hecha` o rechazada con su código, nunca a medias [B]. **N-6:** tras la I-03 de O-3, la coordinadora ve 0 esperas de esa transacción en `pg_locks` (`granted = false`) hasta el `commit`: todos sus cerrojos se tomaron en el paso 2 [B]. 019 vuelta atrás: **aplicar → revertir → aplicar** M22-1, M22-2, cada archivo de M22-3, M22-4 y la de ajustes, con D-5 creado por `create or replace trigger`; tras M22-3 y al revertirla, `prosecdef`, `proconfig` y `proacl` de `al_dar_de_baja()` (m-11); tras revertir M22-4, 0 permisos de escritura sobre `revocada_en`, `anulado_en`, `usado_en` y `baja_en` y los rechazos de 014 siguen (m-20 a); al revertir los ajustes, solo los cuatro vuelven a su valor previo y otro ajuste sembrado en el rol sigue intacto (nunca `reset all`). **N-5:** `privado.ajustes_rol_previos` rechaza por su `check` una fila con un ajuste fuera de los cuatro; un valor previo sembrado con comillas y espacios vuelve byte a byte (`%L`) y un rol con mayúsculas o comillas en el nombre se trata bien (`%I`); aplicar dos veces no sobrescribe el valor previo guardado; tras revertir, la tabla queda vacía. **N-7:** tras revertir el archivo de D-4b (T-011), la baja de un cliente con conexiones activas (`update` directo como propietario y, si su archivo sigue aplicado, O-3) se rechaza entera: el cliente sigue activo, sus conexiones activas siguen activas (mismo recuento) y 0 filas de auditoría nuevas; nunca baja con revocaciones a medias [B]. 020 lista y ficha con 1.000 clientes; V-1 a V-4 [B]. 021 acciones desde la interfaz, dos envíos en <100 ms [B]. 022 sesiones de CA-022 y CA-044; usuario de cliente con DD-29 (otras columnas, `42501`; otro cliente o el suyo de baja, 0 filas; `resumen_cliente` sin error) [B]. 023 objetos ajenos, campos de más, origen, marcos [B]. 024 fallos y respuestas perdidas [B]. 025 testigos (códigos, búsquedas, tecleados, nombres, y un UUID y una fecha mal formados enviados directamente a la API, m-16) en app, supervisión y registros de Postgres y de la API: 0 [B, D]. 026 agente: baja, suspensión, revocación, caducidad, códigos [C]. 027 corte en <1 s, 20 veces, también en el canje [C]. 028 200 mediciones por operación [D]. 029 `revision-privacidad` [B]. 030 baja de un administrador mientras su O-8 espera un cerrojo [B]. 031 `rolconfig` de todo rol con inicio de sesión salvo la lista cerrada de su entorno (CI en [B]; `Nido`, por la persona en T-017) y efecto de DD-30 [D].

**Varias conexiones (DD-31), procedimiento:** por caso, K conexiones abren transacción y esperan un cerrojo consultivo compartido que una coordinadora suelta al ver las K esperas en `pg_locks`; después, `set local role` (`authenticated`, o el del conector en PRUEBA-018), claims con `set_config` y la operación; al final, comprobación como `postgres`. 20 repeticiones; fallo o caso que falta, salida distinta de 0; su número, en `declaradas.json` de la 010. Casos: CA-009, CA-034, CA-035, CA-042, PRUEBA-016, 018 y 030.

**Cada criterio y su prueba** (CA- y, entre paréntesis, PRUEBA-; antes de su etapa, evidencia parcial). 49 criterios (el 040 se retiró con el requisito 066).

- **A:** 026 (011), 027 (010), 028 (010), 029 (010), 030 (011), 041 (009, 011), 043 (001, 009, 010; T-P2), 047 (007).
- **B, migraciones:** 001 (007, 020), 004 (008, 020), 006 (012), 015 (009, 021), 016 (008, 020), 018 (008, 020), 021 (009, 021), 031 (016, 021), 032 (016, 021), 033 (017, 021), 036 (003, 023), 038 (023), 039 (008, 020, 023).
- **B, pgTAP:** 002 (001, 002, 007, 020), 008 (005, 014), 011 (008, 015; el «proceso automático» es `postgres` y una `security definer` de prueba sin I-07), 017 (025; V-112), 022 (013, 022), 023 (005, 013, `revisor`), 024 (017, 024), 025 (017), 037 (014, 023), 044 (013, 022), 045 (014), 048 (017, 024), 049 (001, 002, 012).
- **B, varias conexiones en `bd.yml`:** 009 (015), 034 (018), 035 (001, 002, 003), 042 (016, 021).
- **C:** 005 (017, 020, 026), 007 (014, 017, 026, 027), 010 (026), 012 (014, 015, 026), 013 (004, 026), 014 (016, 026), 019 (027), 020 (005, 014, 027), 046 (016, 021, 026).
- **D:** 003 (028), 050 (025, 031).

Sin pgTAP ni `bd.yml` no hay VERIFICADA (art. 13).

## Lo que bloquea y a quién

| Asunto | Estado | Bloquea |
| --- | --- | --- |
| P1 | **Abierta por delegación D-036 el 22/11/2026**, tras `dictamen-diseno-3.md` (0 bloqueantes, 0 mayores) | Nada por sí; N-1 a N-7 son condiciones de las tareas y pruebas donde figuran |
| Migración de auditoría de la 024 (su D-1 a D-5, con P-49 aplicada) | Sin tareas en la 024 | T-010 y todo el bloque 3 que anota (D-10) |
| P-53 (a la 024: `principal_de_esta_transaccion` sobre una lista que la sesión no puede sembrar, N-4; cerrojos antes de anotar; principal antes del cambio en O-3 y O-7; cerrojo consultivo después de los de fila y regla global de N-2) | Sin respuesta | T-011 (D-4b), T-014 (a) (O-7), T-016 (a) |
| P-45, P-46 y P-47 (a la 010) | Sin respuesta | T-011 (P-45), T-016 (P-46), T-017 (P-47) |
| P-52 (a la 010 y a la fase 2: el conector toma cliente y licencia antes de escribir, vuelve a comprobar tras el `for share`, N-1, y trata `40P01` en reutilización como denegación con reintento, N-2) | Sin respuesta | T-016 (a) no depende de ella (DD-34 basta); T-033 sí |
| P-48 (paso de `bd.yml`) | Sin respuesta | T-020 |
| P-50 (a la 025) y reglas por defecto de la 025 | Sin respuesta | O-1 en T-013 |
| 021: PRUEBA-048 (021·T-007 a), `es_admin()` (021·T-007 c), `admin_dar_de_baja` (021·T-008 b), `leerDelArea()` y guardia (021·T-012 a y b), `/admin` (021·T-014) | Pendientes | T-009, T-011; T-012 a T-016; T-019; T-023, T-024; T-027 a T-031 |
| 020: componentes (020·T-007 c, 020·T-010 a, c, d y j, 020·T-016 a, c y d), muestra (020·T-005) | Pendientes | T-008, T-026 a T-031 |
| 023: regla de «Sin señal» y «En pausa» (L-7) | Sin diseño | T-012 (b) y la columna de T-027 |
| Fase 2: conector, activación y `resolver_token` con D-11 | Sin diseño | T-033; CA de etapa C |
| Entorno previo (D-016) | No existe | T-032 |
| V-109 (validadores propios) | VERIFICAR | T-022 (T-035 la verifica antes) |
| V-112 (supervisión) | VERIFICAR | El cierre de CA-017 en T-032 |

## Tareas de una persona

| Tarea | Qué hace | Cuándo |
| --- | --- | --- |
| T-001, T-004 | Ejecuta en `Nido` las consultas de solo lectura que prepara `qa` y entrega la salida sin datos | Al empezar |
| T-017 | Aplica la migración de ajustes en `Nido`, reinicia la API y Supavisor (m-17) y repite la consulta de `rolconfig` con la lista de `Nido` | Tras integrar T-017 (art. 14) |
| T-025 | Pone en el gestor local la clave HMAC de los códigos del proyecto de desarrollo (art. 4) | Antes de sus pruebas |
| T-032 | Pruebas de registro en `Nido` y entorno previo; mediciones de PRUEBA-028 | Bloque 6 |
| T-034 | Revisión manual con teclado y lector de pantalla, con el `disenador-ui` (CA-027); capturas de P5 | Bloque 6 |

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| `Nido` no deja fijar algún ajuste por rol | T-P1 (4) | CA-050 no se cumple; vuelve al responsable (A-12). No se da por cumplido con `rolconfig` parcial |
| `pgaudit` u otro registro guarda parámetros | T-P1 (3) | Al arquitecto; desactivarlo es de una persona (art. 14) |
| Unicode distinto entre Node y `Nido` | T-P1 (1) o (2) | Extracto de la versión de `Nido`; si una clave difiere, no se integra T-009 ni T-021 |
| Tablas en la publicación de tiempo real | T-P4 (3) | Migración que las quita, con dictamen, antes de T-016 |
| D-5 rechaza escrituras legítimas de la 010 (por ejemplo, `ultimo_uso_en` en licencia revocada) | `m08_m10.test.ts` o PRUEBA-014 en rojo | El conector comprueba antes (D-11); si una función de la 010 lo necesita, al arquitecto; nunca una exención por rol |
| DD-34 no evita todo bloqueo mutuo | PRUEBA-018 con algún `40P01` | T-016 no se integra; al arquitecto (P-52 pasa a obligatoria) |
| La 024 no da la lista local de transacción (su T-P3) o no acepta P-53 | Sin respuesta o T-P3 de la 024 en rojo | T-011 y T-016 bloqueadas; nunca identificar la principal por hora |
| La 010 no acepta P-45, P-46 o P-47 | Sin respuesta en su `propuestas.md` | T-011, T-016 o T-017 bloqueadas; no se cambian migraciones auditadas de la 010 |
| El diálogo de alerta no admite el campo | T-P2 | Alternativa de diálogo con el arquitecto y el `disenador-ui` |
| Next repinta el código | T-P3 (1) o (4); PRUEBA-009 | `DialogoCodigo` no se integra; al arquitecto y al auditor |
| Rendimiento | PRUEBA-028 | Al arquitecto (índices, consulta) |
| Fase 2 tarde | Sin conector | Criterios de etapa C «no ejecutados»; la 022 no pasa a VERIFICADA |

## Entornos y despliegue

- **Local:** unitarias, estática y navegador sobre la compilación de producción, con la fuente ficticia en la muestra (nunca en producción, DD-15). PGlite solo de borrador.
- **CI:** `supabase test db` (pgTAP de la 010, la 021, la 024 y la 022) y el paso de varias conexiones (T-020). Lo de B no se cierra sin CI.
- **`Nido`:** solo lectura en T-001 y T-004; la migración de ajustes, por una persona (T-017); el resto, por el procedimiento de la 010 (010·T-014), cada archivo de M22-3 cuando su tarea esté integrada.
- **Entorno previo y producción:** no existen (D-016). Nada de la 022 va a producción sin T-032 y T-034.
- **Vuelta atrás:** `diseno.md`, «Migración y vuelta atrás» (orden M22-4 → M22-1; M22-4 nunca reabre lo definitivo y deja D-5), PRUEBA-019; ajustes por rol a su valor previo, nunca `reset all`; app con `git revert`.

## Cambios en CI

Solo T-020: un paso en `.github/workflows/bd.yml`, tras `supabase test db`, que ejecuta `scripts/bd/concurrencia-clientes.mjs`, y su número en `declaradas.json` de la 010. Cambio de CI por D-036: dictamen del `auditor-seguridad` y aprobación que lo nombre.

## Puertas que aplican

| Puerta | Aplica | Nota |
| --- | --- | --- |
| P1 Diseño y plan | Sí | **Abierta por delegación D-036 el 22/11/2026**, tras `dictamen-diseno-3.md` (0 bloqueantes, 0 mayores), con los 7 menores N-1 a N-7 como condiciones de tarea; revisor: 4 mayores y 19 menores corregidos (sin nueva revisión suya); comprobador SUPERADO. Revocable por el responsable. Bloquean T-011, T-013, T-016, T-017 y T-020 las peticiones P-45 a P-53 y la migración de la 024 |
| P2 Código | Sí | Tipos, estilo, unitarias y pgTAP en cada tarea |
| P3 Integración | Sí | CI, varias conexiones, fallos (PRUEBA-024) |
| P4 Seguridad y privacidad | Sí | `revisor` siempre; `auditor-seguridad` en RC `C` y `D`; PRUEBA-029 |
| P5 Experiencia | Sí | PRUEBA-010, revisión manual (CA-027), capturas (CA-028, CA-029) |
| P6 Operación | Sí | Migraciones, vuelta atrás, ajustes por rol, reinicios |
| P7 Cierre | Sí | Lo de etapa C y D sin ejecutar figura como tal |

## Rutas críticas tocadas

Todas con dictamen del `auditor-seguridad` además del `revisor` (licencias, RLS y migraciones).

| Ruta | Tareas |
| --- | --- |
| `supabase/migrations/`, `supabase/tests/` | T-009 a T-017 |
| `supabase/seed.sql` (datos con licencias y conexiones) | T-018 |
| `scripts/bd/concurrencia-clientes.mjs`, `.github/workflows/bd.yml` | T-019, T-020 |
| `src/lib/clientes/`, `src/lib/licencias/generar-codigo.ts` | T-021 a T-023, T-025 |
| `src/app/admin/clientes/acciones.ts` | T-024, T-025 |
| `src/components/clientes/DialogoCodigo.tsx` | T-031 |
| `tests/vectores/nombres.json` y la estática (son controles) | T-006, T-007 |
| `docs/adr/` | T-005 |

T-001 a T-004 no tocan producto, pero deciden controles: dictamen sobre su evidencia. DD-34 (cerrojos) y DD-35 (principal de la transacción) son decisiones nuevas en ruta crítica: el auditor las confirmó en `dictamen-diseno-3.md`, con N-1 a N-7 como condiciones.

## Aprobación

Puerta P1. Por D-036 la anota la coordinación, con fecha y constancia para que el responsable pueda revocarla.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 22/11/2026 | Coordinación, por delegación D-036 | **P1 abierta** tras `dictamen-diseno-3.md` (0 bloqueantes, 0 mayores, 7 menores); N-1 a N-7, condiciones de tarea. Revocable por el responsable |
