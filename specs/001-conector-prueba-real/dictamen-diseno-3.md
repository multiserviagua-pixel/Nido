# 001 · Dictamen de seguridad del diseño (tercera vuelta)

Autor: `auditor-seguridad` · 19/11/2026 · Sobre: `diseno.md`, tercera versión; solo lo cambiado (D-023). Transcrito por el orquestador.

**Veredicto: APTO CON CONDICIONES.** Sin bloqueantes. De 18 puntos, 17 cerrados; M-5 parcial por N-1 (MAYOR). Condiciones: corregir N-1 antes de las tareas del paso 13 y de PRUEBA-023; P1 con respuesta expresa del responsable; R-7 respondido antes del paso 6.

Comprobado: `comprobar-specs` SUPERADO; `npm view`: `postgres` 3.4.9 (05/04/2026), `@modelcontextprotocol/server` y `client` 2.4.0 (23/10/2026, procedencia SLSA), `ajv` 8.20.0 (24/04/2026), las tres con ≥7 días; `@electric-sql/pglite`: la última con ≥7 días es la 0.5.16 (09/11/2026), la 0.5.17 es de hoy. Leído `postgres` 3.4.9 (`src/connection.js` l. 275-286, `src/index.js` l. 443-487): con `ssl` como objeto pasa a `tls.connect` con `servername` = host, Node verifica cadena y nombre; el `ssl` explícito prevalece sobre `sslmode` de la URL. M-6 se sostiene.

| Hallazgo | Estado | Dónde |
| --- | --- | --- |
| B-1 | CERRADO | l. 178, 165; PRUEBA-051 |
| M-1 | CERRADO | C-4 (l. 20); l. 89; PRUEBA-009 con navegador real; V-6 |
| M-2 | CERRADO | pasos 1 y 9, R-7; PRUEBA-049, 050 |
| M-3 | CERRADO | l. 95; PRUEBA-012, 019 |
| M-4 | CERRADO, decisión en P1 | l. 130; PRUEBA-022; lo concedido a `PUBLIC` fuera del esquema lo decide el responsable; `NOINHERIT` no impide lo de `PUBLIC` |
| M-5 | PARCIAL | estado terminal (l. 99) correcto; el paso 13 (l. 176) no consigue lo que declara: N-1 |
| M-6 | CERRADO | l. 126, 305; PRUEBA-018 |
| m-1 y anotación | CERRADO, pendiente de P1 | l. 117; aclaraciones l. 284 |
| m-2 a m-9, amenazas | CERRADOS | m-3 como límite declarado |

## Hallazgos nuevos
- **N-1 · MAYOR · El paso 13 no deja «todo en 503» (l. 176, 242).** Arts. 3 y 13; RD-076, CAD-046. En Vercel borrar una variable no cambia el despliegue en servicio (hay que redesplegar); los despliegues anteriores conservan valores y `volver-atras` los recupera. Las rutas que no consultan el almacén (`/.well-known/*`) seguirán en 200, así que PRUEBA-023 no puede superarse honestamente. `nologin` no corta sesiones abiertas (sospecha: el agrupador las reutiliza). **Corrección:** (1) `cerrar_prueba`; (2) borrar todo el grupo «conector», no solo `OPERACION_HUELLA`; (3) `desplegar preproduccion` del mismo commit; (4) `alter role … nologin password null` y `pg_terminate_backend` de las sesiones de los dos roles. Dejar escrito que la barrera es la base de datos (estado terminal, roles sin acceso), no la variable. **Prueba:** tras el redespliegue, todas las rutas del conector dan 503, metadatos incluidos; `pg_stat_activity` 0 sesiones de los dos roles; un despliegue anterior tampoco obtiene `emitido`.
- **N-2 · MENOR (sospecha) · `CONNECTION LIMIT 10` (l. 130).** postgres.js abre hasta 10 conexiones por instancia (`max` por defecto); el agrupador tiene su propio grupo por usuario; si pasa de 10 las sobrantes fallan con 503 (seguro, pero falsos negativos en PRUEBA-007/008 y paso 10). **Corrección:** `max` 1 o 2 en el cliente; en V-10 comprobar el tamaño del grupo. **Prueba:** PRUEBA-008 por el 6543 con 10 a la vez, sin errores de límite del rol.
- **N-3 · MENOR · URL de BD con parámetros (l. 111, 126).** postgres.js envía los parámetros de consulta no reconocidos como parámetros de arranque (`index.js` l. 487). **Corrección:** `configuracion.ts` rechaza `CONECTOR_BD_URL` y `AUTORIZACION_BD_URL` con consulta; `ssl` siempre por código. **Prueba:** PRUEBA-018 con `?sslmode=disable` y `?options=…` → `configuracion_conector_invalida`.
- **N-4 · MENOR · C-4 en `next.config.ts`.** Si dos reglas de `headers()` ponen la misma cabecera gana la última; la excepción de `/oauth/autorizar` va por orden o con exclusión en `source`. PRUEBA-009 con navegador real lo detecta; añadir la excepción al inventario de cabeceras.

## En manos del responsable
P1: respuesta expresa a `readOnlyHint: false`; qué hacer si PRUEBA-022 halla concesiones ajenas a `PUBLIC`. R-7 antes del paso 6. R-1 y R-2. Aceptar el límite m-3.

## No comprobado
Si el certificado del agrupador encadena con la raíz de Supabase y si guarda contraseñas en caché (V-10); `Origin` de navegadores reales con `same-origin`; qué hay en `Nido` y el tamaño del grupo del agrupador; conectores de la cuenta Max; URL del documento CIMD de Claude. No hay código: ninguna prueba de comportamiento ejecutada.

Fuentes de N-1: Vercel, gestión de variables de entorno y rotación de secretos (docs.vercel.com).

**Sin bloqueantes.**
