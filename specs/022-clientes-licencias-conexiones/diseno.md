# 022 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (**pendiente**: este diseño no tiene dictamen todavía) · Fecha: 14/11/2026

Especificación: APROBADA el 13/11/2026 (puerta P0), con una enmienda del mismo día (reglas por defecto en el alta). Este diseño no cambia el estado de la función ni se aprueba a sí mismo: lo aprueba la puerta P1, con dictamen previo del `auditor-seguridad`, porque licencias y códigos son ruta crítica. **Ninguna prueba citada aquí se ha ejecutado**: el diseño dice qué prueba habrá, no que pasa. No existe código de aplicación ni ninguna migración; lo que se dice de la base de datos sale de `docs/MODELO-DATOS.sql` (referencia en PROPUESTA) y de los diseños de la 001, la 020 y la 021. Las decisiones que este diseño toma en nombre del responsable van marcadas «decidido por delegación (D-019)» y están reunidas en su apartado.

## Resumen

La lista y la ficha de clientes son pantallas del área de superadmin que **solo leen**. Todo cambio (las 11 acciones de la especificación) es **una función de la base de datos**, llamada por el servidor con la sesión del administrador, que en una sola transacción vuelve a comprobar el acceso (`privado.es_admin()`, de la 021), toma los cerrojos, valida la transición desde el estado real, aplica el cambio y escribe sus filas de auditoría. Si algo falla, no queda nada. La sesión de un administrador no tiene permiso para insertar, cambiar ni borrar filas de clientes, licencias, códigos ni conexiones: fuera de esas once funciones, la base de datos no admite ninguna escritura, y una segunda capa de disparadores impide deshacer lo que es definitivo (una revocación, una anulación, un uso) incluso a quien llegara con más privilegio.

El estado que ve el panel y el que recibe el agente salen de **una sola regla** en la base de datos. La licencia no guarda un estado: guarda hechos con fecha (revocada, suspendida a mano, suspendida por cobro, caducidad) y el estado se deriva de ellos. Así las dos causas de suspensión no se pisan y «Licencia caducada» aparece sola al llegar la fecha.

El código de activación lo sortea el servidor con el módulo de la fase 1, se guarda solo como HMAC y viaja al navegador **una vez**, en la respuesta de su generación. La base de datos no deja leer ni el HMAC. Un código nuevo solo anula al pendiente que el administrador tenía delante: con dos generaciones a la vez, la segunda se rechaza y enseña el estado actual, en lugar de crear un segundo código y dejar en pantalla uno ya anulado.

El acceso no se rediseña: es el de la 021 (guardia en cada punto de entrada, regla de acceso en cada consulta, origen comprobado en cada acción). La interfaz es la de la 020, con una pieza nueva: el diálogo de confirmación con nombre tecleado.

La implementación contra la base de datos real depende de la fase 2. Este diseño separa lo que se puede construir y probar antes (reglas de nombres y fechas, validadores, todas las vistas y diálogos sobre datos ficticios en la muestra de la 020) de lo que no, y dice qué criterios no se pueden cerrar hasta que existan las migraciones, un sitio donde ejecutar las pruebas de base de datos, el conector de la fase 2 y el entorno previo.

Quedan **ocho asuntos abiertos para el responsable**. Uno condiciona la puerta P1: la nota aclaratoria del artículo 2, que el responsable eligió el 12/11/2026, **no está aplicada en la constitución**, y sin ella la ficha de un cliente no puede llevar su identificador en la dirección (asunto A-1).

## Hechos de partida y lo que el diseño hace con cada uno

Leídos en el repositorio el 14/11/2026, salvo H-8, que es documentación oficial leída ese día. Ninguna prueba real.

| N.º | Hecho | Consecuencia en este diseño |
| --- | --- | --- |
| H-1 | `docs/CONSTITUCION.md` está en la versión 1.0 y su artículo 2 no tiene nota aclaratoria; en `docs/` no aparece esa expresión | REQ-074 depende de una enmienda sin aplicar. Las rutas con identificador de cliente quedan condicionadas (asunto A-1). La 020 dice lo mismo en su regla de direcciones |
| H-2 | La especificación de la 010 está en PROPUESTA y no tiene diseño. No hay migraciones | El apartado «Datos» es una petición a la fase 2, no una descripción de algo que exista |
| H-3 | El modelo de referencia concede a `authenticated` `insert` y `update` sobre `clientes` y `licencias`, `insert` sobre `codigos_activacion` y `update (revocada_en)` sobre `conexiones`, y audita con un disparador genérico que anota `insert`, `update` o `delete` | No sirve para REQ-034, REQ-057, REQ-060, REQ-061 ni REQ-076. Se pide cambiarlo (D-1 a D-9) |
| H-4 | El diseño de la 001 fija el código en 12 caracteres Crockford (60 bits), con **caducidad de 10 minutos**, y la pantalla de activación dice «Caduca a los 10 minutos». Tiene ya `anulado_en`, el módulo `src/lib/oauth/secretos.ts` y una orden de operación `generar_codigo` | La 022 aprobada dice 15 minutos: hay que cambiar el valor y el texto de la 001 (asunto A-5). La orden de operación es una segunda vía para crear códigos, sin auditoría de panel (asunto A-6) |
| H-5 | El diseño de la 021 está corregido tras su dictamen y pendiente de que el auditor lo confirme. Depende de V-107, V-108 y V-113, en VERIFICAR | Este diseño cita su contrato y no lo repite. Si la 021 cambia, se revisa |
| H-6 | La 020 no tiene un diálogo con campo de texto. Su `DialogoConfirmacion` recibe el objetivo como `{nombre, distintivo}` y pone el foco inicial en «Cancelar». El título y el `h1` no llevan datos (su asunto A-10) | Se añade una pieza al sistema de diseño (`DialogoConfirmacionTecleada`). La ficha se titula «Ficha de cliente»; el nombre va en el cuerpo |
| H-7 | El inventario de la 024 tiene I-01 a I-12 e I-41 para esta función. I-11 solo figura como vinculada a I-10 y a I-08 | REQ-069 y CA-025 exigen anular el código también al suspender a mano y al dar de baja: I-11 tiene que poder vincularse a I-06 y a I-03 (petición a la 024) |
| H-8 | Documentación de PostgreSQL 18: `lower()` convierte «según las reglas de la configuración regional de la base de datos»; `normalize()` solo funciona con codificación UTF8. La página de MDN sobre clases Unicode no nombra `Default_Ignorable_Code_Point` | La regla de nombres no puede darse por buena sin probarla en el proyecto real: tarea previa T-P1. Los caracteres rechazados se fijan con rangos escritos, no con una propiedad del motor |
| H-9 | No hay Docker, CI remoto (003 en PROPUESTA), entorno previo (D-016, V-114) ni conector de la fase 2 | Ver «Construcción en etapas» y la tabla de criterios |

## Supuestos y dependencias

### De qué depende

| De quién | Qué necesita la 022 | Estado hoy |
| --- | --- | --- |
| Función 021 | `exigirAdministrador()`, `exigirAdministradorEnAccion()` (que incluye `comprobarOrigen()`), `leerDelArea()`, `src/lib/supabase/servidor.ts`, la regla `privado.es_admin()` con registro de sesiones, `administradores.correo` para mostrar quién generó un código, y su prueba estática de puntos de entrada | Diseño corregido, pendiente de confirmación del auditor y de la puerta P1 |
| Función 020 | `Armazon`, `Tabla`, `Paginacion`, `EtiquetaEstado` y `catalogo.ts`, `Formulario` y campos, `DialogoConfirmacion`, `AvisosTemporales`, `BloqueDatos` y estados, `useAccion`, `leerResultadoAccion()`, `TextoDato`, `textoPlano()`, `rutas.ts`, `estado-direccion.ts`, `sin-acceso.ts`, `registrarFallo`, `textos.ts`, formatos, la muestra y las pruebas contrato de V-1 a V-4 | PLANIFICADA; sin implementar (no existe `package.json`) |
| Fase 1 (001, 002) | La app; `src/lib/oauth/secretos.ts` para sortear el código y calcular su HMAC; `registro.ts`; cabeceras contra la incrustación; la pantalla de activación | 001 y 002 aprobadas, en curso |
| Fase 2 (010, 011, 014) | Todo el apartado «Datos»; que el conector compruebe conexión, licencia y cliente en cada llamada y en cada renovación; un sitio donde ejecutar las pruebas de base de datos; el conector desplegado en desarrollo | PROPUESTA |
| Función 023 | Las reglas «Sin señal» (que remite a la 013) y «En pausa» (pausa efectiva), como una sola fuente en la base de datos; sus secciones de la ficha | APROBADA, sin diseño. La regla de la 013 tiene cuestiones sin responder |
| Función 024 | El inventario I-01 a I-12 e I-41, y la regla de fila principal y vinculadas | APROBADA, sin diseño |
| Función 025 | Los valores por defecto de las cinco reglas, en un único sitio de la base de datos, y su sección de la ficha | APROBADA, sin diseño |
| Coordinación y responsable | La nota aclaratoria del artículo 2 y la aclaración de `.claude/rules/interfaz.md` | Elegida el 12/11/2026; **sin aplicar** |

### Orden obligado

Ninguna página con el identificador de un cliente en la dirección se implementa antes de que el asunto A-1 esté resuelto. Ninguna operación se conecta a la base de datos antes de que existan en el proyecto de desarrollo las migraciones de «Datos» y de que la tarea previa T-P1 tenga evidencia. Ningún criterio se da por superado con datos ficticios si su texto pide base de datos, agente o entorno previo.

### Construcción en etapas

La fuente ficticia no implementa reglas de negocio: reproduce guiones cerrados (qué filas devuelve una lectura y qué resultado devuelve una acción). Las reglas viven solo en la base de datos.

| Etapa | Qué hace falta | Qué se construye | Qué se puede probar | Qué no cierra |
| --- | --- | --- | --- | --- |
| A | La app de la 002 y los componentes de la 020. **Nada de la fase 2** | `src/lib/clientes/` salvo `fuente-bd.ts`; `src/components/clientes/`; `DialogoConfirmacionTecleada`; textos; estados del catálogo; las vistas montadas en la muestra con la fuente ficticia | PRUEBA-001, 003 a 012: regla de nombres en TypeScript, validadores, fechas de Madrid, correspondencia de resultados, las cinco formas de cada vista, los siete diálogos, la confirmación tecleada, el diálogo del código, accesibilidad, 320 píxeles, textos, nombres como texto literal | Ningún criterio que pida base de datos, sesión real o agente. Lo que sale de aquí es evidencia de interfaz |
| A' | PGlite (`scripts/probar-modelo.mjs`) | Borrador de las funciones de «Datos», escrito por `ingeniero-bd` | La lógica de transiciones con una sola conexión | **No cierra ningún criterio**: sin sesiones reales, sin simultaneidad y sin las migraciones de verdad (REQ-028 de la 010). Evidencia provisional |
| B | Migraciones de «Datos» en el proyecto de desarrollo; la 021 implementada; T-P1 con evidencia; asunto A-1 resuelto | `fuente-bd.ts`, las páginas y acciones de `src/app/admin/clientes/` | PRUEBA-020 a 025 en local contra desarrollo. PRUEBA-002 y 013 a 019 solo donde haya un sitio para pgTAP | CA de base de datos mientras no haya CI ni Docker (asunto A-4) |
| C | Conector de la fase 2 desplegado en desarrollo, con un agente de prueba | Nada nuevo | PRUEBA-026 y 027 | — |
| D | Entorno previo | Nada nuevo | PRUEBA-028 (rendimiento) | — |

## Piezas y responsabilidades

### Principio: quién decide qué

| Decisión | Quién la toma | Quién no la toma |
| --- | --- | --- |
| ¿Puede esta sesión ver o hacer algo? | La guardia de la 021 en el servidor y `privado.es_admin()` en cada lectura y dentro de cada operación | Ninguna pantalla, botón oculto ni identificador recibido |
| ¿En qué estado está un cliente, una licencia, un código o una conexión? | Una regla de la base de datos, la misma para el panel y para el conector | El navegador y el servidor de la app, que solo traducen un valor de lista cerrada a una palabra |
| ¿Se permite esta transición? | La función de la operación, con el cerrojo tomado y el estado recién leído | El diálogo, que pudo abrirse con datos ya viejos |
| ¿Coincide el nombre tecleado? ¿Está repetido un nombre? | La base de datos, con `privado.clave_nombre()` | La copia en TypeScript, que solo sirve para activar el botón y anunciar la coincidencia |
| ¿Cuándo caduca un código o una licencia? | El reloj de la base de datos | El reloj del navegador o del servidor de la app |

### Mapa de archivos

Rutas según `docs/ESQUELETO.md`. Las que no están en él se marcan **(nueva)** y se piden aprobar con este diseño.

