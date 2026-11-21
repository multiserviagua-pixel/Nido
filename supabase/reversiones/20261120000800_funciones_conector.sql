do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M08 · funciones_conector
--
-- Deja la base como la dejó M07: sin las cinco funciones y sin usage en privado
-- para conector. No toca ninguna fila.
--
-- Sin cascade (condición heredada de T-005): si algo ajeno depende de una de estas
-- funciones (una vista, una restricción…), falla y el bloque entero se deshace.
-- No depende del cascade de la reversión de M07 ni lo necesita. No usa execute y
-- no nombra las tablas protegidas (L 10, N-7).
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

  -- Primero las que llaman a otras.
  drop function privado.mcp_obtener_instrucciones(pg_catalog.text);
  drop function privado.mcp_enviar_informe(pg_catalog.text, pg_catalog.uuid, pg_catalog.jsonb);
  drop function privado.mcp_confirmar_orden(pg_catalog.text, pg_catalog.uuid);
  drop function privado.resolver_token(pg_catalog.text);
  drop function privado.licencia_vigente(pg_catalog.uuid);

  revoke usage on schema privado from conector;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
