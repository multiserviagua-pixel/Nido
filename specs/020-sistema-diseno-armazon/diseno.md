# 020 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (dos vueltas en `dictamen-diseno.md`: la primera, 0 bloqueantes, 9 mayores y 11 menores; la segunda, 0 bloqueantes, 1 mayor nuevo y 5 menores; esta versión responde a las dos y está pendiente de que el auditor la confirme) · Fecha: 13/11/2026

Especificación: APROBADA el 12/11/2026 (puerta P0). Este diseño no cambia el estado de la función. Ninguna prueba citada aquí se ha ejecutado: el diseño dice qué prueba habrá, no que pasa.

Versión corregida el 13/11/2026 tras las dos vueltas del dictamen. Qué se ha hecho con cada hallazgo está en «Respuesta al dictamen», al final.

## Resumen

El sistema de diseño es un conjunto de componentes de presentación en `src/components/`, que reciben datos por propiedades y nunca los piden. Los valores visuales (color, degradado, tipografía, espaciado, radios, sombras) viven en un único archivo de variables CSS con tres juegos: tema claro, tema oscuro y colores forzados. El tema sigue la preferencia del sistema solo con CSS, sin guion ni almacenamiento. Tailwind CSS 4.3.5 genera las utilidades a partir de esa escala y de ninguna otra, y una prueba falla si aparece un valor fuera de ella. El diálogo de confirmación, el cajón del menú y los avisos temporales se apoyan en las primitivas de Radix, la única familia que superó la prueba real de V-110, aunque esa prueba solo cubrió el diálogo de alerta, con cuatro tabulaciones y en un navegador: del cajón y de los avisos no hay evidencia todavía; el resto (tabla, formulario, selector de periodo, menú) usa HTML nativo. Los gráficos usan Recharts 3.10.1 detrás de un envoltorio propio que dibuja siempre la tabla equivalente con los mismos datos. Fechas, números, textos, estados y errores salen de funciones y listas cerradas propias, sin librerías. La muestra es una ruta de la app, `/muestra`, con datos ficticios incluidos en ella, que existe en desarrollo y en preproducción y no en producción. Las pruebas son de tres clases: unitarias (Vitest, el de la fase 1), en navegador real sobre la muestra (Playwright, con `axe-core`) y manuales, hechas por una persona.

La primera tarea del plan no construye nada: repite dentro de la app, en tres motores de navegador, la prueba del foco de la primitiva elegida. Si falla, se aplica la alternativa escrita en este diseño.

## Supuestos y dependencias

### De qué depende

| De quién | Qué necesita la 020 | Estado hoy |
| --- | --- | --- |
| Fase 1, función 002 | La app Next.js 16.4 con `src/`, React 19, TypeScript, Vitest 5.1, ESLint y Prettier; la batería local (`npm run bateria`); el procedimiento de integración; la variable `ENTORNO` con sus tres valores, leída solo en `src/lib/plataforma/configuracion.ts`; `src/lib/registro/registro.ts` | Diseño de la 002 escrito el 12/11/2026, con un dictamen de seguridad de 3 bloqueantes sin corregir todavía. Puede cambiar |
| Fase 1 | Preproducción (`pre-nido.<dominio>`) para repetir allí las pruebas de red y de rendimiento | No existe. D-016 aplaza Vercel. Mientras tanto, todo se ejecuta en local sobre la compilación de producción |
| Fase 2 | Nada. La 020 no lee ni escribe datos de negocio y no usa la base de datos | — |
| Función 021 | La política de contenido (A-21), la sesión y el contenido de la cuenta del usuario. La 021 monta el armazón en `src/app/admin/` | PROPUESTA |
| Coordinación | Aplicar la nota aclaratoria del artículo 2, aprobada por el responsable el 12/11/2026. El texto vigente de la constitución (v1.0) aún no la lleva | Pendiente |

`docs/PLAN.md` dice que la fase 3 implementa cuando las migraciones de la fase 2 estén en desarrollo. La 020 no las necesita: solo necesita la app de la fase 1. Se propone a coordinación anotarlo (asunto A-7).

### Lo que la fase 1 no fija y la 020 añade

- **Pruebas en navegador.** La 002 solo trae Vitest. La 020 añade Playwright.
- **Estilos.** La 002 no trae ningún sistema de estilos. La 020 añade Tailwind CSS.
- **Pruebas de componente.** La 002 no fija entorno de DOM simulado. La 020 no lo añade: la prueba V-110 mostró que el navegador simulado se cuelga con el diálogo. Los componentes se prueban en navegador real, sobre la muestra.

### Dónde se ejecuta lo que la especificación llama «el CI»

No hay repositorio remoto ni CI (decisión del responsable en la fase 1). REQ-062 y CA-025 se leen así mientras dure: **la comprobación automática de accesibilidad se ejecuta dentro de la batería local de la función 002**, que es lo que bloquea una integración. Cuando se reactive la función 003, la misma orden pasa al CI remoto sin cambios.

Esto pide a la fase 1 una comprobación nueva en la batería y más tiempo máximo (asunto A-1).

### Qué queda condicionado a la función 002

La 020 necesita cambios en archivos de la fase 1. Según el diseño de la 002, no todos tienen la misma protección:

| Cambio | Clasificación en la 002 | Qué exige |
| --- | --- | --- |
| Comprobación «interfaz» en `scripts/bateria/comprobaciones.mjs`; duración máxima de la batería; sumas de los navegadores de prueba en `scripts/bateria/herramientas.json` | Ruta reservada | Aprobación firmada del responsable |
| Órdenes nuevas en la clave `scripts` de `package.json` | Reservada | Aprobación firmada |
| `next.config.ts` (extensión de página de la muestra) | Ruta crítica | Dictamen del `auditor-seguridad` |
| `src/lib/registro/registro.ts` (campo `referencia`) | Ruta crítica | Dictamen |
| `scripts/plataforma/comprobar-despliegue.mjs` (comprobar que la muestra no existe) | Reservada | Aprobación firmada |

Además, este diseño pide **ampliar la lista de rutas reservadas** de la 002 con los archivos que deciden el resultado de las pruebas de la 020 (ver «Protección de lo que decide el resultado» y el asunto A-12).

Tres cosas no se hacen hasta que la 002 lo permita:

1. **No se instala ninguna dependencia de la 020** hasta que la 002 cierre el hallazgo de su dictamen sobre la instalación (scripts de instalación con el entorno limitado y procedencia de cada paquete comprobada).
2. **La 020 no se despliega en producción** hasta que la comprobación posterior al despliegue de la 002 incluya, como condición para promover, que `/muestra` y `/muestra/valores` responden 404.
3. **La comprobación de accesibilidad no bloquea la integración** hasta que exista la comprobación «interfaz». Mientras tanto se ejecuta a mano en cada tarea, con evidencia, y REQ-062 figura como no cumplido.

## Piezas y responsabilidades

### Mapa de archivos

Rutas según `docs/ESQUELETO.md`. Las que no están en él se marcan **(nueva)** y se piden aprobar con este diseño.

| Ruta | Qué contiene | Agente |
| --- | --- | --- |
| `src/components/estilos/` | `valores.css` (escala y temas), `base.css` (foco, movimiento, colores forzados, texto), `combinaciones.ts` (pares de color declarados), `fuente.ts` y, si la fuente es alojada, su archivo | `disenador-ui` |
| `src/components/marca/` | Logotipo en sus variantes y la constante con el nombre del producto | `disenador-ui` |
| `src/components/iconos/` | Un componente SVG por icono y `LICENCIAS.md` | `disenador-ui` |
| `src/components/textos.ts` | Todos los textos fijos de los componentes, en español | `disenador-ui` |
| `src/components/formato/` | Fechas, números, variaciones, lectura de cifras y estados, texto de dato | `ingeniero-frontend` |
| `src/components/texto/` | `TextoDato`, `SoloLector`, `Anunciador` | `ingeniero-frontend` |
| `src/components/armazon/` | Armazón, menú, cajón, cabecera, cuenta, selector de periodo, aviso de conexión, rejilla del cuerpo, `areas.ts` | `ingeniero-frontend` |
| `src/components/cifras/`, `estado/`, `tabla/`, `graficos/`, `alertas/`, `dialogo/`, `formulario/`, `avisos/`, `estados/`, `acciones/` | Componentes base | `ingeniero-frontend` |
| `src/components/direccion/` | Estado de la vista en la dirección y constructor de rutas | `ingeniero-frontend` |
| `src/lib/errores/` **(nueva)** | `referencia.ts`, `fallo-servidor.ts` y `sin-acceso.ts` | `ingeniero-backend` |
| `src/app/muestra/` **(nueva)** | La muestra, sus datos ficticios, su inventario y sus rutas de servidor para las pruebas contrato | `ingeniero-frontend` |
| `src/app/layout.tsx` (de la fase 1) | Se amplía: estilos, fuente, plantilla del título, `viewport` sin bloquear el zum, `color-scheme` | `ingeniero-frontend` |
| `src/app/icon.svg`, `favicon.ico`, `apple-icon.png` **(nuevas)** | Icono de la pestaña | `disenador-ui` |
| `postcss.config.mjs`, `playwright.config.ts` **(nuevas)** | Configuración de Tailwind y de las pruebas en navegador | `plataforma`, `qa` |
| `next.config.ts` (de la fase 1, ruta crítica) | Se amplía: extensión de página de la muestra | `plataforma` |
| `tests/unit/diseno/` | Pruebas unitarias y de frontera de la 020. `excepciones.ts` reúne todas las listas de excepciones y `paquetes-de-cliente.ts` la lista declarada de paquetes que llegan al navegador | `qa`, `ingeniero-frontend` |
| `tests/e2e/muestra/` | Pruebas en navegador sobre la muestra. `configuracion-interfaz.ts` reúne las etiquetas de `axe`, los anchos y los temas; no admite exclusiones de reglas | `qa` |
| `tests/e2e/contrato/` | Pruebas contrato que la 020 entrega para que las ejecute cada función con sus direcciones | `qa` |
| `specs/020-sistema-diseno-armazon/propuesta-visual.md` y `propuesta-visual/` | Propuesta visual, propuestas de logotipo y validación del responsable | `disenador-ui`, orquestador |
| `specs/020-sistema-diseno-armazon/guia-revision-manual.md` | Guía de pasos para la persona que revisa | `disenador-ui`, `qa` |
| `docs/DISENO.md` (compartido) | Tabla de la escala final y sus diferencias. Solo si figura en el plan aprobado en P1 | `disenador-ui` |

La 020 **no crea ninguna ruta bajo `src/app/admin/` ni `src/app/panel/`**. Una ruta de administración sin la sesión de la 021 sería un área sin control de acceso (artículo 3). La 020 entrega las piezas; la 021 las monta.

### Reglas comunes de los componentes

1. **Solo presentación.** Un componente recibe datos y funciones por propiedades. No llama a `fetch`, no importa nada de `src/lib/supabase/`, `src/lib/oauth/`, `src/lib/licencias/` ni `src/lib/stripe/`. Lo impone una prueba (PRUEBA-008).
2. **Solo papeles de color.** Un componente usa las utilidades de los papeles (`bg-superficie`, `text-texto-secundario`), nunca un valor ni un color de la rampa.
3. **Textos fuera.** Todo texto fijo sale de `src/components/textos.ts`. Ningún componente tiene una propiedad para pintar un mensaje de error libre.
4. **Texto de dato.** Todo texto que llega como dato se pinta con `TextoDato` o pasa por `textoPlano()`.
5. **Componente de cliente solo si hace falta.** Llevan `"use client"` los que tienen interacción o estado. Los demás se pueden pintar en el servidor.
6. **Librerías confinadas.** Radix solo se importa en `dialogo/`, `armazon/CajonMenu` y `avisos/`. Recharts solo en `graficos/`. Lo impone PRUEBA-008. Así se pueden sustituir sin tocar las vistas.
7. **Nombres en español**, sin tildes ni eñes en archivos e identificadores. Los prefijos propios de las librerías se dejan (`use…`, utilidades de Tailwind).

### Valores de diseño

**Un archivo, tres capas.** `src/components/estilos/valores.css`:

| Capa | Qué define | Quién la usa |
| --- | --- | --- |
| 1. Escala | Rampas de color (neutro, acento morado, correcto, aviso, error), pasos de espaciado, radios, sombras, tamaños y alturas de texto, duraciones, degradados con nombre | Solo la capa 2 |
| 2. Papeles | Para qué sirve cada valor: `--fondo-pagina`, `--superficie`, `--texto`, `--texto-secundario`, `--borde-decorativo`, `--borde-control`, `--acento`, `--texto-sobre-acento`, `--acento-suave`, `--foco`, `--menu-fondo`, `--menu-texto`, `--menu-actual`, `--correcto`, `--aviso`, `--error`, `--serie-1` a `--serie-4`, `--degradado-menu`, `--degradado-acento`, `--degradado-grafico`… | Los componentes |
| 3. Utilidades | Bloque `@theme inline` de Tailwind que crea una utilidad por papel | Las clases de los componentes |

Los papeles se definen tres veces en el mismo archivo:

- por defecto, **tema claro**;
- dentro de `@media (prefers-color-scheme: dark)`, **tema oscuro**;
- dentro de `@media (forced-colors: active)`, **colores forzados**: cada papel pasa a un color del sistema (`Canvas`, `CanvasText`, `ButtonText`, `Highlight`, `LinkText`, `GrayText`) y cada degradado pasa a `none`. Las series de los gráficos se definen aquí de forma expresa, porque el navegador no fuerza los colores de relleno y trazo de SVG.

Consecuencias que se buscan:

- **El cambio de tema no ejecuta código.** Lo hace el navegador al cambiar la preferencia: no hay recarga ni se pierde estado (REQ-088). No hay guion en línea ni preferencia guardada (REQ-058).
- El documento declara `color-scheme: light dark`, para que los controles nativos y las barras de desplazamiento sigan el tema.
- El menú lateral es oscuro en los dos temas (REQ-002).
- Las duraciones son papeles: con `prefers-reduced-motion: reduce` valen cero y la animación del esqueleto se apaga (REQ-039).

**Formato de los valores, para que se puedan comprobar.**

- Colores: hexadecimal sRGB opaco (`#RRGGBB`). Sin transparencia en texto, fondos ni bordes.
- Degradados: `linear-gradient` entre dos o tres colores de la misma rampa o de rampas vecinas, interpolados en sRGB (el valor por defecto de CSS). Cada degradado tiene nombre y solo se usa a través de su papel.
- Espaciado: lista cerrada de pasos, múltiplos de 4 px. Las utilidades de relleno, margen y separación solo admiten esos pasos.
- Radios, sombras y tamaños de texto: listas cerradas con nombre.
- El tema por defecto de Tailwind se elimina (`--*: initial`): no existe ninguna utilidad de color, radio o sombra que no venga de la escala.

**Cómo se comprueba REQ-086 («sin valores sueltos»).** PRUEBA-005, unitaria, recorre `src/` y falla si encuentra:

- un color literal (hexadecimal, `rgb`, `hsl`, `oklch`, nombre de color) fuera de `valores.css` y de `src/app/icon.svg`;
- una clase con valor arbitrario entre corchetes;
- una utilidad de relleno, margen o separación con un paso que no esté en la lista;
- una propiedad `style` en un componente, salvo en la lista corta de excepciones escrita en la propia prueba (dimensiones calculadas, como el alto de una región de avisos);
- un `fill` o `stroke` con valor literal en un SVG de componente;
- un papel o un valor de la escala que no figure, con el mismo valor, en la tabla de `docs/DISENO.md`.

Al ser una prueba de Vitest, entra en la comprobación 3 de la batería sin cambiar su definición.

**Cómo se comprueba el contraste.**

- `combinaciones.ts` declara cada par que se usa: color de delante, color o degradado de detrás, tipo (texto, o no texto: borde de control, estado, foco, icono con significado, serie) y dónde se usa. Una lista por tema.
- PRUEBA-006, unitaria, calcula el contraste de WCAG de cada par con los valores de `valores.css`. Umbrales: 4,5:1 en todo texto, también el grande; 3:1 en lo demás. Sobre un degradado mide 33 puntos repartidos entre sus colores y toma el peor. Su salida es el «informe del comprobador de contraste» de CA-022, CA-054 y CA-057.
- PRUEBA-022, en navegador, recorre todos los estados de la muestra en los dos temas, toma de cada texto su color calculado y el del fondo opaco o degradado más cercano, y falla si algún par no está declarado. Así el informe cubre el 100 % de lo usado y no solo lo que alguien recordó declarar.

**Qué entregan las tareas del `disenador-ui`.** Este diseño no fija la paleta ni dibuja el logotipo.

| Entrega | Formato |
| --- | --- |
| Paleta de los dos temas, degradados, tipografía, espaciado, radios y sombras | `valores.css` con los valores definitivos, y `combinaciones.ts` |
| Paleta documentada, con diferencias | Tabla en `docs/DISENO.md`: papel, uso, valor inicial, valor en claro, valor en oscuro y motivo del cambio |
| Tres propuestas de logotipo, como mínimo | Por propuesta, tres SVG en `specs/020-…/propuesta-visual/logotipos/propuesta-<letra>/`: `menu-oscuro.svg`, `fondo-claro.svg` e `icono.svg` |
| Propuesta visual | `propuesta-visual.md` (opciones, motivos, contraste) y la página `/muestra/propuesta-visual`, que enseña paleta, degradados, logotipos a 16, 32 y 128 px sobre claro y oscuro, y tres vistas: Resumen de superadmin, tabla con el diálogo abierto y Resumen de cliente a 375 px, en los dos temas |
| Logotipo elegido | Componentes en `src/components/marca/` que toman el color de los papeles, y `icon.svg`, `favicon.ico` (16 y 32 px) y `apple-icon.png` |
| Catálogo de estados y textos | `estado/catalogo.ts` y `textos.ts` |
| Guía de revisión manual | `guia-revision-manual.md` |

