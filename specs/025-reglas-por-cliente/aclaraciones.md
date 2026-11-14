# 025 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Preguntadas por el orquestador de la fase 3 el 13/11/2026 en el diálogo de preguntas del chat. Las opciones completas están en «Cuestiones abiertas» de `especificacion.md`. La recomendación era del orquestador y no es una decisión.

## Respuestas

| N.º | Cuestión | Recomendación del orquestador | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- | --- |
| 1 | Editar las reglas de un cliente de baja o sin licencia vigente | Sí, salvo con el cliente dado de baja | «Siempre» (opción distinta de la recomendada) | Responsable, 13/11/2026 | Las reglas se pueden editar en cualquier estado del cliente y de su licencia. El diálogo avisa cuando el agente no las recibirá todavía |
| 2 y 3 | Valores por defecto y qué hace «Restablecer» | Que cada cliente nazca con sus reglas guardadas | «Nace con sus reglas (Recomendado)» | Responsable, 13/11/2026 | Al dar de alta un cliente se guardan los valores por defecto: 30 correos por revisión, 3 días, y adjuntos, borradores y facturas por enlace activados. «Restablecer» vuelve a guardar esos valores. Desaparece el caso «cliente sin reglas guardadas». Pide un cambio a la 022 (alta de cliente) y coincide con la recomendación pendiente de la cuestión 15 de la 011 |
| 4 | Qué guarda la auditoría | Qué reglas cambiaron, sin valores | «Qué reglas cambiaron (Recomendado)» | Responsable, 13/11/2026 | La fila dice qué reglas cambiaron, de lista cerrada, sin sus valores. No cambia la regla de la 024 de no guardar valores |
| 5 | Historial en la ficha | Solo el último cambio | «Lista de cambios» (opción distinta de la recomendada) | Responsable, 13/11/2026 | La ficha muestra la lista de cambios de reglas del cliente: quién, cuándo y qué reglas, sin valores, paginada. Sale de la auditoría |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`. Este chat no edita el registro de decisiones: se pasan a coordinación.

- Función `025-reglas-por-cliente` en la fase 3 (responsable, 13/11/2026).
- Todo cliente nace con sus reglas guardadas; afecta a la 022 y a la 011.
- Dos acciones nuevas para el inventario de la 024: cambiar las reglas de un cliente y restablecerlas a los valores por defecto.

## Puerta P0

Abierta por el responsable el 13/11/2026 en el diálogo de preguntas del chat de la fase 3, con la respuesta «Apruebo la 025». La especificación pasa a APROBADA, con las deducciones del `especificador` presentadas en el resumen.
