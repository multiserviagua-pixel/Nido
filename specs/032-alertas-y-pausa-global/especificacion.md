# 032 · Alertas y pausa global

Estado: PROPUESTA
Fase: 4 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Los agentes de los clientes trabajan solos, dentro de cuentas de correo a las que HumanaIA no tiene acceso. Si un agente deja de ejecutarse, se queda a medias, falla, sigue una versión del prompt que no le corresponde, no confirma una orden o aparece una conexión que nadie esperaba, HumanaIA tiene que enterarse a tiempo sin mirar el panel a todas horas. Esta función convierte esas situaciones en alertas que se ven, se filtran y se resuelven en el panel superadmin, avisa fuera del panel de las que lo merecen y vigila que el propio cálculo de alertas siga funcionando.

Además da a HumanaIA un freno de emergencia: la pausa global, que detiene a todos los agentes de todos los clientes en su siguiente revisión, por ejemplo ante una versión del prompt defectuosa o una cuenta de superadmin comprometida (A-11, A-12).

## Quién la usa y cómo

- Como **superadmin de HumanaIA**, quiero ver en un único sitio las alertas abiertas de todos los clientes, ordenadas por gravedad, para atender primero lo que más importa.
- Como **superadmin de HumanaIA**, quiero filtrar las alertas y resolverlas dejando constancia de quién y cuándo, para que el historial sea fiable.
- Como **responsable de HumanaIA**, quiero recibir fuera del panel un aviso de las alertas graves, sin datos de clientes que no hagan falta, para reaccionar aunque no tenga el panel abierto.
- Como **responsable de HumanaIA**, quiero saber si el cálculo de alertas ha dejado de funcionar, para no confundir silencio con normalidad.
- Como **superadmin de HumanaIA**, quiero activar una pausa global con una confirmación, ver cuántos agentes la han recibido ya y levantarla después, para contener un incidente sin tocar a los clientes uno por uno.

## Requisitos

Los parámetros entre corchetes (plazos, umbrales, destinatarios) no los fija esta especificación: los fija el responsable en la cuestión abierta indicada.

