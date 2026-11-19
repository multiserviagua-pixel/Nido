# 022 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (pendiente en esta versión) · 14/11/2026

Especificación APROBADA el 13/11/2026 (P0, con la enmienda de las reglas por defecto). Lo aprueba P1 tras dictamen del `auditor-seguridad` (ruta crítica). **Ninguna prueba se ha ejecutado.** Sin código ni migraciones; la base de datos sale de `docs/MODELO-DATOS.sql` (PROPUESTA) y de los diseños de 001, 020 y 021. Lo delegado (D-019) lleva DD-.

## Resumen

- Lista y ficha **solo leen**. Las 11 acciones son **funciones de la base de datos** llamadas con la sesión del administrador: en una transacción, `privado.es_admin()` (021), cerrojos, transición sobre el estado real, cambio y auditoría; todo o nada. Sin escritura directa; disparadores protegen lo definitivo.
- Un solo estado para panel y agente, derivado de hechos con fecha de la licencia.
- El código lo sortea el servidor, se guarda como HMAC ilegible y se ve **una vez**; uno nuevo solo anula el pendiente esperado.
- Acceso de la 021; interfaz de la 020 más `DialogoConfirmacionTecleada`; lo que no depende de la fase 2 se construye antes con ficticios. Ocho asuntos abiertos; A-1 condiciona P1.

## Hechos de partida y lo que el diseño hace con cada uno

H-1 constitución 1.0 sin nota del artículo 2 → A-1. H-2 la 010 sin diseño ni migraciones → «Datos» es una petición. H-3 el modelo da escritura a `authenticated` y audita con disparador genérico → contra REQ-034, REQ-057, REQ-060, REQ-061, REQ-076; se cambia. H-4 la 001: 12 caracteres Crockford (60 bits), **10 min**, `anulado_en`, `secretos.ts`, orden `generar_codigo` → A-5, A-6. H-5 la 021 espera al auditor (V-107, V-108, V-113 en VERIFICAR) → se cita. H-6 la 020 sin diálogo con campo y `h1` sin datos → pieza nueva y `h1` «Ficha de cliente». H-7 la 024 pone I-11 solo bajo I-10 e I-08 → se pide bajo I-06 e I-03. H-8 PostgreSQL 18: `lower()` según configuración regional, `normalize()` solo UTF8 → T-P1. H-9 sin Docker, CI (003), entorno previo (D-016, V-114) ni conector → etapas.

## Supuestos y dependencias

021: `exigirAdministrador()`, `exigirAdministradorEnAccion()` (con `comprobarOrigen()`), `leerDelArea()`, `src/lib/supabase/servidor.ts`, `privado.es_admin()`, `administradores.correo`, prueba de puntos de entrada (pendiente de auditor y P1). 020 (PLANIFICADA): componentes, `useAccion`, `leerResultadoAccion()`, `TextoDato`, `textoPlano()`, `rutas.ts`, `estado-direccion.ts`, `sin-acceso.ts`, `registrarFallo`, `textos.ts`, muestra, contratos V-1, V-2, V-3, V-4. Fase 1: `secretos.ts`, `registro.ts`, cabeceras, activación. Fase 2 (010, 011, 014; PROPUESTA): «Datos», conector, pgTAP. 023, 024, 025 (sin diseño): indicaciones, inventario, valores por defecto, secciones. Responsable: nota del artículo 2 y `.claude/rules/interfaz.md` (**sin aplicar**).

**Orden obligado:** nada con `[cliente]` antes de A-1; nada conectado sin migraciones y T-P1; ningún criterio de base de datos, agente o entorno previo se cierra con ficticios.

**Etapas:** A (app y 020): todo salvo `fuente-bd.ts`, en la muestra; solo evidencia de interfaz. A' (PGlite): borrador de funciones; no cierra nada. B (migraciones, 021, T-P1, A-1): `fuente-bd.ts`, páginas y acciones. C: conector y agente de prueba. D: entorno previo.

## Piezas y responsabilidades

### Principio: quién decide qué

Acceso: guardia de la 021 y `privado.es_admin()`. Estado: la regla única de la base de datos; el resto traduce. Transición: la operación con cerrojo, no el diálogo. Nombre: `privado.clave_nombre()`; la copia TypeScript solo activa el botón. Caducidad: reloj de la base de datos.

### Mapa de archivos

`admin/` = `src/app/admin/clientes/`, `lib/` = `src/lib/clientes/`; (n) = nueva respecto a `docs/ESQUELETO.md`. **`ingeniero-frontend`:** `admin/page.tsx`, `nuevo/`, `[cliente]/`, `[cliente]/editar/` (guardia primero; ficha inexistente → `sin-acceso.ts`, V-1); `admin/[cliente]/secciones.ts` (n; la 023 y la 025 añaden); `admin/_vista/` (n); `src/components/clientes/` (n: `ListaClientes`, `FichaCliente`, `SeccionDatos`, `SeccionLicencia`, `SeccionCodigos`, `SeccionConexiones`, `FormularioCliente`, `FormularioCaducidad`, `DialogoCodigo`); `src/components/dialogo/DialogoConfirmacionTecleada.tsx` (n, con `disenador-ui`); `catalogo.ts`, `textos.ts`, `rutas.ts`; `src/app/muestra/clientes/` (n). **`ingeniero-backend`:** `admin/acciones.ts` (**únicas** acciones: 11 operaciones, `listarClientes`, `leerSeccion`, `comprobarNombre`; primero `exigirAdministradorEnAccion()`); `lib/nombre.ts`, `lib/caracteres.ts`, `lib/fecha-madrid.ts`, `lib/entradas.ts`, `lib/resultados.ts`, `lib/fuente.ts`, `lib/fuente-bd.ts` (n; `FuenteClientes` y su única implementación); `src/lib/licencias/generar-codigo.ts` (único fuera de `src/lib/oauth/` que importa `secretos.ts`). **`qa`:** `tests/ficticios/clientes/` (n, **nunca importado por el producto**), `tests/vectores/nombres.json` (n), `tests/unit/clientes/`, `tests/e2e/clientes/`. **`ingeniero-bd`:** `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql`.

