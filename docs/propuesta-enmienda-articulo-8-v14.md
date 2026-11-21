# Propuesta de enmienda del artículo 8 · versión 1.4

**Estado: PROPUESTA, sin ratificar.** Rige la constitución 1.3. Solo el responsable puede enmendarla (artículo 14), y lo hace aprobando expresamente este texto.

- **Redacta:** la coordinación, por instrucción expresa del responsable. Fecha: 21/11/2026.
- **Dictamen:** del `auditor-seguridad`, en el apartado «Dictamen» al final.

## Por qué

Al responder a las cuestiones de la función 016, el responsable pidió el comportamiento de NestAdmin 2: «Debe aprender a responder y responder por sí solo, menos a correos de organismos públicos, bancos, reclamaciones, temas personales o médicos».

Se le presentaron dos modelos:

- **A.** Lista de remitentes aprendida y confirmada por el dueño. Cabe en la 1.3.
- **B.** Responder a cualquier remitente salvo las categorías excluidas, sin lista.

Eligió **B: responde a todos salvo excluidos**. Además pidió dos cosas:

- Que el agente aprenda de los 100 últimos correos enviados y recibidos.
- Como control añadido, un resumen diario al dueño de lo enviado solo.

La 1.3 no lo admite por dos razones:

- Exige que la dirección exacta del remitente figure en una regla creada por el dueño.
- Dice que la clasificación del modelo «solo puede impedir un envío, nunca autorizarlo».

## Texto vigente (1.3)

> 8. **Límites del agente en su anfitrión.** Lo que el agente del cliente no puede hacer (enviar, borrar, compartir) se impide en los permisos de los conectores del cliente y se repite en su arranque local. Nada de lo que entregue el servidor puede relajarlo. El único envío sin revisión admitido lo decide una compuerta de código, versionada en el repositorio e instalada en la cuenta del cliente, nunca el agente ni el servidor. La compuerta solo envía una respuesta en el mismo hilo al remitente autenticado del último correo recibido, cuya dirección exacta figura en una regla que el dueño ha creado; construye ella el mensaje sin adjuntos ni destinatarios añadidos, y ante cualquier condición no comprobada no envía. La clasificación del modelo solo puede impedir un envío, nunca autorizarlo. Ni el agente ni el servidor pueden crear, cambiar ni activar reglas o compuerta; el servidor solo puede desactivarla, y el dueño también, en cualquier momento.

## Texto propuesto (1.4, borrador de la coordinación, pendiente de dictamen)

> 8. **Límites del agente en su anfitrión.** Lo que el agente del cliente no puede hacer (enviar, borrar, compartir) se impide en los permisos de los conectores del cliente y se repite en su arranque local. Nada de lo que entregue el servidor puede relajarlo. El único envío sin revisión admitido lo decide una compuerta de código, versionada en el repositorio e instalada en la cuenta del cliente, nunca el agente ni el servidor, y solo mientras el dueño la tenga activada. La compuerta solo envía una respuesta en el mismo hilo al remitente autenticado del último correo recibido; construye ella el mensaje sin adjuntos ni destinatarios añadidos, y ante cualquier condición no comprobada no envía. Nunca envía a remitentes o asuntos de las exclusiones fijadas en su código (como mínimo organismos públicos, bancos, reclamaciones y asuntos personales o médicos) ni a los que el dueño excluya, y respeta sus topes. La clasificación del modelo puede impedir un envío; para autorizarlo hace falta además que el remitente supere la autenticación y que el texto pase los filtros del código. Ni el agente ni el servidor pueden activar la compuerta ni cambiar sus exclusiones, filtros o topes; el servidor solo puede desactivarla, y el dueño también, en cualquier momento. El dueño recibe cada día, dentro de su cuenta, el resumen de lo que la compuerta ha enviado.

## Qué cambia respecto de la 1.3

| Punto | 1.3 | 1.4 propuesta |
| --- | --- | --- |
| A quién se responde | Solo a direcciones exactas de reglas creadas por el dueño | A cualquier remitente autenticado, salvo exclusiones |
| Papel de la clasificación del modelo | Solo impide | Impide, y autoriza junto con la autenticación y los filtros del código |
| Reglas del dueño | Obligatorias (función 017) | Pasan a ser exclusiones del dueño; la 017 se reduce a activar, desactivar, excluir y ver el historial |
| Control nuevo | — | Resumen diario al dueño, dentro de su cuenta |
| Lo que no cambia | El agente nunca envía; la compuerta es código del repositorio en la cuenta del cliente; mismo hilo, remitente autenticado, sin adjuntos ni destinatarios añadidos; el servidor solo desactiva; cierre en fallo | Igual |

## Efecto en otras piezas si se ratifica

- **016:** reescribir REQ-001, REQ-002 y REQ-019. El rodaje por regla se sustituye por el aprendizaje inicial (cuestión 2). Requisito nuevo del resumen diario.
- **017:** se reduce a activar y desactivar, gestionar las exclusiones del dueño, consultar el historial e instalar la compuerta.
- **018:** aprendizaje de estilo y respuestas a partir de los 100 últimos correos enviados y recibidos, en la cuenta del cliente.
- **Otras piezas:**
  - ADR-0004, punto 6.
  - `docs/SEGURIDAD.md`: amenazas y rutas críticas.
  - `docs/TECNOLOGIAS.md`: D-037 enmendada por una decisión nueva.
  - `marketing/`: no prometer el envío hasta que la 016 esté cerrada.

## Dictamen del auditor-seguridad

Pendiente.