| ID | Requisito |
| --- | --- |
| REQ-001 | Cada alerta tiene: un tipo de una lista cerrada; una severidad de una lista cerrada; el cliente al que se refiere, o ninguno si es una alerta general; el momento de apertura según el reloj del servidor; cuántas veces se ha repetido su condición mientras estaba abierta y cuándo fue la última; y, si está resuelta, cuándo, de qué forma (automática o manual) y, si fue manual, qué usuario la resolvió. Ninguna alerta contiene texto libre. |
| REQ-002 | **Sin señal.** Se abre una alerta de este tipo para un cliente que tiene licencia vigente, no está de baja y tiene al menos una conexión no revocada, cuando pasa más de [plazo, cuestión 1] desde su última señal sin recibir otra. El plazo se calcula a partir de la frecuencia acordada en la ficha del cliente. Cuenta como señal cualquier petición de instrucciones autenticada de una conexión no revocada del cliente, sea cual sea el estado servido (con la salvedad de la cuestión 7). Si el cliente nunca ha dado señal, el plazo se cuenta desde la creación de su primera conexión no revocada. |
| REQ-003 | La alerta sin señal indica cuántas de las conexiones no revocadas del cliente han dejado de dar señal dentro del plazo, y cuáles, en la vista de detalle. |
| REQ-004 | **Ejecución sin informe.** Se abre una alerta de este tipo para un cliente cuando una de sus ejecuciones abiertas no recibe un informe válido en [plazo, cuestión 1] desde que se abrió. Qué ejecuciones esperan informe según el estado que se les sirvió lo fija la cuestión 12. |
| REQ-005 | **Estado `error`.** Se abre una alerta de este tipo para un cliente cuando se guarda un informe suyo con estado `error`. |
| REQ-006 | **Versión antigua.** Se abre una alerta de este tipo para un cliente cuando se guarda un informe de una ejecución a la que se sirvieron instrucciones y la versión del prompt que declara el informe no es la que el servidor le sirvió en esa misma ejecución. Si además se compara con la versión vigente del canal del cliente lo fija la cuestión 18. |
| REQ-007 | **Orden sin confirmar.** Se abre una alerta de este tipo para una orden de pausar o reanudar que no se ha confirmado ni anulado pasados [plazo y momento desde el que se cuenta, creación o entrega, cuestión 1]. |
| REQ-008 | **Conexión nueva.** Cada conexión creada por una activación abre su propia alerta, que identifica el cliente, el momento de la activación y el asistente registrado en la activación. |
| REQ-009 | Cada tipo de alerta tiene una severidad fija, la que establezca la cuestión 2. Las alertas que generan otras fases conservan la severidad con que se crearon. |
| REQ-010 | Las alertas de estado `error`, versión antigua y conexión nueva se abren como mucho [latencia máxima, cuestión 1] después del hecho que las provoca. |
| REQ-011 | No hay alertas abiertas duplicadas: como mucho una abierta por cliente y tipo; en conexión nueva, una por conexión; en orden sin confirmar, una por orden. Mientras una alerta está abierta, cada nueva aparición de su condición actualiza su número de repeticiones y su última aparición, y no abre otra. |
| REQ-012 | Las alertas de los tipos que la cuestión 5 declare de resolución automática se resuelven solas, con forma «automática», como mucho [latencia máxima, cuestión 1] después de desaparecer su condición. |
| REQ-013 | **Centro de alertas.** El panel superadmin muestra las alertas abiertas de todos los clientes, ordenadas primero por severidad y después por antigüedad, con tipo, severidad, cliente, apertura, repeticiones y última aparición, y un acceso a la ficha del cliente. |
| REQ-014 | El centro de alertas muestra también las alertas generadas por otras fases (token reutilizado, renovación fallida, intentos de activación, impago y gracia vencida), cada una con su nombre en español y su severidad. |
| REQ-015 | El centro de alertas permite filtrar por estado (abiertas o resueltas), tipo, severidad, cliente y periodo de apertura. Los filtros se combinan y se conservan al recargar la página. |
| REQ-016 | Un superadmin puede resolver a mano una alerta abierta, tras una confirmación. Quién y cuándo los pone el sistema a partir de la sesión y de su reloj. Cada resolución manual deja una fila de auditoría. |
| REQ-017 | Las alertas resueltas se pueden consultar con su forma de resolución, su momento y, si fue manual, quién la resolvió. |
| REQ-018 | Todas las páginas del panel superadmin muestran cuántas alertas hay abiertas por severidad, con acceso al centro de alertas. La ficha de cada cliente muestra sus alertas abiertas. |
| REQ-019 | El centro de alertas muestra cuándo terminó con éxito el último cálculo de alertas. |
| REQ-020 | **Aviso fuera del panel.** Las alertas de los tipos y severidades que fije la cuestión 3 generan un aviso fuera del panel a los destinatarios, por el canal y con la cadencia (inmediato o resumen) que fije esa misma cuestión. |
| REQ-021 | Un aviso de alerta contiene solo: tipo, severidad, número de alertas que comunica, momento y un enlace al centro de alertas. Lleva el nombre del cliente únicamente si lo aprueba la cuestión 4. |
| REQ-022 | Cada apertura de una alerta avisable genera como mucho un aviso. Las repeticiones de su condición mientras sigue abierta no generan avisos nuevos. |
| REQ-023 | **Pausa global: activar.** Un superadmin con el permiso que fije la cuestión 6 puede activar la pausa global desde el panel, tras una confirmación expresa que explica su efecto: todos los agentes de todos los clientes, en los dos canales, dejan de recibir instrucciones en su siguiente revisión. |
| REQ-024 | Desde el momento en que la activación queda guardada, toda respuesta a una petición de instrucciones, de cualquier conexión, cliente y canal, devuelve el estado `pausada` o uno más restrictivo, y ninguna lleva prompt, versión, huella ni reglas. |
| REQ-025 | Mientras la pausa global está activa, el panel muestra su avance: cuántos clientes con conexión han recibido ya `pausada` desde la activación, cuántos no, y cuáles son estos últimos. |
| REQ-026 | **Pausa global: levantar.** Un superadmin con el permiso que fije la cuestión 6 puede levantarla, tras una confirmación expresa. Desde ese momento cada cliente recibe en su siguiente revisión el estado que tendría si la pausa global no hubiera existido. |
| REQ-027 | Mientras la pausa global está activa, todas las páginas del panel superadmin muestran un indicador visible con el momento de activación y quién la activó, que las tecnologías de apoyo anuncian. |
| REQ-028 | Activar y levantar la pausa global dejan cada una una fila de auditoría que distingue si fue activación o levantamiento, con quién y cuándo. |
| REQ-029 | Activar y levantar la pausa global generan cada una un aviso fuera del panel a los destinatarios de la cuestión 3, con la acción y el momento, sin datos de clientes. |
| REQ-030 | Durante la pausa global, los informes con estado `pausado` se aceptan como siempre y la petición de instrucciones cuenta como señal. La pausa global por sí misma no abre alertas sin señal, estado `error` ni versión antigua. |
| REQ-031 | El centro de alertas, la confirmación y el indicador de la pausa global cumplen WCAG 2.2 AA. La severidad no se comunica solo con color. |
| REQ-032 | El centro de alertas y la pausa global tienen estados de carga, vacío y error, con textos que dicen qué pasa y qué se puede hacer. |
| REQ-033 | El centro de alertas, la resolución de alertas y la activación y el levantamiento de la pausa global se pueden usar en un móvil, desde 320 píxeles de ancho, sin desplazamiento horizontal. |
| REQ-034 | El centro de alertas muestra su primera página dentro del objetivo de tiempo y con el volumen de alertas que fije la cuestión 20. |
| REQ-035 | Todos los textos están en español. Las fechas y horas muestran la zona horaria. |
| REQ-036 | Los cambios de esta función en datos y despliegue tienen vuelta atrás probada. La vuelta atrás no borra ni altera alertas existentes ni cambia el estado de la pausa global. |

