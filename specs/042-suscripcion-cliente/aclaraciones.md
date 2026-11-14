# 042 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Estado a 12/11/2026: **todas PENDIENTES**. La columna «Recomendación» es del orquestador y no es una decisión.

Varias cuestiones dependen de decisiones de la función 050 (fase 6), que también está en PROPUESTA. Se indica en cada una.

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | ¿Qué ve un cliente sin suscripción registrada en Stripe? | PENDIENTE | — | — |
| 2 | ¿Quién puede abrir el portal de pago? | PENDIENTE | — | — |
| 3 | ¿Qué se le dice al cliente con un pago pendiente? | PENDIENTE | — | — |
| 4 | ¿Qué ve mientras está activo el modo observación? | PENDIENTE | — | — |
| 5 | ¿Qué se muestra con un estado manual forzado? | PENDIENTE | — | — |
| 6 | ¿Se confirma la lista de estados visibles? | PENDIENTE | — | — |
| 7 | ¿Cuál es la vía de contacto para el cobro? | PENDIENTE | — | — |
| 8 | ¿Ve el importe o el plan? | PENDIENTE | — | — |
| 9 | ¿Qué ve quien ha cancelado o va a cancelar? | PENDIENTE | — | — |
| 10 | ¿Qué antigüedad máxima puede tener el estado? | PENDIENTE | — | — |
| 11 | ¿Qué se le dice sobre sus facturas? | PENDIENTE | — | — |
| 12 | Umbrales propuestos | PENDIENTE | — | — |

## Opciones, consecuencia y recomendación

Las opciones completas están en `especificacion.md`, apartado «Cuestiones abiertas». Aquí va el resumen y la recomendación.

### 1. Cliente sin suscripción en Stripe

- a) No ve la página.
- b) Ve la página con un texto que dice que su suscripción se gestiona directamente con HumanaIA.

**Recomendación: b).** La navegación del panel no cambia según el cliente, y quien busque cómo se le cobra encuentra una respuesta. Afecta a todos los clientes hasta que la fase 6 esté en marcha y a los que sigáis cobrando fuera de Stripe.

### 2. Quién abre el portal de pago

- a) Todos los usuarios del cliente.
- b) Solo uno designado.

**Recomendación: a), si el portal solo permite cambiar el medio de pago.** Qué permite el portal se decide en la función 050 (su cuestión 10). Si allí decides que desde el portal también se puede cancelar, cambia mi recomendación a b), porque cualquier persona invitada podría dar de baja el servicio; eso exige niveles de usuario en la función 040.

### 3. Pago pendiente

**Recomendación:** se muestra la **fecha** de fin de la gracia como el día en que el agente dejaría de funcionar; el aviso aparece en el Resumen **en cada visita** mientras dure; y solo en «pago pendiente» e «impago». Un cliente que sabe la fecha puede evitar la suspensión; uno que solo lee «hay un plazo» se entera cuando ya está suspendido. La fecha solo se muestra cuando la suspensión vaya a ocurrir de verdad, como ya exige la especificación.

### 4. Modo observación

- a) Ve el estado de pago, sin fecha ni advertencia de suspensión.
- b) No ve estados de pago negativos mientras dure.

**Recomendación: a).** Que tiene un pago pendiente es verdad y le conviene saberlo. Lo que no se le anuncia es una suspensión que en ese modo no ocurrirá. Conviene avisar a los clientes afectados antes de desactivar el modo; eso es de la función 050 (su cuestión 17).

### 5. Estado manual forzado

**Recomendación:**

| Caso | Qué ve el cliente |
| --- | --- |
| Agente activo forzado, con pago pendiente o impago | El estado de pago real, sin anuncio de suspensión. El agente aparece activo |
| Agente suspendido forzado, con el pago al día | «Al día» en Suscripción, el agente «Suspendido» en el Resumen y la vía de contacto |

Las dos cosas son verdad y no se dice que haya un estado forzado. En el segundo caso el cliente deducirá que la suspensión no es por el pago; es inevitable si no se le miente, y lo razonable es que contacte.

### 6. Lista de estados visibles

**Recomendación: confirmarla**, con dos ajustes. Llamar «Suscripción en pausa» al estado `paused`, para que no se confunda con «En pausa» del agente. Y mostrar `past_due` con la gracia vencida como «Impago» solo cuando la licencia esté ya suspendida; hasta entonces, «Pago pendiente», para que lo que se dice del cobro no vaya por delante de lo que le pasa al agente.

### 7. Vía de contacto

Necesito que me la digas: un correo de soporte, un teléfono o una página. No he puesto ninguna. Es la misma que pide la cuestión 10 de la función 041.

### 8. Importe o plan

- a) No.
- b) El nombre del plan.
- c) El importe.

**Recomendación: a).** El panel no guarda importes (función 050) y cuanto menos se parezca a un sistema de facturación, mejor (ADR-0006, T-014). El importe lo ve en el portal de Stripe.

### 9. Cancelación

**Recomendación:** que la función 050 ponga a disposición del cliente si la suscripción se renovará, y la página lo distinga («se renueva el…» o «termina el…»). Si la 050 no lo hace, la página habla solo de «fin del periodo en curso». Un cliente con la suscripción cancelada no abre el portal: contacta con HumanaIA. Depende de la cuestión 10 de la función 050.

### 10. Antigüedad del estado

- a) Sin límite.
- b) Pasado un umbral, «no disponible».
- c) Pasado un umbral, el estado con la fecha en que se comprobó.

**Recomendación: b), con el mismo plazo que la función 050 fije para detectar eventos perdidos** (su cuestión 15). Mostrar «Al día» con un dato que puede llevar días sin comprobarse sería afirmar algo que no se sabe. Exige que la 050 dé al cliente un indicador de actualidad, no la fecha interna.

### 11. Facturas

- a) Nada.
- b) Un texto fijo que dice dónde recibe la factura.
- c) Un texto que remite a los justificantes de Stripe.

**Recomendación: b), cuando B-001 esté resuelta; hasta entonces, a).** El cliente buscará sus facturas en esta página. Decirle dónde las recibe no convierte el panel en un sistema de facturación. No se puede redactar hasta saber quién emite la factura legal.

### 12. Umbrales

| Umbral | Valor propuesto |
| --- | --- |
| Tiempo máximo para obtener el acceso al portal | 10 segundos |
| Accesos al portal por usuario | 10 por hora |
| Contenido principal | Menos de 2,5 segundos, percentil 75, móvil con 4G simulada |

**Recomendación: confirmarlos.**

## Qué se puede cerrar ahora y qué espera a la fase 6

- Se pueden contestar ya: 1, 2 (condicionada), 3, 4, 5, 6, 7, 8 y 12.
- Esperan a decisiones de la función 050 o a B-001: 9, 10 y 11.

La 042 puede aprobarse con esas tres pendientes solo si el responsable acepta expresamente que queden como supuestos a revisar; si no, sigue en PROPUESTA hasta que la 050 las resuelva.

## Decisiones que salen de aquí

Ninguna todavía.
