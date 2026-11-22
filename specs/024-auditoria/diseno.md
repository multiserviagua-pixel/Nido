# 024 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (vuelta 1: APTO CON CONDICIONES, `dictamen-diseno.md`; corregido el 22/11/2026; vuelta 2: APTO, `dictamen-diseno-2.md`, con MN-5 a MN-8 como condiciones de tarea) · Fecha: 19/11/2026; **puesto al día el 22/11/2026** con D-040, con lo que piden la 021, la 022, la 023 y la 025 y con las migraciones M04 a M10 de la 010 ya integradas

Estado: PLANIFICADA (P1 abierta por delegación D-036 el 22/11/2026 tras el APTO del `auditor-seguridad` en la vuelta 2 y la revisión del `revisor` corregida)

Especificación APROBADA el 13/11/2026 (con su enmienda); **su enmienda E-1 está pedida** (`propuestas.md`, P24-01) y nada de lo que depende de ella se implementa antes de aprobarla (art. 5). Ruta crítica «RLS y migraciones». **Ninguna prueba citada se ha ejecutado.** La base de datos se describe desde `supabase/migrations/` (M04 `20261120000400_auditoria.sql`, M05, M06, M07 y M10, leídos el 22/11/2026), `supabase/seed.sql`, `supabase/procedimientos/administradores.sql` y los apartados «Auditoría» y «Datos» de la 021, la 022, la 023 y la 025. Decisiones por delegación: DD-NN (D-036). Orden, tareas y puertas: `plan.md` y `tareas.md`.

## Resumen

La auditoría pasa de un disparador genérico de operaciones técnicas a **un registro de acciones del dominio**, regido por un catálogo cerrado en la base de datos (con E-1: 43 entradas de acción, una de ellas con 12 códigos, y 5 hechos sin persona; 59 códigos). **Ningún rol de la aplicación puede insertar, modificar, borrar ni vaciar `auditoria`.** Escriben las filas dos funciones auxiliares sin permiso de ejecución para nadie, llamadas por la función de cada acción en su transacción, después de su último cerrojo de fila. Un disparador valida contra el catálogo y contra el contexto de la petición, pone el momento y asigna el número **tras un cerrojo**, de modo que su orden es el de confirmación, y mantiene una lista de principales de la transacción que nadie más puede escribir.

El disparador genérico **no se retira: pasa a ser una barrera**. `privado.auditar()` y `privado.registrar_auditoria()` dejan de escribir y rechazan; los disparadores `*_auditar` de M04 a M06 siguen en sus tablas. Así no hay ninguna ventana sin auditoría entre migraciones (P23-17): una escritura directa de un rol de la aplicación se rechaza, y las funciones del dueño, que anotan su acción, no la activan.

La página «Auditoría» **solo lee**, con la sesión del administrador: la página de grupos (principal con sus vinculadas), las descripciones legibles y la lista de actores. Pagina por acciones sobre un **corte** (número de fila más alto en la primera carga), que se renueva al volver a la página 1 o al recargar.

## Puesta al día del 22/11/2026

Manda sobre la versión del 19/11 donde difiera. Asuntos de entonces: A-1 pasa a la enmienda E-1; A-2, resuelto por D-040 (DD-34); A-3, ficha F-1 del responsable; A-4, T-P2 y ficha F-2 condicionada; A-5, resuelto por D-040 (pgTAP con varias conexiones en CI); A-6, dependencia del plan; A-7, decidido (DD-13).

| De dónde | Qué cambia | Apartado |
| --- | --- | --- |
| D-040 (baja definitiva; nota del art. 2) | Sale I-04; I-11 e I-12 vinculables a I-03; identificadores en la dirección | «Catálogo», «Dirección», E-1 |
| 022 P-49, P-53 (a, b, c), N-4 | `principal_de_esta_transaccion()` con lista en `privado`; regla de anotar reformulada; orden cliente → licencia | D-3, D-4, «Reglas para las funciones que anotan» |
| 021 «Auditoría» (a) a (d), A-4 | I-42 a I-45 (I-45 con 12 motivos); sin I-32 | «Catálogo», E-1 |
| 023 P23-09 (a a e), n-1 | Periodo en I-18; principal desde disparador diferido; guarda; `search_path` | D-1, D-4, D-12, «Catálogo» |
| 023 P23-17 y dictamen 2 de la 023 | Barrera en lugar de retirar disparadores | D-5, D-11, AM-12 |
| 025 (diseño, «Qué se pide», 3) | Códigos de reglas confirmados, orden del catálogo, índice parcial, historial sin segundos | D-1, D-7, «Hora» |
| M04 a M10 reales | La tabla existe: se altera en su sitio, vacía; nombres reales de política y disparadores | D-1, D-5, D-11 |

## Respuesta al dictamen (vuelta 1)

Solo cambian los apartados de la tabla. Decisiones: DD-38 a DD-43.

| Hallazgo | Corrección | Apartados |
| --- | --- | --- |
| MA-1 (guarda con cinco roles fijos, sin `TRUNCATE`) | D-12 recorre `pg_roles` y PUBLIC; mira `TRUNCATE` | D-12; DD-38; PRUEBA-033; T-009 |
| MA-2 (dueño directo en `administradores` sin fila) | En `propietario_directo`, `administradores` exige principal previa de origen `responsable_fuera_del_panel` sobre ese `usuario_id`; `delete`, siempre rechazado; `seed.sql` anota con las auxiliares | H-3, D-11, AM-10; DD-39; PRUEBA-032; T-009; P24-02, P24-10 (g); F-1 |
| MN-1 (matriz origen × contexto) | Columna `contextos` por entrada en el catálogo | D-2, D-3 (5), AM-14; DD-40; PRUEBA-035; T-009, T-013; P24-10 (h) |
| MN-2 (cerrojo de la clave ajena de `actor`) | `for key share` del actor antes del cerrojo global; R-2 prohíbe `for update` en `administradores` | D-3 (0), R-2, AM-11; DD-41; PRUEBA-013, 018; T-009, T-013, T-014; P24-10 (i) |
| MN-3 (`Nido` con filas antes de M24-1) | Nada en `Nido` entre M10 y M24-1; recuento de `auditoria` = 0 como evidencia | DD-42; `plan.md`; T-005 (b); P24-16 |
| MN-4 (cerrojo retenido por transacción inactiva) | `idle_in_transaction_session_timeout` y `lock_timeout` por rol | AM-11, T-P3; DD-43; PRUEBA-013; T-004, T-009; P24-17 |

## Dictamen vuelta 2

`dictamen-diseno-2.md`: APTO, 0 bloqueantes, 0 mayores. Los cuatro menores son condiciones de tarea; no cambia nada fuera de estos apartados.

| Hallazgo | Corrección | Apartados |
| --- | --- | --- |
| MN-5 (`pg_write_all_data` hace fallar siempre D-12) | Excluir roles predefinidos (`oid < 16384`); fallar si un rol que no sea el dueño ni superusuario es miembro de `pg_write_all_data` o del dueño | D-12; PRUEBA-033; T-004 (b), T-009 |
| MN-6 (`40P01` del dueño directo) | Fila de `administradores` en `for no key update`, luego anotar, luego actualizar; nunca una columna única | D-11; PRUEBA-013; T-014 (c); P24-10 (g) |
| MN-7 (principal del dueño no atada a la operación) | I-19 solo justifica `insert`; I-43, solo `update` de las columnas de bloqueo de la 021 | D-11; PRUEBA-032; T-009, T-014 (c); P24-10 (g) |
| MN-8 (entradas sin contexto) | `contextos` vacío = «no admite nada» hasta P24-10 (h), declarado por entrada; I-27 e I-35 con `{api_autenticada, servicio_identidad}` | D-2; PRUEBA-035; T-009; P24-10 (h) |
| Anotación de MA-2 (cascada desde `auth.users`) | Borrar en `auth` a un administrador queda rechazado: falla cerrado | D-11; P24-10 (g) |

## Revisión del revisor (22/11/2026)

Un mayor y cinco menores; solo cambian estos apartados.

| Hallazgo | Corrección | Apartados |
| --- | --- | --- |
| MA-R1 (`revoke … acceso` en M24-1: el rol aún no existe) | D-4 y D-5 sin `acceso` ni el rol del servicio de identidad; la 021 los crea sin ningún permiso sobre `auditoria`, catálogo, lista local ni funciones auxiliares; comprobado tras su migración | D-4, D-5; PRUEBA-012, 031, 033; T-013 (b), T-014 (c); P24-10 (j) |
| Menor 1 (DD-38 a DD-40 desfasadas) | DD-38 con el texto de D-12 (MN-5); MN-7 en DD-39; MN-8 en DD-40 | DD-38, DD-39, DD-40 |
| Menor 2 (nota del art. 6) | Vuelta 2 APTO y P1 por D-036 | «Comprobación de la constitución», art. 6 |
| Menor 3 (juegos de T-012 frente a `contextos` vacíos) | Juegos de CA-001 y CA-010 parciales hasta P24-10 (e) y (h), sin bloquear T-012 (D-036) | D-10; T-012 |
| Menor 4 (`role` = `conector`, `acceso` o servicio de identidad) | Su contexto solo si `session_user` no es `authenticator` ni un rol de la API; si no, `otro` | `contexto_peticion()`; T-P3; T-004 (b) |
| Menor 5 (cabecera de T-001) | CA-003, CA-005 y CA-029 añadidos | T-001 |

