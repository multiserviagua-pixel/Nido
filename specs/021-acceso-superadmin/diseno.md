# 021 · Diseño

- **Autor:** `arquitecto`. Dictámenes del `auditor-seguridad` (`dictamen-diseno*.md`): 1.ª, 1 B, 12 M y 16 m; 2.ª, 2 M y 13 m; 3.ª, 2 M y 7 m; 4.ª, 3 M y 8 m; 5.ª, 1 M y 6 m; vuelta de D-039 (`dictamen-diseno-6.md`), 3 M y 4 m; su confirmación (`dictamen-diseno-7.md`), 1 M y 3 m.
- **Fechas:** 13/11/2026; corregido el 14/11; condensado el 19/11 y el 21/11 (D-023); 21/11, 3.ª a 5.ª vuelta, respuestas del responsable a A-11, A-14 y A-15 (D-039), 2.ª vuelta de la enmienda y corrección tras la revisión D-039 del `revisor` (3.ª vuelta) y tras el dictamen de D-039 (`dictamen-diseno-6.md`); 22/11, corrección de `dictamen-diseno-7.md`.
- **Estado:** especificación APROBADA (P0) y enmendada por D-039 en tres vueltas (su «Registro de cambios»), con la enmienda pendiente de aprobar; P1 delegada (D-036). **El auditor confirmó la corrección de `dictamen-diseno-6.md` (`dictamen-diseno-7.md`, APTO CON CONDICIONES) y no ha visto la de `dictamen-diseno-7.md`; no se ha ejecutado ninguna prueba.**
- **Fuentes:** `evidencias/verificacion-identidad-y-correo.md`, `plan.md` y `tareas.md`.
- **Siglas:** servicio = Supabase Auth (D-002); BD = base de datos; adm. = administrador; 1F = sesión de un solo factor.

## Resumen

- **Quién entra:** lo decide un **registro propio** en la BD; el servicio solo verifica credenciales (no corta al momento, no limita por cuenta, API pública).
- **Sesión completa, un solo camino (B-1):** C-1 → contraseña → C-12 → código en la misma sesión. Depende de T-P2.12 y T-P2.13; si fallan, vuelve al arquitecto (A-13).
- **Regla:** `privado.es_admin()`. Cerrar la fila corta en la siguiente consulta (REQ-011, REQ-012).
- **Guardia** como primera instrucción; ni el `layout` ni el `proxy.ts` deciden; antes, solo `exigirValorPolitica()` si hay `proxy.ts`.
- **Accesos:** rol `acceso` para lo previo; en 1F, solo las cuatro funciones de sesión, que no devuelven datos (m-23); la clave secreta, solo para S-1 a S-5.
- **Orden:** T-P1 a T-P4 primero (`plan.md`). Quién decidió cada asunto, en «Asuntos decididos».

**Hechos** (H-1 a H-8, en las fuentes): `aal` solo segunda capa; códigos experimentales (T-P1); duración solo en Pro y sin corte inmediato (registro); límite por origen (V-113); Workspace (V-111); veto (T-P2); notas = datos. H-1 y V-1 «de la 020» son otros.

## Supuestos y dependencias

De la 002 (Next.js 16.4, sin `proxy.ts`), la 010 (M02 y M07 cambian con migraciones nuevas), la 020, la 024 ((a) a (d)), la 040 y la 052: `plan.md`, «Dependencias»; lo que se les pide, `propuestas.md`. Faltan preproducción (D-016) y sitio para pgTAP; V-107, V-108, V-111 y V-113, sin verificar.

## Piezas y responsabilidades

### Quién decide qué

El servicio dice si la credencial es válida; el registro (solo lo escriben funciones de la BD), si lo son el adm., el factor, la sesión y la invitación; la guardia y las políticas, si se atiende la petición. Ni el token, ni el navegador, ni el `layout`, ni las pantallas deciden.

### Mapa de archivos

Archivo por archivo y rutas críticas, en `plan.md`.

- **Scripts (m-28):** `primer-administrador.mjs` y `retirar-factor-unico.mjs` usan el propietario de la BD y la clave secreta; `levantar-bloqueo.mjs`, solo el propietario; `comprobar-configuracion.mjs`, el token de gestión.

### La credencial de sesión

