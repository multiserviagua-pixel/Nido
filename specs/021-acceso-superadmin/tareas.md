# 021 · Tareas

Autor: `arquitecto` · 21/11/2026 · Fuente: `diseno.md` (5.ª vuelta, sin ver por el auditor) y la revisión del `revisor` (21/11). Orden, riesgos, bloqueos, pruebas y dependencias: `plan.md`. Ninguna prueba se ha ejecutado.

Un agente por tarea. `[P]`: en paralelo (sin archivos compartidos). «010·T-nnn»: tarea de otra función. **Persona**: cuentas, secretos, scripts, firma o prueba manual. Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Partes** (D-029): (a), (b)… en ese orden; por tarea, un `verificar`, una revisión, un dictamen si RC es `C` o `D` y una aprobación (D-036). Una parte «aparte» se integra sola, con los suyos.
- **Prueba primero y qué prueba bloquea:** `plan.md`, «Cómo se integra un par prueba–código», puntos 1, 2 y 4 (las R de T-009 y T-018 bloquean integrar, M-19).
- **RC:** `C` = ruta crítica (`plan.md`, «Rutas críticas tocadas»); `D` = no crítica, con dictamen; `R` = solo `revisor`. **Res.**: ruta reservada; la aprobación (D-036) la nombra.
- **Rutas:** `la/` = `src/lib/acceso/`; `ls/` = `src/lib/supabase/`; `tu/` = `tests/unit/acceso/`; `te/` = `tests/e2e/acceso/`; `ev/` = `evidencias/` de esta función.
- **A-13:** si T-002 no confirma los puntos 12 o 13, lo marcado «A-13» se bloquea y vuelve al arquitecto (`plan.md`, «Lo que bloquea»).
- **A-15** (abierta, del responsable): lo marcado «A-15» espera su respuesta; el resto sigue. Sin marca, las funciones actúan como «no hay marca» y AM-08a es riesgo mayor pendiente de su aceptación escrita (M-20); añadirla es migración nueva con dictamen, que quita las firmas antiguas con `drop` y `revoke` (m-45).
- **Evidencias del servicio real (M-18):** en T-001, T-002, T-004, T-009, T-012 y T-018, solo booleanos, recuentos, nombres de tablas y columnas y huellas truncadas (8 hexadecimales) de identificadores, nunca de códigos ni contraseñas. Nunca tokens, cookies, hashes, semillas, URI `otpauth`, códigos ni el SVG o QR. En T-003, T-015 y T-016, además, nunca enlaces, cabeceras ni direcciones de un correo, ni capturas de él. No se integran antes que T-017 (a).
- **Usuarios de prueba:** ficticios, con direcciones de un dominio reservado para pruebas (RFC 2606), nunca de personas reales (art. 1); el buzón del envío real de T-003 no figura en la evidencia.
- **Clave secreta y propietario en pruebas (m-39):** solo los del proyecto de desarrollo, puestos por una persona en el gestor local; el agente los carga del entorno sin leerlos, imprimirlos ni copiarlos. La cadena del propietario solo aplica migraciones; las tablas del servicio se leen (T-P2.12) desde funciones de `privado` llamadas como `acceso` o como el usuario de prueba.

## Bloque 1 · Previas

### T-001 `[P]` · T-P1: códigos de recuperación del servicio
`qa` · D · pendiente · Depende de: T-017 (a) (para integrar la evidencia) · **Persona:** proyecto de desarrollo del servicio y clave en el gestor local (m-39) · REQ-072, REQ-073, REQ-074, REQ-075, REQ-076, REQ-079, REQ-083 · CA-032
- Los 10 criterios de `plan.md`, «Tareas previas», contra el servicio real, con usuarios de prueba ficticios. Resultado: «se usa» o «alternativa»; ante la duda, alternativa. Prueba: PRUEBA-001; si se usa, PRUEBA-046 escrita para la batería.
- Archivos: `ev/T-001/`.