**Rutas críticas** (pedir en `docs/SEGURIDAD.md`): `admin/acciones.ts`, `src/lib/clientes/`, `src/lib/licencias/`, `DialogoCodigo`, migraciones. **Prohibido importar** (PRUEBA-005): `src/lib/supabase/admin.ts`, `conector.ts`, `acceso.ts`; `secretos.ts` salvo `generar-codigo.ts`; `tests/` y `src/app/muestra/` desde el producto; `unstable_cache`, `use cache`, `revalidateTag`.

### Rutas y pantallas

`/admin/clientes` «Clientes»; `/admin/clientes/nuevo` «Nuevo cliente»; `/admin/clientes/[cliente]` «Ficha de cliente»; `/admin/clientes/[cliente]/editar` «Editar cliente». `[cliente]`: UUID (020); mal formado, ajeno o inexistente responden igual (V-1); elige, no concede (REQ-074). Sin `loading`, `not-found` anidado, `generateMetadata` ni `Suspense` sobre esa decisión. Alta y edición son páginas; `no-store` (V-4).

### Lista de clientes

- L-1 trae filas, total, estados y conexiones activas calculados; L-7 (023) va aparte y su fallo no tumba la lista.
- Columnas (REQ-001, REQ-078): nombre (`TextoDato`, enlace), estado más «Sin señal» y «En pausa», licencia y caducidad, conexiones activas, alta. A 320 px se desplaza la tabla.
- Orden (REQ-003): `nombre_asc` (defecto), `nombre_desc`, `estado_asc`, `estado_desc`, `alta_asc`, `alta_desc`; por estado, de «Activo» a «Dado de baja», inverso a REQ-002 (DD-13); desempate por clave e identificador.
- Filtro por estado. Búsqueda (REQ-004) con botón o Intro (DD-12), ≤120 caracteres, en el cuerpo (V-3), por fragmento de la clave, comodines literales, sin guardar ni registrar; **con búsqueda, nada en la dirección**.
- 25 filas, texto de posición de la 020 (DD-18); página inexistente → la última. Cinco estados; si falla L-7, esa columna lo dice.

### Ficha de cliente

Secciones `BloqueDatos` con `leerSeccion`, estados y reintento; una caída no tumba las demás (REQ-039); a 320 px, enlaces al inicio. **1 Datos:** nombre, estado, frecuencia, alta, canal solo lectura; Editar, Dar de baja o Reactivar. **2 Licencia:** estado, causas con fecha, creación, caducidad, revocadas anteriores; Crear, Suspender, Reactivar, Fijar, Cambiar o Quitar caducidad, Revocar. **3 Códigos:** estado, autor (`administradores.correo` o «Administrador no disponible»), fechas, nunca el código; 25, recientes primero; Generar. **4 Conexiones:** asistente, alta, último uso, estado, revocación y motivo; 25, activas primero; Revocar. **5, 6, 7:** marcos de Reglas (025), Informes y Órdenes (023); aquí sin controles de reglas (REQ-007, CA-004); cierran juntas; usuarios, de la 040.

Acciones ofrecidas según el estado leído; decide la base de datos (REQ-031); estado desconocido, sin acciones. Aviso permanente (DD-16) si está de baja con conexiones activas que siguen renovando.

### Formularios de alta y edición

Dos campos (REQ-008, REQ-009, CA-005). `nombre`: recortado, 1 a 120 puntos de código, sin rechazados, único (`obligatorio`, `demasiado_largo`, `caracter_no_admitido`, `repetido`). `frecuencia`: `^[0-9]{1,3}$`, 1 a 168, 24 propuesto (`obligatorio`, `no_entero`, `fuera_de_rango`). Edición con `version`; si cambió, `datos_desactualizados` y lo actual junto a lo escrito (REQ-049). O-1 crea las reglas por defecto (REQ-079). Alta `incierta`: «Comprobar» (`comprobarNombre`, L-6) enlaza o reintenta sin duplicar (REQ-035).

### Diálogos de confirmación

Siete (REQ-030) con `DialogoConfirmacion` y `{nombre, distintivo}`; texto en `textos.ts` (CA-021): efecto, cuándo lo nota el agente, si se deshace; cancelar no llama a nada.

| Acción | Distintivo | Además del efecto de su O- | Agente | Deshacer |
| --- | --- | --- | --- | --- |
| Dar de baja | Alta | Credenciales vivas y cómo cortarlas (REQ-067) | Revisión | Sí |
| Reactivar cliente | Alta | Licencia o pausa pueden seguir impidiéndolo | Revisión | Sí |
| Suspender licencia | Creación | Conexiones conservadas | Revisión | Sí |
| Reactivar licencia | Creación | Cobro, caducidad o pausa pueden seguir | Revisión | Sí |
| Revocar licencia | Creación | Definitivo; N conexiones; nombre tecleado | Llamada | **No** |
| Caducidad | Creación | Fecha anterior y nueva | Tras la fecha | Sí |
| Revocar conexión | Asistente, alta, último uso | Solo esa; reconectar exige código | Llamada | **No** |

