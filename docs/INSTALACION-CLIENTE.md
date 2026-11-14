# Instalación en un cliente

Estado: **BORRADOR**. Los pasos marcados (V) dependen de lo que confirme la prueba real de la fase 1. No se usa con clientes hasta cerrar esa fase.

Esta lista es parte de la seguridad del producto: los límites del agente se imponen aquí, en los permisos del asistente del cliente (artículo 8 de la constitución).

## Antes de empezar

- El cliente tiene un plan de Claude o de ChatGPT que admite conectores personalizados (V) y tareas programadas.
- Su correo y su almacenamiento en la nube ya están conectados al asistente.
- En el panel superadmin existen el cliente y su licencia.

## Pasos

1. **Generar el código de activación** en la ficha del cliente. Es de un solo uso y caduca en minutos. No se envía por correo ni por mensajería: se introduce en el momento.

2. **Añadir el conector** en el asistente del cliente con la URL del conector de HumanaIA.

3. **Autorizar.** El asistente abre nuestra pantalla de activación. Comprobar que la dirección es la nuestra antes de escribir el código.

4. **Limitar los conectores de correo y de nube del cliente.** En los permisos de herramientas del asistente:
   - Correo: desactivar o bloquear enviar, eliminar y reenviar automático. Dejar leer, etiquetar, archivar y crear borradores.
   - Nube: desactivar eliminar y compartir. Dejar leer, crear carpetas y crear archivos.

5. **Permitir nuestras tres herramientas sin preguntar**, también en ejecuciones programadas (V). Solo nuestras tres herramientas: no ampliar este permiso a las de correo o nube.

6. **Guardar el arranque local** como instrucciones del proyecto o de la tarea. Es el texto corto que llama a `obtener_instrucciones` y conserva los límites. Se copia de `prompts/agente-ia/arranque.md` (fase 2).

7. **Programar la revisión** con la frecuencia acordada. Anotar esa frecuencia en la ficha del cliente: es la que usa la alerta «sin señal».

8. **Comprobar.** Lanzar una revisión a mano y ver en el panel: conexión nueva, ejecución abierta y cerrada, informe recibido.

9. **Comprobar la ejecución programada** al día siguiente: debe haber un informe en modo `desatendido` sin intervención de nadie.

## Qué explicar al cliente

- El agente nunca envía correo: lo deja todo en borrador.
- A HumanaIA solo llegan cifras y estados; ningún asunto, remitente ni texto.
- En su panel ve el estado y las cifras de su agente. Para pausarlo, lo pide a HumanaIA.

## Baja o incidencia

- **Baja**: revocar las conexiones del cliente y suspender la licencia en el panel; quitar el conector y la tarea programada en su asistente.
- **Sospecha de uso indebido**: revocar la conexión afectada. Las demás siguen funcionando.
- **Cambio de asistente o de cuenta**: generar un código nuevo y repetir los pasos 2 a 9. Revocar la conexión antigua.

## Si un asistente no admite la ejecución desatendida

Se aplica el plan B que el responsable apruebe al cerrar la fase 1 (ver `docs/PLAN.md`).
