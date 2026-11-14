# 051 · Propuestas para el chat de coordinación

Cambios que esta función necesitaría fuera del rango 050 a 059. El chat de la fase 6 no los aplica: los anota aquí para que los valore el chat de coordinación (documentos compartidos) o el chat de la fase dueña del archivo.

Estado de todas: **PROPUESTA**, sin aplicar. Varias dependen de las respuestas del responsable en `aclaraciones.md`.

Fecha: 12/11/2026 · Origen: especificación de la función 051 e informe del `especificador`.

## Documentos compartidos

| N.º | Archivo | Qué se propone | Motivo |
| --- | --- | --- | --- |
| P-01 | `docs/PLAN.md`, tabla «Reparto en chats» | Añadir que la función 051 no puede completarse hasta que las fases 4 y 5 aporten sus evidencias, aunque el resto de la fase 6 pueda implementarse con las fases 2 y 3 cerradas | La lista de publicación exige pausa global, vuelta atrás del prompt y avisos fuera del panel (fase 4) y la prueba de extremo a extremo de acceso cruzado (fase 5) |
| P-02 | `docs/PLAN.md`, fase 4 | Aclarar qué es el cliente piloto: hoy funcionaría en producción con datos reales antes de que el responsable autorice la publicación (B-003) | Contradicción con B-003. Depende de la cuestión 10 |
| P-03 | `docs/ARQUITECTURA.md`, «Entornos» | Decir con qué datos y en qué entorno se prueba la restauración de una copia. Hoy «ningún dato real sale de producción» choca con «copia restaurada con éxito en un entorno de prueba» | Depende de la cuestión 4 |
| P-04 | `docs/CALIDAD.md`, «Gravedad de los hallazgos» | Añadir la correspondencia con la escala de los escáneres y de la lista de publicación: crítico y alto equivalen a BLOQUEANTE, medio a MAYOR y bajo a MENOR | Hoy conviven dos escalas. Cuestión 2 |
| P-05 | `docs/ARQUITECTURA.md`, «Objetivos de servicio» | Asignar quién los fija y cuándo. Dice «se fijan en la fase 4, con datos reales», pero no figura en los criterios de la fase 4 | Cuestión 14 |
| P-06 | `docs/SEGURIDAD.md`, amenazas | Añadir la amenaza «una restauración devuelve accesos revocados después del punto de la copia» (conexiones, licencias, administradores, versión del prompt) con su control | No está contemplada. La especificación la cubre con dos requisitos |
| P-07 | `docs/SEGURIDAD.md`, lista de publicación, y `docs/PLAN.md` | Asignar a una fase el «límite de intentos en inicio de sesión». El plan y la amenaza A-02 solo asignan el de activación (fase 2) | Ese punto llegaría a la publicación sin evidencia. Candidatas: fase 3 (acceso superadmin) y fase 5 (acceso cliente) |
| P-08 | `docs/SEGURIDAD.md`, lista de publicación | Precisar qué significa «independiente» en la revisión de seguridad final, dado que el `auditor-seguridad` ya dictamina cada cambio en rutas críticas | Depende de la cuestión 1 |

## Otras fases

| N.º | Fase | Qué se necesita |
| --- | --- | --- |
| P-09 | 1 (001 a 009) | Que el escáner de secretos del CI se ejecute sobre todo el historial, como pide la lista de publicación, y no solo sobre el último cambio |
| P-10 | Todas | Que las evidencias de cada fase se guarden con los campos de `docs/CALIDAD.md` (commit, prueba, fecha, entorno, comando, resultado, revisor). La 051 las enlaza, no las repite |
| P-11 | 4 (030 a 039) | Que el aviso fuera del panel (V-111) pueda usarse también para las alertas del propio servicio, o decir que no, para que el diseño de la 051 elija otro canal |
