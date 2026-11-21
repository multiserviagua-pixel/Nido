# 016 · Verificación de Gmail y Outlook antes del diseño

Estado: VERIFICACIÓN DOCUMENTAL TERMINADA. Faltan las pruebas reales del apartado 7.
Fecha de consulta de todas las fuentes: 21/11/2026 · Autor: `arquitecto`, paso previo al diseño de la 016, la 017 y la 018 (carril B2). Skill `verificar-decision`.

Cubre la P-02 de `propuestas.md` de la 016, la T-1 y la T-2 de la 017 y la P-5 de la 018. Solo dice qué se puede hacer y qué no, con su fuente. No diseña nada. Lo que habría que cambiar en documentos compartidos va como propuesta en el apartado 8; no se ha tocado `docs/`.

**Método.** Solo documentación oficial de Google, Microsoft, Anthropic y OpenAI, más el RFC 8601. Lo que solo apareció en un resultado de búsqueda y no se leyó entero va marcado «(búsqueda)». Si no hay fuente oficial, el veredicto es NO SE PUDO COMPROBAR. No se ha hecho ninguna prueba real ni se ha enviado ningún dato del proyecto a servicios externos. Ninguna página contenía instrucciones dirigidas a agentes.

Veredictos: SÍ · NO · PARCIAL · NO SE PUDO COMPROBAR (NSC). Los códigos entre corchetes remiten a las fuentes del apartado 9.

## 0. Resumen

- **Gmail (Apps Script con la API de Gmail): viable con restricciones**, pero hoy **no se puede activar**. Hay tres bloqueos que solo puede resolver una prueba real o la coordinación (D1 a D3 del apartado 4).
- **Outlook: no viable por ahora.** No existe un sitio en la cuenta donde ejecutar la compuerta sin un servidor. En cuentas personales no hay ninguno. En Microsoft 365 solo lo habría con Power Automate o con recursos del propio cliente en Azure, y casi nada de eso se pudo comprobar (D5).
- **Hallazgo transversal.** Los conectores de correo y de nube del agente pueden mover, etiquetar, filtrar y enviar a la papelera los correos, y en ChatGPT también compartir y borrar archivos de Drive. El historial de cambios de Gmail no dice quién hizo cada cambio. Por eso ningún aviso ni resumen que sea un correo queda fuera del alcance del agente (D3 y D4).

## 1. Qué conectores y permisos tiene el agente

Según `docs/INSTALACION-CLIENTE.md`, paso 4: en el correo se bloquean enviar, eliminar y reenviar automático, y se dejan leer, etiquetar, archivar y crear borradores; en la nube se bloquean eliminar y compartir, y se dejan leer, crear carpetas y crear archivos. El prompt 1.2 (`docs/referencia/agente-ia-1.2.md`, líneas 43, 82 y 111) añade dos cosas: el agente puede tener un navegador con la sesión del dueño, y en conversación puede enviar un borrador concreto si el dueño se lo confirma.

| Conector | Qué puede hacer (fuente oficial) | Lo que importa aquí |
| --- | --- | --- |
| Gmail en Claude, hecho por Google | 29 herramientas; se ven 24: `create_draft`, `create_filter`, `create_label`, `delete_label`, `forward`, `get_message`, `get_thread`, `label_message`/`_thread`, `unlabel_message`/`_thread`, `list_drafts`, `list_filters`, `list_labels`, `mark_*_spam`, `unmark_message_spam`, `reply`, `search_threads`, `send_message`, `trash_message`/`_thread`, `apply_sensitive_*_label` [A1]. El servidor MCP de Gmail de Google pide `gmail.readonly`, `gmail.compose` y `gmail.modify` [G33] | Puede enviar a la papelera, quitar la etiqueta de la bandeja (archivar), crear filtros y enviar. Ninguna herramienta visible inserta mensajes, pero `gmail.modify` basta para `messages.insert` [G2]. El paso 4 no menciona `create_filter` |
| Google Drive en Claude, hecho por Google | 11 herramientas, entre ellas `share_file`, `trash_file` y `update_file` [A2]. **Contradicción:** la referencia oficial del servidor Drive MCP lista 8 herramientas, sin esas tres, y los alcances `drive.readonly` y `drive.file` [G34] | Con `drive.file` solo podría escribir en los archivos que él crea. Qué alcance tiene de verdad el conector de Claude: NSC |
| Google en ChatGPT | Gmail con `gmail.modify`. Drive con `drive.readonly`, `drive.metadata.readonly`, `drive.activity.readonly` y `drive` «para crear, actualizar, compartir, mover, subir, copiar o borrar» [O1] | Con el alcance `drive` puede compartir o borrar un proyecto de Apps Script independiente (punto 3). Qué herramientas concretas expone: NSC |
| Microsoft 365 en Claude, hecho por Anthropic | Con cuenta profesional y escrituras activadas: enviar, gestionar borradores, etiquetas, filtros de correo y respuestas automáticas, y crear y actualizar archivos de OneDrive y SharePoint. Con cuenta personal: borradores, enviar y crear y actualizar archivos [A3] | Filtros (reglas de la bandeja) y archivos de OneDrive al alcance del agente |
| Permisos por herramienta en Claude | Cada herramienta se puede dejar en «permitir siempre», «pedir aprobación» o «bloqueada» (búsqueda) [A4] | Es el mecanismo del artículo 8 para impedir. ChatGPT: NSC |

