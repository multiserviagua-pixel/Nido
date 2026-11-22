# 024 · Auditoría visible de las acciones de superadmin

Estado: PLANIFICADA
Fase: 3 · Fecha: 12/11/2026 · Revisada con las aclaraciones: 13/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Un administrador puede crear y dar de baja clientes, revocar licencias y conexiones, generar códigos de activación, pausar agentes, cambiar las reglas de un cliente, exportar las cifras de un cliente y gestionar a otros administradores. Si una de esas cuentas se usa mal o se roba (amenaza A-11), el equipo tiene que poder saber quién hizo qué, sobre qué y cuándo, cuándo entró cada cuenta, y estar seguro de que nadie, tampoco un superadmin, ha podido borrar ni retocar ese rastro. Esta función hace visible la auditoría que guarda la fase 2 en una página del dashboard de superadmin, con las acciones de personas y los hechos sin persona que ayudan a seguir un incidente, y es dueña del inventario cerrado de acciones de superadmin de la fase 3 y de la prueba de que cada una deja su fila. Convierte el criterio de la fase «Cada acción de superadmin deja una fila de auditoría» en algo comprobable.

## Términos

Se usan con este sentido en toda la especificación.

- **Acción de superadmin**: cambio que una persona hace en el área de superadmin con su cuenta de administrador, o el responsable con los procedimientos fuera del panel de la función 021; además, el inicio de sesión completo, los cambios de contraseña y los bloqueos de una cuenta de administrador, y la exportación de las cifras de un cliente, que es la única lectura que se audita. Las consultas no son acciones.
- **Inventario**: lista cerrada de acciones de superadmin de la fase 3, en la tabla de abajo. Cada entrada tiene un nombre del dominio, que es el texto que ve el usuario.
- **Hecho sin persona**: cambio que no hace una persona (lo hace el agente del cliente a través del conector, o el sistema), de la lista cerrada de abajo.
- **Fila de auditoría**: anotación de una acción o de un hecho sin persona con actor, acción, tipo de objeto, identificador del objeto, cliente si aplica y momento; en los cambios de reglas, también qué reglas cambiaron.
- **Fila principal**: la fila que nombra la acción. Hay exactamente una por acción.
- **Fila vinculada**: la fila de cada otro objeto que la misma acción cambia. Va unida a su fila principal, con el mismo actor y el mismo momento.
- **Actor**: quién hizo la acción. Es una cuenta de persona o un valor de la lista cerrada «Sistema», «Agente del cliente».
- **Sesión completa** y **administrador activo**: con el sentido de la función 021.
- **Últimos 30 días**: el día de hoy y los 29 anteriores, días completos en hora de Madrid.
- **Volumen de referencia**: 1.000 clientes (respondido por el responsable); 500.000 filas de auditoría y 30 actores distintos, de los que 10 están dados de baja, como propuesta que se confirma al aprobar esta especificación.

## Quién la usa y cómo

- Como **administrador de HumanaIA**, quiero ver quién hizo qué, sobre qué cliente y cuándo, para entender un cambio que no esperaba.
- Como **responsable de HumanaIA**, ante una cuenta de administrador sospechosa, quiero filtrar por esa cuenta y por un periodo y obtener todo lo que hizo y cuándo entró, para contener el incidente y anotar hechos y horas sin borrar nada.
- Como **responsable de HumanaIA**, quiero seguir una orden o una conexión nueva hasta lo que hizo con ella el agente del cliente, en el mismo sitio.
- Como **responsable de HumanaIA**, quiero saber que ningún administrador puede borrar, cambiar ni falsificar filas de auditoría, tampoco las suyas.
- Como **usuario de un cliente** que llega por error a la auditoría, debo ver «sin permiso» y ningún dato.

## Inventario de acciones de superadmin de la fase 3

Lista cerrada. El nombre de la segunda columna es el texto que muestra la página. La columna «Actor» dice quién figura como actor. La columna «Fila» dice si la entrada es una acción con fila principal propia o si aparece como fila vinculada de otra acción que la causa. La columna «Origen» dice qué función exige la acción; la 024 comprueba que todas dejan fila.

| Entrada | Acción (texto visible) | Tipo de objeto | Cliente | Actor | Fila | Origen |
| --- | --- | --- | --- | --- | --- | --- |
| I-01 | Dio de alta un cliente | Cliente | Sí | Administrador de la sesión | Principal | Función 022 |
| I-02 | Editó un cliente | Cliente | Sí | Administrador de la sesión | Principal | Función 022 |
| I-03 | Dio de baja un cliente | Cliente | Sí | Administrador de la sesión | Principal | Función 022 |
| I-04 | Reactivó un cliente | Cliente | Sí | Administrador de la sesión | Principal | Función 022 |
| I-05 | Creó una licencia | Licencia | Sí | Administrador de la sesión | Principal | Función 022 |
| I-06 | Suspendió una licencia | Licencia | Sí | Administrador de la sesión | Principal | Función 022 |
| I-07 | Reactivó una licencia | Licencia | Sí | Administrador de la sesión | Principal | Función 022 |
| I-08 | Revocó una licencia | Licencia | Sí | Administrador de la sesión | Principal | Función 022 |
| I-09 | Cambió la caducidad de una licencia (fijar, cambiar o quitar) | Licencia | Sí | Administrador de la sesión | Principal | Función 022 |
| I-10 | Generó un código de activación | Código de activación | Sí | Administrador de la sesión | Principal | Función 022 |
| I-11 | Anuló un código de activación | Código de activación | Sí | El de la acción principal | Vinculada a I-10 (al generar otro código para la misma licencia) o a I-08 (al revocar la licencia) | Función 022 (anulación automática; no hay anulación a mano) |
| I-12 | Revocó una conexión | Conexión | Sí | Administrador de la sesión, o el de la acción principal | Principal; o vinculada a I-08 (conexiones revocadas por la revocación de su licencia) | Función 022 |
| I-13 | Creó una orden de pausa | Orden | Sí | Administrador de la sesión | Principal | Función 023 |
| I-14 | Creó una orden de reanudación | Orden | Sí | Administrador de la sesión | Principal | Función 023 |
| I-15 | Anuló una orden de pausa | Orden | Sí | Administrador de la sesión | Principal | Función 023 |
| I-16 | Anuló una orden de reanudación | Orden | Sí | Administrador de la sesión | Principal | Función 023 |
| I-17 | Anuló por sustitución una orden | Orden | Sí | El de la acción principal | Vinculada a I-13 o I-14 (la orden nueva sustituye a la viva) | Función 023 |
| I-18 | Exportó las cifras de los informes de un cliente | Cliente | Sí | Administrador de la sesión | Principal | Función 023 |
| I-19 | Creó el primer administrador | Administrador | No | El responsable, fuera del panel | Principal | Función 021 |
| I-20 | Invitó a un administrador | Invitación | No | Administrador de la sesión | Principal | Función 021 |
| I-21 | Aceptó una invitación de administrador | Invitación | No | La persona invitada | Principal | Función 021 |
| I-22 | Reactivó por invitación una cuenta de administrador dada de baja | Administrador | No | El de la acción principal | Vinculada a I-21 (invitación a la dirección de una cuenta dada de baja) | Función 021 |
| I-23 | Anuló una invitación | Invitación | No | Administrador de la sesión | Principal | Función 021 |
| I-24 | Dio de baja a un administrador | Administrador | No | Administrador de la sesión | Principal | Función 021 |
| I-25 | Registró un segundo factor | Segundo factor | No | El titular | Principal | Función 021 |
| I-26 | Sustituyó un segundo factor | Segundo factor | No | El titular | Principal | Función 021 |
| I-27 | Quitó un segundo factor | Segundo factor | No | El titular | Principal | Función 021 |
| I-28 | Usó un código de recuperación | Códigos de recuperación | No | El de la acción principal | Vinculada a I-33 (entrada con el código) o a I-25, I-26 o I-27 (verificación previa con el código) | Función 021 |
| I-29 | Regeneró sus códigos de recuperación | Códigos de recuperación | No | El titular | Principal | Función 021 |
| I-30 | Confirmó la retirada del segundo factor perdido de otro administrador | Segundo factor | No | Administrador de la sesión que confirma | Principal | Función 021 |
| I-31 | Retiró, fuera del panel, el segundo factor perdido del único administrador | Segundo factor | No | El responsable, fuera del panel | Principal | Función 021 |
| I-32 | Completó una recuperación por pérdida del segundo factor | Administrador | No | El titular | Principal | Función 021 |
| I-33 | Inició sesión | Administrador | No | El titular, al completar la sesión | Principal | Función 021 |
| I-34 | Cerró las demás sesiones | Administrador | No | El titular | Principal | Función 021 |
| I-35 | Cambió su contraseña | Administrador | No | El titular | Principal | Función 021 |
| I-36 | Restableció su contraseña | Administrador | No | El titular, identificado por la prueba de un solo uso | Principal | Función 021 |
| I-37 | Bloqueó el acceso con contraseña por intentos fallidos | Administrador | No | «Sistema» | Principal | Función 021 |
| I-38 | Bloqueó la verificación del segundo factor por intentos fallidos | Administrador | No | «Sistema» | Principal | Función 021 |
| I-39 | Cambió las reglas de un cliente | Reglas del cliente | Sí | Administrador de la sesión | Principal | Función 025 |
| I-40 | Restableció las reglas de un cliente a los valores por defecto | Reglas del cliente | Sí | Administrador de la sesión | Principal | Función 025 |
| I-41 | Guardó las reglas por defecto de un cliente nuevo | Reglas del cliente | Sí | El de la acción principal | Vinculada a I-01 (el alta guarda las reglas del cliente con los valores por defecto) | Funciones 022 y 025 |

