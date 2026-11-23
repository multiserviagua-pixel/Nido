# T-010 (a) · Resultado

Rama `tarea/020-T-010a`, sobre `e5265a2`. Entorno: local (Windows 11, Node 26, Chromium de Playwright, 1 worker). Autor: `ingeniero-frontend`. Datos de prueba ficticios (`Ficticio` repetido 15 veces para el nombre de 120 caracteres). Sin revisión todavía.

## Qué entrega

- `src/components/armazon/`: `Armazon.tsx` (enlace de salto, `nav`, `header` con el único `h1`, `main` con `id` y `tabindex=-1`, anuncios; puntos de montaje `menu` y `cabecera`), `areas.ts` (`AREAS_SUPERADMIN` con las cinco áreas y `AREAS_CLIENTE_MUESTRA` con cuatro), `EnlaceSaltar.tsx`, `RejillaCuerpo.tsx` (cifras, contenido, alertas).
- `src/components/texto/`: `Anunciador.tsx` y `anuncios.ts` (`anunciar()`, dos regiones, cola por región).
- `src/app/layout.tsx`: `lang="es"`, `viewport` sin escala máxima, `color-scheme: light dark`, plantilla `%s · Nido: Agentes de Correo`. El `main` sale del layout y lo pone cada vista (`page`, `not-found`, `error` y el armazón).
- `src/components/textos.ts`: `marca`, `areas` y los nombres de las regiones del armazón.
- Muestra: dos entradas nuevas en `inventario.ts` (`armazon-superadmin`, 6 estados; `armazon-cliente`, 4) y una página fija por estado en `src/app/muestra/componentes/<entrada>/<estado>/`, con `_vistas/armazon.tsx`.

## Decisiones tomadas y por qué

1. **Páginas fijas por estado, no una ruta dinámica.** Una ruta `[clave]/[estado]` necesitaba `generateMetadata` para dar a cada estado un título distinto, y PRUEBA-008 (R7) lo prohíbe en la muestra. Cada página lleva un `metadata` estático sacado del inventario; una prueba comprueba que páginas e inventario son uno a uno y que el título coincide con el `h1`.
2. **Sin ningún módulo de cliente.** `EnlaceSaltar` es un enlace nativo a `#contenido-principal` (el único fragmento que admite PRUEBA-018) y `Anunciador` pinta dos regiones vacías en el servidor; `anunciar()` escribe `textContent` en ellas. Así `tests/unit/diseno/paquetes-de-cliente.ts` (archivo reservado, A-12) no cambia. La primera versión con `"use client"` hacía fallar PRUEBA-037 (`react` faltaba en la lista): no se tocó la lista, se cambió el diseño. T-010 (b) (`CajonMenu`, Radix) sí obligará a pedir el «sí» para esa lista.
3. **Enlace de salto fuera de la ventana con `-translate-y-full`, no con `sr-only`**: `sr-only` recorta (`overflow: hidden`) y la medida de recortes de T-009 lo marcaría.
4. **Menú provisional.** Hasta T-010 (b) y (c), `Armazon` lleva una lista de enlaces sin cajón y una cabecera con solo el `h1`. No son `MenuLateral` ni `Cabecera`: se sustituyen por los puntos de montaje `menu` y `cabecera`. A 1023 px o menos el menú queda apilado encima del contenido, sin plegar. Lo que depende de (b) y (c) figura como «no ejecutada», sin simularlo.
5. **Enlaces del armazón con `<a>`, no `next/link`**, para no lanzar precargas hacia rutas que no existen (`/admin`, `/panel`). En la muestra los enlaces van a los estados de la propia muestra. La 021 decide si usa `next/link`.

## Pruebas, primero en rojo

| Requisito | Prueba |
| --- | --- |
| REQ-003, REQ-010; CA-002 (áreas) | `tests/unit/diseno/areas.test.ts` (PRUEBA-012, áreas); `armazon.spec.ts` (menú) |
| REQ-001, REQ-042; CA-001, CA-033 (estructura, regiones) | `tests/unit/diseno/armazon.test.tsx`; `armazon.spec.ts` (regiones con nombre, un `h1`, encabezados sin saltos) |
| REQ-009; CA-007 (salto) | `armazon.test.tsx`; `armazon.spec.ts` (primer Tab, visible, el foco llega a `main`) con control sembrado en una página suelta |
| REQ-007, REQ-008; CA-005, CA-006 (cuerpo, ancho) | `armazon.test.tsx` (`RejillaCuerpo`); `armazon.spec.ts` (alertas a la derecha a 1280, al final a 375; 1440 máximo a 2560) |
| REQ-005, REQ-040, REQ-041, REQ-088; CA-004, CA-031 (título, `lang`, zum, `color-scheme`) | `tests/unit/diseno/layout-raiz.test.tsx`; `armazon.spec.ts` (título = `h1` + producto, único entre vistas) |
| REQ-042 (anuncios) | `tests/unit/diseno/anunciador.test.tsx` (cola, repetición, `textoPlano`, `textContent`); `armazon.spec.ts` (las dos regiones, vacías) |
| REQ-061; CA-046 (muestra) | `tests/unit/diseno/muestra-armazon.test.tsx` (1 a 1 con el inventario, control 2 primero) |
| PRUEBA-013, 018, 020, 022, 025 sobre las 10 entradas nuevas | Los casos de T-009 se ejecutan ya para `armazon-*`, con `nombre-largo-120` y el ancho máximo en 1920 y 2560 |

Rojo observado: la primera ejecución de los cinco archivos unitarios dio 5 archivos fallidos (módulos que no existían); el primer Playwright de `armazon.spec.ts` dio 10 fallos (anuncios, por un selector que también cogía el anunciador de rutas de Next; corregido en la prueba). Mutaciones sobre el código, revertidas: quitar `tabIndex` de `main` hizo fallar «enlace de salto»; cambiar la rejilla a una columna hizo fallar «a 1280 px las alertas quedan a la derecha» (recibido 280, esperado 1255 o más).

Menores de T-009 atendidos: enlace de salto con `href="#…"` (ahora nativo y ya admitido por la prueba de dirección); etiqueta del control de enlaces (`red-y-direccion.spec.ts`: se resuelve contra la ruta sin consulta, y el control exige exactamente 2 enlaces indebidos, ya sin que `#otro` figure como «consulta»). No se tocaron los demás (3, 4, 5, 6, 7): ninguno afecta a lo que añade esta parte, que no trae campos de texto, ventanas ni tablas.

## Órdenes y resultado

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run --maxWorkers=3` | 1 y luego 0 | 100 archivos, 3144 pruebas: 3143 en verde y 1 fallo de `supabase/tests/pglite/m07.test.ts` por `RangeError: Array buffer allocation failed` (memoria de la máquina, no del cambio); repetido solo ese archivo: 70 de 70 en verde |
| `npm run tipos` | 0 | sin errores |
| `npm run estilo` | 0 | Prettier y ESLint sin hallazgos (tras corregir dos `throw` que la regla del proyecto no admite) |
| `npm run aislamiento` | 0 | 45 de 45 |
| `npm run arnes` | 0 | SUPERADO |
| `node scripts/comprobar-specs.mjs` | 0 | SUPERADO |
| `ENTORNO=preproduccion npm run build` | 0 | compilado con Turbopack; rutas de la muestra listadas (10 páginas nuevas) |
| Playwright `tests/e2e/muestra`, 1 worker, puerto 3110 | 0 | 423 ejecutadas sin fallo, 0 saltadas, 0 intermitentes (dos ejecuciones completas con este código: lista y JSON) |

### Cuenta de Playwright (JSON de la última ejecución)

- **423 ejecutadas sin fallo.** De ellas:
  - **12 solo anotan** (no cuentan como superadas para lo que dice su título): los 10 «lo que añaden (b) y (c) queda anotado» de `armazon.spec.ts`, «ancho máximo» de `indice/unico` y «cobertura: lo que aún no tiene entrada en el inventario».
  - **56 comprueban una parte y anotan el resto** (68 pruebas llevan alguna anotación «no ejecutada», 80 anotaciones en total, menos las 12 anteriores): pares de color de SVG (22), fuente real (11), dirección con campos de texto (11: no hay campos), cambio de tema con tabla ordenada y cajón abierto (11), registro y supervisión de `/muestra/servidor/` (1).
  - **355 comprueban lo que dicen**, sin anotación.
- **No ejecutadas, con su tarea:** cajón, cuenta y selector de periodo (T-010 (b) y (c)); diálogo a 568 por 320 y a 320 por 256, y cifra 999.999.999 (T-010 (e) y (j)); tabla ordenada y cajón en el cambio de tema; campos de texto en la dirección (formulario, T-016); fuente real (T-011 (b)); SVG en PRUEBA-022 (T-010 (h)); vistas de servidor (T-008, T-016). Más 40 «por revisar a mano» que deja `axe`: van a la revisión manual (PRUEBA-028), no cuentan como superadas.
- `axe` (PRUEBA-025): 10 estados nuevos x 2 anchos x 2 temas = 40 recorridos, 0 infracciones.

### Configuración de Playwright usada (texto literal)

`playwright.config.ts` fija el 3100, lo ocupa un `next start` viejo y `reuseExistingServer` es `false`. Sin tocar la oficial, archivo fuera del repositorio (en la carpeta temporal de la sesión) que la importa y solo cambia puerto, rutas y workers:

```ts
// Fuera del repositorio: reutiliza la configuración oficial y solo cambia el puerto y las rutas
// (el 3100 lo ocupa un servidor viejo que no se debe reutilizar).
import oficial from "C:/dev/agentes-correo-humanaia/.claude/worktrees/c-020-t010a/playwright.config";

