# 022 · Clientes, licencias, códigos de activación y conexiones

Estado: APROBADA
Fase: 3 · Fecha: 12/11/2026 · Revisada: 13/11/2026, con las respuestas de `aclaraciones.md` · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

HumanaIA necesita dar de alta a cada cliente, darle derecho a usar el agente, instalarlo en su Claude o su ChatGPT y poder cortarle el acceso cuando haga falta. Hoy eso no existe fuera de la carpeta `panel`. Esta función da al superadmin la lista de clientes y su ficha, la gestión de la licencia, la generación de códigos de activación de un solo uso y el control de las conexiones de cada agente, incluida su revocación inmediata. Es la primera línea de respuesta ante una conexión robada (amenaza A-01) y no debe abrir ninguna vía nueva para leer o tocar datos de otro cliente (artículos 2 y 3).

## Quién la usa y cómo

- Como **superadmin de HumanaIA**, quiero ver todos los clientes con su estado en palabras y encontrar uno en segundos, para saber a quién atender.
- Como **superadmin**, quiero dar de alta un cliente con su nombre comercial y su frecuencia esperada, sin ningún otro texto, para no guardar datos que no necesitamos.
- Como **instalador de HumanaIA**, quiero generar un código de activación de un solo uso para la licencia de un cliente y verlo una sola vez, para conectar su agente sin que exista una clave permanente.
- Como **superadmin**, quiero suspender, reactivar, revocar o poner fecha de caducidad a una licencia, sabiendo qué recibirá el agente y cuándo, para controlar quién usa el servicio.
- Como **superadmin**, quiero dar de baja a un cliente y poder reactivarlo después sin reinstalar nada, sabiendo que la baja no corta sus credenciales.
- Como **responsable de seguridad**, quiero revocar una conexión concreta y que deje de tener acceso al momento sin afectar a las demás, para contener una credencial robada.

## Requisitos

### Lista de clientes

| ID | Requisito |
| --- | --- |
| REQ-001 | La lista de clientes muestra, por cada cliente: nombre comercial, estado del cliente en palabras (REQ-002), estado de su licencia y, si la tiene, su fecha de caducidad, número de conexiones activas y fecha de alta. |
| REQ-002 | El estado del cliente en la lista se expresa con una palabra de esta lista cerrada, aplicada en este orden de prioridad: «Dado de baja», «Sin licencia» (no tiene licencia vigente), «Licencia caducada», «Licencia suspendida», «Pendiente de activar» (licencia vigente sin ninguna conexión activa), «Activo». La palabra va siempre visible; el color y el icono solo la acompañan. |
| REQ-078 | Junto al estado del cliente, la lista muestra las indicaciones «Sin señal» y «En pausa» cuando correspondan, como palabra visible, con la regla que fija la función 023. |
| REQ-003 | La lista se ordena por defecto por nombre, de la A a la Z, y se puede ordenar por nombre, estado y fecha de alta, en los dos sentidos. El orden se mantiene al cambiar de página. |
| REQ-004 | Se puede buscar por un fragmento del nombre, con la regla de comparación de REQ-077, y filtrar por estado. El texto buscado no aparece en la dirección de la página ni en el historial del navegador. |
| REQ-005 | La lista se pagina de 25 en 25 e indica el total y la posición («1–25 de 312»). |
| REQ-006 | Con 1.000 clientes, la primera página de la lista, cada búsqueda, cada cambio de orden o de página y la apertura de una ficha con 50 conexiones y 200 códigos muestran sus datos en menos de 2 segundos en el percentil 95, medidos en el entorno previo. |

### Ficha de cliente

| ID | Requisito |
| --- | --- |
| REQ-007 | La ficha de un cliente muestra: sus datos (nombre comercial, estado, frecuencia esperada, fecha de alta y canal, este en lectura según REQ-065); su licencia vigente con estado en palabras, las causas de suspensión que tenga (REQ-017), fecha de creación y caducidad; las licencias revocadas anteriores con su fecha de revocación; los códigos de activación (REQ-023) y las conexiones (REQ-025). Deja sitio para la sección de reglas del cliente, que es de la función 025, y para las secciones de informes y órdenes, que especifica la función 023. Esta función no muestra ni cambia las reglas; solo guarda las de por defecto en el alta (REQ-008). |
| REQ-065 | La ficha muestra el canal del cliente (`estable` o `prueba`) solo en lectura. Ninguna vista, formulario ni acción de esta función permite cambiarlo; el cambio de canal es de la fase 4. |
| REQ-074 | En el panel superadmin, el identificador de un cliente puede ir en la petición o en la dirección de la página solo para elegir sobre qué cliente se actúa. Nunca concede permiso: el permiso se deriva solo de la sesión (REQ-031), sea cual sea el identificador recibido (nota aclaratoria del artículo 2). |

### Alta, edición, baja y reactivación de cliente

| ID | Requisito |
| --- | --- |
| REQ-008 | El alta de cliente pide solo dos datos: nombre comercial (de 1 a 120 caracteres, sin contar los espacios de los extremos, que se quitan) y frecuencia esperada (entero de 1 a 168 horas, con 24 propuesto). El cliente nace en estado activo y sin licencia. En la misma operación, el alta guarda también las reglas del cliente con los valores por defecto que fija la función 025: el cliente y sus reglas se guardan juntos o no se guarda nada, y si no se pueden guardar las reglas, el alta no se hace. El formulario no pide ni muestra reglas. No existe ningún otro campo de texto libre, ni notas, ni observaciones (artículo 1). |
| REQ-009 | La edición de cliente permite cambiar solo el nombre comercial y la frecuencia esperada, con las mismas reglas que el alta. Editarlos no cambia nada de lo que recibe el agente. |
| REQ-077 | Regla de comparación de nombres, para la búsqueda, los nombres repetidos y la confirmación reforzada: no se distinguen mayúsculas, minúsculas ni tildes; se ignoran los espacios de los extremos y los espacios seguidos cuentan como uno. La «ñ» no se iguala a la «n» ni la «ü» a la «u». |
| REQ-010 | El nombre comercial se muestra siempre como texto literal en todas las vistas, diálogos, mensajes y avisos: nunca se interpreta como marcado ni como código. |
| REQ-011 | Dar de baja a un cliente es una acción explícita, con confirmación, que solo suspende: desde su siguiente revisión, el agente del cliente recibe el estado `suspendida` y ninguna instrucción; la licencia y las conexiones se conservan sin revocar; el código pendiente, si lo hay, queda anulado (REQ-069). No se borra ningún dato ni historial; la ficha sigue consultable. A un cliente de baja no se le puede crear licencia ni generar código, pero sí revocar su licencia y sus conexiones. Un cliente de baja conserva credenciales que se siguen renovando: para cortarlas hay que revocar la licencia (REQ-018) o las conexiones (REQ-026). |
| REQ-066 | Un superadmin puede reactivar a un cliente dado de baja con la acción «Reactivar cliente», con confirmación. El cliente vuelve a estar activo con su misma licencia y sus mismas conexiones, sin activación nueva; desde la siguiente revisión, el agente vuelve a recibir instrucciones, salvo que otra causa lo impida (licencia suspendida, caducada o revocada, pausa). |
| REQ-067 | El diálogo de baja dice expresamente que la baja se puede deshacer con «Reactivar cliente», que la licencia y las conexiones se conservan y sus credenciales se siguen renovando, y que para cortarlas hay que revocar la licencia o las conexiones. |
| REQ-012 | Desde el panel no se puede borrar ningún cliente, licencia, código de activación ni conexión. |

