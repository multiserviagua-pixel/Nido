# 021 · Propuestas para coordinación

Cambios que esta función necesitaría fuera del rango de la fase 3. El chat de la fase 3 no los edita: los anota aquí para el chat de coordinación y para los chats de las fases afectadas. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 3, a partir del informe del `especificador`.

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 021 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Lectura con un solo factor | Con sesión de un solo factor no se lee nada del área (REQ-004). El modelo de referencia deja leer la propia fila de administrador con un solo factor (`administradores_propio`) | Fase 2 (010) |
| 2 | Doble factor leído del token de sesión | Quitar un factor o cambiar la contraseña corta las demás sesiones en su siguiente petición (REQ-014, REQ-015). `privado.es_admin()` lee `aal` del token, que puede quedar desactualizado hasta que caduque; ADR-0003 descarta autorizar con datos del token por ese motivo | Fase 2 (010, V-108) y diseño de la 021 |
| 3 | Mínimo de administradores | El sistema nunca queda sin administradores, tampoco con bajas simultáneas (REQ-021). El modelo deja que un administrador borre a cualquiera, también al último, y el borrado en cascada desde la cuenta de usuario quita al administrador sin pasar por ninguna regla | Fase 2 (010) |
| 4 | Estado de baja e invitaciones | Hay administradores dados de baja e invitaciones con estado (REQ-018 a REQ-020, REQ-045). El modelo no tiene ni lo uno ni lo otro. La fase 5 (040) necesita también un registro de invitaciones | Fase 2 (010), o migración propia de la fase 3 en su plan (puerta P1) |
| 5 | Auditoría de lo que no es un cambio de tabla | Dejan fila la creación del primer administrador, los cambios de factor y la recuperación (REQ-040). El disparador del modelo anota como actor la sesión, que no existe si el primer administrador se crea por SQL, y los cambios de factor ocurren en el servicio de identidad | Fase 2 (010) y función 024 |
| 6 | Límite de intentos del inicio de sesión | Lo implementa la fase 3 (REQ-024, REQ-025). El plan de la fase 2 solo nombra el de activación; V-113 decide el mecanismo | Fase 2 (V-113) |
| 7 | Tres cuestiones compartidas con la fase 5 (040) | Cuenta doble (cuestión 12), cómo llega la invitación (cuestión 8) y plazos (cuestión 9). La pantalla de entrada se comparte | Responsable, con la misma respuesta en los dos chats |
| 8 | Quién publica en `estable` | La 021 recomienda que todos los administradores sean iguales (cuestión 11). La cuestión 3 de la 030 plantea reservar esa acción a la cuenta del responsable | Responsable; fase 4 |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/SEGURIDAD.md`, lista de publicación | Añadir «límite de intentos en la verificación del segundo factor» | Hoy solo nombra la activación y el inicio de sesión |
| `docs/DISENO.md`, páginas de superadmin | Añadir la página «Cuenta» (contraseña, factores, cerrar sesión) y decir que en la fase 3 «Ajustes» contiene solo los administradores | REQ-046; la pausa global es de la fase 4 |
| `.claude/rules/interfaz.md` | Excepción a «ningún dato en la URL»: el enlace de un solo uso entregado al titular (invitación, restablecimiento, recuperación) | REQ-037 lo acota; sin la excepción, la regla y el requisito chocan |
| `docs/MODELO-DATOS.sql` | Ver fronteras 1 a 5 | El modelo es de la fase 2 |
| `docs/TECNOLOGIAS.md` | **Adelantar V-111 (proveedor de correo con alojamiento en la UE) de la fase 4 a la fase 3.** El responsable eligió el 13/11/2026 que la invitación de administradores y el restablecimiento de contraseña vayan por correo automático. La 040 (fase 5) y la 030 (fase 4) necesitan el mismo proveedor: conviene verificarlo una sola vez. Ojo con D-016 (planes gratuitos): hay que comprobar si el proveedor tiene coste | Respuesta a la cuestión 8 |
| `docs/TECNOLOGIAS.md` | Registrar en estado CONFIRMADO: primer factor, correo y contraseña; segundo factor, aplicación de códigos; recuperación con códigos de recuperación de un solo uso; invitación y restablecimiento por correo; 2 superadmin al empezar. Anotar las demás respuestas cuando lleguen | Respuestas del responsable del 12 y el 13/11/2026 |
| `docs/SEGURIDAD.md`, rutas críticas | Si el servicio de identidad no ofrece códigos de recuperación, construirlos añade una ruta crítica: guardar y comparar esos códigos y retirar un factor con un privilegio superior al de la sesión | Respuesta a la cuestión 3 |

## Tras el dictamen del diseño y las decisiones por delegación (14/11/2026)

Autor: `arquitecto`. Salen de la corrección de `diseno.md` tras `dictamen-diseno.md` y de las decisiones que el orquestador tomó por delegación del responsable (D-019). Ninguna está aplicada. El arquitecto no ha editado ningún documento de fuera de esta carpeta.

### Especificación de la 021 (para el `especificador`; la aprueba quien abra la puerta)

Las decisiones por delegación aclaran o cambian requisitos aprobados. Mientras la especificación no los recoja, lo que depende de ellos no se implementa (constitución, artículo 5).

| Requisito o criterio | Cambio propuesto | De dónde sale |
| --- | --- | --- |
| REQ-036 | Anotar que, para las operaciones del canal de acceso (las que crean la sesión completa o actúan sin nadie con sesión), la condición (b) se lee como (b'): solo se ejecutan después de que el servicio de identidad valide la credencial de esa petición, y cada función comprueba sus condiciones dentro de la base de datos. Vale solo con el rol propio `acceso` | Decisión A-1 |
| REQ-037 | Añadir como tercera excepción que la clave del factor se enseña una vez al titular al registrarlo | Decisión A-8 |
| REQ-022 | Decir que la persona que ejecuta un procedimiento de fuera del panel se identifica con un acta firmada por el responsable, enlazada a la fila de auditoría, que lleva el origen `responsable_fuera_del_panel` | Decisión A-4, punto 5; hallazgo m-15 |
| REQ-007 y CA-006 | Aclarar la frase «No hay dispositivo recordado»: el navegador reconocido no omite ni acorta ningún factor; solo decide qué contador de intentos se aplica al primer paso. CA-006 se comprueba también desde un navegador reconocido | Decisión A-12; hallazgo M-5 |
| REQ-024 y CA-017 | Añadir la excepción: el bloqueo por cuenta no se aplica a un navegador reconocido de esa cuenta, que tiene un contador propio de 10 fallos en 15 minutos, tras los cuales se anula su marca. Y añadir que el bloqueo por cuenta puede terminar antes de los 15 minutos si lo levanta otro administrador activo o el responsable fuera del panel, con fila de auditoría. El bloqueo por origen y el del segundo factor (REQ-025) no cambian | Decisión A-12 |
| REQ-038 | Los datos nuevos que se guardan: la huella de la marca de cada navegador reconocido y sus fechas | Decisión A-12 |
| REQ-040 y REQ-041 | Añadir las acciones nuevas que dejan fila: levantar el bloqueo de otro administrador, levantarlo fuera del panel y el cambio de credenciales detectado fuera del panel | Decisiones A-12 y A-4 |
| CA-032 y CA-035 | Leer «una fila principal que nombra la acción» como «una fila principal y, vinculada, la que nombra el hecho», como hace el inventario de la 024 (I-28, I-22). I-32 no se escribe | Decisión A-4, puntos 1 a 3 |
| Errata | La fila de CA-034 está pegada a una copia de la de CA-035 | Diseño, «Pruebas» |

### Función 024 (inventario de acciones)

| Acción nueva | Actor | Objeto | Tipo | De dónde sale |
| --- | --- | --- | --- | --- |
| «Levantó el bloqueo de acceso de otro administrador» | Administrador de la sesión | La cuenta desbloqueada | Principal, sin cliente | Decisión A-12 |
| «Levantó fuera del panel el bloqueo de acceso de un administrador» | Origen `responsable_fuera_del_panel` | La cuenta desbloqueada | Principal, sin cliente | Decisión A-12 |
| «Se detectó un cambio de credenciales hecho fuera del panel» | «Sistema» | La cuenta | Principal, sin cliente | Decisión A-4, punto 4; hallazgo M-2 |

El inventario acaba hoy en I-41: los números los pone la 024. Además: confirmar que «Olvidar este navegador» y la anulación de una marca por intentos no dejan fila; y que las filas I-27 e I-35 que escriba el disparador de cambios directos llevan como actor la cuenta que el servicio autenticó.

### Fase 1 (función 002)

| Cambio | Motivo |
| --- | --- |
| Si T-P4 confirma el límite: levantar la prohibición de `proxy.ts` solo para el archivo acotado de la decisión A-2 (genera el valor de un solo uso y la cabecera de política de contenido en `/acceso` y `/admin`; no lee cookies ni cuerpos, no registra, no decide accesos), con ADR y dictamen. Cambiar su comprobación de región y su PRUEBA-005, y comprobar antes en qué región lo ejecuta la plataforma | Decisión A-2. La referencia de Next.js (leída el 14/11/2026) dice que `proxy` usa Node.js por defecto, pero no dice en qué región lo ejecuta Vercel |
| Su diseño nombra todavía `fra1`; D-020 fijó `arn1` | Coherencia con D-020 |
| Una comprobación de la batería que ejecute contra el servicio real las pruebas que deben repetirse (PRUEBA-043 y PRUEBA-046) y que, en rojo, impida integrar y desplegar | Hallazgos M-2 y M-11 |
| Qué cabecera da de forma fiable la dirección de origen, y que el cliente no la pueda poner | Hallazgo M-12 |
| Códigos nuevos en la lista cerrada de `registro.ts`: `acceso_servicio_pendiente`, `acceso_cierre_servicio_pendiente`, `acceso_cambio_fuera_del_panel`, `acceso_origen_no_disponible` y `acceso_navegador_anulado_por_intentos`. Variables nuevas en `configuracion.ts`: `ACCESO_HMAC_CONTADOR`, `ACCESO_HMAC_CODIGOS` y `ACCESO_HMAC_DISPOSITIVO` | Hallazgos m-4, m-15 y M-5 |
| Añadir a las rutas críticas `src/proxy.ts` (si llega a existir) | Decisión A-2 |

### Fase 2 (función 010)

| Cambio | Motivo |
| --- | --- |
| No poner el disparador genérico de auditoría en `administradores` ni en las tablas nuevas de la 021 | Hallazgo m-6 |
| Las tres funciones reservadas al responsable, ejecutables solo por el propietario de la base de datos; ninguna por `anon`, `authenticated`, `acceso` ni el rol de la clave secreta | Hallazgo M-7; decisión A-12 |
| Lista cerrada de las funciones que `anon` y `authenticated` pueden ejecutar, con su prueba | Hallazgo m-5 |
| Si T-P2 lo confirma: lectura de las tablas del servicio de identidad desde las funciones y disparadores sobre ellas, con prueba repetida. Decidir quién vigila esa dependencia de la forma interna del servicio | Hallazgos B-1, M-1 y M-2 |
| Tablas nuevas `privado.primeros_pasos`, `privado.cambios_esperados` y `privado.dispositivos_reconocidos`; la cuenta en `privado.bloqueos_acceso`; funciones `admin_levantar_bloqueo`, `admin_bloqueos_activos` y `admin_olvidar_navegador` | Hallazgos B-1, M-2 y M-5 |
| Decirle que vale el alta de administradores desde el panel (su recomendación 9 decía lo contrario) | Decisión A-6 |
| V-107: si resulta inviable, la 021 se para; el camino con la clave secreta necesita diseño y dictamen propios | Decisión A-1 |

### Otras funciones y fases

| A quién | Cambio | Motivo |
| --- | --- | --- |
| Función 020 | Estado nuevo `administrador.acceso_bloqueado` en el catálogo; textos del diálogo «Levantar el bloqueo» y de «Olvidar este navegador» en `textos.ts` | Decisión A-12 |
| Función 040 (fase 5) | En la pantalla común `/acceso` el umbral por origen es 5 para todos. La marca de navegador reconocido solo se emite a administradores | Decisiones A-5 y A-12 |
| Funciones 022 a 025 | Lo escrito en un formulario se pierde al caducar la sesión; el aviso lo dice antes | Decisión A-7 |
| Fase 6 | Declarar la cookie de la marca de navegador reconocido en el registro de tratamiento y en la política de cookies; fijar los plazos de conservación de sesiones cerradas, marcas y contadores; revisar la opción (b) del asunto A-3 en la revisión de seguridad | Decisiones A-12 y A-3; hallazgo m-15 |

### Documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `specs/021-acceso-superadmin/aclaraciones.md` | Anotar cada decisión delegada (A-1 a A-10 y A-12) como «decidido por delegación (D-019)», con su motivo. D-019 lo exige; el arquitecto no escribe en el registro de respuestas | D-019 |
| `docs/TECNOLOGIAS.md` | Registrar las decisiones delegadas de la 021 y sus condiciones (V-107 para A-1; T-P4, ADR y dictamen para A-2). V-111 sigue en VERIFICAR: el asunto A-11 queda reservado a una persona | D-019; asunto A-11 |
| `docs/adr/` | ADR nuevo, solo si T-P4 confirma el límite: excepción acotada a la prohibición de `proxy.ts`. Y los dos ya propuestos en el diseño (registro propio que autoriza; rol `acceso` y canal de acceso) | Decisión A-2 |
| `docs/SEGURIDAD.md`, rutas críticas | Añadir el acceso de los dashboards, el canal de acceso, los procedimientos del responsable (`scripts/acceso/`) y, si llega a existir, `src/proxy.ts` | Diseño |
| `docs/SEGURIDAD.md`, lista de publicación | Añadir a «Secretos y configuración» la contraseña de aplicación de la cuenta de envío, que vive en la configuración del servicio de identidad y no en el gestor de variables. Añadir a «Privacidad» la adenda de tratamiento del proveedor de correo | Hallazgo M-3 |
| `docs/ESQUELETO.md` | Rutas nuevas de la 021: `src/lib/acceso/`, `src/lib/supabase/acceso.ts`, `src/app/admin/cuenta/`, `src/components/acceso/`, `supabase/plantillas-correo/`, `scripts/acceso/` y, condicionada, `src/proxy.ts` | Diseño, «Mapa de archivos» |
| `specs/021-acceso-superadmin/guia-responsable.md` (por escribir, en el plan) | Tres procedimientos de fuera del panel (primer administrador, retirada del factor del único administrador, levantar un bloqueo), la configuración del servicio de identidad y el cambio a la alternativa de códigos de recuperación | Hallazgos M-5, M-7 y M-11 |

## Tras la segunda vuelta del auditor (14/11/2026)

Autor: `arquitecto`. Salen de la corrección de `diseno.md` tras `dictamen-diseno-2.md` (0 bloqueantes, M-13, M-14 y m-17 a m-29). Ninguna está aplicada. El arquitecto no ha editado nada fuera de esta carpeta.

### Para el responsable (reservado a una persona; no entra en D-019)

| Asunto | Qué se le pide | De dónde sale |
| --- | --- | --- |
| A-14 | Aceptar o rechazar por escrito la excepción al artículo 4: la contraseña de aplicación de la cuenta de envío vive en la configuración del servicio de identidad, no en el gestor de variables. Va unido al A-11 | Hallazgo m-26 |
| A-15 | Presentarle expresamente la enmienda de REQ-007 y CA-006 (navegador reconocido), en lugar de aprobarla solo por delegación: el riesgo original se le presentó con una premisa falsa | Hallazgo m-27 |

### Especificación de la 021 (para el `especificador`)

| Requisito o criterio | Cambio propuesto | De dónde sale |
| --- | --- | --- |
| REQ-024 y CA-017 | Además de lo ya pedido: el cupo de restablecimientos por cuenta no se aplica a una solicitud desde un navegador reconocido de esa cuenta, que tiene su propio cupo de 3 por hora; y el levantamiento del bloqueo pone también a cero el cupo de restablecimientos de la cuenta | Hallazgo m-18 |
| REQ-038 | Además de lo ya pedido: durante 24 horas, la presentación de cada sesión (nivel, métodos y momentos de emisión de su token), y en cada sesión completa el momento de emisión del token con el que se completó | Hallazgos m-23 y m-24 |
| REQ-007 y CA-006 | Sin cambio de texto respecto a lo ya pedido; su aprobación pasa por el responsable (A-15) | Hallazgo m-27 |

### Función 024 (inventario de acciones)

| Cambio | Motivo |
| --- | --- |
| La acción nueva (c) «Se detectó un cambio de credenciales hecho fuera del panel» se escribe con el alta de un factor **sin anuncio** o con un cambio de correo hecho directamente en el servicio; las altas hechas desde el panel o desde el registro del primer factor no la escriben | Hallazgo M-13 |

### Fase 1 (función 002)

| Cambio | Motivo |
| --- | --- |
| Si se adopta el `proxy.ts` acotado: `next.config.ts` mantiene para `/acceso` y `/admin` una segunda cabecera de política con `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'` y `form-action 'self'`; el `proxy.ts` sobrescribe siempre `x-nonce` y `Content-Security-Policy` de la petición; las páginas y acciones se niegan a responder sin su valor (`src/lib/acceso/politica.ts`). Son condición expresa del ADR de la decisión A-2, que además debe decir que la cabecera `Cookie` pasa por esa función aunque no la lea | Hallazgo M-14 |
| T-P4 prueba también las vías por las que una petición podría no pasar por el `proxy.ts` (variantes de ruta, `x-middleware-subrequest`, peticiones de datos y de acción). Son sospecha del auditor, sin comprobar | Hallazgo M-14 |
| Códigos nuevos en la lista cerrada de `registro.ts`: `acceso_bloqueo_levantado`, `acceso_bloqueos_repetidos` y `acceso_cupo_restablecimiento_agotado` | Hallazgos m-29 y m-18 |
| La comprobación de la batería contra el servicio real que ya se pidió (PRUEBA-043 y PRUEBA-046) incluye también PRUEBA-052 | Hallazgo M-13 |

