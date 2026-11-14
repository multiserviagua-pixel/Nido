# 002 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (dictamen de la primera vuelta respondido al final; pendiente de su segunda vuelta) · Fecha: 13/11/2026, segunda versión

Especificación: APROBADA el 12/11/2026 y enmendada el 13/11/2026 (enmienda 1, decisión D-016). Esta versión sustituye a la del 12/11/2026, que es la que revisó `dictamen-diseno.md`: los números de línea del dictamen son de aquella. Verificaciones en documentación oficial: `verificaciones.md`, con el apartado 11 añadido hoy. Este diseño no cambia el estado de la función.

Datos que faltan y no se inventan: `<dominio>` (dominio principal completo; los subdominios son `nido` y `pre-nido`) y `<carpeta de copia>` (destino de la copia). Los entrega el responsable antes de la puerta P1.

Supone que depende de: el primer commit de la rama principal con el arnés (acto reservado 1, sin hacer: el repositorio no tiene ningún commit); la confirmación por el responsable de los servicios propuestos (requisito 46); y sus decisiones sobre los asuntos A-1 y A-3, que el dictamen pide antes de la puerta P1. El proyecto de base de datos `nido-desarrollo` lo crea el responsable desde la consola (`aclaraciones.md`, enmienda 1): no es una pieza de este diseño.

Para no confundir: «asunto A-n» es un asunto abierto de este documento (A-1 a A-14); «amenaza A-nn» es una amenaza de `docs/SEGURIDAD.md` (A-15, A-16, A-19, A-20 y A-22 son las que aplican).

## Resumen

El repositorio local gana una rama `main` a la que solo se entra por una orden, `integrar`, que ejecuta la batería sobre el commit candidato en un clon limpio, exige la revisión guardada sobre ese mismo commit y, si el cambio es reservado, una aprobación firmada por el responsable. **Lo que decide —reglas, firmantes, verificadores y el código de las propias órdenes— se lee siempre de `main`, nunca del candidato ni de la copia de trabajo**; las órdenes que ejecuta la persona salen de una carpeta suya, fuera del repositorio, extraída de un commit que ella ha sellado. Una décima comprobación de la batería recorre la rama y falla si algún commit no cumple, si falta uno ya integrado o si la rama no existe.

La app base es una app Next.js 16.4 sin entradas: una página de inicio estática, una comprobación de disponibilidad que responde `{"estado":"ok"}`, dos rutas de diagnóstico cerradas al público y sus páginas de error. Todo eso, con la batería, la integración, las órdenes de despliegue y de vuelta atrás, la copia y la guía, **se construye y se prueba en local** (requisito 72).

Los entornos se crean solo dentro de la ventana de prueba, que es la prueba gratuita de 14 días del plan Pro de la plataforma de despliegue: abierta el 13/11/2026, termina el 27/11/2026. No se crea ningún proyecto ni se despliega nada hasta que el responsable firma la confirmación de las condiciones de inicio; la orden de despliegue lo comprueba y se niega sin ella. Dentro de la ventana hay **dos proyectos separados**, uno por entorno, con las funciones en `fra1`: cada entorno tiene su dirección estable, sus variables y una credencial que no alcanza al otro. Cada despliegue se prepara sin servir, se comprueba en el propio entorno y solo entonces se promueve; la vuelta atrás reasigna el dominio al despliegue anterior sin compilar. Los errores se envían a un servicio de supervisión en la UE con un módulo propio que solo sabe escribir una lista cerrada de campos; la disponibilidad la vigila un servicio externo cada 5 minutos; los dos avisan por correo al responsable. Antes de que la ventana termine, el responsable decide el pago o se retiran los proyectos: nada se sirve nunca desde el plan gratuito de la plataforma.

La prioridad del responsable es aprovechar la ventana para la prueba real del conector (función 001). Por eso el orden de construcción pone primero lo que la 001 necesita para integrarse, desplegarse y probarse.

Lo que este diseño no puede cerrar solo está en «Asuntos abiertos para el responsable». Dos son condición de la puerta P1: qué barrera separa a los agentes de lo que teclea la persona (A-3) y qué se acepta sobre los registros de la plataforma (A-1).

## Orden de construcción

Va primero lo que la función 001 necesita para poder integrarse, desplegarse y probarse. El detalle por tareas es del plan; aquí queda el orden y de qué depende cada tramo.

| Tramo | Dónde | Qué se hace | Qué desbloquea |
| --- | --- | --- | --- |
| 0. Decisiones y datos | Persona | `<dominio>` y `<carpeta de copia>`; primer commit con el arnés (acto 1); decisiones A-1 y A-3; confirmación de servicios (A-9); clave de aprobaciones creada | La puerta P1 de esta función y de la 001 |
| 1. Arranque | Local | Manifiesto y archivo de bloqueo, configuración de las herramientas, app base mínima (inicio y `/api/salud`), batería con sus diez comprobaciones, órdenes `candidato`, `integrar`, `aprobar`, `sellar` y el lanzador, reglas de integración y firmantes. Termina con el ancla `integrado/0000` y la primera carpeta sellada | **Todo lo demás.** Desde aquí la 001 y las fases 2 y 4 pueden integrar |
| 2a. Lo que la 001 importa | Local | `configuracion.ts`, `registro.ts` y `codigos.ts`, `manejador.ts`, `errores.ts`, `entrada.ts`, `supervision.ts`, `instrumentation.ts`, cabeceras, reglas del análisis estático, inventario de rutas | El código del conector se escribe sobre estas piezas |
| 2b. Lo que la 001 necesita para desplegarse | Local | `vercel.json`, `herramientas/despliegue/`, `entornos.json`, órdenes `desplegar`, `comprobar-despliegue`, `estado`, `volver-atras` y `comprobar-inicio`, con sus pruebas contra un doble de la CLI; orden `declarar`; apartados de la guía sobre entornos, credenciales, despliegue y vuelta atrás | La condición de inicio «órdenes probadas sin la plataforma» (criterio 44) |
| 2c. Resto de lo local | Local, a la vez que la 001 construye el conector | Copia diaria y restauración, purga de candidatos, búsqueda por valor, guía completa, rutas de diagnóstico, casos de inyección de fallos que falten | El resto de los criterios locales (condición de inicio 1) |
| 3. Preproducción | En la ventana, primer día | Proyecto `nido-pre`, CNAME de `pre-nido`, variables, credencial limitada al proyecto y PRUEBA-022 hasta donde alcanza con un solo proyecto, primer despliegue, región, protección, supervisión, disponibilidad y avisos, límite por dirección | **La 001 despliega el conector y empieza su prueba real** |
| 4. Producción y verificación de la plataforma | En la ventana, sin tocar preproducción mientras corren los días programados de la 001 | Proyecto `nido`, CNAME de `nido`, orden de producción, resto de PRUEBA-022, vuelta atrás, y las pruebas de preproducción que la interrumpen, colocadas antes de los días programados o en los de margen | Los criterios de entorno de esta función |
| 5. Cierre de la ventana | En la ventana, último día | Decisión del responsable sobre el pago; si no se contrata, retirada de los proyectos y comprobación | Criterio 47 |

Los tramos 1 y 2a son el camino crítico de la 001. El 2b y el 2c los puede construir el agente `plataforma` mientras los ingenieros de la 001 construyen el conector, que es lo más largo. El requisito 74 exige **todos** los criterios locales antes del primer despliegue, también los del tramo 2c: ver asunto A-14.

## Piezas y responsabilidades

### Mapa de archivos

Rutas según `docs/ESQUELETO.md`. Las que no están en él se marcan **(nueva)** y se piden aprobar con este diseño (criterio 16, asunto A-8).

| Ruta | Qué hace | Agente |
| --- | --- | --- |
| `package.json`, `package-lock.json` | Manifiesto con `"engines": {"node": "26.x"}`, Next.js 16.4 y los alias de las órdenes; archivo de bloqueo | `plataforma` |
| `tsconfig.json`, `next.config.ts` | Tipos estrictos; cabeceras; `poweredByHeader: false` | `ingeniero-backend` |
| `vercel.json` | `regions: ["fra1"]`, `installCommand: "npm ci --ignore-scripts"`, orden de compilación | `plataforma` |
| `.vercelignore` **(nueva)** | No sube `specs/`, `docs/`, `.claude/`, `.github/`, `tests/`, `herramientas/`, `CLAUDE.md` ni `AGENTS.md` | `plataforma` |
| `.node-version` **(nueva)** | `26` | `plataforma` |
| `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore` **(nuevas)** | Estilo | `plataforma` |
| `eslint.seguridad.config.mjs` **(nueva)** | Análisis estático: reglas y su gravedad | `plataforma` |
| `.gitleaks.toml` **(nueva)** | Reglas por defecto de Gitleaks más las del proyecto | `plataforma` |
| `vitest.config.ts` **(nueva)** | Pruebas | `qa` |
| `src/app/layout.tsx`, `page.tsx`, `not-found.tsx`, `error.tsx`, `global-error.tsx` | Páginas de la app base | `ingeniero-frontend` |
| `src/app/api/salud/route.ts` **(nueva)** | Comprobación de disponibilidad | `ingeniero-backend` |
| `src/app/api/diagnostico/error/route.ts`, `…/error-no-capturado/route.ts` **(nuevas)** | Errores provocados, solo alcanzables en la dirección protegida de cada despliegue | `ingeniero-backend` |
| `src/instrumentation.ts` **(nueva)** | `register` (guardia de consola) y `onRequestError` (informa a la supervisión) | `ingeniero-backend` |
| `src/lib/plataforma/` **(nueva)** | `configuracion.ts` (único lugar que lee variables de entorno), `region.ts`, `supervision.ts`, `manejador.ts`, `errores.ts`, `entrada.ts` | `ingeniero-backend` |
| `src/lib/registro/` | `registro.ts` (único lugar con `console`) y `codigos.ts` (lista cerrada de códigos) | `ingeniero-backend` |
| `scripts/bateria/` **(nueva)** | `ejecutar.mjs`, `comprobaciones.mjs`, `entorno-limpio.mjs`, `comprobar-region.mjs`, `comprobar-rama.mjs`, `escanear-secretos.mjs`, `auditar-dependencias.mjs`, `analisis-estatico.mjs`, `instalar-herramientas.mjs`, `herramientas.json`, `reglas-integracion.json`, `scripts-de-instalacion.json`, `gitleaks-informe.tmpl` | `plataforma` |
| `scripts/plataforma/` **(nueva)** | Lanzadores: `lanzador.mjs` (agentes) y `persona.mjs` (persona). Órdenes: `candidato.mjs`, `integrar.mjs`, `aprobar.mjs`, `declarar.mjs`, `sellar.mjs`, `desplegar.mjs`, `comprobar-despliegue.mjs`, `comprobaciones-despliegue.mjs`, `comprobar-inicio.mjs`, `volver-atras.mjs`, `estado.mjs`, `copia.mjs`, `restaurar-copia.mjs`, `purgar-candidato.mjs`, `buscar-valor.mjs`, `huella-dependencias.mjs` | `plataforma` |
| `herramientas/despliegue/` **(nueva)** | `package.json` y `package-lock.json` propios, con la CLI de despliegue como única dependencia | `plataforma` |
| `tests/unit/plataforma/`, `tests/plataforma/` **(nueva la segunda)** | Pruebas de la app base y de los scripts; `inventario-rutas.json`; doble de la CLI de despliegue | `qa`, `ingeniero-backend` |
| `docs/operacion/` **(nueva)** | `GUIA.md`, `REGISTRO.md`, `entornos.md`, `entornos.json`, `firmantes-autorizados`, `excepciones-dependencias.json`, `ordenes/`, `declaraciones/`, `ventana/calendario.md`, `ventana/seguimiento.md` | `plataforma` |
| `.env.example`, `.gitignore` | Se amplían con las variables nuevas | `plataforma` |

No se crean todavía las demás carpetas del esqueleto (`supabase/`, `src/mcp/`, `src/components/`…): llegan con sus funciones. `.github/` no se toca (función 003). Las herramientas descargadas (Gitleaks) y las credenciales de la máquina viven fuera del repositorio, no en una carpeta ignorada dentro de él.

### De dónde sale el código que decide

**Regla.** Las reglas de integración, la lista de firmantes, los verificadores y el código de las órdenes se leen de un commit de `main`. Nunca del candidato ni de la copia de trabajo. El candidato es lo examinado, no quien examina.

| Origen del código | Quién lo usa | Qué es |
| --- | --- | --- |
| **Carpeta de control** | Las órdenes que lanzan los agentes: `candidato`, `integrar`, `bateria`, `desplegar` (preproducción), `volver-atras` (preproducción), `estado`, `comprobar-inicio`, `purgar-candidato` | Extracción temporal de la punta de `main`, en una carpeta nueva fuera del repositorio, hecha en cada ejecución y borrada al terminar, pase lo que pase |
| **Carpeta sellada** | Las órdenes que ejecuta la persona (`aprobar`, `declarar`, `sellar`, `desplegar` y `volver-atras` de producción, `buscar-valor`) y la tarea programada de la copia | Extracción permanente de un commit de `main` que la persona ha sellado, en una carpeta de su perfil, fuera del repositorio |
| Clon del candidato | Nadie, como código de control | Solo aporta lo examinado. Excepción única: si el candidato cambia la batería y lleva firma válida para ese cambio, se usa su batería, que es la que el responsable aprobó |

**Lanzador de los agentes.** Los alias de `package.json` (`npm run integrar`, `npm run desplegar`…) contienen todos la misma línea, que es la forma canónica de la orden:

```
git show main:scripts/plataforma/lanzador.mjs | node --input-type=module - <orden> <argumentos>
```

`lanzador.mjs`, leído así de `main`: resuelve `main` a una huella una sola vez y trabaja con esa huella; extrae a la carpeta de control `scripts/bateria/`, `scripts/plataforma/`, `scripts/comprobar-specs.mjs`, `scripts/patrones-secretos.mjs`, `herramientas/despliegue/` y `docs/operacion/` de ese commit, leyendo los objetos de git uno a uno (no con `git archive`, que obedece a `.gitattributes`); y ejecuta la orden desde ahí con el entorno limpio de «Batería local». Un `integrar.mjs` modificado en la carpeta de trabajo no se ejecuta: se ejecuta el de `main`. Con `-- --propia`, `bateria` usa el código de la copia de trabajo para que `plataforma` pueda probar un cambio de la propia batería; ese resultado se marca y no vale como evidencia.

**Qué resuelve y qué no.** Resuelve el caso del dictamen: un candidato que cambia las reglas o la batería se juzga con las reglas y la batería de `main`, así que sigue siendo reservado y no entra sin firma. No resuelve que alguien mueva `main` a mano hacia un commit con otro lanzador: eso es saltarse el procedimiento, el riesgo que el responsable aceptó hasta la función 003 (`aclaraciones.md`, cuestión 3 d). Para que se detecte está el verificador sellado.

**Carpeta sellada y verificador sellado.** `sellar <commit>` es una orden de la persona. Con el verificador de la carpeta sellada **anterior**, recorre `main` desde el commit sellado anterior hasta el nuevo y exige que cada commit de integración que toque código de control lleve firma válida contra los firmantes de su primer padre. Si todo cuadra, extrae el código de control del commit nuevo a la carpeta sellada. Cada orden de la persona, y la copia diaria, ejecutan antes de nada el verificador sellado sobre `main` desde el último sello hasta la punta. Así, un comprobador rebajado que alguien ponga en `main` sin firma válida no se valida a sí mismo: lo juzga un verificador que no ha podido cambiar por esa vía. Las órdenes de la persona muestran la huella del ancla y la de la clave de aprobaciones, y no siguen hasta que la persona las confirma tecleando sus primeros caracteres contra su copia guardada fuera de la máquina.

**El arranque.** El procedimiento no puede integrarse a sí mismo. Se arranca así:

1. Primer commit de `main` con el arnés, ordenado por el responsable (acto reservado 1).
2. Las tareas del tramo 1 se hacen en la rama `arranque/002`, un commit por tarea con `T-NNN (002): `. Todas son ruta crítica: las revisan el `revisor` y el `auditor-seguridad`. El archivo de firmantes entra aquí, con la parte pública de la clave que el responsable ha creado.
3. Sobre la punta de esa rama se ejecuta la batería en un clon limpio. Es la única vez que un código se juzga a sí mismo, y se anota así. La batería y los dictámenes se guardan en `specs/002-plataforma-base/evidencias/arranque/`.
4. El responsable ordena expresamente mover `main` a ese commit y se crea la etiqueta `integrado/0000`: es **el ancla**, la «primera integración de esta función» del requisito 20. Es una ampliación del acto reservado 1 y se le pide confirmarla (asunto A-12).
5. El responsable firma la aprobación del ancla (un texto con su huella) y extrae la primera carpeta sellada, con las dos órdenes de una línea que el plan transcribe de este diseño aprobado. Anota la huella del ancla y la de su clave en el registro de operación y las guarda fuera de la máquina.
6. Desde ahí, todo commit de `main`, de cualquier chat, entra con `integrar`. La aprobación firmada del ancla entra con la primera integración, y la comprobación 10 la verifica contra los firmantes del ancla.

### Batería local

**Orden única:** `npm run bateria`. Con `-- --historial` añade el escáner de secretos sobre todo el historial. Con `-- --evidencia` guarda el resultado como evidencia.

Se ejecuta en serie. Muestra una línea por comprobación con `SUPERADA`, `FALLIDA` o `NO EJECUTADA`, su duración, el commit, la versión de Node, de dónde salió el código de control y, al final, `RESULTADO GLOBAL` y la duración total. Código de salida 0 solo si todas están `SUPERADA`; cualquier otro caso, 1.

| N.º | Comprobación | Herramienta y orden | Falla si | Tiempo máximo |
| --- | --- | --- | --- | --- |
| Previa | Entorno e instalación | Versión de Node; archivos de configuración no admitidos; `npm ci --ignore-scripts` | Node no es 26.x; falta `package-lock.json`; existe un archivo de la lista de no admitidos; `npm ci` termina con error (bloqueo incoherente con el manifiesto); el archivo de bloqueo cambia tras instalar | 4 min |
| 1 | Tipos | `next typegen` y `tsc --noEmit -p tsconfig.json` (TypeScript 6.0.x) | Cualquier error | 2 min |
| 2 | Estilo | `prettier --check` y `eslint --max-warnings 0`, los dos con su archivo de configuración indicado de forma expresa | Cualquier diferencia de formato o aviso | 2 min |
| 3 | Pruebas automáticas | `vitest run --config vitest.config.ts` | Alguna prueba falla; se ejecutan 0 pruebas; hay alguna prueba saltada (`.skip`, `.only`, `.todo`) | 3 min |
| 4 | Compilación | `next build` | Código de salida distinto de 0 | 4 min |
| 5 | Análisis estático | `eslint --config eslint.seguridad.config.mjs --no-inline-config --format json` | Algún hallazgo de gravedad alta (regla en nivel `error`). Los de nivel `warn` se listan sin bloquear | 2 min |
| 6 | Escáner de secretos | `scripts/patrones-secretos.mjs` y Gitleaks 8.30.1, sobre los archivos versionados y sobre las líneas que añade el cambio respecto de `main`. Con `--historial`, sobre todas las referencias | Cualquier hallazgo; binario ausente o con suma distinta | 2 min (10 con historial) |
| 7 | Escáner de dependencias | Procedencia del archivo de bloqueo; `npm audit --json` y `npm audit signatures`, sobre el árbol de la app y sobre `herramientas/despliegue/` | Algún `resolved` que no empiece por `https://registry.npmjs.org/` o sin `integrity`; alguna vulnerabilidad alta o crítica sin excepción vigente; firma no válida; informe ausente o ilegible | 2 min |
| 8 | Arnés | `node scripts/comprobar-specs.mjs` | Código de salida distinto de 0 | 1 min |
| 9 | Región | `node scripts/bateria/comprobar-region.mjs` | Ver «Comprobación de región» | 1 min |
| 10 | Rama principal | `node scripts/bateria/comprobar-rama.mjs` | Ver «Comprobación de la rama principal» | 2 min |

