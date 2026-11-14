# 033 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

Presentadas al responsable el 12/11/2026 por el orquestador de la fase 4. **Ninguna tiene respuesta todavía.** La columna «Recomendación» es del orquestador y no es una decisión.

## Cuestión previa, añadida por el orquestador

| N.º | Cuestión | Por qué importa | Recomendación del orquestador |
| --- | --- | --- | --- |
| 0 | **Cuántas personas de HumanaIA participan** (superadmin, quien instala, quien compara, quien revisa) | Varios requisitos piden «una persona distinta»: comprobar los límites del agente tras instalar (REQ-011), revisar cada comparación (REQ-028) y revisar el informe final (REQ-042). También condiciona quién publica en `estable` (cuestión 3 de la 030). Con una sola persona no se pueden cumplir tal como están | Si hay dos o más personas, se dejan como están. Si solo hay una, esas revisiones se sustituyen por una segunda pasada de la misma persona otro día con lista de comprobación, y se anota como riesgo aceptado por el responsable. No lo decide el orquestador |

## Opciones y recomendación

Los números son los de «Cuestiones abiertas» de `especificacion.md`.

### Decisiones de más peso

| N.º | Cuestión | Opciones y consecuencia | Recomendación del orquestador |
| --- | --- | --- | --- |
| 1 | Qué cliente es el piloto y con qué criterios | Lo elige el responsable. En el repositorio solo figura un alias; el nombre no se escribe en ningún archivo | Criterios añadidos a los de REQ-008: asistente con resultado «sí» en la fase 1; revisión diaria; archivos de salud en al menos el 90 % de las revisiones de los últimos 14 días; volumen de correo medio; sin datos especialmente sensibles (ni despachos de abogados ni sanidad); trato cercano con quien lo instaló. Alias propuesto: «cliente piloto A» |
| 2 | Ensayo previo | **A.** Ensayo completo con una cuenta propia de HumanaIA durante 7 días antes de tocar al cliente. **B.** Solo la prueba de vuelta atrás y los escenarios: más rápido, pero los fallos del procedimiento se descubrirían con el cliente real | **A** |
| 3 | Duración y umbrales | **A.** 14 días y al menos 14 revisiones desatendidas; 100 % de coincidencia en los campos comparados; ninguna revisión sin pareja sin explicar; una prórroga de otros 14 días si la causa del fallo se corrige con una versión nueva. **B.** 7 días: menos datos. **C.** 30 días: da además un mes de disponibilidad medida, y retrasa el cierre de la fase | **A**. Las dos salidas las produce la misma revisión, así que cualquier diferencia es un defecto, no ruido. Se informa al responsable si en un periodo la coincidencia baja del 95 % |
| 4 | Quién compara, cada cuánto y dónde | **A.** Una persona con los dos lados a la vista (el informe en el panel y el archivo de salud en la carpeta compartida) anota por cada campo solo «coincide» o «difiere»; otra persona lo revisa. Nada sale de producción y nada del archivo entra en el sistema. **B.** Una pantalla del panel donde se teclean las cifras del archivo de salud y el sistema compara: menos errores de mano, pero es desarrollo para un uso temporal y mete esas cifras en el sistema | **A** para el piloto. A diario la primera semana y cada 3 días después; discrepancias revisadas en 2 días laborables; ningún periodo más de 7 días sin comparar. Si la fase 6 decide migrar así a muchos clientes, se valora entonces la opción B |
| 6 y 7 | Versión de paralelo, canal y órdenes | **A.** Una versión posterior a la 1.3, hecha en la fase 4, que añade una sola cosa: «si existe la carpeta `panel`, deja además el archivo de salud». Solo escribe; no obedece archivos `orden_…`. Las órdenes van solo por el panel superadmin. Pasa por `prueba` (con la cuenta propia del ensayo) y se promueve a `estable` como cualquier versión; el cliente piloto está en `estable`. Todas las versiones conservan ese apartado hasta que la fase 6 retire la carpeta. **B.** La propia 1.3 escribe en las dos vías: ahorra una versión, pero cambia lo que la fase 2 ya ha especificado. **C.** Congelar el canal `prueba` con una versión solo para el piloto: bloquea las pruebas de otras versiones | **A**. Respeta la regla de la función 012 (ningún archivo de la nube cambia las instrucciones), no exige nada nuevo a la 030 y sirve después para la migración. Es la misma pregunta que la cuestión 24 de la 012: una sola respuesta |
| 8 | Datos reales antes de B-003 | **A.** Una decisión nueva en el registro, acotada a este piloto (un cliente, un periodo máximo), que no desbloquea B-003. **B.** Hacer el piloto solo con una cuenta propia de HumanaIA y dejar el cliente real para la fase 6: sin datos de terceros, pero el criterio del plan no se cumpliría con un cliente. **C.** Mover el piloto a la fase 6 | **A**, exigiendo antes: doble factor en todos los superadmin; pruebas de aislamiento en verde sobre el commit desplegado; secretos distintos por entorno; escáneres sin hallazgos altos ni críticos; revisión de privacidad de registros y errores; acuerdos de encargo con los proveedores archivados; vuelta atrás de despliegue y de migración probada; copias diarias activas. Si hace falta un encargo de tratamiento con el cliente es una cuestión legal: conviene consultarla con quien asesore a HumanaIA en protección de datos (la función 052 de la fase 6 la trata) |

