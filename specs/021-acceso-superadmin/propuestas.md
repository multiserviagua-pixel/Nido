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
| A-15 | **Superada por D-039** (el responsable respondió el 21/11/2026). Presentarle expresamente la enmienda de REQ-007 y CA-006 (navegador reconocido), en lugar de aprobarla solo por delegación: el riesgo original se le presentó con una premisa falsa | Hallazgo m-27 |

### Especificación de la 021 (para el `especificador`)

| Requisito o criterio | Cambio propuesto | De dónde sale |
| --- | --- | --- |
| REQ-024 y CA-017 | Además de lo ya pedido: el cupo de restablecimientos por cuenta no se aplica a una solicitud desde un navegador reconocido de esa cuenta, que tiene su propio cupo de 3 por hora; y el levantamiento del bloqueo pone también a cero el cupo de restablecimientos de la cuenta | Hallazgo m-18 |
| REQ-038 | Además de lo ya pedido: durante 24 horas, la presentación de cada sesión (nivel, métodos y momentos de emisión de su token), y en cada sesión completa el momento de emisión del token con el que se completó | Hallazgos m-23 y m-24 |
| REQ-007 y CA-006 | **Superada por D-039** (A-15 respondida; texto ya escrito). Sin cambio de texto respecto a lo ya pedido; su aprobación pasa por el responsable (A-15) | Hallazgo m-27 |

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
| En `privado.cambios_esperados`: tipo `factor` con `factor_id` (5 minutos, un solo factor, ligado a la sesión) y `huella_marca_conservada` (**sustituida el 21/11 por `marca_conservada_id`**, abajo); función `admin_anunciar_factor` y fase `anunciar` de C-6 | Hallazgos M-13 y m-19 |
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

## Al preparar la 3.ª vuelta del auditor (21/11/2026)

Autor: `arquitecto`. Salen de comprobar M-13, M-14 y m-17 a m-29 contra `diseno.md`, de los avisos H-1 y V-1 de la 020, de A-13 por delegación (D-036) y de A-15 (entonces anotada por D-036; desde el 21/11, abierta y reservada al responsable; **superado por D-039**, que la respondió el mismo día). Ninguna está aplicada; el arquitecto no ha editado nada fuera de esta carpeta. Las migraciones de la 010 se han leído como dato.

### Fase 2 (función 010)

| Cambio | Motivo |
| --- | --- |
| Las migraciones de la 010 ya existen: `20261120000200_clientes_y_acceso.sql` crea `public.administradores (usuario_id, creado_en)` con `on delete cascade` hacia `auth.users`, y `20261120000700_reglas_de_acceso.sql` define `privado.es_admin()` como «fila en `administradores` y `aal = 'aal2'`», con `es_admin()` y `clientes_del_usuario()` como únicas funciones ejecutables por `authenticated`. Lo que pide la 021 («Datos», «La regla de acceso», «Funciones de operación») va en **migraciones nuevas** posteriores, nunca editando las aplicadas, con su prueba pgTAP de acceso cruzado y vuelta atrás probada | `diseno.md`, «Supuestos» y «Migración y vuelta atrás» |
| La vuelta atrás de la migración que sustituye `es_admin()` restaura la de M07, que reabre el acceso solo por `aal2`: debe ir junto con la vuelta atrás de la aplicación y figurar así en su cabecera | Artículo 11; fila M-4 de «Migración y vuelta atrás» |
| Quitar el `on delete cascade` de `administradores` (y decidir el de `usuarios_cliente`, que no es de la 021): borrar la cuenta en el servicio no debe quitar la fila de administrador sin pasar por la regla del mínimo | REQ-021; frontera 3 de este archivo |
| Ampliar la lista cerrada de funciones de `authenticated` (hoy dos) con las cuatro de sesión y las `admin_*` de la 021; la prueba que compara con la lista (PRUEBA-048) debe fallar si aparece otra | m-5, m-23 |
| En `privado.cambios_esperados`, el tipo `factor` cubre el alta y el borrado, 5 minutos; lo abren C-6 `anunciar`, `admin_anunciar_factor`, `admin_sustituir_factor` (para el borrado del anterior) y `admin_retirar_factor`. **Corregido el 21/11 tras la 3.ª vuelta (M-16):** en el alta, el anuncio se ata al primer `factor_id` que aparece y cubre su paso a `verified` y su borrado si se cancela, hasta que lo cierra la función del panel o pasan 5 min; en el borrado, solo el `factor_id` anunciado; un factor sin verificar que el registro no tiene nunca consume ni dispara; otro `factor_id` en la ventana cuenta como sin anuncio. La ligadura a la sesión la comprueban las funciones del panel, no el disparador (la tabla del servicio no tiene columna de sesión). El disparador no actúa ante el borrado de un factor que el registro ya da por retirado (baja, S-4) | M-13, M-16 |
| El disparador sobre las tablas del servicio compara valor anterior y nuevo solo de la contraseña cifrada, el correo, el cambio de correo pendiente y el alta, estado o borrado de un factor; los nombres exactos salen de T-P2 punto 13 | M-13 |

