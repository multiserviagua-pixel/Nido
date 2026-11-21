# T-009 (a)(b)(c) · Resultado tras las correcciones del revisor

Rama `tarea/020-T-009a`, sobre el commit base `757ca53`. Entorno: local (Windows 11, Node 26, Chromium de Playwright, 1 worker). Autor: `qa`. Todos los datos de prueba son ficticios (`TESTIGO-...-018`, `*.invalid`).

## Ejecuciones

```
commit:    b593e6a (rama tarea/020-T-009a; base 757ca53)
prueba:    PRUEBA-013, PRUEBA-018, PRUEBA-020, PRUEBA-022, PRUEBA-025, PRUEBA-026 (parte sembrada)
fecha:     2026-11-21
entorno:   local
comando:   playwright test --config <configuración oficial con el puerto 3110> tests/e2e/muestra
resultado: 66 ejecutadas sin fallo (de ellas, 2 solo anotan y 6 comprueban solo una parte; ver más abajo; salida en playwright-salida.txt)
revisor:   pendiente
```

Puerto: `playwright.config.ts` fija el 3100 y lo ocupa un `next start` viejo (PID 19280) que no se reutiliza (`reuseExistingServer: false`). Sin tocar la configuración oficial, se usó un archivo fuera del repositorio que la importa con `...oficial` y solo cambia puerto (3110), rutas absolutas y un worker. Ese archivo no está en el repositorio. Se retiró `pw-dev.config.ts` (A-12). La orden oficial `npm run navegador` queda pendiente: se ejecutará en CI o con el 3100 libre, antes de P7.

| Orden | Código de salida | Resultado |
| --- | --- | --- |
| Playwright (a)(b)(c), 1 worker, puerto 3110 | 0 | 66 ejecutadas sin fallo, 0 fallidas, 0 saltadas, 0 intermitentes (ver «Qué comprueba cada una») |
| `npm run tipos` | 0 | sin errores |
| `npm run estilo` | 0 | Prettier y ESLint sin hallazgos |
| `npm run aislamiento` | 0 | 45 de 45 |
| `npm run arnes` | 0 | sin errores |
| `ENTORNO=preproduccion npm run build` | 0 | compilado |
| `node scripts/comprobar-specs.mjs` | 0 | sin errores |
| `npx vitest run --maxWorkers=3` | 0 | 89 archivos, 2748 pruebas superadas |

## Pruebas «no ejecutada» y qué comprueba cada una

Las 66 pruebas de Playwright se ejecutaron y terminaron «ok», pero no todas comprueban lo que su título promete. No se declaran las 66 como superadas; se cuentan así:

- **Solo anotan, no miden nada (2).** Terminan «ok» sin ninguna comprobación sobre el estado: 14 (`anchos.spec.ts:100`, «ancho máximo del contenido en 1920 y 2560 px» sobre `indice/unico`, que termina con `return` tras anotar porque la página no está dentro del armazón) y 19 (`anchos.spec.ts:174`, «cobertura: lo que aún no tiene entrada en el inventario», sin `expect`). Estado: no ejecutada para lo que dice su título.
- **Comprueban una parte y anotan el resto (6).** 21 y 22 (PRUEBA-022 en claro y oscuro: comprueban los pares de color del DOM, no los de fill y stroke de SVG); 43 (dirección: sin campos de texto en `indice/unico`, solo se comprueba que la dirección queda sin consulta ni fragmento tras Enter); 56 (cambio de tema: no hay tabla ordenada ni cajón; se comprueba sin recarga y estado intacto); 60 (fuente bloqueada: se comprueba el primer pintado, no el desplazamiento de CA-023). La 54 («las vistas de /muestra/servidor/ no existen aún») comprueba solo la guarda de que el inventario no las trae; el registro y la supervisión quedan sin probar.
- **Resto (58).** Comprueban lo que dicen.

Cada anotación «no ejecutada» (11 en total) figura con el título de la prueba en `no-ejecutadas.txt`. Esas comprobaciones no están superadas; se activan con T-010, T-008/T-016, T-011 (b), T-032/T-033. No se usó `test.skip`.

