# Propuesta visual (020, T-011)

Estado: **PROPUESTA, pendiente de validación del responsable (T-013)**. Autor: `disenador-ui`, 22/11/2026. Los valores están en `src/components/estilos/valores.css`, los pares en `src/components/estilos/combinaciones.ts` y las tablas completas, con el contraste calculado, en `docs/DISENO.md`. Este texto razona las opciones.

## 1. De dónde parte

La captura de `docs/referencia/dashboard-referencia.jpg` (D-004) marca la estructura y el tono: menú lateral azul noche con el área actual resaltada, página casi blanca, tarjetas de cifras en fila, gráficos y botón primario en un morado, estados en verde, ámbar y rojo. Se toma esa gama y esa estructura. No se copia su marca, sus textos ni su iconografía.

## 2. Paleta

**Opción elegida: un solo acento morado** (`#6C3CE9` en claro, `#A78BFA` en oscuro), neutros azulados (tipo pizarra) y un menú azul noche (`#0B1230` a `#151C45`) que es el mismo en los dos temas (REQ-002).

| Opción | Motivo para descartarla |
| --- | --- |
| Acento azul o verde, más corporativo | Se aleja de la referencia que el responsable ya ha visto y aprobado como orientación. Sin ventaja de contraste: el morado llega a 6,07:1 sobre blanco |
| Dos acentos (morado y uno cálido) | REQ-030 pide uno solo. Los gráficos se distinguen por trazo y forma, no por un segundo color |
| Menú claro en el tema claro | La referencia lo lleva oscuro, y un menú oscuro fijo evita duplicar todos los pares del menú |

Cómo se lee la paleta (todo medido; cifras en `docs/DISENO.md`, «Contraste calculado»):

- Texto principal `#0F172A` sobre página `#F8FAFC`: 17,06:1 en claro; `#F1F5F9` sobre `#0B1120`: 17,19:1 en oscuro.
- Texto secundario: 7,24:1 sobre la página en claro (`#475569`) y 8,56:1 en oscuro.
- Botón primario, texto blanco sobre el acento: 6,07:1; sobre su degradado, 5,51:1 en el peor de 33 puntos. En oscuro, 5,27:1.
- Enlaces: 5,80:1 sobre la página en claro, 6,92:1 en oscuro.
- Estados (correcto, aviso, error): todos por encima de 4,79:1 en claro y 9,59:1 en oscuro, y siempre con palabra o icono (REQ-085).
- Foco: 4,05:1 sobre la página en claro y 3,86:1 en el peor punto del menú; 3:1 como mínimo en todo fondo donde se pinta.
- Borde de controles: 4,55:1 en claro. Borde decorativo `#E5E7EB` (1,24:1): solo separa tarjetas, nunca delimita un control.

**Degradados** (REQ-085): menú (azul noche a azul noche más claro), botón primario (acento a acento más oscuro; en oscuro, más claro) y relleno bajo la línea de la serie principal (acento muy suave a la superficie). Son sutiles: ninguno es el único medio de transmitir algo, y con colores forzados valen `none`. Cada texto sobre un degradado se mide en 33 puntos.

**Escala**: espaciado en múltiplos de 4 px (0 a 64), radios 4, 8 y 12 px (más el completo), dos sombras de elevación sutiles (de tarjeta y elevada) y seis tamaños de texto de 12 a 30 px. Es la escala de partida de T-006, sin cambios: la propuesta visual no la ha necesitado.

### Diferencias con lo anterior

Lo único que cambia en esta tarea es el **velo** (apartado siguiente). El resto de los valores se mantiene porque ya cumplían: la tabla «Diferencias con los valores iniciales» de `docs/DISENO.md` sigue explicando los cambios respecto al borrador inicial, y se le han añadido las dos filas de T-011.

## 3. Velo del cajón y del panel de la cuenta (menor 12.6)

