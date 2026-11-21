do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M07 · reglas_de_acceso (función 010, diseño D-1, D-2 (4, 9 a 12, 17), D-3,
-- D-5 y D-6; §4, §7 y §8 de docs/MODELO-DATOS.sql)
--
-- Da acceso a las tablas de M02 a M06 con las dos únicas funciones de
-- apoyo de la API, las políticas de filas y los permisos por columna, y fija
-- por disparador la autoría y los valores que no debe escribir quien llama.
--
--   - privado.es_admin(): superadmin = figura en administradores y su sesión
--     trae la claim aal exactamente 'aal2'. Ausente, numérica, en mayúsculas o de
--     otro tipo, da falso (REQ-006, REQ-040). Se evalúa en cada consulta: retirar
--     la fila de administradores quita el acceso en la siguiente (REQ-034).
--   - privado.clientes_del_usuario(): los clientes ACTIVOS a los que está
--     vinculado el usuario de la sesión (REQ-064). Solo devuelve datos del propio
--     usuario (REQ-010).
--     Son las dos únicas funciones con execute para authenticated; privado gana
--     usage solo para él.
--   - Políticas (D-5): superadmin con es_admin(), una por operación concedida;
--     usuario de cliente solo lectura con clientes_del_usuario(); sin políticas
--     _propio en administradores ni usuarios_cliente (REQ-057, CA-035). Ninguna
--     for all. Las tablas internas siguen sin políticas ni permisos (REQ-008).
--   - Permisos (D-5), tras revoke all explícito: por columna donde D-5 lo dice;
--     service_role solo en versiones_prompt (P1-d). Nadie recibe delete salvo
--     usuarios_cliente (REQ-062, REQ-063).
--   - Autoría (D-2, 4): creado_por, creada_por, publicada_por y resuelta_por no
--     se conceden; un disparador BEFORE las fija a la sesión y ningún rol las cambia
--     después (REQ-019, REQ-047).
--   - Valores fijados (D-2, 17): actualizado_en; ordenes.anulada_en y las
--     transiciones de authenticated; conexiones.revocada_en y alertas.resuelta_en,
--     solo de nulo a now(), y nunca hacia atrás con ningún rol.
--   - Baja (D-3; REQ-059, REQ-064): privado.al_dar_de_baja() revoca en la misma
--     sentencia las conexiones no revocadas del cliente y escribe una fila
--     revocar_por_baja por conexión con privado.registrar_auditoria() (regla N-2).
--     De baja a activo se rechaza en la fase 2 (P1-c).
--
-- Tipos enumerados (pendiente anotado en el relevo): el privilegio USAGE de un
-- tipo no controla que sus valores aparezcan en consultas, solo crear objetos
-- con él (PostgreSQL, «GRANT»). authenticated y service_role escriben sus
-- columnas enumeradas sin USAGE en el tipo (lo comprueba la prueba «los tipos» de
-- m07.test.ts), así que M07 no concede ninguno: lo contrario sería un permiso
-- fuera de D-5 (N-4). Si una migración posterior crea objetos con esos tipos
-- para un rol (funciones del conector, M08), concederá allí el USAGE que
-- necesite.
--
-- Regla N-2 (D-3): al_dar_de_baja() llama a registrar_auditoria(). Las funciones
-- de disparador de valores y de autoría no escriben en ninguna tabla auditada y
-- son de quien llama (sin security definer).
-- Regla N-3: todo nombre fuera de pg_catalog va calificado.
--
-- Su reversión no es protegida y pasa L 10 (N-7): no nombra auditoria,
-- versiones_prompt ni publicaciones. Las políticas y el disparador de esas tablas
-- salen con las funciones de las que dependen (ver la reversión).
--
-- Forma de D-1 (L 11, L 13 y L 14), como M01 a M06.
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_fila pg_catalog.record;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  -- -------------------------------------------------------------------
  -- Funciones de apoyo de las políticas (las dos únicas con execute para
  -- authenticated). security definer: quien consulta no lee administradores ni
  -- usuarios_cliente directamente.
  -- -------------------------------------------------------------------
  create function privado.es_admin()
  returns pg_catalog.bool
  language sql
  stable
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
    select coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2'
       and exists (
         select 1
           from public.administradores a
          where a.usuario_id = (select auth.uid())
       );
  $f$;

  create function privado.clientes_del_usuario()
  returns setof pg_catalog.uuid
  language sql
  stable
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
    select uc.cliente_id
      from public.usuarios_cliente uc
      join public.clientes c on c.id = uc.cliente_id
     where uc.usuario_id = (select auth.uid())
       and c.estado = 'activo';
  $f$;

  -- -------------------------------------------------------------------
  -- Disparadores de autoría y de valores fijados (de quien llama, sin
  -- security definer; SQL estático, D-11)
  -- -------------------------------------------------------------------

  -- El autor es la sesión y no se cambia después (REQ-019, REQ-047).
  create function privado.fijar_autoria()
  returns pg_catalog.trigger
  language plpgsql
  set search_path = pg_catalog, pg_temp
  as $f$
  begin
    if tg_table_schema operator(pg_catalog.<>) 'public' then
      raise exception 'autoria_tabla_no_prevista';
    end if;
    if tg_table_name = 'codigos_activacion' then
      if tg_op = 'INSERT' then
        new.creado_por := auth.uid();
      else
        new.creado_por := old.creado_por;
      end if;
    elsif tg_table_name = 'ordenes' then
      if tg_op = 'INSERT' then
        new.creada_por := auth.uid();
      else
        new.creada_por := old.creada_por;
      end if;
    elsif tg_table_name = 'publicaciones' then
      if tg_op = 'INSERT' then
        new.publicada_por := auth.uid();
      else
        new.publicada_por := old.publicada_por;
      end if;
    else
      raise exception 'autoria_tabla_no_prevista';
    end if;
    return new;
  end;
  $f$;

  -- Valores que fija la base y no el que escribe (D-2, 17).
  create function privado.fijar_valores()
  returns pg_catalog.trigger
  language plpgsql
  set search_path = pg_catalog, pg_temp
  as $f$
  begin
    if tg_table_schema operator(pg_catalog.<>) 'public' then
      raise exception 'valores_tabla_no_prevista';
    end if;
    if tg_table_name = 'reglas_cliente' or tg_table_name = 'ajustes_globales' then
      new.actualizado_en := pg_catalog.now();
    elsif tg_table_name = 'ordenes' then
      -- Quien no es el dueño (authenticated) solo anula una orden pendiente o entregada.
      -- Las transiciones de las funciones del conector (del dueño) no se restringen.
      if new.estado is distinct from old.estado
         and current_user operator(pg_catalog.<>) 'postgres' then
        if not (new.estado::pg_catalog.text = 'anulada'
                and old.estado::pg_catalog.text in ('pendiente', 'entregada')) then
          raise exception 'orden_transicion_no_permitida';
        end if;
      end if;
      if new.estado::pg_catalog.text = 'anulada'
         and old.estado::pg_catalog.text operator(pg_catalog.<>) 'anulada' then
        new.anulada_en := pg_catalog.now();
      else
        new.anulada_en := old.anulada_en;
      end if;
    elsif tg_table_name = 'conexiones' then
      if old.revocada_en is null then
        if new.revocada_en is not null then
          new.revocada_en := pg_catalog.now();
        end if;
      elsif new.revocada_en is distinct from old.revocada_en then
        raise exception 'revocacion_no_reversible';
      end if;
    elsif tg_table_name = 'alertas' then
      if old.resuelta_en is null then
        if new.resuelta_en is not null then
          new.resuelta_en := pg_catalog.now();
          new.resuelta_por := auth.uid();
        else
          new.resuelta_por := null;
        end if;
      elsif new.resuelta_en is distinct from old.resuelta_en
            or new.resuelta_por is distinct from old.resuelta_por then
        raise exception 'resolucion_no_reversible';
      end if;
    else
      raise exception 'valores_tabla_no_prevista';
    end if;
    return new;
  end;
  $f$;

  -- De baja a activo no se vuelve en la fase 2 (P1-c).
  create function privado.impedir_reactivar_cliente()
  returns pg_catalog.trigger
  language plpgsql
  set search_path = pg_catalog, pg_temp
  as $f$
  begin
    if old.estado::pg_catalog.text = 'baja' and new.estado::pg_catalog.text = 'activo' then
      raise exception 'cliente_baja_irreversible';
    end if;
    return new;
  end;
  $f$;

  -- Baja de un cliente (REQ-059): revoca sus conexiones y lo deja anotado. Un
  -- error deshace la sentencia entera: el cliente no queda de baja (CA-036).
  create function privado.al_dar_de_baja()
  returns pg_catalog.trigger
  language plpgsql
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
  declare
    v_conexion pg_catalog.uuid;
  begin
    for v_conexion in
      select c.id
        from public.conexiones c
        join public.licencias l on l.id = c.licencia_id
       where l.cliente_id = new.id and c.revocada_en is null
       order by c.id
         for update of c
    loop
      update public.conexiones set revocada_en = pg_catalog.now() where id = v_conexion;
      perform privado.registrar_auditoria(
        'revocar_por_baja', 'conexiones', v_conexion::pg_catalog.text, new.id);
    end loop;
    return null;
  end;
  $f$;

  revoke all on function
    privado.es_admin(), privado.clientes_del_usuario(), privado.fijar_autoria(),
    privado.fijar_valores(), privado.impedir_reactivar_cliente(), privado.al_dar_de_baja()
    from public, anon, authenticated, service_role, conector;
  -- En una función, all es solo el privilegio de ejecución. Se escribe así porque
  -- el detector de L 14 (D-11, regla 5) rechaza la palabra de ese privilegio
  -- fuera de «execute function» y de «execute pg_catalog.format». Se deja así a
  -- propósito (revisor, T-005, menor 6): equivale a execute y es la forma que admite L 14.
  grant all on function privado.es_admin(), privado.clientes_del_usuario() to authenticated;
  grant usage on schema privado to authenticated;

  -- -------------------------------------------------------------------
  -- Disparadores
  -- -------------------------------------------------------------------
  create trigger codigos_activacion_autoria
    before insert or update on public.codigos_activacion
    for each row execute function privado.fijar_autoria();
  create trigger ordenes_autoria
    before insert or update on public.ordenes
    for each row execute function privado.fijar_autoria();
  create trigger publicaciones_autoria
    before insert on public.publicaciones
    for each row execute function privado.fijar_autoria();

  create trigger reglas_cliente_valores
    before insert or update on public.reglas_cliente
    for each row execute function privado.fijar_valores();
  create trigger ajustes_globales_valores
    before update on public.ajustes_globales
    for each row execute function privado.fijar_valores();
  create trigger ordenes_valores
    before update on public.ordenes
    for each row execute function privado.fijar_valores();
  create trigger conexiones_valores
    before update on public.conexiones
    for each row execute function privado.fijar_valores();
  create trigger alertas_valores
    before update on public.alertas
    for each row execute function privado.fijar_valores();

  create trigger clientes_no_reactivar
    before update of estado on public.clientes
    for each row execute function privado.impedir_reactivar_cliente();
  create trigger clientes_al_dar_de_baja
    after update of estado on public.clientes
    for each row when (old.estado = 'activo' and new.estado = 'baja')
    execute function privado.al_dar_de_baja();

  -- -------------------------------------------------------------------
  -- Permisos (D-5): primero nada, también por columna; después, lo de la tabla.
  -- -------------------------------------------------------------------
  revoke all on table
    public.clientes, public.administradores, public.usuarios_cliente, public.licencias,
    public.codigos_activacion, public.conexiones, public.versiones_prompt,
    public.publicaciones, public.reglas_cliente, public.ordenes, public.ajustes_globales,
    public.catalogo_problemas, public.alertas, public.ejecuciones, public.informes,
    public.suscripciones, public.auditoria
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
       and c.relname in ('clientes', 'administradores', 'usuarios_cliente', 'licencias',
                         'codigos_activacion', 'conexiones', 'versiones_prompt', 'publicaciones',
                         'reglas_cliente', 'ordenes', 'ajustes_globales', 'catalogo_problemas',
                         'alertas', 'ejecuciones', 'informes', 'suscripciones', 'auditoria')
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

  grant select on public.clientes to authenticated;
  grant insert (nombre, canal, frecuencia_esperada_horas) on public.clientes to authenticated;
  grant update (nombre, canal, frecuencia_esperada_horas, estado) on public.clientes to authenticated;

  grant select on public.administradores to authenticated;

  grant select on public.usuarios_cliente to authenticated;
  grant insert (usuario_id, cliente_id) on public.usuarios_cliente to authenticated;
  grant delete on public.usuarios_cliente to authenticated;

  grant select on public.licencias to authenticated;
  grant insert (cliente_id, estado_manual, caduca_en) on public.licencias to authenticated;
  grant update (estado, estado_manual, caduca_en) on public.licencias to authenticated;

  -- Todas las columnas menos codigo_hmac.
  grant select (id, licencia_id, caduca_en, usado_en, creado_por, creado_en)
    on public.codigos_activacion to authenticated;
  grant insert (licencia_id, codigo_hmac, caduca_en) on public.codigos_activacion to authenticated;

  grant select on public.conexiones to authenticated;
  grant update (revocada_en) on public.conexiones to authenticated;

  grant select on public.versiones_prompt to authenticated;
  grant select on public.versiones_prompt to service_role;
  grant insert (version, contenido, huella_sha256, commit_sha, notas)
    on public.versiones_prompt to service_role;

  grant select on public.publicaciones to authenticated;
  grant insert (canal, version_id, motivo) on public.publicaciones to authenticated;

  grant select on public.reglas_cliente to authenticated;
  grant insert (cliente_id, max_correos_por_revision, ventana_dias, guardar_adjuntos,
                preparar_borradores, descargar_facturas_por_enlace)
    on public.reglas_cliente to authenticated;
  grant update (max_correos_por_revision, ventana_dias, guardar_adjuntos,
                preparar_borradores, descargar_facturas_por_enlace)
    on public.reglas_cliente to authenticated;

  grant select on public.ordenes to authenticated;
  grant insert (cliente_id, tipo) on public.ordenes to authenticated;
  grant update (estado) on public.ordenes to authenticated;

  grant select on public.ajustes_globales to authenticated;
  grant update (pausa_global, stripe_en_observacion) on public.ajustes_globales to authenticated;

  grant select on public.catalogo_problemas to authenticated;
  grant insert (codigo, descripcion, activo) on public.catalogo_problemas to authenticated;
  grant update (descripcion, activo) on public.catalogo_problemas to authenticated;

  grant select on public.alertas to authenticated;
  grant update (resuelta_en) on public.alertas to authenticated;

  grant select on public.ejecuciones to authenticated;
  grant select on public.informes to authenticated;
  grant select on public.suscripciones to authenticated;
  grant select on public.auditoria to authenticated;

  -- -------------------------------------------------------------------
  -- Políticas: una por operación concedida, nunca for all. El permiso limita la
  -- operación; la política, las filas. Superadmin: es_admin(). Usuario de
  -- cliente: solo lectura de lo suyo (REQ-057).
  -- -------------------------------------------------------------------
  create policy clientes_select_admin on public.clientes
    for select to authenticated using ((select privado.es_admin()));
  create policy clientes_insert_admin on public.clientes
    for insert to authenticated with check ((select privado.es_admin()));
  create policy clientes_update_admin on public.clientes
    for update to authenticated
    using ((select privado.es_admin())) with check ((select privado.es_admin()));
  create policy clientes_select_usuario on public.clientes
    for select to authenticated using (id in (select privado.clientes_del_usuario()));

  create policy administradores_select_admin on public.administradores
    for select to authenticated using ((select privado.es_admin()));

  create policy usuarios_cliente_select_admin on public.usuarios_cliente
    for select to authenticated using ((select privado.es_admin()));
  create policy usuarios_cliente_insert_admin on public.usuarios_cliente
    for insert to authenticated with check ((select privado.es_admin()));
  create policy usuarios_cliente_delete_admin on public.usuarios_cliente
    for delete to authenticated using ((select privado.es_admin()));

  create policy licencias_select_admin on public.licencias
    for select to authenticated using ((select privado.es_admin()));
  create policy licencias_insert_admin on public.licencias
    for insert to authenticated with check ((select privado.es_admin()));
  create policy licencias_update_admin on public.licencias
    for update to authenticated
    using ((select privado.es_admin())) with check ((select privado.es_admin()));
  create policy licencias_select_usuario on public.licencias
    for select to authenticated using (cliente_id in (select privado.clientes_del_usuario()));

  create policy codigos_activacion_select_admin on public.codigos_activacion
    for select to authenticated using ((select privado.es_admin()));
  create policy codigos_activacion_insert_admin on public.codigos_activacion
    for insert to authenticated with check ((select privado.es_admin()));

  create policy conexiones_select_admin on public.conexiones
    for select to authenticated using ((select privado.es_admin()));
  create policy conexiones_update_admin on public.conexiones
    for update to authenticated
    using ((select privado.es_admin())) with check ((select privado.es_admin()));

  create policy versiones_prompt_select_admin on public.versiones_prompt
    for select to authenticated using ((select privado.es_admin()));

  create policy publicaciones_select_admin on public.publicaciones
    for select to authenticated using ((select privado.es_admin()));
  create policy publicaciones_insert_admin on public.publicaciones
    for insert to authenticated with check ((select privado.es_admin()));

  create policy reglas_cliente_select_admin on public.reglas_cliente
    for select to authenticated using ((select privado.es_admin()));
  create policy reglas_cliente_insert_admin on public.reglas_cliente
    for insert to authenticated with check ((select privado.es_admin()));
  create policy reglas_cliente_update_admin on public.reglas_cliente
    for update to authenticated
    using ((select privado.es_admin())) with check ((select privado.es_admin()));

  create policy ordenes_select_admin on public.ordenes
    for select to authenticated using ((select privado.es_admin()));
  create policy ordenes_insert_admin on public.ordenes
    for insert to authenticated with check ((select privado.es_admin()));
  create policy ordenes_update_admin on public.ordenes
    for update to authenticated
    using ((select privado.es_admin())) with check ((select privado.es_admin()));
  create policy ordenes_select_usuario on public.ordenes
    for select to authenticated using (cliente_id in (select privado.clientes_del_usuario()));

  create policy ajustes_globales_select_admin on public.ajustes_globales
    for select to authenticated using ((select privado.es_admin()));
  create policy ajustes_globales_update_admin on public.ajustes_globales
    for update to authenticated
    using ((select privado.es_admin())) with check ((select privado.es_admin()));

  create policy catalogo_problemas_select_admin on public.catalogo_problemas
    for select to authenticated using ((select privado.es_admin()));
  create policy catalogo_problemas_insert_admin on public.catalogo_problemas
    for insert to authenticated with check ((select privado.es_admin()));
  create policy catalogo_problemas_update_admin on public.catalogo_problemas
    for update to authenticated
    using ((select privado.es_admin())) with check ((select privado.es_admin()));
  create policy catalogo_problemas_select_usuario on public.catalogo_problemas
    for select to authenticated using (exists (select 1 from privado.clientes_del_usuario()));

  create policy alertas_select_admin on public.alertas
    for select to authenticated using ((select privado.es_admin()));
  create policy alertas_update_admin on public.alertas
    for update to authenticated
    using ((select privado.es_admin())) with check ((select privado.es_admin()));

  create policy ejecuciones_select_admin on public.ejecuciones
    for select to authenticated using ((select privado.es_admin()));
  create policy ejecuciones_select_usuario on public.ejecuciones
    for select to authenticated using (cliente_id in (select privado.clientes_del_usuario()));

  create policy informes_select_admin on public.informes
    for select to authenticated using ((select privado.es_admin()));
  create policy informes_select_usuario on public.informes
    for select to authenticated using (cliente_id in (select privado.clientes_del_usuario()));

  create policy suscripciones_select_admin on public.suscripciones
    for select to authenticated using ((select privado.es_admin()));
  create policy suscripciones_select_usuario on public.suscripciones
    for select to authenticated using (cliente_id in (select privado.clientes_del_usuario()));

  create policy auditoria_select_admin on public.auditoria
    for select to authenticated using ((select privado.es_admin()));

  -- -------------------------------------------------------------------
  -- Comprobación: nada ajeno a D-5. Un revoke que no retira lo que otro
  -- concedente dio no da error: si queda algo, falla todo.
  -- -------------------------------------------------------------------
  if exists (
       select 1
         from pg_catalog.pg_class c
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
         cross join lateral pg_catalog.aclexplode(c.relacl) a
        where n.nspname = 'public'
          and c.relname in ('clientes', 'administradores', 'usuarios_cliente', 'licencias',
                            'codigos_activacion', 'conexiones', 'versiones_prompt', 'publicaciones',
                            'reglas_cliente', 'ordenes', 'ajustes_globales', 'catalogo_problemas',
                            'alertas', 'ejecuciones', 'informes', 'suscripciones', 'auditoria')
          and (a.grantor <> c.relowner
               or (a.grantee <> c.relowner
                   and a.grantee <> 'authenticated'::pg_catalog.regrole::pg_catalog.oid
                   and not (a.grantee = 'service_role'::pg_catalog.regrole::pg_catalog.oid
                            and c.relname = 'versiones_prompt'))))
     or exists (
       select 1
         from pg_catalog.pg_attribute t
         join pg_catalog.pg_class c on c.oid = t.attrelid
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
         cross join lateral pg_catalog.aclexplode(t.attacl) a
        where n.nspname = 'public'
          and c.relname in ('clientes', 'administradores', 'usuarios_cliente', 'licencias',
                            'codigos_activacion', 'conexiones', 'versiones_prompt', 'publicaciones',
                            'reglas_cliente', 'ordenes', 'ajustes_globales', 'catalogo_problemas',
                            'alertas', 'ejecuciones', 'informes', 'suscripciones', 'auditoria')
          and (a.grantor <> c.relowner
               or (a.grantee <> 'authenticated'::pg_catalog.regrole::pg_catalog.oid
                   and not (a.grantee = 'service_role'::pg_catalog.regrole::pg_catalog.oid
                            and c.relname = 'versiones_prompt'))))
     or exists (
       select 1
         from pg_catalog.pg_proc p
         join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'privado'
          and p.proname in ('es_admin', 'clientes_del_usuario', 'fijar_autoria', 'fijar_valores',
                            'impedir_reactivar_cliente', 'al_dar_de_baja')
          and (p.proacl is null
               or exists (select 1 from pg_catalog.aclexplode(p.proacl) a
                           where a.grantor <> p.proowner
                              or (a.grantee <> p.proowner
                                  and not (a.grantee = 'authenticated'::pg_catalog.regrole::pg_catalog.oid
                                           and p.proname in ('es_admin', 'clientes_del_usuario'))))))
     or exists (
       -- El esquema privado: solo el dueño y usage (sin opción de concesión) para
       -- authenticated. PUBLIC aparece con grantee 0 y no es el dueño: falla. M07 no
       -- retira nada aquí, solo lo comprueba (M01 lo dejó sin nada ajeno).
       select 1
         from pg_catalog.pg_namespace s
         cross join lateral pg_catalog.aclexplode(s.nspacl) a
        where s.nspname = 'privado'
          and (a.grantor <> s.nspowner
               or (a.grantee <> s.nspowner
                   and not (a.grantee = 'authenticated'::pg_catalog.regrole::pg_catalog.oid
                            and a.privilege_type = 'USAGE'
                            and not a.is_grantable))))
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
