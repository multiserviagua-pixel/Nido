-- =====================================================================
-- 01 · Estructura (función 010, T-008; diseño, «Pruebas»).
-- REQ-004, REQ-011, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-026, REQ-032, REQ-046,
-- REQ-049, REQ-056 · CA-004, CA-016, CA-019, CA-021 (en serie), CA-027 (índices), CA-034.
--
-- ESCRITA, NO EJECUTADA EN CI (artículo 13): la primera ejecución real es la de T-013
-- (supabase test db). Lo que sí se ejecutó en local es esta misma prueba contra el arnés
-- PGlite con pglite-pgtap (supabase/tests/pglite/pgtap.test.ts), que no sustituye a CI.
--
-- Todo va calificado: las sombras de N-3 (ayudas/sombras.psql) hacen fallar cualquier nombre
-- de tabla, vista o tipo de public o privado sin su esquema. Dueño: postgres. Un solo archivo,
-- una transacción, rollback al final.
--
-- Las 36 aserciones: las 23 del diseño van numeradas 1 a 23. Las de origen N-1, N-2 y N-4 del
-- dictamen de la vuelta 2 (condiciones 1 y 2) van como N-1, N-2 (a-c) y N-4 (a-i) y entran
-- en declaradas.json con su origen (T-011).
--
-- Lista cerrada de funciones security definer (N-2): por FIRMA (regprocedure), recorriendo todo
-- esquema que no sea de la plataforma (N-1) más privado. Las tareas futuras (021, 014...) solo
-- añaden firmas a esa lista; si una función cambia de parámetros, se quita su firma antigua de
-- la lista (y la migración la borra con drop y revoke) y se añade la nueva.
-- =====================================================================
begin;

\ir ayudas/perfiles.psql
\ir ayudas/sombras.psql

select plan(36);

-- Esquemas de la plataforma (N-1; diseño D-3). La primera ejecución de T-013 la confirma y el
-- auditor-seguridad la acepta (T-011); un esquema no listado cae en la regla.
create temp table esquemas_plataforma (nombre pg_catalog.text primary key);
insert into pg_temp.esquemas_plataforma (nombre) values
  ('pg_catalog'), ('information_schema'), ('auth'), ('storage'), ('realtime'), ('_realtime'),
  ('extensions'), ('graphql'), ('graphql_public'), ('vault'), ('pgsodium'), ('pgsodium_masks'),
  ('pgbouncer'), ('net'), ('cron'), ('supabase_functions'), ('supabase_migrations');

-- Esquema que no es de la plataforma ni temporal ni de toast: el alcance de N-1 y N-2.
create view pg_temp.esquemas_nuestros as
  select n.oid as oid, n.nspname::pg_catalog.text as nombre
    from pg_catalog.pg_namespace n
   where (n.nspname operator(pg_catalog.<>) all (array(select e.nombre from pg_temp.esquemas_plataforma e))
          and n.nspname operator(pg_catalog.!~~) 'pg\_toast%'
          and n.nspname operator(pg_catalog.!~~) 'pg\_temp%')
      or n.nspname operator(pg_catalog.=) 'privado';

-- Tablas de public y privado (ordinarias y particionadas).
create view pg_temp.tablas_nuestras as
  select c.oid as oid, n.nspname::pg_catalog.text as esquema, c.relname::pg_catalog.text as nombre
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid operator(pg_catalog.=) c.relnamespace
   where n.nspname in ('public', 'privado') and c.relkind in ('r', 'p');

-- Columnas «de texto» (D-7, A-14): TODA columna de public o privado cuyo tipo base no está en la lista
-- blanca. El tipo base se resuelve por typbasetype (dominios) y typelem (listas), de modo que un
-- dominio sobre text, un compuesto, bytea, xml, name, "char" o tsvector cuentan como texto. Lista
-- blanca: int2, int4, int8, bool, uuid, timestamptz (todos de pg_catalog) y los enumerados de public;
-- es lo que hay hoy en las tablas, sin tipos de reserva (date, interval... se añaden el día que
-- una tabla los use, con su revisión).
create view pg_temp.columnas_de_texto as
  with recursive resolucion (attrelid, attnum, tipo) as (
    select a.attrelid, a.attnum, a.atttypid
      from pg_catalog.pg_attribute a
     where a.attnum operator(pg_catalog.>) 0 and not a.attisdropped
       and a.attrelid in (select t.oid from pg_temp.tablas_nuestras t)
    union all
    select r.attrelid, r.attnum,
           case when ty.typtype operator(pg_catalog.=) 'd' then ty.typbasetype else ty.typelem end
      from resolucion r
      join pg_catalog.pg_type ty on ty.oid operator(pg_catalog.=) r.tipo
     where ty.typtype operator(pg_catalog.=) 'd'
        or (ty.typcategory operator(pg_catalog.=) 'A' and ty.typelem operator(pg_catalog.<>) 0)
  )
  select distinct t.oid as tabla_oid, t.esquema, t.nombre as tabla, a.attname::pg_catalog.text as columna, a.attnum
    from resolucion r
    join pg_temp.tablas_nuestras t on t.oid operator(pg_catalog.=) r.attrelid
    join pg_catalog.pg_attribute a on a.attrelid operator(pg_catalog.=) r.attrelid and a.attnum operator(pg_catalog.=) r.attnum
    join pg_catalog.pg_type ty on ty.oid operator(pg_catalog.=) r.tipo
   where not (ty.typtype operator(pg_catalog.=) 'd'
              or (ty.typcategory operator(pg_catalog.=) 'A' and ty.typelem operator(pg_catalog.<>) 0))
     and not ((ty.typnamespace operator(pg_catalog.=) 'pg_catalog'::pg_catalog.regnamespace
               and ty.typname in ('int2', 'int4', 'int8', 'bool', 'uuid', 'timestamptz'))
              or (ty.typtype operator(pg_catalog.=) 'e' and ty.typnamespace operator(pg_catalog.=) 'public'::pg_catalog.regnamespace));

