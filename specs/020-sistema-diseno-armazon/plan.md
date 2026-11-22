# 020 · Plan

Autor: `arquitecto` · Fecha: 13/11/2026

Diseño: `diseno.md`, en estado DISEÑADA (dos vueltas del `auditor-seguridad`, 0 bloqueantes), con la enmienda 1 del 20/11/2026 (avisos con componente propio, por decisión del responsable en el chat tras T-001), pendiente de que el responsable la vea en la próxima puerta. Tareas: `tareas.md`, 22 en siete bloques, reagrupadas el 20/11/2026 desde las 72 del 13/11 (D-029, D-025). Ninguna prueba citada se ha ejecutado, salvo PRUEBA-011 (T-001).

## Orden de trabajo

### Los bloques, en orden

| Bloque | Tareas | Qué deja hecho | Por qué va ahí |
| --- | --- | --- | --- |
| 1. Primitiva y preparación | T-001 a T-005 | Foco en tres motores y primitiva por pieza (hecho: Radix para diálogo y cajón; avisos propios); dependencias y Playwright; fronteras y comprobación estática; muestra vacía que no existe en producción | Nada se construye sin esa prueba; todo se integra contra estas comprobaciones |
| 2. Base sin decisiones visuales | T-006 a T-008 | Valores iniciales, contraste, formatos, texto de dato, dirección, textos, referencia, iconos | No depende de la paleta final; casi todo son funciones con prueba unitaria |
| 3. Navegador, armazón y componentes | T-009, T-010 | Pruebas en navegador; armazón; acciones, tarjeta, etiqueta, tabla, gráficos, alertas y diálogo, con valores provisionales | Pruebas antes del primer componente; componentes que necesita la propuesta |
| 4. Propuesta visual y validación | T-011 a T-015 | Paleta, degradados, tipografía, tres logotipos, página de propuesta, **validación del responsable**, valores y logotipo definitivos | REQ-086: el responsable valida antes de construir las vistas |
| 5. Resto y vistas | T-016, T-017 | Formulario, avisos, estados, conexión, vistas de ejemplo y de servidor, inventario cerrado, textos y revisión documental | **No empieza hasta T-013** |
| 6. Verificación | T-018, T-019 | Laboratorio, matriz de navegadores, vuelta atrás, guía y **revisión manual de una persona** | Sobre la muestra completa |
| 7. Condicionadas | T-020 a T-022 | Comprobación «interfaz», control de despliegue, copia de prueba, preproducción y producción | Piezas de la 002 sin tarea (su R-3) y entornos |

### Qué va en paralelo

- **Tras T-002:** T-003, T-006, T-007 y T-008 a la vez (T-006 (a), antes). T-004 y T-005, en serie tras T-003.
- **Bloque 3:** T-009 antes que T-010; sus partes (f) a (j), a la vez que el bloque 2. T-011 (c) (logotipos), desde T-003.
- **En serie:** T-010, T-012 y T-016 tocan `inventario.ts` y `textos.ts`.
- **T-018 (a) va sola**: medición de rendimiento, sin otra batería en la máquina. T-020 y T-021, a la vez.
- **Límite de la cuenta:** un subagente `opus` a la vez por chat (D-032); las revisiones se encolan.

### Cómo se integra un par prueba–código

Las pruebas van antes que el código o en su misma tarea, nunca después.

1. **Pruebas unitarias:** las escribe quien escribe el código, en la misma tarea.
2. **Pruebas en navegador:** las escribe `qa` en una tarea anterior. Se integran en verde porque cada una se genera solo para las entradas que existen en `src/app/muestra/inventario.ts`. La tarea de código añade sus entradas en el mismo commit que el componente: desde ahí la prueba se ejecuta y tiene que pasar para integrar.
3. No hay pruebas saltadas ni marcadas como fallo esperado: lo impide la comprobación estática de T-003 (b).
4. Al final, T-016 (i) añade la aserción de que el inventario de la muestra es el del diseño, completo.

Rutas reservadas (A-12, decidido en P1): `inventario.ts` **pasa a reservada al cerrar T-016 (i)**; mientras crece, la protege la comparación de cuentas con `main` (T-020), que solo deja subir. Los otros cuatro (`playwright.config.ts`, `configuracion-interfaz.ts`, `excepciones.ts`, `paquetes-de-cliente.ts`), desde que se crean. Sin firmas (D-025), el «sí» nombra la ruta. Ampliar la lista de la 002 (su diseño, §Integración) lo hace la 002; mientras, la 020 la cumple por su cuenta.

