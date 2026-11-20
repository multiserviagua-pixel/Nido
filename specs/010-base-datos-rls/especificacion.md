# 010 · Base de datos, RLS y pruebas de aislamiento

Estado: PLANIFICADA
Fase: 2 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

La base de datos es la fuente de verdad del producto y la última línea del aislamiento entre clientes (ADR-0003). Si un filtro se olvida en el código del conector o de un dashboard, la base de datos tiene que seguir impidiendo que un cliente vea o toque lo de otro, que alguien sin doble factor administre y que se reescriban el prompt o la auditoría. Esta función crea la estructura definitiva a partir del modelo de referencia y demuestra con pruebas automáticas, bloqueantes en CI, que esas garantías se cumplen. No define qué devuelven las herramientas ni cómo se emiten los tokens: solo la estructura, los permisos y el aislamiento sobre los que se apoyan.

Es dueña de la migración base definitiva (modelo de referencia con los cambios 1 a 7 de `propuestas.md`), de su vuelta atrás y de las pruebas de aislamiento, antes T-007 y T-008 de la 002 (R-1, 20/11/2026).

## Quién la usa y cómo

- Como **responsable de HumanaIA**, quiero que el aislamiento entre clientes esté demostrado por pruebas que bloquean cualquier cambio que lo rompa, para no depender de que nadie olvide un filtro.
- Como **usuario de un cliente**, quiero ver solo los datos de mi empresa y no poder cambiar nada, para confiar en que nadie más ve los míos.
- Como **superadmin**, quiero que mi acceso exija doble factor y que todo lo que cambio quede auditado sin guardar valores, para que una sesión robada no baste y para poder reconstruir qué pasó.
- Como **conector**, quiero ejecutar mis tres operaciones y nada más, para que un fallo en mi código no exponga tablas.
- Como **equipo de ingeniería**, quiero que cada migración tenga vuelta atrás probada y que nada llegue a producción sin aprobación, para poder deshacer un error sin improvisar.

### Perfiles que se prueban

Estos perfiles aparecen en los requisitos y criterios:

| Perfil | Quién es |
| --- | --- |
| Sin sesión | Cualquiera que llama a la API con la clave publicable y sin iniciar sesión |
| Usuario de A / usuario de B | Usuario con sesión vinculado solo al cliente ficticio A o solo al B |
| Usuario de A y B | Usuario con sesión vinculado a los clientes ficticios A y B, y no al C |
| Usuario sin vínculo | Usuario con sesión que no está vinculado a ningún cliente ni es superadmin |
| Superadmin sin doble factor | Usuario que figura como administrador pero cuya sesión no ha superado el segundo factor |
| Superadmin con doble factor | Usuario que figura como administrador y cuya sesión ha superado el segundo factor |
| Rol del conector | Rol propio de la base de datos con el que se conecta el conector (ADR-0003, V-107) |
| Rol de la clave secreta | Rol que usa la clave secreta del servidor (T-004), confinada a un solo módulo |

**Tablas internas**: las de tokens, códigos de autorización, clientes OAuth y eventos de cobro (`tokens`, `codigos_autorizacion`, `clientes_oauth`, `eventos_stripe` en el modelo de referencia).

## Requisitos

Cada requisito es comprobable y dice qué, no cómo.

