# T-009 (g) · Contrato de la muestra de `AvisosTemporales`

Lo que `tests/e2e/muestra/avisos.spec.ts` espera de T-016 (b). Todo lo que sigue es lo que la prueba comprueba; lo que no figura queda a criterio del ingeniero. Si algo del contrato choca con el diseño, se dice a `qa` antes de cambiar la prueba (no se relaja desde el código).

## Entrada de `inventario.ts` (la añade T-016 (b))

`{ tipo: "componente", clave: "avisos-temporales", nombre: "Avisos temporales", estados: [uno, dos, cinco, texto-largo] }`. Rutas: `/muestra/componentes/avisos-temporales/<estado>`. La prueba exige exactamente esos cuatro estados.

| Estado | Al pulsar el disparador aparecen | Para qué |
| --- | --- | --- |
| `uno` | 1 aviso | Pausa, foco, duración, anuncio, cierre |
| `dos` | 2 avisos a la vez, textos distintos | Apilado sin solapes; cierre con paso del foco al siguiente |
| `cinco` | 5 avisos a la vez, textos distintos | Región de 40 % como mucho, desplazamiento por dentro, anuncio en orden, tabulación sin trampa, axe |
| `texto-largo` | 1 aviso con un texto de 120 caracteres o más | Sin desborde ni recorte a 320 px |

Cada pulsación del disparador añade los avisos de su estado (la prueba pulsa una vez). Al cargar la página no hay ningún aviso (0 elementos `[data-aviso]`).

## Controles de cada página (cada una con `h1` y respuesta 200)

| Control | Selector | Notas |
| --- | --- | --- |
| Disparador | `[data-disparador="aviso"]`, un `button`; **el único** `[data-disparador]` de la página | Dispara el aviso con clic, toque o Intro. Su nombre accesible lo elige la página |
| Botón que no abre nada | `[data-control="neutro"]`, un `button` | Para medir dónde cae el foco al pulsar (control de WebKit, informe de T-001 2.2.2) |
| Último control | `[data-control="final"]`, un `button` enfocable, el último de la página en orden de tabulación **salvo** los de los avisos | Destino del foco al «sacarlo» del aviso |
| Altura | La página mide más de 700 px de alto con ventana de 500 px (contenido suficiente para desplazarse) | Para poder comprobar que el aviso no tapa el foco |

Los avisos no dependen del botón de nada más de la página. La página no ofrece ningún control para otro tipo de aviso (no hay avisos de error).

## Estructura del aviso

- Región con nombre accesible exacto «Avisos» (`role="region"`, por `aria-label` o `aria-labelledby`), que contiene una `ol`; cada aviso es un `li[data-aviso]` en el orden en que aparecen (el más antiguo primero).
- Dentro de cada `li`: el texto en un elemento `[data-aviso-texto]` y un `button` con nombre accesible exacto «Cerrar aviso» (texto o `aria-label`).
- La región y todo lo que contiene, y sus ascendientes, **no** son regiones vivas: sin `aria-live` distinto de `off` ni `role` `status`, `alert` o `log`. Así el anuncio sale una sola vez, de `Anunciador`.
- Los textos de los avisos y las cadenas «Cerrar aviso» y «Avisos» deben ser valores presentes en `TEXTOS` (`src/components/textos.ts`; la prueba recorre todos sus valores). Los textos de la muestra no pueden salir de otro sitio.
- La propia región es el elemento que se desplaza por dentro (`overflow-y` `auto` o `scroll`) y mide como mucho el 40 % del alto de la ventana (con 500 px de alto, 200 px).

## Qué dispara el aviso y qué se mide

- Activar el disparador crea los avisos y llama una vez a `anunciar()` por cada texto, en el orden de la lista y por la región cortés (`[data-anunciador="cortes"]`). La urgente (`[data-anunciador="urgente"]`) queda siempre vacía.
- El foco no se mueve: tras 1,5 s, `document.activeElement` es el mismo elemento de antes, o el cuerpo si el motor lo manda ahí con cualquier pulsación de ratón o táctil (se mide antes con `[data-control="neutro"]`).
- Plazo de 8 s: con reloj real se retira entre 7,5 y 9,5 s; con reloj simulado sigue a los 7 s y no está a los 8,6 s.
- Puntero encima o foco dentro: no se retira (se miden 20 s con reloj simulado y 10 s con reloj real). Al salir, el plazo vuelve a empezar entero.
- Si el foco entra a los 7,7 s (reloj parado), al vencer el plazo no se retira.
- «Cerrar aviso» con Intro, Espacio o Escape lo cierra; Escape con el foco fuera no cierra. Al cerrar uno con el foco dentro, el foco pasa a «Cerrar aviso» del siguiente; al cerrar el último, vuelve al elemento que lo tenía justo antes de entrar en la región con el tabulador.
- Con 5 avisos y 500 px de alto: sin solapes entre avisos, región de 40 % como mucho que se desplaza por dentro, y en 60 tabulaciones ningún control enfocado fuera de los avisos queda bajo la región.
- Sin infracciones de `axe` (PRUEBA-025) con cinco avisos abiertos a 1280 y 320 px.

## Lo que esta prueba no cubre

- Que el tipo de `AvisosTemporales` no admite avisos de error ni cadenas libres: se prueba con el compilador en la prueba unitaria de T-016 (b). En navegador solo se comprueba que nada de la página lo contradice.
- Tiempo del cierre con animación de salida (si la hubiera, entra en los márgenes de 8,6 s).
