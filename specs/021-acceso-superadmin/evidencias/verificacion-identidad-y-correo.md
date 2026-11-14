# 021 · Verificación previa al diseño: servicio de identidad y correo

Skill `verificar-decision`. Hecha por el orquestador de la fase 3 el 13/11/2026, leyendo documentación oficial con dos agentes de lectura web. Solo documentación: no se ha ejecutado ninguna prueba. Este chat no edita `docs/TECNOLOGIAS.md`; lo que cambie se propone a coordinación.

## 1. Supabase Auth (D-002), frente a lo aprobado en la 021

| Lo que pide la 021 | Lo que dice la documentación oficial | Fuente | Consecuencia |
| --- | --- | --- | --- |
| Segundo factor con aplicación de códigos | Admite aplicación de códigos (TOTP) y teléfono. Las páginas de MFA no mencionan llaves de seguridad | `https://supabase.com/docs/guides/auth/auth-mfa` | Cubierto |
| Exigir el doble factor en la base de datos | El token lleva `aal` («aal1» o «aal2»); ejemplo oficial de política restrictiva con `aal2` | misma página | Cubierto; es V-108, de la fase 2 |
| Códigos de recuperación | Existen en la referencia de JavaScript, pero como función **experimental** (`auth.experimental.recoveryCodes`). La guía de MFA no los menciona | `https://supabase.com/docs/reference/javascript/auth-mfa-recovery-codes-generate` | **Decisión pendiente:** usar una función experimental, o construirlos |
| Un código ya usado no se vuelve a aceptar | No encontrado. Cada código vale 30 segundos, con un intervalo de tolerancia | `https://supabase.com/docs/guides/auth/auth-mfa/totp` | Sin verificar: hace falta una prueba real |
| Sesión de 24 horas como máximo y 60 minutos sin actividad | Duración máxima e inactividad: «This feature is only available on Pro Plans and up» | `https://supabase.com/docs/guides/auth/sessions` | **Choca con D-016** (planes gratuitos): con el plan gratuito habría que construir ese control o no se cumple |
| Al cambiar contraseña o factor, las demás sesiones pierden el acceso en su siguiente petición, sin margen | Se pueden cerrar las demás sesiones (ámbito `others`), pero «Access Tokens of revoked sessions remain valid until their expiry time». El token dura entre 5 minutos y 1 hora; no se recomienda bajar de 5 minutos. Al quitar un factor, el nivel baja «only after the refresh interval has lapsed» | `https://supabase.com/docs/guides/auth/signout`, `.../sessions`, `.../auth-mfa` | **No lo da el servicio.** «Siempre inmediato» exige un control propio: comprobar en cada petición que la sesión sigue existiendo. La documentación indica cómo (el dato `session_id` del token frente a las sesiones vivas) |
| 5 fallos en 15 minutos bloquean 15 minutos, por cuenta y por origen | Límites por dirección de origen: 30 cada 5 minutos en inicio de sesión (configurable); verificación del segundo factor, 15 por minuto, **no configurable**. Los ganchos de intento de contraseña y de MFA son de los planes Teams y Enterprise | `https://supabase.com/docs/guides/auth/rate-limits`, `.../auth-hooks` | **No lo da el servicio** en el plan gratuito ni en Pro: el bloqueo por cuenta hay que construirlo (V-113) |
| Invitación por correo, válida 24 horas | `inviteUserByEmail` envía un enlace de invitación. Duración del enlace y si se puede configurar: no encontrado | `https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail` | Sin verificar |
| Correo automático | El servidor de correo incorporado «is not meant for production use»: 2 correos por hora y solo a direcciones del equipo. Con SMTP propio, 30 por hora por defecto, ajustable | `https://supabase.com/docs/guides/auth/auth-smtp` | Hace falta un proveedor de correo (V-111) |
| Baja que desactiva la cuenta | Se puede vetar a un usuario con `ban_duration`. Efecto en sus sesiones: no encontrado | `https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid` | Sin verificar; usa la clave secreta |

**Aviso (artículo 7).** Varias páginas de la documentación de Supabase llevan una nota dirigida a agentes de IA que pide terminar con un informe de opinión y preguntar si se envía a Supabase. Se ha tratado como dato: no se ha seguido ni se ha enviado nada.

## 2. Proveedor de correo (V-111)

