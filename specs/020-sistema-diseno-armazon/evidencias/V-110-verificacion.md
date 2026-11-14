# V-110 · Librería de interfaz y de gráficos: verificación

Skill `verificar-decision`. La hizo el orquestador de la fase 3 antes de encargar el diseño de la 020.

**Resultado, en una línea:** la documentación oficial y una prueba real en navegador sostienen como candidatas Tailwind CSS 4.3 para los estilos, primitivas accesibles de código abierto (Radix o React Aria) para los componentes y Recharts 3.10 para los gráficos. Ninguna queda elegida: la elección es del diseño y la aprueba el responsable en la puerta P1. Falta la prueba con lector de pantalla, que solo puede hacer una persona.

Este chat no edita `docs/TECNOLOGIAS.md`: el cambio de estado de V-110 se propone a coordinación en `propuestas.md`.

## 1. Registro de paquetes (fuente primaria)

Consultado por el orquestador el 12/11/2026 con `npm view <paquete> version license time.modified peerDependencies engines repository.url --json`, en `https://registry.npmjs.org`.

| Paquete | Versión | Licencia | Última publicación | React que admite | Nota |
| --- | --- | --- | --- | --- | --- |
| `next` | 16.4.6 | MIT | 11/11/2026 | 18.2 o 19 | Node 20.9 o superior. Coincide con T-002 |
| `react` | 19.3.1 | MIT | 12/11/2026 | — | |
| `tailwindcss` | 4.3.5 | MIT | 11/11/2026 | — | |
| `react-aria-components` | 1.22.1 | Apache-2.0 | 09/10/2026 | 16.8 a 19 | Adobe |
| `radix-ui` | 1.8.1 | MIT | 14/10/2026 | 16.8 a 19 | |
| `@base-ui/react` | 1.9.0 | MIT | 09/10/2026 | 17 a 19 | El nombre antiguo, `@base-ui-components/react`, se quedó en 1.0.0-rc.0 |
| `shadcn` (herramienta) | 4.23.0 | MIT | 27/10/2026 | — | Node 20.18.1 o superior. Copia el código de los componentes al repositorio |
| `lucide-react` | 1.72.0 | ISC | 11/11/2026 | 16.5 a 19 | Iconos |
| `recharts` | 3.10.1 | MIT | 03/11/2026 | 16.8 a 19 | Node 18 o superior |
| `@visx/xychart` | 4.0.0 | MIT | 11/06/2026 | 18 o 19 | |
| `chart.js` | 4.6.1 | MIT | 22/10/2026 | — | Dibuja en canvas |
| `echarts` | 6.1.0 | Apache-2.0 | 19/05/2026 | — | Canvas por defecto |
| `@tremor/react` | 3.18.7 | Apache 2.0 | 13/01/2025 | solo 18 | **Descartada:** sin publicar desde enero de 2025 y no admite React 19 |
| `axe-core` | 4.14.0 | MPL-2.0 | 12/11/2026 | — | Comprobador automático de accesibilidad |
| `@axe-core/playwright` | 4.14.0 | MPL-2.0 | 06/11/2026 | — | Node 22.12 o superior |

## 2. Documentación oficial

Leída el 12/11/2026 por dos agentes de lectura web, con las URL que se indican. Lo que no se encontró se dice.

