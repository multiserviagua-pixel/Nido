-- Conector de prueba real (001, T-103 a): estado en el esquema `conector_prueba`.
-- Lo aplica UNA PERSONA en el editor SQL de `Nido` (ver LEEME.md). No se toca `public`, `privado` ni
-- `supabase/migrations/`. Transaccional y reejecutable. Vuelta atrás: 001_estado.reversion.sql.
--
-- Constitución: art. 1 (solo enteros acotados, booleanos y listas cerradas; ninguna columna de token,
-- código, dirección ni texto libre: lo secreto va solo como HMAC hexadecimal), art. 2 (el cliente se
-- deriva del token dentro de la base; ninguna función recibe un identificador de cliente ni de licencia; la
-- única excepción, nominal, es `operar_revocar_conexion(p_origen_hmac, p_conexion)`: recibe como texto el
-- identificador de una CONEXIÓN que dio `operar_listar_conexiones` (REQ-017), solo para revocarla, tras la
-- credencial de operación y la puerta por origen), art. 3 (todo cierra en
-- fallo), art. 4 (ninguna contraseña aquí: la pone una persona), art. 11 (reversión probada).
--
-- Aviso de la 010 (propuesta 25): su M01 revoca de forma global los permisos por defecto de `postgres`.
-- Toda tabla, secuencia o función creada después en este esquema lleva su `grant` explícito.
begin;

-- Si el esquema ya existe, debe ser de quien aplica: no se adopta ni se pisa el de otro dueño.
do $$
begin
  -- Nada de lo que ya haya dentro (relaciones, tipos, funciones) puede ser de otro dueño: un objeto previo
  -- con otra forma, de otro rol, pasaría el `if not exists` de abajo y seguiría siendo suyo.
  if exists (
    select 1 from pg_catalog.pg_class c
     where c.relnamespace = to_regnamespace('conector_prueba') and c.relowner <> (select r.oid from pg_catalog.pg_roles r where r.rolname = current_user)
    union all
    select 1 from pg_catalog.pg_type t
     where t.typnamespace = to_regnamespace('conector_prueba') and t.typowner <> (select r.oid from pg_catalog.pg_roles r where r.rolname = current_user)
    union all
    select 1 from pg_catalog.pg_proc p
     where p.pronamespace = to_regnamespace('conector_prueba') and p.proowner <> (select r.oid from pg_catalog.pg_roles r where r.rolname = current_user)
  ) then
    raise exception 'conector_prueba: el esquema conector_prueba contiene objetos de otro dueño; no se aplica';
  end if;
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
      -- Pertenencias en las dos direcciones: que sea miembro de otro rol (heredaría sus permisos) o que otros
      -- sean miembros de él (podrían hacerse pasar por él). Quien aplica y los superusuarios se ignoran: en
      -- Supabase `postgres` entra en los roles que crea y un superusuario ya lo puede todo.
      if exists (
        select 1 from pg_catalog.pg_auth_members m
          join pg_catalog.pg_roles r on r.oid = m.member
         where r.rolname = v_rol
      ) then
        raise exception 'conector_prueba: el rol % ya existe y es miembro de otro rol; no se aplica', v_rol;
      end if;
      if exists (
        select 1 from pg_catalog.pg_auth_members m
          join pg_catalog.pg_roles r on r.oid = m.roleid
          join pg_catalog.pg_roles u on u.oid = m.member
         where r.rolname = v_rol and u.rolname <> current_user and not u.rolsuper
      ) then
        raise exception 'conector_prueba: el rol % ya existe y otros roles son miembros de él; no se aplica', v_rol;
      end if;
      -- Dueños y concesiones del rol fuera del esquema (pg_shdepend: 'o' dueño, 'a' concesión): un rol previo
      -- con select sobre otra tabla, o dueño de un objeto, conservaría ese acceso al adoptarlo. Los números son
      -- los oid fijos de los catálogos: 1260 pg_authid, 1259 pg_class, 1255 pg_proc, 1247 pg_type, 2615 pg_namespace.
      if exists (
        select 1 from pg_catalog.pg_shdepend d
          join pg_catalog.pg_roles r on r.oid = d.refobjid
         where d.refclassid = 1260::oid
           and r.rolname = v_rol
           and d.deptype in ('o', 'a')
           and d.dbid in (0, (select o.oid from pg_catalog.pg_database o where o.datname = current_database()))
           and not (
             (d.classid = 1259::oid
                and exists (select 1 from pg_catalog.pg_class x where x.oid = d.objid and x.relnamespace = to_regnamespace('conector_prueba')))
             or (d.classid = 1255::oid
                and exists (select 1 from pg_catalog.pg_proc x where x.oid = d.objid and x.pronamespace = to_regnamespace('conector_prueba')))
             or (d.classid = 1247::oid
                and exists (select 1 from pg_catalog.pg_type x where x.oid = d.objid and x.typnamespace = to_regnamespace('conector_prueba')))
             or (d.classid = 2615::oid and d.objid = to_regnamespace('conector_prueba')::oid)
           )
      ) then
        raise exception 'conector_prueba: el rol % ya existe y tiene dueños o concesiones fuera del esquema; no se aplica', v_rol;
      end if;
      -- Adopción sin elevar: no se toca LOGIN (un rol sin inicio de sesión, p. ej. tras el cierre, no lo
      -- recupera: lo decide una persona) y solo se restringe lo que difiere (herencia y límite de conexiones;
      -- uno más estricto se respeta). Si ya está como debe, no se ejecuta ningún ALTER y no puede fallar.
      if exists (select 1 from pg_catalog.pg_roles r where r.rolname = v_rol and r.rolinherit) then
        execute format('alter role %I noinherit', v_rol);
      end if;
      if exists (
        select 1 from pg_catalog.pg_roles r where r.rolname = v_rol and (r.rolconnlimit < 0 or r.rolconnlimit > 10)
      ) then
        execute format('alter role %I connection limit 10', v_rol);
      end if;
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
-- T-107 (c): el cliente OAuth del que se emitió el token (una renovación solo vale para el mismo cliente).
-- Siempre presente (not null): no hay tokens sin cliente. Si esta tabla ya existía con filas sin cliente, el
-- `set not null` falla y la transacción entera se deshace: una persona decide qué hacer con ellas.
alter table conector_prueba.tokens
  add column if not exists cliente_oauth_id uuid references conector_prueba.clientes_oauth (id) on delete cascade;
alter table conector_prueba.tokens
  alter column cliente_oauth_id set not null;
create index if not exists tokens_por_conexion on conector_prueba.tokens (conexion_id);
create index if not exists tokens_por_cliente on conector_prueba.tokens (cliente_oauth_id) where cliente_oauth_id is not null;
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

-- Cierre de la prueba (T-107 d): una sola fila, terminal. La escribe solo `cerrar_prueba`.
create table if not exists conector_prueba.cierre (
  id         boolean primary key default true check (id),
  cerrado_en timestamptz not null default now()
);

-- RLS activado y SIN políticas en las trece tablas (nadie llega por la API; solo security definer).
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
alter table conector_prueba.cierre enable row level security;

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
       and not exists (select 1 from conector_prueba.cierre)
  );
end;
$$;