Son 41 entradas. Pueden ser fila principal 36 (todas menos I-11, I-17, I-22, I-28 e I-41). Pueden ser fila vinculada 6 (I-11, I-12, I-17, I-22, I-28 e I-41).

**Reglas cambiadas.** Las filas de I-39 e I-40 anotan, además, qué reglas cambiaron, con valores de la lista cerrada de las cinco reglas de la función 025: «Máximo de correos por revisión», «Ventana de días», «Guardar adjuntos», «Preparar borradores» y «Descargar facturas por enlace». Nunca anotan sus valores, ni anteriores ni nuevos. Las demás filas no llevan este dato.

**Entradas condicionales de la versión anterior.** Ya están decididas: entran reactivar un cliente, la anulación automática de un código, la anulación por sustitución de una orden, la exportación de las cifras de un cliente, cerrar las demás sesiones y los inicios de sesión, bloqueos y cambios de contraseña; no entran la anulación a mano de un código suelto (la función 022 no la ofrece) ni el cambio de canal del cliente (fase 4, función 030).

**Lo que no es acción de superadmin.** No dejan fila: consultar pantallas (también la propia auditoría), cerrar la propia sesión, verificar el segundo factor como paso del inicio de sesión (la fila es la de I-33), solicitar un restablecimiento de contraseña (la fila es la de I-36, cuando se usa) y los intentos fallidos sueltos del primer y del segundo factor que no llegan a un bloqueo.

## Hechos sin persona que muestra la página

Lista cerrada. La página los muestra con el actor de la columna «Actor», que nunca es una persona.

| Entrada | Hecho (texto visible) | Tipo de objeto | Cliente | Actor | Origen |
| --- | --- | --- | --- | --- | --- |
| H-01 | Entregó una orden | Orden | Sí | «Agente del cliente» | Función 023 y conector de la fase 2 |
| H-02 | Confirmó una orden | Orden | Sí | «Agente del cliente» | Función 023 y conector de la fase 2 |
| H-03 | Activó una conexión con un código de activación | Conexión | Sí | «Agente del cliente» | Función 022 y conector de la fase 2 |
| H-04 | Revocó una conexión por reutilización de su credencial | Conexión | Sí | «Sistema» | Función 022 y fase 2 |
| H-05 | Caducó una licencia | Licencia | Sí | «Sistema» | Función 022 y fase 2 |

No hay una fila por cada revisión del agente: solo por estos hechos.

## Requisitos

### Página y contenido de cada fila

| ID | Requisito |
| --- | --- |
| REQ-001 | Existe la página «Auditoría» en el área de superadmin, a la que se llega desde la entrada «Auditoría» del menú de la función 020, y que lista las filas de auditoría. |
| REQ-002 | Cada fila muestra: el actor; la acción; el objeto (su tipo en palabras y lo que lo identifica, REQ-004); el cliente, si la acción tiene cliente; en I-39 e I-40, qué reglas cambiaron, por su nombre visible y sin valores; y la fecha y hora, en hora de Madrid, con el formato del requisito 47 de la función 020 más los segundos. Los segundos son una excepción al formato común, solo en esta página, y la excepción queda documentada en el sistema de diseño. |
| REQ-003 | La acción se muestra siempre con el texto de su entrada del inventario o de la lista de hechos sin persona. Nunca aparece como operación técnica (alta, cambio o borrado sobre una tabla), ni con nombres de tablas, códigos internos o identificadores en su lugar. |
| REQ-004 | El objeto se identifica con atributos actuales suyos que no son secretos (por ejemplo, asistente y fecha de alta de una conexión, fecha de creación de una licencia), enumerados por tipo de objeto en el diseño. Si esos atributos no bastan para distinguirlo de otro objeto del mismo tipo y del mismo cliente, o si el objeto ya no existe, se muestra además una referencia breve sacada de su identificador. Dos filas sobre objetos distintos del mismo tipo y del mismo cliente siempre se distinguen en pantalla. En ningún caso se muestra un código de activación, un código de recuperación, un token, una contraseña ni nada derivado de ellos. Si el objeto es de un cliente, la fila permite ir a la ficha de ese cliente; si es un administrador, una invitación, un segundo factor o unos códigos de recuperación, a la pantalla de administradores. |
| REQ-005 | El cliente se muestra con su nombre comercial actual, porque la auditoría no guarda nombres (artículo 1), y la página lo indica junto a la columna. Si el cliente está dado de baja, la fila lo dice con palabra («De baja»). Si el cliente ya no existe, la fila se sigue mostrando con «Cliente eliminado» en lugar del nombre. |
| REQ-006 | Los nombres de clientes y los datos de los actores se muestran como texto literal: nunca se interpretan como marcado ni como código. |

### Orden y paginación

| ID | Requisito |
| --- | --- |
| REQ-007 | Por defecto, las filas se ordenan de la más reciente a la más antigua, y el orden se puede invertir. El orden sigue el momento exacto en que ocurrió cada acción. Las filas del mismo instante salen siempre en el mismo orden, el de su registro. |
| REQ-008 | La tabla usa la paginación de la función 020, de 25 acciones en 25 (cada acción es una fila principal con sus filas vinculadas, o un hecho sin persona), e indica la posición. Pasar de página no repite ni omite filas, aunque se registren acciones nuevas mientras se navega; las nuevas aparecen al volver a la primera página o al recargar. |
| REQ-057 | Las filas vinculadas se muestran agrupadas bajo su fila principal, cada una con su propia acción, tipo de objeto, objeto y cliente. Un grupo nunca se reparte entre dos páginas. Una fila vinculada que cumple los filtros se muestra siempre junto con su fila principal. |

