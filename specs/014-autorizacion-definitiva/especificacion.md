# 014 · Autorización definitiva: activación, conexiones y tokens

Estado: PROPUESTA
Fase: 2 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

El conector solo debe servir instrucciones al agente de un cliente que tenga derecho a ello, y nadie más debe poder hacerse pasar por ese agente. La función 001 construye una autorización mínima con licencias ficticias para la prueba real y deja fuera el límite de intentos definitivo y las alertas. Esta función termina la autorización sobre la base de datos definitiva: activación con código de un solo uso ligado a una licencia real, conexiones revocables por separado, tokens que no sirven de nada si se filtra la base de datos, detección de tokens robados, límite de intentos, alertas y auditoría. Lo que construya la 001 se conserva en lo que no choque con estos requisitos.

## Quién la usa y cómo

- Como **instalador de HumanaIA**, quiero activar el conector en el asistente de un cliente con un código de un solo uso que caduca en minutos, para que quede ligado a su licencia sin que exista una clave permanente que se pueda robar.
- Como **agente de correo** del cliente, quiero renovar mis tokens sin que nadie intervenga, también cuando dos ejecuciones coinciden, para revisar el correo en cada ejecución programada.
- Como **superadmin de HumanaIA**, quiero generar códigos, revocar una conexión concreta o todas las de una licencia con efecto inmediato y ver alertas y auditoría de lo ocurrido, para contener un robo o una baja sin afectar a los demás.
- Como **cliente**, quiero que nadie pueda conectar un agente a mi licencia ni ver nada mío con un token de otro, para que mi agente y mis cifras sean solo míos.
- Como **responsable de seguridad**, quiero pruebas automáticas de cada caso negativo y registros sin valores recibidos, para demostrar el aislamiento y el cierre en fallo en lugar de suponerlos.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo.

**Parámetros pendientes.** Los valores siguientes los fija el responsable al resolver las cuestiones abiertas. Los requisitos y criterios los usan por su nombre.

| Parámetro | Qué es | Cuestión |
| --- | --- | --- |
| C | Minutos de vida de un código de activación | 1 |
| E_c, E_t | Entropía mínima del código de activación y de los tokens | 2 |
| A | Minutos de vida del token de acceso | 3 |
| D | Días sin renovar tras los que una conexión exige activación nueva | 4 |
| G | Segundos de la ventana de gracia de la renovación | 5 |
| U, T, B | Intentos fallidos admitidos, ventana en que se cuentan y duración del bloqueo | 7 |
| Q | Límite de peticiones por origen en registro, autorización y emisión de tokens | 8 |
| R, P | Plazo de purga de códigos y tokens; plazo de purga de clientes OAuth sin uso | 24 |
| L, N | Objetivo de latencia y carga de prueba | 29 |
| S, V | Vida de una solicitud de autorización abierta en pantalla y del código de autorización | 30 |

**Licencia vigente**, en toda esta especificación: no revocada y, además, o bien forzada como activa, o bien en estado activa, no forzada como suspendida y sin fecha de caducidad pasada. Es la misma regla que aplica el modelo de referencia.

### Activación

| ID | Requisito |
| --- | --- |
| REQ-001 | La pantalla de autorización pide un código de activación y nada más. No pide ni admite una clave de licencia permanente ni identificadores de cliente, de licencia o de conexión. |
| REQ-002 | Cada código de activación pertenece a una sola licencia y caduca a los C minutos de generarse. |
| REQ-003 | Un código de activación crea como mucho una conexión en toda su vida. |
| REQ-004 | Los códigos de activación son impredecibles y tienen al menos E_c de entropía. |
| REQ-005 | Una activación solo prospera si el código existe, no ha caducado, no se ha usado, su licencia está vigente y su cliente no está de baja. |
| REQ-006 | Una activación correcta marca el código como usado y crea exactamente una conexión ligada a la licencia del código, en una sola operación indivisible: o ocurren las dos cosas o ninguna. |
| REQ-007 | La conexión anota qué asistente la creó a partir del callback de la lista cerrada con el que se completó la autorización, nunca a partir de un dato tecleado o declarado libremente por quien se registra. |
| REQ-008 | Solo un superadmin puede generar códigos de activación, y solo para una licencia concreta. |
| REQ-009 | El código en claro se muestra una única vez a quien lo genera; después no se puede recuperar por ninguna vía. |

### Conexiones

| ID | Requisito |
| --- | --- |
| REQ-010 | Revocar una conexión deja sin efecto, desde ese momento, todos sus tokens de acceso y de renovación, aunque no hayan caducado. |
| REQ-011 | Revocar una conexión no cambia nada en ninguna otra conexión, de la misma licencia ni de otras. |
| REQ-012 | Se pueden revocar a la vez todas las conexiones de una licencia, con el mismo efecto que revocarlas una a una. |
| REQ-013 | Solo un superadmin revoca conexiones a mano. El sistema solo revoca por su cuenta en los casos que prevé esta especificación (reutilización de un token de renovación y, si así se decide en la cuestión 26, otros indicios de robo). |

### Tokens

| ID | Requisito |
| --- | --- |
| REQ-014 | Los tokens de acceso y de renovación son opacos: no contienen ni permiten deducir cliente, licencia, conexión, asistente ni fechas, y tienen al menos E_t de entropía. |
| REQ-015 | La base de datos guarda los códigos de activación, los códigos de autorización y los tokens solo como HMAC calculado con un secreto que no está en la base de datos. Ningún valor en claro llega a guardarse. |
| REQ-016 | El secreto del HMAC no está en el código, en el repositorio, en la base de datos, en los prompts, en los registros ni en las evidencias. Lo fija una persona en el gestor de variables de cada entorno y es distinto en cada entorno. |
| REQ-017 | El token de acceso deja de aceptarse a los A minutos de emitirse. |
| REQ-018 | El servidor de autorización solo emite tokens para el recurso del conector, identificado por su dirección canónica. |
| REQ-019 | El conector solo acepta tokens de acceso emitidos para su propio recurso. |
| REQ-020 | Cada uso válido de un token de renovación lo sustituye por uno nuevo y emite un token de acceso nuevo de forma atómica: o queda registrado el par nuevo y el anterior marcado como sustituido, o no cambia nada. |
| REQ-021 | Durante los G segundos siguientes a una sustitución, presentar el token de renovación sustituido devuelve un par válido para la misma conexión, sin revocarla ni generar alerta. Qué par se devuelve lo fija la cuestión 6. |
| REQ-022 | Cada renovación concede D días más de vida al token de renovación. Una conexión que pase D días sin renovar no puede renovar más y exige una activación nueva. |
| REQ-023 | Un token de renovación solo lo puede usar el cliente OAuth al que se emitió, y solo produce tokens para su propia conexión. |
| REQ-024 | Cada renovación comprueba de nuevo el estado de la conexión, de la licencia y del cliente antes de emitir nada. |

