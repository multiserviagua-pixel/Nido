# 010 · Dictamen de seguridad del diseño (vuelta 1)

Auditor: `auditor-seguridad` · 20/11/2026 · Objeto: `diseno.md` (PROPUESTA). Transcrito por el orquestador, porque el auditor es de solo lectura. Las comprobaciones del auditor en PGlite 0.5.17 son un indicio, no evidencia de CA (art. 13).

**Veredicto: NO APTO para P1.** 1 BLOQUEANTE, 2 ALTO, 7 MEDIO, 6 BAJO. B-1, A-1 y A-2 se corrigen antes del plan; el resto entra como cambios del diseño.

## Amenazas no cubiertas o mal cubiertas

| Amenaza | Control | Prueba |
| --- | --- | --- |
| Credencial de `conector` filtrada: secuestro de tipos por `pg_temp` y SQL como `postgres` (A-08, A-09) | `search_path = pg_catalog, pg_temp` en todo `privado` | 04: dominios en `pg_temp`, luego las tres `mcp_*`: 0 efectos |
| Objeto nuevo en un esquema nuevo recibe permisos globales por defecto (REQ-011) | Revocación global, sin `in schema` | CA-008 con un esquema creado en la transacción |
| `session_replication_role = replica` desactiva inmutabilidad y auditoría | `ENABLE ALWAYS TRIGGER` | 01: `tgenabled = 'A'` |
| Un rol escritor nuevo (`service_role`, fases 4 a 6) no queda auditado | `WHEN (current_user <> 'postgres')` | 06 con un rol nuevo de prueba |
| Contraseña del conector en los registros | `\password` (huella calculada en el cliente) | Revisión del procedimiento |
| Seed cargado fuera de desarrollo | La guarda exige lista de entornos permitidos | Prueba local de la guarda |
| La vuelta atrás decide por un `--entorno` declarado, no por el destino real | Entorno derivado del destino | Prueba local |
| `service_role` registra antes que el despliegue una versión con número legítimo | El despliegue falla si la huella existente es distinta | Fase 4 |

## Hallazgos

**B-1 · BLOQUEANTE** · Arts. 2 y 3 · D-9, D-3, M07, M08, prueba 01 («`search_path` vacío»). Con `search_path = ''`, `pg_temp` se busca primero para relaciones y tipos. `conector` tiene `TEMPORARY` por `PUBLIC` (Supabase no lo deja revocar). En una sola transacción puede crear `pg_temp.mal(uuid)`, un dominio `pg_temp.uuid` con `check` que la llama y ejecutar `privado.mcp_…('token-falso')`: la comprobación corre como dueño. Reproducido por el auditor: inserción en tabla ajena con token inválido; con `search_path = pg_catalog, pg_temp`, 0 efectos. Impacto: acceso total a todos los clientes y alteración de la auditoría. Corrección: todas las funciones de `privado` (`security definer` y de disparador) con `set search_path = pg_catalog, pg_temp`; todo lo de `public` calificado; la aserción de 01 comprueba ese valor; prueba nueva en 04 con dominios `uuid`, `jsonb`, `text`, `timestamptz` en `pg_temp`, token falso y válido, 0 filas de marca. Enmendar `.claude/rules/bd.md` y el punto 6 de ADR-0003 (lo hace una persona, art. 14: anotar en `propuestas.md`).

**A-1 · ALTO** · Art. 3, REQ-011 · D-4, CA-008. No se puede revocar por esquema lo concedido globalmente (docs de PostgreSQL; confirmado en PGlite). D-4 solo revoca por esquema y CA-008 no prueba otros esquemas. Corrección: `alter default privileges for role postgres revoke all on tables, sequences, functions from public, anon, authenticated, service_role, conector;` sin `in schema`; aserción sobre `pg_default_acl` de `postgres`; CA-008 con un esquema nuevo.

**A-2 · ALTO** · Art. 3, REQ-012 · D-9, 04 («permisos exactos»). `conector` hereda de `PUBLIC`: `TEMPORARY`, `lo_*`, `usage` sobre `net` si `pg_net` está activo, funciones de `auth` y `extensions`. CA-009 («cualquier otra función, rechazada») no es literalmente posible y el diseño no lo declara. Corrección: escribir la lista residual aceptada; prueba de catálogo sobre todos los esquemas no del sistema; comprobar `pg_net` en `Nido`.

**M-1 · MEDIO** · Art. 9, REQ-015/016 · D-3, D-1 (M04, M05), fila «El dueño desactiva un disparador». Los disparadores normales no corren con `session_replication_role = replica`; la prueba de estructura no detecta ni eso ni una desactivación pasajera. Corrección: `enable always trigger` en los cuatro disparadores de solo inserción y sin vaciado, con aserción; declarar el riesgo residual (`postgres` y `supabase_admin` pueden cambiar tablas con DDL; detección por `log_statement = ddl` y la 014).

