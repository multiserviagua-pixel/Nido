# 042 · Estado de la suscripción y acceso al portal de pago en el panel de cliente

Estado: PROPUESTA
Fase: 5 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Cada cliente de HumanaIA paga una suscripción con Stripe, y si deja de pagar su agente puede acabar suspendido (ADR-0006). Hoy el cliente no tiene un sitio donde ver si su suscripción está al día, qué fecha le importa ni qué hacer si hay un pago pendiente. Esta función le da, dentro de su panel, una página «Suscripción» que le dice con palabras el estado de su suscripción, las fechas que necesita y qué puede hacer, un acceso a su portal de pago de Stripe y un aviso cuando hay un pago pendiente, también en el Resumen.

El panel no cobra, no emite facturas y no guarda datos de pago (ADR-0006, T-014): todo eso ocurre en Stripe. Cómo llega el estado desde Stripe, cuándo se suspende la licencia y qué datos de cobro existen lo define la función 050 (fase 6). Esta función especifica solo lo que el cliente ve y puede hacer sobre esos datos, sin que vea nada de otro cliente ni datos internos de HumanaIA, y sin decirle nada que no sea verdad.

## Quién la usa y cómo

- Como **usuario de un cliente**, quiero ver si mi suscripción está al día y qué fecha me importa, para saber si tengo que hacer algo.
- Como **usuario de un cliente con un pago pendiente**, quiero enterarme en cuanto entro en el panel y llegar al portal de pago en pocos pasos, para regularizarlo antes de que mi agente deje de funcionar.
- Como **usuario de un cliente con el agente suspendido por impago**, quiero poder llegar a mi portal de pago, para volver a ponerlo en marcha.
- Como **responsable de HumanaIA**, quiero que esté demostrado que nadie ve ni abre el cobro de otro cliente, ni ve identificadores de Stripe ni decisiones internas, para poder publicar el panel.

## Supuestos sobre la fase 6

Esta especificación se apoya en la función 050 (PROPUESTA) y supone que, cuando esté cerrada:

1. Para el cliente de la sesión existen, en solo lectura: el estado de su suscripción en Stripe (uno de los ocho de T-015), el fin del periodo en curso, el fin de la gracia cuando la hay y el acceso a su portal de Stripe (función 050, apartado «Información disponible»).
2. El acceso al portal se obtiene en el momento de pedirlo, no se guarda ni se reutiliza, y el cliente al que corresponde se deriva de la sesión (función 050, apartado «Cobro y portal»).
3. El estado efectivo de la licencia (activa o suspendida) sigue las reglas de cobro, estado manual y modo observación de la función 050, y es el mismo que la función 041 muestra en el Resumen.
4. Qué se puede hacer dentro del portal (cambiar medio de pago, cancelar, pausar) lo fija la configuración del portal de la fase 6 (cuestión abierta 10 de la función 050).

Si alguno de estos supuestos cambia, esta especificación se revisa.

## Requisitos

Cada requisito dice qué, no cómo. Los textos finales, la disposición y los componentes son del diseño, con el sistema de la fase 3.

### Página Suscripción: estado, fechas y qué hacer

| ID | Requisito |
| --- | --- |
| REQ-001 | La página «Suscripción», dentro del marco del panel de la función 040, muestra el estado de la suscripción del cliente de la sesión como exactamente uno de los estados visibles de REQ-002, dicho con palabras y con una explicación breve de lo que significa para su servicio. El color, si se usa, acompaña a la palabra y nunca la sustituye. |
| REQ-002 | Cada situación de cobro del cliente se corresponde con un único estado visible de la lista cerrada «Estados visibles propuestos» (debajo de esta tabla). No existe ningún otro estado visible y ninguna situación queda sin estado visible. Los nombres de la lista son de trabajo; el texto final es del diseño. La lista está pendiente de confirmación (cuestión abierta 6). |
| REQ-003 | El cliente nunca ve los códigos de estado de Stripe ni ningún nombre interno de estado, en la página, en el aviso ni en los mensajes de error. |
| REQ-004 | Cuando el estado visible lo admite, la página muestra la fecha que el cliente necesita: el fin del periodo de prueba en «en prueba»; el fin del periodo en curso en «al día», presentada como fecha de renovación solo si se sabe que la suscripción se renovará y, si no se sabe, como fin del periodo en curso (cuestión abierta 9); y el fin de la gracia en «pago pendiente», según REQ-007 y la cuestión abierta 3. Las fechas siguen el formato de `docs/DISENO.md` en hora de Madrid. Si una fecha que corresponde mostrar no está disponible, se dice que no está disponible; nunca se calcula ni se estima. |
| REQ-005 | Para cada estado visible, la página dice qué puede hacer el cliente a continuación: abrir su portal de pago (si REQ-010 lo permite), contactar con HumanaIA por la vía que fije la cuestión abierta 7, o nada. No se muestra ningún dato de contacto que no haya fijado el responsable. |

#### Estados visibles propuestos

Lista cerrada propuesta para REQ-002. Su confirmación es la cuestión abierta 6. Cómo se presentan el estado manual forzado y el modo observación lo deciden las cuestiones abiertas 4 y 5, siempre dentro de REQ-006 a REQ-008.

