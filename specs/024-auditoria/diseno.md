# 024 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (**pendiente**) · Fecha: 19/11/2026

Especificación APROBADA el 13/11/2026 (con su enmienda). Necesita dictamen del `auditor-seguridad` (ruta crítica «RLS y migraciones») y la puerta P1. **Ninguna prueba citada se ha ejecutado.** La base de datos se describe desde `docs/MODELO-DATOS.sql` (PROPUESTA; solo `auditoria`, sus disparadores, políticas y permisos) y desde «Auditoría de esta función» y «Datos» de la 021, la 022 y la 023. Decisiones por delegación: DD-NN (D-019).

## Resumen

La auditoría pasa de un disparador genérico de operaciones técnicas a **un registro de acciones del dominio**, regido por un catálogo cerrado en la base de datos (46 entradas: I-01 a I-41 y H-01 a H-05). **Ningún rol de la aplicación puede insertar, modificar, borrar ni vaciar `auditoria`.** Escriben las filas dos funciones auxiliares sin permiso de ejecución para nadie, llamadas como último paso por la función de cada acción, en su transacción. Un disparador valida contra el catálogo, pone el momento y asigna el número **tras un cerrojo**, de modo que su orden es el de confirmación.

La página «Auditoría» **solo lee**, con la sesión del administrador y RLS: la página de grupos (principal con sus vinculadas), las descripciones legibles (actor, cliente, objeto) y la lista de actores. Pagina por acciones sobre un **corte** (número de fila más alto en la primera carga) guardado en memoria, que se renueva al volver a la página 1 o recargar: pasar de página no repite ni omite. Las descripciones van aparte para poder mostrar datos parciales.

Hay **siete asuntos abiertos**; el principal (A-1) es una enmienda del inventario que piden la 021, la 022 y la 023.

## Hechos de partida y lo que el diseño hace con cada uno

Leídos en el repositorio el 19/11/2026, salvo H-7 (documentación oficial, el mismo día; es un dato, artículo 7).

| N.º | Hecho | Consecuencia |
| --- | --- | --- |
| H-1 | Modelo: `auditoria` con operación técnica y nombre de tabla, actor sin origen, sin fila principal; disparador genérico `privado.auditar()`; solo inserción, sin vaciado, lectura `es_admin()` | Se conservan solo inserción y la política; el resto se sustituye (D-1 a D-9) |
| H-2 | La 022 y la 023 (sus D-10) piden quitar el disparador genérico y escribir cada fila desde la función de la operación; la 021 pide `origen` (`persona`, `responsable_fuera_del_panel`, `sistema`) | Se adopta, con `agente_cliente` además |
| H-3 | La 021 propone tres acciones nuevas, no escribe I-32, toma el factor más reciente en I-30/I-31 y pide confirmar que «Olvidar este navegador» no deja fila. La 022 necesita I-11 vinculada a I-03 e I-06. La 023 pide el periodo en I-18, que REQ-029 no admite | Asunto A-1. Nada entra sin enmienda |
| H-4 | La 022 deriva «caducada» al consultar, sin tarea periódica | H-05 necesita quien lo anote: D-8 y T-P2 |
| H-5 | 020: la dirección solo admite enteros acotados, listas cerradas y UUID (V-3); fecha común sin segundos | Corte y fechas personalizadas fuera de la dirección; formato con segundos pedido a la 020 |
| H-6 | Constitución 1.0 sin la nota del artículo 2 | Identificadores en la dirección condicionados (A-2) |
| H-7 | Supabase, «Cron» (supabase.com/docs/guides/cron): `pg_cron`, trabajos en `cron.job`, historial en `cron.job_run_details`, menos de 10 minutos por trabajo | Opción para H-05; su disponibilidad en el plan gratuito de `Nido` (D-020) no consta: T-P2 |
| H-8 | V-108 y V-112 en VERIFICAR; sin Docker, CI remoto ni entorno previo | No se usan; «Construcción en etapas» |

## Supuestos y dependencias

| De quién | Qué necesita la 024 |
| --- | --- |
| 021 (sin P1) | `es_admin()`, `exigirAdministrador()`, `exigirAdministradorEnAccion()`, `leerDelArea()`, `servidor.ts`; `administradores.correo` y `estado`; baja que desactiva; I-19 a I-38 escritas con las auxiliares |
| 022 (sin dictamen) | `listarClientes` con clientes de baja; ruta de la ficha en `rutas.ts`; `fecha-madrid.ts`; I-01 a I-12, I-41 y H-03 a H-05 con las auxiliares |
| 023 (sin dictamen) | I-13 a I-18, H-01 y H-02; `FiltroCliente`; evidencia de sus T-P1 (exponer lecturas) y T-P3 (días de Madrid) |
| 025 (sin diseño) | I-39 a I-41; códigos y nombres visibles de las cinco reglas; qué reglas cambiaron, calculado en la base de datos |
| 020 (PLANIFICADA) | `Armazon`, `Tabla`, `Paginacion`, `BloqueDatos` y estados, `TextoDato`, `SelectorPeriodo`, `estado-direccion.ts`, `rutas.ts`, `registrarFallo`, textos y formatos; formato con segundos |
| Fases 1 y 2 | `registro.ts` sin valores, `no-store`, denegados y fallos sueltos anotados; «Datos», el conector anotando H-01 a H-04 y pgTAP con varias conexiones |