## 2. Gmail: tabla por punto

| N.º | Veredicto | Fuentes | Notas |
| --- | --- | --- | --- |
| 1. Autenticación del proveedor y alineación | **PARCIAL** | [G9] [G4] [G10] [G11] [R1] [G2] | **Leerla, SÍ:** `getHeader` y `getRawContent` («equivale a Mostrar original») [G9]; en la API, `payload.headers` y `raw` [G4]. **Distinguirla de la que trae el propio correo, NSC:** Google no documenta si borra las `Authentication-Results` entrantes que llevan su identificador. El RFC 8601, §5, obliga a borrarlas a todo MTA conforme [R1], pero Google no dice que lo sea. Tampoco documenta el formato de su cabecera ni si `getHeader` devuelve la primera o la última cuando hay varias. **Riesgo:** un mensaje metido con `messages.insert` («como IMAP APPEND») [G2] entra con las cabeceras que elija quien lo mete. Hace falta `gmail.insert`, `gmail.modify` o `mail.google.com`, y `gmail.modify` lo tienen los conectores de Google para Claude [G33] y para ChatGPT [O1]. Ningún campo documentado distingue un mensaje insertado de uno entregado por SMTP; `internalDate` solo se describe para el correo SMTP normal [G4]. **Alineación:** el dictamen de DMARC exige que el dominio coincida con el `From` [G10]; si un correo reenviado supera SPF o DKIM pero ARC muestra un fallo anterior, Gmail lo trata como no autenticado [G11] |
| 2. Contacto previo en enviados | **PARCIAL** | [G1] [G5] [G12] [G8] [A1] | **Buscar, SÍ:** `messages.list` con `q`, el mismo formato que el buscador de Gmail; no funciona con `gmail.metadata` [G5]. La búsqueda no es exacta, así que la dirección exacta hay que comprobarla en las cabeceras analizadas. **«Etiquetado como enviado»:** imposible por la API, porque SENT no se puede poner a mano [G1]. **Pero SENT se pone solo** a lo enviado con `messages.send` o `drafts.send`, a lo insertado con `messages.insert` cuyo `From` es el usuario y a lo enviado desde la web [G1]. Así, un mensaje insertado con el `From` del dueño, lo enviado por otra aplicación conectada con permiso de envío y lo enviado por el conector del agente (`send_message`, `reply` o `forward` [A1], si no están bloqueados) **no se distinguen por la etiqueta**. Ningún campo documentado dice quién lo escribió. **Delegado:** «aparece su dirección» [G12]; qué cabecera la lleva: NSC. **Baja de lista por `mailto:`, respuesta a convocatoria y acuse de lectura:** NSC; no hay fuente oficial y fuentes de terceros dicen que la baja por `mailto:` queda en enviados. **Envíos de la propia compuerta:** SÍ, por su propio registro de identificadores, siempre que ese registro esté a salvo (punto 3). El historial de la cuenta no dice quién hizo cada cambio [G8] |
| 3. Estado fuera del alcance de los conectores | **PARCIAL** | [G16] [G13] [G26] [G25] [G27] [G24] [G34] [O1] [A1] [A2] [G8] | **Propiedades del script:** ningún conector documenta herramientas que lleguen a ellas. Que ninguna API las exponga: NSC. Los editores del proyecto las ven y las añaden desde la página de ajustes. «Nunca se comparten entre scripts» [G16]. Límites: 9 KB por valor y 500 KB por almacén [G13], lo que condiciona historial y resúmenes. **Proyecto independiente:** es un archivo de Drive [G26]. Importar o exportar su código por la API de Drive exige `drive.scripts` [G25], que no pide ningún conector [G34] [O1]. Con el alcance `drive` de ChatGPT [O1], o con el `share_file` y el `trash_file` que el directorio muestra para Claude [A2], se puede **compartir o borrar** el proyecto. Compartirlo como editor equivale a poder cambiar el código que ejecutan los disparadores (HEAD) [G24]. **Proyecto vinculado a un documento:** la API de Drive no llega a él [G25] y no aparece en Drive [G27], pero «quien puede editar el contenedor puede ver, editar y ejecutar su script» [G27]: compartir el contenedor tiene el mismo efecto. **Correo (avisos, resúmenes, marcas, borradores):** al alcance del agente (papelera, quitar o poner etiquetas, filtros, spam) [A1] [O1]. **Detectar una alteración:** SÍ; `history.list` da `labelAdded`, `labelRemoved` y `messageDeleted` [G8]. **Atribuirla al dueño:** NO; no hay campo de autor [G8]. Que el dueño lea el aviso (se quita UNREAD) no se distingue de que lo marque el agente. **Archivos de Drive (hojas, documentos):** al menos legibles con `drive.readonly`; la escritura depende del conector. Navegador del agente con la sesión del dueño: llega a todo lo anterior |
| 4. Responder en el hilo con permisos mínimos | **SÍ**, salvo la cabecera de respuesta automática (NSC) | [G4] [G7] [G6] [G5] [G9] [G17] [G32] | **Hilo:** `threadId`, `References` e `In-Reply-To` según RFC 2822, y el mismo `Subject` [G4] [G7]. El código construye el mensaje en bruto: `text/plain`, un solo `To`, sin copia, copia oculta ni adjuntos. **`Auto-Submitted`:** se puede escribir en el mensaje en bruto; que Gmail la conserve al enviar: NSC. **Alcances:** `gmail.send` (sensible) para enviar y `gmail.readonly` (restringido) para leer y buscar [G6]; `gmail.metadata` no admite `q` [G5]. `GmailApp` exige `https://mail.google.com/`, que permite el borrado permanente [G9] [G6]: no es el mínimo. Los alcances se fijan en `oauthScopes` del manifiesto. El consentimiento es granular y el dueño puede negar algunos [G17], así que el código tiene que comprobar los concedidos. Los alcances restringidos se usan «libremente en apps no públicas» [G17]. Sin verificación de Google si el dueño es el único usuario [G32]. **`GmailMessage.reply` responde a la dirección de respuesta**, no al remitente [G9]. Esto toca REQ-020. **No da permiso al agente:** la autorización es del proyecto del dueño, no del conector. Es una inferencia sin frase oficial expresa. Qué alcance hace falta para borrar el borrador candidato después de enviar: NSC |
| 5. Espera de 15 minutos y ejecuciones simultáneas | **SÍ**, con presupuesto | [G14] [G13] [G15] | `after(ms)`: «la duración real puede variar, pero no será menor que el mínimo indicado» [G14]. `everyMinutes` admite 1, 5, 10, 15 o 30 [G14]. Límites [G13]: 20 disparadores por usuario y script; 6 minutos por ejecución; **90 minutos al día de disparadores en cuentas personales** (6 horas en Workspace); 30 ejecuciones simultáneas por usuario; 100 destinatarios al día en cuentas personales y 1.500 en Workspace (por ejemplo, con MailApp); 50.000 lecturas o escrituras de propiedades al día en personales. **Simultaneidad:** `getScriptLock` impide que dos ejecuciones entren a la vez en una sección, sea cual sea el usuario [G15]. Los contadores con bloqueo son posibles con primitivas documentadas. Un disparador cada minuto deja unos 3,7 segundos de media por ejecución en una cuenta personal |
| 6. Código instalado, versión y huella | **PARCIAL** | [G27] [G24] [G22] [G23] [G16] | **Quién lo ve y lo edita:** los editores del proyecto o del contenedor [G27]. HumanaIA solo puede editarlo si se le comparte. **Fijarlo a una versión:** las versiones son inmutables [G22] (200 como máximo), pero **los disparadores ejecutan HEAD** [G24]. Lo instalado queda fijo solo mientras nadie más edite. **Biblioteca de HumanaIA por versión:** requiere acceso de lectura a la biblioteca [G23]. Su versión es inmutable [G22], pero el código lo entrega HumanaIA, que es el criterio (a) de la T-1. **Huella:** Apps Script no la expone. Calcularla desde el propio proyecto (API de Apps Script, `getContent`): NSC. **Reinstalar conservando el estado:** las propiedades son del proyecto [G16]; un proyecto nuevo empieza sin ellas. Si se conservan al cambiar el código en el mismo proyecto o al copiarlo: NSC. Lo que puede hacer un administrador de Workspace: NSC |
| 7. Presencia del dueño, peticiones falsificadas, titular o delegado, vía protegida | **PARCIAL** (presencia y paso nominativo: NO, o NSC) | [G19] [G12] [G31] [G21] [G30] [G18] [G20] | **Vía protegida (opción A de la T-1):** el propio proyecto puede servir una aplicación web. **Titular frente a delegado: SÍ.** Con acceso `MYSELF` solo la ejecuta quien la desplegó [G19], y el delegado entra con su propia cuenta [G12]. **Reautenticación ligada al cambio: NO documentada.** El OpenID de Google solo admite `prompt` igual a `none`, `consent` o `select_account`. No menciona `max_age`. `auth_time` y `amr` son opcionales [G31]. Apps Script no ofrece ningún paso de reautenticación (no se encontró). **Llave de acceso dentro de la aplicación web:** se sirve en un iframe aislado, y los permisos que lista la documentación no mencionan credenciales [G21]: NSC. **Paso nominativo (que la presencia muestre el cambio):** ninguna API de Google encontrada. **Primitiva disponible** (no es diseño): HMAC con SHA-1 o SHA-256 en `Utilities` [G30]. **Peticiones falsificadas:** `doGet` recibe parámetros por la dirección [G18], así que cualquiera puede preparar un enlace. Abrir la página dentro de otro sitio se impide con `XFrameOptionsMode.DEFAULT`; `ALLOWALL` lo permite [G20]. El navegador del agente con la sesión del dueño puede abrir la vía protegida |
| 8. Llamada de red y registros | **SÍ** | [G29] [G13] [G30] [G28] | `UrlFetchApp` con `script.external_request`. Valida certificados por defecto y sale de rangos de IP de Google [G29]. 20.000 llamadas al día en cuentas personales [G13]. **Comprobar la procedencia de la respuesta:** con HMAC se puede verificar comparando; **no hay función que verifique firmas RSA, ECDSA ni Ed25519** [G30]. **Registros:** el de ejecución dura poco; los registros en la nube quedan en el proyecto de Google Cloud asociado [G28]. No llegan a HumanaIA salvo que el código los envíe. Google recomienda no registrar direcciones [G28] |
| 9. Direcciones no ASCII | **NSC** | [G35] (búsqueda) | Gmail anunció en 2014 que reconoce direcciones con caracteres no latinos (blog oficial, búsqueda, no leído). Cómo devuelven la dirección `getFrom`, las cabeceras y `raw` (palabras codificadas, Unicode o punycode en el dominio): NSC. Hace falta prueba real |