### Estado de la licencia y del cliente

| ID | Requisito |
| --- | --- |
| REQ-025 | Si una licencia se revoca, sus conexiones no pueden renovar y sus tokens de acceso dejan de aceptarse desde ese momento. |
| REQ-026 | Si una licencia está suspendida (también forzada como suspendida) o caducada, o si su cliente está de baja, un token de acceso vigente se sigue aceptando para que el conector responda con el estado `suspendida` y nada más; la renovación se comporta como fije la cuestión 19. |
| REQ-027 | Si una licencia vuelve a estar vigente, sus conexiones que no estén revocadas ni caducadas por inactividad siguen funcionando sin activación nueva. |

### Límite de intentos y de peticiones

| ID | Requisito |
| --- | --- |
| REQ-028 | Tras U intentos de activación fallidos en T minutos desde un mismo origen, ese origen queda bloqueado durante B minutos. El ámbito adicional del límite (global, escalado) lo fija la cuestión 7. |
| REQ-029 | Durante un bloqueo no se evalúa ningún código: un código correcto no se acepta ni se consume. |
| REQ-030 | La respuesta durante el bloqueo es la misma sea cual sea el código introducido y no revela nada sobre él. |
| REQ-031 | El registro de clientes, la autorización y la emisión de tokens rechazan las peticiones de un mismo origen por encima de Q. |

### Alertas

| ID | Requisito |
| --- | --- |
| REQ-032 | Cada conexión nueva abre una alerta de tipo `conexion_nueva` para su cliente. |
| REQ-033 | Cada reutilización de un token de renovación fuera de la ventana de gracia abre una alerta de tipo `token_reutilizado` para su cliente. |
| REQ-034 | Cada vez que se alcanza el umbral del límite de intentos se abre una alerta de tipo `intentos_activacion`, con el cliente si se conoce y sin él si no. |
| REQ-035 | Se abre una alerta de tipo `renovacion_fallida` en los casos que fije la cuestión 22. |
| REQ-036 | Una alerta solo contiene tipo, severidad, cliente si se conoce, fechas de apertura y de resolución y quién la resolvió. La severidad de cada tipo y si se agrupan repeticiones los fija la cuestión 21. |

### Auditoría

| ID | Requisito |
| --- | --- |
| REQ-037 | Dejan una fila de auditoría: código generado, activación correcta, activación rechazada (con motivo de lista cerrada), bloqueo por intentos, conexión creada, conexión revocada a mano, revocación en bloque, revocación por reutilización, caducidad por inactividad detectada, renovación rechazada para una conexión conocida, cliente OAuth registrado y purgas. Si se audita cada renovación normal lo fija la cuestión 23. |
| REQ-038 | Cada fila de auditoría de autorización lleva acción, tipo de objeto, identificador interno, cliente cuando se conoce y fecha, y ningún valor recibido: ni códigos, ni tokens, ni verificadores, ni callbacks, ni direcciones de origen. |

### Servidor de autorización

| ID | Requisito |
| --- | --- |
| REQ-039 | Solo se admiten el flujo de código de autorización con PKCE S256 y el de renovación, para clientes públicos. Los metadatos publicados anuncian solo eso. |
| REQ-040 | El callback de cada autorización coincide carácter a carácter con uno registrado para ese cliente OAuth, y todo callback registrado pertenece a la lista cerrada (T-010). |
| REQ-041 | El registro por CIMD solo admite documentos alojados en hosts de la lista de hosts conocidos, y nunca descarga nada de otros hosts. |
| REQ-042 | El registro por DCR tiene un límite de altas por origen y por periodo. |
| REQ-043 | Ningún registro, por CIMD ni por DCR, amplía la lista cerrada de callbacks. |
| REQ-044 | Los clientes OAuth sin uso durante P días se purgan, salvo que tengan conexiones vivas; una purga nunca deja a una conexión viva sin poder renovar. |
| REQ-045 | Un código de autorización sirve una sola vez y caduca a los V segundos. |
| REQ-046 | Canjear un código de autorización exige el mismo cliente OAuth, el mismo callback, el mismo recurso y un verificador PKCE que corresponda al desafío. |

### Pantalla de activación

| ID | Requisito |
| --- | --- |
| REQ-047 | La pantalla no se muestra cuando se carga dentro de una página de otro origen. |
| REQ-048 | El código solo se evalúa en un envío del formulario por POST que lleve una prueba válida de proceder de la propia pantalla. |
| REQ-049 | El envío del formulario no puede cambiar el cliente OAuth, el callback, el desafío PKCE ni el recurso validados al mostrar la pantalla. |
| REQ-050 | Una solicitud de autorización abierta durante más de S minutos ya no se puede completar, y la pantalla lo explica e indica volver a empezar desde el asistente. |
| REQ-051 | La pantalla cumple WCAG 2.2 AA y se usa en un móvil. |
| REQ-052 | La pantalla está en español y tiene estados para: inicio, error genérico de código, bloqueo por intentos, solicitud caducada, servicio no disponible y activación correcta. |
| REQ-053 | La pantalla no muestra textos ni enlaces aportados por el cliente OAuth registrado ni por los parámetros de la petición. |

### Privacidad, aislamiento y operación

