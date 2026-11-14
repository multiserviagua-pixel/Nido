# 022 · Propuestas para coordinación

Cambios que esta función necesitaría fuera del rango de la fase 3. El chat de la fase 3 no los edita: los anota aquí para el chat de coordinación y para los chats de las fases afectadas. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 3, a partir del informe del `especificador`.

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 022 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Auditoría con acción distinguible | Cada acción deja fila con una acción de lista cerrada: alta, edición y baja de cliente; creación, suspensión, reactivación, revocación y cambio de caducidad de licencia; generación de código; revocación de conexión (REQ-034). El disparador del modelo solo anota alta, cambio o borrado de fila | Fase 2 (010) y función 024 |
| 2 | Transiciones de la licencia | Solo se permiten las de REQ-015 a REQ-019; no se puede pasar una licencia a otro cliente ni devolver una revocada a activa, tampoco escribiendo directamente con sesión de superadmin (REQ-057, REQ-060). El modelo deja modificar cualquier campo | Fase 2 (010) |
| 3 | Revocación de conexión irreversible | No se puede quitar ni cambiar la fecha de revocación (REQ-029, REQ-061). El permiso del modelo lo permite | Fase 2 (010) |
| 4 | Códigos de activación creados solo por la vía prevista | Solo para licencia vigente de cliente activo, con la caducidad fijada, con el autor de la sesión y sin usar (REQ-020, REQ-044, REQ-057). El modelo deja insertarlos con cualquier valor | Fase 2 (010) |
| 5 | Campos del cliente | Desde el panel solo cambian nombre y frecuencia (REQ-009). El modelo deja modificar estado, canal y fecha de alta, y no rechaza caracteres de control en el nombre | Fase 2 (010) |
| 6 | Datos que el modelo no guarda | Estado «anulado» de un código (cuestión 4), motivo de revocación de una conexión (cuestión 13) y causa de la suspensión, manual o por cobro (cuestión 9) | Fase 2 (010), según las respuestas del responsable |
| 7 | Licencia revocada | Sus conexiones no obtienen instrucciones ni renuevan (REQ-018). En el modelo, revocar la licencia no revoca sus conexiones, y la renovación de tokens tiene que comprobar la licencia | Fases 1 y 2 (011, 014) |
| 8 | Respuesta con licencia revocada | La 022 vale con las dos opciones. `docs/ARQUITECTURA.md` dice «siempre con un estado»; el modelo responde no autorizado | Fase 2 (cuestión 17 de la 011) |
| 9 | Canal del cliente | La 022 lo muestra en lectura; el cambio queda en la 030 (su requisito 13) | Fase 4 (030, frontera 1 de su `propuestas.md`) |
| 10 | Usuarios del cliente en la ficha | La 040 (fase 5) especifica invitar y retirar el acceso de usuarios de cliente, que viven en la ficha. La 022 no lo especifica: deja el sitio | Fase 5 (040) |
| 11 | Suspensión manual y cobro | Dos causas separadas, si el responsable acepta la recomendación de la cuestión 9 | Fase 6 (050) |
| 12 | Entorno para probar la revocación | CA-019 y los criterios con agente de prueba necesitan el conector de la fase 2 en el entorno de desarrollo | Fase 2 |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/CONSTITUCION.md`, artículo 2 | Nota aclaratoria: en el dashboard de superadmin el identificador del cliente elige sobre quién se actúa; el permiso sale siempre de la sesión | Cuestión 11. Solo el responsable enmienda la constitución |
| `.claude/rules/interfaz.md` | Aclarar «ningún dato en la URL que no sea un identificador propio del usuario» para el superadmin | Misma cuestión |
| `docs/DISENO.md`, ficha de cliente | Decir en qué función se editan las reglas y el canal, y añadir los usuarios del cliente (fase 5) | Cuestiones 1 y 2; frontera 10 |
| `docs/PLAN.md` | Asignar fase a la edición de las reglas por cliente | Ningún plan de fase la recoge |
| `docs/SEGURIDAD.md`, A-07 | Añadir la fase 3 a «dónde se comprueba» | La fase 3 también lee datos de clientes |
| `docs/ARQUITECTURA.md`, flujo 2 | Aclarar qué recibe una licencia revocada | Frontera 8 |
| `docs/TECNOLOGIAS.md` | Anotar como decisiones las respuestas del responsable a las cuestiones 1, 7, 9 y 11, cuando las dé | Skill `sdd-aclarar`, paso 6 |