## 3. Outlook: tabla por punto

| N.º | Veredicto | Fuentes | Notas |
| --- | --- | --- | --- |
| 1. Autenticación del proveedor y alineación | **PARCIAL** en Microsoft 365, **NSC** en Outlook.com | [M2] [M5] | `internetMessageHeaders`: solo lectura y solo con `$select` [M2]. Microsoft 365 añade `Authentication-Results` con `spf`, `dkim`, `dmarc`, `compauth` y `header.from` a todo el correo entrante [M5]. Los motivos de `compauth` 100 a 102 indican alineación; `bestguesspass` y los «implícitos» (2xx, 7xx) no son DMARC estricto [M5]. Si borra las cabeceras falsas entrantes: no lo dice [M5]. La página trata de organizaciones con buzones en la nube; las cuentas personales: NSC |
| 2. Contacto previo en enviados | **PARCIAL** | [M6] [M2] [M3] [M7] | La carpeta `sentitems` tiene nombre fijo [M6]. Responder, reenviar y enviar guardan el mensaje en Enviados [M2] [M3]. `from` y `sender` difieren en el envío por delegación o desde un buzón compartido [M2]. Existe «mover mensaje» [M2]; si un mensaje movido a Enviados se distingue de uno enviado: NSC. Power Automate marca lo que envía con `x-ms-mail-application` y `x-ms-mail-operation-type` [M7]. Otras aplicaciones vía Graph, bajas de lista, convocatorias y acuses: NSC |
| 3. Estado fuera del alcance de los conectores | **NO** en Outlook.com, **PARCIAL/NSC** en Microsoft 365 | [M1] [M8] [M6] [A3] | **No hay dónde ejecutar código en la cuenta.** Los complementos solo se activan con eventos de redacción, envío o apertura y con el cliente abierto; no hay evento de correo recibido (solo `OnMessageReadWithCustomHeader`, en vista previa y al abrir el mensaje); duran unos 300 segundos; el usuario tiene que seguir en ese elemento; y los basados en eventos solo funcionan desplegados por un administrador o publicados sin restricción en Marketplace [M1]. **Los flujos de nube de Power Automate solo admiten cuentas profesionales o educativas** [M8]. Las carpetas ocultas solo se marcan al crearlas, se listan con `includeHiddenFolders=true` y admiten todas las operaciones [M6]: no quedan fuera de una aplicación con permiso de correo. OneDrive y SharePoint quedan al alcance del conector del agente [A3] |
| 4. Responder en el hilo con permisos mínimos | **SÍ** con Graph; **PARCIAL** con Power Automate | [M3] [M4] [M2] [M7] | `reply` necesita `Mail.Send` (delegado profesional, delegado personal o aplicación) [M3]. En JSON responde a `replyTo` si existe; en MIME, al remitente original [M3]. Responder en MIME está admitido [M4]. En JSON solo se admiten cabeceras propias que empiecen por `x-` y solo al crear el mensaje [M2], así que `Auto-Submitted` solo cabe en MIME; que se conserve: NSC. «Reply to email (V3)» de Power Automate: cuerpo en HTML, con `To`, `Cc`, `Bcc`, «Reply All» y adjuntos; el texto plano no está documentado [M7]. «Send an HTTP request» llama a Graph, solo `/me` o `/users` [M7]. Permiso de lectura mínimo: no consultado |
| 5. Espera y ejecuciones simultáneas | **NSC** | [M1] [M7] | Los complementos duran unos 300 segundos [M1] y no sirven para esperar 15 minutos. El conector de Power Automate admite 300 llamadas por conexión cada 60 segundos y 70 peticiones simultáneas [M7]. La acción de retraso y el control de simultaneidad de los flujos: no consultados |
| 6. Código instalado, versión y huella | **NSC** | [M1] | Un complemento por eventos desplegado por administrador necesita su consentimiento para cada cambio del manifiesto [M1]. El código lo sirve la dirección que fija el manifiesto: si la hospeda HumanaIA, HumanaIA puede cambiarlo (opción C de la T-1). Quién edita un flujo de Power Automate, y si tiene versiones inmutables con huella: NSC |
| 7. Presencia del dueño y titular o delegado | **PARCIAL** en Microsoft 365 con Entra ID P1; **NO** en Outlook.com | [M11] [M10] [M2] | El contexto de autenticación de Entra permite pedir más autenticación para una acción. Exige Entra ID P1, solo vale para aplicaciones que inician sesión de un usuario y no para personales [M11]. Authenticator enseña el nombre de la aplicación, la ubicación y el número que hay que teclear, pero **no el cambio** [M10]: paso nominativo, NO. Delegado: `sender` distinto de `from` [M2]. Protección contra peticiones falsificadas y contra la carga en otro sitio: depende de dónde se hospede; NSC |
| 8. Llamada de red y registros | **PARCIAL/NSC** | [M13] (búsqueda) [M7] [M9] (búsqueda) | En Power Automate, la acción HTTP hacia terceros es *premium* según la FAQ de licencias (búsqueda); «Send an HTTP request» solo llama a Graph [M7]. El historial de ejecuciones dura 28 días por defecto (búsqueda) [M9] y guarda entradas y salidas en el entorno del cliente en Microsoft; no llega a HumanaIA. Azure en la suscripción del cliente: no consultado |
| 9. Direcciones no ASCII | **NSC** | [M12] | Que se admitan depende del servidor [M12]. Exchange Online anunció la admisión en 2018 (blog, búsqueda). Cómo devuelve Graph `emailAddress.address`: NSC |

