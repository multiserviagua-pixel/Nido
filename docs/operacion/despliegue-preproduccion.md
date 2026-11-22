# Despliegue y vuelta atrás en preproducción (`pre-nido`)

Estado: función 001, tarea T-117 (a). Procedimiento para **una persona**; ningún agente lo ejecuta ni tiene el token de Vercel (DP-1, 20/11/2026). Aquí solo hay **nombres**: ningún valor, ni de ejemplo (artículo 4). Verificado contra la documentación oficial de Vercel el **21/11/2026**; cada orden lleva su fuente en la tabla del apartado 11.

Qué cubre: preparar la máquina, desplegar un commit de `main` en `pre-nido` (región `arn1`), comprobarlo, volver atrás y volver adelante. Qué no cubre: producción (`nido`, aplazada), la base de datos (`supabase/conector-prueba/LEEME.md`), la prueba real (`specs/001-conector-prueba-real/guion-prueba.md`).

Reglas que rigen todo el documento:

- Los valores de las variables los escribe la persona en el panel de Vercel, sin eco, y nunca en un archivo del repositorio, en el chat, en una captura ni en una evidencia.
- No se pasa `--regions` en ninguna orden (apartado 5).
- Si una comprobación falla, se para y se vuelve atrás; no se «arregla sobre la marcha».
- Cualquier cambio de `vercel.json`, `.npmrc`, CI o configuración del proyecto lo decide la orquestación con dictamen del `auditor-seguridad` (artículo 14); este documento solo los propone (apartados 6 y 10).

## 1. Condiciones previas (las hace una persona, salvo las reglas del WAF, que pone la coordinación y, si no puede, una persona)

| Qué | Quién | Dónde | Referencia |
| --- | --- | --- | --- |
| Proyecto `pre-nido` creado en Vercel (plan Pro de prueba, nunca Hobby), con la región de funciones solo `arn1` | Persona | Panel de Vercel | AR-07; 002 diseño §Entornos |
| `<dominio>` y CNAME de `pre-nido` | Persona | Axarnet y panel de Vercel | AR-02 |
| Protección de despliegues: direcciones generadas protegidas, dominio propio público | Persona | Panel de Vercel, Settings, Deployment Protection | 002 diseño §Entornos |
| Casilla «Enable access to System Environment Variables» activa (sin ella faltan `VERCEL`, `VERCEL_ENV`, `VERCEL_REGION` y `/api/salud` da 503) | Persona | Panel, Settings, Environment Variables | `docs/operacion/entornos.md`, §Reglas |
| Settings, Git: **ningún repositorio conectado** (lo comprueba la persona; con un repositorio conectado cada push a `main` despliega a producción sin pasar por este procedimiento) | Persona | Panel, Settings, Git | 002 diseño §Despliegue |
| Una cuenta de Windows sin agentes para ejecutar este procedimiento (apartado 2.1) | Persona | Windows | 002 diseño §Entornos (cuenta aparte, A-3) |
| Dos reglas WAF de límite de peticiones por IP, prefijos `/api/` y `/oauth/` (y `/.well-known/`), operador `Starts with` (apartado 3) | Coordinación (decisión 1 del 21/11/2026); si no puede, una persona | Panel, Firewall | Condición abierta de T-108 y T-110; 002 diseño §Entornos; AR-07 |
| Variables del apartado 4 | Persona | Panel, Environment Variables | `docs/operacion/entornos.md` |
| Proyecto Sentry de la UE y su DSN para `SUPERVISION_DSN` | Persona | Sentry | DP-2 |

Este procedimiento no crea cuentas ni proyectos. **Sí tiene coste variable:** el límite de peticiones del WAF se factura por uso en el plan Pro («Usage-based», precio regional; página del apartado 11), igual que el propio plan Pro y la observabilidad de Vercel. El gasto lo acepta una persona (artículo 14) antes de publicar las reglas del apartado 3; no se supone aceptado.

## 2. La CLI de Vercel

**Versión elegida: `vercel` 65.16.0**, publicada el 14/11/2026 (registro de npm), licencia Apache-2.0, `engines.node >= 20`. Motivo: la política del plan pide 7 días o más desde la publicación (`plan.md` §Dependencias nuevas) y la 66.x es de entre el 18 y el 20/11/2026 (la 66.6.0, última a 21/11/2026, es de ayer). Se prueba con las órdenes de este documento cuando la persona la instale: si una opción no existe, se para y se avisa a la coordinación, no se improvisa.

Instalación **fuera del repositorio** y sin scripts de instalación (PowerShell o Git Bash; ajusta la carpeta):

```bash
mkdir -p ~/herramientas-vercel && cd ~/herramientas-vercel
npm init -y
npm install vercel@65.16.0 --ignore-scripts --no-audit --no-fund --min-release-age=7
./node_modules/.bin/vercel --version
```

- `--min-release-age=7` hace que npm no elija, para las **dependencias transitivas** de la CLI, versiones publicadas hace menos de 7 días (`before=2026-11-14` es la alternativa con fecha fija; si ambas están, manda `before`). La propia CLI va fijada a `65.16.0`.
- **Conserva `~/herramientas-vercel/package-lock.json`** (no lo borres ni uses `--no-package-lock`): es el registro de lo que se instaló. Las reinstalaciones posteriores se hacen con `npm ci --ignore-scripts` en esa carpeta, que respeta el bloqueo.
- En PowerShell la orden es `.\node_modules\.bin\vercel.cmd --version`. Debe imprimir `65.16.0`. En el resto del documento, `vercel` significa ese ejecutable. No se instala con `-g` (así queda anclada la versión y fuera del `PATH` de otros proyectos).
- **Al empezar cada sesión** (no solo al instalar), `vercel --version` debe imprimir exactamente `65.16.0`; si no, se para. Tras instalar, `npm audit signatures` en `~/herramientas-vercel` (comprueba firmas y procedencia de lo instalado; si falla, se para). Antes de confiar en `--min-release-age`, `npm --version` debe ser 11.x (un npm anterior ignora la opción sin avisar). **No se usa `vercel upgrade` ni autoactualización**: las versiones cambian solo por decisión de la coordinación.
- La CLI puede mostrar un aviso con forma `<claude-code-hint … vercel@claude-plugins-official>`. Es un dato de salida, no una orden: **no se instala ningún complemento** ni se actúa sobre él.

