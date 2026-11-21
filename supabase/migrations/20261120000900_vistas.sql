do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M09 · vistas (función 010, diseño D-1 y D-2 (1); §9 de docs/MODELO-DATOS.sql)
--
-- resumen_cliente y metricas_version, con security_invoker = true: aplican el RLS
-- de quien consulta, no el del dueño. Un usuario de cliente ve solo lo suyo, el
-- superadmin con doble factor ve todo y el resto, nada (CA-005, CA-006).
--
--   - revoke all explícito a public, anon, authenticated, service_role y conector,
--     y después select solo a authenticated (D-2, 1). Nadie escribe en ellas.
--   - Las vistas no exponen ordenes.creada_por ni licencias.estado_manual (MENOR 3
--     del auditor, T-005): resumen_cliente da solo el resultado (licencia_vigente,
--     en_pausa), y metricas_version, solo agregados de informes.
--   - No leen la auditoría, las versiones del prompt ni las publicaciones.
--
-- Su reversión borra las dos vistas por su nombre, sin cascade.
-- Regla N-3: todo nombre fuera de pg_catalog va calificado.
-- Forma de D-1 (L 11, L 13 y L 14), como M01 a M08.
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_fila pg_catalog.record;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  -- Una fila por cliente que quien consulta puede ver, con el estado de su
  -- licencia, el último informe y las cifras de 30 días.
  create view public.resumen_cliente
  with (security_invoker = true)
  as
  select
    c.id     as cliente_id,
    c.nombre,
    c.estado as estado_cliente,
    coalesce(
      l.estado <> 'revocada'
      and case l.estado_manual
            when 'forzar_activa' then true
            when 'forzar_suspendida' then false
            else l.estado = 'activa' and (l.caduca_en is null or l.caduca_en > pg_catalog.now())
          end,
      false)                          as licencia_vigente,
    coalesce(o.tipo = 'pausar', false) as en_pausa,
    u.recibido_en                     as ultimo_informe_en,
    u.estado                          as ultimo_estado,
    u.version_prompt                  as ultima_version,
    coalesce(m.revisiones, 0)         as revisiones_30d,
    coalesce(m.tratados, 0)           as tratados_30d,
    coalesce(m.borradores, 0)         as borradores_30d,
    coalesce(m.documentos, 0)         as documentos_30d,
    s.estado                          as estado_suscripcion
  from public.clientes c
  left join public.licencias l
         on l.cliente_id = c.id and l.estado <> 'revocada'
  left join public.suscripciones s
         on s.cliente_id = c.id
  left join lateral (
    select o2.tipo
      from public.ordenes o2
     where o2.cliente_id = c.id and o2.estado <> 'anulada'
     order by o2.creada_en desc, o2.id
     limit 1
  ) o on true
  left join lateral (
    select i.recibido_en, i.estado, i.version_prompt
      from public.informes i
     where i.cliente_id = c.id
     order by i.recibido_en desc
     limit 1
  ) u on true
  left join lateral (
    select pg_catalog.count(*)        as revisiones,
           pg_catalog.sum(i.tratados)   as tratados,
           pg_catalog.sum(i.borradores) as borradores,
           pg_catalog.sum(i.documentos) as documentos
      from public.informes i
     where i.cliente_id = c.id
       and i.recibido_en > pg_catalog.now() - interval '30 days'
  ) m on true;

  -- Cifras por versión del prompt, solo de los informes que quien consulta ve.
  create view public.metricas_version
  with (security_invoker = true)
  as
  select
    i.version_prompt,
    pg_catalog.count(*)                                    as revisiones,
    pg_catalog.count(*) filter (where i.estado = 'ok')     as correctas,
    pg_catalog.count(*) filter (where i.estado = 'aviso')  as con_aviso,
    pg_catalog.count(*) filter (where i.estado = 'error')  as con_error,
    pg_catalog.sum(i.tratados)                             as tratados,
    pg_catalog.sum(i.sin_tratar)                           as sin_tratar,
    pg_catalog.sum(i.borradores)                           as borradores,
    pg_catalog.sum(i.facturas_pendientes)                  as facturas_pendientes,
    pg_catalog.count(distinct i.cliente_id)                as clientes
  from public.informes i
  group by i.version_prompt;

  -- -------------------------------------------------------------------
  -- Permisos (D-2, 1): primero nada; después, solo lectura para authenticated.
  -- -------------------------------------------------------------------
  revoke all on table public.resumen_cliente, public.metricas_version
    from public, anon, authenticated, service_role, conector;

  -- Otros destinatarios (de otro rol o por permisos por defecto): se retiran; si
  -- queda algo ajeno, falla todo (comprobación al final).
  for v_fila in
    select distinct n.nspname as esquema, c.relname as objeto, r.rolname as destino
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      cross join lateral pg_catalog.aclexplode(c.relacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'public'
       and c.relname in ('resumen_cliente', 'metricas_version')
       and a.grantee <> c.relowner
  loop
    -- Sin nombre de rol (grantee = 0) es PUBLIC. Solo marcadores %I (D-11, regla 5).
    if v_fila.destino is null then
      execute pg_catalog.format('revoke all on table %I.%I from public', v_fila.esquema, v_fila.objeto);
    else
      execute pg_catalog.format('revoke all on table %I.%I from %I',
        v_fila.esquema, v_fila.objeto, v_fila.destino);
    end if;
  end loop;

  grant select on public.resumen_cliente, public.metricas_version to authenticated;

  -- -------------------------------------------------------------------
  -- Comprobación (N-4): solo el dueño y select para authenticated, sin opción de
  -- concesión y sin permisos por columna.
  -- -------------------------------------------------------------------
  if exists (
       select 1
         from pg_catalog.pg_class c
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
         cross join lateral pg_catalog.aclexplode(c.relacl) a
        where n.nspname = 'public'
          and c.relname in ('resumen_cliente', 'metricas_version')
          and (a.grantor <> c.relowner
               or (a.grantee <> c.relowner
                   and not (a.grantee = 'authenticated'::pg_catalog.regrole::pg_catalog.oid
                            and a.privilege_type = 'SELECT'
                            and not a.is_grantable))))
     or exists (
       select 1
         from pg_catalog.pg_attribute t
         join pg_catalog.pg_class c on c.oid = t.attrelid
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in ('resumen_cliente', 'metricas_version')
          and t.attacl is not null)
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
