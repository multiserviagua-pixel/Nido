do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M06 · ejecuciones_informes_alertas
--
-- Quita los disparadores de pertenencia de licencias y conexiones (tablas de
-- M02), borra las tres tablas (con sus disparadores, también los de pertenencia de informes y alertas) y las tres funciones, sin
-- cascade: si algo depende de ellas, falla y el bloque entero se deshace.
-- No es protegida y pasa L 10 (N-7): no nombra las tablas protegidas, ni sus
-- disparadores, ni usa execute.
--
-- Misma forma que M01 (D-1).
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  drop trigger licencias_pertenencia on public.licencias;
  drop trigger conexiones_pertenencia on public.conexiones;

  drop table public.informes;
  drop table public.ejecuciones;
  drop table public.alertas;

  drop function privado.validar_informe();
  drop function privado.validar_ejecucion();
  drop function privado.impedir_cambio_de_pertenencia();

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
