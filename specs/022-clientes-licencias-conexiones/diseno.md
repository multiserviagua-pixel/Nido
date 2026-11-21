# 022 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (dictamen del 14/11/2026 incorporado; falta su segunda vuelta) · 14/11/2026; condensado 19/11/2026; consolidado 21/11/2026

Especificación APROBADA (P0, 13/11/2026, con la enmienda de las reglas por defecto). Lo aprueba P1 tras dictamen del `auditor-seguridad` (ruta crítica). Constitución 1.4. **Ninguna prueba se ha ejecutado.** Tablas: migraciones de la 010 (M02 a M09, sin aplicar en `Nido`) y diseños de 001, 020 y 021. DD-01 a DD-19: D-019; DD-20 a DD-27: D-036.

## Resumen

- Lista y ficha **solo leen**. Las 11 acciones son **funciones de la base de datos** con la sesión del administrador: en una transacción, `privado.es_admin()` (021), cerrojos, `es_admin()` otra vez, transición sobre el estado real, cambio y auditoría; todo o nada. Sin escritura directa; disparadores protegen lo definitivo.
- Un solo estado para panel y agente, derivado de hechos con fecha.
- El código lo sortea el servidor, se guarda como HMAC ilegible y se ve **una vez**; uno nuevo solo anula el pendiente esperado y un caducado nunca bloquea.
- Ningún error, registro ni supervisión lleva valores recibidos.
- Seis asuntos reservados; A-1 y A-10 condicionan partes del plan.

## Hechos de partida

H-1 constitución 1.4 sin la nota del artículo 2 → A-1. H-2 migraciones de la 010 (20/11/2026): escritura directa de `authenticated` (M07), auditoría genérica (M04), `licencias.estado` y `estado_manual`, cascadas, sin `anulado_en`, `vivo`, `nombre_clave`, `version` ni motivo → «Datos». H-3 `clientes.nombre` con la lista blanca TP de la 010 (su D-7) → A-9. H-4 respuestas del responsable en la 010 (20/11) contrarias a las de aquí (13/11): la baja revoca conexiones y no se deshace (su cuestión 8; M07, M08) → A-10; el usuario de cliente lee su cliente y su licencia (su cuestión 5) → A-11. H-5 la 001 dice **10 min** y tiene la orden `generar_codigo` → A-5, DD-26. H-6 la 024 pone I-11 solo bajo I-10 e I-08. H-7 PostgreSQL 18: `lower()` según configuración regional → T-P1. H-8 sin Docker, CI, entorno previo ni conector → etapas.

## Supuestos y dependencias

021 (guardia, `leerDelArea()`, `es_admin()`, `administradores.correo`, PRUEBA-003 y 048; espera al auditor); 020 (componentes, `useAccion`, `TextoDato`, `textoPlano()`, `rutas.ts`, `sin-acceso.ts`, `registrarFallo`, `textos.ts`, muestra, V-1 a V-7); fase 1 (`secretos.ts`, `registro.ts`, activación); fase 2 (010, 011, 014); 023, 024 y 025.

**Orden obligado:** nada con `[cliente]` antes de A-1; O-3, O-4 y lo de baja, no antes de A-10; nada conectado sin «Datos», T-P1 y T-P4; ningún criterio de base de datos, agente o entorno previo se cierra con ficticios. **Etapas:** A (app y 020, en la muestra; solo evidencia de interfaz); A' (PGlite, borrador; no cierra nada); B (migraciones, 021, T-P1, T-P4, A-1); C (conector y agente de prueba); D (entorno previo).

## Piezas y responsabilidades

### Principio: quién decide qué

Acceso: guardia de la 021 y `es_admin()`. Estado: la regla única de la base de datos. Transición: la operación con cerrojo. Nombre: TP y `privado.clave_nombre()`; la copia TypeScript solo activa el botón. Caducidad: reloj de la base de datos.

### Mapa de archivos

`admin/` = `src/app/admin/clientes/`, `lib/` = `src/lib/clientes/`; (n) = nueva respecto a `docs/ESQUELETO.md`. **`ingeniero-frontend`:** `admin/page.tsx`, `nuevo/`, `[cliente]/`, `[cliente]/editar/` (guardia primero; inexistente → `sin-acceso.ts`, V-1); `admin/[cliente]/secciones.ts` (n); `admin/_vista/` (n); `src/components/clientes/` (n: `ListaClientes`, `FichaCliente`, `SeccionDatos`, `SeccionLicencia`, `SeccionCodigos`, `SeccionConexiones`, `FormularioCliente`, `FormularioCaducidad`, `DialogoCodigo`); `src/components/dialogo/DialogoConfirmacionTecleada.tsx` (n, con `disenador-ui`); `catalogo.ts`, `textos.ts`, `rutas.ts`; `src/app/muestra/clientes/` (n; `page.muestra.tsx`, `comprobarAccesoMuestra()` primero en cada página y acción, sin registro ni supervisión, en PRUEBA-024 de la 020). **`ingeniero-backend`:** `admin/acciones.ts` (**únicas** acciones: 11 operaciones, `listarClientes`, `leerSeccion`, `comprobarNombre`; primero `exigirAdministradorEnAccion()`); `lib/nombre.ts`, `caracteres.ts`, `fecha-madrid.ts`, `entradas.ts`, `resultados.ts`, `fuente.ts`, `fuente-bd.ts` (n); `src/lib/licencias/generar-codigo.ts` (único fuera de `src/lib/oauth/` que importa `secretos.ts`). **`qa`:** `tests/ficticios/clientes/` (n, nunca importado por el producto), `tests/vectores/nombres.json` (n), `tests/unit/clientes/`, `tests/e2e/clientes/`. **`ingeniero-bd`:** migraciones nuevas de la 022 (DD-22), `supabase/tests/`, `supabase/seed.sql`.

