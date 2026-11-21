# 021 · Diseño

- **Autor:** `arquitecto`. Dictámenes del `auditor-seguridad` (`dictamen-diseno*.md`): 1.ª, 1 B, 12 M y 16 m; 2.ª, 2 M y 13 m; 3.ª, 2 M y 7 m; 4.ª, 3 M y 8 m; 5.ª, 1 M y 6 m.
- **Fechas:** 13/11/2026; corregido el 14/11; condensado el 19/11 (D-023); 21/11, 3.ª a 5.ª vuelta corregidas.
- **Estado:** especificación APROBADA (P0); P1 delegada (D-036). **El auditor no ha visto la corrección de la 5.ª vuelta; no se ha ejecutado ninguna prueba.**
- **Fuentes:** `evidencias/verificacion-identidad-y-correo.md`, `plan.md` y `tareas.md`.
- **Siglas:** servicio = Supabase Auth (D-002); BD = base de datos; adm. = administrador; 1F = sesión de un solo factor.

## Resumen

- **Quién entra:** lo decide un **registro propio** en la BD; el servicio solo verifica credenciales (no corta al momento, no limita por cuenta, API pública).
- **Sesión completa, un solo camino (B-1):** C-1 → contraseña → C-12 → código en la misma sesión. Depende de T-P2.12 y T-P2.13; si fallan, vuelve al arquitecto (A-13).
- **Regla:** `privado.es_admin()`. Cerrar la fila corta en la siguiente consulta (REQ-011, REQ-012).
- **Guardia** como primera instrucción; ni el `layout` ni el `proxy.ts` deciden; antes, solo `exigirValorPolitica()` si hay `proxy.ts`.
- **Accesos:** rol `acceso` para lo previo; en 1F, solo las cuatro funciones de sesión, que no devuelven datos (m-23); la clave secreta, solo para S-1 a S-5.
- **Orden:** T-P1 a T-P4 primero (`plan.md`). D-019 decidió A-1 a A-10 y A-12; D-036, A-13 (21/11/2026); abiertos y del responsable, A-11, A-14 y A-15.

**Hechos** (H-1 a H-8, en las fuentes): `aal` solo segunda capa; códigos experimentales (T-P1); duración solo en Pro y sin corte inmediato (registro); límite por origen (V-113); Workspace (V-111); veto (T-P2); notas = datos. H-1 y V-1 «de la 020» son otros.

## Supuestos y dependencias

Depende de la 002 (Next.js 16.4, sin `proxy.ts`), la 010 (M02 con cascada y M07 por `aal2`, que se cambian con migraciones nuevas), la 020 (componentes, `sin-acceso.ts`, `registrarFallo`, V-1 a V-7), la 024 (I-42 a I-44), la 040 y la 052 (encargados); detalle en `plan.md`, «Dependencias», y lo que se les pide, en `propuestas.md`. Faltan preproducción (D-016) y sitio para pgTAP; V-107, V-108 y V-113, sin verificar.

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
| C-1 | `acceso_intento_primer_factor` | Compara la dirección sin el secreto (m-7): `seguir` o `no_seguir`. 5.º fallo: bloqueo e I-37; con marca, contador propio que la anula al 10.º; con 3 I-37 en 24 h, `bloqueos_repetidos` (m-29) |
| C-2 | `acceso_estado` | Estado |
| C-3 | `acceso_intento_segundo_factor` | Exige el primer paso y cuenta códigos y reverificación (M-4). 5.º fallo: bloqueo, cierre (m-22) e I-38 |
| C-4 | `acceso_registrar_sesion` | Comprueba sesión y factor en el servicio. Crea la sesión (I-33), consume el primer paso, fija `completada_con_token_de` (m-24) y emite la marca; solo anula la anterior si es de la misma cuenta (m-21) |
| C-5 | `acceso_usar_enlace` | Invitación → `activo`, autorización, I-21 (+I-22); también retiradas |
| C-6 | `acceso_registrar_primer_factor(fase)` | `anunciar` (M-13) o `reconocer` (I-25). **No da sesión completa** |
| C-7 | `acceso_restablecimiento` | Cupos, también por marca (m-18); `cupo_agotado`; 30 min, un uso |
| C-8 | `acceso_usar_codigo_recuperacion` | Como C-4, pero cierra las demás y anula las otras marcas (m-19); I-33 + I-28 |
| C-9 | `acceso_anotar_reverificacion` | Reverificación |
| C-10 | `acceso_codigo_ya_aceptado` | Si lo pide T-P2.3, 120 s |
| C-12 | `acceso_anotar_primer_paso` | Tras la contraseña: 10 min, un uso. Se niega si hay bloqueo sin marca, si la sesión es ajena o si no hubo contraseña |