### Decisiones menores (se pueden aceptar en bloque)

| N.º | Cuestión | Recomendación del orquestador | Consecuencia |
| --- | --- | --- | --- |
| 5 | Cómo se compara `problemas` | Solo si hay problemas y cuántos. Las frases no se copian a ningún sitio | No cambia lo que lee hoy quien instaló el agente |
| 9 | Información y conformidad del cliente | Un texto de una página, sin datos de ningún cliente, en el repositorio; la conformidad, firmada o por correo, la guarda el responsable fuera del repositorio | — |
| 10 | El cliente piloto al terminar | Si el piloto se supera, sigue con el conector y en paralelo hasta que la fase 6 retire la carpeta `panel`. Si no, vuelve a solo carpeta `panel` | No se instala dos veces |
| 11 | Objetivos de servicio | Los fija el responsable al cerrar la fase, con los datos del ensayo y del piloto, una comprobación de disponibilidad independiente del agente y cuentas propias para lo que no se pueda medir sin cortar el servicio al cliente. Se miden también `enviar_informe` y `confirmar_orden`. Si no hay 30 días de datos, la disponibilidad sigue PROPUESTA | — |
| 12 | Archivo de salud sin instrucciones válidas | No se escribe: sin instrucciones válidas el agente no toca la nube. Esas revisiones se clasifican «sin salida esperada por el estado» | El cierre en fallo no se relaja. El fallo se ve por las alertas del sistema nuevo |
| 13 | Emparejamiento | Por hora: la del archivo de salud frente a la de recepción del informe, con 30 minutos de tolerancia, uno a uno | — |
| 14 | Revisiones en conversación | Entran en la comparación, desglosadas por modo; el umbral se mide sobre las desatendidas | — |
| 15 | Cifras en las evidencias | Solo «coincide» o «difiere» por campo y los totales. Ni valores ni diferencias ni fechas: solo el número de orden de la revisión | Cumple `docs/CALIDAD.md` |
| 16 | Datos del piloto al terminar | Se conservan en producción como los de cualquier cliente hasta que la fase 6 fije plazos. Si el cliente deja el piloto, sus cifras se borran en 30 días y quedan solo los resultados sin cifras | — |
| 17 | Vuelta atrás | Las conexiones se revocan en el momento, desde el panel. El resto, en 2 días laborables, por quien instala y con el cliente. La licencia queda suspendida, no revocada | Volver a entrar es sencillo |
| 18 | `frecuencia_horas` | Se compara, pero no cuenta para el umbral si la diferencia viene de que el agente no conocía la frecuencia | Depende de la cuestión 6 de la 012 |
| 19 | Cliente de control en producción | Sí: la cuenta propia del ensayo, como segundo cliente | El aislamiento se prueba con dos clientes en el mismo entorno |
| 20 | Parada | Aviso al responsable en 1 hora, por el mismo canal que las alertas críticas. Solo el responsable reanuda | — |
| 21 | Tabla de equivalencias | Sin distinguir mayúsculas: «Claude» es `claude`; «ChatGPT», `chatgpt`; «Drive» o «Google Drive», `drive`; «OneDrive», `onedrive`; «Dropbox», `dropbox`. Cualquier otro valor, «no comparable» | — |
| 22 | Asistente con condiciones | No: el piloto usa un asistente con resultado «sí» | Una variable menos en la primera prueba con un cliente real |
| 23 | Relación con la fase 6 | Sí: la versión de paralelo, la comparación y la vuelta atrás deben servir para la migración | Justifica la opción A de las cuestiones 6 y 7 |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 0 | Personas que participan | Sin respuesta | — | Pendiente (REQ-011, REQ-028, REQ-042) |
| 1 | Cliente piloto y criterios | Sin respuesta | — | Pendiente (REQ-008, REQ-009) |
| 2 | Ensayo previo | Sin respuesta | — | Pendiente (REQ-007) |
| 3 | Duración y umbrales | Sin respuesta | — | Pendiente (REQ-040, CA-010) |
| 4 | Quién compara, cada cuánto y dónde | Sin respuesta | — | Pendiente (REQ-027, REQ-028, REQ-068) |
| 5 | Cómo se compara `problemas` | Sin respuesta | — | Pendiente (REQ-024) |
| 6 | Versión de paralelo y canal | Sin respuesta | — | Pendiente (REQ-014 a REQ-018, REQ-062) |
| 7 | Vía de órdenes | Sin respuesta | — | Pendiente (REQ-019, REQ-020, REQ-060) |
| 8 | Datos reales antes de B-003 | Sin respuesta | — | Pendiente (REQ-004, CA-002) |
| 9 | Información y conformidad | Sin respuesta | — | Pendiente (REQ-005) |
| 10 | El cliente piloto al terminar | Sin respuesta | — | Pendiente (REQ-044) |
| 11 | Objetivos de servicio | Sin respuesta | — | Pendiente (REQ-048 a REQ-050) |
| 12 | Archivo de salud sin instrucciones válidas | Sin respuesta | — | Pendiente (REQ-053, REQ-054) |
| 13 | Emparejamiento | Sin respuesta | — | Pendiente (REQ-022) |
| 14 | Revisiones en conversación | Sin respuesta | — | Pendiente (REQ-029) |
| 15 | Cifras en las evidencias | Sin respuesta | — | Pendiente (REQ-034) |
| 16 | Datos del piloto al terminar | Sin respuesta | — | Pendiente (REQ-047) |
| 17 | Vuelta atrás | Sin respuesta | — | Pendiente (REQ-045, REQ-064) |
| 18 | `frecuencia_horas` | Sin respuesta | — | Pendiente (REQ-023) |
| 19 | Cliente de control en producción | Sin respuesta | — | Pendiente (CA-020) |
| 20 | Parada | Sin respuesta | — | Pendiente (REQ-039) |
| 21 | Tabla de equivalencias | Sin respuesta | — | Pendiente (REQ-023) |
| 22 | Asistente con condiciones | Sin respuesta | — | Pendiente (REQ-003) |
| 23 | Relación con la fase 6 | Sin respuesta | — | Pendiente |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Ninguna todavía. Si el responsable elige la opción A de la cuestión 8, hace falta una decisión nueva sobre el piloto con datos reales, que anota el chat de coordinación.
