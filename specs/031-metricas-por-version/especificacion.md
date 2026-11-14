# 031 · Métricas por versión del prompt

Estado: PROPUESTA
Fase: 4 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Cada versión del prompt cambia lo que hacen los agentes en las cuentas de correo de todos los clientes. Antes de pasar una versión del canal `prueba` al `estable`, HumanaIA tiene que saber, con hechos, si funciona al menos tan bien como la que ya sirve a todos. Esta función convierte los informes que envían los agentes en cifras por versión (estados, correos tratados y sin tratar, borradores, facturas pendientes, códigos de problema) y compara la versión de `prueba` con la de `estable` según los criterios de promoción de la skill `version-prompt`. Las cifras tienen que ser exactas, poder contrastarse con los informes de los que salen, decir cuándo no hay datos suficientes y no mostrar nunca a un cliente datos de otro.

## Quién la usa y cómo

- Como **superadmin de HumanaIA**, quiero ver por cada versión del prompt cuántas revisiones ha hecho, en qué estado han terminado y qué cifras de correo han dado, en el periodo que elija, para saber cómo se comporta cada versión.
- Como **superadmin de HumanaIA**, quiero comparar la versión vigente en `prueba` con la vigente en `estable`, criterio por criterio, y que se me diga cuándo los datos no bastan para comparar, para decidir si se promueve.
- Como **responsable de HumanaIA**, quiero que cada cifra cuadre con los informes recibidos y que un fallo nunca se muestre como un dato, para fiarme de lo que veo antes de autorizar una publicación en `estable`.
- Como **usuario de un cliente**, no debo poder obtener por ninguna vía cifras en las que entren datos de otros clientes.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo. Cuando un umbral o una regla los tiene que fijar el responsable, el requisito remite a la cuestión abierta que lo fija. En este documento, «revisión» es un informe guardado; «versión registrada» es una versión del registro de la función 030.

### Origen y atribución de los datos

| ID | Requisito |
| --- | --- |
| REQ-001 | Las métricas se calculan solo a partir de los informes guardados, del registro de versiones y del historial de publicaciones de la función 030, y de la versión servida en cada ejecución. Ninguna cifra se estima, se interpola, se completa ni se arrastra de otro periodo. |
| REQ-002 | Cada informe se atribuye a la versión que declara (ADR-0005), por coincidencia de su número con el de una versión registrada según la regla de equivalencia de la cuestión abierta 6. La atribución no depende del canal actual del cliente, de su estado actual ni de las publicaciones posteriores al informe. |
| REQ-003 | Los informes que declaran un número que no corresponde a ninguna versión registrada no se suman a ninguna versión registrada. Se muestran aparte, como «versión no registrada», con su número de revisiones, agrupados o desglosados por número según la cuestión abierta 6. |
| REQ-004 | Por cada versión se muestra cuántos de sus informes declaran una versión distinta de la que se sirvió en su ejecución. Si esos informes entran o no en la comparación de REQ-017 lo fija la cuestión abierta 5. |
| REQ-005 | Por cada versión se muestra cuántos de sus informes proceden de ejecuciones en las que no se sirvió ninguna versión (agente en pausa o licencia suspendida). Cómo se tratan en las proporciones, las medias y la comparación lo fija la cuestión abierta 4. |
| REQ-006 | Un informe pertenece al periodo según el momento en que lo recibió el servidor. Los límites de los periodos se definen en la zona horaria que fije la cuestión abierta 2, y la pantalla indica esa zona y los límites exactos del periodo mostrado. Cada informe pertenece a un único día. |
| REQ-007 | El superadmin elige el periodo entre los que fije la cuestión abierta 1. Al abrir la pantalla se muestra el periodo por defecto que fije esa misma cuestión. |

### Cifras por versión