### Filtros y periodo inicial

| ID | Requisito |
| --- | --- |
| REQ-009 | Hay cuatro filtros, combinables, y una fila se muestra solo si cumple todos los activos: periodo (fecha desde y fecha hasta, días completos en hora de Madrid, los dos incluidos); actor (todas las cuentas que han sido actor, incluidas las dadas de baja, el responsable si ha sido actor, y los valores «Sistema» y «Agente del cliente»); acción (las entradas del inventario y de la lista de hechos sin persona); y cliente (todos los clientes, incluidos los dados de baja). |
| REQ-059 | Al abrir la página, el filtro de periodo son los últimos 30 días. La página dice a la vista qué periodo se está viendo y ofrece, en un solo paso, ver todo el historial. |
| REQ-010 | Los filtros se eligen de listas. Se puede buscar dentro de la lista de clientes o de actores, pero el texto escrito para buscar no se guarda, no va en la dirección de la página y no aparece en registros ni en la supervisión. |
| REQ-011 | Hay una acción para quitar todos los filtros de una vez, que devuelve la página a su estado inicial (REQ-059). |
| REQ-012 | La dirección de la página nunca contiene nombres de clientes, correos ni texto escrito (requisito 59 de la función 020). Si lleva identificadores de cliente o de administrador para filtrar, sigue lo que decidan la cuestión 10 de la función 020 y la cuestión 11 de la función 022, y esos identificadores nunca conceden permiso: el permiso sale solo de la sesión. |

### Volumen y frescura

| ID | Requisito |
| --- | --- |
| REQ-013 | Con el volumen de referencia, la primera página al abrir (últimos 30 días), ver todo el historial, cada filtro y cada combinación de filtros, invertir el orden y cada cambio de página hasta la página 200 muestran sus datos en menos de 2 segundos en el percentil 95, medido en el entorno previo. |
| REQ-014 | Una acción que el panel ha dado por hecha aparece en la página de auditoría en la primera carga posterior. La página no muestra datos guardados de una carga anterior como si fueran actuales. |

### Actor

| ID | Requisito |
| --- | --- |
| REQ-015 | En toda fila de una acción del inventario, el actor es el que dice su columna «Actor»: la cuenta individual de la persona que la hizo, tomada de su sesión (en I-21, la de la persona invitada; en I-36, la cuenta identificada por la prueba de un solo uso); la persona del responsable en I-19 e I-31; «Sistema» en I-37 e I-38; y en las filas vinculadas, el mismo actor que su fila principal. El actor nunca está vacío, nunca es una cuenta genérica o compartida y nunca se toma de lo que envía la petición. |
| REQ-016 | Un actor persona se nombra con el correo de su cuenta. Las cuentas de administrador dadas de baja se desactivan, no se borran (función 021): sus filas se siguen mostrando, sin cambios, con su correo y la marca «dado de baja», y siguen atribuidas a la misma cuenta. Dos cuentas distintas nunca aparecen como el mismo actor. La marca refleja el estado actual de la cuenta. |
| REQ-017 | Las filas sin persona detrás se muestran. Su actor es un valor de la lista cerrada «Sistema», «Agente del cliente», que dice su origen; nunca aparece en blanco y nunca se atribuye a una persona. |
| REQ-058 | Los hechos de la lista «Hechos sin persona» aparecen en la página con el texto y el actor de su entrada, y se pueden filtrar como las acciones. No se muestran filas por cada revisión del agente que no sea uno de esos hechos. |
| REQ-064 | La página no muestra filas de acciones de usuarios de clientes, y sus filtros no ofrecen esos usuarios como actores. Si se muestran o no se decide en la fase 5. |

### Cobertura

| ID | Requisito |
| --- | --- |
| REQ-018 | Cada ejecución con éxito de una acción del inventario deja exactamente una fila principal nueva, que nombra la acción, y una fila vinculada por cada otro objeto que la acción cambia, con la entrada que le corresponda del inventario. Cada fila lleva actor, acción, tipo de objeto, identificador del objeto, cliente si aplica y momento; las de I-39 e I-40, además, las reglas que realmente cambiaron; cada fila vinculada lleva además la referencia a su fila principal, y el mismo actor y el mismo momento que ella. |
| REQ-019 | La acción, su fila principal y sus filas vinculadas se guardan juntas o no se guarda ninguna: si alguna fila no se puede guardar, la acción no surte efecto; si la acción no se completa, no queda ninguna fila. |
| REQ-020 | Una acción rechazada (sin permiso, con datos no válidos o con una transición no permitida) y una acción repetida que no cambia nada (por ejemplo, revocar una conexión ya revocada) no dejan fila de auditoría. |
| REQ-063 | Los intentos de acción denegados se anotan solo en los registros técnicos de supervisión, sin los valores recibidos. Nunca van a la auditoría. |
| REQ-060 | Solo se auditan los cambios. Consultar cualquier pantalla o dato del área, incluida la propia auditoría, no deja fila. La única lectura que deja fila es la exportación de las cifras de un cliente (I-18). |
| REQ-021 | El inventario está completo: toda operación con la que una sesión de administrador, o el responsable con sus procedimientos fuera del panel, puede cambiar algo en el área de superadmin o en las cuentas de administrador, por las pantallas o directamente en la base de datos, corresponde a una entrada del inventario, salvo las de «Lo que no es acción de superadmin». Una operación sin entrada es un defecto que impide cerrar la fase. |
| REQ-022 | La lista de acciones (inventario y hechos sin persona) es cerrada: solo cambia con una especificación aprobada, y una fila con una acción que no esté en la lista no se puede guardar. |
| REQ-023 | El tipo y el identificador del objeto son los del objeto realmente afectado, y el cliente de la fila es el cliente al que pertenece ese objeto, no uno indicado en la petición. |

### Solo lectura, solo inserción y conservación

| ID | Requisito |
| --- | --- |
| REQ-024 | Ni la página de auditoría ni ninguna otra pantalla ofrecen editar, borrar, ocultar ni vaciar filas de auditoría. |
| REQ-025 | Con la sesión completa de un superadmin, cualquier intento directo en la base de datos de modificar una fila de auditoría, borrar una o varias, o vaciar la auditoría se rechaza, y el contenido queda idéntico. |
| REQ-026 | Nadie inserta filas de auditoría directamente, con ningún perfil ni rol de la aplicación: las filas solo nacen de las acciones y hechos que anotan. En particular, no se puede crear una fila a nombre de otro administrador ni de una acción que no ha ocurrido. |
| REQ-027 | El momento de cada fila lo pone el sistema al guardar la acción. No se puede elegir ni alterar. |
| REQ-028 | Dar de baja a un administrador, reactivarlo, dar de baja a un cliente o cambiar su nombre no altera el número ni el contenido de las filas de auditoría existentes. |
| REQ-061 | La auditoría no se exporta: ni la página ni ninguna otra vía del área ofrecen exportar ni descargar filas de auditoría en un archivo. |
| REQ-062 | Ninguna fila de auditoría se elimina, por ningún proceso manual ni automático, hasta que la fase 6 fije los plazos de conservación con una especificación aprobada. |

### Privacidad y secretos

