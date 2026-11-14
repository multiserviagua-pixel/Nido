-- =====================================================================
-- Modelo de datos de referencia · agentes de correo HumanaIA
-- Estado: PROPUESTA (12/11/2026). No es una migración.
--
-- Las migraciones reales se escriben en supabase/migrations/ en la fase 2,
-- a partir de este archivo y del diseño de cada función.
--
-- Requiere el entorno de Supabase: esquema auth (auth.users, auth.uid(),
-- auth.jwt()) y los roles anon, authenticated y service_role.
--
-- Lo que este modelo impone:
--   1. Ningún campo de texto libre con datos de correo (constitución, art. 1).
--   2. RLS en todas las tablas (art. 2).
--   3. El conector solo ejecuta tres funciones del esquema privado, que
--      derivan el cliente del token. No existe cliente_id de entrada.
--   4. Tokens y códigos guardados como HMAC-SHA-256 en hexadecimal.
--      El secreto del HMAC no está en la base de datos.
--   5. versiones_prompt y auditoria son de solo inserción (art. 9).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Esquema privado y rol del conector
-- ---------------------------------------------------------------------

-- El esquema privado no se añade a los esquemas expuestos por la API.
create schema if not exists privado;
revoke all on schema privado from public;

-- Rol con el que se conecta el conector. Aquí va sin inicio de sesión:
-- la contraseña se fija fuera del repositorio al desplegar (V-107).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'conector') then
    create role conector nologin;
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 2. Tipos enumerados (listas cerradas)
-- ---------------------------------------------------------------------

create type public.estado_cliente      as enum ('activo', 'baja');
create type public.canal               as enum ('estable', 'prueba');
create type public.estado_licencia     as enum ('activa', 'suspendida', 'revocada');
create type public.estado_manual       as enum ('automatico', 'forzar_activa', 'forzar_suspendida');
create type public.asistente           as enum ('claude', 'chatgpt', 'otro');
create type public.almacenamiento      as enum ('drive', 'onedrive', 'dropbox', 'otro');
create type public.origen_cliente_oauth as enum ('cimd', 'dcr', 'predefinido');
create type public.tipo_token          as enum ('acceso', 'renovacion');
create type public.motivo_publicacion  as enum ('publicacion', 'vuelta_atras');
create type public.tipo_orden          as enum ('pausar', 'reanudar');
create type public.estado_orden        as enum ('pendiente', 'entregada', 'confirmada', 'anulada');
create type public.estado_servido      as enum ('activa', 'pausada', 'suspendida');
create type public.estado_informe      as enum ('ok', 'aviso', 'error', 'pausado');
create type public.modo_ejecucion      as enum ('conversacion', 'desatendido');
create type public.severidad           as enum ('info', 'aviso', 'critica');
create type public.tipo_alerta         as enum (
  'sin_senal', 'ejecucion_sin_informe', 'estado_error', 'version_antigua',
  'orden_sin_confirmar', 'conexion_nueva', 'token_reutilizado',
  'renovacion_fallida', 'intentos_activacion', 'impago', 'gracia_vencida'
);
create type public.estado_suscripcion  as enum (
  'trialing', 'active', 'incomplete', 'incomplete_expired',
  'past_due', 'unpaid', 'canceled', 'paused'
);


-- ---------------------------------------------------------------------
-- 3. Tablas
-- ---------------------------------------------------------------------

-- Clientes instalados. El nombre es el nombre comercial del cliente.
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
-- Como mucho una licencia no revocada por cliente.
create unique index licencias_una_vigente_por_cliente
  on public.licencias (cliente_id) where estado <> 'revocada';

