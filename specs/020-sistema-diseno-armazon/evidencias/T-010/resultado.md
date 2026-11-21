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
