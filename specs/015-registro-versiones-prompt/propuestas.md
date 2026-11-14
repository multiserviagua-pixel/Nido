# 015 · Propuestas para coordinación y otras fases

Cambios que esta función necesitaría en documentos compartidos y en especificaciones de otras funciones. El chat de la fase 2 no los edita: los anota aquí. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: `especificador`, para el orquestador de la fase 2.

## 1. Reparto con la función 030 (fase 4)

Los números son los de los requisitos y criterios de `specs/030-versiones-prompt-y-canales/especificacion.md`. «Cubierto» quiere decir que la 015 ya lo exige con la misma regla y la 030 puede remitir a ella; «parcial», que la 015 cubre una parte y la otra sigue en la fase 4. Depende de la cuestión abierta 13 de la 015.

### Requisitos de la 030 que pasarían a estar cubiertos por la 015

| Requisito de la 030 | Qué dice | En la 015 | Observación |
| --- | --- | --- | --- |
| 1 | Cada despliegue a producción registra las versiones nuevas con número, texto, huella, commit y fecha | Cubierto (requisitos 1 y 4 a 6) | La 015 lo extiende a cada entorno que fije su cuestión 1, cada uno en su propia base. La 030 debería dejar de decir «solo producción» o remitir a la 015 |
| 2 | Número único; formato según su cuestión 14 | Cubierto (requisito 3, más la unicidad de la 010) | Misma pregunta de formato: cuestión 6 de la 015 y 14 de la 030. Conviene una sola respuesta |
| 3 | Huella del texto exacto, igual a la del archivo en el commit registrado | Cubierto (requisitos 4 a 6) | Qué commit se registra queda en la cuestión 11 de la 015 |
| 4 | Registrar es repetible sin efectos | Cubierto (requisito 8) | — |
| 5 | Solo el despliegue registra | Cubierto (requisitos 14 y 15) | — |
| 6 | La identidad del despliegue solo añade versiones | Cubierto (requisitos 17 y 18) | La 015 le deja además consultar número y huella de lo registrado, que necesita para comprobar. Sujeto a la cuestión 3 de la 015 |
| 40 | Archivo de una versión registrada cambiado o número repetido con otro texto | Cubierto salvo «se ve en el panel» (requisitos 36 y 37) | En la fase 2 la discrepancia queda en el resultado del despliegue y en la anotación; la vista en el panel sigue en la fase 4 |
| 41 | Archivo de una versión registrada desaparecido | Cubierto salvo «se ve en el panel» (requisito 38) | Igual que el anterior. Ver la cuestión 7 de la 015 |
| 42 | Despliegue de vista previa o de rama no principal no registra en producción | Cubierto (requisitos 16, 34 y 47) | — |
| Criterios 1 a 4, 27 y 28 | Pruebas de los anteriores | Cubiertos por los criterios 1, 6, 8, 9, 10, 14, 15, 16 y 17 de la 015 | — |

### Requisitos de la 030 cubiertos en parte

| Requisito de la 030 | Parte cubierta por la 015 | Parte que sigue en la fase 4 |
| --- | --- | --- |
| 7 (comprobación de coincidencia) | En cada despliegue: texto guardado frente a huella y archivo del repositorio frente a huella (requisito 11); si falla, el despliegue no se da por bueno | Ejecución periódica, anotación por versión con fecha y vista en el panel |
| 8 y 39 (inmutabilidad con cualquier papel) | Por la vía del registro y con la identidad del despliegue (requisitos 18 y 45). Para los demás papeles, la función 010 | Lo que añada la fase 4 sobre el panel |
| 27 (auditoría) | El registro de cada versión (requisito 25) | Comprobación de coincidencia, publicaciones, vuelta atrás, cambios de canal y avisos |
| 28 (intentos rechazados) | Los intentos de registro que llegan a la base de datos (requisito 26) | Publicar, volver atrás y cambiar canal |
| 35 (transición) | La 1.3 ya queda en el registro, registrada por el despliegue, y su paso a vigente queda en el historial (requisitos 21 y 22) | Comprobar que poner en marcha la 030 no cambia lo que recibe ningún agente. El requisito se simplifica: ya no hay que «incorporar» la 1.3 al registro |
| 36 (reversibilidad) | Volver a servir un despliegue anterior y migraciones de la 015 (requisitos 31 y 32) | Los cambios de datos de la 030 |
| 38 (secretos) | Credencial del despliegue (requisito 20) | Credenciales del aviso |
| 43 (discrepancia en la comprobación) | Detectada en cada despliegue; esa versión no se puede hacer vigente (requisito 39) | Qué se hace si la versión ya es vigente (cuestión 11 de la 030) |
| 47 y 57 (publicar algo no registrado o con texto y huella aportados) | La misma regla para el procedimiento provisional de la fase 2 (requisito 48) | Para la publicación desde el panel |
| 60 (comprobación que no se puede ejecutar) | En el despliegue, cualquier fallo de comprobación hace fallar el despliegue (requisito 10) | Comprobación periódica |

### Requisitos de la 030 que siguen enteros en la fase 4

