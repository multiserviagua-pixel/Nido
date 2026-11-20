# 020 · Tareas

Autor: `arquitecto` · 20/11/2026 · Reagrupación por D-029 de las 72 tareas del 13/11 (historial de git) en 22, con el mismo alcance, las mismas pruebas y dependencias; sin firmas (D-025). Fuente: `diseno.md` (DISEÑADA; enmienda 1 del 20/11/2026, avisos propios, pendiente de que la vea el responsable en la próxima puerta). Orden, riesgos, rutas críticas y decisiones pendientes (`DP-`): `plan.md`. Equivalencias: al final.

Cada tarea tiene un solo agente responsable y las pruebas que dicen cuándo está hecha. `[P]`: puede ir en paralelo (no comparte archivos; dependencias cumplidas). «002·T-nnn» es una tarea de la 002.

Estados: pendiente · en curso · en revisión · hecha · bloqueada.

## Convenciones

- **Agrupación (D-029).** Partes (a), (b)…, en ese orden. Por tarea: un `npm run verificar`, una revisión, un dictamen si RC es `C` o `D` y un «sí». Relevo solo al cerrar un bloque o al llegar al tope de contexto.
- **Prueba primero.** Unitaria: en su parte, en rojo en su commit antes que el código. En navegador: la escribe `qa` en una tarea anterior (T-009, T-014), generada solo para las entradas que existen en `m/inventario.ts`; la parte que añade un componente añade sus entradas en el mismo commit y desde ahí la prueba tiene que pasar. Ninguna prueba saltada. «(parte)»: la prueba entera la cierran todas sus partes.
- **Rama y puerta** (D-025; 002 diseño §Integración): `tarea/020-T-0NN` desde `main` (DP-3, decidido 20/11/2026), en la copia de trabajo del carril C (D-032); `verificar` por el orquestador; `revisor`; `auditor-seguridad` si RC es `C` o `D`; «sí» expreso del responsable que nombra la tarea y, si es `Res.`, las rutas reservadas; `merge --squash` con `T-0NN (020): …`. Evidencias en `ev/T-0NN/`. Vuelta atrás: `git revert` por el mismo camino.
- **Sin firmas (D-025).** Donde el diseño dice «firma», rige el «sí» que nombra la ruta (002 diseño §Aplazado a la 003). Se retiran T-005 y T-071 antiguas. Lo que solo comprobaba una firma queda «aplazado a la 003», «no ejecutada»: los casos de firma de PRUEBA-036 (T-022).
- **Navegador hasta T-020.** Mientras la comprobación «interfaz» no bloquee la integración (DP-1), el orquestador ejecuta también la orden en navegador de T-002 y anexa su salida a `verificar.md`; REQ-062 figura como no cumplido (diseño §Qué queda condicionado, punto 3).
- **RC**: `C` = ruta crítica (002 diseño §Integración, «Críticas»; `docs/SEGURIDAD.md`); `D` = no crítica, el diseño pide dictamen; ambas, `revisor` y `auditor-seguridad`. `R` = solo `revisor`. **Res.**: reservada (lista de la 002 y A-12); el «sí» la nombra. Cambiar uno de los cinco archivos de A-12 es `Res.`; `inventario.ts`, desde T-016 (i).
- **Todas** dependen de 002·T-003 (`verificar` en `main`), salvo T-001 (002·T-002).
- **Rutas**: `c/` = `src/components/`; `m/` = `src/app/muestra/`; `td/` = `tests/unit/diseno/`; `te/` = `tests/e2e/muestra/`; `tc/` = `tests/e2e/contrato/`; `ev/` = `evidencias/` de esta función. PRUEBA-NNN: diseño §Pruebas; ninguna ejecutada, salvo PRUEBA-011 (T-001).
- **Guías**: el orquestador carga las skills de diseño y pasa su guía en cada encargo al `disenador-ui` y al `ingeniero-frontend`. Si un agente no puede escribir en `specs/`, entrega el contenido y lo guarda el orquestador.

