# 014 · Aclaraciones

Cuestiones presentadas al responsable el 12/11/2026. **Tiene respuesta, en parte, la n.º 24; las demás siguen abiertas.** Una respuesta supuesta no vale: mientras la columna «Respuesta» esté vacía, la cuestión sigue abierta y la función sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`, donde están las opciones y la consecuencia de cada una. La columna «Recomendación» es del orquestador; no es una decisión.

Las cifras recomendadas son provisionales hasta ver los resultados de la prueba real de la fase 1.

Tipos:

- **R**: la decide el responsable ahora (puerta P0).
- **F1**: depende de lo que muestre la prueba real de la fase 1 (función 001).
- **V**: depende de verificar una decisión (skill `verificar-decision`) antes de diseñar. Se lleva al responsable en la puerta P1, con el resultado.
- **D**: es del diseño. Se lleva en la puerta P1.

| N.º | Cuestión | Tipo | Recomendación del orquestador | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Vida del código de activación (C) | R | 15 minutos. Da margen a una instalación que se complica y el límite de intentos cubre la ventana | | | |
| 2 | Formato y entropía del código y de los tokens | D | Mínimos: 60 bits para el código (12 caracteres en grupos de 4, sin caracteres que se confundan) y 256 bits para los tokens. El formato exacto se lleva en la puerta P1 | | | |
| 3 | Vida definitiva del token de acceso (A) | R | 30 minutos. Una revisión normal cabe en un solo token, hay menos renovaciones a mitad de una ejecución desatendida y la revocación sigue siendo inmediata, porque cada petición comprueba la conexión | | | |
| 4 | Días de inactividad antes de exigir una activación nueva (D) y vida máxima absoluta | R | 90 días, sin vida máxima absoluta. Cada reinstalación necesita a una persona de HumanaIA; un token de renovación robado se detecta en cuanto el agente legítimo renueva | | | |
| 5 | Duración de la ventana de gracia (G) | R | 60 segundos, como dice el ADR-0002 | | | |
| 6 | Qué devuelve la ventana de gracia | R | Un par nuevo por petición; al usar cualquiera de ellos se anulan los demás. Mantiene intacto «solo HMAC» (A-05). Obliga a corregir la frase «devuelve el mismo par» del ADR-0002 y de la arquitectura | | | |
| 7 | Umbrales y alcance del límite de intentos | R | Por origen: 5 fallos en 15 minutos bloquean 15 minutos, sin escalado. Además, un umbral global (50 fallos en una hora) que no bloquea, solo abre la alerta: así un atacante no puede parar todas las instalaciones | | | |
| 8 | Límite de peticiones en registro, autorización y tokens, y reparto con la 011 | D | El límite por conexión sobre las herramientas es de la 011. Aquí, ojo con un hecho: los asistentes llaman al registro y a la emisión de tokens desde direcciones que comparten todos sus clientes, así que ahí el límite se cuenta por conexión o por cliente OAuth, no por dirección. Por dirección solo en la pantalla de activación. Las cifras se llevan en la puerta P1 | | | |
| 9 | Si se guarda la dirección de origen y cómo | V | Nunca en claro. Si V-113 se resuelve en la plataforma, no se guarda en la base de datos; si se resuelve con un contador propio, se guarda como huella con secreto y se borra al acabar el bloqueo | | | |
| 10 | Máximo de conexiones vivas por licencia | R | Tres. Cubre dos asistentes y el cambio de uno, y limita el daño de un código robado. Si hay clientes con más cuentas por licencia, hace falta que el responsable lo diga | | | |
| 11 | Si un código nuevo anula los anteriores sin usar | R | Sí. Como mucho un código vivo por licencia | | | |
| 12 | Si reactivar el mismo asistente revoca la conexión antigua | R | No. Solo se conoce el tipo de asistente, no la cuenta, y un ladrón con un código expulsaría a la conexión legítima. La antigua se revoca a mano, como dice la guía de instalación | | | |
| 13 | Si una conexión revocada puede volver a activarse | R | Nunca. Toda vuelta exige un código nuevo y una conexión nueva | | | |
| 14 | Cuándo nace la conexión | D | Al aceptar el código, como en el modelo: es una sola operación indivisible y auditable. Qué se hace con una conexión que no llega a recibir tokens se lleva en la puerta P1 | | | |
| 15 | Si se consume un código válido cuando la licencia no está vigente | R | No se consume. La respuesta es la genérica y el instalador puede reintentar en cuanto se corrija la licencia | | | |
| 16 | Identidad del servidor de autorización ante la base de datos | V | Un rol propio de autorización con funciones dedicadas, distinto del rol del conector. Depende de V-107; se lleva al responsable con el resultado y exige ampliar el ADR-0003 | | | |
| 17 | Conexiones de la prueba de la fase 1 | R | Se descartan. Cada asistente de prueba se activa de nuevo con un código | | | |
| 18 | Cómo se generan códigos en la fase 2, sin panel | R | Un procedimiento escrito que ejecuta una persona con acceso al entorno, auditado, y solo en desarrollo y en el entorno previo, con licencias ficticias | | | |
| 19 | Si una licencia suspendida o caducada sigue renovando tokens | R | Sí. El agente sigue recibiendo `suspendida`, como pide la fase 1, y al reactivar funciona sin reinstalar. En una baja, las conexiones se revocan (guía de instalación), así que no renuevan | | | |
| 20 | Aviso al cliente cuando se revoca su conexión | R | Ninguno en la fase 2. Lo deciden las fases 4 (aviso fuera del panel) y 5 (su dashboard) | | | |
| 21 | Severidad de cada alerta y agrupación | R | `conexion_nueva`, informativa; `token_reutilizado`, crítica; `intentos_activacion` y `renovacion_fallida`, aviso. Una alerta por suceso en las dos primeras (cada conexión nueva importa); una abierta por tipo y cliente en las otras dos, con el recuento en la auditoría | | | |
| 22 | Qué renovaciones fallidas abren `renovacion_fallida` | R | Solo cuando una conexión no revocada pierde el acceso por inactividad: avisa de un agente que se ha quedado fuera. Los errores internos van a la supervisión, no a las alertas de clientes | | | |
| 23 | Si se audita cada renovación normal | R | No. Solo los sucesos del requisito de auditoría | | | |
| 24 | Plazos de purga (R, P) | R | 30 días para códigos y tokens que ya no valen (igual que el n.º 7 de la 010) y 90 días para clientes OAuth sin uso ni conexiones vivas | A la pregunta «¿En la fase 2 se purgan solo los códigos y tokens que ya no valen, a los 30 días?»: «Sí, solo eso» | Responsable, 13/11/2026 | Respondida en parte. El plazo R queda en 30 días. Sigue abierto el plazo P de los clientes OAuth sin uso |
| 25 | Qué pasa al rotar el secreto del HMAC | R | Periodo de transición con dos secretos, probado. Invalidarlo todo obligaría a reinstalar a cada cliente con una persona delante | | | |
| 26 | Otros indicios de robo | R | Un código de autorización canjeado dos veces: rechazar, revocar la conexión creada con él y alertar. Un verificador incorrecto o un token de renovación presentado por otro cliente OAuth: solo rechazar y auditar | | | |
| 27 | Petición de autorización sin indicar el recurso | F1 | Rechazar, salvo que la prueba real muestre que un asistente admitido no lo envía | | | |
| 28 | Callback de ChatGPT con identificador variable | F1 | Esperar a la prueba real. Si se confirma el formato, admitir un identificador de formato fijo bajo ese prefijo y, después, coincidencia exacta con el registrado | | | |
| 29 | Objetivo de latencia y carga de prueba (L, N) | R | Provisional: 95 % de las renovaciones en menos de 1 segundo y de las activaciones en menos de 2, con 5 peticiones por segundo durante 10 minutos | | | |
| 30 | Vida de la solicitud en pantalla (S) y del código de autorización (V) | R | 10 minutos y 60 segundos | | | |

## Decisiones que salen de aquí

Pendiente de las respuestas. Las cifras y comportamientos de los n.º 1 a 7, 19, 25 y 28 deberían quedar en `docs/TECNOLOGIAS.md`; las anota el chat de coordinación y se le pasan por `propuestas.md`.
