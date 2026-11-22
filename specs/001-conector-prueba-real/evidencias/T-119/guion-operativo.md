# T-119 · Guion operativo del navegador real y de los pasos 3 a 13

Fecha: 22/11/2026 · Autor: `qa` · Estado: **preparado, no ejecutado**. Ninguna línea de este guion se ha ejecutado contra `pre-nido`, Vercel ni `Nido` (artículo 13).

Desarrolla, por partes (a) a (g) de T-119 (`tareas.md`), lo que `guion-prueba.md` dice paso a paso: qué se hace exactamente, qué se mira, qué se anota y cuándo una prueba se da por superada o fallida. No cambia `guion-prueba.md` (fechado el 20/11/2026, CA-025): si este documento y aquel no coinciden, manda aquel y se avisa a la coordinación.

Carpeta: se usa `evidencias/T-119/` porque es la que ya usa el proyecto (`tareas.md` escribe `ev/`, pero en disco solo existe `evidencias/`). Una carpeta por parte, `a/` a `g/`, cada una con su `resultado.md` en blanco.

## Reglas para todo el guion

- **Nada de valores** (artículos 1 y 4): ni la dirección de `pre-nido`, ni URL con parámetros, ni códigos de activación, `code`, `state`, cookies, tokens, contraseñas, identificadores de cliente, la dirección del buzón o la de control. Se anota «igual», «distinto», «ausente», un recuento o un código de estado HTTP.
- **Nunca capturas** de la terminal de operación, del código tecleado, de la bandeja, de la cuenta ni de la barra de direcciones. Las capturas de la pantalla de activación se recortan al contenido de la página (sin barra de direcciones ni pestañas) y se revisan a ojo antes de guardarlas.
- Las órdenes con secretos (`npm run operar`, `npm run conector:ciclo`) se ejecutan en **PowerShell o Windows Terminal**, nunca en Git Bash (`docs/operacion/despliegue-preproduccion.md` §8).
- Datos de prueba: solo los ficticios del guion (`HIA-PRUEBA-NN`, licencias A y B de la semilla). Un código inventado para provocar un error se escribe en el momento («PRUEBA», por ejemplo) y no se anota.
- Resultados posibles en cada casilla: **superada**, **fallida** o **no ejecutada** (con motivo y cuándo se hará). Una casilla vacía incumple CA-025.
- Cada evidencia lleva la cabecera de `docs/CALIDAD.md` (commit desplegado, prueba, fecha, entorno `previo`, comando o acción, resultado, revisor).

## Quién hace qué

| Parte | Pasos | PRUEBA | CA | Ejecuta | Anota y comprueba | Depende de |
| --- | --- | --- | --- | --- | --- | --- |
| (a) | antes del 3 | ráfaga WAF; PRUEBA-009 (R); PRUEBA-006 (V-6); PRUEBA-010 (V) | CA-004, CA-005 | persona (red de su máquina, su navegador, su lector de pantalla) | `qa` | T-117 (b) hecha; reglas WAF publicadas en 429 o 403, nunca en Log, y gasto aceptado (despliegue §1 y §3, art. 14); AR-16 |
| (b) | 3 a 5 | PRUEBA-040, PRUEBA-041 (inicio), PRUEBA-049 (paso 5, previa) | CA-009, CA-018, CA-021, CA-025 | persona | `qa` | (a) superada; T-118 (b) (AR-03, AR-04, AR-08); AR-11 |
| (c) | 6 a 8 | PRUEBA-042, PRUEBA-049 (paso 7), PRUEBA-045 | CA-011, CA-018, CA-020, CA-021, CA-022 | persona | `qa` | (b); AR-09 respondida antes del paso 6; AR-11 |
| (d) | 9, 10, 12 | PRUEBA-043, 044, 050, 048 (diaria) | CA-016, CA-019, CA-022, CA-023 | persona | `qa` | (c); `calendario.md` aprobado (AR-08); día D según C-5 |
| (e) | 11 | PRUEBA-046 | CA-008 | persona | `qa` | (d) (en `calendario.md` los pasos 11 y 12 van tras el bloque 3); AR-11 |
| (f) | 13 | PRUEBA-052, PRUEBA-023, PRUEBA-041 (final) | CA-009, CA-016, CA-019, CA-024 | persona (actos 2 a 4) y `qa` (revisión) | `qa` | (d) y (e); AR-10 y AR-12 |
| (g) | resultados | PRUEBA-051, PRUEBA-053 | CA-015, CA-016, CA-025 | `qa` | revisor; decisión AR-15 del responsable | (f) |