| ID | Requisito |
| --- | --- |
| REQ-008 | Para el periodo elegido se muestran, al menos: cada versión registrada con uno o más informes atribuidos en el periodo, y la versión vigente en cada canal aunque no tenga ninguno. Para cada una se muestra el número de revisiones. |
| REQ-009 | Por cada versión se muestra el número de revisiones en cada uno de los cuatro estados del informe: `ok`, `aviso`, `error` y `pausado`. |
| REQ-010 | Por cada versión se muestra la proporción de revisiones en `ok`, en `aviso` y en `error`, siempre junto a su recuento y a su denominador («12 de 340»). El denominador, con o sin las revisiones en `pausado`, es el que fije la cuestión abierta 4, y la pantalla dice cuál es. |
| REQ-011 | Por cada versión se muestran, de los correos tratados, los correos sin tratar, los borradores y las facturas pendientes, el total y la media por revisión. El denominador de la media sigue la cuestión abierta 4. Si para las cifras que son pendientes acumulados (sin tratar, facturas pendientes) se muestra el total o otra medida lo fija la cuestión abierta 7. |
| REQ-012 | Por cada versión y cada código de problema del catálogo que aparezca en sus informes se muestra en cuántas revisiones aparece, en cuántos clientes distintos y qué proporción de las revisiones de la versión supone. |
| REQ-013 | Por cada versión se muestra el número de clientes distintos que aportan informes y la proporción de revisiones que aporta el cliente que más aporta. |
| REQ-014 | Por cada versión se muestra el número de revisiones en conversación y en desatendido. Qué revisiones entran en la comparación según su modo lo fija la cuestión abierta 3. |
| REQ-015 | Las versiones se ordenan por su número, componente a componente como números enteros (la 1.10 va después de la 1.9), no como texto. |
| REQ-016 | Cada vista indica el periodo, el momento de recepción del informe más reciente incluido y el momento en que se calcularon las cifras. |

### Comparación entre `prueba` y `estable`

| ID | Requisito |
| --- | --- |
| REQ-017 | Existe una comparación entre la versión vigente en `prueba` y la vigente en `estable`, calculada sobre la ventana de tiempo y la población de clientes que fije la cuestión abierta 9, con la ponderación que fije la cuestión abierta 8. La pantalla dice qué ventana y qué población se usan. |
| REQ-018 | La comparación da, para cada criterio de promoción que se puede medir con los informes (proporción de revisiones en `error`, proporción en `aviso`, correos sin tratar y códigos de problema nuevos que se repiten), los valores de las dos versiones, su diferencia y un veredicto de una lista cerrada: «no peor», «peor» o «datos insuficientes». El margen de «no peor» y la definición de «código nuevo que se repite» son los que fije la cuestión abierta 10. El veredicto se calcula con los valores sin redondear. |
| REQ-019 | Si alguna de las dos versiones no alcanza el mínimo de revisiones o de clientes que fije la cuestión abierta 11 en la ventana comparada, el veredicto de todos los criterios es «datos insuficientes», y la pantalla dice cuánto falta. Nunca se da «no peor» por falta de datos. |
| REQ-020 | Si `prueba` sirve la misma versión que `estable`, o no tiene publicación propia, la comparación lo dice y no da ningún veredicto. |
| REQ-021 | La comparación dice expresamente que el criterio «ninguna incidencia comunicada por los clientes del grupo de prueba» no se mide con los informes y lo tiene que comprobar una persona. |
| REQ-022 | Si la función 030 usa la comparación para permitir o advertir al promover (cuestión abierta 12 de esta función y cuestión abierta 13 de la función 030), el veredicto que use se calcula con los datos disponibles en el momento del intento y con las mismas reglas que muestra la pantalla. |

### Exactitud, actualidad y rendimiento

| ID | Requisito |
| --- | --- |
| REQ-023 | Cada cifra mostrada es igual a la que resulta de calcularla sobre los informes del periodo. Las cifras son coherentes entre sí: por cada versión, la suma de revisiones por estado es igual a su número de revisiones, y la suma de revisiones de todas las versiones y de «versión no registrada» es igual al total de informes del periodo. |
| REQ-024 | Un informe guardado aparece reflejado en las métricas en un plazo no mayor que el retraso máximo que fije la cuestión abierta 15. |
| REQ-025 | La pantalla de métricas y la comparación terminan de cargarse en el tiempo máximo que fije la cuestión abierta 14, con el volumen de datos de referencia que fije esa misma cuestión. |
| REQ-026 | Consultar las métricas, también de forma repetida o simultánea por varios superadmin, no hace que las herramientas del conector incumplan su objetivo de servicio (cuestión abierta 19). |
| REQ-027 | Consultar las métricas no modifica ningún dato: ni informes, ni ejecuciones, ni versiones, ni publicaciones, ni el estado de ningún cliente. |