## Hechos de partida

Leídos en el repositorio el 22/11/2026 salvo H-7 (documentación oficial; es un dato, art. 7).

| N.º | Hecho | Consecuencia |
| --- | --- | --- |
| H-1 | M04: `public.auditoria` (`id` identidad, `objeto_id text`, `ocurrido_en default now()`), solo inserción y sin vaciado (`enable always`), `registrar_auditoria()`, `auditar()` y nueve `*_auditar` cuando `current_user <> 'postgres'`, más `administradores_auditar` siempre. M05: `versiones_prompt_auditar` (siempre) y `publicaciones_auditar`; M06: `alertas_auditar` | D-1, D-5, D-11 |
| H-2 | M07: `select` de `auditoria` para `authenticated` con `auditoria_select_admin`; escritura directa de `authenticated` en once tablas auditadas y de `service_role` en `versiones_prompt`; `al_dar_de_baja()` llama a `registrar_auditoria()` | D-11 cierra esas vías sin esperar a sus dueñas |
| H-3 | `seed.sql` inserta como dueño en `administradores` y `versiones_prompt`; `procedimientos/administradores.sql` comprueba la fila del disparador | D-11: en `administradores`, el dueño directo solo escribe con su principal anotada antes, y `seed.sql` pasa a anotar I-19 con las auxiliares (P24-02); en `versiones_prompt` pasa sin fila (F-1); el procedimiento de la 010 falla cerrado (P24-10 d) |
| H-4 | 022: O-3 y O-7 anotan la principal antes del cambio, con las filas ya bloqueadas; D-4b busca la I-03 de esta transacción | D-3, D-4, DD-27 |
| H-5 | 023: anota la última; disparador diferido `security definer` con `principal_de_esta_transaccion()` | D-4 |
| H-6 | 021: `invitaciones_administrador`, `factores_administrador`, `administradores.correo` y `estado`; rol `acceso`; disparador de cambios directos; (d) con 12 motivos | «Catálogo», D-3 (5), «Objeto» |
| H-7 | supabase.com/docs/guides/cron (22/11/2026): `pg_cron`; recomienda ≤ 8 trabajos a la vez y < 10 minutos; no dice plan, versión ni rol | T-P2; ficha F-2 |
| H-8 | V-108 y V-112 en VERIFICAR; sin Docker; `bd.yml` sin primera ejecución; sin entorno previo | «Construcción en etapas» |

## Supuestos y dependencias

| De quién | Qué necesita la 024 |
| --- | --- |
| Especificador | E-1 aprobada (P0 delegada, D-036) antes de T-009 |
| 010 | P24-02 (M24-1 altera M04 y sus pruebas) y P24-03 (el conector anota H-01 a H-04) |
| 021 | `es_admin()`, guardias y `leerDelArea()`; tablas de H-6; nombres de roles; I-19 a I-31, I-33 a I-38 e I-42 a I-45; procedimiento de I-19 |
| 022 | Columnas de P-46; `listarClientes` con bajas; ficha; `fecha-madrid.ts`; `situacion_licencia()`; I-01 a I-03, I-05 a I-12, I-41 |
| 023 | I-13 a I-18; `FiltroCliente`; su T-P1 y T-P3 |
| 025 | I-39 e I-40 con `reglas` |
| 020 | Armazón, `Paginacion`, estados, `TextoDato`, `SelectorPeriodo`, `estado-direccion.ts`, `registrarFallo`, `diaDeMadrid`, menú |
| Fases 1 y 2 | `registro.ts` sin valores, `no-store`, denegados y fallos sueltos; conector con H-01 a H-04; `bd.yml` |

**Orden obligado.** La interfaz se construye con datos ficticios sin esperar a nadie. **M24-1 va justo después de M10 y antes que cualquier migración de la 021 a la 025** (DD-37). Nada se conecta a la base de datos antes de M24-1 y M24-2. CA-001 a CA-005 piden todas las acciones de la 021, 022, 023 y 025: esta función se verifica la última de la fase.

### Construcción en etapas

| Etapa | Hace falta | Se construye | Se prueba |
| --- | --- | --- | --- |
| A | App de la 002, componentes de la 020 | `src/lib/auditoria/` salvo `fuente-bd.ts`; `src/components/auditoria/`; página con fuente ficticia en la muestra | PRUEBA-001 (app), 002 a 008. No cierra criterios de base de datos |
| A' | PGlite | Borrador de M24-1 | Evidencia provisional; no cierra nada |
| B | M24-1 a M24-3 en CI; 021 a 023 y 025 implementadas; T-P1 a T-P4 | `fuente-bd.ts`, `acciones.ts`, página real | PRUEBA-009 a 023, 025 a 035 |
| C | Conector de la fase 2 | — | PRUEBA-011 y 025 para H-01 a H-04 |
| D | Entorno previo con volumen | — | PRUEBA-024 |

## Piezas y responsabilidades

| Ruta | Qué hace |
| --- | --- |
| `src/app/admin/auditoria/page.tsx` | Servidor. `exigirAdministrador()` primero; filtros, orden y página por `estado-direccion.ts`; primera carga con corte nuevo; dinámica y `no-store` |
| `src/app/admin/auditoria/acciones.ts` | Cuatro acciones de solo lectura: `leerAuditoria`, `describirAuditoria`, `leerGrupoAuditoria`, `listarActoresAuditoria`. Cada una: `exigirAdministradorEnAccion()`, entrada validada por `entrada.ts` (campos de más: rechazo), `fuente-bd.ts`, resultado cerrado; un rechazo deja un código en el registro, sin valores |
| `src/lib/auditoria/catalogo.ts` | Las 48 entradas (59 códigos): código, entrada, texto visible, motivo visible (I-45), tipo, cliente. Espejo del catálogo de la base de datos |
| `src/lib/auditoria/entrada.ts`, `periodo.ts` | Esquema de entrada («Contratos»); periodo a días de Madrid con `fecha-madrid.ts` de la 022 |
| `src/lib/auditoria/fecha.ts` | `formatoFechaHoraSegundos` («12/11/2026, 10:31:07», Madrid) sobre el formato común de la 020; solo esta página (DD-35) |
| `src/lib/auditoria/presentacion.ts` | Único sitio que compone el texto de una fila (actor, objeto, referencia, cliente, marcas, reglas, periodo, motivo). La 025 lo reutiliza para el actor |
| `src/lib/auditoria/fuente-bd.ts` | Llama a las lecturas con `leerDelArea()`. Nunca importa `lib/supabase/admin.ts` |
| `tests/auditoria/fuente-ficticia.ts` | Guiones cerrados de la etapa A; no existe en el producto |
| `src/components/auditoria/` | `PaginaAuditoria`, `FiltrosAuditoria`, `FiltroActor`, `AvisoPeriodo`, `TablaAuditoria` (propia, un `tbody` por grupo, estilos de la 020; DD-35), `GrupoAuditoria`, `CeldaObjeto`; reutiliza `FiltroCliente` de la 023 y `Paginacion` de la 020 |
| `supabase/migrations/`, `supabase/reversiones/`, `supabase/tests/auditoria/` | M24-1 a M24-3, sus reversiones y su pgTAP (`ingeniero-bd`) |

**Columnas.** Fecha y hora (con segundos; única ordenable) · Actor · Acción (debajo, en I-39 e I-40 «Reglas cambiadas: …» por nombre visible; en I-18 «Periodo: 01/10/2026 a 31/10/2026»; en I-45 «Motivo: …») · Objeto (descripción, referencia si hace falta y enlace) · Cliente (cabecera «Cliente (nombre actual)»; «De baja»; «Cliente eliminado»). Un código desconocido se muestra «Acción no reconocida» y se registra `auditoria_accion_desconocida`.

**Grupos (REQ-057, DD-04).** Cada acción es un `tbody`. La principal va primero; las vinculadas debajo, sangradas, con «Detalle» visible y, para lector de pantalla, «detalle de: <acción principal>». Con filtro de acción o cliente, la principal se muestra siempre (marcada «Fuera del filtro» si no cumple), las vinculadas que no cumplen se ocultan y el grupo dice «y N detalles más fuera del filtro». Con más de 200 vinculadas se muestran 200 y «Ver los N detalles restantes» carga de 200 en 200 (DD-13).

**Objeto (REQ-004).** Atributos actuales no secretos:

- Con cliente (enlace a la ficha): «Cliente» y «Reglas del cliente» (el nombre va en su columna); «Licencia creada el 12/11/2026»; «Código generado el 12/11/2026 a las 10:31:07»; «Conexión de Claude, alta el 12/11/2026»; «Orden de pausa creada el 12/11/2026 a las 10:31:07».
- De administradores (enlace a Administradores): el correo y «dado de baja» si aplica; «Invitación a <correo> del 12/11/2026» (`invitaciones_administrador`); «Segundo factor de <correo>, registrado el 12/11/2026» (`factores_administrador`); «Códigos de recuperación de <correo>».

