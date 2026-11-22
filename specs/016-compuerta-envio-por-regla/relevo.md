# Relevo · carril B2 (016, 017, 018)

Actualizado: 21/11/2026 (noche) · Orquestador del carril B2 (documentación del envío sin revisión). Se reescribe entero al cerrar cada puerta.

## Estado

| Paso | Función | Estado |
| --- | --- | --- |
| Enmienda 1 | 016 compuerta | **PROPUESTA (P0 de la enmienda NO abierta).** 27 REQ, 30 CA. Vuelta de corrección 3 aplicada (M-1, M-2, m-1, m-2 de la vuelta 2). Auditor vuelta 3 (`dictamen-enmienda-3.md`): APTO CON CONDICIONES, **1 MAYOR (N-1) y 1 MENOR (N-2)**, ambos sobre M-1 |
| Enmienda 1 | 017 vía protegida | **PROPUESTA.** 24 REQ, 23 CA. m-1 y m-2 cerrados en la vuelta 3. Sin hallazgos propios nuevos; depende de cerrar N-1 de la 016 |
| Enmienda 1 | 018 aprendizaje de estilo | **PROPUESTA.** 21 REQ, 21 CA. m-1 y m-2 cerrados. Sin hallazgos nuevos. Aceptación del riesgo residual pendiente del responsable |
| Piloto | `piloto-gmail.md` | **ESCRITO, sin ejecutar.** No se ajusta hasta que la enmienda esté aprobada (queda también por incorporar P-26, P-17 y P-11 en sus NC) |

Comprobador: `node scripts/comprobar-specs.mjs` → SUPERADO el 21/11/2026 tras la vuelta de corrección (solo avisos de tamaño D-023, previos).

## Por qué no se abre la P0 (regla D-036: sin bloqueantes ni mayores)

Queda **N-1 (MAYOR)** y la orden de la coordinación prohíbe más vueltas si quedaba algún mayor. Se para aquí.

- **N-1:** M-1 protege el canal pero no la cuenta. La 030 (requisitos 13, 16, 17, 20) permite al superadmin cambiar de canal a un cliente, publicar y volver atrás, y P-25 solo se dirige a la 015. Escenario: cliente en `prueba` con la compuerta instalada, pasado a `estable`, que sirve la 1.2 (navegador con la sesión y envío en conversación): vuelve B-1.
- **N-2 (MENOR):** «si no se puede saber…, se trata como si la hubiera» debe aclarar que no consultar el interruptor ni enviar cifra no prueba que no haya compuerta; solo vale una constancia positiva de ausencia.

### Alternativa recomendada (texto mínimo, ya redactado por el auditor)

**Recomiendo aplicar tal cual la corrección del auditor** (solo texto, no cambia ninguna decisión de la coordinación):

1. REQ-026: «La condición del prompt rige por cuenta: una cuenta con la compuerta instalada no recibe una versión que pida navegador con la sesión del dueño en Google o envío en conversación, ni por publicación o vuelta atrás en su canal (015 y 030), ni por cambio de canal del cliente (requisito 13 de la 030). Ese cambio de canal se rechaza. No se ofrece la guía de instalación a una cuenta cuyo canal sirva una versión así. Que una cuenta no consulte el interruptor ni envíe la cifra no prueba que no tenga la compuerta; una cuenta de Gmail cuenta como sin compuerta solo con una constancia positiva que no dependa de esa falta de señales; si no, se trata como instalada».
2. CA-029: cuenta de prueba con la compuerta instalada en `prueba` y la 1.2 vigente en `estable`: pasar el cliente a `estable` rechazado y anotado; con la 1.2 vigente, 0 guías de instalación ofrecidas; compuerta instalada sin activar y sin consulta ni cifra (simulada): paso a la 1.2 rechazado.
3. `propuestas.md` P-25: ampliarla a la 030 (requisitos 13, 16, 17 y 20).

Alternativa B, más drástica: no ofrecer la compuerta a ningún canal hasta que exista una versión del prompt sin navegador ni envío en conversación vigente en todos los canales. Es más simple de probar pero retrasa el piloto; no la recomiendo.

**Siguiente paso para quien siga:** una edición mínima de texto por el especificador (punto 1 a 3) y comprobación mecánica del orquestador. Como el auditor dejó la corrección redactada y N-1 es solo un alcance que faltaba, la coordinación puede decidir por D-036 si basta con esa verificación del texto (sin vuelta 4 del auditor) para abrir la P0, o si quiere una vuelta de confirmación. No la decido yo.

Coste operativo que la coordinación debe conocer: con esta regla, la vuelta atrás desde la primera versión con la 016 dejará el canal sin instrucciones mientras haya cuentas con la compuerta instalada o no se pueda saber.

## Decisiones de la coordinación ya aplicadas (D-036, 21/11/2026)