| ID | Requisito |
| --- | --- |
| REQ-001 | La base de datos de cada entorno está alojada en una región de la UE (T-003). Los proyectos y cuentas los crea una persona; ningún agente crea cuentas, proyectos ni secretos. |
| REQ-002 | Toda la estructura (tablas, tipos, restricciones, vistas, funciones, roles y permisos) se crea solo con migraciones versionadas en el repositorio, derivadas de `docs/MODELO-DATOS.sql` y del diseño de esta función. Aplicarlas en orden sobre una base vacía produce la estructura completa sin pasos manuales, salvo fijar los secretos, que hace una persona. |
| REQ-003 | Existe un conjunto de datos ficticios que se carga en desarrollo y en el entorno previo y nunca en producción. Incluye al menos tres clientes (A, B y C) con licencia, conexión, ejecuciones, informes, órdenes y reglas, y un usuario por cada perfil de la tabla de perfiles. No contiene ningún dato real ni ningún secreto. |
| REQ-004 | Todas las tablas de los esquemas accesibles desde la API tienen el control de acceso por fila activado desde la misma migración que las crea, y ninguna migración lo desactiva. |
| REQ-005 | Un usuario de cliente solo puede leer filas de su propio cliente, y solo en las tablas y vistas de la lista cerrada de REQ-057. No puede insertar, modificar ni borrar en ninguna tabla. |
| REQ-006 | El acceso de superadmin exige a la vez figurar en la tabla de administradores y tener una sesión con doble factor. La base de datos lo comprueba en cada consulta, a partir de sus propias tablas y de la sesión, nunca de datos editables por el usuario (T-005). |
| REQ-007 | El superadmin con doble factor solo puede hacer, en cada tabla, las operaciones de una lista cerrada fijada en el diseño. En ningún caso puede insertar, modificar ni borrar versiones del prompt, informes ni ejecuciones, ni escribir directamente en la auditoría. |
| REQ-008 | Las tablas internas no se pueden leer ni escribir desde la API con ningún perfil de usuario, incluido el superadmin con doble factor. |
| REQ-009 | Las vistas devuelven a cada perfil exactamente las filas que ese perfil podría leer en las tablas de las que se alimentan; nunca más. |
| REQ-010 | Ninguna función del esquema privado es ejecutable por los perfiles sin sesión ni por los usuarios con sesión, ni invocable a través de la API. La única excepción es la lista cerrada de dos funciones de apoyo a las reglas de acceso (T-005; cuestión 4), y cada una solo devuelve información sobre el propio usuario que consulta. |
| REQ-011 | Una función, tabla o vista creada después en cualquier esquema no concede por sí sola ningún permiso a los perfiles sin sesión, a los usuarios con sesión ni al rol del conector: todo permiso es explícito. |
| REQ-012 | El rol del conector solo puede ejecutar las tres funciones del conector. No tiene ningún permiso sobre tablas, vistas, secuencias ni otras funciones, y su credencial no aparece en el repositorio ni en las migraciones. |
| REQ-013 | Ninguna función ejecutable por el rol del conector recibe un identificador de cliente o de licencia: el cliente se deriva del token dentro de la base de datos (constitución, artículo 2; requisito 10 de la función 001). |
| REQ-014 | Una llamada del conector con el token de un cliente no lee ni modifica ninguna fila de otro cliente, aunque reciba identificadores (de ejecución, de orden u otros) que pertenezcan a ese otro cliente. |
| REQ-015 | Las versiones del prompt registradas no se pueden modificar, borrar ni vaciar con ningún perfil ni con el rol del conector ni con el rol de la clave secreta (constitución, artículo 9). |
| REQ-016 | La auditoría es de solo inserción: sus filas no se pueden modificar, borrar ni vaciar con ningún perfil ni rol de la aplicación, y solo las crea la propia base de datos en los casos de REQ-017, REQ-060 y REQ-061, nunca una inserción directa de un usuario. |
| REQ-017 | Toda escritura (alta, cambio o baja) que haga un usuario a través de la API en cualquier tabla deja una fila de auditoría por cada fila afectada, con quién la hizo, qué acción, sobre qué tipo de objeto y qué identificador, de qué cliente si lo hay y cuándo. |
| REQ-018 | La auditoría nunca guarda valores de las filas cambiadas: solo los datos del requisito anterior. Su conjunto de columnas es cerrado. |
| REQ-019 | Los campos que dicen quién hizo algo (quién creó un código de activación, quién creó una orden, quién publicó una versión, quién resolvió una alerta, y cualquier otro de autoría) se derivan de la sesión. Un usuario no puede dejar registrado como autor a otro. |
| REQ-020 | Las tablas de informes y de reglas por cliente no tienen ninguna columna de texto libre: cada columna es un entero acotado, un booleano, un valor de lista cerrada, una fecha, un identificador o un texto de formato cerrado (constitución, artículo 1; D-008). |
| REQ-021 | Los rangos, formatos y listas cerradas que admite la tabla de informes coinciden con los de `contratos/informe.schema.json`. |
| REQ-022 | Un informe solo puede guardar códigos de problema que existan en el catálogo, sin repetir y cinco como mucho, aunque la fila se intente escribir sin pasar por el conector. |
| REQ-023 | Existe una lista cerrada de todas las columnas de texto del esquema, cada una con su límite de longitud o su formato y su justificación. Una columna de texto que no esté en la lista hace fallar las pruebas. |
| REQ-024 | Los tokens y los códigos (de activación y de autorización) solo se guardan como HMAC. Las columnas que los guardan solo aceptan el formato del HMAC y no existe ninguna columna con su valor en claro. El secreto del HMAC no está en la base de datos (A-05). |
| REQ-025 | Ninguna migración, dato ficticio, prueba ni evidencia contiene secretos: ni la credencial del rol del conector, ni el secreto del HMAC, ni claves de la API (constitución, artículo 4). |
| REQ-026 | La estructura impone estas reglas de integridad: como mucho una licencia no revocada por cliente; una sola fila de ajustes globales; como mucho un informe por ejecución; el cliente de un informe es el de su ejecución, y el de una ejecución es el de la licencia de su conexión. |
| REQ-027 | Las pruebas automáticas de esta función se ejecutan en CI en cada cambio y son bloqueantes: un cambio que haga fallar alguna no puede integrarse en la rama principal. |
| REQ-028 | Las pruebas se ejecutan contra la estructura que resulta de aplicar las migraciones reales, no contra el modelo de referencia ni contra una simulación. Una prueba que no se ha ejecutado en CI no se anota como superada (constitución, artículo 13; T-012). |
| REQ-029 | Cada migración tiene vuelta atrás. Aplicarla, revertirla y volver a aplicarla deja la misma estructura, y esa secuencia se prueba en CI (constitución, artículo 11). |
| REQ-030 | Una migración se aplica entera o no se aplica: no deja la base de datos en un estado intermedio. |
| REQ-031 | Ninguna migración se aplica en producción sin la aprobación expresa del responsable, registrada con fecha y commit. |
| REQ-032 | Las consultas que filtran por cliente se mantienen rápidas con volumen: cada columna por la que las reglas de acceso filtran por cliente o por usuario tiene índice (T-005), y las lecturas de resumen cumplen el umbral de rendimiento del criterio correspondiente. |
| REQ-033 | Solo los esquemas que la arquitectura necesita son accesibles desde la API. El esquema privado no lo es nunca. |
| REQ-034 | Retirar a un usuario de un cliente, o retirarlo de administradores, le quita el acceso correspondiente en su siguiente consulta, aunque su sesión siga vigente. |
| REQ-055 | La base de datos rechaza el registro de una versión del prompt cuya huella no corresponde a su texto, sea cual sea el perfil o el rol que la registra, incluido el de la clave secreta. |
| REQ-056 | La estructura incluye ya todas las tablas del modelo de referencia, también las de fases posteriores, con su control de acceso y su aislamiento probados aquí. Todo cambio posterior en ellas va en su propia migración reversible. |
| REQ-057 | La lista cerrada de lectura del usuario de cliente es exactamente: su cliente, su licencia, sus órdenes, ejecuciones, informes y suscripción, el resumen, las métricas por versión y el catálogo de problemas. No lee conexiones, alertas ni reglas, tampoco las de su cliente. Ampliarla exige una migración nueva con sus pruebas (fase 5). |
| REQ-058 | Un usuario puede estar vinculado a más de un cliente. Lee las filas de cada cliente al que está vinculado, con los límites de REQ-005 y REQ-057, y ninguna de un cliente al que no lo está. Cada fila del resumen indica a qué cliente pertenece. |
| REQ-059 | Dar de baja un cliente es una marca: en la misma operación se revocan todas sus conexiones, y si la revocación falla el cliente no queda de baja. Se conservan todas sus filas y las que dependen de él; en la fase 2 no hay borrado físico de clientes ni de sus datos (salvo la purga de material de seguridad de la función 014). |
| REQ-064 | Un cliente dado de baja (REQ-059) no lee ningún dato: ni sus usuarios con sesión ni el rol del conector, porque su licencia y sus conexiones ya no autorizan nada aunque alguna quedara sin revocar (constitución, artículo 3). Un usuario vinculado además a otro cliente sigue leyendo solo lo de ese otro. El superadmin con doble factor sí lee y audita el cliente de baja. |
| REQ-060 | El alta y la baja de administradores solo se hacen fuera de la API, por una persona con acceso privilegiado y con un procedimiento escrito en el repositorio. Ningún perfil de la API, incluido el superadmin con doble factor, puede crear ni retirar administradores. Cada alta y baja deja fila de auditoría. |
| REQ-061 | Además de lo de REQ-017, dejan fila de auditoría el registro de cada versión del prompt por el despliegue y los sucesos de seguridad de la autorización que fije la función 014. Las escrituras rutinarias del conector (ejecuciones, informes, confirmaciones de órdenes) no se auditan. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-035 | El usuario de A consulta cualquier tabla o vista, incluso filtrando expresamente por identificadores de B | Recibe cero filas de B. La respuesta no revela si esas filas existen |
| REQ-036 | El usuario de A intenta insertar, modificar o borrar filas de A o de B en cualquier tabla, vincularse a otro cliente o darse de alta como administrador | Se rechaza; no cambia ninguna fila y no queda ninguna fila de auditoría de un cambio que no ocurrió |
| REQ-037 | Una llamada sin sesión intenta leer o escribir cualquier tabla o vista, o ejecutar cualquier función | Se deniega en todos los casos; cero filas leídas o escritas |
| REQ-038 | Un usuario sin vínculo consulta cualquier tabla o vista | No recibe ninguna fila de datos de ningún cliente ni de administración |
| REQ-039 | Un superadmin sin doble factor intenta leer o cambiar datos de clientes o de administración | Se deniega como si no fuera administrador; si además está vinculado a un cliente, solo ve lo de ese cliente y como usuario de cliente |
| REQ-040 | La sesión llega sin el dato del segundo factor, con ese dato malformado o de un usuario que ya no existe | Se deniega; ningún dato ausente o inesperado amplía el acceso (constitución, artículo 3) |
| REQ-041 | El superadmin con doble factor intenta leer o escribir tablas internas, o escribir en versiones del prompt, informes, ejecuciones o auditoría | Se rechaza; nada cambia |
| REQ-042 | Cualquier perfil, el rol del conector o el rol de la clave secreta intentan modificar, borrar o vaciar una versión del prompt o una fila de auditoría | Se rechaza; el contenido queda idéntico |
| REQ-043 | Cualquier perfil intenta invocar directamente por la API una función del esquema privado, incluidas las del conector | Se rechaza sin ejecutarla: no se abre ninguna ejecución, no cambia ninguna orden y no se devuelve ningún dato |
| REQ-044 | El rol del conector intenta leer o escribir una tabla o vista, o ejecutar una función que no sea una de sus tres | Se rechaza |
| REQ-045 | El conector llama con el token de A y un identificador de ejecución o de orden de B | No se lee ni se modifica nada de B. La respuesta es la misma que con un identificador inexistente |
| REQ-046 | Se intenta escribir un informe con texto donde va una cifra o un código, con un código de problema fuera del catálogo, con cifras fuera de rango o con un cliente distinto del de su ejecución, incluso con el rol de la clave secreta | La estructura lo rechaza; no queda ninguna fila |
| REQ-047 | Un superadmin intenta crear un código de activación, una orden o una publicación, o resolver una alerta, indicando como autor a otro usuario | No queda registrado ningún autor distinto del de la sesión |
| REQ-048 | Una migración falla a medias | La base de datos queda exactamente como estaba antes de empezarla; ninguna tabla queda sin control de acceso por fila ni con permisos más abiertos que antes |
| REQ-049 | Dos operaciones simultáneas intentan crear una licencia no revocada para el mismo cliente | Solo una prospera; la otra se rechaza |
| REQ-050 | Se intenta aplicar una migración en producción sin aprobación registrada del responsable | No se aplica |
| REQ-051 | En CI la base de datos de pruebas no arranca o las pruebas no llegan a ejecutarse | El resultado es fallo, no omisión ni éxito |
| REQ-052 | Un usuario de cliente intenta ver el texto del prompt, códigos de activación, conexiones, alertas o reglas (también las de su cliente), tokens, la auditoría o los ajustes globales | No recibe ninguna fila |
| REQ-053 | Se intenta revertir en producción una de las migraciones que crean la auditoría o las versiones del prompt | No se revierte. Un error en ellas se corrige con una migración nueva. Su vuelta atrás solo se ejecuta en CI y en entornos sin datos reales (cuestión 14) |
| REQ-054 | La vuelta atrás de una migración posterior borraría o cambiaría filas de la auditoría o de las versiones del prompt | No se admite: la vuelta atrás de toda migración posterior conserva íntegro el contenido de las dos tablas |
| REQ-062 | Cualquier perfil de la API, incluido el superadmin con doble factor, intenta borrar físicamente un cliente o sus licencias, conexiones, ejecuciones, informes o alertas | Se rechaza; no desaparece ninguna fila. La baja solo es la marca de REQ-059 |
| REQ-063 | El superadmin con doble factor, o cualquier otro perfil de la API, intenta dar de alta o de baja un administrador, incluido él mismo | Se rechaza; la tabla de administradores no cambia y no queda fila de auditoría de un cambio que no ocurrió |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Salvo CA-001, CA-026, CA-027 y CA-032, todos se ejecutan en CI con las migraciones reales. En esta máquina no hay Docker: ninguna de esas pruebas se anota como superada en local.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | La región del proyecto de desarrollo `Nido` (D-020, `eu-north-1`, plan gratuito, ya creado), y de cada otro proyecto creado en la fase, consultada en la configuración del proveedor, es de la UE. La evidencia la anota la persona que lo creó, y el escáner de secretos da 0 hallazgos de credenciales del proveedor en el repositorio | REQ-001 |
| CA-002 | Aplicar todas las migraciones en orden sobre una base vacía y cargar los datos ficticios termina con 0 errores y sin ningún paso manual registrado en el procedimiento | REQ-002, REQ-003 |
| CA-003 | Los datos ficticios tienen al menos 3 clientes (A, B y C) y 1 usuario por cada perfil, incluido el usuario de A y B; el 100 % de las direcciones de correo usan dominios reservados para ejemplos; el procedimiento de producción revisado no incluye su carga | REQ-003, REQ-058 |
| CA-004 | Una consulta al catálogo de la base de datos, tras aplicar todas las migraciones y tras cada una por separado, encuentra 0 tablas sin control de acceso por fila en los esquemas accesibles desde la API | REQ-004 |
| CA-005 | Matriz de acceso: para cada tabla y vista, cada perfil de la tabla de perfiles y cada operación (leer, insertar, modificar, borrar), la prueba compara el resultado con la matriz esperada escrita en el diseño. Resultado: 0 discrepancias. Incluye que el superadmin con doble factor lee filas de A y de B, que el usuario de A y B lee filas de A y de B y 0 de C, y que los perfiles sin sesión, sin vínculo y superadmin sin doble factor leen 0 filas de datos de clientes | REQ-005 a REQ-009, REQ-037 a REQ-039, REQ-041, REQ-052, REQ-058 |
| CA-006 | Acceso cruzado (criterio 1.º de la fase 2): el usuario de A, en cada tabla y vista, con filtros por identificadores de B, lee 0 filas de B; cada intento de escritura sobre filas de A o de B, de vincularse a B o de hacerse administrador afecta a 0 filas y deja 0 filas de auditoría. Lo mismo de B hacia A, y del usuario de A y B hacia C. Cada fila del resumen que lee el usuario de A y B indica su cliente | REQ-009, REQ-035, REQ-036, REQ-058 |
| CA-007 | Funciones privadas (criterio 2.º de la fase 2): la consulta al catálogo encuentra 0 funciones del esquema privado ejecutables por los perfiles sin sesión y 0 ejecutables por usuarios con sesión fuera de las dos de REQ-010. Invocar por la API cada función del conector con cada perfil es rechazado en el 100 % de los casos, con 0 ejecuciones abiertas y 0 órdenes cambiadas | REQ-010, REQ-043 |
| CA-008 | Dentro de una transacción de prueba que se deshace al final se crean una función en el esquema privado y una tabla y una vista en el esquema público: los perfiles sin sesión, los usuarios con sesión y el rol del conector tienen 0 permisos sobre ellas | REQ-011 |
| CA-009 | Los permisos del rol del conector en el catálogo son exactamente las tres funciones del conector. Leer cada tabla y vista y ejecutar cada otra función con ese rol es rechazado en el 100 % de los casos | REQ-012, REQ-044 |
| CA-010 | La consulta al catálogo encuentra 0 funciones ejecutables por el rol del conector con algún parámetro que sea un identificador de cliente o de licencia | REQ-013 |
| CA-011 | Con el token de A y cada identificador de ejecución y de orden de B, las tres funciones del conector dejan 0 filas de B cambiadas, y su respuesta es idéntica a la que dan con un identificador inexistente | REQ-014, REQ-045 |
| CA-012 | Para cada perfil, el rol del conector y el rol de la clave secreta, modificar, borrar y vaciar las versiones del prompt y la auditoría es rechazado en el 100 % de los casos, y la huella del contenido completo de ambas tablas es la misma antes y después | REQ-015, REQ-016, REQ-042 |
| CA-013 | En cada tabla en la que algún usuario puede escribir, cada alta, cambio y baja que hace el superadmin con doble factor genera exactamente 1 fila de auditoría por fila afectada, con el actor igual al usuario de la sesión. Una inserción directa en la auditoría con cualquier perfil es rechazada | REQ-016, REQ-017 |
| CA-014 | Tras escribir en cada tabla auditada un valor marcador único, una búsqueda de ese marcador en todas las columnas de la auditoría da 0 coincidencias, y el conjunto de columnas de la auditoría coincide con la lista cerrada del diseño | REQ-018 |
| CA-015 | El superadmin X crea un código de activación, una orden y una publicación y resuelve una alerta indicando como autor al usuario Y: hay 0 filas con un autor distinto de X | REQ-019, REQ-047 |
| CA-016 | La consulta al catálogo encuentra 0 columnas de texto sin formato cerrado en las tablas de informes y de reglas, y 0 columnas de texto en todo el esquema que no figuren en la lista cerrada | REQ-020, REQ-023 |
| CA-017 | Una comparación automática entre `contratos/informe.schema.json` y las restricciones de la tabla de informes encuentra 0 diferencias de rango, formato o lista | REQ-021 |
| CA-018 | Con el rol de la clave secreta, cada inserción de un informe con un código fuera del catálogo, un código repetido, más de cinco códigos, texto donde va una cifra, una cifra fuera de rango o un cliente distinto del de su ejecución es rechazada en el 100 % de los casos, con 0 filas creadas. Lo mismo para una ejecución cuyo cliente no es el de su conexión | REQ-022, REQ-026, REQ-046 |
| CA-019 | Insertar en cada columna de token o código un valor sin el formato del HMAC es rechazado en el 100 % de los casos, y el catálogo no tiene ninguna columna de token o código sin esa restricción | REQ-024 |
| CA-020 | El escáner de secretos del CI sobre migraciones, datos ficticios, pruebas y evidencias da 0 hallazgos, y la revisión del `auditor-seguridad` de esos archivos da 0 hallazgos | REQ-025 |
| CA-021 | Dos transacciones simultáneas que crean una licencia no revocada para el mismo cliente: exactamente 1 confirma. Una segunda fila de ajustes globales es rechazada. Un segundo informe de la misma ejecución no crea fila | REQ-026, REQ-049 |
| CA-022 | En una rama de prueba se introducen por separado al menos 2 roturas deliberadas (quitar una regla de acceso de una tabla de clientes y conceder lectura de tokens a los usuarios con sesión): el CI termina en rojo en las 2 y la integración en la rama principal queda bloqueada | REQ-027 |
| CA-023 | El informe del CI muestra un número de pruebas ejecutadas igual al declarado en el diseño, con 0 omitidas y 0 fallidas. Si la base de datos de pruebas no arranca, el trabajo termina en fallo. Toda evidencia de esta función obtenida fuera de CI figura como «no ejecutada» | REQ-028, REQ-051 |
| CA-024 | En CI, para cada migración: se aplica, se revierte, el catálogo es idéntico al de antes de aplicarla (0 diferencias), se vuelve a aplicar y todas las pruebas pasan | REQ-029 |
| CA-025 | En CI, una migración de prueba que falla después de crear una tabla deja el catálogo idéntico al de antes (0 diferencias) y 0 tablas sin control de acceso por fila | REQ-030, REQ-048 |
| CA-026 | El procedimiento de aplicación en producción se ejecuta en simulación sin aprobación registrada y no aplica nada; cada aplicación real tiene una anotación con fecha, commit y aprobación del responsable (100 % de las aplicaciones). En la fase 2 no hay ninguna aplicación real en producción (cuestión 16), así que aquí el criterio se cierra con la simulación | REQ-031, REQ-050 |
| CA-027 | Con 10 clientes ficticios y un informe diario por cliente durante un año (cuestión 12), el resumen propio leído por un usuario de cliente y el resumen de todos leído por el superadmin responden en menos de 500 ms en el percentil 95 de 20 repeticiones en el proyecto de desarrollo `Nido`; el 100 % de las columnas usadas para filtrar por cliente o usuario en las reglas de acceso tienen índice | REQ-032 |
| CA-028 | La lista de esquemas accesibles desde la API en la configuración de cada proyecto coincide con la lista cerrada del diseño, y el esquema privado no figura en ella | REQ-033 |
| CA-029 | Se retira al usuario de A de su cliente, y a un superadmin de administradores: en la siguiente consulta con la misma sesión, los dos leen 0 filas de lo que antes veían | REQ-034 |
| CA-030 | Con una sesión sin dato de segundo factor, con ese dato malformado y con una sesión de un usuario borrado, se leen 0 filas de datos de clientes y se escriben 0 filas | REQ-040 |
| CA-031 | En CI, con filas cargadas en la auditoría y en las versiones del prompt: para cada migración posterior a las que crean esas tablas, revertirla y volver a aplicarla deja idéntica la huella del contenido completo de las dos (0 diferencias) | REQ-054 |
| CA-032 | El procedimiento de vuelta atrás en producción, ejecutado en simulación sobre cada una de las dos migraciones que crean la auditoría y las versiones del prompt, se niega a revertirlas en el 100 % de los intentos | REQ-053 |
| CA-033 | Con el rol que registra versiones y con el de la clave secreta, registrar una versión con la huella de otro texto, con su huella alterada en un carácter o sin huella es rechazado en el 100 % de los casos, con 0 filas creadas; la misma versión con su huella correcta se registra | REQ-055 |
| CA-034 | Tras aplicar las migraciones, comparar el catálogo con las tablas del modelo de referencia (con los cambios de `propuestas.md`) da 0 tablas que falten, y cada tabla figura en la matriz de CA-005 | REQ-056 |
| CA-035 | Con filas de A en todas las tablas, el conjunto de tablas y vistas en las que el usuario de A lee alguna fila es exactamente la lista de REQ-057 (0 de más, 0 de menos); en conexiones, alertas y reglas lee 0 filas | REQ-052, REQ-057 |
| CA-036 | El superadmin con doble factor da de baja al cliente A: A queda marcado, el 100 % de sus conexiones quedan revocadas, el número de filas de A en cada tabla es igual antes y después y la baja queda auditada; si la revocación se hace fallar, A no queda de baja. Borrar físicamente A o cada tipo de fila de REQ-062 con cada perfil de la API es rechazado en el 100 % de los intentos, con 0 filas borradas | REQ-059, REQ-062 |
| CA-037 | Con cada perfil de la API, incluido el superadmin con doble factor, insertar, modificar o borrar en la tabla de administradores es rechazado en el 100 % de los intentos, con 0 filas cambiadas y 0 de auditoría. El procedimiento escrito de alta y baja existe en el repositorio y, ejecutado en CI, da de alta y de baja a un administrador ficticio con 1 fila de auditoría por cambio | REQ-060, REQ-063 |
| CA-038 | Registrar una versión del prompt por la vía del despliegue deja exactamente 1 fila de auditoría; abrir una ejecución, guardar un informe y confirmar una orden con las funciones del conector dejan 0. Que los sucesos de seguridad de la autorización dejan fila se comprueba en los criterios de la función 014 | REQ-061 |
| CA-039 | Con filas de A y de B en todas las tablas, se da de baja A. Con la matriz de CA-005 como referencia: el usuario de A lee 0 filas en cada tabla y vista y escribe 0; el usuario de A y B lee 0 filas de A y las mismas de B que antes; las tres funciones del conector con el token de A, también con una conexión de A que la prueba deja sin revocar, se rechazan en el 100 % de las llamadas, con 0 ejecuciones abiertas, 0 órdenes cambiadas y 0 datos devueltos; el superadmin con doble factor lee las mismas filas de A que antes, también en la auditoría. El resto de la matriz da 0 discrepancias | REQ-059, REQ-064 |

