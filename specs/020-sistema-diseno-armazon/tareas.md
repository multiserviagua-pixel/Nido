# 020 · Tareas

Cada tarea es pequeña, tiene un solo agente responsable y una prueba que dice cuándo está hecha. `[P]` marca las que pueden ir en paralelo porque no comparten archivos.

Estados: pendiente · en curso · en revisión · hecha · bloqueada.

Autor: `arquitecto` · Fecha: 13/11/2026 · Diseño: `diseno.md` (DISEÑADA). El orden, los riesgos y las condiciones están en `plan.md`.

## Cómo leer la tabla

- **Marcas en la columna «Tarea».** `[002]`: no puede empezar hasta que la función 002 exista o acepte lo que se le pide (se dice qué). `[R]`: toca una ruta reservada de la 002 y necesita la aprobación firmada del responsable. `[C]`: toca una ruta crítica y necesita dictamen del `auditor-seguridad`. `[D]`: sin ser ruta crítica, el diseño pide dictamen.
- **Todas** las tareas necesitan que exista la app de la fase 1 y su procedimiento de integración. `[002]` señala una dependencia añadida a esa.
- **Agente `responsable`**: la hace una persona. Su evidencia es su respuesta escrita o su firma; ningún agente la da por hecha.
- **Prueba antes que código.** Las pruebas unitarias se escriben en la misma tarea que el código. Las pruebas en navegador las escribe `qa` en una tarea anterior a la del código. Para que la batería siga en verde, cada prueba en navegador se genera solo para las entradas que ya existen en `src/app/muestra/inventario.ts`: la tarea de código añade sus entradas y, desde ese commit, la prueba se ejecuta y tiene que pasar. No se usa ninguna prueba saltada.
- Las tareas de `ingeniero-frontend` que añaden un componente comparten `inventario.ts` y `textos.ts`: no llevan `[P]` y van una detrás de otra.
- Las pruebas citadas (PRUEBA-NNN) son las de `diseno.md`. Ninguna se ha ejecutado.

## A. Decisión de la primitiva

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | `[002]` Prueba del foco en navegador real, dentro de la app. En una copia desechable de la app de la fase 1: montar el diálogo de confirmación, el cajón y un aviso de Radix junto a una tabla, un formulario y un gráfico; probar con teclas reales en Chromium, Firefox y WebKit; repetir con el elemento nativo `dialog`; primera medida de estilos en línea. Aplicar la regla de decisión por pieza del diseño y anotar el resultado en `evidencias/`. Nada de la copia entra en `main` | REQ-004, REQ-017, REQ-018, REQ-021, REQ-035 | 002: app e instalación de dependencias cerrada; decisión A-11 en P1 | `qa` | PRUEBA-011 | pendiente |