### Función 020

| Cambio | Motivo |
| --- | --- |
| PRUEBA-034 (y PRUEBA-024, que dice «da 404»): exigir 404 solo en carga completa. En navegación RSC, exigir el mismo código y la misma marca (`NEXT_HTTP_ERROR_FALLBACK;404`) en los tres casos, carga igual salvo valores por petición, 0 testigos y, si hay 307, `Location` del mismo origen, sin consulta y que empieza por `/admin` (corregido tras la 4.ª vuelta, m-38). Añadir que el documento del 404 lleve `lang="es"` | Aviso V-1 del relevo de la 020 y `evidencias/T-005/resultado.md` |
| PRUEBA-009 dice «parámetros de más ignorados». En `/admin` y `/acceso`, la guardia de la 021 puede redirigir a la ruta fija de una tabla constante cuando sobra un parámetro; esa redirección es opcional y no es el control de H-1 (m-38). Alinear el texto de la 020 para esas rutas, o confirmar que la regla de la 020 se refiere solo a la muestra | H-1, `diseno.md` de la 021, «La guardia» |
| H-1: la 021 lo trata con «no reflejar» (sin parámetros admitidos y comodín que no lee sus segmentos; la redirección es opcional, m-38) y una prueba nueva (PRUEBA-055 de la 021). La política de contenido no lo cubre, porque el texto queda dentro de un guion que lleva el valor de un solo uso. La condición de la 020 (muestra cerrada en producción y preproducción hasta el dictamen) no cambia. **3.ª vuelta (21/11):** el auditor lo da como MENOR informativo para la 020 y recomienda añadir a su cadena hostil U+2028, `<!--<script>` y un testigo en la ruta | H-1 de `plan.md` de la 020; `dictamen-diseno-3.md` |
| El inventario de PRUEBA-018 se hizo solo sobre `indice/unico`. La 021 lo necesita sobre todos los estados (diálogos y gráficos incluidos) para decidir si Radix o Recharts inyectan estilos | Inventario de la 020 y T-P4 de la 021 |

### Fase 1 (función 002)

| Cambio | Motivo |
| --- | --- |
| La redirección por parámetros de más la hace la guardia, no el `proxy.ts`, y es opcional (M-15, 21/11). Next serializa ruta y consulta en todos sus cuerpos: es riesgo residual de AM-39, controlado por su escapado en HTML y, en RSC y acción, por `Content-Type: text/x-component` con `nosniff` (M-17), que PRUEBA-055 comprueba en cada actualización de Next; toda `Location` es del mismo origen, sin consulta, empieza por `/admin` o `/acceso` y no lleva testigo (m-46). La reserva del 404 fijo en el `proxy.ts` no cubre la ruta y queda descartada | H-1, M-15, M-17, m-46 |
| T-P4 comprueba también qué refleja Next de la dirección (página, redirección, `not-found`, RSC) y si el 404 dinámico con un `not-found.tsx` propio lleva `lang` | H-1, V-1 |

