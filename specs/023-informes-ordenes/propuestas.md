# 023 · Propuestas para coordinación

Cambios que esta función necesitaría fuera del rango de la fase 3. El chat de la fase 3 no los edita: los anota aquí para el chat de coordinación y para los chats de las fases afectadas. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 3, a partir del informe del `especificador`. **Ampliado el 22/11/2026 por el `arquitecto`** con el diseño al día (apartados del final). Lo del 12/11 se conserva como estaba; su estado actual está en «Estado de lo anterior».

## Bloquea un criterio de la fase 3 (12/11/2026; resuelto, ver abajo)

El contrato `contratos/obtener-instrucciones.schema.json` y el flujo 2 de `docs/ARQUITECTURA.md` dicen que la orden vigente solo se entrega con estado `activa`. Una orden de pausar hace que el estado servido sea `pausada`, así que, leído al pie de la letra, nunca se entregaría ni se confirmaría. El modelo de referencia sí la devuelve en cualquier estado. Hay que corregir el contrato y la arquitectura para que digan que la orden se entrega en cualquier estado autorizado. Sin eso no se puede cumplir «una orden creada en el panel llega al agente en su siguiente revisión y vuelve confirmada». Lo decide coordinación con la fase 2 (011).

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 023 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Órdenes protegidas frente al propio superadmin | Desde la sesión solo se crea una orden (pendiente, con el autor de la sesión y fechas del sistema) y se anula; solo el conector la pasa a entregada o confirmada (REQ-023, REQ-024, REQ-051, REQ-052). El modelo deja a un administrador cambiar el estado, devolver a viva una anulada y elegir autor y fechas | Fase 2 (010) |
| 2 | Una sola orden viva por cliente | Garantizado también con peticiones simultáneas (REQ-025). El modelo no lo impide | Fase 2 (010) |
| 3 | Confirmaciones que no corresponden | Una orden anulada o sustituida no se puede confirmar después. `confirmar_orden` del modelo acepta órdenes nunca entregadas y órdenes antiguas | Fase 2 (011) |
| 4 | Auditoría de órdenes | Crear y anular se distinguen (REQ-029). En el modelo todo cambio queda como `update`, y las acciones del conector se anotan con autor vacío | Fase 2 (010) y función 024 |
| 5 | Versión publicada en desarrollo | CA-001 necesita al menos una versión del prompt publicada, porque sin versión el conector sirve `pausada` a todos | Fases 2 y 4 |
| 6 | «Sin señal» y «revisión sin informe» | La etiqueta de la fase 3 usa la misma regla y el mismo plazo que las alertas de la 013 (cuestiones 1 y 2) | Fase 2 (013) |
| 7 | Plazo de «orden sin confirmar» | El mismo en la señal de la fase 3 y en la alerta de la fase 4 (cuestión 5) | Fase 4 (032, cuestión 1) |
| 8 | Vista de resumen del modelo | Distingue pausa pedida, entregada y confirmada, con sus fechas (REQ-027); no incluye datos de fases posteriores. La vista `resumen_cliente` no lo hace e incluye el estado de suscripción | Fase 2 (010) |
| 9 | Catálogo de problemas en dos sitios | Solo se lee. La lista está en el enumerado del contrato y en la tabla del catálogo, que un administrador puede ampliar: pueden acabar distintas | Coordinación y fase 2 |
| 10 | D-013 | En `pausada` no se entrega el prompt | Fase 1 (cuestión 4 de la 001) |
| 11 | Entorno para la prueba de extremo a extremo | Conector de la fase 2 en desarrollo, con un agente de prueba programado sobre un cliente ficticio | Fase 2 |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `contratos/obtener-instrucciones.schema.json` y `docs/ARQUITECTURA.md`, flujo 2 | La orden se entrega en cualquier estado autorizado, no solo con `activa` | Ver «Bloquea un criterio de la fase 3» |
| `contratos/informe.schema.json` | Añadir a `sin_tratar` y `facturas_pendientes` una descripción: lo que queda al terminar la revisión | Cuestión 14, resuelta leyendo el prompt 1.2 y la 012 |
| `docs/DISENO.md`, página «Resumen» | Marcar qué elementos son de qué fase (alertas y versión por canal, fase 4; impagos, fase 6) | REQ-016: en la fase 3 no se muestran |
| `docs/PLAN.md` | Aclarar el reparto de las alertas entre la fase 2 (las genera) y la fase 4 (página y avisos) | Cuestión 13 |
| `docs/TECNOLOGIAS.md` | Anotar como decisiones las respuestas del responsable a las cuestiones 1, 6, 7 y 16, cuando las dé | Skill `sdd-aclarar`, paso 6 |

