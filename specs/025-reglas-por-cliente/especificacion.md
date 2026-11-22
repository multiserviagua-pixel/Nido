# 025 · Reglas por cliente

Estado: PLANIFICADA
Fase: 3 · Fecha: 13/11/2026 · Revisada: 13/11/2026, con las respuestas de `aclaraciones.md` · Autor: `especificador` · Enmienda mecánica del 22/11/2026 en CA-010 (ver «Registro de cambios»); enmienda E-1 pedida (`propuestas.md`, P25-01)

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Cada agente de correo trabaja con cinco reglas propias de su cliente: cuántos correos trata como mucho en una revisión, cuántos días hacia atrás mira y si guarda adjuntos, prepara borradores y descarga facturas por enlace. Hoy no hay forma de verlas ni de cambiarlas sin tocar la base de datos a mano. Esta función permite a un superadmin, desde la ficha del cliente, ver esas reglas y su historial de cambios, cambiarlas y volver a los valores por defecto, con confirmación, con fila de auditoría y sabiendo cuándo las recibirá el agente. Las reglas solo admiten enteros acotados y booleanos (artículo 1), y cambiarlas no abre ninguna vía para leer o tocar datos de otro cliente (artículos 2 y 3). Responde a la decisión del responsable del 13/11/2026 (cuestión 1 de la función 022).

## Quién la usa y cómo

- Como **superadmin de HumanaIA**, quiero ver en la ficha de un cliente las cinco reglas de su agente y si coinciden con las de por defecto, para saber cómo está trabajando.
- Como **superadmin**, quiero cambiar una o varias reglas a la vez, en cualquier estado del cliente, viendo antes qué cambia y cuándo lo notará el agente, para ajustar el agente a lo que pide el cliente sin sorpresas.
- Como **superadmin**, quiero devolver un cliente a los valores por defecto en un solo paso, para deshacer una configuración que no funciona.
- Como **superadmin**, quiero ver en la ficha quién cambió qué reglas y cuándo, para entender por qué el agente se comporta de otra forma.
- Como **responsable de HumanaIA**, quiero que cada cambio de reglas quede en la auditoría y que nadie sin doble factor pueda verlas ni cambiarlas.

## Términos

- **Las cinco reglas**: lista cerrada. Nombre visible, valores admitidos y valor por defecto:

  | Regla | Valores admitidos | Valor por defecto |
  | --- | --- | --- |
  | «Máximo de correos por revisión» | Entero de 1 a 100 | 30 |
  | «Ventana de días» | Entero de 1 a 14 | 3 |
  | «Guardar adjuntos» | Sí o No | Sí |
  | «Preparar borradores» | Sí o No | Sí |
  | «Descargar facturas por enlace» | Sí o No | Sí |

- **Valores por defecto**: los de la tabla anterior, iguales para todos los clientes (respuesta a las cuestiones 2 y 3).
- **Reglas del cliente**: los cinco valores guardados para él. Todo cliente las tiene desde su alta.
- **Siguiente revisión**: la primera petición de instrucciones del agente del cliente que empieza después de que el panel confirme el cambio.
- **Historial de reglas**: las filas de auditoría de las dos acciones de esta función sobre un cliente.

## Requisitos

### Reglas desde el alta

| ID | Requisito |
| --- | --- |
| REQ-049 | Todo cliente nace con sus reglas guardadas con los valores por defecto, en la misma acción que su alta (función 022): el alta y sus reglas se guardan juntas o no se guarda nada. No existe ningún cliente sin reglas guardadas. |

### Ver las reglas en la ficha

| ID | Requisito |
| --- | --- |
| REQ-001 | La ficha de cliente tiene una sección «Reglas del agente», en el sitio que deja la función 022, que muestra las cinco reglas con su nombre visible y su valor guardado: los enteros como número con su unidad («30 correos», «3 días») y los booleanos con la palabra «Sí» o «No». |
| REQ-002 | Cada regla lleva una explicación breve y visible de su efecto en el agente, coherente con lo que hace el agente según los requisitos 4 a 8 de la función 012 (por ejemplo: con «Preparar borradores» en «No», el agente no crea ningún borrador). |
| REQ-003 | La sección dice siempre, con palabra visible y no solo con color o icono, si las cinco reglas del cliente coinciden con los valores por defecto o si alguna es distinta. |
| REQ-004 | Los valores por defecto son los de «Términos», iguales para todos los clientes. Ninguna vista ni acción de esta función permite cambiarlos. |
| REQ-005 | Los cinco valores que muestra la sección son exactamente las reglas que recibiría el agente del cliente si pidiera instrucciones en ese momento y recibiera el estado `activa`. |

### Cambiar las reglas

