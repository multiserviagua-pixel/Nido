# 018 · Dictamen del auditor-seguridad sobre la enmienda 1 (vuelta 1)

Fecha: 21/11/2026 · `auditor-seguridad` · Leído: `especificacion.md` (entera), `dictamen-especificacion-2.md`, `propuestas.md` y `aclaraciones.md` (cambios de la enmienda, con `git diff`), y la verificación de la 016 (D2, D6 y D7). Solo especificación.

**Veredicto: APTO CON CONDICIONES. Sin bloqueantes. 1 MAYOR**, que se corrige con texto. La enmienda cierra en fallo: en Gmail no aprende de enviados hasta NC-2, y sin NC-11 no hay visto bueno y queda en pausa. Es honesta y no deja la 018 activa sin controles. Sigue PENDIENTE la aceptación del riesgo residual por el responsable.

## Hallazgos

| N.º | Gravedad | Dónde · art. | Explotación | Corrección mínima |
| --- | --- | --- | --- | --- |
| M-1 | MAYOR | REQ-001 (l. 32), REQ-020 · arts. 7 y 8 | «De un borrador del agente que el dueño envió, solo cuenta lo que él cambió» exige comparar con una copia del borrador. Gmail convierte el borrador en el mensaje enviado, así que esa copia la guarda el agente en su nube, donde él la puede escribir. Una instrucción oculta lleva al agente a guardar una copia sin el texto que metió el atacante. La comparación atribuye ese texto al dueño, y en 2 envíos así se convierte en fórmula propia, que va en todas las respuestas automáticas. Además, la regla tiene que coincidir con la que adopte la 016 (M-4 de su dictamen) | «Lo que el dueño cambió en un borrador del agente solo puede dar reglas breves de estilo (REQ-003). Nunca cuenta como muestra propia para REQ-020 ni para fórmulas, porque la copia con la que se compara la puede escribir el agente». CA-016: copia del borrador alterada en 2 envíos, 0 fórmulas con el canario |
| m-1 | MENOR | REQ-021 (l. 49) | En Gmail sin compuerta sigue el paso 7, sin visto bueno. Al instalar y activar la compuerta después, lo aprendido antes entra en candidatos que salen sin revisión, sin que el dueño lo haya visto | «Al activar la compuerta, lo aprendido sin visto bueno no se usa en candidatos hasta que el dueño dé su visto bueno en la vía protegida», o aplicar R-3 del dictamen 2 |
| m-2 | MENOR | REQ-008 (l. 39) | «Solo para lo que vio» no dice cómo se ata el visto bueno al contenido | «El visto bueno guarda en el estado de la compuerta la huella de lo mostrado; cualquier cambio posterior lo anula. Sin forma de que el agente lo compruebe por un camino que no pueda escribir (NC-11), no hay visto bueno». El diseño dice qué permiso de solo lectura necesita la compuerta para mostrar lo aprendido, sin ampliar el que tiene para escribir |
| m-3 | MENOR | REQ-012 (l. 43) y REQ-021 | Sin vía protegida (Gmail sin compuerta, Outlook.com y Microsoft 365) el dueño no puede pausar, aunque REQ-012 se lo promete. Pausar solo restringe | «Pausar vale también pedido por el dueño en conversación, porque solo restringe; reanudar y el visto bueno solo valen en la vía protegida» |

**Envenenamiento.** Con NC-2 sin superar y NC-11 sin demostrar, en Gmail con compuerta solo queda lo que el dueño dice en conversación. La superficie que queda es la de M-1 y m-1.

Privacidad (art. 1): la enmienda no añade nada que llegue a HumanaIA. Lo aprendido, si se muestra en la página, sigue en la cuenta del cliente.

**Qué se corrige y dónde.** En la especificación: M-1 y m-1 a m-3. En el piloto: NC-11 (P-7), que hoy no exige REQ-026 de la 016. Si falla, rige lo restrictivo. En el diseño: el permiso de lectura de m-2.

**No comprobado:** cómo guarda hoy el 1.2 la copia del borrador para su paso 7, y si el agente puede leer de algún modo el estado de la compuerta (NC-11).
