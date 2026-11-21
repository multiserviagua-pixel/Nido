-- =====================================================================
-- Datos ficticios de desarrollo y CI (función 010, T-007; diseño D-10).
-- REQ-003, REQ-025, REQ-058 · CA-002, CA-003.
--
-- Cómo se carga (una persona o el CI; nunca la CLI):
--   psql -v ON_ERROR_STOP=1 -f supabase/seed.sql
-- con `app.entorno` fijado en la base: alter database postgres set app.entorno = 'ci'
-- (o 'desarrollo'). Sin la variable, o con otro valor, el seed falla.
--
-- N-8: la guarda de entorno protege de accidentes, no de quien actúa a propósito con `postgres`,
-- que puede fijar la variable. Producción no fija nunca la variable ni carga este archivo.
--
-- Todo va en una sola transacción: si algo falla, aunque el cliente siga tras el error
-- (psql sin ON_ERROR_STOP), no queda nada. Se escribe como el dueño (postgres): los
-- disparadores de auditoría de clase «cualquier rol salvo el dueño» no registran el seed;
-- solo quedan las filas que la base escribe siempre (administradores y versiones_prompt).
--
-- Datos 100 % ficticios (artículos 1 y 4): correos @example.com, sin contraseña ni
-- identidades en auth, HMAC de una letra repetida, sin texto de correo. Los usuarios
-- solo tienen id y correo. Identificadores fijos, con el formato de las pruebas.
-- No repite lo que trae M10: la fila de ajustes_globales y los doce códigos del catálogo.
--
-- Perfiles (los de la especificación):
--   UA   usuario-a             vinculado a A
--   UB   usuario-b             vinculado a B
--   UAB  usuario-ab            vinculado a A y B (no a C)
--   USV  usuario-sin-vinculo   sin vínculo ni administrador
--   AD1  superadmin-1          administrador, no vinculado (sin doble factor: lo marca la sesión)
--   AD2  superadmin-2          administrador (con doble factor: lo marca la sesión)
--   AD1A superadmin-1a         administrador vinculado a A (REQ-039)
--   AD3  superadmin-3          usuario que NO es administrador: el procedimiento de altas lo
--                              da de alta y de baja (CA-037)
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

-- Usuarios: solo id y correo (sin contraseña, sin identidades).
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000001a', 'usuario-a@example.com'),
  ('00000000-0000-4000-8000-00000000001b', 'usuario-b@example.com'),
  ('00000000-0000-4000-8000-00000000001c', 'usuario-ab@example.com'),
  ('00000000-0000-4000-8000-00000000001d', 'usuario-sin-vinculo@example.com'),
  ('00000000-0000-4000-8000-00000000001e', 'superadmin-1@example.com'),
  ('00000000-0000-4000-8000-00000000001f', 'superadmin-2@example.com'),
  ('00000000-0000-4000-8000-000000000020', 'superadmin-1a@example.com'),
  ('00000000-0000-4000-8000-000000000021', 'superadmin-3@example.com');

insert into public.clientes (id, nombre, canal, frecuencia_esperada_horas) values
  ('00000000-0000-4000-8000-00000000000a', 'Cliente A ficticio', 'estable', 24),
  ('00000000-0000-4000-8000-00000000000b', 'Cliente B ficticio', 'estable', 12),
  ('00000000-0000-4000-8000-00000000000c', 'Cliente C ficticio', 'prueba', 48);

insert into public.administradores (usuario_id) values
  ('00000000-0000-4000-8000-00000000001e'),
  ('00000000-0000-4000-8000-00000000001f'),
  ('00000000-0000-4000-8000-000000000020');

insert into public.usuarios_cliente (usuario_id, cliente_id) values
  ('00000000-0000-4000-8000-00000000001a', '00000000-0000-4000-8000-00000000000a'),
  ('00000000-0000-4000-8000-00000000001b', '00000000-0000-4000-8000-00000000000b'),
  ('00000000-0000-4000-8000-00000000001c', '00000000-0000-4000-8000-00000000000a'),
  ('00000000-0000-4000-8000-00000000001c', '00000000-0000-4000-8000-00000000000b'),
  ('00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-00000000000a');