**Referencia breve (DD-12).** «Ref. » y los 8 primeros caracteres hexadecimales del UUID del objeto (aleatorio; no derivado de código, token ni secreto). Se añade si el objeto ya no existe («ya no existe») o si otro objeto del mismo tipo y dueño tiene la misma descripción; ante coincidencia de los 8, se alarga de 4 en 4. Lo calcula `describir_auditoria`.

**Actor (REQ-015 a REQ-017).** `persona`: correo y «dado de baja» si la cuenta lo está hoy (con referencia breve si dos cuentas compartieran correo). `responsable_fuera_del_panel`: «El responsable (fuera del panel)». `sistema`: «Sistema». `agente_cliente`: «Agente del cliente».

**Hora.** `formatoFechaHoraSegundos`, solo aquí. El historial de reglas de la 025 va sin segundos (su DD-06), como dice REQ-002 («solo en esta página»).

**Filtros.**

- Periodo: `SelectorPeriodo` con «Últimos 30 días» (por defecto), «Hoy», «Últimos 7 días», «Últimos 90 días», «Todo el historial» y «Personalizado» (fechas nativas «Desde» y «Hasta», incluidas). Junto a él, el periodo en palabras y fechas, y «Ver todo el historial» a la vista mientras no sea ese (REQ-059).
- Actor: lista nativa con «Todos», «Sistema», «Agente del cliente», «El responsable (fuera del panel)» si ha sido actor, y cada cuenta de administrador que ha sido actor. La búsqueda filtra en el navegador (≤ 500 opciones): el texto no sale de él.
- Acción: lista nativa de las 48 entradas, en dos grupos, «Acciones» y «Hechos sin persona». I-45 es una opción que abarca sus 12 códigos (DD-31).
- Cliente: `FiltroCliente` de la 023 (texto en el cuerpo de `listarClientes`, nunca registrado).
- «Quitar filtros»: últimos 30 días, sin más filtros, orden por defecto, página 1.
- Un filtro no válido no se aplica: mensaje junto a él, sin repetir el valor; los aplicados quedan a la vista.

**Dirección (DD-34).** `periodo` (`30d`, `hoy`, `7d`, `90d`, `todo`), `actor` (`sistema`, `agente_cliente`, `responsable` o UUID), `accion` (las 48 claves de entrada, `I-01` … `H-05`), `cliente` (UUID), `orden` (`reciente`, `antiguo`), `pagina` (1 a 100.000). Por la nota del art. 2 (D-040), el UUID de actor o de cliente solo elige qué se filtra; el permiso sale de la sesión y no hay nada que comprobar contra el cliente, porque todo administrador activo lee toda la auditoría (REQ-035). No van el corte, las fechas personalizadas (al recargar se vuelve a 30 días) ni lo buscado.

## Contratos

No cambia ningún archivo de `contratos/`. Formas que fija este diseño:

| Lectura | Entrada (cerrada) | Salida |
| --- | --- | --- |
| `leer_auditoria` | `desde`, `hasta` (día o nulo; 01/01/2026 ≤ desde ≤ hasta ≤ hoy en Madrid); `actor_origen` (4 valores o nulo); `actor` (UUID, solo con `persona`); `entrada` (48 o nulo); `cliente` (UUID o nulo); `orden`; `pagina` (1 a 100.000); `corte` (1 a 2⁵³−1, o nulo = nuevo) | `{corte, total_acciones, grupos: [{grupo, ocurrido_en, origen, actor, principal_cumple, vinculadas_total, vinculadas_fuera, filas: [{id, principal, accion, objeto_tipo, objeto_id, cliente_id, reglas, periodo_desde, periodo_hasta}]}]}`; ≤ 25 grupos, ≤ 200 vinculadas por grupo |
| `describir_auditoria` | `ids`: 1 a 5.100 números de fila | Por fila: correo y estado del actor; nombre y estado del cliente o `eliminado`; descripción del objeto o `no_existe`; referencia si hace falta. Nada para números que no son de auditoría |
| `leer_grupo_auditoria` | `grupo`, `corte`, filtros de entrada y cliente, `pagina` (1 a 1.000) | ≤ 200 vinculadas, misma forma |
| `actores_auditoria` | Ninguna | ≤ 500 `{usuario_id, correo, estado}` y `hay_responsable` |

Errores (lista cerrada, como `leerDelArea()`): `sin_sesion`, `sin_permiso`, `filtro_no_valido`, `fallo`; ninguno lleva el valor recibido ni datos internos. «No existe» y «no aplica» dan lo mismo: cero grupos.

## Datos

Ruta crítica. Tres migraciones nuevas, cada una un archivo que no se edita después de integrado, con `.claude/rules/bd.md`, skill `migracion-bd`, `search_path = pg_catalog, pg_temp` y todo calificado (D-035, P23-09 e), y su reversión en `supabase/reversiones/`:

- **M24-1** (justo tras M10): D-1 a D-5, D-7, D-11 y D-12.
- **M24-2** (tras `es_admin()` de la 021 y las columnas de P-46 de la 022): D-6.
- **M24-3** (tras T-P2 y `situacion_licencia()` de la 022): D-8.