**Rutas críticas** (pedir en `docs/SEGURIDAD.md`): `admin/acciones.ts`, `src/lib/clientes/`, `src/lib/licencias/`, `DialogoCodigo`, migraciones. **Prohibido importar** (PRUEBA-005): `src/lib/supabase/admin.ts`, `conector.ts`, `acceso.ts`; `secretos.ts` salvo `generar-codigo.ts`; `tests/` y `src/app/muestra/` desde el producto; `unstable_cache`, `use cache`, `revalidateTag`.

### Rutas y pantallas

`/admin/clientes` «Clientes»; `/admin/clientes/nuevo` «Nuevo cliente»; `/admin/clientes/[cliente]` «Ficha de cliente»; `/admin/clientes/[cliente]/editar` «Editar cliente». `[cliente]`: UUID; mal formado, ajeno o inexistente responden igual (V-1); elige, no concede (REQ-074, A-1). Sin `loading`, `not-found` anidado, `generateMetadata` ni `Suspense` sobre esa decisión. Alta y edición son páginas; `no-store` (V-4).

### Lista de clientes

L-1 trae filas, total, estados y conexiones activas; L-7 (023) aparte, y su fallo no tumba la lista. Columnas (REQ-001, REQ-078): nombre (`TextoDato`, enlace), estado más «Sin señal» y «En pausa», licencia y caducidad, conexiones activas, alta. Orden (REQ-003): nombre, estado (de «Activo» a «Dado de baja», DD-13) o alta, ascendente o descendente; por defecto `nombre_asc`; desempate por clave e identificador. Filtro por estado. Búsqueda (REQ-004) con botón o Intro (DD-12), ≤120 caracteres, en el cuerpo (V-3), por fragmento de la clave, comodines literales, sin guardar ni registrar ni ir a la dirección. 25 filas (DD-18); página inexistente → la última.

### Ficha de cliente

Secciones `BloqueDatos` con `leerSeccion` y reintento; una caída no tumba las demás (REQ-039). **1 Datos:** nombre, estado, frecuencia, alta, canal en lectura; Editar, Dar de baja o Reactivar. **2 Licencia:** estado, causas con fecha, creación, caducidad, revocadas anteriores; Crear, Suspender, Reactivar, Caducidad, Revocar. **3 Códigos:** estado, autor (`administradores.correo` o «Administrador no disponible»), fechas, nunca el código; 25, recientes primero; Generar. **4 Conexiones:** asistente, alta, último uso, estado, revocación y motivo; 25, activas primero; Revocar. **5 a 7:** marcos de Reglas (025), Informes y Órdenes (023) (REQ-007, CA-004). Acciones según el estado leído; decide la base de datos (REQ-031); estado desconocido, sin acciones. Aviso permanente de baja con conexiones activas (DD-16, A-10).

### Formularios de alta y edición

Dos campos (REQ-008, REQ-009, CA-005). `nombre`: NFC (DD-24), recortado, 1 a 120 puntos de código, dentro de TP, único (`obligatorio`, `demasiado_largo`, `caracter_no_admitido`, `repetido`). `frecuencia`: `^[0-9]{1,3}$`, 1 a 168, 24 propuesto (`obligatorio`, `no_entero`, `fuera_de_rango`). Edición con `version`; si cambió, `datos_desactualizados` y lo actual junto a lo escrito (REQ-049). O-1 crea las reglas por defecto (REQ-079). Alta `incierta`: «Comprobar» (L-6) enlaza o reintenta sin duplicar (REQ-035).

### Diálogos de confirmación

Siete (REQ-030) con `DialogoConfirmacion` y `{nombre, distintivo}`; texto en `textos.ts` (CA-021): efecto, cuándo lo nota el agente, si se deshace; cancelar no llama a nada.

| Acción | Distintivo | Además del efecto | Agente | Deshacer |
| --- | --- | --- | --- | --- |
| Dar de baja | Alta | Credenciales y cómo cortarlas (REQ-067; A-10) | Revisión | Sí |
| Reactivar cliente | Alta | Licencia o pausa pueden seguir impidiéndolo | Revisión | Sí |
| Suspender licencia | Creación | Conexiones conservadas | Revisión | Sí |
| Reactivar licencia | Creación | Cobro, caducidad o pausa pueden seguir | Revisión | Sí |
| Revocar licencia | Creación | Definitivo; N conexiones; nombre tecleado | Llamada | **No** |
| Caducidad | Creación | Fecha anterior y nueva | Tras la fecha | Sí |
| Revocar conexión | Asistente, alta, último uso | Solo esa; reconectar exige código | Llamada | **No** |

### Confirmación tecleada (REQ-071)

`DialogoConfirmacionTecleada` = `DialogoConfirmacion` + campo multilínea (120 caracteres visibles a 320 px, pegar sí, sin autocompletar ni corregir, nombre unido con `aria-describedby`) + `coincide(texto)`. Coincidencia anunciada solo al cambiar; botón con `aria-disabled`, enfocable; Intro no confirma; foco en «Cancelar». O-8 compara con el nombre **actual** (DD-08). Lo tecleado no se guarda ni registra. Depende de T-P2.

### Generación y diálogo del código

