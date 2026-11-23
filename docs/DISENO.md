# Diseño: sistema visual, páginas y accesibilidad

Estado: **definitivo, validado por el responsable el 22/11/2026** (T-013; «Logo C, aprobada», sin cambios en paleta, tipografía, vistas ni umbral de 38 rem de la cabecera). La escala y los papeles de «Escala y papeles» son los de la propuesta visual de la función 020 (T-011, razonada en `specs/020-sistema-diseno-armazon/propuesta-visual.md`), con el contraste calculado; T-015 (a) los deja como definitivos sin cambiar ningún valor.

## Referencia

`docs/referencia/dashboard-referencia.jpg` (D-004). Se toma su estructura y su tono: menú lateral oscuro, fila de tarjetas de cifras, gráficos en morado, lista de tareas y alertas. Es una captura de un producto de terceros: no se copian su marca, sus nombres, sus textos ni su iconografía.

## Principios

1. **La cifra primero.** Cada pantalla responde a una pregunta: ¿funcionan los agentes?, ¿qué necesita mi atención? Lo demás va debajo.
2. **Estado con palabra, no solo con color.** «Sin señal», «En pausa», «Con avisos». El color acompaña.
3. **Nada que no sea verdad.** Sin cifras de adorno ni tendencias sin datos suficientes. Si no hay datos, se dice.
4. **Sobrio.** Un color de acento, tipografía clara, poca decoración.
5. **Mismo sistema en los dos dashboards.** El de cliente es un subconjunto, no otro diseño.

## Estructura de pantalla

- Menú lateral fijo a la izquierda, oscuro, con el área actual resaltada. En móvil se pliega en un cajón.
- Cabecera con título, selector de periodo cuando aplique y cuenta del usuario.
- Cuerpo en rejilla: fila de tarjetas de cifras, luego gráficos y tablas, y a la derecha o al final, alertas.
- Ancho máximo de contenido; nunca desplazamiento horizontal de página.

## Escala y papeles

Tres capas en `src/components/estilos/valores.css` (diseño de la 020): la **escala** (lista cerrada de valores), los **papeles** (para qué sirve cada valor, en tema claro, tema oscuro y colores forzados) y las utilidades de Tailwind, una por papel. Los componentes solo usan papeles, nunca un valor de la escala. Todo valor de `valores.css` figura aquí con el mismo valor, y al revés (PRUEBA-005).

Formato: colores en hexadecimal sRGB opaco; sin transparencia en texto, fondos ni bordes (solo las sombras la llevan). Degradados lineales entre dos colores de la escala (del acento, de la gama del menú o del acento al neutro), interpolados en sRGB. Las sombras son la única excepción a «hexadecimal opaco»: llevan alfa porque son un halo y no el color de un texto, un fondo ni un borde; su color es siempre el de un valor de la escala (neutro 900 en claro, neutro 950 en oscuro) y PRUEBA-005 lo comprueba.

### Escala de color

| Rampa | Paso | Valor |
| --- | --- | --- |
| neutro | 0 | `#FFFFFF` |
| neutro | 50 | `#F8FAFC` |
| neutro | 100 | `#F1F5F9` |
| neutro | 200 | `#E5E7EB` |
| neutro | 300 | `#CBD5E1` |
| neutro | 400 | `#A3B0C2` |
| neutro | 450 | `#7D8BA0` |
| neutro | 500 | `#64748B` |
| neutro | 600 | `#475569` |
| neutro | 700 | `#334155` |
| neutro | 800 | `#273449` |
| neutro | 850 | `#151E2E` |
| neutro | 900 | `#0F172A` |
| neutro | 950 | `#0B1120` |
| noche | 300 | `#A3AECB` |
| noche | 700 | `#1F2757` |
| noche | 800 | `#151C45` |
| noche | 900 | `#0B1230` |
| acento | 50 | `#EFE9FF` |
| acento | 200 | `#D4C6FD` |
| acento | 300 | `#B39BFB` |
| acento | 400 | `#A78BFA` |
| acento | 450 | `#9775F7` |
| acento | 500 | `#8B5CF6` |
| acento | 550 | `#7344F0` |
| acento | 600 | `#6C3CE9` |
| acento | 700 | `#5B2BD6` |
| acento | 800 | `#4A1FB8` |
| acento | 900 | `#2A2152` |
| correcto | 400 | `#4ADE80` |
| correcto | 700 | `#15803D` |
| aviso | 400 | `#FBBF24` |
| aviso | 700 | `#B45309` |
| error | 400 | `#F87171` |
| error | 700 | `#B91C1C` |