## Decisión en VERIFICAR

V-110 (librería de interfaz y de gráficos) no se ha usado. Se verifica con la skill `verificar-decision` en el paso de diseño.

---

## Estado de lo anterior (22/11/2026)

- **Bloqueo de CA-001:** resuelto. `contratos/obtener-instrucciones.schema.json` ya dice que la orden llega salvo con «suspendida» (H-16 del diseño).
- **Fronteras 1 a 11:** 1, 2, 3 y 4 pasan a P23-01, P23-04 y P23-09; 5 y 11 siguen (fase 2, CA-001); 6 es P23-11; 7 es P23-16; 8 es P23-05; 9 sigue (solo lectura; P23-03 cierra la escritura); 10 es P23-13.
- **Documentos compartidos:** el de `obtener-instrucciones` y la arquitectura, hecho; los demás, en P23-14.
- **V-110:** verificada por la 020 (H-12 del diseño).

## Peticiones del diseño (22/11/2026)

Autor: `arquitecto`. **Ninguna está aplicada ni aceptada.** El chat de la fase 3 no edita archivos de otras funciones; cada destinatario las acepta o no en su chat. Lo que bloquean, en `plan.md`, «Lo que bloquea y a quién».

### A la 010 y a la fase 2 (sin editar sus archivos)

| N.º | Petición | Motivo |
| --- | --- | --- |
| P23-01 | Aceptar que M23-0, M23-1, M23-4 y M23-5 de la 023 cambien en `ordenes` lo de M02, M04 y M07: (a) columnas `anulacion` y `sustituida_por` (clave ajena compuesta `(sustituida_por, cliente_id)` → `(id, cliente_id)`), restricción de coherencia de `estado` con los hechos, restricciones de D-2, índice único parcial de una orden viva y sustitución de `ordenes_por_cliente` por el **único** `(cliente_id, creada_en desc)`, más `(id, cliente_id)` único (m-1, m-2 del dictamen); (b) quitar en `ordenes` el disparador `ordenes_valores` (la rama de `fijar_valores()` exime a `postgres` y pone `anulada_en := now()`) y poner `privado.validar_orden()`, sin mirar `current_user`, que rechaza todo borrado, también el de la cascada de M02 desde `clientes` (m-5); sin tocar el cuerpo de `fijar_valores()`, que comparten otras tablas; (c) **en M23-0, la primera, antes o a la vez que la migración de auditoría de la 024** (DD-34, M-3): retirar a `authenticated` `insert (cliente_id, tipo)` y `update (estado)` y las políticas `ordenes_insert_admin` y `ordenes_update_admin`; (d) actualizar `m07.test.ts`, `m08_m10.test.ts` y `02_matriz_acceso` donde cambien | REQ-023, REQ-024, REQ-052, REQ-066; MA-1 de la 022; DD-30 |
| P23-02 | Columnas del usuario de cliente sobre `ordenes`: `revoke select on public.ordenes from authenticated` y `grant select (id, cliente_id, tipo, estado, creada_en, entregada_en, confirmada_en, anulada_en)`; sin `creada_por`, `anulacion` ni `sustituida_por`. Cierra para órdenes la decisión 8 de T-006 de la 010. `informes` no cambia (REQ-057 de la 010) | DD-31; mínimo privilegio (art. 3) |
| P23-03 | **En M23-0** (no en M23-5; MAYOR-2 de la revisión): `catalogo_problemas` sin `insert`, `update` ni `delete` para `authenticated` y `anon` (M07 da `insert (codigo, descripcion, activo)` y `update (descripcion, activo)`) y sin las políticas `catalogo_problemas_insert_admin` y `catalogo_problemas_update_admin`, mientras ninguna función lo gestione; actualizar `m07.test.ts` y `02_matriz_acceso` donde cambien | Gestión del catálogo fuera de alcance; la 024 no tiene acción para ello y su D-5 retira `catalogo_problemas_auditar`: sin esto, el catálogo se cambiaría sin rastro |
| P23-04 | Conector (M08 hoy; la 011 después), «Lo que el conector tiene que cumplir» del diseño: `entregada_en` y `confirmada_en` con `clock_timestamp()` tras el `for share` del cliente; estado servido con `coalesce(privado.pausa_efectiva(cliente), true)`: nulo o error, `pausada` o fallo, nunca el prompt, con cualquier rol, también uno sin `bypassrls` en la 011 (M-1 del dictamen); solo se sirve una orden viva (nunca una confirmada ni una anulada); `mcp_confirmar_orden` solo confirma entregadas sin anular (propuesta 39 de la 010); orden determinante por `creada_en desc, id`, el único desempate escrito (m-1); las órdenes no se purgan (m-5; si la 014 o la 052 lo necesitan, al arquitecto de la 023) | REQ-023, REQ-046, REQ-066, REQ-075; AM-34: con `now()`, una orden creada mientras el conector esperaba haría fallar su entrega por D-2 |
| P23-05 | `resumen_cliente.en_pausa` (M09) con `privado.pausa_efectiva()` (nulo si quien lee no ve al cliente, nunca `false`; M-1), con el orden `creada_en desc, id` (m-1), en la misma reescritura que pide P-46 de la 022 o después de ella | Una sola regla de pausa (D-6) |
| P23-06 | Exposición de las 11 lecturas y las 3 operaciones de la 023 como fije REQ-010 de la 010 para la 021 y la 022, y que una llamada pueda devolver 50.000 filas (T-P1) | D-9, E-1 |

