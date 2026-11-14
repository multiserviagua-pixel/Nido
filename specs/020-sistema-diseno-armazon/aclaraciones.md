# 020 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 3. **Respondidas todas el 12/11/2026. Especificación aprobada por el responsable el 12/11/2026 (puerta P0), con la respuesta «Apruebo la 020».** La columna «Recomendación» es del orquestador y no es una decisión.

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`, donde están las opciones completas.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 2 | Nombre y logotipo del menú y de la pestaña | **A.** Logotipo de HumanaIA, entregado por el responsable. **B.** Solo el nombre en texto hasta tener el logotipo. **C.** Un nombre de producto propio. | **B** para no bloquear: «HumanaIA» en texto, con «Agentes de correo» debajo. Cuando entregues el logotipo se sustituye sin tocar la especificación. **Necesito saber qué nombre quieres que se lea** |
| 6 | Quién hace la revisión manual de accesibilidad | Los agentes no pueden usar un lector de pantalla ni un móvil reales. **A.** Una persona del equipo, con una guía de pasos. **B.** Auditoría externa. **C.** A ahora y B antes de publicar. | **A** en la fase 3: tú u otra persona, con una guía escrita, un lector de pantalla y un móvil. La auditoría externa se decide en la fase 6, con la lista de publicación. Sin una persona, CA-026 y CA-035 no se pueden declarar superados (artículo 13) |
| 10 | Qué puede ir en la dirección de la página | **A.** Identificadores internos y valores de listas cerradas (página, orden, periodo, identificador del cliente en su ficha): funcionan el botón de volver y los enlaces. **B.** Nada: cada vista vuelve a su estado inicial al recargar. | **A.** Nunca nombres, correos ni texto de búsqueda (REQ-059). Va unida a la cuestión del artículo 2 (11 de la 022 y 12 de la 023) |
| 12 | Ajuste de los colores iniciales | Algunos colores de `docs/DISENO.md` no llegan al contraste exigido en ciertas combinaciones. **A.** El `disenador-ui` los ajusta sin nueva aprobación, manteniendo el tono y el acento morado. **B.** Cada cambio de color pasa por el responsable. | **A.** La paleta final, con sus diferencias, la ves en la puerta P1 y otra vez en P5; no hace falta una aprobación por color |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 1 | Tema oscuro | Solo tema claro, con el menú oscuro | Una sola verificación de contraste y de la puerta P5. Los valores quedan preparados para añadir un tema oscuro después |
| 3 | Navegadores, lectores de pantalla y móviles | Aceptar la lista propuesta: las dos últimas versiones de Chrome, Edge, Firefox y Safari en escritorio, Safari en iOS y Chrome en Android; NVDA en Windows y VoiceOver en iOS | Fija con qué se prueba CA-035 |
| 4 | Umbrales de rendimiento y de carga lenta | Aceptar los propuestos, medidos en laboratorio: elemento principal en 2,5 segundos, desplazamiento de 0,1, respuesta en 200 milisegundos; aviso a los 10 segundos y error a los 30. Los umbrales con usuarios reales se fijan en la fase 4, con los objetivos de servicio | Son los valores habituales de «bueno» en las métricas web |
| 5 | Muestra de componentes en producción | No: solo en desarrollo y en el entorno previo | Nada de más expuesto en producción |
| 7 | Números de cuatro cifras | Con punto: «1.234» | Es lo que dice `docs/DISENO.md` («miles con punto») y lo que muestra la captura de referencia; alinea mejor en columnas |
| 8 | Abreviatura de septiembre | «sep» | Todas las abreviaturas con tres letras y el mismo ancho |
| 9 | Indicación de la hora de Madrid | Siempre, una vez por vista («Horas en horario de Madrid»). En la hora que se repite en el cambio de octubre, cada hora lleva «hora de verano» u «hora de invierno» | Se puede probar, a diferencia de «cuando haya duda» |
| 11 | Referencia de error para soporte | Sí: una referencia opaca, sin datos internos | Permite encontrar el fallo en los registros cuando alguien lo cuenta |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Tema oscuro | «Sí, y además tema oscuro», a la pregunta de si aceptaba los ocho detalles con valor propuesto | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-088 y CA-057 nuevos: tema claro y tema oscuro según la preferencia del sistema, sin selector manual. Cambia «Fuera de alcance» |
| 2 | Nombre y logotipo | «Crear logotipo: nido de aves con diseño tech» y, después, «se llamara Nido: Agentes de Correo» | Responsable, 12/11/2026, en el chat de la fase 3 (dos mensajes) | REQ-087 y CA-056 nuevos: logotipo propio, creado en la 020, con al menos tres propuestas para elegir, y nombre «Nido: Agentes de Correo» junto al logotipo y en el título de la pestaña |
| 3 | Navegadores y dispositivos | Aceptada la lista propuesta, dentro de la misma respuesta | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-089 nuevo; CA-035 ajustado |
| 4 | Umbrales de rendimiento | Aceptados los propuestos, dentro de la misma respuesta | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-064 y REQ-069 dejan de estar pendientes. Los umbrales de uso real se fijan en la fase 4 |
| 5 | Muestra en producción | Solo fuera de producción, dentro de la misma respuesta | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-061 y CA-046 ajustados |
| 6 | Revisión manual de accesibilidad | «Avisar en este punto» | Responsable, 12/11/2026, en el chat de la fase 3 | REQ-063 modificado: la hace una persona; el orquestador avisa al responsable cuando la muestra esté lista, y el responsable la hace o designa a quien la haga. Hasta entonces, CA-026 y CA-035 figuran como «no ejecutada» |
| 7 | Números de cuatro cifras | «1.234», dentro de la misma respuesta | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-048 y CA-037 ajustados |
| 8 | Abreviatura de septiembre | «sep», dentro de la misma respuesta | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-047 lleva la lista cerrada de los doce meses |
| 9 | Indicación de la hora de Madrid | «Horas en horario de Madrid» en cada vista, dentro de la misma respuesta | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-049 y CA-038 ajustados, con la hora que se repite en octubre |
| 10 | Estado de la vista en la dirección | Identificador de cliente: «Nota aclaratoria (Recomendado)», a la pregunta sobre el artículo 2. Página, orden y periodo: sin respuesta expresa | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 (primera parte) | REQ-059 modificado con la opción A. La parte de página, orden y periodo era propuesta del orquestador: se presentó expresamente en el resumen de la puerta P0 y quedó confirmada con la aprobación del 12/11/2026, igual que exigir 4,5:1 también al texto grande (REQ-029) |
| 11 | Referencia de error | Sí, una referencia opaca, dentro de la misma respuesta | Responsable, 12/11/2026, en el diálogo de preguntas del chat de la fase 3 | REQ-057 y CA-042 ajustados |
| 12 | Ajuste de colores | «Usa skills de diseño disponible o instala nuevas, intenta usar degradados suaves, y un diseño moderno usando los repositos de diseño mas actuales» | Responsable, 12/11/2026, en el chat de la fase 3 | REQ-029 y REQ-030 modificados; REQ-085, REQ-086, CA-054 y CA-055 nuevos; CA-022 ajustado. Lo que se refiere a cómo trabajar (skills y librerías) se aplica en el diseño: ver abajo |

## Cómo se han leído las respuestas del 12/11/2026

Es la lectura del orquestador. Si alguna no es lo que el responsable quiso decir, se corrige.

- **Cuestión 2.** El logotipo lo crea el equipo dentro de la función 020 (`disenador-ui`), en el paso de implementar, no antes: el artículo 5 pide especificación aprobada, diseño y tarea. Las propuestas (tres como mínimo) se presentan al responsable con la propuesta visual de REQ-086. El nombre es «Nido: Agentes de Correo», escrito como lo escribió el responsable. Cómo se reparte entre el menú y el título de la pestaña se decide en la propuesta visual. La 020 solo lo fija para los dashboards: si «Nido» nombra también el conector, la pantalla de activación y los textos legales lo decide coordinación (`propuestas.md`).
- **Cuestión 6.** «Avisar en este punto» se lee como: cuando llegue el momento de la revisión manual, se avisa al responsable. Se aplica también a la decisión sobre la auditoría externa, que es de la fase 6 y se pasa a coordinación.
- **Cuestión 12.** Tres cosas:
  1. El `disenador-ui` puede ajustar la paleta sin una aprobación por color. Se añaden degradados suaves y un aspecto actual. No cambian el contraste exigido, la regla de no depender solo del color, la prohibición de recursos de terceros en tiempo de ejecución ni la de copiar la marca de la captura de referencia. Se mantiene el acento morado de D-004.
  2. Skills de diseño. Las que ya están activas en la sesión cubren el trabajo: `frontend-design`, `design:design-system`, `design:design-critique`, `design:accessibility-review`, `design:ux-copy` y `dataviz`. Los agentes `disenador-ui` e `ingeniero-frontend` no tienen la herramienta para cargar skills: el orquestador carga la skill y les pasa la guía en el encargo, hasta que coordinación decida si se les da acceso (`propuestas.md`).
  3. «Repositorios de diseño más actuales» se lee como: librerías y sistemas de diseño abiertos, actuales y mantenidos. Es un criterio para V-110, que sigue en VERIFICAR: se comprueba con la skill `verificar-decision` en el diseño, con prueba de accesibilidad, antes de añadir ninguna dependencia.

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`. Este chat no edita el registro de decisiones: se pasan a coordinación por `propuestas.md`, que les asigna identificador.

