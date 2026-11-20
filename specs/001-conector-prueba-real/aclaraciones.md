# 001 · Aclaraciones

Estado: **RESUELTAS** el 12/11/2026. Las 16 tienen respuesta del responsable; la especificación quedó aprobada ese mismo día (puerta P0). Lo que sigue en este párrafo es el historial de cómo se fueron contestando. Presentadas al responsable el 12/11/2026. Con respuesta: 1 a 5, 6 (falta una precisión), 7 a 11 y 14 a 16. La 12 quedó confirmada. Siguen abiertas: 6 (qué significa «mínimo 8 horas») y 13 (mensajes no ficticios, que el responsable quiere ver mejor). Desde el 12/11/2026 el entorno «previo» se llama «preproducción».

Cada cuestión abierta de la especificación, con sus opciones, su consecuencia y la recomendación del orquestador. La recomendación no es una decisión: mientras la columna «Respuesta» diga PENDIENTE, la cuestión sigue abierta y la función sigue en PROPUESTA. Una respuesta supuesta no vale.

Los números son los de «Cuestiones abiertas» de `especificacion.md`. Entre paréntesis, la etiqueta con la que se presentaron al responsable en el chat de la fase 1.

## Opciones y recomendación del orquestador

### 1. Cuentas, planes y aplicación de la prueba (A1)

Hace falta saber, y solo lo sabe el responsable: qué planes de Claude y de ChatGPT tienen hoy los clientes, desde qué aplicación trabajan (web, escritorio) y con qué tipo de tarea programada.

| Opción | Consecuencia |
| --- | --- |
| a) Solo los planes que tienen hoy los clientes | Coste mínimo. No dice nada sobre a quién más se puede vender |
| b) Los de los clientes y, además, el plan de pago más barato de cada asistente | Una o dos suscripciones más durante un mes. Deja claro el plan mínimo que se puede exigir a un cliente nuevo |
| c) Matriz completa: individual y de equipo en los dos asistentes | La información más completa, y el mayor coste y trabajo: cada plan es una prueba de 3 días |

**Recomendación: b)**, siempre con cuentas de prueba de HumanaIA, nunca de un cliente. Las cuentas las crea y las paga una persona.

Pistas consultadas el 12/11/2026. No son una verificación: V-101 y V-102 siguen en VERIFICAR.

- Claude: los conectores personalizados están en todos los planes (el gratuito, limitado a uno) y las tareas programadas en los de pago; las tareas programadas incluyen por defecto los conectores conectados. Hay dos tipos de tarea programada, en la nube y en la app de escritorio, que pueden no comportarse igual. En planes de equipo solo un propietario puede añadir el conector a la organización. [Conectores](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) · [Tareas programadas](https://code.claude.com/docs/en/routines)
- ChatGPT: la ayuda oficial da soporte completo de conectores MCP, con escritura, a Business, Enterprise y Edu; en Plus y Pro solo hay testimonios de usuarios, con el modo desarrollador. Las herramientas no declaradas de solo lectura piden confirmación por defecto. No se ha encontrado nada oficial sobre tareas programadas con conectores personalizados. [Ayuda de OpenAI](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt)

Efecto previsto: fija la lista de planes de REQ-027 y de CA-001, CA-005 y CA-006, y «un plan que los clientes puedan contratar» del criterio de sí o no.

### 2. ¿`obtener_instrucciones` se declara de solo lectura? (D3)

La herramienta no toca nada del cliente, pero en nuestro servidor abre una ejecución y marca la orden como entregada.

| Opción | Consecuencia |
| --- | --- |
| a) Mantenerla de solo lectura, como dice hoy el contrato | Los asistentes no deberían pedir confirmación para ella. Hay que justificar que anotar una ejecución es un registro de acceso y no una acción |
| b) Declararla de escritura | Tres herramientas de escritura. Sube el riesgo de que ChatGPT pida confirmación en cada ejecución desatendida |
| c) Separar la anotación: la herramienta no anota nada y la ejecución se abre al enviar el informe | Solo lectura sin discusión, pero se pierde la alerta «ejecución sin informe» que pide la fase 2 |

