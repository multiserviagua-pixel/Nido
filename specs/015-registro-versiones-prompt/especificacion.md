# 015 · Registro de versiones del prompt por despliegue

Estado: PROPUESTA
Fase: 2 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

El conector de la fase 2 tiene que servir a los agentes la versión 1.3 real del prompt, no un texto ficticio. El responsable decidió el 12/11/2026 adelantar a la fase 2 un registro mínimo por despliegue (respuesta «Adelantar registro» a la cuestión 11 de la función 011), en lugar de esperar a la fase 4. Esta función hace que cada versión del prompt entre en la base de datos solo desde el repositorio, por un despliegue de la rama principal, con su huella y su commit, y que después no se pueda cambiar. Define también lo mínimo para que una versión registrada llegue a servirse antes de que exista el panel de la fase 4, y que cualquier fallo del registro deje a los agentes como estaban, nunca con un texto no registrado (amenaza A-12, artículo 9).

## Quién la usa y cómo

- Como **despliegue de la rama principal**, quiero registrar las versiones nuevas del prompt con su huella y su commit, para que solo se pueda servir lo que ha pasado revisión.
- Como **responsable de HumanaIA**, quiero que una versión registrada no cambie nunca y que un despliegue con un archivo de versión alterado no se dé por bueno, para confiar en que lo que reciben los agentes es lo revisado.
- Como **persona que opera el sistema**, quiero saber qué registró cada despliegue y por qué falló, sin ver el texto ni secretos, y tener un procedimiento escrito para hacer vigente una versión y volver atrás mientras no hay panel.
- Como **agente de correo de un cliente**, quiero recibir solo textos registrados con su huella, o ninguno, para no seguir nunca instrucciones que no hayan pasado por el repositorio.

## Términos

- **Carpeta de versiones**: `prompts/agente-ia/` (`docs/ESQUELETO.md`).
- **Despliegue válido**: despliegue de un commit integrado en la rama principal según el procedimiento de integración vigente (el local de la función 002 mientras la 003 siga aplazada; el de la rama protegida remota cuando se reactive), hecho desde una copia de trabajo sin cambios pendientes y con la comprobación de la rama principal en verde.
- **Entorno**: desarrollo, preproducción (el «entorno previo» de `docs/ARQUITECTURA.md`) y producción. Cada uno tiene su propia base de datos y, por tanto, su propio registro.
- **Registro**: el conjunto de versiones registradas en la base de datos de un entorno.
- **Hacer vigente**: que una versión registrada pase a ser la que se sirve a los agentes de un canal.
- **Base desechable**: base de datos de prueba que se crea y se destruye para una prueba (en CI o equivalente). Las pruebas que registran versiones de prueba se hacen en ella, nunca en producción, porque lo registrado no se puede borrar.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo. Cuando un punto lo tiene que fijar el responsable, el requisito remite a la cuestión abierta que lo fija.

### Qué se registra

| ID | Requisito |
| --- | --- |
| REQ-001 | En cada despliegue válido a un entorno de los que fije la cuestión abierta 1, se registran en la base de datos de ese entorno todas las versiones registrables presentes en el commit desplegado que aún no estén registradas allí, cada una con su número, su texto íntegro, su huella, el commit y la fecha de registro. |
| REQ-002 | Solo son versiones registrables los archivos situados directamente en la carpeta de versiones cuyo nombre es un número de versión válido con la extensión `.md`. Existe una lista cerrada de archivos de esa carpeta que no se registran: el arranque local, salvo lo que fije la cuestión abierta 5, y la 1.2, salvo lo que fije la cuestión abierta 4. Ningún archivo de una subcarpeta ni de otra carpeta es registrable. |
| REQ-003 | El número de versión registrado es el del nombre del archivo, con el formato que fije la cuestión abierta 6. Cada número tiene una sola escritura válida, de modo que dos nombres de archivo distintos nunca corresponden al mismo número. |
| REQ-004 | El texto registrado es, byte a byte, el contenido del archivo en el commit desplegado. No depende de la máquina, del sistema operativo ni de la copia de trabajo desde la que se despliega (finales de línea, codificación, marca de orden de bytes). |
| REQ-005 | La huella registrada es la que fija el ADR-0005, calculada sobre ese texto exacto, y coincide con la que se calcula de forma independiente sobre el archivo en el commit registrado. |
| REQ-006 | El commit registrado es el identificador completo, no abreviado, de un commit de la rama principal en el que el archivo de esa versión tiene exactamente el texto registrado. Qué commit es (el desplegado o el que introdujo el archivo) lo fija la cuestión abierta 11. La fecha de registro la pone el sistema al registrar; quien registra no la aporta. |
| REQ-007 | Cada versión se registra entera o no se registra: nunca queda una versión con el número, el texto, la huella o el commit incompletos o incoherentes entre sí. |
| REQ-008 | Registrar es repetible sin efectos: desplegar otra vez el mismo commit, o uno posterior sin versiones nuevas, no crea registros ni altera los existentes. |
| REQ-009 | Registrar no hace vigente: una versión recién registrada no se sirve a ningún agente de ningún canal hasta que se haga vigente por el procedimiento de REQ-021. |