-- 1 · RLS en todas las tablas de public y privado (CA-004).
select is_empty(
  $q$ select t.esquema || '.' || t.nombre from pg_temp.tablas_nuestras t
       join pg_catalog.pg_class c on c.oid operator(pg_catalog.=) t.oid
      where not c.relrowsecurity $q$,
  '1 · todas las tablas de public y privado tienen RLS (CA-004)');

-- 2 · Las 21 tablas de public (CA-034, REQ-056).
select set_eq(
  $q$ select t.nombre from pg_temp.tablas_nuestras t where t.esquema operator(pg_catalog.=) 'public' $q$,
  array['administradores', 'ajustes_globales', 'alertas', 'auditoria', 'catalogo_problemas', 'clientes',
        'clientes_oauth', 'codigos_activacion', 'codigos_autorizacion', 'conexiones', 'ejecuciones',
        'eventos_stripe', 'informes', 'licencias', 'ordenes', 'publicaciones', 'reglas_cliente',
        'suscripciones', 'tokens', 'usuarios_cliente', 'versiones_prompt']::pg_catalog.text[],
  '2 · public tiene exactamente las 21 tablas del modelo (CA-034)');

-- 3 · Las columnas de texto son exactamente las 26 de D-7 (CA-016) y las tres de metadatos de
-- privado.permisos_por_defecto_previos (nombre de esquema, tipo de objeto y lista de permisos de
-- la migración 1: sin permisos para nadie, RLS, ninguna política; no guardan contenido).
select set_eq(
  $q$ select c.tabla || '.' || c.columna from pg_temp.columnas_de_texto c $q$,
  array['auditoria.accion', 'auditoria.objeto_id', 'auditoria.objeto_tipo', 'catalogo_problemas.codigo',
        'catalogo_problemas.descripcion', 'clientes.nombre', 'clientes_oauth.client_id',
        'clientes_oauth.redirect_uris', 'codigos_activacion.codigo_hmac', 'codigos_autorizacion.code_challenge',
        'codigos_autorizacion.codigo_hmac', 'codigos_autorizacion.recurso', 'codigos_autorizacion.redirect_uri',
        'eventos_stripe.id', 'eventos_stripe.tipo', 'informes.problemas', 'informes.version_prompt',
        'suscripciones.stripe_customer_id', 'suscripciones.stripe_subscription_id', 'tokens.recurso',
        'tokens.token_hmac', 'versiones_prompt.commit_sha', 'versiones_prompt.contenido',
        'versiones_prompt.huella_sha256', 'versiones_prompt.notas', 'versiones_prompt.version',
        'permisos_por_defecto_previos.acl', 'permisos_por_defecto_previos.esquema',
        'permisos_por_defecto_previos.tipo']::pg_catalog.text[],
  '3 · toda columna fuera de la lista blanca de tipos es una de las 26 de D-7 o de los metadatos de privado (CA-016, REQ-020)');

-- 4 · Cada columna de texto tiene una restricción check propia con una expresión regular anclada
-- (formato, lista o longitud): no basta cualquier check (m-3). Excepción única: la tabla de
-- metadatos privado.permisos_por_defecto_previos (sin permisos, valores que escribe una migración).
-- LÍMITE: no mide lo estricta que es la expresión (`^.*$` pasaría); los valores límite los prueban
-- m02_m03 y m06.
select is_empty(
  $q$ select c.tabla || '.' || c.columna from pg_temp.columnas_de_texto c
       where not (c.esquema operator(pg_catalog.=) 'privado' and c.tabla operator(pg_catalog.=) 'permisos_por_defecto_previos')
         and not exists (
         select 1 from pg_catalog.pg_constraint k
          where k.conrelid operator(pg_catalog.=) c.tabla_oid and k.contype operator(pg_catalog.=) 'c'
            and c.attnum operator(pg_catalog.=) any (k.conkey)
            and pg_catalog.pg_get_constraintdef(k.oid) operator(pg_catalog.~) ' ~ ''\^') $q$,
  '4 · ninguna columna de texto sin un check con expresión regular anclada (CA-016)');

-- 5 · Informes y reglas: las columnas son exactamente estas, con estos tipos (A-14; artículo 1, REQ-020, REQ-023).
-- El tipo de lo que no es de pg_catalog va con su esquema (format_type depende de la ruta de búsqueda).
select set_eq(
  $q$ select c.relname::pg_catalog.text || '.' || a.attname::pg_catalog.text || ':' ||
             case when ty.typnamespace operator(pg_catalog.=) 'pg_catalog'::pg_catalog.regnamespace
                  then pg_catalog.format_type(a.atttypid, a.atttypmod)
                  else ty.typnamespace::pg_catalog.regnamespace::pg_catalog.text || '.' || ty.typname::pg_catalog.text end
        from pg_catalog.pg_class c
        join pg_catalog.pg_attribute a on a.attrelid operator(pg_catalog.=) c.oid
        join pg_catalog.pg_type ty on ty.oid operator(pg_catalog.=) a.atttypid
       where c.relnamespace operator(pg_catalog.=) 'public'::pg_catalog.regnamespace
         and c.relname in ('informes', 'reglas_cliente')
         and a.attnum operator(pg_catalog.>) 0 and not a.attisdropped $q$,
  array['informes.almacenamiento:public.almacenamiento', 'informes.asistente:public.asistente',
        'informes.borradores:integer', 'informes.campos_descartados:smallint', 'informes.cliente_id:uuid',
        'informes.comp_almacenamiento:boolean', 'informes.comp_contexto:boolean', 'informes.comp_correo:boolean',
        'informes.comp_registro:boolean', 'informes.documentos:integer', 'informes.ejecucion_id:uuid',
        'informes.estado:public.estado_informe', 'informes.facturas_pendientes:integer',
        'informes.frecuencia_horas:smallint', 'informes.id:uuid', 'informes.modo:public.modo_ejecucion',
        'informes.problemas:text[]', 'informes.recibido_en:timestamp with time zone',
        'informes.sin_tratar:integer', 'informes.tratados:integer', 'informes.urgentes:integer',
        'informes.version_esquema:smallint', 'informes.version_prompt:text',
        'reglas_cliente.actualizado_en:timestamp with time zone', 'reglas_cliente.cliente_id:uuid',
        'reglas_cliente.descargar_facturas_por_enlace:boolean', 'reglas_cliente.guardar_adjuntos:boolean',
        'reglas_cliente.max_correos_por_revision:smallint', 'reglas_cliente.preparar_borradores:boolean',
        'reglas_cliente.ventana_dias:smallint']::pg_catalog.text[],
  '5 · informes y reglas_cliente tienen exactamente estas columnas y tipos, sin una más (REQ-020, REQ-023)');