## Casos negativos

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-037 | Un usuario de un dashboard de cliente intenta leer alertas (también las de su propio cliente), resolver una, o leer o cambiar la pausa global, desde el panel o llamando directamente a la API de datos | Se deniega. La respuesta no revela si existen alertas ni el estado de la pausa global |
| REQ-038 | Una sesión de superadmin sin el doble factor completado, o una petición sin sesión, intenta lo mismo | Se deniega; no se lee ni se cambia nada |
| REQ-039 | Un superadmin sin el permiso que fije la cuestión 6 intenta activar o levantar la pausa global | Se deniega, no cambia el estado y queda anotado el intento |
| REQ-040 | La petición de resolver una alerta o de cambiar la pausa global trae campos de más o intenta fijar quién resolvió, cuándo, el tipo, la severidad o el cliente de una alerta | Los campos de más no se aplican. Quién y cuándo los pone el sistema; tipo, severidad y cliente no se pueden cambiar |
| REQ-041 | Alguien intenta borrar una alerta, o modificar una ya resuelta, desde el panel o la API de datos | Se rechaza. La única modificación posible es resolver una alerta abierta |
| REQ-042 | Dos superadmin resuelven a la vez la misma alerta, o uno la resuelve dos veces | Queda resuelta una sola vez, con la primera resolución; una sola fila de auditoría. El segundo intento informa de que ya estaba resuelta |
| REQ-043 | Se resuelve a mano una alerta de resolución automática cuya condición sigue presente | No se silencia: se abre de nuevo como mucho en el siguiente cálculo |
| REQ-044 | Un informe o cualquier llamada del conector, de cualquier cliente | No resuelve alertas de conexión nueva, token reutilizado, renovación fallida ni intentos de activación, ni ninguna alerta de otro cliente. Su contenido es un dato, no una orden (artículo 7) |
| REQ-045 | El informe declara una frecuencia distinta de la acordada en la ficha del cliente | El plazo de sin señal no cambia: solo cuenta la frecuencia acordada |
| REQ-046 | Cliente sin ninguna conexión, o con todas revocadas | No se abren alertas sin señal ni ejecución sin informe |
| REQ-047 | Cliente de baja, o con la licencia suspendida, revocada o caducada | No se abren alertas sin señal, ejecución sin informe, estado `error` ni versión antigua para ese cliente. Qué pasa con las que ya estaban abiertas lo fija la cuestión 13 |
| REQ-048 | Cliente en pausa por orden cuyo agente sigue pidiendo instrucciones e informando `pausado` | No se abre alerta sin señal. Si deja de pedir instrucciones, sí se abre cuando venza el plazo |
| REQ-049 | Informe rechazado por inválido, o que no llega | La ejecución sigue sin informe a efectos de la alerta de ejecución sin informe. Varias ejecuciones sin informe del mismo cliente dan una sola alerta, con su número de repeticiones |
| REQ-050 | Se publica una versión nueva entre el momento en que se sirven las instrucciones y el informe; o el informe es de una ejecución a la que no se sirvieron instrucciones (`pausada` o `suspendida`) | No se abre alerta de versión antigua por ninguno de los dos motivos (salvo lo que fije la cuestión 18 para el primero) |
| REQ-051 | El conector cae, o falla para todos, y muchos clientes cumplen a la vez la misma condición (sin señal o ejecución sin informe) | Si los afectados superan [umbral, cuestión 14], se abre una alerta general y sale un único aviso agregado, en vez de un aviso por cliente. Las alertas por cliente siguen visibles en el panel |
| REQ-052 | El cálculo de alertas se ejecuta dos veces seguidas sobre el mismo estado, o dos ejecuciones se solapan | El resultado es el mismo que con una sola ejecución: ninguna alerta ni aviso duplicados |
| REQ-053 | El cálculo de alertas falla a mitad | No quedan alertas a medias ni duplicadas; la siguiente ejecución completa el trabajo. El fallo queda anotado sin datos de clientes |
| REQ-054 | El cálculo de alertas deja de ejecutarse o deja de terminar con éxito durante más de [umbral, cuestión 16] | Sale un aviso fuera del panel por un mecanismo que no depende de que el cálculo se ejecute, y el centro de alertas lo muestra destacado. Nunca se presenta como «sin alertas» |
| REQ-055 | Una alerta se abre y se cierra una y otra vez para el mismo cliente y tipo | Cada apertura queda en el panel, pero no salen más de [máximo y ventana, cuestión 15] avisos fuera del panel por cliente y tipo |
| REQ-056 | Falla el envío de un aviso (servicio caído, rechazo, tiempo agotado) | Se reintenta según la cuestión 3. Si no se consigue, el panel muestra que hay avisos sin entregar. La alerta sigue abierta y visible, y el cálculo continúa |
| REQ-057 | El canal de aviso no está configurado, o no hay destinatarios válidos | El cálculo de alertas sigue funcionando y el panel muestra de forma destacada que los avisos no se pueden enviar. No se falla en silencio |
| REQ-058 | Se activa la pausa global estando ya activa, se levanta sin estar activa, o dos superadmin la activan o la levantan a la vez | El estado final es el pedido, con un solo cambio, una sola fila de auditoría de cambio y un solo aviso. Quien llega tarde ve que ya estaba en ese estado |
| REQ-059 | Un agente está en plena revisión cuando se activa la pausa global | La revisión que ya recibió instrucciones sigue su curso (el servidor no puede interrumpirla); su siguiente petición recibe `pausada`. Toda respuesta emitida después de guardada la activación es `pausada` o más restrictiva |
| REQ-060 | No se puede saber si la pausa global está activa (dato ausente, ilegible o error al consultarlo) | Se responde como si estuviera activa: ninguna instrucción, ningún prompt (artículo 3) |
| REQ-061 | Falla el guardado al activar o levantar la pausa global | El panel muestra el estado real y dice que el cambio no se hizo. Nunca muestra la pausa como activa si no lo está, ni al revés. No sale aviso de un cambio que no se produjo |
| REQ-062 | Pausa global activa y cliente de baja o con licencia no vigente | Recibe `suspendida`, como sin pausa global. La pausa global nunca relaja un estado más restrictivo |
| REQ-063 | Se levanta la pausa global y hay clientes en pausa por orden | Siguen en pausa. Levantar la pausa global no anula ni cumple ninguna orden |
| REQ-064 | El panel recibe una alerta de un tipo que no conoce (añadido por otra función después) | La muestra con un nombre genérico, su severidad y su cliente. No la oculta |
| REQ-065 | Falla la carga del centro de alertas o del estado de la pausa global | Se muestra un estado de error con opción de reintentar. Nunca «no hay alertas» ni «pausa inactiva» cuando no se ha podido comprobar |
| REQ-066 | Avisos enviados y registros del cálculo y del envío | No contienen contenido de correo, direcciones de clientes, nombres de documentos, tokens, códigos, identificadores de licencia ni credenciales del canal de aviso; el nombre del cliente solo si lo aprueba la cuestión 4. Los registros no contienen las direcciones de los destinatarios |