- **Cookies:** `__Host-nido-acceso` y `__Host-nido-renovacion`, con `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sin `Domain` ni caducidad.
  - Solo las escribe el servidor.
  - `navegador.ts` no se usa en `/acceso` ni en `/admin`.
  - La firma cambia por entorno (REQ-066).
- **Token nuevo tras C-4.** Su `iat` debe ser **estrictamente posterior** a `completada_con_token_de`, sin holgura (REQ-065, m-24). Si no lo es, se renueva una vez y, si sigue igual, se deniega.
- **Borrar las cookies** es borrar solo las dos de la credencial, nunca la marca (m-17), y solo si llegó alguna (m-2).
- **Renovación:** con menos de 60 s, en la acción o en `GET /acceso/renovar` (T-P2.9).
- **Sin `@supabase/ssr`.**

### La guardia

Orden fijo. **Página:** `exigirValorPolitica()` (si hay `proxy.ts`) → `exigirAdministrador({ searchParams })` en `/admin`, o `exigirDireccionLimpia()` en `/acceso`. **Acción:** `exigirValorPolitica()` → `comprobarOrigen()` (si falla, `no_permitida`) → `exigirAdministradorEnAccion()`. **`route.ts`:** lo mismo; si falla, 404. La guardia llama a `public.sesion_tocar()`: `completa` o `sin_acceso`. Las políticas comprueban otra vez `es_admin()` (REQ-003). Con `sin_acceso` (REQ-004), consulta el servicio y C-2:

| Situación | Destino |
| --- | --- |
| Sin credencial | `/acceso` (REQ-034) |
| Credencial no válida, `sesion_cerrada` o `sin_primer_paso` | Cierre y `/acceso` (REQ-002, REQ-011, REQ-012, REQ-024) |
| Primer paso vigente | `/acceso/segundo-factor` (CA-002) |
| Sin factor | `/acceso/registro-factor` (REQ-005) |
| No es adm. activo | `sin-acceso.ts` (V-1, REQ-050) |
| Fallo, más de 5 s o valor ajeno | `fallo_servidor` (REQ-039) |

Una excepción equivale a sin acceso. `leerDelArea()` vuelve a consultar `sesion_estado()` y, si falla, `sesion_no_valida` (m-11). Sin `Suspense` sobre la guardia. V-4: `no-store` y `pageshow` (REQ-013).

**`layout.tsx` de `/admin` (m-30).** Se pinta en paralelo a la página y no lo cubre la guardia: empieza por `exigirValorPolitica()` (si falla, armazón sin áreas ni cuenta y sin BD) y lee el estado solo con `leerEstadoAcceso()` y `sesion_estado()`; pinta áreas y cuenta solo con `completa`. No decide nada. `admin/not-found.tsx` no lee nada y solo pinta texto fijo (m-31).

**Dirección reflejada (H-1 de la 020, M-15).** Next serializa ruta y consulta en todos sus cuerpos (página, 404, 307, RSC y acción: `c`, `q` y árbol de segmentos), las lea o no la aplicación; solo al incrustarlas en HTML las escapa (`htmlEscapeJsonString`); RSC y acción van en crudo como `text/x-component` (M-17). La política no protege lo que va dentro de sus guiones. Por eso:
- **La aplicación no refleja:** nada lee ni repite consulta ni segmentos fuera de las listas de `entradas.ts`. Las rutas de la 021 no admiten parámetros (REQ-037 va en el fragmento); la 022 a la 024 añaden los suyos, de lista cerrada o UUID (V-3 de la 020); `_rsc` no cuenta. La comodín solo llama a `sinAcceso()`.
- **Lo que serializa Next es R de AM-39**, controlado por su escapado (HTML) o por `text/x-component` con `nosniff` (RSC y acción), y comprobado por PRUEBA-055 en cada actualización de Next, acciones incluidas (llevan `q`; m-36).
- **Redirección, opcional:** si sobra un parámetro, la guardia y `exigirDireccionLimpia()` redirigen, sin BD ni registro, a una ruta de tabla constante; no es el control de H-1. La reserva del 404 fijo en el `proxy.ts` no cubre la ruta: descartada.
- Si PRUEBA-055 falla, no se integra y vuelve al arquitecto y al auditor.

**Sin acceso en páginas dinámicas y en RSC (V-1 de la 020).** En `/admin` toda dirección la atiende una página o la comodín: `sinAcceso()` siempre pasa por un `notFound()` dinámico y por `admin/not-found.tsx`, nunca por el prerenderizado de la raíz (en la 020 salió sin `lang`). Para el mismo usuario, en denegado, inexistente y área de otra fase:
- **carga completa:** 404, `lang="es"`, título fijo, `EstadoSinPermiso` y el mismo HTML crudo **salvo ruta pedida, árbol de segmentos y valores por petición** (M-15);
- **RSC:** mismo código y marca, carga igual con esas salvedades, 0 testigos y, si hay 307, `Location` del mismo origen, sin consulta y que empieza por `/admin`. No se exige 404;
- **oráculo de rutas aceptado** (M-15): el árbol de una ruta real denegada puede diferir del de la comodín; las rutas no son secretas.

Lo prueba PRUEBA-034 (propuesta a la 020). Si la carga completa no cumple, no se integra ninguna vista de `/admin` y vuelve al arquitecto. Reserva no adoptada: `sinAcceso()` sin `notFound()` (cambia V-1 de la 020).

**PRUEBA-003** (estática, con trampas; M-9) vigila este orden y las fronteras en páginas, acciones, `route.ts`, `layout.tsx` y `not-found.tsx` (lista en `plan.md`, «Pruebas»).

### El canal de acceso

`privado.acceso_*` solo lo usa el rol `acceso` y está fuera de los esquemas expuestos. La sesión sale del servicio. **La BD no se fía del servidor.** La auditoría va en la misma transacción.

| N.º | Función | Qué hace |
| --- | --- | --- |
| C-1 | `acceso_intento_primer_factor(fase)` | Compara la dirección sin el secreto (m-7). `reservar`, antes del servicio: `seguir` con su reserva o `no_seguir`; `fallo`, si el servicio rechaza (M-24, «Límite de intentos»). 5.º fallo: bloqueo e I-37; con marca, contador propio, acumulado desde su emisión (M-22), que la anula al 10.º y escribe (d); con 3 I-37 en 24 h, `bloqueos_repetidos` (m-29). Nunca cambia la cookie de la marca, sea cual sea el resultado (m-56) |
| C-2 | `acceso_estado` | Estado |
| C-3 | `acceso_intento_segundo_factor(fase)` | Exige el primer paso y cuenta códigos y reverificación (M-4), con reserva (M-24). 5.º fallo: bloqueo, cierre (m-22) e I-38 |
| C-4 | `acceso_registrar_sesion` | Comprueba sesión y factor en el servicio. Crea la sesión (I-33), consume el primer paso, fija `completada_con_token_de` (m-24) y emite la marca, **única función que la emite** (REQ-024 i); solo anula la anterior si es de la misma cuenta (m-21) |
| C-5 | `acceso_usar_enlace` | Invitación → `activo`, autorización, I-21 (+I-22); también retiradas |
| C-6 | `acceso_registrar_primer_factor(fase)` | `anunciar` (M-13) o `reconocer` (I-25). **No da sesión completa** |
| C-7 | `acceso_restablecimiento(…, marca, huella_nueva)` | Cupos, también por marca (m-18); `cupo_agotado`; 30 min, un uso. Decide y cuenta en una transacción, con los cerrojos de M-24 (cuenta, origen, marca). Su anuncio de `restablecimiento` conserva la marca de la cuenta con valor nuevo: sustituye su huella por `huella_nueva` (m-59) |
| C-8 | `acceso_usar_codigo_recuperacion` | Como C-4 (sesión, primer paso, `completada_con_token_de`), pero **no emite marca** (REQ-024 i, CA-017 8), cierra las demás sesiones y anula las otras marcas (m-19), con valor nuevo para la conservada (m-59); I-33 + I-28 |
| C-9 | `acceso_anotar_reverificacion` | Reverificación |
| C-10 | `acceso_codigo_ya_aceptado` | Si lo pide T-P2.3, 120 s |
| C-12 | `acceso_anotar_primer_paso` | Tras la contraseña: 10 min, un uso. Se niega si hay bloqueo sin marca, si la sesión es ajena o si no hubo contraseña. Con los cerrojos de M-24, vuelve a comprobar la regla y solo entonces resuelve como acierto la reserva de C-1 |

- **C-11 se suprime (M-1):** la retirada la autorizan `admin_confirmar_retirada` y el responsable.
- **`sesion_presentar()` (m-23, m-24):** guarda `aal`, `iat` y `amr` en `privado.presentaciones_sesion`, una sola fila por sesión que se actualiza, solo para adm. activos y sin retroceder. Si falla T-P2.12, C-12, C-4 y C-9 la exigen y el resto vuelve al arquitecto (A-13).
- **Privilegio (A-1):** R-A, el rol `acceso`, cuando se verifique V-107. R-B, la clave secreta, queda en reserva **sin activar**; activarla exige diseño propio, dictamen del auditor y P1 (m-28).
- **Si roban `acceso`:** puede bloquear y escribir I-36, I-37, I-38 o (d) por `intentos` falsas, pero no levantar bloqueos ni completar sesiones (T-P2.12, A-13).

### Operaciones con la clave secreta (REQ-036a)

| N.º | Operación | Antes, en la BD | Fila |
| --- | --- | --- | --- |
| S-1 | Crear sin enviar y enviar después; `inviteUserByEmail` solo si no hay otra (T-P2.5) | `admin_preparar_invitacion()` y `admin_registrar_invitacion` = `hecha` | I-20 |
| S-2 | Vetar (`updateUserById`, `ban_duration`) | Baja o anulación hechas | I-24 o I-23 |
| S-3 | Quitar el veto | **La BD primero**; sin `servicio_pendiente` | I-20 |
| S-4 | `mfa.deleteFactor` | Retirada auditada | I-24 o I-30 |
| S-5 | `deleteUser` para deshacer un alta | Rechazo en la misma operación | — (REQ-067) |

Solo afectan a la cuenta que da la BD, nunca a datos (REQ-035; PRUEBA-005). **Una operación nueva necesita dictamen del auditor antes de P1, también delegada** (M-10, m-28). Ningún agente la lee ni la copia; en pruebas, solo la de desarrollo, cargada del entorno (m-39). **REQ-036(b), lectura (b') (A-1):** C-1 a C-8, C-10 y C-12 comprueban en la BD después de que valide el servicio; falta en la especificación.

### Pantallas

- `/acceso` (compartida con la 040), `/acceso/segundo-factor` sin «recordar» (REQ-007), `/acceso/registro-factor` con autorización (REQ-006), `/acceso/invitacion`, `/acceso/enlace`, `/acceso/restablecer`, `/acceso/nueva-contrasena` y `/admin/cuenta`.
- `/admin/ajustes/administradores`, con `DialogoConfirmacion`:
  - para invitar: «Se enviará un correo a esta dirección con un enlace válido 24 horas. No tendrá acceso hasta que ponga su contraseña y registre su segundo factor»;
  - para dar de baja: «Perderá el acceso de inmediato y se cerrarán sus sesiones. Su cuenta se conserva, desactivada, y seguirá apareciendo en la auditoría como "dado de baja"».

Abrir un enlace no lo consume. Los campos permiten `autocomplete` y pegar (REQ-043). El QR va en un `img` `data:`. La prueba viaja en el fragmento y se borra con `history.replaceState` (REQ-037); la clave del factor es la excepción A-8.

### Segundo factor

Solo TOTP (CA-006). Un factor inscrito por fuera no se propone nunca. Si T-P2.3 falla, C-10 (REQ-026).

| Operación | Pasos |
| --- | --- |
| Primero | C-6 `anunciar` → alta en el servicio → C-6 `reconocer` → códigos → cierre |
| Verificar | C-3 → factor **del registro** → C-4 |
| Reverificar | C-3 → C-9 |
| Añadir | C-9 de menos de 5 min → `admin_anunciar_factor()` → alta → `admin_reconocer_factor()` (I-25) |
| Sustituir | C-9 → `admin_anunciar_factor()` → alta → **verificar el nuevo en la sesión actual** (el borrado del anterior puede bajar `aal`; m-35) → `admin_sustituir_factor(nuevo, anterior)`, que anuncia el borrado del anterior antes de pedirlo; una sola I-26 |
| Quitar | `admin_retirar_factor()` anuncia el borrado y después se borra; solo si queda otro (REQ-009) |

**Anuncio (M-13, M-16):** fila de `privado.cambios_esperados` de tipo `factor`, de 5 min, que abre C-6 `anunciar` (sesión 1F del primer factor), `admin_anunciar_factor`, `admin_sustituir_factor` o `admin_retirar_factor`. La tabla del servicio no tiene sesión: **la ligadura a la sesión la comprueban las funciones del panel que abren y cierran, no el disparador.** «Casar» es:
- **alta:** el anuncio se ata al primer `factor_id` que aparece y cubre su paso a `verified` y su borrado si se cancela, hasta que lo cierra C-6 `reconocer`, `admin_reconocer_factor` o `admin_sustituir_factor`, o pasan 5 min;
- **borrado:** solo el `factor_id` anunciado;
- un factor sin verificar que el registro no tiene (también el caducado que borre el servicio) nunca consume ni dispara;
- si el anuncio se rechaza o caduca sin reconocerse, su factor cuenta como sin anuncio: cierra todo y (c) (m-37);
- otro `factor_id` que aparece en la ventana cuenta como sin anuncio.

### Códigos de recuperación

La función del servicio solo se usa si T-P1 cumple sus 10 criterios (`plan.md`, «Tareas previas»). Si falla alguno o hay duda, alternativa. Si se adopta, PRUEBA-046 en cada batería (M-11).

**Alternativa, siempre construida:** 10 códigos de 16 caracteres (80 bits) con HMAC `ACCESO_HMAC_CODIGOS` en `privado.codigos_recuperacion`. Regenerar es una sola transacción (I-29). Los fallos cuentan en C-3.

### Pérdida del factor y de los códigos

1. A restablece (REQ-016).
2. B lo comprueba por otra vía (m-16).
3. `admin_confirmar_retirada()` con A ≠ B (REQ-081) y restablecimiento de menos de 24 h; I-30.
4. S-4.
5. A registra el factor (I-25).

Si no hay otro adm., `retirar-factor-unico.mjs` (REQ-021).

### Límite de intentos y bloqueo

El contador vive en la BD (propuesta para V-113).

| | Primer factor | Segundo factor |
| --- | --- | --- |
| Clave | HMAC (`ACCESO_HMAC_CONTADOR`) de la dirección canónica y, aparte, del origen | La cuenta (REQ-025) |
| Umbral | 5 fallos en 15 min; con marca válida de la cuenta, solo su contador propio de 10 fallos desde su emisión, sin ventana (M-22), que no suma por origen ni por cuenta (REQ-024 a, b) | 5 en 15 min, también con marca |
| Efecto | 15 min, **sin llamar al servicio**; I-37; termina por tiempo o levantamiento | Bloquea la gestión y cierra la sesión (m-22); I-38; solo por tiempo |

- Dirección en ASCII y minúsculas; si no, `correo_no_valido` (m-8).
- IPv6 por /64; sin cabecera fiable, se deniega (M-12).
- Restablecimiento: 3 por cuenta y hora; una solicitud con marca válida de esa cuenta no cuenta ahí sino en el cupo de su marca, 3 por hora; 5 por origen cada 15 min, con o sin marca (REQ-024 h); al agotarse, `acceso_cupo_restablecimiento_agotado` (m-18).
- Como mucho 5 llamadas al servicio por cuenta (M-6).
- **Atomicidad (M-24):** decidir y contar van en la misma transacción, con cada clave serializada; si no, N peticiones a la vez leen el mismo recuento y todas siguen.
  1. **Cerrojos:** cada función que lee o escribe `intentos_acceso` o `bloqueos_acceso` toma, antes de leer, `pg_advisory_xact_lock` sobre cada clave que usa, siempre en el orden **cuenta** (la HMAC de la dirección, exista o no la cuenta), **origen**, **marca** (su `id`; varias, por `id` ascendente). Ninguna toma uno de cuenta tras uno de origen o de marca, ni uno de origen tras uno de marca. Son de transacción, no de sesión (el agrupador de conexiones en modo transacción no conserva los de sesión). Con `lock_timeout` local de 2 s: si vence, `no_seguir` con la respuesta de siempre (art. 3). Los toman C-1, C-3, C-7, C-12, C-4, C-8 y C-9 al resolver, `admin_levantar_bloqueo` y `levantar-bloqueo.mjs`.
  2. **Reserva:** C-1 `reservar` cuenta fallos y reservas vigentes de cada clave que aplica (con marca válida de la cuenta, la de la marca y el bloqueo del origen; sin ella, cuenta y origen) y, si están por debajo del umbral, anota en esa transacción una fila `provisional` en cada una, con un `reserva_id` común que devuelve con `seguir`. Así, a la vez o en serie, como mucho 5 `seguir` sin marca por cuenta y por origen, 10 con marca (el 10.º fallo la anula) y, como cada `seguir` es una llamada, el tope de M-6.
  3. **Resolución:** si el servicio rechaza la contraseña, C-1 `fallo` pasa la reserva a `fallo` y, si llega al umbral, escribe en esa transacción el bloqueo e I-37, o anula la marca con (d), y `bloqueos_repetidos`. Si la acepta, C-12 comprueba otra vez la regla: reserva `provisional` de menos de 30 s y de la cuenta de la sesión, sin bloqueo nuevo del origen ni, sin marca, de la cuenta, y la marca aún válida; solo entonces borra la reserva (el acierto no se guarda, REQ-038) y anota el primer paso. Si no, se niega y la reserva pasa a `fallo`.
  4. **Reserva huérfana:** una `provisional` de más de 30 s cuenta como `fallo`; la resuelve, como en 3, la siguiente función que tome esa clave, con el bloqueo contado desde la reserva. Saltarse `fallo` (servidor caído o `acceso` robado) no da intentos de más: la reserva ya contaba.
  5. **Segundo factor y cupos:** C-3 sigue 2 a 4 con su `fase` (`reservar` antes de que el servicio compruebe el código, `fallo` si lo rechaza), y C-4, C-8 o C-9 resuelven el acierto con la misma nueva comprobación; C-7 cuenta y anota la solicitud en una sola transacción, con los cerrojos de cuenta o marca y de origen.
- No se guarda lo tecleado (REQ-041).
- Códigos: `acceso_fallo_primer_factor` y `acceso_fallo_segundo_factor`.
- Riesgo aceptado: AM-04 (A-3).

### Bloqueo provocado por un tercero (M-5, A-12)

Siempre se piden la contraseña y el código; la premisa de la cuestión 10 era falsa.

1. **Navegador reconocido** (término de la especificación; REQ-007, REQ-024 a-i; D-039). No es factor: con ella se piden igual contraseña y código (CA-006).
   - **Cookie (M-21):** `__Host-nido-dispositivo`, con `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sin `Domain` y `Max-Age` de 30 días al emitirse (igual a `caduca_en`; al renovar el valor, m-54, los segundos que le quedan). Solo la escribe y la borra el servidor (`navegador-reconocido.ts`): la escriben C-4 y la renovación de m-54 y m-59; la borra, con `Max-Age=0`, «olvidar este navegador»; ningún otro paso la toca, y C-1 nunca la cambia según su resultado, tampoco al anularla por `intentos` (m-56). Lleva 256 bits aleatorios y su etiqueta HMAC con `ACCESO_HMAC_DISPOSITIVO`, distinta por entorno: una marca del entorno previo no vale en producción (CA-017 2, probado con dos claves simuladas). La etiqueta cubre solo los bits aleatorios; ni el valor ni la `huella` guardada en `privado.dispositivos_reconocidos` contienen ni derivan de dirección, nombre, `usuario_id` ni origen (REQ-024 f); la fila liga la huella a la cuenta en su columna `usuario_id` (REQ-038); la huella solo está en esa fila y lo demás la referencia por su `id`.
   - **Emisión (REQ-024 i):** solo C-4, tras un inicio de sesión completo con TOTP de un adm. activo. C-8 (código de recuperación), C-6, C-12, la 1F y cualquier paso intermedio no emiten ninguna, ni cookie ni fila. Al emitir, C-4 anula la que traía ese navegador si es de la misma cuenta (`renovacion`, m-21) y, si la cuenta ya tiene 5 vigentes, la más antigua (`limite`).
   - **No es entrada de identidad (REQ-024 c):** C-1 obtiene la cuenta de la dirección y la contraseña, y solo entonces mira si la huella es de esa cuenta; si no, o si está caducada, anulada, alterada, es de otro entorno o no se puede comprobar, cuenta como sin marca: 5 fallos y 15 min (REQ-024 d). Ante la duda, no hay marca.
   - **Qué cambia (REQ-024 a, b):** con marca válida de la cuenta de la dirección introducida, el bloqueo por cuenta no se aplica y el fallo solo suma en `navegador_primer_factor`, **nunca en `origen_primer_factor`** (ni en `cuenta_primer_factor`); al 10.º la marca se anula (`intentos`, `acceso_navegador_anulado_por_intentos`). **Acumulado (M-22, decisión de la coordinación por D-036):** ese contador cuenta los fallos desde la emisión de la marca, sin ventana; un acierto de contraseña no lo pone a cero; solo un inicio de sesión completo (C-4) emite una marca nueva, cuyo contador empieza en cero. Así, quien robe la marca tiene como mucho 9 fallos en toda su vida, y el 10.º deja fila (d) y el código de registro. Como C-1 solo mira la marca tras identificar la cuenta, un fallo sin marca válida de esa cuenta (sin marca, otra cuenta, dudosa) suma por origen y por cuenta: quien no tiene la marca sigue limitado a 5 por origen y 5 por cuenta. El origen se bloquea al 5.º fallo sin marca y, bloqueado, lo está también con marca; el segundo factor y el cupo de restablecimiento por origen, igual con marca. C-12 se niega si hay bloqueo por origen o, sin marca válida, por cuenta. Los recuentos valen también con peticiones a la vez: reserva y cerrojos de M-24 («Límite de intentos», atomicidad).
   - **Anulación (REQ-024 e1 a e6):** los doce motivos de `motivo_anulacion`, con el alcance de la especificación. Los de (e5) conservan la del navegador que hace el cambio (`marca_conservada_id`, m-19; C-8 con la misma regla); los de (e6) las anulan todas. **Renovación del valor (m-54, m-59):** en los cinco motivos de (e5), la marca conservada no sigue con el mismo valor: al cerrar las demás sesiones (`admin_cerrar_otras_sesiones`), al cambiar la contraseña (`admin_anunciar_cambio_contrasena`), al restablecerla (el anuncio de `restablecimiento` que abre C-7 al usar el enlace), al cambiar el factor (`admin_reconocer_factor`, `admin_sustituir_factor` y `admin_retirar_factor`) y al entrar con un código de recuperación (C-8), cada una con `marca` y `huella_nueva`: el servidor genera uno nuevo y la función, en su transacción, sustituye la `huella` de esa fila (mismo `id`, `emitido_en`, `caduca_en` y contador); después el servidor pone la cookie nueva. El valor anterior da trato de sin marca. No es una emisión (REQ-024 i y e5: la marca de ese navegador se conserva) ni una anulación, así que no escribe (d); tampoco en C-8, que no crea fila ni da cookie a un navegador sin marca válida de la cuenta. Si la respuesta no llega al navegador, este queda sin marca válida: cierra en fallo (art. 3). **Solo marcas propias (m-55):** `admin_olvidar_navegador` y las funciones de la renovación solo actúan sobre una marca cuyo `usuario_id` es el de la sesión; si no, la tratan como sin marca: no la anulan, conservan ni renuevan, ni escriben (d) de ella (`admin_olvidar_navegador` no hace nada). «Cerrar sesión y olvidar este navegador», ofrecido al cerrar sesión, con el aviso para ordenadores compartidos (m-17). Cada anulación deja la fila (d) («Auditoría», REQ-041).
   - **Cupo (REQ-024 h):** las solicitudes de restablecimiento con marca válida cuentan en `navegador_restablecimiento`, 3 por hora, no en el de la cuenta, y sí en `origen_restablecimiento` (m-18).