-- 6 a 8 · Un HMAC sin su formato se rechaza en cada una de las tres columnas (CA-019).
select throws_like(
  pg_catalog.format($q$ insert into public.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
                       values (%L, 'no-es-un-hmac', pg_catalog.now() + interval '1 day') $q$, pg_temp.id('LA')),
  '%violates check constraint "%hmac%"',
  '6 · codigos_activacion.codigo_hmac sin formato se rechaza (CA-019)');
select throws_like(
  pg_catalog.format($q$ insert into public.codigos_autorizacion
                          (codigo_hmac, conexion_id, cliente_oauth_id, redirect_uri, code_challenge, recurso, caduca_en)
                       values ('no-es-un-hmac', %L, %L, 'https://example.com/callback', pg_catalog.repeat('Z', 43),
                               'https://example.com/mcp', pg_catalog.now() + interval '1 minute') $q$,
                    pg_temp.id('XA'), pg_temp.id('OA')),
  '%violates check constraint "%hmac%"',
  '7 · codigos_autorizacion.codigo_hmac sin formato se rechaza (CA-019)');
select throws_like(
  pg_catalog.format($q$ insert into public.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en)
                       values (%L, 'acceso', 'no-es-un-hmac', 'https://example.com/mcp', pg_catalog.now() + interval '1 hour') $q$,
                    pg_temp.id('XA')),
  '%violates check constraint "%hmac%"',
  '8 · tokens.token_hmac sin formato se rechaza (CA-019)');

-- 9 · Toda columna de token o código es un HMAC con su formato; la única excepción es catalogo_problemas.codigo (CA-019, REQ-024).
select is_empty(
  $q$ select t.nombre || '.' || a.attname
        from pg_temp.tablas_nuestras t
        join pg_catalog.pg_attribute a on a.attrelid operator(pg_catalog.=) t.oid
       where a.attnum operator(pg_catalog.>) 0 and not a.attisdropped
         and a.attname::pg_catalog.text ~ '(token|codigo|secreto|clave|password|contrasena)'
         and not (t.nombre operator(pg_catalog.=) 'catalogo_problemas' and a.attname operator(pg_catalog.=) 'codigo')
         and not (a.attname::pg_catalog.text ~ '_hmac$'
                  and exists (select 1 from pg_catalog.pg_constraint k
                               where k.conrelid operator(pg_catalog.=) t.oid and k.contype operator(pg_catalog.=) 'c'
                                 and a.attnum operator(pg_catalog.=) any (k.conkey)
                                 and pg_catalog.pg_get_constraintdef(k.oid) operator(pg_catalog.~~) '%[0-9a-f]{64}%')) $q$,
  '9 · ninguna columna de token o código sin ser un HMAC con su formato (CA-019, REQ-024)');

-- 10 · Una sola fila de ajustes globales (CA-021, REQ-049).
select throws_ok(
  $q$ insert into public.ajustes_globales (id) values (true) $q$,
  '23505', null,
  '10 · la segunda fila de ajustes_globales se rechaza (CA-021)');

-- 11 · Un solo informe por ejecución (CA-021, REQ-049).
insert into public.ejecuciones (id, conexion_id, cliente_id, estado_servido)
  values (pg_temp.id('N1'), pg_temp.id('XA'), pg_temp.id('CA'), 'activa');
insert into public.informes
  (ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento, version_prompt, frecuencia_horas,
   tratados, sin_tratar, borradores, documentos, facturas_pendientes, urgentes,
   comp_correo, comp_almacenamiento, comp_contexto, comp_registro, problemas)
  values (pg_temp.id('N1'), pg_temp.id('CA'), 'ok', 'desatendido', 'claude', 'drive', '1.0', 24,
          1, 1, 1, 1, 1, 1, true, true, true, true, '{}');
select throws_ok(
  pg_catalog.format($q$ insert into public.informes
      (ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento, version_prompt, frecuencia_horas,
       tratados, sin_tratar, borradores, documentos, facturas_pendientes, urgentes,
       comp_correo, comp_almacenamiento, comp_contexto, comp_registro, problemas)
      values (%L, %L, 'ok', 'desatendido', 'claude', 'drive', '1.0', 24, 2, 2, 2, 2, 2, 2, true, true, true, true, '{}') $q$,
    pg_temp.id('N1'), pg_temp.id('CA')),
  '23505', null,
  '11 · el segundo informe de una ejecución se rechaza (CA-021)');

-- 12 · Una sola licencia no revocada por cliente (CA-021, REQ-026).
select throws_ok(
  pg_catalog.format($q$ insert into public.licencias (cliente_id) values (%L) $q$, pg_temp.id('CA')),
  '23505', null,
  '12 · la segunda licencia no revocada del mismo cliente se rechaza (CA-021)');