## B. Preparación

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-002 | `[002]` Instalar las dependencias del diseño, con la primitiva que haya decidido T-001, y `postcss.config.mjs`. Volver a leer cada versión en el registro y anotarla. Comprobar lo que el diseño dejó «no verificado, al instalar» | REQ-032, REQ-086 | T-001 · 002: hallazgo de instalación cerrado | `plataforma` | Batería de la 002 en verde con Tailwind compilando; nota de versiones en `evidencias/` | pendiente |
| T-003 | `[002]` `[R]` `playwright.config.ts`; orden de pruebas en navegador en la clave `scripts` de `package.json`; carpeta absoluta de los navegadores de prueba y su suma en `scripts/bateria/herramientas.json` | REQ-062, REQ-089 | T-002 | `plataforma` | PRUEBA-037 (parte de la suma: un archivo alterado hace fallar) | pendiente |
| T-004 | `[002]` `[R]` Comprobación «interfaz» en `scripts/bateria/comprobaciones.mjs`: ejecuta la orden de T-003, comprueba la suma antes, compara las cuentas con `main` y tiene su tiempo máximo. Subir la duración máxima de la batería | REQ-062 | T-003 | `plataforma` | PRUEBA-036 (parte de las cuentas), en una copia de prueba | pendiente |
| T-005 | Aprobar con firma los cambios reservados de T-003 y T-004 y la ampliación de la lista de rutas reservadas (asunto A-12) | REQ-062 | T-003, T-004 | `responsable` | Aprobación firmada de cada commit, según el procedimiento de la 002 | pendiente |
| T-006 `[P]` | Prueba de fronteras sobre el grafo de módulos (alias, importaciones dinámicas, reexportaciones) y `tests/unit/diseno/excepciones.ts` | REQ-032, REQ-084 | T-002 | `qa` | PRUEBA-008 | pendiente |
| T-007 `[P]` | Comprobación estática de los archivos de prueba y `tests/unit/diseno/paquetes-de-cliente.ts`, con la lista de paquetes que alcanzan los módulos de cliente | REQ-062 | T-002 | `qa` | PRUEBA-036 (parte estática, con los cuatro archivos sembrados) y PRUEBA-037 (parte de la lista) | pendiente |
| T-008 | Escribir la prueba de que la muestra no existe en producción: control 1 con los cinco valores de `ENTORNO`; control 2 en cada punto de entrada, con `Host` y con `X-Forwarded-Host` falsificado; control positivo. Los casos que necesitan la muestra se generan cuando existe su `layout` | REQ-061 | T-003 | `qa` | PRUEBA-024 escrita; batería en verde | pendiente |
| T-009 | `[002]` `[C]` `next.config.ts`: la extensión `muestra.tsx` entra en `pageExtensions` solo con `ENTORNO` igual a `desarrollo` o `preproduccion`, leído a través de `configuracion.ts` | REQ-061 | T-008 · 002: `configuracion.ts` | `plataforma` | PRUEBA-024 (control 1) | pendiente |
| T-010 | `[002]` `[D]` Esqueleto de la muestra: `_datos/acceso-muestra.ts` con `comprobarAccesoMuestra()` y su prueba unitaria, `layout.muestra.tsx`, índice e `inventario.ts` con la primera entrada | REQ-061, REQ-084 | T-009, T-006 · 002: `<dominio>` | `ingeniero-frontend` | PRUEBA-024 completa; PRUEBA-008 | pendiente |
| T-011 | Infraestructura de accesibilidad automática: `tests/e2e/muestra/configuracion-interfaz.ts` con la única llamada a `axe`, recorrido del inventario a 320 y 1280 px en claro y en oscuro, y la página con infracción sembrada | REQ-034, REQ-062 | T-010 | `qa` | PRUEBA-025; PRUEBA-026 (parte de la infracción sembrada) | pendiente |

