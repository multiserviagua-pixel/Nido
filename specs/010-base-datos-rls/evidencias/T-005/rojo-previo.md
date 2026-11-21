# T-005 · Rojo previo (21/11/2026)

Prueba escrita antes que la migración: `supabase/tests/pglite/m07.test.ts`, sin `supabase/migrations/…_reglas_de_acceso.sql` ni su reversión.

Comando (rama `tarea/010-T-005`, sobre `main` 9e629f1, `node_modules` por junction):

```
npx vitest run supabase/tests/pglite/m07.test.ts --maxWorkers=3 --config vitest.config.ts
```

Resultado: `Test Files 1 failed (1)`, `Tests 56 failed | 2 passed (58)`, 191 s.

- 56 fallan con `No hay migración reglas_de_acceso` (el arnés no encuentra el archivo): ninguna comprobación de comportamiento llega a ejecutarse.
- Las 2 que pasan lo hacen por vacuidad, porque «no hay migración» ya es un error: «M07 sin M06 falla y no deja nada» y «si queda una concesión ajena en una tabla, M07 falla entera y no cambia nada». Con la migración presente (verde) dejan de ser vacuas.

Esto es el rojo previo del requisito «prueba delante»; no demuestra nada del comportamiento. El verde está en `verde.md`.

## Aclaración honesta (revisor, menor 3; 21/11/2026)

El rojo previo contó 58 pruebas y el verde 59: una prueba se añadió después del rojo, sin rojo previo propio, durante la implementación (no se anotó cuál en su momento; el rojo y el verde cuentan pruebas, no las comparan por nombre). Esa prueba nunca se vio fallar sin la migración. Las pruebas de la vuelta de revisión (70 en total) tampoco tuvieron rojo previo como conjunto: se escribieron junto a la corrección; su valor se demuestra con mutaciones locales de la migración y la reversión (ver `verde.md`, sección «Vuelta de revisión»), no con un rojo previo.
