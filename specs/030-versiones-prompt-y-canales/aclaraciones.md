# 030 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 4. **Ninguna tiene respuesta todavía.** La columna «Recomendación» es del orquestador y no es una decisión.

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 1 | Permanencia mínima en `prueba` | **A.** 3 días seguidos vigente en `prueba` y al menos 10 informes recibidos; si no llega a 10, se espera hasta que llegue. **B.** Solo tiempo (3 días): más simple, pero una versión que nadie ha ejecutado podría pasar a todos. **C.** 7 días y 20 informes: más garantía, cada cambio tarda una semana. | **A.** Cuenta el informe recibido, no la instrucción servida. El plazo corre desde la última publicación de esa versión en `prueba` y se reinicia si deja de estar vigente |
| 2 | Excepción de urgencia para saltarse la permanencia | **A.** No existe: ante un fallo grave se usa la pausa global y la vuelta atrás, que son inmediatas, y el arreglo pasa por `prueba`. **B.** Existe, solo para el responsable, con aviso reforzado: más rápida, pero es justo la puerta que usaría quien robe una cuenta. | **A** |
| 3 | Quién publica en `estable` | **A.** Cualquier superadmin con doble factor. **B.** Solo la cuenta del responsable; `prueba` y vuelta atrás, cualquier superadmin. **C.** Dos personas: una propone y otra distinta aprueba; exige que haya al menos dos superadmin disponibles. | **B**, que es lo que dice la skill `version-prompt`. Si va a haber dos o más superadmin, **C** protege mejor frente a una cuenta robada. Hace falta saber cuántos superadmin habrá |
| 4 | Aviso de publicación: quién lo recibe y por qué canal | **A.** Correo a una lista fija puesta en la configuración del entorno (no editable desde el panel): el responsable y al menos una segunda dirección. **B.** Mensajería (Telegram, Slack o similar): más inmediato, añade un tercero que puede estar fuera de la UE. **C.** Las dos. | **A**, con plazo máximo de 5 minutos. El proveedor de correo con alojamiento en la UE se verifica en el diseño (V-111); no está elegido. Hace falta saber qué direcciones |
| 5 | Si el aviso no se puede enviar | **A.** Publicar (en `prueba` o en `estable`) no se aplica si el aviso no sale; la vuelta atrás se aplica siempre y el aviso se reintenta con alerta. **B.** Todo se aplica y el aviso se reintenta: una caída del correo no frena nada, pero una publicación podría pasar sin aviso. **C.** Todo se bloquea: una caída del correo impediría la vuelta atrás en un incidente. | **A** |
| 6 | Grupo de prueba | Quién lo forma, cuántos como máximo, si se les informa, en qué canal entra un cliente nuevo y si cambiar un cliente a `prueba` genera aviso. | Una cuenta propia de HumanaIA y entre 1 y 3 clientes informados y conformes; tope de 5 clientes en `prueba`; los clientes nuevos entran en `estable`; pasar un cliente a `prueba` lo hace un superadmin con doble factor, queda en auditoría y genera aviso. Hace falta saber qué clientes |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 7 | A qué versiones se puede volver atrás | A cualquiera que ya haya estado vigente en ese mismo canal y no esté retirada. Exenta de la permanencia, porque ya la cumplió | La vuelta atrás no sirve para saltarse `prueba` |
| 8 | Versiones retiradas | Sí: un superadmin puede marcar una versión como retirada; no se puede publicar ni volver a ella; la marca no se quita desde el panel y genera aviso | Evita volver por error a una versión que ya dio problemas. Para reutilizar el texto se registra una versión nueva |
| 9 | Leer el texto en el panel | Sí, solo lectura y solo superadmin con doble factor | Permite comprobar qué se está sirviendo sin ir al repositorio |
| 10 | Canal `prueba` sin publicación | Sus clientes reciben la versión vigente de `estable`. Si no hay ninguna versión aplicable, el agente recibe un estado sin instrucciones | Un cliente de prueba nunca se queda parado porque no haya nada en prueba. Qué estado se devuelve afecta al contrato de la fase 2: va en `propuestas.md` |
| 11 | Discrepancia en una versión vigente | Si el texto guardado no produce su huella, se deja de servir (cierre en fallo) con alerta crítica y aviso. Si solo difiere del repositorio, se sigue sirviendo el texto registrado, se bloquean publicaciones nuevas de esa versión y se alerta. Comprobación diaria además de en cada despliegue | Un texto alterado en la base de datos nunca llega a un agente |
| 12 | Aviso al registrar una versión | Sí | Los destinatarios saben que hay un texto nuevo disponible antes de que nadie lo publique |
| 13 | Criterios de promoción | El sistema impone la permanencia y muestra la comparación de la función 031. La decisión es de la persona. Si las métricas son peores, promover exige marcarlo expresamente y queda en auditoría y en el aviso | «Ninguna incidencia de clientes» no lo puede comprobar el sistema |
| 14 | Formato del número de versión | `mayor.menor`, con un tercer número opcional para erratas, como ya admite el contrato del informe | Hay que alinear la skill `version-prompt` (coordinación) |
| 15 | Alcance de la inmutabilidad | Suficiente con la revisión de ruta crítica, la rama protegida y la comprobación de coincidencia | Un cambio de esquema o un acceso directo de administración a la base de datos quedan fuera de «vías de la aplicación»; la comprobación los detecta |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Permanencia mínima en `prueba` | Sin respuesta | — | Pendiente (REQ-017, CA-012) |
| 2 | Excepción de urgencia | Sin respuesta | — | Pendiente (REQ-017, REQ-046) |
| 3 | Quién publica en `estable` | Sin respuesta | — | Pendiente (REQ-019, CA-013) |
| 4 | Aviso: destinatarios, canal y plazo | Sin respuesta | — | Pendiente (REQ-022, CA-016) |
| 5 | Si el aviso no se puede enviar | Sin respuesta | — | Pendiente (REQ-026, CA-018) |
| 6 | Grupo de prueba | Sin respuesta | — | Pendiente (REQ-012, REQ-013) |
| 7 | Vuelta atrás | Sin respuesta | — | Pendiente (REQ-020) |
| 8 | Versiones retiradas | Sin respuesta | — | Pendiente (requisito nuevo si la respuesta es sí) |
| 9 | Lectura del texto en el panel | Sin respuesta | — | Pendiente (REQ-029) |
| 10 | Canal sin publicación | Sin respuesta | — | Pendiente (REQ-053, CA-033) |
| 11 | Discrepancia en una versión vigente | Sin respuesta | — | Pendiente (REQ-007, REQ-043) |
| 12 | Aviso al registrar | Sin respuesta | — | Pendiente (requisito nuevo si la respuesta es sí) |
| 13 | Criterios de promoción | Sin respuesta | — | Pendiente (REQ-017) |
| 14 | Formato del número de versión | Sin respuesta | — | Pendiente (REQ-002) |
| 15 | Alcance de la inmutabilidad | Sin respuesta | — | Pendiente (REQ-008) |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Ninguna todavía. Cuando haya respuesta, se pasan a coordinación por `propuestas.md`: este chat no edita el registro de decisiones.
