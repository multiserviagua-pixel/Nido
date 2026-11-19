# 021 · Dictamen de seguridad del diseño (segunda vuelta)

Autor: `auditor-seguridad` (solo lectura; guardado por el orquestador) · Fecha: 14/11/2026 · Sobre: `diseno.md` corregido, con las decisiones por delegación (D-019). Solo documentación: nada ejecutado salvo `comprobar-specs.mjs` (SUPERADO, documental). Lo marcado «sospecha» no está comprobado.

**Veredicto: 0 bloqueantes, 2 mayores (M-13, M-14) y 13 menores (m-17 a m-29).** Los 29 hallazgos de la primera vuelta están corregidos en el texto o condicionados a pruebas y decisiones identificadas. Puede ir a la puerta P1 con condiciones: M-13 se corrige en el diseño antes de planificar; M-14 se corrige en el diseño o es condición expresa del ADR de A-2 (requisito previo a que exista un `proxy.ts`). Siguen las condiciones del propio diseño: T-P2 (puntos 12 y 13, y A-13 si salen negativos), la enmienda de la especificación (REQ-007, 024, 038, 040, 041, CA-017) y A-11 (una persona).

Bien hecho: un único camino a la sesión completa (marca de primer paso de un solo uso, ligada a la sesión); la base de datos ya no se fía del servidor (`sesion_presentar` solo usa datos verificados del token); C-11 fuera del canal; funciones del responsable solo del propietario; la base de datos va antes de enviar un enlace o levantar un veto; navegador reconocido bien acotado (ninguna regla de acceso lo lee, se emite tras contraseña y código de la aplicación, ligado a la cuenta, firmado, contador propio a 10 fallos, cierra en fallo); el levantamiento es solo del primer paso, nadie levanta el suyo y deja auditoría.

## Estado de los hallazgos de la primera vuelta

| Hallazgo | Estado |
| --- | --- |
| B-1 | Corregido (el servidor solo pasa a C-12 la sesión que acaba de crear `signInWithPassword`; PRUEBA-041 adecuada) |
| M-1 | Corregido, condicionado a T-P2 punto 12 (`sesion_presentar` sólida; ver m-23) |
| M-2 | Corregido como propuesta; introduce la contradicción M-13 |
| M-3 | Corregido en lo que es del diseño; depende de A-11 (m-26) |
| M-4 | Corregido (m-22) |
| M-5 | Corregido con riesgo restante declarado (AM-08); lo nuevo: m-17 a m-20, m-29 |
| M-6 | Corregido; el nuevo límite de restablecimientos abre otra denegación (m-18) |
| M-7 | Corregido (PRUEBA-045) |
| M-8, M-9, M-11, M-12 | Corregidos |
| M-10 | Corregido (m-28: con P1 delegada la regla debe exigir dictamen) |
| m-1, m-2, m-4 a m-6, m-8 a m-11, m-13, m-14, m-16 | Corregidos |
| m-3 | Corregido; le falta la precisión de m-24 |
| m-7 | Corregido; la dirección en claro como parámetro depende de T-P2 punto 19 |
| m-12, m-15 | A medias; dependen del plan y de otras fases (aceptable) |

## Mayores

### M-13 · El disparador cierra todas las sesiones en cualquier alta de factor, también las del propio panel
- **Dónde:** «Cambios hechos directamente en el servicio» (filas «Alta de un factor… No se anuncian nunca»); `privado.cambios_esperados`, que sí tiene el tipo `factor`; «Segundo factor».
- **Incumple:** artículos 10 y 13 (coherencia interna). Afecta a AM-26, REQ-008, REQ-015.
- **Por qué:** el disparador no distingue un alta del servidor de una directa (misma llamada con el token del titular) y las altas nunca se anuncian. «Añadir otro» o «Sustituir» cierran todas las sesiones, incluida la que opera, y `admin_reconocer_factor` / `admin_sustituir_factor` devuelven `no_permitida`. Si el punto 12 permite borrar la sesión, también se rompe el registro del primer factor. Quien implemente lo «arreglará» eximiendo todas las altas y apagará la detección de altas directas.
- **Corrección mínima:** las funciones del panel y C-6 abren antes del alta un cambio esperado de tipo `factor`, ligado a la sesión y de un uso; el disparador cierra sesiones solo cuando no lo hay. El disparador actúa solo si cambian columnas que importan (contraseña cifrada, correo o cambio de correo pendiente, alta, estado o borrado de un factor), no en cualquier actualización de la tabla de usuarios (el servicio la toca en cada inicio de sesión).
- **Prueba:** añadir y sustituir un factor desde el panel conserva la sesión y deja una sola fila I-25/I-26; un alta directa con token válido cierra todas las sesiones; cien inicios de sesión seguidos no cierran ninguna sesión ajena.

