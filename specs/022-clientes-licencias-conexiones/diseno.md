# 022 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (dictámenes del 14/11/2026 y `dictamen-diseno-2.md` incorporados; falta que confirme la corrección) · 14/11/2026; al día con D-040, 21/11/2026; corregido con `dictamen-diseno-2.md` y la revisión del `revisor`, 22/11/2026

Especificación APROBADA (P0, 13/11/2026; enmiendas del 13 y 21/11). P1 tras dictamen del `auditor-seguridad`. Constitución 1.5. **Ninguna prueba ejecutada.** Base: M02 a M10 de la 010 (sin aplicar en `Nido`), diseños de 001, 020, 021 y 024. Previas, pruebas, criterios, orden y tareas: `plan.md` y `tareas.md`.

## Resumen

- Lista y ficha **solo leen**; las 10 acciones son **funciones de la base de datos** con la sesión del administrador (`es_admin()`, cerrojos, `es_admin()` otra vez, transición sobre el estado real, cambio y auditoría; todo o nada).
- Un solo estado para panel y agente, de hechos con fecha. Cerrojos que no se cruzan con el conector (DD-34).
- El código lo sortea el servidor, se guarda como HMAC y se ve **una vez**; un caducado nunca bloquea. Ningún error ni registro lleva valores recibidos.
- La baja (la de la 010) es definitiva, con nombre tecleado; revoca las conexiones, no la licencia.

## Hechos de partida

H-1 constitución 1.5. H-2 M07: escritura directa y `select` de tabla entera para `authenticated`, `licencias.estado` y `estado_manual`; faltan `anulado_en`, `vivo`, `nombre_clave`, `version` y motivo. H-3 TP de M02. H-4 baja de M07 → D-4b. H-5 la 001: 10 min y `generar_codigo` → A-5, DD-26. H-6 catálogo de la 024 → P-49. H-7 `trim()`, `\s`, `btrim()`, `lower()` difieren entre JavaScript y PostgreSQL → DD-28. H-8 sin Docker, entorno previo ni conector → etapas. H-9 `alter role` actúa al iniciar sesión → DD-30. H-10 M04 y `fijar_valores()` (M07) eximen a `postgres`, como quien corre toda `security definer` → D-5 (MA-1). H-11 `mcp_obtener_instrucciones` (M08) toma el cliente `for share` (L154) y actualiza la conexión (L238); con ella bloqueada, D-5 pide la licencia → DD-34. H-12 la 024 rehace `auditoria` (catálogo, `origen`, `grupo`, `clock_timestamp()`, lista local de transacción) → D-10, DD-35.

## Supuestos y dependencias

021 (guardia, `leerDelArea()`, `es_admin()`, `administradores.correo`, PRUEBA-003 y 048, `admin_dar_de_baja`); 020 (componentes, `useAccion`, `TextoDato`, `rutas.ts`, `sin-acceso.ts`, `textos.ts`, muestra, V-1 a V-7); fase 1 (`secretos.ts`, `registro.ts`, activación); fase 2 (010, 011, 014); 023, 025 y la **migración de auditoría de la 024** (D-10). Nada conectado sin «Datos», T-P1 y T-P4; nada de base de datos, agente o entorno previo se cierra con ficticios. **Etapas:** A (muestra; solo interfaz); A' (PGlite, borrador); B (migraciones, 021, 024, T-P1, T-P4, `bd.yml`); C (conector y agente); D (entorno previo).

## Piezas y responsabilidades

### Mapa de archivos

Deciden: acceso, la guardia de la 021 y `es_admin()`; estado, transición, nombre y caducidad, la base de datos (la copia TypeScript de la regla de nombres solo avisa). Archivos por tarea en `tareas.md`; nuevos respecto a `docs/ESQUELETO.md`: `secciones.ts`, `_vista/`, `src/components/clientes/`, `DialogoConfirmacionTecleada.tsx`, `src/app/muestra/clientes/`, `src/lib/clientes/`, `tests/vectores/nombres.json`, `scripts/bd/concurrencia-clientes.mjs`. **`ingeniero-frontend`:** páginas (guardia primero; inexistente → `sin-acceso.ts`, V-1), componentes, `textos.ts`, `rutas.ts` y la muestra (`comprobarAccesoMuestra()` primero). **`ingeniero-backend`:** `acciones.ts` (**únicas** acciones: 10 operaciones, `listarClientes`, `leerSeccion`, `comprobarNombre`; primero `exigirAdministradorEnAccion()`), `src/lib/clientes/` y `generar-codigo.ts` (único fuera de `src/lib/oauth/` que importa `secretos.ts`). **`qa`**, **`ingeniero-bd`** (DD-22) y **`plataforma`** (`bd.yml`, D-036): pruebas, migraciones y CI.

**Rutas críticas** (pedir en `docs/SEGURIDAD.md`): `acciones.ts`, `src/lib/clientes/`, `src/lib/licencias/`, `DialogoCodigo`, migraciones, `bd.yml`. **Prohibido importar** (PRUEBA-005): `src/lib/supabase/admin.ts`, `conector.ts`, `acceso.ts`; `secretos.ts` salvo `generar-codigo.ts`; `tests/` y `src/app/muestra/` desde el producto; `unstable_cache`, `use cache`, `revalidateTag`.

### Rutas y pantallas

`/admin/clientes` «Clientes», `…/nuevo` «Nuevo cliente», `…/[cliente]` «Ficha de cliente», `…/[cliente]/editar` «Editar cliente». `[cliente]` (UUID) elige y no concede (REQ-074, nota del art. 2); mal formado, ajeno o inexistente, igual (V-1); sin `loading`, `not-found` anidado, `generateMetadata` ni `Suspense` sobre esa decisión. `no-store` (V-4).

### Lista de clientes

