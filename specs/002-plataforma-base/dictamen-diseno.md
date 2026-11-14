# 002 · Dictamen de seguridad del diseño (primera vuelta)

Autor: `auditor-seguridad` · Fecha: 12/11/2026 · Sobre: `diseno.md` en su versión del 12/11/2026, antes de corregir

Transcripción literal del dictamen. La guarda el orquestador porque el `auditor-seguridad` es de solo lectura. Los números de línea se refieren a la versión del diseño que se revisó.

**Dictamen: 3 bloqueantes, 10 mayores y 9 menores. El diseño no debería pasar la puerta P1 tal como está.**

Revisión hecha leyendo: el diseño entero (`specs/002-plataforma-base/diseno.md`), la especificación, las aclaraciones, las verificaciones, los dos borradores, `docs/SEGURIDAD.md`, `docs/CALIDAD.md`, `docs/EQUIPO.md`, las cabeceras de `.claude/agents/`, `.claude/settings.json`, el gancho, `scripts/patrones-secretos.mjs` y el final de `scripts/comprobar-specs.mjs`. No he modificado ningún archivo.

## Hallazgos

### BLOQUEANTE 1. El diseño no dice de qué versión se leen las reglas, los firmantes y los verificadores al integrar

- **Dónde:** líneas 108, 118-120 y 135.
- **Qué incumple:** artículo 14; REQ-019 y REQ-053; criterio CA-014 (caso «quitar una comprobación de la batería»).
- **El problema.** La línea 108 dice que las listas viven en `scripts/bateria/reglas-integracion.json`, «ruta reservada ella misma». Pero no dice si `integrar` lee ese archivo de `main`, del candidato C o de la copia de trabajo. Lo mismo pasa con:
  - el código de `integrar.mjs`;
  - el código de la batería, que en la línea 120 se ejecuta desde el clon de C, es decir, el código de C se juzga a sí mismo;
  - el de `comprobar-rama.mjs`.

  Solo los firmantes se leen «tal como estaban en el primer padre» (línea 135).
- **Cómo se explota, sin salir del procedimiento.** Un candidato C quita `scripts/bateria/**` de `reglas-integracion.json` y, en el mismo commit, rebaja `comprobaciones.mjs`. Si la condición de «reservado» se calcula con las reglas de C, C deja de ser reservado y entra sin firma. Eso no es «saltarse el procedimiento», que es lo que el responsable aceptó en la cuestión 3 d): es el procedimiento oficial aceptando un cambio reservado.
- **Corrección mínima.** `integrar`, `aprobar`, `desplegar` y la comprobación 10:
  - leen reglas, firmantes y su propio código del primer padre (la punta de `main`), extraídos con `git show` a una carpeta temporal;
  - nunca los leen de C ni de la copia de trabajo;
  - la comprobación 10 evalúa cada M con las reglas de su primer padre;
  - el código de la batería de C solo se usa si C la cambia y lleva firma válida.
- **Prueba.** Ampliar PRUEBA-012 con tres casos que deben rechazarse sin firma:
  - C modifica las reglas y, a la vez, `comprobaciones.mjs`;
  - C borra `.gitleaks.toml`;
  - `integrar.mjs` está modificado en la copia de trabajo, y se comprueba que se ejecuta la versión de `main`.

### BLOQUEANTE 2. Lo que teclea el responsable acaba en código que cualquier agente puede modificar

- **Dónde:** líneas 147, 155, 161, 285 y 321-324.
- **Qué incumple:** artículos 14 y 13; REQ-053 y REQ-058.
- **El problema.** `npm run aprobar` y `npm run desplegar -- produccion` se ejecutan desde la copia de trabajo compartida. Allí los agentes con Bash o Write pueden cambiar:
  - `scripts/plataforma/*.mjs`, que antes de integrarse no está protegido;
  - un `preaprobar` o `predesplegar` en `package.json`;
  - `node_modules`;
  - la variable de usuario `NODE_OPTIONS=--require …` (con `setx`);
  - `.git/config` (`core.fsmonitor`, `core.pager`, `diff.external`);
  - `.gitattributes` (`-diff` hace que la persona vea «Binary files differ»);
  - el `PATH` (en esta máquina hay dos `ssh-keygen`: el de Git, OpenSSH 10.6, y el de Windows, 9.5).
