# 050 · Cobro de la suscripción con Stripe

Estado: PROPUESTA
Fase: 6 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

HumanaIA cobra a sus clientes una suscripción recurrente y hoy el estado de pago no tiene ningún efecto sobre la licencia del agente. Esta función conecta el cobro de Stripe Billing con la licencia: un impago que no se resuelve dentro de un periodo de gracia suspende la licencia y el pago la reactiva, siempre con un estado manual que el superadmin puede imponer y con un modo observación que permite comprobar el comportamiento antes de que tenga efectos reales. El panel no emite facturas: solo registra y muestra el estado de cobro y enlaza a Stripe (ADR-0006, T-014). Todo ello sin que entre en el sistema ningún dato personal de pago y sin que un cliente pueda ver ni tocar el cobro de otro.

## Quién la usa y cómo

- Como **responsable de HumanaIA**, quiero que un cliente que deja de pagar pierda el servicio solo cuando acabe el periodo de gracia, para no parar el agente de quien paga por un simple fallo de tarjeta.
- Como **responsable de HumanaIA**, quiero ver primero en modo observación qué licencias se suspenderían, para activar la suspensión real solo cuando confíe en el resultado.
- Como **superadmin**, quiero ver el estado de cobro de cada cliente, su fin de periodo y su fin de gracia, y poder forzar una licencia activa o suspendida, para resolver casos excepcionales con constancia de quién lo hizo.
- Como **usuario de un cliente**, quiero ver el estado de mi suscripción y gestionar mi medio de pago en el portal de Stripe, para mantener el servicio sin depender de HumanaIA.
- Como **Stripe**, aviso de los cambios de una suscripción por webhook, sabiendo que mis avisos pueden llegar repetidos, tarde o desordenados.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo. «Licencia activa» y «licencia suspendida» se refieren a lo que el conector responde al agente: con una licencia suspendida, el agente recibe el estado `suspendida` y ninguna instrucción.

### Cobro y portal

| ID | Requisito |
| --- | --- |
| REQ-001 | La suscripción de un cliente se cobra de forma recurrente con Stripe Billing y admite como medios de pago tarjeta y adeudo SEPA. |
| REQ-002 | Un usuario autenticado de un cliente puede abrir el portal de cliente de Stripe correspondiente a su propio cliente para gestionar su medio de pago. El acceso al portal se obtiene en el momento de pedirlo, no se guarda ni se reutiliza, y el cliente al que corresponde se deriva de la sesión. |

### Vinculación con Stripe

| ID | Requisito |
| --- | --- |
| REQ-003 | La vinculación entre un cliente nuestro y su identificador de cliente en Stripe solo la establece una acción autenticada de nuestro lado (la que fije la cuestión abierta 6), queda auditada y nunca se deduce del contenido de un evento recibido. |
| REQ-004 | Un identificador de cliente de Stripe está vinculado como mucho a un cliente nuestro, y un cliente nuestro como mucho a un identificador de Stripe. Cambiar o deshacer una vinculación existente solo lo puede hacer un superadmin con doble factor, y queda auditado. |

### Webhook

| ID | Requisito |
| --- | --- |
| REQ-005 | El webhook comprueba la firma del evento y que su marca de tiempo esté dentro de la tolerancia admitida antes de anotar, leer o cambiar nada. |
| REQ-006 | De cada evento aceptado se anota solo su identificador, su tipo, cuándo se recibió y cuándo terminó su tratamiento. La carga del evento no se guarda en ningún sitio. |
| REQ-007 | Un evento cuyo tratamiento terminó no se vuelve a tratar si llega de nuevo. Un evento anotado cuyo tratamiento no terminó se trata cuando Stripe lo reintente. |
| REQ-008 | Ante cualquier evento de un tipo esperado, el estado de la suscripción se obtiene releyéndolo en Stripe en ese momento. La carga del evento no se usa como fuente del estado. |
| REQ-009 | Solo se tratan los tipos de evento de una lista cerrada que fija el diseño. Un evento de otro tipo, con firma válida, se anota (REQ-006) y no cambia ninguna suscripción, licencia ni alerta. |
| REQ-010 | El cliente afectado por un evento se determina únicamente a partir del identificador de Stripe ya vinculado (REQ-003). Los metadatos del evento o de los objetos de Stripe no se usan para determinar el cliente. |

