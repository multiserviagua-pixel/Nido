# 040 · Acceso de los usuarios de cada cliente al panel

Estado: PROPUESTA
Fase: 5 · Fecha: 12/11/2026 · Autor: `especificador`

## Para qué

Cada cliente de HumanaIA necesita ver cómo funciona su agente de correo sin depender de la carpeta `panel`. Esta función da a las personas de cada cliente una forma segura de entrar en su panel, y solo en el suyo: alta exclusivamente por invitación, inicio y cierre de sesión, recuperación de acceso, una página «Cuenta» y el marco común del panel (navegación, guardia de acceso y estado «sin permiso») sobre el que se montan las páginas de las funciones 041 y 042.

El riesgo central es el acceso cruzado: que una persona vea algo de otro cliente o del área de superadmin. Esta función lo convierte en requisitos y en pruebas que se ejecutan, no en suposiciones.

El panel de cliente es de solo lectura: desde él no se dan órdenes al agente.

## Quién la usa y cómo

- Como **superadmin de HumanaIA**, quiero invitar a una persona a un cliente, reenviar o anular su invitación y retirarle el acceso, para que solo entre quien debe y deje de entrar quien ya no debe.
- Como **persona invitada por un cliente**, quiero aceptar la invitación con el mínimo de pasos y datos, para empezar a ver el estado de mi agente.
- Como **usuario de un cliente**, quiero entrar, salir y recuperar el acceso si lo pierdo, desde el ordenador o el móvil, para consultar mi panel cuando lo necesite.
- Como **responsable de HumanaIA**, quiero que esté demostrado que ningún usuario puede ver nada de otro cliente ni del área de superadmin, para poder publicar el panel.

## Requisitos

### Alta por invitación

| ID | Requisito |
| --- | --- |
| REQ-001 | No existe registro público. La única forma de obtener acceso al panel de cliente es aceptar una invitación vigente. |
| REQ-002 | Un superadmin, con su sesión de doble factor, puede invitar a una persona a un cliente desde la ficha de ese cliente, indicando únicamente su correo de acceso. Quién más puede invitar depende de la cuestión abierta 1. |
| REQ-003 | Cada invitación está ligada a un único cliente y a un único correo. Aceptarla da acceso solo a ese cliente y solo a la cuenta de ese correo. |
| REQ-004 | Una invitación caduca a las 72 horas de su envío (valor propuesto; cuestión abierta 10) y solo se puede aceptar una vez. |
| REQ-005 | En la ficha del cliente, el superadmin ve cada invitación con su estado (pendiente, aceptada, caducada o anulada) y su fecha, y puede reenviar o anular una invitación pendiente. Al reenviar, la invitación anterior deja de valer y solo vale la nueva; al anular, no vale ninguna. |
| REQ-006 | El superadmin puede retirar el acceso de un usuario a un cliente. El diálogo de confirmación dice que el efecto es inmediato. Desde la siguiente petición que haga ese usuario, no obtiene ningún dato de ese cliente, aunque tenga una sesión abierta. |
| REQ-007 | Invitar, reenviar, anular, aceptar una invitación y retirar un acceso dejan cada una una entrada de auditoría que identifica quién actuó, qué acción fue, a qué cliente y a qué usuario o invitación afectó, y cuándo. La entrada no contiene el correo de acceso y no se puede modificar ni borrar. |
| REQ-008 | El correo de invitación solo contiene lo necesario para aceptarla: que lo envía HumanaIA, qué permite, cómo aceptar y hasta cuándo es válida. No contiene datos de agentes, cifras, otros usuarios ni otros clientes. |
| REQ-009 | Para aceptar una invitación solo se pide lo que exija el método de entrada (cuestión abierta 4). No se pide nombre, teléfono, cargo ni ningún otro dato personal. |

### Entrada, sesión y recuperación