**Orden obligado.** La interfaz se construye con datos ficticios sin esperar a nadie. Nada se conecta a la base de datos antes de las migraciones de «Datos». CA-001 a CA-005 piden todas las acciones de la 021, 022, 023 y 025: esta función se verifica la última de la fase.

### Construcción en etapas

| Etapa | Hace falta | Se construye | Se prueba |
| --- | --- | --- | --- |
| A | App de la 002, componentes de la 020 | `src/lib/auditoria/` salvo `fuente-bd.ts`; `src/components/auditoria/`; página con fuente ficticia | PRUEBA-001 (app), 002 a 008. No cierra criterios que pidan base de datos |
| A' | PGlite | Borrador de D-1 a D-6 (`ingeniero-bd`) | Evidencia provisional; no cierra nada |
| B | Migraciones en desarrollo; 021 a 023 y 025 implementadas; T-P1 a T-P3 | `fuente-bd.ts`, `acciones.ts`, página real | PRUEBA-009 a 023, 025 a 030 donde haya pgTAP (A-5) |
| C | Conector de la fase 2 | — | PRUEBA-011 y 025 para H-01 a H-04 |
| D | Entorno previo con volumen | — | PRUEBA-024 |

## Piezas y responsabilidades

| Ruta | Qué hace |
| --- | --- |
| `src/app/admin/auditoria/page.tsx` | Servidor. `exigirAdministrador()`; filtros, orden y página por `estado-direccion.ts`; primera carga con corte nuevo; dinámica y `no-store` |
| `src/app/admin/auditoria/acciones.ts` | Cuatro acciones de solo lectura: `leerAuditoria`, `describirAuditoria`, `leerGrupoAuditoria`, `listarActoresAuditoria`. Cada una: `exigirAdministradorEnAccion()`, entrada validada por `entrada.ts` (campos de más, rechazo), `fuente-bd.ts`, resultado cerrado; un rechazo deja un código en el registro, sin valores |
| `src/lib/auditoria/catalogo.ts` | Las 46 entradas (código, entrada, texto visible, tipo, cliente); espejo del catálogo de la base de datos |
| `src/lib/auditoria/entrada.ts`, `periodo.ts` | Esquema de entrada («Contratos»); periodo a días de Madrid con `fecha-madrid.ts` |
| `src/lib/auditoria/presentacion.ts` | Único sitio que compone el texto de una fila (actor, objeto, referencia, cliente, marcas). La 025 lo reutiliza |
| `src/lib/auditoria/fuente-bd.ts` | Llama a las lecturas con `leerDelArea()`. Nunca importa `lib/supabase/admin.ts` |
| `tests/auditoria/fuente-ficticia.ts` | Guiones cerrados de la etapa A; no existe en el producto (como DD-25 de la 023) |
| `src/components/auditoria/` | `PaginaAuditoria`, `FiltrosAuditoria`, `FiltroActor`, `AvisoPeriodo`, `TablaAuditoria`, `GrupoAuditoria`, `CeldaObjeto`; reutiliza `FiltroCliente` de la 023 |
| `supabase/migrations/`, `supabase/tests/auditoria/` | D-1 a D-10 y su pgTAP (`ingeniero-bd`; reparto con la 010 por coordinación) |

Frontend: `ingeniero-frontend`; pruebas y fuente ficticia: `ingeniero-pruebas`.

**Rutas críticas** (dictamen del `auditor-seguridad`): migraciones y pruebas de D-1 a D-10, `fuente-bd.ts`, `acciones.ts` y PRUEBA-012. Se piden añadir a `docs/SEGURIDAD.md`.

**Columnas.** Fecha y hora (con segundos; única ordenable) · Actor · Acción (en I-39 e I-40, debajo, «Reglas cambiadas: …» por nombre visible) · Objeto (descripción, referencia si hace falta y enlace) · Cliente (cabecera «Cliente (nombre actual)»; «De baja»; «Cliente eliminado»). El texto de la acción es el de las tablas de la especificación. Un código desconocido se muestra «Acción no reconocida» y se registra `auditoria_accion_desconocida`.

**Grupos (REQ-057, DD-04).** Cada acción es un `tbody`. La principal va primero; las vinculadas debajo, sangradas, con «Detalle» visible al inicio de la acción y, para lector de pantalla, «detalle de: <acción principal>». Con filtro de acción o cliente, la principal se muestra siempre (marcada «Fuera del filtro» si no cumple), las vinculadas que no cumplen se ocultan y el grupo dice «y N detalles más fuera del filtro». Con más de 200 vinculadas se muestran 200 y «Ver los N detalles restantes» carga de 200 en 200 (DD-13).

**Objeto (REQ-004).** Atributos actuales no secretos:

- Con cliente (enlace a la ficha): «Cliente» y «Reglas del cliente» (el nombre va en su columna); «Licencia creada el 12/11/2026»; «Código generado el 12/11/2026 a las 10:31:07»; «Conexión de Claude, alta el 12/11/2026»; «Orden de pausa creada el 12/11/2026 a las 10:31:07».
- De administradores (enlace a Administradores): el correo y «dado de baja» si aplica; «Invitación a <correo> del 12/11/2026»; «Segundo factor de <correo>, registrado el 12/11/2026»; «Códigos de recuperación de <correo>».

