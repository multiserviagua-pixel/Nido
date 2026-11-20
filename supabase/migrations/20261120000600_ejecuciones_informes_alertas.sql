do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M06 · ejecuciones_informes_alertas (función 010, diseño D-1, D-2 (5, 6, 14),
-- D-3 y D-7; §6 de docs/MODELO-DATOS.sql, contratos/informe.schema.json)
--
-- Crea public.ejecuciones (el latido), public.informes (solo cifras,
-- booleanos y valores de listas cerradas; REQ-020, REQ-021) y public.alertas,
-- con RLS activado, ninguna política y ningún permiso (los pone M07).
--
-- Integridad (D-2, 5 y 6), válida para cualquier rol, también el dueño:
--   - ejecuciones: unique (id, cliente_id); informes: clave ajena compuesta
--     (ejecucion_id, cliente_id) -> ejecuciones (id, cliente_id), de modo que el
--     cliente de un informe es el de su ejecución.
--   - un informe por ejecución (unique (ejecucion_id)).
--   - informes.problemas: como mucho cinco códigos, sin nulos, cada uno de la
--     forma ^[a-z_]{3,40}$ (check); que existan en el catálogo y no se repitan
--     lo comprueba privado.validar_informe() (23514).
--   - privado.validar_ejecucion(): el cliente de la ejecución es el de la
--     licencia de su conexión (23514). Es security definer porque quien escribe
--     (clave secreta, conector) no lee licencias ni conexiones.
--   - privado.impedir_cambio_de_pertenencia(): nadie cambia licencias.cliente_id,
--     conexiones.licencia_id, ejecuciones.conexion_id, ejecuciones.cliente_id,
--     informes.ejecucion_id, informes.cliente_id ni alertas.cliente_id.
--     Sus disparadores en licencias y conexiones (tablas de M02) los quita la
--     reversión.
--   Los raise de estas funciones llevan solo el código (A-15, L 12): ningún
--   valor de la fila. Los errores del motor (restricciones check, claves) sí
--   pueden llevarlos: riesgo declarado N-6; las mcp_* de M08 los capturan.
--
-- D-7: las únicas columnas de texto son informes.version_prompt (formato y <= 12)
-- e informes.problemas. Sin texto libre (constitución, artículo 1).
--
-- Auditoría (D-3): alertas (U), clase «cualquier rol salvo el dueño». auditar()
-- ya conoce la tabla (M04). Ejecuciones e informes los escribe el conector
-- (REQ-061): sin auditoría.
--
-- Regla N-2: ninguna de las tres funciones escribe en una tabla auditada.
--
-- Su reversión no es protegida y pasa L 10 (N-7): no nombra las tablas
-- protegidas ni sus disparadores.
--
-- Forma de D-1 (L 11, L 13 y L 14), como M01 a M05.
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
  -- Tablas
  -- -------------------------------------------------------------------

  -- Latido: se abre al servir instrucciones y se cierra al recibir el informe.
  create table public.ejecuciones (
    id             uuid primary key default gen_random_uuid(),
    conexion_id    uuid not null references public.conexiones (id) on delete cascade,
    cliente_id     uuid not null references public.clientes (id) on delete cascade,
    version_id     uuid references public.versiones_prompt (id),
    estado_servido public.estado_servido not null,
    abierta_en     timestamptz not null default now(),
    cerrada_en     timestamptz,
    unique (id, cliente_id)
  );
  create index ejecuciones_por_cliente on public.ejecuciones (cliente_id, abierta_en desc);
  create index ejecuciones_por_conexion on public.ejecuciones (conexion_id);
  create index ejecuciones_abiertas on public.ejecuciones (abierta_en) where cerrada_en is null;

  -- Informe de una revisión: solo cifras, booleanos y enumerados (REQ-020).
  create table public.informes (
    id                  uuid primary key default gen_random_uuid(),
    ejecucion_id        uuid not null unique,
    cliente_id          uuid not null references public.clientes (id) on delete cascade,
    recibido_en         timestamptz not null default now(),
    version_esquema     smallint not null default 1,
    estado              public.estado_informe not null,
    modo                public.modo_ejecucion not null,
    asistente           public.asistente not null,
    almacenamiento      public.almacenamiento not null,
    version_prompt      text not null check (version_prompt ~ '^[0-9]+\.[0-9]+(\.[0-9]+)?$'
                                              and char_length(version_prompt) <= 12),
    frecuencia_horas    smallint not null check (frecuencia_horas between 1 and 168),
    tratados            integer not null check (tratados between 0 and 1000),
    sin_tratar          integer not null check (sin_tratar between 0 and 100000),
    borradores          integer not null check (borradores between 0 and 1000),
    documentos          integer not null check (documentos between 0 and 1000),
    facturas_pendientes integer not null check (facturas_pendientes between 0 and 1000),
    urgentes            integer not null check (urgentes between 0 and 1000),
    comp_correo         boolean not null,
    comp_almacenamiento boolean not null,
    comp_contexto       boolean not null,
    comp_registro       boolean not null,
    -- Códigos de catalogo_problemas (D-2, 5): hasta cinco, sin nulos.
    problemas           text[] not null default '{}'
                        check (pg_catalog.cardinality(problemas) <= 5
                               and (pg_catalog.cardinality(problemas) = 0
                                    or (pg_catalog.array_ndims(problemas) = 1
                                        and pg_catalog.array_lower(problemas, 1) = 1))
                               and pg_catalog.array_position(problemas, null) is null
                               and pg_catalog.array_to_string(problemas, '') !~ ','
                               and (pg_catalog.cardinality(problemas) = 0
                                    or pg_catalog.array_to_string(problemas, ',') <> '')
                               and pg_catalog.array_to_string(problemas, ',')
                                   ~ '^([a-z_]{3,40}(,[a-z_]{3,40}){0,4})?$'),
    -- Cuántos campos ajenos traía el informe. Solo el número: ni nombres ni valores.
    campos_descartados  smallint not null default 0 check (campos_descartados between 0 and 1000),
    foreign key (ejecucion_id, cliente_id)
      references public.ejecuciones (id, cliente_id) on delete cascade
  );
  create index informes_por_cliente on public.informes (cliente_id, recibido_en desc);

  create table public.alertas (
    id           uuid primary key default gen_random_uuid(),
    cliente_id   uuid references public.clientes (id) on delete cascade,
    tipo         public.tipo_alerta not null,
    severidad    public.severidad not null default 'aviso',
    abierta_en   timestamptz not null default now(),
    resuelta_en  timestamptz,
    resuelta_por uuid
  );
  create index alertas_por_cliente on public.alertas (cliente_id, abierta_en desc);
  create index alertas_abiertas on public.alertas (cliente_id, tipo) where resuelta_en is null;

  -- -------------------------------------------------------------------
  -- RLS y permisos: RLS activado, ninguna política, y nadie salvo el dueño
  -- -------------------------------------------------------------------
  alter table public.ejecuciones enable row level security;
  alter table public.informes    enable row level security;
  alter table public.alertas     enable row level security;

  revoke all on table public.ejecuciones, public.informes, public.alertas
    from public, anon, authenticated, service_role, conector;

  -- -------------------------------------------------------------------
  -- Funciones de integridad (SQL estático, sin execute; D-11)
  -- -------------------------------------------------------------------

  -- Cada código existe en el catálogo y no se repite. security definer: quien
  -- escribe no lee el catálogo.
  create function privado.validar_informe()
  returns pg_catalog.trigger
  language plpgsql
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
  begin
    if exists (
      select 1
        from pg_catalog.unnest(new.problemas) as p (codigo)
       where not exists (select 1 from public.catalogo_problemas k where k.codigo = p.codigo)
    ) then
      raise exception 'informe_problema_desconocido' using errcode = '23514';
    end if;
    if (select pg_catalog.count(distinct p.codigo)
          from pg_catalog.unnest(new.problemas) as p (codigo))
       operator(pg_catalog.<>) pg_catalog.cardinality(new.problemas) then
      raise exception 'informe_problema_repetido' using errcode = '23514';
    end if;
    return new;
  end;
  $f$;

  -- El cliente de la ejecución es el de la licencia de su conexión.
  create function privado.validar_ejecucion()
  returns pg_catalog.trigger
  language plpgsql
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
  begin
    if not exists (
      select 1
        from public.conexiones c
        join public.licencias l on l.id = c.licencia_id
       where c.id = new.conexion_id and l.cliente_id = new.cliente_id
    ) then
      raise exception 'ejecucion_cliente_incoherente' using errcode = '23514';
    end if;
    return new;
  end;
  $f$;

  -- Nadie cambia a quién pertenece una licencia, una conexión, una ejecución,
  -- un informe o una alerta.
  create function privado.impedir_cambio_de_pertenencia()
  returns pg_catalog.trigger
  language plpgsql
  set search_path = pg_catalog, pg_temp
  as $f$
  begin
    if tg_table_schema operator(pg_catalog.<>) 'public' then
      raise exception 'pertenencia_tabla_no_prevista';
    end if;
    if tg_table_name = 'licencias' then
      if new.cliente_id is distinct from old.cliente_id then
        raise exception 'cambio_de_pertenencia_no_permitido';
      end if;
    elsif tg_table_name = 'conexiones' then
      if new.licencia_id is distinct from old.licencia_id then
        raise exception 'cambio_de_pertenencia_no_permitido';
      end if;
    elsif tg_table_name = 'ejecuciones' then
      if new.conexion_id is distinct from old.conexion_id
         or new.cliente_id is distinct from old.cliente_id then
        raise exception 'cambio_de_pertenencia_no_permitido';
      end if;
    elsif tg_table_name = 'informes' then
      if new.ejecucion_id is distinct from old.ejecucion_id
         or new.cliente_id is distinct from old.cliente_id then
        raise exception 'cambio_de_pertenencia_no_permitido';
      end if;
    elsif tg_table_name = 'alertas' then
      if new.cliente_id is distinct from old.cliente_id then
        raise exception 'cambio_de_pertenencia_no_permitido';
      end if;
    else
      raise exception 'pertenencia_tabla_no_prevista';
    end if;
    return new;
  end;
  $f$;

  revoke all on function privado.validar_informe()
    from public, anon, authenticated, service_role, conector;
  revoke all on function privado.validar_ejecucion()
    from public, anon, authenticated, service_role, conector;
  revoke all on function privado.impedir_cambio_de_pertenencia()
    from public, anon, authenticated, service_role, conector;

  -- -------------------------------------------------------------------
  -- Disparadores
  -- -------------------------------------------------------------------
  create trigger informes_validar
    before insert or update on public.informes
    for each row execute function privado.validar_informe();
  create trigger ejecuciones_validar
    before insert or update on public.ejecuciones
    for each row execute function privado.validar_ejecucion();

  create trigger licencias_pertenencia
    before update on public.licencias
    for each row execute function privado.impedir_cambio_de_pertenencia();
  create trigger conexiones_pertenencia
    before update on public.conexiones
    for each row execute function privado.impedir_cambio_de_pertenencia();
  create trigger ejecuciones_pertenencia
    before update on public.ejecuciones
    for each row execute function privado.impedir_cambio_de_pertenencia();

  create trigger informes_pertenencia
    before update on public.informes
    for each row execute function privado.impedir_cambio_de_pertenencia();
  create trigger alertas_pertenencia
    before update on public.alertas
    for each row execute function privado.impedir_cambio_de_pertenencia();

  -- Auditoría (D-3): alertas (U), cualquier rol salvo el dueño.
  create trigger alertas_auditar
    after update on public.alertas
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();

  -- -------------------------------------------------------------------
  -- Otros destinatarios de permisos por defecto (p. ej., uno que no es de los
  -- cinco de M01): se retiran. En las funciones no se retira nada (SQL
  -- estático, D-11): si queda algo ajeno, falla todo.
  -- -------------------------------------------------------------------
  for v_fila in
    select distinct n.nspname as esquema, c.relname as objeto, r.rolname as destino
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      cross join lateral pg_catalog.aclexplode(c.relacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'public'
       and c.relname in ('ejecuciones', 'informes', 'alertas')
       and a.grantee <> c.relowner
  loop
    -- Sin nombre de rol (grantee = 0) es PUBLIC. Solo marcadores %I (D-11, regla 5).
    if v_fila.destino is null then
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
        where n.nspname = 'public'
          and c.relname in ('ejecuciones', 'informes', 'alertas')
          and a.grantee <> c.relowner)
     or exists (
       select 1
         from pg_catalog.pg_attribute t
         join pg_catalog.pg_class c on c.oid = t.attrelid
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in ('ejecuciones', 'informes', 'alertas')
          and t.attacl is not null)
     or exists (
       select 1
         from pg_catalog.pg_proc p
         join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'privado'
          and p.proname in ('validar_informe', 'validar_ejecucion', 'impedir_cambio_de_pertenencia')
          and (p.proacl is null
               or exists (select 1 from pg_catalog.aclexplode(p.proacl) a
                           where a.grantee <> p.proowner)))
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
