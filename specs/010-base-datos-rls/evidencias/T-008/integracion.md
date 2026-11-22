# T-008 · Evidencia de integración (22/11/2026)

Rama `tarea/010-T-008` rebasada sobre `main` (c53728f), en su copia de trabajo, con candado de suite y `esperar-memoria.sh 4000` (4110 MB libres). El primer intento de la suite lo mató el sistema por memoria baja; el segundo (regla D) terminó.

| Comprobación | Resultado |
| --- | --- |
| `npx vitest run --maxWorkers=2` (suite completa) | 110 de 110 archivos, 3400 de 3400 pruebas superadas |
| `npm run tipos` | 0 |
| `npm run estilo` | 0 |
| `npm run aislamiento` | 45 de 45 |
| `node scripts/comprobar-specs.mjs` | SUPERADO |
| Build | pendiente en la carpeta principal tras el squash |

pgTAP en CI (`supabase test db`): NO ejecutado, queda para T-013. Lo ejecutado es el mismo SQL de 01 (36) y 07 (30) contra PGlite con `@electric-sql/pglite-pgtap` 0.0.18.