- **Cómo se explota.** Con eso, un agente (o una página que le inyecte instrucciones, amenaza A-16) puede:
  - imitar la petición de la frase de paso y quedársela;
  - copiar la clave cifrada, que está en la misma cuenta;
  - firmar después lo que quiera.

  Esas firmas son válidas, así que **no las detecta ningún control posterior**. Lo mismo vale para el token de producción, que se teclea dentro de `desplegar.mjs`.
- **Por qué el diseño lo presenta mal.** La línea 161 dice que el diseño «**impide** que un agente fabrique una aprobación». La 324 dice que lo que impide desplegar en producción es que «ningún agente tiene el token». El propio cuadro de la línea 155 reconoce que no hay garantía si la frase de paso se teclea donde un agente pueda capturarla, y el procedimiento del diseño obliga a teclearla precisamente ahí. La aceptación 3 d) se dio con la promesa de que se detectaría después; aquí no se detecta.
- **Corrección.** Una de estas tres, decidida por el responsable antes de P1:
  1. **Cuenta de Windows aparte para los agentes** (asunto A-3 b). Es la única barrera real; resuelve también A-3 y la mayor parte de A-4.
  2. **Endurecer:**
     - llave física ya, no en la fase 6 (A-10: `ed25519-sk` con `verify-required`), para que la clave no se pueda copiar;
     - las órdenes que ejecuta la persona usan código extraído de `main` en una carpeta temporal, un `node` y un `ssh-keygen` con ruta absoluta, el entorno vacío (`NODE_OPTIONS`, `GIT_*`) y `git -c core.fsmonitor=false -c core.hooksPath= --no-pager diff --no-ext-diff --no-textconv --text`;
     - token de producción con la caducidad mínima, revocado tras cada despliegue y anotado.
  3. **Aceptación escrita**, con el texto corregido: «dificulta y deja rastro; no impide».
- **Prueba.** Con un `predesplegar`, un `NODE_OPTIONS` y un `.gitattributes -diff` sembrados en una copia de prueba: `aprobar` se niega a ejecutarse o enseña la diferencia real, y nada recibe lo que se teclea.

### BLOQUEANTE 3. La lista de rutas reservadas no incluye los «límites del agente» ni la configuración de los agentes fuera de `.claude/`

- **Dónde:** línea 111.
- **Qué incumple:** artículo 14, que nombra expresamente «los límites del agente» y «los permisos»; REQ-019.
- **El problema.**
  - `docs/INSTALACION-CLIENTE.md` es donde se escriben los límites del artículo 8 y no está ni en la lista de reservadas ni en la de críticas.
  - `CLAUDE.md` y `AGENTS.md` son instrucciones que cargan todos los agentes (puertas, quién aprueba) y un agente puede cambiarlas sin firma. Eso equivale a cambiar `.claude/`.
- **Corrección.** Añadir las tres rutas a la lista de reservadas.
- **Prueba.** Un cambio en cada una de esas rutas no entra sin firma.

### MAYOR 1. La batería se puede rebajar con archivos que no están reservados o con el entorno

- **Dónde:** líneas 59, 62, 63 y 111.
- **Qué incumple:** REQ-019 («definición de la batería y sus umbrales»); CA-014.
- **Vías concretas:**
  - `vitest.config.ts`: deja una sola prueba y la condición «0 pruebas» no salta.
  - `tsconfig.json`: `include` o `exclude`, `strict: false`.
  - `.gitleaksignore`: Gitleaks lo lee por defecto de la carpeta (`--gitleaks-ignore-path`, por defecto «.»).
  - Comentarios `gitleaks:allow` en el código.
  - La variable `GITLEAKS_CONFIG`, que tiene **prioridad** sobre `.gitleaks.toml` (README oficial).
  - `.npmrc`: otro registro, que puede servir también sus propias claves a `npm audit signatures`.
  - Los `ignores` de `eslint.config.mjs` y `.prettierignore`.
  - `.gitattributes`: `export-ignore` altera la exportación de la línea 301.