## C. Base sin decisiones visuales

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-012 | Tabla de la escala y de los papeles en `docs/DISENO.md`, con los valores iniciales ajustados solo donde no llegan al contraste, y sus diferencias | REQ-029, REQ-086 | — | `disenador-ui` | Revisión del `revisor` contra el contraste calculado en `propuestas.md` | pendiente |
| T-013 | `valores.css` con las tres capas y los tres juegos (claro, oscuro, colores forzados), tema por defecto de Tailwind eliminado, estilos importados en `src/app/layout.tsx`, y la prueba de la escala | REQ-039, REQ-043, REQ-086, REQ-088 | T-002, T-006, T-012 | `ingeniero-frontend` | PRUEBA-005 | pendiente |
| T-014 | `combinaciones.ts` de los dos temas, `base.css` (foco, movimiento, texto) y la prueba de contraste, con el peor punto de cada degradado | REQ-029, REQ-030, REQ-036, REQ-038, REQ-085 | T-013 | `ingeniero-frontend` | PRUEBA-006 | pendiente |
| T-015 `[P]` | Formato de fechas: `formatearFechaHora`, hora repetida, `formatearFecha`, `formatearPeriodo`, `diaDeMadrid`, con sus pruebas en tres zonas horarias | REQ-047, REQ-049, REQ-079, REQ-080 | T-002 | `ingeniero-frontend` | PRUEBA-001 (fechas), PRUEBA-002 | pendiente |
| T-016 `[P]` | Formato de números y porcentajes, `calcularVariacion` y `leerCifra`, con sus pruebas | REQ-048, REQ-050, REQ-053, REQ-055, REQ-076 | T-002 | `ingeniero-frontend` | PRUEBA-001 (números), PRUEBA-003 | pendiente |
| T-017 `[P]` | `[D]` `textoPlano`, `TextoDato` y `SoloLector`, con su prueba | REQ-056, REQ-071 | T-002 | `ingeniero-frontend` | PRUEBA-004 | pendiente |
| T-018 `[P]` | `estado-direccion.ts` y `rutas.ts`, con su prueba | REQ-059, REQ-083 | T-002 | `ingeniero-frontend` | PRUEBA-009 | pendiente |
| T-019 | `textos.ts`, `estado/catalogo.ts` y `leerEstado`, con la prueba de textos | REQ-012, REQ-046, REQ-075 | T-002 | `ingeniero-frontend` | PRUEBA-007; PRUEBA-003 (estados) | pendiente |
| T-020 `[P]` | `[D]` `src/lib/errores/referencia.ts`: `crearReferencia` y `leerReferencia`, con su prueba | REQ-057 | T-002 | `ingeniero-backend` | PRUEBA-010 (formato) | pendiente |
| T-021 `[P]` | `[D]` `src/lib/errores/sin-acceso.ts`, con su prueba unitaria | REQ-027, REQ-077 | T-002 | `ingeniero-backend` | Prueba unitaria propia; PRUEBA-008 | pendiente |
| T-022 | `[002]` `[C]` Campo `referencia` en `src/lib/registro/registro.ts`, que solo acepta el formato exacto, y `src/lib/errores/fallo-servidor.ts` con `registrarFallo` | REQ-057 | T-020 · 002: acepta el cambio en `registro.ts` | `ingeniero-backend` | PRUEBA-010 (registro) | pendiente |
| T-023 `[P]` | Iconos de la interfaz como componentes SVG y `LICENCIAS.md` | REQ-033 | T-006 | `disenador-ui` | PRUEBA-008 (iconos) | pendiente |

## D. Pruebas transversales en navegador

Recorren todas las entradas del inventario. Se escriben una vez y se aplican a cada componente desde el commit en que entra.

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-024 `[P]` | Pruebas de anchos, zum, espaciado de texto y orientación, y de temas, colores forzados, movimiento y fuente | REQ-008, REQ-039, REQ-041, REQ-043, REQ-044, REQ-070, REQ-088 | T-011 | `qa` | PRUEBA-013 y PRUEBA-020 escritas; batería en verde | pendiente |
| T-025 `[P]` | Pruebas de red, almacenamiento, dirección e inventario de la política de contenido, y de cobertura de combinaciones de color | REQ-029, REQ-032, REQ-058, REQ-059 | T-011, T-014 | `qa` | PRUEBA-018 y PRUEBA-022 escritas; batería en verde | pendiente |
| T-026 `[P]` | Pruebas del armazón y del recorrido con teclado, foco y objetivos de pulsación | REQ-001, REQ-009, REQ-035, REQ-036, REQ-037, REQ-040, REQ-042 | T-011 | `qa` | PRUEBA-012 y PRUEBA-021 escritas; batería en verde | pendiente |
| T-027 `[P]` | Prueba con el navegador en inglés y en tres zonas horarias | REQ-046, REQ-049, REQ-079, REQ-080 | T-011 | `qa` | PRUEBA-019 escrita; batería en verde | pendiente |

