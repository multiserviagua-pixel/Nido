# 040 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Estado a 12/11/2026: **todas PENDIENTES**. La columna «Recomendación» es del orquestador y no es una decisión.

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | ¿Quién da de alta a los usuarios de un cliente? | PENDIENTE | — | — |
| 2 | ¿Puede un cliente tener varios usuarios, y ven todos lo mismo? | PENDIENTE | — | — |
| 3 | ¿Puede una misma persona pertenecer a varios clientes? | PENDIENTE | — | — |
| 4 | ¿Cómo se entra en el panel? | PENDIENTE | — | — |
| 5 | ¿Doble factor para los usuarios de cliente? | PENDIENTE | — | — |
| 6 | ¿Qué acceso hay según el estado del cliente y de su licencia? | PENDIENTE | — | — |
| 7 | ¿Puede el usuario cambiar por sí mismo su correo de acceso? | PENDIENTE | — | — |
| 8 | ¿Puede una misma cuenta ser superadmin y usuario de un cliente? | PENDIENTE | — | — |
| 9 | ¿Qué pasa con la cuenta al retirarle su último acceso? | PENDIENTE | — | — |
| 10 | Umbrales propuestos | PENDIENTE | — | — |

## Opciones, consecuencia y recomendación

### 1. Quién da de alta a los usuarios de un cliente

- a) Solo un superadmin, desde la ficha del cliente.
- b) El superadmin invita al primero y ese invita a los demás.
- c) Ambos.

Con b) o c) el panel de cliente deja de ser de solo lectura, hay que distinguir permisos entre usuarios de un mismo cliente y auditar también sus acciones.

**Recomendación: a).** Mantiene el panel de solo lectura y todas las altas pasan por HumanaIA. El coste es que cada alta o baja es una gestión vuestra. Si más adelante pesa, el alta por el propio cliente se puede añadir como función nueva sin rehacer esta.

### 2. Varios usuarios por cliente

- a) Uno solo por cliente.
- b) Varios, todos con los mismos permisos de lectura.
- c) Varios, con niveles.

**Recomendación: b), y que no se vean entre ellos.** Con uno solo, si esa persona se va el cliente se queda sin acceso. Los niveles exigen un modelo de permisos que hoy nadie ha pedido y se pueden añadir después. La lista de usuarios de un cliente la ve el superadmin en la ficha, no los demás usuarios: así no se exponen correos dentro del cliente. Consecuencia que debes conocer: todos los usuarios de un cliente podrían abrir el portal de pago (cuestión 2 de la función 042).

### 3. Una misma persona en varios clientes

- a) No: cada cuenta pertenece a un solo cliente.
- b) Sí: habría que elegir cliente dentro del panel.

**Recomendación: a).** El cliente se deriva de la sesión sin ambigüedad, que es lo que pide el artículo 2. Quien lleve varios clientes (una gestoría) necesita un correo distinto por cliente.

### 4. Cómo se entra

- a) Contraseña, con recuperación por correo.
- b) Enlace o código de un solo uso por correo, sin contraseña.
- c) Ambos.

**Recomendación: a).** Tres motivos. El buzón del cliente lo lee su agente de correo: con b) cada entrada pasa un código vivo por el asistente de IA; con a) solo la invitación y alguna recuperación. Con b) el cliente no puede entrar si el correo se retrasa o cae en no deseado. Y los superadmin entran con contraseña y segundo factor (función 021): una sola forma de entrar son una sola pantalla y un solo juego de pruebas. El coste de a) es gestionar contraseñas: longitud mínima, lista de contraseñas comunes y límite de intentos, ya recogidos en la especificación. c) duplica la superficie sin ganar nada claro.

### 5. Doble factor para usuarios de cliente

- a) No se ofrece.
- b) Opcional.
- c) Obligatorio.

**Recomendación: a) en esta fase.** El panel es de solo lectura y solo muestra cifras y estados. El doble factor trae consigo la recuperación del factor perdido, que es soporte para vosotros. Se revisa si el panel llega a tener acciones.

### 6. Acceso según el estado del cliente y de la licencia

Para cada estado: acceso completo, solo Suscripción y Cuenta, o sin acceso.

**Recomendación:**

| Estado | Acceso |
| --- | --- |
| Licencia suspendida (impago dentro o fuera de la gracia, o a mano) | Completo, en lectura. Ve su histórico, el estado «Suspendido» y la página Suscripción para regularizar |
| Licencia revocada o cliente dado de baja | Sin acceso, con un mensaje claro |

Un cliente con un impago tiene que poder entrar para pagar. Un cliente dado de baja ya no tiene servicio y no hay motivo para conservar su acceso.

### 7. Cambio del correo de acceso

- a) Lo cambia el usuario, confirmando desde el correo antiguo y el nuevo.
- b) Lo pide a HumanaIA: se retira el acceso y se invita al correo nuevo.

**Recomendación: b).** Menos superficie de ataque, y resuelve también el caso de quien ha perdido su buzón.

### 8. Cuenta que sea superadmin y usuario de cliente a la vez

- a) No.
- b) Sí.

**Recomendación: a).** Con la sesión de un superadmin, el panel de cliente podría mostrar todos los clientes. Separar las cuentas lo impide y simplifica las pruebas de aislamiento. Para probar el panel de cliente, el personal de HumanaIA usa una cuenta distinta. La función 021 (fase 3) tiene abierta la misma cuestión: debe contestarse igual.

### 9. Cuenta al retirarle su último acceso

- a) Se borra.
- b) Se conserva desactivada.
- c) Se conserva sin vinculación.

**Recomendación: a).** Es lo que guarda menos datos personales. Un usuario de cliente no hace acciones que haya que atribuirle después, así que la auditoría no pierde nada: conserva el identificador interno. Si se le vuelve a invitar, es una cuenta nueva.

### 10. Umbrales

| Umbral | Valor propuesto |
| --- | --- |
| Caducidad de la invitación | 72 horas |
| Caducidad del enlace o código de recuperación | 30 minutos |
| Sesión | 8 horas sin actividad, 7 días como máximo |
| Fallos por cuenta | 5 en 15 minutos, bloqueo de 15 minutos |
| Fallos por origen | 20 en 15 minutos, bloqueo de 15 minutos |
| Correos de acceso | 3 por correo y hora |
| Contraseña | Mínimo 12 caracteres, admite 64, lista de contraseñas comunes |
| Rendimiento | Contenido principal en menos de 2,5 segundos, percentil 75, móvil con 4G simulada |

**Recomendación: confirmarlos.** Son valores habituales para un panel de consulta. El único con efecto visible para el cliente es la sesión: con 8 horas sin actividad, quien entre una vez por semana tendrá que identificarse cada vez. Si prefieres menos fricción, se puede subir a 7 días sin actividad y 30 como máximo, a cambio de sesiones abiertas más tiempo en móviles compartidos o perdidos.

## Decisiones que salen de aquí

Ninguna todavía. Cuando el responsable conteste, las que sean decisiones del proyecto las anotará el chat de coordinación en `docs/TECNOLOGIAS.md`. Candidatas: forma de entrada de los usuarios de cliente (cuestión 4), una cuenta por cliente (cuestión 3) y separación de cuentas de superadmin y de cliente (cuestión 8).