Las nueve comprobaciones del requisito 5 son la 1 a la 9. La 10 es la del requisito 20. La «previa» no es una comprobación más: es la condición para que las demás signifiquen algo; si falla, las diez se anotan `NO EJECUTADA` y el resultado global es fallido (asunto A-5).

**Duración máxima de una ejecución completa: 15 minutos** (25 con `--historial`). Si se agota, lo que quede se anota `NO EJECUTADA` y el resultado es fallido.

**Cierre en fallo (requisito 51).** Cada comprobación es un proceso hijo con su tiempo máximo. Solo se da por superada si el proceso termina con 0 **y** su salida tiene la forma esperada: informe JSON legible de ESLint y de `npm audit`, al menos una prueba ejecutada, binario de Gitleaks presente y con la suma esperada. Herramienta ausente, interrupción, tiempo agotado, salida ilegible o registro de npm inalcanzable cuentan como fallida.

**Que la batería no se pueda rebajar desde fuera de las rutas reservadas.** Tres medidas, que se suman a la lista de rutas reservadas de «Integración»:

1. **Entorno limpio** (`entorno-limpio.mjs`). Los procesos hijos de la batería y de las órdenes no heredan el entorno del usuario: reciben una lista cerrada. `SystemRoot`, `windir` y `SystemDrive`; `PATH` reducido a la carpeta de `node`, las de `git` y las del sistema; `TEMP` y `TMP` apuntando a la carpeta temporal de la ejecución; `USERPROFILE`, `HOME`, `APPDATA` y `LOCALAPPDATA` apuntando a un **perfil vacío** creado para la ejecución, de modo que `npm`, `git` y la CLI de despliegue no encuentran `.npmrc`, `.gitconfig` ni una sesión guardada; `GIT_CONFIG_NOSYSTEM=1` y `GIT_CONFIG_GLOBAL` apuntando a un archivo vacío; `CI=1`, `NO_COLOR=1` y `NEXT_TELEMETRY_DISABLED=1`. No pasa ninguna otra: ni `NODE_OPTIONS`, ni `GITLEAKS_CONFIG`, ni `npm_config_*`, ni `GIT_*`, ni ninguna credencial.
2. **Configuración indicada de forma expresa.** Cada herramienta recibe su archivo de configuración por argumento y no lo busca: ESLint con `--config`; Prettier con `--config` e `--ignore-path`; Vitest con `--config`; `tsc` con `-p`; Gitleaks con `--config <carpeta de control>/.gitleaks.toml --ignore-gitleaks-allow --gitleaks-ignore-path <carpeta vacía>`; npm con `--registry=https://registry.npmjs.org/`, `--userconfig` y `--globalconfig` apuntando a archivos vacíos.
3. **Archivos de configuración no admitidos.** La previa falla si el árbol contiene alguno de estos, que las herramientas leerían por su cuenta: `.gitleaksignore`, `.npmrc`, `.eslintrc*`, un `eslint.config.*` que no sea uno de los dos del mapa, `prettier.config.*`, un `.prettierrc*` que no sea `.prettierrc.json`, `vitest.workspace.*`, `vite.config.*`, un `tsconfig*.json` que no sea `tsconfig.json`, `vercel.ts`, `.gitmodules`, un enlace simbólico o un submódulo.

Además, `bateria.md` anota cuántas pruebas se ejecutaron. Si un candidato ejecuta menos que la integración anterior, `integrar` lo trata como cambio reservado (tipo `reduccion-de-pruebas`): quitar pruebas es posible, pero con firma.

**Umbrales (requisito 7).**

- Análisis estático. Gravedad alta, bloquea: `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`; de `eslint-plugin-security`, `detect-eval-with-expression`, `detect-child-process`, `detect-non-literal-require`, `detect-unsafe-regex`, `detect-pseudoRandomBytes`, `detect-buffer-noassert`, `detect-new-buffer`, `detect-bidi-characters`; `react/no-danger`; y las reglas del proyecto: leer `process.env` fuera de `src/lib/plataforma/configuracion.ts`; usar `console` fuera de `src/lib/registro/`; declarar `runtime = 'edge'` o `preferredRegion`; un manejador de ruta sin `manejador.ts`; `new Error` con argumento no literal o `throw` de algo que no sea `ErrorDeAplicacion`; `JSON.parse` o `new URL` sobre datos de la petición fuera de `entrada.ts`; e importar el módulo de la clave secreta fuera de su lugar (se activa en la fase 2). Gravedad menor, no bloquea: `detect-object-injection`, `detect-non-literal-fs-filename`, `detect-non-literal-regexp`, `detect-possible-timing-attacks`. `--no-inline-config` hace que un comentario no pueda silenciar una regla.
- Dependencias. Bloquea toda vulnerabilidad `high` o `critical` del informe. Única excepción (requisito 49): que el informe diga que no hay versión corregida **y** exista una entrada vigente en `docs/operacion/excepciones-dependencias.json` con el identificador del aviso, el paquete, la fecha de aceptación, una caducidad no posterior a 30 días y la referencia a la nota del `auditor-seguridad`. Ese archivo es una ruta reservada: su cambio solo entra con la aprobación firmada del responsable, que es su aceptación escrita. Una entrada caducada o con más de 30 días no cuenta. `moderate` y `low` se listan sin bloquear.

**Cadena de suministro (amenaza A-19).** `npm ci` se ejecuta siempre con `--ignore-scripts`: los scripts de instalación de las dependencias no se ejecutan, ni en la batería ni al instalar la CLI de despliegue. Si una dependencia no funciona sin el suyo, se añade con nombre y versión exactos a `scripts-de-instalacion.json` (ruta reservada: con firma) y solo ese se ejecuta, con el entorno limpio. La lista nace vacía; si hace falta alguna entrada se sabe al instalar. La comprobación 7 revisa que cada `resolved` de los dos archivos de bloqueo apunte al registro oficial y lleve `integrity`. `package.json` y `package-lock.json` son ruta crítica: toda dependencia nueva o cambiada pasa por el `auditor-seguridad`. La CLI de despliegue y sus dependencias no comparten árbol con la app.

**Escáner de secretos.**

- Patrones nuevos, en `scripts/patrones-secretos.mjs` y en `.gitleaks.toml`, para las credenciales que introduce esta función y que ni los nueve patrones del proyecto ni las reglas por defecto de Gitleaks reconocen (`verificaciones.md`, 11.6): el token de la plataforma de despliegue (prefijo `vcp_`), el DSN del servicio de supervisión y los nombres de variable de este diseño. La forma exacta del DSN se fija con el primero real, sin escribirlo.
- El secreto de paso de la protección no tiene forma reconocible. Para él y para cualquier credencial ya puesta está la **búsqueda por valor exacto**: `desplegar` busca en su propia salida, antes de escribir la evidencia, los valores que ha manejado, y falla si aparece alguno; y la persona dispone de `buscar-valor`, que lee el valor sin eco, lo busca en todos los objetos del repositorio, las evidencias, las carpetas temporales y la última copia, e imprime solo el número de coincidencias.
- **Salida sin valores (requisito 8).** El escáner imprime el nombre del patrón, el archivo, la línea y, en el historial, el commit. Nunca el valor. La opción `--redact` de Gitleaks solo cubre la salida y los registros, no los informes en archivo (`verificaciones.md`, 11.6): por eso el informe se genera con una plantilla propia (`gitleaks-informe.tmpl`) que solo contiene regla, archivo, línea y commit, se escribe en la carpeta temporal de la ejecución y se borra con ella.
- **Antes de crear el candidato.** `candidato` pasa el escáner sobre los archivos de la tarea antes de escribir ningún objeto en el repositorio. Si hay hallazgo, no hay commit.

**Herramientas fuera de npm.** Solo Gitleaks. `herramientas.json` fija su versión, la suma SHA-256 del paquete de cada sistema (Windows x64 y Linux x64) y la suma del binario ya extraído. `instalar-herramientas.mjs` lo descarga de la publicación oficial y lo deja en una caché fuera del repositorio; la previa lo instala si falta, de modo que un clon limpio no necesita nada más. La suma del binario se comprueba **en cada ejecución**: si no coincide, la comprobación 6 falla.

**Comprobación de región (requisito 9).** Falla si: `vercel.json` no existe; `regions` no es exactamente `["fra1"]`; aparece `functionFailoverRegions` en cualquier nivel; alguna entrada de `functions` declara regiones; `installCommand` no es `npm ci --ignore-scripts` (en la compilación de la plataforma, un script de instalación vería los secretos del entorno); existe `vercel.ts`; existe `proxy.*` o `middleware.*` en la raíz o en `src/` (se ejecutarían en todas las regiones: `verificaciones.md`, 1.2); algún archivo de `src/` declara `runtime = 'edge'` o `preferredRegion`; `desplegar.mjs` pasa `--regions`; o `engines.node` no es `26.x`. Con el plan Pro la plataforma admite hasta cinco regiones y ya no rechaza por sí misma una configuración con varias (`verificaciones.md`, 11.4): esta comprobación pasa a ser la barrera de la configuración, no un refuerzo.

**Evidencia (requisito 13).** Con `--evidencia`, la batería escribe `specs/<función>/evidencias/integracion/<commit>/bateria.md` con los siete campos de `docs/CALIDAD.md` (`prueba: BATERIA`, `revisor: bateria`), la tabla de resultados y duraciones, el número de pruebas ejecutadas y la huella del commit del que salió el código de control. Se niega a escribir «superada» si el clon sobre el que se ejecuta tiene cambios o si su commit no es el indicado. La función sale del mensaje del commit.

**Reutilización en el CI remoto (función 003).** El flujo remoto solo necesita Node 26, el historial completo con sus etiquetas y `npm run bateria`; lee el código de salida. La lista de comprobaciones vive en `comprobaciones.mjs` como datos: la fase 2 añade ahí pgTAP sin tocar el ejecutor.

### Integración en la rama principal

**Vocabulario.** *Candidato* (C): el commit con el cambio de una tarea, hijo directo de la punta de `main`. *Commit de integración* (M): el que entra en `main`; tiene dos padres, la punta anterior de `main` (P, su primer padre) y C, y su contenido es el de C más la carpeta de evidencias de C. *Ancla*: la etiqueta `integrado/0000` (ver «El arranque»).

El problema de «ese mismo commit»: la evidencia de C no puede estar dentro de C, porque cambiaría su huella. Por eso la batería, la revisión y la aprobación se hacen sobre C y viajan en M, que no añade nada más. La comprobación 10 verifica que M y C solo difieren en esa carpeta.

**Mensajes (requisito 2).** C y M empiezan por `T-NNN (FFF): `, donde `FFF` es el número de la función. El autor git de C es el nombre de agente que indica quien lanza `candidato`, de la lista de `.claude/agents/`, con una dirección `@agentes.invalid`. **Es una declaración: nada comprueba que ese agente escribiera el cambio** (asunto A-4).

**Varios chats, una carpeta.** La carpeta compartida está siempre en la rama `trabajo`, que nadie integra ni despliega y que sigue a `main`. `candidato` e `integrar` construyen los commits con un índice temporal, sin tocar los archivos de nadie, y mueven `main` con una actualización condicionada a su valor anterior. Tras integrar, `integrar` lleva `trabajo` y el índice a M y escribe en la carpeta la evidencia de M; no toca ningún otro archivo. Ninguna orden hace `reset --hard`, `checkout` ni `stash` en la carpeta compartida, y `integrar` se niega si la rama sacada es `main` o si `trabajo` no está en la punta de `main`, diciendo cómo repararlo sin tocar archivos. Así un commit hecho por costumbre cae en `trabajo` y no rompe `main`. Un cerrojo en `.git/` impide dos integraciones a la vez. Límite: la unidad es el archivo; dos tareas no pueden repartirse un mismo archivo.

**Archivos de evidencia de cada integración**, en `specs/<función>/evidencias/integracion/<C>/`:

| Archivo | Quién lo escribe | Contenido que se comprueba |
| --- | --- | --- |
| `bateria.md` | La batería, lanzada por `integrar` | `commit` = C, `resultado: superada`, las 10 comprobaciones, número de pruebas |
| `revision.md` | El orquestador del chat, que transcribe literalmente el dictamen del `revisor`. El `revisor` no tiene herramientas de edición, aunque sí terminal | `commit` = C, `revisor: revisor`, distinto del autor declarado de C, `bloqueantes: 0` |
| `dictamen.md` | El orquestador, transcribiendo al `auditor-seguridad`. Obligatorio si C toca una ruta crítica | `commit` = C, `revisor: auditor-seguridad`, `bloqueantes: 0` |
| `aprobacion.md` y `aprobacion.md.sig` | **El responsable**, con `aprobar`. Obligatorios si C es reservado | Firma válida de un firmante autorizado, en el espacio de nombres `aprobacion-cambio`, sobre un texto que nombra C, su árbol y las rutas reservadas que toca |

**Rutas críticas y reservadas.** Listas cerradas en `scripts/bateria/reglas-integracion.json`, que se lee **del primer padre**: de P al integrar y del primer padre de cada M en la comprobación 10.

Críticas (piden dictamen del `auditor-seguridad`): todas las reservadas, y además `scripts/**`, `package.json`, `package-lock.json`, `.env.example`, `src/instrumentation.ts`, `src/lib/plataforma/**`, `src/lib/registro/**`, `docs/referencia/**` y las de las demás funciones según `docs/SEGURIDAD.md`: `src/app/oauth/**`, `src/app/.well-known/**`, `src/lib/oauth/**`, `src/lib/licencias/**`, `src/mcp/**`, `src/app/api/**`, `contratos/**`, `supabase/**`, `src/lib/supabase/**`, `src/lib/stripe/**`, `prompts/**`.

Reservadas (piden aprobación firmada del responsable), por el criterio que las mete en la lista:

| Criterio (artículo 14 y requisito 19) | Rutas |
| --- | --- |
| La constitución y lo que fija quién aprueba y qué se exige | `docs/CONSTITUCION.md`, `docs/CALIDAD.md`, `docs/EQUIPO.md`, `docs/SEGURIDAD.md` |
| Instrucciones, permisos y herramientas que cargan los agentes | `.claude/**` y `CLAUDE.md` y `AGENTS.md` en cualquier carpeta; `.mcp.json` |
| Los límites del agente del cliente (artículo 8) | `docs/INSTALACION-CLIENTE.md`, `docs/adr/0004-limites-en-el-anfitrion.md` y el texto de arranque local en `prompts/**/arranque*` |
| La batería, sus umbrales y lo que la configura | `scripts/bateria/**`, `scripts/plataforma/**`, `scripts/comprobar-specs.mjs`, `scripts/patrones-secretos.mjs`, `eslint.config.mjs`, `eslint.seguridad.config.mjs`, `.prettierrc.json`, `.prettierignore`, `vitest.config.ts`, `tsconfig.json`, `.gitleaks.toml`, `.node-version`, `.gitignore`, cualquier `.gitattributes`, cualquier archivo de la lista de no admitidos, y toda clave de `package.json` que no sea `dependencies` o `devDependencies` |
| El despliegue y la configuración de los entornos | `vercel.json`, `.vercelignore`, `next.config.ts`, `herramientas/despliegue/**` |
| La operación y lo que el responsable declara | `docs/operacion/**`, con las dos salvedades de «Aprobaciones y declaraciones firmadas» |
| El CI, cuando exista | `.github/**` |
| Las puertas P0, P1 y P7 | En cualquier `specs/*/especificacion.md`: que el estado pase a `APROBADA`, `EN CURSO` o `CERRADA`; y cualquier cambio, borrado o renombrado de una especificación cuyo estado en P ya sea `APROBADA` o posterior, porque es una enmienda (asunto A-6) |
| Lo ya respondido por el responsable | En cualquier `specs/*/aclaraciones.md`: modificar o borrar una línea existente |
| Reducción de pruebas | Un candidato que ejecuta menos pruebas que la integración anterior |

**Cómo se comparan las rutas.**

- Se compara P con C usando `git diff --no-renames --name-status`: un renombrado cuenta como borrado de una ruta y alta de otra; borrar una ruta reservada es un cambio reservado; un archivo nuevo en una ruta reservada, también.
- Sin distinguir mayúsculas. Se rechaza un candidato cuyo árbol tenga dos rutas que solo se diferencien en eso, o una ruta con punto o espacio final, que Windows trata como la misma carpeta.
- Se rechaza un candidato que añada un enlace simbólico o un submódulo.
- El estado de una especificación se lee con la misma regla que `scripts/comprobar-specs.mjs` (la línea `Estado:`, sin asteriscos y en mayúsculas), en P y en C. Un archivo nuevo que ya trae `APROBADA` es un cambio reservado. Si la línea falta, hay más de una o no se entiende, el cambio se trata como reservado.
- Ante la duda, reservado.

**Órdenes.**

1. `npm run candidato -- <T-NNN> <FFF> --agente <nombre> <ruta>…` pasa el escáner de secretos sobre esos archivos, crea C con esas rutas sobre la punta de `main` y lo deja en `tarea/FFF-T-NNN`.
2. El orquestador lanza al `revisor` (y al `auditor-seguridad` si toca) con la huella de C y guarda sus dictámenes.
3. Si C es reservado, el responsable ejecuta `aprobar <C>` desde su carpeta sellada.
4. `npm run integrar -- <C>`, que puede lanzar cualquier agente del chat de la fase y que se ejecuta con el código de P:
   1. Comprueba que `main` supera la comprobación 10, que el padre de C es P y el formato del mensaje.
   2. Clasifica C con las reglas de P. Exige la revisión, el dictamen si hay ruta crítica y, si hay ruta reservada, la firma, que se verifica contra los firmantes de P y debe enumerar exactamente las rutas reservadas que la orden ha calculado.
   3. Clona el repositorio en una carpeta temporal, extrae C y ejecuta la batería completa con `--evidencia`. El código de la batería es el de P; el de C solo si C cambia la batería y su firma lo cubre. Así la batería «en verde sobre ese mismo commit» no depende de un archivo que alguien haya escrito antes ni de un verificador que el candidato haya tocado.
   4. Construye M, comprueba que solo añade la carpeta de evidencias de C y pasa sobre ella el escáner de secretos y `comprobar-specs.mjs`.
   5. Mueve `main` a M, crea la etiqueta `integrado/NNNN` siguiente y pone `trabajo` al día.
   6. Si algo falla en cualquier paso, `main` queda como estaba y la orden termina con error diciendo qué faltó. Los clones temporales se borran siempre. Si lo que falló fue el escáner de secretos, borra la rama del candidato e indica la purga (`purgar-candidato`).

Un cambio no reservado que cumple todo entra sin esperar a nadie (requisito 18).

**Comprobación de la rama principal (requisitos 20, 55 y 56).** `comprobar-rama.mjs` falla, nombrando la causa, si:

- no existe `main`;
- no existe `integrado/0000` o no es antepasado de `main`;
- alguna etiqueta `integrado/NNNN` no es antepasado de `main`, no está en su línea de primeros padres o rompe la numeración: un commit integrado ha desaparecido del historial;
- la punta de `main` no es la etiqueta más alta: hay un commit puesto en la rama sin pasar por `integrar`;
- algún commit entre el ancla y la punta no tiene la forma de M, no lleva `T-NNN (FFF)`, no trae `bateria.md` y `revision.md` válidas sobre su C, difiere de C en algo más que su carpeta de evidencias, o le falta el dictamen o la firma que le corresponden **según las reglas y los firmantes de su primer padre**;
- una declaración u orden firmada añadida no verifica en su espacio de nombres, o se ha modificado o borrado una fila de `REGISTRO.md` o una línea de un `aclaraciones.md` sin firma.

Quien quiera añadir un firmante o quitar una ruta de la lista necesita la firma de un firmante que ya lo sea.

Mientras esta comprobación esté en rojo, `integrar` y `desplegar` se niegan a actuar. Resolverlo es el acto reservado 10: lo hace una persona.

**Segunda ancla, fuera del disco.** La copia diaria guarda la lista de etiquetas `integrado/*` con sus commits. Si al día siguiente falta alguna o apunta a otro commit, o el verificador sellado falla, la copia termina con error, **no sobrescribe** las copias anteriores y deja el aviso en su archivo de estado, que `integrar`, `desplegar` y `estado` muestran.

**Secreto en un candidato rechazado (requisitos 3 y 47).** `candidato` ya escanea antes de crear nada. Si aun así un candidato con un secreto llega a existir, no entra en `main`, su rama se borra y `purgar-candidato` elimina sus objetos (`git reflog expire` y `git gc --prune=now`) y comprueba que ya no están. La copia diaria solo incluye `main` y las etiquetas `integrado/*`: un candidato rechazado no sale del disco. El procedimiento está en la guía.

### Aprobaciones y declaraciones firmadas

Es la respuesta a los requisitos 19, 45, 53 y 54: que un texto escrito por un agente no pueda pasar por una aprobación ni por una declaración del responsable.

| Tipo | Espacio de nombres | Dónde queda | Qué autoriza o afirma |
| --- | --- | --- | --- |
| Aprobación de un cambio reservado | `aprobacion-cambio` | Carpeta de evidencias de C | Integrar ese C, con esas rutas |
| Orden de producción | `orden-produccion` | `docs/operacion/ordenes/` | Desplegar ese commit en producción, con fecha anterior al despliegue |
| Declaración o aceptación | `declaracion-operacion` | `docs/operacion/declaraciones/` | Lo que solo el responsable puede afirmar o aceptar |

- **Qué es.** Un archivo pequeño con campos de listas cerradas (tipo, huella del commit cuando aplica, fecha) **firmado** con `ssh-keygen -Y sign` y la clave de aprobaciones del responsable; la firma va al lado, en `.sig`. Cada tipo se verifica en su espacio de nombres: una firma hecha para un tipo no vale para otro. Nada más cuenta: ni una frase en un commit, ni en una evidencia, ni en la salida de una herramienta, ni un archivo sin firma válida.
- **Tipos de declaración** (lista cerrada): `ancla`; `condiciones-inicio`; `calendario-revisado`; `aceptacion-riesgo` (con el asunto y su caducidad); `estado-de-entorno` (plan, solo datos ficticios, dirección no entregada a clientes, valores no repetidos entre entornos, nada servido desde el plan gratuito); `decision-pago` (contrata o no contrata); `retirada-proyectos`.
- **La clave.** Ed25519, creada por el responsable y guardada fuera del repositorio. No se carga nunca en el agente de claves de SSH. La parte pública va en `docs/operacion/firmantes-autorizados`, limitada a los tres espacios de nombres. El responsable guarda su huella fuera de la máquina y la anota en el registro de operación. Si es un archivo con frase de paso o una llave física, y en qué cuenta vive, depende del asunto A-3.
- **Añadir no pide otra firma; cambiar, sí.** Un archivo nuevo en `declaraciones/` u `ordenes/` con firma válida entra por el procedimiento normal sin `aprobacion.md`: su propia firma es la aprobación. Modificar o borrar uno existente es un cambio reservado.
- **`REGISTRO.md` solo crece.** Añadir filas al final no es un cambio reservado; modificar o borrar una fila, sí, y la comprobación 10 lo vigila. Cada fila es de uno de dos tipos: *anotación* (un hecho que un agente o una orden han observado: un despliegue, una comprobación) o *declaración* (algo que afirma o acepta el responsable). Una fila de tipo declaración debe citar un archivo de `declaraciones/` con firma válida; si no, la comprobación 10 falla. Así, «aceptado por el responsable» escrito por un agente no vale (requisito 54).
- **`specs/*/aclaraciones.md`.** Las respuestas literales ya anotadas no se pueden modificar ni borrar sin firma. Anotar una respuesta nueva es añadir líneas, y eso entra sin firma. Lo añadido es una transcripción del orquestador, no una aprobación: lo que la vuelve vinculante es la firma de la puerta que la usa (la aprobación de la especificación o de su enmienda, sobre el commit que contiene las dos). Cambiar la línea de estado de la cabecera cuenta como modificación; se propone a coordinación que la plantilla lleve el estado en una tabla final que solo crezca.
- **El ancla** no se puede firmar dentro del commit que señala: ver «El arranque».

### Órdenes que ejecuta la persona

Lo que la persona teclea —la frase de paso de su clave, el token de producción, un «sí»— no debe acabar en código que un agente haya podido cambiar. Esto es lo que el diseño hace ya, con independencia de lo que se decida en el asunto A-3:

1. **Código sellado.** `aprobar`, `declarar`, `sellar`, `buscar-valor` y el despliegue y la vuelta atrás de producción se ejecutan desde la carpeta sellada, no desde la carpeta de trabajo ni con `npm run`: no pasan por `package.json` (ni por un `preaprobar` o un `predesplegar`), ni por `node_modules`.
2. **Una línea con rutas absolutas.** La persona las lanza con una línea que vacía `NODE_OPTIONS` y llama, por su ruta completa, al `node` instalado y a `persona.mjs` de la carpeta sellada. `persona.mjs` usa `git` y `ssh-keygen` por la ruta absoluta de la instalación de Git para Windows, nunca por el `PATH` (en la máquina hay dos `ssh-keygen`).
3. **Entorno limpio**, el mismo de la batería: sin `NODE_OPTIONS`, `GIT_*`, `npm_config_*` ni perfil de usuario para los procesos hijos.
4. **Git sin atajos.** Estas órdenes no leen archivos de la carpeta de trabajo: leen objetos de commits. Toda llamada lleva `-c core.fsmonitor=false -c core.hooksPath= --no-pager`, y la diferencia que se enseña a la persona se obtiene con `diff --no-ext-diff --no-textconv --text`, de modo que ni `.git/config` (`core.fsmonitor`, `core.pager`, `diff.external`) ni un `.gitattributes` con `-diff` cambian lo que ve.
5. **Solo en terminal interactiva.** Se niegan a ejecutarse sin ella. Es una ayuda, no una barrera.
6. **Confirmar contra lo guardado fuera.** Antes de actuar ejecutan el verificador sellado, muestran la huella del ancla y la de la clave, y piden teclear al menos 12 caracteres de la huella del commit que se aprueba o se despliega.
7. **La frase de paso** la pide `ssh-keygen` directamente en la consola; el script no la lee.
8. **Token de producción de vida mínima.** No se guarda en la máquina. Para cada despliegue en producción el responsable crea en la consola un token limitado al proyecto de producción, con la caducidad más corta que ofrezca, lo teclea sin eco cuando la orden se lo pide y **lo revoca en la consola al terminar**. La orden no acaba hasta que la persona confirma la revocación, y anota en el registro el nombre del token y las horas de creación y de revocación, sin su valor. El secreto de paso de la protección de producción lo crea una persona en la consola, se teclea igual y ninguna orden lo crea ni lo cambia.

**Qué garantiza cada control y qué no.**

| Control | Garantiza | No garantiza |
| --- | --- | --- |
| Reglas, firmantes y verificadores leídos de `main` | Que un candidato no puede cambiar las reglas con las que se le juzga ni la batería que lo examina sin firma | Nada frente a quien mueva `main` a mano: eso se detecta después, no se evita |
| Firma del responsable | Que un cambio reservado integrado por el procedimiento lleva una firma hecha con su clave, para ese commit y esas rutas | Con la cuenta de Windows compartida: que la persona firmara lo que creía ver, o que firmara ella. Un proceso de su misma cuenta puede capturar la frase de paso, copiar la clave o alterar su terminal antes de que arranque el código sellado. Las medidas de arriba **lo dificultan y dejan rastro; no lo impiden** (asunto A-3) |
| Batería ejecutada por `integrar` | Que el candidato pasó las diez comprobaciones en un clon limpio, con la batería de `main`, en el momento de integrarse | Que alguien no haya construido M a mano con un `bateria.md` inventado. Lo descubre volver a ejecutarla: lo hace `qa` al verificar la función y lo hará el CI remoto en cada commit |
| `revision.md` y `dictamen.md` | Que existe un texto de dictamen sobre ese commit, con un nombre de revisor distinto del nombre de autor declarado y sin bloqueantes | Que el autor sea quien se declara, y que el dictamen lo emitiera un agente independiente con el código delante. Las dos cosas son declaradas, no probadas (asunto A-4) |
| Comprobación 10 y etiquetas | Que se detecta un commit fuera del procedimiento, una reescritura o el borrado de la rama, y que nada se integra ni se despliega mientras tanto | Que lo detecte si quien reescribe rehace también las etiquetas y las evidencias y cambia el comprobador de `main` |
| Verificador sellado y segunda ancla en la copia | Que un comprobador rebajado en `main` sin firma válida se detecta en la siguiente orden de la persona o en la siguiente copia, y que una reescritura deja rastro fuera del disco sin destruir las copias anteriores | Con la cuenta compartida, nada si se altera también la carpeta sellada o la de la copia |
| Token de producción tecleado y revocado | Que no hay un token de producción guardado que un agente pueda leer, y que uno capturado sirve unos minutos | Con la cuenta compartida, que no se capture mientras se teclea |

Dicho sin rodeos. Dentro del procedimiento, este diseño **impide** que un candidato entre con una aprobación que no lleve una firma válida, y que cambie las reglas que lo juzgan. Fuera del procedimiento, en un repositorio local y con una sola cuenta de Windows para la persona y los agentes, **no impide** que un proceso que actúe a propósito capture lo que la persona teclea o reescriba la rama: lo dificulta, y deja rastro que se detecta después solo en parte. El responsable aceptó el 12/11/2026 que saltarse el procedimiento se detecte después (cuestión 3 d). Esa aceptación **no cubre** una firma válida obtenida capturando su frase de paso, que ningún control posterior detecta. Cerrar ese hueco exige separar las cuentas; decidir entre eso, una llave física o aceptar el riesgo por escrito es suyo y es condición de la puerta P1 (asunto A-3).

### App base

Next.js 16.4 (App Router), TypeScript, React 19. Sin `proxy.ts`, sin acciones de servidor, sin formularios, sin cookies, sin base de datos. No se usa `create-next-app`: se crea a mano con la estructura del esqueleto, bajo `src/`.

**Inventario de rutas** (lo que debe mostrar la compilación; criterio 17). El inventario vive como datos en `tests/plataforma/inventario-rutas.json`; cada función posterior añade ahí las suyas con su diseño.

| Ruta | Tipo | Métodos | Respuesta |
| --- | --- | --- | --- |
| `/` | Página estática | `GET`, `HEAD` | 200, HTML en español con el nombre del servicio y la frase «Servicio en funcionamiento». Sin enlaces ni formularios |
| `/api/salud` | Manejador dinámico, Node, `fra1` | `GET`, `HEAD` | 200 `{"estado":"ok"}`, o 503 `{"estado":"error"}`. `Cache-Control: no-store` |
| `/api/diagnostico/error` | Manejador dinámico | `GET` | 404 salvo en la dirección propia y protegida del despliegue; allí, 500 `{"estado":"error"}` |
| `/api/diagnostico/error-no-capturado` | Manejador dinámico | `GET` | 404 salvo en la dirección propia y protegida del despliegue; allí lanza un error que nadie captura, con un canario fijo en su mensaje |
| Cualquier otra | Página estática de no encontrado | — | 404, HTML en español: «Página no encontrada» |

Un método de escritura (`POST`, `PUT`, `PATCH`, `DELETE`) recibe 405 en los manejadores (comportamiento documentado de Next.js) y debe recibir 405 o 404, nunca 2xx, en las páginas. Lo segundo no está documentado: lo fija PRUEBA-017. Si la prueba lo desmiente, la tarea vuelve al arquitecto; no se resuelve con `proxy.ts`.

**Comprobación de disponibilidad.** `GET /api/salud` hace tres cosas y nada más:

1. Valida la configuración con `configuracion.ts`: lista cerrada de variables obligatorias y su formato.
2. Comprueba la región: en `preproduccion` y `produccion`, `VERCEL_REGION` es obligatoria y debe valer `fra1`. Si falta o vale otra cosa, falla. No depende de que alguien se acuerde de activar las variables de sistema: sin ellas el entorno no sirve.
3. Responde. El cuerpo tiene un único campo, `estado`, con `ok` o `error`. No lleva versión, commit, región, nombres de variables, fechas ni nada más (requisito 41). La región se observa fuera, en la cabecera `x-vercel-id` que añade la plataforma.

Si falla 1 o 2, responde 503 e informa a la supervisión con un código de la lista cerrada. No lee el cuerpo, la cadena de consulta, las cookies ni las cabeceras de la petición.

**Errores provocados.** Las dos rutas de diagnóstico existen para probar la supervisión, los avisos y los registros en los dos entornos sin dejar una ruta que falle a voluntad de cualquiera. Comparan la cabecera `Host` con la dirección generada del propio despliegue (`VERCEL_URL`, protegida por la plataforma): si no coincide, 404. Es el único dato de la petición que lee la app base; solo se compara con una constante y no se guarda. En `desarrollo` (que solo es válido fuera de la plataforma, ver «Configuración») lanzan siempre. La comprobación posterior de **cada** despliegue confirma que las dos responden 404 en la dirección pública. La segunda ruta lanza un error con un canario fijo (una constante del código, no un valor recibido) sin pasar por `manejador.ts`: sirve para comprobar qué escribe la plataforma cuando un error se escapa (PRUEBA-035).

**Páginas de error (requisito 23).**

- `layout.tsx`: `<html lang="es">`, título y descripción en español.
- `not-found.tsx`: «Página no encontrada» y un enlace al inicio.
- `error.tsx` y `global-error.tsx` (este con su propio `<html lang="es">`): «Se ha producido un error. Inténtalo de nuevo más tarde.» y un botón «Reintentar». No pintan el mensaje del error, su traza ni su identificador.
- Accesibilidad básica: un único `h1`, `role="alert"` en el mensaje de error, contraste suficiente, uso con teclado. El sistema de diseño es de la fase 3.

Límite que se declara: la app base no tiene ninguna página que se genere en cada petición, así que `error.tsx` se prueba como componente (PRUEBA-018), no con un error de servidor real en un entorno. La primera página dinámica (fase 3) añade esa prueba de extremo a extremo.

**Ningún error lleva en su mensaje un valor recibido** (requisitos 40 y 63; regla de diseño para esta función y para todas las que se apoyen en ella):

1. Todo manejador de ruta se crea con `manejador.ts`, que captura cualquier excepción, informa a la supervisión con un código de la lista cerrada y responde 500 `{"estado":"error"}`. El análisis estático bloquea un archivo `route.ts` que exporte un manejador sin él. Única excepción, declarada: la ruta de diagnóstico del error no capturado.
2. El código propio solo lanza `ErrorDeAplicacion(codigo)` (`errores.ts`), con un código de `src/lib/registro/codigos.ts` y sin texto compuesto. El análisis estático bloquea en `src/` un `new Error(...)` cuyo argumento no sea un literal fijo, y un `throw` de cualquier otra cosa.
3. Lo que puede fallar citando su entrada (el mensaje de `JSON.parse` en V8 incluye parte del texto recibido; lo mismo `new URL` y otros analizadores) solo se llama dentro de `entrada.ts`, que captura el fallo y lanza `ErrorDeAplicacion('entrada_invalida')` sin `cause`. El análisis estático bloquea `JSON.parse` y `new URL` sobre datos de la petición fuera de ese archivo. La app base no analiza ninguna entrada; la pieza queda hecha para la función 001.
4. **Guardia de consola.** En `preproduccion` y `produccion`, `register()` de `instrumentation.ts` sustituye `console.error`, `warn`, `log`, `info` y `debug` por una función que escribe solo `{"nivel":"…","codigo":"salida_no_estructurada"}`, sin sus argumentos. Así, lo que Next.js o una librería escriban por la consola al fallar (mensaje y traza) no llega a los registros de la plataforma. `registro.ts` conserva la referencia original y es lo único que escribe.
5. Lo que no cubre la guardia: una escritura directa en la salida de errores que no pase por `console`. Si PRUEBA-035 encuentra el canario del error no capturado en los registros de la plataforma, la tarea vuelve al arquitecto y el hecho se suma al asunto A-1.

**Cabeceras** (en `next.config.ts`, para todas las rutas): `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Robots-Tag: noindex`. `Strict-Transport-Security` la pone la plataforma. La política de contenido completa es de la fase 3 (amenaza A-21).

**Configuración (requisito 66).** `configuracion.ts` es el único archivo que lee `process.env` (lo impone el análisis estático). Lista cerrada; cada función posterior añade las suyas en este mismo archivo:

| Variable | Tipo en la plataforma | Valores o formato | Entornos |
| --- | --- | --- | --- |
| `ENTORNO` | Config | `desarrollo`, `preproduccion`, `produccion` | Todos |
| `SUPERVISION_DSN` | Secret | URL `https` cuyo servidor pertenece a la región de la UE del servicio de supervisión | Preproducción y producción |
| `COMMIT_DESPLEGADO` | La pone `desplegar` en cada despliegue | 7 a 40 caracteres hexadecimales | Preproducción y producción |
| `VERCEL`, `VERCEL_REGION`, `VERCEL_URL` | De sistema; las activa una persona en cada proyecto | Las fija la plataforma | Preproducción y producción |

Cierre en fallo: una variable ausente o con formato no válido nunca se sustituye por un valor por defecto; la comprobación de disponibilidad responde 503 y el despliegue no se promueve. Si existe cualquiera de `VERCEL`, `VERCEL_URL`, `VERCEL_REGION` o `VERCEL_ENV`, el valor `desarrollo` de `ENTORNO` no es válido: dentro de la plataforma solo valen `preproduccion` y `produccion`, y con ellos `SUPERVISION_DSN` y `VERCEL_REGION` son obligatorias.

### Supervisión, disponibilidad y avisos

**Supervisión de errores: Sentry, región de la UE (Fráncfort), plan Developer, con envío propio y sin SDK** (`verificaciones.md`, 2). Un proyecto por entorno, cada uno con su DSN. PROPUESTO hasta que el responsable lo confirme.

Por qué sin SDK: el requisito 40 y la amenaza A-15 piden que no salga ningún valor recibido. Un SDK captura por defecto datos de la petición y obliga a desactivarlos uno a uno, versión tras versión. `supervision.ts` hace lo contrario: solo sabe escribir estos campos, y el `revisor` puede leer en cincuenta líneas todo lo que sale del sistema. La razón es de privacidad, no del plan: se mantiene igual con el plan de pago.

