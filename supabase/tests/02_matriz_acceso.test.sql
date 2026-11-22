-- =====================================================================
-- 02 · Matriz de acceso (función 010, T-009; diseño D-6 y «Pruebas»).
-- REQ-005 a REQ-009, REQ-037, REQ-038, REQ-039, REQ-041, REQ-052, REQ-057, REQ-058 · CA-005, CA-035.
--
-- ESCRITA, NO EJECUTADA EN CI (artículo 13): la primera ejecución real es la de T-013
-- (supabase test db). Lo que sí se ejecutó en local es esta misma prueba contra el arnés
-- PGlite con pglite-pgtap (supabase/tests/pglite/pgtap.test.ts), que no sustituye a CI.
--
-- 844 aserciones = 23 objetos × 9 perfiles × 4 operaciones (828) + 1 (REQ-057, CA-035) + 15
-- negativos de las celdas «C».
--
-- Cómo funciona (no hay que regenerar nada: el archivo expande la matriz al ejecutarse):
--   1. La TRANSCRIPCIÓN de la tabla D-6 de diseno.md (23 filas de 9 grupos de 4 letras) es el único
--      sitio con las letras esperadas. tests/unit/bd/matriz.test.ts (L 1) comprueba celda a
--      celda que coincide con diseno.md. Si cambia D-6, se cambia aquí la fila y L 1 lo exige.
--   2. Las SENTENCIAS dan, por objeto, la sentencia de insertar, la de modificar y la de borrar,
--      válidas para quien tenga derecho (así, cuando la matriz dice X o 0, es la estructura la
--      que rechaza y no una sentencia mal escrita) y cómo se cuentan sus filas.
--   3. Cada perfil recorre los 23 objetos con sus 4 operaciones bajo su rol y su sesión: cada
--      sentencia corre en un subbloque que SIEMPRE se deshace (ninguna sonda cambia datos) y deja su
--      resultado en pg_temp.intentos (bajo un rol que no es el dueño no se llama a pgTAP).
--   4. De vuelta como dueño, cada una de las 828 celdas compara el resultado con lo que dice su
--      letra (is). Un resultado que falta o es distinto, falla: cierra en fallo.
--
-- Letras (D-6): X error 42501 (o, en una vista, sentencia rechazada y sin permiso); 0 sin error y
-- 0 filas; P exactamente las filas de sus clientes con vínculo, 0 de los demás; T todas; C se
-- admite (insertar y modificar: 1 fila con una sentencia válida; leer codigos_activacion: todas,
-- pero no codigo_hmac). Las condiciones de las C son los 15 negativos, con su error exacto.
--
-- Además de las cuatro letras (segundo dictamen del auditor-seguridad):
--   · «insertar» de UA, UB, UAB, USV y AD1 se repite sobre el PROPIO cliente (A y B) en usuarios_cliente,
--     licencias y reglas_cliente, cuya sentencia de insertar apunta a otro cliente (A-M-3): una política
--     que deje al usuario dar de alta algo en su cliente falla la celda.
--   · «borrar» comprueba también que el rol del perfil no tiene TRUNCATE, REFERENCES, TRIGGER ni
--     MAINTAIN sobre el objeto (tabla o columna, ni PUBLIC), que ninguna de las cuatro operaciones ve
--     (A-M-4): el dueño lo calcula con aclexplode y la celda falla si hay alguno.
--   · «modificar» de UA, UB, UAB, USV y AD1 se repite a ciegas (sin where y sin leer columnas) en los 23 objetos
--     (R2-M-1): con un where que lee columnas, Postgres aplica también las políticas de lectura y una política de
--     modificar abierta en una tabla que el perfil no lee (reglas_cliente, conexiones, alertas) salía «ok:0».
--   · Los perfiles llevan metadatos de usuario hostiles y USV lleva doble factor (A-M-1, A-M-2).
--
-- Datos 100 % ficticios (artículos 1 y 4): los del seed y siete filas más que monta esta prueba
-- (un cliente sin licencia, una orden anulada, una conexión revocada, una alerta resuelta y tres filas
-- de auditoría, de A, B y C), en la transacción: desaparecen con el rollback. Todo va calificado
-- (sombras de N-3).
-- =====================================================================
begin;

\ir ayudas/perfiles.psql
\ir ayudas/sombras.psql

select plan(844);

-- ---------------------------------------------------------------------
-- Montaje (como dueño; los disparadores de auditoría no registran al dueño)
--   au  tres filas de auditoría, de A, B y C: el seed solo tiene filas sin cliente y, sin ellas, un 0
--       de «auditoria» no prueba nada (A-M-5, CA-035, REQ-057)
--   d1  cliente sin licencia ni reglas (alta de licencia y de reglas por el superadmin)
--   f4  orden anulada de A (anulada → pendiente se rechaza)
--   cd  conexión de la licencia de C ya revocada (revocada_en → nulo se rechaza)
--   cf  alerta de C ya resuelta (resuelta_en → nulo se rechaza)
-- ---------------------------------------------------------------------
insert into public.clientes (id, nombre) values
  ('00000000-0000-4000-8000-0000000000d1', 'Cliente nuevo ficticio');
insert into public.ordenes (id, cliente_id, tipo, estado, anulada_en) values
  ('00000000-0000-4000-8000-0000000000f4', '00000000-0000-4000-8000-00000000000a', 'pausar', 'anulada', pg_catalog.now());
insert into public.conexiones (id, licencia_id, revocada_en) values
  ('00000000-0000-4000-8000-0000000000cd', '00000000-0000-4000-8000-0000000000c1', pg_catalog.now() - interval '1 day');
insert into public.alertas (id, cliente_id, tipo, resuelta_en) values
  ('00000000-0000-4000-8000-0000000000cf', '00000000-0000-4000-8000-00000000000c', 'sin_senal', pg_catalog.now() - interval '1 hour');
insert into public.auditoria (accion, objeto_tipo, cliente_id) values
  ('accion_ficticia', 'clientes', '00000000-0000-4000-8000-00000000000a'),
  ('accion_ficticia', 'clientes', '00000000-0000-4000-8000-00000000000b'),
  ('accion_ficticia', 'clientes', '00000000-0000-4000-8000-00000000000c');

-- ---------------------------------------------------------------------
-- 1 · Transcripción de la tabla D-6 de specs/010-base-datos-rls/diseno.md.
-- Una fila por objeto; por perfil, las cuatro letras: leer, insertar, modificar, borrar.
-- Columnas: objeto, SS (anon), UA, UB, UAB, USV, AD1, AD2, CON (conector), SR (service_role).
-- La lee tests/unit/bd/matriz.test.ts (L 1): no cambiar el formato sin cambiarla.
-- ---------------------------------------------------------------------
-- TRANSCRIPCION-MATRIZ-INICIO
create temp table matriz (
  objeto pg_catalog.text primary key,
  ss pg_catalog.text not null, ua pg_catalog.text not null, ub pg_catalog.text not null,
  uab pg_catalog.text not null, usv pg_catalog.text not null, ad1 pg_catalog.text not null,
  ad2 pg_catalog.text not null, con pg_catalog.text not null, sr pg_catalog.text not null);