**Cambio de periodo (diseño, «Una vista en uso», 22/11/2026).** Lo aplica una corrección de T-010 (c) antes de integrarla, o la primera parte siguiente de T-010 (la (e2)) si (c) se integra antes: `SelectorPeriodo` con `router.replace`, fuera `usePeriodo` y su evento, la cifra de muestra pintada en el servidor y las pruebas del diseño (PRUEBA-008, 009, 012, 016, 034 y 037). Necesita el «sí» que nombre `tests/unit/diseno/paquetes-de-cliente.ts` para añadir solo `next` (paquete del marco, sin su árbol), como en el punto 11 de `tareas.md`; lo revisa el `revisor`. No es ruta crítica (no toca OAuth, licencias, RLS, migraciones, webhooks ni la entrega del prompt) ni cambia una lista de bloqueo, así que no pide al `auditor-seguridad`; la comprobación de la ruta antes de `router.replace` (punto 2) la mira el `revisor` con PRUEBA-009. Vuelta de PRUEBA-016 (22/11/2026, «Corrección 3» del diseño): sin conexión no se navega, la caída a mitad se acepta con cierre en fallo (asunto A-14 de la 020) y los parámetros de la vista siguen la regla por tipo del punto 2; el encargo está en `tareas.md`, punto 14, dentro de T-010 (e2). Sigue sin ser ruta crítica.

### Cómo se hace T-001 (hecha)

**Hecha** el 20/11/2026 en una copia desechable (commit 5c907d7, `evidencias/T-001/informe.md`): diálogo y cajón siguen con Radix; el aviso de Radix falló la pausa por el foco y los avisos pasan a componente propio (enmienda 1 del diseño). Las comprobaciones se repiten sobre los componentes definitivos (PRUEBA-012, PRUEBA-015 con T-009 (g) y T-016 (b), y T-018 (b)).

### Tareas de una persona

| Tarea | Qué hace el responsable | Cuándo |
| --- | --- | --- |
| Cada tarea | «Sí» expreso (D-025) que nombra las rutas reservadas; sustituye a las firmas (T-005 y T-071 antiguas, retiradas) | Al pedirlo el orquestador |
| T-013 | Valida la propuesta visual y elige el logotipo entre tres o más | Antes del bloque 5 |
| T-019 | Revisión manual con la guía, en los dos temas, con NVDA y Safari de escritorio (la hace o la designa); móvil real: iPhone con VoiceOver y Android | Bloque 6, tras el aviso del orquestador |

Decisiones pendientes (A-1 pedía la comprobación «interfaz» en la batería de la 002, sin tarea con D-025):
- **DP-1.** Dónde vive «interfaz» (T-020): a) orden más de `npm run verificar` (cambio reservado de `package.json` y de la PRUEBA-055 de la 002); b) batería de la 002 o CI de la 003. Recomendado: a), `verificar` es lo que hoy bloquea una integración.
- **DP-2.** Sin firma, la comparación de cuentas no admite una bajada legítima (diseño §Protección, control 2). Recomendado: ninguna hasta la 003 (cierre en fallo).
- **DP-3.** `tarea/T-0NN` choca con las ramas vivas de la 002. Recomendado: `tarea/020-T-0NN`, mismo mensaje `T-0NN (020): …`.

