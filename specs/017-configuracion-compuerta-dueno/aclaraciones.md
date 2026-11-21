# 017 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Las cuestiones 2 y 3 las fija la coordinación por delegación (D-036), a la vista del dictamen del `auditor-seguridad` sobre la especificación (APTO CON CONDICIONES, 21/11/2026), con la opción más restrictiva. El responsable puede revocarlas. La 1 es del responsable y sigue abierta; no bloquea la aprobación, porque la especificación ya aplica el valor por defecto seguro.

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | ¿Se compromete HumanaIA a no pedir nunca a un cliente que active la compuerta, apague el filtro, retire exclusiones o suba topes? | Pendiente. Recomendación: A (compromiso por escrito en el aviso y en las condiciones, 052). Mientras tanto rige B: no se escribe compromiso alguno de HumanaIA y el aviso dice que toda petición de relajar, también una que parezca de HumanaIA, puede ser un engaño | Responsable, sin respuesta | Con A cambiarían el punto (f) de REQ-005 y CA-005; con B, sin cambios |
| 2 | ¿Quién instala la compuerta en la cuenta del cliente? | A. Siempre el dueño, con su propia sesión y la guía; HumanaIA ayuda sin tener ni pedir sus credenciales. Motivo: con B una persona de HumanaIA manejaría la cuenta del cliente, y el artículo 8 no deja al servidor cambiar el código; A es la opción restrictiva | Coordinación por delegación (D-036), 21/11/2026 | REQ-011 y CA-011 modificados |
| 3 | ¿Quién cuenta como dueño cuando otras personas tienen acceso a la cuenta? | A. Solo el titular. Un delegado, como mucho, hace acciones restrictivas urgentes (desactivar, cancelar, encender el filtro) si la plataforma lo distingue del titular; si la plataforma no distingue titular de delegado, la vía protegida no se ofrece en ella. Motivo: un delegado que relajara la compuerta escaparía al control del dueño que exige el artículo 8; ante la duda se deniega (artículo 3) | Coordinación por delegación (D-036), 21/11/2026 | Término «Dueño», REQ-001, REQ-017 y CA-001 modificados |

## Enmienda 1 (21/11/2026)

No es una respuesta del responsable: es una decisión de la coordinación por delegación (D-036), a la vista de `verificacion-gmail-outlook.md` de la 016. El responsable puede revocarla. La cuestión 1 no cambia.

| Asunto | Decisión | Efecto |
| --- | --- | --- |
| Presencia (D1) | Código de un solo uso generado en un dispositivo del dueño fuera del alcance del agente, escrito en la vía protegida; si el piloto demuestra una llave de acceso (NC-5), esa. Sin algoritmo ni formato en la especificación | REQ-004, REQ-023 |
| Avisos (D3) | Con autoridad en la página del dueño; correo de cortesía sin autoridad | REQ-009, REQ-018 |
| Versión (D4) | La instalación advierte de no compartir el proyecto | REQ-011 |
| Plataforma (D5) y piloto (C) | Solo Gmail, con la limitación visible; sin activación hasta el piloto | REQ-022, REQ-024 |

## Decisiones que salen de aquí

Ninguna nueva en `docs/TECNOLOGIAS.md` por ahora. Si la plataforma elegida no distingue titular de delegado o no garantiza la presencia del dueño en la reautenticación propia, el diseño lo anota al cerrar la verificación de plataformas (`propuestas.md`, T-2).