| Estado visible (nombre de trabajo) | Situación de cobro | Qué significa para el cliente |
| --- | --- | --- |
| En prueba | `trialing` | Está en periodo de prueba; el servicio funciona |
| Al día | `active` | La suscripción está pagada; el servicio funciona |
| Pago pendiente | `past_due` con la gracia sin vencer | Un cobro no se ha podido hacer; hay un plazo para regularizarlo |
| Impago | `unpaid`, o `past_due` con la gracia vencida | El plazo para regularizar ha terminado sin pago |
| Alta sin completar | `incomplete`, `incomplete_expired` | El primer pago de la suscripción no se ha completado |
| Pausada | `paused` | La suscripción está en pausa en Stripe |
| Cancelada | `canceled` | La suscripción ha terminado |
| Sin suscripción registrada | No hay suscripción de Stripe vinculada al cliente | Su suscripción no se gestiona por el panel (cuestión abierta 1) |
| No disponible | Estado fuera de la lista de T-015, datos incompletos, fallo al obtenerlos o datos más antiguos de lo admitido (cuestión abierta 10) | Ahora no se puede saber el estado; no es un juicio sobre el pago |

### Veracidad y coherencia

| ID | Requisito |
| --- | --- |
| REQ-006 | La página y el aviso nunca muestran un estado más favorable que el que respaldan los datos: «en prueba» y «al día» solo se muestran si el estado de la suscripción se obtuvo correctamente y está dentro de la antigüedad admitida (cuestión abierta 10). Ante cualquier duda, el estado visible es «no disponible». |
| REQ-007 | La página y el aviso solo anuncian una suspensión futura (una fecha o una advertencia de que el agente dejará de funcionar) cuando, con las condiciones de ese momento, la suspensión ocurriría de verdad por el cobro: el modo observación está desactivado y la licencia sigue al cobro, sin estado manual forzado. Si no se cumple, no se anuncia ninguna suspensión. Qué se muestra en su lugar lo deciden las cuestiones abiertas 3, 4 y 5. |
| REQ-008 | Lo que la página y el aviso dicen sobre el funcionamiento del agente coincide con el estado efectivo de su licencia y con lo que muestra el Resumen de la función 041 en el mismo momento: nunca se dice que el agente está suspendido si su licencia está activa, ni que funciona si está suspendida. |
| REQ-009 | Los datos que se muestran son los del momento en que se carga la página. Al volver del portal de pago, la página vuelve a obtener los datos y no da por hecho ningún cambio hecho en Stripe (un pago, un cambio de medio de pago, una cancelación) hasta que los datos lo reflejen. Puede decir que los cambios hechos en Stripe tardan en aparecer, sin prometer un plazo distinto del que fije la función 050. |

### Acceso al portal de pago

| ID | Requisito |
| --- | --- |
| REQ-010 | La página ofrece la acción de ir al portal de pago de Stripe cuando el cliente de la sesión tiene una suscripción de Stripe vinculada y el usuario tiene permiso para abrirlo (cuestión abierta 2), también cuando el agente está suspendido por impago. En los demás casos la acción no se ofrece y la página dice qué hacer en su lugar (REQ-005). |
| REQ-011 | El portal que se abre es siempre el del cliente de la sesión. La acción no acepta como entrada ningún identificador de cliente, de suscripción ni de Stripe, ni una dirección de vuelta; si llega alguno, no altera el resultado. |
| REQ-012 | El acceso al portal se pide en el momento de pulsar la acción, cada vez (función 050). El panel no lo muestra como texto, no lo guarda, no lo pone en sus propias direcciones de página y no lo anota en registros, supervisión ni mensajes de error. |
| REQ-013 | La acción indica, antes de pulsarla y también para lectores de pantalla, que lleva a una página de Stripe fuera del panel. |
| REQ-014 | La vuelta desde el portal lleva únicamente a la página «Suscripción» del panel, en el mismo entorno. La dirección de vuelta la fija el servidor; nada que envíe el navegador la cambia. |
| REQ-015 | Mientras se obtiene el acceso, la acción muestra que está en curso y no se puede lanzar otra vez desde la misma página. Si el acceso no se obtiene en el tiempo máximo propuesto de 10 segundos (cuestión abierta 12), se muestra un error con forma de reintentar. |
| REQ-016 | Cada usuario puede pedir como mucho 10 accesos al portal por hora (valor propuesto; cuestión abierta 12). Por encima del límite no se pide ningún acceso a Stripe y se dice cuánto esperar. |
| REQ-017 | Cada petición de acceso al portal deja un evento de seguridad con fecha, identificador interno del usuario y resultado (concedido, denegado, límite superado o error). El evento no contiene identificadores de Stripe, el acceso obtenido, direcciones de Stripe ni datos de pago. |
| REQ-018 | Pedir y usar el acceso al portal no cambia ningún dato de HumanaIA: ni la licencia, ni el estado de cobro guardado, ni las órdenes del agente. Desde el panel de cliente no se da ninguna orden al agente. Lo que cambie en Stripe llega al panel solo por la vía de la función 050. |

### Aviso de pago pendiente

| ID | Requisito |
| --- | --- |
| REQ-019 | Cuando el estado visible es «pago pendiente» o «impago» (y en los demás estados que decida la cuestión abierta 3), se muestra un aviso en la página «Suscripción» y en el hueco que la función 041 reserva en el Resumen. El aviso dice qué pasa y qué puede hacer el cliente, y lleva a la página «Suscripción». Cumple REQ-003 y REQ-006 a REQ-008. La fecha de fin de gracia y la insistencia del aviso las decide la cuestión abierta 3. |
| REQ-020 | El aviso no bloquea el resto de la página ni es una ventana que haya que cerrar para seguir. Los lectores de pantalla lo anuncian al cargar la página sin mover el foco, y se distingue sin depender del color. |
| REQ-021 | El aviso del Resumen y el estado de la página «Suscripción» se basan en los mismos datos: en el mismo momento, nunca uno muestra un pago pendiente y el otro no. El aviso deja de mostrarse en la primera carga posterior a que el estado visible deje de ser uno de los que lo activan. |

