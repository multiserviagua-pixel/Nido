-- Preámbulo del arnés PGlite: simula lo mínimo de Supabase que las migraciones
-- dan por supuesto. No sustituye a pgTAP contra un Supabase real (CI).
--
-- Reproduce, con datos ficticios:
--   - los roles de la plataforma (anon, authenticated, service_role, supabase_admin);
--   - el esquema auth con auth.jwt() y auth.uid();
--   - el esquema extensions;
--   - los permisos por defecto que Supabase deja a nombre de postgres, que son
--     el motivo de D-4: globales y por esquema, además de los de otro rol
--     (supabase_admin) y los de otro destinatario (conector_prueba, de la 001)
--     que M01 no debe tocar.
--
-- El rol conector NO se crea aquí: lo crea M01.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role supabase_admin nologin;
create role conector_prueba nologin;

create schema auth;
create schema extensions;

create table auth.users (id uuid primary key default gen_random_uuid(), email text);

create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;

grant usage on schema public, auth, extensions to anon, authenticated, service_role;

-- Permisos por defecto de postgres: globales (cubren esquemas futuros) y por esquema.
alter default privileges for role postgres
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres
  grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres
  grant all on functions to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on functions to anon, authenticated, service_role;

alter default privileges for role postgres in schema extensions
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema extensions
  grant all on functions to anon, authenticated, service_role;

-- Otro destinatario de postgres (como el de la 001): no es de los cinco, no se toca.
alter default privileges for role postgres in schema public
  grant select on tables to conector_prueba;

-- Otro rol dueño (supabase_admin): sus permisos por defecto no se tocan.
alter default privileges for role supabase_admin in schema public
  grant all on tables to anon, authenticated, service_role, conector_prueba;
alter default privileges for role supabase_admin in schema public
  grant all on sequences to anon, authenticated, service_role, conector_prueba;
alter default privileges for role supabase_admin in schema public
  grant all on functions to anon, authenticated, service_role, conector_prueba;

-- Concesión por defecto de esquemas nuevos a nombre de postgres (REQ-033):
-- el esquema privado nace con usage para estos roles si M01 no lo quita.
-- Va al final: no afecta a auth ni a extensions, que ya existen.
alter default privileges for role postgres
  grant usage on schemas to anon, authenticated, service_role;