2. **Otro adm.** con `public.admin_levantar_bloqueo(usuario)` (REQ-024 g).
   - No puede levantar el suyo (`no_puedes_levantar_tu_propio_bloqueo`); `sin_bloqueo_activo`; en 1F, `no_permitida`.
   - Borra bloqueo, fallos y cupo de restablecimientos de la cuenta y los `navegador_restablecimiento` de sus marcas (REQ-024 g, m-18); escribe (a) y `acceso_bloqueo_levantado` (m-29).
   - El bloqueo del segundo factor no se levanta.
3. **El responsable:** `levantar-bloqueo.mjs`, con el mismo efecto que 2, y fila (b).

**Riesgo residual (AM-08a, M-20, m-57):** desde un navegador sin marca, quien conozca la dirección de un adm. puede repetir 5 fallos cada 15 min. Si llega desde otro origen, el titular sigue entrando por su navegador reconocido y quedan 2 y 3. **Si comparte el origen del titular** (misma oficina, mismo /64 o CGNAT), también bloquea ese origen y el titular no entra, ni con marca, mientras dure; 2 y 3 levantan el bloqueo de la cuenta, no el del origen, así que solo entra desde otro origen. Tratado por la marca según el responsable (`aclaraciones.md`, 21/11/2026), salvo ese caso.