- **Corrección.** Reservar esos archivos, o invocar cada herramienta con su configuración tomada de `main`. Por ejemplo, Gitleaks así: `gitleaks --config <de main> --ignore-gitleaks-allow --gitleaks-ignore-path <carpeta vacía>`. Además: `npm --registry=https://registry.npmjs.org/ --userconfig <vacío>`, entorno de los procesos hijos limitado a una lista cerrada, y fallo si el número de pruebas baja respecto de `main`.
- **Prueba.** Un caso por cada vía, con un secreto o un fallo sembrado: la batería falla.

### MAYOR 2. Cadena de suministro: los scripts de instalación ven las credenciales y nadie comprueba de dónde salen los paquetes

- **Dónde:** líneas 56, 63, 281 y 558.
- **Qué incumple:** A-19, A-20; artículo 4.
- **El problema.**
  - `npm ci` ejecuta los scripts de instalación de cada dependencia con el entorno del usuario. Ahí están `DESPLIEGUE_PRE_CREDENCIAL`, `AVISOS_PRE_DSN` y quizá el secreto de paso.
  - Nadie comprueba que cada `resolved` de `package-lock.json` apunte a `https://registry.npmjs.org/` y lleve `integrity`.
  - La CLI de Vercel, con todas sus dependencias, comparte árbol con la app.
- **Corrección.**
  - Procesos hijos de la batería con el entorno limitado a una lista cerrada.
  - `npm ci --ignore-scripts` salvo excepciones listadas.
  - Una comprobación de los `resolved` dentro de la comprobación 7.
  - La CLI en una carpeta propia con su propio archivo de bloqueo.
- **Prueba.** Una dependencia de prueba cuyo script de instalación comprueba si existe la variable de la credencial (sin imprimirla): no existe. Un `resolved` hacia otro dominio hace fallar la batería.

### MAYOR 3. La credencial de preproducción en una variable de usuario de Windows llega a los prompts y a cualquier proceso

- **Dónde:** líneas 281, 284 y 290.
- **Qué incumple:** artículo 4 («fuera de los prompts»); REQ-037; aclaración 10 a), que se aceptó como «sin verla».
- **El problema.**
  - Un `env`, `printenv` o `Get-ChildItem Env:` de diagnóstico, algo habitual en un agente, envía el valor al modelo y lo deja en las transcripciones. El asunto A-3 solo contempla la lectura deliberada.
  - Si la variable falta, la CLI puede usar una sesión guardada de `vercel login` con alcance de cuenta. Además, `DESPLIEGUE_PRE_PROYECTO` lo puede cambiar un agente (`setx`). Juntas, rompen REQ-060 sin que se note.
- **Corrección.**
  - Guardar la credencial en el Administrador de credenciales de Windows (DPAPI) y que solo la lea `desplegar`.
  - Ejecutar la CLI con `--global-config <carpeta temporal vacía>`.
  - Si falta la credencial, terminar con error, sin buscar alternativas.
  - En la guía: no ejecutar nunca `vercel login` en esta máquina.
  - Reglas `deny` en `settings.json` para las órdenes que vuelcan el entorno. Las aprueba una persona.
- **Prueba.**
  - Desde una sesión de agente, volcar el entorno no muestra la credencial.
  - Con una sesión `auth.json` presente y sin la credencial, `desplegar` falla.

### MAYOR 4. Un secreto en un candidato rechazado sobrevive en el repositorio y sale del disco con la copia

- **Dónde:** líneas 79, 115, 120 y 336.
- **Qué incumple:** artículo 4; REQ-003 y REQ-047; CA-007.
- **El problema.**
  - El commit C con el secreto queda en `tarea/FFF-T-NNN` y en los clones temporales.
  - La copia diaria usa `git bundle --all`, así que el secreto se copia fuera del disco y se conserva 14 días.
  - El análisis de historial (`git log -p --all`) falla para siempre después de eso.
  - El informe de Gitleaks se escribe en un archivo temporal, y el README oficial solo dice que `--redact` tacha el valor en los registros y en la salida estándar, no en los informes. Si el proceso se interrumpe, el valor queda en `%TEMP%`.