- Diálogo previo: licencia, un uso, 15 minutos, una sola vista y aviso de pendiente no caducado (REQ-068).
- `generar-codigo.ts` sortea (001), calcula el HMAC y llama a O-10 con `pendiente_esperado`; otro pendiente → nada creado, `estado_cambiado`, relectura (REQ-045, REQ-075, DD-02). El código sale solo tras la transacción (REQ-058); sin respuesta, `incierta`.
- `DialogoCodigo` (REQ-021, REQ-022): grupos de cuatro, caducidad, vista única, copiar con teclado; **solo se cierra con «He terminado»** (DD-11); al caducar, se sustituye. Solo en memoria; se borra al cerrar, al desmontar u ocultar el componente y en `pagehide` (m-8).
- Nunca en `registro.ts`, `registrarFallo`, direcciones, auditoría ni en claro (REQ-024). Queda el portapapeles (AM-03). En la muestra, códigos con una «U», fuera de Crockford (DD-27).

### Regla de nombres (REQ-077, REQ-051 a REQ-053)

**Admitidos:** exactamente TP de M02; `caracteres.ts` lo copia rango a rango, con vectores comunes con pgTAP. Quedan fuera controles, invisibles, bidireccionales, selectores, U+2800, uso privado y no caracteres (m-5, DD-23), y también otros alfabetos y emojis (A-9). Antes de validar, NFC (DD-24): TP no admite marcas combinantes sueltas. **Clave** (`claveNombre()` = `privado.clave_nombre()`; **manda la base de datos**): NFD; quitar solo U+0301, U+0300, U+0302 (DD-05); NFC; minúsculas; espacios seguidos a uno y recortado («Pérez» = «perez»; «Peña» ≠ «Pena»). Se guarda en NFC y recortado (REQ-052, CA-006). `nombre_clave` con índice único, también de baja (DD-07).

### Fecha de caducidad y fuentes

Caducidad (REQ-019): hora de Madrid (`fecha-madrid.ts`); hora inexistente o repetida → `hora_no_valida` (DD-10); al minuto; ≤10 años; `no_futura` la decide la base de datos. `fuente-bd.ts` fija, sin interruptor (DD-15); la ficticia, solo en muestra y pruebas; PRUEBA-006 contra las dos.

## Contratos

`contratos/` no cambia. Formas internas cerradas, sin actor:

- Resultado: `hecha`, `rechazada`, `no_permitida`, `incierta` (V-7).
- Motivos: `ya_estaba_hecho`, `sin_cambios`, `no_encontrado` (no existe o es ajeno, un texto; REQ-056), `transicion_no_permitida`, `cliente_de_baja`, `ya_tiene_licencia`, `licencia_revocada`, `licencia_suspendida`, `licencia_caducada`, `estado_cambiado`, `datos_desactualizados`, `confirmacion_no_coincide`, `datos_no_validos`.
- Errores `{campo, codigo}`: `nombre`, `frecuencia`, `fecha`, `hora`, `nombre_tecleado`; `obligatorio`, `demasiado_largo`, `caracter_no_admitido`, `repetido`, `no_entero`, `fuera_de_rango`, `formato`, `no_futura`, `demasiado_lejana`, `hora_no_valida`, `no_coincide`.
- Estados (catálogo de la 020): cliente `baja`, `sin_licencia`, `licencia_caducada`, `licencia_suspendida`, `pendiente_activar`, `activo`; licencia `activa`, `suspendida`, `caducada`, `revocada`; causa `manual`, `cobro`; código `pendiente`, `usado`, `caducado`, `anulado`; conexión `activa`, `revocada`; motivo `administrador`, `credencial_reutilizada`, `revocacion_licencia`; asistente `claude`, `chatgpt`, `otro`; canal `estable`, `prueba`. Fuera de lista: `desconocido`.
- Lista: `nombre_asc`, `nombre_desc`, `estado_asc`, `estado_desc`, `alta_asc`, `alta_desc`; seis estados o ninguno; página 1 a 10.000. Entrada: objeto plano; lo de más se ignora sin registrar (REQ-055).
- `registro.ts`: `clientes_no_permitida`, `clientes_objeto_ajeno`, `clientes_resultado_incierto`, `clientes_lectura_fallida`.

## Datos

Migraciones nuevas de la 022, tras M10 y reversibles (DD-22; cuestión 3 de la 010), con `.claude/rules/bd.md` y la forma de D-1 de la 010. Tocan tablas y funciones de la 010: sus pruebas de permisos y su lista de funciones se actualizan por `propuestas.md`.

