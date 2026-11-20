do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M02 · clientes_y_acceso (función 010, diseño D-1, D-2 y D-7; §2 y §3 de
-- docs/MODELO-DATOS.sql)
--
-- Crea los tipos enumerados de §2 y las once tablas de clientes y acceso, con
-- RLS activado, sin políticas y sin permisos para nadie más que su dueño: las
-- políticas y los permisos llegan en M07 (D-5). Las restricciones de formato
-- son las de D-7 (★ incluidas); la autoría (codigos_activacion.creado_por,
-- ordenes.creada_por) no lleva valor por defecto: la fija el disparador BEFORE
-- de M07 (D-2, 4).
--
-- Forma de D-1 (L 11, L 13 y L 14), como M01: la guarda de rol es la primera
-- sentencia; lo demás va en UN solo bloque do que repite la guarda, guarda la
-- ruta de la sesión, fija search_path = pg_catalog, pg_temp y la restaura al
-- final. Con la ruta fijada, los tipos, funciones y operadores de las
-- columnas, los check y los índices quedan ligados a pg_catalog y a public
-- (calificado), nunca a un objeto homónimo de la sesión. Sin begin/commit: un
-- bloque es una sola sentencia y falla entero o no cambia nada (REQ-030).
-- Los tipos de declare van calificados con pg_catalog y sin inicializadores.
-- El formato de texto visible de D-7 está en M03, que es donde se usa.
--
-- Tipos: de serie dan USAGE a PUBLIC (typacl nulo). Se revoca a PUBLIC y a
-- los cinco roles, se retira cualquier otro destinatario (permisos por
-- defecto en tipos) y se comprueba que solo queda el dueño. Las listas
-- (estado_cliente[], …) no tienen permisos propios: siguen a su tipo base.
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

  -- -------------------------------------------------------------------
  -- Tipos enumerados (§2): listas cerradas
  -- -------------------------------------------------------------------
  create type public.estado_cliente       as enum ('activo', 'baja');
  create type public.canal                as enum ('estable', 'prueba');
  create type public.estado_licencia      as enum ('activa', 'suspendida', 'revocada');
  create type public.estado_manual        as enum ('automatico', 'forzar_activa', 'forzar_suspendida');
  create type public.asistente            as enum ('claude', 'chatgpt', 'otro');
  create type public.almacenamiento       as enum ('drive', 'onedrive', 'dropbox', 'otro');
  create type public.origen_cliente_oauth as enum ('cimd', 'dcr', 'predefinido');
  create type public.tipo_token           as enum ('acceso', 'renovacion');
  create type public.motivo_publicacion   as enum ('publicacion', 'vuelta_atras');
  create type public.tipo_orden           as enum ('pausar', 'reanudar');
  create type public.estado_orden         as enum ('pendiente', 'entregada', 'confirmada', 'anulada');
  create type public.estado_servido       as enum ('activa', 'pausada', 'suspendida');
  create type public.estado_informe       as enum ('ok', 'aviso', 'error', 'pausado');
  create type public.modo_ejecucion       as enum ('conversacion', 'desatendido');
  create type public.severidad            as enum ('info', 'aviso', 'critica');
  create type public.tipo_alerta          as enum (
    'sin_senal', 'ejecucion_sin_informe', 'estado_error', 'version_antigua',
    'orden_sin_confirmar', 'conexion_nueva', 'token_reutilizado',
    'renovacion_fallida', 'intentos_activacion', 'impago', 'gracia_vencida'
  );
  create type public.estado_suscripcion   as enum (
    'trialing', 'active', 'incomplete', 'incomplete_expired',
    'past_due', 'unpaid', 'canceled', 'paused'
  );

  -- Ningún tipo para nadie salvo su dueño (USAGE de serie a PUBLIC fuera).
  revoke all on type
    public.estado_cliente, public.canal, public.estado_licencia, public.estado_manual,
    public.asistente, public.almacenamiento, public.origen_cliente_oauth, public.tipo_token,
    public.motivo_publicacion, public.tipo_orden, public.estado_orden, public.estado_servido,
    public.estado_informe, public.modo_ejecucion, public.severidad, public.tipo_alerta,
    public.estado_suscripcion
    from public, anon, authenticated, service_role, conector;

  -- Otros destinatarios (permisos por defecto de postgres en tipos): fuera.
  for v_fila in
    select distinct pg_catalog.format('%I.%I', n.nspname, t.typname) as tipo,
           case when a.grantee = 0 then 'PUBLIC'
                else pg_catalog.quote_ident(r.rolname) end as destino
      from pg_catalog.pg_type t
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
      cross join lateral pg_catalog.aclexplode(t.typacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'public'
       and t.typname in ('estado_cliente', 'canal', 'estado_licencia', 'estado_manual',
                         'asistente', 'almacenamiento', 'origen_cliente_oauth', 'tipo_token',
                         'motivo_publicacion', 'tipo_orden', 'estado_orden', 'estado_servido',
                         'estado_informe', 'modo_ejecucion', 'severidad', 'tipo_alerta',
                         'estado_suscripcion')
       and a.grantee <> t.typowner
  loop
    execute pg_catalog.format('revoke all on type %s from %s', v_fila.tipo, v_fila.destino);
  end loop;

  -- -------------------------------------------------------------------
  -- Tablas
  -- -------------------------------------------------------------------

  -- Clientes instalados. El nombre es el nombre comercial (D-7).
  create table public.clientes (
    id                        uuid primary key default gen_random_uuid(),
    nombre                    text not null check (char_length(nombre) between 1 and 120),
    estado                    public.estado_cliente not null default 'activo',
    canal                     public.canal not null default 'estable',
    frecuencia_esperada_horas smallint not null default 24
                              check (frecuencia_esperada_horas between 1 and 168),
    creado_en                 timestamptz not null default now()
  );

  -- Usuarios de HumanaIA con acceso superadmin.
  create table public.administradores (
    usuario_id uuid primary key references auth.users (id) on delete cascade,
    creado_en  timestamptz not null default now()
  );

  -- Qué usuarios pueden ver el dashboard de qué cliente.
  create table public.usuarios_cliente (
    usuario_id uuid not null references auth.users (id) on delete cascade,
    cliente_id uuid not null references public.clientes (id) on delete cascade,
    creado_en  timestamptz not null default now(),
    primary key (usuario_id, cliente_id)
  );
  create index usuarios_cliente_por_cliente on public.usuarios_cliente (cliente_id);

  -- Licencia: el derecho de un cliente a usar el agente.
  create table public.licencias (
    id            uuid primary key default gen_random_uuid(),
    cliente_id    uuid not null references public.clientes (id) on delete restrict,
    estado        public.estado_licencia not null default 'activa',
    estado_manual public.estado_manual not null default 'automatico',
    caduca_en     timestamptz,
    creada_en     timestamptz not null default now()
  );
  -- Índice de la política (D-2, 14; REQ-032).
  create index licencias_por_cliente on public.licencias (cliente_id);
  -- Como mucho una licencia no revocada por cliente (REQ-026, REQ-049).
  create unique index licencias_una_vigente_por_cliente
    on public.licencias (cliente_id) where estado <> 'revocada'::public.estado_licencia;

  -- Códigos de activación de un solo uso: solo el HMAC (REQ-024).
  create table public.codigos_activacion (
    id          uuid primary key default gen_random_uuid(),
    licencia_id uuid not null references public.licencias (id) on delete cascade,
    codigo_hmac text not null unique check (codigo_hmac ~ '^[0-9a-f]{64}$'),
    caduca_en   timestamptz not null,
    usado_en    timestamptz,
    creado_por  uuid,
    creado_en   timestamptz not null default now()
  );
  create index codigos_activacion_por_licencia on public.codigos_activacion (licencia_id);

  -- Cada activación crea una conexión, revocable por separado.
  create table public.conexiones (
    id            uuid primary key default gen_random_uuid(),
    licencia_id   uuid not null references public.licencias (id) on delete cascade,
    asistente     public.asistente not null default 'otro',
    creada_en     timestamptz not null default now(),
    ultimo_uso_en timestamptz,
    revocada_en   timestamptz
  );
  create index conexiones_por_licencia on public.conexiones (licencia_id);

  -- Parámetros por cliente. Claves y valores cerrados: sin texto (REQ-020).
  create table public.reglas_cliente (
    cliente_id                    uuid primary key references public.clientes (id) on delete cascade,
    max_correos_por_revision      smallint not null default 30
                                  check (max_correos_por_revision between 1 and 100),
    ventana_dias                  smallint not null default 3
                                  check (ventana_dias between 1 and 14),
    guardar_adjuntos              boolean not null default true,
    preparar_borradores           boolean not null default true,
    descargar_facturas_por_enlace boolean not null default true,
    actualizado_en                timestamptz not null default now()
  );

  create table public.ordenes (
    id            uuid primary key default gen_random_uuid(),
    cliente_id    uuid not null references public.clientes (id) on delete cascade,
    tipo          public.tipo_orden not null,
    estado        public.estado_orden not null default 'pendiente',
    creada_por    uuid,
    creada_en     timestamptz not null default now(),
    entregada_en  timestamptz,
    confirmada_en timestamptz,
    anulada_en    timestamptz
  );
  create index ordenes_por_cliente on public.ordenes (cliente_id, creada_en desc);

  -- Una sola fila (REQ-026): la clave es el booleano true.
  create table public.ajustes_globales (
    id                    boolean primary key default true check (id),
    pausa_global          boolean not null default false,
    stripe_en_observacion boolean not null default true,
    actualizado_en        timestamptz not null default now()
  );

  create table public.catalogo_problemas (
    codigo      text primary key check (codigo ~ '^[a-z_]{3,40}$'),
    descripcion text not null check (char_length(descripcion) between 1 and 200),
    activo      boolean not null default true
  );

  create table public.suscripciones (
    cliente_id             uuid primary key references public.clientes (id) on delete cascade,
    stripe_customer_id     text not null unique
                           check (stripe_customer_id ~ '^cus_[A-Za-z0-9]{1,250}$'),
    stripe_subscription_id text unique
                           check (stripe_subscription_id ~ '^sub_[A-Za-z0-9]{1,250}$'),
    estado                 public.estado_suscripcion,
    periodo_fin            timestamptz,
    gracia_hasta           timestamptz,
    actualizado_en         timestamptz not null default now()
  );

  -- -------------------------------------------------------------------
  -- RLS y permisos: RLS activado, ninguna política, y nadie salvo el dueño
  -- -------------------------------------------------------------------
  alter table public.clientes           enable row level security;
  alter table public.administradores    enable row level security;
  alter table public.usuarios_cliente   enable row level security;
  alter table public.licencias          enable row level security;
  alter table public.codigos_activacion enable row level security;
  alter table public.conexiones         enable row level security;
  alter table public.reglas_cliente     enable row level security;
  alter table public.ordenes            enable row level security;
  alter table public.ajustes_globales   enable row level security;
  alter table public.catalogo_problemas enable row level security;
  alter table public.suscripciones      enable row level security;

  revoke all on table
    public.clientes, public.administradores, public.usuarios_cliente,
    public.licencias, public.codigos_activacion, public.conexiones,
    public.reglas_cliente, public.ordenes, public.ajustes_globales,
    public.catalogo_problemas, public.suscripciones
    from public, anon, authenticated, service_role, conector;

  -- Los permisos por defecto de postgres pueden haber dado algo a otro
  -- destinatario (p. ej., uno que no es de los cinco de M01): se retira.
  for v_fila in
    select distinct pg_catalog.format('%I.%I', n.nspname, c.relname) as tabla,
           case when a.grantee = 0 then 'PUBLIC'
                else pg_catalog.quote_ident(r.rolname) end as destino
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      cross join lateral pg_catalog.aclexplode(c.relacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'public'
       and c.relname in ('clientes', 'administradores', 'usuarios_cliente', 'licencias',
                         'codigos_activacion', 'conexiones', 'reglas_cliente', 'ordenes',
                         'ajustes_globales', 'catalogo_problemas', 'suscripciones')
       and a.grantee <> c.relowner
  loop
    execute pg_catalog.format('revoke all on table %s from %s', v_fila.tabla, v_fila.destino);
  end loop;

  -- Un revoke que no retira nada no da error (p. ej., otra concesión con otro
  -- concedente): se comprueba el resultado, también por columna, y si queda
  -- algo ajeno falla todo.
  if exists (
       select 1
         from pg_catalog.pg_class c
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
         cross join lateral pg_catalog.aclexplode(c.relacl) a
        where n.nspname = 'public'
          and c.relname in ('clientes', 'administradores', 'usuarios_cliente', 'licencias',
                            'codigos_activacion', 'conexiones', 'reglas_cliente', 'ordenes',
                            'ajustes_globales', 'catalogo_problemas', 'suscripciones')
          and a.grantee <> c.relowner)
     or exists (
       select 1
         from pg_catalog.pg_attribute t
         join pg_catalog.pg_class c on c.oid = t.attrelid
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in ('clientes', 'administradores', 'usuarios_cliente', 'licencias',
                            'codigos_activacion', 'conexiones', 'reglas_cliente', 'ordenes',
                            'ajustes_globales', 'catalogo_problemas', 'suscripciones')
          and t.attacl is not null)
     or exists (
       -- typacl nulo es el valor de serie (USAGE a PUBLIC): también es ajeno.
       select 1
         from pg_catalog.pg_type t
         join pg_catalog.pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public'
          and t.typname in ('estado_cliente', 'canal', 'estado_licencia', 'estado_manual',
                            'asistente', 'almacenamiento', 'origen_cliente_oauth', 'tipo_token',
                            'motivo_publicacion', 'tipo_orden', 'estado_orden', 'estado_servido',
                            'estado_informe', 'modo_ejecucion', 'severidad', 'tipo_alerta',
                            'estado_suscripcion')
          and (t.typacl is null
               or exists (select 1 from pg_catalog.aclexplode(t.typacl) a
                           where a.grantee <> t.typowner)))
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  -- Devuelve la ruta que tenía la transacción: lo que siga no hereda
  -- pg_catalog, pg_temp.
  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