| Ruta | Qué contiene | Agente |
| --- | --- | --- |
| `src/app/admin/clientes/page.tsx` | Lista. Primera instrucción: `exigirAdministrador()` | `ingeniero-frontend` |
| `src/app/admin/clientes/nuevo/page.tsx` | Alta | `ingeniero-frontend` |
| `src/app/admin/clientes/[cliente]/page.tsx` | Ficha. Tras la guardia, una sola consulta decide si el cliente existe; si no, `sin-acceso.ts` (regla V-1) | `ingeniero-frontend` |
| `src/app/admin/clientes/[cliente]/editar/page.tsx` | Edición | `ingeniero-frontend` |
| `src/app/admin/clientes/[cliente]/secciones.ts` **(nueva)** | Lista cerrada y ordenada de las secciones de la ficha. La 023 y la 025 añaden aquí las suyas | `ingeniero-frontend` |
| `src/app/admin/clientes/acciones.ts` | **Únicas** acciones de servidor de esta función: las 11 operaciones y 3 lecturas (`listarClientes`, `leerSeccion`, `comprobarNombre`). Cada una empieza por `exigirAdministradorEnAccion()` | `ingeniero-backend` |
| `src/app/admin/clientes/_vista/` **(nueva)** | Componentes de cliente que unen las acciones con los componentes de presentación mediante `useAccion` | `ingeniero-frontend` |
| `src/lib/clientes/nombre.ts` **(nueva)** | `validarNombre()` y `claveNombre()`. Funciones puras, sin importaciones, válidas en servidor y navegador | `ingeniero-backend` |
| `src/lib/clientes/caracteres.ts` **(nueva)** | Rangos de caracteres rechazados, escritos uno a uno. De aquí salen la validación y la restricción de la base de datos | `ingeniero-backend` |
| `src/lib/clientes/fecha-madrid.ts` **(nueva)** | Convierte día y hora de Madrid en un instante; detecta la hora que no existe y la que se repite | `ingeniero-backend` |
| `src/lib/clientes/entradas.ts` **(nueva)** | Un validador de lista cerrada por acción | `ingeniero-backend` |
| `src/lib/clientes/resultados.ts` **(nueva)** | Listas cerradas de motivos, errores de campo y valores de estado, y su lectura defensiva | `ingeniero-backend` |
| `src/lib/clientes/fuente.ts` **(nueva)** | El tipo `FuenteClientes`: las lecturas y las 11 operaciones, con sus formas | `ingeniero-backend` |
| `src/lib/clientes/fuente-bd.ts` **(nueva)** | La única implementación del producto. Usa `servidor.ts` y `leerDelArea()`. Solo de servidor | `ingeniero-backend` |
| `src/lib/licencias/generar-codigo.ts` | Único archivo fuera de `src/lib/oauth/` que importa `secretos.ts`. Sortea el código, calcula el HMAC y llama a la operación | `ingeniero-backend` |
| `src/components/clientes/` **(nueva)** | Presentación: `ListaClientes`, `FichaCliente`, `SeccionDatos`, `SeccionLicencia`, `SeccionCodigos`, `SeccionConexiones`, `FormularioCliente`, `FormularioCaducidad`, `DialogoCodigo`. Cumplen las reglas comunes de la 020: no piden datos | `ingeniero-frontend` |
| `src/components/dialogo/DialogoConfirmacionTecleada.tsx` **(nueva)** | Ver «Confirmación tecleada». Vive en `dialogo/` porque es donde la 020 confina la primitiva | `ingeniero-frontend`, `disenador-ui` |
| `src/components/estado/catalogo.ts`, `textos.ts`, `direccion/rutas.ts` (de la 020) | Estados, textos y plantillas de ruta de esta función | `ingeniero-frontend`, `disenador-ui` |
| `src/app/muestra/clientes/` **(nueva)** | Las vistas con la fuente ficticia y sus guiones, dentro de la muestra de la 020 | `ingeniero-frontend` |
| `tests/ficticios/clientes/` **(nueva)** | `fuente-ficticia.ts` y los guiones. **No se importa desde `src/app/admin/` ni desde `src/lib/`** | `qa` |
| `tests/vectores/nombres.json` **(nueva)** | Vectores compartidos por la prueba de TypeScript y la de la base de datos | `qa` |
| `tests/unit/clientes/`, `tests/e2e/clientes/` | Pruebas de esta función | `qa` |
| `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql` | Lo que pide «Datos». Ruta crítica de la fase 2 | `ingeniero-bd` |

Rutas críticas de esta función (dictamen del `auditor-seguridad` en cada cambio): `src/app/admin/clientes/acciones.ts`, todo `src/lib/clientes/`, `src/lib/licencias/`, `DialogoCodigo`, las migraciones y sus pruebas. Se piden añadir a la lista de `docs/SEGURIDAD.md`.

**Importaciones prohibidas** (PRUEBA-005): nada de esta función importa `src/lib/supabase/admin.ts`, `conector.ts` ni `acceso.ts`; `secretos.ts` solo lo importa `generar-codigo.ts`; `src/app/admin/` y `src/lib/` no importan nada de `tests/` ni de `src/app/muestra/`; no se usa ninguna caché de datos del marco (`unstable_cache`, `use cache`, `revalidateTag`) en esta función.

### Rutas y pantallas

| Ruta | Título y `h1` | Qué muestra |
| --- | --- | --- |
| `/admin/clientes` | «Clientes» | Lista, búsqueda, filtro por estado, botón «Dar de alta un cliente» |
| `/admin/clientes/nuevo` | «Nuevo cliente» | Formulario de dos campos |
| `/admin/clientes/[cliente]` | «Ficha de cliente» | El nombre, como subtítulo con `TextoDato`, y las secciones |
| `/admin/clientes/[cliente]/editar` | «Editar cliente» | Los mismos dos campos |

- `[cliente]` es un UUID con el formato exacto de la 020. Mal formado, inexistente o sin permiso: la misma respuesta de `sin-acceso.ts`, en carga completa y en navegación (V-1). El identificador elige; no concede nada (REQ-074).
- No hay `loading`, `not-found` anidado, `generateMetadata` ni `Suspense` por encima de la decisión. Las secciones de la ficha sí se envían por partes, por debajo de ella.
- Alta y edición son páginas y no diálogos: un formulario con errores junto al campo se lee y se usa mejor a 320 píxeles en una página.
- Todas las respuestas llevan `Cache-Control: no-store` (V-4).

### Lista de clientes

- **Fuente.** Una lectura devuelve la página pedida y el total (L-1 de «Superficie de lectura»), con el estado del cliente, el de la licencia y el número de conexiones activas ya calculados por la base de datos: el servidor no los deduce. Una segunda lectura (L-7, cuya regla es de la 023) da «Sin señal» y «En pausa» para los 25 clientes de la página. Van separadas para que un fallo de la segunda no tumbe la lista y porque ni el orden ni el filtro dependen de ella.
- **Columnas** (REQ-001, REQ-078): nombre (`TextoDato`, enlace a la ficha construido con `rutas.ts`); estado del cliente con `EtiquetaEstado` y, a su lado, «Sin señal» y «En pausa» como etiquetas con palabra; licencia (estado en palabras y, si tiene, «Caduca el 12 nov 2026, 08:04»); conexiones activas; fecha de alta. A 320 píxeles la tabla se desplaza dentro de su región con nombre y foco, como fija la 020: la página no se desplaza.
- **Orden** (REQ-003). Lista cerrada de seis valores: `nombre_asc` (por defecto), `nombre_desc`, `estado_asc`, `estado_desc`, `alta_asc`, `alta_desc`. Por nombre se ordena por su clave de comparación; por estado, con el orden fijo «Activo», «Pendiente de activar», «Licencia suspendida», «Licencia caducada», «Sin licencia», «Dado de baja» (decidido por delegación, DD-13). Todos los órdenes desempatan por la clave del nombre y después por el identificador: el orden es total y no cambia entre páginas.
- **Filtro por estado**: control de selección con la lista cerrada de los seis estados y «Todos».
- **Búsqueda** (REQ-004). `CampoBusqueda` con botón «Buscar»; se envía con el botón o con Intro, no en cada pulsación (decidido por delegación, DD-12). El texto, de 120 caracteres como mucho, viaja en el cuerpo de la acción `listarClientes` (V-3), la base de datos calcula su clave y busca el fragmento, y los comodines del texto se tratan como caracteres. No se guarda ni se registra. Sin búsqueda, la página, el orden y el filtro van en la dirección con `estado-direccion.ts`. **Con una búsqueda activa no se escribe nada en la dirección**: página, orden y filtro se guardan en memoria junto al texto. Consecuencia aceptada: al recargar o volver atrás se vuelve a la lista sin búsqueda.
- **Paginación**: 25 filas, con `Paginacion` de la 020 y su texto de posición común («Del 1 al 25 de 312»). El ejemplo de REQ-005 («1–25 de 312») se lee como ilustración del dato, no como texto literal (decidido por delegación, DD-18). Una página que ya no existe (porque el total bajó) devuelve la última.
- **Estados**: carga, vacío sin clientes («Todavía no hay clientes. Dar de alta un cliente»), vacío por búsqueda o filtro («Ningún cliente coincide. Quitar la búsqueda»), error con reintento, sin permiso (de la vista entera). Datos parciales: si la fuente de «Sin señal» y «En pausa» falla, la lista se muestra y esa columna dice «No se ha podido cargar»; nunca se pinta como si no hubiera indicaciones.

### Ficha de cliente

Cada sección es un `BloqueDatos` con su propia lectura, su estado de carga, vacío, error y reintento (acción `leerSeccion`). Si una falla, las demás se muestran (REQ-039). A 320 píxeles, la ficha empieza con una lista de enlaces a sus secciones.

| Orden | Sección | Contenido | Acciones | Vacío |
| --- | --- | --- | --- | --- |
| 1 | Datos del cliente | Nombre, estado, frecuencia esperada («Cada 24 horas»), fecha de alta, canal (`Estable` o `Prueba`, solo lectura, con la nota «El canal se cambia desde Versiones») | «Editar», «Dar de baja» o «Reactivar cliente» | No aplica |
| 2 | Licencia | Vigente: estado en palabras, causas de suspensión («Suspendida a mano el…», «Suspendida por cobro el…»), creación y caducidad. Debajo, licencias revocadas anteriores con su fecha de revocación | «Crear licencia», «Suspender licencia», «Reactivar licencia», «Fijar caducidad», «Cambiar caducidad», «Quitar caducidad», «Revocar licencia» | «Este cliente no tiene licencia. Crear licencia» |
| 3 | Códigos de activación | Tabla: estado, quién lo generó, cuándo, cuándo caduca, cuándo se usó o se anuló. Nunca el código. De 25 en 25, el más reciente primero | «Generar código» | «No se ha generado ningún código» |
| 4 | Conexiones | Tabla: asistente, alta, último uso, estado; si está revocada, fecha y motivo. De 25 en 25, las activas primero | «Revocar conexión», en cada fila activa | «Ningún asistente conectado. Genera un código para conectar el primero» |
| 5 | Reglas del agente | Marco de la sección (encabezado y contenedor). El contenido es de la 025 | Ninguna de esta función | De la 025 |
| 6 y 7 | Informes, Órdenes | Marco. El contenido es de la 023 | Ninguna de esta función | De la 023 |

- **Qué acciones se ofrecen** lo decide el estado leído, pero es solo una ayuda: la base de datos decide (REQ-031). Un estado que no esté en el catálogo se pinta «Estado desconocido» y no ofrece ninguna acción.
- **Aviso permanente de baja con credenciales vivas** (decidido por delegación, DD-16). Si el cliente está de baja y tiene conexiones activas, la sección de datos dice: «Este cliente está de baja y conserva N conexiones activas, que siguen renovando su acceso. Para cortarlas, revoca la licencia o las conexiones». Es la consecuencia que el responsable aceptó en la cuestión 7, hecha visible después del diálogo y no solo en él.
- **Quién generó un código**: el correo del administrador, tomado de `administradores` (021) y pintado con `TextoDato`. Si la cuenta ya no se puede leer: «Administrador no disponible».
- **El sitio de las reglas** (REQ-007, CA-004). `secciones.ts` declara el marco de las secciones 5 a 7; la 025 y la 023 ponen el componente. La 022 no tiene ningún control de reglas. La fase 3 no se publica con marcos sin contenido: las tres funciones cierran juntas.
- **Usuarios del cliente** (fase 5): no se reserva marco. Lo añade la 040 en `secciones.ts` con su diseño.

### Formularios de alta y edición

Dos campos y ninguno más (REQ-008, REQ-009, CA-005):

| Campo | Control | Validación en el servidor | Errores `{campo, codigo}` |
| --- | --- | --- | --- |
| `nombre` | Texto de una línea, `maxlength` orientativo | Se quitan los espacios de los extremos; de 1 a 120 caracteres contados en puntos de código; sin caracteres de la lista de «Regla de nombres»; no repetido | `obligatorio`, `demasiado_largo`, `caracter_no_admitido`, `repetido` |
| `frecuencia` | Texto con `inputmode="numeric"`; 24 propuesto en el alta | Solo cifras (`^[0-9]{1,3}$`) y valor de 1 a 168 | `obligatorio`, `no_entero`, `fuera_de_rango` |

- La edición envía además `version`, el número de versión del cliente que se leyó al abrir el formulario. Si ya no coincide, la operación se rechaza con `datos_desactualizados` y el formulario muestra los valores actuales junto a lo escrito, sin perderlo (REQ-049).
- El alta no pide ni muestra reglas. La operación guarda el cliente y sus reglas por defecto juntos (REQ-079).
- Tras un alta `hecha`, se va a la ficha del cliente nuevo. Tras un alta `incierta`, el formulario se queda, dice que no se sabe si el cliente se ha creado y ofrece «Comprobar»: la acción `comprobarNombre` busca un cliente con esa clave de nombre; si existe, enlaza a su ficha; si no, permite reintentar. Reintentar no duplica: el nombre es único (REQ-035, REQ-079).

### Diálogos de confirmación

Los siete de REQ-030 usan `DialogoConfirmacion` de la 020, salvo la revocación de la licencia. El objetivo se pasa como `{nombre, distintivo}`. El texto final lo escribe el `disenador-ui` en `textos.ts`; aquí se fija lo que cada uno tiene que decir (CA-021).

| Acción | Distintivo | Qué pasa | Cuándo lo nota el agente | ¿Se puede deshacer? | Botón |
| --- | --- | --- | --- | --- | --- |
| Dar de baja | Fecha de alta del cliente | El agente deja de recibir instrucciones. La licencia y las conexiones se conservan y sus credenciales se siguen renovando. El código pendiente, si lo hay, se anula. Para cortar las credenciales hay que revocar la licencia o las conexiones (los tres avisos de REQ-067) | En su siguiente revisión | Sí, con «Reactivar cliente» | «Dar de baja» |
| Reactivar cliente | Fecha de alta | Vuelve a estar activo con su misma licencia y sus mismas conexiones. Si la licencia está suspendida, caducada o revocada, o hay una pausa, seguirá sin instrucciones: el diálogo lo dice cuando ocurre | En su siguiente revisión | Sí, dándolo de baja otra vez | «Reactivar cliente» |
| Suspender licencia | Fecha de creación de la licencia | El agente recibe `suspendida`, sin instrucciones. Las conexiones se conservan. El código pendiente se anula | En su siguiente revisión | Sí, con «Reactivar licencia» | «Suspender licencia» |
| Reactivar licencia | Fecha de creación | Se quita la suspensión hecha a mano. Si además está suspendida por cobro, caducada o en pausa, seguirá sin instrucciones: el diálogo lo dice cuando ocurre | En su siguiente revisión | Sí, suspendiéndola otra vez | «Reactivar licencia» |
| Revocar licencia | Fecha de creación | Definitivo. Sus N conexiones pasan a revocadas y dejan de renovar; el código pendiente se anula. Para volver a dar servicio hará falta una licencia nueva y una activación nueva | De inmediato, en su siguiente llamada | **No** | «Revocar licencia» (con nombre tecleado) |
| Fijar, cambiar o quitar la caducidad | Fecha de creación | Al llegar la fecha, el agente recibe `suspendida`. Al quitarla, deja de caducar. Muestra la fecha anterior y la nueva | En su siguiente revisión tras la fecha | Sí, cambiándola o quitándola | «Fijar caducidad», «Cambiar caducidad», «Quitar caducidad» |
| Revocar conexión | Asistente, fecha de alta y último uso | Esa conexión deja de tener acceso y no puede renovarlo. Las demás no cambian. Para volver a conectar ese asistente hará falta un código nuevo | De inmediato, en su siguiente llamada | **No** | «Revocar conexión» |

