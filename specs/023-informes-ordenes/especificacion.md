# 023 · Informes recibidos, resumen y órdenes pausar o reanudar

Estado: APROBADA
Fase: 3 · Fecha: 12/11/2026 · Respuestas del responsable aplicadas: 13/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

El superadmin de HumanaIA necesita saber, sin abrir la carpeta `panel` de cada cliente, si los agentes de correo están funcionando y qué ha hecho cada uno en sus revisiones. También necesita poder detener el agente de un cliente y volver a ponerlo en marcha desde el panel, y saber con certeza si el agente ha recibido y aplicado esa orden.

Esta función cubre cuatro cosas: la lectura de los informes que envían los agentes (solo cifras, booleanos y valores de listas cerradas), tanto en la ficha de cada cliente como en una lista de todos los clientes; la exportación de las cifras del histórico de un cliente; la página de resumen con la que entra el superadmin, que ya señala los agentes sin señal; y las órdenes de pausar y reanudar con su ciclo completo de creación, entrega, confirmación, anulación y sustitución. La entrega y la confirmación las hace el conector de la fase 2; el panel crea, anula y muestra.

## Quién la usa y cómo

- Como **superadmin**, quiero ver de un vistazo cuántos clientes están activos, cuántos informes han llegado hoy, cuáles traen avisos o errores y qué agentes no dan señal, para saber qué necesita mi atención.
- Como **superadmin**, quiero consultar el histórico de informes de un cliente en un periodo, con su evolución, para comprobar que su agente trabaja con normalidad.
- Como **superadmin**, quiero buscar informes de todos los clientes filtrando por cliente, estado y fecha, para encontrar un patrón sin abrir las fichas una a una.
- Como **superadmin**, quiero exportar las cifras del histórico de un cliente, para analizarlas fuera del panel sin sacar nada que no sean cifras.
- Como **superadmin**, quiero pausar el agente de un cliente y saber cuándo lo ha recibido y si lo ha confirmado, para detenerlo con certeza ante un problema.
- Como **superadmin**, quiero reanudar un agente en pausa, anular una orden que todavía no se ha confirmado o sustituirla por la contraria, para corregir una decisión sin dejar órdenes contradictorias ni un cliente bloqueado.
- Como **responsable de HumanaIA**, quiero que cada orden creada, anulada o sustituida y cada exportación queden auditadas, y que ningún informe ni archivo exportado muestre contenido de correo, para cumplir los artículos 1, 2 y 3 de la constitución.

## Términos

Se usan con este significado en toda la especificación.

- **Revisión**: una ejecución del agente del cliente, que empieza cuando pide sus instrucciones al conector.
- **Informe**: las cifras que el agente envía al terminar una revisión, según el contrato del informe.
- **Orden viva**: orden en estado pendiente o entregada.
- **Anulación por sustitución**: anulación de la orden viva de un cliente que se produce al crear para ese cliente una orden nueva. Es distinta de la anulación a mano.
- **Pausa efectiva**: un cliente está en pausa efectiva cuando su orden no anulada más reciente es de tipo pausar, esté pendiente, entregada o confirmada. Es la regla con la que el conector decide servir el estado «pausada» (dependencia de la fase 2).
- **Hoy**: el día natural en hora de Madrid.
- **Frecuencia esperada**: la frecuencia de revisión registrada para el cliente en el sistema, no la que declara el agente en su informe.
- **Plazo de confirmación**: 2 veces la frecuencia esperada del cliente, contado desde la creación de la orden.
- **Sin señal**: situación de un cliente que cumple, en el momento de la consulta, la misma condición con la que la función 013 abre su alerta «sin señal», incluidas sus excepciones. Esta función no tiene una regla propia.
- **Periodo máximo**: 366 días, tanto para consultar como para exportar.

## Requisitos

### Acceso y aislamiento

| ID | Requisito |
| --- | --- |
| REQ-001 | Todas las vistas y acciones de esta función solo están disponibles para un superadmin cuya sesión tiene el doble factor verificado. Se comprueba en el servidor en cada petición y, además, en la base de datos, de forma que una consulta directa a la base de datos con cualquier otra sesión no lee ni escribe nada de lo que gestiona esta función. |
| REQ-002 | Todas las lecturas y escrituras de esta función se hacen con la sesión del usuario. Ninguna usa la clave secreta del proyecto de datos. |
| REQ-003 | El identificador de cliente o de orden que llega en una petición solo indica sobre qué se actúa; nunca concede permiso. Antes de actuar se comprueba que existe, que tiene el formato esperado y que la acción está permitida en su estado actual. |

### Informes

| ID | Requisito |
| --- | --- |
| REQ-004 | La ficha de cada cliente tiene una sección de informes con su histórico: periodo elegible (por defecto, los últimos 30 días; como mucho, el periodo máximo), orden por fecha de recepción (por defecto, el más reciente primero) y por estado, y paginación con el total de informes del periodo. Solo se muestran informes recibidos. |
| REQ-005 | De cada informe se muestran solo estos datos: fecha y hora de recepción, versión del esquema del informe, los campos del contrato del informe (estado, modo, asistente, almacenamiento, versión del prompt, frecuencia en horas, las seis cifras, las cuatro comprobaciones y los códigos de problema) y el número de campos descartados. Ningún otro dato. |
| REQ-006 | Cada código de problema se muestra con su descripción del catálogo de problemas, no solo con el código. |
| REQ-007 | El número de campos descartados se muestra solo como número. Si es mayor que cero se señala con una palabra, no solo con color. |
| REQ-008 | El estado de cada informe y cada comprobación se muestran con palabra, además de con color o icono. |
| REQ-009 | La sección de informes incluye un gráfico con la evolución diaria de las cifras del periodo (días en hora de Madrid) y una tabla equivalente con exactamente los mismos valores. Para «sin tratar» y «facturas pendientes», que son lo que queda al terminar la revisión, el valor de cada día es el del último informe recibido ese día, nunca la suma. Para «tratados», «borradores», «documentos» y «urgentes», que son lo hecho en cada revisión, el valor de cada día es la suma de los informes recibidos ese día. |
| REQ-010 | Los informes son de solo lectura en el panel: no hay ninguna acción para crearlos, editarlos ni borrarlos, y la base de datos rechaza esas operaciones también con la sesión de un superadmin. |
| REQ-011 | Ninguna vista, mensaje, aviso, error, registro ni archivo exportado de esta función contiene texto libre procedente del agente o del cliente, ni datos que no estén en el contrato del informe más los metadatos de REQ-005. La única exportación que ofrece esta función es la de REQ-072. |

### Página «Informes»