Un solo color de acento: la rampa `acento` es un único tono morado en varios pasos (REQ-030). `noche` es la gama oscura del menú.

### Papeles de color

Columnas: valor inicial (tabla de esta sección antes de la 020), valor en tema claro, en tema oscuro y en colores forzados. El menú es oscuro en los dos temas (REQ-002).

| Papel | Uso | Inicial | Claro | Oscuro | Colores forzados |
| --- | --- | --- | --- | --- | --- |
| `--fondo-pagina` | Fondo de la página | `#F8FAFC` | `#F8FAFC` | `#0B1120` | `Canvas` |
| `--superficie` | Tarjetas, tablas, diálogos | `#FFFFFF` | `#FFFFFF` | `#151E2E` | `Canvas` |
| `--texto` | Texto principal | `#0F172A` | `#0F172A` | `#F1F5F9` | `CanvasText` |
| `--texto-secundario` | Etiquetas, ayudas, periodos | `#64748B` | `#475569` | `#A3B0C2` | `CanvasText` |
| `--borde-decorativo` | Separación de tarjetas y filas; no informa | `#E5E7EB` | `#E5E7EB` | `#273449` | `CanvasText` |
| `--borde-control` | Borde de campos, casillas y selectores | — | `#64748B` | `#7D8BA0` | `CanvasText` |
| `--acento` | Botón primario y selección | `#6C3CE9` | `#6C3CE9` | `#A78BFA` | `Highlight` |
| `--enlace` | Texto de los enlaces | — | `#6C3CE9` | `#A78BFA` | `LinkText` |
| `--texto-sobre-acento` | Texto del botón primario y del de peligro | — | `#FFFFFF` | `#0F172A` | `HighlightText` |
| `--acento-suave` | Fondo de selección y de iconos | `#EFE9FF` | `#EFE9FF` | `#2A2152` | `Canvas` |
| `--foco` | Contorno de foco, en todo control | — | `#8B5CF6` | `#A78BFA` | `Highlight` |
| `--menu-fondo` | Fondo plano del menú | `#0B1230` | `#0B1230` | `#0B1230` | `Canvas` |
| `--menu-texto` | Entradas del menú | — | `#F1F5F9` | `#F1F5F9` | `CanvasText` |
| `--menu-texto-secundario` | Textos menores del menú | — | `#A3AECB` | `#A3AECB` | `CanvasText` |
| `--menu-actual` | Fondo del área actual | — | `#1F2757` | `#1F2757` | `Canvas` |
| `--menu-indicador` | Barra lateral del área actual | — | `#A78BFA` | `#A78BFA` | `Highlight` |
| `--correcto` | Estado correcto, con palabra o icono | `#15803D` | `#15803D` | `#4ADE80` | `CanvasText` |
| `--aviso` | Estado de aviso, con palabra o icono | `#B45309` | `#B45309` | `#FBBF24` | `CanvasText` |
| `--error` | Estado de error, con palabra o icono; relleno y borde del botón de peligro | `#B91C1C` | `#B91C1C` | `#F87171` | `CanvasText` |
| `--serie-1` | Serie principal de los gráficos | `#6C3CE9` | `#6C3CE9` | `#A78BFA` | `Highlight` |
| `--serie-2` | Segunda serie, trazo continuo grueso | — | `#334155` | `#CBD5E1` | `CanvasText` |
| `--serie-3` | Tercera serie, trazo a rayas | — | `#64748B` | `#7D8BA0` | `CanvasText` |
| `--serie-4` | Cuarta serie, trazo de puntos | — | `#4A1FB8` | `#D4C6FD` | `CanvasText` |

