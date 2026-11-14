# 020 · Dictamen de seguridad del diseño (primera vuelta)

Autor: `auditor-seguridad` · Fecha: 13/11/2026 · Sobre: `specs/020-sistema-diseno-armazon/diseno.md`, versión del 13/11/2026 (658 líneas)

Guardado por el orquestador de la fase 3 a partir de la respuesta del auditor, que no escribe archivos. Los hallazgos están tal como los entregó; se ha omitido su apartado de resumen por puntos del encargo, que repetía lo mismo.

**Dictamen: 0 bloqueantes, 9 mayores y 11 menores. Ningún hallazgo obliga a rehacer el diseño, pero cinco mayores cambian contratos que el plan va a repartir en tareas: deben corregirse antes de planificar.**

## 1. Tabla de amenazas

Parte de la tabla del diseño. Las filas marcadas **Nueva** no están en el diseño.

| Amenaza | Control del diseño | Prueba | ¿Basta? |
| --- | --- | --- | --- |
| Un dato se interpreta como marcado, enlace o código (A-21) | `TextoDato`, `textoPlano`, `rutas.ts`, `react/no-danger` de la 002 | PRUEBA-004, PRUEBA-017 | Casi: m-2, m-3 |
| Caracteres de dirección alteran un diálogo de confirmación | `bdi` y retirada de los controles de dirección | PRUEBA-004, PRUEBA-017 | Casi: m-2 |
| Un error enseña datos internos, o la referencia revela algo | Motivos cerrados; referencia al azar | PRUEBA-010, PRUEBA-017 | Parcial: MAYOR 9 |
| Una respuesta con campos de más acaba en pantalla | Lectura campo a campo | PRUEBA-014 | No: MAYOR 4 |
| Estado desconocido o cifra imposible presentados como favorables o como cero | `leerEstado`, `leerCifra` | PRUEBA-003, PRUEBA-014 | Sí |
| Sin permiso, inexistente y área de otra fase se distinguen | Un componente y «el mismo 404» | PRUEBA-016 | No: MAYOR 3 |
| Nombres, correos o búsquedas en la dirección | Esquema sin texto libre | PRUEBA-009, PRUEBA-018 | Sí para la barra de direcciones. Para las peticiones, no: MAYOR 5 |
| Parámetros añadidos cambian el usuario o el cliente | Identidad por propiedades desde la sesión | PRUEBA-009, PRUEBA-018 | Sí en la 020; la prueba real es de la 021 |
| Datos de negocio guardados en el navegador | Ningún almacenamiento | PRUEBA-018 | Parcial: MAYOR 6, m-9 |
| Dependencia maliciosa o vulnerable (A-19) | Envoltorios, archivo de bloqueo, comprobación 7 | PRUEBA-008, batería de la 002 | No: MAYOR 8 |
| Los navegadores de prueba se descargan fuera del registro | Versión fijada por Playwright | «Revisión del auditor» | No: MAYOR 8 |
| Recurso de terceros en tiempo de ejecución | Fuente local, iconos propios, lista vacía | PRUEBA-018 | Sí |
| Las librerías obligan a relajar la política de contenido de la 021 | Inventario medido; alternativa A | PRUEBA-011 | Parcial: m-8 |
| La muestra queda publicada en producción | Dos capas «cerradas en fallo» | PRUEBA-024 | No: MAYOR 1 |
| La muestra llega a datos reales | Frontera de importaciones, sin variables | PRUEBA-008, PRUEBA-018 | Sí, salvo m-6 |
| SVG del logotipo con guion o referencia externa | Lista cerrada | PRUEBA-008 | Sí |
| Doble envío | Cerrojo de `useAccion` | PRUEBA-015 | Sí en el navegador |
| Se afirma un cambio que no se sabe si ocurrió | Resultado `incierta` | PRUEBA-016 | No: MAYOR 2 |
| Instrucciones en documentación externa (A-16) | Son datos | Revisión | Sí |
| Un agente da por validada la propuesta o la revisión manual | Solo cuenta la persona | PRUEBA-028, PRUEBA-031 | Sí |
| **Nueva:** se rebaja la comprobación de accesibilidad o las pruebas de frontera sin firma | Ninguno | Falta | MAYOR 7 |
| **Nueva:** búsqueda en la cadena de consulta de una petición, y de ahí en los registros de la plataforma (A-15) | Ninguno | Falta | MAYOR 5 |
| **Nueva:** «denegado» devuelve 200 en streaming e «inexistente» 404 | Ninguno | Falta | MAYOR 3 |
| **Nueva:** el nombre de un cliente queda en el título, y con él en el historial | Ninguno | Falta | MAYOR 6 |
| **Nueva:** respuesta 5xx, ilegible o que nunca llega tras enviar una acción | Ninguno | Falta | MAYOR 2 |
| **Nueva:** `ENTORNO` mal puesto en producción publica la muestra | Ninguno independiente | Falta | MAYOR 1 |
| **Nueva:** carga serializada (RSC) con campos de más o el identificador denegado | Regla «no repartir el objeto» | Falta | MAYOR 4 |
| **Nueva:** la referencia recibida del servidor se pinta sin validar su formato | Ninguno | Falta | MAYOR 9 |
| **Nueva:** un dato en `rutas.ts` lleva a otra ruta (`..`, `/api/…`) | «Formato de identificador», sin definir | PRUEBA-009 | m-3 |
| **Nueva:** errores de campo del servidor o textos de alertas como texto libre | Regla genérica | Falta | m-4 |
| **Nueva:** la muestra pública en preproducción comparte origen con `/admin` y pinta cadenas hostiles | Ninguno declarado | Falta | m-7 |
| **Nueva:** caché HTTP del navegador con respuestas de datos | Ninguno | Falta | m-9 |
| **Nueva:** uso de la clave secreta (A-10) | Componentes sin acceso a `src/lib/supabase/` | PRUEBA-008 | Sí, con m-10 |