| ID | Requisito |
| --- | --- |
| REQ-068 | La página «Informes» lista los informes recibidos de todos los clientes. De cada uno muestra el cliente, con acceso a su ficha, y datos de REQ-005, al menos la fecha y hora de recepción y el estado con palabra. Se ordena por fecha de recepción (por defecto, el más reciente primero) y está paginada con el total de informes que cumplen los filtros. |
| REQ-069 | La página «Informes» se puede filtrar por cliente, por estado (los valores de la lista cerrada del contrato) y por periodo de recepción (por defecto, los últimos 30 días; como mucho, el periodo máximo). Los filtros se combinan entre sí y la vista muestra en todo momento qué filtros están aplicados. |
| REQ-070 | La página «Informes» no muestra ningún dato fuera de REQ-005 más el nombre del cliente, ni agrega cifras de varios clientes. |
| REQ-071 | La página «Informes» se abre desde una entrada propia del menú principal del panel de superadmin. |

### Exportación

| ID | Requisito |
| --- | --- |
| REQ-072 | Desde la sección de informes de la ficha de un cliente se pueden exportar a un archivo las cifras de los informes de ese cliente en el periodo elegido, que no puede superar el periodo máximo. La exportación termina dentro de un tiempo máximo que propone el diseño con datos del volumen de referencia y se aprueba en la puerta P1. No hay otra exportación en esta función. |
| REQ-073 | El archivo exportado contiene exactamente los informes de ese cliente recibidos en el periodo, todos y ninguno más, y de cada uno solo los datos de REQ-005, con los problemas como códigos del catálogo. No contiene texto libre ni datos de ningún otro cliente. |
| REQ-074 | Cada exportación deja exactamente una fila de auditoría con el autor, la acción de exportar, el cliente, el periodo exportado y la fecha. Nunca se entrega un archivo sin su fila de auditoría. |

### Resumen

| ID | Requisito |
| --- | --- |
| REQ-012 | La página «Resumen» es la página de entrada del superadmin tras iniciar sesión. |
| REQ-013 | El resumen muestra el número de clientes activos (los que no están dados de baja). |
| REQ-014 | El resumen muestra el número de informes recibidos hoy, desglosado por estado, y la lista de los informes de hoy con estado de aviso o de error, con el cliente de cada uno y acceso a su ficha. |
| REQ-015 | El resumen muestra el número de clientes sin señal y qué clientes son, con acceso a su ficha. La ficha de cada cliente sin señal lo indica con la palabra «Sin señal» en su sección de informes. |
| REQ-063 | Un cliente se muestra como sin señal si y solo si cumple la condición de «sin señal» de la función 013 en el momento de la consulta, con el mismo margen, el mismo criterio de qué cuenta como señal, el mismo ámbito y las mismas excepciones. «Sin señal» es estado del cliente: mostrarlo no crea, abre ni cierra alertas. |
| REQ-016 | Lo que pertenece a fases posteriores (alertas abiertas y su número, versión en cada canal, impagos) no aparece en el resumen: ni como tarjeta vacía, ni a cero, ni como «próximamente». |
| REQ-017 | Una tarjeta solo muestra variación respecto a un periodo anterior si ese periodo está completo, es decir, si el sistema ya recibía informes antes de que empezara. Si no, no muestra variación y dice que todavía no hay datos suficientes para comparar. |
| REQ-018 | Cada bloque del resumen se obtiene por separado. Si uno falla, los demás se muestran; el que ha fallado dice qué ha pasado y permite reintentar. Nunca muestra un cero, un guion ni un valor anterior que pueda leerse como dato. |

### Órdenes pausar y reanudar

| ID | Requisito |
| --- | --- |
| REQ-019 | La ficha de cada cliente tiene una sección de órdenes con su estado de pausa actual (REQ-027), el historial de sus órdenes y la acción que corresponde a su estado: «Pausar agente» o «Reanudar agente». |
| REQ-020 | La página «Órdenes» lista las órdenes de todos los clientes con cliente, tipo, estado, autor y fechas; se puede filtrar por estado y por cliente, se ordena por fecha de creación (por defecto, la más reciente primero) y está paginada. Las órdenes se crean de una en una: no hay selección de varios clientes. |
| REQ-021 | Una orden consta solo de su tipo (pausar o reanudar, lista cerrada), el cliente, el autor y las fechas de creación, entrega, confirmación y anulación. El autor se toma de la sesión y las fechas las pone el sistema. Una orden no tiene ningún campo de texto. |
| REQ-022 | Crear una orden exige confirmar en un diálogo que nombra el cliente y la acción, y dice qué va a pasar y cuándo: «Se aplicará en la siguiente revisión del agente». En una pausa dice además que el agente dejará de tratar el correo desde esa revisión hasta que se reanude. Cancelar el diálogo no crea nada. |
| REQ-023 | Cada orden muestra su estado (pendiente, entregada, confirmada o anulada) con palabra y con la fecha y hora de cada paso ocurrido. Una orden anulada indica si se anuló a mano o por sustitución. Solo el conector pasa una orden a entregada o a confirmada; el panel no ofrece esa acción y la base de datos la rechaza con la sesión de un usuario. |
| REQ-024 | Desde el panel solo se puede crear una orden (que nace pendiente) y anularla a mano. Se puede anular a mano una orden pendiente y una entregada sin confirmar. Una orden confirmada o anulada no cambia nunca más. |
| REQ-025 | Un cliente nunca tiene más de una orden viva. Al crear una orden para un cliente que ya tiene otra viva, la viva queda anulada por sustitución y la nueva nace pendiente. La creación de la nueva, la anulación de la viva y sus filas de auditoría se guardan juntas o no se guarda ninguna. |
| REQ-026 | Solo se puede pausar a un cliente que no está en pausa efectiva, y solo se puede reanudar a uno que sí lo está. |
| REQ-027 | El estado de pausa de cada cliente se muestra con palabra y distingue al menos estas seis situaciones: activo sin órdenes; pausa pedida pendiente de entrega; en pausa entregada sin confirmar; en pausa confirmada; reanudación pedida pendiente de entrega; reanudación entregada sin confirmar. Junto al estado se muestran las fechas de creación, entrega y confirmación de la orden que lo determina. |
| REQ-028 | Una orden viva cuyo tiempo desde la creación supera el plazo de confirmación (2 veces la frecuencia esperada del cliente) se señala con palabra en la página «Órdenes» y en la ficha del cliente. Una orden confirmada o anulada no se señala nunca. Esta función no genera alertas ni avisos fuera del panel por ello. |
| REQ-029 | Crear una orden, anularla a mano y anularla por sustitución dejan cada una exactamente una fila de auditoría con el autor, la acción (distinguible entre crear, anular a mano y anular por sustitución), el cliente, la orden y la fecha. La orden y su fila de auditoría se guardan juntas o no se guarda ninguna de las dos. |
| REQ-030 | Tras crear o anular una orden, lo que ve el superadmin es el estado leído después de la operación, no el que se supone que debería tener. |
| REQ-064 | Anular a mano una orden exige confirmar en un diálogo que nombra el cliente, el tipo y el estado de la orden. Si la orden está entregada, el diálogo avisa de que el agente ya la ha recibido y puede haberla aplicado, y de que en su siguiente revisión recibirá el estado que resulte de la anulación. Cancelar el diálogo no anula nada. |
| REQ-065 | Si el cliente tiene una orden viva, el diálogo de crear avisa de que existe, con su tipo y su estado, y de que quedará anulada al confirmar. Si está entregada, añade que el agente ya la ha recibido y puede haberla aplicado. |
| REQ-066 | Una orden anulada, a mano o por sustitución, no pasa nunca a entregada ni a confirmada: si el conector lo intenta, se rechaza y la orden sigue anulada, sin fecha de entrega o de confirmación posterior a la anulación. |
| REQ-043 | Se puede crear una orden para un cliente sin licencia vigente. El diálogo advierte de que el cliente no tiene licencia vigente y de que la orden se aplicará cuando su agente vuelva a pedir instrucciones. |
| REQ-044 | Se puede crear una orden para un cliente sin ninguna conexión activa. El diálogo advierte de que ningún agente la recibirá hasta que haya una conexión activa y de que, mientras tanto, aparecerá como sin confirmar cuando pase el plazo. |