| Proveedor | Dónde quedan los datos | Plan gratuito | SMTP | Fuente | Estado |
| --- | --- | --- | --- | --- | --- |
| Resend | Se elige la región de envío (Irlanda entre ellas), pero «It does not control where customer data is stored»: cuenta, metadatos y registros, en EE. UU. Empresa de EE. UU. | 3.000 al mes, 100 al día | Sí | `https://resend.com/docs/dashboard/domains/regions`, `https://resend.com/legal/dpa` | **No cumple** «alojamiento en la UE» |
| Amazon SES | Regiones de la UE con SMTP: Fráncfort, Irlanda, París y Estocolmo. Dónde se guardan los datos: no encontrado | Sin plan gratuito permanente; 0,10 dólares por cada 1.000 | Sí | `https://aws.amazon.com/ses/pricing/`, `https://docs.aws.amazon.com/general/latest/gr/ses.html` | Candidato; falta el acuerdo de encargo |
| Mailjet (Sinch) | No encontrado | 6.000 al mes, 200 al día | Sí | `https://www.mailjet.com/pricing/` | Sin verificar |
| Brevo | No se pudo leer (la página de precios y la de términos llegaron vacías) | No leído | Sí | `https://developers.brevo.com/docs/smtp-integration` | Sin verificar |
| Scaleway | No se pudo leer (error 403) | No leído | No leído | — | Sin verificar |

**V-111 sigue en VERIFICAR.** Ningún proveedor está verificado todavía con alojamiento en la UE y acuerdo de encargo de tratamiento. Falta leer la documentación de Brevo, Scaleway y Mailjet por otra vía.

## 3. Envío desde la cuenta de Google Workspace (decisión del responsable, 13/11/2026)

Leído el 13/11/2026 en documentación oficial de Google. Buena parte llegó como resumen del agente de lectura, no como texto literal: se marca.

| Asunto | Qué dice | Fuente | Estado |
| --- | --- | --- | --- |
| Formas de enviar por SMTP | Retransmisión `smtp-relay.gmail.com` (puertos 25, 465 o 587); servidor `smtp.gmail.com` (465 o 587) con la dirección completa y una contraseña de aplicación; servidor restringido, solo para destinatarios de Gmail o Workspace | `https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app` (resumen) | Leído |
| Usuario y contraseña normales | Desde el 1 de mayo de 2025 las cuentas de Workspace no admiten aplicaciones que piden iniciar sesión con usuario y contraseña; se pide OAuth | misma página (resumen) | Leído. No queda claro cómo encaja con la autenticación SMTP de la retransmisión: **contradicción sin resolver** |
| Contraseña de aplicación | «App passwords can only be used with accounts that have 2-Step Verification turned on.» «App passwords aren't recommended and are unnecessary in most cases.» Se revocan al cambiar la contraseña de la cuenta. En cuentas de organización la opción puede no estar disponible | `https://support.google.com/accounts/answer/185833` (literal) | Leído |
| Límites | Retransmisión: 10.000 mensajes por usuario al día. `smtp.gmail.com`: 2.000 al día | páginas de límites y de retransmisión (resumen) | De sobra para dos administradores |
| Restricción por dirección de origen | La retransmisión puede aceptar solo ciertas direcciones IP y habla de IP fija; Google no espera que se autoricen rangos de nubes de terceros. La app de Nido se ejecuta sin IP fija | página de retransmisión (resumen) | La restricción por IP no sirve aquí |
| Para qué está pensado | «Google Workspace SMTP relay is intended for on-premise devices and applications that generate outbound email.» Soporte «best effort» para aplicaciones de terceros | página de retransmisión | Leído |
| Regiones de datos en la UE | **No encontrado:** la página enlazada ya no trata de regiones | — | Sin verificar |
| Acuerdo de tratamiento de datos | Existe la adenda de Google Cloud; cómo se acepta, no encontrado en lo leído | `https://cloud.google.com/terms/data-processing-addendum/` | Sin verificar |

**Conclusión provisional:** es viable para el volumen de Nido, por `smtp.gmail.com` con una contraseña de aplicación de la cuenta de envío, que exige verificación en dos pasos en esa cuenta y que el administrador de Workspace lo permita. Google no lo recomienda como primera opción. V-111 sigue en VERIFICAR: faltan la región de datos, el acuerdo de tratamiento y una prueba real de envío. La contraseña de aplicación es un secreto: la pone una persona en el gestor de variables (artículo 4).