### Fase 2 (función 010)

| Cambio | Motivo |
| --- | --- |
| Tabla `privado.presentaciones_sesion` (una fila por sesión, solo administradores activos, momentos que no retroceden, borrado a las 24 horas) y columna `completada_con_token_de` en `privado.sesiones_administrador`; la condición 5 de `privado.es_admin()` pasa a ser estricta y sin holgura | Hallazgos m-23 y m-24 |
| En `privado.cambios_esperados`: tipo `factor` con `factor_id` (5 minutos, un solo factor, ligado a la sesión) y `huella_marca_conservada`; función `admin_anunciar_factor` y fase `anunciar` de C-6 | Hallazgos M-13 y m-19 |
| El disparador sobre las tablas del servicio, declarado solo sobre las columnas que importan y comparando valor anterior y nuevo; sus nombres, de T-P2 punto 13 | Hallazgo M-13 |
| Tipo `navegador_restablecimiento` en el contador; `admin_levantar_bloqueo` y la función reservada ponen a cero el cupo de restablecimientos de la cuenta | Hallazgo m-18 |
| Lista cerrada de funciones para `authenticated`: añadir `sesion_presentar` y `admin_anunciar_factor` a las ya previstas, con el comportamiento con un solo factor de las cuatro de la propia sesión | Hallazgo m-23 |

