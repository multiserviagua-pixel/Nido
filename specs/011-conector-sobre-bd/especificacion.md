# 011 · Conector sobre la base de datos

Estado: PROPUESTA
Fase: 2 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

En la fase 1 las tres herramientas del conector (`obtener_instrucciones`, `enviar_informe`, `confirmar_orden`) funcionan con datos ficticios. Esta función hace que trabajen sobre la base de datos definitiva, de modo que cada agente reciba el estado, la versión del prompt, las reglas y las órdenes de su propio cliente, y que sus informes queden guardados y su ejecución cerrada.

El conector es la frontera por la que entran datos del agente y salen instrucciones hacia él. Por eso esta función convierte en requisitos comprobables la privacidad (artículo 1), el aislamiento entre clientes (artículo 2), el cierre en fallo (artículo 3) y el trato de toda entrada como dato (artículo 7).

Parte de que la petición llega con un token de acceso que es válido o no lo es: cómo se emite, se valida como flujo OAuth y se rota es de la función 014.

## Quién la usa y cómo

- Como **agente de correo de un cliente**, quiero recibir en cada revisión un estado explícito y, solo si puedo trabajar, mis instrucciones y reglas, para no tocar el correo cuando no debo.
- Como **agente de correo de un cliente**, quiero enviar mi informe de cifras y confirmar las órdenes que recibo, sin que una repetición o un reintento dupliquen nada.
- Como **responsable de HumanaIA**, quiero que un cliente nunca pueda leer ni escribir nada de otro a través del conector, y que ningún fallo entregue instrucciones, para poder ofrecer el servicio a varios clientes con garantías.
- Como **persona de operación**, quiero registros que me digan qué herramienta respondió qué y con qué código, sin ningún dato recibido, para diagnosticar sin tratar datos de terceros.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo.

**Identidad del conector ante la base de datos**

| ID | Requisito |
| --- | --- |
| REQ-001 | El conector accede a la base de datos con una identidad propia, distinta de la de los dashboards y de cualquier credencial administrativa, cuyo único permiso efectivo es ejecutar las tres operaciones del conector (obtener instrucciones, enviar informe y confirmar orden). |
| REQ-002 | Esa identidad no puede leer, insertar, modificar ni borrar directamente ninguna tabla ni vista, no puede ejecutar ninguna otra función (tampoco las de apoyo que resuelven el token o la vigencia de una licencia) y no puede crear ni alterar objetos. |
| REQ-003 | Ninguna parte del conector usa la clave secreta del proyecto ni otra credencial con más privilegios que la identidad de REQ-001, tampoco como reserva cuando esa identidad falla. |
| REQ-004 | En cada llamada, la conexión, la licencia y el cliente se derivan del token dentro de la base de datos. Ninguna herramienta acepta como entrada un identificador de cliente, de licencia ni de conexión. |
| REQ-005 | El token en claro no se envía a la base de datos ni se guarda en ella: solo viaja la huella del token que fija el modelo de referencia (ADR-0003, punto 4). |

**`obtener_instrucciones`**

| ID | Requisito |
| --- | --- |
| REQ-006 | Toda llamada autorizada devuelve exactamente uno de los estados `activa`, `pausada` o `suspendida` y un identificador de ejecución nuevo, con la forma de `contratos/obtener-instrucciones.schema.json`. |
| REQ-007 | El estado se decide con esta precedencia: `suspendida` si la licencia no está vigente (estado, estado manual o caducidad) o el cliente está de baja; si no, `pausada` si hay pausa global, si la última orden no anulada del cliente es `pausar` o si no hay versión que servir al canal del cliente; en cualquier otro caso, `activa`. |
| REQ-008 | Solo con `activa` la respuesta incluye instrucciones: versión, huella, texto del prompt y reglas del cliente. Con `pausada` o `suspendida`, las instrucciones son nulas. |
| REQ-009 | La versión servida es la vigente del canal del cliente (`prueba` o `estable`), es decir, la última publicada en ese canal. Un cliente del canal `estable` nunca recibe una versión publicada solo en `prueba`. |
| REQ-010 | El texto del prompt se entrega idéntico al registrado, y la huella entregada es la SHA-256 de ese mismo texto. Si texto y huella no se corresponden, no se entregan instrucciones. |
| REQ-011 | Las reglas entregadas son las del cliente del token, con las claves y rangos del contrato. Nunca las de otro cliente. |
| REQ-012 | Si la orden más reciente no anulada del cliente está sin confirmar, la respuesta la incluye con su identificador y su tipo, y una orden pendiente pasa a constar como entregada. Una orden confirmada o anulada no se vuelve a entregar. En qué estados se incluye la orden depende de la cuestión abierta 1. |
| REQ-013 | Cada llamada autorizada abre una ejecución ligada a la conexión del token, a su cliente, al estado servido y, solo si el estado es `activa`, a la versión servida. |
| REQ-014 | Las escrituras de una llamada (abrir la ejecución y marcar la orden como entregada) ocurren todas o ninguna. Una llamada que no termina no deja ninguna a medias. |

