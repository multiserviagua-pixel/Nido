# T-009 · Dictámenes y su corrección

## Dictamen del `revisor` (22/11/2026): NO APTO, 1 MAYOR, 6 menores, 0 bloqueantes

Resumen fiel del encargo de corrección. La corrección está en los commits posteriores a `ae74428`; el rojo, en `rojo-previo.md`; el verde, en `verde.md`.

### R-M-1 (MAYOR; CA-005, REQ-007, REQ-008, REQ-012; artículos 3 y 13) · corregido

Las «X» de leer no veían un permiso por columnas que excluyera la columna del cliente, y las de modificar no veían un permiso sobre otra columna. Causa: `sonda_lectura` contaba por cliente con `filter (where <cl_expr> = …)` y nombraba `cliente_id` o `id` en los 11 objetos con reparto (un perfil con permiso sobre otras columnas recibía 42501 por la propia sonda); las sentencias `upd` tocaban una sola columna. Mutaciones del revisor sin efecto hasta entonces: M5, M4, M7 y M8.

Corrección: (1) la sonda obtiene primero `n` (`count(*)` no nombra columnas); (2) el reparto va en otro subbloque y, si falla tras salir `n`, anota `n=3;reparto=42501`; (3) con un 42501 la sonda anota si el rol tiene algún permiso (tabla o cualquier columna) y la «X» exige «sin permiso» en SS, CON y SR y, para los usuarios y el superadmin, donde AD2 tampoco tiene la operación (D-5 solo da a `authenticated` lo de AD2). Se aplica a las cuatro operaciones y no solo a leer y modificar (en insertar y borrar el permiso por columna es el mismo hueco); (4) para modificar se usa `has_any_column_privilege` en lugar de sondear otra columna; (5) M4, M5, M7 y M8 están en `matriz.test.ts` y declaradas en `verde.md` («Lo que 02 no ve»). Rojo: 8 fallos antes (4 de ellos de este hallazgo). Verde: las 4 mutaciones hacen fallar su celda.

### R-m-1 (menor) · corregido

«Un resultado que falta no pasa» no era cierto celda a celda: `is()` daba por iguales nulo y nulo (T y C de leer). F1: quitar `versiones_prompt` del bloque de sentencias dejaba pasar `AD2 · versiones_prompt · leer · T` y `SR · … · leer · T`. Corrección: `coalesce(…, 'sin_resultado')` en `pg_temp.actual`. F1 es ahora una prueba de `matriz.test.ts` y hace fallar las 36 celdas del objeto.

### R-m-2 (menor) · corregido en parte, declarado

En insertar y modificar, las celdas de UB y USV apuntaban siempre a filas de A (M13 y M16 solo hacían fallar a UA y UAB). Corrección: UA, UB, UAB, USV y AD1 repiten insertar y modificar sobre una fila de B (identificadores reescritos por `pg_temp.a_b`) y la celda exige el mismo resultado. M13 y M16 son mutaciones de `matriz.test.ts` y hacen fallar también a UB. **USV no falla con M13 ni M16**: no tiene cliente vinculado y esas políticas atan al usuario con su cliente; se declara en la mutación (`sobran`) y en `verde.md`.

### R-m-3 (menor) · corregido

Equivalencias mal atribuidas en `verde.md`. Cada referencia se verificó leyendo el archivo: negativo 1 en `m07.test.ts:681`; negativos 2 a 5 en `m06.test.ts:462` (sentencias en 476 a 479); 7 y 8 en `m07:686` y `m07:688`; 14: lo más cercano es `m07:687` (`ajustes_globales`), y el disparador lo prueba `m07:916` con el dueño; negativo 6: sin equivalente (`m07:622` es un `update`).

### R-m-4 (menor) · corregido

`grant select on public.metricas_version to conector` (M12) no lo veía nadie. Con la corrección de R-M-1 (3) falla `CON · metricas_version · leer · X`; M12 es una mutación de `matriz.test.ts`.

### R-m-5 (menor) · corregido

La columna «Archivos» de T-009 en `tareas.md` incluye `supabase/tests/pglite/{matriz.test.ts,pgtap.ts,pgtap.test.ts}`.

### R-m-6 (menor) · corregido

`verde.md`, «Cómo está hecho»: las celdas T y P son vacías por sí solas y solo las protege la precondición de la aserción REQ-057. Se añadieron como pruebas V1 (vaciar `ajustes_globales`) y V2 (quitar las suscripciones de B): REQ-057 falla en ambas.