- **C-11 se suprime (M-1):** la retirada la autorizan `admin_confirmar_retirada` y el responsable.
- **`sesion_presentar()` (m-23, m-24):** guarda `aal`, `iat` y `amr` en `privado.presentaciones_sesion`, una sola fila por sesión que se actualiza, solo para adm. activos y sin retroceder. Si falla T-P2.12, C-12, C-4 y C-9 la exigen y el resto vuelve al arquitecto (A-13).
- **Privilegio (A-1):** R-A, el rol `acceso`, cuando se verifique V-107. R-B, la clave secreta, queda en reserva **sin activar**; activarla exige diseño propio, dictamen del auditor y P1 (m-28).
- **Si roban `acceso`:** puede bloquear y escribir I-36, I-37 o I-38 falsas, pero no levantar bloqueos ni completar sesiones (T-P2.12, A-13).

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
| Umbral | 5 fallos en 15 min (10 con marca, A-15) | 5 en 15 min |
| Efecto | 15 min, **sin llamar al servicio**; I-37; termina por tiempo o levantamiento | Bloquea la gestión y cierra la sesión (m-22); I-38; solo por tiempo |

- Dirección en ASCII y minúsculas; si no, `correo_no_valido` (m-8).
- IPv6 por /64; sin cabecera fiable, se deniega (M-12).
- Restablecimiento: 3 por cuenta y hora; una solicitud con marca válida de esa cuenta no cuenta ahí sino en el cupo de su marca, 3 por hora; 5 por origen cada 15 min; al agotarse, `acceso_cupo_restablecimiento_agotado` (m-18).
- Como mucho 5 llamadas al servicio por cuenta (M-6).
- No se guarda lo tecleado (REQ-041).
- Códigos: `acceso_fallo_primer_factor` y `acceso_fallo_segundo_factor`.
- Riesgo aceptado: AM-04 (A-3).

### Bloqueo provocado por un tercero (M-5, A-12)

Siempre se piden la contraseña y el código; la premisa de la cuestión 10 era falsa.

1. **Navegador reconocido.**
   - Cookie `__Host-nido-dispositivo` de 30 días y 256 bits, firmada con `ACCESO_HMAC_DISPOSITIVO` y guardada en `privado.dispositivos_reconocidos`; la emite C-4 con TOTP y solo salta el bloqueo de su cuenta.
   - Se anula a los 10 fallos o con un cambio de credenciales; el navegador que hace el cambio conserva la suya, y C-8 anula las de los demás con la misma regla (m-19). Ante la duda, no hay marca.
   - «Cerrar sesión y olvidar este navegador», ofrecido al cerrar sesión, con el aviso para ordenadores compartidos (m-17).
2. **Otro adm.** con `public.admin_levantar_bloqueo(usuario)`.
   - No puede levantar el suyo (`no_puedes_levantar_tu_propio_bloqueo`); `sin_bloqueo_activo`.
   - Borra bloqueo, fallos y cupo (m-18); escribe (a) y `acceso_bloqueo_levantado` (m-29).
   - El bloqueo del segundo factor no se levanta.
3. **El responsable:** `levantar-bloqueo.mjs` y fila (b).

Afecta a REQ-024, CA-017, REQ-007, CA-006, REQ-038, REQ-040 y REQ-041; contradice la respuesta del responsable a la cuestión 10 (5 fallos y 15 min; con marca, 10; m-33): A-15 es **suya y está abierta** (21/11/2026). Hasta que responda, la marca no entra en la especificación ni se implementa (art. 5).

**Sin marca (M-20)** solo quedan 2 y 3: quien conozca la dirección de un adm. repite 5 fallos cada 15 min y lo deja fuera de forma sostenida; con un solo adm., solo el script, y se vuelve a bloquear. Es **riesgo mayor** (AM-08a), no controlado, que solo el responsable puede aceptar por escrito (A-15).

### Respuestas que no revelan nada (REQ-027, CA-019)

| Momento | Código | Texto |
| --- | --- | --- |
| Entrar | `credenciales_no_validas` | «El correo o la contraseña no son correctos, o el acceso está bloqueado temporalmente. Si lo has intentado varias veces, espera 15 minutos» |
| Restablecer | `hecha` | «Si la dirección corresponde a una cuenta, recibirás un correo con un enlace válido 30 minutos» |
| Aceptar | `enlace_no_valido` | «Este enlace no es válido o ha caducado. Pide una invitación nueva» |

