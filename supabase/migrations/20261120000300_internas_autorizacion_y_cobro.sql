do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M03 · internas_autorizacion_y_cobro (función 010, diseño D-1 y D-7; §3 de
-- docs/MODELO-DATOS.sql)
--
-- Tablas internas de autorización OAuth y de cobro: clientes_oauth,
-- codigos_autorizacion, tokens y eventos_stripe. Nadie llega a ellas por la
-- API, ni el superadmin (REQ-008): RLS activado, ninguna política y ningún
-- permiso para nadie más que su dueño, ni ahora ni en M07 (D-5). Solo las
-- tocan funciones del dueño.
--
-- Tokens y códigos, solo como HMAC-SHA-256 en hexadecimal (REQ-024). Formatos
-- de D-7 (★ incluidos). Texto visible (^[!-~]{1,300}$): el motor de
-- expresiones regulares no admite repeticiones de más de 255, así que se
-- escribe como ^[!-~]+$ más char_length <= 300, que es el mismo conjunto. En
-- redirect_uris (sin subconsultas, que un check no admite): de 1 a 5
-- elementos, ninguno nulo ni vacío; todos los caracteres de todos los
-- elementos son de [!-~] (la lista unida sin separador); y, unida con
-- espacios (que no son de [!-~]), no hay ninguna racha de 301 caracteres
-- visibles ([!-~]{151}[!-~]{150}), es decir, ningún elemento de más de 300.
-- El case evalúa primero la dimensión y el número de elementos:
-- array_position da error, no falso, con más de una dimensión.
--
-- Forma de D-1, como M01 y M02: guarda de rol primero y UN solo bloque do
-- con la guarda repetida, search_path fijado tras guardar el previo y
-- restaurado al final. Sin begin/commit.
--
-- La comprobación final (migracion_concesiones_ajenas) es defensa en
-- profundidad: solo salta si algo ajeno concede durante el bloque (p. ej., un
-- disparador de eventos); las pruebas la ejercen con uno en PGlite.
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_fila pg_catalog.record;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  -- Clientes OAuth registrados (los asistentes), no clientes de HumanaIA.
  create table public.clientes_oauth (
    id            uuid primary key default gen_random_uuid(),
    client_id     text not null unique
                  check (char_length(client_id) <= 300 and client_id ~ '^[!-~]+$'),
    origen        public.origen_cliente_oauth not null,
    redirect_uris text[] not null
                  check (case
                           when array_ndims(redirect_uris) = 1
                                and cardinality(redirect_uris) between 1 and 5
                           then array_position(redirect_uris, null) is null
                                and array_position(redirect_uris, ''::text) is null
                                and array_to_string(redirect_uris, '') ~ '^[!-~]+$'
                                and array_to_string(redirect_uris, ' ')
                                    !~ '[!-~]{151}[!-~]{150}'
                           else false
                         end),
    creado_en     timestamptz not null default now(),
    ultimo_uso_en timestamptz
  );

  create table public.codigos_autorizacion (
    id               uuid primary key default gen_random_uuid(),
    codigo_hmac      text not null unique check (codigo_hmac ~ '^[0-9a-f]{64}$'),
    conexion_id      uuid not null references public.conexiones (id) on delete cascade,
    cliente_oauth_id uuid not null references public.clientes_oauth (id) on delete cascade,
    redirect_uri     text not null
                     check (char_length(redirect_uri) <= 300 and redirect_uri ~ '^[!-~]+$'),
    code_challenge   text not null check (code_challenge ~ '^[A-Za-z0-9_-]{43,128}$'),
    recurso          text not null
                     check (char_length(recurso) <= 300 and recurso ~ '^[!-~]+$'),
    caduca_en        timestamptz not null,
    usado_en         timestamptz
  );

  create table public.tokens (
    id             uuid primary key default gen_random_uuid(),
    conexion_id    uuid not null references public.conexiones (id) on delete cascade,
    tipo           public.tipo_token not null,
    token_hmac     text not null unique check (token_hmac ~ '^[0-9a-f]{64}$'),
    recurso        text not null
                   check (char_length(recurso) <= 300 and recurso ~ '^[!-~]+$'),
    caduca_en      timestamptz not null,
    sustituido_por uuid references public.tokens (id),
    sustituido_en  timestamptz,
    revocado_en    timestamptz,
    creado_en      timestamptz not null default now()
  );
  create index tokens_por_conexion on public.tokens (conexion_id);

  -- Solo identificador y tipo del evento. La carga no se guarda.
  create table public.eventos_stripe (
    id           text primary key check (id ~ '^evt_[A-Za-z0-9]{1,250}$'),
    tipo         text not null check (tipo ~ '^[a-z_.]{3,80}$'),
    recibido_en  timestamptz not null default now(),
    procesado_en timestamptz
  );

  -- -------------------------------------------------------------------
  -- RLS y permisos: RLS activado, ninguna política, y nadie salvo el dueño
  -- -------------------------------------------------------------------
  alter table public.clientes_oauth       enable row level security;
  alter table public.codigos_autorizacion enable row level security;
  alter table public.tokens               enable row level security;
  alter table public.eventos_stripe       enable row level security;

  revoke all on table
    public.clientes_oauth, public.codigos_autorizacion, public.tokens, public.eventos_stripe
    from public, anon, authenticated, service_role, conector;

  for v_fila in
    select distinct n.nspname as esquema, c.relname as objeto,
           r.rolname as destino
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      cross join lateral pg_catalog.aclexplode(c.relacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'public'
       and c.relname in ('clientes_oauth', 'codigos_autorizacion', 'tokens', 'eventos_stripe')
       and a.grantee <> c.relowner
  loop
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
          and c.relname in ('clientes_oauth', 'codigos_autorizacion', 'tokens', 'eventos_stripe')
          and a.grantee <> c.relowner)
     or exists (
       select 1
         from pg_catalog.pg_attribute t
         join pg_catalog.pg_class c on c.oid = t.attrelid
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in ('clientes_oauth', 'codigos_autorizacion', 'tokens', 'eventos_stripe')
          and t.attacl is not null)
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
