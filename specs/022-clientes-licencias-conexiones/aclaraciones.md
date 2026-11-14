# 022 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 3. **Respondidas el 12/11/2026: la 11 y, en parte, la 14. Las demás no tienen respuesta todavía.** La columna «Recomendación» es del orquestador y no es una decisión.

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`, donde están las opciones completas.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 1 | Reglas por cliente (máximo de correos, ventana de días, adjuntos, borradores, facturas por enlace) | **A.** Se editan en la 022. **B.** Aquí solo se muestran; se editan en otra función. **C.** Ni se muestran hasta otra fase. Ningún plan de fase recoge hoy su edición. | **B, con función propia en la fase 3**: `025-reglas-por-cliente`, pequeña (cinco valores acotados, confirmación y auditoría), que se especifica si dices que sí. La 022 solo deja el sitio en la ficha. Sin ella, cambiar una regla exigiría tocar la base de datos a mano |
| 7 | Baja de cliente: vuelta atrás, efecto y borrado | **(a)** ¿Se puede reactivar? **(b)** ¿La baja revoca licencia y conexiones, o solo hace que el agente reciba `suspendida`? **(c)** ¿Se borra alguna vez? | **(b)** La baja revoca la licencia y sus conexiones: no deja credenciales vivas de un cliente que ya no lo es. **(a)** Se puede reactivar el cliente, con licencia y activación nuevas. **(c)** No se borra nada hasta que la fase 6 fije los plazos. Para parar a un cliente por un tiempo ya está «Suspender licencia» |
| 9 | Suspensión manual frente al cobro de la fase 6 | **A.** Un solo mecanismo, el «estado manual» de la fase 6, que se adelanta. **B.** Dos causas separadas (manual e impago): la licencia está suspendida mientras exista alguna. | **B.** Reactivar a mano solo levanta la suspensión manual y no borra sin querer una suspensión por impago. «Forzar activa» pese a un impago se queda en la fase 6, con el cobro (ADR-0006, punto 7). Afecta a la 050: va en `propuestas.md` |
| 11 | Identificador de cliente en el panel de superadmin (artículo 2) | El artículo 2 dice que el identificador del cliente nunca se acepta como entrada. El superadmin necesita elegir un cliente cualquiera. **A.** Se confirma la lectura: el identificador elige sobre quién se actúa y nunca concede permiso. **B.** No se confirma: el diseño tiene que evitar identificadores de cliente en peticiones y direcciones. | **A**, anotada como nota aclaratoria del artículo 2. Es una enmienda de la constitución: solo la puedes hacer tú, con fecha y versión. La misma cuestión aparece en la 020 (10) y en la 023 (12) |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 2 | Canal del cliente | Aquí se muestra en lectura; se cambia en la fase 4 | La 030 ya lo exige en su requisito 13 y lo pregunta en su cuestión 6. Evita mover un cliente a `prueba` antes de que existan la publicación y la vuelta atrás |
| 3 | Duración del código de activación | 15 minutos | Da margen al instalador y acota el riesgo de robo. CA-014 usa ese número |
| 4 | Varios códigos pendientes y anulación | Uno solo por licencia: generar otro anula el anterior. Revocar la licencia o dar de baja al cliente anula los pendientes. Estado visible «Anulado», con su fila de auditoría | Un código filtrado deja de servir en cuanto se genera otro. Pide un dato nuevo al modelo de la fase 2 |
| 5 | Código con licencia suspendida o caducada | Se rechaza | Ante la duda, se deniega (artículo 3). Para instalar hay que reactivar antes |
| 6 | Nombres repetidos | Prohibidos, sin distinguir mayúsculas ni tildes | Evita confundir clientes en la lista y en la auditoría. Dos empresas homónimas se distinguen en el propio nombre comercial (por ejemplo, con la localidad) |
| 8 | Confirmación reforzada | Sí, para revocar licencia y para dar de baja: una casilla «Entiendo que no se puede deshacer» además del botón. Sin teclear el nombre | Teclear hasta 120 caracteres es peor en móvil y en accesibilidad, y el diálogo ya nombra al cliente |
| 10 | Qué recibe el agente con la licencia revocada | Se decide en la fase 2 (cuestión 17 de la 011). Allí recomiendo el rechazo como no autorizado | Una licencia revocada no debe mantener viva ninguna conexión. La 022 es válida con las dos opciones |
| 12 | Signos `<` y `>` en el nombre | Se admiten y se muestran como texto literal. Solo se rechazan saltos de línea y caracteres de control | El control es mostrar siempre como texto (REQ-010), no prohibir caracteres |
| 13 | Motivo de la revocación de una conexión | Sí, con lista cerrada: por un administrador, automática por reutilización del token, por revocación de la licencia o baja | Ayuda a responder a incidentes. Pide un dato nuevo al modelo de la fase 2 |
| 14 | Volumen y umbral de rendimiento | Un solo volumen de referencia para toda la fase 3: 1.000 clientes, 200.000 informes (20.000 de un mismo cliente), 5.000 órdenes y 500.000 filas de auditoría. Umbral: menos de 2 segundos en el percentil 95. **Necesito saber cuántos clientes hay hoy y cuántos esperas en tres años** | La 022 y la 024 proponen 1 segundo y la 023, 2 segundos con 200 clientes: se unifican. Si esperas más de 1.000 clientes, se sube el volumen |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Reglas por cliente | Sin respuesta | — | Pendiente (REQ-007; función 025 si la respuesta es sí) |
| 2 | Canal del cliente | Sin respuesta | — | Pendiente (REQ-007, REQ-009) |
| 3 | Duración del código | Sin respuesta | — | Pendiente (REQ-020, CA-014) |
| 4 | Códigos pendientes y anulación | Sin respuesta | — | Pendiente (REQ-018, REQ-023; requisito nuevo) |
| 5 | Código con licencia suspendida | Sin respuesta | — | Pendiente (REQ-044, CA-031) |
| 6 | Nombres repetidos | Sin respuesta | — | Pendiente (REQ-053, CA-035) |
| 7 | Baja de cliente | Sin respuesta | — | Pendiente (REQ-011, CA-007) |
| 8 | Confirmación reforzada | Sin respuesta | — | Pendiente (REQ-030, CA-021) |
| 9 | Suspensión manual y cobro | Sin respuesta | — | Pendiente (REQ-017, CA-011) |
| 10 | Licencia revocada | Se decide en la fase 2 | — | Sin cambios en la 022 |
| 11 | Identificador de cliente | «Nota aclaratoria (Recomendado)» | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | Se confirma la lectura de REQ-056 y de la cuestión 11: sin cambios en los requisitos. La nota del artículo 2 la aplica coordinación |
| 12 | Signos en el nombre | Sin respuesta | — | Pendiente (REQ-052) |
| 13 | Motivo de revocación | Sin respuesta | — | Pendiente (REQ-025) |
| 14 | Volumen y umbral | «Menos de 100» clientes en tres años; la opción decía «Se prueba con 1.000 clientes igualmente» | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | Volumen de prueba: 1.000 clientes. El umbral de 2 segundos (la 022 dice 1) sigue propuesto y se confirma al aprobar la 022 (REQ-006, CA-003) |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Ninguna todavía. Cuando haya respuesta, se pasan a coordinación por `propuestas.md`: este chat no edita el registro de decisiones.

## Respuestas del 13/11/2026

Preguntadas por el orquestador en el diálogo de preguntas del chat de la fase 3. Sustituyen a «Sin respuesta» en la tabla de arriba.

| N.º | Cuestión | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Reglas por cliente | «Función nueva en la fase 3 (Recomendado)» | Responsable, 13/11/2026 | La 022 solo deja el sitio en la ficha. Se crea la función `025-reglas-por-cliente` en la fase 3 |
| 7 | Baja de cliente | «Solo se suspende» (opción distinta de la recomendada) | Responsable, 13/11/2026 | REQ-011 queda como está: el agente recibe `suspendida`, las conexiones y la licencia se conservan y la baja tiene vuelta atrás inmediata. No se borra nada. Consecuencia que se anota: un cliente dado de baja conserva credenciales que se siguen renovando; para cortarlas hay que revocar la licencia o las conexiones |
| 9 | Suspensión manual frente al cobro | «Dos causas separadas (Recomendado)» | Responsable, 13/11/2026 | REQ-017: suspendida mientras exista alguna causa; reactivar a mano solo quita la manual. Se pasa a la fase 6 (050) |
| 3 | Duración del código de activación | «15 minutos (Recomendado)» | Responsable, 13/11/2026 | REQ-020 y CA-014 con 15 minutos |
| 7 (resto) | Reactivar un cliente dado de baja | «Sí, con un botón (Recomendado)» | Responsable, 13/11/2026 | Requisito nuevo: «Reactivar cliente», con confirmación y fila de auditoría; vuelve con su licencia y sus conexiones. Entrada nueva en el inventario de la 024 |
| 4 | Códigos pendientes y anulación | «Uno solo (Recomendado)» | Responsable, 13/11/2026 | Un solo código pendiente por licencia: generar otro anula el anterior; revocar la licencia anula los pendientes. Estado visible «Anulado», con fila de auditoría. Pide un dato nuevo a la fase 2 |
| 8 | Confirmación reforzada | «Teclear el nombre del cliente» (opción distinta de la recomendada) | Responsable, 13/11/2026 | REQ-030 y CA-021: para revocar una licencia hay que teclear el nombre del cliente antes de confirmar. El diseño debe resolverlo de forma accesible y usable en móvil (nombres de hasta 120 caracteres); se puede pegar |
| 2, 5, 6, 12, 13, 14 | Detalles con valor propuesto | «Los reviso uno a uno» | Responsable, 13/11/2026 | Siguen sin respuesta; se preguntan uno a uno |
| 2 | Canal del cliente | «En la fase 4 (Recomendado)» | Responsable, 13/11/2026 | La ficha muestra el canal en lectura; el cambio queda en la 030 |
| 5 | Código con licencia suspendida o caducada | «No, se rechaza (Recomendado)» | Responsable, 13/11/2026 | REQ-044 y CA-031: se rechaza también con licencia suspendida o caducada |
| 6 | Nombres repetidos | «No (Recomendado)» | Responsable, 13/11/2026 | REQ-053 y CA-035: nombre repetido rechazado, sin distinguir mayúsculas ni tildes, también con altas simultáneas |
| 12 | Signos en el nombre | «Cualquiera, como texto (Recomendado)» | Responsable, 13/11/2026 | REQ-052: se admiten y se muestran literal; solo se rechazan saltos de línea y caracteres invisibles |
| 13 | Motivo de la revocación de una conexión | «Sí, con motivo (Recomendado)» | Responsable, 13/11/2026 | REQ-025: la ficha muestra el motivo, de lista cerrada: por un administrador, automática por credencial reutilizada, por revocación de la licencia. Pide un dato nuevo a la fase 2 |
| 14 | Volumen y umbral | «Menos de 2 segundos (Recomendado)», con 1.000 clientes | Responsable, 13/11/2026 | REQ-006 y CA-003: percentil 95 por debajo de 2 segundos con 1.000 clientes. Vale para toda la fase 3 (023 y 024) |

**Todas las cuestiones de la 022 tienen respuesta** (la 10 se decide en la fase 2; la 11, con la nota aclaratoria del artículo 2). Los efectos los aplica el `especificador`; después se presenta la puerta P0.
| 15 | Coincidencia del nombre tecleado al revocar una licencia | «Sin mayúsculas ni tildes (Recomendado)» | Responsable, 13/11/2026 | CA-043: vale lo tecleado si coincide sin distinguir mayúsculas ni tildes; se puede pegar |
| 16 | Ñ, ü y espacios al comparar nombres y al buscar | «No: ñ y n son distintas (Recomendado)» | Responsable, 13/11/2026 | La ñ y la ü no se igualan a n y u; tildes y mayúsculas se ignoran; los espacios repetidos cuentan como uno |
| Hueco · Código pendiente al dar de baja o suspender | «La baja anula el código (Recomendado)» | Responsable, 13/11/2026 | Dar de baja al cliente o suspender su licencia anula el código pendiente, con el estado «Anulado»; al reactivar se genera uno nuevo si hace falta |
| Hueco · «Sin señal» en la lista de clientes | «Sí, también en la lista (Recomendado)» | Responsable, 13/11/2026 | REQ-001 y REQ-002: la lista muestra también «Sin señal» y «En pausa», con la regla que fija la 023 |

## Puerta P0

Abierta por el responsable el 13/11/2026 en el diálogo de preguntas del chat de la fase 3, con la respuesta «Apruebo la 022». La especificación pasa a APROBADA. Lo que el resumen presentó como deducción o propuesta sin respuesta previa quedó aprobado con ella.

## Enmienda del 13/11/2026 (después de la puerta P0)

La función 025 (reglas por cliente) obliga a retocar esta especificación. Presentada al responsable en el diálogo de preguntas del chat de la fase 3; respuesta literal: «Sí, apruebo las dos». En la 022: dar de alta un cliente guarda también sus reglas por defecto. En la 024: el inventario gana las acciones de cambiar y de restablecer las reglas de un cliente, y la fila de auditoría puede anotar qué reglas cambiaron, de lista cerrada y sin valores. La especificación sigue APROBADA; la enmienda la aplica el `especificador`.
