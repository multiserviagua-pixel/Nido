# 021 · Plan

Autor: `arquitecto` · Fecha: 21/11/2026

Diseño: `diseno.md`, corregido tras `dictamen-diseno-5.md` (0 B, 1 M, 6 m), **sin que el auditor lo haya visto**, y ajustado el 21/11 a las respuestas del responsable a A-11, A-14 y A-15 (D-039) y a la 2.ª vuelta de la enmienda (fila (d) de cada anulación de marca, PRUEBA-056; C-8 sin marca) y a la revisión D-039 del `revisor` (umbral con marca sin bloqueo por origen, CA-006 en PRUEBA-049, P1 sin D-039) y, después, al dictamen del auditor sobre D-039 (`dictamen-diseno-6.md`, 0 B, 3 M, 4 m; tabla en `tareas.md`), sin que el auditor haya confirmado la corrección. Respuestas al auditor y al `revisor`, en `tareas.md`; 18 tareas en seis bloques. **No se ha ejecutado ninguna prueba.** Movido del diseño (D-023): tareas previas, pruebas, archivos, dependencias y vuelta atrás.

## Orden de trabajo

### Los bloques, en orden

| Bloque | Tareas | Qué deja hecho | Por qué va ahí |
| --- | --- | --- | --- |
| 1. Previas | T-001 a T-006, T-017 | T-P1 a T-P4 con evidencia; especificación enmendada; ADR; lista de contraseñas; escáner (M-18) | Deciden los controles (A-13) |
| 2. Base de datos | T-007 a T-009, T-018 | Tablas, regla, sesión, canal, operaciones, auditoría, disparadores y reintento, con pgTAP y vuelta atrás | El registro propio autoriza |
| 3. Fase 1 y pruebas delante | T-010, T-011 | `proxy.ts` (si T-004 lo confirma), CSP, configuración, `registro.ts`, dependencia; pruebas estática y en navegador | Pruebas y política, antes que las páginas |
| 4. Servidor | T-012 | Clientes del servicio, credencial, guardia, dirección, operaciones, acciones, marca | Las pantallas solo llaman a esto |
| 5. Pantallas y procedimientos | T-013 a T-015 | `/acceso`, `/admin`, scripts del responsable, plantillas y guía | Última capa |
| 6. Verificación | T-016 | `verificacion.md`, pruebas de persona, preproducción | Con CI y preproducción |

### Qué va en paralelo

- **Al empezar:** T-001, T-002, T-004, T-005 (a) y T-017 (a) a la vez (`[P]`); T-003, también desde el principio (A-11 y A-14 decididas, D-039), con la cuenta y la credencial que pone una persona. Ninguna evidencia de T-001 a T-004 se integra antes que T-017 (a) (M-18); T-017 (b), tras T-001 y T-002.
- **Bloque 2 en serie** (T-007 → T-008 → T-009 → T-018: mismas migraciones y pruebas). A la vez: T-010 y T-011.
- **En serie:** T-012 → T-013 → T-014 (comparten `src/lib/acceso/`, `src/components/acceso/` y textos). T-015, a la vez que T-013 o T-014.
- **Límite de la cuenta** (D-032): revisiones y dictámenes, en cola.

### Cómo se integra un par prueba–código

1. **pgTAP y unitarias:** las escribe quien escribe el código, en su tarea, en rojo en su commit antes que el código.
2. **Estática y en navegador:** las escribe `qa` en T-011. Cada prueba se genera solo para las rutas de `tests/e2e/acceso/rutas.ts`; la tarea que crea una ruta la añade en el mismo commit y desde ahí su prueba tiene que pasar. Nada saltado ni marcado como fallo esperado. Excepción: PRUEBA-020, 033 y 051, en T-010 (b) (menor 8).
3. **Servicio real (R) y persona (P):** con evidencia en `evidencias/T-0NN/`; si no se ejecutan, figuran como «no ejecutada».
4. **Cuándo se escribe una prueba, cuándo bloquea y cuándo no compensa** (propuesta del arquitecto, sin respaldo expreso del responsable; **no excusa lo que el dictamen del auditor marque como condición**):

| Caso | Qué se hace | ¿Bloquea integrar? |
| --- | --- | --- |
| **Frontera de la que depende otra tarea** (BD → servidor → pantalla) | Prueba de contrato en la tarea que crea la frontera: forma cerrada de entrada y salida, casos de error | **Sí** |
| **Control de seguridad o hallazgo del dictamen** (guardia, RLS, canal, disparador, `proxy.ts`, PRUEBA-003, 052, 055…) | Se escribe antes que el código, en rojo | **Sí** |
| **Lógica con ramas** (contador, plazos, regla de acceso, «casar») | Unitaria o pgTAP en la misma tarea | **Sí** |
| **Necesita un entorno que aún no existe** (CI, preproducción, persona) | Se escribe igual y se revisa; figura como «no ejecutable aún» con el motivo | **No.** Bloquea solo VERIFICADA (art. 13). Las R contra el proyecto de desarrollo no entran aquí: bloquean integrar T-009 y T-018 (M-19) |
| **Pieza sin lógica propia** (texto fijo, envoltorio que solo pasa props, maquetación) | No lleva prueba propia; la cubren la prueba de su pantalla y PRUEBA-028 | No |
| **Valor que va a cambiar pronto** (provisional, pendiente de una decisión) | Se prueba la regla, no el valor. Un umbral que es control (REQ-024, CA-017) no entra aquí: se prueba su valor | No |