## Criterios de aceptación

Las pruebas se ejecutan en el entorno previo con datos ficticios, salvo las de base de datos, que corren en CI. Ninguna usa datos de clientes reales.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Con al menos 6 clientes ficticios con frecuencias acordadas distintas (al menos 1, 24 y 168 horas): el que deja de pedir instrucciones tiene alerta sin señal dentro del plazo de la cuestión 1 (propuesta de la arquitectura: antes de 2 veces su frecuencia acordada) en 10 de 10 repeticiones; los que siguen pidiendo instrucciones, también en `pausada`, no tienen ninguna | REQ-002, REQ-030, REQ-048 |
| CA-002 | Un cliente con 2 conexiones, una que da señal y otra que no, muestra en el detalle cuántas y cuáles están sin señal según lo que fije la cuestión 8 | REQ-003 |
| CA-003 | Un cliente con frecuencia acordada de 24 horas cuyos informes declaran 168 tiene alerta sin señal en el mismo momento que otro igual que declara 24; diferencia de apertura no mayor que un ciclo de cálculo | REQ-045 |
| CA-004 | Clientes sin conexión, con todas las conexiones revocadas, de baja, con licencia suspendida, revocada y caducada: 0 alertas sin señal, ejecución sin informe, estado `error` y versión antigua durante una prueba de al menos 3 veces su plazo | REQ-046, REQ-047 |
| CA-005 | Una ejecución sin informe, otra con informe inválido y tres seguidas sin informe del mismo cliente dan, respectivamente, alerta dentro del plazo de la cuestión 1, alerta igual, y una sola alerta con 3 repeticiones | REQ-004, REQ-049 |
| CA-006 | Un informe en estado `error` abre alerta dentro de la latencia de la cuestión 1; otros 2 informes en `error` mientras sigue abierta dejan 1 alerta con 3 apariciones | REQ-005, REQ-010, REQ-011 |
| CA-007 | Informe que declara una versión distinta de la servida: alerta de versión antigua. Informe que declara la servida aunque entre medias se haya publicado otra: ninguna (salvo cuestión 18). Informe de ejecución servida como `pausada` o `suspendida`: ninguna | REQ-006, REQ-050 |
| CA-008 | Una orden sin confirmar abre alerta al vencer el plazo de la cuestión 1 y se resuelve sola al confirmarse; otra anulada antes del plazo no abre ninguna | REQ-007, REQ-012 |
| CA-009 | Dos activaciones del mismo cliente abren 2 alertas de conexión nueva, cada una con su asistente y momento. 20 informes y confirmaciones posteriores de ese cliente no resuelven ninguna, ni tampoco las de token reutilizado, renovación fallida e intentos de activación sembradas para la prueba, ni alertas de otro cliente | REQ-008, REQ-044 |
| CA-010 | Cada tipo de alerta de esta función se abre con la severidad que fije la cuestión 2; las sembradas de otras fases conservan la suya | REQ-001, REQ-009 |
| CA-011 | El cálculo lanzado 2 veces seguidas y 2 veces a la vez sobre el mismo estado, 10 repeticiones de cada: 0 alertas abiertas duplicadas y 0 avisos duplicados | REQ-011, REQ-052 |
| CA-012 | Un fallo provocado a mitad del cálculo no deja alertas duplicadas ni incompletas, y la siguiente ejecución deja el mismo resultado que una ejecución sin fallo | REQ-053 |
| CA-013 | Las alertas de resolución automática se resuelven solas dentro de la latencia de la cuestión 1 al desaparecer su condición; una de ellas resuelta a mano con la condición presente vuelve a estar abierta tras el siguiente cálculo | REQ-012, REQ-043 |
| CA-014 | Prueba de extremo a extremo del centro de alertas con al menos una alerta de cada tipo de esta función, de cada tipo de otras fases y de un tipo desconocido: todas aparecen con nombre, severidad y cliente, en el orden pedido, con acceso a la ficha; el contador de todas las páginas y la ficha del cliente coinciden con ellas | REQ-013, REQ-014, REQ-018, REQ-064 |
| CA-015 | Cada filtro, solo y combinado, devuelve exactamente las alertas esperadas sobre un juego de al menos 50 alertas, y se conserva al recargar | REQ-015 |
| CA-016 | Resolver a mano deja la alerta resuelta con quién y cuándo puestos por el sistema y 1 fila de auditoría; aparece en el historial. Dos resoluciones simultáneas dejan 1 resolución y 1 fila | REQ-016, REQ-017, REQ-042 |
| CA-017 | Peticiones directas a la API de datos para resolver con campos de más o con quién, cuándo, tipo, severidad o cliente falsos, y para borrar o modificar alertas resueltas: 0 cambios aplicados fuera de la resolución legítima | REQ-040, REQ-041 |
| CA-018 | Pruebas automáticas de acceso (pgTAP en CI y extremo a extremo) con dos clientes, un usuario de cliente, una petición sin sesión y un superadmin sin doble factor: 0 lecturas y 0 cambios de alertas y de la pausa global; las respuestas no permiten distinguir si hay alertas | REQ-037, REQ-038 |
| CA-019 | Un superadmin sin el permiso de la cuestión 6 no puede activar ni levantar la pausa global, y su intento queda anotado | REQ-039 |
| CA-020 | Con el canal de aviso de prueba, cada alerta avisable genera exactamente 1 aviso con el contenido permitido; las repeticiones mientras está abierta, 0. Una alerta que se abre y se cierra 20 veces seguidas no genera más avisos que el máximo de la cuestión 15 | REQ-020, REQ-022, REQ-055 |
| CA-021 | Revisión de privacidad de todos los avisos enviados y de los registros generados durante las pruebas: 0 apariciones de los datos prohibidos en REQ-066 | REQ-021, REQ-066 |
| CA-022 | Con el canal de aviso caído o sin configurar: el cálculo sigue abriendo alertas, se ven en el panel, se hacen los reintentos de la cuestión 3 y el panel indica avisos sin entregar o canal no disponible | REQ-056, REQ-057 |
| CA-023 | Con el conector simulado caído para al menos [umbral de la cuestión 14] clientes ficticios: 1 alerta general y 1 solo aviso agregado; las alertas por cliente visibles en el panel | REQ-051 |
| CA-024 | Con el cálculo de alertas detenido a propósito: el aviso de cálculo detenido sale dentro del umbral de la cuestión 16 y el panel muestra destacada la hora del último cálculo con éxito | REQ-019, REQ-054 |
| CA-025 | **Criterio de la fase 4: la pausa global detiene todos los agentes en su siguiente revisión.** Con al menos 10 clientes ficticios repartidos entre los dos canales, con y sin orden de pausa y con alguno suspendido: tras activarla, el 100 % de las peticiones de instrucciones recibe `pausada` o `suspendida` y ninguna lleva prompt, versión, huella ni reglas; los agentes de prueba informan `pausado`; el avance del panel llega al 100 % de los clientes con conexión que dan señal | REQ-023, REQ-024, REQ-025, REQ-030, REQ-062 |
| CA-026 | Tras levantar la pausa global, cada cliente recibe en su siguiente revisión el mismo estado que antes de activarla; los pausados por orden siguen pausados y sus órdenes no cambian | REQ-026, REQ-063 |
| CA-027 | Activar y levantar dejan 1 fila de auditoría cada una, que distingue la acción, y 1 aviso cada una. Activar dos veces, levantar sin estar activa y dos activaciones simultáneas (10 repeticiones): 1 cambio, 1 fila y 1 aviso por cambio real | REQ-028, REQ-029, REQ-058 |
| CA-028 | Una revisión que recibió instrucciones justo antes de la activación termina y envía su informe; su siguiente petición recibe `pausada`. 0 respuestas con prompt emitidas después de guardada la activación | REQ-059 |
| CA-029 | Con el estado de la pausa global eliminado, ilegible o con error provocado al consultarlo: 0 respuestas con prompt en 100 peticiones | REQ-060 |
| CA-030 | Con un fallo provocado al guardar la activación y al guardar el levantamiento: el panel muestra el estado real, informa del fallo y no sale aviso | REQ-061 |
| CA-031 | Revisión de accesibilidad del centro de alertas, la confirmación y el indicador de pausa: 0 incumplimientos de WCAG 2.2 AA; con lector de pantalla se oye el indicador de pausa y la severidad sin depender del color | REQ-027, REQ-031 |
| CA-032 | Capturas a 320 píxeles y en escritorio de los estados de carga, vacío y error del centro de alertas y de la pausa global; con la carga fallida provocada, 0 casos en que se muestre «no hay alertas» o «pausa inactiva»; uso completo en móvil sin desplazamiento horizontal; todos los textos en español y las horas con zona | REQ-032, REQ-033, REQ-035, REQ-065 |
| CA-033 | Medición del centro de alertas con el volumen de la cuestión 20: la primera página aparece dentro del objetivo de esa cuestión en el 95 % de 50 cargas | REQ-034 |
| CA-034 | Prueba de vuelta atrás en el entorno previo de los cambios de datos y despliegue de esta función: tras volver atrás, las alertas existentes y el estado de la pausa global son idénticos a los de antes | REQ-036 |

