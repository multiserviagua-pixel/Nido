# 022 · Propuestas para coordinación

Cambios que esta función necesitaría fuera del rango de la fase 3. El chat de la fase 3 no los edita: los anota aquí para el chat de coordinación y para los chats de las fases afectadas. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 3, a partir del informe del `especificador`.

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 022 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Auditoría con acción distinguible | Cada acción deja fila con una acción de lista cerrada: alta, edición y baja de cliente; creación, suspensión, reactivación, revocación y cambio de caducidad de licencia; generación de código; revocación de conexión (REQ-034). El disparador del modelo solo anota alta, cambio o borrado de fila | Fase 2 (010) y función 024 |
| 2 | Transiciones de la licencia | Solo se permiten las de REQ-015 a REQ-019; no se puede pasar una licencia a otro cliente ni devolver una revocada a activa, tampoco escribiendo directamente con sesión de superadmin (REQ-057, REQ-060). El modelo deja modificar cualquier campo | Fase 2 (010) |
| 3 | Revocación de conexión irreversible | No se puede quitar ni cambiar la fecha de revocación (REQ-029, REQ-061). El permiso del modelo lo permite | Fase 2 (010) |
| 4 | Códigos de activación creados solo por la vía prevista | Solo para licencia vigente de cliente activo, con la caducidad fijada, con el autor de la sesión y sin usar (REQ-020, REQ-044, REQ-057). El modelo deja insertarlos con cualquier valor | Fase 2 (010) |
| 5 | Campos del cliente | Desde el panel solo cambian nombre y frecuencia (REQ-009). El modelo deja modificar estado, canal y fecha de alta, y no rechaza caracteres de control en el nombre | Fase 2 (010) |
| 6 | Datos que el modelo no guarda | Estado «anulado» de un código (cuestión 4), motivo de revocación de una conexión (cuestión 13) y causa de la suspensión, manual o por cobro (cuestión 9) | Fase 2 (010), según las respuestas del responsable |
| 7 | Licencia revocada | Sus conexiones no obtienen instrucciones ni renuevan (REQ-018). En el modelo, revocar la licencia no revoca sus conexiones, y la renovación de tokens tiene que comprobar la licencia | Fases 1 y 2 (011, 014) |
| 8 | Respuesta con licencia revocada | La 022 vale con las dos opciones. `docs/ARQUITECTURA.md` dice «siempre con un estado»; el modelo responde no autorizado | Fase 2 (cuestión 17 de la 011) |
| 9 | Canal del cliente | La 022 lo muestra en lectura; el cambio queda en la 030 (su requisito 13) | Fase 4 (030, frontera 1 de su `propuestas.md`) |
| 10 | Usuarios del cliente en la ficha | La 040 (fase 5) especifica invitar y retirar el acceso de usuarios de cliente, que viven en la ficha. La 022 no lo especifica: deja el sitio | Fase 5 (040) |
| 11 | Suspensión manual y cobro | Dos causas separadas, si el responsable acepta la recomendación de la cuestión 9 | Fase 6 (050) |
| 12 | Entorno para probar la revocación | CA-019 y los criterios con agente de prueba necesitan el conector de la fase 2 en el entorno de desarrollo | Fase 2 |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/CONSTITUCION.md`, artículo 2 | Nota aclaratoria: en el dashboard de superadmin el identificador del cliente elige sobre quién se actúa; el permiso sale siempre de la sesión | Cuestión 11. Solo el responsable enmienda la constitución |
| `.claude/rules/interfaz.md` | Aclarar «ningún dato en la URL que no sea un identificador propio del usuario» para el superadmin | Misma cuestión |
| `docs/DISENO.md`, ficha de cliente | Decir en qué función se editan las reglas y el canal, y añadir los usuarios del cliente (fase 5) | Cuestiones 1 y 2; frontera 10 |
| `docs/PLAN.md` | Asignar fase a la edición de las reglas por cliente | Ningún plan de fase la recoge |
| `docs/SEGURIDAD.md`, A-07 | Añadir la fase 3 a «dónde se comprueba» | La fase 3 también lee datos de clientes |
| `docs/ARQUITECTURA.md`, flujo 2 | Aclarar qué recibe una licencia revocada | Frontera 8 |
| `docs/TECNOLOGIAS.md` | Anotar como decisiones las respuestas del responsable a las cuestiones 1, 7, 9 y 11, cuando las dé | Skill `sdd-aclarar`, paso 6 |

## Peticiones del diseño (14/11/2026)

Autor: `arquitecto`, al escribir `diseno.md`. Sustituyen o concretan las fronteras de arriba donde coinciden. **Ninguna está aplicada.** Los números D-, L-, O-, DD- y A- son los de `diseno.md`.

### A la fase 1 (001 y 002)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-01 | Caducidad del código de activación de 15 minutos, no 10, y cambiar el texto de la pantalla de activación («Caduca a los 10 minutos») | La 022 aprobada dice 15 (cuestión 3); el diseño de la 001 dice 10. Asunto A-5 |
| P-02 | Decidir qué pasa con la orden de operación `generar_codigo` cuando exista el panel: retirarla fuera del entorno local, o que deje fila de auditoría | Es una segunda vía para crear códigos sin la fila I-10. Asunto A-6 |
| P-03 | `src/lib/oauth/secretos.ts` ofrece una función que sortea un código y devuelve el código y su HMAC, importable solo desde `src/lib/licencias/generar-codigo.ts` fuera de `src/lib/oauth/`. El tipo entra en el cálculo del HMAC, para que el de un código no pueda coincidir con el de un token | REQ-020, REQ-022; amenaza AM-06 |
| P-04 | Códigos nuevos en la lista cerrada de `registro.ts`: `clientes_no_permitida`, `clientes_objeto_ajeno`, `clientes_resultado_incierto`, `clientes_lectura_fallida` | Supervisión sin valores |
| P-05 | Rutas críticas nuevas: `src/lib/clientes/`, `src/lib/licencias/`, `src/app/admin/clientes/acciones.ts` | Licencias y códigos |
| P-06 | Al verificar V-112: la supervisión de errores no captura cuerpos de respuesta ni argumentos de acciones de servidor | El código viaja en el cuerpo de una respuesta (REQ-024) |

### A la fase 2 (010, 011, 014)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-07 | `clientes`: restricción de caracteres del nombre; `nombre_clave` mantenida por la base de datos con `privado.clave_nombre()` e índice único; `version`; `baja_en`; `creado_en` inmutable (D-1) | REQ-049, REQ-051 a REQ-053, REQ-077 |
| P-08 | `licencias`: hechos con fecha en lugar de `estado` y `estado_manual` (`revocada_en`, `suspension_manual_en`, `suspension_cobro_en`, `caduca_en`, `creada_por`); una sin revocar por cliente; `cliente_id` inmutable (D-2) | REQ-013, REQ-017, REQ-072 |
| P-09 | `codigos_activacion`: `anulado_en`; `vivo` con índice único parcial por licencia; uso y anulación excluyentes; caducidad a 15 minutos por restricción; autor de la sesión; campos inmutables; **`codigo_hmac` sin permiso de lectura para ninguna sesión** (D-3) | REQ-022, REQ-068, REQ-070, REQ-076 |
| P-10 | `conexiones`: `motivo_revocacion` de lista cerrada (`administrador`, `credencial_reutilizada`, `revocacion_licencia`), presente si y solo si está revocada (D-4) | REQ-025, REQ-073 |
| P-11 | Disparadores de inmutabilidad como segunda capa (D-5) y ningún permiso de escritura de `authenticated` sobre las cuatro tablas; claves ajenas sin borrado en cascada (D-6) | REQ-057, REQ-059 a REQ-061, REQ-076 |
| P-12 | Una sola regla de estado para el panel y para el conector (D-7) | Que lo que ve el panel sea lo que recibe el agente |
| P-13 | Las siete lecturas (L-1 a L-7), que comprueban `es_admin()` por sí mismas, y las once operaciones (O-1 a O-11), con la forma de exponerlas que la 010 fije para la 021 | REQ-031 a REQ-034 |
| P-14 | `auditoria`: `accion` de lista cerrada con I-01 a I-12 e I-41, `fila_principal_id`, inserción solo desde funciones, y **sin** el disparador genérico sobre estas cuatro tablas (D-10) | REQ-034; la 024 prohíbe mostrar operaciones técnicas |
| P-15 | El conector comprueba conexión y licencia en la misma consulta que atiende cada llamada y cada renovación, **también la respuesta repetida de la ventana de gracia**; sin memoria de tokens válidos ni lecturas de réplica | REQ-027, CA-019 |
| P-16 | La activación rechaza códigos usados, anulados o caducados, y los de licencia revocada, suspendida o caducada o de cliente de baja; toma los cerrojos en el orden cliente, licencia, código | REQ-063; amenaza AM-12 |
| P-17 | La revocación automática por credencial reutilizada usa la misma función interna que la del panel, con su motivo. La fase 2 escribe los hechos H-03, H-04 y H-05 de la 024 | REQ-025 |
| P-18 | Si la 014 purga códigos, no purga pendientes | REQ-023 |
| P-19 | En la fase 3, un usuario de cliente no lee ninguna fila de estas cuatro tablas. Lo que la fase 5 necesite lo abre con su diseño | CA-022. Asunto A-3 |
| P-20 | Datos ficticios de D-12 y un sitio donde ejecutar pgTAP con varias conexiones a la vez (D-13) | CA-001 a CA-004, CA-009, CA-034, CA-035, CA-042 |

### A otras funciones de la fase 3

| N.º | A quién | Petición |
| --- | --- | --- |
| P-21 | 020 | Plantillas de ruta en `rutas.ts`; estados en `catalogo.ts`; textos en `textos.ts`; `DialogoConfirmacionTecleada` en `src/components/dialogo/`, en la muestra y en su PRUEBA-011; `src/app/muestra/clientes/` en el inventario |
| P-22 | 021 | Su prueba estática cubre `src/app/admin/clientes/`; `administradores.correo` legible desde la lectura de códigos; confirmar que un diálogo abierto se sustituye al caducar la sesión |
| P-23 | 023 | Una función que dé «Sin señal» y «En pausa» para una lista de hasta 25 clientes (L-7); los dos estados en el catálogo; sus secciones en `secciones.ts` |
| P-24 | 024 | I-11 vinculable también a I-06 y a I-03; confirmar la lectura de CA-025 (una fila principal más las vinculadas); qué identifica a un código en su página |
| P-25 | 025 | Una única fuente en la base de datos para los valores por defecto, que usa el alta; su sección en `secciones.ts`; confirmar que I-41 la escribe el alta |

### A fases posteriores

| N.º | A quién | Petición |
| --- | --- | --- |
| P-26 | Fase 4 (030, 032) | Cambio de canal; alerta por conexión nueva, que es el único aviso de un código generado con una sesión comprometida (asunto A-8) |
| P-27 | Fase 5 (040) | Su sección de usuarios en `secciones.ts`; revisar CA-022 de la 022 cuando abra lecturas a los usuarios de cliente |
| P-28 | Fase 6 (050) | La causa de cobro como `suspension_cobro_en`; ninguna función suya toca la causa manual; «forzar activa» como hecho aparte, que nunca quita la causa manual |

### A coordinación y al responsable

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-29 | **Aplicar la nota aclaratoria del artículo 2**, con fecha y versión. El responsable la eligió el 12/11/2026 y no está en `docs/CONSTITUCION.md`. Solo la puede hacer el responsable | REQ-074. Sin ella, la ficha con el identificador en la dirección incumple el artículo 2. Asunto A-1 |
| P-30 | ADR: ampliación de ADR-0003 («operaciones del panel»), enmienda del punto 7 de ADR-0006 (dos causas de suspensión) y, si hace falta, del punto 4 de ADR-0002 (15 minutos, un código vivo) | Cambian fronteras o valores de ADR vigentes |
| P-31 | Pasar a `aclaraciones.md` las 19 decisiones por delegación (DD-01 a DD-19) de `diseno.md` | D-019 pide anotarlas allí; el encargo del arquitecto no le dejaba editar ese archivo |
| P-32 | `docs/SEGURIDAD.md`: rutas críticas de P-05. `docs/DISENO.md`: ficha de cliente con sus secciones y el aviso de baja con conexiones activas. `docs/ARQUITECTURA.md`, flujo 1: un solo código vivo y 15 minutos | Documentos compartidos |

## Consolidación del diseño (21/11/2026)

Autor: `arquitecto`. `diseno.md` y `diseno.nuevo.md` se consolidan en `diseno.md` (base: la condensación del 19/11/2026, con el dictamen del 14/11/2026 incorporado; ver su apartado «Consolidación»). **`diseno.nuevo.md` queda retirado**: se ha vaciado a una nota y falta borrarlo con `git rm` (el arquitecto no tenía terminal). Ninguna petición está aplicada. Los números D-, O-, DD- y A- son los del `diseno.md` consolidado. Con la 010 ya diseñada y con migraciones, P-07 a P-14 pasan a ser **migraciones propias de la 022** (DD-22), y lo que sigue es lo que la 010 y otras funciones tienen que saber o cambiar.

### A la 010 (sin editar sus archivos)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-33 | Aceptar que migraciones de la 022, posteriores a M10, cambien sus tablas y funciones: quitar `licencias.estado` y `estado_manual` (D-2) y reescribir `licencia_vigente` y `resolver_token` (M08) con la regla única; revocar a `authenticated` los `insert` y `update` de M07 sobre `clientes`, `licencias`, `codigos_activacion` y `conexiones` (D-6); quitar las cascadas de M02 sobre códigos y conexiones; quitar los disparadores genéricos de M04 sobre esas cuatro tablas (D-10). Actualizar sus pruebas de permisos (`m07.test.ts` y pgTAP) y su ciclo de migraciones. Alternativa: si M02 aún no está en `Nido` (T-014), incorporarlo en la 010, sin cambiar lo demás | DD-22; cuestión 3 de la 010 («lo que cambien lo hacen con su propia migración») |
| P-34 | REQ-010 de la 010: ampliar la lista cerrada de funciones con `execute` para `authenticated` con las 18 de la 022 (D-8, D-9), y fijar cómo se exponen si `privado` no está en la API (T-P4). `revocar_conexion_interna` y `crear_codigo_interno`, sin `execute` para `authenticated` | m-3 del dictamen |
| P-35 | `auditoria`: `fila_principal_id` y `origen` (también los pide la 021) y `accion` de lista cerrada con las I- de la 022 | D-10 |
| P-36 | T-014: comprobar en `Nido` `log_statement`, `log_min_duration_statement` y `log_min_error_statement` (la 010 ya cita `log_statement`) y si el detalle de los errores de restricción llega al registro del proyecto | M-2 del dictamen; asunto A-12 |
| P-37 | Si el responsable elige A-10 (b): quitar `al_dar_de_baja`, `impedir_reactivar_cliente` y la condición `k.estado = 'activo'` de `resolver_token`. Si elige (a): `al_dar_de_baja` da motivo de revocación (D-4) | A-10, reservado |
| P-38 | Si el responsable elige A-11 (b): quitar `clientes_select_usuario` y `licencias_select_usuario` hasta la fase 5 | A-11, reservado |
| P-39 | Si el responsable elige A-9 (b): ampliar TP de M02, con dictamen del `auditor-seguridad` | A-9, reservado |

### A otras funciones

| N.º | A quién | Petición |
| --- | --- | --- |
| P-40 | 021 | Las 18 funciones de la 022 en la lista cerrada de PRUEBA-048; mismo patrón de `es_admin()` antes y después de los cerrojos (su m-1) |
| P-41 | 020 | `src/app/muestra/clientes/` en PRUEBA-024, con `page.muestra.tsx` y `comprobarAccesoMuestra()` primero (m-9) |
| P-42 | 001 y 014 | El canje del código de autorización comprueba conexión y licencia vivas (m-4); la activación vuelve a comprobar tras los cerrojos y marca el uso con actualización condicionada (m-1); `generar_codigo` solo en local, o por `crear_codigo_interno` (DD-26, m-7) |
| P-43 | Coordinación | Pasar DD-20 a DD-27 a `aclaraciones.md` como decididas por delegación D-036 (21/11/2026); presentar al responsable A-1, A-4, A-9, A-10, A-11 y A-12 (`diseno.md`, «Asuntos abiertos»); que la lista de publicación de `docs/SEGURIDAD.md` exija la alerta de conexión nueva (A-8) |
| P-44 | Especificador, según las respuestas | A-9: REQ-052 y CA-006. A-10: REQ-011, REQ-067, CA-007, CA-041 y motivo de revocación por baja en REQ-025. A-11: CA-022 |

## Puesta al día con D-040 y las cuestiones 17 y 18 (21/11/2026)

Autor: `arquitecto`, al poner al día `diseno.md`. **Ninguna está aplicada.** Los números D-, DD-, O- y PRUEBA- son los del diseño.

### Estado de las peticiones anteriores

| N.º | Estado |
| --- | --- |
| P-29, A-1 de P-43 | Hechas por D-040 (constitución 1.5) |
| P-36 | Sustituida por P-47 |
| P-37 | El responsable eligió (a): sigue en P-45 |
| P-38, P-39 | Sin objeto: A-11 y A-9 se decidieron con la opción (a) |
| P-44 | Hecha por el `especificador` (D-040) |
| P-34, P-40 | Donde dicen «las 18», son **17** (7 lecturas y 10 operaciones: sale O-4); además, las tres funciones de D-7 con `execute` para `authenticated` (P-46) |

### A la 010 (sin editar sus archivos)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-45 | Aceptar que una migración de la 022 cambie con `create or replace` el cuerpo de `privado.al_dar_de_baja()` (D-4b): da el motivo `baja_cliente`, revoca con `privado.revocar_conexion_interna`, deja cada revocación como I-12 vinculada a la I-03 de la baja y falla con `baja_sin_auditoria` si no hay I-03. Siguen el disparador `clientes_al_dar_de_baja`, `impedir_reactivar_cliente` y el filtro de cliente activo de `resolver_token`. Actualizar `m07.test.ts` (comprueba que el cuerpo usa `registrar_auditoria()`) y quitar `revocar_por_baja` como acción propia | A-10 (a), REQ-011, REQ-025, REQ-034 |
| P-46 | En M07, el `select` de tabla entera de `authenticated` sobre `clientes`, `licencias` y `conexiones` (M07 L321, L331, L340) pasa, con `revoke select on <tabla>` y luego `grant select (<columnas>)`, a las columnas de DD-29 (`clientes`: `id`, `nombre`, `estado`, `frecuencia_esperada_horas`, `creado_en`; `licencias`: `id`, `cliente_id`, `caduca_en`, `creada_en`, `revocada_en`, `suspension_manual_en`, `suspension_cobro_en`; `conexiones`: `id`, `licencia_id`, `asistente`, `creada_en`, `ultimo_uso_en`, `revocada_en`, sin `motivo_revocacion`; corrección del 22/11/2026), y `licencias_select_usuario` añade `and revocada_en is null`. `resumen_cliente` (M09) se reescribe con `privado.situacion_licencia()` (D-7), que recibe valores y no es `security definer`; su `execute` para `authenticated` amplía la lista cerrada de REQ-010. Actualizar las pruebas de permisos y de M09. Avisar de que quien lea `clientes.canal` o `licencias.creada_por` sin función `security definer` deja de poder (T-P4) | A-11 (a), REQ-081; mínimo privilegio: el usuario de cliente no ve `canal`, `nombre_clave`, `version`, `baja_en` ni el autor de la licencia |
| P-47 | Migración de roles (A-12): los cuatro ajustes de CA-050 van en los **roles que inician sesión**, no solo en `authenticated`: `authenticator` (la API) y los del conector. Un ajuste de rol solo actúa al iniciar sesión, `set role` no lo aplica (PostgreSQL, `ALTER ROLE`) y PostgREST solo aplica del rol de destino los de contexto de usuario. Con guarda si el rol no existe (PGlite), vuelta atrás `alter role … reset …`, prueba pgTAP de `rolconfig` y, en `Nido`, la prueba de efecto de PRUEBA-031. Antes, T-P1 comprueba que `postgres` puede fijarlos en `authenticator` y que `log_parameter_max_length_on_error` (de contexto de usuario y fuera de la lista de supautils) se admite por rol. Tras aplicarlos, una persona reinicia la API | REQ-082, DD-30. La nota de A-12 en `aclaraciones.md` dice «roles de la 010 y de los dashboards»: para la API, eso es `authenticator` |
| P-48 | `bd.yml` (propuesta 24 de la 010): un paso más, `scripts/bd/concurrencia-clientes.mjs`, tras `supabase test db`, con su número en `declaradas.json` | A-4 (a), DD-31; CA-009, CA-034, CA-035 y CA-042 |

### A la 024

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-49 | (a) Retirar I-04 `cliente_reactivacion` sin reutilizar su número y ajustar los recuentos de su catálogo (41 entradas, 36 que pueden ser principales) y lo que los cite. (b) I-12 vinculable también a I-03: cada conexión revocada por la baja deja su I-12 vinculada a la baja. (c) La acción `revocar_por_baja` de M07 no entra en el catálogo: es esa I-12 vinculada (P-45). (d) Sigue P-24: I-11 vinculable también a I-06 e I-03 | A-10 (a), D-040: la baja no se deshace y revoca las conexiones (REQ-011, REQ-034, CA-025) |

### A la 025

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-50 | CA-010 cita «reactivar el cliente», que ya no existe: dejar «al reanudar o reactivar la licencia» (2 de 2 casos) y mantener que con el cliente dado de baja 0 revisiones reciben reglas | D-040: la baja es definitiva (REQ-011 de la 022) |

### A coordinación

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-51 | Anotar en `aclaraciones.md` las cuestiones 17 y 18 decididas por D-036 el 21/11/2026 (ya en el «Registro de cambios» de la especificación) y, en P1, DD-28 a DD-35 (DD-33 a DD-35 añadidas el 22/11/2026 con la revisión del `revisor`) | El `arquitecto` no edita `aclaraciones.md` |

## Revisión del `revisor` sobre el diseño (22/11/2026)

Autor: `arquitecto`, al corregir `diseno.md`, `plan.md` y `tareas.md`. **Ninguna está aplicada ni aceptada.** P-46 y P-51 se corrigieron arriba (conexiones; DD-28 a DD-35).

### A la 010 y a la fase 2 (sin editar sus archivos)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-52 | Que cada función de la 010 y del conector que escriba en `conexiones` o `codigos_activacion` de un cliente (activación, renovación, canje, `ultimo_uso_en`) tome **antes** la fila de `clientes` y luego la de `licencias`, en ese orden y `for share`, de modo que espere en la fila del cliente al `for no key update` que toman primero O-2 a O-11 de la 022 (DD-34) sin tener ya conexión ni licencia. T-P4 (punto 4) lista las que hoy no lo hacen. Es la segunda barrera: DD-34 basta para T-016, pero T-033 (fase 2) la exige | R-MA-1: con la secuencia conexión → licencia de M08 (L154 y L238, H-11) y otro orden en el panel, `40P01`; PRUEBA-018 lo comprueba con 20 repeticiones y 0 `40P01` |

### A la 024

| N.º | Petición | Motivo |
| --- | --- | --- |
| P-53 | (a) Una auxiliar `privado.principal_de_esta_transaccion(accion, objeto)` sobre la lista local de transacción de su disparador (su D-3), sin `execute` para nadie salvo su dueño, que devuelva la fila principal de esa acción y ese objeto anotada **en esta transacción** o nada; la 022 la usa en D-4b (I-03 de la baja) y en la regla de `suspension_manual_en` (I-07). (b) Admitir que las operaciones de la 022 tomen sus cerrojos de fila antes de la primera fila de auditoría y que en O-3 y O-7 la principal se anote **antes** del cambio que la exige, como excepción acotada a su regla «anotar es el último paso». (c) Confirmar que su cerrojo consultivo no se toma antes de esos cerrojos de fila | DD-35, R-MA-3 y R-m6: la 024 usa `clock_timestamp()`, así que buscar la I-03 por `now()` no la ata a la transacción, y `xmin` falla con subtransacciones; sin (b), la guarda de D-5 no puede ver la principal; sin (c), riesgo de bloqueo mutuo |

### Dependencias expresas

- **Migración de auditoría de la 024** (su D-1 a D-5, con P-49 aplicada): la 022 no tiene migración de auditoría propia (D-10). T-010 y el resto del bloque 3 no empiezan sin ella en CI (R-MA-2).
- **V-109** en VERIFICAR: T-035 la verifica antes de T-022 (R-m12).