## Bloque 1 · Primitiva y preparación

### T-001 · Prueba del foco en navegador real
`qa` · R · hecha · Depende de: 002·T-002; instalación de la 002 cerrada (D-026, D-027); A-11 · REQ-004, REQ-017, REQ-018, REQ-021, REQ-035 · CA-003, CA-013
- En una copia desechable de la app (`plan.md`, «Cómo se hace T-001»): diálogo, cajón y aviso de Radix junto a tabla, formulario y gráfico; teclas reales en Chromium, Firefox y WebKit; repetición con `dialog` nativo; primera medida de estilos en línea; regla de decisión por pieza (diseño §Diálogo, cajón y avisos). Nada entra en `main`. Prueba: PRUEBA-011.
- Resultado (20/11/2026, commit 5c907d7, `ev/T-001/informe.md`): diálogo y cajón, Radix; avisos, componente propio (enmienda 1 del diseño).
- Archivos: `ev/T-001/`.

### T-002 · Dependencias, Tailwind y Playwright
`plataforma` · C, Res. · pendiente · Depende de: T-001 · REQ-032, REQ-062, REQ-086, REQ-089 · CA: ninguno propio (base de T-009 y T-020)
- (a) Dependencias de diseño §Dependencias nuevas con la primitiva de T-001 (Radix solo `react-alert-dialog` y `react-dialog`; no se instala `@radix-ui/react-toast`, enmienda 1): versión releída en el registro, con fuente y fecha, 7 días o más (D-027) y licencia; lo «no verificado, al instalar»; `postcss.config.mjs`. Prueba: `verificar` en verde con Tailwind compilando; versiones en `ev/T-002/`; el bloqueo sin `@radix-ui/react-toast`, `@radix-ui/react-collection` ni `@radix-ui/react-visually-hidden`.
- (b) `playwright.config.ts` (sin reintentos) y orden de pruebas en navegador en `scripts` de `package.json`, sobre la compilación servida en local con `ENTORNO=preproduccion`. Prueba: la orden en verde, salida en `ev/T-002/`. Carpeta y suma de los navegadores: T-020.
- Archivos: `package.json`, `package-lock.json`, `postcss.config.mjs`, `playwright.config.ts`.

### T-003 `[P]` · Fronteras, comprobación estática y muestra fuera de producción
`qa` · R, Res. · pendiente · Depende de: T-002 · REQ-032, REQ-061, REQ-062, REQ-084 · CA-024, CA-025, CA-046, CA-056
- (a) Fronteras sobre el grafo de módulos (alias, importaciones dinámicas, reexportaciones) y `td/excepciones.ts`. Prueba: PRUEBA-008.
- (b) Comprobación estática de los archivos de prueba y `td/paquetes-de-cliente.ts`. Prueba: PRUEBA-036 (parte estática, cuatro archivos sembrados), PRUEBA-037 (parte de la lista).
- (c) Control 1 con los cinco valores de `ENTORNO`; control 2 en cada punto de entrada, con `Host` y con `X-Forwarded-Host` falsificado; control positivo; los casos que necesitan la muestra, cuando exista su `layout`. Prueba: PRUEBA-024 escrita.
- Archivos: `td/**`.

### T-004 · Muestra fuera de producción al compilar
`plataforma` · C, Res. · pendiente · Depende de: T-003, 002·T-005 (`ENTORNO`) · REQ-061 · CA-046
- `next.config.ts`: `muestra.tsx` en `pageExtensions` solo con `ENTORNO` `desarrollo` o `preproduccion`, leído a través de `configuracion.ts`. Prueba: PRUEBA-024 (control 1).