### Respuestas que no revelan nada (REQ-027, CA-019)

| Momento | Código | Texto |
| --- | --- | --- |
| Entrar | `credenciales_no_validas` | «El correo o la contraseña no son correctos, o el acceso está bloqueado temporalmente. Si lo has intentado varias veces, espera 15 minutos» |
| Restablecer | `hecha` | «Si la dirección corresponde a una cuenta, recibirás un correo con un enlace válido 30 minutos» |
| Aceptar | `enlace_no_valido` | «Este enlace no es válido o ha caducado. Pide una invitación nueva» |

`responderEnTiempoFijo()` responde a los 1.000 ms (1.500 al aceptar). No se llama al servicio solo para igualar (M-6). **Cabeceras iguales (m-56):** en cada caso de CA-019, y con marca en los fallos 9.º y 10.º (este anula la marca), las mismas cabeceras de respuesta, `Set-Cookie` incluida: el primer paso nunca toca la cookie de la marca. PRUEBA-019 lo comprueba como parte de CA-019, que ya nombra las cabeceras por enmienda mecánica pendiente de aprobar en T-005 (b) (m-60).

### Protección de la sesión en el navegador (A-21)

- **REQ-028:** cabeceras de la 002.
- **REQ-029:** `Strict`, `comprobarOrigen()` y solo `POST` (CA-021).
- **REQ-030, no demostrado.** T-P4 mide P-1, `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'` con `experimental.sri`, y P-2, `script-src 'self' 'nonce-…' 'strict-dynamic'`. Nunca `'unsafe-inline'`.
- **Inventario de la 020** (T-009): con P-1, los guiones en línea de Next quedan bloqueados; lo esperable es P-2 con `proxy.ts`. Detalle y repetición en T-P4 (`plan.md`).
- **`proxy.ts` acotado (A-2, M-14):**
  - casa solo `/acceso` y `/admin`; no lee cookies ni cuerpo, no registra, no redirige, no importa `src/lib/` y no decide; el ADR dice que `Cookie` pasa por él aunque no la lea;
  - genera un valor de ≥128 bits, **sobrescribe** (`set`) `x-nonce` y `Content-Security-Policy` de la petición, nunca usa los del cliente, y pone la política en la respuesta;
  - sin un valor bien formado, `exigirValorPolitica()` da error sin datos (404 en página, `no_permitida` en acción): un navegador no añade `x-nonce` a una navegación, así que la víctima que no pase por `proxy.ts` no tiene página. Ese 404 lleva los guiones de Next sin `script-src` (m-31): `admin/not-found.tsx` solo pinta texto fijo;
  - `next.config.ts` mantiene ahí una segunda cabecera fija: `frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'`.
- **Pendientes:** `arn1` (D-020), CVE-2025-29927 y las vías que no pasan por `proxy.ts` (sospecha del auditor; T-P4, PRUEBA-051).
- **REQ-068:** `TextoDato`.

### Aviso de caducidad y formularios

`AvisoCaducidad` avisa 2 min antes (REQ-044) con `public.sesion_estado()` y ofrece «Seguir conectado» hasta las 24 h. Lo escrito se pierde (A-7).

### Configuración y secretos

Una persona pone en el gestor de cada entorno (art. 4) la clave secreta (`admin.ts`), la credencial `acceso` y `ACCESO_HMAC_CONTADOR`, `ACCESO_HMAC_CODIGOS` y `ACCESO_HMAC_DISPOSITIVO` (D-039; m-50), distintas entre sí y por entorno; la última solo la lee `navegador-reconocido.ts` y no se rota durante un ataque (m-25). La contraseña de envío, fuera del gestor por la excepción de A-14 (abajo). En el servicio: sin registro público, solo TOTP, enlaces de 24 h y plantillas propias; lo comprueba `comprobar-configuracion.mjs` (su token no es de solo lectura).

**Correo de acceso (A-11).** Sale de Google Workspace, del dominio verificado, por el SMTP del servicio (`smtp.gmail.com`; `verificacion-identidad-y-correo.md`), desde una **cuenta de envío dedicada por entorno** (M-3, M-23, AM-27): la de producción, `accesos@humannaia.com`, solo se configura en el servicio de producción; desarrollo y preproducción usan otra cuenta dedicada del dominio, que elige una persona, o no hacen envío real. La cuenta de envío de cada entorno está en una unidad organizativa con IMAP y POP desactivados, sin reenvíos ni delegaciones (T-P3.13, con acta). Antes del envío real: V-111 (región y adenda) y V-107 según D-039, con `verificar-decision`, y T-P3; hasta entonces, CA-012 y CA-013 «no ejecutadas».

**Excepción al art. 4, acotada (A-14):**
- **Alcance:** solo la contraseña de aplicación de la cuenta de envío de cada entorno (una cuenta y una contraseña por entorno; nunca la de producción fuera de producción, M-23), que una persona escribe en la configuración SMTP del servicio. Ningún otro secreto sale del gestor; nunca en repositorio, prompts, chats con agentes, registros, supervisión ni evidencias (M-18). `comprobar-configuracion.mjs` no pide, imprime ni guarda ese campo y, si la API de gestión lo devuelve, lo descarta antes de cualquier salida (T-P3.13; PRUEBA-024 con un valor marcado). Fuera de producción falla si el usuario SMTP o el remitente es la cuenta de producción, o si falta alguno de los dos en la respuesta (m-58: la contraseña va con el usuario, no con el remitente; PRUEBA-032 E).
- **Alcance real de la contraseña (sin verificar):** una contraseña de aplicación de Google da acceso a la cuenta por todos los protocolos que la admiten, no solo SMTP (IMAP y POP y, según el auditor, quizá CalDAV y CardDAV); T-P3.13 lo comprueba en la documentación de Google y anota en el acta cada protocolo y si está cerrado para esa cuenta; si alguno no se puede cerrar, se trata como IMAP y POP (no hay correo y vuelve al responsable). Por eso la cuenta es dedicada y sin otro uso (M-3), una por entorno, y su unidad organizativa tiene IMAP y POP desactivados y ningún reenvío ni delegación (M-23), comprobado y anotado en el acta en T-P3.13.
- **Copias del enlace (M-23):** una invitación a una dirección inexistente del dominio rebota; si en la cuenta de envío queda copia del enlace (Recibidos, Spam, Papelera o Enviados), se pone una regla que la borre o se cambia de vía (T-P3 punto 7, PRUEBA-032). Sospecha del auditor: el SMTP de Gmail suele guardar copia en Enviados y los filtros no actúan sobre lo enviado; si T-P3 (7) lo confirma, es «cambio de vía» y, hasta tenerla, no hay correo (art. 3).
- **Rotación:** cada 90 días (si pasan sin rotar, aviso de supervisión desde la fecha del acta; pedido en `propuestas.md`) y de inmediato ante sospecha de exposición, baja de una persona con acceso a la cuenta de envío o a la configuración del servicio, o cambio de la contraseña de esa cuenta. Orden: crear la nueva, ponerla, enviar una prueba, revocar la anterior. La hace una persona (art. 14) y anota en el acta de `guia-responsable.md` solo fecha y entorno.
- **Vía preferente, con la que decae:** gancho de envío del servicio («Send Email Hook», `supabase.com/docs/guides/auth/auth-hooks/send-email-hook`, leída el 21/11/2026, sin dato del plan gratuito) hacia un `route.ts` propio que envía con la API de Gmail, con sus secretos en el gestor. Credencial: (i) cuenta de servicio con delegación de dominio solo para enviar, la del responsable, que según Google alcanza a todo el dominio en ese ámbito (`developers.google.com/workspace/guides/create-credentials`), más que la contraseña; o (ii) cliente OAuth interno de la propia cuenta de envío, solo para enviar. Sin verificar (T-P3.13); si es viable, diseño propio (webhook, ruta crítica), dictamen y P1, y al ponerla en marcha se revoca la contraseña.