**Recomendación: no decidirlo ahora.** Resolverlo en el diseño, con dictamen del `auditor-seguridad`, y traerlo a la puerta P1. Mientras tanto el contrato se queda como está y la prueba real anota qué confirma cada asistente. La anotación no se cambia para evitar una confirmación (`.claude/rules/conector.md`).

Efecto previsto: ninguno ahora. Si en P1 se elige b) o c), cambia el contrato y REQ-016 o REQ-019.

### 3. En pausa, ¿qué hace el agente si su dueño le pide revisar en conversación? (D1)

| Opción | Consecuencia |
| --- | --- |
| a) En pausa no se revisa en ningún modo. El agente dice que está en pausa y que HumanaIA puede reanudarlo | Sencillo y coherente con el cierre en fallo. D-013 pasa a CONFIRMADO. El dueño no puede saltarse una pausa |
| b) En pausa se permite la revisión manual en conversación | El servidor tendría que saber el modo: parámetro nuevo en el contrato y prompt entregado en pausa. La pausa deja de ser un freno fiable |

**Recomendación: a).**

Efecto previsto: REQ-052 y CA-011 quedan como están; el prompt y el arranque ficticios incluyen el mensaje de pausa. D-013 a CONFIRMADO (lo anota el chat de coordinación).

### 4. Si un asistente falla el primer día, ¿se corta o se completa? (C5)

| Opción | Consecuencia |
| --- | --- |
| a) Se corta la prueba de ese asistente al primer fallo | Ahorra tiempo, pero no se sabe si el fallo era puntual |
| b) No se corta. Si el defecto es nuestro, se corrige y sus 3 días vuelven a empezar. Si es un límite del asistente, se confirma con un segundo intento, se anota «no» para ese plan y se siguen recogiendo datos en conversación y en los demás planes | Más días de calendario, y una decisión con hechos |

**Recomendación: b).** El otro asistente sigue su prueba en cualquier caso.

Efecto previsto: se añade a REQ-027 la regla de reinicio y de segundo intento.

### 5. ¿Dónde se guarda el estado mínimo de la prueba? (A2)

Lo decide el diseño, pero depende de que el gasto esté aprobado (cuestiones 4 y 8 de la función 002).

**Recomendación:** que el responsable apruebe ya el gasto de Supabase Pro, para que el diseño pueda elegir la tecnología definitiva. La prueba de renovaciones simultáneas solo demuestra algo si corre sobre el almacenamiento que se usará después; hacerla sobre otro obligaría a repetirla (artículo 10).

Efecto previsto: ninguno en los requisitos; REQ-003 ya exige que esté en la UE.

### 6. Frecuencia de la revisión programada durante los 3 días (C3)

Hace falta saber con qué frecuencia revisan hoy los agentes de los clientes.

| Opción | Consecuencia |
| --- | --- |
| a) Cada hora | 72 ejecuciones por asistente y plan: detecta fallos intermitentes. Puede topar con el límite de tareas del plan (sin verificar) |
| b) La frecuencia real más alta de los clientes | Lo más parecido al uso real. Si es baja, pocas muestras |
| c) Una vez al día | 3 ejecuciones en total: no demuestra casi nada |

**Recomendación: a) si el plan lo permite; si no, la más alta que permita, y nunca menos de 4 al día.**

Efecto previsto: fija el número de ejecuciones esperadas de CA-006 y el intervalo de REQ-014 y CA-010.

### 7. ¿Cuántas ejecuciones programadas pueden fallar? (C4)

| Opción | Consecuencia |
| --- | --- |
| a) Ninguna, sea cual sea la causa (el plan, al pie de la letra) | Una caída puntual del asistente daría un «no» que no dice nada de nuestro conector |
| b) Cero aprobaciones pedidas y cero fallos atribuibles a nuestro conector. Las ejecuciones que el asistente no llega a lanzar se anotan y se toleran hasta el 5 %, nunca dos seguidas | Separa nuestros fallos de los ajenos. Por encima del 5 %, el resultado es «sí, con condiciones» o «no» |

**Recomendación: b).**

Efecto previsto: cambia el umbral de CA-006.

### 8. ¿El agente de prueba toca algún buzón? (C2)