- **D-1** `clientes`: `nombre_clave` por `privado.clave_nombre()`, no escribible, índice único; `version`; `baja_en`; `creado_en` inmutable.
- **D-2** `licencias`: `estado` y `estado_manual` pasan a hechos `revocada_en`, `suspension_manual_en`, `suspension_cobro_en` (fase 6), `caduca_en`, `creada_en`, `creada_por`; índice de una vigente con `revocada_en is null`; `cliente_id` inmutable. Lo que en la 010 lee `estado` o `estado_manual` (M08 `licencia_vigente`, `resolver_token`; el resto, inventario de T-P4) se reescribe con D-7 en la misma migración.
- **D-3** `codigos_activacion`: `anulado_en`; `vivo` con índice único parcial por licencia; uso y anulación excluyentes; `caduca_en` = `creado_en` + 15 min; `creado_por` de la sesión (disparador de M07; nulo solo con origen `responsable_fuera_del_panel`, DD-26); inmutables `licencia_id`, `codigo_hmac`, `caduca_en`, `creado_por`; `codigo_hmac` ilegible (DD-04; M07 ya lo excluye).
- **D-4** `conexiones`: `motivo_revocacion` si y solo si `revocada_en`; `licencia_id` inmutable; toda revocación de la 010 da motivo (A-10).
- **D-5** Disparadores para todos salvo el propietario de la base de datos, fuera de este modelo (m-6): licencia revocada intocable; `revocada_en`, motivo, `usado_en`, `anulado_en` no se quitan ni cambian; `vivo` no vuelve a verdadero; `caduca_en` de código no se alarga; inmutables de D-1 a D-4; ninguna conexión activa en licencia revocada, leída con `for share` (m-1). Rechazos con código fijo, sin valores (M-2).
- **D-6** Se revocan a `authenticated` los `insert` y `update` de M07 en las cuatro tablas; reglas por O-1 (permisos: 025); sin cascadas; nada borra.
- **D-7** `privado.situacion_licencia`, `privado.estado_cliente_lista`, `privado.estado_codigo`, para panel y conector. **D-8** lecturas L-1 a L-7. **D-9** las 11 operaciones.
- **Permisos de las 18 (m-3, DD-25):** `security definer` en `privado`, `search_path = pg_catalog, pg_temp`, todo calificado (D-035); `execute` solo a `authenticated`, revocado a los demás; `es_admin()` antes de leer parámetros. `privado.revocar_conexion_interna` (O-11 y conector) y `privado.crear_codigo_interno` (O-10, DD-26), sin `execute` para `authenticated`. Exposición: REQ-010 de la 010 (T-P4); lista cerrada de PRUEBA-048 de la 021.
- **D-10** `auditoria`: `accion` cerrada con las I- de aquí, `fila_principal_id` y `origen` (como pide la 021), solo desde funciones; se quitan los disparadores genéricos de M04 sobre las cuatro tablas.
- **D-11** conector (abajo). **D-12** ficticios: seis estados, 1.000 clientes, ficha de 50 conexiones y 200 códigos, todos los estados, motivos, causas y canales, nombres de CA-006 y CA-035 dentro de TP. **D-13** pgTAP con varias conexiones (A-4).

### Estado derivado

Al consultar, con el reloj de la base de datos; sin tarea periódica. Licencia: `revocada` > `caducada` > `suspendida` (alguna causa) > `activa`; causas siempre visibles. Cliente (REQ-002): `baja` > `sin_licencia` > `licencia_caducada` > `licencia_suspendida` > `pendiente_activar` > `activo`. Código: `usado` > `anulado` > `caducado` > `pendiente`, sin mirar `vivo`. **Pendiente** = `vivo` y `caduca_en > now()` (M-1). Conexión: `revocada` > `activa`. Agente: instrucciones solo con cliente activo, licencia `activa` y nada más que lo impida (011, 023); si no, `suspendida`; revocada o de baja: fase 2 y A-10. `forzar_activa` desaparece; la fase 6 hará otro hecho que solo anule la causa de cobro (REQ-072).

### Superficie de lectura

Cero filas sin `es_admin()`, con independencia de otras políticas (DD-17, también frente a A-11); por `leerDelArea()`. L-1 lista (búsqueda, estado, orden, página → filas y total); L-2 cliente con `version` (cero filas = sin acceso); L-3 licencias; L-4 códigos con correo del autor, **nunca el HMAC**; L-5 conexiones; L-6 identificador por clave; L-7 indicaciones de hasta 25 clientes (023).

### Operaciones

Una transacción: (1) `es_admin()` o `no_permitida`; (2) cerrojos cliente → licencia → códigos y conexiones; (3) `es_admin()` otra vez, o `no_permitida` sin cambios (m-2); (4) objeto del cliente o `no_encontrado`; (5) validación dentro de la función, antes de escribir (M-2); (6) transición desde lo leído, o `ya_estaba_hecho` sin auditar (REQ-047); (7) cambio y auditoría, todo o nada (REQ-062); (8) resultado cerrado con, como mucho, un identificador o una fecha. Nunca reciben actor, estado, canal ni fecha de alta. «Anula pendiente»: `anulado_en` e I-11 al pendiente no caducado, si lo hay.

| N.º | Entradas | Condición | Efecto | Auditoría |
| --- | --- | --- | --- | --- |
| O-1 Alta | `nombre`, `frecuencia` | Válidos; nombre libre | Activo, sin licencia, reglas por defecto (REQ-079) | I-01; I-41 |
| O-2 Edición | `cliente`, `version`, `nombre`, `frecuencia` | Versión igual; sin cambios → `sin_cambios` | Sube `version` | I-02 |
| O-3 Baja | `cliente` | Activo | `baja_en`; anula pendiente; lo demás, A-10 | I-03; I-11 |
| O-4 Reactivar cliente | `cliente` | De baja; solo si A-10 la mantiene | Activo; ningún código revive | I-04 |
| O-5 Crear licencia | `cliente`, `caduca_en` opcional | Activo; sin licencia viva; futura ≤10 años | Sin causas | I-05 |
| O-6 Suspender | `cliente`, `licencia` | Activo; sin revocar ni causa manual | `suspension_manual_en`; anula pendiente | I-06; I-11 |
| O-7 Reactivar licencia | `cliente`, `licencia` | Activo; con causa manual | Quita solo la manual | I-07 |
| O-8 Revocar licencia | `cliente`, `licencia`, `nombre_tecleado` | Sin revocar; cliente en cualquier estado; clave del nombre actual | Licencia y conexiones activas (misma fecha, `revocacion_licencia`); anula pendiente | I-08; I-12 por conexión; I-11 |
| O-9 Caducidad | `cliente`, `licencia`, `caduca_en` o nada | Activo; sin revocar; futura ≤10 años; igual → `sin_cambios` | Fija, cambia o quita | I-09 |
| O-10 Generar código | `cliente`, `licencia`, `codigo_hmac`, `pendiente_esperado` opcional | Activo; licencia `activa`; sin otro pendiente; HMAC válido y nuevo | Retira vivos caducados; anula el esperado; crea a 15 min; devuelve identificador y caducidad | I-10; I-11 |
| O-11 Revocar conexión | `cliente`, `conexion` | Activa; cualquier estado | Motivo `administrador`, por `revocar_conexion_interna` | I-12 |