### Cliente sin suscripción registrada

| ID | Requisito |
| --- | --- |
| REQ-022 | Para un cliente sin suscripción de Stripe vinculada (por ejemplo, porque se le cobra fuera de Stripe o porque la fase 6 aún no está en marcha), el panel se comporta según la cuestión abierta 1. En cualquier opción: no se ofrece el portal, no hay aviso de pago, no se muestra «al día» ni se anuncia ninguna suspensión, y no se presenta como un error. |

### Estados de la vista, móvil, accesibilidad y textos

| ID | Requisito |
| --- | --- |
| REQ-023 | La página «Suscripción» tiene los estados obligatorios de `docs/DISENO.md`: carga (sin mostrar ningún estado de suscripción provisional), vacío (el cliente sin suscripción registrada, REQ-022), error (qué ha pasado y cómo reintentar, sin mostrar ningún estado de suscripción), sin permiso (el de la función 040) y datos parciales (el estado se conoce y falta alguna fecha: se muestra el estado y se dice qué dato falta). |
| REQ-024 | Un fallo al obtener el acceso al portal no cambia lo que la página muestra sobre la suscripción. El mensaje dice qué ha pasado y qué puede hacer el cliente (reintentar más tarde o contactar por la vía de la cuestión abierta 7), sin datos internos. |
| REQ-025 | La página, la acción del portal y el aviso cumplen WCAG 2.2 AA: uso completo con teclado, foco visible, orden de foco lógico, contraste mínimo de `docs/DISENO.md`, nada solo por color, y el foco no se pierde al mostrar un error o al volver del portal. |
| REQ-026 | La página, la acción del portal y el aviso se usan en móvil: sin desplazamiento horizontal desde 320 píxeles de ancho ni con el texto al 400 %, y objetivos táctiles de al menos 24 por 24 píxeles. |
| REQ-027 | Todos los textos están en español de España, con trato de tú y sin jerga técnica ni términos de Stripe. Fechas y números con el formato de `docs/DISENO.md`. Cada mensaje de error dice qué ha pasado y qué se puede hacer, sin datos internos. |
| REQ-028 | El contenido principal de la página «Suscripción» se muestra en menos de 2,5 segundos en el percentil 75, en móvil con red 4G simulada (valor propuesto; cuestión abierta 12). |

### Aislamiento y privacidad

| ID | Requisito |
| --- | --- |
| REQ-029 | El cliente cuyos datos de suscripción se muestran y cuyo portal se abre se deriva siempre de la sesión del usuario (artículo 2). La página y la acción del portal no muestran ni actúan sobre nada de otro cliente. |
| REQ-030 | Con su propia sesión, por la interfaz o pidiéndolo directamente a la API de datos, un usuario de cliente solo obtiene, sobre el cobro, los datos de su propio cliente que esta función muestra (estado de la suscripción, fin del periodo en curso y fin de la gracia, según lo que decidan las cuestiones abiertas 3 a 5). No obtiene identificadores de Stripe, el estado manual de la licencia ni si está forzado, el estado del modo observación, la duración de la gracia como parámetro, la fecha de la última relectura en Stripe, alertas, eventos de Stripe ni ningún otro dato interno de HumanaIA (artículos 1 y 2). |
| REQ-031 | La página no muestra ni permite obtener datos de tarjeta ni de cuenta bancaria, correo o nombre de facturación, dirección, importes, facturas, recibos ni justificantes, salvo lo que decidan las cuestiones abiertas 8 y 11 dentro de ADR-0006 y T-014. El panel no emite ni muestra facturas. |
| REQ-032 | Ningún identificador de Stripe, acceso al portal ni dato de pago aparece en las direcciones de página del panel, en los registros del servidor, en la supervisión de errores, en los mensajes de error ni en las evidencias de prueba (artículos 1 y 4). |
| REQ-033 | Las respuestas de Stripe son datos no confiables (artículo 7): ningún texto que devuelva Stripe, incluidos sus mensajes de error, se muestra al cliente ni se anota; un error de Stripe solo cambia qué mensaje propio del panel se muestra. |

