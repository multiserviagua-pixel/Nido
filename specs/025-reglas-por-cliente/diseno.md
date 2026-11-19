# 025 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (**pendiente**) · Fecha: 19/11/2026

Especificación APROBADA el 13/11/2026 (P0). Necesita dictamen del `auditor-seguridad` (rutas críticas «RLS y migraciones» y «entrega del prompt»: las reglas viajan en `obtener_instrucciones`) y la puerta P1. **Ninguna prueba citada se ha ejecutado.** La base de datos se describe desde `docs/MODELO-DATOS.sql` (PROPUESTA; solo `reglas_cliente`, su disparador, política y permisos, y el bloque de reglas de `obtener_instrucciones`) y desde «Datos» de la 022, la 023 y la 024. Decisiones por delegación: DD-NN (D-019).

## Resumen

Una fila por cliente en `reglas_cliente`: dos enteros acotados y tres booleanos (artículo 1). **Ningún rol escribe la tabla directamente**: solo el alta de la 022 y las dos operaciones de esta función, que en una transacción comprueban `privado.es_admin()`, bloquean la fila, comparan **los cinco valores que el administrador tenía delante** con los guardados, escriben, calculan qué reglas cambiaron y anotan I-39 o I-40 (024) como último paso. Sin cambios, ni escriben ni anotan. Los valores por defecto tienen **una sola fuente**, `privado.reglas_por_defecto()`. La base de datos impide el cliente sin reglas, el borrado, el cambio de cliente y los valores fuera de tipo o rango.

La sección de la ficha tiene dos bloques independientes: **valores** (formulario y dos diálogos) e **historial** (I-39 e I-40 del cliente, sobre un corte, de 25 en 25). Todo con la sesión del usuario. El contrato del conector no cambia; se le pide **no servir valores por defecto** si faltan las reglas (REQ-045). Cinco asuntos abiertos; A-1 condiciona la P1.

## Hechos de partida

Leídos en el repositorio el 19/11/2026.

| N.º | Hecho | Consecuencia |
| --- | --- | --- |
| H-1 | Modelo: `reglas_cliente` con FK **`on delete cascade`**, defaults de columna, `actualizado_en`, `insert, update` para `authenticated` con política `es_admin()`, disparador genérico | D-1 a D-4. El disparador lo retira la 024 (su D-5) |
| H-2 | Modelo, `obtener_instrucciones` (líneas 491 a 497): sin fila, entrega 30, 3 y tres `true` | Contradice REQ-045: D-9 |
| H-3 | Contrato `obtener-instrucciones`, `reglas`: cinco claves, `additionalProperties: false`, 1–100 y 1–14 | Coincide; no cambia |
| H-4 | 024: I-39 `reglas_cambio`, I-40 `reglas_restablecimiento`, I-41 `reglas_por_defecto` (vinculada a I-01); tipo `reglas_cliente`, objeto = cliente; `reglas text[]` solo en I-39/I-40 con los cinco nombres de columna; `privado.anotar_auditoria` | **Confirmados**. Discrepancias menores: «Qué se pide», punto 3 |
| H-5 | 022: O-1 crea cliente y reglas «de la única fuente de la 025» con I-41; esquema común de operaciones; marco 5 de la ficha | Se sigue |
| H-6 | 023: `privado.pausa_efectiva`; 022: `privado.situacion_licencia` | Aviso de REQ-009 (D-8) |
| H-7 | Constitución 1.0 sin la nota aclaratoria del artículo 2 | A-1 |
| H-8 | Cuestión 15 de la 011 sin respuesta; V-108 y V-109 en VERIFICAR; sin Docker, CI ni entorno previo | A-2; tareas previas; etapas |

## Supuestos y dependencias

| De quién | Qué necesita la 025 |
| --- | --- |
| 020 | `Formulario` y campos, `DialogoConfirmacion`, `Tabla`, `Paginacion`, `BloqueDatos`, `useAccion`, `leerResultadoAccion()`, `AvisosTemporales`, `TextoDato`, `textos.ts`, formato común de fecha, `registrarFallo` |
| 021 | `exigirAdministrador()`, `exigirAdministradorEnAccion()` (con `comprobarOrigen()`), `leerDelArea()`, `privado.es_admin()` con `aal2` (V-108); `administradores.correo` y `estado` |
| 022 | Ficha, marco 5 en `secciones.ts`, O-1 con I-41, `situacion_licencia` |
| 023 / 024 | `pausa_efectiva` / D-1 a D-5 (auditoría, catálogo, `anotar_auditoria`) y `presentacion.ts` |
| Fase 2 | Migraciones; forma de exponer operaciones del panel; conector (D-9) |

