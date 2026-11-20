# T-001 · PRUEBA-011: el foco en navegador real

Tarea T-001 de la función 020 (`tareas.md`, bloque A). La hizo `qa` el 20/11/2026. Es evidencia; no cambia el diseño. La decisión por pieza es la que escribe la regla del diseño (ver «Decisión por pieza»). Corregida el 20/11/2026 tras el dictamen del revisor (commit «T-001 (020): corrección de la evidencia tras el dictamen»); lo que cambió respecto del primer commit está en el apartado 7.

```
commit:    c29e8ec (base: main con 002·T-002 y T-003); la evidencia queda en el commit «T-001 (020)» de la rama tarea/020-T-001
prueba:    PRUEBA-011 (CA-003, CA-013; REQ-004, REQ-017, REQ-018, REQ-021, REQ-035)
fecha:     2026-11-20
entorno:   local, Windows 11, Node 26.13.0, npm 11.20.0, Next.js 16.4.6 en compilación de producción (next build + next start), React 19.3.1
comando:   npx playwright test -c e2e/playwright.config.ts <archivo> (ver cada apartado)
resultado: Radix, diálogo de confirmación y cajón: superada en los tres motores. Radix, aviso: FALLIDA (la pausa del aviso por el foco falla de forma intermitente: una vez en WebKit en la primera ejecución y 2 de 6 en Chromium con el tabulador pulsado justo al abrir; en la última ejecución completa pasa en los tres motores). Elemento nativo dialog: fallida. Estilos en línea: medida hecha
revisor:   pendiente (lo asigna el orquestador)
```

## 1. Qué se hizo

1. Se leyó el diseño (apartado «Diálogo, cajón y avisos», regla de decisión por pieza, alternativas A y B), el plan y A-11.
2. **Primero la prueba.** Se escribió el guion (`foco.spec.ts`, `estilos.spec.ts`) con su criterio de paso y fallo en la cabecera, y se ejecutó sin ninguna página: **86 de 86 pruebas fallan** en Chromium (`salidas/paso0-sin-implementacion-chromium.txt`).
3. Se montó una copia desechable de la app (copia de `main` con `git archive`, fuera del repositorio) con cuatro páginas: `/prueba-foco/radix`, `/prueba-foco/nativo` (alternativa A), `/prueba-foco/roto` (a propósito sin gestión de foco, para comprobar que el guion puede fallar) y `/prueba-foco/robafoco` (añadida en la corrección: es la de Radix con una sola cosa mal, un aviso que mueve el foco a su botón 150 ms después de activarlo). Cada página lleva una tabla, un formulario y un gráfico de Recharts; Radix y la rota llevan además un aviso.
4. Se ejecutó en Chromium, Firefox y WebKit con teclas reales (`page.keyboard`), ratón y táctil (`page.tap` en contexto con `hasTouch`).
5. Se midieron los estilos en línea con una política de contenido estricta (`style-src 'self'`, sin `'unsafe-inline'`) en modo de solo informe, y como comprobación extra con la política aplicada.

## 2. Resultados

### 2.1 El guion puede fallar (prueba de la prueba)

| Variante | Chromium | Firefox | WebKit | Lectura |
| --- | --- | --- | --- | --- |
| Sin página (404) | 86 de 86 fallan | no se repitió | no se repitió | La prueba exige la implementación |
| `robafoco` (Radix más un robo de foco del aviso), comprobación «el aviso no roba el foco», 3 vías (teclado, ratón, táctil) | 3 de 3 fallan | 3 de 3 fallan | 3 de 3 fallan | La comprobación de foco restaurada puede fallar y falla por el motivo correcto (mensaje «el aviso no roba el foco…»; `salidas/paso10-no-roba-foco-tres-variantes.txt`) |
| `roto` (diálogos y aviso hechos a mano sin foco, sin inertizar el fondo, sin Escape, aviso que roba el foco y no se cierra) | 27 fallan, 4 pasan | 27 fallan, 4 pasan | 27 fallan, 4 pasan | El guion detecta la ausencia de gestión de foco. Las 4 que pasan son las 3 de `axe` (que no mira el comportamiento) y la de las 50 tabulaciones con aviso (que mide que no haya trampa, y la rota no la tiene). Esta ejecución es la anterior a la corrección y no se repitió: en `roto` las tres pruebas «no roba el foco» fallan antes de llegar a la comprobación de foco, porque la página rota no tiene región `aria-live` (`salidas/paso10-no-roba-foco-tres-variantes.txt`, error «texto en región aria-live=polite»); por eso se añadió `robafoco` |

