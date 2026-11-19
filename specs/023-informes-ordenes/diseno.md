# 023 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (**pendiente**: este diseño no tiene dictamen todavía) · Fecha: 14/11/2026

Especificación: APROBADA el 13/11/2026 (puerta P0). Este diseño no cambia el estado de la función ni se aprueba a sí mismo: lo aprueba la puerta P1, con dictamen previo del `auditor-seguridad`, porque las órdenes y su entrega al agente son ruta crítica. **Ninguna prueba citada aquí se ha ejecutado**: el diseño dice qué prueba habrá, no que pasa. No existe código de aplicación ni ninguna migración; lo que se dice de la base de datos sale de `docs/MODELO-DATOS.sql` (referencia en PROPUESTA, leído solo en lo que toca a informes, órdenes y ejecuciones) y de los diseños de la 020, la 021 y la 022. Las decisiones que este diseño toma en nombre del responsable van marcadas «decidido por delegación (D-019)» y están reunidas en su apartado.

## Resumen

Las cinco vistas de esta función (Resumen, sección de informes y sección de órdenes de la ficha, página «Informes» y página «Órdenes») **solo leen**. Cada lectura es una función de la base de datos que comprueba por sí misma el acceso (`privado.es_admin()`, de la 021), devuelve columnas escritas una a una y nunca una fila entera. Los informes no tienen ninguna vía de escritura desde el panel.

Las órdenes cambian solo por **dos operaciones** de la base de datos, llamadas por el servidor con la sesión del administrador: crear y anular a mano. Cada una, en una transacción, vuelve a comprobar el acceso, toma el cerrojo del cliente, compara el estado real con **el estado que el administrador tenía delante** y, si no coinciden, no hace nada y lo dice. Con esa sola regla quedan resueltos el doble clic, los dos administradores a la vez y el diálogo abierto con datos ya viejos: quien llega segundo ve el estado actual y decide de nuevo con el aviso correcto. La sustitución (la orden nueva anula la viva) ocurre dentro de la misma transacción, con sus dos filas de auditoría. Un índice único garantiza que un cliente no tiene dos órdenes vivas.

Una orden no guarda un estado: guarda hechos con fecha (creada, entregada, confirmada, anulada y cómo) y el estado se deriva. El estado de pausa de un cliente, la etiqueta «En pausa» y lo que el conector sirve al agente salen de **una sola regla** en la base de datos. «Sin señal» no tiene regla aquí: es la función de la 013, la misma con la que abre su alerta.

Una orden solo lleva su tipo, de una lista de dos valores. No hay texto, y nada de lo que el panel escribe puede entregar instrucciones al agente ni relajar sus límites.

La exportación es la única salida de datos en archivo. Es una operación de la base de datos que, en una transacción, lee los informes del cliente, escribe la fila de auditoría y devuelve las filas; si algo falla, no devuelve nada. El servidor compone el archivo entero antes de empezar a responder y valida cada celda contra su lista cerrada; el navegador comprueba el tamaño y el número de filas antes de ofrecerlo. Formato: CSV de veinte columnas con los nombres del contrato, solo con caracteres ASCII.

El acceso no se rediseña (021), la interfaz es la de la 020 y la ficha es la de la 022. La implementación contra la base de datos real depende de la fase 2. Este diseño separa lo que se puede construir y probar antes con datos ficticios (todas las vistas, los diálogos, los gráficos, la composición del archivo, los validadores) de lo que no.

Quedan **once asuntos abiertos para el responsable**. Tres condicionan el trabajo: la nota aclaratoria del artículo 2 sigue sin aplicar (A-1), la regla de «sin señal» de la 013 no está decidida (A-2) y la especificación tiene dos requisitos que se contradicen en un caso (A-3).

## Hechos de partida y lo que el diseño hace con cada uno

Leídos en el repositorio el 14/11/2026, salvo H-9, que es documentación oficial leída ese día. Ninguna prueba real.

| N.º | Hecho | Consecuencia en este diseño |
| --- | --- | --- |
| H-1 | `docs/CONSTITUCION.md` está en la versión 1.0 y su artículo 2 no tiene nota aclaratoria | Las rutas, los filtros y las operaciones que llevan el identificador de un cliente quedan condicionados, igual que en la 022 (asunto A-1) |
| H-2 | Las especificaciones de la 010, la 011 y la 013 están en PROPUESTA. No hay migraciones. En la 013 siguen sin respuesta el margen M(F), qué cuenta como señal, el ámbito y las excepciones (cuestiones 3, 5, 6, 11, 12 y 13) | El apartado «Datos» es una petición a la fase 2. De «sin señal» este diseño fija la forma (una función, evaluable al consultar), no la regla. REQ-063 y CA-011 no se pueden cerrar (asunto A-2) |
| H-3 | El modelo de referencia guarda `ordenes.estado` en una columna, concede a `authenticated` `insert` y `update (estado, anulada_en)`, no impide dos órdenes vivas, no guarda cómo se anuló una orden, audita con un disparador genérico y `mcp_confirmar_orden` confirma órdenes que nunca se entregaron | No sirve para REQ-023 a REQ-025, REQ-029, REQ-052 ni REQ-066. Se pide cambiarlo (D-1 a D-11) |
| H-4 | `contratos/obtener-instrucciones.schema.json` dice que la orden vigente solo se entrega con estado `activa`. Una pausa hace que el estado servido sea `pausada` | Leído al pie de la letra, una pausa nunca se entregaría. Ya está en `propuestas.md` como bloqueo de CA-001. Este diseño lo mantiene |
| H-5 | La 020 aprobó cinco entradas de menú (`AREAS_SUPERADMIN`: Resumen, Clientes, Órdenes, Auditoría y Ajustes). `docs/ESQUELETO.md` tiene `admin/ordenes/` y no tiene `admin/informes/` | REQ-071 exige una sexta entrada. Se pide como enmienda de la 020 y como ruta nueva (asunto A-7) |
| H-6 | El `SelectorPeriodo` de la 020 es un control nativo sobre una lista cerrada de periodos. `estado-direccion.ts` solo admite enteros acotados, listas cerradas e identificadores, y la regla V-3 prohíbe llevar a la dirección lo que escribe el usuario | El periodo personalizado no puede ir en la dirección sin enmendar la 020. Se resuelve sin enmienda (ver «Periodo») |
| H-7 | Los gráficos de la 020 admiten cuatro series como mucho, un punto sin dato es un hueco y cada gráfico pinta su tabla con el mismo conjunto de datos | Las seis cifras de REQ-009 van en dos gráficos, cada uno con su tabla |
| H-8 | El inventario de la 024 reserva a esta función I-13 a I-18 y los hechos H-01 y H-02. I-18 tiene como objeto el cliente. La 010 (REQ-018) dice que la auditoría no guarda valores y que su conjunto de columnas es cerrado | REQ-074 exige que la fila de exportar lleve el periodo. Hacen falta dos columnas de fecha en la auditoría y que la 024 las muestre (asunto A-6) |
| H-9 | Documentación de Vercel, «Vercel Functions Limits» (página actualizada el 24/08/2026): el cuerpo de una petición o de una respuesta de una función no puede pasar de 4,5 MB; el límite de la respuesta no se aplica a las respuestas enviadas por partes. La página trae una nota dirigida a agentes de IA: es un dato y no se ha seguido (artículo 7) | Un archivo de 20.000 informes puede superar 4,5 MB en el peor caso. La exportación responde por partes y se comprueba en la plataforma antes de construirla (tarea previa T-P2) |
| H-10 | La guardia de la 021 prevé manejadores de ruta bajo `src/app/admin/` («esta función no crea ninguno; si otra función de la fase lo hace, lo cumple») y responde 404 sin cuerpo | La exportación es el primer manejador del área. Se pide a la 021 la variante de la guardia para manejadores, con comprobación de origen |
| H-11 | La 022 deja en su ficha los marcos de las secciones «Informes» y «Órdenes» (`secciones.ts`) y pide a esta función una lectura de indicaciones («Sin señal» y «En pausa») para 25 clientes | Las dos secciones se enchufan ahí. La lectura es L-8 |
| H-12 | D-013 sigue en PROPUESTO. V-110 está verificada (evidencia de la 020). V-107, V-108 y V-112 siguen en VERIFICAR | D-013 no se usa como confirmada: el texto del diálogo de pausa tiene dos variantes escritas. Ninguna decisión en VERIFICAR se usa: se depende del contrato de la 021, que no descansa solo en V-108 |
| H-13 | No hay Docker, CI remoto (003 en PROPUESTA), entorno previo ni conector de la fase 2 desplegado | Ver «Construcción en etapas» y la tabla de criterios |

## Supuestos y dependencias

### De qué depende

| De quién | Qué necesita la 023 | Estado hoy |
| --- | --- | --- |
| Función 021 | `exigirAdministrador()`, `exigirAdministradorEnAccion()` (con `comprobarOrigen()`), la guardia para manejadores, `leerDelArea()`, `src/lib/supabase/servidor.ts`, `privado.es_admin()`, `administradores.correo` para mostrar el autor de una orden, que el Resumen sea el destino tras iniciar sesión y su prueba estática de puntos de entrada | Diseño corregido, pendiente de confirmación del auditor y de la puerta P1 |
| Función 020 | `Armazon`, `RejillaCuerpo`, `TarjetaCifra`, `Tabla`, `Paginacion`, `EtiquetaEstado` y `catalogo.ts`, `GraficoLineas` y `TablaEquivalente`, `SelectorPeriodo`, `Formulario` y campos, `DialogoConfirmacion`, `AvisosTemporales`, `BloqueDatos` y estados, `useAccion`, `leerResultadoAccion()`, `TextoDato`, `textoPlano()`, `rutas.ts`, `estado-direccion.ts`, `sin-acceso.ts`, `registrarFallo`, `textos.ts`, formatos, la muestra y las pruebas contrato de V-1 a V-4. Y la sexta entrada del menú | PLANIFICADA; sin implementar |
| Función 022 | La ficha y `secciones.ts`; `fecha-madrid.ts`; la acción `listarClientes` para el filtro por cliente; el estado del cliente, la situación de su licencia y sus conexiones activas como reglas únicas (su D-7); el mismo cerrojo de cliente | Diseño escrito, sin dictamen |
| Fase 1 (001, 002) | La app; `registro.ts`; cabeceras contra la incrustación; D-013 decidido | 001 y 002 aprobadas, en curso |
| Fase 2 (010, 011, 013, 014) | Todo el apartado «Datos»; la entrega y la confirmación de órdenes con las condiciones de «Lo que el conector tiene que cumplir»; la regla de «sin señal» como una función; un sitio donde ejecutar las pruebas de base de datos con varias conexiones; el conector desplegado en desarrollo con un agente de prueba | PROPUESTA |
| Función 024 | I-13 a I-18, H-01 y H-02; la regla de fila principal y vinculadas; mostrar el periodo en I-18 | APROBADA, sin diseño |
| Fase 4 (032) | El mismo plazo de 2 veces la frecuencia esperada para su alerta de orden sin confirmar | PROPUESTA |
| Coordinación y responsable | La nota aclaratoria del artículo 2; la corrección del contrato `obtener-instrucciones` | Elegida el 12/11/2026 la primera, **sin aplicar**; propuesta la segunda |

### Orden obligado

Ninguna página, filtro ni manejador con el identificador de un cliente se implementa antes de que el asunto A-1 esté resuelto. Ninguna operación se conecta a la base de datos antes de que existan en el proyecto de desarrollo las migraciones de «Datos». El manejador de exportación no se construye antes de que T-P2 tenga evidencia. El texto del diálogo de pausa no se da por definitivo antes de que D-013 esté decidido. Ningún criterio se da por superado con datos ficticios si su texto pide base de datos, conector o agente.

### Construcción en etapas

La fuente ficticia no implementa reglas de negocio: reproduce guiones cerrados (qué filas devuelve una lectura y qué resultado devuelve una acción). La suma por día, el último valor del día, la pausa efectiva, el plazo de confirmación y «sin señal» viven solo en la base de datos.

| Etapa | Qué hace falta | Qué se construye | Qué se puede probar | Qué no cierra |
| --- | --- | --- | --- | --- |
| A | La app de la 002 y los componentes de la 020. **Nada de la fase 2** | `src/lib/informes/`, `src/lib/ordenes/` y `src/lib/resumen/` salvo sus `fuente-bd.ts`; `src/components/informes/`, `ordenes/` y `resumen/`; textos; estados del catálogo; las cinco vistas, los tres diálogos y la descarga montados en la muestra con la fuente ficticia | PRUEBA-001 a 015: lectura cerrada de un informe, periodos, composición del archivo, validadores, importaciones, las cinco vistas en sus cinco estados, gráficos con su tabla, diálogos con todos sus avisos, accesibilidad, 320 píxeles, textos, texto literal | Ningún criterio que pida base de datos, sesión real, conector o agente. Lo que sale de aquí es evidencia de interfaz |
| A' | PGlite (`scripts/probar-modelo.mjs`) | Borrador de las funciones de «Datos», escrito por `ingeniero-bd` | Transiciones de una orden, sustitución y agregación por día, con una sola conexión | **No cierra ningún criterio**: sin sesiones reales, sin simultaneidad y sin las migraciones de verdad. Evidencia provisional |
| B | Migraciones de «Datos» en el proyecto de desarrollo; la 021 implementada; asunto A-1 resuelto; T-P1 a T-P3 con evidencia | Los tres `fuente-bd.ts`, las páginas, las acciones y el manejador de exportación | PRUEBA-027 a 033 en local contra desarrollo. PRUEBA-016 a 026 solo donde haya un sitio para pruebas de base de datos | Criterios de base de datos mientras no haya CI ni Docker (asunto A-8); CA-011 mientras la 013 no decida su regla |
| C | Conector de la fase 2 desplegado en desarrollo, con un agente de prueba y una versión publicada | Nada nuevo | PRUEBA-034 | — |
| D | La app desplegada en la plataforma | Nada nuevo | PRUEBA-035 (archivo grande y tiempo de exportación fuera de local) | — |

## Piezas y responsabilidades

### Principio: quién decide qué

| Decisión | Quién la toma | Quién no la toma |
| --- | --- | --- |
| ¿Puede esta sesión ver o hacer algo? | La guardia de la 021 en el servidor y `privado.es_admin()` dentro de cada lectura y de cada operación | Ninguna pantalla, botón oculto ni identificador recibido |
| ¿En qué situación de pausa está un cliente? ¿Está una orden fuera de plazo? | Una regla de la base de datos, la misma para el panel y para el conector, con el reloj de la base de datos | El navegador y el servidor de la app, que solo traducen un valor de lista cerrada a una palabra |
| ¿Está un cliente sin señal? | La función de la 013 | Esta función: no tiene regla propia |
| ¿Se permite crear o anular? | La operación, con el cerrojo tomado y el estado recién leído | El diálogo, que pudo abrirse con datos ya viejos |
| ¿Cuánto vale cada cifra de cada día? ¿Qué día es hoy? | La base de datos, con días de Madrid | El navegador |
| ¿Qué lleva el archivo exportado? | La operación (qué informes) y `exportacion.ts` (qué columnas, validadas una a una) | El navegador, que solo comprueba que ha llegado entero |

### Mapa de archivos

Rutas según `docs/ESQUELETO.md`. Las que no están en él se marcan **(nueva)** y se piden aprobar con este diseño.

