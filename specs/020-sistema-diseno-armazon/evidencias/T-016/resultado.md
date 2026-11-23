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

## (c) `EstadoVacio`, `EstadoError`, `EstadoSinPermiso` y `Esqueleto`

Rama `tarea/020-T-016c`, sobre `8e55530`. Entorno: local (Windows 11, Node 26, solo Chromium de Playwright, 1 worker). Autor: `ingeniero-frontend`. Datos de prueba ficticios. Sin revisión todavía (la hace el `revisor`). Sin commit. No ruta crítica. **Estado: implementada y verificada por el implementador; pendiente de revisión.**

### Qué entrega

- `src/components/estados/` (carpeta nueva, distinta de `estado/`, que guarda `EtiquetaEstado` y el catálogo: no choca, pero los dos nombres se parecen; ver decisión 1).
  - `logica.ts`: lectura que cierra en fallo. `leerMotivoDeError` (lista cerrada, el resto «desconocido»), `encabezadoDeError` («No se ha podido cargar» una sola vez con cualquier motivo), `leerFormaDeEsqueleto`, `leerTextoFijoOr`, `leerAccionDeEstado`, `leerRutaDelResumen`.
  - `EstadoVacio.tsx`: título y explicación (`TextoFijo`) y, si procede, un botón con texto fijo y función. Sin directiva de cliente (vale en servidor sin acción).
  - `EstadoError.tsx`: solo `motivo` de lista cerrada, `referencia` (validada con `leerReferencia`; si no encaja, se descarta y, ya en el navegador, se pinta una `N-` creada con `useSyncExternalStore`, sin diferencia entre HTML e hidratación), `alReintentar` y `reintentando`. Un único botón «Reintentar»; en curso dice «Cargando» y queda `aria-disabled`. No es región viva.
  - `EstadoSinPermiso.tsx`: sin propiedades salvo `rutaDelResumen` (validada con `esRutaInterna`; si no, `/admin`). Mismo marcado para denegado, inexistente y área de otra fase; sin directiva de cliente (lo usará el `not-found` de cada dashboard).
  - `Esqueleto.tsx`: tarjeta, tabla, gráfico y lista con las cajas, rellenos y alturas de línea del componente real; bloques `aria-hidden`; «Cargando» una vez por la región cortés (guarda por referencia) y como texto solo para lector; variante `lenta` con el aviso visible y anunciado una vez; `anunciarCarga={false}` para quien ya anuncia.
- `src/components/textos.ts`: `TEXTOS.estadoVacio` (genérico y `ejemplo` de la muestra).
- `src/components/estilos/base.css`: `.esqueleto-pulso` y su `@keyframes`, con `--duracion-esqueleto` (0 con movimiento reducido), dentro de la capa `base` existente.
- Menores que caen aquí: **(15 g / 19 g) `Tabla` usa `EstadoVacio`** (conserva su `section` con nombre y `data-tabla-vacia`, y los textos de `TEXTOS.tabla.vacio`); **(15 g / 24) el error de `ZonaDeDatos` es `EstadoError`**: ya no hay un botón «Reintentar» escrito a mano.
- Muestra: 4 entradas nuevas en `inventario.ts` (`estado-vacio` 2 estados, `estado-error` 8, `estado-sin-permiso` 1, `esqueleto` 5), 16 páginas fijas en `src/app/muestra/componentes/`, `_vistas/estados/` (`VistaDeEstados`, `DemoDeEstadoVacio`, `DemoDeEstadoError`, `textos-estados.ts`).

### Decisiones del ingeniero (revocables)

