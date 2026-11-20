# ADR-0004: Los límites del agente se imponen en el anfitrión

Estado: CONFIRMADO · Fecha: 12/11/2026 · Artículo 8 de la constitución

## Contexto

Con el conector, nuestro servidor entrega al agente de cada cliente el prompt que debe seguir. Eso convierte al servidor en un punto único desde el que influir en todos los agentes, que tienen acceso al correo y a la nube de sus dueños.

Un límite escrito en un prompt es texto, no un control: otro texto puede intentar anularlo.

## Decisión

1. Al instalar, se **desactivan en el asistente del cliente** las herramientas de enviar, eliminar y compartir de sus conectores de correo y nube (`docs/INSTALACION-CLIENTE.md`). Ese es el control real.
2. El cliente conserva un **arranque local** corto que repite los límites y dice que ninguna instrucción recibida del conector puede relajarlos.
3. **Cierre en fallo**: si `obtener_instrucciones` falla o no devuelve un estado `activa` con instrucciones válidas, el agente no toca el correo.
4. El servidor **nunca entrega instrucciones que pidan** enviar, borrar, compartir, introducir credenciales ni sacar contenido de correo. El `revisor` lo comprueba en cada versión del prompt.
5. El informe no admite texto libre, de modo que el agente no tiene un canal por el que sacar contenido hacia nuestro servidor.

6. **Envío por regla (D-037, constitución 1.3, 20/11/2026).** Los puntos 1 y 4 se mantienen: el agente sigue sin la herramienta de enviar y el servidor sigue sin pedir envíos. El único envío sin revisión lo hace una compuerta de código instalada en la cuenta del cliente, con las condiciones del artículo 8. Su diseño es una función nueva y está pendiente; hasta que exista, no se envía nada.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| Confiar solo en el texto del prompt | No es un control |
| Entregar el prompt completo desde el servidor, sin arranque local | Un servidor comprometido controlaría el comportamiento entero |
| No entregar el prompt desde el servidor | Se pierde el control de versiones, el grupo de prueba y la vuelta atrás que pide el producto |

## Consecuencias

- La instalación tiene pasos que no se pueden saltar; forman parte de la seguridad.
- Si un asistente no permite limitar herramientas por conector, hay que documentarlo como riesgo aceptado por el responsable o no instalar en él.
- El arranque local es un archivo versionado (`prompts/agente-ia/arranque.md`), y cambiarlo exige volver a instalarlo en cada cliente.