**O-10 y los caducados (M-1, DD-20):** con el cerrojo de la licencia, pone `vivo = false` a sus vivos ya caducados, sin `anulado_en` ni auditoría (siguen «Caducado»); después compara el pendiente solo contra el no caducado. Si el esperado caducó entre la lectura y la operación, se retira y se crea el nuevo. Lo hace `crear_codigo_interno`.

Cliente de baja: la licencia solo admite revocar (DD-09); editar sí. Revocar dos veces: `ya_estaba_hecho` (DD-19); el resto de REQ-060: `transicion_no_permitida`, `cliente_de_baja` o `no_futura`.

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

Orden único que nadie invierte (REQ-048). Una licencia viva y un código vivo: cerrojo e índice (DD-03). Nombre: índice sobre `nombre_clave`; quien pierde recibe `repetido`, nunca `incierta` (REQ-053, M-2). Edición: `version` (REQ-049). La activación toma los mismos cerrojos (D-11).

### Errores sin valores (M-2, DD-21)

O-1 y O-2 validan antes de escribir y capturan `unique_violation` y `check_violation` para dar el error de campo; ninguna restricción ni disparador lanza valores. `fuente-bd.ts` traduce solo por SQLSTATE y código fijo, descarta `message`, `details` y `hint`, y nunca pasa el objeto de error a `registro.ts` ni a la supervisión (PRUEBA-005). T-P1 comprueba qué registra `Nido` (`log_statement`, `log_min_duration_statement`, `log_min_error_statement`); con parámetros, A-12.

### Lo que el conector tiene que cumplir (D-11)

(1) Cada llamada, renovación, **respuesta repetida en la ventana de gracia** y canje del código de autorización (`authorization_code`, m-4) comprueba en la misma consulta que conexión y licencia siguen vivas; sin caché de tokens ni réplicas (REQ-027, CA-019). (2) Estado de D-7. (3) La activación, tras los cerrojos, vuelve a comprobar todo y rechaza igual código usado, anulado o caducado (por `caduca_en`), licencia no activa y cliente de baja (REQ-063); marca el uso con una actualización condicionada (m-1). (4) 15 minutos (A-5). (5) Credencial reutilizada: `revocar_conexion_interna`. (6) `ultimo_uso_en` real. (7) Tipo dentro del HMAC. (8) H-03 a H-05 de la 024: fase 2. (9) La purga de la 014 no toca pendientes.

### Matriz de acceso

CA-022, CA-044. Solo el administrador activo con sesión completa lee (tablas sin `codigo_hmac`) y opera. Sin sesión y conector: 0. Sin privilegios, con un factor, sesión cerrada o caducada, o de baja: 0 filas y `no_permitida`. Usuario de cliente, con cualquier identificador: igual, y en las tablas 0 códigos y conexiones; su cliente y su licencia, A-11.

### Migración y vuelta atrás

M22-1 columnas e índices de D-1 a D-4 y lecturas de la 010 reescritas (revertir solo sin datos reales); M22-2 `clave_nombre()` y D-7; M22-3 lecturas y operaciones (quitarlas falla seguro); M22-4 D-5, D-6 y fuera los disparadores genéricos (**revertirla devuelve la escritura directa de M07**: con datos reales, solo con una app sin esta función). PRUEBA-019, en el sitio de A-4.

## Flujo

Acción: diálogo → `POST` con `useAccion` → `exigirAdministradorEnAccion()` y validador → operación. `hecha`: relee y avisa; `rechazada`: motivo y relee; `no_permitida`: lo dice; `incierta`: aviso permanente y relectura antes de repetir (REQ-035). Instalar: O-1 → O-5 → O-10 → activación. Credencial robada: O-11; si no se sabe cuál, O-8.

Fallos: lectura → error con reintento, nunca vacío; fallo en operación, auditoría o reglas → nada hecho e `incierta`; restricción reconocida → su error de campo; respuesta perdida → `incierta` (el código de O-10 se pierde); sesión inválida, también tras un cerrojo → `no_permitida` (REQ-043); estado cambiado → el motivo real; valor desconocido → `incierta`.

## Auditoría de esta función

La operación, en su transacción: actor de la sesión, mismo momento, vinculadas a la principal; **sin código, HMAC, nombre, tecleado ni fecha** (REQ-034). I-11 e I-41 siempre vinculadas; I-12 principal en O-11 y vinculada en O-8; I-11 también bajo I-06 e I-03 (H-6). CA-025 = principal más vinculadas (DD-14). Sin fila: lecturas, cancelaciones, rechazos, repeticiones y retirada de caducados.

## Tareas previas

