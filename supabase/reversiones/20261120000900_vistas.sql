do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M09 · vistas
--
-- Borra las dos vistas por su nombre, sin cascade: si algo ajeno depende de ellas,
-- falla y el bloque entero se deshace. Sus permisos desaparecen con ellas. No toca
-- ninguna tabla ni fila. No nombra las tablas protegidas (L 10, N-7).
-- Misma forma que M01 (D-1).
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  drop view public.resumen_cliente;
  drop view public.metricas_version;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
