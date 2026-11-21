# 016 · Dictamen del auditor-seguridad sobre la enmienda 1 (vuelta 2, última)

Fecha: 21/11/2026 · `auditor-seguridad` · Leído: `especificacion.md` entera, con las secciones «Enmienda 1» y «Vuelta de corrección 21/11/2026»; `dictamen-enmienda-1.md`; `verificacion-gmail-outlook.md` (puntos 1 a 7 de Gmail, D1 a D7, NC-1 a NC-10); `propuestas.md` (P-19 y P-22); y, para la vuelta atrás, la especificación de la 015 (REQ-024 y CA-021). Solo especificación: no hay código ni pruebas que ejecutar.

**Veredicto: APTO CON CONDICIONES. Sin bloqueantes. 2 MAYOR y 2 MENOR**, que se corrigen con texto antes de la puerta P0 de la enmienda. Los dos MAYOR los abren las propias correcciones: uno deja a medias el cierre de B-1 y el otro, el de M-4.

## Cierre de lo pedido en la vuelta 1

| N.º | Estado | Dónde queda |
| --- | --- | --- |
| B-1 | CERRADO en lo esencial, salvo la versión del prompt (M-1 de esta vuelta) | REQ-017 (l. 53) rige mientras esté instalada. Nombra `send_message`, `reply` y `forward`, la nube y el navegador o el equipo, con lista guiada al activar y cada 30 días y desactivación sola. CA-019 (l. 100). «Por qué la página cumple» cita REQ-017 (l. 152). P-19 entra en REQ-026 (l. 69), pero solo al activar |
| M-1 | CERRADO | REQ-008 (l. 44): historial en todo el intervalo, «aunque después se haya deshecho», y no envía si no lo cubre o no se puede leer. CA-010 (l. 91) |
| M-2 | CERRADO | REQ-008: cualquier filtro que pueda abarcar los correos de cortesía, con cualquier acción, o filtros ilegibles, impiden el envío. Cuenta de leídos sin visita. CA-010. Riesgo residual (l. 74) coherente |
| M-3 | CERRADO | REQ-002 (l. 38) y REQ-021 (l. 64): discriminador que no depende de cabeceras, cuerpo ni fecha, en recibidos y en enviados de 24 meses; sin él, nada cuenta. NC-12 en REQ-026. CA-002 y CA-023 |
| M-4 | CERRADO en el caso pedido, con un hueco nuevo en su borde (M-2 de esta vuelta) | REQ-002: no cuentan el borrador del agente enviado sin cambios ni lo del delegado; «si no se puede distinguir, no cuenta». CA-002 |
| m-1 | CERRADO | Término «Piloto» (l. 30), REQ-026 y CA-029 |
| m-2 | CERRADO | REQ-002 y CA-002: registro de 24 meses o plazo acortado |
| m-3 | CERRADO (pasa al diseño) | «Se quedan en el diseño» (l. 154) |

## Hallazgos nuevos

