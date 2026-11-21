# 018 · Propuestas a otros documentos

Estado: PROPUESTA. Las escribe el `especificador` el 21/11/2026 y las actualiza el mismo día tras el dictamen del `auditor-seguridad` (`dictamen-especificacion-1.md`, H1 a H7) y las aclaraciones (cuestiones 1 y 2, opción A). Las aplica quien sea dueño de cada documento, con la revisión que corresponda. Ninguna está aplicada.

## P-1. Cambios del prompt (función 012)

La versión del prompt que lleve la 018 (registrada por la 015, ruta crítica) necesitaría, sin tocar ningún límite de la 012:

1. En «La primera vez», un paso de arranque: solo en conversación, leer como mucho 100 enviados que cuenten como muestra propia y 100 recibidos de la bandeja de entrada (sin correo no deseado, automáticos, «no tocar» ni hilos de exclusiones por asunto), sin abrir adjuntos ni seguir enlaces, y enseñar lo aprendido al dueño antes de usarlo. Solo vale el visto bueno que da el dueño en conversación o en la vista de P-2; el que aparezca escrito por otro se ignora y se señala (REQ-008).
2. Qué se guarda y qué no (REQ-002 a REQ-004): de lo recibido, solo rasgos de la lista cerrada; fórmulas propias de 120 caracteres como mucho que aparezcan literalmente en 2 muestras propias o más, con el nombre como hueco y sin datos de contacto (REQ-020); reglas breves de 120 caracteres como mucho con la forma cerrada de REQ-003; nada que rechace el filtro de la 016 ni nada sobre envío, destinatarios, candidatos, exclusiones, filtro, topes o permisos. De un borrador del agente enviado por el dueño, solo cuenta lo que él cambió (REQ-001).
3. En el paso 7, que conserva lo que hace en la 1.2 con las restricciones de la 018: fecha y origen en cada entrada; correcciones de etiqueta solo si constan del dueño y sin pasar nunca un correo excluido por asunto a una categoría admitida ni hacerlo candidato (REQ-019); como mucho 30 muestras nuevas por revisión; lo añadido se anuncia como novedad y no se usa hasta la revisión siguiente (REQ-010); respetar la pausa del dueño (REQ-012).
4. En el paso 1, usar como mucho 16 KB de lo aprendido, lo más reciente, y no usar lo de más de 12 meses (REQ-011); ignorar y señalar al dueño lo que no tenga la forma admitida (REQ-007).
5. En el paso 6, que lo aprendido solo da forma al texto y, dentro de REQ-019, etiqueta; nunca decide la marca, las exclusiones, los destinatarios ni el contenido (REQ-006).
6. El estilo deja de escribirse en el archivo de contexto de la 1.2: solo en lo aprendido; lo que sobre estilo haya en otro archivo se trata como lo aprendido o se ignora (REQ-007).
7. En el informe al dueño (paso 9, punto 7), las cifras de REQ-014 y las novedades del continuo. Nada nuevo en el informe del conector (REQ-013).
8. Cómo pide el dueño rehacer, pausar y reanudar (REQ-009 y REQ-012); solo cuentan si los pide él. El agente sigue sin borrar archivos (1.2, «No borras nada»): borrar lo hace el dueño en su nube o en la vista de P-2. Lo decide el diseño.

## P-2. Vista de lo aprendido (función 017)

Propuesta, no reescritura: que la vía protegida, o una superficie de la misma cuenta, ofrezca ver, borrar, pausar, reanudar y pedir rehacer lo aprendido y dar el visto bueno del arranque (REQ-008 y REQ-012), con WCAG 2.2 AA, en español, con estados vacíos («sin aprendizaje», «pausado», «arranque sin visto bueno», «novedades pendientes») y de error («no se puede leer lo aprendido: el agente escribe como sin aprendizaje»). El visto bueno y la pausa dados aquí deben quedar donde ni el agente ni un tercero puedan escribirlos o imitarlos (dictamen, H6). Nada de esto puede vivir en los dashboards de HumanaIA (artículo 1; aclaraciones, cuestión 2). Pausar y borrar son restrictivas; reanudar, rehacer y el visto bueno no relajan ningún control de la compuerta, así que no necesitan la reautenticación de la 017. Si la 017 no la incorpora, basta la carpeta de la nube y la conversación con el agente, y el visto bueno y la pausa solo valen dados en conversación.

## P-3. `docs/PLAN.md`, fase 2