**Orden obligado.** Interfaz con datos ficticios sin esperar a nadie; nada contra la base de datos antes de las migraciones de «Datos» y de la 024; ninguna ruta con identificador de cliente publicada sin A-1; ningún criterio de base de datos, agente o entorno previo cerrado con datos ficticios.

### Construcción en etapas

| Etapa | Hace falta | Se construye | Se prueba |
| --- | --- | --- | --- |
| A | App de la 002, componentes de la 020 | `src/lib/reglas/` salvo `fuente-bd.ts`; `src/components/reglas/`; sección con fuente ficticia | PRUEBA-001 a 006, 014 (estática). No cierra criterios que pidan base de datos |
| B | Migraciones en desarrollo; 021, 022 y 024 implementadas; sitio para pgTAP | `fuente-bd.ts`, `acciones-reglas.ts`, sección real | PRUEBA-007 a 013, 017, 018 |
| C | Conector de la fase 2 en desarrollo | — | PRUEBA-015 |
| D | Entorno previo con volumen | — | PRUEBA-016 |

## Piezas y responsabilidades

| Ruta | Qué hace | Quién |
| --- | --- | --- |
| `src/app/admin/clientes/acciones-reglas.ts` (nueva) | Únicas acciones: `leerReglas`, `leerHistorialReglas`, `guardarReglas`, `restablecerReglas`. Primero `exigirAdministradorEnAccion()`; luego `entrada.ts`, `fuente-bd.ts` y resultado cerrado; un rechazo registra un código, sin valores | backend |
| `src/lib/reglas/catalogo.ts` | Las cinco reglas en orden fijo: código (columna y clave del contrato), nombre visible, tipo, rango, unidad y clave de su explicación. Sin valores por defecto (DD-07) | frontend |
| `src/lib/reglas/entrada.ts` | Validadores de servidor y de formulario («Contratos») | backend |
| `src/lib/reglas/diferencias.ts` | Reglas que cambian, con valor actual y nuevo, para el diálogo. **La lista auditada la calcula la base de datos** | frontend |
| `src/lib/reglas/fuente-bd.ts` | LR-1, LR-2, OR-1, OR-2 con `leerDelArea()`. Nunca importa `lib/supabase/admin.ts` | backend |
| `src/components/reglas/`, `src/app/admin/clientes/_vista/reglas.tsx` | `SeccionReglas`, `ValoresReglas`, `FormularioReglas`, `DialogoReglas`, `HistorialReglas`; la vista los une con `useAccion` en el marco 5 | frontend |
| `tests/reglas/fuente-ficticia.ts` | Guiones de la etapa A; no importable desde el producto | pruebas |
| `supabase/migrations/`, `supabase/tests/reglas/` | D-1 a D-8 y su pgTAP; reparto con la 010 por coordinación | bd |

**Rutas críticas** (dictamen del `auditor-seguridad`): migraciones y pgTAP de D-1 a D-8, la petición D-9 al conector, `fuente-bd.ts`, `acciones-reglas.ts`, `entrada.ts` y PRUEBA-007 a 012 y 015.

### La sección en la ficha

Marco 5 de la 022. Dos `BloqueDatos` con sus cinco estados; si uno falla, el otro y la ficha se muestran (REQ-028).

**Valores** (LR-1). Lista de definiciones en el orden del catálogo: nombre, valor («30 correos», «3 días», «Sí», «No»), explicación y, si difiere, «Valor por defecto: 30 correos» (DD-15). Encima, como texto con `EtiquetaEstado`: «Coinciden con los valores por defecto» o «Distintas de los valores por defecto» (REQ-003). Botones «Cambiar reglas» y «Restablecer valores por defecto». Con `sin_reglas`: «No se pueden mostrar las reglas de este cliente», sin valores ni botones, y `registrarFallo`.

Explicaciones (`textos.ts`, revisadas frente a REQ-004 a 008 de la 012 en CA-001):

| Regla | Explicación |
| --- | --- |
| Máximo de correos por revisión | «En cada revisión, el agente trata como mucho este número de correos.» |
| Ventana de días | «El agente solo considera nuevos los correos recibidos en estos últimos días.» |
| Guardar adjuntos | «Con «No», el agente no guarda ningún documento en la nube del cliente.» |
| Preparar borradores | «Con «No», el agente no crea ningún borrador.» |
| Descargar facturas por enlace | «Con «No», el agente no abre ni descarga ningún enlace de factura.» |

**Formulario** (DD-14). «Cambiar reglas» pone el bloque en edición con lo último leído. Enteros: texto con `inputmode="numeric"`, unidad y rango visibles (DD-13). Booleanos: grupo de opciones «Sí» / «No». Ningún otro campo. «Guardar reglas»: errores junto al campo; sin diferencias, «No hay cambios que guardar» y ninguna petición (REQ-010); si no, el diálogo. «Cancelar» sale sin cambios.