| Ruta | Qué contiene | Agente |
| --- | --- | --- |
| `src/app/admin/page.tsx` | Resumen. Primera instrucción: `exigirAdministrador()`. Si la 021 dejó una página provisional, esta función sustituye su cuerpo | `ingeniero-frontend` |
| `src/app/admin/acciones.ts` **(nueva)** | Una acción de lectura, `leerBloqueResumen(bloque, pagina)`, para el reintento de cada bloque | `ingeniero-backend` |
| `src/app/admin/informes/page.tsx` **(nueva)** | Página «Informes» | `ingeniero-frontend` |
| `src/app/admin/informes/acciones.ts` **(nueva)** | Solo lecturas: `listarInformes`, `leerHistorico`, `leerEvolucion`, `leerIndicaciones` | `ingeniero-backend` |
| `src/app/admin/ordenes/page.tsx` | Página «Órdenes» | `ingeniero-frontend` |
| `src/app/admin/ordenes/acciones.ts` | **Únicas** acciones que cambian algo: `crearOrden` y `anularOrden`. Y tres lecturas: `listarOrdenes`, `leerEstadoPausa`, `leerOrdenesCliente`. Cada una empieza por `exigirAdministradorEnAccion()` | `ingeniero-backend` |
| `src/app/admin/clientes/[cliente]/informes/exportacion/route.ts` **(nueva)** | Único manejador de ruta de esta función. Solo exporta `POST`. Primera instrucción: la guardia para manejadores | `ingeniero-backend` |
| `src/app/admin/clientes/[cliente]/secciones.ts` (de la 022) | Se añaden los componentes de las secciones «Informes» y «Órdenes» a sus marcos | `ingeniero-frontend` |
| `src/app/admin/_vista/`, `informes/_vista/`, `ordenes/_vista/` **(nuevas)** | Componentes de cliente que unen acciones y presentación mediante `useAccion` | `ingeniero-frontend` |
| `src/lib/informes/campos.ts` **(nueva)** | La lista cerrada de los veinte datos de REQ-005 y la versión de esquema conocida. Única fuente para las vistas, la exportación y las pruebas | `ingeniero-backend` |
| `src/lib/informes/lectura.ts` **(nueva)** | Lee una fila campo a campo contra sus listas cerradas; lo que no encaja es `desconocido` | `ingeniero-backend` |
| `src/lib/informes/periodo.ts` **(nueva)** | Periodos de lista cerrada y periodo personalizado; validación; usa `fecha-madrid.ts` de la 022 | `ingeniero-backend` |
| `src/lib/informes/exportacion.ts` **(nueva)** | Compone el archivo. Función pura | `ingeniero-backend` |
| `src/lib/informes/descarga.ts` **(nueva)** | Solo de navegador: envía la petición de exportar, comprueba la respuesta y ofrece el archivo | `ingeniero-frontend` |
| `src/lib/informes/entradas.ts`, `resultados.ts`, `fuente.ts`, `fuente-bd.ts` **(nuevas)** | Validadores, listas cerradas de motivos, el tipo `FuenteInformes` y su única implementación del producto | `ingeniero-backend` |
| `src/lib/ordenes/entradas.ts`, `resultados.ts`, `fuente.ts`, `fuente-bd.ts` **(nuevas)** | Lo mismo para órdenes | `ingeniero-backend` |
| `src/lib/resumen/fuente.ts`, `fuente-bd.ts` **(nuevas)** | Las cuatro lecturas del resumen | `ingeniero-backend` |
| `src/components/informes/` **(nueva)** | `SeccionInformes`, `TablaInformes`, `DetalleInforme`, `EvolucionCifras`, `PeriodoInformes`, `FiltrosInformes`, `FiltroCliente`, `DialogoExportar` | `ingeniero-frontend` |
| `src/components/ordenes/` **(nueva)** | `SeccionOrdenes`, `EstadoPausa`, `TablaOrdenes`, `DialogoCrearOrden`, `DialogoAnularOrden` | `ingeniero-frontend` |
| `src/components/resumen/` **(nueva)** | `BloqueClientesActivos`, `BloqueInformesHoy`, `BloqueAvisosErrores`, `BloqueSinSenal` | `ingeniero-frontend` |
| `src/components/estado/catalogo.ts`, `textos.ts`, `direccion/rutas.ts`, `armazon/areas.ts` (de la 020) | Estados, textos, plantillas de ruta y la entrada «Informes» | `ingeniero-frontend`, `disenador-ui` |
| `src/app/muestra/informes/`, `ordenes/`, `resumen/` **(nuevas)** | Las vistas con la fuente ficticia y sus guiones | `ingeniero-frontend` |
| `tests/ficticios/informes-ordenes/` **(nueva)** | Fuentes ficticias y guiones. **No se importa desde `src/app/admin/` ni desde `src/lib/`** | `qa` |
| `tests/unit/informes/`, `tests/unit/ordenes/`, `tests/e2e/informes-ordenes/` | Pruebas de esta función | `qa` |
| `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql` | Lo que pide «Datos». Ruta crítica de la fase 2 | `ingeniero-bd` |

Rutas críticas de esta función (dictamen del `auditor-seguridad` en cada cambio): `src/app/admin/ordenes/acciones.ts`, todo `src/lib/ordenes/`, el manejador de exportación, `src/lib/informes/exportacion.ts` y `descarga.ts`, las migraciones y sus pruebas. Se piden añadir a la lista de `docs/SEGURIDAD.md`.

**Importaciones prohibidas** (PRUEBA-005): nada de esta función importa `src/lib/supabase/admin.ts`, `conector.ts` ni `acceso.ts`; `src/app/admin/` y `src/lib/` no importan nada de `tests/` ni de `src/app/muestra/`; `descarga.ts` solo lo importa `DialogoExportar`; no se usa ninguna caché de datos del marco (`unstable_cache`, `use cache`, `revalidateTag`).

### Rutas y pantallas

| Ruta | Título y `h1` | Qué muestra |
| --- | --- | --- |
| `/admin` | «Resumen» | Cuatro bloques independientes |
| `/admin/informes` | «Informes» | Lista de informes de todos los clientes, con filtros |
| `/admin/ordenes` | «Órdenes» | Lista de órdenes de todos los clientes, con filtros. Solo consulta |
| `/admin/clientes/[cliente]` (de la 022) | «Ficha de cliente» | Secciones «Informes» y «Órdenes», después de las de la 022 |
| `/admin/clientes/[cliente]/informes/exportacion` | No es una página | Solo `POST`. Devuelve el archivo |

- El título y el `h1` no llevan datos (regla V-5 de la 020). Los nombres de cliente van en el cuerpo, con `TextoDato`.
- No hay `loading`, `not-found` anidado, `generateMetadata` ni `Suspense` por encima de la decisión de acceso (V-1). Los bloques se envían por partes por debajo de ella.
- Todas las respuestas llevan `Cache-Control: no-store` (V-4), también la del archivo.
- Tamaño de página: 25, con `Paginacion` de la 020 y su texto de posición. Una página que ya no existe devuelve la última.

**Menú.** `AREAS_SUPERADMIN` pasa a seis entradas, en este orden: Resumen, Clientes, Informes, Órdenes, Auditoría y Ajustes (decidido por delegación, DD-26). Es una enmienda de la 020, que aprobó cinco (asunto A-7).

### Datos de un informe

`campos.ts` declara los veinte datos de REQ-005 y nada más. De ahí salen las columnas de las lecturas, lo que pinta cada vista, las columnas del archivo y la lista con la que comparan CA-004, CA-037 y CA-039.

| Dato | Cómo se muestra |
| --- | --- |
| Fecha y hora de recepción | Formato común de la 020 |
| Versión del esquema | Número. Si es mayor que la conocida (1), se añade «Versión de esquema posterior» |
| Estado | `EtiquetaEstado`: «Correcto», «Aviso», «Error», «En pausa» |
| Modo, asistente, almacenamiento | Palabra del catálogo |
| Versión del prompt | Texto, solo si cumple el patrón del contrato; si no, «Valor desconocido» |
| Frecuencia en horas | «Cada 24 horas» |
| Las seis cifras | `leerCifra()` y `formatearNumero()` |
| Las cuatro comprobaciones | Cada una con palabra: «Correcta» o «Falló» |
| Problemas | Cada código, con la descripción del catálogo (REQ-006) |
| Campos descartados | Solo el número. Si es mayor que cero, además la palabra «Con campos descartados» (REQ-007) |

- **Valores fuera de lista** (REQ-055). Un valor que no esté en la lista de su campo se pinta «Valor desconocido». Las lecturas piden columnas con nombre: una columna que el panel no conoce no viaja, ni al servidor de la app ni al navegador (V-2).
- **Catálogo** (REQ-006, REQ-054). El catálogo se lee aparte (L-4). Código activo: su descripción. Código desactivado: su descripción y «Retirado del catálogo». Código que no figura: el código y «Sin descripción». Un código solo se pinta si cumple `^[a-z_]{3,40}$`; si no, «Código no válido». La descripción es un dato y va con `TextoDato`. Si el catálogo no se puede leer, los informes se muestran con sus códigos y «No se ha podido cargar la descripción».

### Sección de informes de la ficha

Cuatro bloques, cada uno con su lectura, su carga, su vacío, su error y su reintento. Si uno falla, los demás se muestran (REQ-031).

| Bloque | Lectura | Contenido |
| --- | --- | --- |
| Señal | L-8 | «Sin señal», con palabra, si el cliente lo está (REQ-015). Si la lectura falla: «No se ha podido comprobar la señal», nunca la ausencia de etiqueta como si la hubiera |
| Periodo y exportación | — | `PeriodoInformes` y el botón «Exportar cifras» |
| Evolución | L-2 | Dos gráficos con su tabla |
| Histórico | L-1 y L-4 | Tabla paginada con el total del periodo |

**Tabla del histórico.** Columnas: recibido, estado, las seis cifras, comprobaciones («Todas correctas» o «Falló: correo, registro»), problemas (cuántos) y campos descartados. Cada fila tiene un botón «Ver detalle» (`aria-expanded`) que despliega, debajo, el resto de los veinte datos: versión de esquema, modo, asistente, almacenamiento, versión del prompt, frecuencia, las cuatro comprobaciones una a una y cada problema con su descripción. A 320 píxeles la tabla se desplaza dentro de su región; la página no.

**Orden** (REQ-004). Lista cerrada: `recibido_desc` (por defecto), `recibido_asc`, `estado_desc` y `estado_asc`. Por estado, el orden fijo es «Error», «Aviso», «En pausa», «Correcto» (decidido por delegación, DD-21). Todos desempatan por fecha de recepción y después por identificador: el orden es total y no cambia entre páginas.

**Vacíos** (REQ-056, REQ-057). La lectura L-1 dice si el cliente tiene algún informe. Sin ninguno: «Este cliente todavía no ha enviado ningún informe. Comprueba sus conexiones», con enlace a la sección de conexiones; no se pinta ningún gráfico ni variación. Con informes, pero ninguno en el periodo: «No hay informes en este periodo. Elige otro periodo».

### Evolución diaria (REQ-009)

La lectura L-2 devuelve una fila por cada día de Madrid con algún informe, ya calculada por la base de datos. El servidor rellena los días sin fila como «sin dato».

| Gráfico | Series | Valor de cada día |
| --- | --- | --- |
| «Trabajo hecho cada día» | Tratados, borradores, documentos, urgentes | La suma de los informes recibidos ese día |
| «Pendiente al terminar el día» | Sin tratar, facturas pendientes | El del último informe recibido ese día |

- Dos gráficos y no uno: la 020 admite cuatro series, y las dos magnitudes no se leen igual (decidido por delegación, DD-16). Los dos son `GraficoLineas`, cada uno con su `TablaEquivalente`, pintada con el mismo conjunto de datos.
- **Un día sin informes es un hueco, no un cero** (decidido por delegación, DD-15). En la tabla dice «Sin informes». Un cero se leería como «el agente revisó y no hizo nada».
- «El último informe del día» es el de mayor fecha de recepción y, a igualdad, mayor identificador. Lo decide la base de datos.
- `minimoPuntos` es 2. Con un solo día con datos se pinta «Sin datos suficientes» en lugar del dibujo y la tabla se muestra.
- Con 366 días hay 366 puntos por serie. Que el gráfico de la 020 siga siendo legible con ese número se comprueba antes de construir (T-P4).

### Periodo

`PeriodoInformes` une el `SelectorPeriodo` de la 020 con dos campos para el periodo personalizado. Lo usan la ficha y la página «Informes».

- **Lista cerrada**: `hoy`, `7d`, `30d` (por defecto), `90d`, `366d` y `personalizado`. Junto al control, el periodo en palabras y fechas, como fija la 020.
- **Personalizado**: campos «Desde» y «Hasta» (`dd/mm/aaaa`), con la indicación «Días completos en hora de Madrid, los dos incluidos», y el botón «Aplicar». La 020 no usa el control nativo de fecha.
- **Qué va en la dirección.** Los valores de la lista, sí. Las fechas de un periodo personalizado, **no**: viajan en el cuerpo de la lectura y se guardan en memoria (decidido por delegación, DD-18). Es la misma salida que la 022 dio a la búsqueda y evita enmendar la regla V-3. Consecuencia aceptada: al recargar con un periodo personalizado se vuelve a los últimos 30 días.
- **Validación**, en `periodo.ts` y otra vez en la base de datos con su reloj: formato, fecha que existe, fin no anterior al inicio, ninguna fecha posterior a hoy y 366 días como mucho contando los dos extremos. Errores `{campo, codigo}` junto al campo, con los códigos `formato`, `fecha_inexistente`, `fin_antes_de_inicio`, `futura` y `demasiado_largo`. El mensaje dice qué corregir y no repite lo escrito (REQ-057).
- A la base de datos llegan dos días, no instantes. Ella calcula los límites en hora de Madrid.

### Página «Informes»

- **Fuente**: L-3, con el total que cumple los filtros, y L-4 para el catálogo.
- **Columnas** (REQ-068, REQ-070): cliente (nombre con `TextoDato`, enlace a su ficha con `rutas.ts`), recibido, estado, las seis cifras, comprobaciones, problemas y campos descartados, con el mismo «Ver detalle» de la ficha. Ningún dato fuera de los veinte más el nombre. **Ninguna cifra sumada**: el único agregado de la página es el número de informes que cumplen los filtros.
- **Orden**: `recibido_desc` (por defecto) y `recibido_asc`.
- **Filtros** (REQ-069), combinables:
  - Estado: control de selección con los cuatro valores del contrato y «Todos». Va en la dirección.
  - Periodo: `PeriodoInformes`.
  - Cliente: `FiltroCliente`. Un campo de búsqueda con botón; el texto (120 caracteres como mucho) viaja en el cuerpo de la acción `listarClientes` de la 022, que devuelve hasta 10 clientes; al elegir uno, su identificador va a la dirección como `cliente`. El texto no se guarda ni se registra.
- **Filtros aplicados**: siempre a la vista, encima de la tabla, cada uno con palabras («Estado: Aviso», «Cliente: …», «Periodo: …») y su botón para quitarlo.
- **Filtros manipulados** (REQ-077). Un parámetro que el esquema de la vista no declara no se lee. Un estado fuera de la lista o un identificador mal formado los descarta `estado-direccion.ts`. Un identificador bien formado de un cliente que no existe lo descarta el servidor al no encontrarlo. En los tres casos el filtro **no se aplica**, la vista dice «Algún filtro de la dirección no era válido y no se ha aplicado. Revisa los filtros aplicados» y muestra los que sí valen (decidido por delegación, DD-19). El valor recibido no se pinta ni se registra, y el mensaje es el mismo para «mal formado» y «no existe».
- **Vacíos**: sin ningún informe en el sistema, «Todavía no ha llegado ningún informe»; sin resultados, «Ningún informe cumple estos filtros. Quitar los filtros».
- **Datos parciales**: si falla el catálogo o el nombre del cliente filtrado, la lista se muestra y esa parte dice «No se ha podido cargar».

### Exportación (REQ-072 a REQ-074)

**Dónde.** Un solo botón, «Exportar cifras», en la sección de informes de la ficha. No hay otro en toda la función (PRUEBA-005).

**Diálogo previo** (decidido por delegación, DD-24). `DialogoExportar`, sobre `DialogoConfirmacion`: nombra al cliente con su distintivo (la fecha de alta), el periodo con fechas, cuántos informes tiene ese periodo según lo que la sección acaba de leer, qué contiene el archivo («solo cifras y valores de listas cerradas; ningún texto ni dato de correo»), el nombre del archivo, y avisa: «La exportación quedará registrada en la auditoría». Añade una ayuda: «Si lo abres con una hoja de cálculo, importa las columnas como texto». Botones «Exportar cifras» y «Cancelar». Cancelar no envía nada.

**Petición.** `descarga.ts` envía `POST` a la ruta de exportación con un cuerpo JSON de dos campos, `desde` y `hasta` (días `aaaa-mm-dd`). El identificador del cliente va en la ruta: elige, no concede.

**Manejador**, en este orden:

1. Guardia para manejadores de la 021, que comprueba el origen y la sesión completa. Sin acceso: 404 sin cuerpo.
2. Exige `Content-Type: application/json` y un cuerpo de 1 KB como mucho. Lee solo `desde` y `hasta` con su validador; cualquier otro campo no se lee.
3. Llama a la operación E-1 con la credencial del usuario.
4. Si la operación rechaza: responde con el motivo de lista cerrada, sin archivo.
5. Si la operación devuelve filas: `exportacion.ts` compone **el archivo entero en memoria**. Comprueba que el número de líneas compuestas es el que dijo la base de datos. Solo entonces empieza a responder, por partes, con `text/csv; charset=utf-8`, `Content-Disposition: attachment`, `no-store`, `nosniff` y dos cabeceras propias con el número de informes y el tamaño en bytes.
6. Cualquier fallo antes de ese punto se registra con `registrarFallo` y responde con motivo y referencia. No hay archivo, ni completo ni incompleto (REQ-079).

**En el navegador.** `descarga.ts` lee la respuesta completa. Da el archivo por bueno solo si el código es 200, el tipo es el esperado, el tamaño coincide con el anunciado y el número de líneas es el de informes más la cabecera. Entonces crea el archivo en memoria, lo ofrece con el nombre fijado y anuncia «Archivo descargado: N informes». En cualquier otro caso no ofrece nada. Traduce la respuesta a los mismos cuatro resultados de la 020: `hecha`, `rechazada` (con motivo), `no_permitida` (404, 401 o 403) e `incierta` (todo lo demás, y 30 segundos sin respuesta completa).

**Con `incierta`**, el mensaje dice: «No se ha podido completar la descarga. La exportación puede haber quedado registrada en la auditoría. Puedes volver a intentarlo». No se reintenta sola.

**Formato del archivo** (decidido por delegación, DD-10):

| Aspecto | Decisión |
| --- | --- |
| Tipo | CSV. Separador punto y coma; fin de línea CRLF; UTF-8 sin marca inicial. Todo el contenido es ASCII |
| Primera línea | Los nombres de las veinte columnas, los del contrato: `recibido_en`, `version_esquema`, `estado`, `modo`, `asistente`, `almacenamiento`, `version_prompt`, `frecuencia_horas`, `tratados`, `sin_tratar`, `borradores`, `documentos`, `facturas_pendientes`, `urgentes`, `comprobacion_correo`, `comprobacion_almacenamiento`, `comprobacion_contexto`, `comprobacion_registro`, `problemas`, `campos_descartados` |
| Filas | Una por informe, del más antiguo al más reciente |
| Fecha | ISO 8601 con segundos y desfase de Madrid: `2026-11-12T08:04:31+01:00` |
| Booleanos | `verdadero` o `falso` |
| Problemas | Los códigos, en orden alfabético y separados por un espacio. Vacío si no hay |
| Lo que no lleva | Nombre ni identificador del cliente, descripciones del catálogo, identificador del informe o de la ejecución, ninguna columna más |
| Nombre del archivo | `cifras-informes_<8 primeros caracteres del identificador>_<desde>_<hasta>.csv`. Sin el nombre del cliente, que puede ser el de una persona y quedaría en el historial de descargas (decidido por delegación, DD-12) |

**Cada celda se valida antes de escribirse.** Un valor de lista cerrada que no esté en su lista se escribe `desconocido`; lo mismo una versión del prompt o un código de problema que no cumplan su patrón. Un entero que no sea un entero dentro de sus límites, o una fecha que no se pueda leer, **detienen la exportación**: no hay archivo y se registra el fallo (decidido por delegación, DD-14). Así ninguna celda puede contener un punto y coma, comillas, un salto de línea ni empezar por `=`, `+`, `-` o `@`: no hace falta entrecomillar y no cabe una fórmula.

**Tope** (decidido por delegación, DD-13; asunto A-5). Una exportación lleva 50.000 informes como mucho. Con más, la operación rechaza con `demasiados_informes` («Hay demasiados informes en este periodo. Elige un periodo más corto»), sin archivo ni fila de auditoría. El cliente de referencia tiene 20.000.

**Tiempo máximo que se propone para la puerta P1** (REQ-072; asunto A-4): **10 segundos en el percentil 95 de 20 exportaciones**, desde que se confirma el diálogo hasta que el archivo está ofrecido, exportando 366 días del cliente de referencia (20.000 informes), en el mismo entorno que REQ-035. Es una estimación sin medir: la operación lee 20.000 filas por un índice, el archivo ronda los 2,5 MB con informes normales y el servidor lo compone en memoria. Pasados 30 segundos el navegador deja de esperar y da `incierta`.

**Qué pasa si T-P2 falla.** Si la plataforma no deja pasar una respuesta por partes de más de 4,5 MB, se aplica la alternativa escrita: exportación por partes de 5.000 informes, cada una pedida con el identificador de la fila de auditoría que escribió la primera, comprobado por la base de datos (misma cuenta, misma acción, mismo cliente y menos de 10 minutos). El archivo se monta en el navegador y solo se ofrece si están todas las partes. La tarea vuelve al arquitecto para detallarla.

### Resumen (REQ-012 a REQ-018)

Cuatro bloques, cada uno un `BloqueDatos` con su lectura. Si uno falla, pasa a error con «No se ha podido cargar» y su reintento; los demás siguen. Un bloque en error no pinta ningún número, ni cero, ni guion, ni el valor anterior (REQ-018).

| Bloque | Lectura | Contenido |
| --- | --- | --- |
| Clientes activos | L-9 | `TarjetaCifra` con el número de clientes que no están de baja. Sin variación |
| Informes de hoy | L-10 | `TarjetaCifra` con el total de hoy y, debajo, el desglose con palabras: «Correctos», «Con aviso», «Con error», «En pausa». Variación respecto a ayer a esta misma hora |
| Informes de hoy con aviso o error | L-11 | Tabla paginada: cliente (enlace a su ficha), recibido, estado. El más reciente primero. Vacío: «Hoy no ha llegado ningún informe con aviso ni con error» |
| Agentes sin señal | L-12 | `TarjetaCifra` con el número y, debajo, la lista paginada de clientes, cada uno con enlace a su ficha. La cifra es el total de esa misma lectura. Vacío: «Todos los agentes dan señal» |

- **Hoy** es el día natural de Madrid, calculado por la base de datos.
- **Variación** (REQ-017; decidido por delegación, DD-17). Solo la lleva «Informes de hoy», y compara con los informes recibidos ayer hasta esta misma hora de Madrid, no con el día de ayer entero: a las nueve de la mañana, comparar con un día completo daría siempre una bajada falsa. La lectura dice si la comparación es completa, es decir, si existe algún informe recibido antes de empezar el día de ayer. Si no lo es, la tarjeta no muestra variación y dice «Todavía no hay datos suficientes para comparar». La valoración es neutra. «Clientes activos» y «Agentes sin señal» no llevan variación: el sistema no guarda con qué compararlas sin inventar.
- **Lo que no aparece** (REQ-016). El Resumen no usa la zona de alertas de `RejillaCuerpo`, y no hay ningún elemento de alertas, canales ni impagos: ni vacío, ni a cero, ni anunciado.
- **«Sin señal» es estado del cliente.** L-12 y L-8 son funciones de solo lectura: no crean, abren ni cierran alertas (REQ-063).
- El Resumen es el destino tras iniciar sesión (REQ-012). Lo fija la 021.

### Sección de órdenes de la ficha (REQ-019, REQ-027)

Dos bloques: el estado de pausa (L-5) y el historial (L-6).

**Estado de pausa.** `EstadoPausa` muestra la situación con palabra, las fechas de creación, entrega y confirmación de la orden que la determina, la etiqueta «Sin confirmar» si esa orden está fuera de plazo, y las acciones.

| Situación | Palabra | Acciones que se ofrecen |
| --- | --- | --- |
| `activo_sin_ordenes` | «Activo, sin órdenes en vigor» | «Pausar agente» |
| `pausa_pendiente` | «Pausa pedida, pendiente de entrega» | «Reanudar agente», «Anular orden» |
| `pausa_entregada` | «En pausa, entregada sin confirmar» | «Reanudar agente», «Anular orden» |
| `pausa_confirmada` | «En pausa confirmada» | «Reanudar agente» |
| `reanudacion_pendiente` | «Reanudación pedida, pendiente de entrega» | «Pausar agente», «Anular orden» |
| `reanudacion_entregada` | «Reanudación entregada, sin confirmar» | «Pausar agente», «Anular orden» |
| `activo_reanudado` | «Activo, reanudación confirmada» | «Pausar agente» |

- Son las seis situaciones de REQ-027 más una, la reanudación ya confirmada, que la especificación no nombra y que existe (decidido por delegación, DD-08).
- Las acciones ofrecidas son una ayuda: decide la base de datos. Una situación fuera de la lista se pinta «Estado desconocido» y no ofrece ninguna acción.
- Con el cliente de baja no se ofrece crear y se dice por qué: «Este cliente está dado de baja: no se pueden crear órdenes». Anular sí se ofrece.

**Historial.** Tabla paginada, la más reciente primero: tipo, estado, autor, creada, entregada, confirmada y anulada. El estado es una palabra: «Pendiente», «Entregada», «Confirmada», «Anulada a mano» o «Anulada por sustitución» (REQ-023). Una orden viva fuera de plazo lleva además «Sin confirmar» (REQ-028). El autor es el correo del administrador, con `TextoDato`; si la cuenta ya no se puede leer, «Administrador no disponible». Vacío: «Este cliente no tiene órdenes».

### Página «Órdenes» (REQ-020)

- **Fuente**: L-7. **Columnas**: cliente (enlace a su ficha), tipo, estado, «Sin confirmar» si procede, autor y las cuatro fechas.
- **Filtros**: estado (los cuatro y «Todos») y cliente (`FiltroCliente`), con las mismas reglas de filtros aplicados y manipulados que la página «Informes». **Orden**: `creada_desc` (por defecto) y `creada_asc`.
- **Solo consulta** (decidido por delegación, DD-09). Crear y anular se hacen en la ficha, donde están el estado de pausa y los avisos. No hay casillas, selección de varios clientes ni acciones por fila.
- **Lectura de CA-018** (decidido por delegación, DD-22; asunto A-9). El criterio pide que la página muestre la palabra y las fechas de las seis situaciones. Cinco tienen una orden que las determina, y la página la muestra con su tipo, su estado y sus fechas. La sexta, «activo sin órdenes», es un cliente sin ninguna orden: al filtrar por él, la página muestra el vacío «Este cliente no tiene órdenes».

### Diálogos

Los tres usan `DialogoConfirmacion` de la 020, con el objetivo como `{nombre, distintivo}` (distintivo: la fecha de alta del cliente). El texto final lo escribe el `disenador-ui` en `textos.ts`; aquí se fija lo que cada uno tiene que decir. No tienen ningún campo (REQ-021). Cancelar, Escape o cerrar no llaman a ninguna acción.

**Crear una orden** (REQ-022, REQ-043, REQ-044, REQ-065).

| Parte | Pausar | Reanudar |
| --- | --- | --- |
| Título | «Pausar el agente» | «Reanudar el agente» |
| Siempre | «Se aplicará en la siguiente revisión del agente.» | «Se aplicará en la siguiente revisión del agente.» |
| Qué pasa | «El agente dejará de tratar el correo desde esa revisión hasta que se reanude.» **Depende de D-013.** Si D-013 no se confirma, la variante escrita es: «Desde esa revisión el agente recibirá el estado de pausa hasta que se reanude» | «El agente volverá a recibir sus instrucciones desde esa revisión, si su licencia está vigente.» |
| Botón | «Pausar agente» | «Reanudar agente» |

Avisos, cada uno solo cuando ocurre:

| Cuándo | Aviso |
| --- | --- |
| Hay una orden viva | «Este cliente tiene una orden de [pausa o reanudación] [pendiente de entrega o entregada sin confirmar], creada el …. Al confirmar quedará anulada.» |
| La orden viva está entregada | Se añade: «El agente ya la ha recibido y puede haberla aplicado.» |
| El cliente no tiene licencia vigente | «Este cliente no tiene licencia vigente. La orden se aplicará cuando su agente vuelva a pedir instrucciones.» |
| El cliente no tiene ninguna conexión activa | «Ningún agente recibirá esta orden hasta que haya una conexión activa. Mientras tanto aparecerá como sin confirmar cuando pase el plazo.» |

**Anular una orden** (REQ-064). Título «Anular la orden». Nombra el cliente, el tipo y el estado de la orden. Dice en qué situación quedará el cliente, que la base de datos ya ha calculado (L-5). Si la orden está entregada: «El agente ya ha recibido esta orden y puede haberla aplicado. En su siguiente revisión recibirá el estado que resulte de anularla.» Si el cliente está de baja, lo recuerda. Botón «Anular orden».

**Exportar.** Ver «Exportación».

**Tras confirmar** (REQ-030). Con `hecha`, la vista relee L-5 y L-6 y muestra lo leído, con un aviso temporal. Con `rechazada`, el diálogo muestra el motivo y la vista relee: si el motivo es `estado_cambiado`, el diálogo se cierra, la sección enseña el estado actual y el administrador decide de nuevo (REQ-076). Con `incierta`, el mensaje permanece, con un botón que relee, y no se puede repetir hasta haber releído.

### Fuente de datos y fuente ficticia

`FuenteInformes`, `FuenteOrdenes` y `FuenteResumen` son los únicos puntos por los que las vistas obtienen datos y ejecutan operaciones. Cada una tiene una implementación en el producto, su `fuente-bd.ts`, que las páginas, las acciones y el manejador usan **de forma fija**: no hay variable de entorno, indicador ni parámetro que elija otra (la misma decisión DD-15 de la 022). Las fuentes ficticias viven en `tests/ficticios/informes-ordenes/` y solo las montan la muestra y las pruebas. Un mismo juego de pruebas de contrato (PRUEBA-006) se ejecuta contra las ficticias en la etapa A y contra las reales en la etapa B.

## Contratos

Esta función **no cambia la forma de ningún contrato de `contratos/`**. Pide tres cambios de descripción, que no hace: los propone a coordinación.

| Contrato | Cambio propuesto | Motivo |
| --- | --- | --- |
| `obtener-instrucciones.schema.json` | La orden vigente se entrega en cualquier estado autorizado, no solo con `activa` | Sin eso, una pausa nunca se entrega (H-4). Bloquea CA-001 |
| `confirmar-orden.schema.json` | `confirmada` es `false` también si la orden está anulada o no se había entregado | REQ-066 |
| `informe.schema.json` | `sin_tratar` y `facturas_pendientes` son lo que queda al terminar la revisión; `tratados`, `borradores`, `documentos` y `urgentes`, lo hecho en ella | Cuestiones 14 y 17 |

Formas internas, todas de lista cerrada. Ninguna lleva quién actúa: sale de la sesión.

| Forma | Valores |
| --- | --- |
| Resultado de una acción y de la exportación | Los cuatro de la 020 (`hecha`, `rechazada`, `no_permitida`, `incierta`), con la tabla de `leerResultadoAccion()` sin excepciones (V-7) |
| Motivos de `rechazada` en órdenes | `no_encontrado`, `cliente_de_baja`, `estado_cambiado`, `ya_en_pausa`, `no_esta_en_pausa`, `transicion_no_permitida`, `datos_no_validos` |
| Motivos de `rechazada` en la exportación | `no_encontrado`, `periodo_no_valido` (con errores de campo), `sin_informes`, `demasiados_informes`, `datos_no_validos` |
| Errores de campo `{campo, codigo}` | Campos: `desde`, `hasta`. Códigos: `obligatorio`, `formato`, `fecha_inexistente`, `fin_antes_de_inicio`, `futura`, `demasiado_largo` |
| Tipo de orden | `pausar`, `reanudar` |
| Estado de una orden | `pendiente`, `entregada`, `confirmada`, `anulada`; forma de anulación: `manual`, `sustitucion` |
| Situación de pausa | Las siete de «Sección de órdenes» |
| Estado, modo, asistente y almacenamiento de un informe | Los del contrato del informe |
| Periodo | `hoy`, `7d`, `30d`, `90d`, `366d`, `personalizado` |
| Orden de las listas | Informes de la ficha: cuatro valores. Página «Informes»: `recibido_desc`, `recibido_asc`. Órdenes: `creada_desc`, `creada_asc` |
| Página | De 1 a 100.000 |
| Bloque del resumen | `clientes_activos`, `informes_hoy`, `avisos_errores`, `sin_senal` |
| Entradas de cada acción | Tabla «Operaciones» y «Superficie de lectura». Un campo que no esté en la lista no se lee, no se registra y no tiene efecto (REQ-051). Cada acción recibe un único objeto plano; cualquier otra forma es `datos_no_validos` |
| Estados nuevos del catálogo de la 020 | Ámbitos `informe`, `comprobacion`, `modo`, `almacenamiento`, `orden_tipo`, `orden`, `pausa`, `indicacion` (`sin_senal`, `en_pausa`, `sin_confirmar`), `descartados`, `catalogo_problema` (`retirado`, `sin_descripcion`) y `esquema` (`posterior`) |
| Códigos nuevos de `registro.ts` (fase 1) | `informes_lectura_fallida`, `ordenes_lectura_fallida`, `resumen_lectura_fallida`, `ordenes_no_permitida`, `ordenes_objeto_ajeno`, `ordenes_resultado_incierto`, `exportacion_fallida`, `exportacion_no_permitida`, `filtro_no_valido`. Sin valores |