### 2.2 Radix (diálogo de confirmación, cajón, aviso)

Ejecución completa: `salidas/paso4-foco-tres-motores.txt` y `salidas/paso4-resumen-fallos.txt`. Comando: `VARIANTES=radix,nativo,roto npx playwright test -c e2e/playwright.config.ts foco.spec.ts`. Cifras: Chromium 57 superadas y 29 fallidas, Firefox 57 y 29, WebKit 47 y 39, de las que los fallos de `roto` y `nativo` son los esperados y se explican arriba y en 2.3. **Ninguna prueba de las 31 de Radix falló en esa ejecución.** La prueba 32 (pausa del aviso por el foco) se añadió después, ver 2.2.1.

Reejecución tras la corrección (`VARIANTES=radix npx playwright test -c e2e/playwright.config.ts foco.spec.ts`, `salidas/paso10-radix-completo-tres-motores.txt`): las 32 pruebas de Radix, con la comprobación «el aviso no roba el foco» restaurada (apartado 2.2.2), **96 de 96 superadas** (32 por motor). Una ejecución intermedia con la primera versión restaurada dio 94 superadas y 2 fallidas en WebKit (ratón y táctil); la causa está en 2.2.2 (`salidas/paso10-radix-completo-primera-version.txt`).

| Pieza | Pruebas | Chromium | Firefox | WebKit |
| --- | --- | --- | --- | --- |
| Diálogo de confirmación (alerta) | 14: abre con teclado; nombre y descripción accesibles; el foco entra y va a «Cancelar»; el fondo queda inerte (no se puede pulsar y sale del árbol de accesibilidad); Intro nada más abrir cancela y no confirma; 50 tabulaciones y 50 con Mayúsculas, 100 de 100 dentro; abrir con teclado, ratón y táctil × cerrar con Escape, «Cancelar» y «Eliminar», con el foco de vuelta en el botón (9); 0 infracciones de `axe` | superada | superada | superada |
| Cajón | 10: lo mismo, sin Intro; cierre con Escape y con «Cerrar menú» (6 combinaciones) | superada | superada | superada |
| Aviso | 8 (3 de «aparece, se anuncia y no roba el foco» por vía, más 5): aparece con teclado, ratón y táctil; se anuncia en una región `aria-live="polite"`; no mueve el foco (comprobación estricta, 2.2.2); la página sigue operable; dura 8 s (medido: 8000, 8218 y 8049 ms); se detiene con el puntero encima; con el foco dentro no desaparece (la fila siguiente); «Cerrar aviso» se alcanza con el tabulador (11 pulsaciones) y cierra con Intro; Escape lo cierra con el foco dentro; 50 + 50 tabulaciones sin trampa (14 elementos distintos); 0 infracciones de `axe`. Las duraciones, las 11 pulsaciones y los 14 elementos vienen del informe JSON de Playwright del paso 4, que no se guardó entero (723 KB): el extracto con esos valores está en `salidas/paso4-anotaciones-aviso.txt` | superada | superada | superada |
| Aviso: pausa por el foco (la prueba 32) | Con el foco en «Cerrar aviso» el aviso sigue a los 10 s. Prueba `foco.spec.ts` y repeticiones con el tabulador pulsado justo al abrir y 600 ms después (2.2.1) | superada en la primera ejecución; superada en la última. Repeticiones: **fallida** (2 de 6 con el tabulador inmediato) | superada en las dos ejecuciones; 6 de 6 en las repeticiones | **fallida** en la primera ejecución (el aviso se retira a los 8 s con el foco dentro); superada en la última ejecución y 6 de 6 en las repeticiones nuevas |

