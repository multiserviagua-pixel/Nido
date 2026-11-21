-- =====================================================================
-- Datos ficticios de volumen (función 010, T-007; diseño D-10; CA-027).
-- 10 clientes ficticios con licencia, conexión, un usuario cada uno y 365 ejecuciones
-- e informes diarios (un año). Sirve para medir el rendimiento de los resúmenes.
--
-- Se carga con psql, después de las migraciones, con `app.entorno` fijado:
--   psql -v ON_ERROR_STOP=1 -f supabase/datos/volumen.sql
-- Sin la variable, o con un valor que no sea ci ni desarrollo, falla.
--
-- N-8: la guarda de entorno protege de accidentes, no de quien actúa a propósito con `postgres`,
-- que puede fijar la variable. Producción no fija nunca la variable ni carga este archivo.
--
-- Una sola transacción, escrita como dueño (postgres), sin auditoría. Independiente de
-- supabase/seed.sql: usa sus propios identificadores fijos (prefijos 8001 a 8006 en el
-- penúltimo grupo). Sin datos reales, sin contraseñas, sin secretos ni HMAC: solo cifras
-- deterministas y códigos del catálogo de M10.
-- =====================================================================
begin;

do $$
begin
  if coalesce(pg_catalog.current_setting('app.entorno', true), '') operator(pg_catalog.<>) all (array['ci', 'desarrollo']) then
    raise exception 'seed_entorno_no_permitido';
  end if;
  if current_user operator(pg_catalog.<>) 'postgres' then
    raise exception 'seed_rol_no_permitido';
  end if;
end $$;

set local search_path to pg_catalog, pg_temp;

insert into public.clientes (id, nombre)
select ('00000000-0000-4000-8001-' || lpad(to_hex(i), 12, '0'))::uuid,
       'Cliente de volumen ' || lpad(i::text, 2, '0') || ' ficticio'
  from generate_series(1, 10) as i;

insert into auth.users (id, email)
select ('00000000-0000-4000-8006-' || lpad(to_hex(i), 12, '0'))::uuid,
       'volumen-' || lpad(i::text, 2, '0') || '@example.com'
  from generate_series(1, 10) as i;

insert into public.usuarios_cliente (usuario_id, cliente_id)
select ('00000000-0000-4000-8006-' || lpad(to_hex(i), 12, '0'))::uuid,
       ('00000000-0000-4000-8001-' || lpad(to_hex(i), 12, '0'))::uuid
  from generate_series(1, 10) as i;

insert into public.licencias (id, cliente_id)
select ('00000000-0000-4000-8002-' || lpad(to_hex(i), 12, '0'))::uuid,
       ('00000000-0000-4000-8001-' || lpad(to_hex(i), 12, '0'))::uuid
  from generate_series(1, 10) as i;

insert into public.conexiones (id, licencia_id, asistente, ultimo_uso_en)
select ('00000000-0000-4000-8003-' || lpad(to_hex(i), 12, '0'))::uuid,
       ('00000000-0000-4000-8002-' || lpad(to_hex(i), 12, '0'))::uuid,
       'claude', now()
  from generate_series(1, 10) as i;

insert into public.reglas_cliente (cliente_id)
select ('00000000-0000-4000-8001-' || lpad(to_hex(i), 12, '0'))::uuid
  from generate_series(1, 10) as i;

-- 365 ejecuciones por cliente: una por día, la de d = 0 es la de hoy.
insert into public.ejecuciones (id, conexion_id, cliente_id, estado_servido, abierta_en, cerrada_en)
select ('00000000-0000-4000-8004-' || lpad(to_hex(i * 1000 + d), 12, '0'))::uuid,
       ('00000000-0000-4000-8003-' || lpad(to_hex(i), 12, '0'))::uuid,
       ('00000000-0000-4000-8001-' || lpad(to_hex(i), 12, '0'))::uuid,
       'activa',
       now() - d * interval '1 day' - interval '1 hour',
       now() - d * interval '1 day' - interval '55 minutes'
  from generate_series(1, 10) as i, generate_series(0, 364) as d;

insert into public.informes
  (id, ejecucion_id, cliente_id, recibido_en, estado, modo, asistente, almacenamiento, version_prompt,
   frecuencia_horas, tratados, sin_tratar, borradores, documentos, facturas_pendientes, urgentes,
   comp_correo, comp_almacenamiento, comp_contexto, comp_registro, problemas)
select ('00000000-0000-4000-8005-' || lpad(to_hex(i * 1000 + d), 12, '0'))::uuid,
       ('00000000-0000-4000-8004-' || lpad(to_hex(i * 1000 + d), 12, '0'))::uuid,
       ('00000000-0000-4000-8001-' || lpad(to_hex(i), 12, '0'))::uuid,
       now() - d * interval '1 day' - interval '55 minutes',
       (case when d % 25 = 0 then 'error' when d % 7 = 0 then 'aviso' else 'ok' end)::public.estado_informe,
       'desatendido', 'claude', 'drive', '0.0.1', 24,
       (d * 7 + i) % 31, (d + i) % 6, (d * 3 + i) % 9, (d * 5 + i) % 12, (d + 2 * i) % 4, (d + i) % 3,
       d % 25 <> 0, true, true, true,
       case when d % 25 = 0 then array['sin_acceso_correo'] else array[]::pg_catalog.text[] end
  from generate_series(1, 10) as i, generate_series(0, 364) as d;

commit;