| Campo del evento | Valor |
| --- | --- |
| `event_id`, `timestamp`, `platform` | Aleatorio; momento; `node` |
| `level` | `error` |
| `environment` | `ENTORNO` |
| `release` | `COMMIT_DESPLEGADO` |
| `transaction` y etiqueta `ruta` | La ruta **del archivo** (`context.routePath`, por ejemplo `/api/salud`), nunca la ruta pedida, que lleva la cadena de consulta |
| etiqueta `codigo` | Lista cerrada de `codigos.ts`. Los de esta función: `error_no_controlado`, `configuracion_invalida`, `region_no_permitida`, `diagnostico_provocado`, `entrada_invalida`, `despliegue_fallido`, `comprobacion_posterior_fallida` |
| etiqueta `metodo` | Lista cerrada de métodos HTTP, u `otro` |
| `fingerprint` | `[ruta, codigo]` |

No se envían nunca: mensaje ni traza del error, ruta pedida, cadena de consulta, cabeceras, cookies, cuerpo, dirección IP, nombre del servidor, variables de entorno.

Comportamiento (requisito 65): un envío por error, con 2 segundos de tiempo máximo; si falla, se anota `supervision_no_disponible` en el registro y se descarta. Sin reintentos, sin cola, sin guardar nada para después. Como mucho 20 eventos por minuto y por instancia; el resto se descarta. `onRequestError` espera al envío para que la función no se congele antes; eso solo retrasa, como mucho 2 segundos, las peticiones que ya han fallado.

En la consola del servicio, una persona activa «no almacenar direcciones IP», deja la limpieza de datos por defecto y crea la alerta «se crea una incidencia nueva → correo», sin espera.

**Registro de la aplicación.** `registro.ts` escribe una línea JSON con `nivel`, `codigo` (lista cerrada), `ruta` (del archivo) y `momento`. Va a los registros de ejecución de la plataforma. Es el único lugar con `console` (lo impone el análisis estático).

**Disponibilidad: UptimeRobot, plan gratuito** (`verificaciones.md`, 3). Dos monitores HTTPS sobre `/api/salud`, uno por entorno, **cada 5 minutos**. PROPUESTO.

Las alertas propias de la plataforma existen durante la prueba gratuita (vienen con «Observability Plus», activado por defecto; `verificaciones.md`, 11.3), pero no se usan: dejan de existir o se pagan al terminar la ventana, y una caída de la plataforma no puede avisar de sí misma.

**Avisos (requisito 42).** Al correo que el responsable escribe en cada servicio; no figura en el repositorio.

| Suceso | Quién avisa | Plazo máximo |
| --- | --- | --- |
| Error de servidor nuevo | Supervisión | 15 minutos |
| Pérdida de disponibilidad, incluida una pausa del proyecto, el fin de la prueba gratuita o una región caída | Disponibilidad | 20 minutos |
| Despliegue fallido en preproducción | `desplegar`, que envía un evento a la supervisión con el DSN de avisos de la máquina | 15 minutos |
| Despliegue fallido en producción | La propia orden, a la persona que la ha lanzado | Inmediato |

Lo que no cubre la supervisión de errores: un fallo de la plataforma que no llega al código (función que no arranca, región caída, proyecto en pausa). Lo cubre la comprobación de disponibilidad.

**Dónde se guarda cada cosa (requisito 43).**

| Qué | Dónde | Cuánto |
| --- | --- | --- |
| Eventos de error | Sentry, Fráncfort | 30 días |
| Cuenta, ajustes y claves del servicio de supervisión | Sentry, EE. UU. | Mientras exista la cuenta |
| Registros de compilación | Vercel; ubicación no declarada por el proveedor | Indefinido |
| Registros de ejecución: ruta pedida, **cadena de consulta**, agente de usuario, dirección de origen, método, código, región y lo que escriba `registro.ts` | Vercel; ubicación no declarada: se trata como fuera de la UE | 30 días durante la prueba gratuita, porque «Observability Plus» viene activado; 1 día si se excluye el proyecto o con el plan Pro sin ese complemento (asunto A-1) |
| Resultados de disponibilidad | UptimeRobot; empresa de la UE, alojamiento no verificado | Según el servicio |
| Resultados de la batería y de los despliegues | El repositorio, en `specs/<función>/evidencias/` | Con el repositorio |

### Entornos y credenciales

Los entornos no existen hasta que se confirman las condiciones de inicio (ver «Desarrollo en local y ventana de prueba»).

| | Preproducción | Producción |
| --- | --- | --- |
| Proyecto en la plataforma | Uno propio (nombre propuesto: `nido-pre`) | Uno propio (`nido`) |
| Dirección | `https://pre-nido.<dominio>` | `https://nido.<dominio>` |
| DNS | Un CNAME en Axarnet con el valor que da su proyecto | Ídem, con el del suyo |
| Plan | Prueba gratuita del plan Pro, del 13/11/2026 al 27/11/2026. Después, plan Pro de pago o proyecto retirado. **Nunca el plan gratuito** (requisito 71) | Ídem |
| Funciones | `fra1` como única región configurada; sin conmutación (solo existe en Enterprise) | Ídem |
| Protección de acceso | La de serie: el dominio propio queda público; las direcciones generadas, protegidas | Ídem |
| Límite por dirección | Una regla del cortafuegos de la plataforma sobre `/api/*`, que pone una persona en la consola | Ídem |
| Supervisión | Proyecto y DSN propios | Proyecto y DSN propios |
| Datos | Ficticios | Ninguno |
| Orden de creación | El primero: es donde prueba la función 001 | Después, sin tocar preproducción |

Los dos proyectos despliegan el mismo repositorio y la misma app. En la plataforma, los dos usan su entorno «Production»: quien distingue preproducción de producción es el proyecto y la variable `ENTORNO`, no `VERCEL_ENV`. Ningún proyecto se conecta a un repositorio remoto.

**Decisiones del 12/11/2026 tomadas por las limitaciones del plan gratuito, revisadas con la cuenta en el plan Pro** (`verificaciones.md`, 11):

| Decisión | Qué cambia con el plan Pro | Resultado |
| --- | --- | --- |
| Dos proyectos, uno por entorno | Ya hay entornos personalizados (uno por proyecto), pero los tokens se siguen limitando a un proyecto, no a un entorno | **Se mantiene.** La razón nunca fue el plan: es el requisito 60 |
| Credencial de preproducción limitada a su proyecto, con la duda de si el plan gratuito la ofrecía | La documentación sigue sin decir en qué planes existen esos tokens | **Se mantiene**, y PRUEBA-022 sigue siendo lo primero que se hace en la ventana (asunto A-2) |
| Registros de ejecución de 1 hora, sin exportación | 30 días durante la prueba, porque «Observability Plus» viene activado; 1 día si se excluye el proyecto. La exportación sigue sin estar disponible en la prueba | **Cambia el asunto A-1**, que empeora para la privacidad, y **mejora para la función 001**, que ya tiene de dónde revisar sus tres días |
| No usar entornos personalizados | Disponibles | **Se mantiene**: no resuelven nada que no resuelvan los dos proyectos |
| Vuelta atrás solo al despliegue anterior | Se puede volver a cualquier despliegue que haya servido el dominio | La orden sigue volviendo a N-1, que es lo que pide el requisito 38. Ir más atrás se hace desde la consola y queda en la guía |
| Una sola región, porque el plan no admitía más | El plan admite hasta cinco y ya no rechaza una configuración con varias. La conmutación sigue siendo solo de Enterprise | **Se mantiene `fra1` como única región.** La comprobación 9 y la guardia de `/api/salud` dejan de tener el respaldo del plan |
| No usar las alertas de la plataforma | Existen durante la prueba | **Se mantiene** (ver «Supervisión») |
| Supervisión con envío propio, sin SDK | Nada | **Se mantiene**: es por privacidad |
| Agotar un límite pausaba el proyecto 30 días | Agotar la CPU, la memoria o el millón de invocaciones de la prueba **termina la prueba**; sin método de pago, la cuenta pasa al plan gratuito | **Riesgo nuevo** (amenaza A-22): límite por dirección, revisión diaria del uso y qué hacer si ocurre, en «Qué pasa al terminar» (asunto A-14) |
| Riesgo aceptado de usar el plan gratuito pese a su límite de uso no comercial | El plan gratuito no se usa | **Desaparece** (requisito 71) |

**Por qué dos proyectos.** Es la única forma verificada de cumplir a la vez los requisitos 27 (dirección estable y sin muro), 28 y 59 (nada de producción disponible en preproducción) y 60 (la credencial de preproducción no alcanza producción).

**Credenciales y dónde viven.**

| Credencial | Alcance | Dónde está | Quién la usa |
| --- | --- | --- | --- |
| Token de despliegue de preproducción | Solo el proyecto de preproducción. Caducidad no posterior al fin de la ventana; si se contrata el plan, 90 días como máximo | Un archivo cifrado con la protección de datos de Windows (DPAPI), fuera del repositorio, en el perfil de la cuenta que ejecuta a los agentes. Lo escribe una persona con una línea de la guía que lee el valor sin eco. **No está en ninguna variable de entorno** | `desplegar`, `volver-atras` y `estado`, que lo descifran, lo pasan al proceso de la CLI por su entorno, nunca como argumento, y buscan su valor en toda salida antes de guardarla |
| Identificadores del proyecto y del equipo de cada entorno | No son secretos | `docs/operacion/entornos.json`, ruta reservada, leído de `main` | Ídem. Un agente no puede cambiarlos sin firma |
| DSN de avisos de preproducción | Solo permite enviar eventos | El mismo almacén cifrado | `desplegar` |
| Secreto de paso de la protección, preproducción | Solo ese proyecto | Lo crea una persona en la consola y lo pone en el mismo almacén cifrado | `comprobar-despliegue`, que lo envía en su cabecera con una petición propia |
| Token de despliegue de producción | Solo el proyecto de producción; vida mínima | **No se guarda en la máquina** (ver «Órdenes que ejecuta la persona», punto 8) | Solo el responsable |
| Secreto de paso de la protección, producción | Solo ese proyecto | No se guarda en la máquina: lo custodia el responsable | Solo el responsable |
| Clave de aprobaciones | Firmar aprobaciones, órdenes y declaraciones | Fuera del repositorio; su custodia depende del asunto A-3 | Solo el responsable |

**Cómo se ejecuta la CLI de despliegue.** Siempre desde `desplegar`, `volver-atras` o `estado`; con el entorno limpio y el perfil vacío; con `--global-config` apuntando a una carpeta temporal vacía, para que nunca encuentre una sesión guardada; con el token y los identificadores solo en el entorno de ese proceso hijo. Si la credencial falta o no se puede descifrar, la orden termina con error: no busca otra forma de autenticarse. La guía dice que en esta máquina no se ejecuta nunca `vercel login`. Ninguna orden crea proyectos, tokens ni secretos de paso, ni usa `vercel curl`.

**Cómo se cumple el requisito 60.** La credencial de preproducción es un token limitado a su proyecto: la plataforma deniega cualquier petición a otro proyecto o a un recurso del equipo, también desplegar en el de producción, leer sus variables o crear proyectos (`verificaciones.md`, 1.7 y 11.2). Se demuestra con PRUEBA-022, lo primero que se hace en la ventana: si la cuenta no permite crear ese token, se para y se pregunta (asunto A-2).

**Límite que se declara (requisitos 37 y 4).** El almacén cifrado evita que la credencial aparezca en un volcado del entorno, en un prompt o en una transcripción por descuido. **No impide** que un proceso de la misma cuenta la descifre a propósito: los agentes la usan, así que está a su alcance. El daño posible queda acotado: ese token solo alcanza un proyecto con datos ficticios y caduca con la ventana; pero con él se puede borrar o detener ese proyecto, lo que cortaría la prueba real de la función 001. No se instalan en las sesiones de los agentes el complemento ni el servidor MCP de la plataforma de despliegue, ni ningún conector a las consolas. Las reglas `deny` de `.claude/settings.json` contra las órdenes que vuelcan el entorno son una propuesta para el responsable (`propuestas-diseno/cambios-documentos-compartidos.md`): este diseño no cuenta con ellas.

### Despliegue, comprobación posterior y vuelta atrás

**Orden:** `npm run desplegar -- preproduccion` (agentes, código de `main`) o `desplegar produccion` desde la carpeta sellada (responsable).

Pasos comunes:

0. **Ventana** (cierre en fallo, requisitos 74, 78 y 79). La orden se niega si en `main` no hay una declaración `condiciones-inicio` con firma válida y sus seis condiciones cumplidas; si el calendario que esa declaración sella no es el de `main`; si hay una declaración `retirada-proyectos` posterior; o si la fecha es posterior al fin de la ventana y no hay una declaración `decision-pago` que diga «contrata». Un texto que afirme la confirmación, sin firma, no cuenta.
1. **Condiciones:** la comprobación 10 en verde; el commit que se va a desplegar es un M de `main` con su `bateria.md` superada; Node 26.
2. **Cerrojo por entorno** en `.git/`, el mismo para `desplegar` y para `volver-atras`. Una segunda orden sobre el mismo entorno espera a que termine la primera.
3. **No retroceder.** La orden pregunta a la plataforma qué commit sirve el entorno. Si es posterior al que se pide, termina sin desplegar y lo dice. **Si no puede saberlo, no despliega.** El primer despliegue de un proyecto se reconoce porque la plataforma responde que no tiene ninguno, no porque no responda.
4. **Exportar** el commit a una carpeta temporal, leyendo sus objetos (sin `git archive`, sin `.git` y sin archivos no versionados), y comprobar que lo exportado es exactamente el árbol del commit. Se despliega esa carpeta. Es la «copia de trabajo sin cambios pendientes» del requisito 34 (asunto A-5).
5. **Desplegar sin servir:** `vercel deploy --prod --skip-domain --yes`, con el commit en los metadatos y en `COMMIT_DESPLEGADO`. La plataforma compila con Node 26 y `npm ci`; la orden de compilación imprime antes la huella del archivo de bloqueo y del árbol instalado (criterio 19). Si la compilación falla, la orden termina con error y el dominio sigue sirviendo lo anterior.
6. **Comprobar en el propio entorno**, sobre la dirección protegida del despliegue nuevo. Las comprobaciones son datos, en `comprobaciones-despliegue.mjs`; cada función posterior añade las suyas con su diseño. Las de esta:
   - `GET /api/salud`, 3 veces: 200, cuerpo exactamente `{"estado":"ok"}`, menos de 3 segundos;
   - la cabecera `x-vercel-id` indica ejecución en `fra1` en las tres;
   - `GET /`: 200, `lang="es"` y las cabeceras del diseño;
   - una ruta inexistente: 404 en español;
   - `POST /api/salud`: 405.
7. **Promover:** `vercel promote`. Es instantáneo y no compila.
8. **Comprobar la dirección estable:** lo mismo que en 6, más que HTTP sin cifrar responde 308 sin contenido, que las dos rutas de diagnóstico responden 404 y que el despliegue que sirve el dominio es el nuevo. Si falla, vuelta atrás automática y aviso.
9. **Evidencia** en `specs/<función>/evidencias/despliegues/`, con los siete campos, el identificador del despliegue, las huellas de dependencias y el resultado de cada comprobación. Antes de escribirla, la orden busca en ella los valores de las credenciales que ha manejado y falla si aparece alguno.

Si falla 5 o 6, el despliegue nuevo nunca llega a servir (requisito 61).

**Preproducción (requisito 35).** La lanza un agente, sin persona. Mientras corren los días programados de la prueba real de la función 001, en preproducción solo se despliega para corregir un defecto del conector o para una prueba que no llega a servir (ver el calendario).

**Producción (requisitos 36 y 58).** La lanza el responsable desde su carpeta sellada. La orden:

- aplica las medidas de «Órdenes que ejecuta la persona»;
- exige que el commit sea el que sirve preproducción y que su comprobación posterior conste superada;
- enseña el commit, pide teclear 12 caracteres de su huella y crea la **orden de producción**, firmada en su espacio de nombres: es el acto expreso, con fecha anterior al despliegue;
- pide el token de producción y el secreto de paso sin eco, sigue los pasos comunes y no termina hasta que la persona confirma que ha revocado el token.

Qué separa a un agente de un despliegue en producción: no tiene el token, que no está guardado en ningún sitio, ni la clave de firma. La comprobación de la terminal es una ayuda. Con la cuenta compartida, un proceso que actúe a propósito podría capturar el token mientras se teclea y usarlo los minutos que viva: es el mismo límite del asunto A-3. Durante la fase 1, producción no tiene datos, licencias ni clientes.

**Dos despliegues a la vez (requisito 62).** El cerrojo los pone en fila; la regla de no retroceder hace que, sea cual sea el orden, el entorno termine en el commit más reciente. La plataforma, por su parte, solo admite una promoción a la vez por proyecto.

**Qué commit sirve cada entorno (requisito 33).** `npm run estado -- <entorno>` pregunta a la plataforma y muestra el commit, el identificador y la fecha del despliegue que sirve el dominio, además del estado de la última copia y de la ventana. En preproducción lo usa cualquier agente; en producción, el responsable, o lo mira en la consola.

**Vuelta atrás (requisito 38).** `volver-atras <entorno>` toma el cerrojo, ejecuta `vercel rollback`, que reasigna el dominio al despliegue anterior sin compilar, y después la comprobación de la dirección estable. No ejecuta la batería ni instala nada más que la CLI. **Tiempo máximo: 10 minutos** desde que se lanza hasta la comprobación en verde. Alternativa sin esta máquina, descrita en la guía: «Instant Rollback» en la consola del proyecto. El despliegue restaurado conserva las variables con las que se compiló; el siguiente `desplegar` restablece el funcionamiento normal al promover.

### Desarrollo en local y ventana de prueba

**En local, antes del primer despliegue (requisito 72).** Se construye y se prueba todo lo que no necesita una dirección pública. Las órdenes de despliegue y de vuelta atrás se prueban contra un **doble de la CLI** (`tests/plataforma/`): un programa que ocupa su lugar, anota con qué argumentos y entorno se le llama y responde lo que la prueba le indica. Con él se demuestra, sin llamar a la plataforma, que la orden se niega cuando debe, que no pasa la credencial por argumento, que no retrocede, que respeta el cerrojo y que no promueve si la comprobación falla.

**Qué criterios se superan dónde.** Es la lista que pide el criterio 44; el plan la repite por tareas.

| Dónde | Criterios |
| --- | --- |
| En local, exigibles antes del primer despliegue | 1, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 18, 26, 44; y la parte local de 9 (todo menos la salida de un despliegue), 17 (inventario y métodos), 22 (lista de nombres), 29 (negativas de la orden), 39 (los diez apartados de la guía), 41 (verificaciones anteriores al primer uso) y 45 (la orden se niega sin la confirmación) |
| En la ventana, con un entorno desplegado | 19, 20, 21, 23, 24, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 46, 47; y la parte de entorno de 9, 17, 22, 29, 39 y 45 |
| Continuos, se comprueban al cerrar la función | 2, 3, 12, 25, 40, 42, 43. Antes del primer despliegue se comprueba su estado hasta esa fecha |

Leer así el criterio 44 (los que se evalúan al cerrar no se pueden «superar antes») es una propuesta: asunto A-14.

**Condiciones de inicio (requisitos 74 y 78).** Dentro de la ventana no se crea ningún proyecto ni se despliega nada hasta que el responsable confirma las seis, una por una:

| N.º | Condición | Cómo se comprueba |
| --- | --- | --- |
| 1 | Criterios locales de esta función superados | `comprobar-inicio` busca en `main` la evidencia superada de cada prueba local de la tabla anterior y lista las que falten |
| 2 | Pruebas automáticas de la función 001 en verde en la batería y su ciclo completo hecho en local | `comprobar-inicio`: batería en verde sobre la punta de `main` con las pruebas de la 001 dentro, y evidencia del ciclo local en su carpeta (su criterio 47) |
| 3 | Guion de la prueba real escrito | `comprobar-inicio`: el archivo existe en `main`, con fecha |
| 4 | Cuentas de prueba de los asistentes y buzón de pruebas preparados | Solo lo sabe el responsable: lo declara |
| 5 | Dominio principal y acceso a su DNS disponibles | El responsable lo declara; `<dominio>` consta ya en `entornos.json` |
| 6 | Calendario de lo que queda de ventana escrito | `docs/operacion/ventana/calendario.md` existe en `main` |

`npm run comprobar-inicio` prepara el borrador con lo que se puede comprobar y deja señalado lo que solo puede declarar la persona. El responsable ejecuta `declarar condiciones-inicio` desde su carpeta sellada: la orden le enseña las seis, le pide confirmar cada una y firma una declaración con las fechas de la ventana (13/11/2026 a 27/11/2026), el estado de cada condición, la huella de `main` y la huella del calendario. Esa declaración se integra en `main` y se anota en el registro de operación. **Sin ella, `desplegar` se niega** (paso 0), y como ninguna orden crea proyectos ni cuentas y el token de preproducción no puede hacerlo, un agente no tiene con qué adelantarse. Crear los proyectos, activar otra prueba gratuita o cambiar de cuenta son actos de una persona (acto reservado 2).

**Calendario (requisito 75).** Se escribe antes del primer despliegue, día a día, en `docs/operacion/ventana/calendario.md`, y no cambia: si hay que cambiarlo, el responsable firma una declaración `calendario-revisado`. Lo que va ocurriendo se anota en `seguimiento.md`, que solo crece: cada elemento, también los de las fases 2 y 4, termina como hecho, no ejecutado o trasladado, con su fecha (criterio 46).

La ventana tiene 14 días útiles, del 13 al 26 de noviembre; el 27 es para la decisión y, si toca, la retirada. Las reservas mínimas del requisito 75 suman 10 días:

| Reserva | Días | Con el primer despliegue el 17/11 |
| --- | --- | --- |
| Preparación de preproducción y verificación de lo que la 001 necesita | 1 | 17/11 |
| Prueba real de la 001: tres días de ejecuciones programadas | 3 | 18 a 20/11 |
| Un reinicio completo de esos tres días | 3 | 21 a 23/11 |
| Día de repetición sin buzón | 1 | 24/11 |
| Margen | 2 | 25 y 26/11 |
| Decisión sobre el pago y, si no se contrata, retirada | — | 27/11 |

**El plan completo solo cabe si el primer despliegue es el 17/11/2026 o antes.** Desde hoy quedan cuatro días para el arranque, lo local de esta función y el conector completo de la 001 en local. Si se empieza más tarde, propuesta de qué se recorta, para que el responsable la apruebe (requisito 75):

| Primer despliegue | Qué cabe | Qué se pierde |
| --- | --- | --- |
| 18/11 | Todo, con un día de margen | Un día de margen |
| 19/11 | Todo, sin margen | El margen |
| 20/11 | Los tres días y su reinicio | El margen y el día sin buzón, salvo que no haga falta el reinicio |
| 21/11 o 22/11 | Los tres días, con dos o un día de margen | El reinicio completo: un fallo del conector lo decide el responsable (requisito 73 de la 001) |
| 23/11 | Los tres días justos | Todo lo demás |
| 24/11 o después | Alta, activación y revisión en conversación | Los tres días programados: no se empiezan. Quedan para después de decidir el pago |

**Dónde va la verificación de esta función sin estorbar a la 001.**

- **Antes de que empiecen los días programados** (día de preparación, con la app base y antes de desplegar el conector): PRUEBA-022 en lo que alcanza con un proyecto, región, protección, y las pruebas que dejan preproducción sin servicio o cambian lo que sirve: avisos con el entorno detenido (criterio 38), supervisión inalcanzable (36), rotación de un secreto (27), dos despliegues a la vez (32), vuelta atrás (33).
- **Durante los días programados, en preproducción, solo lo que no llega a servir:** despliegues con la compilación rota, sin una variable o que no superan la comprobación (criterios 24 y 28). No interrumpen nada: el entorno sigue en su versión.
- **Durante los días programados, en producción,** que nadie usa: creación del proyecto, DNS, orden de producción, resto de PRUEBA-022, vuelta atrás, supervisión y avisos de producción.
- **En los días de margen:** lo que haya quedado, y lo de las fases 2 y 4 que dependa de la plataforma (requisito 76), sin desplazar las reservas.

**Vigilancia del uso.** La prueba gratuita termina antes de tiempo si se agota su CPU, su memoria o su millón de invocaciones. Uso previsto: menos de 30 000 invocaciones (`verificaciones.md`, 1.11). Medidas: la regla de límite por dirección de cada proyecto; el responsable mira el uso en la consola cada día de la ventana y lo anota en `seguimiento.md`; y la comprobación de disponibilidad avisa si un entorno deja de responder (requisito 69).

**Qué pasa al terminar (requisitos 77 y 79).**

- **Como muy tarde el 26/11/2026**, el responsable firma una declaración `decision-pago`.
- **Si contrata:** añade el método de pago en la consola antes del fin de la prueba; los entornos siguen como están; `desplegar` vuelve a aceptar fechas posteriores al 27/11 gracias a esa declaración. Se anota el plan.
- **Si no contrata:** antes de que acabe la prueba, una persona borra los dos proyectos en la consola, quita los dos CNAME en Axarnet, revoca los tokens, borra el almacén cifrado de la máquina y detiene los monitores. Un agente comprueba desde fuera que una petición a cada dirección ya no recibe la app (2 de 2). El responsable firma `retirada-proyectos`. Desde ese momento `desplegar` se niega. El código y las evidencias siguen en el repositorio. Si no se hiciera, al acabar la prueba la cuenta pasaría sola al plan gratuito con los proyectos dentro: es justo lo que el requisito 71 prohíbe.
- **Si la ventana se agota antes** (por fecha o por uso) sin terminar la prueba real o la verificación: se para. Lo que quedó sin probar se anota como «no ejecutado» en `seguimiento.md` y en la verificación de la función, no como superado. No se abre otra prueba ni se cambia de cuenta. El responsable decide entre contratar o cerrar con lo probado.
- **Si las condiciones de inicio no llegan a cumplirse dentro de la ventana:** no se crea ningún proyecto, y los criterios de entorno quedan «no ejecutados» hasta que el responsable decida el pago.

### Copia diaria del repositorio

- **Qué:** `git bundle create` con `main` y las etiquetas `integrado/*`, verificado con `git bundle verify`, en `<carpeta de copia>\repositorio-AAAAMMDD.bundle`, más un archivo de estado con la fecha, la punta de `main` y la lista de etiquetas. Se conservan las 14 últimas. No incluye las ramas de candidatos: el trabajo sin integrar no se copia (asunto A-5).
- **Cuándo:** una tarea programada de Windows, diaria, registrada por una persona con `Register-ScheduledTask` y el ajuste de ejecutarse al encender si a su hora el equipo estaba apagado. Ejecuta `copia.mjs` **desde la carpeta sellada**, no desde la carpeta de trabajo: un cambio sin integrar no pone código a ejecutarse cada día. No necesita ningún secreto.
- **Cierre en fallo:** si la carpeta no está disponible, la verificación falla, el verificador sellado falla o una etiqueta de la copia anterior ha desaparecido o cambiado, termina con error, no borra nada y deja el estado «fallida».
- **Restauración:** `npm run copia:restaurar -- <carpeta nueva>` verifica la copia, la clona, comprueba que la punta de `main` es la anotada y ejecuta allí la batería.
- **No incluye**, a propósito: `.env.local`, `node_modules`, ganchos, configuración local ni candidatos sin integrar.

### Guía y registro de operación

Toda la carpeta `docs/operacion/` es ruta reservada: la persona copia órdenes de la guía y los agentes no pueden cambiarlas sin firma.

**`GUIA.md`**, sin secretos, con los diez apartados del requisito 44 en este orden:

1. Entornos, direcciones y planes; la ventana de prueba y qué pasa al terminar; servicios que hay que pasar a pago antes de la versión distribuible (plataforma de despliegue, Supabase, Sentry y, si se mantiene, la comprobación de disponibilidad).
2. Cómo se ejecuta la batería y cómo se lee su resultado.
3. Cómo se integra un cambio; qué hacer si la comprobación de la rama falla; cómo purgar un candidato rechazado.
4. Cómo se despliega en cada entorno; las condiciones de inicio.
5. Qué hacer si un despliegue falla.
6. Cómo volver atrás, con la orden y desde la consola.
7. Cómo rotar cada secreto; cómo poner, rotar y retirar las credenciales de la máquina; cómo crear y custodiar la clave de aprobaciones; cómo sellar; que en esta máquina no se ejecuta `vercel login`.
8. Cómo se hace y se restaura la copia del repositorio.
9. A quién llegan los avisos y qué significa cada uno.
10. Actos reservados a una persona, con la línea exacta de cada orden de la persona.

**`entornos.md` y `entornos.json`**: la lista de variables por entorno, solo nombres, que debe coincidir con `.env.example` (criterio 22), y los identificadores no secretos de cada proyecto.

**`REGISTRO.md`**: una tabla que solo crece. Columnas: fecha y hora; tipo (anotación o declaración); acto (número de la lista de la especificación); entorno; quién lo hizo; qué se hizo, sin valores; cómo se comprobó; quién lo comprobó, distinto de quien lo hizo; referencia a la evidencia o a la declaración firmada. Las anotaciones las añaden las órdenes y el agente `plataforma`, y entran en `main` por `integrar` como cualquier cambio, con la tarea de operación que fije el plan. Las declaraciones solo valen con su archivo firmado.

## Contratos

Ninguno nuevo en `contratos/` y ninguno modificado: esta función no cambia la forma de ninguna herramienta ni del informe.

Tres formas quedan fijadas aquí, con listas cerradas, y se prueban: la respuesta de `/api/salud` (un campo, dos valores), el evento de supervisión (tabla de arriba) y la línea de registro (cuatro campos). Ninguna entrada acepta un identificador de cliente; la app base no acepta entradas.

## Datos

No hay tablas, políticas ni migraciones. Esta función no crea proyectos de base de datos (requisito 70). No se ha necesitado `docs/MODELO-DATOS.sql`.

Lo que se guarda son archivos del repositorio (evidencias, registro de operación, órdenes y declaraciones firmadas) y, fuera de él, la copia y la carpeta sellada de la persona. La vuelta atrás que aplica es la del despliegue.

Sobre `nido-desarrollo`: lo crea el responsable desde la consola, como excepción puntual al requisito 70 anotada en `aclaraciones.md`. Para el criterio 42 se anota en el registro de operación con esa referencia, y el responsable declara que la contraseña y las claves no están en el repositorio, los registros ni las evidencias.

## Flujo

### Integrar un cambio

1. El ingeniero implementa la tarea con su prueba. `candidato` escanea los archivos y crea C.
2. El orquestador encarga la revisión sobre C y guarda el dictamen. Con hallazgos bloqueantes, se corrige y hay un C nuevo: la revisión del anterior ya no vale.
3. Si es reservado, se detiene y pide al responsable que ejecute `aprobar` desde su carpeta sellada. Sin firma no sigue.
4. `integrar`, con el código de `main`, ejecuta la batería en un clon limpio. En rojo: no se integra, se muestra qué comprobación falló y se vuelve a 1.
5. En verde: M entra en `main` con su etiqueta.
6. Si el cambio tocó código de control, el responsable sella el commit nuevo cuando le convenga; hasta entonces sus órdenes siguen usando el sello anterior, que es válido.

### Desplegar

Antes de nada, una sola vez: condiciones de inicio confirmadas y firmadas, y proyectos creados por una persona.

Preproducción: tras integrar, un agente lanza `desplegar -- preproduccion`. Compilación rota o comprobación fallida: el entorno sigue en la versión anterior, sale un aviso y se vuelve al ciclo de integración con la corrección.

Producción: el responsable decide, crea el token, lanza la orden desde su carpeta sellada, firma, teclea el token y lo revoca. Si falla, la propia orden se lo dice y producción sigue como estaba.

### Cuando algo falla

| Fallo | Qué ocurre |
| --- | --- |
| Una herramienta de la batería no está, se cuelga o no llega a su servicio | Esa comprobación cuenta como fallida; no se integra |
| La comprobación de la rama o el verificador sellado fallan | No se integra ni se despliega nada. Lo resuelve una persona (acto 10) y lo anota |
| Falta la confirmación firmada de las condiciones de inicio, o la ventana ha terminado sin decisión de pago | `desplegar` se niega |
| Falta la credencial de preproducción o no se puede descifrar | `desplegar` termina con error; no usa ninguna sesión guardada |
| No se puede saber qué commit sirve el entorno | `desplegar` y `volver-atras` no actúan |
| Falta una variable o su formato no vale | `/api/salud` responde 503; el despliegue no se promueve |
| La configuración llevaría las funciones fuera de `fra1` | La batería falla antes; si aun así ocurriera, `/api/salud` responde 503, el despliegue no se promueve y, si ya servía, la disponibilidad avisa |
| `fra1` no está disponible | No hay conmutación: las funciones dejan de responder en vez de ejecutarse fuera de la UE; la disponibilidad avisa |
| La supervisión no responde | La app sigue sirviendo; el evento se descarta |
| La plataforma pausa el proyecto o termina la prueba gratuita antes de tiempo | El dominio deja de responder bien; la disponibilidad avisa. No se abre otra prueba ni se cambia de cuenta: decide el responsable (requisitos 69 y 79) |
| La carpeta de la copia no está | La copia de ese día falla y lo deja anotado; las anteriores se conservan |
| Un candidato lleva un secreto | No se integra; se borra su rama y se purgan sus objetos; si el valor era real, se rota |
| Se filtra una credencial | Se revoca en la consola, se crea otra, se sustituye en la máquina o en el entorno y se anota. Procedimiento en la guía, apartado 7 |

### Qué hace una persona y qué hace un agente

| Paso | Persona | Agente | Cómo se comprueba, sin secretos |
| --- | --- | --- | --- |
| Primer commit, arranque y ancla | Los ordena; firma el ancla; anota su huella | El chat al que se lo ordene los ejecuta | Las órdenes de la persona muestran el ancla y exigen confirmarla contra lo anotado |
| Clave de aprobaciones y carpeta sellada | La crea, la custodia y sella | Prepara la guía | La huella pública del archivo de firmantes coincide con la anotada; una firma de prueba se verifica en cada espacio de nombres |
| Confirmar las condiciones de inicio | Las confirma una por una y firma | `comprobar-inicio` prepara el borrador | Declaración firmada en `main`; sin ella `desplegar` se niega |
| Cuentas y proyectos | Los crea, después de confirmar las condiciones | Explica qué crear y con qué ajustes | El agente observa desde fuera: el dominio responde, la región es `fra1`, la protección actúa en la dirección generada |
| DNS en Axarnet | Crea los dos CNAME | Indica qué registros | Consulta DNS pública de los dos nombres |
| Variables de cada entorno | Pone los valores y marca los secretos | Entrega la lista de nombres | `/api/salud` responde 200 en cada entorno; declaración firmada de que ningún valor se repite |
| Credencial de preproducción en la máquina | La crea limitada al proyecto y la guarda cifrada | — | PRUEBA-022 y PRUEBA-046. La persona busca el valor con `buscar-valor` y anota «0 coincidencias» |
| Batería, candidato, revisión, integración | — | Todo | Evidencias y comprobación 10 |
| Aprobar un cambio reservado | Ejecuta `aprobar` y firma | Prepara el cambio y lo explica | Firma verificada por `integrar` y por la comprobación 10 |
| Desplegar en preproducción | — | Lanza la orden | Evidencia del despliegue; `estado` |
| Desplegar en producción | Crea el token, lanza la orden, firma, teclea y revoca | Prepara el commit en preproducción | Orden firmada con fecha anterior; evidencia; `estado`; anotación de la revocación |
| Volver atrás | En producción | En preproducción | Tiempo medido; `estado` muestra el commit anterior |
| Rotar un secreto | Cambia el valor | Despliega de nuevo en preproducción y comprueba | `/api/salud` en verde con el valor nuevo; el antiguo deja de valer donde se pueda observar |
| Supervisión, disponibilidad y límite por dirección | Crea proyectos, monitores, alertas y reglas, y pone su correo | Provoca el error y la caída de prueba en preproducción | Declaración con la hora de cada aviso recibido |
| Vigilar el uso de la prueba gratuita | Lo mira cada día en la consola | Lo anota en `seguimiento.md` con lo que la persona le dice | Anotación diaria |
| Tarea programada de la copia | La registra | Entrega la orden exacta | Existe una copia de hoy; `estado` la muestra |
| Resolver un fallo de la rama | Decide y actúa | Informa de la causa | Anotación en el registro; la comprobación 10 vuelve a verde |
| Aceptar un riesgo | Firma la declaración | Lo describe | Declaración `aceptacion-riesgo` firmada, con caducidad |
| Decidir el pago; retirar los proyectos | Decide, firma y, si toca, los borra | Comprueba desde fuera que las direcciones ya no sirven la app | Declaraciones `decision-pago` y `retirada-proyectos` |

Lo que solo puede declarar la persona, porque ningún tercero puede observarlo (que dos valores secretos no se repiten, lo que muestra una consola), lleva su declaración firmada y se anota como declarado, no como comprobado por otro.

## Valores que fija este diseño

| Valor | Fijado en | Requisito |
| --- | --- | --- |
| Duración máxima de la batería | 15 minutos (25 con historial completo) | 12 |
| Tiempo máximo de vuelta atrás | 10 minutos | 38 |
| Frecuencia de la comprobación de disponibilidad | Cada 5 minutos | 41 |
| Plazo del aviso de un error nuevo | 15 minutos | 42 |
| Plazo del aviso de una pérdida de disponibilidad | 20 minutos | 42, 69 |
| Tiempo de respuesta de `/api/salud` con la supervisión inalcanzable | 3 segundos | 65 |
| Tiempo máximo de un envío a la supervisión | 2 segundos | 65 |
| Caducidad del token de despliegue de preproducción | No posterior al fin de la ventana; 90 días como máximo con plan contratado | 32, 37 |
| Vida del token de despliegue de producción | La caducidad más corta que ofrezca la consola, y revocado al terminar cada despliegue | 37 |
| Límite por dirección en `/api/*` | 100 peticiones por minuto y dirección de origen; lo ajusta el diseño de la 001 si su prueba lo necesita | 69 |
| Caracteres de la huella que se teclean al aprobar o desplegar | 12 como mínimo | 19, 36 |
| Copias conservadas | 14 | 4 |
| Último día para el primer despliegue con el plan completo | 17/11/2026 | 75 |
| Último día para firmar la decisión sobre el pago | 26/11/2026 | 77 |

## Amenazas de esta función

Rehecha con el dictamen de la primera vuelta; pendiente de la segunda. Las amenazas de `docs/SEGURIDAD.md` que aplican son A-15, A-16, A-19, A-20 y A-22. Donde el control no basta, la tabla lo dice y remite al asunto que lo decide.