Las series se distinguen además por el trazo y la forma del marcador, o por la trama en las barras (REQ-038). En colores forzados se definen de forma expresa porque el navegador no fuerza el relleno ni el trazo de SVG.

### Degradados

| Papel | Uso | Claro | Oscuro | Colores forzados |
| --- | --- | --- | --- | --- |
| `--degradado-menu` | Fondo del menú, de arriba abajo | `#0B1230` → `#151C45` | `#0B1230` → `#151C45` | `none` |
| `--degradado-acento` | Botón primario | `#7344F0` → `#5B2BD6` | `#B39BFB` → `#9775F7` | `none` |

Un degradado nunca es el único medio de transmitir una información (REQ-085). Con colores forzados pasan a `none` y queda el color plano del papel.

### Contraste calculado

Fórmula de luminancia relativa de WCAG 2.2. Umbrales: 4,5:1 en todo texto, también el grande; 3:1 en bordes de controles, foco, estados, iconos con significado y series. Sobre un degradado se miden 33 puntos interpolados en sRGB y se da el peor. Cálculo del `disenador-ui` con un script propio el 20/11/2026. El informe de PRUEBA-006 (`tests/unit/diseno/contraste.test.ts`, con los pares de `combinaciones.ts` y los valores de `valores.css`) lo repite y comprueba cada cifra de las dos tablas, la de pares declarados y la de combinaciones prohibidas.

| Delante | Detrás | Tipo | Claro | Oscuro |
| --- | --- | --- | --- | --- |
| `--texto` | `--fondo-pagina` | Texto | 17,06 | 17,19 |
| `--texto` | `--superficie` | Texto | 17,85 | 15,25 |
| `--texto` | `--acento-suave` | Texto | 15,11 | 13,33 |
| `--texto-secundario` | `--fondo-pagina` | Texto | 7,24 | 8,56 |
| `--texto-secundario` | `--superficie` | Texto | 7,58 | 7,59 |
| `--texto-secundario` | `--acento-suave` | Texto | 6,41 | 6,64 |
| `--enlace` | `--fondo-pagina` | Texto (enlace) | 5,80 | 6,92 |
| `--enlace` | `--superficie` | Texto (enlace) | 6,07 | 6,14 |
| `--enlace` | `--acento-suave` | Texto | 5,13 | 5,37 |
| `--acento` | `--acento-suave` | Texto | 5,13 | 5,37 |
| `--texto-sobre-acento` | `--acento` | Texto | 6,07 | 6,56 |
| `--texto-sobre-acento` | `--degradado-acento` (peor punto) | Texto | 5,51 | 5,27 |
| `--texto-sobre-acento` | `--error` | Texto | 6,47 | 6,45 |
| `--correcto` | `--fondo-pagina` / `--superficie` | Texto | 4,79 / 5,02 | 10,81 / 9,59 |
| `--aviso` | `--fondo-pagina` / `--superficie` | Texto | 4,80 / 5,02 | 11,28 / 10,01 |
| `--error` | `--fondo-pagina` / `--superficie` | Texto | 6,18 / 6,47 | 6,81 / 6,04 |
| `--error` | `--acento-suave` | Texto | 5,47 | 5,28 |
| `--menu-texto` | `--degradado-menu` (peor punto) | Texto | 14,93 | 14,93 |
| `--menu-texto` | `--menu-actual` | Texto | 12,90 | 12,90 |
| `--menu-texto-secundario` | `--degradado-menu` (peor punto) | Texto | 7,38 | 7,38 |
| `--borde-control` | `--fondo-pagina` / `--superficie` | No texto | 4,55 / 4,76 | 5,45 / 4,83 |
| `--borde-control` | `--acento-suave` | No texto | 4,03 | 4,22 |
| `--foco` | `--fondo-pagina` / `--superficie` | No texto | 4,05 / 4,23 | 6,92 / 6,14 |
| `--foco` | `--acento-suave` | No texto | 3,58 | 5,37 |
| `--foco` | `--degradado-menu` (peor punto) | No texto | 3,86 | 6,01 |
| `--foco` | `--menu-actual` | No texto | 3,34 | 5,19 |
| `--menu-indicador` | `--degradado-menu` (peor punto) / `--menu-actual` | No texto | 6,01 / 5,19 | 6,01 / 5,19 |
| `--serie-1` | `--superficie` | No texto | 6,07 | 6,14 |
| `--serie-2` | `--superficie` | No texto | 10,35 | 11,25 |
| `--serie-3` | `--superficie` | No texto | 4,76 | 4,83 |
| `--serie-4` | `--superficie` | No texto | 9,64 | 10,58 |

