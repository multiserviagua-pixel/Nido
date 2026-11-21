# T-007 · Verde (21/11/2026)

Rama `tarea/010-T-007`, sobre `main` a702bef, en su copia de trabajo.

- `npx vitest run supabase/tests/pglite/seed.test.ts --maxWorkers=2`: 43 pasan, 0 fallan (18 s).
- `npx vitest run tests/unit/bd --maxWorkers=2`: 4 archivos, 165 pasan (30 de `seed-config.test.ts`: L 3 y L 9).
- `npx eslint` de los dos archivos de prueba y `npx tsc --noEmit`: sin salida.
- `node scripts/comprobar-specs.mjs`: SUPERADO.
- Primera ejecución con los archivos creados: 2 fallos, ambos de la prueba y no del seed: `usuarios_cliente` no tiene fila de C (C no tiene usuario por diseño) y la prueba de `config.toml` leía también los comentarios. Corregidas las pruebas.

No ejecutado aquí: pgTAP, `supabase start`, la CLI con este `config.toml`, `psql` real (el procedimiento y los archivos se ejecutan en PGlite con las interpolaciones sustituidas), ni la carga en CI o en `Nido`. Suite completa, estilo global y build, en la integración.
