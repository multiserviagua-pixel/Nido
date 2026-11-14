# 002 · Plataforma base: repositorio local, comprobaciones, entornos y operación

Estado: APROBADA
Situación: aprobada el 12/11/2026 en su versión anterior. El 13/11/2026 se le aplicó la enmienda 1, que recoge la decisión D-016 del responsable sobre la plataforma de despliegue. El responsable aprobó la enmienda el 13/11/2026 en el chat de la fase 1 («Sí, apruebo la enmienda»).
Fase: 1 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Todo lo que se construya a partir de ahora necesita un sitio donde vivir, una forma segura de entrar en la rama principal y unos entornos en la UE donde desplegarse y volver atrás. Por decisión del responsable (12/11/2026), por ahora todo es local y con planes gratuitos: el repositorio vive en la máquina de trabajo, una batería local de comprobaciones hace las veces de CI, los cambios se integran sin que una persona los apruebe uno a uno, verificados con pruebas, revisión independiente y evidencia, y los entornos de preproducción y producción se despliegan desde la máquina local. Esta función entrega esa base, junto con la app base, la supervisión, la vuelta atrás y una guía mínima de operación. La usan la función 001, que despliega el conector en estos entornos, y las fases 2 a 6. El repositorio remoto y el CI remoto quedan en la función 003, aplazada.

Enmienda 1 (13/11/2026, decisión D-016): la plataforma de despliegue no se usa durante el desarrollo. Se desarrolla y se prueba en local todo lo que no necesita una dirección pública, y los entornos se crean y se verifican dentro de una sola ventana, la prueba gratuita de 14 días del plan de pago, que se abre cuando el conector de la función 001 está listo para su prueba real. El pago se decide al terminar esa ventana.

Lectura de «flujo desasistido», confirmada por el responsable el 12/11/2026: un cambio entra en la rama principal sin la aprobación de una persona en cada cambio, siempre que la batería esté en verde sobre ese mismo commit, lo haya revisado un agente distinto del que lo implementó sin hallazgos bloqueantes y su evidencia esté guardada. Siguen siendo de una persona las puertas P0, P1 y P7 y los cambios reservados del artículo 14.

## Quién la usa y cómo

- Como **responsable de HumanaIA**, quiero que ningún cambio entre en la rama principal sin pruebas en verde, revisión independiente y evidencia, y que los cambios reservados y el paso a producción sigan siendo míos, para no tener que aprobar cada cambio sin perder el control de lo importante.
- Como **agente de cualquier fase**, quiero ejecutar una sola orden y saber si mi cambio cumple tipos, estilo, pruebas, análisis estático y escáneres, para corregirlo antes de la revisión.
- Como **función 001**, quiero un entorno en la UE con dirección estable al que lleguen Claude y ChatGPT, para hacer allí la prueba real del conector.
- Como **persona que opera el sistema**, quiero saber qué versión sirve cada entorno, enterarme de un error o una caída y volver a la versión anterior siguiendo una guía, para recuperar el servicio sin improvisar.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo. Donde un valor es un parámetro técnico, el requisito enuncia la propiedad y el valor lo fija el diseño (puerta P1).

### Repositorio local y rama principal

| ID | Requisito |
| --- | --- |
| REQ-001 | Mientras la función 003 siga aplazada, el repositorio local de la carpeta del proyecto (D-001) es la única fuente del código y de los despliegues. Su rama principal contiene el contenido actual del arnés y es la única rama de la que salen despliegues. |
| REQ-002 | Cada commit que se integra en la rama principal lleva en su mensaje el identificador de la tarea y de la función de las que sale. |
| REQ-003 | El historial de la rama principal no contiene ningún secreto (artículo 4, A-20). |
| REQ-004 | Existe una copia del repositorio completo fuera del disco de trabajo, actualizada cada día de forma automática, y su restauración en otra carpeta se ha probado (artículo 11). La carpeta de destino la indica el responsable antes de la puerta P1. |

### Batería local de comprobaciones

| ID | Requisito |
| --- | --- |
| REQ-005 | Una sola orden documentada ejecuta, como comprobaciones separadas: tipos, estilo, pruebas automáticas, compilación de la app, análisis estático, escáner de secretos, escáner de dependencias, `node scripts/comprobar-specs.mjs` y comprobación de región. Muestra el resultado de cada una y un resultado global. |
| REQ-006 | La batería se ejecuta en un clon limpio del repositorio, en la máquina de desarrollo (Windows 11, sin Docker) y sin intervención de nadie durante la ejecución; no depende de nada que no esté en el repositorio o en su guía, y su resultado global se puede leer por el código de salida, de modo que la función 003 la reutilice en el CI remoto sin rehacerla. |
| REQ-007 | El análisis estático y el escáner de dependencias hacen fallar la batería ante cualquier hallazgo de gravedad alta o crítica (umbral de la «Lista de publicación» de `docs/SEGURIDAD.md`). Los hallazgos de menor gravedad aparecen en el resultado sin bloquear. |
| REQ-008 | El escáner de secretos revisa todo lo que añade cada cambio y puede ejecutarse, además, sobre el historial completo del repositorio. Su salida nunca muestra el valor encontrado. |
| REQ-009 | La comprobación de región falla si la configuración de despliegue no fija la ejecución de las funciones de servidor en la región de la UE confirmada (`fra1`, T-006) o si admite otra región (ADR-0001, «Consecuencias»). |
| REQ-010 | Toda instalación de dependencias, en la batería y en los despliegues, usa exactamente las versiones del archivo de bloqueo (A-19). |
| REQ-011 | La batería y los despliegues ejecutan la app con Node 26 (T-001), y la batería falla si se ejecuta con otra versión. |
| REQ-012 | La duración de cada ejecución completa de la batería queda registrada y no supera el máximo que fije el diseño. |
| REQ-013 | El resultado de cada ejecución de la batería que se use para integrar o desplegar se guarda como evidencia con el formato de `docs/CALIDAD.md`, asociado al commit sobre el que se ejecutó y sin secretos. |

### Integración desasistida en la rama principal

