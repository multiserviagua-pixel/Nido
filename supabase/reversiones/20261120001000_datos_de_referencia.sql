do $$ begin if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if; end $$;

-- =====================================================================
-- Reversión de M10 · datos_de_referencia
--
-- Falla con reversion_datos_modificados, sin cambiar nada, si la fila de ajustes ya
-- no es la de referencia (pausa_global activa o Stripe fuera de observación) o si
-- algún código de M10 ya no está tal cual lo creó (activo o descripción distintos):
-- son datos vivos que un superadmin ha tocado.
--
-- Borra, como dueño y sin auditoría (D-3), la fila de ajustes_globales y los doce
-- códigos del catálogo que puso M10. Los demás códigos que haya creado un
-- superadmin se quedan. Ninguna otra tabla se toca (el informe guarda los códigos
-- como texto, sin clave ajena). No nombra las tablas protegidas (L 10, N-7).
-- Misma forma que M01 (D-1).
-- =====================================================================

do $$
declare
  v_ruta_previa pg_catalog.text;
begin
  if current_user operator(pg_catalog.<>) 'postgres' then raise exception 'migracion_rol_no_permitido'; end if;
  v_ruta_previa := pg_catalog.current_setting('search_path');
  perform pg_catalog.set_config('search_path', 'pg_catalog, pg_temp', true);

  if exists (select 1 from public.ajustes_globales a
              where a.pausa_global or not a.stripe_en_observacion)
     or exists (
       select 1
         from public.catalogo_problemas c
         join (values
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
           ('otro',                        'Problema no catalogado')
         ) as r(codigo, descripcion) on r.codigo = c.codigo
        where not c.activo or c.descripcion <> r.descripcion)
  then
    raise exception 'reversion_datos_modificados';
  end if;

  delete from public.ajustes_globales;

  delete from public.catalogo_problemas
   where codigo in (
     'sin_acceso_correo', 'sin_acceso_almacenamiento', 'sin_contexto', 'registro_no_guardado',
     'error_borrador', 'error_guardar_documento', 'error_etiquetado', 'limite_correos_alcanzado',
     'factura_requiere_acceso', 'otro_agente_detectado', 'conector_humanaia_inestable', 'otro');

  perform pg_catalog.set_config('search_path', v_ruta_previa, true);
end $$;