**Combinaciones prohibidas.** No llegan al umbral y no se declaran en `combinaciones.ts`:

| Delante | Detrás | Claro | Oscuro | Motivo |
| --- | --- | --- | --- | --- |
| `--correcto` | `--acento-suave` | 4,24 | 8,38 | Texto por debajo de 4,5:1 en claro. Una etiqueta de estado no va sobre fondo de selección; se prohíbe en los dos temas para que la regla sea una sola |
| `--aviso` | `--acento-suave` | 4,25 | 8,75 | Ídem |
| `--borde-decorativo` | cualquier fondo | 1,24 sobre `--superficie` | 1,33 sobre `--superficie` | No sirve para delimitar un control; para eso está `--borde-control` |
| `--foco` | `--acento` | 1,43 | 1,00 | El contorno de foco nunca se pinta pegado al botón primario: va separado 2 px, sobre el fondo. En oscuro los dos son el mismo color |
| `--texto-sobre-acento` | `--foco` | 4,23 | 6,56 | `--foco` no es un fondo |

### Diferencias con los valores iniciales

Solo se ha cambiado lo que no llegaba al contraste en un uso previsto. El resto de los valores iniciales se mantiene. Los papeles nuevos y los degradados no cambian un valor inicial: separan usos que antes compartían papel o que la tabla inicial no recogía.