| ID | Requisito |
| --- | --- |
| REQ-006 | Un superadmin puede cambiar una, varias o las cinco reglas de un cliente en una sola acción, «Guardar reglas». La acción aplica todos los cambios que lleva o ninguno. |
| REQ-007 | Solo se admiten los valores de la tabla de «Términos»: enteros dentro de su rango para las dos primeras reglas y Sí o No para las otras tres. No existe ningún otro campo: ni nota, ni motivo, ni comentario, ni ningún texto libre (artículo 1). |
| REQ-008 | Antes de guardar, un diálogo de confirmación con el componente de la función 020 enumera cada regla que cambia con su valor actual y el nuevo, en palabras («Máximo de correos por revisión: de 30 a 50»; «Preparar borradores: de Sí a No»); no enumera como cambio una regla que no cambia; nombra al cliente; dice que se aplicará en la siguiente revisión de su agente y que una revisión que ya haya empezado sigue con las reglas que recibió; y dice que se puede volver a cambiar. El botón de confirmar dice «Guardar reglas». Cancelar no cambia nada. |
| REQ-009 | Las reglas se pueden cambiar y restablecer en cualquier estado del cliente y de su licencia: cliente activo o dado de baja; sin licencia, o con licencia activa, suspendida, caducada o revocada. Si en el momento de confirmar el agente del cliente no recibiría instrucciones (cliente de baja, sin licencia vigente o en pausa efectiva según la función 023), el diálogo lo dice: las reglas se guardan y el agente las recibirá cuando vuelva a recibir instrucciones. |
| REQ-010 | Si no hay ninguna regla con un valor distinto del guardado, no se abre el diálogo, no se envía ningún cambio y se dice que no hay cambios que guardar. |
| REQ-011 | Tras un cambio con éxito, la sección muestra los valores leídos de nuevo del estado guardado, no los tecleados, la palabra de REQ-003 actualizada y el cambio en el historial de reglas. |

### Volver a los valores por defecto

| ID | Requisito |
| --- | --- |
| REQ-012 | Un superadmin puede devolver a un cliente a los valores por defecto con la acción «Restablecer valores por defecto», que guarda los valores por defecto como reglas del cliente. Pide confirmación en un diálogo con el mismo contenido que REQ-008 (qué reglas cambian, de qué valor a cuál, a qué cliente, cuándo lo notará el agente) y botón «Restablecer valores por defecto». Después, la sección dice que las reglas coinciden con los valores por defecto. |

### Historial de reglas en la ficha

| ID | Requisito |
| --- | --- |
| REQ-050 | La sección muestra el historial de reglas del cliente: una fila por cada acción de esta función sobre él, con quién la hizo, cuándo, si cambió o restableció las reglas, y qué reglas cambiaron, por su nombre visible. No muestra ningún valor, ni anterior ni nuevo. |
| REQ-051 | Quién se muestra como en la página de auditoría de la función 024: el correo de la cuenta y, si la cuenta está dada de baja, la marca «dado de baja». Cuándo se muestra con el formato de fecha de la función 020 y hora de Madrid. |
| REQ-052 | El historial se ordena de la más reciente a la más antigua y se pagina con el componente de la función 020, de 25 en 25, indicando la posición. Pasar de página no repite ni omite filas, aunque se registren cambios mientras se navega. |
| REQ-053 | El historial sale de la auditoría y coincide con ella: contiene todas las filas de las dos acciones de esta función sobre ese cliente y ninguna otra. Una acción que el panel ha dado por hecha aparece en el historial en la primera carga posterior. Consultarlo no deja fila de auditoría. |

### Qué recibe el agente y cuándo

| ID | Requisito |
| --- | --- |
| REQ-013 | Toda petición de instrucciones del agente del cliente que empiece después de que el panel confirme un cambio o un restablecimiento y que reciba el estado `activa` lleva las cinco reglas con los valores nuevos. |
| REQ-014 | El cambio no llega al agente por ninguna otra vía ni altera una revisión que ya haya recibido sus instrucciones: el agente solo lo recibe en su siguiente revisión. |
| REQ-015 | Cambiar o restablecer las reglas de un cliente no cambia el estado servido, la versión, el prompt, la orden ni el canal de ese cliente, ni nada de lo que reciben los agentes de los demás clientes. |
| REQ-016 | Mientras el agente del cliente recibe `pausada` o `suspendida`, no recibe reglas. Cuando vuelve a recibir `activa`, recibe las reglas guardadas en ese momento, con los cambios hechos mientras tanto. |

### Permisos y aislamiento

| ID | Requisito |
| --- | --- |
| REQ-017 | Solo un superadmin con doble factor verificado en su sesión puede ver las reglas y el historial de reglas de un cliente o ejecutar las acciones de esta función. La autorización se decide en el servidor y en la base de datos, con independencia de lo que muestre la interfaz (artículo 3). |
| REQ-018 | Las reglas y el historial se leen y se escriben con la sesión del usuario. Ninguna lectura ni escritura de esta función usa la clave secreta (amenaza A-10). |
| REQ-019 | El identificador del cliente en la petición o en la dirección solo elige la ficha sobre la que se actúa y nunca concede permiso, como fija el requisito 74 de la función 022. Una acción solo cambia las reglas del cliente elegido, el historial solo muestra las filas de ese cliente, y nadie puede cambiar a qué cliente pertenecen unas reglas guardadas. |
| REQ-020 | La base de datos garantiza, con independencia de la interfaz y del servidor, que solo existen las cinco reglas, cada una con un valor de su tipo y dentro de su rango, y ninguna columna o valor de texto libre. |

### Cierre en fallo, atomicidad y auditoría