L-1 (filas, total, estados, conexiones activas); L-7 (023) aparte, su fallo no tumba la lista. Columnas (REQ-001, REQ-078): nombre (`TextoDato`, enlace), estado más «Sin señal» y «En pausa», licencia y caducidad, conexiones activas, alta. Orden (REQ-003) por nombre, estado (DD-13) o alta, en los dos sentidos; defecto `nombre_asc`; desempate por clave e identificador. Filtro por estado. Búsqueda (REQ-004) con botón o Intro (DD-12), ≤120 caracteres, en el cuerpo (V-3), por fragmento de la clave, comodines literales; ni se guarda, ni se registra, ni va a la dirección. 25 filas (DD-18); página inexistente → la última.

### Ficha de cliente

`BloqueDatos` por sección con `leerSeccion` y reintento; una caída no tumba las demás (REQ-039). **1 Datos** (nombre, estado, frecuencia, alta, canal en lectura, baja; Editar; Dar de baja). **2 Licencia** (estado, causas con fecha, creación, caducidad, revocadas; Crear, Suspender, Reactivar, Caducidad, Revocar). **3 Códigos** (estado, autor por `administradores.correo` o «Administrador no disponible», fechas, nunca el código; 25, recientes primero; Generar). **4 Conexiones** (asistente, fechas, estado, motivo; 25, activas primero; Revocar). **5 a 7** marcos de Reglas (025), Informes y Órdenes (023) (REQ-007, CA-004). Acciones según el estado leído; decide la base de datos (REQ-031); estado desconocido, sin acciones. **Aviso permanente de baja** (DD-16): fecha, definitiva, conexiones revocadas y, con licencia sin revocar, que no autoriza y se puede revocar. Conexión activa de cliente de baja: error en la sección.

### Formularios de alta y edición

Páginas (REQ-008, REQ-009, CA-005). `nombre`: DD-28, 1 a 120 puntos de código, TP, único. `frecuencia`: `^[0-9]{1,3}$`, 1 a 168, propuesto 24. Edición con `version`; si cambió, `datos_desactualizados` y lo actual junto a lo escrito (REQ-049). O-1 crea las reglas por defecto (REQ-079). Alta `incierta`: «Comprobar» (L-6) enlaza o reintenta sin duplicar (REQ-035).

### Diálogos de confirmación

Seis (REQ-030, CA-021), `DialogoConfirmacion` con `{nombre, distintivo}`; texto en `textos.ts`; cancelar no llama a nada.

| Acción | Distintivo | Además del efecto | Agente | Deshacer |
| --- | --- | --- | --- | --- |
| Dar de baja | Alta | Avisos de REQ-067 con N conexiones; la licencia no se revoca; nombre tecleado | Llamada | **No** |
| Suspender licencia | Creación | Conexiones conservadas | Revisión | Sí |
| Reactivar licencia | Creación | Cobro, caducidad o pausa pueden seguir | Revisión | Sí |
| Revocar licencia | Creación | Definitivo; N conexiones; nombre tecleado | Llamada | **No** |
| Caducidad | Creación | Fecha anterior y nueva | Tras la fecha | Sí |
| Revocar conexión | Asistente, alta, último uso | Solo esa; reconectar exige código | Llamada | **No** |

### Confirmación tecleada (REQ-071)

`DialogoConfirmacion` + campo multilínea (120 caracteres visibles a 320 px, pegar sí, sin autocompletar ni corregir, nombre con `aria-describedby`) + `coincide(texto)`. Coincidencia anunciada solo al cambiar; botón `aria-disabled` enfocable; Intro no confirma; foco en «Cancelar». Baja y revocación de licencia (cuestión 18); O-3 y O-8 comparan con el nombre **actual** en la base de datos (DD-08). No se guarda ni registra. T-P2.

### Generación y diálogo del código

Diálogo previo: licencia, un uso, 15 minutos, una vista, aviso de pendiente (REQ-068). `generar-codigo.ts` sortea (001), calcula el HMAC y llama a O-10 con `pendiente_esperado`; otro pendiente → nada creado, `estado_cambiado` y relectura (REQ-045, REQ-075, DD-02); el código sale tras la transacción (REQ-058); sin respuesta, `incierta`. `DialogoCodigo` (REQ-021, REQ-022): grupos de cuatro, caducidad, vista única, copiar con teclado; **solo «He terminado» lo cierra** (DD-11); al caducar, se sustituye; en memoria, borrado al cerrar, desmontar, ocultar y en `pagehide` (m-8). Nunca en `registro.ts`, `registrarFallo`, direcciones, auditoría ni en claro (REQ-024); en la muestra, con una «U» (DD-27).

### Regla de nombres (REQ-080, REQ-077, REQ-051 a REQ-053)

**Admitidos:** exactamente TP de M02, que manda; `caracteres.ts` la copia rango a rango (fuera también m-5 y DD-23). **Una normalización (DD-28)**, igual en `lib/nombre.ts` y en la base de datos, que manda:

1. `normalizarNombre()` = `privado.normalizar_nombre()`, para guardar: NFC (DD-24) y quitar **solo U+0020** de los extremos (nunca `trim()`, `\s` ni `btrim()` sin segundo argumento); U+00A0 en cualquier sitio: `caracter_no_admitido`; luego longitud en puntos de código (`Array.from()`, `char_length()`) y TP. Restricción `nombre = privado.normalizar_nombre(nombre)`.
2. `claveNombre()` = `privado.clave_nombre()`, para comparar cualquier texto: NFD; quitar solo U+0301, U+0300 y U+0302 (DD-05); NFC; minúsculas por **tabla fija** con `translate()` (nunca `lower()` ni `toLowerCase()`); **plegado** (DD-33); U+00A0 → U+0020; espacios seguidos a uno y sin extremos. «Pérez» = «perez»; «Peña» ≠ «Pena».
   - **Tabla (m-13), generada** (no por pares: U+0100 a U+017E no es regular): cada punto de TP con minúscula simple en `UnicodeData.txt` (campo 13, versión de T-P1); los demás se quedan.
   - **Plegado (m-14, DD-33)**, lista cerrada tras la tabla, con `translate()`: U+2013, U+2014 → `-`; U+2018, U+2019, U+201A, U+00B4, U+0060 → `'`; U+201C, U+201D, U+201E, U+00AB, U+00BB → `"`; U+0131 → «i», U+017F → «s», U+0138 → «k»; un `replace()` de U+2026 → `...`. Nada más. U+00AB, U+00BB, U+00B4 y U+0060 se pliegan porque en un nombre solo hacen de comillas o apóstrofo: sin plegar, dos clientes se leerían igual.