## Casos negativos

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-034 | Identificador de otro cliente, de una suscripción o de un cliente de Stripe, o una dirección de vuelta, añadido a mano en la dirección, los parámetros, el cuerpo o las cabeceras de la página o de la acción del portal | No cambia nada: se muestran los datos y se abre el portal del cliente de la sesión, o ninguno. La respuesta es idéntica tanto si el identificador corresponde a un cliente existente como si no. Su valor no queda en ningún registro |
| REQ-035 | Petición directa a la API de datos con la sesión del usuario pidiendo la suscripción de otro cliente, o campos de la suscripción o de la licencia no permitidos por REQ-030 | 0 datos de otro cliente y 0 datos no permitidos. La respuesta no distingue «existe pero no es tuyo» de «no existe» |
| REQ-036 | Petición de acceso al portal con campos de más (cliente, rol, configuración del portal, dirección de vuelta) | Los campos ajenos no tienen efecto. Sus nombres y valores no se registran |
| REQ-037 | Usuario de un cliente sin suscripción vinculada que pide el acceso al portal llamando directamente a la acción | No obtiene acceso a ningún portal y no se crea nada en Stripe ni en HumanaIA. Respuesta genérica, sin decir si existe suscripción en Stripe |
| REQ-038 | Usuario sin permiso para abrir el portal (si la cuestión abierta 2 lo limita) que lo pide llamando directamente a la acción | Se rechaza sin pedir nada a Stripe. Ocultar el botón no cuenta como control |
| REQ-039 | Usuario al que se retira el acceso con la página abierta, que pulsa la acción del portal o recarga | No obtiene acceso al portal ni datos de suscripción. Ve «sin permiso» o la pantalla de entrada (función 040) |
| REQ-040 | Sesión caducada al pulsar la acción del portal | No se pide acceso al portal. Se pide entrar de nuevo y, tras entrar, se vuelve a la página «Suscripción» sin abrir el portal automáticamente |
| REQ-041 | Doble pulsación, varias pulsaciones seguidas, o la acción lanzada a la vez desde dos pestañas | Cada pulsación aceptada produce como mucho un acceso, siempre al portal del cliente de la sesión; las peticiones cuentan para el límite de REQ-016. Ninguna combinación da acceso a otro cliente |
| REQ-042 | Stripe o su portal no responden, responden lento o devuelven error | Cierre en fallo (artículo 3): no se abre ningún portal, se muestra el error de REQ-024 antes del tiempo máximo de REQ-015, el estado de suscripción mostrado no cambia por el fallo, no se inventa un estado y no se muestra ningún texto de Stripe. Se puede reintentar |
| REQ-043 | Los datos de suscripción del cliente no se pueden obtener (la base de datos no responde o devuelve error) | Estado de error de REQ-023: no se muestra ningún estado de suscripción, tampoco «al día», no hay aviso y no se ofrece el portal |
| REQ-044 | Estado de suscripción fuera de la lista de T-015, datos incompletos o más antiguos de lo admitido (cuestión abierta 10) | Estado visible «no disponible». Nunca «al día» ni «en prueba», y no se anuncia ninguna suspensión |
| REQ-045 | El estado cambia mientras el cliente tiene la página abierta | La página no afirma nada sobre el cambio hasta la siguiente carga, que muestra el estado nuevo. La acción del portal sigue abriendo solo el portal del cliente de la sesión. El aviso desaparece o aparece en la siguiente carga según REQ-021 |
| REQ-046 | Vuelta desde el portal con la dirección de vuelta manipulada, con parámetros añadidos (por ejemplo, uno que diga que el pago se ha hecho) o sin cambios hechos en el portal | Solo se llega a la página «Suscripción» del panel; nunca se redirige a otro sitio. Los parámetros de la vuelta no cambian lo que se muestra: el estado sale solo de los datos (REQ-009) |
| REQ-047 | Acceso al portal reutilizado, compartido con otra persona, abierto desde el historial del navegador o caducado | No da acceso al portal (función 050). El panel no lo vuelve a ofrecer: hace falta pulsar de nuevo la acción con una sesión válida |
| REQ-048 | Cliente dado de baja | El acceso al panel lo decide la cuestión abierta 6 de la función 040. Si tiene acceso, ve el estado visible que corresponde a sus datos, sin anunciar suspensiones que no vayan a ocurrir, y el portal según REQ-010 y la cuestión abierta 9. Nunca ve datos de otro cliente |
| REQ-049 | Cliente con la licencia suspendida por impago | Puede llegar a la página «Suscripción» y abrir su portal para regularizar, aunque el resto del panel quede limitado por la función 040. La página dice que el agente está suspendido solo si su licencia efectiva lo está (REQ-008) |
| REQ-050 | Licencia con estado manual forzado, o modo observación activado | Nada de lo que recibe la sesión del cliente indica que hay un estado forzado ni que el modo observación está activo. Lo que se muestra es verdad y cumple REQ-006 a REQ-008; el detalle lo deciden las cuestiones abiertas 4 y 5 |
| REQ-051 | Página «Suscripción» cargada dentro de otra web, o acción del portal lanzada desde otro sitio | La página no se muestra dentro de la otra web. La acción lanzada desde otro sitio se rechaza sin pedir nada a Stripe |
| REQ-052 | Se supera el límite de accesos al portal de REQ-016 | No se pide nada a Stripe, se dice cuánto esperar y queda el evento de seguridad de REQ-017 |

## Criterios de aceptación