## E. Armazón

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-028 | `Anunciador`, `Armazon`, `areas.ts`, `EnlaceSaltar` y `RejillaCuerpo`; `lang`, `viewport`, `color-scheme` y plantilla del título en `src/app/layout.tsx`; armazón en la muestra con las áreas de superadmin y de cliente | REQ-001, REQ-003, REQ-007, REQ-008, REQ-009, REQ-010, REQ-040, REQ-041, REQ-042, REQ-051 | T-014, T-019, T-024, T-026 | `ingeniero-frontend` | PRUEBA-012 (estructura, áreas, salto, regiones); PRUEBA-013; PRUEBA-025 | pendiente |
| T-029 | `MenuLateral` y `CajonMenu`, con la primitiva decidida en T-001 | REQ-002, REQ-004, REQ-035, REQ-038 | T-028, T-023 | `ingeniero-frontend` | PRUEBA-012 (menú y cajón); PRUEBA-021 | pendiente |
| T-030 | `Cabecera`, `CuentaUsuario` y `SelectorPeriodo`; título de la vista sin datos | REQ-005, REQ-006, REQ-065, REQ-083 | T-029, T-015, T-018 | `ingeniero-frontend` | PRUEBA-012 (título, cuenta, periodo); PRUEBA-018 | pendiente |

## F. Componentes que necesita la propuesta visual

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-031 `[P]` | Pruebas de la tarjeta de cifra, la etiqueta de estado y la lista de alertas | REQ-011, REQ-012, REQ-016 | T-011 | `qa` | PRUEBA-014 (primera parte) escrita; batería en verde | pendiente |
| T-032 `[P]` | Pruebas de la tabla, la paginación, los gráficos y la tabla equivalente | REQ-013, REQ-014, REQ-015, REQ-054 | T-011 | `qa` | PRUEBA-014 (segunda parte) escrita; batería en verde | pendiente |
| T-033 `[P]` | Pruebas del diálogo, el formulario, los avisos y las acciones, con todos los casos de respuesta y la respuesta tardía | REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-024, REQ-072, REQ-073, REQ-074 | T-011 | `qa` | PRUEBA-015 escrita; batería en verde | pendiente |
| T-034 | `Boton`, `useAccion` y `leerResultadoAccion`: cerrojo, plazo de 30 s, resultado por envío; con pruebas unitarias de la tabla de resultados | REQ-024, REQ-037, REQ-073, REQ-074, REQ-078 | T-028, T-033 | `ingeniero-frontend` | PRUEBA-015 (acciones) | pendiente |
| T-035 | `TarjetaCifra` | REQ-011, REQ-050, REQ-053, REQ-055, REQ-076, REQ-081 | T-016, T-028, T-031 | `ingeniero-frontend` | PRUEBA-014 (tarjeta); PRUEBA-013 | pendiente |
| T-036 | `EtiquetaEstado` | REQ-012, REQ-030, REQ-038, REQ-075 | T-019, T-028, T-031 | `ingeniero-frontend` | PRUEBA-014 (etiqueta) | pendiente |
| T-037 | `Tabla`, `Paginacion` y `RegionDesplazable` | REQ-013, REQ-045, REQ-066, REQ-067 | T-034, T-032 | `ingeniero-frontend` | PRUEBA-014 (tabla); PRUEBA-013 | pendiente |
| T-038 | `GraficoLineas`, `GraficoBarras` y `TablaEquivalente`, con Recharts confinado. El orquestador pasa en el encargo la guía de visualización de datos | REQ-014, REQ-015, REQ-052, REQ-054 | T-037, T-032 | `ingeniero-frontend` | PRUEBA-014 (gráficos); PRUEBA-008 | pendiente |
| T-039 | `ListaAlertas` | REQ-016 | T-034, T-036, T-015, T-031 | `ingeniero-frontend` | PRUEBA-014 (alertas) | pendiente |
| T-040 | `DialogoConfirmacion`, con la primitiva decidida en T-001 y el objetivo `{nombre, distintivo}` | REQ-017, REQ-018, REQ-082 | T-034, T-017, T-033 | `ingeniero-frontend` | PRUEBA-015 (diálogo); PRUEBA-013 (poca altura) | pendiente |

