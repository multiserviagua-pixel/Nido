# 020 · Plan

Autor: `arquitecto` · Fecha: 13/11/2026

Diseño: `diseno.md`, en estado DISEÑADA (dos vueltas del `auditor-seguridad`, 0 bloqueantes). Tareas: `tareas.md`, 72 tareas en diez bloques, de la A a la J. Ninguna prueba citada se ha ejecutado.

## Orden de trabajo

### Los bloques, en orden

| Bloque | Tareas | Qué deja hecho | Por qué va ahí |
| --- | --- | --- | --- |
| A. Decisión de la primitiva | T-001 | Evidencia del foco en tres motores y decisión, por pieza, entre Radix, el elemento nativo `dialog` y React Aria | El diseño no da el foco por hecho: nada se construye sobre una primitiva sin esta prueba |
| B. Preparación | T-002 a T-011 | Dependencias instaladas, pruebas en navegador funcionando, comprobación «interfaz» en la batería, pruebas de frontera, muestra vacía que no existe en producción | Todo lo demás se integra contra estas comprobaciones |
| C. Base sin decisiones visuales | T-012 a T-023 | Mecanismo de valores con los valores iniciales, contraste, formatos, texto de dato, dirección, textos, referencia, iconos | No depende de la paleta final; casi todo son funciones con prueba unitaria |
| D. Pruebas transversales | T-024 a T-027 | Las pruebas que recorren todo el inventario (anchos, temas, red, almacenamiento, teclado, idioma) | Se escriben una vez, antes del primer componente, y se aplican a cada uno desde que entra |
| E. Armazón | T-028 a T-030 | Armazón con menú, cajón, cabecera, cuenta y selector de periodo, en la muestra | Los componentes se enseñan dentro de él |
| F. Componentes para la propuesta | T-031 a T-040 | Botón y acciones, tarjeta, etiqueta, tabla, gráficos, alertas y diálogo, con valores provisionales | Son los que necesitan las tres vistas de la propuesta visual |
| G. Propuesta visual y validación | T-041 a T-048 | Paleta de los dos temas, degradados, tipografía, tres logotipos, página de propuesta, **validación del responsable**, valores y logotipo definitivos | REQ-086: el responsable valida antes de construir las vistas |
| H. Resto y vistas | T-049 a T-061 | Formulario, avisos, estados, conexión, vistas de ejemplo, vistas de servidor para las pruebas contrato, inventario cerrado, textos revisados | **No empieza hasta T-045** |
| I. Verificación | T-062 a T-069 | Laboratorio, matriz de navegadores, vuelta atrás, revisión documental, guía y **revisión manual de una persona** | Sobre la muestra completa |
| J. Condicionadas | T-070 a T-072 | Control de despliegue de la muestra y repetición en preproducción y producción | Dependen de que la 002 acepte y de que existan los entornos |

### Qué va en paralelo

- **Dentro de B:** T-006 y T-007 a la vez, después de T-002. T-003 y T-004 van en serie.
- **C junto a B:** el bloque C solo necesita T-002 (y T-006 para la prueba de la escala). T-015, T-016, T-017 y T-018 a la vez; T-020 y T-021 a la vez, con otro agente; T-023 a la vez que cualquiera de ellas.
- **D:** T-024 a T-027 a la vez. Son archivos de prueba distintos.
- **F y H:** las tareas de `qa` que escriben pruebas (T-031 a T-033, T-051, T-052, T-058) pueden adelantarse y hacerse a la vez que las de código del bloque anterior. Las de código van **en serie**: todas tocan `inventario.ts` y `textos.ts`.
- **G:** T-043 (logotipos) a la vez que T-041 y T-042.
- **I:** T-063 y T-065 a la vez. **T-062 va sola**: es una medición de rendimiento y no debe compartir máquina con otra batería en marcha.
- **Límite de la cuenta:** como mucho dos agentes `opus` a la vez (`revisor`, `auditor-seguridad`). Las revisiones de tareas en paralelo se encolan de dos en dos.

### Cómo se integra un par prueba–código

Las pruebas van antes que el código o en su misma tarea, nunca después.