| Decisión | Estado propuesto | Evidencia |
| --- | --- | --- |
| Logotipo propio de los dashboards: un nido de aves con estética tecnológica | CONFIRMADO | Respuesta del responsable a la cuestión 2, 12/11/2026 |
| Nombre que muestran los dashboards: «Nido: Agentes de Correo» | CONFIRMADO para los dashboards; alcance en el resto del producto, por decidir | Respuesta del responsable a la cuestión 2, 12/11/2026 |
| Dirección visual: aspecto actual, con degradados suaves; el `disenador-ui` ajusta la paleta para cumplir el contraste. Precisa D-004 | CONFIRMADO | Respuesta del responsable a la cuestión 12, 12/11/2026 |
| La revisión manual de accesibilidad la hace una persona, con aviso al responsable cuando toque | CONFIRMADO | Respuesta del responsable a la cuestión 6, 12/11/2026 |
| Tema claro y tema oscuro, según la preferencia del sistema | CONFIRMADO | Respuesta del responsable a la cuestión 1, 12/11/2026 |
| Nota aclaratoria del artículo 2: en el dashboard de superadmin el identificador del cliente elige sobre quién se actúa; el permiso sale siempre de la sesión | Aprobada por el responsable; es una enmienda de la constitución y la aplica coordinación, con fecha y versión | Respuesta del responsable a la pregunta sobre el artículo 2, 12/11/2026 |
| V-110: elegir entre proyectos abiertos actuales y mantenidos | Sigue en VERIFICAR, con este criterio | Respuesta del responsable a la cuestión 12, 12/11/2026 |