3. **Tope previo (m-15):** antes de normalizar, `nombre` o `nombre_tecleado` de más de 480 puntos de código se rechazan sin tocarlos (`demasiado_largo`; `datos_no_validos`); la búsqueda, por encima de 120. En la app y en la base de datos.

`immutable`, sin configuración regional ni extensiones. **Cambiar la regla** exige una migración que recalcule `nombre_clave` de todas las filas y reconstruya su índice único (lo guardado no se recalcula solo), con vectores y PRUEBA-002; si dos clientes chocan, falla y vuelve al arquitecto. **Vectores:** `nombres.json` (T-006), con la clave esperada de **cada punto de TP** e iguales en los dos lados. `nombre_clave` único también con clientes de baja (DD-07; cuestión 17).

### Fecha de caducidad y fuentes

Caducidad (REQ-019): hora de Madrid (`fecha-madrid.ts`); inexistente o repetida → `hora_no_valida` (DD-10); al minuto; ≤10 años; `no_futura` la decide la base de datos. `fuente-bd.ts` fija, sin interruptor (DD-15); la ficticia, solo en muestra y pruebas (PRUEBA-006 contra las dos).

## Contratos

`contratos/` no cambia. Formas internas cerradas, sin actor:

- Resultado: `hecha`, `rechazada`, `no_permitida`, `incierta` (V-7).
- Motivos: `ya_estaba_hecho`, `sin_cambios`, `no_encontrado` (no existe o es ajeno; REQ-056), `transicion_no_permitida`, `cliente_de_baja`, `ya_tiene_licencia`, `licencia_revocada`, `licencia_suspendida`, `licencia_caducada`, `estado_cambiado`, `datos_desactualizados`, `confirmacion_no_coincide`, `datos_no_validos`.
- Errores `{campo, codigo}`: `nombre`, `frecuencia`, `fecha`, `hora`, `nombre_tecleado`; `obligatorio`, `demasiado_largo`, `caracter_no_admitido`, `repetido`, `no_entero`, `fuera_de_rango`, `formato`, `no_futura`, `demasiado_lejana`, `hora_no_valida`, `no_coincide`.
- Estados (catálogo de la 020): los de cliente, licencia, código y conexión de «Estado derivado»; causa `manual`, `cobro`; motivo `administrador`, `credencial_reutilizada`, `revocacion_licencia`, `baja_cliente` (REQ-025); asistente `claude`, `chatgpt`, `otro`; canal `estable`, `prueba`. Fuera de lista: `desconocido`.
- Lista: `nombre_asc`, `nombre_desc`, `estado_asc`, `estado_desc`, `alta_asc`, `alta_desc`; seis estados o ninguno; página 1 a 10.000. Objeto plano; lo de más se ignora sin registrar (REQ-055).
- `registro.ts`: `clientes_no_permitida`, `clientes_objeto_ajeno`, `clientes_resultado_incierto`, `clientes_lectura_fallida`. Base de datos, códigos fijos sin valores: `baja_sin_auditoria`, `reactivacion_sin_auditoria`, uno por regla de D-5.

## Datos

Migraciones de la 022 tras M10 y tras la de auditoría de la 024, reversibles (DD-22), con `.claude/rules/bd.md` y la forma de D-1 de la 010; lo que cambian de ella, en `propuestas.md`.