insert into pg_temp.matriz values
  ('clientes', 'XXXX', 'PX0X', 'PX0X', 'PX0X', '0X0X', '0X0X', 'TCCX', 'XXXX', 'XXXX'),
  ('licencias', 'XXXX', 'PX0X', 'PX0X', 'PX0X', '0X0X', '0X0X', 'TCCX', 'XXXX', 'XXXX'),
  ('ordenes', 'XXXX', 'PX0X', 'PX0X', 'PX0X', '0X0X', '0X0X', 'TCCX', 'XXXX', 'XXXX'),
  ('reglas_cliente', 'XXXX', '0X0X', '0X0X', '0X0X', '0X0X', '0X0X', 'TCCX', 'XXXX', 'XXXX'),
  ('catalogo_problemas', 'XXXX', 'TX0X', 'TX0X', 'TX0X', '0X0X', '0X0X', 'TCCX', 'XXXX', 'XXXX'),
  ('conexiones', 'XXXX', '0X0X', '0X0X', '0X0X', '0X0X', '0X0X', 'TXCX', 'XXXX', 'XXXX'),
  ('ajustes_globales', 'XXXX', '0X0X', '0X0X', '0X0X', '0X0X', '0X0X', 'TXCX', 'XXXX', 'XXXX'),
  ('alertas', 'XXXX', '0X0X', '0X0X', '0X0X', '0X0X', '0X0X', 'TXCX', 'XXXX', 'XXXX'),
  ('usuarios_cliente', 'XXXX', '0XX0', '0XX0', '0XX0', '0XX0', '0XX0', 'TCXT', 'XXXX', 'XXXX'),
  ('codigos_activacion', 'XXXX', '0XXX', '0XXX', '0XXX', '0XXX', '0XXX', 'CCXX', 'XXXX', 'XXXX'),
  ('publicaciones', 'XXXX', '0XXX', '0XXX', '0XXX', '0XXX', '0XXX', 'TCXX', 'XXXX', 'XXXX'),
  ('administradores', 'XXXX', '0XXX', '0XXX', '0XXX', '0XXX', '0XXX', 'TXXX', 'XXXX', 'XXXX'),
  ('versiones_prompt', 'XXXX', '0XXX', '0XXX', '0XXX', '0XXX', '0XXX', 'TXXX', 'XXXX', 'TCXX'),
  ('auditoria', 'XXXX', '0XXX', '0XXX', '0XXX', '0XXX', '0XXX', 'TXXX', 'XXXX', 'XXXX'),
  ('ejecuciones', 'XXXX', 'PXXX', 'PXXX', 'PXXX', '0XXX', '0XXX', 'TXXX', 'XXXX', 'XXXX'),
  ('informes', 'XXXX', 'PXXX', 'PXXX', 'PXXX', '0XXX', '0XXX', 'TXXX', 'XXXX', 'XXXX'),
  ('suscripciones', 'XXXX', 'PXXX', 'PXXX', 'PXXX', '0XXX', '0XXX', 'TXXX', 'XXXX', 'XXXX'),
  ('resumen_cliente', 'XXXX', 'PXXX', 'PXXX', 'PXXX', '0XXX', '0XXX', 'TXXX', 'XXXX', 'XXXX'),
  ('metricas_version', 'XXXX', 'PXXX', 'PXXX', 'PXXX', '0XXX', '0XXX', 'TXXX', 'XXXX', 'XXXX'),
  ('clientes_oauth', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX'),
  ('codigos_autorizacion', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX'),
  ('tokens', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX'),
  ('eventos_stripe', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX');
-- TRANSCRIPCION-MATRIZ-FIN

-- ---------------------------------------------------------------------
-- 2 · Sentencias por objeto.
--   tipo        tabla o vista (una vista rechaza la escritura antes de mirar los permisos: 55000;
--               por eso, en una vista, «X» es «sentencia rechazada y sin permiso» y no un 42501).
--   n_expr      cómo se cuentan las filas que ve el perfil (metricas_version agrupa por versión:
--               se cuentan los informes que agrega).
--   cl_expr     columna con el cliente de la fila (nulo: sin reparto por cliente).
--   vetada      columna que ningún perfil lee (codigos_activacion.codigo_hmac).
--   fuente      objeto cuyas filas por cliente dan lo que lee «P» (metricas_version: informes).
--   ins_propio  (opcional) la misma alta sobre el cliente A cuando `ins` apunta a otro: se repite sobre
--               el propio cliente (A y B) de los perfiles que la matriz niega (A-M-3).
--   ins/upd/del sentencia válida para quien tenga derecho; en «X» y «0» la rechaza o filtra la
--               estructura. Las de insertar sin permiso de nadie usan `default values`: el permiso
--               se comprueba antes que las columnas obligatorias.
-- ---------------------------------------------------------------------
-- SENTENCIAS-INICIO
create temp table sentencias (
  objeto pg_catalog.text primary key, tipo pg_catalog.text not null, n_expr pg_catalog.text not null,
  cl_expr pg_catalog.text, vetada pg_catalog.text, fuente pg_catalog.text,
  ins pg_catalog.text not null, upd pg_catalog.text not null, del pg_catalog.text not null,
  ins_propio pg_catalog.text);
insert into pg_temp.sentencias values
  ('clientes', 'tabla', 'pg_catalog.count(*)', 'id', null, null,
   $s$insert into public.clientes (nombre, canal, frecuencia_esperada_horas) values ('Cliente alta ficticio', 'prueba', 24)$s$,
   $s$update public.clientes set nombre = 'Cliente A renombrado ficticio' where id = '00000000-0000-4000-8000-00000000000a'$s$,
   $s$delete from public.clientes$s$, null),
  ('licencias', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.licencias (cliente_id, estado_manual, caduca_en) values ('00000000-0000-4000-8000-0000000000d1', 'automatico', null)$s$,
   $s$update public.licencias set estado_manual = 'forzar_activa' where id = '00000000-0000-4000-8000-0000000000a1'$s$,
   $s$delete from public.licencias$s$,
   $s$insert into public.licencias (cliente_id, estado_manual, caduca_en) values ('00000000-0000-4000-8000-00000000000a', 'automatico', null)$s$),
  ('ordenes', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.ordenes (cliente_id, tipo) values ('00000000-0000-4000-8000-00000000000a', 'reanudar')$s$,
   $s$update public.ordenes set estado = 'anulada' where id = '00000000-0000-4000-8000-0000000000a4'$s$,
   $s$delete from public.ordenes$s$, null),
  ('reglas_cliente', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.reglas_cliente (cliente_id, max_correos_por_revision, ventana_dias, guardar_adjuntos, preparar_borradores, descargar_facturas_por_enlace) values ('00000000-0000-4000-8000-0000000000d1', 20, 2, true, true, true)$s$,
   $s$update public.reglas_cliente set ventana_dias = 4 where cliente_id = '00000000-0000-4000-8000-00000000000a'$s$,
   $s$delete from public.reglas_cliente$s$,
   $s$insert into public.reglas_cliente (cliente_id, max_correos_por_revision, ventana_dias, guardar_adjuntos, preparar_borradores, descargar_facturas_por_enlace) values ('00000000-0000-4000-8000-00000000000a', 20, 2, true, true, true)$s$),
  ('catalogo_problemas', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.catalogo_problemas (codigo, descripcion, activo) values ('codigo_nuevo_ficticio', 'Descripcion ficticia nueva', true)$s$,
   $s$update public.catalogo_problemas set descripcion = 'Descripcion ficticia cambiada' where codigo = 'otro'$s$,
   $s$delete from public.catalogo_problemas$s$, null),
  ('conexiones', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.conexiones (licencia_id) values ('00000000-0000-4000-8000-0000000000a1')$s$,
   $s$update public.conexiones set revocada_en = pg_catalog.now() where id = '00000000-0000-4000-8000-0000000000a2'$s$,
   $s$delete from public.conexiones$s$, null),
  ('ajustes_globales', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.ajustes_globales (pausa_global) values (false)$s$,
   $s$update public.ajustes_globales set pausa_global = true$s$,
   $s$delete from public.ajustes_globales$s$, null),
  ('alertas', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.alertas (cliente_id, tipo) values ('00000000-0000-4000-8000-00000000000a', 'sin_senal')$s$,
   $s$update public.alertas set resuelta_en = pg_catalog.now() where id = '00000000-0000-4000-8000-0000000000a7'$s$,
   $s$delete from public.alertas$s$, null),
  ('usuarios_cliente', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.usuarios_cliente (usuario_id, cliente_id) values ('00000000-0000-4000-8000-00000000001d', '00000000-0000-4000-8000-00000000000c')$s$,
   $s$update public.usuarios_cliente set cliente_id = cliente_id$s$,
   $s$delete from public.usuarios_cliente$s$,
   $s$insert into public.usuarios_cliente (usuario_id, cliente_id) values ('00000000-0000-4000-8000-00000000001d', '00000000-0000-4000-8000-00000000000a')$s$),
  ('codigos_activacion', 'tabla', 'pg_catalog.count(*)', null, 'codigo_hmac', null,
   $s$insert into public.codigos_activacion (licencia_id, codigo_hmac, caduca_en) values ('00000000-0000-4000-8000-0000000000a1', pg_catalog.repeat('d5', 32), pg_catalog.now() + interval '1 day')$s$,
   $s$update public.codigos_activacion set caduca_en = caduca_en$s$,
   $s$delete from public.codigos_activacion$s$, null),
  ('publicaciones', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.publicaciones (canal, version_id, motivo) values ('prueba', '00000000-0000-4000-8000-0000000000f1', 'publicacion')$s$,
   $s$update public.publicaciones set motivo = motivo$s$,
   $s$delete from public.publicaciones$s$, null),
  ('administradores', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.administradores (usuario_id) values ('00000000-0000-4000-8000-000000000021')$s$,
   $s$update public.administradores set creado_en = creado_en$s$,
   $s$delete from public.administradores$s$, null),
  ('versiones_prompt', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.versiones_prompt (version, contenido, huella_sha256, commit_sha, notas) select '9.9.9', t.c, pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(t.c, 'UTF8')), 'hex'), 'abcdef0', 'Version ficticia de la matriz' from (values ('Texto ficticio de la matriz.')) as t (c)$s$,
   $s$update public.versiones_prompt set notas = notas$s$,
   $s$delete from public.versiones_prompt$s$, null),
  ('auditoria', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.auditoria (accion, objeto_tipo) values ('accion_ficticia', 'clientes')$s$,
   $s$update public.auditoria set accion = accion$s$,
   $s$delete from public.auditoria$s$, null),
  ('ejecuciones', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.ejecuciones (conexion_id, cliente_id, estado_servido) values ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-00000000000a', 'activa')$s$,
   $s$update public.ejecuciones set cerrada_en = cerrada_en$s$,
   $s$delete from public.ejecuciones$s$, null),
  ('informes', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.informes default values$s$,
   $s$update public.informes set urgentes = urgentes$s$,
   $s$delete from public.informes$s$, null),
  ('suscripciones', 'tabla', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.suscripciones (cliente_id, stripe_customer_id) values ('00000000-0000-4000-8000-0000000000d1', 'cus_matriz')$s$,
   $s$update public.suscripciones set estado = estado$s$,
   $s$delete from public.suscripciones$s$, null),
  ('resumen_cliente', 'vista', 'pg_catalog.count(*)', 'cliente_id', null, null,
   $s$insert into public.resumen_cliente default values$s$,
   $s$update public.resumen_cliente set nombre = nombre$s$,
   $s$delete from public.resumen_cliente$s$, null),
  ('metricas_version', 'vista', 'coalesce(pg_catalog.sum(revisiones), 0)', null, null, 'informes',
   $s$insert into public.metricas_version default values$s$,
   $s$update public.metricas_version set revisiones = revisiones$s$,
   $s$delete from public.metricas_version$s$, null),
  ('clientes_oauth', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.clientes_oauth default values$s$,
   $s$update public.clientes_oauth set ultimo_uso_en = ultimo_uso_en$s$,
   $s$delete from public.clientes_oauth$s$, null),
  ('codigos_autorizacion', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.codigos_autorizacion default values$s$,
   $s$update public.codigos_autorizacion set usado_en = usado_en$s$,
   $s$delete from public.codigos_autorizacion$s$, null),
  ('tokens', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.tokens default values$s$,
   $s$update public.tokens set revocado_en = revocado_en$s$,
   $s$delete from public.tokens$s$, null),
  ('eventos_stripe', 'tabla', 'pg_catalog.count(*)', null, null, null,
   $s$insert into public.eventos_stripe default values$s$,
   $s$update public.eventos_stripe set procesado_en = procesado_en$s$,
   $s$delete from public.eventos_stripe$s$, null);
-- SENTENCIAS-FIN

-- Qué clientes tienen vínculo cada perfil (lo que lee «P»).
create temp table permitidos (perfil pg_catalog.text primary key, a pg_catalog.bool not null, b pg_catalog.bool not null, c pg_catalog.bool not null);
insert into pg_temp.permitidos values
  ('SS', false, false, false), ('UA', true, false, false), ('UB', false, true, false),
  ('UAB', true, true, false), ('USV', false, false, false), ('AD1', false, false, false),
  ('AD2', false, false, false), ('CON', false, false, false), ('SR', false, false, false);

-- ---------------------------------------------------------------------
-- 3 · Los 15 negativos de las celdas «C» (D-2 y D-5): cada uno, con el perfil y el error exacto.
-- 42501: la estructura no da el permiso. P0001: lo rechaza un disparador de la base con su
-- mensaje, que es el nuestro y no el de Postgres.
-- ---------------------------------------------------------------------
-- NEGATIVOS-INICIO
create temp table negativos (
  n pg_catalog.int4 primary key, perfil pg_catalog.text not null, descripcion pg_catalog.text not null,
  sentencia pg_catalog.text not null, esperado pg_catalog.text not null);
insert into pg_temp.negativos values
  (1, 'AD2', 'licencias.cliente_id no se cambia',
   $s$update public.licencias set cliente_id = '00000000-0000-4000-8000-00000000000b' where id = '00000000-0000-4000-8000-0000000000a1'$s$,
   '42501'),
  (2, 'DUENO', 'licencias.cliente_id no se cambia ni con el dueño',
   $s$update public.licencias set cliente_id = '00000000-0000-4000-8000-00000000000b' where id = '00000000-0000-4000-8000-0000000000a1'$s$,
   'P0001:cambio_de_pertenencia_no_permitido'),
  (3, 'DUENO', 'conexiones.licencia_id no se cambia ni con el dueño',
   $s$update public.conexiones set licencia_id = '00000000-0000-4000-8000-0000000000b1' where id = '00000000-0000-4000-8000-0000000000a2'$s$,
   'P0001:cambio_de_pertenencia_no_permitido'),
  (4, 'DUENO', 'ejecuciones.conexion_id no se cambia ni con el dueño',
   $s$update public.ejecuciones set conexion_id = '00000000-0000-4000-8000-0000000000b2' where id = '00000000-0000-4000-8000-0000000000a5'$s$,
   'P0001:cambio_de_pertenencia_no_permitido'),
  (5, 'DUENO', 'ejecuciones.cliente_id no se cambia ni con el dueño',
   $s$update public.ejecuciones set cliente_id = '00000000-0000-4000-8000-00000000000b' where id = '00000000-0000-4000-8000-0000000000a5'$s$,
   'P0001:cambio_de_pertenencia_no_permitido'),
  (6, 'AD2', 'codigos_activacion.usado_en no se escribe en el alta',
   $s$insert into public.codigos_activacion (licencia_id, codigo_hmac, caduca_en, usado_en) values ('00000000-0000-4000-8000-0000000000a1', pg_catalog.repeat('d6', 32), pg_catalog.now() + interval '1 day', pg_catalog.now())$s$,
   '42501'),
  (7, 'AD2', 'catalogo_problemas.codigo no se cambia',
   $s$update public.catalogo_problemas set codigo = 'otro_codigo' where codigo = 'otro'$s$,
   '42501'),
  (8, 'AD2', 'reglas_cliente.cliente_id no se cambia',
   $s$update public.reglas_cliente set cliente_id = '00000000-0000-4000-8000-0000000000d1' where cliente_id = '00000000-0000-4000-8000-00000000000a'$s$,
   '42501'),
  (9, 'AD2', 'una orden no pasa a confirmada por el superadmin',
   $s$update public.ordenes set estado = 'confirmada' where id = '00000000-0000-4000-8000-0000000000a4'$s$,
   'P0001:orden_transicion_no_permitida'),
  (10, 'AD2', 'una orden anulada no vuelve a pendiente',
   $s$update public.ordenes set estado = 'pendiente' where id = '00000000-0000-4000-8000-0000000000f4'$s$,
   'P0001:orden_transicion_no_permitida'),
  (11, 'AD2', 'una conexión revocada no vuelve a estar activa (superadmin)',
   $s$update public.conexiones set revocada_en = null where id = '00000000-0000-4000-8000-0000000000cd'$s$,
   'P0001:revocacion_no_reversible'),
  (12, 'DUENO', 'una conexión revocada no vuelve a estar activa ni con el dueño',
   $s$update public.conexiones set revocada_en = null where id = '00000000-0000-4000-8000-0000000000cd'$s$,
   'P0001:revocacion_no_reversible'),
  (13, 'AD2', 'una alerta resuelta no vuelve a estar abierta',
   $s$update public.alertas set resuelta_en = null where id = '00000000-0000-4000-8000-0000000000cf'$s$,
   'P0001:resolucion_no_reversible'),
  (14, 'AD2', 'reglas_cliente.actualizado_en no se escribe: lo fija la base',
   $s$update public.reglas_cliente set actualizado_en = '2000-01-01T00:00:00Z' where cliente_id = '00000000-0000-4000-8000-00000000000a'$s$,
   '42501'),
  (15, 'AD2', 'un cliente nuevo no nace de baja',
   $s$insert into public.clientes (nombre, estado) values ('Cliente nuevo de baja ficticio', 'baja')$s$,
   '42501');
-- NEGATIVOS-FIN

-- Modificar a ciegas (R2-M-1): la misma modificación sin `where` y sin leer columnas (el valor es una constante).
-- La sentencia de `sentencias.upd` lleva un `where` (o un `set x = x`) que lee columnas, y entonces Postgres
-- aplica además las políticas de lectura: una política de modificar abierta en una tabla que el perfil no lee
-- (reglas_cliente, conexiones, alertas) saldría «ok:0». Sin leer, solo manda la política de modificar. Su
-- resultado tiene que ser el de la celda (la comparan UA, UB, UAB, USV y AD1, junto a la sonda sobre B).
create temp table ciegas (objeto pg_catalog.text primary key, sentencia pg_catalog.text not null);
insert into pg_temp.ciegas values
  ('clientes',
   $s$update public.clientes set nombre = 'Cliente renombrado ficticio'$s$),
  ('licencias',
   $s$update public.licencias set estado_manual = 'forzar_activa'$s$),
  ('ordenes',
   $s$update public.ordenes set estado = 'anulada'$s$),
  ('reglas_cliente',
   $s$update public.reglas_cliente set ventana_dias = 4$s$),
  ('catalogo_problemas',
   $s$update public.catalogo_problemas set descripcion = 'Descripcion ficticia cambiada'$s$),
  ('conexiones',
   $s$update public.conexiones set revocada_en = pg_catalog.now()$s$),
  ('ajustes_globales',
   $s$update public.ajustes_globales set pausa_global = true$s$),
  ('alertas',
   $s$update public.alertas set resuelta_en = pg_catalog.now()$s$),
  ('usuarios_cliente',
   $s$update public.usuarios_cliente set cliente_id = '00000000-0000-4000-8000-00000000000a'$s$),
  ('codigos_activacion',
   $s$update public.codigos_activacion set caduca_en = pg_catalog.now()$s$),
  ('publicaciones',
   $s$update public.publicaciones set motivo = 'publicacion'$s$),
  ('administradores',
   $s$update public.administradores set creado_en = pg_catalog.now()$s$),
  ('versiones_prompt',
   $s$update public.versiones_prompt set notas = 'Nota ficticia'$s$),
  ('auditoria',
   $s$update public.auditoria set accion = 'accion_ficticia'$s$),
  ('ejecuciones',
   $s$update public.ejecuciones set cerrada_en = pg_catalog.now()$s$),
  ('informes',
   $s$update public.informes set urgentes = 0$s$),
  ('suscripciones',
   $s$update public.suscripciones set stripe_customer_id = 'cus_ciega'$s$),
  ('resumen_cliente',
   $s$update public.resumen_cliente set nombre = 'Nombre ficticio'$s$),
  ('metricas_version',
   $s$update public.metricas_version set revisiones = 0$s$),
  ('clientes_oauth',
   $s$update public.clientes_oauth set ultimo_uso_en = pg_catalog.now()$s$),
  ('codigos_autorizacion',
   $s$update public.codigos_autorizacion set usado_en = pg_catalog.now()$s$),
  ('tokens',
   $s$update public.tokens set revocado_en = pg_catalog.now()$s$),
  ('eventos_stripe',
   $s$update public.eventos_stripe set procesado_en = pg_catalog.now()$s$);

grant select on table pg_temp.matriz, pg_temp.sentencias, pg_temp.permitidos, pg_temp.negativos, pg_temp.ciegas to public;

-- ---------------------------------------------------------------------
-- 4 · Sondas. Todas corren con el rol y la sesión del perfil y dejan su resultado en
-- pg_temp.intentos; ninguna cambia datos (el subbloque se deshace siempre).
-- ---------------------------------------------------------------------

-- Las letras de una celda y si exige «sin permiso»: una «X» de SS, CON y SR, o de cualquier perfil en
-- una operación que el superadmin (AD2) tampoco tiene, significa que el rol no tiene NINGÚN permiso
-- (tabla ni columna alguna) y no solo que la sentencia concreta falla (R-M-1, CA-005, REQ-007).
-- Donde AD2 sí la tiene (p. ej. insertar órdenes), la «X» de los demás perfiles la pone el RLS, con el
-- permiso concedido, y el permiso no se exige.
create function pg_temp.letra(p_perfil pg_catalog.text, p_objeto pg_catalog.text, p_op pg_catalog.text)
returns pg_catalog.text
language sql stable
as $f$
  select pg_catalog.substr(
           case p_perfil when 'SS' then m.ss when 'UA' then m.ua when 'UB' then m.ub when 'UAB' then m.uab
                         when 'USV' then m.usv when 'AD1' then m.ad1 when 'AD2' then m.ad2
                         when 'CON' then m.con when 'SR' then m.sr end,
           case p_op when 'leer' then 1 when 'insertar' then 2 when 'modificar' then 3 else 4 end, 1)
    from pg_temp.matriz m where m.objeto operator(pg_catalog.=) p_objeto;
$f$;

create function pg_temp.exige_sin_permiso(p_perfil pg_catalog.text, p_objeto pg_catalog.text, p_op pg_catalog.text)
returns pg_catalog.bool
language sql stable
as $f$
  select coalesce(p_perfil in ('SS', 'CON', 'SR') or pg_temp.letra('AD2', p_objeto, p_op) operator(pg_catalog.=) 'X', true);
$f$;

-- Los permisos que ninguna de las cuatro operaciones ve (A-M-4): TRUNCATE, REFERENCES, TRIGGER y MAINTAIN
-- sobre el objeto, en la tabla o en una columna (REFERENCES), para el rol del perfil o para PUBLIC. Se
-- calcula como dueño con aclexplode; vacío es lo único que pasa (D-5 no los concede a nadie).
create function pg_temp.privilegios_extra(p_perfil pg_catalog.text, p_objeto pg_catalog.text)
returns pg_catalog.text
language sql stable
as $f$
  select coalesce(pg_catalog.string_agg(x.p, ',' order by x.p), '')
    from (
      select a.privilege_type::pg_catalog.text as p
        from pg_catalog.pg_class c
        cross join lateral pg_catalog.aclexplode(coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))) a
       where c.oid operator(pg_catalog.=) ('public.' || p_objeto)::pg_catalog.regclass
         and a.grantee in (0::pg_catalog.oid,
               (case p_perfil when 'SS' then 'anon' when 'CON' then 'conector' when 'SR' then 'service_role'
                              else 'authenticated' end)::pg_catalog.regrole::pg_catalog.oid)
         and a.privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
      union
      select a.privilege_type::pg_catalog.text
        from pg_catalog.pg_attribute t
        cross join lateral pg_catalog.aclexplode(t.attacl) a
       where t.attrelid operator(pg_catalog.=) ('public.' || p_objeto)::pg_catalog.regclass
         and a.grantee in (0::pg_catalog.oid,
               (case p_perfil when 'SS' then 'anon' when 'CON' then 'conector' when 'SR' then 'service_role'
                              else 'authenticated' end)::pg_catalog.regrole::pg_catalog.oid)
         and a.privilege_type operator(pg_catalog.=) 'REFERENCES'
    ) x;