| Papel | Inicial | Ahora (claro) | Motivo |
| --- | --- | --- | --- |
| `--texto-secundario` | `#64748B` | `#475569` | Sobre `--acento-suave` daba 4,03:1 (no llega a 4,5:1) y sobre `--fondo-pagina`, 4,55:1, sin margen. Se baja un paso en la misma rampa: 6,41:1 y 7,24:1 |
| Borde de tarjeta y de control | `#E5E7EB` para los dos | `--borde-decorativo` `#E5E7EB` y `--borde-control` `#64748B` (nuevo) | `#E5E7EB` sobre blanco da 1,24:1: vale para separar tarjetas, no para el borde de un campo, que pide 3:1. El borde de control usa el valor inicial del texto secundario: 4,76:1 |
| Acento sobre el menú | `#6C3CE9` (3,03:1 sobre `#0B1230`, sin margen, y 2,70:1 sobre `#151C45`, el extremo claro del degradado del menú) | `--menu-indicador` `#A78BFA` y `--foco` `#8B5CF6` (nuevos) | El acento no se usa sobre el menú. El indicador del área actual y el foco usan pasos más claros del mismo tono: 6,01:1 y 3,86:1 en el peor punto. El acento `#6C3CE9` no cambia |
| `--correcto`, `--aviso` sobre `--acento-suave` | — | Sin cambio de valor | 4,24:1 y 4,25:1. Se prohíbe la combinación en lugar de oscurecer los dos colores de estado, que cumplen en los fondos donde se usan |
| `--enlace` | `--acento` (servía a enlaces y a botón) | `--enlace` `#6C3CE9` (nuevo) | Con colores forzados el botón es `Highlight` y el enlace tiene que ser `LinkText`, el color que el sistema da a los enlaces; con un solo papel no se pueden separar. En claro y en oscuro valen lo mismo que `--acento` |
| `--menu-actual` | — | `#1F2757` (nuevo) | La referencia resalta el área actual del menú; hace falta un fondo propio, más claro que el menú, con texto de 12,90:1 y foco de 3,34:1 |
| `--menu-texto-secundario` | — | `#A3AECB` (nuevo) | Textos menores del menú (contadores, pie). Con `--menu-texto` no se distinguirían del resto; este llega a 7,38:1 en el peor punto del degradado |
| `--serie-2` a `--serie-4` | Solo existía la serie principal | `#334155`, `#64748B`, `#4A1FB8` (nuevos) | REQ-038 pide distinguir series sin depender del color: cada serie lleva además su trazo y su marcador. Cada color llega a 3:1 sobre `--superficie` (4,76:1 la tercera, la más justa en claro) |
| `--degradado-menu`, `--degradado-acento` | Colores planos | Degradados de dos colores de la escala (nuevos) | REQ-085 los pide como recurso de estilo. Cada texto sobre ellos se mide en el peor de 33 puntos; con colores forzados valen `none` y queda el color plano del papel |
| `--degradado-grafico` | `#EFE9FF` → `#FFFFFF` en claro y `#2A2152` → `#151E2E` en oscuro (papel de la tabla de degradados) | **Retirado** (23/11/2026, `disenador-ui`) | No informa: el relleno bajo una línea sugiere una cantidad acumulada, que las series de este producto no son, y con varias series o con huecos (un día sin dato) se tapa o se corta. Cada serie ya se distingue por su trazo y su marcador. Los dos extremos eran `--acento-suave` y `--superficie`, así que no se pierde ningún tono. La propuesta visual deja de pintarlo; los degradados del menú y del botón primario cumplen REQ-085. Quedan fuera sus pares de contraste y las dos combinaciones prohibidas que lo mencionaban |
| Botón de peligro | — (no había variante) | Sin papel nuevo: relleno y borde `--error`, texto `--texto-sobre-acento` (23/11/2026) | Para la acción destructiva del diálogo de confirmación. Texto sobre relleno: 6,47:1 en claro y 6,45:1 en oscuro (mínimo 4,5:1). Borde y relleno son el mismo color y contra la superficie dan 6,47 y 6,04 (mínimo 3:1). El foco es el de siempre, separado 2 px del botón sobre la superficie: 4,23 y 6,14. Con colores forzados el navegador impone `ButtonFace` y `ButtonText` a todo botón, y el borde sigue presente; el nombre de la acción va en el texto, no en el color |
| `--serie-2` frente a `--serie-3` | `#334155` y `#64748B` en claro; `#CBD5E1` y `#7D8BA0` en oscuro | Sin cambio (23/11/2026, medido) | La relación de luminancia entre las dos es 2,18:1 en claro y 2,33:1 en oscuro: se separan a simple vista y en escala de grises. Además, el trazo (grueso continuo frente a rayas) y el marcador las distinguen sin color. Aclarar `--serie-3` para ganar separación le quitaría margen sobre la superficie (4,76:1 hoy, frente a 3:1 exigido) sin que haga falta. Quedan dos pares casi iguales en valor, `--serie-1` frente a `--serie-3` (1,28:1 en claro, 1,27:1 en oscuro) y `--serie-2` frente a `--serie-4` (1,07:1 y 1,06:1): solo los separan el trazo y el marcador (REQ-038), y por eso una serie nunca va sin ellos |
| Tema oscuro | No existía | Columna «Oscuro» | Nuevo por REQ-088. Mismo tono de acento en pasos más claros |
| `--sombra-velo` | — | Velo de `rgb(15 23 42 / 0.5)` en claro y `rgb(11 17 32 / 0.7)` en oscuro (nuevo, T-011) | El cajón del menú y el panel de la cuenta no oscurecían el fondo. Se declara como sombra porque es la otra capa con alfa; sus pares están en la tabla «Velo». El cajón gana un borde derecho `--menu-texto` y el panel pasa a borde `--borde-control` para separarse con el velo puesto |
| Umbral de alto de la cabecera fija | `38rem`, por validar | Se mantiene | Ver `propuesta-visual.md`, «Cabecera fija»: la de peor caso ocupa el 39 % de 608 px |

