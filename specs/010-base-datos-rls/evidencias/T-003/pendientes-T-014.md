# T-003 · Pendientes para T-014 (20/11/2026)

N-8 (MENOR del auditor, vuelta 2): la marca `app.reversion_protegida` que permite la reversión de las tablas protegidas solo debe existir en el ciclo de CI. Un `alter database ... set app.reversion_protegida = ...` o un `alter role ... set app.reversion_protegida = ...` la haría permanente en el entorno.

T-014 debe comprobar, en cada entorno que reciba las migraciones, que `pg_catalog.pg_db_role_setting` no fija `app.reversion_protegida` (ni para la base ni para ningún rol) y fallar si aparece.