## Pendiente

pgTAP en CI (`supabase test db`) sigue sin ejecutarse hasta T-013; todo lo anterior se ejecutó contra PGlite. Esta corrección vuelve a pasar por el `revisor` (nadie aprueba su propio trabajo) y, por ser ruta crítica, por el `auditor-seguridad`.

## Segundo dictamen del `auditor-seguridad` (22/11/2026): NO APTO, 0 bloqueantes, 5 MAYOR de pase falso reproducidos, 2 menores

Con 02 en 844/844 y 01 en 36/36 la base quedaba insegura. Cada hallazgo se probó primero con su mutación en `matriz.test.ts` o `pgtap.test.ts` (rojo en el commit 9038055: 15 de 101 fallan; `rojo-previo.md`) y después se corrigió. Todo se ejecutó contra PGlite; **pgTAP en CI no se ha ejecutado** (hasta T-013).

### A-M-1 (MAYOR; arts. 2 y 3; REQ-006, CA-005) · corregido

Ningún perfil tenía doble factor sin ser administrador: `es_admin()` reducida a `aal = 'aal2'` (A8) dejaba 02 y 01 en verde. Corrección: `pg_temp.como('USV')` lleva `aal2` (`ayudas/perfiles.psql`), sin cambiar ninguna letra esperada. Con A8 fallan las celdas de USV (`USV · clientes · leer · 0`, `USV · auditoria · leer · 0`, `USV · clientes · modificar · 0`) y no AD2.

### A-M-2 (MAYOR; art. 2) · corregido

Los perfiles nunca llevaban datos de sesión controlados por el usuario: una política por `user_metadata` (A9) dejaba todo en verde. Corrección: todo perfil con sesión (`authenticated`) lleva `user_metadata` y `app_metadata` hostiles (`cliente_id` = C y `es_admin` = true). Sin mutación, verde; con A9 fallan `UA · informes · leer · P`, `UB · …` y `USV · informes · leer · 0`. No se añadió la aserción opcional en 01 que exija que ninguna política ni función de `privado` mencione `metadata`: la prueba de comportamiento la sustituye para lo que hoy hay, y la búsqueda de texto en definiciones queda como mejora para T-011 (declarada).

### A-M-3 (MAYOR; REQ-005; arts. 2 y 3) · corregido

Las sondas de insertar nunca apuntaban a un cliente vinculado al perfil (`usuarios_cliente` insertaba en C; `licencias` y `reglas_cliente`, en el cliente sin licencia; `a_b` no reescribía esos). Con A5, A6 y A7 (`*_insert_admin` abiertas al propio cliente) un usuario daba de alta a otro en su cliente y todo seguía en verde. Corrección: columna `ins_propio` en las sentencias de esos tres objetos (la misma alta sobre el cliente A) y, para UA, UB, UAB, USV y AD1, dos sondas más (`insertarP` sobre A e `insertarPB` sobre B, reescrita con `a_b`) que deben dar el mismo resultado que la celda (42501, con permiso concedido; si la política lo dejara pasar saldría `ok:1` o 23505 y la celda fallaría igualmente). Con A5, A6 y A7 fallan las celdas de UA, UB y UAB; USV no (no tiene vínculo, declarado en la mutación). `suscripciones` no se añadió: sus altas dependen del permiso, que la «X» ya exige sin permiso.

### A-M-4 (MAYOR; art. 3) · corregido en 02 y en 01

Al conector le podían dar TRUNCATE, REFERENCES, TRIGGER o MAINTAIN sin que nada fallase. Corrección, las dos vías: (1) 02: la celda «borrar» de cada perfil añade `;otros=` con los permisos TRUNCATE, REFERENCES, TRIGGER y MAINTAIN del rol del perfil (o de PUBLIC) sobre el objeto, en la tabla o en una columna, calculados con `aclexplode` (`pg_temp.privilegios_extra`), y lo esperado es vacío; sin añadir aserciones (siguen 844). (2) 01: N-4 (j), instantánea vacía del conector en tablas, vistas, secuencias y columnas de `public` y `privado`, y secuencias sin permiso para nadie más que su dueño. A1, A2, A3 y TRUNCATE para `authenticated` y `service_role` hacen fallar `CON · informes · borrar · X`, `CON · licencias · borrar · X`, etc., y N-4 (j) en 01.

