# 030 · Versiones del prompt y canales de publicación

Estado: PROPUESTA
Fase: 4 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

El prompt es lo que siguen los agentes de todos los clientes dentro de sus cuentas de correo. Quien controle ese texto influye en todas esas cuentas a la vez (amenazas A-11 y A-12 de `docs/SEGURIDAD.md`). Esta función hace que cada versión del prompt entre solo desde el repositorio por el despliegue revisado, quede registrada con su huella y no se pueda cambiar después. Permite además que HumanaIA pruebe una versión nueva con un grupo reducido de clientes antes de servirla a todos, y que vuelva atrás sin desplegar. Cada publicación y cada vuelta atrás dejan rastro y generan un aviso fuera del panel, para que una cuenta de superadmin comprometida no pueda cambiar las instrucciones de los agentes sin que nadie se entere.

## Quién la usa y cómo

- Como **despliegue revisado de la rama principal**, quiero registrar las versiones nuevas del prompt con su huella y su commit, para que el panel solo pueda elegir entre textos que han pasado revisión.
- Como **superadmin de HumanaIA**, quiero ver qué versiones hay, cuál sirve cada canal y qué clientes están en cada uno, publicar una versión en `prueba`, promoverla a `estable` cuando haya cumplido su permanencia y volver atrás si algo va mal, para cambiar el comportamiento de los agentes con el menor riesgo posible.
- Como **destinatario del aviso de publicación**, quiero enterarme fuera del panel de cada publicación y cada vuelta atrás, para detectar una publicación que no esperaba aunque la cuenta que la hizo esté comprometida.
- Como **responsable de HumanaIA**, quiero poder demostrar que ninguna versión registrada ha cambiado y que lo registrado coincide con el repositorio, para confiar en lo que reciben los agentes.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo. Cuando un umbral lo tiene que fijar el responsable, el requisito remite a la cuestión abierta que lo fija.

### Registro de versiones

| ID | Requisito |
| --- | --- |
| REQ-001 | Cada despliegue a producción hecho desde la rama principal protegida registra toda versión del prompt presente en el repositorio que aún no esté registrada, con su número de versión, su texto íntegro, su huella (ADR-0005), el commit del que procede y la fecha de registro. |
| REQ-002 | El número de versión identifica una sola versión: no pueden existir dos versiones registradas con el mismo número. El formato del número es el que fije la cuestión abierta 14. |
| REQ-003 | La huella registrada es la del texto registrado, exacto, y coincide con la huella del archivo de esa versión en el commit registrado. |
| REQ-004 | Registrar es repetible sin efectos: volver a desplegar un commit sin versiones nuevas no crea registros ni altera los existentes. |
| REQ-005 | Solo el despliegue registra versiones. Ninguna sesión del panel, ninguna persona desde la interfaz, ningún usuario de cliente y el conector no pueden registrar una versión. |
| REQ-006 | La identidad con la que el despliegue registra versiones solo puede añadir versiones nuevas: no puede modificar ni borrar versiones, publicar, volver atrás, cambiar el canal de un cliente ni leer datos de clientes. |
| REQ-007 | Existe una comprobación de coincidencia que, para cada versión registrada, verifica que el texto guardado produce la huella registrada y que coincide con el archivo de esa versión en el repositorio. Se ejecuta en cada despliegue a producción y, además, con la periodicidad que fije la cuestión abierta 11. Su resultado, por versión y con fecha, queda anotado y se ve en el panel. |

### Inmutabilidad

| ID | Requisito |
| --- | --- |
| REQ-008 | Una vez registrada una versión, su número, su texto, su huella, su commit y su fecha de registro no se pueden modificar, y la versión no se puede borrar, por ninguna vía de la aplicación ni con ningún papel: usuario de cliente, superadmin con doble factor, conector, identidad del despliegue ni la clave de máximo privilegio de la aplicación. |
| REQ-009 | El panel no ofrece ningún medio de crear, editar, sustituir ni borrar el texto de una versión. |
| REQ-010 | El historial de publicaciones es de solo adición: ninguna publicación pasada se puede modificar ni borrar, por ninguna vía de la aplicación ni con ningún papel. |

### Canales