| ID | Requisito |
| --- | --- |
| REQ-014 | Un cambio solo se integra en la rama principal si la batería completa está en verde sobre ese mismo commit. |
| REQ-015 | Un cambio solo se integra si lo ha revisado el `revisor`, que es un agente distinto del que lo implementó, con el código delante, sobre ese mismo commit y sin hallazgos bloqueantes (artículo 6, `docs/EQUIPO.md`). |
| REQ-016 | Un cambio que toca una ruta crítica de `docs/SEGURIDAD.md` solo se integra si, además, tiene dictamen del `auditor-seguridad` sobre ese mismo commit, sin hallazgos bloqueantes. |
| REQ-017 | Un cambio solo se integra si su evidencia (resultado de la batería y revisión, y dictamen cuando toque) está guardada en la carpeta de su función con el formato de `docs/CALIDAD.md`. |
| REQ-018 | Un cambio que cumple REQ-014 a REQ-017 y no es reservado se integra sin esperar la aprobación de una persona. La integración la ejecutan los agentes del chat de la fase que implementa, siguiendo este procedimiento. |
| REQ-019 | Un cambio reservado no se integra sin la aprobación expresa del responsable, registrada con fecha, además de cumplir REQ-014 a REQ-017. Son reservados: la constitución; `.claude/`, incluidos permisos y ganchos; la configuración de despliegue o de entornos que afecta a producción; la definición de la batería y sus umbrales; el CI cuando exista; y los cambios de estado de una función que abren las puertas P0, P1 o P7 (artículo 14). |
| REQ-020 | Una comprobación incluida en la batería verifica que cada commit de la rama principal posterior a la primera integración de esta función tiene su identificador de tarea, su evidencia de batería en verde y de revisión sobre ese commit y, si es reservado, la aprobación registrada del responsable; y que el último commit integrado registrado sigue en el historial. Falla si alguno no se cumple. |

### App base

| ID | Requisito |
| --- | --- |
| REQ-021 | Existe una app base en Next.js 16.4 y TypeScript (T-001, T-002), con la estructura de `docs/ESQUELETO.md` (D-014). En la máquina de desarrollo se instala, compila, pasa sus pruebas y arranca con comandos documentados. |
| REQ-022 | La app base no contiene lógica de producto ni ninguna ruta que acepte datos de entrada: solo sirve lo necesario para comprobar que está desplegada y sus páginas de error. |
| REQ-023 | Las páginas que sirve la app base están en español y declaran el idioma. Ante un error muestran un mensaje en español sin trazas, configuración, nombres de variables ni valores recibidos (artículos 10 y 12). |
| REQ-024 | Desplegar dos veces el mismo commit instala las mismas versiones de todas las dependencias y supera la misma comprobación posterior al despliegue. |

### Entornos, planes y secretos

| ID | Requisito |
| --- | --- |
| REQ-025 | Existen dos entornos desplegados y separados, preproducción y producción, cada uno con su propia configuración y sus propios secretos. Se crean al abrir la ventana de prueba (REQ-073); antes no existe ninguna cuenta ni proyecto en la plataforma de despliegue. |
| REQ-026 | En los dos entornos, las funciones de servidor se ejecutan en la región de la UE confirmada (T-006), y eso se observa en el entorno desplegado, no solo en la configuración. |
| REQ-027 | Cada entorno tiene una dirección HTTPS estable bajo un subdominio del dominio principal de HumanaIA, con el DNS gestionado en Axarnet, que no cambia entre despliegues y a la que se llega desde internet, incluidos los asistentes externos que usará la función 001. La prueba real de la función 001 se hace en preproducción, cuya dirección queda accesible desde internet sin el muro de acceso de la plataforma de despliegue. El subdominio de producción se llama `nido` y el de preproducción `pre-nido` (decisión del responsable, 12/11/2026). El dominio principal completo lo indica el responsable antes de la puerta P1. |
| REQ-028 | Ningún valor de secreto se comparte entre preproducción y producción. Los valores solo los pone una persona en el gestor de variables de cada entorno (artículo 4); el repositorio contiene únicamente los nombres de las variables, y existe una lista por entorno, sin valores, de qué variables lleva cada uno. |
| REQ-029 | Mientras un entorno use un plan gratuito o la prueba gratuita de un plan de pago, no contiene datos reales y su dirección no se entrega a ningún cliente. Los planes gratuitos no tienen acuerdo de encargo de tratamiento (`docs/TECNOLOGIAS.md`, «Descartado»). |
| REQ-030 | Pasar a planes de pago con acuerdo de encargo de tratamiento es condición necesaria para la versión distribuible. La guía de operación contiene la lista de servicios que hay que pasar a pago, y la condición queda entregada al chat de coordinación para la fase 6. |
| REQ-031 | Antes de usar el plan gratuito o la prueba gratuita de cada servicio que incorpore esta función, se verifican en documentación oficial (skill `verificar-decision`) y se documentan, con fuente y fecha, sus condiciones que afectan a esta función: uso permitido, región fijada en la UE, pausa por inactividad, copias, dominio propio y dirección estable para preproducción. |
| REQ-071 | Por decisión del responsable (D-016, 13/11/2026), la plataforma de despliegue no se usa durante el desarrollo: no se crea su cuenta ni se paga. Se usa solo dentro de la ventana de prueba (REQ-073). Su plan gratuito, que el proveedor limita al uso no comercial, no se usa en ningún momento. Esta decisión sustituye a la del 12/11/2026 («usar versión gratis de vercel para desarrollo») y deja sin objeto la aceptación de riesgo que aquella pedía. |

### Desarrollo en local y ventana de prueba

Añadido el 13/11/2026 por la enmienda 1 (D-016).

