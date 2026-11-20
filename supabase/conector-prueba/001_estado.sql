-- Conector de prueba real (001, T-103 a): estado en el esquema `conector_prueba`.
-- Lo aplica UNA PERSONA en el editor SQL de `Nido` (ver LEEME.md). No se toca `public`, `privado` ni
-- `supabase/migrations/`. Transaccional y reejecutable. Vuelta atrás: 001_estado.reversion.sql.
--
-- Constitución: art. 1 (solo enteros acotados, booleanos y listas cerradas; ninguna columna de token,
-- código, dirección ni texto libre: lo secreto va solo como HMAC hexadecimal), art. 2 (el cliente se
-- deriva del token dentro de la base; ninguna función recibe un identificador), art. 3 (todo cierra en
-- fallo), art. 4 (ninguna contraseña aquí: la pone una persona), art. 11 (reversión probada).
--
-- Aviso de la 010 (propuesta 25): su M01 revoca de forma global los permisos por defecto de `postgres`.
-- Toda tabla, secuencia o función creada después en este esquema lleva su `grant` explícito.
begin;

-- Si el esquema ya existe, debe ser de quien aplica: no se adopta ni se pisa el de otro dueño.
do $$
begin
  if exists (
    select 1 from pg_catalog.pg_namespace n
     where n.nspname = 'conector_prueba' and n.nspowner <> (select r.oid from pg_catalog.pg_roles r where r.rolname = current_user)
  ) then
    raise exception 'conector_prueba: el esquema conector_prueba ya existe con otro dueño; no se aplica';
  end if;
end
$$;

create schema if not exists conector_prueba;
-- Nadie más que los dos roles del conector (abajo) entra en el esquema.
revoke all on schema conector_prueba from public;

-- ---------------------------------------------------------------------
-- Roles: sin permisos sobre tablas. Sin contraseña: la fija una persona solo en Vercel (art. 4), como
-- verificador SCRAM calculado en su máquina (LEEME.md).
-- `conector_prueba_mcp`: validar_acceso, mcp_* y registrar_suceso (recibe entradas de un modelo).
-- `conector_prueba_gestion`: autorización, operar_* y registrar_suceso.
--
-- Los atributos negativos van en el CREATE ROLE: en Nido `postgres` no es superusuario y un
-- `alter role ... nosuperuser` o `nobypassrls` falla (42501). Si el rol ya existe no se intenta
-- cambiarlos: se comprueba que no los tiene y, si los tiene, se para (cierre en fallo, art. 3).
-- ---------------------------------------------------------------------
do $$
declare
  v_rol text;
begin
  foreach v_rol in array array['conector_prueba_mcp', 'conector_prueba_gestion'] loop
    if not exists (select 1 from pg_catalog.pg_roles where rolname = v_rol) then
      execute format(
        'create role %I login noinherit nosuperuser nocreatedb nocreaterole nobypassrls noreplication connection limit 10',
        v_rol);
    else
      if exists (
        select 1 from pg_catalog.pg_roles r
         where r.rolname = v_rol
           and (r.rolsuper or r.rolbypassrls or r.rolreplication or r.rolcreaterole or r.rolcreatedb)
      ) then
        raise exception 'conector_prueba: el rol % ya existe con atributos peligrosos (superusuario, bypassrls, replicación, createrole o createdb); no se aplica', v_rol;
      end if;
      if exists (
        select 1 from pg_catalog.pg_auth_members m
          join pg_catalog.pg_roles r on r.oid = m.member
         where r.rolname = v_rol
      ) then
        raise exception 'conector_prueba: el rol % ya existe y es miembro de otro rol; no se aplica', v_rol;
      end if;
      execute format('alter role %I login noinherit connection limit 10', v_rol);
    end if;
    execute format('alter role %I set statement_timeout = %L', v_rol, '5s');
    execute format('alter role %I set idle_in_transaction_session_timeout = %L', v_rol, '10s');
    execute format('alter role %I set lock_timeout = %L', v_rol, '2s');
  end loop;
end
$$;

grant usage on schema conector_prueba to conector_prueba_mcp, conector_prueba_gestion;