| ID | Requisito |
| --- | --- |
| REQ-010 | Un usuario vinculado a un cliente inicia sesión con el método que se decida (cuestión abierta 4) y, al entrar, llega al Resumen de su cliente. |
| REQ-011 | Un usuario puede recuperar el acceso a partir de su correo de acceso, mediante un enlace o código de un solo uso que caduca a los 30 minutos (valor propuesto; cuestión abierta 10). Al recuperar el acceso se cierran todas las demás sesiones abiertas de ese usuario. |
| REQ-012 | Abrir un enlace de invitación, de entrada o de recuperación no consume el enlace ni concede sesión por sí solo: hace falta una acción explícita de la persona en la página. Cada enlace o código concede como mucho una sesión. |
| REQ-013 | Cerrar sesión invalida la sesión también en el servidor. Después, ninguna petición hecha con esa sesión devuelve datos. |
| REQ-014 | La sesión caduca tras 8 horas sin actividad y, en todo caso, a los 7 días de iniciarse (valores propuestos; cuestión abierta 10). Al caducar se pide entrar de nuevo y, tras entrar, el usuario vuelve a la página del panel en la que estaba. |
| REQ-015 | Hay límite de intentos en inicio de sesión, aceptación de invitaciones, petición de enlaces o códigos y recuperación. Valores propuestos (cuestión abierta 10): por cuenta, 5 fallos en 15 minutos bloquean esa cuenta 15 minutos; por origen, 20 fallos en 15 minutos bloquean ese origen 15 minutos; como mucho 3 envíos de enlaces o códigos por correo y hora. El bloqueo es siempre temporal. |
| REQ-016 | El usuario recibe un aviso en su correo de acceso cuando se recupera el acceso a su cuenta o cambian sus datos de acceso. El aviso no contiene enlaces de acceso, códigos ni datos del cliente. |
| REQ-017 | Si el método de entrada incluye contraseña (cuestión abierta 4): exige al menos 12 caracteres, admite al menos 64, no impone reglas de composición, rechaza las contraseñas de una lista de contraseñas comunes, permite pegar y funciona con gestores de contraseñas. Valores propuestos; cuestión abierta 10. |

### Página «Cuenta»

| ID | Requisito |
| --- | --- |
| REQ-018 | La página «Cuenta» muestra el correo de acceso del usuario y el nombre comercial de su cliente, y permite cerrar sesión. Si hay contraseña, permite cambiarla pidiendo la actual. No permite cambiar ningún otro dato; el cambio de correo depende de la cuestión abierta 7. |

### Marco del panel

| ID | Requisito |
| --- | --- |
| REQ-019 | El marco del panel permite navegar entre Resumen, Actividad, Suscripción y Cuenta, e indica la sección actual con algo más que el color. No contiene ningún enlace, texto ni elemento del área de superadmin. |
| REQ-020 | Toda página y toda petición de datos del panel comprueba en el servidor, en cada petición, que hay una sesión válida de un usuario vinculado a un cliente con acceso vigente. Sin sesión, se lleva a la pantalla de entrada; con sesión pero sin vinculación vigente, se muestra «sin permiso». Ocultar un elemento de la interfaz no cuenta como control. |
| REQ-021 | El estado «sin permiso» dice qué ocurre y qué puede hacer la persona (contactar con HumanaIA o cerrar sesión). No muestra datos de ningún cliente ni el motivo interno de la denegación. |
| REQ-022 | Las pantallas de acceso, el marco y la página «Cuenta» tienen los estados de carga, error con forma de reintentar, sin permiso y, donde apliquen, vacío y datos parciales. |
| REQ-023 | Las pantallas de acceso, el marco y la página «Cuenta» cumplen WCAG 2.2 AA, incluida la autenticación accesible: ningún paso exige resolver una prueba cognitiva ni recordar o transcribir sin poder pegar. |
| REQ-024 | Las pantallas de acceso, el marco y la página «Cuenta» se usan en móvil: sin desplazamiento horizontal desde 320 píxeles de ancho, menú plegado en un cajón y objetivos táctiles de al menos 24 por 24 píxeles. |
| REQ-025 | Todos los textos están en español de España, con trato de tú y sin jerga técnica. Cada mensaje de error dice qué ha pasado y qué se puede hacer, sin datos internos. |
| REQ-026 | Las pantallas de acceso, el marco y la página «Cuenta» muestran su contenido principal en menos de 2,5 segundos en el percentil 75, en móvil con red 4G simulada (valor propuesto; cuestión abierta 10). |

### Derivación del cliente, aislamiento y separación con el superadmin