Cancelar, Escape o cerrar no llaman a ninguna acción. La caducidad tiene dos pasos: `FormularioCaducidad` y, al enviarlo sin errores, el diálogo.

### Confirmación tecleada (REQ-071)

`DialogoConfirmacionTecleada` tiene la misma interfaz que `DialogoConfirmacion`, más un campo y una función `coincide(texto)` que la vista le pasa.

- **Campo.** Etiqueta visible: «Escribe el nombre del cliente para confirmar». Es un campo de varias líneas, para que un nombre de 120 caracteres se vea entero a 320 píxeles sin desplazamiento horizontal. Admite pegar. Sin autocompletado, sin corrección ortográfica y sin mayúscula automática. El nombre que hay que escribir está encima, con `TextoDato`, y unido al campo con `aria-describedby`.
- **Coincidencia.** Debajo del campo, un texto fijo: «Todavía no coincide» o «El nombre coincide». Se anuncia por la región cortés solo cuando cambia de un valor a otro, no en cada pulsación.
- **Botón.** «Revocar licencia» lleva `aria-disabled="true"` mientras no coincide: sigue recibiendo el foco y se puede descubrir con el lector, pero pulsarlo no llama a nada; lleva el foco al campo y anuncia «Escribe el nombre del cliente tal como aparece arriba». Intro dentro del campo no confirma. El foco inicial va a «Cancelar», como en la 020.
- **La coincidencia se comprueba dos veces.** En el navegador, con `claveNombre()`, para activar el botón. En la base de datos, dentro de la operación, que recibe lo tecleado y lo compara con el nombre **actual** del cliente (decidido por delegación, DD-08). Si otro administrador cambió el nombre mientras el diálogo estaba abierto, la operación se rechaza con `confirmacion_no_coincide` y el diálogo muestra el nombre actual. Lo tecleado viaja en el cuerpo, no se guarda y no se registra.
- **Depende de una comprobación.** La 020 solo ha probado el diálogo de alerta de Radix sin campos. Que un campo de texto dentro de él conserve el foco, se anuncie y funcione en los tres motores entra en su PRUEBA-011 (tarea previa T-P2 de este diseño). Si falla, se aplica la alternativa de diálogo que la 020 decida para todos.

### Generación y diálogo del código

**Antes de generar.** El botón «Generar código» abre un diálogo que dice para qué licencia es, que el código sirve una vez y caduca a los 15 minutos, y que solo se verá una vez. Si la ficha muestra un código pendiente, el diálogo avisa: «Hay un código pendiente, generado el … por …. Si generas otro, dejará de servir» (REQ-068).

**La operación.** El servidor sortea el código con `secretos.ts` (formato y entropía de la 001), calcula su HMAC y llama a la operación con el HMAC y con el identificador del código pendiente que la ficha mostraba, o ninguno. La base de datos:

1. Si hay un código pendiente distinto del esperado, **no crea nada** y devuelve `estado_cambiado`. El diálogo relee y enseña el pendiente actual con su aviso. Así dos envíos de la misma generación, o dos administradores a la vez, dan un solo código: el segundo se rechaza en lugar de anular el primero y dejar a alguien con un código muerto en pantalla (REQ-045, REQ-075; decidido por delegación, DD-02).
2. Si el pendiente es el esperado, lo anula y escribe su fila vinculada.
3. Crea el código nuevo con caducidad a 15 minutos del reloj de la base de datos y autor de la sesión, y escribe la fila principal.

El código solo sale del servidor si la base de datos confirmó la transacción (REQ-058). Si la respuesta no llega, el resultado es `incierta`: el código se ha perdido, la ficha relee, mostrará el pendiente si se creó y generar otro lo anulará.

**`DialogoCodigo`** (REQ-021, REQ-022).

- Muestra el código en grupos de cuatro, su hora de caducidad («Caduca el 14 nov 2026, 08:19») y «No podrás volver a verlo. Si lo pierdes, genera otro».
- Botón «Copiar código», accesible con teclado, que anuncia «Código copiado». Si el navegador no permite copiar, el código se puede seleccionar y el diálogo lo dice.
- **No se cierra solo ni con Escape ni pulsando fuera**: solo con su botón «He terminado» (decidido por delegación, DD-11). Es la única vez que el código se ve, y un Escape por error lo perdería.
- Cuando pasa su hora de caducidad con el diálogo abierto, el código se sustituye por «Este código ha caducado. Genera otro».
- El código vive solo en la memoria de ese componente. No se escribe en la dirección, en el almacenamiento del navegador, en el estado de navegación ni en el título. Al cerrar se borra. Si la sesión caduca con el diálogo abierto, la 021 sustituye el contenido y el código desaparece.
- **Dónde no puede aparecer** (REQ-024): no se pasa a `registro.ts` ni a `registrarFallo`; no forma parte de ninguna dirección; no entra en la auditoría, que anota el identificador de la fila; no se guarda en claro; `codigo_hmac` no se puede leer con ninguna sesión (D-3). Lo que queda fuera de nuestro control es el portapapeles del administrador: se declara como riesgo residual (AM-03).

### Regla de nombres (REQ-077, REQ-051 a REQ-053)

Una regla, dos implementaciones (`claveNombre()` en TypeScript y `privado.clave_nombre()` en la base de datos) y un solo juego de vectores que las dos tienen que pasar. **Manda la de la base de datos.**

**Qué se guarda.** El nombre tal como llega, quitando solo los espacios de los extremos. No se normaliza ni se corrige (REQ-052, CA-006).

**Qué se rechaza** (decidido por delegación, DD-06). La lista vive en `caracteres.ts`, con rangos escritos uno a uno:

| Grupo | Ejemplos |
| --- | --- |
| Caracteres de control (categoría Cc) | Saltos de línea, tabulador, U+0000 a U+001F, U+007F a U+009F |
| Caracteres de formato (categoría Cf), **todos** | Anchura cero (U+200B, U+200C, U+200D, U+FEFF), marcas de dirección (U+200E, U+200F, U+202A a U+202E, U+2066 a U+2069), guion opcional U+00AD, caracteres de etiqueta |
| Separadores de línea y de párrafo | U+2028, U+2029 |
| Otros caracteres que no se ven | U+034F, U+115F, U+1160, U+17B4, U+17B5, U+180B a U+180F, U+3164, U+FE00 a U+FE0F, U+FFA0, U+E0100 a U+E01EF |
| Texto mal formado | Mitades sueltas de un par sustituto |

Cualquier otro signo se admite: `<`, `>`, `&`, comillas, etiquetas, letras de cualquier alfabeto. Consecuencia aceptada: un emoji compuesto con U+200D o con selector de variación se rechaza. Los espacios que no son U+0020 (por ejemplo, el espacio de no separación al pegar desde un procesador de textos) se admiten y se guardan, pero cuentan como espacio al comparar.

**Clave de comparación**, en este orden:

1. Descomponer (NFD).
2. Quitar **solo** los acentos agudo, grave y circunflejo (U+0301, U+0300, U+0302). Ningún otro signo se quita: la virgulilla de la «ñ», la diéresis de la «ü» y la cedilla se conservan (decidido por delegación, DD-05).
3. Recomponer (NFC) y pasar a minúsculas.
4. Convertir en U+0020 todo espacio (categoría Zs), reducir los espacios seguidos a uno y quitar los de los extremos.

Resultado sobre los casos de la especificación: «Pérez», «PÉREZ», «perez» y « perez » dan la misma clave; «Peña» y «Pena» no; «Agüero» y «Aguero» no; «García SL» y «garcia  sl» sí.

**Dónde se usa la clave.** Columna generada `clientes.nombre_clave` con índice único (nombres repetidos, también con altas simultáneas y contando a los clientes de baja: decidido por delegación, DD-07); búsqueda por fragmento; orden por nombre; y confirmación tecleada.

**Lo que esta regla no hace.** No iguala letras de alfabetos distintos que se ven iguales (una «а» cirílica y una «a» latina). Dos clientes podrían tener nombres indistinguibles a la vista por esa vía. Lo mitigan el distintivo de los diálogos y que solo un superadmin da de alta clientes (AM-12).

### Fecha de caducidad (REQ-019)

`FormularioCaducidad` tiene dos campos de texto, porque la 020 no usa el control nativo de fecha: «Fecha» (`dd/mm/aaaa`) y «Hora» (`hh:mm`), con la indicación «Hora de Madrid». `fecha-madrid.ts` busca el instante cuya hora de Madrid es la escrita:

- Si no existe (la hora que se salta en marzo) o existe dos veces (la que se repite en octubre), se rechaza con `hora_no_valida`: «Esa hora no existe o se repite ese día por el cambio de hora. Elige otra» (decidido por delegación, DD-10). No se elige una en silencio.
- La precisión es el minuto. El máximo son 10 años desde hoy (`demasiado_lejana`), para que la entrada esté acotada.
- Que la fecha sea futura lo decide la base de datos con su reloj (`no_futura`). El servidor lo comprueba antes solo para avisar junto al campo.

### Fuente de datos y fuente ficticia

`FuenteClientes` es el único punto por el que las vistas obtienen datos y ejecutan operaciones. Tiene una implementación en el producto, `fuente-bd.ts`, que las páginas y acciones de `src/app/admin/clientes/` usan **de forma fija**: no hay variable de entorno, indicador ni parámetro que elija otra (decidido por delegación, DD-15). Una fuente ficticia que se pudiera activar en producción enseñaría datos falsos o daría por hechas acciones que no existen (artículo 3).

La fuente ficticia vive en `tests/ficticios/clientes/` y solo la montan la muestra y las pruebas. Un mismo juego de pruebas de contrato (PRUEBA-006) se ejecuta contra la ficticia en la etapa A y contra la real en la etapa B, para que la ficticia no se aparte de la forma real.

## Contratos

Esta función **no cambia `contratos/`**: no toca la forma de ninguna herramienta del conector ni del informe. Lo que cambia para el agente es qué estado recibe, y eso lo decide la regla única de «Datos», que la fase 2 aplica en el conector.

Fija estas formas internas, todas de lista cerrada. Ninguna lleva quién actúa: sale de la sesión.

| Forma | Valores |
| --- | --- |
| Resultado de una acción | Los cuatro de la 020 (`hecha`, `rechazada`, `no_permitida`, `incierta`), con la tabla de `leerResultadoAccion()` sin excepciones (V-7) |
| Motivos de `rechazada` | `ya_estaba_hecho`, `sin_cambios`, `no_encontrado`, `transicion_no_permitida`, `cliente_de_baja`, `ya_tiene_licencia`, `licencia_revocada`, `licencia_suspendida`, `licencia_caducada`, `estado_cambiado`, `datos_desactualizados`, `confirmacion_no_coincide`, `datos_no_validos` (con errores de campo) |
| Errores de campo `{campo, codigo}` | Campos: `nombre`, `frecuencia`, `fecha`, `hora`, `nombre_tecleado`. Códigos: `obligatorio`, `demasiado_largo`, `caracter_no_admitido`, `repetido`, `no_entero`, `fuera_de_rango`, `formato`, `no_futura`, `demasiado_lejana`, `hora_no_valida`, `no_coincide` |
| Estado del cliente en la lista | `baja`, `sin_licencia`, `licencia_caducada`, `licencia_suspendida`, `pendiente_activar`, `activo` |
| Situación de una licencia | `activa`, `suspendida`, `caducada`, `revocada`; causas: `manual`, `cobro` |
| Estado de un código | `pendiente`, `usado`, `caducado`, `anulado` |
| Estado de una conexión y motivo | `activa`, `revocada`; `administrador`, `credencial_reutilizada`, `revocacion_licencia` |
| Asistente y canal | `claude`, `chatgpt`, `otro`; `estable`, `prueba` |
| Orden y filtro de la lista | Los seis órdenes de «Lista de clientes»; los seis estados o ninguno; página de 1 a 10.000 |
| Entradas de cada acción | Tabla «Operaciones». Un campo que no esté en la lista no se lee, no se registra y no tiene efecto (REQ-055). Cada acción recibe un único objeto plano; cualquier otra forma se trata como `datos_no_validos` |
| Estados nuevos del catálogo de la 020 | Uno por cada valor de las cinco filas anteriores, con los ámbitos `cliente`, `licencia`, `causa`, `codigo`, `conexion`, `motivo_revocacion`, `asistente` y `canal`. «Sin señal» y «En pausa» los añade la 023 con el ámbito `indicacion` |
| Códigos nuevos de `registro.ts` (fase 1) | `clientes_no_permitida`, `clientes_objeto_ajeno`, `clientes_resultado_incierto`, `clientes_lectura_fallida`. Sin valores |

`no_encontrado` vale igual para «no existe» y «no corresponde a este cliente»: un solo texto, «No se ha encontrado. Puede que ya no exista. Recarga la ficha» (REQ-056). Un valor de estado que no esté en su lista se lee como `desconocido`.

## Datos

**Quién escribe las migraciones.** Son rutas críticas de la fase 2. Este diseño fija lo que necesita; cómo se reparte entre la 010 y una migración propia de la 022 lo decide el plan, con coordinación. Como todavía no hay ninguna migración, lo razonable es que estos cambios entren en las migraciones iniciales y no como alteraciones posteriores. Los nombres son propuestas, en español y sin tildes.

### Lo que se pide a la fase 2

