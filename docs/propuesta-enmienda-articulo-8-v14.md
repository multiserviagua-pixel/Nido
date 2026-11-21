# Propuesta de enmienda del artículo 8 · versión 1.4

**Estado: RATIFICADA, versión 1.4 (21/11/2026, D-038).** El responsable aprobó expresamente el texto del auditor ajustado a sus respuestas («Solo a quien ya escribí», «las 2 pero con un activador en configuraciones con alerta del riesgo que implica», «Envío diferido 15 min», «Sí, apruebo la 1.4»). El texto aplicado está en `docs/CONSTITUCION.md` y en el apartado «Texto ratificado» al final.

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

## Texto propuesto (1.4, borrador de la coordinación, sustituido: tenía 2 bloqueantes)

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

## Dictamen del auditor-seguridad (21/11/2026)

**Veredicto: APTO CON CONDICIONES, con 2 bloqueantes sobre el borrador de la coordinación.** El H2 deja de ser bloqueante si el responsable acepta por escrito el riesgo que describe.

| N.º | Gravedad | Hallazgo |
| --- | --- | --- |
| H1 | BLOQUEANTE (arts. 3, 7 y 13) | El borrador promete exclusiones por asunto «fijadas en su código», pero reclamaciones y temas personales o médicos solo los distingue el modelo, que puede ser engañado. Además, deja que el modelo coautorice el envío. Corrección: el código excluye por remitente (dominios en el código) y el modelo excluye por asunto, solo para impedir |
| H2 | BLOQUEANTE salvo aceptación expresa | Sin lista, cualquier desconocido con un dominio propio autenticado puede provocar respuestas con datos de otros correos del cliente. Y un servidor comprometido haría responder a todos. Control: enviar solo a direcciones a las que el propio dueño ya ha escrito antes, comprobado en sus enviados. Sigue siendo el modelo B, porque el dueño no mantiene ninguna lista |
| H3 | MAYOR | Hay que definir «autenticado»: autenticación alineada con el dominio que añade el proveedor de correo del cliente |
| H4 | MAYOR | El borrador no fija lo mínimo del filtro. Hay que aclarar si el responsable quiso quitar el bloqueo de enlaces y datos; si lo quitó, es bloqueante |
| H5 | MAYOR | Los topes, con un máximo en el código que el dueño puede bajar y no subir |
| H6 | MENOR | El resumen diario se queda solo en la cuenta del dueño, sin que el agente pueda ocultarlo |
| H7 | MENOR | Recuperar «fijada a una versión» y añadir las amenazas de la compuerta a `docs/SEGURIDAD.md` |
| H8 | MENOR | Interruptor con cierre en fallo, correcto: la consulta no lleva datos del correo y cualquier respuesta distinta de «seguir» detiene el envío |

### Redacción recomendada por el auditor (1.4)

> 8. **Límites del agente en su anfitrión.** Lo que el agente del cliente no puede hacer (enviar, borrar, compartir) se impide en los permisos de los conectores del cliente y se repite en su arranque local. Nada de lo que entregue el servidor puede relajarlo. El único envío sin revisión admitido lo decide una compuerta de código, versionada en el repositorio, instalada en la cuenta del cliente fijada a una versión y apagada hasta que el dueño la activa, nunca el agente ni el servidor. La compuerta solo envía una respuesta en texto plano, en el mismo hilo y con un único destinatario, al remitente del último correo recibido, cuando el proveedor de correo del cliente lo ha autenticado con alineación de dominio y el propio dueño ha escrito antes a esa dirección exacta; construye ella el mensaje sin adjuntos, enlaces, direcciones, números de cuenta ni documentos de identidad, y ante cualquier condición no comprobada no envía. Nunca responde a remitentes automáticos, a los organismos públicos y bancos que fija su código ni a quien excluya el dueño, y no supera los topes de su código, que el dueño puede bajar y no subir. Lo que aporta el modelo (borrador, marca o categoría) solo puede impedir un envío; las exclusiones por asunto, como mínimo reclamaciones y asuntos personales o médicos, las aplica el modelo y nunca autorizan. Ni el agente ni el servidor pueden activar la compuerta ni cambiar su código, exclusiones, filtros o topes; el servidor solo puede desactivarla, y el dueño también, en cualquier momento. La compuerta deja cada día al dueño, solo en su propia cuenta, el resumen de lo enviado.

**Riesgo residual (en palabras del auditor).** Si a alguien con quien ya te escribes le roban el correo, o un mensaje bien preparado engaña a la IA, la compuerta puede mandar en tu nombre, sin que lo veas antes, un texto que cuente cosas de tus correos o prometa algo que no querías. Te enterarás en el resumen del día siguiente. Si no aceptas lo de «solo a quien ya le has escrito», eso mismo lo puede conseguir cualquier desconocido.