**Referencia breve (DD-12).** «Ref. » y los 8 primeros caracteres hexadecimales del UUID del objeto (aleatorio; no derivado de código, token ni secreto). Se añade si el objeto ya no existe («ya no existe») o si otro objeto del mismo tipo y dueño (cliente o cuenta) tiene la misma descripción; ante coincidencia de los 8, se alarga de 4 en 4. Lo calcula `describir_auditoria`.

**Actor (REQ-015 a REQ-017).** `persona`: correo y «dado de baja» si la cuenta lo está hoy (con referencia breve si dos cuentas compartieran correo). `responsable_fuera_del_panel`: «El responsable (fuera del panel)». `sistema`: «Sistema». `agente_cliente`: «Agente del cliente».

**Hora.** `formatoFechaHoraSegundos` de la 020 («12/11/2026, 10:31:07», Madrid), solo aquí y en el historial de reglas de la 025.

**Filtros.**

- Periodo: `SelectorPeriodo` con «Últimos 30 días» (por defecto), «Hoy», «Últimos 7 días», «Últimos 90 días», «Todo el historial» y «Personalizado» (fechas nativas «Desde» y «Hasta», incluidas). Junto a él, el periodo en palabras y fechas, y «Ver todo el historial» a la vista mientras no sea ese (REQ-059).
- Actor: lista nativa con «Todos», «Sistema», «Agente del cliente», «El responsable (fuera del panel)» si ha sido actor, y cada cuenta que ha sido actor. La búsqueda filtra en el navegador (≤ 500 opciones): el texto no sale de él.
- Acción: lista nativa de las 46 entradas, en dos grupos, «Acciones» y «Hechos sin persona».
- Cliente: `FiltroCliente` de la 023 (texto en el cuerpo de `listarClientes`, nunca registrado).
- «Quitar filtros»: últimos 30 días, sin más filtros, orden por defecto, página 1.
- Un filtro no válido no se aplica: mensaje junto a él, sin repetir el valor; los aplicados quedan a la vista.

**Dirección.** `periodo` (`30d`, `hoy`, `7d`, `90d`, `todo`), `actor` (origen o UUID), `accion` (46 códigos), `cliente` (UUID), `orden` (`reciente`, `antiguo`), `pagina` (1 a 100.000). No van el corte, las fechas personalizadas (al recargar se vuelve a 30 días) ni lo buscado. `actor` con UUID y `cliente`, solo resuelto A-2; hasta entonces, en memoria (DD-22).

## Contratos

No cambia ningún archivo de `contratos/`. Formas que fija este diseño:

| Lectura | Entrada (cerrada) | Salida |
| --- | --- | --- |
| `leer_auditoria` | `desde`, `hasta` (día o nulo; 01/01/2026 ≤ desde ≤ hasta ≤ hoy en Madrid); `actor_origen` (4 valores o nulo); `actor` (UUID, solo con `persona`); `accion` (46 o nulo); `cliente` (UUID o nulo); `orden`; `pagina` (1 a 100.000); `corte` (1 a 2⁵³−1, o nulo = nuevo) | `{corte, total_acciones, grupos: [{grupo, ocurrido_en, origen, actor, principal_cumple, vinculadas_total, vinculadas_fuera, filas: [{id, principal, accion, objeto_tipo, objeto_id, cliente_id, reglas}]}]}`; ≤ 25 grupos, ≤ 200 vinculadas por grupo |
| `describir_auditoria` | `ids`: 1 a 5.100 números de fila | Por fila: correo y estado del actor; nombre y estado del cliente o `eliminado`; descripción del objeto o `no_existe`; referencia si hace falta. Nada para números que no son de auditoría |
| `leer_grupo_auditoria` | `grupo`, `corte`, filtros de acción y cliente, `pagina` (1 a 1.000) | ≤ 200 vinculadas, misma forma |
| `actores_auditoria` | Ninguna | ≤ 500 `{usuario_id, correo, estado}` y `hay_responsable` |

Errores (lista cerrada, como `leerDelArea()`): `sin_sesion`, `sin_permiso`, `filtro_no_valido`, `fallo`; ninguno lleva el valor recibido ni datos internos. «No existe» y «no aplica» dan lo mismo: cero grupos.

## Datos

Son de la fase 2 y rutas críticas. Nombres propuestos; el reparto de migraciones con la 010 lo fija coordinación, como en la 021 y la 022.