`responderEnTiempoFijo()` responde a los 1.000 ms (1.500 al aceptar). No se llama al servicio solo para igualar (M-6).

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

Una persona pone en el gestor de cada entorno (art. 4) la clave secreta (`admin.ts`), la credencial `acceso` y `ACCESO_HMAC_CONTADOR`, `ACCESO_HMAC_CODIGOS` y, solo tras A-15, `ACCESO_HMAC_DISPOSITIVO` (m-50), distintas entre sí; la última solo la lee `navegador-reconocido.ts` y no se rota durante un ataque (m-25). La contraseña de envío de Workspace, fuera del gestor: A-14 (m-26). En el servicio: sin registro público, solo TOTP, enlaces de 24 h y plantillas propias; lo comprueba `comprobar-configuracion.mjs` (su token no es de solo lectura).

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
| `privado.cambios_esperados` | `usuario_id`, `tipo` (`cambio_contrasena`, `restablecimiento`, `factor`), `sesion_id`, `huella_marca_conservada` (m-19), `factor_id`, `abierto_en`, `consumido_en` (M-13) |
| `privado.presentaciones_sesion` | `sesion_id`, `usuario_id`, `iat` y `amr` por `aal1`/`aal2` (m-23) |
| `privado.autorizaciones_registro_factor` | `usuario_id`, `origen` (`invitacion`, `retirada`), `abierta_en`, `caduca_en`, `sesion_id`, `consumida_en` |
| `privado.restablecimientos` | `usuario_id`, `solicitado_en`, `usado_en` |
| `privado.intentos_acceso`, `privado.bloqueos_acceso` | Huella o cuenta, `tipo` (`cuenta_primer_factor`, `origen_primer_factor`, `cuenta_segundo_factor`, `cuenta_restablecimiento`, `origen_restablecimiento`, `navegador_primer_factor`, `navegador_restablecimiento`), momento, `hasta`, `usuario_id` |
| `privado.dispositivos_reconocidos` | `huella`, `usuario_id`, `emitido_en`, `caduca_en`, `anulado_en`, `motivo_anulacion` (`renovacion`, `titular`, `otras_sesiones`, `contrasena`, `restablecimiento`, `codigo_recuperacion`, `factor`, `retirada`, `baja`, `cambio_directo`, `intentos`, `limite`) |
| `privado.codigos_recuperacion` (alternativa) | `huella`, `usuario_id`, `juego`, `creado_en`, `usado_en`, `anulado_en` |
| `public.auditoria` | Se pide `origen` (`persona`, `responsable_fuera_del_panel`, `sistema`), `fila_principal_id` y `accion` cerrada |

REQ-038: solo se guarda lo anterior; lo que guarda el servicio se declara en la fase 6.

### La regla de acceso

`privado.es_admin()` exige: (1) `activo`; (2) sesión propia y abierta; (3) menos de 24 h; (4) menos de 60 min de inactividad; (5) `iat` **estrictamente posterior** a `completada_con_token_de` (m-24); (6) `aal2` si el método es `codigo_aplicacion`. Un nulo es falso. `sesion_tocar()` anota actividad; `sesion_estado()` no. Nadie es a la vez adm. y `usuarios_cliente` (REQ-077). El mínimo de adm. (REQ-021, REQ-056) se protege con cerrojo, recuento y nueva comprobación (m-1).

### Funciones de operación con sesión completa

Usan la credencial del usuario y empiezan por `es_admin()`; si no, `no_permitida`. La auditoría va en la misma transacción (REQ-040, REQ-067). Excepción (m-23): `sesion_tocar`, `sesion_estado`, `sesion_cerrar` y `sesion_presentar` admiten 1F, pero sin devolver datos.