| ID | Requisito |
| --- | --- |
| REQ-029 | Una fila de auditoría contiene solo: actor (cuenta de persona o valor de la lista cerrada de origen), acción, tipo de objeto, identificador del objeto, cliente, momento, en las filas vinculadas la referencia a su fila principal y, en las filas de I-39 e I-40, qué reglas cambiaron, con valores de la lista cerrada de las cinco reglas. No contiene valores anteriores ni posteriores del objeto (tampoco los valores de las reglas), texto libre, nombres de clientes ni correos (artículo 1). |
| REQ-030 | Una fila de auditoría nunca contiene códigos de activación ni nada derivado de ellos, contraseñas, códigos o secretos del segundo factor, códigos de recuperación, pruebas de un solo uso, tokens, la dirección tecleada al iniciar sesión ni ningún dato de correo de terceros (artículos 1 y 4). |
| REQ-031 | La página y sus respuestas no devuelven más datos que los de REQ-002, más la agrupación de REQ-057. Sus mensajes de error dicen qué ha pasado sin datos internos ni valores recibidos. |

### Permisos

| ID | Requisito |
| --- | --- |
| REQ-032 | Solo un administrador activo con sesión completa lee la auditoría. Se comprueba en el servidor y en la base de datos en cada petición, también al cambiar de página o de filtro. |
| REQ-033 | La auditoría se lee con la sesión del usuario. La clave secreta de la base de datos no se usa para leerla (amenaza A-10). |
| REQ-034 | Un usuario de un cliente, con o sin doble factor, y un usuario autenticado sin rol ven «sin permiso» y ninguna fila, tampoco las de su propio cliente. Sin sesión, la página lleva al inicio de sesión. |
| REQ-035 | Todo administrador activo con sesión completa ve todas las filas, incluidas las suyas, las de los demás administradores y las de hechos sin persona. Ningún administrador puede ocultar filas a otro. |

### Experiencia (puerta P5)

| ID | Requisito |
| --- | --- |
| REQ-036 | La página tiene los cinco estados con los componentes de la función 020: carga; vacío (sin filas para los filtros elegidos, dice que no hay acciones con esos filtros y ofrece quitarlos, y es distinto del error); error con reintento; sin permiso; y datos parciales (si no se pueden obtener los nombres de actores o clientes, las filas se muestran igual, marcan con palabra el dato que falta y permiten reintentar solo esa parte). |
| REQ-037 | La página y sus filtros cumplen WCAG 2.2 AA: cada filtro tiene etiqueta visible, todo se maneja con teclado, la agrupación de filas vinculadas se percibe también con lector de pantalla y el cambio de resultados al filtrar o paginar se anuncia. |
| REQ-038 | Todo se puede ver y hacer en un móvil de 320 píxeles de ancho, sin desplazamiento horizontal de página. |
| REQ-039 | Los textos están en español de España, con trato de tú; fechas con el formato de la función 020 más los segundos (REQ-002) y en hora de Madrid, con el cambio de horario aplicado; números con punto de miles. |