const RAIZ = "C:/dev/agentes-correo-humanaia/.claude/worktrees/c-020-t010a";
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

La orden oficial `npm run navegador` sigue sin ejecutarse (puerto 3100 ocupado).

## Entorno de la copia

`node_modules` de esta copia era una unión hacia la de la carpeta principal y Turbopack no la sigue («Could not find the Next.js package»): `npm run build` fallaba con 1 por eso, no por el código. Se quitó la unión con `cmd /c rmdir` y se copió la carpeta con `robocopy` (623 MB, 358 paquetes). La copia es ya un directorio real: borrarla con `rm -r` no afecta a la carpeta principal.

## Qué no se pudo comprobar

- Navegadores distintos de Chromium (T-018).
- Lectores de pantalla: los anuncios se prueban en la cola y en el DOM, no se oyen (PRUEBA-028).
- Contraste de los pares con `fill`/`stroke` de SVG (los iconos del menú usan `currentColor` y heredan el par del texto, pero la medida actual no los recorre).
- `anunciar()` con `useSyncExternalStore` o React: se descartó; si T-016 (b) (avisos) necesita estado de React, hay que pedir el «sí» para `paquetes-de-cliente.ts`.

## Riesgos y vuelta atrás

- El `main` ya no está en el layout raíz: una página nueva fuera del armazón debe poner el suyo. `layout-raiz.test.tsx` lo exige a `page`, `not-found` y `error`.
- El título por estado de la muestra depende de que inventario y páginas coincidan: lo vigila `muestra-armazon.test.tsx`; en T-016 (i), cuando `inventario.ts` sea ruta reservada, cada estado nuevo necesita su carpeta.
- Con JavaScript, el enlace de salto deja `#contenido-principal` en la dirección (admitido). Si más adelante no se quiere, hará falta un módulo de cliente y el «sí» para la lista de paquetes.
- Vuelta atrás: `git revert` de los tres commits de `T-010 (a) (020)` por el camino de integración; no hay datos ni migraciones.

---

# T-010 (b) · Resultado

Rama `tarea/020-T-010b`, sobre `de12213`. Entorno: local (Windows 11, Node 26, Chromium de Playwright, 1 worker, puerto 3110). Autor: `ingeniero-frontend`. Datos ficticios. Sin revisión todavía.

## Qué entrega

- `src/components/armazon/MenuLateral.tsx`: `nav` con nombre, fondo oscuro con degradado, lista cerrada de áreas; oculto por debajo de 1024 px (`hidden lg:block`).
- `src/components/armazon/CajonMenu.tsx` (`"use client"`): botón «Abrir menú» (solo por debajo de 1024 px) y diálogo modal con la primitiva de T-001 (`@radix-ui/react-dialog`): foco atrapado y devuelto, Escape, título como nombre accesible, «Cerrar menú», fondo inerte. Elegir un área lo cierra. Si la ventana pasa a 1024 px o más con el cajón abierto, se cierra y el foco va al área actual del menú lateral (el botón ya no se ve). No escribe nada en el navegador.
- `src/components/armazon/ListaDeAreas.tsx` (la lista que comparten los dos), `ancho-menu.ts` (consulta de ancho y cierre al ensanchar).
- `Armazon`: el menú lo pone él mismo a partir de `areas`; **se quita la propiedad `menu`** (no admite un `ReactNode` que sustituya la lista cerrada). La cabecera sigue provisional (botón del cajón y `h1`); `cabecera` queda tipada como `undefined` y anotada para T-010 (c), con prueba de tipos (`@ts-expect-error`) y de ejecución.
- `src/components/textos.ts`: `armazon.menu` («Menú»). `abrirMenu` y `cerrarMenu` ya existían.
- **`tests/unit/diseno/paquetes-de-cliente.ts` (archivo reservado A-12), con el «sí» de la coordinación por D-036 (tareas.md, punto 11):** de `[]` a 27 paquetes: `react`, `react-dom`, `@radix-ui/react-dialog` y lo que arrastran según el bloqueo, tal como los calcula PRUEBA-037 (no entra `react-alert-dialog`). Sin dependencias nuevas en `package.json` (las dos de Radix ya estaban declaradas por T-002). `excepciones.ts`, `playwright.config.ts` y `configuracion-interfaz.ts` sin tocar.
- **Inventario: sin entradas ni estados nuevos.** El cajón no tiene página propia: se abre con su botón en los 10 estados `armazon-*` existentes y las pruebas lo manejan con teclas reales. No hay carpeta de página nueva que añadir. Queda para el `arquitecto` decidir si quiere un estado «cajón abierto» fijo (necesitaría una propiedad de apertura inicial solo para la muestra); no la he inventado.

## Menores de T-010 (a) (punto 10 de tareas.md)

1. `anunciar()` sin `document` sale sin guardar texto ni crear temporizadores; su prueba exige `leerAnuncio()` vacío y `vi.getTimerCount() === 0`.
2. `menu` quitado y `cabecera` tipada (ver arriba).
3. Título propio del índice (`metadata` de `page.muestra.tsx`: «Muestra de componentes») y prueba `titulos-muestra.test.tsx`: títulos únicos sobre los 11 estados del inventario, iguales a su `h1`, cada uno con carpeta fija.
4. `enlacesIndebidos` trata `href=""` como la propia dirección (consulta o fragmento); caso sembrado en `red-y-direccion.spec.ts` con control positivo. Observado en rojo (sin la corrección: «Expected length: 1, Received length: 0») y luego en verde.
5. Una sola prueba «lo que añade T-010 (c)» fuera del bucle; lo de (b) ya no se anota porque se ejecuta.
6. `leerAnuncio` y `reiniciarAnunciosParaPruebas` se mantienen: los usa `anunciador.test.tsx` (solo pruebas; ninguna parte de producción los usa).
7. JSON resumido en `playwright-resumen-b.json` (esta carpeta).

## Pruebas, primero en rojo

| Requisito | Prueba |
| --- | --- |
| REQ-002, REQ-003, REQ-010, REQ-038; CA-001, CA-002, CA-029 (menú) | `tests/unit/diseno/menu-lateral.test.tsx` (PRUEBA-012, menú); `cajon-menu.spec.ts` (menú fijo a 1024, 1280 y 1920 px) |
| REQ-004, REQ-035; CA-003, CA-027 (cajón) | `cajon-menu.spec.ts`: plegado a 320, 375, 768 y 1023 px; teclado, ratón y táctil; Escape; foco devuelto; 50 tabuladores y 50 con Mayúsculas; nada tapado con 320 por 256 px; cierre al ensanchar; `axe` y pares de color con el cajón abierto en claro y oscuro |
| REQ-037; CA-028 (objetivos), REQ-036 (foco visible) | `cajon-menu.spec.ts` (PRUEBA-021): objetivos de 24 por 24 px y contorno del foco en botón, cajón y menú fijo |
| REQ-058 (sin almacenamiento) | `cajon-menu.spec.ts` (abrir no escribe nada; recargar lo deja cerrado) y `cajon-menu.test.tsx` (código) |
| Pliegue y cierre al ensanchar (lógica) | `tests/unit/diseno/cajon-menu.test.tsx` (consulta igual al punto de ruptura `lg`, cierre solo al ensanchar) |
| PRUEBA-037 | `paquetes-de-cliente.test.ts` en verde con la lista nueva |
| Casos de T-009 «no ejecutados hasta T-010 (b)» | `tema-y-movimiento.spec.ts`: cambio de tema con el cajón abierto en los 10 armazones (sigue abierto, con el foco dentro, sin recarga) |

Controles sembrados (la medida puede fallar): cajón sin atrapar el foco (falla adelante y atrás) y con trampa propia (pasa); objetivo de 10 px; elemento tapado y fuera de la ventana; foco sin contorno; menú sin plegar a 320 px (cae el foco) y plegado (no).

Rojo observado: la primera ejecución de los archivos unitarios dio 5 archivos fallidos (módulos inexistentes) y 3 pruebas en rojo (anunciador, títulos); `paquetes-de-cliente.test.ts` falló con los 27 paquetes que faltaban. Mutaciones sobre el código, revertidas: quitar `hidden` de `MenuLateral` hizo fallar «a 320 px el menú está plegado»; quitar el cierre al ensanchar hizo fallar «al pasar a 1024 px … se cierra».

## Hallazgos de las pruebas (corregidos)