1. **Carpeta `estados/`** (como pidió el encargo). No choca con `estado/`, pero se parecen; si el `revisor` lo prefiere, renombrar a `bloque/` o `estados-de-vista/` es mecánico.
2. **«Reintentar» único = un solo componente, un botón por zona.** El diseño (punto 4, «Reintentar») dice «se revisa si basta un solo botón». No he quitado el botón de la segunda zona: cada zona es un bloque con su propio error y `BloqueDatos` pedirá solo su bloque (REQ-026); con dos errores a la vez hay dos botones con el mismo nombre. Lo que se ha unificado es el componente, el marcado y el comportamiento (`EstadoError`). Si el responsable prefiere un único botón en la página, es un cambio de `ZonaDeDatos` y de `periodo-servidor.spec.ts` (que hoy exige uno por zona).
3. **«No se ha podido cargar» antepuesto** cuando el texto del motivo no lo dice ya (`sin_conexion`, `sesion_no_valida`), para que REQ-028 («la palabra») valga con los seis motivos y nunca salga dos veces.
4. **Referencia ausente o inválida: se crea una `N-` en el navegador** después de hidratar (diseño, «La referencia se valida en los dos extremos»). En el HTML del servidor no hay referencia si no llegó una válida. Sin generador, el error se pinta sin ella (como ya hacía el proveedor del periodo).
5. **`EstadoError` no anuncia.** El anuncio, una sola vez y urgente, lo hace quien detecta el fallo (el proveedor del periodo hoy, `BloqueDatos` en (d)). Un error sin esa pieza no se anuncia: es un riesgo mientras (d) no exista.
6. **`Esqueleto` anuncia «Cargando» por sí mismo** (por defecto) y `ZonaDeDatos` NO lo usa todavía: su carga sigue siendo la propia (el proveedor ya anuncia). Se migra en (d), con `anunciarCarga={false}` o dejando que el bloque lo anuncie.
7. **El alto del esqueleto** copia el del componente real (tarjeta con comparación, gráfico con una serie, fila de tabla de 37 px, título de 40 y cabecera de 49). La tabla dibuja 5 filas y la lista 3: una página llena tiene hasta 25 filas, así que al llegar los datos una tabla larga crece. Es lo que significa «aproximado» en REQ-023; el desplazamiento de diseño real (0,1) se mide en (d) con una vista.
8. **`ListaAlertas` y los gráficos conservan su vacío propio** (`data-alertas-vacia`, `data-grafico-vacio`): el encargo y el menor 19 (g) solo piden `Tabla`. Queda como menor para (f)/(g) o limpieza: migrarlos a `EstadoVacio` (sus pruebas de `alertas.spec.ts` y `graficos.spec.ts` miran esos atributos).
9. **Cambio a `base.css`** (no a `valores.css`): una clase y un `@keyframes` con el papel `--duracion-esqueleto` que ya existía. Ningún valor de `docs/DISENO.md` cambia. `valores.css`, `combinaciones.ts`, `excepciones.ts` y `paquetes-de-cliente.ts` sin tocar.
10. **Texto de ejemplo en producción**: `TEXTOS.estadoVacio.ejemplo` está en `textos.ts` porque `EstadoVacio` solo admite `TextoFijo`; se mueve a la muestra con los demás (`cifras.ejemplo`, `dialogo.acciones`, `formulario.ejemplo`) cuando la 021 aporte los suyos.

### Pruebas, primero en rojo

`tests/unit/diseno/estados-logica.test.ts` y `estados-componentes.test.tsx` se escribieron **antes** de cualquier código de `src/components/estados/`: en rojo, sin módulo (`estados-rojo-unitaria.txt`). Después se escribió el código; las pruebas de integración (`Tabla`, `ZonaDeDatos`) y la de navegador (`estados.spec.ts`) vinieron con o después de los componentes, y esta última se escribió sin haberla ejecutado antes.

| Requisito | Prueba |
| --- | --- |
| REQ-022, CA-016 (vacío: qué pasa, qué hacer, botón si procede) | `estados-componentes.test.tsx` (EstadoVacio); `estados.spec.ts` «estado vacío» (con y sin acción, contador, y `tabla/vacia` usa el mismo componente) |
| REQ-026, REQ-028, REQ-057, CA-042 (error: texto fijo por motivo, referencia solo con formato exacto, «Reintentar» único, sin propiedad de mensaje) | `estados-logica.test.ts` (motivo, encabezado); `estados-componentes.test.tsx` (seis motivos, 12 referencias no válidas, `@ts-expect-error` de `mensaje`, `error`, `digest`); `estados.spec.ts` «estado de error» (seis motivos, referencia, reintento, en curso, sin anuncio propio, HTML sin referencia inventada) |
| REQ-027, REQ-077, CA-020 (sin permiso igual que inexistente) | `estados-componentes.test.tsx` (misma salida byte a byte con propiedades colgadas; `@ts-expect-error` de `nombre`, `id`, `motivo`, `direccion`); `estados.spec.ts` (mismo `outerHTML` con cualquier consulta, testigo ausente del cuerpo y del DOM, sin JavaScript). **La igualdad con la dirección inexistente real (404 con las mismas cabeceras) es de `/muestra/servidor/` (T-016 (h)) y de PRUEBA-034: no comprobada aquí** |
| REQ-023, REQ-039, REQ-069, CA-016, CA-048 (esqueleto: forma y alto, «Cargando» una vez, carga lenta, sin animación con movimiento reducido) | `estados-componentes.test.tsx`; `estados.spec.ts` «esqueleto» (anuncio `["Cargando"]` y `["Cargando","Está tardando más de lo normal"]`; alto frente a tarjeta, gráfico y tabla reales; sin JavaScript a 320 px) y PRUEBA-014 (movimiento reducido con control positivo) |
| PRUEBA-013 (anchos, zum, espaciado) | `anchos.spec.ts` recorre las 16 entradas nuevas por el inventario; `estados.spec.ts` añade desborde a 320 px sin JavaScript |
| PRUEBA-017 (hostil) | referencia hostil sembrada solo en el cliente: 0 apariciones en el DOM en ningún instante (observador de mutaciones), en el HTML y en el título; se pinta una `N-` |
| PRUEBA-021 (teclado) | vacío con acción: foco, contorno de 2 px, Intro y Espacio; error: Tab a «Reintentar», Intro una vez, el foco no se pierde; sin permiso: Tab al enlace, Intro al Resumen |
| PRUEBA-014 (colores forzados) | borde conservado en esqueleto, vacío, error y sin permiso; foco visible en «Reintentar» |
| PRUEBA-025 (axe) | `accesibilidad.spec.ts` recorre las 16 entradas a 320 y 1280, claro y oscuro; `estados.spec.ts` añade tras actuar (reintento, acción) y la carga lenta |
| PRUEBA-008 (fronteras), PRUEBA-007 (textos) | `fronteras.test.ts`, `inventario-muestra.test.ts`, `textos-estados.test.ts` |
| Menores 15 (g), 19 (g), 24 | `estados-componentes.test.tsx` «integración» (la fuente de `Tabla` y de `ZonaDeDatos` ya no llevan su bloque propio; un solo botón por zona); `periodo-servidor.spec.ts` sigue exigiendo «Reintentar» por zona |

