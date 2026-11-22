# T-009 · Evidencia de integración (22/11/2026)

Rama `tarea/010-T-009` rebasada sobre `main`, en su copia de trabajo, con candado de suite y `esperar-memoria.sh 4000` (6242 MB libres en el intento que terminó). El primer intento de la suite lo mató el sistema por memoria baja; el segundo (regla D) terminó.

| Comprobación | Resultado |
| --- | --- |
| `npx vitest run --maxWorkers=2` (suite completa) | 119 de 120 archivos; 3761 pruebas superadas, 9 omitidas, 1 fallida |
| El fallo único | `tests/unit/plataforma/trazado.test.ts` (traza de `next build` de `/api/mcp`): ejecuta `next build` dentro de la copia de trabajo y Turbopack no encuentra `next/package.json` por el junction a `node_modules`. Limitación conocida de las copias de trabajo (igual en T-007), no de T-009. El `build` y esa prueba se comprueban en la carpeta principal tras el squash |
| `npm run tipos` | 0 |
| `npm run estilo` | 0 |
| `npm run aislamiento` | 45 de 45 |
| `node scripts/comprobar-specs.mjs` | SUPERADO |
| Build y `trazado.test.ts` (carpeta principal, tras el squash 9cd0855) | `npm run build`: salida 0 (5301 MB libres). `trazado.test.ts`: 7 de 7, salida 0 (4990 MB libres). Con esto el único fallo de la copia de trabajo queda explicado y resuelto |

pgTAP en CI (`supabase test db`): NO ejecutado, queda para T-013. Lo ejecutado es el mismo SQL de 01 (38), 02 (844) y 07 (30) contra PGlite con `@electric-sql/pglite-pgtap` 0.0.18.
