# 053 · Migración de los clientes actuales desde la carpeta `panel`

Estado: PROPUESTA
Fase: 6 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Hoy cada cliente ejecuta el agente de correo con el prompt 1.2, y HumanaIA lo vigila a través de una carpeta `panel` que el cliente comparte con quien se lo instaló: el agente deja allí un archivo `salud_…json` en cada revisión y atiende órdenes `orden_…_pausar` y `orden_…_reanudar`. Esta función lleva a cada uno de esos clientes al conector con licencia sin que su agente deje de funcionar, sin perder en ningún momento la capacidad de pausarlo, sin que entre en el sistema ningún dato de sus correos y con vuelta atrás probada. Al terminar, todos los clientes están en un estado final explícito y la carpeta `panel` deja de usarse para los migrados.

## Quién la usa y cómo

- Como **responsable de HumanaIA**, quiero decidir el orden de la migración, cuándo se pasa de una tanda a la siguiente y cuándo se detiene, para no poner en riesgo a todos los clientes a la vez.
- Como **superadmin que instala**, quiero un estado de migración por cliente y una lista de comprobación de cada paso, para saber en qué punto está cada uno y no saltarme ninguna comprobación.
- Como **cliente actual**, quiero saber antes qué cambia y qué no, y que mi agente siga trabajando durante el cambio, para no quedarme sin servicio ni perder el control sobre mi correo.
- Como **superadmin**, quiero poder pausar a un cliente durante toda la migración por un único canal conocido, para que una pausa nunca quede anulada por el otro canal.
- Como **responsable**, quiero poder devolver a un cliente al seguimiento anterior, para tener vuelta atrás si algo falla.

## Requisitos

Términos usados en esta especificación:

- **Carpeta `panel`**: la carpeta `agente_correo/panel/` del almacenamiento del cliente que comparte con HumanaIA según el prompt 1.2.
- **Paralelo**: periodo en el que se comparan las cifras que llegan por la carpeta `panel` con las que llegan por el conector.
- **Corte**: momento a partir del cual el conector es el único seguimiento del cliente.
- **Fuente de órdenes**: el canal (carpeta `panel` o conector) cuyas órdenes pausar y reanudar son las que valen para un cliente en un momento dado.
- **Plazo de vuelta atrás**: tiempo tras el corte durante el que se conserva todo lo necesario para volver al seguimiento anterior (cuestión abierta 16).
- **Cliente real**: cliente de HumanaIA con su correo real, por oposición a las cuentas de prueba de HumanaIA.

### Inventario y estado de la migración

| ID | Requisito |
| --- | --- |
| REQ-001 | Existe un inventario de todos los clientes que hoy usan el agente de correo con seguimiento de HumanaIA, tengan o no carpeta `panel`. Por cliente recoge solo: nombre comercial, asistente (de una lista cerrada), plan del asistente, almacenamiento en la nube (de una lista cerrada), frecuencia de revisión en horas, versión del prompt que ejecuta, si tiene carpeta `panel` compartida con HumanaIA, si su cuenta tiene también el agente de Apps Script y si es migrable según el resultado de la fase 1. |
| REQ-002 | El inventario no contiene ningún dato de los correos ni de los documentos del cliente, ni copia o extracto de los archivos de su carpeta `panel` ni de su carpeta `agente_correo`. |
| REQ-003 | Las evidencias de la migración (informes de paso, comparaciones del paralelo, actas de corte y de vuelta atrás) identifican a cada cliente por un identificador interno, sin nombre comercial, datos de contacto ni contenido de los archivos de su carpeta `panel`. |
| REQ-004 | Cada cliente del inventario tiene un estado de migración registrado y consultable por los superadmin. Se distinguen al menos estos estados: pendiente; no migrable, pendiente de decisión; preparado; instalado; en paralelo; migrado; vuelto atrás; se mantiene en `panel`; baja. Ningún usuario de un cliente ve el estado de migración de otro cliente. |
| REQ-005 | Cada cambio de estado de migración deja constancia en la auditoría de quién lo hizo, cuándo, y de qué estado a qué estado pasó. |
| REQ-006 | Un cliente solo pasa a «migrado» desde «en paralelo» y con el criterio de corte (REQ-027) cumplido. La única excepción es la que el responsable decida de forma expresa para los clientes sin carpeta `panel` (cuestión abierta 13). |

### Orden de la migración

| ID | Requisito |
| --- | --- |
| REQ-007 | El primer cliente que se migra es el cliente piloto de la fase 4. Ningún otro cliente sale del estado «pendiente» hacia «instalado» hasta que el piloto esté en «migrado». |
| REQ-008 | Después del piloto, los clientes se migran por tandas. Cada cliente pertenece a una sola tanda, asignada y registrada antes de que esa tanda empiece. |
| REQ-009 | Una tanda solo empieza cuando: ningún cliente de la tanda anterior está en «instalado» o «en paralelo»; no hay ningún incidente de la migración abierto; el número de vueltas atrás de la tanda anterior no supera el umbral fijado por el responsable (cuestión abierta 15); y el responsable autoriza expresamente esa tanda, con fecha. |
| REQ-010 | La migración se detiene, sin empezar ninguna instalación nueva, en cuanto ocurre cualquiera de estos hechos: una conexión ligada a la licencia de otro cliente; contenido de correo o texto libre dentro del sistema; un agente que trata el correo sin instrucciones válidas o fuera de sus límites; una pausa que no se aplica en la revisión siguiente; o una orden de detención del responsable. |
| REQ-011 | Al detenerse la migración, los clientes que estaban en curso conservan su estado, su fuente de órdenes y su agente funcionando; la detención no fuerza ningún corte. Reanudar la migración exige autorización expresa del responsable, con fecha. |