Nota de honradez sobre el guion. En la primera pasada en Chromium fallaron 20 pruebas de Radix por defectos **del guion o de mi página**, no de Radix, y se corrigieron: (a) el foco vuelve al botón un instante después de cerrar, así que se espera hasta 2 s con `expect.poll` (si no volviera nunca, la prueba falla); (b) el anuncio de Radix es efímero (dura 1 s), así que se recoge con un `MutationObserver` desde la carga; (c) mi hoja de estilos dejaba enlaces y botones del cajón por debajo de 24 px y `axe` (regla `target-size`) lo vio. Después, en WebKit, el guion suponía el foco en el botón tras un clic (Safari no enfoca botones con el ratón) y un enlace en el orden de tabulación (Safari no tabula enlaces por defecto): se cambió la comprobación del foco por «no está dentro del aviso ni de su región» y el último control de la página pasó de enlace a botón. **Sí se relajaron dos criterios:** la espera de 2 s de (a) y esa comprobación de foco del aviso, que dejó de exigir «el foco sigue donde estaba» y pasó a exigir solo «el foco no está dentro del aviso». La segunda era una relajación indebida (REQ-021, CA-015, art. 13): una variante que moviera el foco a otro sitio de la página la habría superado. En la corrección se restauró (apartado 2.2.2). La frase del primer commit «No se relajó ningún criterio, salvo la espera de 2 s» no era cierta.

#### 2.2.1 El aviso y la pausa por el foco: FALLO

Requisito: «permanece mientras el puntero o el foco están sobre él» (REQ-021). La pausa por puntero pasa en los tres motores. **La pausa por el foco falla de forma intermitente** (en Chromium con el tabulador pulsado justo al abrir; en WebKit, una vez).

- Prueba: `foco.spec.ts`, «con el foco dentro del aviso no desaparece (más de 10 s)…». Se abre el aviso con Intro, se tabula hasta «Cerrar aviso» con teclas reales y se espera 10 s. Resultado de la primera ejecución (`salidas/paso8-aviso-pausa-por-foco.txt`): Chromium superada, Firefox superada, **WebKit fallida** (el aviso se retira a los 8 s con el foco dentro). En la última ejecución completa (`salidas/paso10-radix-completo-tres-motores.txt`) pasa en los tres.
- Repetición del 20/11 (primera tanda, `salidas/paso9-aviso-pausa-por-foco-repeticiones.txt`; el aviso sigue visible a los 9,5 s con el foco dentro). Esta tanda **no comprobaba que el foco hubiera llegado a «Cerrar aviso» antes de contar** y su salida cuenta solo el resultado; es un indicio, no una medida firme:

| Motor | Tabulador justo al abrir | Tabulador 600 ms después de abrir |
| --- | --- | --- |
| Chromium | 4 de 6 | 6 de 6 |
| Firefox | 6 de 6 | 6 de 6 |
| WebKit | 2 de 6 | 6 de 6 |

- Repetición en la corrección (`depurar-pausa-por-foco.mjs.txt` corregido, que ahora comprueba que el foco llegó a «Cerrar aviso» antes de contar y escribe una línea en bruto por repetición; `salidas/paso10-pausa-por-foco-repeticiones.txt`). En las 36 repeticiones el foco llegó a «Cerrar aviso» (11 pulsaciones):

| Motor | Tabulador justo al abrir | Tabulador 600 ms después de abrir |
| --- | --- | --- |
| Chromium | **4 de 6** (el aviso desapareció a los 8 s con el foco dentro en las repeticiones 2 y 6) | 6 de 6 |
| Firefox | 6 de 6 | 6 de 6 |
| WebKit | 6 de 6 (no se reprodujo el 2 de 6 de la primera tanda) | 6 de 6 |

