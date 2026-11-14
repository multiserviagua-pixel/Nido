# 041 · Resumen y actividad del agente en el panel de cliente

Estado: PROPUESTA
Fase: 5 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Hoy el cliente no tiene forma de saber, sin preguntar a HumanaIA, si su agente de correo está funcionando. Esta función le da dos páginas en su panel: el **Resumen**, que responde «¿mi agente funciona y qué ha hecho últimamente?», y la **Actividad**, con el histórico de cifras revisión a revisión. Las dos son de solo lectura, muestran solo cifras y estados (nunca contenido de correo) y dicen la verdad: si no hay datos suficientes o no se ha podido comprobar algo, lo dicen.

Esta función fija además qué datos puede recibir la sesión de un usuario de cliente en estas vistas, como lista cerrada, y lleva el peso de la prueba de extremo a extremo de que un usuario no obtiene nada de otro cliente ni datos internos, tampoco pidiéndolos directamente a la API de datos.

Da por hecho que el usuario ya ha entrado y está vinculado a un cliente (función 040). La página Suscripción y el aviso de pago pendiente, también cuando se muestra en el Resumen, son de la función 042.

## Quién la usa y cómo

- Como **usuario de un cliente**, quiero ver de un vistazo en qué estado está mi agente y cuándo revisó por última vez, para saber si puedo confiar en que mi correo está atendido.
- Como **usuario de un cliente**, quiero ver qué ha hecho mi agente en el periodo (correos tratados, borradores, documentos), para valorar el servicio.
- Como **usuario de un cliente**, quiero consultar el histórico revisión a revisión, para ver cuándo hubo avisos o errores.
- Como **usuario de un cliente** cuyo agente tiene un problema, quiero que el panel me diga qué pasa y qué puedo hacer, sin jerga técnica.
- Como **responsable de HumanaIA**, quiero que esté demostrado que estas vistas no entregan nada de otro cliente ni datos internos, ni por la interfaz ni por la API de datos, para poder publicar el panel.

### Términos

| Término | Significado en esta especificación |
| --- | --- |
| Revisión | Una ejecución del agente de la que se ha recibido informe. Una ejecución abierta sin informe no es una revisión. |
| Fecha de una revisión | Momento en que se recibió su informe. |
| Estado servido | El estado (`activa`, `pausada` o `suspendida`) que el agente del cliente recibiría si pidiera sus instrucciones en ese momento, según las mismas reglas que aplica el conector (licencia, baja del cliente, orden de pausa propia, pausa general del servicio y existencia de una versión aplicable). |
| Frecuencia esperada | Cada cuántas horas debe revisar el agente de ese cliente, según la anota HumanaIA al instalarlo (`docs/INSTALACION-CLIENTE.md`, paso 7). |
| Cifras de actividad | `tratados`, `borradores` y `documentos`: lo que el agente hizo en una revisión. |
| Cifras de situación | `sin_tratar`, `facturas_pendientes` y `urgentes`: cómo estaba el correo al terminar una revisión (sujeto a la cuestión abierta 7). |
| Clientes A y B | Dos clientes ficticios, cada uno con al menos un usuario vinculado, usados en las pruebas de aislamiento. |

## Datos que puede recibir el usuario de cliente en estas vistas

Lista cerrada (constitución, artículo 3). Lo que la sesión de un usuario de cliente puede obtener en total es la unión de esta lista con las de las funciones 040 y 042; lo que no figura en ninguna de ellas no llega a su sesión, ni en lo que pinta la interfaz ni pidiéndolo directamente a la API de datos. Si el diseño necesita un dato más, se añade a esta lista con aprobación del responsable; no se da por incluido.

**A. Permitidos** (siempre de su propio cliente)

| Dato | Nota |
| --- | --- |
| Estado del agente | Solo el valor ya calculado de la lista cerrada de estados de esta especificación, no los datos con los que se calcula |
| Si hay una pausa o una reanudación pendiente de aplicar | Sí o no, y cuál de las dos |
| Fecha y hora de la última revisión | |
| Periodo mostrado | Fecha y hora de inicio y fin |
| Número de revisiones del periodo, total y por estado del informe | Estados `ok`, `aviso`, `error`, `pausado` |
| Cifras de actividad y de situación del periodo, agregadas según esta especificación | Las seis cifras del contrato; la cuestión abierta 1 puede retirar alguna |
| Por cada revisión: fecha y hora, estado del informe y sus seis cifras | Misma salvedad de la cuestión abierta 1 |
| Fecha de la revisión más antigua disponible y número total de revisiones disponibles | Para la paginación y para decir desde cuándo hay histórico |
| Momento en que se obtuvieron los datos mostrados | |

**B. Pendientes de decisión** (cuestiones abiertas 1, 2 y 5). No se entregan mientras el responsable no los pase expresamente a la lista A.

`modo`, `asistente`, `almacenamiento`, `version_prompt` y `frecuencia_horas` de cada informe; las cuatro `comprobaciones`; los códigos de `problemas` y su explicación en lenguaje llano; el motivo de una pausa o de una suspensión; el canal del cliente; la frecuencia esperada; la existencia de una revisión en curso.

**C. Prohibidos siempre**, aunque sean del propio cliente

- Texto del prompt, su huella, su commit, sus notas, el registro de versiones, las publicaciones y qué versión sirve cada canal.
- Conexiones, propias o ajenas, incluidos su número, sus fechas y su asistente; tokens; códigos de activación y de autorización; clientes OAuth.
- Ejecuciones como tales: sus identificadores, qué conexión las abrió, qué estado y qué versión se sirvieron.
- Datos de la licencia en bruto (estado, estado manual, caducidad) y de las órdenes en detalle (identificadores, quién las creó, fechas, estado de entrega o confirmación).
- Reglas del cliente, alertas, auditoría, ajustes globales (incluida la marca de pausa general), métricas por versión, el catálogo completo de problemas, el número de campos descartados y la versión del esquema de cada informe.
- Identificadores internos de administradores o de otros usuarios.
- Cualquier dato de otro cliente, también agregado.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo.