$f$;

-- Los perfiles que repiten insertar y modificar sobre una fila de B (R-m-2): la sentencia de A se
-- reescribe con los identificadores de B (cliente, licencia, conexión, orden, alerta). Así una política que
-- deja a un usuario tocar «su» cliente se ve también desde UB, y una abierta, desde todos.
create function pg_temp.corre_en_b(p_perfil pg_catalog.text) returns pg_catalog.bool
language sql immutable
as $f$ select p_perfil in ('UA', 'UB', 'UAB', 'USV', 'AD1'); $f$;

create function pg_temp.a_b(p_sql pg_catalog.text) returns pg_catalog.text
language sql immutable
as $f$
  select pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(
    p_sql,
    '-8000-00000000000a', '-8000-00000000000b'), '-8000-0000000000a1', '-8000-0000000000b1'),
    '-8000-0000000000a2', '-8000-0000000000b2'), '-8000-0000000000a4', '-8000-0000000000b4'),
    '-8000-0000000000a5', '-8000-0000000000b5'), '-8000-0000000000a7', '-8000-0000000000b7');
$f$;

-- Una sentencia de escritura: SQLSTATE (con el mensaje si es P0001, que es el de nuestros
-- disparadores) o «ok:N» con las filas que habría cambiado. Con un 42501 y p_exigir, se anota además
-- si el perfil tiene algún permiso para la operación (tabla o cualquier columna: «:t» o «:f»); en una vista,
-- siempre (los 55000 no dicen nada del permiso).
create function pg_temp.sonda_escritura(
  p_clave pg_catalog.text, p_sql pg_catalog.text, p_objeto pg_catalog.text,
  p_vista pg_catalog.bool, p_privilegio pg_catalog.text, p_exigir pg_catalog.bool)