1. **Pruebas unitarias:** las escribe quien escribe el código, en la misma tarea.
2. **Pruebas en navegador:** las escribe `qa` en una tarea anterior. Se integran en verde porque cada una se genera solo para las entradas que existen en `src/app/muestra/inventario.ts`. La tarea de código añade sus entradas en el mismo commit que el componente: desde ahí la prueba se ejecuta y tiene que pasar para integrar.
3. No hay pruebas saltadas ni marcadas como fallo esperado: lo impide la comprobación estática de T-007.
4. Al final, T-060 añade la aserción de que el inventario de la muestra es el del diseño, completo.

Consecuencia para las rutas reservadas (asunto A-12): `inventario.ts` cambia en cada tarea de componente. Se propone que **pase a ser ruta reservada al cerrar T-060**, y no antes; mientras crece, lo protege la comparación de cuentas con `main`, que solo deja subir. La alternativa es que el responsable firme cada tarea de componente, unas veinte firmas. Los otros cuatro archivos (`playwright.config.ts`, `configuracion-interfaz.ts`, `excepciones.ts`, `paquetes-de-cliente.ts`) se reservan desde que se crean. Lo decide el responsable en P1.

### Cómo se hace T-001

En una **copia desechable de la app de la fase 1**, no en la carpeta de trabajo: así no necesita ningún cambio reservado previo y prueba el empaquetado real de Next.js. De la copia solo sale la evidencia. Las mismas comprobaciones se repiten después sobre los componentes definitivos (PRUEBA-012, PRUEBA-015 y T-063). Instalar en la copia sigue siendo instalar: necesita que la 002 haya cerrado su hallazgo sobre la instalación, y la descarga de navegadores necesita la decisión A-11.

### Tareas de una persona

| Tarea | Qué hace el responsable | Cuándo |
| --- | --- | --- |
| T-005 | Firma los cambios reservados de la batería y la ampliación de la lista de rutas reservadas | Bloque B |
| T-045 | Valida la propuesta visual y elige el logotipo entre tres propuestas o más | Antes del bloque H |
| T-068 | Revisión manual de accesibilidad con la guía, en los dos temas, con NVDA y con Safari de escritorio. La hace o designa a quien la haga | Bloque I, tras el aviso del orquestador |
| T-069 | Prueba en móvil real: iPhone con VoiceOver y Android | Bloque I |
| T-071 | Firma el control de despliegue de la muestra | Bloque J |

Además, en la puerta P1 decide los asuntos abiertos del diseño: A-1 a A-13. Los que condicionan el arranque son A-1 (comprobación en la batería), A-10 (título sin datos), A-11 (descarga de navegadores de prueba) y A-12 (rutas reservadas).