### Licencia

| ID | Requisito |
| --- | --- |
| REQ-013 | Un cliente tiene como mucho una licencia vigente (no revocada). Esto lo garantiza también la base de datos, no solo la interfaz. |
| REQ-014 | Se puede crear una licencia para un cliente activo que no tenga licencia vigente. Nace activa, con fecha de caducidad opcional. Crearla no conecta ningún agente: hace falta una activación con código. |
| REQ-015 | Un superadmin puede suspender a mano una licencia vigente que no esté ya suspendida a mano. Desde la siguiente revisión del agente, este recibe el estado `suspendida`, sin prompt, sin reglas y sin versión. Las conexiones se conservan; el código pendiente, si lo hay, queda anulado (REQ-069). |
| REQ-016 | Un superadmin puede reactivar a mano una licencia suspendida a mano. Esto quita solo la causa manual (REQ-072); desde la siguiente revisión, el agente vuelve a recibir instrucciones, salvo que otra causa lo impida (suspensión por cobro, pausa, baja, caducidad). |
| REQ-017 | La suspensión de una licencia tiene dos causas separadas: la manual, de esta función, y la de cobro, de la fase 6. La licencia está suspendida mientras exista alguna de las dos. La ficha y los datos muestran en cada momento qué causas tiene. |
| REQ-072 | La causa manual solo la quita una reactivación hecha a mano por un superadmin, y esa reactivación no quita la causa de cobro. Ningún proceso automático, tampoco el de cobro de la fase 6, quita la causa manual. |
| REQ-018 | Un superadmin puede revocar una licencia activa o suspendida, también la de un cliente de baja, con la confirmación reforzada de REQ-071. La revocación es definitiva: la licencia no vuelve a ningún otro estado; ninguna de sus conexiones vuelve a obtener instrucciones ni a renovar su acceso (REQ-073); su código pendiente queda anulado (REQ-069). Después se puede crear una licencia nueva, que exige una activación nueva. |
| REQ-073 | Al revocar una licencia, cada una de sus conexiones que siguiera activa pasa a «Revocada», con la fecha de la revocación de la licencia y el motivo «por revocación de la licencia». |
| REQ-019 | Se puede fijar, cambiar o quitar la fecha de caducidad de una licencia vigente. La fecha, con hora, se interpreta en hora de Madrid y debe ser futura. Al llegar, la lista y la ficha muestran «Licencia caducada» y, desde la siguiente revisión, el agente recibe `suspendida` sin instrucciones. |

### Códigos de activación

| ID | Requisito |
| --- | --- |
| REQ-020 | Un superadmin puede generar un código de activación para la licencia vigente, no suspendida ni caducada, de un cliente activo. El código es de un solo uso y caduca a los 15 minutos de generarse. |
| REQ-068 | Una licencia tiene como mucho un código pendiente, también con generaciones simultáneas; lo garantiza también la base de datos. Generar un código nuevo anula el pendiente anterior. Si hay uno pendiente, antes de generar el panel avisa de que el anterior dejará de servir. |
| REQ-069 | Revocar una licencia, suspenderla a mano o dar de baja a su cliente anula su código pendiente, si lo tiene. Reactivar la licencia o el cliente no lo devuelve a «Pendiente»: si hace falta, se genera uno nuevo. |
| REQ-070 | Un código anulado no crea ninguna conexión. La ficha lo muestra con el estado «Anulado» y su fecha de anulación, y cada anulación deja su fila de auditoría. |
| REQ-021 | El código se muestra una sola vez, en la respuesta a la generación, junto con su hora de caducidad y un botón accesible para copiarlo. El diálogo que lo muestra no se cierra solo; lo cierra el superadmin. |
| REQ-022 | Una vez mostrado, el código no se puede volver a ver ni recuperar por ninguna vía: ni en la ficha, ni recargando, ni con el botón atrás, ni desde otra pestaña u otro superadmin, ni leyendo los datos guardados. |
| REQ-023 | La ficha lista los códigos de cada licencia con: estado en palabras («Pendiente», «Usado», «Caducado», «Anulado»), quién lo generó, cuándo, cuándo caduca y, si se usó o se anuló, cuándo. Nunca muestra el código. |
| REQ-024 | El código no aparece en registros del servidor, direcciones de página, historial del navegador, mensajes de error, herramientas de supervisión de errores, auditoría ni en ninguna respuesta distinta de la de su generación (artículo 4). |

### Conexiones

| ID | Requisito |
| --- | --- |
| REQ-025 | La ficha lista las conexiones del cliente con: asistente (Claude, ChatGPT u otro), fecha de alta, último uso y estado en palabras: «Activa» o «Revocada». Una conexión revocada muestra su fecha y su motivo, de esta lista cerrada: «por un administrador», «automática por credencial reutilizada» o «por revocación de la licencia». |
| REQ-026 | Un superadmin puede revocar una conexión, una a una, con confirmación. |
| REQ-027 | La revocación tiene efecto inmediato: toda llamada de esa conexión al conector que empiece después de que el panel confirme la revocación se rechaza, sea a cualquiera de las tres herramientas o para renovar su acceso, también dentro de la ventana de gracia de la renovación. Esa conexión no vuelve a recibir instrucciones. |
| REQ-028 | Revocar una conexión no afecta a ninguna otra conexión, ni de la misma licencia ni de otros clientes. |
| REQ-029 | La revocación de una conexión no se puede deshacer. Volver a conectar ese asistente exige un código de activación nuevo, que crea una conexión nueva. |

### Confirmación, autorización, atomicidad y auditoría

