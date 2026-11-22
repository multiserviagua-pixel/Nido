# T-113 · Revisión WCAG 2.2 AA de la pantalla de activación (PRUEBA-010)

Fecha: 22/11/2026. Revisor: `disenador-ui`. Alcance: `GET/POST /oauth/autorizar` (`src/app/oauth/autorizar/route.ts`), cuyo HTML sale de `src/lib/oauth/pantalla.ts` (T-109). Requisito: REQ-005, CA-005.

## Resultado

**0 bloqueantes.** 0 criterios incumplidos. 5 menores propuestos. Lo que exige navegador queda como «no comprobado: T-119 (AR-16)». T-113 cierra la parte de código, contraste y teclado por análisis; la parte renderizada de PRUEBA-010 (360 px, zoom, lector, foco pintado) pasa a T-119.

## Cómo se comprobó

1. Lectura del generador completo (`pantalla.ts`: HTML, CSS y textos) y de la ruta.
2. Se renderizaron los seis estados con la función real `renderizarPantalla`, usando una copia de `callbacks.ts` y `pantalla.ts` con la extensión del import ajustada para ejecutarla con `node --experimental-strip-types`, sin tocar el producto. Script: `generar-y-contrastar.mjs` (importa `./pantalla.ts`, la copia ajustada); HTML resultante en `html/` (formulario, formulario_error, bloqueado, solicitud_no_valida, no_disponible, aceptado). Estados HTTP: 200, 200, 429, 400, 503, 200.
   Para reproducirlo: copiar `src/lib/oauth/callbacks.ts` y `src/lib/oauth/pantalla.ts` a una carpeta temporal junto a `generar-y-contrastar.mjs`, cambiar en `pantalla.ts` `from "./callbacks"` por `"./callbacks.ts"` y ejecutar `node --experimental-strip-types generar-y-contrastar.mjs <carpeta de salida>`. Los colores de la tabla `T` del script están copiados a mano de `ESTILO` (coinciden hoy, claro y oscuro).
3. Comprobaciones sobre ese HTML: `lang="es"` en los seis; un `h1` en cada uno; `viewport` sin `maximum-scale` ni `user-scalable`; 0 `tabindex`; 0 `script`, `link`, `src`, `http-equiv` (nada externo); sin anchos en px (solo `1px` de borde, `44px` de objetivo, `2px` y `3px` de borde y foco).
4. Contrastes con la fórmula de WCAG 2.2: `L = 0,2126 R + 0,7152 G + 0,0722 B` con cada canal linealizado; razón = (L1 + 0,05) / (L2 + 0,05). Variables CSS reales de `ESTILO`; coinciden con los papeles de `docs/DISENO.md` en tema claro y oscuro.

Cuenta de muestra (texto del botón, tema claro): `#6C3CE9` tiene canales lineales R 0,150, G 0,045, B 0,815, luego L = 0,0319 + 0,0323 + 0,0588 = 0,123; `#FFFFFF` tiene L = 1; razón = 1,05 / 0,173 = **6,07**, igual que el script y que DISENO. Las demás cifras salen del script.

### Contrastes (script)

| Par | Papel | Claro | Oscuro | Umbral |
| --- | --- | --- | --- | --- |
| texto sobre tarjeta (h1, p, etiqueta, texto escrito) | `--texto` / `--superficie` | 17,85 | 15,25 | 4,5 |
| texto sobre la página | `--texto` / `--fondo` | 17,06 | 17,19 | 4,5 |
| ayuda `.ayuda` | `--secundario` / `--superficie` | 7,58 | 7,59 | 4,5 |
| error `.error` | `--error` / `--superficie` | 6,47 | 6,04 | 4,5 |
| correcto `.correcto` | `--correcto` / `--superficie` | 5,02 | 9,59 | 4,5 |
| texto del botón | `--sobre-acento` / `--acento` | 6,07 | 6,56 | 4,5 |
| borde del campo | `--control` / `--superficie` | 4,76 | 4,83 | 3 |
| borde del campo inválido | `--error` / `--superficie` | 6,47 | 6,04 | 3 |
| botón frente a la tarjeta | `--acento` / `--superficie` | 6,07 | 6,14 | 3 |
| contorno de foco frente a la tarjeta | `--foco` / `--superficie` | 4,23 | 6,14 | 3 |
| contorno de foco frente al fondo | `--foco` / `--fondo` | 4,05 | 6,92 | 3 |

Los márgenes más justos, correcto (5,02) y foco en claro (4,05), pasan.

## Criterios