## Primera ejecución: 65 de 66

La primera ejecución dio 65 de 66. El control de enlaces («un parámetro que cambia el contenido y enlaces con consulta o fragmento los detecta la comprobación», `red-y-direccion.spec.ts`) esperaba 2 enlaces indebidos y recibió 3: `#otro` se resuelve contra una dirección con consulta y se etiqueta también «consulta». Se cambió `toHaveLength(2)` por `toContain`. El control sigue cerrando en fallo (detecta los enlaces indebidos), pero la etiqueta engaña. Pendiente para T-010.

## Controles sembrados nuevos, rojo demostrado

| Control | Cómo se vio fallar |
| --- | --- |
| Papeles `--degradado-*` valen `none` en colores forzados | Mutación: `valores.css` línea 242 con un degradado en vez de `none`; falló «papeles de degradado que no valen none». Revertida |
| Cifras tabulares (`fontVariantNumeric` contiene `tabular-nums`) | Mutación: `base.css` con `font-variant-numeric: normal`; falló «cifras tabulares» (recibido «normal»). Revertida |
| Cifras proporcionales dan anchos distintos | La prueba sembrada comprueba que con `proportional-nums !important` el ancho de 1.111 y 8.888 difiere más de 0,1 px; pasa porque la medida sí puede fallar |
| Centinela de nombres del inventario | Mutación: entrada `modal-x` con estado `cifra-enorme` en el inventario; falló con las dos líneas esperadas. Revertida |
| Parámetro que cambia el contenido y enlaces con consulta o fragmento | Respuesta sembrada con texto y enlaces añadidos solo con parámetros; la comprobación los detecta |

## Inventario de la política de contenido para la 021

`inventario-politica-de-contenido-para-la-021.json`: política estricta en solo informe sobre `indice/unico`; 7 infracciones, todas `script-src-elem · inline` (guiones en línea de Next); ninguna a otro origen.

## Configuración derivada usada (texto literal)

Archivo fuera del repositorio (`pw-puerto-3110.config.ts`, en la carpeta temporal de la sesión, que se borra):

```ts
// Fuera del repositorio: reutiliza la configuración oficial y solo cambia el puerto y las rutas
// (el 3100 lo ocupa un servidor viejo que no se debe reutilizar).
import oficial from "C:/dev/agentes-correo-humanaia/.claude/worktrees/c-020-t009a/playwright.config";

const RAIZ = "C:/dev/agentes-correo-humanaia/.claude/worktrees/c-020-t009a";
const puerto = 3110;
export default {
  ...oficial,
  testDir: `${RAIZ}/tests/e2e`,
  outputDir: `${RAIZ}/node_modules/.playwright-resultados`,
  workers: 1,
  use: { ...oficial.use, baseURL: `http://127.0.0.1:${puerto}` },
  webServer: {
    ...(oficial.webServer as object),
    command: `next build && next start --hostname 127.0.0.1 --port ${puerto}`,
    url: `http://127.0.0.1:${puerto}`,
    cwd: RAIZ,
  },
};
```

## Pendiente para T-010 y T-020

3. Tras `keyboard.press("Enter")` se lee `page.url()` sin esperar: usar `expect.poll`. El selector de campos incluye `type=number/date/range/color/file/submit`, donde `fill` lanza error (también en `tema-y-movimiento.spec.ts:33-35`).
4. El mensaje a la ventana emergente no tiene un control sembrado con `context.addInitScript` y se envía en `load`: esperar `networkidle`.
5. El control de cifras proporcionales depende de que la fuente tenga `pnum`: confirmar en CI o en T-020.
6. El centinela de nombres de `anchos.spec.ts:41-59` es heurístico: no reconoce ventana, cuadro, confirmacion ni importe.
7. `medirPapelesDeDegradado` solo lee `:root`, y la prueba de colores forzados solo corre en claro, no con oscuro a la vez.
8. Etiqueta del control de enlaces (ver «Primera ejecución»): `#otro` se etiqueta también «consulta».