- **Corrección.**
  - La copia incluye solo `main` y las etiquetas `integrado/*`.
  - La guía describe cómo purgar un candidato rechazado y cómo limpiar los objetos (`reflog expire`, `gc --prune=now`).
  - Los clones temporales se borran pase lo que pase.
  - Gitleaks escribe su informe con una plantilla propia que solo saca regla, archivo, línea y commit.
- **Prueba.** Ampliar PRUEBA-004: buscar el valor en `git cat-file --batch-all-objects`, en las carpetas temporales y en la última copia, sin imprimirlo. Debe dar 0 coincidencias.

### MAYOR 5. Los escáneres no reconocen las credenciales que introduce esta función

- **Dónde:** líneas 32, 62 y 281-285; `scripts/patrones-secretos.mjs`.
- **Qué incumple:** A-20; CA-007 y CA-031.
- **El problema.** Los 9 patrones del proyecto no cubren:
  - el token de Vercel (`vcp_…`, según el ejemplo de la documentación oficial);
  - el DSN de Sentry;
  - el secreto de paso.

  No he comprobado si las reglas por defecto de Gitleaks los cubren.
- **Corrección.** Añadir esos patrones al archivo del proyecto y a `.gitleaks.toml`. Además, una búsqueda por valor exacto en evidencias y salidas, sin imprimir el valor.
- **Prueba.** Un canario con la forma de cada credencial hace fallar la comprobación 6.

### MAYOR 6. Las declaraciones del responsable las escribe un agente y no se autentican

- **Dónde:** líneas 344, 359, 422 y 424.
- **Qué incumple:** REQ-054 y REQ-045; CA-043; artículo 7.
- **El problema.**
  - `REGISTRO.md`, con las aceptaciones de riesgo (REQ-071, A-1, A-3, A-4) y las entradas «declarado por el responsable», lo redacta `plataforma` y no es una ruta reservada. Un texto de agente que afirma una aceptación es justo lo que REQ-054 dice que no vale.
  - `aclaraciones.md` guarda las respuestas literales del responsable y cualquier agente puede reescribirla.
  - `GUIA.md` contiene la «orden de una línea para firmar», que la persona va a copiar.
- **Corrección.**
  - Aceptaciones y declaraciones firmadas, en un espacio de nombres propio.
  - `GUIA.md`, `REGISTRO.md`, `ordenes/` y `specs/*/aclaraciones.md` como rutas reservadas.
  - `REGISTRO.md` solo puede crecer: la comprobación 10 falla si se modifica o se borra una fila.

### MAYOR 7. Lo que el responsable acepta en el asunto A-1 cae también sobre la decisión 9

- **Dónde:** línea 595; artículo 1 en la línea 525.
- **Qué incumple:** REQ-040, REQ-043 y REQ-063; CA-035.
- **El problema.**
  - La decisión 9 admitió registros fuera de la UE **solo si no llevan valores recibidos**. La cadena de consulta y la dirección IP son valores recibidos. La opción a) del asunto A-1 tiene que volver a pedir también esa aceptación.
  - La fórmula «ningún secreto en la consulta» se queda corta para la función 001: tampoco puede viajar ningún dato personal ni de correo.
  - Next.js escribe por su cuenta el mensaje y la traza de los errores no capturados en los registros de la plataforma. El mensaje de `JSON.parse` en V8, por ejemplo, incluye la entrada recibida.
- **Corrección.** Decidirlo antes de P1. Añadir una regla de diseño: ningún error lleva en su mensaje un valor recibido.
- **Prueba.** PRUEBA-035 con un error no capturado que incluya un canario.

### MAYOR 8. La independencia de la revisión es solo declarada, y el diseño lo dice a medias

- **Dónde:** líneas 95, 104 y 157; asunto A-4.
- **Qué incumple:** artículo 6; REQ-015 y REQ-052.
- **El problema.**
  - El autor de C lo pone quien lanza `candidato` (`--agente`), sin comprobación.
  - `revision.md` es una transcripción.
  - El diseño dice que el `revisor` «no tiene herramientas de escritura», pero su cabecera incluye Bash.
- **Valoración.** El asunto A-4 es una decisión legítima del responsable, no un incumplimiento disfrazado. Pero el diseño debe declarar también que el autor es autodeclarado.

### MAYOR 9. La detección posterior es más débil de lo que se aceptó