Antes, el cajón del menú y el panel de la cuenta se abrían sin oscurecer el fondo. Ahora llevan un velo (`--sombra-velo`, utilidad `bg-velo`): `rgb(15 23 42 / 0.5)` en claro y `rgb(11 17 32 / 0.7)` en oscuro. Se declara junto a las sombras porque es la otra capa con transparencia; PRUEBA-005 comprueba que su color es de la escala. Con colores forzados vale `none` y separa el borde del diálogo.

El velo no lleva texto, así que no pide 4,5:1; lo que importa es que el borde del diálogo se distinga del fondo atenuado (3:1, no texto). Medido (tabla «Velo»):

- Cajón: se añade un borde derecho `--menu-texto` (`#F1F5F9`): 3,21:1 sobre la página y 3,11:1 sobre una tarjeta atenuadas en claro; más de 16:1 en oscuro.
- Panel de la cuenta: en claro se separa por su superficie blanca (3,51:1 y 3,41:1); el borde de control, que ahora lleva, no llega (1,36:1) y no se declara. En oscuro la superficie casi no se distingue (1,13:1) y es el borde de control el que separa (5,45:1 y 5,27:1).
- Limitación honesta: un fondo oscuro no se puede oscurecer más. En oscuro el velo atenúa sobre todo las tarjetas; el resto lo hacen los bordes.

Cambios de componente imprescindibles: `Overlay` con `bg-velo` en `CajonMenu` y `PanelModal`, borde del cajón y borde del panel. Pares en `PARES_CON_VELO` de `combinaciones.ts`; los mide `contraste.test.ts`.

## 4. Cabecera fija (validación del umbral de 38 rem)

La cabecera es fija solo si la ventana mide 38 rem (608 px) de alto o más (variante `alto-suficiente`). El peor caso medido por la prueba de navegador es 320 px de ancho con un nombre de 120 caracteres: unos 240 px, el 39 % de 608 px, por debajo del tope del 40 % (el mismo que se usa para los avisos, REQ-072). Con menos alto, la cabecera se desplaza con la página y no reserva nada.

**Veredicto: se mantiene 38 rem.** Motivos: (1) la cabecera de peor caso solo se da con nombres extremos; la habitual es menor (sin medir aquí: lo cubre la prueba de navegador de T-010 (c)); (2) cualquier ventana por debajo (móviles apaisados, zum del 400 % sobre 1280×1024, que da 320×256) deja de tener cabecera fija, así que no hay riesgo de tapar el contenido ni el foco (WCAG 2.4.11 se cumple además con `scroll-padding-top`); (3) subir el umbral a 40 rem daría más margen (37,5 %) pero cambiaría el caso límite de 608 px que ya cubre Playwright, sin ganar nada en la práctica. Si el responsable prefiere más margen, es un cambio de una línea en `valores.css` y de una cifra en `cabecera.spec.ts`. `diseno.md` («Cabecera») se ha actualizado: ya no dice solo «queda fija arriba».

## 5. Tipografía

**Opción elegida: la pila sin remates del sistema**, `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`, sin descargar ninguna fuente. Motivos: no hay licencia que registrar, no hay petición de terceros ni propia (REQ-031, regla de interfaz), no hay parpadeo ni desplazamiento al cargar, y cada plataforma usa su fuente nativa, que es la que el usuario ya lee mejor.

| Opción | Motivo para descartarla hoy |
| --- | --- |
| Fuente abierta (Inter u otra) con `next/font/local` | Añade un archivo, su licencia (SIL OFL) y el ajuste de métricas. Se puede incorporar luego sin tocar componentes porque la fuente es un solo valor (`--font-sans`); el diseño ya lo prevé |
| Fuente de Google Fonts | Prohibida: carga de terceros en tiempo de ejecución |