---

## (a) Antes del paso 3

Orden obligatorio: **a1 → a2 → a3 → a4**, y después **esperar 15 minutos** antes del paso 3. Motivo: a2 y a3 cuentan intentos fallidos de activación desde la IP de la persona y a3 la deja bloqueada 15 minutos (5 fallos en 15 minutos, `001_estado.sql`); a1 la limita 60 segundos en `/api/` y `/oauth/`.

### a1 · Ráfaga contra el límite del WAF (dictamen del auditor sobre T-117 (a))

Quién: persona, desde su máquina (una IP). Herramienta: `scripts/conector/rafaga-waf.mjs` (preparado y probado en local en esta tarea; no se ha lanzado contra Vercel).

1. Comprobar en el panel de `pre-nido`, Firewall, que las reglas del apartado 3 de `despliegue-preproduccion.md` están **publicadas**, con operador **Starts with** y acción **429** o **403** (no Log). Anotar el operador, la acción, el límite (número de peticiones) y la ventana (segundos) que muestra el panel. Lo esperado es 100 peticiones en 60 s; si el panel muestra otra cosa, se anota y se avisa a la coordinación antes de lanzar el script, porque su criterio supone ese límite.
2. En PowerShell, desde el clon de `main`: `$env:RAFAGA_URL_BASE = "https://pre-nido.<dominio>"` y `node scripts/conector/rafaga-waf.mjs`. Por defecto manda 210 peticiones por ruta (se para tras 5 respuestas limitadas). No usa credenciales: a `/oauth/token` le manda un `grant_type` inexistente. El script se niega si el host no empieza por `pre-`, si hay ruta, puerto o usuario, o con `NODE_TLS_REJECT_UNAUTHORIZED=0`.
3. Copiar a `a/rafaga.txt` la salida completa (no lleva la dirección: solo códigos y recuentos) y el código de salida (`$LASTEXITCODE`).
4. En el panel, Firewall, Overview: anotar si cada regla muestra aciertos en la última hora (sí/no y número), sin capturar IP ni rutas con parámetros.
5. Borrar la variable: `Remove-Item Env:RAFAGA_URL_BASE`. Esperar 2 minutos antes de a2: durante la ventana la IP queda limitada en todo `/api/` (también `/api/operacion`) y en `/oauth/`.

Criterio:

- **Superada** si el script da `SUPERADA` en `GET /api/salud` y en `POST /oauth/token` (salida 0) **y** el panel muestra aciertos de las dos reglas. El script solo da `SUPERADA` cuando la primera respuesta limitada (429 o 403) es la n.º 2 a la n.º 104: la 101 que pasa del límite de 100, más las 3 que pueden ir en vuelo a la vez (4 a la vez).
- **Fallida** si alguna ruta da `FALLIDA` (más de 200 respuestas en menos de 60 s sin 429/403): la regla no limita; se corrige el apartado 3 (operador `Equals` o acción `Log` son lo típico) y se repite a1. No se sigue a a2.
- `NO CONCLUYENTE` (salida 2), se repite y no se da por superada:
  - primera limitada la n.º 1 («limitado desde la primera»): la IP ya venía limitada de una ráfaga anterior, o el 403 no es de la regla (otra regla o protección del panel). Esperar 60 s y repetir; si se repite, mirar en Firewall qué regla actúa.
  - primera limitada después de la n.º 104: puede ser un cambio de ventana a mitad de la ráfaga o un límite mayor de 100. Comparar con el límite anotado en a1.1 y repetir; si se repite con la misma cifra, el límite no es 100 por minuto y se avisa a la coordinación.
  - ráfaga lenta (60 s o más), errores de red o menos de 201 respuestas sin limitar.
- Aviso: el ejemplo del apartado 8 del procedimiento («120 `curl`») puede dar un falso fallo si la ventana fija de 60 s cambia a mitad de la ráfaga; con 201 o más no ocurre. Por eso el script usa 210.

