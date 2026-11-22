# 024 · Propuestas para coordinación

Cambios que esta función necesitaría fuera del rango de la fase 3. El chat de la fase 3 no los edita: los anota aquí para el chat de coordinación y para los chats de las fases afectadas. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 3, a partir de la especificación del `especificador`.

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 024 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Acción con nombre del dominio | Cada fila guarda una acción de una lista cerrada («revocó una conexión», «creó una orden de pausa»), y una acción fuera de la lista no se puede guardar (REQ-003, REQ-022). El modelo de referencia anota la operación técnica (`insert`, `update`, `delete`) y el nombre de la tabla | Fase 2 (010) |
| 2 | Fila por acción o por dato afectado | Exactamente una fila nombra cada acción (REQ-018). El requisito 17 de la 010 pide una fila por cada dato afectado. Recomendación de la fase 3: fila principal y filas vinculadas (cuestión 5) | Fase 2 (010) y responsable |
| 3 | Origen del actor | Las filas sin persona llevan un actor de lista cerrada («Sistema», «Agente del cliente»), nunca vacío (REQ-017). El modelo las anota con actor vacío | Fase 2 (010, su cuestión 17) |
| 4 | Acciones que ocurren en el servicio de identidad | Registrar, sustituir y quitar un segundo factor, aceptar una invitación, la recuperación y, si el responsable lo aprueba, el inicio de sesión completo y el cambio de contraseña dejan fila (entradas I-16 a I-23 y cuestión 1). No son cambios de tablas del panel: un disparador no las ve | Fase 2 (010) y diseño de la 021 |
| 5 | Actor del primer administrador | La fila identifica a la persona que ejecuta el procedimiento (I-15). El disparador del modelo anota la sesión, que no existe si se hace por SQL | Fase 2 (010) |
| 6 | Nadie inserta filas directamente | Ni el superadmin, ni el conector, ni la clave secreta (REQ-026, REQ-042). Coincide con los requisitos 16 a 18 de la 010 | Fase 2 (010) |
| 7 | Inventario de fases posteriores | Publicar, volver atrás, pausa global, resolver alertas, estado manual de cobro y exportaciones se añaden al inventario por la función que las especifique | Fases 4 a 6 |
| 8 | Conservación | No se elimina ninguna fila hasta que se fijen los plazos | Fase 6 (052, su cuestión 12) y fase 2 (010, su cuestión 7) |
| 9 | Anonimizar frente a solo inserción | Ninguna fila existente cambia (REQ-025, REQ-028). Según el `especificador`, la cuestión 12 de la 052 plantea anonimizar actores en la auditoría, lo que chocaría con eso. No lo he comprobado en la 052 | Fase 6 (052) y fase 2 (010) |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/MODELO-DATOS.sql` | Ver fronteras 1 a 5 | El modelo es de la fase 2 |
| `docs/DISENO.md`, «Textos y formatos» | Excepción del formato de hora en la página de auditoría (segundos), si el responsable la aprueba | Cuestión 7 |
| `docs/SEGURIDAD.md`, A-11 | Añadir a los controles el inventario cerrado de acciones y su prueba de cobertura | CA-001 y CA-002 |
| `docs/TECNOLOGIAS.md` | Anotar como decisiones las respuestas del responsable a las cuestiones 1 a 5, cuando las dé | Skill `sdd-aclarar`, paso 6 |

## Peticiones del diseño (22/11/2026)

Autor: `arquitecto`, al poner al día `diseno.md` y escribir `plan.md` y `tareas.md`. Sustituyen, donde difieran, a «Qué se pide a otras fases» y a los asuntos A-1 a A-7 del diseño del 19/11. **Ninguna está aplicada ni aceptada.** El arquitecto no ha editado nada fuera de `specs/024-auditoria/`.

### A la propia 024 (`especificador`)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P24-01 | **Enmienda E-1**, por P0 delegada (D-036): (a) retirar I-04 «Reactivó un cliente» e I-32 «Completó una recuperación…» sin reutilizar sus números; (b) I-11 vinculable también a I-06 e I-03, e I-12 vinculable también a I-03; I-28 vinculable a I-33, I-25, I-26 e I-27; (c) entradas nuevas: I-42 «Levantó el bloqueo de acceso de otro administrador» (administrador de la sesión; la cuenta), I-43 «Levantó fuera del panel el bloqueo de acceso de un administrador» (el responsable, fuera del panel; la cuenta), I-44 «Se detectó un cambio de credenciales hecho fuera del panel» («Sistema»; la cuenta), I-45 «Se anuló la marca de un navegador reconocido» (la cuenta; principal con el titular o «Sistema» por intentos, vinculada en los demás motivos) con la lista cerrada de 12 motivos visibles («Lo pidió el titular», «Diez intentos fallidos», «Se emitió una marca nueva», «Se superó el máximo de navegadores», «Se cerraron las demás sesiones», «Cambio de contraseña», «Restablecimiento de contraseña», «Uso de un código de recuperación», «Cambio del segundo factor», «Retirada del segundo factor», «Baja de la cuenta», «Cambio de credenciales fuera del panel»); (d) la fila de I-18 admite el periodo exportado (día desde y día hasta) y la página lo muestra: REQ-002, REQ-018, REQ-029, REQ-031, REQ-054, CA-005, CA-009, CA-029; (e) REQ-012 con la nota del art. 2 (D-040); (f) recuentos: 43 entradas de acción y 5 hechos (48 textos), 38 pueden ser principal y 7 vinculadas (CA-001, CA-002, CA-003, CA-010); (g) CA-027 añade la baja de un cliente con un código pendiente y 2 conexiones (1 principal y 3 vinculadas) y la suspensión con un código pendiente (1 y 1) | D-040 (baja definitiva), A-4 y A-12 de la 021, D-039 (REQ-041 de la 021), REQ-074 de la 023. Art. 5: el diseño no puede ir por delante |

### A la 010 y a la fase 2 (sin editar sus archivos)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P24-02 | Aceptar que M24-1 (D-1, D-5, D-11 de la 024) altere objetos de M04: `public.auditoria` en su sitio (vacía), `privado.auditar()` y `privado.registrar_auditoria()` convertidas en barrera que rechaza, y los `*_auditar` de M04 a M06 sin tocar; que en `administradores` el dueño directo solo escriba con su I-19 o I-43 anotada antes y nunca borre (D-11, MA-2), por lo que `supabase/seed.sql` anota I-19 con las auxiliares antes de cada alta; y que T-009 (b) de la 024 actualice en el mismo commit `seed.sql`, `m04_m05`, `m06`, `m07`, `m08_m10`, `seed`, `pgtap`, `matriz` (PGlite), `01_estructura` y `02_matriz_acceso`, y `ayudas/perfiles.psql` si hace falta | DD-23, DD-25; la suite debe seguir en verde |
| P24-03 | Su REQ-061 y su D-3 (no auditar al conector) frente a H-01 a H-04 de la 024: que el conector anote esos hechos con las auxiliares (resuelve P23-12 de la 023) | REQ-058 de la 024, aprobada por el responsable el 13/11/2026 |
| P24-04 | Retirar, cuando le convenga, las concesiones de escritura directa de M07 que ninguna función usa (`usuarios_cliente`, `publicaciones`, `ajustes_globales`, `alertas`): la barrera ya las rechaza; es mínimo privilegio | Art. 3 |
| P24-05 | Exponer `leer_auditoria`, `leer_grupo_auditoria`, `actores_auditoria` y `describir_auditoria` como fije su REQ-010 y añadirlas a la lista cerrada de funciones que ejecuta `authenticated` (PRUEBA-048 de la 021) | D-6 |
| P24-06 | En el paso de varias conexiones de `bd.yml` (propuesta 24; `scripts/bd/concurrencia-clientes.mjs` de la 022), los casos de PRUEBA-018 y PRUEBA-034 de la 024, con su número en `declaradas.json` | D-040 A-4 |
| P24-07 | Conector (M08 hoy, la 011 después): H-01 a H-04 como **último paso tras sus cerrojos** (R-2), cliente antes que licencia (R-3), desde funciones `security definer` del dueño (R-4): con su rol y `security invoker`, la barrera rechaza su escritura en `ordenes` y `conexiones` | D-3, D-11 |

### A la 013, a la 015 y a la fase 4

| N.º | Petición | Motivo |
| --- | --- | --- |
| P24-08 | 013: si tiene programador periódico, que H-05 use el mismo (`privado.anotar_caducidades()`) | DD-36 |
| P24-09 | 015 (y 030): desde M24-1, insertar en `versiones_prompt` desde la API (`service_role`) y en `publicaciones` desde `authenticated` se rechaza (`escritura_sin_accion_auditada`). Su REQ-025 necesita sus entradas en el catálogo de la 024 (con su especificación aprobada, como prevé la 024) y retirar su barrera con `privado.sin_escritura_directa()` (D-12). El dueño directo (migraciones, `seed.sql`) sigue insertando, sin fila. 032: igual para `ajustes_globales` y `alertas` | D-11, D-12; art. 9 |

### A la 021

| N.º | Petición | Motivo |
| --- | --- | --- |
| P24-10 | (a) Códigos de su (a) a (d): I-42 `bloqueo_levantamiento`, I-43 `bloqueo_levantamiento_responsable`, I-44 `credenciales_cambio_externo`, I-45 `marca_anulacion_<motivo>` (12; `diseno.md`, «Catálogo»), con E-1. (b) Corregir su «Auditoría» (d): `codigo_recuperacion` se vincula a la **principal de su I-28** (I-33, I-25, I-26 o I-27), no a la I-28, que ya es vinculada (DD-32). (c) `administradores_auditar` es incondicional: desde M24-1 rechaza las escrituras en `administradores` de sus funciones llamadas desde la API; la primera migración suya que las necesite lo retira llamando antes a `privado.sin_escritura_directa('public.administradores')`. (d) Su procedimiento de I-19 sustituye a `supabase/procedimientos/administradores.sql` de la 010, que con M24-1 falla cerrado (y cuya baja por `delete` no tiene entrada en el inventario). (e) Los nombres de su rol `acceso` y del rol del servicio de identidad (su T-P2), para `contexto_peticion()`. (f) Las filas I-27 e I-35 de su disparador de cambios directos: origen `persona`, contexto `servicio_identidad`, actor la cuenta autenticada; I-44, `sistema`. (g) Al retirar la barrera de `administradores` (c), conservar en un disparador propio la regla del dueño directo de D-11 (MA-2: `insert` o `update` solo con principal previa de origen `responsable_fuera_del_panel` sobre ese `usuario_id`; `delete`, rechazado), y su procedimiento de I-19 anota antes de insertar; PRUEBA-032 se repite tras su migración (T-014 c). La principal se ata a la operación (MN-7): I-19 solo justifica un `insert`; I-43, solo un `update` de las columnas de bloqueo que la 021 fije (y que debe nombrar). Sus procedimientos del dueño en `administradores` toman primero `select … for no key update` de la fila, luego anotan y luego actualizan, y nunca cambian una columna única (MN-6, sin `40P01`). Tenga en cuenta que `administradores.usuario_id` tiene `on delete cascade` desde `auth.users`: borrar en `auth` a un administrador queda rechazado por la barrera (falla cerrado, coherente con `on delete restrict` de `actor`); ninguna operación suya puede contar con ese borrado. Una migración suya que rellene columnas de `administradores` lo hace con valor por defecto en `alter table`, no con `update`. (h) Lista cerrada de entradas que cada C-n suya anota desde `acceso` y desde el servicio de identidad, para `contextos` del catálogo (D-2, MN-1). Hasta su respuesta, I-33, `marca_anulacion_renovacion`, `marca_anulacion_limite`, I-37, I-38 y `marca_anulacion_intentos` tienen `contextos` vacío («no admite nada»), así que ninguna C-n suya puede anotarlas; I-27 e I-35 quedan en `{api_autenticada, servicio_identidad}` (MN-8). (i) Ninguna función suya toma `for update` sobre `administradores`, la borra ni cambia una columna con índice único (R-2, MN-2): `for no key update`. (j) M24-1 va antes que la 021 (DD-37) y no nombra `acceso` ni el rol del servicio de identidad, que aún no existen (MA-R1 del `revisor`). La migración de la 021 que los cree no les da ningún permiso (ni directo, ni por pertenencia a otro rol, ni por `alter default privileges`) sobre `public.auditoria`, `privado.acciones_auditoria`, `privado.auditoria_transaccion`, `privado.auditoria_numero` ni las funciones de D-4, D-6, D-12 y `contexto_peticion()`; PRUEBA-012 y PRUEBA-033 lo comprueban tras su migración (T-013 b, T-014 c). `authenticator` no es miembro de esos roles (`contexto_peticion()`) | «Auditoría» de la 021; DD-29, DD-31, DD-32 |

### A la 022

| N.º | Petición | Motivo |
| --- | --- | --- |
| P24-11 | (a) Se acepta P-53 (a) y N-4: `privado.principal_de_esta_transaccion(accion, objeto_id)` devuelve el número o nulo; con más de una, `auditoria_principal_repetida` (`diseno.md`, D-4). (b) P-53 (b) ya no es excepción: R-2 (primera fila tras el último cerrojo de fila) cubre O-3 y O-7. (c) Se adopta N-2 como R-3. (d) P-49 aplicada en E-1 y en el catálogo. (e) La 024 **no retira** `clientes_auditar`, `licencias_auditar`, `codigos_activacion_auditar` ni `conexiones_auditar`: quedan como barrera, que sus operaciones del dueño no activan; si alguna prueba suya esperaba que no existieran, cambiarla. (f) `al_dar_de_baja()` de M07 falla cerrado desde M24-1 hasta su D-4b | DD-23, DD-26 a DD-28 |
| P24-17 | Su P-47 (migración de roles) añade a los ajustes por rol `idle_in_transaction_session_timeout` y `lock_timeout` en los roles que inician sesión (`authenticator` para la API, el del conector) y en `authenticated` (de contexto de usuario, PostgREST los aplica); la 021, en `acceso` cuando lo cree. Valores propuestos: `lock_timeout` 2 s (el de la 021) e `idle_in_transaction_session_timeout` 10 s; los fija la 022 en su P-47 y la 024 los usa en PRUEBA-013. Misma guarda, vuelta atrás y prueba de `rolconfig` que P-47 | MN-4 del dictamen de la 024 (DD-43): una transacción abierta e inactiva no retiene el cerrojo global |

### A la 023

| N.º | Petición | Motivo |
| --- | --- | --- |
| P24-12 | (a) P23-09 (a), (c) y (e) aceptadas; (b) en E-1 (DD-33). (d) Sustituida por la barrera (DD-23): la 024 no retira `ordenes_auditar` ni `catalogo_problemas_auditar`; desde M24-1 la escritura directa en esas tablas se rechaza, se integre M23-0 antes o después. La guarda existe como `privado.sin_escritura_directa()` con n-1, para quien quiera retirar una barrera. DD-34 de la 023 sigue valiendo, pero ya no es condición de seguridad de la 024; sus T-009, T-013 y T-014 dependen de M24-1, no de «retira `ordenes_auditar`». P23-04 y P23-05 no cambian nada de la 024 salvo que H-01 y H-02 sigan R-2 (P24-07) | DD-23, DD-24 |

### A la 025

| N.º | Petición | Motivo |
| --- | --- | --- |
| P24-13 | Confirmado lo de su «Qué se pide», punto 3: códigos I-39 a I-41 y de las cinco reglas; historial de I-39 e I-40 con su LR-2 propia y sin segundos; `reglas` en el orden del catálogo (restricción de D-1); su índice parcial, en M24-1 (D-7). `reglas_cliente_auditar` se queda como barrera: OR-1 y OR-2, como funciones del dueño, no lo activan, y la escritura directa que nombra su REQ-023 deja de ser aceptada. P-50 de la 022 (quitar «reactivar el cliente» de su CA-010) no cambia las acciones de reglas de la 024 | D-1, D-7, DD-23 |

### A la 020 y a coordinación

| N.º | Petición | Motivo |
| --- | --- | --- |
| P24-14 | 020 y `docs/DISENO.md`: anotar la excepción de los segundos solo en la página de auditoría (`la/fecha.ts` de la 024, DD-35); entrada «Auditoría» del menú | REQ-002 |
| P24-15 | Coordinación: `docs/SEGURIDAD.md` (en A-11, catálogo cerrado, barrera y PRUEBA-012; rutas críticas de la 024; AM-10 en la lista de publicación); el ADR de T-006; anotar DD-23 a DD-43 en `docs/TECNOLOGIAS.md` y pasarlas a `aclaraciones.md` | Art. 14 |
| P24-16 | Coordinación y quien aplique en `Nido`: (a) M24-1 no se aplica en `Nido` antes de que exista el procedimiento de I-19 de la 021 (P24-10 d); sin él no se puede crear el primer administrador con su fila. (b) **En `Nido` no se ejecuta nada entre M10 y M24-1**: ni el procedimiento de la 010 ni inserciones como dueño en `administradores` o `versiones_prompt`, que dejarían filas que no se pueden borrar y M24-1 no se aplicaría nunca. (c) Justo antes de aplicar M24-1, recuento de `auditoria` = 0 filas (T-005 b), con evidencia en `ev/T-005/`; si no es 0, no se aplica y va al arquitecto (MN-3, DD-42) | Arts. 3, 11 y 14 |

## Fichas para el responsable (22/11/2026)

Reservadas a una persona: aceptar un riesgo residual y el gasto no se delegan (arts. 6, 13 y 14).

### F-1 · Riesgo residual del propietario de la base de datos (AM-10)

Quien tenga las credenciales del propietario de `Nido` puede desactivar los disparadores, alterar la tabla o escribir filas como propietario directo. La aplicación, los agentes y los administradores no pueden; es una persona con acceso privilegiado. Sin desactivar nada, ya no puede dar de alta ni de baja un administrador sin fila: D-11 exige en `administradores` su principal anotada antes y rechaza el `delete` (MA-2 del dictamen, DD-39).

**Desactivar disparadores sigue siendo el riesgo residual de F-1.** Además, **`versiones_prompt` insertada por el dueño directo no deja fila** (menor: inmutabilidad, huella y publicación no cambian, art. 9).

| Opción | Qué supone |
| --- | --- |
| **A. Aceptarlo y declararlo hasta la fase 4** (recomendada) | Credenciales del propietario solo del responsable, fuera de los agentes; se anota en la lista de publicación de `docs/SEGURIDAD.md` y se revisa en la fase 4 (051). Sin coste ni código nuevo |
| B. Copia externa diaria de huellas | Un proceso guarda cada día la huella de la auditoría en un almacenamiento externo de solo escritura. Detecta retoques, no los impide. Necesita cuenta, gasto y una función nueva con su especificación |
| C. Registros de la plataforma (`pgaudit` o los de Supabase) | Rastro de las sentencias del propietario. Sin comprobar qué ofrece el plan de `Nido`; puede chocar con A-12 de D-040 (sin sentencias con parámetros en los registros) |

**Recomendación: A**, revisando B en la fase 4. Sin respuesta, el riesgo figura como pendiente y nunca como controlado; bloquea P7, no P1.

### F-2 · Gasto del programador de H-05 (solo si T-003 lo exige)

| Opción | Qué supone |
| --- | --- |
| **A. Usar el programador de la 013 si existe; si no, `pg_cron` si está en el plan sin coste** (recomendada) | No hay ficha que responder |
| B. Pagar lo que haga falta para tener `pg_cron` | Gasto reservado al responsable |
| C. No anotar H-05 | Exige quitar H-05 de la especificación (REQ-058, CA-018): el equipo no ve en la auditoría cuándo caducó una licencia |

**Recomendación: A**; si exige gasto, B.

## Decisiones por delegación (22/11/2026)

Tomadas por el `arquitecto` en el diseño por delegación D-036, con la opción de más seguridad, calidad y legibilidad que no contradice lo aprobado; revocables por el responsable. Detalle y motivo en `diseno.md`, «Decisiones por delegación»: DD-23 (barrera en vez de retirar disparadores), DD-24 (guarda con n-1), DD-25 (tabla alterada en su sitio, vacía), DD-26 (lista local en `privado`), DD-27 (R-2), DD-28 (R-3), DD-29 (contexto de la petición), DD-30 (`describir_auditoria` `security definer`), DD-31 (I-45 con 12 códigos), DD-32 (vínculo por código de recuperación), DD-33 (periodo de I-18, pendiente de E-1), DD-34 (identificadores en la dirección), DD-35 (tabla y fecha propias), DD-36 (programador de H-05), DD-37 (orden de migraciones); y, tras el dictamen de diseño (vuelta 1), DD-38 (guarda sobre todo `pg_roles` y `TRUNCATE`, MA-1), DD-39 (dueño directo en `administradores` solo con principal previa y sin `delete`, MA-2), DD-40 (`contextos` por entrada, MN-1), DD-41 (`for key share` del actor antes del cerrojo; sin `for update` en `administradores`, MN-2), DD-42 (nada en `Nido` entre M10 y M24-1; recuento = 0, MN-3) y DD-43 (tiempos por rol, MN-4; P24-17). Además, a propuesta de este diseño para la coordinación: en el choque de P23-12, gana la especificación aprobada de la 024 (P24-03); y E-1 se aprueba por P0 delegada, porque sale de decisiones ya tomadas por el responsable (D-039, D-040) o por delegación (A-4 y A-12 de la 021) y de una especificación aprobada (REQ-074 de la 023).