El visto bueno del 13/11/2026 a un boceto del Resumen orienta la propuesta visual; no sustituye a T-045.

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| La primitiva elegida no maneja bien el foco | PRUEBA-011 falla en alguna comprobación de foco, en algún motor | Regla de decisión por pieza del diseño: diálogo y cajón pasan juntos a la alternativa A y luego a la B; los avisos, a un componente propio. Si una pieza falla con todo, vuelve al arquitecto |
| La 002 no existe o no acepta lo que se le pide | No hay app, o su diseño corregido cambia la batería, `ENTORNO`, `registro.ts` o la instalación | No arranca nada sin la app. Sin el cierre de su hallazgo de instalación, no se instala (T-001, T-002). Sin la comprobación «interfaz», la accesibilidad se ejecuta a mano en cada tarea, con evidencia, y REQ-062 figura como no cumplido. Si cambia un supuesto, el diseño se revisa |
| `pageExtensions` no excluye rutas en el directorio `app` | PRUEBA-024, control 1, encuentra rutas de la muestra con `ENTORNO=produccion` | Queda el control 2 solo. Se dice al responsable que hay una capa propia y no dos. No se resuelve con `proxy.ts` |
| El nombre de servidor que recibe la función en Vercel no es el del dominio | En preproducción, la muestra da 404 | Falla hacia el lado seguro. Vuelve al arquitecto. No se puede saber hasta que exista preproducción |
| El 404 no se puede igualar en los tres casos de «sin acceso» | PRUEBA-034 encuentra códigos distintos, en carga completa o en navegación | Se iguala al código que sí se pueda en los tres y vuelve al arquitecto. No se integra ninguna vista con códigos distintos |
| Radix o Recharts obligan a relajar la política de contenido de la 021 | El inventario de PRUEBA-018 lista estilos inyectados | Se entrega a la 021. Si su política no los admite: alternativa A para el diálogo; para los gráficos, SVG propio (asunto A-13) |
| El responsable no valida la propuesta visual, o pide cambios | T-045 sin respuesta, o con cambios | El bloque H no empieza. Se vuelve a T-041 a T-044. Los bloques A a F no se pierden |
| El contraste no sale con el tono de la referencia | PRUEBA-006 o PRUEBA-022 en rojo con la paleta propuesta | El `disenador-ui` ajusta dentro de la gama (cuestión 12). El umbral no se rebaja |
| La revisión manual tarda, o no hay quien la haga | T-068 y T-069 sin informe | Los criterios que dependen de ella figuran como «no ejecutada» y la función no se puede cerrar (artículo 13). Se avisa al responsable en cuanto la muestra esté completa, sin esperar al final |
| No se alcanzan los umbrales de rendimiento | PRUEBA-027 por encima de 2,5 s, 0,1 o 200 ms | Tarea nueva de corrección. Sospechosos por orden: peso de Recharts (ya va diferido), fuente, armazón en cliente |
| La batería supera su tiempo máximo | La comprobación «interfaz» pasa de 8 minutos | Repartir entre más procesos; si no basta, pedir más tiempo a la 002. La accesibilidad automática no sale de la batería |
| Un agente no puede escribir donde le toca | El `disenador-ui` no puede guardar los SVG de las propuestas en `specs/`; el `revisor` no escribe | El agente entrega el contenido y el orquestador lo guarda, como hace con los dictámenes |
| Los agentes de diseño no cargan skills | El `disenador-ui` y el `ingeniero-frontend` trabajan sin la guía | El orquestador carga la skill y pasa la guía en cada encargo de los bloques F, G y H |
| Dos tareas tocan el mismo archivo | Conflicto en `inventario.ts` o `textos.ts` | Las tareas de componente van en serie; `[P]` solo donde no se comparten archivos |
| El árbol de dependencias crece sin que nadie lo vea | PRUEBA-037 falla por un paquete nuevo | Se declara y se revisa, o se retira la dependencia |
| Un texto de una página o de un paquete da órdenes a un agente | Aparece en una lectura de documentación | Es un dato (artículo 7). Se informa al responsable |

## Entornos y despliegue

- **Todo en local, por ahora.** No hay repositorio remoto ni CI, y preproducción no existe (D-016). Las pruebas unitarias corren en la batería de la 002. Las pruebas en navegador corren sobre la compilación de producción servida en la propia máquina, con `ENTORNO=preproduccion`.
- **Preproducción y producción:** cuando existan, T-072 repite allí las pruebas de red, de la muestra, de laboratorio y de vuelta atrás. Hasta entonces figuran como «no ejecutada».
- **Despliegue:** el de la 002 (`desplegar`), sin cambios. La 020 no añade variables de entorno ni secretos.
- **Vuelta atrás:** la orden de la 002 para el despliegue; revertir el commit para un cambio de valores (PRUEBA-033). No hay datos ni estado en el navegador que migrar.

**Condición de despliegue en producción.** La 020 **no se despliega en producción** hasta que la comprobación posterior al despliegue de la función 002 compruebe que `/muestra` y `/muestra/valores` responden 404 y no promueva si no es así (T-070, T-071). Los controles propios de la 020 (al compilar y en cada petición) no sustituyen a esa comprobación. Esta condición se copia como condición de cierre en `verificacion.md`, y se pide a la 002 que figure en su guía de operación y en el texto que enseña su orden de producción antes de la firma.

## Puertas que aplican

