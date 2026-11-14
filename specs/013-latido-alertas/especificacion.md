# 013 · Latido de ejecuciones y alertas de falta de señal

Estado: PROPUESTA
Fase: 2 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Con la carpeta `panel` desaparece la forma actual de saber si el agente de un cliente sigue trabajando. Con el conector, cada revisión deja un latido: se abre una ejecución al pedir instrucciones y se cierra al entregar el informe. Esta función convierte ese latido en alertas cuando el agente de un cliente deja de dar señal o empieza una revisión y no la termina. Lo hace sin leer nada del correo, sin que un cliente vea lo de otro y con aviso a una persona si el propio cálculo deja de funcionar.

## Quién la usa y cómo

- Como **superadmin de HumanaIA**, quiero que se abra una alerta cuando el agente de un cliente deja de pedir instrucciones durante más tiempo del esperado, para actuar antes de que el cliente lo note.
- Como **superadmin de HumanaIA**, quiero que se abra una alerta cuando una revisión empieza y no entrega informe, para detectar agentes que fallan a mitad.
- Como **responsable de HumanaIA**, quiero enterarme si el cálculo de alertas deja de ejecutarse, para no tomar el silencio por buena señal.
- Como **cliente**, quiero que nadie de otro cliente pueda ver el estado de mi agente ni sus alertas.

## Términos

| Término | Significado en esta especificación |
| --- | --- |
| Ejecución | Fila que se abre cuando el conector atiende `obtener_instrucciones` con un token válido y se cierra cuando guarda un informe para ella (función 011). |
| Ejecución abierta | Ejecución sin informe guardado. |
| Latido o señal | Apertura de una ejecución. Qué ejecuciones cuentan como señal se decide en la cuestión 5. |
| Último latido | Instante de apertura de la ejecución más reciente que cuente como señal. |
| F | Frecuencia esperada de revisión del cliente, en horas, la que figura en su ficha (`docs/INSTALACION-CLIENTE.md`, paso 7). |
| P | Plazo desde la apertura tras el cual una ejecución abierta genera alerta (cuestión 2). |
| M(F) | Tiempo sin latido tras el cual un cliente con frecuencia F genera alerta «sin señal» (cuestión 3). |
| I | Tiempo máximo entre dos cálculos completados en funcionamiento normal (cuestión 4). |
| U | Tiempo sin ningún cálculo completado a partir del cual hay que avisar a una persona (cuestión 19). |
| Cálculo | Cada pasada de la tarea periódica que abre y resuelve las alertas de esta función. |
| Alertas de esta función | Las de tipo `ejecucion_sin_informe` y `sin_senal`. |

## Requisitos

