# 018 · Aclaraciones

Cuestiones de `especificacion.md`. Las dos las fija la coordinación por delegación expresa (D-036, 21/11/2026), a la vista del dictamen del `auditor-seguridad` (`dictamen-especificacion-1.md`), con la opción restrictiva. El responsable puede revocarlas.

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto |
| --- | --- | --- | --- | --- |
| 1 | ¿El arranque necesita el visto bueno del dueño? | A. Solo en conversación y con el visto bueno del dueño. Motivo: es la única revisión humana del arranque; la B (también desatendido) empeora el riesgo de fórmulas envenenadas y no debe decidirse por delegación | Coordinación por delegación (D-036), 21/11/2026 | REQ-008, CA-007 |
| 2 | ¿Se ve en los paneles de HumanaIA si cada cliente tiene aprendizaje? | A. No llega nada a HumanaIA. Motivo: cumple el artículo 1 sin cambiar el contrato; la B cambiaría `contratos/` y necesitaría su propia revisión de privacidad | Coordinación por delegación (D-036), 21/11/2026 | REQ-013, CA-012 |

## Enmienda 1 (21/11/2026)

No es una respuesta del responsable: es una decisión de la coordinación por delegación (D-036), a la vista de `verificacion-gmail-outlook.md` de la 016 (D6). El responsable puede revocarla. La aceptación del riesgo residual sigue pendiente de él y no cambia.

| Asunto | Decisión | Efecto |
| --- | --- | --- |
| Procedencia (D6) | Mismas restricciones que la 016: quién escribió (NC-2) y quién cambió una etiqueta; si no se distingue, no cuenta (R-2) | REQ-001, REQ-019 |
| Visto bueno y pausa (D6) | Solo en el estado de la compuerta, por la vía protegida. El arranque se sigue pidiendo en conversación (cuestión 1); su visto bueno pasa a la vía protegida | REQ-008, REQ-012, REQ-021 |