## Contratos

`contratos/` no cambia. Ninguna forma recibe quién actúa.

| Forma | Valores |
| --- | --- |
| `sesion_tocar`, `sesion_estado` | `completa` (de 0 a 3.600 s y de 0 a 86.400 s) o `sin_acceso` |
| C-2 | `sin_sesion`, `sesion_cerrada`, `sin_primer_paso`, `no_administrador`, `administrador_no_activo`, `falta_segundo_factor`, `falta_registrar_factor`, `falta_registrar_factor_sin_autorizacion`, `bloqueada` |
| Acción | `hecha`, `rechazada`, `no_permitida`, `incierta` (V-7) |
| Rechazos | `credenciales_no_validas`, `codigo_no_valido`, `enlace_no_valido`, `contrasena_actual_no_valida`, `contrasena_no_admitida`, `falta_reverificar`, `ultimo_factor`, `minimo_administradores`, `no_puedes_confirmar_tu_propia_retirada`, `falta_restablecimiento_previo`, `ya_es_administrador`, `invitacion_pendiente`, `cuenta_de_cliente`, `baja_pendiente_en_servicio`, `verificacion_bloqueada`, `correo_no_valido`, `sin_bloqueo_activo`, `no_puedes_levantar_tu_propio_bloqueo` |
| `{campo, codigo}` | `correo`, `contrasena`, `contrasena_nueva`, `contrasena_repetida`, `codigo`, `codigo_recuperacion` / `obligatorio`, `formato`, `demasiado_corta`, `demasiado_larga`, `no_coinciden` |
| Entradas | Lista cerrada por acción, en `entradas.ts` (REQ-032, REQ-064) |
| Estados de la 020 | `administrador.` + `activo`, `invitacion_pendiente`, `invitacion_caducada`, `invitacion_anulada`, `baja`, `acceso_bloqueado`; `factor.registrado`, `factor.sin_registrar` |

- **Contraseña:** de 12 a 128 caracteres, comprobada contra una lista local de contraseñas comunes, sin llamadas externas; la fuente, en T-006.
- **Correo:** ASCII, 254 caracteres como máximo, en minúsculas.

## Datos

Migraciones repartidas entre la 010 y la 021 según el plan. RLS en la misma migración, sin texto libre (art. 1), escritura solo por funciones y `privado` sin acceso por la API.

| Tabla | Columnas |
| --- | --- |
| `public.administradores` (cambia) | `usuario_id` (sin cascada), `correo`, `estado` (`invitado`, `activo`, `baja`), `invitado_en`, `alta_en`, `baja_en`, `servicio_pendiente`. Sin `administradores_propio` |
| `public.invitaciones_administrador` | `id`, `usuario_id`, `tipo` (`alta`, `reactivacion`), `estado` (`pendiente`, `aceptada`, `anulada`), `creada_por`, `creada_en`, `caduca_en`, `resuelta_en`. Una sola pendiente |
| `public.factores_administrador` | `factor_id`, `usuario_id`, `registrado_en`, `retirado_en` |
| `privado.sesiones_administrador` | `sesion_id`, `usuario_id`, `metodo` (`codigo_aplicacion`, `codigo_recuperacion`), `factor_id`, `iniciada_en`, `completa_desde`, `completada_con_token_de`, `ultima_actividad_en`, `reverificada_en`, `cerrada_en`, `motivo_cierre`, `cierre_servicio_pendiente` |
| `privado.primeros_pasos` | `sesion_id`, `usuario_id`, `anotado_en`, `consumido_en` |
| `privado.cambios_esperados` | `usuario_id`, `tipo` (`cambio_contrasena`, `restablecimiento`, `factor`), `sesion_id`, `marca_conservada_id` (m-19; referencia a `dispositivos_reconocidos.id`, nunca copia de la huella, REQ-038), `factor_id`, `abierto_en`, `consumido_en` (M-13) |
| `privado.presentaciones_sesion` | `sesion_id`, `usuario_id`, `iat` y `amr` por `aal1`/`aal2` (m-23) |
| `privado.autorizaciones_registro_factor` | `usuario_id`, `origen` (`invitacion`, `retirada`), `abierta_en`, `caduca_en`, `sesion_id`, `consumida_en` |
| `privado.restablecimientos` | `usuario_id`, `solicitado_en`, `usado_en` |
| `privado.intentos_acceso`, `privado.bloqueos_acceso` | Huella o cuenta, `tipo` (`cuenta_primer_factor`, `origen_primer_factor`, `cuenta_segundo_factor`, `cuenta_restablecimiento`, `origen_restablecimiento`, `navegador_primer_factor`, `navegador_restablecimiento`), momento, `hasta`, `usuario_id`; en `intentos_acceso`, además, `estado` (`provisional`, `fallo`) y `reserva_id` (M-24; el acierto borra su reserva). Los `navegador_*` se ligan a la marca por su `id`, nunca por la huella (REQ-038), y los de `navegador_primer_factor` se guardan mientras viva la marca (M-22) |
| `privado.dispositivos_reconocidos` | `id` (UUID aleatorio), `huella` (única), `usuario_id`, `emitido_en`, `caduca_en`, `anulado_en`, `motivo_anulacion` (`renovacion`, `titular`, `otras_sesiones`, `contrasena`, `restablecimiento`, `codigo_recuperacion`, `factor`, `retirada`, `baja`, `cambio_directo`, `intentos`, `limite`) |
| `privado.codigos_recuperacion` (alternativa) | `huella`, `usuario_id`, `juego`, `creado_en`, `usado_en`, `anulado_en` |
| `public.auditoria` | Se pide `origen` (`persona`, `responsable_fuera_del_panel`, `sistema`), `fila_principal_id`, `accion` cerrada y los códigos de (a) a (d) («Auditoría») |

REQ-038: solo se guarda lo anterior; lo que guarda el servicio se declara en la fase 6.

### La regla de acceso

`privado.es_admin()` exige: (1) `activo`; (2) sesión propia y abierta; (3) menos de 24 h; (4) menos de 60 min de inactividad; (5) `iat` **estrictamente posterior** a `completada_con_token_de` (m-24); (6) `aal2` si el método es `codigo_aplicacion`. Un nulo es falso. `sesion_tocar()` anota actividad; `sesion_estado()` no. Nadie es a la vez adm. y `usuarios_cliente` (REQ-077). El mínimo de adm. (REQ-021, REQ-056) se protege con cerrojo, recuento y nueva comprobación (m-1).

### Funciones de operación con sesión completa

Usan la credencial del usuario y empiezan por `es_admin()`; si no, `no_permitida`. La auditoría va en la misma transacción (REQ-040, REQ-067). Excepción (m-23): `sesion_tocar`, `sesion_estado`, `sesion_cerrar` y `sesion_presentar` admiten 1F, pero sin devolver datos. Las que anulan marcas escriben además (d) vinculada («Auditoría»).

| Función | Fila |
| --- | --- |
| `admin_cerrar_otras_sesiones(marca, huella_nueva)` (conserva la marca propia y renueva su valor, m-54) | I-34 |
| `admin_olvidar_navegador(marca)` | (d) principal |
| `admin_bloqueos_activos()`, `admin_confirmar_servicio(usuario)` | — |
| `admin_levantar_bloqueo(usuario)` | (a) |
| `admin_preparar_invitacion(correo)` (`nueva`, `huerfana`, `reactivacion`) / `admin_registrar_invitacion(usuario)` | — / I-20 |
| `admin_anular_invitacion(invitacion)` | I-23 |
| `admin_dar_de_baja(usuario)` (cerrojo; `servicio_pendiente`) | I-24 |
| `admin_confirmar_retirada(usuario)` | I-30 |
| `admin_anunciar_factor()` (M-13) | — |
| `admin_reconocer_factor(factor, marca, huella_nueva)`, `admin_sustituir_factor(nuevo, anterior, marca, huella_nueva)`, `admin_retirar_factor(factor, marca, huella_nueva)` (renuevan el valor de la marca conservada, m-59) | I-25, I-26, I-27 (+I-28) |
| `admin_anunciar_cambio_contrasena(marca, huella_nueva)` (m-19; renueva el valor de la marca conservada, m-54) | I-35 |
| `admin_anotar_regeneracion_codigos` / `admin_regenerar_codigos` | I-29 |