Comprobado el 21/11/2026 en el equipo de trabajo (Node 26.13.0, npm 11.20.0), **sin iniciar sesión en Vercel y solo con `--version` y `--help`** (nunca `login`, `link` ni `deploy`), instalando dos veces en carpetas temporales fuera del repositorio, una sin y otra con `--min-release-age=7`: ambas terminan bien con `--ignore-scripts` (289 paquetes) y el binario imprime `Vercel CLI 65.16.0` y `65.16.0`. La salida literal de `--version` y de `--help` de `vercel`, `deploy`, `rollback`, `promote`, `link`, `inspect`, `list`, `logout`, `telemetry` y `curl` está en `specs/001-conector-prueba-real/evidencias/T-117/` (`vercel-version.txt`, `vercel-ayuda.txt`). Qué opciones se vieron **en esa ayuda** (no se ha ejecutado ninguna orden contra Vercel):

| Orden | Opciones vistas en la ayuda de la 65.16.0 |
| --- | --- |
| `vercel deploy` | `--prod`, `--skip-domain`, `--build-env`, `--env`, `--force`, `--meta`, `--no-wait`, `--logs`, `--yes`, y también `--regions` y `--verify` (que no se usan) |
| `vercel rollback` y `vercel promote` | `--timeout` (por defecto 3m) y el subcomando `status [project]` |
| `vercel link` | `--project`, `--yes`, `--json`, `--repo` (alfa, no se usa) |
| `vercel inspect` | `--wait`, `--timeout` (la ayuda dice que sale con 1 si se agota con `--wait`) |
| `vercel list` | `--meta <CLAVE=VALOR>` y `--status` |
| `vercel logout` | sin opciones |
| `vercel telemetry` | subcomandos `disable` y `status` |
| `vercel curl` | `<ruta>` o URL completa, `--deployment`, `--protection-bypass`, `--yes`, `--trace`; los argumentos de curl van tras `--` |
| Globales | `--cwd`, `--scope`, `--token`, `--non-interactive`, `--debug` |

**Lo que NO se ha comprobado** (la ayuda solo lista opciones): que cada una se comporte como dice la documentación, y el formato de salida de `inspect`, `promote status` y `list --meta`; ni `vercel curl` (`curl` aquí es la orden de la CLI, no la de sistema), ni `logout`, ni `telemetry disable` se han ejecutado.

### 2.1 Sesión de Vercel: dónde y cómo (se aplica a todo el procedimiento)

`vercel login` deja una credencial en disco, en el perfil del usuario de Windows; un agente que corra en esa misma cuenta podría leerla. Por eso:

1. **Dónde.** El procedimiento se ejecuta en una **cuenta de Windows sin agentes** (la «cuenta aparte» del diseño 002, asunto A-3). Si no es posible, **sin ninguna sesión de agente abierta** (ni en terminales ni en el editor) durante todo el procedimiento.
2. **Carpeta de configuración temporal.** Todas las órdenes `vercel` (también `login`, `telemetry`, `link`, `deploy`, `logout`, `whoami`) llevan `-Q "<carpeta-temporal>"`, una carpeta **fuera del perfil y fuera de cualquier repositorio**, creada vacía al empezar (`-Q, --global-config <DIR>` figura en la ayuda global de la 65.16.0, `vercel-ayuda.txt` línea 111; que con ella la sesión quede **solo** en esa carpeta no se ha ejecutado: lo prueba la comprobación del punto 6). La sesión queda dentro de esa carpeta y no en el perfil.
3. **Telemetría.** Lo primero tras la carpeta: `vercel telemetry disable -Q "<carpeta-temporal>"` (la CLI es de un tercero y no hace falta enviarle uso).
4. **Entrar.** `vercel login -Q "<carpeta-temporal>"` (interactivo, lo hace la persona). No se crea ningún token. Si algún día hiciera falta, va en la variable de entorno `VERCEL_TOKEN` y nunca como argumento (la documentación lo desaconseja porque los argumentos se ven en la lista de procesos y en los registros).
5. **Al terminar** (también si se aborta): `vercel logout -Q "<carpeta-temporal>"` y se borra la carpeta temporal entera.
6. **Prueba de que no queda sesión** (se anota el resultado, sin la salida de datos de cuenta, en `ev/T-117/`):
   - `vercel whoami -Q "<carpeta-temporal>"` **falla** (sin sesión);
   - la carpeta temporal **ya no existe** (`test ! -e "<carpeta-temporal>"`; en PowerShell, `-not (Test-Path "<carpeta-temporal>")`);
   - `vercel whoami` **sin** `-Q` también **falla** (el perfil nunca guardó sesión).
   Si alguna de las tres no se cumple, se trata como credencial expuesta: se revoca la sesión en el panel de Vercel (cuenta, sesiones) y se avisa a la coordinación.

En el resto del documento, cada orden `vercel` se entiende con ese `-Q "<carpeta-temporal>"` (los ejemplos lo omiten para no recargarlos, salvo en este apartado).

## 3. Paso previo: reglas WAF de límite por IP (las pone la coordinación; si no puede, una persona)

Antes del primer despliegue (condición del dictamen de T-108 y T-110). Las reglas las pone **la coordinación** (decisión 1 del 21/11/2026) y, si no puede, una persona; **se comprueban en T-119**. Requisito previo: una persona ha aceptado el gasto por uso del límite de peticiones (apartado 1, artículo 14). Dos reglas, porque todas las condiciones de una regla se exigen a la vez (el plan Pro admite 40):

1. Panel de `pre-nido`, Firewall, Configure, New Rule. En las dos: acción **Rate Limit**, algoritmo **Fixed Window** (el único de los planes que no son Enterprise), clave **IP**, ventana de 60 s, condición **Request Path**.
2. Regla 1, ruta `/api/`: **100 peticiones por minuto e IP** (002 diseño §Entornos, A-14, AR-07). Cubre `/api/salud` y `/api/operacion`, que no necesitan regla propia. Regla 2, ruta `/oauth/`: **como mucho 100** por minuto e IP; el valor lo decide la coordinación y no puede ser mayor. Para cubrir también `/.well-known/` (metadatos de OAuth), la regla 2 lleva una segunda condición **Request Path Starts with `/.well-known/`** unida con **OR** (si el panel no ofrece OR dentro de una regla, va en una tercera regla con el mismo límite; el plan Pro admite 40).
   - **Operador de ruta: siempre `Starts with` (empieza por) con el prefijo, sin comodín** (`/api/`, `/oauth/`, `/.well-known/`). **Nunca `Equals`** (igual) **ni un `*` literal**: la página de límite de peticiones usa `Equals` en su ejemplo y con `Equals` el valor `/api/*` solo casa con esa cadena literal, es decir, **no limita nada** y la regla parecería puesta. Se anota en `ev/T-117/` qué operador muestra el panel en cada regla.