`no_encontrado` vale igual para «no existe», «mal formado» y «no corresponde a este cliente»: un solo texto, «No se ha encontrado. Puede que ya no exista. Recarga la página» (REQ-049, REQ-050). Un tipo de orden fuera de la lista es `datos_no_validos`, y el valor recibido no llega a ningún mensaje ni registro (REQ-048).

## Datos

**Quién escribe las migraciones.** Son rutas críticas de la fase 2. Este diseño fija lo que necesita; cómo se reparte entre la 010, la 011, la 013 y una migración propia de la 023 lo decide el plan, con coordinación. Como todavía no hay ninguna migración, lo razonable es que estos cambios entren en las migraciones iniciales. Los nombres son propuestas, en español y sin tildes. Este diseño no escribe ninguna migración.

### Lo que se pide a la fase 2

| N.º | Sobre qué | Qué se pide | Requisitos |
| --- | --- | --- | --- |
| D-1 | `ordenes`: hechos con fecha | En lugar de `estado`: `creada_en`, `entregada_en`, `confirmada_en`, `anulada_en`; `anulacion` (`manual` o `sustitucion`), presente si y solo si hay `anulada_en`; `sustituida_por` (la orden nueva), presente si y solo si la anulación es por sustitución; `creada_por` obligatorio, puesto por la operación a partir de la sesión; `numero`, una secuencia que da el orden entre órdenes. Ninguna columna de texto | REQ-021, REQ-023 |
| D-2 | `ordenes`: restricciones | Nunca `confirmada_en` y `anulada_en` a la vez; `confirmada_en` exige `entregada_en` anterior o igual; ninguna fecha de entrega posterior a la de anulación; todas las fechas, posteriores o iguales a `creada_en` | REQ-066, REQ-075 |
| D-3 | Una orden viva por cliente | `viva`, calculada por la base de datos (ni confirmada ni anulada), con **índice único parcial de una orden viva por cliente** | REQ-025, REQ-041 |
| D-4 | Inmutabilidad, como segunda capa | Disparadores que rechazan, **venga de quien venga**: cambiar tipo, cliente, autor, `creada_en` o `numero`; quitar o cambiar una fecha ya puesta, la forma de anulación o `sustituida_por`; poner `entregada_en` o `confirmada_en` en una orden anulada; poner `anulada_en` en una confirmada; borrar una orden | REQ-024, REQ-052, REQ-066 |
| D-5 | Permisos | `authenticated` **sin** `insert`, `update` ni `delete` sobre `ordenes` ni sobre `informes`. Sin escritura tampoco sobre `catalogo_problemas`: esta fase no lo gestiona y el inventario de la 024 no tiene entrada para ello. En la fase 3, un usuario de cliente no lee ninguna fila de `informes` ni de `ordenes` (asunto A-10) | REQ-010, REQ-038, REQ-052, REQ-053 |
| D-6 | Regla única de pausa | `privado.situacion_pausa(cliente)` y `privado.pausa_efectiva(cliente)`, que usan el panel, la lista de clientes de la 022 y el conector. Tabla en «Estado derivado» | REQ-026, REQ-027 |
| D-7 | Regla única de «sin señal» | La función de la 013 que decide si un cliente está sin señal en un instante: la misma que usa su cálculo para abrir la alerta, de solo lectura y evaluable al consultar. Esta función no la escribe ni la cambia | REQ-015, REQ-063 |
| D-8 | Lecturas | Las doce de «Superficie de lectura» | REQ-004 a REQ-020, REQ-068 a REQ-070 |
| D-9 | Operaciones | Las tres de «Operaciones», con la forma de exponerlas que la 010 fije para las «operaciones del panel» (la misma petición de la 021 y de la 022) | REQ-019 a REQ-030, REQ-072 a REQ-074 |
| D-10 | `auditoria` | `accion` de lista cerrada con I-13 a I-18, H-01 y H-02; `fila_principal_id`; dos columnas de fecha, `periodo_desde` y `periodo_hasta`, que solo lleva I-18; inserción solo desde funciones. **Sin el disparador genérico** sobre `ordenes` | REQ-029, REQ-067, REQ-074 |
| D-11 | Conector | Lista en «Lo que el conector tiene que cumplir» | REQ-023, REQ-046, REQ-066, REQ-075 |
| D-12 | Índices | `informes (cliente_id, recibido_en, id)`; `informes (recibido_en, id)`; `informes (estado, recibido_en, id)`; `ordenes (cliente_id, numero)`; `ordenes (creada_en, id)`; el único parcial de D-3. Son una estimación (ver «Valores») | REQ-035, REQ-058 |
| D-13 | Datos ficticios | El volumen de referencia (1.000 clientes, 200.000 informes de los que 20.000 son de un cliente repartidos en 366 días, 5.000 órdenes); los casos de CA-004, CA-006, CA-008, CA-010, CA-011, CA-018, CA-019, CA-029, CA-032, CA-037 y CA-039; informes a las 23:59 y a las 00:01 de Madrid y en los dos días de cambio de hora | CA-007 y los citados |
| D-14 | Sitio para las pruebas | Donde ejecutar pruebas de base de datos con varias conexiones a la vez (asunto A-8) | CA-015, CA-016, CA-023, CA-034 |

### Estado derivado

Se calcula en el momento de la consulta, con el reloj de la base de datos.

| Objeto | Regla |
| --- | --- |
| Estado de una orden | `anulada` si tiene `anulada_en`; si no, `confirmada` si tiene `confirmada_en`; si no, `entregada` si tiene `entregada_en`; si no, `pendiente` |
| Orden viva | Pendiente o entregada |
| Orden determinante de un cliente | Su orden no anulada de mayor `numero`. Si hay una orden viva, es ella |
| Situación de pausa | Sin orden determinante: `activo_sin_ordenes`. Con ella: la combinación de su tipo y su estado, según la tabla de «Sección de órdenes» |
| Pausa efectiva y «En pausa» | La orden determinante es de tipo `pausar`, en cualquiera de sus tres estados |
| Orden sin confirmar | Orden viva cuyo tiempo desde `creada_en` es **mayor** que 2 veces `clientes.frecuencia_esperada_horas`. Nunca una confirmada ni una anulada. No usa la frecuencia que declaran los informes |
| Sin señal | Lo que diga la función de la 013 |
| Hoy | El día natural de Madrid |

**Por qué un número y no la fecha** (decidido por delegación, DD-05). Dos operaciones sobre el mismo cliente se ejecutan una detrás de otra, pero la que espera el cerrojo pudo empezar antes: si la fecha fuera la del inicio de la transacción, la orden creada después tendría una fecha anterior y «la más reciente» sería la equivocada. Por eso el orden lo da `numero`, y todas las fechas de una orden se toman del reloj **después** de tener el cerrojo.

### Superficie de lectura

Todas devuelven cero filas si `privado.es_admin()` no se cumple, con independencia de las políticas que otras fases añadan a las tablas (decidido por delegación, DD-20). Se ejecutan con la sesión del usuario y pasan por `leerDelArea()`. Son de solo lectura. Devuelven columnas con nombre; ninguna devuelve una fila entera.

| N.º | Lectura | Entradas | Devuelve |
| --- | --- | --- | --- |
| L-1 | Histórico de un cliente | Cliente, desde, hasta, orden, página | Por informe: los veinte datos. El total del periodo. Y si el cliente tiene algún informe |
| L-2 | Evolución de un cliente | Cliente, desde, hasta | Por cada día de Madrid con informes (366 como mucho): la suma de tratados, borradores, documentos y urgentes, y el último valor de sin tratar y de facturas pendientes |
| L-3 | Informes de todos | Cliente (opcional), estado (opcional), desde, hasta, orden, página | Por informe: identificador y nombre del cliente y los veinte datos. El total |
| L-4 | Catálogo de problemas | — | Por código: descripción y si está activo |
| L-5 | Estado de pausa de un cliente | Cliente | Situación; de la orden determinante: identificador, tipo, estado, fechas y si está fuera de plazo; la situación que resultaría de anularla, si está viva; y, para los avisos, si el cliente está de baja, si tiene licencia vigente y cuántas conexiones activas tiene (con las reglas únicas de la 022) |
| L-6 | Órdenes de un cliente | Cliente, página | Por orden: identificador, tipo, estado, forma de anulación, correo del autor, las cuatro fechas y si está fuera de plazo. El total |
| L-7 | Órdenes de todos | Estado (opcional), cliente (opcional), orden, página | Lo de L-6, más identificador y nombre del cliente. El total |
| L-8 | Indicaciones | Hasta 25 identificadores de cliente | Por cliente: `sin_senal` y `en_pausa`. Es la L-7 que pide la 022 |
| L-9 | Resumen: clientes activos | — | Un entero |
| L-10 | Resumen: informes de hoy | — | El total de hoy, uno por cada estado, los recibidos ayer hasta esta misma hora y si esa comparación es completa |
| L-11 | Resumen: avisos y errores de hoy | Página | Por informe: identificador y nombre del cliente, recepción y estado. El total |
| L-12 | Resumen: clientes sin señal | Página | Por cliente: identificador y nombre. El total |

Los periodos llegan como dos días. La base de datos comprueba que el fin no es anterior al inicio, que ninguno es posterior a hoy y que no suman más de 366; si no, no devuelve filas y contesta `periodo_no_valido`. La página se acota de 1 a 100.000.

### Operaciones

Las llama el servidor con la credencial del usuario. Ninguna recibe quién actúa, ni un estado, ni una fecha, ni un texto. Ninguna devuelve texto.

**O-1 · Crear una orden.** Entradas: `cliente`, `tipo`, `situacion_esperada` y `orden_esperada` (el identificador de la orden determinante que el administrador tenía delante, o ninguno).

1. `privado.es_admin()`; si no se cumple, `no_permitida` y nada más.
2. Cerrojo del cliente, el mismo que usan las operaciones de la 022.
3. El cliente existe; si no, `no_encontrado`. No está de baja; si lo está, `cliente_de_baja` (REQ-042).
4. Se calculan la orden determinante y la situación con lo recién leído. Si no coinciden con las esperadas, `estado_cambiado`, sin cambios (REQ-040, REQ-041, REQ-076).
5. Coherencia (REQ-026): `pausar` exige que no haya pausa efectiva (`ya_en_pausa`); `reanudar` exige que la haya (`no_esta_en_pausa`).
6. Si hay una orden viva, se anula por sustitución: `anulada_en`, `anulacion = sustitucion` y `sustituida_por`.
7. Se crea la orden nueva, pendiente, con el autor de la sesión y la fecha del reloj.
8. Auditoría: fila principal I-13 o I-14 y, si hubo sustitución, fila vinculada I-17. Si una fila no se puede escribir, la transacción entera se deshace (REQ-025, REQ-029).
9. Devuelve `hecha` y el identificador de la orden nueva.

Por el paso 5, la orden viva que se sustituye es siempre del tipo contrario. Por el paso 4, un doble clic no sustituye la orden que acaba de crear el primer envío: el segundo ve otra orden determinante y se rechaza.

**O-2 · Anular a mano.** Entradas: `cliente`, `orden` y `estado_esperado` (`pendiente` o `entregada`).

1. `privado.es_admin()`.
2. Cerrojo del cliente.
3. La orden existe y es de ese cliente; si no, `no_encontrado` (REQ-050).
4. Estado recién leído. Confirmada o anulada: `transicion_no_permitida`, sin cambios ni fila (REQ-045). Viva pero en un estado distinto del esperado: `estado_cambiado` (REQ-076).
5. `anulada_en` del reloj y `anulacion = manual`.
6. Auditoría: fila principal I-15 o I-16, según el tipo.
7. Devuelve `hecha`.

Se puede anular con el cliente de baja (decidido por delegación, DD-07): la especificación no lo limita y es una corrección; mientras dure la baja el agente recibe `suspendida` en cualquier caso.

**E-1 · Exportar las cifras de un cliente.** Entradas: `cliente`, `desde`, `hasta`.

1. `privado.es_admin()`.
2. El cliente existe (`no_encontrado`). Vale también uno de baja (decidido por delegación, DD-23).
3. El periodo es válido con el reloj de la base de datos (`periodo_no_valido`).
4. **Una sola lectura** de los informes del cliente en el periodo, por orden de recepción, con 50.001 filas como mucho. Cero filas: `sin_informes`. Más de 50.000: `demasiados_informes`. En los dos casos, sin fila de auditoría (REQ-080).
5. Fila de auditoría I-18, con el cliente y los dos días del periodo. Si no se puede escribir, no se devuelve nada (REQ-079).
6. Devuelve `hecha`, el número de informes y las filas, con los veinte datos y ninguno más.

El número de informes sale de la misma lectura que las filas: no hay una cuenta aparte que pueda diferir.

### Transiciones de una orden

Para CA-015. «—» es un rechazo sin cambios.

| Estado | Anular a mano (O-2) | Sustituir (O-1 con la contraria) | Entregar (conector) | Confirmar (conector) | Cualquier cambio directo con sesión |
| --- | --- | --- | --- | --- | --- |
| Pendiente | Hecha | Hecha | Hecha | — (`confirmada: false`) | — |
| Entregada | Hecha | Hecha | Se vuelve a servir; la fecha de entrega no cambia | Hecha | — |
| Confirmada | — (`transicion_no_permitida`) | No la toca: no está viva | No se sirve | Sin cambios (`repetida: true`) | — |
| Anulada, a mano o por sustitución | — (`transicion_no_permitida`) | No la toca | No se sirve | — (`confirmada: false`) | — |

### Cerrojos y simultaneidad

- **Un cerrojo, el del cliente.** Lo toman O-1, O-2, las operaciones de la 022 y las funciones del conector que entregan o confirman una orden. Su forma la decide la 010, con una condición: no puede bloquear las comprobaciones de clave ajena de quien inserta ejecuciones o informes de ese cliente.
- **Una orden viva por cliente**: cerrojo e índice único. El índice es lo que una prueba puede demostrar insertando a mano; el cerrojo es lo que da un resultado limpio en lugar de un error (decidido por delegación, DD-03).
- **Estado esperado** (decidido por delegación, DD-02). Resuelve con una sola comprobación el doble clic, los dos administradores a la vez y el diálogo viejo. No hace falta una clave de repetición enviada por el navegador.
- **Anulación contra entrega y contra confirmación.** Como las dos partes toman el mismo cerrojo, una ocurre entera antes que la otra, y D-2 impide que queden las dos fechas. Lo que ve el administrador:

| Qué ocurre antes | Resultado de la anulación | Estado final |
| --- | --- | --- |
| La anulación, y después el conector intenta entregar | `hecha` | Anulada, sin fecha de entrega. El agente no la recibe |
| La entrega, y después llega la anulación que esperaba una orden pendiente | `estado_cambiado` | Entregada, con su fecha. El administrador ve el estado actual y, si quiere, anula de nuevo con el aviso de orden ya recibida |
| La anulación de una orden entregada, y después el conector intenta confirmar | `hecha` | Anulada. La confirmación devuelve `confirmada: false` |
| La confirmación, y después llega la anulación | `transicion_no_permitida` | Confirmada |

La segunda fila es la lectura que este diseño hace de un choque entre REQ-046 y REQ-076 (decidido por delegación, DD-06; asunto A-3).