- Lectura. En Chromium el «4 de 6» queda confirmado con el foco comprobado: el fallo existe cuando el tabulador se pulsa justo después de abrir. En WebKit hubo un fallo de la prueba formal en la primera ejecución (`salidas/paso8-aviso-pausa-por-foco.txt`) y un 2 de 6 en la primera tanda, y no se reprodujo en la última ejecución completa ni en las 12 repeticiones nuevas. Por eso es intermitente y no se puede decir que el fallo de WebKit esté o no resuelto; no se encontró la variable que lo controla (carga de la máquina, momento de la hidratación). La prueba formal pasa en los tres motores en la última ejecución porque espera a que el aviso sea visible antes de tabular, y eso no cubre el tabulador inmediato.
- Causa probable, leída en el código de `@radix-ui/react-toast` 1.3.1 (`dist/index.mjs`, líneas 123 a 157): la pausa se engancha con `wrapper.addEventListener("focusin", …)` dentro de un `useEffect`. Si el foco entra en el aviso antes de que ese efecto haya enganchado el evento, nunca se pausa y el aviso se cierra a los 8 s con el foco encima. **Es una causa probable, no demostrada**: no se midió el instante del enganche ni cuánto tarda desde que aparece el aviso. Lo único medido es que con el tabulador pulsado sin espera falla en Chromium (2 de 6) y con 600 ms de espera no falla (0 de 6, en las dos tandas). La cifra de «decenas de milisegundos» y la de «ventana de unos 100 ms» del primer commit eran una conjetura mía, no una medida, y se retiran: la ventana está entre 0 y 600 ms y no se acotó más.
- Lo que no sé: si una persona real llega a tabular tan deprisa tras activar el aviso, y si Safari real se comporta como el WebKit de Playwright. El criterio escrito en la especificación y la regla de decisión del diseño no distinguen: **una comprobación de foco que falla en algún motor es un fallo**, y aquí ha fallado en Chromium y en WebKit en alguna ejecución.

#### 2.2.2 «El aviso no roba el foco»: criterio restaurado

Criterio (REQ-021, CA-015): al activar el aviso, `document.activeElement` sigue siendo el mismo elemento. El guion guarda el elemento enfocado antes de activar el aviso y exige, 1,5 s después, que `document.activeElement` sea ese mismo elemento.

- **Control de motor.** Con ratón y táctil, WebKit manda el foco al cuerpo del documento en **cualquier** pulsación de botón, también en uno que no abre nada (`salidas/paso10-sonda-foco-webkit.txt`: Chromium y Firefox dejan el foco en el botón pulsado; WebKit lo deja en `body`, con `#abrir-aviso` y con `#fila-1`). Por eso la primera versión restaurada falló en WebKit con ratón y táctil en una página Radix correcta (`salidas/paso10-radix-completo-primera-version.txt`). El guion ahora pulsa antes «#fila-1» con la misma vía y mide dónde cae el foco; si cae en el cuerpo, exige que tras activar el aviso el foco esté en el cuerpo, y si no, en el botón que lo activó. Es una adaptación al motor, no una relajación: un aviso que moviera el foco a su botón o a cualquier otro elemento falla en los tres motores.
- **El guion puede fallar.** Con `robafoco`: 9 de 9 fallan (3 vías por 3 motores) con el mensaje «el aviso no roba el foco…» (`salidas/paso10-no-roba-foco-tres-variantes.txt`). Con Radix: 9 de 9 superadas, en la misma ejecución. Con la primera versión de la comprobación, antes del control de WebKit, `robafoco` ya fallaba 9 de 9 (`salidas/paso10-robafoco-primera-version.txt`).
- La variante `roto` no llega a esta comprobación (falla antes, en la región `aria-live`), así que no prueba por sí sola la de foco; esa la prueba `robafoco`.

### 2.3 Alternativa A: elemento nativo `dialog` con `showModal()`

Medida igualmente aunque Radix pase, como pide el diseño. Misma prueba, mismas páginas.

| Comprobación | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Abre con teclado; nombre y descripción; el foco entra (en «Cancelar» con `autofocus`) | superada | superada | superada |
| Fondo inerte (no se puede pulsar; el diálogo cumple `:modal`) | superada | superada | superada |
| Intro nada más abrir no confirma | superada | superada | superada |
| 50 tabulaciones y 50 con Mayúsculas sin que el foco salga | **fallida** | **fallida** | **fallida** |
| Cierre con Escape, botón y confirmar; foco de vuelta al botón, abierto con teclado | superada | superada | superada |
| Lo mismo, abierto con ratón o con táctil | superada | superada | **fallida** (el foco queda en el cuerpo) |
| 0 infracciones de `axe` | superada | superada | superada |