Primeras del plan, con evidencia. **T-P1:** Postgres de `Nido` (versión, codificación, configuración regional, registros); `clave_nombre()` = `claveNombre()` y `caracteres.ts` = TP en todos los vectores (U+2800, uso privado, NFD); si no hay igualdad, al arquitecto. **T-P2:** campo dentro del diálogo de alerta (PRUEBA-011 de la 020), tres motores. **T-P3:** en producción, el código solo en el cuerpo de su acción (V-112); `no-store`; copiar; con el diálogo **abierto**, atrás y adelante no lo repintan (m-8). **T-P4:** exposición de la 010 para las 18; usos de `licencias.estado`; sin ella, solo etapa A.

## Amenazas de esta función

A-nn de `docs/SEGURIDAD.md`; RQ = riesgo que queda.

| N.º | Amenaza → control | Prueba |
| --- | --- | --- |
| AM-01 | Superadmin comprometido conecta su asistente → 021, código de 15 min, I-10, conexión visible. RQ: alerta en fase 4 (A-8) | 017, 021 |
| AM-02 | Código en registros o auditoría (art. 4) → solo en su respuesta; HMAC; V-112 | 025, T-P3 |
| AM-03 | Volver a ver el código → memoria, `no-store`, borrado al desmontar y en `pagehide`; atrás y adelante (m-8). RQ: portapapeles | 013, 021, T-P3 |
| AM-04 | Doble envío → pendiente esperado, cerrojo, índice; un caducado vivo no cuenta (M-1) | 016, 021 |
| AM-05 | Fuerza bruta (A-02) → fases 1 y 2; un vivo, 15 min | Fase 2 |
| AM-06 | HMAC elegido → sin clave no hay código; solo anula, auditado | 016 |
| AM-07 | Objeto ajeno (art. 2) → comprobado en la base de datos | 023 |
| AM-08 | Perfil sin derecho → guardia y `es_admin()` | 013, 022 |
| AM-09 | Escritura directa → D-6, D-5, frente a la API y la clave secreta; no frente al propietario (m-6) | 014 |
| AM-10 | Fallo en función privilegiada → `es_admin()` primero, D-035, sin SQL por texto, permisos y lista cerrada (m-3) | 013; 048 de la 021 |
| AM-11 | La revocación no corta → D-11 (1), también el canje (m-4) | 027 |
| AM-12 | Activación simultánea → cerrojos, nueva comprobación, uso condicionado, `for share` (m-1). RQ: diseño de la fase 2 | 018 |
| AM-13 | Cliente equivocado → nombre único, distintivo, tecleado; TP fuera otros alfabetos. RQ: parecidos latinos | 001, 009, 021 |
| AM-14 | Nombre que ejecuta código (A-21) → `TextoDato`, `textoPlano()`. RQ: sin la política de contenido de la 021, un guion en `/admin` podría generar y leer un código | 012 |
| AM-15 | Otro origen o marco → `SameSite=Strict`, `comprobarOrigen()`, `POST` | 023 |
| AM-16 | Campos de más → entradas cerradas | 003, 023 |
| AM-17 | Búsqueda o tecleado registrados (art. 1) → en el cuerpo; «Errores sin valores» | 020, 025 |
| AM-18 | Algo falso o ficticio (art. 3) → `incierta`, fuente fija | 005, 006, 024 |
| AM-19 | Acción sin rastro → auditoría en la transacción; `generar_codigo` por `crear_codigo_interno` (DD-26) | 017 |
| AM-20 | Clave secreta → nadie importa `admin.ts` | 005 |
| AM-21 | Tiempo → reloj de la base de datos, `caduca_en` inmutable | 014, 016 |
| AM-22 | Sondear existencia → respuesta igual (V-1) | 022 |
| AM-23 | Baja con credenciales vivas → avisos. RQ: según A-10 | 009 |
| AM-24 | Revocaciones en cadena → auditadas; sin límite de ritmo | 017 |
| AM-25 | Búsqueda abusiva → parámetros, 120 | 002 |
| AM-26 | Instrucciones en un nombre (A-16) → datos | Revisión |
| AM-27 | Copia de la base de datos (A-05) → solo HMAC | Fase 2 |
| AM-28 | Licencia bloqueada por un código caducado sin usar → «O-10 y los caducados» | 016 |
| AM-29 | Valores en errores de restricción y registros de Postgres → «Errores sin valores» | 002, 025 |
| AM-30 | Operación que sigue tras perder la sesión esperando un cerrojo → paso (3) | 030 |
| AM-31 | Caracteres que se ven en blanco → TP | 001, 002 |

## Pruebas

Vitest; navegador en local sobre la compilación de producción; pgTAP en el sitio de A-4; agente con el conector; entorno previo (V-114). Fallos provocados con un intermediario o una restricción de prueba, sin ganchos en el producto. Número de PRUEBA- y etapa entre corchetes.