### Otras funciones y documentos compartidos

| A quién | Cambio | Motivo |
| --- | --- | --- |
| Función 020 | Textos de «Cerrar sesión y olvidar este navegador» y del aviso para ordenadores compartidos en `textos.ts` | Hallazgo m-17 |
| `docs/TECNOLOGIAS.md` | Anotar A-14 y A-15 como reservados al responsable, fuera de D-019 | Hallazgos m-26 y m-27 |
| `docs/SEGURIDAD.md`, lista de publicación | La entrada ya pedida de la contraseña de aplicación queda condicionada a que el responsable acepte la excepción al artículo 4 (A-14) | Hallazgo m-26 |
| `docs/SEGURIDAD.md`, rutas críticas | Toda operación nueva con la clave secreta exige dictamen del `auditor-seguridad` antes de la puerta P1, también con esa puerta delegada | Hallazgo m-28 |
| `specs/021-acceso-superadmin/guia-responsable.md` (por escribir, en el plan) | Los tres procedimientos de fuera del panel, y el aviso de no rotar `ACCESO_HMAC_DISPOSITIVO` durante un ataque de bloqueos salvo que esté comprometido | Hallazgos m-25 y m-28 |

## Decisiones en VERIFICAR

Ninguna se ha usado. V-108 (doble factor en las políticas) y V-113 (límite de intentos) son de la fase 2 y condicionan el diseño de la 021. Lo que admite el servicio de identidad (duración de sesión, cierre de otras sesiones, invitaciones, límite del segundo factor, rechazo de códigos ya usados) se comprueba en el diseño con la skill `verificar-decision`.
