# T-008 · Evidencia de integración (22/11/2026)

Rama `tarea/010-T-008` rebasada sobre `main` (c53728f), en su copia de trabajo, con candado de suite y `esperar-memoria.sh 4000` (4110 MB libres). El primer intento de la suite lo mató el sistema por memoria baja; el segundo (regla D) terminó.

| Comprobación | Resultado |
| --- | --- |
| `npx vitest run --maxWorkers=2` (suite completa) | 110 de 110 archivos, 3400 de 3400 pruebas superadas |
| `npm run tipos` | 0 |
| `npm run estilo` | 0 |
| `npm run aislamiento` | 45 de 45 |
| `node scripts/comprobar-specs.mjs` | SUPERADO |
| Build (carpeta principal, tras el squash ce2f70c) | FALLÓ en el primer intento (salida 1): `pgtap.ts` no encuentra `@electric-sql/pglite-pgtap`, que falta en el `node_modules` de la carpeta principal. Se instala con `npm ci --ignore-scripts` y se reintenta (resultado abajo) |

pgTAP en CI (`supabase test db`): NO ejecutado, queda para T-013. Lo ejecutado es el mismo SQL de 01 (36) y 07 (30) contra PGlite con `@electric-sql/pglite-pgtap` 0.0.18.

**Build, reintento (22/11/2026):** tras `npm ci --ignore-scripts` en la carpeta principal (0 vulnerabilidades; ya está `@electric-sql/pglite-pgtap`), `npm run build` con candado y `esperar-memoria.sh` (4475 MB libres): salida 0, comprobada en el resultado del comando.
