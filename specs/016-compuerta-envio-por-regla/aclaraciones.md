# 016 · Aclaraciones

Cuestiones abiertas de `especificacion.md`. **Respondidas el 21/11/2026** (tabla abajo); la 1 depende de una enmienda del artículo 8 aún no ratificada. Una respuesta supuesta no vale: mientras la columna «Respuesta» esté vacía, la cuestión sigue abierta y la función sigue en PROPUESTA.

Las opciones y su consecuencia están en «Cuestiones abiertas» de la especificación.

Relación con «Qué queda por decidir» de `docs/propuesta-enmienda-articulo-8.md`:

- Su 1 (opción): respondida, «B, compuerta de código» (D-037).
- Su 2 (casos críticos) y su 6 (quién activa las reglas): resueltas por el artículo 8 en la versión 1.3. Una regla es una dirección exacta que crea el dueño; ni el agente ni el servidor crean ni activan reglas.
- Su 3 (categorías): aquí es la 1. Con la 1.3, las categorías solo excluyen.
- Su 4 (rodaje): aquí es la 2.
- Su 5 (aprendizaje inicial): fuera de alcance de esta función.
- La antigua cuestión 3 de esta especificación (dirección completa o dominio) queda resuelta por el artículo 8 (1.3): dirección exacta, sin dominios.

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Si se añade alguna categoría a la lista mínima de excluidas | «Debe aprender a responder y responder por sí solo, menos a correos de organismos públicos, bancos, reclamaciones, temas personales o médicos». Preguntado después por el modelo, eligió «B: responde a todos salvo excluidos», sin lista de remitentes. **Choca con el artículo 8 (1.3)**: exige enmendarlo (versión 1.4, propuesta en `docs/propuesta-enmienda-articulo-8-v14.md`). Ratificada el mismo día como 1.4 (D-038), con la condición del auditor que eligió el responsable: «Solo a quien ya escribí». Es decir, a quien el dueño ya ha escrito antes, sin lista | Responsable, 21/11/2026, en el chat de coordinación | Si se ratifica la 1.4: REQ-001, REQ-002, REQ-019 y la función 017 cambian; la lista excluida pasa a ser la del responsable (sin «otros») |
| 2 | Número de candidatos en rodaje por regla | «Aprende de los correos enviados y recibidos, 100 últimos». El rodaje por regla se sustituye por el aprendizaje inicial con los 100 últimos correos enviados y recibidos (en la cuenta del cliente; nada de contenido llega a HumanaIA, artículo 1) | Responsable, 21/11/2026 | REQ-006, CA-006; función 018 |
| 3 | Si se construye el interruptor de HumanaIA que solo desactiva, y qué hace la compuerta si no puede consultarlo | El responsable delega: «Decide tú, siempre y cuando haga la app más práctica de usar». Decisión de la coordinación por D-036: **se construye**; si la compuerta no puede consultarlo, no envía y la respuesta queda como borrador (cierre en fallo, artículo 3). Motivo: con envío a cualquier remitente, cortar todos los envíos de un cliente desde el panel ante un incidente es la palanca operativa más práctica; el coste para el dueño es nulo mientras HumanaIA responda | Coordinación por delegación expresa, 21/11/2026 | REQ-010, REQ-014, REQ-023, CA-010, CA-023 |
| 4 | Si se acepta el riesgo residual descrito en la especificación, con las recomendaciones del auditor ya incluidas | «Añadir más controles». De los propuestos eligió: **resumen diario al dueño** de lo enviado solo, dentro de su propia cuenta. En la segunda pregunta, con el dictamen delante, añadió el **envío diferido de 15 minutos** y mantuvo el filtro de enlaces y datos con un activador del dueño y aviso del riesgo. No eligió topes más bajos ni el bloqueo por importes | Responsable, 21/11/2026 | Requisito nuevo del resumen diario; el riesgo residual con el modelo B lo dictamina el `auditor-seguridad` sobre la enmienda 1.4 |

## Decisiones que salen de aquí

- **D-038 (21/11/2026), constitución 1.4.** El responsable ratificó el artículo 8 con la redacción del `auditor-seguridad`. Ya no hay reglas de remitente: la compuerta responde a quien el dueño ya ha escrito antes. Lo demás lo fijan el artículo 8 y `docs/propuesta-enmienda-articulo-8-v14.md`: exclusiones, filtro desactivable solo por el dueño tras un aviso, topes, resumen diario y espera de 15 minutos.
- **Filtro de enlaces y datos:** «las 2 pero con un activador en configuraciones con alerta del riesgo que implica». Activo por defecto; solo el dueño lo desactiva, por la vía protegida y tras un aviso.
- **Controles añadidos:** resumen diario y envío diferido de 15 minutos, cancelable por el dueño.
- **Lo que tiene que hacer la fase 2 con la 016:** reescribir la especificación con la 1.4 (REQ-001, REQ-002, REQ-006, REQ-019, resumen, espera y filtro desactivable) y aplicar las condiciones de los dos dictámenes. La 017 se reduce a activar, desactivar, excluir, el ajuste del filtro y el historial. La 018 lleva el aprendizaje con los 100 últimos correos.
