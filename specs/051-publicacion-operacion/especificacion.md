# 051 · Publicación: seguridad, copias, supervisión y operación

Estado: PROPUESTA
Fase: 6 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

El producto no se puede publicar en producción hasta que la lista de publicación de `docs/SEGURIDAD.md` esté completa, con una evidencia por punto, y el responsable lo autorice expresamente (B-003). Esta función reúne lo que falta para llegar ahí: una revisión de seguridad independiente del producto completo, una restauración de copia probada, la supervisión y las alertas del propio servicio, las guías de operación y de incidentes con su simulacro, la vuelta atrás probada y la rotación de secretos. También comprueba que las evidencias que aportan otras fases y funciones existen, se ejecutaron de verdad y siguen vigentes.

Es para el responsable de HumanaIA, que tiene que decidir la publicación con hechos y no con promesas, y para quien opere el servicio después, que necesita saber qué hacer cuando algo falla.

Esta especificación no es asesoramiento jurídico. Lo que dependa de un criterio legal (en particular, cuándo notificar una brecha a la AEPD) lo confirma un abogado o profesional de protección de datos, según la función 052.

## Quién la usa y cómo

- Como **responsable de HumanaIA**, quiero ver la lista de publicación punto por punto con su evidencia enlazada, para autorizar la publicación sabiendo qué se probó, dónde y con qué resultado.
- Como **responsable de HumanaIA**, quiero fijar cuánta pérdida de datos y cuánto tiempo sin servicio acepto, y saber que una restauración real los cumple.
- Como **persona que opera el servicio**, quiero recibir una alerta fuera del panel cuando el conector, el servidor, el webhook de cobro, la tarea periódica o las copias fallan, para actuar antes de que lo noten los clientes.
- Como **persona que opera el servicio**, quiero guías escritas y probadas para las operaciones habituales y para los incidentes, para no improvisar con producción.
- Como **revisor de seguridad independiente**, quiero revisar el producto completo sin haber construido lo que reviso, para que mi dictamen tenga valor.
- Como **cliente de HumanaIA**, quiero que un fallo o una restauración nunca deje a mi agente con instrucciones que no le corresponden ni abra mis datos a otro cliente.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo.

**Revisión de seguridad independiente**

| ID | Requisito |
| --- | --- |
| REQ-001 | Antes de publicar se hace una revisión de seguridad del producto completo sobre un commit identificado. Cubre, como mínimo, todas las rutas críticas de `docs/SEGURIDAD.md` y cada amenaza A-01 a A-23 con su control. El informe dice, por cada ruta y cada amenaza, qué se revisó, con qué medio (lectura de código, prueba, escáner, prueba sobre el sistema desplegado) y el resultado. |
| REQ-002 | Quien hace la revisión no ha implementado la parte que revisa (artículo 6), trabaja con el código y con el sistema desplegado en el entorno previo delante, no con resúmenes de los autores, y no es el único árbitro: el resultado de los escáneres de secretos, de dependencias y de análisis estático, y de las pruebas de CI, forma parte de la revisión. |
| REQ-003 | Cada hallazgo de la revisión lleva gravedad, ubicación, artículo o amenaza afectada y la prueba que lo demostraría. Se devuelve a la fase o función responsable de esa parte para su corrección, y aquí se comprueba el cierre con la evidencia de esa prueba. |
| REQ-004 | Para publicar, no queda abierto ningún hallazgo bloqueante, alto ni crítico. Cada uno de los demás está corregido con evidencia o tiene el riesgo aceptado por escrito por el responsable, con fecha, motivo y fecha en que se volverá a revisar. |
| REQ-005 | Si entre el commit revisado y el commit que se va a publicar hay cambios en rutas críticas, esos cambios tienen su propia revisión de seguridad, con el mismo criterio de independencia y de cierre, antes de publicar. |

**Copias y restauración**

| ID | Requisito |
| --- | --- |
| REQ-006 | El responsable fija por escrito, antes de la prueba de restauración, el objetivo de pérdida máxima de datos y el objetivo de tiempo de recuperación de producción. |
| REQ-007 | La base de datos de producción tiene copias con, al menos, la frecuencia que exija el objetivo de pérdida máxima y nunca menos de una diaria (A-23). Las copias se guardan en la UE y se puede comprobar en todo momento cuándo se hizo la última copia correcta. |
| REQ-008 | Una copia se restaura con éxito en un entorno de prueba separado de producción, siguiendo solo la guía de restauración. Se mide el tiempo desde la decisión de restaurar hasta el servicio comprobado, y se compara con el objetivo de tiempo de recuperación. |
| REQ-009 | Tras restaurar se comprueba que los datos son los esperados: recuento de filas por tabla igual al del punto de la copia, presencia de filas de referencia conocidas, políticas de aislamiento y roles intactos, versiones del prompt y auditoría todavía inmutables, y pruebas de aislamiento entre clientes en verde sobre lo restaurado. La comprobación se registra por recuentos y resultados, sin copiar valores de los datos. |
| REQ-010 | Está documentado qué ocurre tras una restauración con las conexiones, los tokens, los códigos de activación, las licencias, las órdenes, las publicaciones del prompt y las sesiones de los dashboards, y qué tiene que hacer cada cliente (por ejemplo, si debe volver a activar su conector). |
| REQ-011 | Antes de dar servicio con una copia restaurada, se vuelven a aplicar los cambios de seguridad posteriores al punto de la copia: revocaciones de conexiones, suspensiones de licencias, bajas de administradores, publicaciones y vueltas atrás del prompt, pausa global y rotaciones de secretos. Lo que no se pueda reconstruir con certeza queda sin acceso hasta que una persona lo revise. También se vuelven a aplicar las supresiones y los plazos de conservación que exige la función 052. |

