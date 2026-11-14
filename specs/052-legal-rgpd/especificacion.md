# 052 · Textos legales y cumplimiento del RGPD

Estado: PROPUESTA
Fase: 6 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

El producto no se puede publicar (B-003) sin cumplir el RGPD y la LOPDGDD para los datos personales que sí trata: cuentas de los dashboards, datos de cobro, identificadores en la auditoría y lo que dejen los registros, la supervisión y los proveedores. Esta función hace que ese tratamiento esté inventariado, que sus plazos se apliquen de verdad, que los derechos de las personas se puedan atender y que la política de privacidad y el aviso legal digan exactamente lo que el sistema hace, ni más ni menos. Cubre los cuatro puntos del grupo «Privacidad» de la lista de publicación de `docs/SEGURIDAD.md` y la entrega de la fase 6 «Política de privacidad, aviso legal, plazos de conservación y encargados de tratamiento documentados».

Esta especificación no es asesoramiento jurídico. Lo que dependa de un criterio legal (textos, plazos mínimos y máximos, papel de HumanaIA, bases jurídicas, transferencias, delegado de protección de datos, cuándo notificar una brecha) lo confirma un abogado o profesional de protección de datos antes de publicar.

## Quién la usa y cómo

- Como **responsable de HumanaIA**, quiero saber qué datos personales trata el sistema, dónde están y durante cuánto tiempo, para publicar con la seguridad de que lo que decimos es cierto.
- Como **usuario de un dashboard** (de un cliente o de HumanaIA), quiero leer la política de privacidad y el aviso legal sin tener que iniciar sesión, para saber qué se hace con mis datos y cómo ejercer mis derechos.
- Como **persona que ejerce un derecho**, quiero un canal claro y una respuesta en plazo, para acceder a mis datos, corregirlos, llevármelos o que se borren.
- Como **cliente que se da de baja**, quiero saber qué se borra, qué se conserva y hasta cuándo.
- Como **superadmin**, quiero un procedimiento para atender solicitudes y bajas que no pueda tocar datos de otro cliente ni la auditoría que debe conservarse.
- Como **profesional de protección de datos**, quiero el inventario, el registro de actividades, la lista de encargados y los textos en un estado revisable, para validarlos antes de la publicación.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo.

**Inventario de datos personales**

| ID | Requisito |
| --- | --- |
| REQ-001 | Existe un inventario de datos personales. Para cada categoría indica: de quién son (usuarios de clientes, superadmin de HumanaIA, clientes persona física, personas que activan el conector, otras), qué dato concreto, finalidad, base jurídica propuesta, dónde se guarda (sistema o proveedor y región), qué proveedor interviene, plazo de conservación, quién tiene acceso, y si su carácter de dato personal está confirmado o pendiente de valoración profesional. |
| REQ-002 | El inventario cubre todas las fuentes donde el sistema deja datos personales, no solo la base de datos: autenticación de los dashboards (correos, sesiones, factores de doble factor y lo que registre el propio servicio de autenticación), registros del servidor y de la plataforma de despliegue, supervisión de errores, envío de correos (autenticación y avisos de alertas), Stripe, límites de intentos de activación e inicio de sesión, auditoría, copias de seguridad y entornos no productivos. Incluye los identificadores indirectos: identificadores de usuario guardados como actor o autor de una acción, direcciones IP y agentes de usuario, si los hubiera. |
| REQ-003 | El inventario se contrasta con lo implementado y desplegado en producción, no solo con la documentación. Lo contrasta alguien distinto de quien lo redactó, y la evidencia indica la fecha, las fuentes revisadas y el commit desplegado. |

**Textos publicados**

| ID | Requisito |
| --- | --- |
| REQ-004 | La política de privacidad y el aviso legal están publicados en español. Cada uno muestra su número de versión y su fecha de entrada en vigor. |
| REQ-005 | Los dos textos se pueden abrir sin iniciar sesión desde la pantalla de acceso de cada dashboard, desde el interior de cada dashboard y desde la pantalla de activación del conector. El mensaje de invitación al dashboard de cliente enlaza a la política de privacidad. |
| REQ-006 | La política de privacidad contiene, como mínimo, la información que exigen los artículos 13 y 14 del RGPD: identidad y contacto del responsable, contacto del delegado de protección de datos si lo hay, finalidades y bases jurídicas, destinatarios y encargados por categoría, transferencias fuera del Espacio Económico Europeo y su garantía, plazos de conservación, derechos y cómo ejercerlos, y derecho a reclamar ante la AEPD. La lista definitiva de contenidos la confirma el profesional. |
| REQ-007 | El aviso legal contiene los datos identificativos del titular que exige la normativa de servicios de la sociedad de la información. La lista definitiva la confirma el profesional. |
| REQ-008 | Todo cambio en un texto publicado lleva número de versión y fecha nuevos. Las versiones anteriores se conservan y se pueden recuperar, de modo que se sabe qué texto estaba en vigor en cualquier fecha. |
| REQ-009 | Las páginas de los textos cumplen WCAG 2.2 AA, se leen en móvil y siguen disponibles aunque los dashboards no puedan leer la base de datos. |