| ID | Requisito |
| --- | --- |
| REQ-011 | Existen exactamente dos canales: `prueba` y `estable`. |
| REQ-012 | Cada cliente pertenece en todo momento a uno y solo uno de los dos canales. El canal de un cliente nuevo es el que fije la cuestión abierta 6. |
| REQ-013 | Un superadmin con doble factor (o quien fije la cuestión abierta 6) puede cambiar el canal de un cliente. El cambio se aplica en la siguiente revisión del agente de ese cliente y queda en auditoría. |
| REQ-014 | La versión vigente de un canal es la de su publicación más reciente. En cada revisión, el agente de un cliente recibe la versión vigente del canal de ese cliente en ese momento, con la huella registrada de esa versión. |
| REQ-015 | Una publicación es indivisible para los agentes: cada revisión recibe completa la versión anterior o completa la nueva, nunca el texto de una con el número o la huella de otra, y la publicación no provoca errores en las revisiones que coinciden con ella. |

### Publicación y vuelta atrás

| ID | Requisito |
| --- | --- |
| REQ-016 | Un superadmin con doble factor puede publicar en `prueba` cualquier versión registrada cuya última comprobación de coincidencia sea correcta. |
| REQ-017 | Solo se puede publicar en `estable` una versión que haya estado vigente en `prueba` durante la permanencia mínima que fije la cuestión abierta 1, y que cumpla los criterios de promoción que fije la cuestión abierta 13. No hay excepción salvo la que fije, en su caso, la cuestión abierta 2. |
| REQ-018 | Las condiciones de REQ-016, REQ-017 y REQ-019 las comprueba el sistema en cada intento, con independencia de la interfaz: una petición que no pase por la pantalla del panel queda sujeta a las mismas condiciones. |
| REQ-019 | Publicar en `estable` exige la autorización que fije la cuestión abierta 3 (cualquier superadmin, solo el responsable o dos personas). |
| REQ-020 | La vuelta atrás es una publicación nueva, marcada como vuelta atrás, que hace vigente en un canal una versión que ya estuvo vigente antes en ese mismo canal, dentro del conjunto que fije la cuestión abierta 7. Se aplica en la siguiente revisión de cada agente del canal. |
| REQ-021 | El historial de cada canal muestra, por cada publicación y en el orden en que se aplicaron: canal, versión anterior, versión nueva, motivo (publicación o vuelta atrás), cuenta que la hizo y fecha y hora. |

### Aviso fuera del panel

| ID | Requisito |
| --- | --- |
| REQ-022 | Cada publicación y cada vuelta atrás, en cualquier canal, generan un aviso fuera del panel a los destinatarios, por el medio y en el plazo máximo que fije la cuestión abierta 4. |
| REQ-023 | El aviso indica, en español: canal, versión anterior y nueva con sus huellas, motivo, cuenta que la hizo, fecha y hora, y cuántos clientes hay en el canal. No contiene el texto del prompt, secretos, tokens, códigos ni datos de clientes o de correos. |
| REQ-024 | El aviso lo emite el sistema por sí mismo. Quien publica no puede omitirlo, retrasarlo ni redirigirlo desde el panel ni con su sesión. |
| REQ-025 | Los destinatarios del aviso no se pueden cambiar desde el panel ni con ninguna sesión de superadmin. Solo los cambia una persona en la configuración del entorno (artículo 14). |
| REQ-026 | Si el aviso no se puede enviar, el fallo queda en auditoría y se ve en el panel, y la publicación sigue la regla que fije la cuestión abierta 5. Un aviso que no ha salido nunca consta como enviado. |

### Auditoría y acceso

| ID | Requisito |
| --- | --- |
| REQ-027 | Quedan en auditoría, con actor, acción, objeto y fecha, y sin el texto del prompt: el registro de cada versión, cada resultado de la comprobación de coincidencia, cada publicación, cada vuelta atrás, cada cambio de canal de un cliente y cada fallo de envío del aviso. |
| REQ-028 | Los intentos rechazados de publicar, volver atrás o cambiar el canal de un cliente quedan anotados con actor, acción, motivo del rechazo de una lista cerrada y fecha, sin valores recibidos. |
| REQ-029 | Solo un superadmin con doble factor puede ver el registro de versiones, sus huellas, el historial de publicaciones y qué clientes están en cada canal. Si además puede leer el texto de una versión lo fija la cuestión abierta 9. |