### T-005 · Esqueleto de la muestra
`ingeniero-frontend` · D · pendiente · Depende de: T-004; `<dominio>` no bloquea (`plan.md`) · REQ-061, REQ-084 · CA-024, CA-046, CA-056
- `m/_datos/acceso-muestra.ts` con `comprobarAccesoMuestra()` y su prueba unitaria; `m/layout.muestra.tsx`, índice e `m/inventario.ts` con la primera entrada. Prueba: PRUEBA-024 completa; PRUEBA-008.

## Bloque 2 · Base sin decisiones visuales

### T-006 `[P]` · Escala inicial e iconos
`disenador-ui` · R · pendiente · Depende de: (a) nada; (b) T-003 · REQ-029, REQ-033, REQ-086 · CA-024, CA-046, CA-056
- (a) Escala y papeles en `docs/DISENO.md`, con los valores iniciales ajustados solo donde no llegan al contraste, y sus diferencias. Prueba: revisión del `revisor` contra el contraste de `propuestas.md`.
- (b) Iconos como componentes SVG en `c/iconos/` y `LICENCIAS.md`. Prueba: PRUEBA-008 (iconos).

### T-007 `[P]` · Formatos, texto de dato, dirección, textos, valores y contraste
`ingeniero-frontend` · D (parte (c)); el resto, R · pendiente · Depende de: T-002; (f) y (g), además T-003 y T-006 · REQ-012, REQ-029, REQ-030, REQ-036, REQ-038, REQ-039, REQ-043, REQ-046 a REQ-050, REQ-053, REQ-055, REQ-056, REQ-059, REQ-071, REQ-075, REQ-076, REQ-079, REQ-080, REQ-083, REQ-085, REQ-086, REQ-088 · CA-008, CA-009, CA-013, CA-017, CA-022, CA-027, CA-036 a CA-041, CA-044, CA-051, CA-054 a CA-057
- (a) `formatearFechaHora`, hora repetida, `formatearFecha`, `formatearPeriodo`, `diaDeMadrid`, en tres zonas horarias. Prueba: PRUEBA-001 (fechas), PRUEBA-002.
- (b) Números y porcentajes, `calcularVariacion`, `leerCifra`. Prueba: PRUEBA-001 (números), PRUEBA-003.
- (c) `textoPlano`, `TextoDato`, `SoloLector`. Prueba: PRUEBA-004.
- (d) `estado-direccion.ts`, `rutas.ts`. Prueba: PRUEBA-009.
- (e) `textos.ts`, `estado/catalogo.ts`, `leerEstado`. Prueba: PRUEBA-007; PRUEBA-003 (estados).
- (f) `valores.css`: tres capas y tres juegos (claro, oscuro, colores forzados), sin el tema de Tailwind, importado en `src/app/layout.tsx`. Prueba: PRUEBA-005.
- (g) `combinaciones.ts` de los dos temas y `base.css` (foco, movimiento, texto). Prueba: PRUEBA-006, con el peor punto de cada degradado.
- Archivos: `c/{formato,texto,direccion,estado,estilos}/**`, `c/textos.ts`, `src/app/layout.tsx`, `td/`.

### T-008 `[P]` · Referencia, sin acceso y registro de fallos
`ingeniero-backend` · C (parte (c)); (a) y (b), D · pendiente · Depende de: T-002; (c), además 002·T-004 y que la 002 acepte el campo · REQ-027, REQ-057, REQ-077 · CA-024, CA-042, CA-046, CA-056
- (a) `src/lib/errores/referencia.ts`: `crearReferencia`, `leerReferencia`. Prueba: PRUEBA-010 (formato).
- (b) `src/lib/errores/sin-acceso.ts`. Prueba: unitaria propia; PRUEBA-008.
- (c) Campo `referencia` en `src/lib/registro/registro.ts`, solo con el formato exacto; `src/lib/errores/fallo-servidor.ts` con `registrarFallo`. Prueba: PRUEBA-010 (registro).

## Bloque 3 · Pruebas en navegador, armazón y componentes de la propuesta

