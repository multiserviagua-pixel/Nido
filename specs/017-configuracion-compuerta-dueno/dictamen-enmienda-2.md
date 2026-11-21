# 017 · Dictamen del auditor-seguridad sobre la enmienda 1 (vuelta 2, última)

Fecha: 21/11/2026 · `auditor-seguridad` · Leído: `especificacion.md` entera, con las secciones «Enmienda 1» y «Vuelta de corrección 21/11/2026»; `dictamen-enmienda-1.md`; la especificación corregida de la 016 y su `verificacion-gmail-outlook.md` (puntos 3, 6 y 7 de Gmail, D1, D3 y D4). Solo especificación.

**Veredicto: APTO CON CONDICIONES. Sin bloqueantes ni MAYOR propios. 2 MENOR.** La condición es externa: que se corrija M-1 del dictamen de la vuelta 2 de la 016 (versión del prompt mientras la compuerta esté instalada). Sin eso, el requisito 17 de la 016, en el que descansan REQ-023 y la exención del «leído», queda abierto a una vuelta atrás del prompt.

## Cierre de lo pedido en la vuelta 1

| N.º | Estado | Dónde queda |
| --- | --- | --- |
| M-1 | CERRADO | REQ-023 (l. 48): el secreto, donde no lo muestre ninguna pantalla del proyecto (NC-4); si no, el texto dice que lo lee cualquier editor y que la protección descansa en el requisito 17 de la 016. CA-022 (l. 99) abre ajustes y propiedades |
| M-2 | CERRADO, con un borde (m-1 de esta vuelta) | REQ-023: cambiar o volver a dar de alta el secreto es relajante, pide el código vigente y queda pendiente; si se pierde, solo cabe reinstalar. Proyecto nuevo: desactivada, filtro encendido y activación pendiente. Supuesto (l. 67). CA-022 |
| M-3 | CERRADO | REQ-009 (l. 40) y REQ-018 (l. 59): historial en todo el plazo, «aunque luego lo restaure», filtros que puedan abarcar o ilegibles, cuenta de leídos sin visita. CA-017 (l. 94). Riesgo residual (l. 70) coherente |
| m-1 | CERRADO | REQ-004 (l. 35), supuestos y CA-004: cuentan los intentos de código, correctos o no |
| m-2 | CERRADO | REQ-023 y CA-022: autenticadores que no valen; alta sin asistente con navegador o control del equipo |
| m-3 | CERRADO | REQ-005 (h) (l. 36); CA-005 revisa de (a) a (h) |
| m-4 | CERRADO | `propuestas.md`, P-12 |

La duda 1 (apartarse de R-2) queda bien fijada: la exención del «leído» depende de B-1 de la 016 y de M-3, y los dos están en el texto.

## Hallazgos nuevos

| N.º | Gravedad | Dónde · art. · amenaza | Escenario | Corrección mínima en texto |
| --- | --- | --- | --- | --- |
| m-1 | MENOR | REQ-023 (l. 48), REQ-011 (l. 42) · art. 8 | «Si se ha perdido, solo cabe reinstalar», pero solo la instalación «en un proyecto nuevo» empieza desactivada con la activación pendiente. Reinstalar en el mismo proyecto conserva el estado (requisito 14 de la 016), y por tanto la activación, con un secreto nuevo dado de alta sin el código vigente. Lo puede hacer quien edite el proyecto, que ya excluye el requisito 17 de la 016, así que el riesgo es bajo. Pero el texto abre una vía de alta del secreto que no pide el código vigente | «Toda instalación o reinstalación que dé de alta un secreto nuevo sin el código vigente, en el mismo proyecto o en otro, deja la compuerta desactivada, con el filtro encendido y la activación pendiente con su aviso». CA-022: reinstalación en el mismo proyecto con secreto nuevo: desactivada y activación pendiente |
| m-2 | MENOR | REQ-009 (l. 40), REQ-018 (l. 59), CA-017 · arts. 7 y 8 · A-21 | **No lo introduce la vuelta de corrección:** viene de la enmienda 1 y no lo vi en la vuelta 1. La vía protegida muestra datos que escribe el agente o un tercero: el texto exacto del candidato, la dirección y el nombre del remitente y, con la 018, lo aprendido y su huella. Si la página los interpreta como HTML o guion, un correo o lo aprendido envenenado puede cambiar lo que ve el dueño. Por ejemplo, enseñar «bajar un tope» mientras se confirma «apagar el filtro», con un código que no es nominativo. A-21 solo cubre los dashboards de HumanaIA | «La vía protegida muestra todo dato que no escribe ella (texto de candidatos, direcciones, nombres visibles, lo aprendido) como texto inerte, nunca como HTML o guion, con los caracteres invisibles y de control a la vista. Lo que confirma el dueño lo construye la página a partir de su propio estado, nunca de esos datos». CA-017: candidato, nombre visible y entrada de lo aprendido con HTML, guion, invisibles y caracteres de dirección del texto: 0 alteraciones de lo mostrado y 0 cambios. Propuesta a `docs/SEGURIDAD.md`: ampliar A-21 a la vía protegida |

## Lo que no se reabre

No se reabren la cuestión 1, pendiente del responsable y con el valor seguro (B) vigente, ni lo enviado al piloto (NC-4, NC-5, código de un solo uso en la aplicación web, NC-13) y al diseño.

Privacidad (art. 1): las correcciones no añaden nada que llegue a HumanaIA. El secreto no sale de la cuenta.

**No comprobado:**

- Si las propiedades de usuario o de documento salen en alguna pantalla del editor (NC-4).
- Si la reinstalación en el mismo proyecto conserva las propiedades (NC-4).
- Cómo sirve HtmlService los datos en la aplicación web de la compuerta.

No se ha ejecutado nada: es una revisión de texto.

**Sin bloqueantes.**
