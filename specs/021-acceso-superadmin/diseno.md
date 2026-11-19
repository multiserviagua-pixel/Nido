# 021 · Diseño

- **Autor:** `arquitecto`. Dictamen de `auditor-seguridad`: 1 B, 12 M y 16 m; en la 2.ª vuelta, 2 M y 13 m.
- **Fechas:** 13/11/2026; corregido el 14/11; condensado el 19/11 (D-023).
- **Estado:** especificación APROBADA (P0); P1 delegada (D-019). **El auditor no ha confirmado la 2.ª corrección y no se ha ejecutado ninguna prueba.**
- **Fuentes:** `evidencias/verificacion-identidad-y-correo.md`.
- **Siglas:** servicio = Supabase Auth (D-002); BD = base de datos; adm. = administrador; 1F = sesión de un solo factor.

## Resumen

- **Quién entra.** El servicio solo verifica credenciales; lo decide un **registro propio** en la BD. El servicio no corta al momento, no limita por cuenta y su API es pública.
- **Sesión completa, un solo camino (B-1):** C-1 → contraseña → C-12 → código en la misma sesión. Depende de T-P2.12 y T-P2.13 (o de A-13).
- **Regla:** `privado.es_admin()`. Cerrar la fila corta en la siguiente consulta (REQ-011, REQ-012).
- **Guardia** como primera instrucción, sin `layout` ni `proxy.ts`.
- **Accesos:** rol `acceso` para lo previo; en 1F, solo las cuatro funciones de sesión (m-23); la clave secreta, solo para S-1 a S-5.
- **Orden:** T-P1 a T-P4 primero. D-019 decidió A-1 a A-10 y A-12; quedan abiertos A-11, A-13, A-14 y A-15.

## Hechos verificados y lo que el diseño hace con cada uno

- **H-1:** el token lleva `aal`, que solo es segunda capa (ADR-0003).
- **H-2:** los códigos son experimentales; T-P1 y alternativa.
- **H-3:** la duración de sesión es solo de Pro; la impone el registro.
- **H-4:** no hay corte inmediato; se usa el registro.
- **H-5:** el límite es por origen; contador propio (V-113).
- **H-6:** Workspace sin probar (V-111).
- **H-7:** el veto no está documentado (T-P2).
- **H-8:** las notas para agentes son datos (art. 7).

## Supuestos y dependencias

Depende de:
- la 002: Next.js 16.4, `configuracion.ts`, `registro.ts`, `next.config.ts`, sin `proxy.ts`;
- la 010: migraciones;
- la 020: `Armazon`, `useAccion`, `leerResultadoAccion()`, `sin-acceso.ts`, `registrarFallo`, V-1 a V-7, PRUEBA-018;
- la 024 y la 040.

Faltan la preproducción (D-016) y un sitio para pgTAP. V-107, V-108 y V-113 están sin verificar.

**Orden:** app → T-P1 a T-P3 → migraciones → V-107 → T-P4 y ADR → A-13. El correo depende de A-11. Antes, el auditor.

## Piezas y responsabilidades

### Quién decide qué

El servicio dice si la credencial es válida. El registro, que solo escriben funciones de la BD, dice si el adm., el factor, la sesión y la invitación son válidos. La guardia y las políticas deciden si se atiende la petición. Ni el token, ni el navegador, ni el `layout`, ni las pantallas deciden.

### Mapa de archivos

(n) = no está en `docs/ESQUELETO.md`.

| Ruta | Contenido |
| --- | --- |
| `src/lib/supabase/` | `servidor.ts` (publicable, sin almacenamiento; lo usan de la 022 a la 024 y la 040), `admin.ts` (clave secreta; S-1 a S-5), `acceso.ts` (n) |
| `src/lib/acceso/` (n) | `guardia.ts` (+`leerEstadoAcceso()`), `lectura.ts`, `credencial.ts`, `navegador-reconocido.ts`, `origen.ts` (+`claveDeOrigen()`), `entradas.ts`, `intentos.ts`, `tiempo-fijo.ts`, `resultados.ts`, `operaciones/`, `politica.ts` (solo con `proxy.ts`) |
| `src/app/` | `acceso/acciones.ts`, `acceso/renovar/route.ts`; `admin/`: `layout.tsx`, `not-found.tsx`, `[...resto]/page.tsx`, `ajustes/administradores/`, `cuenta/` (n) |
| `src/components/acceso/` (n) | `AvisoCaducidad`, `CampoCodigo`, `CodigosRecuperacion`, `AltaFactor` |
| Otros | `supabase/migrations/`, `supabase/tests/`, `supabase/plantillas-correo/` (n); `scripts/acceso/` (n) con `primer-administrador.mjs`, `retirar-factor-unico.mjs`, `levantar-bloqueo.mjs` y `comprobar-configuracion.mjs`; `guia-responsable.md` (m-25, m-28); `tests/unit/acceso/`, `tests/e2e/acceso/` |
| Fase 1 | `next.config.ts`, `configuracion.ts`, `src/proxy.ts` (n, A-2) |

