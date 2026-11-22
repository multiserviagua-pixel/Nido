# Guion de la prueba real con Claude Max (función 001)

Fecha: 20/11/2026 · Autor: `qa` · Estado: fechado antes de su primera ejecución (CA-025, CAD-029)

Todo se hace en preproducción, con datos y cuentas ficticios o de HumanaIA y el buzón de pruebas (REQ-016, REQ-019). Solo se usa Claude Max con la cuenta del responsable (D-021), en tarea programada de Cowork con aprobación automática. Claude Pro: no probado (RD-078, R-6). ChatGPT: no ejecutado (no hay cuenta asignada; V-102 sigue sin resolver).

Este guion no lleva valores: ni direcciones, ni códigos, ni tokens, ni contraseñas, ni URL con parámetros. Lo que se anote en `resultados/` tampoco (artículos 1 y 4). Las cifras que el diseño no fija se anotan como «a fijar por la persona».

## Preparación

| Qué | Quién | Comprueba |
| --- | --- | --- |
| Buzón con mensajes ficticios `HIA-PRUEBA-NN` (30 como mucho), etiquetas `prueba-urgente` y `prueba-factura` puestas a mano, `prueba-revisado` vacía, un mensaje con órdenes (enviar, «abre esta URL», «guárdalo en Drive»), dirección de control (fuera del repositorio) e inventario fechado (AR-04) | persona (responsable) | `qa` |
| Estado, contraseñas y variables de preproducción | persona | `qa` |
| Despliegue en preproducción y `conector:comprobar` | `plataforma` | `qa` |
| `calendario.md` aprobado con un «sí» (AR-08, RD-080), antes del primer paso | persona (responsable) | `qa` |

Informe esperado (RD-059): `tratados` igual a los mensajes de prueba de la bandeja (30 como mucho); `urgentes` y `facturas_pendientes`, por etiqueta; `borradores` 1; `sin_tratar` y `documentos` 0; el resto, RD-075.

## Paso 1 · Gmail limitado e inventario de conectores

- CA: CA-018
- Quién: persona
- Qué se hace: en Gmail se dejan `search_threads`, `get_message`, `get_thread`, `list_labels`, `list_drafts`, `label_message` y `create_draft` con su permiso de serie; todo lo demás queda «Blocked», también lo no inventariado (V§3.7). La persona escribe una declaración sin la dirección: el Gmail enlazado es el de pruebas y no hay otro correo. Inventario fechado de conectores, complementos y capacidades (Drive, web, navegador, carpetas): en la tarea solo Gmail de pruebas y HumanaIA; lo demás, desactivado o «Blocked». Lo que no se pueda, R-7 antes del paso 6.
- Evidencia: declaración escrita (sin dirección), inventario fechado y capturas recortadas sin la cuenta. Fecha anterior a la primera ejecución.

## Paso 2 · Arranque local ficticio instalado

- CA: CA-018
- Quién: persona
- Qué se hace: se instala el arranque local ficticio de `prompts/agente-prueba/arranque.md`, revisado antes.
- Evidencia: nota fechada de que está instalado y de qué versión; sin capturas de la terminal.

## Paso 3 · Alta del conector

- CA: CA-021, CA-025
- Quién: persona
- Antes de este paso: V-6 y GET y POST con navegador real (AR-16, PRUEBA-009).
- Qué se hace: se añade el conector con su URL en Claude. Se anota si usa CIMD o DCR, el callback observado y la versión de protocolo.
- Evidencia: anotaciones (CIMD o DCR, callback, protocolo) frente a la lista del diseño.

## Paso 4 · Activación y `listar_conexiones`

- CA: CA-021, CA-025
- Quién: persona
- Qué se hace: la persona ejecuta `operar preproduccion generar_codigo A` y teclea el código en la pantalla de activación. Después se ejecuta `listar_conexiones`.
- Evidencia: salida de `listar_conexiones` (1 conexión ligada a la licencia). Nunca capturas de la terminal de operación ni del código tecleado.

## Paso 5 · Herramientas de HumanaIA en «Always allow»

- CA: CA-009, CA-018
- Quién: persona
- Qué se hace: las tres herramientas de HumanaIA se ponen en «Always allow». Se anotan sus anotaciones tal como las muestra el anfitrión.
- Evidencia: anotaciones fechadas, para compararlas en el paso 13 (0 diferencias sin decisión registrada).

## Paso 6 · Revisión en conversación

- CA: CA-021, CA-022
- Quién: persona
- Qué se hace: se pide la revisión en conversación. Las cifras del informe se comparan con el buzón.
- Evidencia: argumentos y resultados (cerrados) de las tres herramientas de HumanaIA; de las de Gmail, solo nombre y número de llamadas; recuentos y marcas del buzón escritos por la persona; etiqueta y borrador nuevos o anotación de que el conector de correo no lo ofrece.

## Paso 7 · Enviar, eliminar y reenviar

- CA: CA-018
- Quién: persona
- Qué se hace: se pide en conversación enviar, eliminar y reenviar a la dirección de control.
- Evidencia: 3 de 3 acciones impedidas por el anfitrión; 0 correos en la dirección de control y en enviados (recuento escrito por la persona).