| ID | Requisito |
| --- | --- |
| REQ-030 | Toda acción que afecta a un agente (dar de baja, reactivar cliente, suspender, reactivar licencia, revocar licencia, fijar, cambiar o quitar la caducidad, revocar conexión) pide confirmación en un diálogo que dice: qué va a pasar, a qué cliente o conexión, cuándo lo notará el agente y si se puede deshacer. El botón de confirmar dice lo que hace («Revocar conexión», «Suspender licencia»). Cancelar no cambia nada. Revocar una licencia exige además la confirmación reforzada de REQ-071. |
| REQ-071 | Para revocar una licencia hay que teclear el nombre comercial del cliente en el diálogo; el botón de confirmar no actúa hasta que el texto coincide según la regla de REQ-077 (sin distinguir mayúsculas ni tildes). Se puede pegar. El diálogo cumple REQ-037 y REQ-038 con nombres de hasta 120 caracteres, y comunica al lector de pantalla qué hay que escribir y si el texto coincide. |
| REQ-031 | Solo un superadmin con doble factor verificado en su sesión puede ver los datos de esta función o ejecutar sus acciones. La autorización se decide en el servidor y en la base de datos, con independencia de lo que muestre la interfaz (artículo 3). |
| REQ-032 | Todos los datos de esta función se leen y se escriben con la sesión del usuario. Ninguna lectura ni escritura usa la clave secreta (amenaza A-10). |
| REQ-033 | Cada acción se aplica entera, junto con su fila de auditoría, o no se aplica nada. |
| REQ-034 | Cada acción deja una fila de auditoría con quién, qué acción (de una lista cerrada que distingue alta, edición, baja y reactivación de cliente; creación, suspensión, reactivación, revocación y cambio de caducidad de licencia; generación y anulación de código; revocación de conexión), sobre qué objeto, de qué cliente y cuándo. La fila no contiene el código de activación, nada derivado de él, ni tokens. |
| REQ-035 | Si el panel no recibe respuesta de una acción (tiempo agotado, red caída), no la da por hecha ni por fallida: lo dice así y vuelve a leer el estado real antes de permitir repetirla. |
| REQ-036 | Los mensajes de error dicen qué ha pasado y qué se puede hacer. No muestran datos internos, identificadores técnicos ni valores recibidos. |

### Experiencia (puerta P5)

| ID | Requisito |
| --- | --- |
| REQ-037 | La lista, la ficha, los formularios de alta y edición y todos los diálogos de esta función cumplen WCAG 2.2 AA, con los componentes de la función 020. |
| REQ-038 | Todo se puede ver y hacer en un móvil de 320 píxeles de ancho, sin desplazamiento horizontal de página. |
| REQ-039 | Cada vista y cada sección de la ficha tienen los cinco estados: carga, vacío (con qué hacer a continuación, por ejemplo «Este cliente no tiene licencia. Crear licencia»), error con reintento, sin permiso y datos parciales (si falla una sección, las demás se muestran y la que falla lo dice). |
| REQ-040 | Los textos están en español de España, con trato de tú; las fechas, con el formato `12 nov 2026, 08:04` y hora de Madrid; los números, con punto de miles. |

### Efecto en el agente (resumen informativo de los requisitos anteriores)

| Situación | Qué recibe el agente | Cuándo |
| --- | --- | --- |
| Licencia activa, cliente activo | Instrucciones, si nada más lo impide (pausa, versión; funciones 023 y fase 4) | Siguiente revisión |
| Licencia suspendida (a mano, por cobro o por las dos) o caducada | Estado `suspendida`, sin prompt, reglas ni versión | Siguiente revisión |
| Cliente dado de baja | Estado `suspendida`, sin instrucciones. La licencia y las conexiones se conservan y siguen renovando su acceso | Siguiente revisión |
| Cliente reactivado | Instrucciones de nuevo, con la misma licencia y las mismas conexiones, si nada más lo impide | Siguiente revisión |
| Licencia revocada | Ninguna instrucción y sin renovación; sus conexiones pasan a revocadas. La forma exacta de la respuesta la decide la fase 2 | Siguiente llamada |
| Conexión revocada | Llamada rechazada y sin renovación | Siguiente llamada, de inmediato |