insert into public.licencias (id, cliente_id) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-00000000000a'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-00000000000b'),
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-00000000000c');

-- Códigos de activación: solo el HMAC ficticio (letra repetida).
insert into public.codigos_activacion (id, licencia_id, codigo_hmac, caduca_en) values
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-0000000000a1', repeat('a2', 32), now() + interval '7 days'),
  ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-0000000000b1', repeat('b2', 32), now() + interval '7 days'),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-0000000000c1', repeat('c2', 32), now() + interval '7 days');

insert into public.conexiones (id, licencia_id, asistente, ultimo_uso_en) values
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a1', 'claude', now()),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b1', 'chatgpt', now()),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000c1', 'otro', now());

insert into public.clientes_oauth (id, client_id, origen, redirect_uris) values
  ('00000000-0000-4000-8000-0000000000f2', 'cliente-oauth-ficticio', 'predefinido', array['https://example.com/callback']);

insert into public.codigos_autorizacion
  (id, codigo_hmac, conexion_id, cliente_oauth_id, redirect_uri, code_challenge, recurso, caduca_en) values
  ('00000000-0000-4000-8000-0000000000a8', repeat('a3', 32), '00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000f2',
   'https://example.com/callback', repeat('A', 43), 'https://example.com/mcp', now() + interval '10 minutes'),
  ('00000000-0000-4000-8000-0000000000b8', repeat('b3', 32), '00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000f2',
   'https://example.com/callback', repeat('B', 43), 'https://example.com/mcp', now() + interval '10 minutes'),
  ('00000000-0000-4000-8000-0000000000c8', repeat('c3', 32), '00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000f2',
   'https://example.com/callback', repeat('C', 43), 'https://example.com/mcp', now() + interval '10 minutes');

-- Tokens: acceso (a, b, c × 64) y renovación (a1, b1, c1 × 32), solo HMAC ficticio.
insert into public.tokens (id, conexion_id, tipo, token_hmac, recurso, caduca_en) values
  ('00000000-0000-4000-8000-0000000000a9', '00000000-0000-4000-8000-0000000000a2', 'acceso', repeat('a', 64), 'https://example.com/mcp', now() + interval '1 hour'),
  ('00000000-0000-4000-8000-0000000000b9', '00000000-0000-4000-8000-0000000000b2', 'acceso', repeat('b', 64), 'https://example.com/mcp', now() + interval '1 hour'),
  ('00000000-0000-4000-8000-0000000000c9', '00000000-0000-4000-8000-0000000000c2', 'acceso', repeat('c', 64), 'https://example.com/mcp', now() + interval '1 hour'),
  ('00000000-0000-4000-8000-000000000a91', '00000000-0000-4000-8000-0000000000a2', 'renovacion', repeat('a1', 32), 'https://example.com/mcp', now() + interval '30 days'),
  ('00000000-0000-4000-8000-000000000b91', '00000000-0000-4000-8000-0000000000b2', 'renovacion', repeat('b1', 32), 'https://example.com/mcp', now() + interval '30 days'),
  ('00000000-0000-4000-8000-000000000c91', '00000000-0000-4000-8000-0000000000c2', 'renovacion', repeat('c1', 32), 'https://example.com/mcp', now() + interval '30 days');

insert into public.reglas_cliente
  (cliente_id, max_correos_por_revision, ventana_dias, guardar_adjuntos, preparar_borradores, descargar_facturas_por_enlace) values
  ('00000000-0000-4000-8000-00000000000a', 30, 3, true, true, true),
  ('00000000-0000-4000-8000-00000000000b', 50, 5, false, true, true),
  ('00000000-0000-4000-8000-00000000000c', 10, 1, true, false, false);

insert into public.ordenes (id, cliente_id, tipo) values
  ('00000000-0000-4000-8000-0000000000a4', '00000000-0000-4000-8000-00000000000a', 'pausar'),
  ('00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-00000000000b', 'reanudar'),
  ('00000000-0000-4000-8000-0000000000c4', '00000000-0000-4000-8000-00000000000c', 'pausar');