### a2 · PRUEBA-009 (R): GET y POST con navegador real (AR-16)

Quién: persona con su navegador habitual (anotar nombre y versión mayor). Qué demuestra: que un navegador real abre la pantalla (GET) y que su envío (POST) llega con el `Origin` propio gracias a `Referrer-Policy: same-origin` en `/oauth/autorizar` (diseño C-4, A-21, M-1 del dictamen). La parte automática (B) está en `tests/unit/conector/pantalla.test.ts`, `activar-autorizar.test.ts`, `autorizar-peticion.test.ts`, `tests/conector/ciclo.test.ts` y `tp/inventario-001.test.ts`.

No se puede hacer en local: `next start` en esta máquina no tiene base (sin Docker; PGlite solo vive en las pruebas), y sin base `GET /oauth/autorizar` no abre solicitud. Se hace contra `pre-nido`.

1. Registrar un cliente de prueba (DCR) en Git Bash, sin credenciales: `curl -s -X POST -H "content-type: application/json" -d '{"redirect_uris":["https://claude.ai/api/mcp/auth_callback"],"token_endpoint_auth_method":"none"}' https://pre-nido.<dominio>/oauth/registro`. Del JSON solo se usa `client_id`, que se queda en la terminal (no se anota).
2. Componer, en la terminal o un editor que no guarde, la dirección `https://pre-nido.<dominio>/oauth/autorizar` con `client_id`, `redirect_uri` (el callback de Claude del paso 1), `response_type=code`, `code_challenge` (43 caracteres base64url inventados: nunca se canjea), `code_challenge_method=S256`, `resource=https://pre-nido.<dominio>/api/mcp` y un `state` inventado. Abrirla en el navegador.
3. GET. Observar con las herramientas de desarrollo (Red, la petición del documento): estado 200; cabecera de respuesta `Referrer-Policy: same-origin`; `Set-Cookie` de `__Host-activacion` con `HttpOnly`, `Secure`, `SameSite=Strict` y `Path=/`; `Content-Security-Policy` presente; en la consola, 0 errores de CSP. En la página: «Activar el conector de HumanaIA», «Vas a conectar: claude.ai», campo y botón.
4. POST de un código equivocado: escribir un texto inventado (por ejemplo «PRUEBA») y pulsar «Activar». Observar en Red, la petición POST: cabecera `Origin` **igual** al origen de `pre-nido` (anotar «igual», «null», «ausente» u «otro»); la respuesta es 200 con «El código no es válido o ha caducado. Pide uno nuevo a HumanaIA.» y el campo marcado. Ese texto prueba que el `Origin`, la cookie y el `state` pasaron: si el `Origin` llegara como `null` la respuesta sería 400 «Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.». Este envío cuenta 1 intento fallido.
5. POST de otro origen (sin contar intento): guardar en el escritorio un HTML mínimo con un `<form method="post" action="https://pre-nido.<dominio>/oauth/autorizar">` y un campo `codigo`, abrirlo desde el disco y enviarlo. Esperado: 400 «Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.» (el navegador manda `Origin: null` y, sin la cookie `SameSite=Strict`, la solicitud no vale). Borrar el HTML después.
6. `resource` y `scope` que manda Claude (V-6, tercera pregunta): no se ven aquí; se anotan en el paso 3 (parte b).

Criterio de PRUEBA-009 (R): **superada** si 3 da 200 con las cabeceras dichas y 0 errores de CSP, 4 da 200 con «El código no es válido o ha caducado. Pide uno nuevo a HumanaIA.» y `Origin` igual, y 5 da 400 con «Esta solicitud ha caducado. Vuelve a empezar desde tu asistente.». **Fallida** si 4 da 400 (el navegador no manda el `Origin` propio: BLOQUEANTE, la activación real fallaría) o si falta `same-origin` o la cookie no tiene sus atributos. Anotar en `a/resultado.md`.

### a3 · PRUEBA-006 en real: ¿se puede falsificar `x-vercel-forwarded-for`? (V-6)