- **Foco fuera de la vista (real, en el código).** Con 320 por 256 px el cajón se desplaza por dentro y Radix, al dar la vuelta con el tabulador, mueve el foco sin desplazar: el botón «Cerrar menú» quedaba fuera de la vista (CA-027, «0 casos de foco oculto»). Corrección: `onFocus` del contenido acerca el elemento a la vista (`scrollIntoView({block:"nearest"})`).
- **Defectos de la prueba, no del cajón**, corregidos sin relajar nada: (1) Radix empieza a escuchar el clic fuera un turno después de abrir, así que el robot pulsaba antes que cualquier persona (se espera 100 ms); (2) igual para el tabulador justo al abrir (se espera con `expect.poll` a que el foco haya entrado: sigue siendo la comprobación de «el foco entra»); (3) con el cajón abierto el botón de apertura sale del árbol de accesibilidad (`aria-hidden`): se localiza por atributo; Radix no pone `aria-modal` (la inercia se comprueba porque `main` y `banner` salen del árbol); (4) el selector del cajón en la prueba de cambio de tema (`[aria-expanded][aria-controls]`) no encontraba el botón (Radix solo pone `aria-controls` con el cajón abierto) y dejaba el caso sin ejercitar sin avisar: ahora `[aria-haspopup="dialog"][aria-expanded]`; sin esa corrección los 10 casos seguían «anotados» por error.
- La medida de foco de `recorrerPares` (PRUEBA-022) da el foco a cada elemento de la página: con un diálogo modal abierto no puede salir de él y marca como «sin contorno» los elementos inertes del fondo. En la prueba del cajón se filtran solo esos avisos de foco; el contorno del foco dentro del cajón lo mide la prueba PRUEBA-021 aparte. Los pares de texto y de borde sí se exigen.
- Un fallo aislado `write UNKNOWN` (error de tubería del arnés en Windows) en una ejecución completa; repetido 10 veces solo: 10 de 10. No se ha vuelto a ver en las ejecuciones completas siguientes.