| Función | Fila |
| --- | --- |
| `admin_cerrar_otras_sesiones(marca)` (conserva la marca propia) | I-34 |
| `admin_olvidar_navegador(marca)`, `admin_bloqueos_activos()`, `admin_confirmar_servicio(usuario)` | — |
| `admin_levantar_bloqueo(usuario)` | (a) |
| `admin_preparar_invitacion(correo)` (`nueva`, `huerfana`, `reactivacion`) / `admin_registrar_invitacion(usuario)` | — / I-20 |
| `admin_anular_invitacion(invitacion)` | I-23 |
| `admin_dar_de_baja(usuario)` (cerrojo; `servicio_pendiente`) | I-24 |
| `admin_confirmar_retirada(usuario)` | I-30 |
| `admin_anunciar_factor()` (M-13) | — |
| `admin_reconocer_factor(factor)`, `admin_sustituir_factor(nuevo, anterior)`, `admin_retirar_factor(factor)` | I-25, I-26, I-27 (+I-28) |
| `admin_anunciar_cambio_contrasena(marca)` (m-19) | I-35 |
| `admin_anotar_regeneracion_codigos` / `admin_regenerar_codigos` | I-29 |

- **Exposición:** la decide la 010 (su REQ-010), sin `anon` ni `PUBLIC` y con `search_path = pg_catalog, pg_temp` (D-035; m-32); PRUEBA-048 compara con la lista cerrada, que incluye las cuatro de sesión y comprueba que en 1F no devuelven datos (m-23).
- **Sin disparador genérico** (m-6).
- **Marcas:** cerrar todas las sesiones las anula todas; cerrar las demás conserva la propia (m-19, m-21).

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
- **Entrar:** C-1 → servicio → C-12 → C-2 → C-3 → C-4 o C-8; desde fuera, `sin_primer_paso` (B-1).
- **Contraseña:** cambio con C-1 → anuncio → disparador; restablecimiento con C-7 → disparador, sin tocar los factores (REQ-016, REQ-058).
- **Baja:** S-2 y S-4; si fallan, `servicio_pendiente` y `acceso_servicio_pendiente` (CA-014).
- **Fallos:** si falla el servicio o la BD, sin acceso; si falla la auditoría, se deshace; si la marca es dudosa, se ignora.

## Auditoría de esta función

La BD escribe cada fila en la misma transacción y sin datos personales. Qué función escribe cada I-19 a I-38 está en las tablas de las piezas. Tres entradas nuevas; la 024 las propone como I-42 a I-44 (su A-1, abierta):
- (a) «Levantó el bloqueo de acceso de otro administrador».
- (b) «Levantó fuera del panel el bloqueo de acceso de un administrador».
- (c) «Se detectó un cambio de credenciales hecho fuera del panel».

I-32 no se escribe (A-4).

## Tareas previas, pruebas y cobertura

- **Tareas previas:** T-P1 (códigos), T-P2 (servicio), T-P3 (correo, V-111) y T-P4 (CSP, `proxy.ts`, H-1, V-1; confirma A-2): detalle en `plan.md`; son T-001 a T-004.
- **Pruebas:** PRUEBA-001 a PRUEBA-055 (sin 036 a 040), con tipo, contenido y CA → prueba, en `plan.md`, «Pruebas». Sin pgTAP (A-10) ni preproducción, nada pasa a VERIFICADA (art. 13).
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
| 07 | Fuerza bruta → contador (M-12, m-8, m-12) | 029 |
| 08a | Bloqueo por tercero, sin marca (M-20) → levantamiento y script; **R mayor**: bloqueo sostenido, pendiente de aceptación escrita (A-15) | 029, 050 |
| 08b | Con marca (A-15; M-5, m-18, m-20) → marca y cupo por marca; **R** | 029, 044, 049, 054 |
| 09 | Enumeración → tiempo fijo (M-6) | 019, 044 |
| 10 | Clave secreta → `admin.ts` (M-7, M-10, m-13) | 005, 023, 045 |
| 11 | Canal con otro usuario → T-P2.12 | 023, 042 |
| 12 | Bajas cruzadas → cerrojo (m-1) | 018 |
| 13 | Alta por otra vía → propietario (M-7) | 008, 018, 045 |
| 14 | CSRF → origen (m-2) | 021, 022 |
| 15 | Incrustación → 002 | 020 |
| 16 | XSS → CSP sin demostrar (M-14); no cubre H-1 (AM-39) | 020, 033, 051, 055 |
| 17 | Robo de credencial → m-3, m-24 | 022 |
| 18 | Secretos en registros y evidencias → huellas (m-4, m-25), escáner ampliado (M-18, m-47; T-017, `patrones-acceso.test.ts`); **sin comprobar** | 002, 005, 024, 032 |
| 19 | Fallo abierto → m-9, m-11 | 014, 026 |
| 20 | Sin rastro → transacción (m-6, m-10) | 027, 043, 047, 050 |
| 21 | Pantalla abandonada → inactividad | 013, 014 |
| 22 | Inyección → art. 7 | Revisión |
| 23 | Agente en procedimientos → scripts | 018, 045 |
| 24 | Primer paso externo (B-1) → C-12 | 041 |
| 25 | `acceso` emite sesiones (M-1) → T-P2.12 | 042 |
| 26 | Cambios directos (M-2, M-13, M-16) → disparador por columnas y anuncio atado al primer `factor_id` | 043, 052 |
| 27 | Cuenta de envío (M-3) → dedicada; **R** | 032 |
| 28 | Agotar cupos (M-6) → sin llamadas | 044 |
| 29 | Fuerza bruta al reverificar (M-4) → m-22 | 029 |
| 30 | Estados a medias (M-8) → BD primero | 047 |
| 31 | Función experimental (M-11) → alternativa | 046 |
| 32 | Funciones `public` (m-5) → lista cerrada | 048 |
| 33 | Robo de marca (M-5) → m-17, m-19, m-21 | 010, 049, 053 |
| 34 | Abuso del levantamiento → m-29; **R** | 045, 050 |
| 35 | `proxy.ts` crece o no se ejecuta (A-2, M-14) → lista cerrada, sobrescritura, `exigirValorPolitica()` | 003, 051 |
| 36 | Cupo de restablecimiento (m-18) → cupo por marca; **R** | 044 |
| 37 | Página sin CSP (M-14) → `exigirValorPolitica()`, también en `layout.tsx` (m-30); 404 de respaldo → `not-found.tsx` fijo (m-31) | 003, 051 |
| 38 | Cambios directos con la contraseña (m-20) → restablecer; **R** | 054 |
| 39 | Dirección reflejada (H-1, M-15) → la aplicación no la lee ni repite; **R**: lo que serializa Next, acciones incluidas (m-36), con su escapado o su tipo (M-17) | 003, 055 |
| 40 | «Sin acceso» distinguible o sin `lang` (V-1) → comodín, `not-found` único, «La guardia»; oráculo de rutas aceptado (M-15) | 003, 034 |