### Relación entre el estado de cobro y la licencia

Se aplica cuando el estado manual de la licencia es «automático» y el modo observación está desactivado (REQ-021, REQ-025).

| ID | Requisito |
| --- | --- |
| REQ-011 | Con la suscripción en `trialing` o `active`, la licencia está activa. |
| REQ-012 | Cuando la suscripción entra en `past_due`, la licencia sigue activa, se abre una alerta de impago y empieza el periodo de gracia, con su fecha de fin registrada. Mientras la suscripción siga en `past_due`, la llegada de nuevos eventos no reinicia ni alarga la gracia. |
| REQ-013 | Con la suscripción en `unpaid`, `canceled` o `paused`, la licencia está suspendida. |
| REQ-014 | Cuando vence el periodo de gracia y la suscripción sigue en `past_due`, la licencia queda suspendida y se abre una alerta de gracia vencida. |
| REQ-015 | Con la suscripción en `incomplete` o `incomplete_expired`, una licencia que ya estaba activa no cambia, y se abre una alerta. |
| REQ-016 | Si la suscripción vuelve a `active` o `trialing` durante el periodo de gracia, la gracia se cierra y la licencia no llega a suspenderse. |
| REQ-017 | Si la suscripción vuelve a `active` o `trialing` después de una suspensión causada por el cobro, la licencia se reactiva. El cobro solo levanta suspensiones causadas por el cobro; nunca una de otro origen. |
| REQ-018 | El vencimiento del periodo de gracia se detecta y aplica aunque no llegue ningún evento de Stripe, en el plazo máximo que fije la cuestión abierta 15. |
| REQ-019 | Si un evento de Stripe se pierde, el estado de cobro guardado se pone de acuerdo con el de Stripe en el plazo máximo que fije la cuestión abierta 15, sin necesidad de un evento nuevo. |
| REQ-020 | La duración del periodo de gracia es un parámetro único del producto, con un valor dentro de un rango acotado. Lo fija el responsable; su cambio solo lo puede hacer un superadmin con doble factor y queda auditado. |

### Estado manual

| ID | Requisito |
| --- | --- |
| REQ-021 | Cada licencia tiene un estado manual con tres valores: automático, forzar activa y forzar suspendida. Con forzar activa o forzar suspendida, la licencia está en ese estado sea cual sea el estado de cobro; con automático, sigue al cobro según REQ-011 a REQ-017. Las alertas de cobro se siguen generando aunque haya un forzado. |
| REQ-022 | Al volver una licencia a automático, toma el estado que corresponde al cobro en ese momento, no el que tenía antes del forzado. |
| REQ-023 | Solo un superadmin con doble factor puede cambiar el estado manual. Cada cambio queda auditado con quién, cuándo, qué licencia y qué valor nuevo. |

### Modo observación

| ID | Requisito |
| --- | --- |
| REQ-024 | Existe un modo observación global, activado por defecto en todo entorno nuevo. |
| REQ-025 | Con el modo observación activado, se registran los estados de cobro, se calcula la gracia y se generan las alertas, pero el cobro no suspende ni reactiva ninguna licencia. Para cada cliente queda visible qué efecto tendría el cobro si no hubiera observación. |
| REQ-026 | Desactivar o volver a activar el modo observación es una acción expresa, con confirmación previa, que solo puede hacer un superadmin con doble factor (o la persona que fije la cuestión abierta 8), y queda auditada. |
| REQ-027 | Antes de confirmar la desactivación, quien la hace ve la lista de licencias que quedarían suspendidas en ese momento y el motivo de cada una. |
| REQ-028 | Tras desactivar el modo observación, las licencias suspendidas por el cobro coinciden con la lista mostrada en REQ-027, salvo los cambios de cobro o de estado manual ocurridos entre medias, y el efecto se aplica en el plazo que fije la cuestión abierta 17. |

### Clientes sin suscripción

| ID | Requisito |
| --- | --- |
| REQ-029 | Un cliente sin suscripción registrada no ve afectada su licencia por el cobro ni recibe alertas de impago o de gracia vencida. |