| ID | Requisito |
| --- | --- |
| REQ-027 | El cliente cuyos datos se muestran se deriva siempre de la sesión del usuario. Ninguna página, petición ni formulario del panel acepta un identificador de cliente; si llega uno, no altera qué datos se devuelven. |
| REQ-028 | El panel de cliente solo se sirve a usuarios vinculados a un cliente, en el número que fije la cuestión abierta 3. Ser superadmin no da acceso al panel de cliente ni hace que el panel muestre datos de uno o varios clientes. |
| REQ-029 | Un usuario de cliente no obtiene nada del área de superadmin: ni páginas, ni datos, ni acciones, ni por la interfaz ni llamando directamente a la API de datos con su sesión. |
| REQ-030 | Con su propia sesión, por cualquier vía, incluida la llamada directa a la API de datos, un usuario de cliente no obtiene datos de otro cliente, el texto del prompt, conexiones, códigos de activación, tokens, auditoría, la lista de administradores, invitaciones ni datos de acceso de otros usuarios (salvo lo que decida la cuestión abierta 2). Tampoco puede escribir nada, salvo sus propios datos de acceso mediante las acciones de esta función. |

### Privacidad, registros y protección de la sesión

| ID | Requisito |
| --- | --- |
| REQ-031 | El correo de acceso no aparece en direcciones de página, registros del servidor, supervisión de errores ni mensajes de error. Es el único dato personal que trata esta función, junto con la contraseña si se decide usarla. |
| REQ-032 | Quedan registrados como eventos de seguridad, con fecha, tipo y el identificador interno del usuario si existe: inicio de sesión fallido, bloqueo por intentos, recuperación pedida y usada, retirada de acceso, cierre de sesiones por recuperación y fallo al enviar un correo de acceso. Ningún evento contiene correos, contraseñas, códigos ni enlaces. |
| REQ-033 | Las pantallas de acceso y el panel no cargan recursos de terceros en tiempo de ejecución y no guardan en el navegador nada que no sea estrictamente necesario para la sesión y su protección. |
| REQ-034 | La sesión solo viaja por conexiones cifradas y no es legible por el código de la página. Las respuestas que contienen datos del panel no se guardan en cachés compartidas ni en la caché del navegador. |