### T-002 `[P]` · T-P2: el servicio, 23 puntos
`qa` · D · pendiente · Depende de: como T-001 · **Persona:** como T-001 · REQ-002, REQ-008, REQ-011, REQ-012, REQ-013, REQ-016, REQ-017, REQ-020, REQ-026, REQ-031, REQ-035, REQ-036, REQ-065 · CA-002, CA-007, CA-011, CA-022, CA-025
- Los 23 puntos de `plan.md` (el 13, con M-16 y m-35). Nombres exactos de tablas y columnas para T-007 y T-009. Si fallan 12 o 13, A-13. Prueba: PRUEBA-002.
- Archivos: `ev/T-002/`.

### T-003 · T-P3: el correo
`plataforma` · D · **bloqueada por A-11 y A-14** · Depende de: T-017 (a) · **Persona:** decide A-11 y A-14, crea la cuenta de envío, pone la credencial y hace el envío real · REQ-016, REQ-017, REQ-018, REQ-070, REQ-071 · CA-012, CA-013
- Los 12 puntos de `plan.md`. Si falla, no hay correo y CA-012 y CA-013 quedan «no ejecutadas». Deja a la 052 los datos de Google Workspace como encargado (menor 15). Prueba: PRUEBA-032.
- Archivos: `ev/T-003/`.

### T-004 `[P]` · T-P4: política, `proxy.ts`, dirección reflejada y 404
`qa` · D · pendiente · Depende de: app de la 002 en `main` (002·T-003); T-017 (a) para integrar la evidencia · REQ-028, REQ-030, REQ-047, REQ-048, REQ-059, REQ-063 · CA-004, CA-020, CA-023
- En una copia desechable de la app, lo de `plan.md`, T-P4. Nada entra en `main`. Prueba: PRUEBA-033 (medida); primera ejecución exploratoria de PRUEBA-055 y PRUEBA-034, anotada.
- Archivos: `ev/T-004/`.

