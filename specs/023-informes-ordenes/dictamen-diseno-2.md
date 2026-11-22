# 023 · Dictamen de seguridad (vuelta 2, última)

Auditor: `auditor-seguridad` · 22/11/2026. Guardado por el orquestador a partir del informe del auditor. Ejecutado por el auditor: `node scripts/comprobar-specs.mjs` (SUPERADO) y dos comprobaciones en PGlite (PostgreSQL 18.7): un permiso por columna da `has_table_privilege = false` y `has_any_column_privilege = true`; `has_any_column_privilege(…, 'DELETE')` falla; un disparador `before delete` por fila salta con el borrado en cascada y `truncate` también se lo salta. No ejecutado: pgTAP ni nada contra `Nido`.

**Veredicto: APTO. 0 bloqueantes, 0 mayores, 3 menores nuevos.** Por seguridad se puede abrir la P1; los menores pasan a condiciones de tarea.

Nombres comprobados en M07 y M04: `ordenes_insert_admin`, `ordenes_update_admin`, `catalogo_problemas_insert_admin`, `catalogo_problemas_update_admin`, `ordenes_select_usuario`; permisos por columna de `ordenes` y `catalogo_problemas`; `ordenes_valores` (M07), `ordenes_auditar` y `catalogo_problemas_auditar` (M04). `informes` solo tiene `select`.

## Hallazgos de la vuelta 1

M-1, M-2, M-3 y m-1 a m-6: **corregidos** (M23-0 primera y con `catalogo_problemas`; T-015 (a) «aparte»; D-4b `security definer`; pausa sin visibilidad nula o `pausa_sin_visibilidad` con `coalesce(…, true)`; índice único de `creada_en`; D-4 sin borrado ni en cascada; validación del segmento en el manejador; PRUEBA-017 y 037 con `set role authenticated`).

## Menores nuevos (condiciones de tarea)

- **n-1 · `has_any_column_privilege` no admite `DELETE`** (art. 3; AM-39). `propuestas.md` P23-09 (d) y `diseno.md` ~602. Con `DELETE` la guarda da error y la migración de la 024 no se aplicaría, lo que empuja a quitarla. Corrección: `INSERT` y `UPDATE` con las dos funciones; `DELETE` solo con `has_table_privilege`. Prueba en la 024: con un `insert` de columna concedido a `authenticated` la migración falla sin cambiar nada; con todo retirado se aplica. Condición de: P23-09 (d) y la tarea de la 024.
- **n-2 · `truncate` no pasa por D-4** (arts. 3 y 11; AM-05). Solo el dueño tiene `TRUNCATE` (M07 hace `revoke all`), no es explotable por `authenticated`. Corrección: disparador `before truncate` por sentencia en `ordenes` que lo rechace, como `auditoria_sin_vaciado` de M04. Prueba: PRUEBA-017, `truncate` como dueño rechazado. Condición de: T-009.
- **n-3 · Cómo se decide la «visibilidad» en D-6** (art. 3; AM-11). El dueño de una tabla sin `force row level security` lo ve todo aunque no tenga `bypassrls`; si T-010 solo mira `rolbypassrls`, M08 recibe nulo y sirve siempre `pausada` (cierra en fallo, pero rompe la entrega). Tras M23-5 (DD-31), leer columnas no concedidas al usuario de cliente da error de permisos. Corrección: comprobar dueño de la tabla, superusuario o `bypassrls`, además de `es_admin()` y el predicado de `ordenes_select_usuario`; leer solo las columnas de P23-02. Prueba: caso positivo de PRUEBA-034 con el rol real de M08; caso del usuario de cliente con M23-5 en PRUEBA-016. Condición de: T-010.

## Fuera de la 023

P23-17 confirmado en M04: la migración de la 024 deja sin disparador de auditoría también a `clientes`, `usuarios_cliente`, `licencias`, `codigos_activacion`, `conexiones`, `reglas_cliente`, `ajustes_globales` y `administradores` (`20261120000400_auditoria.sql:188-226`), y en varias M07 mantiene la escritura directa de `authenticated`. Debe resolverlo el dictamen de la 024 antes de aplicar su migración. No bloquea la 023.

## No comprobado

Comportamiento de PostgreSQL 17 o anterior con el disparador diferido (PGlite es la 18); versión mayor de `Nido` y de CI (T-001, T-005); que la 024 acepte P23-09 (c) y (d); el predicado exacto de `ordenes_select_usuario` (T-P5); qué hace PostgREST cuando la confirmación falla por el disparador diferido (PRUEBA-031); la 011 y la 013, sin diseño; ninguna prueba pgTAP ejecutada.
