do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M01 · privado_rol_y_permisos (función 010, diseño D-1, D-4 y D-9)
--
-- Crea el esquema privado, el rol conector y cierra los permisos por defecto
-- de postgres para PUBLIC, anon, authenticated, service_role y conector
-- (REQ-011). Guarda lo que cierra en privado.permisos_por_defecto_previos
-- para que la reversión lo restaure.
--
-- Atomicidad con cualquier cliente: tras la guarda de rol (primera sentencia,
-- L 11) todo va en UN solo bloque do. Un bloque es una sola sentencia: falla
-- todo o no cambia nada, aunque el cliente envíe cada sentencia por separado
-- (autocommit) y no envuelva el archivo en una transacción. Por eso no lleva
-- begin/commit ni tablas temporales on commit drop (decisión del
-- orquestador, pendiente de confirmar por el responsable; sustituye a
-- begin/commit de D-1: specs/010-base-datos-rls/evidencias/T-001/comprobaciones-cli.md).
--
-- La guarda de la línea 1 es una sentencia aparte: con psql -f sin
-- ON_ERROR_STOP, si falla, lo que sigue se ejecuta igual. Por eso el bloque
-- do repite la guarda como primera instrucción (L 11) y, justo después, fija
-- el search_path (L 13) para que ningún operador o función de otro esquema
-- ocupe el lugar de los de pg_catalog. Antes de fijarla guarda la que había y
-- la restaura como última instrucción (L 13), para que lo que siga en la misma
-- transacción no herede pg_catalog, pg_temp.
-- La guarda compara con operator(pg_catalog.<>): un <> sin calificar se
-- resolvería con el search_path de la sesión, y un <> ajeno puesto delante de
-- pg_catalog la anularía.
-- Los tipos de declare van todos calificados con pg_catalog: se resuelven al
-- compilar el bloque, antes de la guarda y de fijar la ruta, y el CHECK de un
-- dominio ajeno con el mismo nombre correría al iniciar la variable.
-- La contraseña del conector no está aquí: la fija una persona (D-9, REQ-012).
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_esquema pg_catalog.name;
  v_destino pg_catalog.text;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  create schema privado;

  -- Sin "if not exists": si el rol ya existe, la migración falla (y no deja nada).
  create role conector nologin noinherit nobypassrls nocreatedb nocreaterole connection limit 10;
  alter role conector set statement_timeout = '5s';

  -- Cierre de usage y create para los cinco, aunque el esquema haya nacido con
  -- concesiones por defecto de esquemas.
  revoke all on schema privado from public, anon, authenticated, service_role, conector;

  -- Lo que se va a cerrar, guardado para la reversión. Nadie llega a esta tabla
  -- por la API: RLS activado, ninguna política y ningún permiso. Los tipos son
  -- los del catálogo (name y "char"), no texto libre.
  create table privado.permisos_por_defecto_previos (
    esquema name,
    tipo "char" not null check (tipo in ('r', 'S', 'f')),
    acl aclitem[] not null,
    unique nulls not distinct (esquema, tipo)
  );
  alter table privado.permisos_por_defecto_previos enable row level security;
  revoke all on privado.permisos_por_defecto_previos
    from public, anon, authenticated, service_role, conector;

  -- Los permisos por defecto de postgres pueden haber dado algo a otros roles
  -- (p. ej. un destinatario que no es de los cinco). El esquema y la copia son
  -- solo de su dueño: se retira lo que tenga cualquier otro destinatario. Si
  -- no se pudiera retirar, el bloque entero falla y no cambia nada.
  for v_destino in
    select distinct case when a.grantee = 0 then 'PUBLIC'
                         else pg_catalog.quote_ident(r.rolname) end
      from pg_catalog.pg_namespace n
      cross join lateral pg_catalog.aclexplode(n.nspacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'privado' and a.grantee <> n.nspowner
  loop
    execute pg_catalog.format('revoke all on schema privado from %s', v_destino);
  end loop;
  for v_destino in
    select distinct case when a.grantee = 0 then 'PUBLIC'
                         else pg_catalog.quote_ident(r.rolname) end
      from pg_catalog.pg_class c
      cross join lateral pg_catalog.aclexplode(c.relacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where c.oid = 'privado.permisos_por_defecto_previos'::pg_catalog.regclass
       and a.grantee <> c.relowner
  loop
    execute pg_catalog.format(
      'revoke all on table privado.permisos_por_defecto_previos from %s', v_destino);
  end loop;

  -- Un revoke que no retira nada no da error (p. ej., una concesión con otro
  -- concedente): se comprueba el resultado y, si queda algo ajeno, falla todo.
  if exists (
       select 1
         from pg_catalog.pg_namespace n
         cross join lateral pg_catalog.aclexplode(n.nspacl) a
        where n.nspname = 'privado' and a.grantee <> n.nspowner)
     or exists (
       select 1
         from pg_catalog.pg_class c
         cross join lateral pg_catalog.aclexplode(c.relacl) a
        where c.oid = 'privado.permisos_por_defecto_previos'::pg_catalog.regclass
          and a.grantee <> c.relowner)
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  -- Copia de los permisos por defecto de postgres, antes de cerrarlos.
  insert into privado.permisos_por_defecto_previos (esquema, tipo, acl)
  select n.nspname, d.defaclobjtype, d.defaclacl
    from pg_catalog.pg_default_acl d
    left join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
   where d.defaclrole = 'postgres'::pg_catalog.regrole
     and d.defaclobjtype in ('r', 'S', 'f');

  -- Si no hay fila global de un tipo, vale el valor que la base trae de serie.
  insert into privado.permisos_por_defecto_previos (esquema, tipo, acl)
  select null, t.tipo,
         pg_catalog.acldefault(
           case t.tipo when 'S' then 's' else t.tipo end,
           'postgres'::pg_catalog.regrole::pg_catalog.oid)
    from (values ('r'::"char"), ('S'::"char"), ('f'::"char")) as t (tipo)
   where not exists (
     select 1 from privado.permisos_por_defecto_previos c
      where c.esquema is null and c.tipo = t.tipo);

  -- D-4, paso 1: global, cubre los esquemas futuros.
  alter default privileges for role postgres
    revoke all on tables from public, anon, authenticated, service_role, conector;
  alter default privileges for role postgres
    revoke all on sequences from public, anon, authenticated, service_role, conector;
  alter default privileges for role postgres
    revoke all on functions from public, anon, authenticated, service_role, conector;

  -- D-4, paso 2: lo mismo en public, en privado y en cada esquema que tuviera
  -- una fila de postgres al aplicar esta migración. Solo a esos cinco
  -- destinatarios: los de otros roles no se tocan.
  for v_esquema in
    select 'public'::name
    union select 'privado'::name
    union select c.esquema from privado.permisos_por_defecto_previos c where c.esquema is not null
  loop
    execute pg_catalog.format(
      'alter default privileges for role postgres in schema %I revoke all on tables from public, anon, authenticated, service_role, conector',
      v_esquema);
    execute pg_catalog.format(
      'alter default privileges for role postgres in schema %I revoke all on sequences from public, anon, authenticated, service_role, conector',
      v_esquema);
    execute pg_catalog.format(
      'alter default privileges for role postgres in schema %I revoke all on functions from public, anon, authenticated, service_role, conector',
      v_esquema);
  end loop;

  -- Devuelve la ruta que tenía la transacción (hallazgo 1): lo que siga no
  -- hereda pg_catalog, pg_temp.
  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