### M-14 · Con el `proxy.ts` acotado, la política de contenido no cierra en fallo
- **Dónde:** «El `proxy.ts` acotado» (fila «Consecuencia»); PRUEBA-051. **Incumple:** artículo 3. Afecta a AM-16, AM-35.
- **Por qué:** el diseño quita la cabecera de `next.config.ts` en `/acceso` y `/admin`; si una petición llega sin pasar por `proxy.ts` (ruta que no casa, mayúsculas, barra final, codificación, clase CVE-2025-29927 con `x-middleware-subrequest`; **sospecha sin comprobar**), la página se sirve sin política y todo el código en línea se ejecuta. La falta de respaldo es cierta.
- **Corrección mínima:** las páginas de `/acceso` y `/admin` se niegan a generarse (error sin datos) si no llega un valor bien formado del `proxy.ts`; el `proxy.ts` sobrescribe (`set`) `x-nonce` y `Content-Security-Policy` de la petición, nunca usa las del cliente; `next.config.ts` mantiene para esas rutas una segunda cabecera con las directivas independientes del valor (`frame-ancestors`, `object-src`, `base-uri`, `form-action`); el ADR cubre también que la cabecera `Cookie` pasa por esa función aunque no la lea.
- **Prueba:** PRUEBA-051 ampliada con variantes de ruta, `x-middleware-subrequest`, una petición de datos y una de acción: o hay cabecera de política, o no hay contenido.

## Menores