-- 13 · Índice en la primera columna que usan las políticas y sus funciones de apoyo (REQ-032, CA-027).
select is_empty(
  $q$ select e.tabla || '.' || e.columna
        from (values ('clientes', 'id'), ('administradores', 'usuario_id'), ('usuarios_cliente', 'usuario_id'),
                     ('usuarios_cliente', 'cliente_id'), ('licencias', 'cliente_id'), ('ordenes', 'cliente_id'),
                     ('ejecuciones', 'cliente_id'), ('informes', 'cliente_id'), ('suscripciones', 'cliente_id'))
             as e (tabla, columna)
       where not exists (
         select 1
           from pg_catalog.pg_index i
           join pg_catalog.pg_class c on c.oid operator(pg_catalog.=) i.indrelid
           join pg_catalog.pg_attribute a on a.attrelid operator(pg_catalog.=) c.oid
                                          and a.attnum operator(pg_catalog.=) i.indkey[0]
          where c.relnamespace operator(pg_catalog.=) 'public'::pg_catalog.regnamespace
            and c.relname::pg_catalog.text operator(pg_catalog.=) e.tabla
            and a.attname::pg_catalog.text operator(pg_catalog.=) e.columna
            and i.indpred is null) $q$,
  '13 · cada columna que usan las políticas tiene un índice que empieza por ella (REQ-032)');

-- 14 · Todos los objetos de public y privado son de postgres (D-4, 4).
select is_empty(
  $q$ select 'relacion ' || c.relname from pg_catalog.pg_class c
       where c.relnamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
         and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
         and c.relowner operator(pg_catalog.<>) 'postgres'::pg_catalog.regrole
      union all
      select 'funcion ' || p.proname from pg_catalog.pg_proc p
       where p.pronamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
         and p.proowner operator(pg_catalog.<>) 'postgres'::pg_catalog.regrole
      union all
      select 'tipo ' || t.typname from pg_catalog.pg_type t
       where t.typnamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
         and t.typtype in ('e', 'd')
         and t.typowner operator(pg_catalog.<>) 'postgres'::pg_catalog.regrole $q$,
  '14 · todos los objetos de public y privado son de postgres (D-4)');

-- 15 · Las vistas son security_invoker (D-2, 1).
select set_eq(
  $q$ select c.relname::pg_catalog.text || ':' || coalesce(c.reloptions @> array['security_invoker=true'], false)::pg_catalog.text
        from pg_catalog.pg_class c
       where c.relnamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
         and c.relkind in ('v', 'm') $q$,
  array['metricas_version:true', 'resumen_cliente:true']::pg_catalog.text[],
  '15 · las dos vistas son security_invoker = true y no hay otras (D-2, 1)');

-- 16 · search_path = pg_catalog, pg_temp en toda función de privado (D-3, B-1).
select is_empty(
  $q$ select p.oid::pg_catalog.regprocedure::pg_catalog.text from pg_catalog.pg_proc p
       where p.pronamespace operator(pg_catalog.=) 'privado'::pg_catalog.regnamespace
         and (p.proconfig is null
              or not ('search_path=pg_catalog, pg_temp' operator(pg_catalog.=) any (p.proconfig))) $q$,
  '16 · toda función de privado fija search_path = pg_catalog, pg_temp (D-3)');

-- 17 · Inmutabilidad: los seis disparadores de solo inserción y sin vaciado, con tgenabled = 'A' (D-3).
select set_eq(
  $q$ select c.relname::pg_catalog.text || '.' || g.tgname::pg_catalog.text
        from pg_catalog.pg_trigger g join pg_catalog.pg_class c on c.oid operator(pg_catalog.=) g.tgrelid
       where not g.tgisinternal and g.tgenabled operator(pg_catalog.=) 'A' $q$,
  array['auditoria.auditoria_sin_vaciado', 'auditoria.auditoria_solo_insercion',
        'publicaciones.publicaciones_inmutable', 'publicaciones.publicaciones_sin_vaciado',
        'versiones_prompt.versiones_prompt_inmutable', 'versiones_prompt.versiones_prompt_sin_vaciado']::pg_catalog.text[],
  '17 · inmutabilidad con tgenabled = A en auditoria, versiones_prompt y publicaciones (D-3)');

-- 18 · privado sin usage para anon ni para PUBLIC (REQ-033).
select is_empty(
  $q$ select a.grantee::pg_catalog.text
        from pg_catalog.pg_namespace n cross join lateral pg_catalog.aclexplode(n.nspacl) a
       where n.nspname operator(pg_catalog.=) 'privado' and a.privilege_type operator(pg_catalog.=) 'USAGE'
         and (a.grantee operator(pg_catalog.=) 0 or a.grantee operator(pg_catalog.=) 'anon'::pg_catalog.regrole) $q$,
  '18 · privado no da usage a anon ni a PUBLIC (REQ-033)');