### Pantalla del panel superadmin

| ID | Requisito |
| --- | --- |
| REQ-028 | Las métricas por versión y la comparación se muestran en la página «Versiones» del panel superadmin (`docs/DISENO.md`), con el selector de periodo en la cabecera. Qué gráficos se incluyen además de las tablas lo fija la cuestión abierta 20. |
| REQ-029 | La pantalla tiene estados de carga, vacío (sin informes en el periodo, con qué hacer a continuación), error (qué ha pasado y cómo reintentar), sin permiso y datos parciales (qué bloque falta y que las cifras visibles no son completas). |
| REQ-030 | La pantalla cumple WCAG 2.2 AA y se puede usar entera con teclado y en móvil. Cada gráfico tiene una tabla equivalente accesible. Los estados y los veredictos se comunican con palabra, no solo con color. |
| REQ-031 | Todos los textos están en español. Las cifras usan punto de miles y coma decimal, y las fechas el formato de `docs/DISENO.md`. |
| REQ-032 | No se muestran tendencias, variaciones ni comparaciones para las que no haya datos: donde no hay dato se dice «sin datos», nunca un cero ni un porcentaje inventado. |

### Acceso, privacidad y errores

| ID | Requisito |
| --- | --- |
| REQ-033 | Solo un superadmin con sesión iniciada con doble factor puede obtener las métricas por versión, la comparación o cualquier cifra en la que se agreguen datos de más de un cliente. |
| REQ-034 | Las métricas no aceptan como entrada ningún identificador de cliente. Lo que se ve lo determina la sesión. Las únicas entradas son el periodo y, en su caso, la versión, y solo se admiten valores de las listas cerradas que ofrece la pantalla. |
| REQ-035 | Las métricas solo contienen enteros, proporciones, números de versión, fechas y valores de listas cerradas (estados, modos, códigos de problema). No contienen contenido de correo, texto libre ni datos personales de terceros. Si contienen nombres de clientes lo fija la cuestión abierta 17. |
| REQ-036 | Los mensajes de error de la pantalla y los registros del servidor de esta función no contienen cifras de clientes, valores recibidos, consultas ni detalles internos: solo ruta, resultado y un código de error. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-037 | Un usuario de un cliente intenta obtener métricas por versión o la comparación por el dashboard, cambiando la URL o los parámetros, con una llamada directa a la API o a la base de datos, o por una exportación si existe | No obtiene nada de esta función: acceso denegado o cero filas. En ningún caso obtiene una cifra en la que entren datos de otro cliente, ni siquiera un recuento de clientes o un total |
| REQ-038 | Petición sin sesión, con sesión de superadmin sin doble factor, con la identidad del conector o con la del despliegue | Se rechaza; no se devuelve ninguna cifra, tampoco la lista de versiones con informes |
| REQ-039 | Un superadmin pierde ese papel, o su sesión se revoca, mientras tiene la pantalla abierta | Su siguiente petición se rechaza y no recibe cifras nuevas |
| REQ-040 | No se puede comprobar si quien pide es superadmin o si tiene doble factor (fallo del servicio de sesiones o de la base de datos) | Se deniega. Nunca se devuelven cifras por defecto |
| REQ-041 | Petición con campos de más, con un identificador de cliente, con un periodo inválido (fin anterior al inicio, en el futuro o fuera de los periodos permitidos) o con una versión que no existe | Se rechaza o se ignora lo ajeno. Nunca amplía lo que se ve. La respuesta y los registros no repiten el valor recibido |
| REQ-042 | Versión sin ningún informe en el periodo, o periodo sin ningún informe | Se muestra con 0 revisiones y «sin datos» en proporciones, medias y comparación. Ninguna división por cero, ningún 0 % ni media de 0 inventados, ningún error en pantalla |
| REQ-043 | La base de datos falla o no responde, del todo o solo para una parte de las cifras | Ninguna cifra parcial se muestra como completa. Los bloques que no se han podido calcular muestran el estado de error con reintento y ningún número (tampoco cero). La comparación no da veredicto |
| REQ-044 | Llegan informes mientras se calculan o se muestran las cifras | Las cifras mostradas juntas proceden de un mismo corte de datos y cumplen la coherencia de REQ-023 |
| REQ-045 | El mismo informe llega dos veces para la misma ejecución | Cuenta una sola vez |
| REQ-046 | Un cliente aporta la mayoría de las revisiones de una versión | La pantalla lo muestra con la concentración de REQ-013 y la comparación aplica la ponderación de la cuestión abierta 8; los totales no se presentan como si fueran la media de los clientes |
| REQ-047 | Informes de clientes dados de baja, o de clientes que cambiaron de canal dentro de la ventana comparada | Se tratan según la cuestión abierta 16, y la pantalla dice si están incluidos. Un cambio posterior del canal o del estado de un cliente no cambia la versión a la que se atribuyeron sus informes |
| REQ-048 | Un código de problema que figura en informes guardados se desactiva después en el catálogo | Sigue contándose y se muestra por su código; no desaparece de las cifras de periodos en que se recibió |
| REQ-049 | Periodo que incluye un cambio de hora (día de 23 o de 25 horas) | Ningún informe se pierde ni se cuenta dos veces; cada uno cae en el día que le corresponde en la zona de la cuestión abierta 2 |
| REQ-050 | Números de versión parecidos: 1.1 y 1.10, 1.3 y 1.3.0, 1.3 y 01.3 | No se confunden ni se suman juntos, salvo que la regla de equivalencia de la cuestión abierta 6 diga que son la misma versión |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Salvo que se diga otra cosa, se ejecutan en el entorno previo, con datos ficticios y con el reloj controlado.

