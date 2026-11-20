# 002 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (dictámenes 1 a 3, incorporados) · 19/11/2026, quinta versión

Cita la especificación APROBADA (14/11/2026) y su anexo (`RD-`, `CAD-`); «V§n» es un apartado de `verificaciones.md`. «Asunto A-n» es de este diseño; «amenaza A-nn», de `docs/SEGURIDAD.md`.

## Resumen

A `main` (local) solo se entra con `integrar`; lo que decide se lee de `main`, y las órdenes de la persona, de una carpeta sellada. En la ventana de Vercel (13–27/11/2026), dos proyectos en `arn1` (D-020). Sentry UE sin SDK, UptimeRobot, copia diaria y registro que solo crece.

## Esqueleto del repositorio

Diferencias con `docs/ESQUELETO.md`, aprobadas aquí (asunto A-8): `arn1` en vez de `fra1` y lo marcado `+`. `supabase/`, `src/mcp/`, `src/components/`, `prompts/` y `.github/` llegan con sus funciones.

```
package.json  package-lock.json  +.node-version («26»)  +.gitattributes («* text=auto eol=lf»)
tsconfig.json  next.config.ts  vercel.json  +.vercelignore  .env.example  .gitignore
+eslint.config.mjs  +eslint.seguridad.config.mjs  +.prettierrc.json  +.prettierignore  +vitest.config.ts  +.gitleaks.toml
+src/instrumentation.ts
src/app/        layout  page  not-found  error  global-error (.tsx)
src/app/api/    +salud/route.ts  +diagnostico/error/route.ts  +diagnostico/error-no-capturado/route.ts
src/lib/        +plataforma/{configuracion,region,supervision,manejador,errores,entrada}.ts  registro/{registro,codigos}.ts
scripts/        comprobar-specs.mjs  patrones-secretos.mjs  probar-modelo.mjs   (ya existen)
  +bateria/ ejecutar comprobaciones entorno-limpio comprobar-region comprobar-rama escanear-secretos
    auditar-dependencias analisis-estatico instalar-herramientas (.mjs); herramientas.json
    reglas-integracion.json scripts-de-instalacion.json gitleaks-informe.tmpl
  +plataforma/ lanzador persona candidato integrar aprobar declarar sellar desplegar comprobar-despliegue
    comprobaciones-despliegue comprobar-inicio volver-atras estado copia restaurar-copia
    purgar-candidato buscar-valor subir-copia (.mjs)
+herramientas/despliegue/  package.json  package-lock.json   (solo la CLI de Vercel)
tests/unit/plataforma/  +tests/plataforma/ (inventario-rutas.json, doble de la CLI)
+docs/operacion/  GUIA.md REGISTRO.md entornos.md entornos.json firmantes-autorizados
                  excepciones-dependencias.json ordenes/ declaraciones/ ventana/{calendario,seguimiento}.md
```

Los scripts de `bateria/` y `plataforma/` solo importan módulos de Node. `package.json` exacto; los `VERIFICAR` se fijan al instalar, en el arranque:

```json
{
  "name": "nido",
  "version": "0.1.0",
  "private": true,
  "license": "UNLICENSED",
  "engines": { "node": "26.x", "npm": ">=11 <12" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run --config vitest.config.ts",
    "tipos": "next typegen && tsc --noEmit -p tsconfig.json",
    "estilo": "prettier --check . --config .prettierrc.json --ignore-path .prettierignore && eslint --config eslint.config.mjs --max-warnings 0 .",
    "arnes": "node scripts/comprobar-specs.mjs",
    "bateria:propia": "node scripts/plataforma/lanzador.mjs bateria --propia",
    "control": "git -c core.fsmonitor=false --no-pager show refs/heads/main:scripts/plataforma/lanzador.mjs | node --input-type=module -",
    "bateria": "npm run control -- bateria",
    "candidato": "npm run control -- candidato",
    "integrar": "npm run control -- integrar",
    "desplegar": "npm run control -- desplegar",
    "volver-atras": "npm run control -- volver-atras",
    "estado": "npm run control -- estado",
    "comprobar-inicio": "npm run control -- comprobar-inicio",
    "purgar-candidato": "npm run control -- purgar-candidato",
    "copia:restaurar": "npm run control -- restaurar-copia"
  },
  "dependencies": { "next": "16.4.6", "react": "19.3.1", "react-dom": "19.3.1" },
  "devDependencies": {
    "@types/node": "VERIFICAR: última 26.x",
    "@types/react": "VERIFICAR: última 19.x",
    "@types/react-dom": "VERIFICAR: última 19.x",
    "eslint": "10.15.0",
    "eslint-config-next": "16.4.6",
    "eslint-plugin-security": "4.2.1",
    "prettier": "3.10.1",
    "typescript": "VERIFICAR: última 6.0.x",
    "typescript-eslint": "8.73.0",
    "vitest": "5.1.1"
  }
}
```

- Versiones exactas (`--save-exact`); manda el bloqueo (`npm ci --ignore-scripts`). `engines.node` fija Node 26 también en Vercel (T-001).
- Órdenes directas (`dev` a `arnes`): copia de trabajo. De control: `control` lee el lanzador de `refs/heads/main`; antes del ancla, `bateria:propia`. Lanzadas por un agente no son barrera (`NODE_OPTIONS`, editar `control`): su batería solo es evidencia si la repite una orden sellada o el CI de la 003. Por `npm run`, `desplegar` y `volver-atras` solo aceptan `preproduccion`.
- VERIFICADOS el 19/11/2026 en `registry.npmjs.org/<paquete>/latest`. TypeScript 6.0.x porque `typescript-eslint` exige `<6.1.0`; ESLint 9.x si `eslint-config-next` no admite la 10 (V§5.3). Fuera del manifiesto: CLI `vercel` 66.2.0 (VERIFICAR sus opciones) y Gitleaks 8.30.1 (21/03/2026).