| N.º | Sobre qué | Qué se hace |
| --- | --- | --- |
| D-1 | `public.auditoria`, **alterada en su sitio** (DD-25) | Guarda inicial: si tiene alguna fila, `auditoria_con_filas_antiguas` y nada cambia (ninguna fila se borra, REQ-062). Luego: `id` sin identidad (lo pone D-3 desde `privado.auditoria_numero`); `origen` (`persona`, `responsable_fuera_del_panel`, `sistema`, `agente_cliente`); `actor uuid` con clave ajena a `administradores(usuario_id)` **`on delete restrict`**, presente si y solo si `origen = 'persona'` (DD-07); `accion` con clave ajena a `privado.acciones_auditoria(codigo)` y `(accion, objeto_tipo)` compuesta; `objeto_tipo` (10: `cliente`, `licencia`, `codigo_activacion`, `conexion`, `orden`, `reglas_cliente`, `administrador`, `invitacion`, `segundo_factor`, `codigos_recuperacion`); `objeto_id uuid not null` (sustituye al de texto); `cliente_id uuid` **sin clave ajena** (DD-08); `ocurrido_en timestamptz not null` sin valor por defecto; `fila_principal_id` con clave ajena a `auditoria(id)`; `grupo bigint not null`; `reglas text[]` solo en I-39 e I-40, no vacía, sin repetidos, dentro de los cinco códigos (`max_correos_por_revision`, `ventana_dias`, `guardar_adjuntos`, `preparar_borradores`, `descargar_facturas_por_enlace`) y **en el orden del catálogo** (025); `periodo_desde date` y `periodo_hasta date` solo en I-18, los dos o ninguno (E-1, DD-33). **Ninguna otra columna ni texto libre.** Se conservan RLS, `auditoria_solo_insercion`, `auditoria_sin_vaciado` (`enable always`), el `select` de M07 y `auditoria_select_admin` |
| D-2 | `privado.acciones_auditoria` | `codigo` (clave, `^[a-z_]{3,40}$`), `entrada` (`I-01` … `H-05`), `objeto_tipo`, `con_cliente`, `puede_principal`, `vinculable_a` (códigos de principales), `origenes`, `contextos` (lista cerrada de valores de `contexto_peticion()`, sin repetidos; MN-1, DD-40; **vacía significa «no admite nada»**, MN-8), `lleva_reglas`, `lleva_periodo`, `orden_reglas`. `contextos`: I-27 e I-35, exactamente `{api_autenticada, servicio_identidad}` (MN-8); `servicio_identidad` además solo en I-44 y `marca_anulacion_cambio_directo`; `acceso` solo en las entradas que la 021 asigne a sus C-n (P24-10 h; hasta entonces, en ninguna); `conector` solo en H-01 a H-04; `propietario_directo` solo en I-19, I-31, I-43 y H-05 (este, según el contexto que dé T-P2); **vacía, hasta P24-10 (h)** (MN-8): I-33, `marca_anulacion_renovacion` y `marca_anulacion_limite` (vinculadas solo a I-33), I-37, I-38 y `marca_anulacion_intentos`; `api_autenticada` en las demás con `persona`. 59 filas de «Catálogo», fijadas por migración; cambian solo con una especificación aprobada. RLS activada; `select` para `authenticated` con política `es_admin()` (lo leen las lecturas de D-6); nada más para nadie |
| D-3 | Disparador `before insert` por fila sobre `auditoria` (`enable always`) | (0) Si la fila trae `actor` (principal con `persona`), `for key share` de su fila de `administradores` **antes** del cerrojo global, para que la clave ajena no espere con él tomado (MN-2, DD-41); las vinculadas heredan un actor que esta transacción ya tiene así; (1) `pg_advisory_xact_lock` con clave fija; (2) `id := nextval(privado.auditoria_numero)`; (3) principal: `ocurrido_en := clock_timestamp()`, `grupo := id`, y anota `(pg_current_xact_id(), id, accion, objeto_id)` en `privado.auditoria_transaccion`, tras borrar las filas de otras transacciones (con el cerrojo tomado ya han terminado todas); vinculada: su principal está en esa lista con la transacción actual, no tiene principal propia y su acción está en `vinculable_a`; copia `origen`, `actor` y `ocurrido_en`; `grupo := fila_principal_id`; (4) catálogo: tipo, cliente si y solo si `con_cliente`, origen admitido, `reglas` si y solo si `lleva_reglas`, periodo si y solo si `lleva_periodo` (desde ≤ hasta ≤ día de Madrid de `ocurrido_en`); (5) origen frente a `privado.contexto_peticion()` (DD-29): `persona` en `api_autenticada` (actor = `auth.uid()`), `acceso` o `servicio_identidad` (actor dado, administrador existente); `responsable_fuera_del_panel` solo en `propietario_directo`; `sistema` en `acceso`, `conector`, `servicio_identidad` o `propietario_directo`; `agente_cliente` solo en `conector`; `api_anonima`, `api_servicio` y `otro`, nunca; **y además** el contexto está en `contextos` de la entrada (MN-1: `persona` desde `acceso` o `servicio_identidad` solo en las entradas de su lista). Fallo: excepción con código fijo y se deshace la transacción. REQ-015, 019, 026, 027, 043, 054 |
| D-4 | Auxiliares del dueño: `privado.anotar_auditoria(accion, objeto_id, origen, actor default null, reglas default null, periodo_desde default null, periodo_hasta default null)`, `privado.anotar_auditoria_vinculada(principal, accion, objeto_id)` (devuelven el número) y `privado.principal_de_esta_transaccion(accion, objeto_id)` (P-53 a) | `security definer`; `execute` revocado a `public`, `anon`, `authenticated`, `service_role` y `conector` (los de M01 y Supabase; `acceso` y el rol del servicio de identidad no existen aún en M24-1, los crea después la 021 sin ningún permiso sobre esto: P24-10 (j), MA-R1): solo las llaman funciones y disparadores del dueño, también un disparador de restricción diferido (P23-09 c). **Derivan `cliente_id` del objeto** (licencia, orden: su cliente; reglas y cliente: el propio; código y conexión: el de su licencia; tipos de administradores: nulo); objeto con cliente inexistente: excepción. Con `persona` y `auth.uid()` presente, el actor es la sesión: un actor dado distinto, excepción. No reciben cliente, momento, grupo ni número. `principal_de_esta_transaccion` devuelve el número de la principal de esa acción y ese objeto anotada **en esta transacción** si existe en la lista **y** en `public.auditoria` sin `fila_principal_id` (N-4); ninguna: nulo; más de una: `auditoria_principal_repetida`. La 023 lee sus vinculadas por `fila_principal_id` como dueña (índice D-7). REQ-018, 023, 054 |
| D-5 | Permisos | `revoke all` sobre `auditoria`, `privado.auditoria_numero`, `privado.acciones_auditoria` y `privado.auditoria_transaccion` a `public`, `anon`, `authenticated`, `service_role` y `conector` (sin `acceso` ni el rol del servicio de identidad, que aún no existen: `revoke` a un rol inexistente falla con «role does not exist»; la 021 los crea sin ningún permiso sobre estas tablas ni sobre las funciones de D-4, D-6 o `contexto_peticion()`, P24-10 (j), y PRUEBA-012 y PRUEBA-033 lo comprueban tras su migración, T-013 (b) y T-014 (c); MA-R1); luego solo `select` en `auditoria` y el catálogo para `authenticated` (RLS con `es_admin()`). `privado.auditoria_transaccion`: RLS activada, sin concesiones; la sesión no la puede sembrar (N-4). Ninguna función salvo las auxiliares contiene `insert into public.auditoria` (comprobación estática de PRUEBA-012). REQ-024 a 026, 042 |
| D-6 | Lecturas `privado.leer_auditoria`, `leer_grupo_auditoria`, `actores_auditoria` (`security invoker`) y `describir_auditoria` (`security definer`, DD-30) | Primera instrucción `es_admin()` (si no: `sin_permiso`, cero filas); entradas acotadas; sin SQL construido con texto; `execute` solo para `authenticated`; expuestas como fije REQ-010 de la 010 (T-P1). `describir_auditoria` lee solo las columnas de «Objeto», nunca `codigo_hmac` ni secretos. El tiempo máximo lo da el ajuste de rol de la 022 (P-47); una cláusula `set statement_timeout` en la función no limita la sentencia que la llama (sin comprobar; T-P3). REQ-031 a 035, 048, 049 |
| D-7 | Índices | `(ocurrido_en, grupo)`, `(actor, ocurrido_en)`, `(origen, ocurrido_en)`, `(accion, ocurrido_en)`, `(cliente_id, ocurrido_en)`, `(fila_principal_id)` y, para la 025, `(cliente_id, id desc) where accion in ('reglas_cambio', 'reglas_restablecimiento')`. Sustituyen a `auditoria_por_cliente`. REQ-013 |
| D-8 | H-05 | `privado.anotar_caducidades()` cada 5 minutos, con el programador que fije T-P2 (DD-36): por cada licencia `caducada` según `privado.situacion_licencia` (022) sin H-05 posterior a su último I-09, un H-05 de origen `sistema`. No cambia la licencia. Corre como dueño sin más permisos. REQ-058 |
| D-9 | Lo que no puede existir | Función, tarea o política que borre, actualice o vacíe `auditoria`, o que la devuelva como archivo. REQ-061, 062 |
| D-10 | Datos ficticios | Juegos de CA-001, CA-010, CA-012, CA-013 y CA-028 (los de CA-001 y CA-010, **parciales** hasta P24-10 (e) y (h): sin las entradas de `contextos` vacío ni las que solo admiten `acceso` o `servicio_identidad`, que D-3 (5) rechaza; se completan cuando la 021 responda); volumen de referencia (500.000 filas, 1.000 clientes, 30 actores con 10 de baja, grupos de 1 a 60 filas) por guion, solo en desarrollo y entorno previo, escritos con las auxiliares |
| D-11 | **Barrera** (DD-23) | `create or replace` de `privado.auditar()`: si `contexto_peticion() <> 'propietario_directo'`, `escritura_sin_accion_auditada`. En `propietario_directo` (migraciones, `seed.sql`, la persona con `psql` o el editor de Supabase; AM-10): en toda tabla salvo `administradores`, no hace nada; **en `administradores` (MA-2, DD-39)**, `insert` y `update` dan `escritura_sin_accion_auditada` salvo que la lista local de D-3 tenga, de esta transacción y anotada antes, una principal (presente en `public.auditoria` sin `fila_principal_id`, como en D-4) de origen `responsable_fuera_del_panel` y `objeto_tipo` `administrador` cuyo `objeto_id` sea el `usuario_id` de la fila (en `update`, el antiguo y el nuevo, que han de coincidir). **La principal se ata a la operación (MN-7):** I-19 solo justifica un `insert`; I-43, solo un `update` que cambie únicamente las columnas de bloqueo que fije la 021 (mientras no existan, ninguno); otra combinación, rechazo. `delete`, siempre rechazado (no hay entrada); como `administradores.usuario_id` tiene `on delete cascade` desde `auth.users`, borrar en `auth` a un administrador también queda rechazado (falla cerrado, coherente con `on delete restrict` de `actor`; P24-10 g). **Orden del dueño directo en `update` (MN-6):** primero `select … for no key update` de la fila, luego anotar, luego actualizar; nunca cambia una columna con índice único. `seed.sql` anota su I-19 con las auxiliares antes de cada alta (como D-10; P24-02). Si la 021 retira la barrera de `administradores` (P24-10 c), conserva esta regla del dueño directo (P24-10 g). `privado.registrar_auditoria()`: siempre `escritura_sin_accion_auditada`. Todos los `*_auditar` de H-1 se quedan. Efecto: toda escritura directa de un rol de la aplicación en esas tablas se rechaza; las funciones del dueño no activan los disparadores condicionados, y en `administradores` y `versiones_prompt` (incondicionados) quedan rechazadas desde la API hasta que su función dueña retire la barrera con D-12 (P24-09, P24-10 c). `al_dar_de_baja()` de M07 falla cerrado hasta D-4b de la 022 |
| D-12 | Guarda `privado.sin_escritura_directa(tabla regclass)` (n-1 del dictamen 2 de la 023) | Recorre **todo `pg_roles`** (MA-1, DD-38), salvo el dueño de la tabla, los superusuarios y los roles predefinidos (`oid < 16384`, como `pg_write_all_data`; MN-5), **más PUBLIC**, y falla con `escritura_directa_abierta` si alguno tiene `has_table_privilege(rol, tabla, 'INSERT, UPDATE, DELETE, TRUNCATE')` o `has_any_column_privilege(rol, tabla, 'INSERT, UPDATE')`, **o si algún rol que no sea el dueño ni superusuario es miembro (`MEMBER`) de `pg_write_all_data` o del dueño** (MN-5; sustituye en DD-38 a excluir a los miembros del dueño, que dejaba pasar el peor caso). Se mantiene n-1: `DELETE` y `TRUNCATE`, solo con `has_table_privilege`. Así vale para los roles que creen después la 021 (`acceso`, servicio de identidad) y cualquier otro. `TRUNCATE` no activa disparadores de fila: ni la barrera ni D-3 lo cubren, lo cubre que nadie lo tenga (esta guarda y PRUEBA-012). Sin `execute` para nadie. Toda migración que retire o cambie un `*_auditar` la llama antes, por tabla; si falla, no cambia nada |

