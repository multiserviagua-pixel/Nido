# T-006 · Dictámenes (21/11/2026)

## Revisor (1.ª vuelta): APTO CON MENORES
Sin bloqueantes ni mayores. 8 menores: 2, 3, 4, 7 y 8 corregidos en 36937d5 (`menores-revisor.md`); 1 (traspasos «fase 3» → 014 y 011, avisos), 5 (validación del informe) y 6 (`error_interno` sin diagnóstico) anotados en `propuestas.md` n.º 35 a 37 y en `diseno.md`, Decisiones de T-006, 12. Condiciones de T-005 cumplidas con prueba: estado `activo` en cada llamada, reversiones sin `cascade`, vistas sin `creada_por` ni `estado_manual`, transiciones de `ordenes` repetidas.

## Auditor-seguridad (1.ª vuelta): APTO CON CONDICIONES
0 bloqueantes, 1 mayor, 6 menores. Condición: MAYOR 1 (la entrega de una orden pisaba una anulación concurrente) corregido, junto con MENOR 2 (`for share`) y MENOR 5 (`has_*_privilege`, pertenencia en ambos sentidos), en 5c1b41d (`mayor-auditor.md`); verificado por la coordinación leyendo el diff y con la prueba en verde (70 de 70). Anotados: MENOR 3 (`tokens.recurso`, propuesta 38), 4 (propuesta 35), 6 y 7 (propuesta 39). Sin segunda vuelta del auditor: el cambio es acotado a lo que su condición pedía y sus pruebas cierran el caso; el responsable puede revocarlo (D-036).

## Sin comprobar
pgTAP (CI, T-010/T-011/T-013); concurrencia real (PGlite tiene una sola conexión; las carreras se simulan con disparadores); supervisión de errores capturados en Nido (T-014).
