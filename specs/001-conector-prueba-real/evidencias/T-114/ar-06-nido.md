# AR-06 en Supabase `Nido`: reversión y reaplicación

Fecha: 23/11/2026. Ejecutó la coordinación en el editor SQL de `Nido` (eu-north-1), con confirmación expresa del responsable («Sí, confirmo», 23/11/2026) de borrar y recrear el esquema `conector_prueba`, que solo tenía datos de prueba y ninguna copia. El editor avisó de operaciones destructivas y se confirmó.

## Origen del SQL
Cargado desde GitHub fijado al commit `9327e8b4eae768ed596cd60fcf9a9a19f93bba75`, con la huella SHA-256 comprobada en el navegador contra la del repositorio:

| Archivo | SHA-256 | Coincide |
| --- | --- | --- |
| `001_estado.reversion.sql` | `ceb593eb1e31b5829fcad7b34f49e3061ebbe15268e859c099848807e11ee1a2` | Sí |
| `001_estado.sql` | `a476628fdd1f89779e69b1ec2361ea966c881c68ef011dcb687be45950e1634a` | Sí |
| `semilla.sql` | `47d953cdfb1bc1431a4256563c5c71b4962255119e55f44b5f2004435ebfc888` | Sí |

## Pasos y resultados
| Paso | Resultado |
| --- | --- |
| Cierre de las sesiones de los dos roles (`pg_terminate_backend`) y reversión | «Success. No rows returned» |
| `001_estado.sql` | «Success. No rows returned» |
| `semilla.sql` y los cuatro ajustes de registro por rol (A-12) | «Success. No rows returned» |

## Comprobación tras reaplicar
- Licencias: `A` activa, `B` activa.
- Roles `conector_prueba_mcp` y `conector_prueba_gestion`: `login` true, **contraseña: no** (`rolpassword` vacío), `bypassrls` false, límite 10.
- `rolconfig` de los dos: `statement_timeout=5s`, `idle_in_transaction_session_timeout=10s`, `lock_timeout=2s`, `log_min_messages=panic`, `log_min_error_statement=panic`, `log_parameter_max_length=0` y `log_parameter_max_length_on_error=0`.

## Para T-114 (c), versión más débil (honesta)
Las contraseñas locales de las pruebas de T-114 (a) se perdieron al cerrar la ventana de la terminal, así que **no se ha podido intentar conectar con la contraseña antigua**. Lo comprobado es que, tras revertir y reaplicar, los dos roles nacen sin contraseña y, por tanto, ninguna contraseña anterior puede conectar. T-114 (c) queda «superada en su versión débil», no en la completa.

## Falta
El responsable genera el par definitivo; la coordinación aplica los verificadores; el responsable sustituye `CONECTOR_BD_URL` y `AUTORIZACION_BD_URL` en Vercel (las actuales ya no conectan).