Los SVG del logotipo solo contienen formas, degradados y un título. Sin guiones, sin referencias externas, sin imágenes incrustadas y sin texto con fuente (el nombre va en HTML junto al logotipo). PRUEBA-008 lo comprueba.

**Tipografía.** La decide la propuesta visual entre dos caminos, los dos admitidos por REQ-031: la pila sin remates del sistema, o una fuente abierta. Si es alojada: un solo archivo variable WOFF2, subconjunto latino, guardado en el repositorio con su licencia anotada y cargado con `next/font/local` (`display: 'swap'` y ajuste de métricas de la fuente de respaldo). No se usa `next/font/google`, para que la compilación no dependa de descargar nada de un tercero. Las cifras llevan `font-variant-numeric: tabular-nums`.

**Iconos.** SVG propios en `src/components/iconos/`, sin paquete de iconos. Cada icono figura en `LICENCIAS.md` con su origen: dibujado por el equipo, o copiado de un conjunto abierto con su licencia y versión. Un icono con significado lleva nombre accesible; uno decorativo lleva `aria-hidden`.

### Armazón

| Pieza | Qué hace | Requisitos |
| --- | --- | --- |
| `Armazon` | Estructura común: enlace de salto, menú, cabecera, `main` y región de anuncios. Recibe `areas`, `cuenta`, `titulo` y, si la vista lo declara, `periodo` | REQ-001, REQ-007, REQ-010, REQ-042 |
| `areas.ts` | Listas cerradas de áreas: `{clave, etiqueta, ruta, icono}`. El tipo no admite entradas desactivadas. `AREAS_SUPERADMIN`: Resumen, Clientes, Órdenes, Auditoría y Ajustes, en ese orden. Un juego de áreas de cliente para la muestra (Resumen, Actividad, Suscripción, Cuenta); el real lo fija la fase 5 | REQ-003, REQ-010 |
| `MenuLateral` | `nav` con nombre accesible. Fondo oscuro con el degradado del menú. El área actual lleva `aria-current="page"` y un indicador con forma (barra lateral y peso de letra), no solo color. Logotipo y nombre arriba | REQ-002, REQ-038, REQ-087 |
| `CajonMenu` | Con 1023 px o menos, el menú no está en el documento y un botón «Abrir menú» lo abre como diálogo modal. Escape lo cierra y devuelve el foco al botón. Elegir un área lo cierra. Si la ventana pasa a 1024 px o más con el cajón abierto, se cierra | REQ-004, REQ-035 |
| `EnlaceSaltar` | Primer elemento con foco: «Saltar al contenido». Lleva el foco a `main` | REQ-009 |
| `Cabecera` | Título de la vista como único `h1`, selector de periodo si se declara, y cuenta. Queda fija arriba; el contenedor reserva su alto con `scroll-padding-top` para que no tape el foco | REQ-005, REQ-036 |
| `CuentaUsuario` | Botón visible en todos los anchos, que abre un panel con el nombre completo de la cuenta y las acciones que le pase la 021. Sus datos llegan por propiedades desde la sesión; no lee la dirección | REQ-005, REQ-065, REQ-083 |
| `SelectorPeriodo` | Control nativo con etiqueta visible, sobre la lista cerrada de periodos que declare la vista. Junto a él, el periodo con palabras y fechas («Últimos 30 días · 14 oct – 12 nov 2026»). El valor va en la dirección; el cambio se anuncia | REQ-006 |
| `RejillaCuerpo` | Tres zonas con orden fijo en el documento: cifras, contenido (gráficos y tablas) y alertas. En anchos grandes, las alertas se colocan a la derecha sin cambiar el orden del documento | REQ-007, REQ-008, REQ-051 |
| `AvisoConexion` | Escucha los eventos de conexión del navegador. Sin conexión, muestra y anuncia «Sin conexión» y avisa a los bloques de datos para que marquen su hora de carga | REQ-060 |
| `Anunciador` | Dos regiones de anuncios (cortés y urgente) siempre presentes en el documento, y la función `anunciar()`. La usan la carga, el error, los avisos, el periodo, el orden de la tabla y la conexión | REQ-042 |

**Título del documento.** La plantilla vive en `src/app/layout.tsx`: `<título de la vista> · Nido: Agentes de Correo`. Cada vista declara su título, distinto de los demás. El reparto del nombre entre el menú y la pestaña lo confirma la propuesta visual; el nombre sale de una sola constante (REQ-005, REQ-087).

**El título no lleva datos. Pendiente de decisión del responsable (asunto A-10).** El historial del navegador guarda el título junto a la dirección y puede sincronizarlo con la cuenta del navegador. Por eso este diseño deja la opción segura: el título del documento y el `h1` solo nombran el tipo de vista («Ficha de cliente», «Órdenes»), con texto fijo de `textos.ts`. El nombre del cliente va en el cuerpo, como subtítulo, con `TextoDato`. En `src/app/admin/` y `src/app/panel/` no se usa `generateMetadata`; PRUEBA-008 lo comprueba. Si el responsable acepta por escrito que el historial guarde nombres de clientes, se cambia esta regla y nada más.

**Otros valores del armazón.** `html lang="es"` (REQ-040). El `viewport` no fija escala máxima ni impide ampliar (REQ-041). Regiones `nav`, `header` y `main` con nombre (REQ-042).

### Componentes base

| Pieza | Decisiones | Requisitos |
| --- | --- | --- |
| `TarjetaCifra` | Un grupo con nombre accesible que une etiqueta, valor, variación y periodo. El valor entra por `leerCifra()`. La valoración (favorable, desfavorable, neutra) la declara la vista; el signo y la palabra van siempre. El valor nunca se abrevia ni se corta: el tamaño de letra baja por pasos de la escala hasta que cabe | REQ-011, REQ-050, REQ-053, REQ-055, REQ-076, REQ-081 |
| `EtiquetaEstado` y `catalogo.ts` | Catálogo cerrado con clave `ámbito.estado`, una palabra o expresión, un tono de la lista (neutro, correcto, aviso, error, informativo) y un icono. Un valor fuera del catálogo da «Estado desconocido» en tono neutro. Cada función de la fase añade sus estados al catálogo en su propio diseño | REQ-012, REQ-030, REQ-038, REQ-075 |
| `Tabla`, `Paginacion`, `RegionDesplazable` | `table` nativa. Cada columna ordenable tiene un botón en su cabecera y `aria-sort`. La tabla es controlada: recibe las filas de una página, el total y el orden, y avisa de los cambios. Nunca tiene más de una página en memoria. Tamaño de página por defecto: 25. Posición con miles («Del 26 al 50 de 1.234»). Con 0 filas pinta el estado vacío. Si no cabe, se desplaza dentro de una región con nombre y foco | REQ-013, REQ-045, REQ-066, REQ-067 |
| `GraficoLineas`, `GraficoBarras`, `TablaEquivalente` | Ver «Gráficos» | REQ-014, REQ-015, REQ-052, REQ-054 |
| `ListaAlertas` | Lista. Cada alerta: gravedad con palabra de lista cerrada, momento con el formato común y, como mucho, un botón de acción. El texto de la alerta no llega como dato: llega un tipo de lista cerrada y el texto sale de `textos.ts`; si nombra a un cliente, el nombre va aparte, con `TextoDato` | REQ-016, REQ-056 |
| `DialogoConfirmacion` | Ver «Diálogo, cajón y avisos» | REQ-017, REQ-018, REQ-082 |
| `Formulario` y campos (texto, texto largo, selección, casilla, grupo de opciones, búsqueda) | Etiqueta visible y permanente; «(obligatorio)» con palabra. `noValidate`: la validación y sus mensajes son de la aplicación. Error junto al campo, unido con `aria-describedby` y `aria-invalid`, y anunciado. Al enviar con errores, el foco va al primero. No se vacía lo escrito. Un error de campo que devuelve el servidor llega como par `{campo, codigo}`, los dos de listas cerradas que declara el formulario; el texto sale de `textos.ts`. Un campo o un código desconocidos se pintan como error general del formulario, nunca como texto recibido. No se usa el control nativo de fecha, porque su texto sigue el idioma del navegador | REQ-019, REQ-020, REQ-057, REQ-080 |
| `AvisosTemporales` | Ver «Diálogo, cajón y avisos». El tipo no admite avisos de error | REQ-021, REQ-072 |
| `EstadoVacio`, `EstadoError`, `EstadoSinPermiso`, `Esqueleto`, `BloqueDatos` | Ver «Estados de cada vista» | REQ-022, REQ-023, REQ-025 a REQ-028 |
| `Boton`, `useAccion` | El texto es obligatorio y sale de `textos.ts`. Con una acción en curso, el botón lo dice con palabra («Pausando…»), se marca `aria-disabled` y un cerrojo ignora cualquier otra pulsación o Intro hasta que termina | REQ-024, REQ-074 |

Objetivos de pulsación: 24 por 24 px como mínimo en todo control (REQ-037). Foco: un único estilo de contorno, con el papel `--foco`, definido en `base.css` para todos los elementos (REQ-036).

**Nombres largos (REQ-065).** Un nombre no se recorta: se parte en varias líneas (`overflow-wrap: anywhere`). Así no hace falta ningún mecanismo para enseñar el nombre completo. Única excepción: el botón de la cuenta en la cabecera, que puede acortarlo; el nombre completo está en el panel que abre.

### Diálogo, cajón y avisos

**Primitiva elegida: Radix**, en tres paquetes: `@radix-ui/react-alert-dialog`, `@radix-ui/react-dialog` y `@radix-ui/react-toast`. Motivo: en la prueba real de V-110 fue la única familia que superó todas las comprobaciones del diálogo. React Aria no devolvió el foco en una de las dos páginas, sin causa conocida. Base UI no retuvo el foco.

| Pieza | Sobre qué | Comportamiento que fija este diseño |
| --- | --- | --- |
| `DialogoConfirmacion` | Diálogo de alerta | Título con qué va a pasar; descripción con a qué o a quién afecta y cuándo se aplica; botón de confirmar con el verbo de la acción; botón «Cancelar» siempre. El objetivo se pasa como `{nombre, distintivo}`: además del nombre, un segundo dato que lo distinga de otro con un nombre parecido a la vista (qué dato es, lo declara cada vista). El foco inicial va a «Cancelar», así Intro nada más abrir cancela. Escape cierra sin hacer nada. Alto máximo, el de la ventana; el texto y los botones se desplazan juntos dentro del diálogo |
| `CajonMenu` | Diálogo modal | El de la tabla del armazón |
| `AvisosTemporales` | Aviso temporal | Duración: 8 s (el mínimo de REQ-021 es 5). Se detiene con el puntero o el foco encima. Botón «Cerrar aviso». Los avisos se apilan sin solaparse en una región que ocupa como mucho el 40 % del alto de la ventana y se desplaza por dentro; mientras haya avisos, el contenedor reserva ese alto con `scroll-padding-bottom` para que no tapen el foco. Se anuncian en orden por la región cortés |

**El foco no se da por hecho.** Consecuencia de V-110:

1. **Primera tarea del plan: PRUEBA-011.** Antes de construir nada sobre Radix, se monta en la app una página de la muestra con el diálogo de confirmación, el cajón y un aviso, junto a una tabla, un formulario y un gráfico (la combinación en la que falló React Aria). Se prueba con teclas reales en Chromium, Firefox y WebKit. V-110 solo probó el diálogo de alerta de Radix, con cuatro tabulaciones y en un navegador: del cajón y de los avisos no hay ninguna evidencia todavía.
2. Comprobaciones: se abre con teclado, ratón y táctil; tiene nombre y descripción accesibles; el foco entra; el fondo queda inerte; Intro nada más abrir no confirma; 50 tabulaciones y 50 con Mayúsculas no sacan el foco; Escape cierra; al cerrar con Escape, con «Cancelar» y con el botón de confirmar, el foco vuelve al elemento que abrió; 0 infracciones de `axe`.
3. La misma tarea hace una primera medida de qué estilos en línea y qué elementos `style` crean Radix y Recharts con una política de contenido estricta en modo de solo informe. El inventario completo, sobre toda la muestra, lo hace PRUEBA-018 y se entrega a la 021 (ver «Fronteras con la 021»).
4. **Regla de decisión, por pieza.** El diálogo de confirmación y el cajón comparten primitiva (el diálogo de alerta de Radix depende de su diálogo): se deciden juntos. Los avisos son un paquete aparte: se deciden solos.
   - Diálogo y cajón superan todo en los tres motores: se sigue con Radix para los dos. Falla una comprobación de foco de cualquiera de los dos en algún motor: los dos pasan a la alternativa A y se repite la prueba. Si también falla, la B.
   - Los avisos fallan: solo los avisos pasan a un componente propio sobre la región de anuncios. No cambian el diálogo ni el cajón.
   - Si una pieza falla con todas sus alternativas, la tarea vuelve al arquitecto. Ningún componente se construye antes de tener esta evidencia.

| Alternativa escrita | Qué es | Por qué no es la primera |
| --- | --- | --- |
| A | El elemento nativo `dialog` con `showModal()`, sin librería. Se espera que el navegador deje inerte el fondo, cierre con Escape y devuelva el foco. **Nada de esto está comprobado.** Límite conocido: en un navegador con ventana, el tabulador puede pasar del último control del diálogo a la interfaz del propio navegador antes de volver; si esa salida cuenta como «sacar el foco» en CA-013 es una lectura que decide el responsable (asunto A-6). Si no se acepta, la alternativa A necesita un ciclo de foco propio, y deja de ser «sin código» | No está entre las candidatas verificadas en V-110. Tendría menos dependencias y ningún estilo inyectado; por eso PRUEBA-011 la mide también, aunque Radix pase |
| B | React Aria Components 1.22.1 | Fallo sin explicar en V-110; arrastra muchos más paquetes |

Los envoltorios tienen la misma interfaz con cualquiera de las tres: cambiar de primitiva no toca las vistas.

### Gráficos

**Librería: Recharts 3.10.1**, dibujo en SVG, cargada solo en el navegador y de forma diferida, dentro de un contenedor con proporción fija para que no desplace el contenido.

| Decisión | Motivo |
| --- | --- |
| Cada gráfico recibe un único conjunto de datos y pinta con él el dibujo y la `TablaEquivalente` | Los valores coinciden por construcción (REQ-015) y PRUEBA-014 lo comprueba |
| El dibujo es una imagen con nombre (`role="img"`, nombre = el título) y una descripción que remite a la tabla. **La capa de teclado de Recharts queda desactivada** | En V-110 esa capa recibía el foco pero no anunciaba ningún valor: un control con foco que no dice nada es peor que no tenerlo |
| Sin información al pasar el puntero | Ningún dato exige el puntero (REQ-014) y se evita el criterio 1.4.13. Si la propuesta visual la quiere, tendrá que cumplirlo y probarse |
| La tabla va justo después del dibujo, en un bloque desplegable nativo «Ver los datos en tabla» | Se usa con teclado, táctil y lector de pantalla |
| Título obligatorio y ejes con unidad obligatoria | REQ-014 |
| Serie principal con el papel `--serie-1` (acento). Las demás se distinguen además por el trazo (continuo, rayas, puntos) y la forma del marcador, o por la trama en las barras. Máximo, 4 series | REQ-014, REQ-038 |
| El eje de valores de las barras empieza siempre en cero; no es configurable. Un punto sin dato es un hueco: la línea no se une | REQ-054 |
| Si hay menos puntos que `minimoPuntos` (lo declara la vista), se pinta «Sin datos suficientes» en lugar del gráfico. Sin datos, el estado vacío | REQ-052, REQ-054 |
| Colores por papeles, nunca literales. Sin animación | Temas, colores forzados (REQ-043, REQ-085) y movimiento (REQ-039) |

Antes de la tarea de gráficos, el orquestador carga la skill de visualización de datos y pasa su guía en el encargo.

### Estados de cada vista

`BloqueDatos` envuelve cada bloque que depende de una fuente. Su estado es una lista cerrada:

| Estado | Qué pinta | Requisitos |
| --- | --- | --- |
| `carga` | `Esqueleto` con la forma y el alto del contenido. Se anuncia «Cargando» una sola vez. A los 10 s muestra y anuncia que tarda más de lo normal. A los 30 s cancela la petición y pasa a `error` con motivo `tarda_demasiado` | REQ-023, REQ-069 |
| `vacio` | `EstadoVacio`: qué pasa, qué hacer y, si procede, un botón | REQ-022 |
| `error` | `EstadoError`: texto fijo según el motivo, referencia y «Reintentar», que vuelve a pedir solo ese bloque sin recargar. El menú y la cabecera no dependen del bloque | REQ-026, REQ-068 |
| `datos` | El contenido, con su hora de carga guardada. Sin conexión, se añade «Datos cargados el 12 nov 2026, 08:04» | REQ-060 |

