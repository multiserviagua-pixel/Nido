# 001 · Conector: prueba real en Claude y ChatGPT

Estado: DISEÑADA
Situación: aprobada el 12/11/2026; su enmienda 1 (D-016) la aprobó el responsable el 13/11/2026. El 14/11/2026 se consolidó en esta versión, legible de una sentada, que agrupa sin quitar ninguna obligación los 80 requisitos y 47 criterios anteriores. El detalle íntegro está en `anexo-especificacion-detallada.md`, con esos identificadores renombrados a `RD-nnn` y `CAD-nnn`. La aprobación de esta versión consolidada, por delegación (D-019), la anota el orquestador, no el especificador.
Fase: 1 · Fecha: 12/11/2026, consolidada el 14/11/2026 · Autor: `especificador`, sobre el borrador inicial del orquestador

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Cómo se lee

- La columna «Detalle» cita los `RD-nnn` y `CAD-nnn` del anexo. El anexo forma parte de esta especificación y no añade obligaciones, las precisa: un requisito se cumple cuando se cumplen todos sus RD, y un criterio cuando se cumple lo que dice aquí y los CAD que cita.
- Los valores técnicos sin fijar aquí (plazos, límites, listas cerradas) los fija el diseño; los criterios se comprueban contra ese valor.
- Los artículos 1, 2, 3, 4, 7 y 8 de la constitución se concretan en requisitos propios; los demás se aplican sin repetirlos.
- `aclaraciones.md` cita la numeración anterior al 14/11/2026: cada número citado allí es el RD o el CAD del mismo número en el anexo.

## Para qué

Todo el producto depende de que el agente de un cliente pueda usar nuestro conector desde Claude o ChatGPT, también cuando se ejecuta solo como tarea programada, y la documentación no lo garantiza (V-101 a V-104). Esta función construye el conector mínimo, con su autorización y sus tres herramientas sobre datos ficticios, y lo prueba en los asistentes reales, sobre el buzón de pruebas de Gmail designado por el responsable, para decidir con hechos, por asistente, antes de construir la base de datos y los dashboards. Comprueba también que los límites impuestos en el asistente funcionan (artículo 8, ADR-0004). Lo construido debe poder conservarse en la fase 2. Depende de la función 002, que entrega la batería local de comprobaciones y los entornos en la UE.

## Quién la usa y cómo

- **Instalador de HumanaIA**: añade el conector y lo activa con un código de un solo uso, sin clave permanente.
- **Agente de correo**: pide instrucciones, envía su informe y confirma órdenes sin que nadie apruebe nada cuando se ejecuta solo.
- **Operador de HumanaIA**: genera códigos, suspende licencias ficticias, crea órdenes y revoca conexiones sin tocar el código.
- **Responsable de HumanaIA**: sabe en qué asistentes y planes funciona la ejecución desatendida y decide cómo seguir.

## Requisitos