9 (el panel no edita), 10 (historial de solo adición, aunque el procedimiento provisional de la 015 ya escribe en él), 11 a 15 (canales y entrega por canal), 16 a 21 (publicación, permanencia, autorización, vuelta atrás e historial), 22 a 26 (aviso), 29 (quién lee), 30 a 34 (pantalla), 37 (privacidad de lo que guarda la 030), 44 a 46, 48 a 56, 58 y 59.

### Cambios que convendría hacer en la 030

| Dónde | Cambio | Motivo |
| --- | --- | --- |
| «Quién la usa y cómo», primer punto; requisitos 1 a 6; casos 40 a 42; criterios 1 a 4, 27 y 28 | Remitir a la función 015 en lugar de repetir la regla, o mantenerlos como comprobación de que la fase 4 no la rompe | Evitar dos especificaciones de lo mismo que puedan divergir |
| Requisito 1 | Quitar «a producción» o decir que cada entorno registra en su base según la 015 | La 015 registra en los entornos que fije su cuestión 1 |
| Requisito 35 y «Supuestos sobre otras fases» | Decir que la 1.3 llega ya registrada por la 015 y hecha vigente por su procedimiento provisional, con su entrada en el historial | Era un supuesto de la 030 («la fase 2 la pone en servicio por su cuenta») |
| Requisitos 17 y 46 | Prever cómo se trata la 1.3 si en la fase 2 se hace vigente directamente en `estable` sin pasar por `prueba` | Depende de la cuestión 2 de la 015; si no se prevé, la 030 consideraría irregular el estado de partida |
| Requisito 7 | Decir que la parte «en cada despliegue» ya la hace la 015 y que la 030 añade la periódica y la vista | Reparto |

## 2. Documentos compartidos (chat de coordinación)

| N.º | Documento | Cambio propuesto | Motivo |
| --- | --- | --- | --- |
| P-01 | `docs/PLAN.md`, fases 2 y 4 | Fase 2, «Entrega»: añadir «Registro mínimo de versiones del prompt por despliegue (función 015)». Fase 4, «Entrega»: cambiar «Registro de versiones del prompt desde el despliegue, inmutables y con huella» por «Comprobación periódica de las versiones registradas y su vista en el panel; el registro por despliegue llega en la fase 2». Línea de seguimiento de la fase 2: «010 a 015» | Respuesta del responsable del 12/11/2026 a la cuestión 11 de la 011. Es la misma propuesta que la P-15 de la 011, con el detalle del reparto |
| P-02 | `docs/TECNOLOGIAS.md`, D-007 | Próxima acción: «Registro por despliegue en la fase 2 (función 015); publicación por canal en la fase 4» | Hoy dice «Fase 4» |
| P-03 | `docs/ESQUELETO.md`, convención «Clave secreta» | Quitar «registro de versiones en el despliegue» de los usos de la clave secreta y decir que el despliegue registra con una identidad propia que solo añade versiones | Choca con el requisito 6 de la 030 y los requisitos 17 y 18 de la 015 (artículo 3, mínimo privilegio). Depende de la cuestión 3 de la 015 |
| P-04 | `docs/adr/0003-aislamiento-por-cliente.md`, punto 5 | Mismo cambio que P-03, o anotar el registro de versiones como excepción aceptada si el responsable elige la clave secreta | Mismo motivo |
| P-05 | `docs/adr/0005-prompt-por-despliegue.md` | Anotar que el registro llega en la fase 2 y, si la cuestión 2 de la 015 elige una vía distinta del panel para hacer vigente una versión, recogerla como transición o cambiar el punto 3 | Hoy el ADR solo prevé que publique el panel |
| P-06 | `docs/MODELO-DATOS.sql` | (a) Rol propio del despliegue con solo inserción en `versiones_prompt` y lectura de `version` y `huella_sha256`, sin ningún otro permiso. (b) Auditoría de cada inserción en `versiones_prompt`, con un actor que identifique al despliegue: hoy no hay disparador de auditoría en esa tabla y `auth.uid()` sería nulo. (c) `commit_sha` con exactamente 40 caracteres, no de 7 a 40. (d) Rechazo en la base de datos de una huella que no corresponda al texto (cuestión 15 de la 010 y P-02 de la 011). (e) Expresión regular de `version` según la cuestión 6 de la 015, sin ceros a la izquierda. (f) La columna `notas` de texto libre no la usa la 015: decidir si se mantiene | Requisitos 3, 6, 17, 18, 25 y 39 de la 015 |
| P-07 | `docs/SEGURIDAD.md`, A-12 | Columna de fase: «Fase 2 (registro) y fase 4 (publicación)». Añadir como amenaza la credencial del despliegue filtrada, mitigada por el mínimo privilegio y porque registrar no hace vigente | Reparto nuevo y requisito 9 de la 015 |
| P-08 | `docs/ARQUITECTURA.md`, flujo 3 | Indicar que, hasta la fase 4, los pasos 3 a 5 se sustituyen por el procedimiento provisional que fije la cuestión 2 de la 015. Unificar «previo» y «preproducción» | La función 002 usa «preproducción» |
| P-09 | `.claude/skills/version-prompt/SKILL.md`, «Registrar» | Describir las comprobaciones del despliegue (nombre válido, archivo registrado inmutable en el repositorio, contenido rechazado, dictamen sobre la huella exacta) y alinear el formato del número con la respuesta a la cuestión 6 | La skill dice `mayor.menor` y el modelo y el contrato admiten un tercer número |
| P-10 | `.claude/rules/prompts.md` | Añadir «Un archivo de versión registrada no se modifica, no se renombra ni se borra del repositorio», si la cuestión 7 de la 015 elige la opción (a) | Requisitos 36 y 38 de la 015: cualquiera de esas acciones hace fallar todos los despliegues siguientes |