## Casos negativos

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-040 | Sesión de un solo factor de una cuenta administradora que abre la página o consulta la auditoría directamente en la base de datos | Lleva al paso del segundo factor; cero filas por cualquier vía |
| REQ-041 | Usuario de un cliente, con o sin doble factor, que abre la página, cambia la dirección o consulta la auditoría directamente | «Sin permiso» y cero filas, también de su propio cliente |
| REQ-042 | El rol del conector, la clave secreta o cualquier otro perfil de la aplicación intentan modificar, borrar o vaciar la auditoría | Se rechaza; el contenido queda idéntico |
| REQ-043 | Intento de insertar una fila falsa: a nombre de otro administrador, con fecha pasada o futura, con una acción inventada, con actor «Sistema» o «Agente del cliente» puesto a mano, o de algo que no ocurrió, con cualquier perfil | Se rechaza; no aparece ninguna fila nueva |
| REQ-044 | La base de datos falla o se corta a mitad de una acción del inventario | No queda acción sin sus filas ni fila sin acción, ni fila principal sin sus vinculadas; el panel no muestra éxito |
| REQ-045 | No se puede escribir la fila principal o alguna fila vinculada de una acción | La acción no surte efecto y el panel lo dice |
| REQ-046 | Un administrador hace acciones y después lo dan de baja (su cuenta se desactiva, no se borra) | Sus filas siguen, idénticas, visibles y filtrables por esa cuenta, con su correo y la marca «dado de baja» |
| REQ-066 | Un administrador dado de baja se reactiva por invitación y vuelve a actuar | Sus filas anteriores y las nuevas aparecen bajo la misma cuenta; filtrar por ella devuelve todas; la marca «dado de baja» no aparece mientras la cuenta está activa; la reactivación deja su fila vinculada a la aceptación de la invitación |
| REQ-047 | Fila sin actor | Nunca hay una fila de una acción del inventario sin actor. Una fila sin persona nunca se muestra en blanco ni atribuida a una persona |
| REQ-068 | Alguien provoca, con intentos fallidos, el bloqueo de la cuenta de otro administrador | La fila del bloqueo tiene como actor «Sistema» y como objeto la cuenta bloqueada; nunca se atribuye a la cuenta bloqueada ni contiene lo tecleado |
| REQ-065 | Intentos fallidos sueltos del primer o del segundo factor que no llegan a un bloqueo | Cero filas de auditoría; solo se cuentan en la supervisión, sin guardar lo tecleado (ni contraseña, ni código, ni la dirección introducida) |
| REQ-048 | Filtro con valores manipulados: acción fuera de la lista, actor fuera de la lista, fecha imposible, periodo invertido, identificador de administrador o de cliente inexistente o con formato inválido, campos de más | Se rechaza con un mensaje junto al filtro o da cero resultados; nunca un error interno, nunca filas fuera del filtro; el mensaje no repite el valor recibido y no distingue «no existe» de «no aplica» |
| REQ-049 | Petición que pide más de 25 acciones por página o una página más allá de la última | Nunca se devuelven más de 25 acciones; más allá de la última, estado vacío con camino a la primera página |
| REQ-050 | Dos acciones en el mismo instante, del mismo o de distintos administradores | Dos grupos de filas, ninguno perdido ni fusionado, en un orden estable |
| REQ-051 | Se cambia el nombre de un cliente después de una acción | La fila muestra el nombre actual; el filtro por ese cliente sigue encontrando las filas anteriores al cambio |
| REQ-052 | Cliente dado de baja | Sus filas siguen visibles, marcadas «De baja»; el cliente sigue disponible en el filtro |
| REQ-053 | La base de datos no responde, responde con error o tarda más de lo previsto | Estado de error con reintento, no estado vacío; no se muestran datos de cargas anteriores |
| REQ-054 | Una acción del inventario llega con campos de más (otro actor, otro cliente, una fecha, otra acción, una fila principal a la que vincularse, una lista de reglas cambiadas) | No tienen efecto: el actor es el de REQ-015, el cliente el del objeto, el momento el del sistema, la acción la ejecutada, la vinculación la de la acción real y las reglas anotadas las que realmente cambiaron; ninguno de esos valores llega a la auditoría |
| REQ-055 | Doble clic o reenvío de la misma acción | Tantas filas principales como acciones surten efecto, ni una más |
| REQ-056 | Con la página abierta, el administrador pierde el doble factor, su sesión caduca o lo dan de baja | Su siguiente petición (cambiar de página, de filtro o recargar) se deniega sin datos |
| REQ-067 | Un administrador busca una vía para exportar o descargar la auditoría, o para que una fila desaparezca pasado un tiempo | No existe ninguna; ninguna fila desaparece |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Las pruebas de base de datos se ejecutan en CI (no hay Docker en la máquina de desarrollo) y no se anotan como superadas en local. «Juego de prueba» quiere decir datos ficticios preparados para la prueba.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | **Criterio de fase «Cada acción de superadmin deja una fila de auditoría».** Prueba automática que ejecuta cada una de las 36 entradas que pueden ser fila principal, con dos administradores distintos y sobre dos clientes (las que tienen cliente), y provoca cada una de las 6 que pueden ser fila vinculada con una acción principal que la causa. Por cada ejecución con éxito hay exactamente 1 fila principal nueva con: actor el de la columna «Actor» (cuenta de la sesión, persona invitada, cuenta identificada por la prueba de un solo uso, el responsable o «Sistema»), acción igual a la entrada ejecutada, tipo e identificador del objeto afectado, cliente del objeto (o ninguno) y momento entre el inicio y el fin de la ejecución; en I-39 e I-40, exactamente las reglas que cambiaron (cambiando 1, 3 y las 5); y exactamente 1 fila vinculada por cada otro objeto cambiado, con su entrada, el mismo actor, el mismo momento y la referencia a la principal. Umbral: acciones sin fila principal 0, objetos cambiados sin fila vinculada 0, filas de más 0, filas con algún dato incorrecto 0 | REQ-015, REQ-018, REQ-023 |
| CA-002 | **Inventario completo.** Se enumeran todas las operaciones que cambian algo disponibles para una sesión de administrador y para los procedimientos del responsable fuera del panel (las del diseño de las funciones 021 a 023 y 025 y las que la base de datos le permite por tabla y operación) y se asigna cada una a una entrada o a «Lo que no es acción de superadmin»: 0 operaciones sin asignar. Prueba de base de datos: con sesión completa de superadmin, cada escritura que la base de datos acepta deja su fila principal con una acción del inventario: 0 escrituras aceptadas sin fila. Una fila con una acción fuera de las dos listas se rechaza | REQ-021, REQ-022 |
| CA-003 | **Juntas o ninguna.** Para cada una de las 36 acciones principales: con la escritura de la fila principal forzada a fallar, y con la de una fila vinculada forzada a fallar donde la acción las tenga, 0 cambios y el panel no muestra éxito; con la base de datos cortada en cada paso de la acción, 0 acciones sin sus filas, 0 filas sin acción y 0 filas principales sin sus vinculadas | REQ-019, REQ-044, REQ-045 |
| CA-004 | **Rechazos y repeticiones.** Para cada acción, un intento sin permiso, uno con datos no válidos, uno con transición no permitida (donde exista) y una repetición de lo ya hecho (donde exista): 0 filas de auditoría nuevas. 20 dobles clics o reenvíos: número de filas principales nuevas igual al de acciones que surtieron efecto | REQ-020, REQ-055 |
| CA-005 | **Campos de más.** Cada acción enviada con actor, cliente, fecha, acción y fila principal falsos, y los cambios de reglas con una lista de reglas cambiadas falsa: el 100 % de las filas tiene el actor de REQ-015, el cliente del objeto, el momento del sistema, la acción ejecutada, la vinculación real y las reglas que realmente cambiaron; los valores enviados aparecen 0 veces en la auditoría | REQ-023, REQ-027, REQ-054 |
| CA-006 | **Solo inserción.** Pruebas de base de datos con sesión completa de superadmin, sesión de un solo factor, usuario de un cliente, rol del conector y clave secreta: modificar cada dato de una fila, borrar una fila, borrar todas y vaciar la auditoría se rechazan en el 100 % de los intentos, y la huella del contenido completo de la auditoría es la misma antes y después. Revisión de la interfaz: 0 controles de editar, borrar, ocultar o vaciar filas | REQ-024, REQ-025, REQ-042 |
| CA-007 | **Filas falsas.** Con cada perfil, insertar una fila a nombre de otro administrador, con fecha pasada, con fecha futura, con una acción inventada y con actor «Sistema» o «Agente del cliente»: 0 aceptadas y 0 filas nuevas | REQ-026, REQ-027, REQ-043 |
| CA-008 | **Bajas y cambios posteriores.** Se toma la huella de la auditoría; se da de baja a un administrador que tiene filas, se da de baja a un cliente y se cambia el nombre de otro. La huella de las filas que existían es idéntica; las filas siguen visibles; filtrar por esa cuenta y por esos clientes devuelve el 100 % de sus filas anteriores; el cliente renombrado aparece con el nombre actual, el de baja con «De baja» y la cuenta dada de baja con su correo y la marca «dado de baja» | REQ-005, REQ-016, REQ-028, REQ-046, REQ-051, REQ-052 |
| CA-009 | **Privacidad y secretos.** Se ejecutan las 36 acciones principales con valores marcadores únicos en nombres de clientes, correos de invitación, direcciones tecleadas al iniciar sesión, contraseñas, códigos del segundo factor, códigos de recuperación y códigos de activación generados, y con valores de reglas poco frecuentes (por ejemplo, 97 correos y 13 días). La búsqueda de cada marcador y de cada valor de regla en todas las filas de auditoría y en las respuestas de la página da 0 apariciones; el dato de reglas cambiadas solo contiene nombres de la lista cerrada de las cinco reglas; los datos de cada fila coinciden con la lista cerrada del diseño; la revisión de privacidad (skill `revision-privacidad`) da 0 hallazgos | REQ-029, REQ-030, REQ-031 |
| CA-010 | **Lo que se ve de cada fila.** Con un juego de prueba que tiene una fila de cada entrada del inventario y de cada hecho sin persona, la página muestra en el 100 % actor, acción, objeto, cliente (cuando aplica), reglas cambiadas por su nombre visible (en I-39 e I-40) y fecha y hora con segundos; el texto de la acción es el de su entrada (46 de 46) y aparecen 0 nombres de tabla, 0 operaciones técnicas y 0 identificadores internos en lugar de la acción; dos conexiones del mismo cliente con el mismo asistente y la misma fecha de alta se distinguen en pantalla por la referencia breve; un objeto que ya no existe se distingue por la referencia breve; 0 códigos, tokens o contraseñas en pantalla; el enlace de cada fila lleva a la ficha del cliente o a la pantalla de administradores | REQ-001 a REQ-004 |
| CA-011 | **Texto literal.** Con 10 nombres de cliente que contienen marcado, guiones y caracteres especiales, la página los muestra literalmente y se detectan 0 ejecuciones | REQ-006 |
| CA-012 | **Orden y paginación.** Juego de prueba de 1.000 acciones con 10 pares en el mismo instante y 50 acciones con filas vinculadas: el orden por defecto es del más reciente al más antiguo y se invierte; recorrer todas las páginas da todas las filas con 0 duplicados y 0 omisiones y como mucho 25 acciones por página; insertando 50 acciones nuevas durante el recorrido, el recorrido iniciado sigue con 0 duplicados y 0 omisiones y las nuevas aparecen al recargar; cada par del mismo instante aparece completo y en el mismo orden en 10 cargas de 10 | REQ-007, REQ-008, REQ-050 |
| CA-013 | **Filtros.** Juego de prueba con filas a las 23:59:59 y a las 00:00:00 hora de Madrid, en los días de cambio de hora de marzo y de octubre, de cuentas activas y dadas de baja, y de actores «Sistema» y «Agente del cliente». Para cada filtro y para 10 combinaciones, el resultado coincide con el calculado de forma independiente (0 diferencias); las listas de actores y clientes incluyen las cuentas y los clientes dados de baja y los dos valores de origen; quitar filtros devuelve el estado inicial | REQ-009, REQ-011 |
| CA-014 | **Filtros manipulados.** Batería de 20 valores manipulados (acción y actor fuera de lista, fechas imposibles, periodo invertido, identificadores inexistentes, con formato inválido y de más): 0 errores internos mostrados, 0 filas fuera del filtro, el mismo mensaje para «no existe» y «no aplica», y 0 valores recibidos en los mensajes y en los registros | REQ-048 |
| CA-015 | **Dirección.** Recorriendo la página con todos los filtros y buscando dentro de las listas, la dirección y el historial contienen 0 nombres, correos o textos escritos, y los registros del servidor 0 textos de búsqueda; con sesión de un usuario de un cliente, cambiar los parámetros de la dirección da «sin permiso» y 0 filas | REQ-010, REQ-012 |
| CA-016 | **Volumen.** En el entorno previo, con el volumen de referencia, 200 mediciones de cada operación (primera página al abrir, ver todo el historial, cada filtro, 5 combinaciones, invertir el orden, avanzar hasta la página 200): percentil 95 menor de 2 segundos en todas. Una petición de 1.000.000 de acciones por página devuelve como mucho 25; una página más allá de la última muestra el estado vacío con camino a la primera | REQ-013, REQ-049 |
| CA-017 | **Frescura.** 20 acciones seguidas, cada una seguida de cargar la página de auditoría: 20 de 20 filas presentes en esa primera carga | REQ-014 |
| CA-018 | **Actores y hechos sin persona.** Juego de prueba con filas de un administrador activo, de dos cuentas dadas de baja, del responsable (I-19 e I-31), de un bloqueo (I-37) y de cada hecho sin persona (H-01 a H-05): el 100 % de las filas muestra un actor no vacío; las personas aparecen con su correo y las dos cuentas dadas de baja se distinguen; los hechos sin persona aparecen con el texto y el actor de su entrada (5 de 5) y se filtran por acción y por actor; 0 filas sin persona atribuidas a una persona. Consulta en la base de datos: 0 filas de acciones del inventario sin actor | REQ-015, REQ-016, REQ-017, REQ-047, REQ-058 |
| CA-019 | **Acceso.** Pruebas en CI y de extremo a extremo con sesión de un solo factor de un administrador, usuario de un cliente (con y sin doble factor), usuario sin rol y sin sesión: 0 filas por la página y por la base de datos, «sin permiso» o paso del segundo factor o inicio de sesión según el caso; el usuario de un cliente lee 0 filas de su propio cliente. Con la página abierta, quitar el doble factor, caducar la sesión o dar de baja a la cuenta hace que su siguiente cambio de página se deniegue sin datos (3 de 3). Control positivo: con sesión completa, dos administradores distintos ven cada uno el 100 % de las filas del juego de prueba, incluidas las del otro y las de hechos sin persona | REQ-032, REQ-034, REQ-035, REQ-040, REQ-041, REQ-056 |
| CA-020 | **Clave secreta.** Las pruebas de integración de la página pasan con la clave secreta ausente del entorno de esa operación, y la revisión del `auditor-seguridad` encuentra 0 usos de la clave secreta en esta función | REQ-033 |
| CA-021 | **Fallos.** Con la base de datos caída, con error y con respuestas lentas: el 100 % de los casos muestra el estado de error con reintento, nunca el vacío ni datos de cargas anteriores. Con la obtención de nombres de actores o de clientes forzada a fallar: las filas se muestran, el dato que falta se marca con palabra y se reintenta solo esa parte | REQ-036, REQ-053 |
| CA-022 | **Estados.** Capturas de los cinco estados de la página; el estado vacío con filtros activos dice que no hay acciones con esos filtros y ofrece quitarlos | REQ-036 |
| CA-023 | **Accesibilidad.** El análisis automático da 0 incumplimientos de nivel A y AA en todos los estados; la revisión manual con teclado y lector de pantalla no deja hallazgos bloqueantes y confirma que la agrupación de filas vinculadas se percibe; cada filtro tiene etiqueta visible y el cambio de resultados se anuncia | REQ-037 |
| CA-024 | **Móvil.** A 320 píxeles, la página, sus filtros, la agrupación de filas y su paginación se usan sin desplazamiento horizontal de página y con todas las acciones disponibles; capturas en el informe de la puerta P5 | REQ-038 |
| CA-025 | **Textos y fechas.** Una revisión de textos no encuentra inglés, trato de usted ni fechas o números con otro formato (0 hallazgos); la hora de cada fila lleva segundos y la excepción figura en la documentación del sistema de diseño; una fila de enero y una de julio muestran la hora de Madrid correcta, segundos incluidos (2 de 2), con el dispositivo en otra zona horaria | REQ-002, REQ-039 |
| CA-026 | **Simulacro de cuenta comprometida (A-11).** Una cuenta de prueba inicia sesión 3 veces y hace 15 acciones variadas, mezcladas con 50 de otros administradores. Filtrar por esa cuenta y por el periodo devuelve exactamente esas 18 acciones (0 de más, 0 de menos), con su acción, objeto, cliente y hora con segundos | REQ-009 |
| CA-027 | **Filas vinculadas.** Revocar una licencia con un código pendiente y 3 conexiones activas deja 1 fila principal «Revocó una licencia» y 4 vinculadas (1 «Anuló un código de activación» y 3 «Revocó una conexión»), mostradas bajo la principal; generar un código con otro pendiente deja 1 principal y 1 vinculada; crear una orden con otra viva deja 1 principal y 1 vinculada «Anuló por sustitución una orden»; aceptar una invitación dirigida a una cuenta dada de baja deja 1 principal y 1 vinculada «Reactivó por invitación una cuenta de administrador dada de baja»; entrar con un código de recuperación deja 1 principal «Inició sesión» y 1 vinculada «Usó un código de recuperación»; dar de alta un cliente deja 1 principal «Dio de alta un cliente» y 1 vinculada «Guardó las reglas por defecto de un cliente nuevo». Con un grupo que cae en el límite de 25 acciones, el grupo aparece entero en una sola página; filtrar por la acción de una vinculada la muestra junto a su principal (6 de 6 casos) | REQ-018, REQ-057 |
| CA-028 | **Periodo al abrir.** Con filas de hoy y de hace 29, 30, 31 y 400 días, y con una de las 00:00:00 del día límite en hora de Madrid: al abrir se ven solo las de los últimos 30 días (0 diferencias con el cálculo independiente) y la página dice qué periodo se ve; un solo paso muestra las 5; quitar todos los filtros vuelve a los últimos 30 días | REQ-011, REQ-059 |
| CA-029 | **Solo cambios.** 50 consultas repartidas por todas las pantallas del área (clientes, fichas, informes, resumen, administradores, cuenta y auditoría, con filtros y páginas): 0 filas de auditoría nuevas. Exportar las cifras de un cliente: exactamente 1 fila I-18 | REQ-060 |
| CA-030 | **Sin exportación ni eliminación.** Revisión de la interfaz y de las rutas del servidor: 0 vías de exportar o descargar filas de auditoría. Revisión de los procesos programados y de las tareas de mantenimiento: 0 procesos que eliminen filas de auditoría. Prueba de base de datos: el número de filas antes y después de ejecutar todas las tareas programadas del entorno previo es el mismo o mayor, nunca menor | REQ-061, REQ-062, REQ-067 |
| CA-031 | **Denegados y fallos sueltos.** 20 intentos de acción denegados (sin permiso, desde una sesión de un solo factor y desde un usuario de un cliente) y 4 fallos de contraseña y 4 de código del segundo factor sin llegar al bloqueo: 0 filas de auditoría nuevas; los registros técnicos contienen la anotación de los 20 denegados y el recuento de los 8 fallos, con 0 valores recibidos, contraseñas, códigos o direcciones tecleadas | REQ-063, REQ-065 |
| CA-032 | **Usuarios de clientes.** Con un juego de prueba que contiene filas de acciones de usuarios de clientes: 0 de esas filas visibles en la página y 0 usuarios de clientes en la lista del filtro de actor | REQ-064 |
| CA-033 | **Reactivación y bloqueos.** Una cuenta con 5 filas se da de baja, se reactiva por invitación y hace 3 acciones: filtrar por ella devuelve el 100 % de sus filas (las 5 anteriores, las 3 nuevas y las de la aceptación de la invitación, su reactivación y los pasos de acceso que siguen), todas bajo la misma cuenta; durante la baja se ve la marca «dado de baja» y después no. Desde otro origen se provocan 5 fallos de contraseña sobre la cuenta de otro administrador: 1 fila de bloqueo con actor «Sistema» y objeto esa cuenta, 0 filas atribuidas a la cuenta bloqueada y 0 apariciones de lo tecleado | REQ-066, REQ-068 |