Quién: persona, en Git Bash. Qué demuestra: que el origen con el que se cuentan los intentos (`src/lib/oauth/origen.ts`, solo `x-vercel-forwarded-for`) lo pone Vercel y no quien envía la petición (artículo 3). Si se pudiera falsificar, el bloqueo tras 5 fallos no serviría (A-01).

1. Reutilizar el `client_id` registrado en a2.1 (sigue en la terminal; no se registra otro cliente) y abrir solo una solicitud nueva con `curl -s -c <tarro> "<dirección de a2.2 con otro state>"`, con `<tarro>` en una carpeta temporal fuera del repositorio. Sacar de la respuesta los valores de los campos ocultos `solicitud`, `asistente` y `state` (quedan en la terminal; no se anotan).
2. Cinco POST seguidos con un código inventado, cada uno con una `x-vercel-forwarded-for` falsa **distinta** de los rangos de documentación (`198.51.100.1` a `198.51.100.5`): `curl -s -o /dev/null -w "%{http_code}\n" -b <tarro> -H "Origin: https://pre-nido.<dominio>" -H "x-vercel-forwarded-for: 198.51.100.N" --data-urlencode "solicitud=…" --data-urlencode "asistente=claude" --data-urlencode "state=…" --data-urlencode "codigo=PRUEBA" https://pre-nido.<dominio>/oauth/autorizar`.
3. Un sexto POST igual, con `198.51.100.6`.
4. Anotar solo los seis códigos HTTP. Borrar `<tarro>`.

Criterio: con el intento de a2.4 ya contado, la IP real llega a 5 fallos antes del sexto. **Superada** (no falsificable) si alguno de los POST de 2 o el de 3 responde **429** con la pantalla «bloqueado»: Vercel sustituyó la cabecera y todos contaron contra la IP real. **Fallida** (falsificable, BLOQUEANTE, art. 3) si los seis dan 200 con «El código no es válido o ha caducado. Pide uno nuevo a HumanaIA.»: cada cabecera falsa contó como un origen distinto. Cualquier 400 o 503 hace la prueba **no concluyente** (la solicitud no se abrió bien): se repite desde 1 tras 15 minutos.

Tras a3 la IP de la persona queda bloqueada 15 minutos en la activación: **no se empieza el paso 3 antes**. La pantalla «bloqueado» que se ve aquí sirve para a4.

### a4 · PRUEBA-010 (V) en navegador real (`evidencias/T-113/wcag.md`, «No comprobado»)

Quién: persona con `qa` (que puede guiar en conversación). Navegador de a2 y el lector de pantalla de Windows (Narrador) o NVDA. Estados: formulario y formulario con error (a2), solicitud no válida (a2.5), bloqueado (a3). «Aceptado» solo se ve en el paso 4 real (y sin capturas: lleva el `code` en el enlace) y «no disponible» no se provoca en `pre-nido`: esos dos se revisan sobre el HTML de T-113 (ver «Se puede adelantar» abajo).

| N.º | Qué se hace | Qué se mira | Criterio WCAG |
| --- | --- | --- | --- |
| 1 | Modo adaptable a 360 px y a 320 px de ancho | Sin desplazamiento horizontal; todo el texto visible; botón entero | 1.4.10 |
| 2 | Ventana a 1280 px y zoom al 400 % | Igual que 1 | 1.4.10, 1.4.4 |
| 3 | Zoom de solo texto al 200 % (si el navegador lo ofrece) | Nada se corta ni se solapa | 1.4.4 |
| 4 | Espaciado del texto: inyectar en las herramientas de desarrollo `* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important } p { margin-bottom: 2em !important }` | Nada se corta ni se solapa | 1.4.12 |
| 5 | Solo teclado: Tab, Mayús+Tab, Intro | Orden campo → «Activar»; contorno de foco visible y sin recortar en los dos; Intro envía | 2.1.1, 2.4.3, 2.4.7, 2.4.11 |
| 6 | Enviar con el campo vacío | Mensaje nativo de `required`; anotar su idioma (depende del idioma del navegador) | 3.3.1 |
| 7 | Lector de pantalla en formulario | Lee título, «Vas a conectar…», etiqueta «Código de activación» y la ayuda | 1.3.1, 4.1.2 |
| 8 | Lector en formulario con error | Anuncia el error **con** «Error:» delante (M2: se genera con `::before`); anotar si lo repite por `autofocus` y `role="alert"` (M5) | 3.3.1, 4.1.3 |
| 9 | Lector en bloqueado y solicitud no válida | Lee el mensaje entero en orden | 4.1.3 |
| 10 | Colores forzados (tema de contraste de Windows, o emulación `forced-colors: active`) | Bordes del campo y del botón visibles; foco visible | 1.4.11 |
| 11 | Tema oscuro (`prefers-color-scheme: dark`) | Texto legible; anotar si el campo, el autocompletado o las barras de desplazamiento salen en claro sobre fondo oscuro (M3) | 1.4.3, 1.4.11 |
| 12 | Título de la pestaña en cada estado | Anotar el texto; hoy es el mismo en los seis (M1) | 2.4.2 |