### A-M-5 (MAYOR; CA-035, REQ-057; art. 13) · corregido

Las celdas «0» de `auditoria` no probaban nada: el seed solo tiene 4 filas sin cliente. Con A4 (política de lectura de `auditoria` para el propio cliente) todo seguía en verde. Corrección: el montaje de 02 inserta tres filas de `auditoria` (A, B y C) y la precondición de REQ-057 exige filas de A y B (de C en los de «P») en todo objeto con columna de cliente. Con A4 fallan `UA`, `UB` y `UAB · auditoria · leer · 0` y la aserción REQ-057; sin las filas de A o de B en el montaje falla REQ-057 (dos pruebas V3). Comprobado el arnés `m07.test.ts`: su semilla no inserta filas de `auditoria` de A; su «0» de `auditoria` para UA es vacuo para el acceso cruzado. No se tocó (fuera de T-009); anotado en `verde.md`. `usuarios_cliente` no tiene filas de C en el seed: por eso la exigencia para los objetos que no son de «P» es A y B.

### A-m-1 (menor) · corregido en parte

Una secuencia nueva en `public` para el conector (A10) y un esquema nuevo con una tabla para `anon` (A11) dejaban 01 y 02 en verde. Corregido en 01: N-4 (j) (secuencias y conector) y N-4 (k) (un esquema fuera de la lista de la plataforma, de `public` y de `privado` no da permisos a anon, authenticated, service_role, conector ni PUBLIC; usa la lista cerrada de N-1, que confirma T-013). 01 pasa de 36 a 38 aserciones (propuesta 44 actualizada). Con mutaciones propias en `pgtap.test.ts`.

### A-m-2 (menor) · corregido

`verde.md` decía que la política que solo se ve con la sentencia de B bloqueada la cubrían 01 y los 15 negativos: es falso (01 no mira políticas; la «04» no existe). Corregido en `verde.md`: lo cubren ahora las sondas de insertar sobre el propio cliente (A-M-3).

## Pendiente (segundo dictamen)

Esta corrección vuelve a pasar por el `revisor` y el `auditor-seguridad`. pgTAP en CI sigue sin ejecutarse (T-013). Límites abiertos en `verde.md`, «Lo que 02 no cubre»: `m07.test.ts` con `auditoria` vacuo; N-4 (k) depende de la lista de plataforma (T-013); aserción de «ninguna política menciona metadata» no hecha.

## Segunda vuelta del `auditor-seguridad` sobre la corrección (22/11/2026): APTO CON CONDICIONES, 0 bloqueantes, 0 mayores, 3 menores

Condición: corregir o declarar los menores 1 y 2 antes de cerrar la función. Todo se ejecutó contra PGlite; **pgTAP en CI no se ha ejecutado** (hasta T-013).

### A2-m-1 (menor; arts. 2 y 13) · corregido el texto y declarado el límite

El comentario de `ayudas/perfiles.psql` decía que una política o función que lea metadatos hace fallar la matriz. No siempre: el valor hostil es siempre el cliente C en dos claves fijas y quedan en verde C1 (lectura de `usuarios_cliente` por `user_metadata.cliente_id`, C no tiene filas ahí), C6 (modificar `reglas_cliente`, las sentencias solo apuntan a A y B) y B3 (`es_admin()` con `user_metadata.rol = 'admin'`, clave no hostil). Se corrigió el comentario (único cambio en código, sin efecto), se declaró el límite en `verde.md` y se abrió la propuesta 49 (aserción en 01 sobre `metadata` en políticas, funciones y vistas, o valor hostil distinto por perfil). Abierto: T-011. No explotable hoy: ninguna migración lee metadatos (solo `auth.jwt() ->> 'aal'` en la 0700).

### A2-m-2 (menor; art. 13) · corregido

`verde.md`, «Límites abiertos», punto (3), decía que `authenticated` y `service_role` no tienen instantánea exacta sobre las secuencias. Sí la tienen: `pg_temp.permisos_de_rol` incluye el tipo `S` (con B14 falla la aserción 19) y `anon` lo prohíbe N-4 (a). Frase corregida.

### A2-m-3 (menor) · declarado

