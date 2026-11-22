# 016 · Dictamen del auditor-seguridad sobre la enmienda 1 (vuelta 3, acotada)

Fecha: 21/11/2026 · `auditor-seguridad` · Vuelta acotada, autorizada por la coordinación (D-036). El auditor no tiene herramienta de escritura: el orquestador copia aquí su informe, resumido en la forma pero sin cambiar veredicto, gravedades ni correcciones.

Leído: los tres `dictamen-enmienda-2.md`; las tres `especificacion.md` en lo marcado «Vuelta de corrección 3»; `propuestas.md` (P-25 y P-26 de la 016, P-16 y P-17 de la 017, P-11 y P-12 de la 018); y, para el alcance de M-1, el requisito 24 de la 015, los requisitos 13, 16, 17 y 20 de la 030 y el requisito 65 de la 022. Solo especificación: no se ha ejecutado nada.

**Veredicto: APTO CON CONDICIONES. Sin bloqueantes. 1 MAYOR y 1 MENOR**, ambos sobre el cierre de M-1 de la 016. Las demás correcciones quedan cerradas.

## Cierre de lo pedido en la vuelta 2

| Función · N.º | Estado | Dónde queda |
| --- | --- | --- |
| 016 · M-1 | CERRADO EN PARTE (falta N-1) | REQ-026: la condición del prompt rige mientras haya una cuenta con la compuerta instalada; sin versión anterior que cumpla, el canal queda sin instrucciones; ante la duda, se trata como instalada. REQ-017 remite a REQ-026. CA-029 prueba paso y vuelta atrás a la 1.2. P-25 a la 015. Falta el cambio de canal del cliente y la publicación y vuelta atrás de la 030 |
| 016 · M-2 | CERRADO | REQ-002 y CA-002 (tres casos y procedencia no establecible). P-26 lleva a NC-2 el identificador del borrador |
| 016 · m-1 | CERRADO | REQ-017 (lista de permitidas) y CA-019 |
| 016 · m-2 | CERRADO | REQ-008 (filtros y etiquetas exactas al dejar el correo de cortesía) y CA-010; coherente con REQ-009 y CA-017 de la 017 |
| 017 · m-1 | CERRADO | REQ-023, CA-022; coherente con REQ-014 y CA-021 de la 016 |
| 017 · m-2 | CERRADO | REQ-012, CA-017; P-16 (A-21) y P-17 |
| 018 · m-1 | CERRADO | REQ-021, CA-021; P-11 |
| 018 · m-2 | CERRADO | REQ-001, REQ-003, CA-001, CA-016; P-12 |

## Valoración de la frase añadida a REQ-026

«Si no se puede saber si hay una cuenta así, se trata como si la hubiera» es correcta y necesaria (art. 3). HumanaIA no tiene medio fiable de saber que una cuenta no tiene la compuerta: la instala el dueño sin HumanaIA (REQ-011 de la 017), desactivada no consulta el interruptor (REQ-010) y a HumanaIA solo llegan el interruptor y la cifra (REQ-015). En la práctica, ningún canal con cuentas de Gmail puede pasar a una versión que pida navegador con la sesión de Google o envío en conversación desde que existe la guía de instalación. Coste operativo: la vuelta atrás desde la primera versión con la 016 dejará el canal sin instrucciones. Redactada así, la frase admite una lectura peligrosa (N-2).

## Hallazgos nuevos

| N.º | Gravedad | Dónde · art. | Escenario | Corrección mínima en texto |
| --- | --- | --- | --- | --- |
| N-1 | MAYOR | REQ-026, CA-029, `propuestas.md` P-25 · arts. 8 y 9 · A-12 y A-13 | La corrección protege el canal, no la cuenta. La 030 deja a un superadmin con doble factor cambiar el canal de un cliente (requisito 13 de la 030), y se aplica en la siguiente revisión del agente. La publicación y la vuelta atrás del panel están en la 030 (requisitos 16, 17 y 20), no en la 015, y la vuelta atrás de la 030 admite cualquier versión vigente antes; P-25 solo se dirige a la 015. Escenario de despliegue normal: la primera versión con la 016 va a `prueba`, `estable` sigue con la 1.2. Un cliente de `prueba` instala la compuerta; el superadmin lo pasa a `estable`; su agente recibe la 1.2 (navegador con la sesión y envío en conversación) con la compuerta instalada: vuelve el escenario de B-1. Mientras ninguna versión cumpla, `estable` sirve la 1.2 y nada impide que un cliente de ese canal instale la compuerta | REQ-026: «La condición del prompt rige por cuenta: una cuenta con la compuerta instalada no recibe una versión que pida navegador con la sesión del dueño en Google o envío en conversación, ni por publicación o vuelta atrás en su canal (015 y 030), ni por cambio de canal del cliente (requisito 13 de la 030). Ese cambio de canal se rechaza. No se ofrece la guía de instalación a una cuenta cuyo canal sirva una versión así». CA-029: cuenta de prueba con la compuerta instalada en `prueba` y la 1.2 vigente en `estable`: pasar el cliente a `estable` se rechaza y queda anotado; con la 1.2 vigente, 0 guías ofrecidas. P-25: ampliarla a la 030 (requisitos 13, 16, 17 y 20) |
| N-2 | MENOR | REQ-026, CA-029 · arts. 3 y 8 | La frase no dice qué es «saber». La implementación natural toma como registro de cuentas con compuerta las licencias que consultan el interruptor o envían la cifra; antes del piloto no se puede activar ninguna y una compuerta desactivada no consulta: el registro estaría vacío y la vuelta atrás a la 1.2 pasaría, con cuentas con la compuerta instalada sin activar (sin la declaración de REQ-017 y con el permiso de envío ya concedido) | REQ-026: «Que una cuenta no consulte el interruptor ni envíe la cifra no prueba que no tenga la compuerta. Una cuenta de Gmail cuenta como sin compuerta solo con una constancia positiva que no dependa de esa falta de señales; si no, se trata como instalada». CA-029: compuerta instalada sin activar y sin consulta ni cifra (simulada): paso del canal o del cliente a la 1.2 rechazado |

## Lo que no se reabre

Decisiones de la coordinación (borrador del agente y delegado no cuentan, «leído» exento); cuestión 1 de la 017; aceptación del riesgo residual de la 018; lo enviado al piloto (NC-2, NC-4, NC-11, NC-13, REQ-017) y al diseño (permiso de lectura de lo aprendido, dónde se guarda la pausa, etiquetas que pone Gmail). Si Gmail añade «Importante» o una categoría al correo de cortesía, la comprobación de etiquetas exactas no se supera y la compuerta no envía: falla cerrado (disponibilidad, no seguridad).

Privacidad (art. 1): nada de lo corregido llega a HumanaIA. Para N-1 y N-2 bastan licencia, canal y constancia de instalación, sin datos del correo.

**No comprobado:** si la compuerta desactivada o antes del piloto manda alguna señal a HumanaIA; si la 030 (cuestiones 1, 3, 6 y 7 abiertas) deja cambiar de canal o volver atrás sin otra comprobación (solo leídos sus requisitos 13, 16, 17 y 20); si Gmail añade etiquetas propias; dudas ya llevadas al piloto.

**Sin bloqueantes. 1 MAYOR (N-1) abierto.**