### Auditoría de consultas

| ID | Requisito |
| --- | --- |
| REQ-067 | Solo dejan fila de auditoría crear una orden, anularla a mano o por sustitución y exportar. Consultar el resumen, el histórico de un cliente, la página «Informes» o la página «Órdenes» no deja ninguna. |

### Experiencia y operación

| ID | Requisito |
| --- | --- |
| REQ-031 | Cada vista de esta función (Resumen, sección de informes de la ficha, sección de órdenes de la ficha, página «Órdenes» y página «Informes») tiene los estados de carga, vacío con qué hacer a continuación, error con reintento, sin permiso y datos parciales, con los componentes de la función 020. |
| REQ-032 | Las vistas, los diálogos de crear y de anular y la exportación de esta función cumplen WCAG 2.2 AA. Cada gráfico tiene su tabla equivalente. |
| REQ-033 | Las vistas, los diálogos y la exportación se usan en un móvil de 320 píxeles de ancho sin desplazamiento horizontal de la página. |
| REQ-034 | Los textos están en español de España con trato de tú; los botones dicen lo que hacen; las fechas siguen el formato «12 nov 2026, 08:04» en hora de Madrid; los números llevan punto de miles y coma decimal; los errores dicen qué ha pasado y qué hacer, sin datos internos. |
| REQ-035 | Con el volumen de referencia (1.000 clientes, 200.000 informes en total de los que 20.000 son de un mismo cliente, y 5.000 órdenes), la primera página del histórico de un cliente, la página «Informes», la página «Órdenes» y el resumen responden en menos de 2 segundos en el percentil 95 de 20 cargas, en el entorno de desarrollo con datos ficticios. |
| REQ-036 | Los fallos de lectura, escritura y exportación de esta función quedan registrados para operación con la vista o acción, el resultado y un código de error. Nunca con valores recibidos, cifras de informes ni identificadores de sesión. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-037 | Administrador con sesión sin doble factor verificado | Ve el estado «sin permiso» o se le pide completar el doble factor. No lee informes, órdenes ni cifras del resumen, no exporta, y no crea ni anula órdenes, ni por la interfaz ni por consulta directa a la base de datos |
| REQ-038 | Usuario autenticado que no es administrador, incluido un usuario de un cliente | Estado «sin permiso». No ve ni siquiera los informes o las órdenes de su propio cliente por estas vistas, no exporta, y no crea ni anula órdenes, ni por la interfaz ni por consulta directa a la base de datos |
| REQ-039 | Petición sin sesión, con la sesión caducada o con el doble factor retirado entre abrir el diálogo o la exportación y confirmar | Se rechaza. No se crea, anula ni exporta nada y no se escribe auditoría |
| REQ-040 | Doble clic en confirmar o reenvío de la misma petición de crear | Se crea una sola orden y una sola fila de auditoría de creación. La segunda petición no anula por sustitución la orden que acaba de crear la primera |
| REQ-041 | Dos superadmin crean a la vez órdenes, iguales o contrarias, para el mismo cliente | Como mucho queda una orden viva conforme a REQ-025. Quien no ha podido crear la suya ve un mensaje con el estado actual del cliente. No queda ninguna orden a medias |
| REQ-042 | Orden para un cliente dado de baja | Se rechaza y no se crea nada. El mensaje dice que el cliente está dado de baja |
| REQ-045 | Anular una orden confirmada o ya anulada | Se rechaza sin cambios ni fila de auditoría de anulación. El mensaje muestra el estado actual de la orden |
| REQ-046 | Anular una orden en el mismo momento en que el conector la entrega | El resultado refleja el orden real de los hechos: si la entrega fue antes, la orden muestra su fecha de entrega y queda anulada; si la anulación fue antes, no se entrega. Nunca queda una orden entregada al agente sin constancia de su entrega |
| REQ-075 | Anular una orden en el mismo momento en que el conector la confirma | Solo se aplica uno de los dos hechos, el que ocurre antes: la orden queda confirmada y la anulación se rechaza conforme a REQ-045, o queda anulada y la confirmación se rechaza conforme a REQ-066. Nunca tiene a la vez fecha de confirmación y de anulación |
| REQ-076 | El estado de las órdenes del cliente cambia entre abrir el diálogo de crear o de anular y confirmarlo (otra orden creada o anulada, o la orden entregada o confirmada por el conector) | Se rechaza, no se crea ni se anula nada, y se muestra el estado actual para que el superadmin decida de nuevo con el aviso correcto |
| REQ-047 | Pausar a un cliente que ya está en pausa efectiva, o reanudar a uno que no lo está | Se rechaza en el servidor aunque la interfaz no ofrezca la acción. No se crea nada |
| REQ-048 | Tipo de orden distinto de pausar o reanudar | Se rechaza y no se crea nada. El valor recibido no aparece en el mensaje ni en los registros |
| REQ-049 | Identificador de cliente inexistente o mal formado en la petición de crear | Se rechaza con un mensaje genérico y no se crea nada |
| REQ-050 | Identificador de orden inexistente, mal formado o de un cliente distinto del de la ficha desde la que se anula | Se rechaza sin cambios |
| REQ-051 | Campos de más en la petición (estado, autor, fechas, otro cliente, cualquier texto) | No tienen ningún efecto: la orden nace pendiente, con el autor de la sesión y las fechas del sistema, y no se guarda ningún texto |
| REQ-052 | Con la sesión de un superadmin, intento directo de cambiar el estado de una orden a entregada o confirmada, de devolver a viva una orden anulada, de cambiar su tipo, su cliente, su autor, sus fechas o la forma en que se anuló, o de borrarla | La base de datos lo rechaza |
| REQ-053 | Con la sesión de un superadmin, intento directo de crear, cambiar o borrar un informe | La base de datos lo rechaza |
| REQ-054 | Informe con un código de problema que después se ha desactivado en el catálogo, o que ya no figura en él | Se muestra con su descripción y una marca de «retirado del catálogo», o con el código y «sin descripción» si no la hay. La vista no falla |
| REQ-055 | Informe con una versión de esquema posterior a la que conoce el panel | Se muestran los campos conocidos y se indica que el informe es de una versión de esquema posterior. Nunca se muestran ni se exportan campos desconocidos y la vista no falla |
| REQ-056 | Cliente sin ningún informe | Estado vacío que lo dice y sugiere comprobar sus conexiones. No se dibuja un gráfico con ejes a cero ni se muestra variación |
| REQ-057 | Periodo sin informes, o periodo inválido (fin anterior al inicio, fechas futuras o más largo que el periodo máximo de 366 días), en el histórico o en la página «Informes» | Periodo sin informes: estado vacío. Periodo inválido: se indica junto al selector qué corregir. Nunca un error interno |
| REQ-077 | Filtros de la página «Informes» manipulados: estado fuera de la lista cerrada, cliente inexistente o mal formado, parámetros de más | Se rechazan o se ignoran sin error interno y la vista indica qué corregir. El valor recibido no aparece en el mensaje ni en los registros, y nunca se muestran informes que no cumplan los filtros válidos |
| REQ-078 | Exportación con periodo inválido o de más de 366 días, o con un identificador de cliente inexistente o mal formado | Se rechaza. No se genera archivo ni fila de auditoría, y el mensaje dice qué corregir sin repetir el valor recibido |
| REQ-079 | Fallo de la base de datos o de la escritura de auditoría durante una exportación | No se entrega ningún archivo, ni completo ni incompleto, y no se muestra éxito. Nunca hay un archivo entregado sin su fila de auditoría |
| REQ-080 | Exportación de un periodo sin informes | Se dice que no hay informes que exportar en ese periodo. No se genera archivo ni fila de auditoría |
| REQ-058 | Miles de informes en un cliente, en el periodo o en la página «Informes» | La vista nunca carga todos a la vez; pagina y cumple el umbral de REQ-035 |
| REQ-059 | Una de las consultas del resumen falla y las demás no, incluida la de clientes sin señal | Estado de datos parciales conforme a REQ-018 |
| REQ-060 | Base de datos caída o sin respuesta | Lectura: estado de error con reintento. Crear, anular o sustituir: no se muestra éxito, no queda ninguna orden ni fila de auditoría a medias, y al recuperarse el estado es coherente |
| REQ-061 | Petición de crear, anular o exportar enviada desde otro sitio, o la página cargada dentro de otra | Se rechaza |
| REQ-062 | Nombre de cliente o descripción del catálogo que contiene marcado o caracteres especiales | Se muestra literalmente como texto; nunca se interpreta |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | **Extremo a extremo.** En el entorno de desarrollo, con el conector de la fase 2 y un agente de prueba programado cada hora sobre un cliente ficticio, se crean desde el panel 10 órdenes alternas (5 pausar y 5 reanudar, cada una tras confirmarse la anterior). En 10 de 10: la orden pasa a entregada en la primera revisión que empieza después de crearla, pasa a confirmada en esa misma revisión, el panel muestra ambos estados con sus fechas al volver a cargar la vista y no pasa más de 1 hora y 15 minutos entre la creación y la confirmación. En la revisión que recibe la pausa, el conector responde «pausada»; si se confirma D-013, además no entrega instrucciones | REQ-019, REQ-022, REQ-023, REQ-027, REQ-030 |
| CA-002 | **Acceso.** Pruebas automáticas con cuatro perfiles (sin sesión, administrador sin doble factor, usuario de un cliente y usuario autenticado sin rol) contra cada vista y cada acción de esta función, incluidas la página «Informes» y la exportación, y contra la base de datos directamente con esas mismas sesiones (pruebas en CI): 0 filas leídas, 0 órdenes creadas o anuladas, 0 archivos entregados, 0 filas de auditoría nuevas, y la retirada del doble factor entre abrir el diálogo o la exportación y confirmar no crea, anula ni exporta nada | REQ-001, REQ-037, REQ-038, REQ-039 |
| CA-003 | **Clave secreta.** Las pruebas de integración de esta función pasan con la clave secreta ausente del entorno de esas operaciones, y la revisión del `auditor-seguridad` encuentra 0 usos de la clave secreta en esta función | REQ-002 |
| CA-004 | **Contenido de un informe.** Con un informe ficticio que trae todos los campos y 3 campos de más, la sección de informes muestra exactamente los datos de REQ-005 (comparados con una lista cerrada: 0 datos de más y 0 de menos), el número 3 con su palabra de aviso, y el estado y las cuatro comprobaciones con palabra | REQ-005, REQ-007, REQ-008 |
| CA-005 | **Privacidad.** La revisión de privacidad (skill `revision-privacidad`) de las vistas, los mensajes, los diálogos, los registros de operación, las filas de auditoría y el archivo exportado de esta función encuentra 0 campos de texto libre y 0 datos fuera de REQ-005 (más el nombre del cliente en las vistas); el formulario de orden no tiene ningún campo de texto; la única acción de exportar es la de la sección de informes de la ficha | REQ-011, REQ-021, REQ-036, REQ-070 |
| CA-006 | **Catálogo.** Tres informes ficticios con un código activo, uno desactivado y uno que no figura en el catálogo se muestran con su descripción, con la marca «retirado del catálogo» y con «sin descripción» respectivamente, sin errores en la vista | REQ-006, REQ-054 |
| CA-007 | **Volumen y respuesta.** Con el volumen de referencia de REQ-035 cargado en datos ficticios: en el histórico del cliente con 20.000 informes y en la página «Informes», el total coincide con el número real de informes, el orden es correcto en la primera, una intermedia y la última página, y ninguna página trae más filas que su tamaño; la primera página del histórico, la página «Informes», la página «Órdenes» y el resumen responden cada una en menos de 2 segundos en el percentil 95 de 20 cargas | REQ-004, REQ-035, REQ-058 |
| CA-008 | **Gráfico y tabla.** Para 30 días de informes ficticios con valores conocidos y varios informes en algunos días, el 100 % de los valores de la tabla equivalente coinciden con los esperados por día en hora de Madrid: para «sin tratar» y «facturas pendientes», el del último informe del día (un día con valores 7 y luego 2 da 2, no 9); para «tratados», «borradores», «documentos» y «urgentes», la suma de los informes del día (un día con 7 y luego 2 da 9). El gráfico representa los mismos valores | REQ-009 |
| CA-009 | **Informes de solo lectura.** Con la sesión de un superadmin con doble factor, los intentos directos de crear, cambiar y borrar un informe son rechazados por la base de datos (pruebas en CI, 3 de 3); la interfaz no tiene ningún control para hacerlo | REQ-010, REQ-053 |
| CA-010 | **Contenido del resumen.** Con datos ficticios conocidos (clientes activos y de baja, informes de hoy de cada estado, un informe de las 23:59 de ayer y otro de las 00:01 de hoy en hora de Madrid, y alertas abiertas en la base de datos): las cifras de clientes activos e informes de hoy y su desglose son exactas, la lista de aviso y error contiene exactamente los informes esperados con enlace a su ficha, el resumen es la primera página tras iniciar sesión y no aparece ningún elemento de alertas (ni su número), canales ni impagos | REQ-012, REQ-013, REQ-014, REQ-016 |
| CA-011 | **Sin señal.** Con clientes ficticios a un lado y otro del margen de la función 013 y con cada una de sus excepciones, el conjunto de clientes sin señal que muestran el resumen y las fichas coincide en el 100 % de los casos con el que da la regla de la función 013 para los mismos datos y el mismo instante; la cifra del resumen es igual al número de clientes listados y cada uno enlaza a su ficha; consultar el resumen y las fichas no crea, abre ni cierra ninguna alerta | REQ-015, REQ-063 |
| CA-012 | **Variaciones.** Sin informes anteriores al periodo de comparación, ninguna tarjeta muestra variación y se lee el texto de datos insuficientes; con el periodo completo, la variación mostrada coincide con la calculada a mano | REQ-017 |
| CA-013 | **Datos parciales y caída.** Forzando el fallo de cada bloque del resumen por separado, incluido el de clientes sin señal, en el 100 % de los casos los demás se muestran, el que falla muestra error y reintento y no aparece ningún cero ni guion en su lugar. Con la base de datos inaccesible, cada vista muestra su estado de error con reintento | REQ-018, REQ-059, REQ-060 |
| CA-014 | **Crear con confirmación.** Cancelar el diálogo deja 0 órdenes nuevas. Confirmarlo crea 1 orden pendiente con el autor de la sesión y fechas del sistema, y la vista muestra el estado releído. El texto del diálogo contiene el nombre del cliente, la acción y «Se aplicará en la siguiente revisión del agente» | REQ-021, REQ-022, REQ-030 |
| CA-015 | **Transiciones.** Una matriz automática con cada estado de orden y cada intento de cambio, por el servidor y directamente contra la base de datos, y con los intentos del conector de entregar o confirmar órdenes anuladas a mano y por sustitución: el 100 % de los cambios permitidos por REQ-024 (incluida la anulación a mano de una orden entregada) se aplican y el 100 % de los no permitidos (incluidos los de REQ-045, REQ-052 y REQ-066) se rechazan sin cambios | REQ-023, REQ-024, REQ-045, REQ-052, REQ-066 |
| CA-016 | **Una sola orden viva.** 50 rondas de dos sesiones que crean a la vez órdenes iguales o contrarias para el mismo cliente, más 20 dobles clics: 0 clientes con dos órdenes vivas, 0 órdenes duplicadas, 0 órdenes anuladas por sustitución por un doble clic, el número de filas de auditoría de creación igual al de órdenes creadas y el de anulación por sustitución igual al de órdenes sustituidas | REQ-025, REQ-040, REQ-041 |
| CA-017 | **Coherencia de la acción.** Pausar a un cliente en pausa efectiva y reanudar a uno que no lo está, enviando la petición directamente al servidor: rechazado en 2 de 2, sin órdenes nuevas | REQ-026, REQ-047 |
| CA-018 | **Estado de pausa visible.** Para las seis situaciones de REQ-027 preparadas con datos ficticios, la ficha y la página «Órdenes» muestran la palabra y las fechas correctas en 6 de 6, y la ficha ofrece la acción que corresponde; en la página «Órdenes» no hay ningún control para seleccionar varios clientes | REQ-019, REQ-020, REQ-027 |
| CA-019 | **Órdenes sin confirmar.** Para un cliente con frecuencia esperada F de 24 horas y otro de 168 horas: una orden viva creada hace 2·F más 1 minuto aparece señalada y otra creada hace 2·F menos 1 minuto no (4 de 4); una orden confirmada y otra anulada creadas hace más de 2·F no aparecen señaladas; cambiar la frecuencia que declaran los informes no altera el resultado; en ningún caso se crea una alerta | REQ-028 |
| CA-020 | **Auditoría de órdenes.** Cada creación, cada anulación a mano y cada anulación por sustitución deja exactamente 1 fila de auditoría con autor, acción distinguible, cliente, orden y fecha (100 % de 30 operaciones, 10 de cada tipo). Forzando el fallo de la escritura de auditoría, la orden no se crea, no se anula y no se sustituye | REQ-029 |
| CA-021 | **Entradas manipuladas.** Tipo fuera de la lista, cliente inexistente o mal formado, orden inexistente, mal formada o de otro cliente, campos de más y peticiones de crear, anular o exportar desde otro origen o con la página incrustada: el 100 % se rechaza o no tiene efecto, y una búsqueda en mensajes y registros encuentra 0 apariciones de los valores enviados | REQ-003, REQ-048, REQ-049, REQ-050, REQ-051, REQ-061 |
| CA-022 | **Cliente sin condiciones.** Cliente de baja: orden rechazada, 0 órdenes nuevas y mensaje de baja. Cliente sin licencia vigente y cliente sin conexiones activas: la orden se crea pendiente (2 de 2) y el diálogo muestra su advertencia correspondiente antes de confirmar | REQ-042, REQ-043, REQ-044 |
| CA-023 | **Anulación contra entrega.** 20 repeticiones en las que se anula una orden mientras el conector la entrega: en el 100 % el estado final y sus fechas son coherentes con el orden real de los hechos y con REQ-024, y ninguna orden anulada antes de la entrega llega al agente | REQ-046 |
| CA-024 | **Fallo al escribir.** Con la base de datos cortada durante la creación, la anulación a mano y la sustitución: 0 órdenes a medias, 0 órdenes sustituidas sin su orden nueva, 0 filas de auditoría sin su orden, ningún mensaje de éxito, y tras recuperarla el estado mostrado coincide con el guardado | REQ-060, REQ-029 |
| CA-025 | **Estados de vista.** Capturas de las cinco vistas en sus cinco estados (25 de 25), incluido el cliente sin informes, el periodo vacío y el periodo inválido en el histórico y en la página «Informes» | REQ-031, REQ-056, REQ-057 |
| CA-026 | **Accesibilidad.** El comprobador automático de accesibilidad da 0 infracciones graves o críticas en las cinco vistas, los diálogos de crear y de anular y la exportación; la revisión manual con teclado y con lector de pantalla completa crear, anular, sustituir, filtrar la página «Informes», exportar y consultar el histórico sin ratón; el contraste medido es de al menos 4,5:1 en texto y 3:1 en componentes y gráficos; cada gráfico tiene tabla equivalente | REQ-032 |
| CA-027 | **Móvil.** A 320 píxeles de ancho, las cinco vistas, los diálogos y la exportación no tienen desplazamiento horizontal de la página y todas las acciones se completan con objetivos táctiles de al menos 24 por 24 píxeles | REQ-033 |
| CA-028 | **Textos y formatos.** Una revisión de todos los textos, fechas y números de esta función encuentra 0 textos fuera del español de España, 0 fechas o números con otro formato y 0 errores que muestren datos internos | REQ-034 |
| CA-029 | **Esquema posterior.** Un informe ficticio marcado con una versión de esquema posterior se muestra con sus campos conocidos y la indicación de versión posterior, sin errores en la vista, y al exportarlo el archivo contiene solo sus campos conocidos | REQ-055 |
| CA-030 | **Registros de operación.** Forzando 6 fallos distintos de lectura, escritura y exportación, cada uno deja un registro con vista o acción, resultado y código, y 0 registros contienen valores recibidos, cifras de informes o identificadores de sesión | REQ-036 |
| CA-031 | **Marcado literal.** Un nombre de cliente y una descripción del catálogo con marcado se muestran literalmente en todas las vistas de esta función, incluida la página «Informes», y no se ejecuta nada | REQ-062 |
| CA-032 | **Sustitución.** Para un cliente con una orden viva en cada uno de sus cuatro casos posibles (pausa pendiente, pausa entregada, reanudación pendiente, reanudación entregada), crear la orden contraria: en 4 de 4 el diálogo muestra el aviso de orden viva con su tipo y su estado (y el de ya recibida en los dos casos entregados), la viva queda anulada por sustitución con su fecha, la nueva queda pendiente y hay 2 filas de auditoría nuevas (creación y anulación por sustitución). Forzando el fallo de cualquiera de las escrituras, 0 cambios | REQ-025, REQ-065 |
| CA-033 | **Anular a mano.** Para una orden pendiente y otra entregada: cancelar el diálogo deja 0 cambios; el diálogo nombra cliente, tipo y estado, y solo en la entregada muestra el aviso de que el agente ya la ha recibido y puede haberla aplicado; confirmar la deja anulada a mano, con su fila de auditoría, y la vista muestra el estado de pausa releído | REQ-024, REQ-064 |
| CA-034 | **Anulación contra confirmación.** 20 repeticiones en las que se anula una orden entregada mientras el conector la confirma: en el 100 % la orden termina confirmada o anulada, nunca con las dos fechas, y el que llega segundo recibe un rechazo sin cambios | REQ-075 |
| CA-035 | **Estado cambiado bajo el diálogo.** Con el diálogo de crear o de anular abierto, otra sesión crea o anula una orden del mismo cliente, o el conector entrega o confirma la orden afectada; al confirmar el diálogo: rechazado en el 100 % de 4 situaciones, 0 órdenes creadas o anuladas, 0 filas de auditoría y la vista muestra el estado actual | REQ-076 |
| CA-036 | **Qué se audita.** Consultar 10 veces cada una de las cinco vistas deja 0 filas de auditoría nuevas; crear, anular a mano, sustituir y exportar dejan exactamente la fila que les corresponde | REQ-067 |
| CA-037 | **Página «Informes».** Con informes ficticios conocidos de 3 clientes y de los cuatro estados: cada filtro solo y cada combinación de cliente, estado y periodo devuelven exactamente los informes esperados (100 %), con el total correcto, el orden por defecto correcto y los filtros aplicados visibles; cada fila enlaza a la ficha de su cliente; las columnas se comparan con una lista cerrada (0 datos fuera de REQ-005 más el nombre del cliente) y no aparece ninguna cifra sumada de varios clientes; la página se abre desde su entrada del menú principal, también con teclado | REQ-068, REQ-069, REQ-070, REQ-071 |
| CA-038 | **Filtros manipulados.** Estado fuera de la lista, cliente inexistente y mal formado, periodo de 367 días y parámetros de más en la página «Informes»: el 100 % se rechaza o se ignora sin error interno, ninguna fila mostrada incumple los filtros válidos y una búsqueda en mensajes y registros encuentra 0 apariciones de los valores enviados | REQ-057, REQ-077 |
| CA-039 | **Contenido de la exportación.** Con dos clientes ficticios con informes conocidos a lo largo de 366 días, exportar el periodo completo de uno: la exportación termina dentro del tiempo máximo aprobado en la puerta P1 con el volumen de referencia; el número de informes del archivo es igual al real del periodo, cada informe trae exactamente los datos de REQ-005 (comparados con una lista cerrada) con los problemas como códigos, hay 0 datos del otro cliente y 0 campos de texto libre, y la revisión de privacidad (skill `revision-privacidad`) del archivo da 0 hallazgos | REQ-072, REQ-073 |
| CA-040 | **Auditoría de la exportación.** 10 exportaciones dejan 10 filas de auditoría con autor, acción de exportar, cliente, periodo y fecha. Forzando el fallo de la escritura de auditoría y, por separado, el de la base de datos durante la exportación: 0 archivos entregados y ningún mensaje de éxito | REQ-074, REQ-079 |
| CA-041 | **Exportaciones rechazadas.** Periodo de 367 días, fin anterior al inicio, fechas futuras, cliente inexistente, cliente mal formado y periodo sin informes: en 6 de 6, 0 archivos y 0 filas de auditoría; los cinco primeros muestran qué corregir sin repetir el valor recibido y el último dice que no hay informes que exportar | REQ-078, REQ-080 |