- **m-17 · Art. 3 y 10 · Borrado de cookies.** «Borra las cookies» debe decir que se borran solo las dos de la credencial y nunca la marca; si no, la marca desaparece cada vez que caduca una sesión. En un ordenador compartido la marca sigue 30 días tras cerrar sesión y «Olvidar este navegador» exige sesión completa: ofrecerlo al cerrar sesión.
- **m-18 · Art. 10, AM-28 · Cupo de restablecimientos.** Un tercero puede agotar sin fin el cupo de 3 correos por cuenta y hora. Corrección: una solicitud desde un navegador reconocido de esa cuenta no cuenta en el cupo de la cuenta, o el levantamiento lo pone a cero; y un código de supervisión al agotarse.
- **m-19 · Art. 10 · Cambio de contraseña y marcas.** Cambiar la contraseña anula todas las marcas, también la de este navegador, aunque la sesión se conserve: queda expuesto al bloqueo provocado. Conservar la marca del navegador que hace el cambio, como `admin_cerrar_otras_sesiones`; y C-8 debe anular las marcas de los demás navegadores con la misma regla.
- **m-20 · AM-08, AM-26 · Quien sabe la contraseña.** Con solo la contraseña se puede iniciar sesión directo contra el servicio y, si lo admite (T-P2 punto 15), inscribir un factor o pedir cambio de correo; eso cierra todas las sesiones y anula todas las marcas, repetible, y luego bloquear la cuenta. Es cierre en fallo (la respuesta es restablecer la contraseña), pero hay que declararlo en AM-08 y probarlo.
- **m-21 · REQ-036(c) · Marca de otra cuenta.** C-4 anula «la que ese navegador traía» sin exigir que sea de la misma cuenta. Anularla solo si es de la misma cuenta.
- **m-22 · AM-29 · Fallos al volver a verificar.** No se dice que al quinto fallo se cierra la sesión completa; con una sesión robada quedarían 5 intentos cada 15 minutos durante 24 horas. Cerrarla.
- **m-23 · Coherencia, PRUEBA-048 · Funciones con un solo factor.** `sesion_tocar`, `sesion_estado`, `sesion_cerrar` y `sesion_presentar` se llaman con un solo factor: contradice el Resumen («ni filas ni funciones») y la matriz. Decirlo y meterlas en la lista cerrada de PRUEBA-048; `sesion_presentar` actualiza una sola fila por sesión.
- **m-24 · REQ-065, AM-17 · Condición 5 de la regla de acceso.** El momento de emisión del token va en segundos; cualquier holgura de T-P2 admite el token anterior emitido en el mismo segundo. C-4 guarda el momento de emisión del token de verificación y la regla exige uno estrictamente posterior, sin holgura.
- **m-25 · Art. 4, AM-18 · Secreto `ACCESO_HMAC_DISPOSITIVO`.** Prueba estática que limite su lectura a `navegador-reconocido.ts` (como PRUEBA-005 con la clave secreta); el valor de la marca y su huella entre los valores marcados de PRUEBA-024; la guía avisa de que rotarlo durante un ataque anula la medida 1.
- **m-26 · Art. 4 y 14 · Contraseña de aplicación.** El diseño la declara «excepción» al artículo 4; D-019 no delega secretos ni cambios de la constitución: la excepción debe aceptarla el responsable expresamente, dentro de A-11.
- **m-27 · Art. 5 y 13 · Enmienda de REQ-007.** REQ-007 dice «No hay dispositivo recordado» y la medida introduce un navegador reconocido; el riesgo original se presentó con una premisa falsa. Aprobar la enmienda por delegación entra en D-019, pero conviene presentársela expresamente al responsable, no solo anotarla.
- **m-28 · Coherencia.** Línea 110: la guía nombra dos procedimientos y son tres. Línea 242: «Los dos scripts… usan la clave secreta», pero `levantar-bloqueo.mjs` no. Línea 240: con P1 delegada, la regla de toda operación nueva con la clave secreta debe exigir también dictamen del auditor. Línea 1210: «el camino es (b)» puede leerse como automático (la línea 220 lo matiza).
- **m-29 · Art. 10 · Supervisión de bloqueos.** Código en la supervisión en cada levantamiento y cuando la misma cuenta acumula I-37 repetidas; los levantamientos no tienen límite de frecuencia: al menos que se vean.

## Valoración de lo nuevo

Saltar el segundo factor con la marca: no (ni la regla, ni C-3, ni C-8 la leen; PRUEBA-010 y 049). Fijar la marca: no útil (`__Host-`, solo la escribe el servidor tras C-4). Robarla: exige acceso al navegador y da 10 intentos una vez (AM-33). Anularla desde fuera: sin la contraseña no (`SameSite=Strict`, `comprobarOrigen()`); con ella sí (m-20). Escalada entre administradores: no (AM-34 correcto). Fugas: pendientes la dirección en claro hacia C-1 (T-P2 punto 19) y m-25. Función fuera del panel: solo propietario, terminal interactiva y acta firmada; correcto.

## Tabla de amenazas: cambios

AM-08: añadir m-18 y m-20. AM-16 y AM-35: «No» hasta corregir M-14. AM-26: añadir M-13. AM-33 y AM-34: bastan, con m-17, m-21, m-29. Nuevas: AM-36 (agotar el cupo de restablecimientos, m-18), AM-37 (página sin política porque el `proxy.ts` no se ejecutó, M-14), AM-38 (quien sabe la contraseña cierra sesiones y anula marcas con cambios directos, m-20).

## Artículos 1, 2, 3, 4, 7 y 14

1 cumple · 2 cumple · 3 pendiente de T-P2 y M-14 · 4 cumple salvo m-26 · 7 cumple · 14 cumple salvo m-26 y la presentación de m-27.

## Lo que se comprobó y lo que no

Ejecutado: `comprobar-specs.mjs` (SUPERADO, documental), `git diff` de `aclaraciones.md` y `propuestas.md`, lectura completa de `diseno.md` (1.312 líneas), de los REQ y CA afectados y de D-019 y D-020. No comprobado: ningún comportamiento real del servicio de identidad, de Next.js ni de Vercel; las vías por las que una petición no pasaría por `proxy.ts` son sospecha; no se consultó documentación externa.