## 4. Contradicciones y condiciones destacadas (decide la coordinación)

**D1. La 017 no deja activar la compuerta en Gmail sin una presencia del dueño, y esa presencia no está documentada.** El texto de la T-2 («si no, no se ofrecen relajantes ni restrictivas no urgentes», REQ-004 de la 017) y H1 y N1 de sus dictámenes la exigen. Activar la compuerta y apagar el filtro son acciones relajantes. Google no documenta una reautenticación forzada ni nominativa para aplicaciones de terceros [G31]. Que una llave de acceso funcione dentro de la aplicación web es NSC [G21]. **Mientras una prueba real no demuestre una presencia que el navegador del asistente no pueda aportar, la compuerta de Gmail no se puede activar.** La única primitiva documentada es HMAC en el código [G30], que permitiría verificar un código de un solo uso de una aplicación del móvil del dueño. Si eso cuenta como presencia lo deciden el diseño y el `auditor-seguridad`; no es nominativo.

**D2. REQ-002 (contacto previo) puede quedar sin ningún caso positivo en Gmail.** SENT se pone solo a lo insertado con el `From` del dueño, a lo enviado por cualquier aplicación con permiso de envío y a lo enviado desde la web [G1], y ningún campo documentado dice quién lo escribió. Con «si no se puede distinguir, no cuenta», la compuerta podría no enviar nunca. Hace falta una prueba real que encuentre un discriminador fiable, y el `auditor-seguridad` tiene que revisar cualquier heurística. Además, `gmail.modify`, que tienen los conectores de ambos asistentes [G33] [O1], permite insertar mensajes [G2] con cabeceras de autenticación falsas (punto 1).