-- Códigos de activación de un solo uso.
create table public.codigos_activacion (
  id          uuid primary key default gen_random_uuid(),
  licencia_id uuid not null references public.licencias (id) on delete cascade,
  codigo_hmac text not null unique check (codigo_hmac ~ '^[0-9a-f]{64}$'),
  caduca_en   timestamptz not null,
  usado_en    timestamptz,
  creado_por  uuid default auth.uid(),
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

-- Clientes OAuth registrados (los asistentes), no clientes de HumanaIA.
create table public.clientes_oauth (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null unique check (char_length(client_id) between 1 and 300),
  origen        public.origen_cliente_oauth not null,
  redirect_uris text[] not null check (cardinality(redirect_uris) between 1 and 5),
  creado_en     timestamptz not null default now(),
  ultimo_uso_en timestamptz
);

create table public.codigos_autorizacion (
  id               uuid primary key default gen_random_uuid(),
  codigo_hmac      text not null unique check (codigo_hmac ~ '^[0-9a-f]{64}$'),
  conexion_id      uuid not null references public.conexiones (id) on delete cascade,
  cliente_oauth_id uuid not null references public.clientes_oauth (id) on delete cascade,
  redirect_uri     text not null check (char_length(redirect_uri) <= 300),
  code_challenge   text not null check (char_length(code_challenge) between 43 and 128),
  recurso          text not null check (char_length(recurso) <= 300),
  caduca_en        timestamptz not null,
  usado_en         timestamptz
);

create table public.tokens (
  id             uuid primary key default gen_random_uuid(),
  conexion_id    uuid not null references public.conexiones (id) on delete cascade,
  tipo           public.tipo_token not null,
  token_hmac     text not null unique check (token_hmac ~ '^[0-9a-f]{64}$'),
  recurso        text not null check (char_length(recurso) <= 300),
  caduca_en      timestamptz not null,
  sustituido_por uuid references public.tokens (id),
  sustituido_en  timestamptz,
  revocado_en    timestamptz,
  creado_en      timestamptz not null default now()
);
create index tokens_por_conexion on public.tokens (conexion_id);

-- Versiones del prompt. Las registra el despliegue; son inmutables.
create table public.versiones_prompt (
  id            uuid primary key default gen_random_uuid(),
  version       text not null unique check (version ~ '^[0-9]+\.[0-9]+(\.[0-9]+)?$'),
  contenido     text not null check (char_length(contenido) between 1 and 100000),
  huella_sha256 text not null check (huella_sha256 ~ '^[0-9a-f]{64}$'),
  commit_sha    text not null check (commit_sha ~ '^[0-9a-f]{7,40}$'),
  notas         text check (char_length(notas) <= 500),
  registrada_en timestamptz not null default now()
);

-- Qué versión sirve cada canal. La vigente es la fila más reciente;
-- la vuelta atrás es una fila nueva que apunta a una versión anterior.
create table public.publicaciones (
  id            bigint generated always as identity primary key,
  canal         public.canal not null,
  version_id    uuid not null references public.versiones_prompt (id),
  motivo        public.motivo_publicacion not null default 'publicacion',
  publicada_por uuid default auth.uid(),
  publicada_en  timestamptz not null default now()
);
create index publicaciones_por_canal on public.publicaciones (canal, id desc);

-- Parámetros por cliente. Claves y valores cerrados: sin texto libre.
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
  creada_por    uuid default auth.uid(),
  creada_en     timestamptz not null default now(),
  entregada_en  timestamptz,
  confirmada_en timestamptz,
  anulada_en    timestamptz
);
create index ordenes_por_cliente on public.ordenes (cliente_id, creada_en desc);

-- Una sola fila.
create table public.ajustes_globales (
  id                    boolean primary key default true check (id),
  pausa_global          boolean not null default false,
  stripe_en_observacion boolean not null default true,
  actualizado_en        timestamptz not null default now()
);

-- Latido: se abre al servir instrucciones y se cierra al recibir el informe.
create table public.ejecuciones (
  id             uuid primary key default gen_random_uuid(),
  conexion_id    uuid not null references public.conexiones (id) on delete cascade,
  cliente_id     uuid not null references public.clientes (id) on delete cascade,
  version_id     uuid references public.versiones_prompt (id),
  estado_servido public.estado_servido not null,
  abierta_en     timestamptz not null default now(),
  cerrada_en     timestamptz
);
create index ejecuciones_por_cliente on public.ejecuciones (cliente_id, abierta_en desc);
create index ejecuciones_abiertas on public.ejecuciones (abierta_en) where cerrada_en is null;

create table public.catalogo_problemas (
  codigo      text primary key check (codigo ~ '^[a-z_]{3,40}$'),
  descripcion text not null check (char_length(descripcion) <= 200),
  activo      boolean not null default true
);