## Casos negativos

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-035 | Invitación caducada, ya usada o anulada | Se rechaza con el mismo mensaje en los tres casos («Esta invitación ya no es válida; pide otra a HumanaIA»). No se crea cuenta, vinculación ni sesión. |
| REQ-036 | Enlace de invitación abierto por otra persona o en otro dispositivo | La aceptación solo puede vincular la cuenta del correo invitado; no se puede cambiar ese correo al aceptar. Tras el primer uso, cualquier otro se rechaza. La aceptación queda en la auditoría y en la ficha del cliente. |
| REQ-037 | Invitar un correo que ya es usuario de ese cliente, de otro cliente o superadmin | Si ya es usuario de ese cliente, no se duplica nada y se informa al superadmin. Si es de otro cliente o es superadmin, se aplica lo que decidan las cuestiones abiertas 3 y 8; mientras no estén decididas, se rechaza con un motivo cerrado y no se crea nada. |
| REQ-038 | Intento de registrarse sin invitación, por la interfaz o llamando directamente al servicio de acceso | No se crea ninguna cuenta ni vinculación. La respuesta no revela si el correo existe. |
| REQ-039 | Enumeración de correos en inicio de sesión, petición de enlace o código, recuperación y aceptación | La respuesta (texto, código de estado y tiempo) no permite distinguir entre un correo dado de alta, uno inexistente, uno sin cliente, uno con el acceso retirado, uno de superadmin o uno bloqueado. |
| REQ-040 | Demasiados intentos desde un origen o contra una cuenta, también contra correos inexistentes | Bloqueo temporal según REQ-015, con un mensaje que dice cuánto esperar y no revela si la cuenta existe. Durante el bloqueo no se envían correos. Queda un evento de seguridad. |
| REQ-041 | Enlace de acceso abierto antes por un filtro de correo o un analizador automático | No se consume ni concede sesión. La persona puede usarlo después con normalidad. |
| REQ-042 | Sesión caducada o cerrada, y uso del botón «atrás», de una pestaña antigua o de páginas en caché | No se muestra ningún dato del panel. Se pide entrar de nuevo. |
| REQ-043 | Usuario al que se retira el acceso mientras tiene una sesión abierta | Su siguiente petición, de página o directa a la API de datos, no devuelve datos del cliente. Ve «sin permiso» o la pantalla de entrada. |
| REQ-044 | Usuario con sesión válida pero sin ningún cliente vinculado | Ve «sin permiso». No obtiene datos ni el nombre de ningún cliente. |
| REQ-045 | Usuario de cliente que pide una ruta o una acción del área de superadmin (incluidas invitar, reenviar, anular y retirar) | Se deniega. La respuesta es la misma para cualquier ruta del área y no contiene datos, menús ni nombres de clientes. |
| REQ-046 | Superadmin, con o sin doble factor, que entra en el panel de cliente sin estar vinculado a ese cliente | Ve «sin permiso». No ve datos de ningún cliente a través del panel de cliente. |
| REQ-047 | Superadmin sin doble factor que intenta invitar, reenviar, anular o retirar | Se rechaza y no se crea ni cambia nada. |
| REQ-048 | Servicio de acceso o base de datos sin respuesta o con error | No se concede acceso. Se muestra un mensaje claro con forma de reintentar, sin datos internos. Nunca se concede acceso por defecto. |
| REQ-049 | Servicio de envío de correo caído al invitar, reenviar o recuperar | La invitación no figura como enviada y el superadmin ve el error y puede reintentar. En la recuperación, el usuario recibe la misma respuesta que siempre (REQ-039) y queda un evento de seguridad. |
| REQ-050 | Dos aceptaciones simultáneas de la misma invitación, o aceptación y anulación a la vez | Como mucho una tiene éxito y se crea una sola vinculación. El estado final es coherente: nunca queda una invitación anulada con acceso concedido por ella. |
| REQ-051 | Pantalla de acceso o del panel cargada dentro de otra web, o formulario enviado desde otro sitio | No se muestra dentro de la otra web. El envío desde otro sitio se rechaza sin efecto. |
| REQ-052 | Identificador de otro cliente añadido a mano en la dirección, en los parámetros, en el cuerpo o en las cabeceras de una petición | No se devuelve ningún dato de ese cliente. La respuesta es la misma tanto si ese cliente existe como si no. |
| REQ-053 | Formulario de acceso o de invitación con campos de más (por ejemplo, cliente, rol o administrador) | Los campos ajenos no tienen ningún efecto ni elevan permisos. Sus nombres y valores no se registran. |
| REQ-054 | Dirección de vuelta tras entrar que apunta fuera del panel o a otro dominio | Se ignora y el usuario llega al Resumen de su cliente. |
| REQ-055 | Usuario de un cliente cuyo estado o el de su licencia no tenga decidido el acceso (cuestión abierta 6) | Se deniega con un mensaje claro. |
| REQ-056 | Usuario de cliente que intenta escribir en datos de su cliente (pausar, reanudar, cambiar reglas u otro cambio) llamando directamente a la API de datos | Se rechaza y no cambia nada. |
| REQ-057 | Invitación abierta con una sesión iniciada de otra cuenta | No se vincula la cuenta de la sesión abierta. Se pide cerrar sesión antes de aceptar. |

