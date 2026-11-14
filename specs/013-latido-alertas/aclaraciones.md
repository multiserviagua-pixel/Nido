# 013 · Aclaraciones

Cuestiones presentadas al responsable el 12/11/2026. **Tienen respuesta las n.º 1 y 10 y, en parte, la n.º 23; las demás siguen abiertas.** Una respuesta supuesta no vale: mientras la columna «Respuesta» esté vacía, la cuestión sigue abierta y la función sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`, donde están las opciones y la consecuencia de cada una. La columna «Recomendación» es del orquestador; no es una decisión.

Los valores numéricos recomendados son provisionales: la fase 1 dirá cuánto dura una revisión real y la fase 4 los fija con datos de clientes.

Tipos:

- **R**: la decide el responsable ahora (puerta P0).
- **D**: es del diseño. Se lleva en la puerta P1.

| N.º | Cuestión | Tipo | Recomendación del orquestador | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Reparto con la fase 4 | R | La 013 detecta los dos tipos (`ejecucion_sin_informe` y `sin_senal`) con valores provisionales. La fase 4 añade el aviso fuera del panel, los demás tipos y los valores definitivos. Así hay detección de agentes parados desde la fase 2 y la fase 4 no reescribe nada | A la pregunta «¿La fase 2 detecta ya "sin señal" además de "ejecución sin informe"?»: «Sí, en la fase 2» | Responsable, 12/11/2026 | Respondida en cuanto al reparto. REQ-003 (alerta `sin_senal`) queda firme en esta función y «Fuera de alcance» ya no remite a esta cuestión. Si los valores son provisionales se decide con los n.º 2 a 4. El cambio en `docs/PLAN.md` va a coordinación (propuesta 1) |
| 2 | Plazo P de «ejecución sin informe» | R | Fijo e igual para todos: 2 horas | | | |
| 3 | Margen M(F) de «sin señal» | R | El menor de 2 veces la frecuencia y la frecuencia más 24 horas. Con revisión diaria son 48 horas; con semanal, 8 días en vez de 14 | | | |
| 4 | Intervalo I entre cálculos | R | Una hora. Con plazos de horas y días no hacen falta minutos | | | |
| 5 | Qué cuenta como señal | R | Cualquier ejecución abierta. Es lo más simple; el caso de la tarea programada parada y tapada por revisiones en conversación se revisa en la fase 4 | | | |
| 6 | «Sin señal» por cliente o por conexión | R | Por cliente. Es lo que admite el modelo | | | |
| 7 | Severidad de cada tipo | R | Fija y sin escalado: las dos en `aviso`. `critica` se reserva para las alertas de seguridad de la 014 | | | |
| 8 | Resolución | R | Automática cuando la condición deja de cumplirse, con constancia de que la cerró el cálculo; también manual por un superadmin. Una alerta cerrada a mano no vuelve a abrirse por la misma causa | | | |
| 9 | Una misma causa, dos alertas | R | Se abren las dos. Dicen cosas distintas (una revisión a medias y un agente parado) y el caso es raro | | | |
| 10 | Informe esperado en ejecuciones servidas como `pausada` o `suspendida` | R | En ninguna: no generan `ejecucion_sin_informe`. Va unida al n.º 13 de la 012 | A la pregunta «¿En pausa y en suspensión el agente no envía informe?»: «Sí, sin informe» | Responsable, 12/11/2026 | Respondida. REQ-010 dice que esas ejecuciones no esperan informe ni generan la alerta |
| 11 | Clientes en pausa | R | Las mismas reglas que un cliente activo: en pausa el agente sigue pidiendo instrucciones, y si deja de hacerlo conviene saberlo antes de reanudar | | | |
| 12 | Licencia suspendida o revocada, y cliente de baja | R | Sin alertas nuevas en los tres casos, y las abiertas se resuelven solas | | | |
| 13 | Alta reciente, conexiones revocadas, ejecución de una conexión revocada después | R | Sin `sin_senal` hasta la primera ejecución: la instalación la hace una persona, que comprueba el resultado (paso 8 de la guía). Con todas las conexiones revocadas, igual que un alta. La ejecución de una conexión revocada después no genera alerta | | | |
| 14 | Ejecuciones abiertas en conversación y abandonadas | R | Se tratan igual que las demás | | | |
| 15 | Ejecuciones abandonadas: abiertas para siempre o marcadas | R | Se quedan abiertas. El modelo no cambia y el cálculo no escribe en las ejecuciones | | | |
| 16 | Gracia tras un cambio de frecuencia | R | Sin gracia. Es una operación rara y quien cambia la frecuencia está mirando al cliente | | | |
| 17 | Frecuencias irregulares y la frecuencia que declara el informe | R | El instalador anota como frecuencia el hueco más largo entre revisiones (72 horas si solo hay revisión en días laborables). La frecuencia del informe se ignora para las alertas. Va unida al n.º 6 de la 012 | | | |
| 18 | Caída del servicio de HumanaIA | R | Se abren todas las alertas. Un pico simultáneo en todos los clientes se reconoce a simple vista | | | |
| 19 | Quién vigila el cálculo, por qué canal y con qué umbral U | D | Requisito firme: si pasan 3 horas sin un cálculo completado, se avisa a una persona por un canal que no dependa de la propia tarea. El canal se elige en el diseño: la supervisión de errores de V-112 si vigila también ejecuciones que no llegan; si no, hace falta otra verificación | | | |
| 20 | Si alguien puede lanzar el cálculo a mano | R | Nadie desde el panel. Solo su programación y, en una incidencia, una persona con acceso a la plataforma de despliegue | | | |
| 21 | Cómo se comprueba una alerta en la fase 2, sin panel | R | Pruebas automáticas y una consulta directa en el entorno previo, con datos ficticios | | | |
| 22 | Si los usuarios de un cliente ven sus alertas y su latido | R | No ven alertas. La fase 5 decide qué enseña del estado del agente | | | |
| 23 | Volumen de referencia V y duración máxima D del cálculo | R | El mismo volumen que la 010 (50 clientes con revisión diaria) y un máximo de 60 segundos por cálculo | «no esta definido, toma 10 como referencia inicial» (dicha sobre la previsión de clientes a un año) | Responsable, 12/11/2026 | Respondida en parte. El volumen V toma 10 clientes como referencia. Sigue abierta la duración máxima D |

## Decisiones que salen de aquí

Pendiente de las respuestas. Los valores de P, M(F) e I deberían quedar en `docs/ARQUITECTURA.md` («Objetivos de servicio») como provisionales; se le pasan al chat de coordinación por `propuestas.md`.
