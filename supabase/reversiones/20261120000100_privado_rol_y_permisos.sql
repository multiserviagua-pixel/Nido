do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M01 · privado_rol_y_permisos
--
-- Falla si queda cualquier objeto en public o en privado que no sea la tabla
-- de M01; si no, restaura los permisos por defecto de postgres, y borra la
-- tabla, el rol y el esquema, sin cascade.
--
-- Atomicidad con cualquier cliente: tras la guarda de rol (primera sentencia,
-- L 11), comprobaciones, restauración y los tres drop van en UN solo bloque
-- do, que es una sola sentencia: falla todo o no cambia nada, aunque se envíe
-- sentencia a sentencia (autocommit). No depende de una transacción externa.
-- Si un drop falla al final (p. ej., conector con permisos fuera de public y
-- privado), la restauración de los permisos por defecto se deshace con él.
--
-- La guarda de la línea 1 es una sentencia aparte: con psql -f sin
-- ON_ERROR_STOP, si falla, lo que sigue se ejecuta igual. Por eso el bloque do
-- repite la guarda como primera instrucción (L 11) y fija el search_path justo
-- después (L 13), tras guardar la que había; la restaura como última
-- instrucción, para que lo que siga en la misma transacción no la herede.
-- La guarda compara con operator(pg_catalog.<>): un <> sin calificar se
-- resolvería con el search_path de la sesión, y un <> ajeno puesto delante de
-- pg_catalog la anularía.
-- Los tipos de declare van todos calificados con pg_catalog: se resuelven al
-- compilar el bloque, antes de la guarda y de fijar la ruta, y el CHECK de un
-- dominio ajeno con el mismo nombre correría al iniciar la variable.
-- Antes de borrar nada comprueba que la copia tiene las tres filas globales que
-- M01 siempre inserta (tablas, secuencias y funciones); si alguien la vació o
-- la recortó, falla con reversion_copia_incompleta en lugar de «restaurar»
-- nada sin avisar.
--
-- Límite de la comprobación de objetos ajenos: mira relaciones (tablas,
-- vistas, secuencias…), funciones y tipos de public y privado. No mira
-- operadores, clases de operadores, intercalaciones, conversiones, extensiones,
-- configuraciones de búsqueda de texto ni otros objetos; esos, si los hubiera,
-- los detendría drop schema (sin cascade) y la reversión fallaría entera.
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_fila pg_catalog.record;
  v_permiso pg_catalog.record;
  v_clase pg_catalog.text;
  v_ambito pg_catalog.text;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  if (select count(*)
        from privado.permisos_por_defecto_previos p
       where p.esquema is null and p.tipo in ('r', 'S', 'f')) <> 3 then
    raise exception 'reversion_copia_incompleta';
  end if;

  if exists (
       select 1
         from pg_catalog.pg_class c
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname in ('public', 'privado')
          and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f', 'c')
          and c.oid <> 'privado.permisos_por_defecto_previos'::pg_catalog.regclass
          and not exists (
            select 1 from pg_catalog.pg_depend d
             where d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass
               and d.objid = c.oid and d.deptype = 'e'))
     or exists (
       select 1
         from pg_catalog.pg_proc p
         join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'privado')
          and not exists (
            select 1 from pg_catalog.pg_depend d
             where d.classid = 'pg_catalog.pg_proc'::pg_catalog.regclass
               and d.objid = p.oid and d.deptype = 'e'))
     or exists (
       select 1
         from pg_catalog.pg_type t
         join pg_catalog.pg_namespace n on n.oid = t.typnamespace
        where n.nspname in ('public', 'privado')
          and t.typrelid = 0
          and (t.typtype in ('e', 'd', 'r', 'm') or (t.typtype = 'b' and t.typcategory <> 'A'))
          and not exists (
            select 1 from pg_catalog.pg_depend d
             where d.classid = 'pg_catalog.pg_type'::pg_catalog.regclass
               and d.objid = t.oid and d.deptype = 'e'))
  then
    raise exception 'reversion_con_objetos';
  end if;

  -- Restaura, por cada fila guardada, lo que había para los cinco destinatarios.
  for v_fila in
    select p.esquema, p.tipo, p.acl
      from privado.permisos_por_defecto_previos p
     order by p.esquema nulls first, p.tipo
  loop
    if v_fila.esquema is not null
       and not exists (select 1 from pg_catalog.pg_namespace n where n.nspname = v_fila.esquema) then
      continue;
    end if;
    v_clase := case v_fila.tipo when 'r' then 'tables' when 'S' then 'sequences' else 'functions' end;
    v_ambito := case when v_fila.esquema is null then ''
                     else pg_catalog.format(' in schema %I', v_fila.esquema) end;
    execute pg_catalog.format(
      'alter default privileges for role postgres%s revoke all on %s from public, anon, authenticated, service_role, conector',
      v_ambito, v_clase);
    for v_permiso in
      select a.privilege_type, a.is_grantable, a.grantee
        from pg_catalog.aclexplode(v_fila.acl) a
       where a.grantee = 0
          or a.grantee in (
               select r.oid from pg_catalog.pg_roles r
                where r.rolname in ('anon', 'authenticated', 'service_role', 'conector'))
    loop
      execute pg_catalog.format(
        'alter default privileges for role postgres%s grant %s on %s to %s%s',
        v_ambito, v_permiso.privilege_type, v_clase,
        case when v_permiso.grantee = 0 then 'public'
             else v_permiso.grantee::pg_catalog.regrole::text end,
        case when v_permiso.is_grantable then ' with grant option' else '' end);
    end loop;
  end loop;

  drop table privado.permisos_por_defecto_previos;
  drop role conector;
  drop schema privado;

  -- Devuelve la ruta que tenía la transacción (hallazgo 1): lo que siga no
  -- hereda pg_catalog, pg_temp.
  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