| ID | Requisito |
| --- | --- |
| REQ-001 | El último latido de un cliente se determina solo a partir de las ejecuciones de sus conexiones, según el criterio de señal de la cuestión 5 y el ámbito (cliente o conexión) de la cuestión 6. |
| REQ-002 | Una ejecución que sigue abierta cuando ha pasado P desde su apertura genera una alerta `ejecucion_sin_informe` para el cliente de esa ejecución. |
| REQ-003 | Un cliente cuyo último latido es más antiguo que M(F) genera una alerta `sin_senal`. |
| REQ-004 | Cada alerta de esta función se abre no antes del instante en que se cumple su condición y como tarde I después. |
| REQ-005 | Un cliente tiene como mucho una alerta abierta de cada tipo de esta función. Mientras haya una abierta, ni la persistencia de la condición ni otra ejecución abierta del mismo cliente abren otra. |
| REQ-006 | Cada alerta de esta función lleva la severidad que la cuestión 7 fije para su tipo y, si se decide escalado, la que corresponda al tiempo transcurrido. |
| REQ-007 | Las alertas de esta función se resuelven solo por las vías que decida la cuestión 8 y en las condiciones que esa cuestión fije. |
| REQ-008 | Toda alerta resuelta de esta función lleva el instante de resolución y deja constancia de si la resolvió el cálculo o una persona y, en ese caso, de qué persona. |
| REQ-009 | Para cada situación de la tabla «Situaciones del cliente», el cálculo abre, no abre o resuelve alertas según la regla decidida en la cuestión indicada. |
| REQ-010 | Las ejecuciones servidas con estado `pausada` o `suspendida` no esperan informe: no generan `ejecucion_sin_informe` ni cuentan como ejecuciones abiertas en REQ-021 (respuesta del responsable del 12/11/2026 a la cuestión 10). |
| REQ-011 | El cálculo usa la frecuencia esperada que figura en la ficha del cliente en el momento del cálculo. |
| REQ-012 | Todas las comparaciones de tiempo del cálculo son duraciones entre instantes medidos por el mismo reloj que fecha la apertura y el cierre de las ejecuciones. No dependen de la hora del agente, del huso del cliente, del huso o reloj del proceso que lanza el cálculo ni de los cambios de hora oficial. |
| REQ-013 | Una alerta de esta función contiene solo identificador, tipo, severidad, cliente, instante de apertura y datos de resolución. No contiene texto libre, cifras de informes ni ningún dato de correo (artículo 1). |
| REQ-014 | El cálculo solo usa: instantes de apertura y cierre de ejecuciones, su estado servido y su conexión; la frecuencia esperada y el estado del cliente; el estado de su licencia, de sus conexiones y de sus órdenes; la pausa global; y, si la cuestión 5 lo exige, el modo declarado en el informe. No usa cifras ni problemas de los informes, tokens ni códigos. |
| REQ-015 | El cliente de cada alerta se deriva de los datos de la ejecución o del cliente afectado. El cálculo no admite ninguna entrada que elija cliente, instante de referencia, tipo de alerta o plazo (artículo 2). |
| REQ-016 | El cálculo no abre, resuelve ni modifica alertas de tipos distintos de los de esta función. |
| REQ-017 | Las alertas de un cliente solo las leen los superadmin con doble factor y, si la cuestión 22 lo decide, los usuarios de ese mismo cliente. Nunca los usuarios de otro cliente (artículo 2). |
| REQ-018 | Solo el cálculo crea alertas de esta función. Ningún usuario de cliente ni el rol del conector crea, cambia, resuelve ni borra alertas. |
| REQ-019 | La identidad con la que se ejecuta el cálculo solo puede leer los datos de REQ-014 y escribir alertas de esta función. No puede modificar clientes, licencias, conexiones, tokens, códigos, órdenes, informes, versiones, publicaciones ni ajustes, ni ejecuciones salvo lo que decida la cuestión 15 (artículo 3). |
| REQ-020 | Abrir o resolver una alerta no cambia el estado servido, las instrucciones, las reglas ni las órdenes de ningún cliente. |
| REQ-021 | Un superadmin con doble factor puede obtener, por cliente, el instante del último latido, el de la última ejecución cerrada y el número de ejecuciones abiertas, con el mismo aislamiento que REQ-017. |
| REQ-022 | Cada cálculo deja constancia de su inicio, su fin, su resultado (completado o fallido) y el número de alertas abiertas y resueltas por tipo. La constancia no incluye nombres de clientes, valores recibidos ni datos de correo. |
| REQ-023 | Si pasa U sin ningún cálculo completado, sea porque no se lanza o porque falla, una persona recibe un aviso por el canal de la cuestión 19, que no depende de la propia tarea (artículo 10). |
| REQ-024 | Con el volumen de referencia V, cada cálculo termina en menos de D (cuestión 23) y no hace que `obtener_instrucciones` incumpla su objetivo de servicio vigente. |
| REQ-025 | Repetir el cálculo sobre los mismos datos no cambia las alertas que dejó el cálculo anterior. |
| REQ-026 | El cálculo se puede desactivar y volver a activar sin perder ni duplicar alertas. El primer cálculo tras la reactivación abre las que correspondan por lo ocurrido mientras estuvo desactivado (artículo 11). |

### Situaciones del cliente

| Situación | Regla |
| --- | --- |
| Cliente activo, licencia vigente, sin pausa | REQ-002 y REQ-003 sin excepciones |
| Pausa por orden `pausar` (entregada o confirmada) | Cuestión 11 |
| Pausa global activada | Cuestión 11 |
| Licencia suspendida, caducada o forzada a suspendida | Cuestión 12 |
| Licencia revocada o sin licencia no revocada | Cuestión 12 |
| Cliente de baja | Cuestión 12 |
| Cliente dado de alta sin ninguna conexión ni ejecución todavía | Cuestión 13 |
| Cliente con todas sus conexiones revocadas | Cuestión 13 |
| Ejecución abierta cuya conexión se revoca después de abrirla | Cuestión 13 |
| Cliente que entra en cualquiera de las situaciones anteriores con alertas abiertas | Cuestiones 11, 12 y 13, según la situación |