## Órdenes y resultado

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run --maxWorkers=3` | 1 | 104 archivos, 3249 pruebas: 3246 en verde y 3 fallos de PGlite («PGlite failed to initialize properly», memoria): `supabase/tests/pglite/m01.test.ts` y `tests/unit/conector/autorizar-peticion.test.ts`; repetidos solos con `--maxWorkers=1`: 141 de 141 en verde, código 0 |
| `npm run tipos` | 0 | sin errores |
| `npm run estilo` | 1 | **no es de este cambio**: Prettier y ESLint señalan solo `supabase/tests/pglite/m08_m10.test.ts` (formato y dos `_a`/`_b` sin usar; viene de a702bef, de otra fase). `prettier --check src tests` y `eslint` sobre `src/` y `tests/e2e` en 0 |
| `npm run aislamiento` | 0 | 45 de 45 |
| `npm run arnes` | 0 | SUPERADO |
| `node scripts/comprobar-specs.mjs` | 0 | SUPERADO |
| `ENTORNO=preproduccion npm run build` | 0 | compilado; las 11 rutas de la muestra |
| Playwright `tests/e2e/muestra`, Chromium, 1 worker, puerto 3110 | 0 | 607 ejecutadas sin fallo, 0 saltadas, 0 intermitentes (cuarta ejecución completa con este código; las anteriores sirvieron para encontrar los defectos de arriba) |

### Cuenta de Playwright (`playwright-resumen-b.json`)

- **607 ejecutadas sin fallo.** De ellas:
  - **3 solo anotan** (no cuentan como superadas para lo que dicen): «ancho máximo del contenido en 1920 y 2560 px» de `indice/unico`, «cobertura: lo que aún no tiene entrada en el inventario» y la nueva «cuenta en un paso a 320 px y selector de periodo» (T-010 (c)). Antes eran 12: los 10 por estado de (a) desaparecen porque lo de (b) se ejecuta.
  - **56 comprueban una parte y anotan el resto** (57 anotaciones «no ejecutada»): pares de color de SVG (22), fuente real (11), dirección con campos de texto (11), cambio de tema con tabla ordenada (11), cambio de tema con el cajón abierto en el índice, que no lo tiene (1), registro y supervisión de `/muestra/servidor/` (1).
  - **548 comprueban lo que dicen**, sin anotación. Por archivo: `cajon-menu.spec.ts` 192 (nuevo), `armazon.spec.ts` 87, `red-y-direccion.spec.ts` 86, `tema-y-movimiento.spec.ts` 82, `anchos.spec.ts` 71, `accesibilidad.spec.ts` 49, `combinaciones.spec.ts` 29, `medidas.spec.ts` 11.
- **Ya ejecutado, antes «no ejecutado hasta T-010 (b)»:** el cajón en cambio de tema (10 de 11 estados; el índice no tiene cajón), el cajón abierto bajo `axe` (PRUEBA-025, 20 recorridos a 320 px en claro y oscuro) y bajo PRUEBA-022 (pares de texto y de borde).
- **No ejecutadas (con su tarea):** cuenta y selector de periodo (T-010 (c)); diálogo a 568 por 320 y a 320 por 256, y cifra 999.999.999 (T-010 (e) y (j)); tabla ordenada en el cambio de tema (T-010 (g)); campos de texto en la dirección (T-016); fuente real (T-011 (b)); SVG en PRUEBA-022 (T-010 (h)); vistas de servidor (T-008, T-016). `axe` deja «por revisar a mano» lo que no puede decidir: va a la revisión manual (PRUEBA-028) y no cuenta como superado.

Configuración de Playwright: la misma derivada fuera del repositorio que en (a) (importa la oficial; cambia puerto 3110, rutas y 1 worker), esta vez contra un `next start` ya levantado en 3110 sobre la compilación (`webServer: undefined`), para repetir sin recompilar. La orden oficial `npm run navegador` sigue sin ejecutarse (puerto 3100 ocupado).

## Qué no se pudo comprobar

- Firefox y WebKit con el componente definitivo (T-018); lectores de pantalla (PRUEBA-028): el nombre y el rol del diálogo se comprueban en el árbol de accesibilidad de Chromium, no se oyen.
- Sin JavaScript, por debajo de 1024 px no hay menú (el cajón lo necesita). La aplicación es de Next con hidratación; riesgo anotado, no defecto.
- «El menú no está en el documento» (diseño) se cumple en el árbol de accesibilidad y en el orden del tabulador (`display: none`), no en el DOM: el `nav` lateral sigue en el HTML. CA-003 pide que no reciba foco, y no lo recibe.

## Riesgos y vuelta atrás

- **Pendiente de `disenador-ui`:** no hay papel de velo (scrim) en `valores.css`; el fondo detrás del cajón no se oscurece, y el cajón se separa con su propio fondo oscuro y la sombra elevada. Pedir un papel para el velo (con su par en `combinaciones.ts`).
- El cajón usa `scrollIntoView` en `onFocus`; con `scroll-behavior: smooth` heredado de una hoja posterior sería animado. Hoy no hay ninguno.
- Radix inyecta un `<style>` y estilos en línea al abrir (T-001 lo midió); la política de contenido de la 021 debe contarlo (PRUEBA-018, inventario para la 021).
- Vuelta atrás: `git revert` de los commits `T-010 (b) (020)`; no hay datos ni migraciones. La lista de `paquetes-de-cliente.ts` vuelve a `[]` con el mismo revert.

---

# T-010 (c) · Resultado

Rama `tarea/020-T-010c`, sobre `660f785` (rebasada sobre `main`). Entorno: local (Windows 11, Node 26, Chromium de Playwright, 1 worker, puerto 3111). Autor: `ingeniero-frontend`. Datos ficticios. Revisada por un revisor independiente: NO APTO en la primera pasada, corregido en dos vueltas.

## Qué entrega

- `src/components/armazon/Cabecera.tsx`: `header` con nombre, fija arriba solo con 38 rem (608 px) de alto o más (`sticky top-0` a partir de ese alto), con el botón del cajón, el único `h1` (título sin datos, A-10), la cuenta y, solo si la vista lo declara, el selector de periodo en una línea propia. Orden del documento: cajón, `h1`, cuenta, selector.
- `ReservaDeCabecera.tsx` (cliente, solo `react`): pone `scroll-padding-top` en la raíz con el alto real de la cabecera (`ResizeObserver`, más 4 px para el contorno del foco) por el modelo de objetos de CSS, no con un atributo `style`.
- `CuentaUsuario.tsx` (cliente): botón siempre visible (icono y, desde 640 px, el nombre acortado con CSS; nombre accesible `Cuenta: <nombre completo>`) que abre un panel con el nombre completo (`TextoDato`, se parte en líneas) y las acciones que reciba (`{clave, etiqueta, ruta}`, enlaces; el tipo no admite nodos). Nombre vacío o de solo caracteres de control: «Cuenta sin nombre».
- `src/components/dialogo/PanelModal.tsx` (cliente): envoltorio de `@radix-ui/react-dialog` (la primitiva de T-001, la misma del cajón). **Motivo:** PRUEBA-008 R3 solo deja importar Radix en `dialogo/` y `CajonMenu`; así `CuentaUsuario` no lo importa. Sin código de foco propio.
- `periodo.ts` (puro): lista cerrada (`periodosValidos`, `esquemaDePeriodo`, `valorDePeriodo`, `periodoActivo`, `textoDePeriodo`, `rutaConPeriodo`). `usePeriodo.ts` (cliente): `useSyncExternalStore` sobre la dirección y un evento; en el servidor y en la hidratación vale el valor leído por la vista. `SelectorPeriodo.tsx` (cliente): `select` nativo con etiqueta visible, junto a él «Últimos 30 días · 14 oct – 12 nov 2026»; al cambiar escribe `?periodo=` con `history.replaceState`, avisa con el evento y anuncia «Periodo cambiado a …». Sin recarga, el foco se queda en el selector.
- `Armazon`: `cuenta` obligatoria y `periodo` opcional, tipados; **se quita `cabecera?: undefined`** (menor 3 del punto 12): un nodo libre ya no compila (`@ts-expect-error` en la prueba).
- Textos en `c/textos.ts`: `cuenta` y `periodo`.
- Muestra: estados `armazon-superadmin/con-periodo`, `armazon-cliente/con-periodo` y `armazon-cliente/cuenta-120-con-espacios`, cada uno con su carpeta de página fija; `nombre-largo-120` lleva ahora también la cuenta de 120 caracteres sin espacios. `_vistas/CifrasDeMuestra.tsx` (cliente): tres cifras ficticias que siguen al selector (el papel de la vista real, que vuelve a pedir sus datos con `usePeriodo`). La cuenta abierta se prueba con teclado, no tiene página propia.
- `tests/e2e/muestra/apoyo/medidas.ts`: `medirRecortes` admite **una** excepción (REQ-065, diseño «Nombres largos»): `header button [data-nombre-acortable]`. Control sembrado en `medidas.spec.ts`: la misma marca fuera del botón de la cabecera, u otro recorte dentro de él, siguen contando.
- **Paquetes de cliente: ninguno nuevo.** `paquetes-de-cliente.ts` sin cambios (27); los módulos de cliente nuevos solo importan `react` y, vía `PanelModal`, `@radix-ui/react-dialog`. No se usa `next/navigation` (habría añadido `next` a la lista).

## Pruebas, primero en rojo

| Requisito | Prueba |
| --- | --- |
| REQ-005; CA-004 (título único, h1, cuenta) | `cabecera.test.tsx` (marcado), `cabecera.spec.ts` (h1 único en la cabecera, título del documento = h1 + producto, sin datos) |
| REQ-005, REQ-065, REQ-083; CA-004, CA-049, CA-044 (cuenta) | `cabecera.spec.ts`: en un paso a 320 px dentro de la ventana; panel con el nombre completo de 120 caracteres con y sin espacios; Escape y botón de cerrar devuelven el foco; foco atrapado; sin desplazamiento horizontal a 320, 375 y 1280 px; parámetros `usuario`, `cuenta`, `cliente` y `rol` en la dirección no cambian nada |
| REQ-006; CA-004 (periodo) | `periodo.test.ts` (lista cerrada, valor, texto, dirección); `cabecera.test.tsx`; `cabecera.spec.ts`: solo en los estados que lo declaran, cambio con teclado (ArrowUp) que cambia las tres cifras, escribe solo `?periodo=`, se anuncia (observador de mutaciones desde el inicio) y deja el foco; sin recarga (marca en `window`); valor por defecto sin parámetro; a 320 px entero |
| REQ-036; CA-027 (foco bajo la cabecera fija) | `cabecera.spec.ts`: Mayúsculas+Tab hacia arriba entre 30 botones a 320 y 1280 px, 0 tapados; **control sembrado**: sin `scroll-padding-top` la misma medida ve botones tapados |
| REQ-058, REQ-059; PRUEBA-018 | `cabecera.spec.ts`: valor fuera de la lista, texto, parámetro repetido o vacío vuelven al por defecto y no se pintan (sin los guiones de datos de Next, hallazgo H-1); `localStorage`, `sessionStorage`, cookies e `indexedDB` vacíos tras abrir la cuenta y cambiar el periodo; los estados nuevos pasan además los casos de red y dirección ya existentes de `red-y-direccion.spec.ts` |
| REQ-065; CA-049 | `anchos.spec.ts` (ya existente) sobre los estados nuevos y viejos: sin solapes, recortes ni desplazamiento a 320 y 1280 px, zum 200 % y 400 %, espaciado de texto |

Rojo observado: la primera ejecución de `cabecera.test.tsx` dio 1 archivo fallido (módulos que no existían; `periodo.ts` ya estaba escrito, así que `periodo.test.ts` nació en verde). `cabecera.spec.ts` dio en la primera ejecución 78 verdes y 6 rojos (la medida de ancho cogía el botón del cajón en vez del de la cuenta; la consulta en el HTML de los guiones de Next; y el foco tras el cambio, ver abajo).

Dos decisiones forzadas por una medida real:

1. **El cambio de periodo no recarga.** La primera versión recargaba la página (`location.assign`) y recuperaba anuncio y foco mirando `document.referrer`; `next.config.ts` fija `Referrer-Policy: no-referrer`, así que no había referente y el foco se perdía. Se cambió a `history.replaceState` + evento + `usePeriodo`: el foco no se mueve y el anuncio sale en el acto. Las vistas reales vuelven a pedir sus datos al cambiar la clave de `usePeriodo` (diseño, «Una vista en uso», punto 3).
2. **`sr-only` con texto y `truncate` hacían saltar `medirRecortes`** (CA-049, 42 fallos en la primera pasada completa). El nombre del botón de la cuenta pasó a `aria-label` completo, el texto visible a `hidden sm:inline` con `truncate` y la excepción de arriba.

## Menores del punto 12 y del punto 10

| Menor | Qué se hizo |
| --- | --- |
| 12.1 filtro de foco en `cajon-menu.spec.ts` | Ya no se descarta todo `foco`: solo «sin contorno de foco» (el fondo inerte); un par de foco no declarado cuenta. Además, cada enlace y botón del cajón abierto debe mostrar el contorno con el papel `--foco` |
| 12.2 `networkidle` antes de pulsar el cajón | Hecho en `tema-y-movimiento.spec.ts` |
| 12.3 `cabecera?: undefined` | Quitado, con prueba de tipos |
| 12.4 los 27 paquetes | `evidencias/T-010/paquetes-de-cliente.txt` |
| 12.5 comentarios | `CajonMenu.tsx` y `paquetes-de-cliente.test.ts` corregidos |
| 12.6 velo del cajón | **Pendiente, no es de esta parte**: sigue faltando un papel de velo en `valores.css` (al `disenador-ui`). El panel de la cuenta tampoco lo lleva |
| 10.3 título propio del índice y unicidad | Ya estaba hecho en (b) (`titulos-muestra.test.tsx`); ahora cubre también los estados nuevos |
| 10.4 caso sembrado con `href=""` | Ya estaba en `red-y-direccion.spec.ts` (control «un enlace con href vacío…») |
| 10.5 prueba «lo que añaden (b) y (c)» fuera del bucle | Hecha: ya no anota, comprueba que la cuenta está en todos los armazones y el selector solo en `con-periodo` |
| 10.7 JSON resumido de Playwright | `playwright-resumen-c.json` |
| 10.1, 10.2, 10.6 | Sin cambios aquí (10.1 y 10.2 ya aplicados antes; 10.6: `leerAnuncio` y `reiniciarAnunciosParaPruebas` solo los usan sus pruebas y las de (c) tampoco los necesitan, así que siguen como estaban) |

## Órdenes y resultado

Ejecución final del 22/11/2026 sobre `5060bd2` (vuelta 2 de revisión), rama rebasada sobre `main` (`3b06654`), en primer plano y con el candado de suite. Las ejecuciones anteriores (con `262319e` y con `7e04063`) no cuentan como evidencia final. La suite completa de vitest la pasa la coordinación aparte (decisión D-036 del 22/11/2026): aquí no se ejecuta.

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 0 | 29 archivos, 1032 pruebas en verde |
| `npm run tipos` | 0 | sin errores |
| `eslint` sobre `src` y `tests` (`--max-warnings 0`) | 0 | sin hallazgos |
| `prettier --check src tests specs/020-sistema-diseno-armazon` | 1 | **no es de este cambio**: solo `tests/unit/plataforma/acciones-fijadas.test.ts` (de otro chat). Prettier sobre `src`, `tests/unit/diseno` y `tests/e2e/muestra`: limpio |
| `node scripts/comprobar-specs.mjs` | 0 | SUPERADO |
| `npm run build` | 0 | compilado |
| `npx playwright test --config playwright.config.ts` (oficial, puerto 3100, compila dentro; `tests/e2e` completo), Chromium, 1 worker | 0 | **863 ejecutadas sin fallo**, 0 saltadas, 0 intermitentes, 224 s. Antes, una tanda previa de 5 archivos dio 501 en verde |

No se ejecutaron: `npm run aislamiento` (no toca la base de datos) ni vitest completo (lo pasa la coordinación).

### Cuenta de Playwright (`playwright-resumen-c.json`)

- **863 ejecutadas sin fallo.** 790 comprueban lo que dicen; **73 llevan alguna anotación «no ejecutada»** (75 anotaciones en total): pares de color de SVG, fuente real, dirección tras escribir texto, cambio de tema con tabla ordenada, el cajón en el índice, ancho máximo del índice, diálogo bajo, cifra 999.999.999 y registro de `/muestra/servidor/`.
- `cabecera.spec.ts`: 97 pruebas (la vuelta añade el refresco del enrutador, los cuatro altos de ventana con control sembrado y el caso de `?q=` que el selector descarta).
- Sigue sin ejecutarse lo de (d) a (j), Firefox y WebKit (T-018), lectores de pantalla y la revisión manual (PRUEBA-028).
- Rojo observado en esta vuelta: `periodo.test.ts` («escribe solo el periodo…») y `cuenta-acciones.test.tsx` («descarta toda ruta…») fallaron sin la corrección. El e2e nuevo no se observó en rojo.


## Qué no se pudo comprobar

- Firefox y WebKit; lectores de pantalla (el anuncio se mide en la región, no se oye).
- El panel de la cuenta abierto no pasa por PRUEBA-022 ni por `axe`: no está abierto en ningún estado de la muestra. Usa solo papeles ya declarados (`--texto`, `--texto-secundario`, `--enlace` sobre `--superficie`; borde y foco).
- El panel no tiene velo: el diseño no lo define (menor 12.6).
- La sesión real y las acciones reales de la cuenta («Cerrar sesión» por POST, por ejemplo) son de la 021; aquí las acciones son enlaces.

## Riesgos y vuelta atrás

- `usePeriodo` lee `window.location.search` y `SelectorPeriodo` escribe con `history.replaceState(null, …)`, la forma documentada por Next 16: su `replaceState` parcheado copia el estado interno del enrutador (`__NA`, `__PRIVATE_NEXTJS_INTERNALS_TREE`) y actualiza su dirección canónica, de modo que una actualización del enrutador (`router.refresh()`, acción de servidor) conserva `?periodo=`. El componente no importa el enrutador ni pide datos al servidor. (La frase anterior, «se integra con el enrutador de Next 16», era inexacta: la primera versión pasaba `history.state`, lo que se salta ese parche y deja la dirección canónica vieja; corregido en la vuelta de revisión.) Si una versión futura de Next lo cambiase, fallarían las pruebas de `cabecera.spec.ts`.
- **Pregunta abierta para el arquitecto:** con `replaceState` sin navegación, una vista de servidor real no vuelve a pedir datos al cambiar el periodo (el diseño dice que las vistas leen en servidor y que los componentes no llaman a `fetch`). Ver `tareas.md`, punto 13.
- La cabecera es fija solo con 38 rem (608 px) de alto de ventana o más (variante `alto-suficiente` en `valores.css`); por debajo se desplaza con la página y `scroll-padding-top` no reserva nada. **El `disenador-ui` debe validar el umbral y la variante** (medido a 320 px de ancho: con selector de periodo la cabecera mide ~240 px, 0,46 de una ventana de 512 px, 0,39 de una de 608 px; con el nombre de 120 caracteres, ~193 px). En móviles de menos de 608 px de alto (con barra del navegador) la cabecera no queda fija: es el precio de no comerse la vista; el rediseño de una cabecera más baja es del `disenador-ui`.
- Toda vista que muestre cifras de un periodo **debe** usar `usePeriodo` (o leer el periodo de la dirección) y volver a pedir los datos: el selector ya no recarga la página.
- La excepción de `medirRecortes` es una sola y está comprobada con control sembrado.
- Vuelta atrás: `git revert` del commit de `T-010 (c) (020)`; sin datos ni migraciones; `paquetes-de-cliente.ts` no cambia.


## T-010 (e2): cambio de periodo con `router.replace` (22/11/2026)

Rama `tarea/020-T-010e` sobre `main` (la base cambia con cada rebase: `git merge-base main tarea/020-T-010e`). «Sí» de la coordinación por D-036 que nombra `tests/unit/diseno/paquetes-de-cliente.ts`. No cambia ningún REQ ni CA; cambia las cabeceras de las pruebas de PRUEBA-008, 009, 012, 016, 034 y 037.

### Qué

- Diseño y plan: se aplica `propuesta-router-replace.patch` (`git apply --reject`: seis trozos limpios y la fila `SelectorPeriodo` a mano, porque había derivado).
- `SelectorPeriodo`: `router.replace(ruta, { scroll: false })` dentro de la transición del armazón, `select` con `useOptimistic`, anuncio del periodo. Retirados `history.replaceState`, el evento y `usePeriodo.ts`.
- `TransicionDePeriodo.tsx` (proveedor con `useTransition`; anuncia «Cargando» una vez y el aviso a los 10 s) y `ZonaDeDatos.tsx` (zonas de cifras y contenido de `RejillaCuerpo`: `aria-busy="true"` y `carga` mientras está pendiente; los hijos quedan montados y ocultos). `Armazon` envuelve cabecera y cuerpo en el proveedor.
- `rutaParaCambiarPeriodo` (`periodo.ts`) y `esRutaInterna` (`direccion/rutas.ts`, movida desde `CuentaUsuario`): la ruta sale de `location.pathname` y, para la consulta, del esquema de la vista (la regla «se escribe solo `periodo`» de esta primera versión quedó sustituida por la regla por tipo de campo de la vuelta del arquitecto, abajo y en `tareas.md`, puntos 13 y 14). Sin `new URL` (regla de estilo). Discrepancia con el parche anotada en `tareas.md`, punto 13.
- `/muestra/servidor/periodo` (entrada `vista-servidor-periodo`, carpeta fija, `comprobarAccesoMuestra()` primero, sin registro ni supervisión); `CifrasDeMuestra` pasa a componente de servidor y los estados `con-periodo` existentes siguen igual.
- `paquetes-de-cliente.ts`: entra `next` (paquete del marco, sin su árbol).

### Rojo observado (antes de escribir el código)

`vitest` sobre los archivos nuevos o cambiados: 8 pruebas fallaban (`esRutaInterna` y `rutaParaCambiarPeriodo` no existían; `SelectorPeriodo` sin `router.replace` ni `useOptimistic`) y 3 archivos no cargaban (`TransicionDePeriodo`, `servidor/periodo/page.muestra`). No se observó rojo de las reglas sembradas de PRUEBA-008 (la regla `next/navigation` se escribió junto con sus casos) ni de `periodo-servidor.spec.ts` (se escribió antes del código, pero no se ejecutó sin él).

### Órdenes y resultado

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 0 | 33 archivos, 1128 pruebas en verde |
| `npx tsc --noEmit` | 0 | sin errores |
| `npx eslint src tests` | 0 | sin hallazgos |
| `npx prettier --check src tests` | 1 | solo `tests/unit/plataforma/acciones-fijadas.test.ts` (ajeno, ya fallaba en `main`) |
| Playwright con configuración derivada fuera del repo (puerto 3117, compila dentro, candado de suite): `periodo-servidor.spec.ts` y `cabecera.spec.ts` | 1 | 106 en verde, **1 en rojo** (PRUEBA-016, red cortada) |
| Lo mismo con `-g servidor-periodo` sobre `accesibilidad`, `anchos`, `red-y-direccion`, `tema-y-movimiento`, `combinaciones` y `medidas` | 0 | 26 en verde: la vista nueva pasa `axe` (320 y 1280, claro y oscuro), anchos, red, tema y movimiento |

No se ejecutaron: Playwright completo, `next build` suelto (lo compila el servidor de la configuración derivada), vitest completo, Firefox y WebKit, lector de pantalla.

### PRUEBA-016: no cerrada

- **Red cortada: falla.** Tras `context.setOffline(true)` y cambiar el periodo, Next 16 hace una carga completa del documento y Chromium acaba en `chrome-error://chromewebdata/`. Es el caso que el diseño dejaba «sin verificar» (punto 7): la tarea vuelve al arquitecto. La prueba se deja en rojo, sin `test.fail` (la comprobación estática lo prohíbe y escondería el hallazgo).
- Respuesta de navegación en 500: pasa, probablemente porque Next recarga y el servidor responde bien al documento (no verificado; no se probó con el documento también en 500).
- Dos cambios en menos de 300 ms: pasa (el primero, retenido 1,8 s, no pisa al segundo).