Desempate: si otra tarea se construye encima, se prueba ahora; si no, basta la de la pieza que lo usa.

5. **Rama y puerta** (D-025, D-036): `tarea/021-T-0NN`; `verificar`; `revisor`; `auditor-seguridad` si RC es `C` o `D`; `merge --squash` con `T-0NN (021): …`. Vuelta atrás: `git revert`.

### Lo que bloquea y a quién

| Asunto | Estado | Bloquea |
| --- | --- | --- |
| A-13 (T-P2.12 o T-P2.13 fallan) | Decidida por D-036: no se acepta el riesgo | Si falla T-P2.12: las marcadas «A-13» en `tareas.md` (T-006 (a) y (b), T-007 a T-009, T-012 a T-016 y T-018; T-006 (c) y (d), T-010, T-011 y T-017 siguen). Si falla T-P2.13: T-009 y lo que depende de ella (T-014, T-016, T-018); T-P2.14 da la vía parcial y lo demás vuelve al arquitecto |
| A-11 (correo) | **Decidida por el responsable** (D-039): Google Workspace con el dominio verificado | Quedan V-111 (región y adenda) y V-107, con `verificar-decision`, y T-P3: hasta entonces, el envío real de T-012 (c) y T-015 (b) y la verificación de CA-012 y CA-013 en T-016 |
| A-14 (contraseña de envío fuera del gestor, art. 4) | **Decidida por el responsable** (D-039): excepción acotada, con rotación; decae con la vía preferente (`diseno.md`, «Configuración y secretos») | Nada. La credencial la pone una persona en T-003; si T-P3.13 da la vía preferente viable, su diseño y dictamen antes de usarla |
| A-15 (marca: REQ-007, CA-006 y umbral de REQ-024 y CA-017) | **Decidida por el responsable** (D-039); en la especificación (tres vueltas), enmienda pendiente de aprobar | Hasta cerrar T-005 (b) (aprobación de la enmienda), lo demás de la marca; después, T-007 (d), T-008 (c), T-010 (d), T-011 (c), T-012 (d), la marca en T-013 y T-016 siguen su orden normal |
| 024·A-1 (iv): (a), (b) y (c) como I-42 a I-44 (`specs/024-auditoria/diseno.md` ~324); (d), pedida en `propuestas.md` (21/11) | **Abierta, del responsable**; (d), sin respuesta de la 024 | Los códigos `accion` de T-008 (b) y T-009 (menor 14); los de (d), T-008 (c) y T-009 |
| T-006 (d) (lista de contraseñas sin verificar) | Pendiente | T-012 (b) |
| V-107 (controlador y rol `acceso`, fase 2) | VERIFICAR | El rol `acceso` (T-007, T-008, T-012 (a)); si es inviable, R-B exige diseño propio y dictamen (A-1) |
| V-108, V-113 (fase 2) | VERIFICAR | T-007 (c) y T-008 (a) no los usan sin verificar |

### Tareas de una persona

| Tarea | Qué hace | Cuándo |
| --- | --- | --- |
| Antes de T-001, T-002, T-009 y T-018 | Crea el proyecto de desarrollo del servicio y pone en el gestor local su clave secreta y su cadena del propietario, nunca las de preproducción ni producción (art. 14; uso, en `tareas.md`, m-39) | Al empezar |
| T-003 | Crea una cuenta de envío dedicada por entorno, con verificación en dos pasos, en una unidad organizativa con IMAP y POP desactivados y sin reenvíos ni delegaciones (M-23): `accesos@humannaia.com` solo para producción, que se configura al existir ese entorno; para desarrollo y preproducción, otra que elige, o ninguna y sin envío real. Crea su contraseña de aplicación y la escribe en la configuración SMTP del servicio de ese entorno (excepción A-14); hace el envío real con la de desarrollo; anota en el acta la fecha de rotación y lo comprobado en T-P3 (7) y (13) | Al empezar; producción, al crearla |
| Cada 90 días y ante los hechos de A-14 | Rota la contraseña de aplicación (`diseno.md`, «Configuración y secretos») y anota fecha y entorno en el acta | Mientras dure la excepción |
| Antes de T-012 | Pone en el gestor de cada entorno la clave secreta, la credencial `acceso`, `ACCESO_HMAC_CONTADOR`, `ACCESO_HMAC_CODIGOS` y `ACCESO_HMAC_DISPOSITIVO` (art. 4; m-50) | Antes de sus pruebas |
| T-015 | Ejecuta `primer-administrador.mjs`, `retirar-factor-unico.mjs` y `levantar-bloqueo.mjs` (ningún agente, art. 14) y firma el acta de REQ-022 (A-4) | Al cerrar T-015 |
| T-016 | PRUEBA-018, 028, 050 (parte P) y 032; revisión manual con lector de pantalla | Bloque 6 |
| Coordinación | Hecho el 21/11: A-11, A-14 y A-15 respondidas (D-039; m-27, m-33, M-20). La 2.ª vuelta de la enmienda ya recoge REQ-038, REQ-040, REQ-041 y REQ-051 de la marca. Quedan las dudas 3, 4 y 7 de «Dudas de la enmienda» de `especificacion.md` | Antes de cerrar T-005 |