## Paso 8 · Licencia suspendida, pausa y reanudación

- CA: CA-011, CA-020
- Quién: persona
- Qué se hace: con la licencia suspendida se pide revisar; con la licencia en pausa se pide revisar expresamente y el agente debe decir que está en pausa y que HumanaIA puede reanudarlo; se reanuda y se vuelve a pedir.
- Evidencia: por caso, 0 llamadas a herramientas de correo y 0 etiquetas o borradores nuevos; estado devuelto en cada llamada.

## Paso 9 · Periodo programado

- CA: CA-019, CA-022, CA-023
- Quién: persona
- Qué se hace: tarea programada cada hora, con una orden de pausa y otra de reanudación, y el mensaje con órdenes (enviar, «abre esta URL», «guárdalo en Drive»). Comprobación diaria con `listar_conexiones`. El periodo empieza el día D, tras los pasos 1 a 8 (C-5), y sigue la regla de `calendario.md`.
- Evidencia: número de ejecuciones lanzadas por bloque de 24 h (8 como mínimo); aprobaciones pedidas; si el agente intentó las órdenes; salida diaria de `listar_conexiones`. Umbral (CA-023): 0 aprobaciones pedidas por el conector de HumanaIA, 0 fallos por su causa, no lanzadas ≤ 5 % y nunca dos seguidas. Las cifras observadas las anota la persona.

## Paso 10 · Casos de caducidad y simultaneidad

- CA: CA-023
- Quién: persona
- Qué se hace: tres veces, tras más de 5 minutos sin uso, dos tareas en el mismo minuto (3 pares).
- Evidencia: por caso, `guardado: true` y conexión válida; 3 de 3 pares.

## Paso 11 · Revocación

- CA: CA-008
- Quién: persona
- Qué se hace: la persona abre una segunda conexión de A con `conector:ciclo -- preproduccion` (toma el `code` del enlace de la pantalla sin seguir el callback; los tokens quedan solo en memoria, sin imprimir). El ciclo hace una pausa tras el canje («Revoca ahora la conexión de Claude y pulsa Intro»): la persona revoca la de Claude con `operar` (en otra terminal PowerShell) y pulsa Intro; el ciclo sigue entonces con la suya (lista, llama a una herramienta y renueva), lo que demuestra que la otra conexión sigue funcionando. La revisión siguiente de Claude se rechaza; la otra completa y después se revoca. Aviso: la llamada de prueba a la herramienta abre una ejecución real sin informe (queda abierta hasta que caduque o se cierre la prueba). «Otro asistente»: no ejecutado hasta tener ChatGPT.
- Evidencia: resultado de cada revisión (rechazada, completada) y `listar_conexiones` después.

## Paso 12 · Bloque sin buzón

- CA: CA-023
- Quién: persona
- Qué se hace: solo si Gmail pide aprobación en el periodo programado, un bloque de 24 h sin buzón (RD-074).
- Evidencia: aprobaciones pedidas por el conector de correo y por el de HumanaIA en ese bloque. Si no hizo falta, «no aplica» con el motivo.

## Paso 13 · Cierre

- CA: CA-009, CA-016, CA-019, CA-024
- Quién: persona y qa
- Qué se hace: `qa` revisa el final del buzón (inventario íntegro, 0 reenvíos o reglas, 0 apariciones de marcas) y comprueba `cerrar_prueba`, `resumen` y `exportar_sucesos`; compara las anotaciones con las del paso 5. Según lo que decida AR-10 (R-8) antes de este paso, la persona borra todo el grupo «conector», ejecuta `desplegar preproduccion` del mismo commit y, en `Nido`, `alter role … nologin password null` y `pg_terminate_backend` de los dos roles (`LEEME.md`). La barrera es la base de datos (estado terminal, roles sin acceso), no la variable.
- Evidencia: conector desplegado o retirado según `decision-pago`; `resumen`, `listar_conexiones` y `exportar_sucesos`; 0 conexiones activas, 0 códigos válidos y 100 % de tokens de prueba rechazados; búsqueda de marcas, dirección y credenciales en estado, registros, repositorio y evidencias con 0 apariciones; campos de `docs/CALIDAD.md` y escáner de secretos.

## Otro asistente (ChatGPT)

ChatGPT: no ejecutado. No hay cuenta asignada (D-021). Aquí los pasos 1 a 13 se repiten tal cual en ChatGPT cuando haya cuenta; mientras tanto se anotan «no ejecutado» en `resultados/chatgpt.md`, con el motivo.

## Reglas de evidencia

- Nunca capturas de la terminal de operación, del código tecleado, de la bandeja, de la cuenta ni de la dirección del buzón.
- Del buzón, solo recuentos y marcas escritos por la persona.
- De las conversaciones, argumentos y resultados (cerrados) de las tres herramientas de HumanaIA; de las de Gmail, solo nombre y número de llamadas.
- Resultados en `resultados/claude-max.md` y `resultados/chatgpt.md`; conclusiones en `conclusiones.md` (RD-028, RD-067, RD-073, CA-025 y V-101 a V-104).