### Confirmación tecleada (REQ-071)

`DialogoConfirmacionTecleada` = `DialogoConfirmacion` + campo multilínea (120 caracteres visibles a 320 px, pegar sí, sin autocompletar ni corregir, nombre unido con `aria-describedby`) + `coincide(texto)`. Coincidencia anunciada solo al cambiar; botón con `aria-disabled`, enfocable, mientras no coincide; Intro no confirma; foco en «Cancelar». O-8 compara con el nombre **actual** (DD-08). Lo tecleado no se guarda ni registra. Depende de T-P2.

### Generación y diálogo del código

- Diálogo previo: licencia, un uso, 15 minutos, una sola vista y aviso de pendiente (REQ-068).
- `generar-codigo.ts` sortea (001), calcula el HMAC y llama a O-10 con `pendiente_esperado`; otro pendiente → nada creado, `estado_cambiado`, relectura (REQ-045, REQ-075, DD-02). El código sale solo tras la transacción (REQ-058); sin respuesta, `incierta`.
- `DialogoCodigo` (REQ-021, REQ-022): grupos de cuatro, caducidad, vista única, copiar con teclado. **Solo se cierra con «He terminado»** (DD-11); al caducar, se sustituye. Solo en memoria; se borra al cerrar.
- Nunca en `registro.ts`, `registrarFallo`, direcciones, auditoría ni en claro (REQ-024). Queda el portapapeles (AM-03).

### Regla de nombres (REQ-077, REQ-051, REQ-052, REQ-053)

`claveNombre()` y `privado.clave_nombre()` con vectores comunes; **manda la base de datos**; se guarda el nombre recortado (REQ-052, CA-006). **Rechazados** (DD-06, `caracteres.ts`): Cc (U+0000 a U+001F, U+007F a U+009F); todo Cf (U+200B, U+200C, U+200D, U+FEFF, U+200E, U+200F, U+202A a U+202E, U+2066 a U+2069, U+00AD, etiquetas); U+2028, U+2029; U+034F, U+115F, U+1160, U+17B4, U+17B5, U+180B a U+180F, U+3164, U+FE00 a U+FE0F, U+FFA0, U+E0100 a U+E01EF; sustitutos sueltos. Emojis con U+200D o selector, rechazados; otros espacios valen U+0020. **Clave:** NFD; quitar solo U+0301, U+0300, U+0302 (DD-05); NFC; minúsculas; Zs → U+0020, colapsado y recortado («Pérez» = «perez»; «Peña» ≠ «Pena»). `clientes.nombre_clave` con índice único, también de baja (DD-07). No iguala alfabetos (AM-13).

### Fecha de caducidad (REQ-019)

Fecha y hora de Madrid (`fecha-madrid.ts`); hora inexistente o repetida → `hora_no_valida` (DD-10); al minuto; ≤10 años; `no_futura` la decide la base de datos.

### Fuente de datos y fuente ficticia

`fuente-bd.ts` fija, sin interruptor (DD-15); la ficticia, solo en muestra y pruebas; PRUEBA-006 contra las dos.

## Contratos

`contratos/` no cambia. Formas internas cerradas, sin actor:

- Resultado: `hecha`, `rechazada`, `no_permitida`, `incierta` (`leerResultadoAccion()`, V-7).
- Motivos: `ya_estaba_hecho`, `sin_cambios`, `no_encontrado` (no existe o es ajeno, un texto; REQ-056), `transicion_no_permitida`, `cliente_de_baja`, `ya_tiene_licencia`, `licencia_revocada`, `licencia_suspendida`, `licencia_caducada`, `estado_cambiado`, `datos_desactualizados`, `confirmacion_no_coincide`, `datos_no_validos`.
- Errores `{campo, codigo}`: `nombre`, `frecuencia`, `fecha`, `hora`, `nombre_tecleado`; `obligatorio`, `demasiado_largo`, `caracter_no_admitido`, `repetido`, `no_entero`, `fuera_de_rango`, `formato`, `no_futura`, `demasiado_lejana`, `hora_no_valida`, `no_coincide`.
- Estados (catálogo de la 020; ámbitos `cliente`, `licencia`, `causa`, `codigo`, `conexion`, `motivo_revocacion`, `asistente`, `canal`): `baja`, `sin_licencia`, `licencia_caducada`, `licencia_suspendida`, `pendiente_activar`, `activo`; `activa`, `suspendida`, `caducada`, `revocada`; `manual`, `cobro`; `pendiente`, `usado`, `caducado`, `anulado`; `activa`, `revocada`; `administrador`, `credencial_reutilizada`, `revocacion_licencia`; `claude`, `chatgpt`, `otro`; `estable`, `prueba`. Fuera de lista: `desconocido`.
- Lista: seis órdenes, seis estados o ninguno, página 1 a 10.000. Entrada: un objeto plano; lo de más se ignora sin registrar (REQ-055).
- `registro.ts`: `clientes_no_permitida`, `clientes_objeto_ajeno`, `clientes_resultado_incierto`, `clientes_lectura_fallida`.

## Datos

Petición a la fase 2 (ruta crítica; mejor en las migraciones iniciales; reparto con la 010 en el plan).

