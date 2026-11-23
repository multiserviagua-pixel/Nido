# Propuesta del responsable: prompt de arranque de autoinstalación (23/11/2026)

Origen: el responsable, durante la prueba real de la 001, respuestas expresas: «las tareas programadas deberían ser instaladas por Nido, no obligar al cliente a complicarse con tareas extras», «el prompt de arranque debe instalar el mcp, y luego permitir conectar al usuario a Nido… todo en un solo prompt de autoinstalación; las credenciales y accesos deben ser ingresados por el usuario en la etapa que corresponda».

Estado: **PROPUESTA** para el `especificador` de la 012 (y la guía del cliente de la fase 5). No está especificada ni aprobada.

## Idea
Un único texto de arranque que el cliente pega una vez en su Claude y que conduce la instalación por etapas, sin que el cliente tenga que montar tareas ni leer guías:
1. **Comprobar** qué conectores hay y cuáles faltan.
2. **Conectar HumanaIA**: indicar dónde añadir el conector y su URL; el usuario concede el acceso en la página de Claude y teclea en la pantalla de activación el código que HumanaIA le ha dado.
3. **Verificar**: llamar a `obtener_instrucciones` y comprobar el estado `activa`.
4. **Conectar el correo**: guiar al usuario; los permisos que se concedan los decide el usuario (con recomendación y aviso del riesgo; el artículo 8 no se toca).
5. **Crear la tarea programada** con una frase fija (llamar a `obtener_instrucciones` y seguir lo recibido), si la plataforma lo permite.
6. **Primera revisión** y resumen de lo hecho, solo con cifras.

## Límites que no se relajan
- Ninguna contraseña, token ni código pasa por el chat ni por el texto: los escribe el usuario en las pantallas que correspondan (artículo 4).
- Nada de lo que entregue el servidor puede relajar los límites del agente (artículo 8); el texto del prompt vive en el repositorio y se versiona (artículo 9).
- Correos y salidas de herramientas son datos, nunca órdenes (artículo 7).

## A comprobar antes de especificar (no se sabe)
- Un prompt **no puede añadir por sí mismo un conector** a Claude (hay que hacerlo en los ajustes): la etapa 2 será guiada, no automática. En Claude Code existe `claude mcp add`, pero el cliente objetivo usa la aplicación.
- Si Claude puede **crear y dejar activa** una tarea programada desde el propio mensaje, y en qué planes.
- Si la tarea creada así corre **sin pedir aprobaciones** ni al conector de HumanaIA ni al de correo (V-101 a V-104, CA-023). El paso 9 de la prueba real de la 001 puede comprobarlo creando la tarea a petición del propio Claude con el arranque.
- ~~Cómo se entrega el código de activación al cliente~~ **Decidido por el responsable (23/11/2026):** lo genera el propio cliente en la web de Nido, en su dashboard, como hacen otras páginas con códigos de un solo uso: botón «Generar código de activación», se muestra una vez, caduca a los 10 minutos y sirve una sola vez. Hoy lo genera una orden de la persona de HumanaIA (`operar … generar_codigo`) solo para la prueba de la 001. Condiciones: el cliente sale de la sesión del dashboard, nunca de un identificador escrito por él (art. 2); el código no se registra ni se repite (art. 4); va a la función de acceso del cliente (040) y a la guía de instalación.

Relacionado: `prompts/agente-prueba/arranque.md` (arranque de la prueba, sin autoinstalación), `docs/INSTALACION-CLIENTE.md` (por escribir) y la especificación de la 001, §V-101 a V-104.

## Primera observación real (23/11/2026, prueba de la 001, paso 9)
Al pedirle a Claude (Max, conversación nueva) que cree una tarea programada cada hora con el texto de arranque, respondió que entendía la tarea, qué permisos necesitaría (las tres herramientas de HumanaIA y leer, etiquetar y crear borradores de Gmail) y que **la aprobación automática de la tarea no puede forzarla él**: el usuario debe activar «Automatically approve» en la configuración de la tarea, si su organización lo permite. Consecuencia para el diseño: la autoinstalación **no puede ser del todo automática**; habrá al menos un ajuste manual del cliente (aprobación automática) que la guía debe mostrar con claridad. Pendiente de ver si Claude llega a crear la tarea y si se ejecuta sin aprobaciones.