### Condiciones previas por cliente

| ID | Requisito |
| --- | --- |
| REQ-012 | A ningún cliente real se le da de alta una licencia en producción, se le genera un código de activación ni se le instala el conector antes de que conste la autorización de publicación del responsable (B-003), con fecha. Hasta que se resuelva la cuestión abierta 9, esto se aplica también al cliente piloto. |
| REQ-013 | Antes de generar el código de activación de un cliente consta, con fecha, que ha recibido el aviso previo (REQ-051) con la antelación que fije el responsable, y que se cumple lo que las funciones 050 (cobro) y 052 (textos legales) exijan para dar de alta a un cliente. |
| REQ-014 | Antes de instalar, consta registrado para el cliente que su asistente y su plan admiten un conector personalizado y la ejecución desatendida, según la decisión por asistente aprobada al cerrar la fase 1. |
| REQ-015 | Un cliente que no cumple REQ-014 queda en «no migrable, pendiente de decisión» con un motivo de lista cerrada (asistente no admitido, el plan no admite conectores, el plan no admite ejecución desatendida, otro) y no se le instala nada hasta que el responsable decida, con fecha, una de estas salidas: aplicar el plan B aprobado en la fase 1, mantenerlo en la carpeta `panel`, que el cliente cambie de plan o de asistente, o darlo de baja. |
| REQ-016 | La instalación se hace con la versión de `docs/INSTALACION-CLIENTE.md` vigente al empezar la tanda, que no está en estado BORRADOR, y con el plan B aprobado en la fase 1 cuando se aplique. |

### Alta e instalación

| ID | Requisito |
| --- | --- |
| REQ-017 | El alta del cliente y de su licencia en producción solo recoge los datos que la arquitectura permite guardar de un cliente. La frecuencia de revisión anotada en su ficha coincide con la de la tarea programada en su asistente. |
| REQ-018 | Antes de pasar a «en paralelo», consta para el cliente una lista de comprobación de los límites del agente en su asistente (constitución, artículo 8), cada punto con valor sí o no: el conector de correo no puede enviar, eliminar ni reenviar automáticamente; el de la nube no puede eliminar ni compartir; el permiso «sin preguntar» se limita a las tres herramientas del conector; el arranque local está guardado. Con un solo «no», el cliente no pasa a «en paralelo». |
| REQ-019 | La lista de comprobación de REQ-018 se repite inmediatamente antes del corte, con el mismo resultado exigido. |
| REQ-020 | Todo texto de instrucciones que reciba un agente durante la migración, incluido el de un posible periodo de transición, es una versión del prompt registrada por despliegue revisado y con huella (constitución, artículo 9). Ni el panel ni la persona que instala entregan instrucciones redactadas para un cliente concreto. |
| REQ-021 | En ningún momento de la migración hay dos tareas programadas del agente tratando el correo nuevo del mismo cliente. |
| REQ-022 | En cada cambio de la migración (instalación, inicio del paralelo, corte, vuelta atrás), el tiempo entre la última revisión con el seguimiento anterior y la primera con el nuevo no supera un intervalo de la frecuencia de revisión del cliente. |
| REQ-023 | Hasta que termine el plazo de vuelta atrás, nadie de HumanaIA elimina ni pide eliminar la copia del prompt 1.2 que el cliente tiene en su nube ni su carpeta `panel`. |

### Periodo en paralelo

| ID | Requisito |
| --- | --- |
| REQ-024 | Durante el paralelo, las cifras que llegan por la carpeta `panel` y las que llegan por el conector proceden de las mismas revisiones del agente, de modo que cada revisión se puede comparar con su pareja. |
| REQ-025 | Para cada revisión del paralelo se comparan estos valores: estado, modo, frecuencia en horas, tratados, sin tratar, borradores, documentos, facturas pendientes, urgentes y las cuatro comprobaciones (correo, almacenamiento, contexto, registro). |
| REQ-026 | No hay doble contabilidad: en el periodo comparado, el número de revisiones registradas en el conector y el número de archivos de salud de la carpeta `panel` difieren como mucho en el umbral que fije el responsable, y ninguna revisión cuenta dos veces en las cifras ni en las métricas del cliente. |
| REQ-027 | Criterio de corte: durante el número de días consecutivos que fije el responsable, el porcentaje de revisiones cuyos valores de REQ-025 coinciden alcanza el umbral que fije el responsable, se cumple REQ-026, y hay al menos una revisión en modo desatendido cada día del periodo. |
| REQ-028 | Si las cifras no alcanzan el umbral, no hay corte: queda registrado qué valores de REQ-025 discreparon y en cuántas revisiones, y el cómputo de días consecutivos vuelve a empezar después de identificar la causa. |
| REQ-029 | Para comparar, HumanaIA solo lee los archivos de salud de la carpeta `panel`; no lee nada más del almacenamiento ni del correo del cliente. Lo que se guarda de la comparación son cifras, fechas y nombres de los valores de REQ-025, nunca el contenido de los campos `cliente` ni `problemas` del archivo de salud. |

