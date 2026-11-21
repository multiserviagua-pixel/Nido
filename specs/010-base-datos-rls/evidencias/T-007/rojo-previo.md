# T-007 · Rojo previo (21/11/2026)

Pruebas escritas antes que el seed, el volumen, el procedimiento, la guía y `config.toml`:
`tests/unit/bd/seed-config.test.ts` (L 3 y L 9) y `supabase/tests/pglite/seed.test.ts`.

Comando (rama `tarea/010-T-007`, sobre `main` a702bef):

```
npx vitest run tests/unit/bd/seed-config.test.ts supabase/tests/pglite/seed.test.ts --maxWorkers=2
```

Resultado: `Test Files 2 failed (2)`, `Tests 32 failed | 3 passed | 9 skipped (44)`, 6,6 s.
Los fallos son `ENOENT`: los archivos no existen. Las 3 que pasan no leen archivos
(el lector de TOML con un esquema de más y dos de apoyo); las 9 omitidas dependían de un `beforeAll` fallido.
Es solo el rojo de «prueba delante»; el verde está en `verde.md`.