| ID | Requisito |
| --- | --- |
| REQ-021 | Cada acción («Guardar reglas» o «Restablecer valores por defecto») se aplica entera, junto con su fila de auditoría, o no se aplica nada. |
| REQ-022 | Cada acción con éxito deja exactamente una fila principal de auditoría con quién, qué acción, tipo de objeto «Reglas del cliente», de qué cliente, cuándo y qué reglas cambiaron. Las reglas cambiadas se anotan con valores de la lista cerrada de las cinco reglas, sin sus valores ni anteriores ni nuevos. Las acciones son dos entradas nuevas del inventario de la función 024, con estos nombres del dominio propuestos: «Cambió las reglas de un cliente» y «Restableció las reglas de un cliente a los valores por defecto». |
| REQ-023 | Todo cambio de las reglas de un cliente que la base de datos acepte, también por escritura directa con la sesión de un superadmin, deja su fila de auditoría con las reglas que cambiaron. |
| REQ-024 | Si el panel no recibe respuesta de una acción (tiempo agotado, red caída), no la da por hecha ni por fallida: lo dice así, vuelve a leer las reglas guardadas antes de permitir repetirla y conserva lo elegido en el formulario. |
| REQ-025 | Los mensajes de error dicen qué ha pasado y qué se puede hacer, sin datos internos, identificadores técnicos ni valores recibidos. |

### Experiencia (puerta P5)

| ID | Requisito |
| --- | --- |
| REQ-026 | La sección, el formulario de cambio, el historial y los dos diálogos cumplen WCAG 2.2 AA con los componentes de la función 020: cada regla tiene etiqueta visible, su valor y su estado (Sí o No) se anuncian con lector de pantalla, los errores aparecen junto al campo y se anuncian, el cambio de página del historial se anuncia y todo se maneja con teclado. |
| REQ-027 | Todo se puede ver y hacer en un móvil de 320 píxeles de ancho, sin desplazamiento horizontal de página. |
| REQ-028 | Los valores de las reglas y el historial tienen, cada uno, los cinco estados de la función 020: carga; vacío; error con reintento; sin permiso; y datos parciales (si falla uno de los dos o el resto de la ficha, lo demás se muestra y la parte que falla lo dice). En el historial, el vacío dice que las reglas no han cambiado desde el alta. En los valores, el vacío es un dato incoherente (un cliente sin reglas, que REQ-049 impide): se dice con palabra que no se pueden mostrar las reglas, sin mostrar los valores por defecto en su lugar. |
| REQ-029 | Los textos están en español de España, con trato de tú; las fechas, con el formato de la función 020 y hora de Madrid. |
| REQ-030 | Con 1.000 clientes y un cliente con 500 cambios de reglas, abrir la sección de reglas de una ficha, recorrer las páginas de su historial, guardar un cambio y restablecer los valores por defecto muestran su resultado en menos de 2 segundos en el percentil 95, medidos en el entorno previo. |

## Casos negativos

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-031 | Petición sin sesión, o con sesión de superadmin sin doble factor verificado | No se lee ninguna regla ni fila del historial, ni se aplica ningún cambio; la base de datos tampoco devuelve filas ni acepta escrituras. Se pide iniciar sesión o verificar el doble factor (función 021) |
| REQ-032 | Usuario con sesión que no es administrador, incluido un usuario de un cliente, también sobre su propio cliente | Ni sección, ni historial, ni datos, ni acciones de esta función. Se muestra «sin permiso» sin revelar si el cliente existe |
| REQ-033 | El superadmin pierde el rol o el doble factor entre abrir el diálogo y confirmarlo | La acción se rechaza sin cambios ni fila de auditoría |
| REQ-034 | Máximo de correos o ventana de días vacío, cero, negativo, por encima de su máximo (101, 15), decimal (con coma o con punto), en notación con exponente, con texto o con espacios intercalados | Se rechaza con el error junto al campo; no se guarda ninguna regla de esa acción |
| REQ-035 | Valor de una regla booleana que no es Sí ni No en la petición: texto («true», «sí»), número (1, 0), nulo o ausente cuando la acción dice cambiarla | Se rechaza; no se guarda ninguna regla de esa acción |
| REQ-036 | Formulario o petición con campos de más: otro cliente, una regla inventada (por ejemplo, «enviar_correos»), una nota, un motivo, una fecha, un autor, la lista de reglas cambiadas, el canal o el estado | Se ignoran: no cambian nada, no se guardan, no llegan nunca al agente ni a la auditoría y sus valores no se registran. Las reglas cambiadas que anota la auditoría son las que realmente cambiaron |
| REQ-037 | Escritura directa en la base de datos con la sesión de un superadmin: valor fuera de rango, de otro tipo o nulo; regla nueva o campo de texto; cambio del cliente al que pertenecen unas reglas; borrado de las reglas de un cliente; alta de un cliente sin reglas | Se rechaza en la base de datos; los datos quedan como estaban |
| REQ-038 | Identificador de cliente manipulado en la petición: de un cliente inexistente o con formato inválido | Se rechaza sin cambios y sin filas de historial, con el mismo mensaje para «no existe» y «sin permiso» |
| REQ-039 | Dos superadmin cambian o restablecen a la vez las reglas del mismo cliente | La acción hecha sobre valores desactualizados se rechaza y se le muestran los valores guardados; la otra no se pierde; nunca queda una mezcla de los dos cambios que ninguno confirmó |
| REQ-040 | Doble clic, Intro repetido o reenvío de la misma acción | Se aplica una sola vez y deja una sola fila de auditoría |
| REQ-041 | Restablecer un cliente cuyas reglas ya coinciden con los valores por defecto, o repetir un cambio cuyos valores ya están guardados | No cambia nada, no se añade fila de auditoría ni de historial y se informa de que ya estaba así |
| REQ-042 | La base de datos falla o deja de responder a mitad de una acción | No queda ninguna regla cambiada a medias ni fila de auditoría sin su cambio; no se muestra éxito; reintentar no duplica |
| REQ-043 | No se puede escribir la fila de auditoría de una acción | La acción no se aplica y el panel lo dice |
| REQ-044 | No se pueden leer las reglas o el historial de un cliente en el panel (error, red caída, respuesta mal formada) | Estado de error con reintento en la parte que falla. Nunca se muestran los valores por defecto como si fueran los del cliente, ni datos de una carga anterior como actuales, ni se permite guardar sobre ellos |
| REQ-045 | Al servir instrucciones, las reglas del cliente no se pueden leer o no existen | El agente no recibe el estado `activa` ni los valores por defecto en lugar de las reglas del cliente (artículo 3) |
| REQ-046 | Acción de esta función enviada desde otro sitio, o la ficha cargada dentro de otra página | Se rechaza o se impide (amenaza A-21) |
| REQ-047 | Cambiar o restablecer las reglas de un cliente dado de baja, sin licencia o con la licencia suspendida, caducada o revocada | Se admite, con el aviso de REQ-009, y deja su fila de auditoría. El agente de ese cliente no recibe reglas mientras no reciba `activa` (REQ-016) |
| REQ-048 | Petición que lleva a la vez un valor válido y uno inválido | Se rechaza entera; ninguna regla cambia |
| REQ-054 | El alta de un cliente falla a mitad, también al guardar sus reglas | No queda ni cliente sin reglas ni reglas sin cliente |

