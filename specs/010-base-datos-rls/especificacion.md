# 010 · Base de datos, RLS y pruebas de aislamiento

Estado: PROPUESTA
Fase: 2 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

La base de datos es la fuente de verdad del producto y la última línea del aislamiento entre clientes (ADR-0003). Si un filtro se olvida en el código del conector o de un dashboard, la base de datos tiene que seguir impidiendo que un cliente vea o toque lo de otro, que alguien sin doble factor administre y que se reescriban el prompt o la auditoría. Esta función crea la estructura definitiva a partir del modelo de referencia y demuestra con pruebas automáticas, bloqueantes en CI, que esas garantías se cumplen. No define qué devuelven las herramientas ni cómo se emiten los tokens: solo la estructura, los permisos y el aislamiento sobre los que se apoyan.

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
| REQ-003 | Existe un conjunto de datos ficticios que se carga en desarrollo y en el entorno previo y nunca en producción. Incluye al menos dos clientes (A y B) con licencia, conexión, ejecuciones, informes, órdenes y reglas, y un usuario por cada perfil de la tabla de perfiles. No contiene ningún dato real ni ningún secreto. |
| REQ-004 | Todas las tablas de los esquemas accesibles desde la API tienen el control de acceso por fila activado desde la misma migración que las crea, y ninguna migración lo desactiva. |
| REQ-005 | Un usuario de cliente solo puede leer filas de su propio cliente, y solo en las tablas y vistas de una lista cerrada fijada en el diseño. No puede insertar, modificar ni borrar en ninguna tabla. |
| REQ-006 | El acceso de superadmin exige a la vez figurar en la tabla de administradores y tener una sesión con doble factor. La base de datos lo comprueba en cada consulta, a partir de sus propias tablas y de la sesión, nunca de datos editables por el usuario (T-005). |
| REQ-007 | El superadmin con doble factor solo puede hacer, en cada tabla, las operaciones de una lista cerrada fijada en el diseño. En ningún caso puede insertar, modificar ni borrar versiones del prompt, informes ni ejecuciones, ni escribir directamente en la auditoría. |
| REQ-008 | Las tablas internas no se pueden leer ni escribir desde la API con ningún perfil de usuario, incluido el superadmin con doble factor. |
| REQ-009 | Las vistas devuelven a cada perfil exactamente las filas que ese perfil podría leer en las tablas de las que se alimentan; nunca más. |
| REQ-010 | Ninguna función del esquema privado es ejecutable por los perfiles sin sesión ni por los usuarios con sesión, ni invocable a través de la API. La única excepción posible es una lista cerrada de funciones de apoyo a las reglas de acceso, sujeta a la cuestión abierta 4; si existe, cada una de esas funciones solo devuelve información sobre el propio usuario que consulta. |
| REQ-011 | Una función, tabla o vista creada después en cualquier esquema no concede por sí sola ningún permiso a los perfiles sin sesión, a los usuarios con sesión ni al rol del conector: todo permiso es explícito. |
| REQ-012 | El rol del conector solo puede ejecutar las tres funciones del conector. No tiene ningún permiso sobre tablas, vistas, secuencias ni otras funciones, y su credencial no aparece en el repositorio ni en las migraciones. |
| REQ-013 | Ninguna función ejecutable por el rol del conector recibe un identificador de cliente o de licencia: el cliente se deriva del token dentro de la base de datos (constitución, artículo 2; requisito 10 de la función 001). |
| REQ-014 | Una llamada del conector con el token de un cliente no lee ni modifica ninguna fila de otro cliente, aunque reciba identificadores (de ejecución, de orden u otros) que pertenezcan a ese otro cliente. |
| REQ-015 | Las versiones del prompt registradas no se pueden modificar, borrar ni vaciar con ningún perfil ni con el rol del conector ni con el rol de la clave secreta (constitución, artículo 9). |
| REQ-016 | La auditoría es de solo inserción: sus filas no se pueden modificar, borrar ni vaciar con ningún perfil ni rol de la aplicación, y solo las crea la propia base de datos al producirse un cambio, nunca una inserción directa de un usuario. |
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
| REQ-052 | Un usuario de cliente intenta ver el texto del prompt, códigos de activación, conexiones, tokens, la auditoría o los ajustes globales | No recibe ninguna fila |
| REQ-053 | Se intenta revertir en producción una de las migraciones que crean la auditoría o las versiones del prompt | No se revierte. Un error en ellas se corrige con una migración nueva. Su vuelta atrás solo se ejecuta en CI y en entornos sin datos reales (respuesta del responsable del 12/11/2026 a la cuestión 14) |
| REQ-054 | La vuelta atrás de una migración posterior borraría o cambiaría filas de la auditoría o de las versiones del prompt | No se admite: la vuelta atrás de toda migración posterior conserva íntegro el contenido de las dos tablas |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Salvo CA-001, CA-026, CA-027 y CA-032, todos se ejecutan en CI con las migraciones reales. En esta máquina no hay Docker: ninguna de esas pruebas se anota como superada en local.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | La región del proyecto de desarrollo, y de cada otro proyecto creado en la fase, consultada en la configuración del proveedor, es de la UE. La evidencia la anota la persona que lo creó, y el escáner de secretos da 0 hallazgos de credenciales del proveedor en el repositorio | REQ-001 |
| CA-002 | Aplicar todas las migraciones en orden sobre una base vacía y cargar los datos ficticios termina con 0 errores y sin ningún paso manual registrado en el procedimiento | REQ-002, REQ-003 |
| CA-003 | Los datos ficticios tienen al menos 2 clientes y 1 usuario por cada perfil; el 100 % de las direcciones de correo usan dominios reservados para ejemplos; el procedimiento de producción revisado no incluye su carga | REQ-003 |
| CA-004 | Una consulta al catálogo de la base de datos, tras aplicar todas las migraciones y tras cada una por separado, encuentra 0 tablas sin control de acceso por fila en los esquemas accesibles desde la API | REQ-004 |
| CA-005 | Matriz de acceso: para cada tabla y vista, cada perfil de la tabla de perfiles y cada operación (leer, insertar, modificar, borrar), la prueba compara el resultado con la matriz esperada escrita en el diseño. Resultado: 0 discrepancias. Incluye que el superadmin con doble factor lee filas de A y de B, y que los perfiles sin sesión, sin vínculo y superadmin sin doble factor leen 0 filas de datos de clientes | REQ-005 a REQ-009, REQ-037 a REQ-039, REQ-041, REQ-052 |
| CA-006 | Acceso cruzado (criterio 1.º de la fase 2): el usuario de A, en cada tabla y vista, con filtros por identificadores de B, lee 0 filas de B; cada intento de escritura sobre filas de A o de B, de vincularse a B o de hacerse administrador afecta a 0 filas y deja 0 filas de auditoría. Lo mismo de B hacia A | REQ-009, REQ-035, REQ-036 |
| CA-007 | Funciones privadas (criterio 2.º de la fase 2): la consulta al catálogo encuentra 0 funciones del esquema privado ejecutables por los perfiles sin sesión y 0 ejecutables por usuarios con sesión fuera de la lista cerrada que resulte de la cuestión abierta 4. Invocar por la API cada función del conector con cada perfil es rechazado en el 100 % de los casos, con 0 ejecuciones abiertas y 0 órdenes cambiadas | REQ-010, REQ-043 |
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
| CA-026 | El procedimiento de aplicación en producción se ejecuta en simulación sin aprobación registrada y no aplica nada; cada aplicación real tiene una anotación con fecha, commit y aprobación del responsable (100 % de las aplicaciones). En la fase 2 no hay ninguna aplicación real en producción (respuesta del responsable del 12/11/2026 a la cuestión 16), así que aquí el criterio se cierra con la simulación | REQ-031, REQ-050 |
| CA-027 | Con el volumen ficticio de la cuestión abierta 12 (10 clientes de referencia, respuesta del responsable del 12/11/2026; el informe diario durante un año y el umbral son una propuesta a confirmar), el resumen propio leído por un usuario de cliente y el resumen de todos leído por el superadmin responden en menos de 500 ms en el percentil 95 de 20 repeticiones en el proyecto de desarrollo; el 100 % de las columnas usadas para filtrar por cliente o usuario en las reglas de acceso tienen índice | REQ-032 |
| CA-028 | La lista de esquemas accesibles desde la API en la configuración de cada proyecto coincide con la lista cerrada del diseño, y el esquema privado no figura en ella | REQ-033 |
| CA-029 | Se retira al usuario de A de su cliente, y a un superadmin de administradores: en la siguiente consulta con la misma sesión, los dos leen 0 filas de lo que antes veían | REQ-034 |
| CA-030 | Con una sesión sin dato de segundo factor, con ese dato malformado y con una sesión de un usuario borrado, se leen 0 filas de datos de clientes y se escriben 0 filas | REQ-040 |
| CA-031 | En CI, con filas cargadas en la auditoría y en las versiones del prompt: para cada migración posterior a las que crean esas tablas, revertirla y volver a aplicarla deja idéntica la huella del contenido completo de las dos (0 diferencias) | REQ-054 |
| CA-032 | El procedimiento de vuelta atrás en producción, ejecutado en simulación sobre cada una de las dos migraciones que crean la auditoría y las versiones del prompt, se niega a revertirlas en el 100 % de los intentos | REQ-053 |