**Consumidores.** *Fase 3*: Playwright, Tailwind, sus órdenes, la comprobación «interfaz» y el 404 de `/muestra`, como cambio reservado. *003*: batería en Linux con historial y los 11 pasos; sumas de Gitleaks Linux; pgTAP como dato; cómo la comprobación 10 reconoce una integración por petición. *001*: integra tras el ancla, sigue «App base», firma lo reservado que necesite y no pone **nada secreto, personal ni de correo en la ruta ni en la consulta**. Sus C-1 a C-6: cambio firmado pendiente; C-4 y C-5 ya constan aquí.

## Orden de construcción

0, persona: datos, cuenta aparte (asunto A-3) y, después, en la suya, clave y `delegacion`; una clave anterior a separar cuentas se rota con firma y se vuelve a firmar `ancla`. 1, en `arranque/002`: manifiesto, configuraciones, `/`, `/api/salud`, batería, lanzador, `candidato`, `integrar`, `aprobar`, `declarar`, `sellar`, reglas y firmantes; desbloquea a la 001 y las fases 2 a 4. 2a: `src/lib/**`, `instrumentation.ts`, cabeceras, análisis e inventario. 2b: `vercel.json`, CLI y órdenes de despliegue contra el doble. 2c, a la vez que la 001: copia, purga, `buscar-valor`, diagnóstico, guía. 3, ventana: `pre-nido`, con PRUEBA-029 lo primero. 4: `nido` y el resto, sin tocar preproducción en los días de la 001. 5: pago o retirada.

**Arranque** (asunto A-12): aplazado con el ancla (§Aplazado a la 003); por D-025 el orden lo fija `plan.md`.

## Piezas y responsabilidades

### Origen del código que decide

Carpetas de control y sellada y clon del candidato: aplazados con el sello (§Aplazado a la 003). Hasta entonces, lo que decide se lee de `main` limpio.

### Batería (REQ-002 a REQ-005)

`npm run bateria` [`--historial`] [`--evidencia`] [`--solo <n>`], en serie: por comprobación `SUPERADA`, `FALLIDA` o `NO EJECUTADA` y duración; commit, Node, origen del control, `RESULTADO GLOBAL` y total. Sale con 0 solo si todas se superan. `--solo`: no admite `--evidencia`, ejecuta la previa y dice `RESULTADO PARCIAL`.

| N.º | Herramienta | Falla si | Máx. |
| --- | --- | --- | --- |
| Previa | Node, no admitidos, `npm ci --ignore-scripts` | Node no 26.x o npm no 11; sin bloqueo; no admitido; `npm ci` falla o cambia el bloqueo | 4 min |
| 1 Tipos | `next typegen`; `tsc --noEmit -p` | Error | 2 |
| 2 Estilo | `prettier --check`; `eslint --max-warnings 0` | Diferencia o aviso | 2 |
| 3 Pruebas | `vitest run --config` | Fallo, 0 pruebas, `.skip`, `.only`, `.todo` | 3 |
| 4 Compilación | `next build` | Salida no 0 | 4 |
| 5 Análisis | `eslint --config eslint.seguridad.config.mjs --no-inline-config --format json` | Regla en `error` | 2 |
| 6 Secretos | `patrones-secretos.mjs` y Gitleaks sobre lo versionado y lo añadido (`--historial`: todo) | Hallazgo; binario ausente o con otra suma | 2 (10) |
| 7 Dependencias | Procedencia, `npm audit --json`, `npm audit signatures`, en los dos árboles | `resolved` ajeno a `https://registry.npmjs.org/` o sin `integrity`; alta o crítica sin excepción; firma inválida; informe ilegible | 2 |
| 8 Arnés | `comprobar-specs.mjs` | Salida no 0 | 1 |
| 9 Región | `comprobar-region.mjs` | Abajo | 1 |
| 10 Rama | `comprobar-rama.mjs` | «Integración» | 2 |

Si falla la previa, todas quedan `NO EJECUTADA` (asunto A-5 a). Total **15 min** (25 con historial). Cada una es un proceso hijo con su tiempo; solo se supera con salida 0 **y** la forma esperada (JSON legible, al menos una prueba, binario con su suma).

**Que no se rebaje.** (1) Los hijos reciben solo `SystemRoot`, `windir`, `SystemDrive`, `PATH` (node, git, sistema), `TEMP`/`TMP` propios, `USERPROFILE`, `HOME`, `APPDATA` y `LOCALAPPDATA` hacia un perfil vacío, `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL` vacío, `CI=1`, `NO_COLOR=1`, `NEXT_TELEMETRY_DISABLED=1`. (2) Configuración por argumento: ESLint y Vitest `--config`; Prettier `--config --ignore-path`; `tsc -p`; Gitleaks `--config <control>/.gitleaks.toml --ignore-gitleaks-allow --gitleaks-ignore-path <vacía>`; npm `--registry=https://registry.npmjs.org/ --userconfig <vacío> --globalconfig <vacío>`. (3) No admitidos: `.gitleaksignore`, `.npmrc`, `.eslintrc*`, `prettier.config.*`, `vitest.workspace.*`, `vite.config.*`, `vercel.ts`, `pnpm-lock.yaml`, `yarn.lock`, `.gitmodules`, otro `eslint.config.*`, `.prettierrc*` o `tsconfig*.json`, enlaces y submódulos.

