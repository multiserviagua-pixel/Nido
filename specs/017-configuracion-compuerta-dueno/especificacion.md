# 017 · Vía protegida del dueño para la compuerta de envío

Estado: APROBADA
Fase: 2 · Fecha: 21/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

La compuerta de la 016 solo envía si el dueño la ha activado, y solo él la relaja o cancela sus esperas, por una vía protegida (artículo 8; requisito 18 de la 016). Esta función define esa vía: quién entra, qué hace y ve, qué avisos recibe antes de asumir un riesgo y por qué nadie más (agente, correo, enlace, HumanaIA o sus servidores) puede relajar nada por él. Sin la 017 cerrada, la 016 no se activa.

## Quién la usa y cómo

- Como **dueño de una cuenta de correo cliente**, quiero decidir si la compuerta responde, a quién no, cuánto y con qué filtro, y ver qué ha hecho, sin que nadie me engañe.
- Como **responsable de HumanaIA**, quiero que esté demostrado que ni HumanaIA ni el agente pueden relajarla y que su configuración no trae contenido de correo a nuestros servidores.

## Términos

Los de la 016, y además:

- **Dueño**: el titular de la cuenta de correo donde está instalada la compuerta, autenticado como tal por su proveedor; un **delegado** con acceso a la cuenta no lo es.
- **Acción restrictiva**: cambio cuyo resultado no es menos restrictivo en ningún punto; es **urgente** si detiene envíos (desactivar, cancelar una espera o un cambio pendiente, encender el filtro) y **no urgente** si no (añadir una exclusión, bajar un tope).
- **Acción relajante**: todo cambio cuyo resultado sea menos restrictivo en algún punto, se llame como se llame (editar, restablecer, deshacer), también uno mixto: activar, apagar el filtro, retirar o editar una exclusión, subir un tope e instalar, reinstalar, actualizar o volver a otra versión.
- **Reautenticación propia**: el dueño vuelve a demostrar ante su proveedor que es el titular, con una presencia que el navegador del asistente no puede aportar (no basta una contraseña autocompletada). La vía protegida la pide después de mostrar el cambio; vale solo para ese cambio y ese valor, una vez, y no la sustituye un inicio de sesión previo. Es **nominativa** si el propio paso de presencia muestra el cambio concreto en una superficie que el agente no controla.
- **Cambio pendiente**: el confirmado sin reautenticación nominativa, que espera su plazo (REQ-009).
- **Confirmación expresa**: gesto afirmativo del dueño, distinto de navegar, sobre un cuadro que nombra el cambio y cuya opción por defecto es «no cambiar nada».

## Requisitos