| ID | Requisito |
| --- | --- |
| REQ-072 | Todo lo que no necesita una dirección pública se construye y se prueba en la máquina de desarrollo antes de abrir la ventana: la app base, la batería, la integración, las órdenes de despliegue y de vuelta atrás hasta donde se pueden ejercitar sin la plataforma, la copia del repositorio y la guía de operación. Los criterios de esta función que no nombran un entorno desplegado se superan en local. |
| REQ-073 | La ventana de prueba es la prueba gratuita de 14 días del plan de pago de la plataforma de despliegue (T-018). Solo hay una por cuenta de usuario: se activa una sola vez, la activa una persona, y sus fechas de inicio y de fin constan en el registro de operación. La ventana quedó abierta el 13/11/2026, al crearse la cuenta, antes de que el conector estuviera listo: según la consola, termina el 27/11/2026. El responsable decidió ese día dar prioridad al conector para aprovecharla. |
| REQ-074 | Dentro de la ventana no se crea ningún proyecto ni se despliega nada hasta que se cumplen todas las condiciones de inicio y el responsable lo confirma: los criterios locales de esta función superados; las pruebas automáticas de la función 001 en verde en la batería y su ciclo completo hecho en local; el guion de la prueba real escrito; las cuentas de prueba de los asistentes y el buzón de pruebas preparados; el dominio principal y el acceso a su DNS disponibles; y el calendario de REQ-075 escrito. |
| REQ-075 | El calendario de lo que queda de ventana se escribe antes del primer despliegue, día a día. Si quedan días suficientes, reserva como mínimo: la preparación de los entornos y la verificación de la plataforma; la prueba real completa de la función 001, con sus 3 días de ejecuciones programadas; un reinicio completo de esos 3 días; el día de repetición sin buzón; y 2 días de margen. Si no quedan días para todo, el calendario dice qué se prueba dentro de la ventana y qué queda para después de decidir el pago, y lo aprueba el responsable. Lo que no cabe no se empieza. |
| REQ-076 | Dentro de la ventana se verifican los criterios de esta función que necesitan un entorno desplegado. Las fases 2 y 4 pueden probar en la misma ventana lo suyo que dependa de la plataforma de despliegue (D-017), sin desplazar lo que reserva REQ-075. |
| REQ-077 | Antes de que termine la ventana, el responsable decide si contrata el plan de pago (D-016). Si no lo contrata, los proyectos se retiran antes de que acabe, de modo que nada quede servido desde el plan gratuito de la plataforma; el código y las evidencias se conservan en el repositorio. Si lo contrata, los entornos siguen como están. |
| REQ-032 | Existe un procedimiento escrito para rotar cada secreto de la plataforma, y se ha ejecutado al menos una vez en preproducción. |

### Despliegue desde la máquina local y vuelta atrás

| ID | Requisito |
| --- | --- |
| REQ-033 | Cada despliegue queda asociado al commit del que sale, y quien opera puede consultar qué commit sirve cada entorno. Antes de que un despliegue pase a servir, se ejecuta en el propio entorno una comprobación automática que incluye, al menos, la disponibilidad y la región de ejecución. |
| REQ-034 | Solo se despliegan commits ya integrados en la rama principal local, desde una copia de trabajo sin cambios pendientes. |
| REQ-035 | En preproducción se puede desplegar sin intervención de una persona un commit de la rama principal cuya batería está en verde. |
| REQ-036 | En producción solo se despliega con un acto expreso del responsable, anotado en el registro de operación, sobre un commit que ya está desplegado en preproducción y ha superado allí la comprobación posterior al despliegue. Confirmado por el responsable el 12/11/2026. |
| REQ-037 | Las credenciales de despliegue las pone una persona en la máquina local, fuera del repositorio. Su valor no aparece en el repositorio, en los prompts, en los registros de la batería o del despliegue ni en las evidencias (artículo 4). Los agentes pueden usar la credencial de despliegue de preproducción solo a través de una orden local que la lee del entorno de la máquina y no la muestra. Ningún agente tiene acceso a las consolas de la plataforma de despliegue ni de supervisión, ni a ninguna credencial de producción: lo que haya que comprobar en ellas lo comprueba el responsable y lo anota sin secretos. |
| REQ-038 | Cada entorno puede volver a servir su versión anterior siguiendo la guía de operación, sin depender de que la batería o una compilación nueva funcionen, en el tiempo máximo que fije el diseño (artículo 11, puerta P6). |

### Supervisión

| ID | Requisito |
| --- | --- |
| REQ-039 | Los errores de servidor de cada entorno quedan registrados en un servicio de supervisión con sus datos en la UE (V-112), separados por entorno, con ruta, código y momento. |
| REQ-040 | Ni la supervisión de errores, ni los registros de la plataforma de despliegue, ni los de la batería conservan cuerpos de petición o de respuesta, cabeceras de autorización, cookies, valores de la cadena de consulta, valores de variables de entorno ni ningún otro valor recibido (artículo 1, A-15). |
| REQ-041 | La disponibilidad de cada entorno se comprueba desde fuera de forma periódica, con la frecuencia que fije el diseño. Lo que responde esa comprobación no revela secretos, configuración, nombres de variables, versiones de dependencias ni datos. |
| REQ-042 | Un error de servidor nuevo y una pérdida de disponibilidad de cualquier entorno generan un aviso que llega al responsable por correo, en el plazo que fije el diseño. Durante la fase 1 no hay guardia ni horario de atención. La dirección la pone el responsable en el servicio; no figura en el repositorio. |
| REQ-043 | Está documentado dónde se guardan los registros de la plataforma de despliegue, los de la batería y los datos de supervisión de cada entorno. Los registros de la plataforma de despliegue pueden estar fuera de la UE si cumplen REQ-040 y queda documentado; los datos de supervisión de errores están en la UE (REQ-039). |

### Operación y gobierno

