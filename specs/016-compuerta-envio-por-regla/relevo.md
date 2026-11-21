# Relevo · carril B2 (016, 017, 018)

Actualizado: 21/11/2026 · Orquestador del carril B2 (documentación del envío sin revisión). Se reescribe entero al cerrar cada puerta.

## Estado

| Paso | Función | Estado |
| --- | --- | --- |
| 1 | 016 compuerta | **APROBADA 21/11/2026 (D-036).** 25 REQ, 28 CA. Auditor: vuelta 1 APTO CON CONDICIONES (5 MAYOR corregidos), vuelta 2 APTO |
| 2 | 017 vía protegida del dueño | **APROBADA 21/11/2026 (D-036).** 21 REQ, 20 CA, 24,6 KB. Auditor: 4 vueltas, última APTO CON CONDICIONES sin MAYOR |
| 3 | 018 aprendizaje de estilo (carpeta `018-aprendizaje-estilo`) | **APROBADA 21/11/2026 (D-036).** 20 REQ, 20 CA, 23,4 KB. Auditor: 2 vueltas, última APTO CON CONDICIONES sin MAYOR. **Aceptación del riesgo residual PENDIENTE del responsable** |
| 4 | Verificación de Gmail y Outlook (arquitecto, `verificar-decision`, 21/11/2026) | **HECHA**: `verificacion-gmail-outlook.md`. Gmail viable con restricciones y hoy sin activación posible; Outlook.com no viable; Microsoft 365 no viable por ahora. **Choca con las tres especificaciones aprobadas (D1 a D7): decide la coordinación** |

## Resultado de la verificación (D1 a D7: decide la coordinación, con dictamen del auditor-seguridad)

- **D1.** La 017 exige presencia del dueño que el navegador del asistente no aporte para activar y apagar el filtro; Google no documenta reautenticación forzada ni nominativa para terceros. En Gmail la compuerta no se puede activar hasta decidir si un código de un solo uso del móvil (HMAC en el código) cuenta como presencia.
- **D2.** Contacto previo (REQ-002 de la 016): la etiqueta SENT se pone también a lo insertado, a lo enviado por otras aplicaciones y desde la web; ningún campo dice quién lo escribió; con «si no se puede distinguir, no cuenta» no habría envíos. Además `gmail.modify` permite insertar mensajes con cabeceras de autenticación falsas.
- **D3.** Aviso y resumen en forma de correo no quedan fuera del alcance del agente (papelera, archivo, filtros). Solo las propiedades del script, vistas en una aplicación web, lo están. ¿Cumple «deja al dueño» una página que el dueño abre, o rige P-15 (no se ofrece envío)?
- **D4.** «Fijada a una versión» depende de que nadie más edite el proyecto: compartirlo da edición; el alcance `drive` de ChatGPT comparte y borra; Claude muestra `share_file` y `trash_file` que Google no documenta.
- **D5.** Sin compuerta en Outlook.com; Microsoft 365 solo con otra verificación (Power Automate premium o Azure del cliente).
- **D6.** La 018 choca con los mismos límites (quién escribió, quién cambió una etiqueta).
- **D7.** El prompt 1.2 deja enviar en conversación con confirmación del dueño y el paso 4 de la instalación lo bloquea; lo así enviado no se distingue de lo que escribe el dueño.
- Para el diseño: responder a la dirección de respuesta y no al remitente en `reply` de Gmail y de Graph (construir el mensaje en bruto); Apps Script no verifica RSA/ECDSA/Ed25519 (procedencia del «seguir» solo con HMAC); 90 minutos diarios de disparadores en Gmail personal; el paso 4 de INSTALACION-CLIENTE no bloquea `create_filter`, `trash_*`, `mark_*_spam`, `delete_label`. Diez puntos sin comprobar (NC-1 a NC-10) necesitan cuentas de prueba y datos ficticios: cuentas y gasto los decide el responsable.
- **Mi lectura.** Con D1 a D3 la compuerta tal como está aprobada probablemente no es activable en Gmail sin una decisión de producto: o se acepta una vía con presencia por código de un solo uso y avisos en una página del dueño, o la función se difiere. Opciones y recomendación para la coordinación: (A) abrir una vuelta de especificación y auditoría que admita esa vía en Gmail; (B) diferir el envío sin revisión hasta las pruebas reales NC-1 a NC-10; (C) lo anterior más un piloto en cuenta de prueba. Recomiendo B con C, y que el diseño de la 016, 017 y 018 espere a esa decisión.