**`enviar_informe`**

| ID | Requisito |
| --- | --- |
| REQ-015 | El informe se valida contra `contratos/informe.schema.json` (tipos, rangos, listas cerradas, campos obligatorios y formato de la versión) después de descartar los campos ajenos, también los que vengan dentro de `comprobaciones`. |
| REQ-016 | De los campos ajenos solo se guarda y se devuelve cuántos eran. Ni sus nombres ni sus valores se guardan, se registran ni se devuelven. |
| REQ-017 | La ejecución indicada tiene que existir y haber sido abierta por la misma conexión que el token. Si no es así, la respuesta es `ejecucion_desconocida`, idéntica tanto si no existe, como si es de otra conexión del mismo cliente o de otro cliente. |
| REQ-018 | Un informe válido se guarda una sola vez, ligado al cliente y a la ejecución derivados del token, y la ejecución queda cerrada con la hora de recepción. |
| REQ-019 | Repetir el envío con la misma ejecución no crea otro informe ni modifica el guardado ni la hora de cierre, y la respuesta indica que es repetido. |
| REQ-020 | Un informe inválido no se guarda, la respuesta es `informe_invalido` sin el valor recibido ni el campo que falló, y la ejecución sigue abierta para que el agente pueda reintentar. |

**`confirmar_orden`**

| ID | Requisito |
| --- | --- |
| REQ-021 | Confirma una orden sin confirmar del cliente del token y anota la hora de la confirmación. Cualquier conexión del mismo cliente puede confirmarla. |
| REQ-022 | Confirmar de nuevo una orden ya confirmada responde que está confirmada y que es repetida, y no cambia la hora de la primera confirmación. |

**Cierre en fallo**

| ID | Requisito |
| --- | --- |
| REQ-023 | Si la base de datos no reconoce el token (revocado o caducado entre la validación y la operación), la respuesta es la misma que para un token inválido y no se abre ejecución ni se escribe nada. |
| REQ-024 | Si la base de datos no responde, tarda más del límite fijado, devuelve un error inesperado o la identidad del conector no tiene permiso, la herramienta responde con un error de código cerrado, sin prompt, reglas, orden ni otros datos. `obtener_instrucciones` nunca responde `activa` en esos casos. |
| REQ-025 | Ante un dato incoherente (falta la fila de ajustes globales, la licencia apunta a un cliente inexistente, la publicación vigente apunta a una versión inexistente, la huella no corresponde al texto, un estado fuera de su lista), `obtener_instrucciones` no responde `activa` ni entrega instrucciones. |
| REQ-026 | Si falta configuración que el conector necesita (credencial de acceso a la base de datos o secreto con el que calcula la huella del token), todas las llamadas se rechazan. No existe un modo degradado que entregue instrucciones. |

**Registros, errores y privacidad**

| ID | Requisito |
| --- | --- |
| REQ-027 | Cada llamada deja un registro con estos campos y ninguno más: ruta, herramienta, resultado, código y duración. |
| REQ-028 | Ni los registros, ni los errores, ni la supervisión contienen argumentos o valores recibidos, nombres de campos ajenos, cabeceras, tokens ni sus huellas, mensajes de error de la base de datos sin tratar ni el texto del prompt. |
| REQ-029 | Las respuestas de error llevan un código de lista cerrada y nada más: ni trazas, ni mensajes internos, ni el valor recibido. |
| REQ-030 | Cada respuesta contiene solo los campos de su contrato. La mayor posible es la de `obtener_instrucciones` en estado `activa`, acotada por el tamaño máximo del prompt del contrato. |
| REQ-031 | Del informe solo se guardan los campos del contrato y la cifra de campos descartados. Ningún campo guardado admite texto libre. |

**Límites de uso**