### A la 022

| N.º | Petición | Motivo |
| --- | --- | --- |
| P23-07 | (a) Su L-7 (022·T-012 b) con `privado.pausa_efectiva()` de la 023 y la función de «sin señal» de la 013, y que acepte un solo identificador para el bloque «Señal» de la ficha (DD-33); (b) `listarClientes` con tope de 10 resultados para `FiltroCliente`, con clientes de baja; (c) `fecha-madrid.ts` exportable para `periodo.ts`; (d) marcos «Informes» y «Órdenes» en `secciones.ts`; (e) los casos de PRUEBA-019, 022 y 038 de la 023 en `scripts/bd/concurrencia-clientes.mjs` (022·T-019) y su número en `declaradas.json`; (f) confirmar que O-3 (baja) no toca órdenes y que su cerrojo de cliente es `for no key update` (DD-29) | DD-29, DD-33; D-040 A-4 |

### A la 021

| N.º | Petición | Motivo |
| --- | --- | --- |
| P23-08 | Que su PRUEBA-003 cubra las páginas, acciones y el `route.ts` de la 023; que el Resumen sea el destino tras iniciar sesión; que las funciones de la 023 puedan leer `administradores.correo` como dueño; y qué ve un diálogo abierto cuando la sesión caduca | REQ-001, REQ-012, REQ-039 |

### A la 024

| N.º | Petición | Motivo |
| --- | --- | --- |
| P23-09 | (a) Mantener I-13 a I-18 con sus códigos y I-17 solo vinculada a I-13 o I-14; (b) `periodo_desde` y `periodo_hasta` solo en I-18 (su A-1 vi), mostrados en la acción; (c) que `principal_de_esta_transaccion()` (P-53 a de la 022) se pueda llamar desde un disparador de restricción diferido del dueño al confirmar la transacción, y que la fila I-17 se pueda leer por `fila_principal_id` (DD-32); la 023 **no** pide la excepción de P-53 (b): anota en último lugar; (d) que su migración retire `ordenes_auditar` y `catalogo_problemas_auditar` de M04 (su D-5), **solo cuando `authenticated` ya no pueda escribir en `ordenes` ni en `catalogo_problemas`**: al empezar, una guarda comprueba en las dos tablas, con `has_table_privilege` y `has_any_column_privilege` (M07 concede por columnas), que no tiene `insert`, `update` ni `delete` y, si tiene alguno, falla sin cambiar nada; se integra y se aplica después o a la vez que M23-0 de la 023 (DD-34, M-3 del dictamen); y que la función del disparador diferido de la 023 pueda ser `security definer` del dueño (DD-35); (e) `search_path = pg_catalog, pg_temp` en sus D-4 y D-6 (D-035) | REQ-029, REQ-074; DD-32 |

### A la 020