**Coherencia entre textos y sistema**

| ID | Requisito |
| --- | --- |
| REQ-010 | Existe una relación de afirmaciones: cada afirmación comprobable de los textos (por ejemplo «no recibimos el contenido de su correo» o «los datos se guardan en la UE») está enlazada con el control, la prueba, la configuración o el documento del proveedor que la sostiene. |
| REQ-011 | Los textos solo mencionan datos, finalidades, proveedores, regiones y plazos que figuran en el inventario, el registro de actividades y la lista de encargados; y todo lo que en ellos deba informarse aparece en los textos. |
| REQ-012 | Un cambio que añade una categoría de dato personal, una finalidad o un proveedor, o que cambia una región o un plazo, no llega a producción sin haber actualizado antes el inventario, el registro de actividades, la lista de encargados y, si les afecta, los textos con nueva versión. |

**Plazos de conservación**

| ID | Requisito |
| --- | --- |
| REQ-013 | Cada categoría del inventario tiene un plazo de conservación fijado por el responsable, el hecho desde el que se cuenta y qué ocurre al vencer (eliminar o anonimizar). Como mínimo: informes y ejecuciones; alertas; órdenes; auditoría; eventos y estado de cobro; conexiones, tokens y códigos caducados o revocados; clientes OAuth registrados; cuentas de usuario de un cliente tras su baja o tras retirar al usuario; cuentas de superadmin tras su baja; registros del servidor y de la plataforma; supervisión de errores; avisos enviados por correo; registros de límites de intentos; copias de seguridad; solicitudes de derechos; registro de brechas. |
| REQ-014 | Lo que vence se elimina o se anonimiza dentro del margen máximo que fije el responsable, sin depender de que alguien se acuerde de hacerlo. |
| REQ-015 | Un dato anonimizado no conserva ningún identificador directo ni indirecto de los que recoge el inventario (correo, identificador de usuario, dirección IP, identificador de Stripe) que permita volver a asociarlo a una persona. |
| REQ-016 | Para los datos que guardan los proveedores (registros de la plataforma, supervisión de errores, correo, Stripe, copias), la conservación configurada en cada proveedor coincide con el plazo declarado, o el plazo declarado es el que impone el proveedor; hay evidencia de esa configuración. |
| REQ-017 | El inventario y la política dicen cuánto tiempo permanece en las copias de seguridad un dato ya eliminado. Si se restaura una copia, las supresiones y los vencimientos ya aplicados se vuelven a aplicar antes de dar servicio con ella. |
| REQ-018 | La auditoría se conserva durante todo su plazo. Ninguna eliminación de otras categorías, ni la baja de un cliente o de un usuario, borra ni altera filas de auditoría. |
| REQ-019 | Mientras haya un incidente abierto, no se eliminan los registros que la guía de incidentes ordene conservar, aunque venza su plazo. La suspensión queda anotada con su inicio y su fin, y al cerrarse se aplican los plazos pendientes. |
| REQ-020 | Si la aplicación de los plazos no se ejecuta o falla, el superadmin recibe una señal visible antes de que pase el doble del intervalo previsto entre aplicaciones. Nunca se da por hecha una eliminación que no se completó. |

**Encargados de tratamiento**