| N.º | Sobre qué | Qué se pide |
| --- | --- | --- |
| D-1 | `public.auditoria` (sustituye a la del modelo) | `id bigint` clave (lo pone el disparador); `origen` (`persona`, `responsable_fuera_del_panel`, `sistema`, `agente_cliente`); `actor uuid` con clave ajena a `administradores(usuario_id)` **`on delete restrict`**, presente si y solo si `origen = 'persona'` (DD-07); `accion` con clave ajena al catálogo y `(accion, objeto_tipo)` compuesta; `objeto_tipo` (10: `cliente`, `licencia`, `codigo_activacion`, `conexion`, `orden`, `reglas_cliente`, `administrador`, `invitacion`, `segundo_factor`, `codigos_recuperacion`); `objeto_id uuid not null`; `cliente_id uuid` **sin clave ajena** (DD-08); `ocurrido_en timestamptz not null`; `fila_principal_id` con clave ajena a `auditoria(id)`; `grupo bigint not null`; `reglas text[]` solo en I-39 e I-40, no vacía, sin repetidos y dentro de los cinco códigos (`max_correos_por_revision`, `ventana_dias`, `guardar_adjuntos`, `preparar_borradores`, `descargar_facturas_por_enlace`). **Ninguna otra columna ni texto libre.** REQ-018, 022, 023, 029, 030 |
| D-2 | `privado.acciones_auditoria` | `codigo` (clave, `^[a-z_]{3,40}$`), `entrada`, `objeto_tipo`, `con_cliente`, `puede_principal`, `vinculable_a` (códigos de principales), `origenes`, `lleva_reglas`. 46 filas de «Códigos», fijadas por migración; solo cambia con especificación aprobada. REQ-003, REQ-022 |
| D-3 | Disparador `before insert` por fila | (1) `pg_advisory_xact_lock` con clave fija; (2) `id := nextval(privado.auditoria_numero)`; (3) principal: `ocurrido_en := clock_timestamp()`, `grupo := id`; vinculada: su principal insertada en esta transacción (lista local que mantiene el disparador) y con acción en `vinculable_a`; copia `origen`, `actor` y `ocurrido_en` de ella; `grupo := fila_principal_id`; (4) catálogo: tipo, cliente si y solo si `con_cliente`, origen admitido, `reglas` si y solo si `lleva_reglas`; (5) con sesión de la API (`auth.uid()` no nulo), un actor `persona` tiene que ser `auth.uid()`; `responsable_fuera_del_panel` solo sin sesión y fuera de los roles `anon`, `authenticated` y del conector; `agente_cliente` solo con el rol del conector. Fallo: excepción y se deshace todo. REQ-015, 019, 026, 027, 043, 054 |
| D-4 | `privado.anotar_auditoria(accion, objeto_id, origen, actor, reglas)` y `privado.anotar_auditoria_vinculada(principal, accion, objeto_id)`, que devuelven el número | `security definer`, `search_path = ''`; ejecución revocada a `public`, `anon`, `authenticated`, `service_role` y al rol del conector. **Derivan `cliente_id` del objeto** (licencia, orden, reglas: su cliente; código y conexión: el de su licencia; tipos de administradores: nulo); objeto inexistente: excepción. No reciben cliente ni momento. REQ-018, 023, 054 |
| D-5 | Solo inserción y permisos | Se conservan `auditoria_solo_insercion` y `auditoria_sin_vaciado`. `revoke all` sobre tabla, secuencia y catálogo a `public`, `anon`, `authenticated`, `service_role` y conector; `grant select` sobre `auditoria` solo a `authenticated`, RLS con `auditoria_admin`. Se eliminan `privado.auditar()` y sus disparadores. REQ-024 a 026, 042 |
| D-6 | Lecturas `privado.leer_auditoria`, `describir_auditoria`, `leer_grupo_auditoria`, `actores_auditoria` | `security invoker` (RLS como segunda capa), primera instrucción `es_admin()` (si no: `sin_permiso`, cero filas), `search_path = ''`, `statement_timeout` 5 s, entradas acotadas, sin SQL construido con texto; ejecutables solo por `authenticated`; expuestas como fije la 010 (T-P1). REQ-031 a 035, 048, 049 |
| D-7 | Índices | `(ocurrido_en, grupo)`, `(actor, ocurrido_en)`, `(origen, ocurrido_en)`, `(accion, ocurrido_en)`, `(cliente_id, ocurrido_en)`, `(fila_principal_id)`. REQ-013 |
| D-8 | H-05 | `privado.anotar_caducidades()` cada 5 minutos (T-P2): por cada licencia `caducada` según `privado.situacion_licencia` (022) sin H-05 posterior a su último I-09, un H-05 de origen `sistema`. No cambia la licencia. REQ-058 |
| D-9 | Lo que no puede existir | Función, tarea o política que borre, actualice o vacíe `auditoria`, o que la devuelva como archivo. REQ-061, 062 |
| D-10 | Datos ficticios | Juegos de CA-001, CA-010, CA-012, CA-013 y CA-028; volumen de referencia (500.000 filas, 1.000 clientes, 30 actores con 10 de baja, grupos de 1 a 60 filas) por guion, solo en desarrollo y entorno previo |

**Reglas para las funciones que anotan** (021, 022, 023, 025, conector): anotar es el último paso de la transacción; una principal por acción que surte efecto y ninguna si no cambia nada (REQ-020); vinculadas solo para objetos con entrada vinculable (DD-20); el actor sale de la sesión o del token validado, nunca de la entrada.

**Vuelta atrás (artículo 11).** Las filas no se tocan nunca. Las migraciones son aditivas: revertir es desplegar la app anterior y, si hace falta, quitar del catálogo una entrada sin filas. Quitar columnas o filas de `auditoria` no es vuelta atrás admitida. Se prueba aplicando, revirtiendo y reaplicando con datos ficticios y comparando la huella de `auditoria`.

### Códigos del catálogo

Texto, tipo y cliente: los de la especificación. Entre paréntesis, a qué principal se vincula.