## G. Propuesta visual, logotipo y validación

El orquestador carga las skills de diseño de la sesión y pasa su guía en cada encargo al `disenador-ui`. No es tarea de ningún agente cargarlas.

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-041 | Propuesta de paleta de los dos temas, degradados y escala (color, espaciado, radios, sombras, tamaños): `valores.css`, `combinaciones.ts` y la tabla de `docs/DISENO.md` con las diferencias. Entrega también el texto de la propuesta, que el orquestador guarda en `propuesta-visual.md` | REQ-029, REQ-030, REQ-085, REQ-086, REQ-088 | T-014, T-040 | `disenador-ui` | PRUEBA-005, PRUEBA-006, PRUEBA-022 | pendiente |
| T-042 | Propuesta de tipografía: pila del sistema o fuente abierta alojada con `next/font/local`, con su licencia; cifras tabulares | REQ-031, REQ-070 | T-041, T-024 | `disenador-ui` | PRUEBA-020 (fuente bloqueada, cifras del mismo ancho) | pendiente |
| T-043 `[P]` | Tres propuestas de logotipo, como mínimo: un nido de aves con estética tecnológica. Por propuesta, tres SVG: menú oscuro, fondo claro e icono | REQ-033, REQ-087 | T-006 | `disenador-ui` | PRUEBA-008 (SVG limpios); PRUEBA-006 (contraste de las tres variantes) | pendiente |
| T-044 | Página `/muestra/propuesta-visual` (paleta, degradados, logotipos a 16, 32 y 128 px sobre claro y oscuro, y tres vistas provisionales: Resumen de superadmin, tabla con el diálogo abierto y Resumen de cliente a 375 px) y página `/muestra/valores` | REQ-061, REQ-086 | T-035 a T-043 | `ingeniero-frontend` | PRUEBA-025; PRUEBA-013 | pendiente |
| T-045 | Validar la propuesta visual (paleta, degradados, logotipo y tres vistas) y elegir el logotipo. **Hasta que conste, no empieza ninguna tarea del bloque H** | REQ-086, REQ-087 | T-044 | `responsable` | PRUEBA-031: respuesta escrita y con fecha del responsable, anotada por el orquestador en `propuesta-visual.md` | pendiente |
| T-046 | Prueba del logotipo y del nombre: junto al logotipo en el menú, en el título de todas las vistas, nombre accesible una vez, capturas a 16 y a 32 px | REQ-087 | T-045 | `qa` | PRUEBA-023 escrita; batería en verde | pendiente |
| T-047 | Valores definitivos, con los cambios que pida el responsable, y tabla final de `docs/DISENO.md` | REQ-029, REQ-088 | T-045 | `disenador-ui` | PRUEBA-005, PRUEBA-006, PRUEBA-022, PRUEBA-025 | pendiente |
| T-048 | Logotipo elegido en `src/components/marca/`, montado en el menú; `icon.svg`, `favicon.ico` y `apple-icon.png` | REQ-033, REQ-087 | T-046, T-047 | `disenador-ui` | PRUEBA-023; PRUEBA-008; PRUEBA-006 | pendiente |

## H. Resto de componentes y vistas de la muestra