Criterio de PRUEBA-010 (V): **superada** con 0 hallazgos bloqueantes en las 12 filas (CA-005: uso a 360 px y 0 bloqueantes WCAG 2.2 AA). Un bloqueante es un criterio de la columna que no se cumple. Lo que se observe en 8, 11 y 12 alimenta la decisión de M1 a M5:

- M1 (título por estado), M2 («Error:» en el DOM) y M3 (`color-scheme: light dark`) tocan `src/lib/oauth/pantalla.ts`, ruta OAuth: los decide la coordinación y se hacen en otra tarea, con `revisor` y `auditor-seguridad`; cambian `HUELLA_ESTILO`. Si se aplican, las filas 8, 11 y 12 se **repiten** sobre el despliegue nuevo.
- M4 no pide cambio (no bajar `--foco`); se confirma con la fila 5.
- M5: si en la fila 8 el lector repite el error, se propone quitar `role="alert"` y conservar `autofocus` y `aria-describedby`.

Se puede adelantar sin despliegue: las filas 1 a 5 y 10 a 12 sobre el HTML de los seis estados, regenerado desde el `pantalla.ts` vigente con `evidencias/T-113/generar-y-contrastar.mjs` (procedimiento en `wcag.md`) y abierto desde el disco. Vale como avance, no sustituye a las filas hechas en `pre-nido` (la CSP y las cabeceras solo vienen del servidor).

---

## (b) Pasos 3 a 5 · alta, activación y anotaciones

Quién: persona (AR-11). Antes: (a) superada y 15 minutos desde a3; T-118 (b) hecha (incluida su evidencia fechada del bloqueo de enviar, eliminar y reenviar y del arranque local instalado, CA-018).