### Pantalla del panel superadmin

| ID | Requisito |
| --- | --- |
| REQ-030 | La pantalla de versiones muestra: las versiones registradas con número, huella, commit, fecha de registro y resultado de la última comprobación de coincidencia; la versión vigente de cada canal y desde cuándo; los clientes de cada canal; el historial de publicaciones; y, para la versión vigente en `prueba`, cuánto le falta para cumplir la permanencia mínima. |
| REQ-031 | Antes de publicar, promover o volver atrás, el panel pide confirmación y dice qué va a pasar: canal, versión actual y versión nueva, número de clientes afectados y que se aplicará en la siguiente revisión de cada agente. Cancelar no cambia nada. |
| REQ-032 | La pantalla tiene estados de carga, vacío (con qué hacer a continuación), error (qué ha pasado y cómo reintentar), sin permiso y datos parciales. El resultado que muestra tras una acción es el que ha confirmado el sistema, no el que se esperaba. |
| REQ-033 | La pantalla cumple WCAG 2.2 AA, se puede usar entera con teclado y se usa en móvil. |
| REQ-034 | Todos los textos de la pantalla, de la confirmación, de los errores y del aviso están en español. |

### Transición, reversibilidad, privacidad y secretos

| ID | Requisito |
| --- | --- |
| REQ-035 | La versión que ya se sirve antes de que exista esta función (la 1.3, de la fase 2) queda incorporada al registro con su huella y como vigente en el canal o canales en que ya se servía, sin que cambie la versión ni la huella que recibe ningún agente. |
| REQ-036 | Los cambios que esta función introduce en los datos tienen vuelta atrás, y deshacerlos no pierde ni altera versiones registradas, historial de publicaciones ni auditoría. |
| REQ-037 | Nada de lo que esta función guarda, muestra o envía contiene contenido de correo ni datos personales de terceros. |
| REQ-038 | Ningún secreto (credenciales del despliegue, del aviso o de la base de datos) aparece en el repositorio, en los avisos, en la auditoría, en los registros del servidor ni en las evidencias. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-039 | Intento de modificar o borrar una versión registrada (cualquiera de sus datos), o de vaciar el registro, con cualquier papel: usuario de cliente, superadmin con doble factor, conector, identidad del despliegue, clave de máximo privilegio de la aplicación; desde el panel o con una llamada directa que no pase por la interfaz | Se rechaza, no cambia nada y el intento queda anotado |
| REQ-040 | El archivo de una versión ya registrada cambia en el repositorio, o se intenta registrar un número ya registrado con otro texto | No se registra ni se sustituye nada; la versión registrada sigue intacta; el despliegue no termina con éxito; la discrepancia queda anotada y se ve en el panel |
| REQ-041 | El archivo de una versión ya registrada desaparece del repositorio | La versión registrada sigue intacta; el despliegue no termina con éxito; la discrepancia queda anotada y se ve en el panel |
| REQ-042 | Un despliegue de vista previa o de una rama que no es la principal protegida intenta registrar versiones en producción | No puede: no se registra nada en producción |
| REQ-043 | La comprobación de coincidencia encuentra una versión cuyo texto guardado no produce su huella o no coincide con el repositorio | Esa versión no se puede publicar ni usar como destino de una vuelta atrás; queda anotado y se ve en el panel. Si es vigente en algún canal, se actúa según la cuestión abierta 11 |
| REQ-044 | Intento de publicar, promover o volver atrás sin sesión, con sesión de superadmin sin doble factor, como usuario de cliente, con la identidad del despliegue o con la del conector | Se rechaza; ningún canal cambia; no sale aviso de publicación; el intento queda anotado |
| REQ-045 | Intento de promover a `estable` antes de cumplir la permanencia mínima, desde el panel o con una llamada directa | Se rechaza; `estable` no cambia; el panel dice cuánto falta |
| REQ-046 | Intento de publicar en `estable` una versión que nunca ha estado vigente en `prueba` | Se rechaza, salvo la excepción que fije, en su caso, la cuestión abierta 2 |
| REQ-047 | Intento de publicar una versión no registrada o con un identificador inexistente | Se rechaza; ningún canal cambia |
| REQ-048 | Dos publicaciones o vueltas atrás simultáneas sobre el mismo canal | Se aplica exactamente una; la otra se rechaza indicando que el canal ha cambiado; hay una sola entrada de historial y un solo aviso por publicación aplicada |
| REQ-049 | La misma acción enviada dos veces (doble clic, reintento del navegador) | Se aplica una sola vez, con una sola entrada de historial y un solo aviso |
| REQ-050 | Intento de publicar en un canal la versión que ya es vigente en ese canal | Se rechaza; no hay entrada de historial ni aviso |
| REQ-051 | Intento de volver atrás en un canal que no tiene versión anterior | Se rechaza; el canal no cambia |
| REQ-052 | Intento de volver atrás a una versión que nunca ha estado vigente en ese canal | Se rechaza; la vuelta atrás no sirve para eludir la permanencia mínima |
| REQ-053 | Un canal sin ninguna publicación | Ningún agente recibe un texto no registrado ni inventado. Si no hay versión aplicable, el agente recibe un estado explícito y ninguna instrucción. Qué versión aplica a `prueba` vacío y qué estado se devuelve lo fija la cuestión abierta 10 |
| REQ-054 | Falla el envío del aviso | Según REQ-026: nunca en silencio, nunca consta como enviado |
| REQ-055 | Un usuario de cliente intenta leer versiones, textos, huellas, historial de publicaciones o qué clientes están en cada canal, por el dashboard, cambiando la URL o con una llamada directa | No obtiene nada: cero filas o acceso denegado |
| REQ-056 | Un usuario de cliente o el conector intentan cambiar el canal de un cliente, propio o ajeno | Se rechaza; el canal no cambia |
| REQ-057 | Petición de publicación con campos de más, con texto libre o con un texto o una huella aportados por quien llama | Lo ajeno se descarta o la petición se rechaza; nunca se publica ni se sirve un texto o una huella que no salgan del registro |
| REQ-058 | La base de datos o el servicio no responden, o fallan a mitad de una publicación | O el canal queda como estaba o la publicación queda completa, nunca a medias; el panel muestra el error; no sale aviso de una publicación que no se ha aplicado |
| REQ-059 | Intento de cambiar los destinatarios del aviso desde el panel o con una sesión de superadmin, también con una llamada directa | No es posible; los destinatarios no cambian |
| REQ-060 | La comprobación de coincidencia no se puede ejecutar (repositorio inaccesible, error a mitad) | Se anota como no superada, nunca como correcta; las versiones afectadas no se pueden publicar hasta que una comprobación posterior sea correcta |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Salvo que se diga otra cosa, se ejecutan en el entorno previo con datos ficticios.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Se despliega desde la rama principal un commit con una versión ficticia nueva: aparece exactamente un registro nuevo, con el número del archivo, el commit desplegado y una huella igual a la calculada por separado sobre el archivo en ese commit (1 de 1 coincide) | REQ-001, REQ-003 |
| CA-002 | Se despliega dos veces seguidas el mismo commit: 0 registros nuevos y 0 registros alterados (recuento y huellas idénticos antes y después) | REQ-004 |
| CA-003 | Se intenta registrar una versión con sesión de superadmin con doble factor, con usuario de cliente, con el conector y sin sesión: 4 de 4 intentos rechazados y 0 registros nuevos | REQ-005 |
| CA-004 | Con la identidad del despliegue se intenta modificar una versión, borrarla, publicar, volver atrás, cambiar el canal de un cliente y leer datos de clientes: 6 de 6 operaciones rechazadas | REQ-006 |
| CA-005 | La comprobación de coincidencia sobre un registro correcto anota «coincide» para el 100 % de las versiones, con fecha, y se ve en el panel. Con el archivo de una versión alterado en una copia de prueba del repositorio anota «no coincide» para esa versión. Con el repositorio inaccesible anota «no superada» y nunca «coincide» | REQ-007, REQ-060 |
| CA-006 | **Criterio del plan:** «El texto de una versión registrada no se puede modificar, tampoco desde el panel». Para cada dato de una versión (número, texto, huella, commit, fecha) y cada operación (modificar, borrar, vaciar el registro), con cada papel (usuario de cliente, superadmin con doble factor, conector, identidad del despliegue, clave de máximo privilegio de la aplicación), desde el panel y con llamada directa: el 100 % de los intentos se rechaza, la huella recalculada después es idéntica y la pantalla del panel no tiene ningún control de edición de texto (revisión de la interfaz) | REQ-008, REQ-009, REQ-039 |
| CA-007 | Se intenta modificar y borrar una publicación pasada con cada papel de CA-006: el 100 % de los intentos se rechaza y el historial queda idéntico | REQ-010 |
| CA-008 | Con 10 clientes ficticios, una consulta de control devuelve 0 clientes sin canal y 0 clientes en más de un canal; un intento de publicar en un canal que no sea `prueba` ni `estable` se rechaza | REQ-011, REQ-012 |
| CA-009 | Un superadmin con doble factor pasa el cliente A de `estable` a `prueba`: la siguiente revisión de A recibe la versión vigente de `prueba` y queda 1 fila de auditoría. Un usuario de A, un usuario de B y el conector intentan cambiar el canal de A y de B: 0 cambios | REQ-013, REQ-056 |
| CA-010 | **Criterio del plan:** «Publicar en `prueba` solo afecta a los clientes del canal de prueba». Con dos clientes en `prueba` y dos en `estable`, se publica en `prueba` una versión nueva: en su siguiente revisión, los 2 de `prueba` reciben la versión nueva con su huella registrada y los 2 de `estable` siguen recibiendo exactamente la versión y la huella anteriores (4 de 4) | REQ-014, REQ-016 |
| CA-011 | Se lanzan 500 revisiones concurrentes mientras se hacen 20 publicaciones alternas en el mismo canal: 0 respuestas en las que texto, número y huella no correspondan a la misma versión registrada y 0 errores causados por la publicación | REQ-015 |
| CA-012 | Una versión recién publicada en `prueba` se intenta promover a `estable` desde el panel y con una llamada directa con sesión de superadmin con doble factor: 2 de 2 rechazadas. Cumplidas la permanencia y los criterios fijados en las cuestiones abiertas 1 y 13 (con el reloj controlado en el entorno de prueba), la promoción se acepta. Una versión que nunca estuvo vigente en `prueba` se rechaza en `estable` | REQ-017, REQ-018, REQ-045, REQ-046 |
| CA-013 | Una cuenta que no cumple la autorización fijada en la cuestión abierta 3 intenta publicar en `estable`, desde el panel y con llamada directa: rechazada. La que la cumple: aceptada | REQ-019 |
| CA-014 | **Criterio del plan:** «La vuelta atrás se aplica en la siguiente revisión de cada agente». Con `estable` pasado de la versión V1 a la V2, se hace la vuelta atrás: aparece una entrada nueva marcada como vuelta atrás que apunta a V1, la siguiente revisión del 100 % de los agentes de `estable` recibe V1 con su huella, y `prueba` no cambia. Se ejecuta en el entorno previo y se guarda como evidencia de vuelta atrás probada (artículo 11) | REQ-020 |
| CA-015 | Tras una secuencia de 3 publicaciones y 1 vuelta atrás, el historial muestra las 4 entradas en orden, cada una con canal, versión anterior, versión nueva, motivo, cuenta y fecha, y coincide al 100 % con la auditoría | REQ-021 |
| CA-016 | Por cada publicación y vuelta atrás de CA-015 llega 1 aviso a cada destinatario dentro del plazo fijado en la cuestión abierta 4, con todos los datos de REQ-023. Una búsqueda en los avisos del texto del prompt, de los secretos de prueba y de los nombres de los clientes ficticios da 0 coincidencias | REQ-022, REQ-023 |
| CA-017 | La pantalla no tiene ningún control para omitir, retrasar o redirigir el aviso ni para cambiar destinatarios (revisión de la interfaz). Con sesión de superadmin con doble factor y llamada directa se intenta cambiar los destinatarios y publicar sin aviso: 0 cambios de destinatarios y el aviso sale igualmente | REQ-024, REQ-025, REQ-059 |
| CA-018 | Con el envío de avisos simulado como caído, se publica: el fallo queda en auditoría y se ve en el panel, la publicación sigue la regla de la cuestión abierta 5, y 0 avisos constan como enviados sin haber salido | REQ-026, REQ-054 |
| CA-019 | Tras un guion con 1 registro, 1 comprobación, 2 publicaciones, 1 vuelta atrás, 1 cambio de canal y 1 fallo de aviso hay exactamente una fila de auditoría por acción, con actor, acción, objeto y fecha, y 0 filas con texto del prompt. Cada intento rechazado de los casos negativos deja una anotación con motivo de la lista cerrada y sin valores recibidos | REQ-027, REQ-028 |
| CA-020 | Sin sesión, como usuario del cliente A y como superadmin sin doble factor se intenta leer versiones, textos, huellas, historial y clientes por canal, por el dashboard, cambiando la URL y con llamada directa: 0 filas o acceso denegado en el 100 % de los intentos (prueba automática de aislamiento) | REQ-029, REQ-055 |
| CA-021 | Se intenta publicar, promover y volver atrás sin sesión, como superadmin sin doble factor, como usuario de cliente, con la identidad del despliegue y con la del conector: el 100 % se rechaza, ningún canal cambia y no sale ningún aviso de publicación | REQ-044 |
| CA-022 | Con datos ficticios, la pantalla muestra todos los elementos de REQ-030, y la confirmación de REQ-031 aparece antes de publicar, promover y volver atrás con canal, versiones, número de clientes y momento de aplicación correctos. Cancelar deja 0 cambios | REQ-030, REQ-031 |
| CA-023 | Puerta P5: capturas de los estados de carga, vacío, error, sin permiso y datos parciales; revisión WCAG 2.2 AA sin hallazgos bloqueantes ni mayores; todas las acciones se completan solo con teclado; a 320 píxeles de ancho no hay desplazamiento horizontal y los objetivos táctiles miden al menos 24 por 24 píxeles; 0 textos visibles que no estén en español | REQ-032 a REQ-034 |
| CA-024 | Las revisiones de los agentes ficticios reciben la misma versión y la misma huella antes y después de poner en marcha esta función (100 %), y la versión previa figura en el registro con su huella y en el historial de su canal | REQ-035 |
| CA-025 | En el entorno previo se aplican los cambios de datos de la función, se deshacen y se vuelven a aplicar: el recuento y las huellas de las versiones, el historial y la auditoría son idénticos antes y después | REQ-036 |
| CA-026 | Revisión de privacidad (skill `revision-privacidad`) del registro, el historial, la auditoría, los avisos y los registros del servidor: 0 contenidos de correo ni datos de terceros. El escáner de secretos está en verde y una búsqueda de los secretos de prueba en avisos, auditoría, registros y evidencias da 0 coincidencias | REQ-037, REQ-038 |
| CA-027 | Se despliega un commit que modifica el archivo de una versión registrada y otro que lo borra: en los dos casos el despliegue no termina con éxito, 0 cambios en el registro y la discrepancia queda anotada y visible. Un intento de registrar un número existente con otro texto se rechaza | REQ-002, REQ-040, REQ-041 |
| CA-028 | Un despliegue de vista previa y otro de una rama no principal se ejecutan con una versión nueva: 0 registros nuevos en producción | REQ-042 |
| CA-029 | En una base de prueba en la que se fuerza que el texto de una versión no produzca su huella, la comprobación la marca y los intentos de publicarla o de volver atrás a ella se rechazan (2 de 2) | REQ-043 |
| CA-030 | Se intenta publicar una versión no registrada y un identificador inventado: 2 de 2 rechazados. Una petición de publicación con 3 campos de más, con texto libre y con un texto y una huella propios no publica nada que no salga del registro: la versión servida después tiene la huella registrada | REQ-047, REQ-057 |
| CA-031 | Se lanzan 50 veces dos publicaciones simultáneas sobre el mismo canal y 50 veces la misma acción enviada dos veces: en cada repetición hay exactamente 1 publicación aplicada, 1 entrada de historial y 1 aviso | REQ-048, REQ-049 |
| CA-032 | Publicar la versión ya vigente, volver atrás en un canal sin versión anterior y volver atrás a una versión que nunca estuvo vigente en ese canal: 3 de 3 rechazados, 0 entradas de historial y 0 avisos | REQ-050 a REQ-052 |
| CA-033 | En un entorno sin ninguna publicación, la revisión de un cliente de `estable` recibe un estado explícito y 0 instrucciones. Con `prueba` vacío se cumple la regla de la cuestión abierta 10. En ningún caso se sirve un texto que no esté registrado | REQ-053 |
| CA-034 | Se inyecta un fallo de la base de datos a mitad de una publicación, 20 veces: en el 100 % de los casos el canal queda como estaba o con la publicación completa, el panel muestra el error y no sale ningún aviso de una publicación no aplicada | REQ-058 |