Solo Gmail; presencia por código de un solo uso (o llave de acceso si NC-5); contacto previo solo con discriminador probado (NC-2) y nunca lo de la compuerta, del agente, de un borrador del agente (cambiado o no) ni de un delegado; avisos y resumen en la página del dueño más correo de cortesía sin autoridad; la compuerta comprueba su huella; la 018 con las mismas restricciones; piloto como condición de activación. Duda 1 (leído no impide el envío) aceptada por el auditor. Vuelta 3 del auditor autorizada por la coordinación.

## Cuestiones que solo puede decidir el responsable (fichas al día)

**018, aceptación del riesgo residual (D-042)** (persistencia y amplificación de una fórmula envenenada). (A) aceptarlo con las condiciones del diseño (300 pruebas por asistente o visto bueno del dueño para fórmulas nuevas; novedad con 24 h de espera); (B) variante restrictiva: ninguna fórmula literal aprendida en borradores que la compuerta envía, más visto bueno. **Recomiendo B** si no hay prisa por el estilo literal; A con visto bueno si se quiere el estilo completo. Hasta su respuesta: sin aprendizaje activo en cuentas reales, sin prompt con la 018 en canal de cliente, sin cierre P7 de la 018.

**017, cuestión 1:** ¿se compromete HumanaIA a no pedir nunca a un cliente que active o relaje la compuerta? (A) Sí y por escrito (aviso, soporte, `marketing/`, 052); (B) no, y el aviso dice que toda petición de relajar, aunque parezca de HumanaIA, es posible engaño (rige hoy). **Recomiendo A.** No bloquea.

**Cuentas de prueba y gasto del piloto (art. 14):** seis cuentas de Google dedicadas y sin datos reales (cuatro `gmail.com`: DUEÑO-P con verificación en dos pasos, CONTACTO-A, CONTACTO-B, DELEGADO; dos Workspace de prueba: DUEÑO-W, CONTACTO-W, con dominio propio de prueba y acceso a su DNS); proyectos de Apps Script creados por él (PS-COMP, PS-VINC, PS-WEB, PS-OTRA, PS-REM) y la API de Apps Script activada; cuentas de Claude y ChatGPT dedicadas con conectores de Gmail y Drive y extensiones de navegador, en un perfil aparte; un móvil con aplicación de códigos temporales (y dispositivo con llaves de acceso para NC-5 a); opcional con gasto, un dominio no ASCII para NC-7. Los pasos con sesión los hace una persona. Detalle en `piloto-gmail.md`.

Supuestos cambiables: 24 meses de antigüedad del contacto previo; 0 fugas en 300 intentos; 30 días de historial; 10 peticiones de presencia al día; topes 1 por hilo, 5 por destinatario y día, 10 por cuenta y día.

## Dudas del arquitecto sobre el piloto (apartado 9 de `piloto-gmail.md`)

D-1 añadir NC-5 (b) y (c) a REQ-026; D-2 dónde viven las sondas (propone `specs/016-…/piloto/sondas/`, tareas TP-1 a TP-3); D-3 gasto de Workspace, dominio no ASCII y suscripciones (responsable); D-4 si la huella puede llamar a la API de Apps Script (REQ-014 limita la red); D-5 tope de 10 envíos frente a los 300 intentos de CA-024; D-6 repetir el piloto cada 6 meses o al cambiar un conector; D-7 dónde consta el resultado (fila en TECNOLOGIAS).

## Propuestas para la coordinación (no aplicadas)

`016/propuestas.md` (P-01 a P-26; nuevas: P-25 a la 015 —ampliar a la 030 por N-1— y P-26 al piloto), `017/propuestas.md` (P-12 a P-17; nuevas P-16 ampliar A-21 de SEGURIDAD, P-17 piloto), `018/propuestas.md` (P-7 a P-12; nuevas P-11 piloto NC-11, P-12 prompt 012). Tamaños sobre los 25 KB de D-023 (aviso; P-24 propone dividir la 016, P-15 la 017). `docs/PLAN.md` sigue en la 1.3; las especificaciones citan constitución 1.4 y la vigente es 1.5. **`marketing/LEEME.md` línea 111** habla aún de «reglas» de remitente: de otro chat, no lo toco.

## Qué no se pudo comprobar

Todo es revisión de texto: ninguna prueba real. Pendientes en el piloto: NC-1 a NC-7, NC-9, NC-11 a NC-13, REQ-017 por asistente (bloqueo por defecto de herramientas nuevas), vuelta atrás del prompt. NC-8 y NC-10 no aplican. Del auditor: si la compuerta desactivada manda alguna señal a HumanaIA; si la 030 permite cambiar de canal sin otra comprobación (cuestiones 1, 3, 6 y 7 de la 030 abiertas).

## Reparto

Mío: `specs/016-*`, `specs/017-*`, `specs/018-*`. No toco la 010, `marketing/` ni documentos compartidos.
