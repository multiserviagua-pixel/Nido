# 025 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (APTO CON CONDICIONES, vuelta 1, 22/11/2026: `dictamen-diseno.md`; m-1 a m-5 incorporados, «Dictamen vuelta 1») · Fecha: 19/11/2026; **puesto al día el 22/11/2026** con D-040, la constitución 1.5 (art. 8), lo que fijan la 022 y la 024 y las migraciones M02 a M10 de la 010 ya integradas

Estado: PLANIFICADA (P1 abierta por delegación D-036 el 22/11/2026)

Especificación APROBADA el 13/11/2026 (P0), con una enmienda mecánica en CA-010 (su «Registro de cambios») y la enmienda E-1 pedida (`propuestas.md`, P25-01). Rutas críticas «RLS y migraciones» y «entrega del prompt» (las reglas viajan en `obtener_instrucciones`). **Ninguna prueba citada se ha ejecutado.** La base de datos se describe desde `supabase/migrations/` (M02 `20261120000200_clientes_y_acceso.sql`, M04 `…0400_auditoria.sql`, M07 `…0700_reglas_de_acceso.sql`, M08 `…0800_funciones_conector.sql`, leídos el 22/11/2026), `supabase/seed.sql`, `supabase/datos/volumen.sql` y los apartados «Datos» de la 022, la 023 y la 024. Decisiones por delegación: DD-NN (D-036). Peticiones a otras funciones y ficha del responsable: `propuestas.md`. Orden, tareas y puertas: `plan.md` y `tareas.md`.

## Resumen

Una fila por cliente en `reglas_cliente`: dos enteros acotados y tres booleanos (art. 1). **Ningún rol de la aplicación escribe la tabla directamente**: solo el alta de la 022 (O-1) y las dos operaciones de esta función, funciones del dueño que en una transacción comprueban `privado.es_admin()`, bloquean la fila, comparan **los cinco valores que el administrador tenía delante** con los guardados, escriben, calculan qué reglas cambiaron y anotan I-39 o I-40 de la 024 después del último cerrojo (R-2 de la 024). Sin cambios, ni escriben ni anotan. Los valores por defecto tienen **una sola fuente**, `privado.reglas_por_defecto()`. La base de datos impide el cliente sin reglas, el borrado, el cambio de cliente y los valores fuera de tipo o rango; la barrera de la 024 (su DD-23) rechaza además cualquier escritura directa que se colara.

La sección de la ficha tiene dos bloques independientes: **valores** (formulario y dos diálogos) e **historial** (I-39 e I-40 del cliente, sobre un corte, de 25 en 25). Todo con la sesión del usuario. El contrato del conector no cambia; se le pide a la fase 2 **no servir valores por defecto** si faltan las reglas (REQ-045) y una regla única de estado servido. **Nada de esta función toca la compuerta de envío** de la 016 y la 017 (art. 8, «Comprobación del artículo 8»). Una ficha para el responsable (F-1), que no bloquea la P1.

## Puesta al día del 22/11/2026

Manda sobre la versión del 19/11 donde difiera. Asuntos de entonces: A-1 y A-4, resueltos por D-040; A-2, A-3 y A-5, decididos por delegación (DD-29 a DD-31).

| De dónde | Qué cambia | Apartado |
| --- | --- | --- |
| D-040, nota del art. 2 (constitución 1.5) | El identificador en la dirección solo elige; el art. 2 cumple sin condición | «Comprobación de la constitución» |
| D-040, A-4 | pgTAP con varias conexiones en el paso de `bd.yml` | PRUEBA-010; `plan.md` |
| D-040, A-10 (baja definitiva); P-50 de la 022 | CA-010 sin «reactivar el cliente» (enmienda mecánica); aviso propio para el cliente dado de baja (E-1); LR-1 devuelve `de_baja` | «Diálogos», «Contratos»; P25-01; F-1 |
| Constitución 1.5, art. 8 (D-037, D-038, D-041) | Comprobación del art. 8 regla a regla; ningún interruptor de la compuerta | «Comprobación del artículo 8»; AM-10, AM-13; DD-19 |
| 024, P24-13 y su diseño | Códigos confirmados; `reglas_cliente_auditar` se queda como barrera; anotar según R-2; contexto `api_autenticada`; índice en M24-1; historial sin segundos | D-4, D-6, «Flujo»; DD-20, DD-26, DD-27 |
| 024, D-6 | El tiempo máximo lo da el ajuste por rol, no una cláusula en la función | D-5; DD-28 |
| D-035 | `search_path = pg_catalog, pg_temp`, todo calificado | D-5, D-6 |
| M02, M04, M07, M08 reales | La tabla existe: se altera en su sitio; el conector sirve hoy valores por defecto | «Hechos», D-1 a D-4, D-9; P25-02, P25-03 |
| 022, tareas | O-1 (022·T-013) espera a `reglas_por_defecto()`; V-109 la verifica 022·T-035 | «Supuestos»; `tareas.md` |

## Dictamen vuelta 1

`dictamen-diseno.md` (APTO CON CONDICIONES, sin bloqueantes ni mayores). Cada menor, como ajuste mínimo y condición de tarea:

| Hallazgo | Apartado | Tareas |
| --- | --- | --- |
| m-1 `es_admin()` también tras el cerrojo | «Flujo», pasos 1 a 3; PRUEBA-010 | T-007, T-010 |
| m-2 comprobación entera completa; `1.0` rechazado (con la desviación de abajo) | D-6, DD-03, DD-32; PRUEBA-009 | T-007 |
| m-3 `estado_servido` `security invoker` | D-8; P25-03 (a) | T-008 |
| m-4 sin P25-03 (b) y CA-029 no hay VERIFICADA ni producción | D-9, DD-33; P25-03 (b) | T-021, T-024 |
| m-5 identidad de los disparadores de D-3 | D-3; PRUEBA-008, PRUEBA-011 | T-006, T-011 |

**Desviación de m-2.** El auditor pidió que `1e2` y `-0` dieran `entrada_no_valida` en la base de datos. La 025 se aparta en esos dos casos, porque `jsonb` los normaliza antes de que la función los vea. Medido por el `revisor` en PGlite 18.7 (22/11/2026): `1e2`, `1E2` y `1.0e2` llegan como 100 y se admiten; `1.5e1` llega como 15 y se admite; `1.0`, `100.0`, `-0.0`, `10e-1`, `1.5` y `1e400` los rechaza el patrón; `-0` y `0`, el rango. Nunca se admite un valor no entero ni se redondea. El `1e2` de CA-023 lo cierra el formulario (PRUEBA-001, por texto); el caso en base de datos es un límite documentado (D-6, DD-32), no evidencia de CA-023. **Condición:** el `auditor-seguridad` acepta esta desviación en su dictamen de T-007 (ruta crítica); si no la acepta, vuelve al arquitecto.

## Hechos de partida

Leídos en el repositorio el 22/11/2026.