**Diálogos** (`DialogoConfirmacion`, objetivo como en la 022). Cambio: «¿Guardar las reglas del agente?»; el cliente; una línea por regla que cambia («Máximo de correos por revisión: de 30 a 50»; «Preparar borradores: de Sí a No»); «Se aplicará en la siguiente revisión de su agente. Una revisión que ya haya empezado sigue con las reglas que recibió. Puedes volver a cambiarlas cuando quieras.»; con `recibe_ahora` falso, «Ahora su agente no recibe instrucciones: las recibirá cuando vuelva a recibirlas.»; botón «Guardar reglas». Restablecimiento: igual, de lo guardado a lo de por defecto, botón «Restablecer valores por defecto»; si ya coinciden, no se abre y se dice (DD-16).

**Tras la respuesta** (`leerResultadoAccion()`): `hecha`, relee los dos bloques y avisa, con la frase de `recibe_ahora` devuelta. `ya_estaba`: «Ya estaba así». `desactualizada`: «Otra persona ha cambiado estas reglas. Revisa los valores guardados»; relee. `no_aplicada`: «No se ha guardado ningún cambio. Inténtalo de nuevo». `incierta`: mensaje de la 020 y relectura. Lo elegido se conserva salvo en `hecha`; **sin relectura con éxito no se ofrece guardar** (REQ-024, 044).

**Historial** (LR-2). `Tabla`: «Cuándo» (formato común, Madrid, DD-06), «Quién» (correo con `TextoDato` y «dado de baja», por `presentacion.ts` de la 024), «Cambio» («Cambió: Ventana de días, Guardar adjuntos» o «Restableció los valores por defecto: …»). Código desconocido: «Regla no reconocida» y `registrarFallo`. `Paginacion` de 25 con posición, cambio anunciado. Vacío: «Las reglas no han cambiado desde el alta».

## Contratos

No cambia ningún archivo de `contratos/` (H-3). Formas que fija este diseño:

| Pieza | Entrada (cerrada) | Salida |
| --- | --- | --- |
| LR-1 `leer_reglas_cliente` | `cliente` (UUID) | `{estado: 'ok', valores: {5}, por_defecto: {5}, coinciden: bool, recibe_ahora: bool}` o `{estado: 'sin_reglas'}`. Cliente inexistente: cero filas |
| LR-2 `leer_historial_reglas` | `cliente` (UUID); `pagina` (1 a 1.000); `corte` (1 a 2⁵³−1, o nulo = nuevo) | `{corte, total, filas: [{id, ocurrido_en, accion: 'reglas_cambio' \| 'reglas_restablecimiento', reglas: [códigos], actor_correo, actor_estado}]}`; ≤ 25 filas |
| OR-1 `guardar_reglas` | `cliente`; `esperadas` y `nuevas`, cada una objeto con exactamente las cinco claves | `{resultado, reglas_cambiadas?: [códigos], recibe_ahora?}` |
| OR-2 `restablecer_reglas` | `cliente`; `esperadas` | Igual que OR-1 |

`{5}` es el objeto de las cinco claves del contrato. `resultado` ∈ `hecha`, `ya_estaba`, `desactualizada`, `no_aplicada`, `entrada_no_valida`, `no_encontrado`, `no_permitida`.

**Servidor** (`entrada.ts`; REQ-007, 034 a 036, 048): `cliente` UUID canónico o `no_permitida` (REQ-038). Enteros: número JSON entero en rango. Booleanos: `true`/`false` JSON; `"true"`, `"sí"`, `1`, `0`, nulo o ausente se rechazan. Claves de más: se descartan sin leer ni registrar su valor (solo el código `reglas_campos_de_mas`). Un inválido rechaza todo: `rechazada` con `{campo, codigo}` (`obligatorio`, `no_entero`, `fuera_de_rango`, `no_valido`).

**Formulario** (CA-023): sin espacios en los extremos, `^[0-9]{1,3}$` y rango; si no, error junto al campo y nada enviado.

**Resultado → vista**: `hecha`; `ya_estaba`, `desactualizada`, `no_aplicada`, `entrada_no_valida` → `rechazada`; `no_encontrado`, `no_permitida` → `no_permitida`; lo demás → `incierta`. Ningún mensaje lleva identificadores, valores recibidos ni datos internos (REQ-025).

## Datos

Rutas críticas de la fase 2; entran en las migraciones iniciales, con reparto de la 010 por coordinación.