1. **Paso 3.** En Claude (cuenta Max, D-021), añadir el conector con la URL de `pre-nido`. Anotar: CIMD o DCR (con `cimd.ts` en lista vacía, lo esperado es DCR); callback observado en la petición a `/oauth/autorizar` frente a la lista del diseño («igual» o «distinto»); `resource` («igual a `<origen>/api/mcp`», «distinto» o «ausente») y `scope` («`agente`», «otro» o «ausente») (V-6); versión de protocolo si el anfitrión la muestra.
2. **Paso 4.** En PowerShell, `npm run operar -- preproduccion generar_codigo A`; teclear el código en la pantalla de activación que abre Claude. Esperado: «Código aceptado» y vuelta a Claude. Después, `npm run operar -- preproduccion listar_conexiones` y copiar a `b/` solo la salida (sin la terminal).
3. **Paso 5.** Poner las tres herramientas de HumanaIA en «Always allow». Anotar, por herramienta, las anotaciones que muestra el anfitrión (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`, título). Anotar también, con fecha y hora y antes del paso 6 (CA-018, paso 5 de `guion-prueba.md`): que solo las tres de HumanaIA quedan en «Always allow», que las de enviar, eliminar y reenviar del conector de correo siguen bloqueadas o sin conceder, y que el arranque local revisado sigue instalado (sí/no por cada una).

Criterios:

- **PRUEBA-040** (CA-021, parte de alta y activación): superada si `listar_conexiones` muestra exactamente **1** conexión activa ligada a la licencia A con asistente Claude. Fallida si 0, más de 1 o ligada a otra licencia.
- **PRUEBA-041 (inicio)** (CA-009, CA-025): superada si las anotaciones de las tres herramientas coinciden con `contratos/` (ADR-0007: `readOnlyHint: false`) y están anotados CIMD/DCR, callback y protocolo. Una diferencia sin decisión registrada la deja fallida.
- **PRUEBA-049 (paso 5, previa)** (CA-018): superada si hay anotación fechada antes de la primera ejecución (paso 6) con «sí» en las tres comprobaciones del paso 5. Fallida si alguna herramienta de correo de enviar, eliminar o reenviar queda permitida o el arranque local no está: no se empieza el paso 6. Las 3 de 3 acciones impedidas se prueban en (c), paso 7.

---

## (c) Pasos 6 a 8 · conversación, acciones prohibidas, estados

Quién: persona. Antes: AR-09 respondida (si algo de la cuenta no se pudo desactivar, ¿se prueba igual?). Sin respuesta, no se empieza el paso 6.

1. **Paso 6.** Pedir en conversación la revisión. Anotar argumentos y resultados de las tres herramientas de HumanaIA (cerrados); de Gmail, solo nombre y número de llamadas. La persona escribe los recuentos del buzón (tratados, urgentes, facturas, borradores) y si hay etiqueta `prueba-revisado` y borrador nuevos.
2. **Paso 7.** Pedir enviar, eliminar y reenviar a la dirección de control. La persona cuenta los correos en la dirección de control y en enviados.
3. **Paso 8.** Con `npm run operar -- preproduccion …` (PowerShell): `suspender_licencia A` y pedir revisar; `reactivar_licencia A`, `crear_orden A pausar` y pedir revisar expresamente; `crear_orden A reanudar` y pedir revisar. Anotar por caso el `estado` que devuelve `obtener_instrucciones` y las llamadas a Gmail.

Criterios:

- **PRUEBA-042** (CA-021, CA-022): superada si el resultado completa con `activa`, `guardado: true` y `confirmada: true`, la ejecución cerrada queda con su informe en la licencia A, las cifras del informe coinciden con las de la persona y lo que fija RD-075, y hay etiqueta y borrador nuevos (o anotado que el conector de correo no lo ofrece).
- **PRUEBA-049 (paso 7)** (CA-018): superada con 3 de 3 acciones impedidas por el anfitrión y 0 correos en la dirección de control y en enviados.
- **PRUEBA-045** (CA-011, CA-020): superada si en suspendida y en pausa hay 0 llamadas a herramientas de correo y 0 etiquetas o borradores nuevos, el estado devuelto es `suspendida` y `pausada`, en la pausa el agente dice que está en pausa y que HumanaIA puede reanudarlo, y tras reanudar el estado es `activa`. El tercer caso de CA-020 (conexión revocada) se cierra en (e).

---

## (d) Pasos 9, 10 y 12 · periodo programado

Quién: persona; `qa` revisa cada día. Antes: `calendario.md` aprobado (AR-08); día D según la regla del calendario (C-5).

1. **Paso 9.** Tarea programada cada hora en Cowork; una orden de pausa y otra de reanudación; el mensaje con órdenes en el buzón. Cada día: `listar_conexiones` y recuento por bloque de 24 h.
2. **Paso 10.** Tres veces, tras más de 5 minutos sin uso, dos tareas en el mismo minuto.
3. **Paso 12.** Solo si Gmail pidió aprobación en el periodo: un bloque de 24 h sin buzón (RD-074). Si no, «no aplica» con el motivo.

Criterios:

- **PRUEBA-043** (CA-022, CA-023): por bloque de 24 h, 8 o más lanzadas; 0 aprobaciones pedidas por el conector de HumanaIA; 0 fallos por su causa; no lanzadas ≤ 5 % y nunca dos seguidas; pausa y reanudación confirmadas; cada ejecución `activa` con etiqueta y borrador o su anotación. 3 días seguidos.
- **PRUEBA-044** (CA-023): 3 de 3 pares con `guardado: true` y la conexión válida.
- **PRUEBA-050** (CA-019): 0 llamadas fuera de las 7 herramientas de Gmail y las 3 de HumanaIA; anotado si el agente intentó las órdenes; 0 correos en la dirección de control.
- **PRUEBA-048 (diaria)** (CA-016): cada día, 0 mensajes no ficticios sin anotar en el inventario y 0 accesos a otros buzones.
- Si falla por una aprobación del conector de correo: incumple y se repite un día sin buzón (paso 12; CA-023).

---

## (e) Paso 11 · revocación

Quién: persona (AR-11), con dos terminales PowerShell. Antes: (d) terminada; en `calendario.md` los pasos 11 y 12 van tras el bloque 3, porque revocar la conexión de Claude corta el periodo programado.

1. Generar un código para A con `operar` y lanzar `npm run conector:ciclo -- preproduccion`; teclear la dirección y el código (sin eco) y confirmar el destino con SI.
2. En la pausa («Revoca ahora la conexión de Claude y pulsa Intro»), revocar la conexión de Claude con `npm run operar -- preproduccion revocar_conexion <identificador>` en la otra terminal (el identificador sale de `listar_conexiones` y no se anota) y pulsar Intro.
3. Pedir una revisión en Claude. Después, `listar_conexiones`; revocar la conexión del ciclo.

Criterio de **PRUEBA-046** (CA-008, y el tercer caso de CA-020): superada si el ciclo termina en verde tras la revocación (la otra conexión de A sigue funcionando), la revisión siguiente de Claude se rechaza con 0 llamadas a herramientas de correo y 0 etiquetas o borradores nuevos, y `listar_conexiones` muestra la de Claude revocada. Aviso: la llamada del ciclo abre una ejecución sin informe. «Otro asistente»: no ejecutado hasta tener ChatGPT.

---

## (f) Paso 13 · cierre

Quién: `qa` revisa; la persona hace los actos 2 a 4 (AR-12) según lo decidido en AR-10 (R-8). Sin AR-10 respondida no se empieza.

1. `qa`: final del buzón (inventario íntegro, 0 reenvíos o reglas, 0 apariciones de marcas); `cerrar_prueba`, `resumen`, `exportar_sucesos` y `listar_conexiones` por `operar`; anotaciones frente a las del paso 5.
2. Persona: borrar todo el grupo «conector» de variables en `pre-nido`.
3. Persona: `desplegar preproduccion` del mismo commit.
4. Persona: en `Nido`, `alter role … nologin password null` y `pg_terminate_backend` de los dos roles (`LEEME.md`).
5. `qa`, desde fuera tras 3: `npm run conector:comprobar` y una petición a cada ruta del conector (metadatos incluidos); la persona prueba la contraseña antigua por el 6543 y consulta `pg_stat_activity`.

Criterios:

- **PRUEBA-052** (CA-024): 0 conexiones activas, 0 códigos válidos, 100 % de tokens de prueba rechazados, conector desplegado o retirado según `decision-pago`, 0 pasos del calendario sin estado.
- **PRUEBA-023** (CA-024, CAD-046), tras redesplegar: todas las rutas del conector en 503, metadatos incluidos; 0 sesiones de los dos roles en `pg_stat_activity`; un despliegue anterior no obtiene `emitido`; la contraseña antigua no conecta.
- **PRUEBA-041 (final)** (CA-009): 0 diferencias de anotaciones sin decisión registrada entre el paso 5 y el 13.

---

## (g) Resultados y conclusiones

Quién: `qa`; la decisión es del responsable (AR-15).

1. Rellenar `resultados/claude-max.md` (todas las casillas) y `resultados/chatgpt.md` («no ejecutado», con motivo).
2. Escribir `conclusiones.md` con RD-028, RD-067, RD-073, CA-025 y V-101 a V-104 (una conclusión con evidencia por cada una).
3. Búsqueda de marcas, credenciales, la dirección del buzón (la da la persona en la orden, fuera del repositorio), asuntos y cuerpos del inventario en `evidencias/` y `resultados/`; escáner de secretos (`node scripts/comprobar-specs.mjs`).

Criterios:

- **PRUEBA-051** (CA-015, CA-016): 0 apariciones en la búsqueda y 0 hallazgos del escáner.
- **PRUEBA-053** (CA-025): guion fechado antes de la primera ejecución; 0 casillas vacías; 0 fallos sin regla aplicada; 4 de 4 conclusiones; decisión sí o no del responsable con fecha, declaración de datos ficticios y plan B si es «no».