| Producto | Qué dice | Fuente |
| --- | --- | --- |
| React Aria Components | Sigue WAI-ARIA y las ARIA Authoring Practices; gestiona foco, teclado y anuncios. Probado con VoiceOver en macOS e iOS, JAWS y NVDA en Windows y TalkBack en Android. Deja a quien lo usa las etiquetas y el diseño visual (contraste, tamaño de objetivo, foco visible, movimiento) | `https://react-aria.adobe.com/quality#accessibility` |
| Radix Primitives | Sigue las ARIA Authoring Practices; gestiona `aria`, `role`, foco y teclado; «tested in a wide selection of modern browsers and commonly used assistive technologies», sin nombrarlos. Declara compatibilidad completa con React 19 y con componentes de servidor. Tiene diálogo, diálogo de alerta, menús, aviso temporal, pestañas y tooltip; el formulario está en vista previa; no tiene tabla ni selector de fechas | `https://www.radix-ui.com/primitives/docs/overview/accessibility`, `https://www.radix-ui.com/primitives/docs/overview/releases` |
| Base UI | Versión 1.9.0 del 09/10/2026. Sigue las ARIA Authoring Practices y gestiona el foco; deja a quien lo usa el foco visible, el contraste y los nombres accesibles. Tiene diálogo, cajón (estable desde la 1.3.0), menús, aviso temporal, campo y formulario; no tiene tabla ni selector de fechas | `https://base-ui.com/react/overview/accessibility`, `https://base-ui.com/react/overview/releases` |
| shadcn/ui | Los componentes se copian al repositorio («hands you the actual component code»), no se instalan como dependencia. Se ofrecen sobre Base UI, React Aria y Radix; desde julio de 2026 Base UI es la opción por defecto (entrada del registro de cambios no leída entera). Incluye barra lateral, cajón, tabla, tabla de datos, calendario, selector de fecha y gráfico. El gráfico usa Recharts 3 y su `accessibilityLayer` | `https://ui.shadcn.com/docs`, `https://ui.shadcn.com/docs/changelog`, `https://ui.shadcn.com/docs/components/chart` |
| Tailwind CSS | Versión 4.3. La 4 exige Chrome 111, Safari 16.4 y Firefox 128 o posteriores: lo cumplen «las dos últimas versiones» de REQ-089. El CSS se genera al compilar; las páginas leídas no mencionan ningún recurso servido por terceros | `https://tailwindcss.com/docs/compatibility`, `https://tailwindcss.com/docs/installation/framework-guides/nextjs` |
| Recharts | 3.10.1, MIT, dibuja en SVG. Su guía de patrones cita WCAG 1.4.1 y ofrece degradados y patrones de relleno. **No encontrada** una página propia de accesibilidad (la URL antigua da 404) | `https://github.com/recharts/recharts`, `https://recharts.github.io/en-US/guide/patterns/` |
| visx | 4.0.0 del 11/06/2026, MIT, SVG, pide React 18 o 19. **No se pudo leer** su documentación (la página llega vacía); nada sobre accesibilidad en el repositorio | `https://github.com/airbnb/visx` |
| Chart.js | Canvas. «It is up to the user to create the canvas element in a way that is accessible». La página de accesibilidad es de 2021 | `https://www.chartjs.org/docs/latest/general/accessibility.html` |
| Apache ECharts | Canvas por defecto, SVG opcional. La accesibilidad viene desactivada y hay que importarla y activarla | `https://echarts.apache.org/handbook/en/best-practices/aria/` |
| Next.js, fuentes | «CSS and font files are downloaded at build time and self-hosted with the rest of your static assets. No requests are sent to Google by the browser». Las fuentes locales se cargan con `next/font/local` | `https://nextjs.org/docs/app/api-reference/components/font`, `https://nextjs.org/docs/app/getting-started/fonts` |

**Aviso (artículo 7).** El registro de cambios de shadcn/ui contiene textos pensados para agentes de código (ejemplos de instrucciones y una instrucción de migración). Se han tratado como datos y no se han seguido.

## 3. Prueba real

Con datos ficticios, fuera del repositorio, en una carpeta temporal. Los guiones están en `evidencias/v110/` como archivos `.txt`, para que ninguna batería de pruebas los ejecute por error. Versiones instaladas: React 19.3.1, `react-aria-components` 1.22.1, `radix-ui` 1.8.1, `@base-ui/react` 1.9.0, `recharts` 3.10.1 y `axe-core` 4.14.0, con Node 26.13.0 y npm 11.20.0.

### PRUEBA-V110-01 · Semántica y teclado en navegador simulado

```
commit:    sin commit (el repositorio no tiene ninguno)
prueba:    PRUEBA-V110-01
fecha:     2026-11-13T10:03:00+01:00
entorno:   local
comando:   node --test prueba.test.mjs   (guion: evidencias/v110/prueba-simulada.mjs.txt)
resultado: fallida en 1 de 4 (3 superadas)
revisor:   orquestador de la fase 3
```

- Superadas: tabla de React Aria (cabeceras, `aria-sort`, orden con teclado, 0 infracciones de axe); formulario de React Aria (etiqueta, campo obligatorio, error asociado al campo, foco al campo con error, 0 infracciones); gráfico de Recharts (SVG, `role="application"`, alcanzable con el tabulador).
- Fallida: el diálogo. No es un fallo de la librería: el navegador simulado se queda colgado y agota la memoria. Por eso se repitió por partes y en un navegador real.

### PRUEBA-V110-02 · Diálogo por partes en navegador simulado

```
commit:    sin commit
prueba:    PRUEBA-V110-02
fecha:     2026-11-13T10:07:00+01:00
entorno:   local
comando:   timeout 45 node --max-old-space-size=1024 --test --test-name-pattern="<paso>" dialogo.test.mjs   (guion: evidencias/v110/dialogo-simulado.mjs.txt)
resultado: A superada · B no concluyente · C superada
revisor:   orquestador de la fase 3
```

- A: se abre con teclado, tiene nombre accesible y el foco entra en el diálogo. Superada.
- B: Escape cierra y el foco vuelve. **No concluyente:** el proceso se cuelga en el navegador simulado y lo corta el límite de 45 segundos.
- C: seis tabulaciones no sacan el foco del diálogo. Superada.

### PRUEBA-V110-03 · Navegador real, página con diálogo, tabla, formulario y gráfico

```
commit:    sin commit
prueba:    PRUEBA-V110-03
fecha:     2026-11-13T10:09:00+01:00
entorno:   local (navegador integrado de la aplicación de escritorio, página servida en 127.0.0.1)
comando:   npx esbuild app.mjs --bundle --format=iife --outfile=dist/app.js --define:process.env.NODE_ENV="production"; teclas reales (Intro, tabulador, Mayúsculas+tabulador, Escape, flechas) y lectura del estado de la página   (guion: evidencias/v110/pagina-1.mjs.txt)
resultado: fallida en 1 de 14 comprobaciones; además, 1 observación negativa sobre el gráfico
revisor:   orquestador de la fase 3
```