| ID | Requisito |
| --- | --- |
| REQ-021 | Existe una lista de encargados y demás destinatarios. Para cada proveedor indica: servicio, finalidad, categorías de datos, región de tratamiento y de almacenamiento, subencargados relevantes, si hay acceso o transferencia fuera del Espacio Económico Europeo y con qué garantía, el acuerdo de encargo (o el documento que corresponda) archivado con su versión y fecha, y la fecha de la última revisión. |
| REQ-022 | La lista incluye, como mínimo, Supabase, Vercel y Stripe, el proveedor de supervisión de errores (V-112), el de avisos por correo (V-111) y el que envíe los correos de autenticación si es distinto. Para cada uno consta si actúa como encargado o como responsable independiente, según lo valide el profesional. |
| REQ-023 | Ningún proveedor que trate datos personales entra en producción sin figurar en la lista con su acuerdo archivado. |
| REQ-024 | El inventario, el registro de actividades y la lista de encargados se revisan con la periodicidad que fije el responsable y cada vez que un proveedor notifique cambios en su acuerdo o en sus subencargados. Cada revisión deja su fecha y su resultado. |

**Registro de actividades de tratamiento**

| ID | Requisito |
| --- | --- |
| REQ-025 | Existe un registro de actividades de tratamiento con el contenido del artículo 30 del RGPD, como responsable y, si el profesional lo confirma, como encargado. Es coherente con el inventario: cada actividad remite a categorías del inventario y cada categoría aparece en al menos una actividad. |

**Derechos de las personas**

| ID | Requisito |
| --- | --- |
| REQ-026 | Hay un canal de contacto para ejercer los derechos, publicado en la política de privacidad, que no obliga a guardar texto libre en el sistema. |
| REQ-027 | Existe un procedimiento escrito para atender acceso, rectificación, supresión, oposición, limitación y portabilidad. Dice quién atiende, cómo se comprueba la identidad, qué fuentes del inventario se consultan, el plazo de respuesta (un mes según el artículo 12.3 del RGPD, prorrogable en los casos que prevé; lo confirma el profesional) y cómo se anota cada solicitud: fecha de entrada, tipo de derecho, resultado y fecha de respuesta, con valores cerrados. |
| REQ-028 | La respuesta a un derecho de acceso o de portabilidad incluye todos los datos de esa persona que recoge el inventario, en un formato estructurado, de uso común y legible por máquina, y ningún dato de otra persona ni de otro cliente. |
| REQ-029 | Una supresión elimina o anonimiza los datos de esa persona en todas las fuentes del inventario, salvo los que deban conservarse por obligación legal o por la auditoría, que quedan enumerados con su motivo y su plazo. |
| REQ-030 | Está documentado, por categoría, qué se borra, qué se anonimiza y qué se conserva al darse de baja un cliente, y en qué plazo: cuentas de sus usuarios, conexiones y tokens, informes y ejecuciones, alertas, órdenes, reglas, estado de cobro e identificadores de Stripe. La baja aplica exactamente lo documentado. |
| REQ-031 | Si quien ejerce un derecho es un tercero cuyos correos trata el agente de un cliente, el procedimiento responde que HumanaIA no recibe el contenido de esos correos e indica que el responsable de ese tratamiento es el cliente, sin pedir ni guardar el contenido de ningún correo. |
| REQ-032 | El procedimiento se prueba con casos ficticios en un entorno no productivo, uno por cada derecho, y se anota el tiempo empleado en cada uno. |

**Revisión de privacidad de registros, errores y supervisión**

| ID | Requisito |
| --- | --- |
| REQ-033 | Antes de publicar se revisan los registros del servidor y de la plataforma, los errores, la supervisión y los avisos por correo. La evidencia muestra que no contienen contenido de correo ni datos personales de terceros, y que cualquier dato personal encontrado figura en el inventario. |
| REQ-034 | Las pruebas y evidencias de esta función usan datos ficticios. Cuando una revisión necesite datos reales de producción, esos datos no se envían a ningún proveedor ni herramienta que no esté en la lista de encargados (incluidas las herramientas de inteligencia artificial de ingeniería), y la evidencia describe lo encontrado por recuento y tipo, sin copiar valores reales. |

**Brechas de datos personales**

| ID | Requisito |
| --- | --- |
| REQ-035 | Existe un procedimiento para brechas de datos personales: valoración del riesgo, anotación de toda brecha (se notifique o no), notificación a la AEPD en un máximo de 72 horas desde que se conoce cuando proceda, comunicación a los afectados cuando proceda y aviso a los clientes si HumanaIA actúa como su encargado. Incluye plantillas. El criterio de cuándo notificar lo confirma el profesional. |
| REQ-036 | El procedimiento de brechas y la guía de incidentes de la función 051 se enlazan en los dos sentidos, y la guía indica en qué paso se activa el procedimiento de brechas. |