| Amenaza | Control | Prueba que lo demuestra |
| --- | --- | --- |
| Un secreto entra en el repositorio o queda en su historial (A-20) | Escáner antes de crear el candidato; comprobación 6 con la configuración de `main`, sin `gitleaks:allow` ni `.gitleaksignore`; patrones de las credenciales nuevas; `.env*` ignorado; salida sin valores. El gancho de Claude Code solo vigila lo que se escribe con las herramientas de edición, no lo que se escribe desde la terminal: es una ayuda y este diseño no cuenta con él | PRUEBA-004, PRUEBA-014, PRUEBA-044, PRUEBA-048 |
| El secreto de un candidato rechazado sobrevive en los objetos del repositorio, en una carpeta temporal o en la copia | Purga del candidato; copia solo con `main` y sus etiquetas; informe de Gitleaks con plantilla sin valor; temporales borrados siempre | PRUEBA-047 |
| Dependencia vulnerable, o instalada fuera del archivo de bloqueo (A-19) | `npm ci` en la batería y en el despliegue; comprobación 7; excepción firmada y con caducidad | PRUEBA-006, PRUEBA-026 |
| Un script de instalación lee una credencial; un paquete viene de otro origen | `--ignore-scripts`; entorno limpio; procedencia de cada `resolved`; la CLI de despliegue en su propio árbol; dependencias como ruta crítica | PRUEBA-045 |
| Binario de una herramienta sustituido | Versión y sumas fijadas en el repositorio; la del binario, comprobada en cada ejecución | PRUEBA-007, PRUEBA-054 |
| Una comprobación que no se ejecuta pasa por superada | Cierre en fallo: código de salida y forma de la salida | PRUEBA-007 |
| Un cambio entra sin batería, sin revisión, sin evidencia, o modificado después de revisarse | `integrar` y comprobación 10, todo ligado a la huella del candidato | PRUEBA-009, PRUEBA-011 |
| Un candidato cambia las reglas, los firmantes, la batería o las órdenes que lo juzgan | Se leen de `main` (del primer padre); lanzador; la batería del candidato solo vale con firma | PRUEBA-041 |
| La batería se rebaja con un archivo no reservado o con el entorno | Configuraciones reservadas e indicadas de forma expresa; archivos no admitidos; entorno limpio; recuento de pruebas | PRUEBA-044 |
| Una ruta reservada se esquiva con mayúsculas, un renombrado, un borrado, un archivo nuevo o el formato de la línea de estado | Comparación sin mayúsculas, sin renombrados, con altas y bajas; ante la duda, reservado | PRUEBA-043 |
| Los límites del agente, `CLAUDE.md`, `AGENTS.md` o las herramientas de los agentes cambian sin firma | Están en la lista de reservadas | PRUEBA-043 |
| Un agente da por aprobado un cambio reservado, o un texto afirma que el responsable aprobó (A-16) | Solo cuenta una firma válida, en su espacio de nombres, sobre ese commit y esas rutas | PRUEBA-010, PRUEBA-012 |
| Una declaración del responsable, el registro, unas aclaraciones o la guía se falsifican | Declaraciones firmadas; registro y aclaraciones que solo crecen; `docs/operacion/` reservada | PRUEBA-049 |
| Lo que teclea la persona lo captura código cambiado, `NODE_OPTIONS`, `.git/config`, `.gitattributes` o el `PATH` | Las ocho medidas de «Órdenes que ejecuta la persona». **Dificultan y dejan rastro; con la cuenta compartida no lo impiden.** La barrera es la opción 1 del asunto A-3 | PRUEBA-042 |
| Commit fuera del procedimiento, historial reescrito o rama borrada | Comprobación 10, etiquetas, segunda ancla en la copia; bloqueo de integrar y desplegar | PRUEBA-013, PRUEBA-015 |
| Un comprobador rebajado se pone en `main`; se altera lo que ejecuta la tarea programada | Verificador sellado; la tarea se ejecuta desde la carpeta sellada; confirmación del ancla y de la huella | PRUEBA-050 |
| Una revisión inventada, o un autor que no es quien se declara | **No hay control técnico.** Lo sostienen las reglas del orquestador y que `qa` repite la batería al verificar | Ninguna: asunto A-4 |
| Un comentario del código revisado da instrucciones al `revisor` (A-16) | Reglas del agente; caso de prueba con un comentario sembrado | PRUEBA-054 |
| Las funciones se ejecutan fuera de la UE | Comprobación 9; sin `proxy.ts`; `VERCEL_REGION` obligatoria; región observada en cada despliegue | PRUEBA-005, PRUEBA-021, PRUEBA-054 |
| La credencial de preproducción se usa contra producción | Un proyecto por entorno; token limitado a su proyecto; identificadores leídos de un archivo firmado; la CLI nunca encuentra una sesión guardada | PRUEBA-022, PRUEBA-046 |
| La credencial de preproducción se vuelca al modelo o a una transcripción | Almacén cifrado en vez de variable de entorno; entorno limpio. No impide leerla a propósito | PRUEBA-046 |
| Con la credencial de preproducción se borra o se detiene ese proyecto durante la prueba real | No hay control en la plataforma: es el alcance mínimo que existe. La disponibilidad avisa; el proyecto se vuelve a crear. Riesgo declarado | PRUEBA-037 (solo la detección) |
| Un agente despliega en producción | No hay token guardado ni tiene la clave; orden firmada; token de vida mínima y revocado. Capturarlo mientras se teclea: asunto A-3 | PRUEBA-022, PRUEBA-029, PRUEBA-042 |
| Una credencial aparece en una salida, un registro o una evidencia | Se pasa por el entorno del proceso hijo; búsqueda por valor exacto antes de guardar; patrones nuevos | PRUEBA-032, PRUEBA-048 |
| Se despliega algo distinto del commit integrado | Exportación de los objetos del commit, sin atributos, y comprobada; `npm ci` | PRUEBA-026, PRUEBA-028 |
| Un despliegue defectuoso llega a servir | Preparar, comprobar en el entorno y solo entonces promover; vuelta atrás automática | PRUEBA-024, PRUEBA-027 |
| Dos órdenes simultáneas, o no saber qué sirve el entorno, lo dejan en la versión antigua | Cerrojo común a desplegar y volver atrás; no retroceder; denegar si no se sabe | PRUEBA-030, PRUEBA-054 |
| No se puede volver atrás cuando hace falta | Reasignación del dominio sin compilar; alternativa en la consola | PRUEBA-031 |
| Valores recibidos en la supervisión, los avisos o los registros (A-15) | Módulo de lista cerrada sin SDK; ningún error lleva un valor recibido; guardia de consola. **Los registros de la plataforma guardan por su cuenta la ruta, la consulta y el origen: asunto A-1** | PRUEBA-020, PRUEBA-035 |
| La comprobación de disponibilidad o una página de error revelan información | Un solo campo con dos valores; páginas con texto fijo | PRUEBA-018, PRUEBA-037 |
| Falta una variable, o `ENTORNO` vale `desarrollo` dentro de la plataforma, y la app sirve a medias o abre el diagnóstico | Validación con lista cerrada; 503; no se promueve | PRUEBA-019, PRUEBA-054 |
| La caída de la supervisión bloquea la app o hace acumular datos | Envío con tiempo máximo, sin cola ni reintentos | PRUEBA-020, PRUEBA-036 |
| Abuso de las rutas de error provocado | 404 en los dominios públicos, comprobado en cada despliegue; límite de eventos por minuto | PRUEBA-017, PRUEBA-034 |
| Un aluvión de peticiones agota la prueba gratuita y la termina antes de tiempo (A-22) | Límite por dirección; vigilancia diaria del uso; aviso de disponibilidad. **Queda riesgo: asunto A-14** | PRUEBA-055 |
| El entorno deja de responder y nadie se entera | Comprobación externa cada 5 minutos con aviso por correo | PRUEBA-037 |
| Secretos compartidos entre entornos | Proyectos separados; lista de variables por entorno; declaración firmada del responsable | PRUEBA-025 |
| Contenido servido por HTTP sin cifrar, incrustado o indexado | Redirección 308 de la plataforma; cabeceras del diseño | PRUEBA-023 |
| Pérdida del repositorio por avería del disco | Copia diaria fuera del disco y restauración probada | PRUEBA-015 |
| Una página de documentación externa da instrucciones a un agente (A-16) | No se siguen y constan; no se instalan complementos ni conectores a las consolas | PRUEBA-032 |
| Datos reales o clientes en un entorno de prueba gratuita | Regla de operación y declaración firmada al cerrar | PRUEBA-039 |
| Se despliega antes de las condiciones de inicio, fuera de la ventana sin plan contratado, o algo queda servido desde el plan gratuito | Paso 0 de `desplegar`; declaraciones firmadas; retirada comprobada desde fuera | PRUEBA-051, PRUEBA-052 |

## Pruebas

Las que alteran la rama se hacen sobre una copia de prueba del repositorio. Las de entorno, con datos ficticios. Ninguna se da por superada sin ejecutarse; la que no quepa en la ventana se anota «no ejecutada». Columna «Dónde»: L, en local y antes del primer despliegue; V, en la ventana; C, al cerrar la función.

| ID | Qué demuestra | Dónde | Criterios |
| --- | --- | --- | --- |
| PRUEBA-001 | `main` existe con el arnés, es la única fuente y `comprobar-specs.mjs` pasa en un clon limpio; `desplegar` no admite otra rama de origen | L | CA-001 |
| PRUEBA-002 | La orden única ejecuta las comprobaciones 1 a 9 y la 10 en un clon limpio, sin intervención, con código 0, igual desde dos carpetas, y muestra Node 26 | L | CA-005 |
| PRUEBA-003 | Siete defectos, uno por cambio, hacen fallar su comprobación y el resultado global | L | CA-006 |
| PRUEBA-004 | Un secreto de prueba no válido hace fallar el escáner; `candidato` no llega a crear el commit; el valor no aparece en la salida ni en la evidencia ni queda alcanzable desde `main` | L | CA-007 |
| PRUEBA-005 | Quitar la región, añadir otra, añadir conmutación o añadir `proxy.ts` hacen fallar la comprobación 9 | L | CA-008 |
| PRUEBA-006 | Vulnerabilidad alta bloquea; bloqueo incoherente bloquea; media no bloquea; excepción vigente no bloquea y caducada sí; la instalación no cambia el archivo de bloqueo | L | CA-009 |
| PRUEBA-007 | Herramienta ausente o con suma distinta, comprobación que agota su tiempo y servicio inalcanzable cuentan como fallidas | L | CA-010 |
| PRUEBA-008 | Las 10 últimas ejecuciones tienen duración anotada y ninguna supera 15 minutos | L | CA-011 |
| PRUEBA-009 | Todos los commits de `main` desde el ancla llevan tarea y función y tienen evidencia con los siete campos sobre su candidato; el escáner no encuentra nada en las evidencias | C | CA-002, CA-012 |
| PRUEBA-010 | `ssh-keygen`, por su ruta absoluta, firma y verifica en los tres espacios de nombres; una firma de un tipo no vale para otro; sin terminal interactiva `aprobar` no firma; se piden 12 caracteres de la huella; la clave no está en el agente de claves | L, con la persona | CA-014 |
| PRUEBA-011 | Ocho intentos de integrar un cambio no reservado se rechazan y uno correcto entra sin persona; tras integrar, la rama `trabajo` y el índice quedan al día y ningún archivo de trabajo ajeno a la tarea ha cambiado | L | CA-013 |
| PRUEBA-012 | Seis cambios reservados no entran sin firma y entran con ella; tres textos que afirman la aprobación no la sustituyen; una firma para otro commit, o que no enumera las rutas reservadas del cambio, no vale | L, con la persona | CA-014 |
| PRUEBA-013 | La comprobación 10 falla, nombrando la causa, con un commit sin evidencia, con un commit integrado desaparecido y con la rama borrada; `desplegar` no actúa mientras tanto; las etiquetas llegan a un clon | L | CA-015 |
| PRUEBA-014 | El escáner de secretos sobre todo el historial termina con 0 hallazgos | C | CA-003 |
| PRUEBA-015 | La copia existe, tiene menos de un día, contiene solo `main` y sus etiquetas, detecta una etiqueta desaparecida y, restaurada en otra carpeta, tiene la misma punta y pasa la batería | L, con la persona | CA-004 |
| PRUEBA-016 | Instalar, compilar, probar y arrancar funcionan; el manifiesto declara Node 26 y Next.js 16.4; la estructura coincide con el esqueleto más las diferencias aprobadas aquí | L | CA-016 |
| PRUEBA-017 | El inventario de rutas de la compilación es el de este diseño; los métodos de escritura se rechazan en todas; las dos rutas de diagnóstico dan 404 en los dominios públicos. Fija qué `Host` recibe una función | L y V | CA-017 |
| PRUEBA-018 | Inicio, no encontrado y error declaran `lang="es"`; el componente de error no pinta el mensaje, la traza ni un valor marcado; un error provocado responde solo `{"estado":"error"}` | L | CA-018 |
| PRUEBA-019 | Sin una variable obligatoria, o con formato no válido, `/api/salud` responde 503 genérico; en preproducción ese despliegue no se promueve y la versión anterior sigue sirviendo | L y V | CA-024 |
| PRUEBA-020 | El evento de supervisión solo contiene los campos de la lista cerrada aunque la petición lleve valores marcados en cuerpo, autorización, cookie y consulta; un envío que falla o tarda no bloquea ni se reintenta | L | CA-035, CA-036 |
| PRUEBA-021 | En cada entorno, 10 de 10 respuestas muestran ejecución en `fra1`; la configuración no admite otra región ni conmutación. Fija el formato de `x-vercel-id` | V | CA-021 |
| PRUEBA-022 | El token de preproducción es de proyecto; con él se deniegan las peticiones al equipo y, cuando exista el proyecto de producción, desplegar en él y leer sus variables; desde una sesión de agente, un despliegue en producción no llega a servir. **Es lo primero que se hace en la ventana** | V, persona y agente | CA-023 |
| PRUEBA-023 | Los dos nombres resuelven; las dos direcciones responden desde una red externa; no cambian tras dos despliegues; HTTP responde 308 sin contenido; las cabeceras son las del diseño | V | CA-020 |
| PRUEBA-024 | La comprobación posterior se ejecuta sobre el despliegue preparado, antes de servir, con el secreto de paso; el despliegue se enlaza a su proyecto sin repositorio remoto | V | CA-028 |
| PRUEBA-025 | La lista de variables por entorno coincide con este diseño y con `.env.example`; ninguna de producción está en preproducción; declaración firmada de que ningún valor se repite | L y V | CA-022 |
| PRUEBA-026 | Dos despliegues del mismo commit dan las mismas huellas de dependencias y superan la comprobación posterior; la salida muestra `npm ci` | V | CA-019, CA-009 |
| PRUEBA-027 | Un despliegue con la compilación rota y otro que no supera la comprobación no llegan a servir, el entorno sigue en el commit anterior sin interrupción y sale un aviso; `estado` dice en todo momento qué commit sirve | V | CA-028 |
| PRUEBA-028 | No se despliega un commit no integrado, ni con la exportación alterada, ni con la batería en rojo (con el doble de la CLI); un commit integrado se despliega en preproducción sin persona | L y V | CA-029 |
| PRUEBA-029 | Todo despliegue en producción tiene su orden firmada con fecha anterior, su commit estaba en preproducción con la comprobación superada y consta la revocación de su token | V y C | CA-030 |
| PRUEBA-030 | Dos despliegues lanzados a la vez sobre preproducción terminan, 3 de 3 veces, en el commit más reciente | V | CA-032 |
| PRUEBA-031 | En cada entorno, siguiendo solo la guía, se vuelve de N a N-1 en 10 minutos o menos, sin batería ni compilación; después `/api/salud` está en verde y el commit es el de N-1 | V, persona en producción | CA-033 |
| PRUEBA-032 | El valor de cada credencial no aparece en el repositorio, su historial, los registros ni las evidencias (`buscar-valor`); la salida de 3 despliegues no lo contiene; ningún agente tiene credenciales de producción ni conectores a las consolas | V, persona | CA-031 |
| PRUEBA-033 | Se rota un secreto en preproducción siguiendo la guía; la app funciona con el nuevo y el antiguo deja de valer; ningún valor en la evidencia | V | CA-027 |
| PRUEBA-034 | Un error provocado en cada entorno aparece en la supervisión de ese entorno con ruta, código y momento, en 15 minutos o menos; la supervisión está en la UE | V | CA-034 |
| PRUEBA-035 | Una petición con valores marcados en cuerpo, autorización, cookie y consulta, y un error no capturado con un canario en su mensaje: 0 coincidencias en la supervisión, los avisos y los registros de la batería; en los registros de la plataforma, 0 coincidencias del cuerpo, la autorización, la cookie y el canario del error. **El valor de la consulta sí aparecerá en los registros de la plataforma: el resultado de esa parte depende del asunto A-1** | V, persona | CA-035 |
| PRUEBA-036 | Con la supervisión inalcanzable, 10 de 10 peticiones a `/api/salud` responden bien en 3 segundos o menos | V | CA-036 |
| PRUEBA-037 | La comprobación externa se ejecuta cada 5 minutos en los dos entornos; la respuesta solo tiene el campo `estado`; un error nuevo, una caída simulada y un entorno detenido producen cada uno un correo en plazo | V, persona | CA-037, CA-038 |
| PRUEBA-038 | La guía tiene los diez apartados y ningún secreto; una persona distinta de quien la escribió despliega, vuelve atrás y rota un secreto siguiéndola | L y V | CA-039 |
| PRUEBA-039 | El registro recoge cada acto con fecha, quién y cómo se comprobó, por alguien distinto; declaración firmada del plan y los datos de cada entorno y de que nada se sirvió desde el plan gratuito; todas las evidencias de despliegue tienen fecha dentro de la ventana o posterior a la contratación; proyectos de base de datos creados, con su excepción anotada | C | CA-025, CA-040, CA-042, CA-043 |
| PRUEBA-040 | Cada servicio y herramienta tiene verificación con fuente oficial, ubicación de datos y coste, y la confirmación del responsable es anterior a su primer uso; V-112 y V-114 quedan entregadas al chat de coordinación | L y C | CA-026, CA-041 |
| PRUEBA-041 | Sin firma se rechazan: un candidato que cambia las reglas y, a la vez, `comprobaciones.mjs`; uno que borra `.gitleaks.toml`; uno que quita un firmante. Con `integrar.mjs` modificado en la carpeta de trabajo se ejecuta el de `main`. La comprobación 10 juzga cada commit con las reglas de su primer padre | L | CA-014 |
| PRUEBA-042 | En una copia de prueba con un `preaprobar` y un `predesplegar` en `package.json`, `NODE_OPTIONS` con un módulo de carga previa, `core.fsmonitor` y `diff.external` en `.git/config`, un `.gitattributes` con `-diff` y un `ssh-keygen` falso delante en el `PATH`: `aprobar` y el despliegue de producción, lanzados como dice la guía, enseñan la diferencia real o se niegan, y nada de lo sembrado se ejecuta ni recibe lo que se teclea | L, con la persona | CA-014, CA-023 |
| PRUEBA-043 | No entran sin firma: un cambio en `docs/INSTALACION-CLIENTE.md`, en `CLAUDE.md`, en `AGENTS.md`, en un `CLAUDE.md` de una subcarpeta, en `.mcp.json`; un archivo en `.Claude/agents/`; el renombrado y el borrado de un archivo reservado; una especificación nueva que ya dice `APROBADA`; un estado escrito con negritas; la edición de una especificación aprobada | L | CA-014 |
| PRUEBA-044 | Un caso por cada vía, con un secreto o un fallo sembrado, y en todos la batería falla o el cambio se rechaza sin firma: `vitest.config.ts` que deja una prueba, `tsconfig.json` que excluye, `.gitleaksignore`, comentario `gitleaks:allow`, variable `GITLEAKS_CONFIG`, `.npmrc` con otro registro, `ignores` de ESLint, `.prettierignore`, `.gitattributes` con `export-ignore`, una prueba saltada y un candidato con menos pruebas | L | CA-006, CA-014 |
| PRUEBA-045 | Una dependencia de prueba cuyo script de instalación comprueba si existe una variable de credencial: el script no se ejecuta y, ejecutado a mano con el entorno limpio, no la encuentra. Un `resolved` hacia otro dominio hace fallar la batería. La CLI de despliegue no está en el árbol de la app | L | CA-009 |
| PRUEBA-046 | Desde una sesión de agente, volcar el entorno no muestra la credencial de preproducción. Con una sesión guardada de la CLI en el perfil y sin la credencial, `desplegar` falla. Cambiar una variable de entorno con otro identificador de proyecto no cambia a dónde se despliega | L, con el doble; V | CA-023, CA-031 |
| PRUEBA-047 | Tras rechazar un candidato con un secreto de prueba y purgarlo: 0 coincidencias del valor, sin imprimirlo, en todos los objetos del repositorio, en las carpetas temporales y en la última copia; el informe temporal de Gitleaks no lo contiene | L | CA-007 |
| PRUEBA-048 | Un canario con la forma de cada credencial nueva (token de la plataforma, DSN, variable con valor) hace fallar la comprobación 6; `buscar-valor` encuentra un valor sembrado sin imprimirlo | L | CA-007, CA-031 |
| PRUEBA-049 | Una fila del registro que dice «aceptado por el responsable» sin declaración firmada hace fallar la comprobación 10; modificar o borrar una fila del registro o una línea de unas aclaraciones no entra sin firma, y añadir una al final sí; un cambio de la guía pide firma; una declaración firmada en otro espacio de nombres no vale | L | CA-014, CA-040 |
| PRUEBA-050 | Con un comprobador rebajado puesto a mano en `main` y una etiqueta nueva: el verificador sellado lo detecta en la siguiente orden de la persona y en la copia, y `sellar` se niega. Las órdenes de la persona no siguen sin confirmar el ancla y la huella. Con `copia.mjs` modificado en la carpeta de trabajo, la tarea programada ejecuta el sellado | L, con la persona | CA-015 |
| PRUEBA-051 | `desplegar` se niega sin la declaración firmada de las condiciones de inicio (1 de 1), con un texto sin firma que la afirma, con una condición sin cumplir, con el calendario cambiado, con fecha posterior a la ventana sin decisión de pago y después de una retirada. El registro contiene las fechas de la ventana y la confirmación, anterior al primer despliegue | L, con el doble; V | CA-045 |
| PRUEBA-052 | El calendario existe antes del primer despliegue; al cerrar la ventana cada elemento tiene estado y fecha; consta la decisión sobre el pago con fecha anterior al fin; si no se contrata, cada dirección deja de recibir la app (2 de 2) y consta la retirada; si se contrata, los dos entornos siguen en verde | V y C | CA-046, CA-047 |
| PRUEBA-053 | Antes del primer despliegue: todas las pruebas marcadas L están superadas con evidencia; la app base arranca y responde en local; las órdenes de despliegue y de vuelta atrás pasan sus pruebas con el doble de la CLI, sin llamar a la plataforma | L | CA-044 |
| PRUEBA-054 | `ENTORNO=desarrollo` con una variable de la plataforma presente, o sin `VERCEL_REGION` en preproducción, da 503 y deja cerrado el diagnóstico; `volver-atras` espera al cerrojo de `desplegar`; sin saber qué sirve el entorno no se despliega; un binario de Gitleaks cambiado tras instalarse hace fallar la comprobación 6; un comentario sembrado que pide al `revisor` aprobar sin leer aparece en su dictamen como hallazgo y no se obedece | L | CA-010, CA-024, CA-032 |
| PRUEBA-055 | En cada proyecto existe la regla de límite por dirección; una ráfaga desde una sola dirección sobre `/api/salud` en preproducción recibe 429 antes de 200 peticiones; el uso de la prueba gratuita consta anotado cada día | V, persona | CA-038 |