-- Informe de una revisión: solo cifras, booleanos y enumerados.
create table public.informes (
  id                  uuid primary key default gen_random_uuid(),
  ejecucion_id        uuid not null unique references public.ejecuciones (id) on delete cascade,
  cliente_id          uuid not null references public.clientes (id) on delete cascade,
  recibido_en         timestamptz not null default now(),
  version_esquema     smallint not null default 1,
  estado              public.estado_informe not null,
  modo                public.modo_ejecucion not null,
  asistente           public.asistente not null,
  almacenamiento      public.almacenamiento not null,
  version_prompt      text not null check (version_prompt ~ '^[0-9]+\.[0-9]+(\.[0-9]+)?$'),
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
  -- Códigos de catalogo_problemas. La función que inserta descarta los desconocidos.
  problemas           text[] not null default '{}' check (cardinality(problemas) <= 5),
  -- Cuántos campos ajenos traía el informe. Solo el número: ni nombres ni valores.
  campos_descartados  smallint not null default 0 check (campos_descartados between 0 and 1000)
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
create index alertas_abiertas on public.alertas (cliente_id, tipo) where resuelta_en is null;

create table public.suscripciones (
  cliente_id             uuid primary key references public.clientes (id) on delete cascade,
  stripe_customer_id     text not null unique check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),
  stripe_subscription_id text unique check (stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  estado                 public.estado_suscripcion,
  periodo_fin            timestamptz,
  gracia_hasta           timestamptz,
  actualizado_en         timestamptz not null default now()
);

-- Solo identificador y tipo del evento. La carga no se guarda.
create table public.eventos_stripe (
  id           text primary key check (id ~ '^evt_[A-Za-z0-9]+$'),
  tipo         text not null check (tipo ~ '^[a-z_.]{3,80}$'),
  recibido_en  timestamptz not null default now(),
  procesado_en timestamptz
);

-- Solo inserción. Sin clave ajena al actor para que borrar un usuario no la toque.
create table public.auditoria (
  id          bigint generated always as identity primary key,
  actor       uuid,
  accion      text not null check (accion ~ '^[a-z_]{3,40}$'),
  objeto_tipo text not null check (objeto_tipo ~ '^[a-z_]{3,40}$'),
  objeto_id   text check (char_length(objeto_id) <= 64),
  cliente_id  uuid,
  ocurrido_en timestamptz not null default now()
);
create index auditoria_por_cliente on public.auditoria (cliente_id, ocurrido_en desc);


-- ---------------------------------------------------------------------
-- 4. Funciones de apoyo para las políticas
-- ---------------------------------------------------------------------

-- Superadmin: figura en administradores y su sesión tiene doble factor.
create function privado.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2'
    and exists (
      select 1
        from public.administradores a
       where a.usuario_id = (select auth.uid())
    );
$$;

create function privado.clientes_del_usuario()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select uc.cliente_id
    from public.usuarios_cliente uc
   where uc.usuario_id = (select auth.uid());
$$;

create function privado.licencia_vigente(p_licencia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select l.estado <> 'revocada'
           and case l.estado_manual
                 when 'forzar_activa' then true
                 when 'forzar_suspendida' then false
                 else l.estado = 'activa'
                      and (l.caduca_en is null or l.caduca_en > now())
               end
      from public.licencias l
     where l.id = p_licencia_id
  ), false);
$$;


-- ---------------------------------------------------------------------
-- 5. Funciones del conector
--    Reciben el HMAC del token de acceso. Nunca un cliente_id.
-- ---------------------------------------------------------------------