insert into public.suscripciones
  (cliente_id, stripe_customer_id, stripe_subscription_id, estado, periodo_fin, gracia_hasta) values
  ('00000000-0000-4000-8000-00000000000a', 'cus_ficticioA', 'sub_ficticioA', 'active', now() + interval '30 days', null),
  ('00000000-0000-4000-8000-00000000000b', 'cus_ficticioB', 'sub_ficticioB', 'trialing', now() + interval '14 days', null),
  ('00000000-0000-4000-8000-00000000000c', 'cus_ficticioC', 'sub_ficticioC', 'past_due', now() + interval '2 days', now() + interval '3 days');

insert into public.eventos_stripe (id, tipo, procesado_en) values
  ('evt_ficticio1', 'invoice.paid', now()),
  ('evt_ficticio2', 'customer.subscription.updated', null);

-- Versión del prompt: la huella la calcula SQL a partir del contenido (REQ-055).
insert into public.versiones_prompt (id, version, contenido, huella_sha256, commit_sha, notas)
select '00000000-0000-4000-8000-0000000000f1', '0.0.1', t.contenido,
       encode(sha256(convert_to(t.contenido, 'UTF8')), 'hex'), '0000000', 'Versión ficticia de pruebas'
  from (values ('Texto ficticio de prueba del prompt. Solo para pruebas.')) as t (contenido);

insert into public.publicaciones (canal, version_id)
values ('estable', '00000000-0000-4000-8000-0000000000f1');

insert into public.ejecuciones (id, conexion_id, cliente_id, version_id, estado_servido, abierta_en, cerrada_en) values
  ('00000000-0000-4000-8000-0000000000a5', '00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-00000000000a',
   '00000000-0000-4000-8000-0000000000f1', 'activa', now() - interval '1 hour', now() - interval '55 minutes'),
  ('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-00000000000b',
   '00000000-0000-4000-8000-0000000000f1', 'activa', now() - interval '1 hour', now() - interval '55 minutes'),
  ('00000000-0000-4000-8000-0000000000c5', '00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-00000000000c',
   '00000000-0000-4000-8000-0000000000f1', 'activa', now() - interval '1 hour', now() - interval '55 minutes');

insert into public.informes
  (id, ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento, version_prompt, frecuencia_horas,
   tratados, sin_tratar, borradores, documentos, facturas_pendientes, urgentes,
   comp_correo, comp_almacenamiento, comp_contexto, comp_registro, problemas) values
  ('00000000-0000-4000-8000-0000000000a6', '00000000-0000-4000-8000-0000000000a5', '00000000-0000-4000-8000-00000000000a',
   'ok', 'desatendido', 'claude', 'drive', '0.0.1', 24, 12, 0, 3, 4, 1, 0, true, true, true, true, '{}'),
  ('00000000-0000-4000-8000-0000000000b6', '00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-00000000000b',
   'aviso', 'conversacion', 'chatgpt', 'onedrive', '0.0.1', 12, 20, 5, 2, 1, 0, 1, true, true, true, true, array['limite_correos_alcanzado']),
  ('00000000-0000-4000-8000-0000000000c6', '00000000-0000-4000-8000-0000000000c5', '00000000-0000-4000-8000-00000000000c',
   'error', 'desatendido', 'otro', 'otro', '0.0.1', 48, 0, 7, 0, 0, 2, 3, false, true, true, true, array['sin_acceso_correo']);

insert into public.alertas (id, cliente_id, tipo, severidad) values
  ('00000000-0000-4000-8000-0000000000a7', '00000000-0000-4000-8000-00000000000a', 'sin_senal', 'aviso'),
  ('00000000-0000-4000-8000-0000000000b7', '00000000-0000-4000-8000-00000000000b', 'version_antigua', 'info'),
  ('00000000-0000-4000-8000-0000000000c7', '00000000-0000-4000-8000-00000000000c', 'estado_error', 'critica');

commit;