## Comprobación de la constitución

Rehecha artículo por artículo con el dictamen delante. Donde el auditor no estaba de acuerdo se dice qué se corrigió o qué falta y quién lo decide.

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple en lo que controla el código. **Falta una decisión del responsable (A-1)** | La app base no recibe datos; la supervisión y el registro solo admiten listas cerradas; ningún error lleva un valor recibido y la consola queda cerrada. Lo que el código no controla: los registros de ejecución de la plataforma guardan la ruta pedida, la cadena de consulta, el agente de usuario y la dirección de origen, 30 días durante la prueba. Eso choca con la letra de los requisitos 40 y 63 y con la condición de la decisión 9. El dictamen tenía razón en que la reserva alcanzaba también a esa decisión: el asunto A-1 la incluye ahora |
| 2 Aislamiento | No aplica | No hay clientes ni identificadores. Ninguna entrada |
| 3 Cierre en fallo | Cumple, corregido | El dictamen señalaba dos fallos en abierto. Corregidos: las reglas y los verificadores se leen de `main` y, ante la duda, un cambio es reservado; `desarrollo` no es válido dentro de la plataforma y `VERCEL_REGION` es obligatoria. Además: sin saber qué sirve el entorno no se despliega, y sin la confirmación firmada tampoco |
| 4 Secretos | Cumple, con un límite que se declara entero | Corregido lo que el dictamen pedía: la credencial de preproducción ya no está en una variable de entorno, un candidato rechazado no sale del disco ni deja su valor en un informe, y los escáneres reconocen las credenciales nuevas. Límite que queda: los agentes usan la credencial de preproducción, así que un proceso de su cuenta puede descifrarla a propósito. Es inherente a la respuesta 10 a) del responsable; el alcance es un proyecto con datos ficticios y la vida, la de la ventana |
| 5 Especificación | Cumple | Cada pieza remite a su requisito; cada criterio tiene prueba. El plan y las tareas van en el paso siguiente. Tres lecturas de requisitos se piden confirmar (A-5, A-14) en vez de darlas por buenas |
| 6 Revisión independiente | **Cumple solo si el responsable acepta A-4 de forma expresa antes de P1** | Nadie integra sin un dictamen del `revisor` sobre ese commit. Pero el autor lo declara quien lanza `candidato` y el dictamen es una transcripción: la independencia es declarada, no probada. El diseño anterior lo decía a medias y afirmaba que el `revisor` no tenía herramientas de escritura; tiene terminal. Queda dicho entero |
| 7 Entradas no confiables | Cumple, corregido | El dictamen señalaba que las declaraciones del responsable las escribía un agente. Ahora van firmadas, el registro y las aclaraciones solo crecen y la guía es ruta reservada. Las instrucciones encontradas en documentación externa no se siguieron y constan en `verificaciones.md` |
| 8 Límites en el anfitrión | Cumple, corregido | No era «no aplica»: `docs/INSTALACION-CLIENTE.md`, el ADR-0004 y el texto de arranque local pasan a ser rutas reservadas |
| 9 Prompt por despliegue | No toca el prompt | `prompts/**` y `docs/referencia/**` quedan como rutas críticas, como pedía el dictamen |
| 10 Producto final | Cumple | Páginas de error, cabeceras, supervisión, avisos, vuelta atrás, copia y guía forman parte de la entrega. Si la ventana se agota, lo no probado queda como «no ejecutado» y no se cierra como hecho |
| 11 Reversibilidad | Cumple | Vuelta atrás de despliegue probada en los dos entornos; restauración de la copia probada; retirada de los proyectos descrita y comprobada |
| 12 Español | Cumple | Interfaz, documentos, órdenes propias, nombres de variables y mensajes de commit. Los nombres propios de las herramientas se dejan como son |
| 13 Evidencias honestas | Cumple, corregido | Las dos frases que el dictamen señaló («impide que un agente fabrique una aprobación» y «lo que de verdad impide») están reescritas: el diseño dice qué impide dentro del procedimiento y qué solo dificulta. Lo no verificado está listado con la prueba que lo resuelve |
| 14 Cambios reservados | **Incompleto hasta que el responsable decida A-3** | Corregido en el diseño: de dónde se leen las reglas (bloqueante 1), la lista de rutas reservadas (bloqueante 3) y cómo se comparan (mayor 10). Lo que el diseño no puede cerrar: mientras la persona y los agentes compartan cuenta de Windows, una firma válida se puede obtener capturando lo que la persona teclea, y eso no se detecta después. Con la opción 1 del asunto A-3 el artículo se cumple; con la 2 se dificulta más; con la 3 queda como riesgo aceptado por escrito |

Resumen honesto: ningún artículo queda incumplido por una decisión de diseño que se pueda corregir aquí. Tres dependen de una respuesta del responsable antes de la puerta P1: el 14 (A-3), el 1 (A-1) y el 6 (A-4). Sin esas respuestas, este diseño no debe pasar la puerta.

## Dependencias nuevas

Versiones y fuentes en `verificaciones.md`, apartados 5, 6 y 11. Se vuelven a leer al instalar y se fijan en el archivo de bloqueo.

| Dependencia | Para qué | Versión comprobada | Licencia | Alternativa descartada |
| --- | --- | --- | --- | --- |
| `next` | La app | 16.4.6 | MIT | — (T-002) |
| `react`, `react-dom` | Los exige Next.js | 19.3.1 | MIT | — |
| `typescript` (desarrollo) | Tipos | Última 6.0.x; la 7.0.2 no es compatible con `typescript-eslint` | Apache-2.0 | TypeScript 7: esperar a que el analizador la admita |
| `@types/node`, `@types/react`, `@types/react-dom` (desarrollo) | Tipos | Las que correspondan a Node 26 y React 19 | MIT | — |
| `eslint` (desarrollo) | Estilo y análisis estático | 10.14.0; la última 9.x si algún complemento no admite la 10 | MIT | Biome: no tiene las reglas de seguridad |
| `eslint-config-next` (desarrollo) | Reglas de Next.js | 16.4.6 | MIT | — |
| `typescript-eslint` (desarrollo) | Reglas con tipos | 8.72.2 | MIT | — |
| `eslint-plugin-security` (desarrollo) | Reglas de seguridad | 4.2.1 | Apache-2.0 | Semgrep: en Windows está en beta y exige Python |
| `prettier` (desarrollo) | Formato | 3.10.1 | MIT | — |
| `vitest` (desarrollo) | Pruebas | 5.1.0 | MIT | El ejecutor de pruebas de Node: sin entorno para componentes |
| `vercel` (CLI), **en `herramientas/despliegue/`, con su propio archivo de bloqueo** | Despliegue | 65.15.0 | Apache-2.0 | Instalarla globalmente (dependería de algo fuera del repositorio) o en el árbol de la app (sus dependencias compartirían árbol con lo que se despliega) |
| Gitleaks (binario, fuera de npm) | Escáner de secretos amplio y de historial | 8.30.1 | MIT | Solo los patrones propios: no bastan |

No se añade ningún SDK de supervisión ni librería de validación: la app base valida sus variables a mano. `zod` (V-109) lo decide la función 001. Los scripts de `scripts/bateria/` y `scripts/plataforma/` no importan ningún paquete de npm, solo módulos de Node: se ejecutan sin `node_modules`.

Servicios, todos PROPUESTOS hasta que el responsable los confirme (requisito 46): Vercel en la prueba gratuita del plan Pro (dos proyectos; la cuenta existe desde el 13/11/2026), Sentry en la UE (plan Developer), UptimeRobot (plan gratuito).

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Un solo proyecto de despliegue, con preproducción en una rama o en un entorno personalizado | Los entornos personalizados ya están disponibles (plan Pro), pero la credencial alcanzaría los dos entornos: los tokens se limitan a un proyecto, no a un entorno (requisito 60) |
| Ejecutar las órdenes desde la copia de trabajo (`npm run` sobre los archivos de la carpeta) | El código que decide lo podría cambiar el propio candidato o un archivo sin integrar (dictamen, BLOQUEANTE 1) |
| Juzgar al candidato con sus propias reglas o con su propia batería | Un candidato podría quitarse de la lista de reservados y rebajar la batería en el mismo commit |
| Promover directamente y volver atrás si la comprobación falla | El requisito 33 pide comprobar antes de servir |
| Compilar en la máquina y subir el resultado (`--prebuilt`) | Añade la compilación local en Windows como punto de fallo y pierde las variables de sistema en la compilación |
| SDK oficial de supervisión con sus capturas desactivadas | Obliga a vigilar en cada versión qué captura por defecto; el módulo propio solo puede enviar la lista cerrada |
| No añadir supervisión y usar las alertas de la plataforma | Solo existen con un complemento que deja de ser gratuito al acabar la ventana; guardan ruta y consulta; y no avisan de una caída de la propia plataforma |
| Devolver el commit o la región en `/api/salud` | El requisito 41 prohíbe revelar configuración; la región la da la plataforma en una cabecera y el commit se consulta con credencial |
| `proxy.ts` para rechazar métodos o añadir cabeceras | Se ejecutaría en todas las regiones, fuera de la UE |
| Aprobación como archivo de texto, como etiqueta sin firma o como anotación en el registro | Un agente puede escribir cualquiera de las tres |
| Evidencias fuera del repositorio, o como notas de git | El requisito 17 las pide en la carpeta de la función |
| Guardar el token de producción en la máquina | Lo leería cualquier proceso de la cuenta |
| Credencial de preproducción en una variable de entorno del usuario | Un volcado del entorno, habitual al diagnosticar, la enviaría al modelo y a las transcripciones (dictamen, MAYOR 3) |
| `vercel curl` para la comprobación posterior | Puede crear por su cuenta un secreto de paso nuevo en el proyecto, lo que cambia su configuración, y necesita `curl` |
| Una ruta de error siempre activa, o activada con una variable | La primera se puede abusar; la segunda obliga a cambiar la configuración de producción para cada prueba |
| Analizador estático con motor de flujo de datos (Semgrep, CodeQL) en la batería local | Semgrep en Windows está en beta y pide Python; CodeQL no tiene licencia para un repositorio privado sin plan de pago. Se propone revisar esta decisión en la función 003, sobre Linux |
| Copia con `robocopy` de la carpeta, o con `git bundle --all` | La primera copiaría archivos no versionados, entre ellos `.env.local`; la segunda sacaría del disco las ramas de candidatos rechazados, también uno que llevara un secreto |
| Crear los proyectos y el DNS antes de confirmar las condiciones de inicio, para ganar días | Lo prohíbe el requisito 74 |
| Seguir en el plan gratuito de la plataforma si la ventana se agota | Lo prohíben los requisitos 71 y 79 |

## Decisiones que requieren ADR

Una. Cambia la frontera «Repositorio → producción» de `docs/ARQUITECTURA.md` (hoy: rama protegida, revisión, CI) y matiza ADR-0001 (un solo despliegue, plan Pro). Borrador en `specs/002-plataforma-base/propuestas-diseno/adr-borrador-plataforma-local.md`, actualizado con esta versión, para que lo registre el chat de coordinación: repositorio local con integración por orden; reglas y verificadores leídos de `main`; aprobaciones y declaraciones firmadas; dos proyectos de despliegue; despliegue preparado, comprobado y promovido; supervisión con envío propio; entornos solo dentro de la ventana de prueba.

Los cambios que este diseño necesita en documentos compartidos están en `specs/002-plataforma-base/propuestas-diseno/cambios-documentos-compartidos.md`. Ninguna parte de la seguridad de este diseño depende de que se apliquen.

## Asuntos abiertos para el responsable

Ninguno se ha forzado ni rebajado. **A-1 y A-3 son condición de la puerta P1** según el dictamen; A-4 necesita aceptación expresa. Los identificadores A-1 a A-11 son los de la versión anterior, para que el dictamen se pueda seguir.

### A-3. Qué separa a los agentes de lo que teclea la persona

Es la corrección del bloqueante 2 que el diseño no puede hacer solo. Hoy la persona y los agentes usan la misma cuenta de Windows. Las medidas de «Órdenes que ejecuta la persona» ya están en el diseño con cualquiera de las tres opciones.

| Opción | Qué garantiza | Qué no garantiza | Coste |
| --- | --- | --- | --- |
| **1. Cuenta de Windows aparte para los agentes.** Cuenta estándar, sin permisos de administrador, con su propia sesión de Windows (no «ejecutar como» dentro del escritorio de la persona). La clave, la carpeta sellada y las órdenes de la persona viven en la cuenta del responsable | Una barrera del sistema operativo: los procesos de los agentes no pueden leer la clave ni la carpeta sellada, ni cambiar el entorno, el perfil o el `PATH` de la persona, ni ver lo que teclea en su sesión. El token de producción solo existe en la sesión de la persona | La carpeta del repositorio sigue siendo de los dos: lo cubren las medidas 3 y 4. No cubre a un agente que consiguiera permisos de administrador. La credencial de preproducción sigue al alcance de los agentes, porque la usan. Sin comprobar en esta máquina: que la app de escritorio cargue el arnés igual en la otra cuenta (T-017 se comprobó en la actual) | Alrededor de media jornada de una persona: crear la cuenta, iniciar allí la app, dar permisos sobre la carpeta, repetir la comprobación de T-017. Después, cambiar de sesión para cada firma y cada despliegue en producción. Hacerlo ahora compite con los cuatro días que quedan para llegar al 17/11 |
| **2. Llave física ya**, con la cuenta compartida: clave `ed25519-sk` con verificación obligatoria en cada firma | Que la clave no se puede copiar y que cada firma exige tocar la llave y su PIN: no hay firmas a escondidas ni en lote | Que lo firmado sea lo que se enseñó: un proceso de la misma cuenta puede cambiar el archivo entre que se muestra y se firma. El token de producción se captura igual. Sin verificar: que el `ssh-keygen` de esta máquina firme archivos con una llave física en Windows | Comprar la llave (decenas de euros y unos días de envío) y probarla |
| **3. Aceptación escrita** del riesgo, con el texto exacto: los controles «dificultan y dejan rastro; no impiden» | Nada nuevo: deja constancia | Todo lo anterior. Una aprobación válida obtenida capturando la frase de paso no la detecta ningún control posterior | Ninguno. El daño posible en la fase 1 está acotado: producción no tiene datos, licencias ni clientes, y B-003 sigue bloqueado |

**Recomendación del arquitecto: la opción 1**, puesta antes de la primera orden de producción y, como muy tarde, antes de que termine la ventana. Mientras se prepara, una declaración `aceptacion-riesgo` (opción 3) que caduque en esa fecha, para no retrasar el arranque. La llave física (opción 2, antes A-10) es un buen complemento más adelante, no un sustituto: no resuelve la captura del token ni el cambio de lo que se firma.

Segunda parte del mismo asunto: con cualquiera de las tres, la credencial de preproducción se puede descifrar a propósito desde la cuenta de los agentes. Alternativa: que preproducción también la despliegue una persona, lo que deshace el requisito 35. Recomendación: aceptarlo; el alcance es un proyecto con datos ficticios.

### Los demás