- **D-1** `clientes`: `nombre` normalizado (DD-28); `nombre_clave` por `clave_nombre()`, no escribible, índice único; `version`; `baja_en` si y solo si `estado = 'baja'`; `creado_en` y `baja_en` inmutables.
- **D-2** `licencias`: `estado` y `estado_manual` pasan a hechos `revocada_en`, `suspension_manual_en`, `suspension_cobro_en` (fase 6), `caduca_en`, `creada_en`, `creada_por`; una vigente por índice; `cliente_id` inmutable. Lo que en la 010 los lee (M08 `licencia_vigente` y `resolver_token`, M09 `resumen_cliente`, lo de T-P4) se reescribe con D-7 en la misma migración; `resolver_token` exige en su consulta conexión y licencia sin revocar y cliente activo (m-18).
- **D-3** `codigos_activacion`: `anulado_en`; `vivo` con índice único parcial por licencia; uso y anulación excluyentes; `caduca_en` = `creado_en` + 15 min; `creado_por` de la sesión (nulo solo con origen `responsable_fuera_del_panel`, DD-26); `licencia_id`, `codigo_hmac`, `caduca_en` y `creado_por` inmutables; `codigo_hmac` ilegible (DD-04).
- **D-4** `conexiones`: `motivo_revocacion` si y solo si `revocada_en`; `licencia_id` inmutable. Toda revocación por `privado.revocar_conexion_interna(conexion, motivo, principal)`: O-8, O-11, D-4b y el conector.
- **D-4b Baja (DD-32).** Sigue el disparador `clientes_al_dar_de_baja` de M07; `create or replace` de `privado.al_dar_de_baja()`, que **repite** `security definer` y `set search_path = pg_catalog, pg_temp` y los permisos de M07 (m-11). Toma con `into strict` la I-03 de `new.id` **de esta transacción** (DD-35, m-10); ninguna o más de una → `baja_sin_auditoria`. Luego, por identificador, `revocar_conexion_interna` con `baja_cliente` y la I-03 como principal. Misma sentencia: un fallo la deshace (CA-007). No toca la licencia. O-3 anota la I-03 y hace el `update` sin capturar excepciones entre los dos.
- **D-5 (MA-1)** Disparadores que **no miran `current_user` ni eximen a ningún rol** (actúan también como `postgres` y dentro de `security definer`; solo los evita quien los desactiva, fuera del modelo, m-6); `create or replace trigger`. Reglas: licencia revocada intocable; `revocada_en`, motivo, `usado_en`, `anulado_en` y `baja_en` no se quitan ni cambian; `vivo` no vuelve a verdadero; `caduca_en` de código no se alarga; inmutables de D-1 a D-4; **`suspension_manual_en`** pasa de nulo a fecha, o a nulo solo con una I-07 de esa licencia en esta transacción (DD-35; si no, `reactivacion_sin_auditoria`), nunca de una fecha a otra; ninguna conexión activa, nueva o existente (también al tocar solo `ultimo_uso_en`), en licencia revocada o cliente de baja, leyendo **primero el cliente y luego la licencia** en dos sentencias `for share` (m-1, m-19). Código fijo, sin valores (M-2).
- **D-6** Se revocan a `authenticated` los `insert` y `update` de M07 en las cuatro tablas; reglas por O-1 (permisos: 025); sin cascadas; nada borra.
- **D-7** `privado.situacion_licencia(revocada_en, suspension_manual_en, suspension_cobro_en, caduca_en)`, `estado_cliente_lista` y `estado_codigo`, para panel, conector y `resumen_cliente`: reciben **valores**, no leen tablas ni son `security definer`; **`stable`**, porque comparan con `now()` (las de nombres, `immutable`); su `execute` para `authenticated` no abre lecturas. **D-8** L-1 a L-7. **D-9** las 10 operaciones.
- **Permisos de las 17 (m-3, DD-25):** `security definer` en `privado`, `search_path = pg_catalog, pg_temp`, todo calificado (D-035); `execute` solo a `authenticated`; `es_admin()` antes de leer parámetros. `revocar_conexion_interna` y `crear_codigo_interno` (DD-26), sin `execute` para `authenticated`. Exposición: REQ-010 de la 010 (T-P4); PRUEBA-048 de la 021.
- **D-10 (R-MA-2)** Auditoría: **la de la 024** (su D-1 a D-5: tabla, catálogo `privado.acciones_auditoria`, `origen`, `grupo`, disparador, `anotar_auditoria` y `anotar_auditoria_vinculada`, retirada de `privado.auditar()`), con I-01 a I-12 e I-41 y los cambios de P-49 en su migración. La 022 no la migra; sin ella, ninguna operación.
- **D-11** conector (abajo). **D-12** ficticios (T-008 y T-018). **D-13** DD-31. **D-14** DD-30.

**DD-35 Principal de esta transacción.** D-4b y la regla de `suspension_manual_en` piden la I-03 o la I-07 a `privado.principal_de_esta_transaccion(accion, objeto)`, sobre la lista local de transacción del disparador de la 024 (su D-3), sin `execute` salvo su dueño (P-53); esa lista es una tabla de `privado` con clave `pg_current_xact_id()` que la sesión no puede sembrar, y la principal debe existir además en `public.auditoria` (N-4); no por `now()` (la 024 usa `clock_timestamp()`) ni por `xmin` (subtransacciones). Toda operación toma sus cerrojos de fila **antes** de su primera fila de auditoría (nadie espera una fila con el cerrojo consultivo de la 024); en O-3 y O-7, la principal antes del cambio que la exige (P-53).

### Lectura del usuario de cliente (REQ-081, DD-29)

RLS de M07: `privado.clientes_del_usuario()` sale de `auth.uid()` y solo da clientes activos; ningún identificador recibido entra en la política (art. 2). El superadmin lee por L-1 a L-7; queda lo que lee `resumen_cliente` (con D-7) más frecuencia y alta (023). **Forma (m-12):** en `clientes`, `licencias` y `conexiones` (tabla entera en M07, L321, L331, L340), `revoke select on <tabla> from authenticated` y luego `grant select (<columnas>)`.

| Tabla | Filas para él | `select` de `authenticated` | Sin `select` |
| --- | --- | --- | --- |
| `clientes` | La suya, activa (M07) | `id`, `nombre`, `estado`, `frecuencia_esperada_horas`, `creado_en` | `canal`, `nombre_clave`, `version`, `baja_en` |
| `licencias` | La vigente: la política añade `and revocada_en is null` | `id`, `cliente_id`, `caduca_en`, `creada_en`, `revocada_en`, `suspension_manual_en`, `suspension_cobro_en` | `creada_por` |
| `codigos_activacion` | Ninguna | Las de M07 (`id`, `licencia_id`, `caduca_en`, `usado_en`, `creado_por`, `creado_en`) | `codigo_hmac`, `anulado_en`, `vivo` |
| `conexiones` | Ninguna | Las de M02: `id`, `licencia_id`, `asistente`, `creada_en`, `ultimo_uso_en`, `revocada_en` | `motivo_revocacion` |

No escribe (D-6); L-1 a L-7, 0 filas; operaciones, `no_permitida` (DD-17).

### Registros de Postgres (REQ-082, DD-30)