Detalle de las tabulaciones (100 pulsaciones por prueba): ninguna llevó el foco a la página (`fuera` = 0). Entre un 20 % y un 33 % de las pulsaciones dejan `document.activeElement` en el cuerpo del documento, que es el paso por la interfaz del propio navegador que el diseño ya anticipaba como «límite conocido» (cajón y confirmación, respectivamente: Chromium 24 y 33, Firefox 20 y 24, WebKit 33 y 25). Con ventana visible en Chromium y Firefox (`CABEZA=1`, `salidas/paso7-nativo-con-ventana.txt`) el resultado es el mismo (Chromium 22 y 29, Firefox 20 y 24). La lectura de si eso cuenta como «sacar el foco» en CA-013 es el asunto A-6, que decide el responsable: **la prueba, tal como está escrita, falla**, y no se ha reinterpretado.

Fallo adicional del elemento nativo en WebKit: tras abrir con ratón o con táctil, al cerrar el foco queda en el cuerpo y no vuelve al botón (las 10 combinaciones con ratón o táctil de las dos piezas; la prueba espera 2 s). Radix devuelve el foco en esas mismas combinaciones en WebKit.

### 2.4 Estilos en línea (primera medida)

Política de la medida (cabecera `Content-Security-Policy-Report-Only`): `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'report-sample'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`. Se permiten los scripts en línea para aislar los estilos (Next.js los necesita sin `nonce`). Se recoge el evento `securitypolicyviolation` del navegador y se escanea el DOM. Comando: `npx playwright test -c e2e/playwright.config.ts estilos.spec.ts`. Resultados completos por estado en `estilos/*.json`. Control del medidor: una inyección conocida (`style="color: red"`) queda registrada; si no, la prueba falla.

| Origen | Qué crea | Cuándo | Violación registrada |
| --- | --- | --- | --- |
| Recharts 3.10.1 | `style="position:relative;cursor:default;width:480px;height:200px"` en `div.recharts-wrapper` (en el HTML del servidor) | Al cargar | `style-src-attr` |
| Recharts 3.10.1 | `style="width: 100%; height: 100%; display: block;"` en el `svg` | Al cargar | Ninguna (lo pone el script con el DOM, no se bloquea) |
| Radix (al montar la página con avisos) | `<div style="pointer-events:none">` sin identificar con exactitud (no está en la variante nativa) | Al cargar | `style-src-attr` (los tres motores) |
| Radix `react-remove-scroll-bar` | Un elemento `<style>` de 775 caracteres con `.with-scroll-bars-hidden { overflow: hidden !important; padding-right: 0px !important; }…` | Cada vez que se abre un diálogo o el cajón; se retira al cerrar | `style-src-elem`, una por apertura |
| Radix | Atributos `style` puestos con el DOM (`pointer-events`, guardas de foco, `touch-action`, `user-select`) | Al abrir | Ninguna (se aplican por script) |
| Next.js | `style="position: absolute;"` en `next-route-announcer` y el estilo del anunciador | Siempre | Ninguna (se aplica por script) |
| Elemento nativo `dialog` | Nada propio; solo lo de Recharts y Next | | Una (la de Recharts) |

Nota sobre WebKit y el «atributo 1». En WebKit aparece una violación de atributo que Chromium y Firefox no cuentan en los estados 2 a 5 (Radix) ni en los estados 2, 3 y 5 de la página nativa (por eso WebKit da 3 donde los otros dan 2 con Radix, y 1 donde los otros dan 0 en la nativa). Lo más probable es que sea el **aviso tardío** de la inyección de control (`style="color: red"`), que WebKit notifica después de que el medidor haya cerrado la foto del estado en que se inyectó, y no una fuente de estilos nueva; tampoco se puede descartar que sea el atributo de Recharts notificado tarde. **No se comprobó** (habría que registrar el momento de cada evento). Mientras no se aclare, la cifra de WebKit se toma como cota superior en 1 y no como inventario.

Conteo en la página de Radix tras abrir diálogo, cajón y aviso: 10 atributos `style` y 1 elemento `<style>` en el pico (Chromium). En la página nativa: 4 atributos y 0 elementos `<style>`.

**Política aplicada de verdad** (`MODO_CSP=aplicar`, la misma política como `Content-Security-Policy`; `salidas/paso6-radix-con-politica-aplicada.txt`): las 31 pruebas de Radix **pasan en los tres motores** (31 + 31 + 31). Es decir, bloquear el `<style>` y los atributos en línea no rompe el comportamiento del foco. **No se midió el efecto visual** (compensación del ancho de la barra de desplazamiento, tamaño y posición del gráfico sin su atributo `style`). Tampoco se probó si `react-style-singleton` acepta un `nonce`.