## Fuera de alcance

- Registro de versiones, canales, publicación, vuelta atrás del prompt y aviso de publicación (función 030).
- Métricas por versión (función 031).
- Cliente piloto en paralelo con la carpeta `panel` (función 033).
- Generar las alertas de token reutilizado, renovación fallida e intentos de activación (fase 2) y de impago y gracia vencida (fase 6). Aquí solo se muestran, se filtran, se resuelven y, si procede, se avisan.
- Órdenes de pausar y reanudar por cliente y su creación (fase 3). Aquí solo se vigila su confirmación.
- Avisos a los clientes y cualquier cosa de su dashboard, incluido si ven que hay una pausa global (fase 5).
- Guía de incidentes y su simulacro (fase 6), aunque use la pausa global.
- Elección del proveedor del aviso (V-111, se verifica en el diseño).
- Plazos de conservación de las alertas (fase 6).
- Activación automática de la pausa global por cualquier condición: aquí solo la activa una persona.
- Cambios en el comportamiento del agente o en el arranque local ante `pausada` (fase 2, función 001 y D-013).
- Supervisión de disponibilidad y tiempos del conector en sí (fase 1, V-112); aquí solo se vigila el cálculo de alertas.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Plazos.** ¿Cuál es el plazo de sin señal (la arquitectura propone detectarlo antes de 2 veces la frecuencia acordada)? ¿El de ejecución sin informe? ¿El de orden sin confirmar, y se cuenta desde que se crea la orden o desde que se entrega al agente? ¿Qué latencia máxima se admite para abrir y para resolver solas las alertas que dependen de un hecho (estado `error`, versión antigua, conexión nueva)?
2. **Severidades.** ¿Qué severidad tiene cada uno de los seis tipos, y las alertas generales (cálculo detenido, condición masiva)? ¿Se mantienen los tres niveles del modelo de referencia (informativa, aviso, crítica)?
3. **Aviso fuera del panel.** ¿Qué tipos o severidades se avisan, a quién, por qué canal (correo, mensajería, otro), de inmediato o en resumen y con qué cadencia, y cuántos reintentos se hacen si falla el envío?
4. **Nombre del cliente en el aviso.** ¿El aviso lleva el nombre comercial del cliente? Puede ser el nombre de una persona (autónomos). Alternativas: ninguna identificación, solo el enlace al panel, o un identificador corto que no sea personal.
5. **Resolución.** ¿Qué tipos se resuelven solos al desaparecer su condición, cuáles solo a mano y cuáles de las dos formas? ¿Se quiere poder silenciar una alerta durante un tiempo, o resolver varias a la vez?
6. **Pausa global: quién.** ¿Cualquier superadmin puede activarla y levantarla, solo el responsable, o hace falta una segunda persona para levantarla? ¿Se registra un motivo de una lista cerrada?
7. **Qué es señal.** ¿Las revisiones en conversación cuentan como señal, o solo las desatendidas? Nota: el servidor solo sabe el modo por el informe, que llega después y es una entrada no confiable.
8. **Varias conexiones.** ¿Sin señal se evalúa por cliente (basta que una conexión dé señal) o por cada conexión no revocada?
9. **Estado `aviso` repetido.** ¿Varios informes seguidos en estado `aviso` deben abrir alerta, aunque el plan no lo incluya? ¿Con qué umbral?
10. **Excepciones a la pausa global.** ¿Se permite alguna, por ejemplo dejar funcionando el canal de prueba o un cliente concreto para probar una corrección?
11. **Órdenes durante la pausa global.** ¿Se siguen entregando órdenes de pausar y reanudar mientras dura? ¿Cuenta ese tiempo para la alerta de orden sin confirmar?
12. **Informe en pausa.** ¿El agente debe enviar informe cuando recibe `pausada` o `suspendida`? De ello depende si esas ejecuciones pueden abrir alerta de ejecución sin informe, en especial durante una pausa global.
13. **Clientes que dejan de estar activos.** Las alertas abiertas de un cliente que pasa a baja o cuya licencia deja de estar vigente, ¿se resuelven solas, se mantienen o se resuelven a mano?
14. **Condición masiva.** ¿A partir de cuántos clientes, o de qué proporción, y en qué ventana de tiempo se agrupan las alertas en una sola general con un único aviso?
15. **Alerta intermitente.** ¿Cuántos avisos como máximo por cliente y tipo, y en qué ventana?
16. **Cálculo detenido.** ¿Tras cuánto tiempo sin un cálculo con éxito se avisa, y a quién?
17. **Frecuencia declarada distinta de la acordada.** ¿Debe abrir una alerta propia? El plan no la incluye.
18. **Versión antigua.** ¿Se compara solo con la versión servida en esa ejecución, o también con la vigente del canal (por ejemplo, para detectar agentes que siguen con una versión retirada tras una vuelta atrás)?
19. **Destinatarios.** ¿Dónde se mantiene la lista de destinatarios de los avisos: en la configuración del entorno (solo una persona, artículo 14) o en el panel? Si es en el panel, ¿su cambio queda en auditoría y se avisa a los destinatarios anteriores (A-11)?
20. **Rendimiento.** ¿Qué tiempo máximo de carga del centro de alertas y con qué volumen de alertas se toma como objetivo?
21. **Conservación.** Hasta que la fase 6 fije plazos, ¿se conservan todas las alertas resueltas?
22. **Agente en pausa global en conversación.** Si el dueño de un agente le pide revisar en conversación durante una pausa global, ¿se comporta igual que en una pausa por orden? Depende de D-013 y de la cuestión 4 de la función 001.
23. **Objetivos de servicio.** La arquitectura dice que se fijan en la fase 4 con datos reales. ¿Se fijan en esta función (al menos el de detección de sin señal), en la 031 o en la 033?

