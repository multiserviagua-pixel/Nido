# T-016 · Resultado

## (a) `Formulario` y campos

Rama `tarea/020-T-016a`, sobre `01e9bba`. Entorno: local (Windows 11, Node 26, Chromium de Playwright, 1 worker). Autor: `ingeniero-frontend`. Datos de prueba ficticios. Sin revisión todavía (la hace el `revisor`). Sin commit. No ruta crítica.

### Qué entrega

- `src/components/formulario/logica.ts`: lógica pura. `leerCampos` (cierra en fallo: tipo, clave u opción que no encaja no se pinta; una etiqueta que no es de `TEXTOS` cae a «Campo», una ayuda así se descarta), `valoresIniciales`, `leerValor`, `validarCampos` (obligatorio, longitud, opción de la lista), `repartirErrores` (par `{campo, codigo}` del servidor contra los campos pintados y los textos de `TEXTOS.formulario.errores`; lo que no encaja, error general), `resumenDeErrores`, `descripcionDe` (`aria-describedby`), `presentarResultadoDeFormulario`, `esTextoFijo`.
- `src/components/formulario/campos.tsx`: `CampoDeTexto` (texto y búsqueda), `CampoDeTextoLargo`, `CampoDeSeleccion`, `CasillaDeVerificacion`, `GrupoDeOpciones` (`fieldset role="radiogroup"` con leyenda), `CampoDeFormulario`.
- `src/components/formulario/Formulario.tsx`: `noValidate`, `method="post"`, sin `action`; envío con `useAccion` y `Boton`; foco al primer error; resumen visible y anunciado; errores del servidor junto a su campo.
- `src/components/textos.ts`: `TEXTOS.formulario` ampliado (leyenda, límite, resumen, error general, códigos de error de lista cerrada, `ejemplo` de la muestra).
- Muestra: entrada `formulario` en `inventario.ts` (7 estados: `inicial`, `enviado-vacio`, `error-servidor`, `enviando`, `hecho`, `conexion-perdida`, `tipos-de-campo`), una carpeta de página fija por estado en `src/app/muestra/componentes/formulario/` y `_vistas/formulario/` (`DemoDeFormulario`, `VistaDeFormulario`, `textos-formulario.ts`).

### Decisiones del ingeniero (revocables)

1. **El valor vive en el estado del `Formulario`**, no en cada campo: hace falta para validar y enviar. Los campos son controlados y reciben sus textos como `TextoFijo`. No hay valores iniciales de texto desde fuera (un texto de servidor no entra por una propiedad); la ficha de T-016 (g) los pedirá, y habrá que leerlos con `textoPlano` como `Tabla`.
2. **Foco: al primer campo con error**, según el diseño («Al enviar con errores, el foco va al primero»). Un «resumen de errores» visible con el número y anunciado, **sin foco ni enlaces** (un `href="#id"` metería un fragmento en la dirección). Sin lista de enlaces.
3. **Sin `required` nativo**: `aria-required="true"` y la palabra «(obligatorio)» en la etiqueta. Leyenda al principio si hay obligatorios.
4. **Sin `name` en los controles ni `action` en el formulario**: un envío nativo (sin JavaScript) no pone nada en la dirección (V-3). Los radios llevan `name` (necesario para el grupo), con un identificador de `useId`.
5. **Límite**: `maxLength` y el aviso visible «Hasta N caracteres.» (enlazado con `aria-describedby`). El error `demasiado_largo` queda como defensa (solo alcanzable sin el atributo).
6. **`autocomplete`**: el diseño no dice nada; lista cerrada `off | name | organization | email | username`, por defecto `off`. **Pedir al arquitecto o `disenador-ui` que lo confirme.**
7. **Los campos se leen una vez** al montar (como las listas de `useAccion`).
8. **`intentadoAlCargar`** (solo muestra, como `abiertoAlCargar` del diálogo): pinta el formulario ya enviado en blanco, en el servidor, sin mover el foco. Los estados con respuesta del servidor (`error-servidor`, `enviando`, `hecho`, `conexion-perdida`) tienen la respuesta ya elegida y se alcanzan rellenando y enviando; las páginas se pintan como el inicial (el recorrido genérico del inventario las ve sin enviar).
9. **Tras `hecha` lo escrito se conserva** y el mensaje de éxito se quita al escribir de nuevo; `incierta` permanece hasta el siguiente envío o «Comprobar estado». Al tocar un campo, su error del servidor deja de valer.
10. **Los textos de `TEXTOS.formulario.ejemplo`** están en producción (como `cifras.ejemplo` y `dialogo.acciones`): moverlos a la muestra cuando la 021 aporte los suyos.