### Información disponible

| ID | Requisito |
| --- | --- |
| REQ-030 | Para cada cliente, el superadmin dispone de: si tiene suscripción vinculada, estado en Stripe, fin del periodo en curso, fin de la gracia si la hay, estado efectivo de la licencia y su origen (cobro, estado manual u observación), fecha de la última relectura correcta en Stripe y un enlace a la ficha del cliente en el panel de Stripe. Dispone también del estado del modo observación y de la lista de eventos recibidos que no corresponden a ningún cliente vinculado (REQ-051). |
| REQ-031 | Un usuario de un cliente dispone, solo para su cliente y solo en lectura, de: estado de la suscripción, fin del periodo en curso, fin de la gracia si la hay y acceso a su portal de Stripe (REQ-002). |
| REQ-032 | Nadie, tampoco un superadmin, puede escribir a mano el estado de cobro guardado de un cliente: solo cambia por relectura en Stripe. La vía para imponer otro estado de licencia es el estado manual (REQ-021). |

### Privacidad

| ID | Requisito |
| --- | --- |
| REQ-033 | De cada suscripción solo se guardan identificadores de Stripe, estado y fechas. No se guarda correo, nombre, dirección, IBAN, datos de tarjeta, importes de facturas ni la carga de ningún evento o respuesta de Stripe. |
| REQ-034 | Los registros, los mensajes de error, la supervisión y las evidencias de prueba no contienen correo, nombre, dirección, IBAN, datos de tarjeta ni cargas de eventos o de respuestas de Stripe. Un error devuelto por Stripe se anota solo por su tipo y código, nunca por su mensaje. |
| REQ-035 | El sistema no envía a Stripe ningún dato de los informes del agente, de los usuarios de los dashboards ni del contenido del servicio. Lo que se envíe a Stripe para dar de alta al cliente lo fija la cuestión abierta 21. |

### Aislamiento y autorización

| ID | Requisito |
| --- | --- |
| REQ-036 | Un usuario de un cliente solo puede leer el estado de cobro de su propio cliente. Se prueba de forma automática con al menos dos clientes. |
| REQ-037 | Ninguna operación de cobro (webhook, portal, alta, vinculación, consulta) acepta un identificador de cliente nuestro como entrada: en el webhook se deriva del identificador de Stripe vinculado; en los dashboards, de la sesión. |
| REQ-038 | Un usuario de un cliente no puede cambiar el estado de cobro, la vinculación, el estado manual, el modo observación ni el parámetro de gracia, tampoco los de su propio cliente. |

### Entornos, secretos y operación

