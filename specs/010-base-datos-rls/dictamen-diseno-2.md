# 010 · Dictamen de seguridad del diseño (vuelta 2)

Auditor: `auditor-seguridad` · 20/11/2026 · Objeto: `specs/010-base-datos-rls/diseno.md`, leído entero. Guardado por el orquestador a partir del informe del auditor (solo lectura).

**Veredicto: APTO CON CONDICIONES.** 0 bloqueantes. Resueltos B-1 y los dos ALTO de la vuelta 1. Nuevos: 1 ALTO, 2 MEDIO, 5 BAJO.

## 1. Hallazgos de la vuelta 1

| Hallazgo | Estado | Dónde |
| --- | --- | --- |
| B-1 (`search_path`, `pg_temp`) | CORREGIDO en el diseño; pendientes N-1 y N-3 | D-3 «Regla para toda función de `privado`» (`pg_catalog, pg_temp`, resto calificado); pruebas 01, 04 (+7), L 13; alternativa `''` descartada |
| A-1 (permisos por defecto globales) | CORREGIDO | D-4 pasos 1, 2, 4 y 5; pruebas 01 y 04 (+6) |
| A-2 (herencia de `PUBLIC`) | CORREGIDO, a falta de P1-g | D-9, lista residual R-1 a R-4; prueba 04 (26 aserciones); propuesta 30 |
| M-1 (modo réplica) | CORREGIDO | D-3 `enable always`; 01 `tgenabled = 'A'`; 05 (+2). Riesgo residual de `postgres` (P1-h) |
| M-2 (escritor futuro sin auditar) | CORREGIDO, con efecto N-2 | D-3 `WHEN (current_user <> 'postgres')`; 06 (+2) |
| M-3 (contraseña en registros) | CORREGIDO; verificar en tarea 14 | D-9 `\password` dentro de `begin … commit` con `set local` |
| M-4 (guarda del seed) | CORREGIDO | D-10; L 9 |
| M-5 (negativos de «C») | CORREGIDO | D-5; 01 (2); 02 (+15) |
| M-6 (reversión) | CORREGIDO (ver N-8) | D-1; L 14; `ciclo` (+3) |
| M-7 (versión adelantada) | CORREGIDO como riesgo residual y requisito de fase 4 | D-8; P1-i; propuesta 31 |
| L-1 a L-6 | CORREGIDOS (L-3 ver N-7; L-6 ver N-6) | A-11; D-1; D-3; L 11 y L 12 |

Recuento de pruebas contrastado por el auditor: 01=23, 02=844, 03=91, 04=75, 05=103, 06=34, 07=29, 08=91, 09=28 (1.318); CI = 33. Cuadra.

**Ninguna entrada acepta un identificador de cliente** (art. 2): las `mcp_*` reciben HMAC, `p_ejecucion_id`, `p_informe`, `p_orden_id`, cruzados con la conexión o el cliente del token; `registrar_auditoria(p_cliente)` y `licencia_vigente(p_licencia_id)` no son ejecutables por nadie; en dashboards `cliente_id` solo entra como columna de inserción del superadmin (`es_admin()`).

## 2. Hallazgos nuevos

- **N-1 · ALTO** · Arts. 3 y 14. `search_path = ''` sigue mandado en `.claude/agents/ingeniero-bd.md:23`, `.claude/skills/migracion-bd/SKILL.md:26`, `docs/SEGURIDAD.md:67`, `docs/TECNOLOGIAS.md:61`, `docs/MODELO-DATOS.sql` (9 funciones) y en los diseños 001 (`:136`), 021 (`:336`), 024 (`:119`) y 025 (`:117-118`). La 001 crea en `Nido` funciones `security definer` con `''` ejecutables por `conector_prueba_mcp` y `conector_prueba_gestion`; con `temporary` heredado de `PUBLIC` se ejecutaría código como su dueño. Corrección: ampliar propuesta 29 a todos esos documentos; ampliar 01 y L 13 a toda función `security definer` o de disparador de dueño `postgres` en cualquier esquema que no sea de la plataforma; ejecutar esa consulta en `Nido` (tarea 14); avisar a la 001 antes de que aplique SQL en `Nido`.
- **N-2 · MEDIO** · Arts. 3 y 6. `current_user <> 'postgres'` deja sin auditar funciones `security definer` de dueño `postgres` invocadas como `authenticated` (caso 025 D-6, OR-1 y OR-2). Corrección: (a) regla en D-3 de que toda función `security definer` que escriba en tabla auditada, salvo las 3 `mcp_*` y `al_dar_de_baja`, llame a `registrar_auditoria`, y 01 las lista; o (b) condición con `current_setting('role', true) in ('authenticated','service_role')` (VERIFICAR en CI). Prueba en 06.
- **N-3 · MEDIO** · Arts. 2 y 3. La prueba de 04 solo suplanta 4 tipos base por los caminos de las `mcp_*`; un nombre sin calificar de `public` o `privado` se resuelve en `pg_temp` (tabla `tokens`, dominio `estado_cliente`). Corrección: sombras en `pg_temp` generadas desde el catálogo en `ayudas/`, antes de todos los archivos; en 04, con token válido, recorrer cada rama que escribe.
- **N-4 · BAJO** · Art. 3. Aserciones de `pg_default_acl` e instantáneas cubren pocos destinatarios. Corrección: `aclexplode` en 01 sobre `relacl`, `attacl`, `proacl`, `nspacl` (destinatarios ⊆ {`postgres`, `authenticated`, `service_role`, `conector`}; `usage` en `privado` = {`authenticated`, `conector`}); en 04, `CREATE` falso para `conector`.
- **N-5 · BAJO** · Art. 3. `pg_largeobject`: supervisar que `pg_largeobject_metadata` no tenga filas con `lomowner = 'conector'::regrole`; anotarlo en R-4.
- **N-6 · BAJO** · Arts. 1 y 4. Errores del motor (`DETAIL: Failing row contains`) llegan al cliente y al registro. Corrección: declararlo; las `mcp_*` capturan y devuelven solo un código; comprobar en `Nido` qué registra (tarea 14).
- **N-7 · BAJO** · Arts. 3 y 11. La prueba textual de reversiones se elude con identificadores entre comillas, `drop owned`, `reassign owned`, `drop trigger … on public.auditoria`, `disable trigger`, `set session_replication_role`. Corrección: normalizar mayúsculas y comillas y añadir esos patrones.
- **N-8 · BAJO** · Art. 3. `app.entorno` y `app.reversion_protegida` son variables de sesión: guardas contra accidentes, no contra quien actúa a propósito con `postgres`. Decirlo en D-1 y D-10.

## 3. Condiciones

1. P1-f decidida con el alcance de N-1 antes de la tarea 3; la 001 lo recibe antes de aplicar SQL en `Nido`.
2. N-2 y N-3 entran en el diseño o en las tareas 3, 5, 6 y 11 antes de cerrarlas.
3. Decidir P1-g; en la tarea 11 el auditor acepta nominalmente la enumeración de R-2 y R-3.
4. La tarea 14 verifica M-3 (`\password` con `set local`).

## No comprobado por el auditor

B-1 en el PostgreSQL real de Supabase (solo PGlite); si las funciones de la 001 están aplicadas en `Nido`; `current_setting('role')` dentro de `security definer` desde PostgREST; `pg_default_acl` real de `Nido`; `log_statement` con `set local` y `\password` en transacción; si la CLI envuelve cada migración en transacción; qué registra Supabase del `DETAIL`.