### Acceso, aislamiento y privacidad

| ID | Requisito |
| --- | --- |
| REQ-001 | Las páginas Resumen y Actividad, y cada petición de datos que hagan, solo devuelven datos a una sesión válida de un usuario con vinculación vigente a un cliente. El cliente se deriva de la sesión en el servidor y en la base de datos en cada petición; nunca de la dirección, de un parámetro, del cuerpo, de una cabecera ni de nada que envíe el navegador (constitución, artículo 2). |
| REQ-002 | Cada cifra, estado, fila y total de estas vistas corresponde a un único cliente, el derivado de la sesión. Ninguno mezcla datos de dos clientes, tampoco si un usuario llegara a estar vinculado a más de uno (función 040, cuestión abierta 3). |
| REQ-003 | Lo que la sesión de un usuario de cliente obtiene por estas vistas, o pidiéndolo directamente a la API de datos, se limita a la lista A de «Datos que puede recibir el usuario de cliente» y a las listas de las funciones 040 y 042. Ningún dato de las listas B o C llega a la sesión, ni pintado ni en las respuestas de datos que recibe el navegador. |
| REQ-004 | Un dato de la lista B solo se entrega después de que el responsable lo pase expresamente a la lista A. Hasta entonces se trata como prohibido. |
| REQ-005 | Las dos vistas son de solo lectura: no ofrecen ningún control que cambie datos del cliente o del agente (pausar, reanudar, cambiar reglas, marcar como visto) ni ningún campo de texto. Las únicas entradas del usuario son el periodo, si la cuestión abierta 3 lo admite, y la página, las dos con valores cerrados. Consultarlas no modifica ningún dato del cliente ni del agente. |
| REQ-006 | Todo lo que muestran es un entero acotado, un booleano, un valor de lista cerrada o una fecha. No muestran ningún texto procedente de un correo ni del agente (constitución, artículo 1; D-008). |
| REQ-007 | Las direcciones de estas vistas solo contienen, además de la ruta, el periodo y la página, con valores de sus listas cerradas. Nunca contienen identificadores de cliente, de revisión, de ejecución ni de orden. |

### Resumen: estado del agente

Lista cerrada de estados, en orden de prioridad (se muestra el primero que se cumple). Los textos son propuestas; el diseño puede pulirlos sin cambiar su significado. Qué estados se muestran y qué se dice en cada uno está sujeto a las cuestiones abiertas 4 y 5.

| Prioridad | Estado | Se cumple cuando | Texto propuesto |
| --- | --- | --- | --- |
| 1 | Suspendido | El estado servido es `suspendida` | «Tu agente está suspendido y no revisa tu correo.» |
| 2 | Pausa pendiente | El estado servido es `pausada` y el agente no ha pedido instrucciones desde que empezó a aplicarse la causa de la pausa | «Tu agente se detendrá en su siguiente revisión.» |
| 3 | En pausa | El estado servido es `pausada` y el agente ya ha pedido instrucciones desde entonces | «Tu agente está en pausa y no revisa tu correo.» |
| 4 | Sin revisiones todavía | El estado servido es `activa` y no hay ninguna revisión | «Tu agente todavía no ha hecho ninguna revisión.» |
| 5 | Sin señal | El estado servido es `activa` y la última revisión es más antigua que el umbral de REQ-012 | «Tu agente lleva más tiempo del previsto sin revisar.» |
| 6 | Reanudado | El estado servido es `activa` y la última revisión tiene estado `pausado` | «Tu agente se ha reanudado. Verás sus cifras cuando termine su próxima revisión.» |
| 7 | Con error | La última revisión tiene estado `error` | «Tu agente no pudo revisar tu correo en su última revisión.» |
| 8 | Con avisos | La última revisión tiene estado `aviso` | «Tu agente revisó tu correo, pero quedó algo sin hacer.» |
| 9 | Funcionando | La última revisión tiene estado `ok` | «Tu agente revisó tu correo sin incidencias.» |
| — | No se ha podido comprobar | No se han podido obtener o validar los datos necesarios para decidir el estado | «No hemos podido comprobar el estado de tu agente. Inténtalo de nuevo en unos minutos.» |

| ID | Requisito |
| --- | --- |
| REQ-008 | El Resumen muestra el estado del agente con la palabra o frase de la lista cerrada de estados y una frase que dice qué significa. El color y el icono lo acompañan; nunca lo sustituyen. |
| REQ-009 | El estado mostrado es coherente con el estado servido: si el agente recibiría `suspendida`, el Resumen dice «Suspendido»; si recibiría `pausada`, por cualquier causa (orden de pausa propia, pausa general del servicio o falta de una versión aplicable), dice «Pausa pendiente» o «En pausa». En ningún caso dice que el agente funciona cuando el estado servido no es `activa`. |
| REQ-010 | Si la causa de una pausa o de una reanudación es posterior a la última vez que el agente pidió instrucciones, el Resumen dice que se aplicará en su siguiente revisión y no la presenta como ya aplicada. |
| REQ-011 | Con estado servido `activa`, el estado se decide por la existencia, la antigüedad y el estado del informe de la última revisión, según la tabla de estados. |
| REQ-012 | «Sin señal» se muestra cuando han pasado más de 2 veces la frecuencia esperada desde la última revisión (valor propuesto; cuestiones abiertas 4 y 6). El criterio es el mismo que usa la alerta «sin señal» del panel superadmin, de modo que los dos paneles no se contradicen. |
| REQ-013 | El Resumen muestra la fecha y hora de la última revisión. Una ejecución abierta sin informe no cambia la última revisión, no aporta cifras y no cambia el estado. |
| REQ-014 | El Resumen dice que, para pausar o reanudar el agente, el cliente lo pide a HumanaIA. No hay ningún botón ni control para hacerlo. |
| REQ-015 | En los estados Suspendido, Sin señal, Con error y No se ha podido comprobar, el Resumen dice qué puede hacer el cliente, según lo que decida la cuestión abierta 10. No muestra ningún dato de contacto que no haya aprobado el responsable. |