| ID | Requisito |
| --- | --- |
| REQ-032 | Cada conexión tiene un límite de peticiones por ventana de tiempo. Superado el límite, la petición se rechaza con un código cerrado, sin ejecutar ninguna operación ni abrir ejecución, y las demás conexiones no se ven afectadas. |
| REQ-033 | Si no se puede comprobar el límite de peticiones, la petición se deniega. |
| REQ-034 | Una petición que supera el tamaño máximo admitido se rechaza sin procesarla y sin registrar su contenido. |

**Entradas no confiables, anotaciones, operación y vuelta atrás**

| ID | Requisito |
| --- | --- |
| REQ-035 | Ningún valor recibido, tampoco la versión que declara el informe ni un campo ajeno, cambia el cliente, la conexión, el canal, la versión servida, el estado servido ni las reglas de ninguna llamada posterior. |
| REQ-036 | Las tres herramientas declaran las anotaciones de su contrato en `contratos/`, con lo que decida la función 001 sobre la de solo lectura de `obtener_instrucciones`. No se cambia una anotación para evitar una confirmación del asistente. |
| REQ-037 | `obtener_instrucciones` cumple el objetivo de latencia del servicio. |
| REQ-038 | El paso del conector de datos ficticios a la base de datos tiene una vuelta atrás descrita y probada. Durante la vuelta atrás y después de ella, el conector sigue cerrando en fallo. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-039 | Petición sin token, con token caducado, revocado o de otro recurso | No se ejecuta ninguna operación de la base de datos ni se escribe nada; no se abre ejecución. La respuesta HTTP la fija la función 014 |
| REQ-040 | Token de un cliente B usado contra datos del cliente A: ejecución de A en `enviar_informe`, orden de A en `confirmar_orden` | B no recibe prompt, reglas, orden ni ejecución de A; no se guarda informe ni se confirma orden de A; los datos de A quedan sin cambios |
| REQ-041 | Token de otra conexión del mismo cliente en `enviar_informe` | `ejecucion_desconocida`; no se guarda informe y la ejecución original sigue abierta |
| REQ-042 | Campos de más: en la raíz del informe, dentro de `comprobaciones` y como argumentos de cualquier herramienta, incluido un identificador de cliente, licencia o conexión | No influyen en el resultado; sus nombres y valores no aparecen en la base de datos, los registros ni la respuesta. Si se cuentan o se rechazan los argumentos ajenos fuera del informe depende de la cuestión abierta 20 |
| REQ-043 | Tipos y rangos inválidos: texto donde va una cifra, cifra como texto, booleano como texto, decimal, negativo, por encima del máximo, valor fuera de su lista, versión con letras o de más de 12 caracteres, campo obligatorio ausente | `informe_invalido`; nada guardado; ejecución abierta; sin eco del valor |
| REQ-044 | Repetición de cada herramienta | `enviar_informe` y `confirmar_orden` no duplican ni modifican lo anterior; `obtener_instrucciones` se comporta según la cuestión abierta 9 |
| REQ-045 | Dos revisiones simultáneas de la misma conexión, y dos envíos o confirmaciones simultáneos de lo mismo | Cada `obtener_instrucciones` recibe una ejecución distinta y un estado coherente; de dos informes simultáneos para la misma ejecución se guarda exactamente uno; una orden confirmada a la vez desde dos llamadas queda confirmada una sola vez |
| REQ-046 | Base de datos caída, lenta o devolviendo error | Error de código cerrado; nunca `activa`; nunca prompt, reglas, orden ni datos |
| REQ-047 | La identidad del conector pierde el permiso de ejecutar una operación | Error de código cerrado; no se recurre a otra credencial |
| REQ-048 | Llamada directa a las operaciones del conector por la API pública o por SQL con los roles `anon` o `authenticated` (sesión de cliente y sesión de superadmin con doble factor) | Denegada siempre, también para las funciones de apoyo |
| REQ-049 | Llamada directa con la identidad del conector y una huella inventada o de un token caducado; intento de leer cualquier tabla con esa identidad | Respuesta de no autorizado sin escribir nada; la lectura se deniega |
| REQ-050 | Un valor recibido que provoca un error en la base de datos y aparecería en su mensaje | El valor no llega a la respuesta, a los registros ni a la supervisión |
| REQ-051 | `confirmar_orden` con una orden inexistente, de otro cliente, anulada o con identificador mal formado | No se confirma; no se modifica ninguna orden; la respuesta para una orden inexistente y para una de otro cliente es idéntica |
| REQ-052 | Licencia no vigente, cliente de baja, pausa global, última orden `pausar` o canal sin versión | Estado explícito sin prompt ni reglas |
| REQ-053 | Conexión que supera su límite de peticiones | Rechazo con código cerrado, sin operación, sin ejecución abierta; las demás conexiones siguen funcionando |
| REQ-054 | Petición que supera el tamaño máximo admitido | Rechazo sin procesar ni registrar su contenido; nada escrito |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. «Valor canario» es un texto reconocible y ficticio que se busca después en la respuesta, en la base de datos, en los registros y en la supervisión (skill `revision-privacidad`). Las pruebas usan dos clientes ficticios A y B, dos conexiones de A (A1 y A2) y una de B.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Una prueba automática enumera los privilegios efectivos de la identidad del conector: exactamente 3 funciones ejecutables, 0 privilegios sobre tablas y vistas, 0 sobre otras funciones y 0 para crear o alterar objetos | REQ-001, REQ-002 |
| CA-002 | La búsqueda en el código del conector encuentra 0 usos de la clave secreta o de credenciales administrativas, y con el permiso de ejecución retirado a la identidad del conector el 100 % de las llamadas de prueba devuelven error cerrado sin datos y sin recurrir a otra credencial | REQ-003, REQ-047 |
| CA-003 | Matriz de aislamiento con A1, A2 y B sobre las tres herramientas: 0 lecturas y 0 escrituras cruzadas, y los datos de A son idénticos antes y después de todas las llamadas hechas con el token de B | REQ-004, REQ-040 |
| CA-004 | Los contratos de entrada de las tres herramientas tienen 0 campos de identificación de cliente, licencia o conexión, y las llamadas que añaden esos argumentos con valores de otro cliente devuelven el mismo resultado que sin ellos en el 100 % de los casos | REQ-004, REQ-035, REQ-042 |
| CA-005 | Tras un ciclo completo con un token de prueba, el token en claro aparece 0 veces en la base de datos y en los registros, y su huella aparece 0 veces en los registros | REQ-005, REQ-028 |
| CA-006 | Una prueba por cada combinación de licencia (activa, suspendida, forzada activa, forzada suspendida, caducada), cliente (activo, baja), pausa global (sí, no), última orden (`pausar`, `reanudar`, ninguna, anulada) y versión publicada (sí, no): el estado coincide con la precedencia de REQ-007 en el 100 % de los casos, y las instrucciones solo son no nulas con `activa` | REQ-006, REQ-007, REQ-008, REQ-052 |
| CA-007 | Con versiones distintas publicadas en `prueba` y en `estable`, el 100 % de las llamadas de un cliente de `prueba` reciben la de `prueba` y el 100 % de las de un cliente de `estable` reciben la de `estable`, también después de una publicación nueva en `prueba` | REQ-009 |
| CA-008 | En el 100 % de las respuestas `activa` de la batería, la huella entregada es la SHA-256 del texto entregado y el texto es idéntico al registrado; con un dato de prueba cuya huella no corresponde al texto, 0 respuestas llevan instrucciones | REQ-010, REQ-025 |
| CA-009 | A y B con reglas distintas reciben cada uno las suyas en el 100 % de las llamadas, y el 100 % de las reglas entregadas valida contra el contrato | REQ-011 |
| CA-010 | Una orden pendiente de A se entrega en la siguiente llamada de A y queda como entregada; una orden confirmada o anulada se entrega 0 veces; con dos órdenes sin anular solo se entrega la más reciente | REQ-012 |
| CA-011 | Tras 10 llamadas autorizadas existen exactamente 10 ejecuciones con conexión, cliente, estado y versión correctos; con un fallo provocado a mitad de la operación, quedan 0 ejecuciones y 0 órdenes escritas a medias | REQ-013, REQ-014 |
| CA-012 | Un informe válido con 3 campos ajenos en la raíz y 2 dentro de `comprobaciones`, todos con un valor canario y nombres reconocibles, se guarda y la respuesta indica 5 descartados; el valor canario y esos nombres aparecen 0 veces en la base de datos, en los registros, en la supervisión y en la respuesta (criterio 3 de la fase 2) | REQ-015, REQ-016, REQ-018, REQ-031, REQ-042 |
| CA-013 | Una batería con al menos un caso de cada tipo de REQ-043, todos con valor canario: el 100 % se rechaza con `informe_invalido`, se guardan 0 informes, la ejecución sigue abierta y el canario aparece 0 veces en la respuesta, los registros, la supervisión y la base de datos | REQ-020, REQ-043, REQ-050 |
| CA-014 | `enviar_informe` con una ejecución inexistente, con una de A2 usando el token de A1 y con una de A usando el token de B: las tres respuestas son idénticas (`ejecucion_desconocida`), se guardan 0 informes y las ejecuciones afectadas siguen abiertas | REQ-017, REQ-041 |
| CA-015 | Enviar dos veces el mismo informe deja 1 informe, la segunda respuesta indica repetido, y el informe y la hora de cierre no cambian; confirmar dos veces la misma orden deja la hora de la primera confirmación sin cambios y la segunda respuesta indica repetida | REQ-019, REQ-022, REQ-044 |
| CA-016 | 20 envíos simultáneos del mismo informe dejan exactamente 1 informe y exactamente 1 respuesta no repetida; 2 llamadas simultáneas a `obtener_instrucciones` de A1 abren 2 ejecuciones distintas; 10 confirmaciones simultáneas de la misma orden dejan 1 sola hora de confirmación y el 100 % de las respuestas dicen confirmada | REQ-045 |
| CA-017 | `confirmar_orden` con una orden sin confirmar de A y el token de A1 o de A2 la confirma; con una orden inexistente, una de B, una anulada y un identificador mal formado se modifican 0 órdenes, y las respuestas para la inexistente y la de B son idénticas | REQ-021, REQ-051 |
| CA-018 | Con la base de datos inaccesible, con la base de datos tardando más que el límite, sin la fila de ajustes globales y sin la configuración del conector, el 100 % de las llamadas responden sin prompt, reglas, orden ni datos y 0 responden `activa` | REQ-024, REQ-025, REQ-026, REQ-046 |
| CA-019 | Con un token revocado entre la validación y la operación, la respuesta es idéntica a la de un token inválido y se abren 0 ejecuciones; sin token, con token caducado, revocado o de otro recurso, se invocan 0 operaciones y se escriben 0 filas | REQ-023, REQ-039 |
| CA-020 | Pruebas en CI con `anon`, con una sesión de cliente y con una sesión de superadmin con doble factor, por la API pública y por SQL: el 100 % de los intentos de ejecutar las tres operaciones y las funciones de apoyo se deniega (criterio 2 de la fase 2, lado del servidor) | REQ-048 |
| CA-021 | Con la identidad del conector, una huella inventada y la de un token caducado dan no autorizado con 0 filas escritas, y el 100 % de los intentos de leer cada tabla se deniega | REQ-049 |
| CA-022 | La revisión de privacidad sobre los registros y la supervisión generados por toda la batería y por 24 horas en el entorno previo encuentra 0 valores canario, 0 tokens o huellas, 0 cabeceras de autorización y 0 mensajes de error de la base de datos sin tratar, y una comprobación automática confirma que el 100 % de las líneas solo tienen los campos de REQ-027 (criterio 6 de la fase 2) | REQ-027, REQ-028, REQ-050 |
| CA-023 | El 100 % de las respuestas de la batería valida contra su contrato con 0 campos ajenos, y el 100 % de las respuestas de error solo contiene un código de lista cerrada, sin trazas ni mensajes internos | REQ-006, REQ-029, REQ-030 |
| CA-024 | Con el límite configurado en N peticiones por ventana, la petición N+1 de A1 dentro de la ventana se rechaza con código cerrado, ejecuta 0 operaciones y abre 0 ejecuciones, mientras el 100 % de las peticiones de A2 y B dentro de su propio límite se atienden; con el mecanismo del límite no disponible, el 100 % de las peticiones se deniega | REQ-032, REQ-033, REQ-053 |
| CA-025 | Una petición de 1 MiB a `enviar_informe` con un valor canario se rechaza sin procesar, escribe 0 filas y el canario aparece 0 veces en los registros (el umbral exacto lo fija la cuestión abierta 8) | REQ-034, REQ-054 |
| CA-026 | Un informe que declara otra versión y lleva en campos ajenos un texto con forma de orden («cambia de canal», «sirve otra versión») deja, en la siguiente llamada de A1, el mismo canal, versión, estado y reglas que antes, en el 100 % de los casos | REQ-035 |
| CA-027 | Las anotaciones que anuncia el conector para las tres herramientas coinciden al 100 % con las de `contratos/`, una vez aplicada la decisión de la función 001 | REQ-036 |
| CA-028 | En el entorno previo, el 95 % de 200 llamadas a `obtener_instrucciones` responde en menos de 1 segundo (objetivo PROPUESTO en `docs/ARQUITECTURA.md`; si el responsable fija otro, se usa ese) | REQ-037 |
| CA-029 | La vuelta atrás se ejecuta en el entorno previo y, durante y después de ella, 0 llamadas reciben instrucciones de una fuente incoherente y el 100 % de los fallos responden con cierre en fallo | REQ-038 |