| N.º | Sobre qué | Qué se pide | REQ |
| --- | --- | --- | --- |
| D-1 | `reglas_cliente` | `cliente_id` clave, FK **`on delete restrict`**; `max_correos_por_revision smallint` 1–100, `ventana_dias smallint` 1–14, tres `boolean`; `not null`, **sin defaults de columna** (DD-07), sin `actualizado_en` (DD-08). Ninguna otra columna | 020, 037 |
| D-2 | `privado.reglas_por_defecto()` | `immutable`; devuelve las cinco claves (30, 3, `true` ×3). Única fuente para O-1 de la 022, OR-2 y LR-1 | 004, 049 |
| D-3 | Disparadores | `before update`: rechaza cambiar `cliente_id`. `before delete`: rechaza. Restricción diferida `after insert` en `clientes`: al confirmar, el cliente tiene reglas (DD-10) | 019, 037, 049, 054 |
| D-4 | Permisos | `revoke insert, update, delete, truncate` a `public`, `anon`, `authenticated`, `service_role` y conector. `select` solo a `authenticated` (política `es_admin()` del modelo) y lo que fije la 011 para el conector (DD-11) | 017, 018, 023, 031, 032, 037 |
| D-5 | LR-1, LR-2 | `security invoker`, `search_path = ''`, primero `es_admin()` (si no, cero filas), `statement_timeout` 5 s, solo `authenticated`. LR-1 calcula `coinciden` y `recibe_ahora`. LR-2: `auditoria` del cliente con `accion` en (`reglas_cambio`, `reglas_restablecimiento`) e `id ≤ corte`, `id desc`, 25 por página, total bajo el corte, actor unido a `administradores`. **Sin I-41** (DD-05). No escribe | 005, 017, 028, 050–053 |
| D-6 | OR-1, OR-2 | `security definer` en `privado`, `search_path = ''`, ejecución solo para `authenticated`, expuestas como fije la 010. **Entradas `jsonb` con `jsonb_typeof`** y exactamente cinco claves (DD-03). No reciben actor, momento, lista de cambios ni estado | 006, 007, 012, 021, 022, 033–043, 048 |
| D-7 | Índice (a la 024) | `auditoria (cliente_id, id desc) where accion in ('reglas_cambio', 'reglas_restablecimiento')` | 030 |
| D-8 | `recibe_ahora` | `privado.estado_servido(cliente) = 'activa'`, **la misma regla del conector** (baja, licencia, `pausa_efectiva`, pausa global, canal sin versión). Se pide a la 011; no se inventa otra (DD-17) | 009, 047 |
| D-9 | Conector (011) | Serializa la fila tal cual; **sin fila o con error, nunca `activa` ni valores por defecto** (quitar líneas 491 a 497 del modelo); reglas solo con `activa` | 005, 013–016, 045 |
| D-10 | Datos | La migración rellena con D-2 la fila de todo cliente que no la tenga (la 053, igual al migrar). Juegos de CA-002, 006, 033 a 035 y volumen de CA-022, solo en desarrollo y entorno previo | 049, 030 |

### Vuelta atrás (artículo 11)

| Migración | Contenido | Vuelta atrás |
| --- | --- | --- |
| M-1 | D-1 a D-4 y relleno de D-10 | Devuelve permisos y defaults del modelo **solo junto con una versión de la app sin esta función**: reabre la escritura directa. Las filas rellenadas no se quitan: sin ellas el conector deja de servir `activa` (REQ-045) |
| M-2 | D-5, D-6, D-7 | Elimina las funciones e índice y revoca. El panel deja de leer y cambiar reglas: falla hacia el lado seguro; el conector no se ve afectado |

Se prueba aplicando, revirtiendo y reaplicando con los datos ficticios y comparando la huella de `reglas_cliente` y de `auditoria` (PRUEBA-017). **Datos:** un cambio de reglas se deshace con otra acción («Restablecer» o un cambio). El sistema no guarda los valores anteriores (cuestión 4): el valor previo solo consta en el diálogo que vio quien confirmó.

## Auditoría de esta función

| Acción | Quién la escribe | Fila | `reglas` |
| --- | --- | --- | --- |
| I-39 `reglas_cambio` | OR-1 | Principal, origen `persona`, actor `auth.uid()` | Las que cambiaron, no vacía, en orden del catálogo |
| I-40 `reglas_restablecimiento` | OR-2 | Principal, igual | Las que cambiaron a su valor por defecto |
| I-41 `reglas_por_defecto` | O-1 de la 022 | Vinculada a I-01 | Ninguna |

Tipo `reglas_cliente`; objeto y cliente = el cliente (D-4 de la 024 lo deriva). Ningún valor, anterior ni nuevo (REQ-022). Sin cambios, ninguna fila (REQ-041). Leer no anota (REQ-053).

## Flujo

**OR-1 / OR-2**, en una transacción:

1. `es_admin()`; si no, `no_permitida` y nada más (REQ-033).
2. Comprueba las entradas (D-6); si no, `entrada_no_valida`.
3. `select … for update` de la fila del cliente. No existe: `no_encontrado` (cliente inexistente; uno sin reglas no puede existir).
4. `nuevas` (OR-2: `reglas_por_defecto()`) igual a lo guardado: `ya_estaba`, sin escribir (REQ-040, 041).
5. Lo guardado distinto de `esperadas`: `desactualizada`, sin escribir (REQ-039).
6. En un bloque con su propio punto de recuperación: `update` de las cinco columnas; lista de reglas cambiadas (comparando columna a columna, en el orden del catálogo); `anotar_auditoria(...)`. Cualquier excepción del bloque deshace los dos y devuelve `no_aplicada` (DD-12, REQ-043). `query_canceled` no se captura: sube y el panel lo ve como `incierta`.
7. Devuelve `hecha`, la lista y `recibe_ahora` (D-8).

El doble envío llega con las mismas `esperadas`: el segundo encuentra lo guardado igual a `nuevas` y da `ya_estaba` (una sola fila, REQ-040). Dos administradores desde el mismo punto: el segundo da `desactualizada` y relee; nunca hay mezcla, porque se compara el estado completo (DD-01, DD-02).

**Ver** (`page.tsx` de la 022 tras `exigirAdministrador()`): la vista pide LR-1 y LR-2 por separado con `leerReglas` y `leerHistorialReglas`; LR-2 con corte nulo. Cambiar de página reutiliza el corte en memoria; volver a la página 1 o recargar lo renueva (REQ-052).

**Conector**: sin cambios de contrato; D-9. Un cambio confirmado se ve en la siguiente `obtener_instrucciones` que lea la fila después de la confirmación (lectura confirmada de PostgreSQL); la revisión en curso no recibe nada (REQ-013, 014).

## Tareas previas

| Tarea | Qué comprueba | Regla |
| --- | --- | --- |
| T-P1 | V-109 (zod, VERIFICAR) si la 020/022 lo adoptan para validar | Con evidencia, `entrada.ts` lo usa con objetos estrictos sin coerción; sin ella, validador escrito a mano con la misma tabla |
| T-P2 | En el proyecto de desarrollo, que una función expuesta recibe `jsonb` con los tipos JSON intactos (`1` frente a `"1"`, `true` frente a `"true"`) | Si no, vuelve al arquitecto |

V-108 (doble factor en políticas) la cierra la 021; esta función no se conecta a la base de datos sin ella.

## Amenazas de esta función

| N.º | Amenaza | Control | Prueba |
| --- | --- | --- | --- |
| AM-01 | Sesión de superadmin robada cambia reglas (A-11) | `es_admin()` con `aal2` en cada operación y lectura; auditoría con actor; historial visible en la ficha | 007, 009 |
| AM-02 | Identificador manipulado para leer o cambiar otro cliente (art. 2) | El identificador solo elige; permiso de la sesión; inexistente y sin permiso dan lo mismo; `cliente_id` inmutable | 007, 012, 013 |
| AM-03 | Texto libre o regla inventada que llega al agente (art. 1, 7) | Esquema cerrado en servidor; `jsonb` con cinco claves en la base de datos; tabla sin columnas de texto; contrato `additionalProperties: false` | 001, 008, 018 |
| AM-04 | Conversión laxa (`"1"`, `"on"`) cuela un booleano | `jsonb_typeof` en D-6; tipos JSON estrictos en `entrada.ts` | 001, 009 |
| AM-05 | Petición desde otro sitio o incrustación (A-21) | `comprobarOrigen()`; `frame-ancestors 'none'` de la 002 | 013 |
| AM-06 | Mezcla de dos cambios o cambio perdido | Cerrojo de fila y comparación del estado completo | 010 |
| AM-07 | Cambio sin rastro o rastro sin cambio | Sin escritura directa (D-4); auditoría en la misma transacción | 008, 009 |
| AM-08 | Un fallo enseña valores por defecto como si fueran del cliente (art. 3) | `sin_reglas` y error sin valores; ningún valor por defecto en el navegador; sin guardar sobre valores no leídos | 002, 006 |
| AM-09 | El conector sirve valores por defecto si falta la fila (H-2) | D-9; D-3 impide el cliente sin reglas | 015 |
| AM-10 | Una regla relaja los límites del agente (art. 8) | Las cinco solo acotan o desactivan acciones permitidas por el arranque; ninguna habilita enviar, borrar ni compartir; otra regla exige especificación y contrato | Revisión |
| AM-11 | Un correo de administrador ejecuta código en el historial | `TextoDato` | 004 |
| AM-12 | Uso de la clave secreta (A-10) | `fuente-bd.ts` con `leerDelArea()`; comprobación estática | 014 |

