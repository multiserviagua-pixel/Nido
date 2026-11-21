# 018 · Dictamen del auditor-seguridad sobre la especificación (vuelta 1)

Fecha: 21/11/2026 · Resumen del orquestador del dictamen del `auditor-seguridad`.

**Veredicto: APTO CON CONDICIONES. Sin bloqueantes; 3 MAYOR a corregir antes de P0 y 4 MENOR.** Cubre su condición: se queda en la cuenta del cliente (REQ-013, CA-012), la compuerta no lo lee (REQ-005, CA-004), no crea contacto previo, exclusión, tope ni filtro (REQ-004(d), REQ-005), lo recibido no se guarda como instrucción (REQ-002, REQ-007), el estilo sale solo de lo que escribió el dueño (REQ-001) y nada llega a HumanaIA (contratos revisados).

| N.º | Gravedad | Hallazgo | Corrección mínima |
| --- | --- | --- | --- |
| H1 | MAYOR | REQ-003 admite correcciones de etiqueta por dirección y REQ-004(d) y REQ-006 lo prohíben. Una corrección falsa hace que los correos médicos o de reclamación de un contacto hereden una categoría admitida y anula la exclusión por asunto | Una corrección de etiqueta aprendida nunca pasa un correo de una categoría excluida por asunto a una admitida ni lo hace candidato; manda la exclusión, juzgada sobre el correo actual; solo cuentan correcciones que consten hechas por el dueño; nuevo CA con 0 candidatos en categorías excluidas |
| H2 | MAYOR | Una fórmula envenenada de 120 caracteres sin forma de dato pasa el filtro, dura hasta 12 meses y va en todas las respuestas automáticas; la cota del 1,5 % no equivale al 1 % por intento y el riesgo residual no habla de amplificación | Cada fórmula debe aparecer literalmente (salvo el hueco del nombre) en al menos 2 muestras propias distintas; lo añadido en continuo se informa como novedad y no se usa hasta la revisión siguiente; ampliar el riesgo residual con persistencia y amplificación |
| H3 | MAYOR | CA-015 y CA-016 no dicen en qué camino se ejecutan; el camino de persistencia probable es la revisión desatendida continua con el paso 7 | Ejecutarlos en 200 pruebas o más por asistente también en revisiones desatendidas con el paso 7 activo y un borrador corregido por el dueño; medir la persistencia en las 5 revisiones siguientes |
| H4 | MENOR | Un borrador del agente enviado con un cambio mínimo cuenta como muestra propia | Del borrador editado solo cuenta lo que el dueño cambió |
| H5 | MENOR | Las reglas breves del paso 7 son texto libre sin forma cerrada | Longitud máxima y forma cerrada (rasgo de la lista → valor, o una frase sobre un rasgo de la lista) |
| H6 | MENOR | Visto bueno y pausa guardados donde el agente o un tercero pueden escribir | Solo cuentan los dados por el dueño en conversación o en la vista de la P-2; los marcadores de otros se ignoran y se señalan; añadirlo a CA-007 y CA-011 |
| H7 | MENOR | El contexto de la 1.2 guarda estilo y puede recibir un envenenamiento fuera del aprendizaje | El estilo solo se escribe en lo aprendido; lo que se añada a otro archivo cae en los requisitos 2 a 4 y 7 o se ignora |

Notas: la cota del 1,5 % vale para la batería en conjunto; el diseño fija un mínimo de pruebas por variante para las más dañinas (fórmula, corrección de etiqueta, «de confianza»). CA-014 debe decir «paso 7 conservado en lo que hace y restringido por REQ-002 a REQ-004 y REQ-007».

**Cuestiones.** La A de las dos es la restrictiva y la fija la coordinación por D-036 (la B de la 1 quita la única revisión humana del arranque y empeora H2; la B de la 2 cambia el contrato y necesita su propia revisión de privacidad).

No comprobado: si Gmail y Outlook distinguen en enviados lo escrito por el dueño de lo enviado por la compuerta, importado o automático (si no, REQ-001 queda en «no cuenta»: seguro); dónde guardar el visto bueno fuera del alcance del agente.