| N.º | Hecho | Consecuencia |
| --- | --- | --- |
| H-1 | M02: `reglas_cliente` con FK **`on delete cascade`**, `default` en las cinco columnas, `actualizado_en`, `check` de rangos. M07: `insert` y `update` por columnas para `authenticated` con políticas `es_admin()`, `select` con `reglas_cliente_select_admin`, disparador `reglas_cliente_valores` (`fijar_valores()` pone `actualizado_en`). M04: `reglas_cliente_auditar` con `when (current_user <> 'postgres')` | D-1 a D-4 alteran en su sitio |
| H-2 | M08, `obtener_instrucciones`: sin fila, entrega 30, 3 y tres `true` | Contradice REQ-045: D-9, P25-03 |
| H-3 | Contrato `obtener-instrucciones`, `reglas`: cinco claves, `additionalProperties: false`, 1–100 y 1–14 | Coincide; no cambia |
| H-4 | 024: I-39 `reglas_cambio`, I-40 `reglas_restablecimiento`, I-41 `reglas_por_defecto` (solo vinculada a I-01); tipo `reglas_cliente`, objeto = cliente; `reglas text[]` solo en I-39/I-40, en el orden del catálogo; auxiliares de su D-4; barrera D-11; R-2 a R-4; índice parcial en su D-7 (M24-1) | Se sigue (P24-13) |
| H-5 | 022: O-1 crea cliente y reglas de la única fuente con I-41 (su T-013); D-6 «sin cascadas»; ficha con `secciones.ts`; `situacion_licencia` (su T-009) | Se sigue |
| H-6 | 023: `pausa_efectiva(cliente)` devuelve nulo si quien llama no ve al cliente; el conector trata nulo como pausada | `recibe_ahora` (D-8) |
| H-7 | `supabase/seed.sql` inserta las cinco columnas en la misma transacción que los clientes; `supabase/datos/volumen.sql` inserta solo `cliente_id` y depende de los `default` | P25-02: `volumen.sql` pasa a valores explícitos |
| H-8 | Las pruebas de la 010 `01_estructura` y `02_matriz_acceso` esperan `actualizado_en` y la escritura directa del administrador | Cambian con M25-1 (P25-02) |
| H-9 | Cuestión 15 de la 011 sin respuesta; V-108 y V-109 en VERIFICAR; `bd.yml` sin primera ejecución; sin conector ni entorno previo | DD-29; previas; etapas |

## Supuestos y dependencias

| De quién | Qué necesita la 025 |
| --- | --- |
| 020 | `Formulario` y campos, `DialogoConfirmacion`, `Tabla`, `Paginacion`, `BloqueDatos`, `useAccion`, `leerResultadoAccion()`, `AvisosTemporales`, `TextoDato`, `EtiquetaEstado`, `textos.ts`, `registrarFallo` |
| 021 | `exigirAdministrador()`, `exigirAdministradorEnAccion()` (con `comprobarOrigen()`), `leerDelArea()` (021·T-012); `privado.es_admin()` con `aal2` (V-108, 021·T-007 c); `administradores.correo` y `estado` |
| 022 | Ficha y marco 5 de `secciones.ts` (022·T-028); O-1 con I-41 (022·T-013); `situacion_licencia` (022·T-009); columnas de baja de su D-1 legibles por el administrador; `fecha-madrid.ts` (022·T-022); V-109 (022·T-035); exposición por `rpc` con `POST` (022·T-004) |
| 023 | `pausa_efectiva` (023·T-010), solo a través de la regla de estado servido |
| 024 | M24-1 (024·T-009): auxiliares, barrera, catálogo e índice; `presentacion.ts` (024·T-015) para el actor; cobertura por acción, parte (d) (024·T-014) |
| Fase 2 (010, 011) | `privado.estado_servido(cliente)` y D-9 (P25-03); exposición (P25-04) |

**Orden obligado.** Interfaz con datos ficticios sin esperar a nadie. M25-1 después de M24-1 (DD-37 de la 024) y antes de 022·T-013. Ninguna operación contra la base de datos antes de M25-2. LR-1 real (M25-3) solo con P25-03 integrada. Ningún criterio de base de datos, agente o entorno previo cerrado con datos ficticios.

### Construcción en etapas

| Etapa | Hace falta | Se construye | Se prueba |
| --- | --- | --- | --- |
| A | App de la 002, componentes de la 020 | `src/lib/reglas/` salvo `fuente-bd.ts`; `src/components/reglas/`; sección con fuente ficticia en la muestra | PRUEBA-001 a 006, 014 (estática). No cierra criterios que pidan base de datos |
| B | M24-1 y M25-1 a M25-3 en CI; 021, 022 y 024 implementadas; `bd.yml` | `fuente-bd.ts`, `acciones-reglas.ts`, sección real | PRUEBA-007 a 013, 017, 018 |
| C | Conector de la fase 2 con P25-03 en desarrollo | — | PRUEBA-015 |
| D | Entorno previo con volumen (D-016) | — | PRUEBA-016 |

## Piezas y responsabilidades

| Ruta | Qué hace | Quién |
| --- | --- | --- |
| `src/app/admin/clientes/acciones-reglas.ts` (nueva) | Únicas acciones de la función: `leerReglas`, `leerHistorialReglas`, `guardarReglas`, `restablecerReglas`. Primero `exigirAdministradorEnAccion()`; luego `entrada.ts`, `fuente-bd.ts` y resultado cerrado; un rechazo registra un código, sin valores | backend |
| `src/lib/reglas/catalogo.ts`, `src/lib/reglas/textos.ts` | Las cinco reglas en orden fijo: código (columna y clave del contrato), nombre visible, tipo, rango, unidad y clave de su explicación. Sin valores por defecto (DD-07). `textos.ts`: todos los textos de la sección, los diálogos y el historial | frontend |
| `src/lib/reglas/entrada.ts` | Validadores de servidor y de formulario («Contratos») | backend |
| `src/lib/reglas/diferencias.ts` | Reglas que cambian, con valor actual y nuevo, para el diálogo. **La lista auditada la calcula la base de datos** | frontend |
| `src/lib/reglas/fuente-bd.ts` | LR-1, LR-2, OR-1, OR-2 por `rpc` con `POST` y `leerDelArea()`; traducción por código fijo, sin `message`, `details` ni `hint`. Nunca importa `lib/supabase/admin.ts` | backend |
| `src/components/reglas/`, `src/app/admin/clientes/_vista/reglas.tsx` | `SeccionReglas`, `ValoresReglas`, `FormularioReglas`, `DialogoReglas`, `HistorialReglas`; la vista los une con `useAccion` en el marco 5 | frontend |
| `tests/reglas/fuente-ficticia.ts` | Guiones de la etapa A; no importable desde el producto | pruebas |
| `tests/unit/reglas/estatica.test.ts` | PRUEBA-014 | qa |
| `supabase/migrations/`, `supabase/reversiones/`, `supabase/tests/reglas/`, `supabase/datos/` | M25-1 a M25-3, sus reversiones, pgTAP y juegos | bd |