## Fuera de alcance

- Cálculo periódico de alertas, la página «Alertas», el número de alertas abiertas en el resumen y cualquier aviso fuera del panel, incluida la alerta por orden sin confirmar (fase 4). Aquí solo se señalan en pantalla las órdenes sin confirmar y los clientes sin señal.
- Revisiones que nunca enviaron informe: en la fase 3 solo se muestran informes recibidos (fase 4).
- Una regla propia de «sin señal»: se usa la de la función 013 y esta función no la cambia.
- Métricas por versión del prompt, versiones, canales y pausa global (fase 4). Esta función no agrega cifras por versión ni pausa a todos los clientes.
- Pausar o reanudar varios clientes a la vez: las órdenes se crean de una en una.
- Exportar cualquier cosa que no sean las cifras del histórico de un cliente: ni la página «Informes», ni las órdenes, ni el resumen, ni la auditoría, ni varios clientes en un mismo archivo.
- Auditar consultas: solo se auditan cambios y exportaciones.
- Dashboard de cliente (fase 5) y estado de cobro e impagos (fase 6).
- La entrega y la confirmación de órdenes, el registro de informes, el descarte de campos ajenos y la construcción del estado servido al agente: son del conector de la fase 2. Esta función no los cambia.
- Sistema de diseño, componentes comunes y menú principal (función 020), acceso con doble factor y gestión de administradores (función 021), lista y ficha de cliente, licencias, códigos y conexiones (función 022) y página de auditoría (función 024).
- Gestión del catálogo de problemas (altas, cambios de descripción, activación). Aquí solo se lee.
- Cualquier campo de texto en órdenes o informes, como un motivo o una nota: lo prohíbe el artículo 1.