## 2. Hallazgos mayores

### MAYOR 1. Las dos capas que ocultan la muestra en producción no son independientes, y nada comprueba el resultado en el despliegue real

- **Dónde:** líneas 327-338, 427, 500 (PRUEBA-024) y 642.
- **Qué incumple:** REQ-061 y CA-046; artículos 3 y 14.
- **Por qué.** Las dos capas leen `ENTORNO`; si las páginas de la muestra son estáticas, la segunda también se evalúa al compilar, con el mismo valor. Un solo error humano (`ENTORNO=preproduccion` en el proyecto de producción) anula las dos. La comprobación «`/muestra` responde 404 en cada despliegue de producción» es solo una petición a la 002. PRUEBA-024 no prueba la capa 2 sola ni valores desconocidos.
- **Qué debe garantizar el diseño.** Que una configuración equivocada no publique la muestra sin que nadie lo vea: la comprobación posterior al despliegue debe ser condición para promover. Y que la segunda capa no dependa del mismo valor leído en el mismo momento, o que el diseño diga sin rodeos que solo hay una capa.
- **Prueba.** PRUEBA-024 ampliada: compilar con `ENTORNO` = `Produccion`, `produccion ` (con espacio) y `prod`; forzar la capa 1 abierta para medir la capa 2 sola; buscar en la salida de la compilación una cadena testigo de `_datos/` (0 apariciones). En producción, `/muestra` y `/muestra/valores` responden 404 o no se promueve.

### MAYOR 2. `useAccion` no dice qué hace ante una respuesta que no es ninguno de los cuatro resultados, ni cuándo deja de esperar

- **Dónde:** líneas 243-252 y 423.
- **Qué incumple:** artículo 3; REQ-073 y REQ-078; CA-045 y CA-052.
- **Por qué.** `incierta` solo cubre la pérdida de conexión. No hay regla para un 5xx tras enviar, una respuesta ilegible o desconocida, una sesión caducada ni una petición que no responde nunca. Sin plazo, el botón se queda «Pausando…» para siempre.
- **Qué debe garantizar.** Correspondencia exhaustiva entre respuesta y resultado; lo no reconocido es `incierta`; `hecha` solo con confirmación expresa y bien formada; `rechazada` solo cuando el servidor dice expresamente que no aplicó nada; un plazo máximo que también termina en `incierta`.
- **Prueba.** En PRUEBA-015 y PRUEBA-016, fuentes simuladas que responden 500 tras aceptar, cuerpo ilegible, resultado desconocido, 401 y ninguna respuesta: 0 mensajes de éxito, resultado `incierta` (o `no_permitida` en el 401), lo escrito se conserva y el botón se libera al vencer el plazo.

### MAYOR 3. «El mismo contenido y el mismo 404» no se puede cumplir con el patrón de carga que propone el diseño, y nada lo prueba