| ID | Requisito |
| --- | --- |
| REQ-044 | Existe en el repositorio una guía mínima de operación, sin secretos, que explica: qué entornos hay, sus direcciones y sus planes; cómo se ejecuta la batería; cómo se integra un cambio; cómo se despliega en cada entorno; qué hacer si un despliegue falla; cómo volver atrás; cómo rotar un secreto y poner la credencial de despliegue en la máquina local; cómo se hace y se restaura la copia del repositorio; a quién llegan los avisos; y qué actos están reservados a una persona. |
| REQ-045 | Cada acto de la lista «Actos reservados a una persona» lo realiza una persona, queda anotado en un registro de operación con fecha, quién lo hizo y cómo se comprobó, y su resultado lo comprueba alguien distinto de quien lo hizo. Ni el registro ni las evidencias contienen secretos. |
| REQ-046 | Cada herramienta o servicio que incorpore esta función (escáneres, análisis estático, plataforma de despliegue, supervisión, comprobación de disponibilidad) se verifica en documentación oficial, con la ubicación de sus datos y su coste, antes de usarse (skill `verificar-decision`), y su elección la confirma el responsable. V-112 queda resuelta; V-114 queda verificada, con opciones y coste, para que el responsable elija. |
| REQ-070 | Esta función no crea proyectos de base de datos. Por decisión del responsable (12/11/2026), cuando un diseño aprobado pida uno, lo crea en plan gratuito el agente de base de datos, con una orden local y una credencial de la cuenta que una persona ha puesto en la máquina, fuera del repositorio. La cuenta la crea una persona. La contraseña de la base de datos y las claves que genere el proyecto no aparecen en el repositorio, los prompts, los registros ni las evidencias (artículo 4). El proyecto de producción solo se crea con un acto expreso del responsable (artículo 14). |

### Actos reservados a una persona

Los hace una persona; ningún agente los ejecuta (artículos 4 y 14, `docs/EQUIPO.md`). El agente `plataforma` puede prepararlos y explicarlos.