| Opción | Consecuencia |
| --- | --- |
| a) No. Solo el ciclo de las tres herramientas con cifras inventadas | Privacidad sin matices y alcance mínimo. No se ve cómo conviven nuestro conector y el de correo en una ejecución desatendida hasta el piloto de la fase 4 |
| b) Sí, un buzón de pruebas de HumanaIA con correos ficticios | Más realista. Obliga a aplicar los límites en el anfitrión (pasos 4 y 6 de `docs/INSTALACION-CLIENTE.md`) y amplía el alcance |
| c) Como a), más un día extra opcional con buzón de pruebas, que se anota y no cuenta para el sí o no | Adelanta parte del riesgo sin condicionar el cierre |

**Recomendación: a).** Si el responsable dispone ya de un buzón de pruebas, c).

Efecto previsto: REQ-026 y «Fuera de alcance» quedan cerrados; con c), un requisito y un criterio nuevos, no bloqueantes.

### 9. ¿En qué entorno se hace la prueba de 3 días? (C1)

Es la misma cuestión que la 6 de la función 002.

| Opción | Consecuencia |
| --- | --- |
| a) En preproducción, con dirección estable y abierta a internet | Producción queda limpia. Preproducción no puede llevar la protección de acceso de la plataforma, porque los asistentes tienen que llegar: la protege nuestra autorización |
| b) En producción | Es exactamente lo que usarán los clientes, pero mete datos de prueba en producción y roza B-003 |

**Recomendación: a).** En la fase 1, producción recibe solo los despliegues y las comprobaciones de plataforma, sin licencias ni códigos, de modo que nadie puede activar nada. No cuenta como publicación: B-003 sigue bloqueado.

Efecto previsto: REQ-001, CA-026 y REQ-027 nombran preproducción.

### 10. Licencia suspendida: ¿se abre ejecución y se entrega la orden? (D2)

El plan dice «el estado y nada más»; el contrato exige además `ejecucion_id` y `orden`.

| Opción | Consecuencia |
| --- | --- |
| a) Estado e identificador de ejecución, con `orden` nula y sin instrucciones | No cambia el esquema del contrato. Queda rastro de que un agente suspendido sigue llamando. El plan pasa a decir «el estado y ninguna instrucción» |
| b) Solo el estado, al pie de la letra | Hay que cambiar el contrato y el modelo de referencia. Un agente suspendido deja de dar señal |
| c) Estado, ejecución y también la orden pendiente | Entrega a una licencia no vigente algo más que su estado |

**Recomendación: a).**

Efecto previsto: REQ-051 y CA-011 se completan. El cambio de redacción del plan y del modelo de referencia va en `propuestas.md`.

### 11. Al cerrar la función, ¿qué pasa con el conector de prueba? (C6)

| Opción | Consecuencia |
| --- | --- |
| a) Se revocan todas las conexiones y se invalidan los códigos. El despliegue se conserva, sin ninguna licencia activable | La fase 2 construye encima y no queda nada utilizable por terceros |
| b) Se deja en servicio hasta la fase 2 | Permite seguir probando, pero deja abierto un conector con datos ficticios sin nadie mirándolo |
| c) Se retira el despliegue | Lo más limpio, pero la fase 2 tendría que volver a desplegarlo |

**Recomendación: a).**

Efecto previsto: requisito y criterio nuevos de cierre.

### 12. Qué hace el agente de prueba en el buzón

Propuesta del orquestador, ya escrita en REQ-059 a REQ-061: en cada revisión `activa`, el agente lee el buzón de pruebas e informa de cifras reales, aplica una etiqueta a un mensaje y crea un borrador; nunca envía, elimina, reenvía ni comparte. Si el conector de correo de un asistente no ofrece etiquetar o crear borradores, se anota y no cuenta como fallo nuestro.

**Recomendación: confirmarla.** Menos que eso (solo leer) no ejercita las acciones que tendrá el agente real; más (guardar documentos en la nube) amplía el alcance.

### 13. Mensajes del buzón que no son ficticios de HumanaIA