**Rutas críticas** (dictamen del `auditor-seguridad`): M25-1 a M25-3 con su pgTAP y reversiones, los juegos de `supabase/datos/`, los cambios en pruebas de la 010 (P25-02), la petición D-9 al conector (P25-03), `fuente-bd.ts`, `acciones-reglas.ts`, `entrada.ts`, la estática (PRUEBA-014) y PRUEBA-007 a 012 y 015.

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

Ninguna explicación dice ni sugiere que una regla envíe, borre o comparta (art. 8; revisión en CA-001).

**Formulario** (DD-14). «Cambiar reglas» pone el bloque en edición con lo último leído. Enteros: texto con `inputmode="numeric"`, unidad y rango visibles (DD-13). Booleanos: grupo de opciones «Sí» / «No». Ningún otro campo. «Guardar reglas»: errores junto al campo; sin diferencias, «No hay cambios que guardar» y ninguna petición (REQ-010); si no, el diálogo. «Cancelar» sale sin cambios.

**Diálogos** (`DialogoConfirmacion`, objetivo como en la 022). Cambio: «¿Guardar las reglas del agente?»; el cliente; una línea por regla que cambia («Máximo de correos por revisión: de 30 a 50»; «Preparar borradores: de Sí a No»); «Se aplicará en la siguiente revisión de su agente. Una revisión que ya haya empezado sigue con las reglas que recibió. Puedes volver a cambiarlas cuando quieras.»; botón «Guardar reglas». Aviso según LR-1 (DD-23):

- `de_baja` verdadero (texto de E-1): «Este cliente está dado de baja y su agente ya no recibe instrucciones. Las reglas se guardan igualmente.» Sin E-1 aprobada (T-001), T-016 queda bloqueada; para la baja nunca se usa el aviso general de `recibe_ahora`.
- `recibe_ahora` falso en otro caso: «Ahora su agente no recibe instrucciones: recibirá estas reglas cuando vuelva a recibirlas.»
- `recibe_ahora` verdadero: sin aviso.

Restablecimiento: igual, de lo guardado a lo de por defecto, botón «Restablecer valores por defecto»; si ya coinciden, no se abre y se dice (DD-16).

**Tras la respuesta** (`leerResultadoAccion()`): `hecha`, relee los dos bloques y avisa con la frase de la relectura (DD-22). `ya_estaba`: «Ya estaba así». `desactualizada`: «Otra persona ha cambiado estas reglas. Revisa los valores guardados»; relee. `no_aplicada`: «No se ha guardado ningún cambio. Inténtalo de nuevo». `incierta`: mensaje de la 020 y relectura. Lo elegido se conserva salvo en `hecha`; **sin relectura con éxito no se ofrece guardar** (REQ-024, 044).

**Historial** (LR-2). `Tabla`: «Cuándo» (formato común de la 020, Madrid, sin segundos, DD-06), «Quién» (correo con `TextoDato` y «dado de baja», por `presentacion.ts` de la 024), «Cambio» («Cambió: Ventana de días, Guardar adjuntos» o «Restableció los valores por defecto: …»). Código desconocido: «Regla no reconocida» y `registrarFallo`. `Paginacion` de 25 con posición, cambio anunciado. Vacío: «Las reglas no han cambiado desde el alta».

## Contratos

No cambia ningún archivo de `contratos/` (H-3). Formas que fija este diseño:

| Pieza | Entrada (cerrada) | Salida |
| --- | --- | --- |
| LR-1 `leer_reglas_cliente` | `cliente` (UUID) | `{estado: 'ok', valores: {5}, por_defecto: {5}, coinciden: bool, de_baja: bool, recibe_ahora: bool}` o `{estado: 'sin_reglas'}`. Cliente inexistente: cero filas |
| LR-2 `leer_historial_reglas` | `cliente` (UUID); `pagina` (1 a 1.000); `corte` (1 a 2⁵³−1, o nulo = nuevo) | `{corte, total, filas: [{id, ocurrido_en, accion: 'reglas_cambio' \| 'reglas_restablecimiento', reglas: [códigos], actor_correo, actor_estado}]}`; ≤ 25 filas |
| OR-1 `guardar_reglas` | `cliente`; `esperadas` y `nuevas`, cada una objeto con exactamente las cinco claves | `{resultado, reglas_cambiadas?: [códigos]}` |
| OR-2 `restablecer_reglas` | `cliente`; `esperadas` | Igual que OR-1 |

`{5}` es el objeto de las cinco claves del contrato. `resultado` ∈ `hecha`, `ya_estaba`, `desactualizada`, `no_aplicada`, `entrada_no_valida`, `no_encontrado`, `no_permitida`. Ninguna entrada lleva actor, momento, lista de cambios, estado, canal ni nada de la compuerta.

**Servidor** (`entrada.ts`; REQ-007, 034 a 036, 048): `cliente` UUID canónico o `no_permitida` (REQ-038). Enteros: número JSON entero en rango. Booleanos: `true`/`false` JSON; `"true"`, `"sí"`, `1`, `0`, nulo o ausente se rechazan. Claves de más: se descartan sin leer ni registrar su valor (solo el código `reglas_campos_de_mas`). Un inválido rechaza todo: `rechazada` con `{campo, codigo}` (`obligatorio`, `no_entero`, `fuera_de_rango`, `no_valido`). Con V-109 verificada (022·T-035), esquema zod estricto sin coerción; si no, validador escrito a mano con la misma tabla.

**Formulario** (CA-023): sin espacios en los extremos, `^[0-9]{1,3}$` y rango; si no, error junto al campo y nada enviado.

**Resultado → vista**: `hecha`; `ya_estaba`, `desactualizada`, `no_aplicada`, `entrada_no_valida` → `rechazada`; `no_encontrado`, `no_permitida` → `no_permitida`; lo demás → `incierta`. LR-1 con cero filas (sin `es_admin()` o cliente inexistente; D-5) → `no_permitida`, nunca `sin_reglas` ni valores. Ningún mensaje lleva identificadores, valores recibidos ni datos internos (REQ-025).

## Datos

Ruta crítica. Tres migraciones nuevas, cada una un archivo que no se edita después de integrado, con `.claude/rules/bd.md`, skill `migracion-bd`, `search_path = pg_catalog, pg_temp` y todo calificado (D-035), y su reversión en `supabase/reversiones/`:

- **M25-1** (tras M24-1 y antes de 022·T-013): D-1 a D-4 y el relleno de D-10.
- **M25-2** (tras M25-1, `es_admin()` con `aal2` y las tablas de la 021): LR-2, OR-1 y OR-2 (D-5, D-6).
- **M25-3** (tras M25-2, P25-03 y las columnas de baja de la 022): LR-1 (D-5, D-8).

