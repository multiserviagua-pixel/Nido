# 031 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 4. **Ninguna tiene respuesta todavía.** La columna «Recomendación» es del orquestador y no es una decisión.

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 7 | Qué significan `sin_tratar`, `facturas_pendientes` y `borradores` | **A.** Son lo de esa revisión (lo que quedó sin tratar, las facturas que no pudo descargar, los borradores que creó): se pueden sumar y promediar. **B.** Son lo pendiente acumulado en la cuenta: sumarlos entre revisiones daría cifras falsas y habría que mostrar el último valor de cada cliente. El prompt 1.2 no lo deja claro y el contrato tampoco | **A**, y que el prompt 1.3 y el contrato lo digan expresamente (propuesta a la fase 2 y a coordinación). Con A se muestran total y media por revisión. Solo el responsable, que conoce el prompt, puede confirmarlo |
| 12 | Si las métricas son peores, ¿se impide promover o solo se advierte? | **A.** Solo advierte; decide la persona, y promover con un veredicto «peor» o «datos insuficientes» exige marcarlo expresamente y queda en auditoría y en el aviso. **B.** Se impide: más garantía, pero con pocos clientes en prueba una sola revisión mala bloquea, y no habría salida sin excepción | **A**. Es la misma decisión que la cuestión 13 de la 030: una sola respuesta |
| 3 | Revisiones en conversación | **A.** Todas cuentan en las cifras, pero la comparación entre `prueba` y `estable` usa solo las desatendidas; se puede filtrar por modo y por asistente. **B.** Todas cuentan igual: más datos, pero una revisión guiada por una persona no dice cómo se comporta el agente solo | **A** |
| 9, 10 y 11 | Reglas de la comparación | Ventana: la versión de `prueba` desde su publicación frente a la de `estable` en esos mismos días, cada una con los clientes de su canal. Margen de «no peor». Mínimo para comparar | Misma ventana para las dos. «No peor» si la proporción en `error` no sube más de 2 puntos, la de `aviso` no más de 5 puntos y los correos sin tratar por revisión no más de un 10 %. Código nuevo que se repite: no aparece en `estable` en la ventana y sale en 3 revisiones o en 2 clientes de `prueba`. Mínimo: 10 revisiones desatendidas y 2 clientes distintos en cada versión, igual que la permanencia de la 030. Son valores de partida, a revisar tras el piloto |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 1 | Periodos | Últimos 7, 30 (por defecto) y 90 días, y «desde su publicación». Sin rango libre | Menos entradas que validar |
| 2 | Zona horaria | Hora de Madrid | Coincide con `docs/DISENO.md` y con la fase 3 |
| 4 | Informes `pausado` y ejecuciones sin versión servida | Los `pausado` se cuentan en el reparto por estado y no entran en proporciones ni medias. Los de ejecuciones sin versión servida se agrupan aparte | Una pausa no empeora ni mejora una versión |
| 5 | Versión declarada distinta de la servida | Se cuenta en la declarada (ADR-0005), se muestra como discrepancia y no entra en la comparación. Además es la alerta «versión antigua» de la 032 | — |
| 6 | Versiones no registradas y equivalencia | Un grupo «versión no registrada», desglosado por número. Sin equivalencias: 1.3, 1.3.0 y 01.3 son distintas | Depende de la cuestión 14 de la 030 |
| 8 | Ponderación | Por revisión, mostrando cuánto aporta el cliente que más aporta | Coincide con la skill `version-prompt`, que habla de proporción de revisiones |
| 13 | Exportación | No | Menos vías de salida de datos |
| 14 | Rendimiento | Menos de 2 segundos en el 95 % de las cargas, con 300 000 informes (unos 200 clientes, 4 revisiones al día, un año) | Si el responsable espera otro volumen, se ajusta |
| 15 | Actualidad | 5 minutos como máximo | — |
| 16 | Bajas y cambios de canal | Los informes ya recibidos siguen contando en sus periodos; la pantalla lo dice | Las cifras de un periodo pasado no cambian. El borrado es de la fase 6 |
| 17 | Desglose por cliente | Sí, dentro del panel y solo para superadmin con doble factor, para poder contrastar una cifra | Cumple el artículo 13. El nombre comercial ya es visible para el superadmin en el panel |
| 18 | Otras cifras | Sí: documentos, urgentes, comprobaciones fallidas, informes con campos descartados y ejecuciones sin informe por versión servida | Los campos descartados son una señal de privacidad de una versión |
| 19 | Objetivo de servicio del conector | Lo mide y lo propone la función 033; esta función lo hereda | Reparto del orquestador |
| 20 | Gráficos | La tabla por versión, la comparación y un gráfico de evolución diaria de los estados de las dos versiones vigentes, con su tabla equivalente | — |
| 21 | Auditoría de consultas | No; solo las acciones que cambian algo | Coincide con el criterio de la fase 3 |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Periodos | Sin respuesta | — | Pendiente (REQ-007) |
| 2 | Zona horaria | Sin respuesta | — | Pendiente (REQ-006, REQ-049) |
| 3 | Conversación y desatendido | Sin respuesta | — | Pendiente (REQ-014) |
| 4 | `pausado` y ejecuciones sin versión servida | Sin respuesta | — | Pendiente (REQ-005, REQ-010, REQ-011) |
| 5 | Versión declarada distinta de la servida | Sin respuesta | — | Pendiente (REQ-004) |
| 6 | Versiones no registradas y equivalencia | Sin respuesta | — | Pendiente (REQ-002, REQ-003, REQ-050) |
| 7 | Cifras que son pendientes acumulados | Sin respuesta | — | Pendiente (REQ-011) |
| 8 | Ponderación | Sin respuesta | — | Pendiente (REQ-017, REQ-046) |
| 9 | Ventana y población de la comparación | Sin respuesta | — | Pendiente (REQ-017) |
| 10 | Margen y códigos nuevos | Sin respuesta | — | Pendiente (REQ-018) |
| 11 | Mínimo para comparar | Sin respuesta | — | Pendiente (REQ-019) |
| 12 | Bloquear o advertir | Sin respuesta | — | Pendiente (REQ-022, CA-011) |
| 13 | Exportación | Sin respuesta | — | Pendiente |
| 14 | Rendimiento | Sin respuesta | — | Pendiente (REQ-025, CA-014) |
| 15 | Actualidad | Sin respuesta | — | Pendiente (REQ-024, CA-013) |
| 16 | Bajas y cambios de canal | Sin respuesta | — | Pendiente (REQ-047) |
| 17 | Desglose por cliente | Sin respuesta | — | Pendiente (REQ-035) |
| 18 | Otras cifras | Sin respuesta | — | Pendiente |
| 19 | Objetivo de servicio del conector | Sin respuesta | — | Pendiente (REQ-026, CA-015) |
| 20 | Gráficos | Sin respuesta | — | Pendiente (REQ-028) |
| 21 | Auditoría de consultas | Sin respuesta | — | Pendiente |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Ninguna todavía. Cuando haya respuesta, se pasan a coordinación por `propuestas.md`: este chat no edita el registro de decisiones.