| ID | Requisito |
| --- | --- |
| REQ-001 | Solo el dueño entra en la vía protegida de su cuenta; no basta ninguna otra sesión, invitación ni token (REQ-017). Un delegado que la plataforma distinga del titular solo hace restrictivas urgentes, que el historial le atribuye; si no los distingue, la vía protegida no se ofrece en ella |
| REQ-002 | Activar y desactivar son una acción cada una; tras instalarla, está desactivada. Se muestra siempre si está activada, desactivada o detenida por el interruptor de HumanaIA, y desde cuándo |
| REQ-003 | Las restrictivas urgentes están siempre a la vista, piden una sola confirmación sin reautenticación, se dan por hechas solo cuando han quedado registradas y funcionan también con HumanaIA caída o la licencia revocada |
| REQ-004 | Una relajante o una restrictiva no urgente solo se acepta si, en este orden, el dueño ve el valor actual y el nuevo, ve el aviso cuando corresponde (REQ-005), confirma de forma expresa y completa la reautenticación propia de ese cambio; si falta un paso o cambia el orden, no cambia nada. Con reautenticación nominativa tiene efecto al instante; sin ella queda pendiente (REQ-009). Las peticiones de presencia tienen un límite por periodo. Si la plataforma no garantiza la presencia, estas acciones no se ofrecen |
| REQ-005 | Antes de activar y de apagar el filtro, el dueño ve un aviso en español llano que explica: (a) lo que saldrá en su nombre sin revisar; (b) que, si roban el correo a un contacto suyo, le pueden hacer responder; (c) que quien reciba una respuesta suya a mano pasa a ser contacto previo y un correo posterior con instrucciones ocultas puede salir respondido solo; (d) que un contacto antiguo cuyo dominio caducado ha registrado otro cuenta como contacto previo, salvo el límite de antigüedad de la 016; (e) solo al apagar el filtro, que podrán salir enlaces, direcciones, teléfonos, números de cuenta y documentos de identidad; (f) que toda petición de activarla o relajarla, también una que parezca de HumanaIA, puede ser un engaño; (g) cómo desactivar y cancelar. Recibe el foco, se lee entero con lector de pantalla y no se cierra ni se confirma solo |
| REQ-006 | El dueño añade y retira exclusiones de direcciones exactas y de dominios; al añadir un dominio se le dice que abarca sus subdominios. Toda dirección o dominio a los que la compuerta pueda responder, también no ASCII, se puede excluir, y se guarda en una representación fija igual a lo mostrado y a lo que compara la compuerta (requisito 21 de la 016). Lo que no es dirección ni dominio se rechaza con mensaje en español, sin cambios. Una exclusión no crea contactos previos ni autoriza envíos |
| REQ-007 | Con el filtro apagado, cada pantalla lo indica de forma visible y accesible, con su fecha. Apagarlo y encenderlo quedan en el historial con fecha y hora |
| REQ-008 | Cada tope muestra el máximo del código y el valor vigente. El dueño fija un entero entre 0 y ese máximo; lo demás se rechaza sin cambios. Bajar es restrictivo no urgente y subir, relajante |
| REQ-009 | Un cambio pendiente mantiene el valor anterior y deja en la cuenta del dueño un aviso que lo nombra y dice que su asistente nunca necesita cambiar esto (si alguien se lo pide, cancele) y que cancelar nunca pide su contraseña (entre desde el punto de entrada conocido). El aviso queda fuera del alcance del agente con la garantía del resumen (requisito 11 de la 016); si no, toda alteración suya que no conste hecha por el dueño deja el cambio sin efecto y, si ni eso es detectable, solo se ofrece la reautenticación nominativa. El plazo no vence antes de que un resumen diario incluya el pendiente. Cada espera se lista con destinatario, texto exacto y hora prevista, y cada pendiente con sus valores y hora de efecto; el dueño cancela uno o todos. Los enlaces de los avisos llevan a esta lista sin cancelar. No se ofrece adelantar, acortar ni aplicar ya |
| REQ-010 | El dueño consulta en español el historial (cada decisión y cambio del requisito 12 de la 016, con fecha, hora y motivo en una frase), los resúmenes diarios y el estado actual (activación, filtro, topes, exclusiones, esperas, pendientes, versión y huella instaladas y último «parar» de HumanaIA), igual a lo que hay en la cuenta. Los intentos rechazados y las presencias rechazadas o ignoradas se agrupan o limitan en historial y resumen; la entrada de un relajante nunca se pierde por volumen antes de llegar al resumen |
| REQ-011 | La compuerta la instala siempre el dueño, con su sesión y la guía; HumanaIA ayuda sin tener ni pedir sus credenciales. Instalar, reinstalar, actualizar o volver a una versión anterior siguen REQ-004, con versión y huella a la vista, a la versión que elige el dueño. Integridad y lista de versiones retiradas se comprueban contra el repositorio al confirmar y, si quedó pendiente, otra vez al tener efecto (si falla, 0 cambios); nada que entregue HumanaIA (guía, copia del código, aviso de «última versión», lista de retiradas) sirve de prueba. Una versión retirada no se instala. Nada se actualiza ni se activa solo. Al terminar se ven versión y huella instaladas, la última del repositorio si es otra, el filtro encendido y, si quedó desactivada (requisito 14 de la 016), por qué y cómo reactivarla |
| REQ-012 | Solo una acción del dueño en la vía protegida cambia el estado. Nada de lo que produzcan el agente, un correo, un documento, el prompt, el panel, HumanaIA o sus servidores, aun comprometidos, inicia, rellena, preselecciona ni completa un cambio, salvo el riesgo residual de REQ-018. Los enlaces a la vía protegida solo llevan a su inicio o a la lista de pendientes |
| REQ-013 | Exclusiones, historial, resúmenes, esperas y pendientes, con sus direcciones y textos, no pasan por servidores de HumanaIA ni se guardan allí, tampoco en registros, informes de errores o analítica. A HumanaIA solo llega lo que admite el requisito 15 de la 016 (artículo 1) |
| REQ-014 | La vía protegida solo lee y cambia el estado de la cuenta que se deriva de la autenticación del dueño, nunca de un identificador de la petición o del enlace. Un dueño con dos cuentas se autentica en cada una (artículo 2) |
| REQ-015 | Cumple WCAG 2.2 AA, se usa con teclado y en móvil y está entera en español (artículos 10 y 12). Tiene estados vacíos propios (sin compuerta instalada, sin exclusiones, sin pendientes, sin historial, sin resúmenes) y de error (sin conexión con la cuenta, cambio no guardado, sin permiso y estado ilegible, que dice que la compuerta no envía, requisito 24 de la 016) |