-- registrar_suceso(...) -> jsonb {"resultado": "registrado" | "saturado" | "descartado" | "invalido"}.
-- Forma cerrada: lo que no cabe se rechaza sin guardar ni repetir el valor. El asistente sale de la
-- conexión del token (si el HMAC la identifica), nunca de una entrada. 20 000 sucesos en 24 horas; el
-- siguiente deja un solo `registro_saturado` y lo demás se descarta. `registro_saturado` es un código
-- reservado: nadie puede escribirlo.
-- Tras el cierre de la prueba SIGUE escribiendo (observabilidad; decisión de la coordinación, D-036): no
-- concede acceso, guarda solo la forma cerrada y la acota el tope de 20 000 al día.
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
     where t.token_hmac = p_token_hmac
       and t.tipo = 'acceso';
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
     and l.estado <> 'revocada'
     and not exists (select 1 from conector_prueba.cierre);
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
     and l.estado <> 'revocada'
     and not exists (select 1 from conector_prueba.cierre);
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
     and l.estado <> 'revocada'
     and not exists (select 1 from conector_prueba.cierre);
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

-- =====================================================================
-- T-107 (autorización y operación). Solo las ejecuta `conector_prueba_gestion` (no recibe entradas de un
-- modelo). Ninguna recibe un identificador de cliente (de licencia) como autoridad: el cliente OAuth que
-- reciben es el del protocolo (`client_id` público), nunca el cliente de HumanaIA.
-- =====================================================================

-- callbacks_validos(uris) -> boolean. Auxiliar: uno o dos callbacks distintos, idénticos a los de la lista
-- cerrada (comparación exacta de texto). Cualquier otro valor, también una variante, es falso.
create or replace function conector_prueba.callbacks_validos(p_uris text[])
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if p_uris is null or cardinality(p_uris) not between 1 and 2 then
    return false;
  end if;
  if not (p_uris <@ array['https://claude.ai/api/mcp/auth_callback',
                          'https://chatgpt.com/connector_platform_oauth_redirect']::text[]) then
    return false;
  end if;
  return cardinality(p_uris) = 1 or p_uris[1] <> p_uris[2];
end;
$$;

-- purgar() -> void. Purga a 24 h, dentro de las funciones que escriben: solicitudes y códigos de
-- autorización caducados, límites vencidos y clientes DCR que nunca se usaron. Solo la llaman otras
-- funciones de este esquema.
create or replace function conector_prueba.purgar()
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  delete from conector_prueba.solicitudes_autorizacion where caduca_en <= now() - interval '24 hours';
  delete from conector_prueba.codigos_autorizacion where caduca_en <= now() - interval '24 hours';
  delete from conector_prueba.limites_origen
   where ventana_desde <= now() - interval '24 hours'
     and (bloqueado_hasta is null or bloqueado_hasta <= now());
  delete from conector_prueba.clientes_oauth
   where origen = 'dcr' and ultimo_uso_en is null and creado_en <= now() - interval '24 hours';
end;
$$;