- **Dónde:** líneas 139, 149, 158 y 337.
- **Qué incumple:** REQ-055 y REQ-056; aclaración 3 d).
- **El problema.**
  - Si alguien pone en `main` un M que rebaja `comprobar-rama.mjs` y le añade una etiqueta nueva, ningún control automático lo detecta: la copia solo mira las etiquetas anteriores.
  - El ancla y la huella de la clave «se imprimen» para cotejarlas, pero nadie está obligado a hacerlo.
  - La tarea programada ejecuta `copia.mjs` desde la copia de trabajo, que un agente puede modificar. Eso deja código que se ejecuta cada día aunque no haya ninguna sesión abierta.
- **Corrección.**
  - Las órdenes que ejecuta la persona usan el verificador del último árbol que firmó.
  - Esas órdenes muestran el ancla y la huella de la clave y exigen confirmarlas.
  - La tarea programada ejecuta solo `git bundle` o código extraído de `main`.

### MAYOR 10. Las rutas no se comparan de forma segura

- **Dónde:** líneas 108-111.
- **Qué incumple:** REQ-019.
- **El problema.**
  - Windows no distingue mayúsculas y git sí: una ruta `.Claude/agents/x.md` no casa con `.claude/**`, pero en la carpeta es el mismo directorio.
  - Renombrados, borrados y archivos nuevos que ya traen `Estado: APROBADA` no están cubiertos.
  - La línea `Estado:` puede escribirse con negritas u otro formato.
- **Corrección.**
  - Comparar sin distinguir mayúsculas y rechazar rutas que solo se diferencian en eso.
  - Usar `--no-renames`, que cuenta las dos rutas de un renombrado.
  - Interpretar la línea `Estado:` con la misma regla que `comprobar-specs.mjs`.

### MENORES

- **M-a. La ruta de diagnóstico y la guardia de región fallan en abierto** (líneas 186 y 207). Si en Vercel `ENTORNO=desarrollo`, la ruta de diagnóstico queda abierta a cualquiera y el DSN deja de ser obligatorio. La guardia de región depende de que una persona active las variables de sistema. Corrección: si hay `VERCEL_URL` o `VERCEL_REGION`, `desarrollo` no es válido; en preproducción y producción `VERCEL_REGION` es obligatoria. Comprobar el 404 de la ruta de diagnóstico en cada despliegue.
- **M-b. Secreto de paso de producción** (línea 284). No se dice dónde vive, y `vercel curl` puede crear uno nuevo en el proyecto, lo que cambia la configuración de producción.
- **M-c. Cerrojos** (línea 330). `volver-atras` no toma el mismo cerrojo que `desplegar`. La regla de no retroceder no dice qué hacer si no se sabe qué commit sirve el entorno: debe denegar.
- **M-d. Copia de trabajo desfasada** (línea 97). Mover `main` con la rama sacada deja la copia desfasada, y alguien acabará con un `reset --hard`. Hoy la rama sacada es `fase-0/cierre`.
- **M-e. Binario de Gitleaks** (línea 81). Fijar también la suma del binario y comprobarla en cada ejecución. El clon limpio no tiene `.herramientas/`.
- **M-f. Agotar el plan gratuito** (A-22). Llamar a `/api/salud` en masa agota el plan Hobby y supone 30 días de pausa. Hay que anotarlo como riesgo aceptado.
- **M-g. Inyección de instrucciones dirigida al revisor** (A-16). Falta una prueba con un comentario en el código revisado que se dirija al `revisor`.
- **M-h. La tabla de amenazas atribuye al gancho más de lo que hace** (línea 446). El gancho solo vigila Write y Edit, no lo que se escribe por Bash.
- **M-i. Firmas.** Verificar el espacio de nombres de cada tipo de firma, y pedir como mínimo 12 caracteres de la huella al aprobar.

## Tabla de amenazas