**Controles que recomienda volver a ofrecer, del más eficaz al menos:**
1. Solo a quien el dueño ya ha escrito.
2. Envío diferido de 15 minutos con aviso y opción de cancelar.
3. Topes bajos: 1 por hilo y 10 al día por cuenta.
4. No enviar si el texto contiene importes.
5. Resumen diario (ya elegido).

**Condiciones si se ratifica:**
- **016:** el REQ-001 lleva el contacto previo, sin contar los envíos de la compuerta. Se mantienen el REQ-004 y los REQ-016 a REQ-023. Una categoría ausente, múltiple o desconocida no envía. El resumen lleva su requisito y su prueba. La batería incluye desconocidos con dominio propio autenticado y contactos previos suplantados.
- **017:** activar, desactivar y excluir, protegido contra peticiones falsificadas. Las exclusiones del dueño quedan fuera del alcance del agente.
- **018:** el aprendizaje de los 100 correos se queda en la cuenta del cliente y solo produce estilo. No crea autorizaciones. Lleva una batería de envenenamiento.
- **Documentos:** `docs/SEGURIDAD.md` y `docs/TECNOLOGIAS.md`.

**Sin comprobar:** si Apps Script y Outlook permiten leer la autenticación que añade el proveedor, buscar en enviados y guardar el estado fuera del alcance del agente (VERIFICAR).


## Segunda vuelta del auditor-seguridad y texto ratificado (21/11/2026)

El responsable pidió mantener el filtro de enlaces y datos con un activador en la configuración y aviso del riesgo, y añadir el envío diferido de 15 minutos. **Veredicto de la segunda vuelta: sin bloqueantes.** El texto plano, el mismo hilo, el único destinatario y la ausencia de adjuntos no se pueden desactivar. Un MENOR, incorporado al texto: el filtro se apaga por la vía protegida y el resumen diario lo indica mientras esté apagado.

**Condiciones nuevas para la 016:**
- El filtro está activo por defecto, e instalar, reinstalar o actualizar la compuerta lo vuelve a activar.
- El historial y el resumen indican el filtro apagado, con su fecha.
- Espera de 15 minutos con aviso, cancelable solo por el dueño. El agente no puede cancelarla ni archivando el aviso.
- Al terminar la espera, la compuerta vuelve a comprobar todas las condiciones, también el interruptor de HumanaIA, y si no puede comprobarlas no envía.
- Pruebas de cero envíos con el filtro apagado desde el agente, el servidor o un enlace preparado, y de cero envíos si el dueño cancela o desactiva durante la espera.

**Condiciones nuevas para la 017:**
- El ajuste del filtro está solo en la configuración protegida: dueño autenticado, protección contra peticiones falsificadas y sin enlaces con parámetros.
- El aviso es accesible y se confirma de forma expresa. Apagar y encender el filtro queda en el historial.
- Encenderlo tiene efecto inmediato.

Sin comprobar: si Apps Script y Outlook permiten mantener ese ajuste fuera del alcance de los conectores del agente (VERIFICAR).

### Texto ratificado (1.4)

> 8. **Límites del agente en su anfitrión.** Lo que el agente del cliente no puede hacer (enviar, borrar, compartir) se impide en los permisos de los conectores del cliente y se repite en su arranque local. Nada de lo que entregue el servidor puede relajarlo. El único envío sin revisión admitido lo decide una compuerta de código, versionada en el repositorio, instalada en la cuenta del cliente fijada a una versión y apagada hasta que el dueño la activa, nunca el agente ni el servidor. La compuerta solo envía una respuesta en texto plano, en el mismo hilo y con un único destinatario, al remitente del último correo recibido, cuando el proveedor de correo del cliente lo ha autenticado con alineación de dominio y el propio dueño ha escrito antes a esa dirección exacta; construye ella el mensaje sin adjuntos y, salvo que el propio dueño desactive ese filtro por la vía protegida de su configuración, después de ver un aviso del riesgo, y mientras esté desactivado lo indique el resumen diario, sin enlaces, direcciones, números de cuenta ni documentos de identidad; ante cualquier condición no comprobada no envía. Nunca responde a remitentes automáticos, a los organismos públicos y bancos que fija su código ni a quien excluya el dueño, y no supera los topes de su código, que el dueño puede bajar y no subir. Lo que aporta el modelo (borrador, marca o categoría) solo puede impedir un envío; las exclusiones por asunto, como mínimo reclamaciones y asuntos personales o médicos, las aplica el modelo y nunca autorizan. Ni el agente ni el servidor pueden activar la compuerta, desactivar sus filtros ni cambiar su código, exclusiones o topes; el servidor solo puede desactivar la compuerta, y el dueño también, en cualquier momento. La compuerta deja cada día al dueño, solo en su propia cuenta, el resumen de lo enviado.