## Criterios de aceptación

Las pruebas de base de datos se ejecutan en CI (no hay Docker en la máquina de desarrollo) y no se anotan como superadas en local. Las pruebas con agente de prueba necesitan el conector de la fase 2 desplegado en el entorno de desarrollo. «Juego de prueba» quiere decir datos ficticios preparados para la prueba.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Una prueba de extremo a extremo abre la ficha de un cliente con reglas distintas de las de por defecto y encuentra las cinco reglas con su nombre visible, su valor y su unidad o palabra (5 de 5) y su explicación de efecto (5 de 5); una revisión de las cinco explicaciones frente a los requisitos 4 a 8 de la función 012 da 0 contradicciones | REQ-001, REQ-002 |
| CA-002 | En un juego de prueba con 10 clientes cuyas reglas coinciden con los valores por defecto y 10 con alguna regla distinta: los 10 primeros muestran 30, 3, Sí, Sí, Sí y la palabra de valores por defecto (10 de 10); los otros 10 muestran sus valores y la otra palabra (10 de 10); la palabra está presente como texto. Una revisión de la interfaz y de las acciones de esta función encuentra 0 vías de cambiar los valores por defecto | REQ-003, REQ-004 |
| CA-003 | Con agente de prueba, para 20 clientes con licencia vigente y sin pausa (10 con los valores por defecto y 10 con reglas cambiadas): las reglas que recibe cada agente en su revisión coinciden con las que muestra su ficha en el mismo momento en el 100 % de los casos y validan contra `contratos/obtener-instrucciones.schema.json` | REQ-005 |
| CA-004 | Con agente de prueba: se cambia 1 regla, después 3 y después las 5, cada vez con confirmación. La primera revisión que empieza después de cada confirmación recibe exactamente los valores nuevos y los no cambiados intactos, en 10 de 10 repeticiones de cada caso; tras cada cambio, la sección muestra los valores releídos y el historial la fila nueva | REQ-006, REQ-011, REQ-013 |
| CA-005 | Revisión del diálogo con cambios de 1, 3 y 5 reglas: enumera solo las que cambian, cada una con su valor actual y el nuevo en palabras, nombra al cliente, dice que se aplicará en la siguiente revisión, que la revisión ya empezada sigue con las anteriores y que se puede volver a cambiar; el botón dice «Guardar reglas» (3 de 3). Cancelar deja 0 cambios y 0 filas de auditoría. Pulsar «Guardar reglas» sin ninguna diferencia no abre el diálogo, envía 0 peticiones de cambio y dice que no hay cambios | REQ-008, REQ-010 |
| CA-006 | Para un cliente activo con licencia vigente y sin pausa, uno dado de baja, uno sin licencia, uno con licencia suspendida, uno con licencia caducada, uno con licencia revocada y uno en pausa efectiva: cambiar y restablecer se admiten en los 7 casos (14 de 14) y dejan su fila de auditoría; el diálogo avisa de que el agente las recibirá cuando vuelva a recibir instrucciones en los 6 casos en que no las recibiría ahora y no lo dice en el primero (7 de 7) | REQ-009, REQ-047 |
| CA-007 | Con agente de prueba: un cliente con las 5 reglas distintas de las de por defecto se restablece con confirmación; el diálogo enumera los 5 cambios; la sección muestra 30, 3, Sí, Sí, Sí y la palabra de valores por defecto; la siguiente revisión recibe esos valores. 10 de 10 repeticiones correctas | REQ-012 |
| CA-008 | Con agente de prueba: el agente recibe sus instrucciones, se cambian las reglas a mitad de su revisión y la revisión termina. Esa revisión no recibe nada nuevo por ninguna vía (0 mensajes) y su informe es coherente con las reglas que recibió al empezar; la revisión siguiente recibe las nuevas. 5 de 5 repeticiones | REQ-014 |
| CA-009 | Pruebas automáticas con los clientes A y B: tras cambiar y restablecer las reglas de A, la respuesta a la petición de instrucciones de A es idéntica a la anterior salvo en las reglas (estado, versión, huella, prompt, orden y canal iguales), y la de B es idéntica por completo, en el 100 % de 20 repeticiones | REQ-015 |
| CA-010 | Con agente de prueba: con el cliente en pausa efectiva y con la licencia suspendida, se cambian las reglas; las revisiones siguientes reciben `pausada` o `suspendida` sin reglas (100 %); con el cliente dado de baja, 0 revisiones reciben reglas; al reanudar o reactivar la licencia, la primera revisión con `activa` recibe las reglas cambiadas (2 de 2 casos) [Enmienda mecánica 22/11/2026, D-040] | REQ-016, REQ-047 |
| CA-011 | Pruebas de base de datos en CI y de extremo a extremo con 5 sesiones (sin sesión, usuario sin rol, usuario de un cliente sobre su propio cliente y sobre otro, superadmin sin doble factor): 0 filas de reglas y 0 filas de historial leídas, el 100 % de las escrituras rechazadas, y «sin permiso» o paso de inicio de sesión o de doble factor en la sección, el historial y las acciones. Una acción cuya sesión pierde el rol o el doble factor antes de confirmar se rechaza con 0 cambios y 0 filas de auditoría (2 de 2). Control positivo: con superadmin con doble factor, leer y cambiar funcionan | REQ-017, REQ-031, REQ-032, REQ-033 |
| CA-012 | La revisión del código y una comprobación automática confirman que ninguna pieza de esta función usa la clave secreta; las pruebas de integración de esta función pasan con la clave secreta ausente del entorno de esas operaciones | REQ-018 |
| CA-013 | Peticiones con el identificador de un cliente inexistente y con uno de formato inválido se rechazan con 0 cambios, 0 filas de historial y el mismo mensaje que «sin permiso» (100 %); con superadmin con doble factor, cambiar el identificador en la dirección solo cambia la ficha mostrada, una acción solo cambia las reglas del cliente elegido (0 cambios en los demás clientes del juego de prueba) y el historial de cada ficha contiene 0 filas de otros clientes | REQ-019, REQ-038 |
| CA-014 | Pruebas de base de datos en CI con sesión de superadmin: escribir cada regla con un valor por debajo y por encima de su rango, con otro tipo y nulo; añadir una regla o un campo de texto; cambiar el cliente de unas reglas guardadas; borrar las reglas de un cliente; y dar de alta un cliente sin reglas: 100 % rechazados y datos sin cambios. Una consulta al catálogo encuentra 0 columnas de texto libre en los datos de reglas | REQ-020, REQ-037 |
| CA-015 | Con fallos provocados de la base de datos en cada paso de las 2 acciones, con la escritura de la fila de auditoría forzada a fallar y con respuestas que no llegan: 0 reglas cambiadas a medias, 0 filas de auditoría sin su cambio, 0 cambios sin su fila, 0 éxitos mostrados; sin respuesta, el panel dice que no sabe si se aplicó, relee las reglas guardadas y conserva lo elegido; reintentar no duplica | REQ-021, REQ-024, REQ-042, REQ-043 |
| CA-016 | Cada una de las 2 acciones, ejecutada por 2 superadmin distintos sobre 2 clientes y cambiando 1, 3 y 5 reglas, deja exactamente 1 fila principal con el actor de la sesión, la acción con su nombre del dominio, el tipo «Reglas del cliente», el cliente, el momento y exactamente las reglas que cambiaron, ni una más ni una menos; la búsqueda de los valores anteriores y nuevos en la fila da 0 apariciones (100 % de los casos). Pruebas de base de datos: cada escritura directa de reglas aceptada con sesión de superadmin deja su fila con las reglas que cambiaron (0 escrituras aceptadas sin fila) | REQ-022, REQ-023 |
| CA-017 | Una revisión de todos los mensajes de error de esta función no encuentra datos internos, identificadores técnicos ni valores recibidos (0 hallazgos) | REQ-025 |
| CA-018 | El análisis automático de accesibilidad da 0 incumplimientos de nivel A y AA en la sección, el formulario, el historial y los dos diálogos, en todos sus estados; la revisión manual con teclado y lector de pantalla no deja hallazgos bloqueantes y confirma que se anuncian el valor de cada regla, el Sí o No de las booleanas, los errores junto al campo y el cambio de página del historial | REQ-026 |
| CA-019 | Con 320 píxeles de ancho, la sección, el formulario, el historial y los dos diálogos se usan sin desplazamiento horizontal de página y con todas las acciones disponibles; capturas en el informe de la puerta P5 | REQ-027 |
| CA-020 | Hay captura de los 5 estados de los valores y de los 5 del historial. El historial de un cliente sin cambios dice que las reglas no han cambiado desde el alta. Con un cliente sin reglas preparado en el juego de prueba saltándose las restricciones, la sección dice que no se pueden mostrar las reglas y muestra 0 veces los valores por defecto. Con la lectura de las reglas y la del historial forzadas a fallar (error, red caída, respuesta mal formada): el 100 % de los casos muestra el error con reintento en la parte que falla, 0 veces los valores por defecto, 0 datos de una carga anterior como actuales y 0 acciones de guardar disponibles sobre valores no leídos; el resto de la ficha se muestra | REQ-028, REQ-044 |
| CA-021 | Una revisión de textos no encuentra inglés, trato de usted ni fechas o números con otro formato (0 hallazgos) | REQ-029 |
| CA-022 | En el entorno previo, con 1.000 clientes y un cliente con 500 cambios de reglas, 200 mediciones de cada operación (abrir la sección, cambiar de página del historial hasta la última, guardar un cambio, restablecer) dan un percentil 95 menor de 2 segundos | REQ-030 |
| CA-023 | Una batería de valores inválidos para cada regla entera (vacío, 0, −1, 101 o 15, 2,5, 2.5, 1e2, texto, «3 0») se rechaza al 100 % con el error junto al campo y 0 reglas guardadas; una petición con un valor válido y uno inválido se rechaza entera (0 reglas cambiadas); los valores límite 1 y 100, y 1 y 14, se aceptan (4 de 4) | REQ-007, REQ-034, REQ-048 |
| CA-024 | Para cada regla booleana, una petición con «true», «sí», 1, 0, nulo y ausente cuando dice cambiarla se rechaza al 100 % con 0 reglas guardadas | REQ-035 |
| CA-025 | Para cada acción, una petición con 8 campos de más (otro cliente, «enviar_correos», nota, motivo, fecha, autor, lista de reglas cambiadas falsa, canal) no cambia nada fuera de las cinco reglas del cliente elegido; la siguiente revisión del agente de prueba recibe exactamente las cinco claves del contrato; la fila de auditoría anota las reglas que realmente cambiaron; los registros contienen 0 de los valores enviados en esos campos | REQ-036 |
| CA-026 | En 20 repeticiones de dos cambios simultáneos sobre el mismo cliente, y de un cambio y un restablecimiento simultáneos: 0 mezclas de valores que nadie confirmó, 0 cambios perdidos sin aviso; quien llega tarde ve los valores guardados y un aviso | REQ-039 |
| CA-027 | Dos envíos de la misma acción separados por menos de 100 milisegundos aplican 1 solo cambio y dejan 1 sola fila de auditoría, en 10 de 10 repeticiones de cada acción | REQ-040 |
| CA-028 | Restablecer un cliente cuyas reglas ya coinciden con los valores por defecto y repetir un cambio ya guardado: 0 cambios, 0 filas de auditoría nuevas, 0 filas nuevas en el historial y aviso de que ya estaba así (2 de 2) | REQ-041 |
| CA-029 | Pruebas en CI sobre el conector de la fase 2: con la lectura de las reglas del cliente forzada a fallar, y con un cliente sin reglas preparado saltándose las restricciones, el 100 % de las peticiones de instrucciones no responde `activa` y 0 entregan valores por defecto | REQ-045 |
| CA-030 | Una acción de esta función enviada desde otro origen se rechaza y la ficha no se carga dentro de otra página (2 de 2) | REQ-046 |
| CA-031 | Revisión de la interfaz y del formulario: 0 campos de texto libre; las dos reglas enteras solo admiten números y las tres booleanas solo Sí o No | REQ-007 |
| CA-032 | 20 altas de cliente válidas dejan 20 clientes con reglas 30, 3, Sí, Sí, Sí (20 de 20) y la sección de cada uno dice que coinciden con los valores por defecto. Con fallos provocados en cada paso del alta, incluido el guardado de las reglas: 0 clientes sin reglas y 0 reglas sin cliente. Consulta en la base de datos del juego de prueba completo: 0 clientes sin reglas | REQ-049, REQ-054 |
| CA-033 | Con un juego de prueba de 3 cambios y 1 restablecimiento hechos por un administrador activo y por uno dado de baja: el historial muestra 4 filas con el correo de quien lo hizo y, en el dado de baja, la marca «dado de baja»; la fecha con el formato de la función 020 en hora de Madrid; si cambió o restableció; y exactamente las reglas que cambiaron por su nombre visible (4 de 4). Los valores anteriores y nuevos aparecen 0 veces en el historial y en sus respuestas | REQ-050, REQ-051 |
| CA-034 | Con un cliente con 60 cambios: el historial muestra 25, 25 y 10 filas, de la más reciente a la más antigua, con la posición indicada; recorrer las 3 páginas da las 60 con 0 duplicados y 0 omisiones; con 5 cambios nuevos hechos durante el recorrido, el recorrido iniciado sigue con 0 duplicados y 0 omisiones y los nuevos aparecen al volver a la primera página | REQ-052 |
| CA-035 | Con un juego de prueba con filas de auditoría de 10 acciones distintas sobre el mismo cliente y de las dos acciones de esta función sobre otros 3 clientes: el historial del cliente coincide con las filas de auditoría de las dos acciones de esta función sobre él (0 diferencias) y contiene 0 filas de otras acciones o de otros clientes. 20 cambios seguidos, cada uno seguido de cargar la ficha: 20 de 20 presentes en esa primera carga. 50 consultas del historial: 0 filas de auditoría nuevas | REQ-053 |