### Comprobaciones antes de registrar

| ID | Requisito |
| --- | --- |
| REQ-010 | Antes de registrar nada, el despliegue hace todas las comprobaciones de REQ-011 a REQ-013 sobre el commit completo. Si alguna falla, no se registra ninguna versión, el despliegue termina en fallo sin pasar a servir y el entorno sigue sirviendo el despliegue anterior. |
| REQ-011 | Para cada versión ya registrada en el entorno se comprueba que su archivo sigue en el commit desplegado, que ese archivo produce la huella registrada y que el texto guardado en el registro produce también la huella registrada. |
| REQ-012 | El texto de cada versión nueva cumple, comprobado de forma automática: no está vacío; no supera el tamaño máximo del prompt de `contratos/obtener-instrucciones.schema.json` (100 000 caracteres); es texto válido en UTF-8; no contiene nada con formato de credencial según el escáner de secretos del arnés; y no contiene enlaces ni direcciones de correo fuera de una lista cerrada fijada en el diseño. |
| REQ-013 | Una versión nueva solo se registra si el cambio que integró su archivo en la rama principal consta revisado por el `revisor` y por el `auditor-seguridad`, sin hallazgos bloqueantes abiertos, sobre ese mismo texto (misma huella) (ADR-0005, punto 1). Si además se exige constancia del banco de pruebas de la función 012 lo fija la cuestión abierta 9, y si se exige la aprobación del responsable, la cuestión abierta 8. |

### Quién registra y desde dónde

| ID | Requisito |
| --- | --- |
| REQ-014 | Solo un despliegue válido registra versiones. El paso de registro ejecutado por sí solo, fuera de un despliegue, no registra nada. |
| REQ-015 | Ninguna otra vía de la aplicación registra versiones: ni el panel, ni una sesión de superadmin (con o sin doble factor), ni una sesión de usuario de cliente, ni el conector, ni una persona con su propia cuenta. |
| REQ-016 | Cada entorno registra solo en su propia base de datos. Ningún despliegue de desarrollo, de preproducción ni de vista previa puede registrar en la base de datos de otro entorno, y en particular en la de producción. |

### Identidad y secretos

| ID | Requisito |
| --- | --- |
| REQ-017 | El despliegue registra con una identidad propia ante la base de datos, distinta en cada entorno, cuyo único permiso efectivo es añadir versiones y consultar qué versiones están registradas y con qué huella (artículo 3). Si esa identidad no es viable, se aplica lo que fije la cuestión abierta 3. |
| REQ-018 | Esa identidad no puede modificar, borrar ni vaciar versiones; no puede hacer vigente una versión ni publicar; no puede cambiar el canal de un cliente; no puede leer ni escribir datos de clientes ni ninguna otra tabla o vista; no puede ejecutar otras funciones; y no puede crear ni alterar objetos. |
| REQ-019 | Si la credencial de esa identidad falta, está revocada o no tiene permiso, no se registra nada y el despliegue termina en fallo. El registro nunca recurre a otra credencial con más privilegios, tampoco como reserva. |
| REQ-020 | La credencial la pone una persona fuera del repositorio (artículo 4). No aparece en el repositorio, en los prompts, en los registros, en la auditoría ni en las evidencias; no se comparte entre entornos; y no está al alcance del panel, del conector ni de las sesiones de usuario. |

### Paso a vigente antes del panel (mínimo de la fase 2)

| ID | Requisito |
| --- | --- |
| REQ-021 | Existe un procedimiento escrito para hacer vigente en un canal una versión registrada, ejecutado y aprobado por quien fije la cuestión abierta 2. Solo admite versiones registradas en ese mismo entorno cuya huella sea coherente con su texto guardado. |
| REQ-022 | Hacer vigente una versión deja una entrada nueva en el historial de publicaciones del canal, con canal, versión, autor identificado y fecha, y una fila de auditoría. No modifica la versión. |
| REQ-023 | Tras hacerla vigente, la siguiente revisión de cada agente del canal recibe esa versión con su huella registrada, y los agentes del otro canal reciben lo mismo que antes. |
| REQ-024 | Existe una vuelta atrás escrita y probada en preproducción (artículo 11): vuelve a hacer vigente en un canal la versión que lo era antes; si no había ninguna, los agentes de ese canal dejan de recibir instrucciones. En ningún caso reciben un texto no registrado. |

### Auditoría, registros y errores