- **Exposición:** la decide la 010 (su REQ-010), sin `anon` ni `PUBLIC` y con `search_path = pg_catalog, pg_temp` (D-035; m-32); PRUEBA-048 compara con la lista cerrada, que incluye las cuatro de sesión y comprueba que en 1F no devuelven datos (m-23).
- **Sin disparador genérico** (m-6).
- **Marcas:** cerrar todas las sesiones las anula todas; cerrar las demás conserva la propia, con valor nuevo (m-19, m-21, m-54), como los demás motivos de (e5), C-7 y C-8 incluidas (m-59). `marca` y `huella_nueva` son huellas de formato fijo que calcula el servidor; una `marca` de otra cuenta cuenta como sin marca (m-55, «Bloqueo provocado»).

### Cambios hechos directamente en el servicio (M-2, M-13)

Se propone un disparador (T-P2.13) que trabaja en la misma transacción:

| Cambio | Con anuncio | Sin anuncio |
| --- | --- | --- |
| Contraseña | Cierra las demás y conserva la marca anunciada; I-35 (I-36 si es restablecimiento) | Cierra todo; I-35 |
| Borrado de un factor reconocido | Del `factor_id` anunciado: nada | Lo retira y cierra todo; I-27. Si el registro ya lo da por retirado (baja, S-4), nada |
| Alta de factor | Se ata al primer `factor_id`; su verificación o cancelación no cierra nada | Al pasar a `verified`, o si es otro `factor_id` en la ventana: cierra todo y anula las marcas; (c) |
| Factor sin verificar que el registro no tiene | Nada; no consume | Nada (M-16) |
| Correo | — | Cierra todo; (c) |

- Solo actúa si cambia, de valor anterior a nuevo, la contraseña cifrada, el correo, el cambio de correo pendiente o el alta, estado o borrado de un factor (nombres de T-P2.13); nada más de la tabla de usuarios, que el servicio toca en cada inicio de sesión (M-13). Si el servicio recifra la contraseña al iniciar sesión, sería «contraseña sin anuncio»: se para y vuelve al arquitecto (m-35, A-13).
- Sin disparador: segundo factor si se puede (T-P2.14) y la fila después del cambio; lo demás vuelve al arquitecto (A-13).
- Si el cierre en el servicio falla, queda `cierre_servicio_pendiente` y se reintenta sin la clave secreta (T-018); si la necesitara, sería S-6: P1 no la cubre y se reabre el diseño (m-44).

### Matriz de acceso (CA-001, CA-004)

Leen solo los adm. activos con sesión completa. Cero filas y `no_permitida`: sin sesión, cliente, 1F (salvo las cuatro de sesión), token antiguo, `aal2` sin fila o de baja. Rol `acceso`: C-1 a C-10 y C-12. Clave secreta: S-1 a S-5. Propietario: las funciones del responsable.

### Migración y vuelta atrás

M-1 (tablas) a M-6 (disparadores), con su vuelta atrás en `plan.md`, «Entornos y despliegue». La de M-4 restaura la `es_admin()` de M07, que **reabre por `aal2`**: va con la de la app. PRUEBA-031, sin sitio (A-10).

## Flujo

En todos los flujos: `comprobarOrigen()`, lista cerrada y, si falla, sin acceso (REQ-039).

- **Responsable (M-7):** solo el propietario de la BD, con scripts interactivos que ningún agente lanza (art. 14) y acta (A-4). Primer adm. (REQ-022): solo si no hay ninguno sin baja (I-19); además, factor único (I-31) y bloqueos (b).
- **Invitar (M-8):** S-1 sin envío → `admin_registrar_invitacion` → envío. Si falla, S-5 o `huerfana`. La contraseña se fija después de C-5 (m-10).
- **Entrar:** C-1 `reservar` → servicio → C-12 (si rechaza, C-1 `fallo`) → C-2 → C-3 → C-4 (emite marca) o C-8 (no la emite; renueva la que haya, m-59); desde fuera, `sin_primer_paso` (B-1).
- **Contraseña:** cambio con C-1 → anuncio → disparador; restablecimiento con C-7 → disparador, sin tocar los factores (REQ-016, REQ-058).
- **Baja:** S-2 y S-4; si fallan, `servicio_pendiente` y `acceso_servicio_pendiente` (CA-014).
- **Fallos:** si falla el servicio o la BD, sin acceso; si falla la auditoría, se deshace; si la marca es dudosa, se ignora.

## Auditoría de esta función

La BD escribe cada fila en la misma transacción y sin datos personales; si no se puede escribir, la acción se deshace (REQ-040). Qué función escribe cada I-19 a I-38, en las tablas de las piezas. I-32 no se escribe (A-4). Cuatro entradas nuevas, que numera la 024 ((a) a (c) como I-42 a I-44, su A-1, abierta; (d), pedida en `propuestas.md`):
- (a) «Levantó el bloqueo de acceso de otro administrador».
- (b) «Levantó fuera del panel el bloqueo de acceso de un administrador».
- (c) «Se detectó un cambio de credenciales hecho fuera del panel». Aún no está en REQ-040 ni REQ-041 (A-4; T-005 a).
- (d) «Se anuló la marca de un navegador reconocido» (REQ-041, CA-017 10):
  - **Contenido:** solo la cuenta (`objeto_tipo` `administrador`, `objeto_id` = `usuario_id`), el momento y el motivo de `motivo_anulacion` («Datos»), como código `accion` por motivo (la 024 no admite columnas nuevas). Nunca valor, `huella`, `id` de la marca ni origen de red (la columna `origen` de la 024 es el tipo de actor); sí las columnas comunes de la 024 (actor, `origen`, `fila_principal_id`), como pide REQ-041.
  - **Cuándo:** la escribe, en su transacción, la función que pone `anulado_en`: una por transacción, cuenta y motivo, solo si anula alguna; no consta cuántos navegadores había (art. 1). La caducidad no escribe nada.
  - **Vinculada** a la fila de su causa, sin otra principal: `baja` → I-24; `factor` → I-25 a I-27; `codigo_recuperacion` → I-28; `retirada` → I-30 o I-31; `otras_sesiones` → I-34; `contrasena` → I-35; `restablecimiento` → I-36; `renovacion` y `limite` → la I-33 que emite la nueva; `cambio_directo` → la del disparador (I-27, I-35 o (c)).
  - **Principal** solo con `titular` (`admin_olvidar_navegador`; actor, el titular) e `intentos` (C-1 al 10.º fallo; origen `sistema`).

## Tareas previas, pruebas y cobertura

- **Tareas previas:** T-P1 (códigos), T-P2 (servicio), T-P3 (correo, V-111) y T-P4 (CSP, `proxy.ts`, H-1, V-1; confirma A-2): detalle en `plan.md`; son T-001 a T-004.
- **Pruebas:** PRUEBA-001 a PRUEBA-056 (sin 036 a 040), con tipo, contenido y CA → prueba, en `plan.md`, «Pruebas». Sin pgTAP (A-10) ni preproducción, nada pasa a VERIFICADA (art. 13).
- **Cobertura:** REQ-001 a REQ-083 y REQ-036a, por tarea, en `tareas.md`, «Cobertura».

## Amenazas de esta función

Pruebas: PRUEBA-NNN. **R**: riesgo residual.