### Lo que el conector tiene que cumplir (D-11)

1. Leer la orden determinante, decidir el estado servido y anotar la entrega ocurren con el cerrojo del cliente tomado. Las fechas se toman del reloj después de tenerlo.
2. El estado servido usa `privado.pausa_efectiva()` (D-6), no una regla propia.
3. Solo se sirve una orden viva. Una orden anulada, a mano o por sustitución, no se sirve nunca (REQ-066).
4. La orden viva se sirve en cualquier estado autorizado (`activa`, `pausada`, `suspendida`) y a cualquier conexión activa del cliente, también a una nueva (REQ-043, REQ-044). Mientras no se confirme, se vuelve a servir en cada revisión.
5. `confirmar_orden` solo confirma una orden del cliente del token, entregada, sin anular y sin confirmar. Anulada, nunca entregada, inexistente o de otro cliente: `confirmada: false`, sin cambios. Ya confirmada: `repetida: true`, sin cambios (decidido por delegación, DD-04).
6. Los hechos H-01 (entregó) y H-02 (confirmó) del inventario de la 024 los escribe la fase 2, en la misma transacción. La 023 no escribe hechos.
7. Una orden solo lleva `id` y `tipo` hacia el agente, como ya dice el contrato. Ningún campo nuevo.
8. Si la 014 purga datos antiguos, no purga órdenes vivas ni la orden determinante de un cliente.

### Matriz de acceso de esta función

Para CA-002. «0» es cero filas o rechazo.

| Perfil | Lecturas L-1 a L-12 | `informes` y `ordenes`, directamente | O-1 y O-2 | E-1 y manejador |
| --- | --- | --- | --- | --- |
| Sin sesión | 0 | 0 | 0 | 0; el manejador responde 404 |
| Usuario autenticado sin rol | 0 | 0 | `no_permitida`, sin efecto | `no_permitida`; 404 |
| Usuario de un cliente, con cualquier identificador (el suyo, otro, uno inexistente) | 0 | 0 en la fase 3 (asunto A-10) | `no_permitida`, sin efecto | `no_permitida`; 404 |
| Administrador con un solo factor, o con la sesión cerrada o caducada en el registro de la 021 | 0 | 0 | `no_permitida`, sin efecto | `no_permitida`; 404 |
| Administrador activo con sesión completa | Todas | Solo lectura; ninguna escritura | Las dos | Sí |
| Rol del conector | 0 | Solo lo que sus funciones necesitan (fase 2) | 0 | 0 |

### Migración y vuelta atrás

| Migración | Contenido | Vuelta atrás |
| --- | --- | --- |
| M-1 | Columnas, restricciones e índices de D-1 a D-3 y D-12 | Si entra en las migraciones iniciales, es la de la tabla. Como alteración posterior: solo sin datos reales |
| M-2 | Funciones de estado (D-6) y lecturas (D-8) | Las elimina. El panel deja de leer: falla hacia el lado seguro |
| M-3 | Operaciones (D-9) | Las elimina y revoca sus permisos. El panel deja de poder crear, anular y exportar. **Las órdenes vivas siguen en vigor**: revertir no las anula, y conviene anularlas o confirmarlas antes. Se anota en la guía de operación |
| M-4 | Permisos de D-5 y disparadores de D-4 | **Su vuelta atrás devuelve la escritura directa sobre las órdenes.** No se revierte sola en un entorno con datos reales; solo junto con una versión de la app sin esta función |
| M-5 | Cambios en `auditoria` (D-10) | De la 010. En producción no se revierte |

La vuelta atrás de cada una se prueba aplicándola, revirtiéndola y volviéndola a aplicar con los datos ficticios cargados (PRUEBA-026). **Hoy no hay dónde ejecutar esa prueba.**

## Flujo

### Pausar un agente y saber que lo ha aplicado

1. En la ficha, la sección de órdenes muestra «Activo». El administrador pulsa «Pausar agente». Se abre el diálogo con lo que la sección leyó; no se pide nada al servidor.
2. Confirma. `useAccion` bloquea el botón y envía `crearOrden` por `POST`, con el tipo y el estado que tenía delante.
3. La acción comprueba el origen y la sesión, valida las entradas y llama a O-1.
4. La base de datos crea la orden y sus filas de auditoría. La vista relee y muestra «Pausa pedida, pendiente de entrega», con la fecha de creación.
5. En la siguiente revisión, el conector sirve `pausada`, entrega la orden y anota la fecha. El agente la confirma. Al volver a cargar, el panel muestra «En pausa confirmada» con las tres fechas.
6. Si pasan 2 veces la frecuencia esperada sin confirmación, la orden lleva «Sin confirmar» en la ficha y en la página «Órdenes». No se genera ninguna alerta.

### Corregir una decisión

- **Sustituir.** Con una pausa viva, «Reanudar agente» abre el diálogo con el aviso de que la pausa quedará anulada (y, si está entregada, de que el agente ya la ha recibido). Al confirmar, O-1 anula la pausa por sustitución y crea la reanudación, juntas.
- **Anular.** «Anular orden» sobre una orden viva. El diálogo dice en qué situación quedará el cliente. O-2 la anula y la vista relee.

### Consultar y exportar

1. La ficha carga sus bloques a la vez. Cambiar el periodo vuelve a pedir el histórico y la evolución, no la ficha.
2. «Exportar cifras» abre el diálogo. Al confirmar, el navegador envía la petición; el manejador comprueba, llama a E-1, compone el archivo entero y lo envía. El navegador comprueba tamaño y filas y lo ofrece.

### Cuando algo falla

| Fallo | Qué pasa |
| --- | --- |
| La base de datos no responde o falla durante una lectura | El bloque pasa a error con reintento. Nunca se pinta vacío, ni un cero, ni «Activo» por defecto, ni datos de antes como actuales |
| Falla un bloque del resumen | Solo ese bloque pasa a error. Los demás se muestran (REQ-059) |
| Falla la lectura de «sin señal» | El bloque dice que no se ha podido comprobar. Nunca «0 agentes sin señal» ni la ausencia de la etiqueta |
| La base de datos falla a mitad de crear, anular o sustituir | La transacción se deshace entera: ni orden nueva, ni orden sustituida, ni filas de auditoría. Resultado `incierta`; la vista relee (REQ-060) |
| No se puede escribir una fila de auditoría | Igual: no hay efecto |
| La respuesta de una operación no llega | `incierta`. Reintentar no duplica: tras releer, el estado esperado ya es otro |
| La sesión deja de valer entre abrir el diálogo y confirmar | `no_permitida`, sin cambios ni auditoría (REQ-039) |
| El estado cambió entre abrir el diálogo y confirmar | `estado_cambiado` o `transicion_no_permitida`. La vista relee y lo muestra |
| Falla la base de datos o la auditoría durante una exportación | No se devuelve ninguna fila y no hay archivo |
| Falla la composición del archivo, o una celda no es válida | No hay archivo. La fila de auditoría ya está escrita: queda una exportación registrada sin archivo entregado. Es el lado seguro: nunca al revés |
| La descarga se corta | El navegador no ofrece nada y da `incierta`. Misma consecuencia que la fila anterior |
| Llega un valor fuera de una lista cerrada | Estado: «Estado desconocido» o «Valor desconocido», y ninguna acción. Resultado de acción: `incierta` |

## Auditoría de esta función

**Regla.** Cada fila la escribe la función de la operación, en su misma transacción. El actor es el de la sesión. Las dos filas de una sustitución llevan el mismo momento y la vinculada apunta a la principal. El objeto es el identificador de la orden o del cliente; el cliente, el del objeto. **Ninguna fila lleva texto ni cifras de informes.** La de I-18 lleva, además, los dos días del periodo. El inventario es el de la especificación de la 024 (`specs/024-auditoria/especificacion.md`, «Inventario de acciones de superadmin de la fase 3», 41 entradas).

| Entrada de la 024 | Operación | Fila | Objeto |
| --- | --- | --- | --- |
| I-13 Creó una orden de pausa | O-1 con `pausar` | Principal | La orden nueva |
| I-14 Creó una orden de reanudación | O-1 con `reanudar` | Principal | La orden nueva |
| I-15 Anuló una orden de pausa | O-2 | Principal | La orden anulada |
| I-16 Anuló una orden de reanudación | O-2 | Principal | La orden anulada |
| I-17 Anuló por sustitución una orden | O-1, cuando había una orden viva | Siempre vinculada, a I-13 o a I-14 | La orden sustituida |
| I-18 Exportó las cifras de los informes de un cliente | E-1 | Principal | El cliente; con el periodo |
| H-01 Entregó una orden, H-02 Confirmó una orden | Conector (fase 2) | Hechos sin persona | La orden |

- **No dejan fila** (REQ-067): las lecturas de las cinco vistas, un diálogo cancelado, una acción rechazada y una exportación rechazada o sin informes.
- Una acción `no_permitida` y un identificador que no corresponde al cliente de la ficha no dejan fila, pero sí suman en la supervisión, con un código de lista cerrada y sin valores.
- **El periodo en I-18** (asunto A-6). REQ-074 lo exige y la 010 dice que la auditoría no guarda valores. Dos días no son un valor de una fila cambiada ni un dato personal, pero sí son columnas nuevas en un conjunto cerrado. Se pide a la 010 y a la 024.
- **Una fila I-18 dice que se autorizó y se preparó una exportación**, no que el archivo llegara al disco del administrador: eso el servidor no lo puede saber.

## Tareas previas: lo que hay que comprobar antes de construir

Van las primeras en el plan. Ninguna construye producto. Cada una deja evidencia en `evidencias/` y tiene regla de decisión.

| Tarea | Qué comprueba | Regla de decisión |
| --- | --- | --- |
| **T-P1** · Forma de exponer lecturas y operaciones | La que fije la 010 para la 021 y la 022 vale para las doce lecturas y las tres operaciones, con funciones que no están en un esquema expuesto, y deja devolver 50.000 filas en una llamada | Si la 010 no la fija, esta función no pasa de la etapa A |
| **T-P2** · Archivo grande y descarga | En la plataforma de despliegue: un manejador que responde por partes entrega entero un archivo de 8 MB. En los tres motores: el navegador lo recibe, comprueba tamaño y líneas y lo ofrece desde un diálogo, con teclado; una respuesta cortada a la mitad no ofrece nada; la respuesta lleva `no-store` | Pasa: se sigue. No pasa el tamaño: se aplica la exportación por partes y la tarea vuelve al arquitecto. No se puede ofrecer el archivo en algún motor: vuelve al arquitecto antes de construir `DialogoExportar` |
| **T-P3** · Días de Madrid en el Postgres real | Que la base de datos del proyecto de desarrollo agrupa por día de Madrid igual que `diaDeMadrid` de la 020, con un juego de instantes compartido que incluye las 23:59, las 00:01 y los dos días de cambio de hora | Coincide: se sigue. Difiere: manda la base de datos, se corrige la función de la 020 o se fija la zona de forma expresa, y se repite |
| **T-P4** · Gráfico de 366 puntos | Dentro de la muestra de la 020: `GraficoLineas` con 366 puntos y cuatro series se lee, no se sale de su contenedor a 320 píxeles y su tabla de 366 filas se usa con teclado | Pasa: se sigue. No pasa: la 020 ajusta el componente (por ejemplo, sin marcadores a partir de cierto número de puntos). Los valores siguen siendo diarios: REQ-009 no admite agrupar por semanas |

## Amenazas de esta función

Ninguna prueba se ha ejecutado. Las referencias A-nn son las de `docs/SEGURIDAD.md`. Donde queda un riesgo, se dice. Ruta crítica: órdenes y su entrega al agente; se incluyen la exportación y los filtros.