| ID | Requisito |
| --- | --- |
| REQ-025 | Cada versión registrada deja exactamente una fila de auditoría con un actor identificable como el despliegue de ese entorno, la acción, la versión, el commit y la fecha. La auditoría nunca guarda el texto del prompt ni fragmentos suyos. |
| REQ-026 | Los intentos de registro que llegan a la base de datos y se rechazan (identidad sin permiso, número ya registrado con otro texto, huella incoherente) quedan anotados con actor, acción, motivo de una lista cerrada y fecha, sin valores recibidos. |
| REQ-027 | Cada despliegue deja un resultado legible del registro, en español: entorno, commit, versiones registradas (número y huella), versiones ya registradas que coinciden y, si falla, el archivo o la versión afectados y el motivo de una lista cerrada. |
| REQ-028 | Ni los registros, ni los errores, ni la auditoría, ni las evidencias contienen el texto del prompt o fragmentos suyos, credenciales, cadenas de conexión ni mensajes de error de la base de datos sin tratar. |

### Cierre en fallo y entradas no confiables

| ID | Requisito |
| --- | --- |
| REQ-029 | Si el registro falla o encuentra una incoherencia, la versión vigente de cada canal sigue siendo la misma que antes del despliegue y ningún agente recibe un texto que no figure en el registro con su huella (artículo 3). |
| REQ-030 | El contenido de los archivos de versión es dato (artículo 7): nada de lo que contengan (cabeceras, metadatos, frases con forma de orden) cambia qué se registra, con qué número, en qué entorno, qué versión es vigente ni en qué canal, ni evita una comprobación. |

### Reversibilidad y operación