returns void
language plpgsql
as $f$
declare
  v_filas pg_catalog.int8;
  v_res pg_catalog.text;
  v_permiso pg_catalog.bool;
begin
  begin
    execute p_sql;
    get diagnostics v_filas = row_count;
    v_res := pg_catalog.format('ok:%s', v_filas);
    raise exception 'sonda_deshecha' using errcode = 'ZZ001';
  exception when others then
    if sqlstate operator(pg_catalog.<>) 'ZZ001' then
      v_res := case when sqlstate operator(pg_catalog.=) 'P0001' then sqlstate || ':' || sqlerrm else sqlstate end;
    end if;
  end;
  if p_vista or (p_exigir and v_res operator(pg_catalog.=) '42501') then
    select pg_catalog.has_table_privilege(current_user, p_objeto, p_privilegio)
           or (p_privilegio operator(pg_catalog.<>) 'DELETE'
               and pg_catalog.has_any_column_privilege(current_user, p_objeto, p_privilegio))
      into v_permiso;
    v_res := case when p_vista and v_res in ('42501', '55000') then 'denegado' else v_res end
             || ':' || case when v_permiso then 't' else 'f' end;
  end if;
  insert into pg_temp.intentos (clave, estado) values (p_clave, v_res);
end;
$f$;

-- La lectura: «n=…;A=…;B=…;C=…» con las filas que ve el perfil y las que son de cada cliente, o el SQLSTATE.
-- Primero se cuenta (n no nombra la columna del cliente: sirve con un permiso por columnas) y después se
-- reparte por cliente (nombra cliente_id o id). Si n sale y el reparto da error, queda «n=…;reparto=SQLSTATE»,
-- distinto de un 42501 de la tabla entera (R-M-1). Con un 42501 y p_exigir, se anota «:t» o «:f» según
-- tenga el perfil algún permiso de lectura (tabla o columna).
create function pg_temp.sonda_lectura(
  p_clave pg_catalog.text, p_objeto pg_catalog.text, p_n pg_catalog.text, p_cliente pg_catalog.text,
  p_exigir pg_catalog.bool)