**D3. Un aviso o un resumen que sea un correo no queda fuera del alcance del agente, y en Gmail no se puede atribuir una alteración al dueño.** Afecta a REQ-008, REQ-011 y REQ-013 de la 016, a REQ-009 de la 017 y a R-2 y R-5 de sus dictámenes. Lo único que no alcanza ninguna herramienta documentada de los conectores son las propiedades del script, mostradas en la aplicación web del proyecto. Pero eso es una página que el dueño tiene que abrir, no algo que se le deja en la cuenta. Quedan dos caminos, y decide la coordinación con el `auditor-seguridad`:
- Que el aviso y el resumen con autoridad vivan en la vía protegida, con, como mucho, un correo de notificación sin autoridad. Hay que decidir si eso cumple «deja al dueño» de REQ-008 y REQ-011.
- Aplicar R-5 o la P-15: si la plataforma ni protege el aviso ni detecta que se ha alterado, no se ofrece el envío. La alteración se detecta [G8], pero no se atribuye. Con R-2, ni marcar como leído queda exento, así que **leer el aviso impediría el envío**.

El dictamen 2 de la 016 ya dijo que el resumen inalterable no tiene salida de reserva. El límite de 500 KB por almacén [G13] obliga a acotar cuánto historial y cuántos resúmenes se guardan.