### Resumen: cifras del periodo

| ID | Requisito |
| --- | --- |
| REQ-016 | El Resumen dice siempre a qué periodo corresponden sus cifras, con fecha y hora de inicio y fin. El periodo propuesto es «últimos 30 días hasta ahora» (cuestión abierta 3). Si se admite elegir periodo, solo se ofrecen los de una lista cerrada. |
| REQ-017 | El Resumen muestra el número de revisiones del periodo y cuántas tuvieron cada estado del informe (`ok`, `aviso`, `error`, `pausado`), dichos con palabras. |
| REQ-018 | Cada cifra de actividad del periodo es la suma de esa cifra en las revisiones del periodo con estado `ok` o `aviso`. |
| REQ-019 | Cada cifra de situación se muestra como el valor de la última revisión del periodo con estado `ok` o `aviso`, rotulada con la fecha de esa revisión. Nunca se suma entre revisiones (propuesta; cuestión abierta 7). |
| REQ-020 | Si se muestra la variación de una cifra respecto al periodo anterior (cuestión abierta 8), solo aparece cuando los dos periodos tienen al menos 7 revisiones con estado `ok` o `aviso` (valor propuesto). Si no, no se muestra ninguna variación ni tendencia, y se dice que aún no hay datos suficientes para comparar. |
| REQ-021 | Si alguna de las dos vistas incluye un gráfico (cuestión abierta 8), cada gráfico tiene un título que dice la medida, ejes con unidad y una tabla equivalente accesible con exactamente los mismos valores; y no dibuja una evolución con menos de 2 puntos. |

### Actividad: histórico por revisión

| ID | Requisito |
| --- | --- |
| REQ-022 | La Actividad lista las revisiones del cliente de la más reciente a la más antigua. Cada fila muestra la fecha y hora, el estado del informe dicho con palabras y las cifras permitidas. |
| REQ-023 | En las revisiones con estado `error` o `pausado`, las cifras no se presentan como cero: se muestran como no disponibles, con el motivo dicho con palabras («no pudo revisar», «en pausa»). Lo mismo en el Resumen si la última revisión es de uno de esos estados. |
| REQ-024 | La Actividad se pagina con un tamaño de página fijo de 25 revisiones (valor propuesto; cuestión abierta 12), indica la posición («Revisiones 1 a 25 de 1.234») y permite ir a la página anterior y a la siguiente. |
| REQ-025 | Si llegan revisiones nuevas mientras el usuario recorre la Actividad, ninguna revisión aparece repetida ni se salta entre páginas consecutivas de la misma consulta, y la vista indica que hay revisiones más recientes. |
| REQ-026 | La Actividad dice desde qué fecha hay histórico. Su profundidad la fija la cuestión abierta 9, de acuerdo con los plazos de conservación de la fase 6. |

### Actualidad de los datos y estados obligatorios

| ID | Requisito |
| --- | --- |
| REQ-027 | Cada vista dice en qué momento se obtuvieron sus datos, y todo lo que muestra a la vez corresponde a ese mismo momento. Nunca se presentan como actuales datos obtenidos antes; si se conservan en pantalla tras un fallo al actualizar, se marcan como antiguos con su hora. Si las vistas se actualizan solas lo decide la cuestión abierta 11. |
| REQ-028 | Estado de carga: mientras se obtienen los datos, la vista muestra un esqueleto sin valores. No muestra ningún estado del agente ni cifras provisionales. |
| REQ-029 | Estado vacío: si el cliente no tiene ninguna revisión, las dos vistas lo dicen y explican que los datos aparecerán tras la primera revisión del agente. Si el periodo no tiene revisiones, se dice «No hay revisiones en este periodo»; en ningún caso se muestran ceros en lugar de «sin datos». |
| REQ-030 | Estado de error: la vista dice qué ha pasado y permite reintentar. El estado del agente pasa a «No se ha podido comprobar». El mensaje no contiene datos internos (códigos técnicos, consultas, identificadores, nombres de servicios ni trazas). |
| REQ-031 | Estado sin permiso: si la sesión deja de tener una vinculación vigente, la siguiente petición de datos de estas vistas no devuelve datos, la vista muestra el estado «sin permiso» de la función 040 y deja de mostrar los datos que tenía cargados. |
| REQ-032 | Datos parciales: si solo se obtiene una parte de los datos, la vista muestra lo obtenido y marca expresamente lo que falta como no disponible. Lo que falta nunca se muestra como cero. Si falta algo necesario para decidir el estado, el estado es «No se ha podido comprobar». |
| REQ-033 | Un valor leído que no está en su lista cerrada o en su rango (un estado desconocido, una cifra fuera de rango, un código desconocido) se trata como dato no disponible: no se pinta tal cual, no cuenta para ningún total y nunca lleva a «Funcionando». Queda registrado con un código, sin el valor. |

### Formato, accesibilidad, móvil, rendimiento y registros