- **D-1** `clientes`: `nombre` con restricción de caracteres y 1 a 120; `nombre_clave` por `privado.clave_nombre()`, no escribible, índice único; `version`; `baja_en`; `creado_en` inmutable; `canal` sin cambio aquí.
- **D-2** `licencias`: sin `estado` ni `estado_manual`; `revocada_en`, `suspension_manual_en`, `suspension_cobro_en` (solo fase 6), `caduca_en`, `creada_en`, `creada_por`; índice único de una sin revocar por cliente; `cliente_id` inmutable.
- **D-3** `codigos_activacion`: `anulado_en`; `vivo` con índice único parcial por licencia; uso y anulación excluyentes; `caduca_en` = `creado_en` + 15 min; `creado_por` de la sesión; inmutables `licencia_id`, `codigo_hmac`, `caduca_en`, `creado_por`; `codigo_hmac` ilegible para toda sesión (DD-04).
- **D-4** `conexiones`: `motivo_revocacion` si y solo si `revocada_en`; `licencia_id` inmutable.
- **D-5** Disparadores para cualquiera: licencia revocada intocable; `revocada_en`, motivo, `usado_en`, `anulado_en` no se quitan ni cambian; `vivo` no vuelve a verdadero; `caduca_en` de código no se alarga; inmutables de D-1, D-2, D-3, D-4; ninguna conexión activa en licencia revocada.
- **D-6** `authenticated` sin `insert`, `update`, `delete` en las cuatro tablas; reglas por O-1 (permisos: 025); sin cascadas; nada borra.
- **D-7** `privado.situacion_licencia`, `privado.estado_cliente_lista`, `privado.estado_codigo` para panel y conector. **D-8** lecturas L-1, L-2, L-3, L-4, L-5, L-6, L-7. **D-9** las 11 operaciones, expuestas como fije la 010 (T-P4). **D-10** `auditoria.accion` cerrada con las I- de esta función, `fila_principal_id`, solo desde funciones, sin disparador genérico. **D-11** conector (abajo). **D-12** ficticios: seis estados, 1.000 clientes, ficha de 50 conexiones y 200 códigos, todos los estados, motivos, causas y canales, nombres de CA-006 y CA-035. **D-13** pgTAP con varias conexiones (A-4).

### Estado derivado

Al consultar, con el reloj de la base de datos; sin tarea periódica. Licencia: `revocada` > `caducada` > `suspendida` (alguna causa) > `activa`; causas siempre visibles. Cliente (REQ-002): `baja` > `sin_licencia` > `licencia_caducada` > `licencia_suspendida` > `pendiente_activar` (sin conexión viva) > `activo`. Código: `usado` > `anulado` > `caducado` > `pendiente`. Conexión: `revocada` > `activa`. Agente: instrucciones solo con cliente activo, licencia `activa` y sin pausa ni versión que lo impida (011, 023); si no, `suspendida`; con licencia revocada, fase 2. «Forzar activa» (ADR-0006, punto 7): otro hecho que solo anule la causa de cobro (REQ-072).

### Superficie de lectura

Cero filas sin `privado.es_admin()`, con independencia de otras políticas (DD-17); con sesión, por `leerDelArea()`. L-1 lista (búsqueda, estado, orden, página → filas y total); L-2 cliente con `version` (cero filas = sin acceso, V-1); L-3 licencias; L-4 códigos con correo del autor, **nunca el HMAC**; L-5 conexiones; L-6 identificador por clave (`comprobarNombre`); L-7 indicaciones de hasta 25 clientes (023).

### Operaciones

Una transacción: (1) `privado.es_admin()` o `no_permitida`; (2) cerrojos cliente → licencia → códigos y conexiones; (3) objeto del cliente o `no_encontrado`; (4) transición desde el estado leído, o `ya_estaba_hecho` sin auditar (REQ-047); (5) cambio y auditoría, todo o nada (REQ-062); (6) resultado cerrado con, como mucho, un identificador o una fecha. Nunca reciben actor, estado, canal ni fecha de alta.

| N.º | Entradas | Condición | Efecto | Auditoría |
| --- | --- | --- | --- | --- |
| O-1 Alta | `nombre`, `frecuencia` | Válidos; nombre libre | Activo, sin licencia, con reglas por defecto de la 025 (REQ-079) | I-01; I-41 |
| O-2 Edición | `cliente`, `version`, `nombre`, `frecuencia` | Versión igual; sin cambios → `sin_cambios` | Sube `version` | I-02 |
| O-3 Baja | `cliente` | Activo | `baja_en`; anula pendiente | I-03; I-11 |
| O-4 Reactivar cliente | `cliente` | De baja | Activo; ningún código revive | I-04 |
| O-5 Crear licencia | `cliente`, `caduca_en` opcional | Activo; sin licencia viva; futura ≤10 años | Sin causas | I-05 |
| O-6 Suspender | `cliente`, `licencia` | Activo; sin revocar ni causa manual | `suspension_manual_en`; anula pendiente | I-06; I-11 |
| O-7 Reactivar licencia | `cliente`, `licencia` | Activo; con causa manual | Quita solo la manual | I-07 |
| O-8 Revocar licencia | `cliente`, `licencia`, `nombre_tecleado` | Sin revocar; cliente en cualquier estado; clave del nombre actual | Licencia y conexiones activas (misma fecha, `revocacion_licencia`); anula pendiente | I-08; I-12 por conexión; I-11 |
| O-9 Caducidad | `cliente`, `licencia`, `caduca_en` o nada | Activo; sin revocar; futura ≤10 años; igual → `sin_cambios` | Fija, cambia o quita | I-09 |
| O-10 Generar código | `cliente`, `licencia`, `codigo_hmac`, `pendiente_esperado` opcional | Activo; licencia `activa`; sin otro pendiente; HMAC válido y nuevo | Anula el esperado; crea a 15 min; devuelve identificador y caducidad | I-10; I-11 |
| O-11 Revocar conexión | `cliente`, `conexion` | Activa; cualquier estado | Motivo `administrador`, con la función interna de la revocación automática | I-12 |

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

