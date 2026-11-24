# T-119: pasos 1 y 2 del guion y AR-16 (24/11/2026)

Hechos **fuera de orden** (después de los pasos 3 a 8), confirmados por el responsable («ok», 24/11/2026) y anotados por la coordinación.

## Paso 1: declaración e inventario (CA-018, versión parcial)
- **Declaración (sin la dirección):** el Gmail enlazado es el de pruebas de HumanaIA y no hay otro correo en la tarea.
- **Inventario a 23/11/2026:** en la tarea, solo el Gmail de pruebas y HumanaIA. Se quitaron Drive, Figma, WebMCP, Docs y Claude Code Remote (declarado por el responsable; sin capturas).
- **Desviación:** el conector de Gmail **no se limitó a las siete herramientas** del guion, por decisión expresa del responsable (ver `buzon-preparado.md`). CA-018 de anfitrión: no demostrado.

## Paso 2: arranque local ficticio (CA-018)
Instalado: es el texto de `prompts/agente-prueba/arranque.md` (versión 0.1 del prompt), que lleva la tarea programada y la conversación de prueba. Sin capturas de la terminal.

## AR-16: navegador real, GET y POST sobre la pantalla de activación (PRUEBA-009, parte)
La pantalla de activación se abrió y se completó en el navegador real del responsable el 23/11/2026 (GET de la pantalla y POST del código desde el mismo origen, sin JavaScript): la conexión quedó creada (1 conexión ligada a la licencia A, paso 4). Eso cubre «GET y POST con navegador real». **No cubre**, y queda sin comprobar: POST desde otro origen sin contar intento, `x-vercel-forwarded-for` falsificable, y el `Origin` con `same-origin` (V-6); ni la parte de accesibilidad de la PRUEBA-010 (360 y 320 px, zum 400 %, lector de pantalla, colores forzados, tema oscuro).