Todas las pruebas usan clientes ficticios y el modo de pruebas de Stripe o un sustituto que reproduzca sus respuestas; ningún dato real. «Automática» quiere decir una prueba que se ejecuta en CI. Los identificadores de Stripe de prueba y los datos de pago de prueba llevan valores marcados para poder buscarlos.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Automática. Para cada situación de la tabla «Estados visibles propuestos» (los 8 estados de Stripe, `past_due` con gracia vencida, sin suscripción, estado fuera de la lista, datos incompletos, datos antiguos y fallo al obtenerlos), la página muestra exactamente el estado visible esperado. Umbral: 100 % de las situaciones; 0 apariciones de códigos de estado de Stripe en la página, el aviso y los mensajes de error | REQ-001, REQ-002, REQ-003, REQ-044 |
| CA-002 | Automática. Para cada estado visible con fecha, la fecha mostrada coincide con la de los datos, en formato español y hora de Madrid; con la renovación desconocida no se presenta como renovación; sin la fecha en los datos, se dice que no está disponible y no aparece ninguna fecha calculada. Umbral: 100 % | REQ-004 |
| CA-003 | Revisión y automática. Cada estado visible tiene su siguiente paso; la acción del portal solo aparece donde REQ-010 lo permite; los datos de contacto mostrados coinciden con los fijados en la cuestión abierta 7 y no hay ninguno más. Umbral: 100 % de los estados | REQ-005, REQ-010 |
| CA-004 | Automática. Batería que combina los 8 estados de Stripe, gracia vencida o no, los 3 valores del estado manual y el modo observación activado y desactivado. Umbral: 0 combinaciones con «al día» o «en prueba» sin respaldo; 0 anuncios de suspensión cuando la suspensión no ocurriría; 100 % de coincidencia entre lo que dicen la página y el aviso sobre el agente y el estado efectivo de la licencia que muestra el Resumen de la función 041 | REQ-006, REQ-007, REQ-008 |
| CA-005 | Automática. Con la página abierta, se cambia el estado de la suscripción de prueba: la página no cambia hasta recargar y, al recargar, muestra el nuevo. Al volver del portal sin que los datos hayan cambiado, la página no afirma ningún cambio. Umbral: 100 % de 10 repeticiones | REQ-009, REQ-045 |
| CA-006 | Automática de extremo a extremo, en modo de pruebas de Stripe. Un usuario del cliente A pulsa la acción, llega al portal del cliente de Stripe de prueba de A (comprobado por su valor marcado), vuelve y aterriza en la página «Suscripción» de A. Antes de pulsar, la acción indica que lleva a Stripe. Reutilizar el acceso obtenido no da acceso. Umbral: 10 de 10 repeticiones | REQ-010, REQ-011, REQ-013, REQ-014, REQ-047 |
| CA-007 | Automática y revisión. Tras ejecutar todas las pruebas de la función, una búsqueda de los accesos al portal obtenidos en las direcciones de página registradas, lo guardado en el navegador, los registros del servidor, la supervisión de errores y los mensajes de error da 0 apariciones | REQ-012 |
| CA-008 | Automática. 10 pulsaciones seguidas producen como mucho 1 acceso mientras el primero está en curso; la acción lanzada desde 2 pestañas a la vez produce accesos solo al portal de A; 20 peticiones simultáneas producen 0 accesos a otro cliente y respetan el límite. Umbral: 100 % | REQ-015, REQ-041 |
| CA-009 | Automática. La petición número 11 de un usuario en una hora (o la que fije la cuestión abierta 12) no llega a Stripe, muestra cuánto esperar y deja 1 evento de seguridad. Pasada la ventana, se vuelve a obtener acceso. Umbral: 100 % | REQ-016, REQ-052 |
| CA-010 | Automática. Cada resultado de REQ-017 (concedido, denegado, límite superado, error) se provoca al menos una vez y deja exactamente 1 evento con fecha, usuario interno y resultado. Umbral: 0 eventos con identificadores de Stripe, accesos, direcciones de Stripe o datos de pago | REQ-017 |
| CA-011 | Automática. Se toma una foto de la licencia, el estado de cobro guardado y las órdenes del cliente A antes y después de todos los flujos de portal de las pruebas. Umbral: 0 diferencias, salvo los eventos de seguridad de REQ-017 | REQ-018 |
| CA-012 | Automática. Con «pago pendiente» e «impago» (y los estados que decida la cuestión abierta 3), el aviso aparece en la página «Suscripción» y en el Resumen y lleva a «Suscripción»; con «al día», «en prueba» y «sin suscripción registrada», no aparece en ninguno de los dos. Tras pagar en modo de pruebas, el aviso desaparece en la primera carga en que los datos reflejan el pago. Umbral: 100 % de los estados, y 0 momentos en que el Resumen y «Suscripción» discrepen | REQ-019, REQ-021 |
| CA-013 | Revisión manual con teclado y lector de pantalla: el aviso se anuncia al cargar sin mover el foco, no bloquea la página y se identifica en escala de grises. Umbral: 0 incumplimientos | REQ-020 |
| CA-014 | Automática. Un cliente sin suscripción vinculada ve lo que decida la cuestión abierta 1, sin acción de portal, sin aviso, sin «al día», sin anuncio de suspensión y sin estado de error. Una petición directa de acceso al portal de ese cliente da 0 accesos y 0 objetos creados en Stripe (comprobado en el modo de pruebas) y en HumanaIA. Umbral: 100 % | REQ-022, REQ-037 |
| CA-015 | Revisión. Hay capturas en escritorio y en móvil de los estados de carga, vacío, error, sin permiso y datos parciales de la página, y del error del portal. En la captura de carga y en la de error no aparece ningún estado de suscripción; en la del error del portal, el estado mostrado es el mismo que antes de pulsar | REQ-023, REQ-024 |
| CA-016 | Automática. Con Stripe simulado caído, lento (respuesta a los 30 segundos) y devolviendo error con un mensaje marcado: 0 portales abiertos, error mostrado antes del tiempo máximo de REQ-015 más 1 segundo, estado mostrado sin cambios, 0 apariciones del mensaje marcado en la página y en los registros. Al restablecerlo, el reintento abre el portal de A. Umbral: 100 % | REQ-015, REQ-024, REQ-033, REQ-042 |
| CA-017 | Automática. Con la base de datos simulada sin respuesta y con error: 0 estados de suscripción mostrados, 0 avisos y 0 accesos al portal concedidos; se muestra el estado de error con forma de reintentar. Umbral: 100 % | REQ-043 |
| CA-018 | La revisión automática de accesibilidad de la página, la acción del portal y el aviso da 0 incumplimientos graves o críticos, y la revisión manual con teclado y lector de pantalla da 0 incumplimientos de WCAG 2.2 AA, incluido que el foco no se pierde al mostrar un error ni al volver del portal. (Criterio de la fase 5: «Pasa la revisión de accesibilidad».) | REQ-025 |
| CA-019 | A 320 y 1280 píxeles de ancho y con el texto al 400 %, 0 casos de desplazamiento horizontal; 0 objetivos táctiles por debajo de 24 por 24 píxeles; la acción del portal se completa en un móvil real o emulado. (Criterio de la fase 5: «se usa en móvil».) | REQ-026 |
| CA-020 | Revisión de todos los textos de la función: 100 % en español de España con trato de tú; 0 términos técnicos ni de Stripe; cada error dice qué ha pasado y qué hacer, sin datos internos | REQ-027 |
| CA-021 | Medición en el entorno previo, en móvil con red 4G simulada: el contenido principal de la página «Suscripción» aparece en menos de 2,5 segundos (o el valor que fije la cuestión abierta 12) en el percentil 75 | REQ-028 |
| CA-022 | Automática de extremo a extremo, bloqueante en CI, con usuarios de los clientes ficticios A y B, cada uno con su suscripción de prueba. El usuario de A cambia direcciones de página; añade el identificador interno de B y los identificadores de Stripe de prueba de B en la dirección, los parámetros, el cuerpo y las cabeceras de la página y de la acción del portal; y llama directamente a la API de datos con su sesión pidiendo la suscripción de B. Umbral: 0 datos de B, 0 accesos al portal de B, y respuesta idéntica con los identificadores reales de B y con valores aleatorios. (Criterio de la fase 5: «No puede ver datos de otro cliente ni cambiando la URL o los identificadores».) | REQ-011, REQ-029, REQ-034, REQ-035 |
| CA-023 | Automática, bloqueante en CI. Con la sesión de un usuario de A, se recorren todas las tablas, vistas y funciones expuestas a la API de datos, obtenidas del esquema en el momento de la prueba y no de una lista fija, con A en estado manual forzado y el modo observación activado. Umbral: 0 apariciones de los identificadores de Stripe marcados de A o de B, del valor de estado manual, del estado del modo observación, de la duración de la gracia, de la fecha de última relectura, de alertas y de eventos de Stripe; solo aparecen los datos de cobro permitidos por REQ-030. (Criterio de la fase 5: «No ve [...] datos internos».) | REQ-030, REQ-035, REQ-050 |
| CA-024 | Automática y revisión. Con clientes de Stripe de prueba que llevan correo, nombre, dirección, IBAN y tarjeta de prueba con valores marcados, tras ejecutar todas las pruebas, una búsqueda de esos valores y de los identificadores de Stripe marcados en las páginas servidas, las respuestas de la API de datos a la sesión del cliente, las direcciones de página, los registros, la supervisión, los mensajes de error y la carpeta de evidencias da 0 coincidencias. La revisión confirma que la página no muestra importes, facturas ni justificantes salvo lo decidido en las cuestiones abiertas 8 y 11 | REQ-031, REQ-032, REQ-033 |
| CA-025 | Automática. Peticiones de acceso al portal con campos de cliente, rol, configuración y dirección de vuelta añadidos: 0 efectos y 0 apariciones de sus nombres o valores en los registros | REQ-036 |
| CA-026 | Automática. Si la cuestión abierta 2 limita quién abre el portal, un usuario de A sin ese permiso que llama directamente a la acción obtiene 0 accesos y 0 peticiones a Stripe. Umbral: 100 % de 10 intentos | REQ-038 |
| CA-027 | Automática. Con la página abierta, se retira el acceso al usuario y pulsa la acción: 0 accesos, ve «sin permiso» o la entrada. Con la sesión caducada, la pulsación da 0 accesos, pide entrar y, tras entrar, deja al usuario en «Suscripción» sin abrir el portal. Umbral: 100 % de 10 repeticiones de cada caso | REQ-039, REQ-040 |
| CA-028 | Automática. 5 vueltas con direcciones externas o de otro esquema y 3 con parámetros añadidos (incluido uno que diga que el pago se ha hecho): el 100 % termina en la página «Suscripción» de A, 0 redirecciones fuera del panel, y el estado mostrado es igual al de los datos | REQ-014, REQ-046 |
| CA-029 | Automática. Con la licencia de A suspendida por impago, el usuario de A llega a «Suscripción», abre su portal en modo de pruebas, paga y, cuando los datos lo reflejan, la página deja de mostrar el impago. Para un cliente dado de baja, el comportamiento coincide con lo decidido en la cuestión abierta 6 de la función 040 y con REQ-048. Umbral: 100 % | REQ-048, REQ-049 |
| CA-030 | Automática. La página «Suscripción» cargada dentro de una página de otro origen no se muestra; la acción del portal lanzada desde otro origen se rechaza con 0 peticiones a Stripe. Umbral: 100 % | REQ-051 |
| CA-031 | Todas las pruebas automáticas de los casos negativos están en verde en CI | REQ-034 a REQ-052 |

