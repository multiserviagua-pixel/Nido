# T-114, paso 2 (AR-05) en Supabase `Nido`: verificadores SCRAM

Fecha: 23/11/2026. Ejecutó la coordinación en el editor SQL de `Nido` (eu-north-1), con los verificadores que calculó el responsable en su máquina (`scripts/conector/verificador-scram.mjs`). No se manejó ninguna contraseña en claro (art. 4). Orden de los verificadores recibida: primero `conector_prueba_mcp`, después `conector_prueba_gestion` (según se le indicó).

| Comprobación | Esperado | Obtenido |
| --- | --- | --- |
| `alter role conector_prueba_mcp password '<verificador>'` y lo mismo con `conector_prueba_gestion` | Sin error | «Success. No rows returned» |
| `select rolname, rolpassword is not null, rolpassword like 'SCRAM-SHA-256$%' from pg_authid where rolname like 'conector_prueba_%'` | `true` y `true` en ambos | `conector_prueba_gestion`: true, true; `conector_prueba_mcp`: true, true |

No se ejecutó la consulta a `pg_stat_statements` (su salida no se copia a evidencias).

## Falta (persona)
El responsable pone `CONECTOR_BD_URL` (rol `conector_prueba_mcp`) y `AUTORIZACION_BD_URL` (rol `conector_prueba_gestion`) en Vercel `pre-nido`, puerto 6543, solo Production. Si el orden de los verificadores estuviera cruzado, el fallo aparecerá al probar la conexión (T-114 a y b) y se corrige repitiendo este paso.