## Criterios de aceptación

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | La pantalla de entrada no ofrece registro. 10 intentos de crear cuenta con correos ficticios nuevos, 5 por la interfaz y 5 llamando directamente al servicio de acceso, crean 0 cuentas y 0 vinculaciones | REQ-001, REQ-038 |
| CA-002 | Un superadmin con doble factor invita un correo ficticio al cliente A. La persona acepta pidiéndosele solo los datos que exige el método y llega al Resumen de A. Con su sesión obtiene 0 filas del cliente B en todas las tablas y vistas expuestas | REQ-002, REQ-003, REQ-009, REQ-010 |
| CA-003 | Una invitación a las 72 horas y 1 minuto se rechaza; una aceptada se rechaza en el segundo uso; una anulada se rechaza. Los tres mensajes son idénticos y en los tres casos se crean 0 cuentas, vinculaciones y sesiones | REQ-004, REQ-035 |
| CA-004 | Tras reenviar, el enlace anterior se rechaza y el nuevo funciona. Tras anular, ninguno funciona. La ficha muestra el estado correcto en los 4 estados posibles | REQ-005 |
| CA-005 | Con una sesión abierta del usuario, el superadmin retira su acceso. En 10 repeticiones, la siguiente petición de página y la siguiente petición directa a la API de datos hechas con esa sesión devuelven 0 datos del cliente | REQ-006, REQ-043 |
| CA-006 | Cada una de las 5 acciones (invitar, reenviar, anular, aceptar, retirar) genera exactamente 1 entrada de auditoría con quién, acción, cliente, usuario o invitación afectados y fecha. 0 entradas contienen el correo. Intentar modificar o borrar una entrada falla | REQ-007 |
| CA-007 | Revisión de los correos de invitación, recuperación y aviso enviados en las pruebas: contienen solo los elementos enumerados en sus requisitos y 0 datos de agentes, cifras, otros usuarios u otros clientes. El aviso se envía en cada recuperación y cada cambio de datos de acceso | REQ-008, REQ-016 |
| CA-008 | Un enlace o código de recuperación funciona una vez; el segundo uso y el uso a los 30 minutos y 1 segundo se rechazan. Con 2 sesiones abiertas en otros navegadores, tras recuperar el acceso las 2 devuelven 0 datos | REQ-010, REQ-011 |
| CA-009 | 3 peticiones automáticas que abren el enlace sin acción de la persona no lo consumen ni crean sesión; después la persona lo usa con éxito. Un mismo enlace o código no crea más de 1 sesión | REQ-012, REQ-041 |
| CA-010 | Tras cerrar sesión, reutilizar la sesión anterior devuelve 0 datos, y el botón «atrás» y una pestaña antigua no muestran datos. Una sesión inactiva 8 horas y 1 minuto caduca; una con actividad caduca a los 7 días y 1 minuto. Tras volver a entrar, se llega a la página donde se estaba. Todas las respuestas con datos del panel van marcadas para no guardarse en caché | REQ-013, REQ-014, REQ-034, REQ-042 |
| CA-011 | El 6.º fallo en 15 minutos contra una cuenta la bloquea, y lo mismo ocurre con un correo inexistente. El 21.º fallo en 15 minutos desde un origen lo bloquea. La 4.ª petición de enlace o código en una hora no envía correo. Tras el bloqueo se puede volver a entrar. Cada bloqueo deja 1 evento de seguridad | REQ-015, REQ-040 |
| CA-012 | Si hay contraseña: una de 11 caracteres se rechaza; una de 12 y una de 64 se aceptan; una de la lista de contraseñas comunes se rechaza; pegar funciona en todos los campos de acceso | REQ-017 |
| CA-013 | La página «Cuenta» muestra el correo de acceso y el nombre del cliente, cierra sesión y, si hay contraseña, no la cambia sin la actual. No ofrece ningún otro campo editable, y 0 intentos de cambiar otros datos por la API de datos tienen efecto | REQ-018 |
| CA-014 | Las 4 secciones se alcanzan con teclado; un lector de pantalla anuncia la sección actual y esta se distingue en escala de grises. El código servido al usuario de cliente contiene 0 enlaces, textos o elementos del área de superadmin | REQ-019 |
| CA-015 | Sobre el inventario completo de páginas y peticiones de datos del panel: sin sesión, el 100 % lleva a la entrada; con sesión sin vinculación, el 100 % muestra «sin permiso» con salida y contacto; en los dos casos, 0 datos y 0 nombres de clientes | REQ-020, REQ-021, REQ-044 |
| CA-016 | Hay capturas de cada estado obligatorio de las pantallas de acceso, el marco y la página «Cuenta», en escritorio y en móvil | REQ-022 |
| CA-017 | La revisión automática de accesibilidad de las pantallas de acceso, el marco y «Cuenta» da 0 incumplimientos graves o críticos, y la revisión manual con teclado y lector de pantalla da 0 incumplimientos de WCAG 2.2 AA, incluida la autenticación accesible | REQ-023 |
| CA-018 | A 320 y 1280 píxeles de ancho y con el texto al 400 %, 0 pantallas con desplazamiento horizontal. En móvil el menú se pliega en un cajón. 0 objetivos táctiles por debajo de 24 por 24 píxeles | REQ-024 |
| CA-019 | Revisión de todos los textos de la función: 100 % en español de España con trato de tú, 0 términos técnicos, y cada mensaje de error dice qué ha pasado y qué hacer, sin datos internos | REQ-025 |
| CA-020 | Medición en el entorno previo, en móvil con red 4G simulada: el contenido principal de las pantallas de acceso, el marco y «Cuenta» aparece en menos de 2,5 segundos en el percentil 75 | REQ-026 |
| CA-021 | Prueba de extremo a extremo de acceso cruzado, bloqueante en CI: con usuarios de los clientes A y B, el de A cambia direcciones y añade identificadores de B en la dirección, los parámetros, el cuerpo y las cabeceras, y llama directamente a la API de datos con su sesión. Resultado: 0 datos de B, y respuesta idéntica con el identificador real de B y con uno aleatorio | REQ-003, REQ-027, REQ-052 |
| CA-022 | Un superadmin no vinculado entra en el panel de cliente con doble factor y sin él: en los dos casos ve «sin permiso» y 0 datos de clientes | REQ-028, REQ-046 |
| CA-023 | Un usuario de cliente pide cada ruta del área de superadmin y cada acción de invitar, reenviar, anular y retirar: el 100 % se deniega con la misma respuesta y 0 datos. Un superadmin sin doble factor intenta las 4 acciones: 0 cambios | REQ-029, REQ-045, REQ-047 |
| CA-024 | Prueba bloqueante en CI que recorre todas las tablas, vistas y funciones expuestas a la API de datos, obtenidas del esquema en el momento de la prueba y no de una lista fija, con la sesión de un usuario del cliente A: 0 filas de las categorías prohibidas en REQ-030 y 0 escrituras aceptadas | REQ-030, REQ-056 |
| CA-025 | Tras ejecutar todas las pruebas de la función, una búsqueda de los correos ficticios usados en los registros del servidor, la supervisión de errores, las direcciones registradas y los mensajes de error da 0 apariciones. Los formularios no piden ningún dato fuera de los enumerados | REQ-009, REQ-031 |
| CA-026 | Cada tipo de evento de seguridad de REQ-032 se genera al menos una vez en las pruebas y queda registrado; 0 eventos contienen correos, contraseñas, códigos o enlaces | REQ-032 |
| CA-027 | El inventario de peticiones de red de las pantallas de acceso y del panel muestra 0 peticiones a dominios de terceros, y lo guardado en el navegador se limita a lo necesario para la sesión y su protección | REQ-033 |
| CA-028 | Una página del panel servida sin cifrar se redirige a la versión cifrada sin enviar la sesión, y el código de la página no puede leer la sesión | REQ-034 |
| CA-029 | Invitar un correo que ya es usuario del cliente crea 0 duplicados e informa al superadmin. Invitar uno de otro cliente o de un superadmin se comporta según las cuestiones abiertas 3 y 8, o, sin decidir, se rechaza con 0 elementos creados | REQ-037 |
| CA-030 | Para 6 tipos de correo (dado de alta, inexistente, sin cliente, con acceso retirado, superadmin, bloqueado), en inicio de sesión, petición de enlace o código, recuperación y aceptación: mismo texto y mismo código de estado, y diferencia entre medianas de tiempo inferior a 100 ms en 30 intentos por tipo | REQ-039 |
| CA-031 | Con el servicio de acceso o la base de datos sin respuesta, 0 accesos concedidos y mensaje sin datos internos. Con el envío de correo caído, la invitación no figura como enviada, el superadmin ve el error y reintenta con éxito cuando el servicio vuelve; la recuperación responde igual que siempre y deja 1 evento de seguridad | REQ-048, REQ-049 |
| CA-032 | 20 aceptaciones simultáneas de la misma invitación dan exactamente 1 éxito y 1 vinculación. 20 repeticiones de aceptación y anulación simultáneas terminan siempre en un estado coherente | REQ-050 |
| CA-033 | Las pantallas de acceso y del panel cargadas dentro de una página de otro origen no se muestran. El 100 % de los formularios que cambian algo, enviados desde otro origen, se rechazan sin efecto | REQ-051 |
| CA-034 | Formularios de acceso y de invitación enviados con campos de cliente, rol y administrador añadidos: 0 efectos y 0 apariciones de esos nombres o valores en los registros | REQ-053 |
| CA-035 | 5 direcciones de vuelta externas o con otro esquema llevan al Resumen del cliente propio | REQ-054 |
| CA-036 | Para cada combinación de estado del cliente y de la licencia, el acceso es el que fije la cuestión abierta 6; un estado no contemplado da acceso denegado | REQ-055 |
| CA-037 | Una invitación aceptada desde otro navegador solo vincula la cuenta del correo invitado y no permite cambiar ese correo. Abierta con una sesión iniciada de otra cuenta, no vincula esa cuenta y pide cerrar sesión | REQ-036, REQ-057 |
| CA-038 | Todas las pruebas automáticas de los casos negativos están en verde en CI | REQ-035 a REQ-057 |