**`privado.contexto_peticion()`** (DD-29): `stable`, sin `execute` salvo el dueño. Devuelve uno de `api_autenticada`, `api_anonima`, `api_servicio`, `conector`, `acceso`, `servicio_identidad`, `propietario_directo`, `otro`, a partir de `current_setting('role', true)` (`authenticated`, `anon` o `service_role` dan los tres `api_*`, también en pgTAP con `set role`) y, si es `none`, de `session_user` (rol del conector, `acceso`, servicio de identidad o dueño); ninguno de los dos cambia dentro de una `security definer` (a comprobar en T-P3). **Si `role` es `conector`, `acceso` o el rol del servicio de identidad** (M01 crea `conector` como `nologin`: se entra con un rol de conexión propio y `set role`), devuelve `conector`, `acceso` o `servicio_identidad` solo si `session_user` no es `authenticator` (el de PostgREST) ni `anon`, `authenticated` o `service_role`; si lo es, `otro` (por PostgREST esos roles no anotan nada; T-P3 comprueba además que `authenticator` no es miembro de ellos). La comparación es por nombre, así que no exige que `acceso` y el rol del servicio de identidad existan en M24-1. Los nombres de los roles de `acceso` y del servicio de identidad los fija la 021 (P24-10 e). Cualquier otro valor de `role` distinto de `none`, y cualquier `session_user` desconocido: `otro`, que no admite nada.

### Reglas para las funciones que anotan

021, 022, 023, 025, fase 2 y las que añadan entradas después:

- **R-1** Una principal por acción que surte efecto y ninguna si no cambia nada (REQ-020); vinculadas solo para objetos con entrada vinculable (DD-20); el actor sale de la sesión o de la credencial ya validada, nunca de la entrada.
- **R-2 (DD-27, sustituye a «anotar es el último paso»).** La primera fila de auditoría va **después del último cerrojo de fila y de toda espera** de la transacción. Tras ella solo se escriben filas ya bloqueadas y filas de auditoría, sin llamadas fuera de la base de datos. **Sobre `administradores` no se toma `for update`** (vale `for no key update`), ni se borra ni se cambia una columna con índice único, que también lo toman: chocaría con el `for key share` del actor de D-3 (0) en otra transacción (MN-2, DD-41). Así, O-3 y O-7 de la 022 (principal antes del cambio que la exige, sobre filas ya bloqueadas) cumplen sin excepción, y nadie espera un cerrojo de fila con el cerrojo de la 024 tomado (P-53 b y c).
- **R-3 (DD-28, N-2 de la 022).** Toda función que escriba en `clientes`, `licencias`, `codigos_activacion` o `conexiones` toma el cliente y luego la licencia antes de su primera fila de auditoría.
- **R-4.** Funciones `security definer` del dueño; nunca `execute` de las auxiliares para un rol de la aplicación. La barrera (D-11) rechaza cualquier escritura de una función `security invoker` en una tabla con `*_auditar`.

**Vuelta atrás (art. 11).** Las filas no se tocan nunca. M24-3 y M24-2 se revierten quitando sus funciones y el trabajo programado. M24-1 se revierte **solo con `auditoria` vacía** (desarrollo, CI): su reversión falla con `auditoria_con_filas` si hay filas, y si no, devuelve la forma y los cuerpos de M04. En producción, volver atrás es desplegar la app anterior y, si hace falta, quitar del catálogo una entrada sin filas. Se prueba en CI aplicando, revirtiendo y reaplicando con la suite en verde y comparando la huella de `auditoria`, y comprobando que con filas la reversión no cambia nada (PRUEBA-031).

### Catálogo

Texto, tipo y cliente: los de la especificación con E-1. Entre paréntesis, a qué principales se vincula. Origen `persona` salvo lo que se dice.

- **Cliente, licencias, códigos y conexiones (022):** I-01 `cliente_alta` · I-02 `cliente_edicion` · I-03 `cliente_baja` · I-04 retirada (número sin reutilizar) · I-05 `licencia_creacion` · I-06 `licencia_suspension` · I-07 `licencia_reactivacion` · I-08 `licencia_revocacion` · I-09 `licencia_caducidad` · I-10 `codigo_generacion` · I-11 `codigo_anulacion` (solo vinculada: I-10, I-08, I-06, I-03) · I-12 `conexion_revocacion` (principal, o vinculada a I-08 o I-03). `revocar_por_baja` no entra: es I-12 vinculada a I-03 (P-49 c).
- **Órdenes y exportación (023):** I-13 `orden_pausa_creacion` · I-14 `orden_reanudacion_creacion` · I-15 `orden_pausa_anulacion` · I-16 `orden_reanudacion_anulacion` · I-17 `orden_sustitucion` (solo vinculada: I-13, I-14) · I-18 `informes_exportacion` (con periodo).
- **Administradores y acceso (021):** I-19 `administrador_primero` (`responsable_fuera_del_panel`) · I-20 `invitacion_creacion` · I-21 `invitacion_aceptacion` · I-22 `administrador_reactivacion` (solo vinculada: I-21) · I-23 `invitacion_anulacion` · I-24 `administrador_baja` · I-25 `factor_registro` · I-26 `factor_sustitucion` · I-27 `factor_retirada` · I-28 `recuperacion_uso_codigo` (solo vinculada: I-33, I-25, I-26, I-27) · I-29 `recuperacion_regeneracion` · I-30 `factor_retirada_confirmada` · I-31 `factor_retirada_responsable` (`responsable_fuera_del_panel`) · I-32 retirada (la 021 no la escribe; A-4) · I-33 `sesion_inicio` · I-34 `sesiones_cierre_otras` · I-35 `contrasena_cambio` · I-36 `contrasena_restablecimiento` · I-37 `bloqueo_contrasena` (`sistema`) · I-38 `bloqueo_segundo_factor` (`sistema`) · I-42 `bloqueo_levantamiento` · I-43 `bloqueo_levantamiento_responsable` (`responsable_fuera_del_panel`) · I-44 `credenciales_cambio_externo` (`sistema`).
- **I-45 «Se anuló la marca de un navegador reconocido» (021, (d); DD-31):** un código por motivo, objeto la cuenta, sin cliente. Principales: `marca_anulacion_titular` (persona) y `marca_anulacion_intentos` (`sistema`). Solo vinculadas: `marca_anulacion_renovacion` y `marca_anulacion_limite` (I-33), `marca_anulacion_otras_sesiones` (I-34), `marca_anulacion_contrasena` (I-35), `marca_anulacion_restablecimiento` (I-36), `marca_anulacion_codigo_recuperacion` (la principal de su I-28: I-33, I-25, I-26 o I-27; DD-32), `marca_anulacion_factor` (I-25, I-26, I-27), `marca_anulacion_retirada` (I-30, I-31), `marca_anulacion_baja` (I-24), `marca_anulacion_cambio_directo` (I-27, I-35, I-44).
- **Reglas (025):** I-39 `reglas_cambio` · I-40 `reglas_restablecimiento` · I-41 `reglas_por_defecto` (solo vinculada: I-01).
- **Hechos sin persona:** H-01 `orden_entrega` y H-02 `orden_confirmacion` (`agente_cliente`) · H-03 `conexion_activacion` (`agente_cliente`) · H-04 `conexion_revocacion_reutilizacion` (`sistema`) · H-05 `licencia_caducada` (`sistema`).

Objeto de I-28, I-29 e I-42 a I-45: la cuenta; de I-39 a I-41: el cliente; de I-30 e I-31: el factor retirado. Las filas I-27 e I-35 que escriba el disparador de cambios directos de la 021 llevan `persona` con contexto `servicio_identidad` y como actor la cuenta que el servicio autenticó. Recuentos con E-1: 43 entradas de acción y 5 hechos (48); 38 pueden ser principal y 7 vinculadas (I-11, I-12, I-17, I-22, I-28, I-41 e I-45).

## Flujo

1. **Abrir.** Sin sesión: inicio de sesión. Un factor: paso del segundo factor. Usuario de cliente o sin rol: «Sin permiso», sin consultar. Administrador activo con sesión completa: `leer_auditoria` (30 días, corte nulo); la base de datos fija y devuelve el corte. Luego `describir_auditoria` con los números de la página.
2. **Cambiar de página:** mismo corte; la página sale de las filas con número ≤ corte. Como el número se asigna tras el cerrojo, que se suelta al confirmar, los números confirmados son siempre un prefijo: todo número ≤ corte ya era visible al fijarlo y lo nuevo no desplaza nada (REQ-008).
3. **Cambiar filtro u orden, ir a la página 1, «Quitar filtros» o recargar:** corte nuevo. `BloqueDatos` anuncia «N acciones».
4. **Un grupo entra** si alguna fila cumple entrada y cliente; actor y periodo son del grupo. Orden `(ocurrido_en, grupo)` en el sentido elegido (REQ-007, REQ-050).