I-01 `cliente_alta` · I-02 `cliente_edicion` · I-03 `cliente_baja` · I-04 `cliente_reactivacion` · I-05 `licencia_creacion` · I-06 `licencia_suspension` · I-07 `licencia_reactivacion` · I-08 `licencia_revocacion` · I-09 `licencia_caducidad` · I-10 `codigo_generacion` · I-11 `codigo_anulacion` (solo vinculada: I-10, I-08) · I-12 `conexion_revocacion` (principal, o vinculada a I-08) · I-13 `orden_pausa_creacion` · I-14 `orden_reanudacion_creacion` · I-15 `orden_pausa_anulacion` · I-16 `orden_reanudacion_anulacion` · I-17 `orden_sustitucion` (solo vinculada: I-13, I-14) · I-18 `informes_exportacion` · I-19 `administrador_primero` · I-20 `invitacion_creacion` · I-21 `invitacion_aceptacion` · I-22 `administrador_reactivacion` (solo vinculada: I-21) · I-23 `invitacion_anulacion` · I-24 `administrador_baja` · I-25 `factor_registro` · I-26 `factor_sustitucion` · I-27 `factor_retirada` · I-28 `recuperacion_uso_codigo` (solo vinculada: I-33, I-25, I-26, I-27) · I-29 `recuperacion_regeneracion` · I-30 `factor_retirada_confirmada` · I-31 `factor_retirada_responsable` · I-32 `recuperacion_completada` · I-33 `sesion_inicio` · I-34 `sesiones_cierre_otras` · I-35 `contrasena_cambio` · I-36 `contrasena_restablecimiento` · I-37 `bloqueo_contrasena` · I-38 `bloqueo_segundo_factor` · I-39 `reglas_cambio` · I-40 `reglas_restablecimiento` · I-41 `reglas_por_defecto` (solo vinculada: I-01) · H-01 `orden_entrega` · H-02 `orden_confirmacion` · H-03 `conexion_activacion` · H-04 `conexion_revocacion_reutilizacion` · H-05 `licencia_caducada`.

Origen: `persona` salvo I-19 e I-31 (`responsable_fuera_del_panel`), I-37, I-38, H-04 y H-05 (`sistema`) y H-01 a H-03 (`agente_cliente`). Objeto de I-28 e I-29: la cuenta; de I-39 a I-41: el cliente.

## Flujo

1. **Abrir.** Sin sesión: inicio de sesión. Un factor: paso del segundo factor. Usuario de cliente o sin rol: «Sin permiso», sin consultar. Administrador activo con sesión completa: `leer_auditoria` (30 días, corte nulo); la base de datos fija y devuelve el corte. Luego `describir_auditoria` con los números de la página.
2. **Cambiar de página:** mismo corte; la página sale de las filas con número ≤ corte, así que lo nuevo no desplaza nada. Como el número se asigna tras el cerrojo, todo número ≤ corte ya era visible al fijarlo (REQ-008).
3. **Cambiar filtro u orden, ir a la página 1, «Quitar filtros» o recargar:** corte nuevo. `BloqueDatos` anuncia «N acciones».
4. **Un grupo entra** si alguna fila cumple acción y cliente; actor y periodo son del grupo. Orden `(ocurrido_en, grupo)` en el sentido elegido (REQ-007, REQ-050).

| Si… | Entonces |
| --- | --- |
| La sesión deja de valer (REQ-056) | `sin_sesion` o `sin_permiso`: la tabla se vacía y se muestra inicio de sesión, segundo factor o «Sin permiso» |
| `leer_auditoria` falla, se corta o pasa de 30 s | Error con reintento y referencia; nunca vacío ni datos anteriores (REQ-053) |
| `describir_auditoria` falla | Datos parciales: «Actor no disponible», «Cliente no disponible», «Objeto no disponible» y «Reintentar nombres», que repite solo esa lectura |
| Filtro manipulado | `filtro_no_valido`, mensaje sin el valor; cero filas fuera del filtro |
| Página más allá de la última | Vacío con «Ir a la primera página» (REQ-049) |
| Falla la escritura de una fila en otra función | Excepción; la transacción entera se deshace; esa función no muestra éxito (REQ-019, 044, 045) |

## Amenazas de esta función

| N.º | Amenaza | Control | Prueba |
| --- | --- | --- | --- |
| AM-01 | Un administrador o su cuenta robada (A-11) borra o retoca su rastro | Solo inserción, sin vaciado, sin permisos de escritura; ninguna pantalla lo ofrece | 008, 009 |
| AM-02 | Filas falsas (otro actor, otra fecha, acción inventada, «Sistema» a mano) | Sin permiso de inserción; auxiliares sin ejecución; D-3 fija número y momento y valida catálogo, origen y actor | 010 |
| AM-03 | Una función anota mal por un fallo | Catálogo por acción; cliente derivado del objeto; cada entrada probada dato a dato | 011, 015 |
| AM-04 | Una acción nueva sin entrada (REQ-021) | Matriz de operaciones comprobada contra funciones, permisos y disparadores | 012 |
| AM-05 | Secreto o dato de terceros en una fila | Columnas cerradas; referencia solo del UUID; `codigo_hmac` nunca se lee | 017, 029 |
| AM-06 | Usuario de cliente o sesión de un factor lee la auditoría | `es_admin()` en acción, función y política | 020 |
| AM-07 | Identificadores manipulados para ver otra cosa | Solo filtran; el permiso sale de la sesión; `describir_auditoria` solo acepta números de auditoría | 002, 020 |
| AM-08 | Lo buscado acaba en dirección, historial o registros | Búsqueda de actor local; la de cliente en el cuerpo; registros con códigos | 003 |
| AM-09 | Nombre con marcado; consultas pesadas; datos viejos | `TextoDato`; entradas acotadas, índices, 5 s; `no-store` y corte nuevo al recargar | 004, 024, 023 |
| AM-10 | El propietario de la base de datos (fuera de la aplicación) puede desactivar disparadores | Riesgo residual declarado; credenciales solo del responsable; asunto A-3 | — |
| AM-11 | Cerrojo retenido por una transacción larga | Anotar es el último paso; un bloqueo mutuo aborta una acción entera | 013 |

