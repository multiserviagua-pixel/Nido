# T-003 · Mutación del detector de D-11

Fecha: 20/11/2026. Archivo: `tests/unit/bd/estaticas.test.ts`, función `seccionesDeclareValidas`.

- Mutación: el bucle valida solo las dos primeras secciones `declare` (`n++ < 2`).
- Resultado con la mutación: la prueba «se rechaza toda sección declare con otro tipo…» falla (el caso de tres secciones, con `w text` en la tercera, se acepta). Las demás, en verde.
- Resultado sin la mutación (código final): `npx vitest run tests/unit/bd/estaticas.test.ts`, 21 de 21.
- Rojo previo al cambio: antes de ampliar el detector fallaban las dos pruebas nuevas de D-11 (los aceptados no se aceptaban y los ★ se aceptaban).