- **Datos parciales (REQ-028).** Cada fuente tiene su bloque. Si una falla, su bloque pasa a `error` con la palabra «No se ha podido cargar» y su propio reintento; los demás siguen con sus datos.
- **Sin permiso (REQ-027, REQ-077, REQ-078).** Es de la vista entera. `EstadoSinPermiso` muestra un texto genérico y un enlace al Resumen, dentro del armazón. No recibe ni pinta el nombre, el identificador ni la dirección pedida. Cómo se consigue que denegado, inexistente y área de otra fase respondan igual está en la regla V-1 de «Reglas obligatorias para las vistas».
- **Motivos de error**, lista cerrada: `sin_conexion`, `fallo_servidor`, `respuesta_no_valida`, `tarda_demasiado`, `sesion_no_valida` y `desconocido`. El texto de cada uno está en `textos.ts`. No existe forma de pasar un mensaje libre.
- **`sesion_no_valida`** solo se usa cuando falla la sesión entera (caducada, cerrada, sin segundo factor). Un bloque nunca dice «no tienes permiso» sobre un recurso concreto: eso lo diría también de un recurso que no existe. Negar un recurso es siempre el estado sin permiso de la vista entera.
- **Cinco estados (REQ-025).** El inventario de la muestra obliga a que cada vista y cada bloque los tenga.

**Acciones que cambian algo.** `useAccion` devuelve un resultado de lista cerrada:

| Resultado | Qué se muestra | Requisitos |
| --- | --- | --- |
| `hecha` | La vista relee y muestra el estado nuevo; un aviso temporal lo confirma | REQ-021 |
| `rechazada` | Mensaje fijo junto al formulario o en el diálogo; lo escrito se conserva | REQ-020 |
| `no_permitida` | «No tienes permiso para hacer esto», sin afirmar ningún cambio; la vista relee el estado real. Qué pasa después con una sesión caducada lo decide la 021 | REQ-078 |
| `incierta` | Mensaje que permanece: no se sabe si se aplicó y dónde comprobarlo, con un botón que relee el estado. No se reintenta sola. Lo escrito se conserva | REQ-073 |

**Correspondencia entre lo que responde el servidor y el resultado.** Es exhaustiva y cierra en `incierta` (artículo 3). La hace una sola función, `leerResultadoAccion()`:

| Lo que llega | Resultado |
| --- | --- |
| Respuesta bien formada que dice, de forma expresa, que la acción se aplicó | `hecha`. Es el único camino a un mensaje de éxito |
| Respuesta bien formada que dice, de forma expresa, que no se aplicó nada, con un motivo de lista cerrada y, si procede, errores de campo `{campo, codigo}` | `rechazada` |
| Respuesta bien formada que dice que la sesión no vale o que no hay permiso (incluido un 401 o un 403) | `no_permitida` |
| Cualquier otra cosa: conexión perdida, error del servidor (5xx), excepción, cuerpo que no se puede leer, resultado que no está en la lista, forma distinta de la esperada | `incierta` |
| Ninguna respuesta en 30 s | `incierta`. El botón se libera. La petición no se da por cancelada: el servidor puede haberla aplicado |

**Cada resultado pertenece a su envío.** `useAccion` numera cada envío en memoria y solo acepta la respuesta del envío en curso. Una respuesta que llega después de vencer el plazo, o cuando ya hay otro envío, no cambia lo que se muestra ni se atribuye al envío nuevo: como mucho, hace que la vista relea el estado real.

El cerrojo de `useAccion` evita el doble envío desde el navegador (REQ-074) y se suelta siempre: al llegar un resultado o al vencer el plazo. No sustituye a que el servidor ignore una repetición: eso es de cada función.

### Formatos

Todo en `src/components/formato/`, con funciones puras que valen igual en el servidor y en el navegador. No se añade ninguna librería de fechas.

| Función | Regla | Requisitos |
| --- | --- | --- |
| `formatearFechaHora(instante)` | Se piden a `Intl.DateTimeFormat` solo las partes numéricas, con localización fija `es-ES`, zona `Europe/Madrid`, calendario gregoriano y reloj de 24 horas. El texto del mes sale de la lista propia: ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic. Resultado: `12 nov 2026, 08:04`. No se usa la localización del navegador ni los nombres de mes del motor | REQ-047, REQ-049, REQ-079, REQ-080 |
| Hora repetida | Si el instante una hora antes o una hora después da la misma fecha y hora de Madrid, el instante está en la hora que se repite: el primero lleva «(hora de verano)» y el segundo «(hora de invierno)» | REQ-049 |
| `formatearFecha`, `formatearPeriodo`, `diaDeMadrid` | Misma base. Para el selector de periodo y para agrupar por día | REQ-006 |
| `formatearNumero(valor, decimales)` | Implementación propia: punto cada tres cifras, también en cuatro («1.234»); coma decimal. No se usa `Intl.NumberFormat`, que en español no agrupa los números de cuatro cifras | REQ-048 |
| `formatearPorcentaje` | Número, espacio que no se parte (U+00A0) y «%»: «28,4 %» | REQ-048 |
| `calcularVariacion(actual, anterior, anteriorCompleto)` | Con periodo anterior completo y distinto de cero: porcentaje con «+» o «−» (U+2212). Con anterior igual a cero: diferencia absoluta con signo, sin porcentaje. Sin periodo anterior completo: «Sin datos para comparar». Variación nula: «0 %» con «Sin cambios» | REQ-053, REQ-055 |
| `leerCifra(valor, {minimo})` | Devuelve un número o «ausente». Ausente, no numérico, no finito o por debajo del mínimo: «Sin datos», también como texto accesible. Cero es «0» | REQ-050, REQ-076 |
| `leerEstado(ambito, valor)` | Devuelve una clave del catálogo o `desconocido` | REQ-075 |
| `IndicacionHorario` | Texto «Horas en horario de Madrid», una vez por vista con fechas | REQ-049 |

La zona horaria depende de los datos del navegador y de Node. Un navegador con datos antiguos podría fallar si cambian las reglas del cambio de horario. Se acepta.

### Texto literal, errores, dirección y almacenamiento

**Texto que llega como dato (REQ-056, REQ-071).**

- `TextoDato` pinta la cadena como nodo de texto dentro de `bdi`. React la escapa. El elemento aísla la dirección del texto.
- `textoPlano(cadena)` es para donde no cabe un elemento: nombres accesibles, texto de SVG y anuncios. El título del documento no lleva datos (ver «Armazón»). Quita, y solo de lo que se pinta:
  - los caracteres de control (categoría Unicode Cc);
  - **toda la categoría Unicode Cf (caracteres de formato), salvo U+200C y U+200D.** Se quita por categoría y no por lista, para no dejar huecos. Incluye los de dirección (U+061C, U+200E, U+200F, U+202A a U+202E, U+2066 a U+2069), los invisibles (U+00AD, U+180E, U+200B, U+2060 a U+2064, U+FEFF) y los de etiqueta (U+E0001 y U+E0020 a U+E007F). Consecuencia aceptada: las pocas banderas que se forman con caracteres de etiqueta dejan de verse;
  - los separadores de línea y de párrafo, U+2028 y U+2029.

  No toca U+200C ni U+200D, que unen letras y emojis. `TextoDato` la aplica también.
- Ningún componente construye un `href`, un `src` ni un atributo de evento con un dato. Las direcciones salen de `rutas.ts`.
- **Límite de este control.** Next.js escribe guiones en línea propios, y sin `proxy` no hay valores de un solo uso para la política de contenido. Si la 021 no logra una política estricta, este escapado es el control principal contra la ejecución de código. Por eso se pide dictamen sobre `TextoDato` y `textoPlano` aunque no estén en una ruta crítica.
- `dangerouslySetInnerHTML` ya está prohibido por el análisis estático de la 002.
- Los datos de prueba con caracteres de dirección se escriben con secuencias de escape, no con el carácter, porque el análisis estático de la 002 los rechaza en el código.

**Campos de más (REQ-075).** Las funciones de lectura toman uno a uno los campos conocidos. Un componente no recibe ni reparte el objeto de una respuesta. «No se muestran en ningún sitio» incluye lo que no se pinta pero viaja: el HTML crudo, la carga serializada que un componente de servidor pasa a uno de cliente y las respuestas de navegación (regla V-2).

**Errores sin datos internos y referencia opaca (REQ-057).**

- `EstadoError` y los mensajes de acción solo aceptan un motivo de la lista y una referencia. No hay propiedad para un mensaje, una traza ni un valor.
- **Formato exacto de la referencia:** una letra de origen, un guion y 10 caracteres de un alfabeto sin letras dudosas. `S-` si la creó el servidor, `N-` si la creó el navegador. Expresión: `^[SN]-[0-9A-HJKMNP-TV-Z]{10}$`.
- `src/lib/errores/referencia.ts`: `crearReferencia(origen)` usa el generador criptográfico. No deriva de la hora, del usuario, del recurso ni del error. `leerReferencia(valor)` devuelve la referencia solo si cumple el formato exacto; si no, la descarta.
- **La referencia se valida en los dos extremos.** El navegador pasa por `leerReferencia` todo lo que recibe como referencia antes de pintarlo: si no encaja, lo descarta y pinta una `N-` creada allí. El servidor valida el formato antes de escribirla en el registro: lo que no encaja no se escribe. Así el campo no puede transportar un mensaje interno hacia la pantalla ni un valor recibido hacia el registro.
- **Nunca se usa `error.digest`** de Next.js ni ningún otro valor derivado del error: es una huella del error, no un valor al azar.
- `src/lib/errores/fallo-servidor.ts`, solo de servidor: `registrarFallo(codigo)` crea una referencia `S-`, escribe una línea con el código (lista cerrada) y la referencia a través de `registro.ts`, y devuelve `{motivo, referencia}`. Es lo único que viaja al navegador. Con la referencia se encuentra esa línea. PRUEBA-008 comprueba que ningún módulo de cliente llega a este archivo.
- Límites que se declaran, sin resolver aquí (asunto A-2): solo se localizan en los registros los fallos que pasan por `registrarFallo`. Un fallo que detecta el navegador (sin conexión, plazo de 30 s, respuesta no válida) y un error del servidor que nadie capturó llevan una referencia `N-`, que no está en los registros del servidor. Y `registro.ts` tiene que admitir el campo `referencia` con ese formato exacto, que es un cambio de la fase 1.

**Dirección de la página (REQ-059, REQ-083).** `src/components/direccion/`:

- `estado-direccion.ts` lee y escribe los parámetros con un esquema por vista. Solo admite: enteros acotados (`pagina`), valores de listas cerradas (`orden`, `periodo`, filtros de lista) e identificadores con el formato fijado abajo. Lo que no encaja se ignora y vuelve el valor por defecto. Un parámetro que el esquema no declara no se lee ni se conserva.
- El tipo no admite texto libre: no hay forma de llevar una búsqueda a la dirección de la página. `CampoBusqueda` guarda lo escrito en memoria. Que tampoco viaje en la dirección de una petición es la regla V-3.
- **Formato de identificador:** UUID en minúsculas, 36 caracteres, con esta expresión exacta: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`. Es el tipo de las claves de `docs/MODELO-DATOS.sql`; si la fase 2 lo cambia, se cambia aquí.
- `rutas.ts` construye las direcciones internas a partir de una lista cerrada de plantillas. Un identificador solo se inserta si cumple el formato exacto; si no, devuelve la dirección del Resumen. Con ese formato no puede entrar una barra, un punto, un espacio ni un carácter codificado, así que un dato no puede llevar a otra ruta.
- El armazón no lee la dirección para saber quién es el usuario ni qué cliente se muestra: lo recibe de la sesión, por propiedades.
- Un identificador en la dirección solo elige qué se pide; el permiso lo decide el servidor. La ruta con identificador de cliente no se usa en ninguna vista hasta que coordinación aplique la nota aclaratoria del artículo 2.

**Almacenamiento del navegador (REQ-058).** Lista de preferencias de presentación que se guardan: **ninguna**. El tema sigue al sistema, el cajón no recuerda su estado y el tamaño de página es fijo. La 020 no usa `localStorage`, `sessionStorage`, IndexedDB, caché de aplicación ni servicio en segundo plano, y no crea cookies.

Hay dos almacenes que el navegador llena por su cuenta y que también cuentan:

- **El historial**, que guarda dirección y título. La dirección no lleva nombres (REQ-059) y el título tampoco (opción segura, asunto A-10).
- **La caché HTTP.** Las respuestas con datos no deben quedar guardadas: regla V-4.

**Conexiones fuera del dominio propio (REQ-032).** Lista de servicios de datos declarados por la 020: **vacía**. Fuente, iconos, estilos y guiones salen del propio dominio. Si una función posterior necesita que el navegador hable con otro dominio, lo declara en su diseño.

### Muestra de componentes

**Qué es.** Rutas de la propia app bajo `/muestra`, sin sesión y sin datos reales:

| Ruta | Contenido |
| --- | --- |
| `/muestra` | Índice generado a partir del inventario |
| `/muestra/componentes/<componente>/<estado>` | Un componente en un estado. Dirección estable para las pruebas |
| `/muestra/<juego>/<vista>/<estado>` | El armazón con las áreas de `superadmin` o de `cliente` y una vista de ejemplo (resumen, tabla, ficha con formulario) en uno de los cinco estados |
| `/muestra/<juego>/<lo que sea>` | Una dirección que no existe dentro del armazón: mismo resultado que sin permiso |
| `/muestra/valores` | La escala pintada desde `valores.css` |
| `/muestra/propuesta-visual` | La propuesta para el responsable |
| `/muestra/servidor/<caso>` | Vistas que se pintan en el servidor en cada petición, con una fuente ficticia de servidor en lugar de la base de datos. Existen para que las pruebas contrato tengan un camino real de servidor: recurso permitido (con campos de más), recurso denegado, recurso inexistente, dirección de un área que no existe, error interno y búsqueda enviada en el cuerpo |

- `src/app/muestra/inventario.ts` es la lista cerrada de componentes, vistas y estados. De ella salen el índice, las rutas (un valor fuera de la lista da 404) y la lista que recorren las pruebas. PRUEBA-008 comprueba que coincide con el inventario de este diseño.
- Cada estado se activa por su dirección y con los controles de la página. No hace falta ningún servicio de datos ni base de datos: basta la propia app.
- `src/app/muestra/_datos/` contiene los datos ficticios y las fuentes simuladas: funciones que devuelven una promesa con un resultado y un retraso. Casos límite incluidos: nombre de 120 caracteres con y sin espacios; 999.999.999; cero; valor ausente, negativo y no numérico; estado fuera del catálogo; respuesta con tres campos de más; la batería de cadenas de CA-041; 10.000 filas generadas; instantes alrededor de los cambios de horario; series con huecos y con menos puntos que el mínimo; error con una cadena testigo en su mensaje interno.

**Cómo no tiene acceso a datos (REQ-084).**

1. Los componentes no piden datos (regla 1).
2. PRUEBA-008 falla si un archivo de `src/app/muestra/` o de `src/components/` importa algo de `src/lib/` o usa `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` o `sendBeacon`. Excepciones, las únicas y escritas en `excepciones.ts`: cualquiera puede importar `src/lib/errores/referencia.ts`; `src/app/muestra/_datos/acceso-muestra.ts`, y solo ese archivo, puede importar la función que devuelve el entorno de `src/lib/plataforma/configuracion.ts`; y las rutas de `/muestra/servidor/` pueden importar `src/lib/errores/sin-acceso.ts`. Cada página y cada acción de servidor de la muestra importan `acceso-muestra.ts`, que está dentro de la propia muestra: así todos los puntos de entrada hacen la comprobación sin que ninguno más toque `src/lib/`. Nada de `src/lib/supabase/`, `oauth/`, `licencias/` ni `stripe/`, sin excepción.
3. **Las rutas de `/muestra/servidor/` no escriben en el registro ni en la supervisión.** Son puntos de entrada públicos en preproducción y cualquiera puede activarlos. No importan `fallo-servidor.ts`: su error interno simulado se captura dentro de la propia ruta, crea la referencia con `crearReferencia` y no anota nada. Ningún error simulado se deja sin capturar, para que no llegue a la supervisión de la 002. `registrarFallo` se prueba aparte, en PRUEBA-010.
4. La muestra no lee ninguna variable de entorno salvo `ENTORNO`, y no usa ningún secreto.
5. PRUEBA-018 recorre toda la muestra y comprueba que el registro de red no tiene ninguna petición a otro dominio ni a ninguna ruta propia que no sea de `/muestra/` o un recurso estático. Las rutas de `/muestra/servidor/` hacen peticiones a la propia app, con datos ficticios; se lee que no son «peticiones de datos a un entorno» en el sentido de CA-046 (asunto A-6).

**La muestra es pública en preproducción y comparte origen con el futuro `/admin`.** Por eso:

- No toma ningún texto de la dirección, del fragmento ni de mensajes entre ventanas. De la dirección solo lee segmentos que se comparan con el inventario; lo que no está, da 404.
- Las cadenas de la batería de CA-041 son inertes: si alguna llegara a ejecutarse, lo único que haría es dejar una marca que la prueba detecta. No llaman a nada ni apuntan a ningún sitio real.
- Los datos ficticios usan nombres inventados y dominios reservados para pruebas (`example.com`, `.invalid`).
- No se indexa (cabecera de la 002). Sigue pendiente el asunto A-3.

**Cómo no existe en producción (REQ-061).** Tres controles. Los dos primeros son de la 020 y no dependen del mismo valor leído en el mismo momento; el tercero es de la 002.

| Control | Cuándo | De qué depende | Mecanismo |
| --- | --- | --- | --- |
| 1 | Al compilar | `ENTORNO`, leído en la compilación | Los archivos de ruta de la muestra se llaman `page.muestra.tsx` y `layout.muestra.tsx`. `next.config.ts` añade la extensión `muestra.tsx` a `pageExtensions` solo si `ENTORNO` es exactamente `desarrollo` o `preproduccion`. Con cualquier otro valor, o sin valor, esos archivos no son rutas y la muestra no entra en la compilación |
| 2 | En cada petición, **en cada punto de entrada** | El nombre de servidor de la petición, comparado con una lista escrita en el código; y `ENTORNO`, leído al servir | Una función común, `comprobarAccesoMuestra()`, en `src/app/muestra/_datos/acceso-muestra.ts`. Es lo primero que ejecuta cada página de la muestra y cada acción de servidor, además del `layout`. Responde como recurso inexistente salvo que el nombre de servidor esté en la lista `localhost`, `127.0.0.1` y `pre-nido.<dominio>`, **y** `ENTORNO` sea `desarrollo` o `preproduccion`. Todas las páginas se pintan en cada petición, nunca al compilar. La lista es una constante del repositorio: cambiarla pasa por revisión |
| 3 | Al desplegar | La respuesta real del despliegue | La comprobación posterior al despliegue de la 002 pide `/muestra` y `/muestra/valores` y no promueve si alguna no da 404. **Es una petición a la 002, no algo que la 020 pueda hacer**; hasta que exista, la 020 no se despliega en producción |

**Por qué no basta con el `layout`.** La guía oficial de Next.js sobre autenticación (leída por el `auditor-seguridad` el 13/11/2026) dice que un `layout` no decide si el resto de la ruta se pinta, que sus comprobaciones no se repiten al navegar dentro de la app, y que las acciones de servidor y los manejadores de ruta son puntos de entrada públicos. Con la comprobación solo en el `layout`, una petición de navegación o una llamada directa a una acción la saltarían. Por eso:

- La comprobación va en cada página y en cada acción de servidor. En el `layout` se repite, pero no se cuenta con ella.
- La muestra no tiene manejadores de ruta. PRUEBA-008 falla si aparece un archivo `route` bajo `src/app/muestra/`.
- PRUEBA-008 falla si una página o una acción de servidor de la muestra no llama a `comprobarAccesoMuestra()` como primera instrucción.
- Una acción que no supera la comprobación termina sin ejecutar nada y sin devolver datos. La forma exacta de esa respuesta la fija PRUEBA-024.
- El nombre de servidor se lee de la cabecera `Host`. No se lee `X-Forwarded-Host` ni ninguna otra cabecera que el cliente pueda poner.

- **Qué cubre cada error.** `ENTORNO=preproduccion` puesto por error en el proyecto de producción abre el control 1, pero no el 2: el dominio de producción no está en la lista. Un error en la lista del código abre el 2, pero no el 1. Para publicar la muestra hacen falta los dos errores a la vez, y aun así el control 3 lo ve.
- Los tres cierran en fallo: un valor desconocido, con mayúsculas, con espacios o abreviado no muestra nada (artículo 3).
- El nombre de servidor es un dato de la petición. Solo se compara con la lista; no se pinta, no se guarda y no se registra. Es lo mismo que hace la ruta de diagnóstico de la 002.
- En producción, `/muestra` responde con la misma página 404 que cualquier dirección inexistente.
- **No verificado**, lo fija PRUEBA-024, que va entre las primeras tareas:
  - que `pageExtensions` excluya rutas del directorio `app`: la documentación de Next.js solo lo describe para `pages`. Si no funciona en Next.js 16.4, queda el control 2 solo y se dice así al responsable: **una capa, no dos**. No se resuelve con `proxy.ts`;
  - qué nombre de servidor recibe una función en Vercel. Si no es el del dominio, el control 2 deja la muestra cerrada también en preproducción: falla hacia el lado seguro y la tarea vuelve al arquitecto.
- `ENTORNO` se lee a través de `configuracion.ts`, como exige la 002.
- `<dominio>` es un dato que la 002 tiene pendiente del responsable.
- **Dónde consta la condición «no se despliega en producción sin el control 3».** Declararla aquí no basta: el responsable tiene que verla cuando despliega. Mientras la 002 no tenga el control 3, la condición figura en tres sitios: en `plan.md` de la 020 («Entornos y despliegue»), como condición de cierre en su `verificacion.md`, y, a petición de este diseño, en la guía de operación de la 002 (apartado de despliegue) y en el texto que su orden de producción enseña antes de pedir la firma. Los dos últimos son archivos de la 002: se le piden.

**Inventario de componentes y estados.** Es el que debe coincidir con la muestra (CA-046).

| Componente | Estados |
| --- | --- |
| Armazón (áreas de superadmin y de cliente) | Menú visible; cajón cerrado; cajón abierto; cada área como actual; con y sin selector de periodo; sin conexión; nombre de cuenta de 120 caracteres; dirección inexistente |
| Cuenta del usuario | Cerrada; abierta |
| Selector de periodo | Cada periodo de la lista de ejemplo; después de cambiar |
| Tarjeta de cifra | Variación positiva; negativa; nula; valor anterior cero; sin comparación; sin dato; valor 0; 999.999.999; etiqueta larga; valoración favorable, desfavorable y neutra |
| Etiqueta de estado | Una por estado del catálogo; «Estado desconocido» |
| Tabla y paginación | Con datos; ordenada en los dos sentidos por cada columna; página primera, intermedia y última; una sola página; 0 filas; 10.000 filas; más ancha que la pantalla; nombres de 120 caracteres; carga; error |
| Gráfico de líneas | Una serie; cuatro series; con hueco; menos puntos que el mínimo; sin datos; carga; error; tabla abierta |
| Gráfico de barras | Una serie; varias; con un valor cero; menos puntos que el mínimo; sin datos; carga; error; tabla abierta |
| Lista de alertas | Cada gravedad; con acción; sin acción; acción en curso; vacía; carga; error |
| Diálogo de confirmación | Abierto; texto largo; nombre de 120 caracteres; acción en curso; resultado incierto; rechazo por permisos; ventana de poca altura |
| Formulario y campos | Inicial; enviado vacío, con errores; error del servidor en un campo; enviando; hecho; conexión perdida al enviar; cada tipo de campo, obligatorio y opcional |
| Aviso temporal | Uno; dos; cinco; texto largo |
| Estado vacío | Con acción; sin acción |
| Estado de error | Uno por motivo; reintento en curso |
| Estado sin permiso | Único (el mismo que la dirección inexistente) |
| Esqueleto | De tarjeta, tabla, gráfico y lista; aviso de carga lenta |
| Datos parciales | Una de tres fuentes falla |
| Botón | Primario; secundario; de riesgo; en curso |
| Aviso de conexión | Sin conexión; recuperada |
| Marca | Logotipo en el menú; sobre fondo claro; icono |
| Vistas de ejemplo (resumen de superadmin, tabla, ficha con formulario, resumen de cliente) | Carga; vacío; error; sin permiso; datos parciales; con datos; con la batería de cadenas en cada texto |
| Vistas de servidor (`/muestra/servidor/`) | Recurso permitido con campos de más; recurso denegado; recurso inexistente; dirección de un área que no existe; error interno; búsqueda; acción que responde con cada caso de la tabla de resultados, incluidos error del servidor, cuerpo ilegible, resultado desconocido, sesión no válida y ninguna respuesta |

### Reglas obligatorias para las vistas y pruebas contrato

La 020 no tiene vistas con datos reales, pero fija cómo deben comportarse las de las funciones 021 a 024 y las de la fase 5. Cada regla tiene una **prueba contrato** en `tests/e2e/contrato/`: la escribe la 020, recibe las direcciones como parámetro y la ejecuta cada función con las suyas. En la 020 se ejecutan contra `/muestra/servidor/`.

**V-1. Denegado, inexistente y área de otra fase responden igual (REQ-027, REQ-077).**

Lo que dice la documentación oficial de Next.js (`file-conventions/not-found` y `file-conventions/loading`, actualizadas el 06/11/2026 y leídas el 13/11/2026): si `notFound()` se llama antes de que empiece el envío por partes, la respuesta lleva el código 404; si se llama después, el código ya es 200 y no cambia. El envío por partes empieza cuando se pinta un respaldo de `loading` o de `Suspense`. Con la opción Cache Components el código queda en 200 aunque la comprobación sea lo primero. Una dirección que no corresponde a ninguna ruta la atiende el `not-found` de la raíz, fuera del armazón.

De ahí, un único mecanismo, obligatorio:

1. **Una sola función.** `src/lib/errores/sin-acceso.ts` exporta la función que responde «sin acceso». La llaman los tres casos y nadie responde de otra forma. No recibe el motivo, el nombre ni el identificador.
2. **La decisión va antes de empezar a responder.** La página espera a saber si el recurso existe y está permitido antes de devolver nada. En `src/app/admin/` y `src/app/panel/` no hay archivos `loading`, y no hay ningún `Suspense` en sus plantillas ni por encima de esa decisión. Los esqueletos de los bloques van por debajo.
3. **Una sola consulta, con la sesión del usuario.** Denegado e inexistente son el mismo resultado: cero filas. El código no puede distinguirlos, y el tiempo tampoco.
4. **Un único `not-found` por dashboard**, en la raíz de `src/app/admin/` y de `src/app/panel/`, que pinta `EstadoSinPermiso` dentro del armazón. Ningún `not-found` anidado.
5. **Una ruta comodín por dashboard** que llama a la misma función. Sin ella, un área de otra fase la atendería el `not-found` de la raíz, con otro contenido.
6. **Ningún metadato depende del recurso.** Coincide con la regla del título.
7. **Cache Components no se activa.**

**Código de respuesta.** Con esas condiciones, la documentación da **404 en los tres casos** en una carga completa. No está probado, y no se ha podido verificar qué código llevan las respuestas de navegación dentro de la app. Por eso lo que se fija como obligatorio es la igualdad: **los tres casos responden con el mismo código, las mismas cabeceras y el mismo cuerpo, en carga completa y en navegación**. El código esperado es 404. Si la prueba contrato demuestra que en algún modo no se puede obtener el 404 en los tres, se fija para los tres el código que sí se pueda igualar, se anota, y la tarea vuelve al arquitecto. Nunca se deja un caso con un código distinto de los otros dos, y nunca se usa 403.

PRUEBA-008 falla si en esos dos árboles hay un archivo `loading`, un `not-found` anidado o un `generateMetadata`. La prueba contrato es PRUEBA-034.

**V-2. Al navegador solo viaja lo que se ha leído (REQ-075, REQ-027, REQ-057).** Un componente de servidor no pasa a uno de cliente el objeto de una respuesta, de una fila ni de un error: pasa los campos que ha leído, uno a uno. Las pruebas no miran solo el documento pintado: buscan la cadena testigo en el cuerpo de todas las respuestas registradas, incluidos el HTML crudo, la carga serializada y las respuestas de navegación.

**V-3. Lo que escribe el usuario viaja solo en el cuerpo (A-15, REQ-059).** Ningún texto escrito por el usuario (búsqueda, nombre, correo, cualquier campo) va en la dirección de ninguna petición: ni en la ruta ni en la cadena de consulta. Va en el cuerpo de una petición `POST`. Los registros de la plataforma guardan la dirección pedida; el cuerpo, no. Prueba contrato: PRUEBA-035.

**V-4. Las respuestas con datos no se guardan en la caché del navegador (REQ-058).** Toda respuesta con datos de negocio lleva `Cache-Control: no-store`. Lo comprueba PRUEBA-034 en cada vista.

**V-5. El título y el `h1` solo nombran el tipo de vista.** Pendiente de la decisión del responsable (asunto A-10).

**V-6. Nada de texto libre del servidor en pantalla.** Motivos de error, errores de campo, tipos de alerta y resultados de acción son códigos de listas cerradas; el texto lo pone `textos.ts`.

**V-7. Las acciones siguen la tabla de `leerResultadoAccion()`**, sin excepciones por vista.

### Protección de lo que decide el resultado

Una comprobación que se puede rebajar sin que nadie lo vea no protege (artículo 14). La configuración que decide el resultado de las pruebas de la 020 se concentra en cinco archivos:

| Archivo | Qué decide |
| --- | --- |
| `playwright.config.ts` | Qué pruebas se ejecutan, en qué navegadores y con qué reintentos (ninguno) |
| `tests/e2e/muestra/configuracion-interfaz.ts` | Etiquetas de `axe`, anchos y temas, **y la única llamada a `axe`**: exporta la función que recorre un estado y falla si hay alguna infracción. No recibe parámetros para excluir una regla, un elemento ni un resultado. Es el único archivo que importa `@axe-core/playwright` |
| `src/app/muestra/inventario.ts` | Qué estados existen y, por tanto, cuáles se comprueban |
| `tests/unit/diseno/excepciones.ts` | Las excepciones de `style`, de importaciones y de valores |
| `tests/unit/diseno/paquetes-de-cliente.ts` | Qué paquetes pueden llegar al navegador |

Tres controles. Los dos primeros están condicionados a la 002; el tercero, no:

1. **Los cinco archivos pasan a ser rutas reservadas** de la 002: un cambio en ellos solo entra con la aprobación firmada del responsable. Se pide expresamente como ampliación de su lista (asunto A-12).
2. **La comprobación «interfaz» compara con `main`** y falla si baja el número de estados del inventario, el de pruebas en navegador ejecutadas o el de recorridos de `axe`, salvo que el cambio lleve firma.

3. **Comprobación estática de los archivos de prueba**, que no depende de la 002 porque es una prueba unitaria (PRUEBA-036). Falla si en `tests/e2e/` o en `tests/unit/diseno/`, fuera de esos cinco archivos, aparece: una importación de `axe`; una prueba saltada, aislada o marcada como fallo esperado (`skip`, `only`, `fixme`, `fail`); un filtro sobre la lista de infracciones; o una desactivación de reglas.

**Lo que esto no cubre.** Los cinco archivos no son todo: una aserción relajada dentro de un archivo de prueba (comparar menos, aceptar más) no baja ninguna cuenta ni la ve la comprobación estática. Eso solo lo ve la revisión del `revisor`, y se dice así.

Mientras la 002 no aplique los controles 1 y 2, lo que hay es el control 3 y la revisión del `revisor`. Es más débil y se dice así.

### Fronteras con la 021

La 020 no define la política de contenido (A-21). Lo que le da y lo que le pide:

- **Le da:** ningún guion en línea propio (el tema no lo necesita); ningún recurso de terceros; ninguna conexión del navegador fuera del dominio; un inventario medido, sobre toda la muestra y no solo sobre la página de primitivas, de los estilos en línea y elementos `style` que crean Radix y Recharts (PRUEBA-018).
- **Lo que ya se sabe:** el diálogo de Radix depende de `react-remove-scroll` (registro de paquetes, 13/11/2026), que a su vez depende de `react-style-singleton`. Recharts pone estilos en línea en su SVG. No se ha comprobado si una política estricta los bloquea; lo dirán PRUEBA-011 y PRUEBA-018.
- **Aviso para la 021:** la 002 prohíbe `proxy.ts`, porque se ejecutaría fuera de `fra1`. La guía oficial de Next.js (leída el 13/11/2026) solo aplica valores de un solo uso desde `proxy`; sin él propone `'unsafe-inline'` o una opción experimental por huellas. Además, Next.js escribe guiones en línea propios en cada página. Si la política no puede prohibir el código en línea, el escapado de la 020 (`TextoDato`, `textoPlano`, `rutas.ts`) pasa a ser el control principal contra la ejecución de código, no el segundo. La 021 tendrá que decidir con eso delante. Si su política no admite estilos inyectados, la 020 aplica la alternativa A del diálogo.
- **Segundo aviso para la 021:** lo que vale para la muestra vale para la sesión. Una comprobación de sesión hecha solo en el `layout` de `src/app/admin/` no protege las páginas al navegar ni las acciones de servidor ni los manejadores de ruta: cada uno es un punto de entrada y debe comprobar la sesión por sí mismo.
- **Le pide:** montar `Armazon` en `src/app/admin/`, con las áreas de `areas.ts` y la cuenta sacada de la sesión, y cumplir las reglas V-1 a V-7.

## Contratos

Esta función **no cambia `contratos/`**: no toca ninguna herramienta del conector ni el informe.

Fija, con listas cerradas y pruebas, seis formas internas de la interfaz: el estado de un bloque de datos, el motivo de un error, el resultado de una acción, el error de campo `{campo, codigo}`, el formato de la referencia y los parámetros admitidos en la dirección. Ninguna acepta un identificador de cliente para decidir un permiso. Fija también las reglas V-1 a V-7 para las vistas, con sus pruebas contrato.

## Datos

No hay tablas, columnas, políticas, funciones ni migraciones. La 020 no lee ni escribe en la base de datos y no ha necesitado `docs/MODELO-DATOS.sql`. No guarda nada en el navegador.

Vuelta atrás (artículo 11), al no haber datos:

| Qué se revierte | Cómo | Cómo se prueba |
| --- | --- | --- |
| Un despliegue de interfaz | La orden de vuelta atrás de la 002, que devuelve el dominio al despliegue anterior sin compilar. No hay nada que migrar: la interfaz no deja estado en el navegador y los parámetros desconocidos de una dirección se ignoran, así que un enlace de la versión nueva no rompe la anterior | PRUEBA-033, en preproducción cuando exista |
| Un cambio de valores de diseño | Los valores viven en `valores.css`, y su tabla en `docs/DISENO.md` cambia en el mismo commit (lo obliga PRUEBA-005). Se revierte ese commit por el procedimiento de integración y se despliega. La batería vuelve a medir escala, contraste y accesibilidad sobre los valores restaurados | PRUEBA-033, en local |
| La primitiva o la librería de gráficos | Están confinadas en sus envoltorios; se sustituyen sin tocar las vistas | PRUEBA-008 impide que se usen fuera |

## Flujo

### Orden del trabajo

1. **Preparar.** Solo cuando la 002 haya cerrado su hallazgo sobre la instalación de dependencias: instalar las de la 020, anotar las sumas de los navegadores de prueba y dejar funcionando la orden de pruebas en navegador. Los cambios reservados de la fase 1 los firma el responsable y los críticos llevan dictamen (ver «Qué queda condicionado a la función 002»).
2. **PRUEBA-011: primitivas dentro de la app.** Si falla, alternativa A o B. Sin esta evidencia no se sigue.
3. **PRUEBA-024: la muestra no existe con `ENTORNO=produccion`.**
4. **Base sin decisiones visuales:** mecanismo de valores con los valores iniciales de `docs/DISENO.md`, formatos, texto de dato, referencia, dirección, y los componentes mínimos para tres vistas.
5. **Propuesta visual.** El `disenador-ui` entrega paleta, degradados, tres logotipos o más y tres vistas. El orquestador le pasa en el encargo la guía de las skills de diseño, porque el agente no puede cargarlas.
6. **Validación del responsable**, escrita y con fecha, en `propuesta-visual.md`. Elige el logotipo. **Hasta que conste, no empieza ninguna tarea de vistas** (CA-055). Si pide cambios, se vuelve al paso 5. El visto bueno que el responsable dio el 13/11/2026 a un boceto de la página Resumen («Sí, sigue así») orienta la propuesta, pero no es esta validación: faltan la paleta, los degradados, el logotipo y las tres vistas.
7. **Resto de componentes y muestra completa**, con los valores validados.
8. **Pruebas automáticas completas** y medición de laboratorio.
9. **Aviso al responsable** para la revisión manual (REQ-063), con la guía. La hace él o quien designe. Mientras no esté hecha, CA-026, CA-035 y las partes manuales de los demás figuran como «no ejecutada».
10. Revisión, verificación y cierre, según el ciclo.

### Una vista en uso

1. La vista pinta el armazón y un `BloqueDatos` en `carga` por cada fuente. Se anuncia «Cargando» una vez.
2. Llega la respuesta. La vista la lee con las funciones de lectura. Con datos, pasa a `datos` y guarda la hora. Sin filas, a `vacio`.
3. El usuario cambia periodo, orden o página: cambia la dirección, se anuncia y se vuelve a pedir.

### Cuando algo falla

| Fallo | Qué ocurre |
| --- | --- |
| Red caída, error del servidor o respuesta que no se puede leer | El bloque pasa a `error` con su motivo, referencia y reintento. Ninguna cifra se pinta como cero ni se deja un valor anterior como actual |
| La carga tarda | Aviso a los 10 s; error con reintento a los 30 s |
| Falla una de varias fuentes | Solo ese bloque pasa a `error` |
| Sin permiso, recurso inexistente o área de otra fase | `EstadoSinPermiso`, el mismo en los tres casos |
| Se pierde la conexión | «Sin conexión», anunciado; los datos visibles muestran su hora de carga |
| Se pierde la conexión después de enviar una acción | Resultado `incierta`: no se afirma nada y no se reintenta sola |
| Tras enviar una acción llega un error del servidor, un cuerpo ilegible o un resultado desconocido, o no llega nada en 30 s | Resultado `incierta`; el botón se libera; lo escrito se conserva |
| El servidor rechaza por permisos, o la sesión ya no vale | Resultado `no_permitida`: mensaje fijo; la vista relee |
| Llega como referencia algo que no cumple su formato | Se descarta y se pinta una referencia creada en el navegador |
| La suma de un navegador de prueba no coincide con la anotada | La comprobación «interfaz» falla sin ejecutar nada |
| Valor de estado desconocido, cifra ausente o imposible | «Estado desconocido» en tono neutro; «Sin datos» |
| La fuente no carga | El texto se ve desde el principio con la de respaldo, con métricas ajustadas |
| `ENTORNO` ausente o desconocido, o nombre de servidor fuera de la lista | La muestra no existe |
| PRUEBA-011 falla en el diálogo o en el cajón | Los dos pasan a la alternativa A; después a la B; después, vuelta al arquitecto |
| PRUEBA-011 falla solo en los avisos | Solo los avisos pasan a un componente propio |
| La prueba contrato no logra el mismo código en los tres casos de «sin acceso» | La tarea vuelve al arquitecto; no se integra ninguna vista con códigos distintos |
| El responsable no valida la propuesta visual | No se construyen vistas |

## Amenazas de esta función

Propuesta del arquitecto, corregida con las filas que pidió el `auditor-seguridad` en sus dos vueltas; pendiente de que confirme la última corrección. De `docs/SEGURIDAD.md` aplican A-10, A-15, A-16, A-19 y A-21 (esta última, en la parte que no es de la 021).

| Amenaza | Control | Prueba que lo demuestra |
| --- | --- | --- |
| Un texto que llega como dato se interpreta como marcado, enlace o código (A-21) | `TextoDato` y `textoPlano`; ningún atributo de dirección o de evento construido con datos; `dangerouslySetInnerHTML` prohibido por el análisis estático de la 002 | PRUEBA-004, PRUEBA-017 |
| Caracteres de dirección del texto cambian lo que dice un diálogo de confirmación | `bdi` y retirada de los caracteres de control de dirección | PRUEBA-004, PRUEBA-017 |
| Un mensaje de error enseña datos internos, o la referencia revela algo | Motivos de lista cerrada, sin propiedad de mensaje libre; referencia al azar; nunca `digest` | PRUEBA-010, PRUEBA-017 |
| Lo que llega como referencia no es una referencia: un mensaje interno hacia la pantalla, o un valor recibido hacia el registro | Formato exacto validado al leerla en el navegador y al escribirla en el registro; lo que no encaja se descarta | PRUEBA-010, PRUEBA-017 |
| Una respuesta con campos de más acaba en pantalla | Lectura campo a campo | PRUEBA-014 |
| Campos de más, el nombre de un recurso denegado o un mensaje interno viajan en la carga serializada aunque no se pinten | Regla V-2; las pruebas buscan en el cuerpo de todas las respuestas, no solo en el documento | PRUEBA-017, PRUEBA-034 |
| Errores de campo del servidor o textos de alertas pintados como texto libre | Par `{campo, codigo}` y tipo de alerta, de listas cerradas; regla V-6 | PRUEBA-014, PRUEBA-015 |
| Un estado desconocido o una cifra imposible se presentan como algo favorable o como cero | `leerEstado` y `leerCifra` cierran en «Estado desconocido» y «Sin datos» | PRUEBA-003, PRUEBA-014 |
| Sin permiso y no existe se distinguen, o se filtra el nombre o el identificador del recurso | Un único componente, sin datos del recurso. En la muestra sin servidor solo se prueba el contenido | PRUEBA-016 |
| «Denegado» responde 200 porque ya se había empezado a enviar, e «inexistente» o «área de otra fase» responden 404; o difieren en cabeceras, título o tiempo | Regla V-1: una función, decisión antes de responder, una consulta, un `not-found` por dashboard, ruta comodín, sin `loading` ni metadatos del recurso | PRUEBA-008, PRUEBA-034 |
| Nombres, correos o búsquedas en la barra de direcciones | El esquema de la dirección no admite texto libre | PRUEBA-009, PRUEBA-018 |
| La búsqueda viaja en la cadena de consulta de una petición y queda en los registros de la plataforma (A-15) | Regla V-3: lo escrito va solo en el cuerpo | PRUEBA-035 |
| Un dato pasado a `rutas.ts` lleva a otra ruta (`..`, `/api/…`) | Plantillas de lista cerrada; identificador con formato exacto de UUID | PRUEBA-009 |
| Parámetros añadidos a la dirección cambian el usuario o el cliente mostrado | El armazón solo recibe la identidad de la sesión; los parámetros no declarados se ignoran. La prueba real, con sesión, es de la 021 | PRUEBA-009, PRUEBA-018 |
| Datos de negocio guardados en el navegador | No se usa ningún almacenamiento | PRUEBA-018 |
| El nombre de un cliente queda en el título y, con él, en el historial del navegador | El título solo nombra el tipo de vista (regla V-5). **Pendiente de la decisión del responsable**, asunto A-10 | PRUEBA-008, PRUEBA-034 |
| La caché HTTP del navegador guarda respuestas con datos | Regla V-4: `no-store` | PRUEBA-034 |
| Dependencia de interfaz maliciosa o vulnerable (A-19) | Árbol de ejecución declarado con su tamaño real (al menos 58 paquetes, ver «Dependencias nuevas»); lista declarada de paquetes que llegan al navegador; versiones exactas en el archivo de bloqueo; comprobación 7 de la batería; librerías confinadas en envoltorios; sin herramienta que copie código de terceros; nada se instala hasta que la 002 cierre su hallazgo sobre la instalación | PRUEBA-008, PRUEBA-037; batería de la 002 |
| Los navegadores de prueba se descargan fuera del registro de paquetes, a una carpeta fuera del repositorio, y se ejecutan en la batería | Carpeta única con ruta absoluta, fuera del repositorio y de los clones; suma anotada en `herramientas.json` de la 002 y comprobada sobre esa carpeta antes de cada ejecución. No protege la primera descarga: riesgo residual para aceptar por escrito (asunto A-11) | PRUEBA-037 |
| Tailwind ejecuta un binario nativo al compilar | Versión exacta en el archivo de bloqueo; lo cubre el control de instalación de la 002 | Batería de la 002 |
| Un recurso de terceros en tiempo de ejecución (fuente, icono, estilo, guion, analítica) | Fuente en el repositorio con `next/font/local`; iconos propios; lista de servicios externos vacía | PRUEBA-018 |
| Las librerías obligan a relajar la política de contenido de la 021 | Inventario de estilos en línea medido sobre toda la muestra; alternativa A | PRUEBA-011, PRUEBA-018 |
| La muestra queda publicada en producción | Control al compilar y control en cada petición, que no dependen del mismo valor | PRUEBA-024 |
| `ENTORNO` mal puesto en el proyecto de producción publica la muestra | El control 2 exige además un nombre de servidor de una lista escrita en el código; la comprobación de despliegue de la 002 no promueve si `/muestra` no da 404 (condicionado a la 002) | PRUEBA-024 |
| El control 2 de la muestra se salta con una petición de navegación o llamando directamente a una acción de servidor, porque un `layout` no protege el resto de la ruta | `comprobarAccesoMuestra()` como primera instrucción de cada página y de cada acción; sin manejadores de ruta en la muestra; nombre de servidor leído solo de `Host` | PRUEBA-008, PRUEBA-024 |
| Cualquiera activa en preproducción las rutas de `/muestra/servidor/` y llena el registro o la supervisión de errores simulados | Esas rutas no importan `fallo-servidor.ts` ni `registro.ts`, y capturan su error simulado | PRUEBA-008, PRUEBA-018 |
| Una respuesta que llega tarde se atribuye a otro envío y se muestra como éxito | Cada resultado se asocia a su envío; una respuesta tardía solo provoca una relectura | PRUEBA-015 |
| Un archivo de prueba filtra infracciones de `axe`, excluye reglas o salta pruebas sin bajar las cuentas | Única llamada a `axe` en un módulo reservado, sin parámetros de exclusión; comprobación estática de los archivos de prueba. Una aserción relajada solo la ve la revisión | PRUEBA-036 |
| La muestra llega a datos reales | Componentes sin acceso a datos; frontera de importaciones con tres excepciones escritas; solo lee `ENTORNO` | PRUEBA-008, PRUEBA-018 |
| La muestra, pública en preproducción y en el mismo origen que `/admin`, se usa para atacar al panel | No toma texto de la dirección, del fragmento ni de mensajes entre ventanas; cadenas de prueba inertes; dominios reservados | PRUEBA-017, PRUEBA-018 |
| Uso de la clave secreta desde la interfaz (A-10) | Componentes y muestra sin acceso a `src/lib/supabase/`; la frontera resuelve alias, importaciones dinámicas y reexportaciones | PRUEBA-008 |
| Código solo de servidor o de pruebas acaba en el navegador (`fallo-servidor.ts`, `web-vitals`) | El grafo de módulos de cliente no puede llegar a ellos | PRUEBA-008 |
| Se rebaja la comprobación de accesibilidad o las pruebas de frontera sin firma | Cinco archivos reservados y comparación con `main` (condicionado a la 002). Mientras tanto, solo revisión | PRUEBA-036 |
| Un SVG del logotipo lleva un guion o una referencia externa | Lista cerrada de elementos permitidos | PRUEBA-008 |
| Doble envío de una acción | Cerrojo de `useAccion`. El servidor debe ignorar también la repetición: lo exige cada función | PRUEBA-015 |
| Se afirma un cambio que no se sabe si ocurrió | Resultado `incierta` | PRUEBA-016 |
| Tras enviar una acción llega un error del servidor, una respuesta ilegible o desconocida, una sesión caducada o nada | Correspondencia exhaustiva que cierra en `incierta`; éxito solo con confirmación expresa; plazo de 30 s que libera el botón | PRUEBA-015, PRUEBA-016 |
| Una página de documentación o un registro de cambios da instrucciones a un agente (A-16) | Son datos. No se usa la herramienta de shadcn/ui, cuyo registro de cambios contiene textos para agentes | Revisión |
| Un agente da por validada la propuesta visual o por hecha la revisión manual | Solo cuenta la respuesta escrita del responsable y el informe de la persona; mientras tanto, «no ejecutada» | PRUEBA-028, PRUEBA-031 |

## Pruebas

Tipos: **U** unitaria (Vitest, en Node); **N** en navegador real sobre la muestra (Playwright); **A** comprobación automática de accesibilidad (`axe-core` desde Playwright); **L** medición de laboratorio; **M** revisión manual de una persona; **D** revisión documental.

Dónde se ejecutan:

| Dónde | Qué |
| --- | --- |
| Batería local, comprobación 3 (ya existe) | Todas las U |
| Batería local, comprobación nueva «interfaz» (asunto A-1) | Todas las N y las A, en Chromium, sobre la compilación de producción servida en local con `ENTORNO=preproduccion`. Tiempo máximo propuesto: 8 minutos |
| Verificación, por `qa`, en local | Las N y las A también en Firefox, WebKit y Edge; las L |
| Preproducción, cuando exista | Se repiten PRUEBA-018, PRUEBA-027 y PRUEBA-033 |
| Producción, cuando exista | La parte de PRUEBA-024 que pide la dirección real. Hasta entonces, «no ejecutada» |
| Una persona | Las M |

WebKit en Windows no es Safari. Safari de escritorio y de iOS, y Chrome en Android, los prueba una persona (PRUEBA-029 y PRUEBA-030).

| ID | Tipo | Qué demuestra | Criterios |
| --- | --- | --- | --- |
| PRUEBA-001 | U | Formato de fechas y números: los casos de CA-037, los doce meses, cero y ausente | CA-037, CA-039 |
| PRUEBA-002 | U | Hora de Madrid con el proceso en UTC, Nueva York y Tokio; los cinco instantes de CA-038; la hora repetida | CA-038 |
| PRUEBA-003 | U | Variaciones (positiva, negativa, nula, anterior cero, periodo incompleto); lectura de cifras y estados | CA-008, CA-039, CA-040, CA-051 |
| PRUEBA-004 | U | `textoPlano` con la batería de cadenas: quita los caracteres de control, toda la categoría Cf salvo U+200C y U+200D (con casos de U+2060 a U+2064 y U+180E) y los separadores de línea, y no toca el resto | CA-041 |
| PRUEBA-005 | U | 0 valores fuera de la escala; la tabla de `docs/DISENO.md` coincide con `valores.css` | CA-022, CA-055 |
| PRUEBA-006 | U | Contraste de todos los pares declarados, en claro y en oscuro; peor punto de cada degradado; foco; logotipo en sus tres variantes; un solo color de acento | CA-022, CA-027, CA-054, CA-056, CA-057 |
| PRUEBA-007 | U | Textos: una palabra por estado y ninguna repetida; 0 «Aceptar», «Sí», «Enviar», «OK», «Haz clic aquí»; 0 formas de usted; botón de confirmar con verbo | CA-009, CA-013, CA-017, CA-036 |
| PRUEBA-008 | U | Fronteras, sobre el grafo de módulos resuelto (alias, importaciones dinámicas y reexportaciones incluidos): importaciones permitidas, sin llamadas de red, Radix y Recharts solo en sus envoltorios; ningún módulo de cliente llega a `fallo-servidor.ts` ni a `sin-acceso.ts`; nada de `src/` importa `web-vitals`, Playwright ni `axe`; en `src/app/admin/` y `src/app/panel/` no hay `loading`, `not-found` anidado ni `generateMetadata` (un `Suspense` por encima de la decisión no lo detecta esta prueba: solo PRUEBA-034); bajo `src/app/muestra/` no hay ningún archivo `route`, y cada página y cada acción de servidor llaman a `comprobarAccesoMuestra()` como primera instrucción; las rutas de `/muestra/servidor/` no llegan a `fallo-servidor.ts` ni a `registro.ts`; cada icono en `LICENCIAS.md`; SVG del logotipo limpios y en sus tres variantes; inventario del diseño igual al de la muestra | CA-024, CA-046, CA-056 |
| PRUEBA-009 | U | Dirección: solo valores admitidos; texto libre imposible; parámetros de más ignorados; identificador mal formado lleva al Resumen, con `..`, `/`, `%2F`, espacios, mayúsculas y un UUID con un carácter de más | CA-044 |
| PRUEBA-010 | U | `registrarFallo` escribe una línea con la referencia y sin el mensaje interno; la referencia cumple su formato exacto y no se repite en 10.000; `leerReferencia` descarta una cadena que contiene la cadena testigo, una vacía y una con el formato casi correcto; el registro no escribe una referencia mal formada | CA-042 |
| PRUEBA-011 | N | Primitivas dentro de la app, en Chromium, Firefox y WebKit, con la lista de comprobaciones de «El foco no se da por hecho», por separado para el diálogo, el cajón y los avisos; lo mismo con el elemento nativo `dialog`; primera medida de estilos en línea. **Primera tarea** | CA-003, CA-013 |
| PRUEBA-012 | N | Armazón: menú, cabecera y cuerpo en el 100 % de las vistas; orden del menú; `aria-current`; 5 entradas exactas y 0 desactivadas; con áreas de cliente solo cambian las entradas; cajón en 320, 375 y 768 px y menú visible en 1024, 1280 y 1920 px; enlace de salto; título igual al `h1` y sin repetir; cuenta en un paso a 320 px; selector solo donde se declara y su cambio actualiza todas las cifras y se anuncia; `lang="es"`; regiones y encabezados sin saltos; orden del documento: cifras, contenido, alertas | CA-001, CA-002, CA-003, CA-004, CA-005, CA-007, CA-031, CA-033 |
| PRUEBA-013 | N | Todos los estados en 320, 375, 414, 768, 1024, 1280, 1440, 1920 y 2560 px sin desplazamiento horizontal; ancho máximo en 1920 y 2560; 375 por 667 en vertical y horizontal; ventana de 640 y de 320 px (zum al 200 % y al 400 % sobre 1280); espaciado de texto de la norma inyectado; el zum no está bloqueado; diálogo a 568 por 320 y a 320 por 256; 999.999.999 completa a 320; nombre de 120 caracteres sin solapes | CA-006, CA-032, CA-049, CA-050, CA-053 |
| PRUEBA-014 | N | Tarjeta en todas sus variantes y su nombre accesible; cada estado con su palabra; estado desconocido; tres campos de más que no aparecen; tabla: orden con teclado, ratón y táctil, `aria-sort`, posición con miles, 0 filas, 10.000 filas; gráficos: título, unidades, 100 % de los valores en la tabla, barras desde cero, hueco, «Sin datos suficientes», nada exige el puntero; alertas | CA-008, CA-009, CA-010, CA-011, CA-012, CA-039, CA-051 |
| PRUEBA-015 | N | Diálogo (qué, a qué, cuándo; foco; Escape; Intro); formulario (etiquetas, obligatorio con palabra, errores, foco al primero, lo escrito se conserva); avisos con reloj simulado (8 s, pausa, cierre con teclado, 2 y 5 sin solapes ni foco tapado); dos pulsaciones en menos de 300 ms e Intro repetido dan 1 envío; rechazo por permisos; error de campo del servidor con un campo o un código desconocidos: se pinta el error general y no el valor recibido; acción cuya respuesta es un error del servidor, un cuerpo ilegible, un resultado desconocido, una sesión no válida o ninguna: 0 mensajes de éxito, resultado `incierta` (`no_permitida` en la sesión no válida), lo escrito se conserva y el botón se libera a los 30 s; una respuesta de éxito que llega después del plazo, con y sin un segundo envío en curso: 0 mensajes de éxito, no se atribuye al segundo envío y la vista relee | CA-013, CA-014, CA-015, CA-017, CA-045, CA-052 |
| PRUEBA-016 | N | Cinco estados en cada vista y bloque; error por red, servidor y respuesta no válida, con reintento sin recargar y 0 ceros; denegado, inexistente y área de otra fase idénticos en texto y en árbol de accesibilidad, sin el identificador en el documento en ningún momento de la carga; una de tres fuentes falla; fuentes vacías: 0 cifras; esqueleto anunciado una vez; aviso a los 10 s y error a los 30 s; sin conexión; acción incierta por conexión perdida. Sobre la muestra sin servidor solo compara contenido; el código de respuesta lo prueba PRUEBA-034 | CA-016, CA-018, CA-019, CA-020, CA-021, CA-040, CA-045, CA-048 |
| PRUEBA-017 | N | Batería de cadenas en cada texto: 0 ejecuciones, 0 elementos o enlaces creados, texto literal, texto vecino sin alterar, en cuerpo, título, diálogos, avisos, alertas, gráficos, tabla equivalente y nombres accesibles; cadena testigo de un error interno, de un campo de más y puesta en el lugar de la referencia: 0 apariciones en el documento **y en el cuerpo de todas las respuestas registradas** (HTML crudo, carga serializada, respuestas de navegación), usando las vistas de `/muestra/servidor/`; referencia con formato válido en el 100 % de los errores; ninguna cadena de la batería deja su marca | CA-041, CA-042, CA-051 |
| PRUEBA-018 | N | Registro de red de toda la muestra: 0 peticiones a otros dominios y 0 a rutas propias fuera de `/muestra/` y de los recursos estáticos; almacenamiento del navegador vacío; dirección sin nombres, correos ni texto escrito; parámetros de usuario o cliente añadidos no cambian nada; un texto puesto en la dirección, en el fragmento o enviado como mensaje entre ventanas no aparece en la página; inventario de infracciones de una política de contenido estricta en modo de solo informe, sobre todos los estados; tras activar todas las vistas de `/muestra/servidor/`, incluido el error interno, 0 líneas nuevas en el registro y 0 envíos a la supervisión (con el envío sustituido por un contador en la prueba) | CA-024, CA-043, CA-044, CA-046 |
| PRUEBA-019 | N | Con el navegador en inglés, el texto de cada estado es idéntico al obtenido en español y los mensajes de validación son los de la aplicación; con el navegador en UTC, Nueva York y Tokio, las horas son las de Madrid; «Horas en horario de Madrid» una vez por vista con fechas | CA-014, CA-036, CA-038 |
| PRUEBA-020 | N | Cambio de tema con una vista abierta: sin recarga y con el estado intacto (formulario escrito, tabla ordenada, cajón abierto); colores forzados: 0 degradados calculados y bordes presentes; movimiento reducido: 0 animaciones en curso; ninguna animación repite más de 3 veces por segundo; fuente bloqueada: texto visible en el primer pintado; 1.111 y 8.888 con el mismo ancho. Genera capturas en grises y en colores forzados para la revisión manual | CA-023, CA-030, CA-034, CA-054, CA-057 |
| PRUEBA-021 | N | Solo con teclado se completa cada acción de la muestra; el foco tiene contorno en todos los elementos; nunca queda retenido fuera de un diálogo o del cajón; nunca queda tapado por completo; medida de cada objetivo de pulsación | CA-027, CA-028 |
| PRUEBA-022 | N | Todo par de colores usado en la muestra, en los dos temas, está declarado en `combinaciones.ts` | CA-022, CA-057 |
| PRUEBA-023 | N | Nombre y logotipo en el menú; nombre en el título del 100 % de las vistas; el logotipo tiene nombre accesible una vez donde informa y está oculto donde es decorativo; capturas a 16 y a 32 px | CA-056 |
| PRUEBA-024 | N | Control 1: compilando con `ENTORNO` igual a `produccion`, `Produccion`, `produccion` seguido de un espacio, `prod` y sin valor, el inventario de rutas no tiene ninguna de la muestra, `/muestra` y `/muestra/valores` responden igual que una dirección inexistente, y una cadena testigo de `_datos/` aparece 0 veces en la salida de la compilación. Control 2 solo: con la compilación de preproducción (control 1 abierto), una petición con el nombre de servidor de producción, con uno desconocido y sin él da 404; y con el nombre correcto pero `ENTORNO` desconocido al servir, también. Con el control 1 abierto y un nombre de servidor fuera de la lista, en cada punto de entrada: una petición de navegación a una página de la muestra da 404 y no devuelve su carga; una llamada directa a cada acción de servidor se rechaza sin ejecutar nada ni devolver datos; y una petición con el nombre de producción en `Host` y el de preproducción en `X-Forwarded-Host` da 404. Control positivo: en local y en preproducción, la muestra se ve. En producción, cuando exista: `/muestra` y `/muestra/valores` dan 404, y la comprobación de despliegue de la 002 no promueve si no | CA-046 |
| PRUEBA-025 | A | `axe-core` con las reglas de nivel A y AA de WCAG 2.0, 2.1 y 2.2, sobre el 100 % de los estados del inventario, a 320 y 1280 px, en claro y en oscuro: 0 infracciones. Lo que `axe` deja «por revisar» se lista para la revisión manual; no cuenta como superado | CA-025, CA-028, CA-057 |
| PRUEBA-026 | A | Una página con una infracción sembrada hace fallar la comprobación; además, `qa` siembra una infracción en un componente en una copia de prueba y la batería termina en rojo | CA-025 |
| PRUEBA-027 | L | Cada vista de la muestra con el procesador ralentizado 4 veces y red de 150 ms de latencia, 1,6 Mbps de bajada y 750 kbps de subida (el perfil móvil de Lighthouse): elemento principal en 2,5 s o menos, desplazamiento de 0,1 o menos, respuesta a cada interacción en 200 ms o menos, incluidos cambiar de página y de orden con 10.000 filas, la llegada de datos tras el esqueleto y la fuente bloqueada. Cinco ejecuciones por vista; se anotan la mediana y la peor (asunto A-5) | CA-010, CA-016, CA-023, CA-047 |
| PRUEBA-028 | M | Revisión manual con la guía, en los dos temas: cada criterio A y AA de WCAG 2.2; teclado; NVDA en Windows; texto al 200 %; zum al 400 %; espaciado de texto; colores forzados; movimiento reducido; pantalla en grises (estados, variaciones, series, errores, área actual, enlaces, degradados); orden visual, de foco y de lectura; lo que anuncia el lector en tarjetas, tabla, formulario, periodo y regiones; nombre largo con lector | CA-001, CA-004, CA-005, CA-008, CA-010, CA-011, CA-014, CA-026, CA-027, CA-029, CA-030, CA-032, CA-033, CA-034, CA-049, CA-054, CA-056, CA-057 |
| PRUEBA-029 | M | Móvil real con Safari en iOS y Chrome en Android, a 320 y 375 px, solo con táctil: la lista de CA-035; VoiceOver en iOS; gesto de ampliar | CA-032, CA-035 |
| PRUEBA-030 | M y N | Navegadores de REQ-089: recorrido de la muestra en las dos últimas versiones de Chrome, Edge y Firefox (automático) y de Safari (una persona) | CA-035 |
| PRUEBA-031 | D | Validación escrita del responsable de la propuesta visual, con fecha anterior a la primera tarea de vistas; al menos tres propuestas de logotipo presentadas y su elección anotada con fecha | CA-055, CA-056 |
| PRUEBA-032 | D | Revisión por el `revisor`: 0 elementos de la captura de referencia en marca, iconos y textos; ningún parecido del logotipo con esa marca; licencias anotadas; catálogo de estados y paleta documentados con sus diferencias; textos en español de España y con trato de tú | CA-009, CA-022, CA-024, CA-036, CA-056 |
| PRUEBA-033 | N | Vuelta atrás: se integra un cambio de un valor, se revierte, y escala, contraste y accesibilidad quedan en verde con los valores restaurados; en preproducción, volver al despliegue anterior deja la muestra con los estilos anteriores | Artículo 11 |
| PRUEBA-034 | N, contrato | Acceso indistinguible (V-1), con tres direcciones: denegada, inexistente y área de otra fase. En carga completa y en navegación: mismo código (se espera 404), mismas cabeceras, mismo título, mismo HTML crudo y mismo árbol de accesibilidad; la cadena testigo del nombre denegado, 0 veces en todas las respuestas; en 30 repeticiones, la mediana del tiempo no separa denegado de inexistente. Además, en cada vista con datos: `Cache-Control: no-store` (V-4) y el título sin la cadena testigo (V-5). La 020 la ejecuta contra `/muestra/servidor/`; cada función, contra sus rutas | CA-020, CA-043 |
| PRUEBA-035 | N, contrato | Lo escrito va solo en el cuerpo (V-3): con una cadena testigo escrita en la búsqueda y en cada campo, 0 apariciones en la dirección de todas las peticiones registradas, en la barra de direcciones, en el historial y en la salida de la batería | CA-044 |
| PRUEBA-036 | U y batería | Tres candidatos en una copia de prueba: excluir una regla de `axe`, quitar un estado del inventario y añadir una excepción de `style`. Los tres se rechazan sin firma, o la batería falla por bajar la cuenta respecto de `main`. **Esta parte, condicionada a la 002**: hasta que exista, figura como «no ejecutada». Parte que no depende de la 002: la comprobación estática falla con cuatro archivos sembrados (una importación de `axe` fuera de su módulo, una prueba saltada, un filtro sobre las infracciones y una regla desactivada) | CA-025 |
| PRUEBA-037 | U y batería | La lista de paquetes que alcanzan los módulos de cliente, sacada del grafo de módulos y del archivo de bloqueo, coincide con la declarada en `paquetes-de-cliente.ts`; un paquete nuevo hace fallar la prueba. Un navegador de prueba con un archivo alterado en su carpeta hace fallar la comprobación «interfaz» antes de ejecutar nada. La segunda parte, **condicionada a la 002** | A-19 |

Todos los criterios, de CA-001 a CA-057, figuran al menos en una prueba. Los que tienen parte manual no se dan por cumplidos solo con su parte automática.

## Valores que fija este diseño

| Valor | Fijado en | Requisito |
| --- | --- | --- |
| Paso de menú a cajón | 1024 px (64 rem) | REQ-004 |
| Ancho máximo del contenido | 1440 px (90 rem), sin contar el menú. Lo confirma la propuesta visual | REQ-008 |
| Duración de un aviso temporal | 8 s | REQ-021 |
| Alto máximo de la región de avisos | 40 % del alto de la ventana | REQ-072 |
| Aviso de carga lenta y paso a error | 10 s y 30 s (los de la especificación) | REQ-069 |
| Tamaño de página por defecto | 25 filas | REQ-013 |
| Series por gráfico | 4 como máximo | REQ-014 |
| Referencia de error | Letra de origen (`S` o `N`), guion y 10 caracteres al azar | REQ-057 |
| Formato de identificador en la dirección | UUID en minúsculas, 36 caracteres | REQ-059 |
| Plazo máximo de una acción | 30 s; después, resultado `incierta` | REQ-073 |
| Código de «sin acceso» | El mismo en los tres casos; se espera 404 | REQ-027, REQ-077 |
| Respuestas con datos | `Cache-Control: no-store` | REQ-058 |
| Título del documento y `h1` | Solo el tipo de vista, sin datos. Pendiente del responsable | REQ-005, REQ-058 |
| Preferencias guardadas en el navegador | Ninguna | REQ-058 |
| Servicios externos a los que se conecta el navegador | Ninguno | REQ-032 |
| Perfil de laboratorio | Procesador 4 veces más lento; 150 ms, 1,6 Mbps y 750 kbps | REQ-064 |
| Plantilla del título | `<vista> · Nido: Agentes de Correo` | REQ-005, REQ-087 |

## Cobertura de requisitos

| Requisitos | Dónde se resuelven |
| --- | --- |
| REQ-001 a REQ-010 | «Armazón» |
| REQ-011 a REQ-024 | «Componentes base», «Diálogo, cajón y avisos», «Gráficos» |
| REQ-025 a REQ-028 | «Estados de cada vista» |
| REQ-029, REQ-030, REQ-085, REQ-086, REQ-088 | «Valores de diseño» |
| REQ-031, REQ-032, REQ-033 | «Valores de diseño» (tipografía, iconos) y «Conexiones fuera del dominio propio» |
| REQ-034 | Todo el diseño; PRUEBA-025 y PRUEBA-028 |
| REQ-035, REQ-036, REQ-037 | «Armazón», «Componentes base», «Diálogo, cajón y avisos»; PRUEBA-021 |
| REQ-038, REQ-043 | Papeles con forma además de color; juego de colores forzados |
| REQ-039 | Duraciones como papeles; gráficos sin animación |
| REQ-040, REQ-041, REQ-042 | «Armazón» |
| REQ-044, REQ-045 | `RejillaCuerpo`, `RegionDesplazable`; PRUEBA-013, PRUEBA-029 |
| REQ-046, REQ-080 | `textos.ts`; formatos con localización fija; validación propia |
| REQ-047 a REQ-050, REQ-079 | «Formatos» |
| REQ-051 a REQ-055 | `RejillaCuerpo`, `TarjetaCifra`, «Gráficos», `calcularVariacion` |
| REQ-056 a REQ-060, REQ-071, REQ-075, REQ-083 | «Texto literal, errores, dirección y almacenamiento»; `AvisoConexion` |
| REQ-061, REQ-084 | «Muestra de componentes» |
| REQ-062, REQ-063 | «Dónde se ejecuta lo que la especificación llama el CI»; PRUEBA-025, PRUEBA-028; paso 9 del orden de trabajo |
| REQ-064 | PRUEBA-027; gráficos diferidos; alto reservado en esqueletos |
| REQ-065, REQ-081, REQ-082 | Nombres largos; `TarjetaCifra`; `DialogoConfirmacion` |
| REQ-066, REQ-067 | `Tabla` |
| REQ-068, REQ-069, REQ-070, REQ-076, REQ-077 | «Estados de cada vista»; `leerCifra`; tipografía |
| REQ-072, REQ-073, REQ-074, REQ-078 | `AvisosTemporales`; `useAccion` |
| REQ-087 | `marca/`; entregas del `disenador-ui`; PRUEBA-023, PRUEBA-031 |
| REQ-089 | Motores de las pruebas; PRUEBA-029, PRUEBA-030 |

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Ningún componente pide ni guarda datos. La muestra solo tiene datos ficticios. Lo escrito en una búsqueda no va a la dirección ni se almacena. No se añade texto libre a informes ni a reglas |
| 2 Aislamiento | Cumple, con una dependencia | El armazón recibe la identidad de la sesión y nunca de la dirección. La ruta con identificador de cliente no se usa hasta que coordinación aplique la nota aclaratoria ya aprobada por el responsable. El aislamiento de datos se prueba en las fases 2 y 5 |
| 3 Cierre en fallo | Cumple en el diseño; sin probar y con una condición | Estado desconocido, cifra imposible, referencia mal formada, respuesta de acción no reconocida, plazo vencido, `ENTORNO` desconocido y nombre de servidor fuera de lista cierran en lo menos favorable. Condición: que la muestra no llegue a producción por un error de configuración lo cierra del todo la comprobación de despliegue de la 002, que aún no existe. Hasta PRUEBA-015, PRUEBA-016, PRUEBA-024 y PRUEBA-034 no se puede afirmar más |
| 4 Secretos | Cumple | La 020 no usa ni necesita ningún secreto |
| 5 Especificación | Cumple | Cada pieza remite a sus requisitos y cada criterio tiene prueba. Plan y tareas, en el paso siguiente |
| 6 Revisión independiente | Cumple | La propuesta visual la valida el responsable; el código, el `revisor`; la accesibilidad, una persona. Este diseño lo aprueba el responsable en P1 |
| 7 Entradas no confiables | Cumple | Todo dato se pinta como texto. Las páginas leídas para este diseño se trataron como datos; no contenían órdenes dirigidas a agentes, salvo remisiones a un índice de documentación para modelos, que no se siguieron |
| 8 Límites en el anfitrión | No aplica | No entrega nada al agente del cliente |
| 9 Prompt por despliegue | No aplica | No hay ningún componente que edite el texto del prompt |
| 10 Producto final | Cumple | Estados de error, accesibilidad, móvil, rendimiento, dos temas y colores forzados forman parte de la entrega |
| 11 Reversibilidad | Cumple | No hay datos. Vuelta atrás de despliegue y de valores, con PRUEBA-033 |
| 12 Español | Cumple | Textos, nombres de componentes, papeles y archivos. Los términos de las librerías se dejan como son |
| 13 Evidencias honestas | Cumple, con dos reservas | Nada se da por superado. Lo manual figura como «no ejecutada» hasta que una persona lo haga. Reservas: el árbol de dependencias se da como un mínimo leído en el registro, no como el árbol completo, que solo dará el archivo de bloqueo; y la evidencia a favor de Radix es de una pieza (el diálogo de alerta), en un navegador, y no hay ninguna de la alternativa A |
| 14 Cambios reservados | Cumple solo si la 002 acepta dos cosas | Los cambios en `scripts/bateria/**`, en `scripts/plataforma/**` y en la clave `scripts` de `package.json` son reservados: los firma el responsable. Los de `next.config.ts` y `src/lib/registro/**` son críticos: llevan dictamen. Ningún agente los aplica por su cuenta. Lo que falta: que los cinco archivos que deciden el resultado de las pruebas de la 020 pasen a ser reservados y que la batería compare las cuentas con `main` (asunto A-12). Mientras la 002 no lo aplique, esos archivos se pueden rebajar sin firma y el único control es la revisión |

Ningún artículo queda incumplido en el diseño. Los artículos 3 y 14 dependen de controles que tiene que aceptar la función 002; si no los acepta, el 14 queda incumplido en la parte de REQ-062 y debe decidirlo el responsable.

## Dependencias nuevas

Versiones leídas en el registro de paquetes. Se vuelven a leer al instalar y se fijan exactas en el archivo de bloqueo.

| Dependencia | Para qué | Versión comprobada | Licencia | Fuente y fecha | Alternativa descartada |
| --- | --- | --- | --- | --- | --- |
| `tailwindcss` (desarrollo) | Utilidades de estilo a partir de la escala | 4.3.5 | MIT | V-110, 12/11/2026 | CSS Modules: sin dependencia, pero más CSS escrito a mano y la coherencia depende de la disciplina. Es la salida si Tailwind diera problemas |
| `@tailwindcss/postcss` (desarrollo) | Integración con Next.js | 4.3.5 | MIT | `registry.npmjs.org/@tailwindcss/postcss/latest`, 13/11/2026 | — |
| `postcss` (desarrollo) | Lo pide la guía oficial | 8.5.25 o posterior; exacta al instalar | MIT | `tailwindcss.com/docs/installation/framework-guides/nextjs`, 13/11/2026 | — |
| `@radix-ui/react-alert-dialog` | Diálogo de confirmación | 1.2.1 | MIT | `registry.npmjs.org/radix-ui/latest`, 13/11/2026: son las versiones que incluye `radix-ui` 1.8.1, la probada en V-110 | El paquete único `radix-ui`: trae 55 paquetes para usar 3 |
| `@radix-ui/react-dialog` | Cajón del menú | 1.3.1 | MIT | Ídem | Ídem |
| `@radix-ui/react-toast` | Avisos temporales | 1.3.1 | MIT | Ídem | Ídem |
| `recharts` | Gráficos de líneas y de barras | 3.10.1 | MIT | V-110 y `registry.npmjs.org/recharts/latest`, 13/11/2026. Pide además `react-is`, en la versión de React | visx: documentación ilegible en V-110. SVG propio: habría que escribir escalas, ejes y marcas |
| `@playwright/test` (desarrollo) | Pruebas en navegador real, con tres motores | 1.65.0 | Apache-2.0 | `registry.npmjs.org/@playwright/test/latest`, 13/11/2026; opciones de emulación en `playwright.dev/docs/api/class-page` y reloj en `playwright.dev/docs/clock` | Modo navegador de Vitest: no se ha verificado. DOM simulado: se colgó en V-110 |
| `@axe-core/playwright` (desarrollo) | Comprobación automática de accesibilidad | 4.14.0 | MPL-2.0 | V-110, 12/11/2026 | — |
| `web-vitals` (desarrollo; solo se inyecta en la página durante la medición) | Calcular las tres métricas con su definición estándar | 6.2.3 | Apache-2.0 | `registry.npmjs.org/web-vitals/latest`, 13/11/2026. Perfil de red: `github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md`, 13/11/2026 | Lighthouse completo: más peso y no mide la respuesta a una interacción sin un flujo aparte |

**Árbol real de ejecución.** La tabla de arriba lista las dependencias directas. Lo que puede llegar al navegador es bastante más. Leído en el registro de paquetes el 13/11/2026, solo hasta el segundo nivel; el número exacto lo dará el archivo de bloqueo:

| Familia | Directas | Lo que arrastran, leído | Mínimo |
| --- | --- | --- | --- |
| Radix | 3 | Otros 16 paquetes `@radix-ui/*` (contexto, portal, presencia, foco, capa descartable, colección, etc.); `aria-hidden`; `react-remove-scroll` y sus 5 dependencias (`tslib`, `use-sidecar`, `use-callback-ref`, `react-style-singleton`, `react-remove-scroll-bar`) | 26 |
| Recharts | 1, más `react-is` | 11 directas: `@reduxjs/toolkit`, `react-redux`, `immer`, `reselect`, `es-toolkit`, `victory-vendor`, `eventemitter3`, `decimal.js-light`, `use-sync-external-store`, `tiny-invariant` y `clsx`. De segundo nivel: `redux`, `redux-thunk` y dos paquetes `@standard-schema/*`; 7 paquetes `d3-*` y 8 paquetes solo de tipos | 32 |

- **Total: al menos 58 paquetes** en el árbol de ejecución, de los que 8 son solo tipos y no llegan al navegador. El tercer nivel no se ha leído (por ejemplo, lo que arrastran los paquetes `d3-*`), así que la cifra real será mayor.
- `victory-vendor` se leyó en su versión 38.1.0; Recharts pide la 37. Se vuelve a leer al instalar.
- La cifra anterior de este diseño («3 paquetes de Radix y Recharts») contaba solo las directas y daba una idea falsa del tamaño. Queda corregida.
- PRUEBA-037 saca del archivo de bloqueo y del grafo de módulos la lista de paquetes que alcanzan los módulos de cliente y la compara con la declarada. Esa lista se escribe en la tarea de instalación, se revisa y pasa a ser ruta reservada.
- Si el árbol de Recharts se considera excesivo, la salida es dibujar los dos gráficos con SVG propio; el envoltorio lo permite sin tocar las vistas. Se deja a juicio del `auditor-seguridad` en su segunda vuelta y del responsable en P1.

**Lo que se ejecuta fuera del navegador.**

- **Al compilar:** Tailwind usa un motor nativo (`@tailwindcss/oxide`, dependencia de `@tailwindcss/postcss` según el registro). Se ejecuta en la máquina de desarrollo y en la compilación de cada despliegue.
- **En las pruebas:** Playwright descarga los navegadores «from Microsoft's CDN», fuera del registro de paquetes, y por defecto los guarda en `%USERPROFILE%\AppData\Local\ms-playwright`, fuera del repositorio (`playwright.dev/docs/browsers`, 13/11/2026). **Esa página no dice nada de que se compruebe la integridad de lo descargado.**

**Control de procedencia de los navegadores de prueba.**

1. Se guardan en una única carpeta de la máquina, con ruta absoluta, **fuera del repositorio y fuera de cualquier clon**: la batería de la 002 se ejecuta en un clon limpio en una carpeta temporal, y una carpeta dentro del proyecto no existiría allí. La ruta se anota en `scripts/bateria/herramientas.json` junto a las sumas, y se pasa a Playwright con `PLAYWRIGHT_BROWSERS_PATH`. Solo se descargan con una orden expresa, nunca al instalar los paquetes ni durante la batería.
2. Tras la descarga, se calcula una suma SHA-256 de cada navegador (sobre la lista ordenada de sus archivos y la suma de cada uno) y se anota en `scripts/bateria/herramientas.json`, de la 002. Es ruta reservada: la firma el responsable.
3. La comprobación «interfaz» recalcula la suma **sobre esa carpeta** antes de ejecutar nada. Si no coincide, si la carpeta no existe o si la variable apunta a otro sitio, falla. No descarga nada para arreglarlo.
4. **Lo que no cubre:** la primera descarga. No se ha encontrado una suma publicada con la que compararla, así que la suma anotada solo detecta una alteración posterior. Es un riesgo residual que tiene que aceptar el responsable por escrito, o rechazar (asunto A-11).

**Condición para instalar.** Ninguna dependencia de esta tabla se instala hasta que la 002 cierre el hallazgo de su dictamen sobre la instalación: hoy `npm ci` ejecutaría los scripts de instalación de todo este árbol con el entorno del usuario.

No verificado, se comprueba al instalar: que `@axe-core/playwright` 4.14.0 admita Playwright 1.65; que la regla de tamaño de objetivo de `axe-core` se active con la etiqueta de WCAG 2.2 AA; que Tailwind 4.3.5 compile con el empaquetador de Next.js 16.4 en Windows; que Tailwind y Playwright funcionen si la 002 instala sin scripts de instalación; que Playwright no descargue navegadores al instalar el paquete; la versión de `react-is`.

Recursos que no son paquetes: el archivo de la fuente, si se elige una alojada, y los iconos copiados de un conjunto abierto. Cada uno, con su licencia anotada.

**No se añade:** la herramienta de shadcn/ui, paquete de iconos, utilidades de clases (`clsx`, `tailwind-merge`, variantes), librería de fechas, de formularios o de validación, DOM simulado, Storybook.

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| React Aria Components como primitiva | El foco no volvió al botón en una de las dos páginas de V-110, sin causa conocida. Queda como alternativa B |
| Base UI | No retuvo el foco en V-110. Pudo ser un uso incorrecto, pero no hay evidencia a favor |
| Copiar componentes con la herramienta de shadcn/ui | Añade dependencias y valores propios que chocan con la escala cerrada y con los nombres en español; hoy parte de Base UI; su registro de cambios trae textos para agentes. Se puede leer como referencia, como dato |
| Selector manual de tema, o tema aplicado con un guion | Fuera de alcance. Además obligaría a guardar una preferencia y a un guion en línea |
| Valores de diseño en un archivo de datos del que se genera el CSS | Un paso de compilación más. Basta con que una prueba compare el CSS con la tabla documentada |
| Tabla con rejilla ARIA y navegación con flechas | Más compleja y más frágil que la tabla nativa con botones de orden |
| Capa de teclado de Recharts activada | Recibe el foco y no anuncia valores (V-110) |
| Información al pasar el puntero en los gráficos | No es necesaria y añade un criterio de accesibilidad difícil de cumplir |
| Recortar los nombres largos y enseñarlos enteros en un globo | Exige otra primitiva y funciona mal con táctil y con lector |
| Control nativo de fecha | Su texto sigue el idioma del navegador |
| `Intl.NumberFormat` para los números | En español no agrupa los de cuatro cifras |
| `next/font/google` | La compilación dependería de una descarga de un tercero |
| Storybook para la muestra | Muchas dependencias y otro despliegue; la muestra debe vivir en la app |
| Muestra protegida solo al servir | Su código quedaría publicado en producción. Queda como segunda capa |
| Quitar la muestra del despliegue con `.vercelignore` o borrándola al desplegar | Lo desplegado dejaría de ser exactamente el commit |
| Muestra también en producción, tras la sesión | Lo descartó el responsable (cuestión 5) |
| Crear ya `src/app/admin/` con el armazón | Sería un área sin control de acceso hasta la 021 |
| Enviar desde el navegador una referencia al servidor para anotarla | Sería registrar un valor recibido (A-15) y pide una ruta nueva con límite de intentos |
| Ejecutar las pruebas en navegador fuera de la batería | Una infracción de accesibilidad no bloquearía la integración (REQ-062) |
| Usar `error.digest` de Next.js como referencia | Es una huella del error, no un valor al azar: el mismo fallo da la misma referencia y permite relacionar fallos entre sí |
| Una segunda variable de entorno para activar la muestra | Seguiría siendo un valor puesto a mano en la consola; el nombre de servidor comparado con una lista del código no depende de la consola |
| Dejar que la página responda «sin acceso» después de pintar un esqueleto | El código de respuesta ya sería 200 y distinguiría el recurso denegado del área inexistente |
| `proxy.ts` para fijar el código 404 o las cabeceras de caché | Se ejecutaría fuera de `fra1` (función 002) |
| Usar en la batería el Edge instalado en la máquina, para no descargar navegadores | Se actualiza solo: el resultado de la batería cambiaría sin que cambie el repositorio. Queda para la matriz completa de verificación |
| El paquete `server-only` para marcar el código de servidor | Otra dependencia; la prueba de frontera sobre el grafo de módulos da la misma garantía |
| Llevar la búsqueda en la cadena de consulta de la petición | La dirección pedida queda en los registros de la plataforma (A-15) |

## Decisiones que requieren ADR

Este diseño **no cambia ninguna frontera** de `docs/ARQUITECTURA.md`: no hay piezas nuevas, ni datos, ni conexiones nuevas. No exige ADR.

Se recomienda a coordinación uno, porque la elección dura y afecta a las fases 3, 4 y 5: **«Sistema de interfaz»**, con este contenido: valores de diseño en variables CSS con tres juegos y tema por preferencia del sistema; Tailwind CSS 4 limitado a la escala; primitivas de Radix confinadas en envoltorios, con el elemento nativo `dialog` como alternativa; Recharts confinado, con tabla equivalente obligatoria; componentes sin acceso a datos; muestra dentro de la app y fuera de producción; pruebas en navegador real. V-110 pasaría de VERIFICAR a PROPUESTO con esta elección, y a CONFIRMADO si el responsable aprueba el diseño en P1.

Cambios que harían falta en documentos compartidos. Los tramita coordinación; este diseño no los aplica:

| Documento | Cambio |
| --- | --- |
| `docs/ESQUELETO.md` | Añadir `src/app/muestra/`, `src/lib/errores/`, `postcss.config.mjs`, `playwright.config.ts`, los iconos de la pestaña y la organización interna de `src/components/` |
| `docs/TECNOLOGIAS.md` | V-110 con la elección de este diseño; las dependencias nuevas |
| `docs/DISENO.md` | Los ya propuestos en `propuestas.md`, más: ancho máximo de 1440 px, duración de los avisos, catálogo de motivos de error, regla «denegado e inexistente responden igual» y la tabla de la escala final |
| `docs/PLAN.md`, fase 3 | La 020 puede implementarse con la app de la fase 1, sin esperar a las migraciones de la fase 2 |
| `.claude/rules/interfaz.md` | Componentes sin acceso a datos; texto de dato con `TextoDato`; sin valores fuera de la escala. Es un cambio de `.claude/`: lo aprueba el responsable |
| Función 002 (fase 1), rutas reservadas (firma) | Comprobación «interfaz» en la batería, con su tiempo máximo, la comparación de cuentas con `main` y la suma de los navegadores de prueba en `herramientas.json`; órdenes de prueba en `package.json`; en `comprobar-despliegue.mjs`, no promover si `/muestra` o `/muestra/valores` no dan 404; **ampliar la lista de reservadas** con `playwright.config.ts`, `tests/e2e/muestra/configuracion-interfaz.ts`, `src/app/muestra/inventario.ts`, `tests/unit/diseno/excepciones.ts` y `tests/unit/diseno/paquetes-de-cliente.ts` |
| Función 002 (fase 1), rutas críticas (dictamen) | Campo `referencia` en `registro.ts`, que solo acepta el formato exacto; extensión de página de la muestra en `next.config.ts` |
| Función 002 (fase 1), otras | Cerrar su hallazgo sobre la instalación de dependencias antes de que la 020 instale nada; entregar `<dominio>`; anotar en su guía de operación y en el texto que enseña la orden de producción antes de la firma que la 020 no se despliega en producción sin el control 3 de la muestra; fijar en `herramientas.json` la carpeta absoluta de los navegadores de prueba; decidir si sus páginas de error muestran una referencia `N-` |
| Funciones 021 a 024 y fase 5 | Cumplir las reglas V-1 a V-7 y ejecutar las pruebas contrato PRUEBA-034 y PRUEBA-035 con sus direcciones; la 021, montar el armazón en `src/app/admin/` y decidir la política de contenido con el inventario de PRUEBA-018 |

## Asuntos abiertos para el responsable

| N.º | Asunto | Alternativas | Recomendación del arquitecto |
| --- | --- | --- | --- |
| A-1 | **REQ-062 y CA-025 sin CI.** La comprobación de accesibilidad necesita una comprobación nueva en la batería de la 002, de unos 8 minutos, y subir su duración máxima de 15 a 25. La batería y la clave `scripts` de `package.json` son rutas reservadas: piden su firma. Los cambios en `next.config.ts` y en `registro.ts` son rutas críticas: piden dictamen, no firma | a) Añadirla. b) Ejecutarla fuera de la batería, con evidencia en cada tarea: no bloquea la integración. c) Reactivar la función 003 | a) |
| A-2 | **REQ-057 y CA-042.** La referencia localiza en los registros solo los fallos que el servidor captura y anota (referencia `S-`). Los que detecta el navegador (sin conexión, plazo agotado, respuesta ilegible) y los errores del servidor que nadie capturó llevan una referencia `N-`, que no deja línea en el servidor: no se usa el `digest` de Next.js porque no es un valor al azar. Además, las páginas de error de la 002 no muestran ningún identificador | a) Aceptar que en esos casos la referencia solo sirve para lo que el usuario cuente a soporte, y revisarlo en la fase 4 con la supervisión. b) Añadir una ruta que reciba el aviso del navegador: ruta crítica nueva, con límite de intentos (V-113) | a). Precisa el criterio: lo decide el responsable |
| A-3 | **La muestra en preproducción es pública**, como el resto de ese dominio, y comparte origen con el futuro `/admin`. No tiene datos, pero enseña la estructura del panel y pinta cadenas de prueba hostiles (inertes) | a) Aceptarlo: permite la revisión manual con móviles sin cuentas. b) Ponerla tras la sesión cuando exista la 021 | a), con las restricciones escritas en «Muestra de componentes» |
| A-4 | **Política de contenido.** Radix y Recharts usan estilos en línea, y la 002 impide los valores de un solo uso. PRUEBA-011 dirá cuánto pesa | Si la política de la 021 no los admite, se aplica la alternativa A del diálogo | Esperar a la prueba y decidir con la 021 |
| A-5 | **Valores que fija este diseño y método de medida:** ancho máximo de 1440 px, avisos de 8 s, y rendimiento medido con cinco ejecuciones por vista, anotando la mediana y la peor | Confirmar, o fijar otros. Decir si el umbral se exige a la mediana o a la peor | Confirmar; exigir el umbral a la mediana |
| A-6 | **Lecturas de la especificación:** variación con valor anterior cero, se muestra la diferencia absoluta con signo; variación nula, «0 %» con «Sin cambios»; las fechas de un periodo a medida, si alguna vista las pide, van en la dirección con formato `AAAA-MM-DD` validado; las peticiones de las vistas de `/muestra/servidor/` a la propia app, con datos ficticios, no cuentan como «peticiones de datos a un entorno» en CA-046; y, solo si se llega a la alternativa A del diálogo, si el paso del tabulador a la interfaz del navegador cuenta como «sacar el foco» en CA-013 | Confirmar o corregir | Confirmar las cuatro primeras. La última, decidirla solo si PRUEBA-011 lleva a la alternativa A |
| A-7 | **Arranque de la 020** sin esperar a las migraciones de la fase 2 | Confirmar y anotarlo en `docs/PLAN.md` | Confirmar |
| A-8 | **Safari.** Los agentes no pueden probar Safari: WebKit en Windows no lo es | Lo prueba la persona de la revisión manual, en un Mac y en un iPhone | Incluirlo en el aviso de REQ-063 |
| A-9 | **Rutas nuevas** respecto de `docs/ESQUELETO.md`, marcadas **(nueva)** | Aprobarlas con este diseño | Aprobar |
| A-10 | **Nombres de cliente en el título del documento (MAYOR 6 del dictamen).** El historial del navegador guarda el título junto a la dirección y puede sincronizarlo con la cuenta del navegador, que es un tercero. REQ-059 saca los nombres de la dirección; el título los volvería a meter. **Lo decide el responsable, no el diseño** | a) El título y el `h1` solo nombran el tipo de vista («Ficha de cliente»); el nombre va en el cuerpo. b) El título lleva el nombre del cliente, y el responsable acepta por escrito que el historial guarde nombres de clientes | El diseño queda con a), que es la opción segura, **a la espera de su decisión**. Cambiar a b) no toca nada más |
| A-11 | **Navegadores de prueba.** Playwright los descarga fuera del registro de paquetes y su documentación no dice que compruebe su integridad. El control de este diseño detecta una alteración posterior, no una primera descarga comprometida | a) Aceptar por escrito ese riesgo residual: son herramientas de prueba, no llegan a ningún despliegue, pero se ejecutan en la máquina de desarrollo. b) No descargar ninguno y probar solo con el Edge instalado: sin Firefox ni WebKit y con resultados que cambian cuando Edge se actualiza | a) |
| A-12 | **Proteger lo que decide el resultado (MAYOR 7 del dictamen).** Cinco archivos de la 020 permiten rebajar la comprobación de accesibilidad o las pruebas de frontera. Hoy no son rutas reservadas | a) Ampliar la lista de reservadas de la 002 con esos cinco archivos y hacer que la batería falle si bajan las cuentas respecto de `main`. b) Dejarlo en la revisión del `revisor` y aceptar el riesgo por escrito | a). Es un cambio de la 002 y de su lista de reservadas: lo firma el responsable |
| A-13 | **Tamaño del árbol de Recharts**: al menos 32 paquetes para dos tipos de gráfico | a) Mantener Recharts, confinado y con la lista de paquetes declarada. b) Dibujar los dos gráficos con SVG propio: más código nuestro y ninguna dependencia | a), salvo que el `auditor-seguridad` lo vea de otro modo en su segunda vuelta |

## Respuesta al dictamen

Dictamen de primera vuelta del `auditor-seguridad`, 13/11/2026 (`dictamen-diseno.md`): 0 bloqueantes, 9 mayores y 11 menores. Una línea por hallazgo. «Corregido» quiere decir que el diseño lo recoge; ninguna de las pruebas citadas se ha ejecutado.

| Hallazgo | Resultado | Dónde, o por qué no |
| --- | --- | --- |
| MAYOR 1. Las dos capas de la muestra no son independientes y nada comprueba el despliegue real | Corregido en lo que es de la 020; una parte, condicionada a la 002 | «Cómo no existe en producción»: el control 2 se evalúa en cada petición y exige además un nombre de servidor de una lista del código, así que un `ENTORNO` equivocado no basta. PRUEBA-024 ampliada con los valores y la cadena testigo que pedía el dictamen. La comprobación de despliegue como condición para promover es de la 002: queda pedida, y la 020 no se despliega en producción hasta que exista. Dos puntos sin verificar, dichos en el texto |
| MAYOR 2. `useAccion` no cubre respuestas fuera de los cuatro resultados ni tiene plazo | Corregido | «Estados de cada vista», tabla de `leerResultadoAccion()`: exhaustiva, cierra en `incierta`, éxito solo con confirmación expresa, plazo de 30 s. PRUEBA-015 ampliada; estados nuevos en el inventario |
| MAYOR 3. «El mismo 404» no se cumple con esqueletos por bloque | Corregido, con el código sin garantizar del todo | Regla V-1, con lo leído en la documentación de Next.js el 13/11/2026. Se fija como obligatorio el mismo código en los tres casos; el esperado es 404 en carga completa. No se ha podido verificar el código de las respuestas de navegación: si la prueba contrato no logra el 404 en los tres, se iguala al que se pueda y vuelve al arquitecto. Prueba contrato PRUEBA-034; PRUEBA-008 prohíbe `loading`, `not-found` anidado y `generateMetadata` en los dashboards |
| MAYOR 4. Las pruebas miran el documento y no lo que viaja serializado | Corregido | Regla V-2; vistas de `/muestra/servidor/` para que haya un camino real de servidor; PRUEBA-017 y PRUEBA-034 buscan la cadena testigo en el cuerpo de todas las respuestas |
| MAYOR 5. La búsqueda puede viajar en la cadena de consulta de una petición | Corregido | Regla V-3; prueba contrato PRUEBA-035 |
| MAYOR 6. Nombres de cliente en el título y, con él, en el historial | No lo decide el diseño | Queda la opción segura (el título y el `h1` solo nombran el tipo de vista), marcada como pendiente: «Armazón», regla V-5 y asunto A-10. Lo decide el responsable |
| MAYOR 7. La comprobación de accesibilidad y las pruebas de frontera se pueden rebajar sin firma | Corregido en el diseño; su efecto depende de la 002 | «Protección de lo que decide el resultado»: todo lo que decide queda en cinco archivos; se pide ampliar con ellos la lista de reservadas y que la batería compare cuentas con `main`. PRUEBA-036. Hasta que la 002 lo aplique, solo hay revisión, y se dice. Asunto A-12 y artículo 14 |
| MAYOR 8. El árbol de ejecución es mayor de lo declarado y hay un binario sin control de integridad | Corregido, con un riesgo residual para el responsable | «Dependencias nuevas»: árbol leído en el registro, al menos 58 paquetes, y la cifra anterior retirada; lista declarada de paquetes de cliente y PRUEBA-037; carpeta propia y suma de los navegadores de prueba; nada se instala hasta que la 002 cierre su hallazgo. No resuelto: la primera descarga de los navegadores no se puede contrastar con una suma publicada (asunto A-11). No leído: el tercer nivel del árbol |
| MAYOR 9. Lo que se pinta como referencia puede no serlo | Corregido | «Errores sin datos internos y referencia opaca»: formato exacto con letra de origen, validado al leer en el navegador y al escribir en el registro; nunca `digest`. PRUEBA-010 y PRUEBA-017 ampliadas. El formato exacto en `registro.ts` es un cambio de la 002 |
| m-1. La alternativa A sobrestima `dialog`; V-110 probó una sola pieza | Corregido | «Diálogo, cajón y avisos»: regla de decisión por pieza, límites de V-110 y de `dialog` dichos, y la lectura de CA-013 en el asunto A-6 |
| m-2. `textoPlano` deja fuera caracteres; el diálogo identifica solo por el nombre | Corregido | Lista ampliada en «Texto que llega como dato»; el diálogo recibe `{nombre, distintivo}`. Qué dato es el distintivo lo fija cada vista (022, 023) |
| m-3. «Formato de identificador» sin definir | Corregido | Expresión exacta de UUID en «Dirección de la página»; PRUEBA-009 con los casos pedidos |
| m-4. Errores de campo y textos de alertas como texto libre | Corregido | `Formulario` y `ListaAlertas` en «Componentes base»; regla V-6 |
| m-5. Motivo `no_permitido` por bloque | Corregido | Sustituido por `sesion_no_valida`, limitado a fallos de la sesión entera |
| m-6. Contradicción entre la lectura de `ENTORNO` y la frontera de importaciones | Corregido | Tres excepciones escritas en «Cómo no tiene acceso a datos» y en `excepciones.ts` |
| m-7. La muestra es pública y comparte origen con `/admin` | Corregido en las restricciones; la exposición sigue pendiente | Restricciones en «Muestra de componentes» y en PRUEBA-018. Que sea pública lo decide el responsable (asunto A-3) |
| m-8. El inventario para la política de contenido debe cubrir toda la muestra | Corregido | PRUEBA-018; aviso a la 021 en «Fronteras con la 021» |
| m-9. Caché HTTP | Corregido | Regla V-4 y PRUEBA-034. No verificado qué cabecera de caché pone Next.js por defecto en una página que se pinta en cada petición |
| m-10. PRUEBA-008 debe resolver alias, importaciones dinámicas y reexportaciones | Corregido | PRUEBA-008, sobre el grafo de módulos; cubre `fallo-servidor.ts` y `web-vitals` |
| m-11. Clasificación de los cambios en la fase 1 | Corregido | «Qué queda condicionado a la función 002», artículo 14 y asunto A-1. La ampliación de la lista de reservadas se pide de forma expresa en el asunto A-12 |

### Segunda vuelta

Segunda vuelta del `auditor-seguridad`, 13/11/2026: 0 bloqueantes; un mayor nuevo (N-1), cinco menores (N-2 a N-6) y dos reservas de redacción.

| Hallazgo | Resultado | Dónde, o por qué no |
| --- | --- | --- |
| N-1 (MAYOR). El control 2 de la muestra está en un `layout`, que no protege el resto de la ruta | Corregido | «Cómo no existe en producción»: `comprobarAccesoMuestra()` es la primera instrucción de cada página y de cada acción de servidor; la muestra no tiene manejadores de ruta; PRUEBA-008 lo impone. La excepción de importación queda más estrecha de lo que pedía el dictamen: un solo archivo de la muestra importa `configuracion.ts`, y los puntos de entrada lo importan a él. PRUEBA-024 con los casos nuevos. Segundo aviso a la 021 en «Fronteras con la 021». La forma exacta del rechazo de una acción no está verificada: la fija PRUEBA-024 |
| N-2. `/muestra/servidor/` publica puntos de entrada que escriben en el registro y quizá en la supervisión | Corregido | «Cómo no tiene acceso a datos», punto 3: esas rutas no importan `fallo-servidor.ts` ni `registro.ts` y capturan su error simulado. PRUEBA-008 y PRUEBA-018 |
| N-3. Los archivos de prueba pueden rebajar `axe` sin bajar las cuentas; la frase «y no en otros» no era exacta | Corregido, con un límite dicho | «Protección de lo que decide el resultado»: única llamada a `axe` en el módulo reservado, sin parámetros de exclusión; comprobación estática (PRUEBA-036), que no depende de la 002; frase corregida. Una aserción relajada dentro de una prueba solo la ve la revisión |
| N-4. Una respuesta tardía podría atribuirse a un segundo envío | Corregido | «Estados de cada vista»: cada resultado pertenece a su envío. Caso nuevo en PRUEBA-015 |
| N-5. De dónde saca los navegadores el clon limpio de la batería | Corregido | «Control de procedencia»: carpeta única con ruta absoluta, fuera del repositorio y de los clones, anotada en `herramientas.json`; la suma se comprueba sobre ella. Es un archivo de la 002 |
| N-6. La condición de no desplegar solo estaba declarada; `Host` frente a `X-Forwarded-Host` | Corregido en lo que es de la 020; el resto, pedido a la 002 | La condición irá en `plan.md` y `verificacion.md` de la 020, y se pide a la 002 en su guía y en el texto de su orden de producción. El nombre de servidor se lee solo de `Host`; caso con la cabecera falsificada en PRUEBA-024. La 020 no puede impedir por sí sola un despliegue: el mecanismo es de la 002 |
| Reserva de m-1. El resumen no llevaba la limitación de V-110 | Corregido | «Resumen» |
| Reserva de m-2. Seguían pasando U+2060 a U+2064 y U+180E | Corregido | `textoPlano` quita toda la categoría Cf salvo U+200C y U+200D; PRUEBA-004 |
| Reserva de MAYOR 3. PRUEBA-008 no detecta un `Suspense` por encima de la decisión | No corregido | Detectarlo de forma estática no es fiable; lo cubre PRUEBA-034, que es la prueba contrato, y se dice en PRUEBA-008 |

Lo que sigue abierto después de las dos vueltas: la decisión del responsable sobre el título (A-10), el riesgo de la primera descarga de los navegadores de prueba (A-11), la ampliación de las rutas reservadas (A-12), el tamaño del árbol de Recharts (A-13) y los tres cambios que tiene que aceptar la función 002. Y tres hechos sin verificar que fijan las primeras pruebas: `pageExtensions` en el directorio `app`, el nombre de servidor que recibe una función en Vercel y el código de respuesta de las navegaciones.