**Umbrales.** Bloquean `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`, `react/no-danger`, todas las de `eslint-plugin-security` salvo `detect-object-injection`, `detect-non-literal-fs-filename`, `detect-non-literal-regexp` y `detect-possible-timing-attacks`, `@typescript-eslint/ban-ts-comment` y las del proyecto: `process.env` fuera de `configuracion.ts`; `console` fuera de `src/lib/registro/`; `runtime = 'edge'` o `preferredRegion`; `route.ts` sin `manejador.ts`; `new Error` no literal o `throw` de otra cosa que `ErrorDeAplicacion`; `JSON.parse` o `new URL` sobre la petición fuera de `entrada.ts`; la clave secreta fuera de su archivo (fase 2). Dependencias `high` o `critical` bloquean salvo (RD-049) sin corrección **y** con entrada vigente (30 días como mucho, con nota del `auditor-seguridad`) en `excepciones-dependencias.json`, cuya firma es la aceptación.

**Suministro** (A-19): siempre `--ignore-scripts`; excepciones exactas en `scripts-de-instalacion.json` (reservado, vacío), con entorno limpio; la CLI, en su árbol. **Secretos**: patrones nuevos en `patrones-secretos.mjs` y `.gitleaks.toml` para `vcp_…`, `github_pat_…`, el DSN de Sentry y asignaciones a las variables de este diseño (V§11.6); informe con `gitleaks-informe.tmpl` (regla, archivo, línea, commit) en temporal; `candidato` escanea antes de crear objetos; búsqueda por valor exacto en la salida de `desplegar` y con `buscar-valor` (persona: lee sin eco y cuenta coincidencias en objetos, evidencias, temporales y copia). **Gitleaks**: versión y sumas del paquete (Windows y Linux x64) y del binario en `herramientas.json`, comprobadas en cada ejecución; la previa lo instala en una caché fuera del repositorio.

**Región** (REQ-005). Falla si falta `vercel.json`; `regions` no es `["arn1"]`; hay `functionFailoverRegions` o regiones en `functions`; `installCommand` no es `npm ci --ignore-scripts`; existe `vercel.ts`, `proxy.*` o `middleware.*`; `src/` declara `edge` o `preferredRegion`; `desplegar.mjs` pasa `--regions`; `engines.node` no es `26.x`. Es la barrera (V§11.4). **Evidencia**: `specs/<función>/evidencias/integracion/<C>/bateria.md` con los campos de `docs/CALIDAD.md`, resultados, número de pruebas y huella del control; se niega si el clon tiene cambios.

### Integración (REQ-006 a REQ-008), por D-025

Hasta el CI de la 003, git normal en la copia local. Es procedimiento, no barrera técnica: un agente con acceso al repositorio podría mover `main` (artículo 13; asunto A-4). No hay `push`.

1. **Rama por tarea.** `tarea/T-NNN` desde la punta de `main`, un agente que implementa. Primero la prueba, en su commit y en rojo (citado en `revision.md`); después el código.
2. **`npm run verificar` en verde** en la punta de la rama, árbol limpio, tras `npm ci --ignore-scripts`. Encadena con `&&` y para en el primer fallo: `tipos`, `estilo`, `test`, `aislamiento`, `arnes`, `build` (§Esqueleto, más):
   - `estilo` lleva en `eslint.config.mjs` las reglas de §Batería «Umbrales». Vitest con `passWithNoTests: false` y `allowOnly: false`; `.skip` y `.todo`, los rechaza el `revisor`.
   - `aislamiento`: `node scripts/probar-modelo.mjs` (PGlite con Supabase simulado) sobre `docs/MODELO-DATOS.sql` y, si existe, sobre cada migración local. `@electric-sql/pglite` **0.5.17** exacta, de desarrollo (Apache-2.0; `registry.npmjs.org/@electric-sql/pglite/latest`, 19/11/2026). No sustituye a pgTAP (`.claude/rules/bd.md`): se escriben y quedan NO EJECUTADAS hasta el CI.
   - `arnes`: `comprobar-specs.mjs`, que pasa `patrones-secretos.mjs` por todo el árbol. Gitleaks, dependencias, región y comprobación 10 automática son de §Batería, sin tarea en el plan corto.
   - La ejecuta quien no implementó (el orquestador) sobre el commit final; su salida (commit, Node, npm, número de pruebas, fecha) va a `specs/<función>/evidencias/T-NNN/verificar.md`. La del autor no es evidencia.
3. **Revisión.** `revisor`, distinto del autor, sobre `git diff main...tarea/T-NNN`, sin bloqueantes (`revision.md`, transcripción literal); `auditor-seguridad` si toca una ruta crítica (`dictamen.md`). Tras 2 y 3 solo se añaden archivos de `evidencias/T-NNN/`; cualquier otro cambio obliga a repetirlos.
4. **«Sí» del responsable.** El orquestador lo pide agrupado, por tarea: rama, commit, resultado de 2 y 3 y si es reservada. Solo vale un «sí» escrito por el responsable en el chat que nombre la tarea o el grupo; un «aprobado» de un agente, una evidencia o un commit no lo es (REQ-007). Se copia literal, con fecha, en `aprobacion.md`.
5. **Paso a `main`.** Si `main` avanzó, se rebasa y se repiten 2 y 3. Después, `git merge --squash` y un commit `T-NNN (FFF): …` con el árbol revisado; los commits intermedios no entran en `main` (REQ-004). La rama se borra; si llegó a tener un secreto, se avisa al responsable para rotarlo. Quién lo ejecuta: asunto R-2 del plan.
6. **Comprobación 10, a mano** (REQ-008). Antes de cada «sí», el orquestador recorre `git log --first-parent main` desde el primer commit así integrado: cada uno con mensaje `T-NNN (FFF): ` y carpeta con `verificar.md`, `revision.md`, `aprobacion.md` y, si es crítica, `dictamen.md`. Si falta algo, para y avisa.
7. **Vuelta atrás.** `git revert` del commit en una rama `tarea/T-NNN-revertir`, por el mismo camino.