### T-009 · Pruebas en navegador
`qa` · R, Res. · pendiente · Depende de: T-005; (c), además T-007 · REQ-001, REQ-008, REQ-009, REQ-011 a REQ-029, REQ-032, REQ-034 a REQ-037, REQ-039 a REQ-044, REQ-046, REQ-049, REQ-054, REQ-056 a REQ-060, REQ-062, REQ-068 a REQ-075, REQ-077, REQ-079, REQ-080, REQ-088 · CA-001 a CA-025, CA-027, CA-028, CA-030 a CA-034, CA-036, CA-038 a CA-046, CA-048 a CA-054, CA-057

Cada parte cierra con su prueba escrita y en verde. (f) a (j) pueden escribirse mientras avanza el bloque 2.

- (a) `te/configuracion-interfaz.ts`, con la única llamada a `axe`; inventario a 320 y 1280 px, en claro y en oscuro; página con infracción sembrada. Prueba: PRUEBA-025; PRUEBA-026 (parte sembrada).
- (b) Anchos, zum, espaciado y orientación; temas, colores forzados, movimiento y fuente. Prueba: PRUEBA-013, PRUEBA-020.
- (c) Red, almacenamiento, dirección e inventario de la política de contenido; cobertura de combinaciones de color. Prueba: PRUEBA-018, PRUEBA-022.
- (d) Armazón, teclado, foco y objetivos de pulsación. Prueba: PRUEBA-012, PRUEBA-021.
- (e) Navegador en inglés y tres zonas horarias. Prueba: PRUEBA-019.
- (f) Tarjeta, etiqueta, alertas, tabla, paginación, gráficos y tabla equivalente. Prueba: PRUEBA-014.
- (g) Diálogo, formulario, avisos y acciones, con todos los casos de respuesta y la tardía. Avisos (enmienda 1): además, las comprobaciones del guion de T-001 (`ev/T-001/guion/`; informe, 2.2, 2.2.1 y 2.2.2) con reloj real, y su prueba de la prueba con un robo de foco sembrado en una copia desechable, salida en `ev/T-009/`. Prueba: PRUEBA-015.
- (h) Estados de vista: cinco estados, error, sin permiso igual que inexistente, parciales, vacío, carga lenta, sin conexión. Prueba: PRUEBA-016.
- (i) Texto hostil y datos internos en el documento y en el cuerpo de las respuestas. Prueba: PRUEBA-017.
- (j) `tc/`: acceso indistinguible, respuestas sin almacenamiento, título sin datos; lo escrito, solo en el cuerpo. Prueba: PRUEBA-034, PRUEBA-035.

### T-010 · Armazón y componentes de la propuesta
`ingeniero-frontend` · R · pendiente · Depende de: T-001 (primitiva), T-006, T-007, T-009 · REQ-001 a REQ-018, REQ-024, REQ-030, REQ-035, REQ-037, REQ-038, REQ-040 a REQ-042, REQ-045, REQ-050 a REQ-055, REQ-065 a REQ-067, REQ-073 a REQ-076, REQ-078, REQ-081 a REQ-083 · CA-001 a CA-015, CA-017, CA-024, CA-025, CA-027, CA-028, CA-031 a CA-033, CA-039, CA-043 a CA-046, CA-049 a CA-053, CA-056, CA-057

Cada parte añade sus entradas a `m/inventario.ts` y sus textos a `c/textos.ts` en el mismo commit.

