do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M08 · funciones_conector (función 010, diseño D-1, D-2 (10), D-3 y D-9; §5 de
-- docs/MODELO-DATOS.sql)
--
-- Las cinco funciones que usa el conector, todas security definer en el
-- esquema privado:
--
--   - privado.licencia_vigente(p_licencia_id): interna. Una licencia no
--     existente no es vigente (cierra en fallo). Sin execute para nadie.
--   - privado.resolver_token(p_token_hmac): interna. Resuelve un token de acceso
--     vigente a (conexión, licencia, cliente) y exige que el CLIENTE esté activo en
--     cada llamada (REQ-064; condición heredada de T-005, MENOR 1 del auditor). Un
--     token revocado, caducado, de renovación o sustituido, una conexión revocada
--     o una licencia revocada no resuelven. Una licencia suspendida sí resuelve,
--     para poder responder «suspendida». Sin execute para nadie.
--   - privado.mcp_obtener_instrucciones(p_token_hmac)
--     privado.mcp_enviar_informe(p_token_hmac, p_ejecucion_id, p_informe)
--     privado.mcp_confirmar_orden(p_token_hmac, p_orden_id)
--     Las tres herramientas del conector. execute solo para conector (D-9) y
--     usage en privado para él. Ninguna recibe un cliente ni una licencia: el
--     cliente sale del token dentro de la base (art. 2). Ninguna lee auth.*: fijar
--     request.jwt.claims no le sirve al conector.
--
-- Errores (N-6): un fallo del motor lleva en su DETAIL los valores de la fila. Las
-- tres funciones lo capturan y devuelven solo un código (informe_invalido,
-- error_interno); nunca el mensaje ni el DETAIL.
--
-- Regla N-2 (D-3): las tres mcp_* son la excepción declarada a «toda security
-- definer que escriba en una tabla auditada llama a registrar_auditoria()»: sin
-- auditoría (REQ-061, CA-038). Como corren con el dueño, los disparadores de
-- auditoría (current_user <> 'postgres') no las ven.
-- Regla N-3: todo nombre fuera de pg_catalog va calificado (public., privado.).
-- Regla N-4: ninguna otra concesión; la comprobación final falla si el conector
-- tiene algo más que las tres mcp_* y usage en privado, o si queda un destinatario
-- ajeno en estas funciones o en el esquema.
--
-- Cuerpos sin declare con tipos fuera de pg_catalog (D-11): los valores de tipos
-- enumerados se guardan como pg_catalog.text y se convierten en la instrucción.
--
-- Cambios respecto a §5 (anotados en «Decisiones de T-006» de diseno.md):
--   1. resolver_token exige clientes.estado = 'activo' y tokens sin sustituir.
--   2. Con estado «suspendida» no se entrega la orden pendiente ni se marca como
--      entregada (contrato de obtener-instrucciones).
--   3. Todo el cuerpo de cada mcp_* va en un bloque con captura de errores.
--
-- Forma de D-1 (L 11, L 13 y L 14), como M01 a M07.
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  -- -------------------------------------------------------------------
  -- licencia_vigente: la licencia no está revocada y el estado manual manda sobre
  -- el automático (activa y sin caducar).
  -- -------------------------------------------------------------------
  create function privado.licencia_vigente(p_licencia_id pg_catalog.uuid)
  returns pg_catalog.bool
  language sql
  stable
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
    select coalesce((
      select l.estado <> 'revocada'
             and case l.estado_manual
                   when 'forzar_activa' then true
                   when 'forzar_suspendida' then false
                   else l.estado = 'activa'
                        and (l.caduca_en is null or l.caduca_en > pg_catalog.now())
                 end
        from public.licencias l
       where l.id = p_licencia_id
    ), false);
  $f$;

  -- -------------------------------------------------------------------
  -- resolver_token: del HMAC del token a la conexión, la licencia y el cliente.
  -- -------------------------------------------------------------------
  create function privado.resolver_token(p_token_hmac pg_catalog.text)
  returns table (
    conexion_id pg_catalog.uuid,
    licencia_id pg_catalog.uuid,
    cliente_id pg_catalog.uuid
  )
  language sql
  stable
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
    select c.id, l.id, l.cliente_id
      from public.tokens t
      join public.conexiones c on c.id = t.conexion_id
      join public.licencias l on l.id = c.licencia_id
      join public.clientes k on k.id = l.cliente_id
     where t.token_hmac = p_token_hmac
       and t.tipo = 'acceso'
       and t.revocado_en is null
       and t.sustituido_por is null
       and t.sustituido_en is null
       and t.caduca_en > pg_catalog.now()
       and c.revocada_en is null
       and l.estado <> 'revocada'
       and k.estado = 'activo';
  $f$;

  -- -------------------------------------------------------------------
  -- mcp_obtener_instrucciones: abre una ejecución y devuelve siempre un estado
  -- explícito (activa, pausada o suspendida). Solo con «activa» entrega el
  -- prompt y las reglas. Cierre en fallo: sin licencia vigente o sin versión no hay
  -- instrucciones.
  -- -------------------------------------------------------------------
  create function privado.mcp_obtener_instrucciones(p_token_hmac pg_catalog.text)
  returns pg_catalog.jsonb
  language plpgsql
  volatile
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
  declare
    v_conexion pg_catalog.uuid;
    v_licencia pg_catalog.uuid;
    v_cliente pg_catalog.uuid;
    v_canal pg_catalog.text;
    v_pausa_global pg_catalog.bool;
    v_orden_id pg_catalog.uuid;
    v_orden_tipo pg_catalog.text;
    v_orden_estado pg_catalog.text;
    v_version_id pg_catalog.uuid;
    v_version pg_catalog.text;
    v_contenido pg_catalog.text;
    v_huella pg_catalog.text;
    v_reglas pg_catalog.jsonb;
    v_estado pg_catalog.text;
    v_ejecucion pg_catalog.uuid;
  begin
    select r.conexion_id, r.licencia_id, r.cliente_id
      into v_conexion, v_licencia, v_cliente
      from privado.resolver_token(p_token_hmac) r;

    if v_conexion is null then
      return pg_catalog.jsonb_build_object('autorizado', false);
    end if;

    begin
      -- Bloqueo compartido del cliente activo: una baja concurrente espera a que
      -- termine esta llamada (REQ-064). Sin fila, no está autorizado.
      perform 1 from public.clientes where id = v_cliente and estado = 'activo' for share;
      if not found then
        return pg_catalog.jsonb_build_object('autorizado', false);
      end if;

      select k.canal::pg_catalog.text
        into v_canal
        from public.clientes k
       where k.id = v_cliente;

      select a.pausa_global into v_pausa_global from public.ajustes_globales a;

      -- Última orden no anulada del cliente.
      select o.id, o.tipo::pg_catalog.text, o.estado::pg_catalog.text
        into v_orden_id, v_orden_tipo, v_orden_estado
        from public.ordenes o
       where o.cliente_id = v_cliente
         and o.estado <> 'anulada'
       order by o.creada_en desc, o.id
       limit 1;

      -- Versión vigente del canal del cliente.
      select v.id, v.version, v.contenido, v.huella_sha256
        into v_version_id, v_version, v_contenido, v_huella
        from public.publicaciones p
        join public.versiones_prompt v on v.id = p.version_id
       where p.canal = v_canal::public.canal
       order by p.id desc
       limit 1;

      -- Si el canal de prueba no tiene nada publicado, sirve el estable.
      if v_version_id is null and v_canal = 'prueba' then
        select v.id, v.version, v.contenido, v.huella_sha256
          into v_version_id, v_version, v_contenido, v_huella
          from public.publicaciones p
          join public.versiones_prompt v on v.id = p.version_id
         where p.canal = 'estable'
         order by p.id desc
         limit 1;
      end if;

      if not privado.licencia_vigente(v_licencia) then
        v_estado := 'suspendida';
      -- Sin fila de ajustes (v_pausa_global nulo) se pausa: cierre en fallo (art. 3).
      elsif coalesce(v_pausa_global, true)
            or coalesce(v_orden_tipo = 'pausar', false)
            or v_version_id is null then
        v_estado := 'pausada';
      else
        v_estado := 'activa';
      end if;

      -- Con la licencia suspendida la orden no se entrega y sigue pendiente.
      if v_estado = 'suspendida' then
        v_orden_id := null;
        v_orden_tipo := null;
        v_orden_estado := null;
      end if;

      select pg_catalog.jsonb_build_object(
               'max_correos_por_revision',      r.max_correos_por_revision,
               'ventana_dias',                  r.ventana_dias,
               'guardar_adjuntos',              r.guardar_adjuntos,
               'preparar_borradores',           r.preparar_borradores,
               'descargar_facturas_por_enlace', r.descargar_facturas_por_enlace)
        into v_reglas
        from public.reglas_cliente r
       where r.cliente_id = v_cliente;

      if v_reglas is null then
        v_reglas := pg_catalog.jsonb_build_object(
          'max_correos_por_revision', 30,
          'ventana_dias', 3,
          'guardar_adjuntos', true,
          'preparar_borradores', true,
          'descargar_facturas_por_enlace', true);
      end if;

      insert into public.ejecuciones (conexion_id, cliente_id, version_id, estado_servido)
      values (v_conexion, v_cliente,
              case when v_estado = 'activa' then v_version_id end,
              v_estado::public.estado_servido)
      returning id into v_ejecucion;

      update public.conexiones set ultimo_uso_en = pg_catalog.now() where id = v_conexion;

      -- La orden se marca solo si sigue pendiente: una anulada entre la lectura y
      -- este punto (READ COMMITTED) no cambia de estado. Después se vuelve a leer y
      -- una orden anulada nunca se devuelve.
      if v_orden_id is not null and v_orden_estado = 'pendiente' then
        update public.ordenes
           set estado = 'entregada', entregada_en = pg_catalog.now()
         where id = v_orden_id
           and cliente_id = v_cliente
           and estado = 'pendiente';
      end if;

      if v_orden_id is not null then
        v_orden_estado := null;
        select o.estado::pg_catalog.text
          into v_orden_estado
          from public.ordenes o
         where o.id = v_orden_id
           and o.cliente_id = v_cliente
           and o.estado <> 'anulada';

        if v_orden_estado is null then
          v_orden_id := null;
          v_orden_tipo := null;
        end if;
      end if;

      return pg_catalog.jsonb_build_object(
        'autorizado',    true,
        'estado',        v_estado,
        'ejecucion_id',  v_ejecucion,
        'orden',         case
                           when v_orden_id is not null
                                and v_orden_estado in ('pendiente', 'entregada')
                           then pg_catalog.jsonb_build_object('id', v_orden_id, 'tipo', v_orden_tipo)
                         end,
        'instrucciones', case
                           when v_estado = 'activa'
                           then pg_catalog.jsonb_build_object(
                                  'version',       v_version,
                                  'huella_sha256', v_huella,
                                  'prompt',        v_contenido,
                                  'reglas',        v_reglas)
                         end
      );
    exception
      -- N-6: ni el mensaje ni el DETAIL del motor salen de la función; se deshace
      -- todo lo escrito en este bloque (no queda ejecución a medias).
      when others then
        return pg_catalog.jsonb_build_object('autorizado', true, 'motivo', 'error_interno');
    end;
  end;
  $f$;

  -- -------------------------------------------------------------------
  -- mcp_enviar_informe: valida y guarda el informe de una ejecución de ESTA
  -- conexión y la cierra. Los campos ajenos se cuentan y no se guardan (ni nombres
  -- ni valores); los problemas solo si están en el catálogo.
  -- -------------------------------------------------------------------
  create function privado.mcp_enviar_informe(
    p_token_hmac pg_catalog.text,
    p_ejecucion_id pg_catalog.uuid,
    p_informe pg_catalog.jsonb
  )
  returns pg_catalog.jsonb
  language plpgsql
  volatile
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
  declare
    v_claves pg_catalog._text;
    v_claves_comp pg_catalog._text;
    v_conexion pg_catalog.uuid;
    v_cliente pg_catalog.uuid;
    v_comp pg_catalog.jsonb;
    v_problemas pg_catalog._text;
    v_descartados pg_catalog.int4;
    v_filas pg_catalog.int4;
  begin
    select r.conexion_id, r.cliente_id
      into v_conexion, v_cliente
      from privado.resolver_token(p_token_hmac) r;

    if v_conexion is null then
      return pg_catalog.jsonb_build_object('autorizado', false);
    end if;

    begin
      -- Bloqueo compartido del cliente activo: una baja concurrente espera a que
      -- termine esta llamada (REQ-064). Sin fila, no está autorizado.
      perform 1 from public.clientes where id = v_cliente and estado = 'activo' for share;
      if not found then
        return pg_catalog.jsonb_build_object('autorizado', false);
      end if;

      v_claves := array[
        'estado', 'modo', 'asistente', 'almacenamiento', 'version_prompt',
        'frecuencia_horas', 'tratados', 'sin_tratar', 'borradores', 'documentos',
        'facturas_pendientes', 'urgentes', 'comprobaciones', 'problemas']::pg_catalog.text[];
      v_claves_comp := array['correo', 'almacenamiento', 'contexto', 'registro']::pg_catalog.text[];

      -- La ejecución tiene que ser de esta misma conexión.
      if not exists (
        select 1 from public.ejecuciones e
         where e.id = p_ejecucion_id and e.conexion_id = v_conexion
      ) then
        return pg_catalog.jsonb_build_object('autorizado', true, 'guardado', false,
                                             'motivo', 'ejecucion_desconocida');
      end if;

      if pg_catalog.jsonb_typeof(p_informe) is distinct from 'object' then
        return pg_catalog.jsonb_build_object('autorizado', true, 'guardado', false,
                                             'motivo', 'informe_invalido');
      end if;

      v_comp := case when pg_catalog.jsonb_typeof(p_informe -> 'comprobaciones') = 'object'
                     then p_informe -> 'comprobaciones' else '{}'::pg_catalog.jsonb end;

      -- Se cuentan los campos ajenos. No se guardan ni sus nombres ni sus valores.
      select (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(p_informe) as k(clave)
               where k.clave <> all (v_claves))
           + (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(v_comp) as k(clave)
               where k.clave <> all (v_claves_comp))
        into v_descartados;

      -- Solo códigos del catálogo, sin repetir, cinco como mucho.
      select coalesce(pg_catalog.array_agg(s.codigo), '{}'::pg_catalog.text[])
        into v_problemas
        from (
          select distinct e.codigo
            from pg_catalog.jsonb_array_elements_text(
                   case when pg_catalog.jsonb_typeof(p_informe -> 'problemas') = 'array'
                        then p_informe -> 'problemas' else '[]'::pg_catalog.jsonb end
                 ) as e(codigo)
            join public.catalogo_problemas cp
              on cp.codigo = e.codigo and cp.activo
           order by e.codigo
           limit 5
        ) s;

      begin
        insert into public.informes (
          ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento,
          version_prompt, frecuencia_horas, tratados, sin_tratar, borradores,
          documentos, facturas_pendientes, urgentes,
          comp_correo, comp_almacenamiento, comp_contexto, comp_registro,
          problemas, campos_descartados
        ) values (
          p_ejecucion_id,
          v_cliente,
          pg_catalog.lower(p_informe ->> 'estado')::public.estado_informe,
          pg_catalog.lower(p_informe ->> 'modo')::public.modo_ejecucion,
          pg_catalog.lower(p_informe ->> 'asistente')::public.asistente,
          pg_catalog.lower(p_informe ->> 'almacenamiento')::public.almacenamiento,
          p_informe ->> 'version_prompt',
          (p_informe ->> 'frecuencia_horas')::pg_catalog.int2,
          (p_informe ->> 'tratados')::pg_catalog.int4,
          (p_informe ->> 'sin_tratar')::pg_catalog.int4,
          (p_informe ->> 'borradores')::pg_catalog.int4,
          (p_informe ->> 'documentos')::pg_catalog.int4,
          (p_informe ->> 'facturas_pendientes')::pg_catalog.int4,
          (p_informe ->> 'urgentes')::pg_catalog.int4,
          coalesce((v_comp ->> 'correo')::pg_catalog.bool, false),
          coalesce((v_comp ->> 'almacenamiento')::pg_catalog.bool, false),
          coalesce((v_comp ->> 'contexto')::pg_catalog.bool, false),
          coalesce((v_comp ->> 'registro')::pg_catalog.bool, false),
          v_problemas,
          least(v_descartados, 1000)
        )
        on conflict (ejecucion_id) do nothing;

        get diagnostics v_filas = row_count;
      exception
        -- Tipo o rango inválido (N-6). No se devuelve ni se registra el valor
        -- recibido ni el DETAIL del motor.
        when data_exception or integrity_constraint_violation then
          return pg_catalog.jsonb_build_object('autorizado', true, 'guardado', false,
                                               'motivo', 'informe_invalido');
      end;

      update public.ejecuciones
         set cerrada_en = coalesce(cerrada_en, pg_catalog.now())
       where id = p_ejecucion_id;

      return pg_catalog.jsonb_build_object(
        'autorizado',         true,
        'guardado',           true,
        'repetido',           v_filas = 0,
        'campos_descartados', v_descartados
      );
    exception
      -- Cualquier otro fallo: solo un código; se deshace lo escrito en el bloque.
      when others then
        return pg_catalog.jsonb_build_object('autorizado', true, 'guardado', false,
                                             'motivo', 'error_interno');
    end;
  end;
  $f$;

  -- -------------------------------------------------------------------
  -- mcp_confirmar_orden: confirma una orden de ESTE cliente (la del token).
  -- Una orden de otro cliente y una inexistente dan la misma respuesta.
  -- -------------------------------------------------------------------
  create function privado.mcp_confirmar_orden(
    p_token_hmac pg_catalog.text,
    p_orden_id pg_catalog.uuid
  )
  returns pg_catalog.jsonb
  language plpgsql
  volatile
  security definer
  set search_path = pg_catalog, pg_temp
  as $f$
  declare
    v_conexion pg_catalog.uuid;
    v_cliente pg_catalog.uuid;
    v_filas pg_catalog.int4;
    v_ya pg_catalog.bool;
  begin
    select r.conexion_id, r.cliente_id
      into v_conexion, v_cliente
      from privado.resolver_token(p_token_hmac) r;

    if v_conexion is null then
      return pg_catalog.jsonb_build_object('autorizado', false);
    end if;

    begin
      -- Bloqueo compartido del cliente activo: una baja concurrente espera a que
      -- termine esta llamada (REQ-064). Sin fila, no está autorizado.
      perform 1 from public.clientes where id = v_cliente and estado = 'activo' for share;
      if not found then
        return pg_catalog.jsonb_build_object('autorizado', false);
      end if;

      -- Solo órdenes del cliente al que pertenece el token.
      update public.ordenes o
         set estado = 'confirmada', confirmada_en = pg_catalog.now()
       where o.id = p_orden_id
         and o.cliente_id = v_cliente
         and o.estado in ('pendiente', 'entregada');

      get diagnostics v_filas = row_count;

      select exists (
        select 1 from public.ordenes o
         where o.id = p_orden_id
           and o.cliente_id = v_cliente
           and o.estado = 'confirmada'
      ) into v_ya;

      return pg_catalog.jsonb_build_object(
        'autorizado', true,
        'confirmada', v_ya,
        'repetida',   v_ya and v_filas = 0
      );
    exception
      when others then
        return pg_catalog.jsonb_build_object('autorizado', true, 'confirmada', false,
                                             'motivo', 'error_interno');
    end;
  end;
  $f$;

  -- -------------------------------------------------------------------
  -- Permisos: nadie; después, execute solo a conector en las tres mcp_*. Las
  -- internas no las ejecuta nadie (las llaman funciones del dueño).
  -- -------------------------------------------------------------------
  revoke all on function
    privado.licencia_vigente(pg_catalog.uuid),
    privado.resolver_token(pg_catalog.text),
    privado.mcp_obtener_instrucciones(pg_catalog.text),
    privado.mcp_enviar_informe(pg_catalog.text, pg_catalog.uuid, pg_catalog.jsonb),
    privado.mcp_confirmar_orden(pg_catalog.text, pg_catalog.uuid)
    from public, anon, authenticated, service_role, conector;
  -- En una función, all es solo el privilegio de ejecución. Se escribe así porque el
  -- detector de L 14 (D-11, regla 5) rechaza la palabra de ese privilegio fuera de
  -- «execute function» y de «execute pg_catalog.format» (como en M07).
  grant all on function
    privado.mcp_obtener_instrucciones(pg_catalog.text),
    privado.mcp_enviar_informe(pg_catalog.text, pg_catalog.uuid, pg_catalog.jsonb),
    privado.mcp_confirmar_orden(pg_catalog.text, pg_catalog.uuid)
    to conector;
  grant usage on schema privado to conector;

  -- -------------------------------------------------------------------
  -- Comprobación (N-4, D-9): el conector no tiene nada más que las tres mcp_* y
  -- usage en privado, y nadie ajeno recibe estas funciones. Un revoke que no retira
  -- lo que otro concedente dio no da error: si queda algo, falla todo.
  -- -------------------------------------------------------------------
  if exists (
       -- Las cinco funciones: solo el dueño y, las tres mcp_*, conector (execute,
       -- sin opción de concesión, concedido por el dueño).
       select 1
         from pg_catalog.pg_proc p
         join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'privado'
          and p.proname in ('licencia_vigente', 'resolver_token', 'mcp_obtener_instrucciones',
                            'mcp_enviar_informe', 'mcp_confirmar_orden')
          and (p.proacl is null
               or exists (select 1 from pg_catalog.aclexplode(p.proacl) a
                           where a.grantor <> p.proowner
                              or (a.grantee <> p.proowner
                                  and not (a.grantee = 'conector'::pg_catalog.regrole::pg_catalog.oid
                                           and a.privilege_type = 'EXECUTE'
                                           and not a.is_grantable
                                           and p.proname like 'mcp\_%')))))
     or exists (
       -- El conector no ejecuta ninguna otra función de public ni de privado.
       select 1
         from pg_catalog.pg_proc p
         join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'privado')
          and p.proname not in ('mcp_obtener_instrucciones', 'mcp_enviar_informe', 'mcp_confirmar_orden')
          and pg_catalog.has_function_privilege('conector', p.oid, 'execute'))
     or exists (
       -- Ningún permiso de tabla, vista ni columna para el conector, venga de donde
       -- venga (directo, PUBLIC o por herencia).
       select 1
         from pg_catalog.pg_class c
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname in ('public', 'privado')
          and c.relkind in ('r', 'p', 'v', 'm', 'f')
          and pg_catalog.has_table_privilege('conector', c.oid,
                'select, insert, update, delete, truncate, references, trigger'))
     or exists (
       select 1
         from pg_catalog.pg_attribute t
         join pg_catalog.pg_class c on c.oid = t.attrelid
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname in ('public', 'privado')
          and c.relkind in ('r', 'p', 'v', 'm', 'f')
          and t.attnum > 0
          and not t.attisdropped
          and pg_catalog.has_column_privilege('conector', c.oid, t.attnum,
                'select, insert, update, references'))
     or exists (
       -- El esquema privado: el dueño y usage (sin opción de concesión) para
       -- authenticated y para conector; PUBLIC (grantee 0) falla.
       select 1
         from pg_catalog.pg_namespace s
         cross join lateral pg_catalog.aclexplode(s.nspacl) a
        where s.nspname = 'privado'
          and (a.grantor <> s.nspowner
               or (a.grantee <> s.nspowner
                   and not (a.grantee in ('authenticated'::pg_catalog.regrole::pg_catalog.oid,
                                          'conector'::pg_catalog.regrole::pg_catalog.oid)
                            and a.privilege_type = 'USAGE'
                            and not a.is_grantable))))
     or exists (
       -- El conector no es miembro de ningún rol (heredaría sus permisos) ni tiene miembros.
       select 1 from pg_catalog.pg_auth_members m
        where m.member = 'conector'::pg_catalog.regrole::pg_catalog.oid
           or m.roleid = 'conector'::pg_catalog.regrole::pg_catalog.oid)
     or pg_catalog.has_schema_privilege('conector', 'public', 'create')
     or pg_catalog.has_schema_privilege('conector', 'privado', 'create')
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