| N.º | Amenaza | Control | Prueba que lo demuestra |
| --- | --- | --- | --- |
| AM-01 | Una sesión de superadmin comprometida pausa a los clientes uno a uno y deja el servicio parado (A-11) | El acceso de la 021 (doble factor, corte inmediato); cada orden queda con su actor; se revierte con una reanudación. **Riesgo que queda:** no hay límite de ritmo ni aviso fuera del panel hasta la fase 4 (asunto A-11) | PRUEBA-021 |
| AM-02 | La misma sesión reanuda a un cliente que se pausó por un incidente | Lo mismo. Reanudar no entrega nada por sí mismo: el agente solo recibe instrucciones si además su licencia y su versión lo permiten | PRUEBA-021, PRUEBA-034 |
| AM-03 | Una orden hace que el agente reciba algo que relaja sus límites (artículo 8, A-13) | Una orden es un tipo de una lista de dos valores; no tiene texto ni parámetros; el panel no puede escribir nada más en ella, y la base de datos tampoco lo admite | PRUEBA-004, PRUEBA-017 |
| AM-04 | Un usuario de cliente, un usuario sin rol o un administrador con un solo factor lee informes u órdenes, exporta o crea una orden; el identificador de un cliente se toma por permiso (A-07, A-11) | Guardia en cada página, acción y manejador; `es_admin()` dentro de cada lectura y de cada operación; lecturas que no dependen de políticas ajenas | PRUEBA-016, PRUEBA-029 |
| AM-05 | Con la sesión de un superadmin, escribir directamente en la API de datos: marcar una orden como entregada o confirmada, revivir una anulada, cambiar tipo, cliente, autor o fechas, borrarla | Ningún permiso de escritura sobre `ordenes` (D-5); disparadores de inmutabilidad (D-4) | PRUEBA-017, PRUEBA-018 |
| AM-06 | Falsear cifras: crear, cambiar o borrar un informe con la sesión de un superadmin | Ningún permiso de escritura sobre `informes`; la interfaz no tiene ningún control | PRUEBA-005, PRUEBA-017 |
| AM-07 | Identificador de una orden de otro cliente, inexistente o mal formado (artículo 2) | La operación comprueba dentro de la base de datos que la orden es del cliente indicado; un solo resultado para todos los casos; cuenta en la supervisión | PRUEBA-020, PRUEBA-030 |
| AM-08 | Doble envío, dos administradores a la vez o un diálogo con datos viejos: dos órdenes vivas, una orden sustituida por error o una orden anulada sin el aviso correcto | Estado esperado, cerrojo del cliente e índice único de una orden viva | PRUEBA-019, PRUEBA-020 |
| AM-09 | Una orden anulada llega al agente, o se confirma después (REQ-066) | El conector decide con el cerrojo tomado y solo sirve órdenes vivas; restricción que impide confirmación y anulación a la vez; disparador | PRUEBA-018, PRUEBA-022 |
| AM-10 | Una orden entregada al agente no deja constancia de su entrega, o el panel muestra un orden de los hechos que no ocurrió (REQ-046) | Entrega y anotación en la misma transacción y con el mismo cerrojo que la anulación; fechas tomadas tras el cerrojo; orden por secuencia | PRUEBA-022 |
| AM-11 | El conector y el panel deciden «en pausa» con reglas distintas: el panel dice una cosa y el agente recibe otra | Una sola función (D-6). **Depende de la fase 2**: este diseño lo exige y lo prueba de extremo a extremo | PRUEBA-034 |
| AM-12 | Campos de más para fijar estado, autor, fechas, otro cliente o un texto (REQ-051) | Entradas de lista cerrada; operaciones con parámetros fijos; autor y fechas los pone la base de datos | PRUEBA-004, PRUEBA-030 |
| AM-13 | El valor enviado (un tipo inventado, un identificador, un filtro) acaba en un mensaje o en un registro (A-15) | Los validadores devuelven códigos; `registrarFallo` solo admite códigos; ningún mensaje se construye con lo recibido | PRUEBA-030, PRUEBA-031 |
| AM-14 | El archivo exportado lleva algo más que cifras: datos de otro cliente, un nombre, un campo desconocido de un esquema posterior (A-14) | E-1 lee un solo cliente y columnas con nombre; `exportacion.ts` escribe veinte columnas fijas y valida cada celda contra su lista; el archivo no lleva nombre ni identificador | PRUEBA-003, PRUEBA-025, PRUEBA-036 |
| AM-15 | Una celda del archivo se interpreta como fórmula al abrirlo en una hoja de cálculo | Ninguna celda puede empezar por `=`, `+`, `-` o `@`: todas son enteros no negativos, valores de lista cerrada, una fecha ISO o códigos de letras minúsculas. **Riesgo que queda:** una hoja de cálculo puede convertir `1.2` en una fecha; el diálogo lo avisa | PRUEBA-003 |
| AM-16 | Un archivo sin fila de auditoría, o una exportación que no deja rastro (REQ-074) | Lectura y fila en la misma transacción; el servidor no tiene filas que enviar si la fila no se escribió. Lo contrario (fila sin archivo) es posible y se declara | PRUEBA-021, PRUEBA-031 |
| AM-17 | La exportación se lanza desde otro sitio, con un enlace o con la página incrustada (A-21) | Solo `POST`; origen comprobado por la guardia; cuerpo JSON, que un formulario de otro sitio no puede enviar; cookie `SameSite=Strict` (021); cabeceras de la 002 | PRUEBA-030 |
| AM-18 | Se entrega un archivo incompleto que parece entero | El archivo se compone entero antes de responder; el navegador comprueba tamaño y número de líneas antes de ofrecerlo | PRUEBA-012, PRUEBA-031 |
| AM-19 | Exportar en bucle para sacar los datos de todos los clientes o para cargar el sistema (A-22) | Solo un superadmin; un cliente por archivo; 366 días y 50.000 informes como mucho; cada exportación deja su fila con actor, cliente y periodo. **Riesgo que queda:** no hay límite de ritmo. Lo que sale son cifras, no contenido de correo | PRUEBA-021, PRUEBA-025 |
| AM-20 | El archivo o su nombre quedan en cachés o historiales | `no-store`; el nombre del archivo no lleva el nombre del cliente. **Riesgo que queda:** el archivo en el equipo del administrador está fuera del sistema | PRUEBA-012 |
| AM-21 | Filtros manipulados: estado fuera de la lista, cliente inexistente o mal formado, parámetros de más, periodo de 367 días, página enorme, para forzar un error interno, ver filas que no tocan o cargar la base de datos | `estado-direccion.ts`, validadores del servidor y validación en la base de datos; consultas con parámetros; página y periodo acotados; el filtro no válido no se aplica y se avisa | PRUEBA-002, PRUEBA-009, PRUEBA-030 |
| AM-22 | El texto con el que se busca un cliente para filtrar queda en direcciones, historial o registros. El nombre de un autónomo es un dato personal (artículo 1) | Viaja en el cuerpo (V-3); no se guarda ni se registra; a la dirección solo va el identificador elegido | PRUEBA-009, PRUEBA-030 |
| AM-23 | Averiguar si un cliente existe sin ser administrador, por la respuesta o por el tiempo | La guardia decide antes de cualquier consulta; denegado, inexistente y mal formado responden igual (V-1) | PRUEBA-029 |
| AM-24 | Un nombre de cliente o una descripción del catálogo ejecutan código en el área de superadmin (A-21) | `TextoDato` y `textoPlano()` en tablas, diálogos, avisos, filtros aplicados y nombres accesibles; ninguna dirección ni atributo construido con un dato; un código de problema solo se pinta si cumple su patrón. La política de contenido es de la 021 y no está demostrada: mientras tanto, el escapado es el control principal | PRUEBA-015 |
| AM-25 | Un fallo enseña algo falso: un cero por un bloque caído, vacío en lugar de error, «Activo» por defecto, «todos dan señal» cuando no se pudo comprobar, o datos ficticios en producción (artículo 3) | `BloqueDatos` y `leerDelArea()`; estado desconocido sin acciones; todo resultado no reconocido es `incierta`; la fuente del producto es fija | PRUEBA-005, PRUEBA-006, PRUEBA-010, PRUEBA-031 |
| AM-26 | La etiqueta «Sin señal» y la alerta de la 013 se contradicen, o mirar el panel abre o cierra alertas | Una sola función, la de la 013, de solo lectura | PRUEBA-024 |
| AM-27 | Un informe de un esquema posterior trae campos o valores que el panel no conoce y acaban en pantalla o en el archivo | Columnas con nombre; valores contra listas cerradas; lo demás es «desconocido» | PRUEBA-001, PRUEBA-003, PRUEBA-007 |
| AM-28 | La clave secreta se usa para leer informes o escribir órdenes (A-10) | Ninguna pieza importa `admin.ts`; todo va con la sesión del usuario | PRUEBA-005, PRUEBA-032 |
| AM-29 | Una función con privilegios, ejecutable por cualquier usuario con sesión, tiene un fallo: un usuario de cliente de la fase 5 podría pausar a otro cliente | Primera instrucción, `es_admin()`; `search_path = ''`; esquema no expuesto; sin SQL construido con texto; cada función se prueba con cada perfil; dictamen del auditor en cada cambio | PRUEBA-016 |
| AM-30 | Jugar con el tiempo: el reloj del navegador decide qué es «hoy», qué orden está fuera de plazo o qué fecha tiene una orden | Todo lo decide la base de datos con su reloj | PRUEBA-023 |
| AM-31 | Instrucciones dentro de un nombre de cliente, de una descripción del catálogo o de documentación leída al diseñar (A-16, artículo 7) | Son datos. La nota para agentes de la página de Vercel no se siguió (H-9) | Revisión |

## Pruebas

### Dónde se ejecuta cada tipo

| Tipo | Dónde | Estado hoy |
| --- | --- | --- |
| Unitaria y estática (Vitest) | Batería local de la 002 | Cuando exista la app |
| En navegador sobre la muestra, con datos ficticios | En local, sobre la compilación de producción | Cuando existan la app y la 020. **No necesita la fase 2** |
| En navegador contra la base de datos de desarrollo | En local, con las migraciones y los datos ficticios cargados, y cuentas de prueba de la 021 | Depende de la fase 2 y de la 021 |
| De base de datos | **Ningún sitio**: no hay Docker ni CI remoto. Las de simultaneidad necesitan además varias conexiones | **No se pueden ejecutar** (asunto A-8) |
| Con agente de prueba | Entorno de desarrollo con el conector de la fase 2 | No existe |
| En la plataforma de despliegue | Cuando la app esté desplegada | No existe |
| Persona | `disenador-ui`, con la guía de revisión manual de la 020 | — |

Los fallos de la base de datos se provocan en las pruebas de navegador con un intermediario local delante de la API de datos, que corta, retrasa o altera respuestas; y en las de base de datos, con una restricción que solo existe en la prueba. No hay ganchos de prueba en el producto.

### Lista de pruebas

| Prueba | Qué comprueba | Tipo | Etapa |
| --- | --- | --- | --- |
| PRUEBA-001 | `campos.ts` y `lectura.ts`: una fila con todos los campos y varios de más da exactamente los veinte datos; valores fuera de lista, versión del prompt o código mal formados dan «desconocido»; versión de esquema posterior | Unitaria | A |
| PRUEBA-002 | `periodo.ts`: cada valor de la lista; personalizado; fin anterior al inicio, fecha futura, 367 días, 366 exactos, formato, fecha que no existe; días de cambio de hora | Unitaria | A |
| PRUEBA-003 | `exportacion.ts`: cabecera y veinte columnas exactas; cada celda contra su lista; ninguna empieza por `=`, `+`, `-` o `@` ni contiene punto y coma, comillas o saltos; solo ASCII; fuera de lista da `desconocido`; un entero o una fecha no válidos no dan archivo; orden de los problemas; mismo resultado en dos ejecuciones; bytes y líneas anunciados | Unitaria | A |
| PRUEBA-004 | Validadores de cada acción y del manejador: listas cerradas, campos de más que no se leen ni se registran, formas no planas, cuerpo de más de 1 KB, tipo de orden inventado | Unitaria | A |
| PRUEBA-005 | Importaciones prohibidas; guardia como primera instrucción de cada página, acción y manejador (amplía la PRUEBA-003 de la 021); ninguna caché de datos; ningún `loading`, `not-found` anidado ni `generateMetadata`; un solo `route.ts`, que solo exporta `POST`; `descarga.ts` solo se importa desde `DialogoExportar`; ningún control ni operación para crear, cambiar o borrar informes; ningún campo de texto en los diálogos de órdenes; la fuente ficticia no se importa desde el producto. Con casos trampa que deben hacerla fallar | Estática | A |
| PRUEBA-006 | Contrato de las tres fuentes: forma de cada lectura y operación; todo resultado no reconocido es `incierta`; todo estado no reconocido es `desconocido`. Contra las ficticias y, después, contra las reales | Unitaria y navegador | A y B |
| PRUEBA-007 | Sección de informes sobre la muestra: el informe de CA-004 comparado con la lista cerrada, el 3 con su palabra, estado y comprobaciones con palabra; los tres casos del catálogo; esquema posterior; cliente sin informes, periodo vacío y periodo inválido; orden y posición | Navegador, ficticios | A |
| PRUEBA-008 | Evolución: cada gráfico y su tabla pintan los mismos valores; día sin informes como hueco y «Sin informes»; sin informes no hay gráfico; un solo día da «Sin datos suficientes» | Navegador, ficticios | A |
| PRUEBA-009 | Página «Informes» sobre la muestra: columnas contra la lista cerrada; ninguna cifra sumada; filtros aplicados a la vista; aviso de filtro no válido sin repetir el valor; el texto buscado no llega a la dirección ni al historial; la entrada del menú, también con teclado | Navegador, ficticios | A |
| PRUEBA-010 | Resumen sobre la muestra: los cuatro bloques; cada uno en error por separado, con los demás visibles y sin cero ni guion en su lugar; texto de datos insuficientes; enlaces a la ficha; ningún elemento de alertas, canales ni impagos | Navegador, ficticios | A |
| PRUEBA-011 | Órdenes sobre la muestra: las siete situaciones con su palabra, sus fechas y sus acciones; «Sin confirmar»; página «Órdenes» sin ningún control de selección; diálogo de crear con cada aviso (los cuatro casos de orden viva, sin licencia, sin conexiones) y el texto obligatorio; diálogo de anular para pendiente y entregada; cancelar no llama a nada; cada motivo de rechazo y el resultado incierto | Navegador, ficticios | A |
| PRUEBA-012 | Exportación sobre la muestra: diálogo; cada rechazo; descarga correcta en los tres motores; respuesta cortada o con tamaño o líneas que no coinciden: no se ofrece nada; `no-store`; nombre del archivo | Navegador, ficticios | A |
| PRUEBA-013 | `axe` sin infracciones graves ni críticas en las cinco vistas, los tres diálogos y la descarga, en cada estado; 320 píxeles sin desplazamiento de página y con todas las acciones, objetivos de 24 por 24; capturas de los 25 estados; contraste; revisión con teclado y lector de pantalla de crear, anular, sustituir, filtrar, exportar y consultar | Navegador y persona | A; exportar se repite en B |
| PRUEBA-014 | Revisión de textos, fechas y números de esta función, y de todos sus mensajes de error | Revisión, con búsqueda automática de apoyo | A |
| PRUEBA-015 | Un nombre de cliente y una descripción del catálogo con marcado, en las cinco vistas, los diálogos, los avisos y los filtros aplicados: se ven literalmente y no se ejecuta nada; la cadena testigo se busca también en el HTML crudo y en la carga serializada | Navegador | A; se repite en B |
| PRUEBA-016 | Matriz de acceso: cada perfil contra cada lectura, cada tabla, cada operación y la exportación. Con sesiones de usuario, nunca con la clave secreta | Base de datos | B |
| PRUEBA-017 | Con sesión de superadmin, escritura directa: crear, cambiar y borrar un informe; en una orden, cada intento de REQ-052. Y los disparadores, con un rol con permiso de escritura | Base de datos | B |
| PRUEBA-018 | Matriz de transiciones entera: cada estado contra cada intento, por las operaciones, por las funciones del conector y directamente; entregar y confirmar órdenes anuladas a mano y por sustitución; confirmar una orden nunca entregada | Base de datos | B |
| PRUEBA-019 | Una orden viva: 50 rondas de dos sesiones a la vez con órdenes iguales y contrarias, 20 envíos dobles; recuento de órdenes y de filas de auditoría; el índice único, insertando a mano con un rol con permiso | Base de datos, varias conexiones | B |
| PRUEBA-020 | Coherencia (pausar en pausa, reanudar sin pausa); cliente de baja, sin licencia y sin conexiones; estado esperado en las cuatro situaciones de CA-035; orden de otro cliente | Base de datos | B |
| PRUEBA-021 | Auditoría: 30 operaciones, 10 de cada tipo, con su fila exacta; sustitución con sus dos filas; fallo provocado en cada escritura: ningún efecto; 10 exportaciones con sus 10 filas y su periodo; lecturas: cero filas; ninguna fila con texto ni cifras | Base de datos | B |
| PRUEBA-022 | 20 repeticiones de anular contra entregar y 20 de anular contra confirmar, con las funciones del conector de la 011: estado final de la tabla de «Cerrojos», nunca dos fechas, ninguna orden anulada antes servida | Base de datos, varias conexiones | B, con las funciones de la 011 |
| PRUEBA-023 | Lecturas: total, orden y páginas primera, intermedia y última; evolución de CA-008 (días de Madrid, 7 y 2 dan 2 o 9 según la cifra); cada filtro y cada combinación de CA-037; cifras de CA-010 con las 23:59 y las 00:01; variación de CA-012; fuera de plazo de CA-019 con 24 y 168 horas | Base de datos | B |
| PRUEBA-024 | «Sin señal»: el conjunto que dan L-8 y L-12 es el de la función de la 013 para los mismos datos y el mismo instante, a los dos lados del margen y con cada excepción; el número de alertas es el mismo antes y después de consultar | Base de datos | B, con la regla de la 013 decidida |
| PRUEBA-025 | E-1: dos clientes con informes en 366 días, exactamente los de uno; los seis rechazos de CA-041 sin fila; el tope; el número devuelto es el de filas | Base de datos | B |
| PRUEBA-026 | Vuelta atrás de cada migración | Base de datos | B |
| PRUEBA-027 | Vistas con datos reales: Resumen como primera página y sus cifras; página «Informes» completa; las situaciones de pausa en la ficha y en la página «Órdenes»; 10 consultas de cada vista sin filas de auditoría. Incluye las pruebas contrato de V-1 a V-4 de la 020 con estas direcciones | Navegador, base de datos | B |
| PRUEBA-028 | Acciones desde la interfaz: crear con y sin cancelar; los cuatro casos de sustitución; anular pendiente y entregada; dos envíos en menos de 100 ms; estado cambiado bajo el diálogo; la vista muestra lo releído | Navegador, base de datos | B |
| PRUEBA-029 | Los cuatro perfiles de CA-002 en cada vista, cada acción y el manejador, en carga completa, en navegación y por llamada directa; segundo factor retirado entre abrir y confirmar, en órdenes y en la exportación | Navegador, base de datos | B |
| PRUEBA-030 | Entradas manipuladas: tipo fuera de lista, identificadores, campos de más, filtros, periodos, petición desde otro origen, página en un marco. Búsqueda de los valores enviados en mensajes y registros: cero | Navegador, base de datos | B |
| PRUEBA-031 | Base de datos cortada durante crear, anular, sustituir y exportar, y fallo de la auditoría: nada a medias, ningún éxito, ningún archivo; cada vista con la base de datos caída; seis fallos distintos y sus registros, sin valores, cifras ni sesiones | Navegador, base de datos | B |
| PRUEBA-032 | Las pruebas de integración pasan con la clave secreta ausente del entorno | Navegador, base de datos | B |
| PRUEBA-033 | Volumen de referencia cargado: totales reales, ninguna página con más filas que su tamaño, percentil 95 de 20 cargas de las cuatro vistas, y de 20 exportaciones de 366 días | Navegador, base de datos | B |
| PRUEBA-034 | CA-001: 10 órdenes alternas con el agente de prueba | Con agente | C |
| PRUEBA-035 | La exportación del cliente de referencia y un archivo de más de 4,5 MB, desde la app desplegada | Plataforma | D |
| PRUEBA-036 | Revisión de privacidad con la skill `revision-privacidad`: vistas, mensajes, diálogos, registros, filas de auditoría y el archivo exportado | Revisión | B |

### Cada criterio, con su prueba y cuándo se puede cerrar

«Cierra en» es la primera etapa en la que el criterio entero puede tener evidencia. Lo anterior es evidencia parcial y no lo cierra.

