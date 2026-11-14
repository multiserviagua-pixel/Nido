# 011 · Aclaraciones

Cuestiones presentadas al responsable el 12/11/2026. **Tienen respuesta la n.º 11 y, en parte, la n.º 1; las demás siguen abiertas.** Una respuesta supuesta no vale: mientras la columna «Respuesta» esté vacía, la cuestión sigue abierta y la función sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`, donde están las opciones y la consecuencia de cada una. La columna «Recomendación» es del orquestador; no es una decisión.

Tipos:

- **R**: la decide el responsable ahora (puerta P0).
- **F1**: la decide la fase 1 (función 001); esta función hereda la respuesta.
- **V**: depende de verificar una decisión (skill `verificar-decision`) antes de diseñar. Se lleva al responsable en la puerta P1, con el resultado.
- **D**: es del diseño. Se lleva en la puerta P1.
- **Resuelta**: se contesta con el repositorio o es reparto interno del trabajo. Se cita la fuente.

| N.º | Cuestión | Tipo | Recomendación del orquestador | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Qué se entrega en `pausada` y en `suspendida` (D-013) | R | Sin prompt ni reglas en los dos estados. La orden va con `activa` y con `pausada` (si no, una orden `pausar` nunca se podría confirmar) y no con `suspendida`. Es la misma cuestión que el n.º 1 de la 012 y la cuestión 4 de la 001: si ya está contestada en el chat de la fase 1, vale esa respuesta | A la pregunta «¿En pausa el agente no revisa, aunque su dueño se lo pida en conversación?»: «Sí, no revisa» | Responsable, 12/11/2026 | Respondida en parte. Ningún requisito cambia: REQ-008 ya dejaba las instrucciones nulas en `pausada` y `suspendida`. Sigue abierto en qué estados va la orden (REQ-012): la recomendación es con `activa` y `pausada`, y no con `suspendida` |
| 2 | Tres herramientas o dos (D-009) | F1 | Se hereda de la fase 1. Si se unen, los requisitos de `confirmar_orden` pasan a `enviar_informe` | | | |
| 3 | Anotación de solo lectura de `obtener_instrucciones` | F1 | Se hereda de la fase 1 | | | |
| 4 | Código de problema desconocido, repetido o más de cinco | R | Descartar el código y sumarlo a la cifra de descartados; el informe se guarda. Perder el informe entero deja al agente como «sin informe» por un detalle. Hay que alinear contrato y modelo (P-04) | | | |
| 5 | Valores con mayúsculas | R | Aceptarlos normalizados a minúsculas; después de normalizar tienen que estar en la lista cerrada. Se anota en el contrato | | | |
| 6 | Plazo máximo para el informe | R | Sin plazo en la fase 2. Solo la misma conexión puede cerrar su ejecución y solo una vez; un informe tardío cierra la ejecución y la alerta de la 013 se resuelve. No hace falta un motivo nuevo en el contrato | | | |
| 7 | Versión declarada en el informe distinta de la servida | R | Guardar la declarada. La servida ya queda anotada en la ejecución, así que la diferencia se puede ver sin campo nuevo; qué usan las métricas lo decide la fase 4 | | | |
| 8 | Umbrales de uso y límite por dirección de origen | R | Provisionales hasta ver el uso real de la fase 1: 60 peticiones por conexión y hora, y 64 KiB de tamaño máximo de petición. El límite por dirección de origen lo cubre la 014 en los puntos que no llevan token (activación, registro de clientes, emisión de tokens); la 011 no lo duplica | | | |
| 9 | Llamadas repetidas a `obtener_instrucciones` | R | Abrir siempre una ejecución nueva. El ruido lo absorbe la regla de una sola alerta abierta por cliente y tipo (013) | | | |
| 10 | Informe y confirmación con la licencia no vigente | R | Aceptarlos: el informe de una ejecución servida como `activa` antes de la suspensión es legítimo. Las ejecuciones servidas como `pausada` o `suspendida` no esperan informe (n.º 13 de la 012) | | | |
| 11 | Qué versión sirve el conector en la fase 2 | R | Una versión ficticia cargada con los datos de prueba, en desarrollo y en el entorno previo. En producción no se sirve nada hasta que la fase 4 registre la 1.3 por despliegue | A la pregunta «¿En la fase 2 el conector sirve solo una versión ficticia, y nada en producción?»: «Adelantar registro». Era la otra opción ofrecida: traer a la fase 2 un registro mínimo por despliegue para servir la 1.3 real | Responsable, 12/11/2026 | Respondida, en sentido contrario a la recomendación. El registro por despliegue deja de estar fuera de la fase 2: lo especifica la función nueva 015. «Fuera de alcance» y «Dependencias» de la 011 remiten a ella. El cambio de plan va a coordinación (propuesta P-15). En producción no se aplica nada durante la fase 2 (n.º 16 de la 010, respondida el mismo día: «No, solo pruebas») |
| 12 | Canal `prueba` sin versión publicada | R | Mantener el respaldo: se sirve la del canal `estable` | | | |
| 13 | Qué se hace si la identidad propia del conector no es viable (V-107) | V | Se verifica antes de diseñar y se lleva al responsable con el resultado. Va unida al n.º 11 de la 010 | | | |
| 14 | Respuesta cuando no se puede calcular el estado | R | Error de la herramienta con código cerrado y sin estado. «Siempre un estado explícito» se entiende para las llamadas que el servidor puede evaluar; el arranque local trata cualquier error como cierre en fallo. No hay que cambiar el contrato | | | |
| 15 | Cliente sin reglas guardadas | R | Tratarlo como dato incoherente: no se responde `activa`. Las reglas, con sus valores por defecto, se crean al crear el cliente | | | |
| 16 | Qué órdenes se pueden confirmar | R | Solo una orden ya entregada y sin confirmar del cliente. Una orden que el agente no ha recibido no se puede dar por aplicada | | | |
| 17 | Licencia revocada: «no autorizado» o `suspendida` | R | Tratarla como token inválido. La revocación es definitiva y la conexión muere. «Recibe el estado» se aplica a la licencia suspendida o caducada y al cliente de baja | | | |
| 18 | Identificadores en los registros | R | Registrar el identificador interno de la conexión, derivado del token y nunca recibido. No el nombre del cliente. Sin él no se puede diagnosticar a un cliente concreto | | | |
| 19 | Quién escribe las operaciones del conector en la base de datos | Resuelta | Es reparto interno del trabajo, no una decisión de producto. La 011 es dueña del comportamiento de las tres operaciones y de sus pruebas; la 010, de la estructura, los roles, los permisos y la prueba de que nada más es ejecutable. Las tareas se ordenan para que no toquen la misma migración, y el reparto se enseña en la puerta P1 | Fuente: alcance de las funciones 010 y 011 | Orquestador, 12/11/2026 | Sin cambios |
| 20 | Argumentos ajenos fuera del informe | D | Ignorarlos sin contarlos, porque esas respuestas no tienen dónde llevar la cifra. Se lleva en la puerta P1, con el contrato | | | |
| 21 | Objetivo de latencia | R | Usar ya el propuesto (95 % en menos de 1 segundo) como umbral provisional. La fase 4 fija el definitivo | | | |
| 22 | Añadida por el orquestador. REQ-033 deniega toda petición si no se puede comprobar el límite de uso: si ese mecanismo falla, el conector entero deja de servir | R | Mantenerlo: es el cierre en fallo del artículo 3, y un agente que no recibe instrucciones no toca el correo. El diseño elige un mecanismo cuyo fallo sea raro (V-113) y la supervisión avisa | | | |

## Decisiones que salen de aquí

Pendiente de las respuestas. Las que deban quedar en `docs/TECNOLOGIAS.md` (D-013 entre ellas) las anota el chat de coordinación; se le pasan por `propuestas.md`.