| ID | Requisito |
| --- | --- |
| REQ-031 | Volver a servir un despliegue anterior (vuelta atrás de la función 002) no borra ni altera versiones registradas, no cambia la versión vigente de ningún canal y no queda bloqueado por versiones registradas después del commit al que se vuelve. |
| REQ-032 | Una versión registrada con un error se corrige registrando una versión nueva con otro número; la errónea queda en el registro intacta. Los cambios de estructura que necesite esta función tienen vuelta atrás probada en CI que conserva íntegro el registro; en producción, el registro se corrige hacia delante, sin revertir (respuesta del responsable del 12/11/2026 a la cuestión 14 de la función 010). |
| REQ-033 | La guía de operación explica, en español y sin secretos: qué entornos registran, cómo se lee el resultado del registro, qué hacer ante cada motivo de fallo de la lista cerrada, y el procedimiento para hacer vigente una versión y para volver atrás. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-034 | Despliegue desde una rama que no es la principal, de un commit que no está integrado en ella, desde una copia de trabajo con cambios pendientes (incluido un archivo de versión modificado y sin commit) o con la comprobación de la rama principal en rojo | No se registra nada. Nunca se registra un texto tomado de la copia de trabajo en lugar del commit |
| REQ-035 | Registro lanzado por una persona fuera de un despliegue, desde el panel, con una sesión de superadmin o de cliente, o con la identidad del conector, por la interfaz o con una llamada directa | Se rechaza; 0 versiones nuevas; si el intento llega a la base de datos, queda anotado |
| REQ-036 | El archivo de una versión ya registrada cambia en el repositorio, aunque sea un byte, un final de línea o la codificación | No se registra ni se sustituye nada; la versión registrada queda intacta; el despliegue termina en fallo con el motivo «archivo cambiado» |
| REQ-037 | Se intenta registrar un número ya registrado con otro texto por otra vía (otro commit desplegado a la vez, una fila previa con ese número en el registro) | No se registra; la versión existente queda intacta; el despliegue termina en fallo; el intento queda anotado |
| REQ-038 | El archivo de una versión ya registrada desaparece del commit desplegado o cambia de nombre | La versión registrada queda intacta; el despliegue termina en fallo con el motivo «archivo desaparecido» |
| REQ-039 | Huella que no corresponde: el texto guardado de una versión registrada no produce su huella, o un intento de registro trae una huella que no es la de su texto | No se registra nada; el despliegue termina en fallo; esa versión no se puede hacer vigente; el conector no la sirve (función 011) |
| REQ-040 | Dos despliegues a la vez sobre el mismo entorno | Cada versión queda registrada exactamente una vez, sin duplicados ni mezclas de texto y huella. Si traen textos distintos para el mismo número, se registra exactamente uno y el otro despliegue termina en fallo |
| REQ-041 | La base de datos no responde antes de registrar o falla a mitad del registro | Ninguna versión queda a medias; las ya registradas antes del fallo quedan completas; el despliegue termina en fallo y no pasa a servir; un despliegue posterior completa lo que falta sin duplicar |
| REQ-042 | Texto de una versión nueva vacío, demasiado largo, que no es UTF-8 válido, con algo con formato de credencial, o con enlaces o direcciones de correo fuera de la lista cerrada | No se registra; el despliegue termina en fallo con el motivo «contenido rechazado»; el valor rechazado no aparece en el resultado ni en los registros |
| REQ-043 | Texto con instrucciones de enviar, borrar, compartir o introducir credenciales, o cualquier texto sin el dictamen favorable de REQ-013 sobre esa misma huella (dictamen ausente, de otro texto o con hallazgos bloqueantes abiertos) | No se registra; el despliegue termina en fallo con el motivo «sin revisión» |
| REQ-044 | Archivo en la carpeta de versiones con un nombre que no es un número válido ni figura en la lista cerrada de no registrables (por ejemplo, con letras, con prefijo, con dos puntos seguidos, con ceros a la izquierda, con espacios, con otra extensión o una copia de respaldo), o dos nombres que corresponden al mismo número | No se ignora en silencio: no se registra nada y el despliegue termina en fallo con el motivo «nombre inválido» |
| REQ-045 | La identidad del despliegue intenta modificar, borrar o vaciar una versión, hacer vigente o publicar, cambiar el canal de un cliente, leer datos de clientes o la auditoría, ejecutar las funciones del conector o crear un objeto | Se rechaza; nada cambia |
| REQ-046 | Falta la credencial del despliegue, está revocada o le han retirado el permiso | No se registra nada; el despliegue termina en fallo; no se recurre a otra credencial |
| REQ-047 | Un despliegue de vista previa o de preproducción, o la credencial de un entorno, se usan contra la base de datos de otro entorno, en particular la de producción | No se registra nada en el otro entorno |
| REQ-048 | Intento de hacer vigente una versión no registrada en ese entorno, un identificador inventado, un texto o una huella aportados por quien ejecuta el procedimiento, o una versión con huella incoherente | Se rechaza; el historial de publicaciones no cambia; nunca se sirve un texto o una huella que no salgan del registro |
| REQ-049 | Un archivo de versión contiene una cabecera o frases con forma de orden («canal: estable», «publicar en todos», «registrar como otra versión», «omitir comprobaciones») | No tienen ningún efecto: se registra el número del nombre del archivo, se hacen todas las comprobaciones y ningún canal cambia |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Salvo que se diga otra cosa, se ejecutan sobre una copia de prueba del repositorio y una base desechable, con datos ficticios, y lo que recibe el agente se comprueba con llamadas de agentes ficticios al conector sobre esa misma base. Los que dicen «en preproducción» se ejecutan allí, solo con las versiones que permita la cuestión abierta 10, porque lo registrado en preproducción no se puede borrar. En esta máquina no hay Docker: las pruebas de base de datos se ejecutan en CI y no se anotan como superadas en local (T-012).

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Un despliegue válido de un commit con 1 versión nueva crea exactamente 1 registro: número igual al del nombre del archivo, texto idéntico byte a byte al archivo del commit, huella igual a la calculada por separado sobre ese archivo, identificador completo del commit y fecha comprendida entre el inicio y el fin del despliegue (1 de 1 coincide en los cinco datos). Una fecha aportada por el paso de registro se ignora | REQ-001, REQ-004, REQ-005, REQ-006 |
| CA-002 | Con la carpeta de versiones conteniendo el arranque, la 1.2, dos versiones nuevas válidas y una subcarpeta con un archivo de nombre válido, se registran exactamente los archivos de la lista esperada escrita antes de ejecutar (según las cuestiones abiertas 4 y 5) y 0 de los demás | REQ-002 |
| CA-003 | Para cada nombre de una batería de al menos 8 nombres inválidos (con letras, con prefijo, con dos puntos seguidos, con ceros a la izquierda, con un espacio, en mayúsculas, con otra extensión, copia de respaldo) y para dos nombres que corresponden al mismo número: el 100 % de los despliegues termina en fallo con el motivo «nombre inválido» y se registran 0 versiones | REQ-003, REQ-044 |
| CA-004 | El mismo commit, con un archivo de versión con finales de línea de Windows y otro con marca de orden de bytes, se despliega desde dos copias de trabajo con configuraciones distintas de finales de línea sobre dos bases desechables: las huellas registradas son idénticas entre sí y a la calculada sobre el archivo del commit en el 100 % de los casos | REQ-004, REQ-005 |
| CA-005 | Se inyecta un fallo de la base de datos a mitad del registro, 20 veces: 0 versiones incompletas, y una consulta de coherencia confirma que el 100 % de las versiones registradas tiene texto que produce su huella. Un despliegue posterior registra lo que faltaba con 0 duplicados | REQ-007, REQ-041 |
| CA-006 | Se despliega 3 veces el mismo commit y una vez un commit posterior sin versiones nuevas: 0 registros nuevos y 0 alterados (recuento y huella del contenido completo del registro idénticos antes y después) | REQ-008 |
| CA-007 | Tras registrar una versión de prueba sin hacerla vigente, 20 revisiones de agentes ficticios de cada canal reciben la versión vigente anterior, o ninguna instrucción si no había, en el 100 % de los casos; 0 reciben la versión nueva | REQ-009 |
| CA-008 | Tres commits que cambian el archivo de una versión registrada (un carácter del texto, los finales de línea, la codificación): 3 de 3 despliegues terminan en fallo con el motivo «archivo cambiado», 0 cambios en el registro (huella del contenido completo idéntica) y el entorno sigue sirviendo el despliegue anterior | REQ-010, REQ-011, REQ-036 |
| CA-009 | Un commit que borra el archivo de una versión registrada y otro que lo renombra: 2 de 2 despliegues terminan en fallo con el motivo «archivo desaparecido» y 0 cambios en el registro | REQ-038 |
| CA-010 | Con una fila previa en el registro de la base desechable que tiene el mismo número que un archivo nuevo y otro texto: el despliegue termina en fallo, 0 registros nuevos, la fila previa queda idéntica y hay 1 anotación del intento con motivo de la lista cerrada y sin valores recibidos | REQ-026, REQ-037 |
| CA-011 | En una base desechable se altera por acceso de administración, fuera de la aplicación, el texto guardado de una versión para que no produzca su huella: el siguiente despliegue termina en fallo con 0 registros nuevos, el procedimiento de REQ-021 rechaza hacerla vigente y el conector entrega 0 instrucciones con ella | REQ-011, REQ-021, REQ-039 |
| CA-012 | Una batería de textos nuevos (vacío, de 100 001 caracteres, con bytes que no son UTF-8, con un valor de prueba con formato de credencial que no es una credencial válida, con un enlace externo, con una dirección de correo ficticia): 6 de 6 rechazados con el motivo «contenido rechazado», 0 registros, y el valor de prueba aparece 0 veces en el resultado, los registros y las evidencias | REQ-012, REQ-028, REQ-042 |
| CA-013 | Versiones nuevas sin dictamen del `auditor-seguridad`, sin dictamen del `revisor`, con dictamen sobre otra huella y con un hallazgo bloqueante abierto, y cuatro textos que piden enviar, borrar, compartir e introducir credenciales sin dictamen favorable: el 100 % no se registra, con el motivo «sin revisión». La misma versión con los dos dictámenes favorables sobre su huella exacta se registra. Cuando se resuelvan las cuestiones abiertas 8 y 9, se añaden sus condiciones con el mismo umbral | REQ-013, REQ-043 |
| CA-014 | Despliegues desde una rama no principal, de un commit no integrado, desde una copia con un archivo de versión modificado sin commit, con la comprobación de la rama principal en rojo, y el paso de registro ejecutado por sí solo fuera de un despliegue: 5 de 5 con 0 registros | REQ-014, REQ-034, REQ-035 |
| CA-015 | Intentos de registrar una versión con sesión de superadmin con doble factor, con sesión de superadmin sin doble factor, con usuario de cliente, sin sesión y con la identidad del conector, por la interfaz y con llamada directa: el 100 % se rechaza y hay 0 registros nuevos | REQ-015, REQ-035 |
| CA-016 | Un despliegue de vista previa y otro de preproducción con una versión nueva, y la credencial de preproducción usada contra una base que hace de producción: 0 registros en la base de otro entorno en el 100 % de los intentos | REQ-016, REQ-047 |
| CA-017 | Una prueba automática enumera los privilegios efectivos de la identidad del despliegue: exactamente añadir versiones y consultar número y huella de las registradas, y 0 privilegios más. Con esa identidad, modificar, borrar y vaciar versiones, hacer vigente, cambiar el canal de un cliente, leer clientes, leer la auditoría, ejecutar las funciones del conector y crear un objeto: 9 de 9 rechazados | REQ-017, REQ-018, REQ-045 |
| CA-018 | Sin credencial, con credencial revocada y con el permiso retirado: 3 de 3 despliegues terminan en fallo con 0 registros, y una revisión del código del paso de registro y de sus registros encuentra 0 usos de otra credencial | REQ-019, REQ-046 |
| CA-019 | El escáner de secretos está en verde; una búsqueda de la credencial de prueba en el repositorio, los registros, la auditoría y las evidencias da 0 coincidencias; una persona comprueba y anota, sin valores, que la credencial de cada entorno es distinta y que no figura en la configuración del panel ni del conector | REQ-020 |
| CA-020 | En preproducción, con el procedimiento de REQ-021, se hace vigente la 1.3 en un canal: aparece 1 entrada de historial con canal, versión, autor y fecha y 1 fila de auditoría; la huella de la versión es idéntica antes y después; la siguiente revisión del 100 % de los agentes ficticios de ese canal recibe la 1.3 con su huella registrada y el 100 % de los del otro canal recibe lo mismo que antes | REQ-021, REQ-022, REQ-023 |
| CA-021 | Vuelta atrás probada en preproducción y guardada como evidencia: con un canal pasado de V1 a V2, la vuelta atrás hace que el 100 % de los agentes del canal reciba V1 en su siguiente revisión; en un canal sin versión anterior, el 100 % recibe 0 instrucciones; en los dos casos, 0 textos no registrados | REQ-024 |
| CA-022 | Con el procedimiento de REQ-021 se intenta hacer vigente una versión no registrada en ese entorno, un identificador inventado, un texto y una huella aportados por quien lo ejecuta y una versión con huella incoherente: 4 de 4 rechazados y 0 entradas nuevas en el historial | REQ-021, REQ-048 |
| CA-023 | Tras un guion con 2 registros, 1 rechazo por número repetido, 1 paso a vigente y 1 vuelta atrás, hay exactamente 1 fila de auditoría por acción con actor, acción, objeto y fecha, el actor de los registros identifica al despliegue del entorno, y una búsqueda de una frase marcadora del texto de prueba en la auditoría da 0 coincidencias | REQ-022, REQ-025, REQ-026 |
| CA-024 | Para un despliegue correcto y uno por cada motivo de la lista cerrada, el resultado contiene entorno, commit, versiones registradas con número y huella, versiones coincidentes y, en fallo, el archivo o versión y el motivo correcto, en español (100 %). Una búsqueda en los registros y evidencias de la frase marcadora del texto de prueba, de la credencial de prueba y de mensajes de error de la base de datos sin tratar da 0 coincidencias | REQ-027, REQ-028 |
| CA-025 | Para cada uno de al menos 6 motivos de fallo (archivo cambiado, archivo desaparecido, base de datos caída, identidad sin permiso, contenido rechazado, despliegue simultáneo perdedor), 20 revisiones de agentes ficticios después del fallo reciben la misma versión y huella que antes, o ninguna instrucción si no había, en el 100 % de los casos, y 0 reciben un texto no registrado | REQ-029 |
| CA-026 | Un archivo de versión con revisión favorable que contiene una cabecera y al menos 4 frases con forma de orden se registra con el número de su nombre, el resultado del despliegue muestra todas las comprobaciones ejecutadas, y la versión vigente y el canal de cada cliente ficticio quedan iguales (100 %) | REQ-030, REQ-049 |
| CA-027 | 20 veces, dos despliegues simultáneos del mismo commit con una versión nueva dejan exactamente 1 registro; 20 veces, dos commits con el mismo número y textos distintos desplegados a la vez dejan exactamente 1 registro y 1 despliegue en fallo; 0 registros con texto de uno y huella de otro | REQ-040 |
| CA-028 | Con la base de datos inaccesible antes de empezar y con 20 fallos inyectados a mitad: 0 versiones incompletas, el 100 % de los despliegues termina en fallo sin pasar a servir y el entorno sigue sirviendo el anterior; con la base disponible, un despliegue posterior completa el registro sin duplicados | REQ-029, REQ-041 |
| CA-029 | En preproducción, un despliegue N registra una versión nueva; se vuelve a servir el despliegue N-1 siguiendo la guía de la función 002: recuento y huellas del registro idénticos, versión vigente de cada canal idéntica, y la vuelta atrás termina sin bloqueo. Después se vuelve a servir N con el mismo resultado | REQ-031 |
| CA-030 | Una versión de prueba con un error se corrige con otra de número nuevo: las dos figuran en el registro y la huella de la errónea no cambia. En CI, con el registro cargado, cada migración de esta función se aplica, se revierte y se vuelve a aplicar con la huella del contenido completo del registro idéntica (0 diferencias). El procedimiento de vuelta atrás de producción, en simulación, se niega a revertir lo que crea o contiene el registro (100 %) | REQ-032 |
| CA-031 | El `revisor` comprueba que la guía de operación contiene los cinco puntos de REQ-033, en español, y el escáner de secretos sobre la guía da 0 hallazgos | REQ-033 |