### Función 040 (fase 5)

| Cambio | Motivo |
| --- | --- |
| La pantalla común `/acceso` no admite parámetros y empieza por `exigirDireccionLimpia()` (y por `exigirValorPolitica()` si hay `proxy.ts`) | H-1, M-14 |

### Especificación de la 021 (para el `especificador`)

| Cambio | Motivo |
| --- | --- |
| **Superada por D-039** (escrita en tres vueltas el 21/11/2026, pendiente de aprobar). Escribir la enmienda de REQ-007 y CA-006 ya propuesta (14/11), con el umbral de REQ-024 y CA-017, solo cuando el responsable responda A-15 (abierta y reservada a él desde el 21/11/2026; ya no por D-036). Hasta entonces, ni se escribe ni se implementa lo que depende de ella | A-15, m-27 |

### Coordinación y responsable

| Asunto | Qué se pide | De dónde sale |
| --- | --- | --- |
| A-13 | Anotar en `aclaraciones.md` y `docs/TECNOLOGIAS.md`: «decidida por delegación D-036, 21/11/2026: si fallan T-P2.12 o T-P2.13 no se acepta el riesgo y vuelve al arquitecto». Sustituye la anotación «reservado a una persona» de `aclaraciones.md` del 14/11 solo en cuanto a no aceptar; aceptar el riesgo seguiría reservado al responsable | A-13 |
| A-15 | **Superada por D-039** (respondida por el responsable el 21/11/2026). Texto anterior: **abierta, reservada al responsable** (cambio del 21/11/2026, `aclaraciones.md`): presentársela como decisión suya, umbral incluido, con el motivo de m-27 (la premisa original era falsa) y la contradicción con su respuesta a la cuestión 10. Vuelve a valer la fila A-15 de «Para el responsable» del 14/11 | m-27, m-33 |
| A-11 y A-14 | Siguen reservadas al responsable (cuentas y secretos); no se decidieron | m-26 |
| Tamaño (D-023) | `diseno.md` mide entre 47.500 y 48.000 caracteres (unos 49 KB; contado por bloques, sin terminal), por encima de los 40 KB. Opciones: (a) al escribir `plan.md`, llevar allí «Tareas previas» (T-P2 y T-P3) y el contenido de las pruebas, y dejar en el diseño solo la referencia; (b) dividir la función en 021-A (acceso, sesión, guardia y protección) y 021-B (gestión de administradores, recuperación y bloqueos); (c) aceptar el exceso hasta P1. Recomendada: (a), y (b) si aun así no cabe | D-023 |

## Tras la 4.ª vuelta del auditor (21/11/2026)

Autor: `arquitecto`. Salen de `dictamen-diseno-4.md`. Ninguna está aplicada.

| Para | Qué se pide | De dónde sale |
| --- | --- | --- |
| Coordinación | En lo que toca a A-15, **superada por D-039** (D-039 ya está anotada en `docs/TECNOLOGIAS.md`); sigue lo de A-13. Dejar constancia en `docs/TECNOLOGIAS.md`, además de en `aclaraciones.md`, de A-13 (decidida por D-036 el 21/11/2026) y de A-15 (abierta y reservada al responsable desde el 21/11/2026); completa las filas A-13 y A-15 de «Coordinación y responsable» de arriba | m-43 |
| Fase 2 (010) | PRUEBA-048 pasa a T-007 de la 021 y recorre `pg_proc` en todos los esquemas que no son del sistema para `PUBLIC`, `anon`, `authenticated` y `acceso`; su `04_funciones` cambia en esa tarea y cada migración lleva su `revoke` | m-40 |
| Fase 1 (002) | La 021 amplía `scripts/patrones-secretos.mjs` en su T-017 (ruta reservada, la aprobación la nombra) con formas del acceso que hoy no se detectan | M-18 |
| Función 020 | En RSC y acción Next no escapa la dirección (`text/x-component`); si su PRUEBA-034 o su cadena hostil llevan testigos en RSC, aplicar los criterios por tipo de respuesta de PRUEBA-055 de la 021 | M-17 |