| N.º | Sobre qué | Qué se pide | Requisitos |
| --- | --- | --- | --- |
| D-1 | `clientes` | `nombre` con la restricción de caracteres de «Regla de nombres» y longitud de 1 a 120 tras quitar extremos; `nombre_clave`, mantenida por la base de datos con `privado.clave_nombre()`, no escribible y con **índice único**; `version` (entero que sube en cada edición); `baja_en`; `creado_en` inmutable; `canal` sin ninguna vía de cambio en esta función | REQ-008, REQ-009, REQ-049, REQ-051 a REQ-054, REQ-065, REQ-077 |
| D-2 | `licencias` | En lugar de `estado` y `estado_manual`, hechos con fecha: `revocada_en`, `suspension_manual_en`, `suspension_cobro_en`, `caduca_en`, `creada_en`, `creada_por`. Índice único de una licencia sin revocar por cliente. `cliente_id` inmutable. `suspension_cobro_en` solo lo escribe la fase 6; ninguna función suya toca `suspension_manual_en` | REQ-013, REQ-017, REQ-072, REQ-057 |
| D-3 | `codigos_activacion` | `anulado_en`; `vivo` (verdadero mientras pueda llegar a usarse), con **índice único parcial de un código vivo por licencia**; `usado_en` y `anulado_en` no pueden estar los dos; `caduca_en` igual a `creado_en` más 15 minutos, por restricción; `creado_por` obligatorio y tomado de la sesión; `licencia_id`, `codigo_hmac`, `caduca_en` y `creado_por` inmutables; **`codigo_hmac` sin permiso de lectura para ninguna sesión** (decidido por delegación, DD-04) | REQ-020, REQ-022, REQ-057, REQ-068, REQ-070, REQ-076 |
| D-4 | `conexiones` | `motivo_revocacion` de lista cerrada, presente si y solo si hay `revocada_en`; `licencia_id` inmutable | REQ-025, REQ-061, REQ-073 |
| D-5 | Inmutabilidad, como segunda capa | Disparadores que rechazan, **venga de quien venga**: cambiar una licencia revocada; quitar o cambiar `revocada_en` de una licencia o de una conexión, o el motivo; quitar o cambiar `usado_en` o `anulado_en`; devolver `vivo` a verdadero; alargar `caduca_en` de un código; cambiar los campos inmutables de D-1 a D-4; insertar una conexión activa en una licencia revocada | REQ-029, REQ-057, REQ-060, REQ-061, REQ-076 |
| D-6 | Permisos | `authenticated` **sin** `insert`, `update` ni `delete` sobre las cuatro tablas. Las reglas por defecto del alta las escribe O-1; los permisos de `reglas_cliente` los fija la 025. Las claves ajenas entre ellas, sin borrado en cascada. Ninguna función de esta lista borra | REQ-012, REQ-031, REQ-059 |
| D-7 | Regla única de estado | Una función por objeto (`privado.situacion_licencia`, `privado.estado_cliente_lista`, `privado.estado_codigo`) que usan el panel y el conector. Tabla en «Estado derivado» | REQ-002, REQ-015 a REQ-019 |
| D-8 | Lecturas | Las siete de «Superficie de lectura» | REQ-001 a REQ-007, REQ-023, REQ-025 |
| D-9 | Operaciones | Las once de «Operaciones», con la forma de exponerlas que la 010 fije para las «operaciones del panel» (la misma petición que hace la 021) | REQ-008 a REQ-034 |
| D-10 | `auditoria` | `accion` de lista cerrada con I-01 a I-12 e I-41; `fila_principal_id`; inserción solo desde funciones. **Sin el disparador genérico** sobre estas cuatro tablas: duplicaría cada fila con una operación técnica, que la 024 prohíbe mostrar | REQ-033, REQ-034, REQ-062 |
| D-11 | Conector y activación | Lista en «Lo que el conector tiene que cumplir» | REQ-027, REQ-063, REQ-073 |
| D-12 | Datos ficticios | Clientes en los seis estados; 1.000 clientes; una ficha con 50 conexiones y 200 códigos; códigos en los cuatro estados; conexiones de Claude y de ChatGPT y revocadas con los tres motivos; licencias con cada combinación de causas; clientes en `estable` y en `prueba`; los nombres de CA-006 y de CA-035 | CA-001 a CA-004, CA-011, CA-016, CA-018, CA-039 |
| D-13 | Sitio para las pruebas | Donde ejecutar pgTAP con varias conexiones a la vez (asunto A-4) | CA-009, CA-034, CA-035, CA-042 |

### Estado derivado

Se calcula en el momento de la consulta, con el reloj de la base de datos. No hay tarea periódica que «pase» una licencia a caducada.

| Objeto | Regla, en orden de prioridad |
| --- | --- |
| Licencia | `revocada` si tiene `revocada_en`; si no, `caducada` si `caduca_en` ya pasó; si no, `suspendida` si tiene alguna causa; si no, `activa`. Las causas se muestran siempre, sea cual sea la situación |
| Cliente en la lista | `baja`; si no, `sin_licencia` (ninguna licencia sin revocar); si no, `licencia_caducada`; si no, `licencia_suspendida`; si no, `pendiente_activar` (ninguna conexión sin revocar); si no, `activo`. Es el orden de REQ-002 |
| Código | `usado`; si no, `anulado`; si no, `caducado` si `caduca_en` ya pasó; si no, `pendiente` |
| Conexión | `revocada` si tiene `revocada_en`; si no, `activa` |
| Lo que recibe el agente | Instrucciones solo si el cliente está activo y su licencia está `activa`, y nada más lo impide (pausa, versión: 011 y 023). En otro caso, `suspendida`. Con la licencia revocada, lo que decida la fase 2 |

«Forzar activa pese a un impago» (ADR-0006, punto 7) no se diseña aquí. Cuando la fase 6 lo diseñe, tendrá que ser otro hecho con fecha que anule solo la causa de cobro, nunca la manual (REQ-072).

### Superficie de lectura

Todas devuelven cero filas si `privado.es_admin()` no se cumple, **con independencia de las políticas que otras fases añadan a las tablas** (decidido por delegación, DD-17): cuando la fase 5 deje a un usuario de cliente leer su propia fila, estas lecturas seguirán sin darle nada. Se ejecutan con la sesión del usuario y pasan por `leerDelArea()`, que distingue «cero filas» de «la sesión dejó de valer».

| N.º | Lectura | Entradas | Devuelve |
| --- | --- | --- | --- |
| L-1 | Lista de clientes | Texto de búsqueda (opcional, 120 como mucho), estado (opcional), orden, página | Por fila: identificador, nombre, estado en la lista, situación de la licencia y su caducidad, conexiones activas, fecha de alta. Y el total |
| L-2 | Un cliente | Identificador | Nombre, estado, frecuencia, alta, baja, canal, versión, conexiones activas. Cero filas es «sin acceso» (V-1) |
| L-3 | Licencias de un cliente | Identificador del cliente | Por licencia: situación, fechas de cada causa, creación, caducidad, revocación |
| L-4 | Códigos de un cliente | Identificador del cliente, página | Por código: estado, correo de quien lo generó, creación, caducidad, uso, anulación. **Nunca el HMAC.** Y el total |
| L-5 | Conexiones de un cliente | Identificador del cliente, página | Por conexión: asistente, alta, último uso, revocación y motivo. Y el total |
| L-6 | Cliente por nombre | Nombre | El identificador del cliente con esa clave, si existe. Solo para `comprobarNombre` |
| L-7 | Indicaciones | Hasta 25 identificadores de cliente | Por cliente: `sin_senal` y `en_pausa`. **La regla y la función son de la 023** |

### Operaciones

Las llama el servidor con la credencial del usuario. Todas siguen el mismo esquema, en una transacción:

1. `privado.es_admin()`; si no se cumple, `no_permitida` y nada más.
2. Cerrojos, siempre en el orden cliente → licencia → códigos y conexiones.
3. El objeto existe y es del cliente indicado; si no, `no_encontrado`.
4. La transición vale desde el estado recién leído; si ya estaba hecha, `ya_estaba_hecho`, sin cambios y sin auditoría (REQ-047).
5. Cambio y filas de auditoría. Si una fila no se puede escribir, la transacción entera se deshace (REQ-062).
6. Resultado de lista cerrada y, como mucho, un identificador o una fecha.

Ninguna recibe quién actúa, ni un estado, ni un canal, ni una fecha de alta. Ninguna devuelve texto.

| N.º | Operación | Entradas | Condiciones | Efecto | Auditoría |
| --- | --- | --- | --- | --- | --- |
| O-1 | Alta de cliente | `nombre`, `frecuencia` | Nombre válido y no repetido; frecuencia de 1 a 168 | Crea el cliente, activo y sin licencia, y sus reglas con los valores por defecto que da la única fuente de la 025. Juntos o nada (REQ-079) | I-01; vinculada I-41 |
| O-2 | Edición | `cliente`, `version`, `nombre`, `frecuencia` | La versión coincide; mismas reglas que el alta. Sin cambios reales: `sin_cambios` | Cambia nombre y frecuencia; sube la versión | I-02 |
| O-3 | Baja | `cliente` | Cliente activo | Estado `baja` y `baja_en`. Anula el código pendiente. No toca licencia ni conexiones | I-03; vinculada I-11 |
| O-4 | Reactivar cliente | `cliente` | Cliente de baja | Estado `activo`. No devuelve ningún código a pendiente | I-04 |
| O-5 | Crear licencia | `cliente`, `caduca_en` (opcional) | Cliente activo; sin licencia sin revocar; caducidad futura y a 10 años como mucho | Crea la licencia, sin causas | I-05 |
| O-6 | Suspender | `cliente`, `licencia` | Cliente activo; licencia sin revocar y sin causa manual | Fija `suspension_manual_en`. Anula el código pendiente | I-06; vinculada I-11 |
| O-7 | Reactivar licencia | `cliente`, `licencia` | Cliente activo; licencia sin revocar y **con** causa manual | Quita solo la causa manual | I-07 |
| O-8 | Revocar licencia | `cliente`, `licencia`, `nombre_tecleado` | Licencia sin revocar, en cualquier estado del cliente; la clave de lo tecleado coincide con la del nombre actual | Fija `revocada_en`; revoca cada conexión activa con esa misma fecha y el motivo `revocacion_licencia`; anula el código pendiente | I-08; vinculadas I-12 (una por conexión) e I-11 |
| O-9 | Caducidad | `cliente`, `licencia`, `caduca_en` o ninguna | Cliente activo; licencia sin revocar; fecha futura y a 10 años como mucho. Mismo valor: `sin_cambios` | Fija, cambia o quita `caduca_en` | I-09 |
| O-10 | Generar código | `cliente`, `licencia`, `codigo_hmac`, `pendiente_esperado` (opcional) | Cliente activo; licencia `activa`; no hay un pendiente distinto del esperado; el HMAC tiene su formato y no existe | Anula el pendiente esperado, si lo hay; crea el código, con caducidad a 15 minutos y autor de la sesión. Devuelve su identificador y su caducidad | I-10; vinculada I-11 |
| O-11 | Revocar conexión | `cliente`, `conexion` | Conexión activa, en cualquier estado del cliente y de la licencia | Fija `revocada_en` y el motivo `administrador`, con la misma función interna que usa la revocación automática de la fase 2 | I-12 |

**Con el cliente de baja, la licencia solo admite la revocación** (decidido por delegación, DD-09). REQ-011 nombra como permitidas la revocación de la licencia y de las conexiones, y REQ-060 prohíbe crear y reactivar; suspender y cambiar la caducidad no están en ninguna de las dos listas, y se deniegan. Editar el nombre y la frecuencia sí se permite: no cambia nada de lo que recibe el agente.

**Revocar una licencia ya revocada** devuelve `ya_estaba_hecho` (decidido por delegación, DD-19): se rechaza sin cambios, como pide REQ-060, y el mensaje es más claro. Las demás transiciones de REQ-060 devuelven `transicion_no_permitida`, `cliente_de_baja` o el error de campo `no_futura`.

### Transiciones de la licencia

Resultado de cada operación según la situación, con el cliente activo. «—» es `transicion_no_permitida`.

| Situación | Suspender | Reactivar | Revocar | Caducidad | Generar código |
| --- | --- | --- | --- | --- | --- |
| Activa | Hecha | — | Hecha | Hecha | Hecha |
| Suspendida solo a mano | `ya_estaba_hecho` | Hecha; pasa a activa | Hecha | Hecha | `licencia_suspendida` |
| Suspendida solo por cobro | Hecha; quedan las dos causas | — | Hecha | Hecha | `licencia_suspendida` |
| Suspendida por las dos | `ya_estaba_hecho` | Hecha; sigue suspendida por cobro | Hecha | Hecha | `licencia_suspendida` |
| Caducada, sin causas | Hecha | — | Hecha | Hecha | `licencia_caducada` |
| Caducada, con causa manual | `ya_estaba_hecho` | Hecha; sigue caducada | Hecha | Hecha | `licencia_caducada` |
| Revocada | — | — | `ya_estaba_hecho` | — | `licencia_revocada` |

Con el cliente de baja: revocar se aplica en todas las filas sin revocar; todo lo demás devuelve `cliente_de_baja`.

### Cerrojos y simultaneidad

- **Orden único**: cliente, licencia, códigos y conexiones. Ninguna función lo invierte. Dos operaciones sobre el mismo cliente se ejecutan una detrás de otra, y la segunda ve el resultado de la primera (REQ-048).
- **Una licencia sin revocar por cliente** y **un código vivo por licencia**: cerrojo e índice único. El índice es lo que una prueba puede demostrar insertando a mano; el cerrojo es lo que da un resultado limpio en lugar de un error (decidido por delegación, DD-03).
- **Nombre único**: el índice único sobre `nombre_clave`. Dos altas a la vez con el mismo nombre: una gana y la otra recibe el error de campo `repetido` (REQ-053).
- **Edición a la vez**: la versión (REQ-049).
- **Activación contra revocación, suspensión o baja.** La activación (fases 1 y 2) crea una conexión a partir de un código. Si comprueba el estado y después inserta sin cerrojo, puede crear una conexión activa en una licencia que se acaba de revocar. Se pide que tome los mismos cerrojos en el mismo orden (D-11), y D-5 lo impide además con un disparador.

### Lo que el conector tiene que cumplir (D-11)

1. Cada llamada a las tres herramientas y cada renovación, **también la respuesta repetida dentro de la ventana de gracia**, comprueba que la conexión y su licencia no están revocadas en la misma consulta que la atiende. Sin memoria intermedia de tokens válidos en la app ni delante de ella, y sin leer de réplicas (REQ-027, CA-019).
2. El estado que sirve sale de la regla única (D-7).
3. La activación rechaza, con el mismo mensaje, un código usado, anulado o caducado, y el de una licencia revocada, suspendida o caducada o de un cliente de baja (REQ-063). Toma los cerrojos en el orden de este diseño.
4. La caducidad del código la fija la base de datos al crearlo, a 15 minutos. La 001 dice 10 y hay que cambiarla, también en el texto de la pantalla (asunto A-5).
5. La revocación automática por credencial reutilizada usa la misma función interna que O-11, con el motivo `credencial_reutilizada`.
6. `ultimo_uso_en` se actualiza con el uso real de la conexión.
7. El HMAC de un código no puede coincidir con el de un token: el tipo entra en el cálculo, como ya hace la 001 con los tokens.
8. Los hechos sin persona H-03, H-04 y H-05 del inventario de la 024 los escribe la fase 2. La 022 no escribe hechos.
9. Si la 014 purga códigos antiguos, no purga pendientes; lo purgado deja de verse en la ficha y su rastro queda en la auditoría.