## Fuera de alcance

- Métricas por versión y su comparación entre canales (función 031). Esta función solo consume los criterios de promoción que se fijen.
- Alertas, incluida «versión antigua», y la pausa global (función 032).
- Cliente piloto en paralelo con la carpeta `panel` (función 033).
- El contenido de cualquier versión del prompt, incluida la 1.3 (fase 2), y su revisión (skill `version-prompt`).
- La entrega del prompt por el conector y su contrato (fase 2). Esta función exige qué versión debe recibir cada agente, no cómo se entrega.
- La base de datos, el doble factor, la auditoría general y el sistema de diseño del panel (fases 2 y 3).
- El dashboard de cliente (fase 5).
- La elección del proveedor del aviso (V-111, se verifica en el diseño).
- El arranque local y los límites del agente en su anfitrión (artículo 8): esta función no los cambia.
- Cualquier editor de texto del prompt en el panel, ahora o más adelante (ADR-0005).

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Permanencia mínima en `prueba`.** ¿Cuánto dura? ¿Exige además un número mínimo de revisiones (la skill `version-prompt` propone 3 días y al menos 10 revisiones)? ¿Qué cuenta como revisión: instrucciones servidas o informe recibido? ¿Desde cuándo cuenta: desde la primera publicación en `prueba` o desde la última? ¿Se reinicia si la versión deja de estar vigente en `prueba` y vuelve? ¿Qué pasa si el grupo de prueba no genera revisiones suficientes en el plazo?
2. **Excepción de urgencia.** ¿Existe alguna vía para publicar en `estable` sin cumplir la permanencia (por ejemplo, para corregir un fallo grave)? Si existe, ¿quién la autoriza, cómo se deja constancia y qué aviso adicional genera? Si no se fija, esta especificación supone que no existe.
3. **Quién publica en `estable`.** ¿Cualquier superadmin con doble factor, solo el responsable, o dos personas distintas? ¿Y en `prueba`? ¿Y la vuelta atrás, que puede ser urgente?
4. **Aviso.** ¿Quién lo recibe? ¿Por qué medio (correo u otro)? ¿En qué plazo máximo tras la publicación? ¿Debe llegar siempre al menos a una persona distinta de la que publica? ¿Quién mantiene la lista de destinatarios en la configuración del entorno?
5. **Si el aviso no se puede enviar.** ¿Se bloquea la publicación (cierre en fallo) o se aplica y se reintenta el aviso con una alerta? ¿La regla es la misma para la vuelta atrás, que puede ser la respuesta a un incidente?
6. **Grupo de prueba.** ¿Qué clientes forman el canal `prueba` y cuántos como máximo? ¿Se les informa o se recoge en su contrato? ¿En qué canal entra un cliente nuevo? ¿Quién puede cambiar el canal de un cliente? Mover clientes a `prueba` permite que una versión no promovida llegue a muchos clientes: ¿el cambio de canal genera también un aviso fuera del panel, o se limita el número de clientes en `prueba`?
7. **Vuelta atrás.** ¿Solo a la versión inmediatamente anterior del canal o a cualquiera que haya estado vigente antes en ese canal? ¿Está exenta de la permanencia mínima?
8. **Versiones retiradas.** ¿Hace falta poder marcar una versión como retirada para que no se vuelva a publicar ni sea destino de una vuelta atrás? ¿Quién la marca y se puede desmarcar? (La marca no tocaría el texto ni la huella.)
9. **Lectura del texto en el panel.** ¿Puede un superadmin leer el texto completo de una versión en el panel, o solo su número, huella y commit, con el texto consultable en el repositorio?
10. **Canal sin publicación.** Si `prueba` no tiene ninguna publicación, ¿sus clientes reciben la versión vigente de `estable` (lo que prevé el modelo de referencia) o ninguna instrucción? Cuando no hay versión aplicable, ¿qué estado recibe el agente? (Afecta al contrato de la fase 2 y a D-013.)
11. **Discrepancia en una versión vigente.** Si la comprobación de coincidencia falla para una versión que está sirviendo un canal, ¿se deja de servir (cierre en fallo, lo que deja sin instrucciones a todos los agentes de ese canal) o se sigue sirviendo con alerta hasta que alguien actúe? ¿Con qué periodicidad se ejecuta la comprobación además de en cada despliegue?
12. **Aviso al registrar.** ¿El registro de una versión nueva por el despliegue debe generar también un aviso fuera del panel?
13. **Criterios de promoción.** Los criterios de la skill `version-prompt` (errores y avisos no peores, correos sin tratar no peores, ningún código de problema nuevo repetido, ninguna incidencia de los clientes de prueba), ¿los comprueba el sistema como condición para promover o son un juicio de la persona que publica con las métricas de la función 031 a la vista?
14. **Formato del número de versión.** ¿Solo `mayor.menor`, como dice la skill `version-prompt`, o se admite un tercer número, como permite el modelo de referencia?
15. **Alcance de la inmutabilidad.** REQ-008 exige que ninguna vía de la aplicación pueda alterar una versión. Un cambio de esquema revisado sí podría. ¿Es aceptable que esa vía quede cubierta por la revisión de ruta crítica y por la comprobación de coincidencia, o se exige algo más?