### Pruebas, primero en rojo

Las unitarias de `logica.ts` se escribieron antes que el código (en rojo, sin módulo); las de marcado y las de navegador después de los componentes y sin ver su resultado antes de escribirlas.

| Requisito | Prueba |
| --- | --- |
| REQ-019 (etiqueta visible y permanente, obligatorio con palabra); CA-014 | `formulario-componente.test.tsx` (etiquetas, `(obligatorio)`, leyenda); `formulario.spec.ts` «etiquetas y obligatorios» (14 controles del estado `tipos-de-campo`) |
| REQ-020 (error junto al campo, asociado, anunciado, foco al primero, lo escrito se conserva) | `formulario-logica.test.ts` (`validarCampos`, `descripcionDe`, `resumenDeErrores`); `formulario-componente.test.tsx` (errores enlazados); `formulario.spec.ts` «errores, foco y lo escrito» |
| REQ-057, V-6 (error del servidor solo `{campo, codigo}` de lista cerrada; desconocido, error general) | `formulario-logica.test.ts` (`repartirErrores`, `leerCampos`); `formulario.spec.ts` (`campo_desconocido`, `codigo_desconocido`, `error-servidor`; la cadena testigo no sale en HTML ni en texto) |
| REQ-073, REQ-074, REQ-078; CA-017, CA-045 (cuatro resultados, un envío, 30 s, conexión perdida) | `formulario-logica.test.ts` (`presentarResultadoDeFormulario`); `formulario.spec.ts` «resultados de la acción» (`page.clock` para los 30 s) |
| REQ-080; CA-014 (navegador en inglés) — PRUEBA-019 | `formulario.spec.ts` con `locale: "en-US"`: 0 mensajes de validación nativos, textos en español. **Zonas horarias: no afecta** (el formulario no pinta fechas) |
| REQ-056, REQ-071; CA-041 — PRUEBA-017 | `formulario.spec.ts`: 10 cadenas hostiles escritas en tres campos, 0 elementos, 0 ejecuciones, el valor se conserva tal cual |
| V-3, REQ-058, REQ-059 — PRUEBA-018 | `formulario.spec.ts`: la dirección no cambia, 0 peticiones con el testigo, `localStorage`/`sessionStorage`/cookies vacíos; el cuerpo enseñado lleva lo escrito; `formulario-componente.test.tsx` (sin `localStorage`, `fetch`, `history`, `location` en el código) |
| REQ-044, REQ-065, REQ-082, REQ-037; CA-006 — PRUEBA-013 | `formulario.spec.ts`: 7 estados × 4 anchos, 120 caracteres, errores a 320 px, espaciado, zum a 200 % y 400 %, objetivos de 24 px, táctil |
| REQ-036; CA-027 — PRUEBA-021 | `formulario.spec.ts`: tabulador en orden, flechas en el grupo, Espacio, Intro, foco visible |
| REQ-038, REQ-085; CA-034 — PRUEBA-014; PRUEBA-020 | `formulario.spec.ts`: colores forzados (bordes, icono y texto del error); cambio de tema con lo escrito y los errores |
| PRUEBA-025 | `formulario.spec.ts`: axe a 320 y 1280, claro y oscuro, en `enviado-vacio`, `tipos-de-campo` y tras enviar |
| PRUEBA-008 (fronteras), PRUEBA-007 (textos) | `fronteras.test.ts`, `inventario-muestra.test.ts` y `textos-estados.test.ts` siguen en verde con el código nuevo |

### Comandos y resultado