## Tareas previas

| Tarea | Qué comprueba | Regla |
| --- | --- | --- |
| T-P1 | Forma de exponer lecturas de la 010 (T-P1 de la 023; vale su evidencia) | Sin ella, no se pasa de la etapa A |
| T-P2 | En `Nido`: `pg_cron` disponible en su plan, su versión, con qué rol corre y que ejecuta `anotar_caducidades` sin más permisos | Sí: D-8. No, o exige gasto: vuelve al arquitecto y al responsable; mientras, H-05 no se anota y CA-018 no cierra |
| T-P3 | Dos conexiones y 1.000 acciones a la vez: orden de números = orden de confirmación; lista local de transacción con el agrupador de Supabase; `current_setting('role')` dentro de `security definer` distingue `authenticated`, conector y propietario | Falla el orden: vuelve al arquitecto (plan B: paginación por cursor). Falla el rol: se rehace D-3 (5) |
| T-P4 | Días de Madrid en la base de datos (T-P3 de la 023) | La suya |

## Pruebas

Ninguna ejecutada. Las de base de datos corren en CI y no se anotan como superadas en local. Etapa entre corchetes.

| Prueba | Qué | Cierra |
| --- | --- | --- |
| 001 | Catálogo de la app = de la base de datos = especificación (46 de 46, textos); acción fuera de lista rechazada [A, B] | CA-002 (parte), CA-010 (parte) |
| 002 | 20 valores manipulados y campos de más; mismo mensaje; ningún valor en mensajes ni registros [A, B] | CA-014 |
| 003 | Dirección, historial y registros sin nombres, correos ni texto; usuario de cliente con la dirección cambiada [A, B] | CA-015 |
| 004 | Fuente ficticia: una fila por entrada, grupos, marcas, referencias, enlaces, 10 nombres con marcado, cinco estados [A] | CA-010, CA-011, CA-022 |
| 005 | Análisis automático y revisión con teclado y lector [A] | CA-023 |
| 006 | 320 píxeles con capturas [A] | CA-024 |
| 007 | Textos, segundos, enero y julio con otra zona en el dispositivo [A] | CA-025 |
| 008 | Análisis estático: ningún control ni ruta de editar, borrar, ocultar, vaciar o exportar auditoría [A, B] | CA-006, CA-030 (interfaz) |
| 009 | Modificar, borrar, borrar todo y vaciar con cada perfil; huella igual [B] | CA-006 |
| 010 | Filas falsas con cada perfil, también llamando a las auxiliares [B] | CA-007 |
| 011 | 36 principales con dos administradores y dos clientes; 6 vinculadas; casos de CA-027 [B, C] | CA-001, CA-027 |
| 012 | Matriz de operaciones (`supabase/tests/auditoria/`): cada función ejecutable por un rol de la aplicación o por el responsable, cada permiso de escritura y cada disparador sobre el servicio de identidad, asignado a una entrada o a «no es acción»; cada escritura aceptada deja su principal [B] | CA-002 |
| 013 | Fallo forzado de principal y de cada vinculada; conexión cortada en cada paso [B] | CA-003 |
| 014 | Rechazos, repeticiones y 20 dobles envíos [B] | CA-004 |
| 015 | Campos de más y lista de reglas falsa [B] | CA-005 |
| 016 | Bajas, reactivación, renombre; huella; bloqueo provocado desde otro origen [B] | CA-008, CA-033 |
| 017 | Marcadores y valores de reglas raros: 0 apariciones [B] | CA-009 |
| 018 | 1.000 acciones, 10 pares simultáneos, 50 grupos, 50 inserciones durante el recorrido [B] | CA-012 |
| 019 | Filtros contra cálculo independiente, bordes y cambios de hora; simulacro A-11; periodo inicial [B] | CA-013, CA-026, CA-028 |
| 020 | Acceso por perfil (página y base de datos); sesión perdida con la página abierta; control positivo; usuarios de cliente invisibles [B] | CA-019, CA-032 |
| 021 | Integración sin la clave secreta; búsqueda estática de `admin.ts` [B] | CA-020 |
| 022 | Base de datos caída, con error y lenta; fallo de `describir_auditoria` [B] | CA-021 |
| 023 | 20 acciones, cada una seguida de carga [B] | CA-017 |
| 024 | 200 mediciones por operación con el volumen; 1.000.000 por página [D] | CA-016 |
| 025 | Activos, dos de baja, responsable, «Sistema», H-01 a H-05; 0 filas sin actor [B, C] | CA-018 |
| 026 | 50 consultas: 0 filas; una exportación: 1 fila I-18 [B] | CA-029 |
| 027 | Recuento antes y después de todas las tareas programadas; revisión de procesos [B] | CA-030 |
| 028 | 20 denegados y 8 fallos sueltos: 0 filas; registros sin valores [B] | CA-031 |
| 029 | Skill `revision-privacidad` [B] | CA-009 |
| 030 | H-05 una vez por caducidad; sin repetir en 3 pasadas; otra tras quitar y volver a caducar [B] | CA-018 (parte) |