## Condiciones que pasan al diseño

- **016** (`016/dictamen-especificacion-2.md`): umbral de CA-024 con 300 intentos o más por asistente y también con filtro apagado; antigüedad máxima del contacto previo (propone 24 meses) o nombrarlo en el riesgo residual y el aviso de la 017; metadatos del interruptor sin hora por consulta; aviso alterado = no envío visible en el resumen. El resumen inalterable (REQ-011) no tiene salida de reserva: si la plataforma no lo permite, el diseño se detiene. Tercer nivel del requisito 8 (P-15): si la plataforma ni protege el aviso ni detecta su alteración, no ofrece envío.
- **018** (`018/dictamen-especificacion-2.md`): (b) fórmula envenenada, R-1 (24 h e informe antes de usar una novedad), R-2 («si no se distingue quién cambió la etiqueta, no cuenta»), R-3 (opción restrictiva).
- **017** (`017/dictamen-especificacion-2.md`, R-1 a R-4): pendientes restrictivos no se anulan por cambios de estado; constancia «hecha por el dueño» solo de una fuente que el agente no escriba; tope diario de peticiones de presencia; definición de «estado» de un pendiente. T-1 (dónde vive la vía protegida: opciones A a D, recomendadas A o D) y T-2 (qué permiten Gmail y Outlook) sin decidir.

## Cuestiones que solo puede decidir el responsable

**018, aceptación del riesgo residual (persistencia y amplificación de una fórmula envenenada en el aprendizaje continuo).** La coordinación no puede aceptarlo (D-036 no lo cubre; arts. 6, 13 y 14). Opciones: (A) aceptarlo con las condiciones del diseño (300 pruebas por asistente para la variante de fórmula o visto bueno del dueño para fórmulas nuevas; novedad con 24 h de espera); (B) variante restrictiva: ninguna fórmula literal aprendida en los borradores que la compuerta envía (R-3) más visto bueno para las fórmulas. Recomiendo B si no hay prisa en el estilo literal y A con visto bueno si se quiere el estilo completo. Hasta su respuesta: no hay aprendizaje activo en cuentas reales, ni prompt con la 018 en un canal de cliente, ni cierre P7 de la 018. Diseño y plan siguen (propuesta P-6 de la 018 para anotarlo en TECNOLOGIAS).


Y **017, cuestión 1:** ¿se compromete HumanaIA a no pedir nunca a un cliente que active o relaje la compuerta? Opciones: A, sí y por escrito (aviso, soporte, `marketing/`, 052); B, no se compromete y el aviso dice que toda petición de relajar, aunque parezca de HumanaIA, es posible engaño (rige hoy). Recomiendo A. No bloquea nada: la especificación aplica B. La 2 y la 3 las fijó la coordinación por D-036 con la opción restrictiva (instala siempre el dueño; solo cuenta el titular y los delegados solo hacen urgentes).

Supuestos que puede cambiar: 016, topes 1 por hilo, 5 por destinatario y día y 10 por cuenta y día (el responsable no eligió topes bajos; antes 20 por cuenta); licencia no vigente = «parar»; HTML y contenido oculto no desactivables. 017, reautenticación propia con plazo de cambio pendiente de 24 horas y 3 peticiones de presencia por hora.

## Propuestas para la coordinación

En `016/propuestas.md` (P-01 a P-15) y `017/propuestas.md`: PLAN, TECNOLOGIAS, SEGURIDAD (amenazas y ruta crítica), ARQUITECTURA, INSTALACION-CLIENTE, ADR-0004, 012 (prompt: la frase «sin que salga un solo correo que yo no haya revisado»), 040/041, 052. `docs/PLAN.md` sigue con la 1.3 («REQ-019 de la 016» es ahora REQ-018). `marketing/LEEME.md` línea 111 (afirmación 11) aún habla de «reglas» de remitente: corregir antes de publicar (no lo toco).

## Reparto

Mío: `specs/016-*`, `specs/017-*`, `specs/018-*`. No toco la 010, `marketing/` ni documentos compartidos.