## Fuera de alcance

- Que el propio cliente vea o edite sus reglas desde su dashboard: fase 5. Según las funciones 040 y 041, su panel es de solo lectura y no muestra las reglas.
- Reglas nuevas o cambios en las cinco existentes (otra regla, otro rango, otro tipo, la frecuencia entre las reglas): exigen especificación aprobada y cambio de contrato. Esta función no añade ninguna.
- Cambiar los valores por defecto desde el panel. Son los de «Términos» y solo cambian con una especificación aprobada y un despliegue revisado; cambiarlos no toca las reglas ya guardadas de ningún cliente.
- Valores anteriores y nuevos en la auditoría o en el historial: no se guardan ni se muestran.
- El canal del cliente y su cambio: fase 4 (función 030).
- Cambiar reglas de varios clientes a la vez.
- Saber desde el panel si el agente ya ha recibido las reglas nuevas, o con qué reglas trabajó en cada revisión.
- Cómo usa el agente cada regla y el texto del prompt que la aplica: función 012.
- Cómo entrega el conector las reglas y qué responde cuando no puede leerlas: función 011. Esta función solo exige el resultado de REQ-013 a REQ-016 y REQ-045.
- Página de auditoría y comprobación de cobertura completa: función 024. Aquí solo se exige que las dos acciones dejen su fila, que entren en su inventario y que el historial de la ficha coincida con ella.
- Formulario de alta de cliente: función 022. Esta función solo exige que el alta guarde las reglas por defecto (REQ-049).
- Componentes, armazón y estados: función 020. Inicio de sesión y doble factor: función 021.
- Plazos de conservación y borrado de las reglas de un cliente dado de baja: fase 6 (función 052).