| Opción | Consecuencia |
| --- | --- |
| a) Los avisos automáticos del proveedor de la cuenta se admiten y se inventarían sin su contenido. Cualquier otro correo ajeno lo retira a mano el responsable y se anota sin su contenido | La prueba sigue. El agente nunca elimina |
| b) Cualquier mensaje ajeno detiene la prueba hasta que se retire | Más estricto. Un aviso de seguridad del proveedor pararía una prueba de 3 días |

**Recomendación: a).**

### 14. Si un asistente no permite bloquear enviar, eliminar y reenviar en su conector de correo

| Opción | Consecuencia |
| --- | --- |
| a) En ese asistente no se conecta el buzón: solo el ciclo con cifras inventadas. Se anota como dato para la decisión de sí o no | Se respeta el artículo 8. No se sabrá cómo se comporta allí el conector de correo |
| b) Se conecta el buzón aceptando el riesgo por escrito, solo para la prueba | Más datos. El único control sería el texto del prompt, que no es un control (ADR-0004) |

**Recomendación: a).**

### 15. Si el conector de correo pide aprobación en ejecución desatendida y la bloquea

| Opción | Consecuencia |
| --- | --- |
| a) Cuenta como «no» para ese asistente y plan, anotando que la causa es el conector de correo. Además se repite un día sin buzón, para saber si nuestro conector funciona por sí solo | La decisión refleja lo que vería un cliente y V-101 a V-103 quedan resueltas igualmente |
| b) No cuenta: solo se mide nuestro conector | El resultado sería «sí» para un asistente en el que el producto completo no funciona sin intervención |

**Recomendación: a).**

### 16. Campos del informe sobre el almacenamiento, sin almacenamiento en la prueba

El contrato exige `almacenamiento` con un valor de su lista, que no tiene «ninguno», y las comprobaciones de almacenamiento, contexto y registro.

| Opción | Consecuencia |
| --- | --- |
| a) No cambiar el contrato y decir la verdad con lo que hay: `otro`, las tres comprobaciones en falso con sus códigos de problema, y estado `aviso` | Todos los informes de la prueba salen en `aviso`. Nada que cambiar en documentos compartidos |
| b) Añadir «ninguno» a la lista del contrato | Cambia el contrato y el modelo de datos de la fase 2 por un caso que los clientes reales no tienen |
| c) Conectar también un almacenamiento de pruebas | Informes en `ok`, pero amplía el alcance y los límites que hay que poner en el anfitrión |

**Recomendación: a).**

## Cuestiones añadidas por el orquestador

Ninguna que no esté ya recogida arriba o en la función 002. Lo que se ha podido resolver leyendo el repositorio no se pregunta: va a `propuestas.md` o al diseño (callback de ChatGPT con parte variable, esquema que se publica al asistente frente a `additionalProperties: false`, V-116).

## Respuestas