## Valores que fija este diseño

25 acciones por página · páginas 1 a 100.000 · 200 vinculadas por respuesta · 5.100 números por descripción · 500 actores · referencia de 8 caracteres, ampliable de 4 en 4 · periodos `hoy`, `7d`, `30d`, `90d`, `todo` y personalizado desde el 01/01/2026 · 5 s por lectura en la base de datos y 30 s en el navegador · H-05 cada 5 minutos (su momento llega hasta 5 minutos tarde).

**Rendimiento, sin medir.** Todo va por índice: 25 grupos, recuento de grupos en el periodo y, en la página 200, un salto de 4.975 grupos. Si PRUEBA-024 no da el umbral, vuelve al arquitecto (opción: recuentos diarios precalculados).

## Decisiones por delegación (D-019)

Con la opción de más seguridad y legibilidad; ninguna toca lo reservado a una persona. El orquestador las pasa a `aclaraciones.md`.

| N.º | Decisión | Motivo |
| --- | --- | --- |
| DD-01 | Catálogo en tabla, no enumerado | Un enumerado no se revierte |
| DD-02 | Número tras cerrojo | Corte exacto; pocas acciones |
| DD-03 | Corte en memoria | Recargar muestra lo nuevo |
| DD-04 | Grupo con alguna fila que cumple; principal siempre, marcada; vinculadas que no cumplen, ocultas y contadas | Reconcilia REQ-009 y REQ-057 |
| DD-05 | Cliente derivado del objeto en la auxiliar | REQ-023 aunque la llamante se equivoque |
| DD-06 | Con sesión, el actor persona es la sesión | Nadie atribuye a otro |
| DD-07 | Actor con clave ajena a `administradores`, sin borrado | Existe, no se borra, y hoy no admite usuarios de cliente (REQ-016, 028, 064) |
| DD-08 | `cliente_id` sin clave ajena | «Cliente eliminado» sin tocar filas |
| DD-09 | Descripciones en lectura aparte | Datos parciales (REQ-036) |
| DD-10 | `describir_auditoria` solo con números de auditoría | No es una consulta general de objetos |
| DD-11 | Lecturas `security invoker` más `es_admin()` | Mínimo privilegio, dos capas |
| DD-12 | Referencia de 8 caracteres solo cuando hace falta | Legible y distinguible |
| DD-13 | Más de 200 vinculadas, por partes | Respuesta acotada sin partir el grupo |
| DD-14 | Fechas personalizadas fuera de la dirección | V-3; como DD-18 de la 023 |
| DD-15 | Búsqueda de actores local | El texto no sale del dispositivo |
| DD-16 | H-05 por tarea programada | La caducidad no es un acto |
| DD-17 | Reglas como códigos de columna | Comprobable por restricción |
| DD-18 | Reglas dentro de la celda de acción | Una columna menos a 320 píxeles |
| DD-19 | Diez tipos de objeto con código | Lista cerrada |
| DD-20 | Vinculadas solo con entrada vinculable; efectos sin entrada (sesiones, marcas) sin fila | Lectura de REQ-018 coherente con el inventario; se confirma en A-1 |
| DD-21 | Orden `(ocurrido_en, grupo)` | REQ-007 |
| DD-22 | Hasta A-2, actor y cliente elegidos en memoria | No se espera a la nota del artículo 2 |

## Cobertura de requisitos

| Requisitos | Dónde |
| --- | --- |
| REQ-001 a 006, 039 | «Piezas» |
| REQ-007, 008, 050, 057 | «Flujo»; D-3, D-7; DD-02 a 04 |
| REQ-009 a 012, 059 | «Piezas», filtros y dirección |
| REQ-013, 049 | D-6, D-7; «Valores» |
| REQ-014, 053, 056 | «Flujo» |
| REQ-015 a 017, 047, 058, 064, 066, 068 | D-1, D-3, D-8; «Códigos»; DD-07 |
| REQ-018 a 023, 043 a 045, 054, 055 | D-1 a D-4; reglas para las funciones que anotan |
| REQ-024 a 028, 042, 046 | D-1, D-3, D-5 |
| REQ-029 a 031 | D-1; «Contratos» |
| REQ-032 a 035, 040, 041 | D-5, D-6; `acciones.ts` |
| REQ-036 a 038 | «Piezas»; «Flujo» |
| REQ-048 | `entrada.ts`; «Contratos» |
| REQ-060 | D-6; I-18 de la 023 |
| REQ-061, 062, 067 | D-9 |
| REQ-063, 065 | `acciones.ts` y funciones de la 021 a la 023, con `registro.ts` |