## Casos negativos

En todos, el estado no cambia, salvo lo que se indica, y el intento que llega a la vía protegida queda en el historial según REQ-010 (artículo 3).

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-016 | Petición preparada en otra página, un correo, un documento o un marco incrustado con la sesión del dueño abierta; enlace con parámetros que nombran un ajuste o valor; abrir, previsualizar o recargar una dirección; reenviar una petición ya usada | 0 cambios; ningún enlace llega a un cambio preseleccionado |
| REQ-017 | Sesión de otra cuenta del mismo cliente o de otro; sesión del panel de cliente o del superadmin, invitación o token del conector; identificadores cambiados en la petición o el enlace; delegado que intenta una relajante o una restrictiva no urgente | 0 lecturas y 0 cambios (el delegado, 0 de esas acciones). «Sin permiso», sin revelar si la otra cuenta existe ni si tiene compuerta |
| REQ-018 | El agente, con cualquier herramienta de su asistente (correo, nube, navegador u otra), por iniciativa propia o por instrucción oculta, intenta una acción, reenvía un enlace, rellena una confirmación o altera lo que ve el dueño, también el aviso de un pendiente; con el navegador, aprovecha un inicio de sesión reciente, una reautenticación de otra acción o una contraseña autocompletada, o da todos los pasos y deja al dueño solo la presencia (artículos 7 y 8) | 0 alteraciones de lo que ve el dueño o, si altera el aviso de un pendiente, ese cambio sin efecto (REQ-009). Sin su presencia, ninguna relajante ni restrictiva no urgente. Si el dueño solo completa la presencia, esta nombra el cambio o el cambio queda pendiente (REQ-009). Una restrictiva urgente que el agente logre con el navegador solo detiene, queda en el historial y es riesgo residual |
| REQ-019 | Doble clic, envío repetido, dos pestañas o dispositivos a la vez; estado que cambia antes de aplicar una relajante o durante el plazo de un pendiente; pendientes opuestos sobre un ajuste | Cada acción se aplica una vez y deja una entrada. Una relajante, o un pendiente al vencer, no se aplica si el estado cambió desde su confirmación; se muestra el actual. Toda restrictiva urgente, y siempre desactivar, anula los pendientes relajantes. Entre relajante y restrictiva a la vez, o entre pendientes de un ajuste, prevalece la más restrictiva |
| REQ-020 | Fallo al guardar en cualquier paso, error del proveedor, historial no escribible, aviso de pendiente que no consta en la cuenta del dueño o estado ilegible | Nada a medias: activación fallida, compuerta desactivada; apagado fallido, filtro encendido; pendiente sin aviso, sin efecto. Una relajante que no queda en el historial no se aplica; una restrictiva se aplica si se puede y se avisa si no quedó anotada. Se muestra el estado real, nunca el pedido |
| REQ-021 | Sesión caducada; reautenticación fallida, cancelada, caducada, ya usada o hecha para otro cambio u otro valor; cuenta sin permiso para instalar o ejecutar la compuerta (p. ej., por política de la organización) | 0 cambios y mensaje en español. Al volver, nada pendiente se aplica solo. Sin permiso no queda nada instalado a medias y la compuerta sigue desactivada |