### Qué no se comprobó

- (Corregido en la vuelta de revisión, más abajo.) El error con reintento a los 30 s sí está implementado en las zonas y probado con reloj simulado; ya no se aplaza a los bloques de datos.
- La `Suspense` con `key` por periodo del punto 4: la muestra no tiene fuente asíncrona; lo estrenará la primera vista real.
- (Corregido en la vuelta de revisión.) Los 10 s y los 30 s tienen prueba en navegador con `page.clock`.

### Vuelta atrás

`git revert` de los commits de T-010 (e2) (los de `git log main..tarea/020-T-010e` antes de integrar; tras integrar, el único commit de integración «020 T-010 (e2)» en `main`): vuelta de revisión…», que sigue a `cd8c178` en la rama `tarea/020-T-010e`; `git log --oneline` da su huella), en orden inverso: vuelve `replaceState` con evento y `usePeriodo`, desaparece `/muestra/servidor/periodo` y `next` sale de `paquetes-de-cliente.ts`. Sin datos ni migraciones.

### Vuelta tras la decisión del arquitecto (22/11/2026; `tareas.md` punto 14, `diseno.md` «Cambio de periodo» puntos 2 y 7, «Corrección 3»)

**Qué.** (1) `SelectorPeriodo`: con `navigator.onLine === false` al elegir no se llama a la transición ni a `router.replace` ni a `fijarElegido`; el `select` conserva el valor de la vista (control con valor fijado: React lo restituye) y el foco; aviso `TEXTOS.periodo.sinConexion` («Sin conexión. El periodo no ha cambiado.») pintado junto al selector (no es región viva), anunciado una vez por la región cortés; se retira al siguiente cambio o con `online` (escuchador en un efecto, solo mientras se ve el aviso). No se anuncia el periodo. (2) `periodo.ts`: `esquemaDeLaVista?: Esquema` y `rutaParaCambiarPeriodo(pathname, search, configuracion, clave)`: listas e identificadores válidos se conservan, los enteros vuelven a su valor por defecto, lo no declarado, repetido o inválido se pierde, un `periodo` de la vista no pisa el elegido, sin esquema solo `periodo`; sigue validando con `esRutaInterna` y `SelectorPeriodo` pasa `window.location.search`. Orden de la consulta resultante: `periodo` primero y después los campos de la vista en el orden de su esquema. `rutaConPeriodo` se mantiene (la usa la prueba y cubre el caso sin esquema). (3) `periodo-servidor.spec.ts`: sustituido `comprobarEstadoFinal` por los cuatro casos exactos de la fila de PRUEBA-016 y un control sembrado.