### Fuente de órdenes

| ID | Requisito |
| --- | --- |
| REQ-030 | Cada cliente tiene en cada momento una sola fuente de órdenes, registrada y consultable por los superadmin: la carpeta `panel` antes del paralelo, el conector después del corte, y durante el paralelo la que decida el responsable (cuestión abierta 11). |
| REQ-031 | Todo cambio de fuente de órdenes, incluida la vuelta atrás, conserva el estado efectivo del agente: si estaba en pausa, sigue en pausa en la primera revisión posterior al cambio; si no lo estaba, el cambio por sí solo no lo pausa ni lo reanuda. |
| REQ-032 | Una orden emitida por el canal que no es la fuente de órdenes del cliente no cambia el comportamiento de su agente ni anula una pausa vigente. El panel superadmin no da por emitida una orden por el conector a un cliente cuya fuente es la carpeta `panel`, e indica cuál es su fuente. |
| REQ-033 | Toda pausa o reanudación emitida durante la migración por la fuente vigente se refleja en el estado de la revisión siguiente del agente, y queda constancia de esa revisión. |

### Corte y retirada de la carpeta `panel`

| ID | Requisito |
| --- | --- |
| REQ-034 | El corte de un cliente solo se hace con REQ-027 y REQ-019 cumplidos, y queda registrado con fecha y con la persona que lo hizo. |
| REQ-035 | Tras el corte, el agente del cliente solo sigue las instrucciones servidas por el conector: no ejecuta el prompt 1.2, no crea archivos en la carpeta `panel` y no atiende órdenes de ella. |
| REQ-036 | Durante el plazo de vuelta atrás, se comprueba cada día que en la carpeta `panel` del cliente migrado no aparece ningún archivo de salud nuevo, y queda constancia de cada comprobación. |
| REQ-037 | Ni el agente ni el servidor comparten, dejan de compartir, borran ni mueven la carpeta `panel` ni ningún otro archivo del cliente. Dejar de compartir la carpeta es una acción del cliente o de una persona de HumanaIA junto con él. |
| REQ-038 | Al terminar el plazo de vuelta atrás, la carpeta `panel` de cada cliente migrado ya no está compartida con ninguna cuenta de HumanaIA, y consta con fecha. Qué se hace con su contenido lo decide el cliente, que es su titular. |
| REQ-039 | Desde el corte, las herramientas internas de seguimiento por la carpeta `panel` no se usan para ese cliente: ni para leer su salud ni para dejarle órdenes. |

### Vuelta atrás

| ID | Requisito |
| --- | --- |
| REQ-040 | Se puede volver al seguimiento anterior desde «instalado», «en paralelo» y «migrado» dentro del plazo de vuelta atrás. Al terminar, el agente ejecuta el prompt 1.2 con su tarea programada, deja sus archivos de salud en la carpeta `panel`, la fuente de órdenes es la carpeta y las conexiones del cliente en el conector están revocadas. |
| REQ-041 | Durante la vuelta atrás el agente no se queda sin instrucciones: se cumple REQ-022 y no hay ninguna revisión que trate el correo sin unas instrucciones válidas. |
| REQ-042 | El procedimiento de vuelta atrás, desde cada uno de los tres estados de REQ-040, se ejecuta completo en una cuenta de prueba de HumanaIA antes de migrar al primer cliente real, y de nuevo después de cada cambio del procedimiento, con evidencia. |
| REQ-043 | Cada vuelta atrás queda registrada con fecha, persona y motivo de lista cerrada. El cliente queda en «vuelto atrás» y un nuevo intento de migrarlo exige decisión expresa del responsable. |

### Aislamiento entre clientes

| ID | Requisito |
| --- | --- |
| REQ-044 | Cada conexión creada en la migración queda ligada a la licencia del cliente en cuyo asistente se introdujo el código. Se comprueba de dos formas, y consta: la conexión nueva aparece en la ficha de ese cliente y en la de ningún otro; y las cifras de sus primeras revisiones por el conector coinciden con las de la carpeta `panel` de ese mismo cliente. |
| REQ-045 | Para cada cliente hay como mucho una migración abierta y como mucho un código de activación vigente. |
| REQ-046 | Si un código se usó en el asistente de un cliente distinto del que figura en la ficha, existe un procedimiento escrito que: revoca de inmediato esa conexión; excluye de las cifras de la ficha equivocada los informes recibidos por ella, sin trasladarlos a otra ficha; registra el incidente; detiene la migración (REQ-010); y activa la valoración de brecha que establezca la función 052. |
| REQ-047 | En cualquier importación desde una carpeta `panel`, el cliente de destino se deriva de la relación entre esa carpeta y el cliente registrada en el inventario. Nunca se toma del contenido del archivo (campo `cliente`) ni de su nombre. |