**M-2 · MEDIO** · Arts. 3 y 6, REQ-017 · D-3, tabla de clases. `WHEN (current_user = 'authenticated')` deja sin auditar a cualquier escritor futuro. Corrección: `current_user <> 'postgres'` (cubre también REQ-061, porque las funciones del conector corren como `postgres`); prueba en 06 con un rol temporal.

**M-3 · MEDIO** · Art. 4 · D-9, `docs/operacion/rol-conector.md`. `alter role … password` queda en claro en los registros si falla, va entre `$$` o es SQL dinámico; el editor del panel guarda historial. Corrección: `\password conector` de `psql` dentro de la transacción que suprime el registro (documentada por Supabase); nunca el editor del panel.

**M-4 · MEDIO** · Art. 3 · D-10. La guarda `= 'produccion'` deja pasar el seed si la variable no está fijada; el seed crea administradores. Corrección: exigir `current_setting('app.entorno', true) in (…permitidos)`; usuarios del seed sin contraseña ni identidades; misma guarda en `volumen.sql`.

**M-5 · MEDIO** · Arts. 3 y 13 · D-6 y prueba 02. Las condiciones «C» no se prueban en negativo (`licencias.cliente_id`, `codigos_activacion.usado_en`, `catalogo_problemas.codigo`, `ordenes` a `confirmada`, `revocada_en` o `resuelta_en` devueltas a nulo, pertenencia cambiada por el dueño). Falta aserción de permisos exactos de `authenticated` y `service_role` (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN). Corrección: instantánea de permisos comparada con D-5 en 01 y unas 15 aserciones de transición; actualizar `declaradas.json`.

**M-6 · MEDIO** · Arts. 3 y 11 · D-1 (REQ-053), Flujo 5. `--entorno` es una entrada declarada; la reversión de M01 reabre los permisos por defecto sin comprobar que la base esté vacía; no se dice que las reversiones vayan en transacción. Corrección: entorno derivado del destino (referencias permitidas; si es desconocido, se niega); reversiones de M04 y M05 con guarda en SQL que solo acepta una marca de CI; M01 falla si queda algún objeto en `public` o `privado`; reversiones en `begin … commit`.

**M-7 · MEDIO** · Art. 9, A-10 y A-12 · D-8, fila A-10. Con la clave secreta se registra antes que el despliegue un «1.3» con texto cualquiera y su huella correcta. Corrección: requisito para la fase 4 (el despliegue falla si ya existe la versión con otra huella; el panel compara contra el manifiesto de la compilación) y riesgo residual declarado.

**BAJOS.** L-1 (A-11): la fila da por cubierta la «sesión robada»; `es_admin()` no comprueba `session_id`, va a la 021; corregir la fila. L-2 (D-1, M01): `privado.permisos_por_defecto_previos` sin RLS ni `revoke all` declarados y nace antes del cierre. L-3 (D-1): la prueba local de reversiones se elude con `cascade` sobre `privado.impedir_cambios` o `privado.auditar`, con `execute` o con `drop schema … cascade`; añadir esos patrones. L-4 (art. 9): `publicaciones` no tiene disparador de inmutabilidad. L-5 (D-3): «`cliente_id`: la licencia» es ambiguo; escribir «el cliente de la licencia». L-6: sin prueba local de que cada migración empieza con la guarda de rol; los mensajes de `validar_*` e `impedir_*` llevan solo el código, nunca el valor (A-15).

## Comprobaciones pedidas

- Matriz D-6: coherente con D-5 y con las políticas por operación; mínimo privilegio a nivel de API; faltan las pruebas de celdas «C» y TRUNCATE (M-5) y `conector` tiene permisos de más por `PUBLIC` (A-2).
- Identificador de cliente: ninguna entrada lo recibe; `registrar_auditoria(p_cliente)` y `licencia_vigente(p_licencia_id)` no son ejecutables por nadie (CA-007, CA-010).
- Auditoría y versiones: inalterables por la API; `conector` sí podría por B-1 y `postgres` por DDL o réplica (M-1).
- Reversión: no segura tal como está (M-6).
- Guarda de permisos por defecto: se elude con un esquema nuevo (A-1).

## No comprobado

B-1 en el PostgreSQL real de Supabase; si `postgres` puede fijar hoy `session_replication_role`; permisos por defecto globales y extensiones (`pg_net`) en `Nido`; cómo registra Supabase las sentencias de contraseña; la restauración de M01.