## Cuestiones abiertas

**Las dieciséis cuestiones originales están resueltas** (respuestas del responsable del 12 y 13/11/2026 en `aclaraciones.md`): 1, sí: la fase 3 muestra «Sin señal» y su cifra, con la regla de la función 013 (REQ-015, REQ-063); 2, no: las revisiones sin informe esperan a la fase 4; 3, sí: página «Informes» con filtros (REQ-068 a REQ-071); 4, no: de uno en uno; 5, 2 veces la frecuencia esperada desde la creación (REQ-028); 6, sí: se anula a mano una orden entregada sin confirmar, con aviso (REQ-024, REQ-064); 7, la nueva sustituye a la viva, que queda anulada con su fila de auditoría (REQ-025, REQ-065, REQ-066); 8 y 9, se permite con advertencia, el cliente de baja sigue rechazado (REQ-043, REQ-044); 10, sí: se exportan las cifras del histórico de un cliente (REQ-072 a REQ-074); 11, D-013 se decide en la fase 1 (dependencia); 12, lectura confirmada, con nota aclaratoria del artículo 2; 13, no hay alertas en el resumen hasta la fase 4 (REQ-016); 14, «sin tratar» y «facturas pendientes» son lo que queda: último valor del día (REQ-009); 15, 1.000 clientes, menos de 2 segundos en el percentil 95 y periodo máximo de un año (REQ-035, REQ-057); 16, solo se auditan los cambios (REQ-067). **También está resuelta la cuestión 17**, nueva, que apareció al aplicar la 14: tratados, borradores, documentos y urgentes se suman por día (REQ-009, CA-008). Los otros dos huecos que salieron al aplicar las respuestas también tienen respuesta: «Sin señal» y «En pausa» se ven en la lista de clientes de la función 022 (dependencia) y el tiempo máximo de exportación lo propone el diseño y se aprueba en la puerta P1 (REQ-072).