### Privacidad

| ID | Requisito |
| --- | --- |
| REQ-048 | Durante toda la migración no entra en el sistema ningún contenido de correo ni texto libre: ni en el alta, ni en la comparación del paralelo, ni en los estados de migración, ni en una importación, ni en el registro de la comunicación con el cliente. |
| REQ-049 | Si se importa histórico (cuestión abierta 2), de cada archivo de salud solo entran la fecha de la revisión y los valores que el contrato del informe admite como enteros acotados, booleanos o valores de listas cerradas. Los campos `cliente` y `problemas` se descartan sin registrarlos. Cualquier otro campo se descarta y solo se cuenta cuántos había, sin guardar su nombre ni su valor. Un archivo que no es JSON válido o con un valor fuera de rango o de lista se rechaza entero, sin registrar sus valores. |
| REQ-050 | El histórico importado se distingue de los informes recibidos por el conector, no se solapa con ellos en el tiempo (ninguna revisión aparece como importada y como recibida) y no genera alertas. |

### Comunicación y cobro

| ID | Requisito |
| --- | --- |
| REQ-051 | Cada cliente recibe un aviso previo que dice al menos: qué cambia (el seguimiento pasa al conector; para pausar, se pide a HumanaIA; si el servicio de HumanaIA no responde, el agente no revisa ese turno; la carpeta `panel` deja de usarse y qué hacer con ella lo decide él); qué no cambia (el agente sigue sin enviar correo y lo deja todo en borrador; a HumanaIA solo llegan cifras y estados); el calendario previsto de instalación, paralelo y corte; que hay vuelta atrás; y a quién acudir. |
| REQ-052 | Cada cliente recibe aviso del corte y, al terminar el plazo de vuelta atrás, de que puede dejar de compartir la carpeta `panel` y de las opciones que tiene con ella. |
| REQ-053 | Los textos legales que se remiten o enlazan al cliente durante la migración son las versiones vigentes publicadas por la función 052; esta función no redacta textos legales propios. |
| REQ-054 | Migrar no cambia por sí solo cómo paga el cliente: un cliente migrado sin suscripción en Stripe no queda suspendido por ese motivo mientras el responsable no decida otra cosa (cuestión abierta 8). El alta del cobro sigue la función 050. |

### Cierre