**Supervisión y alertas del servicio**

| ID | Requisito |
| --- | --- |
| REQ-012 | Existen alertas del propio servicio, distintas de las alertas sobre los agentes de los clientes, para, como mínimo: conector no disponible; errores del servidor por encima de un umbral; fallos del webhook de cobro al recibir o tratar eventos; tarea periódica que no completa una ejecución en su plazo; copia que falla o que no se produce en su plazo; y supervisión que deja de recibir datos. |
| REQ-013 | Cada alerta llega a los destinatarios que fije el responsable, por un canal que no es el panel y que no depende del componente que falla, dentro del plazo de detección fijado para esa alerta. |
| REQ-014 | Saber que el conector está caído o que la tarea periódica no se ejecuta no depende de que esos mismos componentes funcionen. |
| REQ-015 | Cada alerta indica qué falla, en qué entorno, desde cuándo, y enlaza a la guía de operación que corresponde. No contiene contenido de correo, valores recibidos, secretos, tokens, cargas de eventos ni datos personales. |
| REQ-016 | La supervisión no captura cuerpos de petición ni de respuesta, valores recibidos, cabeceras de autorización, tokens, códigos de activación ni cargas de eventos de cobro (artículo 1, A-15). |
| REQ-017 | Los datos de supervisión y de alertas se tratan y guardan en la UE, y cada proveedor que interviene figura en la lista de encargados de la función 052. |
| REQ-018 | La supervisión permite conocer la disponibilidad mensual del conector y el tiempo de respuesta de `obtener_instrucciones`, para compararlos con los objetivos de servicio que estén fijados. |
| REQ-019 | Cada alerta indica su entorno sin ambigüedad. Las alertas que se provoquen para probarlas, en cualquier entorno, no cambian el estado de ningún cliente real, no le envían avisos y quedan identificadas como prueba. |
| REQ-020 | Un fallo continuado produce un aviso al empezar y otro al terminar, no un aviso por cada comprobación. |

**Guías de operación**

| ID | Requisito |
| --- | --- |
| REQ-021 | Existen guías de operación, en español, para: alta de un cliente; baja de un cliente; alta de un superadmin; baja de un superadmin; rotación de cada secreto; despliegue; vuelta atrás de un despliegue; vuelta atrás de una migración; restauración de una copia; activar y desactivar el modo observación del cobro; activar y levantar la pausa global; revocar conexiones; y vuelta atrás de la versión del prompt. |
| REQ-022 | Cada guía indica quién puede ejecutarla, qué hace falta antes, los pasos, cómo se comprueba el resultado, cómo se deshace si se puede, qué queda en la auditoría y qué pasos solo puede hacer una persona (secretos y configuración de producción, artículos 4 y 14). |
| REQ-023 | La guía de rotación cubre cada secreto que figura en `.env.example` y, para cada uno, dice qué efecto tiene rotarlo sobre los clientes y el servicio (por ejemplo, si invalida conexiones o sesiones) y cómo se recupera el servicio. No contiene ningún valor. |
| REQ-024 | Cada guía se ha ejecutado al menos una vez en el entorno previo, siguiendo solo su texto, por alguien distinto de quien la escribió. Los errores encontrados se corrigen en la guía antes de publicar. |
| REQ-025 | Las cuentas de superadmin son nominales. El alta exige doble factor antes del primer acceso a datos. La baja deja sin acceso a la cuenta de inmediato, también en las sesiones ya abiertas. El alta y la baja dejan cada una su fila de auditoría. |
| REQ-026 | Tras la baja de un cliente, ninguna de sus conexiones recibe instrucciones, su licencia queda suspendida y la baja queda auditada. Lo que ocurre con el acceso de sus usuarios al dashboard y con sus datos sigue lo que fije la función 052. Los demás clientes no se ven afectados. |

**Incidentes**

