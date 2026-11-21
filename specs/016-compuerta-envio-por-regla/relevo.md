# Relevo · carril B2 (016, 017, 018)

Actualizado: 21/11/2026 · Orquestador del carril B2 (documentación del envío sin revisión). Se reescribe entero al cerrar cada puerta.

## Estado

| Paso | Función | Estado |
| --- | --- | --- |
| 1 | 016 reescrita con la 1.4 | **APROBADA el 21/11/2026 por delegación D-036** (P0). 25 REQ, 28 CA, 24,5 KB. Dictamen 1: APTO CON CONDICIONES (5 MAYOR corregidos); dictamen 2: APTO |
| 2 | 017 nueva (vía protegida del dueño) | Siguiente: `especificador`, luego `auditor-seguridad`, P0 |
| 3 | 018 nueva (aprendizaje) | Pendiente |
| 4 | Verificación de Gmail y Outlook (arquitecto, `verificar-decision`) | Pendiente, tras las tres P0 |

## Condiciones que la 016 deja al diseño

Detalle en `dictamen-especificacion-2.md`: (1) umbral de CA-024 con 300 intentos o más por asistente y también con filtro apagado; (2) antigüedad máxima del contacto previo (propone 24 meses) o nombrarlo en el riesgo residual y el aviso de la 017; (3) metadatos del interruptor, sin hora por consulta; (4) aviso alterado por el agente = motivo de no envío visible en el resumen. El resumen inalterable (REQ-011) no tiene salida de reserva: si la plataforma no lo permite, el diseño se detiene.

## Cuestiones que solo puede decidir el responsable

Ninguna. Supuestos del especificador que puede cambiar: topes 1 por hilo, 5 por destinatario y día y 10 por cuenta y día (el responsable no eligió topes bajos como control; antes eran 20 por cuenta); licencia no vigente = «parar»; HTML y contenido oculto no desactivables.

## Propuestas para la coordinación

En `propuestas.md` de la 016 (P-01 a P-14: PLAN, TECNOLOGIAS, SEGURIDAD amenazas y ruta crítica, ARQUITECTURA, contratos, INSTALACION-CLIENTE, ADR-0004, marketing, 012 y 052). `docs/PLAN.md` sigue con la 1.3 y el «REQ-019 de la 016» (ahora REQ-018). El prompt 1.2 dice «sin que salga un solo correo que yo no haya revisado»: P-11 para la 012.

## Reparto

Mío: `specs/016-*`, `specs/017-*`, `specs/018-*`. No toco la 010, `marketing/` ni documentos compartidos.