- **Dónde:** líneas 239, 229-236, 373, 421 y 492 (PRUEBA-016).
- **Qué incumple:** REQ-027 y REQ-077; CA-020; A-07 por extensión.
- **Por qué.** La documentación oficial de Next.js (`file-conventions/loading`, leída el 13/11/2026) dice que las respuestas en streaming empiezan con código 200: una vez pintado el respaldo, `notFound()` ya no cambia el código. La salida que propone esa documentación es `proxy`, que la 002 prohíbe. Con esqueletos por bloque, el área de otra fase daría 404 y el recurso denegado o inexistente, 200. Hay más vías de diferencia: un `not-found` por segmento frente al de la raíz, el título y los metadatos resueltos antes de la decisión, la navegación frente a la carga completa, y los tiempos. PRUEBA-016 se ejecuta sobre la muestra, que no tiene servidor.
- **Qué debe garantizar.** Un único mecanismo obligatorio para la 021 a la 024: la decisión «existe y está permitido» se toma antes de empezar a responder, con una sola consulta bajo la sesión. Un único `not-found` por dashboard, dentro del armazón. Ningún metadato que dependa del recurso antes de esa decisión. Si no se puede garantizar el 404, fijar el mismo código en los tres casos y decirlo.
- **Prueba.** Una prueba contrato que la 020 entregue para que la ejecute cada función: con tres direcciones (denegada, inexistente y área de otra fase), en carga completa y en navegación, código, cabeceras, título, HTML crudo y árbol de accesibilidad idénticos, y la mediana de tiempo no separa denegado de inexistente.

### MAYOR 4. Las pruebas de «campos de más» y de «sin el identificador» miran el DOM, no lo que viaja serializado a la página

- **Dónde:** líneas 282, 490, 492 y 493.
- **Qué incumple:** REQ-075 y CA-051; REQ-027 y CA-020; REQ-057 y CA-042.
- **Por qué.** Lo que un componente de servidor pasa a uno de cliente viaja serializado en el HTML y en las peticiones de navegación, aunque no se pinte. Un objeto de respuesta pasado entero pasaría las tres pruebas.
- **Qué debe garantizar.** Que «en ningún sitio» incluye el HTML crudo, la carga serializada y las respuestas de navegación, y que la muestra ejerce ese camino.
- **Prueba.** Con una cadena testigo en un campo de más, en el nombre del recurso denegado y en el mensaje interno del error: 0 apariciones en el cuerpo de todas las respuestas registradas, no solo en el DOM.

### MAYOR 5. La búsqueda no va a la barra de direcciones, pero nada impide que viaje en la cadena de consulta de una petición

- **Dónde:** líneas 294 y 443-444; PRUEBA-018.
- **Qué incumple:** A-15 y regla 3 de `docs/SEGURIDAD.md`; REQ-059 en su intención.
- **Por qué.** El diseño no fija cómo llega la búsqueda al servidor. Con parámetros de consulta, el nombre o el correo quedan en los registros de la plataforma y del navegador.
- **Qué debe garantizar.** Ningún texto escrito por el usuario viaja en la URL de ninguna petición; solo en el cuerpo. Es una regla para la 021 a la 024 que la 020 debe fijar.
- **Prueba.** Prueba contrato: con una cadena testigo escrita en la búsqueda, 0 apariciones en las URL de todas las peticiones registradas y en los registros de la batería.

### MAYOR 6. El título del documento llevará datos (nombres de cliente) y acaba en el historial, que es almacenamiento persistente

- **Dónde:** líneas 162, 277 y 299.
- **Qué incumple:** REQ-058 y CA-043; la intención de REQ-059.
- **Por qué.** El historial del navegador guarda URL y título y lo sincroniza con la cuenta del navegador, un tercero. REQ-059 saca los nombres de la URL por eso, y el título los vuelve a meter.
- **Qué debe garantizar.** Una decisión explícita: o el título solo nombra el tipo de vista, o el responsable acepta por escrito que el historial guarde nombres de clientes. **Lo decide el responsable, no el diseño.**
- **Prueba.** Con datos que contienen la cadena testigo, `document.title` no la contiene en ninguna vista (si se elige la primera opción).

### MAYOR 7. La comprobación de accesibilidad y las pruebas de frontera se pueden rebajar sin firma