Orden único que nadie invierte (REQ-048). Una licencia viva y un código vivo: cerrojo e índice único (DD-03). Nombre: índice sobre `nombre_clave`; quien pierde recibe `repetido` (REQ-053). Edición: `version` (REQ-049). La activación toma los mismos cerrojos (D-11) y D-5 impide la conexión activa en licencia revocada.

### Lo que el conector tiene que cumplir (D-11)

(1) Cada llamada, renovación y **respuesta repetida en la ventana de gracia** comprueba en la misma consulta que conexión y licencia siguen vivas; sin caché de tokens ni réplicas (REQ-027, CA-019). (2) Estado de la regla única (D-7). (3) La activación rechaza igual código usado, anulado o caducado, licencia no activa y cliente de baja (REQ-063), con estos cerrojos. (4) Código a 15 minutos fijado por la base de datos (A-5). (5) Credencial reutilizada: función interna de O-11, `credencial_reutilizada`. (6) `ultimo_uso_en` real. (7) Tipo dentro del HMAC. (8) Hechos H-03, H-04, H-05 (024): fase 2. (9) La purga de la 014 no toca pendientes.

### Matriz de acceso de esta función

CA-022, CA-044. Solo el administrador activo con sesión completa lee (tablas en solo lectura, sin `codigo_hmac`) y opera. Sin sesión y rol del conector: 0 en todo. Usuario sin privilegios, usuario de cliente con cualquier identificador (tablas a 0 en la fase 3, A-3), administrador con un factor, sesión cerrada o caducada, o de baja: 0 filas y `no_permitida` sin efecto.

### Migración y vuelta atrás

M-1 columnas e índices de D-1, D-2, D-3, D-4 (quitarlas solo sin datos reales); M-2 `privado.clave_nombre()` y D-7; M-3 lecturas y operaciones (quitarlas falla seguro); M-4 D-5 y D-6 (**revertirla devuelve la escritura directa**: con datos reales, solo con una app sin esta función); M-5 `auditoria` (010; no se revierte en producción). PRUEBA-019, hoy sin sitio.

## Flujo

Acción: diálogo con lo que hay → `POST` con `useAccion` → `exigirAdministradorEnAccion()` y validador → operación. `hecha`: relee y avisa; `rechazada`: motivo y relee; `no_permitida`: lo dice; `incierta`: aviso permanente y relectura antes de repetir (REQ-035). Instalar: O-1 → O-5 → O-10 → activación. Credencial robada: O-11; si no se sabe cuál, O-8. Baja y vuelta: O-3, O-4.

Fallos: lectura → error con reintento, nunca vacío ni estado por defecto; fallo en operación, auditoría o reglas → nada hecho e `incierta`; respuesta perdida → `incierta`, reintento sin duplicar (el código de O-10 se pierde); sesión inválida → `no_permitida` (REQ-043); estado cambiado → el motivo real; valor desconocido → sin acciones o `incierta`.

## Auditoría de esta función

La escribe la operación en su transacción: actor de la sesión, mismo momento, vinculadas a la principal, objeto = fila afectada; **sin código, HMAC, nombre, tecleado ni fecha** (REQ-034; REQ-018 de la 010). Inventario de la 024; I-11 e I-41 siempre vinculadas; I-12 principal en O-11 y vinculada en O-8. Se pide I-11 bajo I-06 e I-03 (H-7). CA-025 = una principal más vinculadas (DD-14, A-2). Sin fila: lecturas, cancelaciones, rechazos, repeticiones; `no_permitida` y objetos ajenos cuentan en la supervisión. I-09 no dice qué cambió.

## Tareas previas: lo que hay que comprobar antes de construir

Primeras del plan, con evidencia en `evidencias/`. **T-P1:** Postgres de desarrollo (versión, codificación, configuración regional); `privado.clave_nombre()` = `claveNombre()` en todos los vectores; columna, índice y restricción con todos los rangos. Si falla: intercalación expresa o tabla propia; sin igualdad, al arquitecto. **T-P2:** campo dentro del diálogo de alerta (PRUEBA-011 de la 020), tres motores; si falla, alternativa de la 020. **T-P3:** en producción, el código solo en el cuerpo de su acción (ni otra respuesta, recarga, proceso ni supervisión, V-112); `no-store`; copiar; si falla, al arquitecto antes de `DialogoCodigo`. **T-P4:** la exposición de la 010 vale para 11 operaciones y 7 lecturas; sin ella, solo etapa A.

## Amenazas de esta función

A-nn de `docs/SEGURIDAD.md`; RQ = riesgo que queda.

