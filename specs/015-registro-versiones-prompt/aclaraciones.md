# 015 · Aclaraciones

Cuestiones presentadas al responsable el 12/11/2026. **Tiene respuesta, en parte, la n.º 1; las demás siguen abiertas.** Una respuesta supuesta no vale: mientras la columna «Respuesta» esté vacía, la cuestión sigue abierta y la función sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`, donde están las opciones y la consecuencia de cada una. La columna «Recomendación» es del orquestador; no es una decisión.

Esta función existe por una respuesta del responsable del 12/11/2026: a la cuestión 11 de la 011 contestó «Adelantar registro».

Tipos:

- **R**: la decide el responsable ahora (puerta P0).
- **F1**: depende de lo que decida la fase 1.
- **V**: depende de verificar una decisión (skill `verificar-decision`) antes de diseñar. Se lleva al responsable en la puerta P1, con el resultado.
- **D**: es del diseño. Se lleva en la puerta P1.
- **C**: es de coordinación o de otra fase. Va en `propuestas.md`.

| N.º | Cuestión | Tipo | Recomendación del orquestador | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | En qué entornos registra el despliegue durante la fase 2 | R, F1 | Preproducción. En desarrollo, solo si el diseño encuentra una forma que siga siendo un despliegue válido; depende de cómo quede el entorno previo en la fase 1 (V-114) | A la pregunta «¿Se aplica algo en producción durante la fase 2?» (n.º 16 de la 010): «No, solo pruebas» | Responsable, 12/11/2026 | Respondida en parte: producción queda fuera en la fase 2, así que se descarta la opción (b). Sigue abierto si registra también en desarrollo |
| 2 | Cómo pasa una versión registrada a ser la vigente de un canal sin panel, quién lo aprueba y cómo se vuelve atrás | R | Una persona ejecuta un procedimiento escrito, con una credencial distinta de la del despliegue, y cada paso lo aprueba el responsable. La 1.3 entra primero en `prueba` y pasa a `estable` cuando supere el banco de la 012, para que la fase 4 encuentre un estado regular. Si se vuelve atrás la primera versión, el canal se queda sin instrucciones y los agentes reciben `pausada` | | | |
| 3 | Con qué identidad registra el despliegue | V | Una identidad propia que solo añade versiones. Hay que verificar que es viable, igual que V-107 para el conector; se lleva al responsable con el resultado. Usar la clave secreta dejaría que una clave filtrada registrase cualquier texto | | | |
| 4 | Si la 1.2 se registra | R | No. Figura en la lista de archivos que no se registran. Coincide con el n.º 7 de la 012 | | | |
| 5 | Si el arranque local se registra | R | No. Se versiona solo en el repositorio, con su identificador propio. Registrarlo en la misma tabla permitiría servirlo como prompt | | | |
| 6 | Formato del número de versión | R | `mayor.menor` con un tercer número opcional y una sola escritura por número, como admiten ya el contrato del informe y el modelo. Vale la misma respuesta para la cuestión 14 de la 030 | | | |
| 7 | Qué pasa si un despliegue registra y después falla o se vuelve atrás, o si se retira el archivo de una versión registrada | R | Aceptarlo: el archivo de una versión registrada no se retira nunca del repositorio, y la vuelta atrás del código es volver a servir el despliegue anterior, sin revertir el commit. Es coherente con la respuesta «hacia delante» del n.º 14 de la 010 | | | |
| 8 | Si integrar una versión nueva del prompt exige la aprobación expresa del responsable | R | Sí. Lo que se registra lo siguen los agentes dentro del correo de los clientes y queda para siempre; una aprobación por versión cuesta poco frente a ese riesgo (artículos 6 y 9) | | | |
| 9 | Si el despliegue comprueba que la versión pasó el banco de pruebas de la 012 | R | Lo comprueba la persona que aprueba el paso a `estable`, no el despliegue. El orden queda: registrar, hacer vigente en `prueba` en preproducción, ejecutar el banco y, si pasa, `estable`. Así desaparece el círculo entre banco y registro. Obliga a cambiar el requisito de la 012 que dice «antes de registrar» por «antes de hacerla vigente en `estable`» | | | |
| 10 | Qué se hace con las versiones ficticias de los datos de prueba | R | Los datos ficticios no llevan versiones: la única versión en desarrollo y en preproducción es la que registra el despliegue. Las pruebas que necesitan versiones de prueba usan una base desechable. Las versiones hostiles del banco no se registran nunca | | | |
| 11 | Qué commit se registra | D | El commit desplegado, que es el que se puede comprobar en ese momento. Se lleva en la puerta P1; afecta a la 030 | | | |
| 12 | La 015 audita cada registro y el alcance de la auditoría sigue sin decidir en la 010 | R | Queda contestada con el n.º 17 de la 010, cuya recomendación ya incluye auditar el registro de versiones por el despliegue | | | |
| 13 | Reparto con la función 030 | C | Aceptarlo: el registro por despliegue es de la 015 y la 030 remite a ella. Se sigue de «Adelantar registro». Lo aplican coordinación y el chat de la fase 4; la lista de requisitos afectados está en `propuestas.md` | | | |

## Decisiones que salen de aquí

Pendiente de las respuestas. El adelanto del registro a la fase 2 debería quedar en `docs/TECNOLOGIAS.md` (D-007) y en `docs/PLAN.md`; lo anota el chat de coordinación y se le pasa por `propuestas.md` (P-01 y P-02).