## Cuestiones abiertas

**Las 5 cuestiones están resueltas por el responsable el 13/11/2026** (detalle en `aclaraciones.md`): 1, las reglas se editan siempre, en cualquier estado del cliente y de su licencia, con aviso en el diálogo cuando el agente no las recibirá todavía (REQ-009, REQ-047); 2 y 3, todo cliente nace con sus reglas guardadas con 30 correos, 3 días y las tres opciones en Sí, «Restablecer» vuelve a guardar esos valores y desaparece el caso «cliente sin reglas guardadas» (REQ-004, REQ-012, REQ-049); 4, la fila de auditoría dice qué reglas cambiaron, de lista cerrada, sin valores (REQ-022); 5, la ficha muestra la lista de cambios de reglas del cliente: quién, cuándo y qué reglas, sin valores, paginada (REQ-050 a REQ-053).

Texto original:

1. **Clientes de baja o sin licencia vigente.** ¿Se pueden cambiar o restablecer sus reglas? Opciones: (a) sí, siempre, con el aviso de REQ-009: permite dejar listo a un cliente antes de instalarlo o de reactivarlo; (b) sí, salvo si está dado de baja, que solo se ve en lectura: evita tocar clientes que ya no lo son, pero hay que reactivarlo antes de ajustarlo; (c) solo con licencia vigente: más restrictivo, pero obliga a crear la licencia antes de preparar la instalación. Afecta a REQ-009, REQ-047 y CA-031.
2. **Valores por defecto.** El modelo de referencia, en PROPUESTA, propone 30 correos por revisión, 3 días y las tres booleanas en Sí. ¿Se confirman o se fijan otros? Son los que reciben todos los clientes sin reglas guardadas; con las tres booleanas en Sí, un cliente recién instalado guarda adjuntos, prepara borradores y abre enlaces de facturas sin que nadie lo haya revisado.
3. **Qué hace «Restablecer valores por defecto» y si existe el cliente sin reglas guardadas.** Opciones: (a) quita las reglas guardadas: el cliente vuelve a «sin reglas guardadas» y, si un despliegue cambia algún día los valores por defecto, su agente recibe los nuevos sin que nadie toque su ficha; (b) guarda como reglas del cliente los valores por defecto de ese momento: quedan fijas aunque cambien los de por defecto; (c) como (b), y además todo cliente nace con sus reglas guardadas al darlo de alta, de modo que «sin reglas guardadas» deja de existir: es la recomendación del orquestador para la cuestión 15 de la función 011, todavía sin respuesta. Con (c), REQ-003, REQ-028 y REQ-045 se reescriben, y la palabra visible pasa a decir si los valores coinciden con los de por defecto.
4. **Qué dice la fila de auditoría.** Opciones: (a) solo que cambiaron las reglas del cliente, como fija el requisito 29 de la función 024; (b) además, qué reglas cambiaron (nombres de la lista cerrada), sin valores; (c) además, los valores anterior y nuevo, que son enteros y booleanos sin datos personales. (b) y (c) ayudan a seguir un incidente, pero exigen cambiar el requisito 29 de la función 024 y la auditoría de la fase 2.
5. **Historial en la ficha.** Opciones: (a) la ficha no muestra historial; se consulta en la página «Auditoría» filtrando por el cliente; (b) la sección muestra la fecha del último cambio y quién lo hizo; (c) la sección muestra la lista de cambios. (b) responde «¿quién tocó esto?» sin salir de la ficha con poco coste; (c) duplica la página de auditoría y su prueba de rendimiento.

