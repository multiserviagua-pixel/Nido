# 018 · Dictamen del auditor-seguridad sobre la especificación (vuelta 2)

Fecha: 21/11/2026 · Resumen del orquestador del dictamen del `auditor-seguridad`.

**Veredicto: APTO CON CONDICIONES. Sin bloqueantes ni MAYOR.** H1 a H7 de la vuelta 1 resueltos (REQ-003, 004(d), 006 y 019 ya no se contradicen y la exclusión por asunto manda; REQ-020 y novedades de REQ-010; dos caminos en CA-015, 016 y 019). P0 abierta el 21/11/2026 por delegación D-036.

## Condiciones para el diseño

| N.º | Condición |
| --- | --- |
| (b) | Variante «fórmula envenenada»: 300 pruebas o más por asistente y camino (cota 1 %), o mantener 100 y exigir el visto bueno del dueño para toda fórmula nueva del aprendizaje continuo. Recomienda la segunda (más barata y reduce la amplificación). Las variantes «corrección de etiqueta falsa» y «de confianza» bastan con 100 |
| R-1 | La novedad del aprendizaje continuo espera al menos 24 h y un informe entregado al dueño, o su visto bueno si es una fórmula. CA-009 con revisiones cada 15 minutos: 0 usos antes de ese plazo |
| R-2 | En REQ-019, «si no se puede distinguir quién cambió la etiqueta, no cuenta». CA-019: cambio hecho por un filtro o por otra aplicación, 0 guardadas |
| R-3 | Opción para el responsable: en los borradores marcados como candidatos, solo rasgos de forma y ninguna fórmula literal aprendida (amplificación hacia envíos sin revisión en cero). Prueba: 0 fórmulas aprendidas en los candidatos |

## Aceptación del riesgo residual

La coordinación **no puede** darla por D-036: D-036 delega puertas y decisiones técnicas, no aceptar un riesgo abierto de los artículos 3, 7 y 8; el riesgo de la 016 lo aceptó el responsable en persona y la persistencia (una inyección, muchos envíos durante 12 meses) es nueva; la coordinación orquestó esta especificación (art. 6); el silencio no es aprobación (art. 13). Registro: P0 abierta, con la fila «PENDIENTE del responsable». Hasta su aceptación expresa no puede haber aprendizaje activo en una cuenta real, ni versión del prompt con la 018 en un canal de cliente, ni cierre P7. Si no la acepta, rige la variante restrictiva: R-3 más visto bueno para las fórmulas del continuo. Diseño y plan pueden seguir.

No comprobado: Gmail y Outlook (distinguir lo escrito por el dueño y quién cambió una etiqueta), dónde guardar visto bueno y pausa fuera del alcance del agente (P-5).
