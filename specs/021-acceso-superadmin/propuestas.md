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

## Decisiones en VERIFICAR

Ninguna se ha usado. V-108 (doble factor en las políticas) y V-113 (límite de intentos) son de la fase 2 y condicionan el diseño de la 021. Lo que admite el servicio de identidad (duración de sesión, cierre de otras sesiones, invitaciones, límite del segundo factor, rechazo de códigos ya usados) se comprueba en el diseño con la skill `verificar-decision`.