-- 19 y 20 · Instantáneas de authenticated y service_role = tabla D-5 (objeto|columna|privilegio).
-- Columna vacía = permiso de tabla; con nombre = permiso de columna. Sin TRUNCATE, REFERENCES,
-- TRIGGER ni MAINTAIN: lo que no está en la lista no existe.
create temp table d5 (rol pg_catalog.text, fila pg_catalog.text);
insert into pg_temp.d5 (rol, fila)
  select 'authenticated', f from unnest(array[
    'administradores||SELECT',
    'ajustes_globales||SELECT',
    'alertas||SELECT',
    'auditoria||SELECT',
    'catalogo_problemas||SELECT',
    'clientes||SELECT',
    'conexiones||SELECT',
    'ejecuciones||SELECT',
    'informes||SELECT',
    'licencias||SELECT',
    'metricas_version||SELECT',
    'ordenes||SELECT',
    'publicaciones||SELECT',
    'reglas_cliente||SELECT',
    'resumen_cliente||SELECT',
    'suscripciones||SELECT',
    'usuarios_cliente||SELECT',
    'versiones_prompt||SELECT',
    'usuarios_cliente||DELETE',
    'clientes|nombre|INSERT',
    'clientes|canal|INSERT',
    'clientes|frecuencia_esperada_horas|INSERT',
    'usuarios_cliente|usuario_id|INSERT',
    'usuarios_cliente|cliente_id|INSERT',
    'licencias|cliente_id|INSERT',
    'licencias|estado_manual|INSERT',
    'licencias|caduca_en|INSERT',
    'codigos_activacion|licencia_id|INSERT',
    'codigos_activacion|codigo_hmac|INSERT',
    'codigos_activacion|caduca_en|INSERT',
    'publicaciones|canal|INSERT',
    'publicaciones|version_id|INSERT',
    'publicaciones|motivo|INSERT',
    'reglas_cliente|cliente_id|INSERT',
    'reglas_cliente|max_correos_por_revision|INSERT',
    'reglas_cliente|ventana_dias|INSERT',
    'reglas_cliente|guardar_adjuntos|INSERT',
    'reglas_cliente|preparar_borradores|INSERT',
    'reglas_cliente|descargar_facturas_por_enlace|INSERT',
    'ordenes|cliente_id|INSERT',
    'ordenes|tipo|INSERT',
    'catalogo_problemas|codigo|INSERT',
    'catalogo_problemas|descripcion|INSERT',
    'catalogo_problemas|activo|INSERT',
    'clientes|nombre|UPDATE',
    'clientes|canal|UPDATE',
    'clientes|frecuencia_esperada_horas|UPDATE',
    'clientes|estado|UPDATE',
    'licencias|estado|UPDATE',
    'licencias|estado_manual|UPDATE',
    'licencias|caduca_en|UPDATE',
    'conexiones|revocada_en|UPDATE',
    'reglas_cliente|max_correos_por_revision|UPDATE',
    'reglas_cliente|ventana_dias|UPDATE',
    'reglas_cliente|guardar_adjuntos|UPDATE',
    'reglas_cliente|preparar_borradores|UPDATE',
    'reglas_cliente|descargar_facturas_por_enlace|UPDATE',
    'ordenes|estado|UPDATE',
    'ajustes_globales|pausa_global|UPDATE',
    'ajustes_globales|stripe_en_observacion|UPDATE',
    'catalogo_problemas|descripcion|UPDATE',
    'catalogo_problemas|activo|UPDATE',
    'alertas|resuelta_en|UPDATE',
    'codigos_activacion|id|SELECT',
    'codigos_activacion|licencia_id|SELECT',
    'codigos_activacion|caduca_en|SELECT',
    'codigos_activacion|usado_en|SELECT',
    'codigos_activacion|creado_en|SELECT',
    'codigos_activacion|creado_por|SELECT'
  ]::pg_catalog.text[]) as f;
insert into pg_temp.d5 (rol, fila)
  select 'service_role', f from unnest(array[
    'versiones_prompt||SELECT',
    'versiones_prompt|version|INSERT',
    'versiones_prompt|contenido|INSERT',
    'versiones_prompt|huella_sha256|INSERT',
    'versiones_prompt|commit_sha|INSERT',
    'versiones_prompt|notas|INSERT'
  ]::pg_catalog.text[]) as f;

create view pg_temp.permisos_de_rol as
  select r.rolname::pg_catalog.text as rol,
         c.relname::pg_catalog.text || '|' || '' || '|' || a.privilege_type as fila
    from pg_catalog.pg_class c
    cross join lateral pg_catalog.aclexplode(c.relacl) a
    join pg_catalog.pg_roles r on r.oid operator(pg_catalog.=) a.grantee
   where c.relnamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
     and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f') and a.grantee operator(pg_catalog.<>) c.relowner
  union all
  select r.rolname::pg_catalog.text,
         c.relname::pg_catalog.text || '|' || t.attname::pg_catalog.text || '|' || a.privilege_type
    from pg_catalog.pg_attribute t
    join pg_catalog.pg_class c on c.oid operator(pg_catalog.=) t.attrelid
    cross join lateral pg_catalog.aclexplode(t.attacl) a
    join pg_catalog.pg_roles r on r.oid operator(pg_catalog.=) a.grantee
   where c.relnamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
     and a.grantee operator(pg_catalog.<>) c.relowner;

select set_eq(
  $q$ select p.fila from pg_temp.permisos_de_rol p where p.rol operator(pg_catalog.=) 'authenticated' $q$,
  $q$ select d.fila from pg_temp.d5 d where d.rol operator(pg_catalog.=) 'authenticated' $q$,
  '19 · los permisos de authenticated son exactamente los de D-5');
select set_eq(
  $q$ select p.fila from pg_temp.permisos_de_rol p where p.rol operator(pg_catalog.=) 'service_role' $q$,
  $q$ select d.fila from pg_temp.d5 d where d.rol operator(pg_catalog.=) 'service_role' $q$,
  '20 · los permisos de service_role son exactamente los de D-5');

-- 21 · pg_default_acl cerrado: el valor EFECTIVO de los permisos por defecto de postgres no concede nada
-- a PUBLIC, anon, authenticated, service_role ni conector, en ningún esquema (D-4, 4; REQ-011).
-- PostgreSQL borra la fila global cuando su valor vuelve al de serie (p. ej., EXECUTE para PUBLIC en
-- funciones): una fila ausente no es «nada», es acldefault(); por eso el valor global se calcula con
-- coalesce(fila, acldefault(tipo, postgres)). Las filas por esquema solo suman: se miran tal cual.
-- Tipos de objeto: tablas (r), secuencias (S) y funciones (f), que son los que cierra D-4 (como en
-- m01.test.ts); el permiso por defecto de esquemas (n) no es de D-4: el uso de privado lo prueban
-- 18 y N-4 (e) y (f).
select is_empty(
  $q$ select '*:' || t.tipo
        from (values ('r', 'r'), ('S', 's'), ('f', 'f')) as t (tipo, tipo_acl)
        left join pg_catalog.pg_default_acl d
               on d.defaclrole operator(pg_catalog.=) 'postgres'::pg_catalog.regrole
              and d.defaclnamespace operator(pg_catalog.=) 0
              and d.defaclobjtype operator(pg_catalog.=) t.tipo::"char"
        cross join lateral pg_catalog.aclexplode(
              coalesce(d.defaclacl, pg_catalog.acldefault(t.tipo_acl::"char", 'postgres'::pg_catalog.regrole))) a
       where a.grantee operator(pg_catalog.=) 0
          or a.grantee in ('anon'::pg_catalog.regrole, 'authenticated'::pg_catalog.regrole,
                           'service_role'::pg_catalog.regrole, 'conector'::pg_catalog.regrole)
      union all
      select n.nspname::pg_catalog.text || ':' || d.defaclobjtype::pg_catalog.text
        from pg_catalog.pg_default_acl d
        join pg_catalog.pg_namespace n on n.oid operator(pg_catalog.=) d.defaclnamespace
        cross join lateral pg_catalog.aclexplode(d.defaclacl) a
       where d.defaclrole operator(pg_catalog.=) 'postgres'::pg_catalog.regrole
         and d.defaclobjtype in ('r', 'S', 'f')
         and (a.grantee operator(pg_catalog.=) 0
              or a.grantee in ('anon'::pg_catalog.regrole, 'authenticated'::pg_catalog.regrole,
                               'service_role'::pg_catalog.regrole, 'conector'::pg_catalog.regrole)) $q$,
  '21 · el valor efectivo de pg_default_acl de postgres no concede nada a PUBLIC, anon, authenticated, service_role ni conector (REQ-011)');