### Logotipo y nombre

Elegido el 22/11/2026: **C, «Nido en anillo»**. Los logotipos A y B se retiran. El componente está en `src/components/marca/` (`LogotipoNido`, con las variantes `menu-oscuro`, `fondo-claro` e `icono`, y `MarcaDelProducto`, logotipo más nombre para el menú). Solo lleva formas y pinta con papeles, nunca con un valor de la escala: `menu-oscuro` usa `--menu-indicador` (anillo y anillo interior) y `--menu-texto` (nodos y huevo); `fondo-claro` usa `--acento`, `--serie-4` (anillo interior) y `--texto`; `icono` va sobre `--degradado-acento` con `--texto-sobre-acento`. El nombre es `TEXTOS.marca.nombreProducto` («Nido: Agentes de Correo»), en HTML junto al logotipo y anunciado una sola vez: el logotipo es decorativo (`aria-hidden`). Por debajo de 24 px el anillo interior se funde con el huevo, y el componente lo omite y agranda el huevo (misma forma y mismo tono). Los archivos de la aplicación (`src/app/icon.svg`, `favicon.ico` y `apple-icon.png`) los genera `scripts/generar-iconos.mjs` con los mismos dos extremos del degradado del acento en claro (`#7344F0` y `#5B2BD6`) y blanco.

### Espaciado

Lista cerrada, múltiplos de 4 px. Las utilidades de relleno, margen y separación solo admiten estos pasos.

| Paso | Valor |
| --- | --- |
| `0` | 0 |
| `1` | 4 px |
| `2` | 8 px |
| `3` | 12 px |
| `4` | 16 px |
| `5` | 20 px |
| `6` | 24 px |
| `8` | 32 px |
| `10` | 40 px |
| `12` | 48 px |
| `16` | 64 px |

### Radios

| Nombre | Valor | Uso |
| --- | --- | --- |
| `pequeno` | 4 px | Etiquetas de estado, casillas |
| `medio` | 8 px | Botones, campos |
| `grande` | 12 px | Tarjetas, diálogos |
| `completo` | 9999 px | Indicadores circulares |

### Sombras

Solo informan de elevación; la separación la dan los bordes. En colores forzados valen `none`.

| Nombre | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `tarjeta` | `0 1px 2px 0 rgb(15 23 42 / 0.06)` | `0 1px 2px 0 rgb(11 17 32 / 0.4)` | Tarjetas |
| `elevada` | `0 8px 24px -4px rgb(15 23 42 / 0.16)` | `0 8px 24px -4px rgb(11 17 32 / 0.6)` | Diálogo, cajón del menú, avisos |
| `velo` | `rgb(15 23 42 / 0.5)` | `rgb(11 17 32 / 0.7)` | Velo (`--sombra-velo`, utilidad `bg-velo`): oscurece lo que queda detrás del cajón del menú y del panel de la cuenta. Es la única capa con alfa que cubre la página y no lleva texto |

### Velo