- **Dónde:** líneas 37, 60, 116, 316, 467, 502 (PRUEBA-026) y 576.
- **Qué incumple:** artículo 14; REQ-062 y CA-025.
- **Por qué.** Lo que decide el resultado vive fuera de las rutas reservadas: `playwright.config.ts`, las etiquetas y exclusiones de `axe` en `tests/e2e/**`, `inventario.ts`, la lista de excepciones de `style` y la lista de importaciones permitidas. PRUEBA-026 solo detecta la desactivación total.
- **Qué debe garantizar.** Que esa configuración tiene la misma protección que la batería, y que la batería falla si baja el número de estados o de pruebas respecto de `main`.
- **Prueba.** Tres candidatos (excluir una regla de `axe`, quitar un estado del inventario, añadir una excepción de `style`): los tres se rechazan sin firma, o la batería falla.

### MAYOR 8. Dependencias: el árbol de ejecución es mucho mayor de lo que se declara y se añade un binario externo sin control de integridad

- **Dónde:** líneas 446, 447, 467 y 584-601.
- **Qué incumple:** A-19 y regla 7 de `docs/SEGURIDAD.md`; artículo 13.
- **Por qué.** Comprobado el 13/11/2026 con `npm view`: Recharts 3.10.1 trae 11 dependencias directas de ejecución (`@reduxjs/toolkit`, `react-redux`, `immer`, `reselect`, `es-toolkit`, `victory-vendor`, `eventemitter3`, `decimal.js-light`, `use-sync-external-store`, `tiny-invariant`, `clsx`); `@radix-ui/react-dialog` 1.3.1, unas 15; Tailwind ejecuta un binario nativo al compilar; Playwright descarga navegadores fuera del registro, a una caché fuera del repositorio. No verificado si Playwright comprueba la integridad de lo que descarga.
- **Qué debe garantizar.** El árbol de ejecución real, con su número y los paquetes que llegan al navegador; que no se instala nada hasta que la 002 cierre su hallazgo sobre la instalación de dependencias; y un control de procedencia de los navegadores de la batería, o un riesgo aceptado por escrito.
- **Prueba.** Lista de paquetes del archivo de bloqueo que acaban en los fragmentos de cliente, comparada con la declarada. Un navegador con la suma alterada en la caché hace fallar la comprobación «interfaz».

### MAYOR 9. Referencia de error: el diseño no garantiza que lo que se pinta como referencia sea una referencia

- **Dónde:** líneas 286-289 y 486 (PRUEBA-010).
- **Qué incumple:** REQ-057 y CA-042; A-15.
- **Por qué.** Es la única cadena del camino de error que no sale de una lista cerrada. Si una ruta devuelve por error el mensaje interno en ese campo, se pinta. El campo `referencia` de `registro.ts`, si no exige el formato exacto, es un canal para registrar valores recibidos. Sospecha no comprobada: usar `error.digest` de Next.js como referencia permitiría correlacionar fallos.
- **Qué debe garantizar.** La referencia se valida contra su formato exacto al leerla en el navegador y al escribirla en el registro; lo que no encaja se descarta. Nunca se usa `digest` ni ningún valor derivado del error. Conviene que diga si la creó el navegador o el servidor.
- **Prueba.** PRUEBA-010 ampliada con una referencia que contiene la cadena testigo; PRUEBA-017 con la cadena testigo en `referencia`.

## 3. Hallazgos menores