Texto original de las cuestiones:

1. **Agentes sin señal en la fase 3.** El cálculo periódico y su alerta son de la fase 4. Opciones: (a) la fase 3 ya muestra la etiqueta «Sin señal» y la cifra del resumen, calculadas al consultar (último informe más antiguo que un múltiplo de la frecuencia esperada del cliente; habría que fijar el múltiplo, la arquitectura propone 2); (b) hasta la fase 4 solo se muestra la fecha del último informe y no hay cifra de sin señal. Con (a) el superadmin ve antes los agentes parados, pero la fase 4 tendrá que usar la misma regla para que la etiqueta y la alerta no se contradigan; con (b) no hay riesgo de contradicción, pero el resumen no responde a «¿funcionan los agentes?» hasta la fase 4.
2. **Revisiones que nunca enviaron informe.** Opciones: (a) se muestran ya en la sección de informes de la ficha como «revisión sin informe», con su fecha; (b) esperan a las alertas de la fase 4. Con (a) el histórico es completo, pero hay que fijar desde cuándo una revisión abierta cuenta como «sin informe»; con (b) un agente que empieza revisiones y nunca informa no se ve en la fase 3.
3. **Lista global de informes.** `docs/DISENO.md` no la prevé. Opciones: (a) solo el histórico de cada ficha y la lista de informes de hoy con aviso o error del resumen; (b) además, una lista de informes de todos los clientes con filtros. Con (b) se añade una vista más que hay que diseñar, probar y hacer accesible.
4. **Pausar varios clientes a la vez.** La pausa global es de la fase 4. Opciones: (a) solo de uno en uno; (b) selección múltiple en la página «Órdenes». Con (b) hay que definir qué pasa si unas órdenes se crean y otras no, y se acerca a la pausa global de la fase 4.
5. **Plazo de confirmación.** A partir de cuándo se señala una orden viva sin confirmar. Opciones: (a) un plazo fijo igual para todos (por ejemplo, 24 horas); (b) un múltiplo de la frecuencia esperada de cada cliente; (c) el mismo plazo que use la alerta de la fase 4, acordado ahora con esa fase. Con (a) es simple, pero señala en falso a clientes con revisiones espaciadas; con (b) se adapta a cada cliente; con (c) señal y alerta coinciden, pero depende de otra fase.
6. **Anular una orden entregada y sin confirmar.** Opciones: (a) solo se anulan las pendientes; (b) también las entregadas. Con (a) lo que vio el agente y lo que muestra el panel nunca divergen; con (b) se puede corregir más tarde, pero el agente puede haber aplicado ya la orden en una revisión y su confirmación posterior se rechazaría.
7. **Nueva orden con otra viva.** Opciones: (a) se rechaza la nueva y hay que anular antes la viva; (b) la nueva sustituye a la viva, que queda anulada automáticamente, con su propia fila de auditoría. Con (a) nada ocurre sin que el superadmin lo haga expresamente; con (b) es más rápido, pero si la viva ya estaba entregada choca con la cuestión 6.
8. **Orden para un cliente sin conexiones activas.** Opciones: (a) se rechaza; (b) se permite con advertencia y la recibirá el agente cuando haya conexión. Con (a) no quedan órdenes que nadie recibe; con (b) se puede dejar un cliente en pausa antes de su activación, pero la orden aparecerá como sin confirmar hasta entonces.
9. **Orden para un cliente sin licencia vigente.** El agente de ese cliente recibe «suspendida». Opciones: (a) se rechaza; (b) se permite con advertencia, para que el cliente siga en pausa si la licencia vuelve a estar vigente. Con (b) hay que confirmar con la fase 2 si el conector entrega y deja confirmar órdenes en estado «suspendida».
10. **Exportación de informes.** Opciones: (a) no hay exportación; (b) exportación de las cifras del histórico de un cliente. Con (b) el archivo exportado sale del sistema con datos de un cliente y necesita su propia revisión de privacidad, auditoría de la exportación y decidir el formato.
11. **D-013 sigue en PROPUESTO.** Esta función supone que en estado «pausada» el conector no entrega el prompt, solo el estado y la orden, y por eso el diálogo de pausa dice que el agente dejará de tratar el correo desde su siguiente revisión. Si D-013 se resuelve de otra forma, cambian el texto del diálogo, la parte final de CA-001 y lo que significa «en pausa» en REQ-027. Hace falta que el responsable confirme D-013 antes de aprobar esta especificación.
12. **Artículo 2 y el superadmin.** El artículo 2 dice que el identificador del cliente nunca se acepta como entrada y que en los dashboards se deriva de la sesión. Un superadmin, para pausar a un cliente concreto, tiene que indicar cuál. Esta especificación lo interpreta así: la sesión de superadmin con doble factor da el permiso sobre todos los clientes y el identificador solo elige sobre cuál se actúa (REQ-003). ¿Es correcta esta interpretación, o debe anotarse como aclaración de la constitución?
13. **Alertas abiertas en el resumen.** Los criterios de la fase 2 ya generan alertas (ejecución sin informe, reutilización de un token de renovación). Opciones: (a) el resumen de la fase 3 no muestra alertas hasta la fase 4; (b) muestra ya el número de alertas abiertas que existan. Con (a) se respeta el reparto, pero hay alertas que nadie ve durante la fase 3; con (b) se muestra una cifra sin la página «Alertas» donde gestionarlas.
14. **Qué significan «sin tratar» y «facturas pendientes».** El contrato no dice si son lo que queda al terminar la revisión o lo que se encontró en ella. Para la evolución diaria de REQ-009: (a) si son lo que queda, se muestra el último valor de cada día; (b) si son recuentos de la revisión, se suman. Elegir mal da cifras falsas en el gráfico (y en las métricas de la fase 4).
15. **Volumen de referencia y umbrales de respuesta.** Se proponen: 200 clientes, 200.000 informes en total, 20.000 de un mismo cliente y 5.000 órdenes; la primera página del histórico, la página «Órdenes» y el resumen en menos de 2 segundos en el percentil 95 de 20 cargas, en el entorno de desarrollo con datos ficticios. ¿Se aceptan estos valores o se fijan otros? También falta el periodo máximo que se puede elegir en el histórico (REQ-057).
16. **¿Consultar informes es una acción auditada?** El criterio de la fase 3 dice «cada acción de superadmin deja una fila de auditoría». Opciones: (a) solo se auditan los cambios (crear y anular órdenes); (b) también las consultas del histórico de un cliente. Con (b) la función 024 tendría que comprobar esa cobertura y la tabla de auditoría crece mucho más.