Un objeto creado dentro de un esquema de la lista de plataforma (B10: `extensions.fuga` legible por anon) deja 01 y 02 en verde. No explotable hoy. Anotado en `verde.md` y propuesta 50 (regla estática en `tests/unit/bd/estaticas.test.ts`: las migraciones solo crean objetos en `public` y `privado`; un `create table extensions.x` simulado debe fallar). Abierto: T-013 o T-011.

### Lo que el auditor comprobó

| Mutación | Falla ahora en |
| --- | --- |
| A1, A2, A3 y A10 | N-4 (j) de 01 |
| A4 | REQ-057 y las lecturas de `auditoria` de 02 |
| A5, A6 y A7 | las sondas de insertar sobre el propio cliente |
| A8 | 36 celdas de USV |
| A9 | 10 celdas |
| A11 | N-4 (k) de 01 |

## Segunda vuelta del `revisor` sobre la corrección (22/11/2026): NO APTO, 0 bloqueantes, 2 mayores, 5 menores

Corregido en esta tercera corrección. El rojo está en `rojo-previo.md` (commit bfa7a74); el verde, en `verde.md`. Todo se ejecutó contra PGlite; **pgTAP en CI no se ha ejecutado** (hasta T-013). El auditor ya agotó sus dos vueltas: el R2-M-1 lo encontró el revisor y queda declarado aquí.

### R2-M-1 (mayor; CA-005, REQ-005, REQ-052; arts. 2, 3 y 13) · corregido

Con la política de modificar de `reglas_cliente`, `conexiones` o `alertas` abierta por completo (`using (true) with check (true)`), 02 seguía en 844/844 y UA cambiaba con un `update` sin `where` las tres filas de A, B y C. Causa: la sentencia de modificar de esas tablas lleva un `where` que lee columnas y Postgres aplica entonces también las políticas de lectura, que UA, USV y AD1 no tienen en esas tablas; la celda «0» salía `ok:0` aunque el permiso de escribir estuviera abierto. Corrección: tabla `ciegas` en 02 con una modificación sin `where` y sin leer columnas (valor constante) para cada uno de los 23 objetos; UA, UB, UAB, USV y AD1 la ejecutan y `pg_temp.actual` exige que su resultado sea el de la celda (`modificarS`; si no, la celda queda «… / S: …» y falla). Sin añadir aserciones (844). Mutaciones E9, E10 y E11 hacen fallar las cinco celdas `· modificar · 0` de la tabla correspondiente; E5, las de UA y UB. Efecto añadido: la mutación de `licencias_update_admin` abierta falla ahora también en USV, que antes quedaba en verde. El patrón de borrar no se ve afectado: `delete from` no lleva `where`.

### R2-M-2 (mayor; arts. 6 y 13) · corregido

`relevo.md` decía «T-009 hecha en local… aprobada por delegación D-036» mientras `tareas.md` decía «en revisión» y había hallazgos abiertos. Ahora dice «en revisión» y que la puerta solo se abre con el APTO del `revisor` tras esta vuelta. También: T-008 está integrada en `main` (ce2f70c).

### R2-m-1 (menor) · corregido

`perfiles.psql` (el administrador no se da por `app_metadata`) no tenía prueba: mutación E1 en `matriz.test.ts` (`es_admin()` con `or app_metadata.es_admin`); hace fallar `USV · clientes · leer · 0` y `UA · clientes · modificar · 0` de 02.

### R2-m-2 (menor) · corregido

`tareas.md`, columna «Archivos» de T-009: añadidos `supabase/tests/01_estructura.test.sql` y `supabase/tests/ayudas/perfiles.psql`.

### R2-m-3 (menor) · corregido

`verde.md`: precisa que las sondas de insertar sobre el propio cliente solo existen en `usuarios_cliente`, `licencias` y `reglas_cliente`; separa el permiso de columna sin política; declara y da por corregido el hueco del R2-M-1; los límites se renumeran del (1) al (6).

### R2-m-4 (menor) · corregido

`dictamenes.md` y `rojo-previo.md` citaban hashes anteriores al rebase (`0a4686c`, `d43885c`, `7e8304a`); ahora `ae74428`, `d704ffb` y `9038055`.

### R2-m-5 (menor) · corregido

`pgtap.test.ts`: la prueba de que no queda nada cuenta también `clientes`, `auditoria`, `ordenes`, `conexiones` y `alertas` (comparadas con su recuento previo), y los títulos «01 y 07» pasan a «01, 02 y 07».