| ID | Requisito |
| --- | --- |
| REQ-055 | Al cerrar la función, todos los clientes del inventario están en un estado final: «migrado», «se mantiene en `panel`» o «baja». |
| REQ-056 | Cada cliente en «se mantiene en `panel`» tiene una decisión expresa del responsable, con fecha y motivo de lista cerrada. Las herramientas internas de seguimiento por la carpeta `panel` solo siguen en uso para esos clientes. |
| REQ-057 | Al cerrar la función, ninguna carpeta `panel` de un cliente migrado sigue compartida con una cuenta de HumanaIA. |
| REQ-058 | La migración no modifica ni detiene el agente de Apps Script de ningún cliente. Los clientes que lo tienen solo entran en esta migración si el responsable lo decide (cuestión abierta 6). |
| REQ-059 | Un cliente que decide darse de baja durante la migración sigue el procedimiento de baja de `docs/INSTALACION-CLIENTE.md` y lo que establezca la función 052, y queda en «baja». |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-060 | El código de activación de un cliente se introduce en el asistente de otro cliente. | La comprobación de REQ-044 lo detecta; se aplica el procedimiento de REQ-046; ningún dato del cliente equivocado queda en la ficha del otro; la migración se detiene. |
| REQ-061 | Tras el corte, el agente de un cliente sigue ejecutando el prompt 1.2 o creando archivos de salud en la carpeta `panel`. | La comprobación diaria de REQ-036 lo detecta; el cliente no se da por migrado hasta corregirlo; queda registrado como incidente de la migración. |
| REQ-062 | Alguien deja un archivo de orden en la carpeta `panel` de un cliente después del corte. | El agente no lo atiende; su comportamiento lo decide solo el conector. La pausa que se quisiera dar se emite por el conector. |
| REQ-063 | Durante el paralelo hay órdenes contradictorias: pausa por un canal y reanudación por el otro. | Vale solo la fuente de órdenes registrada (REQ-030); una pausa vigente en la fuente no se levanta por el otro canal; queda constancia. |
| REQ-064 | La instalación falla a mitad (no se autoriza el conector, no se guardan los límites, la ejecución programada no funciona). | El agente sigue funcionando con el prompt 1.2 y su tarea programada; se cumplen REQ-021 y REQ-022; el cliente queda en «preparado» o «vuelto atrás» y el fallo queda registrado. |
| REQ-065 | El asistente o el plan del cliente no admite el conector o la ejecución desatendida. | No se instala nada; el cliente queda en «no migrable, pendiente de decisión» hasta la decisión del responsable (REQ-015). |
| REQ-066 | Las cifras del paralelo no coinciden dentro del umbral. | No hay corte; se aplica REQ-028. |
| REQ-067 | Se importa un archivo de salud con frases libres en `problemas`, un nombre en `cliente` o campos de más. | Las frases, el nombre y los campos de más no entran en el sistema ni en los registros; solo se cuenta cuántos campos de más había (REQ-049). |
| REQ-068 | Se intenta importar a la ficha de un cliente los archivos de la carpeta `panel` de otro, o un archivo cuyo campo `cliente` nombra a otro cliente. | El destino lo fija solo el inventario (REQ-047); la importación de una carpeta a una ficha que no le corresponde en el inventario se rechaza; el campo `cliente` no influye. |
| REQ-069 | Se intenta migrar un cliente real antes de la autorización de publicación (B-003). | No se da de alta su licencia en producción ni se genera su código (REQ-012). |
| REQ-070 | Una vuelta atrás deja al agente sin instrucciones: el prompt 1.2 ya no está en la nube del cliente o no hay tarea programada. | No ocurre: REQ-023 conserva lo necesario; si aun así ocurre, el agente no trata el correo sin instrucciones válidas y queda registrado como incidente que detiene la migración. |
| REQ-071 | Quedan activas a la vez la tarea programada del prompt 1.2 y la del conector sobre el mismo correo. | No ocurre (REQ-021); si se detecta, se desactiva una de ellas en ese momento y se registra como incidente. |
| REQ-072 | El conector no responde durante el paralelo o tras el corte. | El agente no trata el correo en esa revisión (cierre en fallo) y no recurre por su cuenta al prompt 1.2 guardado en la nube del cliente. |
| REQ-073 | El cliente está en pausa en el momento del cambio de fuente de órdenes, del corte o de la vuelta atrás. | Sigue en pausa en la primera revisión posterior (REQ-031). |
| REQ-074 | La lista de comprobación de límites tiene algún «no», o los permisos del asistente han cambiado entre la instalación y el corte. | El cliente no pasa a «en paralelo» ni a «migrado» hasta que todos los puntos sean «sí» (REQ-018, REQ-019). |
| REQ-075 | Un usuario sin rol de superadmin (incluido un usuario de un cliente) intenta consultar o cambiar el estado de migración, la fuente de órdenes, o lanzar una importación. | Se deniega; no cambia nada; no se le revela si el cliente existe. |
| REQ-076 | El mismo archivo de salud se importa dos veces. | No hay duplicados: la revisión cuenta una sola vez. |
| REQ-077 | Dos personas inician a la vez la migración del mismo cliente o generan a la vez un código para él. | Solo una prospera (REQ-045); la otra se rechaza y queda constancia. |
| REQ-078 | Se crea una orden en el panel superadmin para un cliente cuya fuente de órdenes es la carpeta `panel`. | No se da por emitida y el panel indica la fuente vigente (REQ-032). |
| REQ-079 | Se importa un archivo de salud que no es JSON válido o con un valor fuera de rango o fuera de lista. | El archivo se rechaza entero, sin registrar sus valores (REQ-049). |
| REQ-080 | Un archivo de la carpeta `panel` (de salud o de orden) contiene texto que pide cambiar el estado de migración, la fuente de órdenes, los permisos o el alcance. | Es un dato, no una orden (constitución, artículo 7): no cambia nada y su texto no se registra. |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Los criterios que exigen provocar un fallo se ejecutan en cuentas de prueba de HumanaIA, nunca con clientes reales. Los números que solo puede fijar el responsable (días en paralelo, umbrales, plazos) se toman de `aclaraciones.md` una vez resueltas las cuestiones abiertas.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Una persona distinta de quien elaboró el inventario lo revisa: el 100 % de los clientes con seguimiento de HumanaIA figura en él con todos los campos de REQ-001; 0 campos o adjuntos con datos de correos o de archivos del cliente. Una búsqueda de cada nombre comercial del inventario en las evidencias de la migración y en el repositorio da 0 apariciones. | REQ-001 a REQ-003 |
| CA-002 | En una cuenta de prueba se recorren todos los estados de REQ-004: cada cambio aparece en la consulta de superadmin y en la auditoría (100 %); el paso directo de «pendiente» o «instalado» a «migrado» se rechaza; un usuario de cliente y un usuario sin rol de superadmin reciben denegación al consultar o cambiar el estado, la fuente de órdenes o lanzar una importación, sin cambios. | REQ-004 a REQ-006, REQ-075 |
| CA-003 | El registro de estados muestra que el piloto llegó a «migrado» antes de que cualquier otro cliente saliera de «pendiente» hacia «instalado», y que cada cliente tiene una sola tanda, asignada antes de su fecha de inicio (100 %). | REQ-007, REQ-008 |
| CA-004 | Para cada tanda hay una autorización expresa del responsable con fecha, posterior a que la tanda anterior cumpliera las condiciones de REQ-009. 0 tandas iniciadas sin ella. | REQ-009 |
| CA-005 | Simulacro en cuentas de prueba: se provoca una condición de detención de REQ-010 con un cliente de prueba en paralelo. Resultado: 0 instalaciones nuevas hasta la autorización de reanudar; el cliente en paralelo conserva estado, fuente de órdenes y revisiones sin interrupción. | REQ-010, REQ-011 |
| CA-006 | Para el 100 % de los clientes reales, la fecha del alta de su licencia en producción y la de su primer código de activación son posteriores a la autorización de publicación (B-003). | REQ-012, REQ-069 |
| CA-007 | Para el 100 % de los clientes migrados constan, con fecha anterior al primer código, el aviso previo con los puntos de REQ-051, lo exigido por las funciones 050 y 052 y la compatibilidad de REQ-014; y la guía de instalación usada no está en BORRADOR. | REQ-013, REQ-014, REQ-016, REQ-051 |
| CA-008 | El 100 % de los clientes no migrables tiene motivo de lista cerrada y decisión del responsable con fecha; 0 de ellos tiene conector instalado sin esa decisión. | REQ-015, REQ-065 |
| CA-009 | Para el 100 % de los clientes migrados, la ficha solo contiene campos permitidos por la arquitectura y la frecuencia anotada coincide con la de su tarea programada. | REQ-017 |
| CA-010 | El 100 % de los clientes migrados tiene la lista de límites con todos los puntos en «sí» antes del paralelo y otra antes del corte. En una cuenta de prueba, con un punto en «no», el paso a «en paralelo» y el corte quedan bloqueados. | REQ-018, REQ-019, REQ-074 |
| CA-011 | El 100 % de las instrucciones servidas a clientes durante la migración corresponde a versiones registradas con huella; 0 textos entregados que no figuren en el registro de versiones. | REQ-020 |
| CA-012 | Para cada cliente y cada cambio de REQ-022: 0 periodos con dos tareas programadas activas sobre el mismo correo, y el hueco entre revisiones consecutivas no supera un intervalo de su frecuencia. En una cuenta de prueba se interrumpe la instalación en tres puntos distintos y el agente sigue revisando con el prompt 1.2 en los tres casos. | REQ-021, REQ-022, REQ-064, REQ-071 |
| CA-013 | Para cada cliente migrado, durante los días en paralelo fijados por el responsable: porcentaje de revisiones coincidentes en los valores de REQ-025 mayor o igual al umbral fijado; diferencia en número de revisiones dentro del umbral fijado; 0 revisiones contadas dos veces; al menos una revisión desatendida por día; y lo guardado de la comparación no contiene el contenido de `cliente` ni de `problemas`. | REQ-024 a REQ-027, REQ-029 |
| CA-014 | En una cuenta de prueba se provoca una discrepancia en un valor: no se puede hacer el corte, queda registrado el valor discrepante y el cómputo de días vuelve a cero. | REQ-028, REQ-066 |
| CA-015 | En cuentas de prueba, para cada opción de fuente durante el paralelo: (a) pausa por la fuente y reanudación por el otro canal: el agente sigue en pausa en las 2 revisiones siguientes; (b) cambio de fuente, corte y vuelta atrás con pausa vigente: sigue en pausa en la primera revisión posterior; (c) orden creada en el panel para un cliente con fuente en la carpeta: no se da por emitida y se indica la fuente; (d) cada pausa y reanudación válida se refleja en la revisión siguiente (100 %). | REQ-030 a REQ-033, REQ-063, REQ-073, REQ-078 |
| CA-016 | Para el 100 % de los clientes migrados, el corte consta con fecha y persona, y las comprobaciones diarias del plazo de vuelta atrás encuentran 0 archivos de salud nuevos en su carpeta `panel`. En una cuenta de prueba migrada se deja un archivo de orden de pausa en la carpeta: el agente no se pausa y sigue informando por el conector. | REQ-034 a REQ-036, REQ-061, REQ-062 |
| CA-017 | Revisión de los permisos del conector y de los registros del agente y del servidor: 0 acciones de compartir, dejar de compartir, borrar o mover archivos del cliente. Al terminar el plazo de vuelta atrás de cada cliente: 0 carpetas `panel` de migrados compartidas con cuentas de HumanaIA, 0 usos de las herramientas internas por carpeta para migrados desde su corte, y la copia del prompt 1.2 y la carpeta presentes hasta esa fecha. | REQ-023, REQ-037 a REQ-039, REQ-057 |
| CA-018 | Antes del primer cliente real, en una cuenta de prueba, se ejecuta la vuelta atrás desde «instalado», «en paralelo» y «migrado» (3 de 3 con éxito): estado final de REQ-040, hueco entre revisiones no mayor que un intervalo, 0 revisiones que traten correo sin instrucciones válidas, conexiones revocadas y registro con motivo. Se repite tras cada cambio del procedimiento. | REQ-040 a REQ-043, REQ-070 |
| CA-019 | El 100 % de las conexiones creadas en la migración tiene las dos comprobaciones de REQ-044. Con dos cuentas de prueba se introduce el código de una en el asistente de la otra: la conexión se revoca, 0 informes suyos quedan en las cifras de la ficha equivocada, el incidente queda registrado y la migración se detiene. | REQ-044 a REQ-046, REQ-060 |
| CA-020 | Importación de prueba con archivos que contienen frases en `problemas`, un nombre de otro cliente en `cliente`, campos de más, un valor fuera de rango, un JSON no válido, un archivo repetido y un texto con instrucciones: solo entran fecha y valores admitidos; los archivos no válidos se rechazan enteros; 0 duplicados; el destino es siempre el del inventario y la importación cruzada se rechaza; la búsqueda de las cadenas de prueba en base de datos, registros, supervisión y evidencias da 0 apariciones; el histórico se distingue, no se solapa con informes del conector y no genera alertas. | REQ-047 a REQ-050, REQ-067, REQ-068, REQ-076, REQ-079, REQ-080 |
| CA-021 | Dos intentos simultáneos de abrir la migración o generar un código para el mismo cliente de prueba: prospera 1 de 2 y queda constancia del rechazo. | REQ-045, REQ-077 |
| CA-022 | En una cuenta de prueba, con el conector no disponible, en paralelo y tras el corte: 0 correos tratados en esas revisiones y 0 ejecuciones del prompt 1.2 por iniciativa del agente. | REQ-072 |
| CA-023 | El 100 % de los clientes migrados tiene constancia del aviso previo, del aviso de corte y del aviso de fin del plazo con las opciones de su carpeta; los textos legales enlazados coinciden con las versiones vigentes de la función 052. | REQ-051 a REQ-053 |
| CA-024 | En una cuenta de prueba migrada sin suscripción en Stripe, la licencia sigue activa durante al menos el periodo de gracia de prueba más un día. | REQ-054 |
| CA-025 | Al cerrar la función: 100 % del inventario en «migrado», «se mantiene en `panel`» o «baja»; 100 % de los «se mantiene en `panel`» con decisión, fecha y motivo; 0 carpetas `panel` de migrados compartidas con HumanaIA; 0 cambios en agentes de Apps Script atribuibles a la migración; 100 % de las bajas con el procedimiento de baja aplicado. | REQ-055 a REQ-059 |
| CA-026 | Revisión de privacidad (skill `revision-privacidad`) de la base de datos, los registros, la supervisión y las evidencias generados por la migración: 0 contenidos de correo y 0 textos libres. | REQ-003, REQ-048 |