## Casos negativos

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-027 | Dos o más cálculos se ejecutan a la vez | El resultado es el mismo que con uno solo: ninguna alerta duplicada y ninguna perdida |
| REQ-028 | La base de datos deja de responder o se corta a mitad de un cálculo | Ninguna alerta queda resuelta sin que su condición haya dejado de cumplirse ni duplicada. El cálculo consta como fallido, cuenta para REQ-023 y el siguiente cálculo completo deja las alertas correctas |
| REQ-029 | Los datos de un cliente impiden calcular su situación | Se calculan los demás clientes. El fallo consta con el identificador del cliente y un código de error, sin valores |
| REQ-030 | Llamada al cálculo sin credencial, con credencial inválida o caducada, con la sesión de un usuario de dashboard, con el rol del conector o desde la API pública de la base de datos | Se rechaza sin calcular nada. La respuesta no revela número de alertas, clientes ni estado. Queda anotado sin valores recibidos |
| REQ-031 | Llamada autorizada con parámetros o campos de más (un cliente, un instante, un tipo, un plazo) | No cambian el alcance: el cálculo se hace sobre todos los clientes con el reloj del sistema, o la llamada se rechaza. Los valores recibidos no se registran |
| REQ-032 | La ejecución se cierra justo antes de vencer P mientras un cálculo está en marcha | No queda abierta ninguna alerta `ejecucion_sin_informe` cuya única causa sea una ejecución cerrada antes de vencer P |
| REQ-033 | El informe llega después de abrirse la alerta `ejecucion_sin_informe` | La ejecución consta cerrada y la alerta sigue la regla de la cuestión 8 |
| REQ-034 | El informe de una ejecución se rechaza por inválido | La ejecución sigue abierta a efectos de esta función y puede generar `ejecucion_sin_informe` |
| REQ-035 | Ejecución abierta en una conversación y abandonada por la persona | Se trata según la cuestión 14 y, en cualquier caso, cumple REQ-005 |
| REQ-036 | El superadmin cambia la frecuencia esperada de un cliente (a más o a menos) | El siguiente cálculo evalúa al cliente solo con la nueva frecuencia, con el periodo de gracia que decida la cuestión 16. Una alerta abierta con la frecuencia anterior sigue la regla de la cuestión 8 |
| REQ-037 | El conector o la base de datos de HumanaIA están caídos y muchos clientes pierden la señal a la vez | Se aplica lo que decida la cuestión 18. Ningún cliente que siga sin señal después de la recuperación queda sin alerta por ello |
| REQ-038 | Un usuario del cliente A pide alertas o latidos del cliente B, por tabla, por vista o por identificador | No obtiene ninguna fila y la respuesta no permite saber si existen |
| REQ-039 | Un superadmin sin doble factor intenta leer o resolver alertas | Se deniega |
| REQ-040 | El rol del conector, o una llamada con el token de un agente, intenta leer, crear o cambiar alertas | Se deniega |
| REQ-041 | El proceso que lanza el cálculo tiene otro huso horario o el reloj desplazado, o el periodo evaluado cruza un cambio de hora oficial | Ninguna alerta se adelanta ni se retrasa por ello |