**Validación profesional**

| ID | Requisito |
| --- | --- |
| REQ-037 | Antes de publicar, un abogado o profesional de protección de datos valida los textos, los plazos, las bases jurídicas, el papel de HumanaIA frente a sus clientes, las transferencias internacionales, la necesidad de delegado de protección de datos y los procedimientos de derechos y de brechas. La evidencia indica quién (persona o despacho y su condición profesional), cuándo y qué versión de cada documento validó. |

**Privacidad por diseño y aislamiento**

| ID | Requisito |
| --- | --- |
| REQ-038 | Nada de lo que se construya para esta función añade campos de texto libre ni introduce datos personales de terceros en el sistema. Lo que esta función anote (solicitudes, bajas, aplicación de plazos, suspensiones por incidente) usa solo enteros acotados, booleanos, fechas, identificadores con formato fijo y valores de listas cerradas. |
| REQ-039 | Toda exportación o eliminación actúa solo sobre el cliente o la persona que corresponde, derivado de la sesión de quien la pide o de una acción de superadmin con doble factor. Nunca se toma el cliente de un identificador recibido como entrada. |
| REQ-040 | Cada exportación, supresión, baja de cliente, aplicación de plazos y suspensión por incidente deja una fila de auditoría con actor, acción, objeto, cliente y fecha, sin valores de los datos afectados. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-041 | Un texto legal afirma algo que el sistema no cumple (por ejemplo, «todos los datos están en la UE» cuando un proveedor accede a ellos o los guarda fuera) | No se publica. Si se descubre ya publicado, se corrige con nueva versión y se anota como hallazgo; lo que deba comunicarse a los afectados lo decide el responsable con el profesional |
| REQ-042 | Un proveedor en uso que trata datos personales no está en la lista de encargados o no tiene acuerdo archivado | Hallazgo bloqueante de la lista de publicación. No entra en producción; si ya estaba, se anota y el responsable decide si se deja de enviarle datos hasta regularizarlo |
| REQ-043 | La revisión encuentra un dato personal que no estaba en el inventario | Hallazgo bloqueante. Si no debía estar, se elimina de la fuente y se corrige su origen; si debe estar, se añade al inventario, al registro de actividades y a los textos con nueva versión. La revisión se repite |
| REQ-044 | Un dato con el plazo vencido sigue en el sistema o en un proveedor más allá del margen | Señal al superadmin y hallazgo. Nunca se informa como eliminado |
| REQ-045 | Una eliminación o exportación alcanza datos de otro cliente, también si se cambian identificadores en la dirección o en el cuerpo de la petición | No ocurre nunca. La petición se rechaza, no se lee ni se cambia ninguna fila del otro cliente y la respuesta no revela si esos datos existen |
| REQ-046 | Una eliminación alcanza datos que aún están dentro de su plazo | No ocurre nunca, tampoco en la frontera exacta del plazo |
| REQ-047 | Una eliminación, una baja de cliente o una supresión intenta borrar o alterar filas de auditoría que deben conservarse | Se impide; la auditoría queda intacta |
| REQ-048 | Una solicitud de derechos llega de alguien cuya identidad no se ha comprobado | No se entrega, corrige ni borra ningún dato y no se confirma si la persona tiene datos. Se pide la comprobación según el procedimiento. No se guarda en el sistema copia de documentos de identidad |
| REQ-049 | Se intenta publicar un texto sin validación profesional, o una versión distinta de la validada | No se publica y la publicación del producto (B-003) no puede autorizarse |
| REQ-050 | Un texto publicado cambia sin nueva versión y fecha | Se detecta y se rechaza; el texto en vigor sigue siendo la última versión registrada |
| REQ-051 | Atender una solicitud de derechos exigiría guardar texto libre en el sistema (motivo escrito, mensaje de la persona, documentos) | No se añade ningún campo de texto libre. La solicitud se anota solo con valores cerrados y el resto queda fuera del sistema, donde diga el procedimiento |
| REQ-052 | Una petición de exportación o eliminación trae campos de más, por ejemplo un identificador de cliente | Los campos ajenos no cambian el alcance: el cliente sigue derivándose de la sesión o de la acción de superadmin |
| REQ-053 | La misma solicitud de supresión o exportación se envía dos veces | La segunda no produce efectos adicionales ni deja el sistema incoherente |
| REQ-054 | Dos procesos de eliminación coinciden (aplicación de plazos y baja de un cliente, o dos aplicaciones de plazos) | El resultado es el mismo que si se hubieran ejecutado uno detrás de otro; no se elimina nada vigente |
| REQ-055 | La base de datos o un proveedor no responde a mitad de una supresión, una baja o una aplicación de plazos | No se informa como completada. O se completa al reintentar o no deja datos a medias sin señalar; queda señal al superadmin. El fallo no concede acceso a nada |
| REQ-056 | Lanza una baja de cliente, una supresión ajena o una aplicación de plazos alguien sin permiso: sin sesión, un usuario de cliente o un superadmin sin doble factor | Se rechaza y queda anotado; no se elimina ni se exporta nada |
| REQ-057 | Un tercero ejerce sus derechos aportando el contenido de un correo (asunto, remitente, texto) para que lo busquemos | No se guarda ese contenido en el sistema; se responde según el procedimiento para terceros |
| REQ-058 | Restaurar una copia de seguridad devuelve datos ya suprimidos o vencidos | Antes de dar servicio con la copia restaurada, se vuelven a aplicar las supresiones y los plazos; ningún dato suprimido vuelve a estar disponible |
| REQ-059 | Datos reales de producción acaban en una herramienta o proveedor que no está en la lista, o en una evidencia, una captura o el repositorio | No ocurre nunca. Si se detecta, se trata como posible brecha según el procedimiento y se retira la evidencia |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Una persona distinta de quien redactó el inventario lo compara con producción: todas las tablas y columnas desplegadas (también las del servicio de autenticación), la configuración de cada proveedor y una muestra de cada fuente de registros. Resultado: 0 categorías de dato personal fuera del inventario; evidencia con fecha, fuentes y commit | REQ-001 a REQ-003, REQ-043 |
| CA-002 | Desde la pantalla de acceso de cada dashboard, el interior de cada dashboard y la pantalla de activación, sin sesión donde no la hay, se abren los dos textos (10 de 10 enlaces), en español, con versión y fecha visibles. El mensaje de invitación al dashboard de cliente enlaza a la política | REQ-004, REQ-005 |
| CA-003 | Una lista de contenidos obligatorios de la política y del aviso legal, confirmada por el profesional, se coteja con los textos publicados: 0 elementos sin cubrir | REQ-006, REQ-007 |
| CA-004 | Un cambio de prueba en un texto sin nueva versión se detecta y no se publica. Se recupera el texto en vigor en dos fechas distintas y coincide con la versión registrada para cada una | REQ-008, REQ-050 |
| CA-005 | La revisión de accesibilidad de las páginas de los textos no encuentra fallos de nivel A ni AA; se leen en un ancho de 320 píxeles sin desplazamiento horizontal; con la base de datos inaccesible en el entorno previo, los dos textos se siguen abriendo | REQ-009 |
| CA-006 | La relación de afirmaciones cubre el 100 % de las afirmaciones comprobables de los textos. Un revisor independiente intenta refutar cada una contra el sistema desplegado: 0 afirmaciones sin sostén y 0 elementos del inventario, del registro de actividades o de la lista de encargados que deban informarse y falten en los textos | REQ-010, REQ-011, REQ-041 |
| CA-007 | En el entorno previo, un cambio de prueba que añade un proveedor ficticio y otro que añade un dato personal nuevo no pueden llegar a producción sin actualizar el inventario, el registro de actividades, la lista de encargados y los textos; queda evidencia del rechazo | REQ-012, REQ-042 |
| CA-008 | Cada categoría del inventario tiene plazo, hecho de inicio y destino al vencer, aprobados por el responsable y validados por el profesional: 0 categorías sin plazo. Para cada proveedor, la conservación configurada coincide con la declarada (100 %), con captura o documento fechado | REQ-013, REQ-016 |
| CA-009 | Prueba automática con datos ficticios de dos clientes, con filas vencidas y vigentes en cada categoría, incluida una justo en el límite del plazo. Tras aplicar los plazos: 100 % de las vencidas eliminadas o anonimizadas, 0 vigentes afectadas, 0 filas de auditoría alteradas y 0 identificadores del inventario en las filas anonimizadas | REQ-014, REQ-015, REQ-018, REQ-046, REQ-047 |
| CA-010 | En la comprobación previa a la publicación, cada categoría de producción tiene 0 registros vencidos más allá del margen fijado | REQ-014, REQ-044 |
| CA-011 | Con un incidente ficticio abierto en el entorno previo, los registros que la guía ordena conservar no se eliminan al vencer; al cerrarlo, se eliminan en la siguiente aplicación. El inicio y el fin de la suspensión quedan anotados | REQ-019 |
| CA-012 | Se fuerza que la base de datos deje de responder a mitad de una aplicación de plazos: aparece la señal al superadmin dentro del umbral, no se informa como completada y, al reintentar, el resultado es el esperado. Dos aplicaciones lanzadas a la vez dan el mismo resultado que en serie | REQ-020, REQ-054, REQ-055 |
| CA-013 | En la restauración de prueba de una copia que contiene una persona ficticia ya suprimida, antes de dar servicio esa persona no aparece en ninguna fuente (0 filas). El tiempo de permanencia en copias está en el inventario y en la política | REQ-017, REQ-058 |
| CA-014 | Se comparan los servicios externos a los que producción envía datos con la lista de encargados: el 100 % figura con su acuerdo archivado y fechado. Los acuerdos de Supabase, Vercel y Stripe están archivados, y consta el papel de cada proveedor | REQ-021 a REQ-023, REQ-042 |
| CA-015 | El registro de actividades está fechado en la semana de la publicación. Cada categoría del inventario aparece en al menos una actividad y cada actividad remite a categorías del inventario: 0 discrepancias. La última revisión periódica tiene fecha y resultado | REQ-024, REQ-025 |
| CA-016 | Ejercicio en el entorno previo con personas ficticias: una solicitud por cada uno de los seis derechos, una de alguien sin identidad comprobada y una de un tercero que aporta el contenido de un correo. Las seis primeras se responden dentro del plazo legal, con el tiempo anotado; la exportación incluye el 100 % de los datos de la persona según el inventario y 0 de otras; tras la supresión quedan 0 identificadores salvo las conservaciones enumeradas. La solicitud sin identidad comprobada no recibe ni cambia datos. El contenido aportado por el tercero aparece 0 veces en el sistema. Todas las solicitudes quedan anotadas solo con valores cerrados | REQ-026 a REQ-029, REQ-031, REQ-032, REQ-048, REQ-051, REQ-057 |
| CA-017 | Baja de un cliente ficticio con usuarios, conexiones, informes, alertas, órdenes y suscripción: tras la baja y los plazos aplicables, el estado coincide con la tabla documentada en el 100 % de las categorías, y otro cliente ficticio tiene 0 filas cambiadas | REQ-030, REQ-045 |
| CA-018 | Pruebas automáticas en CI: un usuario del cliente A intenta exportar o suprimir datos del cliente B cambiando identificadores en la dirección o en el cuerpo y añadiendo campos de más; lo intentan también una petición sin sesión, un usuario de cliente sobre la baja de su cliente y un superadmin sin doble factor. Todos se rechazan, con 0 filas de B leídas o cambiadas y sin revelar si existen. Una solicitud repetida no produce efectos adicionales. Cada acción permitida deja exactamente una fila de auditoría sin valores de los datos | REQ-039, REQ-040, REQ-045, REQ-052, REQ-053, REQ-056 |
| CA-019 | La revisión de privacidad de los cambios de esta función (skill `revision-privacidad`) encuentra 0 campos nuevos de texto libre y 0 vías de entrada de datos de terceros. `node scripts/comprobar-specs.mjs` termina sin errores | REQ-038, REQ-051 |
| CA-020 | Revisión de privacidad de registros del servidor y de la plataforma, errores, supervisión y avisos por correo, en el entorno previo y en producción, sobre los últimos 7 días de cada fuente (o lo que conserve, si es menos, anotándolo). Resultado: 0 apariciones de contenido de correo, 0 datos personales de terceros y el 100 % de los datos personales encontrados figuran en el inventario. La evidencia da recuentos y tipos, sin valores reales, e indica con qué herramientas se revisó | REQ-033, REQ-034, REQ-043, REQ-059 |
| CA-021 | El procedimiento de brechas existe, enlazado en los dos sentidos con la guía de incidentes de la función 051. Un ejercicio de mesa con una brecha ficticia produce su anotación y la decisión documentada de notificar o no antes de 72 horas desde la detección simulada, usando las plantillas | REQ-035, REQ-036 |
| CA-022 | Existe la evidencia de validación profesional (quién, condición profesional, fecha y versión de cada documento). La huella de cada texto publicado coincide con la de la versión validada. Un intento de publicar un texto no validado se detiene | REQ-037, REQ-049 |
| CA-023 | Los cuatro puntos de «Privacidad» de la lista de publicación de `docs/SEGURIDAD.md` y la entrega de la fase 6 «Política de privacidad, aviso legal, plazos de conservación y encargados de tratamiento documentados» tienen cada uno un enlace a su evidencia, y el responsable lo comprueba | REQ-004, REQ-013, REQ-021, REQ-025, REQ-033 |