- (a) `Anunciador`, `Armazon`, `areas.ts`, `EnlaceSaltar`, `RejillaCuerpo`; `lang`, `viewport`, `color-scheme` y plantilla del título en `src/app/layout.tsx`; armazón en la muestra con las áreas de superadmin y de cliente. Prueba: PRUEBA-012 (estructura, áreas, salto, regiones); PRUEBA-013; PRUEBA-025.
- (b) `MenuLateral` y `CajonMenu` con la primitiva de T-001. Prueba: PRUEBA-012 (menú, cajón); PRUEBA-021.
- (c) `Cabecera`, `CuentaUsuario`, `SelectorPeriodo`; título sin datos. Prueba: PRUEBA-012 (título, cuenta, periodo); PRUEBA-018.
- (d) `Boton`, `useAccion`, `leerResultadoAccion`: cerrojo, plazo de 30 s, resultado por envío, con pruebas unitarias. Prueba: PRUEBA-015 (acciones).
- (e) `TarjetaCifra`. Prueba: PRUEBA-014 (tarjeta); PRUEBA-013.
- (f) `EtiquetaEstado`. Prueba: PRUEBA-014 (etiqueta).
- (g) `Tabla`, `Paginacion`, `RegionDesplazable`. Prueba: PRUEBA-014 (tabla); PRUEBA-013.
- (h) `GraficoLineas`, `GraficoBarras`, `TablaEquivalente`, Recharts confinado; guía de visualización de datos del orquestador. Prueba: PRUEBA-014 (gráficos); PRUEBA-008.
- (i) `ListaAlertas`. Prueba: PRUEBA-014 (alertas).
- (j) `DialogoConfirmacion` con la primitiva de T-001 y el objetivo `{nombre, distintivo}`. Prueba: PRUEBA-015 (diálogo); PRUEBA-013 (poca altura).
- Archivos: `c/{armazon,texto,acciones,cifras,estado,tabla,graficos,alertas,dialogo}/**`, `c/textos.ts`, `src/app/layout.tsx`, `m/**`, `td/`.

## Bloque 4 · Propuesta visual y validación

### T-011 · Paleta, tipografía y logotipos
`disenador-ui` · R · pendiente · Depende de: (a) y (b) T-010; (c) T-003 (puede hacerse ya; cierra con todas) · REQ-029, REQ-030, REQ-031, REQ-033, REQ-070, REQ-085 a REQ-088 · CA-022, CA-023, CA-024, CA-027, CA-030, CA-034, CA-046, CA-054 a CA-057
- (a) Paleta de los dos temas, degradados y escala (color, espaciado, radios, sombras, tamaños) en `valores.css`, `combinaciones.ts` y `docs/DISENO.md`, con las diferencias; el texto, en `propuesta-visual.md`. Prueba: PRUEBA-005, PRUEBA-006, PRUEBA-022.
- (b) Tipografía: pila del sistema o fuente abierta con `next/font/local` y su licencia; cifras tabulares. Prueba: PRUEBA-020 (fuente bloqueada, cifras del mismo ancho).
- (c) Tres logotipos o más: nido de aves con estética tecnológica; tres SVG cada uno (menú oscuro, fondo claro, icono), en `propuesta-visual/`. Prueba: PRUEBA-008 (SVG limpios); PRUEBA-006 (tres variantes).

### T-012 · Páginas de propuesta y de valores
`ingeniero-frontend` · R · pendiente · Depende de: T-010, T-011 · REQ-061, REQ-086 · CA-006, CA-025, CA-028, CA-032, CA-049, CA-050, CA-053, CA-057
- `/muestra/propuesta-visual` (paleta, degradados, logotipos a 16, 32 y 128 px sobre claro y oscuro; Resumen de superadmin, tabla con el diálogo abierto y Resumen de cliente a 375 px) y `/muestra/valores`. Prueba: PRUEBA-025; PRUEBA-013.

### T-013 · Validación de la propuesta visual (una persona)
`responsable` · — · pendiente · Depende de: T-012 · REQ-086, REQ-087 · CA-055, CA-056
- Valida paleta, degradados, logotipo y tres vistas; elige el logotipo. **Sin ella no empieza el bloque 5.** No es una firma: es REQ-086. Prueba: PRUEBA-031, respuesta escrita y fechada, anotada por el orquestador en `propuesta-visual.md`.