returns void
language plpgsql
as $f$
declare
  v_res pg_catalog.text;
  v_n pg_catalog.text;
  v_rep pg_catalog.text;
  v_permiso pg_catalog.bool;
  v_col pg_catalog.text := coalesce(p_cliente, 'null::pg_catalog.uuid');
begin
  begin
    execute pg_catalog.format('select (%s)::pg_catalog.text from public.%I', p_n, p_objeto) into v_n;
  exception when others then
    v_res := sqlstate;
  end;
  if v_res is null then
    begin
      execute pg_catalog.format(
        $q$select pg_catalog.format('A=%%s;B=%%s;C=%%s',
             pg_catalog.count(*) filter (where %s operator(pg_catalog.=) %L),
             pg_catalog.count(*) filter (where %s operator(pg_catalog.=) %L),
             pg_catalog.count(*) filter (where %s operator(pg_catalog.=) %L))
           from public.%I$q$,
        v_col, pg_temp.id('CA'), v_col, pg_temp.id('CB'), v_col, pg_temp.id('CC'), p_objeto)
        into v_rep;
      v_res := pg_catalog.format('n=%s;%s', v_n, v_rep);
    exception when others then
      v_res := pg_catalog.format('n=%s;reparto=%s', v_n, sqlstate);
    end;
  elsif p_exigir and v_res operator(pg_catalog.=) '42501' then
    select pg_catalog.has_table_privilege(current_user, 'public.' || p_objeto, 'SELECT')
           or pg_catalog.has_any_column_privilege(current_user, 'public.' || p_objeto, 'SELECT')
      into v_permiso;
    v_res := v_res || ':' || case when v_permiso then 't' else 'f' end;
  end if;
  insert into pg_temp.intentos (clave, estado) values (p_clave, v_res);