### T-005 `[P]` · Enmienda de la especificación
`especificador` · D, Res. · pendiente · Depende de: (a) nada; (b) A-15 · REQ-007, REQ-022, REQ-024, REQ-036, REQ-037, REQ-038, REQ-040, REQ-041 · CA-006, CA-016, CA-017
- (a) Escribe en `especificacion.md` A-1 (lectura (b') de REQ-036), A-4, A-8 (3.ª excepción de REQ-037), A-12, REQ-022, REQ-038, REQ-040 y REQ-041, sin lo de la marca, con los textos de `propuestas.md`.
- (b) **A-15, aparte:** REQ-007, CA-006, lo de la marca en REQ-038, REQ-040 y REQ-041 y el umbral de REQ-024 y CA-017 (5 fallos y 15 min; con marca, 10), solo con lo que responda el responsable.
- En las dos, se aprueba el texto escrito, no la descripción (m-33). `especificacion.md` pasa de 25 KB: es enmienda y, por D-031, no se recorta; solo un apartado que se reescriba entero se ajusta a D-023 (menor 12). Prueba: `node scripts/comprobar-specs.mjs` sin errores, revisión del `revisor` contra `propuestas.md` y dictamen del `auditor-seguridad` sobre el texto frente a `diseno.md`, «Límite de intentos y bloqueo» y «Bloqueo provocado por un tercero» (m-42).
- Archivos: `especificacion.md`.

### T-006 · ADR y lista de contraseñas
`arquitecto` · C · pendiente · Depende de: (a) y (b), T-002 (12 y 13); (b), además V-107; (c), T-004; (d), nada · A-13 en (a) y (b) · REQ-001, REQ-003, REQ-030, REQ-036 · CA-001, CA-020
- (a) ADR «El servicio de identidad verifica, el registro propio autoriza» y su cambio de `docs/ARQUITECTURA.md` y ADR-0003 (propuesta; lo aplica la coordinación). (b) Ampliación de ADR-0003 para el rol `acceso`. (c) Solo si T-004 confirma A-2: ADR del `proxy.ts` acotado con las condiciones de M-14. Prueba: dictamen del `auditor-seguridad` sobre cada ADR.
- (d) **Aparte** (la espera T-012 (b)). Lista de contraseñas comunes (m-12): archivo local versionado, sin llamadas externas; fuente con licencia abierta, verificada con `verificar-decision` (versión, licencia y fecha). Hasta verificarla, no se usa. Prueba: fuente anotada en `ev/T-006/`.
- Archivos: `docs/adr/` (nuevos), `ev/T-006/`.

### T-017 `[P]` · Escáner: formas secretas del acceso (M-18)
`plataforma` · C, Res. · pendiente · Depende de: (a) nada; (b) T-001 y T-002 · REQ-073 · CA-032 (parte)
- (a) Entradas nuevas en `PATRONES` de `scripts/patrones-secretos.mjs`, solo con valor: (1) URI `otpauth` con parámetro `secret` en base32; (2) hash `$2a$`, `$2b$` o `$2y$` completo (coste y 53 caracteres); (3) código de recuperación o token de renovación por nombre de campo (`refresh_token`, `recovery_code`, `codigo_recuperacion`) seguido de valor; (4) valor de `ACCESO_HMAC_*`; (5) valor de cookie `__Host-nido-*`; (6) token en un enlace: `token_hash=`, `token=`, `access_token=` o `refresh_token=` en la consulta o tras `#`, seguido de valor; (7) campo `secret` con base32 de 16 o más caracteres, también fuera de una URI (m-47). Sin exclusión por la izquierda, como las del conector; el gancho y `comprobar-specs.mjs` las toman sin más cambios.
- Prueba de (a) (primero, en rojo): `tests/unit/plataforma/patrones-acceso.test.ts`, con un ejemplo de cada forma compuesto en ejecución: se detecta suelto, en asignación, en JSON y en `Cookie` o `Set-Cookie`, y (6), en un enlace de invitación y otro de restablecimiento, en la consulta y en el fragmento; solo devuelve el nombre, nunca el valor. No se detectan los nombres sin valor (`configuracion.ts`, `.env.example`, este diseño, el dictamen). `comprobar-specs.mjs` en verde en todo el árbol.
- (b) **Aparte, sin frenar (a):** el (3) también por forma: la que midan T-001 y T-002 y la de la alternativa (16 caracteres; m-47). Prueba (en rojo): esa forma se detecta suelta y en JSON; otra longitud, no. Si no se distingue de texto normal, no se añade y se anota en `ev/T-017/`.
- Archivos: `scripts/patrones-secretos.mjs`, `tests/unit/plataforma/patrones-acceso.test.ts`.

## Bloque 2 · Base de datos

### T-007 · Tablas, `administradores`, regla y sesión
`ingeniero-bd` · C, Res. · pendiente · Depende de: T-002, T-005 (a), V-107, 010·T-002 y 010·T-005 aplicadas, filas de fase 2 de `propuestas.md` aceptadas; (d), T-005 (b) · A-13 · REQ-001, REQ-003, REQ-004, REQ-011, REQ-012, REQ-038, REQ-044, REQ-047, REQ-065, REQ-077, REQ-082 · CA-001, CA-003, CA-009, CA-022, CA-027, CA-033
- (a) Lista cerrada (m-40, m-49): cambio de `04_funciones` de la 010 y PRUEBA-048: recorre `pg_proc` fuera de los esquemas N-1 de la 010 (`specs/010-base-datos-rls/diseno.md`), `privado` incluido, por firma (`regprocedure`, como `supabase/tests/pglite/arnes.ts` ~203), y falla si `PUBLIC`, `anon`, `authenticated` o `acceso` ejecutan una firma fuera de su lista o falta una listada (`authenticated`: las de la 010, las de sesión y las `admin_*`; `acceso`: C-1 a C-10 y C-12). T-007 carga la de la 010 y las suyas; T-008, T-009 y T-018 añaden las suyas con su `revoke`. Hasta T-008 (a), exige que `acceso` no exista (`to_regrole`). Prueba: PRUEBA-048; PRUEBA-031 (revocación).
- (b) M-1 y M-2: tablas de «Datos» sin las de la marca, con RLS en la misma migración, `privado` sin acceso por la API, sin texto libre; `administradores` sin cascada y con estado (migración nueva sobre M02; cambia `09_administradores` de la 010, con dictamen). Prueba: pgTAP de acceso cruzado y PRUEBA-008; PRUEBA-031 (M-1, M-2).
- (c) M-4: `privado.es_admin()` con las seis condiciones; `sesion_tocar`, `sesion_estado`, `sesion_cerrar`, `sesion_presentar` (1F sin datos, m-23); `search_path = pg_catalog, pg_temp`. Prueba: PRUEBA-006, PRUEBA-013 (B); PRUEBA-031 (M-4, junto con la app).
- (d) **A-15, aparte** (m-45): `privado.dispositivos_reconocidos`, los tipos `navegador_*` del contador y `huella_marca_conservada`, en migración nueva. Prueba: pgTAP de acceso cruzado; PRUEBA-048 en verde; PRUEBA-031.
- Archivos: `supabase/migrations/` (nuevas), `supabase/tests/`.

### T-008 · Canal de acceso, operaciones y auditoría
`ingeniero-bd` · C · pendiente · Depende de: T-007, T-001 (forma de los códigos), 024·A-1 (I-42 a I-44) para los códigos `accion`; (c), T-005 (b) y T-007 (d) · A-13 · REQ-002, REQ-005, REQ-006, REQ-008, REQ-009, REQ-010, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-019, REQ-020, REQ-021, REQ-023, REQ-024, REQ-025, REQ-026, REQ-040, REQ-041, REQ-049, REQ-050, REQ-051, REQ-052, REQ-053, REQ-054, REQ-056, REQ-057, REQ-058, REQ-067, REQ-074, REQ-076, REQ-078, REQ-080, REQ-081, REQ-083 · CA-001, CA-005, CA-008, CA-014 a CA-018, CA-029, CA-032, CA-035
- (a) M-3, canal: rol `acceso` y C-1 a C-10 y C-12 en `privado`, con contador, bloqueos, primer paso y auditoría en la misma transacción, sin marca. Prueba: PRUEBA-029 (B, sin marca, M-20; el caso «tras levantarlo» pasa a T-008 b, m-52), PRUEBA-041 (B), PRUEBA-042, PRUEBA-009 (B).
- (b) **Aparte** (menor 13). M-3 y M-5: funciones `admin_*` de «Funciones de operación» (cerrojo del mínimo, anuncios con la regla de M-16 y, si se rechaza el reconocimiento, también en C-6, la de m-37: cerrar todo y (c) en la misma transacción, sin excepción que la deshaga; levantamiento sin el cupo por marca), alternativa de códigos, columnas de `auditoria`. Prueba: PRUEBA-018 (B), PRUEBA-027, PRUEBA-030 (B), PRUEBA-045 (B), PRUEBA-048 en verde, PRUEBA-050 (B); PRUEBA-031 (M-3, M-5). Además, la prueba de contrato de cada función de (a) y (b) que llama T-012: entradas y salidas de lista cerrada y códigos de rechazo.
- (c) **A-15, aparte** (m-45): la marca en C-1, C-4, C-7, C-8 y C-12 (m-51; PRUEBA-049 con bloqueo activo y marca válida: primer paso anotado) (contador propio, cupo por marca y anulación), el cupo por marca en el levantamiento y las `admin_*` con `marca`; las firmas antiguas, con `drop` y `revoke`. Prueba: PRUEBA-029 (B, con marca), PRUEBA-049 (B), PRUEBA-053 (B), PRUEBA-048 en verde.
- Archivos: `supabase/migrations/`, `supabase/tests/`.

### T-009 · Disparadores sobre el servicio
`ingeniero-bd` · C · pendiente · Depende de: T-008, T-002 punto 13, T-017 (a) · **Persona:** proyecto de desarrollo y gestor local, como T-001 (m-39) · A-13 · REQ-010, REQ-014, REQ-015, REQ-016, REQ-040, REQ-058, REQ-067 · CA-007, CA-011, CA-012, CA-029
- M-6: disparador por columnas (contraseña cifrada, correo, cambio de correo pendiente; alta, estado y borrado de factor) con «casar» de M-16; `cierre_servicio_pendiente`; fila (c). Si T-002 ve recifrado al iniciar sesión, no se escribe (m-35). Anuncio caducado sin reconocer con su factor ya `verified` (m-37): cuenta como sin anuncio, cierra todo y (c) en la siguiente llamada de esa cuenta a C-2 o a `sesion_tocar()`, o en el siguiente cambio del factor. Prueba: PRUEBA-043, PRUEBA-052 (B, casos 1 a 7, 9 y 10), PRUEBA-054 (B); PRUEBA-048 en verde (menor 10); PRUEBA-031 (M-6).
- **Servicio real (M-19):** PRUEBA-043, PRUEBA-052 (casos 2, 3, 6 y 9) y PRUEBA-054 son también R: se ejecutan contra el proyecto de desarrollo antes de integrar T-009 (hasta entonces, «no ejecutada») y entran en la batería periódica como PRUEBA-046. El simulado de PGlite (no tiene el esquema `auth`) se deriva de la evidencia de T-P2.13 y lo dice en su cabecera.
- Archivos: `supabase/migrations/`, `supabase/tests/`.

### T-018 · Reintento del cierre en el servicio (m-44)
`ingeniero-bd` · C · pendiente · Depende de: T-009, T-002 punto 13 (privilegio del cierre) · **Persona:** como T-009 · A-13 · REQ-011, REQ-013, REQ-014 · CA-010, CA-011
- `cierre_servicio_pendiente` se reintenta con el mismo privilegio con que el disparador cierra las sesiones del servicio (función de `privado` del propietario, `search_path = pg_catalog, pg_temp`, sin entradas ni datos de salida), **nunca con la clave secreta**: lo intenta la siguiente llamada de esa cuenta a C-2 o a `sesion_tocar()`, con un tope por llamada; el que acierta quita la marca. Un fallo del reintento no concede nada: el registro ya cerró esas sesiones (REQ-011).
- **Si T-002 ve que cerrar en el servicio exige la clave secreta,** la tarea queda bloqueada: sería S-6, que P1 no cubre; se reabre el diseño, con dictamen del auditor (M-10, m-28; menor 7).
- Prueba: pgTAP (cierre forzado a fallar: queda la marca; el reintento lo cierra y no toca otras cuentas; su fallo no cambia la respuesta de C-2 ni de `sesion_tocar()`); PRUEBA-043 (R, con un cierre forzado a fallar; sin ejecutar, T-018 no se integra, M-19); PRUEBA-048 en verde; PRUEBA-031 (M-6). El fallo se fuerza desde el arnés (p. ej., `revoke` en una transacción que se deshace), nunca con bandera ni GUC en la función de producción (m-48). Si en R no se puede forzar, ese caso queda en pgTAP, T-018 se integra con la R sin él y la evidencia lo anota «no ejecutado en R».
- Archivos: `supabase/migrations/`, `supabase/tests/`.

## Bloque 3 · Fase 1 y pruebas delante

### T-010 `[P]` · `proxy.ts`, política, configuración y registro
`plataforma` · C, Res. · pendiente · Depende de: T-004, T-006 (c) si hay `proxy.ts`, 002·T-004 y 002·T-005; (d), T-005 (b) · REQ-028, REQ-029, REQ-030, REQ-031, REQ-059, REQ-060, REQ-061, REQ-062, REQ-066 · CA-020, CA-021, CA-022, CA-028
- (a) `@supabase/supabase-js` 2.119.0 (versión y licencia releídas en el registro al instalar; fuente y fecha en `ev/T-010/`). Prueba: `verificar` en verde.
- (b) Según T-004: P-1 en `next.config.ts`, o P-2 con `src/proxy.ts` acotado (A-2, M-14) y la segunda cabecera fija. Prueba: PRUEBA-020, PRUEBA-033 y PRUEBA-051, escritas aquí en rojo antes que el código; excepción al punto 2 de `plan.md` (menor 8), porque prueban cabecera y `proxy.ts` antes de que exista ninguna ruta.
- (c) `configuracion.ts`: clave secreta, credencial `acceso`, `ACCESO_HMAC_CONTADOR` y `ACCESO_HMAC_CODIGOS` (solo nombres); `registro.ts`: los 13 códigos sin marca (`plan.md`, «Dependencias»). Prueba: unitarias de la 002 ampliadas; PRUEBA-024 (parte de registro).
- (d) **A-15, aparte** (m-50): `ACCESO_HMAC_DISPOSITIVO` y `acceso_navegador_anulado_por_intentos`; hasta entonces, ni se declaran ni se exigen. Prueba: como (c).
- Archivos: `package.json`, `package-lock.json`, `next.config.ts`, `src/proxy.ts`, `configuracion.ts`, `registro.ts`, `.env.example`.

### T-011 `[P]` · Pruebas estática y en navegador
`qa` · C · pendiente · Depende de: T-004, T-005 (a) ((c), también (b)), 020·T-009 (convenciones de `tc/`) · REQ-003, REQ-004, REQ-027, REQ-032, REQ-033, REQ-034, REQ-035, REQ-037, REQ-039, REQ-042, REQ-043, REQ-045, REQ-046, REQ-055, REQ-063, REQ-064, REQ-068, REQ-069 · CA-002, CA-004, CA-019, CA-023, CA-024, CA-026, CA-028, CA-030, CA-031
- (a) PRUEBA-003 con trampas sembradas (lista de `plan.md`, con m-30 y m-31) y PRUEBA-005 (parte estática). Prueba: cada trampa la hace fallar.
- (b) **Aparte** (menor 13). `te/rutas.ts` y, generadas desde él, PRUEBA-004, 007, 009 a 017, 019, 021 a 024, 026, 028 (N), 029 (N), 030, 034 (V-1), 041, 044, 047, 050 (N), 052 (N), 054 (N) y 055 (testigos de M-15). Prueba: en verde con `rutas.ts` vacío; una ruta sembrada en una copia desechable las pone en rojo.
- (c) **A-15, aparte:** PRUEBA-049 y 053 y el caso con marca de PRUEBA-029, con el umbral aprobado como valor. Prueba: como (b).
- Archivos: `tu/`, `te/`.

## Bloque 4 · Servidor

### T-012 · Clientes, credencial, guardia, operaciones y marca
`ingeniero-backend` · C · pendiente · Depende de: T-008, T-010, T-011, T-017 (a), 020·T-008 (c); (b), además T-006 (d); (d), A-15, T-008 (c) y T-010 (d); **Persona:** secretos en el gestor local (m-39, M-18) · A-13 · REQ-002, REQ-003, REQ-004, REQ-013, REQ-017, REQ-019, REQ-020, REQ-024, REQ-025, REQ-026, REQ-027, REQ-029, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036, REQ-036a, REQ-039, REQ-047, REQ-048, REQ-051, REQ-052, REQ-053, REQ-055, REQ-061, REQ-062, REQ-064, REQ-065, REQ-066, REQ-070 · CA-002, CA-010, CA-013, CA-017, CA-018, CA-019, CA-021 a CA-026, CA-028
- (a) `ls/servidor.ts`, `ls/admin.ts`, `ls/acceso.ts`; `la/credencial.ts`, `la/lectura.ts`, `la/resultados.ts`. Prueba: unitarias; PRUEBA-014, PRUEBA-022, PRUEBA-024, PRUEBA-005 (N).
- (b) `la/guardia.ts`, `la/entradas.ts`, `la/direccion.ts`, `la/politica.ts`, `la/origen.ts`, `la/intentos.ts`, `la/tiempo-fijo.ts`, con la contraseña contra la lista de T-006 (d). Prueba: unitarias; PRUEBA-003 en verde; PRUEBA-019, PRUEBA-021, PRUEBA-026, PRUEBA-044.
- (c) **Aparte** (menor 13). `la/operaciones/` (S-1 a S-5 y llamadas al canal). El envío real espera A-11 y A-14. Prueba: unitarias; PRUEBA-023, PRUEBA-047; PRUEBA-005; prueba de contrato de `la/resultados.ts` (lo que pintan T-013 y T-014), que debe estar en verde antes de empezar T-013.
- (d) **A-15, aparte:** `la/navegador-reconocido.ts` (marca; único lector de `ACCESO_HMAC_DISPOSITIVO`). Prueba: unitarias; PRUEBA-049, PRUEBA-053.
- Archivos: `ls/`, `la/`, `tu/`.

## Bloque 5 · Pantallas y procedimientos

### T-013 · Pantallas de `/acceso`
`ingeniero-frontend` · C · pendiente · Depende de: T-012; 020·T-010 (d) y 020·T-016 (a); acuerdo con la 040 · A-13 · REQ-002, REQ-005, REQ-006, REQ-007, REQ-016, REQ-018, REQ-027, REQ-037, REQ-042, REQ-043, REQ-045, REQ-046, REQ-055, REQ-058, REQ-068, REQ-069, REQ-071, REQ-072, REQ-073, REQ-075 · CA-002, CA-005, CA-006, CA-012, CA-019, CA-026, CA-030, CA-031, CA-032
- `src/app/acceso/` (páginas, `acciones.ts`, `renovar/route.ts`), `CampoCodigo`, `AltaFactor`, `CodigosRecuperacion`; cada ruta, en `te/rutas.ts`. Lo de la marca (REQ-007, CA-006), **A-15**. Prueba: PRUEBA-009, 010, 012, 016, 019, 028 (N), 030, 041 y 055 en `/acceso`.
- Archivos: `src/app/acceso/**`, `src/components/acceso/**`, `te/rutas.ts`, textos.

### T-014 · Pantallas de `/admin`
`ingeniero-frontend` · C · pendiente · Depende de: T-013; T-009 (caso 8 de PRUEBA-052, m-41); 020·T-010 (a), (c), (j), 020·T-016 (c), 020·T-009 (j) · A-13 · REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-017, REQ-019, REQ-020, REQ-021, REQ-044, REQ-050, REQ-056, REQ-057, REQ-063, REQ-078, REQ-080, REQ-083 · CA-003, CA-004, CA-007, CA-009, CA-010, CA-011, CA-013, CA-014, CA-016, CA-030, CA-034, CA-035
- `admin/layout.tsx` (m-30), `admin/not-found.tsx` (m-31), `[...resto]/page.tsx`, `ajustes/administradores/` con sus diálogos, `cuenta/`, `AvisoCaducidad`. Prueba: PRUEBA-007, 011, 013 (N), 015, 017, 028 (N), 034, 035, 050 (N), 052 (N, caso 8) y 055 en `/admin`.
- Archivos: `src/app/admin/**`, `src/components/acceso/**`, `te/rutas.ts`, textos.

### T-015 `[P]` · Scripts del responsable, plantillas y guía
`plataforma` · C · pendiente · Depende de: T-008, T-012 (c), T-017 (a); (b), además T-003 (A-11 y A-14) para el envío real · **Persona:** ejecuta los scripts y firma el acta (A-4) · A-13 · REQ-018, REQ-021, REQ-022, REQ-023, REQ-049, REQ-070, REQ-071 · CA-013, CA-015, CA-016
- (a) `scripts/acceso/` (cuatro scripts, interactivos, con lo que usa cada uno según m-28) y `guia-responsable.md`. Prueba: PRUEBA-045 (U); PRUEBA-018 y PRUEBA-050 (parte P) preparadas.
- (b) `supabase/plantillas-correo/` y `comprobar-configuracion.mjs` (sin registro público, solo TOTP, enlaces de 24 h). Prueba: PRUEBA-045; envío real con T-003.
- Archivos: `scripts/acceso/**`, `supabase/plantillas-correo/**`, `guia-responsable.md`.

## Bloque 6 · Verificación

### T-016 · Verificación
`qa` · R · pendiente · Depende de: T-001 a T-015, T-017, T-018; 002 (batería con 043, 046, 052, 054 y 055; `arn1`), 010·T-013 (CI), fase 6 (plazos, REQ-038), preproducción (D-016), A-14 y A-15 · **Persona:** pruebas P y revisión manual · A-13 · REQ-001 a REQ-083 · CA-001 a CA-035
- `verificacion.md`: cada REQ y CA con su prueba y evidencia; PRUEBA-018, 028, 032 y 050 (P); PRUEBA-025 (revisión); PRUEBA-031 completa; lo no ejecutado, como tal (art. 13). AM-08a, como riesgo mayor pendiente de aceptación escrita, nunca como controlado (M-20); el cierre de los art. 4 y 14, pendiente de A-14 (el 14, también de A-15; m-50); Google Workspace, en la lista de encargados de la 052 (menor 15). Prueba: `comprobar-specs.mjs` sin errores y revisión del `revisor`.
- Archivos: `verificacion.md`, `ev/T-016/`.

## Cobertura

Cada REQ-001 a REQ-083 está en la cabecera de alguna tarea anterior a T-016 (repasado a mano el 21/11; REQ-036a, T-012 (c)); T-016 los cierra todos. La tabla por grupos, redundante, se quitó por tamaño (D-023). Cada CA, con su prueba en `plan.md`; cada prueba, en la tarea que la escribe o la cierra.

## Respuesta a la 5.ª vuelta

`dictamen-diseno-5.md` (0 B, 1 M, 6 m); corregido en el texto, sin probar ni ver por el auditor. La 4.ª la dio por cerrada el auditor salvo m-43 (coordinación); su reparto, en `diseno.md`, «Respuesta al dictamen».

| Hallazgo | Apartado |
| --- | --- |
| M-20 | `diseno.md`, «Bloqueo provocado», AM-08a y 08b, A-15; convenciones (A-15); T-008 (a), T-016; `plan.md`, PRUEBA-029, persona, riesgos, P7 |
| m-45 / m-46 | T-007 (d), T-008 (c), convenciones / `plan.md`, PRUEBA-055; `propuestas.md`, fase 1 (21/11) |
| m-47 / m-48 / m-49 | T-017 (a) (7) y (b); `diseno.md`, AM-18 / T-018 / T-007 (a) |
| m-50 | «Lo que bloquea»; T-010 (c) y (d); persona; `diseno.md`, «Configuración»; T-016 |

## Respuesta a la revisión del `revisor` (21/11)

Corregido en el texto, sin probar.

| Hallazgo | Apartado |
| --- | --- |
| MAYOR-1 a 5 | Convenciones, A-15, «Lo que bloquea»; evidencias, T-003, T-017; T-006 (d); punto 4, T-018; T-017 (b) |
| menores 1 a 5, 9, 16, 18 | T-006; T-007; T-011 en C; Res.; T-015, T-016; rutas críticas; «Dependencias»; punto 4; T-001 |
| menores 7, 8, 10, 11 | T-018 y P1 / T-010 (b) y punto 2 / T-009 / persona |
| menores 12, 14, 15 | T-005 (D-031) / «Lo que bloquea» y «Dependencias» (024) / T-003, T-016, «Dependencias» (052) |
| menor 13 | T-008 (b), T-011 (b) y T-012 (c), «aparte», sin renumerar |
| menores 6, 17 | De la coordinación: `propuestas.md`, «Tras la revisión del 21/11» |

## Escalados

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