**Supuestos** (los cambia el responsable si quiere):
- La reautenticación propia caduca a los 5 minutos; un cambio pendiente espera 24 horas; como mucho 3 peticiones de presencia por hora y cuenta.
- La coordinación lee «bajar y no subir» (artículo 8) como el requisito 9 de la 016: nunca por encima del máximo del código (REQ-008).
- En la primera instalación, los pasos de REQ-004 los da el flujo de instalación.
- Que el agente lea historial o resúmenes, si la plataforma lo deja, no incumple esta función; cambiarlos u ocultarlos, sí (requisitos 11 y 13 de la 016).

**Riesgo residual.** Quien tenga la contraseña y el segundo factor del dueño, o un administrador de su organización con poder sobre la cuenta, es «el dueño» para el proveedor, y una página falsa que imite la vía protegida puede robarlas; lo dificultan, sin impedirlo, el punto (f), la reautenticación propia y que el dueño reconozca la dirección auténtica (`propuestas.md`, T-1). El dueño puede aprobar por costumbre una presencia nominativa, y un agente con navegador sobre su sesión, hacer restrictivas urgentes, como cancelar una y otra vez pendientes legítimos, que solo restan disponibilidad (REQ-018).

## Criterios de aceptación

Pruebas deterministas con umbral del 100 %, salvo que se diga otra cosa.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | El dueño autenticado entra y ve su estado. Cada sesión, invitación o token de REQ-017 y sin sesión, 10 intentos: 0 accesos y 0 lecturas. Delegado distinguible, 10 intentos por relajante y por restrictiva no urgente: 0 cambios; sus urgentes constan como suyas. Plataforma (real o simulada) que no distingue al delegado: sin vía protegida | REQ-001, REQ-017 |
| CA-002 | Recién instalada: desactivada, y se dice. Activar: 1 acción, activada y con entrada. Desactivar: 1 acción, registrada antes de la siguiente decisión de la compuerta, que da 0 envíos (criterio 28 de la 016). «Parar» de HumanaIA: se muestra «detenida por HumanaIA» y la activación del dueño no cambia | REQ-002 |
| CA-003 | Con HumanaIA inalcanzable y con la licencia revocada, cada restrictiva urgente se aplica con una confirmación y sin reautenticación, y no se da por hecha antes de quedar registrada | REQ-003 |
| CA-004 | Para cada relajante y restrictiva no urgente, también restablecer, deshacer y una edición mixta, se quita o altera un paso cada vez: sin valores, sin aviso, sin confirmación o con la opción por defecto (Intro o toque), sin reautenticación o con una previa a ver el cambio, de 6 minutos, ya usada, para otro valor o de otra acción, solo con un inicio de sesión reciente o con contraseña autocompletada en el navegador del agente: 0 cambios. Con todos los pasos: 1 cambio y 1 entrada; si es nominativa, se aplica el cambio que nombra el paso de presencia; si no, queda pendiente (CA-009). El agente da todos los pasos y el dueño solo la presencia, 10 por acción: 0 cambios o pendiente cancelable. Cuarta petición de presencia en una hora: no se emite. Plataforma simulada sin garantía de presencia: estas acciones no se ofrecen | REQ-004, REQ-021 |
| CA-005 | El aviso contiene (a) a (g), revisado contra la lista, y el (e) solo al apagar el filtro; ningún texto afirma un compromiso de HumanaIA. Con teclado y dos lectores de pantalla (escritorio y móvil): recibe el foco, se lee entero, por defecto no cambia y no se cierra solo. Con 5 personas ajenas al equipo, al menos 4 explican con sus palabras (b), (c), (e) y (f) | REQ-005 |
| CA-006 | Se excluyen una dirección y un dominio ASCII y otros dos no ASCII. Correos de un contacto previo desde cada uno, desde un subdominio y, en los no ASCII, con el dominio en su otra forma: 0 envíos (criterio 4 de la 016). Direcciones de prueba de la 016 que la compuerta podría responder: 0 rechazos. Once o más entradas no válidas (vacía, solo espacios, sin arroba, dos arrobas, caracteres de control o invisibles, longitud excesiva, comodín, nombre visible con dirección, «+» mal formada…): 0 cambios y mensaje en español. Lo guardado es igual a lo mostrado. Añadir y retirar siguen CA-004; retirar la de alguien sin contacto previo da 0 envíos | REQ-006 |
| CA-007 | Filtro apagado: cada pantalla muestra el indicador con fecha, accesible con lector de pantalla. Encenderlo: 1 acción sin reautenticación, no mostrado encendido antes de estarlo, y las esperas con textos del criterio 7 de la 016 dan 0 envíos. Apagar y encender: 2 entradas con fecha y hora | REQ-007, REQ-003 |
| CA-008 | Cada tope muestra el máximo. Bajar a 0 y a un intermedio y subir hasta el máximo siguen CA-004; al tener efecto rige el nuevo. Por encima, negativo, decimal, texto, vacío o con espacios: 0 cambios y mensaje en español | REQ-008 |
| CA-009 | Con 20 esperas y 3 pendientes, la lista muestra lo de REQ-009, con el texto idéntico al que saldría. Cancelar cada uno y «cancelar todos» con 5: 0 envíos y 0 cambios con efecto. Los enlaces de los avisos llevan a la lista con 0 cancelaciones; no hay control para adelantar, acortar ni aplicar ya. Cada aviso de pendiente llega a la cuenta del dueño y contiene lo de REQ-009, revisado contra la lista. Resumen diario retrasado simulado: 0 pendientes con efecto antes de figurar en uno. Plataforma simulada sin garantía ni detección para el aviso: solo nominativa | REQ-009 |
| CA-010 | Cada tipo de decisión y cambio y cada motivo de la 016 aparece como línea en español con fecha y hora. Con 7 días simulados se consultan los 7 resúmenes. El estado actual muestra todo lo de REQ-010 y coincide al 100 % con la cuenta. Tras 1.000 peticiones falsificadas rechazadas, 20 presencias rechazadas o ignoradas y 1 relajante: unos y otras, agrupados o limitados; la relajante, en el historial y en el resumen del día | REQ-010 |
| CA-011 | Instalar, reinstalar, actualizar y volver atrás siguen CA-004, con versión y huella a la vista antes de confirmar. Con el filtro apagado, tras cada una: filtro encendido y compuerta sin activar. Actualizar con pérdida simulada del estado: desactivada y aviso. Versión y huella iguales a las del repositorio. Con una versión nueva publicada, lo instalado no cambia. Servidor de HumanaIA comprometido simulado (todo lo que entrega, alterado) y versión retirada o alterada en el repositorio, también entre la confirmación y el efecto de un pendiente: 0 instalaciones. Ningún paso de la guía ni del soporte pide credenciales del dueño | REQ-011 |
| CA-012 | 40 intentos o más: enlaces con parámetros en correos, documentos de la nube y mensajes del panel; textos del prompt; avisos y correos con aspecto de HumanaIA; servidor de HumanaIA comprometido, simulado alterando todo lo que entrega. Cada uno intenta activar, apagar el filtro, retirar exclusiones, subir topes o cancelar: 0 cambios sin los pasos que pide cada acción, 0 cuadros rellenados o preseleccionados, 0 enlaces a otro sitio que el inicio o la lista de pendientes | REQ-012, REQ-016 |
| CA-013 | Con la red y los registros de HumanaIA (servidor, errores y analítica) capturados durante todos los criterios: 0 direcciones, dominios, textos, motivos o entradas del historial; ninguna tabla de HumanaIA para exclusiones, historial, resúmenes, esperas ni pendientes; revisión de privacidad sin hallazgos | REQ-013 |
| CA-014 | Cuentas A1 y A2 del cliente A y B del cliente B; 20 intentos por par cambiando identificadores en peticiones y enlaces: 0 lecturas y 0 cambios ajenos, sin distinguir si la otra cuenta existe. Un dueño de A1 y A2 ve cada una solo tras autenticarse en ella | REQ-014, REQ-017 |
| CA-015 | Todas las pantallas, avisos y estados, también con el filtro apagado: WCAG 2.2 AA automática con 0 fallos y manual (teclado, lector de pantalla, 200 % y 320 px) sin hallazgos A o AA; 100 % en español. Cada estado de REQ-015 se provoca y muestra su pantalla | REQ-015, REQ-020 |
| CA-016 | Cada caso de REQ-016 para cada acción, también la previsualización del enlace por el cliente de correo: 0 cambios | REQ-016 |
| CA-017 | Cada herramienta del agente en cada asistente admitido (correo, nube y, si lo tiene, navegador), por iniciativa propia y por instrucción oculta, prueba los casos de REQ-018: 10 veces por acción y, contra el aviso de un pendiente (archivar, marcar leído, etiquetar, filtrar o enterrar), 10 veces por herramienta; con el navegador, también los casos de presencia de CA-004. Resultado: el de REQ-018 al 100 %; el aviso queda visible sin cambios o ese cambio no tiene efecto | REQ-018, REQ-009 |
| CA-018 | Doble clic y envío repetido, 50 veces por acción: 1 cambio y 1 entrada. Relajante confirmada en una pestaña tras un cambio en otra, y pendiente con el estado cambiado tras confirmarlo, 20 veces: 0 aplicados y estado actual mostrado. Relajante y restrictiva a la vez, 20 veces: prevalece la restrictiva. Pendientes «apagar filtro» y «retirar exclusión» y, antes del plazo, desactivar y reactivar o cualquier otra urgente: 0 aplicados. Dos pendientes opuestos sobre un ajuste: rige el restrictivo | REQ-019 |
| CA-019 | Fallo simulado en cada paso del guardado y en cada caso de REQ-020, 10 por acción: lo que pide REQ-020 en el 100 %, con el estado mostrado igual al real; con estado ilegible, además, 0 envíos (criterio 27 de la 016) | REQ-020 |
| CA-020 | Sesión caducada a mitad de una acción; reautenticación fallida o cancelada; instalación bloqueada por la organización: 0 cambios, mensaje en español y, al volver, 0 acciones aplicadas sin repetirlas. Bloqueada: nada instalado y compuerta desactivada | REQ-021 |