| N.º | Amenaza → control | Prueba |
| --- | --- | --- |
| AM-01 | Superadmin comprometido conecta su asistente (A-01, A-11) → 021, un código de 15 min, I-10, conexión visible. RQ: alerta en fase 4 (A-8) | PRUEBA-017, PRUEBA-021 |
| AM-02 | Código en registros o auditoría (art. 4) → solo en su respuesta; HMAC; V-112 | PRUEBA-025, T-P3 |
| AM-03 | Volver a ver el código → memoria, `no-store`. RQ: portapapeles | PRUEBA-013, PRUEBA-021 |
| AM-04 | Doble envío → pendiente esperado, cerrojo, índice | PRUEBA-016, PRUEBA-021 |
| AM-05 | Fuerza bruta (A-02) → fases 1 y 2; un vivo, 15 min | Fase 2 |
| AM-06 | HMAC elegido → sin clave no hay código; solo anula, auditado | PRUEBA-016 |
| AM-07 | Objeto ajeno (art. 2) → comprobado en la base de datos | PRUEBA-023 |
| AM-08 | Perfil sin derecho (A-07, A-11) → guardia y `es_admin()` | PRUEBA-013, PRUEBA-022 |
| AM-09 | Escritura directa → D-6, D-5 | PRUEBA-014 |
| AM-10 | Fallo en función privilegiada → `es_admin()` primero, `search_path = ''`, sin SQL por texto | PRUEBA-013 |
| AM-11 | La revocación no corta (A-01, A-06) → D-11 (1) | PRUEBA-027 |
| AM-12 | Activación simultánea → cerrojos y disparador | PRUEBA-018, fase 2 |
| AM-13 | Cliente equivocado → nombre único, distintivo, tecleado. RQ: alfabetos | PRUEBA-001, PRUEBA-009, PRUEBA-021 |
| AM-14 | Nombre que ejecuta código (A-21) → `TextoDato`, `textoPlano()`; política de la 021 sin demostrar | PRUEBA-012 |
| AM-15 | Otro origen o marco (A-21) → `SameSite=Strict`, `comprobarOrigen()`, `POST` | PRUEBA-023 |
| AM-16 | Campos de más → entradas cerradas | PRUEBA-003, PRUEBA-023 |
| AM-17 | Búsqueda o tecleado registrados (art. 1) → en el cuerpo, sin registrar | PRUEBA-020, PRUEBA-025 |
| AM-18 | Algo falso o ficticio (art. 3) → `incierta`, fuente fija | PRUEBA-005, PRUEBA-006, PRUEBA-024 |
| AM-19 | Acción sin rastro → auditoría en la transacción; `generar_codigo` (A-6) | PRUEBA-017 |
| AM-20 | Clave secreta (A-10) → nadie importa `admin.ts` | PRUEBA-005 |
| AM-21 | Tiempo → reloj de la base de datos, `caduca_en` inmutable | PRUEBA-014, PRUEBA-016 |
| AM-22 | Sondear existencia → respuesta igual (V-1) | PRUEBA-022 |
| AM-23 | Baja con credenciales vivas (aceptado) → avisos. RQ: si nadie revoca | PRUEBA-009 |
| AM-24 | Revocaciones en cadena → auditadas; sin límite de ritmo | PRUEBA-017 |
| AM-25 | Búsqueda abusiva → parámetros, 120 | PRUEBA-002 |
| AM-26 | Instrucciones en un nombre (A-16) → datos | Revisión |
| AM-27 | Copia de la base de datos (A-05) → solo HMAC | Fase 2 |

## Pruebas

Vitest (002); navegador en local sobre la compilación de producción, con ficticios o contra desarrollo; pgTAP **sin sitio** (A-4); agente con el conector; entorno previo (D-016, V-114). Fallos provocados con un intermediario o una restricción de prueba, sin ganchos en el producto.

| Prueba | Qué | Etapa |
| --- | --- | --- |
| PRUEBA-001 | Nombres en TypeScript con los vectores | A |
| PRUEBA-002 | Nombres en la base de datos; comodines; 20 carreras de altas | B |
| PRUEBA-003 | Validadores y campos de más | A |
| PRUEBA-004 | `fecha-madrid.ts` | A |
| PRUEBA-005 | Estática: importaciones, guardia primero (amplía PRUEBA-003 de la 021), sin cachés ni borrados | A |
| PRUEBA-006 | Contrato de `FuenteClientes` | A, B |
| PRUEBA-007 | Lista en la muestra; búsqueda fuera de la dirección | A |
| PRUEBA-008 | Ficha en la muestra; nunca el código | A |
| PRUEBA-009 | Diálogos; tecleado (10 intentos que no actúan, 3 que sí); `DialogoCodigo` 10 min | A |
| PRUEBA-010 | `axe` A y AA, 320 px, teclado y lector | A |
| PRUEBA-011 | Textos | A |
| PRUEBA-012 | Nombres de CA-006 literales | A, B |
| PRUEBA-013 | Matriz de acceso; `codigo_hmac` ilegible | B |
| PRUEBA-014 | Escritura directa y disparadores | B |
| PRUEBA-015 | Licencias: 20 carreras, transiciones, causas | B |
| PRUEBA-016 | Códigos: pendiente esperado, 20 carreras, anulaciones | B |
| PRUEBA-017 | Auditoría de las 11 operaciones; fallos sin efecto | B |
| PRUEBA-018 | 20 carreras de operaciones cruzadas | B |
| PRUEBA-019 | Vuelta atrás | B |
| PRUEBA-020 | Lista y ficha con 1.000 clientes; V-1, V-2, V-3, V-4 | B |
| PRUEBA-021 | Acciones desde la interfaz; dos envíos en <100 ms | B |
| PRUEBA-022 | Sesiones de CA-022 y CA-044 | B |
| PRUEBA-023 | Objetos ajenos, campos de más, origen, marcos | B |
| PRUEBA-024 | Fallos y respuestas perdidas | B |
| PRUEBA-025 | Cero apariciones de códigos, búsquedas y tecleados | B, D |
| PRUEBA-026 | Agente: baja, suspensión, revocación, caducidad, códigos | C |
| PRUEBA-027 | Corte en <1 s, 20 repeticiones | C |
| PRUEBA-028 | 200 mediciones por operación | D |
| PRUEBA-029 | `revision-privacidad` | B |

### Cada criterio, con su prueba y cuándo se puede cerrar

Entre paréntesis, números de PRUEBA-; antes de su etapa la evidencia es parcial.