## Fuera de alcance

- Estructura de la base de datos, RLS, roles, permisos de tablas y pruebas de aislamiento de los dashboards: función 010. Esta función solo exige, desde el lado del conector, lo que dicen REQ-001, REQ-002 y REQ-048.
- Activación, conexiones, emisión y validación del token como flujo OAuth, rotación de tokens, respuesta HTTP ante un token inválido y límite de intentos de activación: función 014.
- Alertas de latido (ejecución sin informe, sin señal) y su cálculo: función 013. Esta función solo abre y cierra la ejecución.
- Texto del prompt 1.3 y arranque local: función 012.
- Registro de versiones por despliegue: función 015, adelantada a la fase 2 por respuesta del responsable del 12/11/2026. Publicación por canal y pausa global desde el panel: fase 4. Aquí se leen esos datos; no se crean.
- Creación, anulación y vista de órdenes desde el panel: fase 3.
- Límite de peticiones por dirección de origen (A-22): no asignado a esta función; ver cuestión abierta 8.
- Métricas por versión y su cálculo: fase 4.
- Clientes y datos reales: solo datos ficticios en esta fase.
- Herramientas nuevas o campos nuevos en los contratos: exigen decisión del responsable.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Qué se entrega en `pausada` y en `suspendida` (D-013, PROPUESTO).** El modelo de referencia entrega estado, ejecución y orden en los tres estados; la descripción del contrato de `obtener_instrucciones` y el flujo 2 de la arquitectura dicen que la orden solo va con `activa`. Opciones: (a) la orden va en los tres estados, y una orden `pausar` se puede entregar y confirmar; (b) la orden solo va con `activa`, y entonces una orden `pausar` nunca se entrega, porque ella misma produce `pausada`, y nunca se confirma; (c) la orden va con `activa` y `pausada` pero no con `suspendida`, y una licencia suspendida deja sus órdenes sin entregar. Queda también sin resolver qué hace el agente si su dueño le pide en conversación que revise estando en pausa. **Respondida en parte el 12/11/2026:** en ese caso el agente no revisa. Sigue abierto en qué estados va la orden.
2. **Tres herramientas o dos (D-009).** Si la prueba de la fase 1 obliga a unir `confirmar_orden` dentro de `enviar_informe`, REQ-021, REQ-022 y REQ-051 pasan a `enviar_informe` y cambia su contrato; si se mantienen tres, esta especificación vale tal como está.
3. **Anotación de solo lectura de `obtener_instrucciones`.** Escribe (abre ejecución, marca la orden como entregada) y se declara de solo lectura. Opciones: mantenerla, a riesgo de declarar algo que no es cierto; quitarla, a riesgo de que el asistente pida confirmación en la ejecución desatendida; o separar las escrituras en otra operación, lo que exige otra herramienta o cambiar el contrato. Lo decide la función 001; esta función lo hereda.
4. **Código de problema desconocido en el informe.** El contrato rechaza el informe entero si trae un código fuera del catálogo, más de 5 o repetidos; el modelo descarta los desconocidos e inactivos, quita los repetidos y se queda con 5. Opciones: (a) rechazar el informe entero, con lo que el agente que use un código nuevo pierde todo el informe y la ejecución queda abierta; (b) descartar solo el código, con lo que el informe se guarda pero se pierde ese problema sin dejar rastro; (c) descartarlo y sumarlo a los campos descartados, con lo que queda la cifra pero no cuál era.
5. **Valores con mayúsculas.** El contrato solo admite los valores exactos de cada lista; el modelo los pasa a minúsculas antes de guardar. Opciones: rechazar `OK` o `Claude` como inválidos, lo que puede tumbar informes por una diferencia de escritura; o aceptarlos normalizados, lo que se aparta del contrato y hay que anotar en él.
6. **Plazo máximo para el informe.** Hoy una ejecución se puede cerrar con un informe en cualquier momento. Opciones: sin plazo, con lo que un informe de hace días se mezcla con revisiones posteriores y puede llegar después de la alerta de la función 013; con un plazo fijo o ligado a la frecuencia del cliente, pasado el cual el informe se rechaza con un motivo nuevo que habría que añadir al contrato.
7. **Versión declarada en el informe distinta de la servida.** Opciones: guardar la declarada sin más, que es lo que usan las métricas por versión (ADR-0005), aunque pueda no ser la que se sirvió; guardarla y marcar la discrepancia, lo que exige un campo nuevo en el modelo; o rechazar el informe, con lo que un agente con una copia antigua pierde el informe entero.
8. **Umbrales de uso.** Hay que fijar cuántas peticiones por conexión y en qué ventana, el tamaño máximo de una petición y quién se ocupa del límite por dirección de origen que pide A-22 (esta función, la 014 o ninguna en la fase 2). Un límite bajo puede cortar reintentos legítimos del agente; uno alto protege poco; dejar el de origen sin dueño deja A-22 sin cubrir.
9. **Llamadas repetidas a `obtener_instrucciones`.** Cada llamada abre una ejecución nueva, y un agente que reintenta deja ejecuciones abiertas que nunca recibirán informe. Opciones: (a) abrir siempre una nueva, con lo que la función 013 verá ejecuciones sin informe que no son fallos reales; (b) reutilizar la abierta de la misma conexión durante un tiempo, con lo que dos revisiones legítimas simultáneas comparten ejecución; (c) cerrar como abandonadas las anteriores al abrir otra, lo que exige un estado nuevo en el modelo.
10. **Informe y confirmación con licencia no vigente.** El contrato dice que el informe se envía también si se está en pausa, y el modelo acepta informes y confirmaciones con la licencia suspendida. Opciones: aceptarlos, lo que da visibilidad de lo que hizo el agente antes de la suspensión; o rechazarlos, lo que deja de recibir datos de un cliente que quizá no paga y deja sus ejecuciones abiertas.
11. **Qué versión sirve el conector en la fase 2.** El registro por despliegue llega en la fase 4. Opciones: (a) una versión ficticia cargada con los datos de prueba en desarrollo y previo, con lo que en producción no hay nada que servir; (b) adelantar a la fase 2 un registro mínimo por despliegue, lo que toca el alcance de la fase 4 y del ADR-0005; (c) no servir ninguna, con lo que todos los clientes quedan en `pausada` hasta la fase 4. **Respondida el 12/11/2026:** opción (b), se adelanta a la fase 2 un registro mínimo por despliegue. Lo especifica la función 015.
12. **Canal `prueba` sin versión publicada.** El modelo sirve entonces la de `estable`. Opciones: mantener ese respaldo, con lo que un cliente de prueba recibe sin aviso la estable; o responder `pausada`, con lo que los clientes de prueba se paran cada vez que no haya nada en su canal.
13. **Si la conexión con una identidad propia no es viable (V-107).** El plan alternativo del ADR-0003 es usar la clave secreta en un módulo exclusivo del conector, lo que contradice la regla del conector («nunca la clave secreta») y REQ-002 y REQ-003, porque esa clave puede leer todas las tablas. Opciones: aceptar ese plan como riesgo, con lo que el aislamiento depende de que el código solo llame a las tres operaciones; buscar otra forma de conexión, con su coste y su plazo; o no pasar el conector a la base de datos hasta resolverlo, lo que retrasa la fase 2.
14. **Respuesta cuando no se puede calcular el estado.** El contrato exige un identificador de ejecución en toda respuesta de `obtener_instrucciones`, y con la base de datos caída no se puede abrir ninguna. Opciones: (a) error de la herramienta con código cerrado y sin estado, lo que no cumple «siempre un estado explícito»; (b) un estado `pausada` sin ejecución, lo que obliga a cambiar el contrato; (c) para datos incoherentes con la base de datos disponible, responder `pausada` con ejecución, pero entonces el agente no distingue una pausa real de un fallo.
15. **Cliente sin reglas guardadas.** El modelo entrega entonces unos valores por defecto (30 correos, 3 días, todo activado). Opciones: mantenerlos, lo que deja trabajar a un cliente cuyas reglas no se han revisado; o tratarlo como dato incoherente y no responder `activa`, lo que obliga a crear las reglas de cada cliente antes de activarlo.
16. **Qué órdenes se pueden confirmar.** El modelo confirma cualquier orden sin confirmar del cliente, también una pendiente que todavía no se ha entregado o una antigua a la que ya ha sustituido otra más reciente. Opciones: admitir solo la orden entregada más reciente, lo que hace fallar confirmaciones tardías; o admitir cualquiera sin confirmar, lo que puede dar por aplicada una orden que el agente no ha recibido.
17. **Licencia revocada.** El modelo no reconoce el token de una licencia revocada, así que el agente recibe «no autorizado» y no el estado `suspendida`, mientras que un cliente de baja sí recibe `suspendida`; el criterio 4 de la fase 1 dice que una licencia no activa recibe el estado. Opciones: tratar la revocada como token inválido, con lo que el asistente intentará volver a autorizarse; o responder `suspendida`, lo que mantiene viva la conexión de una licencia revocada.
18. **Identificadores en los registros.** Opciones: no registrar ningún identificador de cliente ni de conexión, lo que dificulta diagnosticar a un cliente concreto; o registrar el de la conexión o el del cliente derivados (no recibidos), lo que liga los registros a cada cliente y amplía lo que hay que proteger y conservar.
19. **Quién escribe las operaciones del conector en la base de datos.** Las tres operaciones y la identidad del conector están entre la función 010 (roles, permisos) y esta. Opciones: las escribe la 010 y esta solo las usa y las prueba, con lo que su comportamiento depende del diseño de otra función; o las escribe esta y la 010 solo concede permisos, con lo que hay dos funciones tocando la misma migración.
20. **Argumentos ajenos fuera del informe.** Los contratos de entrada de las tres herramientas no admiten campos adicionales, mientras que la regla del conector dice que lo desconocido se descarta y se cuenta. Opciones: rechazar la llamada, con lo que un asistente que añada un argumento propio hace fallar la revisión; o descartarlos y contarlos, lo que exige decir dónde se cuentan en `obtener_instrucciones` y `confirmar_orden`, que no tienen esa cifra.
21. **Objetivo de latencia.** El de 1 segundo para el 95 % de las llamadas es PROPUESTO y se fija en la fase 4. Opciones: usarlo ya como umbral de esta función, a riesgo de cambiarlo luego; o dejar REQ-037 sin umbral hasta la fase 4, con lo que CA-028 no se puede cerrar en esta fase.

