do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- M10 · datos_de_referencia (función 010, diseño D-1 y D-3; §10 de
-- docs/MODELO-DATOS.sql)
--
-- La fila única de ajustes_globales (sin pausa global, Stripe en observación) y el
-- catálogo cerrado de problemas del informe (contratos/informe.schema.json, A-14).
-- Son datos del producto, no de un cliente: no hay contenido de correo ni datos
-- personales (art. 1). Las descripciones son texto de HumanaIA y pasan el formato
-- TP de D-7.
--
-- Escrita como dueño (postgres, guarda de rol): los disparadores de auditoría solo
-- miran a otros roles, así que no deja filas en auditoria (D-3). El catálogo lo
-- cambia después el superadmin por la API, con auditoría.
--
-- No usa on conflict: si ya existe una fila de ajustes o un código, falla y no
-- cambia nada, en lugar de aceptar datos que no son los de referencia.
-- Su reversión borra exactamente estas filas, como dueño.
-- Forma de D-1 (L 11, L 13 y L 14), como M01 a M09.
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  insert into public.ajustes_globales (id, pausa_global, stripe_en_observacion)
  values (true, false, true);

  insert into public.catalogo_problemas (codigo, descripcion) values
    ('sin_acceso_correo',           'No pudo entrar al correo'),
    ('sin_acceso_almacenamiento',   'No pudo entrar al almacenamiento en la nube'),
    ('sin_contexto',                'No encontró o no pudo leer el archivo de contexto'),
    ('registro_no_guardado',        'No pudo dejar el registro de la revisión'),
    ('error_borrador',              'No pudo crear un borrador'),
    ('error_guardar_documento',     'No pudo guardar un documento'),
    ('error_etiquetado',            'No pudo etiquetar un correo'),
    ('limite_correos_alcanzado',    'Quedaron correos sin tratar por el máximo por revisión'),
    ('factura_requiere_acceso',     'Una factura por enlace pide identificarse'),
    ('otro_agente_detectado',       'Hay otro agente tratando el correo de la misma cuenta'),
    ('conector_humanaia_inestable', 'El conector de HumanaIA falló y se reintentó'),
    ('otro',                        'Problema no catalogado');

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