## Casos negativos

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-041 | Petición sin sesión, o con sesión de superadmin sin doble factor verificado | No se lee ningún dato ni se aplica ningún cambio; la base de datos tampoco devuelve filas ni acepta escrituras. Se pide iniciar sesión o verificar el doble factor (función 021) |
| REQ-042 | Usuario con sesión que no es administrador, incluido un usuario de un cliente | Ni páginas, ni datos, ni acciones de esta función. Se muestra «sin permiso» sin revelar si el cliente o el objeto existen |
| REQ-043 | El superadmin pierde el rol o el doble factor entre abrir un diálogo y confirmarlo | La acción se rechaza sin cambios |
| REQ-044 | Generar un código para una licencia revocada, suspendida (por cualquier causa) o caducada, o para un cliente dado de baja | Se rechaza; no se crea ni se muestra ningún código |
| REQ-045 | Doble clic o envío repetido de la misma generación de código | Se crea y se muestra un solo código |
| REQ-046 | Intento de volver a ver un código ya mostrado: recargar, botón atrás, otra pestaña, otro superadmin, lectura directa de los datos con la sesión | Imposible: solo se ve su estado |
| REQ-047 | Repetir una acción ya aplicada: revocar una conexión ya revocada, suspender una licencia ya suspendida a mano, dar de baja a un cliente ya de baja, reactivar a un cliente que no está de baja | No cambia nada (se conserva la fecha original), no se añade fila de auditoría y se informa de que ya estaba hecho |
| REQ-048 | Dos superadmin actúan a la vez sobre la misma licencia o conexión (por ejemplo, uno suspende y otro revoca) | El estado final es el de una secuencia válida de transiciones; ninguna se aplica desde un estado que no la permite; quien llega tarde ve el estado actual y un aviso |
| REQ-049 | Dos superadmin editan a la vez el mismo cliente | El segundo cambio, hecho sobre datos desactualizados, se rechaza y se le muestran los valores actuales; el primero no se pierde |
| REQ-050 | Crear una segunda licencia vigente para un cliente, también con dos peticiones simultáneas | Se rechaza; queda una sola licencia vigente |
| REQ-051 | Nombre vacío, solo con espacios, de más de 120 caracteres, con saltos de línea, con caracteres de control o con caracteres invisibles (por ejemplo, los de anchura cero) | Se rechaza con el error junto al campo; no se guarda nada |
| REQ-052 | Nombre con cualquier signo, incluidos `<`, `>`, comillas, etiquetas HTML o código | Se admite y se guarda tal cual; se muestra siempre como texto literal y nunca se interpreta ni se ejecuta en ninguna vista |
| REQ-053 | Nombre igual al de otro cliente, en el alta o en la edición, según la regla de comparación de REQ-077 | Se rechaza con el error junto al campo; no se guarda nada. La prohibición se cumple también con dos altas o ediciones simultáneas |
| REQ-054 | Frecuencia vacía, no entera, con texto, menor que 1 o mayor que 168 | Se rechaza con el error junto al campo; no se guarda nada |
| REQ-055 | Formulario o petición con campos de más (por ejemplo, estado, canal, cliente, licencia, fecha de alta, autor) | Se ignoran: no cambian nada, no se guardan y sus valores no se registran |
| REQ-056 | Identificador de otro objeto manipulado en la petición: la licencia, el código o la conexión no pertenecen al cliente de la ficha, o no existen | Se rechaza sin cambios, con el mismo mensaje para «no existe» y «no corresponde» |
| REQ-057 | Intento, con la sesión de un superadmin y escribiendo directamente en la base de datos, de cambiar a qué cliente pertenece una licencia, a qué licencia pertenece un código o una conexión, o quién generó un código | Se rechaza en la base de datos |
| REQ-058 | La base de datos falla o deja de responder a mitad de una acción | No queda ningún cambio a medias ni fila de auditoría huérfana; no se muestra un código que no haya quedado guardado; el error ofrece reintentar, y reintentar no duplica |
| REQ-059 | Intento de borrar un cliente con o sin historial, una licencia, un código o una conexión, también con peticiones directas a la base de datos con la sesión de un superadmin | Se rechaza; los datos quedan intactos |
| REQ-060 | Transición no permitida: reactivar una licencia revocada o no suspendida a mano, suspender o cambiar la caducidad de una revocada, revocar dos veces, fijar una caducidad pasada, crear licencia o reactivarla para un cliente de baja; también por escritura directa en la base de datos | Se rechaza sin cambios |
| REQ-061 | Intento de deshacer la revocación de una conexión o de cambiar su fecha o su motivo de revocación, también por escritura directa en la base de datos | Se rechaza en la base de datos |
| REQ-062 | No se puede escribir la fila de auditoría de una acción | La acción no se aplica |
| REQ-063 | Uso de un código ya usado, caducado o anulado, de una licencia revocada, suspendida o caducada, o de un cliente dado de baja | No se crea conexión. El mensaje de la pantalla de activación no distingue el motivo (requisito 17 de la función 001) |
| REQ-064 | Acción de esta función enviada desde otro sitio, o páginas de esta función cargadas dentro de otra página | Se rechaza o se impide (amenaza A-21) |
| REQ-079 | Al dar de alta un cliente no se pueden guardar sus reglas por defecto (fallo o rechazo de la base de datos, o falta de respuesta a mitad del alta) | El alta no se hace: no queda cliente sin reglas, reglas sin cliente ni fila de auditoría del alta. El error dice que el cliente no se ha creado y ofrece reintentar; reintentar no duplica el cliente |
| REQ-075 | Dos generaciones de código simultáneas para la misma licencia, desde pestañas o superadmin distintos | Queda como mucho un código pendiente para esa licencia; cualquier otro código creado aparece «Anulado» con su fila de auditoría |
| REQ-076 | Intento de volver a hacer utilizable un código anulado, usado o caducado (quitarle la anulación o el uso, cambiar su fecha de anulación o alargar su caducidad), también por escritura directa en la base de datos | Se rechaza en la base de datos |

## Criterios de aceptación

