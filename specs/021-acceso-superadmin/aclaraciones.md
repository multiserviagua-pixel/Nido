# 021 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 3. **Respondidas: la 4, en parte (12/11/2026), y la 1, la 2, la 3 y la 8 (13/11/2026). En la 3 y en la 8 el responsable eligió una opción distinta de la recomendada. Las demás no tienen respuesta todavía.** La columna «Recomendación» es del orquestador y no es una decisión.

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`, donde están las opciones completas.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 1 | Primer factor | **A.** Correo y contraseña. **B.** Enlace de un solo uso al correo: quien controle el buzón tiene el primer factor. **C.** Cuenta de un proveedor externo: añade una dependencia. **D.** Llave de acceso del dispositivo: la más resistente a páginas falsas, recuperación más delicada. | **A.** No depende de que llegue un correo para entrar, comparte pantalla y pruebas con el acceso de cliente de la fase 5 (su orquestador recomienda lo mismo) y la contraseña nunca basta sola, porque el segundo factor es obligatorio. **D** se puede añadir después si el diseño comprueba que el servicio de identidad lo admite |
| 2 | Segundos factores admitidos | **A.** Aplicación de códigos de un solo uso. **B.** Llave de seguridad. **C.** Las dos. **D.** SMS, el más débil. | **A**, sin SMS. Registrar un segundo dispositivo de repuesto se recomienda en pantalla, no se obliga. La llave de seguridad queda como mejora si el diseño comprueba que el servicio la admite |
| 3 | Pérdida del segundo factor | **A.** Códigos de recuperación guardados por el titular. **B.** Lo inicia otro administrador. **C.** Solo el responsable, fuera del panel. **D.** Combinación. | **D = B + C.** Lo inicia otro administrador con sesión completa; si no hay otro (administrador único, o lo pierden todos), lo hace el responsable con el procedimiento del primer administrador. Sin códigos de recuperación: son otro secreto que guardar y custodiar. Siempre cierra las sesiones de la cuenta y deja fila de auditoría |
| 4 | Cuántos administradores y quiénes | Mínimo exigido por el sistema: 1 o 2. Con 2 no se puede arrancar con una sola persona. | Mínimo **1**, para poder arrancar. Antes de publicar (fase 6), al menos **2 personas**, para que la recuperación no dependa del procedimiento manual. **Necesito saber cuántas personas serán** |
| 7 | Baja de un administrador: borrar o desactivar la cuenta | **A.** Borrar: la auditoría solo conserva un identificador sin nombre. **B.** Desactivar: se sigue sabiendo quién hizo cada acción; conserva un dato personal del equipo. | **B.** La cuenta queda sin acceso y sin sesiones, pero identificable en la auditoría. Se borra al cumplirse el plazo de conservación que fije la fase 6. Es la misma decisión que la cuestión 4 de la 024 |
| 8 | Cómo llegan la invitación y el restablecimiento | **A.** Correo enviado por el servicio de identidad: adelanta a esta fase el proveedor de correo (V-111, hoy de la fase 4). **B.** Quien invita copia un enlace de un solo uso y lo entrega por un canal acordado. | **B** en la fase 3: no depende de un servicio que aún no está elegido. Consecuencia: una contraseña olvidada se resuelve por el mismo cauce que la pérdida del segundo factor (cuestión 3), no por correo. Cuando exista el envío de correo (la fase 5 lo necesita para los usuarios de cliente) se añade sin cambiar la regla. El aviso fuera del panel al dar de alta un administrador, en la fase 4 con los demás avisos |
| 14 | Dónde se ven inicios de sesión, fallos y bloqueos | **A.** En la página de auditoría (024). **B.** Solo en los registros de supervisión. | **Mixta.** En la auditoría: inicios de sesión completos, bloqueos, y cambio y restablecimiento de contraseña, que tienen una cuenta conocida detrás. Los fallos sueltos solo se cuentan en supervisión, sin guardar lo tecleado: un fallo con una dirección mal escrita sería texto libre (artículo 1). Es la misma decisión que la cuestión 1 de la 024 |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 5 | Duración de la sesión | Máximo 12 horas desde el inicio de sesión; 30 minutos sin actividad | Son los valores de la guía de referencia (OWASP ASVS, nivel 2). El diseño comprueba que el servicio de identidad los admite |
| 6 | Ventana tras cambiar contraseña o factor | Objetivo: la siguiente petición. Se admite un margen de hasta 5 minutos solo si el diseño demuestra que lo inmediato no es viable y el `auditor-seguridad` lo acepta en la puerta P1. La baja de un administrador, sin margen | El modelo de referencia lee el doble factor del token de sesión, que puede quedar desactualizado (ver `propuestas.md`) |
| 9 | Plazos de las pruebas de un solo uso | Invitación: 24 horas. Restablecimiento y recuperación: 30 minutos | La fase 5 propone 72 horas para invitar a usuarios de cliente; para una cuenta de administrador recomiendo menos |
| 10 | Límites de intentos | 5 fallos en 15 minutos bloquean 15 minutos, contados por cuenta y por origen. El bloqueo nunca es indefinido. Segundo factor: 5 fallos anulan la sesión de un solo factor, con el mismo contador | Frena la fuerza bruta sin que un tercero pueda dejar fuera a los administradores para siempre. El mecanismo es V-113 (fase 2) y se concreta en el diseño |
| 11 | ¿Todos los administradores son iguales? | Sí | Con pocas personas, un rol de propietario añade reglas sin proteger más. Ojo: la cuestión 3 de la 030 (fase 4) pregunta si publicar en `estable` se reserva al responsable; si se elige eso, habrá que distinguir esa cuenta |
| 12 | ¿Misma cuenta para administrador y usuario de cliente? | No: cuentas separadas | Coincide con la recomendación de la fase 5. Simplifica las pruebas de aislamiento |
| 13 | Ver y cerrar otras sesiones | Sí, como mínimo un botón «Cerrar las demás sesiones». La lista detallada, solo si el servicio de identidad la ofrece | Una pantalla menos que la lista completa; cubre el caso de sesión olvidada o robada |
| 15 | Umbral de tiempos en CA-019 | Aceptar 100 milisegundos de diferencia de mediana | Si el servicio de identidad no lo permite, se revisa en el diseño |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Primer factor | «Correo y contraseña (Recomendado)» | Responsable, 13/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-002 queda con correo y contraseña. Se aplican REQ-014 y REQ-016, que solo valen si hay contraseña |
| 2 | Segundos factores | «Aplicación de códigos (Recomendado)» | Responsable, 13/11/2026, en el diálogo de preguntas del chat de la fase 3 | Un solo tipo: aplicación de códigos de un solo uso. Sin SMS ni llave de seguridad. En pantalla se recomienda registrar un segundo dispositivo |
| 3 | Pérdida del segundo factor | «Códigos de recuperación» (opción distinta de la recomendada) | Responsable, 13/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-010 y CA-008 cambian: al registrar el factor se entregan códigos de recuperación de un solo uso. Requisitos nuevos: se muestran una sola vez; no aparecen en registros, errores ni auditoría; cada uno sirve una vez; usar uno cierra las demás sesiones y deja fila de auditoría; se pueden regenerar con sesión completa. **Queda por decidir** qué pasa si se pierden también los códigos: el orquestador propone el procedimiento del responsable fuera del panel. **Para el diseño:** comprobar si el servicio de identidad ofrece códigos de recuperación; si no, hay que construirlos, y eso es una ruta crítica más (guardar y comparar secretos, y retirar un factor con un privilegio superior al de la sesión) |
| 4 | Cuántos administradores | «2 personas» | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | Habrá 2 administradores al empezar, así que la recuperación la puede iniciar el otro (cuestión 3). El mínimo que exige el sistema (REQ-021) sigue propuesto en 1, para poder sustituir a una de las dos, y está sin confirmar |
| 5 | Duración de la sesión | Sin respuesta | — | Pendiente (REQ-011, REQ-012, CA-009) |
| 6 | Ventana tras cambiar contraseña o factor | Sin respuesta | — | Pendiente (REQ-014, REQ-015) |
| 7 | Baja: borrar o desactivar | Sin respuesta | — | Pendiente (REQ-020) |
| 8 | Invitación y restablecimiento | «Correo automático» (opción distinta de la recomendada) | Responsable, 13/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-018: la invitación llega por correo a la dirección invitada. REQ-016: el restablecimiento de contraseña es por correo y sigue sin servir para saltarse el segundo factor. **Consecuencia:** hay que elegir en la fase 3 el proveedor de correo con alojamiento en la UE (V-111, hoy de la fase 4) y verificarlo antes del diseño de la 021. Sigue sin respuesta si se avisa fuera del panel al dar de alta un administrador |
| 9 | Plazos de un solo uso | Sin respuesta | — | Pendiente (REQ-018) |
| 10 | Límites de intentos | Sin respuesta | — | Pendiente (REQ-024, REQ-025, CA-017, CA-018) |
| 11 | Administradores iguales | Sin respuesta | — | Pendiente (REQ-017) |
| 12 | Cuenta doble | Sin respuesta | — | Pendiente (requisito nuevo si la respuesta es «no») |
| 13 | Otras sesiones | Sin respuesta | — | Pendiente (requisito nuevo si la respuesta es «sí») |
| 14 | Dónde se ven los accesos | Sin respuesta | — | Pendiente (REQ-041) |
| 15 | Umbral de CA-019 | Sin respuesta | — | Pendiente (CA-019) |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Ninguna todavía. Cuando haya respuesta, se pasan a coordinación por `propuestas.md`: este chat no edita el registro de decisiones.

## Respuestas del 13/11/2026, segundo bloque

Preguntadas por el orquestador en el diálogo de preguntas del chat de la fase 3. Sustituyen a «Sin respuesta» en la tabla de arriba para las cuestiones 7 y 14.

| N.º | Cuestión | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 7 | Baja de un administrador | «Desactivar (Recomendado)» | Responsable, 13/11/2026 | REQ-020: la baja desactiva la cuenta; la auditoría la sigue nombrando con la marca «dado de baja». Resuelve también la cuestión 4 de la 024 |
| 14 | Accesos en la auditoría | «Entradas y bloqueos (Recomendado)» | Responsable, 13/11/2026 | REQ-041: inicios de sesión completos, bloqueos y cambios de contraseña aparecen en la auditoría; los fallos sueltos solo se cuentan. Resuelve también la cuestión 1 de la 024 |
| 3 (resto) | Si se pierden también los códigos de recuperación | «Recuperación de contraseña al correo registrado» (respuesta escrita por el responsable, fuera de las opciones) | Responsable, 13/11/2026 | **Sin aplicar: pendiente de confirmar.** Tal como está escrita choca con REQ-010 y REQ-016 de esta especificación y con el criterio de la fase «sin doble factor no se puede leer ni cambiar nada»: quien controle el buzón podría restablecer la contraseña y, además, el segundo factor, y entrar sin él. El orquestador lo ha planteado al responsable antes de aplicarlo |
| 5, 6, 9 a 13 y 15 | Detalles con valor propuesto | «Los reviso uno a uno» | Responsable, 13/11/2026 | Siguen sin respuesta; se preguntan uno a uno |
| 3 (resto), confirmada | Si se pierden el segundo factor y los códigos | «Correo + el otro admin (Recomendado)» | Responsable, 13/11/2026 | REQ-010: el correo restablece solo la contraseña. Quitar el segundo factor perdido exige además que el otro superadmin lo confirme desde el panel, o el responsable fuera del panel si no hay otro. El buzón solo nunca basta. Sustituye a la respuesta anterior, que queda sin efecto |
| 5 | Duración de la sesión | «24 h y 60 min sin uso» (opción distinta de la recomendada) | Responsable, 13/11/2026 | REQ-011: máximo 24 horas. REQ-012: 60 minutos sin actividad. CA-009 con esos valores. Es más largo que la guía de referencia (12 horas y 30 minutos); el diseño comprueba que el servicio de identidad lo admite |
| 9 | Plazos de los enlaces | «Invitación 24 h, resto 30 min (Recomendado)» | Responsable, 13/11/2026 | REQ-018: invitación válida 24 horas. Restablecimiento y recuperación: 30 minutos |
| 10 | Límites de intentos | «5 fallos, bloqueo de 15 min (Recomendado)» | Responsable, 13/11/2026 | REQ-024 y REQ-025: 5 fallos en 15 minutos bloquean 15 minutos, por cuenta y por origen, nunca indefinido; igual para el segundo factor. CA-017 y CA-018 con esos valores |
| 11 | ¿Todos los administradores son iguales? | «Sí, todos iguales (Recomendado)» | Responsable, 13/11/2026 | REQ-017 sin cambios: cualquier administrador activo con sesión completa invita y da de baja. Sin rol de propietario |
| 12 | Cuenta doble | «No, cuentas separadas (Recomendado)» | Responsable, 13/11/2026 | Requisito nuevo: una misma cuenta no puede ser administrador y usuario de cliente a la vez. Coincide con la 040 |
| 13 | Otras sesiones | «Botón "Cerrar las demás" (Recomendado)» | Responsable, 13/11/2026 | Requisito nuevo: la página de cuenta tiene una acción que cierra todas las demás sesiones. La lista detallada, solo si el servicio de identidad la ofrece |
| 6 | Ventana tras cambiar contraseña o factor | «Siempre inmediato» (opción distinta de la recomendada) | Responsable, 13/11/2026 | REQ-014 y REQ-015: las demás sesiones pierden el acceso en su siguiente petición, sin margen. Se retira la salvedad de la ventana en CA-007 y CA-011. **Para el diseño:** si el servicio de identidad no lo da, hay que construir un control propio que no dependa del token de sesión; es una ruta crítica |
| 4 (resto) | Mínimo de administradores | «Mínimo 1 (Recomendado)» | Responsable, 13/11/2026 | REQ-021: el mínimo exigido es 1. CA-015 con ese valor |
| 8 (resto) | Aviso fuera del panel al dar de alta un administrador | «En la fase 4, con las alertas» | Responsable, 13/11/2026 | Queda fuera de alcance de la 021 y se pasa a la fase 4 (032) |
| 15 | Umbral de tiempos de CA-019 | «Sí, 100 ms (Recomendado)» | Responsable, 13/11/2026 | CA-019 queda con 100 milisegundos |

**Todas las cuestiones de la 021 tienen respuesta del responsable (12 y 13/11/2026).** Los efectos los aplica el `especificador` en `especificacion.md`; después se presenta la puerta P0.

## Huecos que salieron al aplicar las respuestas (13/11/2026)

| Asunto | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- |
| Único administrador que pierde el factor y los códigos | «Sí, excepción anotada (Recomendado)» | Responsable, 13/11/2026 | REQ-021 admite una sola excepción: el procedimiento del responsable fuera del panel, con fila de auditoría; hasta registrar un factor nuevo, esa cuenta no lee ni cambia nada |
| Auditar regenerar códigos y «Cerrar las demás sesiones» | «Sí, las dos (Recomendado)» | Responsable, 13/11/2026 | Las dos dejan fila de auditoría (REQ-040) y entran en el inventario de la 024 |
| Sesión de 24 horas y 60 minutos | Elegida por el responsable el 13/11/2026 | — | Desviación consciente de la guía de referencia (12 horas y 30 minutos); queda anotada como aceptada |

Deducciones del `especificador` que quedan en la especificación y se presentan al responsable en la puerta P0: un código de recuperación da una sesión completa; sus fallos cuentan en el límite del segundo factor; al regenerar los códigos los anteriores dejan de servir; los restablecimientos de contraseña van a la auditoría; el límite del segundo factor es por cuenta. Sin decidir: qué pasa al invitar la dirección de un administrador dado de baja.

| Asunto | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- |
| Cuestión 16 · Invitar la dirección de un administrador dado de baja | «Reactiva su cuenta (Recomendado)» | Responsable, 13/11/2026 | La invitación reactiva la misma cuenta, que debe registrar de nuevo su segundo factor; la auditoría conserva su historial bajo la misma cuenta. **Con esta, todas las cuestiones de la 021 están resueltas** |

## Puerta P0

Abierta por el responsable el 13/11/2026 en el diálogo de preguntas del chat de la fase 3, con la respuesta «Apruebo la 021». La especificación pasa a APROBADA. Lo que el resumen presentó como deducción o propuesta sin respuesta previa quedó aprobado con ella.

## Decisiones tras la verificación del servicio de identidad (13/11/2026)

Evidencia en `evidencias/verificacion-identidad-y-correo.md`. Respuestas escritas por el responsable en el chat de la fase 3.

| Asunto | Respuesta literal | Quién y cuándo | Efecto |
| --- | --- | --- | --- |
| Duración de sesión, que solo ofrece el plan Pro de Supabase | «Si, solo en producción, por ahora usamos plan gratuito» | Responsable, 13/11/2026 | Plan Pro solo en producción. En desarrollo y preproducción, plan gratuito: allí la duración máxima y la inactividad de la sesión no se pueden probar con el servicio. El diseño debe decir cómo se prueban REQ-011 y REQ-012 antes de producción. Afecta a D-016 y B-002: se pasa a coordinación |
| Corte de las demás sesiones | «inmediato» | Responsable, 13/11/2026 | Se mantiene «siempre inmediato», sabiendo que el servicio no lo da: control propio que comprueba en cada petición que la sesión sigue viva. Ruta crítica |
| Códigos de recuperación | «Codigo» | Responsable, 13/11/2026 | Se mantienen los códigos de recuperación. **Sin aclarar** si con la función experimental del servicio o construidos por el equipo: se pregunta |
| Proveedor de correo | «proveedores de correo, gmail y microsoft?? a eso te refieres?» | Responsable, 13/11/2026 | Es una pregunta, no una decisión: se contesta y se vuelve a preguntar |
| Códigos de recuperación: con qué se hacen | «si», a la opción «La función experimental de Supabase», recomendada con una condición | Responsable, 13/11/2026 | Se usa la función experimental del servicio de identidad, con la condición presentada: comprobarla con una prueba real antes de diseñar sobre ella y dejar escrita la alternativa (construirlos) |
| Quién envía los correos de Nido | «si», a «Google Workspace», y la dirección «accesos@humannaia.com» | Responsable, 13/11/2026 | Los correos de invitación y de restablecimiento salen de la cuenta de empresa de Google Workspace, desde esa dirección. V-111 queda acotada a verificar ese envío en la documentación oficial de Google. La contraseña o clave de envío la pone una persona en el gestor de variables (artículo 4) |
