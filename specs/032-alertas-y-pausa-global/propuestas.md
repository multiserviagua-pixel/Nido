# 032 · Propuestas para coordinación

Cambios que esta función necesitaría en documentos compartidos. El chat de la fase 4 no los edita: los anota aquí para el chat de coordinación. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 4, a partir del informe del `especificador`.

## Solape con la fase 2 (lo más urgente)

Las funciones 013 y 014 de la fase 2 y la 032 de la fase 4 exigen cosas que se pisan:

| Asunto | Fase 2 | Fase 4 (032) |
| --- | --- | --- |
| Detección de «sin señal» y «ejecución sin informe» | 013, completa | REQ-002 a REQ-004 |
| Vigilancia del propio cálculo de alertas | 013 | REQ-019, REQ-054 |
| Caída del servicio que deja a muchos clientes sin señal | 013, cuestión 18 | REQ-051 |
| Alerta de conexión nueva | 014 | REQ-008 |
| Pantallas para ver y resolver alertas | La 013 las sitúa en la fase 3; la 020 de la fase 3 las sitúa en la fase 4 | REQ-013 a REQ-018 |

La 013 ya lo pregunta en su cuestión 1. Propuesta de la fase 4 (cuestión 0 de `aclaraciones.md`): la fase 2 detecta «sin señal», «ejecución sin informe» y «conexión nueva»; la 032 detecta estado `error`, versión antigua y orden sin confirmar, y entrega el centro de alertas, los avisos fuera del panel, el aviso agregado y la pausa global, y comprueba los seis tipos de extremo a extremo. Hace falta una sola respuesta del responsable para las dos fases, y que `docs/PLAN.md` la recoja.

Preguntas que la 013 y la 032 hacen por duplicado al responsable (conviene una sola respuesta): plazos de sin señal y de ejecución sin informe, intervalo del cálculo, qué cuenta como señal, cliente o conexión, severidades, resolución, informe en pausa, fallo masivo, vigilancia del cálculo y frecuencia declarada distinta de la acordada.

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/MODELO-DATOS.sql`, entrega de instrucciones | Si no se puede saber si la pausa global está activa (falta la fila de ajustes), responder como si lo estuviera. Hoy el modelo la da por inactiva y serviría el prompt | Artículo 3, cierre en fallo. REQ-060 y CA-029 de la 032. Afecta a la función 011 |
| `docs/MODELO-DATOS.sql`, órdenes | Decidir qué pasa con las órdenes durante la pausa global. Hoy se entregan y se marcan como entregadas, y puede llegar `reanudar` junto con `pausada` | Cuestión 11 de la 032 |
| `docs/MODELO-DATOS.sql`, auditoría | Que la auditoría distinga activar de levantar la pausa global y no la confunda con otros ajustes; que resolver una alerta deje fila de auditoría y quien resuelve lo ponga el sistema | REQ-016, REQ-028 y REQ-040 de la 032. Coincide con la propuesta 6 de la 013 |
| `docs/MODELO-DATOS.sql`, alertas | Una sola alerta abierta por cliente y tipo garantizada en los datos (por conexión en conexión nueva, por orden en orden sin confirmar); que borrar un cliente no borre su historial de alertas; que el resumen de cliente refleje también la pausa global | REQ-011 de la 032. Coincide con las propuestas 2 y 5 de la 013 |
| `docs/ARQUITECTURA.md` | Completar qué alertas calcula la tarea periódica (faltan estado `error`, versión antigua y conexión nueva); añadir el aviso agregado al fallo «conector caído»; decir en qué función se fijan los objetivos de servicio | La arquitectura dice «se fijan en la fase 4» sin asignarlo. Propuesta: se miden en la 033 y los fija el responsable al cerrar la fase |
| `docs/SEGURIDAD.md`, A-01 | Aclarar quién genera la alerta de conexión nueva | Hoy apunta a «función 001, fase 3»; la arquitectura, a la activación; el plan, a la fase 4 |
| `docs/PLAN.md` | Aclarar el reparto de alertas entre las fases 2 y 4 | Ver el solape de arriba |
| `docs/TECNOLOGIAS.md` | Anotar como decisiones las respuestas del responsable a las cuestiones 0 a 4 y 6, cuando las dé | Skill `sdd-aclarar`, paso 6 |

## Decisión en VERIFICAR

V-111 (proveedor de correo para avisos, con alojamiento en la UE) no se ha usado. Se verifica con la skill `verificar-decision` en el paso de diseño. La función 013 propone adelantarla a la fase 2 si la vigilancia del cálculo necesita antes un canal de aviso; la 021 la menciona para las invitaciones. Conviene verificarla una sola vez para las tres.