| Criterio | Resultado | Cómo se comprobó y evidencia |
| --- | --- | --- |
| 1.1.1 Contenido no textual | Cumple | No hay imágenes, iconos ni SVG (lectura del HTML). |
| 1.3.1 Información y relaciones | Cumple | `main`, un `h1`, `label for="codigo"` con `id="codigo"`, `form`, `button`; ayuda y error asociados con `aria-describedby`. Revisado en `html/formulario*.html`. |
| 1.3.2 Secuencia con sentido | Cumple | Orden del DOM: título, asistente, aviso, etiqueta, ayuda, error, campo, botón. Sin `order` ni posicionamiento en el CSS. |
| 1.3.4 Orientación | Cumple | Sin bloqueo de orientación. |
| 1.3.5 Finalidad de la entrada | No aplica | `autocomplete="one-time-code"` no figura en la lista de finalidades de entrada de WCAG (§7); se mantiene por usabilidad. |
| 1.4.1 Uso del color | Cumple | El error lleva texto («Error: » y la frase) además del rojo; el borde inválido es refuerzo. Lo correcto lleva «Código aceptado.». |
| 1.4.3 Contraste mínimo | Cumple | Tabla anterior: todo texto >= 5,02 en claro y >= 6,04 en oscuro. |
| 1.4.4 Cambio de tamaño del texto (200 %) | Cumple por análisis; zoom real no comprobado: T-119 (AR-16) | Todo en `rem` salvo el objetivo de 44 px; sin `maximum-scale`; sin alturas fijas, solo `min-height`. |
| 1.4.5 Imágenes de texto | Cumple | No hay. |
| 1.4.10 Reflow a 320 y 360 px | Cumple por análisis; render a 320/360 px y zoom 400 % no comprobados: T-119 (AR-16) | CSS: `box-sizing:border-box`; `main` con `max-width:30rem` y relleno de 1 rem; campo `width:100%`; `h1` y `p` con `overflow-wrap:anywhere`; botón `max-width:100%` con texto centrado; sin anchos en px. A 320 px la tarjeta deja 320 - 32 - 40 - 2 = 246 px útiles. |
| 1.4.11 Contraste no textual | Cumple | Borde del campo 4,76 / 4,83; foco 4,23 / 6,14; botón 6,07 / 6,14; campo inválido 6,47 / 6,04. En colores forzados los bordes pasan a `CanvasText` y el foco a `Highlight` (lectura del CSS; render forzado no comprobado: T-119). |
| 1.4.12 Espaciado del texto | Cumple por análisis; con marcador no comprobado: T-119 (AR-16) | Sin alturas ni anchos fijos que recorten. |
| 1.4.13 Contenido al pasar el ratón o al enfocar | No aplica | Sin tooltips ni desplegables. |
| 2.1.1 Teclado | Cumple por código; uso real no comprobado: T-119 | Solo elementos nativos: campo y botón (Intro envía) y, al aceptar, un enlace. Sin JavaScript (`default-src 'none'`, 0 `script`). |
| 2.1.2 Sin trampas de teclado | Cumple | Sin JavaScript ni `tabindex`. |
| 2.2.1 Tiempo ajustable | Cumple (esencial) | La caducidad de la solicitud y del código es esencial para la seguridad; el texto la dice («Caduca a los 10 minutos», «ha caducado») y se puede pedir otro código. |
| 2.2.2 Pausar, detener, ocultar | No aplica | Sin movimiento. |
| 2.3.1 Tres destellos | Cumple | Sin animación. |
| 2.4.1 Evitar bloques | Cumple | Una página con `main` y dos paradas de tabulación. |
| 2.4.2 Título de la página | Cumple | `Activar el conector de HumanaIA` (ver M1). |
| 2.4.3 Orden del foco | Cumple | Formulario: 1. campo del código, 2. «Activar». Aceptado: 1. «Continuar en ...». Sin `tabindex`; orden del DOM. |
| 2.4.4 Propósito del enlace | Cumple | «Continuar en claude.ai» / «Continuar en ChatGPT». |
| 2.4.6 Encabezados y etiquetas | Cumple | «Código de activación» describe el campo; el `h1` describe la página. |
| 2.4.7 Foco visible | Cumple por CSS; foco pintado no comprobado: T-119 (AR-16) | `:focus-visible{outline:3px solid var(--foco);outline-offset:2px}`; ningún `outline:none`; el campo siempre cumple `:focus-visible`. |
| 2.4.11 Foco no oculto (mínimo) | Cumple | Sin elementos fijos ni superpuestos. |
| 2.5.1 / 2.5.2 Gestos y cancelación | Cumple | Solo pulsación simple en elementos nativos. |
| 2.5.3 Etiqueta en el nombre | Cumple | El botón se llama «Activar», igual que su texto visible. |
| 2.5.7 Arrastre | No aplica | Sin arrastre. |
| 2.5.8 Tamaño del objetivo (mínimo) | Cumple | Campo y botón con `min-height:44px`; botón con `min-width:44px` (umbral 24 px). |
| 3.1.1 Idioma de la página | Cumple | `<html lang="es">` en los seis estados (script). Textos 100 % en español. |
| 3.2.1 / 3.2.2 Al enfocar y al introducir datos | Cumple | Sin cambio de contexto salvo al pulsar «Activar». |
| 3.2.6 Ayuda coherente | No aplica | Una sola página; la indicación «Pide uno nuevo a HumanaIA» es la misma en todos los estados. |
| 3.3.1 Identificación del error | Cumple | `p#error-codigo` con `role="alert"` y texto «El código no es válido o ha caducado...»; el campo lleva `aria-invalid="true"` y `aria-describedby="error-codigo ayuda-codigo"` (`html/formulario_error.html`). |
| 3.3.2 Etiquetas o instrucciones | Cumple | Etiqueta visible y ayuda con plazo y uso único. |
| 3.3.3 Sugerencia ante errores | Cumple | Dice qué hacer («Pide uno nuevo a HumanaIA»). No distingue inválido de caducado a propósito (cierre en fallo, art. 3). |
| 3.3.4 Prevención de errores | No aplica | No es una transacción legal ni financiera. |
| 3.3.7 Entrada redundante | Cumple | `state` y solicitud viajan en campos ocultos; la persona no repite nada. |
| 3.3.8 Autenticación accesible (mínimo) | Cumple | Código de un solo uso, sin prueba cognitiva; pegar permitido (sin JavaScript) y `autocomplete="one-time-code"`. |
| 4.1.1 Procesamiento | Obsoleto en 2.2 | El HTML sale bien formado y con `id` únicos (lectura). |
| 4.1.2 Nombre, función, valor | Cumple por código; anuncio en lector no comprobado: T-119 | Controles nativos con nombre (`label`, texto del botón); `aria-invalid` y `aria-describedby` coherentes. |
| 4.1.3 Mensajes de estado | Cumple por código; anuncio real no comprobado: T-119 (AR-16) | No hay mensajes dinámicos (sin JavaScript): cada resultado es una página nueva con `role="alert"` (errores) o `role="status"` (aceptado). El texto está además en el orden de lectura, así que no depende del anuncio. |