| N.º | Petición | Motivo |
| --- | --- | --- |
| P23-10 | La sexta entrada del menú, «Informes», entre «Clientes» y «Órdenes» (ya en su `propuestas.md`, punto 4); las plantillas de ruta de la 023; los estados nuevos del catálogo; los textos, incluido «Todavía no hay datos suficientes para comparar»; `RejillaCuerpo` sin zona de alertas sin dejar hueco; que `estado-direccion.ts` diga si descartó un parámetro declarado; `GraficoLineas` con 366 puntos (T-P4); las muestras de la 023 en su inventario | REQ-071, REQ-009, REQ-031 |

### A la 013, a la fase 4 y a coordinación

| N.º | Petición | Motivo |
| --- | --- | --- |
| P23-11 | 013: la regla de «sin señal» como **una** función de solo lectura, evaluable al consultar, la misma que usa su cálculo; y sus cuestiones 3, 5, 6, 11, 12 y 13 respondidas (su P0 está delegada, D-036) | REQ-015, REQ-063, CA-011 (A-2) |
| P23-12 | Coordinación: la 010 (su REQ-061 y D-3) no audita al conector y la 024 espera H-01 y H-02 de él. Decidir quién gana; la 023 no depende de ello | Coherencia entre 010 y 024 |
| P23-13 | Coordinación y fase 1: confirmar D-013 (el contrato ya lo aplica); los códigos de `registro.ts` del diseño («Contratos»); V-112 (la supervisión no captura cuerpos de respuesta; el archivo exportado es uno) | REQ-022, CA-001, REQ-036 |
| P23-14 | Coordinación: descripciones de `confirmar-orden.schema.json` (`confirmada: false` también si está anulada o nunca se entregó) y de `informe.schema.json` (qué es lo que queda y qué lo hecho); flujo 4 de `docs/ARQUITECTURA.md`; «Informes» y `admin/informes/` en `docs/DISENO.md` y `docs/ESQUELETO.md`; rutas críticas de la 023 en `docs/SEGURIDAD.md`; anotar DD-27 a DD-35 (DD-34 y DD-35, del dictamen de la vuelta 1) en `docs/TECNOLOGIAS.md` y pasarlas a `aclaraciones.md`; los tres ADR de «Decisiones que requieren ADR» | Art. 14: documentos compartidos |
| P23-15 | `especificador`, enmienda de la especificación por P0 delegada (D-036): REQ-043 («no la recibirá mientras la licencia no esté vigente», DD-28); REQ-046 (manda REQ-076, DD-06); REQ-078 (tope de 50.000, DD-13); REQ-001, REQ-038 y CA-002 (el usuario de cliente lee directamente sus informes y órdenes como en la 010, sin autor ni forma de anulación; por las vistas, lecturas y operaciones de la 023, nada; DD-31) | Art. 5: el diseño no puede quedar por delante de la especificación |
| P23-16 | 032: el mismo plazo de 2 veces la frecuencia esperada para su alerta de orden sin confirmar, con `privado.orden_fuera_de_plazo()`; y el aviso fuera del panel por órdenes y exportaciones de F-1 | REQ-028; F-1 |
| P23-17 | Coordinación (MAYOR-2 de la revisión del `revisor`, 22/11/2026): la migración de auditoría de la 024 (su D-5) elimina `privado.auditar()` y **todos** sus disparadores de M04, no solo los de `ordenes` y `catalogo_problemas`. `ajustes_globales`, `clientes`, `licencias` y las demás tablas auditadas por M04 en las que `authenticated` conserve escritura directa quedan con la misma ventana sin auditoría. No es asunto de la 023: que cada función dueña de esas tablas (la 022 para clientes y licencias; la que gestione los ajustes globales; las demás) cierre su escritura directa o la audite antes o a la vez, y que la guarda de P23-09 (d) se extienda a cada una | Art. 3; la misma ventana que M-3 del dictamen, en tablas de otras funciones |

## Decisiones por delegación (22/11/2026)

Tomadas por el `arquitecto` en el diseño por delegación D-036, con la opción de más seguridad, calidad y legibilidad que no contradice lo ya aprobado. Revocables por el responsable; la coordinación las pasa a `aclaraciones.md` y a `docs/TECNOLOGIAS.md` (P23-14). Detalle y motivo en `diseno.md`, «Decisiones por delegación».

