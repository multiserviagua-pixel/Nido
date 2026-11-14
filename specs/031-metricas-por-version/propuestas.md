# 031 · Propuestas para coordinación

Cambios que esta función necesitaría en documentos compartidos. El chat de la fase 4 no los edita: los anota aquí para el chat de coordinación. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 4, a partir del informe del `especificador`.

## Huecos que afectan a otras fases

| N.º | Asunto | Qué pasa hoy | A quién afecta |
| --- | --- | --- | --- |
| 1 | Qué significan `sin_tratar`, `facturas_pendientes` y `borradores` | Ni el contrato ni el prompt 1.2 dicen si son cifras de esa revisión o lo pendiente acumulado. Si son acumuladas, sumarlas entre revisiones da cifras falsas | Contrato del informe (coordinación) y prompt 1.3 (función 012). Cuestión 7 de la 031 |
| 2 | Qué versión declara un agente en pausa | En `pausada` no se entrega prompt ni versión (D-013), pero el contrato exige `version_prompt` siempre. Esos informes acabarían sumados a una versión cualquiera | Función 012 y D-013 |
| 3 | Versión declarada frente a versión servida | ADR-0005 atribuye el informe a la versión que declara, que es un dato no confiable (artículo 7). Nadie dice qué pasa si no coincide con la servida | ADR-0005 y función 011. La 031 propone contar en la declarada, mostrar la discrepancia y dejarla fuera de la comparación |
| 4 | Borrado de clientes | Al borrar un cliente se borran sus informes en cascada y cambian las cifras de periodos pasados | Fase 6 (plazos de conservación) y función 010 |
| 5 | Códigos de problema desconocidos | Se descartan al recibir el informe sin contarlos: una versión que emita códigos fuera del catálogo no se vería en las métricas | Función 011. Menor |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `contratos/informe.schema.json` | Describir en cada cifra si es de esa revisión o acumulada | Hueco 1 |
| `docs/PLAN.md`, fase 4 | Añadir un criterio de aceptación propio de las métricas, por ejemplo «las métricas por versión cuadran con un conjunto de informes de resultado conocido» | Ningún criterio del plan cubre hoy la entrega de métricas |
| `docs/MODELO-DATOS.sql`, vista de métricas por versión | Es solo orientativa: no tiene periodo, no separa las versiones no registradas, cuenta los `pausado` en el total y concede lectura a cualquier usuario autenticado (un usuario de cliente vería cifras por versión de sus propios informes, una vía que nadie ha pedido) | La 031 exige que solo el superadmin con doble factor obtenga métricas por versión (REQ-033, REQ-037). Coincide con la cuestión 5 de la función 010 |
| D-013 o el contrato | Fijar qué `version_prompt` declara un agente en pausa | Hueco 2 |
| Especificaciones 030 y 031 | Unificar el ancho mínimo de móvil (la 030 usaba 360 píxeles; la 031, la 032 y la 020 de la fase 3, 320) | Corregido por este chat en la 030 (CA-023) el 12/11/2026: es un ajuste de coherencia dentro del rango de la fase 4, no una decisión |
