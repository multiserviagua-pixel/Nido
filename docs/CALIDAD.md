# Calidad: puertas, evidencias y definición de terminado

## Puertas

Una función avanza cuando supera la puerta. Las marcadas con **(persona)** solo las abre el responsable humano, con respuesta expresa.

| Puerta | Qué se comprueba | Quién | Evidencia |
| --- | --- | --- | --- |
| P0 Especificación **(persona)** | Requisitos medibles (`REQ-`), criterios de aceptación (`CA-`), casos negativos, fuera de alcance, cuestiones abiertas resueltas | `especificador`, orquestador | `especificacion.md`, `aclaraciones.md`, aprobación anotada |
| P1 Diseño y contratos **(persona)** | Diseño contra la constitución artículo por artículo, amenazas de la función, contratos válidos, ADR si cambia una frontera, tareas con agente y prueba | `arquitecto`, `auditor-seguridad` | `diseno.md`, `plan.md`, `tareas.md`, `contratos/` |
| P2 Código | Tipos, estilo y pruebas unitarias en verde; una tarea por cambio | Ingenieros | Salida de los comandos |
| P3 Integración | Aislamiento por RLS, extremo a extremo, repetición de peticiones, concurrencia, fallos de red | `qa`, `ingeniero-bd` | Salida de CI |
| P4 Seguridad y privacidad | Escáner de secretos y de dependencias, análisis estático, revisión independiente, revisión de privacidad; dictamen del `auditor-seguridad` en rutas críticas | `revisor`, `auditor-seguridad` | Dictamen sin bloqueantes |
| P5 Experiencia | Accesibilidad WCAG 2.2 AA, estados de carga, vacío y error, uso en móvil, textos en español | `disenador-ui`, `qa` | Informe de accesibilidad y capturas |
| P6 Operación | Vuelta atrás probada, migración reversible, supervisión y alertas, guía de operación actualizada | `plataforma` | Salida de la prueba de vuelta atrás |
| P7 Cierre **(persona)** | Todos los `CA-` con evidencia; registro de decisiones y plan actualizados | `qa`, orquestador | `verificacion.md`, aprobación anotada |

P5 solo aplica a funciones con interfaz. P6 solo a funciones que tocan datos, despliegue o prompt.

## Evidencia

Cada evidencia se guarda en `specs/NNN-nombre/evidencias/` y lleva:

```
commit:    <huella del commit>
prueba:    PRUEBA-NNN
fecha:     2026-11-12T08:04:00+01:00
entorno:   local | previo | producción
comando:   <comando exacto>
resultado: superada | fallida
revisor:   <agente o persona>
```

Reglas:

- No se anota como superada una prueba que no se ha ejecutado. Una prueba diseñada y no ejecutada se marca «no ejecutada».
- Las evidencias no contienen secretos ni datos reales de clientes.
- Si una comprobación no se puede hacer en esta máquina (por ejemplo, pgTAP sin Docker), se dice y se indica dónde se hará.

## Gravedad de los hallazgos

| Gravedad | Significado | Efecto |
| --- | --- | --- |
| BLOQUEANTE | Incumple la constitución, rompe el aislamiento, expone secretos o datos, o no cumple un `CA-` | No pasa la puerta |
| MAYOR | Defecto real con solución conocida que no llega a bloqueante | Se corrige antes de cerrar, o el responsable acepta el riesgo por escrito |
| MENOR | Mejora de claridad, estilo o mantenimiento | Se anota; se corrige si es barato |

Cada hallazgo cita archivo y línea, el requisito o artículo afectado y la prueba que lo demostraría.

## Definición de terminado

Una tarea está terminada cuando:

1. Enlaza con su requisito y su contrato.
2. Tiene prueba automática, escrita antes o a la vez que el código, y está en verde.
3. Ha pasado la revisión independiente, y la de seguridad si toca una ruta crítica.
4. No añade texto libre, secretos ni identificadores de cliente como entrada.
5. Tiene evidencia guardada.
6. La documentación afectada está actualizada.

Una función está terminada cuando todas sus tareas lo están, todos sus `CA-` tienen evidencia y el responsable ha abierto la puerta P7.

## Comprobador

`node scripts/comprobar-specs.mjs` comprueba lo que se puede comprobar sin ejecutar la aplicación:

- Archivos obligatorios del arnés presentes y no vacíos.
- Contratos con JSON válido.
- Cada función: estado válido, al menos un `REQ-` y un `CA-`, y, según su estado, que cada `REQ-` aparezca en `tareas.md` y cada `REQ-` y `CA-` en `verificacion.md`.
- Agentes y skills con cabecera válida y solo campos conocidos.
- Estados válidos en el registro de decisiones.
- Criterios de aceptación en las siete fases del plan.
- Ningún patrón de secreto en el repositorio.

Es un control documental. No prueba seguridad ni comportamiento.