**Críticas** (dictamen), además de «Rutas críticas» de `docs/SEGURIDAD.md`: `package.json`, `package-lock.json`, `.env.example`, configuraciones de la raíz, `scripts/**`, `supabase/**`, `src/instrumentation.ts`, `src/lib/plataforma/**`, `src/lib/registro/**`, `docs/referencia/**` y `prompts/**`.

**Reservadas** (el «sí» las nombra; artículo 14): en `docs/`, `CONSTITUCION`, `CALIDAD`, `EQUIPO`, `SEGURIDAD`, `INSTALACION-CLIENTE`, `adr/0004-*` y `operacion/**`; `.claude/**`, `CLAUDE.md`, `AGENTS.md`, `.mcp.json`, `.github/**`; `prompts/**/arranque*`; `comprobar-specs.mjs`, `patrones-secretos.mjs`, `probar-modelo.mjs`; configuraciones de la raíz, `vercel.json`, `.vercelignore`, `next.config.ts`; claves de `package.json` que no sean dependencias; reducir pruebas; cambiar líneas de un `aclaraciones.md`; tocar una especificación aprobada o su `Estado:`.

### Aplazado a la 003

Por D-025, hasta el CI de la 003 y siempre antes de publicar. Lo que otros apartados (Resumen, Orden de construcción, Origen del código, Despliegue, Ventana, Copia, Flujo) digan de esta lista queda en suspenso y rige «Integración»; lo «sellado» o «de control» se ejecuta desde `main` limpio. El texto anterior sigue en el historial de git.

| Elemento | Por qué se aplaza |
| --- | --- |
| Firmas (`ssh-keygen -Y`, espacios, `firmantes-autorizados`, clave) | Solo son barrera con la cuenta aparte (asunto A-3) y el CI |
| `aprobar`, `declarar` y las declaraciones (`ancla`, `cuenta-separada`, `condiciones-inicio`, `calendario-revisado`, `aceptacion-riesgo`, `estado-de-entorno`, `decision-pago`, `retirada-proyectos`) | Las sustituye el «sí» expreso, copiado en `aprobacion.md` o, si no es de una tarea, en `aclaraciones.md` |
| Ancla, `arranque/002`, `integrado/NNNN`, `candidato`, `integrar`, `trabajo`, carpetas de control y sellada, `sellar`, órdenes de la persona | Dependen de la firma; mientras, rama por tarea y comprobación 10 a mano |
| Delegaciones (`delegacion`, `fin-delegacion`) | D-019 rige como decisión registrada; sin firma no hay archivo que verificar |
| Calendario firmado y paso 0 de `desplegar` | El calendario es un documento normal; cambiarlo pide el «sí» |
| Producción (`nido`, `desplegar produccion`, `orden-produccion`; REQ-016) | Exige firma: nada en producción hasta la 003; la prueba real de la 001 es en preproducción (aclaración 5). A confirmar (plan, R-4) |

Amenazas sin cambio. Mientras dure, firma fabricada (A-16), captura de lo tecleado, commit fuera de procedimiento y revisión inventada se controlan por procedimiento: rama por tarea, `verificar` por otro, `revisor` y `auditor-seguridad`, «sí» y ninguna producción. Las garantías del producto (privacidad, RLS, cierre en fallo) no cambian.

### App base (REQ-009, REQ-019)

App Router y TypeScript en `src/`, a mano. Sin `proxy`, acciones de servidor, formularios, cookies ni base de datos.

| Ruta | Respuesta |
| --- | --- |
| `/` (GET, HEAD) | 200, HTML estático en español: nombre y «Servicio en funcionamiento» |
| `/api/salud` (GET, HEAD) | 200 `{"estado":"ok"}` o 503 `{"estado":"error"}`, `Cache-Control: no-store` |
| `/api/diagnostico/error` (GET) | 404 salvo si `Host` es `VERCEL_URL` (dirección generada y protegida): 500 `{"estado":"error"}` |
| `/api/diagnostico/error-no-capturado` (GET) | Igual, pero lanza sin capturar un error con un canario constante |
| Otra | 404 «Página no encontrada» |

Escritura: 405 en manejadores (V§6) y nunca 2xx en páginas (PRUEBA-025). `/api/salud` valida la configuración, exige fuera de `desarrollo` `VERCEL_REGION` igual a `arn1` y no lee la petición; si falla, 503 y evento. Páginas con `lang="es"`; `error` y `global-error`: «Se ha producido un error. Inténtalo de nuevo más tarde.» y «Reintentar», sin mensaje ni traza; un `h1`, `role="alert"`, teclado.
**Ningún error lleva un valor recibido** (para toda función): (1) todo `route.ts` usa `manejador.ts` (captura, código, 500 genérico), salvo el diagnóstico no capturado; (2) solo `ErrorDeAplicacion(codigo)` con códigos de `codigos.ts`; (3) `JSON.parse`, `new URL` y analizadores que citan su entrada, solo en `entrada.ts`, que lanza `entrada_invalida` sin `cause`; (4) fuera de `desarrollo`, `register()` sustituye `console.*` por `{nivel, codigo: "salida_no_estructurada"}` sin argumentos y `registro.ts` conserva el original; (5) lo escrito sin `console` lo mide PRUEBA-047.

