# T-124 · Resultado de la evidencia completa (21/11/2026)

Ejecutada en la copia `.claude/worktrees/t-124`, rama `tarea/T-124` (último commit c7aa5ac), con el candado de suite, `scripts/esperar-memoria.sh 4000` y `--maxWorkers=2`.

| Orden | Código |
| --- | --- |
| `npx vitest run --maxWorkers=2` | 0 (103 archivos, 3231 pruebas superadas) |
| `npm run tipos` | 0 |
| `npm run estilo` | 0 (tras quitar dos avisos de eslint de `supabase/tests/pglite/m08_m10.test.ts`, de la 010, en c7aa5ac) |
| `npm run aislamiento` | 0 |
| `npm run arnes` | 0 |
| `npm run build` | 0 |
| `git diff --exit-code AGENTS.md` tras el build | 0 (no cambia) |

Salidas en este mismo directorio (`vitest.txt`, `tipos.txt`, `estilo.txt`, `aislamiento.txt`, `arnes.txt`, `build.txt`, `agents-md.txt`, `codigos.txt`).

No comprobado: la pasada se hizo sobre la base de la rama anterior a la integración en `main` de T-123 (b) y T-117 (a) (cambios de SQL, una prueba y documentos, sin relación con los archivos de T-124); se rebasa antes de integrar.

Revisor: APTO CON MENORES. Auditor-seguridad (2 vueltas): APTO CON CONDICIONES, sin bloqueantes (informes en este directorio). Menores abiertos aceptados: línea `* @multiserviagua-pixel` primera en CODEOWNERS y exigirla en la prueba; escanear `.github/` entero en `acciones-fijadas.test.ts`; `cooldown` de Dependabot.