-- Una licencia suspendida se resuelve, para poder responder «suspendida».
-- Una revocada, no.
create function privado.resolver_token(p_token_hmac text)
returns table (conexion_id uuid, licencia_id uuid, cliente_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, l.id, l.cliente_id
    from public.tokens t
    join public.conexiones c on c.id = t.conexion_id
    join public.licencias  l on l.id = c.licencia_id
   where t.token_hmac = p_token_hmac
     and t.tipo = 'acceso'
     and t.revocado_en is null
     and t.caduca_en > now()
     and c.revocada_en is null
     and l.estado <> 'revocada';
$$;

create function privado.mcp_obtener_instrucciones(p_token_hmac text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conexion       uuid;
  v_licencia       uuid;
  v_cliente        uuid;
  v_cliente_estado public.estado_cliente;
  v_canal          public.canal;
  v_pausa_global   boolean;
  v_orden_id       uuid;
  v_orden_tipo     public.tipo_orden;
  v_orden_estado   public.estado_orden;
  v_version_id     uuid;
  v_version        text;
  v_contenido      text;
  v_huella         text;
  v_reglas         jsonb;
  v_estado         public.estado_servido;
  v_ejecucion      uuid;
begin
  select r.conexion_id, r.licencia_id, r.cliente_id
    into v_conexion, v_licencia, v_cliente
    from privado.resolver_token(p_token_hmac) r;

  if v_conexion is null then
    return jsonb_build_object('autorizado', false);
  end if;

  select c.estado, c.canal
    into v_cliente_estado, v_canal
    from public.clientes c
   where c.id = v_cliente;

  select a.pausa_global into v_pausa_global from public.ajustes_globales a;

  -- Última orden no anulada del cliente.
  select o.id, o.tipo, o.estado
    into v_orden_id, v_orden_tipo, v_orden_estado
    from public.ordenes o
   where o.cliente_id = v_cliente
     and o.estado <> 'anulada'
   order by o.creada_en desc
   limit 1;

  -- Versión vigente del canal del cliente.
  select v.id, v.version, v.contenido, v.huella_sha256
    into v_version_id, v_version, v_contenido, v_huella
    from public.publicaciones p
    join public.versiones_prompt v on v.id = p.version_id
   where p.canal = v_canal
   order by p.id desc
   limit 1;

  -- Si el canal de prueba no tiene nada publicado, sirve el estable.
  if v_version_id is null and v_canal = 'prueba' then
    select v.id, v.version, v.contenido, v.huella_sha256
      into v_version_id, v_version, v_contenido, v_huella
      from public.publicaciones p
      join public.versiones_prompt v on v.id = p.version_id
     where p.canal = 'estable'
     order by p.id desc
     limit 1;
  end if;

  -- Cierre en fallo: sin licencia vigente o sin versión, no hay instrucciones.
  if v_cliente_estado = 'baja' or not privado.licencia_vigente(v_licencia) then
    v_estado := 'suspendida';
  elsif coalesce(v_pausa_global, false)
        or coalesce(v_orden_tipo = 'pausar', false)
        or v_version_id is null then
    v_estado := 'pausada';
  else
    v_estado := 'activa';
  end if;

  select jsonb_build_object(
           'max_correos_por_revision',      r.max_correos_por_revision,
           'ventana_dias',                  r.ventana_dias,
           'guardar_adjuntos',              r.guardar_adjuntos,
           'preparar_borradores',           r.preparar_borradores,
           'descargar_facturas_por_enlace', r.descargar_facturas_por_enlace)
    into v_reglas
    from public.reglas_cliente r
   where r.cliente_id = v_cliente;

  if v_reglas is null then
    v_reglas := jsonb_build_object(
      'max_correos_por_revision', 30,
      'ventana_dias', 3,
      'guardar_adjuntos', true,
      'preparar_borradores', true,
      'descargar_facturas_por_enlace', true);
  end if;

  insert into public.ejecuciones (conexion_id, cliente_id, version_id, estado_servido)
  values (v_conexion, v_cliente,
          case when v_estado = 'activa' then v_version_id end,
          v_estado)
  returning id into v_ejecucion;

  update public.conexiones set ultimo_uso_en = now() where id = v_conexion;

  if v_orden_id is not null and v_orden_estado = 'pendiente' then
    update public.ordenes
       set estado = 'entregada', entregada_en = now()
     where id = v_orden_id;
  end if;

  return jsonb_build_object(
    'autorizado',    true,
    'estado',        v_estado,
    'ejecucion_id',  v_ejecucion,
    'orden',         case
                       when v_orden_id is not null
                            and v_orden_estado in ('pendiente', 'entregada')
                       then jsonb_build_object('id', v_orden_id, 'tipo', v_orden_tipo)
                     end,
    'instrucciones', case
                       when v_estado = 'activa'
                       then jsonb_build_object(
                              'version',       v_version,
                              'huella_sha256', v_huella,
                              'prompt',        v_contenido,
                              'reglas',        v_reglas)
                     end
  );
end;
$$;

create function privado.mcp_enviar_informe(
  p_token_hmac   text,
  p_ejecucion_id uuid,
  p_informe      jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_claves constant text[] := array[
    'estado', 'modo', 'asistente', 'almacenamiento', 'version_prompt',
    'frecuencia_horas', 'tratados', 'sin_tratar', 'borradores', 'documentos',
    'facturas_pendientes', 'urgentes', 'comprobaciones', 'problemas'];
  v_claves_comp constant text[] := array[
    'correo', 'almacenamiento', 'contexto', 'registro'];
  v_conexion    uuid;
  v_cliente     uuid;
  v_comp        jsonb;
  v_problemas   text[];
  v_descartados integer;
  v_filas       integer;
begin
  select r.conexion_id, r.cliente_id
    into v_conexion, v_cliente
    from privado.resolver_token(p_token_hmac) r;

  if v_conexion is null then
    return jsonb_build_object('autorizado', false);
  end if;

  -- La ejecución tiene que ser de esta misma conexión.
  if not exists (
    select 1 from public.ejecuciones e
     where e.id = p_ejecucion_id and e.conexion_id = v_conexion
  ) then
    return jsonb_build_object('autorizado', true, 'guardado', false,
                              'motivo', 'ejecucion_desconocida');
  end if;

  if jsonb_typeof(p_informe) is distinct from 'object' then
    return jsonb_build_object('autorizado', true, 'guardado', false,
                              'motivo', 'informe_invalido');
  end if;

  v_comp := case when jsonb_typeof(p_informe -> 'comprobaciones') = 'object'
                 then p_informe -> 'comprobaciones' else '{}'::jsonb end;

  -- Se cuentan los campos ajenos. No se guardan ni sus nombres ni sus valores.
  select (select count(*) from jsonb_object_keys(p_informe) as k(clave)
           where k.clave <> all (v_claves))
       + (select count(*) from jsonb_object_keys(v_comp) as k(clave)
           where k.clave <> all (v_claves_comp))
    into v_descartados;

  -- Solo códigos del catálogo, sin repetir, cinco como mucho.
  select coalesce(array_agg(s.codigo), '{}')
    into v_problemas
    from (
      select distinct e.codigo
        from jsonb_array_elements_text(
               case when jsonb_typeof(p_informe -> 'problemas') = 'array'
                    then p_informe -> 'problemas' else '[]'::jsonb end
             ) as e(codigo)
        join public.catalogo_problemas cp
          on cp.codigo = e.codigo and cp.activo
       order by e.codigo
       limit 5
    ) s;

  begin
    insert into public.informes (
      ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento,
      version_prompt, frecuencia_horas, tratados, sin_tratar, borradores,
      documentos, facturas_pendientes, urgentes,
      comp_correo, comp_almacenamiento, comp_contexto, comp_registro,
      problemas, campos_descartados
    ) values (
      p_ejecucion_id,
      v_cliente,
      lower(p_informe ->> 'estado')::public.estado_informe,
      lower(p_informe ->> 'modo')::public.modo_ejecucion,
      lower(p_informe ->> 'asistente')::public.asistente,
      lower(p_informe ->> 'almacenamiento')::public.almacenamiento,
      p_informe ->> 'version_prompt',
      (p_informe ->> 'frecuencia_horas')::smallint,
      (p_informe ->> 'tratados')::integer,
      (p_informe ->> 'sin_tratar')::integer,
      (p_informe ->> 'borradores')::integer,
      (p_informe ->> 'documentos')::integer,
      (p_informe ->> 'facturas_pendientes')::integer,
      (p_informe ->> 'urgentes')::integer,
      coalesce((v_comp ->> 'correo')::boolean, false),
      coalesce((v_comp ->> 'almacenamiento')::boolean, false),
      coalesce((v_comp ->> 'contexto')::boolean, false),
      coalesce((v_comp ->> 'registro')::boolean, false),
      v_problemas,
      least(v_descartados, 1000)
    )
    on conflict (ejecucion_id) do nothing;

    get diagnostics v_filas = row_count;
  exception
    -- Tipo o rango inválido. No se devuelve ni se registra el valor recibido.
    when data_exception or integrity_constraint_violation then
      return jsonb_build_object('autorizado', true, 'guardado', false,
                                'motivo', 'informe_invalido');
  end;

  update public.ejecuciones
     set cerrada_en = coalesce(cerrada_en, now())
   where id = p_ejecucion_id;

  return jsonb_build_object(
    'autorizado',         true,
    'guardado',           true,
    'repetido',           v_filas = 0,
    'campos_descartados', v_descartados
  );
end;
$$;

create function privado.mcp_confirmar_orden(p_token_hmac text, p_orden_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conexion uuid;
  v_cliente  uuid;
  v_filas    integer;
  v_ya       boolean;
begin
  select r.conexion_id, r.cliente_id
    into v_conexion, v_cliente
    from privado.resolver_token(p_token_hmac) r;

  if v_conexion is null then
    return jsonb_build_object('autorizado', false);
  end if;

  -- Solo órdenes del cliente al que pertenece el token.
  update public.ordenes o
     set estado = 'confirmada', confirmada_en = now()
   where o.id = p_orden_id
     and o.cliente_id = v_cliente
     and o.estado in ('pendiente', 'entregada');

  get diagnostics v_filas = row_count;

  select exists (
    select 1 from public.ordenes o
     where o.id = p_orden_id
       and o.cliente_id = v_cliente
       and o.estado = 'confirmada'
  ) into v_ya;

  return jsonb_build_object(
    'autorizado', true,
    'confirmada', v_ya,
    'repetida',   v_ya and v_filas = 0
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 6. Disparadores: solo inserción y auditoría
-- ---------------------------------------------------------------------

create function privado.impedir_cambios()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La tabla % es de solo inserción', tg_table_name
    using errcode = 'P0001';
end;
$$;

create trigger versiones_prompt_inmutable
  before update or delete on public.versiones_prompt
  for each row execute function privado.impedir_cambios();
create trigger versiones_prompt_sin_vaciado
  before truncate on public.versiones_prompt
  for each statement execute function privado.impedir_cambios();

create trigger auditoria_solo_insercion
  before update or delete on public.auditoria
  for each row execute function privado.impedir_cambios();
create trigger auditoria_sin_vaciado
  before truncate on public.auditoria
  for each statement execute function privado.impedir_cambios();

-- Anota quién cambió qué. No guarda valores: solo acción, tabla e identificador.
create function privado.auditar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fila jsonb;
begin
  if tg_op = 'DELETE' then
    v_fila := to_jsonb(old);
  else
    v_fila := to_jsonb(new);
  end if;

  insert into public.auditoria (actor, accion, objeto_tipo, objeto_id, cliente_id)
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name::text,
    left(coalesce(v_fila ->> 'id', v_fila ->> 'cliente_id', v_fila ->> 'usuario_id'), 64),
    case
      when tg_table_name = 'clientes' then (v_fila ->> 'id')::uuid
      else (v_fila ->> 'cliente_id')::uuid
    end
  );
  return null;
end;
$$;

create trigger clientes_auditar
  after insert or update or delete on public.clientes
  for each row execute function privado.auditar();
create trigger administradores_auditar
  after insert or update or delete on public.administradores
  for each row execute function privado.auditar();
create trigger usuarios_cliente_auditar
  after insert or update or delete on public.usuarios_cliente
  for each row execute function privado.auditar();
create trigger licencias_auditar
  after insert or update or delete on public.licencias
  for each row execute function privado.auditar();
create trigger codigos_activacion_auditar
  after insert on public.codigos_activacion
  for each row execute function privado.auditar();
create trigger conexiones_auditar
  after update on public.conexiones
  for each row
  when (old.revocada_en is distinct from new.revocada_en)
  execute function privado.auditar();
create trigger publicaciones_auditar
  after insert on public.publicaciones
  for each row execute function privado.auditar();
create trigger reglas_cliente_auditar
  after insert or update or delete on public.reglas_cliente
  for each row execute function privado.auditar();
create trigger ordenes_auditar
  after insert or update on public.ordenes
  for each row execute function privado.auditar();
create trigger ajustes_globales_auditar
  after update on public.ajustes_globales
  for each row execute function privado.auditar();


-- ---------------------------------------------------------------------
-- 7. RLS: activado en todas las tablas
-- ---------------------------------------------------------------------

alter table public.clientes             enable row level security;
alter table public.administradores      enable row level security;
alter table public.usuarios_cliente     enable row level security;
alter table public.licencias            enable row level security;
alter table public.codigos_activacion   enable row level security;
alter table public.conexiones           enable row level security;
alter table public.clientes_oauth       enable row level security;
alter table public.codigos_autorizacion enable row level security;
alter table public.tokens               enable row level security;
alter table public.versiones_prompt     enable row level security;
alter table public.publicaciones        enable row level security;
alter table public.reglas_cliente       enable row level security;
alter table public.ordenes              enable row level security;
alter table public.ajustes_globales     enable row level security;
alter table public.ejecuciones          enable row level security;
alter table public.catalogo_problemas   enable row level security;
alter table public.informes             enable row level security;
alter table public.alertas              enable row level security;
alter table public.suscripciones        enable row level security;
alter table public.eventos_stripe       enable row level security;
alter table public.auditoria            enable row level security;

-- Superadmin (con doble factor): todo lo que sus permisos de tabla permitan.
create policy clientes_admin on public.clientes
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy administradores_admin on public.administradores
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy usuarios_cliente_admin on public.usuarios_cliente
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy licencias_admin on public.licencias
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy codigos_activacion_admin on public.codigos_activacion
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy conexiones_admin on public.conexiones
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy versiones_prompt_admin on public.versiones_prompt
  for select to authenticated
  using ((select privado.es_admin()));
create policy publicaciones_admin on public.publicaciones
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy reglas_cliente_admin on public.reglas_cliente
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy ordenes_admin on public.ordenes
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy ajustes_globales_admin on public.ajustes_globales
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy ejecuciones_admin on public.ejecuciones
  for select to authenticated
  using ((select privado.es_admin()));
create policy catalogo_problemas_admin on public.catalogo_problemas
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy informes_admin on public.informes
  for select to authenticated
  using ((select privado.es_admin()));
create policy alertas_admin on public.alertas
  for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy suscripciones_admin on public.suscripciones
  for select to authenticated
  using ((select privado.es_admin()));
create policy auditoria_admin on public.auditoria
  for select to authenticated
  using ((select privado.es_admin()));

-- Usuario de un cliente: solo lectura, solo lo suyo.
create policy clientes_propio on public.clientes
  for select to authenticated
  using (id in (select privado.clientes_del_usuario()));
create policy administradores_propio on public.administradores
  for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy usuarios_cliente_propio on public.usuarios_cliente
  for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy licencias_propio on public.licencias
  for select to authenticated
  using (cliente_id in (select privado.clientes_del_usuario()));
create policy ordenes_propio on public.ordenes
  for select to authenticated
  using (cliente_id in (select privado.clientes_del_usuario()));
create policy ejecuciones_propio on public.ejecuciones
  for select to authenticated
  using (cliente_id in (select privado.clientes_del_usuario()));
create policy informes_propio on public.informes
  for select to authenticated
  using (cliente_id in (select privado.clientes_del_usuario()));
create policy suscripciones_propio on public.suscripciones
  for select to authenticated
  using (cliente_id in (select privado.clientes_del_usuario()));
create policy catalogo_problemas_lectura on public.catalogo_problemas
  for select to authenticated
  using (true);

-- Sin políticas, a propósito: clientes_oauth, codigos_autorizacion, tokens
-- y eventos_stripe. Nadie llega a ellas por la API; solo las funciones del
-- esquema privado y el webhook.


-- ---------------------------------------------------------------------
-- 8. Permisos
-- ---------------------------------------------------------------------

revoke all on table
  public.clientes, public.administradores, public.usuarios_cliente,
  public.licencias, public.codigos_activacion, public.conexiones,
  public.clientes_oauth, public.codigos_autorizacion, public.tokens,
  public.versiones_prompt, public.publicaciones, public.reglas_cliente,
  public.ordenes, public.ajustes_globales, public.ejecuciones,
  public.catalogo_problemas, public.informes, public.alertas,
  public.suscripciones, public.eventos_stripe, public.auditoria
from public, anon, authenticated;

-- El permiso de tabla limita la operación; la política limita las filas.
grant select, insert, update on public.clientes           to authenticated;
grant select, insert, delete on public.administradores    to authenticated;
grant select, insert, delete on public.usuarios_cliente   to authenticated;
grant select, insert, update on public.licencias          to authenticated;
grant select, insert         on public.codigos_activacion to authenticated;
grant select                 on public.conexiones         to authenticated;
grant update (revocada_en)   on public.conexiones         to authenticated;
grant select                 on public.versiones_prompt   to authenticated;
grant select, insert         on public.publicaciones      to authenticated;
grant select, insert, update on public.reglas_cliente     to authenticated;
grant select, insert         on public.ordenes            to authenticated;
grant update (estado, anulada_en) on public.ordenes       to authenticated;
grant select                 on public.ajustes_globales   to authenticated;
grant update (pausa_global, stripe_en_observacion, actualizado_en)
                             on public.ajustes_globales   to authenticated;
grant select                 on public.ejecuciones        to authenticated;
grant select, insert, update on public.catalogo_problemas to authenticated;
grant select                 on public.informes           to authenticated;
grant select                 on public.alertas            to authenticated;
grant update (resuelta_en, resuelta_por) on public.alertas to authenticated;
grant select                 on public.suscripciones      to authenticated;
grant select                 on public.auditoria          to authenticated;

-- Funciones del esquema privado: nadie por defecto.
revoke all on all functions in schema privado from public, anon, authenticated;

grant usage on schema privado to authenticated;
grant execute on function privado.es_admin()             to authenticated;
grant execute on function privado.clientes_del_usuario() to authenticated;

-- El conector solo puede hacer esto.
grant usage on schema privado to conector;
grant execute on function privado.mcp_obtener_instrucciones(text)        to conector;
grant execute on function privado.mcp_enviar_informe(text, uuid, jsonb)  to conector;
grant execute on function privado.mcp_confirmar_orden(text, uuid)        to conector;


-- ---------------------------------------------------------------------
-- 9. Vistas de resumen
--    security_invoker: aplican el RLS de quien consulta.
-- ---------------------------------------------------------------------

create view public.resumen_cliente
with (security_invoker = true)
as
select
  c.id     as cliente_id,
  c.nombre,
  c.estado as estado_cliente,
  coalesce(
    l.estado <> 'revocada'
    and case l.estado_manual
          when 'forzar_activa' then true
          when 'forzar_suspendida' then false
          else l.estado = 'activa' and (l.caduca_en is null or l.caduca_en > now())
        end,
    false)                          as licencia_vigente,
  coalesce(o.tipo = 'pausar', false) as en_pausa,
  u.recibido_en                     as ultimo_informe_en,
  u.estado                          as ultimo_estado,
  u.version_prompt                  as ultima_version,
  coalesce(m.revisiones, 0)         as revisiones_30d,
  coalesce(m.tratados, 0)           as tratados_30d,
  coalesce(m.borradores, 0)         as borradores_30d,
  coalesce(m.documentos, 0)         as documentos_30d,
  s.estado                          as estado_suscripcion
from public.clientes c
left join public.licencias l
       on l.cliente_id = c.id and l.estado <> 'revocada'
left join public.suscripciones s
       on s.cliente_id = c.id
left join lateral (
  select o2.tipo
    from public.ordenes o2
   where o2.cliente_id = c.id and o2.estado <> 'anulada'
   order by o2.creada_en desc
   limit 1
) o on true
left join lateral (
  select i.recibido_en, i.estado, i.version_prompt
    from public.informes i
   where i.cliente_id = c.id
   order by i.recibido_en desc
   limit 1
) u on true
left join lateral (
  select count(*)           as revisiones,
         sum(i.tratados)    as tratados,
         sum(i.borradores)  as borradores,
         sum(i.documentos)  as documentos
    from public.informes i
   where i.cliente_id = c.id
     and i.recibido_en > now() - interval '30 days'
) m on true;

create view public.metricas_version
with (security_invoker = true)
as
select
  i.version_prompt,
  count(*)                                    as revisiones,
  count(*) filter (where i.estado = 'ok')     as correctas,
  count(*) filter (where i.estado = 'aviso')  as con_aviso,
  count(*) filter (where i.estado = 'error')  as con_error,
  sum(i.tratados)                             as tratados,
  sum(i.sin_tratar)                           as sin_tratar,
  sum(i.borradores)                           as borradores,
  sum(i.facturas_pendientes)                  as facturas_pendientes,
  count(distinct i.cliente_id)                as clientes
from public.informes i
group by i.version_prompt;

grant select on public.resumen_cliente, public.metricas_version to authenticated;


-- ---------------------------------------------------------------------
-- 10. Datos iniciales
-- ---------------------------------------------------------------------

insert into public.ajustes_globales default values;

insert into public.catalogo_problemas (codigo, descripcion) values
  ('sin_acceso_correo',          'No pudo entrar al correo'),
  ('sin_acceso_almacenamiento',  'No pudo entrar al almacenamiento en la nube'),
  ('sin_contexto',               'No encontró o no pudo leer el archivo de contexto'),
  ('registro_no_guardado',       'No pudo dejar el registro de la revisión'),
  ('error_borrador',             'No pudo crear un borrador'),
  ('error_guardar_documento',    'No pudo guardar un documento'),
  ('error_etiquetado',           'No pudo etiquetar un correo'),
  ('limite_correos_alcanzado',   'Quedaron correos sin tratar por el máximo por revisión'),
  ('factura_requiere_acceso',    'Una factura por enlace pide identificarse'),
  ('otro_agente_detectado',      'Hay otro agente tratando el correo de la misma cuenta'),
  ('conector_humanaia_inestable', 'El conector de HumanaIA falló y se reintentó'),
  ('otro',                       'Problema no catalogado');
