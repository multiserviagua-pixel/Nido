do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M03 · internas_autorizacion_y_cobro
--
-- Borra las cuatro tablas, sin cascade: si algo depende de ellas, el drop
-- falla y el bloque entero se deshace sin cambiar nada.
--
-- Misma forma que M01 (D-1): guarda de rol como primera sentencia y UN solo
-- bloque do que repite la guarda, fija search_path = pg_catalog, pg_temp tras
-- guardar la ruta previa y la restaura al final. Sin begin/commit.
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  drop table public.tokens;
  drop table public.codigos_autorizacion;
  drop table public.clientes_oauth;
  drop table public.eventos_stripe;

  -- Devuelve la ruta que tenía la transacción.
  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