## Criterios de aceptación

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | Criterio 4.º de la fase 2. En el entorno previo, con datos ficticios, una ejecución abierta y no cerrada genera exactamente una alerta `ejecucion_sin_informe` para su cliente, abierta no antes de P ni después de P + I desde la apertura (P de la cuestión 2, I de la cuestión 4). Se cumple en 3 de 3 repeticiones | REQ-002, REQ-004, REQ-005 |
| CA-002 | Prueba automática con reloj simulado para F = 1, 24 y 168 horas: un cliente sin latido recibe una alerta `sin_senal` no antes de M(F) ni después de M(F) + I (cuestión 3); un cliente con latido dentro de M(F) recibe 0 alertas. Incluye un caso con ejecuciones de dos conexiones del mismo cliente | REQ-001, REQ-003, REQ-004, REQ-011 |
| CA-003 | Prueba automática: con la condición mantenida durante 10 cálculos seguidos y 3 ejecuciones abiertas del mismo cliente, hay 1 alerta abierta por tipo; un 11.º cálculo sin cambios en los datos no modifica ninguna alerta | REQ-005, REQ-025 |
| CA-004 | El 100 % de las alertas generadas en las pruebas lleva la severidad de la tabla decidida en la cuestión 7, también en los casos de escalado si se decide | REQ-006 |
| CA-005 | Una prueba automática por cada vía de resolución decidida en la cuestión 8, incluido el informe tardío, todas en verde. El 100 % de las alertas resueltas lleva instante de resolución y constancia de quién la resolvió (cálculo o persona concreta) | REQ-007, REQ-008, REQ-033 |
| CA-006 | Una prueba automática por cada fila de «Situaciones del cliente» y por cada estado servido (`activa`, `pausada`, `suspendida`), todas en verde con la regla decidida en las cuestiones 10 a 13 | REQ-009, REQ-010 |
| CA-007 | Prueba automática con reloj simulado que cruza los dos cambios de hora oficial de 2027 en la España peninsular, y con el proceso que lanza el cálculo en otro huso y con el reloj desplazado una hora en cada sentido: las alertas abiertas y sus instantes coinciden con los del caso de referencia, con diferencia 0 | REQ-012, REQ-041 |
| CA-008 | Revisión de privacidad (skill `revision-privacidad`) de la estructura de las alertas, de la constancia de cada cálculo y de los registros de la tarea: 0 campos de texto libre añadidos, 0 cifras de informes, 0 nombres de clientes, 0 valores recibidos | REQ-013, REQ-014, REQ-022 |
| CA-009 | Prueba automática con la identidad del cálculo: el 100 % de los intentos de leer cifras o problemas de informes, tokens o códigos, y de escribir en tablas distintas de las alertas (y de las ejecuciones, solo si lo decide la cuestión 15), se deniega | REQ-014, REQ-019 |
| CA-010 | Pruebas pgTAP en CI con dos clientes A y B, cada uno con alertas abiertas y resueltas: un usuario de A lee 0 alertas y 0 latidos de B por tabla, vista e identificador; ningún usuario de cliente crea, cambia, resuelve ni borra alertas; un superadmin sin doble factor lee 0 y no resuelve ninguna; el rol del conector no lee ni escribe ninguna. Todas en verde. No se dan por superadas en local | REQ-017, REQ-018, REQ-038, REQ-039, REQ-040 |
| CA-011 | Prueba automática con cada tipo de llamada no autorizada de REQ-030: el 100 % se rechaza, 0 alertas cambian, la respuesta no contiene cifras ni identificadores y el registro no contiene valores recibidos | REQ-030 |
| CA-012 | Prueba automática: una llamada autorizada con un cliente, un instante, un tipo y un plazo de más deja las mismas alertas que una llamada sin ellos, o se rechaza; el registro no contiene esos valores | REQ-015, REQ-031 |
| CA-013 | Prueba automática: con alertas abiertas de otros tipos (`token_reutilizado`, `conexion_nueva`, `estado_error`), tras 10 cálculos siguen idénticas, con 0 cambios | REQ-016 |
| CA-014 | Prueba automática: la respuesta de `obtener_instrucciones` para un cliente es idéntica en estado, instrucciones, reglas y orden antes y después de abrirse y resolverse sus alertas | REQ-020 |
| CA-015 | Prueba automática: un superadmin con doble factor obtiene para el cliente A último latido, última ejecución cerrada y número de ejecuciones abiertas iguales a los datos preparados; un usuario de B obtiene 0 filas | REQ-021 |
| CA-016 | En 10 cálculos seguidos, uno de ellos forzado a fallar, el 100 % deja constancia de inicio, fin, resultado y recuentos por tipo, y el fallido consta como fallido | REQ-022 |
| CA-017 | En el entorno previo: con el cálculo detenido, y en otra prueba con el cálculo lanzándose pero fallando siempre, el aviso llega al canal de la cuestión 19 antes de U más la tolerancia fijada en esa cuestión. Con el cálculo funcionando durante 72 horas seguidas, 0 avisos | REQ-023 |
| CA-018 | En el entorno previo, con el volumen V de la cuestión 23: el cálculo termina en menos de D en 10 de 10 ejecuciones y, mientras se ejecuta, el 95 % de las llamadas a `obtener_instrucciones` responde dentro del objetivo vigente (hoy propuesto: menos de 1 segundo) | REQ-024 |
| CA-019 | En el entorno previo: el cálculo se desactiva durante al menos 2·I y se reactiva; 0 alertas perdidas, 0 duplicadas, y las condiciones cumplidas mientras estuvo desactivado tienen alerta tras el primer cálculo. La vuelta atrás del despliegue de esta función se ejecuta y deja las alertas existentes intactas | REQ-026 |
| CA-020 | Prueba automática: 20 rondas de 2 y de 5 cálculos simultáneos sobre los mismos datos dejan las mismas alertas que un cálculo único, con 0 duplicadas | REQ-027 |
| CA-021 | Prueba automática: con la conexión a la base de datos cortada a mitad de un cálculo, 0 alertas resueltas indebidamente y 0 duplicadas, el cálculo consta como fallido y el siguiente deja las alertas correctas. Con un cliente cuyos datos provocan un error, el resto de clientes recibe sus alertas y el fallo consta sin valores | REQ-028, REQ-029 |
| CA-022 | Prueba automática repetida 50 veces: una ejecución que se cierra en el último segundo antes de vencer P, a la vez que un cálculo, deja 0 alertas `ejecucion_sin_informe` abiertas por ella | REQ-032 |
| CA-023 | Prueba automática: un informe que llega tras abrirse la alerta cierra la ejecución y la alerta sigue la regla de la cuestión 8; un informe rechazado por inválido deja la ejecución abierta y genera la alerta en el plazo de CA-001 | REQ-033, REQ-034 |
| CA-024 | Prueba automática con ejecuciones abiertas y abandonadas en conversación, con y sin ejecuciones posteriores cerradas de la misma conexión, en verde con la regla de la cuestión 14 | REQ-035 |
| CA-025 | Prueba automática de cambio de frecuencia de 24 a 72 horas y de 72 a 24 horas: las alertas se abren o no según la nueva frecuencia y la gracia de la cuestión 16; 0 evaluaciones con la frecuencia anterior después del cambio | REQ-011, REQ-036 |
| CA-026 | Prueba automática que simula una caída del servicio de HumanaIA sin ejecuciones para ningún cliente durante más de M(F): el comportamiento coincide con la cuestión 18 y todo cliente que siga sin señal tras la recuperación tiene su alerta | REQ-037 |