### Cambios fuera de `src/components/estados/` (decisiones 11 y 12, revocables)

11. **`tests/e2e/muestra/apoyo/medidas.ts`, `medirRecortes`**: no cuenta como recorte el texto de `.sr-only` ni el de las regiones del anunciador (`[data-anunciador]`). Existen para no verse (1 px por 1 px, con el texto recortado por construcción); hasta ahora ninguna página anunciaba al cargar y no se notaba. El esqueleto anuncia «Cargando» al montarse, y la primera pasada completa dio 15 rojos de `anchos.spec.ts` (tres casos por cada una de las 5 páginas de esqueleto: `span` y `div[status]`). El texto visible recortado sigue contando; control sembrado nuevo en `medidas.spec.ts` (sr-only y anunciador pasan, el mismo recorte en un `span` o un `p` normales falla). La alternativa era no anunciar al cargar, que contradice REQ-023.
12. **`tests/e2e/muestra/red-y-direccion.spec.ts`**: la comparación «el contenido es el mismo» (PRUEBA-018) lee el texto con `textoDeLaPagina`, que deja fuera el texto de las regiones del anunciador (una copia de lo recién anunciado, que dura menos de un segundo) y enmascara las referencias de error `[SN]-…` (aleatorias por diseño). Sin esto, 14 casos del esqueleto y de cuatro estados de error fallaban en la segunda pasada completa. Las pruebas de testigos (que lo escrito en la dirección, el fragmento o un mensaje no aparece) no cambian y siguen mirando el texto y el árbol; el control sembrado de la prueba (contenido que sí cambia con parámetros) sigue pasando.

### Comandos y resultado