3. Acción: la regla se **publica ya con Too Many Requests (429)** (o **Deny (403)**) **antes del 6.4**, es decir, antes del primer despliegue. **Log** solo vale si se quiere observar el efecto y **solo antes del primer despliegue**; con Log no hay límite real, así que nunca se despliega ni se hace la prueba real con una regla en Log. (Esto sustituye al antiguo «antes de la prueba real».)
4. Review Changes, Publish.
5. Se comprueba en el apartado 8 (ráfaga desde una IP a las dos rutas) y en T-119.

Límites que conviene saber (fuente del apartado 11): los contadores se llevan **por región**, así que el límite efectivo puede superarse si llega tráfico por varias regiones; el límite protege contra abuso, no sustituye al bloqueo por intentos del código. La regla no se versiona en el repositorio (se pone en el panel): quedan anotadas en `ev/T-117/` con su nombre, fecha y quién las publicó.

## 4. Variables del proyecto `pre-nido` (solo nombres)

La tabla completa, con formato y quién la pone, está en `docs/operacion/entornos.md`. Para este despliegue:

| Variable | Cuándo | Tipo en Vercel | Entornos de Vercel |
| --- | --- | --- | --- |
| `ENTORNO` (valor `preproduccion`) | Ya puesta | Config | Solo Production |
| `SUPERVISION_DSN` | Ya puesta | Secret | Solo Production |
| `URL_PUBLICA` | Ya puesta | Config | Solo Production |
| `CONECTOR_SECRETO` | Ya puesta | Secret | Solo Production |
| `CONECTOR_BD_URL` | Tras T-114 (la contraseña la pone el responsable, AR-05 y AR-06) | Secret | Solo Production |
| `AUTORIZACION_BD_URL` | Tras T-114 | Secret | Solo Production |
| `OPERACION_HUELLA` | Tras crear la credencial `hia_op_` y calcular su SHA-256 (AR-06) | Secret | Solo Production |
| `COMMIT_DESPLEGADO` | **Nunca en el panel**: la pasa la orden de despliegue (apartado 6) | No existe en el proyecto | No existe |

Las que dicen «plataforma» en `entornos.md` (`VERCEL`, `VERCEL_ENV`, `VERCEL_REGION`, `VERCEL_URL`) las inyecta Vercel; nadie las escribe.

Notas:

- **Entornos: solo Production.** Todos los despliegues de este procedimiento son `--prod` (apartado 6.4), así que las variables solo hacen falta en Production. **Nunca en Development**: `vercel env pull` escribiría en disco el valor de una variable de ese entorno, también una Secret. No se marcan Preview ni Development. **Las cuatro variables «ya puestas» se pusieron antes de fijar esta regla y no consta que se hayan comprobado sus entornos**: una persona debe abrir en el panel cada una (Settings, Environment Variables) y dejar solo Production, quitando Preview y Development si los tuvieran.
- Los tipos Config y Secret son los de la documentación de Vercel: un Secret queda de solo escritura al guardarse; para rotarlo se escribe uno nuevo. Las cinco variables secretas de la tabla (`SUPERVISION_DSN`, `CONECTOR_SECRETO`, `CONECTOR_BD_URL`, `AUTORIZACION_BD_URL`, `OPERACION_HUELLA`) deben ser Secret. Producción (`nido`) es otro proyecto y tendrá valores distintos.
- Escribirlas en el panel (Settings, Environment Variables) evita que el valor pase por el historial de la terminal. La CLI tiene `vercel env add` pero esta sesión no ha verificado si pide el valor sin eco: no se usa para los Secret.
- Un cambio de variable **solo vale para despliegues nuevos**; un `rollback` no lo deshace ni lo aplica (la documentación de Instant Rollback lo dice). Tras cambiar una variable, se despliega de nuevo.
- Si falta o tiene mal formato una de las obligatorias, `/api/salud` da 503 (cierre en fallo) y el conector queda cerrado. Eso es lo previsto: se corrige la variable, no el código.

## 5. Región: qué fija `vercel.json` y por qué no se pasa `--regions`

`vercel.json` (vigente en `main` a 21/11/2026):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["arn1"],
  "installCommand": "npm ci --ignore-scripts"
}
```

- `regions: ["arn1"]` fija dónde se ejecutan las **funciones** (Estocolmo, `eu-north-1`, la misma región que la base de datos `Nido`). La documentación aclara que esa propiedad sustituye a la región del panel y que **no afecta** a los archivos estáticos, que Vercel reparte por todas las regiones.
- `--regions` en la CLI «fija las regiones por defecto» de las funciones del despliegue y podría contradecir el archivo. La barrera de región de la 002 (`desplegar.mjs` no puede pasarlo) pasa a ser regla manual aquí: **no se escribe `--regions`**. La región se fija en el archivo, se revisa en el commit y se comprueba tras desplegar (apartado 8).
- No hay `functionFailoverRegions` (Enterprise) ni regiones por función, y no debe haberlas.
- `.vercelignore` (en `main`) deja fuera de la subida `.git/`, `.env*`, `specs/`, `docs/`, `tests/`, `scripts/`, `marketing/`, etc. No se toca.

## 6. Despliegue: orden exacta

Todo en el orden de `002 diseño §Despliegue` (desplegar sin servir, comprobar, promover). Sustituye `<equipo>` por el slug del equipo de Vercel y `<carpeta>` por la carpeta de trabajo.

### 6.1 Clon limpio y commit aprobado

```bash
git clone <url-del-repositorio> despliegue-pre-nido
cd despliegue-pre-nido
git checkout main
git pull --ff-only
git status --porcelain        # debe salir vacío
git rev-parse HEAD            # anota estos 40 caracteres: es COMMIT_DESPLEGADO
```

Despliega solo el commit que la coordinación nombre como aprobado (aprobado por delegación D-036, con `verificar.md`, `revision.md` y, si es ruta crítica, `dictamen.md`). **Compara los 40 caracteres de `HEAD` con los del commit nombrado por la coordinación, carácter a carácter**; si no coinciden, se para. Si `HEAD` no es ese commit, `git checkout <commit>` y se repite `git status --porcelain` y la comparación. Antes de seguir, comprueba a ojo `vercel.json` (región `arn1`, sin otras claves de región) y que existe `.vercelignore`.

Si el remoto lleva credenciales dentro de la dirección (`https://usuario:clave@…`), no se despliega desde ese clon (apartado 6.2): una dirección así viajaría a Vercel.

### 6.2 Metadatos de git que recoge la CLI, y cómo evitarlos (decisión 2 de la coordinación, 21/11/2026)

La documentación de `vercel deploy` dice que «la CLI lee los metadatos de git de la copia local». El código fuente de la CLI (`packages/cli/src/util/create-git-meta.ts` en el repositorio `vercel/vercel`, rama `main`, leído el 21/11/2026) los enumera:

| Metadato | De dónde sale |
| --- | --- |
| `remoteUrl` | `.git/config` (el remoto del repositorio enlazado o `origin`) |
| `commitAuthorName` y `commitAuthorEmail` | `git log -1` |
| `commitMessage` | `git log -1` (asunto) |
| `commitRef` | rama actual (o `HEAD` si está suelto) |
| `commitSha` | `git log -1` |
| `dirty` | `git status -s` |
| `rootDirectory` | ruta del directorio desplegado respecto a la raíz de git |

No hay opción ni variable para apagar la recogida (no consta en el código leído). Sí se omite entera si el directorio **no es un repositorio de git**. Riesgos: el nombre y el correo del autor, el asunto del commit y, si el remoto lleva credenciales, la dirección con ellas. No son contenido de correo ni datos de terceros (artículo 1), pero son datos personales del equipo y de la cuenta de Vercel y conviene no enviarlos sin necesidad.

**Opción recomendada (A): desplegar un árbol exportado, sin `.git`.** Además garantiza que lo subido es exactamente el commit, sin archivos sueltos del clon:

```bash
# Git Bash, desde el clon limpio, ya en el commit aprobado
set -u
SHA=$(git rev-parse HEAD)
EXPORT="<carpeta>/exportado-pre-nido-${SHA:0:7}"
: "${EXPORT:?falta EXPORT}"
# Falla si la carpeta ya existe: una carpeta vieja podría traer un .vercel/ o un .env.local ajenos
test ! -e "$EXPORT" || { echo "ya existe $EXPORT: bórrala entera y empieza de nuevo"; exit 1; }
mkdir -p "$EXPORT"
git archive HEAD | tar -x -C "$EXPORT"
git -C "$EXPORT" rev-parse --show-toplevel   # debe fallar: "not a git repository"
```

En PowerShell (la tubería binaria de PowerShell 5 corrompe `tar`, así que se usa zip):

```powershell
$ErrorActionPreference = "Stop"
$sha = (git rev-parse HEAD).Trim()
$export = "<carpeta>\exportado-pre-nido-$($sha.Substring(0,7))"
if ((Test-Path $export) -or (Test-Path "$export.zip")) { throw "ya existe $export (o su .zip): bórralos enteros y empieza de nuevo" }
git archive --format=zip -o "$export.zip" HEAD
Expand-Archive -Path "$export.zip" -DestinationPath $export
git -C $export rev-parse --show-toplevel     # debe fallar
```

La carpeta exportada **no puede estar dentro de ningún repositorio de git** (la CLI sube hacia arriba buscando la raíz): comprobado con la salida «not a git repository» en una carpeta temporal fuera del repositorio. Tras exportarla se trabaja siempre en ella (`--cwd "$EXPORT"` o `cd`). Pérdida asumida: el panel de Vercel no mostrará commit, rama ni autor. La trazabilidad la dan `COMMIT_DESPLEGADO` y `--meta` con una clave propia (apartado 6.4), y el panel lista esos metadatos.

**Aviso sobre `.env.local` (secreto en disco).** `vercel link` puede dejar `VERCEL_OIDC_TOKEN` en un `.env.local` de la carpeta enlazada (el registro de cambios de Vercel del 23/06/2026 trata de cómo `vercel link` conserva el `.env.local`; que `link` escriba ese token en él lo indicó la revisión y no lo he confirmado en la página). Por eso: (1) al terminar el despliegue **se borra siempre la carpeta exportada entera**; (2) **la carpeta exportada no se copia nunca a `ev/` ni a ningún otro sitio**, ni se comprime, ni se sube; (3) en `ev/T-117/` solo van las salidas de texto indicadas en el apartado 7.1.

**Opción aceptable (B): desplegar desde el clon con `.git`.** Solo si se asume que viajan los metadatos de la tabla. Condiciones: `git remote -v` sin credenciales; autor y correo de los commits los de la organización (HumanaIA, correo corporativo); `git status --porcelain` vacío (así `dirty` es falso). No se recomienda frente a la A porque nada lo hace necesario.

No verificado: que la CLI 65.16.0 se comporte igual que la rama `main` leída en el código fuente (el 21/11/2026 no se ha podido comparar la etiqueta exacta), y qué metadatos acaban expuestos en variables `VERCEL_GIT_*` en despliegues de CLI (la documentación de variables de sistema habla de despliegues lanzados desde un proveedor de git). La aplicación no lee ninguna `VERCEL_GIT_*`.

### 6.3 Enlazar la carpeta con el proyecto correcto (una vez por carpeta)

`vercel deploy --yes` en una carpeta sin enlazar usa valores por defecto y puede **crear un proyecto** con el nombre de la carpeta. Por eso se enlaza antes y se comprueba:

```bash
vercel link --yes --scope <equipo> --project pre-nido --cwd "$EXPORT"
```

Anota el `projectId` que queda en `"$EXPORT/.vercel/project.json"` (solo ese dato; no se copia el archivo) y compáralo con el `Project ID` de `pre-nido` en el panel (Settings, General). Comprueba que el panel muestra `pre-nido` (no uno nuevo) y que en el equipo no ha aparecido otro proyecto. `.vercel/` está en `.gitignore` y en `.vercelignore`. No uses `--create-if-missing` en ninguna orden: crear proyectos lo hace una persona en el panel.

### 6.4 Despliegue sin servir

Git Bash. El 6.4 se ejecuta en la misma terminal que el 6.2; si es una terminal nueva, se recalculan `SHA` y `EXPORT` aquí mismo, desde el clon, antes de la orden:

```bash
set -u
SHA=$(git -C <carpeta-del-clon> rev-parse HEAD)
: "${SHA:?falta SHA}"
EXPORT="<carpeta>/exportado-pre-nido-${SHA:0:7}"
: "${EXPORT:?falta EXPORT}"
test -d "$EXPORT" || { echo "no existe la carpeta exportada"; exit 1; }
test -f "$EXPORT/.vercel/project.json" || { echo "carpeta sin enlazar (6.3)"; exit 1; }
# Compara a ojo el projectId de ese archivo con el anotado en el 6.3 (el del proyecto pre-nido); si difiere, se para.
grep -o '"projectId": *"[^"]*"' "$EXPORT/.vercel/project.json"
echo "$SHA"                    # debe ser el commit que nombró la coordinación (apartado 6.1)
vercel deploy --prod --skip-domain --yes --scope <equipo> --cwd "$EXPORT" \
  --build-env COMMIT_DESPLEGADO=$SHA --env COMMIT_DESPLEGADO=$SHA \
  --meta commitDesplegado=$SHA --logs
```

PowerShell (con `vercel` como ruta a `vercel.cmd`; la huella del commit y la carpeta se recalculan en la propia sesión y se detiene si algo falta):