## Fuera de alcance

- Cómo llega el estado de la suscripción desde Stripe, el webhook, la relectura, el periodo de gracia, la suspensión y la reactivación de la licencia, el estado manual, el modo observación y la configuración del portal de Stripe (función 050, fase 6).
- Dar de alta una suscripción o iniciar el primer pago desde el panel (cuestión abierta 6 de la función 050).
- Emitir, numerar, guardar, mostrar o enviar facturas, recibos o justificantes (ADR-0006, T-014, B-001).
- Guardar o mostrar datos de tarjeta, de cuenta bancaria o de facturación. Cambiar el medio de pago, cancelar o pausar la suscripción: si se permite, ocurre en el portal de Stripe, no en el panel.
- Mostrar importes o el plan contratado, salvo lo que decida la cuestión abierta 8.
- Avisos de cobro por correo, de Stripe o de HumanaIA (cuestión abierta 7 de la función 050 y fase 4).
- Alta por invitación, inicio de sesión, recuperación, página «Cuenta», marco del panel, navegación, guardia de acceso y estado «sin permiso» (función 040). Qué partes del panel ve un cliente según el estado de su licencia (cuestión abierta 6 de la función 040), salvo lo que exige REQ-049.
- Las páginas Resumen y Actividad, el estado del agente y sus cifras, y el hueco del aviso en el Resumen (función 041). Esta función fija el contenido y las condiciones del aviso.
- La página de facturación del superadmin (fase 3).
- Cualquier cambio de la licencia o cualquier orden al agente desde el panel de cliente.
- Textos legales y condiciones de contratación (función 052) y migración de los clientes actuales (función 053).

