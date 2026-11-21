# T-006 · Verde (21/11/2026)

Rama `tarea/010-T-006` rebasada sobre `main` f6f1e07, en su copia de trabajo.

- `npx vitest run supabase/tests/pglite/m08_m10.test.ts --maxWorkers=2`: 57 pasan, 0 fallan (77 s). Primera ejecución tras el rebase: 2 fallos, ambos de la prueba y no de las migraciones: la semilla crea la orden OA como `reanudar` y la prueba esperaba `pausar`; PGlite escribe `proconfig` como `{"search_path=pg_catalog, pg_temp"}` y la prueba comparaba otra forma. Corregida la prueba, migraciones sin cambios.
- `npx vitest run tests/unit/bd --maxWorkers=2`: 3 archivos, 135 pasan (L 10, L 13 y L 14 incluidas, sobre las migraciones nuevas).
- `node scripts/comprobar-specs.mjs`: SUPERADO.
- Suite completa, tipos, estilo y build: se ejecutan en la integración (ver `integracion.md`).