Un ajuste de rol actúa al iniciar sesión (no con `set role`), y PostgREST, que entra como `authenticator`, solo aplica del rol destino los de contexto de usuario; tres de los cuatro son de superusuario. Van en cada **rol que inicia sesión** (`authenticator`; los del conector, `conector_prueba_mcp` y `conector_prueba_gestion` de T-114, y los de la fase 2), en una migración **nueva** (P-47) con guarda si el rol no existe. **Vuelta atrás:** guarda antes en `privado.ajustes_rol_previos` (rol, ajuste, valor previo o nulo; RLS, sin políticas ni permisos; `check` de los cuatro ajustes; sin sobrescribir un valor ya guardado, N-5) el valor de los cuatro, con `format()` y `%I` y `%L`; revertir lo restaura o hace `alter role … reset <ajuste>` de esos cuatro, **nunca `reset all`**, y vacía la tabla. Las sesiones abiertas no los toman hasta que una persona reinicia la API y Supavisor (m-17). **PRUEBA-031:** `rolconfig` de `pg_roles where rolcanlogin`, en rojo si un rol fuera de la **lista cerrada de excepciones de su entorno** (CI, de T-017; `Nido`, de T-P1; versionadas con el motivo) no tiene los cuatro; y el efecto por la API y el conector (testigos: 0 apariciones, 0 sentencias con parámetros; control positivo desde `postgres`). `pgaudit`: T-P1; si registra parámetros, al arquitecto.

### Estado derivado

Con el reloj de la base de datos. Licencia: `revocada` > `caducada` > `suspendida` (alguna causa) > `activa`; causas siempre visibles. Cliente (REQ-002): `baja` > `sin_licencia` > `licencia_caducada` > `licencia_suspendida` > `pendiente_activar` > `activo`. Código: `usado` > `anulado` > `caducado` > `pendiente`, sin mirar `vivo`; **pendiente** = `vivo` y `caduca_en > now()` (M-1). Conexión: `revocada` > `activa`. Agente: instrucciones solo con cliente activo y licencia `activa` (011, 023); si no, `suspendida`; cliente de baja, rechazo; licencia revocada, fase 2. Sin `forzar_activa`; la fase 6 anulará solo la causa de cobro (REQ-072).

### Superficie de lectura

Cero filas sin `es_admin()`, sean cuales sean las demás políticas (DD-17); por `leerDelArea()`. L-1 lista (búsqueda, estado, orden, página → filas y total); L-2 cliente con `version`; L-3 licencias; L-4 códigos con correo del autor, **nunca el HMAC**; L-5 conexiones; L-6 identificador por clave; L-7 indicaciones de hasta 25 clientes (023).

### Operaciones

Una transacción: (1) `es_admin()` o `no_permitida`; (2) cerrojos (DD-34); (3) `es_admin()` otra vez o `no_permitida` (m-2); (4) objeto del cliente o `no_encontrado`; (5) validación (M-2); (6) transición desde lo leído o `ya_estaba_hecho` sin auditar (REQ-047); (7) cambio y auditoría (DD-35), todo o nada (REQ-062); (8) resultado cerrado con, como mucho, un identificador o una fecha. Nunca reciben actor, estado, canal ni alta. «Anula pendiente»: `anulado_en` e I-11 al pendiente no caducado.

| N.º | Entradas | Condición | Efecto | Auditoría |
| --- | --- | --- | --- | --- |
| O-1 Alta | `nombre`, `frecuencia` | Válidos; nombre libre | Activo, sin licencia, reglas por defecto (REQ-079) | I-01; I-41 |
| O-2 Edición | `cliente`, `version`, `nombre`, `frecuencia` | Versión igual; sin cambios → `sin_cambios` | Sube `version` | I-02 |
| O-3 Baja | `cliente`, `nombre_tecleado` | Activo; clave del nombre actual | I-03; anula pendiente; `estado = 'baja'` y `baja_en`; D-4b revoca las activas | I-03; I-11; I-12 por conexión |
| O-5 Crear licencia | `cliente`, `caduca_en` opcional | Activo; sin licencia viva; futura ≤10 años | Sin causas | I-05 |
| O-6 Suspender | `cliente`, `licencia` | Activo; sin revocar ni causa manual | `suspension_manual_en`; anula pendiente | I-06; I-11 |
| O-7 Reactivar licencia | `cliente`, `licencia` | Activo; con causa manual | I-07 y luego quita solo la manual (D-5) | I-07 |
| O-8 Revocar licencia | `cliente`, `licencia`, `nombre_tecleado` | Sin revocar; cliente en cualquier estado; clave del nombre actual | Licencia y conexiones activas (misma fecha, `revocacion_licencia`); anula pendiente | I-08; I-12 por conexión; I-11 |
| O-9 Caducidad | `cliente`, `licencia`, `caduca_en` o nada | Activo; sin revocar; futura ≤10 años; igual → `sin_cambios` | Fija, cambia o quita | I-09 |
| O-10 Generar código | `cliente`, `licencia`, `codigo_hmac`, `pendiente_esperado` opcional | Activo; licencia `activa`; sin otro pendiente; HMAC nuevo | Retira vivos caducados; anula el esperado; crea a 15 min; devuelve identificador y caducidad | I-10; I-11 |
| O-11 Revocar conexión | `cliente`, `conexion` | Activa; cualquier estado | Motivo `administrador` | I-12 |

O-4 («Reactivar cliente») sale con D-040, sin reutilizar el número. En O-3 y O-8 el estado se mira antes que el tecleado. **O-10 y los caducados (M-1, DD-20):** con el cerrojo de la licencia, `vivo = false` a sus vivos caducados, sin `anulado_en` ni auditoría (siguen «Caducado»); compara solo con el pendiente no caducado; si el esperado caducó, se retira y se crea el nuevo (`crear_codigo_interno`). Cliente de baja: licencia solo revocable (DD-09), edición sí, nada lo devuelve a activo. Revocar o dar de baja dos veces: `ya_estaba_hecho` (DD-19); el resto de REQ-060: `transicion_no_permitida`, `cliente_de_baja` o `no_futura`.

### Transiciones de la licencia

Cliente activo. «—» `transicion_no_permitida`; «ya» `ya_estaba_hecho`; «H» hecha.

| Situación | Suspender | Reactivar | Revocar | Caducidad | Generar |
| --- | --- | --- | --- | --- | --- |
| Activa | H | — | H | H | H |
| A mano | ya | H, activa | H | H | `licencia_suspendida` |
| Por cobro | H, dos causas | — | H | H | `licencia_suspendida` |
| Por las dos | ya | H, sigue por cobro | H | H | `licencia_suspendida` |
| Caducada | H | — | H | H | `licencia_caducada` |
| Caducada y a mano | ya | H, sigue caducada | H | H | `licencia_caducada` |
| Revocada | — | — | ya | — | `licencia_revocada` |