### Conjunto de referencia

Varios criterios usan un **conjunto de referencia** de informes ficticios cuyo resultado se conoce antes de ejecutar la prueba. Lo prepara `qa`, y las cifras esperadas se calculan a mano o con un cálculo independiente que no comparte código con la función. Las cifras esperadas se guardan con la prueba antes de ejecutarla. Como mínimo contiene:

- Versiones registradas 1.3 (vigente en `estable`), 1.4 (vigente en `prueba`), 1.9 (con informes solo fuera del periodo) y 1.10 (sin informes). Informes que declaran 2.0 y 1.3.0, que no están registradas.
- Cinco clientes ficticios: A, en `estable`, aporta más del 60 % de las revisiones de la 1.3; B, en `estable`; C, en `prueba`; D, en `prueba`, dado de baja dentro del periodo; E, que pasa de `estable` a `prueba` dentro del periodo.
- Informes en los cuatro estados y en los dos modos para la 1.3 y la 1.4, con cifras distintas en cada uno.
- Tres informes que declaran 1.3 en ejecuciones en las que se sirvió la 1.4, y dos informes `pausado` de ejecuciones en las que no se sirvió versión.
- Un código de problema que solo aparece en la 1.4 y se repite en al menos tres revisiones de dos clientes, otro que aparece una sola vez y otro que se desactiva en el catálogo después de recibirse.
- Informes recibidos a las 23:59:59 y a las 00:00:00 de la zona de la cuestión abierta 2, y en un día de cambio de hora.
- Un informe enviado dos veces para la misma ejecución.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Con el conjunto de referencia y cada periodo de la cuestión abierta 1, el 100 % de las cifras que muestra la pantalla (revisiones, recuentos y proporciones por estado, totales y medias, códigos de problema, clientes distintos, concentración y reparto por modo) coincide con las esperadas: 0 discrepancias | REQ-001, REQ-008 a REQ-013, REQ-023 |
| CA-002 | **Entrega del plan:** «Métricas por versión: estados, correos tratados y sin tratar, borradores, facturas pendientes». En el panel superadmin, con el conjunto de referencia, para la 1.3 y la 1.4 se ven los cuatro estados con su recuento y las cuatro cifras de correo con total y media, y coinciden con las esperadas (2 de 2 versiones, 0 discrepancias) | REQ-009, REQ-011, REQ-028 |
| CA-003 | Con el conjunto de referencia: los informes de 2.0 y 1.3.0 aparecen en «versión no registrada» y en ninguna versión registrada; los tres informes con versión distinta de la servida figuran en el recuento de discrepancias de la 1.3; los dos `pausado` sin versión servida figuran en el recuento de REQ-005 y se tratan como fije la cuestión abierta 4. Se cambia después el canal de A y de C y se publica otra versión en `prueba`: las cifras del periodo pasado son idénticas antes y después (0 cambios) | REQ-002 a REQ-005 |
| CA-004 | Los informes de las 23:59:59 y las 00:00:00 caen cada uno en su día, y el del día de cambio de hora en el suyo: la suma de revisiones por día es igual al total del periodo (0 perdidos, 0 duplicados). La pantalla muestra la zona horaria y los límites exactos del periodo, y ofrece los periodos de la cuestión abierta 1 con el de por defecto seleccionado al entrar | REQ-006, REQ-007, REQ-049 |
| CA-005 | Para la 1.3 la pantalla muestra la concentración del cliente A igual a la esperada y el reparto por modo coincide con el esperado; la comparación aplica la ponderación de la cuestión abierta 8 y, en un caso preparado en que A tiene muchos errores y B ninguno, el veredicto es el esperado según esa regla | REQ-013, REQ-014, REQ-046 |
| CA-006 | El código desactivado en el catálogo sigue apareciendo con su recuento en el periodo en que se recibió; los recuentos de revisiones y de clientes por código coinciden con los esperados (0 discrepancias) | REQ-012, REQ-048 |
| CA-007 | Con las versiones 1.1, 1.9, 1.10, 1.3, 1.3.0 y 01.3: el orden mostrado es numérico (1.10 después de 1.9) y ninguna pareja se suma junta salvo las que declare equivalentes la cuestión abierta 6 | REQ-015, REQ-050 |
| CA-008 | En 10 cargas de la pantalla, el periodo, el momento del informe más reciente incluido y el momento del cálculo se muestran y coinciden con los del corte usado | REQ-016 |
| CA-009 | Con cinco escenarios preparados (`prueba` mejor; peor por encima del margen; peor dentro del margen; con un código nuevo que se repite; por debajo del mínimo de revisiones de la cuestión abierta 11) la comparación da el veredicto esperado en 5 de 5 escenarios, con valores y diferencia correctos, y en el último da «datos insuficientes» y cuánto falta. Un caso cuyo valor redondeado parece igual pero sin redondear supera el margen da «peor» | REQ-017 a REQ-019 |
| CA-010 | Con `prueba` sirviendo la misma versión que `estable`, y con `prueba` sin publicación propia, la comparación lo dice y no da veredicto (2 de 2). En todos los casos la pantalla dice que el criterio de incidencias comunicadas por los clientes lo comprueba una persona | REQ-020, REQ-021 |
| CA-011 | Si la cuestión abierta 12 decide que la comparación interviene al promover: se añaden informes que cambian el veredicto entre la carga de la pantalla y el intento de promover, y el veredicto usado en el intento es el calculado con los datos nuevos y coincide con el que muestra la pantalla al recargar. Si decide que no interviene, el criterio se da por no aplicable y se anota así en la verificación | REQ-022 |
| CA-012 | Mientras se guardan 1.000 informes ficticios nuevos se hacen 100 consultas de las métricas: en el 100 % de las respuestas la suma de revisiones por estado es igual a las revisiones de cada versión y la suma por versión más «versión no registrada» es igual al total del periodo | REQ-023, REQ-044 |
| CA-013 | En 20 pruebas, un informe guardado aparece reflejado en las métricas y en el momento del informe más reciente dentro del retraso máximo de la cuestión abierta 15 (20 de 20) | REQ-016, REQ-024 |
| CA-014 | Con el volumen de referencia de la cuestión abierta 14, en 50 cargas de la pantalla de métricas y de la comparación, el percentil 95 del tiempo hasta que todas las cifras están visibles es menor que el tiempo máximo fijado | REQ-025 |
| CA-015 | Con el volumen de referencia, 5 superadmin ficticios consultan las métricas a la vez durante 10 minutos mientras corre la carga de revisiones del conector: las herramientas del conector cumplen su objetivo de servicio (cuestión abierta 19) | REQ-026 |
| CA-016 | Tras 100 consultas de las métricas con todos los periodos, una comparación del estado de informes, ejecuciones, versiones, publicaciones y clientes antes y después da 0 diferencias | REQ-027 |
| CA-017 | Puerta P5: capturas de los estados de carga, vacío, error, sin permiso y datos parciales con el conjunto de referencia y con fallos simulados. En el estado de datos parciales se identifica el bloque que falta y se dice que las cifras no son completas | REQ-029, REQ-042, REQ-043 |
| CA-018 | Revisión WCAG 2.2 AA sin hallazgos bloqueantes ni mayores; toda la pantalla se usa solo con teclado; cada gráfico tiene su tabla equivalente; los veredictos y estados se entienden con el color desactivado; a 320 píxeles CSS de ancho no hay desplazamiento horizontal de página y los objetivos táctiles miden al menos 24 por 24 píxeles; 0 textos visibles que no estén en español y 0 cifras con un formato distinto del de `docs/DISENO.md` | REQ-030 a REQ-032 |
| CA-019 | Prueba automática de aislamiento con dos clientes ficticios cuyos informes tienen cifras marcadoras distintas: un usuario del cliente A intenta obtener métricas por versión y la comparación por el dashboard, cambiando la URL y los parámetros, con llamada directa a la API y a la base de datos y, si existe, por exportación. El 100 % de los intentos termina en acceso denegado o en cero filas, y ninguna respuesta contiene una cifra en la que entren las cifras marcadoras de B | REQ-033, REQ-037 |
| CA-020 | Se intenta obtener las métricas sin sesión, como superadmin sin doble factor, con la identidad del conector y con la del despliegue, por la pantalla y con llamada directa: 100 % rechazados, 0 cifras devueltas | REQ-038 |
| CA-021 | Con la pantalla abierta, se quita el papel de superadmin a la cuenta y, en otra prueba, se revoca su sesión: la siguiente petición de cifras se rechaza (2 de 2) | REQ-039 |
| CA-022 | Con el servicio de sesiones y, en otra prueba, la base de datos simulados como caídos durante la comprobación de permisos, 20 peticiones de métricas: 20 de 20 denegadas y 0 cifras devueltas | REQ-040 |
| CA-023 | Diez peticiones malformadas (campos de más, un identificador de cliente, fin anterior al inicio, periodo futuro, periodo no permitido, versión inexistente, valores con texto libre, entre otras): el 100 % se rechaza o ignora lo ajeno, ninguna devuelve más datos que la petición válida equivalente, y ni la respuesta ni los registros contienen el valor recibido | REQ-034, REQ-041 |
| CA-024 | Con la 1.10 (sin informes) y con un periodo sin ningún informe: 0 revisiones, «sin datos» en proporciones, medias y comparación, 0 errores en pantalla y ninguna aparición de «0 %», «NaN», «Infinity» ni medias inventadas | REQ-032, REQ-042 |
| CA-025 | Se inyecta 20 veces un fallo de la base de datos, unas veces total y otras solo en una parte de las cifras: en el 100 % de los casos ningún bloque fallido muestra un número, el estado de datos parciales o de error se ve, y la comparación no da veredicto | REQ-043 |
| CA-026 | El informe enviado dos veces para la misma ejecución cuenta una sola vez en todas las cifras del conjunto de referencia | REQ-045 |
| CA-027 | Con los clientes D (baja) y E (cambio de canal) del conjunto de referencia, sus informes se incluyen o excluyen como fije la cuestión abierta 16, la pantalla dice si están incluidos, y la versión a la que se atribuyen no cambia tras la baja ni tras el cambio de canal | REQ-047 |
| CA-028 | Revisión de privacidad (skill `revision-privacidad`) de la pantalla, las respuestas y los registros del servidor de esta función con el conjunto de referencia: 0 textos libres, 0 contenidos de correo y 0 datos de terceros; solo aparecen tipos de REQ-035. Con errores provocados, 0 mensajes con cifras de clientes, consultas, valores recibidos o detalles internos | REQ-035, REQ-036 |