CA-001 a CA-033: «Pruebas».

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Solo códigos, UUID, fecha y lista de reglas; correos y nombres se leen al mostrar |
| 2 Aislamiento | Cumple, con A-2 | Solo administradores; cliente derivado del objeto; la dirección no da permiso |
| 3 Cierre en fallo | Cumple | Fila no escrita deshace la acción; lectura fallida es error, no vacío |
| 4 Secretos | Cumple | Sin clave secreta; ningún secreto en filas ni referencias |
| 5 Especificación | Cumple | Lo de A-1 no se implementa sin enmienda |
| 6 Revisión independiente | Cumple | Falta dictamen y P1 |
| 7 Entradas no confiables | Cumple | Entradas cerradas; la documentación externa es dato |
| 8 Límites en el anfitrión | No aplica | No entrega nada al agente |
| 9 Prompt por despliegue | No aplica | — |
| 10 Producto final | Cumple | Cinco estados, accesibilidad, 320 píxeles, supervisión, rendimiento medido |
| 11 Reversibilidad | Cumple | Migraciones aditivas; catálogo en tabla |
| 12 Español | Cumple | Códigos, columnas y textos |
| 13 Evidencias honestas | Cumple | Nada ejecutado; lo que no cierra, declarado |
| 14 Cambios reservados | Cumple | Sin CI, permisos, secretos ni producción; `pg_cron` y gasto, al responsable |

## Dependencias nuevas

Ninguna librería. `pg_cron` es un módulo de la plataforma ya elegida; no se usa hasta T-P2 (fuente: supabase.com/docs/guides/cron, 19/11/2026; versión sin comprobar).

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Disparador genérico traducido al mostrar | Una operación técnica no dice qué acción fue (REQ-003, REQ-018) |
| Tipo enumerado | No se revierte (DD-01) |
| Desplazamiento sin corte | Repite u omite (REQ-008) |
| Cursor sin números de página | Sin posición ni salto; plan B de T-P3 |
| Corte por instantánea de transacciones | Una transacción ajena larga escondería acciones ya hechas (REQ-014) |
| Cadena de huellas | Columna fuera de REQ-029; sin copia externa no protege del propietario |

## Decisiones que requieren ADR

Se propone **ADR-0007 «Auditoría de acciones del dominio»** (número a confirmar): catálogo cerrado; inserción solo por auxiliares llamadas por la función de cada acción en su transacción; número tras cerrojo; fin del disparador genérico. Es frontera porque obliga a toda función que escribe, de la fase 2 a la 6.

## Qué se pide a otras fases y a coordinación

1. Fase 2 (010): D-1 a D-10; el conector anota H-01 a H-04; su requisito 17, a la fila principal y vinculadas (cuestión 5, ya respondida).
2. 021, 022, 023 y 025: anotar con las auxiliares y los «Códigos», como último paso; la 022, `listarClientes` con clientes de baja.
3. 020: `formatoFechaHoraSegundos` y su excepción en `docs/DISENO.md`; `Tabla` con un `tbody` por grupo.
4. 025: historial con `presentacion.ts` y esta lectura filtrada por cliente e I-39 a I-41.
5. `docs/SEGURIDAD.md`: en A-11, catálogo cerrado y PRUEBA-012; rutas críticas de esta función.

## Asuntos abiertos para el responsable

| N.º | Asunto | Opciones | Recomendación |
| --- | --- | --- | --- |
| A-1 | **Enmienda de la 024** que piden la 021, la 022 y la 023 | (i) I-11 vinculable a I-03 e I-06; (ii) I-32: quitarla (la 021 no la escribe y CA-001 la exige) o definir cuándo ocurre; (iii) objeto de I-30 e I-31: la cuenta en vez del factor; (iv) I-42 «Levantó el bloqueo de acceso de otro administrador», I-43 «Levantó fuera del panel el bloqueo de acceso de un administrador» (responsable), I-44 «Se detectó un cambio de credenciales hecho fuera del panel» («Sistema»); (v) «Olvidar este navegador» y la anulación de una marca por 10 fallos, a «Lo que no es acción»; (vi) `periodo_desde` y `periodo_hasta` solo en I-18, mostrados en la acción; (vii) confirmar DD-20 | Todas sí; en (ii), quitar I-32 |
| A-2 | Nota del artículo 2 (heredado) | Aplicarla o no | Aplicarla; mientras, DD-22 |
| A-3 | Riesgo del propietario de la base de datos (AM-10) | (a) Declararlo hasta la fase 4; (b) copia externa de huellas | (a), en la lista de publicación |
| A-4 | H-05 depende de `pg_cron` | Usarlo si está en el plan; si exige gasto, decide el responsable | Según T-P2 |
| A-5 | Dónde correr pgTAP con varias conexiones | — | Heredado de la 022 y la 003 |
| A-6 | Entorno previo con volumen | — | Sin él, CA-016 no cierra |
| A-7 | 200 vinculadas por carga (DD-13) | Aceptar u otro tope | Aceptar |

## Lo que este diseño no ha podido comprobar

- Nada ejecutado: ni PGlite, ni pgTAP, ni interfaz.
- `pg_cron` en el plan de `Nido` y su versión (T-P2).
- Cerrojo, lista local de transacción y `current_setting('role')` con el agrupador de Supabase (T-P3).
- Rendimiento: estimación.
- Los diseños de la 021 a la 023 no tienen dictamen y la 025 no tiene diseño: los códigos de reglas son las columnas del modelo.
- Tamaño en bytes: el agente no tuvo terminal para `wc -c`; se estimó por recuento de longitudes de línea. Lo confirma `node scripts/comprobar-specs.mjs`.