Cliente de baja: revocar donde no esté revocada; lo demás, `cliente_de_baja`.

### Cerrojos y simultaneidad

**DD-34 Orden y modos (R-MA-1).** Orden único (REQ-048): cliente → licencia → códigos y conexiones. O-2 a O-11 toman **primero el cliente `for no key update`** (O-2, `for update`, porque el renombre cambia `nombre_clave`, con índice único, N-3), que choca con el `for share` del conector (M08 L154) y de D-5; luego licencia, códigos y conexiones `for update`, por identificador, todo en el paso 2 y antes de la primera fila de auditoría (en O-3, la licencia vigente, sus conexiones activas y el código pendiente, N-6); O-1 no bloquea filas. Así conector y operación se ordenan en la fila del cliente, el segundo espera sin tener conexión ni licencia y la secuencia conexión → licencia de D-5 (H-11) no cierra ciclo (PostgreSQL 18, «Explicit Locking»). Segunda barrera (P-52): el conector toma cliente y licencia `for share` antes de escribir en `conexiones` o `codigos_activacion`. PRUEBA-018.

Una licencia viva y un código vivo: cerrojo e índice (DD-03). Nombre: índice sobre `nombre_clave`; quien pierde recibe `repetido`, nunca `incierta` (REQ-053, M-2). Edición: `version` (REQ-049). La activación toma los mismos cerrojos (D-11).

### Errores sin valores (M-2, DD-21)

O-1 y O-2 validan antes de escribir y capturan `unique_violation` y `check_violation` para dar el error de campo; ninguna restricción ni disparador lanza valores. **Tipos mal formados (m-16):** un parámetro que no convierte (`22P02`, `22007`, `22008`) lleva el valor en el mensaje: `entradas.ts` valida UUID y fecha antes y `fuente-bd.ts` llama **siempre por `POST`** (`rpc`), sin `GET` ni filtros de PostgREST (PRUEBA-005; vector en PRUEBA-025); traduce solo por SQLSTATE y código fijo, descarta `message`, `details` y `hint` y nunca pasa el error a `registro.ts` ni a la supervisión.

### Lo que el conector tiene que cumplir (D-11)

(1) Llamada, renovación, **respuesta repetida en la ventana de gracia** y canje (m-4) comprueban en la misma consulta conexión y licencia vivas y cliente activo (m-18; `resolver_token`, D-2), sin caché ni réplicas (REQ-027, CA-019). (2) Estado de D-7. (3) La activación, tras los cerrojos, vuelve a comprobar y rechaza igual código usado, anulado o caducado, licencia no activa y cliente de baja (REQ-063); uso con actualización condicionada (m-1). (4) 15 minutos (A-5). (5) Reutilización: `revocar_conexion_interna`. (6) `ultimo_uso_en` real. (7) Tipo en el HMAC. (8) H-03 a H-05 de la 024. (9) La purga de la 014 no toca pendientes. (10) DD-30. (11) DD-34 (P-52).

### Matriz de acceso

CA-022, CA-044. Solo el administrador activo con sesión completa lee (sin `codigo_hmac`) y opera. Sin sesión y conector: 0. Sin privilegios, con un factor, sesión cerrada o caducada, o de baja: 0 filas y `no_permitida`. Usuario de cliente, con cualquier identificador: igual, salvo DD-29.

### Migración y vuelta atrás

Tras la de auditoría de la 024, en orden (las columnas usan las funciones; D-7):

- **M22-1** `normalizar_nombre()`, `clave_nombre()` y D-7, sin tablas.
- **M22-2** columnas, índices y restricciones de D-1 a D-4 y lecturas de la 010 reescritas (D-2). Revertir solo sin datos reales; una revocada sin motivo deducible la hace fallar.
- **M22-3**, **un archivo por tarea** (T-011 a T-015), cada uno reversible y aplicable solo, para no editar uno ya aplicado en `Nido`: internas y D-4b, lecturas, operaciones. Quitarlas falla seguro; revertir la de D-4b devuelve el cuerpo de M07 de `al_dar_de_baja()` con `security definer`, `search_path` y permisos (m-11).
- **M22-4** D-5, D-6 y DD-29. **Revertirla (m-20 a)** devuelve el `select` de M07, **nunca** escritura sobre `revocada_en`, `anulado_en`, `usado_en` ni `baja_en` (tampoco el `update (revocada_en)` de M07 en `conexiones`), y **deja D-5**, que solo se quita al revertir M22-2; con datos reales, solo con una app sin esta función.
- Ajustes por rol: DD-30. PRUEBA-019: aplicar → revertir → aplicar cada una.

## Flujo

Diálogo → `POST` con `useAccion` → `exigirAdministradorEnAccion()` y validador → operación. `hecha`: relee y avisa; `rechazada`: motivo y relee; `no_permitida`: lo dice; `incierta`: aviso permanente y relectura antes de repetir (REQ-035). Instalar: O-1 → O-5 → O-10 → activación. Credencial robada: O-11, o O-8 si no se sabe cuál.

Fallos: lectura → error con reintento, nunca vacío; operación, auditoría o reglas → nada hecho; restricción reconocida → error de campo; respuesta perdida, valor desconocido o `40P01` → `incierta` (el código de O-10 se pierde); sesión inválida, también tras un cerrojo → `no_permitida` (REQ-043); estado cambiado → el motivo real.

## Auditoría de esta función

