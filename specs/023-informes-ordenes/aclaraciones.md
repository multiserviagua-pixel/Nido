# 023 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 3. **Respondidas por el responsable el 12/11/2026: la 12 y, en parte, la 15. Las demás no tienen respuesta todavía.** La columna «Recomendación» es del orquestador y no es una decisión.

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`, donde están las opciones completas.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 1 | «Sin señal» en la fase 3 | **A.** La fase 3 ya muestra la etiqueta y la cifra del resumen. **B.** Hasta la fase 4 solo se ve la fecha del último informe. | **A**, con la misma regla que la alerta «sin señal» de la fase 2 (función 013, cuestiones 3 y 5), no con una regla propia: así la etiqueta y la alerta no se contradicen. Sin ella, el resumen no responde a «¿funcionan los agentes?» |
| 6 y 7 | Anular una orden entregada sin confirmar, y qué pasa al crear una orden con otra viva | **6-A** solo se anulan las pendientes; **6-B** también las entregadas. **7-A** la nueva se rechaza hasta anular la viva; **7-B** la nueva sustituye a la viva, que queda anulada con su fila de auditoría. | **6-B y 7-B.** Con A en las dos, un agente que recibe una pausa y no la confirma deja al cliente bloqueado sin salida desde el panel. La pausa la impone el servidor en cada revisión, así que anular o sustituir no deja al agente en un estado incoherente. El diálogo avisa de que hay una orden viva y de que se anulará |
| 12 | Identificador de cliente en el panel de superadmin (artículo 2) | Igual que la cuestión 11 de la 022. | Confirmar la lectura y anotarla como nota aclaratoria del artículo 2. Solo la puedes hacer tú |
| 16 | ¿Consultar informes es una acción auditada? | **A.** Solo se auditan los cambios. **B.** También las consultas. | **A.** Auditar lecturas multiplica las filas y entierra los cambios, que son lo que hay que poder revisar. Es la misma decisión que la cuestión 3 de la 024 |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 2 | Revisiones que nunca enviaron informe | Se muestran en el histórico como «Revisión sin informe», con el mismo plazo que use la alerta de la fase 2 (función 013) | El histórico es completo y coincide con la alerta |
| 3 | Lista global de informes | No | Basta el histórico de cada ficha y la lista de informes de hoy con aviso o error |
| 4 | Pausar varios clientes a la vez | No: de uno en uno | La pausa de todos es la pausa global de la fase 4 |
| 5 | Plazo para señalar una orden sin confirmar | 2 veces la frecuencia esperada del cliente, contado desde la creación, y el mismo valor para la alerta de la fase 4 (cuestión 1 de la 032) | Señal y alerta coinciden; se adapta a clientes con revisiones espaciadas |
| 8 | Orden para un cliente sin conexiones activas | Se permite, con advertencia en el diálogo | Poder parar siempre es lo seguro: la pausa queda puesta para cuando se active |
| 9 | Orden para un cliente sin licencia vigente | Se permite, con advertencia | Mismo motivo. El modelo de referencia entrega la orden en cualquier estado; hay que confirmarlo con la fase 2 |
| 10 | Exportación de informes | No | Ningún dato de clientes sale del sistema en un archivo |
| 11 | D-013 (en pausa no se entrega el prompt) | Se decide en el chat de la fase 1 (cuestión 4 de la 001). La 023 supone que se confirma | Si se resuelve de otra forma, se revisan el texto del diálogo de pausa y el final de CA-001 |
| 13 | Alertas abiertas en el resumen | No hasta la fase 4. La etiqueta «Sin señal» de la cuestión 1 es estado del cliente, no gestión de alertas | No se muestra una cifra sin la página donde gestionarla |
| 15 | Volumen de referencia y umbral | El volumen único de la fase 3 (ver cuestión 14 de la 022): 1.000 clientes, 200.000 informes (20.000 de un cliente), 5.000 órdenes; menos de 2 segundos en el percentil 95. Periodo máximo del histórico: 366 días por consulta | Unifica los valores de la 022 y la 023 |

### Resuelta leyendo el repositorio

| N.º | Cuestión | Lo que dice el repositorio | Efecto |
| --- | --- | --- | --- |
| 14 | Qué significan «sin tratar» y «facturas pendientes» | Son lo que queda al terminar la revisión, no recuentos de trabajo hecho. El prompt 1.2 (`docs/referencia/agente-ia-1.2.md`, apartado «Panel de salud») define el estado `aviso` como «revisaste pero quedó algo sin hacer (correos sin tratar, facturas sin descargar…)», y el requisito 14 de la 012 dice que `sin_tratar` es mayor que cero «si quedan correos sin tratar» | En la evolución diaria se muestra el último valor de cada día, no la suma (opción a). Se propone a coordinación aclararlo en la descripción del contrato. Si el responsable lo entiende de otra forma, se reabre |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | «Sin señal» en la fase 3 | Sin respuesta | — | Pendiente (REQ-015, CA-011) |
| 2 | Revisiones sin informe | Sin respuesta | — | Pendiente (REQ-004; requisito nuevo si la respuesta es sí) |
| 3 | Lista global de informes | Sin respuesta | — | Pendiente |
| 4 | Pausar varios a la vez | Sin respuesta | — | Pendiente |
| 5 | Plazo de confirmación | Sin respuesta | — | Pendiente (REQ-028, CA-019) |
| 6 | Anular una orden entregada | Sin respuesta | — | Pendiente (REQ-024, REQ-046, CA-015, CA-023) |
| 7 | Nueva orden con otra viva | Sin respuesta | — | Pendiente (REQ-025, REQ-026, CA-016) |
| 8 | Cliente sin conexiones activas | Sin respuesta | — | Pendiente (REQ-044, CA-022) |
| 9 | Cliente sin licencia vigente | Sin respuesta | — | Pendiente (REQ-043, CA-022) |
| 10 | Exportación | Sin respuesta | — | Pendiente (REQ-011) |
| 11 | D-013 | Se decide en la fase 1 | — | Pendiente (REQ-022, REQ-027, CA-001) |
| 12 | Identificador de cliente | «Nota aclaratoria (Recomendado)» | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | Se confirma la lectura de REQ-003: sin cambios en los requisitos. La nota del artículo 2 la aplica coordinación |
| 13 | Alertas en el resumen | Sin respuesta | — | Pendiente (REQ-016, CA-010) |
| 14 | Significado de las dos cifras | Resuelta leyendo el repositorio (opción a) | Orquestador, 12/11/2026 | REQ-009: último valor del día. Se aplica al aprobar |
| 15 | Volumen y umbral | «Menos de 100» clientes en tres años; la opción decía «Se prueba con 1.000 clientes igualmente» | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | Volumen de prueba: 1.000 clientes (la 023 proponía 200). El umbral de 2 segundos y el periodo máximo del histórico siguen propuestos y se confirman al aprobar la 023 |
| 16 | Auditar consultas | Sin respuesta | — | Pendiente (REQ-029) |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Ninguna todavía. Cuando haya respuesta, se pasan a coordinación por `propuestas.md`: este chat no edita el registro de decisiones.

## Respuestas del 13/11/2026

Preguntadas por el orquestador en el diálogo de preguntas del chat de la fase 3. Sustituyen a «Sin respuesta» en la tabla de arriba.

| N.º | Cuestión | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | «Sin señal» en la fase 3 | «Sí, etiqueta y cifra (Recomendado)» | Responsable, 13/11/2026 | REQ-015 y CA-011: la lista y el resumen muestran «Sin señal», con la misma regla que la alerta de la función 013 |
| 6 y 7 | Orden nueva con otra viva; anular una entregada | «La nueva sustituye (Recomendado)» | Responsable, 13/11/2026 | REQ-024 y REQ-025: la orden nueva anula la viva, con su fila de auditoría; una orden entregada y sin confirmar se puede anular a mano; el diálogo lo avisa. Una orden anulada o sustituida no se puede confirmar después (pide un cambio a la fase 2). Entrada nueva en el inventario de la 024: anulación automática por sustitución |
| 8 y 9 | Orden para un cliente sin conexiones activas o sin licencia vigente | «Sí, con aviso (Recomendado)» | Responsable, 13/11/2026 | REQ-043 y REQ-044: se permite, con advertencia en el diálogo. Cliente dado de baja: sigue rechazado |
| 5 | Plazo para señalar una orden sin confirmar | «2 veces su frecuencia (Recomendado)» | Responsable, 13/11/2026 | REQ-028 y CA-019: 2 veces la frecuencia esperada del cliente, contado desde la creación. Se propone lo mismo a la 032 |
| 15 | Volumen y umbral | «Menos de 2 segundos (Recomendado)», con 1.000 clientes (respuesta dada para toda la fase 3) | Responsable, 13/11/2026 | REQ-035 y CA-007 con 1.000 clientes y percentil 95 por debajo de 2 segundos. El periodo máximo del histórico sigue sin respuesta |
| 2 | Revisiones que nunca enviaron informe | «No, esperar a la fase 4» (opción distinta de la recomendada) | Responsable, 13/11/2026 | En la fase 3 solo se ven los informes recibidos. Las revisiones sin informe quedan fuera de alcance |
| 16 | ¿Consultar informes es una acción auditada? | «Solo los cambios (Recomendado)» | Responsable, 13/11/2026 | REQ-029 sin cambios. Resuelve también la cuestión 3 de la 024 |
| 3, 4, 10, 13 y periodo máximo | Detalles con valor propuesto | «Los reviso uno a uno» | Responsable, 13/11/2026 | Siguen sin respuesta; se preguntan uno a uno |
| 3 | Lista global de informes | «Sí, con filtros» (opción distinta de la recomendada) | Responsable, 13/11/2026 | Requisito nuevo: página «Informes» con los de todos los clientes, filtrable por cliente, estado y fecha, con sus cinco estados, accesibilidad y umbral de respuesta. Entrada nueva en el menú: pide un cambio a la 020 (REQ-003 fija cinco entradas) y a `docs/DISENO.md` |
| 4 | Pausar varios clientes a la vez | «No, de uno en uno (Recomendado)» | Responsable, 13/11/2026 | Sin cambios |
| 10 | Exportación de informes | «Sí, las cifras» (opción distinta de la recomendada) | Responsable, 13/11/2026 | REQ-011 cambia: se exportan las cifras del histórico de un cliente. Requisitos nuevos: solo campos del contrato, sin texto libre; formato por decidir en el diseño; la exportación deja fila de auditoría (entrada nueva en el inventario de la 024) y pasa su revisión de privacidad |
| 13 | Alertas abiertas en el resumen | «No hasta la fase 4 (Recomendado)» | Responsable, 13/11/2026 | REQ-016 sin cambios |
| 15 (resto) | Periodo máximo del histórico | «Un año (Recomendado)» | Responsable, 13/11/2026 | REQ-057: hasta 366 días por consulta y por exportación |

**Todas las cuestiones de la 023 tienen respuesta** (la 11, D-013, se decide en la fase 1; la 12, con la nota aclaratoria del artículo 2; la 14, resuelta leyendo el repositorio). Los efectos los aplica el `especificador`; después se presenta la puerta P0.

## Huecos que salieron al aplicar las respuestas (13/11/2026)

| Asunto | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- |
| Cuestión 17 · Cómo se agregan por día las cifras de trabajo hecho | «Se suman (Recomendado)» | Responsable, 13/11/2026 | REQ-009 y CA-008: tratados, borradores, documentos y urgentes se suman por día; «sin tratar» y «facturas pendientes» muestran el último valor del día |
| «Sin señal» en la lista de clientes | «Sí, también en la lista (Recomendado)» | Responsable, 13/11/2026 | La lista de clientes (función 022) muestra «Sin señal» y «En pausa» junto al estado. Se añade a la 022 |
| Tiempo máximo de una exportación | «Que lo proponga el diseño» | Responsable, 13/11/2026 | El umbral lo propone el arquitecto con datos y se aprueba en la puerta P1 |

## Puerta P0

Abierta por el responsable el 13/11/2026 en el diálogo de preguntas del chat de la fase 3, con la respuesta «Apruebo la 023». La especificación pasa a APROBADA. Lo que el resumen presentó como deducción o propuesta sin respuesta previa quedó aprobado con ella.