## Fuera de alcance

- Las herramientas que abren y cierran las ejecuciones (función 011). Esta función usa su resultado.
- La estructura general de las tablas, sus migraciones y el RLS común (función 010). Esta función fija los requisitos de las alertas de sus tipos.
- Las alertas de seguridad de la autorización: `token_reutilizado`, `intentos_activacion`, `conexion_nueva`, `renovacion_fallida` (función 014).
- El prompt 1.3 y el arranque local, incluido qué hace el agente en pausa o suspendido (función 012).
- Las pantallas para ver y resolver alertas en el panel superadmin (fase 3) y cualquier vista para el cliente (fase 5).
- Las alertas `estado_error`, `version_antigua` y `orden_sin_confirmar`, el aviso fuera del panel, las métricas y los objetivos de servicio definitivos (fase 4). La detección de `sin_senal` y de `ejecucion_sin_informe` sí es de esta función (respuesta del responsable del 12/11/2026 a la cuestión 1).
- Las alertas `impago` y `gracia_vencida` (fase 6).
- Pausar, suspender o cambiar el agente de un cliente por una alerta.
- Avisar al cliente final.
- Plazos de conservación de alertas, ejecuciones y registros del cálculo (fase 6).
- La supervisión general de disponibilidad del conector. Aquí solo se vigila el propio cálculo (REQ-023).
- Elegir el mecanismo de la tarea periódica: es del diseño.

## Cuestiones abiertas