## Fuera de alcance

- Qué devuelve cada herramienta del conector y cómo trata cada campo del informe: función 011. Aquí solo se garantizan la estructura, los permisos y el aislamiento.
- Activación, conexiones, emisión y rotación de tokens y límite de intentos: función 014.
- Cálculo de alertas de latido (ejecución sin informe, sin señal): función 013.
- Texto del prompt 1.3 y arranque local: función 012.
- Dashboards superadmin y de cliente, y la prueba de extremo a extremo de acceso cruzado por la interfaz: fases 3 y 5.
- Registro de versiones del prompt desde el despliegue y publicación por canal: fase 4. Aquí solo se garantiza que las versiones registradas son inmutables.
- Lógica de cobro y webhook de Stripe: fase 6.
- Copias de seguridad y restauración probada: fase 6.
- Plazos de conservación definitivos y su publicación: fase 6. Si hay que purgar algo en esta fase lo decide la cuestión abierta 7.
- El confinamiento de la clave secreta en el código del servidor (A-10): se revisa en cada cambio de código, no lo garantiza la base de datos.
- Límites de peticiones por conexión y por dirección (A-22).
- La decisión sobre el entorno previo (V-114, fase 1).
- Crear cuentas, proyectos o secretos: lo hace una persona.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Gasto y creación del proyecto (B-002).** ¿Está aprobado el gasto de Supabase Pro, quién crea el proyecto de desarrollo y cuándo, y si el de producción se crea ya o al publicar? Si se aprueba y se crea ya, se pueden ejecutar CA-001, CA-027 y CA-028 en esta fase; si no, esos criterios quedan sin evidencia y la fase 3 no puede empezar a implementar, porque depende de que las migraciones estén en desarrollo. **Respondida en parte el 12/11/2026:** el proyecto de desarrollo va en el plan gratuito, solo con datos ficticios. Sigue abierto quién lo crea y cuándo.
2. **Entorno previo (V-114).** Si la fase 1 no ha resuelto si el entorno previo es una rama o un segundo proyecto, ¿las migraciones de esta función se aplican solo en desarrollo o se espera a esa decisión? Aplicar solo en desarrollo adelanta el trabajo pero deja sin probar el paso por el entorno previo; esperar retrasa el cierre de la fase.
3. **Tablas de fases posteriores.** ¿Se crean ahora todas las tablas del modelo de referencia (suscripciones, eventos de cobro, publicaciones, alertas, versiones del prompt) o cada una en la fase que la usa? Crearlas ahora permite probar el aislamiento completo de una vez, pero fija su forma antes de diseñar esas fases; crearlas en su fase obliga a que cada fase añada su migración y sus pruebas de aislamiento.
4. **Funciones de apoyo a las reglas de acceso.** El modelo de referencia permite que los usuarios con sesión ejecuten dos funciones del esquema privado que las reglas de acceso necesitan (saber si el usuario es superadmin y a qué clientes está vinculado). ¿La regla «ninguna función del esquema privado ejecutable por usuarios con sesión» es absoluta o se admite esa excepción como lista cerrada? Si es absoluta, el diseño tiene que resolver esas comprobaciones de otra forma; si se admite, queda una lista cerrada vigilada por CA-007 y cada función solo puede devolver datos del propio usuario.
5. **Qué lee el usuario de cliente.** El modelo de referencia le deja leer su cliente, su licencia, sus órdenes, ejecuciones, informes, suscripción, el resumen, las métricas por versión y el catálogo de problemas, pero no sus conexiones, alertas ni reglas; el plan de la fase 5 habla de que «no ve las conexiones de otros». ¿Se fija ahora esa lista mínima, se amplía ya (conexiones, alertas o reglas propias) o se deja para la fase 5? Fijarla ahora y ampliarla después obliga a una migración y pruebas nuevas en la fase 5; ampliarla ya adelanta decisiones de interfaz.
6. **Usuario vinculado a varios clientes.** ¿Puede un mismo usuario estar vinculado a más de un cliente (por ejemplo, una gestoría)? Si sí, las pruebas de aislamiento tienen que cubrir ese caso y el resumen debe distinguir clientes; si no, la estructura debe impedirlo.
7. **Conservación y purga.** ¿Qué plazos se aplican a tokens caducados o revocados, códigos usados, ejecuciones, informes y auditoría, y se purga ya en esta fase? Fijarlos ahora añade la purga y sus pruebas a esta función; dejarlos para la fase 6 deja crecer las tablas sin límite hasta entonces y retrasa una obligación del RGPD. **Respondida el 13/11/2026:** en la fase 2 se purgan solo los códigos y tokens que ya no valen, a los 30 días (lo especifica la función 014). Lo demás se conserva hasta que la fase 6 fije plazos.
8. **Baja de un cliente.** ¿Qué pasa con sus datos: se marca como baja y se conserva todo, se borra todo en cascada (la auditoría conservaría su identificador) o se conservan solo cifras sin vínculo con el cliente? En el modelo de referencia, un cliente con licencias no se puede borrar. Conservar facilita la reactivación pero alarga el tratamiento; borrar cumple la minimización pero pierde el historial.
9. **Primer superadmin.** ¿Cómo se da de alta el primer superadmin, y los siguientes: los da de alta una persona con acceso privilegiado fuera de la API, o un superadmin con doble factor desde la API? Fuera de la API, esa alta queda auditada sin actor; desde la API, una sesión de superadmin robada puede crear otros superadmin (queda auditado).
10. **Doble factor en las reglas de acceso (V-108).** Si la comprobación muestra que la base de datos no puede exigir el doble factor en el plan contratado, ¿qué se hace: parar esta función hasta encontrar otra vía comprobable en la base de datos, o aceptar que lo compruebe solo la aplicación? Lo segundo contradice ADR-0003 y el control de A-11 y exige que el responsable cambie el ADR.
11. **Rol propio del conector (V-107).** Si conectar con un rol propio no resulta viable, el ADR-0003 prevé usar la clave secreta confinada en un módulo del conector. ¿Se acepta ese plan alternativo para esta función? En ese caso REQ-012 y CA-009 pierden su objeto, el aislamiento por el conector descansa solo en las tres funciones y en la revisión de código, y hay que decidir qué prueba sustituye a CA-009.
12. **Datos ficticios y volumen.** ¿Cuántos clientes ficticios hacen falta y qué volumen se usa para medir rendimiento? Dos clientes bastan para el aislamiento; el umbral de CA-027 (50 clientes, un año de informes diarios, 500 ms) es una propuesta sin aprobar y, si cambia, cambia el criterio. **Respondida en parte el 12/11/2026:** 10 clientes como referencia inicial, ya aplicado en CA-027. Siguen abiertos el número de clientes ficticios para el aislamiento, el año de informes diarios y el umbral de 500 ms.
13. **Nombre del cliente.** El nombre comercial es el único texto libre que puede contener un dato personal (un autónomo suele usar su nombre). ¿Se mantiene como texto acotado o se sustituye por un alias interno? Mantenerlo obliga a tratarlo como dato personal (conservación, acceso, baja); un alias lo evita pero los dashboards mostrarían un nombre que no es el comercial.
14. **Vuelta atrás frente a inmutabilidad.** Revertir la migración que crea la auditoría o las versiones del prompt destruiría su contenido, lo que choca con los artículos 9 y 11. ¿Se permite revertir esas migraciones solo en entornos sin datos reales, se exige que la vuelta atrás conserve su contenido, o se prohíbe revertirlas una vez aplicadas en producción? Cada opción cambia lo que comprueba CA-024 para esas tablas. **Respondida el 12/11/2026:** en producción se corrige hacia delante, sin revertir. Aplicada en REQ-053, REQ-054, CA-031 y CA-032.
15. **Huella de las versiones.** ¿La base de datos debe rechazar una versión cuya huella no corresponde a su texto (en esta función) o lo garantiza el registro desde el despliegue (fase 4)? Si es aquí, se añade un requisito y su prueba; si es en la fase 4, una versión con huella incoherente podría registrarse hasta entonces con el rol de la clave secreta.
16. **Producción en la fase 2.** ¿Se aplica algo en producción durante esta fase, y cómo se registra la aprobación del responsable para cada aplicación? Si no se aplica nada, CA-026 se limita a la simulación; si se aplica, hay que fijar dónde y cómo queda la aprobación. **Respondida el 12/11/2026:** en la fase 2 no se aplica nada en producción. Aplicada en CA-026.
17. **Alcance de la auditoría.** ¿Se auditan también las escrituras que no hace un usuario (las del conector al abrir ejecuciones, guardar informes o confirmar órdenes, y las del despliegue al registrar versiones), o solo las de usuarios? Auditar todo da trazabilidad completa pero multiplica las filas y deja muchas sin actor; auditar solo usuarios coincide con el plan de la fase 3 pero deja sin rastro el registro de versiones.