Las cifras llevan `font-variant-numeric: tabular-nums` (en tablas y en todo `[data-cifra]`, `base.css`): se alinean en columna y no bailan al cambiar. PRUEBA-020 (fuente bloqueada: cifras del mismo ancho, y con la fuente de respaldo el texto no se corta) ya existe en `tests/e2e/muestra/tema-y-movimiento.spec.ts` y sigue valiendo, porque la pila no ha cambiado. Pesos 400, 500 y 600; tamaños de 12 a 30 px; la cifra grande baja por pasos hasta que cabe.

## 6. Logotipos

Tres propuestas, cada una con tres SVG (`menu-oscuro.svg` para el menú azul noche, `fondo-claro.svg` para la página y `icono.svg`, un icono de aplicación con su propio fondo en el degradado del acento), en `specs/020-sistema-diseno-armazon/propuesta-visual/logotipos/propuesta-<letra>/`. Solo llevan formas, un degradado y un título: sin guiones, enlaces, estilos en línea ni texto con fuente (el nombre «HumanaIA» va en HTML junto al logotipo). Usan solo colores de la paleta. `tests/unit/diseno/logotipos.test.ts` comprueba que están limpios, que son tres propuestas distintas de forma y que cada color llega a 3:1 sobre su fondo.

| Propuesta | Forma | Idea | Lectura a 16 px |
| --- | --- | --- | --- |
| **A. Pájaro en el nido** | Un pájaro geométrico (elipse, círculo, triángulos) sobre un cuenco de dos arcos | Es literal y cercana: un nido con su habitante. Su silueta es la más reconocible a tamaño grande | Se lee como pájaro sobre un arco; el ojo y el pico se pierden |
| **B. Nido de capas** | Un círculo (el huevo) sobre tres barras redondeadas que se estrechan: macizo, sin curvas finas | Nido como capas de datos; la más tecnológica y la más sobria | La que mejor aguanta a 16 px: círculo y tres barras |
| **C. Nido en anillo** | Nido visto desde arriba: anillo abierto con dos nodos, anillo interior y un huevo | Evoca un circuito y una órbita; es la menos literal | Es la que más pierde a 16 px (el anillo interior se funde) |

**Recomendación:** B si se quiere sobriedad y un icono que funcione en la pestaña del navegador; A si se quiere que el nido de aves se reconozca a primera vista. Ninguna usa un color fuera de la paleta ni rompe el criterio de un solo acento. La elección es del responsable (CA-055): el logotipo elegido pasa luego a `src/components/marca/` y a `icon.svg`, `favicon.ico` y `apple-icon.png`.

## 7. Qué debe ver el responsable en T-013

1. `/muestra/propuesta-visual` (la monta T-012): paleta y degradados en claro y oscuro, los tres logotipos a 16, 32 y 128 px sobre claro y oscuro, y las tres vistas (Resumen de superadmin, tabla con el diálogo abierto, Resumen de cliente a 375 px).
2. Abrir el menú en móvil (cajón con velo) y el panel de la cuenta: se ve atenuado el fondo.
3. Decidir: (a) si la paleta de la referencia, en morado, le vale; (b) cuál de los tres logotipos; (c) si el umbral de cabecera fija se queda en 38 rem.

## 8. Qué no se ha podido comprobar

- Nada se ha visto aún en navegador: el contraste es de cálculo (script de la prueba, fórmula de WCAG 2.2) y los logotipos se han visto solo como imagen generada a partir de los SVG. El velo con un navegador real, y el borde nuevo del cajón, los revisará `revisor` en T-013 con Playwright.
- El efecto del velo en oscuro es discreto y es una decisión de diseño que el responsable puede querer ajustar.
- Los pares de colores forzados no se miden (el sistema los elige).

## 9. Validación del responsable

Pendiente. Sin esta validación escrita y con fecha no empieza ninguna tarea de vistas (CA-055).

| Fecha | Decisión | Logotipo elegido | Cambios pedidos |
| --- | --- | --- | --- |
| | | | |
