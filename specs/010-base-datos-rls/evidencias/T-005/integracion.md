# T-005 · Integración en `main` (21/11/2026)

Rama `tarea/010-T-005` rebasada sobre `main` (00e8271) y fusionada con `merge --squash`. Aprobada por delegación D-036, 21/11/2026, revocable.

| Comprobación | Dónde | Resultado |
| --- | --- | --- |
| `npx vitest run --maxWorkers=3` | rama rebasada (worktree) | 2563 en verde. Solo falla `trazado.test.ts` (`next build` dentro del worktree, junction a `node_modules`: fallo de entorno). En la primera pasada, con la máquina más cargada, hubo 9 fallos y 7 errores que no se repitieron en la segunda; no se reprodujeron |
| `npm run tipos` | `main` tras el squash | exit 0 (tras borrar el `.next/dev` obsoleto de la carpeta principal) |
| `npm run estilo` | `main` | prettier exit 0; eslint exit 0 con `--ignore-pattern ".claude/worktrees/**"` (sin ese patrón ESLint recorre el `.next` de los worktrees ajenos y falla: fallo de entorno) |
| `npm run aislamiento` | `main` | exit 0 |
| `npm run arnes` | `main` | exit 0 |
| `npm run build` | `main` (tras `npm ci --ignore-scripts`) | exit 0 |

No se pudo comprobar: la prueba `trazado.test.ts` en `main` (no se lanzó una segunda suite completa por la memoria de la máquina).