## Dependencias y decisiones relacionadas

- Constitución: artículos 1, 2, 3, 4, 9, 11 y 13.
- Decisiones: T-003, T-004, T-005, T-012, T-013, D-007, D-008, B-002. En estado VERIFICAR y no dadas por hechas: V-107, V-108, V-114.
- Respuestas del responsable del 12/11/2026: el proyecto de desarrollo va en el plan gratuito de Supabase, solo con datos ficticios. T-003 (plan Pro) sigue valiendo para lo demás. Está pasado a coordinación en `propuestas.md`, n.º 16. V-108 hay que verificarla también para el plan gratuito; el plan del entorno previo depende de V-114.
- ADR: 0003 (aislamiento por cliente), 0005 (prompt por despliegue), 0002 (activación, para la forma de códigos y conexiones).
- Amenazas de `docs/SEGURIDAD.md`: A-05, A-07, A-08, A-09, A-10, A-11, A-14.
- Modelo de referencia: `docs/MODELO-DATOS.sql`. Las diferencias que esta especificación pide respecto a él están en `specs/010-base-datos-rls/propuestas.md`.
- Contrato: `contratos/informe.schema.json`.
- Función 001: requisito 10 (el cliente se deriva del token). Fase 1: repositorio con CI y decisión sobre el conector, necesarios para implementar (`docs/PLAN.md`, «Reparto en chats»).
- Funciones 011, 012, 013 y 014 de la misma fase: se apoyan en esta estructura; esta función no depende de ellas.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