## Valores que fija este diseño

- **Plazos:** avisos 2 y 10 min; primer paso 10 min; cambio esperado 60 s (de factor, 5 min); reverificación 5 min; autorización 30 min; guardia 5 s; renovación con menos de 60 s; token 1 h.
- **Límites:** restablecimiento 3 por hora (cuenta o marca) y 5 por origen en 15 min; 3 I-37 en 24 h; marca de 30 días, 5 como máximo y 10 fallos.
- **Conservación:** 24 h; sesiones y marcas, 30 días.
- **Formatos:** IPv6 /64; 128 bits o más; contraseña de 12 a 128; 10 códigos de 16; tiempo fijo de 1.000 y 1.500 ms.

## Comprobación de la constitución

| Art. | Resultado |
| --- | --- |
| 1, 2, 7, 12 | Cumplen |
| 3 | **Depende de T-P2.12, T-P2.13 y T-P4; si fallan los dos primeros, BLOQUEANTE** (A-13). M-15 y M-16, en el texto; dependen de PRUEBA-051, 052 y 055 |
| 4 | **Pendiente de A-14** (m-26) |
| 5 | Falta que la especificación recoja A-1, A-4, A-8 y A-12; A-15, abierta |
| 6 | Falta que el auditor vea la corrección de la 5.ª vuelta; P1 por D-036 |
| 8, 9 | No aplican |
| 10 | Pendiente de T-P4, A-11 y PRUEBA-034 (`lang` y 404 iguales, V-1) |
| 11 | Cumple; M-4 no se revierte sola |
| 13 | Cumple; antes no (B-1, M-5, m-23, m-27; PRUEBA-055 pedía lo imposible, M-15 y M-17; servicio real, M-19; riesgo sin marca no declarado, M-20) |
| 14 | **Pendiente de A-14 y A-15**, del responsable (m-26, m-27) |

## Dependencias nuevas

`@supabase/supabase-js` 2.119.0 (MIT; `registry.npmjs.org`, 13/11/2026). El controlador de Postgres lo decide la fase 2 (V-107). No se añaden `@supabase/ssr` ni librerías de validación (V-109).

## Alternativas descartadas