| Criterio | Pruebas | Cierra en | Qué falta hoy |
| --- | --- | --- | --- |
| CA-001 | 034 | C | Conector, agente de prueba, versión publicada, D-013 y la corrección del contrato |
| CA-002 | 016, 029 | B | Sitio para pruebas de base de datos, la 021 y el asunto A-1 |
| CA-003 | 005, 032 y revisión del `auditor-seguridad` | B | Migraciones |
| CA-004 | 001, 007, 027 | B | Migraciones. En A, evidencia de interfaz |
| CA-005 | 005, 036 | B | Migraciones, para los registros y la auditoría |
| CA-006 | 007 | A | La app y la 020 |
| CA-007 | 023, 033 | B | Migraciones y volumen cargado |
| CA-008 | 008, 023 | B | Sitio para pruebas de base de datos y T-P3. En A, solo que gráfico y tabla coinciden |
| CA-009 | 005, 017 | B | Sitio para pruebas de base de datos |
| CA-010 | 010, 023, 027 | B | Migraciones y la 021 |
| CA-011 | 024 | B | **La regla de la 013** (asunto A-2) |
| CA-012 | 010, 023 | B | Migraciones |
| CA-013 | 010, 031 | B | Migraciones |
| CA-014 | 011, 028 | B | Migraciones |
| CA-015 | 017, 018 | B | Funciones del conector de la 011 y sitio para pruebas |
| CA-016 | 019 | B | Sitio para pruebas con varias conexiones |
| CA-017 | 020 | B | Sitio para pruebas de base de datos |
| CA-018 | 011, 027 | B | Migraciones; lectura DD-22 |
| CA-019 | 023 | B | Sitio para pruebas de base de datos |
| CA-020 | 021 | B | Sitio para pruebas de base de datos |
| CA-021 | 004, 030 | B | Migraciones, la 021 y la 002 |
| CA-022 | 020, 028 | B | Migraciones |
| CA-023 | 022 | B | Funciones del conector de la 011 y varias conexiones |
| CA-024 | 031 | B | Migraciones |
| CA-025 | 013 | A | La app y la 020 |
| CA-026 | 013 | A | La app, la 020 y T-P2 para la descarga. El paso de exportar se repite en B |
| CA-027 | 013 | A | La app y la 020 |
| CA-028 | 014 | A | La app y la 020 |
| CA-029 | 001, 003, 007, 025 | B | Migraciones. En A, la vista y la composición del archivo |
| CA-030 | 031 | B | Migraciones; V-112 sin verificar |
| CA-031 | 015 | A | La app y la 020 |
| CA-032 | 011, 021, 028 | B | Migraciones |
| CA-033 | 011, 028 | B | Migraciones |
| CA-034 | 022 | B | Funciones del conector de la 011 y varias conexiones |
| CA-035 | 020, 028 | B | Migraciones |
| CA-036 | 021, 027 | B | Migraciones |
| CA-037 | 009, 023, 027 | B | Migraciones y la enmienda de la 020 (asunto A-7) |
| CA-038 | 002, 009, 030 | B | Migraciones |
| CA-039 | 003, 025, 033, 035, 036 | B, y D para el archivo grande | Migraciones, el tiempo aprobado en P1 y la plataforma |
| CA-040 | 021, 031 | B | Migraciones |
| CA-041 | 002, 025, 030 | B | Migraciones |

**Consecuencia.** En la etapa A se pueden cerrar seis criterios (CA-006, CA-025 a CA-028 y CA-031). Los otros treinta y cinco necesitan la fase 2; de ellos, tres necesitan las funciones del conector, uno el agente de prueba y uno la regla de la 013. Mientras no haya dónde ejecutar las pruebas de base de datos, ningún criterio que las pida se puede dar por superado, y la función no puede pasar a VERIFICADA (artículo 13).

## Valores que fija este diseño

Los de la especificación (30 días por defecto, 366 como máximo, 2 veces la frecuencia, 2 segundos) no se repiten. Estos son nuevos y se aprueban con el diseño:

| Valor | Cuánto | Por qué |
| --- | --- | --- |
| Tamaño de página en todas las listas | 25 | El común de la 020 |
| Página | De 1 a 100.000 | Entrada acotada |
| Periodos de la lista | Hoy, 7, 30, 90 y 366 días | Los usos previsibles sin escribir fechas |
| Texto para buscar un cliente en el filtro | 120 caracteres; 10 resultados | El largo máximo de un nombre |
| Informes por exportación | 50.000 como mucho | Dos veces y media el cliente de referencia; entrada acotada (asunto A-5) |
| Tiempo de una exportación | 10 segundos en el percentil 95 de 20; **propuesta para la puerta P1**, sin medir | REQ-072 (asunto A-4) |
| Plazo sin respuesta de una acción o de la descarga | 30 segundos | El de `useAccion` |
| Cuerpo de la petición de exportar | 1 KB como mucho | Solo lleva dos fechas |
| Versión de esquema conocida | 1 | `x-version-esquema` del contrato |
| Puntos mínimos de un gráfico | 2 | Un solo punto no es una evolución |

**Rendimiento (REQ-035), sin medir.** El histórico de un cliente y la página «Informes» leen 25 filas por un índice y cuentan dentro de un periodo; con 200.000 informes no hace falta ninguna tabla precalculada. El orden por estado de un cliente ordena 20.000 filas como mucho. El resumen son cuatro consultas pequeñas; la de «sin señal» recorre 1.000 clientes. Los índices de D-12 son una estimación. Si PRUEBA-033 no da el umbral, la tarea vuelve al arquitecto.

## Decisiones por delegación (D-019)

Tomadas por el arquitecto con la opción de más seguridad y calidad. Ninguna toca lo reservado a una persona. El orquestador las pasa a `aclaraciones.md` para que el responsable pueda revisarlas.

| N.º | Decisión | Motivo, en una línea |
| --- | --- | --- |
| DD-01 | Toda escritura de órdenes pasa por una función de la base de datos; la sesión no tiene permisos de escritura; disparadores como segunda capa | Es la única forma de que REQ-052 se cumpla también contra la API de datos |
| DD-02 | Crear y anular llevan el estado que el administrador tenía delante; si no coincide con el real, se rechaza | Un solo control resuelve el doble clic, la simultaneidad y el diálogo viejo, sin anular nada por error |
| DD-03 | Una orden viva por cliente: índice único además del cerrojo | El índice se puede demostrar con una prueba |
| DD-04 | Solo se confirma una orden entregada y sin anular | Una confirmación de algo que el agente no recibió no puede ser cierta |
| DD-05 | El orden entre órdenes lo da una secuencia y las fechas se toman tras el cerrojo | Con fechas de inicio de transacción, «la más reciente» puede ser la equivocada |
| DD-06 | Si la entrega llega antes que una anulación que esperaba una orden pendiente, la anulación se rechaza y se muestra el estado actual | Entre REQ-046 y REQ-076, es la lectura en la que nada ocurre sin el aviso correcto |
| DD-07 | Se puede anular a mano una orden de un cliente de baja | La especificación no lo limita y es una corrección que no entrega nada |
| DD-08 | Séptima situación de pausa: «Activo, reanudación confirmada» | Existe y, sin ella, se pintaría como «sin órdenes», que es falso |
| DD-09 | La página «Órdenes» es de solo consulta | Las acciones van donde están el estado de pausa y los avisos |
| DD-10 | Formato del archivo: CSV con punto y coma, ASCII, nombres del contrato, `verdadero` y `falso`, fecha ISO con desfase de Madrid, orden cronológico | Se abre sin pasos en una hoja de cálculo en español, no depende de la codificación y cada fecha es un instante sin ambigüedad |
| DD-11 | La exportación es un manejador `POST` que compone el archivo entero antes de responder, y el navegador comprueba tamaño y líneas antes de ofrecerlo | Lectura y auditoría quedan en una transacción y nunca se entrega medio archivo |
| DD-12 | El nombre del archivo no lleva el nombre del cliente | Puede ser el de una persona y quedaría en el historial de descargas |
| DD-13 | 50.000 informes por exportación | Ante una entrada sin acotar, se deniega |
| DD-14 | Un valor de lista cerrada desconocido se exporta como `desconocido`; un número o una fecha no válidos detienen la exportación | Nunca sale un valor sin validar ni un número falso |
| DD-15 | Un día sin informes es un hueco y «Sin informes», no un cero | Un cero afirmaría algo que no ha ocurrido |
| DD-16 | Dos gráficos: lo hecho cada día y lo pendiente al terminar el día | La 020 admite cuatro series y son dos magnitudes distintas |
| DD-17 | Solo «Informes de hoy» lleva variación, contra ayer a la misma hora | Comparar un día a medias con uno entero daría siempre una bajada falsa |
| DD-18 | El periodo personalizado no va a la dirección | Cumple la regla V-3 de la 020 sin enmendarla |
| DD-19 | Un filtro no válido no se aplica, se avisa y los filtros aplicados quedan a la vista | Coincide con la regla de la 020 y no deja dudas sobre qué se está viendo |
| DD-20 | Las lecturas comprueban `es_admin()` por sí mismas | No dependen de las políticas que la fase 5 añada a las tablas |
| DD-21 | Orden por estado: error, aviso, en pausa, correcto | Primero lo que pide atención |
| DD-22 | En la página «Órdenes», «activo sin órdenes» se demuestra con el vacío del filtro por ese cliente | Es lo que la página puede mostrar de un cliente sin órdenes |
| DD-23 | Se pueden exportar las cifras de un cliente de baja | Son datos ya recibidos; la baja no los borra |
| DD-24 | Exportar pide confirmación en un diálogo | La especificación habla de «confirmar» la exportación y es la única salida de datos |
| DD-25 | La fuente ficticia no existe en el producto ni se elige por configuración | Un interruptor así podría dejar datos falsos en producción |
| DD-26 | «Informes» va en el menú entre «Clientes» y «Órdenes» | De lo que más se consulta a lo que menos |

## Cobertura de requisitos

| Requisitos | Dónde se resuelven |
| --- | --- |
| REQ-001, REQ-037 a REQ-039 | «Principio»; guardia de la 021 en páginas, acciones y manejador; paso 1 de cada operación; «Superficie de lectura»; «Matriz de acceso» |
| REQ-002 | «Importaciones prohibidas»; los tres `fuente-bd.ts`; PRUEBA-032 |
| REQ-003, REQ-049, REQ-050 | Pasos 3 de O-1 y O-2; `no_encontrado`; asunto A-1 |
| REQ-004, REQ-058 | «Sección de informes de la ficha»; «Periodo»; L-1 |
| REQ-005, REQ-055 | «Datos de un informe»; `campos.ts` y `lectura.ts` |
| REQ-006, REQ-054 | «Datos de un informe» (catálogo); L-4 |
| REQ-007, REQ-008 | «Datos de un informe»; catálogo de estados de la 020 |
| REQ-009 | «Evolución diaria»; L-2; T-P3 |
| REQ-010, REQ-053 | D-5; ninguna operación ni control sobre informes; PRUEBA-005 y PRUEBA-017 |
| REQ-011 | «Datos de un informe»; «Exportación»; un solo botón de exportar |
| REQ-012 a REQ-014 | «Resumen»; L-9 a L-11 |
| REQ-015, REQ-063 | Bloque «Agentes sin señal»; bloque «Señal» de la ficha; D-7; L-8 y L-12 |
| REQ-016 | «Resumen», lo que no aparece |
| REQ-017 | «Resumen», variación; L-10 |
| REQ-018, REQ-059 | Cuatro bloques con su lectura; «Cuando algo falla» |
| REQ-019, REQ-027 | «Sección de órdenes de la ficha»; L-5 y L-6; D-6 |
| REQ-020 | «Página "Órdenes"»; L-7 |
| REQ-021, REQ-051 | D-1; entradas de O-1; diálogos sin campos |
| REQ-022, REQ-043, REQ-044, REQ-065 | «Diálogos», crear una orden |
| REQ-023, REQ-024, REQ-045, REQ-052 | «Estado derivado»; «Transiciones de una orden»; D-4 y D-5; O-2 |
| REQ-025, REQ-040, REQ-041 | O-1; D-3; «Cerrojos y simultaneidad» |
| REQ-026, REQ-047 | Paso 5 de O-1; D-6 |
| REQ-028 | «Estado derivado», orden sin confirmar; L-5 a L-7 |
| REQ-029, REQ-067 | «Auditoría de esta función»; D-10 |
| REQ-030 | «Diálogos», tras confirmar |
| REQ-031 a REQ-034 | Componentes, estados y formatos de la 020 en cada vista; bloques de cada sección |
| REQ-035 | «Rendimiento»; D-12; PRUEBA-033 |
| REQ-036 | Códigos de `registro.ts` en «Contratos»; `registrarFallo` |
| REQ-042 | Paso 3 de O-1 |
| REQ-046, REQ-075, REQ-076 | «Cerrojos y simultaneidad»; D-2; D-11; asunto A-3 |
| REQ-048 | Validador de `crearOrden`; `datos_no_validos` |
| REQ-056, REQ-057 | «Sección de informes» (vacíos); «Periodo» (validación) |
| REQ-060 | «Cuando algo falla»; operaciones en una transacción |
| REQ-061 | Controles de la 021 y de la 002; manejador solo `POST` con origen comprobado; AM-17 |
| REQ-062 | `TextoDato` y `textoPlano()`; AM-24 |
| REQ-064 | «Diálogos», anular una orden |
| REQ-066 | D-2, D-4 y D-11 |
| REQ-068 a REQ-070, REQ-077 | «Página "Informes"»; L-3 |
| REQ-071 | «Menú»; asunto A-7 |
| REQ-072, REQ-073 | «Exportación»; E-1; `exportacion.ts` |
| REQ-074, REQ-079 | E-1, pasos 4 y 5; manejador, pasos 5 y 6; asunto A-6 |
| REQ-078, REQ-080 | E-1, pasos 2 a 4; motivos de rechazo de la exportación |

Los 80 requisitos están en la tabla. Los 41 criterios, en «Cada criterio, con su prueba».

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | No se añade ningún campo de texto. Una orden es un tipo de una lista de dos. El archivo exportado lleva solo los veinte datos, validados uno a uno, sin nombre ni identificador. El texto con el que se busca un cliente no se guarda ni se registra. La auditoría no lleva nombres ni cifras; la fila de exportar lleva dos fechas |
| 2 Aislamiento | **Cumple solo con la nota aclaratoria aplicada** | El identificador del cliente va en la dirección de la ficha, en el filtro, en la ruta de exportación y en las operaciones para elegir sobre quién se actúa, nunca como permiso. El texto vigente del artículo dice que «nunca se acepta como entrada». Sin la nota, este punto es un incumplimiento y, por tanto, BLOQUEANTE (asunto A-1) |
| 3 Cierre en fallo | Cumple | Guardia y `es_admin()` deniegan ante cualquier duda; todo resultado no reconocido es `incierta`; un fallo de lectura es un error, nunca un cero ni un vacío; un estado desconocido no ofrece acciones; un fallo en la exportación no entrega archivo; ante un cambio de estado, la operación no actúa |
| 4 Secretos | Cumple | Ningún secreto nuevo. Ninguna pieza usa la clave secreta |
| 5 Especificación | Cumple, con un choque que se declara | Especificación aprobada; cada requisito tiene apartado y cada criterio, prueba. REQ-046 y REQ-076 se contradicen en un caso: se ha elegido una lectura y se pide que el `especificador` lo aclare (asunto A-3). El tope de la exportación añade un rechazo que la especificación no nombra (asunto A-5) |
| 6 Revisión independiente | Cumple | Este diseño no se aprueba a sí mismo: falta el dictamen del `auditor-seguridad` y la puerta P1 |
| 7 Entradas no confiables | Cumple | Identificadores, filtros, periodos y respuestas de la base de datos se validan contra listas cerradas. Los nombres y las descripciones del catálogo se pintan como texto. La documentación leída, con su nota para agentes, se trató como datos |
| 8 Límites en el anfitrión | Cumple | Lo único que esta función hace llegar al agente es una orden con un tipo de dos valores. Pausar le quita trabajo; reanudar lo devuelve a su funcionamiento normal, con los límites de su arranque local intactos. Nada de lo que escribe el panel puede relajarlos |
| 9 Prompt por despliegue | No aplica | No toca el prompt, las versiones ni el canal. Qué se entrega en pausa es D-013, de la fase 1 |
| 10 Producto final | Cumple, con condiciones abiertas | Accesibilidad, cinco estados, errores, simultaneidad, volumen y operación forman parte del diseño. Condiciones: la política de contenido de la 021, T-P2 y los criterios que hoy no tienen dónde ejecutarse |
| 11 Reversibilidad | Cumple, con un límite declarado | Cada migración tiene vuelta atrás y prueba. La de permisos y disparadores no se revierte sola. Una pausa se deshace con una reanudación y una orden viva se anula; una orden confirmada o anulada no cambia, porque lo pide la especificación |
| 12 Español | Cumple | Pantallas, textos, tablas, funciones, archivos, columnas del archivo exportado y este documento |
| 13 Evidencias honestas | Cumple | Nada se da por probado. Se dice qué criterios no se pueden cerrar y por qué. El tiempo de exportación es una estimación y se dice |
| 14 Cambios reservados | Cumple | No se toca la constitución, los permisos, el CI ni los secretos. La nota del artículo 2, los contratos y los documentos compartidos se piden; no se cambian |