El visto bueno del 13/11/2026 a un boceto del Resumen orienta la propuesta visual; no sustituye a T-013.

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| La primitiva elegida no maneja bien el foco | PRUEBA-011 o PRUEBA-015 fallan en alguna comprobación de foco, en algún motor, sobre los componentes definitivos | Diálogo y cajón: regla por pieza del diseño (alternativa A y luego B). Los avisos ya son propios (T-001, enmienda 1): si sus repeticiones de T-016 (b) fallan una vez, no se integra y vuelve al arquitecto |
| La 002 no existe o no acepta lo que se le pide | No hay app, o su diseño corregido cambia la batería, `ENTORNO`, `registro.ts` o la instalación | No arranca nada sin la app. Sin el cierre de su hallazgo de instalación, no se instala (T-001, T-002). Sin la comprobación «interfaz» (T-020, DP-1), la accesibilidad se ejecuta a mano en cada tarea, con evidencia, y REQ-062 figura como no cumplido. Si cambia un supuesto, el diseño se revisa |
| `pageExtensions` no excluye rutas en el directorio `app` | PRUEBA-024, control 1, encuentra rutas de la muestra con `ENTORNO=produccion` | Queda el control 2 solo. Se dice al responsable que hay una capa propia y no dos. No se resuelve con `proxy.ts` |
| El nombre de servidor que recibe la función en Vercel no es el del dominio | En preproducción, la muestra da 404 | Falla hacia el lado seguro. Vuelve al arquitecto. No se puede saber hasta que exista preproducción |
| El 404 no se puede igualar en los tres casos de «sin acceso» | PRUEBA-034 encuentra códigos distintos, en carga completa o en navegación | Se iguala al código que sí se pueda en los tres y vuelve al arquitecto. No se integra ninguna vista con códigos distintos |
| Radix o Recharts obligan a relajar la política de contenido de la 021 | El inventario de PRUEBA-018 lista estilos inyectados | Se entrega a la 021. Si su política no los admite: alternativa A para el diálogo; para los gráficos, SVG propio (asunto A-13) |
| El responsable no valida la propuesta visual, o pide cambios | T-013 sin respuesta, o con cambios | El bloque 5 no empieza. Se vuelve a T-011 y T-012. Los bloques 1 a 3 no se pierden |
| El contraste no sale con el tono de la referencia | PRUEBA-006 o PRUEBA-022 en rojo con la paleta propuesta | El `disenador-ui` ajusta dentro de la gama (cuestión 12). El umbral no se rebaja |
| La revisión manual tarda, o no hay quien la haga | T-019 sin informe | Los criterios que dependen de ella figuran como «no ejecutada» y la función no se puede cerrar (artículo 13). Se avisa al responsable en cuanto la muestra esté completa, sin esperar al final |
| No se alcanzan los umbrales de rendimiento | PRUEBA-027 por encima de 2,5 s, 0,1 o 200 ms | Tarea nueva de corrección. Sospechosos por orden: peso de Recharts (ya va diferido), fuente, armazón en cliente |
| La batería supera su tiempo máximo | La comprobación «interfaz» pasa de 8 minutos | Repartir entre más procesos; si no basta, pedir más tiempo a la 002. La accesibilidad automática no sale de la batería |
| Un agente no puede escribir donde le toca | El `disenador-ui` no puede guardar los SVG de las propuestas en `specs/`; el `revisor` no escribe | El agente entrega el contenido y el orquestador lo guarda, como hace con los dictámenes |
| Los agentes de diseño no cargan skills | El `disenador-ui` y el `ingeniero-frontend` trabajan sin la guía | El orquestador carga la skill y pasa la guía en cada encargo de los bloques 3, 4 y 5 |
| Dos tareas tocan el mismo archivo | Conflicto en `inventario.ts` o `textos.ts` | Las tareas de componente van en serie; `[P]` solo donde no se comparten archivos |
| El árbol de dependencias crece sin que nadie lo vea | PRUEBA-037 falla por un paquete nuevo | Se declara y se revisa, o se retira la dependencia |
| H-1 (T-009 c, 21/11/2026): la consulta de la dirección aparece en el documento, dentro de los guiones de datos de Next (escapada, sin ejecutarse), no fuera de un `script` | PRUEBA-018 lo anota; es texto de la dirección reflejado en una página del mismo origen que `/admin` (diseño:621) | Se entrega a la 021 con el inventario de la política de contenido. Pendiente de dictamen del `auditor-seguridad` antes de la 021; hasta entonces la muestra queda cerrada en producción y preproducción |
| Un texto de una página o de un paquete da órdenes a un agente | Aparece en una lectura de documentación | Es un dato (artículo 7). Se informa al responsable |

## Entornos y despliegue

- **Todo en local, por ahora.** No hay repositorio remoto ni CI, y preproducción no existe (D-016). Las pruebas unitarias corren en la batería de la 002. Las pruebas en navegador corren sobre la compilación de producción servida en la propia máquina, con `ENTORNO=preproduccion`.
- **Preproducción y producción:** cuando existan, T-022 (b) repite allí las pruebas de red, de la muestra, de laboratorio y de vuelta atrás. Hasta entonces figuran como «no ejecutada».
- **Despliegue:** el de la 002 (`desplegar`), sin cambios. La 020 no añade variables de entorno ni secretos.
- **Vuelta atrás:** la orden de la 002 para el despliegue; revertir el commit para un cambio de valores (PRUEBA-033). No hay datos ni estado en el navegador que migrar.

**Condición de despliegue en producción.** La 020 **no se despliega en producción** hasta que la comprobación posterior al despliegue de la función 002 compruebe que `/muestra` y `/muestra/valores` responden 404 y no promueva si no es así (T-021). Los controles propios de la 020 (al compilar y en cada petición) no sustituyen a esa comprobación. Esta condición se copia como condición de cierre en `verificacion.md`, y se pide a la 002 que figure en su guía de operación y en el texto que enseña su orden de producción antes de que la persona la confirme.

