-- =====================================================================
-- Alta y baja de administradores (REQ-060, REQ-063; CA-037; función 010, T-007).
--
-- Solo lo hace una persona con acceso privilegiado (rol postgres), fuera de la API.
-- Ningún perfil de la API, ni el superadmin con doble factor, puede hacerlo.
-- Guía de uso y precauciones: docs/operacion/administradores.md.
--
--   Alta:  psql -v ON_ERROR_STOP=1 -v accion=alta -v usuario=<uuid del usuario de auth.users> \
--               -f supabase/procedimientos/administradores.sql
--   Baja:  igual, con -v accion=baja
--
-- No lleva ningún valor secreto ni contraseñas. Las dos únicas interpolaciones de psql son
-- las de la sentencia set_config de abajo; el resto es SQL estándar (así lo ejecuta también
-- la prueba en PGlite). Si falta una variable, psql deja el texto sin sustituir y la
-- sentencia falla: cierra en fallo.
--
-- Una sola transacción. Cada cambio deja exactamente una fila de auditoría, que escribe
-- el disparador de la tabla (no este archivo); el procedimiento lo comprueba y, si no
-- es así, lo deshace todo. Ante cualquier fallo no cambia nada.
--
-- Salvaguardas: la acción es «alta» o «baja»; el usuario es un uuid que existe en
-- auth.users (clave ajena); no se da de baja a quien no es administrador ni al último.
-- =====================================================================
begin;

select pg_catalog.set_config('procedimiento.accion', :'accion', true),
       pg_catalog.set_config('procedimiento.usuario', :'usuario', true);

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_accion pg_catalog.text;
  v_usuario pg_catalog.uuid;
  v_antes pg_catalog.int8;
  v_filas pg_catalog.int4;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then
    raise exception 'procedimiento_rol_no_permitido';
  end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  v_accion := pg_catalog.current_setting('procedimiento.accion', true);
  if v_accion is null or v_accion operator(pg_catalog.<>) all (array['alta', 'baja']) then
    raise exception 'procedimiento_accion_desconocida';
  end if;
  v_usuario := nullif(pg_catalog.current_setting('procedimiento.usuario', true), '')::pg_catalog.uuid;
  if v_usuario is null then
    raise exception 'procedimiento_usuario_invalido';
  end if;

  -- Filas de auditoría de este tipo de cambio sobre este usuario, antes del cambio.
  select pg_catalog.count(*) into v_antes
    from public.auditoria a
   where a.objeto_tipo operator(pg_catalog.=) 'administradores'
     and a.objeto_id operator(pg_catalog.=) v_usuario::pg_catalog.text
     and a.accion operator(pg_catalog.=) case when v_accion operator(pg_catalog.=) 'alta' then 'insert' else 'delete' end;

  if v_accion operator(pg_catalog.=) 'alta' then
    insert into public.administradores (usuario_id) values (v_usuario);
  else
    -- Bloquea la tabla antes de contar: dos bajas simultáneas no pueden dejarla sin
    -- administradores (la segunda espera y vuelve a contar). Lo permite el dueño.
    lock table public.administradores in share row exclusive mode;
    if not exists (select 1 from public.administradores where usuario_id operator(pg_catalog.=) v_usuario) then
      raise exception 'procedimiento_administrador_inexistente';
    end if;
    if (select pg_catalog.count(*) from public.administradores) operator(pg_catalog.<=) 1 then
      raise exception 'procedimiento_ultimo_administrador';
    end if;
    delete from public.administradores where usuario_id operator(pg_catalog.=) v_usuario;
    get diagnostics v_filas = row_count;
    if v_filas operator(pg_catalog.<>) 1 then
      raise exception 'procedimiento_baja_incompleta';
    end if;
  end if;

  if (select pg_catalog.count(*)
        from public.auditoria a
       where a.objeto_tipo operator(pg_catalog.=) 'administradores'
         and a.objeto_id operator(pg_catalog.=) v_usuario::pg_catalog.text
         and a.accion operator(pg_catalog.=) case when v_accion operator(pg_catalog.=) 'alta' then 'insert' else 'delete' end)
     operator(pg_catalog.<>) v_antes + 1 then
    raise exception 'procedimiento_auditoria_no_registrada';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;

commit;
