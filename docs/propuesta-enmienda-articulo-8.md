# Propuesta de enmienda del artículo 8: envío por regla

Estado: **RATIFICADA la opción B** el 20/11/2026 (D-037, constitución 1.2), por instrucción del responsable: «hay que modificar esto para que trabaje como lo pedí». Aplicado en `docs/CONSTITUCION.md`, `docs/TECNOLOGIAS.md` y el ADR-0004. El resto de la tabla «Qué habría que cambiar» sigue pendiente.

**El dictamen del `auditor-seguridad` llegó después de la ratificación: APTO CON CONDICIONES**, con dos hallazgos bloqueantes sobre el texto que se ratificó. Está en el apartado «Dictamen del auditor-seguridad», al final. Sustituir el texto del artículo 8 por la redacción del auditor queda a decisión expresa del responsable.

**Opción elegida por el responsable el 20/11/2026: B, compuerta de código.** Respuesta expresa en el chat de la campaña a la pregunta «¿Qué opción eliges para el envío por regla?». Elegir la opción no ratifica la enmienda: faltan el dictamen del `auditor-seguridad` y la ratificación expresa del texto del artículo.

Redactada en el chat de la campaña de marketing a petición del responsable («Quiero que envíe», «Sí, como allí»). No cambia nada por sí sola: la constitución, los ADR, las especificaciones y los contratos siguen como estaban. Solo el responsable puede enmendar la constitución (artículo 14), y este cambio toca una ruta crítica, así que necesita dictamen del `auditor-seguridad` antes de ratificarse.

## Qué se pide

Que el agente de correo pueda enviar sin revisión en ciertos casos, como hace NestAdmin 2.

## Qué dice hoy este proyecto

| Documento | Qué dice |
| --- | --- |
| Constitución, artículo 8 | Enviar, borrar y compartir se impiden en los permisos de los conectores del cliente. Nada de lo que entregue el servidor puede relajarlo |
| ADR-0004, puntos 1 y 4 | Al instalar se desactiva la herramienta de enviar: «ese es el control real». El servidor nunca entrega instrucciones que pidan enviar |
| `specs/012`, REQ-017 y REQ-055 | La versión 1.3 no contiene ninguna instrucción de enviar y retira la excepción de la 1.2 (respuesta del responsable del 12/11/2026) |
| `docs/INSTALACION-CLIENTE.md`, paso 4 | Se desactiva enviar, eliminar y reenviar automático |

En el repositorio y en sus 242 commits no hay ninguna mención a envío automático.

## Qué hace NestAdmin 2

Fuente: `specs/v1/requisitos.md` y `specs/v1/decisiones.md` de ese proyecto, leídos el 20/11/2026.

| Regla | Qué dice |
| --- | --- |
| R07 | Enviar requiere revisión por defecto. Solo una regla concreta, activa y aplicable permite automatizar, y una regla de envío exige indicar el remitente. Cada decisión queda en un historial visible |
| D17, D123, D126 | Una regla de envío tiene condiciones cerradas: una categoría del catálogo y un remitente (dirección exacta o dominio exacto). Solo automatiza si coincide una única regla activa. Cualquier dato dudoso manda a revisión |
| D177 | Las categorías «otros» y «reclamación» son solo de revisión: ninguna regla puede enviar en ellas |
| R27 | Ninguna regla envía a un remitente automático, con señales sin comprobar, a un correo que no pide respuesta, en una redacción pedida ni con un borrador marcado |
| R28 | Una batería de correos con instrucciones ocultas debe terminar con cero envíos no autorizados |
| R30 | En la primera carga empareja hasta 50 correos recibidos con la respuesta propia en Enviados, aprende cómo responde el negocio y propone reglas. Un solo clic las acepta y las activa. Los 3 primeros envíos de cada regla aprendida pasan por revisión («rodaje»), y se pueden desactivar todas de una vez |
| R31 | Sigue aprendiendo de las respuestas que la persona envía después |
| R24 | Las sugerencias de reglas se calculan por código. El texto de un correo no puede provocar una regla |

En NestAdmin 2 no existe una lista de «casos críticos». Los casos son las reglas que el dueño acepta, cada una con su categoría y su remitente.

