# 017 · Propuestas para coordinación, diseño y otras funciones

Cambios que esta función necesitaría fuera de su carpeta. El carril B2 no los edita: los anota aquí. Ninguno está aplicado.

Fecha: 21/11/2026 · Autor: `especificador`, para el orquestador del carril B2. Revisado tras el dictamen del `auditor-seguridad` sobre la especificación (APTO CON CONDICIONES) y tras su segunda vuelta (N1 a N3) y su tercera (M-1, M-2 y m-1 a m-5).

## T-1. Dónde vive la vía protegida (tensión para el diseño; no la decide la especificación)

**Hechos que chocan**

1. El estado de la compuerta vive en la cuenta del cliente: exclusiones, historial, resúmenes y esperas, con direcciones y textos (requisitos 12, 13 y 15 de la 016). HumanaIA no lo recibe ni lo guarda (artículo 1; REQ-013 de la 017).
2. El artículo 8 no deja al servidor activar la compuerta, desactivar sus filtros ni cambiar su código, exclusiones o topes. Además, «nada de lo que entregue el servidor puede relajarlo» (REQ-012 de la 017: tampoco un servidor comprometido).
3. Las sesiones del panel de cliente las emite HumanaIA, por invitación de un superadmin (requisitos 1 y 2 de la 040). Una sesión que HumanaIA puede crear no basta para identificar al dueño (REQ-001 de la 017).
4. El dueño tiene que poder desactivar, cancelar y encender el filtro con HumanaIA caída (REQ-003 de la 017).

Si la vía protegida es una pantalla del panel de cliente, el servidor no puede leer el historial, las esperas ni las exclusiones sin llevarse contenido. Y si es HumanaIA quien entrega el código de esa pantalla, un servidor comprometido podría servir una pantalla que relaje ajustes cuando el dueño confirme.

**Opciones**

| Opción | Qué es | A favor | En contra |
| --- | --- | --- | --- |
| A. Interfaz en la cuenta del cliente | La sirve la propia compuerta instalada, fijada a una versión, y el dueño entra autenticado por su proveedor | El contenido no sale de la cuenta. HumanaIA no puede alterar el código instalado. Funciona sin HumanaIA. Cumple REQ-001, REQ-003, REQ-012 y REQ-013 sin más | Depende de lo que permitan Gmail y Outlook (T-2): servir una interfaz, reautenticación propia ligada al cambio, protección contra peticiones falsificadas, accesibilidad y quedar fuera del alcance de los conectores del agente. Puede que el sistema de diseño de la fase 3 no se aplique entero. Hay dos implementaciones |
| B. Pantalla del panel de cliente que lee y escribe desde el servidor | El servidor de HumanaIA accede a la cuenta del cliente | Un solo panel | Incumple el artículo 1, porque el contenido pasa por HumanaIA, y el artículo 8, porque el servidor podría cambiar ajustes y emite la sesión. Descartable salvo enmienda |
| C. Pantalla del panel que habla desde el navegador directamente con la cuenta | El código lo entrega HumanaIA y los datos van del navegador a la cuenta del cliente | El contenido no pasa por los servidores de HumanaIA | El código lo entrega HumanaIA: un servidor comprometido puede servir otro que relaje ajustes (artículo 8, REQ-012). Además, HumanaIA necesitaría una aplicación con permisos sobre el correo del cliente, lo que amplía el riesgo y la verificación de Google y Microsoft. No sirve sin una garantía de integridad del código entregado que hoy no está verificada |
| D. Mixta | A para todo, y el panel de cliente solo con un enlace sin parámetros al inicio de A y, como mucho, la cifra de envíos (requisito 15 de la 016) | Lo de A, y el dueño encuentra la configuración desde un sitio que ya conoce, lo que ayuda a reconocer la dirección auténtica | Lo de A |

**Criterios que el diseño debe cumplir con la opción que elija** (del dictamen del `auditor-seguridad`):