| N.º | Sobre qué | Qué se hace | REQ |
| --- | --- | --- | --- |
| D-1 | `reglas_cliente`, **alterada en su sitio** | `drop trigger reglas_cliente_valores` (M07; `fijar_valores()` no se toca); `drop column actualizado_en` (DD-08); `drop default` de las cinco columnas (DD-07); FK a `clientes` de `cascade` a **`on delete restrict`** (DD-09). Se conservan clave, `not null` y `check` de M02. Ninguna otra columna | 020, 037 |
| D-2 | `privado.reglas_por_defecto()` | `immutable`; devuelve las cinco claves (30, 3, `true` ×3) como `jsonb`. Única fuente para O-1 de la 022, OR-2, LR-1 y los juegos. `execute` solo para el dueño y `authenticated` | 004, 049 |
| D-3 | Disparadores (todos los roles, también el dueño) | `before update` por fila: rechaza cambiar `cliente_id` (`reglas_cliente_inmutable`). `before delete` por fila y `before truncate` por sentencia: rechazan (`reglas_cliente_sin_borrado`; DD-24). Disparador de restricción diferido `after insert` en `clientes`: al confirmar, el cliente tiene fila (`cliente_sin_reglas`; DD-10). **Identidad (m-5):** las funciones de los cuatro disparadores son `security definer` del dueño con `search_path = pg_catalog, pg_temp`, y los disparadores quedan `enable always`, como `auditoria` en M04 (líneas 182-183); así el diferido comprueba la fila al confirmar aunque la transacción sea de `authenticated` bajo RLS | 019, 037, 049, 054 |
| D-4 | Permisos | `revoke insert, update, delete, truncate` sobre la tabla (también por columnas) a `public`, `anon`, `authenticated`, `service_role` y `conector`; `drop policy reglas_cliente_insert_admin` y `reglas_cliente_update_admin`. Queda `select` para `authenticated` con `reglas_cliente_select_admin`. Al final, la migración llama a `privado.sin_escritura_directa('public.reglas_cliente')` de la 024 (su D-12) como aserción: si algún rol conserva escritura, falla y no cambia nada (DD-24). `reglas_cliente_auditar` se queda como barrera (DD-23 de la 024) | 017, 018, 023, 031, 032, 037 |
| D-5 | LR-1, LR-2 | `security invoker`, primero `es_admin()` (si no, cero filas), sin SQL construido con texto, `execute` solo para `authenticated`. Tiempo máximo: el del ajuste por rol (024, D-6; DD-28). LR-1 calcula `coinciden`, `de_baja` (columnas de baja de la 022) y `recibe_ahora` (D-8). LR-2: `auditoria` del cliente con `accion` en (`reglas_cambio`, `reglas_restablecimiento`) e `id ≤ corte`, `id desc`, 25 por página, total bajo el corte, actor unido a `administradores` (`correo`, `estado`). **Sin I-41** (DD-05). No escriben | 005, 017, 028, 050–053 |
| D-6 | OR-1, OR-2 | `security definer` en `privado`, **propiedad del dueño `postgres`** (DD-27), `execute` revocado a todos y concedido solo a `authenticated`, expuestas como fije REQ-010 de la 010 (P25-04). **Entradas `jsonb` con `jsonb_typeof`** y exactamente cinco claves (DD-03). **Enteros (m-2):** antes de convertir, `jsonb_typeof(v) = 'number'`, el texto de `v` (`v #>> '{}'`) cumple `^[0-9]{1,3}$` y solo entonces `::smallint` y rango (1 a 100, 1 a 14); nunca `::numeric::smallint` ni `(->>)::smallint` sin esa comprobación. Rechaza `1.0`, `1.5`, `100.0` (`jsonb` conserva la escala) y toda forma no entera (DD-32). **Límite de `jsonb`:** al leer la entrada, PostgreSQL normaliza el exponente y el signo (documentación de PostgreSQL, «JSON Types»: `1.230e-5` se guarda `0.00001230`), así que `1e2` llega como `100` y `-0` como `0`; `0` y `1e400` quedan fuera de rango, y `1e2` es el número 100 del JSON y vale lo mismo que `100` (tampoco `entrada.ts` lo distingue tras `JSON.parse`). Casos medidos y desviación de m-2: «Dictamen vuelta 1». Es un límite documentado, no evidencia de CA-023, que cierra el formulario. T-002 confirma qué llega. Todo fallo da `entrada_no_valida` sin excepción, antes de cualquier cerrojo. Anotan con `privado.anotar_auditoria(accion, cliente, 'persona', reglas => lista)` sin actor: la auxiliar lo toma de `auth.uid()` y deriva el cliente (024, D-4); contexto `api_autenticada` (024, D-3 (5)) | 006, 007, 012, 021, 022, 033–043, 048 |
| D-7 | Índice | `auditoria (cliente_id, id desc) where accion in ('reglas_cambio', 'reglas_restablecimiento')`, **creado por M24-1** (024, D-7); M25 no crea índices | 030 |
| D-8 | `recibe_ahora` | Verdadero solo si `privado.estado_servido(cliente)` devuelve `activa`, **la misma regla del conector** (baja, licencia, `pausa_efectiva` con nulo como pausada, pausa global, canal sin versión); nulo, error u otro valor: falso. La extrae la fase 2 de M08 (P25-03); no se inventa otra (DD-17). **Acceso (m-3):** se pide `security invoker`, como `pausa_efectiva`, con `execute` solo para el dueño y `authenticated`; si la 011 la necesita `security definer`, su primera instrucción es `es_admin()` o el contexto del conector. Se comprueba con pgTAP de acceso cruzado (T-008) | 009, 047 |
| D-9 | Conector (fase 2) | Serializa la fila tal cual; **sin fila o con error, nunca `activa` ni valores por defecto** (quitar M08, líneas 223 a 230); reglas solo con `activa` (P25-03). **Condición (m-4; DD-33):** hasta P25-03 (b), M08 conserva la entrega de 30, 3 y tres `true` sin fila; la 025 no pasa a VERIFICADA (P7) ni a producción sin P25-03 (b) integrada y CA-029 en verde (T-021). Si la fase 2 rechaza D-9, se para y decide el responsable | 005, 013–016, 045 |
| D-10 | Datos | M25-1 rellena con D-2, como dueño, la fila de todo cliente que no la tenga y termina comprobando 0 clientes sin reglas (`clientes_sin_reglas`). `volumen.sql` pasa a valores de D-2 (P25-02); la 053, igual al migrar (P25-11). Juegos de CA-002, 006, 033 a 035 y volumen de CA-022 en `supabase/datos/`, solo desarrollo y entorno previo, escritos llamando a OR-1 y OR-2 con `set role authenticated` y claims ficticios | 049, 030 |

### Vuelta atrás (artículo 11)

| Migración | Contenido | Vuelta atrás |
| --- | --- | --- |
| M25-1 | D-1 a D-4 y relleno de D-10 | Devuelve columna, `default`, disparador de M07, FK `cascade`, permisos y políticas de M07, y quita D-2 y D-3, **solo junto con una versión de la app sin esta función y antes de M25-2** (su reversión falla si existen OR-1 u OR-2): reabre la escritura directa, que la barrera de la 024 sigue rechazando. Las filas rellenadas no se quitan: sin ellas el conector deja de servir `activa` (REQ-045) |
| M25-2 | LR-2, OR-1, OR-2 | Elimina las funciones. El panel deja de leer y cambiar reglas: falla hacia el lado seguro; el conector no se ve afectado |
| M25-3 | LR-1 | Elimina la función; la sección muestra el error de lectura |

