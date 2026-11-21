# T-006 · Rojo previo (21/11/2026)

Prueba escrita antes que las migraciones: `supabase/tests/pglite/m08_m10.test.ts`, sin `supabase/migrations/…_funciones_conector.sql`, `…_vistas.sql` ni `…_datos_de_referencia.sql`, ni sus reversiones.

Comando (rama `tarea/010-T-006`, sobre `main` 1a91bf6, `node_modules` por junction):

```
npx vitest run supabase/tests/pglite/m08_m10.test.ts --maxWorkers=2
```

Resultado: `Test Files 1 failed (1)`, `Tests 55 failed | 2 passed (57)`, 128 s.

- 55 fallan con `No hay migración funciones_conector` (o `vistas`, `datos_de_referencia`): el arnés no encuentra el archivo y ninguna comprobación de comportamiento llega a ejecutarse.
- Las 2 que pasan lo hacen sin migración: «los códigos del catálogo son los del contrato del informe» (solo lee `contratos/informe.schema.json` y un listado fijo) y «M09 sin M06 falla y no deja nada», que pasaba por vacuidad (la búsqueda del nombre de M09 estaba dentro del `errorDe`, y «no hay migración» ya es un error). Esta segunda se corrigió después del rojo: ahora obtiene el nombre fuera del `errorDe` y exige que el error mencione `informes`, así que ya no puede pasar sin la migración.

Esto es el rojo previo del requisito «prueba delante»; no demuestra nada del comportamiento. El verde está en `verde.md`.

Nota honesta: el rojo se anotó desde la salida de la primera ejecución completa, lanzada antes de crear el archivo de M08. Entre esa ejecución y el verde se corrigieron en la prueba (sin tocar las migraciones) los errores de la propia prueba que se vieron al ejecutarla (órdenes de la semilla, cuentas de campos descartados, orden de las claves JSON, comparación de la fila de `ajustes_globales`, que lleva la hora de su inserción).