end;
$f$;

-- Leer la columna vetada (codigo_hmac): nadie debe poder.
create function pg_temp.sonda_vetada(p_clave pg_catalog.text, p_objeto pg_catalog.text, p_columna pg_catalog.text)
returns void
language plpgsql
as $f$
declare
  v_res pg_catalog.text;
begin
  begin
    execute pg_catalog.format('select %I from public.%I limit 1', p_columna, p_objeto);
    v_res := 'sin_error';
  exception when others then
    v_res := sqlstate;
  end;
  insert into pg_temp.intentos (clave, estado) values (p_clave, v_res);
end;
$f$;

-- Los 23 objetos con sus 4 operaciones, con el rol que haya fijado pg_temp.como().
create function pg_temp.sondear_perfil(p_perfil pg_catalog.text) returns void
language plpgsql
as $f$
declare
  s pg_catalog.record;
  v_base pg_catalog.text;
begin
  for s in select * from pg_temp.sentencias order by objeto loop
    v_base := p_perfil || '|' || s.objeto || '|';
    perform pg_temp.sonda_lectura(v_base || 'leer', s.objeto, s.n_expr, s.cl_expr,
                                  pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'leer'));
    if s.vetada is not null then
      perform pg_temp.sonda_vetada(v_base || 'vetada', s.objeto, s.vetada);
    end if;
    perform pg_temp.sonda_escritura(v_base || 'insertar', s.ins, 'public.' || s.objeto, s.tipo operator(pg_catalog.=) 'vista', 'INSERT',
                                    pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'insertar'));
    perform pg_temp.sonda_escritura(v_base || 'modificar', s.upd, 'public.' || s.objeto, s.tipo operator(pg_catalog.=) 'vista', 'UPDATE',
                                    pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'modificar'));
    perform pg_temp.sonda_escritura(v_base || 'borrar', s.del, 'public.' || s.objeto, s.tipo operator(pg_catalog.=) 'vista', 'DELETE',
                                    pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'borrar'));
    if pg_temp.corre_en_b(p_perfil) then
      perform pg_temp.sonda_escritura(v_base || 'insertarB', pg_temp.a_b(s.ins), 'public.' || s.objeto, s.tipo operator(pg_catalog.=) 'vista', 'INSERT',
                                      pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'insertar'));
      if s.ins_propio is not null then
        perform pg_temp.sonda_escritura(v_base || 'insertarP', s.ins_propio, 'public.' || s.objeto, s.tipo operator(pg_catalog.=) 'vista', 'INSERT',
                                        pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'insertar'));
        perform pg_temp.sonda_escritura(v_base || 'insertarPB', pg_temp.a_b(s.ins_propio), 'public.' || s.objeto, s.tipo operator(pg_catalog.=) 'vista', 'INSERT',
                                        pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'insertar'));
      end if;
      perform pg_temp.sonda_escritura(v_base || 'modificarB', pg_temp.a_b(s.upd), 'public.' || s.objeto, s.tipo operator(pg_catalog.=) 'vista', 'UPDATE',
                                      pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'modificar'));
      perform pg_temp.sonda_escritura(v_base || 'modificarS', c.sentencia, 'public.' || s.objeto, s.tipo operator(pg_catalog.=) 'vista', 'UPDATE',
                                      pg_temp.exige_sin_permiso(p_perfil, s.objeto, 'modificar'))
        from pg_temp.ciegas c where c.objeto operator(pg_catalog.=) s.objeto;
    end if;
  end loop;