| Ámbito | Descartadas |
| --- | --- |
| Autorización y sesión | Autorizar con `aal` (H-4); tokens cortos; guardia en `proxy.ts` o `layout` (N-1); `@supabase/ssr`; funciones con 1F; sesión completa al registrar el factor; `SameSite=Lax` |
| Privilegios | R-B como primera opción; C-11 (M-1) |
| Bloqueos | Solo por origen; navegador por IP; desbloquear por correo; suspender la marca; igualar tiempos llamando al servicio (M-6); captcha |
| Otras | `'unsafe-inline'`; cortafuegos; prueba en la ruta; 404 fijo del `proxy.ts` ante consulta (M-15) |

## Decisiones que requieren ADR

1. «El servicio de identidad verifica, el registro propio autoriza», que cambia `docs/ARQUITECTURA.md` y ADR-0003.
2. Ampliación de ADR-0003 para el rol `acceso`.
3. La excepción de `proxy.ts` (A-2), solo si T-P4 la confirma, con las condiciones de M-14 («Protección de la sesión») como parte del ADR.

## Asuntos decididos por delegación (D-019 y D-036)

No son respuestas del responsable, que puede revisarlas o revocarlas.

| N.º | Decisión |
| --- | --- |
| A-1 a A-10, A-12 | Por D-019 (14/11): `aclaraciones.md` y los apartados que las citan |
| A-13 | D-036, 21/11/2026: si fallan T-P2.12 o T-P2.13, **no se acepta el riesgo**; se para lo que dependa de ellos y vuelve al arquitecto (art. 3). Aceptarlo sigue siendo del responsable |

## Asuntos abiertos para el responsable

Reservados a una persona (cuentas, secretos, o contrarios a una respuesta suya): no se deciden por delegación.

| N.º | Asunto |
| --- | --- |
| A-11 | Correo, que decide una persona: dominio de `accesos@humannaia.com`, región, adenda y T-P3 (posible Amazon SES). Bloquea T-P3, el envío real y la verificación de CA-012 y CA-013 |
| A-14 | Excepción al art. 4 (m-26): la contraseña de aplicación queda fuera del gestor. Opciones: (a) aceptarla, (b) buscar otra vía, (c) enmendar. Bloquea el envío de correo y el cierre de los art. 4 y 14 |
| A-15 | Marca (REQ-007, CA-006) y su umbral de REQ-024 y CA-017, contrario a su respuesta a la cuestión 10 (m-27, m-33; 21/11/2026). Bloquea la marca y el cierre del art. 14 en T-016 (`plan.md`, «Lo que bloquea»). Si no responde o la rechaza: sin marca y AM-08a, riesgo mayor hasta su aceptación escrita (M-20); si la rechaza, el bloqueo por un tercero vuelve al arquitecto |

## Lo que este diseño no ha podido comprobar

Ningún comportamiento real: tablas, disparadores y escrituras del servicio (B-1, M-1, M-2, M-16, m-35); CSP y región del `proxy.ts`; correo y V-107; `__Host-` en `localhost`; la marca; la lista de contraseñas; `lang` del 404 dinámico (V-1). Lo que serializa Next (M-15, M-17) lo leyó el auditor, no este diseño. No se ha ejecutado `comprobar-specs.mjs`.

## Respuesta al dictamen

Todo corregido en el texto, sin probar; ningún hallazgo rechazado. 1.ª y 2.ª vuelta: cada hallazgo, en su apartado y su fila AM (tabla en el historial). A medias: m-12 (T-006) y m-15 (fases 4 y 6). m-26 → A-14; m-27 → A-15; m-28 → A-1.

**3.ª vuelta:** M-15, m-36 → «La guardia», AM-39, AM-40; M-16, m-35 → «Segundo factor», «Cambios hechos directamente», AM-26; m-30, m-31 → «La guardia», «Protección», AM-37; m-32 → «Funciones de operación»; m-33 → «Bloqueo provocado», A-15; m-34 → `aclaraciones.md`.

**4.ª vuelta:** M-17 → «La guardia», AM-39; M-18 → AM-18; m-37 → «Segundo factor»; m-39 → «Operaciones con la clave secreta»; m-44 → «Cambios hechos directamente»; M-19, m-38, m-40 a m-42, fuera del diseño; m-43, de la coordinación.

**5.ª vuelta:** M-20 → «Bloqueo provocado», AM-08, A-15, art. 13; m-47 → AM-18; m-50 → «Configuración»; menor 7 de la revisión → «Cambios hechos directamente»; m-45, m-46, m-48 y m-49, fuera del diseño.

Tabla de la 5.ª, en `tareas.md`; lo anterior a la condensación (D-023), en el historial.