- (a) **Origen del código en la opción A.** El dueño instala (cuestión 2, opción A) un código cuya integridad se comprueba contra el repositorio, nunca contra una copia, una guía o un aviso entregados por HumanaIA, que un servidor comprometido podría alterar (REQ-011). El diseño fija cómo conoce el dueño la dirección auténtica de ese repositorio sin depender de nada que sirva HumanaIA (por ejemplo, la misma dirección en las condiciones aceptadas y en la pantalla de la propia plataforma, comparables entre sí), y que la lista de versiones retiradas sale del repositorio y no del servidor. Las versiones retiradas no se instalan. **Enmienda 1 (D4):** en Gmail los disparadores ejecutan la última edición del proyecto, así que la versión solo se mantiene mientras nadie más lo edite. Por eso la compuerta comprueba su propia huella antes de cada envío y no envía si no coincide o no lo puede comprobar (requisito 14 de la 016; NC-9), y la instalación advierte de no compartir el proyecto ni su contenedor (REQ-011). Esa comprobación no protege frente a un editor que la quite: lo cubren el requisito 17 de la 016 (sin herramientas de nube que compartan, borren o actualicen y sin navegador con la sesión del dueño) y la advertencia.
- (b) **Fuera del alcance del agente.** El conector de nube del agente no puede leer ni editar el proyecto instalado, su código ni sus propiedades. En Gmail el proyecto es un archivo de Drive: el diseño demuestra que los permisos del conector de Drive no lo alcanzan (REQ-012, REQ-018). **Enmienda 1:** la verificación no lo demuestra y con ChatGPT sí llega (alcance `drive`); queda como NC-3 del piloto y, mientras tanto, rige el bloqueo de herramientas del requisito 17 de la 016.
- (c) **Suplantación.** El dueño puede distinguir la dirección auténtica de la vía protegida de una página falsa que la imite (riesgo residual de la especificación). La opción D ayuda, porque ofrece un punto de entrada conocido.

**Enmienda 1 (21/11/2026):** la coordinación fija que en Gmail la vía protegida, con avisos, historial y resúmenes con autoridad, la sirve el propio proyecto de la compuerta (opción A, o D si el panel enlaza a su inicio). Outlook queda fuera (D5).

**Recomendación del especificador para el diseño:** A o D. B queda fuera por los artículos 1 y 8, y C mientras no haya integridad verificada del código. Lo decide el diseño tras T-2, con dictamen del `auditor-seguridad`. Si ninguna plataforma permite A, el diseño se detiene y vuelve a la coordinación: la 016 no se activa (requisito 18 de la 016).

## T-2. Ampliar la verificación de plataformas (P-02 de la 016, `docs/TECNOLOGIAS.md`)

Añadir filas VERIFICAR, para Gmail y para Outlook:

- Si el código instalado en la cuenta puede servir al dueño una interfaz propia, accesible, en español y usable en móvil.
- Si esa interfaz puede pedir una reautenticación propia después de mostrar el cambio, ligada a ese cambio y valor, de un solo uso y con caducidad, y si exige una presencia del dueño que no aporte una contraseña autocompletada ni el navegador del asistente (REQ-004; si no, no se ofrecen relajantes ni restrictivas no urgentes). Y si el propio paso de presencia puede mostrar el cambio concreto en una superficie que el agente no controle (reautenticación nominativa); si no, esas acciones solo tienen efecto tras el plazo de cambio pendiente, con aviso en la cuenta del dueño.
- Si el aviso de cambio pendiente puede quedar fuera del alcance del agente con la misma garantía que el resumen de la 016 (que no pueda archivarlo, marcarlo leído, etiquetarlo, filtrarlo, moverlo ni borrarlo); si no, si toda alteración del aviso que no haga el dueño se puede detectar, para que impida el cambio; y si ninguna de las dos, en esa plataforma no hay cambio pendiente y las relajantes y restrictivas no urgentes solo se ofrecen con reautenticación nominativa (REQ-009). Y si el plazo se puede ligar a que un resumen diario haya incluido el pendiente.
- Si admite protección contra peticiones falsificadas, cambios solo por acciones que no sean abrir una dirección, y negarse a cargarse dentro de otro sitio.
- Si los conectores de correo y nube del agente, o un navegador que maneje el asistente, pueden invocarla, rellenarla, alterar lo que muestra o leer y editar el proyecto instalado y sus propiedades (criterio b de T-1).
- Si la plataforma distingue al titular de un delegado o de un administrador de la organización (cuestión 3: si no distingue, la vía protegida no se ofrece).
- Cómo se comprueba la integridad del código instalado y la lista de versiones retiradas contra el repositorio, y cómo reconoce el dueño su dirección auténtica, sin fiarse de nada que entregue HumanaIA (criterio a de T-1).
- Si una política de la organización puede bloquear la instalación, y cómo se detecta sin dejarla a medias (REQ-021).
- Si el dueño puede desactivarla sin la interfaz y sin HumanaIA, por ejemplo desinstalándola desde los ajustes del proveedor (REQ-003).

## Documentos compartidos (chat de coordinación)

