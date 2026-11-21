# Relevo · carril B2 (016, 017, 018)

Actualizado: 21/11/2026 · Orquestador del carril B2 (documentación del envío sin revisión). Se reescribe entero al cerrar cada puerta.

## Estado

| Paso | Función | Estado |
| --- | --- | --- |
| Enmienda 1 | 016 compuerta | **PROPUESTA (P0 de la enmienda NO abierta).** 27 REQ, 30 CA. Auditor: vuelta 1 NO APTO (1 BLOQUEANTE, 4 MAYOR, corregidos); vuelta 2 APTO CON CONDICIONES con **2 MAYOR nuevos** (M-1, M-2) |
| Enmienda 1 | 017 vía protegida | **PROPUESTA.** 24 REQ, 23 CA. Vuelta 2: APTO CON CONDICIONES, 2 MENOR; depende de cerrar M-1 de la 016 |
| Enmienda 1 | 018 aprendizaje de estilo | **PROPUESTA.** 21 REQ, 21 CA. Vuelta 2: APTO, 2 MENOR. Aceptación del riesgo residual pendiente del responsable |
| Piloto | `piloto-gmail.md` (arquitecto) | **ESCRITO, sin ejecutar** (todas las pruebas NO EJECUTADA). Pendiente de comprobarlo con el comprobador y de ajustarlo si cambia la enmienda |

Las aprobaciones de 21/11/2026 (D-036) de las versiones anteriores siguen en el historial; la enmienda las reabre hasta nueva P0. Commit e063e08 (enmiendas y dictámenes).

## Por qué no se abre la P0 de las enmiendas

D-036 exige que no queden bloqueantes ni mayores. Quedan dos MAYOR en la 016 y la orden limitaba a una vuelta de corrección y dos de auditoría. Ambos se arreglan con texto (dictamen `016/dictamen-enmienda-2.md`):

- **M-1 (REQ-026, CA-029, REQ-017; arts. 8 y 9).** La condición del prompt solo se comprueba al activar. La vuelta atrás de la 015 puede volver a servir la 1.2 (navegador con la sesión del dueño y envío en conversación). Corrección: rige mientras haya en el canal una cuenta con la compuerta instalada; el canal no puede pasar a esa versión, tampoco por vuelta atrás; CA-029 prueba el cambio de versión y la vuelta atrás.
- **M-2 (REQ-002, CA-002).** «Sin cambios» no basta: la copia de referencia la puede escribir el agente. Corrección: un mensaje que procede de un borrador del agente no cuenta, lo haya cambiado o no el dueño; la procedencia la fija la compuerta con algo que el agente no pueda escribir ni omitir.
- Menores: 016 m-1 (la lista guiada de REQ-017 sea de permitidas, lo no nombrado bloqueado) y m-2 (comprobar filtros y etiquetas al dejar el correo de cortesía); 017 m-1 (toda reinstalación con secreto nuevo empieza desactivada y con la activación pendiente) y m-2 (datos del agente o de terceros en la vía protegida como texto inerte; ampliar A-21 de SEGURIDAD); 018 m-1 (si no sabe con seguridad si la compuerta está activa, la trata como activa) y m-2 (cambios en un borrador solo como «rasgo de la lista → valor»).

**Siguiente paso para quien siga:** una vuelta del especificador solo con esas correcciones, y confirmar con el auditor (vuelta 3, acotada a estos puntos; hace falta autorización de la coordinación porque excede el límite de dos). Si no hay bloqueantes ni mayores, P0 por D-036.

## Decisiones de la coordinación ya aplicadas (D-036, 21/11/2026)

Solo Gmail; presencia por código de un solo uso (o llave de acceso si NC-5); contacto previo solo con discriminador probado (NC-2) y nunca lo de la compuerta, del agente, de un borrador del agente ni de un delegado; avisos y resumen en la página del dueño más correo de cortesía sin autoridad; la compuerta comprueba su huella; la 018 con las mismas restricciones; piloto como condición de activación. Duda 1 (leído no impide el envío) aceptada por el auditor con las correcciones.

## Lo que necesita el responsable para el piloto (cuentas y gasto, art. 14)

