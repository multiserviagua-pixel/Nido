# T-111 · Resultado de la evidencia (22/11/2026)

Copia `.claude/worktrees/t-111`, rama `tarea/T-111` rebasada sobre `main`, con candado de suite, `esperar-memoria.sh 4000` y `--maxWorkers=2`. Un primer intento lo mató el sistema por memoria baja; se repitió (regla D).

| Orden | Código |
| --- | --- |
| `npx vitest run --maxWorkers=2` (antes de 21bbe6c) | 1: 3494 de 3495; el fallo era `manifiesto.test.ts` (no conocía los cuatro scripts nuevos) |
| tras 21bbe6c: `manifiesto`, `operar`, `ciclo` y `conector` (4 archivos) | 0: 168 de 168 |
| `npm run tipos` / `estilo` / `aislamiento` / `arnes` / `build` | 0 / 0 / 0 / 0 / 0 |
| `git diff --exit-code AGENTS.md` | 0 |

No comprobado: la suite completa no se repitió tras 21bbe6c (solo cambia ese archivo de prueba); nada se ha ejecutado contra `Nido`, Vercel ni una terminal real (todo con dobles inyectados y PGlite).

Dictámenes: revisor NO APTO (1 bloqueante, 3 mayores) corregido en e3e5bec; auditor-seguridad APTO CON CONDICIONES (1 mayor, 6 menores) aplicado en 6c92473, sin segunda vuelta (límite de dos). Los dos informes constan en los mensajes de commit; riesgo aceptado: la confirmación del destino (`SI`) solo protege si la persona lee el host.
