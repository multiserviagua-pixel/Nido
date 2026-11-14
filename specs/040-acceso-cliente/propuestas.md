# 040 · Propuestas de cambio a documentos compartidos

Fecha: 12/11/2026 · Autor: orquestador de la fase 5 (a partir del informe del `especificador`) · Estado: PROPUESTA

Cambios que la función 040 necesita fuera de su carpeta. No se ha aplicado ninguno. Los decide el chat de coordinación con el responsable. Los que dependen de una cuestión abierta de `especificacion.md` lo indican.

Cada punto lo he comprobado leyendo el documento citado, no solo el informe del agente.

## Cambios propuestos

| N.º | Documento | Cambio propuesto | Por qué |
| --- | --- | --- | --- |
| 1 | `docs/MODELO-DATOS.sql`, apartado 6 (`privado.auditar`) | Que la auditoría de altas y bajas en la vinculación de usuarios con clientes identifique al usuario afectado y al actor real | Hoy el identificador del objeto se toma de `id`, luego de `cliente_id` y luego de `usuario_id`. Esa tabla no tiene `id`, así que se anota el cliente y se pierde el usuario. Además, `docs/ESQUELETO.md` dice que el alta de usuarios usa la clave secreta: con ella no hay usuario en la sesión y el actor quedaría vacío. La 040 exige saber quién invitó y a quién |
| 2 | `docs/MODELO-DATOS.sql`, apartado 3 | Añadir un registro de invitaciones con sus estados (pendiente, aceptada, caducada, anulada), ligado a un cliente y a un correo, sin guardar el enlace ni el código en claro | El modelo no tiene dónde guardar una invitación pendiente, su caducidad, su reenvío ni su anulación |
| 3 | `docs/MODELO-DATOS.sql`, tabla de vinculación y `privado.clientes_del_usuario()` | Según la cuestión abierta 3: si cada cuenta pertenece a un solo cliente, que la estructura lo imponga | Hoy la clave es la pareja usuario y cliente, así que un usuario puede tener varios clientes y las vistas de resumen le devolverían varios mezclados |
| 4 | `docs/MODELO-DATOS.sql`, políticas del usuario de cliente | Según la cuestión abierta 6: que el acceso del usuario tenga en cuenta la baja del cliente y la revocación de la licencia | Hoy un usuario de un cliente dado de baja sigue leyendo todo |
| 5 | `docs/MODELO-DATOS.sql`, políticas de superadmin y vista `resumen_cliente` | Dejar escrito que el panel de cliente nunca se sirve con permisos de superadmin: un superadmin con doble factor que abra el panel de cliente vería todos los clientes a través de la vista | La 040 exige que ser superadmin no dé acceso al panel de cliente. Según la cuestión abierta 8, además, que una cuenta no pueda ser las dos cosas |
| 6 | `docs/TECNOLOGIAS.md`, V-111 | Ampliar V-111 al correo de acceso (invitación, recuperación y avisos de seguridad), o abrir una verificación nueva, y adelantarla: hoy está en la fase 4 y solo cubre avisos de alertas | La 040 no puede funcionar sin un servicio de envío de correo en la UE. La función 021 (fase 3) tiene la misma necesidad para invitar administradores |
| 7 | `docs/TECNOLOGIAS.md`, V-113 | Ampliar el límite de intentos al inicio de sesión, la aceptación de invitaciones y la recuperación | V-113 solo cubre la activación del conector. La lista de publicación de `docs/SEGURIDAD.md` ya pide el límite en el inicio de sesión |
| 8 | `docs/SEGURIDAD.md`, tabla de amenazas | Añadir la fase 5 en «Dónde se comprueba» de A-21 (ataques de sesión). Añadir una amenaza nueva: enlaces o códigos de acceso que lee un filtro de correo o el propio agente de correo del cliente antes que la persona | El panel de cliente tiene las mismas amenazas de sesión que el de superadmin. El buzón al que llegan los correos de acceso lo lee un agente de IA: es una situación propia de este producto |
| 9 | `docs/PLAN.md`, fase 5 | Añadir «Funciones previstas: 040, 041, 042». Revisar la frase «acceso con sus credenciales» cuando se responda la cuestión abierta 4 | La frase da por hecha una forma de entrar que el responsable aún no ha decidido |
| 10 | `docs/DISENO.md`, páginas de cliente y de superadmin | Detallar el contenido de «Cuenta» y el estado «sin permiso». Añadir a la ficha del cliente del superadmin el apartado de usuarios: invitar, reenviar, anular y retirar | La ficha enumera licencia, códigos, conexiones, informes, órdenes, reglas y suscripción, pero no los usuarios del cliente |
| 11 | `.claude/rules/interfaz.md` | Aclarar que la regla «ningún dato en la URL que no sea un identificador propio del usuario» admite la prueba de un solo uso de una invitación o de una recuperación | Tal como está escrita, prohíbe los enlaces de invitación y de recuperación. Es un cambio del arnés: lo decide una persona (artículo 14) |

## Coordinación con otras fases

| Fase | Qué hay que acordar |
| --- | --- |
| 3 (función 021 y ficha del cliente) | La pantalla de entrada se comparte entre superadmin y usuarios de cliente. La 021 ya exige que un usuario de cliente vea «sin permiso» en el área de superadmin; la 040 exige lo simétrico. Las acciones de invitar, reenviar, anular y retirar viven en la ficha del cliente, que es de la fase 3, pero las especifica la 040. Las cuestiones «¿una cuenta puede ser administrador y usuario de cliente?», «¿cómo llega la invitación?» y los plazos de las pruebas de un solo uso están abiertas en las dos funciones y deben contestarse igual |
| 2 (función 010) | Los puntos 1 a 5 de arriba. La 010 ya propone por su cuenta aclarar si el cliente ve o no sus conexiones (su propuesta 10) |
| 6 (función 050) | Qué acceso conserva un usuario cuando la licencia está suspendida por impago: tiene que poder entrar para regularizar (cuestión abierta 6 de la 040) |

## Observación sobre la constitución

No es una propuesta de enmienda; solo el responsable puede enmendarla. El artículo 2 dice que el identificador del cliente nunca se acepta como entrada. Leído al pie de la letra, también alcanzaría al superadmin, que actúa sobre el cliente que elige en la ficha. La 040 lo aplica a los usuarios de cliente (el cliente se deriva de su sesión). Si el responsable quiere dejar escrito ese alcance, es una aclaración suya.