**D4. REQ-014, «fijada a una versión», solo lo garantiza la plataforma si nadie más puede editar.** Los disparadores ejecutan HEAD [G24], y compartir el proyecto o su contenedor da permiso de edición [G27]. ChatGPT tiene el alcance `drive`, que permite compartir y borrar [O1]. El conector de Drive de Claude muestra `share_file` y `trash_file` en el directorio [A2], en contradicción con la referencia de Google [G34]. El paso 4 de `docs/INSTALACION-CLIENTE.md` ya bloquea compartir y eliminar en la nube, pero no nombra `create_filter`, `trash_*`, `mark_*_spam` ni `delete_label` en Gmail, ni los filtros y respuestas automáticas en Microsoft 365. Ver la propuesta PR-2.

**D5. Outlook: no hay dónde ejecutar la compuerta en la cuenta del cliente.** Los complementos no sirven para esto [M1]. Power Automate solo admite cuentas profesionales [M8], y su llamada HTTP a HumanaIA es *premium* (búsqueda) [M13]. Azure en la suscripción del cliente no se ha consultado. Para la cuestión de los dictámenes, «si no se puede, la función no se ofrece en esa plataforma»: con lo comprobado, **la 016 no se ofrece en Outlook.com**, y en Microsoft 365 no se ofrece hasta una verificación aparte de Power Automate o Azure.

**D6. La 018 (P-5) choca con los mismos límites.** El agente no distingue lo escrito por el dueño mejor que la compuerta (D2). Quién cambió una etiqueta tampoco se puede saber en Gmail, porque el historial no tiene autor [G8]. Por R-2 del dictamen 2 de la 018, en Gmail solo contarían las correcciones de etiqueta que el dueño dé en la conversación. El visto bueno y la pausa de la 018 solo quedarían fuera del alcance del agente en las propiedades del script, a través de la vía protegida. En cualquier archivo de Drive o correo, no.

**D7. Choque dentro del prompt 1.2 y de la instalación.** El prompt 1.2 (línea 111) deja enviar en conversación con confirmación del dueño, y el paso 4 bloquea enviar. Si se envía así, el mensaje lleva SENT y es indistinguible: hay que decidir si cuenta como «escrito por el dueño» o si el bloqueo debe ser total.

## 5. Qué cambia en las especificaciones o en el diseño

1. **Por plataforma (decide la coordinación):**
   - Gmail: diseño posible, pero la activación queda bloqueada por D1, y D2 y D3 dependen de pruebas reales.
   - Outlook.com: la 016, la vía protegida de la 017 y el aprendizaje continuo de la 018 con su visto bueno no se ofrecen.
   - Microsoft 365: no se ofrece mientras no haya una verificación nueva de Power Automate o Azure.
2. **REQ-008 y REQ-011:** fijar si un aviso y un resumen servidos en la vía protegida cumplen «dejar al dueño». Si no, en Gmail rige R-5 (sin envío). Es una aclaración de la especificación aprobada, no un diseño.
3. **REQ-002:** aceptar de forma expresa que, sin discriminador probado, la compuerta no envía en Gmail. O pedir al `auditor-seguridad` que valore una lista cerrada de señales de «escrito por el dueño» y de exclusión (convocatorias, acuses, mensajes con `x-ms-mail-*` o equivalentes), siempre restrictiva.
4. **REQ-014 y criterio (a) de la T-1:** la plataforma no garantiza la versión porque se ejecuta HEAD. El diseño tiene que decir cómo se comprueba la huella de lo instalado y qué permisos del asistente se bloquean para que nadie más pueda editar.
5. **REQ-010:** la procedencia del «seguir» solo se puede comprobar en Gmail con HMAC (secreto compartido guardado en las propiedades del script) o con una verificación de firma escrita a mano, porque no hay verificación de firmas asimétricas [G30]. Decide el diseño, con el `auditor-seguridad`.
6. **REQ-005 y REQ-020:** construir el mensaje en bruto y no usar `GmailMessage.reply`, que responde a la dirección de respuesta [G9]. La cabecera de respuesta automática queda pendiente de prueba real.
7. **REQ-009 y REQ-023:** hay primitivas documentadas (bloqueo de script y propiedades) [G15] [G16]. El diseño fija el presupuesto de 90 minutos al día [G13] y qué pasa cuando se agota: no envía.
8. **017, criterio (b) de la T-1:** en Gmail no queda demostrado que el conector de Drive no llegue al proyecto. Con ChatGPT llega (alcance `drive`) [O1]. Hay que bloquear herramientas o elegir el proyecto vinculado, cuyo contenedor también se puede compartir [G27].
9. **REQ-021, comparación no ASCII:** pendiente de prueba real en ambas plataformas. Mientras tanto se aplica el supuesto restrictivo (solo coincide si es idéntica).

## 6. Recomendación por plataforma