## Tareas previas

**T-P1 (T-001), 10 criterios** para usar la función del servicio: (1) se entregan una vez (REQ-072); (2) valen una vez, 20 de 20 (REQ-074, REQ-079); (3) regenerar invalida los anteriores (REQ-076); (4) la BD ve su uso (M-1); (5) se pueden invalidar (REQ-040, REQ-067); (6) la baja los invalida (REQ-083); (7) no se obtienen con 1F ni con un token cerrado; (8) no aparecen en los registros (REQ-073); (9) existen en el plan gratuito y en Pro; (10) 64 bits o más. Si falla uno o hay duda, la alternativa del diseño.

**T-P2 (T-002), 23 puntos**

| Puntos | Qué se comprueba |
| --- | --- |
| 1-4 | Cookies propias; `session_id` estable e `iat` posterior (m-24); doble aceptación del código; veto |
| 5-8 | Crear sin enviar (M-8); tipo de enlace; métodos S-1 a S-5; TOTP en SVG (no se guarda; M-18) |
| 9-11 | `localhost`; salida limpia; token cerrado |
| 12 | **Leer las tablas del servicio** (B-1, M-1) desde funciones de `privado` llamadas como `acceso` o como el usuario, nunca con la clave secreta (m-39) |
| 13 | **Disparadores** (M-2, M-13): nombres de columnas; **cuántas escrituras hace un alta** (inserción `unverified`, paso a `verified`) y si al inscribir borra factores sin verificar caducados (M-16); **si recifra `encrypted_password` al iniciar sesión** y si borrar un factor baja el `aal` de la sesión actual (m-35); con qué privilegio cierra la BD las sesiones del servicio (m-44). Evidencia sin valores (M-18) |
| 14-18 | `insufficient_aal` (M-10); factor con solo contraseña (m-20); invalidar códigos; IP (M-6); IP de salida |
| 19-23 | Registros; forma canónica; enlaces sin contraseña; marca de acción (M-9); cookie de 30 días |

**T-P3 (T-003), 13 puntos:** región; adenda (los dos, V-111 con `verificar-decision`; V-107, según D-039); dos pasos; contradicción; envío real; una cuenta de envío por entorno, `accesos@humannaia.com` solo en producción (M-23); (7) sin copias (M-3, M-23): además de no guardar copia de lo enviado, una invitación a una dirección inexistente del dominio; si en la cuenta de envío queda copia del enlace en Recibidos, Spam, Papelera o Enviados (el rebote la trae), regla de borrado comprobada con otra invitación igual o cambio de vía (vuelve al arquitecto); cuenta dedicada; avisos; fallos; suplantación; cuotas; (13) A-14: si la API de gestión devuelve la contraseña SMTP; que la unidad organizativa de la cuenta de envío de cada entorno tiene IMAP y POP desactivados y la cuenta no tiene reenvíos ni delegaciones, anotado en el acta (M-23); y si es viable la vía preferente (gancho de envío del servicio en el plan gratuito y en Pro, API de Gmail con credencial en el gestor, candidatas (i) y (ii), alcance de cada una), con fuente y fecha. Si falla 1 a 12, no hay correo; si falla 13 en la vía preferente, sigue la excepción; si IMAP, POP, un reenvío o una delegación no se pueden quitar, no hay correo y vuelve al responsable (A-14).

**T-P4 (T-004):** P-1 y, si no basta, P-2 con `proxy.ts`; inventario de la política en todos los estados de `/acceso` y `/admin`, diálogos y gráficos incluidos; vías que no pasan por `proxy.ts` (M-14, CVE-2025-29927, `arn1`); qué serializa Next de la dirección en página, redirección, 404, RSC y acción (línea base de PRUEBA-055, M-15); si el 404 dinámico con `admin/not-found.tsx` lleva `lang` (V-1). Confirma o descarta A-2.

## Pruebas

Tipos: E estática, U unitaria, N navegador, B BD, P persona, R servicio real. Sin tipo: N, o N y B en las del dictamen. pgTAP sin sitio hasta la CI de la 010 (A-10); ayudas solo en desarrollo.

