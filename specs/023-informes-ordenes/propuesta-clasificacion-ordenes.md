# Propuesta del responsable para la 023: cómo se clasifican y se muestran las órdenes, los estados y los sucesos (24/11/2026)

Origen: durante la prueba real de la 001 (T-119, pausa y reanudación), el responsable preguntó cómo se clasifican las operaciones y si una pausa queda registrada como tal; pidió dejar todo bien detallado («SI, es mejor dejar todo bien detallado»). Estado: **PROPUESTA** para el `especificador` y el `arquitecto` de la 023 (y su `disenador-ui`). No está aprobada.

## Los cuatro conceptos que no deben mezclarse
| Concepto | Quién lo produce | Valores (conector de prueba, `001_estado.sql`) | Qué significa |
| --- | --- | --- | --- |
| **Orden** (tipo) | La persona de HumanaIA, con `operar … crear_orden` | `pausar`, `reanudar` | Lo que se pide al agente |
| **Orden** (estado) | El servidor, al entregarla y confirmarla | `pendiente` → `entregada` → `confirmada`, o `anulada` | En qué punto está la orden |
| **Estado servido de la licencia** | El servidor, en `obtener_instrucciones` | `activa`, `pausada`, `suspendida` | Lo que recibe el agente en cada revisión |
| **Estado del informe** | El agente, en `enviar_informe` | `ok`, `aviso`, `error`, `pausado` | Cómo cierra el agente una ejecución |
| **Suceso** | El servidor, por cada llamada al conector | resultado `correcto`, `rechazado`, `error`, con un código de lista cerrada y la herramienta | Registro técnico de una petición, no una orden |

## Flujo de una pausa (observado el 24/11/2026)
1. La persona crea la orden `pausar`: respuesta `creada`, con identificador y `anuladas: 0` (una orden nueva sin confirmar anula la anterior). Estado de la orden: `pendiente`.
2. En la siguiente ejecución de la tarea, el agente llama a `obtener_instrucciones`, recibe la orden (`entregada`) y la confirma con `confirmar_orden` (`confirmada`). La licencia pasa a servirse como `pausada`.
3. El agente cierra con un informe en estado `pausado` y cifras a 0, sin leer ni etiquetar nada ni crear borradores (CA-020).
4. Se repite con `reanudar` y la licencia vuelve a servirse `activa`.
La orden no actúa al instante: llega en la siguiente revisión (como máximo, el intervalo de la tarea).

## Lo que debe mostrar el panel (requisitos propuestos)
1. **Lista de órdenes** por cliente y licencia: tipo, estado, quién la creó (la persona de HumanaIA, nunca un identificador del cliente), fecha de creación, de entrega y de confirmación, y si fue anulada por otra posterior. Solo enteros, fechas y valores de listas cerradas (art. 1).
2. **Estado actual de cada licencia** (servido): `activa`, `pausada` o `suspendida`, con desde cuándo.
3. **Informes por ejecución** con su estado (`ok`, `aviso`, `error`, `pausado`) y los avisos de lista cerrada que lleven (en la prueba: `sin_acceso_almacenamiento`, `sin_contexto`, `registro_no_guardado`).
4. **Línea de tiempo** de una pausa: orden creada → entregada → confirmada → primer informe `pausado` → orden de reanudar → primer informe normal. Para ver cuánto tardó cada tramo.
5. **Sucesos del conector** separados de las órdenes, con el resultado y el código. Los `metodo_no_permitido` del `GET` a `/api/mcp` **no cuentan como rechazos de fallo** (ver `specs/011-conector-sobre-bd/propuesta-get-405.md`): se agrupan aparte como «flujo de eventos no ofrecido».
6. **Acciones de la persona** (crear orden, suspender, reactivar, revocar) registradas como operaciones de auditoría (024), con su resultado, pero **no** como sucesos del conector.

## A decidir en la especificación
- Si la orden se puede **anular a mano** (hoy solo la anula otra orden nueva).
- Si una orden `pendiente` mucho tiempo genera una **alerta** (relación con la 013, latido y alertas).
- Si el panel permite crear la orden o sigue siendo solo la persona de HumanaIA (hoy `operar`).
- Cómo se ve la pausa **global** (fase 4, 032) frente a la pausa de una licencia.

## Datos reales de la prueba, para el diseño
En la prueba (23 y 24/11/2026): 2 órdenes `confirmada` (pausar y reanudar) y 0 `pendiente`/`entregada`/`anulada`; 6 informes y 6 ejecuciones cerradas; sucesos 63 (43 correctos, 20 rechazados, 0 errores), con los 20 rechazados por `metodo_no_permitido`. Informes `aviso` con modo `desatendido` en las ejecuciones programadas.