## 3. Decisión por pieza (regla del diseño, aplicada tal como está escrita)

| Pieza | Resultado | Decisión según la regla |
| --- | --- | --- |
| Diálogo de confirmación y cajón (comparten primitiva) | Superan todo en los tres motores, con teclado, ratón y táctil | **Se sigue con Radix** (`@radix-ui/react-alert-dialog` 1.2.1 y `@radix-ui/react-dialog` 1.3.1) |
| Avisos temporales | Falla una comprobación de foco (pausa por foco, intermitente) en Chromium y WebKit | Regla del diseño (§Diálogo, cajón y avisos, punto 4): «los avisos fallan: solo los avisos pasan a un componente propio sobre la región de anuncios. No cambian el diálogo ni el cajón». **Aplicada: los avisos pasan a un componente propio (T-016 (b), antes T-050 del plan anterior)**, que repite las pruebas de 2.2, 2.2.1 y 2.2.2. No se dan por superados con `@radix-ui/react-toast` |
| Alternativa A (`dialog` nativo) | Falla en los tres motores (tabulador por el cuerpo del documento) y en WebKit no devuelve el foco con ratón o táctil | No hace falta: Radix pasa. Queda medida. Su ventaja real: 0 elementos `<style>` y 0 paquetes |
| Alternativa B (React Aria) | No se probó | No hace falta: nada pasó a la B |

Observaciones, que no cambian la regla:

- Con el aviso propio, la dependencia `@radix-ui/react-toast` (y su `react-visually-hidden`) sale del árbol. El aviso propio tiene que repetir las pruebas de 2.2, 2.2.1 y 2.2.2, incluida la pausa por foco con el tabulador pulsado justo al abrir, sobre la región `aria-live` que ya existe.
- Mantener `@radix-ui/react-toast` sería cambiar el diseño y necesita al responsable; este informe no lo propone ni lo da por bueno.
- Para la política de contenido de la 021 (A-4): con Radix hay una violación `style-src-elem` por cada apertura de diálogo y varias `style-src-attr` de Recharts y Radix; con la política aplicada, el foco funciona igual.

## 4. Dependencias y versiones (D-027, art. 4)

Instaladas solo en la copia desechable (`npm ci --ignore-scripts` y después `npm install --ignore-scripts --save-exact --before=2026-11-12T23:59:59Z …`). Fuente: `registry.npmjs.org`, leída el 20/11/2026 con `npm view <paquete> time --json`. Fechas de publicación de cada versión; hoy es el 20/11/2026, así que el límite de siete días cae el 13/11. Se usó el 12/11 a las 23:59:59 UTC (el mismo corte que D-027) y, por tanto, más estricto.

| Paquete | Versión instalada | Publicada | Último en el registro | Nota |
| --- | --- | --- | --- | --- |
| `@radix-ui/react-alert-dialog` | 1.2.1 | 12/10/2026 | 1.2.1 | Coincide con el diseño |
| `@radix-ui/react-dialog` | 1.3.1 | 12/10/2026 | 1.3.1 | Ídem |
| `@radix-ui/react-toast` | 1.3.1 | 12/10/2026 | 1.3.1 | Ídem |
| `recharts` | 3.10.1 | 25/07/2026 | **3.11.0 (17/11/2026)** | No se usa la 3.11.0: tiene tres días |
| `react-is` | 19.3.1 | 14/10/2026 | 19.3.1 | Versión de React. `prop-types` conserva su propia 16.13.1 anidada |
| `@playwright/test` (desarrollo) | 1.65.0 | 05/11/2026 | **1.65.1 (13/11/2026 21:12 UTC)** | No se usa la 1.65.1: no cumple el corte de D-027 |
| `@axe-core/playwright` (desarrollo) | 4.14.0 | 15/10/2026 | 4.14.0 | Admite Playwright 1.65: pide `playwright-core >= 1.0.0` y las pruebas de `axe` corrieron sin error |
| `axe-core` (desarrollo) | 4.14.0 | 05/10/2026 | 4.14.1 (16/11/2026) | No se usa la 4.14.1: tiene cuatro días. **No es una instalación nueva**: la 4.14.0 ya estaba en el bloqueo base (`c29e8ec`, otro paquete la pide con `^4.10.0`) y por eso no cuenta entre los 72 |