## Fuera de alcance

- Condiciones de envío, filtro, espera, topes del código, interruptor, resumen e historial como datos (016); aquí solo se cambian y consultan.
- Aprendizaje con los 100 últimos correos (018); marca y categoría del agente (012).
- Interruptor y cifra en los paneles superadmin y de cliente (fases 3 a 5).
- Dónde vive la vía protegida y cómo se construye en Gmail y Outlook: lo decide el diseño (`propuestas.md`, T-1).
- Importar o exportar exclusiones; varias cuentas desde una sola sesión.
- Permiso de enviar para el agente, que no tiene (requisito 17 de la 016).
- Condiciones del servicio sobre el riesgo residual (052).

## Cuestiones abiertas

Queda una, del responsable; no bloquea, porque ya rige el valor seguro (B). La 2 y la 3 las fijó la coordinación (D-036; `aclaraciones.md`).

1. **¿Se compromete HumanaIA a no pedir nunca a un cliente que active la compuerta, apague el filtro, retire exclusiones o suba topes?** Afecta al punto (f), al soporte, a la 052 y a `marketing/`.
   - A. Sí, por escrito en el aviso y en las condiciones (052): toda petición así se reconoce como engaño.
   - B. No; el aviso solo dice que toda petición de relajar, también una que parezca de HumanaIA, puede ser un engaño. Es lo que rige mientras no se decida.
   - Recomendación: A, con soporte y `marketing/` alineados antes de publicarlo.

