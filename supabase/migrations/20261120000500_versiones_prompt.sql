do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M05 · versiones_prompt · PROTEGIDA (función 010, diseño D-1, D-3, D-7 y D-8;
-- §3 y §6 de docs/MODELO-DATOS.sql)
--
-- Crea public.versiones_prompt (las registra el despliegue; inmutables) y
-- public.publicaciones (qué versión sirve cada canal; la vigente es la fila más
-- reciente y la vuelta atrás es una fila nueva), con la inmutabilidad de M04
-- (enable always) y su auditoría. Artículo 9 de la constitución: el texto del
-- prompt solo cambia por despliegue revisado y las versiones registradas no se
-- tocan.
--
-- D-8: huella_sha256 = encode(sha256(convert_to(contenido, 'UTF8')), 'hex'),
-- con sha256() del núcleo, para cualquier rol, también el dueño. No es una
-- columna generada: hay que poder rechazar la huella incorrecta (CA-033). Un
-- final de línea distinto en el despliegue da otra huella y se rechaza.
--
-- A-12 (art. 9, vuelta 3 de T-003): contenido y notas pasan por una LISTA BLANCA
-- de caracteres, no por una lista negra: ASCII imprimible, letras latinas con
-- tilde y enie (U+00A1-U+017F salvo U+00AD), comillas, rayas, puntos suspensivos,
-- euro, vineta (U+2022) y el signo U+2753 que usa el prompt 1.2, mas el salto de
-- linea y el tabulador. Todo lo demas (controles, invisibles, selectores,
-- no caracteres, uso privado, etiquetas, el retorno de carro de D-8) se rechaza.
-- Guarda migracion_codificacion_no_utf8 como M02.
--
-- publicaciones.publicada_por no lleva valor por defecto: la fija el
-- disparador BEFORE de M07 (D-2, 4).
--
-- Auditoría: publicaciones (I) con la clase «cualquier rol salvo el dueño»;
-- versiones_prompt (I) siempre (REQ-060, REQ-061), sin condición.
--
-- PROTEGIDA (REQ-053): su reversión solo se ejecuta en CI. Ver M04.
--
-- Forma de D-1 (L 11, L 13 y L 14), como M01 a M04.
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
  v_fila pg_catalog.record;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  -- Los escapes del formato de contenido y notas (A-12) solo casan con una base
  -- UTF8: con otra codificación no casarían nunca.
  if pg_catalog.current_setting('server_encoding') operator(pg_catalog.<>) 'UTF8' then
    raise exception 'migracion_codificacion_no_utf8';
  end if;

  create table public.versiones_prompt (
    id            uuid primary key default gen_random_uuid(),
    version       text not null unique
                  check (version ~ '^[0-9]+\.[0-9]+(\.[0-9]+)?$' and char_length(version) <= 12),
    contenido     text not null check (char_length(contenido) between 1 and 100000
                         and contenido ~ '^[\n\t\u0020-\u007e\u00a1-\u00ac\u00ae-\u017f\u2013\u2014\u2018\u2019\u201a\u201c\u201d\u201e\u20ac\u2026\u2022\u2753]*$'),
    huella_sha256 text not null
                  check (huella_sha256 ~ '^[0-9a-f]{64}$'
                         and huella_sha256 = encode(sha256(convert_to(contenido, 'UTF8')), 'hex')),
    commit_sha    text not null check (commit_sha ~ '^[0-9a-f]{7,40}$'),
    notas         text check (char_length(notas) <= 500 and notas ~ '^[\n\t\u0020-\u007e\u00a1-\u00ac\u00ae-\u017f\u2013\u2014\u2018\u2019\u201a\u201c\u201d\u201e\u20ac\u2026\u2022\u2753]*$'),
    registrada_en timestamptz not null default now()
  );

  create table public.publicaciones (
    id            bigint generated always as identity primary key,
    canal         public.canal not null,
    version_id    uuid not null references public.versiones_prompt (id),
    motivo        public.motivo_publicacion not null default 'publicacion',
    publicada_por uuid,
    publicada_en  timestamptz not null default now()
  );
  create index publicaciones_por_canal on public.publicaciones (canal, id desc);

  alter table public.versiones_prompt enable row level security;
  alter table public.publicaciones    enable row level security;
  revoke all on table public.versiones_prompt, public.publicaciones
    from public, anon, authenticated, service_role, conector;

  -- Inmutabilidad: solo inserción y sin vaciado, también en modo réplica.
  create trigger versiones_prompt_inmutable
    before update or delete on public.versiones_prompt
    for each row execute function privado.impedir_cambios();
  create trigger versiones_prompt_sin_vaciado
    before truncate on public.versiones_prompt
    for each statement execute function privado.impedir_cambios();
  create trigger publicaciones_inmutable
    before update or delete on public.publicaciones
    for each row execute function privado.impedir_cambios();
  create trigger publicaciones_sin_vaciado
    before truncate on public.publicaciones
    for each statement execute function privado.impedir_cambios();
  alter table public.versiones_prompt enable always trigger versiones_prompt_inmutable;
  alter table public.versiones_prompt enable always trigger versiones_prompt_sin_vaciado;
  alter table public.publicaciones    enable always trigger publicaciones_inmutable;
  alter table public.publicaciones    enable always trigger publicaciones_sin_vaciado;

  -- Auditoría.
  create trigger versiones_prompt_auditar
    after insert on public.versiones_prompt
    for each row execute function privado.auditar();
  create trigger publicaciones_auditar
    after insert on public.publicaciones
    for each row when (current_user operator(pg_catalog.<>) 'postgres')
    execute function privado.auditar();

  -- Otros destinatarios de permisos por defecto: fuera de las dos tablas, y si
  -- queda algo ajeno, falla todo (como en M02).
  for v_fila in
    select distinct n.nspname as esquema, c.relname as objeto,
           c.relkind = 'S' as es_secuencia,
           r.rolname as destino
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      cross join lateral pg_catalog.aclexplode(c.relacl) a
      left join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'public' and (c.relname in ('versiones_prompt', 'publicaciones')
           or (c.relkind = 'S'
               and exists (
                 select 1
                   from pg_catalog.pg_depend d
                   join pg_catalog.pg_class t on t.oid = d.refobjid
                  where d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass
                    and d.refclassid = 'pg_catalog.pg_class'::pg_catalog.regclass
                    and d.objid = c.oid
                    and d.deptype in ('a', 'i')
                    and t.relnamespace = c.relnamespace
                    and t.relname in ('versiones_prompt', 'publicaciones'))))
       and a.grantee <> c.relowner
  loop
    -- Sin nombre de rol (grantee = 0) es PUBLIC. Solo marcadores %I (D-11, regla 5).
    if v_fila.es_secuencia and v_fila.destino is null then
      execute pg_catalog.format('revoke all on sequence %I.%I from public', v_fila.esquema, v_fila.objeto);
    elsif v_fila.es_secuencia then
      execute pg_catalog.format('revoke all on sequence %I.%I from %I',
        v_fila.esquema, v_fila.objeto, v_fila.destino);
    elsif v_fila.destino is null then
      execute pg_catalog.format('revoke all on table %I.%I from public', v_fila.esquema, v_fila.objeto);
    else
      execute pg_catalog.format('revoke all on table %I.%I from %I',
        v_fila.esquema, v_fila.objeto, v_fila.destino);
    end if;
  end loop;

  if exists (
       select 1
         from pg_catalog.pg_class c
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
         cross join lateral pg_catalog.aclexplode(c.relacl) a
        where n.nspname = 'public' and (c.relname in ('versiones_prompt', 'publicaciones')
           or (c.relkind = 'S'
               and exists (
                 select 1
                   from pg_catalog.pg_depend d
                   join pg_catalog.pg_class t on t.oid = d.refobjid
                  where d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass
                    and d.refclassid = 'pg_catalog.pg_class'::pg_catalog.regclass
                    and d.objid = c.oid
                    and d.deptype in ('a', 'i')
                    and t.relnamespace = c.relnamespace
                    and t.relname in ('versiones_prompt', 'publicaciones'))))
          and a.grantee <> c.relowner)
     or exists (
       select 1
         from pg_catalog.pg_attribute t
         join pg_catalog.pg_class c on c.oid = t.attrelid
         join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname in ('versiones_prompt', 'publicaciones')
          and t.attacl is not null)
  then
    raise exception 'migracion_concesiones_ajenas';
  end if;

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