## Fuera de alcance

- Construir el conector, los dashboards, el registro de versiones o el prompt 1.3 (fases 1 a 5).
- El cobro y el alta en Stripe (función 050). Aquí solo se exige que migrar no altere el cobro por sí solo.
- Los textos legales, los plazos de conservación y el procedimiento de brechas (función 052). Aquí solo se exige usar sus versiones vigentes.
- La guía de incidentes y su simulacro general (otra entrega de la fase 6).
- Migrar el agente de Apps Script, salvo que el responsable decida lo contrario.
- Cualquier dato de los correos, de los documentos o de la carpeta `agente_correo` de los clientes, salvo los archivos de salud de la carpeta `panel` en los términos de REQ-029 y REQ-049.
- Decidir qué hace cada cliente con su carpeta `panel` tras el corte: es suya.
- Captar clientes nuevos: entran directamente con el conector según `docs/INSTALACION-CLIENTE.md`.
- Cambiar los límites del agente, los permisos o la configuración de producción sin aprobación humana expresa (constitución, artículo 14).

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Clientes que hay que migrar.** ¿Cuántos clientes tienen hoy el agente con seguimiento de HumanaIA y qué asistente, plan, almacenamiento, frecuencia y versión del prompt usa cada uno? ¿Quién elabora el inventario y dónde se guarda, sabiendo que no puede ir al repositorio ni a las evidencias con nombres?
2. **Histórico de la carpeta `panel`.** ¿Se importa o se empieza de cero en el conector? Si se importa: ¿cuánto tiempo hacia atrás?, ¿se acepta que `problemas` se descarte entero (las frases del 1.2 no se traducen a códigos del catálogo), dado que traducirlas exigiría leer texto libre?
3. **Paralelo.** ¿Cuántos días consecutivos dura, qué porcentaje mínimo de revisiones coincidentes se exige y qué diferencia máxima se admite en el número de revisiones entre los dos sistemas? ¿Es el mismo para todos los clientes o depende de su frecuencia?
4. **Quién instala y cómo.** ¿Lo hace una persona de HumanaIA en persona, por videollamada, o el propio cliente guiado? ¿Una segunda persona comprueba la lista de límites de REQ-018, o basta con la que instala?
5. **La carpeta `panel` tras el corte.** ¿Qué opciones se ofrecen al cliente: conservarla en su nube, archivarla o borrarla? ¿Se le recomienda alguna?
6. **Agente de Apps Script.** ¿Hay clientes con el agente de Apps Script, solo o junto con el 1.2? ¿Entran en esta migración? Si un cliente tiene los dos, ¿el prompt servido por el conector mantiene la regla del 1.2 de complementar al de Apps Script sin tratar el correo ya etiquetado?
7. **Fecha límite.** ¿Hay una fecha para tener a todos los clientes en un estado final?
8. **Cobro.** ¿Cómo pagan hoy los clientes? ¿Pasan a Stripe al migrar, después, o se quedan con su forma de pago actual? ¿Se les pone algún estado manual mientras tanto?
9. **Cliente piloto de la fase 4.** ¿Es un cliente real o una cuenta propia de HumanaIA? Si es real: la fase 4 lo pone en paralelo antes de la autorización de publicación (B-003), y la arquitectura reserva los datos reales a producción; ¿en qué entorno funciona y con qué autorización?
10. **Herramientas internas y copias.** ¿Cuándo se retiran las herramientas internas de seguimiento por carpeta: al corte de cada cliente, al terminar todas las tandas, o se mantienen para los que se quedan en `panel`? ¿Qué se hace con las copias de archivos de salud que HumanaIA ya tenga (contienen `cliente` y frases libres)? Afecta a los plazos de la función 052.
11. **Fuente de órdenes durante el paralelo.** Opciones: (a) la carpeta `panel` hasta el corte; (b) el conector desde que empieza el paralelo; (c) una pausa por cualquiera de los dos canales pausa al agente y solo la fuente puede reanudarlo. ¿Y la pausa global de la fase 4 alcanza a los clientes cuya fuente aún es la carpeta?
12. **Cómo se compara una misma revisión.** Para cumplir REQ-021 y REQ-024 a la vez, el agente tiene que informar por los dos canales en la misma revisión, pero el prompt 1.3 sustituye el apartado «Panel de salud» por el conector. ¿Se hace una versión de transición registrada que haga las dos cosas? ¿Quién la especifica (fase 2, fase 4 o esta función como propuesta)?
13. **Clientes sin carpeta `panel`.** En el 1.2 la carpeta es opcional. Para quien no la tiene no hay con qué comparar. Opciones: crear una carpeta `panel` temporal solo para el paralelo; validar con N días de revisiones correctas por el conector y sin alertas; otra. ¿Cuál?
14. **Pausa y conversación.** El 1.2 permite que el cliente, estando en pausa, pida en conversación que se revise y «manda lo que yo diga»; la guía de instalación dice que para pausar lo pide a HumanaIA. ¿Conserva el cliente migrado ese poder sobre la pausa? Afecta al aviso previo (REQ-051).
15. **Tandas.** ¿Cuántos clientes por tanda? ¿Cuántas vueltas atrás se admiten en una tanda antes de no pasar a la siguiente? ¿Tiempo mínimo entre tandas?
16. **Plazo de vuelta atrás.** ¿Cuánto dura tras el corte? Durante ese plazo se conservan la copia del 1.2 y la carpeta compartida y se hace la comprobación diaria de REQ-036.
17. **Aviso previo.** ¿Con cuánta antelación y por qué canal? ¿Hace falta aceptación expresa de las condiciones o de la política antes de activar (relacionado con la cuestión de aceptación de la función 052)?
18. **Versiones anteriores al 1.2.** Si algún cliente ejecuta una versión anterior, ¿se le actualiza primero al 1.2 o se migra directamente?
19. **Motivos de lista cerrada.** ¿Qué motivos se admiten para «se mantiene en `panel`» y para una vuelta atrás?
20. **Cuentas de HumanaIA con acceso a carpetas.** ¿Con qué cuentas de HumanaIA están compartidas hoy las carpetas `panel` (cuentas personales de instaladores o una común)? De ello depende cómo se comprueba REQ-038 y REQ-057.
21. **Clientes que no responden.** ¿Qué se hace con un cliente que no contesta al aviso o no da fecha para la instalación: se mantiene en `panel`, se le da un plazo, se le da de baja?

## Dependencias y decisiones relacionadas

- Constitución: artículos 1, 2, 3, 7, 8, 9, 11, 13 y 14.
- Decisiones: D-006 (código de un solo uso, conexiones revocables por separado), D-008 (`problemas` como lista cerrada), D-009 (las tres herramientas), D-010 (impago y estado manual), B-003 (autorización de publicación).
- Fase 1: decisión de sí o no por asistente y plan B aprobado; `docs/INSTALACION-CLIENTE.md` fuera de BORRADOR.
- Fase 2: prompt 1.3 con arranque local y cierre en fallo; contrato del informe (`contratos/informe.schema.json`); auditoría.
- Fase 3: alta de clientes, licencias, códigos, conexiones y órdenes en el panel superadmin.
- Fase 4: registro de versiones y canales, pausa global y cliente piloto en paralelo.
- Función 050 (cobro y alta en Stripe) y función 052 (textos legales, plazos de conservación, brechas y baja de clientes).
- Referencia: `docs/referencia/agente-ia-1.2.md`, apartados «Panel de salud» y «Si ya hay otro agente», leído como dato.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