1. **Reparto con la fase 4.** El plan pone en la fase 2 «latido de ejecuciones» y el criterio «una ejecución sin informe genera alerta», y en la fase 4 las alertas «sin señal» y «ejecución sin informe». Opciones: (a) la 013 hace la detección completa de los dos tipos y la fase 4 solo añade el aviso fuera del panel y las métricas: la fase 2 crece, pero la fase 4 no reescribe nada; (b) la 013 solo hace `ejecucion_sin_informe` y `sin_senal` pasa a la fase 4: la fase 2 es menor, pero no hay detección de agentes muertos hasta la fase 4; (c) la 013 hace los dos tipos con valores provisionales y la fase 4 fija los definitivos con datos reales: no se pierde detección, pero hay que volver a aprobar los valores. **Respondida el 12/11/2026 en cuanto al reparto:** la 013 detecta los dos tipos en la fase 2. Si sus valores son provisionales se decide con las cuestiones 2 a 4.
2. **Plazo P de «ejecución sin informe».** Es «el plazo previsto» del criterio 4.º de la fase 2. Opciones: (a) una duración fija igual para todos: simple, pero tiene que superar la revisión más larga y, con frecuencias de 1 hora, puede vencer después de que empiece la siguiente revisión; (b) relativa a la frecuencia F del cliente: se adapta, pero para frecuencias largas detecta tarde; (c) la menor de una fija y una relativa: más ajustada, más difícil de explicar. Falta además el dato de cuánto dura una revisión real, que sale de la fase 1.
3. **Margen M(F) de «sin señal».** La arquitectura propone detectar antes de 2·F, sin aprobar, y dice que los objetivos se fijan en la fase 4. Opciones: (a) múltiplo de F, como 2·F: con F = 168 horas tarda dos semanas; (b) F más una holgura fija: detecta antes en frecuencias largas y da más falsas alarmas en las cortas; (c) mixta, con un tope máximo: acota la detección, más parámetros que mantener. En todos los casos hay que decidir si el valor se fija ya o es provisional hasta la fase 4.
4. **Intervalo I del cálculo.** Es el retraso máximo de detección sobre P y M(F). Opciones: (a) corto, de minutos: detección rápida, más ejecuciones y más coste; (b) largo, de una hora o más: menos carga, pero una alerta puede llegar hasta I tarde. Condiciona también U (cuestión 19).
5. **Qué cuenta como señal.** Opciones: (a) cualquier ejecución abierta, también en conversación y en estado `pausada` o `suspendida`: lo más simple, pero una revisión manual en conversación oculta que la tarea programada está muerta; (b) solo ejecuciones cerradas con informe: un agente que abre y nunca cierra cuenta como sin señal; (c) solo ejecuciones cuyo informe dice `desatendido`: detecta la tarea programada muerta, pero exige informe y el modo solo se conoce al cerrarse.
6. **Ámbito de «sin señal»: cliente o conexión.** Un cliente puede tener varias conexiones (por ejemplo, Claude programado y ChatGPT en conversación, o la antigua y la nueva durante un cambio de asistente). Opciones: (a) por cliente: basta una conexión viva, como admite hoy el modelo; (b) por conexión: detecta una conexión muerta aunque otra viva, pero el modelo de alertas no tiene conexión y habría que cambiarlo.
7. **Severidad de cada tipo.** La lista cerrada es `info`, `aviso`, `critica`. Opciones: (a) una fija por tipo (por ejemplo, las dos en `aviso`, o `sin_senal` en `critica`): simple; (b) escalado con el tiempo, por ejemplo `aviso` al vencer y `critica` al doble: refleja la gravedad, pero cambia una alerta abierta o abre otra, y eso choca con REQ-005 tal como está.
8. **Resolución.** Opciones: (a) automática cuando la condición deja de cumplirse (llega el informe, vuelve la señal): sin ruido, pero un fallo breve se cierra solo y en la fase 2 nadie lo habrá visto; (b) solo manual, por un superadmin: nada se cierra sin que alguien lo vea, pero hasta la fase 3 no hay pantalla y se acumulan; (c) automática con constancia de que la cerró el cálculo, y manual también permitida. Hay que decidir también si una alerta resuelta a mano vuelve a abrirse mientras su causa sigue presente (la misma ejecución sigue abierta, el cliente sigue sin señal). Si no debe volver a abrirse, el modelo tiene que poder distinguir la causa ya alertada.
9. **Una misma causa, dos alertas.** Si un agente abre una ejecución y muere, primero vence P y después M(F). Opciones: (a) se abren las dos: completo, pero duplica el aviso de un único fallo; (b) si hay `ejecucion_sin_informe` abierta, no se abre `sin_senal`: menos ruido, pero se pierde la escalada a «agente muerto»; (c) `sin_senal` sustituye a la otra: un solo aviso, cambia la resolución de la primera.
10. **¿Se espera informe en ejecuciones servidas como `pausada` o `suspendida`?** El informe admite el estado `pausado` pero ninguno equivalente a suspendido. Opciones: (a) se espera en las dos: cada revisión de un cliente suspendido que no informe genera alerta; (b) solo en `pausada`; (c) en ninguna: esas ejecuciones no generan `ejecucion_sin_informe`. Depende de lo que el prompt (función 012) mande hacer al agente. **Respondida el 12/11/2026:** opción (c), en ninguna. Aplicada en REQ-010.
11. **Clientes en pausa (por orden o por pausa global).** Opciones: (a) mismas reglas que un cliente activo: si el agente sigue pidiendo instrucciones, no hay alerta, y si deja de hacerlo, sí; (b) sin `sin_senal` mientras dure la pausa: no hay ruido, pero no se sabe si el agente seguirá vivo al reanudar; (c) con otro margen. Hay que decidir también qué pasa con las alertas abiertas al entrar en pausa.
12. **Clientes con licencia suspendida, licencia revocada o de baja.** Opciones por cada situación: (a) alertas como un cliente activo; (b) sin alertas nuevas y las abiertas se resuelven solas; (c) sin alertas nuevas y las abiertas siguen hasta que las cierre una persona. Con la licencia revocada el agente ya no puede abrir ejecuciones, así que con la opción (a) daría siempre `sin_senal`.
13. **Clientes recién dados de alta, sin conexiones vivas o con una ejecución abierta de una conexión revocada después.** Opciones para el alta: (a) sin `sin_senal` hasta la primera ejecución: una instalación que nunca se completa pasa desapercibida; (b) `sin_senal` si no hay señal en M(F) desde la creación del cliente o de su licencia: detecta instalaciones fallidas, con alertas durante la instalación; (c) un plazo de instalación distinto. Para todas las conexiones revocadas: igual que alta, o igual que activo. Para la ejecución de una conexión revocada después de abrirla: (a) genera `ejecucion_sin_informe`; (b) no, porque el informe ya no puede llegar.
14. **Ejecuciones abiertas en conversación y abandonadas.** El modo solo se conoce al llegar el informe, así que no se distinguen de una revisión programada que falla. Opciones: (a) se tratan igual; (b) no generan alerta si después hay una ejecución cerrada de la misma conexión: menos ruido, pero oculta un fallo intermitente; (c) generan alerta con menor severidad, lo que exige poder distinguirlas.
15. **¿Las ejecuciones abandonadas se dejan abiertas para siempre o se marcan?** Opciones: (a) se quedan abiertas: el modelo no cambia y un informe que llegue meses después todavía las cierra; (b) esta función las marca como caducadas pasado un tiempo: la tarea necesitaría escribir en las ejecuciones, que son de las funciones 010 y 011, y un informe tardío tendría que rechazarse o aceptarse de forma explícita.
16. **Gracia tras un cambio de frecuencia.** Opciones: (a) sin gracia: al bajar de 72 a 24 horas puede abrirse `sin_senal` en el cálculo siguiente; (b) gracia de un periodo de la nueva frecuencia desde el cambio: evita la falsa alarma, pero hay que guardar cuándo se cambió, y el modelo hoy no lo guarda.
17. **Frecuencias que no caben en «cada N horas» y frecuencia del informe.** Una revisión programada solo en días laborables da una falsa alerta cada lunes con F = 24 horas. Opciones: (a) asumirlo y que el margen lo cubra; (b) que el instalador anote como F el hueco más largo (72 horas): sin falsas alertas, pero detección más lenta entre semana; (c) ampliar la ficha con un calendario: cambia el modelo. Además, el informe trae su propia `frecuencia_horas`. ¿Se ignora, sustituye a la de la ficha, o una discrepancia debe avisar? Este último caso necesitaría un tipo de alerta nuevo.
18. **Caída del servicio de HumanaIA.** Si el conector o la base de datos caen más de M(F), todos los clientes pierden la señal a la vez. Opciones: (a) se abren todas las alertas como si fuera culpa de cada agente: muchas alertas a la vez, fáciles de reconocer; (b) no se abren por el tiempo en que el servicio estuvo caído: hace falta saber cuándo lo estuvo; (c) se abren, pero se marca que coinciden con una caída: hace falta un dato que el modelo no tiene.
19. **Quién vigila el cálculo, por qué canal y con qué umbral U.** En la fase 2 no hay panel ni aviso por correo (V-111 es de la fase 4). Opciones: (a) la supervisión de errores de V-112 (fase 1): ya prevista, pero detecta fallos, no la falta de ejecuciones; (b) un servicio externo que espera un latido del propio cálculo: detecta las dos cosas, pero es un proveedor nuevo con sus datos; (c) adelantar el aviso por correo de V-111 a la fase 2; (d) una alerta en la propia tabla de alertas: inútil si nadie la mira y si el cálculo no se ejecuta, porque no se crearía. Hay que fijar también U y la tolerancia de llegada del aviso.
20. **¿Alguien puede lanzar el cálculo a mano?** Opciones: (a) nadie, solo su programación: menos superficie de ataque; (b) un superadmin con doble factor, desde el panel en la fase 3: útil para comprobar, pero es otra vía de entrada que proteger y auditar; (c) solo una persona con acceso a la plataforma de despliegue.
21. **Cómo se comprueba una alerta en la fase 2, sin panel.** Opciones: (a) pruebas automáticas y una consulta directa en el entorno previo, con datos ficticios, por una persona superadmin: no hace falta pantalla, pero la comprobación es técnica; (b) una vista mínima de solo lectura: más fácil de comprobar, pero adelanta parte de la fase 3; (c) dejar el criterio 4.º para cuando haya panel: la fase 2 no podría cerrarse con él.
22. **¿Los usuarios de un cliente ven sus propias alertas y su latido?** Hoy el modelo solo deja leer alertas a los superadmin. La fase 5 muestra «estado del agente». Opciones: (a) no ven alertas, solo la última revisión: menos información interna expuesta; (b) ven las suyas: más transparencia, pero hay que añadir y probar una política nueva.
23. **Volumen de referencia V y duración máxima D del cálculo.** CA-018 los necesita. Hay que fijar cuántos clientes y ejecuciones abiertas se toman como referencia (los actuales, el objetivo a un año) y cuánto puede tardar un cálculo. D debe ser menor que I. **Respondida en parte el 12/11/2026:** 10 clientes como referencia inicial para V. Sigue abierta la duración máxima D.

