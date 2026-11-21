-- Reversión de 001_estado.sql (artículo 11): borra el esquema `conector_prueba` con todo su contenido (tablas,
-- tipos y las funciones validar_acceso, registrar_suceso, mcp_obtener_instrucciones, mcp_enviar_informe,
-- mcp_confirmar_orden, informe_es_valido y las de autorización y operación de T-107, con el disparador
-- que impide reabrir licencias tras el cierre) y los dos roles.
-- Transaccional y reejecutable (no falla si ya está revertido). Antes de aplicarla, una persona cierra las sesiones de los roles (LEEME.md). Los datos no se recuperan: la prueba no tiene copias.
begin;
drop schema if exists conector_prueba cascade;
drop role if exists conector_prueba_mcp;
drop role if exists conector_prueba_gestion;
commit;