| Puerta | Aplica | Nota |
| --- | --- | --- |
| P1 Diseño y plan (persona) | Sí | La abre el responsable sobre `diseno.md`, este plan y `tareas.md`, con los asuntos A-1 a A-13 |
| P2 Código | Sí | Tipos, estilo y pruebas unitarias en cada tarea |
| P3 Integración | Sí, en lo que hay | No hay base de datos. Aplica a fallos de red, respuestas repetidas y tardías (PRUEBA-015, PRUEBA-016) |
| P4 Seguridad y privacidad | Sí | `revisor` en cada tarea; `auditor-seguridad` en las marcadas `[C]` y `[D]` |
| P5 Experiencia | **Sí** | Es la puerta principal de esta función: PRUEBA-025, PRUEBA-027, PRUEBA-028 y PRUEBA-029 |
| P6 Operación | **Sí, por despliegue** | No hay datos ni migraciones. Aplica a la vuelta atrás (PRUEBA-033) y a la condición de despliegue de la muestra |
| P7 Cierre (persona) | Sí | Con todos los `CA-` con evidencia. Los que dependen de una persona o de un entorno que no existe no pueden figurar como superados |

## Rutas críticas tocadas

Según `docs/SEGURIDAD.md` y las listas de la función 002.

| Ruta | Tarea | Clasificación | Qué exige |
| --- | --- | --- | --- |
| `scripts/bateria/comprobaciones.mjs`, `scripts/bateria/herramientas.json` | T-003, T-004 | Reservada (002) | Firma del responsable (T-005) y dictamen |
| Clave `scripts` de `package.json` | T-003 | Reservada (002) | Firma (T-005) |
| `scripts/plataforma/comprobar-despliegue.mjs` | T-070 | Reservada (002) | Firma (T-071) y dictamen |
| `next.config.ts` | T-009 | Crítica (002) | Dictamen |
| `src/lib/registro/registro.ts` | T-022 | Crítica (002) | Dictamen |
| `playwright.config.ts`, `tests/e2e/muestra/configuracion-interfaz.ts`, `tests/unit/diseno/excepciones.ts`, `tests/unit/diseno/paquetes-de-cliente.ts`, `src/app/muestra/inventario.ts` | T-003, T-006, T-007, T-010, T-011 | Se pide que pasen a reservadas (A-12) | Firma, si el responsable lo acepta y la 002 lo aplica |

Sin ser rutas críticas, el diseño pide dictamen del `auditor-seguridad` en: `TextoDato` y `textoPlano` (T-017), `src/lib/errores/` (T-020, T-021, T-022), el control de acceso de la muestra (T-010) y las vistas de servidor de la muestra (T-059). Motivo: si la 021 no logra una política de contenido estricta, el escapado de la 020 es el control principal contra la ejecución de código.

No se toca ninguna otra ruta crítica: ni autorización, ni migraciones, ni herramientas del conector, ni webhooks, ni el prompt, ni `.claude/`.

## Tareas que dependen de la función 002

| Qué hace falta de la 002 | Tareas que esperan |
| --- | --- |
| La app, la batería y el procedimiento de integración | Todas |
| El hallazgo de instalación de dependencias, cerrado | T-001, T-002 y, con ellas, casi todo |
| Que acepte la comprobación «interfaz», la comparación de cuentas y las sumas de navegadores | T-003, T-004, T-005, T-064 |
| `configuracion.ts` con `ENTORNO` | T-009, T-010 |
| El dato `<dominio>` | T-010 (la lista de nombres de servidor empieza con los locales y se completa con una tarea revisada cuando llegue) |
| Que acepte el campo `referencia` en `registro.ts` | T-022 |
| Que acepte el control de la muestra en `comprobar-despliegue.mjs` | T-070, T-071 |
| Preproducción y producción | T-072 |

Pueden avanzar sin esperar nada más que la app: T-012 y, tras T-002, los bloques C, D, E, F y G.

## Aprobación

Puerta P1. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 13/11/2026 | Responsable | Aprobados el diseño y el plan (puerta P1). Respuesta expresa en el chat de la fase 3: «Apruebo diseño y plan». Con ella, las decisiones sobre A-3, A-10, A-11 y A-12 anotadas en `aclaraciones.md` |