| ID | Requisito |
| --- | --- |
| REQ-027 | Existe una guía de incidentes con: detección y declaración del incidente; clasificación de gravedad; quién decide; contención (pausa global, revocar conexiones, vuelta atrás del prompt, suspender licencias); rotación de los secretos implicados; conservación de registros sin borrar nada; registro de hechos y horas; valoración de la notificación a la AEPD en 72 horas; aviso a los clientes; recuperación; cierre y revisión posterior. |
| REQ-028 | La guía de incidentes nombra, para cada paso, el rol que lo ejecuta y un sustituto cuando el responsable no esté disponible. |
| REQ-029 | Antes de publicar se hace un simulacro de incidente con un escenario ficticio, en el entorno que fije el responsable, que ejecuta de verdad la revocación de conexiones, la pausa global, la vuelta atrás del prompt y la rotación de secretos, comprueba el efecto de cada una, lleva el registro de hechos y horas, pasa por la valoración de la notificación y mide el tiempo hasta la contención. |
| REQ-030 | Tras el simulacro queda un informe con lo que funcionó, lo que no, los tiempos medidos y los cambios necesarios en las guías. Esos cambios se aplican antes de publicar. |
| REQ-031 | El paso de valorar la notificación a la AEPD remite al procedimiento de brechas de la función 052, y los dos documentos se enlazan. La guía no presenta ningún criterio jurídico como definitivo sin la validación de un profesional. |

**Vuelta atrás**

| ID | Requisito |
| --- | --- |
| REQ-032 | La vuelta atrás de un despliegue está probada en el entorno previo con el candidato a publicar: se vuelve al despliegue anterior, el servicio queda comprobado y se mide el tiempo. |
| REQ-033 | Cada migración incluida en la publicación tiene su vuelta atrás probada con datos ficticios, comprobando que el esquema, las políticas, los permisos y los datos quedan como estaban antes de aplicarla (artículo 11). |

**Secretos**

| ID | Requisito |
| --- | --- |
| REQ-034 | Cada entorno (desarrollo, previo y producción) tiene sus propios valores para cada secreto. Ningún valor se comparte entre entornos. |
| REQ-035 | Antes de publicar, una persona rota todos los secretos de producción. Queda evidencia de cada rotación con el nombre del secreto, el entorno, la fecha y quién la hizo, sin el valor ni ninguna parte de él. |
| REQ-036 | Ningún agente ve, pide, recibe, escribe ni registra el valor de un secreto, y ninguna guía ni procedimiento de esta función lo necesita (artículos 4 y 14). |

**Lista de publicación y evidencias**

| ID | Requisito |
| --- | --- |
| REQ-037 | Existe una relación de la lista de publicación de `docs/SEGURIDAD.md` punto por punto. Para cada punto indica la fase o función que lo cumple, el enlace a su evidencia, el commit, la fecha, el entorno, el resultado y quién la revisó. |
| REQ-038 | Los puntos que cumplen otras fases o funciones no se rehacen aquí. Aquí se comprueba que su evidencia existe, corresponde a una prueba ejecutada con resultado superada y está vigente para el commit que se va a publicar. |
| REQ-039 | Para cada evidencia, la relación indica por qué sigue vigente frente al commit que se va a publicar, según el criterio de vigencia que fije el responsable. |
| REQ-040 | Una prueba diseñada y no ejecutada figura como «no ejecutada» y no cuenta. Lo que no se pudo comprobar en la máquina de desarrollo indica dónde se comprobó (CI, entorno previo o producción) (artículo 13). |
| REQ-041 | Ninguna evidencia, guía, informe ni alerta de esta función contiene secretos, datos reales de clientes ni contenido de correo. Lo que se compruebe sobre producción se describe por recuentos y tipos. |
| REQ-042 | Los puntos que dependen de la configuración de un entorno (doble factor, cabeceras de seguridad, protección de rama, región, secretos) se comprueban en producción o en el repositorio remoto, con el commit que se va a publicar desplegado, no solo en el entorno previo. |
| REQ-043 | Las cuentas de superadmin de producción coinciden con la lista nominal aprobada por el responsable. Todas tienen doble factor y no hay cuentas compartidas ni de prueba. |

**Autorización**