| ID | Requisito | Detalle |
| --- | --- | --- |
| REQ-001 | Un asistente añade el conector solo con su URL: descubre cómo autorizarse e inicializa el protocolo con la versión 2025-11-25 y con la 2026-07-28 (V-104). | RD-001, RD-004, RD-005 |
| REQ-002 | El conector se ejecuta en la UE y guarda en la UE el estado de la prueba, de forma comprobable desde fuera del código. Por D-020 el estado vive en el proyecto `Nido` de Supabase (`eu-north-1`, Estocolmo, plan gratuito) y las funciones se ejecutan en `arn1` (Estocolmo), junto a la base de datos. | RD-002, RD-003 |
| REQ-003 | Solo obtiene tokens un cliente registrado y autorizado con reglas cerradas: PKCE S256, callback idéntico a uno de T-010 y al registrado, CIMD solo desde hosts de una lista y DCR con límite y purga. Lo descargado al registrar nunca amplía callbacks ni permisos (artículo 7, ADR-0002). | RD-006, RD-008, RD-039 a RD-042 |
| REQ-004 | Un código de activación sirve una vez, caduca en minutos y crea como mucho una conexión, ligada a su licencia ficticia; sus fallos son indistinguibles y los intentos repetidos bloquean el origen un tiempo. | RD-009, RD-036 a RD-038 |
| REQ-005 | La pantalla de activación está en español, cumple WCAG 2.2 AA, sirve en un móvil, muestra error y éxito, y no se puede incrustar ni enviar desde otro sitio. | RD-011, RD-055 |
| REQ-006 | Cada activación crea una conexión propia (D-006); revocarla la deja sin acceso desde la petición siguiente sin afectar a ninguna otra, tampoco de la misma licencia. | RD-010, RD-035 |
| REQ-007 | El punto MCP solo acepta un token de acceso vigente (5 minutos durante la prueba), emitido para este conector y en la cabecera `Authorization`; lo demás se rechaza pidiendo volver a autorizar, sin ningún efecto. | RD-007, RD-012, RD-032 a RD-034 |
| REQ-008 | Una conexión desatendida se mantiene sin intervención: el token de renovación rota en cada uso, repetido dentro de la gracia o en paralelo da el mismo par, su caducidad deslizante supera el mayor intervalo entre ejecuciones (hasta 17 h) y reutilizado fuera de la gracia revoca solo su conexión. | RD-013, RD-014, RD-043, RD-044 |
| REQ-009 | Hay exactamente tres herramientas, `obtener_instrucciones`, `enviar_informe` y `confirmar_orden`, con los esquemas y anotaciones de `contratos/`, que solo cambian con decisión registrada del responsable y el contrato cambiado antes. | RD-016 |
| REQ-010 | Licencia y conexión salen solo del token, nunca de una entrada. Con dos licencias ficticias se demuestra automáticamente que desde una no se lee ni se modifica nada de otra; lo ajeno se responde igual que lo inexistente (artículo 2). | RD-017, RD-018, RD-046, RD-049, RD-050 |
| REQ-011 | `obtener_instrucciones` abre siempre una ejecución y da un estado explícito: solo `activa` trae prompt, versión, huella y reglas; `pausada` trae la orden pendiente; `suspendida` no la trae y la orden sigue pendiente. | RD-019, RD-051, RD-052 |
| REQ-012 | El único prompt entregado es el ficticio del repositorio, con su SHA-256 como huella. Solo pide leer, etiquetar, crear un borrador y el ciclo de herramientas; nunca enviar, eliminar, reenviar, compartir, credenciales ni contenido de correo. Nada lo cambia (artículos 8 y 9). | RD-020, RD-069 |
| REQ-013 | Cada escritura ocurre como mucho una vez y solo con lo que admite el contrato: un informe por ejecución propia, el inválido rechazado sin repetir valores, los campos ajenos descartados y solo contados, y una confirmación por orden entregada, también ante repeticiones y concurrencia. | RD-021, RD-022, RD-045, RD-047, RD-048 |
| REQ-014 | Con el almacenamiento caído, un secreto ausente o un cuerpo excesivo, el conector cierra en fallo: ningún estado por defecto, ni prompt, ni tokens, ni conexiones, ningún código consumido sin conexión y un error genérico (artículo 3). | RD-053, RD-054, RD-056 |
| REQ-015 | Ningún token, código, secreto, credencial ni valor recibido es legible ni utilizable fuera de su uso: ni en código, repositorio, registros, respuestas o evidencias, ni desde una copia del estado guardado. Los secretos solo los pone una persona en el gestor de variables (artículo 4). | RD-015, RD-023, RD-024, RD-031, RD-066 |
| REQ-016 | Solo se usan datos y cuentas ficticios o de HumanaIA y el buzón de pruebas, con mensajes ficticios marcados e inventariados. Ningún contenido del buzón entra en el sistema ni en las evidencias, y no se usa almacenamiento en la nube (artículo 1). | RD-026, RD-057, RD-058, RD-065 |
| REQ-017 | Una persona de HumanaIA, con sus credenciales y sin desplegar, genera códigos, suspende y reactiva licencias, crea órdenes de pausar y reanudar y revoca conexiones; un token de conexión no puede hacer nada de eso. | RD-025 |
| REQ-018 | En el buzón, el agente solo lee, etiqueta y crea borradores, y solo tras `activa`. Enviar, eliminar y reenviar los bloquea la configuración de cada cuenta de asistente, lo repite un arranque local ficticio y nada recibido lo relaja (artículos 7 y 8, ADR-0004). Donde no se puede bloquear, el buzón no se conecta. | RD-060 a RD-064, RD-068, RD-070, RD-071, RD-077 |
| REQ-019 | Según D-016, lo que no exige dirección pública se construye y se supera en local antes del primer despliegue. La prueba real se hace en preproducción, dentro de la ventana gratuita de 14 días que activó una persona (del 13/11/2026 al 27/11/2026), con calendario aprobado por el responsable. Producción no tiene nada activable y al cerrar se revocan las conexiones de prueba. | RD-072, RD-076, RD-079, RD-080 |
| REQ-020 | La prueba real sigue un guion previo. Por D-021 se hace solo con la cuenta de Claude del responsable (plan Max): ChatGPT no tiene cuenta asignada, así que su prueba no se ejecuta, se anota «no ejecutada» (V-102 sigue sin resolver) y no cuenta como «no» ni como «sí». El guion conserva sus pasos de ChatGPT para cuando haya cuenta. Cubre: conversación, 3 días de ejecución programada cada hora, simultaneidad, todos los estados y la revocación. Acaba con resultados por asistente y plan, conclusión de V-101 a V-104 y decisión de sí o no. | RD-027 a RD-030, RD-059, RD-067, RD-073 a RD-075, RD-078 |