## Fuera de alcance

- Qué devuelve cada herramienta del conector y cómo trata cada campo del informe: función 011. Aquí solo se garantizan la estructura, los permisos y el aislamiento.
- Activación, conexiones, emisión y rotación de tokens, límite de intentos y la lista de sucesos de seguridad de la autorización que se auditan: función 014.
- Cálculo de alertas de latido (ejecución sin informe, sin señal): función 013.
- Texto del prompt 1.3 y arranque local: función 012.
- Dashboards superadmin y de cliente, y la prueba de extremo a extremo de acceso cruzado por la interfaz: fases 3 y 5.
- Registro de versiones del prompt desde el despliegue y publicación por canal: fase 4. Aquí solo se garantiza que las versiones registradas son inmutables.
- Lógica de cobro y webhook de Stripe: fase 6.
- Copias de seguridad y restauración probada: fase 6.
- Plazos de conservación definitivos, borrado o anonimización de clientes dados de baja y registro de tratamiento: fase 6. En la fase 2 solo se purgan códigos y tokens que ya no valen, a los 30 días, y lo especifica la función 014 (cuestión 7).
- El confinamiento de la clave secreta en el código del servidor (A-10): se revisa en cada cambio de código, no lo garantiza la base de datos.
- Límites de peticiones por conexión y por dirección (A-22).
- La decisión sobre el entorno previo (V-114, fase 1).