No empieza hasta T-045.

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-049 | `Formulario` y campos (texto, texto largo, selección, casilla, grupo de opciones, búsqueda), con errores de campo `{campo, codigo}` | REQ-019, REQ-020, REQ-080 | T-045, T-034 | `ingeniero-frontend` | PRUEBA-015 (formulario); PRUEBA-019 | pendiente |
| T-050 | `AvisosTemporales`, con la primitiva decidida en T-001 | REQ-021, REQ-072 | T-049 | `ingeniero-frontend` | PRUEBA-015 (avisos) | pendiente |
| T-051 `[P]` | Pruebas de los estados de vista: cinco estados, error, sin permiso igual que inexistente, datos parciales, vacío, carga lenta, sin conexión | REQ-022, REQ-023, REQ-025 a REQ-028, REQ-060, REQ-068, REQ-069 | T-011 | `qa` | PRUEBA-016 escrita; batería en verde | pendiente |
| T-052 `[P]` | Pruebas de texto hostil y de datos internos, en el documento y en el cuerpo de todas las respuestas | REQ-056, REQ-057, REQ-071, REQ-075 | T-011 | `qa` | PRUEBA-017 escrita; batería en verde | pendiente |
| T-053 | `EstadoVacio`, `EstadoError`, `EstadoSinPermiso` y `Esqueleto` | REQ-022, REQ-023, REQ-026, REQ-027 | T-050, T-051, T-020 | `ingeniero-frontend` | PRUEBA-016 (estados sueltos) | pendiente |
| T-054 | `BloqueDatos`: cinco estados, datos parciales, aviso a los 10 s y error a los 30 s | REQ-025, REQ-028, REQ-068, REQ-069 | T-053 | `ingeniero-frontend` | PRUEBA-016 (bloque, parciales, carga lenta) | pendiente |
| T-055 | `AvisoConexion` y marca de la hora de carga en los bloques | REQ-060 | T-054 | `ingeniero-frontend` | PRUEBA-016 (sin conexión) | pendiente |
| T-056 | Vistas de ejemplo de Resumen (superadmin y cliente) en sus estados, con los casos límite de cifras y la indicación «Horas en horario de Madrid» | REQ-025, REQ-049, REQ-051, REQ-052, REQ-061, REQ-081 | T-055, T-052, T-027 | `ingeniero-frontend` | PRUEBA-016; PRUEBA-017; PRUEBA-019; PRUEBA-025 | pendiente |
| T-057 | Vistas de ejemplo de tabla y de ficha con formulario en sus estados, con el nombre de 120 caracteres, la batería de cadenas y la dirección inexistente dentro del armazón | REQ-025, REQ-061, REQ-065, REQ-071, REQ-077 | T-056 | `ingeniero-frontend` | PRUEBA-016; PRUEBA-017; PRUEBA-013; PRUEBA-025 | pendiente |
| T-058 | Pruebas contrato en `tests/e2e/contrato/`: acceso indistinguible, respuestas sin almacenamiento y título sin datos; lo escrito, solo en el cuerpo | REQ-027, REQ-058, REQ-059, REQ-077 | T-011 | `qa` | PRUEBA-034 y PRUEBA-035 escritas; batería en verde | pendiente |
| T-059 | `[D]` Vistas de servidor en `/muestra/servidor/`: recurso permitido con campos de más, denegado, inexistente, área inexistente, error interno capturado, búsqueda en el cuerpo y acción con cada caso de respuesta. Sin escribir en el registro ni en la supervisión | REQ-027, REQ-057, REQ-073, REQ-075, REQ-077, REQ-078, REQ-084 | T-057, T-058, T-021 | `ingeniero-frontend` | PRUEBA-034; PRUEBA-035; PRUEBA-017; PRUEBA-015 (casos de respuesta); PRUEBA-018 | pendiente |
| T-060 | Cierre del inventario: la muestra tiene todos los componentes y estados del inventario del diseño, con la aserción que lo comprueba | REQ-061 | T-059, T-048 | `ingeniero-frontend` | PRUEBA-008 (inventario del diseño igual al de la muestra) | pendiente |
| T-061 | Revisión de `textos.ts` y de `catalogo.ts` con la guía de textos que pasa el orquestador: español de España, trato de tú, botones con verbo y objeto, una palabra por estado | REQ-012, REQ-046 | T-060 | `disenador-ui` | PRUEBA-007; PRUEBA-019 | pendiente |

