do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M04 · auditoria · PROTEGIDA (función 010, diseño D-1, D-3 y D-7; §3 y §6 de
-- docs/MODELO-DATOS.sql)
--
-- Crea public.auditoria (solo inserción), las tres funciones de apoyo de
-- privado (impedir_cambios, registrar_auditoria, auditar), la inmutabilidad
-- con enable always y los disparadores de auditoría de las tablas de M02. Las
-- de M05 (publicaciones, versiones_prompt) y M06 (alertas) las crean sus
-- migraciones; auditar() ya conoce esas tablas.
--
-- REGLA N-2 (opción a, dictamen de diseño vuelta 2): toda función security
-- definer que escriba en una tabla auditada llama a privado.registrar_auditoria(),
-- que es el único punto de escritura en public.auditoria. Excepciones: las tres
-- privado.mcp_* (REQ-061, CA-038) y privado.al_dar_de_baja (que escribe la fila
-- revocar_por_baja con registrar_auditoria, pero la revocación en sí no se audita
-- dos veces). La lista cerrada la comprueba 01_estructura (T-008) y la prueba 06.
-- Todo permiso de escritura nuevo trae su disparador de auditoría.
--
-- Clase «cualquier rol salvo el dueño»: WHEN (current_user <> 'postgres'). No
-- ve a las funciones security definer (current_user es el dueño dentro de
-- ellas): por eso la regla N-2. No audita el seed ni M10, hechos como dueño.
-- Clase «siempre»: administradores (REQ-060), sin condición.
--
-- auditar() no lee ningún valor de la fila más que el identificador del objeto
-- y el cliente (REQ-018), con SQL estático: nada de execute (D-11, regla 5).
-- Una tabla que auditar() no conoce falla con auditoria_tabla_no_prevista:
-- cierra en fallo.
--
-- PROTEGIDA (REQ-053): su reversión solo se ejecuta en CI, con la marca
-- app.reversion_protegida = 'ci'. La marca es una variable de sesión: protege
-- de accidentes, no de quien actúa a propósito con postgres (N-8).
--
-- Forma de D-1 (L 11, L 13 y L 14), como M01 a M03: la guarda de rol es la
-- primera sentencia; lo demás va en UN solo bloque do, con search_path = pg_catalog,
-- pg_temp durante el bloque. Los cuerpos de función van con otra etiqueta ($f$),
-- con search_path = pg_catalog, pg_temp y todo nombre fuera de pg_catalog
-- calificado (N-3). Los mensajes de los raise solo llevan el código (L 12).
-- Un tipo declarado va calificado con pg_catalog y sin inicializadores (D-11).
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_fila pg_catalog.record;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  -- -------------------------------------------------------------------
  -- Tabla: solo inserción. Sin clave ajena al actor ni al cliente, para que
  -- borrarlos no toque la auditoría.
  -- -------------------------------------------------------------------
  create table public.auditoria (
    id          bigint generated always as identity primary key,
    actor       uuid,
    accion      text not null check (accion ~ '^[a-z_]{3,40}$'),
    objeto_tipo text not null check (objeto_tipo ~ '^[a-z_]{3,40}$'),
    objeto_id   text check (objeto_id ~ '^[A-Za-z0-9_-]{1,64}$'),
    cliente_id  uuid,
    ocurrido_en timestamptz not null default now()
  );
  create index auditoria_por_cliente on public.auditoria (cliente_id, ocurrido_en desc);

  alter table public.auditoria enable row level security;
  revoke all on table public.auditoria from public, anon, authenticated, service_role, conector;

  -- -------------------------------------------------------------------
  -- Funciones de apoyo
  -- -------------------------------------------------------------------

  -- Disparador de solo inserción y de tabla sin vaciado.
  create function privado.impedir_cambios()
  returns pg_catalog.trigger
  language plpgsql
  set search_path = pg_catalog, pg_temp
  as $f$
  begin
    raise exception 'tabla_solo_insercion';
    return null;
  end;
  $f$;

  -- Único punto de escritura en la auditoría. El actor es siempre la sesión.
  -- Sin execute para nadie: solo la llaman funciones y disparadores del dueño.
  create function privado.registrar_auditoria(
    p_accion      pg_catalog.text,
    p_objeto_tipo pg_catalog.text,
    p_objeto_id   pg_catalog.text,
    p_cliente     pg_catalog.uuid
  )
  returns pg_catalog.void
  language plpgsql
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
  begin
    insert into public.auditoria (actor, accion, objeto_tipo, objeto_id, cliente_id)
    values ((select auth.uid()), p_accion, p_objeto_tipo, p_objeto_id, p_cliente);
  end;
  $f$;

  -- Disparador AFTER por fila: anota quién cambió qué. No guarda valores, solo
  -- la acción, la tabla, el identificador del objeto y el cliente.
  create function privado.auditar()
  returns pg_catalog.trigger
  language plpgsql
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
  declare
    v_fila pg_catalog.record;
    v_id pg_catalog.text;
    v_cliente pg_catalog.uuid;
  begin
    if tg_op = 'DELETE' then
      v_fila := old;
    else
      v_fila := new;
    end if;

    -- Solo las tablas de public (un homónimo de otro esquema no se audita).
    if tg_table_schema operator(pg_catalog.<>) 'public' then
      raise exception 'auditoria_tabla_no_prevista';
    end if;

    if tg_table_name = 'clientes' then
      v_id := v_fila.id::pg_catalog.text;
      v_cliente := v_fila.id;
    elsif tg_table_name = 'usuarios_cliente' then
      v_id := v_fila.usuario_id::pg_catalog.text;
      v_cliente := v_fila.cliente_id;
    elsif tg_table_name = 'administradores' then
      v_id := v_fila.usuario_id::pg_catalog.text;
    elsif tg_table_name in ('licencias', 'ordenes', 'alertas') then
      v_id := v_fila.id::pg_catalog.text;
      v_cliente := v_fila.cliente_id;
    elsif tg_table_name = 'reglas_cliente' then
      v_id := v_fila.cliente_id::pg_catalog.text;
      v_cliente := v_fila.cliente_id;
    elsif tg_table_name in ('codigos_activacion', 'conexiones') then
      v_id := v_fila.id::pg_catalog.text;
      select l.cliente_id into v_cliente
        from public.licencias l
       where l.id = v_fila.licencia_id;
    elsif tg_table_name = 'catalogo_problemas' then
      v_id := v_fila.codigo;
    elsif tg_table_name = 'ajustes_globales' then
      v_id := 'global';
    elsif tg_table_name in ('versiones_prompt', 'publicaciones') then
      v_id := v_fila.id::pg_catalog.text;
    else
      raise exception 'auditoria_tabla_no_prevista';
    end if;

    perform privado.registrar_auditoria(
      pg_catalog.lower(tg_op), tg_table_name::pg_catalog.text, v_id, v_cliente);
    return null;
  end;
  $f$;

  revoke all on function privado.impedir_cambios()
    from public, anon, authenticated, service_role, conector;
  revoke all on function
    privado.registrar_auditoria(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.uuid)
    from public, anon, authenticated, service_role, conector;
  revoke all on function privado.auditar()
    from public, anon, authenticated, service_role, conector;

  -- -------------------------------------------------------------------
  -- Inmutabilidad: solo inserción y sin vaciado, también en modo réplica
  -- (enable always, D-3).
  -- -------------------------------------------------------------------
  create trigger auditoria_solo_insercion
    before update or delete on public.auditoria
    for each row execute function privado.impedir_cambios();
  create trigger auditoria_sin_vaciado
    before truncate on public.auditoria
    for each statement execute function privado.impedir_cambios();
  alter table public.auditoria enable always trigger auditoria_solo_insercion;
  alter table public.auditoria enable always trigger auditoria_sin_vaciado;

  -- -------------------------------------------------------------------
  -- Auditoría de las tablas de M02 (D-3). Clase «cualquier rol salvo el dueño».
  -- -------------------------------------------------------------------
  create trigger clientes_auditar
    after insert or update on public.clientes
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();
  create trigger usuarios_cliente_auditar
    after insert or delete on public.usuarios_cliente
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();
  create trigger licencias_auditar
    after insert or update on public.licencias
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();
  create trigger codigos_activacion_auditar
    after insert on public.codigos_activacion
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();
  create trigger conexiones_auditar
    after update on public.conexiones
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();
  create trigger reglas_cliente_auditar
    after insert or update on public.reglas_cliente
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();
  create trigger ordenes_auditar
    after insert or update on public.ordenes
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();
  create trigger ajustes_globales_auditar
    after update on public.ajustes_globales
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();
  create trigger catalogo_problemas_auditar
    after insert or update on public.catalogo_problemas
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();

  -- Clase «siempre» (REQ-060): sin condición.
  create trigger administradores_auditar
    after insert or update or delete on public.administradores
    for each row execute function privado.auditar();

  -- -------------------------------------------------------------------
  -- Otros destinatarios de permisos por defecto (p. ej., uno que no es de los
  -- cinco de M01): fuera de la tabla. En las funciones no se retira nada (el
  -- SQL de las funciones es estático, D-11): si queda algo ajeno, falla todo.
  -- -------------------------------------------------------------------
  for v_fila in
    select distinct n.nspname as esquema, c.relname as objeto,
           c.relkind = 'S' as es_secuencia,
           r.rolname as destino
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      cross join lateral pg_catalog.aclexplode(c.relacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'public' and (c.relname = 'auditoria'
           or (c.relkind = 'S'
               and exists (
                 select 1
                   from pg_catalog.pg_depend d
                   join pg_catalog.pg_class t on t.oid = d.refobjid
                  where d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass
                    and d.refclassid = 'pg_catalog.pg_class'::pg_catalog.regclass
                    and d.objid = c.oid
                    and d.deptype in ('a', 'i')
                    and t.relnamespace = c.relnamespace
                    and t.relname = 'auditoria')))
       and a.grantee <> c.relowner
  loop
    -- Sin nombre de rol (grantee = 0) es PUBLIC. Solo marcadores %I (D-11, regla 5).
    if v_fila.es_secuencia and v_fila.destino is null then
      execute pg_catalog.format('revoke all on sequence %I.%I from public', v_fila.esquema, v_fila.objeto);
    elsif v_fila.es_secuencia then
      execute pg_catalog.format('revoke all on sequence %I.%I from %I',
        v_fila.esquema, v_fila.objeto, v_fila.destino);
    elsif v_fila.destino is null then
      execute pg_catalog.format('revoke all on table %I.%I from public', v_fila.esquema, v_fila.objeto);
    else
      execute pg_catalog.format('revoke all on table %I.%I from %I',
        v_fila.esquema, v_fila.objeto, v_fila.destino);
    end if;
  end loop;

  if exists (
       select 1
         from pg_catalog.pg_class c
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
         cross join lateral pg_catalog.aclexplode(c.relacl) a
        where n.nspname = 'public' and (c.relname = 'auditoria'
           or (c.relkind = 'S'
               and exists (
                 select 1
                   from pg_catalog.pg_depend d
                   join pg_catalog.pg_class t on t.oid = d.refobjid
                  where d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass
                    and d.refclassid = 'pg_catalog.pg_class'::pg_catalog.regclass
                    and d.objid = c.oid
                    and d.deptype in ('a', 'i')
                    and t.relnamespace = c.relnamespace
                    and t.relname = 'auditoria')))
          and a.grantee <> c.relowner)
     or exists (
       select 1
         from pg_catalog.pg_attribute t
         join pg_catalog.pg_class c on c.oid = t.attrelid
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'auditoria' and t.attacl is not null)
     or exists (
       select 1
         from pg_catalog.pg_proc p
         join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'privado'
          and p.proname in ('impedir_cambios', 'registrar_auditoria', 'auditar')
          and (p.proacl is null
               or exists (select 1 from pg_catalog.aclexplode(p.proacl) a
                           where a.grantee <> p.proowner)))
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