En su transacción, con las auxiliares de la 024 (D-10): actor de la sesión, vinculadas a la principal; **sin código, HMAC, nombre, tecleado ni fecha** (REQ-034). I-11 e I-41 siempre vinculadas; I-12 principal en O-11 y vinculada en O-8 y O-3 (no `revocar_por_baja`); I-11 también bajo I-06 e I-03; sin I-04 (H-6). CA-025 = principal más vinculadas (DD-14). Sin fila: lecturas, cancelaciones, rechazos, repeticiones y retirada de caducados.

## Tareas previas

T-P1 (`Nido`: Unicode, registros, ajustes y roles), T-P2 (campo en el diálogo de alerta), T-P3 (el código en producción, m-8), T-P4 (exposición, tiempo real): primeras, con evidencia (`plan.md`). Si algo no casa, al arquitecto.

## Amenazas de esta función

A-nn de `docs/SEGURIDAD.md`; RQ = riesgo que queda; última columna, PRUEBA- (`plan.md`).

| N.º | Amenaza → control | Prueba |
| --- | --- | --- |
| AM-01 | Superadmin comprometido conecta su asistente → 021, 15 min, I-10, conexión visible. RQ: alerta de fase 4 (A-8) | 017, 021 |
| AM-02, AM-03 | Código en registros (art. 4) o visto otra vez → solo en su respuesta, HMAC, V-112, DD-30; memoria, `no-store`, borrado (m-8). RQ: portapapeles | 013, 021, 025, 031, T-P3 |
| AM-04, AM-28 | Doble envío; licencia bloqueada por un caducado → pendiente esperado, cerrojo, índice (M-1); DD-20 | 016, 021 |
| AM-05, AM-27 | Fuerza bruta (A-02), copia de la base (A-05) → fases 1 y 2; un vivo, 15 min, solo HMAC | Fase 2 |
| AM-06 | HMAC elegido → sin clave no hay código; solo anula | 016 |
| AM-07, AM-08, AM-22 | Objeto ajeno (art. 2), perfil sin derecho, sondear existencia → base de datos, guardia, `es_admin()`, respuesta igual (V-1) | 013, 022, 023 |
| AM-09, AM-21 | Escritura directa; tiempo → D-6, D-5 sin exención (MA-1), no frente a quien desactiva disparadores (m-6); reloj de la base | 014, 015, 016, 019 |
| AM-10 | Función privilegiada → `es_admin()` primero, D-035, permisos (m-3) | 013; 048 (021) |
| AM-11, AM-12 | La revocación no corta; activación simultánea → D-11 (1) y canje (m-4); cerrojos y nueva comprobación (m-1). RQ: fase 2 | 018, 027 |
| AM-13 | Cliente equivocado → nombre único, distintivo, tecleado. RQ: parecidos latinos | 001, 009, 021 |
| AM-14, AM-26 | Nombre que ejecuta código (A-21) o lleva instrucciones (A-16) → `TextoDato`, `textoPlano()`, datos. RQ: sin la política de contenido de la 021, un guion podría generar y leer un código | 012, revisión |
| AM-15, AM-16 | Otro origen o marco; campos de más → `SameSite=Strict`, `comprobarOrigen()`, `POST`; entradas cerradas | 003, 023 |
| AM-17, AM-25, AM-29 | Búsqueda o tecleado registrados (art. 1), búsqueda abusiva, valores en errores → en el cuerpo, parámetros, 120; DD-21, m-16, solo `POST` | 002, 005, 020, 025 |
| AM-18, AM-20 | Algo falso o ficticio (art. 3); clave secreta → `incierta`, fuente fija; nadie importa `admin.ts` | 005, 006, 024 |
| AM-19, AM-24 | Acción sin rastro; revocaciones en cadena → auditoría en la transacción (DD-26, D-4b, DD-35); sin límite de ritmo | 015, 017 |
| AM-23 | Baja con credenciales vivas → D-4b, D-5, `resolver_token`. RQ: baja por error → tecleado | 009, 017, 018, 026 |
| AM-30 | Sigue tras perder la sesión en un cerrojo → paso (3) | 030 |
| AM-31, AM-32 | Caracteres en blanco; un lado acepta lo que el otro rechaza → TP, DD-28 | 001, 002, 012 |
| AM-33, AM-34 | Postgres registra valores; usuario de cliente lee de más → DD-30 en todo rol con inicio de sesión (m-17); DD-29. RQ: `pgaudit` sin medir | 013, 022, 025, 031 |
| AM-35, AM-36 | Bloqueo mutuo conector–operación; causa manual quitada sin rastro → DD-34, P-52; D-5, DD-35 | 015, 018 |

## Pruebas

Vitest, navegador sobre la compilación de producción, pgTAP y varias conexiones en `bd.yml`, agente con el conector, entorno previo (V-114); fallos provocados sin ganchos en el producto. **Catálogo PRUEBA-001 a 031 y cada CA con su prueba y etapa: `plan.md`, «Pruebas y criterios»** (D-023). Sin pgTAP ni `bd.yml` no hay VERIFICADA (art. 13). **DD-31:** `scripts/bd/concurrencia-clientes.mjs`, paso de `bd.yml` con `postgres` 3.4.9, 20 repeticiones por caso (procedimiento en `plan.md`), con el conector en bucle contra O-3, O-8 y O-11 en PRUEBA-018 (0 `40P01`).

## Valores que fija este diseño

Búsqueda ≤120; página 1 a 10.000; códigos y conexiones de 25 en 25; caducidad al minuto y ≤10 años; acción sin respuesta a los 30 s. **Rendimiento (REQ-006), sin medir:** una consulta para ≤1.000 clientes; índices: único de `nombre_clave`, licencias vivas por cliente, conexiones vivas por licencia, códigos y conexiones por licencia y fecha; la ficha consulta en paralelo. Si PRUEBA-028 falla, al arquitecto.

## Comprobación de la constitución