### Matriz de acceso de esta función

Para CA-022 y CA-044. «0» es cero filas o rechazo.

| Perfil | Lecturas L-1 a L-7 | Tablas de esta función, directamente | Operaciones O-1 a O-11 |
| --- | --- | --- | --- |
| Sin sesión | 0 | 0 | 0 |
| Usuario sin privilegios | 0 | 0 | `no_permitida`, sin efecto |
| Usuario de un cliente, con cualquier identificador (el suyo, otro, uno inexistente) | 0 | 0 en la fase 3 (asunto A-3) | `no_permitida`, sin efecto |
| Administrador con un solo factor, o con la sesión cerrada o caducada en el registro de la 021 | 0 | 0 | `no_permitida`, sin efecto |
| Administrador dado de baja | 0 | 0 | `no_permitida`, sin efecto |
| Administrador activo con sesión completa | Todas | Solo lectura, sin `codigo_hmac`; ninguna escritura | Todas |
| Rol del conector | 0 | 0 | 0 |

### Migración y vuelta atrás

| Migración | Contenido | Vuelta atrás |
| --- | --- | --- |
| M-1 | Tipos, columnas e índices de D-1 a D-4 | Si entra en las migraciones iniciales, es la de la tabla. Como alteración posterior: quita las columnas; solo sin datos reales |
| M-2 | `privado.clave_nombre()` y las funciones de estado (D-7) | Las elimina. Antes hay que quitar lo que dependa de ellas |
| M-3 | Lecturas y operaciones (D-8, D-9) | Las elimina y revoca sus permisos. El panel deja de poder cambiar nada: falla hacia el lado seguro |
| M-4 | Permisos de D-6 y disparadores de D-5 | **Su vuelta atrás devuelve la escritura directa y permite deshacer revocaciones.** No se revierte sola en un entorno con datos reales; solo junto con una versión de la app sin esta función. Se anota en la guía de operación |
| M-5 | Cambios en `auditoria` (D-10) | De la 010. En producción no se revierte |

La vuelta atrás de cada una se prueba aplicándola, revirtiéndola y volviéndola a aplicar con los datos ficticios cargados (PRUEBA-019). **Hoy no hay dónde ejecutar esa prueba.**

## Flujo

### Una acción con confirmación

1. El administrador pulsa la acción. La vista abre el diálogo con los datos que tiene; no pide nada al servidor.
2. Cancela: no ocurre nada. Confirma: `useAccion` bloquea el botón y envía la acción de servidor por `POST`.
3. La acción comprueba el origen y la sesión (`exigirAdministradorEnAccion()`), lee las entradas con su validador y llama a la operación con la credencial del usuario.
4. La base de datos ejecuta el esquema de «Operaciones» y contesta.
5. El servidor traduce la respuesta con la lista cerrada. La vista: con `hecha`, relee la sección y confirma con un aviso temporal; con `rechazada`, muestra el motivo en el diálogo y relee; con `no_permitida`, lo dice y relee; con `incierta`, deja un mensaje que permanece, con un botón que relee, y no permite repetir hasta haber releído (REQ-035).

### Instalar a un cliente

1. Alta del cliente (O-1): nace activo, sin licencia y con sus reglas por defecto. Estado «Sin licencia».
2. Crear licencia (O-5). Estado «Pendiente de activar».
3. Generar código (O-10). El instalador lo ve una vez y lo teclea en la pantalla de activación del asistente (fase 1).
4. La activación crea la conexión. La ficha la muestra al releer. Estado «Activo».

### Contener una credencial robada

1. En la ficha, «Revocar conexión» sobre la fila afectada, con su diálogo (O-11).
2. Desde que el panel confirma, toda llamada y toda renovación de esa conexión se rechazan. Las demás no cambian.
3. Si no se sabe cuál es, o son varias: «Revocar licencia» (O-8), que las revoca todas, y después licencia y activación nuevas.

### Baja y vuelta

1. «Dar de baja» (O-3): el agente recibe `suspendida` en su siguiente revisión; el código pendiente se anula; la ficha muestra el aviso de credenciales vivas si quedan conexiones.
2. «Reactivar cliente» (O-4): vuelve con su licencia y sus conexiones. Si hace falta un código, se genera uno nuevo.

### Cuando algo falla

| Fallo | Qué pasa |
| --- | --- |
| La base de datos no responde o falla durante una lectura | El bloque pasa a error con reintento. Nunca se pinta vacío, ni «Activo» por defecto, ni datos de antes como actuales |
| La base de datos falla a mitad de una operación | La transacción se deshace entera. Resultado `incierta`; la vista relee |
| No se puede escribir una fila de auditoría | Igual: no hay efecto |
| No se pueden guardar las reglas en el alta | No hay cliente, ni reglas, ni fila. El formulario dice que el cliente no se ha creado y ofrece reintentar |
| La respuesta de una operación no llega | `incierta`. No se da por hecha ni por fallida. Reintentar no duplica: el nombre es único, solo hay una licencia sin revocar, solo hay un código vivo y las transiciones repetidas son `ya_estaba_hecho` |
| La respuesta de generar un código no llega | El código se pierde. La ficha mostrará el pendiente si se creó; generar otro lo anula |
| La sesión deja de valer entre abrir el diálogo y confirmar | `no_permitida`, sin cambios (REQ-043). Lo que pase después con la sesión es de la 021 |
| El estado cambió entre abrir el diálogo y confirmar | La operación decide con el estado real: `ya_estaba_hecho`, `transicion_no_permitida`, `estado_cambiado`, `datos_desactualizados` o `confirmacion_no_coincide`. La vista relee y lo muestra |
| Llega un valor fuera de una lista cerrada | Estado: «Estado desconocido» y ninguna acción. Resultado de acción: `incierta` |
| La fuente de «Sin señal» y «En pausa» falla | La lista se muestra; esa columna dice que no se ha podido cargar |

## Auditoría de esta función

**Regla.** Cada fila la escribe la función de la operación, en su misma transacción. El actor es el de la sesión. Todas las filas de una acción llevan el mismo momento y las vinculadas apuntan a la principal. El objeto es el identificador de la fila; el cliente, el del objeto. **Ninguna fila lleva el código, su HMAC, un nombre, lo tecleado ni una fecha de caducidad** (REQ-034; REQ-018 de la 010). El inventario es el de la especificación de la 024 (`specs/024-auditoria/especificacion.md`, «Inventario de acciones de superadmin de la fase 3»).

| Entrada de la 024 | Operación | Fila | Objeto | Filas vinculadas |
| --- | --- | --- | --- | --- |
| I-01 Dio de alta un cliente | O-1 | Principal | El cliente | I-41, las reglas del cliente |
| I-02 Editó un cliente | O-2 | Principal | El cliente | — |
| I-03 Dio de baja un cliente | O-3 | Principal | El cliente | I-11, si había código pendiente |
| I-04 Reactivó un cliente | O-4 | Principal | El cliente | — |
| I-05 Creó una licencia | O-5 | Principal | La licencia | — |
| I-06 Suspendió una licencia | O-6 | Principal | La licencia | I-11, si había código pendiente |
| I-07 Reactivó una licencia | O-7 | Principal | La licencia | — |
| I-08 Revocó una licencia | O-8 | Principal | La licencia | I-12, una por cada conexión que estaba activa; I-11, si había código pendiente |
| I-09 Cambió la caducidad de una licencia | O-9 | Principal | La licencia | — |
| I-10 Generó un código de activación | O-10 | Principal | El código nuevo | I-11, el código que sustituye |
| I-11 Anuló un código de activación | O-3, O-6, O-8, O-10 | Siempre vinculada | El código anulado | — |
| I-12 Revocó una conexión | O-11; O-8 | Principal en O-11; vinculada en O-8 | La conexión | — |
| I-41 Guardó las reglas por defecto de un cliente nuevo | O-1 | Siempre vinculada | Las reglas del cliente | — |

- **Desajuste con el inventario** (H-7). La 024 solo prevé I-11 vinculada a I-10 y a I-08. Esta función la necesita también bajo I-06 e I-03 (REQ-069, CA-025). Se pide a la 024.
- **CA-025 dice «exactamente 1 fila» por acción.** Con el inventario, el alta deja dos (I-01 e I-41) y revocar una licencia con tres conexiones deja cuatro o cinco. Se lee como «exactamente una fila **principal**, más las vinculadas que fija el inventario» (decidido por delegación, DD-14): es la lectura que deja más rastro y la misma que la 021 propone para su caso equivalente.
- **No dejan fila**: las lecturas, un diálogo cancelado, una acción rechazada y una repetición sin efecto. Una acción `no_permitida` y un identificador que no corresponde al cliente de la ficha sí suman en la supervisión, con un código de lista cerrada y sin valores: son la señal de una sesión que hace lo que la interfaz no ofrece.
- **I-09** es una sola entrada para fijar, cambiar y quitar. La fila no dice cuál de las tres ni la fecha.

## Tareas previas: lo que hay que comprobar antes de construir

Van las primeras en el plan. Ninguna construye producto. Cada una deja evidencia en `evidencias/` y tiene regla de decisión.

| Tarea | Qué comprueba | Regla de decisión |
| --- | --- | --- |
| **T-P1** · Regla de nombres en el Postgres real | Versión, codificación y configuración regional del proyecto de desarrollo; que `privado.clave_nombre()` da, para todos los vectores de `tests/vectores/nombres.json`, la misma clave que `claveNombre()`; que se puede usar en una columna mantenida por la base de datos y en un índice único; que la restricción de caracteres rechaza todos los rangos de `caracteres.ts` | Todo coincide: se sigue. Las minúsculas dependen de la configuración regional o algún vector difiere: la función fija la intercalación de forma expresa o sustituye `lower()` por una tabla propia, y se repite. Si no se logra la igualdad, vuelve al arquitecto: no se construye una regla con dos resultados |
| **T-P2** · Campo de texto dentro del diálogo de alerta | Dentro de la PRUEBA-011 de la 020: foco, anuncio de la coincidencia, `aria-disabled`, pegar y 120 caracteres a 320 píxeles, en los tres motores | Pasa: se sigue. Falla: se aplica la alternativa de diálogo de la 020 y se repite |
| **T-P3** · El código no sale por ningún otro sitio | Sobre la compilación de producción, con un código marcado: aparece solo en el cuerpo de la respuesta de su acción; no aparece en ninguna otra respuesta (documento, carga serializada, navegación, recarga), ni en la salida del proceso, ni en lo que capture la herramienta de supervisión que la fase 1 elija (V-112, en VERIFICAR). La respuesta lleva `no-store`. Copiar funciona en los tres motores | Aparece en otro sitio: la tarea vuelve al arquitecto antes de construir `DialogoCodigo` |
| **T-P4** · Forma de exponer las operaciones | La que fije la 010 para la 021 vale para las once operaciones y las siete lecturas, con funciones que no están en un esquema expuesto | Si la 010 no la fija, esta función no pasa de la etapa A |

## Amenazas de esta función

Ninguna prueba se ha ejecutado. Las referencias A-nn son las de `docs/SEGURIDAD.md`. Donde queda un riesgo, se dice.