## Fuera de alcance

- El contenido de las páginas Resumen y Actividad (función 041) y de la página Suscripción y su portal de pago (función 042). Esta función solo les da el marco, la navegación y la guardia de acceso.
- El acceso y el doble factor de los superadmin, la gestión de administradores y la ficha del cliente en sí (fase 3). Esta función solo añade a la ficha las acciones de invitar, reenviar, anular y retirar.
- Que un superadmin vea el panel como si fuera un cliente (suplantación). Si se quisiera, sería otra función.
- Cualquier acción sobre el agente desde el panel de cliente: pausar, reanudar o cambiar reglas. El panel es de solo lectura.
- El envío de alertas y la supervisión de picos de intentos fallidos (fase 4). Esta función solo registra los eventos.
- Textos legales, política de privacidad, plazos de conservación y atención de los derechos de los interesados (fase 6).
- La migración de los clientes actuales desde la carpeta `panel` (fase 6).

## Cuestiones abiertas

Se resuelven en `aclaraciones.md`. Ninguna está contestada aquí.

1. **¿Quién da de alta a los usuarios de un cliente?**
   - a) Solo un superadmin. El panel de cliente sigue siendo de solo lectura y todas las altas pasan por HumanaIA.
   - b) El superadmin invita al primer usuario de cada cliente y ese usuario invita a los demás.
   - c) Ambos. En b) y c) el panel de cliente deja de ser de solo lectura en lo que toca a usuarios, hay que distinguir permisos entre usuarios de un mismo cliente (quién puede invitar y retirar), la auditoría debe cubrir acciones de usuarios de cliente y no solo de superadmin, y el modelo de datos de referencia cambia (hoy solo un superadmin puede crear vinculaciones).