| ID | Requisito |
| --- | --- |
| REQ-039 | Los entornos de desarrollo y previo solo operan en el modo de pruebas de Stripe, y producción solo en el modo real. Todas las pruebas de esta función se hacen en el modo de pruebas. |
| REQ-040 | La cuenta de Stripe, la clave de su API y el secreto de firma del webhook los crea y los pone una persona en el gestor de variables de cada entorno, distintos por entorno y fuera del repositorio. La clave usada tiene solo los permisos que necesita la función, con la lista documentada. |
| REQ-041 | Cada suspensión o reactivación de una licencia causada por el cobro queda auditada como acción del sistema de cobro, con la licencia, el estado nuevo y el motivo. |
| REQ-042 | Los fallos de relectura en Stripe y de tratamiento de eventos se cuentan y son visibles para el superadmin. Si persisten más allá del umbral que fije la cuestión abierta 15, se abre una alerta. |
| REQ-043 | El panel no genera, numera, almacena ni envía facturas ni ningún otro documento fiscal; solo muestra el estado de cobro y enlaza a Stripe. |
| REQ-044 | No se implementa ninguna tarea de esta función mientras B-001 (quién emite la factura legal) no figure en el registro de decisiones como CONFIRMADO, con fecha. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-045 | Petición al webhook sin firma | Se rechaza. No se anota el evento, no se relee nada y no cambia ninguna suscripción, licencia ni alerta |
| REQ-046 | Firma inválida, alterada o hecha con el secreto de otro entorno | Igual que REQ-045 |
| REQ-047 | Evento auténtico reenviado con una marca de tiempo fuera de la tolerancia | Se rechaza aunque la firma sea válida; nada cambia |
| REQ-048 | Evento repetido cuyo tratamiento ya terminó | Se responde como recibido; no se relee, no cambia nada y no se abre ninguna alerta nueva |
| REQ-049 | Evento antiguo que llega después de otro más reciente de la misma suscripción | El estado guardado no retrocede: coincide con el estado actual en Stripe |
| REQ-050 | Dos eventos de la misma suscripción tratados a la vez | El estado final coincide con el estado actual en Stripe; no se pierde ningún cambio, no se duplican alertas ni se abren dos periodos de gracia |
| REQ-051 | Evento de un identificador de Stripe que no está vinculado a ningún cliente | No cambia ningún cliente ni licencia ni crea ninguna vinculación. Queda anotado (REQ-006) y visible para el superadmin |
| REQ-052 | Evento cuyos metadatos apuntan a otro cliente nuestro | Los metadatos se ignoran. Solo puede afectar al cliente vinculado a su identificador de Stripe, o a ninguno |
| REQ-053 | Stripe no responde o responde con error al releer el estado | Ninguna licencia cambia por ese fallo: una suspendida sigue suspendida y una activa sigue activa. El evento queda sin terminar para que el reintento lo trate (REQ-007) y el fallo se cuenta (REQ-042). El caso de una gracia que vence mientras Stripe no responde se rige por la cuestión abierta 13 |
| REQ-054 | El tratamiento de un evento o de la tarea periódica falla a medias | No queda ningún estado intermedio visible: o se aplica todo el cambio o nada. El evento no se da por terminado y un reintento llega al mismo resultado que un tratamiento sin fallo. Ninguna licencia suspendida pasa a activa por el fallo |
| REQ-055 | Cuerpo de la petición mayor que el límite que fije el diseño | Se rechaza antes de interpretarlo, sin anotar su contenido |
| REQ-056 | Cuerpo malformado o que no es un evento de Stripe | Se rechaza sin anotar su contenido; nada cambia |
| REQ-057 | Evento o identificador del modo de pruebas en producción, o del modo real en un entorno de pruebas | No tiene ningún efecto y queda anotado como rechazado |
| REQ-058 | Usuario de un cliente que intenta ver la suscripción de otro, cambiando la dirección, los parámetros o los identificadores | No obtiene ningún dato del otro cliente |
| REQ-059 | Usuario de un cliente que intenta cambiar su suscripción guardada, la de otro, la vinculación, el estado manual, el modo observación o el parámetro de gracia | Se rechaza y nada cambia |
| REQ-060 | Usuario de un cliente que intenta abrir el portal de Stripe de otro cliente | Solo puede obtener el acceso al portal de su propio cliente, o ninguno |
| REQ-061 | Superadmin sin doble factor que intenta cambiar el estado manual, el modo observación, una vinculación o el parámetro de gracia | Se rechaza y nada cambia |
| REQ-062 | Se pasa un identificador de cliente nuestro como entrada en cualquier operación de cobro | Se ignora o se rechaza; nunca determina a qué cliente afecta la operación |
| REQ-063 | Intento de vincular un identificador de Stripe ya vinculado a otro cliente, inexistente en Stripe o del otro modo (pruebas o real) | Se rechaza; ninguna vinculación cambia |
| REQ-064 | Un cliente vinculado tiene más de una suscripción en Stripe | No se elige una por defecto: la licencia no cambia por el cobro y se abre una alerta para el superadmin |
| REQ-065 | La relectura devuelve un estado que no está en la lista cerrada de T-015, o datos incompletos | No se concede ni se levanta ninguna suspensión; la licencia no cambia por ese motivo y se abre una alerta |
| REQ-066 | Licencia revocada cuya suscripción vuelve a `active` | La licencia sigue revocada: el cobro nunca reactiva una licencia revocada |
| REQ-067 | Licencia en forzar suspendida cuya suscripción se paga, o en forzar activa cuya suscripción pasa a `unpaid` | La licencia mantiene el estado forzado; las alertas de cobro se generan igualmente |
| REQ-068 | Respuesta del webhook a una petición rechazada | No revela el motivo detallado, datos internos ni el contenido recibido |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Todos se ejecutan en el modo de pruebas de Stripe, simulando el paso del tiempo cuando haga falta, con datos ficticios y con un valor de gracia de prueba.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Con observación desactivada y estado manual automático, un impago de prueba deja la licencia activa con alerta de impago y fin de gracia registrado; al vencer la gracia, sin enviar ningún evento, la licencia queda suspendida con alerta de gracia vencida dentro del plazo de la cuestión 15 y el agente recibe `suspendida`; tras pagar, la siguiente llamada del agente recibe `activa`. Cada suspensión y reactivación deja exactamente una fila de auditoría. (Criterio de la fase 6: «Un impago de prueba suspende la licencia al acabar la gracia y el pago la reactiva».) | REQ-012, REQ-014, REQ-017, REQ-018, REQ-041 |
| CA-002 | Un impago pagado antes de que venza la gracia cierra la gracia y la licencia no está suspendida en ningún momento | REQ-016 |
| CA-003 | Una batería automática recorre los 8 estados de Stripe, los 3 valores del estado manual, observación activada y desactivada, cliente sin suscripción y licencia revocada. El estado efectivo de la licencia coincide con el esperado en el 100 % de las combinaciones | REQ-011 a REQ-015, REQ-021, REQ-022, REQ-025, REQ-029, REQ-066, REQ-067 |
| CA-004 | Las peticiones sin firma, con firma alterada, firmadas con el secreto de otro entorno y con marca de tiempo fuera de tolerancia se rechazan en el 100 % de los casos, con 0 eventos anotados, 0 relecturas y 0 cambios; la respuesta no contiene detalles internos. (Criterio de la fase 6: «El webhook rechaza firmas inválidas».) | REQ-005, REQ-045 a REQ-047, REQ-068 |
| CA-005 | El mismo evento enviado 5 veces seguidas y 5 veces a la vez se trata exactamente una vez: 1 relectura con efecto, 1 alerta como máximo y una sola anotación. La anotación contiene solo identificador, tipo y fechas. (Criterio de la fase 6: «Un evento repetido no se procesa dos veces».) | REQ-006, REQ-007, REQ-048 |
| CA-006 | Enviar un evento antiguo después de uno reciente, y dos eventos de la misma suscripción a la vez, repetido 20 veces, deja en 20 de 20 casos el estado guardado igual al estado actual en Stripe, sin alertas ni gracias duplicadas | REQ-008, REQ-049, REQ-050 |
| CA-007 | Un evento de un tipo fuera de la lista, un cuerpo mayor que el límite, un cuerpo malformado y un evento del otro modo no cambian ninguna suscripción, licencia ni alerta (0 cambios en 4 de 4 casos) | REQ-009, REQ-055 a REQ-057 |
| CA-008 | Un evento de un identificador sin vincular no cambia nada y aparece en la lista del superadmin; un evento cuyos metadatos nombran al cliente B solo afecta al cliente vinculado A; vincular un identificador ya vinculado, inexistente o del otro modo se rechaza; cada vinculación y desvinculación deja una fila de auditoría | REQ-003, REQ-004, REQ-010, REQ-051, REQ-052, REQ-063 |
| CA-009 | Con un cambio de estado hecho en Stripe cuyo evento no se entrega, el estado guardado coincide con Stripe dentro del plazo de la cuestión 15; una gracia vencida sin eventos se aplica dentro del mismo plazo | REQ-018, REQ-019 |
| CA-010 | Con Stripe simulado como no disponible durante la relectura, una licencia suspendida sigue suspendida y una activa sigue activa (0 cambios); el evento queda sin terminar y, al recuperarse Stripe, el reintento deja el estado correcto; si el fallo persiste más del umbral, se abre una alerta | REQ-042, REQ-053 |
| CA-011 | Provocando un fallo en cada paso del tratamiento de un evento y de la tarea periódica, en ningún caso queda un estado intermedio ni una licencia suspendida pasa a activa, y el reintento llega al mismo resultado que un tratamiento sin fallo (100 % de los pasos probados) | REQ-007, REQ-054 |
| CA-012 | Forzar activa con la suscripción en `unpaid` deja la licencia activa; forzar suspendida con la suscripción en `active` la deja suspendida; volver a automático aplica el estado del cobro de ese momento. Cada cambio deja una fila de auditoría con actor, licencia y valor nuevo. Los mismos cambios, hechos por un superadmin sin doble factor, se rechazan sin cambiar nada | REQ-021 a REQ-023, REQ-061 |
| CA-013 | En un entorno recién creado el modo observación está activado; con observación, un impago con gracia vencida suspende 0 licencias y genera sus alertas; la vista previa lista exactamente las licencias que el criterio CA-003 marca como suspendidas; tras desactivar, las licencias suspendidas coinciden con la vista previa; desactivar y volver a activar dejan cada uno una fila de auditoría y piden confirmación | REQ-024 a REQ-028 |
| CA-014 | Pruebas automáticas en CI con dos clientes A y B (de base de datos y de extremo a extremo): un usuario de A obtiene 0 datos de cobro de B por cualquier vía, incluido cambiar la dirección o los identificadores; no puede cambiar ningún dato de cobro, ni de A ni de B; solo obtiene el portal de A; un identificador de cliente pasado como entrada no cambia el resultado. 100 % en verde | REQ-036 a REQ-038, REQ-058 a REQ-060, REQ-062 |
| CA-015 | Tras ejecutar todos los criterios con clientes de prueba de Stripe que llevan correo, nombre, dirección, IBAN y tarjeta de prueba con valores marcados, una búsqueda de esos valores y de cualquier carga de evento en la base de datos, los registros, los errores, la supervisión y las evidencias da 0 coincidencias. La revisión de privacidad confirma que lo enviado a Stripe no incluye datos de informes ni de usuarios de los dashboards | REQ-006, REQ-033 a REQ-035 |
| CA-016 | La información que la función pone a disposición del superadmin contiene los datos de REQ-030 para el 100 % de los clientes de prueba; la de un usuario de cliente contiene los de REQ-031 de su cliente y ningún otro; ningún intento de escribir a mano el estado de cobro guardado, tampoco de un superadmin, tiene efecto | REQ-030 a REQ-032 |
| CA-017 | En modo de pruebas, una suscripción pagada con tarjeta de prueba y otra con adeudo SEPA de prueba llegan a `active` con su licencia activa; un usuario de cada cliente abre su portal, cambia el medio de pago y el acceso obtenido no sirve una segunda vez | REQ-001, REQ-002 |
| CA-018 | El escáner de secretos no encuentra ninguna credencial de Stripe en el repositorio ni en el historial; los entornos de desarrollo y previo rechazan operar en el modo real; cada entorno tiene secretos distintos; la lista de permisos de la clave de Stripe está documentada y revisada por el `auditor-seguridad` | REQ-039, REQ-040, REQ-057 |
| CA-019 | B-001 figura en `docs/TECNOLOGIAS.md` como CONFIRMADO, con fecha anterior a la primera tarea implementada de esta función. La revisión del `revisor` confirma que ninguna parte de la función genera, numera, guarda ni envía facturas o documentos fiscales. (Criterio de la fase 6: «B-001 (factura legal) está resuelta por el responsable».) | REQ-043, REQ-044 |
| CA-020 | Un cliente vinculado con dos suscripciones en Stripe, y una relectura con un estado fuera de la lista o con datos incompletos, no cambian la licencia y abren una alerta (2 de 2 casos) | REQ-064, REQ-065 |
| CA-021 | Cambiar la duración de la gracia dentro del rango deja una fila de auditoría; un valor fuera de rango se rechaza; un cambio de un superadmin sin doble factor o de un usuario de cliente se rechaza | REQ-020 |
| CA-022 | Todas las pruebas automáticas de los casos negativos están en verde en CI | REQ-045 a REQ-068 |
| CA-023 | Con fallos de relectura provocados de forma continuada, el contador de fallos visible para el superadmin aumenta y se abre una alerta al superar el umbral; con un fallo aislado no se abre ninguna | REQ-042 |