### T-014 · Prueba del logotipo y del nombre
`qa` · R · pendiente · Depende de: T-013 · REQ-087 · CA-056
- Nombre junto al logotipo en el menú y en el título de todas las vistas, nombre accesible una vez, capturas a 16 y 32 px. Prueba: PRUEBA-023 escrita, en verde.

### T-015 · Valores definitivos y logotipo elegido
`disenador-ui` · R · pendiente · Depende de: (a) T-013; (b) T-014 · REQ-029, REQ-033, REQ-087, REQ-088 · CA-022, CA-024, CA-025, CA-027, CA-028, CA-046, CA-054 a CA-057
- (a) Valores definitivos con los cambios del responsable y tabla final de `docs/DISENO.md`. Prueba: PRUEBA-005, PRUEBA-006, PRUEBA-022, PRUEBA-025.
- (b) Logotipo elegido en `c/marca/`, montado en el menú; `src/app/{icon.svg,favicon.ico,apple-icon.png}`. Prueba: PRUEBA-023; PRUEBA-008; PRUEBA-006.

## Bloque 5 · Resto de componentes y vistas (tras T-013)

### T-016 · Formulario, avisos, estados, vistas e inventario cerrado
`ingeniero-frontend` · D (parte (h)); el resto, R; Res. en (i) · pendiente · Depende de: T-008, T-009, T-010, T-013; (i), además T-015 · REQ-019 a REQ-023, REQ-025 a REQ-028, REQ-049, REQ-051, REQ-052, REQ-057, REQ-060, REQ-061, REQ-065, REQ-068, REQ-069, REQ-071, REQ-072, REQ-073, REQ-075, REQ-077, REQ-078, REQ-080, REQ-081, REQ-084 · CA-006, CA-013 a CA-021, CA-024, CA-025, CA-028, CA-032, CA-036, CA-038, CA-040 a CA-046, CA-048 a CA-053, CA-056, CA-057
- (a) `Formulario` y campos (texto, texto largo, selección, casilla, grupo de opciones, búsqueda), errores `{campo, codigo}`. Prueba: PRUEBA-015 (formulario); PRUEBA-019.
- (b) `AvisosTemporales` como componente propio sin librería, sobre `Anunciador` (diseño §Diálogo, cajón y avisos, «Avisos: componente propio»; enmienda 1). Prueba delante, escrita en T-009 (g): PRUEBA-015 (avisos) y las comprobaciones de T-001 (informe, 2.2, 2.2.1 y 2.2.2): pausa por foco con reloj real y el tabulador justo al abrir y a los 600 ms, con el foco comprobado en «Cerrar aviso» antes de contar; el foco activo no cambia al aparecer el aviso (1,5 s después), con el control de WebKit de 2.2.2 para ratón y táctil. En `verificar`, una vez en Chromium; antes de integrar, `qa` repite los dos casos de pausa 10 veces por motor (Chromium, Firefox, WebKit), 0 fallos, salida en `ev/T-016/`.
- (c) `EstadoVacio`, `EstadoError`, `EstadoSinPermiso`, `Esqueleto`. Prueba: PRUEBA-016 (estados sueltos).
- (d) `BloqueDatos`: cinco estados, parciales, aviso a los 10 s y error a los 30 s. Prueba: PRUEBA-016 (bloque, parciales, carga lenta).
- (e) `AvisoConexion` y hora de carga en los bloques. Prueba: PRUEBA-016 (sin conexión).
- (f) Vistas de Resumen (superadmin y cliente) en sus estados, con casos límite de cifras y «Horas en horario de Madrid». Prueba: PRUEBA-016, 017, 019 y 025.
- (g) Vistas de tabla y de ficha con formulario en sus estados: nombre de 120 caracteres, batería de cadenas, dirección inexistente dentro del armazón. Prueba: PRUEBA-016, 017, 013 y 025.
- (h) `m/servidor/`: permitido con campos de más, denegado, inexistente, área inexistente, error interno capturado, búsqueda en el cuerpo y acción con cada caso de respuesta; sin escribir en registro ni supervisión. Prueba: PRUEBA-034, 035, 017, 015 (casos de respuesta) y 018.
- (i) Cierre del inventario: todos los componentes y estados del diseño en la muestra. Prueba: PRUEBA-008 (inventario del diseño igual al de la muestra). Desde aquí, `inventario.ts` es reservada (A-12).
- Archivos: `c/{formulario,avisos,estados,armazon}/**`, `c/textos.ts`, `m/**`, `td/`.

