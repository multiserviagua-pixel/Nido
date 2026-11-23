# T-015 · Valores definitivos y logotipo elegido

Fecha: 23/11/2026. Rama `tarea/020-T-014` (sin commit). Autor: `disenador-ui`. REQ-029, REQ-033, REQ-087, REQ-088; CA-054 a CA-057.

## (a) Valores definitivos

El responsable validó el 22/11/2026 («Logo C, aprobada») sin pedir cambios: ningún valor cambia (`valores.css` intacto).

- `docs/DISENO.md`: estado «definitivo, validado por el responsable el 22/11/2026» y sección nueva «Logotipo y nombre» (papeles que usa cada variante, simplificación a tamaño pequeño, origen de los iconos).
- `propuesta-visual.md` §6: el nombre es «Nido: Agentes de Correo» (`TEXTOS.marca.nombreProducto`), no «HumanaIA»; anotado que los logotipos A y B se retiran («solo se arregla el elegido, los menores de A y B se retiran»); referencia al velo corregida (menor 6).
- `evidencias/T-011/resultado.md`: tabla «Saldo de los menores en T-015».
- Menores de T-011 arreglados: 1 (`logotipos.test.ts` mide los 33 puntos del icono sobre la página clara y fija que sobre la oscura solo llega el extremo claro, el oscuro da 2,48:1), 6 y 7 (ruido de coma flotante en los SVG de C y en `logotipos.ts`). Retirado: 2 (de A). Siguen abiertos por no ser de logotipo ni de valores: 3, 4, 5.
- Los SVG de A y B y su dibujo en `/muestra/propuesta-visual` se conservan: `logotipos.test.ts` exige tres propuestas y PRUEBA-023 cuenta 27 logotipos en la maqueta; no se relaja ningún control. Los SVG de C cambian su título a «Nido: Agentes de Correo, Nido en anillo».

## (b) Logotipo C

- `src/components/marca/LogotipoNido.tsx`: SVG sin texto ni colores literales; pinta con papeles por clases (`menu-oscuro`: `--menu-indicador` y `--menu-texto`; `fondo-claro`: `--acento`, `--serie-4` y `--texto`; `icono`: caja con `bg-degradado-acento` y `--texto-sobre-acento`). Decorativo (`aria-hidden="true"`, `focusable="false"`). No usa `style` (lo prohíbe PRUEBA-005): el radio del icono es `rounded-medio` hasta 40 px y `rounded-grande` por encima.
- `MarcaDelProducto.tsx` (logotipo 32 px + `TEXTOS.marca.nombreProducto`), `index.ts` y `LICENCIAS.md` (dibujo propio, sin terceros).
- Montado arriba en `MenuLateral.tsx` y, antes de la fila «Menú / Cerrar», en `CajonMenu.tsx`. El nombre se anuncia una vez.
- Cambios de diseño sobre lo aprobado, todos mínimos: en `menu-oscuro` el anillo interior usa el mismo papel que el anillo (era `#B39BFB` frente a `#A78BFA`, un paso de diferencia: no hay papel intermedio y no se añade un papel solo para eso); por debajo de 24 px el anillo interior se omite y el huevo crece, porque a 16 px se funde (se ve en las capturas).
- Iconos: `scripts/generar-iconos.mjs` (usa el Chromium de Playwright, ya de desarrollo; sin dependencias nuevas) genera `src/app/icon.svg` (forma simplificada), `src/app/favicon.ico` (16, 32 y 48 px, PNG dentro de ICO, escrito a mano) y `src/app/apple-icon.png` (180 px, fondo a sangre). Comprobado a ojo a 16, 32 y 96 px y a 180 px: la forma se lee. Los hexadecimales del script son los dos extremos del degradado del acento y blanco; `icon.svg` está exento de colores literales (PRUEBA-005).
- `marca.spec.ts` no se ha tocado: el selector valió tal cual (en el cajón la marca va primero en el DOM, así que el primer `svg` fuera de lista es el logotipo y no el aspa de cerrar).
- Pruebas ajustadas por el cambio de contenido del menú: `armazon.test.tsx` y `menu-lateral.test.tsx` contaban los `svg` del menú (5 y 5 áreas); ahora cuentan las áreas más el logotipo, todos `aria-hidden`.
- No se ha tocado `inventario.ts`, `excepciones.ts` ni `paquetes-de-cliente.ts`. No hace falta paquete de cliente nuevo.

## Comandos y resultado

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 33 archivos, 1144 pruebas superadas (PRUEBA-005, 006, 008 y 022 de unidad incluidas) |
| Playwright `tests/e2e/muestra` completo (copia de la configuración con el puerto 3140, borrada; compila dentro) | 1022 superadas, 0 fallos, 4,1 min. `marca.spec.ts` entera en verde (39 casos), y PRUEBA-025, 022, 012 y 021 de la muestra con el menú y el cajón nuevos |
| `npm run tipos` | sin errores |
| `eslint --max-warnings 0` sobre `src/components/marca`, `src/components/armazon`, el script y `logotipos.test.ts` | sin hallazgos |
| `prettier --check` de lo tocado (incluidos `docs/DISENO.md` y los tres componentes) | sin errores |
| `ENTORNO=preproduccion npm run build` | correcto |
| vitest completo | no ejecutado (a cargo de la coordinación) |

Capturas nuevas por la prueba: `evidencias/T-014/capturas/menu-16.png` y `menu-32.png` (sin versionar aún).

## Lo no comprobado

- Firefox, WebKit y lector de pantalla real: solo Chromium y árbol de accesibilidad de Playwright.
- Cómo se ven `favicon.ico` y `apple-icon.png` en un navegador o un dispositivo iOS reales; se comprobó la imagen, no su uso. Con la ruta `/icon.svg` bajo un acceso protegido no se ha probado que el navegador pueda pedirlo sin sesión.
- Contraste del logotipo medido por cálculo solo para los SVG de la propuesta; el del componente reutiliza papeles ya medidos (`--menu-indicador` y `--menu-texto` sobre el menú, 6,01:1 y más), pero `--serie-4` como anillo interior de `fondo-claro` no se usa aún en ninguna vista (no hay par declarado).

## Menores

1. `fondo-claro` e `icono` del componente no están montados en ninguna vista hoy (login, cabecera móvil): los verá `qa` cuando se usen; si un uso suelto no lleva el nombre al lado, necesita su propio nombre accesible.
2. A 375 px el nombre en el cajón ocupa dos líneas bajo el logotipo de 32 px; a 256 px de menú lateral también (se comprobó que no desborda, no con capturas de todos los casos).
3. El cajón repite el título «Menú» bajo la marca; si el responsable prefiere solo la marca, `Dialog.Title` pasaría a ser solo para lectores de pantalla (cambio de prueba).
4. Los menores 3, 4 y 5 de T-011 siguen abiertos.