- **A:** CA-026 (011), CA-027 (010), CA-028 (010), CA-029 (010), CA-030 (011), CA-041 (009, 011), CA-043 (001, 009, 010; T-P2), CA-047 (007; ficticios de la 023).
- **B, migraciones:** CA-001 (007, 020), CA-004 (008, 020; reglas de la 025), CA-006 (012), CA-015 (009, 021), CA-016 (008, 020), CA-018 (008, 020), CA-021 (009, 021), CA-031 (016, 021), CA-032 (016, 021), CA-033 (017, 021), CA-036 (003, 023), CA-038 (023; 021 y 002), CA-039 (008, 020, 023).
- **B, pgTAP:** CA-002 (001, 002, 007, 020), CA-008 (005, 014), CA-011 (008, 015), CA-017 (025; plataforma en D, V-112), CA-022 (013, 022), CA-023 (005, 013, `revisor`), CA-024 (017, 024), CA-025 (017; DD-14), CA-037 (014, 023), CA-044 (013, 022; A-1), CA-045 (014), CA-048 (017, 024).
- **B, pgTAP con varias conexiones:** CA-009 (015), CA-034 (018), CA-035 (001, 002, 003), CA-042 (016, 021).
- **C:** CA-005 (017, 020, 026), CA-007 (026), CA-010 (026), CA-012 (014, 015, 026), CA-013 (004, 026), CA-014 (016, 026), CA-019 (027), CA-020 (005, 014, 027), CA-040 (026), CA-046 (016, 021, 026).
- **D:** CA-003 (028).

Ocho cierran en A; cuarenta necesitan la fase 2. Sin pgTAP no hay VERIFICADA (art. 13).

## Valores que fija este diseño

Búsqueda ≤120 caracteres; página 1 a 10.000; códigos y conexiones de 25 en 25; caducidad al minuto y ≤10 años; acción sin respuesta a los 30 s (`useAccion`); coincidencia anunciada solo al cambiar. **Rendimiento (REQ-006), sin medir:** una consulta para ≤1.000 clientes, sin extensiones; índices: único de `nombre_clave`, licencias vivas por cliente, conexiones vivas por licencia, códigos y conexiones por licencia y fecha; la ficha consulta en paralelo. Si PRUEBA-028 falla, al arquitecto.

## Decisiones por delegación (D-019)

Opción más segura, nada reservado; el orquestador las pasa a `aclaraciones.md`. DD-01 escritura solo por funciones, con disparadores (vale contra la API). DD-02 generar solo anula el pendiente esperado (ni código muerto ni dos). DD-03 índice además del cerrojo (demostrable). DD-04 HMAC ilegible (no hace falta). DD-05 solo se ignoran agudo, grave y circunflejo («ñ» y «ü» distintas). DD-06 control, formato e invisibles rechazados; espacios igualados. DD-07 nombre de baja reservado (reactivar sin choque). DD-08 tecleado comprobado en la base de datos. DD-09 de baja, solo revocar (ante la duda, denegar). DD-10 hora ambigua rechazada; ≤10 años. DD-11 `DialogoCodigo` solo con su botón; sustituido al caducar. DD-12 búsqueda expresa y fuera de la dirección. DD-13 orden de «Activo» a «Dado de baja». DD-14 CA-025 = principal más vinculadas (más rastro). DD-15 ficticia fuera del producto. DD-16 aviso permanente de baja con conexiones. DD-17 lecturas con `es_admin()` propia (ajenas a la fase 5). DD-18 texto de posición de la 020. DD-19 revocar dos veces: «ya estaba hecho».

## Cobertura de requisitos

Lista: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-010, REQ-078. Valores: REQ-006. Ficha y componentes de la 020: REQ-007, REQ-037, REQ-038, REQ-039, REQ-040, REQ-065. Rutas, guardia y matriz: REQ-031, REQ-041, REQ-042, REQ-043, REQ-074. Formularios: REQ-008, REQ-009, REQ-035, REQ-054, REQ-079. Nombres: REQ-051, REQ-052, REQ-053, REQ-077. Operaciones y transiciones: REQ-011, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-026, REQ-033, REQ-044, REQ-047, REQ-050, REQ-056, REQ-058, REQ-060, REQ-062, REQ-066, REQ-069, REQ-070, REQ-072, REQ-073. Diálogos: REQ-030, REQ-067, REQ-071. Código: REQ-021, REQ-022, REQ-024, REQ-045, REQ-046, REQ-068, REQ-075. Lecturas: REQ-023, REQ-025. D-5, D-6, D-11: REQ-012, REQ-027, REQ-028, REQ-029, REQ-057, REQ-059, REQ-061, REQ-063, REQ-076. Mapa: REQ-032. Auditoría: REQ-034. Contratos: REQ-036 (V-6), REQ-055. Cerrojos: REQ-048, REQ-049. AM-15: REQ-064. Son los 79; los 48 CA, en «Cada criterio».

## Comprobación de la constitución

1 Cumple: solo el nombre comercial; búsqueda y tecleado no se guardan; auditoría sin valores. 2 **Cumple solo con la nota aplicada**: el identificador elige y no concede, pero el texto vigente lo prohíbe como entrada; sin la nota, BLOQUEANTE (A-1). 3 Cumple: se deniega ante la duda; lo desconocido es `incierta`; un fallo nunca es vacío. 4 Cumple: solo HMAC, clave fuera; supervisión según V-112. 5 Cumple: cada REQ con apartado y cada CA con prueba. 6 Cumple: faltan dictamen y P1. 7 Cumple: listas cerradas; documentación como datos. 8 No aplica: ningún estado relaja límites. 9 No aplica: no toca prompt ni canal. 10 Cumple con condiciones: política de contenido de la 021 y criterios sin sitio. 11 Cumple con límite: M-4; revocaciones definitivas por especificación. 12 Cumple. 13 Cumple: nada dado por probado. 14 Cumple: la nota y los documentos compartidos se piden.

