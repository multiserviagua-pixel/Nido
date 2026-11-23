# T-114 (a): `npm run pruebas-bd` contra Supabase `Nido`

Fecha: 23/11/2026. Lo ejecutó el responsable en su máquina con dos contraseñas locales de un solo uso para las pruebas (verificadores SCRAM aplicados por la coordinación; ver `paso-2-nido.md`). La salida no lleva direcciones ni contraseñas.

| Comprobación | Resultado |
| --- | --- |
| Forma de las direcciones (agrupador de `eu-north-1`, puerto 6543, usuario del rol, sin consulta) | OK |
| Privilegios de `conector_prueba_mcp` (PRUEBA-022) | FALLA por concesiones ajenas a `PUBLIC` (AR-14), ver abajo |
| Privilegios de `conector_prueba_gestion` (PRUEBA-022) | FALLA por lo mismo |
| Roles de Supabase sin privilegios en `conector_prueba` | OK |
| Diez llamadas a la vez por el agrupador (PRUEBA-008) | OK |
| Certificado verificado con la raíz de Supabase; sin ella se rechaza | OK |

Resultado: 4 correctas y 2 fallidas. Ambos roles conectan por `[rol].[referencia]` en el agrupador, así que V-107 no falla.

## Concesiones ajenas halladas (AR-14)
Las dos pruebas fallidas listan lo mismo, para cada rol: uso del esquema `public`; lectura de `extensions.pg_stat_statements` y `extensions.pg_stat_statements_info`; y funciones ejecutables por `PUBLIC` en esquemas de Supabase (`auth` 4, `extensions` 40, `graphql_public` 1, `realtime` 18, `storage` 20). Son los permisos por defecto de Supabase. Ningún rol del conector tiene acceso a tablas del esquema `conector_prueba`.

## Decisión del responsable (23/11/2026)
Respuesta expresa a «¿Aceptas esos permisos por defecto de Supabase como línea base, sin revocar nada?»: «Sí, aceptar». Conforme al ADR-0007 punto 12 (c), los esquemas gestionados por Supabase no se tocan. Queda aceptada como línea base de la 001, vigente hasta su cierre; la fase 2 la reevalúa. Esta ejecución no revoca nada, así que la restauración de ACL del punto 12 (e) no se ha ejercitado.

PRUEBA-022 (L) queda como **aceptada con la línea base**, no como superada sin salvedades. Falta el resto de T-114: (b) ciclo con el cliente oficial y (c) tras AR-06.