## Fuera de alcance

- Componentes, tabla, paginación, estados de pantalla y formato de fechas: función 020. Aquí se usan, con la excepción de los segundos (REQ-002).
- Acceso con doble factor, sesión y gestión de administradores: función 021. Clientes, licencias, códigos y conexiones: función 022. Informes, resumen, órdenes y exportación de cifras: función 023. Reglas por cliente y su historial en la ficha: función 025. Cada una exige por su lado que sus acciones se auditen; esta función muestra las filas y comprueba la cobertura completa.
- Cómo se guarda la auditoría en la base de datos: fase 2. Esta función fija lo que debe cumplirse y lo prueba.
- Acciones de superadmin de fases posteriores (publicar versiones, vuelta atrás, cambiar el canal del cliente, pausa global, resolver alertas, estado manual de cobro, exportaciones y supresiones del RGPD): las añaden al inventario las funciones de las fases 4 a 6 con su especificación aprobada.
- Acciones de usuarios de clientes: se decide en la fase 5 si la página de superadmin las muestra. Hasta entonces no las muestra (REQ-064).
- Avisos fuera del panel y alertas por acciones sensibles, accesos sospechosos o bloqueos: fase 4.
- Exportar la auditoría: no se exporta (REQ-061).
- Plazos de conservación, purga y anonimización de la auditoría, y eliminación del correo de las cuentas de administrador dadas de baja: fase 6. Hasta entonces no se elimina ninguna fila (REQ-062).
- Auditoría de lecturas: no se auditan, salvo la exportación de las cifras de un cliente (REQ-060).
- Intentos denegados e intentos fallidos sueltos de acceso: solo en los registros técnicos (REQ-063, REQ-065). Los registros de supervisión y de operación del servidor son de la fase 1.