## Pruebas

| N.º | Qué | Etapa | Criterios |
| --- | --- | --- | --- |
| 001 | `catalogo.ts` frente al contrato (claves, rangos); baterías de `entrada.ts` y del formulario; claves de más descartadas sin registrar | A | CA-023, 024, 025 (servidor), 031 |
| 002 | Valores sobre la muestra: unidades, palabras, explicaciones, por defecto junto a la regla, cinco estados, `sin_reglas` | A | CA-001, 002, 020 (parte) |
| 003 | Diálogos con 1, 3 y 5 cambios, cancelar, sin cambios, aviso de `recibe_ahora`, restablecer ya coincidente | A | CA-005, 006 (textos), 007 (diálogo), 028 (vista) |
| 004 | Historial sobre la muestra: columnas, «dado de baja», 60 filas en 25/25/10, cinco estados, `TextoDato` | A | CA-033, 034 (vista), 020 |
| 005 | axe y revisión manual con teclado y lector; 320 px; textos y errores | A y B | CA-017, 018, 019, 021 |
| 006 | `incierta`, `no_aplicada`, lecturas con error, red caída y respuesta mal formada: relee, conserva, sin guardar sobre no leído | A | CA-015 (panel), 020 |
| 007 | pgTAP, matriz de 5 perfiles más superadmin; rol o factor perdidos antes de OR-1/OR-2 | B (CI) | CA-011 |
| 008 | pgTAP: rangos, tipos, nulos, columna nueva, cambio de cliente, borrado, alta sin reglas; catálogo sin texto; escritura directa rechazada | B (CI) | CA-014, 016 (directa) |
| 009 | pgTAP OR-1/OR-2: fila exacta con 1, 3 y 5 reglas, 2 actores, 2 clientes, 0 valores en la fila; `ya_estaba`; fallos provocados en cada paso y en la auditoría; `jsonb` inválidos | B (CI) | CA-015, 016, 023, 024, 027 (BD), 028 |
| 010 | Dos conexiones a la vez: cambio/cambio y cambio/restablecimiento ×20; doble envío < 100 ms ×10 | B (CI) | CA-026, 027 |
| 011 | Con O-1 de la 022: 20 altas, fallos en cada paso, 0 clientes sin reglas | B (CI) | CA-032 |
| 012 | LR-2: coincide con `auditoria`, sin otros clientes ni acciones, corte con 5 cambios durante el recorrido, 0 filas nuevas tras 50 lecturas | B (CI) | CA-034, 035 |
| 013 | Extremo a extremo contra desarrollo: ficha, 7 estados de cliente, sesiones, identificadores manipulados, otro origen, incrustación | B | CA-001, 002, 004 (panel), 006, 011, 013, 030, 033 |
| 014 | Ninguna importación de `admin.ts` en las piezas; integración con la clave ausente | A y B | CA-012 |
| 015 | Agente de prueba: coincidencia ficha/agente, cambios 1/3/5, restablecer, cambio a mitad de revisión, A y B, pausa, suspensión y baja, lectura de reglas forzada a fallar y cliente sin reglas | C | CA-003, 004, 007, 008, 009, 010, 025, 029 |
| 016 | 200 mediciones por operación con el volumen de D-10 | D | CA-022 |
| 017 | Aplicar, revertir y reaplicar M-1 y M-2 | B (CI) | Artículo 11 |
| 018 | Ocho campos de más por acción; registros sin sus valores | B | CA-025 |

## Valores que fija este diseño

25 filas por página · páginas 1 a 1.000 (500 cambios caben en 20) · 5 s por lectura en la base de datos y 30 s en el navegador (`useAccion`) · cuerpo de la petición de 2 KB como mucho · enteros de 1 a 3 cifras en el formulario.

**Rendimiento (REQ-030), sin medir.** LR-1 lee una fila por clave; LR-2 recorre como mucho 25 entradas del índice D-7 y cuenta ≤ 500; OR-1/OR-2 tocan una fila y anotan una. Si PRUEBA-016 no da el umbral, vuelve al arquitecto.

## Decisiones por delegación (D-019)

Se anotan en `aclaraciones.md` al aprobar el diseño.