## Fuera de alcance

- Registro, publicación y vuelta atrás de versiones, canales, qué clientes están en cada canal y permanencia mínima en `prueba` (función 030). Si la comparación bloquea o solo advierte al promover se decide entre las dos funciones (cuestión abierta 12).
- Alertas, incluidas «estado `error`» y «versión antigua», y la pausa global (función 032).
- Cliente piloto, comparación con su carpeta `panel` y objetivos de servicio de la plataforma (función 033).
- Las cifras propias de un cliente en su dashboard (fase 5).
- La elección de la librería de interfaz y de gráficos (V-110, fase 3).
- Los plazos de conservación de los informes y el borrado de datos de clientes dados de baja (fase 6).
- La recepción, validación y guardado de los informes, la eliminación de duplicados y la anotación de la versión servida en cada ejecución (fase 2).
- El acceso con doble factor y el sistema de diseño del panel (fase 3).
- Medir las incidencias comunicadas por los clientes del grupo de prueba: no salen de los informes y las comprueba una persona (REQ-021).
- Cualquier cambio del contrato del informe o nuevas cifras en él. Si la cuestión abierta 7 o la 18 lo hacen necesario, se pide a coordinación.
- Recomendaciones automáticas, predicciones o análisis estadísticos más allá de los criterios de promoción.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Periodos.** ¿Qué periodos se ofrecen (por ejemplo: últimos 7 días, últimos 30 días, desde la publicación de la versión en su canal, rango a elegir)? ¿Cuál se muestra por defecto? Si hay rango a elegir, ¿cuál es su longitud máxima?
2. **Zona horaria.** ¿Los días y los periodos se cuentan en hora de Madrid (como propone `docs/DISENO.md`, en estado PROPUESTA) o en otra zona?
3. **Conversación y desatendido.** ¿Las revisiones en conversación cuentan igual que las desatendidas en las proporciones y en la comparación, o la comparación usa solo las desatendidas? ¿Hace falta poder filtrar la pantalla por modo y por asistente (Claude, ChatGPT)?
4. **`pausado` y ejecuciones sin versión servida.** ¿Las revisiones en `pausado` entran en el denominador de las proporciones y de las medias, o se cuentan solo en el reparto por estado? Los informes de ejecuciones en las que no se sirvió versión (agente en pausa, licencia suspendida), ¿se atribuyen a la versión que declaran, se excluyen o se agrupan aparte?
5. **Versión declarada distinta de la servida.** ADR-0005 dice que las métricas usan la versión declarada. Cuando difiere de la que se sirvió en la ejecución, ¿esos informes entran en la comparación, se excluyen o se atribuyen a la servida? ¿Debe ser además una alerta (función 032)?
6. **Versiones no registradas y equivalencia de números.** ¿«Versión no registrada» se muestra como un solo grupo o desglosada por número declarado? ¿Son la misma versión 1.3 y 1.3.0, o 1.3 y 01.3? (Relacionada con la cuestión abierta 14 de la función 030, sobre el formato del número.)
7. **Cifras que son pendientes acumulados.** El contrato no dice si `sin_tratar` y `facturas_pendientes` son lo que quedó en esa revisión o lo pendiente acumulado; tampoco si `borradores` son los creados en la revisión o los que esperan. Si son acumulados, sumarlos entre revisiones no tiene sentido. ¿Qué significan y cómo se resumen por versión: media por revisión, último valor de cada cliente, máximo?
8. **Ponderación.** ¿Las proporciones y la comparación se calculan por revisión (un cliente con mucho volumen pesa más) o como media de clientes (cada cliente pesa igual)? ¿O se muestran las dos?
9. **Ventana y población de la comparación.** ¿Se compara la versión de `prueba` desde su publicación con la de `estable` en la misma ventana? ¿Con todos los clientes de `estable`, o con los mismos clientes del grupo de prueba en el periodo anterior a recibir la versión nueva? Los dos grupos de clientes no son iguales, y eso puede sesgar la comparación.
10. **Margen y códigos nuevos.** ¿Qué diferencia se acepta como «no peor» en cada criterio (puntos porcentuales, proporción relativa, correos sin tratar por revisión)? ¿Qué es un «código de problema nuevo que se repite»: que no aparece en `estable` en la ventana comparada o que no ha aparecido nunca; y cuántas revisiones o cuántos clientes hacen falta para «se repite»?
11. **Mínimo para comparar.** ¿Con cuántas revisiones y cuántos clientes distintos, como mínimo en cada versión, se da por válida una comparación? Conviene que sea coherente con la permanencia mínima de la función 030 (la skill `version-prompt` propone al menos 10 revisiones).
12. **Bloquear o advertir.** ¿El sistema impide promover a `estable` una versión con algún veredicto «peor» o «datos insuficientes», o solo lo advierte y decide la persona? Es la misma decisión que la cuestión abierta 13 de la función 030 y debe contestarse una vez para las dos.
13. **Exportación.** ¿Hace falta exportar las cifras (por ejemplo, a una hoja de cálculo)? Si hace falta, ¿en qué formato y queda en auditoría?
14. **Rendimiento.** ¿Qué tiempo máximo de carga es aceptable para la pantalla y la comparación, y con qué volumen de referencia (número de clientes, revisiones por cliente y día, meses de histórico)?
15. **Actualidad.** ¿Cuál es el retraso máximo aceptable entre que llega un informe y que aparece en las métricas?
16. **Clientes de baja y cambios de canal.** ¿Los informes de clientes dados de baja siguen contando en las métricas de periodos pasados? ¿Y los de clientes que cambiaron de canal dentro de la ventana comparada?
17. **Desglose por cliente y contraste.** ¿Puede el superadmin ver, desde una cifra, de qué clientes y de qué informes sale (con nombres de cliente), para contrastarla? ¿O las métricas por versión solo muestran recuentos, sin nombres?
18. **Otras cifras.** Además de las del plan, ¿se muestran por versión documentos guardados, urgentes, comprobaciones fallidas (correo, almacenamiento, contexto, registro), informes con campos descartados (una versión que hace enviar campos ajenos es una señal de privacidad) y ejecuciones que no llegaron a enviar informe por versión servida?
19. **Objetivo de servicio del conector.** REQ-026 necesita un objetivo que cumplir. La arquitectura propone uno para `obtener_instrucciones` (95 % en menos de 1 segundo), en estado PROPUESTO. ¿Se fija en la función 033 (como apuntan la arquitectura y la cuestión abierta 23 de la función 032) y esta función lo hereda?
20. **Gráficos.** ¿Basta la tabla por versión y la comparación, o hace falta evolución por día de cada versión? ¿Qué gráficos concretos?
21. **Auditoría de consultas.** ¿Consultar las métricas debe quedar en auditoría, o solo las acciones que cambian algo?