Con el candado de suite (regla A) tomado a las 19:54 y liberado al terminar, en primer plano de la sesión (las pasadas largas de Playwright, en segundo plano con la orden en primer plano de la sesión y con límite de 2 h), una sola toma para build y Playwright, servidor `next start` en el puerto 3110 con copia temporal de `playwright.config.ts` (borrada). Sin `vitest` en paralelo a Playwright.

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/unit/diseno/estados-logica.test.ts tests/unit/diseno/estados-componentes.test.tsx` antes del código | rojo: sin módulo (`estados-rojo-unitaria.txt`) |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 53 archivos, 1706 pruebas en verde (1610 antes + 96 nuevas: 43 de lógica y 53 de marcado, con integración de `Tabla` y `ZonaDeDatos`); repetido tras los cambios de pruebas de navegador: igual |
| `npx playwright test tests/e2e/muestra/estados.spec.ts` | 55 en verde a la primera pasada con el servidor ya compilado (2 rojos propios de la primera ejecución: la prueba de sin permiso comparaba el cuerpo entero del documento, donde Next escribe la dirección pedida en sus datos, y la de alto de tabla comparaba contra una fila con etiqueta de estado de 47 px; corregidas en la prueba, no en el componente); con `--repeat-each=3`, 165 en verde |
| Primera pasada completa de `tests/e2e/muestra` (2 workers, se cortó a los 10 minutos por el límite de la orden) | 2919 en verde, 24 rojos: 15 de recortes del esqueleto (decisión 11), 6 fallos de Chromium («Target crashed», código 3221225794, de memoria o recursos del equipo, no del código: `accesibilidad.spec.ts` de `referencia-invalida` a 320 px, `red-y-direccion.spec.ts` y `tema-y-movimiento.spec.ts` de gráfico y diálogo) y 3 flaky ya conocidos (`cabecera.spec.ts:214` ×2, `tabla.spec.ts:174`); 800 sin ejecutar |
| Segunda pasada completa (`--workers=1`) | 3728 en verde, 16 rojos: 14 de `red-y-direccion.spec.ts` (decisión 12), `anchos.spec.ts:132` de `grafico-barras/muchos-puntos` (zum de gráficos, flaky conocido, menor 20 g y 21 f) y `tabla.spec.ts:174` (flaky conocido) |
| `npx playwright test tests/e2e/muestra --workers=1`, **pasada completa final con todo corregido** | **3743 en verde y 1 rojo**: `dialogo-confirmacion.spec.ts:476` (`objetivo-120 · 320 px`, «contorno de foco del campo»), ajeno a esta tarea (no usa nada de `estados/`); repetido 8 veces aparte: 8 en verde. 35 minutos. Los dos flaky de siempre (`cabecera.spec.ts:214`, `tabla.spec.ts:174`) y el de zum de gráficos pasaron esta vez |
| `npx playwright test tests/e2e/muestra/avisos.spec.ts -g "PRUEBA-011 en el componente" --repeat-each=10` (una sola vez, sustituye el parcial de (b)) | 50 en verde, 0 fallos; **7 workers** (los que decide Playwright en este equipo: la frase «1 worker» de la evidencia de (b) no era cierta para esta orden). Salida entera en `avisos-repeticiones-chromium.txt` (cierra el menor 25 (a)) |
| `npm run tipos` | 0 errores (todas las directivas `@ts-expect-error` se consumen) |
| `npx eslint --max-warnings 0 .` | 0 avisos (la regla `react-hooks/set-state-in-effect` obligó a crear la referencia `N-` con `useSyncExternalStore`) |
| `npx prettier --check` de lo tocado | limpio |
| `npm run build` | correcto |

Las capturas versionadas de `evidencias/T-014/capturas` que Playwright reescribe se restauraron con `git checkout`. No se ha ejecutado el `vitest` completo (a cargo de la coordinación).

### No comprobado

- **Firefox y WebKit**: solo hay Chromium. Reensayo en T-018.
- **Lector de pantalla real** (PRUEBA-028, manual): el anuncio de «Cargando» y de la carga lenta se comprueba por el texto de la región cortés, no por NVDA.
- **Igualdad con la dirección inexistente real** (404 con las mismas cabeceras y el mismo cuerpo, en carga completa y en navegación; V-1, PRUEBA-034): es de `/muestra/servidor/` (T-016 (h)). Aquí solo se prueba que el estado no admite nada del recurso y que su marcado es idéntico con cualquier consulta. Nota: Next escribe la consulta de la dirección en su propia carga (`"q":"?..."`); lo mide PRUEBA-018 (hallazgo H-1) y lo decide la 021.
- **Plazos de 10 s y 30 s y desplazamiento de diseño real ≤ 0,1** al llegar los datos: son de `BloqueDatos` (T-016 (d)); aquí el esqueleto solo copia el alto del contenido en tarjeta, gráfico y fila de tabla de texto (±2 px a 1280 px).
- **Alto del esqueleto de lista y de una tabla con etiquetas de estado**: la lista dibuja tres elementos de tres líneas y la tabla filas de 37 px; una fila con etiqueta de estado mide 47 px y una página llena, 25 filas.
- **Con `EstadoError` fuera del proveedor del periodo, nadie anuncia el error** hasta que exista `BloqueDatos` (decisión 5).

### Menores para el revisor y las siguientes tareas

- `ListaAlertas` y los gráficos conservan su vacío propio (decisión 8).
- `TEXTOS.estadoVacio.ejemplo` en producción (decisión 10).
- `Esqueleto` en `ZonaDeDatos`: la carga de la zona sigue siendo propia (decisión 6); migrarla en (d) retiraría su `data-estado="carga"` escrito a mano.
- Sospecha: con `referencia` ausente, la `N-` se crea en el primer pintado del navegador (`useSyncExternalStore` con instantánea de servidor `null`): en una navegación de cliente que monta el error ya hidratado, aparece en el mismo pintado; en la carga inicial, tras hidratar. El e2e `estados.spec.ts` solo lo comprueba tras `networkidle`.
- Los 15 + 14 rojos de las dos primeras pasadas completas se debieron a que la prueba recorre el inventario nuevo: cualquier componente que anuncie al cargar o muestre referencias aleatorias necesitaba las dos aclaraciones de las decisiones 11 y 12.