| Amenaza | Control del diseño | Prueba | ¿Basta? |
| --- | --- | --- | --- |
| Secreto en el repositorio o en su historial (A-20) | Comprobación 6, gancho, `.env*` ignorado | PRUEBA-004, PRUEBA-014 | No: MAYOR 1, 4 y 5 |
| Dependencia vulnerable o fuera del archivo de bloqueo (A-19) | `npm ci`, comprobación 7, excepción firmada | PRUEBA-006, PRUEBA-026 | No: MAYOR 2 |
| Binario de herramienta sustituido | Suma SHA-256 fijada | PRUEBA-007 | Casi: M-e |
| Comprobación no ejecutada que pasa por superada | Código de salida y forma de la salida | PRUEBA-007 | Sí |
| Cambio sin batería, revisión o evidencia | `integrar` y comprobación 10 | PRUEBA-009, PRUEBA-011 | No: BLOQUEANTE 1 |
| Aprobación fabricada (A-16) | Firma SSH | PRUEBA-010, PRUEBA-012 | No: BLOQUEANTE 2 |
| Rebajar la batería o la lista de firmantes | Rutas reservadas; firmantes del padre | PRUEBA-012 | No: BLOQUEANTE 1, MAYOR 1 y 10 |
| Commit fuera del procedimiento, reescritura, borrado | Comprobación 10, etiquetas, copia | PRUEBA-013, PRUEBA-015 | Parcial: MAYOR 9 |
| Funciones fuera de la UE | Comprobación 9, guardia, región observada | PRUEBA-005, PRUEBA-021 | Sí, con M-a |
| Credencial de preproducción usada contra producción | Dos proyectos; token de proyecto | PRUEBA-022 | Sí si existe en Hobby; MAYOR 3 (sesión guardada) |
| Un agente despliega en producción | Token tecleado; orden firmada | PRUEBA-022, PRUEBA-029 | No: BLOQUEANTE 2 |
| Credencial en salidas, registros o evidencias | Paso por el entorno; tachado | PRUEBA-032 | No: MAYOR 3 y 5 |
| Despliegue distinto del commit integrado | Exportar el commit | PRUEBA-026, PRUEBA-028 | Parcial: `.gitattributes` (MAYOR 1) |
| Despliegue defectuoso que llega a servir | Preparar, comprobar, promover | PRUEBA-024, PRUEBA-027 | Sí |
| Despliegues simultáneos | Cerrojo y no retroceder | PRUEBA-030 | Parcial: M-c |
| Vuelta atrás imposible | `rollback` y consola | PRUEBA-031 | Sí, limitado a N-1 |
| Valores recibidos en supervisión o registros (A-15) | Módulo propio sin SDK | PRUEBA-020, PRUEBA-035 | Parcial: MAYOR 7 |
| Fuga por `/api/salud` o por las páginas de error | Campo único; textos fijos | PRUEBA-018, PRUEBA-037 | Sí |
| Variable ausente que deja la app a medias | Lista cerrada; 503 | PRUEBA-019 | Parcial: M-a |
| Supervisión caída | Tiempo máximo; sin cola | PRUEBA-020, PRUEBA-036 | Sí |
| Abuso de la ruta de error | Comparación de `Host`; límite de eventos | PRUEBA-017, PRUEBA-034 | Sí, con M-a |
| Caída no detectada | UptimeRobot | PRUEBA-037 | Sí |
| Secretos compartidos entre entornos | Proyectos separados | PRUEBA-025 | Sí |
| HTTP sin cifrar, incrustación, indexación | 308; cabeceras | PRUEBA-023 | Sí |
| Pérdida del repositorio | Copia diaria | PRUEBA-015 | Sí, pero MAYOR 4 |
| Instrucciones en documentación externa | No se siguen | PRUEBA-032 | Sí |
| Datos reales en plan gratuito | Regla y confirmación | PRUEBA-039 | Sí |
| **Nueva:** reglas o verificador leídos del candidato | Ninguno | Falta prueba | BLOQUEANTE 1 |
| **Nueva:** captura de lo que teclea la persona mediante código, `NODE_OPTIONS`, `.git/config`, `PATH` | Ninguno | Falta prueba | BLOQUEANTE 2 |
| **Nueva:** límites del agente o `CLAUDE.md` cambiados sin firma | Ninguno | Falta prueba | BLOQUEANTE 3 |
| **Nueva:** configuración de pruebas o escáneres no reservada; `GITLEAKS_CONFIG`; `.npmrc` | Ninguno | Falta prueba | MAYOR 1 |
| **Nueva:** scripts de instalación que leen la credencial; `resolved` fuera del registro | Ninguno | Falta prueba | MAYOR 2 |
| **Nueva:** credencial volcada al modelo; sesión guardada de la CLI | Ninguno | Falta prueba | MAYOR 3 |
| **Nueva:** secreto de un candidato rechazado en la copia; informe temporal de Gitleaks | Ninguno | Falta prueba | MAYOR 4 |
| **Nueva:** credenciales nuevas sin patrón de escáner | Ninguno | Falta prueba | MAYOR 5 |
| **Nueva:** declaraciones del responsable o guía falsificadas | Ninguno | Falta prueba | MAYOR 6 |
| **Nueva:** verificador rebajado y tarea programada alterada | Parcial | Falta prueba | MAYOR 9 |
| **Nueva:** rutas con mayúsculas, renombradas, borradas o nuevas | Ninguno | Falta prueba | MAYOR 10 |
| **Nueva:** agotar el plan gratuito (A-22) | Solo aviso | Falta prueba | Riesgo que debe aceptar la persona (M-f) |
| **Nueva:** inyección de instrucciones al revisor | Reglas del agente | Falta prueba | M-g |