2. **¿Puede un cliente tener varios usuarios, y ven todos lo mismo?**
   - a) Un solo usuario por cliente. Es lo más simple, pero si esa persona se va, el cliente queda sin acceso hasta que HumanaIA invite a otra.
   - b) Varios usuarios con los mismos permisos de lectura. Hay que decidir además si cada uno ve quiénes son los demás (eso expone sus correos dentro del cliente).
   - c) Varios usuarios con niveles (por ejemplo, uno que además ve Suscripción o gestiona usuarios). Exige un modelo de permisos dentro del cliente y afecta también a la función 042.

3. **¿Puede una misma persona pertenecer a varios clientes (por ejemplo, una gestoría)?**
   - a) No. Cada cuenta pertenece a un solo cliente; quien lleve varios necesita un correo distinto por cliente. El cliente se deriva de la sesión sin ambigüedad (artículo 2).
   - b) Sí. Habría que elegir el cliente dentro del panel, y esa elección es una entrada del usuario: roza el artículo 2 y exigiría definir que el cliente activo forma parte de la sesión y se valida contra las vinculaciones en cada petición. Además, las vistas actuales del modelo devolverían a la vez los datos de todos sus clientes.

4. **¿Cómo se entra en el panel?**
   - a) Contraseña, con recuperación por correo. La credencial no depende de cada correo, pero la recuperación sigue pasando por el buzón.
   - b) Enlace o código de un solo uso por correo, sin contraseña. Cada entrada genera un correo: depende de que el servicio de envío funcione y aumenta lo que pasa por el buzón.
   - c) Ambos.
   En cualquier opción, hay que tener en cuenta que el buzón del cliente lo lee su propio agente de correo (los enlaces y códigos pasan por el asistente de IA del cliente), y que los filtros de correo abren enlaces antes que la persona. Un código que se teclea resiste mejor a los filtros que un enlace, pero el agente también puede leerlo. La entrega de la fase 5 en `docs/PLAN.md` dice «acceso con sus credenciales», lo que podría dar por hecha la contraseña.

