# 017 · Dictamen del auditor-seguridad sobre la especificación (vueltas 2 y 3)

Fecha: 21/11/2026 · Resumen del orquestador de los dictámenes del `auditor-seguridad`.

## Vuelta 2: APTO CON CONDICIONES, sin bloqueantes

H1 a H6 de la vuelta 1 resueltos. Cuestiones 2 y 3 fijadas por la coordinación (D-036) con la opción restrictiva, bien aplicadas; la 1 no bloquea (rige el valor por defecto de H6). Hallazgos nuevos:

| N.º | Gravedad | Hallazgo | Corrección |
| --- | --- | --- | --- |
| N1 | MAYOR | La presencia del dueño no demuestra que quiera ese cambio: el agente da todos los pasos y el dueño aprueba por costumbre un aviso de presencia que no nombra el cambio | El paso de presencia muestra el cambio concreto en una superficie que el agente no controle; si no, la relajante solo tiene efecto tras una espera con aviso en la cuenta del dueño y cancelación restrictiva |
| N2 | MAYOR | Las restrictivas con una sola confirmación las puede hacer el agente con el navegador (añadir exclusión, bajar tope), lo que el artículo 8 prohíbe | Separar urgentes (desactivar, cancelar, encender el filtro) de no urgentes (añadir exclusión, bajar tope), que piden presencia; riesgo residual declarado |
| N3 | MENOR | Falta cómo conoce el dueño la dirección auténtica del repositorio y de dónde sale la lista de versiones retiradas | Criterio de T-1; la lista sale del repositorio |

## Vuelta 3: APTO CON CONDICIONES, sin bloqueantes

N1 y N2 resueltos; que el agente con navegador pueda hacer una urgente es riesgo residual aceptable (solo detiene). Hallazgos nuevos:

| N.º | Gravedad | Hallazgo | Corrección |
| --- | --- | --- | --- |
| M-1 | MAYOR | El aviso de cambio pendiente llega a la cuenta donde trabaja el agente, que puede archivarlo y dejar que el cambio tenga efecto a las 24 h | Aviso fuera del alcance del agente o, si no, toda alteración que no haga el dueño impide el cambio; si ni eso, no hay camino pendiente; prueba en CA-017; T-2 |
| M-2 | MAYOR | Sin definir qué pasa con un cambio pendiente si el estado cambia durante el plazo | Toda urgente (y siempre desactivar) anula los pendientes relajantes; se reevalúa al tener efecto; entre pendientes del mismo ajuste prevalece el restrictivo; pruebas en CA-018 |
| m-1 | MENOR | Fatiga de presencia | Límite de peticiones; rechazadas agrupadas en historial y resumen |
| m-2 | MENOR | Aviso falsificado hacia una página falsa | El aviso dice que cancelar nunca pide contraseña |
| m-3 | MENOR | El plazo vence sin que el dueño lo haya visto | No vence antes de que un resumen diario lo incluya |
| m-4 | MENOR | Instalación pendiente sobre una versión retirada durante el plazo | Reevaluar integridad y retiradas al tener efecto |
| m-5 | MENOR | El agente avisa antes al dueño de que ignore el aviso; cancelación repetida de pendientes legítimos | El aviso dice que el asistente nunca necesita cambiar esto; riesgo residual lo nombra |

No comprobado: presencia nominativa, titular frente a delegado y aviso fuera del conector del agente en Gmail y Outlook (VERIFICAR, T-2).

## Vuelta 4: APTO CON CONDICIONES, sin bloqueantes ni MAYOR

M-1, M-2, m-1 a m-5 y N3 resueltos. El camino «cambio pendiente» es coherente con el requisito 8 de la 016 y el agente no puede relajar nada por él. P0 abierta el 21/11/2026 por delegación D-036. Los MENOR siguientes pasan al diseño como **condiciones vinculantes**:

| N.º | Condición para el diseño |
| --- | --- |
| R-1 | Al vencer, un pendiente restrictivo (añadir exclusión, bajar tope) se aplica si sigue sin ser menos restrictivo que el estado actual; solo los relajantes se anulan al cambiar el estado. Toda cancelación o anulación figura en el resumen siguiente, con su motivo. El riesgo residual nombra el caso del agente que cancela una restricción que el dueño quería. Prueba en CA-018 |
| R-2 | La constancia de «hecha por el dueño» solo vale si viene de una fuente que el agente no pueda escribir. Si la lectura normal del dueño no se distingue de una alteración, esa plataforma cae en «solo nominativa» y no se exime ninguna alteración (tampoco «marcar leído»). Pregunta nueva en T-2 |
| R-3 | Tope diario de peticiones de presencia (por ejemplo, 10) además de las 3 por hora; el cupo agotado se ve en la vía protegida y en el resumen; las urgentes nunca quedan afectadas. Variante en CA-004 |
| R-4 | «Estado» de un pendiente = el ajuste afectado y los que condicionan su efecto (activación, filtro, topes, exclusiones, versión y huella). Las esperas no cuentan |
| R-5 | En la 016 (propuesta P-15 en su `propuestas.md`): si la plataforma ni protege el aviso de envío ni detecta que se ha alterado, esa plataforma no ofrece envío sin revisión |
