do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M07 · reglas_de_acceso
--
-- Deja la base como la dejó M06: RLS activado, ninguna política y ningún
-- permiso para la API, y sin las funciones, disparadores ni usage en privado
-- que puso M07. No toca ninguna fila.
--
-- No es protegida y pasa L 10 (N-7): no nombra las tablas protegidas, ni sus
-- disparadores, ni usa execute. Por eso:
--   - Los permisos se retiran de todas las tablas de public a la vez, que en el
--     estado de M06 no tienen ninguno para la API. Un revoke retira también los
--     permisos por columna.
--   - Las políticas y el disparador de autoría de las tablas protegidas no se
--     pueden borrar por su nombre sin nombrarlas: salen con la función de la que
--     dependen (cascade). Es_admin() solo tiene políticas por dependientes y
--     fijar_autoria() solo disparadores de M07; la ruta con privado se fija solo
--     para esas dos sentencias, y la comprobación final exige que no quede
--     ninguna política ni ningún disparador de M07. Las políticas de las demás
--     tablas se borran antes por su nombre, y las demás funciones sin cascade:
--     si algo depende de ellas, falla y el bloque entero se deshace.
--
-- Misma forma que M01 (D-1).
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_es_admin pg_catalog.oid;
  v_autoria pg_catalog.oid;
  v_ajenos pg_catalog.int4;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  -- Permisos: ninguno para la API en las tablas de public (estado de M06).
  revoke all on all tables in schema public
    from public, anon, authenticated, service_role, conector;

  -- Disparadores de las tablas que no son protegidas.
  drop trigger clientes_no_reactivar on public.clientes;
  drop trigger clientes_al_dar_de_baja on public.clientes;
  drop trigger codigos_activacion_autoria on public.codigos_activacion;
  drop trigger ordenes_autoria on public.ordenes;
  drop trigger reglas_cliente_valores on public.reglas_cliente;
  drop trigger ajustes_globales_valores on public.ajustes_globales;
  drop trigger ordenes_valores on public.ordenes;
  drop trigger conexiones_valores on public.conexiones;
  drop trigger alertas_valores on public.alertas;

  -- Políticas de las tablas que no son protegidas.
  drop policy clientes_select_admin on public.clientes;
  drop policy clientes_insert_admin on public.clientes;
  drop policy clientes_update_admin on public.clientes;
  drop policy clientes_select_usuario on public.clientes;
  drop policy administradores_select_admin on public.administradores;
  drop policy usuarios_cliente_select_admin on public.usuarios_cliente;
  drop policy usuarios_cliente_insert_admin on public.usuarios_cliente;
  drop policy usuarios_cliente_delete_admin on public.usuarios_cliente;
  drop policy licencias_select_admin on public.licencias;
  drop policy licencias_insert_admin on public.licencias;
  drop policy licencias_update_admin on public.licencias;
  drop policy licencias_select_usuario on public.licencias;
  drop policy codigos_activacion_select_admin on public.codigos_activacion;
  drop policy codigos_activacion_insert_admin on public.codigos_activacion;
  drop policy conexiones_select_admin on public.conexiones;
  drop policy conexiones_update_admin on public.conexiones;
  drop policy reglas_cliente_select_admin on public.reglas_cliente;
  drop policy reglas_cliente_insert_admin on public.reglas_cliente;
  drop policy reglas_cliente_update_admin on public.reglas_cliente;
  drop policy ordenes_select_admin on public.ordenes;
  drop policy ordenes_insert_admin on public.ordenes;
  drop policy ordenes_update_admin on public.ordenes;
  drop policy ordenes_select_usuario on public.ordenes;
  drop policy ajustes_globales_select_admin on public.ajustes_globales;
  drop policy ajustes_globales_update_admin on public.ajustes_globales;
  drop policy catalogo_problemas_select_admin on public.catalogo_problemas;
  drop policy catalogo_problemas_insert_admin on public.catalogo_problemas;
  drop policy catalogo_problemas_update_admin on public.catalogo_problemas;
  drop policy catalogo_problemas_select_usuario on public.catalogo_problemas;
  drop policy alertas_select_admin on public.alertas;
  drop policy alertas_update_admin on public.alertas;
  drop policy ejecuciones_select_admin on public.ejecuciones;
  drop policy ejecuciones_select_usuario on public.ejecuciones;
  drop policy informes_select_admin on public.informes;
  drop policy informes_select_usuario on public.informes;
  drop policy suscripciones_select_admin on public.suscripciones;
  drop policy suscripciones_select_usuario on public.suscripciones;

  -- Las políticas y el disparador de autoría de las tablas protegidas no se pueden
  -- borrar sin nombrar esas tablas (L 10): salen con su función (cascade). Antes de
  -- soltarla se comprueba, por el catálogo de dependencias, que lo único que depende
  -- de las dos funciones son las políticas y el disparador que puso M07, con su
  -- nombre; si hay cualquier otro dependiente (una vista, otra política, otro
  -- disparador, una restricción…) falla antes de borrar nada y el bloque entero no
  -- cambia nada. Es la comprobación que sustituye a escribir cada nombre aparte.
  v_es_admin := pg_catalog.to_regprocedure('privado.es_admin()')::pg_catalog.oid;
  v_autoria := pg_catalog.to_regprocedure('privado.fijar_autoria()')::pg_catalog.oid;
  select pg_catalog.count(*)::pg_catalog.int4
    into v_ajenos
    from pg_catalog.pg_depend d
   where d.refclassid = 'pg_catalog.pg_proc'::pg_catalog.regclass
     and d.refobjid in (v_es_admin, v_autoria)
     and not (
       (d.classid = 'pg_catalog.pg_policy'::pg_catalog.regclass
        and exists (
          select 1
            from pg_catalog.pg_policy p
           where p.oid = d.objid
             and p.polrelid::pg_catalog.regclass::pg_catalog.text like 'public.%'
             and p.polname in ('auditoria_select_admin', 'versiones_prompt_select_admin',
                               'publicaciones_select_admin', 'publicaciones_insert_admin')))
       or (d.classid = 'pg_catalog.pg_trigger'::pg_catalog.regclass
           and exists (
             select 1
               from pg_catalog.pg_trigger t
              where t.oid = d.objid
                and not t.tgisinternal
                and t.tgname = 'publicaciones_autoria')));
  if v_es_admin is null or v_autoria is null or v_ajenos operator(pg_catalog.<>) 0 then
    raise exception 'reversion_dependientes_ajenos';
  end if;

  -- La ruta se fija un instante para resolver el nombre sin calificar: es la forma
  -- que L 10 admite (el detector no mira la palabra cascade sin los nombres de los
  -- protectores), y las dos funciones son las comprobadas arriba.
  perform pg_catalog.set_config('search_path', 'privado, pg_catalog, pg_temp', true);
  drop function es_admin() cascade;
  drop function fijar_autoria() cascade;
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  drop function privado.fijar_valores();
  drop function privado.impedir_reactivar_cliente();
  drop function privado.al_dar_de_baja();
  drop function privado.clientes_del_usuario();

  revoke usage on schema privado from authenticated;

  -- Comprobación: no queda política alguna en public ni disparador de M07.
  if exists (select 1 from pg_catalog.pg_policies where schemaname = 'public')
     or exists (
       select 1
         from pg_catalog.pg_trigger t
         join pg_catalog.pg_class c on c.oid = t.tgrelid
        where c.relnamespace = 'public'::pg_catalog.regnamespace
          and not t.tgisinternal
          and (t.tgname like '%\_autoria' or t.tgname like '%\_valores'
               or t.tgname in ('clientes_no_reactivar', 'clientes_al_dar_de_baja')))
  then
    raise exception 'reversion_restos_de_m07';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