## Tras la revisión del 21/11 (plan y tareas)

Autor: `arquitecto`. Texto de los menores, de `revision-plan.md` (resumen del orquestador de la revisión del `revisor`). Ninguno está aplicado fuera de esta carpeta.

**Corregidos en esta carpeta** (tras la 5.ª vuelta, sin ver aún por el revisor): 7, 8, 10, 11, 12, 14 y 15; el 13, en parte (tabla de abajo). Quedan para la coordinación, con su texto:

| Para | Qué se pide | De dónde sale |
| --- | --- | --- |
| Coordinación | En lo que toca a A-15, **superada por D-039**. «m-43 sin hacer: A-13 y A-15 no constan en `docs/TECNOLOGIAS.md` (coordinación).» Completa las filas A-13 y A-15 de «Coordinación y responsable» y la de «Tras la 4.ª vuelta» | Revisión del 21/11, menor 6 |
| Coordinación | «`@supabase/supabase-js` 2.119.0 sin entrada en `docs/TECNOLOGIAS.md` (coordinación).» Versión y licencia: `diseno.md`, «Dependencias nuevas»; T-010 (a) las relee al instalar | Revisión del 21/11, menor 17 |
| Coordinación | Menor 13 («T-008 (36 REQ), T-012 (31 REQ, ~16 archivos) y T-011 (~25 pruebas) son grandes: valorar partirlas»). Hecho sin renumerar: T-008 (b), T-011 (b) y T-012 (c) pasan a «aparte» (D-029), con su propia revisión y dictamen. Partirlas en tareas nuevas (T-019 en adelante) no cabe en los 25 KB de `tareas.md` sin recortar otra cosa; si la coordinación lo quiere, encargarlo aparte | Revisión del 21/11, menor 13 |

## Tras la 5.ª vuelta del auditor (21/11/2026)

Autor: `arquitecto`. Salen de `dictamen-diseno-5.md` y de los menores 14 y 15 de la revisión. Ninguna está aplicada.

| Para | Qué se pide | De dónde sale |
| --- | --- | --- |
| Coordinación | **Superada por D-039** (el responsable eligió la marca; AM-08a queda como riesgo residual tratado por ella). Añadir a la ficha de A-15 del relevo: sin marca, quien conozca la dirección de un administrador lo mantiene bloqueado (5 fallos cada 15 min) y, con uno solo, solo queda `levantar-bloqueo.mjs`; es riesgo mayor (AM-08a) que solo el responsable puede aceptar por escrito. Si no responde o rechaza la marca, ese riesgo queda pendiente y nunca figura como controlado; si la rechaza, el bloqueo por un tercero vuelve al arquitecto | M-20 |
| Fase 1 (002) | **Superada por D-039** en cuanto a esperar a A-15: la variable y el código llegan con T-010 (d), tras aprobar la enmienda. Texto anterior: hasta A-15, `configuracion.ts` no declara ni exige `ACCESO_HMAC_DISPOSITIVO` y `registro.ts` acepta 13 códigos; la variable y `acceso_navegador_anulado_por_intentos` llegan con A-15 (corrige la fila de variables del 14/11) | m-50 |
| Fase 2 (010) | PRUEBA-048 compara por firma (`regprocedure`), recorre todo esquema fuera de su lista N-1 más `privado`, y cada tarea de la 021 añade sus firmas; añadir la marca quita las firmas antiguas con `drop` y `revoke` | m-45, m-49 |
| Función 024 | La 021 espera su A-1 (iv), I-42 a I-44, para los códigos `accion` de T-008 (b) y T-009 | Revisión, menor 14 |
| Función 052 (fase 6) | Google Workspace en la lista de encargados (REQ-021, REQ-022): envía la invitación y el restablecimiento a direcciones de administradores; región y adenda, de T-003 de la 021. También en `docs/SEGURIDAD.md` si allí se lista | Revisión, menor 15 |