## Fuera de alcance

Sigue en la fase 4 (función 030):

- Publicar, promover y volver atrás desde el panel; la pantalla de versiones.
- Los canales como gestión (asignar clientes, grupo de prueba), la permanencia mínima en `prueba` y los criterios de promoción.
- El aviso fuera del panel al publicar, y el aviso al registrar (cuestión 12 de la función 030).
- La comprobación periódica de coincidencia, su anotación por versión y su vista en el panel. Esta función solo comprueba la coincidencia en cada despliegue (REQ-011) y da el despliegue por fallido.
- Las métricas por versión y la pausa global.
- Marcar versiones como retiradas.

De otras funciones de la fase 2:

- El texto de la 1.3, del arranque, su banco de pruebas y su revisión (función 012). Esta función registra el archivo tal cual está; qué contiene no es asunto suyo.
- La estructura de la tabla de versiones y del historial de publicaciones, y su inmutabilidad frente a cualquier perfil o rol (función 010).
- La entrega de la versión vigente al agente, y qué recibe si no hay ninguna (función 011).

Además:

- Las notas de versión del modelo de referencia (columna de notas): esta función no las registra.
- El repositorio remoto y la protección de la rama en el proveedor (función 003, aplazada). Aquí se usa la rama principal según el procedimiento vigente.
- Crear proyectos, cuentas o credenciales: lo hace una persona (función 002, actos reservados).
- Cualquier editor del texto del prompt, ahora o más adelante (ADR-0005).

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **En qué entornos registra el despliegue durante la fase 2.** Opciones: (a) solo preproducción, con lo que la 1.3 real se sirve allí y en producción no hay nada que servir hasta que se decida aplicar algo en producción; (b) preproducción y producción, lo que exige aplicar migraciones en producción en la fase 2, y eso choca con la recomendación aún sin respuesta de la cuestión 16 de la función 010 («no se aplica nada en producción en la fase 2»); (c) además desarrollo, donde no hay despliegue: habría que definir cómo llegan allí las versiones sin que lo haga «una persona fuera del despliegue» (REQ-014). **Respondida en parte el 12/11/2026:** en la fase 2 no se aplica nada en producción (respuesta «No, solo pruebas» a la cuestión 16 de la función 010), así que la opción (b) queda descartada. Sigue abierto si se registra también en desarrollo.
2. **Cómo pasa una versión registrada a ser la vigente de un canal sin panel, quién lo aprueba y cómo se vuelve atrás.** Opciones: (a) una persona ejecuta un procedimiento escrito con una credencial propia distinta de la del despliegue, anotado en el registro de operación, lo que añade una vía manual que la fase 4 sustituirá; (b) el despliegue la hace vigente en `prueba` de forma automática, lo que contradice el ADR-0005 (punto 3) y el requisito 6 de la función 030 (la identidad del despliegue no publica); (c) un archivo revisado del repositorio declara qué versión es vigente en cada canal y el despliegue lo aplica, lo que lleva la publicación al despliegue revisado y exige cambiar el ADR-0005. En todas hay que decidir también en qué canal o canales se hace vigente la 1.3 (directamente en `estable` choca con la permanencia en `prueba` de los requisitos 17 y 46 de la función 030, salvo que se declare excepción de transición) y si la vuelta atrás de la primera versión deja el canal sin instrucciones (REQ-024) o se resuelve con la pausa, como recomienda la cuestión 12 de la función 012.
3. **Con qué identidad registra el despliegue.** `docs/ESQUELETO.md` y el ADR-0003 (punto 5) dicen que el registro de versiones usa la clave secreta confinada, que puede leer y escribir todas las tablas; el requisito 6 de la función 030 y REQ-017 piden una identidad que solo añada versiones. Opciones: (a) identidad propia que solo añade, lo que exige verificar que es viable en la plataforma (como V-107 para el conector) y cambiar el esqueleto y el ADR-0003; (b) clave secreta confinada, lo que deja REQ-017, REQ-018, REQ-045 y CA-017 sin objeto y hace que una clave filtrada permita registrar versiones con cualquier texto y leer datos de clientes.
4. **Si la 1.2 se registra.** Opciones: (a) no se registra y figura en la lista cerrada de no registrables, como recomienda la cuestión 7 de la función 012, con lo que nunca se puede servir por el conector; (b) se registra como referencia, con lo que podría hacerse vigente un texto que escribe en la carpeta `panel` y no funciona con el conector.
5. **Si el arranque local se registra o se versiona aparte.** Opciones: (a) no se registra: se versiona solo en el repositorio con su identificador propio (requisito 22 de la función 012), y su huella no queda en la base de datos; (b) se registra en un registro separado, para poder demostrar qué arranque se instaló, lo que amplía esta función; (c) se registra en el mismo registro, lo que permitiría hacerlo vigente y servirlo como prompt, y es justo lo que no debe pasar.
6. **Formato del número de versión.** Opciones: (a) solo `mayor.menor`, como dice la skill `version-prompt`; (b) `mayor.menor` con un tercer número opcional, como admiten el modelo de referencia y el contrato del informe. Es la misma pregunta que la cuestión 14 de la función 030; conviene una sola respuesta para las dos. En los dos casos, REQ-003 exige una sola escritura por número (sin ceros a la izquierda).
7. **Qué pasa si el despliegue registra y después falla o se vuelve atrás, o si el archivo de una versión registrada se retira de la rama principal.** La versión queda registrada para siempre aunque su despliegue nunca haya servido, y si su archivo se retira de la rama principal todos los despliegues siguientes fallan por REQ-038. Opciones: (a) se acepta: un archivo registrado no se retira nunca del repositorio, y la vuelta atrás del código es siempre volver a servir el despliegue anterior, sin revertir el commit; (b) se admite marcar una versión como retirada para que su archivo pueda desaparecer sin bloquear, lo que adelanta parte de la cuestión 8 de la función 030; (c) se registra solo cuando el despliegue ya ha pasado la comprobación posterior y va a servir, lo que reduce las versiones huérfanas pero deja un momento en que el código nuevo sirve sin su versión registrada.
8. **Si integrar una versión nueva del prompt exige la aprobación expresa del responsable.** Con la función 003 aplazada, la integración en la rama principal es desasistida (función 002) y los archivos de `prompts/` no están en la lista de cambios reservados. Opciones: (a) sí, se añaden a los cambios reservados, con lo que ningún texto se registra sin una persona, a costa de su tiempo; (b) no, basta la revisión del `revisor` y del `auditor-seguridad`, con lo que una versión puede quedar registrada para siempre en preproducción sin intervención humana (en producción sigue haciendo falta el acto del responsable para desplegar).
9. **Si el despliegue comprueba que la versión pasó el banco de pruebas de la función 012 y cómo.** Opciones: (a) el despliegue exige una evidencia del banco ligada a la huella exacta del texto, con lo que no se registra nada sin banco, pero el banco necesita servir la versión antes de registrarla (cuestión 21 de la función 012); (b) lo comprueba la persona que aprueba el paso a vigente (cuestión 2), con lo que se registran versiones sin banco pero no se sirven; (c) no se comprueba en esta función.
10. **Qué ocurre con las versiones ficticias de los datos de prueba y con las versiones de prueba de esta función.** Si los datos ficticios insertan versiones directamente, contradicen REQ-014 y REQ-015; si usan el número 1.3 con otro texto, el registro de la 1.3 real falla (REQ-037); y si no tienen archivo en el repositorio, todos los despliegues fallan por REQ-038. Opciones: (a) los datos ficticios no contienen versiones y la única versión en desarrollo y preproducción es la registrada por el despliegue; (b) contienen versiones con números reservados a pruebas y quedan fuera de la comprobación de REQ-011, lo que abre una excepción a la regla; (c) los textos de prueba viven como archivos en el repositorio y se registran como cualquier otro, lo que los deja para siempre y los hace publicables. También: si las versiones hostiles para el banco (cuestión 21 de la función 012) pueden registrarse en preproducción, donde no se podrían borrar.
11. **Qué commit se registra.** Opciones: (a) el commit desplegado en el que se registró la versión, que es el que se puede comprobar en ese momento; (b) el commit que introdujo el archivo en la rama principal, que señala la petición de cambio revisada pero obliga a buscarlo en el historial. Afecta a la comprobación de coincidencia de la función 030 (requisito 3).
12. **Auditoría del registro sin decidir en la función 010.** Esta función exige auditar cada registro (REQ-025, REQ-026), pero la cuestión 17 de la función 010 («qué escrituras se auditan») sigue sin respuesta. Si el responsable decide auditar solo las escrituras de usuarios, REQ-025 contradice esa decisión y hay que elegir cuál manda.
13. **Reparto con la función 030.** ¿Se acepta que el registro por despliegue sea de esta función y que la 030 lo dé por hecho y solo añada lo de la fase 4 (comprobación periódica, vista en el panel, aviso)? Si se acepta, la 030 tiene que retirar o remitir a esta los requisitos que quedan cubiertos (lista en `propuestas.md`) y ajustar su requisito 1, que solo habla de producción; si no, las dos funciones especifican lo mismo y pueden divergir.

