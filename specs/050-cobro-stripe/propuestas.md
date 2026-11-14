# 050 · Propuestas para el chat de coordinación

Cambios que esta función necesitaría fuera del rango 050 a 059. El chat de la fase 6 no los aplica: los anota aquí para que los valore el chat de coordinación (documentos compartidos) o el chat de la fase dueña del archivo.

Estado de todas: **PROPUESTA**, sin aplicar. Varias dependen de las respuestas del responsable en `aclaraciones.md` y se concretarán en el diseño.

Fecha: 12/11/2026 · Origen: especificación de la función 050 e informe del `especificador`.

## Documentos compartidos

| N.º | Archivo | Qué se propone | Motivo |
| --- | --- | --- | --- |
| P-01 | `docs/PLAN.md`, fase 6 | Añadir la línea «**Funciones previstas:** `050-cobro-stripe`, `051-publicacion-operacion`, `052-legal-rgpd`, `053-migracion-clientes-panel`» | Las demás fases con funciones la tienen |
| P-02 | `docs/ARQUITECTURA.md`, flujo «5. Cobro», paso 3 | Que diga lo mismo que el punto 6 del ADR-0006: suspenden `unpaid`, `canceled`, `paused` y la gracia vencida | Hoy solo nombra `unpaid` y `canceled`. La especificación sigue al ADR |
| P-03 | `docs/TECNOLOGIAS.md`, B-002 | Aclarar si la aprobación del gasto de la fase 1 incluye ya las comisiones de Stripe o si se aprueban al llegar a la fase 6 | B-002 sigue PROPUESTO y agrupa gastos de fases distintas |

## Modelo de datos de referencia (`docs/MODELO-DATOS.sql`, fase 2)

Son huecos entre lo que pide la especificación 050 y lo que prevé hoy el modelo. La solución es del diseño; se anotan para que la fase 2 no cierre el modelo sin saberlo.

| N.º | Qué falta o choca | Requisitos de 050 afectados |
| --- | --- | --- |
| P-04 | No hay dónde guardar la duración del periodo de gracia (parámetro global acotado) | El de la duración de la gracia |
| P-05 | Una licencia suspendida no dice por qué lo está. Sin el origen no se puede cumplir que «el pago solo levanta las suspensiones causadas por el cobro» ni mostrar el origen al superadmin | Reactivación tras el pago; información para el superadmin |
| P-06 | El tipo de alerta solo tiene `impago` y `gracia_vencida`. La especificación pide alertas también para: suscripción incompleta, fallos persistentes de relectura, cliente con varias suscripciones, estado desconocido | Los de alertas de cobro |
| P-07 | La tabla de eventos de Stripe no tiene políticas (a propósito) ni dónde anotar que un evento no correspondía a ningún cliente. El superadmin no puede ver esos eventos | Evento de un identificador sin vincular |
| P-08 | La política que deja leer a un usuario de cliente su suscripción expone todas las columnas, también los identificadores de Stripe. Puede chocar con el criterio de la fase 5 «no ve datos internos» | Lo que ve el usuario de un cliente (cuestión 20) |
| P-09 | La auditoría no guarda el valor nuevo de un cambio. La especificación lo pide para el estado manual, la gracia y el modo observación | Auditoría del estado manual |
| P-10 | Cualquier superadmin con doble factor puede cambiar el modo observación. El ADR-0006 dice que lo activa «el responsable» | Cuestión 8 |

## Otras fases

| N.º | Fase | Qué se necesita saber o coordinar |
| --- | --- | --- |
| P-11 | 3 (020 a 029) | Si el superadmin podrá suspender una licencia de forma directa, además del estado manual. De ello depende P-05. Y dónde se muestran el estado de cobro, el estado manual, el modo observación y su vista previa |
| P-12 | 4 (030 a 039) | La tarea periódica y el sistema de alertas que usará el cobro (gracia vencida sin eventos, reconciliación con Stripe) |
| P-13 | 5 (040 a 049) | Dónde ve el cliente el estado de su suscripción y desde dónde abre el portal de Stripe |