| Bloque | Pruebas |
| --- | --- |
| Previas | PRUEBA-001 T-P1 (R); PRUEBA-002 T-P2 (R) |
| Guardia | PRUEBA-003 guardia (E); PRUEBA-004 entradas y perfiles; PRUEBA-005 clave secreta y HMAC (E, N); PRUEBA-006 matriz en 1F (B); PRUEBA-007 caso positivo; PRUEBA-008 cliente (B) |
| Factores | PRUEBA-009 primer factor (N, B); PRUEBA-010 código siempre; PRUEBA-011 factores; PRUEBA-012 recuperación; PRUEBA-013 duraciones (B, N); PRUEBA-014 credencial copiada; PRUEBA-015 tres sesiones; PRUEBA-016 restablecimiento; PRUEBA-017 alta y baja |
| Robustez | PRUEBA-018 mínimo, 100 intentos (B, P); PRUEBA-019 tiempos; PRUEBA-020 incrustación; PRUEBA-021 otro origen; PRUEBA-022 credencial; PRUEBA-023 usuario de otro; PRUEBA-024 valores marcados; PRUEBA-025 privacidad (revisión); PRUEBA-026 caídas; PRUEBA-027 una fila (B, N); PRUEBA-028 accesibilidad (N, P); PRUEBA-029 límites (N, B); PRUEBA-030 códigos; PRUEBA-031 vuelta atrás (B); PRUEBA-032 T-P3 (P, E); PRUEBA-033 T-P4 |
| Dictamen | PRUEBA-041 B-1; PRUEBA-042 M-1 (B); PRUEBA-043 M-2 (R, B); PRUEBA-044 M-6; PRUEBA-045 M-7 (B, U); PRUEBA-046 M-11 (R); PRUEBA-047 M-8; PRUEBA-048 m-5 y m-40 (B); PRUEBA-049 marca; PRUEBA-050 levantamiento (B, N, P); PRUEBA-051 `proxy.ts` (N, E); PRUEBA-052 M-13 y M-16; PRUEBA-053 m-17, m-19 y m-21; PRUEBA-054 m-20 (R, B, N); PRUEBA-055 H-1 y M-15; PRUEBA-056 anulación auditada (B) |
| De la 020 | PRUEBA-034 (V-1), PRUEBA-035 |

### Qué comprueban las que el dictamen afina