-- 22 · Las tablas de privado tienen RLS, ninguna política y ningún permiso para nadie más que su dueño.
select is_empty(
  $q$ select t.nombre from pg_temp.tablas_nuestras t
       join pg_catalog.pg_class c on c.oid operator(pg_catalog.=) t.oid
      where t.esquema operator(pg_catalog.=) 'privado'
        and (not c.relrowsecurity
             or exists (select 1 from pg_catalog.pg_policy p where p.polrelid operator(pg_catalog.=) c.oid)
             or exists (select 1 from pg_catalog.aclexplode(c.relacl) a where a.grantee operator(pg_catalog.<>) c.relowner)
             or exists (select 1 from pg_catalog.pg_attribute k where k.attrelid operator(pg_catalog.=) c.oid and k.attacl is not null)) $q$,
  '22 · las tablas de privado tienen RLS, ninguna política y ningún permiso ajeno (REQ-011)');

-- 23 · Cada permiso de escritura de una tabla de public tiene su disparador de auditoría (D-3, regla de 01).
-- tgtype: 4 = insert, 8 = delete, 16 = update. tgenabled O (origen) o A (siempre): uno desactivado
-- (D) o solo en réplica (R) no audita (A-11).
select is_empty(
  $q$ select e.tabla || ':' || e.operacion
        from (
          select c.oid as oid, c.relname::pg_catalog.text as tabla, a.privilege_type::pg_catalog.text as operacion
            from pg_catalog.pg_class c cross join lateral pg_catalog.aclexplode(c.relacl) a
           where c.relnamespace operator(pg_catalog.=) 'public'::pg_catalog.regnamespace and c.relkind in ('r', 'p')
             and a.grantee operator(pg_catalog.<>) c.relowner and a.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
          union
          select c.oid, c.relname::pg_catalog.text, a.privilege_type::pg_catalog.text
            from pg_catalog.pg_attribute t join pg_catalog.pg_class c on c.oid operator(pg_catalog.=) t.attrelid
            cross join lateral pg_catalog.aclexplode(t.attacl) a
           where c.relnamespace operator(pg_catalog.=) 'public'::pg_catalog.regnamespace and c.relkind in ('r', 'p')
             and a.grantee operator(pg_catalog.<>) c.relowner and a.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
        ) e
       where not exists (
         select 1 from pg_catalog.pg_trigger g
          where g.tgrelid operator(pg_catalog.=) e.oid and not g.tgisinternal
            and g.tgenabled in ('O', 'A')
            and g.tgfoid operator(pg_catalog.=) 'privado.auditar'::pg_catalog.regproc
            and (g.tgtype::pg_catalog.int4 operator(pg_catalog.&)
                 case e.operacion when 'INSERT' then 4 when 'DELETE' then 8 else 16 end) operator(pg_catalog.<>) 0) $q$,
  '23 · cada permiso de escritura tiene su disparador de auditoría (D-3)');

-- ---------------------------------------------------------------------
-- N-1 · search_path = pg_catalog, pg_temp en toda función security definer o de disparador cuyo
-- dueño sea postgres, en cualquier esquema que no sea de la plataforma (dictamen vuelta 2).
-- ---------------------------------------------------------------------
select is_empty(
  $q$ select p.oid::pg_catalog.regprocedure::pg_catalog.text
        from pg_catalog.pg_proc p join pg_temp.esquemas_nuestros s on s.oid operator(pg_catalog.=) p.pronamespace
       where (p.prosecdef or p.prorettype operator(pg_catalog.=) 'pg_catalog.trigger'::pg_catalog.regtype
              or p.prorettype operator(pg_catalog.=) 'pg_catalog.event_trigger'::pg_catalog.regtype)
         and p.proowner operator(pg_catalog.=) 'postgres'::pg_catalog.regrole
         and (p.proconfig is null
              or not ('search_path=pg_catalog, pg_temp' operator(pg_catalog.=) any (p.proconfig))) $q$,
  'N-1 · toda función security definer o de disparador de postgres fuera de la plataforma fija pg_catalog, pg_temp');