| Si… | Entonces |
| --- | --- |
| La sesión deja de valer (REQ-056) | `sin_sesion` o `sin_permiso`: la tabla se vacía y se muestra inicio de sesión, segundo factor o «Sin permiso» |
| `leer_auditoria` falla, se corta o pasa de 30 s | Error con reintento y referencia; nunca vacío ni datos anteriores (REQ-053) |
| `describir_auditoria` falla | Datos parciales: «Actor no disponible», «Cliente no disponible», «Objeto no disponible» y «Reintentar nombres», que repite solo esa lectura |
| Filtro manipulado | `filtro_no_valido`, mensaje sin el valor; cero filas fuera del filtro |
| Página más allá de la última | Vacío con «Ir a la primera página» (REQ-049) |
| Falla la escritura de una fila en otra función | Excepción; la transacción entera se deshace; esa función no muestra éxito (REQ-019, 044, 045) |
| Una escritura directa llega a una tabla con barrera | `escritura_sin_accion_auditada`; nada cambia (D-11) |

## Amenazas de esta función

| N.º | Amenaza | Control | Prueba |
| --- | --- | --- | --- |
| AM-01 | Un administrador o su cuenta robada (A-11) borra o retoca su rastro | Solo inserción, sin vaciado, sin permisos de escritura; ninguna pantalla lo ofrece | 008, 009 |
| AM-02 | Filas falsas (otro actor, otra fecha, acción inventada, «Sistema» a mano) | Sin permiso de inserción; auxiliares sin ejecución; D-3 fija número y momento y valida catálogo, origen, contexto y actor | 010, 035 |
| AM-03 | Una función anota mal por un fallo | Catálogo por acción; cliente derivado del objeto; cada entrada probada dato a dato | 011, 015 |
| AM-04 | Una acción nueva sin entrada (REQ-021) | Matriz de operaciones contra funciones, permisos y disparadores; comprobación estática de inserciones | 012 |
| AM-05 | Secreto o dato de terceros en una fila | Columnas cerradas; referencia solo del UUID; `codigo_hmac` nunca se lee | 017, 029 |
| AM-06 | Usuario de cliente o sesión de un factor lee la auditoría | `es_admin()` en acción, función y política | 020 |
| AM-07 | Identificadores manipulados para ver otra cosa | Solo filtran; el permiso sale de la sesión (D-040); `describir_auditoria` solo acepta números de auditoría | 002, 020 |
| AM-08 | Lo buscado acaba en dirección, historial o registros | Búsqueda de actor local; la de cliente en el cuerpo; registros con códigos | 003 |
| AM-09 | Nombre con marcado; consultas pesadas; datos viejos | `TextoDato`; entradas acotadas, índices, tiempo máximo; `no-store` y corte nuevo al recargar | 004, 024, 023 |
| AM-10 | El propietario de la base de datos (fuera de la aplicación) desactiva disparadores o escribe como `propietario_directo` | D-11: en `administradores`, alta o cambio solo con su principal anotada antes y nunca baja (MA-2). Desactivar disparadores sigue siendo riesgo residual; `versiones_prompt` insertada por el dueño directo no deja fila. Credenciales solo de una persona; **ficha F-1 del responsable** | 032 |
| AM-11 | Cerrojo de la 024 retenido o bloqueo mutuo con cerrojos de fila | R-2 y R-3; `for key share` del actor antes del cerrojo (D-3 (0)); `idle_in_transaction_session_timeout` y `lock_timeout` por rol (DD-43, P24-17); un bloqueo mutuo aborta una acción entera; latencia medida | 013, 018 |
| AM-12 | Ventana sin auditoría entre migraciones (P23-17) | Barrera en vez de retirar disparadores; guarda D-12 para retirarla | 032, 033 |
| AM-13 | Lista local sembrada para fingir una principal (N-4) | Tabla de `privado` sin concesiones, clave `pg_current_xact_id()`, comprobación en `public.auditoria` | 034 |
| AM-14 | Una función mal escrita anota `sistema` o `responsable_fuera_del_panel` desde la API | Matriz origen × contexto y `contextos` por entrada (MN-1) en el disparador, no en la llamante | 035 |
| AM-15 | Una función antigua escribe filas con la forma de M04 | `registrar_auditoria()` y `auditar()` rechazan; catálogo con clave ajena | 032 |
| AM-16 | El trabajo de H-05 con más permisos de los necesarios | Corre como dueño solo `anotar_caducidades()`; T-P2 | 030 |

## Tareas previas

| Tarea | Qué comprueba | Regla |
| --- | --- | --- |
| T-P1 | Forma de exponer lecturas de la 010 (vale la evidencia de 022·T-004 punto 1 y 023·T-001) | Sin ella, no se pasa de la etapa A |
| T-P2 | En `Nido`: `pg_cron` disponible en su plan, versión, rol con que corre un trabajo y que ejecuta `anotar_caducidades()` sin más permisos; si la 013 ya tiene programador, el mismo | Sí: D-8. Exige gasto: ficha F-2. No existe: al arquitecto; mientras, H-05 no se anota y CA-018 no cierra |
| T-P3 | Con dos conexiones y 1.000 acciones: orden de números = orden de confirmación; `privado.auditoria_transaccion` con el agrupador de Supabase, con subtransacciones revertidas y desde un disparador diferido; `contexto_peticion()` dentro de `security definer` y de disparador en los ocho contextos, con `role` igual a `conector`, `acceso` o el rol del servicio de identidad tras `set role` desde su rol de conexión (su contexto) y desde `authenticator` (`otro`), y que `authenticator` no es miembro de esos roles, y que `acceso` y el conector entran con rol de conexión propio (V-107), no por PostgREST con su rol en `role` (daría `otro`); si `set statement_timeout` en una función limita algo; que `idle_in_transaction_session_timeout` y `lock_timeout` por rol actúan con el agrupador y que, al cortar una transacción inactiva, el cerrojo global se suelta (MN-4) | Falla el orden: al arquitecto (plan B: cursor). Falla el contexto: se rehace D-3 (5). Fallan los tiempos: al arquitecto antes de T-009 |
| T-P4 | M04 a M10, `seed.sql`, el procedimiento y las pruebas de la 010 frente a «Datos»; `auditoria` vacía tras M10 en CI; versión mayor de PostgreSQL de CI y de `Nido` | Lo que no cuadre, al arquitecto antes de T-009 |

## Pruebas

Ninguna ejecutada. Las de base de datos corren en CI y no se anotan como superadas en local. Etapa entre corchetes.