«Sí, las acepto» es la respuesta del responsable, con el botón, a la pregunta «¿Aceptas las recomendaciones que siguen sin respuesta?», sobre la tabla «Recomendaciones sin respuesta» que se le presentó en el chat de la fase 1 el 12/11/2026. Cubre solo las filas de esa tabla.

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Cuentas, planes y aplicación | «el minimo de pago» | Responsable, 12/11/2026, chat de la fase 1 | REQ-078 nuevo: plan de pago más barato de cada asistente, con cuentas de prueba de HumanaIA. No dijo desde qué aplicación: la fija el guion (la que ofrezca tareas programadas en ese plan) y se anota. Si el plan mínimo no admite conectores o tareas programadas, decide el responsable si se prueba el siguiente |
| 2 | Anotación de solo lectura | «Sí, las acepto»: se decide en el diseño, con dictamen del `auditor-seguridad`, y se lleva a la puerta P1 | Responsable, 12/11/2026, chat de la fase 1 | Ninguno ahora. El contrato queda como está y la prueba real anota qué confirma cada asistente |
| 3 | Petición en conversación estando en pausa | «Sí, las acepto»: opción a), en pausa no se revisa en ningún modo | Responsable, 12/11/2026, chat de la fase 1 | REQ-077 nuevo; CA-040 ampliado. D-013 aceptada (la anota el chat de coordinación) |
| 4 | Fallo el primer día | «Sí, las acepto»: opción b), no se corta | Responsable, 12/11/2026, chat de la fase 1 | REQ-073 nuevo; CA-029 ampliado |
| 5 | Dónde se guarda el estado | «usemos sus versiones gratuitas hasta tener un versión distribuible.» (dada a la cuestión del gasto, la 4 de la función 002) | Responsable, 12/11/2026, chat de la fase 1 | Deja de necesitar respuesta: el diseño elige dónde se guarda el estado, en la UE y con planes gratuitos. Sale de «Cuestiones abiertas» |
| 6 | Frecuencia de la tarea programada | «cada hora, mínimo 8 horas» (a la recomendación «Cada hora si el plan lo permite; nunca menos de 4 al día») | Responsable, 12/11/2026, chat de la fase 1 | Fijado «cada hora» en CA-006. Precisado después por el responsable, al preguntarle qué significaba «mínimo 8 horas»: «Todo el día, mínimo 8», es decir, cada hora las 24 horas y, si el plan del asistente no deja tantas, al menos 8 ejecuciones al día. REQ-014, CA-006 y CA-010 completados |
| 7 | Fallos admitidos | «Sí, las acepto»: opción b), cero aprobaciones y cero fallos nuestros; hasta un 5 % de ejecuciones que el asistente no lance, nunca dos seguidas | Responsable, 12/11/2026, chat de la fase 1 | Umbral de CA-006 |
| 8 | Buzón en la prueba | «Si, usaremos un buzon de gmail de pruebas, [dirección]». El responsable dio la dirección en el chat; no se copia en el repositorio (REQ-065 y CA-042) | Responsable, 12/11/2026, chat de la fase 1 | Opción b). Requisitos nuevos REQ-057 a REQ-071 y criterios CA-034 a CA-044: qué hace el agente en el buzón, contenido solo ficticio, límites en el anfitrión, arranque local ficticio, nada del buzón en informes, registros ni evidencias |
| 9 | Entorno de la prueba | «Sí, las acepto»: opción a), preproducción; producción sin licencias ni códigos | Responsable, 12/11/2026, chat de la fase 1 | REQ-072 y CA-045 nuevos; REQ-027 nombra preproducción |
| 10 | Licencia suspendida | «Sí, las acepto»: opción a), estado e identificador de ejecución, sin orden ni instrucciones | Responsable, 12/11/2026, chat de la fase 1 | REQ-019, REQ-051 y CA-011 completados. El cambio de redacción del plan y del modelo de referencia va en `propuestas.md` |
| 11 | Conector de prueba al cerrar | «Sí, las acepto»: opción a), revocar conexiones y códigos; conservar el despliegue | Responsable, 12/11/2026, chat de la fase 1 | REQ-076 y CA-046 nuevos |
| 12 | Qué hace el agente en el buzón | «Sí, confirmo» (botón, a «¿Confirmas mis cuatro lecturas: producción, flujo desasistido, buzón y base de datos?») | Responsable, 12/11/2026, chat de la fase 1 | REQ-059 a REQ-061 quedan como estaban: lee, informa de cifras reales, etiqueta un mensaje y crea un borrador; nunca envía, borra ni reenvía |
| 13 | Mensajes no ficticios en el buzón | Primero: «esto habría que verlo, no me queda del todo claro». Tras la explicación, eligió «Avisos sí; lo demás lo borro»: los avisos de Google se quedan y un correo de una persona real lo borra él a mano | Responsable, 12/11/2026, chat de la fase 1 | Opción a). REQ-058 completado |
| 14 | Asistente que no permite limitar el conector de correo | «Sí, las acepto»: opción a), ahí no se conecta el buzón | Responsable, 12/11/2026, chat de la fase 1 | REQ-063 y CA-038 ampliados |
| 15 | Aprobación pedida por el conector de correo | «Sí, las acepto»: opción a), cuenta como «no» con la causa anotada, y se repite un día sin buzón | Responsable, 12/11/2026, chat de la fase 1 | REQ-074 nuevo; CA-006 y «Criterio de sí o no» ampliados |
| 16 | Campos de almacenamiento del informe | «Sí, las acepto»: opción a), no cambiar el contrato | Responsable, 12/11/2026, chat de la fase 1 | REQ-075 nuevo; CA-035 ampliado |