-- ---------------------------------------------------------------------
-- N-2 (opción a) · lista cerrada de funciones security definer, por firma (regprocedure), en todo
-- esquema que no sea de la plataforma. Columnas: firma, escribe en una tabla auditada, llama a
-- privado.registrar_auditoria(). Una función fuera de la lista hace fallar la prueba.
-- Excepciones de la regla («escribe y no llama»): las tres mcp_* (REQ-061, CA-038).
-- ---------------------------------------------------------------------
create temp table funciones_definer (firma pg_catalog.text primary key, escribe pg_catalog.bool not null, llama pg_catalog.bool not null);
insert into pg_temp.funciones_definer (firma, escribe, llama) values
  ('privado.al_dar_de_baja()', true, true),
  ('privado.auditar()', false, true),
  ('privado.clientes_del_usuario()', false, false),
  ('privado.es_admin()', false, false),
  ('privado.licencia_vigente(uuid)', false, false),
  ('privado.mcp_confirmar_orden(text,uuid)', true, false),
  ('privado.mcp_enviar_informe(text,uuid,jsonb)', false, false),
  ('privado.mcp_obtener_instrucciones(text)', true, false),
  ('privado.registrar_auditoria(text,text,text,uuid)', false, false),
  ('privado.resolver_token(text)', false, false),
  ('privado.validar_ejecucion()', false, false),
  ('privado.validar_informe()', false, false);

-- LÍMITE (heurística sobre el texto del cuerpo, no un análisis): «escribe» busca insert into, update o
-- delete from seguidos de la tabla; no ve identificadores entre comillas, update only, merge into, SQL
-- dinámico ni lo que oculten los comentarios; «llama» busca el texto privado.registrar_auditoria. Un
-- falso negativo exige que la función además esté en la lista cerrada de N-2 (a), que revisa una persona.
-- Lo observado: firma, si el cuerpo escribe en una tabla con disparador de auditoría y si llama a registrar_auditoria().
create view pg_temp.funciones_definer_vistas as
  with auditadas as (
    select distinct c.relname::pg_catalog.text as tabla
      from pg_catalog.pg_trigger g join pg_catalog.pg_class c on c.oid operator(pg_catalog.=) g.tgrelid
     where g.tgfoid operator(pg_catalog.=) 'privado.auditar'::pg_catalog.regproc and not g.tgisinternal
  )
  select p.oid::pg_catalog.regprocedure::pg_catalog.text as firma,
         exists (select 1 from auditadas a
                  where p.prosrc ~* ('(insert\s+into|update|delete\s+from)\s+(public\.)?' || a.tabla || '\y')) as escribe,
         p.prosrc ~ 'privado\.registrar_auditoria' as llama
    from pg_catalog.pg_proc p join pg_temp.esquemas_nuestros s on s.oid operator(pg_catalog.=) p.pronamespace
   where p.prosecdef;

select set_eq(
  $q$ select v.firma from pg_temp.funciones_definer_vistas v $q$,
  $q$ select f.firma from pg_temp.funciones_definer f $q$,
  'N-2 (a) · las funciones security definer son exactamente las de la lista cerrada, por firma');
select set_eq(
  $q$ select v.firma || ':' || v.escribe::pg_catalog.text || ':' || v.llama::pg_catalog.text from pg_temp.funciones_definer_vistas v $q$,
  $q$ select f.firma || ':' || f.escribe::pg_catalog.text || ':' || f.llama::pg_catalog.text from pg_temp.funciones_definer f $q$,
  'N-2 (b) · lo que cada función escribe y si llama a registrar_auditoria coincide con la lista');
select is_empty(
  $q$ select v.firma from pg_temp.funciones_definer_vistas v
       where v.escribe and not v.llama and v.firma not in ('privado.mcp_confirmar_orden(text,uuid)',
                                  'privado.mcp_enviar_informe(text,uuid,jsonb)',
                                  'privado.mcp_obtener_instrucciones(text)') $q$,
  'N-2 (c) · toda función que escribe en una tabla auditada llama a registrar_auditoria(), salvo las tres mcp_*');

-- ---------------------------------------------------------------------
-- N-4 · aclexplode sobre relacl, attacl, proacl, typacl y nspacl: los destinatarios son un
-- subconjunto de {postgres, authenticated, service_role, conector}. Un acl nulo vale lo de serie
-- (acldefault: p. ej., EXECUTE para PUBLIC en una función), no «nada». El esquema public es
-- plataforma (R-2: usage para PUBLIC, anon y los demás): solo se le exige que nadie más que
-- su dueño pueda crear en él. N-4 (g) añade is_grantable: nadie que no sea postgres puede volver
-- a conceder lo que tiene, tampoco sobre permisos ya admitidos (19 y 20 comparan solo el permiso).
-- ---------------------------------------------------------------------
create view pg_temp.destinatarios_ajenos as
  select 'relacl ' || c.relname::pg_catalog.text as sitio, a.grantee::pg_catalog.oid as grantee, a.is_grantable as grantable
    from pg_catalog.pg_class c
    cross join lateral pg_catalog.aclexplode(coalesce(c.relacl,
         pg_catalog.acldefault(case c.relkind when 'S' then 's'::"char" else 'r'::"char" end, c.relowner))) a
   where c.relnamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
     and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
  union all
  select 'attacl ' || c.relname::pg_catalog.text || '.' || t.attname::pg_catalog.text, a.grantee::pg_catalog.oid, a.is_grantable
    from pg_catalog.pg_attribute t join pg_catalog.pg_class c on c.oid operator(pg_catalog.=) t.attrelid
    cross join lateral pg_catalog.aclexplode(t.attacl) a
   where c.relnamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
  union all
  select 'proacl ' || p.oid::pg_catalog.regprocedure::pg_catalog.text, a.grantee::pg_catalog.oid, a.is_grantable
    from pg_catalog.pg_proc p
    cross join lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
   where p.pronamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
  union all
  select 'typacl ' || t.typname::pg_catalog.text, a.grantee::pg_catalog.oid, a.is_grantable
    from pg_catalog.pg_type t
    cross join lateral pg_catalog.aclexplode(coalesce(t.typacl, pg_catalog.acldefault('T', t.typowner))) a
   where t.typnamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
     and t.typtype in ('e', 'd')
  union all
  select 'nspacl privado', a.grantee::pg_catalog.oid, a.is_grantable
    from pg_catalog.pg_namespace n
    cross join lateral pg_catalog.aclexplode(coalesce(n.nspacl, pg_catalog.acldefault('n', n.nspowner))) a
   where n.nspname operator(pg_catalog.=) 'privado';

