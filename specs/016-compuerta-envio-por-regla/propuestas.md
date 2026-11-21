# 016 · Propuestas para coordinación y otras fases

Cambios que esta función necesitaría en documentos compartidos y en otras funciones. El carril B2 no los edita: los anota aquí. Ninguno está aplicado.

Fecha: 21/11/2026 · Autor: `especificador`, para el orquestador del carril B2. Reescrito con el artículo 8 en la versión 1.4 (D-038) y los dos dictámenes del `auditor-seguridad` de `docs/propuesta-enmienda-articulo-8-v14.md`. Sustituye a la versión del 20/11/2026 (1.3): desaparecen las reglas de remitente, el rodaje y las cuatro cuestiones, ya respondidas. La numeración de requisitos de la 016 ha cambiado: lo que otros documentos citan como «REQ-019 de la 016» es ahora REQ-018. Actualizado el 21/11/2026 con el dictamen 1 del `auditor-seguridad` sobre la especificación (`dictamen-especificacion-1.md`).

## 1. Función 017: vía protegida del dueño (antes «reglas e interfaz del dueño»)

Ya no crea reglas. Se propone, sin escribir:

- **Activar y desactivar** la compuerta con una sola acción. Ninguna otra vía activa nada (REQ-018 de la 016).
- **Exclusiones del dueño**: añadir y retirar direcciones o dominios. Fuera del alcance del agente (condición del auditor). Retirar una exclusión solo desde aquí.
- **Ajuste del filtro**: solo en esta configuración, con el dueño autenticado, protección contra peticiones falsificadas y sin enlaces con parámetros. Aviso del riesgo accesible y confirmado de forma expresa. Apagar y encender quedan en el historial; encender tiene efecto inmediato (segundo dictamen).
- **Aviso del riesgo al activar la compuerta y al apagar el filtro**: debe explicar que responder a mano a un desconocido lo convierte en contacto previo, y que un correo posterior de esa persona con instrucciones ocultas puede salir respondido solo (riesgo residual de la 016; hallazgo 9 del dictamen 1).
- **Topes**: bajarlos, y volver a subirlos solo hasta el máximo del código.
- **Cancelar una espera** desde el aviso, sin que el aviso lleve un enlace que cancele por sí solo: el enlace lleva a la vía protegida y allí el dueño confirma.
- **Historial y resumen**: consulta en español, con sus motivos.
- **Instalación, reinstalación y actualización** fijadas a una versión; el filtro vuelve a activo y la compuerta no se activa sin el dueño. Si una actualización no conserva exclusiones, topes, contadores, marcas de hilo y registro de envíos, la compuerta queda desactivada y la vía protegida se lo dice al dueño (REQ-014 de la 016).
- Accesibilidad y estados de error (artículo 10).

La 016 no se puede activar para ningún cliente hasta que la 017 esté cerrada.

## 2. Función 018: aprendizaje (antes «aprendizaje de reglas»)

- Aprende de los 100 últimos correos enviados y recibidos, en la cuenta del cliente. Nada de contenido llega a HumanaIA (artículo 1).
- Solo produce estilo. No crea contactos previos, no retira exclusiones, no cambia topes ni filtro y no autoriza envíos (condición del auditor).
- Lleva una batería de envenenamiento: correos preparados para que el estilo aprendido incluya enlaces, datos o compromisos, con resultado de 0 envíos que el filtro rechace y 0 cambios en el estado de la compuerta.
- El paso 7 del prompt (aprendizaje de lo que el dueño corrige) no cambia.

## 3. Cifra de envíos y canal del interruptor

El interruptor (decidido por la coordinación, D-036) obliga a que la compuerta hable con HumanaIA con una credencial propia. Con eso, el coste principal de la antigua vía B ya existe.

| Vía | Cómo llega la cifra | Coste y riesgo |
| --- | --- | --- |
| A. El agente la lee | El agente la pone en su informe con un entero nuevo en `contratos/informe.schema.json` | El agente tiene que poder leerla sin cambiar nada (REQ-013). Un correo que lo engañe puede falsearla, pero solo es un número |
| B. La compuerta la manda | En el mismo canal que la consulta del interruptor | Sin frontera añadida a la del interruptor. La cifra no depende del agente. La consulta sigue sin llevar datos del correo |

Recomendación para el diseño: valorar la B. Las dos vías son ruta crítica con `revisor` y `auditor-seguridad`. En ambas, los registros de ejecución se quedan en la cuenta del cliente (REQ-015).

## 4. Documentos compartidos (chat de coordinación)