## Decisiones del responsable sobre el diseño (antes de la puerta P1)

Asuntos abiertos del diseño y del dictamen de seguridad. Preguntados por el orquestador en el diálogo de preguntas del chat de la fase 3 el 13/11/2026.

| Asunto | Respuesta literal | Quién y cuándo | Efecto |
| --- | --- | --- | --- |
| A-10 · Título de la pestaña (MAYOR 6 del dictamen) | «Solo el tipo de vista (Recomendado)» | Responsable, 13/11/2026 | El título y el encabezado principal solo nombran el tipo de vista, sin nombres de clientes. Es lo que ya dice el diseño: deja de estar pendiente |
| A-11 · Primera descarga de los navegadores de prueba | «Sí, lo acepto (Recomendado)» | Responsable, 13/11/2026 | Riesgo aceptado por escrito: la primera descarga no se contrasta con una huella publicada; se anota la huella y la batería falla si cambia |
| A-12 · Archivos que deciden qué se comprueba | «Sí, inventario al final (Recomendado)» | Responsable, 13/11/2026 | Los cinco archivos pasan a necesitar firma. El inventario de la muestra pasa a reservado cuando estén hechos todos los componentes. Lo tiene que aplicar la función 002 |
| A-3 · Muestra de componentes en preproducción | «Pública en preproducción (Recomendado)» | Responsable, 13/11/2026 | La muestra es pública en preproducción, sin datos, y no existe en producción |
| Boceto de la página Resumen | «Sí, sigue así» | Responsable, 13/11/2026 | Orientación para la propuesta visual. No sustituye a la validación de REQ-086 |
| Puerta P1 | «Apruebo diseño y plan» | Responsable, 13/11/2026 | La 020 pasa a PLANIFICADA. No se implementa hasta que exista la app de la fase 1 |
| A-7 · Arrancar la 020 sin esperar a la fase 2 | «Sí, sin esperar a la fase 2 (Recomendado)» | Responsable, 13/11/2026 | La 020 puede implementarse en cuanto exista la app de la fase 1. Las funciones 021 a 024 siguen esperando a las migraciones de la fase 2. El cambio en `docs/PLAN.md` lo hace coordinación |