| ID | Requisito |
| --- | --- |
| REQ-054 | Los registros del servidor de autorización anotan ruta, resultado y código de error. Nunca valores de formularios, parámetros, códigos, tokens, verificadores, cabeceras de autorización ni cookies. |
| REQ-055 | Ninguna respuesta de error incluye un valor recibido. La única devolución de un valor recibido es el parámetro de estado que el protocolo exige reenviar a un callback válido. |
| REQ-056 | Toda comparación de un secreto recibido (código, token, verificador PKCE, prueba de envío propio) con el esperado tarda lo mismo sea cual sea el punto en que difieren. |
| REQ-057 | Los códigos de activación y de autorización usados o caducados, y los tokens caducados o revocados, se purgan pasados R desde que dejaron de valer. |
| REQ-058 | Un token de renovación sustituido se conserva al menos hasta su propia caducidad, para que su reutilización se siga detectando. |
| REQ-059 | La identidad con la que el servidor de autorización accede a la base de datos solo puede hacer operaciones de autorización: no lee ni escribe informes, ejecuciones, versiones del prompt, publicaciones, reglas, órdenes, suscripciones ni usuarios. |
| REQ-060 | Los tokens, los códigos y los clientes OAuth no son legibles por la API pública, y ningún usuario de un cliente lee conexiones, alertas ni auditoría de otro cliente. |
| REQ-061 | La licencia de una conexión se deriva solo del código de activación, y la conexión de una petición solo de su token. Nada de lo que proceda de un cliente produce, lee, renueva ni revoca algo de otro. |
| REQ-062 | La supervisión muestra recuentos por resultado de activaciones, bloqueos, renovaciones, usos de la ventana de gracia, reutilizaciones, rechazos y errores internos, sin ningún valor recibido. |
| REQ-063 | El 95 % de las activaciones y de las renovaciones responde en menos de L con la carga N. |
| REQ-064 | Los cambios de base de datos de esta función tienen vuelta atrás, y la vuelta atrás se prueba. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-065 | Código de activación incorrecto, caducado o ya usado | No se crea conexión. La respuesta es idéntica en los tres casos y no revela si el código existe. Se cuenta el intento y se audita con motivo de lista cerrada |
| REQ-066 | Código válido de una licencia no vigente o de un cliente de baja | No se crea conexión. La respuesta es idéntica a la del caso anterior. Si el código se consume lo fija la cuestión 15 |
| REQ-067 | Dos o más envíos simultáneos del mismo código válido | Se crea exactamente una conexión. Los demás envíos reciben la respuesta genérica de error |
| REQ-068 | Fuerza bruta de códigos desde uno o varios orígenes | Bloqueo según REQ-028 y alerta `intentos_activacion`. Ningún código se acepta durante el bloqueo |
| REQ-069 | Token de renovación robado o repetido, presentado después de la ventana de gracia, sea quien sea el primero en usarlo | No se emite nada. Se revoca esa conexión con todos sus tokens, se abre alerta `token_reutilizado` y se audita. Las demás conexiones siguen igual |
| REQ-070 | Dos renovaciones simultáneas con el mismo token de renovación | Las dos reciben un par válido. La conexión no se revoca y no hay alerta |
| REQ-071 | La base de datos falla en mitad de una rotación | No queda estado a medias: el token anterior sigue valiendo y no se cuenta como reutilización, o el par nuevo está completo. Nunca se entrega un token que no esté registrado. La respuesta es un error temporal sin valores |
| REQ-072 | Una conexión revocada intenta renovar o usar un token de acceso | Se rechaza. No se emite nada y la conexión no se reactiva |
| REQ-073 | Una conexión que lleva más de D días sin renovar intenta renovar | Se rechaza y queda anotado. Hace falta una activación nueva |
| REQ-074 | Petición de autorización para otro recurso, o token de acceso emitido para otro recurso | Se rechaza. El conector no ejecuta ninguna herramienta y responde de forma que el asistente vuelva a autorizarse |
| REQ-075 | Callback fuera de la lista, o que difiere en cualquier carácter (barra final, mayúsculas, parámetros, fragmento, puerto, esquema, subdominio, codificación) | Se rechaza sin redirigir a ese callback |
| REQ-076 | Petición sin desafío PKCE, con método distinto de S256 o con un flujo no admitido | Se rechaza sin emitir código ni token |
| REQ-077 | Canje de un código de autorización con otro cliente, otro callback, otro recurso o un verificador que no corresponde; o canje repetido del mismo código | Se rechaza sin emitir tokens. Si además se revoca algo lo fija la cuestión 26 |
| REQ-078 | Token de renovación presentado por otro cliente OAuth; token de acceso presentado para renovar; token de renovación presentado como token de acceso | Se rechaza sin emitir ni aceptar nada |
| REQ-079 | Formulario, petición de autorización, petición de tokens o registro con campos de más, o con identificadores de cliente, licencia o conexión | Los campos ajenos se ignoran, no se guardan ni se registran, y no cambian a qué licencia o conexión se liga nada |
| REQ-080 | Pantalla cargada dentro de otra página, código enviado por GET, envío sin prueba de origen propio o desde otro sitio | Se impide. El código no se evalúa |
| REQ-081 | Registro por CIMD desde un host no conocido, documento CIMD o alta DCR con callbacks fuera de la lista, o altas DCR por encima del límite | Se rechaza. No se hace ninguna petición saliente a hosts no conocidos |
| REQ-082 | Entradas (documento CIMD, alta DCR, parámetros, formulario) que contienen texto con apariencia de instrucciones | Son datos: no cambian permisos, alcance, callbacks admitidos ni el resultado de la autorización |
| REQ-083 | Secreto del HMAC ausente, vacío o distinto del esperado | No se activa, no se emite, no se renueva y no se acepta ningún token. Error temporal. No hay ningún modo alternativo sin secreto |
| REQ-084 | El mecanismo del límite de intentos no está disponible | Se deniega toda activación hasta que vuelva |
| REQ-085 | La base de datos falla durante una activación | No queda una conexión creada con el código sin marcar, ni un código marcado sin conexión. Error temporal sin valores |
| REQ-086 | Un usuario que no es superadmin, un anónimo, el conector o el servidor de autorización intentan generar un código o revocar una conexión a mano | Se deniega y no cambia nada |
| REQ-087 | Licencia revocada mientras una conexión tiene un token de acceso sin caducar | La siguiente petición con ese token se rechaza |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Las pruebas que dependen del paso del tiempo usan un reloj controlado en el entorno de prueba. Las pruebas de base de datos se ejecutan en CI (T-012); no se dan por superadas en local.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | En el entorno previo, con una licencia ficticia vigente y desde cada asistente con resultado «sí» en la fase 1, una activación con código válido crea exactamente 1 conexión ligada a esa licencia, con el asistente correcto, el código queda usado, se abre 1 alerta `conexion_nueva` y quedan las filas de auditoría de activación y de conexión creada. Un segundo uso del mismo código falla | REQ-001, REQ-003, REQ-006, REQ-007, REQ-032, REQ-037 |
| CA-002 | Un código usado 5 segundos antes de cumplir C minutos activa; usado 5 segundos después, no | REQ-002 |
| CA-003 | El diseño documenta que códigos y tokens alcanzan E_c y E_t. Una prueba genera 100 000 códigos y 100 000 tokens sin ninguna repetición, y los tokens de dos clientes distintos no comparten ningún rasgo que dependa del cliente, la licencia o la conexión | REQ-004, REQ-014 |
| CA-004 | Prueba automática con cada combinación de estado de licencia (activa, suspendida, forzada activa, forzada suspendida, caducada, caducada y forzada activa, revocada) y de cliente (activo, baja): solo se crea conexión cuando la licencia es vigente y el cliente está activo. 100 % de las combinaciones dan el resultado esperado | REQ-005, REQ-066 |
| CA-005 | Para código inexistente, caducado, usado, de licencia no vigente y de cliente de baja, 20 intentos de cada tipo: el código de estado, las cabeceras y el cuerpo de la respuesta son idénticos salvo los valores de un solo uso de la protección contra envíos cruzados; 0 conexiones creadas; cada intento deja una fila de auditoría con su motivo de lista cerrada | REQ-065, REQ-066, REQ-038 |
| CA-006 | 50 rondas de 5 envíos simultáneos del mismo código válido: en el 100 % de las rondas se crea exactamente 1 conexión y los otros 4 envíos reciben la respuesta genérica | REQ-006, REQ-067 |
| CA-007 | Un superadmin genera un código y lo ve una vez; ninguna consulta posterior lo devuelve y la base de datos solo contiene su HMAC. Un usuario de cliente, un anónimo, la identidad del conector y la del servidor de autorización intentan generar códigos: 0 códigos creados | REQ-008, REQ-009, REQ-086 |
| CA-008 | 20 repeticiones: con un token de acceso y uno de renovación sin caducar, se revoca la conexión; la siguiente petición al conector y la siguiente renovación se rechazan en el 100 % de los casos y la conexión sigue revocada | REQ-010, REQ-072 |
| CA-009 | Con 2 conexiones de la licencia A y 1 de la licencia B, se revoca una de A: las otras 2 siguen aceptadas y renovando en el 100 % de las peticiones | REQ-011 |
| CA-010 | Revocación en bloque de la licencia A con 3 conexiones: 0 peticiones aceptadas de ellas después; la conexión de B sigue funcionando | REQ-012 |
| CA-011 | Un usuario de cliente (sobre conexiones propias y ajenas), un anónimo, la identidad del conector y la del servidor de autorización intentan revocar a mano: 0 revocaciones. Un superadmin revoca con éxito | REQ-013, REQ-086 |
| CA-012 | Tras un ciclo completo en el entorno previo (activación, 10 renovaciones, una reutilización), se buscan en todas las tablas, registros y supervisión los valores en claro de cada código y token emitido: 0 coincidencias. Todas las columnas de códigos y tokens contienen solo HMAC | REQ-014, REQ-015 |
| CA-013 | El escáner de secretos sobre el repositorio y su historial da 0 hallazgos. La persona que custodia el secreto comprueba, sin copiarlo en las evidencias, que no aparece en la base de datos, los registros ni los prompts (0 coincidencias) y que el de previo y el de producción son distintos | REQ-016 |
| CA-014 | Un token de acceso se acepta 5 segundos antes de cumplir A minutos y se rechaza 5 segundos después, con la respuesta que pide volver a autorizarse | REQ-017 |
| CA-015 | Una petición de autorización con un recurso distinto del canónico se rechaza sin emitir código; un token registrado para otro recurso se rechaza en el conector; 100 % de rechazos y 0 herramientas ejecutadas | REQ-018, REQ-019, REQ-074 |
| CA-016 | 1 000 renovaciones seguidas: cada token de renovación nuevo es distinto de todos los anteriores, el anterior queda sustituido y, fuera de la ventana de gracia, en todo momento hay exactamente 1 token de renovación utilizable por conexión | REQ-020 |
| CA-017 | Se provoca un fallo de la base de datos en cada punto de la rotación, 20 veces por punto: en el 100 % de los casos el estado es coherente (anterior válido y sin par nuevo, o par nuevo completo), 0 tokens entregados sin registrar, 0 revocaciones, 0 alertas `token_reutilizado`, y la respuesta es un error temporal sin valores | REQ-020, REQ-071 |
| CA-018 | 50 rondas de 2 renovaciones simultáneas con el mismo token: en el 100 % las dos reciben un par válido según la cuestión 6, la conexión sigue viva y hay 0 alertas. Presentar el token sustituido 2 segundos antes de cumplir G devuelve un par válido | REQ-021, REQ-070 |
| CA-019 | Criterio 5 de la fase 2. Presentar un token de renovación sustituido 2 segundos después de cumplir G: se rechaza, la conexión queda revocada, el 100 % de sus tokens se rechaza en la petición siguiente, se abre exactamente 1 alerta `token_reutilizado` del cliente correcto y 1 fila de auditoría de revocación por reutilización; otra conexión de la misma licencia sigue funcionando. Se repite con el orden inverso (el robado se usa primero) con el mismo resultado | REQ-069, REQ-033, REQ-037, REQ-013 |
| CA-020 | Una conexión que renueva cada D/2 días sigue viva durante 10 ciclos. Una que pasa D días y 1 minuto sin renovar se rechaza, exige activación nueva y deja su fila de auditoría | REQ-022, REQ-073 |
| CA-021 | Un token de renovación presentado con otro cliente OAuth, un token de acceso presentado para renovar y un token de renovación presentado al conector como acceso: 100 % de rechazos y 0 tokens emitidos | REQ-023, REQ-078 |
| CA-022 | Prueba automática con cada estado de licencia y de cliente sobre renovar y usar un token de acceso vigente: el resultado coincide en el 100 % de las combinaciones con la tabla de efectos aprobada al resolver la cuestión 19; con licencia revocada, la siguiente petición con un token de acceso sin caducar se rechaza; una licencia que vuelve a vigente renueva sin activación nueva en sus conexiones no revocadas ni caducadas | REQ-024, REQ-025, REQ-026, REQ-027, REQ-087 |
| CA-023 | Desde un origen, U intentos fallidos en T minutos: el intento U+1 queda bloqueado durante B minutos; durante el bloqueo un código válido no se acepta ni se consume y sigue sirviendo después si no ha caducado; la respuesta de bloqueo es idéntica con códigos válidos e inválidos; pasado B se admiten intentos; se abre 1 alerta `intentos_activacion`. Un ataque repartido entre varios orígenes se comporta como fije la cuestión 7 | REQ-028, REQ-029, REQ-030, REQ-034, REQ-068 |
| CA-024 | Superar Q peticiones desde un origen en registro, autorización y emisión de tokens produce rechazos en el 100 % de las peticiones sobrantes; las de otro origen no se ven afectadas; las altas DCR por encima de su límite se rechazan | REQ-031, REQ-042, REQ-081 |
| CA-025 | Inspección del esquema y de todas las alertas creadas por la batería de pruebas: 0 columnas o valores fuera de tipo, severidad, cliente, fechas y resolución; la severidad de cada tipo coincide con la cuestión 21; `renovacion_fallida` aparece exactamente en los casos de la cuestión 22 | REQ-035, REQ-036 |
| CA-026 | Cada suceso de REQ-037 provocado por la batería deja exactamente 1 fila de auditoría con acción, tipo de objeto, cliente correcto (o vacío si no se conoce) y fecha. Un valor canario introducido en cada entrada aparece 0 veces en la auditoría | REQ-037, REQ-038 |
| CA-027 | Los metadatos publicados anuncian solo los flujos de código y de renovación, el método S256 y clientes públicos. Peticiones sin desafío, con método distinto de S256 y con otros flujos: 100 % de rechazos | REQ-039, REQ-076 |
| CA-028 | Al menos 10 variaciones de cada callback admitido (las de REQ-075): 100 % rechazadas sin redirección a ellas. Los callbacks exactos registrados se aceptan | REQ-040, REQ-075 |
| CA-029 | Registro por CIMD desde un host no conocido: rechazo y 0 peticiones salientes hacia ese host observadas. Documento CIMD y alta DCR con un callback fuera de la lista: rechazo y la lista no cambia | REQ-041, REQ-043, REQ-081 |
| CA-030 | Un cliente OAuth sin uso durante P días y sin conexiones vivas desaparece tras la purga; uno con una conexión viva se conserva y esa conexión sigue renovando | REQ-044 |
| CA-031 | Código de autorización reutilizado, usado 5 segundos después de cumplir V, con verificador incorrecto, con otro cliente, con otro callback y con otro recurso: 100 % de rechazos y 0 tokens. El efecto sobre la conexión de un código reutilizado coincide con la cuestión 26 | REQ-045, REQ-046, REQ-077 |
| CA-032 | En el entorno previo: la pantalla cargada en una página de otro origen no se muestra; un código enviado por GET no se evalúa; un POST sin prueba de origen propio o desde otro sitio se rechaza; un POST que altera cliente, callback, desafío o recurso se rechaza. 100 % de los casos | REQ-047, REQ-048, REQ-049, REQ-080 |
| CA-033 | Una solicitud abierta S minutos y 5 segundos no se completa aunque el código sea válido, el código no se consume y la pantalla muestra el estado de solicitud caducada | REQ-050 |
| CA-034 | Una herramienta automática de accesibilidad da 0 infracciones de nivel A y AA en los 6 estados de la pantalla; una revisión manual completa la activación solo con teclado y con lector de pantalla, que anuncia los errores; a 320 píxeles de ancho no hay desplazamiento horizontal; el 100 % de los textos está en español | REQ-051, REQ-052 |
| CA-035 | Un cliente OAuth registrado con nombre, logotipo y enlaces canario, y una petición con parámetros canario que contienen texto con forma de instrucción: la pantalla muestra 0 de esos valores y el resultado de la autorización y los callbacks admitidos no cambian | REQ-053, REQ-082 |
| CA-036 | Criterio 6 de la fase 2 en lo que toca a la autorización. Un valor canario en cada campo y parámetro (código, verificador, callback rechazado, cliente OAuth, campos de más, cabeceras) aparece 0 veces en registros, supervisión, respuestas (salvo el parámetro de estado reenviado a un callback válido) y base de datos. La revisión de privacidad (skill `revision-privacidad`) termina con 0 hallazgos bloqueantes | REQ-054, REQ-055, REQ-079 |
| CA-037 | Cada entrada recibe además identificadores de cliente, licencia y conexión de otro cliente: 0 efectos; la conexión queda ligada a la licencia del código y los tokens a su propia conexión | REQ-001, REQ-061, REQ-079 |
| CA-038 | El dictamen del `auditor-seguridad` enumera todos los puntos donde se compara un secreto recibido y confirma el 100 %, con 0 hallazgos sobre comparaciones | REQ-056 |
| CA-039 | Tras avanzar el reloj, la purga elimina el 100 % de los códigos y tokens que dejaron de valer hace más de R y 0 de los que siguen valiendo. Un token de renovación sustituido, presentado justo antes de su caducidad y después de la purga, sigue provocando la revocación y la alerta de reutilización | REQ-057, REQ-058 |
| CA-040 | Pruebas de base de datos en CI: con la identidad del servidor de autorización, 0 lecturas o escrituras con éxito sobre las tablas ajenas de REQ-059; con los roles de la API pública, 0 lecturas de tokens, códigos y clientes OAuth y 0 ejecuciones de operaciones de autorización | REQ-059, REQ-060 |
| CA-041 | Pruebas de base de datos en CI y de extremo a extremo con dos clientes: 0 accesos cruzados al leer, renovar, revocar o generar; cada alerta y cada fila de auditoría lleva el cliente correcto; un usuario del cliente A lee 0 filas de conexiones, alertas y auditoría de B | REQ-060, REQ-061 |
| CA-042 | Con el secreto del HMAC ausente o cambiado: 100 % de activaciones, emisiones, renovaciones y validaciones rechazadas con error temporal. Con el límite de intentos no disponible: 100 % de activaciones denegadas. Con la base de datos caída durante 20 activaciones: 0 conexiones sin código marcado y 0 códigos marcados sin conexión | REQ-083, REQ-084, REQ-085 |
| CA-043 | Tras ejecutar la batería de pruebas en el entorno previo, los recuentos de la supervisión por resultado coinciden exactamente con los provocados y contienen 0 valores recibidos | REQ-062 |
| CA-044 | Una prueba de carga con N durante 10 minutos da un percentil 95 por debajo de L en activación y en renovación, y 0 errores no previstos | REQ-063 |
| CA-045 | En el entorno previo se aplican las migraciones de la función, se revierten y se vuelven a aplicar: 0 errores, y las pruebas de la función y las anteriores siguen en verde tras cada paso | REQ-064 |
| CA-046 | Todas las pruebas automáticas de los casos negativos están en verde en CI en la rama principal | REQ-065 a REQ-087 |