| N.º | Documento | Cambio propuesto | Motivo |
| --- | --- | --- | --- |
| P-01 | `docs/PLAN.md`, fase 2 | Renombrar la 017 a «Vía protegida del dueño». Describirla así: activar y desactivar, exclusiones, filtro con aviso del riesgo, topes, cancelar esperas, historial y resúmenes, instalar fijada a una versión; protegida contra peticiones falsificadas, enlaces con parámetros e ingeniería social, y con reautenticación propia para relajar. Quitar «crear y borrar reglas». Va junto a P-01 de la 016 | El plan sigue con la 1.3 |
| P-02 | `docs/SEGURIDAD.md`, amenazas | Añadir: petición falsificada contra la vía protegida; enlace con parámetros o preseleccionado; ingeniería social para que el dueño active o apague el filtro (correo, agente, falso soporte, también con aspecto de HumanaIA); página falsa que imita la vía protegida y roba la reautenticación; servidor comprometido que entrega una interfaz, una guía o un código alterados; agente con navegador que aprovecha la sesión o la contraseña autocompletada del dueño, o da todos los pasos y le deja solo una presencia que no nombra el cambio; conector de nube que alcanza el proyecto instalado; delegado o administrador de la organización; doble envío y carreras entre pestañas; inundación del historial con intentos rechazados. Ampliar A-21 a la vía protegida | REQ-010, REQ-011, REQ-012, REQ-016 a REQ-019 |
| P-03 | `docs/SEGURIDAD.md`, «Rutas críticas» | Incluir la vía protegida y la instalación en la ruta crítica de la compuerta (P-04 de la 016) | Es el único camino para relajar la compuerta (artículo 8) |
| P-04 | `docs/ARQUITECTURA.md` | Si el diseño elige A o D, añadir la vía protegida como pieza en la cuenta del cliente, con su «No hace»: no llama a HumanaIA para leer ni guardar estado y no la sirve HumanaIA. En «Fronteras», añadir «Navegador del dueño → vía protegida», controlada con la autenticación del proveedor, la reautenticación propia y la protección contra peticiones falsificadas | REQ-001, REQ-012, REQ-013 |
| P-05 | `docs/INSTALACION-CLIENTE.md` | En el paso opcional de la compuerta (P-07 de la 016): la instala el dueño con su sesión, fijada a una versión, comprobando versión y huella contra el repositorio; dónde está la vía protegida y cómo reconocer su dirección auténtica; cómo desactivarla sin ella. El paso de activar va aparte, tras el aviso | REQ-011, REQ-003 |
| P-06 | Configuración de informes de errores (Sentry) | Si alguna parte de la vía protegida informa errores a HumanaIA, debe hacerlo sin contenido. Con la opción A, la compuerta solo llama a la red para el interruptor y la cifra (requisito 14 de la 016), así que no informa errores a HumanaIA | REQ-013 |
| P-07 | `marketing/` y soporte | Mientras el responsable no decida la cuestión 1, no publicar compromiso alguno de HumanaIA sobre no pedir relajar la compuerta; con A, decir que HumanaIA nunca lo pedirá | Ingeniería social |

## Otras funciones

| N.º | Función | Asunto | Motivo |
| --- | --- | --- | --- |
| P-08 | 040 y 041 (fase 5, panel de cliente) | Anotar que el panel no ofrece acciones sobre la compuerta y que su sesión no da acceso a la vía protegida. Si enlaza a ella, solo a su inicio y sin parámetros. Puede mostrar la cifra de envíos de la 016 | REQ-001, REQ-012 |
| P-09 | 016 (diseño) | La condición 2 del dictamen 2: si fija una antigüedad máxima del contacto previo, el punto (d) del aviso lo dice; si no, nombra el riesgo. Además, las listas de motivos de la 016 necesitan su frase en español para el historial, y la comparación de exclusiones usa la misma representación fija de direcciones y dominios que la 017 (requisito 21 de la 016) | REQ-005, REQ-006, REQ-010 |
| P-10 | 012 | El prompt y el arranque local dicen que el agente nunca pide al dueño activar la compuerta ni apagar el filtro, ni le pasa enlaces a la vía protegida | REQ-012, REQ-018 |
| P-11 | 052 (fase 6) | Condiciones del servicio: el riesgo residual de la 017 (credenciales del dueño, administrador de la organización, página falsa) y, según la cuestión 1, el compromiso de no pedir nunca relajar | Cuestión abierta 1; cuestión 2 (instala el dueño) |

## Añadido el 21/11/2026 con la enmienda 1