**Rojo observado.** `periodo.test.ts`: 9 pruebas en rojo contra la firma antigua antes de tocar `periodo.ts`; `cabecera.test.tsx`: 2 en rojo (la lectura de `location.search` y el aviso sin conexión) antes de tocar `SelectorPeriodo.tsx`. Reglas sembradas de PRUEBA-008: mutada la regla R3 de `next/navigation` en `apoyo/fronteras.ts` (nombre de regla cambiado), fallaron las 3 sembradas que la esperan; revertida (`git diff` sin cambios en ese archivo). E2E (1): con la comprobación `navigator.onLine === false` anulada, la prueba falla («toBeVisible» del aviso no encontrado); revertida. Un hallazgo propio de la prueba (4): la primera ejecución dio rojo por `page.unroute` con una función nueva (Playwright compara por identidad y el corte seguía puesto: `reload` y `goto` fallaban con `ERR_INTERNET_DISCONNECTED`); diagnosticado con un archivo temporal ya borrado y corregido con un `esLaRuta` único. No fue un fallo del código ni de la decisión.

**Órdenes y resultado**

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 0 | 33 archivos, 1136 pruebas en verde |
| `npx tsc --noEmit` | 0 | sin errores |
| `npx eslint src tests` | 0 | sin hallazgos |
| `npx prettier --check src tests` | 1 | solo `tests/unit/plataforma/acciones-fijadas.test.ts` (ajeno, ya fallaba en `main`) |
| Playwright con configuración derivada fuera del repo (puerto 3118, candado de suite): `periodo-servidor.spec.ts` y `cabecera.spec.ts` | 0 | **110 en verde** (la anterior a corregir la prueba 4: 109 y 1 en rojo por el `unroute`) |

**PRUEBA-016: cuatro casos ejecutados, todos en verde.** (1) sin conexión (0 peticiones a la ruta, dirección e historial iguales, `select` en 30 días y con el foco, mismas cifras, zonas sin `aria-busy`, aviso visible y anunciado una vez, sin anuncio del periodo; al volver la conexión el aviso se retira y el cambio navega); (2) navegación abortada con `internetdisconnected` y el navegador en línea, y (3) navegación en 500: una sola carga completa del documento a la dirección con la clave nueva, cifras y `select` del periodo nuevo, marca de `window` perdida (documento nuevo) e historial igual; (4) navegación y documento abortados: 0 cifras en la página y, tras quitar el corte, `reload` desde la página de error vuelve a `?periodo=ultimos-7-dias` con sus cifras. Control sembrado: con la red cortada, una petición a la ruta hecha desde la página la cuenta el mismo contador (1).

**No ejecutado.** El documento en 500 real (las rutas de `/muestra/servidor/` capturan su error, regla 3); la caída de red real sin que el navegador lo sepa (se simula abortando la petición con el navegador en línea; es el caso aceptado, asunto A-14 de la 020; no confundir con el A-14 de `docs/SEGURIDAD.md`); Firefox y WebKit (el `navigator.onLine` y el `reload` desde la página de error pueden comportarse distinto); Playwright completo, `next build` suelto y vitest completo (a cargo de la coordinación); lector de pantalla (el anuncio se mide en la región cortés, no se oye). `navigator.onLine` verdadero con red caída y el cambio de `online` con un navegador que no lo emita no se prueban.

### Vuelta de revisión (22/11/2026): error a los 30 s, vistas de servidor sin registro, menores

El `revisor` dio NO APTO por un MAYOR (falta el error con reintento a los 30 s: REQ-069, CA-048, «Cambio de periodo» punto 4) y 7 menores; la evidencia completa dio 977 en verde y 1 en rojo (el centinela «las vistas de /muestra/servidor/ no existen aún», que falla a propósito al aparecer `/muestra/servidor/periodo`).

**Qué.**
1. **Error a los 30 s (MAYOR 1).** `TransicionDePeriodo.tsx` añade `fallida`, `referencia` y `reintentar` al contexto. A los 10 s pendiente, `lenta` (aviso, ya existía); a los 30 s, `fallida`: referencia `N-` de `crearReferencia("navegador")` (si no hay generador, el error se pinta sin referencia) y anuncio una sola vez por la región urgente con el motivo `tarda_demasiado` y la referencia. `ZonaDeDatos.tsx` pinta en cifras y contenido un estado `error` (texto «No se ha podido cargar», motivo de `TEXTOS.motivosDeError`, «Referencia: N-…» solo si cumple el formato exacto y botón «Reintentar»), quita `aria-busy` y mantiene ocultos los hijos: 0 cifras visibles. «Reintentar» repite la última acción (`router.replace` con la misma ruta) dentro de una transición nueva, anuncia «Cargando» y reinicia los plazos. Sin mensajes libres: solo `TEXTOS` y la lista de motivos. Se usa la región urgente porque el error interrumpe lo que se estaba leyendo y el diseño no fija otra; si el arquitecto prefiere la cortés, es cambiar un argumento.
   - **Decisión que el diseño no recogía y se deja al arquitecto para confirmar.** Una transición de React no se puede cancelar: a los 30 s la petición original sigue pendiente. Si su respuesta llega después, la transición termina, el error se retira y se pinta la vista con el periodo elegido (nunca se ven a la vez error y cifras). «Reintentar» lanza una navegación nueva a la misma dirección; con la respuesta de la primera retenida, Next la sirvió con una petición nueva (observado: 2 peticiones).
2. **Centinela de servidor (fallo de la evidencia completa).** `red-y-direccion.spec.ts`: el centinela sustituido por una comprobación real. Lista cerrada `VISTAS_DE_SERVIDOR` (ruta y cómo se activa); el centinela falla si el inventario o el disco (`src/app/muestra/servidor/`) traen una vista no listada. Al activar cada vista (en `/muestra/servidor/periodo`, los tres periodos): 0 peticiones a otros dominios, 0 a un ingreso de supervisión (`sentry`, `/envelope`, `/ingest`) y 0 envíos con `sendBeacon` (contadores de la propia prueba). En el código: ningún módulo que alcanzan esas rutas llega a `registro.ts`, `fallo-servidor.ts` ni `supervision.ts` (grafo de PRUEBA-008). Control sembrado: el contador ve una petición ajena, un ingreso y un `sendBeacon`, y el grafo ve `registro.ts` desde `supervision.ts`. **No ejecutado (no observable desde el navegador):** el conteo de líneas que escribe el proceso del servidor y los envíos que hace el propio servidor a la supervisión; queda anotado como «no ejecutada» en la propia prueba.
3. **MENOR 1.** `rutaParaCambiarPeriodo` aplica `esquemaSinIdentificadores` (ahora exportada de `direccion/rutas.ts`) cuando la ruta empieza por `/panel`, como `construirRuta`; caso en `periodo.test.ts` (panel sin identificador, admin con él).
4. **MENOR 2.** La regla R3 `ES_ENRUTADOR_DE_NEXT` admite extensión y rutas internas del paquete (`next/navigation.js`, `next/dist/client/components/navigation`, `next/dist/client/router`); dos casos sembrados en `fronteras.test.ts`.
5. **MENOR 3.** `vigilarAnuncios` cuenta como anuncio nuevo cada texto no vacío que llega tras un vacío, aunque sea igual al anterior; ahora vigila también la región urgente. Control sembrado: «X», vacío, «X» da dos anuncios; «X» sin vaciar entre medias da uno. Las comprobaciones de «una vez» pueden fallar.
6. **MENOR 4, 5, 6 y 7.** Vuelta atrás con los commits nombrados (arriba); nota de la regla sustituida; el aplazamiento de los 30 s retirado; asunto A-14 «de la 020» en `diseno.md`, `plan.md` y aquí; la parte nueva de T-010 pasa a llamarse (e2) en `tareas.md`, `diseno.md`, `plan.md`, pruebas y comentarios (la (e) de `tareas.md` sigue siendo `TarjetaCifra`).
7. **Lo que se acepta en el asunto A-14 de la 020** (decidido por el arquitecto por D-036, revocable): si la red cae a mitad de un cambio de periodo con el navegador en línea, Next 16.4.6 pasa a una carga completa de la dirección nueva; si el documento llega, se ve el periodo elegido pero **se pierde el foco en el `select`**; si el documento tampoco llega, **queda la página de error del navegador**, sin cifras y con una dirección que solo lleva claves de la lista, y al recargar con conexión se ve la vista correcta.

