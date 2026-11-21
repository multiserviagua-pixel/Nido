# 016 · Dictamen del auditor-seguridad sobre la especificación (vuelta 1)

Fecha: 21/11/2026 · Dictamen del `auditor-seguridad`, copiado por el orquestador sin cambios de fondo.

**Veredicto: APTO CON CONDICIONES. Sin bloqueantes; 5 MAYOR a corregir antes de abrir P0.** Todas las condiciones de sus dos dictámenes anteriores están cubiertas y cada REQ tiene al menos un CA. El interruptor como veto encaja con el artículo 8 si «parar» no toca la activación del dueño.

| N.º | Gravedad | REQ y CA | Escenario | Corrección mínima |
| --- | --- | --- | --- | --- |
| 1 | MAYOR | REQ-002, CA-002 | Mensajes generados desde la cuenta sin que el dueño escriba (baja de lista con `mailto:` del atacante, aceptación de convocatoria, acuse de lectura, otra aplicación conectada) quedan en enviados: con un clic un desconocido pasa a contacto previo | El contacto previo solo cuenta mensajes que el dueño ha escrito; si no se pueden distinguir, no cuentan. Variantes en CA-002 y en la verificación (P-02) |
| 2 | MAYOR | REQ-006, CA-007 | Cita con IBAN escrito con separadores, dígitos de ancho completo, números en letra, «arroba» y «punto»: con el filtro activo sale un IBAN falso | El filtro analiza texto normalizado y en caso de duda rechaza; cubre tarjetas, NIE y pasaporte; batería de evasiones en CA-007 |
| 3 | MAYOR | REQ-008, REQ-013, CA-010 | Inyección que archiva o reetiqueta los avisos de la espera: el dueño no los ve y sale el envío | El aviso queda fuera del alcance del agente con la garantía del resumen, lleva destinatario y texto exacto; si la plataforma no lo permite, toda alteración del aviso no hecha por el dueño impide el envío |
| 4 | MAYOR | REQ-009, REQ-023, CA-011, CA-026 | 30 correos en hilos distintos en un minuto con ejecuciones simultáneas leen el contador por debajo del tope | Topes también con ejecuciones simultáneas; un envío con resultado desconocido consume tope; prueba en CA-026 |
| 5 | MAYOR | REQ-007, REQ-014, REQ-019, CA-016, CA-021 | Una actualización que siga activa y pierda exclusiones, topes bajados, contadores o marcas de hilo envía a un excluido o duplica | Instalar, actualizar o reinstalar nunca deja la compuerta activa con un ajuste menos restrictivo: conserva el estado o queda desactivada hasta que el dueño active; prueba en CA-016 y CA-021 |
| 6 | MENOR | REQ-025, CA-028 frente a REQ-018, CA-012 | Contradicción sobre quién reactiva tras «parar» | «Parar» es un veto que no cambia la activación; «seguir» solo lo levanta, sin enviar lo detenido; ambos en historial y resumen |
| 7 | MENOR | REQ-011, CA-013 | Sin resumen el día en que el dueño desactiva o desinstala | Resumen de todo día con envíos o cancelaciones, aunque después se desactive o desinstale |
| 8 | MENOR | REQ-003, CA-004 | `gestor.banco.es` no cae en la exclusión de `banco.es` | Las exclusiones por dominio abarcan subdominios; prueba en CA-004 |
| 9 | MENOR | Riesgo residual, CA-003 | Un desconocido envía una consulta inocente, el dueño responde a mano y pasa a contacto previo; luego llega la inyección | Nombrarlo en el riesgo residual y en el aviso de la 017; variante en CA-003 (depende del agente) |
| 10 | MENOR | CA-024, REQ-006 | CA-024 exige 0 canarios desde contactos previos sin que lo garantice un REQ; «cita» sin definir | Separar la parte determinista (100 %) de la que depende del agente con umbral explícito, o definir «cita» |
| 11 | MENOR | REQ-021 | `toLowerCase()` convierte el signo Kelvin (U+212A) en «k» | Minúsculas solo para ASCII; una dirección con caracteres no ASCII coincide solo si es idéntica, o no se envía |

No comprobado: comportamiento real de Gmail y Outlook (baja de listas, convocatorias y acuses en enviados; autenticación del proveedor; enviados reales frente a importados; aviso, resumen y estado fuera del alcance de los conectores), todo en VERIFICAR. No leyó la 017. La condición H7 (`docs/SEGURIDAD.md`) sigue pendiente de la coordinación (P-03 y P-04).