## Dependencias y decisiones relacionadas

**Decisiones y documentos**

- D-007 y ADR-0005 (mandan sobre esta función); artículo 9 de la constitución.
- D-013 (qué se entrega en `pausada`), relacionada con la cuestión abierta 10.
- V-108 (doble factor exigido en las políticas), V-111 (proveedor del aviso, se verifica en el diseño), V-114 (entorno previo).
- Amenazas A-11 y A-12 de `docs/SEGURIDAD.md`; «Registro, publicación y entrega de versiones del prompt» es ruta crítica y necesita dictamen del `auditor-seguridad`.
- Skill `version-prompt`; páginas «Versiones» y «Resumen» y regla de confirmación de `docs/DISENO.md`.
- Contrato `contratos/obtener-instrucciones.schema.json` (versión y huella entregadas al agente).
- Modelo de referencia `docs/MODELO-DATOS.sql`, en estado PROPUESTA: orienta, no obliga.

**Supuestos sobre otras fases (a confirmar con coordinación)**

- La fase 2 crea la base de datos, la auditoría de solo inserción y el conector que entrega la versión vigente del canal del cliente con su huella, y pone en servicio la versión 1.3 antes de que exista el registro automático de esta función. REQ-035 depende de cómo quede registrada esa primera versión.
- La fase 3 crea el panel superadmin con doble factor obligatorio, la auditoría de acciones y el sistema de diseño. Esta función añade la pantalla de versiones dentro de ese panel.
- No está escrito quién asigna el canal de cada cliente: la ficha de cliente de `docs/DISENO.md` (fase 3) no lo incluye. Esta especificación lo exige aquí (REQ-012, REQ-013). Si coordinación decide que va en la ficha de la fase 3, esos requisitos se trasladan y aquí quedan como dependencia.
- La función 031 aporta las métricas que usan los criterios de promoción (cuestión abierta 13). La función 032 aporta la pausa global y las alertas; si la discrepancia de la comprobación de coincidencia o el fallo del aviso deben ser también alertas, se acuerda con ella.
- La fase 1 deja el repositorio remoto con rama principal protegida, CI y despliegues de vista previa separados de producción, de los que dependen REQ-001 y REQ-042.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
