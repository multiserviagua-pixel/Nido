# 033 · Propuestas para coordinación

Cambios que esta función necesitaría en documentos compartidos. El chat de la fase 4 no los edita: los anota aquí para el chat de coordinación. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 4, a partir del informe del `especificador`.

## Contradicciones que necesitan decisión del responsable

| N.º | Contradicción | Dónde | Cómo la trata la 033 |
| --- | --- | --- | --- |
| 1 | El plan pone en la fase 4 un piloto con cifras de un cliente real. Solo producción admite datos reales, y la publicación en producción (B-003) está BLOQUEADA hasta la fase 6. Faltan además la política de privacidad y los acuerdos con los proveedores, que son de la fase 6 | `docs/PLAN.md` (fases 4 y 6), `docs/TECNOLOGIAS.md` (B-003), `docs/ARQUITECTURA.md` (entornos) | Condición previa con autorización expresa (REQ-004) y cuestión abierta 8 |
| 2 | La 1.3 (función 012) no escribe en la carpeta `panel` y prohíbe que un archivo de la nube cambie las instrucciones. El piloto necesita que la misma revisión deje el archivo de salud y envíe el informe. Con dos agentes en la cuenta las cifras nunca coincidirían | `docs/PLAN.md` (fase 2), función 012 (cuestión 24) | Exige un solo agente (REQ-013) y una versión de paralelo (REQ-014 a REQ-018). Cuestiones 6 y 7. Propuesta de la fase 4: una versión posterior a la 1.3 que solo añade la escritura del archivo de salud si existe la carpeta, sin obedecer archivos de órdenes |
| 3 | El arranque local prohíbe tocar la nube sin instrucciones válidas. Con el conector caído, el camino antiguo ya no puede dejar un archivo de salud en `error`, como hace hoy la 1.2 | ADR-0004, función 012 | Cuestión 12. Propuesta: no se escribe; el fallo se ve por las alertas |
| 4 | `docs/CALIDAD.md` prohíbe datos reales de clientes en las evidencias, y el criterio del plan pide demostrar que las cifras coinciden | `docs/CALIDAD.md`, `docs/PLAN.md` | Evidencias con «coincide» o «difiere» por campo y totales, sin valores (REQ-034). Cuestión 15 |
| 5 | Los objetivos de servicio se fijan «en la fase 4, con datos reales», pero un solo cliente da una muestra pequeña y la disponibilidad mensual pide al menos un mes | `docs/ARQUITECTURA.md` | Cuestión 11. La 033 mide y propone; fija el responsable |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/TECNOLOGIAS.md` | Una decisión nueva, acotada, para el piloto con un cliente real antes de B-003 (si el responsable elige esa vía), con la lista de puntos de publicación exigidos antes | Contradicción 1 |
| `docs/PLAN.md`, fase 4 | Precisar cómo se demuestra «las cifras coinciden» sin datos reales en las evidencias; anotar la relación con B-003 y con la versión de paralelo; añadir las cuatro funciones a «Funciones previstas» | Contradicciones 1, 2 y 4 |
| `docs/INSTALACION-CLIENTE.md` | Sacarla de borrador con los resultados de la fase 1; añadir la variante «instalación en paralelo» y el procedimiento de vuelta atrás a solo carpeta `panel` | REQ-003, REQ-011 y REQ-045 de la 033 |
| `.claude/skills/version-prompt/SKILL.md` y regla de `prompts/` | Decir cómo se trata una versión que escribe en la carpeta `panel` durante la transición, y que ese apartado se conserva hasta que la fase 6 retire la carpeta | Contradicción 2 |
| `docs/ARQUITECTURA.md` | Decir que el piloto corre en producción; fijar los objetivos de servicio cuando el responsable decida | Contradicciones 1 y 5 |
| Función 012 (fase 2) | Su cuestión 24 y las cuestiones 6 y 7 de la 033 son la misma decisión: conviene una sola respuesta | Contradicción 2 |
| Función 052 (fase 6) | Valorar si hace falta adelantar el encargo de tratamiento con el cliente piloto y el registro de actividades | Cuestión 8 de la 033 |