## Dependencias y decisiones relacionadas

- **Constitución:** artículos 1 (enteros acotados y booleanos, sin texto libre), 2 (aislamiento: requisito 74 de la función 022 y su nota aclaratoria del artículo 2), 3 (cierre en fallo: REQ-044 y REQ-045), 4, 6, 7 (campos de más), 10, 12 y 13.
- **Decisiones:** D-008 (reglas por cliente de lista cerrada), T-004 y T-005 (clave secreta solo en el servidor y patrón de aislamiento), V-108 (doble factor exigido en las políticas, fase 2), V-110 (librería de interfaz, fase 3). Decisiones del responsable del 13/11/2026: crear esta función (cuestión 1 de la función 022) y las cinco respuestas de `aclaraciones.md`; se pasan a coordinación para `docs/TECNOLOGIAS.md`.
- **Contrato:** `contratos/obtener-instrucciones.schema.json`, objeto `reglas`: cinco claves obligatorias, con los rangos de esta especificación y sin propiedades adicionales. Esta función no lo cambia.
- **Amenazas:** A-10, A-11 y A-21 de `docs/SEGURIDAD.md`.
- **Funciones de la fase 3:**
  - 020: componentes de diálogo, formulario, tabla, paginación, estados y formatos.
  - 021: sesión con doble factor.
  - 022: ficha de cliente y sitio de la sección (requisito 7), estados de baja y licencia, regla de repeticiones, cambios simultáneos y atomicidad que esta función sigue. **Cambio que se le pide por coordinación:** el alta de cliente (requisito 8 de la 022) guarda también las reglas con los valores por defecto, en la misma acción (REQ-049, REQ-054); el formulario de alta no gana campos. Su criterio 4 comprueba que la ficha no muestra valores de reglas; con esta función la sección sí los muestra, y ese criterio se entiende limitado al alcance de la 022.
  - 023: pausa efectiva (REQ-009, CA-006, CA-010).
  - 024: las dos acciones de REQ-022 entran en su inventario antes de su puerta P1, como prevé esa función; el historial de REQ-050 a REQ-053 se lee de su auditoría y muestra a los actores como su requisito 16. Se pide por coordinación (ver deducciones).
