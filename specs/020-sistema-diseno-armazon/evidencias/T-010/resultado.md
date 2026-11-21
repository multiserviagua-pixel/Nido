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