| N.º | Documento | Cambio propuesto | Motivo |
| --- | --- | --- | --- |
| P-01 | `docs/PLAN.md`, fase 2 | Reescribir el bloque del envío con la 1.4 (D-038): 016 «Compuerta de envío sin revisión» (contacto previo, exclusiones, filtro desactivable solo por el dueño, espera de 15 minutos, topes, resumen diario, interruptor); 017 «Vía protegida del dueño»; 018 «Aprendizaje de estilo con los 100 últimos correos». Quitar «rodaje», «reglas» y «REQ-019 de la 016». Criterio de aceptación: «Las baterías de la 016 y la 012 terminan con cero envíos a quien el dueño no ha escrito antes, cero envíos con el filtro apagado fuera de la vía del dueño y cero envíos cancelados o desactivados durante la espera» | El plan sigue con la 1.3 |
| P-02 | `docs/TECNOLOGIAS.md` | Filas VERIFICAR para Gmail y para Outlook: leer el resultado de autenticación que añade el proveedor; buscar en enviados distinguiendo lo escrito por el dueño de lo importado, insertado o etiquetado y de lo que la cuenta genera sola (baja de lista con `mailto:`, aceptación de convocatorias, acuses de lectura, envíos de otras aplicaciones conectadas); guardar estado, ajuste del filtro y resumen fuera del alcance de los conectores del agente; dejar el aviso de la espera fuera de su alcance o, si no se puede, detectar cualquier alteración que no haga el dueño (archivar, borrar, mover, marcar, etiquetar); cómo llegan las direcciones con caracteres no ASCII (internacionalizadas, codificadas) para compararlas sin conversiones Unicode; contadores y marcas de hilo con ejecuciones simultáneas; conservar el estado al actualizar; enviar sin permisos amplios; si los conectores del agente pueden editar borradores o lo instalado; canal y credencial del interruptor | Sin ellas no se puede diseñar (dictámenes, «Sin comprobar»; dictamen 1, hallazgos 1, 3, 4, 5 y 11) |
| P-03 | `docs/SEGURIDAD.md`, amenazas | Añadir: contacto previo suplantado (nombre visible, homógrafos, «+», dominio parecido, autenticación falsa en el correo); contacto previo fabricado (mensaje insertado en enviados, envíos de la compuerta, baja de lista con `mailto:` del atacante, convocatoria aceptada, acuse de lectura, otra aplicación conectada); contacto previo ganado con una consulta inocente que el dueño responde a mano; desconocido con dominio propio autenticado que pide datos de otros correos; servidor comprometido (prompt que marca todo, interruptor que responde mal); filtro apagado sin el dueño (agente, servidor, enlace preparado) o evadido (separadores, ancho completo, números en letra, «arroba»); espera acortada o cancelada por el agente, o aviso archivado o reetiquetado por una inyección; resumen ocultado o alterado; topes superados con ejecuciones simultáneas; actualización que pierde exclusiones, topes o marcas de hilo; aprendizaje envenenado (018); compuerta saltada, activada o actualizada desde fuera; bucle con sistemas automáticos | REQ-002, REQ-006 a REQ-011, REQ-014, REQ-018, REQ-020 a REQ-022 de la 016 |
| P-04 | `docs/SEGURIDAD.md`, «Rutas críticas» | Añadir «Compuerta de envío, sus exclusiones, su filtro, su instalación y el interruptor» | Único camino de envío sin revisión (artículo 8) |
| P-05 | `docs/ARQUITECTURA.md` | Añadir la compuerta como pieza en la cuenta del cliente, fuera de la sesión del asistente, con su «No hace»: no usa modelos, solo responde al remitente autenticado con contacto previo y no manda a HumanaIA más que la consulta del interruptor y la cifra. Añadir la frontera compuerta → HumanaIA | REQ-001, REQ-014, REQ-015 |
| P-06 | `contratos/` | Esquema cerrado de la consulta del interruptor (sin datos del correo) y de su respuesta («seguir» o «parar»), y el entero de la cifra (en el informe si vía A, en ese esquema si vía B). Los fija el diseño | REQ-010, REQ-015 |
| P-07 | `docs/INSTALACION-CLIENTE.md` | Paso opcional para instalar la compuerta fijada a una versión, activarla, desactivarla y desinstalarla. El paso 4 no cambia y se comprueba después | REQ-014, REQ-017, REQ-019 |
| P-08 | `docs/adr/0004-limites-en-el-anfitrion.md` | El punto 7 ya recoge la 1.4. Añadir solo la referencia a la 016 reescrita y al interruptor | Coherencia |
| P-09 | `marketing/` | No prometer el envío como disponible hasta cerrar 016 y 017. Explicar que responde solo a quien el dueño ya ha escrito, con espera de 15 minutos | D-038 |