Detalle en `piloto-gmail.md`, apartado de requisitos: seis cuentas de Google dedicadas y sin datos reales (cuatro `gmail.com`: DUEÑO-P con verificación en dos pasos, CONTACTO-A, CONTACTO-B, DELEGADO; dos en Workspace de prueba: DUEÑO-W, CONTACTO-W, con dominio propio de prueba y acceso a su DNS); proyectos de Apps Script creados por él con su sesión (PS-COMP, PS-VINC, PS-WEB, PS-OTRA, PS-REM) y la API de Apps Script activada; cuentas de Claude y ChatGPT dedicadas con conectores de Gmail y Drive y las extensiones de navegador, en un perfil aparte; un móvil con aplicación de códigos temporales (y un dispositivo con llaves de acceso para NC-5 a); opcional con gasto, un dominio no ASCII para NC-7. Los pasos con sesión los hace una persona; ningún agente tiene credenciales.

## Cuestiones que solo puede decidir el responsable

**018, aceptación del riesgo residual** (persistencia y amplificación de una fórmula envenenada). Opciones: (A) aceptarlo con las condiciones del diseño (300 pruebas por asistente o visto bueno del dueño para fórmulas nuevas; novedad con 24 h de espera); (B) variante restrictiva: ninguna fórmula literal aprendida en borradores que la compuerta envía, más visto bueno para las fórmulas. **Recomiendo B** si no hay prisa en el estilo literal; A con visto bueno si se quiere el estilo completo. Hasta su respuesta: no hay aprendizaje activo en cuentas reales, ni prompt con la 018 en canal de cliente, ni cierre P7 de la 018.

**017, cuestión 1:** ¿se compromete HumanaIA a no pedir nunca a un cliente que active o relaje la compuerta? (A) Sí y por escrito (aviso, soporte, `marketing/`, 052); (B) no, y el aviso dice que toda petición de relajar, aunque parezca de HumanaIA, es posible engaño (rige hoy). **Recomiendo A.** No bloquea: la especificación aplica B.

Supuestos cambiables: 24 meses de antigüedad del contacto previo; 0 fugas en 300 intentos; 30 días de historial; 10 peticiones de presencia al día; topes 1 por hilo, 5 por destinatario y día, 10 por cuenta y día.

## Dudas del arquitecto sobre el piloto (apartado 9 de `piloto-gmail.md`)

D-1 añadir NC-5 (b) y (c) a REQ-026 (sin ellos REQ-004 de la 017 impide activar); D-2 dónde viven las sondas (propone `specs/016-…/piloto/sondas/` y tareas TP-1 a TP-3); D-3 gasto de Workspace, dominio no ASCII y suscripciones (del responsable); D-4 si la comprobación de huella puede llamar a la API de Apps Script (REQ-014 limita la red); D-5 tope de 10 envíos frente a los 300 intentos de CA-024; D-6 repetir el piloto cada 6 meses o al cambiar un conector; D-7 dónde consta el resultado (fila en TECNOLOGIAS).

## Propuestas para la coordinación (no aplicadas)

`016/propuestas.md` (P-01 a P-24: PLAN, TECNOLOGIAS, SEGURIDAD, ARQUITECTURA, INSTALACION-CLIENTE paso 4 con bloqueo de `send_message`, `reply`, `forward`, `create_filter`, `trash_*` y de Drive; ADR-0004; prompt 012 sobre navegador y envío en conversación; P-24 dividir la 016 por tamaño), `017/propuestas.md` (P-12 a P-15), `018/propuestas.md` (P-7 a P-10). Tamaños: 016 40 KB, 017 35 KB, 018 30 KB, por encima de los 25 KB de D-023 (aviso). `docs/PLAN.md` sigue en la 1.3; las especificaciones citan constitución 1.4 y la vigente es 1.5 (no cambia el art. 8). **`marketing/LEEME.md` línea 111** (afirmación 11) aún habla de «reglas» de remitente: para la coordinación, no la toco.

## Qué no se pudo comprobar

Todo es revisión de texto: ninguna prueba real. Pendientes en el piloto: NC-1 a NC-7, NC-9, NC-11 a NC-13, REQ-017 por asistente, vuelta atrás del prompt. NC-8 y NC-10 no aplican (Outlook fuera).

## Reparto

Mío: `specs/016-*`, `specs/017-*`, `specs/018-*`. No toco la 010, `marketing/` ni documentos compartidos.