001 nombres en TypeScript [A]. 002 nombres en la base de datos, comodines, 20 carreras de altas (el perdedor, `repetido`) [B]. 003 validadores y campos de más [A]. 004 `fecha-madrid.ts` [A]. 005 estática: importaciones, guardia primero (amplía la 003 de la 021), sin cachés ni borrados, ningún objeto de error al registro [A]. 006 contrato de `FuenteClientes` [A, B]. 007 lista en la muestra [A]. 008 ficha en la muestra, sin código [A]. 009 diálogos, tecleado (10 que no actúan, 3 que sí), `DialogoCodigo` [A]. 010 `axe` A y AA, 320 px, teclado y lector [A]. 011 textos [A]. 012 nombres de CA-006 [A, B]. 013 matriz, `codigo_hmac` ilegible, permisos de las 18 [B]. 014 escritura directa y disparadores [B]. 015 licencias: 20 carreras, transiciones, causas [B]. 016 códigos: esperado, 20 carreras, anulaciones; un caducado sin usar y otro generado con esperado vacío y con el caducado: `hecha`, «Caducado», 0 I-11, un vivo; 20 carreras con un caducado vivo [B]. 017 auditoría de las 11, fallos sin efecto [B]. 018 20 carreras cruzadas; activación contra revocación [B, C]. 019 vuelta atrás [B]. 020 lista y ficha con 1.000 clientes; V-1 a V-4 [B]. 021 acciones desde la interfaz, dos envíos en <100 ms [B]. 022 sesiones de CA-022 y CA-044 [B]. 023 objetos ajenos, campos de más, origen, marcos [B]. 024 fallos y respuestas perdidas [B]. 025 cero apariciones de códigos, búsquedas, tecleados y nombres testigo en la app, la supervisión y los registros de Postgres y de la API [B, D]. 026 agente: baja, suspensión, revocación, caducidad, códigos [C]. 027 corte en <1 s, 20 veces, también en el canje [C]. 028 200 mediciones por operación [D]. 029 `revision-privacidad` [B]. 030 baja de un administrador mientras su O-8 espera un cerrojo: `no_permitida`, 0 cambios [B].

### Cada criterio, con su prueba y cuándo se puede cerrar

Números de CA- y, entre paréntesis, de PRUEBA-; antes de su etapa la evidencia es parcial.

- **A:** 026 (011), 027 (010), 028 (010), 029 (010), 030 (011), 041 (009, 011; A-10), 043 (001, 009, 010; T-P2), 047 (007).
- **B, migraciones:** 001 (007, 020), 004 (008, 020), 006 (012; A-9), 015 (009, 021), 016 (008, 020), 018 (008, 020), 021 (009, 021), 031 (016, 021), 032 (016, 021), 033 (017, 021), 036 (003, 023), 038 (023), 039 (008, 020, 023).
- **B, pgTAP:** 002 (001, 002, 007, 020), 008 (005, 014), 011 (008, 015), 017 (025; V-112), 022 (013, 022; A-11), 023 (005, 013, `revisor`), 024 (017, 024), 025 (017), 037 (014, 023), 044 (013, 022; A-1), 045 (014), 048 (017, 024).
- **B, pgTAP con varias conexiones:** 009 (015), 034 (018), 035 (001, 002, 003), 042 (016, 021).
- **C:** 005 (017, 020, 026), 007 (026; A-10), 010 (026), 012 (014, 015, 026), 013 (004, 026), 014 (016, 026), 019 (027), 020 (005, 014, 027), 040 (026), 046 (016, 021, 026).
- **D:** 003 (028).

Sin pgTAP no hay VERIFICADA (art. 13).

## Valores que fija este diseño

Búsqueda ≤120 caracteres; página 1 a 10.000; códigos y conexiones de 25 en 25; caducidad al minuto y ≤10 años; acción sin respuesta a los 30 s; coincidencia anunciada solo al cambiar. **Rendimiento (REQ-006), sin medir:** una consulta para ≤1.000 clientes, sin extensiones; índices: único de `nombre_clave`, licencias vivas por cliente, conexiones vivas por licencia, códigos y conexiones por licencia y fecha; la ficha consulta en paralelo. Si PRUEBA-028 falla, al arquitecto.

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Solo el nombre comercial; errores y registros sin valores; `Nido`, A-12 |
| 2 Aislamiento | **BLOQUEANTE para `[cliente]` hasta A-1** | El identificador elige y no concede, pero la 1.4 no tiene la nota |
| 3 Cierre en fallo | Cumple | `es_admin()` antes y después de los cerrojos; lo desconocido es `incierta` |
| 4 Secretos | Cumple | Solo HMAC; supervisión según V-112 |
| 5 Especificación | Cumple con condición | A-9, A-10 y A-11 pueden cambiar requisitos |
| 6 Revisión independiente | Pendiente | Segunda vuelta del auditor y P1 |
| 7 Entradas no confiables | Cumple | Listas cerradas |
| 8 Límites en el anfitrión | No aplica | No toca la compuerta |
| 9 Prompt por despliegue | No aplica | |
| 10 Producto final | Con condiciones | AM-14 y A-4 |
| 11 Reversibilidad | Con límite | M22-4 |
| 12 Español | Cumple | |
| 13 Evidencias honestas | Cumple | Nada dado por probado (m-6) |
| 14 Cambios reservados | Cumple | Lo reservado se pide |

## Dependencias nuevas

**Ninguna**: `Intl`, validadores propios (V-109 en VERIFICAR), sin extensiones. `normalize()` y `lower()`: documentación de PostgreSQL 18 (`functions-string`, 14/11/2026); versión sin comprobar (T-P1).

## Alternativas descartadas

Escribir con sesión y RLS; estado de licencia en columna; anular siempre al generar; anular el caducado (estado falso); quitar el índice de `vivo`; `vivo` generado; volver a mostrar el código; sortear en la base de datos; `unaccent`; lista negra de caracteres; rechazar el NFD; búsqueda en la dirección; casilla en vez de teclear; cerrar el código con Escape; ficticia por variable; revocar en bloque; `search_path` vacío; cambiar migraciones ya auditadas de la 010.

## Decisiones que requieren ADR