## Dependencias y decisiones relacionadas

**Decisiones y documentos**

- D-007 y ADR-0005 (consecuencia: las métricas se calculan con la versión que declara cada informe); artículos 1, 2, 3, 10 y 13 de la constitución.
- D-008 (los problemas del informe son valores de lista cerrada); D-013 (qué se entrega en `pausada`), relacionada con la cuestión abierta 4.
- V-108 (doble factor exigido en las políticas) y V-110 (librería de interfaz y de gráficos).
- Amenazas A-07, A-14 y A-15 de `docs/SEGURIDAD.md`.
- Skill `version-prompt`, apartado «Publicar» (criterios de promoción).
- `docs/DISENO.md`: página «Versiones», principio «nada que no sea verdad», estados obligatorios, gráficos con tabla equivalente, accesibilidad y formatos.
- Contrato `contratos/informe.schema.json`: los únicos datos de los que salen las cifras.
- Modelo de referencia `docs/MODELO-DATOS.sql`, en estado PROPUESTA: su vista de métricas por versión orienta, no obliga (ver cuestiones abiertas 4 y 7).

**Supuestos sobre otras fases y funciones (a confirmar con coordinación)**

- La fase 2 guarda solo informes validados, uno por ejecución y sin duplicados, con el momento de recepción, el cliente y la versión servida en esa ejecución, y aplica el aislamiento por cliente en la base de datos.
- La fase 3 entrega el panel superadmin con doble factor obligatorio y su sistema de diseño, incluida la página «Versiones».
- La función 030 entrega el registro de versiones y el historial de publicaciones por canal, con sus fechas, de los que salen la versión vigente de cada canal y la ventana de la comparación.
- La función 032 decide si las discrepancias de versión o los códigos nuevos son también alertas; esta función no las genera.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