Cuestión nueva (resuelta el 13/11/2026: opción a, se suman):

17. **Cómo se agregan por día las otras cuatro cifras.** La respuesta a la 14 fija «sin tratar» y «facturas pendientes», pero REQ-009 también dibuja «tratados», «borradores», «documentos» y «urgentes», y ni el contrato ni el prompt 1.2 dicen si son lo hecho en la revisión o lo que queda al terminarla. Opciones: (a) las cuatro son lo hecho en cada revisión y se suman por día; (b) se suman «tratados», «borradores» y «documentos», y «urgentes» se trata como lo que queda (último valor del día); (c) otra lectura que fije el responsable. Elegir mal da cifras falsas en el gráfico, en la tabla equivalente y en las métricas de la fase 4. Bloquea CA-008.

## Dependencias y decisiones relacionadas

**Decisiones**: D-008 (problemas en lista cerrada), D-009 (tres herramientas; si se unen `confirmar_orden` y `enviar_informe`, la confirmación llega con el informe y CA-001 sigue siendo válido), D-013 (PROPUESTO; se decide en el chat de la fase 1. Si no se confirma, se revisan el texto del diálogo de pausa, la parte final de CA-001 y lo que significa «en pausa» en REQ-027), D-015 (reparto por fases), T-004 y T-005 (claves y patrón de RLS), V-108 (exigir doble factor en las políticas; sin ella REQ-001 no se puede cumplir en la base de datos), V-110 (librería de interfaz y de gráficos).