| Plataforma | Recomendación | Motivo |
| --- | --- | --- |
| Gmail (cuenta personal y Workspace) | **Viable con restricciones**, sin activación posible hasta resolver D1 a D3 | Ejecución, espera, bloqueos, envío en el hilo con alcances acotados, interruptor y titular frente a delegado: documentados. Contacto previo, aviso y resumen inalterables y presencia del dueño: no |
| Outlook.com (cuenta personal) | **No viable** | Sin entorno de ejecución en la cuenta [M1] [M8] y sin contexto de autenticación [M11] |
| Microsoft 365 (cuenta profesional) | **No viable por ahora**; reabrir con una verificación de Power Automate o Azure | Solo Power Automate o Azure del cliente. HTTP *premium*, versión, huella, edición del flujo y simultaneidad: NSC |

## 7. Lo que no se pudo comprobar y cómo cerrarlo

Hace falta una prueba real con cuentas de prueba y datos ficticios. Quedan reservadas a una persona las cuentas y el gasto (artículo 14).

| N.º | Qué | Plataforma | Por qué no se pudo |
| --- | --- | --- | --- |
| NC-1 | Si Gmail y Microsoft 365 borran las `Authentication-Results` falsas entrantes; formato y posición de la suya | Ambas | Sin documentación oficial |
| NC-2 | Discriminador de «escrito por el dueño» frente a insertado, otra aplicación, conector del agente, baja por `mailto:`, convocatoria y acuse | Ambas | Sin documentación oficial |
| NC-3 | Qué alcance y qué herramientas tienen de verdad los conectores de Drive de Claude y de ChatGPT sobre un proyecto de Apps Script | Gmail | Fuentes oficiales en contradicción [A2] [G34] |
| NC-4 | Que ninguna API exponga las propiedades del script; si se conservan al cambiar el código o al copiar | Gmail | No documentado |
| NC-5 | Llave de acceso u otra presencia dentro de la aplicación web de Apps Script | Gmail | No documentado [G21] |
| NC-6 | Que se conserve `Auto-Submitted` al enviar | Ambas | No documentado |
| NC-7 | Representación de direcciones no ASCII en las API | Ambas | No documentado |
| NC-8 | Power Automate: retraso, simultaneidad, HTTP *premium*, versiones y edición; Azure en el inquilino del cliente | Microsoft 365 | No consultado o solo por búsqueda |
| NC-9 | Qué alcance hace falta para borrar el borrador candidato; huella del propio proyecto | Gmail | No consultado |
| NC-10 | Cuentas personales de Outlook.com: cabeceras de autenticación | Outlook | La documentación es de Microsoft 365 |

## 8. Propuestas para documentos compartidos (no aplicadas)

| N.º | Documento | Cambio propuesto |
| --- | --- | --- |
| PR-1 | `docs/TECNOLOGIAS.md`, «Pendiente de verificar» | Filas nuevas a partir de V-117, una por cada NC-1 a NC-10, con este archivo como fuente, y una fila «Outlook: no hay ejecución en la cuenta» como refutada, con alternativa (Power Automate o Azure) y pregunta al responsable. Anotar en D-037 y D-038 el resultado de este apartado 0 |
| PR-2 | `docs/INSTALACION-CLIENTE.md`, paso 4 (con dictamen del `auditor-seguridad`, artículo 14) | Gmail: bloquear además `send_message`, `reply`, `forward`, `create_filter`, `delete_label`, `trash_*` y `mark_*_spam`. Drive: `share_file`, `trash_file` y `update_file`. ChatGPT: lo equivalente, si la plataforma lo permite (NSC). Microsoft 365: enviar, filtros de correo y respuestas automáticas. Comprobar después, herramienta por herramienta |
| PR-3 | `docs/SEGURIDAD.md`, amenazas | Añadir a la P-03 de la 016: mensaje insertado con cabeceras de autenticación falsas o con el `From` del dueño (`gmail.modify` de los conectores); proyecto de Apps Script compartido o borrado por el conector de nube; filtro creado por el agente que oculta avisos y resúmenes |
| PR-4 | Prompt (función 012) | Resolver D7: quitar el envío en conversación o tratarlo como no escrito por el dueño |
| PR-5 | `docs/ARQUITECTURA.md` | Si la coordinación acepta el apartado 6, la compuerta y la vía protegida son piezas solo de Gmail. Puede hacer falta un ADR, porque cambia la frontera por plataforma |

## 9. Fuentes (todas consultadas el 21/11/2026)