## 3. Especificaciones de otras funciones

| N.º | Función | Asunto | Motivo |
| --- | --- | --- | --- |
| P-11 | 002 (fase 1) | Si la cuestión 8 de la 015 se responde «sí», añadir `prompts/agente-ia/` a los cambios reservados de su requisito 19. Su vuelta atrás (requisito 38) no debe volver a ejecutar el registro. Su comprobación posterior al despliegue (requisito 33) debería incluir el resultado del registro | Requisitos 13, 29 y 31 de la 015 |
| P-12 | 010 (fase 2) | Sus cuestiones 15 (huella frente a texto), 16 (producción en la fase 2) y 17 (alcance de la auditoría) condicionan las cuestiones 1 y 12 de la 015. Sus datos ficticios (requisito 3) no deberían contener versiones del prompt, salvo lo que fije la cuestión 10 de la 015. Su «Fuera de alcance» dice que el registro es de la fase 4: debería remitir a la 015 | Coherencia dentro de la fase 2 |
| P-13 | 012 (fase 2) | Sus cuestiones 7 (1.2), 21 (versiones hostiles para el banco) y su requisito 22 (versión propia del arranque) se relacionan con las cuestiones 4, 5, 9 y 10 de la 015. Su requisito 35 dice que el banco va «antes de registrar», pero el banco necesita que el conector sirva la versión, y el conector solo sirve versiones registradas | Hay un orden circular entre banco y registro que resuelve la cuestión 9 de la 015 |
| P-14 | 011 (fase 2) | Sin cambios. Ya remite a la 015 en «Fuera de alcance». Su cuestión 12 (canal `prueba` sin publicación) afecta a qué reciben los agentes de `prueba` si la 1.3 solo se hace vigente en `estable` | Cuestión 2 de la 015 |

## 4. Contradicciones detectadas

1. **Identidad del despliegue.** `docs/ESQUELETO.md` y el ADR-0003 (punto 5) reservan la clave secreta para «registro de versiones en el despliegue»; el requisito 6 de la 030 pide una identidad que solo añada versiones. La clave secreta puede leer datos de todos los clientes y registrar cualquier texto con cualquier huella. Cuestión 3 de la 015; P-03 y P-04.
2. **Producción en la fase 2.** El responsable eligió adelantar el registro para servir la 1.3 real, y la opción descartada se describía como «en producción no hay nada que servir»; pero la recomendación, aún sin respuesta, de la cuestión 16 de la 010 es no aplicar nada en producción en la fase 2, y el requisito 1 de la 030 solo registra en producción. Cuestión 1 de la 015.
3. **«Rama principal protegida».** La función 003 está aplazada («todo local»); la 002 integra sin aprobación humana por cambio y no incluye `prompts/` entre los cambios reservados. El ADR-0005 exige revisión del `revisor` y del `auditor-seguridad`; la 002 exige un agente revisor distinto del autor. Cuestión 8 y requisito 13 de la 015.
4. **Permanencia en `prueba`.** Los requisitos 17 y 46 de la 030 impiden que una versión llegue a `estable` sin pasar por `prueba`; en la fase 2 la 1.3 tendría que hacerse vigente sin panel y probablemente en `estable`. El requisito 35 de la 030 lo da por hecho sin resolver el choque. Cuestión 2 de la 015.
5. **Datos ficticios con versiones.** Si los datos ficticios de la 010 insertan versiones directamente, contradicen «solo el despliegue registra», pueden ocupar el número 1.3 y harían fallar todos los despliegues porque no tienen archivo en el repositorio. Cuestión 10 de la 015.
6. **Vuelta atrás del código frente a archivos registrados.** Si la vuelta atrás de un despliegue se hace revirtiendo el commit en la rama principal, el archivo de una versión ya registrada desaparece y todos los despliegues siguientes fallan. La 015 exige que volver a servir el despliegue anterior funcione sin bloqueo (requisito 31). Cuestión 7 de la 015.
7. **Formato del número.** La skill `version-prompt` dice `mayor.menor`; el modelo de referencia y los contratos admiten un tercer número. Cuestión 6 de la 015 y 14 de la 030.
8. **Banco antes del registro.** El requisito 35 de la 012 y `.claude/rules/prompts.md` piden la prueba en una cuenta de HumanaIA antes de registrar, pero el conector solo sirve versiones registradas. Cuestión 9 de la 015; P-13.