| N.º | Decisión | Motivo |
| --- | --- | --- |
| DD-01 | Concurrencia comparando los cinco valores esperados, no una columna de versión | Da `ya_estaba` limpio en el doble envío; sin columna nueva |
| DD-02 | El formulario envía siempre las cinco reglas deseadas; la base de datos calcula cuáles cambian | Ninguna lista de cambios viene de fuera (REQ-036) |
| DD-03 | Entradas `jsonb` con tipos comprobados en la base de datos | Cierra `'1'::boolean` y similares |
| DD-04 | Lectura propia del historial (LR-2), no `leer_auditoria` de la 024 | Aquélla filtra por una sola acción; menos superficie |
| DD-05 | El historial no incluye I-41 | REQ-053 y deducción 2 de la especificación |
| DD-06 | Fecha y hora con el formato común, sin segundos | REQ-051 y REQ-002 de la 024 («solo en esta página») |
| DD-07 | Sin defaults de columna; una sola fuente de valores por defecto | Un solo sitio que cambiar y probar |
| DD-08 | Sin `actualizado_en` | El historial es la auditoría |
| DD-09 | Clave ajena `on delete restrict` y borrado prohibido | REQ-037; coherente con D-6 de la 022 |
| DD-10 | Restricción diferida de cliente con reglas | REQ-049 garantizado aunque falle O-1 |
| DD-11 | Sin escritura directa para ningún rol | REQ-023 por construcción |
| DD-12 | El fallo de la auditoría se captura y devuelve `no_aplicada` | REQ-043 pide decir que no se aplicó, no `incierta` |
| DD-13 | Enteros en campo de texto numérico, no `type="number"` | Éste admite «1e2» y depende del idioma |
| DD-14 | Edición en el sitio con «Cambiar reglas» | Lectura clara por defecto; menos riesgo de cambio accidental |
| DD-15 | Valor por defecto visible junto a cada regla distinta | Explica la palabra de REQ-003 y el restablecimiento |
| DD-16 | Restablecer con todo ya por defecto no abre diálogo | Como REQ-010 |
| DD-17 | `recibe_ahora` con la regla única del estado servido | Lo que dice el diálogo es lo que hará el conector |
| DD-18 | Claves de más: el servidor las descarta (REQ-036) y la base de datos las rechaza | Capa interior más estricta; el servidor ya limpió |

## Cobertura de requisitos

| Requisitos | Dónde |
| --- | --- |
| REQ-001 a 004 | «La sección en la ficha»; D-2; DD-15 |
| REQ-005, 013 a 016, 045 | LR-1; D-8; D-9; «Flujo» (conector) |
| REQ-006, 007, 010, 011, 034, 035, 036, 048 | Formulario; «Contratos»; D-6; DD-02, 03, 18 |
| REQ-008, 009, 012, 047 | Diálogos; D-8; OR-2 |
| REQ-017, 018, 031, 032, 033 | D-4, D-5, D-6; `exigirAdministradorEnAccion()`; AM-01, 12 |
| REQ-019, 038 | «Contratos» (UUID); D-3; AM-02 |
| REQ-020, 037 | D-1, D-3, D-4 |
| REQ-021 a 023, 042, 043 | «Flujo» paso 6; «Auditoría»; DD-11, 12 |
| REQ-024, 025, 044 | «Tras la respuesta»; «Contratos» |
| REQ-026 a 029 | Componentes de la 020; textos; DD-06 |
| REQ-030 | D-7; «Valores» |
| REQ-039, 040, 041 | «Flujo» pasos 3 a 5; DD-01 |
| REQ-046 | AM-05 |
| REQ-049, 054 | D-2, D-3, D-10; O-1 de la 022 |
| REQ-050 a 053 | Historial; LR-2; DD-04 a 06 |

CA-001 a CA-035: columna «Criterios» de «Pruebas». Ningún criterio de base de datos se anota como superado en local.

## Comprobación de la constitución

| Artículo | Estado | Por qué |
| --- | --- | --- |
| 1 Privacidad | Cumple | Dos enteros acotados y tres booleanos; ni nota ni motivo; auditoría con códigos de lista cerrada, sin valores; catálogo sin texto (PRUEBA-008) |
| 2 Aislamiento | **Cumple solo con la nota aclaratoria aplicada** | El permiso sale de la sesión (`es_admin()`); el identificador del cliente solo elige la ficha. El texto vigente dice que «nunca se acepta como entrada»: sin la nota es incumplimiento, BLOQUEANTE (A-1). Pruebas automáticas: PRUEBA-007, 012, 013 |
| 3 Cierre en fallo | Cumple | Resultado desconocido = `incierta`; nunca valores por defecto en lugar de los del cliente, en el panel ni en el conector (D-9) |
| 4 Secretos | Cumple | Sin clave secreta (PRUEBA-014); ningún secreto en SQL |
| 5 Especificación | Cumple | REQ → pieza → prueba en «Cobertura» y «Pruebas» |
| 6 Revisión | Cumple | Dictamen del auditor y puerta P1 pendientes |
| 7 Entradas no confiables | Cumple | Validación cerrada en servidor y base de datos; campos de más sin efecto ni registro |
| 8 Límites del agente | Cumple | Ninguna regla habilita enviar, borrar ni compartir (AM-10) |
| 9 Prompt | Cumple | No toca prompt, versión, canal ni orden (REQ-015, PRUEBA-015) |
| 10 Producto final | Cumple, con condiciones | Accesibilidad, cinco estados, simultaneidad, rendimiento; condicionado a la política de contenido de la 021 y a dónde ejecutar pgTAP (A-4) |
| 11 Reversibilidad | Cumple | M-1 y M-2 con vuelta atrás probada (PRUEBA-017); un cambio de reglas se deshace con otra acción |
| 12 Español | Cumple | Textos, códigos y nombres en español |
| 13 Evidencias | Cumple | Nada ejecutado; etapas y lugares de cada prueba declarados |
| 14 Cambios reservados | Cumple | No toca constitución, permisos del repositorio, CI ni producción; A-1 es del responsable |