| ID | Requisito |
| --- | --- |
| REQ-044 | La publicación la autoriza expresamente el responsable, por escrito, con fecha y con el commit exacto, después de ver la relación completa. La autorización queda anotada en esta función y en B-003. |
| REQ-045 | Lo que se despliega en producción como publicación es exactamente el commit autorizado. Un commit distinto necesita una autorización nueva. |
| REQ-046 | Ninguna acción de esta función sobre producción (despliegue, cambio de configuración, rotación de secretos, restauración, cambio del modo observación) se hace sin aprobación humana expresa (artículo 14), y cada una queda registrada con quién la aprobó. |

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-047 | Un punto de la lista no tiene evidencia, o su evidencia es de una prueba no ejecutada, fallida o no vigente | La relación lo muestra como pendiente y no se puede autorizar la publicación. Ningún agente lo marca como completo |
| REQ-048 | Queda abierto un hallazgo bloqueante, alto o crítico | Impide publicar. Para estas gravedades no cabe aceptar el riesgo: se corrigen |
| REQ-049 | La aceptación de un riesgo no está escrita por el responsable: se deduce de su silencio, la transmite un agente o no tiene fecha | No cuenta. El hallazgo sigue abierto |
| REQ-050 | Quien revisa una parte la implementó, o revisa a partir de un resumen de los autores | Su revisión de esa parte no cuenta y se repite con otra persona o agente independiente |
| REQ-051 | Hay cambios en rutas críticas posteriores al commit revisado sin revisión propia | Impide publicar ese commit |
| REQ-052 | Una alerta provocada no llega a su destinatario, o llega fuera de plazo | La prueba se anota como fallida, el punto «Alertas de supervisión probadas» queda pendiente, se corrige y se repite la prueba |
| REQ-053 | La supervisión o el canal de alertas deja de funcionar | El silencio no se toma como que todo va bien: se genera una alerta por otro medio, en el plazo fijado |
| REQ-054 | Una alerta o un dato de supervisión contiene un valor recibido, un token, un código, una carga de evento o contenido de correo | Hallazgo bloqueante (artículo 1). Se retira el dato, se corrige el origen y se valora como posible brecha según la función 052 |
| REQ-055 | La restauración falla, supera el objetivo de tiempo o no recupera los datos esperados | Se anota como fallida, con el motivo; el punto queda pendiente; producción no cambia; no se da servicio con datos parciales |
| REQ-056 | La restauración de prueba escribe en producción, o el entorno restaurado envía avisos a destinatarios reales, cobra o consulta el cobro en modo real, o recibe tráfico de clientes | No ocurre nunca. El entorno restaurado queda aislado de producción y de terceros reales mientras dura la prueba |
| REQ-057 | Una restauración devolvería el acceso a una conexión revocada, una licencia suspendida o un administrador dado de baja, o volvería a servir una versión del prompt ya retirada, después del punto de la copia | No ocurre. Si no se puede garantizar, eso queda sin acceso hasta que una persona lo revise (cierre en fallo) |
| REQ-058 | No se ha hecho el simulacro, o falta alguna de sus cuatro acciones (revocar conexiones, pausa global, vuelta atrás del prompt, rotación de secretos) | El punto queda pendiente y no se puede autorizar la publicación |
| REQ-059 | El simulacro afecta a clientes reales sin aprobación expresa del responsable | No ocurre. El escenario usa clientes, licencias y conexiones ficticios |
| REQ-060 | Dos entornos comparten el valor de un secreto, o un secreto de producción no se ha rotado antes de publicar | Impide publicar hasta que una persona lo rote y quede la evidencia |
| REQ-061 | Un secreto aparece en una evidencia, un registro, una guía, una alerta, el repositorio o una conversación con un agente | Se trata como incidente: una persona lo rota de inmediato, se retira lo expuesto y se anota (A-20) |
| REQ-062 | Una evidencia contiene datos reales de un cliente | Se retira, no cuenta como evidencia y se trata según el procedimiento de brechas de la función 052 |
| REQ-063 | Se intenta publicar sin autorización expresa, tras un silencio, con la autorización de otro commit, o con una autorización emitida o transmitida por un agente | No se publica. Si ya se hubiera desplegado, se trata como incidente y se vuelve atrás |
| REQ-064 | Una vuelta atrás de despliegue, de migración o del prompt deja el sistema en un estado que concede acceso: aislamiento desactivado, permisos ampliados, funciones del conector invocables desde la API pública, licencia suspendida con instrucciones, o token inválido aceptado | No ocurre. Tras cada vuelta atrás, las pruebas de aislamiento y de cierre en fallo pasan antes de dar el servicio por recuperado |
| REQ-065 | Una vuelta atrás se interrumpe a medias | El sistema queda en un estado que deniega (sin entregar instrucciones ni conceder acceso), salta una alerta y la guía indica cómo continuar |
| REQ-066 | Una guía exige que un agente vea o ponga un secreto, o que cambie la configuración de producción sin una persona | La guía no se acepta en revisión hasta que esos pasos sean de una persona |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | El informe de la revisión de seguridad identifica el commit revisado y cubre el 100 % de las rutas críticas de `docs/SEGURIDAD.md` y de las amenazas A-01 a A-23, cada una con medio y resultado. Incluye la salida de los escáneres de secretos, dependencias y análisis estático sobre ese commit | REQ-001, REQ-002 |
| CA-002 | Comparando las partes revisadas con los autores de las tareas de cada función, hay 0 partes revisadas por quien las implementó. El informe declara que se revisó con el código y el entorno previo delante | REQ-002, REQ-050 |
| CA-003 | Al pedir la autorización hay 0 hallazgos bloqueantes, altos o críticos abiertos, y el 100 % de los demás tiene evidencia de corrección o aceptación escrita del responsable con fecha, motivo y fecha de nueva revisión. Un hallazgo de prueba con aceptación transmitida por un agente figura como abierto | REQ-003, REQ-004, REQ-048, REQ-049 |
| CA-004 | La comparación entre el commit revisado y el commit a publicar muestra 0 cambios en rutas críticas sin su propia revisión | REQ-005, REQ-051 |
| CA-005 | Existe la decisión escrita del responsable con los dos objetivos (pérdida máxima y tiempo de recuperación), con fecha anterior a la prueba de restauración | REQ-006 |
| CA-006 | Durante 7 días seguidos, producción tiene cada día al menos una copia correcta, con la frecuencia que exige el objetivo de pérdida, guardada en la UE; la fecha de la última copia correcta se consulta en cualquier momento | REQ-007 |
| CA-007 | Una copia restaurada en un entorno de prueba separado, siguiendo solo la guía, queda en servicio comprobado en un tiempo menor o igual que el objetivo de recuperación, con el punto de la copia dentro del objetivo de pérdida. El recuento de filas coincide en el 100 % de las tablas, las filas de referencia están todas, la inmutabilidad se mantiene y las pruebas de aislamiento pasan en verde. La evidencia contiene recuentos y resultados, sin valores | REQ-008, REQ-009 |
| CA-008 | En la prueba, después del punto de la copia se revoca una conexión, se suspende una licencia, se da de baja a un administrador, se vuelve atrás una versión del prompt y se activa la pausa global (todo ficticio). Tras restaurar y antes de dar servicio, 0 de esos 5 cambios se han perdido: ninguno recupera acceso ni instrucciones. El documento sobre conexiones, tokens, códigos, licencias, órdenes, publicaciones y sesiones existe y cubre los 7 elementos | REQ-010, REQ-011, REQ-057 |
| CA-009 | Una restauración provocada para que falle (copia inexistente o interrumpida a medias) queda anotada como fallida con su motivo, no da servicio con datos parciales y deja 0 cambios en producción | REQ-055 |
| CA-010 | Durante la prueba de restauración se registran 0 escrituras en producción, 0 avisos a destinatarios reales, 0 llamadas al cobro en modo real y 0 peticiones de clientes reales al entorno restaurado | REQ-056 |
| CA-011 | Se provoca cada una de las 6 alertas de REQ-012 en el entorno que fije el responsable. El 100 % llega a todos sus destinatarios por un canal fuera del panel, dentro de su plazo de detección. Con el conector y la app detenidos, las alertas de conector caído y de tarea periódica parada llegan igualmente. Cada alerta indica qué falla, el entorno, desde cuándo y enlaza a su guía | REQ-012 a REQ-015 |
| CA-012 | Con un destinatario de prueba inalcanzable, la prueba queda anotada como fallida y el punto pendiente. Al detener la recepción de datos de la supervisión, llega por otro medio la alerta de supervisión sin datos dentro de su plazo | REQ-052, REQ-053 |
| CA-013 | Se envían peticiones que provocan errores con valores marcados en el cuerpo, una cabecera de autorización ficticia, un código de activación ficticio y una carga de evento de cobro de prueba. Una búsqueda de esos valores en los datos de supervisión y en las alertas da 0 coincidencias | REQ-016, REQ-054 |
| CA-014 | La configuración y la documentación de cada proveedor de supervisión y de alertas muestran tratamiento y almacenamiento en la UE, y el 100 % de esos proveedores figura en la lista de encargados de la función 052 | REQ-017 |
| CA-015 | La supervisión muestra la disponibilidad mensual del conector y el tiempo de respuesta de `obtener_instrucciones` en percentil 95, y la relación los compara con los objetivos de servicio fijados | REQ-018 |
| CA-016 | Una alerta provocada en el entorno previo llega identificada como previo y como prueba. Una alerta provocada en producción cambia el estado de 0 clientes reales y les envía 0 avisos. Un fallo mantenido durante 30 minutos produce exactamente un aviso de inicio y uno de fin | REQ-019, REQ-020 |
| CA-017 | Existen las 13 guías de REQ-021, cada una con los 7 apartados de REQ-022. El 100 % se ha ejecutado en el entorno previo por alguien distinto de su autor, con el resultado anotado, y quedan 0 errores sin corregir | REQ-021, REQ-022, REQ-024 |
| CA-018 | La guía de rotación cubre el 100 % de los secretos de `.env.example` con su efecto y su recuperación. Una revisión de todas las guías encuentra 0 valores de secretos y 0 pasos en los que un agente vea o ponga un secreto o cambie la configuración de producción | REQ-023, REQ-036, REQ-066 |
| CA-019 | En el entorno previo, una cuenta de superadmin nueva no lee ni cambia nada sin doble factor; tras su baja, una sesión abierta obtiene 0 respuestas correctas; el alta y la baja dejan 2 filas de auditoría. En producción, las cuentas de superadmin coinciden al 100 % con la lista nominal aprobada, todas con doble factor, y hay 0 cuentas compartidas o de prueba | REQ-025, REQ-043 |
| CA-020 | En el entorno previo, tras la baja de un cliente ficticio, 0 de sus conexiones recibe instrucciones, su licencia figura suspendida, la baja deja su fila de auditoría y otro cliente ficticio sigue recibiendo instrucciones con normalidad | REQ-026 |
| CA-021 | La guía de incidentes contiene los 12 apartados de REQ-027, nombra rol y sustituto en el 100 % de los pasos, y está enlazada en los dos sentidos con el procedimiento de brechas de la función 052 | REQ-027, REQ-028, REQ-031 |
| CA-022 | El simulacro se hace con datos ficticios y ejecuta las 4 acciones con efecto comprobado: la conexión revocada no obtiene acceso; la pausa global llega a los agentes de prueba en su siguiente revisión; la vuelta atrás del prompt se aplica en la siguiente revisión; el valor anterior del secreto rotado deja de ser aceptado. El registro de hechos y horas no tiene huecos, la valoración de la notificación queda decidida y documentada antes de 72 horas desde la detección simulada, y se mide el tiempo hasta la contención | REQ-029, REQ-031 |
| CA-023 | Existe el informe del simulacro y el 100 % de los cambios que propone está aplicado en las guías antes de pedir la autorización. Con el simulacro sin hacer o incompleto, la relación muestra el punto como pendiente. El simulacro afecta a 0 clientes reales | REQ-030, REQ-058, REQ-059 |
| CA-024 | En el entorno previo, con el candidato a publicar desplegado, la vuelta atrás al despliegue anterior deja el servicio comprobado y se mide su tiempo; después se vuelve a desplegar el candidato y queda comprobado | REQ-032 |
| CA-025 | El 100 % de las migraciones de la publicación tiene su vuelta atrás probada con datos ficticios, y la comparación de esquema, políticas, permisos y recuentos antes de aplicar y después de deshacer muestra 0 diferencias | REQ-033 |
| CA-026 | Tras cada una de las 3 vueltas atrás (despliegue, migración y prompt), las pruebas de aislamiento, de funciones no invocables desde la API pública, de licencia suspendida sin instrucciones y de token inválido rechazado pasan al 100 %. Una vuelta atrás interrumpida a propósito concede 0 accesos, entrega 0 instrucciones y genera su alerta | REQ-064, REQ-065 |
| CA-027 | Para el 100 % de los secretos de `.env.example` hay evidencia de que su valor es distinto en cada entorno y de que una persona lo rotó en producción antes de la autorización, con nombre, entorno, fecha y quién. Las evidencias contienen 0 valores. Si se detecta un valor compartido, la relación muestra el punto como pendiente | REQ-034, REQ-035, REQ-060 |
| CA-028 | El escáner de secretos sobre todo el historial del repositorio, las evidencias y las guías da 0 hallazgos. La guía de incidentes incluye el caso de un secreto expuesto, con rotación inmediata por una persona y retirada de lo expuesto | REQ-061 |
| CA-029 | Grupo «Acceso»: los 3 puntos tienen evidencia ejecutada, superada y vigente. En producción, una cuenta de superadmin sin doble factor obtiene 0 filas; el límite de intentos de activación y el de inicio de sesión bloquean al superar su umbral | REQ-037, REQ-038, REQ-042 |
| CA-030 | Grupo «Aislamiento»: los 3 puntos tienen evidencia ejecutada, superada y vigente. Las pruebas de aislamiento de tablas y vistas están en verde en CI sobre el commit a publicar; existe la prueba de extremo a extremo de acceso cruzado entre dos clientes; las funciones del conector no son invocables por la API pública | REQ-037, REQ-038 |
| CA-031 | Grupo «Secretos y configuración»: los 3 puntos tienen evidencia ejecutada, superada y vigente. La protección de la rama principal con revisión obligatoria se observa configurada en el repositorio remoto en la fecha de la autorización | REQ-037, REQ-038, REQ-042 |
| CA-032 | Grupo «Código y dependencias»: los 3 puntos tienen evidencia ejecutada, superada y vigente. El análisis estático y el escáner de dependencias sobre el commit a publicar dan 0 hallazgos altos o críticos; la revisión independiente cumple CA-001 a CA-004; las cabeceras de seguridad y la política de contenido se comprueban en producción con ese commit desplegado | REQ-037, REQ-038, REQ-042 |
| CA-033 | Grupo «Privacidad»: los 4 puntos tienen enlazada la evidencia que aporta la función 052, ejecutada, superada y vigente. Aquí no se rehacen | REQ-037, REQ-038 |
| CA-034 | Grupo «Operación»: los 4 puntos enlazan a las evidencias de CA-007, CA-011, CA-022 y CA-024 a CA-026, todas superadas | REQ-037 |
| CA-035 | Grupo «Autorización»: existe la autorización escrita del responsable con fecha, commit y texto expreso, anotada en esta función y en B-003. El commit desplegado como publicación coincide con el autorizado. Un intento de prueba de publicar otro commit, o sin autorización, no llega a producción | REQ-044, REQ-045, REQ-063 |
| CA-036 | El 100 % de las evidencias enlazadas lleva los campos de `docs/CALIDAD.md` y una justificación de vigencia. Hay 0 evidencias marcadas como superadas sin haberse ejecutado. Cada comprobación que no se hizo en la máquina de desarrollo dice dónde se hizo. Con una evidencia de prueba marcada «no ejecutada», la relación muestra su punto como pendiente | REQ-039, REQ-040, REQ-047 |
| CA-037 | Una persona busca en las evidencias, guías e informes de esta función los nombres y dominios de los clientes reales y los patrones de secreto: 0 coincidencias. Una evidencia de prueba con un dato marcado como real se retira y no cuenta | REQ-041, REQ-062 |
| CA-038 | El 100 % de las acciones de esta función sobre producción tiene anotada la persona que la aprobó, con fecha | REQ-046 |