## 5. Otras funciones

| N.º | Función | Asunto | Motivo |
| --- | --- | --- | --- |
| P-10 | 012 (fase 2) | El agente deja el borrador y lo marca como candidato con una sola categoría de la lista cerrada, que incluye las exclusiones por asunto (reclamaciones, personales, médicos, organismos públicos, bancos). Para los candidatos escribe solo texto plano, sin enlaces, direcciones, teléfonos, IBAN, tarjetas, DNI, NIE, NIF, pasaporte ni citas (tampoco escritos con separadores, en letra o con «arroba»), dentro de la longitud máxima, sin compromisos ni importes inventados; si queda algo por completar («[COMPLETAR»), no marca. No toca el estado, los avisos ni los resúmenes de la compuerta. El arranque local dice que la compuerta no amplía sus límites. El paso 7 no cambia | Si no, la 016 rechazaría casi todo (REQ-005, REQ-006, REQ-020) |
| P-11 | 012 (fase 2) | El prompt 1.2 dice «sin que salga un solo correo de mi cuenta que yo no haya revisado» y «Todo sale como borrador y lo envío yo». Con la compuerta activa, la primera frase deja de ser cierta. El agente sigue sin enviar, pero el texto debe decir que una compuerta del dueño puede enviar algunos borradores | Coherencia del prompt con la 1.4 |
| P-12 | 012 (fase 2) | Ampliar su batería de instrucciones ocultas con las de CA-003, CA-023 a CA-025 de la 016 | Baterías obligatorias |
| P-13 | 052 (fase 6) | Condiciones del servicio: quién responde de un envío hecho por la compuerta y del riesgo residual | Propuesta de enmienda |
| P-14 | Fases 3 a 5 | Interruptor por cliente y global en el panel superadmin, con doble factor y auditoría (A-11); la cifra en los paneles y sus alertas | Fuera de alcance de la 016 |

## 6. Contradicciones y riesgos detectados

1. **Interruptor que vuelve a «seguir».** El artículo 8 dice que el servidor no puede activar la compuerta. La 016 trata el interruptor como un veto que no cambia la activación del dueño: «seguir» solo lo levanta, no activa nada y lo detenido no se reintenta (REQ-001, REQ-018, REQ-025). El dictamen 1 lo da por compatible con el artículo 8.
2. **Aviso y resumen al alcance del agente.** Si se dejan como correos en la bandeja, el agente puede archivarlos. La 016 exige que el dueño lea el resumen completo (REQ-011) y que el aviso quede fuera del alcance del agente con esa misma garantía; si la plataforma no lo permite, cualquier alteración del aviso que no conste hecha por el dueño impide el envío (REQ-008). La salida de reserva solo bloquea, pero un correo con instrucciones ocultas podría así impedir envíos legítimos; depende de la plataforma (P-02).
3. **Contacto previo fabricado.** La condición más fuerte depende de distinguir envíos reales del dueño de mensajes insertados o etiquetados como enviados y de los de la propia compuerta (REQ-002, REQ-013). Sin comprobar en Gmail ni en Outlook.
4. **Filtro frente a respuestas útiles.** Prohibir teléfonos y números de cuenta deja fuera respuestas legítimas; el dueño puede apagarlo tras el aviso. HTML y contenido oculto se han dejado fuera del filtro desactivable, dentro del texto plano: es la lectura más estricta del encargo.
5. **Topes.** El auditor recomendó 1 por hilo y 10 por cuenta y día como control añadido y el responsable no lo eligió (`aclaraciones.md`, cuestión 4). La 016 los usa como supuesto por cierre en fallo: el 20 de la versión 1.3 iba con un tope por regla y una lista de remitentes que ya no existen. El 5 por regla pasa a ser 5 por destinatario. Si el responsable quiere otros, cambia el supuesto.
6. **Nombre de la carpeta.** `016-compuerta-envio-por-regla` ya no describe la función. Se conserva para no romper referencias; el título es «Compuerta de envío sin revisión».
7. **Región.** `docs/ARQUITECTURA.md` y la fase 2 de `docs/PLAN.md` siguen con `eu-central-1` y `fra1`, mientras D-020 fija `eu-north-1` y `arn1`. No afecta a la 016.
8. **Umbral del agente en CA-024.** El 1 % de intentos con canarios sin forma de dato copiados es un supuesto del especificador: la compuerta no puede detectar contenido copiado sin marcas de cita (definición de «cita» de la 016). Conviene que el `auditor-seguridad` lo confirme y que la 012 lo use en su batería (P-12).