## Dependencias nuevas

Ninguna. Si `entrada.ts` usa zod, depende de V-109 (T-P1).

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Escritura directa con RLS y disparador que audita | La 024 retira el disparador genérico; actor y «sin cambios» se resuelven mejor en la operación |
| Columna `version` | El doble envío daría «desactualizada» en vez de «ya estaba» |
| Enviar solo las reglas cambiadas | Permite mezclas concurrentes |
| Parámetros SQL `smallint` y `boolean` | PostgreSQL convierte `'1'`, `'on'` y `'yes'` a booleano |
| Historial con `leer_auditoria` de la 024 | Una sola acción por filtro: dos llamadas rompen la paginación |
| Borrar las reglas al restablecer | Descartado por el responsable (cuestiones 2 y 3) |

## ADR

No hace falta: no cambia ninguna frontera. Sigue el patrón de operaciones de la 022 y de auditoría de la 024.

## Qué se pide a otras fases y a coordinación

1. **Fase 2 (010, 011):** D-1 a D-10; `privado.estado_servido(cliente)` única (D-8); conector según D-9 (cierra la cuestión 15 de la 011 en el sentido de REQ-045, A-2).
2. **022:** O-1 inserta la fila con `reglas_por_defecto()` y anota I-41; su criterio 4 queda limitado a su alcance.
3. **024 (enmienda):** (a) códigos I-39 a I-41, `reglas_cliente` y los cinco códigos **confirmados**; (b) su «Qué se pide», punto 4, dice «I-39 a I-41» en el historial: es I-39 e I-40 (DD-05), con LR-2 propia (DD-04); (c) su «Hora» aplica segundos al historial de reglas: va sin segundos (DD-06); (d) `reglas` en orden del catálogo; (e) índice D-7.
4. **023:** `pausa_efectiva` disponible para D-8.
5. **053:** al migrar clientes desde la carpeta `panel`, crear su fila de reglas.
6. **`docs/TECNOLOGIAS.md`:** las decisiones de `aclaraciones.md` de la 025 y DD-01 a DD-18 tras la P1.
7. **052 (fase 6):** el borrado de un cliente choca con D-3 y DD-09; tendrá que diseñar su vía.

## Asuntos abiertos para el responsable

| N.º | Asunto | Opciones | Propuesta |
| --- | --- | --- | --- |
| A-1 | Nota aclaratoria del artículo 2 sin aplicar (igual que A-1 de la 022). No se delega | (a) Aplicarla antes de la P1. (b) No: la función vuelve al `especificador` | (a) |
| A-2 | Cuestión 15 de la 011 sin respuesta; REQ-045 (aprobado) ya la decide | (a) Cerrarla igual que REQ-045. (b) Mantener valores por defecto en el conector, y la 025 se reabre | (a) |
| A-3 | Los valores anteriores no quedan en ningún sitio: deshacer un error exige recordarlos | (a) Aceptarlo (cuestión 4). (b) Reabrir la cuestión 4 | (a) |
| A-4 | pgTAP sin dónde ejecutarse (sin Docker ni CI) | Lo resuelve la 003 | Mientras, criterios de base de datos abiertos |
| A-5 | Las reglas no se pueden borrar ni su cliente: la purga de la fase 6 necesitará una vía | (a) Aceptarlo y que la 052 la diseñe. (b) Admitir borrado ya | (a) |

## Lo que este diseño no ha podido comprobar

- Nada se ha ejecutado; no hay código, migraciones ni CI.
- Los diseños de la 021 a la 024 no tienen dictamen; nombres como `estado_servido`, `pausa_efectiva`, `presentacion.ts` y el formato común de fecha pueden cambiar.
- T-P2 (tipos JSON en funciones expuestas) y la forma de exponer operaciones del panel (010).
- Que las cinco explicaciones no contradigan la 012 más allá de sus requisitos 4 a 8; sus cuestiones 6 y 22 pueden cambiar el conjunto de reglas.