Se prueba en CI aplicando, revirtiendo y reaplicando con los datos ficticios, comparando la huella de `reglas_cliente` y de `auditoria` y repitiendo la suite de la 010 (PRUEBA-017). **Datos:** un cambio de reglas se deshace con otra acción («Restablecer» o un cambio). El sistema no guarda los valores anteriores (cuestión 4; DD-30): el valor previo solo consta en el diálogo que vio quien confirmó.

## Auditoría de esta función

| Acción | Quién la escribe | Fila | `reglas` |
| --- | --- | --- | --- |
| I-39 `reglas_cambio` | OR-1 | Principal, origen `persona`, actor `auth.uid()`, contexto `api_autenticada` | Las que cambiaron, no vacía, en orden del catálogo |
| I-40 `reglas_restablecimiento` | OR-2 | Principal, igual | Las que cambiaron a su valor por defecto |
| I-41 `reglas_por_defecto` | O-1 de la 022 | Vinculada a su I-01 | Ninguna |

Tipo `reglas_cliente`; objeto y cliente = el cliente (la auxiliar lo deriva). Ningún valor, anterior ni nuevo (REQ-022). Sin cambios, ninguna fila (REQ-041, R-1 de la 024). Leer no anota (REQ-053). El relleno de M25-1 y los juegos de `seed.sql`, como dueño directo, no dejan fila (riesgo residual F-1 de la 024).

## Flujo

**OR-1 / OR-2**, en una transacción, como dueño (la barrera `reglas_cliente_auditar` no se activa: `current_user` es `postgres`):

1. `es_admin()`; si no, `no_permitida` y nada más (REQ-033).
2. Comprueba las entradas (D-6, con la comprobación entera completa de m-2); si no, `entrada_no_valida`.
3. `select … for no key update` de la fila del cliente (DD-20). No existe: `no_encontrado` (cliente inexistente; uno sin reglas no puede existir). Es el único cerrojo de fila de la operación. **Justo después (m-1), `es_admin()` otra vez**, como la 022: si el actor se dio de baja o perdió `aal2` mientras esperaba la fila, `no_permitida` sin escribir ni anotar.
4. `nuevas` (OR-2: `reglas_por_defecto()`) igual a lo guardado: `ya_estaba`, sin escribir (REQ-040, 041).
5. Lo guardado distinto de `esperadas`: `desactualizada`, sin escribir (REQ-039).
6. En un bloque con su propio punto de recuperación: `update` de las cinco columnas de la fila ya bloqueada; lista de reglas cambiadas (columna a columna, en el orden del catálogo); `anotar_auditoria(...)`. **R-2 de la 024:** la fila de auditoría va tras el único cerrojo de fila; el `update` solo toca esa fila; no se toca `administradores` ni `clientes` (R-3 no aplica: no se escribe en sus tablas). Cualquier excepción del bloque (también `55P03` por `lock_timeout` o `40P01`) deshace los dos y devuelve `no_aplicada` (DD-12, REQ-043). `query_canceled` no se captura: sube y el panel lo ve como `incierta`.
7. Devuelve `hecha` y la lista (DD-22).

El doble envío llega con las mismas `esperadas`: el segundo encuentra lo guardado igual a `nuevas` y da `ya_estaba` (una sola fila, REQ-040). Dos administradores desde el mismo punto: el segundo da `desactualizada` y relee; nunca hay mezcla, porque se compara el estado completo (DD-01, DD-02).

**Ver** (`page.tsx` de la 022 tras `exigirAdministrador()`): la vista pide LR-1 y LR-2 por separado con `leerReglas` y `leerHistorialReglas`; LR-2 con corte nulo. Cambiar de página reutiliza el corte en memoria; volver a la página 1 o recargar lo renueva. El número de fila de la 024 sigue el orden de confirmación (su D-3), así que ninguna fila confirmada después aparece por debajo del corte (REQ-052).

**Conector**: sin cambios de contrato; D-9. Un cambio confirmado se ve en la siguiente `obtener_instrucciones` que lea la fila después de la confirmación (lectura confirmada de PostgreSQL); la revisión en curso no recibe nada (REQ-013, 014).

## Comprobación del artículo 8

Contraste con la constitución 1.5 y con las especificaciones de la 016, la 017 y la 018 (no sus diseños).

| N.º | Comprobación | Resultado |
| --- | --- | --- |
| 8-1 | Ninguna regla habilita enviar, borrar ni compartir. Los dos enteros acotan cuánto trata y desde cuándo; los tres booleanos, con «No», apagan acciones que el arranque ya permite (012, REQ-004 a 008); con «Sí» no amplían nada. El arranque declara que nada del conector relaja sus límites (012, REQ-025) | Cumple (AM-10) |
| 8-2 | No hay sexta regla ni campo nuevo: contrato con `additionalProperties: false`, tabla sin otra columna, entradas cerradas. Una regla nueva exige especificación y contrato, y solo se admitiría si restringe (DD-19) | Cumple (PRUEBA-001, 008, 018) |
| 8-3 | La 025 no activa la compuerta, no apaga su filtro, no toca exclusiones ni topes y no cambia su código: no lee ni escribe ningún estado de la compuerta (vive en la cuenta del cliente; 016, REQ-013) y no expone ningún interruptor. Lo que llegue del panel se ignora (016, REQ-018; 017, requisito 17). El interruptor «seguir/parar» y la cifra en los paneles son de otra función (016, «Fuera de alcance») | Cumple (PRUEBA-014: ningún símbolo, ruta ni texto de la compuerta en las piezas) |
| 8-4 | «Preparar borradores». Con «No», el agente no deja candidatos: solo impide. Con «Sí» (valor por defecto), la compuerta solo envía con todas sus condiciones de código (016, REQ-001), y lo que aporta el modelo solo puede impedir (art. 8; 016, REQ-004). Pasar de «No» a «Sí» no activa ni relaja la compuerta | Cumple (AM-13) |
| 8-5 | «Máximo de correos por revisión» no sube los topes de la compuerta, que están en su código (016, REQ-009). «Guardar adjuntos» y «Descargar facturas por enlace» no intervienen en envíos; la compuerta no envía adjuntos (016, REQ-005) | Cumple |
| 8-6 | La 018 aprende estilo en la cuenta del cliente; nada de ello pasa por el panel ni por estas reglas (018, REQ-013) | No aplica |

Si la 025 expusiera algún día un interruptor que afecte al envío, solo podría restringir; hoy no expone ninguno.

## Tareas previas