Cabeceras en `next.config.ts` (`poweredByHeader: false`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` (salvo `/oauth/autorizar`: `same-origin`, 001 C-4), `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Robots-Tag: noindex`; HSTS, la plataforma; política completa, fase 3 (A-21).

**Configuración** (RD-066). Único lector de `process.env`: `configuracion.ts`, lista cerrada sin valores por defecto: `ENTORNO` (`desarrollo`, `preproduccion`, `produccion`), `SUPERVISION_DSN` (secreta, `https` al servidor UE de Sentry, obligatoria fuera de `desarrollo`), `COMMIT_DESPLEGADO` (7 a 40 hexadecimales, la pone `desplegar`) y las de sistema `VERCEL`, `VERCEL_ENV`, `VERCEL_REGION`, `VERCEL_URL` (las activa una persona). Ausente o mal formada: 503 y no se promueve. Con alguna `VERCEL*`, `desarrollo` no vale.

### Supervisión, disponibilidad y avisos (REQ-018, REQ-019)

**Sentry UE (Fráncfort), plan Developer, sin SDK** (V§2, V-112), un proyecto por entorno (un SDK captura la petición). `supervision.ts` solo envía `event_id`, `timestamp`, `platform`, `level: error`, `environment`, `release` (`COMMIT_DESPLEGADO`), `transaction` y etiqueta `ruta` (ambas, la plantilla `context.routePath`, nunca la pedida), etiqueta `codigo` (`error_no_controlado`, `configuracion_invalida`, `region_no_permitida`, `diagnostico_provocado`, `entrada_invalida`, `despliegue_fallido`, `comprobacion_posterior_fallida`), etiqueta `metodo` (lista cerrada u `otro`) y `fingerprint: [ruta, codigo]`. Un envío por error, 2 s como mucho, sin reintento ni cola, 20 por minuto e instancia; si falla, `supervision_no_disponible` en el registro. `configuracion_invalida` no llega a Sentry: la detectan el monitor externo y el registro. Una persona activa «no almacenar IP» y la alerta de incidencia nueva. `registro.ts`: línea JSON `{nivel, codigo, ruta, momento}`.

**UptimeRobot gratuito** (V§3): un monitor por entorno sobre `/api/salud` cada 5 min. Avisos al correo del responsable: error nuevo (Sentry, 15 min); caída, pausa o fin de la prueba (UptimeRobot, 20 min); despliegue fallido (`desplegar`, con el DSN de avisos en preproducción; al momento en producción).

Dónde queda (RD-043): Sentry, Fráncfort, 30 días; Vercel, fuera de la UE a estos efectos, con ruta, **consulta**, IP y agente, 1 día o 30 con «Observability Plus» (V§11.3). Es riesgo y gasto del responsable (asunto A-1): sin su `aceptacion-riesgo`, PRUEBA-047 no se supera en eso y `comprobar-inicio` avisa.

### Entornos y credenciales (REQ-010 a REQ-012)

Proyectos `pre-nido` y `nido` en `https://pre-nido.<dominio>` y `https://nido.<dominio>` (CNAME en Axarnet): Pro en prueba y luego de pago o retirada, nunca Hobby (RD-071); solo `arn1`; protección de serie (dominio propio público, direcciones generadas protegidas); WAF de 100 peticiones por minuto e IP en `/api/*`; Sentry propio; datos ficticios o ninguno. Los distingue `ENTORNO`; no se conectan al remoto. Dos, porque un token se limita a un proyecto (V§11.2; RD-060).

| Credencial | Alcance | Dónde | Quién |
| --- | --- | --- | --- |
| `DESPLIEGUE_PRE_TOKEN` | `pre-nido`; caduca el 27/11/2026 o antes (90 días si se contrata) | DPAPI del perfil de los agentes (V§11.9), escrito sin eco por una persona; nunca en variables | `desplegar`, `volver-atras`, `estado` |
| `AVISOS_PRE_DSN`, `PROTECCION_PRE_SECRETO` | Eventos; secreto de paso de `pre-nido` | El mismo almacén | `desplegar`, `comprobar-despliegue` |
| Token y secreto de paso de producción | `nido`; vida mínima | No se guardan | Responsable |
| Clave de aprobaciones | Firmar | Cuenta del responsable, creada tras separarla (asunto A-3) | Responsable |
| Token de subida a GitHub | De grano fino: solo `Nido`, escritura de contenidos, sin administración | DPAPI de la cuenta del responsable, creado tras separarla | `subir-copia` |

Identificadores en `entornos.json` (reservado). La CLI corre solo desde las órdenes, con entorno limpio, `--global-config` vacío y el token en el entorno del hijo; sin credencial, error; nunca `vercel login` ni `vercel curl`; ninguna orden crea proyectos, tokens ni secretos; los agentes no tienen complementos ni MCP de Vercel, ni sesión de `gh` ni credencial de github.com en GCM (las quita una persona); `comprobar-inicio`, con `GIT_TERMINAL_PROMPT=0` y `GCM_INTERACTIVE=never`, comprueba que `git ls-remote origin` falla (remoto privado) y que `gh` no tiene sesión. Límite: aclaración 10 a.

### Despliegue y vuelta atrás (REQ-014 a REQ-017)

`npm run desplegar -- preproduccion` (agente) o `desplegar produccion` (responsable, carpeta sellada):

0. Se niega sin `condiciones-inicio` firmada, si el calendario no es el sellado, tras `retirada-proyectos` o después del 27/11/2026 sin `decision-pago` «contrata».
1. Comprobación 10 en verde; el commit es un M con `bateria.md` superada; `produccion` repite antes la batería sellada.
2. Cerrojo por entorno, común con `volver-atras`.
3. Si se sirve un commit posterior, para; **si no sabe cuál se sirve, no despliega**.
4. Exporta el commit objeto a objeto y comprueba su árbol (RD-034; asunto A-5 d).
5. `vercel deploy --prod --skip-domain --yes` con `COMMIT_DESPLEGADO`; compila con Node 26 y `npm ci --ignore-scripts`, imprimiendo la huella del árbol instalado.
6. En la dirección protegida del nuevo (lista en `comprobaciones-despliegue.mjs`): `/api/salud` 3 veces, 200, cuerpo exacto, menos de 3 s, segmento de la función (no el de borde) de `x-vercel-id` igual a `arn1`; `/` 200 con `lang="es"` y cabeceras; ruta inexistente 404; `POST /api/salud` 405.
7. `vercel promote`.
8. En la dirección estable: lo de 6, HTTP 308 sin contenido, diagnósticos 404 y que sirve el nuevo; si falla, vuelta atrás y aviso.
9. Evidencia en `specs/<función>/evidencias/despliegues/`, sin los valores manejados.

Si fallan 5 o 6, nunca sirve. Preproducción, sin persona (RD-035). Producción (REQ-016): commit ya servido en preproducción con la comprobación superada y `orden-produccion` firmada antes. `estado` muestra commit y fecha servidos, copia y ventana. `volver-atras`: cerrojo, `vercel rollback` (sin compilar) y paso 8, **10 min como máximo**; alternativa en la consola (V§11.5).

### Ventana (REQ-014)

Lo local, con el doble de la CLI; cuándo va cada prueba, en el mapa (asunto A-14 a).

Condiciones de inicio (RD-074): `comprobar-inicio` comprueba las verificables y señala las declarables; el responsable firma `condiciones-inicio` con las fechas y las huellas de `main` y del calendario.

Calendario (RD-075) en `ventana/calendario.md`, cambiable solo con `calendario-revisado`; `seguimiento.md` solo crece (hecho, no ejecutado o trasladado). Con primer despliegue el día D, la 001 prepara y empieza su periodo programado ese día D (001 C-5); desde el 24/11, solo alta, activación y revisión en conversación (asunto A-14 c). Lo que interrumpe preproducción va el día D.

Uso (A-22): agotar CPU, memoria o el millón de invocaciones termina la prueba (V§11.1); previsto, menos de 30 000; WAF y revisión diaria. Al terminar (RD-077, RD-079): `decision-pago` firmada el 26/11 como muy tarde; si no se contrata, antes del fin una persona borra proyectos, CNAME, tokens y almacén, un agente comprueba desde fuera que nada sirve la app (2 de 2) y se firma `retirada-proyectos`.

### Copia y remoto (REQ-001)

Tarea programada de una persona (`Register-ScheduledTask -StartWhenAvailable`, V§7) que ejecuta `copia.mjs` sellado: `git bundle create` solo con `main` e `integrado/*` y `verify`, en `<carpeta de copia>\repositorio-AAAAMMDD.bundle`; 14 copias. Falla sin borrar nada si falta la carpeta, falla el sello o una etiqueta anterior falta o cambió, y lo muestra `estado`. `copia:restaurar` verifica, clona, compara la punta y pasa la batería. Remoto (D-022): copia, no fuente, hasta que la 003 pruebe su protección de ramas. Solo sube `subir-copia` (persona o sellada): `refs/heads/main` y `refs/tags/integrado/*` explícitas, sin `--force`, `--all`, `--tags` ni `--mirror`, con `bateria --historial` verde en la misma ejecución.

### Guía y registro (REQ-020)

`GUIA.md`, sin secretos: los 10 apartados de RD-044, más purga, condiciones de inicio, clave, sellado, servicios que pasan a pago (RD-046) y la línea exacta de cada orden de la persona. `entornos.md`: variables por entorno, iguales a `.env.example`. `REGISTRO.md`: una fila por acto, sin valores, comprobada por otra persona.

## Contratos

Ninguno nuevo ni cambiado en `contratos/`. Formas cerradas, fijadas aquí: salud, evento de supervisión y línea de registro. Ninguna entrada acepta identificador de cliente.

## Datos

Sin tablas ni migraciones; no crea proyectos de base de datos (RD-070). `Nido` (`eu-north-1`, D-020) no se toca; sus claves entran en `buscar-valor` (CA-013).

## Flujo

`candidato` → revisión → `aprobar` → `integrar`; preproducción (agente) → producción (responsable). Todo fallo deniega; `arn1` caída deja sin respuesta, nunca fuera de la UE.

## Amenazas de esta función

| Amenaza | Control | PRUEBA- |
| --- | --- | --- |
| Secreto en repositorio, candidato, copia o remoto (A-20) | Escaneo previo; patrones; purga; `subir-copia`; el gancho solo vigila Write y Edit | 008–011, 054 |
| Suministro (A-19); batería rebajada | `--ignore-scripts`; entorno limpio; procedencia; configuración explícita | 005–007 |
| Candidato que cambia lo que lo juzga; firma fabricada (A-16) | Primer padre; comparación segura; espacios; batería sellada repetida | 016–019, 051 |
| Captura de lo tecleado; commit fuera de procedimiento | Cuenta aparte (asunto A-3); comprobación 10, sello, copia | 020–023, 053 |
| Revisión inventada; órdenes al `revisor` | Sin control técnico (asunto A-4) | 050, 052 |
| Funciones fuera de la UE | Comprobación 9; `VERCEL_REGION` | 012, 013 |
| Credencial contra producción o volcada | Dos proyectos; tokens de alcance mínimo; DPAPI | 029, 031, 040 |
| Despliegue distinto, roto o simultáneo | Exportación; comprobar antes de promover; cerrojo | 036–039 |
| Valores recibidos (A-15) | Lista cerrada; regla de errores; asunto A-1 | 026, 046, 047 |
| Abuso, agotamiento (A-22), caída | 404 público; WAF; UptimeRobot; paso 0 | 025, 034, 043, 045 |

## Mapa REQ → pieza o contrato → prueba

L: local antes del primer despliegue; V: ventana; C: al cerrar. La rama se altera en una copia de prueba.

| REQ | Pieza | PRUEBA-0NN | CA |
| --- | --- | --- | --- |
| REQ-001 | `main`; copia | 001 L: CAD-001 y `desplegar` no admite otra rama. 002 L: CAD-004; solo `main` y etiquetas; etiqueta perdida detectada. 054 L: `subir-copia` rechaza `tarea/*` y otras etiquetas; `comprobar-inicio` se niega con `gh` en sesión o credencial en GCM; V con persona: el token no cambia la visibilidad y `ls-remote` falla en la cuenta de los agentes | CA-001 |
| REQ-002 | `ejecutar.mjs`; hasta la 003, `verificar` (D-025) | 003 L: CAD-005 y CAD-009 desde dos carpetas. 004 L: CAD-011; `--solo 3 --evidencia`, error; `bateria.md` parcial, comprobación 10 en rojo. 055 L: `verificar` para en la primera orden que falla | CA-002 |
| REQ-003 | Cierre en fallo; excepciones | 005 L: CAD-006 y CAD-009 (9/9 y 2/2). 006 L: CAD-010 y binario con otra suma. 007 L: una prueba por vía de M1 y M2, `@ts-nocheck` y cada configuración de la raíz. 055 L: 8 defectos de uno en uno, salida distinta de 0 | CA-003, CA-004 |
| REQ-004 | Escáner, `candidato`, purga, `buscar-valor`; hasta la 003, `arnes` y `merge --squash` | 008 L: CAD-007, sin commit. 009 L: tras la purga, 0 en objetos, temporales, informe y copia. 010 L: canario por forma nueva, `github_pat_` incluido. 011 C: CAD-003. 055 L: canario, `verificar` en rojo sin mostrarlo | CA-005 |
| REQ-005 | `comprobar-region.mjs`; guardia | 012 L: CAD-008 más conmutación, `proxy.ts` y `edge`; sin `VERCEL_REGION` o con `desarrollo` en la plataforma, 503. 013 V: CAD-021; segmento de función de `x-vercel-id` | CA-006 |
| REQ-006 | Hasta la 003: §Integración. Después: `candidato`, `integrar` | 059 L: cada commit de `main` con mensaje y evidencias completas sobre el árbol verificado. Aplazadas a la 003: 014 (CAD-013) y 015 (CAD-002, CAD-012) | CA-007 |
| REQ-007 | Hasta la 003: «sí» expreso, reservadas nombradas. Después: reglas, firmas, delegación | 059 L: un «aprobado» de un agente, de una evidencia o de un commit no cuenta. Aplazadas a la 003, con su texto en el historial de git: 016 a 021 (firmas, reglas, delegación, registro y aclaraciones que solo crecen) | CA-008 |
| REQ-008 | Hasta la 003: comprobación 10 a mano. Después: comprobación 10; sello | 059 L: recorrido manual del historial con un caso sin `aprobacion.md`. Aplazadas a la 003, con su texto en el historial de git: 022 (CAD-015), 023, 051 y 052 (sello, ancla y control) | CA-009 |
| REQ-009 | App base | 024 L: CAD-016 con Next.js 16.4.6 y el esqueleto. 025 L y V: CAD-017; diagnósticos 404 en el dominio; fija el `Host`. 026 L: CAD-018 | CA-010 |
| REQ-010 | Proyectos y CNAME | 027 V: CAD-020 y cabeceras | CA-011 |
| REQ-011 | `entornos.*`, token de proyecto | 028 L y V: CAD-022. 029 V, lo primero: CAD-023 | CA-012 |
| REQ-012 | DPAPI; CLI aislada | 030 V con persona: CAD-031 y CAD-042 (claves de `Nido`). 031 L y V: casos de M3 | CA-013 |
| REQ-013 | Verificaciones con fecha | 032 L y C: CAD-025, CAD-026, CAD-041 | CA-014 |
| REQ-014 | Paso 0; declaraciones; calendario (firmas y paso 0, aplazados: D-025) | 033 L: CAD-044 con el doble. 034 L y V: CAD-045 y negativas del paso 0. 035 V y C: CAD-046, CAD-047 | CA-015, CA-016 |
| REQ-015 | `desplegar` | 036 L y V: CAD-029 y exportación alterada. 037 V: CAD-024 y CAD-028 (4/4). 038 V: CAD-032; L: cerrojo y sin certeza no actúa. 039 V: CAD-019 | CA-017 |
| REQ-016 | `orden-produccion` (aplazada con producción: D-025) | 040 V y C: CAD-030. 053 L: sin `cuenta-separada` ni A-3 (aun con A-4), producción se niega; con cada una por separado, no; con persona: la cuenta de los agentes no lee la clave | CA-018 |
| REQ-017 | `volver-atras` | 041 V: CAD-033 en 10 min | CA-019 |
| REQ-018 | Sentry, UptimeRobot | 042 V: CAD-034. 043 V con persona: CAD-037 y CAD-038. 044 L y V: CAD-036 y salud con un solo campo. 045 V: ráfaga con 429 antes de 200 peticiones; uso anotado | CA-020 |
| REQ-019 | Lista cerrada; regla de errores | 046 L: evento cerrado pese a valores marcados, también en un segmento de la ruta; envío fallido sin bloqueo. 047 V con persona: CAD-035 más canario no capturado (consulta, IP y agente en Vercel: asunto A-1) | CA-021 |
| REQ-020 | Guía, registro | 048 L y V: CAD-027 y CAD-039. 049 C: CAD-040. 050 L: comentario al `revisor` sale como hallazgo | CA-022 |

Fuera de los REQ de esta función: PRUEBA-056 a PRUEBA-058 (migración base y RLS en local), pendientes del asunto R-1 del plan.

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple en el código | Listas cerradas, errores sin valores; Vercel, asunto A-1 |
| 2 Aislamiento | Cumple donde aplica | La app aún no tiene clientes ni entradas; `aislamiento`, en `verificar`, prueba el modelo de datos y, si el asunto R-1 lo permite, la migración base |
| 3 Cierre en fallo | Cumple | Ante la duda, se deniega; `verificar` para en el primer fallo; sin «sí», nada entra en `main` |
| 4 Secretos | Cumple, con límite | Fuera del repositorio y de variables; `arnes` y `merge --squash`; límite de la aclaración 10 a |
| 5 Especificación | Cumple | Mapa REQ → prueba → CA; rama y evidencias por tarea |
| 6 Revisión independiente | Cumple, con límite | `verificar` y revisión por quien no implementa; puerta del responsable; hasta la 003, sin barrera técnica (asunto A-4, D-025) |
| 7 Entradas no confiables | Cumple | Solo cuenta el «sí» escrito por el responsable; un «aprobado» en salidas, evidencias o commits no vale |
| 8 Límites en el anfitrión | Cumple | Sus documentos, reservados |
| 9 Prompt | No aplica | `prompts/**`, crítica |
| 10 Producto final | Cumple | Errores, accesibilidad básica, supervisión, vuelta atrás, copia, guía |
| 11 Reversibilidad | Cumple | Vuelta atrás, restauración y retirada probadas |
| 12 Español | Cumple | Interfaz, órdenes, variables, códigos |
| 13 Evidencias honestas | Cumple | Impedir no es dificultar: hasta la 003 la integración es procedimiento; pgTAP, NO EJECUTADA en local; lo no verificado, marcado |
| 14 Cambios reservados | Cumple en el procedimiento | Toda entrada en `main` pide el «sí», que nombra lo reservado; producción, aplazada hasta las firmas y el asunto A-3 |

## Dependencias nuevas

Las del esqueleto, con versión y fuente; MIT salvo TypeScript, `eslint-plugin-security` y la CLI (Apache-2.0, V§5.3). Sin SDK de supervisión ni validación (`zod` es de la 001). Servicios: Vercel Pro en prueba (T-019), Sentry Developer UE y UptimeRobot (asunto A-9).

## Alternativas descartadas

Biome y Semgrep; un solo proyecto; reglas del candidato; promover antes de comprobar; alertas de Vercel; `proxy.ts`; aprobación sin firma; remoto como copia diaria.

## Decisiones que requieren ADR

Una: la frontera «Repositorio → producción» (ADR-0001). Borrador en `propuestas-diseno/adr-borrador-plataforma-local.md`; coordinación lo pone al día y lleva `arn1` a `docs/ESQUELETO.md`.

## Asuntos y pendientes del responsable

Decididos por delegación (D-019), en `aclaraciones.md`: A-2, A-5 a A-9, A-12, A-13 y A-14 a–c. D-019 no delega cuentas, secretos, gasto ni aceptar riesgos; queda para el responsable:

1. `<dominio>` y `<carpeta de copia>`.
2. Tras separar cuentas, crear la clave de aprobaciones y el token de GitHub; firmar `ancla` y `delegacion`.
3. A-3: crear la cuenta de los agentes (repitiendo allí T-017) y firmar `cuenta-separada`, o `aceptacion-riesgo` A-3; sin ello, no hay producción.
4. `aceptacion-riesgo` A-4 y A-14 d.
5. A-1: `aceptacion-riesgo` A-1 que nombre ruta, consulta, IP y agente, y aprobar la enmienda de REQ-019 y CA-021.
6. Proyectos, CNAME, variables, tokens, monitores y WAF; cerrar `gh` y borrar la credencial de GCM para github.com. Gasto: Vercel Pro (`decision-pago`) y «Observability Plus» en `pre-nido`, nunca en `nido`.

## Respuesta a los dictámenes

Vueltas 1 y 2: estado en `dictamen-diseno-3.md`. Tercera: N-1 → Aprobaciones, Delegación (PRUEBA-018, 019); N-2 → Credenciales, Asuntos (054); N-3 → Órdenes de la persona (053); N-4 → Consumidores, Cabeceras, Ventana.

D-025 (19/11/2026, decisión del responsable): «Integración» reescrita; Aprobaciones, Delegación, Órdenes de la persona, Arranque y Origen del código, a «Aplazado a la 003» (N-1 y N-3 van con ellas); ajustados el mapa (REQ-002 a 008, 014, 016) y los artículos 2 a 7, 13 y 14.

## Pendiente de verificar

Al instalar: lo marcado VERIFICAR y JSX en Vitest. PRUEBA-: 029 tokens de proyecto; 013 y 025 `Host`, `x-vercel-id`, `POST` a una página; 047 salida de Next.js ante un error escapado; 009 y 010 plantilla de Gitleaks y DSN; 017 y 020 tubería en `cmd.exe` y opciones de git; 054 alcance del token de GitHub. Con la cuenta aparte: DPAPI, arnés y `.claude/settings.local.json`.