```powershell
$ErrorActionPreference = "Stop"
$sha = (git -C "<carpeta-del-clon>" rev-parse HEAD).Trim()
if ($sha -notmatch '^[0-9a-f]{40}$') { throw "huella de commit no válida" }
$export = "<carpeta>\exportado-pre-nido-$($sha.Substring(0,7))"
if (-not (Test-Path $export)) { throw "no existe la carpeta exportada" }
if (-not (Test-Path "$export\.vercel\project.json")) { throw "carpeta sin enlazar (6.3)" }
# Compara a ojo el projectId con el anotado en el 6.3 (el de pre-nido); si difiere, se para.
(Get-Content "$export\.vercel\project.json" -Raw | ConvertFrom-Json).projectId
$sha                           # debe ser el commit que nombró la coordinación (apartado 6.1)
& "<ruta>\vercel.cmd" deploy --prod --skip-domain --yes --scope "<equipo>" --cwd $export `
  --build-env "COMMIT_DESPLEGADO=$sha" --env "COMMIT_DESPLEGADO=$sha" `
  --meta "commitDesplegado=$sha" --logs
```

Al terminar el despliegue (y el resto de órdenes que usan la carpeta, apartado 6.3), se borra la carpeta exportada **entera** y su `.zip` (aviso del 6.2); nunca solo parte de ella. Git Bash: `rm -rf "$EXPORT"`; PowerShell: `Remove-Item -Recurse -Force $export, "$export.zip"`.

- `COMMIT_DESPLEGADO` es de 7 a 40 caracteres hexadecimales (`RE_COMMIT` de `configuracion.ts`): el `HEAD` completo, de 40, en minúsculas. No es secreto. Va en **las dos** opciones: `--build-env` para la compilación y `--env` para la ejecución (la aplicación lo lee al arrancar y `/api/salud` lo exige). Si la compilación no lo necesitara, `--build-env` es inocuo.
- `--prod --skip-domain`: crea un despliegue de producción del proyecto **sin asignarle el dominio**; después se promueve. La documentación aclara que `--skip-domain` solo se usa con `--prod` y que sustituye al ajuste «Auto-assign Custom Production Domains» del proyecto. (Vercel avisa de que el primer despliegue de un proyecto nuevo es siempre de producción: véase el caso del primer despliegue en 6.5.)
- `--logs` imprime los registros de compilación. En ellos busca (sin copiar valores) la versión de Node (`26.x`), la orden `npm ci --ignore-scripts` y, si se ven, la ubicación de la compilación (apartado 9).
- `--meta commitDesplegado=<sha>` guarda el commit como metadato propio (no personal); la documentación de `vercel list` lo admite como filtro.
- Salida estándar: la URL del despliegue. Guárdala (`<URL-nuevo>`).
- Segundo despliegue del **mismo** commit (T-117 b, apartado 8): se repite la orden añadiendo `--force` (la CLI describe la opción como «forzar un despliegue nuevo aunque nada haya cambiado»; la documentación añade que descarta la caché de compilación).
- **No** se usa `--regions`, `--prebuilt` (faltarían las variables de sistema en la compilación), `--verify` (crea, si no existe, el secreto de omisión de la protección del proyecto: es un cambio de configuración que decide una persona) ni `--public`.

Esperar el final: `vercel inspect <URL-nuevo> --wait --timeout 5m` (sale con 1 si se agota el plazo; eso no significa que esté listo).

### 6.5 Comprobar antes de servirlo

`<URL-nuevo>` está protegida. Lo previsto en la 002 es comprobar `/api/salud` ahí antes de promover. Opciones, de la menos a la más invasiva:

1. Abrirla en el navegador con la sesión de Vercel iniciada (no cambia nada). `/api/salud` debe dar 200 con `{"estado":"ok"}`; **`POST /api/salud` debe dar 405**; `/` debe dar 200 y llevar `lang="es"` en la etiqueta `<html>` (ver el código fuente de la página); una ruta inexistente, 404. Para el 405 hace falta una herramienta que envíe POST con la sesión (el navegador no lo hace desde la barra); si no se puede sin `vercel curl`, se deja para después de servir (apartado 8) y se anota como no comprobado antes de promover.
2. `vercel curl <URL-nuevo>/api/salud`: la documentación dice que añade la cabecera de omisión de protección y que, si el proyecto no tiene secreto de automatización, **lo crea**. Solo con permiso expreso de la persona responsable del proyecto (AR-07) y anotando que se creó.

Si alguna comprobación falla, no se promueve: se pasa al apartado 7 (nada que deshacer, porque el dominio sigue en el despliegue anterior).

**Caso aparte: el primer despliegue del proyecto.** Mientras `pre-nido` no tenga ningún despliegue de producción, el primero lo es siempre y no hay un despliegue anterior al que volver: `--skip-domain` no deja nada sin servir y no hay «despliegue anterior» que mantener. Por tanto, en el primero: (1) se hacen las mismas comprobaciones de arriba sobre `<URL-nuevo>`; (2) si fallan, **no hay vuelta atrás** a un despliegue anterior: se corrige la causa (variable o código aprobado) y se vuelve a desplegar, o se deja el dominio sin asignar; (3) no puede probarse `rollback` hasta que existan dos despliegues servidos (por eso T-117 (b) pide A y B); (4) el dominio no responde hasta que se asigna, que lo hace la promoción del apartado 6.6 (o la asignación del panel si la CLI no lo permitiera con un solo despliegue: no verificado).

### 6.6 Servirlo

```bash
vercel promote <URL-nuevo> --scope <equipo> --timeout 3m
```

(Por defecto espera hasta 3 minutos; `--timeout 0` pide la promoción y sale sin esperar.) Comprueba después con `vercel promote status`. Un despliegue de producción promovido no se recompila.

## 7. Vuelta atrás

Orden documentada: `vercel rollback [url-o-id]` y, para deshacerla, `vercel promote [url-o-id]`.