| N.º | Amenaza | Control | Prueba que lo demuestra |
| --- | --- | --- | --- |
| AM-01 | Una sesión de superadmin comprometida genera un código y conecta su propio asistente: recibe el prompt y las reglas del cliente (A-01, A-11) | El acceso de la 021 (doble factor, registro de sesiones, corte inmediato); un solo código vivo y 15 minutos; fila I-10 con el actor; la conexión nueva se ve en la ficha y queda como hecho H-03; se revoca al momento. **Riesgo que queda:** la alerta por conexión nueva es de la fase 4; hasta entonces solo se detecta mirando la ficha o la auditoría (asunto A-8) | PRUEBA-017, PRUEBA-021 |
| AM-02 | El código acaba en registros, direcciones, historial, mensajes de error, supervisión, auditoría o datos guardados (artículo 4) | Solo viaja en el cuerpo de la respuesta de su generación; no se pasa a `registro.ts`; los errores son códigos; la auditoría anota el identificador de la fila; solo se guarda el HMAC. La supervisión depende de V-112, sin verificar | PRUEBA-025, T-P3 |
| AM-03 | Volver a ver un código: recargar, volver atrás, otra pestaña, otro administrador, leer los datos con la sesión | Vive solo en la memoria de `DialogoCodigo`; `no-store` y recarga al restaurar la página (021); `codigo_hmac` no se puede leer; ninguna lectura lo devuelve. **Riesgo que queda:** el portapapeles del administrador y lo que su equipo capture de la pantalla. Lo acota que el código vale 15 minutos y una vez | PRUEBA-013, PRUEBA-021 |
| AM-04 | Doble envío, o dos administradores a la vez: dos códigos vivos, o un código ya anulado en pantalla | «Pendiente esperado», cerrojo de la licencia e índice único de un código vivo | PRUEBA-016, PRUEBA-021 |
| AM-05 | Fuerza bruta del código (A-02) | Entropía y límite de intentos: fases 1 y 2. Esta función reduce la superficie: un solo código vivo por licencia y 15 minutos | De la fase 2 |
| AM-06 | Llamar a la operación de generar directamente, con la sesión, con un HMAC elegido | Sin la clave, que no está en la base de datos, nadie conoce un código cuyo HMAC sea ese; ningún HMAC guardado se puede leer para reutilizarlo; el HMAC es único y su tipo entra en el cálculo. **Lo que sí consigue:** anular el pendiente y dejar un código inservible, con su fila de auditoría. Es lo mismo que puede hacer generando uno normal | PRUEBA-016 |
| AM-07 | Identificador de una licencia, un código o una conexión de otro cliente, o inexistente (artículo 2) | Cada operación comprueba dentro de la base de datos que el objeto es del cliente indicado; un solo resultado para los dos casos; cuenta en la supervisión | PRUEBA-023 |
| AM-08 | Un usuario de cliente, un usuario sin privilegios o un administrador con un solo factor lee o actúa; el identificador de un cliente se toma por permiso (A-07, A-11) | Guardia en cada página y acción; `es_admin()` en cada lectura y en cada operación; lecturas que no dependen de políticas ajenas | PRUEBA-013, PRUEBA-022 |
| AM-09 | Con la sesión de un superadmin, escribir directamente en la API de datos sin pasar por el servidor: mover una licencia a otro cliente, deshacer una revocación, reabrir un código, cambiar un autor, borrar | Ningún permiso de escritura sobre las tablas (D-6); disparadores de inmutabilidad (D-5) | PRUEBA-014 |
| AM-10 | Una función con privilegios, ejecutable por cualquier usuario con sesión, tiene un fallo: un usuario de cliente de la fase 5 podría revocar o generar | Primera instrucción, `es_admin()`; `search_path = ''`; esquema no expuesto; sin SQL construido con texto; cada función se prueba con cada perfil de la matriz; dictamen del auditor en cada cambio | PRUEBA-013 |
| AM-11 | La revocación no corta al momento: un token dado por bueno en memoria, la respuesta repetida de la ventana de gracia o una lectura de réplica (A-01, A-06) | D-11, punto 1. Es de la fase 2; este diseño lo exige y lo prueba | PRUEBA-027 |
| AM-12 | Una activación que coincide con una revocación, una suspensión o una baja deja una conexión viva donde no debe | Mismo orden de cerrojos en la activación; disparador que impide una conexión activa en una licencia revocada; el conector comprueba la licencia en cada llamada | PRUEBA-018 y pruebas de la fase 2 |
| AM-13 | Se revoca la licencia del cliente equivocado: nombres parecidos, o un diálogo abierto con datos ya viejos | Nombre único por clave; caracteres invisibles rechazados; distintivo en cada diálogo; nombre tecleado y comprobado en la base de datos contra el nombre actual. **Riesgo que queda:** letras de otro alfabeto que se ven iguales | PRUEBA-001, PRUEBA-009, PRUEBA-021 |
| AM-14 | Un nombre de cliente ejecuta código en el área de superadmin. Con la sesión de quien lo mira, podría generar códigos o revocar (A-21) | `TextoDato` y `textoPlano()` en lista, ficha, diálogos, avisos y nombres accesibles; ninguna dirección ni atributo construido con un dato; `dangerouslySetInnerHTML` prohibido. La política de contenido es de la 021 y **no está demostrada** (su asunto A-2): mientras no lo esté, el escapado es el control principal | PRUEBA-012 |
| AM-15 | Una acción enviada desde otro sitio; una página incrustada en otra (A-21) | `SameSite=Strict`, `comprobarOrigen()` y solo `POST` (021); cabeceras de la 002 | PRUEBA-023 |
| AM-16 | Campos de más para cambiar estado, canal, cliente, autor o fechas | Entradas de lista cerrada; operaciones con parámetros fijos; el autor y las fechas los pone la base de datos | PRUEBA-003, PRUEBA-023 |
| AM-17 | El texto buscado o el nombre tecleado quedan en direcciones, historial o registros. El nombre de un autónomo es un dato personal (artículo 1) | Viajan en el cuerpo (V-3); no se guardan ni se registran; con búsqueda activa no se escribe nada en la dirección | PRUEBA-020, PRUEBA-025 |
| AM-18 | Un fallo enseña algo falso: vacío en lugar de error, un estado por defecto, datos de antes como actuales, o datos ficticios en producción (artículo 3) | `BloqueDatos` y `leerDelArea()`; estado desconocido sin acciones; todo resultado no reconocido es `incierta`; la fuente del producto es fija y la ficticia no se puede importar desde él | PRUEBA-005, PRUEBA-006, PRUEBA-024 |
| AM-19 | Una acción sin rastro, un rastro sin acción, o una segunda vía que no audita | Efecto y auditoría en la misma transacción; sin escrituras fuera de las operaciones. **Segunda vía conocida:** la orden de operación `generar_codigo` de la 001 (asunto A-6) | PRUEBA-017 |
| AM-20 | La clave secreta se usa para leer o escribir datos de clientes (A-10) | Ninguna pieza importa `admin.ts`; todo va con la sesión del usuario | PRUEBA-005 |
| AM-21 | Jugar con el tiempo: alargar un código, fijar una caducidad pasada, usar el reloj del navegador | El reloj es el de la base de datos; los 15 minutos son una restricción de la tabla; `caduca_en` de un código es inmutable | PRUEBA-014, PRUEBA-016 |
| AM-22 | Averiguar si un cliente existe sin ser administrador, por la respuesta o por el tiempo | La guardia decide antes de cualquier consulta; denegado, inexistente y mal formado responden igual (V-1) | PRUEBA-022 |
| AM-23 | Un cliente dado de baja conserva credenciales que se siguen renovando. Lo aceptó el responsable en la cuestión 7 | Los tres avisos del diálogo (REQ-067), el aviso permanente de la ficha y la revocación siempre disponible. **Riesgo que queda**, declarado: si nadie revoca, esas credenciales viven mientras se renueven | PRUEBA-009 |
| AM-24 | Un administrador, legítimo o suplantado, revoca en cadena o anula códigos generando otros | Es inherente al papel. Queda auditado con su actor y la 021 corta su sesión al darlo de baja. Esta función no pone un límite de ritmo | PRUEBA-017 |
| AM-25 | Comodines o textos largos en la búsqueda para forzar consultas caras o alterar la consulta | Parámetros, nunca texto concatenado; comodines tratados como caracteres; 120 caracteres como mucho | PRUEBA-002 |
| AM-26 | Instrucciones dentro de un nombre de cliente o de documentación leída al diseñar (A-16, artículo 7) | Son datos. Un nombre no cambia el comportamiento de nada | Revisión |
| AM-27 | Copia de la base de datos (A-05) | Solo HMAC, con la clave fuera. Es de las fases 1 y 2 | De la fase 2 |

## Pruebas

### Dónde se ejecuta cada tipo

| Tipo | Dónde | Estado hoy |
| --- | --- | --- |
| Unitaria y estática (Vitest) | Batería local de la 002 | Cuando exista la app |
| En navegador sobre la muestra, con datos ficticios | En local, sobre la compilación de producción | Cuando existan la app y la 020. **No necesita la fase 2** |
| En navegador contra la base de datos de desarrollo | En local, con las migraciones y los datos ficticios cargados, y cuentas de prueba de la 021 | Depende de la fase 2 y de la 021 |
| De base de datos (pgTAP) | **Ningún sitio**: no hay Docker ni CI remoto | **No se pueden ejecutar** (asunto A-4) |
| Con agente de prueba | Entorno de desarrollo con el conector de la fase 2 | No existe |
| En el entorno previo | Cuando exista (D-016, V-114) | No existe |
| Persona | `disenador-ui`, con la guía de revisión manual de la 020 | — |

Los fallos de la base de datos se provocan en las pruebas de navegador con un intermediario local delante de la API de datos, que corta, retrasa o altera respuestas; y en las de base de datos, con una restricción que solo existe en la prueba. No hay ganchos de prueba en el producto.

### Lista de pruebas

| Prueba | Qué comprueba | Tipo | Etapa |
| --- | --- | --- | --- |
| PRUEBA-001 | `validarNombre()` y `claveNombre()` con los vectores compartidos: todos los casos de CA-002, CA-035 y CA-043; longitud en puntos de código; cada rango de `caracteres.ts`. Avisa si el motor conoce caracteres de control, de formato o no visibles que la lista no tiene | Unitaria | A |
| PRUEBA-002 | Los mismos vectores contra `privado.clave_nombre()` y la restricción de la tabla; búsqueda con comodines; nombre repetido en alta y en edición; 20 repeticiones de dos altas a la vez con el mismo nombre | Base de datos | B |
| PRUEBA-003 | Validadores de cada acción: lista cerrada, campos de más que no se leen ni se registran, batería de frecuencias, formas no planas | Unitaria | A |
| PRUEBA-004 | `fecha-madrid.ts`: conversión, hora que no existe, hora que se repite, pasado, más de 10 años | Unitaria | A |
| PRUEBA-005 | Importaciones prohibidas; guardia como primera instrucción de cada página y acción de esta función (amplía la PRUEBA-003 de la 021); ninguna caché de datos; ningún `loading`, `not-found` anidado ni `generateMetadata`; no existe ninguna operación de borrado; la fuente ficticia no se importa desde el producto. Con casos trampa que deben hacerla fallar | Estática | A |
| PRUEBA-006 | Contrato de `FuenteClientes`: formas de cada lectura y operación; todo resultado no reconocido es `incierta`; todo estado no reconocido es `desconocido`. Se ejecuta contra la fuente ficticia y, después, contra la real | Unitaria y navegador | A y B |
| PRUEBA-007 | Lista sobre la muestra: seis estados con su palabra, los cinco datos, «Sin señal» y «En pausa» solo donde tocan, controles de orden, texto de posición, y que el texto buscado no llega a la dirección ni al historial | Navegador, ficticios | A |
| PRUEBA-008 | Ficha sobre la muestra: el caso de CA-004; códigos en los cuatro estados; conexiones de los dos asistentes y con los tres motivos; las tres combinaciones de causas; canal en lectura; marco de las reglas; ningún código y ningún control de reglas ni de canal | Navegador, ficticios | A |
| PRUEBA-009 | Los siete diálogos: aparecen, dicen qué, a quién, cuándo y si se deshace, y cancelar no llama a nada; los tres avisos de la baja; la confirmación tecleada con un nombre de 120 caracteres (10 intentos que no actúan, 3 que sí, solo con teclado, anuncios); `DialogoCodigo` abierto 10 minutos, copia con teclado, no se cierra con Escape, sustitución al caducar; aviso permanente de baja | Navegador, ficticios | A |
| PRUEBA-010 | `axe` sin infracciones A ni AA en lista, ficha, los dos formularios y todos los diálogos, en cada estado; 320 píxeles sin desplazamiento de página y con todas las acciones; capturas de los cinco estados de la lista, la ficha y cada sección; revisión con teclado y lector de pantalla | Navegador y persona | A |
| PRUEBA-011 | Revisión de textos (español de España, tú, formatos) y de todos los mensajes de error de esta función en `textos.ts` | Revisión, con búsqueda automática de apoyo | A |
| PRUEBA-012 | Los 10 nombres de CA-006 en lista, ficha, diálogos y avisos: se ven literalmente y no se ejecuta nada; la cadena testigo se busca también en el HTML crudo y en la carga serializada. Se repite con la base de datos real para comprobar que se guardan sin cambios | Navegador | A y B |
| PRUEBA-013 | Matriz de acceso: cada perfil contra cada lectura, cada tabla y cada operación. Cero filas, escrituras rechazadas y operaciones `no_permitida` sin efecto. `codigo_hmac` ilegible también para el superadmin. Se ejecuta con sesiones de usuario, nunca con la clave secreta | Base de datos | B |
| PRUEBA-014 | Con sesión de superadmin, escritura directa: insertar, cambiar y borrar en las cuatro tablas; cambiar el cliente de una licencia, la licencia de un código o de una conexión, el autor de un código; quitar o cambiar una revocación o su motivo; quitar un uso o una anulación, cambiar su fecha, alargar un código caducado. Y los disparadores, con un rol con permiso de escritura | Base de datos | B |
| PRUEBA-015 | Licencia: una sola sin revocar, 20 repeticiones de dos creaciones a la vez; la tabla de transiciones entera, también con el cliente de baja; las causas, con la de cobro simulada, y 10 intentos de un proceso automático que no quitan la manual | Base de datos | B |
| PRUEBA-016 | Códigos: condiciones para generar; pendiente esperado; 20 repeticiones de dos generaciones a la vez; anulación al revocar, suspender y dar de baja; el código anulado sigue anulado tras reactivar; 15 minutos por restricción | Base de datos | B |
| PRUEBA-017 | Para cada una de las 11 operaciones: exactamente una fila principal correcta y las vinculadas del inventario; ningún código, HMAC, nombre ni fecha en las filas. Con un fallo provocado en cada paso (incluidas la auditoría y las reglas del alta): ningún efecto. Repeticiones sin efecto: cero filas. Al final, cero clientes sin reglas | Base de datos | B |
| PRUEBA-018 | 20 repeticiones de suspender y revocar a la vez, de reactivar y revocar a la vez, y de dos ediciones a la vez: ningún estado final imposible y ningún cambio perdido sin aviso | Base de datos | B |
| PRUEBA-019 | Vuelta atrás de cada migración | Base de datos | B |
| PRUEBA-020 | Lista y ficha con datos reales: CA-001; con 1.000 clientes, los seis órdenes, las búsquedas de CA-002, las páginas y el total, y 10 búsquedas sin rastro en la dirección ni en el historial; CA-004; formularios con exactamente dos campos y 20 altas con sus cinco reglas por defecto; CA-016, CA-018 y CA-039. Incluye las pruebas contrato de V-1 a V-4 de la 020 con estas direcciones | Navegador, base de datos | B |
| PRUEBA-021 | Cada acción desde la interfaz: confirmar produce el efecto; cancelar deja cero cambios y cero filas; repetir da «ya estaba hecho»; dos envíos de la misma generación en menos de 100 ms dan un código; aviso de pendiente; el código no se vuelve a ver por las cinco vías de CA-015; los cuatro rechazos de CA-031; CA-046 | Navegador, base de datos | B |
| PRUEBA-022 | Las cuatro sesiones de CA-022 en cada página y cada acción, en carga completa, en navegación y por llamada directa; con el identificador propio, el de otro cliente y uno inexistente (CA-044); una sesión que pierde el segundo factor antes de confirmar | Navegador, base de datos | B |
| PRUEBA-023 | Identificadores de otro cliente o inexistentes en cada acción, con el mismo mensaje; cinco campos de más en cada formulario y acción; un canal distinto en cada petición; acción desde otro origen; páginas dentro de un marco | Navegador, base de datos | B |
| PRUEBA-024 | Fallos provocados y respuestas que no llegan en cada una de las 11 acciones: «resultado desconocido», relectura, reintento sin duplicar, ningún código mostrado sin guardar; los tres fallos del alta de CA-048 | Navegador, base de datos | B |
| PRUEBA-025 | Tras 20 generaciones y usos, con errores provocados: cada código, cero veces en la salida del servidor, la supervisión, la auditoría, las direcciones visitadas, el historial y todas las tablas. Lo mismo con los textos buscados y los nombres tecleados | Navegador y búsqueda | B; los registros de la plataforma, en el entorno previo |
| PRUEBA-026 | Con agente de prueba: baja y reactivación; suspender y reactivar; revocar licencia durante 5 minutos; caducidad a 2 minutos; los ocho casos de códigos; la respuesta al agente es idéntica antes y después de editar el cliente | Con agente | C |
| PRUEBA-027 | CA-019: 20 repeticiones, primera llamada en menos de 1 segundo, 5 minutos sin una sola llamada ni renovación aceptada, las otras dos conexiones al 100 %. Volver a conectar exige código nuevo y crea otra conexión | Con agente | C |
| PRUEBA-028 | 200 mediciones de cada operación de CA-003 con 1.000 clientes y la ficha grande | Entorno previo | D |
| PRUEBA-029 | Revisión de privacidad con la skill `revision-privacidad`: vistas, mensajes, registros, auditoría | Revisión | B |