## Cuestiones abiertas

**Las 13 cuestiones están resueltas por el responsable el 12 y el 13/11/2026** (detalle en `aclaraciones.md`). Queda como propuesta, sin respuesta expresa, el volumen de 500.000 filas y 30 actores, que se confirma al aprobar en la puerta P0:

1. Inicios de sesión y contraseña: entran en el inventario el inicio de sesión completo, el bloqueo por intentos y el cambio y el restablecimiento de contraseña; los fallos sueltos solo se cuentan, fuera de la auditoría (I-33 a I-38, REQ-065).
2. Acciones sin persona: se muestran con un actor de lista cerrada, «Sistema» o «Agente del cliente» (REQ-017, REQ-058).
3. Lecturas: solo se auditan los cambios (REQ-060).
4. Administrador dado de baja: se muestra con su correo y la marca «dado de baja»; la cuenta se desactiva, no se borra (REQ-016).
5. Fila por acción: una fila principal nombra cada acción y las de los demás objetos afectados van vinculadas y agrupadas bajo ella (REQ-018, REQ-057).
6. Identificación del objeto: atributos legibles no secretos y una referencia breve de respaldo (REQ-004).
7. Hora: con segundos en la auditoría, como excepción documentada (REQ-002).
8. Intentos denegados: solo en los registros técnicos (REQ-063).
9. Exportación: no (REQ-061).
10. Conservación: no se elimina ninguna fila hasta la fase 6 (REQ-062).
11. Volumen y umbral: 1.000 clientes y percentil 95 por debajo de 2 segundos; 500.000 filas y 30 actores, como propuesta (REQ-013).
12. Acciones de usuarios de clientes: se deciden en la fase 5 (REQ-064).
13. Periodo al abrir: los últimos 30 días, con un paso para ver todo (REQ-059).

Texto original de las cuestiones:

1. **Inicios de sesión y cambios de contraseña.** Los inicios de sesión correctos y fallidos, los fallos del segundo factor y los bloqueos quedan anotados (función 021), pero no se ha decidido dónde (cuestión 14 de la 021: es la misma decisión y se contesta una vez). Tampoco están en el inventario el cambio de contraseña ni el restablecimiento. Opciones: (a) todo eso aparece en la página de auditoría como entradas propias: el equipo lo ve en un solo sitio, pero la auditoría crece mucho y mezcla acciones con intentos; (b) solo el cambio y el restablecimiento de contraseña entran en el inventario, y los inicios de sesión y fallos quedan en los registros de supervisión; (c) nada de eso entra en la auditoría. Con (a) o (b) se añaden entradas al inventario y a CA-001.
2. **Acciones sin persona.** La auditoría puede tener filas que no hace una persona: el conector que entrega o confirma una orden, la activación de una conexión con un código, la revocación automática de una conexión por reutilización de su token, la caducidad de una licencia. Opciones: (a) la página muestra solo acciones de personas: la auditoría es más clara, pero el equipo no ve en ella esos hechos al investigar un incidente; (b) las muestra, con un actor de lista cerrada que dice su origen («Sistema», «Agente del cliente»): rastro completo, pero hay que guardar el origen del actor y la tabla crece; (c) solo algunas, que habría que enumerar. Está ligada a la cuestión 17 de la función 010.
3. **Auditar lecturas.** ¿Se anota quién consultó la ficha de un cliente, el histórico de sus informes o la propia auditoría? Opciones: (a) solo se auditan los cambios; (b) también las consultas de datos de un cliente. Con (b) hay rastro de quién miró qué, pero la auditoría crece mucho y CA-001 tiene que cubrir cada consulta. Es la misma decisión que la cuestión 16 de la función 023.
4. **Cómo se muestra un administrador dado de baja.** Opciones: (a) con su correo y la marca «dado de baja»: se sabe quién fue, pero obliga a conservar su correo (y a desactivar la cuenta en vez de borrarla); (b) como «Administrador dado de baja» con una referencia breve que distingue a unos de otros: no guarda datos personales, pero para saber quién fue hace falta un registro fuera del sistema. Depende de la cuestión 7 de la función 021 (borrar o desactivar la cuenta).
5. **Una fila por acción o una por objeto afectado.** La especificación de la fase 2 (función 010, requisito 17) pide una fila por cada fila de datos afectada, mientras que el criterio de la fase 3 y las funciones 022 y 023 piden una fila por acción. Una acción puede cambiar varios datos (por ejemplo, revocar una licencia y dejar sin servir sus códigos pendientes). Opciones: (a) una sola fila por acción, con el objeto principal; (b) una fila principal que nombra la acción y filas secundarias por cada objeto afectado, vinculadas a la principal y que la página agrupa; (c) una fila por objeto, sin fila principal. Con (a) la página es clara, pero se pierde qué otros objetos cambió; con (b) se conserva todo, pero hay que vincular filas; (c) no permite cumplir REQ-003 ni CA-001 tal como están.
6. **Cómo se identifica el objeto en pantalla.** Opciones: (a) una referencia breve sacada de su identificador (por ejemplo, sus primeros caracteres): siempre distingue, pero es poco legible; (b) atributos actuales del objeto que no son secretos (asistente y fecha de alta de una conexión, fecha de creación de una licencia): legible, pero si el objeto cambia o desaparece hay que tener otra forma de distinguirlo; (c) solo el enlace a la ficha. Nunca se muestra un código de activación ni un token.
7. **Hora con segundos.** El formato común de la función 020 no lleva segundos. En la auditoría, varias acciones del mismo minuto se ven con la misma hora. Opciones: (a) se usa el formato común y el orden de la tabla muestra la secuencia real; (b) la auditoría muestra también los segundos, como excepción documentada al formato común. Con (b) se reconstruye mejor un incidente, a costa de una excepción en el sistema de diseño.
8. **Intentos denegados.** ¿Se anotan los intentos de acción rechazados por falta de permiso (por ejemplo, un usuario de cliente que intenta escribir en datos del área)? Opciones: (a) no; (b) en los registros de supervisión, sin valores recibidos; (c) en la auditoría, con entradas propias, sin valores. `docs/ARQUITECTURA.md` prohíbe guardar los valores recibidos en peticiones rechazadas en cualquier caso. Con (c) la base de datos tendría que anotar algo que no se ha hecho, lo que choca con el requisito 16 de la función 010 (solo nacen filas de cambios ocurridos).
9. **Exportación.** Opciones: (a) no se puede exportar; (b) se exporta lo filtrado en un archivo. Con (b) el archivo sale del sistema con datos de actividad de todos los clientes, necesita su propia revisión de privacidad y la exportación misma sería una acción del inventario.
10. **Conservación.** ¿Cuánto tiempo se guarda la auditoría y cómo se elimina lo vencido sin romper su inmutabilidad? Los plazos definitivos son de la fase 6 (cuestión 7 de la función 010 y cuestión 12 de la función 052). Hasta que se decida, esta especificación supone que no se elimina ninguna fila. ¿Se confirma?
11. **Volumen de referencia y umbral.** Se proponen 500.000 filas, 1.000 clientes y 30 actores, con percentil 95 menor de 1 segundo en el entorno previo para la primera página, cada filtro, el orden y hasta la página 200. ¿Se aceptan, o se fijan otros?
12. **Acciones de usuarios de clientes.** En la fase 5 los usuarios de clientes podrán cambiar cosas (por ejemplo, sus reglas, si se les permite), y la fase 2 prevé auditar toda escritura de usuarios. Opciones: (a) la página de superadmin las muestra también, con un actor marcado como usuario del cliente; (b) no las muestra y se decide en la fase 5. Con (a) el filtro de administrador tendría que admitir también usuarios de clientes.
13. **Periodo al abrir la página.** Opciones: (a) sin filtro de periodo, con todo el historial ordenado del más reciente al más antiguo; (b) los últimos 30 días. (a) no oculta nada a quien llega investigando; (b) carga menos y deja claro qué se está viendo.