## Dependencias y decisiones relacionadas

- Funciones: 010 (tablas `clientes`, `ejecuciones`, `informes` y `alertas` y su RLS), 011 (apertura y cierre de ejecuciones), 012 (comportamiento del agente en pausa y suspensión, envío del informe).
- Supuestos sobre la 011, tomados de `docs/MODELO-DATOS.sql`: se abre una ejecución en cada `obtener_instrucciones` autorizado, con cualquiera de los tres estados servidos; se cierra solo cuando se guarda un informe; un informe inválido no la cierra; una petición con token inválido no abre ninguna. Si la 011 cambia algo de esto, esta especificación se revisa.
- Modelo de referencia: `clientes.frecuencia_esperada_horas`, `ejecuciones`, `alertas`, tipos `tipo_alerta` y `severidad`, funciones `privado.mcp_obtener_instrucciones` y `privado.mcp_enviar_informe`.
- Decisiones: T-003, T-005, T-006, D-013, D-015, V-111, V-112.
- ADR: 0003.
- Documentos: `docs/ARQUITECTURA.md` (pieza «Tarea periódica», fallos previstos, objetivos de servicio), `docs/INSTALACION-CLIENTE.md` (paso 7), `docs/SEGURIDAD.md`.
- Constitución: artículos 1 (REQ-013, REQ-014, REQ-022), 2 (REQ-015, REQ-017, REQ-018, REQ-038), 3 (REQ-019, REQ-028, REQ-030, REQ-039, REQ-040), 10 (REQ-022 a REQ-024) y 11 (REQ-026).
- Cambios propuestos a documentos compartidos: `specs/013-latido-alertas/propuestas.md`.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
