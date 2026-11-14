# 021 · Diseño

Autor: `arquitecto` · Amenazas: `auditor-seguridad` (pendiente: este diseño no tiene dictamen todavía) · Fecha: 13/11/2026

Especificación: APROBADA el 13/11/2026 (puerta P0). Este diseño no cambia el estado de la función ni se aprueba a sí mismo: lo aprueba el responsable en la puerta P1, con dictamen previo del `auditor-seguridad`. **Ninguna prueba citada aquí se ha ejecutado**: el diseño dice qué prueba habrá, no que pasa. Lo que se sabe del servicio de identidad y del correo sale de documentación oficial leída el 13/11/2026 (`evidencias/verificacion-identidad-y-correo.md`), no de pruebas reales; donde el diseño depende de un comportamiento sin comprobar, lo dice y lo convierte en tarea previa con regla de decisión.

## Resumen

El servicio de identidad (Supabase Auth, D-002) comprueba credenciales: contraseña, código de la aplicación de códigos y pruebas de un solo uso por correo. **No decide quién entra en el área.** Eso lo decide un registro propio en la base de datos, con cuatro piezas: quién es administrador y en qué estado, qué factores reconoce el área, qué sesiones están completas y vivas, y qué invitaciones y autorizaciones de registro hay. La razón es que el servicio, tal como está documentado, no da cuatro cosas que la especificación exige: corte inmediato de sesiones, límite de intentos por cuenta, duración de sesión en el plan gratuito y registro del primer factor condicionado a una prueba por correo. Además, su API es pública: quien tenga una contraseña puede hablar con él sin pasar por nuestro servidor. Con el registro propio, nada de lo que alguien consiga directamente contra el servicio (una sesión con `aal2`, un factor inscrito por su cuenta) vale en el área, porque no tiene fila en el registro.

La regla de acceso es una sola función de la base de datos, `privado.es_admin()`, que usan todas las políticas del área: administrador en estado `activo` **y** sesión del token (`session_id`) presente en el registro de sesiones, sin cerrar, con menos de 24 horas desde su inicio y menos de 60 minutos desde su última actividad. Cerrar una sesión, cerrar las demás, dar de baja, cambiar la contraseña o retirar un factor es cerrar filas de ese registro en la misma transacción que escribe la auditoría: la siguiente consulta de esa sesión lee cero filas, sin esperar a que caduque ningún token. Las duraciones de REQ-011 y REQ-012 se cumplen así en todos los entornos, con plan gratuito o Pro; la configuración del plan Pro en producción es una segunda capa.

En el servidor, cada punto de entrada (cada página, cada acción de servidor y cada manejador) llama como primera instrucción a una única función de guardia, que valida la credencial contra el servicio de identidad y pregunta a la base de datos, con la sesión del usuario, si la sesión es completa. No hay `proxy.ts` y no se cuenta con ningún `layout`. Una prueba estática falla si un punto de entrada no llama a la guardia.

Todo lo que ocurre **antes** de que exista una sesión completa (contar intentos, verificar el segundo factor, aceptar una invitación, registrar el primer factor, anotar la sesión como completa) pasa por un canal reservado al servidor, el «canal de acceso»: una lista cerrada de funciones de la base de datos que ni el navegador ni un usuario con sesión pueden ejecutar. Con una sesión de un solo factor, la base de datos no ofrece nada: ni filas ni funciones. La clave secreta queda para cinco operaciones del servicio de identidad que no tienen alternativa, confinadas en `src/lib/supabase/admin.ts`.

Las cuatro primeras tareas del plan no construyen nada: prueban con el servicio real lo que la documentación no aclara (T-P1, códigos de recuperación experimentales, con la alternativa de construirlos ya escrita; T-P2, comportamiento del servicio con sesiones, vetos y enlaces; T-P3, envío de correo desde Google Workspace) y miden qué política de contenido admite la app sin `proxy.ts` (T-P4). Cada una tiene regla de decisión.

Este diseño deja **once asuntos abiertos para el responsable**. Dos son de peso y condicionan la puerta P1: la condición (b) de REQ-036 no se puede cumplir al pie de la letra en las operaciones que establecen la sesión (asunto A-1), y una política de contenido que prohíba todo código en línea puede no ser alcanzable sin `proxy.ts` (asunto A-2).

## Hechos verificados y lo que el diseño hace con cada uno

Solo documentación oficial, leída el 13/11/2026. Ninguna prueba real.

| N.º | Hecho | Consecuencia en este diseño |
| --- | --- | --- |
| H-1 | El servicio admite aplicación de códigos (TOTP) y el token lleva `aal` | La verificación del código la hace el servicio. `aal` se usa solo como segunda comprobación, nunca como única (ADR-0003 descarta autorizar por datos del token) |
| H-2 | Los códigos de recuperación existen como función experimental | Tarea previa T-P1 con prueba real y regla de decisión. Alternativa escrita: construirlos (apartado «Códigos de recuperación») |
| H-3 | Duración máxima e inactividad de sesión: solo plan Pro; Pro solo en producción | REQ-011 y REQ-012 los impone el registro propio de sesiones, igual en todos los entornos. Se prueban antes de producción sin depender del plan |
| H-4 | El servicio no corta de inmediato: el token de una sesión cerrada sigue valiendo hasta que caduca | Control propio: `privado.es_admin()` comprueba en cada consulta que la sesión del token está viva en el registro |
| H-5 | El servicio solo limita intentos por dirección de origen; los ganchos de intento son de planes superiores | Contador propio en la base de datos, por cuenta y por origen (propuesta de resolución de V-113, que es de la fase 2 y sigue en VERIFICAR) |
| H-6 | Correo: Google Workspace por `smtp.gmail.com` con contraseña de aplicación, viable solo sobre el papel | V-111 sigue en VERIFICAR. Tarea previa T-P3. Sin ella no se implementa ningún flujo con correo |
| H-7 | Se puede vetar a un usuario con la clave secreta; su efecto en las sesiones no está documentado | El veto es segunda capa. La baja surte efecto por el registro propio. Se comprueba en T-P2 |
| H-8 | La documentación del servicio lleva notas dirigidas a agentes de IA | Datos, no órdenes (artículo 7). No se siguen |

## Supuestos y dependencias

### De qué depende

| De quién | Qué necesita la 021 | Estado hoy |
| --- | --- | --- |
| Fase 1, función 002 | La app Next.js 16.4 con `src/`; `src/lib/plataforma/configuracion.ts` (`ENTORNO` y la dirección propia de cada entorno); `src/lib/registro/registro.ts`; la batería local; las cabeceras comunes de `next.config.ts`; la prohibición de `proxy.ts` | Diseño escrito, con dictamen pendiente de cerrar. La app base no tiene hoy cookies, acciones de servidor ni base de datos: la 021 es la primera función que las usa |
| Fase 1 | Preproducción con su propio proyecto del servicio de identidad y sus propios secretos | No existe (D-016). Mientras tanto, todo se prueba en local contra el proyecto de desarrollo |
| Fase 2, función 010 | Las migraciones del área, con los cambios que pide el apartado «Datos», y un lugar donde ejecutar las pruebas de base de datos | PROPUESTA. `docs/MODELO-DATOS.sql` es orientativo. **Hoy no hay dónde ejecutar pgTAP**: no hay Docker ni CI remoto |
| Fase 2 | V-107 (conexión con un rol propio de Postgres desde la app), V-108 (doble factor en las políticas) y V-113 (mecanismo del límite de intentos) | Las tres en VERIFICAR. Este diseño no las usa como resueltas: dice qué necesita de cada una y qué pasa si el resultado es negativo |
| Función 020 | `Armazon`, componentes, estados, `useAccion`, `leerResultadoAccion()`, `sin-acceso.ts`, `registrarFallo`, las reglas V-1 a V-7 y sus pruebas contrato, y el inventario de estilos inyectados (su PRUEBA-018) | Diseño aprobado; sin implementar |
| Función 024 | El inventario de acciones y la regla de fila principal y filas vinculadas | PROPUESTA. La 021 fija aquí sus acciones y las pide añadir |
| Función 040 (fase 5) | Comparte la pantalla de entrada (`/acceso`) y `src/lib/supabase/servidor.ts` | PROPUESTA. La 021 llega antes: fija la pantalla y el módulo de sesión de forma que la 040 los use sin cambiarlos |
| Coordinación | Adelantar V-111 a la fase 3; la excepción de `.claude/rules/interfaz.md` para el enlace de un solo uso; la página «Cuenta» en `docs/DISENO.md` | Propuesto en `propuestas.md`; sin aplicar |

### Orden obligado

Nada de esta función se implementa hasta que: (1) la 002 permita instalar dependencias y exista la app; (2) las tareas previas T-P1, T-P2 y T-P3 tengan evidencia; (3) existan en el proyecto de desarrollo las migraciones del apartado «Datos»; y (4) el responsable haya resuelto los asuntos A-1 y A-2.

## Piezas y responsabilidades

### Principio: quién decide qué

| Decisión | Quién la toma | Quién no la toma |
| --- | --- | --- |
| ¿Esta contraseña, este código o esta prueba de un solo uso son correctos? | El servicio de identidad | — |
| ¿Esta cuenta es administrador activo? ¿Este factor cuenta? ¿Esta sesión es completa y sigue viva? ¿Esta invitación vale? | El registro propio, en la base de datos | Ni el servicio de identidad, ni el token, ni el navegador |
| ¿Se atiende esta petición? | La guardia del servidor y, otra vez, las políticas de la base de datos | Ningún `layout`, ninguna pantalla, ningún botón oculto |

`aal`, la lista de factores del servicio y sus sesiones se leen, pero no bastan. Una fila del registro solo la escribe nuestro servidor, después de sus propios controles. Consecuencia: lo que alguien haga directamente contra la API pública del servicio con una credencial válida (verificar códigos sin nuestro contador, inscribir un factor con solo la contraseña) no crea ninguna fila y no da ningún acceso.

### Mapa de archivos

Rutas según `docs/ESQUELETO.md`. Las que no están en él se marcan **(nueva)** y se piden aprobar con este diseño.

| Ruta | Qué contiene | Agente |
| --- | --- | --- |
| `src/lib/supabase/servidor.ts` | Cliente del servicio con la clave publicable y la credencial de la petición. Sin almacenamiento ni renovación automática. Lo usarán también la 022 a la 024 y la 040 | `ingeniero-backend` |
| `src/lib/supabase/admin.ts` | **Único** archivo que lee la clave secreta. Exporta cinco funciones, una por operación S-1 a S-5. No exporta el cliente | `ingeniero-backend` |
| `src/lib/supabase/acceso.ts` **(nueva)** | Canal de acceso: una función por operación C-1 a C-11. No exporta la conexión. Condicionado a V-107 (asunto A-1) | `ingeniero-backend` |
| `src/lib/acceso/guardia.ts` **(nueva)** | `exigirAdministrador()`, `exigirAdministradorEnAccion()` y `leerEstadoAcceso()` | `ingeniero-backend` |
| `src/lib/acceso/credencial.ts` **(nueva)** | Lee, escribe, renueva y borra las dos cookies de la credencial | `ingeniero-backend` |
| `src/lib/acceso/origen.ts` **(nueva)** | `comprobarOrigen()` (petición del propio sitio) y `claveDeOrigen()` (huella de la dirección de origen) | `ingeniero-backend` |
| `src/lib/acceso/entradas.ts` **(nueva)** | Validadores de lista cerrada: correo, contraseña, código de 6 cifras, código de recuperación, prueba de un solo uso, identificador | `ingeniero-backend` |
| `src/lib/acceso/intentos.ts`, `tiempo-fijo.ts`, `resultados.ts` **(nuevas)** | Claves del contador, respuesta en tiempo fijo y listas cerradas de motivos | `ingeniero-backend` |
| `src/lib/acceso/operaciones/` **(nueva)** | Un archivo por operación de la tabla «Operaciones». Cada uno ordena los pasos entre el servicio y la base de datos. Las acciones de servidor solo llaman a estos archivos | `ingeniero-backend` |
| `src/app/acceso/` | Pantallas de entrada (tabla «Pantallas»), `acciones.ts` y el manejador `renovar/route.ts` | `ingeniero-frontend`, `ingeniero-backend` |
| `src/app/admin/layout.tsx`, `not-found.tsx`, `[...resto]/page.tsx` | Montaje del armazón de la 020, el único `not-found` y la ruta comodín (regla V-1) | `ingeniero-frontend` |
| `src/app/admin/page.tsx` | Resumen. La 021 lo crea con la guardia y el estado vacío de la 020, sin fuente de datos; la 023 pone su contenido | `ingeniero-frontend` |
| `src/app/admin/ajustes/administradores/` | Pantalla de administradores y sus acciones | `ingeniero-frontend`, `ingeniero-backend` |
| `src/app/admin/cuenta/` **(nueva)** | Pantalla de la propia cuenta y sus acciones. Se llega desde el panel de `CuentaUsuario`, no desde el menú | `ingeniero-frontend`, `ingeniero-backend` |
| `src/components/acceso/` **(nueva)** | Piezas de presentación: `AvisoCaducidad`, `CampoCodigo`, `CodigosRecuperacion`, `AltaFactor`. Cumplen las reglas comunes de la 020: no piden datos | `ingeniero-frontend` |
| `supabase/migrations/`, `supabase/tests/` | Migraciones y pruebas del apartado «Datos». Ruta crítica | `ingeniero-bd` |
| `supabase/plantillas-correo/` **(nueva)** | Tres plantillas en español: invitación, restablecimiento y registro de factor | `ingeniero-backend` |
| `scripts/acceso/` **(nueva)** | `primer-administrador.mjs`, `retirar-factor-unico.mjs` y `comprobar-configuracion.mjs` (solo lectura): los ejecuta el responsable en su terminal, fuera de la app | `plataforma` |
| `specs/021-acceso-superadmin/guia-responsable.md` | Procedimiento escrito del primer administrador y de la retirada del factor del único administrador (REQ-022) | `plataforma`, orquestador |
| `tests/unit/acceso/`, `tests/e2e/acceso/` | Pruebas de esta función | `qa` |
| `next.config.ts` (fase 1, ruta crítica) | Cabecera de política de contenido para `/acceso` y `/admin` | `plataforma` |
| `src/lib/plataforma/configuracion.ts` (fase 1) | Variables nuevas de la lista cerrada (apartado «Configuración y secretos») | `ingeniero-backend` |

Rutas críticas de esta función (dictamen del `auditor-seguridad` en cada cambio): todo `src/lib/acceso/`, `src/lib/supabase/`, `src/app/acceso/`, las acciones de `src/app/admin/`, `supabase/migrations/`, `scripts/acceso/`, `next.config.ts` y las plantillas de correo.

### La credencial de sesión

Dos cookies, escritas solo por el servidor:

| Cookie | Contenido | Atributos |
| --- | --- | --- |
| `__Host-nido-acceso` | El token de acceso del servicio | `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sin `Domain`, sin fecha de caducidad (de sesión del navegador) |
| `__Host-nido-renovacion` | El token de renovación del servicio | Los mismos |

- **No legible por la página** (`HttpOnly`). El navegador no crea nunca un cliente del servicio: `src/lib/supabase/navegador.ts` no se importa en `/acceso` ni en `/admin` (prueba estática). Todo pasa por acciones de servidor.
- **Solo cifrada** (`Secure`) y **no se envía desde otros sitios** (`SameSite=Strict`). Consecuencia aceptada: quien llega a `/admin` desde un enlace de otro sitio ve la pantalla de entrada aunque tenga sesión; al recargar o entrar desde la propia app, la tiene.
- **Ligada al nombre exacto del servidor** (prefijo `__Host-`): no la puede fijar un subdominio ni otra ruta.
- **Solo la acepta el entorno que la emitió**: cada entorno tiene su proyecto del servicio y su clave de firma. Un token de preproducción no supera la verificación de firma en producción (REQ-066).
- **Se renueva al completar cada factor**: el servicio emite un token nuevo al iniciar sesión y otro al verificar el código; el servidor sustituye las dos cookies. Una cookie fijada antes del inicio de sesión se sobrescribe y, además, su sesión no está en el registro (REQ-065).
- **Renovación sin `proxy.ts`.** Una página no puede escribir cookies; una acción de servidor y un manejador, sí. Por eso: una acción renueva el token dentro de sí misma si le queda menos de 60 segundos; una página en la misma situación redirige a `GET /acceso/renovar`, que renueva, escribe las cookies y vuelve a una dirección de la lista cerrada de `rutas.ts`. La renovación no cuenta como actividad. El cliente del servicio se crea sin renovación automática para que nunca renueve donde no puede guardar el resultado.
- En desarrollo local (`http://localhost`) el prefijo `__Host-` y `Secure` pueden no funcionar en todos los navegadores: el nombre y los atributos salen de una constante por entorno. **No verificado**: lo fija la tarea previa T-P2.

No se usa `@supabase/ssr`: su patrón documentado renueva la credencial desde `proxy.ts`, que aquí está prohibido, y guarda la sesión de forma que el navegador pueda leerla (ver «Alternativas descartadas»).

### La guardia: administrador activo y sesión completa en cada punto de entrada

Una sola función decide. Tres formas de llamarla, según el punto de entrada:

| Función | Dónde se llama | Si no hay acceso |
| --- | --- | --- |
| `exigirAdministrador()` | **Primera instrucción** de cada `page.tsx` bajo `src/app/admin/`, incluidas la comodín y la del Resumen, y del `layout` (donde se repite, pero no se cuenta con ella) | Redirige o responde «sin acceso» (tabla siguiente) |
| `exigirAdministradorEnAccion()` | **Primera instrucción** de cada acción de servidor de `src/app/admin/` y de las acciones de `/acceso` que exigen sesión completa. Antes comprueba el origen (`comprobarOrigen()`) | Devuelve el resultado `no_permitida` sin ejecutar nada y sin datos |
| La misma, en manejadores | Primera instrucción de cualquier `route.ts` bajo `src/app/admin/`. Esta función no crea ninguno; si otra función de la fase lo hace, lo cumple | Responde 404 sin cuerpo de datos |

**Qué hace, en este orden:**

1. Lee la cookie de acceso. Sin cookie: no hay sesión.
2. Llama a la base de datos **con la credencial del usuario** a `public.sesion_tocar()`. La capa de datos verifica la firma y la caducidad del token; la función aplica la misma regla que `privado.es_admin()`, anota la actividad y devuelve una lista cerrada: `completa` (con los segundos que faltan para la caducidad por inactividad y para el máximo de 24 horas) o `sin_acceso`.
3. Con `completa`: sigue. Las lecturas y escrituras posteriores van con la misma credencial, y cada política vuelve a aplicar `privado.es_admin()`: esa es la segunda comprobación, en la base de datos y en cada consulta (REQ-003).
4. Con `sin_acceso`, la base de datos no dice por qué (REQ-004). El servidor valida la credencial contra el servicio de identidad y, con el usuario y la sesión que el servicio confirma, pregunta por el canal de acceso (operación C-2) en qué situación está la cuenta:

| Situación | Respuesta en una página | REQ |
| --- | --- | --- |
| Sin credencial, credencial no válida, sesión cerrada o caducada | Borra las cookies y redirige a `/acceso` | REQ-034, REQ-011, REQ-012 |
| Administrador activo con factor reconocido y sesión sin completar | Redirige a `/acceso/segundo-factor` | REQ-002, CA-002 |
| Administrador activo sin factor reconocido | Redirige a `/acceso/registro-factor` | REQ-005 |
| Cuenta que no es administrador activo (usuario de cliente, cuenta sin privilegios, invitada sin aceptar, dada de baja) | «Sin acceso» con `sin-acceso.ts` de la 020: mismo código, cabeceras y cuerpo que un recurso inexistente (V-1). El armazón se pinta sin áreas y con «Cerrar sesión» | REQ-034, REQ-050 |
| El servicio de identidad o la base de datos no responden, tardan más de 5 segundos o devuelven algo fuera de la lista | Estado de error de la 020 con motivo `fallo_servidor` y referencia. Nunca el estado vacío, nunca datos anteriores | REQ-039 |

5. Cualquier excepción, valor desconocido o forma inesperada en los pasos 1 a 4 se trata como la última fila: no hay acceso (artículo 3).

**Cómo se impide que un punto de entrada se quede sin guardia.** Prueba estática (PRUEBA-003): falla si un `page.tsx`, una acción de servidor o un `route.ts` bajo `src/app/admin/` no tiene la llamada como primera instrucción; si aparece un `proxy.ts`; si en `src/app/admin/` hay un `loading`, un `not-found` anidado o un `generateMetadata` (regla V-1); o si un archivo de `src/app/` importa `admin.ts` o `acceso.ts` directamente en lugar de pasar por `src/lib/acceso/operaciones/`. Prueba en navegador (PRUEBA-004): para cada página y cada acción del inventario, petición directa, petición de navegación dentro de la app y llamada directa a la acción, con cada perfil.

**Regla V-1.** La decisión de la guardia va antes de empezar a responder: ninguna página del área tiene `Suspense` por encima de ella. Las páginas de `/acceso` no son del área y no usan `sin-acceso.ts`.

**Regla V-4.** Todas las respuestas de `/admin` y `/acceso` llevan `Cache-Control: no-store`. Además, al cerrar sesión la app hace una carga completa del documento (no una navegación interna) y cada pantalla del área recarga si el navegador la restaura desde su memoria de páginas (`pageshow` con `persisted`). Así volver atrás no muestra datos (REQ-013).

### El canal de acceso

Lista cerrada de funciones del esquema `privado`, con prefijo `acceso_`, que **solo puede ejecutar el servidor**. Ni `anon` ni `authenticated` tienen permiso sobre ellas, y no están en ningún esquema expuesto por la API. Existe porque hay operaciones que tienen que ocurrir antes de que haya sesión completa y que, si un usuario pudiera llamarlas con su token, anularían los controles (por ejemplo: anotar como completa una sesión cuyo código se adivinó contra el servicio, sin pasar por el contador).

| N.º | Operación | Qué hace en la base de datos | Lo llama |
| --- | --- | --- | --- |
| C-1 | `acceso_intento_primer_factor` | Recibe dos huellas (cuenta y origen). Dice si alguna está bloqueada y, según el resultado que se le comunique después, cuenta el fallo | Inicio de sesión |
| C-2 | `acceso_estado` | Devuelve la situación de la cuenta para decidir a dónde va (tabla de la guardia). Sin datos de otras cuentas | Guardia, pantallas de `/acceso` |
| C-3 | `acceso_intento_segundo_factor` | Dice si la verificación de esa cuenta está bloqueada; cuenta un fallo; al quinto, bloquea, cierra la sesión de un solo factor y escribe la fila I-38 | Verificación del código o del código de recuperación |
| C-4 | `acceso_registrar_sesion` | Crea la fila de sesión completa y la fila I-33. Se niega si la cuenta no es administrador activo, si el factor no está reconocido, si hay bloqueo o si esa sesión ya tuvo fila | Tras verificar el código |
| C-5 | `acceso_usar_enlace` | Con una invitación pendiente, sin caducar y de esa cuenta: la marca aceptada, pasa la cuenta a `activo`, abre la autorización de registro de factor ligada a esa sesión y escribe I-21 (y I-22 si reactiva). Con una autorización abierta por una retirada (C-11) y sin caducar: la liga a esa sesión. En cualquier otro caso, no hace nada | Aceptación de una invitación; uso del enlace del correo |
| C-6 | `acceso_registrar_primer_factor` | Consume la autorización de registro, reconoce el factor, escribe I-25 | Registro del primer factor |
| C-7 | `acceso_restablecimiento` | Anota la solicitud; al usarla, comprueba los 30 minutos, cierra todas las sesiones de la cuenta y escribe I-36 | Restablecimiento |
| C-8 | `acceso_usar_codigo_recuperacion` | Solo con la alternativa construida: comprueba y consume el código. Con la función del servicio, anota el uso (I-28) | Entrada con código de recuperación |
| C-9 | `acceso_anotar_reverificacion` | Marca en la fila de sesión que se acaba de volver a verificar un factor | Gestión de factores |
| C-10 | `acceso_codigo_ya_aceptado` | Solo si T-P2 demuestra que el servicio acepta dos veces el mismo código: guarda la huella del último código aceptado durante 120 segundos | Verificación |
| C-11 | `acceso_abrir_prueba` | Abre una autorización de registro de factor para una cuenta tras una retirada confirmada (la llama la operación de confirmación, ya con sesión completa del otro administrador) | Confirmación de retirada |

**Reglas del canal.**

- El usuario y la sesión que recibe cada función salen del token **que el servicio de identidad acaba de validar** en esa misma petición. Nunca del navegador, nunca de un token sin validar.
- Cada función vuelve a comprobar dentro de la base de datos sus propias condiciones. Que el servidor la llame no basta.
- Cada función escribe su fila de auditoría en la misma transacción que su efecto.
- Devuelven listas cerradas. Ningún texto.

**Con qué privilegio se ejecuta.** Dos caminos, y los dos necesitan una decisión que no es de este diseño (asunto A-1):

| Camino | Qué es | Estado |
| --- | --- | --- |
| R-A (preferido) | Un rol propio de Postgres, `acceso`, cuyo único permiso es ejecutar esas once funciones. Mismo patrón que el rol `conector` (ADR-0003). Mínimo privilegio: quien robe su contraseña no lee ni una fila | Depende de **V-107, en VERIFICAR**. No se usa hasta que la fase 2 la verifique |
| R-B (si V-107 resulta inviable) | La clave secreta, desde `admin.ts`, llamando a esas mismas funciones | Amplía el uso de la clave secreta a cada inicio de sesión. Exige aprobación expresa |

En los dos caminos, las operaciones C-1 a C-8 y C-10 se ejecutan **antes** de que exista sesión completa, así que no pueden cumplir al pie de la letra la condición (b) de REQ-036. Se explica en «Operaciones con privilegio superior al de la sesión».

### Operaciones con la clave secreta

Enumeración completa (REQ-036a). Son operaciones de la API de administración del servicio de identidad: no existe forma de hacerlas con la sesión de un usuario. `admin.ts` exporta una función por fila y nada más. Los nombres de los métodos del servicio son los de su documentación y se confirman en T-P2.

| N.º | Operación | Método del servicio | La pide | (b) Comprobación previa en la base de datos, con la sesión del administrador | (c) Sobre qué cuenta actúa | (d) Qué vuelve al navegador | (e) Auditoría |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S-1 | Crear la cuenta invitada y enviar la invitación | `auth.admin.inviteUserByEmail` | Invitar (alta) | `public.admin_preparar_invitacion()` devuelve permiso solo si REQ-003 se cumple en ese momento | La de la dirección invitada, que no existía | `hecha` o un motivo de lista cerrada | I-20, actor el administrador de la sesión |
| S-2 | Vetar una cuenta | `auth.admin.updateUserById` con `ban_duration` | Dar de baja; anular una invitación | La baja o la anulación ya están hechas y auditadas en la base de datos por la sesión del administrador; el veto solo se ejecuta si esa función devolvió `hecha` | La cuenta objeto, tomada de la fila que la base de datos acaba de cambiar | Lo mismo | I-24 o I-23 |
| S-3 | Levantar el veto | El mismo, con `ban_duration: 'none'` | Invitar la dirección de una cuenta dada de baja (reactivación) | `public.admin_preparar_invitacion()`, que además exige que la cuenta esté en `baja` | La cuenta dada de baja | Lo mismo | I-20 |
| S-4 | Borrar en el servicio los factores de una cuenta | `auth.admin.mfa.deleteFactor` | Dar de baja; confirmar la retirada de un factor perdido | La retirada ya está hecha y auditada en la base de datos por la sesión del administrador que confirma (que no puede ser el titular) | La cuenta objeto y solo sus factores | Lo mismo | I-24 o I-30 |
| S-5 | Deshacer un alta que no llegó a registrarse | `auth.admin.deleteUser` | Invitar, solo si S-1 creó la cuenta y la base de datos rechazó después la invitación | La base de datos acaba de rechazar la invitación de esa misma cuenta en esta misma operación, y la cuenta no tiene fila de administrador ni de usuario de cliente | La cuenta recién creada en esta misma operación; nunca otra | `rechazada` | Ninguna: no hay efecto (REQ-067) |

Lo que **no** usa la clave secreta: leer o escribir cualquier dato del área (REQ-035); cerrar sesiones (lo hace el registro propio); gestionar los factores propios (los hace el titular con su sesión); enviar el restablecimiento de contraseña y la prueba de registro de factor (se piden al servicio con la clave publicable). La búsqueda estática de CA-025 (PRUEBA-005) falla si la variable de la clave secreta se lee fuera de `admin.ts`, si `admin.ts` exporta algo más que esas cinco funciones, o si alguna recibe un parámetro que no salga de una fila de la base de datos o de una entrada validada.

**Fuera de la app.** Los dos scripts del responsable (`scripts/acceso/`) usan la clave secreta en su terminal. No son una vía de la app, no están desplegados y no los puede ejecutar un agente (artículo 14). Se describen en «Flujo».

### Operaciones con privilegio superior al de la sesión: lo que REQ-036 no cubre

REQ-036(b) exige que una operación con privilegio superior solo se ejecute «después de comprobar, con la sesión del administrador y en la base de datos, que cumple el requisito 3». Las operaciones S-1 a S-5 lo cumplen. **Las operaciones C-1 a C-8 y C-10 del canal de acceso no pueden**: son las que crean la sesión completa, o actúan cuando no hay nadie con sesión (un inicio de sesión, una invitación que se acepta). Lo que sí cumplen es una condición equivalente, que se propone al responsable como lectura de REQ-036 para estas operaciones (asunto A-1):