La entrada de la 018 («Aprendizaje de reglas»: proponer reglas para que el dueño las confirme en la 017) contradice la constitución 1.4, que retiró las reglas de remitente. Propuesta de texto: «**018 · Aprendizaje del estilo del dueño:** aprende cómo escribe el dueño de sus 100 últimos enviados y de los rasgos de forma de sus 100 últimos recibidos, y sigue aprendiendo de lo que envía. Se queda en su cuenta, solo da estilo, no autoriza nada y la compuerta no lo lee; lleva batería de envenenamiento». Las entradas de la 016 y la 017 también describen aún la 1.3 (reglas, rodaje).

## P-4. `docs/SEGURIDAD.md`

Amenaza nueva: «Envenenamiento del aprendizaje: un correo o una entrada puesta en la nube intenta que el agente guarde una instrucción, un dato o una corrección de etiqueta del atacante, que persiste hasta 12 meses y se amplifica en todos los borradores y respuestas automáticas de su contexto» · Control: lo aprendido solo admite forma, fórmulas en 2 muestras propias, novedades sin uso inmediato, correcciones de etiqueta solo del dueño y sin pasar sobre las exclusiones por asunto, la compuerta no lo lee, filtro de la 016 · Dónde: función 018. Añadir la entrega de las instrucciones de aprendizaje a la ruta crítica del prompt. Coincide con la condición H7 del dictamen de la constitución 1.4 (no con la H7 del dictamen de esta especificación).

## P-5. Verificación para el diseño

1. Comprobar en Gmail y en Outlook que el agente, con sus conectores, distingue en enviados lo escrito por el dueño de los envíos de la compuerta, las respuestas automáticas, lo importado y la parte no cambiada de sus propios borradores (REQ-001). Si no se puede, esos mensajes no cuentan y el arranque aprende de menos correos. Se suma a la P-02 de la 016.
2. Dónde guardar el visto bueno y la pausa para que el agente y un tercero no puedan escribirlos (REQ-008 y REQ-012; dictamen, «No comprobado»).
3. Cómo consta que una corrección de etiqueta la hizo el dueño (REQ-019). Si no se puede comprobar, no cuenta.

## Nota sobre el nombre de la carpeta

Se propuso `018-aprendizaje-compuerta`. Se usa `018-aprendizaje-estilo` porque la compuerta no usa este aprendizaje (requisito 4 de la 016) y el nombre anterior sugería lo contrario.

## Añadido el 21/11/2026 (tras la P0)

| N.º | Documento | Cambio propuesto | Motivo |
| --- | --- | --- | --- |
| P-6 | `docs/TECNOLOGIAS.md` | Decisión nueva en estado PENDIENTE: aceptación por el responsable del riesgo residual de la 018 (persistencia y amplificación), con las opciones R-3 y «visto bueno para fórmulas del continuo» delante. Al responder, su respuesta literal y la fecha | Dictamen 2 del auditor; D-036 no cubre aceptar riesgos; artículos 6, 13 y 14 |

## Añadido el 21/11/2026 con la enmienda 1

| N.º | Documento | Cambio propuesto | Motivo |
| --- | --- | --- | --- |
| P-7 | `piloto-gmail.md` (arquitecto) | Punto nuevo **NC-11 (propuesto, sin comprobar):** que el agente, con sus conectores, pueda leer el visto bueno y la pausa guardados en el estado de la compuerta por un camino que ni él ni un tercero puedan escribir, y aplicar el discriminador de NC-2 a los enviados. Si no, la 018 queda sin visto bueno y en pausa (REQ-021) | REQ-001, REQ-021 |
| P-8 | 012 (prompt), sobre P-1 | Puntos 1, 3 y 8 de P-1: el visto bueno, la pausa y la reanudación solo valen en la vía protegida; en conversación el dueño pide el arranque y rehacer. Las correcciones de etiqueta solo valen si las dice el dueño en conversación. Lo que el agente envía, también en conversación con confirmación, nunca es muestra propia (D7) | REQ-001, REQ-008, REQ-012, REQ-019 |
| P-9 | 017, sobre P-2 | La vía protegida aloja el visto bueno y la pausa de la 018 (REQ-021): pausar y retirar el visto bueno, restrictivas urgentes; darlo y reanudar, relajantes. Ver y borrar lo aprendido sigue como propuesta | REQ-021 |
| P-10 | Coordinación | Consecuencia que conviene tener presente: en Outlook.com, en Microsoft 365 y en Gmail sin compuerta no se usa el arranque, y en Gmail no se aprende de enviados hasta superar NC-2 | REQ-001, REQ-021 |

P-5 queda contestada por la verificación de la 016 (D2 y D6) y por la enmienda 1, salvo NC-11.