## Fuera de alcance

- Las pantallas del panel para generar códigos, ver conexiones, revocarlas y ver alertas y auditoría (fase 3). Esta función da la capacidad; el panel la usa.
- El doble factor de los superadmin (fase 3, V-108). Aquí «superadmin» es quien el modelo reconozca como tal.
- El aviso fuera del panel de las alertas (fase 4, V-111) y las alertas de latido (función 013).
- Las tres herramientas del conector y lo que responden en cada estado (función 011). Esta función entrega «hay un token de acceso válido para esta conexión, o no».
- La estructura general de la base de datos, el RLS de las tablas y los roles (función 010), salvo las pruebas de aislamiento propias de los datos de autorización.
- El prompt y el arranque local (función 012).
- Los cambios de estado de la licencia por cobro (fase 6). Esta función solo reacciona al estado.
- El límite de intentos de inicio de sesión en los dashboards (fase 3).
- El límite de peticiones a las herramientas MCP por conexión, salvo que la cuestión 8 lo asigne aquí.
- Flujos OAuth distintos de código con PKCE y renovación, clientes confidenciales, tokens autocontenidos, y puntos estándar de introspección o de revocación de tokens por el propio asistente.
- La guía de operación para rotar el secreto del HMAC (fase 6); aquí solo el comportamiento que fije la cuestión 25.
- Datos y clientes reales: en la fase 2 todo es ficticio.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Vida del código de activación (C).** ¿Cuántos minutos vive un código de activación desde que se genera? Corta (5 minutos o menos): el instalador tiene que generarlo con el cliente delante y teclearlo enseguida, y un código robado sirve muy poco tiempo. Larga (30 minutos o más): da margen si la instalación se complica, pero amplía la ventana de robo.
2. **Formato y entropía (E_c, E_t).** ¿Qué formato tiene el código de activación y qué entropía mínima exigen códigos y tokens? Código corto y fácil de teclear: menos errores al instalar, pero su seguridad depende casi entera del límite de intentos. Código largo en grupos: más entropía, más incómodo de teclear. Para los tokens, que nadie teclea, la cifra solo afecta a la seguridad.
3. **Vida del token de acceso (A).** ¿Cuánto dura el token de acceso definitivo, sabiendo que en la prueba son 5 minutos? Corta: un token de acceso robado sirve menos tiempo, pero hay más renovaciones y más carga. Larga: menos renovaciones; la revocación sigue siendo inmediata porque cada petición comprueba la conexión.
4. **Inactividad tolerada (D).** ¿Cuántos días sin renovar aguanta una conexión antes de exigir una activación nueva, teniendo en cuenta clientes con revisión semanal y vacaciones? Mientras la tarea programada siga llamando al conector (también en pausa), la conexión se renueva; solo caduca si el asistente deja de llamar. D de 7 días o menos: un cliente semanal queda al límite y cualquier retraso exige reinstalar. D de 30 a 90 días: cubre vacaciones, pero un token de renovación robado vive más. Además: ¿hay una vida máxima absoluta de la conexión aunque renueve? Si la hay, todos los clientes tendrán que reactivar periódicamente con un instalador.
5. **Ventana de gracia (G).** ¿Cuántos segundos dura la ventana de gracia, que el ADR-0002 fija en unos 60? Más corta: menos margen para que un ladrón use el token sustituido sin ser detectado, pero dos ejecuciones lentas o una respuesta perdida pueden acabar revocando la conexión legítima. Más larga: más tolerancia y menos detección.
6. **Qué devuelve la ventana de gracia.** ¿Qué recibe la segunda petición que presenta, dentro de la ventana, un token de renovación ya sustituido? El ADR-0002 y la arquitectura dicen «el mismo par», pero guardar solo HMAC impide devolver el mismo par. (a) El mismo par: obliga a guardar el par emitido de forma recuperable durante G, lo que es una excepción expresa a «solo HMAC» y cambia el ADR. (b) Un par nuevo por petición, y al usar cualquiera de ellos se anulan sus hermanos: no se guarda nada recuperable, a cambio de más lógica. (c) Un par nuevo sin anular los hermanos: lo más sencillo, pero quedan ramas vivas que debilitan la detección de robo.
7. **Límite de intentos (U, T, B y ámbito).** ¿Cuántos intentos fallidos se admiten, en qué ventana, cuánto dura el bloqueo y a qué ámbito se aplica? Solo por origen: un ataque repartido entre muchos orígenes lo evita. Además un límite global: frena el ataque repartido, pero un atacante puede bloquear todas las instalaciones de HumanaIA mientras dure. Bloqueo escalado (cada vez más largo): más disuasorio, más riesgo de bloquear a un instalador que se equivoca. El mecanismo concreto sigue en V-113.
8. **Límite de peticiones (Q) y reparto con la 011.** ¿Qué límite de peticiones por origen se aplica al registro, a la autorización y a la emisión de tokens, y el límite por conexión de A-22 sobre las herramientas es de esta función o de la 011? Si es de esta función, hay que añadir un requisito y un criterio; si es de la 011, se anota allí.
9. **Dirección de origen.** ¿Puede guardarse la dirección de origen de quien intenta activar, que es un dato personal, para contar intentos? (a) En claro mientras dure T más B: sencillo, pero obliga a declararlo en el registro de tratamiento con su plazo. (b) Como huella con un secreto: reduce la exposición. (c) No se guarda en la base de datos y el límite lo aplica la plataforma (V-113): depende de lo que la plataforma registre y de dónde lo guarde.
10. **Máximo de conexiones por licencia.** ¿Hay un número máximo de conexiones vivas por licencia? Sin máximo: más flexible para clientes con varias cuentas o asistentes. Con máximo M: limita el daño de un código robado y añade un caso negativo (activación por encima de M) con su criterio.
11. **Código nuevo frente al anterior.** ¿Generar un código nuevo para una licencia anula los códigos anteriores aún no usados? Sí: como mucho hay un código vivo por licencia y el modelo necesita una forma de anularlo. No: pueden coexistir varios hasta que caduquen.
12. **Reactivar el mismo asistente.** ¿Una activación nueva desde el mismo tipo de asistente revoca sola la conexión anterior de esa licencia? Sí: no quedan conexiones huérfanas, pero solo se conoce el tipo de asistente, no la cuenta, así que una segunda cuenta legítima de Claude o un ladrón con un código expulsarían a la conexión existente. No: la conexión antigua se revoca a mano, como dice hoy la guía de instalación.
13. **Conexión revocada.** ¿Una conexión revocada puede volver a activarse? Nunca: toda vuelta exige un código nuevo y una conexión nueva; es lo más seguro. Sí, por un superadmin: rápido tras un error, pero los tokens que hubiera robados volverían a valer si no han caducado.
14. **Momento en que nace la conexión.** ¿La conexión se crea al aceptar el código en la pantalla o cuando el asistente canjea el código de autorización por tokens? Al aceptar el código, como exige el modelo actual: si el canje falla, queda una conexión sin tokens que ha abierto alerta y el código está gastado. Al canjear: solo existen conexiones que funcionan, pero hay que cambiar el modelo.
15. **Código válido con licencia no vigente.** ¿Se consume un código válido cuando su licencia no está vigente o su cliente está de baja? Sí: tras arreglar la licencia hace falta un código nuevo. No: sigue sirviendo hasta caducar, y el instalador puede reintentar en cuanto se corrija.
16. **Identidad del servidor de autorización en la base de datos.** ¿Con qué identidad escribe el servidor de autorización conexiones, códigos y tokens, si el ADR-0003 limita el rol del conector a tres funciones? (a) Un rol propio de autorización con funciones dedicadas en el esquema privado: cumple el mínimo privilegio, depende de V-107 y amplía el modelo. (b) Ampliar el rol del conector con esas funciones: un solo rol, pero contradice el ADR-0003 y el conector ganaría la capacidad de crear conexiones y tokens. (c) La clave secreta confinada en un módulo exclusivo de autorización: es el plan alternativo del ADR-0003, pero salta el RLS y REQ-059 dejaría de garantizarse en la base de datos.
17. **Conexiones de la prueba de la fase 1.** ¿Qué pasa con las conexiones y tokens creados en la prueba real? Se descartan y cada asistente de prueba se activa de nuevo con un código: limpio, exige repetir la activación. Se trasladan a la base de datos definitiva: sin interrupción, pero hay que ligar licencias ficticias de la 001 a licencias del modelo y garantizar que sus tokens cumplen esta especificación.
18. **Códigos en la fase 2, sin panel.** ¿Cómo se genera un código de activación en la fase 2, antes de que exista el panel? (a) Un procedimiento que ejecuta una persona con acceso al entorno, auditado: hay que decidir quién y con qué permisos. (b) Adelantar una pantalla mínima del panel: invade el alcance de la fase 3. (c) En la fase 2 solo hay códigos ficticios creados por las pruebas: no se puede instalar en ningún asistente real hasta la fase 3.
19. **Renovación con licencia no vigente.** ¿Una conexión cuya licencia está suspendida o caducada, o cuyo cliente está de baja, puede seguir renovando tokens? (a) Sí: el agente sigue recibiendo `suspendida` en cada revisión, como pide la fase 1 («una licencia no activa recibe el estado y nada más»), y al reactivar funciona sin intervención; las conexiones de quien no paga siguen vivas. (b) No: a los A minutos el agente deja de recibir el estado y recibe una petición de volver a autorizarse; en el panel parecerá «sin señal», y si pasan D días habrá que reinstalar. (c) Sí durante un plazo y luego no. Puede responderse distinto para cada uno de los tres casos.
20. **Aviso al cliente.** ¿Recibe el cliente algún aviso cuando se revoca su conexión? Ninguno: solo verá que su asistente pide volver a autorizar. Un aviso fuera del panel (fase 4, V-111). Una indicación en su dashboard (fase 5).
21. **Severidad y agrupación de alertas.** ¿Qué severidad lleva cada tipo de alerta de esta función y se agrupan las repeticiones? La arquitectura ya dice que `conexion_nueva` es informativa; quedan `token_reutilizado`, `intentos_activacion` y `renovacion_fallida`. Agrupar (una alerta abierta por tipo y cliente): menos ruido, pero se pierde cuántas veces ocurrió salvo en la auditoría. Una por suceso: más ruido, sobre todo con intentos de activación.
22. **Cuándo hay `renovacion_fallida`.** ¿Qué renovaciones rechazadas abren alerta? (a) Todas las de una conexión conocida: mucho ruido tras cada revocación. (b) Solo las que fallan por error interno (base de datos, secreto): alerta de operación. (c) Solo cuando una conexión no revocada pierde el acceso (inactividad, licencia): avisa de que un agente se ha quedado fuera.
23. **Auditoría de renovaciones normales.** ¿Se audita cada renovación correcta? Sí: con tokens de acceso de 5 minutos son cientos de filas al día por conexión en una tabla de solo inserción que no se puede purgar. No: solo los sucesos de REQ-037, y la renovación normal se rastrea por los tokens hasta que se purgan.
24. **Plazos de purga (R, P).** ¿Cuánto se conservan los códigos y tokens que ya no valen, y los clientes OAuth sin uso? Plazo corto (horas): menos datos guardados y menos rastro para investigar un incidente. Plazo largo (semanas): permite investigar, a costa de guardar más. Afecta también a los plazos de conservación de la fase 6. **Respondida en parte el 13/11/2026:** R es de 30 días. Sigue abierto P.
25. **Rotación del secreto del HMAC.** ¿Qué pasa al rotar el secreto, que la lista de publicación exige antes de publicar? (a) Se invalida todo: cada cliente necesita una activación nueva con un instalador delante. (b) Periodo de transición con dos secretos: sin interrupción, pero el secreto antiguo sigue en uso un tiempo y hay que probar la transición (artículo 11).
26. **Otros indicios de robo.** Ante un código de autorización canjeado dos veces, un verificador PKCE incorrecto o un token de renovación presentado por otro cliente OAuth, ¿solo se rechaza o además se revoca la conexión y se alerta? Solo rechazar: no se corta nunca una conexión legítima por un reintento del asistente. Rechazar y revocar: es lo que recomiendan las buenas prácticas de OAuth para el código repetido, pero un reintento legítimo obligaría a reinstalar.
27. **Recurso ausente.** ¿Qué se hace si un asistente pide autorización sin indicar el recurso? Rechazar: si algún asistente no lo envía, no podrá conectar (lo mostrará la prueba de la fase 1). Suponer el recurso del conector: compatible, pero la vinculación del token a su recurso pasa a depender de que solo exista uno.
28. **Callback de ChatGPT con identificador variable.** ¿Qué se admite en el callback de ChatGPT que lleva un identificador variable (T-010), dado que la regla es coincidencia exacta con una lista cerrada? (a) Cualquier identificador con un formato fijo bajo ese prefijo, y después coincidencia exacta con el registrado: flexible, la lista deja de ser enumerable. (b) Solo identificadores dados de alta uno a uno por HumanaIA: lista realmente cerrada, a cambio de un paso más en cada instalación. (c) Esperar a lo que muestre la prueba real.
29. **Rendimiento (L, N).** ¿Qué latencia máxima en el percentil 95 y con qué carga deben cumplir la activación y la renovación? La arquitectura solo fija objetivo para `obtener_instrucciones`. Sin cifra, REQ-063 no se puede comprobar.
30. **Vida de la solicitud y del código de autorización (S, V).** ¿Cuántos minutos puede estar abierta la pantalla antes de que la solicitud caduque, y cuántos segundos vive el código de autorización que el asistente canjea? S corto: un instalador lento tiene que volver a empezar desde el asistente. S largo: una pantalla abierta y abandonada sirve más tiempo. V lo más corto que admitan los asistentes reduce el riesgo de canje por un tercero.

