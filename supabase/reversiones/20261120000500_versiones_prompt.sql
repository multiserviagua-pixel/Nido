do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M05 · versiones_prompt · PROTEGIDA
--
-- Solo en CI: exige la marca app.reversion_protegida = 'ci' (ver la reversión de
-- M04). En desarrollo y en producción no se revierte (REQ-053, CA-032): se
-- corrige con una migración nueva.
--
-- Borra las dos tablas, con sus disparadores de inmutabilidad y de auditoría,
-- sin cascade. Las funciones de privado son de M04 y se quedan.
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

  if pg_catalog.current_setting('app.reversion_protegida', true) is distinct from 'ci' then
    raise exception 'reversion_protegida_fuera_de_ci';
  end if;

  drop table public.publicaciones;
  drop table public.versiones_prompt;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
