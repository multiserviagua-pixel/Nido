# T-003 · Rojo previo (20/11/2026)

Comandos ejecutados en el worktree de `tarea/010-T-003`, con PGlite (no es pgTAP).

## TP (D-7): M02 de `main` frente a las pruebas TP

Se sustituyó temporalmente `20261120000200_clientes_y_acceso.sql` por la de `main` (`git show main:...`):

`npx vitest run supabase/tests/pglite/m02_m03.test.ts -t "D-7 \(TP\)"`

Resultado: 3 fallan, 55 omitidas.
- clientes.nombre: insert y update rechazan los caracteres de D-7 y aceptan el resto
- catalogo_problemas.descripcion: insert y update rechazan los caracteres de D-7 y aceptan el resto
- M02 falla con migracion_codificacion_no_utf8 si el servidor no usa UTF8, y no deja nada

Con la M02 de la rama el mismo comando da 3 en verde.

## M04 y M05: no existen en `main`

`git ls-tree -r main --name-only | grep -E "migrations/2026112000(04|05)"` no devuelve nada: sin esas migraciones no hay `auditoria`, `versiones_prompt` ni `publicaciones`, y `m04_m05.test.ts` no puede pasar.

## Correcciones de la vuelta 1 del revisor (MAYOR-1, MENOR-3, MENOR-4)

Con las migraciones M04 y M05 de HEAD (sin las correcciones) y las pruebas nuevas:

`npx vitest run supabase/tests/pglite/m04_m05.test.ts`

Resultado: 3 fallan, 34 en verde.
- una escritura como authenticated en cada tabla de M02 deja 1 fila (conexiones: toda escritura se audita, MENOR-3)
- una tabla homónima de otro esquema falla con auditoria_tabla_no_prevista (MENOR-4)
- con todo concedido por defecto en secuencias a conector_prueba, las secuencias nacen sin su permiso (MAYOR-1)

Con las correcciones, 37 en verde.