## Dependencias nuevas

**Ninguna**: `Intl`, validadores propios (V-109 en VERIFICAR), sin extensiones. `normalize()` y `lower()`: documentación de PostgreSQL 18 (`functions-string`, 14/11/2026); versión sin comprobar (T-P1).

## Alternativas descartadas

Escribir con sesión y RLS (sin atomicidad); estado de licencia en columna (recálculo y tarea periódica); `estado_manual` (cuestión 9); anular siempre al generar; clave de repetición; volver a mostrar el código (REQ-022); sortear en la base de datos (A-05); `unaccent` (iguala «ñ» y «n»); propiedad Unicode del motor (cambia por versión); búsqueda por pulsación o en la dirección; cliente fuera de la dirección; alta en diálogo; casilla en vez de teclear (cuestión 8); botón desactivado de verdad (sin foco); cerrar el código con Escape; ficticia por variable; revocar en bloque; límite de generaciones (AM-24).

## Decisiones que requieren ADR

Tras P1: ampliar ADR-0003 («operaciones del panel»: los dashboards no escriben en tablas, solo por funciones; frontera app → base de datos); enmendar ADR-0006, punto 7 (dos causas con fecha; «forzar activa» nunca quita la manual); ADR-0002, punto 4 (15 minutos y un código vivo; quizá basta el registro).

## Qué se pide a otras fases y a coordinación

En `propuestas.md` (14/11/2026); nada aplicado. **Fase 1:** 15 minutos y su texto (A-5); destino de `generar_codigo` (A-6); sorteo y HMAC en `secretos.ts`; códigos de `registro.ts`; rutas críticas; V-112 sin cuerpos ni argumentos. **Fase 2:** D-1, D-2, D-3, D-4, D-5, D-6, D-7, D-8, D-9, D-10, D-11, D-12, D-13; T-P4; cero filas a usuarios de cliente (A-3); H-03, H-04, H-05; pgTAP. **020:** rutas, estados, textos, `DialogoConfirmacionTecleada` en su muestra y PRUEBA-011. **021:** puntos de entrada de `admin/`; `administradores.correo` en L-4; diálogo abierto al caducar la sesión. **023:** L-7 y secciones. **024:** I-11 bajo I-06 e I-03; DD-14; identificar un código sin enseñarlo. **025:** fuente de valores por defecto; I-41 en O-1. **Fase 4:** canal y alerta (A-8). **Fase 5:** usuarios; revisar CA-022. **Fase 6:** `suspension_cobro_en`; «forzar activa» aparte. **Coordinación:** nota del artículo 2, `.claude/rules/interfaz.md`, `docs/SEGURIDAD.md`, `docs/TECNOLOGIAS.md`, `docs/DISENO.md`, `docs/ARQUITECTURA.md`.

## Asuntos abiertos para el responsable

| N.º | Asunto | Opciones | Propuesta |
| --- | --- | --- | --- |
| A-1 | Nota del artículo 2 sin aplicar; condiciona P1 | (a) Aplicarla antes de P1. (b) Volver al `especificador` | (a) |
| A-2 | CA-025 frente al inventario | (a) Principal más vinculadas. (b) Una fila y cambiar la 024 | (a) |
| A-3 | Usuarios de cliente y estas tablas | (a) Cero en fase 3. (b) Abrir y limitar CA-022 | (a) |
| A-4 | Cuarenta criterios sin sitio de prueba | (a) CI (003). (b) Docker externo. (c) PGlite provisional | (c), luego (a) o (b) |
| A-5 | 15 frente a 10 minutos | (a) 15 en las dos. (b) 10 | (a) |
| A-6 | `generar_codigo` sin sesión ni I-10 | (a) Retirarla fuera de local. (b) Mantenerla con su fila en la 024 | (a) |
| A-7 | «Barça» ≠ «Barca»; emoji compuesto fuera; alfabetos mezclados | (a) Así. (b) Quitar diéresis y cedilla salvo «ü». (c) Tabla de parecidos | (a) |
| A-8 | Alerta de conexión nueva en fase 4 (AM-01) | (a) Esperar. (b) Aviso mínimo ya | (a) |

## Lo que este diseño no ha podido comprobar

Nada se ha ejecutado. Sin comprobar: el Postgres de desarrollo y la clave (T-P1); que `caracteres.ts`, escrita de memoria, cubra todos los invisibles; el campo en el diálogo de Radix (T-P2); cachés de Next.js y supervisión (T-P3, V-112); copiar en tres motores; la exposición de la 010 (T-P4); el rendimiento; «Sin señal» (013); qué recibe el agente con licencia revocada (cuestión 17 de la 011); diseños de 002, 010, 011, 014, 021, 023, 024 y 025. `docs/MODELO-DATOS.sql` y los diseños de 020 y 021, leídos solo en lo citado.

## Condensación D-023

El 19/11/2026, de 109 KB a unos 36 KB, sin cambiar decisiones, valores ni identificadores. Si hay dudas, vale el original del 14/11/2026 (862 líneas).
El dictamen `dictamen-diseno.md` (B-1, M-1, M-2, m-1, m-2, m-3, m-4, m-5, m-6, m-7, m-8, m-9) es sobre esa versión y no está incorporado.