end;
$f$;

create function pg_temp.sondear_negativos(p_perfil pg_catalog.text) returns void
language plpgsql
as $f$
declare
  r pg_catalog.record;
  v_res pg_catalog.text;
begin
  for r in select * from pg_temp.negativos where perfil operator(pg_catalog.=) p_perfil order by n loop
    begin
      execute r.sentencia;
      v_res := 'sin_error';
      raise exception 'sonda_deshecha' using errcode = 'ZZ001';
    exception when others then
      if sqlstate operator(pg_catalog.<>) 'ZZ001' then
        v_res := case when sqlstate operator(pg_catalog.=) 'P0001' then sqlstate || ':' || sqlerrm else sqlstate end;
      end if;
    end;
    insert into pg_temp.intentos (clave, estado) values ('negativo|' || r.n::pg_catalog.text, v_res);
  end loop;
end;
$f$;

grant execute on function
  pg_temp.sonda_escritura(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.bool, pg_catalog.text, pg_catalog.bool),
  pg_temp.sonda_lectura(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.bool),
  pg_temp.letra(pg_catalog.text, pg_catalog.text, pg_catalog.text),
  pg_temp.exige_sin_permiso(pg_catalog.text, pg_catalog.text, pg_catalog.text),
  pg_temp.corre_en_b(pg_catalog.text), pg_temp.a_b(pg_catalog.text),
  pg_temp.sonda_vetada(pg_catalog.text, pg_catalog.text, pg_catalog.text),
  pg_temp.sondear_perfil(pg_catalog.text), pg_temp.sondear_negativos(pg_catalog.text)
  to public;

-- Lo recogido, perfil por perfil. El dueño primero: sus lecturas son lo que «T» y «P» comparan.
select pg_temp.sondear_perfil('DUENO');
select pg_temp.como('SS');   select pg_temp.sondear_perfil('SS');
select pg_temp.como('UA');   select pg_temp.sondear_perfil('UA');
select pg_temp.como('UB');   select pg_temp.sondear_perfil('UB');
select pg_temp.como('UAB');  select pg_temp.sondear_perfil('UAB');
select pg_temp.como('USV');  select pg_temp.sondear_perfil('USV');
select pg_temp.como('AD1');  select pg_temp.sondear_perfil('AD1');
select pg_temp.como('AD2');  select pg_temp.sondear_perfil('AD2');
select pg_temp.como('CON');  select pg_temp.sondear_perfil('CON');
select pg_temp.como('SR');   select pg_temp.sondear_perfil('SR');
-- Los negativos: cada uno con su perfil.
select pg_temp.como('AD2');  select pg_temp.sondear_negativos('AD2');
select pg_temp.como('DUENO'); select pg_temp.sondear_negativos('DUENO');

-- ---------------------------------------------------------------------
-- 5 · Lo esperado de cada celda, a partir de su letra y de lo que lee el dueño.
-- ---------------------------------------------------------------------
create function pg_temp.cuenta_dueno(p_objeto pg_catalog.text, p_cliente pg_catalog.text) returns pg_catalog.int4
language sql stable
as $f$
  select coalesce(pg_catalog.substring(pg_temp.intento('DUENO|' || p_objeto || '|leer'), p_cliente || '=([0-9]+)')::pg_catalog.int4, 0);
$f$;

create function pg_temp.esperado(p_perfil pg_catalog.text, p_objeto pg_catalog.text, p_op pg_catalog.text, p_letra pg_catalog.text)
returns pg_catalog.text
language plpgsql stable
as $f$
declare
  v_tipo pg_catalog.text;
  v_fuente pg_catalog.text;
  p pg_catalog.record;
begin
  select s.tipo, coalesce(s.fuente, s.objeto) into v_tipo, v_fuente
    from pg_temp.sentencias s where s.objeto operator(pg_catalog.=) p_objeto;
  select * into p from pg_temp.permitidos where perfil operator(pg_catalog.=) p_perfil;
  if p_op operator(pg_catalog.=) 'leer' then
    return case p_letra
      when 'X' then '42501' || case when pg_temp.exige_sin_permiso(p_perfil, p_objeto, p_op) then ':f' else '' end
      when '0' then 'n=0;A=0;B=0;C=0'
      when 'T' then pg_temp.intento('DUENO|' || p_objeto || '|leer')
      when 'C' then pg_temp.intento('DUENO|' || p_objeto || '|leer') || ';vetada=42501'
      when 'P' then pg_catalog.format('n=%s;A=%s;B=%s;C=%s',
        case when p.a then pg_temp.cuenta_dueno(v_fuente, 'A') else 0 end
        + case when p.b then pg_temp.cuenta_dueno(v_fuente, 'B') else 0 end
        + case when p.c then pg_temp.cuenta_dueno(v_fuente, 'C') else 0 end,
        case when p.a then pg_temp.cuenta_dueno(p_objeto, 'A') else 0 end,
        case when p.b then pg_temp.cuenta_dueno(p_objeto, 'B') else 0 end,
        case when p.c then pg_temp.cuenta_dueno(p_objeto, 'C') else 0 end)
      else null
    end;
  end if;
  return case p_letra
    when 'X' then case when v_tipo operator(pg_catalog.=) 'vista' then 'denegado:f'
                       else '42501' || case when pg_temp.exige_sin_permiso(p_perfil, p_objeto, p_op) then ':f' else '' end end
    when '0' then 'ok:0'
    when 'C' then 'ok:1'
    when 'T' then pg_catalog.format('ok:%s', pg_temp.cuenta_dueno(p_objeto, 'n'))
    else null
  end
  -- «borrar» exige además que no haya TRUNCATE, REFERENCES, TRIGGER ni MAINTAIN (A-M-4).
  || case when p_op operator(pg_catalog.=) 'borrar' then ';otros=' else '' end;
end;
$f$;