5. **¿Doble factor para los usuarios de cliente?**
   - a) No se ofrece. Menos fricción; la seguridad descansa en el método de entrada y el buzón.
   - b) Se ofrece y es opcional. Hay que definir cómo se recupera si se pierde el segundo factor.
   - c) Se exige, como a los superadmin. Más protección y más soporte; mismo problema de recuperación.

6. **¿Qué acceso tiene un usuario según el estado de su cliente y de su licencia?** Para cada estado (cliente dado de baja; licencia suspendida por impago dentro del periodo de gracia; suspendida tras la gracia; suspendida a mano; revocada) elegir entre: acceso completo, acceso solo a Suscripción y Cuenta (por ejemplo, para poder regularizar un impago), o sin acceso. Afecta a la función 042 y a la fase 6. Hoy el modelo de referencia no tiene en cuenta estos estados al dar acceso.

7. **¿Puede el usuario cambiar por sí mismo su correo de acceso?**
   - a) Sí, confirmándolo desde el correo antiguo y desde el nuevo. Más autonomía; más superficie de ataque.
   - b) No; lo pide a HumanaIA, que retira el acceso y envía una invitación al correo nuevo. Más soporte, pero también resuelve el caso de quien pierde su buzón.

8. **¿Puede una misma cuenta ser a la vez superadmin y usuario de un cliente?**
   - a) No. Se rechaza invitar a un superadmin y dar rol de superadmin a un usuario de cliente; el personal de HumanaIA usa cuentas distintas para probar el panel de cliente.
   - b) Sí. Hay que decidir qué rol aplica en cada momento; con la sesión de un superadmin, el panel de cliente podría ver los datos de todos los clientes si no se separa expresamente.

9. **¿Qué pasa con la cuenta de una persona cuando se le retira su último acceso?**
   - a) Se borra. Mínimos datos guardados; la auditoría conserva solo el identificador interno.
   - b) Se conserva desactivada. Facilita volver a invitarla; guarda su correo sin uso, lo que exige un plazo de conservación (fase 6).
   - c) Se conserva tal cual, sin vinculación.

10. **Umbrales propuestos que hay que confirmar o cambiar:** caducidad de la invitación (72 horas); caducidad del enlace o código de recuperación (30 minutos); sesión (8 horas sin actividad y 7 días como máximo); límites de intentos (5 fallos por cuenta en 15 minutos, 20 por origen en 15 minutos, bloqueo de 15 minutos, 3 envíos por correo y hora); contraseña, si la hay (mínimo 12, admite 64, lista de contraseñas comunes); rendimiento (2,5 segundos en el percentil 75 en móvil con 4G simulada).

## Dependencias y decisiones relacionadas

- **Fase 2 cerrada:** modelo de datos y aislamiento por cliente con sus pruebas en CI. El modelo de referencia (`docs/MODELO-DATOS.sql`, vinculación de usuarios con clientes, función de clientes del usuario, auditoría por disparador y políticas de solo lectura del usuario de cliente) es una PROPUESTA y necesita cambios según las cuestiones abiertas 1, 2, 3, 6 y 9, además de un registro de invitaciones.
- **Fase 3:** sistema de diseño hecho (V-110); ficha del cliente, donde viven las acciones de invitar, reenviar, anular y retirar; acceso de superadmin con doble factor (V-108), con el que el panel de cliente comparte entrada.
- **Proveedor de envío de correo en la UE** para invitaciones, recuperación y avisos. V-111 solo cubre los avisos de alertas de la fase 4.
- **Límite de intentos:** V-113 (fase 2) cubre la activación; debe extenderse al inicio de sesión, la aceptación y la recuperación de esta función.
- **Supervisión de errores sin cuerpos de petición** (V-112).
- **Fase 6:** textos legales, plazos de conservación y encargados de tratamiento.
- **Funciones 041 y 042:** usan el marco, la navegación y la guardia de esta función.
- Decisiones: D-002, D-004, D-012, T-004, T-005, V-108, V-110, V-111, V-112, V-113.
- ADR: 0003 (aislamiento por cliente).
- Seguridad: amenazas A-07, A-10 y A-21; lista de publicación: «Límite de intentos en activación y en inicio de sesión» y «Prueba de extremo a extremo de acceso cruzado entre dos clientes».
- Constitución: artículos 1, 2, 3, 7, 10, 12 y 13.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
