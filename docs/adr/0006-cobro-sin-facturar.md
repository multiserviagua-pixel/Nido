# ADR-0006: Stripe cobra; el panel no emite facturas

Estado: CONFIRMADO; factura legal BLOQUEADA (B-001) · Fecha: 12/11/2026 · Decisiones: D-003, D-010, T-014, T-015

## Contexto

El responsable ha elegido cobro recurrente automático con Stripe. En España, un sistema que expide facturas queda sujeto al reglamento de sistemas de facturación (Verifactu): obligatorio para sociedades el 1/1/2027 y para el resto el 1/7/2027. Hacienda ha anunciado que prevé aplazarlo a octubre de 2028, sin norma aprobada. Stripe por sí solo no cumple Verifactu y recomienda conectar un programa especializado.

## Decisión

1. **Stripe Billing cobra** la suscripción (tarjeta y adeudo SEPA) y ofrece el portal de cliente.
2. **El panel no genera facturas**: muestra el estado de cobro y enlaza a Stripe. Así no es un sistema de facturación.
3. **Quién emite la factura legal** lo decide el responsable con su gestoría antes de la fase 6 (B-001): el programa de facturación habitual, o Stripe con un conector homologado.
4. El webhook verifica la firma, **guarda solo el identificador y el tipo** del evento, y **relee el estado en Stripe**, porque los eventos pueden llegar repetidos o desordenados y su carga lleva datos personales.
5. El cliente se deriva del identificador de Stripe ya guardado, nunca de metadatos del evento.
6. Relación entre cobro y licencia:

| Estado en Stripe | Efecto |
| --- | --- |
| `trialing`, `active` | Licencia activa |
| `past_due` | Licencia activa, alerta y comienzo del periodo de gracia |
| `unpaid`, `canceled`, `paused`, o gracia vencida | Licencia suspendida |
| `incomplete`, `incomplete_expired` | Sin efecto sobre una licencia ya activa; alerta |

7. `licencias.estado_manual` permite al superadmin forzar activa o suspendida, con auditoría.
8. Stripe arranca en **modo observación**: registra estados y alertas sin suspender nada, hasta que el responsable lo active.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| Registro manual del estado de pago | Descartada por el responsable; queda como respaldo con `estado_manual` |
| Generar facturas en el panel | Lo convertiría en sistema de facturación sujeto a Verifactu |
| Suspender en el primer impago | Un fallo de tarjeta pararía el agente de un cliente que paga |

## Consecuencias

- La fase 6 no puede cerrarse sin resolver B-001.
- El periodo de gracia es un parámetro del producto que fija el responsable.
- Las pruebas de la fase 6 usan el modo de pruebas de Stripe.
