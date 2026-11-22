-- =====================================================================
-- 07 · Informes (función 010, T-008; diseño, «Pruebas»).
-- REQ-020, REQ-021, REQ-022, REQ-026, REQ-046 · CA-017, CA-018.
--
-- ESCRITA, NO EJECUTADA EN CI (artículo 13): la primera ejecución real es la de T-013
-- (supabase test db). Lo que sí se ejecutó en local es esta misma prueba contra el arnés
-- PGlite con pglite-pgtap (supabase/tests/pglite/pgtap.test.ts), que no sustituye a CI.
--
-- 30 aserciones = 7 casos × 2 roles (14) + 1 positivo + 1 de «0 filas» + 14 de contrato:
--   · CA-018, siete casos de escritura que la estructura rechaza: un código fuera del catálogo,
--     un código repetido, más de cinco códigos, texto donde va una cifra, una cifra fuera de
--     rango, un cliente distinto del de su ejecución en el informe, y una ejecución cuyo cliente
--     no es el de su conexión. Cada uno con dos roles: el dueño (postgres), que da el SQLSTATE
--     exacto de la estructura, y service_role (el rol de la clave secreta), que no puede
--     escribir: 42501 exacto en seis casos y 22P02 en el del texto donde va una cifra, que
--     falla al analizar la sentencia antes de llegar a los permisos.
--   · +1 positivo (15): la sentencia base, sin lo que cambia cada caso, SÍ se inserta (en un
--     subbloque que se deshace): sin él, un rechazo por cualquier otra causa pasaría los siete casos.
--     Los casos 1, 2, 3, 5 y 7 comparan además el mensaje o el nombre de la restricción que rechaza.
--   · +1: tras todos los intentos, el número de informes y de ejecuciones es el de antes
--     («con 0 filas creadas»).
--   · CA-017, 14 de contrato: cada propiedad de primer nivel de contratos/informe.schema.json,
--     transcrita en el bloque de abajo, coincide con el catálogo de public.informes. La prueba
--     local tests/unit/bd/contrato-informe.test.ts (L 2) comprueba que esa transcripción
--     coincide con el contrato; aquí se compara con la base.
--
-- Bajo un rol que no es el dueño no se llama a pgTAP (los permisos por defecto cerrados de D-4
-- afectan también a sus funciones): se intenta con pg_temp.intentar() y se compara de vuelta
-- como dueño. Todo va calificado (sombras de N-3).
-- =====================================================================
begin;

\ir ayudas/perfiles.psql
\ir ayudas/sombras.psql

select plan(30);

-- ---------------------------------------------------------------------
-- Transcripción de contratos/informe.schema.json (1 fila por propiedad de primer nivel).
-- Columnas: campo, clase, columnas, valores, minimo, maximo, patron, max_elementos.
--   enum       lista cerrada en `valores`, en la columna `columnas` (tipo enumerado)
--   texto      cadena con `patron` y longitud máxima `maximo`
--   entero     entero con `minimo` y `maximo`
--   booleanos  `valores` = propiedades de comprobaciones, `columnas` = sus columnas comp_*
--   lista      códigos del catálogo en `valores`, como mucho `max_elementos`, sin repetir
-- La lee tests/unit/bd/contrato-informe.test.ts (L 2): no cambiar el formato sin cambiarla.
-- ---------------------------------------------------------------------
-- TRANSCRIPCION-CONTRATO-INICIO
create temp table contrato_informe (
  campo pg_catalog.text primary key, clase pg_catalog.text not null, columnas pg_catalog.text, valores pg_catalog.text,
  minimo pg_catalog.int4, maximo pg_catalog.int4, patron pg_catalog.text, max_elementos pg_catalog.int4);
insert into pg_temp.contrato_informe values
  ('estado', 'enum', 'estado', 'ok,aviso,error,pausado', null, null, null, null),
  ('modo', 'enum', 'modo', 'conversacion,desatendido', null, null, null, null),
  ('asistente', 'enum', 'asistente', 'claude,chatgpt,otro', null, null, null, null),
  ('almacenamiento', 'enum', 'almacenamiento', 'drive,onedrive,dropbox,otro', null, null, null, null),
  ('version_prompt', 'texto', 'version_prompt', null, null, 12, '^[0-9]+\.[0-9]+(\.[0-9]+)?$', null),
  ('frecuencia_horas', 'entero', 'frecuencia_horas', null, 1, 168, null, null),
  ('tratados', 'entero', 'tratados', null, 0, 1000, null, null),
  ('sin_tratar', 'entero', 'sin_tratar', null, 0, 100000, null, null),
  ('borradores', 'entero', 'borradores', null, 0, 1000, null, null),
  ('documentos', 'entero', 'documentos', null, 0, 1000, null, null),
  ('facturas_pendientes', 'entero', 'facturas_pendientes', null, 0, 1000, null, null),
  ('urgentes', 'entero', 'urgentes', null, 0, 1000, null, null),
  ('comprobaciones', 'booleanos', 'comp_correo,comp_almacenamiento,comp_contexto,comp_registro', 'correo,almacenamiento,contexto,registro', null, null, null, null),
  ('problemas', 'lista', 'problemas', 'sin_acceso_correo,sin_acceso_almacenamiento,sin_contexto,registro_no_guardado,error_borrador,error_guardar_documento,error_etiquetado,limite_correos_alcanzado,factura_requiere_acceso,otro_agente_detectado,conector_humanaia_inestable,otro', null, null, null, 5);