| N.º | Decisión | Por qué no es del responsable |
| --- | --- | --- |
| DD-27 | Nota del art. 2: el identificador solo filtra; `es_admin()` antes de leer parámetros y tras los cerrojos; la orden se busca por `id` y `cliente_id` | Aplica el texto de la constitución 1.5 ya aprobado (D-040) |
| DD-28 | Con licencia no vigente la orden no se entrega; el aviso lo dice | Sigue el contrato y M08; solo cambia la redacción de un aviso |
| DD-29 | La baja no toca órdenes; mismo cerrojo de cliente que la 022; la regla de pausa no mira la baja | No contradice la 022 con P1 ni D-040 A-10 |
| DD-30 | `ordenes.estado` se conserva atado a los hechos; orden por `creada_en` con `clock_timestamp()` tras el cerrojo; sin `numero` | Técnica; reduce cambios en código ya auditado |
| DD-31 | Lectura directa del usuario de cliente como en la 010, sin autor ni forma de anulación | Sigue el precedente del propio responsable (D-040 A-11, «como en la 010») y REQ-057 de la 010; pide enmienda P0, delegada (P23-15) |
| DD-32 | Auditoría obligada por disparador diferido con `principal_de_esta_transaccion()` | Técnica; añade una barrera, no quita ninguna |
| DD-33 | Una sola lectura de indicaciones (la L-7 de la 022) | Técnica |
| DD-34 | (Dictamen M-3.) M23-0, la primera de la 023, retira a `authenticated` la escritura directa en `ordenes` y sus dos políticas; se integra y se aplica antes o a la vez que la migración de la 024 que retira `ordenes_auditar`, con guarda en esa migración; su vuelta atrás no la reabre. T-015 se parte en (a) M23-0 y (b) M23-5, y deja de depender de P23-15 | Técnica: cierra una ventana sin auditoría y añade una barrera; no cambia ningún requisito |
| DD-35 | (Dictamen M-2.) Caso peor PostgreSQL 17 o anterior: la función del disparador de D-4b es `security definer` del dueño, sin `execute` para nadie; T-P1 anota la versión mayor de `Nido` y T-P5 la de CI | Técnica: la versión es un dato sin comprobar y así vale para las dos |
| A-4 | Proponer 10 s en el percentil 95 como tiempo máximo de exportación | La especificación lo deja a la puerta P1, delegada (D-036) |

## Fichas para el responsable

Solo lo que no está delegado. La recomendación es del `arquitecto` y no es una decisión.

### F-1 · Riesgo residual hasta la fase 4: sesión de superadmin comprometida

**Qué pasa.** Con una sesión de superadmin válida (doble factor incluido), alguien puede, sin límite de ritmo: pausar o reanudar a los clientes uno a uno (AM-01, AM-02) y exportar las cifras de cada cliente una y otra vez (AM-19); el archivo exportado queda en su equipo, fuera del sistema (AM-20). Cada acción deja su fila de auditoría con actor, cliente y momento, pero hasta la 032 (fase 4) nadie recibe un aviso fuera del panel: se descubre mirando el panel o la auditoría. Exportar en bucle, además, retrasa al resto: cada exportación retiene el cerrojo global de auditoría de la 024 mientras devuelve sus filas, y las órdenes, las operaciones de la 022 y los hechos del conector esperan (latencia, no bloqueo; m-4 del dictamen, se mide en PRUEBA-033). Lo que sale son cifras, nunca contenido de correo, y ninguna orden relaja los límites del agente (art. 8). Hoy no hay clientes reales (D-034).

**Por qué es tuyo.** Aceptar un riesgo residual no está delegado (mismo criterio que D-042: arts. 6, 13 y 14).

| Opción | Qué supone |
| --- | --- |
| **A. Aceptarlo hasta la fase 4**, con la condición de que la 032 lo cierre (aviso fuera del panel por órdenes y exportaciones) antes de la primera cuenta real (033 piloto o 051 publicación) y de que la lista de publicación lo recoja | Sin trabajo nuevo en la 023. Riesgo acotado al tiempo sin clientes reales |
| B. Límite de ritmo en la 023 ya: por ejemplo, 20 órdenes y 20 exportaciones por administrador y hora, con un rechazo nuevo | Una regla y una prueba más, y enmienda de la especificación. Puede estorbar en un incidente que exija pausar a muchos clientes, porque la pausa global llega con la fase 4 |
| C. Adelantar a la fase 3 un aviso mínimo fuera del panel | Necesita un canal de aviso que aún no existe (013, 032) y quizá una cuenta o un gasto |

**Recomendación: A.** Es lo que cierra antes sin estorbar la respuesta a un incidente, y no hay datos reales expuestos hasta la 033. Si eliges B o C, vuelve al `arquitecto` y al `especificador` antes de T-013 y T-014.