## Fuera de alcance

- Las alertas sobre los agentes de los clientes (sin señal, ejecución sin informe, estado `error`, versión antigua, orden sin confirmar, conexión nueva): fase 4. Aquí solo las del propio servicio.
- Las alertas internas del cobro visibles en el panel (contadores de fallos de relectura, impagos, gracia vencida): función 050. Aquí solo la alerta de servicio cuando el webhook de cobro falla.
- Corregir los hallazgos de otras fases o funciones: se devuelven a su fase y aquí se comprueba su cierre.
- Volver a hacer las pruebas que ya son evidencia de otras fases (aislamiento, doble factor, límite de intentos, cabeceras, protección de rama): aquí se exige y se comprueba que su evidencia existe y está vigente.
- Los textos legales, el inventario de datos, la lista de encargados, el registro de actividades, los plazos de conservación y el procedimiento de brechas, que incluyen los cuatro puntos de «Privacidad» de la lista: función 052.
- El cobro, el modo observación y su comportamiento: función 050. Aquí solo la guía para activarlo y desactivarlo.
- La factura legal (B-001).
- La migración de los clientes desde la carpeta `panel`: función 053.
- Fijar los objetivos de servicio: la arquitectura los asigna a la fase 4 (ver cuestiones abiertas). Aquí solo se miden.
- La recuperación ante la pérdida de una región o de un proveedor completo, salvo lo que el responsable incluya en el objetivo de recuperación.
- Certificaciones formales (ISO 27001, ENS u otras).
- Elegir herramientas, proveedores, canales técnicos o rutas: es del diseño.
- Poner, ver o rotar secretos: lo hace una persona; esta función solo exige la evidencia.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`.

1. **Quién hace la revisión de seguridad independiente.** Opciones: (a) el agente `auditor-seguridad` con los escáneres y las pruebas de CI; (b) además, una auditoría externa de las rutas críticas (incluida una prueba de intrusión sobre el entorno previo); (c) solo la auditoría externa. Hay que tener en cuenta que el `auditor-seguridad` ya dictamina cada cambio en rutas críticas durante las fases y es consultado en el diseño: revisar ahora el producto completo es, en parte, revisar sus propios dictámenes (artículo 6), y `docs/SEGURIDAD.md` dice que ningún modelo es el único árbitro de seguridad. ¿Y el alcance mínimo son las rutas críticas o el nivel 2 completo de OWASP ASVS citado como marco?
2. **Escala de gravedad de los hallazgos.** `docs/CALIDAD.md` usa BLOQUEANTE, MAYOR y MENOR; la lista de publicación y los escáneres hablan de «altos» y «críticos». ¿Cómo se corresponden? Y para los hallazgos menores: ¿exigen corrección o riesgo aceptado por escrito (como pide este encargo), o basta anotarlos, como dice `docs/CALIDAD.md`?
3. **Pérdida de datos y tiempo de recuperación aceptables.** ¿Cuántas horas de datos se pueden perder como máximo y cuánto tiempo puede estar el servicio sin funcionar tras un desastre? Si la pérdida admitida es menor de un día, puede hacer falta algo más que la copia diaria, con un coste que no está en B-002.
4. **Con qué datos se prueba la restauración (contradicción).** La arquitectura dice «Ningún dato real sale de producción» y la lista de publicación pide «Copia restaurada con éxito en un entorno de prueba». Opciones: (a) restaurar una copia real de producción en un entorno de prueba aislado en la UE, como excepción expresa a la arquitectura, con acceso restringido a personas y borrado al terminar; (b) restaurar en un entorno separado que se considere parte de producción, con sus mismas reglas; (c) restaurar solo una copia del entorno previo con datos ficticios, que prueba el procedimiento pero no las copias de producción. ¿Cuál se acepta? En (a) y (b), las comprobaciones con datos reales las haría una persona, sin pasarlos a agentes (ver la cuestión sobre herramientas de IA de la función 052).
5. **Efecto de una restauración real sobre los clientes.** Para no reactivar nada revocado, opciones: (a) volver a aplicar los cambios de seguridad posteriores a la copia a partir de un registro que no se pierda con ella; (b) invalidar todas las conexiones y que cada cliente vuelva a activar su conector con un código nuevo; (c) una combinación. ¿Qué impacto acepta el responsable? ¿Quién decide restaurar producción?
6. **Alertas: destinatarios, canal, horario y plazos.** ¿Quién recibe las alertas del servicio, por qué canal, en qué horario se atienden y quién sustituye al responsable en vacaciones o ausencias? ¿Cuál es el plazo de detección de cada alerta y el umbral de errores del servidor que dispara la suya?
7. **Dónde se provocan las alertas para probarlas.** ¿Solo en el entorno previo, o también en producción (que es donde está la configuración que importa), con las salvaguardas de REQ-019?
8. **Superadmin nominales.** ¿Quiénes serán los superadmin con cuenta nominal en producción? ¿Hay un número máximo?
9. **Aviso a los clientes en un incidente.** ¿Quién avisa, por qué canal, en qué plazo, con qué plantilla y a partir de qué gravedad? Debe encajar con lo que diga la función 052 si HumanaIA actúa como encargado de sus clientes.
10. **Publicación en un solo paso o por etapas (contradicción).** El plan de la fase 4 prevé que «un cliente piloto funciona en paralelo con la carpeta `panel` actual» antes de la fase 6, es decir, en producción y con datos reales antes de que el responsable autorice la publicación (B-003). Opciones: (a) el piloto se considera una publicación limitada que necesita su propia autorización y un subconjunto de la lista de publicación (¿cuál?); (b) el piloto se hace en un entorno que no es producción, sin datos reales; (c) se retrasa el piloto hasta después de B-003. ¿Y la publicación general es después un único paso?
11. **Simulacro.** ¿En qué entorno se hace (previo o producción)? ¿Quién participa? ¿Se anuncia o es por sorpresa? ¿Se integra en él el ejercicio de brechas de la función 052 (su cuestión sobre el ejercicio de brechas)?
12. **Vigencia de una evidencia.** ¿Cuándo deja de valer? Opciones: (a) con cualquier cambio posterior a su commit; (b) solo si el cambio toca lo que la evidencia prueba; (c) además, si tiene más de cierto número de días.
13. **Evidencia de secretos distintos y rotados.** ¿Basta una declaración firmada de la persona que los puso, o se exige además una comprobación automática que no exponga ni el valor ni parte de él? ¿Qué secretos se rotan antes de publicar y se acepta su efecto sobre el piloto (por ejemplo, que el cliente piloto tenga que volver a activar su conector)?
14. **Objetivos de servicio.** La arquitectura dice que se fijan «en la fase 4, con datos reales», pero los criterios de la fase 4 no lo recogen y los únicos datos reales antes de publicar serían los del piloto. ¿Quién los fija, cuándo, y son condición para publicar?
15. **Canal para comunicar vulnerabilidades.** ¿Se publica una forma para que terceros comuniquen vulnerabilidades del servicio? Si es que sí, ¿entra en esta función y quién lo atiende?
16. **Dónde se guarda el registro de un incidente real.** Puede contener nombres de clientes, y las evidencias del repositorio no admiten datos reales. ¿Dónde se guarda, quién tiene acceso y cuánto tiempo se conserva (en coordinación con la función 052)?
17. **Cambios urgentes tras la autorización.** Si hay que corregir algo entre la autorización y el despliegue, o justo después, ¿hace falta repetir la autorización completa o cabe una autorización abreviada para cambios fuera de rutas críticas?
18. **Datos y cuentas de prueba en producción.** ¿Se retiran de producción antes de publicar todos los clientes, licencias y cuentas de prueba usados en las comprobaciones, o se mantiene alguno identificado para la supervisión?
19. **Operación continuada.** Después de publicar, ¿cada cuánto se repiten la prueba de restauración, el simulacro y la revisión de las guías?
20. **Quién ejecuta las guías en el entorno previo.** Si el equipo humano es una sola persona, ¿puede un agente (por ejemplo `qa`) ser el «alguien distinto del autor» en los pasos que no exigen una persona?

## Dependencias y decisiones relacionadas

- Decisiones: B-003 (publicación), B-002 (gasto; puede verse afectado por la cuestión 3), D-003, D-007, D-010, T-003, T-006, T-012, V-111 (avisos fuera del panel), V-112 (supervisión sin cuerpos, en la UE), V-114 (entorno previo).
- ADR: 0003 (aislamiento), 0005 (prompt por despliegue, vuelta atrás y pausa global), 0006 (cobro y modo observación).
- Funciones: 050 (cobro, webhook y modo observación), 052 (cuatro puntos de «Privacidad», lista de encargados, plazos de conservación, procedimiento de brechas y reaplicación de supresiones tras una restauración), 053 (migración de clientes, que no debe publicarse antes de B-003).
- Fases: 1 (CI, escáneres, protección de rama, entornos), 2 (aislamiento, funciones del conector, límite de intentos de activación, registros sin valores), 3 (doble factor, auditoría, cabeceras y política de contenido), 4 (versiones, vuelta atrás del prompt, pausa global, avisos fuera del panel, objetivos de servicio), 5 (prueba de extremo a extremo de acceso cruzado). Esta función no puede completarse hasta que las fases 4 y 5 aporten sus evidencias, aunque la tabla de dependencias del plan solo exige las fases 2 y 3 cerradas.
- Documentos: `docs/SEGURIDAD.md` (amenazas, rutas críticas, lista de publicación, respuesta a incidentes), `docs/CALIDAD.md` (puertas P4, P6 y P7; reglas de evidencia), `docs/ARQUITECTURA.md` (entornos, fallos previstos, objetivos de servicio), `docs/INSTALACION-CLIENTE.md` (baja o incidencia), `.env.example` (nombres de los secretos).

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
