# T-114 · Paso 1 en `Nido` (estado, semilla y comprobaciones)

Ejecutado el 23/11/2026 por la coordinación, en el editor SQL de Supabase del proyecto `Nido` (`wdfnzammihohdehtnspv`, eu-north-1), con la sesión que abrió el responsable y por su delegación expresa. Sin contraseñas, URL ni salida de `pg_stat_statements` en esta evidencia (art. 4).

## Origen del SQL

Cargado desde GitHub fijado al commit `f18ec10` y comprobada su huella SHA-256 en el navegador antes de ejecutarlo:

| Archivo | SHA-256 esperado (repositorio) | Coincide |
| --- | --- | --- |
| `supabase/conector-prueba/001_estado.sql` (incluye T-123 (b)) | `a476628fdd1f89779e69b1ec2361ea966c881c68ef011dcb687be45950e1634a` | Sí |
| `supabase/conector-prueba/semilla.sql` | `47d953cdfb1bc1431a4256563c5c71b4962255119e55f44b5f2004435ebfc888` | Sí |

Antes de aplicar: el esquema `conector_prueba` no existía (primera aplicación). El editor avisó de «operaciones destructivas» (las revocaciones del script) y se confirmó.

## Resultados

| Paso | Esperado | Obtenido | Resultado |
| --- | --- | --- | --- |
| 1.1 `001_estado.sql` | Sin error | «Success. No rows returned» | Superado |
| 1.2 `semilla.sql` | Sin error | «Success. No rows returned» | Superado |
| 1.3 Licencias | `A` y `B`, ambas `activa` | `A` activa, `B` activa | Superado |
| 1.4 Roles del conector | `login` true, resto false, límite 10 | `conector_prueba_mcp` y `conector_prueba_gestion`: login true; super, bypassrls, createrole, createdb y replicación false; límite 10 | Superado |
| 1.4 Rol `postgres` | `rolsuper` false y `rolbypassrls` false | `rolsuper` false; **`rolbypassrls` true** (también createrole, createdb y replicación true; así viene en Supabase) | **No superado: riesgo aceptado (ver abajo)** |
| 1.5 Tablas | RLS activa y 0 políticas en todas | 13 tablas, todas con RLS y 0 políticas | Superado |
| 1.6 Registro por rol (A-12) | Los cuatro ajustes en `rolconfig` de los dos roles | Los cuatro presentes en ambos, junto a `statement_timeout=5s`, `idle_in_transaction_session_timeout=10s` y `lock_timeout=2s` del script | Superado |
| 1.7 Dueños | Un solo dueño; ningún objeto de los roles del conector | Dueño único `postgres`, que es el rol del editor (con login) | Superado |

## Riesgo residual aceptado

`postgres` tiene `BYPASSRLS` en Supabase y la plataforma no permite quitárselo. El paso 1.4 manda parar y preguntar. Respuesta expresa del responsable (23/11/2026): «Sí, aceptar y seguir (Recomendado)» y «deja anotado como riesgo y recuérdame para que veamos como quitarlo». Alcance: solo quien entre en el editor de Supabase o tenga la contraseña de `postgres` puede saltarse la RLS; los dos roles del conector se crean sin ese permiso. Anotado en `docs/TECNOLOGIAS.md` (D-044) con revisión pendiente.

## Falta (paso 2, personas)

AR-05: el responsable genera los dos verificadores SCRAM con `node scripts/conector/verificador-scram.mjs` y pasa solo los verificadores; la coordinación ejecuta los `alter role … password`; el responsable pone `CONECTOR_BD_URL` y `AUTORIZACION_BD_URL` (puerto 6543) en Vercel `pre-nido`.