### T-017 · Revisión de textos y revisión documental
`disenador-ui` · R · pendiente · Depende de: T-016 · REQ-012, REQ-033, REQ-046, REQ-087 · CA-009, CA-013, CA-014, CA-017, CA-022, CA-024, CA-036, CA-038, CA-056
- (a) `textos.ts` y `catalogo.ts` con la guía de textos del orquestador: español de España, tú, botones con verbo y objeto, una palabra por estado. Prueba: PRUEBA-007; PRUEBA-019.
- (b) Revisión documental (antigua T-066): la hace el `revisor` al revisar esta tarea, sobre el árbol entero: nada de la captura de referencia en marca, iconos ni textos; logotipo sin parecido; licencias anotadas; catálogo y paleta documentados. El orquestador transcribe el dictamen. Prueba: PRUEBA-032.

## Bloque 6 · Verificación

### T-018 · Laboratorio, matriz, vuelta atrás y guía
`qa` · R · pendiente · Depende de: T-017 · REQ-023, REQ-044, REQ-063, REQ-064, REQ-067, REQ-086, REQ-089 · CA-003, CA-010, CA-013, CA-016, CA-023, CA-035, CA-047
- (a) Laboratorio en cada vista: guion y cinco ejecuciones por vista, mediana y peor. Sola en la máquina. Prueba: PRUEBA-027.
- (b) Pruebas en navegador y de accesibilidad en Firefox, WebKit y Edge. Prueba: PRUEBA-030 (automática); PRUEBA-011 sobre los componentes definitivos, con el aviso propio y sus repeticiones de pausa por foco (enmienda 1).
- (c) En una copia de prueba: integrar un cambio de valores, revertirlo, comprobar escala, contraste y accesibilidad. Prueba: PRUEBA-033 (local).
- (d) `ev/guia-revision-manual.md`: teclado, NVDA, VoiceOver, texto al 200 %, zum al 400 %, espaciado, colores forzados, movimiento, grises, dos temas, Safari, móvil real y lo que `axe` dejó «por revisar». Prueba: revisión del `disenador-ui` y del `revisor`.

### T-019 · Revisión manual y móvil real (una persona)
`responsable` · — · pendiente · Depende de: T-018 · REQ-034 a REQ-045, REQ-063, REQ-089 · CA-001, CA-004, CA-005, CA-008, CA-010, CA-011, CA-014, CA-026, CA-027, CA-029, CA-030, CA-032 a CA-035, CA-049, CA-054, CA-056, CA-057
- (a) Revisión manual con la guía, dos temas, Safari de escritorio; el orquestador avisa y el responsable la hace o la designa. Prueba: PRUEBA-028 y PRUEBA-030 (Safari), informe en `ev/`.
- (b) Safari en iOS con VoiceOver y Chrome en Android, a 320 y 375 px, solo táctil. Prueba: PRUEBA-029, informe en `ev/`.
- Sin informe, «no ejecutada».

## Bloque 7 · Condicionadas a la 002 y a los entornos