## Comprobación de la constitución del diseño (líneas 523-540)

| Artículo | ¿De acuerdo? |
| --- | --- |
| 1 Privacidad | Sí con la reserva, pero la reserva también afecta a la decisión 9 (MAYOR 7) |
| 2 Aislamiento | Sí, no aplica |
| 3 Cierre en fallo | **No**: BLOQUEANTE 1 y M-a fallan en abierto |
| 4 Secretos | **No**: MAYOR 3, 4 y 5. El límite declarado se queda corto |
| 5 Especificación | Sí |
| 6 Revisión independiente | Sí, siempre que el responsable acepte A-4 de forma expresa antes de P1 |
| 7 Entradas no confiables | **No**: MAYOR 6 |
| 8 Límites en el anfitrión | **No** es «no aplica»: la lista de reservadas de este diseño deja fuera `INSTALACION-CLIENTE.md` (BLOQUEANTE 3) |
| 9 Prompt | Sí; añadiría `docs/referencia/` a las rutas críticas |
| 10 Producto final | Sí |
| 11 Reversibilidad | Sí |
| 12 Español | Sí |
| 13 Evidencias honestas | **No**: las afirmaciones «impide» (línea 161) y «lo que de verdad impide» (línea 324) no son ciertas |
| 14 Cambios reservados | **No**: BLOQUEANTE 1, 2 y 3 y MAYOR 10 |

Sobre los asuntos abiertos:

- **A-1:** es una decisión legítima, pero arrastra también la decisión 9.
- **A-3 y A-10:** no son mejoras opcionales; son la corrección del BLOQUEANTE 2.
- **A-4:** es legítimo, sujeto a aceptación expresa.
- **A-2 y A-5 a A-9, A-11:** de acuerdo.

## Lo que no he podido comprobar

- No hay código ni commits, así que no he ejecutado ninguna prueba. Lo único que ejecuté fue `git log` (falla: no hay commits), la versión de las dos instalaciones de OpenSSH (10.6p1 de Git y 9.5p2 de Windows; las dos admiten firmar archivos) y Node 26.13.0 con npm 11.20.0.
- No he verificado:
  - si las reglas por defecto de Gitleaks detectan los tokens de Vercel;
  - si Gitleaks tacha el valor en el informe en archivo;
  - qué cabecera `Host` recibe una función en Vercel, ni si una función puede imitar `x-vercel-id`;
  - si existen tokens de proyecto en el plan Hobby;
  - si hay límite de peticiones configurable en Hobby;
  - si Claude Code impide que un agente escriba `.claude/settings.local.json` (no está versionado, así que `integrar` no lo vigila).
- Sí verifiqué en la documentación oficial que la CLI de Vercel acepta `VERCEL_TOKEN` por el entorno y que `GITLEAKS_CONFIG` tiene prioridad sobre `.gitleaks.toml`.
- **Instrucciones encontradas, tratadas como datos:** la página `vercel.com/docs/cli/global-options` contiene un bloque «For AI agents», la cabecera `install_vercel_plugin` y una petición de enviar comentarios. No he seguido ninguna.