| ID | Requisito |
| --- | --- |
| REQ-034 | Fechas con el formato `12 nov 2026, 08:04`, en hora de Madrid (también a ambos lados de los cambios de hora), indicándolo en la vista; miles con punto y decimales con coma; cifras con números tabulares. Textos en español de España, con trato de tú, frases cortas y sin jerga técnica (ni «ejecución», ni «informe», ni «token», ni nombres de campos del contrato). |
| REQ-035 | Las cifras se muestran completas, con su separador de miles, sin recortes ni abreviaturas que cambien su valor, hasta el máximo que pueda alcanzar cada una en el periodo más largo admitido. |
| REQ-036 | Las dos vistas cumplen WCAG 2.2 AA: contraste, uso completo con teclado, foco visible y en orden lógico, tablas con encabezados asociados, estado del agente y sus cambios anunciados a los lectores de pantalla, nada que dependa solo del color, respeto a la preferencia de reducir movimiento e idioma declarado como español. |
| REQ-037 | Las dos vistas se usan en móvil: sin desplazamiento horizontal de la página desde 320 píxeles de ancho, objetivos táctiles de al menos 24 por 24 píxeles, y la tabla de Actividad sigue siendo legible y usable con teclado y lector de pantalla a ese ancho. |
| REQ-038 | Rendimiento (valores propuestos; cuestión abierta 12): el contenido principal de cada vista aparece en menos de 2,5 segundos en el percentil 75, en móvil con red 4G simulada; y la obtención de los datos de cada vista tarda menos de 500 ms en el percentil 95, con un cliente que tiene 3 años de revisiones cada hora (26.280) en una base con otros 50 clientes con un año de revisiones diarias. |
| REQ-039 | Si los datos no llegan en 10 segundos (valor propuesto; cuestión abierta 12), la vista pasa al estado de error con opción de reintentar; nunca se queda cargando sin límite. |
| REQ-040 | Los registros del servidor de estas vistas anotan ruta, resultado, código y duración. Nunca anotan cifras, estados del agente, nombres de clientes, correos ni los valores de los parámetros recibidos (A-15). |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-041 | El usuario de A añade o cambia un identificador de cliente (real de B o inventado) en la dirección, los parámetros, el cuerpo o las cabeceras de una página o de una petición de datos de estas vistas | No obtiene ningún dato de B. La respuesta es idéntica con el identificador real de B y con uno inexistente: no permite distinguir «existe pero no es tuyo» de «no existe» |
| REQ-042 | El usuario de A usa un identificador de una revisión, una ejecución o una orden de B en cualquier petición | Igual que el caso anterior |
| REQ-043 | Periodo fuera de la lista cerrada, malformado, con fechas arbitrarias, negativo, enorme o repetido | No se calcula nada con ese valor. Se muestra el periodo por defecto, indicándolo. Ningún error expone datos internos |
| REQ-044 | Página negativa, cero, no numérica, más allá de la última o con un tamaño de página distinto del fijado | No se procesa el valor. Se usa el tamaño fijo y se muestra la primera página, indicándolo |
| REQ-045 | Parámetros o campos de más en una página o en una petición de datos | No tienen ningún efecto ni amplían lo que se devuelve. Sus nombres y valores no se registran |
| REQ-046 | Con su propia sesión, el usuario de A pide directamente a la API de datos datos de las listas B o C de su propio cliente: texto del prompt, versiones, publicaciones, conexiones, tokens, códigos, ejecuciones, licencia en bruto, órdenes en detalle, reglas, alertas, auditoría, ajustes globales, métricas por versión, catálogo de problemas o campos de informe pendientes de decisión | Recibe cero filas o acceso denegado. Ningún campo fuera de la lista A, ni de las listas de las funciones 040 y 042, llega a la sesión |
| REQ-047 | Con su propia sesión, el usuario de A pide directamente a la API de datos datos de B, filtrando expresamente por identificadores de B, sin filtro, o pidiendo agregados | Recibe cero filas de B y ningún agregado que incluya datos de B. La respuesta no revela si existen |
| REQ-048 | Desde la sesión de un usuario de cliente, por la interfaz o por la API de datos, se intenta pausar, reanudar, cambiar reglas, crear o cambiar una orden, insertar o cambiar un informe o una ejecución propios, resolver una alerta o escribir cualquier otra cosa | Se rechaza y no cambia nada |
| REQ-049 | Se retira el acceso al usuario mientras tiene Resumen o Actividad abiertos | Su siguiente petición (recarga, cambio de página o de periodo, reintento o actualización automática) no devuelve datos, ve «sin permiso» y dejan de verse los datos cargados |
| REQ-050 | La sesión caduca o se cierra con una de las vistas abierta | La siguiente petición no devuelve datos y se pide entrar de nuevo |
| REQ-051 | El cliente tiene una sola revisión, o pocas | Se muestran sus datos, sin variación, tendencia ni evolución dibujada |
| REQ-052 | Hay una ejecución abierta sin informe, también si es más reciente que la última revisión o lleva mucho tiempo abierta | No cuenta como revisión, no cambia la última revisión ni las cifras y no hace que el estado sea «Funcionando». Si no llega informe, el umbral de «Sin señal» sigue contando desde la última revisión |
| REQ-053 | Base de datos caída, lenta o con error | Estado de error o de datos parciales. Nunca se muestra «Funcionando» sin haberlo comprobado, nunca se muestran datos antiguos como actuales y el mensaje no contiene datos internos |
| REQ-054 | La pausa general del servicio está activa | Los Resúmenes de A y de B dicen «Pausa pendiente» o «En pausa», como el estado que recibe cada agente. La sesión no obtiene los ajustes globales ni ningún dato sobre otros clientes; el motivo se dice o no según la cuestión abierta 5 |
| REQ-055 | La licencia está suspendida (por impago, a mano o por caducidad) o el cliente está dado de baja | Si la función 040 le da acceso, el Resumen dice «Suspendido». La sesión no obtiene datos de la licencia en bruto ni de cobro por estas vistas; el motivo se dice o no según la cuestión abierta 5 |
| REQ-056 | El mismo usuario consulta los mismos datos dos o más veces a la vez (varias pestañas o peticiones simultáneas) | Todas las respuestas son coherentes entre sí, ninguna da error por la concurrencia y no se escribe nada |
| REQ-057 | Cifras en su máximo (por ejemplo, 100.000 sin tratar, o la suma máxima de tratados del periodo más largo) en una pantalla de 320 píxeles | Se muestran completas, sin desplazamiento horizontal de la página |
| REQ-058 | Revisiones a ambos lados de un cambio de hora | Se muestran en su orden real y con la hora de Madrid correcta; ninguna se repite ni desaparece |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Las pruebas de aislamiento sobre la base de datos se ejecutan en CI; en esta máquina no hay Docker y no se anotan como superadas en local.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | **Acceso cruzado de extremo a extremo (criterio 1.º de la fase 5), bloqueante en CI.** Con los clientes A y B, cada uno con al menos 50 revisiones con valores marcadores únicos, el usuario de A: cambia las direcciones de Resumen y Actividad y añade identificadores de B (cliente, revisiones, ejecuciones, órdenes) en la dirección, los parámetros, el cuerpo y las cabeceras; recorre todos los periodos admitidos y páginas dentro y fuera de rango; y pide directamente a la API de datos, con su sesión, los datos de B en cada objeto expuesto, con y sin filtros y pidiendo agregados. Resultado: 0 apariciones de marcadores de B en todo lo recibido, y respuesta idéntica con el identificador real de B y con uno aleatorio. Lo mismo de B hacia A | REQ-001, REQ-041, REQ-042, REQ-047 |
| CA-002 | **Lista cerrada en la API de datos (criterio 2.º de la fase 5), bloqueante en CI.** Una prueba recorre todas las tablas, vistas y funciones expuestas a la API de datos, obtenidas del esquema en el momento de la prueba y no de una lista fija, con la sesión del usuario de A, y compara cada campo recibido con la unión de la lista A y las listas de las funciones 040 y 042. Resultado: 0 campos fuera de esa unión y 0 filas de las categorías de las listas B y C | REQ-003, REQ-004, REQ-046 |
| CA-003 | **Lo que pinta y lo que recibe el navegador.** Con datos ficticios que llevan marcadores únicos en cada dato de las listas B y C del cliente A (versión del prompt, canal, problemas, comprobaciones, modo, asistente, almacenamiento, campos descartados, autor de la orden, estado manual de la licencia), se capturan el contenido servido y todas las respuestas de datos que recibe el navegador en las dos vistas y en todos sus estados: 0 apariciones de marcadores. Todo valor mostrado es un entero, un booleano, un valor de lista cerrada o una fecha | REQ-003, REQ-004, REQ-006 |
| CA-004 | El inventario de controles de las dos vistas tiene 0 controles que cambien datos y 0 campos de texto. Cada intento de escritura del caso negativo correspondiente, por la API de datos con la sesión del usuario de A, se rechaza en el 100 % de los casos con 0 filas cambiadas. Tras 100 consultas a las dos vistas, 0 filas de datos del cliente o del agente han cambiado | REQ-005, REQ-048 |
| CA-005 | El inventario de direcciones generadas por las dos vistas, en todos sus estados y paginaciones, contiene 0 identificadores de cliente, revisión, ejecución u orden, y solo valores de periodo y página de sus listas cerradas | REQ-007 |
| CA-006 | **Matriz de estados.** Hay un escenario ficticio por cada fila de la tabla de estados y por cada causa de pausa y de suspensión (licencia suspendida, cliente de baja, orden de pausa propia, pausa general, falta de versión aplicable; pausa pendiente y aplicada; reanudación). En el 100 % de los escenarios el Resumen muestra el estado esperado con su palabra y su frase, y es coherente con el estado que recibe el agente al pedir instrucciones justo después. En 0 escenarios se muestra «Funcionando» con un estado servido distinto de `activa` | REQ-008, REQ-009, REQ-010, REQ-011 |
| CA-007 | Con frecuencia esperada de 24 horas, una última revisión de hace 47 h 59 min no da «Sin señal» y una de hace 48 h 1 min sí. Con 1 hora, lo mismo a 1 h 59 min y 2 h 1 min. En los cuatro casos, el resultado coincide con el de la alerta «sin señal» del panel superadmin | REQ-012 |
| CA-008 | Con una ejecución abierta sin informe posterior a la última revisión, el Resumen y la Actividad muestran la misma última revisión, las mismas cifras y el mismo estado que sin ella (0 diferencias). Si la ejecución sigue abierta más allá del umbral, aparece «Sin señal» | REQ-013, REQ-052 |
| CA-009 | El Resumen dice en los 9 estados que la pausa se pide a HumanaIA y tiene 0 botones para pausar o reanudar. En Suspendido, Sin señal, Con error y No se ha podido comprobar muestra la indicación que fije la cuestión abierta 10, y 0 datos de contacto no aprobados por el responsable | REQ-014, REQ-015 |
| CA-010 | **Cálculo de cifras.** Con un conjunto ficticio de valores conocidos (40 revisiones dentro del periodo con los cuatro estados, 10 fuera, una a 1 minuto de cada límite), el número de revisiones, el desglose por estado, las cifras de actividad y las de situación coinciden con un cálculo de referencia independiente con 0 diferencias; el periodo se muestra con inicio y fin. Con un periodo sin revisiones se muestra «No hay revisiones en este periodo» y 0 ceros en su lugar | REQ-016, REQ-017, REQ-018, REQ-019, REQ-029 |
| CA-011 | Con 1 revisión y con 6 revisiones válidas en el periodo anterior: 0 variaciones y 0 tendencias mostradas, y se dice que no hay datos suficientes. Si hay gráficos, una comprobación automática encuentra para el 100 % de ellos una tabla equivalente con los mismos valores (0 diferencias), título y ejes con unidad | REQ-020, REQ-021, REQ-051 |
| CA-012 | Con 60 revisiones ficticias, la Actividad muestra 3 páginas: la primera con las 25 más recientes en orden, con fecha, estado con palabras y cifras correctas, y el texto de posición correcto en las 3. Las filas con estado `error` o `pausado` muestran 0 ceros y su motivo con palabras; lo mismo en el Resumen cuando la última revisión es de esos estados | REQ-022, REQ-023, REQ-024 |
| CA-013 | Con la Actividad en la página 1, llegan 5 revisiones nuevas; al pasar a las páginas 2 y 3, comparadas con una instantánea tomada al empezar: 0 revisiones repetidas y 0 saltadas, y la vista indica que hay revisiones más recientes. Se repite 10 veces | REQ-025 |
| CA-014 | Con revisiones ficticias anteriores y posteriores al límite fijado en la cuestión abierta 9, la Actividad muestra exactamente las que quedan dentro (0 diferencias) y dice desde qué fecha hay histórico | REQ-026 |
| CA-015 | Cada vista muestra la hora de sus datos. Con un fallo simulado al actualizar, el 100 % de los datos que siguen en pantalla están marcados como antiguos con su hora, o se retiran; 0 casos de datos antiguos sin marcar. Ninguna vista muestra a la vez estado y cifras obtenidos en momentos distintos | REQ-027 |
| CA-016 | Hay capturas de carga, vacío, error, sin permiso y datos parciales de las dos vistas, en escritorio y en móvil (20 capturas). En las de carga hay 0 estados del agente y 0 cifras | REQ-028, REQ-029, REQ-030, REQ-031, REQ-032 |
| CA-017 | Con fallos inyectados (base de datos sin respuesta, respuesta a los 11 segundos, error de la API, una petición de datos fallida y otra correcta), 20 veces cada uno: 0 casos de «Funcionando»; 0 datos faltantes mostrados como cero; a los 10 segundos, estado de error con reintento, que funciona cuando el servicio vuelve; y una búsqueda en los mensajes mostrados de códigos técnicos, consultas, identificadores, nombres de servicios y trazas da 0 coincidencias | REQ-030, REQ-032, REQ-039, REQ-053 |
| CA-018 | Con respuestas de datos simuladas que traen un estado desconocido, una cifra fuera de rango y un código desconocido: 0 valores pintados tal cual, 0 de ellos sumados en totales, 0 casos de «Funcionando», y 1 entrada de registro por caso con su código y sin el valor | REQ-033 |
| CA-019 | Con Resumen y Actividad abiertos, un superadmin retira el acceso al usuario de A; en 10 repeticiones, la siguiente recarga, cambio de página, cambio de periodo y reintento devuelven 0 datos, muestran «sin permiso» y dejan 0 datos de A visibles. Con la sesión caducada, lo mismo, llevando a la entrada | REQ-031, REQ-049, REQ-050 |
| CA-020 | Una batería de al menos 20 valores malformados de periodo y de página (negativos, cero, enormes, texto, listas, fechas arbitrarias, parámetros repetidos, caracteres especiales) y de peticiones con campos de más: en el 100 % se usa el periodo por defecto o la primera página, indicándolo; 0 errores con datos internos; 0 cambios en lo devuelto por los campos de más; 0 apariciones de los valores enviados en los registros | REQ-043, REQ-044, REQ-045 |
| CA-021 | Con la pausa general activada en el entorno de prueba: los Resúmenes de A y de B dicen «Pausa pendiente» antes de la siguiente petición de instrucciones de cada agente y «En pausa» después (2 de 2 clientes); la sesión del usuario de A lee 0 filas de ajustes globales; el texto se ajusta a la cuestión abierta 5 | REQ-009, REQ-010, REQ-054 |
| CA-022 | Para cada causa de suspensión (impago, a mano, caducidad de la licencia, baja del cliente), con el acceso que fije la función 040: el Resumen dice «Suspendido» y el usuario recibe 0 datos de licencia en bruto o de cobro por estas vistas; el motivo se ajusta a la cuestión abierta 5 | REQ-055 |
| CA-023 | 20 peticiones simultáneas de los mismos datos del mismo usuario, y dos pestañas abiertas a la vez: respuestas coherentes, 0 errores y 0 filas escritas | REQ-056 |
| CA-024 | Revisión de las dos vistas con datos ficticios: el 100 % de las fechas tiene el formato fijado y la hora de Madrid correcta, también en revisiones a ambos lados del cambio de hora del 25/10/2026 (0 repetidas, 0 desaparecidas, orden correcto); el 100 % de las cifras de 4 o más dígitos llevan separador de miles; y los textos tienen 0 términos técnicos de la lista que fije el diseño | REQ-034, REQ-058 |
| CA-025 | Con todas las cifras en su máximo y las sumas del periodo más largo admitido, a 320 píxeles: el 100 % de las cifras se ven completas y hay 0 desplazamientos horizontales de la página | REQ-035, REQ-057 |
| CA-026 | **Accesibilidad (criterio 3.º de la fase 5).** La revisión automática de las dos vistas, en todos sus estados, da 0 incumplimientos graves o críticos; la revisión manual con teclado y lector de pantalla da 0 incumplimientos de WCAG 2.2 AA; el lector anuncia el estado del agente y su cambio; todos los estados se distinguen en escala de grises | REQ-036 |
| CA-027 | **Uso en móvil (criterio 3.º de la fase 5).** A 320, 375 y 1280 píxeles de ancho y con el texto al 400 %: 0 desplazamientos horizontales de la página, 0 objetivos táctiles por debajo de 24 por 24 píxeles, y la tabla de Actividad se recorre completa con teclado y lector de pantalla a 320 píxeles | REQ-037 |
| CA-028 | Medición en el entorno previo con el volumen de REQ-038: contenido principal en menos de 2,5 segundos en el percentil 75 de 20 cargas en móvil con 4G simulada, y obtención de datos en menos de 500 ms en el percentil 95 de 20 repeticiones, para cada vista | REQ-038 |
| CA-029 | Tras ejecutar todas las pruebas, una búsqueda en los registros del servidor y en la supervisión de errores de los marcadores de cifras, nombres de clientes ficticios, correos de prueba y valores de parámetros enviados da 0 coincidencias; el 100 % de las peticiones de estas vistas tienen ruta, resultado, código y duración | REQ-040 |
| CA-030 | Con el usuario de A, el 100 % de las cifras, estados y filas coinciden con un cálculo de referencia hecho solo sobre A. Si la estructura admite un usuario vinculado a A y a B (función 040, cuestión abierta 3), con ese usuario hay 0 cifras, totales o filas que mezclen datos de los dos | REQ-002 |
| CA-031 | Todas las pruebas automáticas de los casos negativos están en verde en CI | REQ-041 a REQ-058 |