## Fuera de alcance

- Emitir, numerar, guardar o enviar facturas o cualquier documento fiscal (ADR-0006, T-014). Quién emite la factura legal es B-001.
- Calcular o declarar impuestos.
- Las pantallas de los dashboards: superadmin (fase 3, rango 020 a 029) y cliente (fase 5, rango 040 a 049). Esta función define el comportamiento y los datos disponibles.
- Los textos legales, las condiciones de contratación y la información de privacidad sobre el cobro (función 052).
- Llevar a Stripe a los clientes actuales y su migración desde la carpeta `panel` (función 053).
- Crear la cuenta de Stripe, configurar sus productos y precios, y poner sus secretos: lo hace una persona (artículos 4 y 14).
- El envío de avisos por correo propios de HumanaIA y su proveedor (V-111, fase 4), salvo lo que se decida en la cuestión abierta 7.
- La gestión de cobros fuera de Stripe (transferencias u otros acuerdos), salvo lo que se decida en la cuestión abierta 9.
- Asesoramiento fiscal o legal: lo que dependa de la gestoría o de un abogado figura como cuestión abierta.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Factura legal (B-001).** ¿Quién emite la factura legal: el programa de facturación habitual de HumanaIA o Stripe con un conector homologado (por ejemplo Invopop o Billit)? Lo consulta el responsable con su gestoría. Stripe por sí solo no cumple Verifactu. Sin esta respuesta no se implementa (REQ-044).
2. **IVA.** ¿Quién calcula y refleja el IVA de la suscripción: Stripe, el programa de facturación o ambos? Va ligado a la cuestión 1 y lo debe confirmar la gestoría.
3. **Precio y planes.** ¿Cuántos planes hay; cobro mensual, anual o ambos; hay prueba gratuita (y de cuántos días); hay cuota de alta?
4. **Duración del periodo de gracia.** ¿Cuántos días, y entre qué valores mínimo y máximo se puede cambiar (REQ-020)? ¿Un cambio de duración afecta a las gracias ya en curso o solo a las nuevas?
5. **Stripe se adelanta a nuestra gracia.** Si Stripe pasa la suscripción a `unpaid` o `canceled` antes de que termine nuestro periodo de gracia, ¿qué manda? Opciones: (a) se suspende al momento, como dice la tabla del ADR; (b) se respeta la gracia hasta su fin. Relacionado: ¿la configuración de reintentos de Stripe se ajusta para que no ocurra?
6. **Alta de la suscripción.** ¿Cómo se da de alta? Opciones: (a) el superadmin genera y envía al cliente un enlace de pago; (b) el cliente la inicia desde su dashboard; (c) ambas. De ello depende qué acción establece la vinculación (REQ-003).
7. **Avisos de impago al cliente.** ¿Los hace Stripe con sus propios correos, HumanaIA con avisos propios (depende de V-111) o ambos? ¿Se avisa al cliente antes de que venza la gracia?
8. **Salida del modo observación.** ¿Qué criterio debe cumplirse para desactivarlo (por ejemplo, un número de semanas o de ciclos de cobro sin discrepancias)? ¿Puede desactivarlo cualquier superadmin con doble factor o solo la cuenta del responsable?
9. **Clientes que no pagan por Stripe.** ¿Hay clientes que pagarán por transferencia u otro acuerdo? Si los hay, ¿basta con dejarlos sin suscripción (REQ-029) o con estado manual, o hace falta otra forma de registrarlo?
10. **Baja voluntaria.** Si el cliente cancela desde el portal, ¿la cancelación es inmediata o al final del periodo pagado? ¿La licencia se suspende al terminar el periodo, se revoca o el cliente pasa a baja? ¿Puede el cliente cancelar o pausar desde el portal, o solo cambiar el medio de pago?
11. **Importes.** ¿El panel muestra importes (precio, importe pendiente) o solo estados y fechas? Hoy REQ-033 excluye guardar importes.
12. **Documentos de Stripe que parecen facturas.** Stripe genera documentos de cobro propios (facturas y recibos de Stripe) que el cliente puede ver en el portal o recibir por correo. ¿Deben ocultarse o desactivarse para que no se confundan con la factura legal? Lo debe confirmar la gestoría junto con la cuestión 1.
13. **Gracia vencida con Stripe sin responder.** Si la gracia vence mientras Stripe no responde, el cliente podría haber pagado sin que lo sepamos. Opciones: (a) se suspende igual, porque la gracia vencida es un hecho conocido (cierre en fallo estricto); (b) se aplaza la suspensión y se alerta hasta poder releer, con un límite máximo de aplazamiento; (c) otra. El artículo 3 y el ADR (que descarta suspender por un simple fallo) tiran en sentidos opuestos.
14. **Inicio de la gracia conocido tarde.** Si nos enteramos tarde de que la suscripción entró en `past_due` (evento perdido o Stripe caído), ¿la gracia cuenta desde el momento que indica Stripe o desde que lo sabemos?
15. **Plazos de detección.** ¿Cuál es el plazo máximo para aplicar una gracia vencida sin eventos y para corregir un evento perdido (REQ-018, REQ-019)? ¿Y a partir de cuántos fallos o cuánto tiempo se alerta (REQ-042)?
16. **Volver a activar la observación.** Si el modo observación se vuelve a activar tras haber estado desactivado, ¿las licencias suspendidas por el cobro se reactivan o se quedan como están?
17. **Efecto al salir de observación.** Al desactivarlo, ¿las suspensiones de la vista previa se aplican de inmediato o tras un aviso previo a esos clientes? ¿Con qué plazo (REQ-028)?
18. **Primer cobro incompleto.** Si la primera suscripción de un cliente queda en `incomplete` o `incomplete_expired`, ¿qué estado tiene su licencia? El ADR solo fija el caso de una licencia ya activa. ¿La licencia se crea antes del primer pago o después?
19. **Cierre de alertas de cobro.** Cuando el cliente paga, ¿la alerta de impago se marca como resuelta sola o la cierra un superadmin?
20. **Lo que ve el cliente.** ¿El usuario de un cliente puede ver sus identificadores de Stripe, o se consideran datos internos (criterio de la fase 5)? ¿Pueden abrir el portal todos los usuarios de un cliente o solo uno designado?
21. **Datos enviados a Stripe.** Al dar de alta al cliente en Stripe, ¿qué se envía desde nuestro lado (nombre comercial, correo de facturación) y qué introduce el propio cliente en las páginas de Stripe? Afecta al registro de actividades de tratamiento y al acuerdo de encargo con Stripe.
22. **Suscripción o cliente borrados en Stripe.** Si la relectura indica que la suscripción o el cliente ya no existen en Stripe, ¿se trata como `canceled`?
23. **Varias suscripciones.** Si un cliente acaba con más de una suscripción en Stripe, ¿cuál cuenta? Mientras no se decida, REQ-064 deja la licencia sin cambios y abre una alerta.
24. **Origen de las suspensiones.** ¿Puede una licencia estar suspendida por algo distinto del cobro y del estado manual (por ejemplo, una suspensión directa del superadmin en la fase 3)? REQ-017 exige que el pago solo levante las suspensiones del cobro, así que hace falta saber qué otros orígenes existen.
25. **Gasto.** Las comisiones de Stripe forman parte de B-002, que está PROPUESTO. ¿Queda aprobado para la fase 6?

## Dependencias y decisiones relacionadas

- Decisiones: D-003, D-010, T-014, T-015, B-001 (bloqueante para implementar), B-002, V-111.
- ADR: 0006 (base de esta función).
- Seguridad: amenazas A-17 y A-18; el webhook de Stripe y el estado de suscripciones son ruta crítica (dictamen del `auditor-seguridad`).
- Modelo de referencia (`docs/MODELO-DATOS.sql`): tipos de estado manual, de estado de suscripción y de alerta; tablas de licencias, ajustes globales, suscripciones y eventos de Stripe; función de licencia vigente. El diseño puede cambiarlos con su migración.
- Fase 2 (010 a 019): migraciones, RLS y pruebas pgTAP en CI, rol del conector y respuesta `suspendida`. Este diseño supone su modelo de datos.
- Fase 3 (020 a 029): doble factor del superadmin, auditoría y pantallas donde se muestran REQ-030, el estado manual, el modo observación y su vista previa.
- Fase 4 (030 a 039): sistema de alertas, tarea periódica y proveedor de avisos (V-111).
- Fase 5 (040 a 049): pantalla del cliente donde se muestra REQ-031 y el acceso al portal.
- Funciones 052 (textos legales) y 053 (migración de los clientes actuales).

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
