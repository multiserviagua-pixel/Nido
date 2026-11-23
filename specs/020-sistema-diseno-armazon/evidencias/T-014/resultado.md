# T-014 · Prueba del logotipo y del nombre (PRUEBA-023)

Fecha: 23/11/2026. Rama `tarea/020-T-014` (sin commit). Entorno: Windows 11, Node 26, Chromium de Playwright, 1 worker, compilación local con `ENTORNO=preproduccion`. Cubre REQ-087 y CA-056 en lo que se puede comprobar antes de T-015 (b). Datos: solo los de la muestra, ficticios.

**Estado de la tarea: escrita; 23 en verde y 16 en rojo esperado.** No cumple el «en verde» de `tareas.md` hasta que T-015 (b) monte el logotipo (ver «Rojo esperado»). Nada saltado, ni `test.skip` ni `test.fail`.

## Nombre del producto

`TEXTOS.marca.nombreProducto` = **«Nido: Agentes de Correo»** (`src/components/textos.ts`; REQ-087, aclaración 2 de `aclaraciones.md`). Plantilla del título en `src/app/layout.tsx`: `<título de la vista> · Nido: Agentes de Correo`. La prueba lee la constante, no la copia; además fija su valor literal. Ojo: `propuesta-visual.md` §6 dice que el nombre en HTML junto al logotipo es «HumanaIA»: contradice la constante y el diseño (menor de documentación, para T-015).

## Archivo

`tests/e2e/muestra/marca.spec.ts`. Genera los casos a partir del inventario (`apoyo/estados.ts`), sin lista propia.

Contrato que fija (para T-015 (b)):

1. Título de cada vista = `<título propio no vacío> · Nido: Agentes de Correo`, sin repetir el nombre en la parte de la vista.
2. El menú (lateral a 1280 px y cajón a 375 px) lleva, fuera de la lista de áreas, un `svg` (el logotipo) y el nombre como texto visible.
3. El nombre accesible sale exactamente una vez en el árbol de accesibilidad del menú y el logotipo junto al texto lleva `aria-hidden="true"`.
4. Hay componentes (`.ts`/`.tsx`) en `src/components/marca/`.
5. Capturas del logotipo del menú a 16 y 32 px (`menu-16.png`, `menu-32.png`).

## En verde (23)

| Caso | Resultado |
| --- | --- |
| Nombre = constante y literal «Nido: Agentes de Correo» | superada |
| Título con el nombre, 1 caso por cada estado del inventario (17 estados) | superada, 17 |
| Títulos únicos en todo el inventario; y hay armazones que recorrer | superada, 2 |
| Maqueta `/muestra/propuesta-visual`: logotipos C a 16 y 32 px (3 variantes x 2 tamaños) se pintan, miden 16 y 32 px exactos en la captura y la captura cambia si se oculta el dibujo (control: no es una imagen vacía); claro y oscuro del sistema, 12 PNG | superada, 2 |
| Maqueta: los 27 logotipos son decorativos (`aria-hidden="true"`, sin `role` ni `aria-label`) | superada |

Capturas: `evidencias/T-014/capturas/maqueta-c-<variante>-<fondo>-<lado>-<tema>.png` (12). Mirada una a 32 px: el anillo, los dos nodos, el anillo interior y el huevo se distinguen; a 16 px el anillo interior se funde, como ya decía `propuesta-visual.md` §6 (la lectura a 16 px es juicio del diseñador en T-015 (b); esta prueba solo exige que se pinte y tenga el tamaño).

## En rojo esperado (16), «pendiente de T-015 (b)»

Todos fallan por falta del montaje, con el mensaje `pendiente de T-015 (b): ...`:

- `src/components/marca/` no existe (1).
- Menú lateral sin logotipo ni nombre en las 13 combinaciones de armazón (7 de superadmin y 6 de cliente) (13). Hoy: 5 y 4 `svg`, todos iconos de áreas.
- Cajón a 375 px sin el nombre (1). El cajón abre bien; solo falta la marca (`MenúResumenActividadSuscripciónCuenta`).
- Capturas del logotipo del menú a 16 y 32 px (1): falla por la misma causa antes de capturar; no hay `menu-16.png` ni `menu-32.png`.

Quedan por verificar cuando exista el montaje: nombre accesible una sola vez, `aria-hidden` del logotipo junto al texto y capturas del menú. Un logotipo que informe por sí solo (sin texto al lado) no tiene lugar hoy en el menú; si T-015 (b) añade uno (p. ej. cabecera móvil), hay que ampliar la prueba.

## Comandos y resultado

| Comando | Resultado |
| --- | --- |
| `npx playwright test --config <copia de playwright.config.ts con el puerto 3127> tests/e2e/muestra/marca.spec.ts` (compila dentro; el oficial usa el 3100 y estaba ocupado en el 3112 por otro proceso; la copia se borró) | 23 superadas, 16 falladas (las de arriba), 0 saltadas, 40 s |
| `npx vitest run tests/unit/diseno` | 33 archivos, 1144 pruebas superadas |
| `npm run tipos` | sin errores |
| `prettier --check` y `eslint --max-warnings 0` sobre `marca.spec.ts` | sin errores |
| `npm run estilo` completo, vitest completo, `build` aparte | no ejecutados (vitest completo, a cargo de la coordinación; el build lo hizo Playwright) |

## Lo que no se pudo comprobar

- Que los títulos y la marca se vean igual en Firefox y WebKit y con lector de pantalla (solo Chromium y árbol de accesibilidad de Playwright).
- Favicon e iconos (`icon.svg`, `favicon.ico`, `apple-icon.png`): PRUEBA-008 y T-015 (b).
- Mutación del título: no se probó cambiando `layout.tsx` (es `src/`); la prueba lee la plantilla del navegador y fallaría si el sufijo cambiara.
- Selector del logotipo del menú: `svg` fuera de `ul`/`li` dentro del `nav`/cajón. Si T-015 (b) lo coloca dentro de una lista, habrá que ajustar la prueba (lo ve `qa`, no se relaja).