## Por qué no se puede copiar tal cual

En NestAdmin 2 toda la compuerta de envío es **código propio** que se ejecuta en el equipo: la IA solo clasifica y redacta, y es el programa quien decide si envía. El motivo de D17 lo dice así: «condiciones comprobables por código sobre datos validados».

En este proyecto no hay código nuestro entre el modelo y el correo. El agente es el Claude o el ChatGPT del cliente, que usa su propio conector de correo. Solo existen dos controles:

1. Los permisos de las herramientas del conector, que son de todo o nada: enviar está permitido o no lo está, sin distinguir casos.
2. El texto del prompt.

Además, el artículo 1 impide que nuestro servidor guarde direcciones de remitentes, así que las reglas de envío no pueden vivir en nuestra base de datos.

## Opciones

| Opción | Cómo sería | Qué exige | Riesgo |
| --- | --- | --- | --- |
| **A. Control en el texto** | Se activa enviar en el conector del cliente. Las condiciones de NestAdmin 2 se escriben en el prompt. Las reglas (categoría y remitente) viven en el archivo de contexto de la nube del cliente | Relajar el artículo 8 y cambiar el ADR-0004 en sus puntos 1 y 4 | La compuerta la evalúa el mismo modelo que lee correo de desconocidos. Con el permiso activado, un correo que consiga engañarlo puede hacer que envíe cualquier cosa a cualquiera desde la cuenta del cliente. Las pruebas reducen ese riesgo, no lo eliminan |
| **B. Control en código** | El agente sigue sin poder enviar. Deja el borrador y lo marca como candidato. Una compuerta de código instalada en la cuenta del cliente comprueba las condiciones y solo entonces envía | Aclarar el artículo 8, sin relajarlo para el agente. Una función nueva con su ciclo SDD | Lo enviado sigue siendo texto escrito por un modelo, pero solo puede ir a quien escribió primero y está en una regla aceptada. No hay salida hacia terceros |
| **C. No cambiar este agente** | El envío por regla queda como función de NestAdmin 2. Este agente deja siempre borradores | Nada | Ninguno nuevo |

## Recomendación

**B**, si se quiere envío por regla en este producto. Es la única que reproduce lo que hace NestAdmin 2: que decida un código y no un modelo.

**A no se recomienda.** Quita el único control real que tiene hoy el agente y contradice el motivo de la propia decisión D17 de NestAdmin 2.

Costes de B que conviene conocer antes de elegir:

- Hay que instalar algo en la cuenta del cliente. Para esos clientes, el agente deja de ser «sin instalación».
- La vía para Gmail (Apps Script) y la de Outlook están en estado VERIFICAR: hay que comprobarlas en documentación oficial antes de diseñar (skill `verificar-decision`).
- Es una función nueva completa, con batería de inyección como la de R28.

## Texto propuesto del artículo 8 (opción B)

Lo nuevo va en negrita.

> 8. **Límites del agente en su anfitrión.** Lo que el agente del cliente no puede hacer (enviar, borrar, compartir) se impide en los permisos de los conectores del cliente y se repite en su arranque local. Nada de lo que entregue el servidor puede relajarlo. **El único envío sin revisión admitido lo decide una compuerta de código instalada en la cuenta del cliente, nunca el agente. La compuerta solo responde al remitente del propio hilo, solo con una regla que el dueño ha aceptado (categoría de una lista cerrada y remitente exacto), y ante cualquier duda no envía. El agente no puede activarla, cambiarla ni saltársela, y el dueño puede desactivarla en cualquier momento.**

Fila para la tabla de enmiendas:

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.2 | (la de la ratificación) | Enmienda del responsable: admite el envío sin revisión por regla, decidido por una compuerta de código y nunca por el agente. Motivo: igualar el comportamiento de NestAdmin 2 |

## Qué habría que cambiar si se aprueba B