## Dependencias y decisiones relacionadas

**Decisiones y documentos**

- Constitución: artículos 3 (REQ-010, REQ-017 a REQ-019, REQ-029, REQ-039 a REQ-041, REQ-046), 4 (REQ-020, REQ-028), 7 (REQ-030, REQ-049), 9 (REQ-001 a REQ-016, REQ-036 a REQ-038), 10 (REQ-027, REQ-033), 11 (REQ-024, REQ-031, REQ-032), 12 (REQ-027, REQ-033) y 13 (criterios en CI, no en local).
- D-007 y ADR-0005 (mandan sobre esta función). D-007 tiene «Fase 4» como próxima acción; el adelanto va a coordinación.
- ADR-0003, punto 5, y convención de la clave secreta de `docs/ESQUELETO.md` (cuestión abierta 3).
- T-004 (claves), T-012 (sin Docker, pgTAP en CI).
- Respuesta del responsable del 12/11/2026 a la cuestión 11 de la función 011 («Adelantar registro») y a la cuestión 14 de la función 010 («hacia delante», REQ-032).
- `docs/SEGURIDAD.md`: A-12; «Registro, publicación y entrega de versiones del prompt» es ruta crítica y necesita dictamen del `auditor-seguridad`.
- `.claude/rules/prompts.md` y skill `version-prompt`.
- Contrato `contratos/obtener-instrucciones.schema.json` (formato de la versión, de la huella y tamaño máximo del prompt).
- Modelo de referencia `docs/MODELO-DATOS.sql` (tablas `versiones_prompt` y `publicaciones`, disparadores de solo inserción, permisos), en estado PROPUESTA: orienta, no obliga.

**Supuestos sobre otras funciones (a confirmar)**

- Función 002: rama principal local, procedimiento de integración con su comprobación, entornos de preproducción y producción, despliegue en producción solo con acto expreso del responsable y vuelta atrás volviendo a servir el despliegue anterior. Función 003 aplazada.
- Función 010: crea la tabla de versiones y el historial de publicaciones, su inmutabilidad y, si se acepta su cuestión 15, el rechazo en la base de datos de una huella que no corresponde al texto.
- Función 011: sirve la versión vigente del canal con su huella y no entrega instrucciones si texto y huella no corresponden o no hay versión.
- Función 012: el texto de la 1.3 y del arranque, su revisión y su banco, previos al registro.
- Función 030 (fase 4): todo lo que figura arriba como fuera de alcance. Propuesta de reparto en `propuestas.md`.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