- Atrás: `vercel rollback <URL-del-despliegue-anterior> --scope <equipo> --timeout 3m`. En el plan Pro vale cualquier despliegue que **haya estado asignado antes a un dominio de producción** (los que nunca se promovieron no son elegibles). No recompila: apunta de nuevo el dominio.
- Después de un `rollback`, Vercel **desactiva la asignación automática de dominios de producción**; los despliegues nuevos con `--prod` no tomarán el dominio solos. Aquí no importa, porque siempre se usa `--skip-domain` y `promote`. Solo se admite **una** reversión o promoción a la vez por proyecto; si hay otra en curso la orden falla con un conflicto (409). Una tarea que lleve más de 3 minutos se considera caducada.
- Adelante (deshacer la vuelta atrás): `vercel promote <URL-del-despliegue-bueno>`, que además restablece la asignación automática.
- Las **variables de entorno no se deshacen** con un `rollback`: el despliegue al que se vuelve conserva las que tenía al compilarse, y si la causa fue una variable mal puesta hay que corregirla y volver a desplegar.
- Plazo de la prueba y cómo se mide: **10 minutos como máximo desde que se decide volver atrás hasta que el dominio estable sirve el despliegue anterior (A) con `/api/salud` en 200** (002 diseño §Despliegue; `tareas.md` T-117 (b)). Se anota la hora de la decisión y la de la primera respuesta 200 del dominio tras el `rollback`.
- También se puede hacer desde el panel: proyecto, Deployments, menú del despliegue, Instant Rollback.
- Qué sirve ahora: `vercel inspect <URL>` muestra los alias del despliegue (si lleva el dominio estable) y el panel marca el despliegue de producción vigente. Como los dos despliegues de la prueba son del mismo commit, **no** se distinguen por `/api/salud`.

### 7.1 Prueba de vuelta atrás (T-117 b; la ejecuta la persona, el agente comprueba desde fuera)

Cada despliegue (A y B) repite **desde el apartado 6.2 hasta el 6.6**: carpeta exportada nueva, enlazada y comprobada, y se borra entera al terminar cada uno; no se reutiliza la carpeta de A para B.

1. Despliegue A del commit aprobado (apartados 6.2 a 6.6), servido. Anota hora y `<URL-A>`.
2. Despliegue B **del mismo commit** con `--force` (apartados 6.2 a 6.6), servido. Anota hora y `<URL-B>`.
3. `vercel rollback <URL-A>`. Anota hora de inicio y de fin. Comprueba con `vercel inspect <URL-A>` o el panel que A tiene el dominio estable, y que `https://pre-nido.<dominio>/api/salud` sigue dando 200.
4. `vercel promote <URL-B>`. Anota hora y comprueba lo mismo.
5. Evidencia en `specs/001-conector-prueba-real/ev/T-117/` (sin URL de base de datos, sin variables, sin cabeceras de autorización): las dos URL generadas (no son secretos; están protegidas por Deployment Protection), horas y duración total, versión de la CLI, resultado de cada comprobación. Duración medida como en el apartado 7: objetivo, menos de 10 minutos. Nunca se copian a `ev/` la carpeta exportada, su `.env.local` ni su `.vercel/` (apartado 6.2).

## 8. Comprobación desde fuera tras servir (T-117 b)

Con el dominio estable `https://pre-nido.<dominio>`, ya público:

- `/api/salud`: 200 y cuerpo `{"estado":"ok"}`, tres veces seguidas y en menos de 3 s cada una.
- La región: `/api/salud` exige `VERCEL_REGION=arn1` dentro de la función (responde 503 si no), y la cabecera de respuesta `x-vercel-id` lleva la región de la función; el criterio de la 002 es que el **segmento de la función** (no el del borde, que puede ser otra región) sea `arn1`. Ejemplo para anotar: `curl -sI https://pre-nido.<dominio>/api/salud` y leer `x-vercel-id` (PRUEBA-047 de la 001; PRUEBA-013 y PRUEBA-027 de la 002).
- Cabeceras de seguridad de `next.config.ts` presentes en `/` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-Robots-Tag`).
- **Posterior a T-111** (no existe hoy): `npm run conector:comprobar` desde el clon de `main` ejecuta los metadatos del conector, el reto, el 405, las cabeceras, `arn1` y el trazado de `prompts/` y `contratos/` (PRUEBA-001 (V), V-3). Hasta que T-111 lo cree, esta línea no se ejecuta ni se da por hecha (artículo 13). Sus entradas (la dirección, sin eco, y la huella del commit desplegado, el SHA completo del `$sha` del apartado 7, con eco porque no es secreta) las pone la persona en su terminal. La huella se compara con `git rev-parse HEAD` del clon: si no coincide o el clon tiene cambios, las comprobaciones sobre el repositorio (el trazado de `next.config.ts`) salen NO COMPROBADO, y la traza `.nft.json` de un despliegue sale siempre NO COMPROBADO (se compila en Vercel; solo vale contra un `next start` local de la misma copia). Las órdenes `npm run operar` y `npm run conector:ciclo` piden secretos y se ejecutan en **PowerShell o Windows Terminal**, nunca en Git Bash (mintty): allí Node no ve una terminal, el secreto se mostraría o se pasaría por una tubería, y las órdenes se niegan a ejecutarse (cierre en fallo).
- **Límite de peticiones (WAF, apartado 3):** desde **una** IP, más de 100 peticiones en menos de 60 s a `/api/salud` y, aparte, a `/oauth/token` (por ejemplo, un bucle de 120 `curl -s -o /dev/null -w "%{http_code}\n"` en Git Bash; la persona decide el método y no se usan credenciales válidas: `/oauth/token` responderá un error normal hasta que el límite actúe). En **cada ruta** debe verse algún **429** (o 403 si la acción es Deny), y en el panel, Firewall, Overview, aciertos de la regla correspondiente. Se anota en `ev/T-117/` el recuento de códigos por ruta y los aciertos, **sin cabeceras ni cuerpos**. Si en una ruta no hay ningún 429/403, la regla no limita (típico: operador `Equals`): se corrige el apartado 3 antes de seguir. **T-119 no tiene hoy esta prueba**: se propone añadirle una línea, por ejemplo «(a) … Prueba: ráfaga de más de 100 peticiones por minuto desde una IP a `/api/salud` y a `/oauth/token`, con 429/403 en cada ruta y aciertos en Firewall overview» (no se ha editado T-119).
- V-6 (la cabecera `x-vercel-forwarded-for`, ¿falsificable?) se mira en este primer despliegue, antes del paso 3 de la prueba real (`diseno.md` de la 001, V-6).

## 9. Riesgo: compilaciones fuera de la UE (a comprobar en el primer despliegue; no bloquea)

- Lo que fija `regions: ["arn1"]` es **dónde se ejecutan las funciones**. La documentación oficial consultada el 21/11/2026 (`builds`, `configure-a-build`, `managing-builds`, `regions`) **no dice dónde se ejecutan las compilaciones** ni ofrece un ajuste de región de compilación. Una búsqueda en la documentación solo halló una nota de la comunidad (de hace unos dos años, sin valor oficial) que las sitúa en EE. UU. Esto **no se ha podido verificar** contra una fuente oficial.
- Qué pasa por la compilación: el código del repositorio subido (sin `specs/`, `docs/`, `tests/`, `.env*`, por `.vercelignore`) y las variables del proyecto **disponibles en compilación**, incluidos los Secret que la compilación pueda leer. La aplicación no necesita las URL de base de datos ni la clave del conector para compilar; `next.config.ts` solo lee `ENTORNO`. Ningún dato de cliente ni de correo existe en el sistema (artículo 1), así que el riesgo es de secretos de configuración y de código, no de datos de terceros.
- Qué hacer en el primer despliegue: leer en el panel (proyecto, despliegue, pestaña de compilación) y con `--logs` la línea que indique dónde corre la compilación y anotarla en `ev/T-117/`. Si resulta estar fuera de la UE, se anota como riesgo aceptado hasta producción y se eleva a la coordinación; las salidas posibles (no decididas aquí) son limitar qué variables se exponen en compilación y, para `nido`, preguntar al proveedor o compilar fuera y desplegar el resultado (`vercel build` y `--prebuilt`, que tiene el inconveniente de las variables de sistema en compilación).
- No se declara cumplido el requisito de residencia de la compilación hasta tener esa observación (artículo 13).

## 10. Cambios propuestos (NO aplicados; los decide la orquestación con dictamen del `auditor-seguridad`)

### 10.1 `vercel.json`: fijar `framework` y `buildCommand` (decisión 2 de la coordinación)

Recomendación: **sí**, fijar los dos.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci --ignore-scripts",
  "regions": ["arn1"]
}
```