| Documento | Cambio |
| --- | --- |
| `docs/CONSTITUCION.md` | Artículo 8 y fila de enmienda. Lo escribe la coordinación a instrucción expresa del responsable |
| `docs/TECNOLOGIAS.md` | Decisión nueva y las dos comprobaciones en estado VERIFICAR |
| `docs/adr/0004-limites-en-el-anfitrion.md` | Añadir la compuerta como único camino de envío. Los puntos 1 y 4 se mantienen |
| `docs/SEGURIDAD.md` | Amenazas nuevas: regla manipulada, compuerta saltada, respuesta con contenido inyectado |
| `specs/` | Función nueva para la compuerta, con las condiciones de R27, el rodaje de R30 y la batería de inyección |
| `specs/012` | El agente marca candidatos. REQ-017 y REQ-055 se mantienen: el agente sigue sin enviar |
| `contratos/` | Una cifra nueva en el informe (envíos por regla) y, si hace falta, una regla booleana para activarlo por cliente. Sin direcciones ni texto (artículo 1) |
| `docs/INSTALACION-CLIENTE.md` | Paso opcional para instalar la compuerta. El paso 4 no cambia |
| `specs/052` | Condiciones del servicio: quién responde de un envío hecho por regla |

## Qué queda por decidir

1. **La opción:** A, B o C.
2. **Qué son los «casos críticos».** En NestAdmin 2 son las reglas que el dueño acepta. ¿Es eso, o hay una lista fija de casos?
3. **Categorías que nunca envían solas.** NestAdmin 2 excluye «otros» y «reclamación». Este agente ya excluye bancos, Hacienda, Seguridad Social, juzgados y temas personales o médicos. ¿Se suman las dos listas?
4. **Rodaje.** ¿Los mismos 3 primeros envíos por regla en revisión?
5. **Aprendizaje inicial.** Hoy el agente aprende el estilo de los últimos 100 correos enviados. Proponer reglas de envío a partir de pares recibido y respondido, como R30, es un añadido.
6. **Quién activa las reglas:** el dueño en su cuenta, o HumanaIA desde el panel.

## Qué no cambia en ningún caso

- Los artículos 1 a 4: ningún contenido de correo ni dirección entra en nuestro sistema.
- El agente no borra, no comparte y no responde a organismos ni a temas delicados.
- Las instrucciones dentro de un correo siguen siendo datos, no órdenes.

## Efecto en la campaña

Con B ratificada, el mensaje de la campaña de `marketing/` pasa de «Nada sale sin ti» a «Nada sale sin tu permiso»: por defecto borrador, y envío solo a los remitentes para los que el dueño ha creado una regla. La campaña lo presenta como servicio que llegará («Disponible próximamente»), porque la compuerta no está construida.

## Dictamen del auditor-seguridad

Emitido el 20/11/2026 por el subagente `auditor-seguridad`, solo lectura, sobre el texto original de esta propuesta. Llegó después de que se aplicara la enmienda 1.2.

**Veredicto: APTO CON CONDICIONES.** La opción B se puede sostener, pero el texto que se ratificó tiene dos huecos bloqueantes.

| N.º | Hallazgo | Gravedad | Artículos |
| --- | --- | --- | --- |
| 1 | B amplía el artículo 8 en su letra y lo relaja en su efecto: el conjunto de agente y compuerta envía texto escrito por un modelo que lee correo de desconocidos. Si el prompt pide marcar candidatos, un servidor comprometido podría provocar envíos hacia remitentes ya autorizados en todos los clientes | Mayor | 8 y 3 |
| 2 | La categoría no es un control: la asigna el modelo y un correo puede manipularla. Lo único que comprueba el código es el remitente. El texto ratificado presenta la categoría como parte de la compuerta | **Bloqueante** | 3 y 7 |
| 3 | Dónde se guardan las reglas: si viven en la carpeta de contexto, el agente, o un correo que lo engañe, puede crear o cambiar reglas. Lo mismo si el agente propone reglas y el dueño las acepta con un clic | **Bloqueante** | 8 |
| 4 | «Remitente del propio hilo» es ambiguo: `Reply-To` distinto, varios participantes, `From` falsificado, CC o CCO en el borrador | Mayor | 3 |
| 5 | Contenido de la respuesta: con un remitente autorizado suplantado o comprometido, una inyección le hace llegar datos de otros hilos, de la nube o de terceros | Mayor | 3 y 7 |
| 6 | Cambio entre comprobación y envío: el agente puede modificar el borrador después de comprobado, o marcar un borrador a medias del dueño | Mayor | 3 |
| 7 | Quién controla la compuerta: una biblioteca que ejecuta siempre la última versión, una configuración remota o la activación desde el panel permitirían relajar el límite desde nuestra infraestructura | Mayor | 8 y 9 |
| 8 | Si la compuerta informa a nuestro servidor de los envíos, necesita una credencial y un canal nuevos: es ruta crítica | Menor | 1 y 4 |