| AM | Amenaza → control | Pruebas |
| --- | --- | --- |
| 01 | Solo contraseña → sesión completa (m-23) | 004, 006, 041 |
| 02 | Sin guardia → PRUEBA-003 | 003, 004, 042 |
| 03 | Sesión cerrada viva (H-4) → registro | 011, 014, 015, 017, 043 |
| 04 | API directa → **R aceptado** (A-3) | 001, 002, 006, 041, 043 |
| 05 | Factor ajeno (REQ-054) → autorización | 009 |
| 06 | Buzón (REQ-080) → retirada por otro (m-16) | 012, 016, 041 |
| 07 | Fuerza bruta → contador (M-12, m-8, m-12), también con peticiones a la vez: reserva y cerrojos (M-24) | 029 |
| 08a | Bloqueo por tercero desde un navegador sin marca (M-20) → marca del titular (08b), levantamiento y script; **R**, tratado por la marca (D-039) salvo si el tercero comparte el origen del titular (oficina, /64, CGNAT): entonces el titular no entra desde ese origen (m-57) | 029, 050 |
| 08b | Con marca (D-039; M-5, m-18, m-20) → contador propio acumulado desde la emisión (M-22), cupo por marca, la marca no es identidad ni factor y solo la emite C-4; **R** | 029, 044, 049, 054 |
| 09 | Enumeración → tiempo fijo (M-6) | 019, 044 |
| 10 | Clave secreta → `admin.ts` (M-7, M-10, m-13) | 005, 023, 045 |
| 11 | Canal con otro usuario → T-P2.12 | 023, 042 |
| 12 | Bajas cruzadas → cerrojo (m-1) | 018 |
| 13 | Alta por otra vía → propietario (M-7) | 008, 018, 045 |
| 14 | CSRF → origen (m-2) | 021, 022 |
| 15 | Incrustación → 002 | 020 |
| 16 | XSS → CSP sin demostrar (M-14); no cubre H-1 (AM-39) | 020, 033, 051, 055 |
| 17 | Robo de credencial → m-3, m-24 | 022 |
| 18 | Secretos en registros y evidencias → huellas (m-4, m-25), escáner ampliado (M-18, m-47; T-017); **sin comprobar** | 002, 005, 024, 032 |
| 19 | Fallo abierto → m-9, m-11 | 014, 026 |
| 20 | Sin rastro → transacción (m-6, m-10); anulación de marca, (d) | 027, 043, 047, 050, 056 |
| 21 | Pantalla abandonada → inactividad | 013, 014 |
| 22 | Inyección → art. 7 | Revisión |
| 23 | Agente en procedimientos → scripts | 018, 045 |
| 24 | Primer paso externo (B-1) → C-12 | 041 |
| 25 | `acceso` emite sesiones (M-1) → T-P2.12 | 042 |
| 26 | Cambios directos (M-2, M-13, M-16) → disparador por columnas y anuncio atado al primer `factor_id` | 043, 052 |
| 27 | Cuenta de envío (M-3, M-23) → dedicada, una por entorno y nunca la de producción fuera de producción, sin IMAP, POP, reenvíos ni delegaciones y sin copias del enlace; contraseña de aplicación fuera del gestor, acotada y rotada (A-14), que da acceso por todos los protocolos que la admiten (sin verificar); aviso de supervisión a los 90 días sin rotar; **R** hasta la vía preferente | 024, 032 |
| 28 | Agotar cupos (M-6) → sin llamadas | 044 |
| 29 | Fuerza bruta al reverificar (M-4) → m-22 | 029 |
| 30 | Estados a medias (M-8) → BD primero | 047 |
| 31 | Función experimental (M-11) → alternativa | 046 |
| 32 | Funciones `public` (m-5) → lista cerrada | 048 |
| 33 | Robo de marca (M-5) → cookie `HttpOnly` y `Strict` (M-21), 9 fallos en toda su vida (M-22), también a la vez (M-24), valor renovado en los cinco motivos de (e5) (m-54, m-59), solo marcas propias (m-55), m-17, m-19, m-21 | 010, 029, 049, 053 |
| 34 | Abuso del levantamiento → m-29; **R** | 045, 050 |
| 35 | `proxy.ts` crece o no se ejecuta (A-2, M-14) → lista cerrada, sobrescritura, `exigirValorPolitica()` | 003, 051 |
| 36 | Cupo de restablecimiento (m-18) → cupo por marca; **R** | 044 |
| 37 | Página sin CSP (M-14) → `exigirValorPolitica()`, también en `layout.tsx` (m-30); 404 de respaldo → `not-found.tsx` fijo (m-31) | 003, 051 |
| 38 | Cambios directos con la contraseña (m-20) → restablecer; **R** | 054 |
| 39 | Dirección reflejada (H-1, M-15) → la aplicación no la lee ni repite; **R**: lo que serializa Next, acciones incluidas (m-36), con su escapado o su tipo (M-17) | 003, 055 |
| 40 | «Sin acceso» distinguible o sin `lang` (V-1) → comodín, `not-found` único, «La guardia»; oráculo de rutas aceptado (M-15) | 003, 034 |

## Valores que fija este diseño

- **Plazos:** avisos 2 y 10 min; reserva de intento 30 s y espera de cerrojo 2 s (M-24); primer paso 10 min; cambio esperado 60 s (de factor, 5 min); reverificación 5 min; autorización 30 min; guardia 5 s; renovación con menos de 60 s; token 1 h.
- **Límites:** restablecimiento 3 por hora (cuenta o marca) y 5 por origen en 15 min, con o sin marca; 3 I-37 en 24 h; marca de 30 días, 5 como máximo y 10 fallos desde su emisión, sin ventana (M-22).
- **Conservación:** 24 h; fallos con marca, mientras viva la marca (30 días como máximo, M-22); sesiones y marcas, 30 días.
- **Rotación:** contraseña de aplicación de envío, cada 90 días y ante los hechos de A-14.
- **Formatos:** IPv6 /64; 128 bits o más; contraseña de 12 a 128; 10 códigos de 16; tiempo fijo de 1.000 y 1.500 ms.

## Comprobación de la constitución

| Art. | Resultado |
| --- | --- |
| 1, 2, 7, 12 | Cumplen; la fila (d) no lleva valor, huella, origen de red ni número de navegadores |
| 3 | **Depende de T-P2.12, T-P2.13 y T-P4; si fallan los dos primeros, BLOQUEANTE** (A-13). M-15 y M-16 dependen de PRUEBA-051, 052 y 055; M-24, de PRUEBA-029 (concurrencia) en CI, sin la cual los topes no están demostrados |
| 4 | Cumple con la excepción escrita del responsable (A-14, D-039; m-26), solo para la contraseña de aplicación de envío, una cuenta por entorno (M-23), con rotación, y que decae con la vía preferente («Configuración y secretos»). Sin verificar hasta T-P3 |
| 5 | La marca está en la especificación (D-039, tres vueltas y la enmienda mecánica de M-22 en REQ-024 a, REQ-051 y CA-017 1), **pendiente de aprobar**; las cabeceras de CA-019 (m-56, m-60), en CA-019 como enmienda mecánica pendiente de aprobar en T-005 (b) (su «Registro de cambios»). Falta que recoja A-1, A-4 (con (c) en REQ-040 y REQ-041), A-8, A-12 y la presentación de sesión de m-23 y m-24 en REQ-038 (T-005 a; `propuestas.md`) |
| 6 | El auditor dictaminó lo de D-039 (`dictamen-diseno-6.md`, 0 B) y confirmó su corrección (`dictamen-diseno-7.md`, 0 B, 1 M, 3 m); falta que confirme la de este. P1 por D-036, que no cubre lo de D-039 hasta esa confirmación (`plan.md`, «Puertas») |
| 8, 9 | No aplican |
| 10 | Pendiente de T-P4, T-P3 y PRUEBA-034 (`lang` y 404 iguales, V-1) |
| 11 | Cumple; M-4 no se revierte sola |
| 13 | Cumple: D-039 CONFIRMADA, con texto literal; V-107 y V-111, en VERIFICAR y sin usar; la excepción y la vía preferente, sin probar; AM-08a, residual, no eliminado, y sin tratar cuando el tercero comparte el origen (m-57) |
| 14 | Cumple: A-11, A-14 y A-15, del responsable (D-039; m-26, m-27); cuenta de envío, contraseña, rotación y scripts, de una persona; cambiar o ampliar la excepción vuelve al responsable |

## Dependencias nuevas

`@supabase/supabase-js` 2.119.0 (MIT; `registry.npmjs.org`, 13/11/2026). El controlador de Postgres lo decide la fase 2 (V-107). No se añaden `@supabase/ssr` ni librerías de validación (V-109).

## Alternativas descartadas

| Ámbito | Descartadas |
| --- | --- |
| Autorización y sesión | Autorizar con `aal` (H-4); tokens cortos; guardia en `proxy.ts` o `layout` (N-1); `@supabase/ssr`; funciones con 1F; sesión completa al registrar el factor; `SameSite=Lax` |
| Privilegios | R-B como primera opción; C-11 (M-1) |
| Bloqueos | Solo por origen; navegador por IP; desbloquear por correo; suspender la marca; igualar tiempos llamando al servicio (M-6); captcha |
| Atomicidad (M-24) | Contador de una fila (`update … where n < tope`): pierde la ventana de 15 min y las 3 I-37 en 24 h; `for update` sobre la cuenta: no hay fila para una cuenta inexistente (CA-019); aislamiento `serializable`: reintentos en el servidor y más estados de error |
| Auditoría de la marca | Una fila por marca anulada (revela cuántos navegadores hay); columna nueva de motivo en `auditoria` (la 024 no la admite) |
| Otras | `'unsafe-inline'`; cortafuegos; prueba en la ruta; 404 fijo del `proxy.ts` ante consulta (M-15) |

## Decisiones que requieren ADR

1. «El servicio de identidad verifica, el registro propio autoriza», que cambia `docs/ARQUITECTURA.md` y ADR-0003.
2. Ampliación de ADR-0003 para el rol `acceso`.
3. La excepción de `proxy.ts` (A-2), solo si T-P4 la confirma, con las condiciones de M-14 («Protección de la sesión») como parte del ADR.

## Asuntos decididos