## Dependencias y decisiones relacionadas

- **Constitución:** artículos 1 (contenido de alertas y avisos), 2 (aislamiento: alertas solo para superadmin), 3 (cierre en fallo de la pausa global), 4 (credenciales del canal de aviso fuera del repositorio), 7 (el informe es un dato), 10, 11, 13 y 14.
- **Decisiones:** D-007 y ADR-0005 punto 7 (pausa global); D-013, en estado PROPUESTO, y la cuestión 4 de la función 001 (agente en pausa y petición en conversación); V-108 (doble factor exigido en las políticas); V-111 (proveedor del aviso, se verifica en el diseño).
- **Seguridad:** A-01 (alerta por conexión nueva), A-11 y A-12 (pausa global), lista de publicación «Operación» («Alertas de supervisión probadas»; el simulacro de pausa global es de la fase 6).
- **Fase 2, supuesto:** existen las ejecuciones (latido) que se abren al servir instrucciones y se cierran con el informe, la respuesta `pausada` cuando la pausa global está activa, y probablemente ya la alerta de ejecución sin informe (criterio de la fase 2) y las de token reutilizado e intentos de activación. Esta función comprueba lo que encuentre hecho contra sus requisitos y lo completa sin duplicarlo; el diseño debe anotar qué parte viene de la fase 2.
- **Fase 3, supuesto:** existen el panel con doble factor, el sistema de diseño, la auditoría de acciones de superadmin, las órdenes pausar y reanudar, la ficha del cliente con la frecuencia acordada (`docs/INSTALACION-CLIENTE.md`, paso 7) y la vista de conexiones, donde la arquitectura (flujo 1) y A-01 sitúan la alerta de conexión nueva.
- **Función 030:** versiones registradas y versión servida por canal, que usa la alerta de versión antigua; su aviso de publicación puede compartir canal con el aviso de alertas.
- **Función 031:** métricas por versión; no comparte requisitos con esta.
- **Fase 6:** genera las alertas de impago y gracia vencida, fija la conservación y escribe la guía de incidentes que usa la pausa global.
- **Contratos:** `contratos/informe.schema.json` (estado, versión del prompt y frecuencia declarada).
- **Modelo de referencia:** `docs/MODELO-DATOS.sql`, en estado PROPUESTA (tipos de alerta, severidades, frecuencia esperada por cliente, respuesta del conector con la pausa global). No es diseño aprobado.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