**Google**
- [G1] Etiquetas de Gmail: https://developers.google.com/workspace/gmail/api/guides/labels
- [G2] `messages.insert`: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/insert
- [G3] `messages.import`: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/import (no se cita en las tablas)
- [G4] Recurso Message: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages
- [G5] `messages.list`: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list
- [G6] Alcances de Gmail: https://developers.google.com/workspace/gmail/api/auth/scopes
- [G7] Enviar correo: https://developers.google.com/workspace/gmail/api/guides/sending
- [G8] `history.list`: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list
- [G9] `GmailMessage`: https://developers.google.com/apps-script/reference/gmail/gmail-message
- [G10] ARC: https://knowledge.workspace.google.com/admin/security/arc-email-authentication
- [G11] Mensaje autenticado: https://support.google.com/mail/answer/180707
- [G12] Delegación: https://support.google.com/mail/answer/138350
- [G13] Cuotas de Apps Script: https://developers.google.com/apps-script/guides/services/quotas
- [G14] `ClockTriggerBuilder`: https://developers.google.com/apps-script/reference/script/clock-trigger-builder
- [G15] `LockService`: https://developers.google.com/apps-script/reference/lock/lock-service
- [G16] Propiedades: https://developers.google.com/apps-script/guides/properties
- [G17] Alcances en Apps Script: https://developers.google.com/apps-script/concepts/scopes
- [G18] Aplicaciones web: https://developers.google.com/apps-script/guides/web
- [G19] Manifiesto de la aplicación web: https://developers.google.com/apps-script/manifest/web-app-api-executable
- [G20] `XFrameOptionsMode`: https://developers.google.com/apps-script/reference/html/x-frame-options-mode
- [G21] Restricciones del servicio HTML: https://developers.google.com/apps-script/guides/html/restrictions
- [G22] Versiones: https://developers.google.com/apps-script/guides/versions
- [G23] Bibliotecas: https://developers.google.com/apps-script/guides/libraries
- [G24] `projects.updateContent`: https://developers.google.com/apps-script/api/reference/rest/v1/projects/updateContent
- [G25] Importar y exportar: https://developers.google.com/apps-script/guides/import-export
- [G26] Scripts independientes: https://developers.google.com/apps-script/guides/standalone
- [G27] Scripts vinculados: https://developers.google.com/apps-script/guides/bound
- [G28] Registros: https://developers.google.com/apps-script/guides/logging
- [G29] `UrlFetchApp`: https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app
- [G30] `Utilities`: https://developers.google.com/apps-script/reference/utilities/utilities
- [G31] OpenID Connect de Google: https://developers.google.com/identity/openid-connect/openid-connect
- [G32] Aplicaciones sin verificar: https://support.google.com/cloud/answer/7454865
- [G33] Servidor MCP de Gmail: https://developers.google.com/workspace/gmail/api/guides/configure-mcp-server
- [G34] Servidor MCP de Drive: https://developers.google.com/workspace/drive/api/reference/mcp y https://developers.google.com/workspace/drive/api/guides/configure-mcp-server (búsqueda para los alcances)
- [G35] Blog de Google, EAI (búsqueda, no leído): https://blog.google/products/gmail/a-first-step-toward-more-global-email/

**Asistentes**
- [A1] Conector de Gmail en Claude: https://claude.com/connectors/gmail
- [A2] Conector de Google Drive en Claude: https://claude.com/connectors/google-drive
- [A3] Conector de Microsoft 365: https://claude.com/docs/connectors/microsoft/365.md y https://claude.com/connectors/microsoft-365
- [A4] Permisos por herramienta (búsqueda): https://support.claude.com/en/articles/13730515-manage-claude-s-tool-access
- [O1] Alcances del conector de Google en ChatGPT: https://help.openai.com/en/articles/10408842-google-connector-for-chatgpt-data-controls-faq

**Microsoft**
- [M1] Activación por eventos (ms.date 01/09/2026): https://learn.microsoft.com/en-us/office/dev/add-ins/develop/event-based-activation
- [M2] Recurso message: https://learn.microsoft.com/en-us/graph/api/resources/message?view=graph-rest-1.0
- [M3] `message: reply`: https://learn.microsoft.com/en-us/graph/api/message-reply?view=graph-rest-1.0
- [M4] MIME: https://learn.microsoft.com/en-us/graph/outlook-send-mime-message
- [M5] Cabeceras antispam (ms.date 27/07/2026): https://learn.microsoft.com/en-us/defender-office-365/message-headers-eop-mdo
- [M6] Recurso mailFolder: https://learn.microsoft.com/en-us/graph/api/resources/mailfolder?view=graph-rest-1.0
- [M7] Conector Office 365 Outlook: https://learn.microsoft.com/en-us/connectors/office365/
- [M8] Alta en Power Automate (ms.date 16/09/2026): https://learn.microsoft.com/en-us/power-automate/sign-up-sign-in
- [M9] Historial de ejecuciones (búsqueda): https://learn.microsoft.com/en-us/troubleshoot/power-platform/power-automate/flow-run-issues/missing-runs-or-triggers-history-for-a-flow
- [M10] Contexto adicional en Authenticator: https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-mfa-additional-context
- [M11] Contexto de autenticación: https://learn.microsoft.com/en-us/entra/identity-platform/developer-guide-conditional-access-authentication-context
- [M12] EAI: https://learn.microsoft.com/en-us/globalization/reference/eai
- [M13] FAQ de licencias de Power Automate (búsqueda): https://learn.microsoft.com/power-platform/admin/power-automate-licensing/faqs

**Estándar**
- [R1] RFC 8601, §5: https://www.rfc-editor.org/rfc/rfc8601#section-5