Las pruebas de base de datos se ejecutan en CI (no hay Docker en la máquina de desarrollo). Las de extremo a extremo con agente necesitan el conector de la fase 2 desplegado en el entorno de desarrollo.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Con datos ficticios que incluyen al menos un cliente en cada uno de los 6 estados, una prueba de extremo a extremo comprueba que cada fila muestra los 5 datos y la palabra de estado correcta: 6 de 6 estados correctos, con la palabra presente como texto | REQ-001, REQ-002 |
| CA-002 | Con 1.000 clientes ficticios: el orden por defecto y los 6 órdenes posibles son correctos; buscar «perez» encuentra «Pérez» y «PÉREZ»; buscar «pena» no encuentra «Peña»; buscar «garcia  sl», con dos espacios, encuentra «García SL»; cada página tiene 25 filas salvo la última y el total coincide; tras 10 búsquedas, el texto buscado aparece 0 veces en la dirección y en el historial | REQ-003 a REQ-005, REQ-077 |
| CA-003 | En el entorno previo, con 1.000 clientes y una ficha con 50 conexiones y 200 códigos, 200 mediciones de cada operación (primera página, búsqueda, cambio de orden, cambio de página, apertura de ficha) dan un percentil 95 menor de 2 segundos | REQ-006 |
| CA-004 | Una prueba de extremo a extremo abre la ficha de un cliente con licencia vigente suspendida a mano, dos licencias revocadas, códigos en los 4 estados y conexiones activas y revocadas con los 3 motivos, y encuentra todos los datos de REQ-007, incluidas las causas de suspensión, el canal y el sitio de la sección de reglas, cuyo contenido comprueba la función 025, sin que aparezca ningún código ni ningún control de esta función para cambiar reglas | REQ-007 |
| CA-005 | El formulario de alta y el de edición tienen exactamente 2 campos y ninguno de reglas; 20 altas válidas crean 20 clientes activos sin licencia, cada uno con sus cinco reglas guardadas con los valores por defecto que fija la función 025 (20 de 20); una edición cambia solo nombre y frecuencia; la respuesta que recibe el agente en su revisión es idéntica antes y después de la edición | REQ-008, REQ-009 |
| CA-006 | Con 10 nombres de prueba que contienen etiquetas, guiones, `<`, `>`, `&`, comillas y caracteres especiales: los 10 se guardan sin cambios y, en la lista, la ficha, los diálogos y los avisos, se ven literalmente y no se ejecuta ningún guion (0 ejecuciones detectadas) | REQ-010, REQ-052 |
| CA-007 | Con el agente de prueba conectado: tras dar de baja al cliente, sus 10 revisiones siguientes reciben `suspendida` sin instrucciones; la licencia y las conexiones siguen sin revocar y la conexión renueva su acceso; sus datos e historial siguen en la ficha; crear licencia y generar código para él se rechazan (2 de 2); revocar su licencia y revocar una de sus conexiones se aplican (2 de 2) | REQ-011 |
| CA-008 | La interfaz no ofrece ninguna acción de borrado; pruebas de base de datos con sesión de superadmin intentan borrar un cliente con historial, una licencia, un código y una conexión: 4 de 4 rechazados y las filas siguen intactas | REQ-012, REQ-059 |
| CA-009 | Pruebas de base de datos: una segunda licencia vigente para el mismo cliente se rechaza; en 20 repeticiones de dos creaciones simultáneas, queda exactamente 1 licencia vigente; crear licencia para un cliente activo sin licencia funciona y nace activa | REQ-013, REQ-014, REQ-050 |
| CA-010 | Con el agente de prueba: tras suspender la licencia, la siguiente revisión recibe `suspendida` sin prompt, reglas ni versión, y las conexiones siguen activas; tras reactivarla, la siguiente revisión recibe instrucciones. 10 de 10 repeticiones correctas | REQ-015, REQ-016 |
| CA-011 | Pruebas de base de datos en CI que simulan la causa de cobro: con la causa manual sola, reactivar a mano deja la licencia activa; con las dos causas, reactivar a mano la deja suspendida por cobro; quitar la causa de cobro con la manual presente la deja suspendida; un proceso automático no quita la causa manual (0 de 10 intentos la quitan). La ficha muestra en palabras las causas presentes en los 3 casos (3 de 3) | REQ-017, REQ-072 |
| CA-012 | Con el agente de prueba: tras revocar la licencia, el 100 % de las llamadas y renovaciones de sus conexiones durante 5 minutos no recibe instrucciones ni acceso; sus conexiones activas aparecen «Revocada» con el motivo «por revocación de la licencia» y su fecha; su código pendiente aparece «Anulado» y no crea conexión; pruebas de base de datos rechazan las transiciones de REQ-060 (todas); después se puede crear una licencia nueva | REQ-018, REQ-060, REQ-069, REQ-073 |
| CA-013 | Una licencia con caducidad 2 minutos en el futuro pasa a «Licencia caducada» en la lista y la ficha, y la primera revisión posterior recibe `suspendida`; una caducidad en el pasado se rechaza; quitar la caducidad devuelve las instrucciones en la siguiente revisión | REQ-019 |
| CA-014 | Un código generado crea una conexión con su primer uso; no crean conexión: un segundo uso, un código sin usar pasados 15 minutos y 5 segundos, un código anulado, y los códigos de una licencia revocada, de una suspendida, de una caducada y de un cliente de baja. 8 de 8 casos correctos | REQ-020, REQ-063, REQ-070 |
| CA-015 | Tras generar un código y cerrar el diálogo, recargar, volver atrás, abrir otra pestaña, entrar con otro superadmin y leer los datos con la sesión no muestran el código: 0 apariciones en 5 vías. El diálogo sigue abierto pasados 10 minutos sin interacción y el botón de copiar funciona con teclado | REQ-021, REQ-022, REQ-046 |
| CA-016 | La ficha muestra correctamente estado, autor, fecha de generación, caducidad y fecha de uso o de anulación de códigos en los 4 estados (4 de 4) | REQ-023 |
| CA-017 | Tras 20 generaciones y usos de códigos, incluidos errores provocados, cada código buscado aparece 0 veces en los registros del servidor, la supervisión de errores, la auditoría, las direcciones visitadas, el historial y los datos guardados en claro | REQ-024 |
| CA-018 | La ficha muestra asistente, alta, último uso y estado correctos para conexiones activas de Claude y de ChatGPT y para conexiones revocadas con cada uno de los 3 motivos, el automático simulado en los datos de prueba (5 de 5) | REQ-025 |
| CA-019 | Criterio de la fase 3 «Revocar una conexión la deja sin acceso de inmediato». En el entorno de desarrollo, con el conector de la fase 2, dos conexiones de la misma licencia y una de otro cliente llaman sin parar a las tres herramientas y renuevan su acceso. Se revoca una desde el panel, con confirmación. En 20 repeticiones: la primera llamada de la conexión revocada, lanzada en menos de 1 segundo tras la confirmación, se rechaza; durante 5 minutos, 0 llamadas y 0 renovaciones (incluidas las de la ventana de gracia) de esa conexión se aceptan; el 100 % de las llamadas de las otras dos se aceptan | REQ-026 a REQ-028 |
| CA-020 | La interfaz no ofrece deshacer la revocación; pruebas de base de datos con sesión de superadmin intentan quitar la fecha de revocación, cambiarla y cambiar el motivo: 3 de 3 rechazados; volver a conectar exige un código nuevo y crea una conexión distinta | REQ-029, REQ-061 |
| CA-021 | Para cada una de las 7 acciones que afectan a un agente, una prueba comprueba que aparece el diálogo, que su texto dice qué pasa, a quién, cuándo y si se puede deshacer, y que cancelar deja 0 cambios y 0 filas de auditoría | REQ-030 |
| CA-022 | Pruebas de base de datos en CI y de extremo a extremo con 4 sesiones (sin sesión, usuario sin rol, usuario de un cliente, superadmin sin doble factor): 0 filas leídas y el 100 % de las escrituras rechazadas en todos los datos de esta función, y «sin permiso» en todas sus páginas y acciones; una acción cuya sesión pierde el doble factor antes de confirmar se rechaza sin cambios | REQ-031, REQ-041 a REQ-043 |
| CA-023 | La revisión del código y una comprobación automática confirman que ninguna pieza de esta función usa la clave secreta; las pruebas de base de datos de esta función se ejecutan con la sesión del usuario | REQ-032 |
| CA-024 | Con fallos provocados de la base de datos en cada paso de las 11 acciones, y con respuestas que no llegan: 0 cambios a medias, 0 filas de auditoría sin su cambio, 0 cambios sin su fila, 0 códigos mostrados sin guardar; el panel muestra «resultado desconocido» cuando no hay respuesta y relee el estado; reintentar no duplica | REQ-033, REQ-035, REQ-058, REQ-062 |
| CA-025 | Cada una de las 11 acciones (alta, edición, baja y reactivación de cliente; creación, suspensión, reactivación, revocación y cambio de caducidad de licencia; generación de código; revocación de conexión) deja exactamente 1 fila de auditoría con quién, acción distinguible, objeto, cliente y momento; además, generar un código con otro pendiente, revocar o suspender a mano una licencia con un código pendiente y dar de baja a un cliente con un código pendiente dejan exactamente 1 fila de anulación por código anulado; ninguna fila contiene el código ni nada derivado de él (15 de 15 casos) | REQ-034, REQ-070 |
| CA-026 | Una revisión de todos los mensajes de error de esta función no encuentra datos internos, identificadores técnicos ni valores recibidos (0 hallazgos) | REQ-036 |
| CA-027 | El análisis automático de accesibilidad da 0 incumplimientos de nivel A y AA en la lista, la ficha, los dos formularios y los diálogos; la revisión manual con teclado y lector de pantalla del `disenador-ui` no deja hallazgos bloqueantes | REQ-037 |
| CA-028 | Con 320 píxeles de ancho, cada vista y diálogo se usa sin desplazamiento horizontal de página y todas las acciones están disponibles; capturas en el informe de la puerta P5 | REQ-038 |
| CA-029 | Hay captura de los 5 estados de la lista, de la ficha y de cada sección de la ficha | REQ-039 |
| CA-030 | Una revisión de textos no encuentra inglés, trato de usted ni fechas o números con otro formato (0 hallazgos) | REQ-040 |
| CA-031 | Generar un código para una licencia revocada, para una suspendida a mano, para una caducada y para un cliente de baja se rechaza (4 de 4) sin crear ni mostrar código | REQ-044 |
| CA-032 | Dos envíos de la misma generación separados por menos de 100 milisegundos crean y muestran 1 solo código, en 10 de 10 repeticiones | REQ-045 |
| CA-033 | Repetir revocar una conexión, suspender a mano una licencia, dar de baja un cliente y reactivar un cliente activo: 0 cambios, fecha original conservada, 0 filas de auditoría nuevas y aviso «ya estaba hecho» (4 de 4) | REQ-047 |
| CA-034 | En 20 repeticiones de acciones simultáneas sobre la misma licencia (suspender y revocar; reactivar y revocar) y de dos ediciones simultáneas del mismo cliente: 0 estados finales imposibles, 0 cambios perdidos sin aviso | REQ-048, REQ-049 |
| CA-035 | Una batería de nombres y frecuencias inválidos (vacío, espacios, 121 caracteres, salto de línea, carácter de control, carácter de anchura cero, 0, 169, decimal, texto, vacío) se rechaza al 100 % con el error junto al campo y 0 filas guardadas. Con un cliente «Pérez» existente, los nombres «Pérez», «PEREZ», « perez » y «Perez» se rechazan en el alta y en la edición de otro cliente (8 de 8); con «García SL» existente, «garcia  sl», con dos espacios seguidos, se rechaza; con «Pena» existente, «Peña» se admite, y con «Agüero» existente, «Aguero» se admite. En 20 repeticiones de dos altas simultáneas con el mismo nombre queda 1 solo cliente con ese nombre | REQ-051, REQ-053, REQ-054, REQ-077 |
| CA-036 | Para cada formulario y acción, una petición con 5 campos de más no cambia nada fuera de los campos permitidos, y los registros contienen 0 de los valores enviados en esos campos | REQ-055 |
| CA-037 | Peticiones con el identificador de una licencia, código o conexión de otro cliente o inexistente se rechazan al 100 % sin cambios y con el mismo mensaje; pruebas de base de datos rechazan cambiar el cliente de una licencia, la licencia de un código o de una conexión y el autor de un código | REQ-056, REQ-057 |
| CA-038 | Una acción enviada desde otro origen se rechaza y las páginas de esta función no se cargan dentro de otra página (2 de 2) | REQ-064 |
| CA-039 | La ficha muestra el canal de un cliente en `estable` y de otro en `prueba` (2 de 2); ninguna vista ni diálogo de esta función ofrece cambiarlo; una petición de cada formulario y acción con un canal distinto deja el canal sin cambios (0 cambios) | REQ-065 |
| CA-040 | Con el agente de prueba: tras dar de baja y reactivar al cliente, la siguiente revisión recibe instrucciones con la misma licencia y las mismas conexiones, sin activación nueva; la reactivación pide confirmación y deja 1 fila de auditoría; con la licencia suspendida a mano, reactivar al cliente no devuelve instrucciones. 10 de 10 repeticiones correctas | REQ-066 |
| CA-041 | Una revisión del texto del diálogo de baja encuentra los 3 avisos de REQ-067: se puede deshacer con «Reactivar cliente», la licencia y las conexiones se conservan y siguen renovando sus credenciales, y para cortarlas hay que revocar la licencia o las conexiones (3 de 3) | REQ-067 |
| CA-042 | Generar un código con otro pendiente muestra antes el aviso; tras generarlo, el anterior aparece «Anulado» y la licencia tiene 1 solo código pendiente. Pruebas de base de datos en CI: en 20 repeticiones de dos generaciones simultáneas para la misma licencia queda como mucho 1 código pendiente y cualquier otro aparece «Anulado» con su fila de auditoría (20 de 20) | REQ-068, REQ-075 |
| CA-043 | En el diálogo de revocar licencia de un cliente con nombre de 120 caracteres: el botón no actúa con el campo vacío, con un texto distinto ni con la «ñ» cambiada por «n» (0 revocaciones en 10 intentos); actúa con el nombre tecleado tal cual, tecleado en minúsculas y sin tildes, y pegado (3 de 3); se completa solo con teclado y con lector de pantalla, que anuncia qué escribir y si coincide; a 320 píxeles se usa sin desplazamiento horizontal; el análisis automático da 0 incumplimientos de nivel A y AA | REQ-071, REQ-077 |
| CA-044 | Con sesión de usuario de un cliente y con sesión de superadmin sin doble factor, peticiones y direcciones de esta función con el identificador de su propio cliente, de otro cliente y de uno inexistente devuelven «sin permiso», el mismo mensaje y 0 filas en el 100 % de los casos; con sesión de superadmin con doble factor, cambiar el identificador en la dirección solo cambia el cliente mostrado | REQ-074 |
| CA-045 | Pruebas de base de datos con sesión de superadmin intentan quitar la anulación de un código, quitarle el uso, cambiar su fecha de anulación y alargar la caducidad de uno caducado: 4 de 4 rechazados | REQ-076 |
| CA-046 | Con un código pendiente en cada caso, dar de baja al cliente y suspender a mano la licencia: el código aparece «Anulado» con su fecha y su fila de auditoría; tras reactivar al cliente o la licencia sigue «Anulado» y no crea conexión; generar uno nuevo funciona (2 de 2 casos) | REQ-069 |
| CA-047 | Con datos ficticios de la función 023, una prueba de extremo a extremo comprueba que la lista muestra «Sin señal» y «En pausa» como palabra junto al estado en los clientes a los que la regla de la 023 se los asigna, y que no los muestra en los demás (100 % de filas correctas) | REQ-078 |
| CA-048 | Pruebas en CI con fallos provocados en el guardado de las reglas durante el alta (rechazo, error y falta de respuesta, 10 repeticiones de cada): 0 clientes creados, 0 reglas sin cliente y 0 filas de auditoría del alta; el panel dice que el cliente no se ha creado y ofrece reintentar; reintentar sin fallo crea 1 solo cliente con sus reglas por defecto. Al terminar, una consulta sobre todo el juego de prueba encuentra 0 clientes sin reglas | REQ-008, REQ-079 |