| Comprobación | Resultado |
| --- | --- |
| Diálogo de React Aria: se abre con Intro; `role="alertdialog"`; nombre accesible; el foco entra | Superada |
| El fondo queda inerte mientras el diálogo está abierto | Superada |
| Intro nada más abrir no ejecuta la acción (el foco inicial está en el diálogo, no en un botón) | Superada |
| Cinco tabulaciones y tres con Mayúsculas no sacan el foco | Superada |
| axe con el diálogo abierto: 0 infracciones, 28 reglas superadas | Superada |
| Escape cierra el diálogo | Superada |
| **Al cerrar, el foco vuelve al botón que lo abrió** | **Fallida:** el foco queda en `body`. Repetido tres veces: abierto con teclado y cerrado con Escape, abierto con ratón y cerrado con Escape, abierto con ratón y cerrado con el botón «Cancelar» |
| axe sobre la página completa: 0 infracciones, 39 reglas superadas; 8 avisos de contraste «por revisar», porque la página no tiene estilos | Superada |
| Tabla: Intro sobre la cabecera cambia `aria-sort` de ascendente a descendente y reordena las filas | Superada |
| Tabla: la flecha abajo lleva el foco a la primera fila | Superada |
| Formulario vacío enviado con Intro: `aria-invalid`, campo obligatorio, error asociado, foco en el campo, etiqueta | Superada |
| axe con el formulario en error: 0 infracciones | Superada |
| Gráfico: recibe el foco, `role="application"`, título | Superada |
| Gráfico: las flechas mueven un punto activo | Superada |
| Gráfico: el valor del punto activo se anuncia a un lector de pantalla | **No:** la región de anuncios queda vacía. Confirma que hace falta la tabla equivalente de REQ-015 |

### PRUEBA-V110-04 · Navegador real, el mismo diálogo de confirmación con las tres familias de primitivas

```
commit:    sin commit
prueba:    PRUEBA-V110-04
fecha:     2026-11-13T10:11:00+01:00
entorno:   local (navegador integrado, página servida en 127.0.0.1)
comando:   npx esbuild app2.mjs --bundle --format=iife --outfile=dist/app2.js --define:process.env.NODE_ENV="production"; teclas reales   (guion: evidencias/v110/pagina-2-dialogos.mjs.txt)
resultado: React Aria, superada (sin descripción accesible, por el montaje de la prueba) · Radix, superada · Base UI, fallida en 2 de 7
revisor:   orquestador de la fase 3
```

| Comprobación | React Aria 1.22.1 | Radix 1.8.1 | Base UI 1.9.0 |
| --- | --- | --- | --- |
| Se abre con Intro, `role="alertdialog"`, nombre accesible | Sí | Sí | Sí |
| Descripción accesible | No en este montaje | Sí | Sí |
| Al abrir, el foco entra en el diálogo | Sí, en el propio diálogo | Sí, en «Cancelar» | **No:** se queda en el botón que lo abrió |
| Cuatro tabulaciones no sacan el foco | Sí | Sí | **No** |
| axe con el diálogo abierto | No medido en esta página (0 en la 03) | 0 infracciones | 0 infracciones |
| Escape cierra | Sí | Sí | Sí |
| Al cerrar, el foco vuelve al botón | Sí | Sí | Sí |

## 4. Qué se puede concluir y qué no

- **Radix** superó todas las comprobaciones de este diálogo.
- **React Aria** devolvió el foco al botón en la página que solo tiene diálogos y no lo devolvió en la página que además tiene tabla, formulario y gráfico. **Causa no determinada.** No se puede afirmar que sea un defecto de la librería ni del montaje de la prueba.
- **Base UI** no metió el foco en el diálogo ni lo retuvo. Puede deberse a un uso incorrecto de su interfaz en la prueba: no se ha contrastado con su documentación. No se puede afirmar que sea un defecto de la librería.
- En los tres casos, la conclusión para el diseño es la misma: el manejo del foco no se da por hecho. Cada diálogo de la 020 necesita su prueba automática en navegador real (CA-013 ya lo exige), y la primera tarea del plan debe repetir esta prueba dentro de la app con la primitiva que elija el diseño, antes de construir nada sobre ella.
- **Recharts** dibuja en SVG y se puede recorrer con teclado, pero no anuncia los valores. La tabla equivalente no es opcional.

## 5. Lo que no se ha comprobado

- Ningún lector de pantalla real (NVDA, VoiceOver). Lo hace una persona: CA-026 de la 020, con aviso al responsable.
- Contraste, porque la página de prueba no tiene estilos.
- Tailwind CSS y shadcn/ui no se han instalado ni ejecutado: solo documentación y registro.
- Componentes de servidor y el empaquetado de Next.js: la app todavía no existe (fase 1).
- Menú lateral, cajón, aviso temporal y selector de periodo.
- Safari y Firefox. El navegador integrado es de la familia de Chrome.