-- leer_cliente(client_id) -> jsonb: {"resultado": "desconocido"} |
-- {"resultado": "conocido", "origen", "redirect_uris", "vigente"}. `vigente`: un cliente CIMD vale 1 h desde
-- su última comprobación (después, la app lo vuelve a descargar; nunca se usa caducado); uno DCR, siempre
-- que no haya vencido sin uso (24 h). Un DCR vencido sin uso es desconocido aunque aún no se haya purgado.
create or replace function conector_prueba.leer_cliente(p_client_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_origen conector_prueba.origen_cliente_oauth;
  v_uris text[];
  v_comprobado timestamptz;
  v_creado timestamptz;
  v_uso timestamptz;
begin
  if p_client_id is null or char_length(p_client_id) > 300 then
    return jsonb_build_object('resultado', 'desconocido');
  end if;
  select c.origen, c.redirect_uris, c.comprobado_en, c.creado_en, c.ultimo_uso_en
    into v_origen, v_uris, v_comprobado, v_creado, v_uso
    from conector_prueba.clientes_oauth c
   where c.client_id = p_client_id;
  if not found or (v_origen = 'dcr' and v_uso is null and v_creado <= now() - interval '24 hours') then
    return jsonb_build_object('resultado', 'desconocido');
  end if;
  return jsonb_build_object(
    'resultado', 'conocido',
    'origen', v_origen::text,
    'redirect_uris', to_jsonb(v_uris),
    'vigente', case when v_origen = 'cimd'
                    then v_comprobado is not null and v_comprobado <= now()
                         and v_comprobado > now() - interval '1 hour'
                    else true end);
end;
$$;

-- guardar_cliente_cimd(client_id, callbacks) -> {"resultado": "guardado" | "no_valido" | "cerrada"}. Tras el cierre
-- de la prueba devuelve `cerrada` sin escribir nada (decisión de la coordinación, D-036). El origen es
-- siempre `cimd` (nunca una entrada) y el identificador, una URL https sin puerto, usuario, consulta ni
-- fragmento. Callbacks: todos de la lista o rechazo entero. La lista de hosts y la descarga son de la app.
create or replace function conector_prueba.guardar_cliente_cimd(p_client_id text, p_redirect_uris text[])
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_client_id is null or char_length(p_client_id) > 300
     or p_client_id !~ '^https://[a-z0-9.-]{1,200}(/[A-Za-z0-9._~/-]{0,90})?$'
     or not conector_prueba.callbacks_validos(p_redirect_uris) then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  perform conector_prueba.purgar();
  begin
    update conector_prueba.clientes_oauth c
       set redirect_uris = p_redirect_uris, comprobado_en = now()
     where c.client_id = p_client_id and c.origen = 'cimd';
    if not found then
      insert into conector_prueba.clientes_oauth (client_id, origen, redirect_uris, comprobado_en)
      values (p_client_id, 'cimd', p_redirect_uris, now())
      on conflict (client_id) do nothing;
    end if;
  exception when check_violation then
    return jsonb_build_object('resultado', 'no_valido');
  end;
  if not found then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  return jsonb_build_object('resultado', 'guardado');
end;
$$;

-- registrar_cliente_dcr(origen_hmac, client_id, callbacks) ->
-- {"resultado": "registrado" | "limite" | "origen_bloqueado" | "no_valido" | "cerrada"} (`cerrada` tras el
-- cierre de la prueba, sin escribir nada). El origen llega solo como HMAC.
-- 50 clientes sin uso en total (`limite`) y 5 por origen y hora (`origen_bloqueado`); se serializa para que
-- el recuento no se pase. Purga a 24 h al escribir. Nunca repite lo recibido.
create or replace function conector_prueba.registrar_cliente_dcr(
  p_origen_hmac text,
  p_client_id text,
  p_redirect_uris text[]
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_ventana timestamptz;
  v_registros smallint;
  v_sin_uso bigint;
begin
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_origen_hmac is null or p_origen_hmac !~ '^[0-9a-f]{64}$'
     or p_client_id is null or p_client_id !~ '^dcr_[A-Za-z0-9_-]{22}$'
     or not conector_prueba.callbacks_validos(p_redirect_uris) then
    return jsonb_build_object('resultado', 'no_valido');
  end if;

  perform pg_advisory_xact_lock(hashtext('conector_prueba.dcr'));
  perform conector_prueba.purgar();

  select l.ventana_desde, l.fallos
    into v_ventana, v_registros
    from conector_prueba.limites_origen l
   where l.ambito = 'dcr' and l.origen_hmac = p_origen_hmac;
  if found and v_ventana > now() - interval '1 hour' and v_registros >= 5 then
    return jsonb_build_object('resultado', 'origen_bloqueado');
  end if;

  select count(*) into v_sin_uso
    from conector_prueba.clientes_oauth c
   where c.origen = 'dcr' and c.ultimo_uso_en is null;
  if v_sin_uso >= 50 then
    return jsonb_build_object('resultado', 'limite');
  end if;

  begin
    insert into conector_prueba.clientes_oauth (client_id, origen, redirect_uris)
    values (p_client_id, 'dcr', p_redirect_uris);
  exception when unique_violation or check_violation then
    return jsonb_build_object('resultado', 'no_valido');
  end;

  -- En `limites_origen`, para el ámbito `dcr`, `fallos` cuenta los registros de la ventana de 1 h.
  update conector_prueba.limites_origen l
     set ventana_desde = case when l.ventana_desde <= now() - interval '1 hour' then now() else l.ventana_desde end,
         fallos = case when l.ventana_desde <= now() - interval '1 hour' then 1 else l.fallos + 1 end
   where l.ambito = 'dcr' and l.origen_hmac = p_origen_hmac;
  if not found then
    insert into conector_prueba.limites_origen (ambito, origen_hmac, ventana_desde, fallos)
    values ('dcr', p_origen_hmac, now(), 1);
  end if;
  return jsonb_build_object('resultado', 'registrado');
end;
$$;

revoke all on function conector_prueba.callbacks_validos(text[])
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on function conector_prueba.purgar()
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on function conector_prueba.leer_cliente(text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.leer_cliente(text) to conector_prueba_gestion;
revoke all on function conector_prueba.guardar_cliente_cimd(text, text[])
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.guardar_cliente_cimd(text, text[]) to conector_prueba_gestion;
revoke all on function conector_prueba.registrar_cliente_dcr(text, text, text[])
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.registrar_cliente_dcr(text, text, text[]) to conector_prueba_gestion;

-- ---------------------------------------------------------------------
-- T-107 (b): abrir_solicitud y activar. Los recuentos de intentos están dentro de la función que canjea.
-- ---------------------------------------------------------------------

-- origen_bloqueado(ámbito, origen_hmac) -> boolean. Auxiliar de lectura: ¿sigue bloqueado ese origen?
create or replace function conector_prueba.origen_bloqueado(
  p_ambito conector_prueba.ambito_limite,
  p_origen_hmac text
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  return exists (
    select 1 from conector_prueba.limites_origen l
     where l.ambito = p_ambito and l.origen_hmac = p_origen_hmac and l.bloqueado_hasta > now()
  );
end;
$$;

-- contar_fallo(ámbito, origen_hmac) -> boolean (¿queda bloqueado?). 5 fallos en una ventana de 15 minutos
-- bloquean el origen 15 minutos. Un origen ya bloqueado no se vuelve a contar. La ventana se reinicia
-- cuando pasan 15 minutos desde el primer fallo. Solo la llaman otras funciones de este esquema.
-- La fila del origen se crea con `insert … on conflict (ambito, origen_hmac) do nothing` (nunca hay
-- `unique_violation`: su DETAIL llevaría el HMAC del origen y la excepción abortaría la petición) y se
-- bloquea con `select … for update` ANTES de evaluar el bloqueo: dos peticiones concurrentes del mismo origen
-- se serializan sobre esa fila y la segunda ve el recuento de la primera. Se usa `do nothing` y no `do
-- update`: el bloqueo ya lo toma el `for update` y así el comportamiento es idéntico con la fila nueva o
-- ya existente. La carrera real se prueba en Nido (PRUEBA-008); PGlite solo la simula con un disparador.
create or replace function conector_prueba.contar_fallo(
  p_ambito conector_prueba.ambito_limite,
  p_origen_hmac text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_ventana timestamptz;
  v_fallos smallint;
  v_bloqueo timestamptz;
begin
  insert into conector_prueba.limites_origen (ambito, origen_hmac, ventana_desde, fallos)
  values (p_ambito, p_origen_hmac, now(), 0)
  on conflict (ambito, origen_hmac) do nothing;
  select l.ventana_desde, l.fallos, l.bloqueado_hasta
    into v_ventana, v_fallos, v_bloqueo
    from conector_prueba.limites_origen l
   where l.ambito = p_ambito and l.origen_hmac = p_origen_hmac
     for update;
  if not found then
    -- Otra transacción acaba de purgar esa fila: ante la duda, se deniega (art. 3).
    return true;
  end if;
  if v_bloqueo is not null and v_bloqueo > now() then
    return true;
  end if;
  if v_ventana <= now() - interval '15 minutes' then
    update conector_prueba.limites_origen l
       set ventana_desde = now(), fallos = 1, bloqueado_hasta = null
     where l.ambito = p_ambito and l.origen_hmac = p_origen_hmac;
    return false;
  end if;
  v_fallos := least(v_fallos + 1, 1000);
  if v_fallos >= 5 then
    update conector_prueba.limites_origen l
       set fallos = v_fallos, bloqueado_hasta = now() + interval '15 minutes'
     where l.ambito = p_ambito and l.origen_hmac = p_origen_hmac;
    return true;
  end if;
  update conector_prueba.limites_origen l
     set fallos = v_fallos
   where l.ambito = p_ambito and l.origen_hmac = p_origen_hmac;
  return false;
end;
$$;

-- abrir_solicitud(client_id, redirect_uri, desafio, recurso, state_hmac, cookie_hmac) ->
-- {"resultado": "abierta", "solicitud": uuid} | {"resultado": "no_valida"}. Solicitud de 10 minutos. Todo se
-- valida ANTES de insertar (en particular, un desafío PKCE de exactamente 43 caracteres base64url): lo que
-- no vale es `no_valida`, sin excepción ni eco. El cliente debe ser conocido y vigente, y el callback, uno de
-- los suyos (y por tanto de la lista). `state` y la cookie solo existen como HMAC.
create or replace function conector_prueba.abrir_solicitud(
  p_client_id text,
  p_redirect_uri text,
  p_desafio text,
  p_recurso text,
  p_state_hmac text,
  p_cookie_hmac text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_id uuid;
  v_cliente uuid;
  v_origen conector_prueba.origen_cliente_oauth;
  v_uris text[];
  v_comprobado timestamptz;
  v_creado timestamptz;
  v_uso timestamptz;
begin
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_client_id is null or char_length(p_client_id) > 300
     or p_redirect_uri is null or char_length(p_redirect_uri) > 300
     or p_desafio is null or char_length(p_desafio) <> 43 or p_desafio !~ '^[A-Za-z0-9_-]{43}$'
     or p_recurso is null or char_length(p_recurso) > 300
     or p_recurso !~ '^(https://[a-z0-9.-]{1,200}|http://localhost)(:[0-9]{1,5})?/api/mcp$'
     or p_state_hmac is null or p_state_hmac !~ '^[0-9a-f]{64}$'
     or p_cookie_hmac is null or p_cookie_hmac !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('resultado', 'no_valida');
  end if;

  select c.id, c.origen, c.redirect_uris, c.comprobado_en, c.creado_en, c.ultimo_uso_en
    into v_cliente, v_origen, v_uris, v_comprobado, v_creado, v_uso
    from conector_prueba.clientes_oauth c
   where c.client_id = p_client_id;
  if not found
     or (v_origen = 'dcr' and v_uso is null and v_creado <= now() - interval '24 hours')
     or (v_origen = 'cimd' and (v_comprobado is null or v_comprobado > now()
                                or v_comprobado <= now() - interval '1 hour'))
     or not (p_redirect_uri = any (v_uris)) then
    return jsonb_build_object('resultado', 'no_valida');
  end if;

  perform conector_prueba.purgar();
  -- Tope global de solicitudes vigentes: quien conozca un cliente público no puede llenar la tabla. Al
  -- superarlo, no_valida. Es un tope blando: peticiones simultáneas pueden pasarlo por unas pocas filas.
  if (select count(*) from conector_prueba.solicitudes_autorizacion s where s.caduca_en > now()) >= 1000 then
    return jsonb_build_object('resultado', 'no_valida');
  end if;
  begin
    insert into conector_prueba.solicitudes_autorizacion
      (cliente_oauth_id, redirect_uri, desafio_pkce, recurso, state_hmac, cookie_hmac, caduca_en)
    values
      (v_cliente, p_redirect_uri, p_desafio, p_recurso, p_state_hmac, p_cookie_hmac,
       now() + interval '10 minutes')
    returning id into v_id;
  exception when check_violation then
    return jsonb_build_object('resultado', 'no_valida');
  end;
  return jsonb_build_object('resultado', 'abierta', 'solicitud', v_id::text);
end;
$$;

-- activar(solicitud, cookie_hmac, state_hmac, origen_hmac, codigo_hmac, autorizacion_hmac) ->
-- {"resultado": "activada", "redirect_uri"} | solicitud_no_valida | origen_bloqueado | codigo_no_valido.
-- En UNA transacción: solicitud (bloqueo de fila, misma cookie y mismo state, vigente), código (bloqueo de
-- fila: un solo uso, vigente, de una licencia activa), conexión (el asistente sale del callback), código de
-- autorización de 300 s. Si algo falla, no queda nada a medias; con un código no válido solo queda el
-- recuento de intentos. Un origen bloqueado se rechaza sin evaluar ni consumir nada; una solicitud no válida
-- no cuenta como intento.
create or replace function conector_prueba.activar(
  p_solicitud text,
  p_cookie_hmac text,
  p_state_hmac text,
  p_origen_hmac text,
  p_codigo_hmac text,
  p_autorizacion_hmac text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_solicitud uuid;
  v_cliente uuid;
  v_redirect text;
  v_cookie text;
  v_state text;
  v_caduca timestamptz;
  v_codigo uuid;
  v_licencia uuid;
  v_conexion uuid;
  v_bloqueo timestamptz;
begin
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_origen_hmac is null or p_origen_hmac !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('resultado', 'origen_bloqueado');
  end if;
  if p_solicitud is null or p_solicitud !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or p_cookie_hmac is null or p_cookie_hmac !~ '^[0-9a-f]{64}$'
     or p_state_hmac is null or p_state_hmac !~ '^[0-9a-f]{64}$'
     or p_codigo_hmac is null or p_codigo_hmac !~ '^[0-9a-f]{64}$'
     or p_autorizacion_hmac is null or p_autorizacion_hmac !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('resultado', 'solicitud_no_valida');
  end if;

  perform conector_prueba.purgar();
  -- La fila del origen se crea primero (como en contar_fallo): un `select … for update` sobre una fila que aún
  -- no existe no bloquea nada, y dos primeras peticiones del mismo origen no se serializarían.
  insert into conector_prueba.limites_origen (ambito, origen_hmac, ventana_desde, fallos)
  values ('activacion', p_origen_hmac, now(), 0)
  on conflict (ambito, origen_hmac) do nothing;
  -- Se bloquea la fila del origen (si existe) ANTES de evaluar si está bloqueado: peticiones concurrentes del
  -- mismo origen se serializan y ninguna evalúa un código con el límite ya alcanzado por otra.
  select l.bloqueado_hasta
    into v_bloqueo
    from conector_prueba.limites_origen l
   where l.ambito = 'activacion' and l.origen_hmac = p_origen_hmac
     for update;
  if found and v_bloqueo > now() then
    return jsonb_build_object('resultado', 'origen_bloqueado');
  end if;

  select s.id, s.cliente_oauth_id, s.redirect_uri, s.cookie_hmac, s.state_hmac, s.caduca_en
    into v_solicitud, v_cliente, v_redirect, v_cookie, v_state, v_caduca
    from conector_prueba.solicitudes_autorizacion s
   where s.id = p_solicitud::uuid
     for update;
  if not found or v_cookie <> p_cookie_hmac or v_state <> p_state_hmac or v_caduca <= now() then
    return jsonb_build_object('resultado', 'solicitud_no_valida');
  end if;

  select a.id, a.licencia_id
    into v_codigo, v_licencia
    from conector_prueba.codigos_activacion a
    join conector_prueba.licencias l on l.id = a.licencia_id
   where a.codigo_hmac = p_codigo_hmac
     and a.usado_en is null
     and a.caduca_en > now()
     and l.estado = 'activa'
     for update;
  if not found then
    perform conector_prueba.contar_fallo('activacion', p_origen_hmac);
    return jsonb_build_object('resultado', 'codigo_no_valido');
  end if;

  begin
    update conector_prueba.codigos_activacion set usado_en = now() where id = v_codigo;
    insert into conector_prueba.conexiones (licencia_id, asistente)
    values (v_licencia,
            case v_redirect
              when 'https://claude.ai/api/mcp/auth_callback' then 'claude'::conector_prueba.asistente
              when 'https://chatgpt.com/connector_platform_oauth_redirect' then 'chatgpt'::conector_prueba.asistente
              else 'otro'::conector_prueba.asistente end)
    returning id into v_conexion;
    insert into conector_prueba.codigos_autorizacion
      (codigo_hmac, conexion_id, cliente_oauth_id, redirect_uri, desafio_pkce, recurso, caduca_en)
    select p_autorizacion_hmac, v_conexion, s.cliente_oauth_id, s.redirect_uri, s.desafio_pkce, s.recurso,
           now() + interval '300 seconds'
      from conector_prueba.solicitudes_autorizacion s
     where s.id = v_solicitud;
    update conector_prueba.clientes_oauth set ultimo_uso_en = now() where id = v_cliente;
    delete from conector_prueba.solicitudes_autorizacion where id = v_solicitud;
  exception when unique_violation then
    -- El subbloque se deshace entero: ni código consumido ni conexión.
    return jsonb_build_object('resultado', 'solicitud_no_valida');
  end;
  return jsonb_build_object('resultado', 'activada', 'redirect_uri', v_redirect);
end;
$$;

revoke all on function conector_prueba.origen_bloqueado(conector_prueba.ambito_limite, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on function conector_prueba.contar_fallo(conector_prueba.ambito_limite, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on function conector_prueba.abrir_solicitud(text, text, text, text, text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.abrir_solicitud(text, text, text, text, text, text)
  to conector_prueba_gestion;
revoke all on function conector_prueba.activar(text, text, text, text, text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.activar(text, text, text, text, text, text)
  to conector_prueba_gestion;

-- ---------------------------------------------------------------------
-- T-107 (c): canjear_codigo y renovar. Los tokens llegan ya como HMAC (la app los sortea o los deriva); aquí
-- solo se guardan. Acceso 300 s, renovación 14 días deslizantes, gracia 60 s.
-- ---------------------------------------------------------------------

-- canjear_codigo(codigo_hmac, client_id, redirect_uri, desafio, recurso, acceso_hmac, renovacion_hmac) ->
-- {"resultado": "emitido", "expires_in": 300} | {"resultado": "no_valido"}. `desafio` es el S256 que la app
-- calcula del verificador (el verificador no llega a la base de datos). El código sirve una vez: presentarlo
-- de nuevo, aunque sea con datos erróneos, revoca su conexión (`reutilizacion`) y sus tokens y responde
-- `no_valido`. Cliente, callback, desafío y recurso deben ser exactamente los de la solicitud. Todo o nada.
create or replace function conector_prueba.canjear_codigo(
  p_codigo_hmac text,
  p_client_id text,
  p_redirect_uri text,
  p_desafio text,
  p_recurso text,
  p_acceso_hmac text,
  p_renovacion_hmac text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_codigo uuid;
  v_conexion uuid;
  v_cliente uuid;
  v_redirect text;
  v_desafio text;
  v_recurso text;
  v_caduca timestamptz;
  v_usado timestamptz;
  v_cliente_pedido uuid;
begin
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  if p_codigo_hmac is null or p_codigo_hmac !~ '^[0-9a-f]{64}$'
     or p_acceso_hmac is null or p_acceso_hmac !~ '^[0-9a-f]{64}$'
     or p_renovacion_hmac is null or p_renovacion_hmac !~ '^[0-9a-f]{64}$'
     or p_acceso_hmac = p_renovacion_hmac
     or p_client_id is null or char_length(p_client_id) > 300
     or p_redirect_uri is null or char_length(p_redirect_uri) > 300
     or p_desafio is null or char_length(p_desafio) <> 43
     or p_recurso is null or char_length(p_recurso) > 300 then
    return jsonb_build_object('resultado', 'no_valido');
  end if;

  -- Orden de bloqueos, el de operar_revocar_conexion y cerrar_prueba: la conexión primero y luego sus tokens.
  -- La conexión se conoce por una lectura sin bloqueo; el código se relee ya bloqueado.
  select a.conexion_id into v_conexion
    from conector_prueba.codigos_autorizacion a
   where a.codigo_hmac = p_codigo_hmac;
  if not found then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  perform 1 from conector_prueba.conexiones c where c.id = v_conexion for update;

  select a.id, a.conexion_id, a.cliente_oauth_id, a.redirect_uri, a.desafio_pkce, a.recurso, a.caduca_en, a.usado_en
    into v_codigo, v_conexion, v_cliente, v_redirect, v_desafio, v_recurso, v_caduca, v_usado
    from conector_prueba.codigos_autorizacion a
   where a.codigo_hmac = p_codigo_hmac
     for update;
  if not found then
    return jsonb_build_object('resultado', 'no_valido');
  end if;

  if v_usado is not null then
    -- Reutilización: se revoca esa conexión (si no lo estaba ya, conserva su motivo) y todos sus tokens.
    update conector_prueba.conexiones
       set revocada_en = now(), motivo_revocacion = 'reutilizacion'
     where id = v_conexion and revocada_en is null;
    update conector_prueba.tokens set revocado_en = now() where conexion_id = v_conexion and revocado_en is null;
    return jsonb_build_object('resultado', 'no_valido');
  end if;

  select c.id into v_cliente_pedido from conector_prueba.clientes_oauth c where c.client_id = p_client_id;
  if v_cliente_pedido is null or v_cliente_pedido <> v_cliente
     or v_redirect <> p_redirect_uri or v_desafio <> p_desafio or v_recurso <> p_recurso
     or v_caduca <= now() then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  if not exists (
    select 1
      from conector_prueba.conexiones c
      join conector_prueba.licencias l on l.id = c.licencia_id
     where c.id = v_conexion and c.revocada_en is null and l.estado <> 'revocada'
  ) then
    return jsonb_build_object('resultado', 'no_valido');
  end if;

  begin
    update conector_prueba.codigos_autorizacion set usado_en = now() where id = v_codigo;
    insert into conector_prueba.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
    values (v_conexion, 'acceso', p_acceso_hmac, v_recurso, now() + interval '300 seconds', v_cliente);
    insert into conector_prueba.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
    values (v_conexion, 'renovacion', p_renovacion_hmac, v_recurso, now() + interval '14 days', v_cliente);
    update conector_prueba.conexiones set ultimo_uso_en = now() where id = v_conexion;
  exception when unique_violation then
    return jsonb_build_object('resultado', 'no_valido');
  end;
  return jsonb_build_object('resultado', 'emitido', 'expires_in', 300);
end;
$$;

-- renovar(presentado_hmac, client_id, recurso, sal, acceso_hmac, renovacion_hmac) -> jsonb:
--   {"resultado": "rotado", "expires_in": 300}          vigente: guarda la sal, marca sustituido e inserta el par
--   {"resultado": "repetido", "sal", "expires_in"}     sustituido hace 60 s o menos: la app deriva el MISMO par
--   {"resultado": "reutilizado"}                        sustituido hace más de 60 s: revoca ESA conexión
--   {"resultado": "no_valido"}                          desconocido, caducado, de otro tipo, cliente o recurso, o
--                                                      de una conexión o licencia revocadas
-- Bloquea la fila del token presentado: con varias peticiones a la vez, una rota y las demás repiten.
-- Con la licencia suspendida se renueva (se sirve `suspendida`). La caducidad es deslizante: 14 días desde
-- cada rotación. `repetido` no escribe nada.
create or replace function conector_prueba.renovar(
  p_presentado_hmac text,
  p_client_id text,
  p_recurso text,
  p_sal text,
  p_acceso_hmac text,
  p_renovacion_hmac text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_token uuid;
  v_conexion uuid;
  v_cliente uuid;
  v_recurso text;
  v_caduca timestamptz;
  v_sustituido timestamptz;
  v_sal text;
  v_revocado timestamptz;
  v_cliente_pedido uuid;
  v_nuevo uuid;
  v_expira timestamptz;
begin
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  if p_presentado_hmac is null or p_presentado_hmac !~ '^[0-9a-f]{64}$'
     or p_client_id is null or char_length(p_client_id) > 300
     or p_recurso is null or char_length(p_recurso) > 300
     or p_sal is null or p_sal !~ '^[A-Za-z0-9_-]{22}$'
     or p_acceso_hmac is null or p_acceso_hmac !~ '^[0-9a-f]{64}$'
     or p_renovacion_hmac is null or p_renovacion_hmac !~ '^[0-9a-f]{64}$'
     or p_acceso_hmac = p_renovacion_hmac then
    return jsonb_build_object('resultado', 'no_valido');
  end if;

  -- Orden de bloqueos, el de operar_revocar_conexion y cerrar_prueba: la conexión primero y luego sus tokens.
  -- La conexión se conoce por una lectura sin bloqueo; el token se relee ya bloqueado.
  select t.conexion_id into v_conexion
    from conector_prueba.tokens t
   where t.token_hmac = p_presentado_hmac and t.tipo = 'renovacion';
  if not found then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  perform 1 from conector_prueba.conexiones c where c.id = v_conexion for update;

  select t.id, t.conexion_id, t.cliente_oauth_id, t.recurso, t.caduca_en, t.sustituido_en, t.sal, t.revocado_en
    into v_token, v_conexion, v_cliente, v_recurso, v_caduca, v_sustituido, v_sal, v_revocado
    from conector_prueba.tokens t
   where t.token_hmac = p_presentado_hmac and t.tipo = 'renovacion'
     for update;
  if not found or v_revocado is not null or v_cliente is null or v_recurso <> p_recurso then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  select c.id into v_cliente_pedido from conector_prueba.clientes_oauth c where c.client_id = p_client_id;
  if v_cliente_pedido is null or v_cliente_pedido <> v_cliente then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  if not exists (
    select 1
      from conector_prueba.conexiones c
      join conector_prueba.licencias l on l.id = c.licencia_id
     where c.id = v_conexion and c.revocada_en is null and l.estado <> 'revocada'
  ) then
    return jsonb_build_object('resultado', 'no_valido');
  end if;

  if v_sustituido is null then
    if v_caduca <= now() then
      return jsonb_build_object('resultado', 'no_valido');
    end if;
    begin
      insert into conector_prueba.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
      values (v_conexion, 'acceso', p_acceso_hmac, v_recurso, now() + interval '300 seconds', v_cliente);
      insert into conector_prueba.tokens (conexion_id, tipo, token_hmac, recurso, caduca_en, cliente_oauth_id)
      values (v_conexion, 'renovacion', p_renovacion_hmac, v_recurso, now() + interval '14 days', v_cliente)
      returning id into v_nuevo;
      update conector_prueba.tokens
         set sal = p_sal, sustituido_por = v_nuevo, sustituido_en = now()
       where id = v_token;
      update conector_prueba.conexiones set ultimo_uso_en = now() where id = v_conexion;
    exception when unique_violation then
      return jsonb_build_object('resultado', 'no_valido');
    end;
    return jsonb_build_object('resultado', 'rotado', 'expires_in', 300);
  end if;

  if v_sustituido + interval '60 seconds' >= now() then
    -- Gracia: el acceso del par emitido en esa rotación (mismo instante de creación) dice cuánto le queda.
    select a.caduca_en into v_expira
      from conector_prueba.tokens a
     where a.conexion_id = v_conexion and a.tipo = 'acceso' and a.creado_en = v_sustituido
       and a.revocado_en is null
     limit 1;
    if v_expira is null or v_sal is null then
      return jsonb_build_object('resultado', 'no_valido');
    end if;
    return jsonb_build_object(
      'resultado', 'repetido',
      'sal', v_sal,
      'expires_in', greatest(0, ceil(extract(epoch from (v_expira - now())))::integer));
  end if;

  update conector_prueba.conexiones
     set revocada_en = now(), motivo_revocacion = 'reutilizacion'
   where id = v_conexion and revocada_en is null;
  update conector_prueba.tokens set revocado_en = now() where conexion_id = v_conexion and revocado_en is null;
  return jsonb_build_object('resultado', 'reutilizado');
end;
$$;

revoke all on function conector_prueba.canjear_codigo(text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.canjear_codigo(text, text, text, text, text, text, text)
  to conector_prueba_gestion;
revoke all on function conector_prueba.renovar(text, text, text, text, text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.renovar(text, text, text, text, text, text)
  to conector_prueba_gestion;

-- ---------------------------------------------------------------------
-- T-107 (d): operar_*, operar_contar_fallo y cerrar_prueba (estado terminal). La credencial de operación
-- (`hia_op_`) se comprueba en la app, en tiempo constante, contra su huella; la base de datos no guarda
-- ninguna. Aquí se limita por origen (5 fallos en 15 min bloquean 15 min) y se hace cumplir el cierre.
-- Ninguna recibe un identificador de licencia: eligen entre A y B. `p_conexion` de operar_revocar_conexion es el
-- UUID de conexión que dio `operar_listar_conexiones` (REQ-017), no una autoridad: no sale de ningún token.
-- ---------------------------------------------------------------------

-- Tras el cierre ninguna licencia puede crearse ni reactivarse, tampoco a mano ni con la semilla.
create or replace function conector_prueba.impedir_licencias_tras_cierre()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if new.estado <> 'revocada' and exists (select 1 from conector_prueba.cierre) then
    raise exception 'conector_prueba: la prueba esta cerrada (cierre); no se crean ni reactivan licencias';
  end if;
  return new;
end;
$$;
drop trigger if exists licencias_tras_cierre on conector_prueba.licencias;
create trigger licencias_tras_cierre
  before insert or update on conector_prueba.licencias
  for each row execute function conector_prueba.impedir_licencias_tras_cierre();

-- prueba_cerrada() -> boolean. Auxiliar: ¿se cerró la prueba (`cerrar_prueba`)? Es terminal, sin vuelta.
create or replace function conector_prueba.prueba_cerrada()
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  return exists (select 1 from conector_prueba.cierre);
end;
$$;

-- operar_puerta(origen_hmac) -> text. Puerta común de las operaciones: nula si pasa; `origen_bloqueado` si el
-- origen no es un HMAC o está bloqueado. Todas las `operar_*` (salvo `operar_contar_fallo`) y `cerrar_prueba`
-- la llaman con la misma línea.
create or replace function conector_prueba.operar_puerta(p_origen_hmac text)
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if p_origen_hmac is null or p_origen_hmac !~ '^[0-9a-f]{64}$'
     or conector_prueba.origen_bloqueado('operacion', p_origen_hmac) then
    return 'origen_bloqueado';
  end if;
  return null;
end;
$$;

-- operar_contar_fallo(origen_hmac) -> {"resultado": "contado" | "bloqueado" | "invalido"}. La app la llama
-- cuando la credencial de operación no coincide. Funciona también tras el cierre.
create or replace function conector_prueba.operar_contar_fallo(p_origen_hmac text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if p_origen_hmac is null or p_origen_hmac !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('resultado', 'invalido');
  end if;
  perform conector_prueba.purgar();
  if conector_prueba.contar_fallo('operacion', p_origen_hmac) then
    return jsonb_build_object('resultado', 'bloqueado');
  end if;
  return jsonb_build_object('resultado', 'contado');
end;
$$;

-- operar_generar_codigo(origen_hmac, tipo A|B, codigo_hmac) ->
-- generado | no_valido | licencia_desconocida | licencia_no_activa | origen_bloqueado | cerrada.
-- El código lo sortea la app y se muestra una vez en la terminal de la persona; aquí solo su HMAC, 10 min.
create or replace function conector_prueba.operar_generar_codigo(p_origen_hmac text, p_tipo text, p_codigo_hmac text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
  v_licencia uuid;
  v_estado conector_prueba.estado_licencia;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_tipo is null or p_tipo not in ('A', 'B') or p_codigo_hmac is null or p_codigo_hmac !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  select l.id, l.estado
    into v_licencia, v_estado
    from conector_prueba.licencias l
   where l.tipo = p_tipo::conector_prueba.tipo_licencia and l.estado <> 'revocada'
   order by l.creada_en desc
   limit 1;
  if not found then
    return jsonb_build_object('resultado', 'licencia_desconocida');
  end if;
  if v_estado <> 'activa' then
    return jsonb_build_object('resultado', 'licencia_no_activa');
  end if;
  begin
    insert into conector_prueba.codigos_activacion (licencia_id, codigo_hmac, caduca_en)
    values (v_licencia, p_codigo_hmac, now() + interval '10 minutes');
  exception when unique_violation then
    return jsonb_build_object('resultado', 'no_valido');
  end;
  return jsonb_build_object('resultado', 'generado');
end;
$$;

-- operar_suspender_licencia(origen_hmac, tipo A|B) -> suspendida | sin_cambio | no_valido |
-- licencia_desconocida | origen_bloqueado | cerrada.
create or replace function conector_prueba.operar_suspender_licencia(p_origen_hmac text, p_tipo text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
  v_licencia uuid;
  v_estado conector_prueba.estado_licencia;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_tipo is null or p_tipo not in ('A', 'B') then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  select l.id, l.estado
    into v_licencia, v_estado
    from conector_prueba.licencias l
   where l.tipo = p_tipo::conector_prueba.tipo_licencia and l.estado <> 'revocada'
   order by l.creada_en desc
   limit 1
     for update;
  if not found then
    return jsonb_build_object('resultado', 'licencia_desconocida');
  end if;
  if v_estado = 'suspendida' then
    return jsonb_build_object('resultado', 'sin_cambio');
  end if;
  update conector_prueba.licencias set estado = 'suspendida' where id = v_licencia;
  return jsonb_build_object('resultado', 'suspendida');
end;
$$;

-- operar_reactivar_licencia(origen_hmac, tipo A|B) -> reactivada | sin_cambio | no_valido |
-- licencia_desconocida | origen_bloqueado | cerrada.
create or replace function conector_prueba.operar_reactivar_licencia(p_origen_hmac text, p_tipo text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
  v_licencia uuid;
  v_estado conector_prueba.estado_licencia;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_tipo is null or p_tipo not in ('A', 'B') then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  select l.id, l.estado
    into v_licencia, v_estado
    from conector_prueba.licencias l
   where l.tipo = p_tipo::conector_prueba.tipo_licencia and l.estado <> 'revocada'
   order by l.creada_en desc
   limit 1
     for update;
  if not found then
    return jsonb_build_object('resultado', 'licencia_desconocida');
  end if;
  if v_estado = 'activa' then
    return jsonb_build_object('resultado', 'sin_cambio');
  end if;
  update conector_prueba.licencias set estado = 'activa' where id = v_licencia;
  return jsonb_build_object('resultado', 'reactivada');
end;
$$;

-- operar_crear_orden(origen_hmac, tipo A|B, orden pausar|reanudar) ->
-- {"resultado": "creada", "orden": uuid, "anuladas": n} | no_valido | licencia_desconocida | origen_bloqueado |
-- cerrada. Anula las órdenes no confirmadas de esa licencia (pendientes o entregadas) y crea una pendiente.
create or replace function conector_prueba.operar_crear_orden(p_origen_hmac text, p_tipo text, p_orden text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
  v_licencia uuid;
  v_anuladas integer;
  v_nueva uuid;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_tipo is null or p_tipo not in ('A', 'B') or p_orden is null or p_orden not in ('pausar', 'reanudar') then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  select l.id
    into v_licencia
    from conector_prueba.licencias l
   where l.tipo = p_tipo::conector_prueba.tipo_licencia and l.estado <> 'revocada'
   order by l.creada_en desc
   limit 1
     for update;
  if not found then
    return jsonb_build_object('resultado', 'licencia_desconocida');
  end if;
  update conector_prueba.ordenes
     set estado = 'anulada', anulada_en = now()
   where licencia_id = v_licencia and estado in ('pendiente', 'entregada');
  get diagnostics v_anuladas = row_count;
  insert into conector_prueba.ordenes (licencia_id, tipo)
  values (v_licencia, p_orden::conector_prueba.tipo_orden)
  returning id into v_nueva;
  return jsonb_build_object('resultado', 'creada', 'orden', v_nueva::text, 'anuladas', v_anuladas);
end;
$$;

-- operar_listar_conexiones(origen_hmac) -> {"resultado": "listado", "conexiones": [...]}. Sin ningún secreto:
-- identificador, licencia (A o B), asistente, fechas y motivo. Disponible tras el cierre.
create or replace function conector_prueba.operar_listar_conexiones(p_origen_hmac text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
  v_lista jsonb;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id::text,
           'licencia', l.tipo::text,
           'asistente', c.asistente::text,
           'creada_en', c.creada_en,
           'ultimo_uso_en', c.ultimo_uso_en,
           'revocada_en', c.revocada_en,
           'motivo', c.motivo_revocacion::text) order by c.creada_en, c.id), '[]'::jsonb)
    into v_lista
    from conector_prueba.conexiones c
    join conector_prueba.licencias l on l.id = c.licencia_id;
  return jsonb_build_object('resultado', 'listado', 'conexiones', v_lista);
end;
$$;

-- operar_revocar_conexion(origen_hmac, conexion) -> revocada | sin_cambio | conexion_desconocida | origen_bloqueado |
-- cerrada. Revoca solo esa conexión (motivo `operador`) y sus tokens. Un identificador mal formado o
-- inexistente es `conexion_desconocida`, sin eco.
create or replace function conector_prueba.operar_revocar_conexion(p_origen_hmac text, p_conexion text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
  v_conexion uuid;
  v_revocada timestamptz;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'cerrada');
  end if;
  if p_conexion is null or p_conexion !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('resultado', 'conexion_desconocida');
  end if;
  select c.id, c.revocada_en
    into v_conexion, v_revocada
    from conector_prueba.conexiones c
   where c.id = p_conexion::uuid
     for update;
  if not found then
    return jsonb_build_object('resultado', 'conexion_desconocida');
  end if;
  if v_revocada is not null then
    return jsonb_build_object('resultado', 'sin_cambio');
  end if;
  update conector_prueba.conexiones
     set revocada_en = now(), motivo_revocacion = 'operador'
   where id = v_conexion;
  update conector_prueba.tokens set revocado_en = now() where conexion_id = v_conexion and revocado_en is null;
  return jsonb_build_object('resultado', 'revocada');
end;
$$;

-- operar_resumen(origen_hmac) -> recuentos cerrados, protocolos y percentil 95 (ms) por herramienta.
-- Ningún valor recibido. Disponible tras el cierre.
create or replace function conector_prueba.operar_resumen(p_origen_hmac text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
  v_resumen jsonb;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  select jsonb_build_object(
    'resultado', 'resumen',
    'cerrada', conector_prueba.prueba_cerrada(),
    'licencias', (select coalesce(jsonb_agg(jsonb_build_object('tipo', l.tipo::text, 'estado', l.estado::text)
                                            order by l.tipo, l.creada_en), '[]'::jsonb)
                    from conector_prueba.licencias l),
    'conexiones', (select jsonb_build_object('total', count(*),
                                             'activas', count(*) filter (where c.revocada_en is null),
                                             'revocadas', count(*) filter (where c.revocada_en is not null))
                     from conector_prueba.conexiones c),
    'ordenes', (select jsonb_build_object('pendiente', count(*) filter (where o.estado = 'pendiente'),
                                          'entregada', count(*) filter (where o.estado = 'entregada'),
                                          'confirmada', count(*) filter (where o.estado = 'confirmada'),
                                          'anulada', count(*) filter (where o.estado = 'anulada'))
                  from conector_prueba.ordenes o),
    'ejecuciones', (select jsonb_build_object('total', count(*),
                                              'cerradas', count(*) filter (where e.cerrada_en is not null))
                      from conector_prueba.ejecuciones e),
    'informes', (select count(*) from conector_prueba.informes i),
    'sucesos', (select jsonb_build_object('total', count(*),
                                          'correcto', count(*) filter (where s.resultado = 'correcto'),
                                          'rechazado', count(*) filter (where s.resultado = 'rechazado'),
                                          'error', count(*) filter (where s.resultado = 'error'))
                  from conector_prueba.sucesos s),
    'protocolos', (select jsonb_build_object('2025-11-25', count(*) filter (where s.protocolo = '2025-11-25'),
                                             '2026-07-28', count(*) filter (where s.protocolo = '2026-07-28'),
                                             'otra', count(*) filter (where s.protocolo = 'otra'))
                     from conector_prueba.sucesos s),
    'p95_ms', (select jsonb_build_object(
                 'obtener_instrucciones',
                 round(percentile_cont(0.95) within group (order by s.duracion_ms)
                       filter (where s.herramienta = 'obtener_instrucciones'))::integer,
                 'enviar_informe',
                 round(percentile_cont(0.95) within group (order by s.duracion_ms)
                       filter (where s.herramienta = 'enviar_informe'))::integer,
                 'confirmar_orden',
                 round(percentile_cont(0.95) within group (order by s.duracion_ms)
                       filter (where s.herramienta = 'confirmar_orden'))::integer)
                 from conector_prueba.sucesos s))
    into v_resumen;
  return v_resumen;
end;
$$;

-- operar_exportar_sucesos(origen_hmac, dia 'AAAA-MM-DD') -> {"resultado": "exportado", "sucesos": [...]} |
-- no_valido. Día en UTC; solo la forma cerrada de `sucesos`. Disponible tras el cierre.
create or replace function conector_prueba.operar_exportar_sucesos(p_origen_hmac text, p_dia text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
  v_dia date;
  v_lista jsonb;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  if p_dia is null or p_dia !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    return jsonb_build_object('resultado', 'no_valido');
  end if;
  begin
    v_dia := p_dia::date;
  exception when others then
    return jsonb_build_object('resultado', 'no_valido');
  end;
  select coalesce(jsonb_agg(jsonb_build_object(
           'momento', s.momento,
           'ruta', s.ruta,
           'herramienta', s.herramienta,
           'resultado', s.resultado::text,
           'codigo', s.codigo,
           'duracion_ms', s.duracion_ms,
           'protocolo', s.protocolo,
           'asistente', s.asistente::text) order by s.id), '[]'::jsonb)
    into v_lista
    from conector_prueba.sucesos s
   where s.momento >= (v_dia::timestamp at time zone 'UTC')
     and s.momento < ((v_dia + 1)::timestamp at time zone 'UTC');
  return jsonb_build_object('resultado', 'exportado', 'sucesos', v_lista);
end;
$$;

-- cerrar_prueba(origen_hmac) -> prueba_cerrada | ya_cerrada | origen_bloqueado. TERMINAL, sin vuelta (RD-076,
-- M-5): deja constancia en `cierre`, revoca todas las licencias, conexiones y tokens e invalida los códigos
-- sin usar. Desde entonces generar, activar, abrir solicitud, canjear, renovar, validar y las operaciones de
-- cambio se rechazan; solo `operar_resumen`, `operar_listar_conexiones` y `operar_exportar_sucesos`
-- responden. Ningún trigger deja reactivar o crear licencias. Ya revocadas conservan su motivo.
create or replace function conector_prueba.cerrar_prueba(p_origen_hmac text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_puerta text;
begin
  v_puerta := conector_prueba.operar_puerta(p_origen_hmac);
  if v_puerta is not null then
    return jsonb_build_object('resultado', v_puerta);
  end if;
  perform pg_advisory_xact_lock(hashtext('conector_prueba.cierre'));
  if conector_prueba.prueba_cerrada() then
    return jsonb_build_object('resultado', 'ya_cerrada');
  end if;
  insert into conector_prueba.cierre (id, cerrado_en) values (true, now());
  update conector_prueba.licencias set estado = 'revocada' where estado <> 'revocada';
  update conector_prueba.conexiones
     set revocada_en = now(), motivo_revocacion = 'cierre'
   where revocada_en is null;
  update conector_prueba.tokens set revocado_en = now() where revocado_en is null;
  update conector_prueba.codigos_activacion set usado_en = now() where usado_en is null;
  update conector_prueba.codigos_autorizacion set usado_en = now() where usado_en is null;
  delete from conector_prueba.solicitudes_autorizacion;
  return jsonb_build_object('resultado', 'prueba_cerrada');
end;
$$;

revoke all on function conector_prueba.impedir_licencias_tras_cierre()
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on function conector_prueba.prueba_cerrada()
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on function conector_prueba.operar_puerta(text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
revoke all on function conector_prueba.operar_contar_fallo(text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_contar_fallo(text) to conector_prueba_gestion;
revoke all on function conector_prueba.operar_generar_codigo(text, text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_generar_codigo(text, text, text) to conector_prueba_gestion;
revoke all on function conector_prueba.operar_suspender_licencia(text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_suspender_licencia(text, text) to conector_prueba_gestion;
revoke all on function conector_prueba.operar_reactivar_licencia(text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_reactivar_licencia(text, text) to conector_prueba_gestion;
revoke all on function conector_prueba.operar_crear_orden(text, text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_crear_orden(text, text, text) to conector_prueba_gestion;
revoke all on function conector_prueba.operar_listar_conexiones(text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_listar_conexiones(text) to conector_prueba_gestion;
revoke all on function conector_prueba.operar_revocar_conexion(text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_revocar_conexion(text, text) to conector_prueba_gestion;
revoke all on function conector_prueba.operar_resumen(text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_resumen(text) to conector_prueba_gestion;
revoke all on function conector_prueba.operar_exportar_sucesos(text, text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.operar_exportar_sucesos(text, text) to conector_prueba_gestion;
revoke all on function conector_prueba.cerrar_prueba(text)
  from public, anon, authenticated, service_role, conector_prueba_mcp, conector_prueba_gestion;
grant execute on function conector_prueba.cerrar_prueba(text) to conector_prueba_gestion;

commit;
