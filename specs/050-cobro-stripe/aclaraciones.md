# 050 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

**Estado: presentadas al responsable el 12/11/2026. Ninguna respondida todavía.** La especificación sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`. Las recomendaciones son del orquestador y no son decisiones. Lo fiscal y lo legal lo confirma la gestoría o un abogado: aquí no hay asesoramiento definitivo.

## A. Las decide el responsable

### 1, 2 y 12 · Factura legal (B-001), IVA y documentos de Stripe

Para consultar con la gestoría. El programa no cambia en ningún caso: el panel no emite facturas.

| Opción | Consecuencia |
| --- | --- |
| A. La factura la emite el programa de facturación habitual; Stripe solo cobra | Sin proveedor nuevo. Alguien emite una factura por cada cobro. Hay que configurar Stripe para que sus documentos de cobro no se tomen por la factura legal |
| B. Stripe con un conector homologado (Invopop, Billit u otro) | La factura sale sola con cada cobro. Coste mensual y un proveedor más que trata datos fiscales de los clientes (entra en la lista de encargados de la función 052) |

Preguntas para la gestoría:

1. ¿El programa de facturación actual cumplirá Verifactu en la fecha que le toca a HumanaIA, y puede emitir una factura recurrente por cada cobro de Stripe?
2. ¿Quién calcula y refleja el IVA: el programa de facturación, Stripe o los dos?
3. Los documentos que genera Stripe y que el cliente ve en el portal o recibe por correo, ¿deben desactivarse o marcarse como «no es factura»?

Recomendación: **A** si los clientes son pocos (decenas) y el programa habitual cumple; **B** si se quiere que no haya trabajo manual. Bloquea implementar y cerrar, no diseñar.

### 3 · Precio y planes

| Opción | Consecuencia |
| --- | --- |
| A. Un solo plan, mensual, sin prueba gratuita; la instalación, si se cobra, va aparte | Lo más sencillo. El precio vive solo en Stripe; cambiarlo no toca el programa |
| B. Varios planes o periodos (mensual y anual) con el mismo servicio | Tampoco toca el programa: son precios distintos en Stripe |
| C. Planes que dan derecho a cosas distintas (frecuencia, número de buzones) | El programa tendría que conocer el plan: requisitos nuevos en esta función y en las fases 2, 3 y 5 |

Recomendación: **A** (o B). Evitar C en esta fase. El importe lo fija el responsable y no hace falta para especificar.

### 4 · Duración del periodo de gracia

Recomendación: **14 días naturales**, modificable entre 1 y 60, y un cambio solo afecta a las gracias que empiecen después. Menos días corta antes a quien no paga, pero un adeudo SEPA devuelto o una tarjeta caducada tardan días en resolverse.

### 5 · Si Stripe pasa a `unpaid` o `canceled` antes de acabar nuestra gracia

| Opción | Consecuencia |
| --- | --- |
| A. Se suspende al momento, como dice el ADR-0006 | Regla única y previsible. Hay que configurar los reintentos de Stripe para que duren al menos lo que la gracia |
| B. Se respeta nuestra gracia hasta el final | El cliente tiene siempre los días prometidos, pero la licencia puede seguir activa con la suscripción ya cancelada en Stripe |

Recomendación: **A**, con los reintentos de Stripe ajustados por una persona al configurar la cuenta.

### 6 · Cómo se da de alta la suscripción

| Opción | Consecuencia |
| --- | --- |
| A. El superadmin genera un enlace de pago para ese cliente y se lo hace llegar | La vinculación con Stripe nace de una acción nuestra y auditada. Encaja con la instalación acompañada |
| B. El cliente la inicia desde su dashboard | Más autonomía; el dashboard de cliente deja de ser solo de lectura (fase 5) |
| C. Ambas | Más superficie que probar |

Recomendación: **A**.

### 7 · Quién avisa al cliente de un impago

Recomendación: **los correos del propio Stripe** (pago fallido, tarjeta a punto de caducar) y la alerta en el panel para que HumanaIA llame o escriba al cliente antes de que venza la gracia. Sin avisos automáticos propios en esta fase: exigirían el proveedor de correo (V-111) y tratar más datos personales.

### 8, 16 y 17 · Modo observación

- **Criterio para salir (8):** recomendación, un ciclo de cobro completo de todos los clientes sin ninguna discrepancia entre el panel y Stripe, y la vista previa revisada.
- **Quién lo desactiva (8):** recomendación, cualquier superadmin con doble factor, con confirmación, auditoría y aviso fuera del panel; la guía de operación dirá que lo decide el responsable. La alternativa, un permiso exclusivo del responsable, pide un rol nuevo en el modelo. Depende de cuántos superadmin vaya a haber.
- **Al desactivarlo (17):** recomendación, las suspensiones de la vista previa se aplican en el momento. La vista previa es la salvaguarda: a quien no deba suspenderse se le pone antes «forzar activa» o se le avisa.
- **Si se vuelve a activar (16):** recomendación, las licencias suspendidas por el cobro vuelven a activas, porque en observación el cobro no suspende. Se enseña antes de confirmar.

### 9 · Clientes que no pagan por Stripe

Recomendación: **sin suscripción registrada**; el cobro no toca su licencia y se gestiona a mano con el estado manual. No se registran transferencias en el panel, para que no se convierta en contabilidad.

### 10 · Baja voluntaria

Recomendación: el cliente **puede cancelar desde el portal**, con efecto al final del periodo pagado; entonces la licencia queda suspendida (no revocada) y la baja completa la hace el superadmin según la guía. El portal no ofrece pausar. Las condiciones de baja las confirma un abogado en la función 052.

### 11 · Importes en el panel

Recomendación: **solo estados y fechas**. Los importes se ven en Stripe. Así el panel guarda menos datos y se mantiene lejos de ser un sistema de facturación.

### 13 · Gracia que vence mientras Stripe no responde

| Opción | Consecuencia |
| --- | --- |
| A. Se suspende igual | Cierre en fallo estricto (artículo 3). Puede cortar a un cliente que acaba de pagar |
| B. Se aplaza la suspensión hasta poder releer, con alerta crítica y un tope de 24 horas; pasado el tope, se suspende | No se castiga a quien paga por un fallo ajeno; el aplazamiento está acotado |

Recomendación: **B**. Es una interpretación del artículo 3 que debe aprobar expresamente el responsable; el diseño la anotará en su comprobación de la constitución.

## B. Detalles de comportamiento, con valor recomendado

Se pueden aceptar en bloque o corregir una a una. Sin respuesta expresa siguen abiertas.

| N.º | Cuestión | Recomendación |
| --- | --- | --- |
| 14 | Si nos enteramos tarde del impago, ¿desde cuándo cuenta la gracia? | Desde el momento que indica Stripe, no desde que lo sabemos |
| 15 | Plazos de detección | Gracia vencida aplicada en 1 hora como máximo; estado puesto de acuerdo con Stripe en 24 horas como máximo aunque se pierda un evento; alerta si los fallos de relectura duran más de 1 hora |
| 18 | Primer cobro que queda incompleto | No tiene efecto sobre la licencia y abre alerta. El superadmin decide cuándo crea la licencia y genera el código de activación; la guía recomendará hacerlo tras el primer pago |
| 19 | Cierre de la alerta de impago al pagar | Se resuelve sola, y queda constancia |
| 20 | Qué ve el usuario de un cliente | No ve los identificadores de Stripe. Cualquier usuario del cliente puede abrir el portal |
| 21 | Datos que enviamos a Stripe en el alta | Ninguno personal: el cliente introduce sus datos en las páginas de Stripe |
| 22 | Suscripción o cliente borrados en Stripe | Se tratan como `canceled`, con alerta |
| 23 | Cliente con varias suscripciones | No se elige ninguna: la licencia no cambia y se abre alerta, hasta que el superadmin lo corrija en Stripe |

## C. No son para el responsable

| N.º | Cuestión | Adónde va |
| --- | --- | --- |
| 24 | Otros orígenes de una suspensión | Coordinación con la fase 3 y diseño. `propuestas.md`, P-05 y P-11 |
| 25 | Aprobación del gasto (B-002) | Está abierta en la fase 1 (función 001). `propuestas.md`, P-03 |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1, 2, 12 | Factura legal, IVA y documentos de Stripe | Pendiente | | |
| 3 | Precio y planes | Pendiente | | |
| 4 | Duración de la gracia | Pendiente | | |
| 5 | Stripe se adelanta a la gracia | Pendiente | | |
| 6 | Alta de la suscripción | Pendiente | | |
| 7 | Avisos de impago | Pendiente | | |
| 8, 16, 17 | Modo observación | Pendiente | | |
| 9 | Clientes fuera de Stripe | Pendiente | | |
| 10 | Baja voluntaria | Pendiente | | |
| 11 | Importes | Pendiente | | |
| 13 | Gracia vencida con Stripe caído | Pendiente | | |
| 14, 15, 18 a 23 | Detalles del bloque B | Pendiente | | |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Las anota el chat de coordinación a partir de `propuestas.md`.

- B-001, cuando el responsable la resuelva con su gestoría.
- Duración del periodo de gracia (parámetro del producto, ADR-0006).