## Dependencias y decisiones relacionadas

- Constitución: artículos 1, 2, 3, 4, 7, 9, 10, 11 y 13.
- Decisiones: D-008, D-009 (pendiente de la fase 1), D-013 (PROPUESTO), T-005, T-007, T-008; en VERIFICAR: V-107 (identidad propia del conector), V-112 (supervisión sin cuerpos), V-113 (mecanismo de límites).
- Función 001: decisión de sí o no por asistente y planes B; decisión sobre D-009; anotación de solo lectura de `obtener_instrucciones` (su cuestión abierta 3); qué se entrega en pausa (su cuestión abierta 4). Si la fase 1 cambia un contrato, esta especificación se revisa.
- Funciones de la fase 2, sin leerlas ni depender de su texto: 010 (estructura, roles y permisos), 013 (latido), 014 (token válido o no), 012 (prompt 1.3), 015 (registro por despliegue de las versiones que esta función sirve).
- ADR: 0003 (aislamiento por cliente, punto 4 y plan alternativo), 0004 (cierre en fallo y límites en el anfitrión), 0005 (versiones con huella, pausa global).
- Contratos: `contratos/informe.schema.json`, `contratos/obtener-instrucciones.schema.json`, `contratos/enviar-informe.schema.json`, `contratos/confirmar-orden.schema.json`.
- Modelo de referencia: `docs/MODELO-DATOS.sql`, apartados 5 (funciones `privado.mcp_*` y `privado.resolver_token`) y 8 (permisos).
- Seguridad: A-08, A-09, A-14, A-15, A-22 y las reglas para quien implementa de `docs/SEGURIDAD.md`.
- Criterios de la fase 2 que cubre: 2.º (lado del servidor, CA-020), 3.º (CA-012) y 6.º (CA-022).
- Propuestas de cambio a documentos compartidos: `specs/011-conector-sobre-bd/propuestas.md`.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