## Cuestiones abiertas

Todas respondidas (texto y respuestas literales en `aclaraciones.md`).

1. Gasto y proyecto (B-002). Respondida 12/11 y 20/11/2026: proyecto de desarrollo `Nido`, gratuito; sin producción en la fase 2. CA-001.
2. Entorno previo (V-114). Respondida 20/11/2026: solo desarrollo hasta V-114. «Dependencias».
3. Tablas de fases posteriores. Respondida 20/11/2026: todas ahora. REQ-056, CA-034.
4. Funciones de apoyo a las reglas de acceso. Resuelta 12/11/2026 (T-005): lista cerrada de dos. REQ-010, CA-007.
5. Qué lee el usuario de cliente. Respondida 20/11/2026: lista mínima. REQ-057, CA-035.
6. Usuario con varios clientes. Respondida 20/11/2026: se permite. REQ-058, CA-003, CA-005, CA-006.
7. Conservación y purga. Respondida 13/11/2026: solo códigos y tokens inválidos, a los 30 días (014).
8. Baja de un cliente. Respondida 20/11/2026: marca, sin borrado físico; el cliente de baja no lee nada. REQ-059, REQ-062, REQ-064, CA-036, CA-039.
9. Primer superadmin. Respondida 20/11/2026: solo fuera de la API. REQ-060, REQ-063, CA-037.
10. Doble factor en las reglas de acceso (V-108). Respondida 20/11/2026: se verifica antes de diseñar; si no es viable, se para.
11. Rol propio del conector (V-107). Respondida 20/11/2026: igual que la 10.
12. Datos ficticios y volumen. Respondida 12/11 y 20/11/2026: tres clientes; 10 con un año de informes, p95 < 500 ms. CA-003, CA-027.
13. Nombre del cliente. Respondida 20/11/2026: texto acotado, dato personal. «Dependencias».
14. Vuelta atrás frente a inmutabilidad. Respondida 12/11/2026: hacia delante. REQ-053, REQ-054, CA-031, CA-032.
15. Huella de las versiones. Respondida 20/11/2026: la rechaza la base de datos. REQ-055, CA-033.
16. Producción en la fase 2. Respondida 12/11/2026: nada. CA-026.
17. Alcance de la auditoría. Respondida 20/11/2026: usuarios, despliegue y seguridad (014), no el conector. REQ-061, CA-038.