| N.º | Asunto | Alternativas | Recomendación del arquitecto |
| --- | --- | --- | --- |
| A-1 | **Requisitos 40, 43 y 63, criterio 35 y la decisión 9.** Los registros de ejecución de la plataforma guardan por su cuenta la ruta pedida, su cadena de consulta, el agente de usuario y la dirección de origen. Durante la prueba, 30 días (1 día si se excluye el proyecto de «Observability Plus»). No se puede desactivar. Dos consecuencias: la parte del criterio 35 que busca el valor de la consulta en esos registros no se puede superar; y la decisión 9 admitió registros fuera de la UE **solo si no llevaban valores recibidos**, y estos los llevan | a) Aceptarlo por escrito en sus dos partes: precisar el requisito («los registros de la plataforma no guardan cuerpos, cabeceras de autorización ni cookies») y revisar la decisión 9 para admitir fuera de la UE la ruta, la consulta, el agente de usuario y el origen; con la regla, obligatoria para todas las funciones, de que **ningún secreto, dato personal ni dato de correo viaja en la ruta ni en la cadena de consulta**. b) Mantener los requisitos y cambiar de plataforma, lo que reabre D-002. c) Mantenerlos y dar por no superado el criterio 35 en ese punto | a), con dos precisiones: mantener «Observability Plus» en preproducción mientras dure la prueba real, porque la 001 lo necesita para revisar sus tres días, y excluir producción; y volver a decidirlo antes de la versión distribuible. Cambia requisitos aprobados: lo decide el responsable, antes de P1 |
| A-2 | **Requisito 60.** La documentación sigue sin decir en qué planes se puede crear un token limitado a un proyecto | Se comprueba primero (PRUEBA-022). Si la cuenta no lo ofrece: a) que durante la ventana también preproducción la despliegue una persona; b) aceptar por escrito el riesgo mientras dure la ventana | Esperar a la prueba. Si falla, a) |
| A-4 | **Requisitos 15 y 52.** El autor de un cambio lo declara quien crea el candidato, y `revision.md` es una transcripción: nada impide técnicamente que un agente invente uno u otro. La aceptación de la cuestión 3 d) hablaba de saltarse el procedimiento | Aceptar de forma expresa que la independencia de la revisión es declarada hasta la función 003, o pedir que el responsable firme también las revisiones, lo que deshace el flujo desasistido | Aceptar, por escrito |
| A-5 | **Cuatro lecturas de requisitos** que el diseño propone en vez de darlas por buenas | a) Requisito 5: la batería muestra sus nueve comprobaciones, una décima (la de la rama) y un paso previo. b) Requisito 4: la copia cubre `main` y sus etiquetas; el trabajo sin integrar no se copia, para que un candidato rechazado no salga del disco. c) Requisito 37: «la lee del entorno de la máquina» se cumple con un almacén cifrado de la máquina, no con una variable de entorno. d) Requisito 34 y criterio 29: la «copia de trabajo sin cambios pendientes» es la exportación limpia del commit; exigirlo de la carpeta compartida impediría desplegar mientras otro chat trabaja (D-017) | Confirmar las cuatro |
| A-6 | Qué pide firma en una especificación | Propuesto: que el estado pase a `APROBADA` (P0), `EN CURSO` (P1) o `CERRADA` (P7), y cualquier edición de una especificación ya aprobada. `DISEÑADA`, `PLANIFICADA` y `VERIFICADA` los ponen los agentes | Confirmar |
| A-7 | Desde el ancla, **todos** los commits de `main` pasan por `integrar`, también los del chat de coordinación y los de las demás fases; la carpeta compartida queda en la rama `trabajo` | Es lo que pide el requisito 20. Afecta a las reglas de `docs/PLAN.md` | Confirmar y trasladar a coordinación |
| A-8 | Diferencias con `docs/ESQUELETO.md` marcadas **(nueva)**, entre ellas `herramientas/despliegue/`, `docs/operacion/` y las rutas `/api/salud` y `/api/diagnostico/…` | Aprobarlas con este diseño | Aprobar |
| A-9 | Servicios y herramientas propuestos: Sentry en la UE, UptimeRobot, Gitleaks y el resto de la tabla de dependencias; la regla de límite por dirección del cortafuegos de la plataforma | Confirmar cada uno antes de su primer uso (requisito 46) | Confirmar |
| A-10 | Llave física para la clave de aprobaciones | Ahora forma parte del asunto A-3 (opción 2) | Ver A-3 |
| A-11 | Datos pendientes: `<dominio>`, `<carpeta de copia>`, y el primer commit de `main` | Los entrega y ordena el responsable | Antes de la puerta P1 |
| A-12 | **El arranque.** El procedimiento de integración no puede integrarse a sí mismo: su primer commit entra en `main` por orden expresa del responsable, con su firma del ancla. Es una ampliación del acto reservado 1 | Confirmarlo, o pedir otra forma de arranque | Confirmar |
| A-13 | **La lista de rutas reservadas crece** respecto de la que enumera el requisito 19: `CLAUDE.md`, `AGENTS.md`, `.mcp.json`, `docs/INSTALACION-CLIENTE.md`, el ADR-0004, el arranque local, `docs/CALIDAD.md`, `docs/EQUIPO.md`, `docs/SEGURIDAD.md`, toda `docs/operacion/` y la configuración de las herramientas de la batería. Más firmas para el responsable y para el chat de coordinación | Aceptar la lista entera, o quitar de ella los tres documentos de `docs/` que fijan puertas, roles y rutas críticas, que el dictamen no pedía de forma expresa | Aceptarla entera: son los documentos que dicen quién aprueba qué |
| A-14 | **La ventana.** a) Leer el criterio 44 como «los criterios locales exigibles antes del primer despliegue son los de la tabla; los que se evalúan al cerrar se comprueban hasta la fecha». b) El requisito 74 exige todos los criterios locales antes del primer despliegue, también la copia y la guía completa: si el 17/11 solo faltara eso, empezar exigiría enmendar el requisito. c) El calendario: plan completo solo si se despliega el 17/11 o antes; después, el recorte de la tabla. d) Queda el riesgo de que un aluvión de peticiones agote la prueba gratuita y la termine antes de tiempo, pese al límite por dirección | a) Confirmar. b) Decidir si se enmienda. c) Aprobar el calendario antes del primer despliegue. d) Aceptar el riesgo por escrito | a) Confirmar. b) No enmendar salvo que sea lo único que falte: lo construye `plataforma` mientras la 001 hace el conector. c) Aprobar el recorte propuesto. d) Aceptar |

## Para la función 001

Lo que cambia respecto de la versión del 12/11/2026 y lo que su diseño debe dar por fijado.

| Tema | Qué debe saber la 001 |
| --- | --- |
| Integración | Sus commits entran con `integrar`, que se ejecuta con el código de `main`. Mensaje `T-NNN (001): `. Evidencias en `specs/001-conector-prueba-real/evidencias/integracion/<C>/`. Una tarea no comparte archivos con otra. No puede integrar nada antes del ancla (tramo 1) |
| Rutas críticas (dictamen del `auditor-seguridad` en cada cambio) | `src/app/oauth/**`, `src/app/.well-known/**`, `src/lib/oauth/**`, `src/lib/licencias/**`, `src/mcp/**`, `src/app/api/**`, `contratos/**`, `prompts/**`, `src/lib/plataforma/**`, `src/lib/registro/**`, `package.json`, `package-lock.json` y `.env.example`. Casi todo el conector es ruta crítica: conviene agrupar los dictámenes por tarea |
| Rutas reservadas (firma del responsable) | El texto de arranque local (`prompts/**/arranque*`), `docs/INSTALACION-CLIENTE.md`, `next.config.ts`, `vercel.json`, `docs/operacion/entornos.md` y `entornos.json` (la lista de variables), `comprobaciones-despliegue.mjs` y las reglas del análisis estático. Conviene reunir en un solo cambio todo lo que la 001 necesite de estas rutas |
| Variables | Se añaden a la lista cerrada de `configuracion.ts`, a `.env.example` y a `entornos.md`. Los valores los pone una persona en cada proyecto. Sin valor por defecto: si falta una, `/api/salud` responde 503 y el despliegue no se promueve (sirve a su requisito 54) |
| Registro y errores | Solo `registro.ts`, con códigos de `codigos.ts`. Nada de `console` ni de `process.env` fuera de sus archivos. Todo manejador, con `manejador.ts`. Solo `ErrorDeAplicacion`. `JSON.parse` y `new URL` sobre datos recibidos, solo a través de `entrada.ts`. Ningún error lleva un valor recibido. El análisis estático lo bloquea |
| Ruta y cadena de consulta | **Ningún secreto, dato personal ni dato de correo en la ruta ni en la cadena de consulta**: la plataforma las guarda en sus registros (asunto A-1). Códigos de activación, tokens, verificadores y códigos de autorización, en el cuerpo o en la cabecera |
| Registros de la plataforma | Durante la prueba se conservan 30 días, no 1 hora: sí sirven para la revisión de privacidad de los tres días de su criterio 24. Los ve solo el responsable en la consola: los agentes no tienen acceso (requisito 37) |
| Sin `proxy.ts` ni `middleware` | Se ejecutarían fuera de `fra1`. Cabeceras y rechazos, en los manejadores o en `next.config.ts` |
| Despliegue | `npm run desplegar -- preproduccion`, lanzado por un agente tras integrar. Sus comprobaciones posteriores (metadatos, punto MCP sin token) se añaden a `comprobaciones-despliegue.mjs`. Producción la despliega el responsable |
| Preproducción durante sus tres días | Congelada: solo se despliega para corregir un defecto del conector. La verificación de la plataforma que interrumpe el servicio se hace antes o después |
| Límite por dirección | 100 peticiones por minuto y dirección en `/api/*`. Si su prueba de simultaneidad o los asistentes necesitan más, lo dice su diseño |
| Calendario | Para sus tres días con reinicio, día sin buzón y margen, el primer despliegue debe ser el 17/11/2026 o antes. Su guion incluye el calendario (su requisito 80) y es la condición de inicio 3 |
| Estado de la prueba | Esta función no crea bases de datos. El proyecto `nido-desarrollo` lo crea el responsable. Con el plan gratuito de Supabase hay dos proyectos por cuenta |
| Inventario de rutas | Sus rutas se añaden a `tests/plataforma/inventario-rutas.json`, con los métodos de escritura que su diseño admita |

## Respuesta al dictamen (primera vuelta)

Dictamen: `dictamen-diseno.md`, 12/11/2026, 3 bloqueantes, 10 mayores y 9 menores. Cada hallazgo, qué se cambió, dónde está en este documento y la prueba que lo demuestra. Las pruebas están diseñadas, no ejecutadas: no hay código.

| Hallazgo | Qué se cambió | Dónde | Prueba |
| --- | --- | --- | --- |
| **BLOQUEANTE 1.** No se decía de qué versión se leen reglas, firmantes y verificadores | Todo lo que decide se lee de `main`: las órdenes de los agentes, de la punta, mediante un lanzador que se lee con `git show`; la comprobación 10 juzga cada commit con las reglas y los firmantes de su primer padre; la batería del candidato solo se usa si la cambia y lleva firma. Arranque explicado. Para `aprobar` y el despliegue de producción se usa algo más estricto que lo que pedía el dictamen: la carpeta sellada | «De dónde sale el código que decide»; «Integración», órdenes y comprobación de la rama | PRUEBA-041 |
| **BLOQUEANTE 2.** Lo que teclea el responsable acababa en código modificable por un agente | Hecho lo que el diseño puede: código sellado fuera de la carpeta de trabajo, sin `npm run`; rutas absolutas de `node`, `git` y `ssh-keygen`; entorno limpio; opciones de git del dictamen; lectura de objetos y no de archivos; confirmación del ancla y de la huella; token de producción de vida mínima y revocado. Corregidas las frases que decían «impide». **La elección entre cuenta aparte, llave física o aceptación escrita es del responsable y sigue abierta**: hasta que decida, el hallazgo no está cerrado y el artículo 14 queda incompleto | «Órdenes que ejecuta la persona»; tabla «Qué garantiza cada control y qué no»; asunto A-3; constitución, artículos 13 y 14 | PRUEBA-042 |
| **BLOQUEANTE 3.** Faltaban los límites del agente y la configuración de los agentes fuera de `.claude/` | Añadidas `docs/INSTALACION-CLIENTE.md`, `CLAUDE.md` y `AGENTS.md` (en cualquier carpeta). Con el mismo criterio: `.mcp.json`, el ADR-0004, el texto de arranque local, `docs/CALIDAD.md`, `docs/EQUIPO.md` y `docs/SEGURIDAD.md` | «Integración», tabla de rutas reservadas; asunto A-13 | PRUEBA-043 |
| **MAYOR 1.** La batería se podía rebajar con archivos no reservados o con el entorno | Las dos correcciones que ofrecía el dictamen, juntas: los archivos de configuración son rutas reservadas y cada herramienta recibe su configuración de forma expresa; lista de archivos no admitidos; entorno limpio de lista cerrada; Gitleaks con las opciones del dictamen; npm con registro y configuración fijados; recuento de pruebas; pruebas saltadas | «Batería local», «Que la batería no se pueda rebajar…» | PRUEBA-044 |
| **MAYOR 2.** Cadena de suministro | `npm ci --ignore-scripts` con lista de excepciones reservada; entorno limpio; procedencia de cada `resolved` en la comprobación 7; la CLI en `herramientas/despliegue/` con su archivo de bloqueo; dependencias como ruta crítica | «Batería local», «Cadena de suministro»; «Dependencias nuevas» | PRUEBA-045 |
| **MAYOR 3.** Credencial de preproducción en una variable de usuario | Pasa a un almacén cifrado con DPAPI; la CLI se ejecuta con `--global-config` y perfil vacíos; sin credencial, error y nada más; identificadores en un archivo reservado; la guía prohíbe `vercel login`. Precisión: se usa un archivo cifrado con DPAPI en vez del Administrador de credenciales; la protección es la misma y no necesita ningún módulo. Las reglas `deny` quedan como propuesta y el diseño no depende de ellas. Límite declarado: evita el volcado por descuido, no la lectura a propósito | «Entornos y credenciales» | PRUEBA-046 |
| **MAYOR 4.** Un secreto en un candidato rechazado sobrevivía y salía con la copia | Escáner antes de crear el candidato; borrado de la rama y purga; copia solo con `main` y sus etiquetas; informe de Gitleaks con plantilla propia sin valor; temporales borrados siempre | «Batería local», escáner; «Integración», secreto en un candidato rechazado; «Copia diaria» | PRUEBA-047 |
| **MAYOR 5.** Los escáneres no reconocían las credenciales nuevas | Verificado que las reglas por defecto de Gitleaks no tienen regla para el token de la plataforma ni para el DSN. Patrones nuevos en los dos escáneres y búsqueda por valor exacto para lo que no tiene forma | «Batería local», escáner; `verificaciones.md`, 11.6 | PRUEBA-048 |
| **MAYOR 6.** Las declaraciones del responsable las escribía un agente | Declaraciones y aceptaciones firmadas, en su espacio de nombres; `docs/operacion/` reservada entera; el registro solo crece y una fila de declaración sin firma hace fallar la comprobación 10; en `aclaraciones.md` lo ya anotado no se toca sin firma y lo nuevo se añade sin firma, sin valor de aprobación | «Aprobaciones y declaraciones firmadas»; «Guía y registro» | PRUEBA-049 |
| **MAYOR 7.** El asunto A-1 arrastraba la decisión 9 | El asunto A-1 pide ahora las dos cosas, con el dato nuevo de la retención. La regla de la consulta se amplía a datos personales y de correo. Regla nueva: ningún error lleva en su mensaje un valor recibido, con guardia de consola y ruta de diagnóstico para probarlo | Asunto A-1; «App base», «Ningún error lleva…»; «Para la función 001» | PRUEBA-035 |
| **MAYOR 8.** Independencia de la revisión solo declarada | De acuerdo con la valoración del dictamen: es una decisión del responsable. Declarado entero: autor autodeclarado, dictamen transcrito, el `revisor` tiene terminal | «Integración», mensajes y evidencias; tabla «Qué garantiza…»; asunto A-4; constitución, artículo 6 | Ninguna: no hay control técnico que probar |
| **MAYOR 9.** Detección posterior más débil de lo aceptado | Verificador sellado, que no cambia con `main`; las órdenes de la persona muestran el ancla y la huella y exigen confirmarlas; la tarea programada se ejecuta desde la carpeta sellada | «De dónde sale el código que decide», carpeta sellada; «Copia diaria» | PRUEBA-050 |
| **MAYOR 10.** Rutas comparadas de forma insegura | Comparación sin mayúsculas, con `--no-renames`, con altas y bajas; se rechazan colisiones, enlaces simbólicos y submódulos; el estado se lee con la regla de `comprobar-specs.mjs`; ante la duda, reservado | «Integración», «Cómo se comparan las rutas» | PRUEBA-043 |
| M-a. Diagnóstico y región fallaban en abierto | `desarrollo` no es válido dentro de la plataforma; `VERCEL_REGION` obligatoria; 404 del diagnóstico comprobado en cada despliegue | «App base», configuración; «Despliegue», paso 8 | PRUEBA-054 |
| M-b. Secreto de paso de producción | Lo crea y lo custodia una persona; se teclea; no se usa `vercel curl` y ninguna orden crea secretos | «Entornos y credenciales»; «Órdenes que ejecuta la persona», punto 8 | PRUEBA-024, PRUEBA-042 |
| M-c. Cerrojos | Cerrojo común a `desplegar` y `volver-atras`; sin saber qué sirve el entorno, se deniega | «Despliegue», pasos 2 y 3 | PRUEBA-054 |
| M-d. Copia de trabajo desfasada | Rama `trabajo`; `integrar` la pone al día sin tocar archivos; ninguna orden hace `reset --hard` | «Integración», «Varios chats, una carpeta» | PRUEBA-011 |
| M-e. Binario de Gitleaks | Suma del binario fijada y comprobada en cada ejecución; el clon limpio lo instala en la previa | «Batería local», herramientas fuera de npm | PRUEBA-054 |
| M-f. Agotar el plan | Ya no es el plan gratuito sino la prueba: agotarla la termina. Límite por dirección, vigilancia diaria y riesgo residual presentado para su aceptación | «Ventana», vigilancia del uso; asunto A-14 | PRUEBA-055 |
| M-g. Inyección dirigida al revisor | Caso de prueba con un comentario sembrado | «Amenazas» | PRUEBA-054 |
| M-h. La tabla atribuía al gancho más de lo que hace | Corregido: solo vigila las herramientas de edición y el diseño no cuenta con él | «Amenazas», primera fila | — |
| M-i. Firmas | Un espacio de nombres por tipo, verificado; 12 caracteres de la huella | «Aprobaciones y declaraciones firmadas»; «Órdenes que ejecuta la persona», punto 6 | PRUEBA-010 |

**Discrepancias.** Ninguna de fondo. Dos precisiones ya dichas en la tabla: el almacén de la credencial (mayor 3) y el origen del código de `aprobar` (bloqueante 1), en los dos casos igual o más estricto que lo pedido.

**Lo que el dictamen no pudo comprobar y sigue sin comprobarse.** Qué cabecera `Host` recibe una función y si puede imitar `x-vercel-id` (PRUEBA-017 y PRUEBA-021); en qué planes existen los tokens de proyecto (PRUEBA-022); y si Claude Code impide que un agente escriba `.claude/settings.local.json`. Este último archivo no está versionado, así que `integrar` no lo puede vigilar: es un límite de este diseño, que solo una cuenta aparte o una regla del propio Claude Code pueden cerrar, y se traslada al chat de coordinación. Sí quedaron verificados hoy: que las reglas por defecto de Gitleaks no cubren las credenciales nuevas, que `--redact` no alcanza a los informes en archivo y que el límite por dirección existe en todos los planes (`verificaciones.md`, 11).