- **003 (E, con trampas; M-9, m-30):** falla si hay una acción fuera de los `acciones.ts` o en `src/lib/`; un módulo sensible no es solo de servidor; no se respeta el orden de «La guardia»; se importa `admin.ts` o `acceso.ts` fuera de `operaciones/`; hay rutas paralelas, `template`, `loading`, un `not-found` anidado o `generateMetadata` (V-1); la comodín lee sus segmentos, o algo lee o repite la consulta o los segmentos (`searchParams`, `params`, `useSearchParams`, `usePathname`) fuera de la guardia, de `exigirDireccionLimpia()` y de las listas de `entradas.ts` (H-1, M-15); el `proxy.ts` no es el acotado, o una página, acción, `route.ts` o el `layout.tsx` de `/acceso` o `/admin` no empieza por `exigirValorPolitica()` (M-14, m-30); `admin/layout.tsx` lee el estado por otra vía que `leerEstadoAcceso()` y `sesion_estado()`; `admin/not-found.tsx` importa algo de `src/lib/acceso/` o `src/lib/supabase/`, o lee cabeceras, cookies o parámetros (m-31).
- **005, 024 (m-25):** `ACCESO_HMAC_DISPOSITIVO` solo lo lee `navegador-reconocido.ts` (estática); la marca y su huella, entre los valores marcados.
- **034 (V-1, M-15):** denegado (cliente y adm. de baja), inexistente y área de otra fase, para el mismo usuario; carga completa y RSC, lo de `diseno.md`, «La guardia» (marca `NEXT_HTTP_ERROR_FALLBACK;404`). No compara el árbol de una ruta real denegada con el de la comodín (oráculo aceptado).
- **019 (CA-019, m-56):** además de texto, código y tiempos, las mismas cabeceras de respuesta en cada caso, `Set-Cookie` incluida; con marca, los fallos 9.º y 10.º (que la anula) dan las mismas cabeceras, sin `Set-Cookie` de `__Host-nido-dispositivo`, y C-1 no la cambia en ningún resultado.
- **029 (M-20), sin marca:** 5 fallos cada 15 min mantienen el bloqueo y, a las 3 I-37 en 24 h, queda `acceso_bloqueos_repetidos`; tras levantarlo, se vuelve a bloquear. **Con marca (D-039, T-011 c):** los casos (1) a (7) y (9) de CA-017, con 10 fallos desde la emisión, sin ventana (que no suman por origen ni por cuenta; el origen, al 5.º sin marca), 30 días, 3 por hora y 5 por origen en 15 min para restablecer como valores; (2) firma con dos claves simuladas. **Acumulado (M-22):** con reloj de prueba, 9 fallos cada 15 min durante 2 h: la marca queda anulada al 10.º acumulado, con su fila (d) y `acceso_navegador_anulado_por_intentos`, y desde ahí ese navegador sigue el límite sin marca; un acierto de contraseña entre tandas no pone el contador a cero; tras un inicio de sesión completo (C-4), la marca nueva admite otra vez 9 fallos.
- **032 (T-P3, M-23), P y E:** P, en el acta y la evidencia de T-003, sin direcciones ni enlaces (M-18): una cuenta de envío por entorno, la de producción configurada solo en producción; IMAP y POP desactivados en su unidad organizativa, sin reenvíos ni delegaciones; invitación a una dirección inexistente del dominio y 0 copias del enlace en Recibidos, Spam, Papelera y Enviados de la cuenta de envío (o la regla de borrado, comprobada). E (T-015 b): ni `.env.example` ni la configuración de desarrollo versionada ni el `.env` local de desarrollo, si existe, contienen `accesos@humannaia.com`; y `comprobar-configuracion.mjs`, fuera de producción, falla si el remitente SMTP que devuelve el servicio es esa dirección (respuesta simulada).
- **049 (CA-017 8, REQ-024 i; CA-006 con marca), N y B; en T-008 (c), T-011 (c) y T-013, además de m-51:** un inicio de sesión completo con TOTP (C-4) emite una marca; con un código de recuperación (C-8), en 1F y en cada paso intermedio (C-6, C-12), 0 cookies `__Host-nido-dispositivo` y 0 filas nuevas en `privado.dispositivos_reconocidos`. **Cookie (M-21):** el `Set-Cookie` de C-4 lleva exactamente `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, `Max-Age=2592000` y ningún `Domain`; «olvidar este navegador» la borra con `Max-Age=0`; y en `/acceso`, con la marca puesta, `document.cookie` no la contiene. **Casos negativos de CA-006 con una marca válida:** la marca sola, con una contraseña errónea y con la contraseña correcta y un código erróneo dan 0 sesiones completas y 0 filas del área en el 100 % de los intentos; con solo la contraseña correcta, como mucho una 1F con 0 filas (CA-001); y el segundo paso se pide igual que sin marca.
- **056 (REQ-041, CA-017 10, CA-029), B; en T-008 (c), y `cambio_directo` en T-009:** por cada motivo de `motivo_anulacion`, exactamente una fila (d) por transacción y cuenta, con la cuenta, el momento y el código del motivo, y 0 valores, huellas u orígenes de red; las vinculadas («Auditoría» de `diseno.md`), con `fila_principal_id` a la fila de su causa y el mismo número de principales que sin marca; `titular` e `intentos`, principales; 3 marcas anuladas a la vez, 1 fila; sin marcas que anular, 0; caducidad a los 30 días y 1 minuto, 0; con (d) forzada a fallar, la operación entera se deshace, la marca sigue sin anular y no se concede acceso.
- **051 (M-14):** mayúsculas, barra final, `%2F`, doble barra, `x-middleware-subrequest`, `x-nonce` y política puestos por el cliente, petición RSC y de acción: o hay política con el valor del servidor, o no hay contenido.
- **052 (M-13, M-16, m-35), N y B; R en (2), (3), (6) y (9) (M-19):** (1) añadir y sustituir desde el panel conservan la sesión con una sola I-25 o I-26; (2) inscribir y verificar desde el panel (dos escrituras): 0 cierres y una sola I-25; (3) con un factor sin verificar antiguo, también si el servicio lo borra al inscribir: 0 cierres y el anuncio sigue sin consumir; (4) cancelar el alta anunciada: 0 cierres; (5) segunda alta con otro `factor_id` en la ventana: cierra todo y escribe (c); (6) alta directa con token válido, sin anuncio: al pasar a `verified`, cierra todo y (c); (7) cerrar el anuncio desde otra sesión: lo rechaza la función del panel; (8) «Sustituir» verifica el nuevo en la sesión actual antes del borrado y la sesión sigue en `aal2`; (9) 100 inicios de sesión no cierran ninguna sesión ajena, también si el servicio recifra la contraseña; (10) anuncio rechazado o caducado sin reconocer: cierra todo y (c) (m-37).
- **053 (m-17, m-19, m-21, m-54, m-55), N y B:** además de lo de m-17, m-19 y m-21, tras cambiar la contraseña y tras cerrar las demás sesiones desde un navegador reconocido, ese navegador recibe un valor nuevo (mismo `id` de fila, `Set-Cookie` con los atributos de M-21) y el valor anterior da trato de sin marca en el 100 % de los intentos, como en CA-017 (2); el nuevo vale. Con una marca de A presentada en una sesión de B, `admin_olvidar_navegador`, `admin_cerrar_otras_sesiones` y `admin_anunciar_cambio_contrasena` dejan la marca de A sin anular, sin conservar y sin renovar, y escriben 0 filas (d) de A; la marca de A sigue valiendo.
- **054 (m-20):** con solo la contraseña, el cambio directo cierra sesiones, anula marcas y deja fila; restablecer lo corta.
- **055 (H-1, M-15, m-36, M-17):** testigos hostiles en la consulta y en la ruta (`</script>`, `<!--<script>`, U+2028, comillas, `\` y `%0D%0A`), en cada ruta de `/acceso` y `/admin`, con y sin sesión. **HTML** (carga completa y 404): 0 ejecuciones; 0 apariciones fuera de `self.__next_f`; `<` y `>` siempre escapados. **RSC y acción** (en crudo): `Content-Type` exactamente `text/x-component`, `X-Content-Type-Options: nosniff` y 0 ejecuciones al abrir la dirección como documento. **Todas, redirección incluida:** ninguna cabecera con testigo; `Location`, del mismo origen, sin consulta, que empiece por `/admin` o `/acceso` y sin testigo (m-46); `%0D%0A` no parte `Location`. Se repite en cada actualización de Next; si falla, no se actualiza.

### Cada criterio, con su prueba

| Criterios | Pruebas |
| --- | --- |
| CA-001 / CA-002 / CA-003 | 006, 042, 048 (**aún no ejecutable**) / 004, 041 / 007 |
| CA-004 / CA-005 / CA-006 | 004, 008, 034, 048 / 009 / 010, 041, 049 |
| CA-007 / CA-008 / CA-009 / CA-010 | 011, 052 / 012 / 013 / 014, 053 |
| CA-011 / CA-012 | 015, 043, 052, 053 / 016, 032, 041, 043 |
| CA-013 / CA-014 / CA-015 | 017, 032, 047 / 017, 034 / 018, 045 (**aún no ejecutable**) |
| CA-016 / CA-017 | 018, 045, 050 (**aún no ejecutable**) / 029, 044, 049, 050, 053, 054, 056 |
| CA-018 / CA-019 / CA-020 / CA-021 | 029 / 019, 044 / 020, 033, 051, 055 / 021 |
| CA-022 / CA-023 / CA-024 / CA-025 | 022 / 022 / 023 / 005, 042, 045 |
| CA-026 / CA-027 / CA-028 / CA-029 | 024 / 025 / 026 / 027, 043, 047, 050, 052, 054, 056 |
| CA-030 / CA-031 / CA-032 / CA-033 | 028, 034 / 028 / 015, 030, 046 / 008, 017 |
| CA-034 / CA-035 | 015 / 017, 047 |

## Mapa de archivos

(n) = no está en `docs/ESQUELETO.md`.

| Ruta | Contenido |
| --- | --- |
| `src/lib/supabase/` | `servidor.ts` (publicable, sin almacenamiento; lo usan de la 022 a la 024 y la 040), `admin.ts` (clave secreta; S-1 a S-5), `acceso.ts` (n) |
| `src/lib/acceso/` (n) | `guardia.ts` (+`leerEstadoAcceso()`), `lectura.ts`, `credencial.ts`, `navegador-reconocido.ts`, `origen.ts` (+`claveDeOrigen()`), `entradas.ts` (también los parámetros de dirección por ruta, H-1), `direccion.ts` (+`exigirDireccionLimpia()`), `intentos.ts`, `tiempo-fijo.ts`, `resultados.ts`, `operaciones/`, `politica.ts` (`exigirValorPolitica()`, solo con `proxy.ts`) |
| `src/app/` | `acceso/acciones.ts`, `acceso/renovar/route.ts`; `admin/`: `layout.tsx`, `not-found.tsx`, `[...resto]/page.tsx`, `ajustes/administradores/`, `cuenta/` (n) |
| `src/components/acceso/` (n) | `AvisoCaducidad`, `CampoCodigo`, `CodigosRecuperacion`, `AltaFactor` |
| Otros | `supabase/migrations/`, `supabase/tests/`, `supabase/plantillas-correo/` (n); `scripts/acceso/` (n) con `primer-administrador.mjs`, `retirar-factor-unico.mjs`, `levantar-bloqueo.mjs` y `comprobar-configuracion.mjs`; `guia-responsable.md` (m-25, m-28); `tests/unit/acceso/`, `tests/e2e/acceso/` |
| Fase 1 | `next.config.ts`, `configuracion.ts`, `src/proxy.ts` (n, A-2) |

## Dependencias

| De quién | Qué hace falta | Tareas que esperan |
| --- | --- | --- |
| 002 | App en `main` y `npm run verificar` (002·T-003); `configuracion.ts` (002·T-005); que `registro.ts` (002·T-004) acepte 13 códigos + 1 de la marca (D-039): `acceso_fallo_primer_factor`, `acceso_fallo_segundo_factor`, `acceso_registro_factor_rechazado`, `acceso_auditoria_pendiente`, `acceso_correo_no_enviado`, `acceso_servicio_no_disponible`, `acceso_servicio_pendiente`, `acceso_cierre_servicio_pendiente`, `acceso_cambio_fuera_del_panel`, `acceso_origen_no_disponible`, `acceso_navegador_anulado_por_intentos` (marca), `acceso_bloqueo_levantado`, `acceso_bloqueos_repetidos` y `acceso_cupo_restablecimiento_agotado`; `next.config.ts`; PRUEBA-043, 046, 052, 054 y 055 en su batería; `arn1` y preproducción (D-016, D-020) | T-004 (app), T-010, T-016 |
| 010 | Migraciones aplicadas: `20261120000200_clientes_y_acceso.sql` (M02: `administradores` con `on delete cascade`) y `20261120000700_reglas_de_acceso.sql` (M07: `es_admin()` por `aal2`; solo `es_admin()` y `clientes_del_usuario()` para `authenticated`). Que acepte las filas de fase 2 de `propuestas.md` (14/11 y 21/11), en migraciones **nuevas**. Sus pgTAP `04_funciones` y `09_administradores` (010·T-011) cambian con esto. pgTAP en CI (010·T-013, A-10); V-107, V-108, V-113 | T-007 a T-009, T-016 |
| 020 | Hechos: `sin-acceso.ts` (020·T-008 (b)), inventario de la política (020·T-009 (c)). Pendientes: `registrarFallo` (020·T-008 (c)); `Armazon`, `CuentaUsuario`, `Boton`, `useAccion`, `leerResultadoAccion`, `DialogoConfirmacion` (020·T-010 (a), (c), (d), (j)); `Formulario` y `EstadoSinPermiso` (020·T-016 (a), (c)); `TextoDato` (020·T-007); `textos.ts`; PRUEBA-034 con los criterios de V-1 de arriba (020·T-009 (j)); testigos U+2028, `<!--<script>` y en la ruta en su cadena hostil (H-1) | T-011, T-012, T-013, T-014 |
| 024 | Su A-1 (iv), I-42 a I-44, y los códigos de (d) por motivo, vinculables según `diseno.md`, «Auditoría» («Lo que bloquea») | Los códigos `accion` de T-008 (b) y (c) y T-009 |
| 052 (fase 6) | Google Workspace en su lista de encargados (REQ-021, REQ-022): envía a direcciones de adm.; región y adenda, de T-003 (menor 15) | T-003, T-016 |
| 040 (fase 5) | `/acceso` compartida: A-5 y H-1 (sin parámetros, `exigirDireccionLimpia()`) | T-013 |
| Fase 6 | Plazos de conservación; lo que guarda el servicio (REQ-038) | T-016 |
| Coordinación | `docs/SEGURIDAD.md` (excepción A-14 en la lista de publicación, `propuestas.md` m-26), `docs/TECNOLOGIAS.md` (A-13, V-107, V-111; D-039 ya anotada); dudas de la enmienda, al `especificador` | T-005 (b), T-006 |

## Riesgos y cómo se reducen

| Riesgo | Señal | Qué se hace |
| --- | --- | --- |
| El servicio no deja leer sus tablas o no admite disparadores | T-P2.12 o T-P2.13 fallan | A-13 («Lo que bloquea»); aceptar el riesgo, solo el responsable |
| El servicio recifra la contraseña al iniciar sesión | T-P2.13; PRUEBA-052 (9) | Contaría como «contraseña sin anuncio»: se para T-009 y vuelve al arquitecto (m-35) |
| Un alta hace escrituras que el diseño no prevé | T-P2.13 ve más de dos escrituras o borrados ajenos | No se escribe T-009 hasta que el arquitecto ajuste «casar» (M-16) |
| Los códigos del servicio no cumplen | T-P1 falla un criterio | Alternativa propia, ya diseñada y siempre construida |
| P-1 rompe la hidratación | T-P4 | P-2 con `proxy.ts` acotado, ADR y dictamen (A-2) |
| Next cambia lo que serializa | PRUEBA-055 en rojo tras una actualización | No se actualiza; vuelve al arquitecto y al auditor (AM-39) |
| El 404 de «sin acceso» no se iguala | PRUEBA-034 | No se integra ninguna vista de `/admin`; vuelve al arquitecto |
| Las pruebas de la 010 rompen | `04_funciones` o `09_administradores` en rojo | Cambian en la tarea de la 021 que las rompe (T-007), con dictamen |
| No hay sitio para pgTAP | 010·T-013 sin CI | PGlite provisional (A-10); nada pasa a VERIFICADA |
| V-111 o T-P3 no se confirman | Región, adenda o envío real fallan | Se construye sin envío real; CA-012 y CA-013 «no ejecutadas»; vuelve al responsable (A-11) |
| La contraseña de aplicación se expone | Aparece en un registro, evidencia o escáner, o sospecha | Rotación inmediata (A-14); la búsqueda de PRUEBA-024 la incluye como valor marcado |
| La vía preferente es viable | T-P3.13 | Diseño propio del arquitecto, ruta crítica (webhook), dictamen y P1 de esa parte; al ponerla en marcha, se revoca la contraseña y decae la excepción |
| La marca llega tarde | T-007 (d) a T-012 (d) sin integrar | El resto avanza sin marca; AM-08a sigue como riesgo residual, no como controlado, hasta integrar la marca (M-20) |
| Faltan componentes de la 020 | 020·T-010 o T-016 pendientes | T-013 y T-014 esperan; no se crean sustitutos |

## Entornos y despliegue

- **Local:** unitarias y en navegador sobre la compilación local; BD con PGlite (A-10) mientras no haya CI.
- **Servicio real:** proyecto de desarrollo que crea una persona (T-001, T-002, T-009, T-018, PRUEBA-046).
- **CI:** pgTAP de la 010 (010·T-013) antes de verificar.
- **Preproducción y producción:** no existen (D-016). T-016 repite allí lo que dependa del entorno; hasta entonces, «no ejecutada». La 021 no se despliega en producción sin T-016.
- **Vuelta atrás de las migraciones** (PRUEBA-031):

| Migración | Vuelta atrás |
| --- | --- |
| M-1, tablas | Se borran |
| M-2, `administradores` | Se restaura |
| M-3, funciones y rol | Se revocan |
| M-4, `es_admin()` | Restaura la de M07, que **reabre por `aal2`**: va junto con la vuelta atrás de la app y lo dice su cabecera |
| M-5, `auditoria` | No en producción |
| M-6, disparadores y reintento (T-018) | Primero la salida |

- **App:** `git revert` por el mismo camino; `proxy.ts` y política, con la de la 002.

## Puertas que aplican

| Puerta | Aplica | Nota |
| --- | --- | --- |
| P1 Diseño y plan | Sí | **Abierta salvo D-039, pendiente de dictamen.** Abierta por delegación D-036 el 21/11/2026 (revisor sin bloqueantes; 6.ª confirmación del auditor, sin archivo propio y anotada en `relevo-c2.md`: 0 bloqueantes y 0 mayores, m-51 a m-53 corregidos; comprobador SUPERADO), con A-11, A-14 y A-15 abiertos, que el responsable respondió después (D-039, 21/11; «Lo que bloquea»). **No cubre lo cambiado por D-039** (respuestas a A-11, A-14 y A-15, tres vueltas de la enmienda, la enmienda mecánica de M-22 y estas correcciones, en `diseno.md`, «Respuesta al dictamen»): el `auditor-seguridad` lo dictaminó (`dictamen-diseno-6.md`, 0 B, 3 M, 4 m) y queda fuera hasta que confirme la corrección y se anote aquí. Tampoco cubre la vía preferente de A-14 (diseño, dictamen y P1 propios) ni S-6: si S-6 aparece (T-018), se reabre el diseño (menor 7) |
| P2 Código | Sí | Tipos, estilo, unitarias y pgTAP en cada tarea |
| P3 Integración | Sí | BD, servicio real y fallos (PRUEBA-026) |
| P4 Seguridad y privacidad | Sí | `revisor` siempre; `auditor-seguridad` en RC `C` y `D` |
| P5 Experiencia | Sí | PRUEBA-028 (N y P), PRUEBA-034 |
| P6 Operación | Sí | Migraciones, vuelta atrás (PRUEBA-031), scripts y guía |
| P7 Cierre | Sí | Lo que dependa de una persona o de un entorno inexistente no figura como superado; AM-08a, como riesgo residual tratado por la marca (D-039, M-20) salvo con origen compartido (m-57); la excepción de A-14, con su rotación y lo comprobado en T-P3 (7) y (13) anotados |

## Rutas críticas tocadas

Todas exigen dictamen del `auditor-seguridad` además del `revisor` (OAuth y licencias, RLS y migraciones).

| Ruta | Tarea | Qué exige |
| --- | --- | --- |
| `supabase/migrations/`, `supabase/tests/` | T-007, T-008, T-009, T-018 | Dictamen; pgTAP de acceso cruzado y vuelta atrás |
| `scripts/patrones-secretos.mjs` (control del gancho y de `comprobar-specs.mjs`) | T-017 (a) y (b) | Dictamen y aprobación (D-036) que nombra la reservada |
| `src/proxy.ts`, `next.config.ts`, `configuracion.ts`, `registro.ts`, `package.json`, `package-lock.json` | T-010 | Dictamen y aprobación (D-036) que nombra las reservadas |
| `src/lib/acceso/`, `src/lib/supabase/` | T-012 | Dictamen |
| `src/app/acceso/` (acciones, `renovar/route.ts`, páginas) | T-013 | Dictamen |
| `src/app/admin/` (`layout.tsx`, `not-found.tsx`, comodín, acciones) | T-014 | Dictamen |
| `scripts/acceso/`, `supabase/plantillas-correo/` | T-015 | Dictamen |
| `docs/adr/` (fronteras de la arquitectura) | T-006 | Dictamen |
| `tests/unit/acceso/` estática (PRUEBA-003) | T-011 | Dictamen (es un control) |

T-001 a T-004 no tocan código de producto, pero sus evidencias deciden controles: dictamen sobre la evidencia. Si se adopta la vía preferente de A-14, su `route.ts` del gancho de envío es ruta crítica (webhook) y entra en esta tabla con su diseño.

## Aprobación

Puerta P1. Por D-036 la anota la coordinación, con fecha y constancia para que el responsable pueda revocarla.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