### Cada criterio, con su prueba y cuándo se puede cerrar

«Cierra en» es la primera etapa en la que el criterio entero puede tener evidencia. Lo anterior es evidencia parcial y no lo cierra.

| Criterio | Pruebas | Cierra en | Qué falta hoy |
| --- | --- | --- | --- |
| CA-001 | 007, 020 | B | Migraciones y datos ficticios |
| CA-002 | 001, 002, 007, 020 | B | Lo mismo, y sitio para pgTAP |
| CA-003 | 028 | D | Entorno previo |
| CA-004 | 008, 020 | B | Migraciones; el marco de reglas lo llena la 025 |
| CA-005 | 017, 020, 026 | C | Conector de la fase 2 |
| CA-006 | 012 | B | Migraciones |
| CA-007 | 026 | C | Conector |
| CA-008 | 005, 014 | B | Sitio para pgTAP |
| CA-009 | 015 | B | Sitio para pgTAP con varias conexiones |
| CA-010 | 026 | C | Conector |
| CA-011 | 008, 015 | B | Sitio para pgTAP |
| CA-012 | 014, 015, 026 | C | Conector y pgTAP |
| CA-013 | 004, 026 | C | Conector |
| CA-014 | 016, 026 | C | Conector |
| CA-015 | 009, 021 | B | Migraciones y la 021 |
| CA-016 | 008, 020 | B | Migraciones |
| CA-017 | 025 | B, y D para los registros de la plataforma | V-112 sin verificar; entorno previo |
| CA-018 | 008, 020 | B | Migraciones |
| CA-019 | 027 | C | Conector |
| CA-020 | 005, 014, 027 | C | Conector y pgTAP |
| CA-021 | 009, 021 | B | Migraciones |
| CA-022 | 013, 022 | B | pgTAP y la 021 |
| CA-023 | 005, 013 y revisión del `revisor` | B | pgTAP |
| CA-024 | 017, 024 | B | pgTAP |
| CA-025 | 017 | B | pgTAP; lectura DD-14 |
| CA-026 | 011 | A | La app y la 020 |
| CA-027 | 010 | A | La app y la 020 |
| CA-028 | 010 | A | La app y la 020 |
| CA-029 | 010 | A | La app y la 020 |
| CA-030 | 011 | A | La app y la 020 |
| CA-031 | 016, 021 | B | Migraciones |
| CA-032 | 016, 021 | B | Migraciones |
| CA-033 | 017, 021 | B | Migraciones |
| CA-034 | 018 | B | pgTAP con varias conexiones |
| CA-035 | 001, 002, 003 | B | pgTAP con varias conexiones |
| CA-036 | 003, 023 | B | Migraciones |
| CA-037 | 014, 023 | B | pgTAP |
| CA-038 | 023 | B | La 021 y la 002 |
| CA-039 | 008, 020, 023 | B | Migraciones |
| CA-040 | 026 | C | Conector |
| CA-041 | 009, 011 | A | La app y la 020 |
| CA-042 | 016, 021 | B | pgTAP con varias conexiones |
| CA-043 | 001, 009, 010 | A | La app, la 020 y T-P2 |
| CA-044 | 013, 022 | B | pgTAP, la 021 y el asunto A-1 |
| CA-045 | 014 | B | pgTAP |
| CA-046 | 016, 021, 026 | C | Conector, para «no crea conexión» |
| CA-047 | 007 | A | La app y la 020. El criterio pide datos ficticios de la 023 |
| CA-048 | 017, 024 | B | pgTAP |

**Consecuencia.** En la etapa A se pueden cerrar ocho criterios (CA-026 a CA-030, CA-041, CA-043 y CA-047). Los otros cuarenta necesitan la fase 2, y de ellos diez necesitan además el conector y uno el entorno previo. Mientras no haya dónde ejecutar pgTAP, ningún criterio de base de datos se puede dar por superado, y la función no puede pasar a VERIFICADA (artículo 13).

## Valores que fija este diseño

Los de la especificación (25 filas, 15 minutos, 120 caracteres, de 1 a 168 horas, 2 segundos) no se repiten. Estos son nuevos y se aprueban con el diseño:

| Valor | Cuánto | Por qué |
| --- | --- | --- |
| Texto de búsqueda | 120 caracteres como mucho | El largo máximo de un nombre |
| Página de la lista | De 1 a 10.000 | Entrada acotada |
| Códigos y conexiones en la ficha | De 25 en 25 | El tamaño común de la 020; la ficha de referencia tiene 200 y 50 |
| Caducidad de una licencia | Precisión de minuto; 10 años como máximo | Entrada acotada |
| Plazo de una acción sin respuesta | 30 segundos, el de `useAccion` | 020 |
| Anuncio de la coincidencia del nombre | Solo al cambiar de valor | Para no saturar al lector de pantalla |

**Rendimiento (REQ-006), sin medir.** La lista es una consulta que calcula el estado de, como mucho, 1.000 clientes y devuelve 25; no hace falta ninguna extensión de búsqueda ni tabla precalculada. Se piden estos índices: único sobre `nombre_clave`; licencias sin revocar por cliente; conexiones sin revocar por licencia; códigos por licencia y fecha; conexiones por licencia y fecha. La ficha hace la consulta de la guardia, la del cliente y las cuatro secciones a la vez. Si PRUEBA-028 no da el umbral, la tarea vuelve al arquitecto.

## Decisiones por delegación (D-019)

Tomadas por el arquitecto con la opción de más seguridad y calidad. Ninguna toca lo reservado a una persona. El orquestador las pasa a `aclaraciones.md` para que el responsable pueda revisarlas.

| N.º | Decisión | Motivo, en una línea |
| --- | --- | --- |
| DD-01 | Toda escritura pasa por una función de la base de datos; la sesión no tiene permisos de escritura sobre las tablas; disparadores de inmutabilidad como segunda capa | Es la única forma de que REQ-057, REQ-060, REQ-061 y REQ-076 se cumplan también contra la API de datos |
| DD-02 | Generar un código solo anula el pendiente que el administrador tenía delante; si hay otro, se rechaza | Evita dejar en pantalla un código ya anulado y da un solo código con dos envíos |
| DD-03 | Un código vivo por licencia: índice único además del cerrojo | La especificación pide que lo garantice la base de datos; el índice se puede demostrar con una prueba |
| DD-04 | El HMAC de un código no se puede leer con ninguna sesión | Mínimo privilegio: el panel no lo necesita para nada |
| DD-05 | «Tilde» son los acentos agudo, grave y circunflejo; cualquier otro signo distingue letras | Una regla sin excepciones por letra, coherente con que «ñ» y «ü» sean distintas |
| DD-06 | Se rechazan todos los caracteres de control, de formato y no visibles; los espacios de otro tipo se admiten y se igualan al comparar | Cierra los nombres indistinguibles sin estorbar al pegar un nombre real |
| DD-07 | El nombre de un cliente de baja sigue reservado | La baja se puede deshacer; si no, la reactivación podría chocar con otro cliente |
| DD-08 | El nombre tecleado se comprueba también en la base de datos, contra el nombre actual | Un control que solo está en el navegador no es un control |
| DD-09 | Con el cliente de baja, la licencia solo admite la revocación | Ante la duda, se deniega; la especificación solo nombra las revocaciones como permitidas |
| DD-10 | La hora que no existe o que se repite por el cambio de hora se rechaza; 10 años como máximo | No se elige un instante en silencio; la entrada queda acotada |
| DD-11 | El diálogo del código solo se cierra con su botón y sustituye el código cuando caduca | Es la única vez que se ve; no se entrega un código muerto |
| DD-12 | La búsqueda se envía de forma expresa y, mientras está activa, nada va a la dirección | Menos peticiones, sin cambios inesperados al teclear y sin texto en el historial |
| DD-13 | Orden por estado: de «Activo» a «Dado de baja» | Orden fijo y conocido, de más a menos operativo |
| DD-14 | CA-025 se lee como una fila principal más las vinculadas del inventario | Más rastro, y coherencia con la 024 y la 021 |
| DD-15 | La fuente ficticia no existe en el producto ni se elige por configuración | Un interruptor así podría dejar datos falsos en producción |
| DD-16 | Aviso permanente en la ficha de un cliente de baja con conexiones activas | Hace visible el riesgo que el responsable aceptó, más allá del diálogo |
| DD-17 | Las lecturas comprueban `es_admin()` por sí mismas | No dependen de las políticas que la fase 5 añada a las tablas |
| DD-18 | El texto de posición es el común de la 020 | Un solo formato en todo el panel |
| DD-19 | Revocar una licencia ya revocada responde «ya estaba hecho» | Se rechaza igual, con un mensaje más claro |

## Cobertura de requisitos

| Requisitos | Dónde se resuelven |
| --- | --- |
| REQ-001, REQ-002, REQ-078 | «Lista de clientes»; «Estado derivado»; L-1 y L-7 |
| REQ-003 a REQ-005 | «Lista de clientes» (orden, búsqueda, paginación) |
| REQ-006 | «Rendimiento»; PRUEBA-028 |
| REQ-007, REQ-065 | «Ficha de cliente»; `secciones.ts`; L-2 a L-5 |
| REQ-074 | «Rutas y pantallas»; «Matriz de acceso»; asunto A-1 |
| REQ-008, REQ-009, REQ-054, REQ-079 | «Formularios de alta y edición»; O-1 y O-2 |
| REQ-077, REQ-051 a REQ-053 | «Regla de nombres»; D-1; T-P1 |
| REQ-010 | `TextoDato` en lista, ficha, diálogos y avisos; AM-14 |
| REQ-011, REQ-066, REQ-067 | O-3 y O-4; «Diálogos de confirmación»; aviso permanente |
| REQ-012, REQ-059 | D-6; ninguna operación borra; PRUEBA-005 y PRUEBA-014 |
| REQ-013, REQ-014, REQ-050 | D-2; O-5; «Cerrojos y simultaneidad» |
| REQ-015 a REQ-017, REQ-072 | D-2; O-6 y O-7; «Estado derivado»; «Transiciones de la licencia» |
| REQ-018, REQ-060, REQ-073 | O-8; «Transiciones de la licencia»; D-5 |
| REQ-019 | O-9; «Fecha de caducidad»; «Estado derivado» |
| REQ-020, REQ-044 | O-10; «Transiciones de la licencia» |
| REQ-045, REQ-068, REQ-075 | «Generación y diálogo del código»; D-3 |
| REQ-069, REQ-070 | O-3, O-6, O-8 y O-10; I-11 |
| REQ-021, REQ-022, REQ-046 | `DialogoCodigo`; D-3 |
| REQ-023 | Sección de códigos; L-4 |
| REQ-024 | «Dónde no puede aparecer»; T-P3 |
| REQ-025 | Sección de conexiones; L-5; D-4 |
| REQ-026 a REQ-029, REQ-061 | O-11; D-5; D-11 |
| REQ-030, REQ-071 | «Diálogos de confirmación»; «Confirmación tecleada» |
| REQ-031, REQ-041 a REQ-043 | «Principio»; guardia de la 021; paso 1 de «Operaciones»; «Matriz de acceso» |
| REQ-032 | «Importaciones prohibidas»; `fuente-bd.ts` |
| REQ-033, REQ-058, REQ-062 | «Operaciones» (una transacción); «Cuando algo falla» |
| REQ-034 | «Auditoría de esta función» |
| REQ-035 | «Una acción con confirmación», paso 5; alta `incierta` |
| REQ-036 | «Contratos»: solo códigos de lista cerrada; regla V-6 |
| REQ-037 a REQ-040 | Componentes, estados y formatos de la 020 en cada vista; «Confirmación tecleada» |
| REQ-047 | Paso 4 de «Operaciones» |
| REQ-048, REQ-049 | «Cerrojos y simultaneidad»; versión del cliente |
| REQ-055 | «Contratos»: entradas de cada acción |
| REQ-056 | Paso 3 de «Operaciones»; `no_encontrado` |
| REQ-057, REQ-076 | D-3, D-5 y D-6 |
| REQ-063 | D-11, punto 3 |
| REQ-064 | Controles de la 021 y de la 002; AM-15 |

