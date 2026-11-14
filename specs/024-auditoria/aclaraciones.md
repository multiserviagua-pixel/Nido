# 024 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 3. **Respondida el 12/11/2026: la 11, en parte. Las demás no tienen respuesta todavía.** La columna «Recomendación» es del orquestador y no es una decisión.

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`, donde están las opciones completas.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 1 | Inicios de sesión y cambios de contraseña en la auditoría | **A.** Todo aparece en la página (inicios correctos y fallidos, fallos del segundo factor, bloqueos, cambio y restablecimiento de contraseña). **B.** Solo cambio y restablecimiento de contraseña. **C.** Nada. | **A sin los fallos sueltos.** Entran en el inventario el cambio y el restablecimiento de contraseña, los inicios de sesión completos y los bloqueos: ante una cuenta sospechosa, lo primero que se mira es cuándo entró. Los fallos sueltos solo se cuentan en supervisión, sin guardar lo tecleado. Es la misma decisión que la cuestión 14 de la 021 |
| 2 | Acciones sin persona (el conector entrega o confirma una orden, se activa una conexión, revocación automática, caducidad) | **A.** La página solo muestra acciones de personas. **B.** Las muestra, con un actor de lista cerrada («Sistema», «Agente del cliente»). **C.** Solo algunas. | **B.** Para seguir una orden o una conexión nueva (amenaza A-01) hace falta el rastro completo. No son filas por cada revisión del agente, solo por esos hechos. Pide a la fase 2 guardar el origen del actor (cuestión 17 de la 010) |
| 3 | Auditar lecturas | **A.** Solo los cambios. **B.** También las consultas de datos de un cliente. | **A.** Es la misma decisión que la cuestión 16 de la 023 |
| 4 | Cómo se muestra un administrador dado de baja | **A.** Con su correo y la marca «dado de baja»: obliga a desactivar la cuenta en vez de borrarla. **B.** Como «Administrador dado de baja» con una referencia: no guarda el dato personal, pero para saber quién fue hace falta un registro fuera del sistema. | **A.** Es la misma decisión que la cuestión 7 de la 021 (desactivar). El correo se elimina al cumplirse el plazo que fije la fase 6 |
| 5 | Una fila por acción o una por objeto afectado | **A.** Una fila por acción, con el objeto principal. **B.** Una fila principal que nombra la acción y, vinculadas a ella, las de los demás objetos afectados; la página las agrupa. **C.** Una fila por objeto, sin principal. La 010 (fase 2) pide hoy una fila por cada dato afectado. | **B.** Conserva todo lo que cambió y mantiene el criterio «una fila que nombra la acción». **C** no permite cumplir el criterio de la fase. Hay que acordarlo con la fase 2 |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 6 | Cómo se identifica el objeto en pantalla | Con atributos actuales que no son secretos (asistente y fecha de alta de una conexión, fecha de creación de una licencia) y, de respaldo, una referencia breve sacada del identificador | Legible y siempre distinguible. Nunca un código ni un token |
| 7 | Hora con segundos | Sí, en la auditoría, como excepción documentada al formato común | Permite reconstruir la secuencia de un incidente |
| 8 | Intentos denegados | En los registros de supervisión, sin valores recibidos. No en la auditoría | La auditoría sigue conteniendo solo lo que ha ocurrido |
| 9 | Exportación | No | Ningún archivo con actividad de todos los clientes sale del sistema |
| 10 | Conservación | Confirmar: no se elimina ninguna fila hasta que la fase 6 fije los plazos | Coincide con «no borrar registros» de la respuesta a incidentes |
| 11 | Volumen de referencia y umbral | 500.000 filas de auditoría, dentro del volumen único de la fase 3 (cuestión 14 de la 022), y menos de 2 segundos en el percentil 95 | Unifica el umbral con el resto de la fase; la 024 propone 1 segundo |
| 12 | Acciones de usuarios de clientes | No se muestran; se decide en la fase 5 | El filtro de administrador no cambia ahora |
| 13 | Periodo al abrir la página | Los últimos 30 días, con el periodo a la vista y un paso para ver todo el historial | Carga menos y deja claro qué se está viendo |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Inicios de sesión y contraseña | Sin respuesta | — | Pendiente (inventario, CA-001) |
| 2 | Acciones sin persona | Sin respuesta | — | Pendiente (REQ-017, REQ-029, CA-018) |
| 3 | Auditar lecturas | Sin respuesta | — | Pendiente (inventario) |
| 4 | Administrador dado de baja | Sin respuesta | — | Pendiente (REQ-016, CA-008) |
| 5 | Fila por acción o por objeto | Sin respuesta | — | Pendiente (REQ-018, CA-001) |
| 6 | Identificación del objeto | Sin respuesta | — | Pendiente (REQ-004, CA-010) |
| 7 | Hora con segundos | Sin respuesta | — | Pendiente (REQ-002, REQ-007) |
| 8 | Intentos denegados | Sin respuesta | — | Pendiente (REQ-020) |
| 9 | Exportación | Sin respuesta | — | Pendiente («Fuera de alcance») |
| 10 | Conservación | Sin respuesta | — | Pendiente («Fuera de alcance») |
| 11 | Volumen y umbral | «Menos de 100» clientes en tres años; la opción decía «Se prueba con 1.000 clientes igualmente» | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | Volumen de prueba: 1.000 clientes, como ya proponía la 024. Las 500.000 filas y el umbral siguen propuestos y se confirman al aprobar la 024 |
| 12 | Acciones de usuarios de clientes | Sin respuesta | — | Pendiente («Fuera de alcance») |
| 13 | Periodo al abrir | Sin respuesta | — | Pendiente (REQ-009) |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Ninguna todavía. Cuando haya respuesta, se pasan a coordinación por `propuestas.md`: este chat no edita el registro de decisiones.

## Respuestas del 13/11/2026

Preguntadas por el orquestador en el diálogo de preguntas del chat de la fase 3; varias se dieron al contestar la 021 y la 023. Sustituyen a «Sin respuesta» en la tabla de arriba.

| N.º | Cuestión | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Inicios de sesión y contraseña | «Entradas y bloqueos (Recomendado)» (dada en la cuestión 14 de la 021) | Responsable, 13/11/2026 | Entran en el inventario: inicio de sesión completo, bloqueo por intentos, cambio y restablecimiento de contraseña. Los fallos sueltos solo se cuentan |
| 2 | Acciones sin persona | «Sí, como "Sistema" o "Agente" (Recomendado)» | Responsable, 13/11/2026 | REQ-017: se muestran con un actor de lista cerrada. Pide a la fase 2 guardar el origen del actor |
| 3 | Auditar lecturas | «Solo los cambios (Recomendado)» (dada en la cuestión 16 de la 023) | Responsable, 13/11/2026 | Sin cambios |
| 4 | Administrador dado de baja | «Desactivar (Recomendado)» (dada en la cuestión 7 de la 021) | Responsable, 13/11/2026 | REQ-016: se muestra con su correo y la marca «dado de baja» |
| 11 | Volumen y umbral | «Menos de 2 segundos (Recomendado)», con 1.000 clientes | Responsable, 13/11/2026 | REQ-013 y CA-016: percentil 95 por debajo de 2 segundos. Las 500.000 filas siguen como propuesta |

Entradas nuevas del inventario que salen de respuestas a otras funciones: reactivar cliente y anular código (022); anulación automática de una orden sustituida y exportar informes (023); regenerar códigos de recuperación, cerrar las demás sesiones y reactivar una cuenta de administrador por invitación (021).
| 5 | Fila por acción o por objeto | «Una fila principal y sus detalles (Recomendado)» | Responsable, 13/11/2026 | REQ-018: una fila principal nombra la acción y las de los demás objetos afectados van vinculadas a ella; la página las agrupa. Hay que acordarlo con la fase 2 (requisito 17 de la 010) |
| 7 | Hora con segundos | «Sí, solo en auditoría (Recomendado)» | Responsable, 13/11/2026 | REQ-002: la auditoría muestra segundos, como excepción documentada al formato común |
| 9 | Exportación | «No (Recomendado)» | Responsable, 13/11/2026 | Sin cambios: no se exporta |
| 6, 8, 10, 12 y 13 | Detalles con valor propuesto | «Sí, los cinco (Recomendado)» | Responsable, 13/11/2026 | Objeto identificado con atributos legibles y una referencia breve de respaldo; intentos denegados solo en los registros técnicos; no se elimina ninguna fila hasta la fase 6; acciones de usuarios de clientes, en la fase 5; la página se abre con los últimos 30 días y un paso para ver todo |

**Todas las cuestiones de la 024 tienen respuesta.** Queda como propuesta sin respuesta expresa el volumen de 500.000 filas, que se presenta en la puerta P0. Los efectos los aplica el `especificador`.

## Puerta P0

Abierta por el responsable el 13/11/2026 en el diálogo de preguntas del chat de la fase 3, con la respuesta «Apruebo la 024». La especificación pasa a APROBADA. Lo que el resumen presentó como deducción o propuesta sin respuesta previa quedó aprobado con ella.

## Enmienda del 13/11/2026 (después de la puerta P0)

La función 025 (reglas por cliente) obliga a retocar esta especificación. Presentada al responsable en el diálogo de preguntas del chat de la fase 3; respuesta literal: «Sí, apruebo las dos». En la 022: dar de alta un cliente guarda también sus reglas por defecto. En la 024: el inventario gana las acciones de cambiar y de restablecer las reglas de un cliente, y la fila de auditoría puede anotar qué reglas cambiaron, de lista cerrada y sin valores. La especificación sigue APROBADA; la enmienda la aplica el `especificador`.