## I. Verificación

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-062 | Medición de laboratorio en cada vista de la muestra: guion de medida y cinco ejecuciones por vista, con la mediana y la peor | REQ-023, REQ-064, REQ-067 | T-061 | `qa` | PRUEBA-027 | pendiente |
| T-063 `[P]` | Matriz completa: todas las pruebas en navegador y de accesibilidad en Firefox, WebKit y Edge | REQ-044, REQ-089 | T-061 | `qa` | PRUEBA-030 (parte automática); PRUEBA-011 repetida sobre los componentes definitivos | pendiente |
| T-064 | `[002]` En una copia de prueba: una infracción sembrada en un componente deja la batería en rojo; excluir una regla de `axe`, quitar un estado del inventario y añadir una excepción de `style` se rechazan sin firma o hacen fallar la batería | REQ-062 | T-061, T-005 · 002: comprobación «interfaz» y rutas reservadas aplicadas | `qa` | PRUEBA-026 (batería); PRUEBA-036 (batería) | pendiente |
| T-065 `[P]` | Vuelta atrás de un cambio de valores, en local: integrar un cambio, revertirlo y comprobar escala, contraste y accesibilidad | REQ-086 | T-061 | `qa` | PRUEBA-033 (local) | pendiente |
| T-066 | Revisión documental: ningún elemento de la captura de referencia en marca, iconos ni textos; ningún parecido del logotipo; licencias anotadas; catálogo y paleta documentados. El orquestador transcribe el dictamen | REQ-033, REQ-046, REQ-087 | T-061 | `revisor` | PRUEBA-032 | pendiente |
| T-067 | Guía de pasos para la revisión manual, en `evidencias/guia-revision-manual.md`: teclado, NVDA, VoiceOver, texto al 200 %, zum al 400 %, espaciado, colores forzados, movimiento, grises, los dos temas, Safari y móvil real; con lo que `axe` dejó «por revisar» | REQ-063 | T-062, T-063 | `qa` | Revisión del `disenador-ui` y del `revisor` | pendiente |
| T-068 | Revisión manual de accesibilidad con la guía, en los dos temas, incluido Safari de escritorio. El orquestador avisa al responsable, que la hace o designa a quien la haga | REQ-034 a REQ-043, REQ-063, REQ-089 | T-067 | `responsable` | PRUEBA-028 y PRUEBA-030 (Safari): informe de la persona en `evidencias/`. Mientras no exista, «no ejecutada» | pendiente |
| T-069 | Prueba en móvil real: Safari en iOS con VoiceOver y Chrome en Android, a 320 y 375 px, solo con táctil | REQ-044, REQ-045, REQ-089 | T-067 | `responsable` | PRUEBA-029: informe de la persona en `evidencias/`. Mientras no exista, «no ejecutada» | pendiente |

## J. Condicionadas a la función 002 y a los entornos

| ID | Tarea | Requisitos | Depende de | Agente | Prueba que la cierra | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| T-070 | `[002]` `[R]` En `scripts/plataforma/comprobar-despliegue.mjs`: no promover si `/muestra` o `/muestra/valores` no dan 404 en producción. Anotar la condición en la guía de operación y en el texto que enseña la orden de producción antes de la firma | REQ-061 | T-010 · 002: acepta el cambio y existe el despliegue | `plataforma` | PRUEBA-024 (parte de producción), con un despliegue de prueba que la incumple | bloqueada |
| T-071 | Aprobar con firma el cambio reservado de T-070 | REQ-061 | T-070 | `responsable` | Aprobación firmada, según el procedimiento de la 002 | bloqueada |
| T-072 | `[002]` Repetir en preproducción las pruebas de red, de la muestra, de laboratorio y de vuelta atrás; y, cuando exista producción, comprobar el 404 de la muestra en su dirección real | REQ-032, REQ-061, REQ-064 | T-061, T-071 · existen preproducción y producción | `qa` | PRUEBA-018, PRUEBA-024, PRUEBA-027 y PRUEBA-033, en preproducción. Hasta entonces, «no ejecutada» | bloqueada |

## Escalados

Tareas que han subido de nivel de modelo o de esfuerzo, y por qué (`docs/EQUIPO.md`).

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