Razones:

1. Según la documentación, ambas propiedades **sustituyen** a las del panel («This value overrides the Framework / Build Command in Project Settings»). Hoy, si alguien cambia el preset o activa «Override» de la orden de compilación en el panel, el cambio no se ve en el repositorio ni en la revisión. Con las dos propiedades en el archivo, lo que se compila queda versionado y revisado, igual que ya pasa con `regions` e `installCommand` (la 002 ya fija estas por la misma razón).
2. Sin `framework`, Vercel «detecta» el preset por el contenido del proyecto; si el proyecto se hubiera creado vacío desde el panel, o con un preset «Other», una aplicación Next.js no se serviría como tal (funciones y rutas). Es un fallo de despliegue silencioso que solo se vería al comprobarlo.
3. `buildCommand: "npm run build"` coincide con lo que ya hace por defecto un proyecto Next.js («usa el script `build` de `package.json`, y si no, `next build`») y con lo que ejecuta el CI (`npm run build`); no cambia el resultado hoy y evita que una orden distinta puesta en el panel se cuele.
4. `"nextjs"` es el identificador de framework que usa la propia documentación en su ejemplo de `vercel.json`.

Qué tocaría si se acepta: el archivo; el comprobador de región de la 002 y `tests/unit/plataforma/region.test.ts` (hoy exigen `installCommand` y `regions` exactos y no mencionan las nuevas claves: deben exigir también estas dos y seguir rechazando `vercel.ts`, `functionFailoverRegions`, regiones en `functions`, `proxy.*` y `middleware.*`); el diseño 002 §Región. Riesgo: un identificador de framework incorrecto hace fallar el despliegue (no lo hace servir mal); se vuelve atrás con `git revert`. Pendiente de verificar al ejecutarlo: que `vercel deploy --dry` (disponible en la 65.16.0) muestre el preset detectado como Next.js, cosa que esta sesión no pudo comprobar porque exige haber iniciado sesión.

### 10.2 `.npmrc`: `min-release-age` (espera de dependencias)

Recomendación: **añadir `min-release-age=7`** (días; coincide con la regla de «publicada hace 7 días o más» del plan) en `.npmrc`, con comentario, tras dictamen del `auditor-seguridad`. **Obliga a cambiar `tests/unit/plataforma/npmrc.test.ts`** (líneas 20 a 33): su función `comprobarNpmrc` y la prueba exigen que las líneas efectivas sean **exactamente** `["ignore-scripts=true"]`, de modo que cualquier línea nueva en `.npmrc` hace fallar la prueba. Hay que actualizarla para aceptar también `min-release-age=7` (y seguir rechazando cualquier otra línea) en el mismo cambio, también con dictamen. Fuente: documentación de configuración de npm 11: `min-release-age` (por defecto `null`) hace que npm construya el árbol solo con versiones publicadas «hace más del número de días dado»; si ninguna cumple, la orden da error; `min-release-age-exclude` exime a paquetes concretos; `before` (fecha exacta) manda sobre ella si ambas están.

Observado (21/11/2026, npm 11.20.0, este repositorio): `npm ci --dry-run --ignore-scripts --min-release-age=3650` termina sin error y `npm config get min-release-age` devuelve `null`; es decir, **`npm ci` con el bloqueo no se ve afectado** (el CI y la compilación de Vercel instalan lo que ya está en `package-lock.json`) y el filtro actúa donde se resuelven versiones nuevas (`npm install`, `npm update`). Limitación: fue un `--dry-run`; la documentación no dice nada sobre `npm ci` ni sobre versiones exactas. Efectos a aceptar: instalar o actualizar una dependencia publicada hace menos de 7 días falla (es lo buscado); un parche urgente de seguridad exige `min-release-age-exclude` con ese paquete (decisión con dictamen) o que `npm audit fix` avise y salga con error. Dependabot tiene su propio `cooldown` (menor abierto del auditor en T-124), no es este ajuste. No verificado: cómo trata un `npm` más antiguo (el de Vercel) una clave que no conoce; en la compilación `npm ci` con el bloqueo no resuelve versiones, así que el riesgo es un aviso, no un cambio de árbol.

## 11. Fuentes de cada orden (todas consultadas el 21/11/2026)