-- TRANSCRIPCION-CONTRATO-FIN

-- Diferencias entre una fila de la transcripción y el catálogo de public.informes: '' si no hay.
create function pg_temp.diferencias_contrato(p_campo pg_catalog.text) returns pg_catalog.text
language plpgsql
as $f$
declare
  r pg_temp.contrato_informe;
  v_col pg_catalog.text;
  v_cols pg_catalog.text[];
  v_attnum pg_catalog.int2;
  v_notnull pg_catalog.bool;
  v_tipo pg_catalog.text;
  v_tipoid pg_catalog.oid;
  v_def pg_catalog.text;
  v_dif pg_catalog.text := '';
  v_min pg_catalog.text;
  v_max pg_catalog.text;
begin
  select * into r from pg_temp.contrato_informe c where c.campo operator(pg_catalog.=) p_campo;
  if not found then
    return 'sin_fila_en_la_transcripcion';
  end if;
  v_cols := pg_catalog.string_to_array(r.columnas, ',');
  foreach v_col in array v_cols loop
    select a.attnum, a.attnotnull, t.typname::pg_catalog.text, t.oid
      into v_attnum, v_notnull, v_tipo, v_tipoid
      from pg_catalog.pg_attribute a join pg_catalog.pg_type t on t.oid operator(pg_catalog.=) a.atttypid
     where a.attrelid operator(pg_catalog.=) 'public.informes'::pg_catalog.regclass
       and a.attname operator(pg_catalog.=) v_col and a.attnum operator(pg_catalog.>) 0 and not a.attisdropped;
    if not found then
      return pg_catalog.format('%s: falta la columna %s', p_campo, v_col);
    end if;
    -- Todas las propiedades del contrato son obligatorias: not null.
    if not v_notnull then
      v_dif := v_dif || pg_catalog.format(' %s admite nulos;', v_col);
    end if;
    -- Texto de las restricciones check que nombran solo a esta columna.
    select coalesce(pg_catalog.string_agg(pg_catalog.pg_get_constraintdef(k.oid), ' '), '')
      into v_def
      from pg_catalog.pg_constraint k
     where k.conrelid operator(pg_catalog.=) 'public.informes'::pg_catalog.regclass
       and k.contype operator(pg_catalog.=) 'c' and k.conkey operator(pg_catalog.=) array[v_attnum];

    if r.clase operator(pg_catalog.=) 'enum' then
      if (select t.typtype from pg_catalog.pg_type t where t.oid operator(pg_catalog.=) v_tipoid) operator(pg_catalog.<>) 'e' then
        v_dif := v_dif || pg_catalog.format(' %s no es un enumerado;', v_col);
      elsif (select pg_catalog.array_agg(e.enumlabel::pg_catalog.text order by e.enumsortorder)
               from pg_catalog.pg_enum e where e.enumtypid operator(pg_catalog.=) v_tipoid)
            is distinct from pg_catalog.string_to_array(r.valores, ',') then
        v_dif := v_dif || pg_catalog.format(' los valores de %s no son los del contrato;', v_col);
      end if;
    elsif r.clase operator(pg_catalog.=) 'entero' then
      if v_tipo not in ('int2', 'int4') then
        v_dif := v_dif || pg_catalog.format(' %s no es un entero;', v_col);
      end if;
      v_min := pg_catalog.substring(v_def, pg_catalog.format('\(%s >= (-?[0-9]+)\)', v_col));
      v_max := pg_catalog.substring(v_def, pg_catalog.format('\(%s <= (-?[0-9]+)\)', v_col));
      if v_min is distinct from r.minimo::pg_catalog.text then
        v_dif := v_dif || pg_catalog.format(' mínimo de %s: catálogo %s, contrato %s;', v_col, coalesce(v_min, 'ninguno'), r.minimo);
      end if;
      if v_max is distinct from r.maximo::pg_catalog.text then
        v_dif := v_dif || pg_catalog.format(' máximo de %s: catálogo %s, contrato %s;', v_col, coalesce(v_max, 'ninguno'), r.maximo);
      end if;
    elsif r.clase operator(pg_catalog.=) 'texto' then
      if v_tipo operator(pg_catalog.<>) 'text' then
        v_dif := v_dif || pg_catalog.format(' %s no es texto;', v_col);
      end if;
      if pg_catalog.strpos(v_def, v_col || ' ~ ''' || r.patron || '''') operator(pg_catalog.=) 0 then
        v_dif := v_dif || pg_catalog.format(' el formato de %s no es el del contrato;', v_col);
      end if;
      if pg_catalog.strpos(v_def, pg_catalog.format('char_length(%s) <= %s', v_col, r.maximo)) operator(pg_catalog.=) 0 then
        v_dif := v_dif || pg_catalog.format(' la longitud máxima de %s no es %s;', v_col, r.maximo);
      end if;
    elsif r.clase operator(pg_catalog.=) 'booleanos' then
      if v_tipo operator(pg_catalog.<>) 'bool' then
        v_dif := v_dif || pg_catalog.format(' %s no es booleano;', v_col);
      end if;
    elsif r.clase operator(pg_catalog.=) 'lista' then
      if v_tipo operator(pg_catalog.<>) '_text' then
        v_dif := v_dif || pg_catalog.format(' %s no es una lista de texto;', v_col);
      end if;
      if pg_catalog.strpos(v_def, pg_catalog.format('cardinality(%s) <= %s', v_col, r.max_elementos)) operator(pg_catalog.=) 0 then
        v_dif := v_dif || pg_catalog.format(' el máximo de elementos de %s no es %s;', v_col, r.max_elementos);
      end if;
    end if;
  end loop;

  if r.clase operator(pg_catalog.=) 'booleanos'
     and pg_catalog.array_length(v_cols, 1) is distinct from pg_catalog.array_length(pg_catalog.string_to_array(r.valores, ','), 1) then
    v_dif := v_dif || ' faltan columnas para las propiedades;';
  end if;
  if r.clase operator(pg_catalog.=) 'lista' then
    -- Los códigos permitidos son los del catálogo cerrado, ni uno más ni uno menos...
    if (select pg_catalog.array_agg(c.codigo::pg_catalog.text order by c.codigo) from public.catalogo_problemas c)
       is distinct from (select pg_catalog.array_agg(x order by x) from pg_catalog.unnest(pg_catalog.string_to_array(r.valores, ',')) as x) then
      v_dif := v_dif || ' el catálogo de problemas no es la lista del contrato;';
    end if;
    -- ... sin repetir (uniqueItems) y comprobados contra el catálogo por el disparador.
    if not exists (select 1 from pg_catalog.pg_proc p
                    where p.oid operator(pg_catalog.=) 'privado.validar_informe'::pg_catalog.regproc
                      and p.prosrc operator(pg_catalog.~~) '%informe_problema_repetido%'
                      and p.prosrc operator(pg_catalog.~~) '%informe_problema_desconocido%') then
      v_dif := v_dif || ' validar_informe no comprueba repetidos ni desconocidos;';
    end if;
  end if;
  return pg_catalog.btrim(v_dif);
end;
$f$;

-- ---------------------------------------------------------------------
-- CA-018 · siete casos de escritura rechazada. Ejecución propia de A (N2) y dos auxiliares.
-- ---------------------------------------------------------------------
insert into public.ejecuciones (id, conexion_id, cliente_id, estado_servido)
  values (pg_temp.id('N2'), pg_temp.id('XA'), pg_temp.id('CA'), 'activa');
create temp table base_con_ejecucion as
  select (select pg_catalog.count(*) from public.informes) as informes,
         (select pg_catalog.count(*) from public.ejecuciones) as ejecuciones;

-- Sentencia de inserción de un informe válido salvo lo que se cambie (cifra de tratados y problemas
-- como texto SQL, ejecución y cliente).
create function pg_temp.sql_informe(
  p_ejecucion pg_catalog.uuid, p_cliente pg_catalog.uuid,
  p_tratados pg_catalog.text default '5', p_problemas pg_catalog.text default '{}')
returns pg_catalog.text
language sql immutable
as $f$
  select pg_catalog.format(
    $s$ insert into public.informes
          (ejecucion_id, cliente_id, estado, modo, asistente, almacenamiento, version_prompt, frecuencia_horas,
           tratados, sin_tratar, borradores, documentos, facturas_pendientes, urgentes,
           comp_correo, comp_almacenamiento, comp_contexto, comp_registro, problemas)
        values (%L, %L, 'ok', 'desatendido', 'claude', 'drive', '1.2.0', 24,
                %s, 10, 2, 1, 0, 0, true, true, true, true, %L) $s$,
    p_ejecucion, p_cliente, p_tratados, p_problemas);
$f$;
grant execute on function pg_temp.sql_informe(pg_catalog.uuid, pg_catalog.uuid, pg_catalog.text, pg_catalog.text) to public;

create temp table casos (n pg_catalog.int4 primary key, descripcion pg_catalog.text not null, sentencia pg_catalog.text not null);
grant all on table pg_temp.casos to public;
insert into pg_temp.casos (n, descripcion, sentencia) values
  (1, 'un código fuera del catálogo',
      pg_temp.sql_informe(pg_temp.id('N2'), pg_temp.id('CA'), '5', '{no_existe}')),
  (2, 'un código repetido',
      pg_temp.sql_informe(pg_temp.id('N2'), pg_temp.id('CA'), '5', '{sin_contexto,sin_contexto}')),
  (3, 'más de cinco códigos',
      pg_temp.sql_informe(pg_temp.id('N2'), pg_temp.id('CA'), '5',
        '{sin_acceso_correo,sin_acceso_almacenamiento,sin_contexto,registro_no_guardado,error_borrador,error_etiquetado}')),
  (4, 'texto donde va una cifra',
      pg_temp.sql_informe(pg_temp.id('N2'), pg_temp.id('CA'), $t$'doce'$t$, '{}')),
  (5, 'una cifra fuera de rango',
      pg_temp.sql_informe(pg_temp.id('N2'), pg_temp.id('CA'), '1001', '{}')),
  (6, 'un cliente distinto del de su ejecución',
      pg_temp.sql_informe(pg_temp.id('N2'), pg_temp.id('CB'), '5', '{}')),
  (7, 'una ejecución cuyo cliente no es el de su conexión',
      pg_catalog.format($s$ insert into public.ejecuciones (conexion_id, cliente_id, estado_servido)
                            values (%L, %L, 'activa') $s$, pg_temp.id('XA'), pg_temp.id('CB')));

-- SQLSTATE y mensaje del error de una sentencia (o 'sin_error'). Con p_deshacer, la sentencia que
-- tiene éxito se deshace (el subbloque lanza un error propio y lo atrapa): para el caso positivo.
create function pg_temp.resultado_de(p_sql pg_catalog.text, p_deshacer pg_catalog.bool default false) returns pg_catalog.text
language plpgsql
as $f$
begin
  execute p_sql;
  if p_deshacer then
    raise exception 'deshacer_caso_positivo';
  end if;
  return 'sin_error';
exception when others then
  if p_deshacer and sqlerrm operator(pg_catalog.=) 'deshacer_caso_positivo' then
    return 'sin_error';
  end if;
  return sqlstate || '|' || sqlerrm;
end;
$f$;

-- Dueño: el SQLSTATE exacto que da la estructura (aserciones 1 a 7).
--   23514 check_violation (disparadores de validación, check de problemas y de rango),
--   22P02 invalid_text_representation (texto donde va una cifra), 23503 foreign_key_violation
--   (la clave ajena compuesta (ejecucion_id, cliente_id)).
select is(pg_temp.resultado_de((select c.sentencia from pg_temp.casos c where c.n operator(pg_catalog.=) 1)),
          '23514|informe_problema_desconocido',
          '1 · dueño: un código fuera del catálogo se rechaza (CA-018) con su causa exacta');
select is(pg_temp.resultado_de((select c.sentencia from pg_temp.casos c where c.n operator(pg_catalog.=) 2)),
          '23514|informe_problema_repetido',
          '2 · dueño: un código repetido se rechaza (CA-018) con su causa exacta');
select is(pg_temp.resultado_de((select c.sentencia from pg_temp.casos c where c.n operator(pg_catalog.=) 3)),
          '23514|new row for relation "informes" violates check constraint "informes_problemas_check"',
          '3 · dueño: más de cinco códigos se rechaza (CA-018) con su causa exacta');
select is(pg_temp.estado_de((select c.sentencia from pg_temp.casos c where c.n operator(pg_catalog.=) 4)), '22P02',
          '4 · dueño: texto donde va una cifra se rechaza (CA-018)');
select is(pg_temp.resultado_de((select c.sentencia from pg_temp.casos c where c.n operator(pg_catalog.=) 5)),
          '23514|new row for relation "informes" violates check constraint "informes_tratados_check"',
          '5 · dueño: una cifra fuera de rango se rechaza (CA-018) con su causa exacta');
select is(pg_temp.estado_de((select c.sentencia from pg_temp.casos c where c.n operator(pg_catalog.=) 6)), '23503',
          '6 · dueño: un cliente distinto del de su ejecución se rechaza (CA-018)');
select is(pg_temp.resultado_de((select c.sentencia from pg_temp.casos c where c.n operator(pg_catalog.=) 7)),
          '23514|ejecucion_cliente_incoherente',
          '7 · dueño: una ejecución con cliente distinto del de su conexión se rechaza (CA-018) con su causa exacta');

-- service_role (clave secreta): los mismos siete casos (intentos bajo el rol; aserciones 8 a 14).
select pg_temp.como('SR');
select pg_temp.intentar('sr' || c.n::pg_catalog.text, c.sentencia) from pg_temp.casos c order by c.n;
select pg_temp.como('DUENO');

-- SQLSTATE exacto: 42501 (sin permiso de escritura); solo el caso 11 da 22P02, porque «doce» donde va
-- una cifra falla al analizar la sentencia, antes de llegar a los permisos (igual que la aserción 4).
select is(pg_temp.intento('sr1'), '42501', '8 · service_role: un código fuera del catálogo se rechaza con 42501 (CA-018)');
select is(pg_temp.intento('sr2'), '42501', '9 · service_role: un código repetido se rechaza con 42501 (CA-018)');
select is(pg_temp.intento('sr3'), '42501', '10 · service_role: más de cinco códigos se rechaza con 42501 (CA-018)');
select is(pg_temp.intento('sr4'), '22P02', '11 · service_role: texto donde va una cifra se rechaza con 22P02 (CA-018)');
select is(pg_temp.intento('sr5'), '42501', '12 · service_role: una cifra fuera de rango se rechaza con 42501 (CA-018)');
select is(pg_temp.intento('sr6'), '42501', '13 · service_role: un cliente distinto del de su ejecución se rechaza con 42501 (CA-018)');
select is(pg_temp.intento('sr7'), '42501', '14 · service_role: una ejecución con cliente distinto del de su conexión se rechaza con 42501 (CA-018)');

-- 15 · Caso positivo (m-4): la sentencia base, sin nada roto, se inserta; se deshace en su subbloque.
select is(
  pg_temp.resultado_de(pg_temp.sql_informe(pg_temp.id('N2'), pg_temp.id('CA'), '5', '{}'), true),
  'sin_error',
  '15 · la sentencia base de un informe válido se inserta (CA-018: los rechazos de arriba lo son por lo que cambia cada caso)');

-- 16 · Ningún intento dejó filas: informes y ejecuciones, como antes de empezar (más la ejecución N2 del montaje).
select is(
  (select (select pg_catalog.count(*) from public.informes) - b.informes || ':' ||
          (select pg_catalog.count(*) from public.ejecuciones) - b.ejecuciones
     from pg_temp.base_con_ejecucion b),
  '0:0',
  '16 · tras los catorce intentos no hay ninguna fila nueva en informes ni en ejecuciones (CA-018, REQ-046)');

-- 17 a 30 · CA-017: cada propiedad del contrato frente al catálogo (0 diferencias).
select is(pg_temp.diferencias_contrato('estado'), '', '17 · contrato: estado (lista cerrada) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('modo'), '', '18 · contrato: modo (lista cerrada) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('asistente'), '', '19 · contrato: asistente (lista cerrada) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('almacenamiento'), '', '20 · contrato: almacenamiento (lista cerrada) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('version_prompt'), '', '21 · contrato: version_prompt (formato y longitud) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('frecuencia_horas'), '', '22 · contrato: frecuencia_horas (rango) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('tratados'), '', '23 · contrato: tratados (rango) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('sin_tratar'), '', '24 · contrato: sin_tratar (rango) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('borradores'), '', '25 · contrato: borradores (rango) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('documentos'), '', '26 · contrato: documentos (rango) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('facturas_pendientes'), '', '27 · contrato: facturas_pendientes (rango) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('urgentes'), '', '28 · contrato: urgentes (rango) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('comprobaciones'), '', '29 · contrato: comprobaciones (cuatro booleanos) = catálogo (CA-017)');
select is(pg_temp.diferencias_contrato('problemas'), '', '30 · contrato: problemas (lista del catálogo, máximo 5, sin repetir) = catálogo (CA-017)');

select * from finish();
rollback;