## Dependencias y decisiones relacionadas

- Constitución: artículos 1, 2, 3, 4, 9, 11 y 13.
- Decisiones: T-003, T-004, T-005, T-012, T-013, D-007, D-008, D-020, B-002. En estado VERIFICAR y no dadas por hechas: V-107, V-108, V-114.
- V-107 y V-108 se verifican (`verificar-decision`, también en el plan gratuito) antes de diseñar; si alguna no es viable, la función se para y vuelve al responsable (cuestiones 10 y 11).
- Hasta que la fase 1 decida V-114, las migraciones se aplican solo en `Nido`; el diseño anota la dependencia (cuestión 2).
- El nombre comercial sigue como texto acotado (REQ-023) y se trata como dato personal: entra en el registro de tratamiento de la fase 6 (cuestión 13).
- El cambio en el plan de la 002 por R-1 y las decisiones para `docs/TECNOLOGIAS.md` van por `propuestas.md` (n.º 16 a 18).
- ADR: 0003 (aislamiento por cliente), 0005 (prompt por despliegue), 0002 (activación, para la forma de códigos y conexiones).
- Amenazas de `docs/SEGURIDAD.md`: A-05, A-07, A-08, A-09, A-10, A-11, A-14.
- Modelo de referencia: `docs/MODELO-DATOS.sql`. Las diferencias que esta especificación pide respecto a él están en `specs/010-base-datos-rls/propuestas.md`.
- Contrato: `contratos/informe.schema.json`.
- Función 001: requisito 10 (el cliente se deriva del token). Fase 1: repositorio con CI y decisión sobre el conector, necesarios para implementar (`docs/PLAN.md`, «Reparto en chats»).
- Funciones 011, 012, 013 y 014 de la misma fase: se apoyan en esta estructura; esta función no depende de ellas, salvo la lista de sucesos de seguridad que fija la 014 (REQ-061).

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 20/11/2026 | Responsable (chat de la fase 2) | P0 abierta: «Aprobar la especificación», con las suposiciones (a), (b) y (c) confirmadas (REQ-060, CA-036, REQ-064). R-1: T-007 y T-008 de la 002 pasan a esta función. Comprobador SUPERADO; aviso de tamaño 34 KB (D-031) |