| N.º | Documento o función | Cambio propuesto | Motivo |
| --- | --- | --- | --- |
| P-12 | 040 y 041 (panel de cliente) | Si el cliente tiene una cuenta de Outlook.com o Microsoft 365, el panel dice que el envío sin revisión solo está en Gmail; nunca ofrece instalarla. Para saberlo, guarda solo un valor de lista cerrada (Gmail, Outlook.com o Microsoft 365), nunca una dirección ni un dominio (m-4 del dictamen de la enmienda 1; artículo 1) | REQ-022 |
| P-13 | `piloto-gmail.md` (arquitecto) | Que cubra NC-3 y NC-4 con cada asistente, NC-5 (llave de acceso dentro de la aplicación web) y el alta y la lectura del secreto de presencia de REQ-023. Vuelta de corrección 21/11/2026: dónde guardar el secreto sin que lo muestre ninguna pantalla del proyecto (NC-4), si el código de un solo uso es posible en la aplicación web y NC-13 de la 016 aplicado a los pendientes | REQ-009, REQ-023, REQ-024 |
| P-14 | `docs/INSTALACION-CLIENTE.md` | Junto a P-05: alta del código de presencia en un dispositivo del dueño, sin el asistente abierto con navegador ni con control del equipo, sin autenticador en el navegador, gestor que rellene solo ni aplicación en el equipo que controla el asistente, y advertencia de no compartir el proyecto | REQ-011, REQ-023 |
| P-15 | Tamaño de la especificación | Con la enmienda supera los 25 KB de D-023. Si la coordinación lo pide, se divide en dos funciones: vía protegida (REQ-001 a REQ-010 y REQ-012 a REQ-021) e instalación y presencia en Gmail (REQ-011, REQ-022 a REQ-024) | D-023 |

## Añadido el 21/11/2026 con la vuelta de corrección 3

| N.º | Documento o función | Cambio propuesto | Motivo |
| --- | --- | --- | --- |
| P-16 | `docs/SEGURIDAD.md`, amenaza A-21 | Ampliar A-21 («Ataques de sesión en los dashboards») a la vía protegida de la compuerta en la cuenta del dueño: datos que no escribe ella (texto de candidatos, direcciones, nombres visibles, lo aprendido de la 018) mostrados como texto inerte, nunca como HTML o guion, con caracteres invisibles, de control y de dirección del texto a la vista; lo que confirma el dueño construido desde el estado de la página, nunca desde esos datos; además de la protección contra peticiones falsificadas e incrustación que ya pide | m-2 de `dictamen-enmienda-2.md`; REQ-012 y CA-017; artículos 7 y 8 |
| P-17 | `piloto-gmail.md` (arquitecto) | Junto a P-13: si la reinstalación en el mismo proyecto conserva las propiedades (NC-4), y cómo sirve la plataforma los datos en la aplicación web de la compuerta, para comprobar el texto inerte de REQ-012 | `dictamen-enmienda-2.md`, «No comprobado» |

## Contradicciones y riesgos detectados

1. **Fase del panel de cliente.** El encargo sitúa el panel de cliente en la fase 4. `docs/PLAN.md` lo pone en la fase 5 (040 a 049), y la 040 dice «Fase: 5». La 017 usa la fase 5.
2. **El plan de la fase 2 sigue con la 1.3.** Describe la 017 como «Reglas e interfaz del dueño» y cita el requisito 19 de la 016, que ahora es el 18 (P-01).
3. **«Bajar y no subir».** La coordinación lee el artículo 8 como «nunca por encima del máximo del código» (requisito 9 de la 016 y REQ-008 de la 017): volver a subir hasta ese máximo es una acción relajante. Si el responsable quiso decir que, una vez bajado, un tope no se sube nunca, hay que cambiar REQ-008.
4. **Riesgo residual que el código no cubre.** Quien tenga las credenciales del dueño, o un administrador de su organización, es «el dueño» para el proveedor. Lo recoge la especificación y debe recogerlo la 052.
5. **Plataformas que no cumplan.** Si una plataforma no distingue titular de delegado, o no garantiza la presencia del dueño en la reautenticación propia, en ella no se podrá activar la compuerta (REQ-001, REQ-004). Si garantiza la presencia pero no la nominativa, cada relajante y cada restrictiva no urgente tardará el plazo de cambio pendiente (24 horas por defecto) en tener efecto.
6. **Restrictivas urgentes por el agente.** Un agente con navegador sobre la sesión abierta del dueño puede desactivar, cancelar o encender el filtro con una sola confirmación (REQ-003, REQ-018). Se acepta como riesgo residual porque solo detiene envíos y queda en el historial; añadir exclusiones o bajar topes ya pide presencia. `aclaraciones.md`, cuestión 3, dice aún «acciones restrictivas» para el delegado: la especificación lo restringe a las urgentes, y conviene que la coordinación lo alinee. Conviene que la coordinación lo tenga en cuenta al planificar la oferta de la 016.
7. **Región.** `docs/ARQUITECTURA.md` sigue con `fra1` y `eu-central-1`, frente a D-020. Ya estaba anotado en la 016 y no afecta a la 017.