| N.º | Gravedad | Dónde · art. · amenaza | Escenario | Corrección mínima en texto |
| --- | --- | --- | --- | --- |
| M-1 | MAYOR | REQ-026 (l. 69), CA-029 (l. 110), REQ-017 (l. 53) · arts. 8 y 9 · A-12 y A-13 | La condición del prompt solo se comprueba **al activar**: «solo si la versión del prompt del canal de esa cuenta no pide navegador…». P-19 dice «mientras la compuerta esté instalada», pero eso no ha pasado al requisito. Después de activar, el canal puede pasar a servir una versión que pida navegador con la sesión de Google o envío en conversación. El caso más claro es la vuelta atrás normal de la 015 (REQ-024: vuelve a ser vigente «la versión que lo era antes»). En un canal recién pasado a la versión con la 016, esa versión es la 1.2, que pide «navegador con mi sesión ya iniciada» y permite el envío en conversación. El agente se lo pide al dueño porque lo dice su propio prompt, el dueño se lo da y vuelve el escenario de B-1: edición del código y lectura del secreto. La compuerta sigue activa hasta 30 días, y desactivarla tampoco frena un código ya editado. Así, lo que entrega el servidor relaja el art. 8 | REQ-026: «La condición del prompt rige mientras haya en ese canal una cuenta con la compuerta instalada, no solo al activar. El canal no puede pasar a una versión que pida navegador con la sesión del dueño en Google o envío en conversación, tampoco por la vuelta atrás de la 015. Si no hay una versión anterior que cumpla, la vuelta atrás deja el canal sin instrucciones (REQ-024 de la 015)». CA-029: con una cuenta de prueba con la compuerta instalada, pasar el canal a una versión así y volver atrás a la 1.2: rechazado las dos veces. Propuesta a la 015 para que su selección de versión lo compruebe |
| M-2 | MAYOR | REQ-002 (l. 38), CA-002 (l. 83) · arts. 8 y 7 | El texto dice «ni un borrador creado por el agente que el dueño envía sin cambios (mismo criterio que el requisito 1 de la 018)». Es más estrecho que la decisión de la coordinación («lo enviado por borrador del agente no cuenta»): con cambios, cuenta. Para saber si hubo cambios, y aun si el mensaje vino de un borrador del agente, hace falta una referencia. El requisito 1 de la 018, al que remite el texto, reconoce que esa copia «la puede escribir el agente». Escenario: un desconocido escribe algo inocente y el agente deja el borrador. Una instrucción oculta le hace guardar una copia distinta, u omitir la marca o el registro de procedencia que use el diseño. El dueño lo envía sin tocarlo. La comparación dice «cambiado» o «no es del agente», y el desconocido pasa a ser contacto previo. Su correo siguiente sale respondido solo. Es el mismo ataque de M-4 | REQ-002: «Un mensaje que procede de un borrador creado por el agente no cuenta, lo haya cambiado o no el dueño (lo que cambie solo vale para el estilo, requisito 1 de la 018). La procedencia la establece la compuerta con su propio estado o con datos de la plataforma, nunca con copias, marcas, etiquetas, cabeceras ni archivos que el agente pueda escribir u omitir. Si no la puede establecer, no cuenta». CA-002, con 0 envíos en cada caso: borrador del agente enviado con un cambio mínimo del dueño; enviado con la copia alterada por el agente; enviado con la marca o el registro omitidos por el agente. Si la coordinación prefiere que cuente el borrador cambiado, la referencia de la comparación tiene que estar en el estado de la compuerta (REQ-013), y lo dicen el texto y CA-002 |
| m-1 | MENOR | REQ-017 (l. 53), CA-019 · art. 8 | La lista guiada «herramienta por herramienta» es una lista de prohibidas. Del conector de Gmail en Claude se ven 24 de 29 herramientas (A1 de la verificación), y un conector puede añadir otras después de activar. Una herramienta que envíe o que borre filtros y no esté en la lista queda fuera de la declaración hasta 30 días | «La declaración es una lista de permitidas: el dueño confirma que, en cada conector de correo y de nube, solo están sin bloquear las herramientas que nombra la lista, y que lo nuevo o lo no nombrado está bloqueado. Si el asistente no permite bloquear por defecto, la guía le dice que revise los conectores tras cada cambio». CA-019: con una herramienta de envío que no está en la lista (simulada), 0 activaciones mientras no se declare bloqueada |
| m-2 | MENOR | REQ-008 (l. 44), CA-010 · art. 8 | **Sospecha, sin comprobar.** Los filtros solo se miran al final, pero actúan al entregar el correo, no después. Supongamos que el diseño deja el correo de cortesía por una vía a la que se aplican filtros y que el agente puede borrar filtros (`create_filter` está a la vista; el borrado no consta en A1). Entonces un filtro creado antes y borrado antes del final lo deja en otra pestaña o como no importante sin ningún cambio en el historial | «Los filtros se comprueban también al dejar el correo de cortesía, y la compuerta comprueba entonces que lleva exactamente las etiquetas con que lo creó». CA-010: filtro creado antes del aviso y borrado antes de la comprobación final (simulado): 0 envíos |

## Lo que no se reabre

No se reabre lo que fijó la coordinación: el borrador del agente y lo del delegado no cuentan, y el «leído» queda exento. M-2 solo pide que el texto diga lo que ya se decidió. Tampoco se reabre lo enviado al piloto (NC-12, NC-13 y las pruebas de REQ-017) ni al diseño (m-3 de la vuelta 1).

Privacidad (art. 1): las correcciones no añaden nada que llegue a HumanaIA. Para comprobar qué versión sirve cada canal (M-1) bastan la licencia y el canal, sin datos del correo.

**No comprobado:**

- Si el conector de Gmail tiene una herramienta para borrar filtros (m-2), y qué hacen las 5 herramientas que no se ven.
- Si los filtros se aplican al correo que deja la compuerta; depende de que lo inserte o lo envíe.
- Si Claude permite bloquear por defecto las herramientas nuevas de un conector.
- Si Gmail conserva en el mensaje enviado el identificador del borrador (M-2); lo resuelve NC-2.

No se ha ejecutado nada: es una revisión de texto.

**Sin bloqueantes.**