Los 79 requisitos están en la tabla. Los 48 criterios, en «Cada criterio, con su prueba».

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | El único texto que se guarda es el nombre comercial, que `docs/ARQUITECTURA.md` ya admite. No hay notas, motivos ni observaciones. El texto buscado y el nombre tecleado no se guardan ni se registran. La auditoría no lleva nombres ni valores |
| 2 Aislamiento | **Cumple solo con la nota aclaratoria aplicada** | El identificador del cliente va en la dirección y en las operaciones para elegir sobre quién se actúa, nunca como permiso. El texto vigente del artículo dice que «nunca se acepta como entrada». El responsable eligió la nota el 12/11/2026, pero no está en la constitución. Sin ella, este punto es un incumplimiento y, por tanto, BLOQUEANTE (asunto A-1) |
| 3 Cierre en fallo | Cumple | Guardia y `es_admin()` deniegan ante cualquier duda; todo resultado no reconocido es `incierta`; un fallo de lectura es un error, nunca un vacío; un estado desconocido no ofrece acciones; no hay fuente ficticia en el producto |
| 4 Secretos | Cumple | Ningún secreto nuevo. El código se guarda solo como HMAC y la clave sigue fuera de la base de datos. Depende de V-112 para la supervisión |
| 5 Especificación | Cumple | Especificación aprobada; cada requisito tiene apartado y cada criterio, prueba. Las tareas son del plan |
| 6 Revisión independiente | Cumple | Este diseño no se aprueba a sí mismo: falta el dictamen del `auditor-seguridad` y la puerta P1 |
| 7 Entradas no confiables | Cumple | Los nombres, lo tecleado, los identificadores y las respuestas de la base de datos se validan contra listas cerradas. La documentación leída se trató como datos |
| 8 Límites en el anfitrión | No aplica | Esta función no entrega nada al agente. Solo cambia qué estado se le sirve, y ninguno relaja sus límites |
| 9 Prompt por despliegue | No aplica | No toca el prompt ni el canal |
| 10 Producto final | Cumple, con condiciones abiertas | Accesibilidad, cinco estados, errores, simultaneidad y operación forman parte del diseño. Condiciones: la política de contenido de la 021 (su asunto A-2) y los criterios que hoy no tienen dónde ejecutarse |
| 11 Reversibilidad | Cumple, con un límite declarado | Cada migración tiene vuelta atrás y prueba. La de permisos y disparadores no se revierte sola. Las revocaciones son definitivas porque lo pide la especificación; la baja y la suspensión se deshacen |
| 12 Español | Cumple | Pantallas, textos, tablas, funciones, archivos y este documento |
| 13 Evidencias honestas | Cumple | Nada se da por probado. Se dice qué criterios no se pueden cerrar y por qué |
| 14 Cambios reservados | Cumple | No se toca la constitución, los permisos, el CI ni los secretos. La nota del artículo 2 y los cambios en documentos compartidos se piden; no se hacen |

Un posible incumplimiento: el artículo 2, mientras la nota no esté aplicada.

## Dependencias nuevas

**Ninguna.** No se añade librería de fechas (basta `Intl`, como en la 020), ni de validación (V-109 sigue en VERIFICAR; bastan validadores propios), ni de búsqueda, ni extensión de Postgres. `@supabase/supabase-js` es de la 021; Radix, Playwright y `axe`, de la 020. `normalize()` y `lower()` son funciones de Postgres (documentación de PostgreSQL 18, `functions-string`, leída el 14/11/2026); qué versión tiene el proyecto de desarrollo no se ha comprobado (T-P1).

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Escribir en las tablas desde el servidor con la sesión y RLS, como permite el modelo de referencia | Un cambio de varias filas con su auditoría no es atómico desde fuera, y las transiciones prohibidas quedarían a merced de cada llamada |
| Guardar el estado de la licencia en una columna | Dos causas de suspensión y la caducidad obligarían a recalcularlo en cada cambio, y una tarea tendría que «pasar» las licencias a caducadas |
| Un solo mecanismo con el `estado_manual` del modelo | Descartado por el responsable en la cuestión 9 |
| Anular siempre el pendiente al generar | Con dos envíos, el primero queda en pantalla ya anulado |
| Una clave de repetición enviada por el navegador para generar | Otra entrada y otra columna; el «pendiente esperado» resuelve lo mismo con un dato que ya existe |
| Volver a mostrar el código mientras no caduque | Exigiría guardarlo de forma reversible. Contradice REQ-022 |
| Sortear el código en la base de datos | La clave del HMAC tendría que estar en la base de datos (A-05) |
| Comparar nombres con la extensión `unaccent` o con una intercalación sin acentos | Igualan «ñ» y «n» |
| Rechazar los caracteres no visibles con una propiedad del motor de expresiones | Su lista cambia con la versión del navegador, de Node y de Postgres; dos implementaciones dejarían de coincidir sin aviso |
| Búsqueda en cada pulsación | Más peticiones y cambios de contenido mientras se escribe |
| La búsqueda en la dirección | Prohibido por REQ-004 y por la regla V-3 |
| Elegir cliente sin identificador en la dirección (por ejemplo, guardándolo en la sesión) | La ficha no se podría enlazar desde la auditoría ni desde el resumen, y el identificador seguiría siendo una entrada |
| Alta y edición en un diálogo | Peor a 320 píxeles y con errores junto al campo |
| Una casilla «Entiendo que no se puede deshacer» en lugar de teclear | Descartada por el responsable en la cuestión 8 |
| Botón de revocar desactivado de verdad hasta que coincida el nombre | Un botón desactivado no recibe el foco: quien usa lector de pantalla no sabe que existe ni por qué no actúa |
| Cerrar el diálogo del código con Escape | Un Escape por error pierde la única vista del código |
| Una fuente ficticia que se activa con una variable de entorno | Podría quedar activa en producción |
| Revocar en bloque | Fuera de alcance |
| Un límite de generaciones por hora | No lo pide la especificación; queda anotado como riesgo en AM-24 |

## Decisiones que requieren ADR

No se escriben aquí: este encargo solo permite `diseno.md` y `propuestas.md`. Se proponen para después de la puerta P1.

| ADR propuesto | Qué fija | Qué frontera cambia |
| --- | --- | --- |
| Ampliación de ADR-0003: «operaciones del panel» | En los dashboards se lee con la sesión, pero **no se escribe en las tablas**: cada cambio es una función de la base de datos que comprueba el acceso, aplica la transición y audita. Es común a la 021, la 022, la 023 y la 025 | «App → base de datos», y el punto 2 de ADR-0003 |
| Enmienda de ADR-0006, punto 7 | La suspensión manual y la de cobro son dos causas separadas con fecha; `estado_manual` desaparece o queda solo para «forzar activa», que nunca quita la causa manual | La relación entre cobro y licencia (fase 6) |
| Enmienda de ADR-0002, punto 4 | La caducidad del código es de 15 minutos y hay un solo código vivo por licencia | Ninguna frontera; es un valor. Puede bastar con anotarlo en el registro de decisiones |

## Qué se pide a otras fases y a coordinación

Nada de esto está aplicado. Está copiado en `propuestas.md`, apartado del 14/11/2026.

**Fase 1 (001 y 002).**

1. Caducidad del código de activación de 15 minutos, no 10, y el texto de la pantalla de activación (asunto A-5).
2. Qué pasa con la orden de operación `generar_codigo` cuando exista el panel (asunto A-6).
3. Que `src/lib/oauth/secretos.ts` ofrezca una función para sortear un código y dar su HMAC, importable desde `src/lib/licencias/generar-codigo.ts` y desde ningún otro sitio fuera de `src/lib/oauth/`.
4. Cuatro códigos nuevos en la lista cerrada de `registro.ts` (apartado «Contratos»).
5. Rutas críticas nuevas: `src/lib/clientes/`, `src/lib/licencias/` y `src/app/admin/clientes/acciones.ts`.
6. V-112: que la supervisión de errores no capture cuerpos de respuesta ni argumentos de acciones.

**Fase 2 (010, 011, 014).**

1. Todo el apartado «Datos»: D-1 a D-13.
2. La forma de exponer las operaciones y las lecturas del panel (T-P4), la misma que pide la 021.
3. En la fase 3, que un usuario de cliente no lea ninguna fila de `clientes`, `licencias`, `codigos_activacion` ni `conexiones` (asunto A-3).
4. Lo que el conector tiene que cumplir (D-11), y en particular la comprobación de la revocación dentro de la ventana de gracia.
5. Los hechos H-03, H-04 y H-05 del inventario de la 024.
6. Un sitio donde ejecutar pgTAP con varias conexiones a la vez.

**Función 020.** Las plantillas de ruta de esta función en `rutas.ts`; los estados nuevos en `catalogo.ts`; los textos en `textos.ts`; `DialogoConfirmacionTecleada` en `src/components/dialogo/`, en la muestra y en su PRUEBA-011; `src/app/muestra/clientes/` en el inventario de la muestra.

**Función 021.** Que su prueba estática de puntos de entrada cubra `src/app/admin/clientes/`; que `administradores.correo` se pueda leer desde L-4; y qué ve un diálogo abierto cuando la sesión caduca (este diseño supone que el contenido se sustituye).

**Función 023.** L-7: una sola función que dé «Sin señal» y «En pausa» para una lista de clientes, con su regla; los dos estados en el catálogo; sus dos secciones en `secciones.ts`.

**Función 024.** Que I-11 pueda ir vinculada también a I-06 y a I-03; confirmar la lectura de CA-025 (DD-14); y qué atributos identifican a un código en su página sin enseñarlo (este diseño ofrece la fecha de generación y quién lo generó).

**Función 025.** Una única fuente en la base de datos para los valores por defecto, que O-1 usa; su sección en `secciones.ts`; confirmar que I-41 la escribe O-1.

**Fase 4 (030, 032).** El cambio de canal y la alerta por conexión nueva (asunto A-8).

**Fase 5 (040).** Su sección de usuarios en `secciones.ts`; y, cuando abra lecturas propias a los usuarios de cliente, que CA-022 de esta función se revise.

**Fase 6 (050).** La causa de cobro como `suspension_cobro_en`, que ninguna función suya toque la causa manual, y «forzar activa» como hecho aparte.

**Coordinación.** Aplicar la nota aclaratoria del artículo 2 (la hace el responsable) y la aclaración de `.claude/rules/interfaz.md`; añadir las rutas críticas a `docs/SEGURIDAD.md`; anotar en `docs/TECNOLOGIAS.md` las decisiones de las aclaraciones de la 022 y, si se aprueban, las de este diseño; actualizar la ficha de cliente de `docs/DISENO.md` y el flujo 1 de `docs/ARQUITECTURA.md`.

## Asuntos abiertos para el responsable

El primero condiciona la puerta P1. La columna «Propuesta» es del arquitecto y no es una decisión.

| N.º | Asunto | Opciones | Propuesta |
| --- | --- | --- | --- |
| A-1 | **La nota aclaratoria del artículo 2 no está aplicada.** REQ-074 y la ficha de cliente dependen de ella. Es una enmienda de la constitución: no está delegada | (a) El responsable la aplica, con fecha y versión, antes de la puerta P1. (b) No se aplica: la función no se puede construir como está especificada y vuelve al `especificador` | (a) |
| A-2 | **Lectura de CA-025.** Dice «exactamente 1 fila» por acción; el inventario de la 024 añade filas vinculadas | (a) Una fila principal más las vinculadas (DD-14). (b) Una sola fila por acción, y se cambia el inventario de la 024 | (a) |
| A-3 | **Usuarios de cliente y las tablas de esta función.** El modelo de referencia les deja leer su propio cliente y su licencia. CA-022 pide cero filas | (a) En la fase 3, cero filas; la fase 5 abrirá lo que necesite con su diseño y CA-022 se revisará entonces. (b) Se abre ya y CA-022 se limita a las lecturas del panel | (a) |
| A-4 | **Pruebas sin sitio donde ejecutarse.** Cuarenta de los 48 criterios necesitan las migraciones de la fase 2; de ellos, los de base de datos necesitan además un sitio para pgTAP, diez el conector de la fase 2 y uno el entorno previo. Nada de eso existe. Es el mismo problema del asunto A-10 de la 021 | (a) Esperar al CI remoto (003). (b) Un entorno con Docker fuera de esta máquina. (c) Mientras tanto, PGlite como evidencia provisional que no cierra nada | (c) ahora y (a) o (b) antes de verificar |
| A-5 | **15 minutos frente a 10.** La 022 aprobada dice 15; el diseño de la 001, también aprobada, dice 10 y lo pone en la pantalla | (a) 15 en las dos, cambiando la 001. (b) 10 en las dos, cambiando la 022 | (a): es la respuesta más reciente del responsable (13/11/2026) |
| A-6 | **Segunda vía para crear códigos.** La orden `generar_codigo` de la 001 no pasa por la sesión de un administrador ni deja la fila I-10 | (a) Retirarla fuera del entorno local cuando exista el panel. (b) Mantenerla y que deje una fila con origen «responsable, fuera del panel», con entrada nueva en la 024 | (a) |
| A-7 | **Qué distingue dos nombres** (DD-05 y DD-06). Con esta regla, «Barça» y «Barca», o «Lluïsa» y «Lluisa», son nombres distintos; un nombre con un emoji compuesto se rechaza; dos nombres con letras de alfabetos distintos que se ven iguales se admiten | (a) Así. (b) Quitar también diéresis y cedilla salvo en «ü». (c) Añadir una comprobación de letras parecidas entre alfabetos, con su tabla | (a) |
| A-8 | **Alerta por conexión nueva.** Es de la fase 4. Hasta entonces, un código generado con una sesión comprometida solo se descubre mirando la ficha o la auditoría (AM-01) | (a) Aceptarlo hasta la fase 4, que va antes de publicar. (b) Adelantar a la fase 3 un aviso mínimo en el Resumen | (a), y que la lista de publicación lo recoja |

## Lo que este diseño no ha podido comprobar

- **Nada se ha ejecutado.** No hay app, migraciones ni pruebas. Todo lo que se afirma sobre el comportamiento es diseño.
- Qué versión, codificación y configuración regional tiene el Postgres del proyecto de desarrollo, y si `lower()` y `normalize()` dan allí la clave de nombres esperada (T-P1). De la documentación solo se sabe que `lower()` depende de la configuración regional y que `normalize()` exige UTF8.
- Que la lista de rangos de `caracteres.ts` cubra todos los caracteres no visibles: se ha escrito de memoria a partir de las categorías de Unicode y hay que contrastarla con las tablas de Unicode al implementarla. La página de MDN consultada no confirma que el motor ofrezca la propiedad con la que PRUEBA-001 quiere vigilarla.
- Que un campo de texto dentro del diálogo de alerta de Radix funcione con teclado y lector de pantalla en los tres motores (T-P2).
- Que la respuesta de una acción de servidor de Next.js no quede en ninguna caché ni se repita en otra respuesta, y qué captura la supervisión de errores (T-P3; V-112 en VERIFICAR).
- Que copiar al portapapeles funcione en los tres motores dentro de un diálogo.
- La forma en que la 010 expondrá las operaciones del panel, y si un usuario con sesión puede ejecutar funciones que no están en un esquema expuesto (T-P4).
- El rendimiento. Los índices pedidos son una estimación.
- La regla de «Sin señal»: depende de la 013, que tiene cuestiones sin responder.
- Qué recibe el agente con la licencia revocada (cuestión 17 de la 011). Este diseño vale con las dos opciones.
- Los diseños de la 021 y de la 002 pueden cambiar con sus dictámenes; los de la 010, la 011, la 014, la 023, la 024 y la 025 no existen. Si cambian lo que aquí se supone, este diseño se revisa.
- No se han leído enteros `docs/MODELO-DATOS.sql` ni los diseños de la 020 y la 021, por indicación del encargo: solo los apartados citados.


