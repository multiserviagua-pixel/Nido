do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M04 · auditoria · PROTEGIDA
--
-- Solo en CI: exige la marca app.reversion_protegida = 'ci', que solo fija
-- ciclo-migraciones.mjs (T-012). En desarrollo y en producción no se revierte
-- (REQ-053, CA-032): se corrige con una migración nueva. La marca es una
-- variable de sesión: protege de accidentes, no de quien actúa a propósito con
-- postgres (N-8).
--
-- Borra los disparadores de auditoría de las tablas de M02, la tabla (con sus
-- disparadores de inmutabilidad) y las tres funciones, sin cascade: si M05 sigue
-- aplicada (usa impedir_cambios y auditar), un drop falla y el bloque entero se
-- deshace sin cambiar nada.
--
-- Misma forma que M01 (D-1): guarda de rol primera, UN solo bloque do que la
-- repite, fija search_path = pg_catalog, pg_temp y lo restaura al final.
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

  drop trigger administradores_auditar on public.administradores;
  drop trigger catalogo_problemas_auditar on public.catalogo_problemas;
  drop trigger ajustes_globales_auditar on public.ajustes_globales;
  drop trigger ordenes_auditar on public.ordenes;
  drop trigger reglas_cliente_auditar on public.reglas_cliente;
  drop trigger conexiones_auditar on public.conexiones;
  drop trigger codigos_activacion_auditar on public.codigos_activacion;
  drop trigger licencias_auditar on public.licencias;
  drop trigger usuarios_cliente_auditar on public.usuarios_cliente;
  drop trigger clientes_auditar on public.clientes;

  drop table public.auditoria;

  drop function privado.auditar();
  drop function privado.registrar_auditoria(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.uuid);
  drop function privado.impedir_cambios();

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
