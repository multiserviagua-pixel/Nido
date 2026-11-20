# Diseño: sistema visual, páginas y accesibilidad

Estado: PROPUESTA de referencia. La escala y los papeles de «Escala y papeles» son los valores de partida de la función 020 (T-006, parte a), con el contraste calculado; los definitivos salen de la propuesta visual que valida el responsable (REQ-086) y esta tabla cambia con ellos.

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

Formato: colores en hexadecimal sRGB opaco; sin transparencia en texto, fondos ni bordes (solo las sombras la llevan). Degradados lineales entre dos colores de la misma rampa, interpolados en sRGB.

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
| `--acento` | Botón primario, enlaces, selección | `#6C3CE9` | `#6C3CE9` | `#A78BFA` | `Highlight` |
| `--texto-sobre-acento` | Texto del botón primario | — | `#FFFFFF` | `#0F172A` | `HighlightText` |
| `--acento-suave` | Fondo de selección y de iconos | `#EFE9FF` | `#EFE9FF` | `#2A2152` | `Canvas` |
| `--foco` | Contorno de foco, en todo control | — | `#8B5CF6` | `#A78BFA` | `Highlight` |
| `--menu-fondo` | Fondo plano del menú | `#0B1230` | `#0B1230` | `#0B1230` | `Canvas` |
| `--menu-texto` | Entradas del menú | — | `#F1F5F9` | `#F1F5F9` | `CanvasText` |
| `--menu-texto-secundario` | Textos menores del menú | — | `#A3AECB` | `#A3AECB` | `CanvasText` |
| `--menu-actual` | Fondo del área actual | — | `#1F2757` | `#1F2757` | `Canvas` |
| `--menu-indicador` | Barra lateral del área actual | — | `#A78BFA` | `#A78BFA` | `Highlight` |
| `--correcto` | Estado correcto, con palabra o icono | `#15803D` | `#15803D` | `#4ADE80` | `CanvasText` |
| `--aviso` | Estado de aviso, con palabra o icono | `#B45309` | `#B45309` | `#FBBF24` | `CanvasText` |
| `--error` | Estado de error, con palabra o icono | `#B91C1C` | `#B91C1C` | `#F87171` | `CanvasText` |
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
| `--degradado-grafico` | Relleno bajo la línea de la serie principal | `#EFE9FF` → `#FFFFFF` | `#2A2152` → `#151E2E` | `none` |

Un degradado nunca es el único medio de transmitir una información (REQ-085). Con colores forzados pasan a `none` y queda el color plano del papel.

### Contraste calculado

Fórmula de luminancia relativa de WCAG 2.2. Umbrales: 4,5:1 en todo texto, también el grande; 3:1 en bordes de controles, foco, estados, iconos con significado y series. Sobre un degradado se miden 33 puntos interpolados en sRGB y se da el peor. Cálculo del `disenador-ui` con un script propio el 20/11/2026; lo sustituye el informe de PRUEBA-006 cuando exista `combinaciones.ts`.

| Delante | Detrás | Tipo | Claro | Oscuro |
| --- | --- | --- | --- | --- |
| `--texto` | `--fondo-pagina` | Texto | 17,06 | 17,19 |
| `--texto` | `--superficie` | Texto | 17,85 | 15,25 |
| `--texto` | `--acento-suave` | Texto | 15,11 | 13,33 |
| `--texto-secundario` | `--fondo-pagina` | Texto | 7,24 | 8,56 |
| `--texto-secundario` | `--superficie` | Texto | 7,58 | 7,59 |
| `--texto-secundario` | `--acento-suave` | Texto | 6,41 | 6,64 |
| `--acento` | `--fondo-pagina` | Texto (enlace) | 5,80 | 6,92 |
| `--acento` | `--superficie` | Texto (enlace) | 6,07 | 6,14 |
| `--acento` | `--acento-suave` | Texto | 5,13 | 5,37 |
| `--texto-sobre-acento` | `--acento` | Texto | 6,07 | 6,56 |
| `--texto-sobre-acento` | `--degradado-acento` (peor punto) | Texto | 5,51 | 5,27 |
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
| `--serie-1` | `--superficie` / `--degradado-grafico` (peor punto) | No texto | 6,07 / 5,13 | 6,14 / 5,37 |
| `--serie-2` | `--superficie` / `--degradado-grafico` (peor punto) | No texto | 10,35 / 8,76 | 11,25 / 9,84 |
| `--serie-3` | `--superficie` / `--degradado-grafico` (peor punto) | No texto | 4,76 / 4,03 | 4,83 / 4,22 |
| `--serie-4` | `--superficie` / `--degradado-grafico` (peor punto) | No texto | 9,64 / 8,15 | 10,58 / 9,25 |

**Combinaciones prohibidas.** No llegan al umbral y no se declaran en `combinaciones.ts`:

| Delante | Detrás | Claro | Motivo |
| --- | --- | --- | --- |
| `--correcto` | `--acento-suave` | 4,24 | Texto por debajo de 4,5:1. Una etiqueta de estado no va sobre fondo de selección |
| `--aviso` | `--acento-suave` | 4,25 | Ídem |
| `--borde-decorativo` | cualquier fondo | 1,24 sobre `--superficie` | No sirve para delimitar un control; para eso está `--borde-control` |
| `--foco` | `--acento` | 1,43 | El contorno de foco nunca se pinta pegado al botón primario: va separado 2 px, sobre el fondo |
| `--texto-sobre-acento` | `--foco` | 4,23 | `--foco` no es un fondo |

### Diferencias con los valores iniciales

Solo se ha cambiado lo que no llegaba al contraste en un uso previsto. El resto de los valores iniciales se mantiene.

| Papel | Inicial | Ahora (claro) | Motivo |
| --- | --- | --- | --- |
| `--texto-secundario` | `#64748B` | `#475569` | Sobre `--acento-suave` daba 4,03:1 (no llega a 4,5:1) y sobre `--fondo-pagina`, 4,55:1, sin margen. Se baja un paso en la misma rampa: 6,41:1 y 7,24:1 |
| Borde de tarjeta y de control | `#E5E7EB` para los dos | `--borde-decorativo` `#E5E7EB` y `--borde-control` `#64748B` (nuevo) | `#E5E7EB` sobre blanco da 1,24:1: vale para separar tarjetas, no para el borde de un campo, que pide 3:1. El borde de control usa el valor inicial del texto secundario: 4,76:1 |
| Acento sobre el menú | `#6C3CE9` (3,03:1 sobre `#0B1230`, sin margen, y 2,70:1 sobre `#151C45`, el extremo claro del degradado del menú) | `--menu-indicador` `#A78BFA` y `--foco` `#8B5CF6` (nuevos) | El acento no se usa sobre el menú. El indicador del área actual y el foco usan pasos más claros del mismo tono: 6,01:1 y 3,86:1 en el peor punto. El acento `#6C3CE9` no cambia |
| `--correcto`, `--aviso` sobre `--acento-suave` | — | Sin cambio de valor | 4,24:1 y 4,25:1. Se prohíbe la combinación en lugar de oscurecer los dos colores de estado, que cumplen en los fondos donde se usan |
| Tema oscuro | No existía | Columna «Oscuro» | Nuevo por REQ-088. Mismo tono de acento en pasos más claros |

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
| `tarjeta` | `0 1px 2px 0 rgb(15 23 42 / 0.06)` | `0 1px 2px 0 rgb(0 0 0 / 0.40)` | Tarjetas |
| `elevada` | `0 8px 24px -4px rgb(15 23 42 / 0.16)` | `0 8px 24px -4px rgb(0 0 0 / 0.60)` | Diálogo, cajón del menú, avisos |

### Texto

Tipografía sin remates del sistema o una fuente abierta alojada en nuestro dominio (no se cargan fuentes de terceros en tiempo de ejecución); la elige la propuesta visual. Cifras con números tabulares.

| Nombre | Tamaño | Altura de línea | Uso |
| --- | --- | --- | --- |
| `pequeno` | 12 px | 16 px | Notas, periodo de una tarjeta |
| `cuerpo-menor` | 14 px | 20 px | Tablas, etiquetas |
| `cuerpo` | 16 px | 24 px | Texto general, campos |
| `subtitulo` | 18 px | 28 px | Títulos de tarjeta y de sección |
| `titulo` | 24 px | 32 px | Título de la página |
| `cifra` | 30 px | 36 px | Valor de una tarjeta de cifra; baja por pasos de esta tabla hasta que cabe |

Pesos: `normal` 400, `medio` 500, `seminegrita` 600.

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

## Componentes base

Tarjeta de cifra (etiqueta, valor, variación con signo y periodo), etiqueta de estado, tabla con orden y paginación, gráfico de líneas y de barras, lista de alertas con acción, diálogo de confirmación para acciones que cambian algo (pausar, revocar, publicar, volver atrás), formulario con errores junto al campo, aviso temporal, estado vacío, esqueleto de carga.

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
- Cada gráfico tiene una tabla equivalente accesible.
- Antes de crear un gráfico se carga la skill de visualización de datos disponible en la sesión.

## Accesibilidad (WCAG 2.2 AA)

- Contraste mínimo 4,5:1 en texto y 3:1 en componentes y gráficos.
- Todo se puede usar con teclado; foco visible; orden de foco lógico.
- Objetivos táctiles de al menos 24 por 24 píxeles.
- Formularios con etiqueta visible, errores asociados al campo y anunciados.
- Nada depende solo del color.
- Respeta la preferencia de reducir movimiento.
- Idioma de la página declarado como español.

## Textos y formatos

- Español de España, trato de tú, frases cortas, sin jerga técnica en el dashboard de cliente.
- Fechas `12 nov 2026, 08:04`; miles con punto y decimales con coma; hora de Madrid indicada cuando haya duda.
- Los botones dicen lo que hacen: «Pausar agente», «Revocar conexión», «Publicar en prueba».
- Los errores dicen qué ha pasado y qué se puede hacer. Nunca muestran datos internos.