## Dependencias y decisiones relacionadas

- **Decisiones**: D-006 (código de un solo uso y conexiones revocables), T-009 (OAuth 2.1 con PKCE, token solo en cabecera), T-010 (callbacks), T-011 (metadatos, CIMD y DCR), T-012 (pruebas de base de datos en CI).
- **En VERIFICAR, no se dan por hechas**: V-106 (construir el servidor de autorización o usar una librería; lo decide la función 001), V-107 (conexión con un rol propio; condiciona la cuestión 16), V-113 (mecanismo del límite de intentos; condiciona la cuestión 9), V-108 (doble factor en las políticas de superadmin), V-112 (supervisión sin cuerpos de petición), V-114 (entorno previo).
- **ADR**: 0002 (autorización y activación), 0003 (aislamiento por cliente).
- **Seguridad**: A-01 a A-06 y A-22 de `docs/SEGURIDAD.md`, sus reglas para quien implementa y los puntos de la lista de publicación sobre límite de intentos, secretos y privacidad.
- **Modelo de referencia**: `docs/MODELO-DATOS.sql`, tablas `licencias`, `codigos_activacion`, `conexiones`, `clientes_oauth`, `codigos_autorizacion`, `tokens`, `alertas`, `auditoria`, y funciones `privado.licencia_vigente` y `privado.resolver_token`. El modelo no tiene funciones para canjear códigos ni para emitir, rotar o revocar tokens; los cambios que harían falta están en `propuestas.md`.
- **Función 001 (fase 1)**, de la que se parte:
  - el servidor de autorización que resulte de ella y la resolución de V-106;
  - los callbacks comprobados en la prueba real y lo que hace cada asistente con el parámetro de recurso;
  - el sí o no por asistente, que decide en qué asistentes se ejecuta CA-001;
  - su requisito 17 (respuesta que no distingue el motivo), su requisito 18 (bloqueo sencillo) y su requisito 20 (reutilización), que esta función sustituye por su versión definitiva.
- **Funciones de la fase 2**: 010 (tablas, RLS y roles sobre los que se apoya), 011 (consume «hay token de acceso válido o no»). Esta especificación no depende del contenido de sus especificaciones.
- **Fases posteriores**: la fase 3 usa estas capacidades desde el panel y añade el doble factor; la fase 4 añade el aviso fuera del panel; la fase 6 cambia el estado de la licencia por cobro.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