## Casos negativos

| Caso | Qué ocurre | Requisito |
| --- | --- | --- |
| Token ausente, caducado, ajeno, en la URL o del tipo equivocado | Rechazo pidiendo volver a autorizar; nada se ejecuta | REQ-007 |
| Callback no idéntico, sin PKCE S256 o host CIMD fuera de la lista | Rechazo: ni tokens, ni redirección, ni petición saliente | REQ-003 |
| Código incorrecto, caducado o usado; muchos intentos; activaciones simultáneas | Mismo mensaje y 0 conexiones; bloqueo temporal; como mucho 1 conexión | REQ-004 |
| Token de renovación reutilizado fuera de la gracia | Se revoca esa conexión y ninguna otra | REQ-006, REQ-008 |
| Token de la licencia A con ejecuciones, órdenes o identificadores de B | Igual que algo inexistente; nada de B cambia | REQ-010 |
| Informe con campos de más o valores fuera de contrato; escrituras repetidas o simultáneas | Ajenos descartados y contados; inválido rechazado sin eco; una sola escritura | REQ-013 |
| Licencia suspendida o pausada | Sin prompt ni reglas; si está suspendida, tampoco la orden | REQ-011 |
| Almacenamiento caído, secreto ausente o cuerpo excesivo | Cierre en fallo con error genérico | REQ-014 |
| Operación de HumanaIA con un token de conexión, o entrada que intenta cambiar el prompt | Se rechaza; el prompt no cambia nunca | REQ-012, REQ-017 |
| Mensaje del buzón con órdenes al agente, o petición de enviar, eliminar o reenviar | No se obedece; lo impide el anfitrión, no solo el modelo | REQ-018 |
| `obtener_instrucciones` falla o no devuelve `activa` | El agente no toca el buzón | REQ-018 |
| Intento de activar en producción | No se crea ninguna conexión | REQ-019 |

## Criterios de aceptación

