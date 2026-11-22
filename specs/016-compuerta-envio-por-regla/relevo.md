# Relevo · carril B2 (016, 017, 018)

Actualizado: 22/11/2026 · Orquestador del carril B2 (documentación del envío sin revisión). Se reescribe entero al cerrar cada puerta.

## Estado

| Paso | Función | Estado |
| --- | --- | --- |
| Enmienda 1 | 016 compuerta | **APROBADA el 22/11/2026 (P0 de la enmienda, aprobado por delegación D-036).** 27 REQ, 30 CA. Auditor, vuelta 4 de confirmación: APTO CON UN MENOR; N-1 (MAYOR) y N-2 cerrados; N-3 (la constancia de ausencia no puede venir del agente ni del conector) aplicado en REQ-026, CA-029 y P-25. Commit `738a6aa` |
| Enmienda 1 | 017 vía protegida | **APROBADA el 22/11/2026 (D-036).** 24 REQ, 23 CA. Sin hallazgos abiertos. Cuestión 1 para el responsable, no bloquea |
| Enmienda 1 | 018 aprendizaje de estilo | **PROPUESTA, P0 NO abierta.** 21 REQ, 21 CA. La propia sección de aprobación exige que el responsable acepte de forma expresa el riesgo residual (D-042); no lo decido |
| Piloto | `piloto-gmail.md` | Ajuste a la enmienda encargado al arquitecto el 22/11 (P-26, P-17, P-11, NC-5 b y c, pruebas de REQ-026 por cuenta, dudas D-2 a D-7). Sin ejecutar. Ver el final de este relevo si ya se integró |

Comprobador: `node scripts/comprobar-specs.mjs` → SUPERADO el 22/11/2026 (solo avisos de tamaño D-023, previos).

## Qué se hizo el 22/11/2026

Texto mínimo del auditor aplicado sin la alternativa B (decisión D-036 de la coordinación). Vuelta 4 acotada a N-1 y N-2: sin bloqueantes ni mayores. Coste operativo conocido: la vuelta atrás desde la primera versión con la 016 deja el canal sin instrucciones mientras haya cuentas con la compuerta instalada o no se pueda saber. Riesgo residual aceptado por el auditor: un dueño de un canal que sirve la 1.2 puede instalar la compuerta desde el repositorio; el control es la condición de activación de REQ-026 (0 activaciones con esa versión).

Pendiente para otros chats: la 030 (cuestiones 1, 3, 6 y 7 abiertas) debe recoger P-25 (requisitos 13, 16, 17 y 20); el auditor no pudo comprobar si hay otras vías de asignar canal (alta de cliente directo en `estable`).

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