### T-020 `[P]` · Comprobación «interfaz» y sumas de los navegadores
`plataforma` · C, Res. · **bloqueada** · Depende de: T-002, **DP-1** (la batería de la 002 no tiene tarea: su R-3) · REQ-062, REQ-089 · CA-025
- (a) Carpeta absoluta de los navegadores de prueba y su suma (diseño §Dependencias nuevas, punto 2; A-11). Prueba: PRUEBA-037 (parte de la suma: un archivo alterado falla antes de ejecutar nada).
- (b) Comprobación «interfaz»: ejecuta la orden de T-002, comprueba la suma, compara cuentas con `main` (estados del inventario, pruebas ejecutadas, recorridos de `axe`), con tiempo máximo; sube el de la verificación. Prueba: PRUEBA-036 (parte de las cuentas), en una copia de prueba. La excepción «salvo que lleve firma» (diseño §Protección, control 2): **aplazada a la 003**; hasta entonces, toda bajada falla (DP-2).
- Archivos (DP-1): `scripts/bateria/{comprobaciones.mjs,herramientas.json}`, o la cadena `verificar` de `package.json` y la PRUEBA-055 de la 002.

### T-021 `[P]` · Control de despliegue de la muestra
`plataforma` · C, Res. · **bloqueada** · Depende de: T-005; despliegue de la 002 (sin tarea: su R-3 y R-4) · REQ-061 · CA-046
- `scripts/plataforma/comprobar-despliegue.mjs`: no promover si `/muestra` o `/muestra/valores` no dan 404 en producción; la condición, en `docs/operacion/` y en el texto que enseña la orden de producción antes de que la persona la confirme. Prueba: PRUEBA-024 (parte de producción), con un despliegue de prueba que la incumple.

### T-022 · Copia de prueba y preproducción
`qa` · R · **bloqueada** · Depende de: (a) T-017, T-020; (b) T-017, T-021, preproducción y producción · REQ-032, REQ-061, REQ-062, REQ-064 · CA-010, CA-016, CA-023, CA-024, CA-025, CA-043, CA-044, CA-046, CA-047
- (a) En una copia de prueba: una infracción sembrada en un componente deja la verificación en rojo; quitar un estado del inventario falla por la cuenta. Prueba: PRUEBA-026 (batería); PRUEBA-036 (batería, inventario). **Aplazado a la 003**: que excluir una regla de `axe` o añadir una excepción de `style` «se rechacen sin firma»; «no ejecutada»; mientras, ruta reservada nombrada en el «sí» y `revisor`.
- (b) En preproducción, pruebas de red, de la muestra, de laboratorio y de vuelta atrás; con producción, el 404 de la muestra en su dirección real. Prueba: PRUEBA-018, 024, 027 y 033; hasta entonces, «no ejecutada».

## Equivalencias (numeración del 13/11 → actual)

| Actual | Antiguas | Actual | Antiguas |
| --- | --- | --- | --- |
| T-001 | T-001 | T-012 | T-044 |
| T-002 | T-002, T-003 (sin la suma) | T-013 | T-045 |
| T-003 | T-006 a T-008 | T-014 | T-046 |
| T-004 | T-009 | T-015 | T-047, T-048 |
| T-005 | T-010 | T-016 | T-049, T-050, T-053 a T-057, T-059, T-060 |
| T-006 | T-012, T-023 | T-017 | T-061, T-066 |
| T-007 | T-013 a T-019 | T-018 | T-062, T-063, T-065, T-067 |
| T-008 | T-020 a T-022 | T-019 | T-068, T-069 |
| T-009 | T-011, T-024 a T-027, T-031 a T-033, T-051, T-052, T-058 | T-020 | T-003 (suma), T-004 |
| T-010 | T-028 a T-030, T-034 a T-040 | T-021 | T-070 |
| T-011 | T-041 a T-043 | T-022 | T-064, T-072 |
| Retiradas (D-025) | T-005, T-071 (aprobar con firma) | | |

## Escalados

Tareas que han subido de nivel de modelo o de esfuerzo, y por qué (`docs/EQUIPO.md`).

| Tarea | De | A | Motivo |
| --- | --- | --- | --- |