«Automática»: prueba de la batería local de la función 002 (y del CI cuando exista). «Real»: paso del guion en el asistente, con evidencia. «Revisión» y «Observación» dejan evidencia fechada.

| ID | Criterio | Requisitos | Detalle |
| --- | --- | --- | --- |
| CA-001 | Automática, antes del primer despliegue. En local, un cliente MCP de prueba completa el ciclo (descubrimiento, registro, activación, tres herramientas y renovación con rotación); sesiones con 2025-11-25 y con 2026-07-28 listan las tres herramientas; los metadatos cumplen CAD-002. Umbral: 1 ciclo completo, 2 de 2 sesiones y batería al 100 % | REQ-001, REQ-019 | CAD-002, CAD-003, CAD-047 |
| CA-002 | Observación. Región de ejecución en cada entorno y del almacenamiento en la UE. Umbral: 100 %, con evidencia fechada | REQ-002 | CAD-026 |
| CA-003 | Automática. Casos de CAD-018 y CAD-019: callbacks y sus variantes, PKCE, verificador, códigos repetidos o ajenos, CIMD y DCR fuera de reglas, purga. Umbral: 100 % rechazados o purgados, 0 tokens, 0 redirecciones no válidas y 0 peticiones a hosts fuera de la lista | REQ-003 | CAD-018, CAD-019 |
| CA-004 | Automática. Código incorrecto, caducado y usado: 0 conexiones y mismo mensaje; bloqueo del origen tras los intentos del diseño, también para un código válido; 10 activaciones simultáneas: 1 conexión. Umbral: 100 % | REQ-004 | CAD-008, CAD-017 |
| CA-005 | Automática y revisión. Incrustación y envío cruzado rechazados (100 %), 0 hallazgos bloqueantes WCAG 2.2 AA, uso a 360 px y 100 % de textos en español | REQ-005 | CAD-020 |
| CA-006 | Automática, con reloj controlado. Casos de token no válido de CAD-016, con el caducado a los 5 min 1 s. Umbral: 100 % rechazados, estado igual antes y después y 0 apariciones en registros del token enviado en la URL | REQ-007 | CAD-010, CAD-016 |
| CA-007 | Automática, con reloj controlado. Repetición dentro de la gracia y 10 renovaciones simultáneas: mismo par; fuera de la gracia: revoca solo esa conexión; tras 18 h sin uso: renueva; tras la caducidad deslizante: rechazo. Umbral: 100 % | REQ-006, REQ-008 | CAD-008 a CAD-010 |
| CA-008 | Automática y real. Revocar una conexión de A rechaza su siguiente petición y deja funcionando la otra de A y las de B (100 %); en real, revocada la conexión de un asistente, su revisión siguiente se rechaza y la del otro se completa (1 de 1) | REQ-006 | CAD-009, CAD-033 |
| CA-009 | Automática y real. Exactamente 3 herramientas con esquemas y anotaciones idénticos a `contratos/` y 100 % de respuestas válidas contra su salida; 0 diferencias de anotaciones sin decisión registrada entre el inicio y el final de la prueba real | REQ-009 | CAD-004 |
| CA-010 | Automática, con licencias A y B. Los casos cruzados de CAD-015 dan la misma respuesta que lo inexistente. Umbral: 100 % y estado de B idéntico antes y después | REQ-010 | CAD-015 |
| CA-011 | Automática, y real una vez por asistente. Suspendida: 100 % `suspendida`, con `ejecucion_id`, `orden` nula que no pasa a entregada y 0 apariciones de la marca del prompt; pausada: la orden sin instrucciones; reactivada o reanudada: `activa` | REQ-011 | CAD-011 |
| CA-012 | Automática y revisión. SHA-256 del prompt igual a la huella y al repositorio en el 100 % de respuestas `activa`, antes y después de todas las operaciones de HumanaIA y de la batería de entradas hostiles; el `revisor` confirma el contenido permitido | REQ-012 | CAD-027, CAD-043 |
| CA-013 | Automática. Campos ajenos (`campos_descartados: 3` y 0 apariciones), inválidos por campo (`informe_invalido` sin el valor, ejecución abierta), repeticiones (primer informe intacto, `repetido` o `repetida: true`) y 10 llamadas simultáneas por herramienta (10 ejecuciones, 1 informe, 1 confirmación). Umbral: 100 % | REQ-013 | CAD-008, CAD-012 a CAD-014 |
| CA-014 | Automática. Almacenamiento caído en cada paso, cada secreto ausente y cuerpo excesivo en cada punto. Umbral: 100 % sin `activa`, prompt ni tokens válidos nuevos; 0 códigos consumidos sin conexión; 0 secretos o contenidos marcados en respuestas y registros | REQ-014 | CAD-021 a CAD-023 |
| CA-015 | Automática y revisión. Con valores marcados en todas las entradas: 0 apariciones en registros y errores; copia del estado: 0 valores utilizables; escáner de secretos sobre evidencias: 0 hallazgos; registros y capturas de la prueba real: 0 tokens, códigos, secretos o valores recibidos | REQ-015 | CAD-024, CAD-025, CAD-032 |
| CA-016 | Revisión con búsqueda de texto. Inventario fechado del buzón antes de empezar y comprobación diaria; búsqueda de marcas, dirección y credenciales en estado, registros, repositorio y evidencias, y capturas revisadas a ojo. Umbral: 0 mensajes no ficticios sin anotar, 0 accesos a otros buzones y 0 apariciones | REQ-015, REQ-016 | CAD-034, CAD-042 |
| CA-017 | Automática. Cada operación de HumanaIA funciona sin desplegar y se rechaza con un token de conexión o sin credenciales de HumanaIA. Umbral: 100 % | REQ-017 | CAD-028 |
| CA-018 | Revisión y real. Cada cuenta tiene evidencia fechada, previa a la primera ejecución, del bloqueo de enviar, eliminar y reenviar y del arranque local revisado e instalado. Pedido en conversación enviar, eliminar y reenviar: 0 correos enviados o eliminados y 3 de 3 acciones impedidas por el anfitrión donde se puede limitar; donde no, buzón sin conectar | REQ-018 | CAD-038, CAD-039 |
| CA-019 | Real. Un mensaje con órdenes al agente se procesa en conversación y en programada en cada asistente. Al acabar: 0 correos en la dirección de control y en enviados, inventario íntegro, 0 reenvíos o reglas, 0 apariciones de su marca, y anotado si el agente lo intentó | REQ-018 | CAD-037, CAD-041 |
| CA-020 | Real. Por asistente, con licencia suspendida, en pausa (pidiendo expresamente revisar) y con la conexión revocada: 3 de 3 casos con 0 llamadas a herramientas de correo y 0 etiquetas o borradores nuevos; en la pausa, el agente dice que está en pausa y que HumanaIA puede reanudarlo | REQ-011, REQ-018 | CAD-040 |
| CA-021 | Real. En Claude (con la cuenta Max, D-021) y, cuando haya cuenta, en ChatGPT, el conector se añade con su URL, se activa con un código y completa en conversación `activa`, `guardado: true` y `confirmada: true`. Umbral: por asistente y plan, 1 conexión ligada a la licencia del código y 1 ejecución cerrada con su informe en esa licencia | REQ-001, REQ-004, REQ-006, REQ-010, REQ-020 | CAD-001, CAD-005 |
| CA-022 | Real. Cada ejecución `activa` deja etiqueta y borrador nuevos o anota que el conector de correo no lo ofrece; en conversación, las cifras del informe coinciden con el buzón y el informe declara lo que fija RD-075. Umbral: 0 ejecuciones sin etiqueta y borrador ni anotación, y 100 % de cifras e informes conformes | REQ-018, REQ-020 | CAD-035, CAD-036 |
| CA-023 | Real. 3 días seguidos de tarea programada cada hora (8 al día como mínimo) con token de 5 minutos, con una orden de pausar y otra de reanudar confirmadas, y 3 pares de revisiones simultáneas tras 5 minutos sin uso. Umbral: 0 aprobaciones pedidas por el conector de HumanaIA, 0 fallos por su causa, no lanzadas ≤ 5 % y nunca dos seguidas, y 3 de 3 pares con `guardado: true` y la conexión válida. Si falla por una aprobación del conector de correo, incumple y se repite un día sin buzón | REQ-007, REQ-008, REQ-020 | CAD-006, CAD-007 |
| CA-024 | Observación, automática y revisión. Calendario aprobado antes del primer paso real; 100 % de pasos en preproducción; en producción, 0 licencias, 0 códigos y 0 conexiones al intentar activar. Al cerrar: 0 conexiones activas y 0 códigos válidos, 100 % de tokens de prueba rechazados, conector desplegado o retirado según se contrate el plan de pago, y 0 pasos del calendario sin estado | REQ-019 | CAD-045 a CAD-047 |
| CA-025 | Revisión. Guion fechado antes de su primera ejecución; resultados por asistente y plan con todo lo que piden CAD-029 y CAD-044; conclusión con evidencia para V-101 a V-104; decisión de sí o no aprobada por el responsable con fecha, con la declaración de datos ficticios y plan B si es «no». Umbral: 0 casillas vacías, 0 fallos sin regla aplicada y 4 de 4 conclusiones | REQ-016, REQ-020 | CAD-003, CAD-029 a CAD-031, CAD-044 |