## Fuera de alcance

- Sistema de diseño, componentes comunes y armazón de pantalla: función 020.
- Inicio de sesión, doble factor, gestión de la sesión y alta y baja de administradores: función 021.
- Informes recibidos, página de resumen, órdenes pausar y reanudar, y sus secciones dentro de la ficha: función 023. También la regla que decide «Sin señal» y «En pausa» (aquí solo se muestran en la lista) y la indicación «Con avisos» en la lista.
- Página de auditoría y comprobación de cobertura completa: función 024. Esta función solo exige que sus acciones dejen fila.
- Reglas por cliente (máximo de correos, ventana de días, adjuntos, borradores, facturas por enlace): ni se muestran ni se editan aquí; las especifica la función 025 de la fase 3, que fija también sus valores por defecto. Esta función solo deja su sitio en la ficha y guarda los valores por defecto en el alta.
- Cambio de canal de un cliente, versiones del prompt, canales, publicación y pausa global: fase 4 (el cambio de canal, en la función 030). Aquí el canal solo se muestra.
- Alertas, incluida la de conexión nueva: fase 4.
- Alta de usuarios del cliente e invitaciones: fase 5.
- Suscripción, cobro, suspensión por cobro como causa separada, «forzar activa» pese a un impago, y plazos de conservación y borrado: fase 6. Hasta entonces no se borra nada.
- Qué recibe exactamente el agente con la licencia revocada: fase 2.
- Anular a mano un código pendiente suelto: solo se anula al generar otro, al revocar o suspender a mano la licencia o al dar de baja al cliente.
- Revocación automática de la licencia o de las conexiones al dar de baja a un cliente: la baja solo suspende.
- Pantalla de activación, formato y entropía del código, límite de intentos de activación, emisión, renovación y revocación automática de tokens: fases 1 y 2.
- Revocar en bloque varias conexiones o todas las de un cliente.