- **Agentes:** backend, frontend, bd, `plataforma` y `qa`.
- **Rutas críticas:**
  - `src/lib/acceso/`, `src/lib/supabase/` y `src/app/acceso/`;
  - las acciones de `admin`;
  - las migraciones y `scripts/acceso/`;
  - `next.config.ts` y `proxy.ts`;
  - las plantillas.

### La credencial de sesión

- **Cookies:** `__Host-nido-acceso` y `__Host-nido-renovacion`, con `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sin `Domain` ni caducidad.
  - Solo las escribe el servidor.
  - `navegador.ts` no se usa en `/acceso` ni en `/admin`.
  - La firma cambia por entorno (REQ-066).
- **Token nuevo tras C-4.** Su `iat` debe ser **estrictamente posterior** a `completada_con_token_de`, sin holgura (REQ-065, m-24). Si no lo es, se renueva una vez y, si sigue igual, se deniega.
- **Borrar las cookies** no borra la marca (m-17) y solo se hace si llegó alguna (m-2).
- **Renovación:** con menos de 60 s, en la acción o en `GET /acceso/renovar` (T-P2.9).
- **Sin `@supabase/ssr`.**

### La guardia

`exigirAdministrador()` en cada `page.tsx` de `src/app/admin/`; `exigirAdministradorEnAccion()` en cada acción, después de `comprobarOrigen()` (si falla, `no_permitida`); en `route.ts`, 404. Llama a `public.sesion_tocar()`: `completa` o `sin_acceso`. Las políticas comprueban otra vez `es_admin()` (REQ-003). Con `sin_acceso` (REQ-004), consulta el servicio y C-2:

| Situación | Destino |
| --- | --- |
| Sin credencial | `/acceso` (REQ-034) |
| Credencial no válida, `sesion_cerrada` o `sin_primer_paso` | Cierre y `/acceso` (REQ-002, REQ-011, REQ-012, REQ-024) |
| Primer paso vigente | `/acceso/segundo-factor` (CA-002) |
| Sin factor | `/acceso/registro-factor` (REQ-005) |
| No es adm. activo | `sin-acceso.ts` (V-1, REQ-050) |
| Fallo, más de 5 s o valor ajeno | `fallo_servidor` (REQ-039) |

Una excepción equivale a sin acceso. `leerDelArea()` vuelve a consultar `sesion_estado()` y, si falla, `sesion_no_valida` (m-11). Sin `Suspense` sobre la guardia. V-4: `no-store` y `pageshow` (REQ-013).

**PRUEBA-003** (estática, con trampas; M-9) falla si:
- hay una acción fuera de los `acciones.ts` o en `src/lib/`;
- un módulo sensible no es solo de servidor;
- la primera instrucción no es la guardia o `comprobarOrigen()`;
- se importa `admin.ts` o `acceso.ts` fuera de `operaciones/`;
- hay rutas paralelas, `template`, `loading`, un `not-found` anidado o `generateMetadata` (V-1);
- el `proxy.ts` no es el acotado o no empieza por `exigirValorPolitica()` (M-14).

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
- **`sesion_presentar()` (m-23, m-24):** guarda `aal`, `iat` y `amr` en `privado.presentaciones_sesion`, solo para adm. activos y sin retroceder. Si falla T-P2.12, C-12, C-4 y C-9 la exigen; el resto, A-13.
- **Privilegio (A-1):** R-A, el rol `acceso`, cuando se verifique V-107. R-B, la clave secreta, queda en reserva **sin activar**; activarla exige P1 (m-28).
- **Si roban `acceso`:** puede bloquear y escribir I-36, I-37 o I-38 falsas, pero no levantar bloqueos ni completar sesiones (T-P2.12, A-13).

### Operaciones con la clave secreta (REQ-036a)

| N.º | Operación | Antes, en la BD | Fila |
| --- | --- | --- | --- |
| S-1 | Crear sin enviar y enviar después; `inviteUserByEmail` solo si no hay otra (T-P2.5) | `admin_preparar_invitacion()` y `admin_registrar_invitacion` = `hecha` | I-20 |
| S-2 | Vetar (`updateUserById`, `ban_duration`) | Baja o anulación hechas | I-24 o I-23 |
| S-3 | Quitar el veto | **La BD primero**; sin `servicio_pendiente` | I-20 |
| S-4 | `mfa.deleteFactor` | Retirada auditada | I-24 o I-30 |
| S-5 | `deleteUser` para deshacer un alta | Rechazo en la misma operación | — (REQ-067) |

Solo afectan a la cuenta que da la BD, nunca a datos (REQ-035); lo vigila PRUEBA-005. **Una operación nueva necesita P1 y dictamen** (M-10). Ningún agente usa la clave (art. 14). **REQ-036(b), lectura (b') (A-1):** C-1 a C-8, C-10 y C-12 comprueban en la BD después de que el servicio valide; falta anotarlo en la especificación.

### Pantallas

- `/acceso`, compartida con la 040.
- `/acceso/segundo-factor`, sin «recordar» (REQ-007).
- `/acceso/registro-factor`, con autorización (REQ-006).
- `/acceso/invitacion`, `/acceso/enlace`, `/acceso/restablecer` y `/acceso/nueva-contrasena`.
- `/admin/ajustes/administradores`, con `DialogoConfirmacion`:
  - para invitar: «Se enviará un correo a esta dirección con un enlace válido 24 horas. No tendrá acceso hasta que ponga su contraseña y registre su segundo factor»;
  - para dar de baja: «Perderá el acceso de inmediato y se cerrarán sus sesiones. Su cuenta se conserva, desactivada, y seguirá apareciendo en la auditoría como "dado de baja"».
- `/admin/cuenta`.

Abrir un enlace no lo consume. Los campos permiten `autocomplete` y pegar (REQ-043). El QR va en un `img` `data:`. La prueba viaja en el fragmento y se borra con `history.replaceState` (REQ-037); la clave del factor es la excepción A-8.

### Segundo factor

Solo TOTP (CA-006). Un factor inscrito por fuera no se propone nunca. Si T-P2.3 falla, C-10 (REQ-026).

| Operación | Pasos |
| --- | --- |
| Primero | C-6 `anunciar` → servicio → C-6 `reconocer` → códigos → cierre |
| Verificar | C-3 → factor **del registro** → C-4 |
| Reverificar | C-3 → C-9 |
| Añadir | C-9 de menos de 5 min → `admin_anunciar_factor()` → `admin_reconocer_factor()` |
| Sustituir | `admin_sustituir_factor()`; una sola I-26 |
| Quitar | `admin_retirar_factor()`, solo si queda otro (REQ-009) |

### Códigos de recuperación

La función del servicio solo se usa si T-P1 cumple los 10 criterios:
1. se entregan una vez (REQ-072);
2. valen una vez, 20 de 20 (REQ-074, REQ-079);
3. regenerar invalida los anteriores (REQ-076);
4. la BD ve su uso (M-1);
5. se pueden invalidar (REQ-040, REQ-067);
6. la baja los invalida (REQ-083);
7. no se obtienen con 1F ni con un token cerrado;
8. no aparecen en los registros (REQ-073);
9. existen en el plan gratuito y en Pro;
10. tienen 64 bits o más.

Si falla alguno o hay duda, alternativa. Si se adopta, PRUEBA-046 en cada batería (M-11).

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
| Umbral | 5 fallos en 15 min (10 con marca) | 5 en 15 min |
| Efecto | 15 min, **sin llamar al servicio**; I-37; termina por tiempo o levantamiento | Bloquea la gestión y cierra la sesión (m-22); I-38; solo por tiempo |

- Dirección en ASCII y minúsculas; si no, `correo_no_valido` (m-8).
- IPv6 por /64; sin cabecera fiable, se deniega (M-12).
- Restablecimiento: 3 por cuenta y hora, 3 por marca, 5 por origen cada 15 min (m-18).
- Como mucho 5 llamadas al servicio por cuenta (M-6).
- No se guarda lo tecleado (REQ-041).
- Códigos: `acceso_fallo_primer_factor` y `acceso_fallo_segundo_factor`.
- Riesgo aceptado: AM-04 (A-3).

### Bloqueo provocado por un tercero (M-5, A-12)

Siempre se piden la contraseña y el código; la premisa de la cuestión 10 era falsa.

1. **Navegador reconocido.**
   - Cookie `__Host-nido-dispositivo` de 30 días y 256 bits, firmada con `ACCESO_HMAC_DISPOSITIVO` y guardada en `privado.dispositivos_reconocidos`.
   - La emite C-4 con TOTP y solo salta el bloqueo de su cuenta.
   - Se anula a los 10 fallos o con un cambio de credenciales; quien hace el cambio la conserva (m-19).
   - «Cerrar sesión y olvidar este navegador» (m-17).
   - Ante la duda, no hay marca.
2. **Otro adm.** con `public.admin_levantar_bloqueo(usuario)`.
   - No puede levantar el suyo (`no_puedes_levantar_tu_propio_bloqueo`); `sin_bloqueo_activo`.
   - Borra bloqueo, fallos y cupo (m-18); escribe (a) y `acceso_bloqueo_levantado` (m-29).
   - El bloqueo del segundo factor no se levanta.
3. **El responsable:** `levantar-bloqueo.mjs` y fila (b).

Afecta a REQ-024, CA-017, REQ-007, REQ-040 y REQ-041: **no se implementa hasta que esté en la especificación** (art. 5, A-15).

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
- **`proxy.ts` acotado (A-2):**
  - solo `/acceso` y `/admin`;
  - nonce de ≥128 bits en `x-nonce` y `Content-Security-Policy` (M-14);
  - no lee cookies ni cuerpo, no registra, no redirige, no importa `src/lib/` y no decide;
  - empieza por `exigirValorPolitica()`;
  - las directivas fijas siguen en `next.config.ts`.
- **Pendientes:** `arn1` (D-020) y CVE-2025-29927.
- **REQ-068:** `TextoDato`.

### Aviso de caducidad y formularios

`AvisoCaducidad` avisa 2 min antes (REQ-044) con `public.sesion_estado()` y ofrece «Seguir conectado» hasta las 24 h. Lo escrito se pierde (A-7).

### Configuración y secretos

Una persona pone en el gestor de cada entorno (art. 4):
- la clave secreta (`admin.ts`);
- la credencial `acceso`;
- `ACCESO_HMAC_CONTADOR`, `ACCESO_HMAC_CODIGOS` y `ACCESO_HMAC_DISPOSITIVO`, distintas entre sí. La última solo la lee `navegador-reconocido.ts` y no se rota durante un ataque (m-25).

La contraseña de aplicación de Workspace queda fuera del gestor (A-14, m-26). En el servicio: sin registro público, solo TOTP, enlaces de 24 h y plantillas propias; lo comprueba `comprobar-configuracion.mjs`, con un token que no es de solo lectura.

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

- **Contraseña:** de 12 a 128 caracteres, comprobada contra una lista local de contraseñas comunes **que aún hay que elegir** en el plan.
- **Correo:** ASCII, 254 caracteres como máximo, en minúsculas.

## Datos

Las migraciones son de la fase 2, repartidas entre la 010 y la 021 según el plan. RLS en la misma migración, sin texto libre (art. 1), escritura solo por funciones y `privado` sin acceso por la API.

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

`privado.es_admin()` exige seis condiciones:
1. `activo`;
2. sesión propia y abierta;
3. menos de 24 h;
4. menos de 60 min de inactividad;
5. `iat` **estrictamente posterior** a `completada_con_token_de` (m-24);
6. `aal2` si el método es `codigo_aplicacion`.

- Un valor nulo cuenta como falso.
- `sesion_tocar()` anota actividad; `sesion_estado()` no.
- Nadie es a la vez adm. y `usuarios_cliente` (REQ-077).
- El mínimo de adm. (REQ-021, REQ-056) se protege con cerrojo, recuento y una nueva comprobación (m-1).

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

- **Exposición:** la decide la 010 (su REQ-010), sin `anon` ni `PUBLIC` y con `search_path` vacío; PRUEBA-048 compara con la lista cerrada.
- **Sin disparador genérico** (m-6).
- **Marcas:** cerrar todas las sesiones las anula todas; cerrar las demás conserva la propia (m-19, m-21).

### Cambios hechos directamente en el servicio (M-2, M-13)

Se propone un disparador (T-P2.13) que trabaja en la misma transacción:

| Cambio | Con anuncio | Sin anuncio |
| --- | --- | --- |
| Contraseña | Cierra las demás; I-35 (I-36 si es restablecimiento) | Cierra todo; I-35 |
| Borrado de un factor reconocido | Nada | Lo retira y cierra todo; I-27 |
| Alta de factor | Fija `factor_id` | Cierra todo; (c) |
| Correo | — | Cierra todo; (c) |

- Solo mira las columnas que importan (PRUEBA-052).
- Sin disparador: segundo factor si se puede (T-P2.14), la fila después del cambio, y A-13.
- Si el cierre en el servicio falla, queda `cierre_servicio_pendiente` y se reintenta.

### Matriz de acceso (CA-001, CA-004)

- **Leen:** solo los adm. activos con sesión completa.
- **Cero filas y `no_permitida`:** sin sesión, cliente, 1F, token antiguo, `aal2` sin fila o de baja. En 1F solo funcionan las cuatro de sesión.
- **Rol `acceso`:** C-1 a C-10 y C-12.
- **Clave secreta:** S-1 a S-5.
- **Propietario:** las funciones del responsable.

### Migración y vuelta atrás

| Migración | Vuelta atrás |
| --- | --- |
| M-1, tablas | Se borran |
| M-2, `administradores` | Se restaura |
| M-3, funciones y rol | Se revocan |
| M-4, `es_admin()` | **Reabre por `aal2`**, así que va con la app |
| M-5, `auditoria` | No en producción |
| M-6, disparadores | Primero la salida |

PRUEBA-031, sin sitio (A-10).

## Flujo

En todos los flujos: `comprobarOrigen()`, lista cerrada y, si falla, sin acceso (REQ-039).

- **Responsable (M-7):** solo el propietario de la BD, con scripts interactivos que ningún agente lanza (art. 14) y acta (A-4). Primer adm. (REQ-022): solo si no hay ninguno sin baja (I-19); además, factor único (I-31) y bloqueos (b).
- **Invitar (M-8):** S-1 sin envío → `admin_registrar_invitacion` → envío. Si falla, S-5 o `huerfana`. La contraseña se fija después de C-5 (m-10).
- **Entrar:** C-1 → servicio → C-12 → C-2 → C-3 → C-4 o C-8; desde fuera, `sin_primer_paso` (B-1).
- **Contraseña:** cambio con C-1 → anuncio → disparador; restablecimiento con C-7 → disparador, sin tocar los factores (REQ-016, REQ-058).
- **Baja:** S-2 y S-4; si fallan, `servicio_pendiente` y `acceso_servicio_pendiente` (CA-014).
- **Fallos:** si falla el servicio o la BD, sin acceso; si falla la auditoría, se deshace; si la marca es dudosa, se ignora.

## Auditoría de esta función

La BD escribe cada fila en la misma transacción y sin datos personales. Qué función escribe cada I-19 a I-38 está en las tablas de las piezas. Hay tres entradas nuevas, que numerará la 024 (su inventario acaba en I-41):
- (a) «Levantó el bloqueo de acceso de otro administrador».
- (b) «Levantó fuera del panel el bloqueo de acceso de un administrador».
- (c) «Se detectó un cambio de credenciales hecho fuera del panel».

I-32 no se escribe (A-4).

## Tareas previas: lo que hay que comprobar antes de construir

- **T-P1:** los 10 criterios; si falla alguno, alternativa.
- **T-P2:** el servicio, punto a punto.
- **T-P3:** el correo (V-111); si falla, no hay correo.
- **T-P4:** P-1 y, si no basta, P-2 (M-14); confirma A-2.

**T-P2, 23 puntos**

| Puntos | Qué se comprueba |
| --- | --- |
| 1-4 | Cookies propias; `session_id` estable e `iat` posterior (m-24); doble aceptación del código; veto |
| 5-8 | Crear sin enviar (M-8); tipo de enlace; métodos S-1 a S-5; TOTP en SVG |
| 9-11 | `localhost`; salida limpia; token cerrado |
| 12-13 | **Leer las tablas del servicio** (B-1, M-1); **disparadores** (M-2, M-13) |
| 14-18 | `insufficient_aal` (M-10); factor con solo contraseña (m-20); invalidar códigos; IP (M-6); IP de salida |
| 19-23 | Registros; forma canónica; enlaces sin contraseña; marca de acción (M-9); cookie de 30 días |

**T-P3, 12 puntos:** región; adenda; dos pasos; contradicción; envío real; `accesos@humannaia.com`; sin copias (M-3); cuenta dedicada; avisos; fallos; suplantación; cuotas.

## Amenazas de esta función

Los números de la última columna son PRUEBA-NNN. **R** = riesgo residual.

| AM | Amenaza → control | Pruebas |
| --- | --- | --- |
| 01 | Solo contraseña → sesión completa (m-23) | 004, 006, 041 |
| 02 | Sin guardia → PRUEBA-003 | 003, 004, 042 |
| 03 | Sesión cerrada viva (H-4) → registro | 011, 014, 015, 017, 043 |
| 04 | API directa → **R aceptado** (A-3) | 001, 002, 006, 041, 043 |
| 05 | Factor ajeno (REQ-054) → autorización | 009 |
| 06 | Buzón (REQ-080) → retirada por otro (m-16) | 012, 016, 041 |
| 07 | Fuerza bruta → contador (M-12, m-8, m-12) | 029 |
| 08 | Bloqueo por tercero (M-5) → marca, levantamiento; **R** | 029, 044, 049, 050, 054 |
| 09 | Enumeración → tiempo fijo (M-6) | 019, 044 |
| 10 | Clave secreta → `admin.ts` (M-7, M-10, m-13) | 005, 023, 045 |
| 11 | Canal con otro usuario → T-P2.12 | 023, 042 |
| 12 | Bajas cruzadas → cerrojo (m-1) | 018 |
| 13 | Alta por otra vía → propietario (M-7) | 008, 018, 045 |
| 14 | CSRF → origen (m-2) | 021, 022 |
| 15 | Incrustación → 002 | 020 |
| 16 | XSS → CSP sin demostrar (M-14) | 020, 033, 051 |
| 17 | Robo de credencial → m-3, m-24 | 022 |
| 18 | Secretos en registros → huellas (m-4, m-25); **sin comprobar** | 002, 005, 024, 032 |
| 19 | Fallo abierto → m-9, m-11 | 014, 026 |
| 20 | Sin rastro → transacción (m-6, m-10) | 027, 043, 047, 050 |
| 21 | Pantalla abandonada → inactividad | 013, 014 |
| 22 | Inyección → art. 7 | Revisión |
| 23 | Agente en procedimientos → scripts | 018, 045 |
| 24 | Primer paso externo (B-1) → C-12 | 041 |
| 25 | `acceso` emite sesiones (M-1) → T-P2.12 | 042 |
| 26 | Cambios directos (M-2, M-13) → disparador | 043, 052 |
| 27 | Cuenta de envío (M-3) → dedicada; **R** | 032 |
| 28 | Agotar cupos (M-6) → sin llamadas | 044 |
| 29 | Fuerza bruta al reverificar (M-4) → m-22 | 029 |
| 30 | Estados a medias (M-8) → BD primero | 047 |
| 31 | Función experimental (M-11) → alternativa | 046 |
| 32 | Funciones `public` (m-5) → lista cerrada | 048 |
| 33 | Robo de marca (M-5) → m-17, m-19, m-21 | 010, 049, 053 |
| 34 | Abuso del levantamiento → m-29; **R** | 045, 050 |
| 35 | `proxy.ts` crece (A-2) → lista cerrada | 003, 051 |
| 36 | Cupo de restablecimiento (m-18) → cupo por marca; **R** | 044 |
| 37 | Página sin CSP (M-14) → `exigirValorPolitica()` | 003, 051 |
| 38 | Cambios directos con la contraseña (m-20) → restablecer; **R** | 054 |

## Pruebas

Las de BD (pgTAP) todavía no tienen sitio (A-10) y la preproducción no existe. Las ayudas solo funcionan en desarrollo. Tipos: E estática, U unitaria, N navegador, B BD, P persona, R servicio real.

| Bloque | Pruebas |
| --- | --- |
| Previas | PRUEBA-001 T-P1 (R); PRUEBA-002 T-P2 (R) |
| Guardia | PRUEBA-003 guardia (E); PRUEBA-004 entradas y perfiles (N); PRUEBA-005 clave secreta y HMAC (E, N); PRUEBA-006 matriz en 1F (B); PRUEBA-007 caso positivo (N); PRUEBA-008 cliente (B) |
| Factores | PRUEBA-009 primer factor (N, B); PRUEBA-010 código siempre; PRUEBA-011 factores; PRUEBA-012 recuperación; PRUEBA-013 duraciones (B, N); PRUEBA-014 credencial copiada; PRUEBA-015 tres sesiones; PRUEBA-016 restablecimiento; PRUEBA-017 alta y baja |
| Robustez | PRUEBA-018 mínimo, 100 intentos (B, P); PRUEBA-019 tiempos; PRUEBA-020 incrustación; PRUEBA-021 otro origen; PRUEBA-022 credencial; PRUEBA-023 usuario de otro; PRUEBA-024 valores marcados; PRUEBA-025 privacidad (revisión); PRUEBA-026 caídas; PRUEBA-027 una fila (B, N); PRUEBA-028 accesibilidad (N, P); PRUEBA-029 límites (N, B); PRUEBA-030 códigos; PRUEBA-031 vuelta atrás (B); PRUEBA-032 T-P3 (P); PRUEBA-033 T-P4 |
| Dictamen | PRUEBA-041 B-1; PRUEBA-042 M-1 (B); PRUEBA-043 M-2; PRUEBA-044 M-6 (N); PRUEBA-045 M-7 (B, U); PRUEBA-046 M-11 (R); PRUEBA-047 M-8; PRUEBA-048 m-5 (B); PRUEBA-049 marca; PRUEBA-050 levantamiento (B, N, P); PRUEBA-051 `proxy.ts` (N, E); PRUEBA-052 M-13; PRUEBA-053 m-17, m-19 y m-21; PRUEBA-054 m-20 |
| De la 020 | PRUEBA-034, PRUEBA-035 |

Si no se indica el tipo, es N, o N y B en los hallazgos del dictamen.

### Cada criterio, con su prueba y dónde se ejecuta

| Criterios | Pruebas |
| --- | --- |
| CA-001 / CA-002 / CA-003 | 006, 042, 048 (**aún no ejecutable**) / 004, 041 / 007 |
| CA-004 / CA-005 / CA-006 | 004, 008, 048 / 009 / 010, 041, 049 |
| CA-007 / CA-008 / CA-009 / CA-010 | 011, 052 / 012 / 013 / 014, 053 |
| CA-011 / CA-012 | 015, 043, 052, 053 / 016, 032, 041, 043 |
| CA-013 / CA-014 / CA-015 | 017, 032, 047 / 017 / 018, 045 (**aún no ejecutable**) |
| CA-016 / CA-017 | 018, 045, 050 (**aún no ejecutable**) / 029, 044, 049, 050, 053, 054 |
| CA-018 / CA-019 / CA-020 / CA-021 | 029 / 019, 044 / 020, 033, 051 / 021 |
| CA-022 / CA-023 / CA-024 / CA-025 | 022 / 022 / 023 / 005, 042, 045 |
| CA-026 / CA-027 / CA-028 / CA-029 | 024 / 025 / 026 / 027, 043, 047, 050, 052, 054 |
| CA-030 / CA-031 / CA-032 / CA-033 | 028 / 028 / 015, 030, 046 / 008, 017 |
| CA-034 / CA-035 | 015 / 017, 047 |

Sin pgTAP ni preproducción, nada puede pasar a VERIFICADA (art. 13).

## Valores que fija este diseño

Cada valor está explicado en su apartado.
- **Plazos:** avisos 2 y 10 min; primer paso 10 min; cambio esperado 60 s (de factor, 5 min); reverificación 5 min; autorización 30 min; guardia 5 s; renovación con menos de 60 s; token 1 h.
- **Límites:** restablecimiento 3 por hora y 5 por origen en 15 min; 3 I-37 en 24 h; marca de 30 días, 5 como máximo y 10 fallos.
- **Conservación:** 24 h; sesiones y marcas, 30 días.
- **Formatos:** IPv6 /64; 128 bits o más; contraseña de 12 a 128; 10 códigos de 16; tiempo fijo de 1.000 y 1.500 ms.

## Cobertura de requisitos

| Requisitos | Apartado |
| --- | --- |
| REQ-001 / REQ-002, REQ-007 | Registro / entrar |
| REQ-003, REQ-004, REQ-033, REQ-047, REQ-063 / REQ-034, REQ-048 | Guardia |
| REQ-005, REQ-006, REQ-054 | Autorización |
| REQ-008, REQ-009, REQ-015, REQ-057 | Segundo factor |
| REQ-010, REQ-080, REQ-081 | Pérdida |
| REQ-011, REQ-012, REQ-044 | Regla de acceso |
| REQ-013, REQ-014, REQ-078 | Cerrar sesión |
| REQ-016, REQ-058 | Restablecer |
| REQ-017, REQ-018, REQ-019, REQ-070, REQ-071 | Invitar |
| REQ-020, REQ-050, REQ-083 / REQ-021, REQ-056 | Baja / mínimo |
| REQ-022, REQ-023, REQ-049 | Primer adm. |
| REQ-024, REQ-025, REQ-026, REQ-051, REQ-052, REQ-053 | Límite |
| REQ-027, REQ-055 | Respuestas |
| REQ-028, REQ-029, REQ-030, REQ-031, REQ-059, REQ-060, REQ-065, REQ-066, REQ-068 | Protección |
| REQ-032, REQ-064 / REQ-038 | Contratos / datos |
| REQ-035, REQ-036 | Clave secreta y canal |
| REQ-037, REQ-069, REQ-073 | Fragmento |
| REQ-039, REQ-061, REQ-062 | Fallos |
| REQ-040, REQ-041, REQ-067 | Auditoría |
| REQ-042, REQ-043, REQ-045, REQ-046 | Pantallas |
| REQ-072, REQ-073, REQ-074, REQ-075, REQ-076, REQ-079 | Códigos |
| REQ-077, REQ-082 | Cuentas separadas |

## Comprobación de la constitución

| Art. | Resultado |
| --- | --- |
| 1, 2, 7, 12 | Cumplen |
| 3 | **Depende de T-P2.12 y T-P2.13; si fallan, BLOQUEANTE** (A-13) |
| 4 | **Pendiente de A-14** (m-26) |
| 5 | Falta que la especificación recoja A-1, A-4, A-8, A-12 y A-15 |
| 6 | Faltan el auditor y P1 |
| 8, 9 | No aplican |
| 10 | Pendiente de T-P4 y A-11 |
| 11 | Cumple; M-4 no se revierte sola |
| 13 | Cumple; la 1.ª versión no (B-1, M-5, m-23, m-27) |
| 14 | **Pendiente de A-14 y A-15** |

## Dependencias nuevas

`@supabase/supabase-js` 2.119.0 (MIT; `registry.npmjs.org`, 13/11/2026). El controlador de Postgres lo decide la fase 2 (V-107). No se añaden `@supabase/ssr` ni librerías de validación (V-109).

## Alternativas descartadas

| Ámbito | Descartadas |
| --- | --- |
| Autorización y sesión | Autorizar con `aal` (H-4); tokens cortos; guardia en `proxy.ts` o `layout` (N-1); `@supabase/ssr`; funciones con 1F; sesión completa al registrar el factor; `SameSite=Lax` |
| Privilegios | R-B como primera opción; C-11 (M-1) |
| Bloqueos | Solo por origen; reconocer el navegador por IP; desbloquear por correo; suspender la marca; igualar tiempos llamando al servicio (M-6); captcha |
| Otras | `'unsafe-inline'`; cortafuegos; prueba en la ruta |

## Decisiones que requieren ADR

1. «El servicio de identidad verifica, el registro propio autoriza», que cambia `docs/ARQUITECTURA.md` y ADR-0003.
2. Ampliación de ADR-0003 para el rol `acceso`.
3. La excepción de `proxy.ts` (A-2, M-14), solo si T-P4 la confirma.

## Qué se pide a otras fases y a coordinación

- **Fase 1:**
  - acciones y cookies;
  - CSP y cabecera de origen;
  - PRUEBA-043 y PRUEBA-046 en la batería;
  - `arn1` y preproducción;
  - en `registro.ts`, los códigos `acceso_` + `fallo_primer_factor`, `fallo_segundo_factor`, `registro_factor_rechazado`, `auditoria_pendiente`, `correo_no_enviado`, `servicio_no_disponible`, `servicio_pendiente`, `cierre_servicio_pendiente`, `cambio_fuera_del_panel`, `origen_no_disponible`, `navegador_anulado_por_intentos`, `bloqueo_levantado`, `bloqueos_repetidos` y `cupo_restablecimiento_agotado`.
- **Fase 2:** V-107, V-108, V-113, «Datos», pgTAP (A-10), la recomendación 9 (A-6) y los disparadores.
- **Especificador:** REQ-036, REQ-037, REQ-022, REQ-007 (A-15), REQ-024, CA-017, REQ-038, REQ-040 y REQ-041.
- **Otras funciones:** la 020, estados y textos (m-17); la 024, (a), (b) y (c); la 040, el umbral (A-5).
- **Fase 6:** plazos.
- **Coordinación:** `docs/SEGURIDAD.md`, `docs/TECNOLOGIAS.md` y `aclaraciones.md`.

## Asuntos decididos por delegación (D-019)

No son respuestas del responsable, que puede revisarlas.

| N.º | Decisión |
| --- | --- |
| A-1 | (b') con `acceso` si V-107; R-B inactiva (m-28) |
| A-2 | `proxy.ts` acotado si T-P4 lo confirma |
| A-3 | Riesgo del camino directo aceptado; se revisa en la fase 6 |
| A-4 | Inventario; (c); acta |
| A-5 | 5 por origen en `/acceso` |
| A-6 | Manda la 021 |
| A-7 | Lo escrito se pierde |
| A-8 | 3.ª excepción de REQ-037 |
| A-9 | Baja e invitación nueva |
| A-10 | PGlite provisional; CI o Docker antes de verificar |
| A-12 | Marca, levantamiento y responsable (M-5) |

## Asuntos abiertos para el responsable

| N.º | Asunto |
| --- | --- |
| A-11 | Correo, que decide una persona: dominio de `accesos@humannaia.com`, región, adenda y T-P3 (posible Amazon SES). No bloquea P1, pero sí la verificación de CA-012 y CA-013 |
| A-14 | Excepción al art. 4 (m-26): la contraseña de aplicación queda fuera del gestor. Opciones: (a) aceptarla, (b) buscar otra vía, (c) enmendar |
| A-15 | Enmienda de REQ-007 y CA-006 (m-27). Opciones: (a) aprobar, (b) rechazar, (c) otra redacción |
| A-13 | Solo si fallan T-P2.12 o T-P2.13: aceptarlo por escrito o volver al arquitecto |

## Lo que este diseño no ha podido comprobar

Ningún comportamiento real del servicio:
- sus tablas y disparadores (B-1, M-1, M-2);
- la CSP y la región del `proxy.ts`;
- el correo y V-107;
- `__Host-` en `localhost`;
- la marca y la lista de contraseñas.

Tampoco se ha ejecutado `comprobar-specs.mjs`.

## Respuesta al dictamen

Todo está corregido en el texto, pero sin probar; no se ha rechazado ningún hallazgo.

| Vuelta | Hallazgo → dónde se atiende |
| --- | --- |
| 1.ª | B-1 → AM-24; M-1 → AM-25 (T-P2.12); M-2 → AM-26 (T-P2.13); M-3 → AM-27 (A-11); M-4 → AM-29; M-5 → AM-08; M-6 → AM-28; M-7 → AM-13; M-8 → AM-30; M-9 → AM-02; M-10 → AM-10; M-11 → AM-31; M-12 → AM-07; m-1 a m-16 → amenazas y apartados. Quedan a medias m-12 (falta elegir la lista de contraseñas) y m-15 (los plazos los fija la fase 6 y el aviso a una persona depende de la fase 4) |
| 2.ª | M-13 → AM-26; M-14 → AM-37; m-17, m-19 y m-21 → AM-33; m-18 → AM-36; m-20 → AM-38; m-22 → AM-29; m-23 → AM-32; m-24 → AM-17; m-25 → AM-18; m-26 → A-14; m-27 → A-15; m-28 → A-1; m-29 → AM-34 |

## Condensación D-023

El 19/11/2026 se pasó de 275 KB a unos 39 KB sin cambiar ninguna decisión, valor, contrato ni identificador. Se quitaron explicaciones, ejemplos y repeticiones. El original completo está en el historial de trabajo y es el que vale si hay dudas.
