# T-002 · Dictámenes (20/11/2026)

| Vuelta | Quién | Veredicto | Hallazgos | Cierre |
| --- | --- | --- | --- | --- |
| 1 | `revisor` | APTO CON CONDICIONES | 0 bloqueantes, 0 mayores. M-1 (exclusión por tabla en la prueba de columnas de texto), M-2 (USAGE de PUBLIC en los 17 tipos), M-3 (rama `migracion_concesiones_ajenas` sin prueba), M-4 (comentario), M-5 (`MODELO-DATOS.sql` desalineado, propuesta 20) | M-1 a M-4 en 4ecc3cb y d0b67dd. M-5 queda para el cierre de la función o T-015 |
| 1 | `auditor-seguridad` | APTO CON CONDICIONES | 0 bloqueantes, 0 mayores. MENOR 1 (= M-2), MENOR 2 (`clientes.nombre` y `catalogo_problemas.descripcion` admiten caracteres de control y bidireccionales), MENOR 3 (registro dinámico OAuth, fase 3) | MENOR 1 en d0b67dd. MENOR 2 al `arquitecto` (D-7) antes de M04; MENOR 3 a la fase 3 |
| 2 | `auditor-seguridad` | APTO | 0 bloqueantes, 0 mayores, 0 menores nuevos | — |

Pendiente para tareas posteriores: M07 debe conceder `USAGE` explícito en los tipos que cada rol necesite (hoy ninguno lo tiene); observaciones sobre `tokens` (`sustituido_por`) para M08.

No se ejecutó pgTAP ni nada contra Supabase real: solo el arnés PGlite. Integración por delegación D-036 el 20/11/2026, revocable por el responsable.