## Decisiones que salen de aquí

Ninguna todavía. Previsibles cuando haya respuesta: D-013 (pausa) y las que resulten de las cuestiones 1 y 10.

## Después de la aprobación: enmienda 1 (13/11/2026)

| Qué | Respuesta o hecho | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- |
| Uso de la plataforma de despliegue | D-016, anotada en `docs/TECNOLOGIAS.md` por el chat de coordinación: se desarrolla en local y la prueba gratuita de 14 días del plan de pago se reserva para la prueba real; el pago se decide al cerrar la fase 1 | Responsable, 13/11/2026, en el chat de coordinación | REQ-072, REQ-073, REQ-076 y CA-046 cambiados; REQ-079, REQ-080 y CA-047 nuevos |
| Ventana ya abierta | El orquestador vio en la consola de la plataforma, el 13/11/2026, la cuenta creada con la prueba gratuita en curso y 14 días restantes: termina el 27/11/2026. No se creó ningún proyecto | Observado por el orquestador, 13/11/2026 | La ventana ya corre; el calendario se hace con los días que queden |
| Qué hacer con la ventana abierta | «Sí, prioriza el conector» (botón, a «La prueba de 14 días de Vercel ya corre: ¿priorizo el conector para aprovecharla?») | Responsable, 13/11/2026, chat de la fase 1 | Prioridad al diseño e implementación del conector; REQ-080 prevé que no todo quepa |

La especificación vuelve a PROPUESTA hasta que el responsable apruebe la enmienda.

## Decisiones por delegación (D-019), 14/11/2026

| Cuestión | Decisión | Motivo |
| --- | --- | --- |
| Consolidar la especificación y volver a abrir P0 | Decidido por delegación (D-019): versión de 20 requisitos; el texto íntegro pasa al anexo con identificadores `RD-`/`CAD-` | Una persona puede revisarla de una sentada sin perder ninguna obligación |
| Numeración: los números `REQ-`/`CA-` de este archivo y del diseño anteriores a esta fecha son los antiguos | Decidido por delegación (D-019): número antiguo = `RD-`/`CAD-` del mismo número en el anexo | Evita reescribir el historial; el diseño se pasa a la numeración nueva al revisarlo |
| Puertas P0, P1 y P7 «las abre una persona» (REQ-007 y CA-008 de la 002) frente a la delegación | Decidido por delegación (D-019): el requisito se mantiene. Las puertas y los cambios reservados siguen exigiendo una aprobación registrada del responsable; mientras dure D-019 esa aprobación consta como «orquestador por delegación» y el responsable la puede revisar | Mantener el control del responsable sin bloquear el trabajo; no se rebaja ninguna prueba |

## Decisiones del 14/11/2026 incorporadas (delegación D-019)

| Qué | Origen | Efecto |
| --- | --- | --- |
| Supabase: proyecto existente `Nido`, `eu-north-1`, plan gratuito; funciones de Vercel en `arn1` | D-020, responsable, 14/11/2026 | Sustituye a `eu-central-1` y `fra1` en todo texto de esta función. Sigue dentro de la UE. El proyecto no lo crea ningún agente: ya existe |
| La prueba real se hace solo con la cuenta Claude Max del responsable; ChatGPT sin cuenta | D-021, responsable, 14/11/2026 | ChatGPT queda «no probado» y V-102 sin resolver; no cuenta como «no» ni como «sí» |
| Repositorio remoto `multiserviagua-pixel/Nido`, privado | D-022, responsable, 14/11/2026 | Alimenta la función 003; esta función sigue en local |
| Los agentes no crean cuentas ni secretos | D-019 | Sin cambio |

## Decisiones del diseño por delegación (D-019), 19/11/2026

Asuntos abiertos del diseño anterior (A-n) y nuevos, resueltos por el `arquitecto` en `diseno.md`, eligiendo la opción de más seguridad y calidad. El responsable puede revisarlos. Lo no delegable está en `diseno.md`, «Asuntos para el responsable» (R-1 a R-6).

