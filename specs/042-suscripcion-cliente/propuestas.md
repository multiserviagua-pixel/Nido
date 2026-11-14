# 042 · Propuestas de cambio a documentos compartidos

Fecha: 12/11/2026 · Autor: orquestador de la fase 5 (a partir del informe del `especificador`) · Estado: PROPUESTA

Cambios que la función 042 necesita fuera de su carpeta. No se ha aplicado ninguno. Los decide el chat de coordinación con el responsable. Cada punto lo he comprobado leyendo el documento citado.

## Cambios propuestos

| N.º | Documento | Cambio propuesto | Por qué |
| --- | --- | --- | --- |
| 1 | `docs/MODELO-DATOS.sql`, política `suscripciones_propio` | Que la sesión de un usuario de cliente no pueda leer los identificadores de Stripe de su suscripción. Añadir la prueba de aislamiento que lo compruebe | La política da la fila entera, con `stripe_customer_id` y `stripe_subscription_id`. La 042 los trata como datos internos |
| 2 | `docs/MODELO-DATOS.sql`, política `licencias_propio` | Que la sesión de un usuario de cliente no pueda leer `estado_manual` | Con él, el cliente ve si un superadmin ha forzado su licencia, que la 042 prohíbe mostrar |
| 3 | `docs/ARQUITECTURA.md`, tabla «Piezas» y flujo 5 | Completar la fila del dashboard de cliente (hoy solo dice «Resumen propio») con la página Suscripción y el acceso al portal. En el flujo de cobro, añadir `paused` y la gracia vencida como causas de suspensión | El flujo 5 no coincide con la tabla del ADR-0006 |
| 4 | `docs/PLAN.md`, fase 5 | La entrega pone el estado de la suscripción dentro del Resumen. Queda en su página propia, con un aviso en el Resumen cuando hay un pago pendiente | Para que el plan describa lo que se va a construir |

## Coordinación con la fase 6 (función 050)

La 042 especifica solo lo que el cliente ve; el comportamiento de cobro es de la 050. Estos puntos necesitan acuerdo entre las dos:

| N.º | Punto | Qué necesita la 042 |
| --- | --- | --- |
| 1 | Abrir el portal sin que la sesión lea el identificador de Stripe | El servidor necesita el identificador de Stripe del cliente para abrir su portal, y la sesión del usuario no debe poder leerlo. El diseño tiene que resolverlo sin usar la clave secreta para leer datos de clientes (ADR-0003, punto 5). Es ruta crítica: dictamen del `auditor-seguridad` |
| 2 | Renovación | Los datos que la 050 da al cliente no dicen si la suscripción se renovará. Sin eso, «se renueva el…» puede ser falso |
| 3 | Actualidad del estado | La 050 no da al cliente ningún indicador de cuándo se comprobó el estado por última vez. Sin él no se puede cumplir «no mostrar al día si no se ha podido comprobar» |
| 4 | Fin de la gracia | La 050 lo da al cliente sin condiciones. En modo observación o con un estado forzado esa fecha no lleva a ninguna suspensión, y por la API de datos el cliente podría deducir una cosa u otra |
| 5 | Dirección de vuelta del portal y límite de peticiones | La 050 no dice nada. La 042 exige que la dirección de vuelta la fije el servidor y propone 10 accesos por usuario y hora |
| 6 | Quién abre el portal y qué permite el portal | Es la cuestión 20 de la 050 y la cuestión 2 de la 042. Deben contestarse juntas con la cuestión 10 de la 050 (si se puede cancelar desde el portal) |

## Coordinación dentro de la fase 5

| Función | Qué hay que encajar |
| --- | --- |
| 040 | Su cuestión abierta 6 admite «sin acceso» para un cliente suspendido. La 042 exige que un cliente suspendido por impago llegue a Suscripción y al portal. Su navegación fija incluye Suscripción: si se decide ocultar la página a quien no tiene suscripción, la 040 cambia. Su recorrido automático de datos prohibidos no incluye identificadores de Stripe, estado manual ni modo observación |
| 041 | El hueco del aviso en el Resumen, y la coherencia entre lo que la 042 dice del agente y el estado que muestra el Resumen |