**Condiciones mínimas de la compuerta**

- **C1.** Reglas guardadas fuera del alcance de los conectores del agente. Solo el dueño las crea, autenticado. Las propuestas, si las hay, las calcula el código.
- **C2.** Una regla es una dirección exacta. No se admiten dominios.
- **C3.** Destinatario: el `From` del último correo recibido en el hilo, con autenticación DMARC alineada y comprobable. No se envía si hay `Reply-To` distinto, otros destinatarios, CC o CCO.
- **C4.** La compuerta lee el borrador una sola vez y construye ella el mensaje, en el mismo hilo: sin adjuntos, con longitud máxima y sin direcciones, enlaces, IBAN, DNI o NIF ni citas de otros hilos. Si algo falla, no envía.
- **C5.** La categoría solo sirve para excluir (organismos, temas delicados, «otros», «reclamación»). Nunca autoriza un envío.
- **C6.** Rodaje de 3 envíos por regla en revisión, límite de envíos por regla y por día, e interruptor del dueño que lo apaga todo.
- **C7.** Código en el repositorio, con versión y huella, instalado fijado a esa versión. Sin «siempre la última» ni configuración remota. El servidor solo puede apagar la compuerta, nunca encenderla, y no recibe direcciones ni texto.
- **C8.** Cierre en fallo ante error, dato ausente, más de una regla aplicable o autenticación sin resultado.
- **C9.** Batería de inyección con cero envíos no autorizados, que incluya un remitente suplantado y un prompt hostil servido desde el servidor.

**Riesgo residual que aceptaría el responsable:** si un remitente autorizado está comprometido o se suplanta con éxito, puede conseguir que se le envíe texto escrito por el modelo con datos del cliente, dentro de los límites de C4 y C6. Si nuestro servidor está comprometido, puede provocar ese mismo envío hacia remitentes ya autorizados.

**Redacción del artículo 8 que firmaría el auditor**

> 8. **Límites del agente en su anfitrión.** Lo que el agente del cliente no puede hacer (enviar, borrar, compartir) se impide en los permisos de los conectores del cliente y se repite en su arranque local. Nada de lo que entregue el servidor puede relajarlo. El único envío sin revisión admitido lo decide una compuerta de código, versionada en el repositorio e instalada en la cuenta del cliente, nunca el agente ni el servidor. La compuerta solo envía una respuesta en el mismo hilo al remitente autenticado del último correo recibido, cuya dirección exacta figura en una regla que el dueño ha creado; construye ella el mensaje sin adjuntos ni destinatarios añadidos, y ante cualquier condición no comprobada no envía. La clasificación del modelo solo puede impedir un envío, nunca autorizarlo. Ni el agente ni el servidor pueden crear, cambiar ni activar reglas o compuerta; el servidor solo puede desactivarla, y el dueño también, en cualquier momento.

**Lo que el auditor no pudo comprobar**

- Si Apps Script y Outlook permiten guardar las reglas fuera del alcance de los conectores, leer el resultado de DMARC y enviar sin permisos amplios.
- Si los conectores de correo y de nube de Claude o ChatGPT pueden editar borradores por identificador o proyectos de Apps Script.
- Las fuentes de NestAdmin 2, que no leyó.
- Qué permisos tiene el «agente de Apps Script» que la versión 1.2 ya prevé en la cuenta del cliente.

**Decisión pendiente del responsable:** sustituir el texto ratificado del artículo 8 por esta redacción. Sería la versión 1.3 de la constitución. El dictamen responde además a dos cuestiones abiertas: una regla es una dirección exacta (cuestión 2) y las reglas solo las crea el dueño (cuestión 6).
