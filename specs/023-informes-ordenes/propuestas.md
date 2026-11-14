# 023 · Propuestas para coordinación

Cambios que esta función necesitaría fuera del rango de la fase 3. El chat de la fase 3 no los edita: los anota aquí para el chat de coordinación y para los chats de las fases afectadas. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 3, a partir del informe del `especificador`.

## Bloquea un criterio de la fase 3

El contrato `contratos/obtener-instrucciones.schema.json` y el flujo 2 de `docs/ARQUITECTURA.md` dicen que la orden vigente solo se entrega con estado `activa`. Una orden de pausar hace que el estado servido sea `pausada`, así que, leído al pie de la letra, nunca se entregaría ni se confirmaría. El modelo de referencia sí la devuelve en cualquier estado. Hay que corregir el contrato y la arquitectura para que digan que la orden se entrega en cualquier estado autorizado. Sin eso no se puede cumplir «una orden creada en el panel llega al agente en su siguiente revisión y vuelve confirmada». Lo decide coordinación con la fase 2 (011).

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 023 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Órdenes protegidas frente al propio superadmin | Desde la sesión solo se crea una orden (pendiente, con el autor de la sesión y fechas del sistema) y se anula; solo el conector la pasa a entregada o confirmada (REQ-023, REQ-024, REQ-051, REQ-052). El modelo deja a un administrador cambiar el estado, devolver a viva una anulada y elegir autor y fechas | Fase 2 (010) |
| 2 | Una sola orden viva por cliente | Garantizado también con peticiones simultáneas (REQ-025). El modelo no lo impide | Fase 2 (010) |
| 3 | Confirmaciones que no corresponden | Una orden anulada o sustituida no se puede confirmar después. `confirmar_orden` del modelo acepta órdenes nunca entregadas y órdenes antiguas | Fase 2 (011) |
| 4 | Auditoría de órdenes | Crear y anular se distinguen (REQ-029). En el modelo todo cambio queda como `update`, y las acciones del conector se anotan con autor vacío | Fase 2 (010) y función 024 |
| 5 | Versión publicada en desarrollo | CA-001 necesita al menos una versión del prompt publicada, porque sin versión el conector sirve `pausada` a todos | Fases 2 y 4 |
| 6 | «Sin señal» y «revisión sin informe» | La etiqueta de la fase 3 usa la misma regla y el mismo plazo que las alertas de la 013 (cuestiones 1 y 2) | Fase 2 (013) |
| 7 | Plazo de «orden sin confirmar» | El mismo en la señal de la fase 3 y en la alerta de la fase 4 (cuestión 5) | Fase 4 (032, cuestión 1) |
| 8 | Vista de resumen del modelo | Distingue pausa pedida, entregada y confirmada, con sus fechas (REQ-027); no incluye datos de fases posteriores. La vista `resumen_cliente` no lo hace e incluye el estado de suscripción | Fase 2 (010) |
| 9 | Catálogo de problemas en dos sitios | Solo se lee. La lista está en el enumerado del contrato y en la tabla del catálogo, que un administrador puede ampliar: pueden acabar distintas | Coordinación y fase 2 |
| 10 | D-013 | En `pausada` no se entrega el prompt | Fase 1 (cuestión 4 de la 001) |
| 11 | Entorno para la prueba de extremo a extremo | Conector de la fase 2 en desarrollo, con un agente de prueba programado sobre un cliente ficticio | Fase 2 |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `contratos/obtener-instrucciones.schema.json` y `docs/ARQUITECTURA.md`, flujo 2 | La orden se entrega en cualquier estado autorizado, no solo con `activa` | Ver «Bloquea un criterio de la fase 3» |
| `contratos/informe.schema.json` | Añadir a `sin_tratar` y `facturas_pendientes` una descripción: lo que queda al terminar la revisión | Cuestión 14, resuelta leyendo el prompt 1.2 y la 012 |
| `docs/DISENO.md`, página «Resumen» | Marcar qué elementos son de qué fase (alertas y versión por canal, fase 4; impagos, fase 6) | REQ-016: en la fase 3 no se muestran |
| `docs/PLAN.md` | Aclarar el reparto de las alertas entre la fase 2 (las genera) y la fase 4 (página y avisos) | Cuestión 13 |
| `docs/TECNOLOGIAS.md` | Anotar como decisiones las respuestas del responsable a las cuestiones 1, 6, 7 y 16, cuando las dé | Skill `sdd-aclarar`, paso 6 |

## Decisión en VERIFICAR

V-110 (librería de interfaz y de gráficos) no se ha usado. Se verifica con la skill `verificar-decision` en el paso de diseño.