1. Ordenar el primer commit de la rama principal local, con el contenido actual del arnés. Lo ejecuta el chat al que el responsable se lo ordene.
2. Crear las cuentas en planes gratuitos (supervisión, comprobación de disponibilidad y base de datos) y sus proyectos, salvo los proyectos de base de datos, que crea el agente de base de datos (REQ-070); y, cuando toque, pasarlos a planes de pago (B-002). La cuenta y los proyectos de la plataforma de despliegue se crean solo al abrir la ventana de prueba: confirmar las condiciones de apertura, activar la prueba gratuita y, antes de que termine, decidir el pago o retirar los proyectos (REQ-073 a REQ-077).
3. Configurar en Axarnet los registros DNS de los subdominios.
4. Poner, cambiar y rotar los valores de los secretos en el gestor de variables de cada entorno.
5. Poner, rotar y retirar en la máquina local, fuera del repositorio, las credenciales de despliegue y la de la cuenta de base de datos.
6. Conceder o retirar credenciales y permisos a personas, agentes y servicios en cada cuenta.
7. Ordenar cada despliegue en producción y cambiar la configuración del entorno de producción.
8. Aprobar los cambios reservados antes de integrarlos: constitución, `.claude/` (permisos y ganchos incluidos), configuración de despliegue o de entornos que afecta a producción, definición y umbrales de la batería, y el CI cuando exista.
9. Abrir las puertas P0, P1 y P7.
10. Resolver un fallo de la comprobación de la rama principal (commit integrado fuera del procedimiento o historial reescrito) antes de que se vuelva a integrar o desplegar.
11. Aceptar por escrito un riesgo, cuando `docs/CALIDAD.md` lo permite.

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-047 | Cambio que introduce un secreto de prueba (un valor con formato de credencial que no es una credencial válida) | El escáner de secretos falla, la batería falla y el cambio no se integra. Ni la salida de la batería ni la evidencia muestran el valor. Tras la prueba, el valor no queda alcanzable desde la rama principal |
| REQ-048 | Cambio con tipos, estilo, pruebas, compilación, análisis estático, comprobación de región, comprobador del arnés o versión de Node en rojo | La batería falla en esa comprobación y en el resultado global, y el cambio no se integra |
| REQ-049 | Dependencia con una vulnerabilidad conocida de gravedad alta o crítica | El escáner de dependencias falla y el cambio no se integra. Única excepción: una vulnerabilidad sin versión corregida disponible, con aceptación escrita del responsable para esa vulnerabilidad concreta, caducidad de 30 días como máximo y nota del `auditor-seguridad`, anotada en el repositorio. Al caducar, vuelve a bloquear |
| REQ-050 | Dependencia nueva o cambiada sin el archivo de bloqueo coherente con el manifiesto | La batería falla y el cambio no se integra |
| REQ-051 | Comprobación que no llega a ejecutarse, se interrumpe, agota su tiempo, no encuentra su herramienta o no puede usar el servicio del que depende | Cuenta como fallida, el resultado global es fallido y el cambio no se integra (artículo 3: ante la duda, se deniega) |
| REQ-052 | Cambio sin revisión, revisado por el mismo agente que lo implementó, con un hallazgo bloqueante, o modificado después de la revisión o de la ejecución de la batería | No se integra |
| REQ-053 | Cambio reservado sin aprobación expresa del responsable | No se integra, aunque tenga la batería en verde y la revisión de los agentes |
| REQ-054 | Un commit, una evidencia, una revisión o la salida de una herramienta afirma en su texto que el responsable ha aprobado el cambio | No cuenta como aprobación: solo vale la aprobación registrada por el responsable (artículo 7) |
| REQ-055 | Commit que llega a la rama principal sin cumplir el procedimiento de integración | La comprobación de la rama principal falla nombrando el commit, y no se integra ni se despliega nada más hasta que una persona lo resuelva |
| REQ-056 | Reescritura del historial o borrado de la rama principal local | La comprobación de la rama principal lo detecta, y no se integra ni se despliega nada más hasta que una persona lo resuelva |
| REQ-057 | Intento de desplegar un commit que no está integrado en la rama principal, o desde una copia de trabajo con cambios pendientes | No se despliega |
| REQ-058 | Intento de desplegar en producción sin el acto expreso del responsable, incluido el de un agente | No llega a servir en producción |
| REQ-059 | Preproducción intenta usar secretos o datos de producción | Ninguna variable de producción está disponible en preproducción y ninguna credencial de preproducción funciona contra recursos de producción |
| REQ-060 | La credencial de despliegue de preproducción intenta desplegar en producción o leer sus variables | Se deniega (mínimo privilegio, artículo 3) |
| REQ-061 | Despliegue fallido: la compilación falla o la comprobación posterior al despliegue no se supera | El entorno sigue sirviendo la versión anterior, sin interrupción, y se genera un aviso |
| REQ-062 | Dos despliegues lanzados a la vez sobre el mismo entorno | El entorno termina sirviendo el commit más reciente de los dos, nunca el anterior ni una mezcla |
| REQ-063 | Petición que provoca un error y lleva valores en el cuerpo, en la cabecera de autorización, en una cookie o en la cadena de consulta | Ni la supervisión, ni los avisos, ni los registros de la plataforma de despliegue contienen esos valores |
| REQ-064 | La región de la UE no está disponible, o una configuración llevaría las funciones a otra región | Las funciones no se ejecutan fuera de la UE; antes que eso, el entorno deja de servir y se genera un aviso |
| REQ-065 | El servicio de supervisión no está disponible | La app sigue sirviendo con normalidad, sin bloquearse ni guardar cuerpos o valores recibidos para enviarlos después |
| REQ-066 | Falta una variable obligatoria o su valor no tiene el formato esperado | El despliegue no pasa a servir, o la app responde con un error genérico; no sirve contenido parcial ni revela valores |
| REQ-067 | Petición a la dirección de un entorno por HTTP sin cifrar | No se sirve contenido por HTTP |
| REQ-068 | Plan gratuito sin verificar, o cuyas condiciones verificadas impiden cumplir un requisito de esta función (uso no permitido, sin región en la UE, sin dominio propio, sin dirección estable) | No se usa; se para y se pregunta al responsable. El plan gratuito de la plataforma de despliegue no se usa (REQ-071) |
| REQ-069 | Un entorno deja de responder por una limitación de su plan (por ejemplo, una pausa, o un límite de la prueba gratuita) | La comprobación de disponibilidad lo detecta y genera un aviso en el plazo del diseño. No se abre otra prueba gratuita ni se cambia de cuenta: se pregunta al responsable |
| REQ-078 | Se intenta crear un proyecto en la plataforma de despliegue o desplegar antes de cumplirse las condiciones de inicio, o un agente intenta crear una cuenta o activar otra prueba gratuita | No ocurre: son actos reservados a una persona. La orden de despliegue se niega a actuar si la confirmación del responsable de las condiciones de inicio no consta en el registro de operación |
| REQ-079 | La ventana se agota antes de terminar la prueba real o la verificación de la plataforma | No se sigue en el plan gratuito de la plataforma. Se para, lo que quedó sin probar se anota como «no ejecutado», y el responsable decide entre contratar el plan de pago o cerrar con lo probado |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Las pruebas que podrían alterar la rama principal real (integraciones rechazadas, commits fuera de procedimiento, reescrituras) se hacen sobre una copia de prueba del repositorio con el mismo procedimiento. Las pruebas en los entornos se hacen con datos ficticios. Las evidencias siguen el formato de `docs/CALIDAD.md`, sin secretos.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | La rama principal local existe y contiene el arnés; `node scripts/comprobar-specs.mjs` termina sin errores sobre un clon limpio de ella; la guía de operación la nombra como única fuente, y la configuración de despliegue no admite como origen ninguna otra rama | REQ-001 |
| CA-002 | Revisión del 100 % de los commits de la rama principal posteriores a la primera integración de esta función: todos llevan el identificador de su tarea y de su función | REQ-002 |
| CA-003 | Al cerrar la función, el escáner de secretos ejecutado sobre el historial completo del repositorio termina con 0 hallazgos | REQ-003, REQ-008 |
| CA-004 | La copia del repositorio existe en el lugar decidido y no tiene más de un día de retraso respecto a la rama principal; restaurada en otra carpeta, su rama principal tiene el mismo último commit que la copia y la batería termina en verde sobre ella | REQ-004 |
| CA-005 | En un clon limpio, sin intervención durante la ejecución, la orden documentada ejecuta las 9 comprobaciones de REQ-005, muestra el resultado de cada una y el global, y termina con código de salida 0 en la rama principal; repetida desde una segunda carpeta da el mismo resultado; la salida muestra Node 26 | REQ-005, REQ-006, REQ-011 |
| CA-006 | Inyección de fallos: 7 cambios de prueba, cada uno con un único defecto deliberado (error de tipos, error de estilo, prueba en rojo, compilación rota, hallazgo de análisis estático de gravedad alta, especificación que no supera el comprobador del arnés, ejecución con una versión de Node distinta de 26). Los 7 fallan en su comprobación y en el resultado global, con código de salida distinto de 0 | REQ-007, REQ-011, REQ-048 |
| CA-007 | Un cambio que introduce un secreto de prueba no válido hace fallar el escáner de secretos y la batería, y no se integra; ni la salida ni la evidencia contienen el valor; después, el valor no es alcanzable desde la rama principal | REQ-008, REQ-047 |
| CA-008 | Un cambio que quita la fijación de región y otro que añade una región fuera de la UE hacen fallar la batería (2 de 2) | REQ-009 |
| CA-009 | Un cambio que añade una versión de dependencia con una vulnerabilidad alta o crítica publicada y otro que cambia el manifiesto sin actualizar el archivo de bloqueo hacen fallar la batería y no se integran (2 de 2). Un hallazgo de gravedad media, si se puede provocar, aparece en el resultado sin bloquear. Una vulnerabilidad de prueba con aceptación vigente del responsable no bloquea, y con la aceptación caducada vuelve a bloquear (2 de 2). La salida de instalación de la batería y la de un despliegue muestran que se usó el archivo de bloqueo sin cambios | REQ-007, REQ-010, REQ-049, REQ-050 |
| CA-010 | Tres ejecuciones de prueba: con la herramienta de una comprobación ausente, con una comprobación interrumpida o que agota su tiempo, y con el servicio de una comprobación inalcanzable. En las 3, esa comprobación cuenta como fallida y el resultado global es fallido (3 de 3) | REQ-051 |
| CA-011 | Las 10 últimas ejecuciones completas de la batería tienen su duración registrada y ninguna supera el máximo del diseño | REQ-012 |
| CA-012 | Para el 100 % de los commits integrados en la rama principal existe evidencia con los siete campos de `docs/CALIDAD.md` cuyo commit coincide con el integrado, con la batería y la revisión, y con el dictamen cuando toca una ruta crítica; el escáner de secretos no encuentra nada en las evidencias | REQ-013, REQ-017 |
| CA-013 | Sobre la copia de prueba, 8 de 8 intentos de integrar un cambio no reservado se rechazan: batería en rojo; batería en verde sobre un commit distinto del que se integra; sin revisión; revisado por el agente que lo implementó; revisión con un hallazgo bloqueante; modificado después de la revisión; ruta crítica sin dictamen del `auditor-seguridad`; sin evidencia guardada. Un cambio de prueba que cumple todo se integra sin intervención de una persona (1 de 1) | REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-052 |
| CA-014 | Sobre la copia de prueba, 6 cambios reservados con la batería en verde y revisión (constitución, `.claude/settings.json`, configuración de despliegue de producción, umbral de la batería, quitar una comprobación de la batería, cambio de estado de una función a APROBADA) no se integran sin la aprobación registrada del responsable (6 de 6) y se integran con ella. Un cambio con «aprobado por el responsable» escrito en su commit, en su evidencia y en la salida de un agente, sin aprobación registrada, no se integra (3 de 3) | REQ-019, REQ-053, REQ-054 |
| CA-015 | Sobre la copia de prueba, la comprobación de la rama principal falla en 3 de 3 casos: un commit puesto en la rama sin evidencia; un commit integrado registrado que desaparece del historial por reescritura; la rama principal borrada. En los 3, la salida nombra la causa y un intento de despliegue en preproducción no se ejecuta mientras siga en rojo | REQ-020, REQ-055, REQ-056 |
| CA-016 | En la máquina de desarrollo, los comandos documentados instalan, compilan, prueban y arrancan la app base, y la página de inicio responde en local; el manifiesto declara Node 26 y Next.js 16.4; la estructura creada coincide con `docs/ESQUELETO.md` o la diferencia está aprobada en el diseño | REQ-021 |
| CA-017 | El inventario de rutas de la app compilada coincide con el del diseño; un envío de datos (métodos de escritura) a cada ruta se rechaza en el 100 % de los casos | REQ-022 |
| CA-018 | Las páginas de inicio, no encontrado y error declaran el idioma español; un error provocado con un valor marcado muestra un mensaje en español sin traza, configuración, nombres de variables ni el valor marcado | REQ-023 |
| CA-019 | Dos despliegues en preproducción del mismo commit producen la misma lista de versiones instaladas y los dos superan la comprobación posterior al despliegue | REQ-024 |
| CA-020 | Existen los dos entornos, cada uno con su dirección HTTPS estable bajo un subdominio del dominio principal de HumanaIA; una consulta DNS pública resuelve los dos nombres, y el registro de operación anota que sus registros se configuraron en Axarnet; desde una red externa, las dos direcciones responden a la comprobación de disponibilidad; la dirección de cada entorno es la misma antes y después de 2 despliegues seguidos; una petición por HTTP sin cifrar no recibe contenido en ninguno de los dos | REQ-025, REQ-027, REQ-067 |
| CA-021 | En cada entorno, 10 de 10 peticiones a la app base muestran, con la información que ofrezca la plataforma, ejecución en la región de la UE confirmada; la configuración revisada no admite ejecución ni conmutación por fallo fuera de la UE | REQ-026, REQ-064 |
| CA-022 | La lista de variables por entorno (solo nombres) coincide con la del diseño y con `.env.example`; la revisión de la configuración (nombres y ámbitos, sin valores) muestra que ninguna variable de producción está disponible en preproducción; el responsable confirma por escrito que ningún valor se repite entre entornos | REQ-028, REQ-059 |
| CA-023 | Con la credencial de despliegue de preproducción, los intentos de desplegar en producción y de leer sus variables se deniegan (2 de 2); desde una sesión de agente y sin acto del responsable, un intento de desplegar en producción no llega a servir (1 de 1) | REQ-036, REQ-058, REQ-059, REQ-060 |
| CA-024 | En preproducción, un despliegue al que le falta una variable obligatoria y otro con un valor de formato no válido no pasan a servir, o responden con un error genérico; en los dos casos no se sirve contenido parcial, no aparece ningún valor y la versión anterior sigue disponible (2 de 2) | REQ-066 |
| CA-025 | El registro de operación anota, para cada entorno, su plan, que solo contiene datos ficticios y que su dirección no se ha entregado a ningún cliente, y el responsable lo confirma al cerrar la función; la guía contiene la lista de servicios que hay que pasar a pago antes de la versión distribuible, y esa condición consta entregada al chat de coordinación | REQ-029, REQ-030 |
| CA-026 | Para cada servicio usado en plan gratuito hay evidencia de verificación con fuente oficial y fecha de las 6 condiciones de REQ-031, anterior a su primer uso (100 %); si alguna impide un requisito, consta la consulta al responsable y el servicio no se ha usado | REQ-031, REQ-068 |
| CA-027 | En preproducción se rota un secreto de la plataforma siguiendo la guía: tras la rotación, la app funciona con el valor nuevo y el antiguo deja de funcionar donde aplique; ningún valor aparece en la evidencia | REQ-032 |
| CA-028 | En preproducción, un despliegue con la compilación rota y otro que no supera la comprobación posterior no pasan a servir: en los dos casos el entorno sigue sirviendo el commit anterior, sin interrupción de la disponibilidad, y se genera un aviso (2 de 2); en todo momento se puede consultar qué commit sirve cada entorno | REQ-033, REQ-061 |
| CA-029 | Un intento de desplegar un commit no integrado en la rama principal y otro desde una copia de trabajo con cambios pendientes no se ejecutan (2 de 2). Un commit integrado con la batería en verde se despliega en preproducción sin intervención de una persona (1 de 1); el mismo intento con la batería en rojo sobre ese commit no se ejecuta (1 de 1) | REQ-034, REQ-035, REQ-057 |
| CA-030 | El 100 % de los despliegues en producción del registro de operación tienen un acto expreso del responsable anotado antes del despliegue, y su commit estaba ya en preproducción con la comprobación posterior superada | REQ-036, REQ-058 |
| CA-031 | El registro de operación anota que una persona puso las credenciales de despliegue en la máquina local; la persona busca el valor de cada credencial en el repositorio y su historial, en los registros de la batería y del despliegue y en las evidencias, con 0 coincidencias, y lo anota sin escribir el valor; la salida de 3 despliegues en preproducción lanzados por un agente no contiene el valor de la credencial, y la revisión de la configuración de la máquina (nombres, sin valores) muestra que ningún agente dispone de acceso a las consolas ni de credenciales de producción | REQ-037 |
| CA-032 | Dos despliegues lanzados a la vez sobre preproducción terminan, en 3 de 3 repeticiones, sirviendo el commit más reciente | REQ-062 |
| CA-033 | En preproducción y en producción, siguiendo solo la guía y sin ejecutar la batería ni una compilación nueva, el entorno vuelve de la versión N a la N-1 en un tiempo medido no mayor que el máximo del diseño; después, la comprobación de disponibilidad está en verde y el commit servido es el de N-1 (2 de 2) | REQ-038 |
| CA-034 | Un error provocado en cada entorno aparece en la supervisión, separado por entorno, con ruta, código y momento, dentro del plazo del diseño (2 de 2); la documentación indica dónde se guarda cada registro y cada dato de supervisión, y la supervisión está en la UE según su verificación | REQ-039, REQ-043 |
| CA-035 | En preproducción, una petición que provoca un error y lleva valores marcados únicos en el cuerpo, la cabecera de autorización, una cookie y la cadena de consulta: la búsqueda de esos valores en la supervisión, los avisos, los registros de la plataforma de despliegue y los de la batería devuelve 0 coincidencias | REQ-040, REQ-063 |
| CA-036 | En preproducción, con el servicio de supervisión inalcanzable, 10 de 10 peticiones a la comprobación de disponibilidad responden correctamente y en el tiempo que fije el diseño | REQ-065 |
| CA-037 | La comprobación externa de disponibilidad se ejecuta en los dos entornos con la frecuencia del diseño; su respuesta no contiene ningún nombre de variable de la lista por entorno, ni versiones, ni configuración (revisión del 100 % de los campos) | REQ-041 |
| CA-038 | Un error nuevo, una pérdida de disponibilidad simulada y un entorno detenido para simular una pausa del plan, en preproducción, producen cada uno un aviso que recibe el responsable por correo, dentro del plazo del diseño (3 de 3); la dirección de destino no aparece en el repositorio | REQ-042, REQ-069 |
| CA-039 | El `revisor` confirma que la guía de operación tiene los 10 apartados de REQ-044 y el escáner de secretos no encuentra nada en ella; una persona distinta de quien la escribió despliega, vuelve atrás y rota un secreto en preproducción siguiendo solo la guía, con éxito (3 de 3) | REQ-044 |
| CA-040 | El registro de operación contiene cada acto de la lista realizado durante la función, con fecha, quién y cómo se comprobó; el resultado de cada uno está comprobado por alguien distinto de quien lo hizo (100 %); el escáner de secretos no encuentra nada en el registro ni en las evidencias | REQ-045 |
| CA-041 | Cada herramienta o servicio incorporado tiene evidencia de verificación con fuente oficial, ubicación de datos y coste, y la confirmación del responsable es anterior a su primer uso; V-112 tiene evidencia de resolución, y V-114 tiene opciones y coste verificados, entregados al chat de coordinación para el registro de decisiones | REQ-046 |
| CA-042 | Revisión. Para cada proyecto de base de datos creado mientras esta función esté abierta: consta el diseño aprobado que lo pide; el registro de operación anota quién puso la credencial de la cuenta en la máquina y, si es el de producción, el acto expreso del responsable anterior a su creación; una persona busca la contraseña y las claves del proyecto en el repositorio y su historial, en los registros y en las evidencias, con 0 coincidencias, y lo anota sin escribir los valores. Umbral: 100 % de los proyectos. Si no se ha creado ninguno, se anota así | REQ-070 |
| CA-043 | Revisión. Antes de confirmarse las condiciones de inicio no hay ningún proyecto en la plataforma de despliegue, y ningún entorno se ha servido en ningún momento desde su plan gratuito: lo declara el responsable en el registro de operación, y todas las evidencias de despliegue tienen fecha dentro de la ventana o posterior a la contratación del plan de pago. Umbral: 100 % de los despliegues | REQ-071 |
| CA-044 | Antes del primer despliegue, todos los criterios de esta función que no nombran un entorno desplegado están superados en local con evidencia; la app base arranca y responde en local; y las órdenes de despliegue y de vuelta atrás tienen sus pruebas automáticas en verde sin llamar a la plataforma. Umbral: 100 % de los criterios locales, con la lista en el plan | REQ-072 |
| CA-045 | El registro de operación contiene las fechas de inicio y de fin de la ventana y la confirmación del responsable de las condiciones de inicio de REQ-074, una por una, con fecha anterior al primer despliegue. Sin esa anotación, la orden de despliegue se niega a actuar (1 de 1) | REQ-025, REQ-073, REQ-074, REQ-078 |
| CA-046 | El calendario de la ventana existe antes del primer despliegue, con las reservas de REQ-075 o con el reparto aprobado por el responsable. Al cerrarla, cada elemento del calendario, también los de las fases 2 y 4, consta como hecho, no ejecutado o trasladado, con su fecha; y si la ventana se agotó, consta la decisión del responsable. Umbral: 0 elementos sin estado | REQ-075, REQ-076, REQ-079 |
| CA-047 | Con fecha anterior al fin de la ventana consta la decisión del responsable sobre el pago. Si no se contrata: una petición a la dirección de cada entorno deja de recibir la app y el responsable confirma que los proyectos están retirados (2 de 2). Si se contrata: consta el plan y los dos entornos siguen superando la comprobación de disponibilidad | REQ-077 |

