do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M02 · clientes_y_acceso
--
-- Borra las once tablas y los tipos de §2, sin cascade: si algo depende de
-- ellos (M03 aún aplicada, o una tabla posterior que usa uno de los tipos),
-- un drop falla y el bloque entero se deshace sin cambiar nada.
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

  drop table public.suscripciones;
  drop table public.catalogo_problemas;
  drop table public.ajustes_globales;
  drop table public.ordenes;
  drop table public.reglas_cliente;
  drop table public.conexiones;
  drop table public.codigos_activacion;
  drop table public.licencias;
  drop table public.usuarios_cliente;
  drop table public.administradores;
  drop table public.clientes;

  drop type public.estado_suscripcion;
  drop type public.tipo_alerta;
  drop type public.severidad;
  drop type public.modo_ejecucion;
  drop type public.estado_informe;
  drop type public.estado_servido;
  drop type public.estado_orden;
  drop type public.tipo_orden;
  drop type public.motivo_publicacion;
  drop type public.tipo_token;
  drop type public.origen_cliente_oauth;
  drop type public.almacenamiento;
  drop type public.asistente;
  drop type public.estado_manual;
  drop type public.estado_licencia;
  drop type public.canal;
  drop type public.estado_cliente;

  -- Devuelve la ruta que tenía la transacción.
  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