- **A-1 a A-10 y A-12:** D-019 (14/11), en `aclaraciones.md`. **A-13:** D-036 (21/11): si fallan T-P2.12 o T-P2.13, **no se acepta el riesgo**; se para lo que dependa y vuelve al arquitecto (art. 3). No son respuestas del responsable, que puede revocarlas y es el único que puede aceptar ese riesgo.
- **A-11, A-14 y A-15:** respuestas del responsable (D-039, texto literal en `aclaraciones.md`, 21/11/2026): Google Workspace y excepción de A-14 («Configuración y secretos»); «Navegador reconocido (Recomendado)», que sustituye en ese punto a la cuestión 10 y trata AM-08a (M-20). Ninguna queda abierta.

## Lo que este diseño no ha podido comprobar

Ningún comportamiento real: tablas, disparadores y escrituras del servicio (B-1, M-1, M-2, M-16, m-35); CSP y región del `proxy.ts`; correo, V-107, V-111 y la vía preferente de A-14 (el gancho y la API de Gmail solo se leyeron en su documentación); `__Host-` en `localhost`; la marca y su cookie; IMAP, POP, reenvíos, delegaciones y rebotes en Google Workspace (M-23); la lista de contraseñas; `lang` del 404 dinámico (V-1); que `lock_timeout` corte la espera de `pg_advisory_xact_lock` y el comportamiento con varias conexiones (M-24, PRUEBA-029 en CI). Lo que serializa Next (M-15, M-17) lo leyó el auditor, no este diseño. No se ha ejecutado `comprobar-specs.mjs`.

## Respuesta al dictamen

Todo corregido en el texto, sin probar; ningún hallazgo rechazado. Reparto de la 1.ª a la 4.ª vuelta (cerrada por el auditor salvo m-43, de la coordinación), en el historial; de la 5.ª y de la revisión, en `tareas.md`. A medias: m-12 (T-006) y m-15 (fases 4 y 6). m-26 → A-14; m-27 → A-15; m-28 → A-1.

**Vueltas de D-039 (21/11/2026),** sin vuelta del auditor ni hallazgos nuevos:

| Origen | Apartado |
| --- | --- |
| A-11, A-14, A-15 y 1.ª vuelta de la enmienda | «Límite de intentos», «Bloqueo provocado», «Configuración», AM-08a, 08b y 27, «Valores», art. 4, 5, 10, 13 y 14, «Asuntos decididos» |
| Duda 6 de la enmienda (REQ-041: fila de cada anulación) | «Auditoría» (d), «Canal» (C-1, «si roban»), «Bloqueo provocado» (anulación), «Funciones de operación», «Datos», AM-20, «Alternativas», art. 1 y 5; `plan.md`, PRUEBA-056 |
| Duda 8 (C-8 no emite marca, REQ-024 i) | «Canal» (C-4, C-8), «Bloqueo provocado» (emisión), «Flujo», AM-08b; `plan.md`, PRUEBA-049 |
| Duda 7 ((c) en REQ-040 y REQ-041; m-23 y m-24 en REQ-038) | Sin cambio de diseño: la especificación aún no los recoge; siguen en `propuestas.md` y en el art. 5 |

**Revisión D-039 del `revisor` (21/11/2026),** con la decisión de la coordinación sobre MAYOR-1 (D-036); sin vuelta del auditor ni hallazgos nuevos:

| Hallazgo | Apartado |
| --- | --- |
| MAYOR-1 (umbral 10 frente al bloqueo por origen) | «Límite de intentos» (umbral, cupo por origen), «Bloqueo provocado» (qué cambia), «Valores» |
| MAYOR-2 y MAYOR-3 | `plan.md`, PRUEBA-049 y P1; `tareas.md`, T-011 (c) y T-013 |
| Menores: motivos `renovacion` y `limite`; huella en `cambios_esperados`; columnas comunes de (d); cupo del levantamiento; dos claves | «Bloqueo provocado» (emisión, anulación, levantamiento), «Datos», «Auditoría» (d) |
| Menor: alcance y supervisión de la contraseña de aplicación | «Configuración y secretos», AM-27 |
| Menor: tamaño (D-023) | Sin recorte en esta vuelta; sin medir (no hay terminal) |

**Dictamen de D-039 (`dictamen-diseno-6.md`, 21/11/2026),** con la decisión de la coordinación sobre M-22 (D-036); corregido en el texto, sin probar ni confirmar por el auditor, sin hallazgos nuevos:

| Hallazgo | Apartado |
| --- | --- |
| M-21 (atributos de la cookie) | «Bloqueo provocado» (cookie); AM-33; `plan.md`, PRUEBA-049; `tareas.md`, T-012 (d) |
| M-22 (contador de toda la vida de la marca) | `especificacion.md`, REQ-024 (a), REQ-051, CA-017 (1) y «Registro de cambios»; «Canal» (C-1), «Límite de intentos» (umbral), «Bloqueo provocado» (qué cambia), «Datos» (`intentos_acceso`), AM-08b y 33, «Valores»; `plan.md`, PRUEBA-029 |
| M-23 (cuenta de envío por entorno, IMAP y POP, copias del enlace) | «Configuración y secretos», AM-27, art. 4; `plan.md`, T-P3 (7) y (13), persona, PRUEBA-032; `tareas.md`, T-003, T-015 (b) |
| m-54 (valor nuevo al cambiar la contraseña o cerrar las demás) | «Bloqueo provocado» (anulación), «Funciones de operación»; `plan.md`, PRUEBA-053. Se renueva el valor de la misma fila en lugar de emitir otra con `renovacion`: emitir fuera de C-4 chocaría con REQ-024 (i) y (e5) («se conserva la del navegador»), que este diseño no puede cambiar; el valor anterior deja de valer igual |
| m-55 (solo marcas propias) | «Bloqueo provocado» (anulación), «Funciones de operación»; `plan.md`, PRUEBA-053 |
| m-56 (C-1 no toca la cookie; cabeceras) | «Canal» (C-1), «Bloqueo provocado» (cookie), «Respuestas que no revelan nada»; `plan.md`, PRUEBA-019. CA-019 no nombra las cabeceras: ampliarlo es enmienda de la especificación, que queda para la coordinación |
| m-57 (origen compartido) | «Bloqueo provocado» (riesgo residual), AM-08a, art. 13 |

**Confirmación del auditor (`dictamen-diseno-7.md`, 22/11/2026),** 0 B, 1 M y 3 m; corregido en el texto, sin probar ni confirmar por el auditor:

| Hallazgo | Apartado |
| --- | --- |
| M-24 (contadores no atómicos) | «Canal» (C-1 y C-3 con `fase`, C-12), «Límite de intentos» (atomicidad: cerrojos de transacción en orden cuenta, origen, marca; reserva `provisional`; resolución en C-1 `fallo` o C-12; reserva huérfana a los 30 s; C-3 y C-7), «Bloqueo provocado» (qué cambia), «Datos» (`estado`, `reserva_id`), AM-07 y 33, «Valores», art. 3, «Alternativas», «No ha podido comprobar»; `plan.md`, PRUEBA-029 (concurrencia en CI y en serie), rutas críticas; `tareas.md`, T-008 (a) y (c), T-019 nueva, T-016. Topes a la vez: 10 `seguir` con marca, no 9 como dice el dictamen, porque en serie también son 10 (9 fallos sin efecto y el 10.º, que la anula; REQ-024 a); si el auditor quiere 9, es cambio de la especificación |
| m-58 (usuario SMTP y remitente) | «Configuración y secretos» (excepción, alcance); `plan.md`, PRUEBA-032 (E); `tareas.md`, T-015 (b) |
| m-59 (renovación en los cinco motivos de e5) | «Canal» (C-8), «Bloqueo provocado» (cookie, anulación, solo marcas propias), «Funciones de operación» (firmas de factor, marcas), AM-33; `plan.md`, PRUEBA-053 y PRUEBA-049 (C-8 con marca previa); `tareas.md`, T-008 (c), T-012 (d), T-013, T-014 |
| m-60 (CA-019 sin tarea) | `especificacion.md`, CA-019 y «Registro de cambios» (enmienda mecánica pendiente de aprobar); «Respuestas que no revelan nada», art. 5; `tareas.md`, T-005 (b) |
| Sospechas (copia en Enviados; CalDAV y CardDAV) | «Configuración y secretos» (copias del enlace, alcance real); `plan.md`, T-P3 (7) y (13) |

**Revisión del `revisor` (22/11/2026):**

| Hallazgo | Apartado |
| --- | --- |
| MAYOR-1 (tope del caso 1 de concurrencia) | `plan.md`, PRUEBA-029, caso (1): precondición de CA-017 (1), cuenta de A ya bloqueada desde otro origen; 10 `seguir` con marca y 0 sin ella; el otro tope (10 + 5), dicho y descartado |
| MAYOR-2 (orden de T-008 a y T-019) | `plan.md`, bloques y PRUEBA-029 («Orden»); `tareas.md`, T-008 (cabecera, a y c) y T-019: (a) se integra con el guion sin ejecutar; rojo y CI, en T-019; (c) y el despliegue de la marca esperan a T-019 en verde (orquestador, D-036) |
| MENOR-1 (C-7 sin m-59 ni M-24) | «Canal», fila C-7 |
| MENOR-2 (caso 6 en T-008 a) | `tareas.md`, T-008 (a) casos (2) a (5) y (c) casos (1) y (6); `plan.md`, PRUEBA-029 («Orden») |