-- Lo que se compara de cada celda: el resultado de la sonda (un resultado que falta es «sin_resultado» y
-- no pasa nunca, ni siquiera frente a un esperado nulo: R-m-1); en los perfiles que repiten insertar y
-- modificar sobre una fila de B, el de B tiene que ser el mismo (si no, queda «… / B: …» y falla); en la
-- lectura de una «C», además la de la columna vetada.
create function pg_temp.actual(p_perfil pg_catalog.text, p_objeto pg_catalog.text, p_op pg_catalog.text, p_letra pg_catalog.text)
returns pg_catalog.text
language plpgsql stable
as $f$
declare
  v_clave pg_catalog.text := p_perfil || '|' || p_objeto || '|' || p_op;
  v_a pg_catalog.text := coalesce(pg_temp.intento(v_clave), 'sin_resultado');
  v_b pg_catalog.text := pg_temp.intento(v_clave || 'B');
  v_base pg_catalog.text := coalesce(pg_temp.intento(v_clave), 'sin_resultado');
  v_propio pg_catalog.bool;
  k pg_catalog.text;
  v_x pg_catalog.text;
begin
  select s.ins_propio is not null into v_propio from pg_temp.sentencias s where s.objeto operator(pg_catalog.=) p_objeto;
  if p_op in ('insertar', 'modificar') and pg_temp.corre_en_b(p_perfil) then
    v_b := coalesce(v_b, 'sin_resultado');
    if v_b operator(pg_catalog.<>) v_a then
      v_a := v_a || ' / B: ' || v_b;
    end if;
  end if;
  -- Modificar a ciegas (sin where ni lectura de columnas): tiene que dar lo mismo que la sentencia de la celda (R2-M-1).
  if p_op operator(pg_catalog.=) 'modificar' and pg_temp.corre_en_b(p_perfil) then
    v_x := coalesce(pg_temp.intento(v_clave || 'S'), 'sin_resultado');
    if v_x operator(pg_catalog.<>) v_base then
      v_a := v_a || ' / S: ' || v_x;
    end if;
  end if;
  -- Insertar sobre el propio cliente (A y B): tiene que dar lo mismo que la sentencia de la celda (A-M-3).
  if p_op operator(pg_catalog.=) 'insertar' and pg_temp.corre_en_b(p_perfil) and coalesce(v_propio, false) then
    foreach k in array array['P', 'PB'] loop
      v_x := coalesce(pg_temp.intento(v_clave || k), 'sin_resultado');
      if v_x operator(pg_catalog.<>) v_base then
        v_a := v_a || ' / ' || k || ': ' || v_x;
      end if;
    end loop;
  end if;
  if p_op operator(pg_catalog.=) 'borrar' then
    v_a := v_a || ';otros=' || pg_temp.privilegios_extra(p_perfil, p_objeto);
  end if;
  if p_letra operator(pg_catalog.=) 'C' and p_op operator(pg_catalog.=) 'leer' then
    v_a := v_a || ';vetada=' || coalesce(pg_temp.intento(p_perfil || '|' || p_objeto || '|vetada'), 'sin_resultado');
  end if;
  return v_a;
end;
$f$;

-- ---------------------------------------------------------------------
-- 6 · Las 828 celdas: 23 objetos × 9 perfiles × 4 operaciones.
-- Un resultado que falta (sin_resultado) o una letra desconocida (esperado nulo) no pasan.
-- ---------------------------------------------------------------------
select is(
  pg_temp.actual(c.perfil, c.objeto, c.op, c.letra),
  pg_temp.esperado(c.perfil, c.objeto, c.op, c.letra),
  c.perfil || ' · ' || c.objeto || ' · ' || c.op || ' · ' || c.letra)
  from (
    select m.objeto, p.perfil, o.op,
           pg_catalog.substr(
             case p.perfil when 'SS' then m.ss when 'UA' then m.ua when 'UB' then m.ub when 'UAB' then m.uab
                           when 'USV' then m.usv when 'AD1' then m.ad1 when 'AD2' then m.ad2
                           when 'CON' then m.con when 'SR' then m.sr end, o.orden, 1) as letra,
           p.orden as orden_perfil, o.orden as orden_op
      from pg_temp.matriz m
     cross join (values ('SS', 1), ('UA', 2), ('UB', 3), ('UAB', 4), ('USV', 5), ('AD1', 6), ('AD2', 7), ('CON', 8), ('SR', 9)) as p (perfil, orden)
     cross join (values ('leer', 1), ('insertar', 2), ('modificar', 3), ('borrar', 4)) as o (op, orden)
  ) c
 order by c.orden_perfil, c.objeto, c.orden_op;

-- ---------------------------------------------------------------------
-- 7 · REQ-057 y CA-035: con filas de A en todas las tablas, el conjunto de objetos en los que el
-- usuario de A lee alguna fila es exactamente la lista de REQ-057 (0 de más, 0 de menos). Con la
-- precondición: el dueño ve filas en los 23 objetos y, en los de «P» y en todo objeto con columna de
-- cliente (también auditoria, A-M-5), de A y de B (y de C en los de «P»), para que ni un 0 ni un reparto por cliente
-- pasen por estar vacíos.
-- ---------------------------------------------------------------------
select is(
  (select pg_catalog.string_agg(s.objeto, ',' order by s.objeto)
     from pg_temp.sentencias s
    where coalesce(pg_catalog.substring(pg_temp.intento('UA|' || s.objeto || '|leer'), '^n=([0-9]+);')::pg_catalog.int4, 0) operator(pg_catalog.>) 0)
  || ';precondicion=' ||
  ((select pg_catalog.bool_and(coalesce(pg_catalog.substring(pg_temp.intento('DUENO|' || s.objeto || '|leer'), '^n=([0-9]+);')::pg_catalog.int4, 0) operator(pg_catalog.>) 0)
      from pg_temp.sentencias s)
   and (select pg_catalog.bool_and(
               pg_temp.cuenta_dueno(coalesce(s.fuente, s.objeto), 'A') operator(pg_catalog.>) 0
           and pg_temp.cuenta_dueno(coalesce(s.fuente, s.objeto), 'B') operator(pg_catalog.>) 0
           and (pg_temp.cuenta_dueno(coalesce(s.fuente, s.objeto), 'C') operator(pg_catalog.>) 0 or m.ua not like 'P%'))
         from pg_temp.sentencias s join pg_temp.matriz m on m.objeto operator(pg_catalog.=) s.objeto
        where m.ua like 'P%' or s.cl_expr is not null))::pg_catalog.text,
  'catalogo_problemas,clientes,ejecuciones,informes,licencias,metricas_version,ordenes,resumen_cliente,suscripciones;precondicion=true',
  'REQ-057 · CA-035: el usuario de A lee exactamente los 9 objetos de la lista (0 de más, 0 de menos), con filas de A, B y C en todos');

-- ---------------------------------------------------------------------
-- 8 · Los 15 negativos de las celdas «C».
-- ---------------------------------------------------------------------
select is(pg_temp.intento('negativo|' || n.n::pg_catalog.text), n.esperado,
          'negativo ' || n.n::pg_catalog.text || ' · ' || n.perfil || ' · ' || n.descripcion)
  from pg_temp.negativos n order by n.n;

select * from finish();
rollback;