Árbol: **72 paquetes nuevos o cambiados** en el archivo de bloqueo de la copia (71 nuevos y 1 con otra versión), todos con fecha de publicación anterior o igual al corte (`registro-npm-fechas-de-publicacion.txt`, 72 de 72 correctos, comprobación en `comprobar-fechas.mjs.txt`). **10 son solo tipos `@types/*`**: 9 de `d3-*` (`d3-array`, `d3-color`, `d3-ease`, `d3-interpolate`, `d3-path`, `d3-scale`, `d3-shape`, `d3-time`, `d3-timer`) y `use-sync-external-store` (el primer commit decía 9: era un error de cuenta; recontado el 20/11 comparando los dos bloqueos). La separación ejecución/desarrollo del primer commit (67 y 5) la hice a mano y **no se pudo reconciliar**: el campo `dev` del bloqueo de la copia da 70 y 2 (marca como de ejecución los tres paquetes de Playwright aunque están en las dependencias de desarrollo del `package.json`). El total de 72 y los 10 tipos sí están recontados. Esto corrige «al menos 58» del diseño: el tercer nivel suma hasta 72 entre todos. Se confirma que `victory-vendor` es 37.4.1 (la que pide Recharts, no la 38.1.0 leída antes), `react-remove-scroll` 2.7.2, `react-remove-scroll-bar` 2.3.8 y `react-style-singleton` 2.2.3. Ninguno de los 72 tiene script de instalación (`hasInstallScript`); en todo el bloqueo solo `fsevents`, opcional y solo para macOS, no nuevo. `npm audit` en la copia: 0 vulnerabilidades.

**Navegadores de Playwright (A-11).** Descargados con una orden expresa (`npx playwright install chromium firefox webkit`) desde `cdn.playwright.dev`, a una carpeta fuera del repositorio fijada con `PLAYWRIGHT_BROWSERS_PATH`. No hay huella publicada con la que contrastar la primera descarga (riesgo aceptado en A-11). Huella calculada después (SHA-256 sobre la lista ordenada de archivos y la suma de cada uno, método en `suma-navegadores.mjs.txt`):

| Carpeta | Versión | Archivos | SHA-256 |
| --- | --- | --- | --- |
| `chromium-1254` | Chromium 158.0.8127.18 | 307 | `d0026c2c65ed13f82b8dda1dbae2e426ff05cfb770ebca684999d5da01a86fd3` |
| `chromium_headless_shell-1254` | 158.0.8127.18 | 290 | `1cf8b2932a732307c1e38530ab85a11576a1370ae93e4392a246bed574f8ff1b` |
| `firefox-1572` | Firefox 159.0 | 64 | `4ccf1d4648906667d6809de471fb94629f73ed000e020fd83404ebfeeb097376` |
| `webkit-2388` | WebKit 27.2 | 362 | `8a32cc43f8ed081a7d11bea201ebb76d38b442a1d6b8f7f1323e7ad7329fe063` |
| `ffmpeg-1013` | — | 4 | `836947f6eec41b55218230d707b17235a6a77b156222141005e6313e06ec9811` |
| `winldd-1007` | — | 3 | `05174ee622eae69aaa0ddbc0b1eaba8d548c49208830281c29111c8bef35d702` |

Esa huella solo detecta una alteración posterior. La carpeta está en un directorio temporal de la sesión: se perderá con una limpieza, y entonces la huella ya no dirá nada. La que debe anotar T-020 (carpeta y suma de los navegadores) es la de una descarga nueva.

## 5. Lo que no se ha comprobado

