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