## Criterio de sí o no

Por cada asistente con cuenta de prueba (hoy solo Claude, D-021; ChatGPT queda «no probado» hasta que el responsable asigne una cuenta):

- **Sí**: CA-021 y CA-023 se cumplen en al menos un plan que los clientes puedan contratar.
- **Sí, con condiciones**: funciona en conversación, pero la ejecución programada exige una aprobación que se concede una sola vez al instalar; se documenta en `docs/INSTALACION-CLIENTE.md`.
- **No**: la ejecución programada no completa las escrituras sin intervención, o no se completa porque el conector de correo pide aprobación, aunque el de HumanaIA funcione solo.

La decisión dice si el asistente permite limitar el conector de correo; si no, solo se instala si el responsable acepta el riesgo por escrito (ADR-0004), y si no lo acepta es «no». Con un «no», el responsable elige antes de seguir un plan B: solo en conversación, unir `confirmar_orden` dentro de `enviar_informe` (D-009) o mantener la carpeta `panel` para esos clientes.

## Fuera de alcance

- Lo que entregan la función 002 (batería y entornos, secretos, despliegue, supervisión, vuelta atrás, dominio) y la 003, aplazada (repositorio y CI remotos).
- Base de datos definitiva, RLS, pgTAP y dashboards (fases 2, 3 y 5); las operaciones de REQ-017 no son un panel.
- Prompt real, versión 1.3 y arranque local definitivo (fase 2); versiones, canales y vuelta atrás del prompt (fase 4).
- Otro buzón, otras acciones que leer, etiquetar y crear borradores, y almacenamiento en la nube.
- Límites definitivos de intentos y de peticiones (A-22) y alertas (fases 2 a 4).
- Stripe, publicación para clientes (B-003), clientes reales y asistentes distintos de Claude y ChatGPT.
- Editar `docs/TECNOLOGIAS.md`: se entregan conclusiones y evidencias; el registro lo actualiza el chat de coordinación.

