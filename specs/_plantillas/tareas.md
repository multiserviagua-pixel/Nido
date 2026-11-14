# NNN · Tareas

Cada tarea es pequeña, tiene un solo agente responsable y una prueba que dice cuándo está hecha. `[P]` marca las que pueden ir en paralelo porque no comparten archivos.

Estados: pendiente · en curso · en revisión · hecha · bloqueada.

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | … | REQ-001 | — | `ingeniero-backend` | PRUEBA-001 | pendiente |
| T-002 `[P]` | … | REQ-002 | T-001 | `ingeniero-bd` | PRUEBA-002 | pendiente |

## Escalados

Tareas que han subido de nivel de modelo o de esfuerzo, y por qué (`docs/EQUIPO.md`).

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