- **m-1.** La alternativa A sobrestima el elemento nativo `dialog` (línea 204): el tabulador puede salir a la interfaz del navegador y CA-013 podría fallar. V-110 probó solo el diálogo de alerta de Radix, no el cajón ni los avisos, con 4 tabulaciones y en un solo navegador. La regla de decisión de PRUEBA-011 debe decir si un fallo solo del aviso o solo del cajón cambia las tres piezas o solo esa.
- **m-2.** `textoPlano` (línea 277) deja fuera U+2028, U+2029, U+FEFF, U+200B, U+00AD y los caracteres de etiqueta U+E0000 a U+E007F. Además, el diálogo identifica el objetivo solo por su nombre: dos clientes con nombres que se confunden a la vista permiten confirmar sobre el equivocado. La 020 debe dejar sitio para algo más que el nombre.
- **m-3.** «Formato de identificador» sin definir (líneas 293 y 295): `rutas.ts` podría construir un enlace interno a una ruta no prevista. Fijar el formato; PRUEBA-009 con `..`, `%2F`, `/` y espacios.
- **m-4.** Errores de campo del servidor y textos de alertas (líneas 74, 174 y 354): deben llegar como campo y código de listas cerradas, no como texto libre.
- **m-5.** Motivo `no_permitido` por bloque (línea 240): debe quedar limitado a fallos de sesión, nunca a negar un recurso concreto.
- **m-6.** Contradicción en la muestra (líneas 323, 324, 332 y 337): la capa 2 lee `ENTORNO` a través de `configuracion.ts`, pero PRUEBA-008 falla si la muestra importa algo de `src/lib/` distinto de `referencia.ts`. Decir cómo, con una excepción estrecha.
- **m-7.** Muestra en preproducción (línea 338): es pública y comparte origen con el futuro `/admin`. Fijar que no toma ningún texto de la URL, del fragmento ni de mensajes entre ventanas; que las cadenas de la batería son inertes; y que los datos ficticios usan dominios reservados.
- **m-8.** El inventario para la política de contenido (líneas 199 y 370-372) debe cubrir toda la muestra. La 021 debe saber que Next.js pone guiones en línea propios; sin `proxy` ni valores de un solo uso, el escapado de la 020 pasa a ser el control principal contra XSS.
- **m-9.** Caché HTTP (línea 299): regla para la 021 a la 024, respuestas con datos sin almacenamiento.
- **m-10.** PRUEBA-008 (líneas 72, 77 y 323) debe resolver alias, importaciones dinámicas y reexportaciones; `fallo-servidor.ts` debe ser solo de servidor de forma comprobable; `web-vitals` no debe poder importarse desde `src/`.
- **m-11.** Clasificación de los cambios en la fase 1 (líneas 37 y 576): según la 002, `next.config.ts` y `src/lib/registro/**` son rutas críticas (dictamen) y `scripts/bateria/**` y las claves de `package.json` son reservadas (firma). Si se quiere firma para todos, pedirlo expresamente como ampliación de la lista de reservadas.

## 4. Veredicto

**0 bloqueantes, 9 mayores.** El diseño debe corregirse antes de planificar. Los MAYOR 1, 2, 3, 5 y 7 cambian contratos o reglas que el plan convertirá en tareas. Los MAYOR 4, 6, 8 y 9 se pueden resolver en la misma vuelta. El MAYOR 6 necesita una decisión del responsable.

Sobre la comprobación de la constitución del diseño: en el artículo 3, «cumple» es prematuro (MAYOR 1 y 2); en el 13, cumple con dos reservas (MAYOR 8, m-1); en el 14, falta lo de MAYOR 7 y m-11.

## Lo que el auditor comprobó y lo que no

- Ejecutado, solo lectura: `node scripts/comprobar-specs.mjs` (SUPERADO), `npm view` de las dependencias directas y de sus scripts de instalación, y lectura de dos páginas oficiales de Next.js (`https://nextjs.org/docs/app/api-reference/file-conventions/loading`, `https://nextjs.org/docs/app/api-reference/config/next-config-js/pageExtensions`).
- No comprobado: si Playwright verifica la integridad de los navegadores; cómo deriva Next.js 16.4 `digest`; si `pageExtensions` funciona en `app`; el tabulador con `dialog` en los tres motores; el árbol transitivo completo.
- Instrucciones encontradas, tratadas como datos: las dos páginas de Next.js remiten a un índice para modelos. No se siguió.

---

# Segunda vuelta · 13/11/2026

Sobre el diseño corregido (878 líneas). Guardada por el orquestador a partir de la respuesta del auditor.

**Veredicto: 0 bloqueantes. De la primera vuelta no queda ningún mayor abierto: el MAYOR 6 está pendiente a propósito, con la opción segura escrita. La corrección introduce un mayor nuevo (N-1) y cinco menores. Puede pasar a planificación cuando N-1 esté corregido en el texto.**

## Estado de los hallazgos de la primera vuelta

| Hallazgo | Estado | Reserva |
| --- | --- | --- |
| MAYOR 1 | Cerrado con reserva | El control 2 está en un `layout` (N-1); la condición de no desplegar no tiene mecanismo (N-6) |
| MAYOR 2 | Cerrado con reserva | Respuestas que llegan después del plazo (N-4) |
| MAYOR 3 | Cerrado con reserva | El código de las navegaciones sigue sin verificar, y el diseño lo declara. PRUEBA-008 no detecta un `Suspense` por encima de la decisión; solo PRUEBA-034 |
| MAYOR 4 | Cerrado | — |
| MAYOR 5 | Cerrado | — |
| MAYOR 6 | Pendiente a propósito | Opción segura escrita; lo decide el responsable (A-10) |
| MAYOR 7 | Cerrado con reserva | «En cinco archivos, y no en otros» no es exacto (N-3) |
| MAYOR 8 | Cerrado con reserva | Primera descarga de navegadores (A-11); tercer nivel del árbol sin leer; origen de los navegadores en el clon limpio (N-5). Mantener Recharts confinado es aceptable |
| MAYOR 9 | Cerrado | — |
| m-1 | Cerrado con reserva | El resumen (línea 11) aún dice que Radix «superó la prueba real de V-110» sin la limitación de la línea 222 |
| m-2 | Cerrado con reserva | Siguen pasando U+2060 a U+2064 y U+180E; es más robusto quitar toda la categoría Unicode Cf salvo U+200C y U+200D |
| m-6 | Cerrado con reserva | N-1 obliga a ampliar la excepción de importación |
| m-7 | Cerrado con reserva | `/muestra/servidor/` añade puntos de entrada públicos (N-2) |
| m-3, m-4, m-5, m-8, m-9, m-10, m-11 | Cerrados | — |