Tras P1: ampliar ADR-0003 (los dashboards no escriben en tablas, solo por funciones); enmendar ADR-0006, punto 7 (dos causas con fecha); ADR-0002, punto 4 (15 minutos y un código vivo).

## Decisiones por delegación

**D-019 (14/11/2026), aceptadas en `aclaraciones.md`:** DD-01 a DD-19, descritas donde se citan (DD-06, la lista negra, sustituida por DD-23); A-2, A-3 (ahora en A-11), A-5, A-7 (ahora en A-9) y A-8.

**Decididas por delegación D-036, 21/11/2026** (técnicas, opción del auditor o la más restrictiva; ninguna respuesta del responsable las contradice): DD-20 pendiente = vivo y sin caducar (M-1). DD-21 errores sin valores (M-2). DD-22 migraciones propias tras las de la 010. DD-23 caracteres = TP (m-5; su efecto sobre REQ-052 es A-9). DD-24 NFC. DD-25 D-035 y permisos de m-3. DD-26 `generar_codigo` solo en local con ficticios; fuera, por `crear_codigo_interno` con origen `responsable_fuera_del_panel` (m-7; concreta A-6). DD-27 ficticios con «U».

## Cobertura de requisitos

Números de REQ-. Lista: 001 a 005, 010, 078. Valores: 006. Ficha y 020: 007, 037 a 040, 065. Rutas, guardia y matriz: 031, 041 a 043, 074. Formularios: 008, 009, 035, 054, 079. Nombres: 051 a 053, 077. Operaciones: 011, 013 a 020, 026, 033, 044, 047, 050, 056, 058, 060, 062, 066, 069, 070, 072, 073. Diálogos: 030, 067, 071. Código: 021, 022, 024, 045, 046, 068, 075. Lecturas: 023, 025. D-5, D-6, D-11: 012, 027 a 029, 057, 059, 061, 063, 076. Mapa: 032. Auditoría: 034. Contratos: 036, 055. Cerrojos: 048, 049. AM-15: 064. Los 79; los 48 CA, arriba.

## Asuntos abiertos para el responsable

Reservados (constitución, configuración de un proyecto, gasto o contrarios a una respuesta suya).

| N.º | Asunto y opciones | Propuesta | Bloquea |
| --- | --- | --- | --- |
| A-1 | Nota del artículo 2 (elegida el 12/11/2026), sin aplicar en la 1.4. (a) Aplicarla y ajustar `.claude/rules/interfaz.md`. (b) Volver al `especificador` | (a) | `[cliente]`, CA-044 |
| A-4 | Sitio de pgTAP con varias conexiones. (a) CI `bd.yml` (propuesta 24 de la 010). (b) Docker externo | (a) | Cuarenta criterios |
| A-9 | TP rechaza otros alfabetos, emojis y signos fuera de la lista, frente a REQ-052 y «Cualquiera, como texto» (cuestión 12). (a) Aceptar TP y ajustar REQ-052. (b) Ampliar TP en la 010, con dictamen | (a) | CA-006 |
| A-10 | Baja: «solo se suspende» y reactivable (022, 13/11) frente a «revoca las conexiones», sin vuelta (010, 20/11). (a) La de la 010: cambian REQ-011, REQ-067, CA-007, CA-041, sale O-4 y hay motivo por baja. (b) La de la 022: la 010 quita `al_dar_de_baja`, `impedir_reactivar_cliente` y el filtro de cliente activo de `resolver_token` | (a), más reciente y restrictiva | O-3, O-4, CA-007, CA-041 |
| A-11 | El usuario de cliente lee su cliente y su licencia (010, cuestión 5) frente a CA-022 (0 filas). (a) La de la 010 y se ajusta CA-022. (b) Quitar esas políticas hasta la fase 5 | (a); las lecturas de aquí no le dan nada | CA-022 |
| A-12 | Qué registra `Nido` (detalle de errores, sentencias con parámetros). (a) Desactivarlo, una persona. (b) Aceptarlo por escrito | (a) | PRUEBA-025 |

## Lo que este diseño no ha podido comprobar

Nada ejecutado, tampoco `comprobar-specs.mjs`. Sin comprobar: lo de T-P1 a T-P4 y V-112; rendimiento; «Sin señal» (023); licencia revocada en el agente (cuestión 17 de la 011); diseños de 011, 014, 023, 024 y 025. De la 010 se leyeron su D-7, sus aclaraciones y M02, M04, M07 y M08 en lo citado.

## Consolidación

**Base:** `diseno.nuevo.md` (19/11/2026), condensación D-023 del diseño del 14/11/2026 (de 109 KB a unos 36 KB, sin cambiar decisiones, valores ni identificadores), sin el dictamen incorporado. Se tomó por ser la más reciente y la única dentro de D-023; el texto del 14/11/2026 queda en el historial de git. `diseno.nuevo.md` se retira (línea en `propuestas.md`).

**Hallazgo → apartado:** B-1 → A-1 (sin corrección posible aquí). M-1 → «Estado derivado», «O-10 y los caducados», D-11. M-2 → «Errores sin valores», D-5, A-12. m-1 → D-5, D-11. m-2 → «Operaciones». m-3 → permisos de las 18. m-4 → D-11. m-5 → «Regla de nombres». m-6 → D-5. m-7 → DD-26. m-8 → «Generación y diálogo», T-P3. m-9 → mapa de archivos. Cada uno, también en su AM y su prueba. Migraciones de la 010 → «Hechos», «Datos»; sus respuestas del responsable → A-10, A-11.