select is_empty(
  $q$ select d.sitio from pg_temp.destinatarios_ajenos d
       where d.sitio like 'relacl %'
         and d.grantee not in ('postgres'::pg_catalog.regrole, 'authenticated'::pg_catalog.regrole,
                               'service_role'::pg_catalog.regrole, 'conector'::pg_catalog.regrole) $q$,
  'N-4 (a) · los permisos de tablas, vistas y secuencias solo van a postgres, authenticated, service_role y conector');
select is_empty(
  $q$ select d.sitio from pg_temp.destinatarios_ajenos d
       where d.sitio like 'attacl %'
         and d.grantee not in ('postgres'::pg_catalog.regrole, 'authenticated'::pg_catalog.regrole,
                               'service_role'::pg_catalog.regrole, 'conector'::pg_catalog.regrole) $q$,
  'N-4 (b) · los permisos de columna solo van a postgres, authenticated, service_role y conector');
select is_empty(
  $q$ select d.sitio from pg_temp.destinatarios_ajenos d
       where d.sitio like 'proacl %'
         and d.grantee not in ('postgres'::pg_catalog.regrole, 'authenticated'::pg_catalog.regrole,
                               'service_role'::pg_catalog.regrole, 'conector'::pg_catalog.regrole) $q$,
  'N-4 (c) · execute en funciones solo va a postgres, authenticated, service_role y conector (PUBLIC, no)');
select is_empty(
  $q$ select d.sitio from pg_temp.destinatarios_ajenos d
       where d.sitio like 'typacl %' and d.grantee operator(pg_catalog.<>) 'postgres'::pg_catalog.regrole $q$,
  'N-4 (d) · los tipos de public y privado no dan usage a nadie más que a su dueño (PUBLIC incluido)');
select is_empty(
  $q$ select 'create en public: ' || a.grantee::pg_catalog.regrole::pg_catalog.text
        from pg_catalog.pg_namespace n cross join lateral pg_catalog.aclexplode(n.nspacl) a
       where n.nspname operator(pg_catalog.=) 'public' and a.privilege_type operator(pg_catalog.=) 'CREATE'
         and a.grantee not in (n.nspowner, 'postgres'::pg_catalog.regrole)
      union all
      select 'nspacl privado: ' || d.grantee::pg_catalog.text from pg_temp.destinatarios_ajenos d
       where d.sitio operator(pg_catalog.=) 'nspacl privado'
         and d.grantee not in ('postgres'::pg_catalog.regrole, 'authenticated'::pg_catalog.regrole,
                               'service_role'::pg_catalog.regrole, 'conector'::pg_catalog.regrole) $q$,
  'N-4 (e) · el esquema privado solo da permisos a destinatarios de la lista y nadie crea en public');
select set_eq(
  $q$ select a.grantee::pg_catalog.regrole::pg_catalog.text || ':' || a.privilege_type
        from pg_catalog.pg_namespace n cross join lateral pg_catalog.aclexplode(n.nspacl) a
       where n.nspname operator(pg_catalog.=) 'privado' and a.grantee operator(pg_catalog.<>) n.nspowner $q$,
  array['authenticated:USAGE', 'conector:USAGE']::pg_catalog.text[],
  'N-4 (f) · usage en privado: exactamente authenticated y conector');

select is_empty(
  $q$ select d.sitio from pg_temp.destinatarios_ajenos d
       where d.grantable and d.grantee operator(pg_catalog.<>) 'postgres'::pg_catalog.regrole $q$,
  'N-4 (g) · ningún permiso de tablas, columnas, funciones, tipos ni de privado se da con grant option (is_grantable; cubre 19 y 20)');

-- N-4 (h) · quién ejecuta funciones (A-11; arts. 2 y 3, REQ-011): el conjunto exacto de destinatarios de
-- EXECUTE en public y privado, sin contar al dueño (un acl nulo vale acldefault: PUBLIC). Cerrar a
-- los roles de N-4 (c) no basta: authenticated o service_role no ganan execute sin que esto falle.
-- Las tres mcp_* son del conector (REQ-061); las dos de política, de authenticated (D-3).
select set_eq(
  $q$ select p.oid::pg_catalog.regprocedure::pg_catalog.text || '|' ||
             case when a.grantee operator(pg_catalog.=) 0 then 'PUBLIC' else a.grantee::pg_catalog.regrole::pg_catalog.text end
             || '|' || a.privilege_type
        from pg_catalog.pg_proc p
        cross join lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
       where p.pronamespace in ('public'::pg_catalog.regnamespace, 'privado'::pg_catalog.regnamespace)
         and a.grantee operator(pg_catalog.<>) p.proowner $q$,
  array['privado.clientes_del_usuario()|authenticated|EXECUTE', 'privado.es_admin()|authenticated|EXECUTE',
        'privado.mcp_confirmar_orden(text,uuid)|conector|EXECUTE',
        'privado.mcp_enviar_informe(text,uuid,jsonb)|conector|EXECUTE',
        'privado.mcp_obtener_instrucciones(text)|conector|EXECUTE']::pg_catalog.text[],
  'N-4 (h) · execute en funciones: exactamente las dos de política para authenticated y las tres mcp_* para conector');

-- N-4 (i) · Los cuatro roles de acceso no son miembros de ningún rol (m-2): una pertenencia heredaría
-- permisos que ni 19, 20 ni N-4 ven (miran lo concedido al rol, no a sus padres).
select is_empty(
  $q$ select m.rolname::pg_catalog.text || ' en ' || g.rolname::pg_catalog.text
        from pg_catalog.pg_auth_members am
        join pg_catalog.pg_roles m on m.oid operator(pg_catalog.=) am.member
        join pg_catalog.pg_roles g on g.oid operator(pg_catalog.=) am.roleid
       where m.rolname in ('anon', 'authenticated', 'service_role', 'conector') $q$,
  'N-4 (i) · anon, authenticated, service_role y conector no son miembros de ningún rol (m-2)');

select * from finish();
rollback;