## Fuera de alcance

- Alta por invitación, inicio y cierre de sesión, recuperación, página Cuenta, marco, navegación, guardia de acceso y el estado «sin permiso» en sí (función 040). Esta función los usa.
- Página Suscripción, portal de pago y el aviso de pago pendiente, también cuando aparece en el Resumen (función 042).
- Cualquier acción sobre el agente desde el panel de cliente: pausar, reanudar, cambiar reglas o frecuencia. El panel es de solo lectura.
- Una página de detalle por revisión, la descarga o exportación de datos y los avisos al cliente por correo.
- Comparaciones con otros clientes o medias del servicio.
- Elegir entre varios clientes dentro del panel (función 040, cuestión abierta 3).
- El cálculo y el envío de la alerta «sin señal» y las demás alertas del panel superadmin (fases 2 y 4). Aquí solo se exige que el criterio coincida.
- La pausa general y las versiones del prompt en sí (fase 4).
- Plazos de conservación y purga del histórico (fase 6).
- Textos legales y política de privacidad (fase 6).
- Cambios en el contrato del informe.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`. Ninguna está contestada aquí.

1. **Qué datos de cada revisión ve el cliente.** El informe trae estado, modo (conversación o desatendido), asistente, almacenamiento, versión del prompt, frecuencia declarada, seis cifras (tratados, sin tratar, borradores, documentos, facturas pendientes, urgentes), cuatro comprobaciones (correo, almacenamiento, contexto, registro) y hasta cinco códigos de problema. Esta especificación incluye el estado y las seis cifras, y deja el resto como pendiente y no entregado. Para cada dato pendiente, y para cada una de las seis cifras, hay que decidir si lo ve:
   - a) **Sí.** Más información para el cliente; amplía la lista A, las pruebas de CA-002 y CA-003 y lo que la base de datos debe dejarle leer. En el caso de los **problemas**, hay que decidir además si se dicen en lenguaje llano todos los códigos o solo algunos: `conector_humanaia_inestable` habla de un fallo de HumanaIA, y `otro` no dice nada concreto al cliente. En el de la **versión del prompt** (solo el número, nunca el texto), la función 030 limita al superadmin el registro de versiones: habría que dejar claro que el número que trae el informe no es ese registro.
   - b) **No.** Menos que explicar y menos superficie; el cliente no sabe por qué una revisión tuvo avisos o errores y tiene que preguntar a HumanaIA.
   - c) **Solo resumido** (por ejemplo, «hubo un problema de acceso» en lugar de las cuatro comprobaciones). Requiere definir una lista cerrada de resúmenes y su correspondencia, que también tiene que aprobarse.

2. **Qué otros datos son internos de HumanaIA.** Además de lo prohibido siempre, hay que decidir si el cliente ve: su canal (`prueba` o `estable`), su frecuencia esperada y si hay una revisión en curso (ejecución abierta). Verlos da contexto (por ejemplo, «tu agente revisa cada 24 horas»); el canal revela que el cliente forma parte del grupo de prueba, y la revisión en curso exige entregar datos de ejecuciones, hoy prohibidos.

3. **Periodo de las cifras.**
   - a) **Periodo fijo** (por ejemplo, últimos 30 días). Más simple; el periodo no es una entrada del usuario y desaparece un parámetro que validar; el cliente no puede mirar otro intervalo en el Resumen.
   - b) **Selector con una lista cerrada** (por ejemplo, 7 días, 30 días, 90 días o mes natural). Más útil; añade una entrada que validar (REQ-043) y casos que medir en rendimiento, y obliga a fijar la lista y el valor por defecto.
   En las dos opciones, hay que confirmar si el periodo es «últimos N días hasta ahora» o meses naturales.

4. **Estados que ve el cliente.** Hay que confirmar la tabla de estados. En particular: ¿ve «Sin señal»? Si sí, sabe pronto que algo falla (la arquitectura lo prevé al hablar de «Fallos previstos»); si no, ve el estado de su última revisión aunque sea antigua, con su fecha, y puede creer que todo va bien. ¿Se distinguen «Pausa pendiente» y «Reanudado» de «En pausa» y «Funcionando»? Distinguirlos es más exacto; no distinguirlos simplifica los textos, pero el panel diría algo que todavía no ha ocurrido. ¿Un cliente que lleva mucho tiempo «Sin revisiones todavía» pasa a «Sin señal» (y desde cuándo, si eso exige usar la fecha de alta, hoy dato interno)?

5. **Motivo de una pausa o de una suspensión.**
   - a) **Solo el estado.** Mínimo dato; el cliente no sabe por qué y pregunta.
   - b) **Motivo genérico de una lista cerrada** («pausa pedida a HumanaIA», «pausa general del servicio», «suspendido por un asunto de la suscripción», «suspendido por HumanaIA»). Más claro; decir «pausa general» revela una incidencia del servicio que afecta a todos, y el motivo de impago se solapa con el aviso de la función 042.
   - c) **Motivo solo en algunos casos** (por ejemplo, el de impago sí, el de pausa general no). Hay que fijar cuáles.

6. **Umbral de «Sin señal».** Propuesta: más de 2 veces la frecuencia esperada sin revisión (coincide con el objetivo de servicio de `docs/ARQUITECTURA.md`). ¿Se confirma? ¿Qué frecuencia cuenta: la esperada que anota HumanaIA o la que declara el agente en cada informe? La primera la controla HumanaIA y coincide con la alerta; la segunda puede cambiar sin que HumanaIA lo sepa. En cualquier caso, el criterio debe ser el mismo que el de la alerta de las fases 2 y 4.

7. **Cómo se agregan las cifras de situación.** `sin_tratar` describe cuántos correos quedaban por tratar al terminar la revisión; sumarlo entre revisiones da un número que no es verdad. `facturas_pendientes` y `urgentes` no están definidos en el contrato como recuento de lo nuevo o de lo pendiente. Opciones para cada una:
   - a) **Valor de la última revisión válida** (propuesta de REQ-019). Verdadero si es un recuento de lo pendiente; si es de lo nuevo, se pierde lo de las revisiones anteriores.
   - b) **Suma del periodo.** Verdadero si es un recuento de lo nuevo; si es de lo pendiente, cuenta varias veces lo mismo.
   - c) **Máximo del periodo** u otra medida. Hay que definirla.
   La respuesta probablemente exige aclarar la descripción de esos campos en `contratos/informe.schema.json` y en el prompt.

8. **Gráfico de evolución y variación.** `docs/DISENO.md` no pone gráficos en las páginas de cliente, pero su componente «tarjeta de cifra» lleva variación con signo, y el principio 3 prohíbe tendencias sin datos suficientes.
   - a) **Sin gráfico ni variación.** Más simple y sin riesgo de engañar; el cliente no ve la evolución de un vistazo.
   - b) **Variación sin gráfico.** Hay que confirmar el umbral propuesto en REQ-020 (7 revisiones válidas en cada periodo).
   - c) **Gráfico de evolución en el Resumen o en la Actividad, con tabla equivalente** (REQ-021). Hay que decidir qué medida muestra y con qué agrupación (por día, por revisión) y cargar antes la skill de visualización, según `docs/DISENO.md`.

9. **Profundidad del histórico.** Depende de los plazos de conservación que fija la fase 6. Mientras no estén fijados:
   - a) **Todo lo que se conserve.** El cliente ve todo su historial; la Actividad crece sin límite hasta que haya purga, lo que pesa en el rendimiento (REQ-038).
   - b) **Un límite fijo** (por ejemplo, 12 meses). Acota el volumen; si la conservación es mayor, hay datos que el cliente no puede ver.

10. **Qué hace el cliente cuando algo va mal.** En Suspendido, Sin señal, Con error y No se ha podido comprobar:
    - a) **Solo «ponte en contacto con HumanaIA»**, sin vía concreta. No hay datos de contacto que mantener; el cliente tiene que saber cómo contactar.
    - b) **Una vía concreta** (correo o teléfono de soporte, u otra). Más útil; la vía la decide y la mantiene una persona, y hay que fijar dónde se configura y quién la cambia.
    - c) **Indicaciones distintas por estado** (por ejemplo, en «Con error» comprobar el acceso del asistente al correo). Más útil; exige textos aprobados por estado y puede chocar con «sin jerga técnica».

11. **Actualización de las vistas.** ¿Se actualizan solas mientras están abiertas (por ejemplo, cada 5 minutos) o solo al recargar? Solas: el cliente ve cambios sin hacer nada, y una retirada de acceso surte efecto sin que recargue; más peticiones y más casos que probar (REQ-025, REQ-027). Solo al recargar: más simple; lo mostrado puede quedarse antiguo, aunque siempre con su hora.

12. **Umbrales propuestos que hay que confirmar o cambiar:** «Sin señal» a 2 veces la frecuencia esperada; periodo por defecto de 30 días; 7 revisiones válidas por periodo para mostrar variación; 25 revisiones por página; 10 segundos de espera máxima antes del estado de error; contenido principal en menos de 2,5 segundos en el percentil 75 en móvil con 4G simulada (igual que la función 040); datos en menos de 500 ms en el percentil 95 (igual que la función 010); volumen de prueba de un cliente con 3 años de revisiones cada hora junto a 50 clientes con un año de revisiones diarias.

## Dependencias y decisiones relacionadas

- **Fase 2 cerrada** (función 010 y siguientes): modelo de datos, aislamiento por fila con pruebas en CI, lo que puede leer el usuario de cliente (función 010, cuestión abierta 5) y la lectura de resumen. Esta especificación exige que la sesión del usuario solo reciba la lista A: eso condiciona qué tablas, columnas y vistas le deja leer la base de datos. También de la fase 2: el criterio de la alerta «sin señal» y el estado servido que calcula el conector.
- **Fase 3**: sistema de diseño (V-110), componentes de tarjeta de cifra, tabla con paginación, estados vacío y de carga.
- **Función 040**: sesión, guardia de acceso, estado «sin permiso», marco y navegación; sus cuestiones abiertas 3 (usuario de varios clientes) y 6 (acceso según el estado del cliente y de la licencia) afectan a REQ-002 y a REQ-055.
- **Función 042**: aviso de pago pendiente en el Resumen y lista de datos de suscripción que puede recibir la sesión.
- **Fase 4**: pausa general (función 032), versiones y canales (función 030), alertas «sin señal». REQ-009 y REQ-054 dependen de cómo se defina la pausa general.
- **Fase 6**: plazos de conservación (cuestión abierta 9).
- Decisiones: D-007 (el texto del prompt vive en el repositorio), D-008 (listas cerradas), D-013 (en `pausada` no se entrega prompt), T-005 (patrón de aislamiento por fila), V-110.
- ADR: 0003 (aislamiento por cliente).
- Contrato: `contratos/informe.schema.json`.
- Seguridad: A-07, A-10, A-14, A-15; lista de publicación, «Prueba de extremo a extremo de acceso cruzado entre dos clientes».
- Diseño: `docs/DISENO.md` (principios 1 a 3 y 5, páginas de cliente, gráficos, estados obligatorios, accesibilidad, textos y formatos).
- Constitución: artículos 1, 2, 3, 10, 12 y 13.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
