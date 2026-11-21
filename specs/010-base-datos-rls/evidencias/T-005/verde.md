# T-005 · Verde (21/11/2026)

Rama `tarea/010-T-005` rebasada sobre `main` f108bb8 (commit de trabajo 0baed37), `node_modules` por junction.

```
npx vitest run supabase/tests/pglite/m07.test.ts --maxWorkers=2
```

Resultado: `Test Files 1 passed (1)`, `Tests 59 passed (59)`, 216 s.

Frente al rojo previo (`rojo-previo.md`: 56 fallan de 58 por falta de migración), las 59 pasan con `20261120000700_reglas_de_acceso.sql` y su reversión. Las dos que pasaban por vacuidad ya se ejecutan con la migración presente.

Pendiente antes de integrar: dictamen del `revisor` y del `auditor-seguridad` (`dictamenes.md`) y `npm run verificar` completo.

## Vuelta de revisión (hallazgos M-1 y M-2 del revisor; 21/11/2026)

Cambios: comprobación final de M07 ampliada con la ACL del esquema `privado` (solo el dueño y `usage` sin opción de concesión para `authenticated`; cubre PUBLIC y `conector_prueba`); la reversión comprueba por `pg_depend` que lo único que depende de `es_admin()` y `fijar_autoria()` son las políticas y el disparador de M07 por nombre, y falla (`reversion_dependientes_ajenos`) antes de borrar nada si hay otro dependiente; 11 pruebas nuevas en `m07.test.ts` (70 en total) y aserciones nuevas (lista exacta de las 6 funciones, misma `revocada_en` escrita, auditoría de la orden de AD2, ACL entera de `privado`).

```
npx vitest run supabase/tests/pglite/m07.test.ts --maxWorkers=2
npx vitest run tests/unit/bd --maxWorkers=2
```

Resultado: m07 `Tests 70 passed (70)`, 126 s; `tests/unit/bd` (L 10, L 13, L 14 y estáticas) `Tests 135 passed (135)`.

Mutaciones locales (deshechas; la migración y la reversión del commit son las originales con la corrección):
- Rama de columnas de la comprobación final anulada (`or false and exists`): fallan las 3 pruebas «rama de columnas» (rol ajeno, `conector_prueba` y concedente ajeno por columna).
- Rama de funciones anulada: falla la de `alter default privileges … in schema privado … to conector_prueba`.
- Rama del esquema anulada: fallan las 2 de «rama de esquema» (`conector_prueba`/PUBLIC y con opción de concesión).
- Comprobación de dependientes de la reversión anulada: fallan las 4 pruebas con dependiente ajeno (vista, política, disparador, restricción).

Límite anotado (M-1 c): la prueba de «concesión ajena de tabla con otro concedente» muere antes en el bucle (`dependent privileges exist`), y ahora lo afirma con ese mensaje; no ejerce la comprobación final. Los términos «el concedente no es el dueño» (tabla, columna y función) no tienen caso alcanzable que los distinga del término del destinatario (el concedente figura siempre como destinatario ajeno); quedan como defensa en profundidad sin prueba propia.

Decisión sobre el `cascade` de la reversión (21/11/2026, por D-036): aceptado como excepción expresa limitada a `es_admin()` y `fijar_autoria()`, con el dictamen del `auditor-seguridad` y anotada en D-1 de `diseno.md`. No se toca el detector L 10.

Ejecutado por el ingeniero-bd en esta rama (b0d2128): `m07.test.ts` 70 pasan (126 s); `tests/unit/bd` 135 pasan; `m01.test.ts` (usa `aplicarTodas`, con M07 dentro) 70 pasan (238 s; el archivo tiene bucles, por eso la cifra coincide con la de m07, y no se ha cotejado `it` a `it`).
Ejecutado por el auditor-seguridad: `m07.test.ts` 70 pasan (212 s).
No ejecutado: pgTAP (CI, T-013). El revisor no pudo ejecutar la suite en su 2.ª vuelta (falta de memoria) y se apoyó en estos resultados.