| Tarea | Qué comprueba | Regla |
| --- | --- | --- |
| T-P1 | En el proyecto de desarrollo, por la vía de exposición de 022·T-004, que una función recibe `jsonb` con los tipos JSON intactos (`1` frente a `"1"`, `true` frente a `"true"`), dentro de `begin … rollback` | Si no, vuelve al arquitecto antes de M25-2 |
| T-P2 | La 010 real frente a «Datos»: cada objeto de H-1, las pruebas de la 010 que nombran `reglas_cliente`, `seed.sql`, `volumen.sql` y todo `insert into public.clientes` que confirme sin fila de reglas | Lo que no cuadre, al arquitecto antes de M25-1 |

V-108 la cierra la 021; V-109, 022·T-035. Esta función no se conecta a la base de datos sin ellas.

## Amenazas de esta función

| N.º | Amenaza | Control | Prueba |
| --- | --- | --- | --- |
| AM-01 | Sesión de superadmin robada cambia reglas (A-11) | `es_admin()` con `aal2` en cada operación y lectura; auditoría con actor; historial visible en la ficha | 007, 009 |
| AM-02 | Identificador manipulado para leer o cambiar otro cliente (art. 2) | El identificador solo elige (D-040); permiso de la sesión; inexistente y sin permiso dan lo mismo; `cliente_id` inmutable | 007, 012, 013 |
| AM-03 | Texto libre o regla inventada que llega al agente (art. 1, 7) | Esquema cerrado en servidor; `jsonb` con cinco claves en la base de datos; tabla sin columnas de texto; contrato `additionalProperties: false` | 001, 008, 018 |
| AM-04 | Conversión laxa (`"1"`, `"on"`) cuela un booleano | `jsonb_typeof` en D-6; tipos JSON estrictos en `entrada.ts`; T-P1 | 001, 009 |
| AM-05 | Petición desde otro sitio o incrustación (A-21) | `comprobarOrigen()`; `frame-ancestors 'none'` de la 002 | 013 |
| AM-06 | Mezcla de dos cambios o cambio perdido | Cerrojo de fila y comparación del estado completo | 010 |
| AM-07 | Cambio sin rastro o rastro sin cambio | Sin escritura directa (D-4, aserción de la 024); barrera de la 024; auditoría en la misma transacción | 008, 009 |
| AM-08 | Un fallo enseña valores por defecto como si fueran del cliente (art. 3) | `sin_reglas` y error sin valores; ningún valor por defecto en el navegador; sin guardar sobre valores no leídos | 002, 006 |
| AM-09 | El conector sirve valores por defecto si falta la fila (H-2) | D-9; D-3 impide el cliente sin reglas | 015 |
| AM-10 | Una regla relaja los límites del agente (art. 8) | «Comprobación del artículo 8», 8-1 y 8-2; DD-19 | 001, 014; revisión |
| AM-11 | Un correo de administrador ejecuta código en el historial | `TextoDato` | 004 |
| AM-12 | Uso de la clave secreta (A-10) | `fuente-bd.ts` con `leerDelArea()`; comprobación estática | 014 |
| AM-13 | Sesión robada pasa «Preparar borradores» a «Sí» para que la compuerta del cliente envíe (art. 8) | El panel no toca la compuerta (8-3, 8-4): sus condiciones de código, activación y topes siguen; fila I-39 e historial; el dueño ve los avisos y el resumen de la 016 | 009, 014 |
| AM-14 | OR-1/OR-2 creadas sin ser del dueño activan la barrera, o una función `security invoker` escribe la tabla | DD-27: `proowner` comprobado; la barrera rechaza (`escritura_sin_accion_auditada`); falla cerrado | 008, 009 |
| AM-15 | La restricción diferida no se comprueba en pgTAP (todo acaba en `rollback`) | PRUEBA-008 y 011 usan `set constraints … immediate`; PRUEBA-011 confirma en una base desechable | 008, 011 |

## Pruebas

| N.º | Qué | Etapa | Criterios |
| --- | --- | --- | --- |
| 001 | `catalogo.ts` frente al contrato (claves, rangos, sin sexta clave); baterías de `entrada.ts` y del formulario; claves de más descartadas sin registrar | A | CA-023, 024, 025 (servidor), 031 |
| 002 | Valores sobre la muestra: unidades, palabras, explicaciones (sin enviar, borrar ni compartir), por defecto junto a la regla, cinco estados, `sin_reglas` | A | CA-001, 002, 020 (parte) |
| 003 | Diálogos con 1, 3 y 5 cambios, cancelar, sin cambios, avisos de `de_baja` y `recibe_ahora`, restablecer ya coincidente | A | CA-005, 006 (textos), 007 (diálogo), 028 (vista) |
| 004 | Historial sobre la muestra: columnas, «dado de baja», sin segundos, 60 filas en 25/25/10, cinco estados, `TextoDato` | A | CA-033, 034 (vista), 020 |
| 005 | axe y revisión manual con teclado y lector; 320 px; textos y errores | A y B | CA-017, 018, 019, 021 |
| 006 | `incierta`, `no_aplicada`, lecturas con error, red caída y respuesta mal formada: relee, conserva, sin guardar sobre no leído | A y B | CA-015 (panel), 020 |
| 007 | pgTAP, matriz de 5 perfiles más superadmin sobre LR-1, LR-2, OR-1, OR-2 y la tabla; rol o factor perdidos antes de OR-1/OR-2; acceso cruzado entre dos clientes | B (CI) | CA-011, 013 (base de datos) |
| 008 | pgTAP: rangos, tipos, nulos, columna nueva, cambio de cliente, borrado, `truncate`, alta sin reglas (con `set constraints … immediate`), también como dueño; catálogo sin texto; escritura directa rechazada por permiso y por la barrera; `proowner`, `prosecdef` y `proconfig` de OR-1/OR-2; aserción de D-4; m-5: `tgenabled = 'A'` de los cuatro disparadores de D-3 y `prosecdef`, `proowner` y `proconfig` de sus funciones | B (CI) | CA-014, 016 (directa) |
| 009 | pgTAP OR-1/OR-2: fila exacta con 1, 3 y 5 reglas, 2 actores, 2 clientes, 0 valores en la fila, contexto `api_autenticada`; `ya_estaba`; fallos provocados en cada paso y en la auditoría; `jsonb` inválidos; m-2: `1.0`, `100.0`, `-0.0`, `10e-1`, `1.5` y `1e400` (por el patrón) y `-0` y `0` (por el rango) dan `entrada_no_valida` sin excepción ni cambio; `1e2`, `1E2` y `1.0e2` se admiten como 100 (dentro de rango en el máximo de correos, fuera en la ventana) y `1.5e1` como 15, según el límite de D-6; ningún valor no entero admitido ni redondeado. los casos de `1e2` documentan el límite y no son evidencia de CA-023, cuyo `1e2` cierra PRUEBA-001 | B (CI) | CA-015, 016, 023 (salvo `1e2`), 024, 027 (base de datos), 028 |
| 010 | Paso de varias conexiones de `bd.yml` (D-040): cambio/cambio y cambio/restablecimiento ×20; doble envío < 100 ms ×10; m-1: la conexión 1 retiene la fila, la 2 lanza OR-1 y la 3 da de baja al actor de la 2 (y, aparte, le quita `aal2`): `no_permitida`, 0 cambios y 0 filas de auditoría | B (CI) | CA-026, 027 |
| 011 | Con O-1 de la 022: 20 altas, fallos en cada paso, 0 clientes sin reglas; confirmando en una base desechable, con O-1 llamada por `authenticated` bajo RLS y el disparador diferido de D-3 comprobando al confirmar (m-5) | B (CI) | CA-032 |
| 012 | LR-2: coincide con `auditoria`, sin otros clientes ni acciones, corte con 5 cambios durante el recorrido, 0 filas nuevas tras 50 lecturas. LR-1 frente al bloque `reglas` de `obtener_instrucciones` en la misma instantánea | B (CI) | CA-034, 035; CA-003 (parte) |
| 013 | Extremo a extremo contra desarrollo: ficha, 7 estados de cliente, sesiones, identificadores manipulados, otro origen, incrustación | B | CA-001, 002, 004 (panel), 006, 011, 013, 030, 033 |
| 014 | Estática con trampas: ninguna importación de `admin.ts`; guardia primero en `acciones-reglas.ts`; ningún símbolo, ruta o texto de la compuerta (art. 8); fuente ficticia fuera del producto; integración con la clave ausente | A y B | CA-012, 031 (parte) |
| 015 | Agente de prueba: coincidencia ficha/agente, cambios 1/3/5, restablecer, cambio a mitad de revisión, A y B, pausa, suspensión y baja, lectura de reglas forzada a fallar y cliente sin reglas | C | CA-003, 004, 007, 008, 009, 010, 025, 029 |
| 016 | 200 mediciones por operación con el volumen de D-10 | D | CA-022 |
| 017 | Aplicar, revertir y reaplicar M25-1 a M25-3, con la suite de la 010 y de la 024 en verde | B (CI) | Artículo 11 |
| 018 | Ocho campos de más por acción; registros sin sus valores | B | CA-025 |