Versión 1.5.

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Solo el nombre comercial, en TP; sin valores en errores ni registros (DD-30) |
| 2 Aislamiento | Cumple | `[cliente]` elige y no concede; objetos comprobados en la base de datos (nota de la 1.5); usuario de cliente por `auth.uid()` (DD-29) |
| 3 Cierre en fallo | Cumple | `es_admin()` antes y después de los cerrojos; lo desconocido, `incierta`; baja con revocación fallida y baja o reactivación sin su principal (DD-35), rechazadas; D-5 sin exención (MA-1); DD-34 |
| 4 Secretos | Cumple | Solo HMAC; V-112; DD-30 |
| 5 Especificación | Cumple | Enmendada (D-040; cuestiones 17 y 18 por D-036) |
| 6 Revisión independiente | Pendiente | Confirmación del auditor y P1 |
| 7 Entradas no confiables | Cumple | Listas cerradas; nombre y tecleado son datos |
| 8 Límites en el anfitrión | No aplica | |
| 9 Prompt por despliegue | No aplica | |
| 10 Producto final | Con condición | AM-14 |
| 11 Reversibilidad | Con límite | M22-4 no reabre lo definitivo (m-20 a); baja definitiva por requisito; ajustes con valor previo, sin `reset all` |
| 12 Español | Cumple | |
| 13 Evidencias honestas | Cumple | Nada dado por probado (m-6); `rolconfig` solo no cierra CA-050 |
| 14 Cambios reservados | Cumple | `bd.yml` por D-036 con dictamen; ajustes en `Nido` (D-040) y reinicio de la API, una persona |

## Dependencias nuevas

**Ninguna**: `Intl`, validadores propios (V-109 en VERIFICAR: T-035 antes de T-022), `postgres` 3.4.9 ya instalado. Fuentes (21 y 22/11/2026): PostgreSQL 18 (`functions-string`, `ALTER ROLE`, «Explicit Locking»), PostgREST («Impersonated Role Settings»), Supabase («Customizing Postgres configs»).

## Alternativas descartadas

Escribir con sesión y RLS; estado de licencia en columna; anular siempre al generar o el caducado; `vivo` generado o sin índice; volver a mostrar el código; sortear en la base de datos; `unaccent`; lista negra de caracteres; rechazar el NFD; búsqueda en la dirección; casilla en vez de teclear; Escape cierra el código; ficticia por variable; revocar en bloque; `search_path` vacío; cambiar migraciones de la 010; reactivar cliente; revocar la licencia en la baja, o en O-3 fuera del disparador; `trim()`, `lower()`; ajustes solo en `authenticated`; `dblink`; `security definer` para el usuario de cliente. Con la revisión: auditoría propia; I-03 por `now()` o `xmin`; `reset all`; U+0060 sin plegar; un solo M22-3; solo P-52.

## Decisiones que requieren ADR

Tras P1: ampliar ADR-0003 (los dashboards solo escriben por funciones); enmendar ADR-0006, punto 7 (dos causas con fecha); ADR-0002, punto 4 (15 minutos y un código vivo).

## Decisiones por delegación

**D-019 (14/11/2026), en `aclaraciones.md`:** DD-01 a DD-19 (DD-06 sustituida por DD-23); A-2, A-3 (sustituida por A-11 de D-040), A-5, A-7 (en A-9), A-8. **D-036 (21/11/2026):** DD-20 a DD-27 (DD-26 concreta A-6); cuestiones 17 (a: un cliente de baja no vuelve con el mismo nombre) y 18 (a: la baja pide el nombre tecleado; REQ-030, REQ-071, CA-041, CA-043). **Para P1:** DD-28 a DD-35, donde se citan.

## Cobertura de requisitos

Los 81 REQ (el 066 se retiró) están en el apartado que los diseña y en la cabecera de su tarea (`tareas.md`, «Cobertura»); los 49 CA, en `plan.md`, «Pruebas y criterios».

## Asuntos del responsable

A-1, A-4, A-9, A-10, A-11 y A-12, decididos el 21/11/2026 con la opción (a) (D-040). **Ninguno abierto.**

## Lo que este diseño no ha podido comprobar

Nada ejecutado. `comprobar-specs.mjs`: SUPERADO por el `revisor` en la versión anterior; no vuelto a ejecutar (sin terminal; tamaño estimado contando líneas). Sin comprobar: T-P1 a T-P4, V-112, `pgaudit`, tiempo real, exposición de `privado`; DD-34 frente a todo `40P01` (PRUEBA-018); la lista local de la 024 (su T-P3) y P-53; rendimiento; 023, 011 y 014; lectores directos de `clientes.canal` o `licencias.creada_por`.

## Cambios

Anteriores, en git. **Revisión del `revisor` (22/11/2026)**, sin probar ni confirmar:

| Hallazgo | Apartado |
| --- | --- |
| R-MA-1 / R-MA-2 / R-MA-3 | DD-34, H-11, D-5, AM-35 / D-10, H-12, «Migración» / D-5, DD-35, O-7, AM-36 |
| R-m3 a R-m6 / R-m8 a R-m10 | D-7 / «Regla de nombres» / D-4b, DD-35 · D-5, «Migración» / DD-30 |
| R-m15, R-m17, R-m18, R-m19 | «Migración» / D-2, D-11 / pruebas a `plan.md` / «No ha podido comprobar» |
| R-MA-4, R-m1, R-m2, R-m7, R-m11 a R-m14, R-m16 | `plan.md`, `tareas.md`, `propuestas.md` |

**Condiciones de `dictamen-diseno-3.md` y revisión del `revisor` (22/11/2026):**

| Hallazgo | Apartado |
| --- | --- |
| N-3, N-6 / N-4 / N-5 | DD-34 / DD-35 / DD-30; el resto, en `tareas.md`, «Condiciones de `dictamen-diseno-3.md`», `plan.md` (PRUEBA-015, 017, 018, 019) y `propuestas.md` (P-52, P-53) |
| MAYOR-1 / MENOR-1 | `tareas.md` y `plan.md` / `plan.md`, cabecera, «Lo que bloquea» y «Aprobación» |