## Tras la 2.ª vuelta de la enmienda (D-039, 21/11/2026)

Autor: `arquitecto`. Salen de «Dudas de la enmienda» de `especificacion.md`. Ninguna está aplicada fuera de esta carpeta.

| Para | Qué se pide | De dónde sale |
| --- | --- | --- |
| Función 024 | Acción nueva (d) «Se anuló la marca de un navegador reconocido»: un código `accion` por cada motivo de `motivo_anulacion` (los 12 de `diseno.md`, «Datos»), `objeto_tipo` `administrador`, sin cliente y sin columnas nuevas. Principal solo con `titular` (origen `persona`, actor el titular) e `intentos` (origen `sistema`); los demás, vinculables a I-24 a I-28, I-30, I-31, I-33 a I-36 y (c), según `diseno.md`, «Auditoría». Sustituye a la petición del 14/11 de confirmar que «Olvidar este navegador» y la anulación por intentos no dejan fila | Duda 6; REQ-041, CA-017 (10) |
| `especificador` (T-005 a) | Siguen sin aplicar, sin cambio de texto: la acción (c) en REQ-040 y REQ-041 (fila del 14/11, A-4) y la presentación de cada sesión durante 24 horas en REQ-038 (fila de la 2.ª vuelta del auditor, m-23 y m-24). El diseño ya las tiene | Duda 7 |
| Coordinación | La 024 copia `origen`, `actor` y momento de la principal a cada vinculada (su D-3), así que la (d) vinculada lleva el actor de su causa. El diseño lee el «solo» de REQ-041 como prohibición de los datos de la marca y del origen de red, no de esas columnas comunes; si no vale, lo dice la especificación o la 024 | REQ-041 |

## Tras la revisión D-039 del `revisor` (21/11/2026)

Autor: `arquitecto`. Salen de la corrección tras esa revisión y de la decisión de la coordinación sobre su MAYOR-1 (D-036). Ninguna está aplicada fuera de esta carpeta.

| Para | Qué se pide | De dónde sale |
| --- | --- | --- |
| Fase 2 (010) | `privado.dispositivos_reconocidos` lleva `id` (UUID aleatorio) y la huella solo ahí; en `privado.cambios_esperados`, `marca_conservada_id` (referencia a ese `id`) en lugar de `huella_marca_conservada` (REQ-038). Los fallos con marca válida de la cuenta suman solo en `navegador_primer_factor`, nunca en `origen_primer_factor` (REQ-024 b) | Revisión D-039, MAYOR-1 y menor de la huella |
| Función 024 | Los códigos `accion` de (d) cubren los doce motivos de REQ-024 (e), `renovacion` y `limite` incluidos (vinculados a la I-33 que emite la nueva); sin cambio respecto a la petición de la 2.ª vuelta | Revisión D-039, menor de las anulaciones |
| Supervisión (fase 1, V-112) y alertas (fase 4) | Aviso cuando pasen 90 días desde la última rotación anotada de la contraseña de aplicación de envío (A-14), sin el valor; hasta que exista, lo recuerda `guia-responsable.md` | Revisión D-039, menor de A-14 |
| `docs/SEGURIDAD.md`, lista de publicación | En la entrada ya pedida de la contraseña de aplicación (A-14), anotar que da acceso a la cuenta de envío por todos los protocolos que la admiten (sin verificar; T-P3.13) | Revisión D-039, menor de A-14 |

## Decisiones en VERIFICAR

Ninguna se ha usado. V-108 (doble factor en las políticas) y V-113 (límite de intentos) son de la fase 2 y condicionan el diseño de la 021. Lo que admite el servicio de identidad (duración de sesión, cierre de otras sesiones, invitaciones, límite del segundo factor, rechazo de códigos ya usados) se comprueba en el diseño con la skill `verificar-decision`.