Contraste del borde del cajón y del panel con el fondo que queda debajo del velo (el velo pintado sobre `--fondo-pagina` o sobre `--superficie`, mezclado en sRGB). Es no texto: 3:1. Con colores forzados el velo vale `none` y el borde del diálogo (`CanvasText`) lo separa. Lo repite `tests/unit/diseno/contraste.test.ts`; los pares viven en `PARES_CON_VELO` de `combinaciones.ts`.

| Delante | Sobre | Dónde | Claro | Oscuro |
| --- | --- | --- | --- | --- |
| `--menu-texto` | `--fondo-pagina` | Borde derecho del cajón del menú | 3,21 | 17,19 |
| `--menu-texto` | `--superficie` | Borde derecho del cajón del menú | 3,11 | 16,65 |
| `--superficie` | `--fondo-pagina` | Panel de la cuenta, por su superficie | 3,51 | — |
| `--superficie` | `--superficie` | Panel de la cuenta, por su superficie | 3,41 | — |
| `--borde-control` | `--fondo-pagina` | Panel de la cuenta, por su borde | — | 5,45 |
| `--borde-control` | `--superficie` | Panel de la cuenta, por su borde | — | 5,27 |

En claro el panel se separa por su superficie blanca (el borde de control no llega a 3:1 sobre el velo: 1,36); en oscuro, por su borde, porque la superficie y el velo son casi iguales (1,13). Un fondo oscuro no se puede oscurecer más: en oscuro el velo atenúa sobre todo las tarjetas y lo demás lo hace el borde.

### Texto

Tipografía sin remates del sistema (T-011 (b)): ninguna fuente se descarga, ni de terceros ni propia, así que no hay licencia que añadir ni petición que bloquear (PRUEBA-020). Cifras con números tabulares: `base.css` aplica `font-variant-numeric: tabular-nums` a las tablas y a todo `[data-cifra]`.

| Nombre | Tamaño | Altura de línea | Uso |
| --- | --- | --- | --- |
| `pequeno` | 12 px | 16 px | Notas, periodo de una tarjeta |
| `cuerpo-menor` | 14 px | 20 px | Tablas, etiquetas |
| `cuerpo` | 16 px | 24 px | Texto general, campos |
| `subtitulo` | 18 px | 28 px | Títulos de tarjeta y de sección |
| `titulo` | 24 px | 32 px | Título de la página |
| `cifra` | 30 px | 36 px | Valor de una tarjeta de cifra; baja por pasos de esta tabla hasta que cabe |

Pesos: `normal` 400, `medio` 500, `seminegrita` 600.

Pila de fuente: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Es la de `--font-sans` y la fuente por defecto del documento (`--default-font-family`).

### Tamaños

| Nombre | Valor | Uso |
| --- | --- | --- |
| `objetivo-minimo` | 24 px | Lado mínimo de todo objetivo de pulsación (REQ-037) |
| `control` | 40 px | Alto de botones y campos |
| `foco-grosor` | 2 px | Grosor del contorno de foco |
| `foco-separacion` | 2 px | Separación entre el control y el contorno |
| `menu-ancho` | 256 px | Ancho del menú lateral |
| `contenido-maximo` | 1440 px | Ancho máximo del contenido |

### Duraciones

Con `prefers-reduced-motion: reduce` valen 0 y el esqueleto no se anima (REQ-039).

| Nombre | Valor | Uso |
| --- | --- | --- |
| `rapida` | 120 ms | Cambios de estado de un control |
| `media` | 200 ms | Abrir y cerrar el cajón y el diálogo |
| `esqueleto` | 1500 ms | Ciclo del esqueleto de carga |

### Puntos de ruptura

Las variantes responsivas (`sm:`, `md:`...) parten de estos anchos; no hay otros.

| Nombre | Valor | Desde |
| --- | --- | --- |
| `sm` | `40rem` | 640 px |
| `md` | `48rem` | 768 px |
| `lg` | `64rem` | 1024 px |
| `xl` | `80rem` | 1280 px |