## Dependencias y decisiones relacionadas

- **Constitución:** artículos 1, 2, 3, 4, 6, 7, 10, 12, 13 y 14.
- **Decisiones:** D-002 (servicio de identidad del proveedor elegido: los segundos factores, las invitaciones, los inicios de sesión y los cambios de contraseña pueden vivir en él, y sus acciones también deben auditarse), D-008 (listas cerradas), D-015 (reparto por fases), T-004 (clave secreta solo en el servidor), T-005 (patrón de aislamiento y autorización por tablas propias). Pendientes de verificar: V-108 (doble factor exigido en las políticas; fase 2), V-110 (librería de interfaz; fase 3), V-112 (supervisión que no capture cuerpos de petición; fase 1). Las respuestas del 12 y el 13/11/2026 a las cuestiones de esta función se anotan como decisiones por coordinación (`propuestas.md`).
- **ADR:** 0003 (aislamiento por cliente; clave secreta confinada).
- **Amenazas:** A-01 (seguir una orden o una conexión nueva hasta el agente), A-10 y A-11 de `docs/SEGURIDAD.md`; apartado «Acceso» de su lista de publicación (alta y baja de administradores auditadas) y paso 3 de «Respuesta a incidentes» (no borrar registros).
- **Funciones de la fase 3:**
  - 020: menú, tabla, paginación, estados, formato de fechas y dirección de la página. Necesita anotar en el sistema de diseño la excepción de los segundos en la auditoría.
  - 021: sesión completa, administrador activo, baja que desactiva la cuenta, reactivación por invitación de una cuenta dada de baja, y acciones I-19 a I-38.
  - 022: acciones I-01 a I-12 (reactivar un cliente, anulación automática de un código al generar otro o al revocar la licencia, conexiones revocadas con su licencia) y hechos H-03 a H-05; su regla sobre repeticiones que no cambian nada; el alta de un cliente guarda también sus reglas por defecto (I-41).
  - 023: acciones I-13 a I-18 (anulación por sustitución y exportación de las cifras de un cliente) y hechos H-01 y H-02.
  - 025 (reglas por cliente): acciones I-39 a I-41, la lista cerrada de las cinco reglas que anota el dato de reglas cambiadas, y su historial de reglas en la ficha, que sale de esta auditoría y muestra al actor como esta página.
- **Se supone de la fase 1:** la app desplegada en los entornos previo y de producción, CI con pruebas de extremo a extremo, y supervisión que no guarda cuerpos de petición y que anota los intentos denegados y el recuento de fallos de acceso sin valores recibidos.
- **Se supone de la fase 2:** una auditoría de solo inserción que ningún perfil ni rol de la aplicación puede modificar, borrar ni vaciar, y en la que nadie inserta filas directamente (requisitos 16 a 18 de la función 010); que cada fila guarda actor, acción, tipo e identificador del objeto, cliente y momento, sin valores; que la acción y todas sus filas se guardan en la misma operación; lectura de la auditoría limitada a administradores activos con sesión completa; ningún proceso que elimine filas; y las pruebas de base de datos en CI. El modelo de referencia (`docs/MODELO-DATOS.sql`, PROPUESTA) es orientativo. Lo que esta especificación necesita y ese modelo hoy no da se anota en el informe al orquestador para que lo recoja la fase 2: acción con nombre del dominio de las dos listas cerradas (en lugar de la operación técnica sobre una tabla); origen del actor («Sistema», «Agente del cliente»); fila principal y filas vinculadas con su referencia, en lugar de una fila por cada dato afectado (requisito 17 de la función 010, a acordar); anotación de los hechos sin persona H-01 a H-05; dato de reglas cambiadas en I-39 e I-40, de lista cerrada y sin valores; anotación de las acciones que ocurren en el servicio de identidad (segundos factores, invitaciones, recuperación, códigos de recuperación, inicios de sesión, bloqueos y cambios de contraseña); y actor identificado en los procedimientos del responsable fuera del panel.
- **Se supone de la fase 6:** los plazos de conservación de la auditoría y del correo de las cuentas dadas de baja, compatibles con que ninguna fila existente cambie.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 13/11/2026 | Responsable | Aprobada (puerta P0). Respuesta expresa en el diálogo de preguntas del chat de la fase 3: «Apruebo la 024». El resumen presentado incluía las deducciones del `especificador` anotadas en `aclaraciones.md` |

Enmienda del 13/11/2026: aprobada por el responsable («Sí, apruebo las dos»; detalle en `aclaraciones.md`). El inventario gana las entradas I-39 «Cambió las reglas de un cliente», I-40 «Restableció las reglas de un cliente a los valores por defecto» e I-41 «Guardó las reglas por defecto de un cliente nuevo», esta como fila vinculada al alta de cliente (41 entradas: 36 pueden ser fila principal y 6 vinculada). La fila de auditoría admite un dato más en I-39 e I-40: qué reglas cambiaron, de la lista cerrada de las cinco reglas, nunca sus valores (REQ-002, REQ-018, REQ-029, REQ-054; CA-001, CA-002, CA-003, CA-005, CA-009, CA-010, CA-027). La especificación sigue APROBADA.