**Rojo observado.**
- Vitest: `fronteras.test.ts` (2 casos sembrados nuevos) y `periodo.test.ts` (1) fallaban antes de tocar `fronteras.ts` y `periodo.ts`; `periodo-transicion.test.tsx`, 3 en rojo antes de tocar el proveedor y la zona.
- Playwright: con `ERROR_MS` puesto a 30 000 000 (error imposible), la prueba de REQ-069 falla en `toHaveCount(2)` de los estados `error`; restituido.
- Los controles de `vigilarAnuncios` y de los contadores de servidor son pruebas de la propia medida: se ejecutaron en verde y no se observó su rojo sin código porque no hay código bajo prueba.

**Órdenes y resultado.**

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 0 | 33 archivos, 1144 pruebas en verde |
| `npx tsc --noEmit` | 0 | sin errores |
| `npx eslint src tests` | 0 | sin hallazgos |
| `npx prettier --check src tests specs/020-sistema-diseno-armazon` | 1 | solo `tests/unit/plataforma/acciones-fijadas.test.ts` (ajeno, ya fallaba en `main`) |
| Playwright con configuración derivada fuera del repo (puerto 3119, candado de suite): `periodo-servidor.spec.ts`, `cabecera.spec.ts` y `red-y-direccion.spec.ts` | 0 | **244 en verde** (incluye la prueba de REQ-069, los controles de anuncios y las cinco de servidor sin registro) |

No se ejecutaron: Playwright completo, `next build` suelto, vitest completo, Firefox y WebKit, lector de pantalla (el anuncio urgente se mide en la región, no se oye).

## T-010 (e2) · Ejecución final del orquestador (22/11/2026, sobre la rama rebasada en `main`, tras la vuelta de revisión)

`npx playwright test --config playwright.config.ts` (oficial, puerto 3100, `tests/e2e` completo, compila dentro), Chromium, 1 worker: **984 ejecutadas sin fallo**, 0 saltadas, 0 intermitentes, 243 s. `npx vitest run tests/unit/diseno --maxWorkers=2`: 33 archivos, 1144 en verde. Tipos, `eslint` (`src` y `tests`) y `comprobar-specs` en 0. La pasada completa anterior (977 en verde y 1 fallo: el centinela de `/muestra/servidor/`) no cuenta como final. Vitest completo, a cargo de la coordinación. Quedan por confirmar por el arquitecto: la transición de 30 s no cancelable, la región urgente para el error y el botón «Reintentar» duplicado por zona.

## T-010 (d) · `Boton`, `useAccion`, `leerResultadoAccion` y menores de (e2) (23/11/2026, rama `tarea/020-T-010d`)

**Qué.** `src/components/acciones/`: `resultado.ts` (`leerResultadoAccion`, lista cerrada de cuatro resultados), `controlador.ts` (cerrojo, plazo de 30 s, resultado por envío; sin React para probarlo con reloj simulado), `useAccion.ts` (gancho de cliente sobre el controlador con `useSyncExternalStore`) y `Boton.tsx`. Textos nuevos en `textos.ts` (`acciones.resultado`, `acciones.motivosDeRechazo`) y el tipo `TextoFijo` (hojas de `TEXTOS`): `Boton` solo admite un texto fijo. Muestra: entrada `boton-accion` del inventario con dos estados (`variantes`, `acciones`), una carpeta de página por estado y un simulador de respuestas del servidor en la propia página (no hay red).

**Decisiones donde el diseño no cierra la API** (lo más cerrado, revocables):
- Entrada de `leerResultadoAccion`: `{estado?, cuerpo?}` (código HTTP y cuerpo ya leído). 401 y 403 son `no_permitida` con cualquier cuerpo. `hecha` exige código 2xx o ninguno y un cuerpo que sea exactamente `{resultado:"hecha"}`; claves de más o código contradictorio: `incierta`. `rechazada` admite 2xx o 4xx (no 401/403), con motivo de la lista que declara quien envía (sin lista, ninguno vale). Errores de campo: máximo 20; campo o código fuera de las listas pasan a `{campo:null, codigo:null}` (error general) y se devuelve el valor de la lista, nunca el recibido.
- `alReleer` se llama con `hecha`, con `no_permitida` y con cualquier respuesta tardía; no con `rechazada` ni con `incierta`.
- `Boton`: dos variantes (`primario`, `secundario`), alto 40 px, `aria-disabled` y texto en curso (sin `textoEnCurso`, «Cargando»). No hay variante «peligro» (el diseño no la define): se pide al `disenador-ui` si hace falta. El primario lleva borde del color del acento para no quedar sin borde en colores forzados (PRUEBA-020).
- No hay jsdom ni biblioteca de pruebas de componentes (y no se añaden dependencias): el gancho se prueba por su controlador y por lectura del código; lo que depende del navegador, en `acciones.spec.ts`.

**Menores del punto 15 de `tareas.md`:** (a) hecho: R3 prohíbe todo `next/dist/…` en `src/components/` y fija la lista cerrada `ENTRADAS_DE_NEXT_PERMITIDAS = {next/navigation}` (las importaciones solo de tipo no cuentan), con 7 casos sembrados. (b) hecho: prueba de la llegada tardía sin reintento en `periodo-servidor.spec.ts` (0 estados de error, cifras del periodo elegido, 0 fotogramas con error y cifras, una sola petición). (c) hecho: el proveedor devuelve el foco al `select` al retirarse el error si se ha perdido (`focoPerdido`); comprobado con `document.activeElement` tras «Reintentar» y tras la llegada tardía. (d) hecho: el error de 30 s pinta el motivo, que ya empieza por «No se ha podido cargar», sin repetirlo. (e) hecho: el centinela de disco reconoce `route`. (f) hecho: `layout.muestra.tsx` entra como origen del grafo de registro; `src/instrumentation.ts` se comprueba aparte porque llega a la supervisión a propósito (alcanza `supervision.ts` y, por ella, `registro.ts`, y no `fallo-servidor.ts`; si cambia, la prueba falla). (g) no, como se pidió.

**Rojo observado.** `fronteras.test.ts`: 7 casos nuevos en rojo contra la regla antigua antes de cambiar `apoyo/fronteras.ts`. Las pruebas de `acciones-*` se escribieron antes que los módulos y fallaban por no existir; tras el código, dos errores de la propia prueba (regex de tamaño y la palabra «children» en un comentario) corregidos.

**Órdenes y resultado**

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 0 | 36 archivos, 1219 pruebas en verde (1144 antes; 75 nuevas) |
| `npm run tipos` | 0 | sin errores |
| `npx eslint --max-warnings 0 src tests` | 0 | sin hallazgos |
| `npx prettier --check` de lo tocado | 0 | formato correcto |
| Playwright `tests/e2e/muestra` completo (puerto 3115, candado, configuración temporal borrada) | 0 | **1093 en verde**. Una pasada previa: 1091 y 2 en rojo (`colores forzados`, `controles sin borde` del botón primario, corregido con el borde) |
| `npm run build` | 0 | compila |

**No ejecutado:** vitest completo (a cargo de la coordinación); Firefox y WebKit; lector de pantalla (los mensajes se anuncian por la región cortés, no se oyen); `acciones.spec.ts` simula al servidor en la página, no hay acción real de servidor (la 021 y T-016 (h)); PRUEBA-015 completa (diálogo, formulario, avisos) espera a T-009 (g) y a T-016/T-010 (j); «lo escrito se conserva» no se prueba porque aún no hay formulario (T-016 (a)).

## T-010 (e) `TarjetaCifra` y (f) `EtiquetaEstado` (23/11/2026, rama `tarea/020-T-010ef`)