## Cuestiones abiertas

Se resuelven en `aclaraciones.md` antes de aprobar.

**Las cuestiones 1 a 16 están resueltas** (12 y 13/11/2026, detalle en `aclaraciones.md`): 1, reglas fuera de esta función, la ficha deja el sitio para la función 025; 2, canal en lectura, se cambia en la fase 4; 3, el código caduca a los 15 minutos; 4, un solo código pendiente por licencia, generar otro anula el anterior y revocar o suspender la licencia o dar de baja al cliente anula el pendiente, con estado «Anulado» y fila de auditoría; 5, con licencia suspendida o caducada se rechaza; 6, nombres repetidos prohibidos sin distinguir mayúsculas ni tildes; 7, la baja solo suspende, se reactiva con «Reactivar cliente» y no se borra nada; 8, revocar una licencia exige teclear el nombre del cliente, que se puede pegar; 9, suspensión manual y por cobro son dos causas separadas; 10, se decide en la fase 2 y queda como dependencia; 11, lectura confirmada como nota aclaratoria del artículo 2; 12, cualquier signo, mostrado como texto, y se rechazan saltos de línea y caracteres invisibles; 13, motivo de revocación de lista cerrada; 14, 1.000 clientes y percentil 95 por debajo de 2 segundos; 15, el nombre tecleado vale si coincide sin distinguir mayúsculas ni tildes, y se puede pegar; 16, la ñ y la ü no se igualan a n y u, tildes y mayúsculas se ignoran y los espacios seguidos cuentan como uno. Además, la lista muestra «Sin señal» y «En pausa» con la regla de la función 023.

Texto original:

1. **Reglas por cliente en esta función.** `docs/DISENO.md` pone las reglas (máximo de correos por revisión, ventana de días, guardar adjuntos, preparar borradores, descargar facturas por enlace) en la ficha de cliente, pero el plan no dice en qué fase se editan. Opciones: (a) entran aquí, como valores acotados y booleanos con confirmación, porque cambian lo que hace el agente; (b) se muestran aquí solo en lectura y se editan en otra función de la fase 3 o de la fase 4; (c) ni se muestran hasta otra fase. Con (a) crecen esta función y sus pruebas; con (b) o (c) los clientes nuevos funcionan con los valores por defecto hasta entonces.
2. **Canal del cliente (`estable` o `prueba`).** Opciones: (a) se cambia aquí; (b) se muestra aquí en lectura y se cambia en la fase 4, que crea los canales; (c) ni se muestra hasta la fase 4. Con (a), un superadmin podría pasar un cliente a `prueba` antes de que existan la publicación y la vuelta atrás.
3. **Duración del código de activación.** ¿Cuántos minutos? Menos minutos reducen el riesgo de robo (A-01, A-02); más minutos dan margen al instalador si la instalación se complica. Hace falta un número para CA-014.
4. **Varios códigos pendientes y anulación.** ¿Puede haber varios códigos pendientes a la vez para una licencia? ¿Se puede anular uno pendiente? Opciones: (a) uno solo, y generar otro anula el anterior; (b) varios, con anulación manual; (c) varios, sin anulación (caducan solos). Con anulación hace falta un estado más («Anulado») y su fila de auditoría; sin ella, un código filtrado sigue sirviendo hasta que caduca. También: ¿revocar la licencia o dar de baja al cliente deben mostrar sus códigos pendientes como anulados?
5. **Código con licencia suspendida o caducada.** Opciones: (a) se rechaza, como con una revocada; (b) se permite, la conexión se crea y el agente recibe `suspendida` hasta que se reactive. Con (b) se puede dejar instalado un cliente antes de activarle el servicio; con (a) hay que reactivar antes de instalar.
6. **Nombres repetidos.** ¿Pueden dos clientes tener el mismo nombre comercial? Prohibirlo evita confundir clientes en la lista y en la auditoría; permitirlo cubre empresas homónimas, que habría que distinguir de otra forma sin añadir texto libre.
7. **Baja de cliente: vuelta atrás, efecto y borrado.** (a) ¿Se puede reactivar un cliente dado de baja? Si sí, ¿vuelve con su licencia y sus conexiones, o necesita licencia y activación nuevas? (b) ¿La baja debe revocar también la licencia y las conexiones, o solo hacer que el agente reciba `suspendida`? Revocar es más seguro y es definitivo; no revocar permite volver atrás. (c) ¿Se borra alguna vez un cliente? Los plazos de conservación son de la fase 6; hasta entonces esta especificación no borra nada.
8. **Confirmación reforzada.** ¿Revocar una licencia (y quizá dar de baja a un cliente) exige más que un diálogo, por ejemplo teclear el nombre del cliente? Reduce errores en acciones definitivas a cambio de un paso más; afecta a la accesibilidad del diálogo, que habría que probar igual.
9. **Suspensión manual frente al cobro de la fase 6.** El modelo de referencia tiene un estado de la licencia y, aparte, un «estado manual» que puede forzar activa o suspendida (ADR-0006), previsto para la fase 6. ¿La suspensión de esta función es ese «forzar suspendida» o un estado propio? Y si el superadmin reactiva a mano, ¿debe poder imponerse a una suspensión por impago? Opciones: (a) la suspensión manual usa el mismo mecanismo que el estado manual de la fase 6, que entonces se adelanta a la fase 3; (b) suspensión manual y suspensión por cobro son dos causas separadas y la licencia queda suspendida mientras haya alguna. (a) es más simple; (b) evita que reactivar a mano borre sin querer una suspensión por impago. Afecta a la fase 6.
10. **Qué recibe el agente con la licencia revocada.** `docs/ARQUITECTURA.md` dice que el servidor responde «siempre con un estado»; el modelo de referencia trata la licencia revocada como una conexión revocada (no autorizado). Opciones: (a) rechazo como no autorizado: el asistente puede pedir al cliente que vuelva a autorizar; (b) estado `suspendida` sin instrucciones, sin renovación posterior: el agente se detiene de forma limpia y lo informa. Afecta también a la fase 2.
11. **Identificador de cliente en el panel superadmin.** El artículo 2 dice que el identificador del cliente nunca se acepta como entrada y se deriva de la sesión en los dashboards; la regla de interfaz dice que la dirección solo lleva identificadores propios del usuario. El superadmin necesita elegir un cliente cualquiera. ¿Se confirma esta interpretación: en el panel superadmin el identificador del cliente puede ir en la petición o en la dirección para elegir, pero nunca concede permiso, que se deriva solo de la sesión? Si no, el diseño tendrá que evitar identificadores de cliente en la dirección.
12. **Caracteres especiales en el nombre.** ¿Se rechazan los signos `<` y `>` en el nombre comercial, o se admiten y se muestran como texto literal? Rechazarlos reduce el riesgo si alguna salida futura olvida mostrarlo literal; admitirlos respeta nombres reales poco habituales.
13. **Motivo de la revocación de una conexión.** ¿Debe la ficha distinguir una conexión revocada por un superadmin de una revocada automáticamente por reutilización de su token (fase 2)? Ayuda a responder a incidentes; el modelo de referencia no guarda el motivo.
14. **Volumen y umbral de rendimiento.** Esta especificación propone medir con 1.000 clientes y un percentil 95 menor de 1 segundo. ¿Es un volumen razonable para los próximos años y un umbral aceptable?

