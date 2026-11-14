# 012 · Aclaraciones

Cuestiones presentadas al responsable el 12/11/2026. **Tienen respuesta las n.º 1, 2, 13 y 14 y, en parte, la n.º 8; las demás siguen abiertas.** Una respuesta supuesta no vale: mientras la columna «Respuesta» esté vacía, la cuestión sigue abierta y la función sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`, donde están las opciones y la consecuencia de cada una. La columna «Recomendación» es del orquestador; no es una decisión.

Tipos:

- **R**: la decide el responsable ahora (puerta P0).
- **F1**: depende del resultado de la fase 1 (función 001).
- **D**: es del diseño. Se lleva en la puerta P1.
- **C**: es de otra fase o del chat de coordinación. Va en `propuestas.md`.
- **Resuelta**: queda contestada por otra cuestión. Se indica cuál.

| N.º | Cuestión | Tipo | Recomendación del orquestador | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | En pausa, el dueño pide en conversación que revise (D-013) | R | El agente no revisa y le dice que pida a HumanaIA que reanude. Es coherente con D-013, con el contrato y con lo que la guía de instalación explica al cliente. Es la misma cuestión que el n.º 1 de la 011 y la cuestión 4 de la 001 | A la pregunta «¿En pausa el agente no revisa, aunque su dueño se lo pida en conversación?»: «Sí, no revisa» | Responsable, 12/11/2026 | Respondida. REQ-027 dice ya qué hace el agente en ese caso y CA-011 añade la variante en conversación. Era el único punto abierto de D-013; su paso a CONFIRMADO lo anota coordinación (propuesta P-11) |
| 2 | Enviar un borrador si el dueño lo pide expresamente | R | Eliminar la excepción: el agente no envía nunca y el dueño envía desde su correo. Mantenerla obliga a dejar activa la herramienta de enviar y a cambiar el ADR-0004, y debilita el control del artículo 8 | A la pregunta «¿Quitamos de la 1.3 que el agente envíe un borrador si su dueño se lo pide?»: «Sí, nunca envía» | Responsable, 12/11/2026 | Respondida. REQ-017 dice que la excepción no se conserva. Nuevos: REQ-055 (el dueño pide enviar un borrador) y CA-025 (su prueba) |
| 3 | Dónde vive el arranque y si hay variantes | R, F1 | El mismo texto en las instrucciones del proyecto (conversación) y en la tarea programada (desatendido), instalado por una persona de HumanaIA. Nunca un archivo de la nube del cliente. Si un asistente no admite alguna de las dos cosas, lo dirá la fase 1 y se revisa | | | |
| 4 | Copia del prompt en la nube del cliente | R | Deja de existir. Nada en la nube tiene autoridad | | | |
| 5 | Qué hace el agente con la huella | R | Nada: la huella sirve al servidor y a la auditoría. Un modelo no la calcula de forma fiable | | | |
| 6 | De dónde sale `frecuencia_horas` | R | Manda la ficha del cliente. El agente declara lo que sepa de su tarea (24 si no lo sabe, como en la 1.2) y el servidor no usa ese campo para las alertas. Se propone a coordinación retirarlo en la siguiente versión del contrato. Va unida al n.º 17 de la 013 | | | |
| 7 | Vigencia de la 1.2 | R | Sigue sin cambios para los clientes de carpeta `panel` hasta la fase 6. En el repositorio queda como referencia; no se registra ni se sirve por el conector | | | |
| 8 | Cuentas, planes y combinaciones de correo y nube para las pruebas | R | Las crea el responsable. Probar el banco completo en la combinación que más usan los clientes y un recorrido corto en las demás. Hace falta que el responsable diga cuáles son | «Claude, chatgpt, gmail, y outlook» | Responsable, 12/11/2026 | Respondida en parte. El banco cubre Claude y ChatGPT, con Gmail y con Outlook. Siguen abiertos: la nube de cada combinación, los planes (los fija la fase 1), en qué combinaciones se ejecuta el banco completo y quién crea las cuentas de prueba |
| 9 | «Si ya hay otro agente», registro y aprendizaje | R | Se mantienen igual. Un agente 1.2 que escriba en `panel` en la misma cuenta cuenta como «otro agente» | | | |
| 10 | Quién aprueba reinstalar el arranque y cómo se sabe qué versión tiene cada cliente | R | Cada cambio lo aprueba el responsable. La versión instalada se anota a mano en la ficha del cliente (fase 3). Un campo cerrado en el informe se propone para una versión posterior del contrato | | | |
| 11 | Llamarla 1.3 o 2.0 | R | 1.3, como dicen el plan y el esqueleto. La regla del número mayor de la skill `version-prompt` se aplica entre versiones servidas por el conector, y esta es la primera | | | |
| 12 | A qué versión se vuelve atrás | R | Dos niveles: la vuelta atrás inmediata es la pausa; la completa, cuenta por cuenta, es reinstalar el método anterior (1.2 con `panel`), con procedimiento escrito y probado | | | |
| 13 | Informe en estado `suspendida` | R | No se envía informe en `pausada` ni en `suspendida`: el informe es el resultado de una revisión y ahí no la hay. La señal de vida es la propia petición de instrucciones y, si la hubo, la confirmación de la orden. No cambia el esquema del informe; hay que corregir la descripción de `enviar_informe`, que dice «también si está en pausa». Va unida al n.º 10 de la 013 | A la pregunta «¿En pausa y en suspensión el agente no envía informe?»: «Sí, sin informe» | Responsable, 12/11/2026 | Respondida. REQ-027 y REQ-028 dicen que no envía informe; CA-011 y CA-012 comprueban que no llega ninguno. La corrección de la descripción de `enviar_informe` va a coordinación (propuesta P-06) |
| 14 | `version_prompt` y `comprobaciones` en el informe de pausa | Resuelta | Si se acepta el n.º 13, no hay informe de pausa y la cuestión desaparece. Si no se acepta, hay que cambiar el contrato | Desaparece: no hay informe de pausa (n.º 13) | Responsable, 12/11/2026, al responder el n.º 13 | REQ-027 dice ya «no envía informe» |
| 15 | Informe cuando la respuesta es inválida pero trae identificador de ejecución | R | No se envía. La ejecución queda abierta y genera su alerta, que es la señal correcta de que algo falló | | | |
| 16 | Órdenes sueltas en conversación | R | Toda conversación en la que el agente vaya a tocar el correo empieza con `obtener_instrucciones` y termina con informe. Es lo que mantiene el cierre en fallo y la comprobación de la licencia | | | |
| 17 | Prompt recibido con una instrucción que relaja un límite | R | Rechazar la versión entera y no tocar el correo; informe con `error` y el código `otro`. Un texto así indica un error grave o un servidor comprometido, y antes de llegar a `estable` ha pasado revisión, banco y canal de prueba | | | |
| 18 | Reintentos ante fallo del conector | R | Un reintento tras una espera corta (dos intentos en total). Después, cierre en fallo | | | |
| 19 | Orden recibida en estado `suspendida` | Resuelta | Si se acepta el n.º 1 de la 011, en `suspendida` no se entrega orden y no hay nada que confirmar | Depende del n.º 1 de la 011 | | REQ-028 se simplifica |
| 20 | Repeticiones y tolerancias del banco | R | Aceptar la propuesta: 5 repeticiones por escenario, asistente y modo; cero fallos de seguridad; 5 de 5 en lo que tiene resultado único. Para `urgentes`, `borradores` y `documentos`, tolerancia de una unidad respecto a lo esperado | | | |
| 21 | Cómo se producen las respuestas hostiles o inválidas del conector | D | Un doble de prueba del conector para esos escenarios y el servidor real para el resto. Se lleva en la puerta P1 | | | |
| 22 | Facturas por enlace | R | Mantener lo de la 1.2, gobernado por la regla del cliente. Con la regla desactivada, esas facturas cuentan en `facturas_pendientes` | | | |
| 23 | Si el prompt es confidencial frente al dueño | R | No lo es. No se puede garantizar que no lo vea y no contiene secretos; el agente puede enseñarlo si su dueño lo pide | | | |
| 24 | Piloto de la fase 4 en paralelo con `panel` | C | Es de la fase 4. Queda en la propuesta P-10 | | | |
| 25 | Cuándo se repite el banco | R | Al registrar cada versión, cuando un proveedor anuncie un cambio de modelo y, como mínimo, una vez por trimestre | | | |
| 26 | Añadida por el orquestador. En la 1.2 el agente crea su propia tarea programada cuando el dueño se lo pide («prográmalo cada día a las 8»). REQ-018 lo impide en la 1.3 | R | Aceptarlo: la tarea la crea la persona que instala, con el texto del repositorio. Si el servidor pudiera pedir al agente que cree o cambie tareas, podría reescribir el arranque (artículo 8). El dueño que quiera otra hora la cambia en su asistente o lo pide a HumanaIA | | | |

## Decisiones que salen de aquí

Pendiente de las respuestas. Las que deban quedar en `docs/TECNOLOGIAS.md` (D-013 y las de los n.º 2, 4 y 12) las anota el chat de coordinación; se le pasan por `propuestas.md`.