**Qué.** (e) `src/components/cifras/`: `TarjetaCifra` (grupo con `aria-labelledby` a etiqueta, valor, variación y periodo; valor por `formatearCifra`/`leerCifra`; variación por `calcularVariacion`; valoración favorable, desfavorable o neutra declarada por la vista, siempre con signo y palabra), `ValorAjustado` (baja por pasos de la escala hasta que cabe; sin `style` en línea, sin abreviar ni cortar; parte el valor si ni el último paso cabe) y `ajuste.ts` (lógica pura). (f) `src/components/estado/EtiquetaEstado.tsx`: `leerEstado` y catálogo, tono, icono y palabra; fuera de catálogo, «Estado desconocido» neutro sin pintar el valor recibido. Textos nuevos en `TEXTOS.cifras`. Muestra: entradas `tarjeta-cifra` (4 estados) y `etiqueta-estado` (2 estados), una página fija por estado y vistas en `src/app/muestra/_vistas/cifras/`.

**Pruebas.** `tests/unit/diseno/cifras-ajuste.test.ts`, `cifras-tarjeta.test.tsx`, `estado-etiqueta.test.tsx` y `tests/e2e/muestra/cifras-y-etiquetas.spec.ts` (448 líneas). Escritas por un agente anterior que murió por un error de API sin informar; esta sesión las comprobó en verde sin rehacerlas, y no observó su rojo previo.

**Órdenes y resultado**

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 0 | 39 archivos, 1285 pruebas en verde |
| `npm run tipos` | 0 | sin errores |
| `npx eslint --max-warnings 0` de lo tocado | 0 | sin hallazgos |
| `npx prettier --check` de lo tocado | 0 | formato correcto |
| `npm run build` | 0 | compila |
| Playwright `tests/e2e/muestra` completo (puerto 3110, configuración temporal ya borrada, candado de suite) | 0 | **1327 en verde**, 0 fallos, 3,8 min |

**Candado.** `.git/suite-completa.lock` seguía con fecha 10:25:18 a las 11:13 (más de 45 minutos): se dio por abandonado, se quitó con `rmdir`, se tomó uno propio para build y Playwright y se soltó al acabar.

**No ejecutado:** vitest completo (coordinación); Firefox y WebKit; lector de pantalla; revisión independiente (pendiente del `revisor`).

## T-010 (g) `Tabla`, `Paginacion` y `RegionDesplazable` (23/11/2026, rama `tarea/020-T-010g`)

**Qué.** `src/components/tabla/`: `logica.ts` (pura: posición con miles, página corregida, números de página con huecos, orden de lista cerrada, `esquemaDeTabla` para la dirección, `leerCelda`, avisos de cambio), `Tabla.tsx`, `Paginacion.tsx` y `RegionDesplazable.tsx`. Textos nuevos en `TEXTOS.tabla`. Muestra: entrada `tabla` del inventario con nueve estados (`datos`, `intermedia`, `ultima`, `una-pagina`, `vacia`, `diez-mil`, `ancha`, `nombres-largos-120`, `texto-hostil`), una carpeta de página fija por estado, vistas en `src/app/muestra/_vistas/tabla/` (servidor simulado en la propia página, sin red).

**Decisiones donde el diseño no cierra la API (lo más cerrado; revocables).**
- `Tabla` es controlada con una sola función: `alCambiar({pagina, orden})`. Al ordenar la página vuelve a la 1; al paginar se conserva el orden. No importa `next/navigation` (la regla de PRUEBA-008 deja ese paquete solo a `SelectorPeriodo`): la vista que la use lleva página y orden a la dirección con `esquemaDeTabla` y `escribirEstadoDireccion`.
- Dirección: `pagina` (entero 1 a 100.000), `orden` (lista de las columnas ordenables) y `sentido` (`ascendente` o `descendente`). `rutaParaCambiarPeriodo` ya conserva las listas y devuelve `pagina` a 1 (comprobado en la prueba). Una página mayor que la última se corrige en `calcularPaginacion` (la última); el servidor debe pedir esa página.
- Total no válido (negativo, NaN, no entero, mayor o igual que 1e12) = 0 = estado vacío (cierra en fallo). Con 0 filas pintables, o total 0, o sin columnas válidas, se pinta el estado vacío. `EstadoVacio` aún no existe (T-016): `Tabla` lleva un bloque propio con `TEXTOS.tabla.vacio`; T-016 debe sustituirlo.
- Solo se pintan las primeras `tamano` filas recibidas (25 por defecto, 100 como mucho): 10.000 filas recibidas son 25 en el documento. De cada fila solo se leen las claves de las columnas declaradas y si son propias.
- Columnas: `{clave, etiqueta, tipo: texto|numero|porcentaje|fecha|estado, ordenable, decimales, minimo, ambito}`. La primera columna es el encabezado de fila (`th scope=row`). `aria-sort` solo en la columna ordenada. Ordenar alterna ascendente y descendente (no hay vuelta al «sin orden»; el orden por defecto es el de la vista).
- Los botones de paginación son botones (no enlaces) con `aria-disabled` en los extremos para no perder el foco. El nombre de la navegación lleva el título de la tabla (si no, dos tablas repetirían el nombre y `axe` lo marca).
- `RegionDesplazable` lleva siempre `tabindex="0"` (no mide el desbordamiento: quitarlo con el foco dentro lo perdería).
- Anuncios (`anunciar`) en el manejador del clic: «Ordenado por Cliente, ascendente» y «Página 2 de 50. Del 26 al 50 de 1.234».
- No falta ningún par de color: los botones usan pares ya declarados (`--texto`, `--texto-secundario` y `--texto-sobre-acento` sobre `--superficie` y `--acento`).

**Pruebas.** `tests/unit/diseno/tabla-logica.test.ts` y `tabla-componentes.test.tsx` (escritos antes que el código; la ejecución en rojo antes del código no se observó por separado: los módulos no existían, así que el primer resultado fue de importación); `tests/e2e/muestra/tabla.spec.ts` (PRUEBA-014 tabla, PRUEBA-013 y PRUEBA-025 sobre los nueve estados, 320 y 1280 px, claro y oscuro; teclado, ratón, táctil, colores forzados, zum, espaciado, nombres de 120 caracteres, región desplazable sin trampa, texto hostil, 10.000 filas en 200 ms).

**Menor 15 (g)** (botón «Reintentar» duplicado por zona): no toca de forma natural a esta parte; se deja para T-016.

**Órdenes y resultado (T-010 (g))**

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 0 | 41 archivos, 1390 pruebas en verde (1285 antes; 105 nuevas) |
| `npm run tipos` | 0 | sin errores |
| `npx eslint --max-warnings 0 src tests` | 0 | sin hallazgos |
| `npx prettier --check` de lo tocado | 0 | formato correcto |
| `npm run build` | 0 | compila |
| Playwright `tests/e2e/muestra` completo (puerto 3137, configuración temporal borrada, candado de suite tomado y soltado) | 0 | **1652 en verde** (1327 antes; 325 nuevas: 77 de `tabla.spec.ts` más los casos por estado de `anchos`, `accesibilidad`, `combinaciones`, `tema-y-movimiento`, `red-y-direccion`, etc.) |

**Hallazgos de las pruebas, corregidos.** (1) PRUEBA-020 (colores forzados) marcó la `table` y los cuatro botones de orden sin borde: el borde pasa de un contenedor a la propia `table` y los botones llevan `border-transparent` (en colores forzados el navegador lo sustituye por un color del sistema). (2) Playwright trata `aria-disabled` como no activable: la prueba de pulsar «Siguiente» desactivado usa `force`. (3) Errores de las propias pruebas (td por tipo, 1234 sin punto como nombre, mínimo de botones).

**No ejecutado.** Vitest completo (coordinación); Firefox y WebKit; lector de pantalla (los anuncios van por la región cortés, no se oyen); táctil real (solo `tap` emulado); el rojo previo de las pruebas unitarias no se observó por separado; revisión independiente (pendiente del `revisor`); carga y error de la tabla (T-016, `BloqueDatos`); ninguna vista real usa aún `esquemaDeTabla` con la dirección (la muestra guarda página y orden en el estado del componente, no en la URL).

**Menores y pendientes para otros.** `EstadoVacio` (T-016) debe sustituir al bloque vacío propio de `Tabla`; el botón «Reintentar» duplicado (15 g) sigue para T-016; `esquemaDeTabla` + `rutaParaCambiarPeriodo` conservan `orden` y `sentido` y reinician `pagina` (probado), pero la vista real debe pedir al servidor la página ya corregida; sin `disenador-ui`: el botón de orden con `border-transparent` y la tabla sin esquinas redondeadas (borde de la `table` en vez del contenedor) son decisión del ingeniero.

**Vuelta atrás.** Borrar `src/components/tabla/`, `src/app/muestra/_vistas/tabla/`, `src/app/muestra/componentes/tabla/`, la entrada `tabla` del inventario, `TEXTOS.tabla` y las tres pruebas nuevas.