## Fuera de alcance

- La factura legal y las obligaciones fiscales del cobro (B-001, función 050). Esta función solo recoge los plazos de conservación que esas obligaciones impongan a los datos de cobro.
- La guía de incidentes y su simulacro (función 051). Aquí solo el procedimiento de brechas de datos personales y su enlace con esa guía.
- La prueba de restauración de copias en sí, que es otra entrega de la fase 6. Aquí solo se exige que la restauración reaplique supresiones y plazos.
- Los contratos comerciales con cada cliente y sus condiciones económicas.
- El cumplimiento que corresponde a cada cliente sobre su propio correo y su nube, y los textos que el cliente deba dar a sus propios interesados.
- El contenido de los correos: nunca entra en el sistema.
- Certificaciones (ISO 27001, ENS u otras) y auditorías externas de cumplimiento.
- La redacción de los textos legales: esta especificación dice qué deben cumplir y cómo se comprobará; los textos son una entrega posterior de la función.
- Asesoramiento jurídico definitivo: lo da el profesional que valide.
- Comunicaciones comerciales y publicidad.
- Traducciones a otros idiomas.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Datos del titular para el aviso legal.** ¿Cuál es la denominación social, NIF, domicilio, datos registrales (si es sociedad) y correo de contacto de HumanaIA que deben figurar en el aviso legal?
2. **Quién valida los textos.** ¿Quién hace la validación profesional? Opciones: abogado externo, delegado de protección de datos (si se nombra), gestoría con servicio de protección de datos u otro. ¿Hace falta una nueva validación con cada cambio de los textos o solo con los cambios de fondo, y quién decide qué es de fondo?
3. **Plazos de conservación.** ¿Qué plazo tiene cada categoría de REQ-013 (informes y ejecuciones, alertas, órdenes, auditoría, eventos y estado de cobro, conexiones y tokens caducados o revocados, clientes OAuth, cuentas de usuarios tras la baja, cuentas de superadmin, registros del servidor, supervisión, avisos por correo, límites de intentos, copias, solicitudes de derechos, registro de brechas)? ¿Cuál es el margen máximo entre el vencimiento y la eliminación? ¿Cada cuánto se revisan el inventario, el registro de actividades y la lista de encargados? Si un proveedor impone un plazo fijo de sus registros, ¿se acepta el suyo?
4. **Condiciones del servicio.** ¿Hacen falta condiciones del servicio o un contrato de suscripción que respalden el cobro recurrente y la suspensión por impago con periodo de gracia (D-010), o ya existe un contrato con los clientes que lo cubre? Si hacen falta, ¿entran en esta función o en otra?
5. **Aceptación de los textos.** ¿Deben los usuarios aceptar expresamente la política o las condiciones (al recibir la invitación, al activar el conector)? Si es así, ¿se guarda constancia de qué versión aceptó cada usuario y cuándo? Esa constancia sería un dato personal más del inventario.
6. **Papel de HumanaIA frente a sus clientes.** ¿Es responsable, encargado del cliente o ambos según la categoría (por ejemplo, responsable de las cuentas de superadmin y del cobro, encargado de las cuentas de los usuarios del cliente)? Relacionado: durante la instalación, una persona de HumanaIA configura el asistente del cliente con acceso a su correo; ¿es eso un tratamiento por cuenta del cliente que necesite contrato de encargo, aunque nada pase por nuestro servidor? Lo confirma el profesional.
7. **Datos tras la baja de un cliente.** ¿Qué se borra, qué se anonimiza y qué se conserva, y en qué plazo? Hoy `docs/INSTALACION-CLIENTE.md` solo revoca conexiones y suspende la licencia, y el modelo de referencia marca al cliente como «baja» sin borrar nada. ¿Qué obligaciones mercantiles o fiscales obligan a conservar los datos de cobro (en el sistema y en Stripe)?
8. **Dónde se publican los textos.** ¿En qué dominio y dirección? ¿El mismo de los dashboards y del conector, o la web corporativa de HumanaIA?
9. **Cookies y analítica.** ¿Habrá cookies o analítica más allá de las técnicas de sesión (por ejemplo, analítica de la plataforma de despliegue)? Si las hay, hace falta política de cookies y consentimiento; si solo hay técnicas, ¿basta con informarlo en la política de privacidad? Lo confirma el profesional.
10. **Delegado de protección de datos.** ¿Hace falta nombrarlo (artículo 37 del RGPD y artículo 34 de la LOPDGDD)? ¿Y una evaluación de impacto? Lo confirma el profesional.
11. **Papel de Stripe.** La lista de publicación pide «acuerdos de encargo con Supabase, Vercel y Stripe», pero Stripe puede actuar como responsable independiente en parte de su tratamiento. ¿Qué documento se archiva con Stripe y cómo se presenta en la política?
12. **Fin de la auditoría.** La auditoría es de solo inserción y guarda el identificador del actor sin enlace al usuario. ¿Tiene plazo de conservación o se guarda indefinidamente? Si tiene plazo, ¿cómo se elimina sin romper su inmutabilidad? Tras suprimir a un usuario, ¿basta con que su identificador quede sin correo asociado, o hay que anonimizarlo también en la auditoría?
13. **Suspensión por incidente.** ¿Cuánto tiempo como máximo pueden conservarse registros vencidos mientras dura un incidente o una reclamación, y quién decide abrir y cerrar esa suspensión?
14. **Canal de derechos y registro de solicitudes.** ¿Qué canal se publica (dirección de correo dedicada, correo postal, otro)? ¿Dónde se guarda el registro de solicitudes y la correspondencia: dentro del sistema solo con valores cerrados, o fuera (gestor documental de HumanaIA)? ¿Qué medios se aceptan para comprobar la identidad?
15. **Autoservicio o atención por superadmin.** ¿Los usuarios del dashboard de cliente pueden exportar o suprimir su propia cuenta desde el dashboard, o todo lo atiende un superadmin?
16. **Clientes persona física.** Si un cliente es autónomo, su nombre comercial, sus identificadores de Stripe y las cifras de su agente pueden ser datos personales suyos. ¿Cómo se tratan en el inventario y en la política? Lo confirma el profesional.
17. **Transferencias internacionales.** Supabase, Vercel y Stripe son empresas estadounidenses aunque los datos estén en regiones de la UE. ¿Con qué garantía se cubre el posible acceso desde fuera (marco de privacidad UE-EE. UU., cláusulas tipo) y cómo se redacta para no prometer más de lo cierto? Lo confirma el profesional.
18. **Herramientas de IA de ingeniería y datos reales.** ¿Pueden los agentes de ingeniería revisar registros o datos reales de producción (por ejemplo, para la revisión de privacidad)? Si es que sí, su proveedor entra en la lista de encargados; si es que no, esas revisiones las hace una persona sin enviar los datos a esas herramientas.
19. **Ejercicio de brechas.** ¿El ejercicio de mesa de CA-021 se integra en el simulacro de la función 051 o se hace por separado?
20. **Archivo de acuerdos y validaciones.** ¿Dónde se archivan los acuerdos de encargo firmados y la evidencia de validación profesional? Contienen datos personales de firmantes y no deberían ir al repositorio público ni a evidencias.

## Dependencias y decisiones relacionadas

- Decisiones: D-002, D-003, D-010, T-003, T-006, T-014, T-015, B-001, B-003, V-111, V-112, V-113, V-114.
- ADR: 0006 (Stripe cobra; el panel no emite facturas).
- Documentos: `docs/SEGURIDAD.md` (marcos, lista de publicación, respuesta a incidentes), `docs/ARQUITECTURA.md` (datos, entornos), `docs/MODELO-DATOS.sql` (referencia), `docs/INSTALACION-CLIENTE.md` (baja), skill `revision-privacidad`.
- Funciones: 050 (cobro y B-001), 051 (guía de incidentes y simulacro), la de restauración de copias de la fase 6, y las de las fases 2, 3 y 5 (modelo de datos, auditoría, doble factor, invitaciones).
- Si el diseño exige cambios en CI, en la configuración de producción o en documentos compartidos del arnés, necesitan aprobación del responsable (artículo 14) y se proponen en `specs/052-legal-rgpd/propuestas.md`.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
