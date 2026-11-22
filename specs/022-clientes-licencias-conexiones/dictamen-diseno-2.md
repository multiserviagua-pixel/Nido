# 022 · Dictamen de seguridad del diseño (segunda vuelta, 1.ª de dos tras D-040)

Autor: `auditor-seguridad` · 22/11/2026 · Sobre `diseno.md` consolidado con D-040 y las cuestiones 17 y 18. Solo lectura. Texto del informe del auditor archivado por la coordinación (el auditor no tiene herramienta de escritura). Sustituye al resumen que escribió el `arquitecto`.

**Veredicto: 0 bloqueantes, 1 mayor y 10 menores.** Cerrado del dictamen del 14/11: B-1, M-1, M-2 y m-1 a m-9. Para abrir P1 bastaba corregir MA-1 (redacción); los menores van como condiciones del plan.

## Mayor

**MA-1 · D-5 se puede leer como «eximir al propietario» (arts. 2 y 3; A-09, A-03; AM-09, AM-12, AM-23).** D-5 dice «disparadores para todos salvo el propietario (m-6)» y AM-09 «no frente al propietario». Las 17 funciones, `al_dar_de_baja()`, `revocar_conexion_interna` y las del conector son `security definer` con dueño `postgres`: dentro, `current_user` vale `postgres`. Si se imita `if current_user <> 'postgres'` de M07 (`20261120000700_reglas_de_acceso.sql` L157-158), D-5 no actúa en ninguna de esas rutas (un fallo de activación inserta una conexión activa en licencia revocada; un fallo de O-9 vuelve a poner nulo `revocada_en`). Corrección: los disparadores de D-5 no miran `current_user`, no eximen a ningún rol y actúan también dentro de `security definer`; el propietario solo los evita desactivándolos (fuera del modelo, m-6). Prueba en PRUEBA-014: como `postgres` sin `set role`, intentar quitar `revocada_en`/`baja_en`, volver `vivo` a verdadero, alargar `caduca_en`, insertar conexión activa en licencia revocada y en cliente de baja: 5 rechazos con código fijo; igual desde una `security definer` de prueba.

## Menores

- **m-10 · D-4b, A-03, art. 3.** El disparador toma la I-03 «única» sin atarla a la transacción: una I-03 huérfana de una baja capturada pasaría la guarda `baja_sin_auditoria` o dejaría el cliente imposible de dar de baja. Buscar con `cliente_id = new.id`, acción I-03 y la misma transacción, `into strict`; O-3 no captura excepciones entre la I-03 y el `update`. PRUEBA-017 con una I-03 previa confirmada.
- **m-11 · D-4b, P-45, art. 3.** Un `create or replace` de `privado.al_dar_de_baja()` que no repita `security definer` y `set search_path = pg_catalog, pg_temp` los pierde. pgTAP comprueba `prosecdef`, `proconfig` y `proacl` tras M22-3 y al revertir.
- **m-12 · DD-29, REQ-081, art. 13.** En `conexiones`, M07 L340 concede `select` de tabla entera (cubre `motivo_revocacion`); sin fuga (sin política para el usuario de cliente) pero PRUEBA-013/022 mal planteadas. Pasar a permisos por columna; en `clientes` y `licencias`, `revoke select on <tabla>` y luego conceder columnas (un `revoke select (cols)` no quita el de tabla).
- **m-13 · Nombres, AM-13, art. 3.** La tabla de minúsculas «pares de U+0100 a U+017E» no es regular (U+0130/0131, 0138, 0139-0148, 0149, 0179-017E). Generarla de la minúscula simple de `UnicodeData.txt`; los vectores llevan la clave esperada por punto de código de TP, no solo la igualdad entre los dos lados.
- **m-14 · Nombres, AM-13, L-1 en DD-28.** Con la baja definitiva, confundir clientes cuesta más: plegar `-`/U+2013/U+2014, `'`/U+2019, `"`/U+201C/201D, `...`/U+2026, ı→i, ſ→s, ĸ→k con lista cerrada en `translate()` y vectores; el tecleado con apóstrofo ASCII debe coincidir (CA-043). Riesgo restante: el aceptado en A-7.
- **m-15 · O-3/O-8, confirmación tecleada, art. 3.** `nombre_tecleado` sin longitud máxima en la BD: rechazar con `datos_no_validos` sobre un tope (p. ej. 480 puntos de código) antes de normalizar.
- **m-16 · DD-21, DD-30, PRUEBA-025, arts. 1 y 4.** Un `uuid`/`timestamptz` mal formado falla al convertirse antes de `es_admin()` (`22P02`/`22007`) y el mensaje lleva el valor. Vector en PRUEBA-025; `fuente-bd.ts` siempre por `POST`, sin `get: true` ni filtros PostgREST (valores fuera de la URL); búsqueda estática en PRUEBA-005.
- **m-17 · DD-30, PRUEBA-031, REQ-082, CA-050.** «El 100 % de los roles» exige la lista: recorrer `pg_roles where rolcanlogin`, lista cerrada de excepciones de la plataforma, fallar si aparece un rol sin los cuatro ajustes; reiniciar también el grupo de conexiones (Supavisor).
- **m-18 · D-11 (1), REQ-011, A-03.** Exigir también «cliente activo» en la misma consulta de llamada, renovación, gracia y canje (segunda barrera; la renovación no pasa por `resolver_token`).
- **m-19 · D-5, cerrojos, REQ-048.** El disparador lee licencia y cliente `for share`: en una sola consulta el orden lo decide el plan; leer primero el cliente y luego la licencia (dos sentencias).
- **m-20 · Vuelta atrás y pruebas, arts. 11 y 13.** (a) Revertir M22-4 no puede conceder escritura sobre `revocada_en`, `anulado_en`, `usado_en` ni `baja_en` (M07 concede sobre `estado`/`estado_manual`, que M22-1 elimina) y mantiene los disparadores de D-5; PRUEBA-019. (b) CA-049 y CA-007 rechazan hoy por permiso (`42501`) y no por el disparador: repetirlos como propietario o con concesión solo de prueba y comprobar el código de la restricción.

## Revisado y sin hallazgo

Lectura entre clientes (`clientes_del_usuario()` desde `auth.uid()`, sin identificador de entrada; `resumen_cliente` `security_invoker`; 7 lecturas y 10 operaciones comprueban `es_admin()` primero; `registrar_auditoria()` sin `execute`: nadie fabrica una I-03); funciones de D-7 (reciben valores, no `security definer`, sin escalada); U+00A0 y mayúsculas turcas dentro de TP (salvo m-13 y m-14); baja frente a conexiones vivas (`for share` del conector, M08 L154; vale si se corrige MA-1); DD-30 (razonamiento sobre `set role` y PostgREST correcto; `log_min_messages = panic` suprime también las líneas LOG; `RESET ALL` vuelve al valor del rol); DD-31 (`postgres` 3.4.9 ya en `package.json` L29; `bd.yml` aún no existe).

## No comprobado (sospechas, pasan a T-P1 y T-P4)

Si `postgres` puede fijar en `Nido` los ajustes de superusuario por rol; si PostgREST conserva los de `authenticator` en cada petición (PRUEBA-031); `pgaudit` y publicación `supabase_realtime`; cómo se exponen las 17 funciones si `privado` no está en la API. No se ejecutó comportamiento alguno (no hay migraciones de la 022 ni pgTAP). `node scripts/comprobar-specs.mjs`: SUPERADO (documental).

## Confirmación de la corrección

Pendiente (no consta). Ver «P1» en `plan.md`.