**Constitución**: artículos 1, 2, 3, 6, 7, 10, 12 y 13. Sobre el artículo 2, el responsable confirmó el 12/11/2026 la lectura de REQ-003 (la sesión de superadmin con doble factor da el permiso y el identificador solo elige sobre qué cliente se actúa); la nota aclaratoria en la constitución la aplica coordinación. Amenazas A-07, A-10, A-11, A-14, A-15 y A-21 de `docs/SEGURIDAD.md`.

**Contratos**: `contratos/informe.schema.json` (campos que se muestran y se exportan; se propone a coordinación aclarar en su descripción que «sin tratar» y «facturas pendientes» son lo que queda al terminar la revisión), `contratos/obtener-instrucciones.schema.json` (entrega de la orden y estado servido), `contratos/confirmar-orden.schema.json` (confirmación).

**Funciones de la fase 3**:

- 020: componentes, estados de vista, diálogos de confirmación, gráfico con tabla y menú principal. **La página «Informes» necesita una entrada en el menú principal que la 020 no tiene hoy**, y `docs/DISENO.md` tampoco la prevé. Sin ese cambio no se cumple REQ-071. Esta especificación no edita la 020: el cambio se pide por coordinación.
- 021: sesión con doble factor y quién es superadmin.
- 022: ficha de cliente donde van las secciones de informes y órdenes, y la exportación; estado de baja, licencia, conexiones y frecuencia esperada, que usan REQ-028, REQ-042, REQ-043 y REQ-044. Además, su lista de clientes muestra «Sin señal» y «En pausa» junto al estado de cada cliente: esta función fija las reglas (REQ-063 para «Sin señal», la pausa efectiva para «En pausa») y la 022 las muestra. Esta especificación no edita la 022: el cambio se pide por coordinación.
- 024: muestra las filas de auditoría de REQ-029 y REQ-074. Su inventario de acciones auditadas necesita dos entradas nuevas: la anulación por sustitución y la exportación.

**Lo que se supone de la fase 2** (el modelo de datos de referencia es una PROPUESTA y puede cambiar; si cambia, esta especificación se revisa):

- Los informes se guardan con fecha de recepción, versión de esquema, los campos del contrato y el número de campos descartados, sin nombres ni valores de esos campos.
- Existe un catálogo de problemas con descripción y marca de activo.
- Cada cliente tiene estado (activo o baja) y una frecuencia esperada de revisión.
- Las órdenes tienen tipo, estado, autor y fechas de cada paso, y guardan si se anularon a mano o por sustitución; el conector las pasa a entregada al servir instrucciones y a confirmada con `confirmar_orden`.
- **Cambio que se pide a la fase 2**: el conector no entrega ni deja confirmar una orden anulada (REQ-066, REQ-075); su confirmación se rechaza sin cambiar la orden.
- El conector entrega la orden y deja confirmarla también cuando el estado servido es «suspendida» (cliente sin licencia vigente, REQ-043), y una conexión nueva recibe la orden viva del cliente (REQ-044). Hay que confirmarlo con la fase 2.
- El conector decide el estado servido con la regla de pausa efectiva, y entrega la orden de pausa aunque el estado servido sea «pausada»; el arranque local del agente confirma la orden también en ese estado.
- La regla de «sin señal» de la función 013 (margen, qué cuenta como señal, ámbito y excepciones) está decidida y se puede evaluar en el momento de la consulta. Mientras tenga cuestiones sin respuesta, REQ-063 y CA-011 no se pueden cerrar. Lo mismo vale para la fase 4: su alerta usará esa regla.
- Se propone a la función 032 el mismo plazo de 2 veces la frecuencia esperada para su alerta de orden sin confirmar.
- Hay al menos una versión del prompt publicada en el entorno de desarrollo, para que el conector sirva «activa» tras una reanudación (necesario para CA-001).
- Las políticas de la base de datos exigen superadmin con doble factor para leer y escribir lo que usa esta función.

**Lo que se supone de la fase 1**: la app existe con sus entornos en la UE, CI con pruebas de base de datos y el comprobador del arnés; y D-013 está decidido.

**Diseño**: el formato del archivo exportado lo decide el diseño; debe cumplir REQ-073 y pasar la revisión de privacidad de CA-039.

**Entorno para CA-001**: el conector de la fase 2 desplegado en el entorno de desarrollo, con su base de datos y un agente de prueba programado sobre un cliente ficticio. Mientras no esté, CA-001 no se puede ejecutar y no se declara superado.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 13/11/2026 | Responsable | Aprobada (puerta P0). Respuesta expresa en el diálogo de preguntas del chat de la fase 3: «Apruebo la 023». El resumen presentado incluía las deducciones del `especificador` anotadas en `aclaraciones.md` |
