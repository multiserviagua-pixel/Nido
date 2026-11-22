# T-012 · Páginas de propuesta y de valores (22/11/2026)

Implementa: `ingeniero-frontend`. Pendiente de revisión independiente (`revisor`); no es ruta crítica.

## Qué se entrega

- `/muestra/propuesta-visual`: paleta (23 papeles de color y 3 degradados) en tema claro y oscuro a la vez; los tres logotipos (A, B, C) a 16, 32 y 128 px sobre claro, sobre oscuro e icono de aplicación (27 dibujos); tres vistas en los dos temas (Resumen de superadmin, tabla con el diálogo abierto, Resumen de cliente a 375 px).
- `/muestra/valores`: la escala de `valores.css` pintada (35 colores, 5 degradados, espaciado, radios, sombras en los dos temas, texto, pesos, tamaños y duraciones).
- Las dos van en el `Armazon` real (menú, cabecera, cuenta ficticia), con entradas `vista-propuesta-visual` y `vista-valores` en `inventario.ts` y carpeta fija cada una.
- Los dos temas a la vez: `propuesta.css` define `.tema-claro` y `.tema-oscuro` con los papeles de `valores.css` (sin efecto con colores forzados).

## Maquetado en vez de real (pendiente de T-010 (e) a (j))

Las tres vistas son una MAQUETA ESTÁTICA con datos ficticios y marcado local (`_vistas/propuesta/Maquetas.tsx`): tarjeta de cifra, etiqueta de estado, tabla, hueco de gráfico (SVG simple y declarado ficticio, con descripción textual), lista de alertas y diálogo. El diálogo abierto es una representación (sin Radix, sin `dialog`, velo `bg-velo`), colocado bajo la tabla y no encima para no pisar su texto. Cada maqueta va `inert` y `aria-hidden`; su descripción va en el `figcaption`. La página lo declara: «representación de la propuesta; los componentes definitivos llegan tras la validación». El menú de la maqueta repite las clases de `ListaDeAreas` con `li` (sin enlaces, que no se pueden enfocar dentro de `inert`). Los marcos de logotipo, paleta y valores sí leen los papeles y la escala reales.

## Archivos

Nuevos: `src/app/muestra/propuesta-visual/page.muestra.tsx`, `src/app/muestra/valores/page.muestra.tsx`, `src/app/muestra/_vistas/propuesta/{PaginaDeMuestra,VistaPropuesta,VistaValores,Maquetas,Paleta,Logotipo}.tsx`, `{escala,logotipos,textos-propuesta}.ts`, `propuesta.css`; `tests/unit/diseno/muestra-propuesta.test.tsx`; `tests/e2e/muestra/propuesta-visual.spec.ts`.
Modificados: `src/app/muestra/inventario.ts` (2 entradas; reservado en T-016 (i), aún no); `tests/e2e/muestra/apoyo/pares-de-color.ts` y `combinaciones.spec.ts` (PRUEBA-022 mide cada marco de tema con los valores de ese marco y su tabla; sin marcos, igual que antes).

Sin paquetes nuevos ni módulos de cliente (`paquetes-de-cliente.ts` sin tocar). Para el escáner de PRUEBA-005: `escala.ts` guarda los colores sin `#` y las sombras sin `rgb(`, y la prueba las compara con `valores.css`; los logotipos son datos con pasos de la escala (no hexadecimales) y `propuesta.css` los pinta con `var(--escala-…)`. Excepción a la regla «los componentes solo usan papeles»: la hoja de la muestra lee la escala porque los logotipos se dibujaron con pasos que no son papeles (p. ej. acento 300); el logotipo definitivo (T-015 (b)) deberá tener sus papeles.

## Pruebas

- Unitaria `muestra-propuesta.test.tsx` (37): inventario y carpetas 1 a 1, h1 único = título, control 2 y 404, sin campos ni enlaces con consulta, declaración honesta, diálogo sin `dialog`/controles, paleta en los dos temas, 27 logotipos, 6 marcos de vista y 375 px, gráfico ficticio con descripción, escala completa en la página, y deriva: `ESCALA`/`SOMBRAS` = `valores.css`, clases `.m-*` = pasos, `.tema-*` = papeles claros y oscuros de `valores.css`, cada forma de logotipo = su SVG. **Rojo observado antes de implementar: 22 fallos de 37** (páginas y datos de página inexistentes; las 15 pruebas de deriva pasaban porque los datos se generaron antes).
- En navegador (Chromium): PRUEBA-025 (axe, 320 y 1280, claro y oscuro), PRUEBA-013 (nueve anchos, zum, espaciado, ancho máximo), PRUEBA-022 (pares, ambos temas), red y dirección, colores forzados y movimiento, de las dos páginas, más `propuesta-visual.spec.ts` (temas a la vez con el sistema en claro y en oscuro, colores de cada papel y de cada paso, tamaños de los 27 logotipos, marco de 375 px y encogido a 320, maquetas no enfocables con el tabulador, velo, declaración). **Primera pasada: 72 pasadas y 4 fallos reales** (solapes y desbordamiento a 320 con espaciado de texto: diálogo sobre la tabla, columnas, filas de texto de valores; enlaces `inert` sin contorno de foco en PRUEBA-022). Corregido; **segunda pasada: 76 de 76**.

## Comandos y resultado

- `npx vitest run tests/unit/diseno --maxWorkers=2`: 31 archivos, 1098 en verde.
- `npm run tipos`: sin errores. `eslint` y `prettier --check` sobre lo tocado: limpios.
- Playwright solo de estas páginas, con configuración derivada fuera del repo, puerto 3116 y el candado: `-g "vista-propuesta-visual|vista-valores|propuesta visual ·"`: 76 de 76.

## No se comprobó

- Playwright completo, build suelto y vitest completo (los pasa el orquestador); Firefox y WebKit; lector de pantalla; el efecto real del velo con el cajón (T-013).
- PRUEBA-022 no mide `fill`/`stroke` de SVG (límite conocido): ni el hueco de gráfico ni los logotipos.
- La mutación de las pruebas de deriva solo se razonó, no se ejecutó.
- Las vistas no son los componentes definitivos (arriba).

## Vuelta atrás

`git revert` del commit: quita las dos páginas, sus entradas del inventario, la hoja y las pruebas, y devuelve `pares-de-color.ts` a su forma anterior. Nada fuera de la muestra cambia.

## Ejecución final del orquestador (22/11/2026, sobre `ff33a8a`)

`npx playwright test --config playwright.config.ts` (oficial, puerto 3100, `tests/e2e` completo): **939 ejecutadas sin fallo**, 0 saltadas, 0 intermitentes, 211 s. Unitarias de `tests/unit/diseno`: 31 archivos, 1098 en verde. Tipos y `eslint` en 0. Vitest completo, a cargo de la coordinación. Revisor: APTO CON MENORES (los menores, en `evidencias/T-011/resultado.md`).