## Cuestiones abiertas

Se resuelven en `aclaraciones.md`. Ninguna está contestada aquí.

1. **¿Qué ve un cliente sin suscripción registrada en Stripe?** Afecta a los clientes que hoy se cobran fuera de Stripe y a todos los clientes antes de que la fase 6 esté en marcha.
   - a) No ve la página «Suscripción»: desaparece de la navegación y, si entra por su dirección, recibe la misma respuesta que para una página inexistente. Menos ruido, pero la navegación de la función 040 deja de ser fija y el cliente no tiene dónde consultar cómo se le cobra.
   - b) Ve la página con un texto que dice que su suscripción se gestiona directamente con HumanaIA y cómo contactar (cuestión 7). La navegación no cambia, pero hace falta fijar ese texto y la vía de contacto.

2. **¿Quién puede abrir el portal de pago si un cliente tiene varios usuarios?** Desde el portal se puede cambiar el medio de pago y, según cómo se configure en la fase 6, cancelar o pausar la suscripción. Va ligada a la cuestión 2 de la función 040 y a la cuestión 20 de la función 050.
   - a) Todos los usuarios del cliente. Más sencillo; cualquier persona invitada puede cambiar el medio de pago o, si se permite, cancelar el servicio.
   - b) Solo un usuario designado. Más control; exige un nivel de usuario dentro del cliente (función 040), decidir quién lo designa y qué pasa si esa persona deja de estar. Los demás ven el estado pero no la acción.

3. **¿Qué se le dice al cliente con un pago pendiente?**
   - Fecha de suspensión: a) se muestra la fecha de fin de la gracia como la fecha en que el agente dejaría de funcionar; b) se dice que hay un plazo, sin fecha; c) no se menciona la suspensión. Con a) el cliente sabe cuánto margen tiene, pero la fecha tiene que ser exacta (REQ-007); con b) y c) hay menos riesgo de error, pero el cliente puede enterarse tarde.
   - Insistencia: a) el aviso aparece en el Resumen en cada visita mientras dure; b) solo en la página «Suscripción»; c) en el Resumen solo a partir de unos días antes del fin de la gracia (¿cuántos?).
   - Alcance: ¿el aviso se muestra también en «alta sin completar», «pausada» y «cancelada», o solo en «pago pendiente» e «impago»?

4. **¿Qué ve el cliente mientras está activo el modo observación de Stripe?** En ese modo no se suspende ninguna licencia por el cobro, aunque se calcule la gracia. REQ-007 impide anunciar una suspensión que no ocurrirá.
   - a) Ve el estado de pago con normalidad (por ejemplo, «pago pendiente»), sin fecha ni advertencia de suspensión. Es verdad, pero el cliente puede no darle importancia y, al desactivarse el modo, encontrarse con la suspensión con poco aviso.
   - b) No ve estados de pago negativos mientras dure el modo: la página muestra el estado como «no disponible» o como en la opción a) de la cuestión 1. No hay avisos durante la observación, pero el cliente no sabe que tiene un pago pendiente.
   - Relacionado: ¿se avisa a los clientes afectados antes de desactivar el modo (cuestión 17 de la función 050)?

5. **¿Qué se muestra cuando un superadmin ha forzado el estado de la licencia?** El cliente no debe ver que hay un estado forzado (REQ-050), pero lo que ve tiene que ser verdad y no contradecir el Resumen (REQ-008).
   - Agente activo forzado con un pago pendiente o impago: a) se muestra el estado de pago real («pago pendiente» o «impago»), sin anunciar suspensión, y el agente aparece activo; b) se muestra el estado de pago, se omite la explicación de lo que pasa con el agente; c) no se muestra el impago. Con a) y b) el cliente sabe que debe pagar; con c) no se le dice algo que es verdad sobre su pago.
   - Agente suspendido forzado con el pago al día: a) se muestra «al día» y el agente aparece suspendido, con la vía de contacto; b) se muestra un mensaje neutro de que el servicio está suspendido y que contacte con HumanaIA, sin estado de pago. En los dos casos el cliente puede deducir que no es por el pago; decide si se le dice algo más.