## Fuera de alcance

- El repositorio remoto, la rama principal protegida en el remoto, el CI remoto, la fijación por huella de acciones de terceros (V-115) y los permisos de sus flujos: son de la función 003, aplazada por el responsable.
- El conector MCP, la autorización OAuth, la activación, los tokens, las tres herramientas, el guion de prueba en Claude y ChatGPT y la decisión de sí o no: son de la función 001, que se despliega en los entornos de esta.
- Las migraciones, la RLS y las pruebas pgTAP (fase 2). La batería debe poder ampliarse con ellas sin rehacerse.
- Crear proyectos de base de datos: esta función solo deja verificada V-114 y fija las condiciones con las que se crean (REQ-070). El proyecto lo crea el agente de base de datos cuando un diseño aprobado lo pida.
- La vuelta atrás de migraciones (fase 2) y la copia y restauración probada de los datos (fase 6). La copia del repositorio de REQ-004 es otra cosa: cubre el código y la documentación, no datos.
- Contratar planes de pago y archivar los acuerdos de encargo de tratamiento (fase 6). Aquí solo queda anotada la condición (REQ-030).
- El registro de versiones del prompt en el despliegue y las tareas periódicas (fases 2 y 4).
- Cabeceras de seguridad y política de contenido de los dashboards (fase 3, A-21).
- El proveedor de correo para avisos de alertas del producto (V-111, fase 4), salvo que el responsable lo designe como canal de los avisos de esta función.
- Objetivos de servicio definitivos (fase 4). Los plazos y tiempos de esta función son los que fije su diseño.
- Guía completa de incidentes y simulacro (fase 6). Aquí solo la guía mínima de REQ-044.
- Plazos de conservación, política de privacidad, revisión de seguridad independiente y rotación de secretos antes de publicar (fase 6).
- Publicación en producción a clientes (B-003, fase 6).
- La comprobación de V-116 (reglas por ruta de `.claude/rules/`): la app base no crea archivos en las rutas que cubren esas reglas.
- Actualizar `docs/PLAN.md`, `docs/TECNOLOGIAS.md`, `docs/ARQUITECTURA.md`, `docs/CALIDAD.md`, `docs/EQUIPO.md`, `CLAUDE.md` u otros documentos compartidos: lo hace el chat de coordinación a partir de `propuestas.md`.