| Prueba | Qué | Cierra |
| --- | --- | --- |
| 001 | Catálogo de la app = de la base de datos = especificación con E-1 (59 códigos, 48 textos); acción fuera de lista rechazada [A, B] | CA-002 (parte), CA-010 (parte) |
| 002 | 20 valores manipulados y campos de más; mismo mensaje; ningún valor en mensajes ni registros [A, B] | CA-014 |
| 003 | Dirección, historial y registros sin nombres, correos ni texto; usuario de cliente con la dirección cambiada [A, B] | CA-015 |
| 004 | Fuente ficticia: una fila por entrada, grupos, marcas, referencias, enlaces, 10 nombres con marcado, cinco estados [A] | CA-010, CA-011, CA-022 |
| 005 | Análisis automático y revisión con teclado y lector [A] | CA-023 |
| 006 | 320 píxeles con capturas [A] | CA-024 |
| 007 | Textos, segundos, enero y julio con otra zona en el dispositivo [A] | CA-025 |
| 008 | Estática: ningún control ni ruta de editar, borrar, ocultar, vaciar o exportar auditoría; nadie importa `admin.ts` [A, B] | CA-006, CA-030 (interfaz) |
| 009 | Modificar, borrar, borrar todo y vaciar con cada perfil; huella igual [B] | CA-006 |
| 010 | Filas falsas con cada perfil, también llamando a las auxiliares [B] | CA-007 |
| 011 | 38 principales con dos administradores y dos clientes; 7 vinculables con su causa; casos de CA-027 más baja (I-11 e I-12 bajo I-03) y suspensión (I-11 bajo I-06) [B, C] | CA-001, CA-027 |
| 012 | Matriz de operaciones: cada función ejecutable por un rol de la aplicación o por el responsable, cada permiso de escritura, cada disparador sobre el servicio de identidad, asignado a una entrada o a «no es acción»; cada escritura aceptada deja su principal; ninguna función salvo las auxiliares inserta en `auditoria`; ninguna toma `for update` sobre `administradores` ni la borra (R-2); ningún rol salvo el dueño tiene `TRUNCATE` en una tabla con `*_auditar`; tras las migraciones de la 021, `acceso` y el rol del servicio de identidad no tienen ningún permiso sobre `auditoria`, el catálogo, la lista local, la secuencia ni las funciones de D-4, D-6, D-12 y `contexto_peticion()` (MA-R1, P24-10 j) [B] | CA-002 |
| 013 | Fallo forzado de principal y de cada vinculada; conexión cortada en cada paso; sin esperas en `pg_locks` tras la primera fila; con dos conexiones, una con la fila del administrador en `for no key update` y otra anotando a su nombre con el cerrojo pedido, sin `40P01` (MN-2); con dos conexiones, el dueño directo en un `update` con I-43 (fila en `for no key update`, anotar, actualizar) y una función de la 021 con esa fila en `for no key update` esperando el cerrojo global, sin `40P01` (MN-6); una transacción inactiva tras anotar se corta en el plazo de `idle_in_transaction_session_timeout` y las demás siguen (MN-4) [B] | CA-003 |
| 014 | Rechazos, repeticiones y 20 dobles envíos [B] | CA-004 |
| 015 | Campos de más y lista de reglas falsa [B] | CA-005 |
| 016 | Bajas, reactivación, renombre; huella; bloqueo provocado desde otro origen [B] | CA-008, CA-033 |
| 017 | Marcadores y valores de reglas raros: 0 apariciones [B] | CA-009 |
| 018 | 1.000 acciones, 10 pares simultáneos, 50 grupos, 50 inserciones durante el recorrido; con dos conexiones, orden de números = orden de confirmación y ningún `40P01` con actores compartidos (MN-2) [B] | CA-012 |
| 019 | Filtros contra cálculo independiente, bordes y cambios de hora; simulacro A-11; periodo inicial [B] | CA-013, CA-026, CA-028 |
| 020 | Acceso por perfil (página y base de datos); sesión perdida con la página abierta; control positivo; usuarios de cliente invisibles [B] | CA-019, CA-032 |
| 021 | Integración sin la clave secreta; búsqueda estática de `admin.ts` [B] | CA-020 |
| 022 | Base de datos caída, con error y lenta; fallo de `describir_auditoria` [B] | CA-021 |
| 023 | 20 acciones, cada una seguida de carga [B] | CA-017 |
| 024 | 200 mediciones por operación con el volumen; 1.000.000 por página [D] | CA-016 |
| 025 | Activos, dos de baja, responsable, «Sistema», H-01 a H-05; 0 filas sin actor [B, C] | CA-018 |
| 026 | 50 consultas: 0 filas; una exportación: 1 fila I-18 con su periodo [B] | CA-029 |
| 027 | Recuento antes y después de todas las tareas programadas; revisión de procesos [B] | CA-030 |
| 028 | 20 denegados y 8 fallos sueltos: 0 filas; registros sin valores [B] | CA-031 |
| 029 | Skill `revision-privacidad` [B] | CA-009 |
| 030 | H-05 una vez por caducidad; sin repetir en 3 pasadas; otra tras quitar y volver a caducar; el trabajo no tiene más permisos [B] | CA-018 (parte) |
| 031 | Aplicar → revertir → aplicar M24-1 a M24-3, suite en verde, huella igual; M24-1 se aplica sobre M01 a M10 sin ningún rol de la 021 (MA-R1); con filas, revertir M24-1 no cambia nada; con una fila antigua, M24-1 tampoco [B] | CA-006, CA-030 (partes) |
| 032 | Barrera: cada escritura directa de M07 y la de `service_role` en `versiones_prompt` dan `escritura_sin_accion_auditada` y 0 cambios; el dueño directo, en las demás tablas, pasa sin fila (en `versiones_prompt` también, F-1); en `administradores`, como dueño directo: `insert` sin I-19 da rechazo y 0 filas cambiadas, también con una I-19 de otro `usuario_id`, de otra transacción o de un `savepoint` revertido; con un procedimiento de prueba que anota I-19 con la auxiliar y luego inserta (el de la 021 en T-014 c), 1 fila I-19; un `delete`, rechazo (MA-2); una I-43 seguida de un `insert` o de un `update` de otra columna, y una I-19 seguida de un `update`, rechazo y 0 filas cambiadas (MN-7); una `security invoker` de prueba, rechazada; `registrar_auditoria()` y `al_dar_de_baja()` fallan cerrado [B] | CA-002, CA-007 (partes) |
| 033 | Guarda D-12: con `insert` de una columna, `update` o `delete` concedidos a `authenticated`, con `update (estado)` a un rol de prueba creado después de M24-1 y con `truncate` a `authenticated`, una migración de prueba que retira un `*_auditar` falla sin cambiar nada (MA-1); sin concesiones se aplica, aunque `pg_write_all_data` exista; con un rol de prueba miembro de `pg_write_all_data` o del dueño, falla sin cambiar nada (MN-5); se repite tras las migraciones de la 021 con `acceso` y el rol del servicio de identidad ya creados, que no pueden tener permiso alguno sobre esas tablas (MA-R1, P24-10 j; T-014 c) [B] | CA-002 (parte) |
| 034 | Lista local: escribir en ella con cada perfil, rechazado; una fila sembrada por el dueño sin su auditoría no cuenta; otra transacción y un `savepoint` revertido dan nulo; desde un disparador diferido, la encuentra; con dos conexiones, nunca la de otra [B] | CA-003, CA-007 (partes) |
| 035 | Cada entrada con cada origen desde los ocho contextos: solo pasan las de su `contextos` con un origen admitido en ese contexto (D-3 (5)); `licencia_revocacion` con `persona` desde `acceso` o `servicio_identidad`, rechazada (MN-1); una entrada con `contextos` vacío (I-37 hasta P24-10 h), rechazada en los ocho contextos; I-27 e I-35 pasan desde `api_autenticada` y `servicio_identidad` y desde ningún otro (MN-8); persona con actor distinto de la sesión, rechazada [B] | CA-007, CA-018 (partes) |

## Valores que fija este diseño

25 acciones por página · páginas 1 a 100.000 · 200 vinculadas por respuesta · 5.100 números por descripción · 500 actores · referencia de 8 caracteres, ampliable de 4 en 4 · periodos `hoy`, `7d`, `30d`, `90d`, `todo` y personalizado desde el 01/01/2026 · 30 s en el navegador · H-05 cada 5 minutos (su momento llega hasta 5 minutos tarde).

**Rendimiento, sin medir.** Todo va por índice: 25 grupos, recuento de grupos en el periodo y, en la página 200, un salto de 4.975 grupos. Si PRUEBA-024 no da el umbral, vuelve al arquitecto (opción: recuentos diarios precalculados). El cerrojo global serializa las acciones auditadas (latencia, m-4 de la 023), medido en PRUEBA-018 y en PRUEBA-033 de la 023.

## Decisiones por delegación (D-036)

Con la opción de más seguridad y legibilidad; ninguna toca lo reservado a una persona. Revocables por el responsable; el orquestador las pasa a `aclaraciones.md` y la coordinación a `docs/TECNOLOGIAS.md`.

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
| DD-12 | Referencia de 8 caracteres solo cuando hace falta | Legible y distinguible |
| DD-13 | Más de 200 vinculadas, por partes (antes A-7) | Respuesta acotada sin partir el grupo |
| DD-14 | Fechas personalizadas fuera de la dirección | V-3; como DD-18 de la 023 |
| DD-15 | Búsqueda de actores local | El texto no sale del dispositivo |
| DD-16 | H-05 por tarea programada | La caducidad no es un acto y leer no anota (REQ-060) |
| DD-17 | Reglas como códigos de columna, en el orden del catálogo | Comprobable por restricción; lo pide la 025 |
| DD-18 | Reglas, periodo y motivo dentro de la celda de acción | Una columna menos a 320 píxeles |
| DD-19 | Diez tipos de objeto con código | Lista cerrada |
| DD-20 | Vinculadas solo con entrada vinculable; efectos sin entrada (sesiones) sin fila | Lectura de REQ-018 coherente con el inventario |
| DD-21 | Orden `(ocurrido_en, grupo)` | REQ-007 |
| DD-23 | Barrera: `auditar()` y `registrar_auditoria()` rechazan; los `*_auditar` se quedan | Cierra P23-17 sin ventana y sin depender del orden de las migraciones de otras funciones; sustituye a retirar los disparadores con guarda (P23-09 d) |
| DD-24 | Guarda D-12 obligatoria para retirar o cambiar un `*_auditar` | n-1; la barrera solo cae cuando ya no hay escritura directa |
| DD-25 | `auditoria` alterada en su sitio, con guarda de vacía; reversión de M24-1 solo vacía | Conserva tabla, política y disparadores de M04; nunca borra filas |
| DD-26 | Lista local en `privado.auditoria_transaccion` con `pg_current_xact_id()`, limpiada bajo el cerrojo | N-4; sirve con agrupador y subtransacciones (T-P3) |
| DD-27 | R-2: la primera fila tras el último cerrojo de fila | Mismo fin que «anotar es el último paso» (AM-11) sin excepción para la 022 |
| DD-28 | R-3: cliente y luego licencia antes de la primera fila | N-2 de la 022 como regla global |
| DD-29 | Origen frente a `contexto_peticion()` en el disparador | Una función mal escrita no puede anotar un origen falso |
| DD-30 | `describir_auditoria` `security definer`; las otras tres `security invoker` | Lee columnas concedidas y tablas de la 021 que la sesión no ve; las demás mantienen RLS como segunda capa |
| DD-31 | I-45: una entrada con un código por motivo; se filtra por entrada | Lo pide la 021 sin columnas nuevas; el filtro sigue siendo de 48 |
| DD-32 | La anulación por código de recuperación se vincula a la principal de su I-28 | Una vinculada no cuelga de otra |
| DD-33 | Periodo de I-18 en dos columnas `date`, solo en I-18 | REQ-074 de la 023; enteros acotados de fecha, sin dato personal (art. 1); pendiente de E-1 |
| DD-34 | Actor y cliente por UUID en la dirección | Nota del art. 2 (D-040); sustituye a DD-22 |
| DD-35 | `TablaAuditoria` y `fecha.ts` propios sobre la 020 | No se cambian componentes comunes por una sola página |
| DD-36 | H-05 con el programador de la 013 si existe; si no, `pg_cron` | Un solo programador |
| DD-37 | M24-1 justo tras M10; M24-2 y M24-3 después | La tabla nueva antes de que nadie anote |
| DD-38 | D-12 recorre `pg_roles` (salvo el dueño, los superusuarios y los roles predefinidos, `oid < 16384`) y PUBLIC, mira `TRUNCATE` y falla si un rol que no sea el dueño ni superusuario es `MEMBER` de `pg_write_all_data` o del dueño (MA-1 y MN-5, correcciones del auditor) | Vale para roles futuros como `acceso`; `TRUNCATE` no activa disparadores de fila; un miembro del dueño o de `pg_write_all_data` escribe sin concesión propia |
| DD-39 | En `propietario_directo`, `administradores` solo admite `insert` o `update` con principal previa de origen `responsable_fuera_del_panel` sobre ese `usuario_id`, atada a la operación (I-19 solo `insert`; I-43 solo `update` de las columnas de bloqueo de la 021), y rechaza `delete` (MA-2 y MN-7, correcciones del auditor) | Nadie se da superadmin sin rastro desde el editor de tablas; mantiene REQ-060 y CA-037 de la 010 |
| DD-40 | Columna `contextos` por entrada en `privado.acciones_auditoria` (MN-1); vacía significa «no admite nada», declarada por entrada hasta P24-10 (h) (MN-8) | Una función de la 021 mal escrita no anota una acción ajena a nombre de otro |
| DD-41 | `for key share` del actor antes del cerrojo global; R-2 prohíbe `for update` sobre `administradores` (MN-2) | Sin `40P01` por la clave ajena de `actor` |
| DD-42 | En `Nido`, nada entre M10 y M24-1; antes de M24-1, recuento de `auditoria` = 0 como evidencia (MN-3) | Una fila antigua bloquearía M24-1 para siempre, y ninguna se borra |
| DD-43 | `idle_in_transaction_session_timeout` y `lock_timeout` en el ajuste por rol de P-47 de la 022 para la API, el conector y `acceso` (MN-4, P24-17) | Una transacción inactiva no retiene el cerrojo global |