## Cuestiones abiertas

Ninguna. Las 16 de la versión anterior se resolvieron el 12/11/2026; las respuestas están en `aclaraciones.md`.

## Dependencias y decisiones relacionadas

Función 002 (la 003 no bloquea el cierre); pasos 4 a 6 de `docs/INSTALACION-CLIENTE.md`; D-006, D-009, D-013, D-016, D-019, D-020, D-021, D-022, T-019, T-007 a T-011, V-101 a V-104, V-106, V-109; ADR-0001, ADR-0002, ADR-0004; los contratos de `contratos/`; amenazas A-01 a A-06, A-08, A-13 a A-15 y A-22 (parcial); `docs/MODELO-DATOS.sql` solo como referencia de comportamiento.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 12/11/2026 | Responsable | Aprobada. Respuesta expresa en el chat de la fase 1: «Sí, apruebo las dos», a la pregunta «¿Apruebas las especificaciones 001 y 002 (puerta P0)?» |

## Correspondencia con el anexo

Cada `RD-nnn` del anexo y el requisito que lo recoge. Ningún RD queda solo en el anexo.

| RD | REQ | RD | REQ | RD | REQ | RD | REQ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RD-001 | REQ-001 | RD-021 | REQ-013 | RD-041 | REQ-003 | RD-061 | REQ-018 |
| RD-002 | REQ-002 | RD-022 | REQ-013 | RD-042 | REQ-003 | RD-062 | REQ-018 |
| RD-003 | REQ-002 | RD-023 | REQ-015 | RD-043 | REQ-008 | RD-063 | REQ-018 |
| RD-004 | REQ-001 | RD-024 | REQ-015 | RD-044 | REQ-008 | RD-064 | REQ-018 |
| RD-005 | REQ-001 | RD-025 | REQ-017 | RD-045 | REQ-013 | RD-065 | REQ-016 |
| RD-006 | REQ-003 | RD-026 | REQ-016 | RD-046 | REQ-010 | RD-066 | REQ-015 |
| RD-007 | REQ-007 | RD-027 | REQ-020 | RD-047 | REQ-013 | RD-067 | REQ-020 |
| RD-008 | REQ-003 | RD-028 | REQ-020 | RD-048 | REQ-013 | RD-068 | REQ-018 |
| RD-009 | REQ-004 | RD-029 | REQ-020 | RD-049 | REQ-010 | RD-069 | REQ-012 |
| RD-010 | REQ-006 | RD-030 | REQ-020 | RD-050 | REQ-010 | RD-070 | REQ-018 |
| RD-011 | REQ-005 | RD-031 | REQ-015 | RD-051 | REQ-011 | RD-071 | REQ-018 |
| RD-012 | REQ-007 | RD-032 | REQ-007 | RD-052 | REQ-011 | RD-072 | REQ-019 |
| RD-013 | REQ-008 | RD-033 | REQ-007 | RD-053 | REQ-014 | RD-073 | REQ-020 |
| RD-014 | REQ-008 | RD-034 | REQ-007 | RD-054 | REQ-014 | RD-074 | REQ-020 |
| RD-015 | REQ-015 | RD-035 | REQ-006 | RD-055 | REQ-005 | RD-075 | REQ-020 |
| RD-016 | REQ-009 | RD-036 | REQ-004 | RD-056 | REQ-014 | RD-076 | REQ-019 |
| RD-017 | REQ-010 | RD-037 | REQ-004 | RD-057 | REQ-016 | RD-077 | REQ-018 |
| RD-018 | REQ-010 | RD-038 | REQ-004 | RD-058 | REQ-016 | RD-078 | REQ-020 |
| RD-019 | REQ-011 | RD-039 | REQ-003 | RD-059 | REQ-020 | RD-079 | REQ-019 |
| RD-020 | REQ-012 | RD-040 | REQ-003 | RD-060 | REQ-018 | RD-080 | REQ-019 |
| 14/11/2026 | Orquestador de la fase 1, por delegación (D-019) | Aprobada la versión consolidada (20 requisitos, detalle íntegro en `anexo-especificacion-detallada.md`). Sin cambio de alcance: el comprobador de trazabilidad pasa y los 80/79 requisitos detallados están agrupados sin pérdida |