## Cuestiones abiertas

Todas quedaron resueltas el 12/11/2026; las respuestas están en `aclaraciones.md`. Quedan dos datos, que no cambian ningún requisito y que el responsable entrega antes de la puerta P1: el dominio principal completo (REQ-027) y la carpeta de la copia del repositorio (REQ-004).

1. Resuelta el 12/11/2026: ver `aclaraciones.md`.
2. Resuelta el 12/11/2026: ver `aclaraciones.md`.
3. Resuelta el 12/11/2026: ver `aclaraciones.md`.
4. Resuelta el 12/11/2026: ver `aclaraciones.md`.
5. Resuelta el 12/11/2026: ver `aclaraciones.md`.
6. Resuelta el 12/11/2026: ver `aclaraciones.md`.
7. Resuelta el 12/11/2026: ver `aclaraciones.md`.
8. Resuelta el 12/11/2026: ver `aclaraciones.md`.
9. Resuelta el 12/11/2026: ver `aclaraciones.md`.
10. Resuelta el 12/11/2026: ver `aclaraciones.md`.
11. Resuelta el 12/11/2026: ver `aclaraciones.md`.

## Dependencias y decisiones relacionadas

- Respuestas del responsable del 12/11/2026 que cambian el alcance: planes gratuitos hasta la versión distribuible; todo local, con el repositorio remoto pendiente (función 003); flujo desasistido verificado con evidencia y pruebas; dominio con DNS en Axarnet; el entorno anterior a producción se llama preproducción en todos los documentos.
- La respuesta sobre planes gratuitos cambia el alcance de T-003 y T-006 (que confirman los planes Pro de Supabase y Vercel), de B-002 y de la entrada «Plan gratuito de Supabase o Hobby de Vercel» de «Descartado». Lo anota el chat de coordinación.
- Enmienda 1: D-016 (plataforma de despliegue sin coste hasta el final de la fase 1), D-017 (las fases 2 y 4 trabajan a la vez) y T-018 (condiciones de la prueba gratuita).
- Decisiones: D-001, D-002, D-012, D-014, D-015, T-001, T-002, T-003, T-006, V-112, V-114, B-002, B-003. T-012 y T-013 no aplican a esta función: no crea proyectos de base de datos. V-115 pasa a la función 003. V-116 queda fuera.
- ADR: 0001 (pila tecnológica; la región se fija en la configuración y se comprueba, aquí en la batería local).
- Seguridad: amenazas A-15, A-19 y A-20; «Rutas críticas» (CI y configuración de despliegue); «Lista de publicación», apartados «Secretos y configuración», «Código y dependencias» y «Operación».
- Calidad: puertas P2, P4 y P6; formato de evidencias.
- Funciones: la función 001 depende de esta (se despliega en sus entornos). La función 003 depende de esta (reutiliza su batería). La fase 2 no puede implementar hasta que esta función haya creado la app.
- Plantillas actuales que esta función sustituye o amplía: `.env.example` y `.gitignore`. `.github/` pasa a la función 003.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 12/11/2026 | Responsable | Aprobada. Respuesta expresa en el chat de la fase 1: «Sí, apruebo las dos», a la pregunta «¿Apruebas las especificaciones 001 y 002 (puerta P0)?». Quedan dos datos por entregar antes de la puerta P1: el dominio principal completo y la carpeta de la copia del repositorio |
| 13/11/2026 | Responsable | Enmienda 1, por su decisión D-016: aprobada («Sí, apruebo la enmienda»). Cambia REQ-025, REQ-029, REQ-031, REQ-068, REQ-069, REQ-071 y CA-043, y añade REQ-072 a REQ-079 y CA-044 a CA-047 |