## Hallazgos nuevos

### N-1. MAYOR. El control 2 de la muestra está en un `layout`, y un `layout` no impide que se ejecute el resto de la ruta

- **Dónde:** líneas 396, 399 y 404; excepción de la línea 380.
- **Qué incumple:** REQ-061 y CA-046; artículo 3.
- **Por qué.** La guía oficial de Next.js (`https://nextjs.org/docs/app/guides/authentication`, leída el 13/11/2026) dice que un `layout` no controla si el resto de la ruta se pinta, que sus comprobaciones no se repiten al navegar, y que las acciones de servidor y los manejadores de ruta son puntos de entrada públicos. Si `pageExtensions` no excluye rutas en `app` (sin verificar), el control 2 se queda solo y se salta con una petición de navegación o con una acción o un manejador de `/muestra/servidor/`.
- **Qué debe garantizar.** La comprobación del control 2 se ejecuta en cada punto de entrada de la muestra (cada página, cada acción de servidor y cada manejador), con una función común. La excepción de importación se amplía a esos archivos, no más. Aviso para la 021: el mismo límite vale para una comprobación de sesión hecha solo en el `layout` de `src/app/admin/`.
- **Prueba.** PRUEBA-024, con el control 1 abierto y un nombre de servidor fuera de la lista: una petición de navegación a una página de la muestra da 404 y no devuelve su carga; una llamada a cada acción y a cada manejador se rechaza sin ejecutar nada.

### Menores nuevos

- **N-2.** `/muestra/servidor/` publica en preproducción puntos de entrada que cualquiera puede activar y que escriben en el registro y quizá en la supervisión (líneas 371 y 434). Un error simulado no debe llegar a la supervisión, o esas rutas solo responden en local y en la dirección protegida del despliegue.
- **N-3.** Los propios archivos de prueba pueden filtrar infracciones de `axe`, excluir reglas o relajar una aserción sin bajar las cuentas (línea 472). La llamada a `axe` debe vivir en un único módulo reservado, o una comprobación estática debe fallar si fuera de él aparecen esas llamadas o pruebas saltadas. Corregir la frase.
- **N-4.** Una respuesta que llega después del plazo de 30 segundos podría atribuirse a un segundo envío (líneas 289-291). Cada resultado se asocia a su envío; una respuesta tardía no cambia lo mostrado, como mucho provoca una relectura. Prueba en PRUEBA-015.
- **N-5.** No se dice de dónde saca los navegadores el clon limpio de la batería (líneas 769-771). Fijar la carpeta, absoluta y fuera del clon, y comprobar la suma sobre ella.
- **N-6.** La condición «la 020 no se despliega en producción» solo está declarada (líneas 58 y 397). Debe figurar donde el responsable la vea al desplegar. El nombre de servidor debe leerse de `Host` y no de `X-Forwarded-Host`; PRUEBA-024 debe incluir una petición con esa cabecera falsificada, que debe dar 404.

## Para la puerta P1

- Decisiones del responsable: A-10 (título), A-11 (primera descarga de navegadores), A-12 (rutas reservadas nuevas), A-3 (muestra pública).
- Cambios que tiene que aceptar la función 002: el control 3 de la muestra como condición para promover, las rutas reservadas nuevas con la comparación de cuentas, y el cierre de su hallazgo de instalación. Sin ellos, el artículo 14 queda incumplido en la parte de REQ-062, como reconoce el diseño.

No comprobado por el auditor: ninguna prueba del diseño (no hay código); qué nombre de servidor recibe una función en Vercel; el código de las navegaciones; si `pageExtensions` excluye rutas en `app`.
