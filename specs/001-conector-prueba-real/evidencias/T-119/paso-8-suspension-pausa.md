# T-119, paso 8: licencia suspendida, pausa y reanudación (23/11/2026)

Lo ejecutó el responsable (órdenes `suspender_licencia A`, `reactivar_licencia A`, `crear_orden A pausar` y `crear_orden A reanudar`, y una petición de revisión después de cada una en la conversación de Claude Max). Comprobado por la coordinación con recuentos del buzón y con `operar preproduccion resumen`. Sin textos de correo (art. 1).

## Casos (CA-011, CA-020)
| Caso | Qué dijo el agente | Buzón (recuentos) |
| --- | --- | --- |
| Licencia suspendida | «La licencia no está vigente»; informe en estado `pausado`, cifras a 0, guardado; sin orden que confirmar | 0 etiquetas nuevas, borradores 1 (el del paso 6), 30 sin leer, enviados 44, papelera 0 |
| Pausa (orden `pausar`) | «El agente está en pausa. HumanaIA puede reanudarlo»; confirmó la orden; informe `pausado`, cifras a 0, guardado | Igual: 0 etiquetas nuevas, 0 borradores nuevos, 30 sin leer |
| Reanudación (orden `reanudar`) | Confirmó la orden y revisó con normalidad: 30 tratados, 5 urgentes, 7 facturas, 1 borrador; mismos tres avisos del paso 6 (`sin_acceso_almacenamiento`, `sin_contexto`, `registro_no_guardado`); sin enviar, borrar ni reenviar | Borradores 2, `prueba-revisado` 2, enviados 44, papelera 0 |

Resultado: en los dos casos de bloqueo, **0 llamadas a herramientas de correo** de efecto visible (0 etiquetas, 0 borradores nuevos, 30 sin leer) y el estado devuelto por el servidor en cada llamada fue el esperado (`suspendida` y `pausada`).

## Resumen del servidor tras el paso 8
- 4 informes, 4 ejecuciones abiertas y las 4 cerradas.
- Órdenes: 2 confirmadas (pausar y reanudar), 0 pendientes, 0 entregadas sin confirmar, 0 anuladas.
- Licencias A y B de nuevo `activa`. Conexiones: 1 total, 1 activa, 0 revocadas. `cerrada: false`.
- Protocolo: `2026-07-28` en los 31 sucesos.
- p95: `obtener_instrucciones` 85 ms, `enviar_informe` 70 ms, `confirmar_orden` 25 ms.
- Sucesos: 31 en total, 23 correctos, **8 rechazados**, 0 errores. Los 4 rechazados nuevos desde el paso 6 no están explicados; se corresponden en número con las 4 órdenes de operación o con las llamadas con licencia suspendida y pausada. **Sin confirmar**: hay que mirar la causa en la exportación de sucesos (`exportar_sucesos`) antes de dar el paso por cerrado sin salvedad.

## Pendiente de este paso
Explicar los 8 rechazados con `exportar_sucesos` (solo códigos de lista cerrada).