## No comprobado: T-119 (AR-16)

Zoom 400 % y render a 320/360 px; foco visible pintado y no recortado; recorrido real con teclado; lector de pantalla (orden de lectura, anuncio del error con `autofocus` y `role="alert"`, «Error:» generado por CSS); espaciado del texto con marcador; colores forzados y tema oscuro renderizados; mensaje nativo de `required` en español. No se usó axe (MCP sin conexión), ni Playwright, ni build (sin memoria).

## Hallazgos (todos menores; ninguno bloquea)

- **M1 · 2.4.2 / 2.4.6.** El `<title>` es el mismo en los seis estados y está escrito dos veces (`TEXTOS.titulo` y el literal de `pagina()`). Corrección: pasarlo como parámetro y, en error, usar «Error. Activar el conector de HumanaIA» (y «Código aceptado» en éxito).
- **M2 · 1.3.1.** «Error: » se genera con `::before`; casi todos los lectores lo leen, pero no está garantizado. Corrección: ponerlo en el DOM como texto. Revisar en T-119.
- **M3 · 1.4.3.** No hay `color-scheme` en `:root`: los controles nativos (autocompletado, barras de desplazamiento) pueden salir claros sobre fondo oscuro. Corrección: `color-scheme:light dark`. Cambia `ESTILO` y por tanto `HUELLA_ESTILO`; PRUEBA-009 debe recalcularla.
- **M4 · 2.4.7.** El foco en claro frente al fondo de página mide 4,05: pasa (3), pero es el margen más justo. No bajar `--foco` en claro.
- **M5 · 3.3.1.** Con `autofocus` en el error, el lector lee etiqueta y descripciones y puede repetir el `role="alert"`. Decidir en T-119 con lector real: si repite, quitar `role="alert"` y conservar `autofocus` y `aria-describedby`.

Veredicto: T-113 **con hallazgos** (5 menores, 0 bloqueantes). PRUEBA-010 en navegador sigue en T-119.