## Valores que fija este diseño

25 filas por página · páginas 1 a 1.000 (500 cambios caben en 20) · 30 s en el navegador (`useAccion`); en la base de datos, el ajuste por rol · cuerpo de la petición de 2 KB como mucho · enteros de 1 a 3 cifras en el formulario.

**Rendimiento (REQ-030), sin medir.** LR-1 lee una fila por clave; LR-2 recorre como mucho 25 entradas del índice D-7 y cuenta ≤ 500; OR-1/OR-2 tocan una fila y anotan una. Si PRUEBA-016 no da el umbral, vuelve al arquitecto.

## Decisiones por delegación (D-036)

Se anotan en `aclaraciones.md` al abrir la P1. DD-01 a DD-18, de la versión del 19/11, se mantienen (DD-04 y DD-06 confirmadas por la 024).

| N.º | Decisión | Motivo |
| --- | --- | --- |
| DD-01 | Concurrencia comparando los cinco valores esperados, no una columna de versión | Da `ya_estaba` limpio en el doble envío; sin columna nueva |
| DD-02 | El formulario envía siempre las cinco reglas deseadas; la base de datos calcula cuáles cambian | Ninguna lista de cambios viene de fuera (REQ-036) |
| DD-03 | Entradas `jsonb` con tipos comprobados en la base de datos; enteros con la comprobación completa de D-6 antes de convertir (m-2) | Cierra `'1'::boolean`, `1.5` redondeado a 2 y el `22P02` fuera del bloque |
| DD-04 | Lectura propia del historial (LR-2), no `leer_auditoria` de la 024 | Aquélla filtra por una sola acción; menos superficie |
| DD-05 | El historial no incluye I-41 | REQ-053 y deducción 2 de la especificación |
| DD-06 | Fecha y hora con el formato común, sin segundos | REQ-051 y REQ-002 de la 024 |
| DD-07 | Sin `default` de columna; una sola fuente de valores por defecto | Un solo sitio que cambiar y probar |
| DD-08 | Sin `actualizado_en` | El historial es la auditoría |
| DD-09 | Clave ajena `on delete restrict` y borrado prohibido | REQ-037; D-6 de la 022 («sin cascadas») |
| DD-10 | Restricción diferida de cliente con reglas | REQ-049 garantizado aunque falle O-1 |
| DD-11 | Sin escritura directa para ningún rol | REQ-023 por construcción |
| DD-12 | El fallo de la auditoría se captura y devuelve `no_aplicada` | REQ-043 pide decir que no se aplicó |
| DD-13 | Enteros en campo de texto numérico, no `type="number"` | Éste admite «1e2» y depende del idioma |
| DD-14 | Edición en el sitio con «Cambiar reglas» | Menos riesgo de cambio accidental |
| DD-15 | Valor por defecto visible junto a cada regla distinta | Explica la palabra de REQ-003 |
| DD-16 | Restablecer con todo ya por defecto no abre diálogo | Como REQ-010 |
| DD-17 | `recibe_ahora` con la regla única del estado servido | Lo que dice el diálogo es lo que hará el conector |
| DD-18 | Claves de más: el servidor las descarta y la base de datos las rechaza | Capa interior más estricta |
| DD-19 | La 025 no expone nada de la compuerta; una regla futura solo se admitiría si restringe | Art. 8; 016, REQ-018 |
| DD-20 | `for no key update` en lugar de `for update` | No cambia la clave; no espera al `for key share` de una inserción hija |
| DD-21 | Tres migraciones: M25-1 sin dependencias de la 021; LR-1 aparte, tras P25-03 | O-1 de la 022 y las pruebas de OR no esperan al conector |
| DD-22 | OR-1/OR-2 no devuelven `recibe_ahora`; el aviso sale de la relectura | Una sola fuente del aviso; contrato más pequeño |
| DD-23 | LR-1 devuelve `de_baja` y el diálogo tiene aviso propio (E-1) | La baja es definitiva (D-040); el texto general sería falso |
| DD-24 | `before truncate` de sentencia y aserción con `sin_escritura_directa()` de la 024 | `truncate` no activa disparadores de fila; la migración no deja escritura abierta por error |
| DD-25 | V-109 por 022·T-035, sin tarea propia | Una sola verificación |
| DD-26 | `update` y anotar en el mismo bloque tras el único cerrojo (R-2 de la 024) | Sin esperas con el cerrojo de la 024 tomado |
| DD-27 | OR-1/OR-2 propiedad de `postgres`, comprobado en pgTAP | La barrera de M04 solo se salta con `current_user = postgres` |
| DD-28 | Tiempo máximo por el ajuste de rol, no por cláusula en la función | 024, D-6: la cláusula no limita la sentencia que llama |
| DD-29 | Antes A-2: REQ-045, aprobado, manda sobre la cuestión 15 de la 011; se le pide cerrarla así (P25-03) | El responsable ya decidió en la P0 de la 025 |
| DD-30 | Antes A-3: no se guardan valores anteriores; no se reabre la cuestión 4 | Respuesta expresa del responsable |
| DD-31 | Antes A-5: la purga de la fase 6 diseñará su vía (P25-10) | Hoy nada borra; D-3 es cierre en fallo |
| DD-32 | m-2: la base de datos rechaza `1.0` y toda forma no entera (escala distinta de 0, decimales, fuera de `^[0-9]{1,3}$`); `1e2` y `-0` se tratan como el número que `jsonb` ya normalizó (D-6), apartándose de m-2 («Dictamen vuelta 1»; lo acepta o no el `auditor-seguridad` en T-007) | Nunca un valor no entero ni redondeos ni excepciones fuera del bloque (arts. 1 y 7); el `1e2` de CA-023 lo cierra el formulario |
| DD-33 | m-4: la 025 no pasa a VERIFICADA (P7) ni a producción sin P25-03 (b) integrada y CA-029 en verde (T-021). Si la fase 2 rechaza D-9, se para y decide el responsable; no se acepta como riesgo por delegación | REQ-045 aprobado; ruta crítica «entrega del prompt» (art. 3) |