Un posible incumplimiento: el artículo 2, mientras la nota no esté aplicada.

## Dependencias nuevas

**Ninguna.** El archivo lo compone código propio de pocas líneas: con veinte columnas de valores cerrados no hace falta una librería de CSV. La descarga usa funciones del navegador. No se añade librería de fechas (basta `Intl`, como en la 020) ni de validación (V-109 sigue en VERIFICAR; bastan validadores propios). Recharts, Radix, Playwright y `axe` son de la 020; `@supabase/supabase-js`, de la 021. El límite de 4,5 MB se ha leído en la documentación de Vercel (`vercel.com/docs/functions/limitations`, actualizada el 24/08/2026, leída el 14/11/2026); no se ha probado.

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Escribir en `ordenes` desde el servidor con la sesión y RLS, como permite el modelo de referencia | Crear, sustituir y auditar no es atómico desde fuera, y las transiciones prohibidas quedarían a merced de cada llamada |
| Guardar el estado de la orden en una columna | Puede contradecir a las fechas; con hechos con fecha, «confirmada y anulada a la vez» es una restricción que la base de datos rechaza |
| Rechazar una orden nueva si hay otra viva | Descartada por el responsable en las cuestiones 6 y 7 |
| Sustituir siempre, sin estado esperado | Un doble clic anularía por sustitución la orden que acaba de crear el primer envío, y el aviso del diálogo podría ser el equivocado |
| Una clave de repetición enviada por el navegador | Otra entrada y otra columna; el estado esperado resuelve lo mismo y además cubre a dos administradores y al diálogo viejo |
| Ordenar las órdenes por fecha de creación | La fecha de una transacción que esperó el cerrojo puede ser anterior a la de la que pasó antes |
| Una regla propia de «sin señal» en el panel | Dos reglas acaban contradiciéndose. La especificación lo prohíbe |
| Calcular la evolución por día en el servidor de la app o en el navegador | Habría que traer miles de informes, y el día de Madrid quedaría definido en dos sitios |
| Un solo gráfico con las seis cifras | La 020 admite cuatro series |
| Pintar cero los días sin informes | Afirma una revisión que no existió |
| Comparar los informes de hoy con el día de ayer entero | Da una bajada falsa durante todo el día |
| Fechas del periodo personalizado en la dirección | Es texto escrito por el usuario: choca con la regla V-3 de la 020. Se propone a la 020 como mejora, sin depender de ella |
| Acciones de crear y anular en la página «Órdenes» | Dos sitios para lo mismo, y uno de ellos sin el estado de pausa ni los avisos a la vista |
| Devolver el archivo como resultado de una acción de servidor | No se sabe si esa respuesta cuenta como enviada por partes para el límite de 4,5 MB, y haría pasar varios megas por la serialización de la interfaz |
| Un enlace `GET` para descargar | Una petición que escribe en la auditoría no puede ser un `GET`, y se podría lanzar desde otro sitio |
| Enviar el archivo según se va leyendo de la base de datos | Un fallo a mitad entregaría un archivo incompleto, que REQ-079 prohíbe |
| Exportación por partes como primera opción | Dos funciones más y un vale ligado a la auditoría. Queda escrita como alternativa si T-P2 falla |
| Formato de hoja de cálculo (XLSX) | Exige una librería nueva y un formato que no se puede revisar a simple vista en la revisión de privacidad |
| CSV con coma y entrecomillado | En una hoja de cálculo en español se abre en una sola columna |
| El nombre del cliente dentro del archivo o en su nombre | REQ-073 solo admite los datos de REQ-005, y el nombre quedaría fuera del sistema |
| Sin tope de informes por exportación | Una entrada sin acotar |
| Una fuente ficticia que se activa con una variable de entorno | Podría quedar activa en producción |
| Un límite de órdenes o de exportaciones por hora | No lo pide la especificación; queda anotado como riesgo en AM-01 y AM-19 |

## Decisiones que requieren ADR

No se escriben aquí: este encargo solo permite escribir en `specs/023-informes-ordenes/`. Se proponen para después de la puerta P1.

| ADR propuesto | Qué fija | Qué frontera cambia |
| --- | --- | --- |
| Ampliación de ADR-0003: «operaciones del panel» | En los dashboards se lee con la sesión, pero no se escribe en las tablas: cada cambio es una función de la base de datos que comprueba el acceso, aplica la transición y audita. Es el mismo que proponen la 021 y la 022; la 023 añade las órdenes | «App → base de datos» |
| ADR nuevo: ciclo de una orden | Hechos con fecha y estado derivado; una orden viva por cliente; sustitución; estado esperado; una sola regla de pausa efectiva para panel y conector; mismo cerrojo en los dos; una orden anulada no se entrega ni se confirma | «Panel → conector → agente» (flujo 4 de `docs/ARQUITECTURA.md`) |
| ADR nuevo: exportación de cifras | Única salida de datos en archivo; qué lleva; que se audita en la misma transacción; primer manejador de ruta del área de superadmin | «Sistema → fuera del sistema» |

## Qué se pide a otras fases y a coordinación

Nada de esto está aplicado. Está copiado en `propuestas.md`, apartado del 14/11/2026.

**Fase 1 (001 y 002).**

1. Decidir D-013. Mientras siga en PROPUESTO, el texto del diálogo de pausa no es definitivo.
2. Nueve códigos nuevos en la lista cerrada de `registro.ts` (apartado «Contratos»).
3. Rutas críticas nuevas: `src/app/admin/ordenes/acciones.ts`, `src/lib/ordenes/`, el manejador de exportación, `src/lib/informes/exportacion.ts` y `descarga.ts`.
4. V-112: que la supervisión de errores no capture cuerpos de respuesta (el archivo exportado es uno).

**Fase 2 (010, 011, 013, 014).**

1. Todo el apartado «Datos»: D-1 a D-14.
2. La forma de exponer las operaciones y las lecturas del panel (T-P1), la misma que piden la 021 y la 022.
3. Lo que el conector tiene que cumplir (D-11): mismo cerrojo, una sola regla de pausa, solo órdenes vivas, confirmación solo de órdenes entregadas, entrega en cualquier estado autorizado.
4. La regla de «sin señal» como **una** función de solo lectura, evaluable al consultar, que use también su cálculo (013). Y sus cuestiones 3, 5, 6, 11, 12 y 13 respondidas.
5. Dos columnas de fecha en la auditoría para I-18, y ningún disparador genérico sobre `ordenes`.
6. En la fase 3, que un usuario de cliente no lea ninguna fila de `informes` ni de `ordenes`.
7. Que `authenticated` no pueda escribir en `catalogo_problemas` mientras ninguna función lo gestione.
8. Un sitio donde ejecutar pruebas de base de datos con varias conexiones a la vez.
9. El conector desplegado en desarrollo, con un agente de prueba y una versión publicada (CA-001).

**Función 020.** La sexta entrada del menú, «Informes», entre «Clientes» y «Órdenes» (enmienda de su REQ-003); las plantillas de ruta de esta función; los estados nuevos del catálogo; los textos, incluido «Todavía no hay datos suficientes para comparar»; que `RejillaCuerpo` admita no tener zona de alertas sin dejar hueco; que `estado-direccion.ts` diga si descartó algún parámetro declarado; `GraficoLineas` con 366 puntos (T-P4); las muestras de esta función en su inventario. Como mejora que no bloquea: un tipo «día» en `estado-direccion.ts`.

**Función 021.** La variante de la guardia para manejadores de ruta, con comprobación de origen; que su prueba estática cubra las rutas de esta función; que el Resumen sea el destino tras iniciar sesión; que `administradores.correo` se pueda leer desde L-6 y L-7; y qué ve un diálogo abierto cuando la sesión caduca.

**Función 022.** Los componentes de las secciones «Informes» y «Órdenes» en `secciones.ts`; usar L-8 para sus indicaciones; exportar `fecha-madrid.ts` para `periodo.ts`; que `listarClientes` admita pedir solo 10 resultados; el mismo cerrojo de cliente.

**Función 024.** Mostrar el periodo en las filas I-18; confirmar que I-17 va siempre vinculada a I-13 o a I-14; que H-01 y H-02 los escribe el conector.

**Fase 4 (032).** El mismo plazo de 2 veces la frecuencia esperada para su alerta de orden sin confirmar, calculado con la misma función; y la alerta o el aviso fuera del panel por órdenes creadas (asunto A-11).

**Fase 5 (040).** Cuando abra lecturas propias a los usuarios de cliente, que CA-002 de esta función se revise.

**Coordinación.** Aplicar la nota aclaratoria del artículo 2 (la hace el responsable); los tres cambios de descripción de `contratos/`; el flujo 2 y el flujo 4 de `docs/ARQUITECTURA.md`; la página «Informes» y la ruta `admin/informes/` en `docs/DISENO.md` y `docs/ESQUELETO.md`; las rutas críticas en `docs/SEGURIDAD.md`; anotar en `docs/TECNOLOGIAS.md` las decisiones de las aclaraciones de la 023 y, si se aprueban, las de este diseño.

## Asuntos abiertos para el responsable

Los tres primeros condicionan el trabajo. La columna «Propuesta» es del arquitecto y no es una decisión.

| N.º | Asunto | Opciones | Propuesta |
| --- | --- | --- | --- |
| A-1 | **La nota aclaratoria del artículo 2 no está aplicada.** La ficha, el filtro por cliente, la ruta de exportación y las operaciones llevan el identificador de un cliente. Es una enmienda de la constitución: no está delegada. Es el mismo asunto A-1 de la 022 | (a) El responsable la aplica, con fecha y versión, antes de la puerta P1. (b) No se aplica: la función no se puede construir como está especificada | (a) |
| A-2 | **La regla de «sin señal» no está decidida.** La 013 sigue en PROPUESTA y sin respuesta en su margen, qué cuenta como señal, el ámbito y las excepciones. La delegación D-019 cubre las fases 1 y 3, no la 2 | (a) El responsable responde esas cuestiones de la 013. (b) Se construye todo con la función de la 013 como dependencia y REQ-063 y CA-011 quedan sin cerrar hasta entonces | (a); mientras tanto, (b) |
| A-3 | **REQ-046 y REQ-076 se contradicen en un caso.** Si el conector entrega una orden entre que el administrador abre el diálogo de anular y lo confirma, REQ-046 dice que la orden «queda anulada» con su fecha de entrega y REQ-076 dice que la anulación se rechaza y se muestra el estado actual | (a) Manda REQ-076: se rechaza, y el administrador anula de nuevo con el aviso de orden ya recibida (DD-06). (b) Manda REQ-046: se anula sin haber mostrado ese aviso | (a), y que el `especificador` ajuste el texto de REQ-046 |
| A-4 | **Tiempo máximo de una exportación.** El responsable pidió que lo propusiera el diseño | 10 segundos en el percentil 95 de 20 exportaciones de 366 días del cliente de referencia. Es una estimación sin medir; si la medida real queda lejos, se vuelve a proponer | Aprobarlo en la puerta P1 como valor inicial |
| A-5 | **Tope de 50.000 informes por exportación.** La especificación solo limita el periodo. El tope añade un rechazo que no está en ella | (a) Se acepta y el `especificador` lo añade a REQ-078. (b) Sin tope | (a) |
| A-6 | **El periodo en la fila de auditoría de exportar.** REQ-074 lo exige; la 010 dice que la auditoría no guarda valores y que sus columnas son cerradas | (a) Dos columnas de fecha que solo lleva I-18, y la 024 las muestra. (b) La fila no lleva el periodo y se cambia REQ-074 | (a) |
| A-7 | **Sexta entrada del menú.** La 020 aprobó cinco. Sin «Informes» en el menú no se cumple REQ-071 | (a) Enmienda de la 020: seis entradas, con «Informes» entre «Clientes» y «Órdenes». (b) La página se abre desde otra parte y se cambia REQ-071 | (a) |
| A-8 | **Pruebas sin sitio donde ejecutarse.** Treinta y cinco de los 41 criterios necesitan las migraciones de la fase 2; los de base de datos necesitan además un sitio para ejecutarlas, y los de simultaneidad, varias conexiones. Es el mismo problema de la 021 y la 022 | (a) Esperar al CI remoto (003). (b) Un entorno con Docker fuera de esta máquina. (c) Mientras tanto, PGlite como evidencia provisional que no cierra nada | (c) ahora y (a) o (b) antes de verificar |
| A-9 | **Lectura de CA-018.** Pide que la página «Órdenes» muestre las seis situaciones de pausa; un cliente sin órdenes no tiene filas en ella | (a) La sexta se demuestra con el vacío del filtro (DD-22). (b) La página añade una columna con la situación de pausa de cada cliente | (a) |
| A-10 | **Usuarios de cliente y las tablas de esta función.** El modelo de referencia les deja leer sus propios informes y órdenes. CA-002 pide cero filas | (a) En la fase 3, cero filas; la fase 5 abrirá lo que necesite y CA-002 se revisará entonces. (b) Se abre ya y CA-002 se limita a las lecturas del panel | (a) |
| A-11 | **Aviso por órdenes creadas.** Con una sesión comprometida se puede pausar o reanudar a cualquier cliente, y hasta la fase 4 solo se descubre mirando el panel o la auditoría (AM-01, AM-02) | (a) Aceptarlo hasta la fase 4, que va antes de publicar. (b) Adelantar un aviso mínimo | (a), y que la lista de publicación lo recoja |

## Lo que este diseño no ha podido comprobar

- **Nada se ha ejecutado.** No hay app, migraciones ni pruebas. Todo lo que se afirma sobre el comportamiento es diseño. Tampoco se ha ejecutado `node scripts/comprobar-specs.mjs`: este encargo no tiene terminal.
- Que una respuesta por partes de un manejador pase de 4,5 MB en la plataforma, y que el navegador pueda ofrecer desde un diálogo un archivo montado en memoria en los tres motores (T-P2). Del límite solo se sabe lo que dice la documentación.
- El tiempo de una exportación y el tamaño real del archivo. Los 2,5 MB para 20.000 informes y los 10 segundos son estimaciones.
- El rendimiento de las lecturas. Los índices pedidos son una estimación.
- Que la base de datos del proyecto agrupe por día de Madrid igual que la función de la 020, también en los días de cambio de hora (T-P3).
- Que el gráfico de la 020 se lea con 366 puntos (T-P4).
- Qué hace una hoja de cálculo al abrir el archivo: se supone que el punto y coma separa columnas con configuración española y que `1.2` puede convertirse en fecha. No se ha abierto ningún archivo.
- La forma en que la 010 expondrá las lecturas y las operaciones, y si deja devolver decenas de miles de filas en una llamada (T-P1).
- La regla de «sin señal»: depende de la 013, que tiene cuestiones sin responder.
- Qué mecanismo de cerrojo usará la fase 2 y si tomarlo en cada petición de instrucciones afecta a su objetivo de servicio.
- D-013 y la corrección del contrato `obtener-instrucciones`: sin ellas, CA-001 no se puede ejecutar.
- Los diseños de la 021 y de la 022 pueden cambiar con sus dictámenes; los de la 010, la 011, la 013 y la 024 no existen. Si cambian lo que aquí se supone, este diseño se revisa.
- No se han leído enteros `docs/MODELO-DATOS.sql`, `docs/ARQUITECTURA.md`, `docs/SEGURIDAD.md` ni los diseños de la 020, la 021 y la 022, por indicación del encargo: solo los apartados citados.