## Componentes base

Tarjeta de cifra (etiqueta, valor, variación con signo y periodo), etiqueta de estado, tabla con orden y paginación, gráfico de líneas y de barras, lista de alertas con acción, diálogo de confirmación para acciones que cambian algo (pausar, revocar, publicar, volver atrás), formulario con errores junto al campo, aviso temporal, estado vacío, esqueleto de carga.

Botón: variantes primario, secundario y peligro. El de peligro, con relleno rojo, es solo para la acción destructiva del diálogo de confirmación; nunca es el primero en recibir el foco al abrirlo (lo recibe «Cancelar»).

Toda acción que afecta a agentes de clientes pide confirmación y dice qué va a pasar y cuándo («Se aplicará en la siguiente revisión de cada agente»).

## Estados obligatorios de cada vista

Carga, vacío (con qué hacer a continuación), error (qué ha pasado y cómo reintentar), sin permiso y datos parciales. Una vista sin estos estados no pasa la puerta P5.

## Páginas

**Superadmin**

| Página | Contenido |
| --- | --- |
| Resumen | Clientes activos, agentes sin señal, informes de hoy, alertas abiertas, versión en cada canal, impagos |
| Clientes | Lista con estado, y ficha: licencia, códigos de activación, conexiones, informes, órdenes, reglas, suscripción |
| Versiones | Versiones registradas, qué sirve cada canal, publicar, volver atrás, métricas por versión |
| Órdenes | Pausar y reanudar, con su estado de entrega y confirmación |
| Alertas | Abiertas y resueltas, por tipo y gravedad |
| Facturación | Estado de cobro por cliente, gracia, estado manual, enlace a Stripe |
| Auditoría | Quién hizo qué y cuándo |
| Ajustes | Pausa global, administradores |

**Cliente**

| Página | Contenido |
| --- | --- |
| Resumen | Estado del agente, última revisión, cifras del periodo, si está en pausa |
| Actividad | Histórico de cifras por revisión |
| Suscripción | Estado y acceso al portal de Stripe |
| Cuenta | Sus datos de acceso |

## Gráficos

- Un gráfico, una idea. Título que dice la conclusión o la medida, ejes con unidad.
- La serie principal en el acento; las demás en grises o tonos distinguibles también sin color.
- Las líneas van sin relleno debajo: el área sugiere una cantidad acumulada y se tapa con varias series. Las barras llevan una trama distinta por serie, hasta cuatro.
- Cada gráfico tiene una tabla equivalente accesible.
- Antes de crear un gráfico se carga la skill de visualización de datos disponible en la sesión.

## Accesibilidad (WCAG 2.2 AA)

- Contraste mínimo 4,5:1 en texto y 3:1 en componentes y gráficos.
- Todo se puede usar con teclado; foco visible; orden de foco lógico.
- Objetivos táctiles de al menos 24 por 24 píxeles. `base.css` lo garantiza a botones, campos y controles con rol. Enlaces sueltos (menú, saltar al contenido, paginación): cada componente garantiza sus 24 px y se comprueban en navegador en PRUEBA-013 y PRUEBA-021; los enlaces dentro de un párrafo quedan exentos, como admite la norma.
- Formularios con etiqueta visible, errores asociados al campo y anunciados.
- Nada depende solo del color.
- Respeta la preferencia de reducir movimiento.
- Idioma de la página declarado como español.

## Textos y formatos

- Español de España, trato de tú, frases cortas, sin jerga técnica en el dashboard de cliente.
- Fechas `12 nov 2026, 08:04`; miles con punto y decimales con coma; hora de Madrid indicada cuando haya duda.
- Los botones dicen lo que hacen: «Pausar agente», «Revocar conexión», «Publicar en prueba».
- Los errores dicen qué ha pasado y qué se puede hacer. Nunca muestran datos internos.