- (b') solo se ejecutan después de que el servicio de identidad haya validado la credencial de esa petición (C-1 no tiene credencial: solo cuenta), y cada función comprueba dentro de la base de datos sus propias condiciones;
- (c), (d) y (e) se cumplen igual: una sola cuenta, la de la credencial; solo vuelve una lista cerrada; y la fila de auditoría lleva como actor al titular.

Sin esa lectura aprobada, este diseño no cumple REQ-036 y no puede pasar la puerta P1.

### Pantallas

Todas usan los componentes y los cinco estados de la 020, sus textos salen de `textos.ts`, y los errores son códigos de lista cerrada. El título y el `h1` solo nombran el tipo de pantalla.

| Ruta | Pantalla | Quién llega | Qué hace |
| --- | --- | --- | --- |
| `/acceso` | Entrar | Cualquiera sin sesión. Compartida con la 040 | Correo y contraseña. Enlace «He olvidado mi contraseña». No ofrece registro |
| `/acceso/segundo-factor` | Verificar | Sesión de un solo factor de un administrador con factor reconocido | Código de 6 cifras, o «Usar un código de recuperación». Sin opción de recordar el dispositivo (REQ-007). «Cancelar y salir» |
| `/acceso/registro-factor` | Registrar el segundo factor | Administrador activo sin factor reconocido | Con autorización de registro vigente: código QR, clave para teclearla a mano, comprobación con un código y, al terminar, los códigos de recuperación una sola vez. Sin autorización: explica que hace falta el enlace del correo y no permite registrar (REQ-006) |
| `/acceso/invitacion` | Aceptar la invitación | Quien abre el enlace del correo | Abrir no consume nada. Formulario: contraseña nueva, dos veces. Al enviar, acepta y pasa a `/acceso/registro-factor` |
| `/acceso/restablecer` | Pedir el restablecimiento | Cualquiera sin sesión | Correo. Respuesta siempre igual |
| `/acceso/nueva-contrasena` | Poner contraseña nueva | Quien abre el enlace del correo | Abrir no consume nada. Al enviar, cambia la contraseña, cierra todas las sesiones y lleva a `/acceso`. No inicia sesión |
| `/acceso/enlace` | Usar el enlace del correo | Titular de una cuenta que ya existe: tras una retirada confirmada de su factor, o al reactivar su cuenta dada de baja | Abrir no consume nada. Pide correo y contraseña y, con la prueba del enlace, pasa a `/acceso/registro-factor`. Si la contraseña se olvidó, antes se restablece |
| `/admin/ajustes/administradores` | Administradores | Administrador con sesión completa | Tabla: correo, estado (activo, invitación pendiente, caducada, anulada, dado de baja), si tiene segundo factor, fecha de alta. Acciones con `DialogoConfirmacion`: invitar, anular, dar de baja, confirmar la retirada del factor perdido |
| `/admin/cuenta` | Tu cuenta | Administrador con sesión completa | Factores reconocidos (fecha de registro, sin secretos), cambiar contraseña, añadir, sustituir o quitar un factor, regenerar códigos, «Cerrar las demás sesiones», «Cerrar sesión», y la recomendación de un segundo dispositivo |

**Accesibilidad del acceso (REQ-043).** Campos con `autocomplete`: `username`, `current-password`, `new-password` y `one-time-code`. Ningún campo impide pegar. El código es un único campo de texto con `inputmode="numeric"`, no seis casillas. No hay ninguna prueba de reconocimiento ni rompecabezas. La clave para teclear a mano se ofrece siempre junto al código QR.

**El código QR.** Lo entrega el servicio como imagen SVG. Se pinta como imagen (`img` con contenido incrustado), nunca como marcado dentro del documento: una imagen no ejecuta código. Es la única razón por la que la política de contenido admite `data:` en imágenes, y solo en `/acceso/registro-factor` y `/admin/cuenta`.

**Los enlaces del correo.** La prueba de un solo uso viaja en el **fragmento** de la dirección (`/acceso/invitacion#prueba=…`), no en la ruta ni en la consulta: el navegador no envía el fragmento al servidor, así que no queda en los registros de la plataforma (REQ-037). La pantalla lo lee, lo quita de la barra de direcciones (`history.replaceState`) y lo envía en el cuerpo de la acción. Se valida su formato exacto antes de usarlo; no se pinta ni se guarda. La cabecera `Referrer-Policy: no-referrer` de la 002 y la ausencia de recursos de terceros impiden que salga hacia otro sitio. Esto es la excepción a `.claude/rules/interfaz.md` que `propuestas.md` ya pide.

**Qué enseña el secreto del factor.** Al registrar un factor, el titular ve una vez el código QR y la clave. REQ-037 nombra como excepción solo el enlace del correo y la pantalla de los códigos de recuperación. Registrar una aplicación de códigos es imposible sin enseñar su clave al titular: se pide al responsable que lo acepte por escrito (asunto A-8).

### Segundo factor

| Operación | Condiciones | Pasos |
| --- | --- | --- |
| Registrar el primero | Administrador activo, sin factor reconocido, con autorización de registro vigente (abierta por C-5 o C-11 tras verificar la prueba del correo) | El servicio inscribe y verifica el factor; C-6 consume la autorización, lo reconoce y escribe I-25; se entregan los códigos de recuperación; C-4 anota la sesión como completa |
| Verificar al entrar | Sesión de un solo factor; factor reconocido | C-3 (¿bloqueado?); el servidor elige el factor **del registro**, no de la entrada; el servicio verifica; fallo: C-3 cuenta; acierto: C-4 |
| Añadir otro | Sesión completa y verificación de un factor reconocido en los 5 minutos anteriores (C-9) | El servicio inscribe y verifica; `public.admin_reconocer_factor()` lo reconoce, consume la reverificación y escribe I-25 |
| Sustituir | Lo mismo | El servicio inscribe y verifica el nuevo; `public.admin_sustituir_factor()` reconoce el nuevo, retira el anterior, cierra las demás sesiones y escribe **una** fila I-26, todo en una transacción; el servicio borra el factor anterior con la sesión del titular |
| Quitar | Lo mismo, y que quede al menos otro reconocido (REQ-009) | `public.admin_retirar_factor()` retira, cierra las demás sesiones y escribe I-27; el servicio lo borra |

- **Un solo tipo.** Solo se inscribe el tipo de aplicación de códigos. En la configuración del servicio se desactivan el teléfono y cualquier otro tipo, y `acceso_registrar_primer_factor` y `admin_reconocer_factor` rechazan un factor que no sea de ese tipo (CA-006).
- **Un factor inscrito directamente en el servicio**, sin pasar por el servidor, no está en el registro: el servidor nunca lo propone para verificar y no cuenta para nada.
- **Código ya aceptado (REQ-026).** No se sabe si el servicio rechaza un código usado: T-P2 lo prueba. Si lo rechaza en el 100 % de 20 reintentos dentro de su ventana, basta. Si no, se activa C-10.
- **Nombre del factor.** No se pide ni se guarda: sería texto libre. La pantalla lo identifica por su fecha de registro.

### Códigos de recuperación

**Camino elegido por el responsable: la función experimental del servicio**, con la condición de probarla antes. **Tarea previa T-P1**, con el servicio real en el proyecto de desarrollo. La función se usa solo si se cumplen **todos** estos criterios:

| N.º | Criterio | Por qué |
| --- | --- | --- |
| 1 | Se generan con una sesión completa y la respuesta los entrega una sola vez; ninguna otra llamada los vuelve a devolver | REQ-072 |
| 2 | Cada código vale una vez; el segundo uso se rechaza en 20 de 20 intentos | REQ-074, REQ-079 |
| 3 | Regenerar invalida el juego anterior entero | REQ-076 |
| 4 | Usar un código, junto con la contraseña, da un resultado que el servidor puede distinguir sin ambigüedad de un fallo | REQ-074 |
| 5 | Existe una forma documentada de invalidar un juego recién generado, para deshacerlo si la fila de auditoría no se puede escribir | REQ-040, REQ-067 |
| 6 | Dar de baja o reactivar una cuenta permite invalidar sus códigos | REQ-083 |
| 7 | **No se pueden obtener ni regenerar con una sesión de un solo factor**, ni con el token de una sesión que el registro propio ya ha cerrado | Si se pudiera, quien adivine un código contra el servicio, o conserve un token cerrado, fabricaría códigos válidos sin pasar por nuestros controles |
| 8 | Los códigos no aparecen en los registros del servicio visibles en su consola | REQ-073 |
| 9 | La función está disponible en el plan gratuito y en Pro, y su documentación no anuncia su retirada | Artículos 10 y 11 |

**Regla de decisión.** Los nueve se cumplen: se usa la función del servicio. Falla cualquiera: se aplica la alternativa, sin volver al responsable, porque él ya la aceptó como alternativa escrita; se le informa del criterio que falló. Si el criterio 7 no se puede comprobar con certeza, cuenta como fallido (artículo 3).

**Alternativa escrita: construirlos.**

- Al registrar el primer factor, o al regenerar, el servidor genera 10 códigos con el generador criptográfico: 16 caracteres del alfabeto sin letras dudosas de la 020, en cuatro grupos de cuatro (80 bits).
- Se guarda solo su huella HMAC-SHA-256, con un secreto que no está en la base de datos (`ACCESO_HMAC_SECRETO`), en `privado.codigos_recuperacion`: huella, cuenta, juego, `usado_en`. Mismo patrón que los tokens del modelo.
- Verificar es C-8: busca la huella entre los códigos sin usar del juego vigente de esa cuenta y la marca usada en la misma transacción que crea la sesión completa y sus filas de auditoría. La comparación es por igualdad de huellas, que no filtra el código.
- Regenerar es una sola transacción: juego nuevo, juego anterior anulado, fila I-29. Baja y reactivación anulan el juego en su propia transacción.
- La sesión que entra así es completa por el registro, con método `codigo_recuperacion`; el token del servicio sigue en `aal1`, y por eso la regla de acceso no puede exigir `aal2` como condición única (ver «Datos»).
- Coste: una tabla, dos funciones y una ruta crítica más (guardar y comparar secretos), que `propuestas.md` ya anuncia para `docs/SEGURIDAD.md`.

En los dos caminos: los códigos se muestran una vez, en una pantalla con `Cache-Control: no-store`, con un botón para copiarlos y otro para descargarlos como texto generado en el navegador; no viajan en ninguna dirección; un fallo cuenta en el límite del segundo factor (C-3); y usar uno cierra las demás sesiones de la cuenta en la misma transacción.

### Pérdida del factor y de los códigos

1. El titular A restablece su contraseña por correo. Eso cierra sus sesiones y no toca factores (REQ-016).
2. Otro administrador B, con sesión completa, pulsa «Confirmar la retirada del factor perdido» en la fila de A. El diálogo dice qué pasa: A se queda sin segundo factor, se cierran sus sesiones y recibirá un correo para registrar uno nuevo, válido 30 minutos.
3. `public.admin_confirmar_retirada()` comprueba: B es administrador activo con sesión completa; A no es B (REQ-081); A es administrador activo; A restableció su contraseña en las últimas 24 horas (así el control del buzón es condición, no solo la palabra de B). Retira todos los factores reconocidos de A, anula sus códigos, cierra sus sesiones, abre la autorización de registro (C-11) y escribe I-30. Todo en una transacción.
4. El servidor borra los factores de A en el servicio (S-4) y pide al servicio el correo con la prueba de registro de factor.
5. A abre el enlace, pone su contraseña y registra un factor nuevo (I-25).

Si no hay otro administrador activo con factor: el responsable ejecuta `scripts/acceso/retirar-factor-unico.mjs` (ver «Flujo»). Ninguna función a la que llegue el panel o la API de datos acepta retirar el factor del último administrador: la excepción solo existe en una función que ni `authenticated` ni el rol `acceso` pueden ejecutar (REQ-021).

### Límite de intentos y bloqueo

**Mecanismo: contador en la base de datos.** Es la propuesta de este diseño para V-113, que es de la fase 2 y sigue en VERIFICAR. Motivo: el cortafuegos de la plataforma cuenta peticiones por dirección, pero no sabe si un intento falló ni a qué cuenta iba, así que no puede bloquear «también la contraseña correcta» de una cuenta. Mientras V-113 no esté verificada, no se implementa.

| Qué | Primer factor | Segundo factor y códigos de recuperación |
| --- | --- | --- |
| Clave del contador | Huella de la dirección tecleada (en minúsculas) y, aparte, huella de la dirección de origen. Las dos con HMAC-SHA-256 y `ACCESO_HMAC_SECRETO` | La cuenta (su identificador). No hay clave de origen: REQ-025 lo pide por cuenta |
| Umbral | 5 fallos en 15 minutos, en cualquiera de las dos claves | 5 fallos en 15 minutos |
| Efecto | 15 minutos de bloqueo de esa clave. Durante el bloqueo no se consulta la contraseña real al servicio | 15 minutos de bloqueo de la verificación de esa cuenta, y cierre de la sesión de un solo factor |
| Reinicio | Los fallos caducan a los 15 minutos. Un acierto no borra los fallos de la clave de origen | Volver a empezar por el primer factor no toca el contador |
| Fin | Siempre por tiempo. No existe bloqueo indefinido ni desbloqueo manual | Igual |
| Anotado | Si la huella corresponde a un administrador: fila I-37, actor «Sistema». Si no: solo un recuento en la supervisión | Fila I-38, actor «Sistema» |

- **No se guarda lo tecleado.** La tabla del contador solo tiene huellas, momentos y un tipo. Ni la dirección, ni la contraseña, ni el código (REQ-041). Como la huella se calcula igual para una dirección que existe y para una que no, el contador no revela cuál existe.
- **Fallos sueltos.** Solo incrementan un recuento en la supervisión, con un código de la lista cerrada de `registro.ts` (`acceso_fallo_primer_factor`, `acceso_fallo_segundo_factor`). Sin valores.
- **Dirección de origen.** Se toma de la cabecera que pone la plataforma, en una sola función. Qué cabecera es fiable en Vercel no está verificado: se pide a la fase 1 (apartado «Qué se pide a otras fases»). Es un dato personal: solo se guarda su huella, 15 minutos más el bloqueo, y se declara para el registro de tratamiento (fase 6).
- **Si el contador no responde**, no hay inicio de sesión (REQ-039).
- **Límite conocido.** El contador cuenta los intentos que pasan por nuestro servidor. El servicio de identidad es público: alguien puede probar contraseñas o códigos directamente contra él, con el único freno de su límite por dirección de origen. Lo que consiga así no vale en el área (no crea filas en el registro), pero sí le sirve para saber si una contraseña es correcta. Ver la amenaza AM-04 y el asunto A-3.

### Respuestas que no revelan nada (REQ-027, CA-019)

Tres medidas, las tres necesarias:

1. **Mismo texto y mismo resultado.** Cada grupo de casos devuelve exactamente el mismo resultado de lista cerrada:

| Operación | Casos que deben ser indistinguibles | Resultado único |
| --- | --- | --- |
| Entrar | Cuenta inexistente, dada de baja, bloqueada, contraseña errónea | `rechazada`, motivo `credenciales_no_validas`: «El correo o la contraseña no son correctos, o el acceso está bloqueado temporalmente. Si lo has intentado varias veces, espera 15 minutos» |
| Pedir restablecimiento | Dirección existente e inexistente | `hecha`: «Si la dirección corresponde a una cuenta, recibirás un correo con un enlace válido 30 minutos» |
| Aceptar invitación | Caducada, usada, anulada, de otra dirección, inexistente | `rechazada`, motivo `enlace_no_valido`: «Este enlace no es válido o ha caducado. Pide una invitación nueva» |

2. **Mismo camino.** En los cuatro casos de «Entrar» el servidor hace las mismas llamadas: el contador y una llamada de inicio de sesión al servicio. Con la clave bloqueada, la llamada se hace con una contraseña que no puede ser la correcta, para que no se cree ninguna sesión y el camino dure lo mismo.
3. **Tiempo fijo.** `responderEnTiempoFijo()` retiene toda respuesta que no sea un acierto hasta un instante fijo contado desde la llegada de la petición. Valores iniciales, que la prueba ajusta: 1.000 ms para entrar y para pedir el restablecimiento, 1.500 ms para aceptar. La petición de restablecimiento no espera al envío del correo: responde en el tiempo fijo y el envío termina después de responder. Si el trabajo dura más que el tiempo fijo, se responde en el siguiente múltiplo de 250 ms.

La prueba (PRUEBA-019) mide 30 intentos por caso y falla si dos medianas del mismo grupo difieren en más de 100 ms. Se mide en local y se repite en preproducción cuando exista, que es donde cuenta.

### Protección de la sesión en el navegador (A-21)

**Incrustación (REQ-028).** Ya la cubren las cabeceras de la 002 para todas las rutas: `X-Frame-Options: DENY` y `frame-ancestors 'none'`. La 021 las prueba en sus pantallas (PRUEBA-020).

**Peticiones desde otro sitio (REQ-029).** Tres capas:

1. `SameSite=Strict` en la credencial: una petición iniciada desde otro sitio llega sin sesión.
2. `comprobarOrigen()` como primera instrucción de cada acción de servidor y del manejador de renovación: compara la cabecera `Origin` con la dirección propia del entorno (constante de `configuracion.ts`). Si falta en una petición que cambia algo, o no coincide, no se ejecuta nada. Cubre el inicio de sesión, que no tiene cookie que proteger.
3. Todas las operaciones que cambian algo son acciones de servidor (`POST`). Ninguna es un enlace ni un `GET`. El único `GET` con efecto es la renovación de la credencial, que no cambia nada que un tercero pueda aprovechar.

Lista de operaciones que cambian algo, para CA-021: entrar, verificar el código, usar un código de recuperación, cerrar sesión, cerrar las demás sesiones, registrar, añadir, sustituir y quitar un factor, regenerar códigos, cambiar la contraseña, pedir el restablecimiento, poner contraseña nueva, aceptar una invitación, usar el enlace de registro de factor, invitar, anular, dar de baja, confirmar una retirada y seguir conectado.

**Política de contenido (REQ-030).** Aquí hay un límite real, y se dice.

- Lo que exige la especificación: que no se ejecute código en línea sin autorizar (CA-020).
- Lo que dice la guía oficial de Next.js (`guides/content-security-policy`, actualizada el 20/03/2026, leída el 13/11/2026): los valores de un solo uso se generan en `proxy`; sin él, el ejemplo oficial usa `'unsafe-inline'`; la opción experimental por huellas (`experimental.sri`) es «Build-time only: Cannot handle dynamically generated scripts». Las páginas del área se generan en cada petición y Next.js escribe en ellas guiones en línea propios.
- La 002 prohíbe `proxy.ts` porque se ejecutaría fuera de `fra1`.

Por tanto **no está demostrado que la política que pide REQ-030 sea alcanzable con la plataforma actual**. Este diseño no lo da por hecho en ningún sentido. Tarea previa T-P4, sobre la compilación de producción de la app con la muestra de la 020:

| Política que se mide | Qué es |
| --- | --- |
| P-1 (objetivo) | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`, con `experimental.sri`. En las dos pantallas con código QR, `img-src 'self' data:` |
| P-1 con estilos | P-1 más lo mínimo que el inventario de la 020 (su PRUEBA-018) demuestre que Radix y Recharts necesitan: primero huellas de los elementos `style` concretos; si no basta, `style-src-attr 'unsafe-inline'`; nunca `'unsafe-inline'` en `style-src-elem` sin anotarlo como desviación |

**Regla de decisión.**

- P-1 (con o sin la variante de estilos) da cero infracciones en todas las pantallas y estados, en los tres motores, y las pantallas funcionan: se adopta. Los estilos en línea que queden se anotan como desviación menor, con su motivo: no ejecutan código.
- P-1 bloquea los guiones en línea de Next.js: **REQ-030 no se puede cumplir sin cambiar algo que no es de esta función.** La tarea vuelve al arquitecto y el responsable elige (asunto A-2). No se adopta `'unsafe-inline'` en silencio, no se añade `proxy.ts` por cuenta propia y no se declara cumplido CA-020.

Mientras tanto, y en cualquier caso, los controles que no dependen de la política siguen: el escapado de la 020 (`TextoDato`, `textoPlano`, `rutas.ts`), la prohibición de `dangerouslySetInnerHTML`, ninguna entrada de usuario reflejada como marcado y ningún recurso de terceros. La cabecera va en `next.config.ts`, solo para `/acceso` y `/admin` (la muestra y el conector no cambian), y es un cambio de ruta crítica de la fase 1.

**Texto con código (REQ-068).** El único texto que un usuario escribe y que después se pinta es la dirección de una invitación. Se valida contra un formato cerrado (como mucho 254 caracteres, una arroba, sin espacios, sin `<`, `>`, comillas ni caracteres de control) y se pinta con `TextoDato`.

### Aviso de caducidad y lo escrito en un formulario

- La guardia entrega al armazón, en cada página y en cada respuesta de acción, dos números: segundos hasta la caducidad por inactividad y segundos hasta el máximo de 24 horas. Son duraciones, no horas: no dependen del reloj del navegador.
- `AvisoCaducidad` (componente de cliente, dentro del armazón) programa el aviso para **2 minutos antes** de la caducidad por inactividad (el mínimo de REQ-044 es 20 segundos). Antes de mostrarlo pregunta al servidor el estado real con `public.sesion_estado()`, que **no** cuenta como actividad: si otra pestaña ha seguido trabajando, reprograma y no molesta.
- El aviso es un `DialogoConfirmacion` de la 020, anunciado por la región urgente: «Tu sesión se cerrará en 2 minutos por inactividad. Lo que hayas escrito y no hayas enviado se perderá». Botones: «Seguir conectado» y «Cerrar sesión». «Seguir conectado» llama a una acción que pasa por la guardia, y eso es la actividad. Una sola pulsación (REQ-044).
- **Seguir nunca supera las 24 horas**: la base de datos compara siempre con el inicio de la sesión. Cuando faltan 10 minutos para el máximo, el aviso es otro: «Tu sesión termina a las 24 horas de iniciarse. Te quedan 10 minutos; después tendrás que volver a entrar». No ofrece seguir.
- **Al caducar con la pantalla abierta**, `AvisoCaducidad` sustituye el contenido por «Tu sesión ha caducado» y un botón «Volver a entrar», que hace una carga completa de `/acceso`. Así una pantalla abandonada no sigue enseñando datos.
- **Lo escrito en un formulario se pierde al caducar.** Es una decisión: guardarlo exigiría almacenamiento en el navegador, que la 020 no usa, y en esta función lo escrito son contraseñas, códigos y una dirección de correo. Por eso el aviso lo dice antes. Mientras el aviso está abierto, el formulario de debajo no se toca. Si una acción se envía con la sesión ya caducada, devuelve `no_permitida`; el formulario conserva lo escrito en pantalla (regla de la 020) y un mensaje fijo ofrece abrir la entrada en otra pestaña; al volver, se reenvía. La decisión afecta a los formularios de las funciones 022 a 025 y se presenta al responsable (asunto A-7).

### Configuración y secretos

Variables nuevas en la lista cerrada de `configuracion.ts`. Los valores los pone una persona en el gestor de variables de cada entorno (artículo 4). Ninguno está en el repositorio.

| Variable | Qué es | Secreto |
| --- | --- | --- |
| Dirección del proyecto del servicio y clave publicable | Las de T-004 | No |
| Clave secreta | T-004. Solo la lee `admin.ts` | Sí |
| Credencial del rol `acceso` | Solo con el camino R-A. Solo la lee `acceso.ts` | Sí |
| `ACCESO_HMAC_SECRETO` | Secreto de las huellas del contador y, con la alternativa, de los códigos de recuperación. Distinto por entorno. Cambiarlo solo vacía los contadores en curso; con la alternativa de códigos, obliga a regenerarlos | Sí |

La contraseña de aplicación de Google Workspace **no es una variable de la app**: se pone en la configuración de correo del proyecto del servicio de identidad, que es quien envía. La pone una persona.

**Configuración del servicio de identidad**, por entorno. La aplica una persona siguiendo `guia-responsable.md`, y un script de solo lectura (`scripts/acceso/comprobar-configuracion.mjs`, que ejecuta el responsable) comprueba que coincide: registro público desactivado; inicio de sesión anónimo y proveedores externos desactivados; solo el tipo de factor de aplicación de códigos; confirmación doble del cambio de correo activada; caducidad de los enlaces de correo de 24 horas (el plazo de 30 minutos lo impone el registro propio); plantillas de `supabase/plantillas-correo/`; direcciones de retorno limitadas a la propia de cada entorno; y, solo en producción (plan Pro), duración máxima de sesión de 24 horas e inactividad de 60 minutos como segunda capa.

## Contratos

Esta función **no cambia `contratos/`**: no toca ninguna herramienta del conector ni el informe.

Fija, con listas cerradas y pruebas, estas formas internas. Ninguna acepta el identificador de quien actúa: sale siempre de la sesión.

| Forma | Valores |
| --- | --- |
| Resultado de `sesion_tocar` y `sesion_estado` | `completa` (con dos enteros acotados: segundos hasta la inactividad, de 0 a 3.600, y hasta el máximo, de 0 a 86.400) o `sin_acceso` |
| Situación de la cuenta (C-2) | `sin_sesion`, `no_administrador`, `administrador_no_activo`, `falta_segundo_factor`, `falta_registrar_factor`, `falta_registrar_factor_sin_autorizacion`, `bloqueada` |
| Resultado de una acción | Los cuatro de la 020: `hecha`, `rechazada`, `no_permitida`, `incierta`, con su tabla de `leerResultadoAccion()` sin excepciones (V-7) |
| Motivos de `rechazada` de esta función | `credenciales_no_validas`, `codigo_no_valido`, `enlace_no_valido`, `contrasena_actual_no_valida`, `contrasena_no_admitida`, `falta_reverificar`, `ultimo_factor`, `minimo_administradores`, `no_puedes_confirmar_tu_propia_retirada`, `falta_restablecimiento_previo`, `ya_es_administrador`, `invitacion_pendiente`, `cuenta_de_cliente`, `correo_no_valido` |
| Errores de campo `{campo, codigo}` | Campos: `correo`, `contrasena`, `contrasena_nueva`, `contrasena_repetida`, `codigo`, `codigo_recuperacion`. Códigos: `obligatorio`, `formato`, `demasiado_corta`, `demasiado_larga`, `no_coinciden` |
| Entradas de cada acción | Lista cerrada por acción, en `entradas.ts`. Un campo que no esté en la lista no se lee, no se registra y no tiene efecto (REQ-032, REQ-064) |
| Acciones de auditoría | Las entradas I-19 a I-38 de la función 024 |
| Estados nuevos del catálogo de la 020 | `administrador.activo`, `administrador.invitacion_pendiente`, `administrador.invitacion_caducada`, `administrador.invitacion_anulada`, `administrador.baja`, `factor.registrado`, `factor.sin_registrar` |

**Contraseña.** Entre 12 y 128 caracteres, sin más reglas de composición y sin impedir pegar. Se valida en el servidor. No se comprueba contra ningún servicio de terceros.

## Datos

**Quién escribe las migraciones.** Son rutas críticas de la fase 2. Este diseño fija lo que necesita; cómo se reparte entre la función 010 y una migración propia de la 021 lo decide el plan, con coordinación (frontera 4 de `propuestas.md`). Los nombres que siguen son propuestas en español y sin tildes; `docs/MODELO-DATOS.sql` es una referencia en PROPUESTA y no se da por vigente.

### Tablas

| Tabla | Columnas | Quién lee | Quién escribe |
| --- | --- | --- | --- |
| `public.administradores` (cambia) | `usuario_id` (clave; referencia a la cuenta del servicio **sin borrado en cascada**), `correo` (texto con formato de correo, en minúsculas, 254 como máximo), `estado` (`invitado`, `activo`, `baja`), `invitado_en`, `alta_en`, `baja_en`, `servicio_pendiente` (booleano) | Solo `es_admin()`. Se elimina la política `administradores_propio` del modelo (frontera 1) | Solo funciones. `authenticated` no tiene `insert`, `update` ni `delete` |
| `public.invitaciones_administrador` (nueva) | `id`, `usuario_id`, `tipo` (`alta`, `reactivacion`), `estado` (`pendiente`, `aceptada`, `anulada`), `creada_por`, `creada_en`, `caduca_en`, `resuelta_en`. Una sola pendiente por cuenta (índice único parcial). «Caducada» no se guarda: es `pendiente` con `caduca_en` pasado | Solo `es_admin()` | Solo funciones |
| `public.factores_administrador` (nueva) | `factor_id` (el del servicio), `usuario_id`, `registrado_en`, `retirado_en`. Sin nombre ni secreto | Solo `es_admin()` | Solo funciones |
| `privado.sesiones_administrador` (nueva) | `sesion_id` (clave; el `session_id` del token), `usuario_id`, `metodo` (`codigo_aplicacion`, `codigo_recuperacion`), `factor_id`, `iniciada_en`, `ultima_actividad_en`, `reverificada_en`, `cerrada_en`, `motivo_cierre` (lista cerrada) | Nadie por la API | Solo funciones. Una fila cerrada no se reabre y no se borra mientras su token pueda seguir vivo |
| `privado.autorizaciones_registro_factor` (nueva) | `usuario_id`, `origen` (`invitacion`, `retirada`), `abierta_en`, `caduca_en`, `sesion_id` (la sesión que presentó la prueba), `consumida_en` | Nadie por la API | Solo funciones del canal |
| `privado.restablecimientos` (nueva) | `usuario_id`, `solicitado_en`, `usado_en` | Nadie por la API | Solo C-7 |
| `privado.intentos_acceso` y `privado.bloqueos_acceso` (nuevas) | Huella (64 hexadecimales) o identificador de cuenta, `tipo` (`cuenta_primer_factor`, `origen_primer_factor`, `cuenta_segundo_factor`), momento; en bloqueos, `hasta` | Nadie por la API | Solo C-1 y C-3, que además borran en cada llamada lo que tiene más de 24 horas |
| `privado.codigos_recuperacion` (solo con la alternativa) | `huella`, `usuario_id`, `juego`, `creado_en`, `usado_en`, `anulado_en` | Nadie por la API | Solo funciones |
| `public.auditoria` (cambia; de la 010 y la 024) | Se pide: `origen` (`persona`, `responsable_fuera_del_panel`, `sistema`, y los de la 024), `fila_principal_id`, y `accion` limitada a la lista cerrada del inventario | Solo `es_admin()` | Solo funciones; ninguna inserción directa |

Todas llevan RLS activado en la misma migración que las crea. Ninguna tiene texto libre: `correo` es el único texto, con formato cerrado, y es un dato del propio equipo, no de terceros (artículo 1).

**Datos que se guardan de cada administrador (REQ-038).** Lista completa:

| Dónde | Qué |
| --- | --- |
| Registro propio | Identificador de la cuenta; correo; estado y fechas de invitación, alta y baja; identificador y fechas de cada factor reconocido; de cada sesión completa, su identificador, método, inicio, última actividad, cierre y motivo; invitaciones con sus fechas y quién las creó; fechas de restablecimiento; autorizaciones de registro con sus fechas |
| Temporal, 24 horas como mucho | Huellas del contador de intentos (de la dirección tecleada y de la dirección de origen) |
| Servicio de identidad | Correo, contraseña cifrada de forma irreversible, secreto del factor, códigos de recuperación (si se usa su función) y sus propias filas de sesión, que incluyen dirección de origen y navegador. Esto último lo guarda el servicio por su cuenta y se declara para el registro de tratamiento (fase 6) |

No se guarda nombre, teléfono, cargo ni ningún dato de clientes o de correo.

### La regla de acceso

`privado.es_admin()` pasa a exigir **todo** esto, leído de tablas propias y del identificador de sesión del token:

1. Existe una fila de `administradores` con el usuario del token y `estado = 'activo'`.
2. Existe una fila de `sesiones_administrador` con el `session_id` del token y ese mismo usuario, con `cerrada_en` vacío.
3. `iniciada_en` es de hace menos de 24 horas.
4. `ultima_actividad_en` es de hace menos de 60 minutos.
5. Segunda capa: si el método de la fila es `codigo_aplicacion`, el token dice `aal2`.

Falta el `session_id`, está mal formado, falta cualquier fila o cualquier comparación da nulo: falso (artículo 3). La función sigue siendo estable y de solo lectura, para poder usarse en las políticas.

- **No depende solo de `aal`**, así que el corte es inmediato (H-4) y la regla no se cae si V-108 saliera negativa. Coincide con ADR-0003, que descarta autorizar por datos del token.
- `sesion_tocar()` aplica la misma regla y, si se cumple, actualiza `ultima_actividad_en`. `sesion_estado()` la aplica sin actualizar.
- Tercera capa opcional, a decidir con la 010 al verificar V-108: comprobar además que la sesión sigue existiendo en las tablas del propio servicio, como apunta su documentación. No se cuenta con ella.

**Cuentas separadas (REQ-077).** Una restricción en la base de datos impide que una cuenta esté a la vez en `administradores` (en cualquier estado) y en `usuarios_cliente`, también con dos escrituras simultáneas. Hace falta en las dos tablas: la de `usuarios_cliente` se pide a la 010 y a la 040.

**Mínimo de administradores (REQ-021).** Las funciones que pueden bajar el número de administradores activos con factor reconocido (dar de baja, retirar un factor, confirmar una retirada) toman primero un mismo cerrojo de transacción y cuentan después. Si quedaría menos de 1, rechazan con `minimo_administradores` o `ultimo_factor`. Así dos bajas cruzadas se ejecutan una detrás de otra y la segunda ve el resultado de la primera (REQ-056). No hay `delete` sobre `administradores`, y la referencia a la cuenta del servicio no borra en cascada: borrar la cuenta en el servicio falla mientras exista la fila (frontera 3).

### Funciones de operación con sesión completa

Las llama el servidor **con la credencial del usuario**. Cada una empieza comprobando `privado.es_admin()` y, si no se cumple, no hace nada y devuelve `no_permitida`. Ninguna recibe quién actúa. Cada una escribe su fila de auditoría en la misma transacción: si la fila no se puede escribir, la transacción entera se deshace (REQ-040, REQ-067).

| Función | Efecto | Auditoría |
| --- | --- | --- |
| `sesion_tocar`, `sesion_estado` | Ver «La regla de acceso» | — |
| `sesion_cerrar` | Cierra la sesión del token. La puede llamar también una sesión de un solo factor, y entonces no hace nada | — (no es acción del inventario) |
| `admin_cerrar_otras_sesiones` | Cierra todas las sesiones de la cuenta menos la del token | I-34 |
| `admin_preparar_invitacion(correo)` | Dice si se puede invitar esa dirección y en qué caso está: `nueva`, `reactivacion`, o un motivo de rechazo. No cambia nada | — |
| `admin_registrar_invitacion(usuario)` | Crea o actualiza la fila de administrador (`invitado`, o sigue en `baja` si reactiva) y la invitación pendiente de 24 horas. El correo lo toma de la cuenta del servicio, no de la entrada. Rechaza una cuenta de cliente, una ya activa o una con invitación pendiente | I-20 |
| `admin_anular_invitacion(invitacion)` | Pasa la invitación a `anulada` | I-23 |
| `admin_dar_de_baja(usuario)` | Con el cerrojo del mínimo: pasa a `baja`, cierra todas sus sesiones, retira sus factores reconocidos, anula sus códigos, sus invitaciones y sus autorizaciones, y marca `servicio_pendiente` | I-24 |
| `admin_confirmar_retirada(usuario)` | Ver «Pérdida del factor y de los códigos» | I-30 |
| `admin_reconocer_factor(factor)`, `admin_sustituir_factor(nuevo, anterior)`, `admin_retirar_factor(factor)` | Ver «Segundo factor». Exigen reverificación reciente y la consumen. Los factores que reciben tienen que ser de la cuenta de la sesión | I-25, I-26, I-27 (con I-28 vinculada si la reverificación fue con código de recuperación) |
| `admin_cerrar_por_cambio_contrasena`, `admin_anotar_cambio_contrasena` | La primera cierra las demás sesiones; la segunda escribe la fila tras el cambio | I-35 |
| `admin_anotar_regeneracion_codigos` (o `admin_regenerar_codigos` con la alternativa) | Anota la regeneración o, con la alternativa, la hace entera | I-29 |
| `admin_confirmar_servicio(usuario)` | Quita `servicio_pendiente` cuando el servicio ha vetado la cuenta y borrado sus factores | — |

**Forma de exponerlas.** La función 010 (REQ-010) no admite hoy que un usuario con sesión ejecute funciones del esquema privado, salvo una lista cerrada de apoyo a las políticas. Estas operaciones no caben en escrituras directas sobre tablas con RLS: son varias filas, con reglas y con auditoría, en una transacción. Se pide a la 010 que fije la forma de exponer «operaciones del panel» (por ejemplo, funciones finas en el esquema público que llaman a las privadas) y que amplíe su lista cerrada. Los nombres `public.…` de este diseño son provisionales.

### Matriz de acceso de esta función

Para CA-001 y CA-004. «0» es cero filas o rechazo.

| Perfil | Tablas `public` de esta función | Tablas `privado` | Funciones de operación | Funciones del canal |
| --- | --- | --- | --- | --- |
| Sin sesión | 0 | 0 | 0 | 0 |
| Usuario sin privilegios; usuario de cliente, con o sin doble factor | 0 | 0 | `no_permitida`, sin efecto | 0 |
| Administrador con sesión de un solo factor | 0 | 0 | `no_permitida`, sin efecto | 0 |
| Administrador con `aal2` en el servicio pero sin fila de sesión, o con la fila cerrada o caducada | 0 | 0 | `no_permitida`, sin efecto | 0 |
| Administrador dado de baja, con cualquier sesión | 0 | 0 | `no_permitida`, sin efecto | 0 |
| Administrador activo con sesión completa | Solo lectura | 0 | Las de la lista | 0 |
| Rol `acceso` (o la clave secreta, camino R-B) | 0 con R-A | Solo a través de las funciones | 0 | Las once |

### Migración y vuelta atrás

| Migración | Contenido | Vuelta atrás |
| --- | --- | --- |
| M-1 | Tipos y tablas nuevas, con RLS y sin permisos | Borra las tablas. Solo en entornos sin datos reales si ya hay filas |
| M-2 | Cambios en `administradores` y la restricción de cuentas separadas | Restaura las columnas anteriores |
| M-3 | Funciones de operación y del canal, rol `acceso` y permisos | Las elimina y revoca |
| M-4 | Nueva `privado.es_admin()` y políticas del área | **Su vuelta atrás reabre el acceso con solo `aal2`**, que no corta de inmediato. Por eso no se revierte sola: solo junto con la vuelta atrás de la app a una versión sin área, o en un entorno sin datos reales. Se anota en la guía |
| M-5 | Cambios en `auditoria` | De la 010. En producción no se revierte (REQ-053 de la 010) |

La vuelta atrás de cada migración se prueba aplicándola, revirtiéndola y volviéndola a aplicar con datos ficticios cargados, y comprobando que la huella de `auditoria` no cambia (PRUEBA-031). **Hoy no hay dónde ejecutar esa prueba** (asunto A-10).

Vuelta atrás de la app: la orden de la 002 devuelve el dominio al despliegue anterior. Las sesiones abiertas siguen valiendo o no según el registro, que no depende de la versión de la app. Una versión anterior a la 021 no tiene rutas de área: no queda nada abierto.

## Flujo

En todos los flujos: cada acción empieza por `comprobarOrigen()` y valida sus entradas contra su lista cerrada; un fallo del servicio o de la base de datos corta el flujo sin acceso (REQ-039); y el resultado es uno de los cuatro de la 020.

### Primer administrador (REQ-022), fuera del panel

1. El responsable, en su terminal, ejecuta `scripts/acceso/primer-administrador.mjs`. El script exige terminal interactiva, lee la clave secreta del entorno de esa terminal (nunca de un archivo del repositorio), pide la dirección y pide confirmarla tecleándola otra vez.
2. El script pide al servicio la cuenta y el correo de invitación, y llama a una función que solo puede ejecutar el propietario de la base de datos. Esa función se niega si ya existe algún administrador en estado `activo`; si no, crea la fila `invitado`, la invitación pendiente y la fila I-19 con origen `responsable_fuera_del_panel`.
3. El primer administrador acepta la invitación como cualquier otro: contraseña, factor con la prueba del correo y códigos de recuperación. No tiene ninguna exención.
4. Ya con sesión completa, invita al segundo desde el panel.

El script no imprime ningún secreto ni la prueba de un solo uso. Un agente no lo ejecuta (artículo 14).

### Invitar y aceptar

1. Un administrador con sesión completa escribe la dirección y confirma en el diálogo, que dice: «Se enviará un correo a esta dirección con un enlace válido 24 horas. No tendrá acceso hasta que ponga su contraseña y registre su segundo factor».
2. `admin_preparar_invitacion` responde `nueva`, `reactivacion` o un rechazo (`ya_es_administrador`, `invitacion_pendiente`, `cuenta_de_cliente`). Los rechazos se muestran: quien los ve es un administrador con sesión completa.
3. `nueva`: S-1 crea la cuenta y envía el correo. `reactivacion`: S-3 levanta el veto y se pide al servicio el correo del enlace.
4. `admin_registrar_invitacion` crea las filas y I-20. Si falla tras un S-1: S-5 borra la cuenta recién creada; resultado `rechazada` o `incierta`.
5. La persona abre el enlace. Abrir no consume nada. En un alta, escribe su contraseña dos veces; en una reactivación, su correo y su contraseña.
6. La acción verifica la prueba contra el servicio y, en un alta, fija la contraseña. Después C-5: comprueba en el registro que la invitación está pendiente, sin caducar y es de esa cuenta; la acepta, pasa la cuenta a `activo`, abre la autorización de registro ligada a esa sesión (30 minutos) y escribe I-21 con la persona invitada como actor (más I-22 vinculada si reactiva).
7. Registra su factor (C-6, I-25), ve sus códigos de recuperación una vez y C-4 anota la sesión como completa (I-33).

Si la invitación está caducada, usada, anulada o es de otra cuenta, la respuesta es la única de `enlace_no_valido`, en tiempo fijo. Una invitación anulada deja de valer en el acto porque C-5 mira el registro, no el servicio. En una reactivación, la baja ya retiró los factores y anuló los códigos anteriores, y S-4 los borró en el servicio: no sirven (REQ-083).

### Entrar

1. `/acceso`: correo y contraseña. C-1 dice si alguna de las dos huellas está bloqueada.
2. Se llama al servicio (con una contraseña imposible si hay bloqueo). Fallo: C-1 cuenta, respuesta única en tiempo fijo. Acierto: el servidor escribe las cookies con la credencial nueva.
3. C-2 dice la situación. `administrador_no_activo` (dado de baja, o invitado que no ha aceptado): se cierra esa sesión y se da la misma respuesta única que con una contraseña errónea, en tiempo fijo (REQ-027). `no_administrador` (cualquier otra cuenta): la sesión sigue y, si va a `/admin`, ve «sin permiso» (REQ-034); la 040 añadirá aquí el paso al panel de cliente. `falta_segundo_factor`: a `/acceso/segundo-factor`. `falta_registrar_factor…`: a `/acceso/registro-factor`.
4. Código: C-3 (¿bloqueado?), verificación en el servicio con un factor del registro. Fallo: C-3 cuenta y, al quinto, bloquea, cierra la sesión y escribe I-38. Acierto: cookies nuevas, C-4 crea la fila de sesión e I-33, y se entra en `/admin`.
5. Con código de recuperación: lo mismo, con C-8; además se cierran las demás sesiones de la cuenta y se escribe I-28 vinculada a I-33.

### Cerrar sesión, cerrar las demás, cambiar la contraseña

- **Cerrar sesión:** `sesion_cerrar` cierra la fila; después se pide al servicio que cierre esa sesión y se borran las cookies. Aunque el servicio falle, la fila ya está cerrada: una copia de la credencial deja de dar acceso en su siguiente petición (CA-010). Carga completa de `/acceso`.
- **Cerrar las demás:** `admin_cerrar_otras_sesiones` (I-34); después, al servicio, cierre de las demás sesiones como segunda capa.
- **Cambiar la contraseña:** (1) se comprueba la contraseña actual contra el servicio con un cliente aparte, cuya sesión se cierra en el acto; un fallo cuenta en el límite del primer factor de la cuenta; (2) `admin_cerrar_por_cambio_contrasena` cierra las demás sesiones; (3) el servicio cambia la contraseña; (4) `admin_anotar_cambio_contrasena` escribe I-35. Si falla (3), las demás sesiones quedan cerradas: es el lado seguro. Si falla (4), se reintenta dos veces; si sigue fallando, el resultado es `incierta` y queda un código en la supervisión.

### Restablecer la contraseña

1. `/acceso/restablecer`: C-7 anota la solicitud si la dirección es de una cuenta (la dirección solo se compara, no se guarda) y se pide el correo al servicio. Respuesta única en tiempo fijo, exista o no.
2. `/acceso/nueva-contrasena`: la acción verifica la prueba contra el servicio; C-7 comprueba que la solicitud tiene menos de 30 minutos y no se ha usado, cierra **todas** las sesiones de la cuenta en el registro y escribe I-36; el servicio cambia la contraseña; la sesión que nació de la prueba se cierra y se borran las cookies.
3. La persona entra de nuevo por `/acceso`, con sus dos factores. El restablecimiento no abre ninguna autorización de registro, no toca factores y no entrega códigos (REQ-016, REQ-058).

Una solicitud hecha directamente contra el servicio, sin pasar por la pantalla, no tiene fila en `restablecimientos` y la pantalla no la acepta.

### Dar de baja

1. Diálogo: «Perderá el acceso de inmediato y se cerrarán sus sesiones. Su cuenta se conserva, desactivada, y seguirá apareciendo en la auditoría como "dado de baja"».
2. `admin_dar_de_baja`: una transacción, con el cerrojo del mínimo. Desde ese instante la siguiente petición de cualquier sesión de esa cuenta lee cero filas (CA-014).
3. S-2 veta la cuenta en el servicio y S-4 borra sus factores. Si el servicio falla, la baja **ya ha surtido efecto**; la fila queda con `servicio_pendiente`, la pantalla lo dice con palabra y ofrece «Reintentar». El resultado de la acción es `hecha`.

Darse de baja a uno mismo sigue el mismo camino y la misma regla del mínimo.

### Retirada del factor del único administrador (excepción de REQ-021), fuera del panel

1. El administrador restablece su contraseña por correo.
2. El responsable ejecuta `scripts/acceso/retirar-factor-unico.mjs`, con las mismas condiciones que el del primer administrador.
3. La función, que solo ejecuta el propietario de la base de datos, se niega si existe otro administrador activo con factor reconocido (en ese caso la vía es el panel). Si no: retira los factores, anula los códigos, cierra las sesiones, abre la autorización y escribe **una** fila I-31 con origen `responsable_fuera_del_panel`.
4. El script borra los factores en el servicio y pide el correo del enlace. Hasta registrar el factor nuevo, la cuenta lee cero filas y no escribe nada.

### Cuando algo falla

| Fallo | Qué pasa |
| --- | --- |
| El servicio de identidad no responde o devuelve algo inesperado | No se entra, no se verifica, no se cambia nada. Estado de error con referencia. Las pantallas del área no pintan datos de antes |
| La base de datos no responde o tarda más de 5 segundos | Igual. La guardia no deja pasar |
| El canal de acceso o el contador no responden | No hay inicio de sesión |
| Falla la fila de auditoría | La transacción se deshace; la acción no surte efecto; resultado `rechazada` o `incierta` |
| El servicio hace su parte y la base de datos no (alta de factor, invitación) | Lo hecho en el servicio no vale nada sin su fila en el registro; se limpia cuando se puede |
| La base de datos hace su parte y el servicio no (baja, retirada) | El efecto de seguridad ya existe; queda `servicio_pendiente` y se reintenta |
| No se puede enviar el correo | Invitar: el administrador ve el error y puede anular y repetir. Restablecer: respuesta única y un código en la supervisión |
| Valor fuera de una lista cerrada, en cualquier respuesta | Se trata como fallo: sin acceso |

## Auditoría de esta función

**Regla.** La fila la escribe siempre una función de la base de datos, en la misma transacción que da su efecto a la acción en el registro propio. Lo que ocurre en el servicio de identidad (inscribir un factor, cambiar una contraseña, vetar una cuenta) no deja rastro por sí mismo: lo deja la función que reconoce ese hecho en el registro, y sin esa función el hecho no vale en el área. Ninguna fila lleva correo, contraseña, código, huella ni prueba de un solo uso. El actor sale de la sesión o del token validado; nunca de la entrada.

| Entrada de la 024 | Cuándo | Actor u origen | Objeto | Filas vinculadas | La escribe |
| --- | --- | --- | --- | --- | --- |
| I-19 Creó el primer administrador | Script del responsable | Origen `responsable_fuera_del_panel` | La cuenta | — | Función del procedimiento |
| I-20 Invitó a un administrador | Invitar, alta o reactivación | Administrador de la sesión | La invitación | — | `admin_registrar_invitacion` |
| I-21 Aceptó una invitación | Aceptar | La persona invitada | La invitación | I-22 (la cuenta), si reactiva | C-5 |
| I-23 Anuló una invitación | Anular | Administrador de la sesión | La invitación | — | `admin_anular_invitacion` |
| I-24 Dio de baja a un administrador | Baja | Administrador de la sesión | La cuenta | — | `admin_dar_de_baja` |
| I-25 Registró un segundo factor | Primer factor, o añadir otro | El titular | El factor | I-28, si la reverificación fue con código de recuperación | C-6 o `admin_reconocer_factor` |
| I-26 Sustituyó un segundo factor | Sustituir | El titular | El factor nuevo | I-28, igual | `admin_sustituir_factor`: reconoce el nuevo y retira el anterior en una transacción, con una sola fila principal |
| I-27 Quitó un segundo factor | Quitar | El titular | El factor | I-28, igual | `admin_retirar_factor` |
| I-29 Regeneró sus códigos | Regenerar | El titular | Los códigos de la cuenta | — | `admin_anotar_regeneracion_codigos` o `admin_regenerar_codigos` |
| I-30 Confirmó la retirada del factor perdido de otro | Confirmar | El administrador que confirma | El factor retirado | — | `admin_confirmar_retirada` |
| I-31 Retiró fuera del panel el factor del único administrador | Script del responsable | Origen `responsable_fuera_del_panel` | El factor retirado | — | Función del procedimiento |
| I-33 Inició sesión | Al completar la sesión | El titular | La cuenta | I-28, si entró con código de recuperación | C-4 |
| I-34 Cerró las demás sesiones | Botón | El titular | La cuenta | — | `admin_cerrar_otras_sesiones` |
| I-35 Cambió su contraseña | Tras cambiarla en el servicio | El titular | La cuenta | — | `admin_anotar_cambio_contrasena` |
| I-36 Restableció su contraseña | Al usar el enlace, antes de cambiarla | El titular, identificado por la prueba | La cuenta | — | C-7 |
| I-37, I-38 Bloqueos | Al quinto fallo, si la cuenta es de un administrador | Origen `sistema` | La cuenta | — | C-1, C-3 |

- **I-32** («Completó una recuperación por pérdida del segundo factor») no se escribe: con las definiciones actuales, ese hecho ya es I-33 con I-28, o I-30, o I-31. Asunto A-4.
- **Cuando se retiran varios factores a la vez** (I-30, I-31), la fila principal lleva como objeto el factor más reciente. Si la 024 prefiere la cuenta, se cambia allí.
- **No dejan fila**, como fija la 024: cerrar la propia sesión, pedir un restablecimiento, verificar el código como paso de la entrada y los fallos sueltos.
- **Regenerar con la función del servicio.** El servicio genera los códigos antes de que exista la fila. Si la fila no se puede escribir, hay que invalidar ese juego (criterio 5 de T-P1). Con la alternativa construida, todo es una transacción.
- **I-35** es la única fila que se escribe después de un efecto que ya ha ocurrido fuera (el cambio en el servicio). REQ-041 pide que aparezca, no que condicione el cambio; si no se puede escribir, el resultado es `incierta` y queda un código en la supervisión.

## Tareas previas: lo que hay que comprobar antes de construir

Van las primeras en el plan. Ninguna construye producto. Cada una deja evidencia en `evidencias/` y tiene regla de decisión. Las ejecuta una persona o un agente con el proyecto de desarrollo del servicio; lo que exija poner un secreto lo hace una persona.

| Tarea | Qué comprueba | Regla de decisión |
| --- | --- | --- |
| **T-P1** · Códigos de recuperación del servicio | Los nueve criterios del apartado «Códigos de recuperación», con el servicio real | Los nueve: se usa la función. Falla uno o no se puede comprobar el 7: alternativa construida |
| **T-P2** · Comportamiento real del servicio de identidad | Lista siguiente | Por punto. Lo que no salga como se espera vuelve al arquitecto, salvo donde ya hay salida escrita |
| **T-P3** · Correo desde Google Workspace (V-111) | Lista siguiente | Todo correcto: se propone a coordinación pasar V-111 a CONFIRMADO. Falla algo: no se implementa ningún flujo con correo y se vuelve al responsable |
| **T-P4** · Política de contenido sin `proxy.ts` | Apartado «Protección de la sesión» | Allí |

**T-P2, punto por punto.**

1. Sesión con dos cookies propias y cliente sin almacenamiento ni renovación automática: entrar, verificar el código, renovar en un manejador y en una acción, y consultar con RLS. Si no funciona: se evalúa `@supabase/ssr` con cookies `HttpOnly` y vuelve al arquitecto.
2. El token lleva `session_id` y no cambia al renovar. Si cambiara, el registro de sesiones no sirve: vuelve al arquitecto.
3. ¿Acepta el servicio dos veces el mismo código dentro de su ventana? Sí: se activa C-10.
4. Veto: qué pasa con las sesiones abiertas, con el inicio de sesión y con los enlaces de una cuenta vetada; y que levantar el veto funciona. Solo informa: la baja no depende de ello.
5. Invitación a una dirección nueva y a una que ya existe; caducidad de los enlaces configurable en 24 horas; plantilla con la prueba en el fragmento; verificación de la prueba desde el servidor; que abrir el enlace no la consume. Si la caducidad máxima es menor de 24 horas: vuelve al arquitecto.
6. Qué tipo de correo del servicio sirve de enlace para una cuenta que ya existe (reactivación y registro de factor tras una retirada), y que ese tipo no crea cuentas nuevas.
7. Borrar los factores de otra cuenta y borrar una cuenta recién invitada con la API de administración: nombres y parámetros exactos de S-1 a S-5.
8. Inscribir solo el tipo de aplicación de códigos con el teléfono desactivado; el código QR llega como imagen SVG.
9. Cookies con prefijo `__Host-` y `Secure` en `localhost`, en los tres motores.
10. El cliente del servicio, en el servidor, no escribe contraseñas, códigos ni tokens en la salida del proceso (REQ-037).
11. Las llamadas del propio servicio con el token de una sesión que el registro ya cerró (regenerar códigos, inscribir factores): qué admite. Informa la amenaza AM-04.

**T-P3, lo que falta para V-111.** Sigue en VERIFICAR; este diseño no la da por resuelta.

1. Región donde Google guarda los datos de esa cuenta de Workspace. No encontrado en la documentación leída.
2. Adenda de tratamiento de datos de Google: cómo se acepta y que quede archivada (lista de publicación, «Privacidad»).
3. Que la cuenta de envío tenga verificación en dos pasos y que el administrador de Workspace permita contraseñas de aplicación. La contraseña la crea y la pone una persona en la configuración de correo del servicio de identidad.
4. La contradicción sin resolver de la evidencia: Google dice que desde el 1 de mayo de 2025 no admite aplicaciones que entran con usuario y contraseña, y a la vez documenta contraseñas de aplicación.
5. Prueba real de envío de los tres correos a una dirección del dominio y a una de fuera: llegan, no van a correo no deseado, superan SPF, DKIM y DMARC, y el enlace conserva el fragmento tal como sale (algunos clientes de correo reescriben los enlaces).
6. La dirección de envío. En `aclaraciones.md` figura `accesos@humannaia.com`, con dos enes; el nombre de la empresa se escribe con una. Hay que confirmar el dominio antes de configurar nada (asunto A-11).

## Amenazas de esta función

Ninguna prueba se ha ejecutado. «Dónde» está en la tabla de pruebas.

| N.º | Amenaza | Control | Prueba que lo demuestra |
| --- | --- | --- | --- |
| AM-01 | Con solo la contraseña de un administrador se leen o cambian datos (A-11) | La regla de acceso exige fila de sesión completa; la guardia en cada punto de entrada; con un solo factor la base de datos no ofrece ni filas ni funciones | PRUEBA-004, PRUEBA-006 |
| AM-02 | Un punto de entrada queda sin comprobar la sesión (aviso N-1 de la 020) | Guardia como primera instrucción de cada página, acción y manejador; prueba estática; sin `proxy.ts` ni dependencia de un `layout`; y, aunque fallara, las políticas vuelven a decidir | PRUEBA-003, PRUEBA-004 |
| AM-03 | Una sesión cerrada, o de una cuenta dada de baja, sigue valiendo hasta que caduca su token (H-4) | La fila de sesión se cierra en la transacción de la acción; la regla se evalúa en cada consulta | PRUEBA-011, PRUEBA-014, PRUEBA-015, PRUEBA-017 |
| AM-04 | Alguien habla directamente con la API pública del servicio de identidad: prueba contraseñas o códigos sin nuestro contador, o inscribe un factor con solo la contraseña | Nada de lo que consiga así crea filas en el registro: un `aal2` sin fila no entra, y un factor sin reconocer no se propone nunca. **Riesgo que queda:** puede averiguar si una contraseña es correcta con el único freno del límite por origen del servicio; y con contraseña y un código adivinado puede molestar a esa cuenta (cambiarle la contraseña o borrarle el factor en el servicio), lo que se arregla con la recuperación. Si los códigos de recuperación del servicio se pudieran generar así, daría acceso: por eso el criterio 7 de T-P1 | PRUEBA-001, PRUEBA-002 (punto 11), PRUEBA-006. Asunto A-3 |
| AM-05 | Registrar el segundo factor antes que el titular, con la contraseña robada (REQ-054) | Autorización de registro, que solo abre la prueba del correo y que va ligada a la sesión que la presentó | PRUEBA-009 |
| AM-06 | Quien controla el buzón restablece la contraseña y se salta el segundo factor (REQ-080) | El restablecimiento solo cambia la contraseña y cierra sesiones; no abre autorización; retirar el factor exige a otro administrador o al responsable | PRUEBA-012, PRUEBA-016 |
| AM-07 | Fuerza bruta de la contraseña o del código por nuestra app | Contador en la base de datos por cuenta y por origen; el del segundo factor no se reinicia al repetir el primero | PRUEBA-029 |
| AM-08 | Un tercero deja fuera a los administradores provocando bloqueos | El bloqueo dura 15 minutos y nunca es indefinido. Riesgo aceptado por el responsable en la cuestión 10 | PRUEBA-029 |
| AM-09 | Averiguar si una cuenta existe, está de baja o bloqueada | Mismo resultado, mismo camino y tiempo fijo | PRUEBA-019 |
| AM-10 | La clave secreta se usa para algo más, o un fallo en una pantalla da acceso total (A-10) | Confinada en `admin.ts`, cinco funciones, cinco condiciones; el canal de acceso con un rol que no lee tablas | PRUEBA-005 |
| AM-11 | El servidor llama al canal con un usuario que no es el de la petición | El usuario y la sesión salen del token validado por el servicio en esa petición; cada función vuelve a comprobar; prueba de «token de otro» en cada operación | PRUEBA-005, PRUEBA-023 |
| AM-12 | Los dos únicos administradores se dan de baja a la vez, o alguien retira el último factor | Cerrojo y recuento dentro de la transacción; sin borrado en cascada | PRUEBA-018 |
| AM-13 | Una cuenta se hace administradora por otra vía (registro público, invitación de cliente, escritura directa) | Registro público desactivado; sin permisos de escritura sobre `administradores`; solo las funciones de invitación y el procedimiento del responsable; cuentas separadas | PRUEBA-008, PRUEBA-018 |
| AM-14 | Petición desde otro sitio (CSRF), incluido el inicio de sesión | `SameSite=Strict`, `comprobarOrigen()`, solo `POST` | PRUEBA-021 |
| AM-15 | Incrustación en otra página | Cabeceras de la 002 | PRUEBA-020 |
| AM-16 | Ejecución de código por un texto introducido (XSS) | Escapado de la 020, validación del correo, política de contenido. **La política estricta no está demostrada** | PRUEBA-020, PRUEBA-033. Asunto A-2 |
| AM-17 | Robo, fijación o reutilización de la credencial; credencial de otro entorno | `HttpOnly`, `Secure`, `__Host-`, cambio al completar cada factor, registro de sesiones, proyecto y clave de firma por entorno | PRUEBA-022 |
| AM-18 | Contraseñas, códigos o pruebas de un solo uso en registros, errores, auditoría o direcciones | Prueba en el fragmento; errores por código; `registro.ts` sin valores; huellas en lugar de valores | PRUEBA-024 |
| AM-19 | Un fallo del servicio o de la base de datos deja entrar o enseña datos | Cierre en fallo en la guardia y en cada operación; listas cerradas | PRUEBA-026 |
| AM-20 | Acción sin rastro, o rastro sin acción | Efecto y auditoría en la misma transacción | PRUEBA-027 |
| AM-21 | Una pantalla abandonada sigue enseñando datos, o volver atrás los recupera | Caducidad por inactividad en la base de datos, sustitución del contenido al caducar, `no-store`, recarga al restaurar | PRUEBA-013, PRUEBA-014 |
| AM-22 | Instrucciones dentro de la documentación del servicio o de un correo (A-16) | Artículo 7: datos, no órdenes | Revisión |
| AM-23 | Un agente ejecuta los procedimientos del responsable o cambia la configuración del servicio | Scripts con terminal interactiva y clave en la terminal de la persona; configuración aplicada por una persona y comprobada por un script de solo lectura | PRUEBA-018 (parte manual) |

## Pruebas

**Dónde se ejecuta cada tipo.** No hay CI remoto.

| Tipo | Dónde | Estado hoy |
| --- | --- | --- |
| Unitaria (Vitest) | Batería local de la 002, comprobación de pruebas | Disponible cuando exista la app |
| Estática | Es una prueba unitaria que lee el código: entra en la batería sin cambiarla | Igual |
| En navegador (Playwright) | En local, sobre la compilación de producción de la app y contra el proyecto de desarrollo del servicio. Necesita red y unas cuentas de prueba. Entra en la comprobación «interfaz» que la 020 pide a la batería | Depende de la 020 y de la 002 |
| De base de datos (pgTAP) | **Ningún sitio.** No hay Docker ni CI remoto | **No se pueden ejecutar.** Asunto A-10 |
| En preproducción | Cuando exista (D-016) | No existe |
| Persona | El responsable o quien él diga, con guía | — |

**Ayudas de prueba.** Los correos no se leen de un buzón: las pruebas en navegador obtienen la prueba de un solo uso con la API de administración del proyecto de desarrollo. El «reloj de prueba» es mover hacia atrás las fechas de las filas (inicio de sesión, última actividad, solicitud, invitación) con una credencial de pruebas que solo existe para el proyecto de desarrollo. Ninguna ayuda vive en `src/`; no hay ganchos de prueba en el producto. Los valores de prueba marcados (contraseñas, códigos) son ficticios.

| Prueba | Qué comprueba | Tipo |
| --- | --- | --- |
| PRUEBA-001 | T-P1 | Real, previa |
| PRUEBA-002 | T-P2 | Real, previa |
| PRUEBA-003 | Guardia como primera instrucción en cada punto de entrada; sin `proxy.ts`, `loading`, `not-found` anidado ni `generateMetadata`; `navegador.ts` no se importa en `/acceso` ni `/admin`; `src/app/` no importa `admin.ts` ni `acceso.ts` | Estática |
| PRUEBA-004 | Cada página y cada acción del inventario, en carga completa, en navegación interna y por llamada directa, con cada perfil: sin sesión, un solo factor con y sin factor reconocido, usuario de cliente, usuario sin privilegios, dado de baja | Navegador |
| PRUEBA-005 | La clave secreta solo se lee en `admin.ts`, que exporta cinco funciones; para cada una: no se ejecuta sin sesión completa de administrador activo, solo toca la cuenta objeto, solo vuelve el resultado y deja su fila con el administrador como actor | Estática y navegador |
| PRUEBA-006 | Matriz de acceso: con sesión de un solo factor, y con `aal2` sin fila de sesión, todas las tablas y vistas del área por cada operación; lo legible en toda la base de datos es igual o menor que con un usuario sin privilegios | Base de datos |
| PRUEBA-007 | Control positivo: con sesión completa cargan todas las pantallas del área | Navegador |
| PRUEBA-008 | Usuario de cliente y usuario sin privilegios: cero filas; hacerse administrador escribiendo se rechaza; ninguna cuenta con las dos condiciones | Base de datos |
| PRUEBA-009 | Registro del primer factor: rechazado con solo la contraseña, aceptado con la prueba, rechazado desde otra sesión; el rechazo queda anotado en la supervisión | Navegador y base de datos |
| PRUEBA-010 | Dos entradas seguidas piden el código las dos veces; solo se ofrece y se acepta la aplicación de códigos; otro tipo se rechaza | Navegador |
| PRUEBA-011 | Gestión de factores sin reverificar; último factor; sustitución; otras 2 sesiones cortadas en su siguiente petición | Navegador |
| PRUEBA-012 | Recuperación con A y B: todos los casos de CA-008 | Navegador |
| PRUEBA-013 | Duraciones con reloj de prueba; aviso con al menos 20 segundos; seguir no supera 24 horas; contenido sustituido al caducar | Base de datos y navegador |
| PRUEBA-014 | Tras cerrar sesión, la credencial copiada se rechaza en la app y en la API de datos; volver atrás no enseña datos | Navegador |
| PRUEBA-015 | Con 3 sesiones: cambiar contraseña, cerrar las demás y usar un código de recuperación cortan las otras 2 sin margen | Navegador |
| PRUEBA-016 | Restablecimiento: sesiones cerradas, segundo factor exigido después, cero cambios de factor, doble uso y 31 minutos rechazados | Navegador |
| PRUEBA-017 | Alta completa, 24 horas y 1 minuto, anulación, baja y reactivación | Navegador |
| PRUEBA-018 | Mínimo de administradores, 100 repeticiones de bajas cruzadas; ninguna vía de la app o de la API crea un administrador sin sesión completa de otro; procedimientos del responsable | Base de datos y persona |
| PRUEBA-019 | Mismo texto, mismo resultado y medianas a menos de 100 ms | Navegador; se repite en preproducción |
| PRUEBA-020 | Incrustación bloqueada en cada pantalla; cabeceras de política; cadenas con código en cada campo | Navegador |
| PRUEBA-021 | Cada operación de la lista, pedida desde otro origen: cero efectos | Navegador |
| PRUEBA-022 | Atributos de la credencial; cambia al completar cada factor; credencial fijada antes no vale; credencial alterada o con indicadores cambiados no da nada | Navegador. La credencial de preproducción en producción, en entorno |
| PRUEBA-023 | Campos de más y «usuario de otro» en cada operación; invitación repetida | Navegador |
| PRUEBA-024 | Valores marcados: cero apariciones en registros, supervisión, auditoría, errores y direcciones | Navegador y búsqueda; en preproducción, también los registros de la plataforma |
| PRUEBA-025 | Revisión de privacidad con la skill | Revisión |
| PRUEBA-026 | Servicio y base de datos caídos, lentos o con respuestas inesperadas: sin acceso, sin datos, estado de error | Navegador, con un servicio simulado en local |
| PRUEBA-027 | Cada acción deja exactamente una fila principal correcta; con la auditoría forzada a fallar, no hay efecto; los fallos sueltos no dejan fila | Base de datos y navegador |
| PRUEBA-028 | `axe` sin infracciones en cada pantalla y estado; 320 píxeles; pegar funciona; capturas de los cinco estados; revisión con teclado y lector de pantalla | Navegador y persona |
| PRUEBA-029 | Límites del primer y del segundo factor, por cuenta y por origen; fin del bloqueo; código ya aceptado | Navegador y base de datos |
| PRUEBA-030 | Códigos de recuperación: una vez, un uso, regeneración | Navegador |
| PRUEBA-031 | Vuelta atrás de cada migración | Base de datos |
| PRUEBA-032 | T-P3 | Persona, previa |
| PRUEBA-033 | T-P4 | Navegador, previa |
| Contrato de la 020 | Sus PRUEBA-034 y PRUEBA-035 (reglas V-1 a V-4), con las direcciones de la 021 | Navegador |

### Cada criterio, con su prueba y dónde se ejecuta

| Criterio | Prueba | Tipo | Dónde | Se puede ejecutar hoy |
| --- | --- | --- | --- | --- |
| CA-001 | PRUEBA-006 | Base de datos | Sin sitio | **No** |
| CA-002 | PRUEBA-004 | Navegador | Local | Cuando exista la app |
| CA-003 | PRUEBA-007 | Navegador | Local | Igual |
| CA-004 | PRUEBA-004, PRUEBA-008 | Navegador y base de datos | Local; sin sitio | En parte |
| CA-005 | PRUEBA-009 | Navegador y base de datos | Local; sin sitio | En parte |
| CA-006 | PRUEBA-010 | Navegador | Local | Cuando exista la app |
| CA-007 | PRUEBA-011 | Navegador | Local | Igual |
| CA-008 | PRUEBA-012 | Navegador | Local | Igual |
| CA-009 | PRUEBA-013 | Base de datos y navegador | Sin sitio; local | En parte |
| CA-010 | PRUEBA-014 | Navegador | Local | Cuando exista la app |
| CA-011 | PRUEBA-015 | Navegador | Local | Igual |
| CA-012 | PRUEBA-016, PRUEBA-032 | Navegador y persona | Local; correo real | Igual; el correo, tras T-P3 |
| CA-013 | PRUEBA-017, PRUEBA-032 | Navegador y persona | Local; correo real | Igual |
| CA-014 | PRUEBA-017 | Navegador | Local | Cuando exista la app |
| CA-015 | PRUEBA-018 | Base de datos y persona | Sin sitio; la excepción, en preproducción | **No** |
| CA-016 | PRUEBA-018 | Persona y base de datos | Preproducción; sin sitio | **No** |
| CA-017 | PRUEBA-029 | Navegador | Local | Cuando exista la app |
| CA-018 | PRUEBA-029 | Navegador | Local | Igual |
| CA-019 | PRUEBA-019 | Navegador | Local y preproducción | En local. El valor que cuenta es el de preproducción |
| CA-020 | PRUEBA-020, PRUEBA-033 | Navegador | Local | Igual. Depende del asunto A-2 |
| CA-021 | PRUEBA-021 | Navegador | Local | Cuando exista la app |
| CA-022 | PRUEBA-022 | Navegador y entorno | Local; la parte entre entornos, con preproducción y producción | En parte |
| CA-023 | PRUEBA-022 | Navegador | Local | Cuando exista la app |
| CA-024 | PRUEBA-023 | Navegador | Local | Igual |
| CA-025 | PRUEBA-005 y dictamen | Estática, navegador y dictamen | Local | Igual |
| CA-026 | PRUEBA-024 | Navegador y búsqueda | Local y preproducción | En parte |
| CA-027 | PRUEBA-025 | Revisión | — | Cuando exista el código |
| CA-028 | PRUEBA-026 | Navegador | Local | Cuando exista la app |
| CA-029 | PRUEBA-027 | Base de datos y navegador | Sin sitio; local | En parte |
| CA-030 | PRUEBA-028 | Navegador y persona | Local | Cuando exista la app |
| CA-031 | PRUEBA-028 | Navegador | Local | Igual |
| CA-032 | PRUEBA-030, PRUEBA-015 | Navegador | Local | Igual |
| CA-033 | PRUEBA-008, PRUEBA-017 | Base de datos y navegador | Sin sitio; local | En parte |
| CA-034 | PRUEBA-015 | Navegador | Local | Cuando exista la app |
| CA-035 | PRUEBA-017 | Navegador | Local | Igual |

**Consecuencia.** Mientras no haya dónde ejecutar las pruebas de base de datos y no exista preproducción, CA-001, CA-015 y CA-016 no se pueden dar por superados, y otros seis quedan a medias. La función no puede pasar a VERIFICADA en ese estado (artículo 13). La especificación tiene además una errata que no cambia nada: la fila de CA-034 está pegada a una copia de la de CA-035; se ha leído cada criterio por separado.

## Valores que fija este diseño

Los de la especificación (24 horas, 60 minutos, 5 fallos, 15 minutos, 24 horas de invitación, 30 minutos de restablecimiento, 100 ms) no se repiten. Estos son nuevos y se aprueban con el diseño:

| Valor | Cuánto | Por qué |
| --- | --- | --- |
| Aviso de inactividad | 2 minutos antes | REQ-044 pide 20 segundos como mínimo; 2 minutos dan tiempo a leerlo con un lector de pantalla |
| Aviso del máximo de 24 horas | 10 minutos antes | Para terminar lo que se esté haciendo |
| Autorización de registro de factor | 30 minutos, ligada a la sesión que presentó la prueba | Mismo plazo que la recuperación |
| Reverificación antes de gestionar factores | Vale 5 minutos y se consume al usarla | «Inmediatamente antes» de REQ-008, con margen para inscribir el factor nuevo |
| Restablecimiento previo para confirmar una retirada | En las 24 horas anteriores | Hace del control del buzón una condición, además de la confirmación del otro administrador (CA-008) |
| Plazo de la guardia ante el servicio o la base de datos | 5 segundos | Después, estado de error |
| Renovación de la credencial | Cuando quedan menos de 60 segundos | — |
| Contraseña | De 12 a 128 caracteres | Guía de referencia de `docs/SEGURIDAD.md` |
| Códigos de recuperación (alternativa) | 10 códigos de 16 caracteres | 80 bits cada uno |
| Tiempo fijo de respuesta | 1.000 ms entrar y pedir restablecimiento; 1.500 ms aceptar | Valores iniciales; los ajusta PRUEBA-019 |
| Conservación del contador de intentos | 24 horas | Sobra para la ventana y el bloqueo |
| Caducidad del token del servicio | La que trae por defecto (1 hora) | El corte no depende de ella |

## Cobertura de requisitos

| Requisitos | Dónde se resuelven |
| --- | --- |
| REQ-001 | Una cuenta por persona en el registro; registro público desactivado; actor en cada fila de auditoría |
| REQ-002, REQ-007 | «Entrar», «Segundo factor» |
| REQ-003, REQ-004, REQ-033, REQ-047, REQ-063 | «La guardia», «La regla de acceso», «Matriz de acceso» |
| REQ-005, REQ-006, REQ-054 | Situaciones de la guardia; autorización de registro |
| REQ-008, REQ-009, REQ-015, REQ-057 | «Segundo factor» |
| REQ-010, REQ-080, REQ-081 | «Pérdida del factor y de los códigos» |
| REQ-011, REQ-012, REQ-044 | «La regla de acceso»; «Aviso de caducidad» |
| REQ-013 | «Cerrar sesión»; regla V-4 |
| REQ-014, REQ-078 | «Cerrar sesión, cerrar las demás, cambiar la contraseña» |
| REQ-016, REQ-058 | «Restablecer la contraseña» |
| REQ-017 a REQ-019, REQ-070, REQ-071 | «Invitar y aceptar»; funciones de operación |
| REQ-020, REQ-050, REQ-083 | «Dar de baja»; reactivación en «Invitar y aceptar» |
| REQ-021, REQ-056 | «Mínimo de administradores»; retirada fuera del panel |
| REQ-022, REQ-023, REQ-049 | «Primer administrador»; AM-13 |
| REQ-024 a REQ-026, REQ-051 a REQ-053 | «Límite de intentos y bloqueo» |
| REQ-027, REQ-055 | «Respuestas que no revelan nada» |
| REQ-028 a REQ-031, REQ-059, REQ-060, REQ-065, REQ-066, REQ-068 | «La credencial de sesión»; «Protección de la sesión en el navegador» |
| REQ-032, REQ-064 | `entradas.ts`; «Contratos» |
| REQ-034, REQ-048 | Situaciones de la guardia; regla V-1 |
| REQ-035, REQ-036 | «Operaciones con la clave secreta»; «El canal de acceso»; asunto A-1 |
| REQ-037, REQ-069, REQ-073 | Enlaces en el fragmento; errores por código; asunto A-8 |
| REQ-038 | «Datos que se guardan de cada administrador» |
| REQ-039, REQ-061, REQ-062 | Guardia; «Cuando algo falla» |
| REQ-040, REQ-041, REQ-067 | «Auditoría de esta función» |
| REQ-042, REQ-043, REQ-045, REQ-046 | «Pantallas» |
| REQ-072 a REQ-076, REQ-079 | «Códigos de recuperación» |
| REQ-077, REQ-082 | «Cuentas separadas» |

## Comprobación de la constitución

| Artículo | Resultado | Nota |
| --- | --- | --- |
| 1 Privacidad | Cumple | Ningún dato de correo ni de terceros. El único texto es el correo de cada administrador, con formato cerrado. No se guarda lo tecleado: solo huellas. Sin nombre de factor |
| 2 Aislamiento | Cumple | No hay datos de clientes en esta función. Quien actúa sale siempre de la sesión o del token validado; ninguna operación lo recibe. Cuentas de administrador y de cliente, separadas en la base de datos |
| 3 Cierre en fallo | Cumple | La guardia, la regla de acceso y cada operación deniegan ante cualquier fallo, ausencia o valor inesperado. Las operaciones a dos bandas fallan hacia el lado que quita acceso |
| 4 Secretos | Cumple | Tres secretos nuevos como mucho, todos en el gestor de variables y puestos por una persona. La contraseña de aplicación del correo vive en la configuración del servicio de identidad |
| 5 Especificación | Cumple | Especificación aprobada. Cada apartado cita sus requisitos y cada criterio tiene prueba. Las tareas son del plan |
| 6 Revisión independiente | Cumple | Este diseño no se aprueba a sí mismo: falta el dictamen del `auditor-seguridad` y la puerta P1 |
| 7 Entradas no confiables | Cumple | Las notas para agentes de la documentación del servicio se trataron como datos. Los enlaces de correo se validan por formato y contra el registro |
| 8 Límites en el anfitrión | No aplica | Esta función no entrega nada al agente del cliente |
| 9 Prompt por despliegue | No aplica | No toca el prompt |
| 10 Producto final | Cumple, con dos condiciones abiertas | Accesibilidad, estados, errores, aviso de caducidad, operación y procedimientos escritos forman parte de la entrega. **Condiciones:** la política de contenido estricta no está demostrada (asunto A-2) y el correo no está verificado (T-P3). Si alguna queda sin resolver, el resultado pasa a incumplimiento |
| 11 Reversibilidad | Cumple, con un límite declarado | Cada migración tiene vuelta atrás y prueba. La de la regla de acceso no se revierte sola, porque reabriría el acceso por `aal`; se dice en «Migración y vuelta atrás» |
| 12 Español | Cumple | Pantallas, correos, nombres de tablas, funciones y archivos. Los nombres del servicio y de las librerías se dejan como son |
| 13 Evidencias honestas | Cumple | Nada se da por probado. Lo no verificado está marcado y convertido en tarea previa. Se dice qué criterios no se pueden ejecutar hoy |
| 14 Cambios reservados | Cumple | Los procedimientos del responsable los ejecuta él. La configuración del servicio la aplica una persona. Los cambios en `next.config.ts`, `configuracion.ts`, `registro.ts` y la batería se piden a la fase 1 por su cauce. Este diseño no toca `docs/` ni el registro de decisiones |

Ningún incumplimiento firme. Hay un **posible bloqueante fuera del texto de la constitución**: REQ-036(b) no se cumple al pie de la letra (asunto A-1). Lo decide el responsable.

## Dependencias nuevas

| Librería | Para qué | Versión y fuente | Alternativa descartada |
| --- | --- | --- | --- |
| `@supabase/supabase-js` | Cliente oficial del servicio de identidad y de la API de datos, en el servidor | 2.119.0, licencia MIT. Registro de npm (`registry.npmjs.org/@supabase/supabase-js/latest`), leído el 13/11/2026. Depende de cinco paquetes de la misma familia y la misma versión. Se vuelve a comprobar al instalar. Si la fase 2 la instala antes, se usa su versión | Llamar a la API del servicio con peticiones escritas a mano: más código propio en una ruta crítica |
| Controlador de Postgres, solo con el camino R-A | Conexión del rol `acceso` | **No se elige aquí.** Será el que la fase 2 fije para el rol `conector` al verificar V-107 | — |

No se añaden: `@supabase/ssr`, ninguna librería de validación (V-109 sigue en VERIFICAR y aquí bastan validadores propios), ninguna de códigos QR (lo entrega el servicio), ninguna de códigos de un solo uso (los verifica el servicio), ninguna de correo (envía el servicio) y ninguna de fechas. Playwright y `axe` son de la 020.

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Autorizar con `aal` del token, como el modelo de referencia | No corta de inmediato (H-4), no impone las duraciones en el plan gratuito (H-3) y no impide registrar un factor con solo la contraseña. ADR-0003 ya lo descarta |
| Acortar la vida del token a 5 minutos | Sigue sin ser «en la siguiente petición» |
| Meter el estado en el token con el gancho de emisión | El token sigue quedando desactualizado hasta que se renueva |
| Comprobar la sesión en `proxy.ts` | Prohibido por la 002: se ejecutaría fuera de `fra1` |
| Comprobar la sesión en el `layout` de `/admin` | No protege la navegación interna, las acciones ni los manejadores (hallazgo N-1 del dictamen de la 020) |
| `@supabase/ssr` | Su patrón renueva la credencial desde `proxy.ts` y guarda la sesión de forma legible por la página |
| Verificar los códigos de un solo uso nosotros | Guardar secretos de factor es una ruta crítica que el servicio ya resuelve |
| Dejar que una sesión de un solo factor llame a funciones de la base de datos | Rompe REQ-004 y permite anotar como completa una sesión sin pasar por el contador |
| La clave secreta para todo lo previo a la sesión | Más privilegio del necesario en cada inicio de sesión. Queda como camino R-B solo si V-107 falla |
| Límite de intentos en el cortafuegos de la plataforma | No sabe si un intento falló ni de qué cuenta era |
| Cookies `SameSite=Lax` | REQ-031 pide que no se envíen en peticiones iniciadas desde otros sitios |
| La prueba de un solo uso en la ruta o en la consulta del enlace | Quedaría en los registros de la plataforma (REQ-037) |
| Consumir la prueba al abrir el enlace | Los analizadores de correo abren los enlaces y la gastarían |
| Enviar el correo desde la app | Otra dependencia y otro secreto en la app; el servicio ya lo hace |
| Pruebas de reconocimiento (captcha) | Recurso de terceros (REQ-030) y prueba cognitiva (REQ-043) |
| Guardar en el navegador lo escrito en un formulario | La 020 no usa almacenamiento; aquí serían contraseñas y códigos |
| Lista detallada de sesiones abiertas | Fuera de alcance; el registro la haría posible más adelante sin cambios de fondo |
| Una fila de auditoría por cada sesión cerrada o factor retirado al dar de baja | El inventario de la 024 no las tiene como vinculadas; la fila principal I-24 nombra la acción |

## Decisiones que requieren ADR

No se escriben aquí: este encargo solo permite `diseno.md`. Se proponen para después de la puerta P1.

| ADR propuesto | Qué fija | Qué frontera cambia |
| --- | --- | --- |
| «Acceso a los dashboards: el servicio de identidad verifica, el registro propio autoriza» | El principio de este diseño, el registro de sesiones y la regla de acceso | La frontera «Navegador → dashboards» de `docs/ARQUITECTURA.md`, que hoy dice «Supabase Auth, RLS, doble factor», y el punto 2 de ADR-0003 |
| Ampliación de ADR-0003: rol `acceso` y canal de acceso | Un segundo rol propio con una lista cerrada de funciones | La frontera «App → base de datos» |
| Solo si el asunto A-2 lo exige: excepción acotada a la prohibición de `proxy.ts` | Lo que decida el responsable | La decisión de la 002 |

## Qué se pide a otras fases y a coordinación

Nada de esto está aplicado. Este chat no edita lo que no es suyo.

**Fase 1 (función 002).**

1. Admitir en la app acciones de servidor y cookies, que la app base no tiene, y revisar si alguna regla de su análisis estático las impide.
2. La cabecera de política de contenido en `next.config.ts` para `/acceso` y `/admin` (ruta crítica), con el resultado de T-P4.
3. Variables nuevas en `configuracion.ts` y códigos nuevos en la lista cerrada de `registro.ts`: `acceso_fallo_primer_factor`, `acceso_fallo_segundo_factor`, `acceso_registro_factor_rechazado`, `acceso_auditoria_pendiente`, `acceso_correo_no_enviado`, `acceso_servicio_no_disponible`.
4. Qué cabecera da de forma fiable la dirección de origen en la plataforma.
5. Añadir a las rutas críticas `src/lib/acceso/`, `src/lib/supabase/`, `src/app/acceso/`, `scripts/acceso/` y `supabase/plantillas-correo/`; y a las reservadas, el archivo de PRUEBA-003 y la configuración de las pruebas de `tests/e2e/acceso/`.
6. Que la batería pueda ejecutar pruebas en navegador contra el proyecto de desarrollo del servicio, con su duración.
7. Preproducción, para CA-015, CA-016, CA-019, CA-022 y CA-026.

**Fase 2 (funciones 010 y 014).**

1. Verificar V-107, V-108 y V-113 con estas necesidades delante. Para V-113 se propone el contador en la base de datos.
2. Todo el apartado «Datos»: tablas, regla de acceso, restricciones, funciones y rol.
3. Usar `privado.es_admin()` en **todas** las tablas y vistas del área y quitar la lectura de la propia fila con un solo factor (frontera 1).
4. La forma de exponer las operaciones del panel y la ampliación de su lista cerrada de funciones (REQ-010 de la 010).
5. En `auditoria`: origen, referencia a la fila principal y lista cerrada de acciones; inserción solo por funciones.
6. Un sitio donde ejecutar las pruebas de base de datos (asunto A-10).
7. Aclarar la recomendación 9 de sus aclaraciones (asunto A-6).

**Función 020.** Que `Armazon` admita pintarse sin áreas, para la cuenta que no es administradora; los estados nuevos del catálogo; los textos de esta función en `textos.ts`; que `DialogoConfirmacion` sirva para el aviso de caducidad, que no tiene objeto con nombre; y el inventario de estilos inyectados de su PRUEBA-018, que T-P4 necesita.

**Función 024.** Confirmar la correspondencia de «Auditoría de esta función» y resolver el asunto A-4.

**Función 040 (fase 5).** La pantalla `/acceso`, `servidor.ts` y el contador se comparten: en la pantalla común solo puede haber un umbral por origen (asunto A-5). La restricción de cuentas separadas necesita su parte en `usuarios_cliente`. Sus duraciones de sesión son otras: su registro de sesiones es suyo.

**Coordinación.** Lo que ya está en `propuestas.md` (adelantar V-111, la excepción de `.claude/rules/interfaz.md`, la página «Cuenta» en `docs/DISENO.md`, el límite del segundo factor en la lista de publicación), más: anotar en `docs/SEGURIDAD.md` como rutas críticas el acceso de los dashboards y el canal de acceso; registrar en `docs/TECNOLOGIAS.md` las decisiones del responsable del 13/11/2026 (Pro solo en producción, función experimental con condición, Google Workspace) y lo que salga de la puerta P1; y la sesión de 24 horas y 60 minutos como desviación aceptada.

## Asuntos abiertos para el responsable

Los dos primeros condicionan la puerta P1. La columna «Propuesta» es del arquitecto y no es una decisión.

| N.º | Asunto | Opciones | Propuesta |
| --- | --- | --- | --- |
| A-1 | **REQ-036(b) y el canal de acceso.** Las operaciones que crean la sesión completa no pueden comprobar antes que ya existe una sesión completa. Y el canal necesita un privilegio que el navegador no tenga | (a) Aceptar para C-1 a C-8 y C-10 la condición equivalente (b') y ejecutarlas con un rol propio `acceso`, cuando la fase 2 verifique V-107. (b) Lo mismo, con la clave secreta (camino R-B). (c) Cambiar la especificación | (a); (b) solo si V-107 resulta inviable |
| A-2 | **Política de contenido sin `proxy.ts`.** Según la documentación de Next.js, prohibir todo código en línea exige un valor de un solo uso, que solo se genera en `proxy`. La 002 lo prohíbe. T-P4 lo mide; si confirma el límite, REQ-030 y CA-020 no se cumplen tal como están | (a) Excepción acotada: un `proxy.ts` que solo genera el valor y la cabecera, limitado a `/acceso` y `/admin`, con ADR y dictamen, y comprobando antes dónde lo ejecuta la plataforma. (b) Admitir código en línea en la política, apoyarse en el escapado de la 020 y cambiar REQ-030 y CA-020. (c) Parar la función hasta que la plataforma lo permita | Esperar a T-P4. Si confirma el límite, (a) |
| A-3 | **Camino directo al servicio de identidad** (AM-04). El contador propio no ve los intentos hechos directamente contra el servicio. No dan acceso al área, pero sí permiten averiguar una contraseña más deprisa de lo que deja nuestro límite | (a) Aceptar ese riesgo: el registro propio ya impide el acceso. (b) Endurecer: transformar la contraseña con un secreto del servidor antes de enviarla al servicio y cifrar la credencial de la cookie, de modo que solo nuestro servidor pueda hablar con el servicio. Añade dos secretos, código criptográfico propio en ruta crítica y obliga igual a la 040 | (a), con el criterio 7 de T-P1. Revisar (b) en la revisión de seguridad de la fase 6 |
| A-4 | **Auditoría: tres desajustes entre la 021 y el inventario de la 024.** CA-032 y CA-035 piden «una fila principal que nombra la acción» para usar un código de recuperación y para la reactivación; el inventario las tiene como filas vinculadas (I-28, I-22). E I-32 no tiene un momento propio | (a) Seguir el inventario y leer esos criterios como «una fila principal y, vinculada, la que nombra el hecho»; no escribir I-32. (b) Cambiar el inventario: I-28 e I-22 pasan a principales | (a) |
| A-5 | **Umbral por origen en la pantalla común.** La 021 tiene aprobados 5 fallos por origen; la 040 propone 20. Antes de saber quién entra no se puede aplicar uno u otro | (a) 5 para todos en `/acceso`. (b) 20 para todos y 5 solo por cuenta en administradores, cambiando REQ-024 | (a) |
| A-6 | **Alta desde el panel.** Las aclaraciones de la 010 recomiendan (número 9) que el alta y la baja de administradores sean solo fuera de la API. La 021, aprobada, las hace desde el panel | (a) Vale la 021. (b) Vale la 010 y se cambia la 021 | (a): es la especificación aprobada |
| A-7 | **Lo escrito en un formulario al caducar la sesión** se pierde, y el aviso lo dice antes. Afecta también a las funciones 022 a 025 | (a) Así. (b) Volver a pedir los dos factores dentro de la misma pantalla sin perder lo escrito: más superficie en la ruta de acceso | (a) |
| A-8 | **La clave del factor se enseña una vez al titular** al registrarlo. REQ-037 no lo nombra entre sus excepciones | (a) Aceptarlo por escrito como tercera excepción. (b) No hay otra forma de registrar una aplicación de códigos | (a) |
| A-9 | **Persona invitada que no registra su factor en 30 minutos.** Queda como administrador activo sin factor y sin autorización | (a) Se le da de baja y se le invita otra vez, con las operaciones que ya existen. (b) Operación nueva «reenviar el enlace de registro», con entrada nueva en el inventario de la 024 | (a) |
| A-10 | **Pruebas de base de datos sin sitio donde ejecutarse.** CA-001, CA-015 y CA-016 no se pueden dar por superados | (a) Esperar al CI remoto (función 003). (b) Un entorno con Docker para pgTAP, fuera de esta máquina. (c) Mientras tanto, ejecutar lo que se pueda con PGlite, como `scripts/probar-modelo.mjs`, y anotarlo como evidencia provisional que no cierra el criterio; las 100 repeticiones simultáneas no caben ahí | (c) ahora y (a) o (b) antes de verificar la función |
| A-11 | **Correo.** Faltan región de datos, adenda y prueba real (T-P3). Y la dirección anotada, `accesos@humannaia.com`, lleva dos enes | Confirmar el dominio; decidir quién hace T-P3; y, si el administrador de Workspace no permite contraseñas de aplicación, elegir otro proveedor (la evidencia apunta a Amazon SES en una región de la UE, sin verificar) | — |

## Lo que este diseño no ha podido comprobar

- Ningún comportamiento real del servicio de identidad: todo sale de documentación. En particular: los códigos de recuperación experimentales, el rechazo de un código ya usado, el efecto del veto, la caducidad configurable de los enlaces, que `session_id` no cambie al renovar, y los nombres exactos de los métodos de administración.
- Que una política de contenido sin código en línea funcione en esta app.
- El envío de correo desde Google Workspace, su región de datos y su adenda.
- Que el rol propio de Postgres sea viable desde la plataforma (V-107).
- Las cookies con prefijo `__Host-` en `localhost`.
- El diseño de la 002 tiene un dictamen sin cerrar y puede cambiar; el de la 010 no existe todavía. Si cambian, este diseño se revisa.
