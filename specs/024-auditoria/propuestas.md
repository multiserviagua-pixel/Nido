# 024 · Propuestas para coordinación

Cambios que esta función necesitaría fuera del rango de la fase 3. El chat de la fase 3 no los edita: los anota aquí para el chat de coordinación y para los chats de las fases afectadas. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 3, a partir de la especificación del `especificador`.

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 024 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Acción con nombre del dominio | Cada fila guarda una acción de una lista cerrada («revocó una conexión», «creó una orden de pausa»), y una acción fuera de la lista no se puede guardar (REQ-003, REQ-022). El modelo de referencia anota la operación técnica (`insert`, `update`, `delete`) y el nombre de la tabla | Fase 2 (010) |
| 2 | Fila por acción o por dato afectado | Exactamente una fila nombra cada acción (REQ-018). El requisito 17 de la 010 pide una fila por cada dato afectado. Recomendación de la fase 3: fila principal y filas vinculadas (cuestión 5) | Fase 2 (010) y responsable |
| 3 | Origen del actor | Las filas sin persona llevan un actor de lista cerrada («Sistema», «Agente del cliente»), nunca vacío (REQ-017). El modelo las anota con actor vacío | Fase 2 (010, su cuestión 17) |
| 4 | Acciones que ocurren en el servicio de identidad | Registrar, sustituir y quitar un segundo factor, aceptar una invitación, la recuperación y, si el responsable lo aprueba, el inicio de sesión completo y el cambio de contraseña dejan fila (entradas I-16 a I-23 y cuestión 1). No son cambios de tablas del panel: un disparador no las ve | Fase 2 (010) y diseño de la 021 |
| 5 | Actor del primer administrador | La fila identifica a la persona que ejecuta el procedimiento (I-15). El disparador del modelo anota la sesión, que no existe si se hace por SQL | Fase 2 (010) |
| 6 | Nadie inserta filas directamente | Ni el superadmin, ni el conector, ni la clave secreta (REQ-026, REQ-042). Coincide con los requisitos 16 a 18 de la 010 | Fase 2 (010) |
| 7 | Inventario de fases posteriores | Publicar, volver atrás, pausa global, resolver alertas, estado manual de cobro y exportaciones se añaden al inventario por la función que las especifique | Fases 4 a 6 |
| 8 | Conservación | No se elimina ninguna fila hasta que se fijen los plazos | Fase 6 (052, su cuestión 12) y fase 2 (010, su cuestión 7) |
| 9 | Anonimizar frente a solo inserción | Ninguna fila existente cambia (REQ-025, REQ-028). Según el `especificador`, la cuestión 12 de la 052 plantea anonimizar actores en la auditoría, lo que chocaría con eso. No lo he comprobado en la 052 | Fase 6 (052) y fase 2 (010) |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/MODELO-DATOS.sql` | Ver fronteras 1 a 5 | El modelo es de la fase 2 |
| `docs/DISENO.md`, «Textos y formatos» | Excepción del formato de hora en la página de auditoría (segundos), si el responsable la aprueba | Cuestión 7 |
| `docs/SEGURIDAD.md`, A-11 | Añadir a los controles el inventario cerrado de acciones y su prueba de cobertura | CA-001 y CA-002 |
| `docs/TECNOLOGIAS.md` | Anotar como decisiones las respuestas del responsable a las cuestiones 1 a 5, cuando las dé | Skill `sdd-aclarar`, paso 6 |