- **Safari real, iOS y Android.** WebKit es el de Playwright 1.65.0 (27.2) en Windows, no Safari de macOS: el orden de tabulación y el enfoque con ratón son distintos (por eso se adaptó el guion, ver 2.2). Lo cubre T-019 (revisión manual y móvil real, una persona).
- **Lectores de pantalla.** El nombre y la descripción accesibles se comprobaron con Playwright y `axe`, no con NVDA, VoiceOver ni TalkBack.
- **Cajón a menos de 1024 px y «cerrado, sus enlaces no reciben foco»** (CA-003, REQ-004): la prueba usa el viewport de 1280 px por defecto y un cajón sin pliegue; lo cubre PRUEBA-012 con el componente definitivo.
- **Alto máximo del diálogo con poca altura, apilado de avisos, región al 40 % del alto, atajo F8, gestos de deslizar** de Radix: no medidos (PRUEBA-013 y PRUEBA-015).
- **Táctil** emulado con `page.tap`, no con un dedo real.
- **Todo salvo la ejecución en Chromium y Firefox con ventana** se hizo sin ventana visible (`headless`). La corrección también: las ejecuciones de `salidas/paso10-*` son sin ventana.
- **La variante `roto` no se reejecutó entera** tras la corrección: las cifras «27 fallan, 4 pasan» son de la ejecución anterior (solo se reejecutaron sus pruebas «aparece al activarlo»).
- **Los informes JSON de Playwright** de los pasos 0 a 7 no se guardan (pesan cientos de KB y llevan rutas de la máquina); salvo el extracto de `salidas/paso4-anotaciones-aviso.txt`, las duraciones y las cuentas sueltas de este informe se pueden leer en las salidas de texto pero no en el JSON.
- **Efecto visual de la política de contenido aplicada**, `nonce` y la pausa del aviso en una persona real (ver 2.4 y 2.2.1).
- **Alternativa B (React Aria)**: no se probó, porque nada pasó a ella.
- **Si `getByRole` con nombre accesible ve bien el diálogo nativo en Safari**: solo WebKit de Playwright.

## 6. Reproducir

La copia desechable (con `node_modules`, `.next` y los navegadores) no está en el repositorio. El guion y las páginas están versionados como `.txt` en `guion/` (precedente V-110): quita el `.txt` final de cada archivo. Correspondencia: `guion/e2e/*` va a `e2e/`, `guion/src-app-prueba-foco/*` va a `src/app/prueba-foco/`, `guion/next.config.ts.txt` sustituye a `next.config.ts` y `guion/package.json.copia.txt` muestra el `package.json` de la copia. `guion/sonda-foco-webkit.mjs.txt` es la sonda de 2.2.2 y `depurar-pausa-por-foco.mjs.txt` la de 2.2.1. La copia se recrea así: `git archive` de `main`, `npm ci --ignore-scripts`, instalar las dependencias de la sección 4 con la misma orden, copiar lo anterior, `npx next build`, `npx next start -p 3411` y `npx playwright test -c e2e/playwright.config.ts` con `PLAYWRIGHT_BROWSERS_PATH` apuntando a la carpeta de navegadores. Para la política aplicada, `MODO_CSP=aplicar` en la compilación y en el arranque. Para la prueba de la prueba del aviso: `VARIANTES=robafoco npx playwright test -c e2e/playwright.config.ts foco.spec.ts -g "aparece al activarlo"`. Esta prueba es la que T-016 (b) repetirá con el aviso propio, y es la que debe fallar si el código está mal.

## 7. Cambios de la corrección (20/11/2026)

1. Restaurada la comprobación «el aviso no roba el foco» (2.2.2), con la variante `robafoco` que la hace fallar; corregida la frase de 2.2 sobre criterios relajados.
2. `depurar-pausa-por-foco.mjs.txt` comprueba que el foco llegó a «Cerrar aviso» antes de contar; salida en bruto en `salidas/paso10-pausa-por-foco-repeticiones.txt`. Chromium «4 de 6» confirmado; WebKit «2 de 6» no reproducido.
3. Retiradas las cifras «decenas de ms» y «100 ms» (2.2.1).
4. La decisión de los avisos se escribe como la dice la regla del diseño (sección 3).
5. Añadida a la tabla de 2.2 la fila de la pausa por el foco.
6. Origen de las duraciones, de las 11 pulsaciones y de los 14 elementos (2.2, `salidas/paso4-anotaciones-aviso.txt`); `@types/*` corregidos a 10; `axe-core` 4.14.0 ya estaba en el bloqueo base.
7. Remisiones a tareas con la numeración nueva de `tareas.md`: T-020 (suma de navegadores), T-019 (revisión manual), T-016 (b) (avisos).
8. Nota sobre WebKit y el «atributo 1» (2.4).
9. El guion y las páginas dejan de ser una carpeta sin seguimiento en la raíz de la copia de trabajo y quedan versionados en `guion/`.