## Dependencias y decisiones relacionadas

- Constitución 1.4, artículos 1, 2, 3, 7, 8, 10, 11 y 12; D-038 y D-036; condiciones y dictámenes del `auditor-seguridad` (`docs/propuesta-enmienda-articulo-8-v14.md` y esta carpeta).
- 016 (APROBADA): requisitos 7 a 15, 18, 21, 24 y 25; condición 2 de su `dictamen-especificacion-2.md` (punto (d)).
- Verificación en Gmail y Outlook (P-02 de la 016; `propuestas.md`, T-2).
- Sistema de diseño de la fase 3 (`docs/DISENO.md`), si la plataforma lo admite.
- Ruta crítica: `revisor` y `auditor-seguridad` en cada cambio (`propuestas.md`, P-03).

## Aprobación

Puerta P0. La abre el responsable, o la coordinación por delegación (D-036), con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 21/11/2026 | Coordinación, aprobado por delegación D-036 | APROBADA. `auditor-seguridad`, 4.ª vuelta: APTO CON CONDICIONES, sin bloqueantes ni MAYOR (`dictamen-especificacion-2.md`). R-1 a R-4 pasan al diseño como condiciones vinculantes. Cuestión 1 pendiente del responsable: no bloquea, rige el valor por defecto seguro |