- **Se supone de la fase 2:** datos de reglas por cliente con aislamiento en la base de datos, con los tipos y rangos de REQ-020 garantizados en ella; ningún cliente sin reglas y ningún borrado de reglas (REQ-037, REQ-049); lectura y escritura solo para superadmin con doble factor; auditoría de solo inserción con acción del dominio y con las reglas cambiadas de lista cerrada; el conector entrega las reglas guardadas en cada revisión con `activa` (requisitos 8 y 11 de la función 011) y no responde `activa` si no puede leerlas o no existen (requisito 24 de la función 011 y REQ-045). La respuesta a las cuestiones 2 y 3 coincide con la recomendación pendiente de la cuestión 15 de la función 011 (cliente sin reglas como dato incoherente; reglas creadas al crear el cliente); se pasa a ese chat por coordinación.
- **Función 012:** el agente aplica las reglas recibidas (sus requisitos 4 a 8 y 14) y ninguna regla relaja los límites del arranque local (su requisito 25). Sus cuestiones abiertas 6 (frecuencia entre las reglas) y 22 (facturas por enlace, que podría retirarse) pueden cambiar el conjunto de las cinco reglas; si cambia, esta especificación se revisa.
- **Deducciones del `especificador` que el responsable debe ver** (no son decisiones suyas):
  1. La fila de auditoría con las reglas cambiadas no lleva valores, pero añade un dato que no está en la lista cerrada de contenido del requisito 29 de la función 024 (ni en lo que devuelve su página, requisito 31). Esa lista se amplía con «reglas cambiadas, de lista cerrada»; se pide por coordinación.
  2. Por el requisito 18 de la función 024, si el alta de cliente guarda también sus reglas, el alta cambia un segundo objeto y debería dejar una fila vinculada a «Dio de alta un cliente», con una entrada nueva del inventario. Hay que decidir si se añade o si las reglas iniciales se consideran parte del cliente. Esta especificación no incluye el alta en el historial de reglas.
  3. «Y eso se ve», para un cliente con los valores por defecto, queda como la palabra de REQ-003: dice si las cinco reglas guardadas coinciden con los valores por defecto. Es la consecuencia anotada en la opción elegida de la cuestión 3.
  4. Los clientes que existan antes de esta función (datos ficticios de la función 010 y clientes migrados desde la carpeta `panel` en la función 053) también tienen que tener sus reglas guardadas, para cumplir REQ-049.
- **Modelo de referencia:** `docs/MODELO-DATOS.sql`, en estado PROPUESTA. Esta especificación no lo toma como solución.

## Registro de cambios

| Fecha | Quién | Cambio | Motivo |
| --- | --- | --- | --- |
| 22/11/2026 | `arquitecto`, enmienda mecánica | CA-010: se quita «reactivar el cliente»; queda «al reanudar o reactivar la licencia» y «2 de 2 casos». Se mantiene que con el cliente dado de baja 0 revisiones reciben reglas | D-040 (A-10): la baja es definitiva (REQ-011 de la 022); P-50 de la 022 y P24-13 de la 024. No cambia ningún requisito |
| 22/11/2026 | `arquitecto` | Estado DISEÑADA, con `diseno.md` puesto al día con D-040 y la constitución 1.5 | Paso 3 del ciclo |

Pendiente, no aplicada: E-1 (texto del aviso de REQ-009 y CA-006 para un cliente dado de baja, que ya no volverá a recibir instrucciones), pedida al `especificador` en `propuestas.md`, P25-01.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 13/11/2026 | Responsable | Aprobada (puerta P0). Respuesta expresa en el diálogo de preguntas del chat de la fase 3: «Apruebo la 025» |