| Asunto | Decisión | Motivo |
| --- | --- | --- |
| A-1 Dónde vive el estado | `Nido`, esquema `conector_prueba`; batería en PGlite; tras las pruebas locales contra `Nido`, revertir y reaplicar con contraseñas nuevas solo en Vercel | D-020; crear otro proyecto no es delegable; las credenciales locales mueren con los roles |
| A-2 Producción | Sin estado ni variables del conector: rutas en 503 y operación en 404 | Nadie puede activar nada; CA-024 se cumple sin enmienda |
| A-3 Anotación de `obtener_instrucciones` | `readOnlyHint: false` y fuera `x-cuestion-abierta`, antes de implementar; sujeto al dictamen del `auditor-seguridad` en P1 | Escribe estado (ejecución, orden entregada): «solo lectura» no es veraz. En Claude no cambia nada porque las tres herramientas van en «Always allow» |
| A-4 Permitir siempre leer, etiquetar y crear borrador | Se aplica la especificación tal como está (RD-062); la medición extra es R-4 | Relajar RD-062 es aceptar un riesgo: no es delegable |
| A-5 Plan de ChatGPT | Sin objeto mientras no haya cuenta (D-021) | — |
| A-6 Registros de la plataforma | Sin enmienda: el token en la URL solo lo envía la batería, en local; la consulta de `/oauth/autorizar` no lleva secretos ni datos personales | CA-006 es automático y local |
| A-7 Credenciales en la máquina | Las de preproducción nunca en local; `operar` es orden de la persona desde la carpeta sellada de la 002 | La solución de fondo es el asunto A-3 de la 002 |
| A-8 Callbacks | Dos, con `iss`; si ChatGPT usara el variable, se añade el valor exacto con un despliegue revisado | Lista cerrada |
| A-9 Quién aplica el SQL | Una persona, en el editor SQL | Ningún agente con credencial de administración |
| A-10 Calendario | Día de prueba = bloque de 24 h desde la primera ejecución programada; el periodo empieza el día D; objetivo antes del 22/11 y como muy tarde el 23/11 a las 08:00 | Tres bloques antes de `decision-pago` (26/11) |
| A-11 `mcp-handler` | No se usa: solo el SDK oficial (cambio de T-008) | No aporta nada necesario |
| A-12 Rutas nuevas respecto a `docs/ESQUELETO.md` | Aprobadas (marcadas «(n)» en el diseño) | Necesarias y acotadas |
| A-13 Concurrencia sin pgTAP | En la batería sobre PGlite y, con bloqueos reales, contra `Nido` antes de desplegar, con evidencia | No hay CI todavía |
| A-14 Límite de peticiones | Sin límite por conexión; vale el WAF de la 002 en `/api/*` | Datos ficticios; A-22 es de la fase 2 |
| A-15 Tipo de tarea en Claude | Tarea programada de Cowork, con aprobación automática; nunca «sin aprobaciones» | Es la que usaría un cliente; «sin aprobaciones» ampliaría el permiso a herramientas de correo (RD-062) |
| Plan Max frente a RD-078 | Se anota Max; Pro queda «no probado» (R-6) | D-021 |
| CA-008 real con un solo asistente | Segunda conexión abierta por la persona con el cliente MCP oficial; la parte «otro asistente» queda no ejecutada | Evidencia honesta (artículo 13) |
| Validador | `ajv` 8.20.0 como dependencia directa | El SDK 2.4.0 ya no lo trae (registro de npm, 19/11/2026) |
| Enmienda E-1 a RD-023 | Propuesta en `diseno.md`; la aplica el orquestador | RD-028 pide duración, protocolo y asistente |

## Asuntos nuevos para el responsable tras el dictamen del diseño (19/11/2026)

Sin respuesta todavía; detalle en `diseno.md`, «Asuntos para el responsable».

- **R-7** (M-2 del dictamen): si en la cuenta Max algún conector, complemento o capacidad distinto de Gmail de pruebas y HumanaIA no se puede desactivar para la tarea, ¿se hace igual la prueba? Hace falta la respuesta antes del paso 6 del guion.
- **A-3, revisada:** `readOnlyHint: false` deja de ser decisión por delegación. La respuesta expresa del responsable se recoge en P1 (RD-016); AR-01 decidida por delegación D-036, 20/11/2026 (ADR-0007), revocable.