6. **¿Se confirma la lista cerrada de estados visibles y su correspondencia con los estados de Stripe?** Está en «Estados visibles propuestos». Puntos a confirmar: si `incomplete` e `incomplete_expired` se agrupan como «alta sin completar»; si «pausada» se distingue de la pausa del agente (`docs/DISENO.md` usa «En pausa» para el agente); si `past_due` con la gracia vencida pero la licencia aún sin suspender (entre el vencimiento y su aplicación, función 050) se muestra como «impago» o como «pago pendiente»; y si «en prueba» y «al día» deben distinguirse o basta uno.

7. **¿Cuál es la vía de contacto cuando el cliente necesita ayuda con el cobro?** Por ejemplo, un correo o un teléfono de HumanaIA, o una página de ayuda. No se ha inventado ninguna. Sin respuesta, la página no puede mostrar el siguiente paso en «sin suscripción registrada», en el estado suspendido por un forzado ni en los errores del portal.

8. **¿Ve el cliente el importe o el plan que tiene contratado?** Hoy no se guardan importes (función 050) y la cuestión 3 de la función 050 (planes y precios) está abierta.
   - a) No; el importe y el plan se consultan en el portal de Stripe. Nada cambia en la fase 6.
   - b) Ve el nombre del plan. Hace falta guardarlo o leerlo de Stripe y decidir su lista cerrada.
   - c) Ve el importe. Cambia el requisito de la función 050 que excluye guardar importes, y hay que decidir qué importe (precio o pendiente) y con o sin IVA (cuestión 2 de la función 050).

9. **¿Qué ve un cliente que ha cancelado o que va a cancelar al final del periodo?** Depende de la cuestión 10 de la función 050 (si se puede cancelar desde el portal y cuándo surte efecto). Si la cancelación al final del periodo se permite, la suscripción sigue en `active` hasta esa fecha y decir «se renueva el...» sería falso (REQ-004). Opciones: a) la función 050 pone a disposición del cliente si la suscripción se renovará, y la página lo distingue; b) la página nunca habla de renovación, solo de fin del periodo en curso. También: ¿puede un cliente con la suscripción cancelada o dado de baja abrir el portal (por ejemplo, para reactivarla)?

10. **¿Qué antigüedad máxima puede tener el estado de la suscripción para mostrarlo como actual?** Si la relectura en Stripe lleva tiempo fallando, el estado guardado puede no ser el real. Opciones: a) no hay límite; se muestra siempre el último estado guardado. b) Por encima de un umbral (¿cuál?), el estado visible pasa a «no disponible». c) Por encima del umbral se muestra el estado con la fecha en que se comprobó. b) y c) exigen que la función 050 ponga a disposición del cliente la fecha de la última comprobación o un indicador equivalente, que hoy solo tiene el superadmin.

11. **¿Qué se le dice al cliente sobre sus facturas?** Es probable que lo busque en «Suscripción». Depende de B-001 y de la cuestión 12 de la función 050.
    - a) Nada; la página no menciona facturas.
    - b) Un texto fijo que dice dónde recibe la factura legal (según lo que se decida en B-001), sin enlaces a documentos.
    - c) Un texto que remite a los justificantes del portal de Stripe. Solo si la gestoría confirma que no se confunden con la factura legal.

12. **Umbrales propuestos que hay que confirmar o cambiar:** tiempo máximo para obtener el acceso al portal (10 segundos); límite de accesos al portal por usuario (10 por hora); rendimiento de la página (2,5 segundos en el percentil 75 en móvil con 4G simulada, el mismo que propone la función 040).

## Dependencias y decisiones relacionadas

- **Función 050 (fase 6)**: datos de cobro disponibles para el usuario de cliente, acceso al portal obtenido en el momento y no reutilizable, relación entre cobro y licencia, estado manual, modo observación y configuración del portal. Esta función no puede diseñarse en firme hasta que la 050 esté aprobada, ni implementarse antes de que B-001 esté resuelta, como exige la 050. Sus cuestiones abiertas 5, 10, 11, 12, 13, 17 y 20 afectan a lo que ve el cliente.
- **Fase 2 cerrada**: modelo de datos, aislamiento por cliente y sus pruebas en CI. El modelo de referencia (`docs/MODELO-DATOS.sql`) es una PROPUESTA y, tal como está, no cumple REQ-030 (ver el informe del especificador).
- **Fase 3**: sistema de diseño hecho (V-110); componentes de estado, aviso y estados obligatorios.
- **Función 040**: sesión, marco, navegación, guardia de acceso, «sin permiso», protección frente a incrustación y envío desde otro sitio, y sus cuestiones abiertas 2 (varios usuarios y niveles) y 6 (acceso según el estado del cliente y de la licencia; REQ-049 exige que un cliente suspendido por impago llegue a «Suscripción» y al portal).
- **Función 041**: hueco del aviso en el Resumen y estado del agente con el que REQ-008 y REQ-021 exigen coherencia.
- **Funciones 052 y 053**: textos legales sobre el cobro y migración de los clientes actuales (que pueden no tener suscripción, cuestión abierta 1).
- Decisiones: D-003, D-010, T-014, T-015, B-001, V-110, V-112.
- ADR: 0003 (aislamiento por cliente) y 0006 (cobro sin facturar).
- Seguridad: amenazas A-07, A-10, A-18 y A-21; lista de publicación: «Prueba de extremo a extremo de acceso cruzado entre dos clientes». El acceso al portal toca la ruta crítica de cobro: necesita dictamen del `auditor-seguridad`.
- Constitución: artículos 1, 2, 3, 4, 7, 10, 12 y 13.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