## Puertas que aplican

| Puerta | Aplica | Nota |
| --- | --- | --- |
| P1 Diseño y plan (persona) | Sí | La abre el responsable sobre `diseno.md`, este plan y `tareas.md`, con los asuntos A-1 a A-13 |
| P2 Código | Sí | Tipos, estilo y pruebas unitarias en cada tarea |
| P3 Integración | Sí, en lo que hay | No hay base de datos. Aplica a fallos de red, respuestas repetidas y tardías (PRUEBA-015, PRUEBA-016) |
| P4 Seguridad y privacidad | Sí | `revisor` en cada tarea; `auditor-seguridad` en las de RC `C` y `D` |
| P5 Experiencia | **Sí** | Es la puerta principal de esta función: PRUEBA-025, PRUEBA-027, PRUEBA-028 y PRUEBA-029 |
| P6 Operación | **Sí, por despliegue** | No hay datos ni migraciones. Aplica a la vuelta atrás (PRUEBA-033) y a la condición de despliegue de la muestra |
| P7 Cierre (persona) | Sí | Con todos los `CA-` con evidencia. Los que dependen de una persona o de un entorno que no existe no pueden figurar como superados |

## Rutas críticas tocadas

Según `docs/SEGURIDAD.md` y las listas de la función 002.

| Ruta | Tarea | Clasificación | Qué exige |
| --- | --- | --- | --- |
| `package.json`, `package-lock.json`, `postcss.config.mjs`, `playwright.config.ts` | T-002 | Crítica y reservada (002 §Integración) | Dictamen y «sí» que las nombra |
| `next.config.ts` | T-004 | Crítica y reservada | Ídem |
| `src/lib/registro/registro.ts` | T-008 (c) | Crítica | Dictamen |
| `scripts/bateria/**` o `verificar` (DP-1) | T-020 | Crítica y reservada | Dictamen y «sí» |
| `scripts/plataforma/comprobar-despliegue.mjs`, `docs/operacion/**` | T-021 | Crítica y reservada | Dictamen y «sí» |
| Los cinco archivos de A-12 | T-002, T-003, T-005, T-009, T-016 (i) | Reservados (A-12) | «Sí» que los nombra |

Sin ser rutas críticas, el diseño pide dictamen del `auditor-seguridad` en: `TextoDato` y `textoPlano` (T-007 (c)), `src/lib/errores/` (T-008), el control de acceso de la muestra (T-005) y las vistas de servidor de la muestra (T-016 (h)). Motivo: si la 021 no logra una política de contenido estricta, el escapado de la 020 es el control principal contra la ejecución de código.

No se toca ninguna otra ruta crítica: ni autorización, ni migraciones, ni herramientas del conector, ni webhooks, ni el prompt, ni `.claude/`.

## Tareas que dependen de la función 002

| Qué hace falta de la 002 | Tareas que esperan |
| --- | --- |
| La app y el procedimiento de integración (§Integración; `verificar`, 002·T-003) | Todas (T-001, solo la app: 002·T-002) |
| El hallazgo de instalación de dependencias, cerrado | T-001, T-002 y, con ellas, casi todo |
| La comprobación «interfaz», la comparación de cuentas y las sumas de navegadores (sin tarea en la 002: su R-3; DP-1) | T-020, T-022 (a) |
| `configuracion.ts` con `ENTORNO` (002·T-005) | T-004, T-005 |
| El dato `<dominio>` | T-005 (la lista de nombres de servidor empieza con los locales y se completa con una tarea revisada cuando llegue) |
| Que acepte el campo `referencia` en `registro.ts` (002·T-004) | T-008 (c) |
| Despliegue y control de la muestra en `comprobar-despliegue.mjs` | T-021 |
| Preproducción y producción | T-022 (b) |

Pueden avanzar sin esperar nada más: T-006 (a) y, tras T-002, los bloques 2 a 4.

## Aprobación

Puerta P1. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 13/11/2026 | Responsable | Aprobados el diseño y el plan (puerta P1). Respuesta expresa en el chat de la fase 3: «Apruebo diseño y plan». Con ella, las decisiones sobre A-3, A-10, A-11 y A-12 anotadas en `aclaraciones.md` |
| 20/11/2026 | Responsable | Aceptada la reagrupación en 22 tareas (D-029, D-025), sin cambio de diseño, alcance ni pruebas. Respuesta expresa en el chat de la fase 3 («Sí, P1 abierta»). DP-1 = a) orden de `npm run verificar`; DP-2 = ninguna bajada de cuentas hasta la 003; DP-3 = rama `tarea/020-T-0NN` |