Surgidas al aplicar las respuestas (resueltas el 13/11/2026):

15. **Coincidencia del nombre tecleado al revocar una licencia.** ¿El texto tecleado debe coincidir exactamente con el nombre comercial, o basta con que coincida sin distinguir mayúsculas, tildes ni espacios de los extremos, como en los nombres repetidos? La coincidencia exacta obliga a fijarse más; la flexible es más fácil en móvil y con teclados sin tildes. Hace falta para CA-043.
16. **Qué cuenta como tilde al comparar nombres.** En los nombres repetidos (REQ-053) y en la búsqueda (REQ-004), ¿la «ñ» se iguala a la «n» y la «ü» a la «u»? ¿Son el mismo nombre dos que solo se diferencian en espacios repetidos dentro del nombre? Igualarlos evita más confusiones; distinguirlos respeta pares como «Peña» y «Pena».

## Dependencias y decisiones relacionadas

- **Constitución:** artículos 1, 2, 3, 4, 6, 10, 12 y 13. REQ-074 se apoya en la nota aclaratoria del artículo 2 que el responsable eligió el 12/11/2026; la aplica coordinación como enmienda con fecha y versión, y mientras no esté anotada la especificación depende de ella.
- **Decisiones:** D-006 (código de un solo uso y conexiones revocables por separado), D-008 (listas cerradas), D-010 (suspensión por impago con estado manual, fase 6), T-004 y T-005 (claves y patrón de aislamiento), V-108 (doble factor exigido en las políticas, fase 2), V-110 (librería de interfaz, fase 3).
- **ADR:** 0002 (autorización y activación), 0003 (aislamiento por cliente), 0006 (cobro sin facturar).
- **Amenazas:** A-01, A-02, A-05, A-07, A-10, A-11, A-21.
- **Se supone de la fase 1:** pantalla de activación que consume el código y crea la conexión; formato y entropía del código; tokens con renovación, ventana de gracia y caducidad deslizante (función 001).
- **Se supone de la fase 2:** datos de clientes, licencias, códigos de activación y conexiones con aislamiento en la base de datos y pruebas en CI; el conector comprueba en cada llamada y en cada renovación que la conexión no esté revocada y el estado de la licencia y del cliente; códigos guardados de forma que no se puedan reconstruir; límite de intentos de activación; auditoría de solo inserción; doble factor exigido en las políticas de superadmin. CA-019 y los criterios con agente de prueba necesitan el conector de la fase 2 desplegado en el entorno de desarrollo.
- **Datos nuevos que se piden a la fase 2:** un solo código pendiente por licencia y el estado anulado con su fecha, también al suspender la licencia o dar de baja al cliente; motivo de revocación de la conexión, de lista cerrada, incluida la revocación automática por credencial reutilizada; causa de suspensión manual separada de la de cobro; canal del cliente legible; el uso de un código se rechaza también con licencia suspendida o caducada.
- **Pendiente de la fase 2:** qué recibe el agente con la licencia revocada (cuestión 10). Esta función es válida con cualquiera de las dos opciones.
- **Se supone de la fase 3:** componentes y estados de la función 020; sesión con doble factor e identificación de los administradores de la función 021; secciones de informes y órdenes de la función 023, y la regla que decide «Sin señal» y «En pausa» en la lista (REQ-078); página de auditoría de la función 024, cuyo inventario incluye ahora reactivar cliente y anular código; sección de reglas y valores por defecto de la función 025, que el alta guarda (REQ-008). El volumen de referencia (1.000 clientes) y el umbral (percentil 95 por debajo de 2 segundos) son comunes a toda la fase 3.
- **Fase 4:** cambio de canal del cliente (función 030).
- **Fase 6:** suspensión por cobro como causa separada de la manual (función 050) y «forzar activa» pese a un impago.
- **Modelo de referencia:** `docs/MODELO-DATOS.sql`, en estado PROPUESTA. Esta especificación no lo toma como solución; las diferencias que necesita se anotan para el diseño.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 13/11/2026 | Responsable | Aprobada (puerta P0). Respuesta expresa en el diálogo de preguntas del chat de la fase 3: «Apruebo la 022». El resumen presentado incluía las deducciones del `especificador` anotadas en `aclaraciones.md` |

Enmienda del 13/11/2026: aprobada por el responsable después de la puerta P0 («Sí, apruebo las dos», ver `aclaraciones.md`). Dar de alta un cliente guarda también, en la misma operación, sus reglas con los valores por defecto que fija la función 025; si no se pueden guardar, el alta no se hace. Cambian REQ-007, REQ-008, CA-004, CA-005, «Fuera de alcance» y «Dependencias»; se añaden REQ-079 y CA-048. La especificación sigue APROBADA.