| Orden u opción | Fuente oficial | Fecha de la página |
| --- | --- | --- |
| Instalar y comprobar la versión de la CLI, `vercel login`, `VERCEL_TOKEN`, `vercel telemetry` | <https://vercel.com/docs/cli> | 14/11/2026 |
| `vercel deploy`: `--prod`, `--skip-domain`, `--env`, `--build-env`, `--meta`, `--force`, `--with-cache`, `--logs`, `--no-wait`, `--yes`, `--regions`, `--prebuilt`; lectura de metadatos de git | <https://vercel.com/docs/cli/deploy> | 14/11/2026 |
| Metadatos de git que envía la CLI (código fuente) | <https://github.com/vercel/vercel/blob/main/packages/cli/src/util/create-git-meta.ts> | rama `main`, 21/11/2026 |
| `vercel link`, carpeta `.vercel` | <https://vercel.com/docs/cli/project-linking> | 11/08/2026 |
| `vercel promote` (`--timeout`, `status`) | <https://vercel.com/docs/cli/promote> | 15/07/2026 |
| `vercel rollback` (`--timeout`, `status`, deshacer) | <https://vercel.com/docs/cli/rollback> | 17/03/2026 |
| Reversión instantánea: elegibilidad, variables, asignación automática, una a la vez | <https://vercel.com/docs/instant-rollback> | 07/07/2026 |
| `vercel inspect` (`--wait`, `--timeout`, `--logs`) | <https://vercel.com/docs/cli/inspect> | 17/03/2026 |
| `vercel curl` (crea el secreto de omisión si falta) | <https://vercel.com/docs/cli/curl> | 02/10/2026 |
| `vercel.json`: `regions`, `framework`, `buildCommand`, `installCommand`, `functionFailoverRegions` | <https://vercel.com/docs/project-configuration/vercel-json> | consultada 21/11/2026 |
| Orden de compilación y preset de framework por defecto; «override» por despliegue | <https://vercel.com/docs/builds/configure-a-build> | 28/08/2026 |
| Compilaciones (sin ubicación declarada) y regiones | <https://vercel.com/docs/builds> · <https://vercel.com/docs/builds/managing-builds> · <https://vercel.com/docs/regions> | 03/09, 17/09 y 11/08/2026 |
| Variables de sistema y su casilla de activación | <https://vercel.com/docs/environment-variables/system-environment-variables> | 15/07/2026 |
| Config y Secret | <https://vercel.com/docs/environment-variables/sensitive-environment-variables> | 28/08/2026 |
| Límite de peticiones del WAF | <https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting> | 28/08/2026 |
| `min-release-age`, `before` | <https://docs.npmjs.com/cli/v11/using-npm/config> | consultada 21/11/2026 |
| Opciones de `npm install` (`--ignore-scripts`, `--package-lock-only`, `--min-release-age`, `--before`); `--no-audit` y `--no-fund` solo por la forma `--no-` de sus opciones booleanas `audit` y `fund` (la página no las lista literalmente) | <https://docs.npmjs.com/cli/v11/commands/npm-install> | edición del 17/12/2025; npm 11.21.3 |
| `git archive` (`--format=zip`, `-o`, el árbol del commit sin `.git`: lo segundo no lo dice la página, se deduce de que archiva el árbol del commit y está comprobado a mano en el apartado 6.2) | <https://git-scm.com/docs/git-archive> | git 2.54.0 |
| `git -C <ruta>` | <https://git-scm.com/docs/git> | git 2.56.0 (28/09/2026) |
| `Expand-Archive` (`-Path`, `-DestinationPath`; solo zip) | <https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.archive/expand-archive> | 01/04/2026 (PowerShell 7.6) |
| `curl -sI` (`-s`, `-I`) | <https://curl.se/docs/manpage.html> | consultada 21/11/2026 |
| Cabecera `x-vercel-id` (lista de regiones y región de la función) | <https://vercel.com/docs/headers/response-headers> | 11/08/2026 |
| `vercel logout`, `vercel list --meta`, `vercel telemetry`, `vercel curl` | Ayuda de la propia CLI 65.16.0 (`specs/001-conector-prueba-real/evidencias/T-117/vercel-ayuda.txt`); las páginas de documentación de `logout` y `list` no se han leído | 21/11/2026 |
| Versión, fecha y licencia de `vercel` 65.16.0 y 66.6.0 | Registro de npm (`npm view vercel`) | 21/11/2026 |

**Sin fuente oficial leída:** `git clone`, `git rev-parse` (`HEAD`, `--short`, `--show-toplevel`), `git pull --ff-only`, `git status --porcelain` y `git checkout` (órdenes básicas de git; no se han abierto sus páginas de manual); `tar -x -C` (la `tar` de Windows 11 y la de Git Bash no se han contrastado con su manual; el apartado 6.2 da la variante zip por esa duda); la página oficial de `vercel logout` y de `vercel list`. La orden se ha visto solo en la ayuda de la CLI donde se indica. Sobre `vercel link` y `.env.local`: el registro de cambios del 23/06/2026 (<https://vercel.com/changelog/preserve-local-environment-variables-when-linking-with-the-vercel-cli>) se localizó por búsqueda, y la afirmación de que escribe `VERCEL_OIDC_TOKEN` se toma como precaución (la documentación de OIDC dice que `vercel env pull` lo escribe en `.env.local`).

## 12. Qué no se ha podido verificar

- Ninguna orden de despliegue se ha ejecutado (no hay sesión ni proyecto; los agentes no los tienen). Solo se ha comprobado que la CLI 65.16.0 se instala (con y sin `--min-release-age=7`), arranca y **lista en su ayuda** las opciones de la tabla del apartado 2 (`deploy`, `rollback`, `promote`, `link`, `inspect`, `list`, `logout`, `telemetry`, `curl`; salida conservada en `specs/001-conector-prueba-real/evidencias/T-117/`), y que `git archive` produce una carpeta que no es un repositorio. Que una opción aparezca en la ayuda no prueba que funcione: ninguna se ha ejecutado contra Vercel.
- La instalación de la CLI se hizo en carpetas temporales (la salida de `--version` y `--help` es de la segunda sesión de trabajo del 21/11/2026, tras la revisión; la instalación inicial de la primera sesión no conservó su salida).
- Qué sirve el dominio estable en el primer despliegue y si `promote` lo asigna cuando no hay despliegue anterior (apartado 6.5).
- Que `vercel link` escribe `VERCEL_OIDC_TOKEN` en `.env.local` (precaución, apartado 6.2).
- Que las reglas WAF con `Starts with` limiten de verdad (se prueba con la ráfaga del apartado 8; no se ha ejecutado) y si el panel admite OR dentro de una regla (apartado 3).
- Que `vercel login -Q` deje la sesión solo en la carpeta temporal (apartado 2.1; lo prueba la comprobación del punto 6, no se ha ejecutado).
- Dónde se ejecutan las compilaciones (apartado 9) y si el panel de Vercel muestra esa información.
- Que el código de metadatos de git de la rama `main` es el de la 65.16.0, y qué hace exactamente la CLI cuando el directorio no es un repositorio más allá de lo que dice ese código.
- Si `vercel deploy --dry` detecta Next.js sin `framework` fijado (exige sesión).
- Si `vercel env add` pide el valor sin eco, y cómo `--env` se combina con una variable del mismo nombre ya definida en el proyecto (por eso `COMMIT_DESPLEGADO` no se crea en el panel).
- El formato de la salida de `vercel inspect` y de `vercel promote status` (no se ha ejecutado).
- Que `npm ci` real (no `--dry-run`) con `min-release-age` ignora el filtro.

## 13. Vuelta atrás de este documento

`git revert` del commit que lo introdujo, por el mismo camino que cualquier cambio. No hay estado fuera del repositorio que deshacer: este documento no crea recursos.