## Cobertura de requisitos

| Requisitos | Dónde |
| --- | --- |
| REQ-001 a 004 | «La sección en la ficha»; D-2; DD-15 |
| REQ-005, 013 a 016, 045 | LR-1; D-8; D-9; «Flujo» (conector) |
| REQ-006, 007, 010, 011, 034, 035, 036, 048 | Formulario; «Contratos»; D-6; DD-02, 03, 18 |
| REQ-008, 009, 012, 047 | Diálogos; D-8; DD-23; OR-2 |
| REQ-017, 018, 031, 032, 033 | D-4, D-5, D-6; `exigirAdministradorEnAccion()`; AM-01, 12 |
| REQ-019, 038 | «Contratos» (UUID); D-3; AM-02 |
| REQ-020, 037 | D-1, D-3, D-4 |
| REQ-021 a 023, 042, 043 | «Flujo» paso 6; «Auditoría»; DD-11, 12, 26 |
| REQ-024, 025, 044 | «Tras la respuesta»; «Contratos» |
| REQ-026 a 029 | Componentes de la 020; textos; DD-06 |
| REQ-030 | D-7; «Valores» |
| REQ-039, 040, 041 | «Flujo» pasos 3 a 5; DD-01 |
| REQ-046 | AM-05 |
| REQ-049, 054 | D-2, D-3, D-10; O-1 de la 022 |
| REQ-050 a 053 | Historial; LR-2; DD-04 a 06 |

CA-001 a CA-035: columna «Criterios» de «Pruebas». Ningún criterio de base de datos se anota como superado en local.

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Dos enteros acotados y tres booleanos; ni nota ni motivo; auditoría con códigos de lista cerrada, sin valores; catálogo sin texto (PRUEBA-008) |
| 2 Aislamiento | Cumple | Nota aclaratoria (D-040, constitución 1.5): el identificador del cliente solo elige la ficha; el permiso sale de la sesión (`es_admin()`) y cada operación comprueba el objeto contra ese cliente en la base de datos. Pruebas automáticas: PRUEBA-007, 012, 013 |
| 3 Cierre en fallo | Cumple | Resultado desconocido = `incierta`; nunca valores por defecto en lugar de los del cliente, en el panel ni en el conector (D-9); `recibe_ahora` falso ante cualquier duda; borrado y escritura directa rechazados |
| 4 Secretos | Cumple | Sin clave secreta (PRUEBA-014); ningún secreto en SQL |
| 5 Especificación | Cumple | REQ → pieza → prueba en «Cobertura», «Pruebas» y `tareas.md`; E-1 antes del diálogo de baja |
| 6 Revisión independiente | Cumple | Dictamen del auditor recibido (APTO CON CONDICIONES, vuelta 1); revisión del `revisor` y P1 pendientes; ninguna puerta se da por abierta |
| 7 Entradas no confiables | Cumple | Validación cerrada en servidor y base de datos; campos de más sin efecto ni registro |
| 8 Límites en el anfitrión | Cumple | «Comprobación del artículo 8» (8-1 a 8-6): ninguna regla habilita enviar, borrar ni compartir; nada activa la compuerta, apaga su filtro, cambia sus exclusiones o topes ni su código; ningún interruptor de envío |
| 9 Prompt por despliegue | Cumple | No toca prompt, versión, canal ni orden (REQ-015, PRUEBA-015) |
| 10 Producto final | Cumple | Accesibilidad, cinco estados, simultaneidad, rendimiento, supervisión por `registrarFallo`; pgTAP en CI (D-040) |
| 11 Reversibilidad | Cumple | M25-1 a M25-3 con vuelta atrás probada (PRUEBA-017); un cambio de reglas se deshace con otra acción |
| 12 Español | Cumple | Textos, códigos y nombres en español |
| 13 Evidencias honestas | Cumple | Nada ejecutado; etapas y lugares de cada prueba declarados |
| 14 Cambios reservados | Cumple | No toca constitución, secretos ni producción; el cambio de CI (PRUEBA-010) va por D-036 con dictamen; aplicar en `Nido`, una persona |

## Dependencias nuevas

Ninguna. Si `entrada.ts` usa zod, depende de V-109 (022·T-035).

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Escritura directa con RLS y un disparador que audita | La 024 convierte el disparador genérico en barrera; actor y «sin cambios» se resuelven mejor en la operación |
| Columna `version` | El doble envío daría «desactualizada» en vez de «ya estaba» |
| Enviar solo las reglas cambiadas | Permite mezclas concurrentes |
| Parámetros SQL `smallint` y `boolean` | PostgreSQL convierte `'1'`, `'on'` y `'yes'` a booleano |
| Historial con `leer_auditoria` de la 024 | Una sola acción por filtro: dos llamadas rompen la paginación |
| Borrar las reglas al restablecer | Descartado por el responsable (cuestiones 2 y 3) |
| Calcular `recibe_ahora` en la 025 con una expresión propia | Dos reglas acabarían diciendo cosas distintas (DD-17) |
| Que la 025 reescriba `obtener_instrucciones` | El conector es de la fase 2 y ruta crítica propia; se le pide (P25-03) |

## Decisiones que requieren ADR

Ninguna: no cambia ninguna frontera. Sigue el patrón de operaciones de la 022 y de auditoría de la 024 (su ADR de T-006).

## Lo que este diseño no ha podido comprobar

- Nada se ha ejecutado; no hay código de la función, ni migraciones suyas, ni CI con pgTAP.
- Los diseños de la 021 y la 023 pueden cambiar nombres (`es_admin`, `pausa_efectiva`, `presentacion.ts`, columnas de baja de la 022).
- T-P1 y la forma de exponer operaciones del panel (P25-04).
- Que la fase 2 acepte P25-03 (`estado_servido`, D-9).
- Que las cinco explicaciones no contradigan la 012 más allá de sus requisitos 4 a 8; sus cuestiones 6 y 22 pueden cambiar el conjunto de reglas.