DD-11 y DD-22 de la versión anterior quedan sustituidas por DD-30 y DD-34.

## Cobertura de requisitos

| Requisitos | Dónde |
| --- | --- |
| REQ-001 a 006, 039 | «Piezas» |
| REQ-007, 008, 050, 057 | «Flujo»; D-3, D-7; DD-02 a 04 |
| REQ-009 a 012, 059 | «Piezas», filtros y dirección |
| REQ-013, 049 | D-6, D-7; «Valores» |
| REQ-014, 053, 056 | «Flujo» |
| REQ-015 a 017, 047, 058, 064, 066, 068 | D-1, D-3, D-8; «Catálogo»; DD-07, DD-29 |
| REQ-018 a 023, 043 a 045, 054, 055 | D-1 a D-4, D-11; reglas R-1 a R-4 |
| REQ-024 a 028, 042, 046 | D-1, D-3, D-5 |
| REQ-029 a 031 | D-1; «Contratos» |
| REQ-032 a 035, 040, 041 | D-5, D-6; `acciones.ts` |
| REQ-036 a 038 | «Piezas»; «Flujo» |
| REQ-048 | `entrada.ts`; «Contratos» |
| REQ-060 | D-6; I-18 de la 023 |
| REQ-061, 062, 067 | D-9; vuelta atrás |
| REQ-063, 065 | `acciones.ts` y funciones de la 021 a la 023, con `registro.ts` |

CA-001 a CA-033: «Pruebas».

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Solo códigos, UUID, momento, lista cerrada de reglas y dos días en I-18; correos y nombres se leen al mostrar, nunca se guardan |
| 2 Aislamiento | Cumple | Solo administradores leen; el cliente de la fila se deriva del objeto; los UUID de la dirección solo eligen (nota del art. 2, D-040) |
| 3 Cierre en fallo | Cumple | Fila no escrita deshace la acción; escritura directa sin acción rechazada (barrera), también del dueño directo en `administradores` sin su principal; guarda sobre todo rol y `TRUNCATE`; contexto desconocido o fuera de `contextos` no admite nada; transacción inactiva cortada; lectura fallida es error, no vacío |
| 4 Secretos | Cumple | Sin clave secreta; ningún secreto en filas ni referencias; `codigo_hmac` no se lee |
| 5 Especificación | Cumple, condicionado | Lo de E-1 (I-04 e I-32 fuera, I-42 a I-45, vínculos nuevos, periodo) no se implementa sin la enmienda aprobada: T-009 depende de T-001 |
| 6 Revisión independiente | Cumple | Dictamen vuelta 1 corregido; vuelta 2 APTO (`dictamen-diseno-2.md`); P1 abierta por delegación D-036 el 22/11/2026; revisión del `revisor` corregida (tabla «Revisión del revisor»); el arquitecto no aprueba |
| 7 Entradas no confiables | Cumple | Entradas cerradas; la documentación de `pg_cron` es dato |
| 8 Límites en el anfitrión | No aplica | No entrega nada al agente |
| 9 Prompt por despliegue | Cumple | La barrera mantiene cerrada la inserción en `versiones_prompt` desde la API hasta que la 015 anote sus filas; las versiones siguen inmutables. La del dueño directo no deja fila (F-1); no cambia inmutabilidad, huella ni publicación |
| 10 Producto final | Cumple | Cinco estados, accesibilidad, 320 píxeles, supervisión, rendimiento medido |
| 11 Reversibilidad | Cumple | Reversión probada de las tres migraciones; M24-1 solo vacía, nunca borra filas; en `Nido`, nada entre M10 y M24-1 (DD-42) |
| 12 Español | Cumple | Códigos, columnas y textos |
| 13 Evidencias honestas | Cumple | Nada ejecutado; lo que no cierra, declarado |
| 14 Cambios reservados | Cumple | Sin CI, secretos ni producción; aplicar en `Nido` y el posible gasto de `pg_cron`, a una persona (F-2); el riesgo residual, al responsable (F-1) |

## Dependencias nuevas

Ninguna librería. `pg_cron` es un módulo de la plataforma ya elegida; no se usa hasta T-P2 (fuente: supabase.com/docs/guides/cron, consultada el 22/11/2026; plan y versión sin comprobar).

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Disparador genérico traducido al mostrar | Una operación técnica no dice qué acción fue (REQ-003, REQ-018) |
| Retirar todos los `*_auditar` en M24-1 con guarda por tabla (P23-09 d) | La guarda fallaría mientras M07 conceda escritura directa en tablas de otras funciones y fases; la 024 quedaría esperando a todas, o abriría ventanas (P23-17) |
| Borrar y recrear `auditoria` | Pierde política, concesiones y disparadores de M04; no gana nada con la tabla vacía |
| Lista local en tabla temporal o variable de sesión | La sesión la puede sembrar; con el agrupador no es fiable (N-4) |
| Desplazamiento sin corte; cursor sin números | Repite u omite (REQ-008); sin posición ni salto (plan B de T-P3) |
| Corte por instantánea de transacciones | Una transacción larga escondería acciones ya hechas (REQ-014) |
| Cadena de huellas en la tabla | Fuera de REQ-029; sin copia externa no protege del propietario (F-1 b) |
| H-05 al consultar | Leer no anota (REQ-060) |

## Decisiones que requieren ADR

Se propone un ADR «Auditoría de acciones del dominio» (número lo asigna la coordinación; el 0007 está ocupado): catálogo cerrado; inserción solo por auxiliares del dueño, en la transacción de cada acción y tras sus cerrojos; número tras cerrojo; disparador genérico convertido en barrera y guarda para retirarla. Es frontera porque obliga a toda función que escribe, de la fase 2 a la 6. Borrador en T-006.

## Qué se pide a otras funciones y a coordinación

En `propuestas.md`, «Peticiones del diseño (22/11/2026)», P24-01 a P24-17, por destinatario. Nada está aplicado.

## Lo que este diseño no ha podido comprobar

- Nada ejecutado: ni PGlite, ni pgTAP, ni interfaz, ni el comprobador (sin terminal; tamaño estimado por recuento de líneas).
- `pg_cron` en el plan de `Nido`, su versión y su rol (T-P2).
- Cerrojo, lista local y `contexto_peticion()` con el agrupador de Supabase, dentro de `security definer` y en disparadores diferidos; efecto de `set statement_timeout` en una función (T-P3).
- Los nombres de los roles `acceso` y del servicio de identidad (021, T-P2 de la 021).
- Que ninguna migración anterior deje filas en `auditoria` antes de M24-1 (T-P4) y el estado real de `Nido` (T-005 b).
- Si las funciones de la 021 toman `for update` sobre `administradores` (P24-10 i) y si su disparador de cambios directos distingue I-27 e I-35 de I-44 (asunto de la 021).
- Cómo se suman las esperas del cerrojo global al `lock_timeout` (2 s en la 021): una acción que espere más se deshace entera (PRUEBA-018 y 024).
- Rendimiento: estimación.
- Los diseños de la 021 a la 023 están PLANIFICADOS; la 025 tiene diseño sin dictamen. Si cambian lo que aquí se supone, este diseño se revisa.