Con el candado de suite tomado (regla A), en primer plano de la sesión, Playwright en el puerto 3114 con copia temporal de la configuración (borrada).

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/unit/diseno/formulario-logica.test.ts` | 33 en verde |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 49 archivos, 1577 pruebas en verde (1527 antes + 50 nuevas) |
| `npx playwright test tests/e2e/muestra/formulario.spec.ts` | 79 en verde; con `--repeat-each=3`, 237 en verde |
| `npx playwright test tests/e2e/muestra` (completo, con todo corregido) | 3110 en verde y 5 rojos de la familia flaky ya conocida (`cabecera.spec.ts:214`, `tabla.spec.ts:174` y tres casos de zum de gráficos en `anchos.spec.ts:132`); los tres archivos repetidos aparte: 640 en verde, 0 rojos |
| `npm run tipos` | 0 errores |
| `npx eslint --max-warnings 0 .` | 0 avisos |
| `npx prettier --check` de lo tocado | limpio (solo avisa `tests/unit/plataforma/acciones-fijadas.test.ts`, que no se ha tocado) |
| `npm run build` | correcto |

Historia de la vuelta de pruebas: la primera pasada completa dio 17 rojos: 3 flaky ajenos, 7 del espaciado de texto de `anchos.spec.ts` (los contadores `dt`/`dd` en línea de la propia página de la muestra se pisaban al partirse; corregido con `flex`) y 7 de colores forzados de `tema-y-movimiento.spec.ts` (ver decisión 11). La segunda dejó 1 rojo propio: el anuncio de la región cortés se mira demasiado tarde (guarda el texto menos de un segundo): se comprueba lo primero. La tercera, la de arriba. Los capturas versionadas que Playwright reescribe de `evidencias/T-014/capturas` se restauraron con `git checkout`.

### Cambio fuera de `src/components/formulario/` (decisión 11, revocable)

11. **`tests/e2e/muestra/apoyo/medidas.ts`, `medirControlesSinBorde`**: las casillas y los radios con aspecto nativo (`appearance` distinto de `none`) ya no cuentan como «sin borde»: los dibuja el navegador con los colores del sistema y su borde no es una propiedad CSS. Con `appearance: none` y sin borde sí cuentan. Caso sembrado nuevo en `medidas.spec.ts`. La alternativa era dibujar casillas y radios a mano; no se hizo para no inventar un aspecto que `docs/DISENO.md` no define (el papel `--borde-control` dice «casillas», pero nada fija cómo se pintan). **Pregunta al `disenador-ui`:** ¿casilla y radio nativos con `accent-color` (lo hecho) o dibujados con `--borde-control`? El contraste de 3:1 del borde de la casilla nativa no se ha medido.

### No comprobado

- Lector de pantalla real (PRUEBA-028, manual): el anuncio del resumen y del resultado se comprueba por el texto de la región, no por NVDA.
- Firefox y WebKit: solo Chromium. Reensayo en tres motores en T-018.
- Foco de vuelta tras `hecha` cuando la vista real relee y quita el botón (sospecha 23 h): la muestra no quita el botón; se prueba en T-016 (g).

## (b) `AvisosTemporales`

Rama `tarea/020-T-016b`, sobre `4ab4b01` (prueba de navegador de T-009 (g) en rojo). Entorno: local (Windows 11, Node 26, solo Chromium de Playwright, 1 worker). Autor: `ingeniero-frontend`. Datos de prueba ficticios. Sin revisión todavía. Sin commit. No ruta crítica.

### Qué entrega

- `src/components/avisos/logica.ts`: lógica pura. Plazo de 8 s con dos pausas (`iniciarPlazo`, `conPuntero`, `conFoco`, `milisegundosHastaVencer`, `decidirAlVencer` que mira dónde están de verdad el foco y el puntero antes de retirar), pila de avisos (`reducirPila`: orden de llegada, ids que no se reutilizan, tope de 20), lista cerrada de claves (`leerClaveDeAviso`).
- `src/components/avisos/useAvisos.ts`: `avisar(clave)` anuncia una vez por la región cortés (`anunciar`) y añade; `cerrar(id)`.
- `src/components/avisos/AvisosTemporales.tsx`: región fija «Avisos» (`section` con `aria-label`, `ol`, `li[data-aviso]`), no viva; pausa por `onPointerEnter/Leave` y `onFocus/onBlur` de React en el propio `li` (ningún `addEventListener`); Escape con el foco dentro; foco al aviso siguiente (si no hay, al anterior) y, si no queda ninguno, al elemento que lo tenía antes de entrar con el tabulador (o al contenido principal); nunca `focus()` al aparecer. Sin avisos no pinta nada.
- `src/components/textos.ts`: `TEXTOS.avisos` (`region`, `cerrar`, `mensajes` de lista cerrada, informativos). El tipo de aviso es `{id, clave}` con `clave` de esa lista: sin gravedad, sin tono, sin texto libre.
- `src/components/estilos/base.css`: dentro de `@layer base`, `:root[data-avisos-abiertos]` reserva `40dvh` de `scroll-padding-bottom` y de relleno inferior mientras hay avisos (diseño: «el contenedor reserva ese alto con `scroll-padding-bottom`»). No cambia ningún valor de `docs/DISENO.md`.
- Muestra: entrada `avisos-temporales` en `inventario.ts` (estados `uno`, `dos`, `cinco`, `texto-largo`), cuatro carpetas de página fijas en `src/app/muestra/componentes/avisos-temporales/`, `_vistas/avisos/` (`VistaDeAvisos`, `DemoDeAvisos`, `textos-avisos.ts`).

### Decisiones del ingeniero (revocables)

1. **Foco al cerrar:** el diseño dice «al aviso siguiente; si no queda ninguno, al elemento anterior». Si se cierra el último y quedan otros, el foco va al **anterior de la lista** (no se pierde). Si no queda ninguno, vuelve a `relatedTarget` de la entrada en la región.
2. **Tope de 20 avisos** a la vez; pasado el tope se retira el más antiguo (ya anunciado). No está en el diseño.
3. **Reserva de altura en `base.css`** con la unidad `dvh` y relleno en `<html>` (el diseño dice solo «scroll-padding-bottom»): sin el relleno, el último control de la página quedaría bajo la región al llegar al final.
4. **`max-h-2/5`** (utilidad de fracción, no un valor arbitrario: PRUEBA-005 los prohíbe) para el 40 %.
5. Los textos de los avisos son mensajes fijos informativos de producción en `TEXTOS.avisos.mensajes`; cada función de la fase añadirá los suyos.

### Prueba primero

`tests/unit/diseno/avisos-logica.test.ts` se escribió antes que el código: en rojo (sin módulo), salida en `avisos-rojo-unitaria.txt`. Contiene los `@ts-expect-error` del tipo (cadena libre, otro grupo de `TEXTOS`, `gravedad`, `texto`, `tono`, `avisar("...")`, props del componente). La prueba de navegador es la de T-009 (g) (`tests/e2e/muestra/avisos.spec.ts`, no modificada). `avisos-componente.test.tsx` (marcado y código) se escribió después del componente.

### Comandos y resultado

Con el candado de suite (regla A), en primer plano, Playwright en el puerto 3115 con copia temporal de la configuración (borrada).

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/unit/diseno/avisos-logica.test.ts` antes del código | rojo: sin módulo (`avisos-rojo-unitaria.txt`) |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 51 archivos, 1610 pruebas en verde (1577 antes + 27 de lógica + 6 de marcado) |
| `npx playwright test tests/e2e/muestra/avisos.spec.ts` | 32 en verde a la primera, sin tocar la prueba |
| mismo archivo, `-g "PRUEBA-011 en el componente" --repeat-each=10` (pausa por foco con reloj real, justo al abrir y a 600 ms, y foco que no cambia con teclado, ratón y táctil) | 50 en verde, 0 fallos (`avisos-repeticiones-chromium.txt`) |
| `npx playwright test tests/e2e/muestra` (completo) | 3255 en verde y 1 rojo: `tabla.spec.ts:174` (anuncio de orden de `Tabla`, flaky ya conocido, menores 21 (e) y 23). Repetido aparte 5 veces: 3 en verde y 2 rojos, igual que antes de esta tarea; no usa avisos |
| `npm run tipos` | 0 errores (todas las directivas `@ts-expect-error` se consumen) |
| `npx eslint --max-warnings 0 .` | 0 avisos |
| `npx prettier --check` de lo tocado | limpio |
| `npm run build` | correcto |

Las capturas versionadas de `evidencias/T-014/capturas` que Playwright reescribe se restauraron con `git checkout`.

### No comprobado

- Firefox y WebKit: solo está instalado Chromium. Las 10 repeticiones de la pausa por foco y del foco que no cambia en esos motores quedan **no comprobadas** (T-018 / `qa`).
- Lector de pantalla real (PRUEBA-028, manual): el anuncio se comprueba por el texto de la región cortés.
- Colores forzados y cambio de tema con avisos abiertos: la prueba de T-009 (g) no los cubre; los pares de color son los ya declarados (`--texto`, `--superficie`, `--borde-control`, `--texto-secundario`).
- El foco de vuelta cuando la vista real quita el elemento anterior (cae al contenido principal): sin prueba de navegador.
