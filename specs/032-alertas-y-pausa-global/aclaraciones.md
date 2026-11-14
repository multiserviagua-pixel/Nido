# 032 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 4. **Ninguna tiene respuesta todavía.** La columna «Recomendación» es del orquestador y no es una decisión.

## Cuestión previa, añadida por el orquestador

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 0 | **Reparto con la fase 2.** La fase 2 ha especificado en su función 013 la detección de «sin señal» y «ejecución sin informe» y la vigilancia del cálculo, y sitúa «conexión nueva» en su función 014. La 032 exige lo mismo. La 013 pregunta lo mismo en su cuestión 1 | **A.** La fase 2 detecta esos tres tipos. La 032 detecta estado `error`, versión antigua y orden sin confirmar, y entrega el centro de alertas, los avisos fuera del panel, el aviso agregado y la pausa global; además comprueba los seis tipos de extremo a extremo. **B.** La fase 2 solo hace «ejecución sin informe» y el resto pasa a la 032: no hay detección de agentes parados hasta la fase 4. **C.** Las dos lo especifican y se reconcilia en el diseño: riesgo de hacerlo dos veces | **A.** La detección queda donde nacen los datos y la fase 4 no reescribe nada. Con A, los requisitos REQ-002 a REQ-004, REQ-008 y REQ-052 a REQ-054 de la 032 pasan a ser dependencias que esta función comprueba. Una sola respuesta vale para la 013 y para la 032 |

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 1 | Plazos | Sin señal: **A.** al pasar 1,5 veces la frecuencia acordada (se detecta antes de 2 veces, como propone la arquitectura); **B.** al pasar 2 veces: menos falsas alarmas, detección más tardía. Ejecución sin informe: 2 horas desde que se abre, o relativo a la frecuencia. Orden sin confirmar: desde la entrega al agente o desde la creación | Sin señal a 1,5 veces la frecuencia acordada. Ejecución sin informe a las 2 horas. Orden sin confirmar a las 2 horas de entregada (si no llega a entregarse, lo cubre «sin señal»). Retraso máximo de 15 minutos para abrir y resolver. Son las mismas preguntas que las cuestiones 2, 3 y 4 de la 013: una sola respuesta |
| 2 | Severidades | **A.** Tres niveles. Los seis tipos en `aviso`, salvo conexión nueva, que es `info` si es la primera conexión del cliente y `aviso` si ya tenía otra activa; las alertas generales (cálculo detenido, fallo masivo), `critica`. **B.** Sin señal y estado `error` en `critica`: avisos inmediatos, más ruido | **A** |
| 3 | Aviso fuera del panel | **A.** `critica`, de inmediato; `aviso`, en un resumen diario; `info`, nunca. Mismos destinatarios y mismo canal que el aviso de publicación de la función 030. Tres reintentos y, si fallan, se ve en el panel. **B.** Todo de inmediato: más ruido. **C.** Solo `critica`: lo demás solo se ve entrando al panel | **A**, con el resumen a las 8:00, hora de Madrid |
| 4 | Nombre del cliente en el aviso | **A.** Sin nombre: tipo, severidad, número de alertas y enlace al panel. **B.** Con nombre comercial: más cómodo, pero el nombre de un autónomo es un dato personal y saldría hacia un tercero y hacia un buzón | **A** |
| 6 | Quién activa y quién levanta la pausa global | **A.** La activa cualquier superadmin con doble factor; la levanta quien pueda publicar en `estable` (cuestión 3 de la 030). **B.** Las dos cosas, cualquier superadmin. **C.** Las dos cosas, solo el responsable: el freno de emergencia dependería de una sola persona | **A**, con motivo de una lista cerrada (incidente de seguridad, versión defectuosa, mantenimiento, simulacro, otro) |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 5 | Resolución | Se resuelven solas: sin señal, ejecución sin informe, estado `error`, versión antigua y orden sin confirmar. Solo a mano: conexión nueva y las alertas de seguridad de otras fases. Sin silenciar y sin resolver varias a la vez | Una alerta de seguridad nunca se cierra sin que alguien la vea |
| 7 | Qué es señal | Cualquier petición de instrucciones autenticada, también en conversación | Simple y no depende del informe. La ficha del cliente debería mostrar el último informe desatendido. Misma pregunta que la cuestión 5 de la 013 |
| 8 | Varias conexiones | Sin señal se evalúa por cliente; el detalle dice qué conexiones callan | Menos ruido en un cambio de asistente. Misma pregunta que la cuestión 6 de la 013 |
| 9 | Estado `aviso` repetido | No abre alerta; se ve en la ficha y en las métricas. Se revisa tras el piloto | Se mantienen los seis tipos del plan |
| 10 | Excepciones a la pausa global | Ninguna | El freno de emergencia no tiene casos especiales |
| 11 | Órdenes durante la pausa global | Se entregan y se confirman como siempre; manda el estado servido | Una orden `reanudar` no levanta la pausa global. Afecta al modelo de la fase 2: va en `propuestas.md` |
| 12 | Informe en pausa | Con `pausada` el agente informa `pausado`; con `suspendida` no informa y esa ejecución no abre alerta | Lo decide la fase 2 (cuestiones 13 de la 012 y 10 de la 013) |
| 13 | Clientes que dejan de estar activos | Sus alertas de funcionamiento se resuelven solas; las de seguridad siguen hasta que alguien las cierre | — |
| 14 | Fallo masivo | Si la misma condición afecta en un mismo cálculo al 25 % de los clientes con licencia vigente, y al menos a 3: una alerta general y un solo aviso | Misma pregunta que la cuestión 18 de la 013 |
| 15 | Alerta intermitente | Como mucho un aviso por cliente y tipo cada 24 horas | — |
| 16 | Cálculo detenido | Aviso si pasa 1 hora sin un cálculo con éxito, a los mismos destinatarios | Misma pregunta que la cuestión 19 de la 013 |
| 17 | Frecuencia declarada distinta de la acordada | No abre alerta; se muestra en la ficha del cliente | Misma pregunta que la cuestión 17 de la 013 |
| 18 | Versión antigua | Se compara solo con la versión servida en esa ejecución | Una publicación a mitad de una revisión no da falsas alertas |
| 19 | Destinatarios | En la configuración del entorno, no en el panel | Igual que el aviso de publicación de la 030 (A-11) |
| 20 | Rendimiento | Primera página en menos de 2 segundos en el 95 % de las cargas, con 10 000 alertas guardadas y 500 abiertas | — |
| 21 | Conservación | Se conservan todas hasta que la fase 6 fije plazos | — |
| 22 | Agente en pausa global en conversación | Igual que en una pausa por orden: no hay instrucciones | Depende de D-013 y de la cuestión 4 de la función 001; no se decide aquí |
| 23 | Objetivos de servicio | Se miden y se proponen en la función 033, con los datos del piloto; los fija el responsable al cerrar la fase | Reparto del orquestador; no cambia requisitos de la 032 |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 0 | Reparto con la fase 2 | Sin respuesta | — | Pendiente (REQ-002 a REQ-004, REQ-008, REQ-052 a REQ-054) |
| 1 | Plazos | Sin respuesta | — | Pendiente (REQ-002, REQ-004, REQ-007, REQ-010, REQ-012) |
| 2 | Severidades | Sin respuesta | — | Pendiente (REQ-009) |
| 3 | Aviso fuera del panel | Sin respuesta | — | Pendiente (REQ-020, REQ-029, REQ-056) |
| 4 | Nombre del cliente en el aviso | Sin respuesta | — | Pendiente (REQ-021, REQ-066) |
| 5 | Resolución | Sin respuesta | — | Pendiente (REQ-012) |
| 6 | Pausa global: quién | Sin respuesta | — | Pendiente (REQ-023, REQ-026, REQ-039) |
| 7 | Qué es señal | Sin respuesta | — | Pendiente (REQ-002) |
| 8 | Varias conexiones | Sin respuesta | — | Pendiente (REQ-003, CA-002) |
| 9 | Estado `aviso` repetido | Sin respuesta | — | Pendiente |
| 10 | Excepciones a la pausa global | Sin respuesta | — | Pendiente (REQ-024) |
| 11 | Órdenes durante la pausa global | Sin respuesta | — | Pendiente (REQ-007) |
| 12 | Informe en pausa | Sin respuesta | — | Pendiente (REQ-004) |
| 13 | Clientes que dejan de estar activos | Sin respuesta | — | Pendiente (REQ-047) |
| 14 | Fallo masivo | Sin respuesta | — | Pendiente (REQ-051, CA-023) |
| 15 | Alerta intermitente | Sin respuesta | — | Pendiente (REQ-055) |
| 16 | Cálculo detenido | Sin respuesta | — | Pendiente (REQ-054, CA-024) |
| 17 | Frecuencia declarada distinta de la acordada | Sin respuesta | — | Pendiente |
| 18 | Versión antigua | Sin respuesta | — | Pendiente (REQ-006, REQ-050) |
| 19 | Destinatarios | Sin respuesta | — | Pendiente (REQ-020) |
| 20 | Rendimiento | Sin respuesta | — | Pendiente (REQ-034, CA-033) |
| 21 | Conservación | Sin respuesta | — | Pendiente |
| 22 | Agente en pausa global en conversación | Sin respuesta | — | Pendiente (dependencia de la función 001) |
| 23 | Objetivos de servicio | Sin respuesta | — | Pendiente |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Ninguna todavía. Cuando haya respuesta, se pasan a coordinación por `propuestas.md`: este chat no edita el registro de decisiones.