-- ---------------------------------------------------------------------
-- Enumerados (listas cerradas). Los de MODELO-DATOS.sql, en este esquema, y los propios del conector.
-- ---------------------------------------------------------------------
do $$ begin create type conector_prueba.tipo_licencia as enum ('A', 'B'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.estado_licencia as enum ('activa', 'suspendida', 'revocada'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.asistente as enum ('claude', 'chatgpt', 'otro'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.origen_cliente_oauth as enum ('cimd', 'dcr', 'predefinido'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.motivo_revocacion as enum ('operador', 'reutilizacion', 'cierre'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.tipo_token as enum ('acceso', 'renovacion'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.tipo_orden as enum ('pausar', 'reanudar'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.estado_orden as enum ('pendiente', 'entregada', 'confirmada', 'anulada'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.estado_servido as enum ('activa', 'pausada', 'suspendida'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.estado_informe as enum ('ok', 'aviso', 'error', 'pausado'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.modo_ejecucion as enum ('conversacion', 'desatendido'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.almacenamiento as enum ('drive', 'onedrive', 'dropbox', 'otro'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.ambito_limite as enum ('activacion', 'dcr', 'operacion'); exception when duplicate_object then null; end $$;
do $$ begin create type conector_prueba.resultado_suceso as enum ('correcto', 'rechazado', 'error'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Tablas. RLS activado y sin políticas: nadie llega por la API; solo las funciones security definer.
-- ---------------------------------------------------------------------

-- Licencias de la prueba: A y B (dos clientes ficticios). El cliente es solo un identificador opaco.
create table if not exists conector_prueba.licencias (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null,
  tipo       conector_prueba.tipo_licencia not null,
  estado     conector_prueba.estado_licencia not null default 'activa',
  creada_en  timestamptz not null default now()
);
create unique index if not exists licencias_un_cliente_vigente
  on conector_prueba.licencias (cliente_id) where estado <> 'revocada';
create unique index if not exists licencias_un_tipo_vigente
  on conector_prueba.licencias (tipo) where estado <> 'revocada';

-- Códigos de activación de un solo uso: solo su HMAC.
create table if not exists conector_prueba.codigos_activacion (
  id          uuid primary key default gen_random_uuid(),
  licencia_id uuid not null references conector_prueba.licencias (id) on delete cascade,
  codigo_hmac text not null unique check (codigo_hmac ~ '^[0-9a-f]{64}$'),
  caduca_en   timestamptz not null,
  usado_en    timestamptz,
  creado_en   timestamptz not null default now(),
  constraint codigos_activacion_caducidad_posterior check (caduca_en > creado_en)
);
create index if not exists codigos_activacion_por_licencia on conector_prueba.codigos_activacion (licencia_id);

-- Clientes OAuth (los asistentes): CIMD por URL de la lista, o DCR con `dcr_` + 22; callbacks de la lista.
create table if not exists conector_prueba.clientes_oauth (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null unique
                check (client_id ~ '^(https://[a-z0-9.-]{1,200}(/[A-Za-z0-9._~/-]{0,90})?|dcr_[A-Za-z0-9_-]{22})$'),
  origen        conector_prueba.origen_cliente_oauth not null,
  redirect_uris text[] not null
                check (cardinality(redirect_uris) between 1 and 2
                  and redirect_uris <@ array['https://claude.ai/api/mcp/auth_callback',
                                             'https://chatgpt.com/connector_platform_oauth_redirect']::text[]),
  creado_en     timestamptz not null default now(),
  comprobado_en timestamptz,
  ultimo_uso_en timestamptz
);

-- Cada activación crea una conexión, revocable por separado.
create table if not exists conector_prueba.conexiones (
  id                uuid primary key default gen_random_uuid(),
  licencia_id       uuid not null references conector_prueba.licencias (id) on delete cascade,
  asistente         conector_prueba.asistente not null default 'otro',
  creada_en         timestamptz not null default now(),
  ultimo_uso_en     timestamptz,
  revocada_en       timestamptz,
  motivo_revocacion conector_prueba.motivo_revocacion,
  constraint conexiones_revocacion_coherente check ((revocada_en is null) = (motivo_revocacion is null))
);
create index if not exists conexiones_por_licencia on conector_prueba.conexiones (licencia_id);

-- Solicitud de autorización: cliente, callback, desafío, recurso, y el HMAC de `state` y de la cookie.
create table if not exists conector_prueba.solicitudes_autorizacion (
  id               uuid primary key default gen_random_uuid(),
  cliente_oauth_id uuid not null references conector_prueba.clientes_oauth (id) on delete cascade,
  redirect_uri     text not null
                   check (redirect_uri = any (array['https://claude.ai/api/mcp/auth_callback',
                                                    'https://chatgpt.com/connector_platform_oauth_redirect'])),
  desafio_pkce     text not null check (desafio_pkce ~ '^[A-Za-z0-9_-]{43}$'),
  recurso          text not null
                   check (recurso ~ '^(https://[a-z0-9.-]{1,200}|http://localhost)(:[0-9]{1,5})?/api/mcp$'),
  state_hmac       text not null check (state_hmac ~ '^[0-9a-f]{64}$'),
  cookie_hmac      text not null check (cookie_hmac ~ '^[0-9a-f]{64}$'),
  creada_en        timestamptz not null default now(),
  caduca_en        timestamptz not null,
  constraint solicitudes_autorizacion_caducidad_posterior check (caduca_en > creada_en)
);
create index if not exists solicitudes_autorizacion_por_cliente on conector_prueba.solicitudes_autorizacion (cliente_oauth_id);
create index if not exists solicitudes_autorizacion_por_caducidad on conector_prueba.solicitudes_autorizacion (caduca_en);

create table if not exists conector_prueba.codigos_autorizacion (
  id               uuid primary key default gen_random_uuid(),
  codigo_hmac      text not null unique check (codigo_hmac ~ '^[0-9a-f]{64}$'),
  conexion_id      uuid not null references conector_prueba.conexiones (id) on delete cascade,
  cliente_oauth_id uuid not null references conector_prueba.clientes_oauth (id) on delete cascade,
  redirect_uri     text not null
                   check (redirect_uri = any (array['https://claude.ai/api/mcp/auth_callback',
                                                    'https://chatgpt.com/connector_platform_oauth_redirect'])),
  desafio_pkce     text not null check (desafio_pkce ~ '^[A-Za-z0-9_-]{43}$'),
  recurso          text not null
                   check (recurso ~ '^(https://[a-z0-9.-]{1,200}|http://localhost)(:[0-9]{1,5})?/api/mcp$'),
  creado_en        timestamptz not null default now(),
  caduca_en        timestamptz not null,
  usado_en         timestamptz,
  constraint codigos_autorizacion_caducidad_posterior check (caduca_en > creado_en)
);
create index if not exists codigos_autorizacion_por_conexion on conector_prueba.codigos_autorizacion (conexion_id);
create index if not exists codigos_autorizacion_por_cliente on conector_prueba.codigos_autorizacion (cliente_oauth_id);

-- Tokens: solo el HMAC con su tipo. `sal` (128 bits en base64url) no es secreta: se guarda al rotar.
create table if not exists conector_prueba.tokens (
  id             uuid primary key default gen_random_uuid(),
  conexion_id    uuid not null references conector_prueba.conexiones (id) on delete cascade,
  tipo           conector_prueba.tipo_token not null,
  token_hmac     text not null unique check (token_hmac ~ '^[0-9a-f]{64}$'),
  sal            text check (sal ~ '^[A-Za-z0-9_-]{22}$'),
  recurso        text not null
                 check (recurso ~ '^(https://[a-z0-9.-]{1,200}|http://localhost)(:[0-9]{1,5})?/api/mcp$'),
  creado_en      timestamptz not null default now(),
  caduca_en      timestamptz not null,
  sustituido_por uuid references conector_prueba.tokens (id),
  sustituido_en  timestamptz,
  revocado_en    timestamptz,
  constraint tokens_caducidad_posterior check (caduca_en > creado_en)
);
create index if not exists tokens_por_conexion on conector_prueba.tokens (conexion_id);
create index if not exists tokens_por_sustituto on conector_prueba.tokens (sustituido_por) where sustituido_por is not null;

-- Órdenes de la licencia (pausar o reanudar). Las marcas de tiempo van con su estado.
create table if not exists conector_prueba.ordenes (
  id            uuid primary key default gen_random_uuid(),
  licencia_id   uuid not null references conector_prueba.licencias (id) on delete cascade,
  tipo          conector_prueba.tipo_orden not null,
  estado        conector_prueba.estado_orden not null default 'pendiente',
  creada_en     timestamptz not null default now(),
  entregada_en  timestamptz,
  confirmada_en timestamptz,
  anulada_en    timestamptz,
  constraint ordenes_estado_coherente check (
    (estado = 'pendiente' and entregada_en is null and confirmada_en is null and anulada_en is null)
    or (estado = 'entregada' and entregada_en is not null and confirmada_en is null and anulada_en is null)
    or (estado = 'confirmada' and entregada_en is not null and confirmada_en is not null and anulada_en is null)
    or (estado = 'anulada' and anulada_en is not null and confirmada_en is null)
  )
);
create index if not exists ordenes_por_licencia on conector_prueba.ordenes (licencia_id, creada_en desc);

-- Latido: se abre al servir instrucciones y se cierra con el informe. Ligada a la conexión que la abre.
create table if not exists conector_prueba.ejecuciones (
  id             uuid primary key default gen_random_uuid(),
  conexion_id    uuid not null references conector_prueba.conexiones (id) on delete cascade,
  licencia_id    uuid not null references conector_prueba.licencias (id) on delete cascade,
  estado_servido conector_prueba.estado_servido not null,
  abierta_en     timestamptz not null default now(),
  cerrada_en     timestamptz
);
create index if not exists ejecuciones_por_conexion on conector_prueba.ejecuciones (conexion_id);
create index if not exists ejecuciones_por_licencia on conector_prueba.ejecuciones (licencia_id, abierta_en desc);

-- Informe: solo enteros acotados (rangos del contrato), booleanos y listas cerradas.
create table if not exists conector_prueba.informes (
  id                  uuid primary key default gen_random_uuid(),
  ejecucion_id        uuid not null unique references conector_prueba.ejecuciones (id) on delete cascade,
  licencia_id         uuid not null references conector_prueba.licencias (id) on delete cascade,
  recibido_en         timestamptz not null default now(),
  estado              conector_prueba.estado_informe not null,
  modo                conector_prueba.modo_ejecucion not null,
  asistente           conector_prueba.asistente not null,
  almacenamiento      conector_prueba.almacenamiento not null,
  version_prompt      text not null check (char_length(version_prompt) <= 12
                        and version_prompt ~ '^[0-9]+\.[0-9]+(\.[0-9]+)?$'),
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
  -- Catálogo cerrado de informe.schema.json; como mucho 5. Nunca frases.
  problemas           text[] not null default '{}'
                      check (cardinality(problemas) <= 5
                        and problemas <@ array['sin_acceso_correo', 'sin_acceso_almacenamiento', 'sin_contexto',
                                               'registro_no_guardado', 'error_borrador', 'error_guardar_documento',
                                               'error_etiquetado', 'limite_correos_alcanzado',
                                               'factura_requiere_acceso', 'otro_agente_detectado',
                                               'conector_humanaia_inestable', 'otro']::text[]),
  -- Cuántos campos ajenos traía el informe. Solo el número: ni nombres ni valores.
  campos_descartados  smallint not null default 0 check (campos_descartados between 0 and 1000)
);
create index if not exists informes_por_licencia on conector_prueba.informes (licencia_id, recibido_en desc);

-- Límites por origen: el origen solo como HMAC; ventana y recuento.
create table if not exists conector_prueba.limites_origen (
  id              uuid primary key default gen_random_uuid(),
  ambito          conector_prueba.ambito_limite not null,
  origen_hmac     text not null check (origen_hmac ~ '^[0-9a-f]{64}$'),
  ventana_desde   timestamptz not null,
  fallos          smallint not null default 0 check (fallos between 0 and 1000),
  bloqueado_hasta timestamptz,
  unique (ambito, origen_hmac)
);
create index if not exists limites_origen_por_ventana on conector_prueba.limites_origen (ventana_desde);

-- Sucesos: solo forma cerrada. Nunca valores recibidos, cabeceras, tokens, códigos, origen ni mensajes.
create table if not exists conector_prueba.sucesos (
  id          bigint generated always as identity primary key,
  momento     timestamptz not null default now(),
  ruta        text not null check (ruta ~ '^[a-z0-9_/-]{1,60}$'),
  herramienta text check (herramienta in ('obtener_instrucciones', 'enviar_informe', 'confirmar_orden')),
  resultado   conector_prueba.resultado_suceso not null default 'correcto',
  -- Código de resultado de una lista cerrada de minúsculas y guion bajo; nunca un mensaje.
  codigo      text not null default 'ok' check (codigo ~ '^[a-z0-9_]{1,40}$'),
  duracion_ms integer not null default 0 check (duracion_ms between 0 and 600000),
  protocolo   text not null default 'otra' check (protocolo = any (array['2025-11-25', '2026-07-28', 'otra'])),
  asistente   conector_prueba.asistente
);
create index if not exists sucesos_por_momento on conector_prueba.sucesos (momento);

-- RLS activado y SIN políticas en las doce tablas (nadie llega por la API; solo security definer).
alter table conector_prueba.licencias enable row level security;
alter table conector_prueba.codigos_activacion enable row level security;
alter table conector_prueba.clientes_oauth enable row level security;
alter table conector_prueba.conexiones enable row level security;
alter table conector_prueba.solicitudes_autorizacion enable row level security;
alter table conector_prueba.codigos_autorizacion enable row level security;
alter table conector_prueba.tokens enable row level security;
alter table conector_prueba.ordenes enable row level security;
alter table conector_prueba.ejecuciones enable row level security;
alter table conector_prueba.informes enable row level security;
alter table conector_prueba.limites_origen enable row level security;
alter table conector_prueba.sucesos enable row level security;

-- ---------------------------------------------------------------------
-- Revocaciones (M-4). Ninguno de estos roles tiene permiso alguno sobre tablas ni secuencias.
-- ---------------------------------------------------------------------
revoke all on all tables in schema conector_prueba
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on all sequences in schema conector_prueba
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on all functions in schema conector_prueba
  from public, anon, authenticated, service_role;
-- Para lo que se cree después en el esquema. Limitación conocida de Postgres: el permiso por defecto de
-- PUBLIC sobre funciones no se quita desde un esquema; toda función nueva lleva su `revoke ... from public`.
alter default privileges in schema conector_prueba revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema conector_prueba revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges in schema conector_prueba revoke execute on functions from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Funciones security definer (D-035): search_path = pg_catalog, pg_temp (pg_temp el último), todo lo que
-- no es de pg_catalog calificado con su esquema, la hora solo con now() y cuerpos entre dólares.
-- Ninguna recibe un identificador de cliente o de licencia: se derivan del HMAC del token (art. 2).
-- Cada una lleva su `revoke` explícito (también a los roles del conector) y su `grant execute` al rol
-- que la necesita (aviso de la 010).
-- ---------------------------------------------------------------------

-- validar_acceso(hmac, recurso) -> boolean. Cierra en fallo: ante cualquier duda, falso.
-- Vale el token de acceso (no de renovación) de ese recurso, emitido ya y no caducado (acotado por los
-- dos lados: no antes de su emisión, no después de su caducidad ni con una vida mayor de 300 s), sin
-- revocar, de una conexión sin revocar y de una licencia no revocada. Suspendida sí vale: se sirve el
-- estado `suspendida`.
create or replace function conector_prueba.validar_acceso(p_token_hmac text, p_recurso text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if p_token_hmac is null or p_recurso is null
     or p_token_hmac !~ '^[0-9a-f]{64}$'
     or char_length(p_recurso) > 300 then
    return false;
  end if;
  return exists (
    select 1
      from conector_prueba.tokens t
      join conector_prueba.conexiones c on c.id = t.conexion_id
      join conector_prueba.licencias l on l.id = c.licencia_id
     where t.token_hmac = p_token_hmac
       and t.tipo = 'acceso'
       and t.recurso = p_recurso
       and t.revocado_en is null
       and t.creado_en <= now()
       and t.caduca_en > now()
       and t.caduca_en <= t.creado_en + interval '300 seconds'
       and c.revocada_en is null
       and l.estado <> 'revocada'
  );
end;
$$;

-- registrar_suceso(...) -> jsonb {"resultado": "registrado" | "saturado" | "descartado" | "invalido"}.
-- Forma cerrada: lo que no cabe se rechaza sin guardar ni repetir el valor. El asistente sale de la
-- conexión del token (si el HMAC la identifica), nunca de una entrada. 20 000 sucesos en 24 horas; el
-- siguiente deja un solo `registro_saturado` y lo demás se descarta. `registro_saturado` es un código
-- reservado: nadie puede escribirlo.
create or replace function conector_prueba.registrar_suceso(
  p_token_hmac text,
  p_ruta text,
  p_herramienta text,
  p_resultado text,
  p_codigo text,
  p_duracion_ms integer,
  p_protocolo text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_asistente conector_prueba.asistente;
  v_total bigint;
  c_limite constant integer := 20000;
begin
  if p_ruta is null or p_ruta !~ '^[a-z0-9_/-]{1,60}$'
     or (p_herramienta is not null and p_herramienta not in ('obtener_instrucciones', 'enviar_informe', 'confirmar_orden'))
     or p_resultado is null or p_resultado not in ('correcto', 'rechazado', 'error')
     or p_codigo is null or p_codigo !~ '^[a-z0-9_]{1,40}$' or p_codigo = 'registro_saturado'
     or p_duracion_ms is null or p_duracion_ms not between 0 and 600000
     or p_protocolo is null or p_protocolo not in ('2025-11-25', '2026-07-28', 'otra') then
    return jsonb_build_object('resultado', 'invalido');
  end if;

  if p_token_hmac is not null and p_token_hmac ~ '^[0-9a-f]{64}$' then
    select c.asistente into v_asistente
      from conector_prueba.tokens t
      join conector_prueba.conexiones c on c.id = t.conexion_id
     where t.token_hmac = p_token_hmac;
  end if;

  select count(*) into v_total
    from conector_prueba.sucesos s
   where s.momento > now() - interval '24 hours';

  if v_total >= c_limite then
    -- Una sola marca aunque lleguen varias a la vez: se serializa y se vuelve a mirar.
    perform pg_advisory_xact_lock(hashtext('conector_prueba.registro_saturado'));
    if exists (
      select 1 from conector_prueba.sucesos s
       where s.codigo = 'registro_saturado' and s.momento > now() - interval '24 hours'
    ) then
      return jsonb_build_object('resultado', 'descartado');
    end if;
    insert into conector_prueba.sucesos (ruta, herramienta, resultado, codigo, duracion_ms, protocolo, asistente)
    values ('registro', null, 'error', 'registro_saturado', 0, 'otra', null);
    return jsonb_build_object('resultado', 'saturado');
  end if;

  insert into conector_prueba.sucesos (ruta, herramienta, resultado, codigo, duracion_ms, protocolo, asistente)
  values (p_ruta, p_herramienta, p_resultado::conector_prueba.resultado_suceso, p_codigo,
          p_duracion_ms, p_protocolo, v_asistente);
  return jsonb_build_object('resultado', 'registrado');
end;
$$;

-- mcp_obtener_instrucciones(hmac, recurso) -> jsonb. Primera llamada de cada revisión.
--   {"resultado": "no_autorizado"}  (token, tipo, recurso, caducidad o revocación no válidos: sin efecto)
--   {"resultado": "servido", "estado": activa|pausada|suspendida, "ejecucion_id": uuid, "orden": null | {id, tipo}}
-- La licencia y la conexión salen del token (art. 2). Estado: `suspendida` si la licencia lo está,
-- `pausada` si la última orden no anulada es pausar, si no `activa`. Siempre abre una ejecución. Entrega
-- la orden pendiente o entregada más reciente y marca la pendiente como entregada, salvo con la licencia
-- suspendida (orden nula y sigue pendiente). El texto del prompt y las reglas no salen de aquí: son del
-- código.
create or replace function conector_prueba.mcp_obtener_instrucciones(p_token_hmac text, p_recurso text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_conexion uuid;
  v_licencia uuid;
  v_estado_licencia conector_prueba.estado_licencia;
  v_estado conector_prueba.estado_servido;
  v_ultima conector_prueba.tipo_orden;
  v_orden uuid;
  v_orden_tipo conector_prueba.tipo_orden;
  v_orden_estado conector_prueba.estado_orden;
  v_ejecucion uuid;
begin
  if p_token_hmac is null or p_recurso is null
     or p_token_hmac !~ '^[0-9a-f]{64}$'
     or char_length(p_recurso) > 300 then
    return jsonb_build_object('resultado', 'no_autorizado');
  end if;

  select c.id, l.id, l.estado
    into v_conexion, v_licencia, v_estado_licencia
    from conector_prueba.tokens t
    join conector_prueba.conexiones c on c.id = t.conexion_id
    join conector_prueba.licencias l on l.id = c.licencia_id
   where t.token_hmac = p_token_hmac
     and t.tipo = 'acceso'
     and t.recurso = p_recurso
     and t.revocado_en is null
     and t.creado_en <= now()
     and t.caduca_en > now()
     and t.caduca_en <= t.creado_en + interval '300 seconds'
     and c.revocada_en is null
     and l.estado <> 'revocada';
  if not found then
    return jsonb_build_object('resultado', 'no_autorizado');
  end if;

  select o.tipo
    into v_ultima
    from conector_prueba.ordenes o
   where o.licencia_id = v_licencia and o.estado <> 'anulada'
   order by o.creada_en desc, o.id desc
   limit 1;

  if v_estado_licencia = 'suspendida' then
    v_estado := 'suspendida';
  elsif v_ultima = 'pausar' then
    v_estado := 'pausada';
  else
    v_estado := 'activa';
  end if;

  -- Con la licencia suspendida no se entrega ni se marca nada.
  if v_estado <> 'suspendida' then
    select o.id, o.tipo, o.estado
      into v_orden, v_orden_tipo, v_orden_estado
      from conector_prueba.ordenes o
     where o.licencia_id = v_licencia and o.estado in ('pendiente', 'entregada')
     order by o.creada_en desc, o.id desc
     limit 1
       for update;
    if v_orden is not null and v_orden_estado = 'pendiente' then
      update conector_prueba.ordenes
         set estado = 'entregada', entregada_en = now()
       where id = v_orden;
    end if;
  end if;

  insert into conector_prueba.ejecuciones (conexion_id, licencia_id, estado_servido)
  values (v_conexion, v_licencia, v_estado)
  returning id into v_ejecucion;

  update conector_prueba.conexiones set ultimo_uso_en = now() where id = v_conexion;

  return jsonb_build_object(
    'resultado', 'servido',
    'estado', v_estado::text,
    'ejecucion_id', v_ejecucion,
    'orden', case when v_orden is null then null
                  else jsonb_build_object('id', v_orden, 'tipo', v_orden_tipo::text) end
  );
end;
$$;

-- informe_es_valido(informe) -> boolean. Valida un informe contra informe.schema.json: claves exactas
-- (el servidor ya descartó lo ajeno y lo contó aparte), enteros acotados (24.0 vale, 24.5 no), listas
-- cerradas, cuatro comprobaciones booleanas y `problemas` del catálogo, como mucho cinco y sin repetir
-- (uniqueItems del contrato: no cabe en un check). Solo la usa mcp_enviar_informe; nadie más la ejecuta.
create or replace function conector_prueba.informe_es_valido(p_informe jsonb)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_especificacion text;
  v_clave text;
  v_valor jsonb;
  v_numero numeric;
  v_texto text;
  v_vistos text[] := array[]::text[];
  v_indice integer;
  v_catalogo constant text[] := array['sin_acceso_correo', 'sin_acceso_almacenamiento', 'sin_contexto',
    'registro_no_guardado', 'error_borrador', 'error_guardar_documento', 'error_etiquetado',
    'limite_correos_alcanzado', 'factura_requiere_acceso', 'otro_agente_detectado',
    'conector_humanaia_inestable', 'otro'];
begin
  if p_informe is null or jsonb_typeof(p_informe) <> 'object' then
    return false;
  end if;
  if not (p_informe ?& array['estado', 'modo', 'asistente', 'almacenamiento', 'version_prompt',
                             'frecuencia_horas', 'tratados', 'sin_tratar', 'borradores', 'documentos',
                             'facturas_pendientes', 'urgentes', 'comprobaciones', 'problemas'])
     or cardinality(array(select jsonb_object_keys(p_informe))) <> 14 then
    return false;
  end if;

  -- Enteros acotados: clave:mínimo:máximo.
  foreach v_especificacion in array array['frecuencia_horas:1:168', 'tratados:0:1000',
      'sin_tratar:0:100000', 'borradores:0:1000', 'documentos:0:1000', 'facturas_pendientes:0:1000',
      'urgentes:0:1000'] loop
    v_clave := split_part(v_especificacion, ':', 1);
    v_valor := p_informe -> v_clave;
    if jsonb_typeof(v_valor) <> 'number' then
      return false;
    end if;
    v_numero := (v_valor #>> '{}')::numeric;
    if v_numero <> trunc(v_numero)
       or v_numero < split_part(v_especificacion, ':', 2)::numeric
       or v_numero > split_part(v_especificacion, ':', 3)::numeric then
      return false;
    end if;
  end loop;

  -- Listas cerradas: clave:valores separados por comas.
  foreach v_especificacion in array array['estado:ok,aviso,error,pausado',
      'modo:conversacion,desatendido', 'asistente:claude,chatgpt,otro',
      'almacenamiento:drive,onedrive,dropbox,otro'] loop
    v_valor := p_informe -> split_part(v_especificacion, ':', 1);
    if jsonb_typeof(v_valor) <> 'string'
       or not ((v_valor #>> '{}') = any (string_to_array(split_part(v_especificacion, ':', 2), ','))) then
      return false;
    end if;
  end loop;

  v_valor := p_informe -> 'version_prompt';
  if jsonb_typeof(v_valor) <> 'string' then
    return false;
  end if;
  v_texto := v_valor #>> '{}';
  if char_length(v_texto) > 12 or v_texto !~ '^[0-9]+\.[0-9]+(\.[0-9]+)?$' then
    return false;
  end if;

  v_valor := p_informe -> 'comprobaciones';
  if jsonb_typeof(v_valor) <> 'object'
     or not (v_valor ?& array['correo', 'almacenamiento', 'contexto', 'registro'])
     or cardinality(array(select jsonb_object_keys(v_valor))) <> 4 then
    return false;
  end if;
  foreach v_clave in array array['correo', 'almacenamiento', 'contexto', 'registro'] loop
    if jsonb_typeof(v_valor -> v_clave) <> 'boolean' then
      return false;
    end if;
  end loop;

  v_valor := p_informe -> 'problemas';
  if jsonb_typeof(v_valor) <> 'array' or jsonb_array_length(v_valor) > 5 then
    return false;
  end if;
  for v_indice in 0 .. jsonb_array_length(v_valor) - 1 loop
    if jsonb_typeof(v_valor -> v_indice) <> 'string' then
      return false;
    end if;
    v_texto := v_valor ->> v_indice;
    if not (v_texto = any (v_catalogo)) or v_texto = any (v_vistos) then
      return false;
    end if;
    v_vistos := array_append(v_vistos, v_texto);
  end loop;
  return true;
end;
$$;

-- mcp_enviar_informe(hmac, recurso, ejecucion, informe, descartados) -> jsonb {"resultado": ...}:
-- no_autorizado | ejecucion_desconocida | informe_invalido | guardado | repetido. `p_ejecucion` es el
-- identificador de la ejecución que dio obtener_instrucciones, como texto: lo que no es un uuid o no es
-- de la misma conexión es una ejecución desconocida (ajeno = inexistente) y nunca se repite el valor.
-- Un informe por ejecución: repetir no pisa nada. Guardar cierra la ejecución.
-- La versión anterior recibía jsonb: si existe, se retira para que no quede una sobrecarga sin proteger.
drop function if exists conector_prueba.mcp_enviar_informe(text, text, text, jsonb, integer);
create or replace function conector_prueba.mcp_enviar_informe(
  p_token_hmac text,
  p_recurso text,
  p_ejecucion text,
  p_informe text,
  p_descartados integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_conexion uuid;
  v_licencia uuid;
  v_ejecucion uuid;
  v_informe jsonb;
begin
  if p_token_hmac is null or p_recurso is null
     or p_token_hmac !~ '^[0-9a-f]{64}$'
     or char_length(p_recurso) > 300 then
    return jsonb_build_object('resultado', 'no_autorizado');
  end if;

  select c.id, l.id
    into v_conexion, v_licencia
    from conector_prueba.tokens t
    join conector_prueba.conexiones c on c.id = t.conexion_id
    join conector_prueba.licencias l on l.id = c.licencia_id
   where t.token_hmac = p_token_hmac
     and t.tipo = 'acceso'
     and t.recurso = p_recurso
     and t.revocado_en is null
     and t.creado_en <= now()
     and t.caduca_en > now()
     and t.caduca_en <= t.creado_en + interval '300 seconds'
     and c.revocada_en is null
     and l.estado <> 'revocada';
  if not found then
    return jsonb_build_object('resultado', 'no_autorizado');
  end if;

  if p_ejecucion is null or p_ejecucion !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('resultado', 'ejecucion_desconocida');
  end if;
  select e.id
    into v_ejecucion
    from conector_prueba.ejecuciones e
   where e.id = p_ejecucion::uuid and e.conexion_id = v_conexion and e.licencia_id = v_licencia
     for update;
  if not found then
    return jsonb_build_object('resultado', 'ejecucion_desconocida');
  end if;

  -- El informe llega como TEXTO y se convierte aquí dentro: con un parámetro jsonb, un "barra u 0000" o un
  -- sustituto suelto fallarían antes de la función y el error llevaría el contenido en CONTEXT (art. 1 y 7).
  -- Cualquier fallo de conversión es informe_invalido, sin eco. Un informe real mide menos de 2 KB.
  if p_descartados is null or p_descartados not between 0 and 1000
     or p_informe is null or char_length(p_informe) > 16384 then
    return jsonb_build_object('resultado', 'informe_invalido');
  end if;
  begin
    v_informe := p_informe::jsonb;
  exception when others then
    return jsonb_build_object('resultado', 'informe_invalido');
  end;
  if not conector_prueba.informe_es_valido(v_informe) then
    return jsonb_build_object('resultado', 'informe_invalido');
  end if;

  begin
    insert into conector_prueba.informes (
      ejecucion_id, licencia_id, estado, modo, asistente, almacenamiento, version_prompt,
      frecuencia_horas, tratados, sin_tratar, borradores, documentos, facturas_pendientes, urgentes,
      comp_correo, comp_almacenamiento, comp_contexto, comp_registro, problemas, campos_descartados)
    values (
      v_ejecucion, v_licencia,
      (v_informe ->> 'estado')::conector_prueba.estado_informe,
      (v_informe ->> 'modo')::conector_prueba.modo_ejecucion,
      (v_informe ->> 'asistente')::conector_prueba.asistente,
      (v_informe ->> 'almacenamiento')::conector_prueba.almacenamiento,
      v_informe ->> 'version_prompt',
      ((v_informe ->> 'frecuencia_horas')::numeric)::smallint,
      ((v_informe ->> 'tratados')::numeric)::integer,
      ((v_informe ->> 'sin_tratar')::numeric)::integer,
      ((v_informe ->> 'borradores')::numeric)::integer,
      ((v_informe ->> 'documentos')::numeric)::integer,
      ((v_informe ->> 'facturas_pendientes')::numeric)::integer,
      ((v_informe ->> 'urgentes')::numeric)::integer,
      (v_informe -> 'comprobaciones' ->> 'correo')::boolean,
      (v_informe -> 'comprobaciones' ->> 'almacenamiento')::boolean,
      (v_informe -> 'comprobaciones' ->> 'contexto')::boolean,
      (v_informe -> 'comprobaciones' ->> 'registro')::boolean,
      array(select jsonb_array_elements_text(v_informe -> 'problemas')),
      p_descartados::smallint)
    on conflict (ejecucion_id) do nothing;
  exception
    -- Red de seguridad: lo que la validación no hubiera previsto cierra en fallo, sin eco del valor.
    when check_violation or invalid_text_representation or numeric_value_out_of_range then
      return jsonb_build_object('resultado', 'informe_invalido');
  end;
  if not found then
    return jsonb_build_object('resultado', 'repetido');
  end if;

  update conector_prueba.ejecuciones set cerrada_en = now() where id = v_ejecucion and cerrada_en is null;
  return jsonb_build_object('resultado', 'guardado');
end;
$$;

-- mcp_confirmar_orden(hmac, recurso, orden) -> jsonb {"resultado": ...}:
-- no_autorizado | no_confirmada | confirmada | repetida. Solo se confirma una orden `entregada` de la
-- licencia del token. Una orden de otra licencia, inexistente, mal formada, pendiente o anulada es
-- `no_confirmada` (ajeno = inexistente) sin efecto ni eco. Confirmar de nuevo no cambia nada: `repetida`.
create or replace function conector_prueba.mcp_confirmar_orden(p_token_hmac text, p_recurso text, p_orden text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_licencia uuid;
  v_orden uuid;
  v_estado conector_prueba.estado_orden;
begin
  if p_token_hmac is null or p_recurso is null
     or p_token_hmac !~ '^[0-9a-f]{64}$'
     or char_length(p_recurso) > 300 then
    return jsonb_build_object('resultado', 'no_autorizado');
  end if;

  select l.id
    into v_licencia
    from conector_prueba.tokens t
    join conector_prueba.conexiones c on c.id = t.conexion_id
    join conector_prueba.licencias l on l.id = c.licencia_id
   where t.token_hmac = p_token_hmac
     and t.tipo = 'acceso'
     and t.recurso = p_recurso
     and t.revocado_en is null
     and t.creado_en <= now()
     and t.caduca_en > now()
     and t.caduca_en <= t.creado_en + interval '300 seconds'
     and c.revocada_en is null
     and l.estado <> 'revocada';
  if not found then
    return jsonb_build_object('resultado', 'no_autorizado');
  end if;

  if p_orden is null or p_orden !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('resultado', 'no_confirmada');
  end if;

  select o.id, o.estado
    into v_orden, v_estado
    from conector_prueba.ordenes o
   where o.id = p_orden::uuid and o.licencia_id = v_licencia
     for update;
  if not found then
    return jsonb_build_object('resultado', 'no_confirmada');
  end if;

  if v_estado = 'confirmada' then
    return jsonb_build_object('resultado', 'repetida');
  end if;
  if v_estado <> 'entregada' then
    return jsonb_build_object('resultado', 'no_confirmada');
  end if;

  update conector_prueba.ordenes
     set estado = 'confirmada', confirmada_en = now()
   where id = v_orden;
  return jsonb_build_object('resultado', 'confirmada');
end;
$$;

-- Permisos de las funciones: nada para nadie y después solo lo necesario.
revoke all on function conector_prueba.validar_acceso(text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.validar_acceso(text, text) to conector_prueba_mcp;

revoke all on function conector_prueba.registrar_suceso(text, text, text, text, text, integer, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.registrar_suceso(text, text, text, text, text, integer, text)
  to conector_prueba_mcp, conector_prueba_gestion;

revoke all on function conector_prueba.mcp_obtener_instrucciones(text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.mcp_obtener_instrucciones(text, text) to conector_prueba_mcp;

revoke all on function conector_prueba.informe_es_valido(jsonb)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;

revoke all on function conector_prueba.mcp_enviar_informe(text, text, text, text, integer)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.mcp_enviar_informe(text, text, text, text, integer)
  to conector_prueba_mcp;

revoke all on function conector_prueba.mcp_confirmar_orden(text, text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.mcp_confirmar_orden(text, text, text) to conector_prueba_mcp;

commit;
