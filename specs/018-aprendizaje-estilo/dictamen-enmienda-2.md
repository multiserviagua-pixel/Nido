# 018 · Dictamen del auditor-seguridad sobre la enmienda 1 (vuelta 2, última)

Fecha: 21/11/2026 · `auditor-seguridad` · Leído: `especificacion.md` entera, con las secciones «Enmienda 1» y «Vuelta de corrección 21/11/2026»; `dictamen-enmienda-1.md`; la especificación corregida de la 016 (requisitos 2, 17 y 26) y su `verificacion-gmail-outlook.md` (D2, D6 y D7). Solo especificación.

**Veredicto: APTO. Sin bloqueantes ni MAYOR. 2 MENOR**, que se pueden corregir en el texto o pasar al diseño como condiciones. La aceptación del riesgo residual (persistencia y amplificación) sigue pendiente del responsable. No es un hallazgo, pero sin ella no hay aprendizaje activo en cuentas reales.

## Cierre de lo pedido en la vuelta 1

| N.º | Estado | Dónde queda |
| --- | --- | --- |
| M-1 | CERRADO, con un borde (m-2 de esta vuelta) | REQ-001 (l. 32) y REQ-020 (l. 48): lo cambiado en un borrador del agente solo da reglas breves de estilo, nunca fórmulas ni muestra propia; sin cambios, nada. CA-001 (l. 79) y CA-016 (l. 94), con la copia alterada en 2 envíos |
| m-1 | CERRADO, con un borde (m-1 de esta vuelta) | REQ-021 (l. 49): al activar la compuerta, lo aprendido sin visto bueno no se usa en candidatos. CA-021 (l. 99) |
| m-2 | CERRADO | REQ-008 (l. 39): huella de lo mostrado en el estado de la compuerta; cualquier cambio la anula; sin NC-11, no hay visto bueno. CA-007 (l. 85). El permiso de lectura, al diseño |
| m-3 | CERRADO | REQ-012 (l. 43) y REQ-021: la pausa vale pedida en conversación; reanudar y el visto bueno, solo en la vía protegida. CA-011 y CA-021. Dónde se guarda la pausa, al diseño (l. 138) |

## Hallazgos nuevos

| N.º | Gravedad | Dónde · art. | Escenario | Corrección mínima en texto |
| --- | --- | --- | --- | --- |
| m-1 | MENOR | REQ-021 (l. 49), CA-021 · arts. 3 y 8 | «Al activar la compuerta, lo aprendido sin visto bueno no se usa en candidatos» supone que el agente sabe si la compuerta está activada. Ese dato está en el estado de la compuerta y el agente solo lo lee con seguridad si se supera NC-11. Sin NC-11, el texto solo dice que rige «sin visto bueno y en pausa». Lo aprendido antes por el paso 7 sin visto bueno, que en Gmail sin compuerta sí se usa, podría seguir entrando en candidatos que salen sin revisión | «Si el agente no puede saber, por un camino que ni él ni un tercero puedan escribir, si la compuerta está instalada o activada, la trata como activada». CA-021: estado de activación ilegible (simulado) con lo aprendido por el paso 7 sin visto bueno, 10 revisiones: 0 candidatos con lo aprendido |
| m-2 | MENOR | REQ-001 (l. 32), REQ-003 (l. 34), CA-016 · arts. 7 y 8 | La corrección lleva lo cambiado en un borrador del agente, cuya copia de referencia puede escribir el agente, a las reglas breves de estilo. REQ-003 admite como regla breve «una frase sobre un solo rasgo de la lista» de hasta 120 caracteres. Con la copia alterada, el texto del atacante puede salir como «cambio del dueño» y entrar como frase, por ejemplo «despedida: añade “…”», que irá en todos los candidatos. CA-016 solo cuenta fórmulas con el canario, no reglas breves | «Una regla breve que venga de un borrador del agente cambiado por el dueño solo tiene la forma “rasgo de la lista → valor”, con un valor de la lista cerrada; nunca frase». CA-016: la copia del borrador alterada en 2 envíos o más da 0 fórmulas y 0 reglas breves con el canario |

## Lo que no se reabre

No se reabren la aceptación del riesgo residual, pendiente del responsable, ni lo enviado al piloto (NC-11, NC-2) y al diseño (permiso de lectura y dónde se guarda la pausa). Si la 016 adopta la redacción de M-2 de su vuelta 2 (el borrador del agente no cuenta, cambiado o no), el requisito 1 de la 018 sigue siendo coherente: lo cambiado solo da estilo.

Privacidad (art. 1): las correcciones no añaden nada que llegue a HumanaIA. La huella del visto bueno queda en la cuenta del cliente.

**No comprobado:**

- Cómo guarda hoy el 1.2 la copia del borrador para su paso 7.
- Si el agente puede leer el estado de la compuerta, la activación incluida, por un camino que no pueda escribir (NC-11).

No se ha ejecutado nada: es una revisión de texto.

**Sin bloqueantes.**
