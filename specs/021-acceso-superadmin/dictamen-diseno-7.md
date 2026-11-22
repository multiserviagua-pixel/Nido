# 021 · Dictamen de seguridad (7.ª vuelta: confirmación de la corrección de `dictamen-diseno-6.md`)

Autor: `auditor-seguridad` (solo lectura) · 22/11/2026. Guardado por el orquestador, que transcribe el texto del auditor. Sobre `diseno.md`, `especificacion.md`, `plan.md` y `tareas.md` en `e1c0014`, D-039 y D-040 de `docs/TECNOLOGIAS.md` y la constitución 1.5. Ejecutado: `node scripts/comprobar-specs.mjs`, SUPERADO (solo documental). Nada ejecutado contra el servicio, Next ni Postgres.

**Veredicto: APTO CON CONDICIONES. 0 bloqueantes, 1 mayor (M-24) y 3 menores (m-58 a m-60).** Los siete hallazgos de la 6.ª vuelta quedan cerrados en el texto. m-56 queda cerrado en el diseño y en la prueba, y abierto en la especificación (m-60).

## Hallazgos de `dictamen-diseno-6.md`

| Hallazgo | Estado | Dónde |
| --- | --- | --- |
| M-21 (atributos de la cookie) | **Cerrado** | `diseno.md` «Bloqueo provocado» 1: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sin `Domain`, `Max-Age` de 30 días, solo la escribe y la borra el servidor. T-012 (d). PRUEBA-049 |
| M-22 (contador de toda la vida) | **Cerrado** | REQ-024 (a), REQ-051 y CA-017 (1). PRUEBA-029 (acumulado). Condicionado a M-24 |
| M-23 (cuenta y contraseña de envío) | **Cerrado** | «Correo de acceso» y «Excepción al art. 4». T-P3 (7) y (13), T-003, T-015 (b), PRUEBA-032 (P y E). Mejora en m-58 |
| m-54 (valor nuevo de la marca) | **Cerrado** para cambio de contraseña y cierre de las demás sesiones (PRUEBA-053). Ampliación en m-59 |
| m-55 (solo marcas propias) | **Cerrado** | T-008 (c); PRUEBA-053 |
| m-56 (C-1 no toca la cookie; cabeceras iguales) | **Cerrado en diseño y PRUEBA-019; abierto en la especificación** | m-60 |
| m-57 (origen compartido) | **Cerrado** | AM-08a, artículo 13 y P7 |

## Hallazgos nuevos

### M-24 · MAYOR · Los contadores de fallos no son atómicos ante peticiones en paralelo

- **Dónde:** `diseno.md`, «El canal de acceso» (C-1 y C-12), «Límite de intentos y bloqueo» y «Bloqueo provocado por un tercero» 1 («Qué cambia»). No hay cerrojo, `for update`, cerrojo consultivo ni contador de una sola fila para `privado.intentos_acceso` y `privado.bloqueos_acceso`.
- **Amenaza y artículo:** SEGURIDAD A-11; art. 3; REQ-024 (a) y (b), REQ-051, CA-017 (1).
- **Explotación:** C-1 decide `seguir` o `no_seguir` antes de que el servicio valide la contraseña y el fallo se anota después. Con N peticiones simultáneas todas leen el mismo recuento y siguen. Con la marca robada, 200 intentos a la vez prueban 200 contraseñas, no 9. Lo mismo sin marca con los 5 fallos por cuenta y por origen y con el tope de 5 llamadas al servicio (M-6). El tiempo fijo de 1.000 ms no lo impide. PRUEBA-029, secuencial, no lo detecta.
- **Corrección mínima:** en C-1 el intento se reserva (fallo provisional) en la misma transacción que la decisión, con la clave serializada (`pg_advisory_xact_lock` sobre la clave HMAC de cuenta, origen e `id` de la marca, o contador de una fila: `update … set n = n + 1 where n < tope returning`). La reserva pasa a acierto solo en C-12, que vuelve a comprobar con la misma regla. Orden fijo de cerrojos (cuenta, origen, marca).
- **Prueba:** PRUEBA-029 nueva (B, CI con varias conexiones, `bd.yml`). 50 llamadas simultáneas a C-1 con la misma marca válida y contraseña errónea: como mucho 9 `seguir` y la marca anulada. 50 simultáneas sin marca a la misma cuenta: como mucho 5 `seguir`. PGlite usa una sola conexión y no sirve.

### m-58 · MENOR · PRUEBA-032 (E) solo mira el remitente

- **Dónde:** `plan.md`, PRUEBA-032 (E); `tareas.md`, T-015 (b). Art. 4 y 3.
- **Explotación:** la contraseña de aplicación va unida al usuario SMTP, no al remitente. Usuario de producción con otro remitente pasa la comprobación; si la API no devuelve el campo no está dicho qué ocurre.
- **Corrección:** `comprobar-configuracion.mjs`, fuera de producción, falla si el usuario SMTP o el remitente es la cuenta de producción, y si alguno falta. Prueba: tres respuestas simuladas (usuario, remitente, campo ausente), las tres en rojo.

### m-59 · MENOR · El valor de la marca solo se renueva en dos de los cambios que la conservan

- **Dónde:** `diseno.md`, «Bloqueo provocado» 1, «Anulación (REQ-024 e1 a e6)» y «Renovación del valor (m-54)». Art. 3.
- **Explotación:** al restablecer la contraseña, cambiar el factor o entrar con código de recuperación (C-8), la marca del navegador que actúa conserva su valor; la copia sigue valiendo. Impacto bajo (la marca no es factor).
- **Corrección:** aplicar la renovación de m-54 a todos los motivos de (e5) que conservan marca (`restablecimiento`, `factor`, `codigo_recuperacion`, además de los dos actuales). PRUEBA-053 ampliada.

### m-60 · MENOR · Las cabeceras de CA-019 (m-56) no tienen tarea

- **Dónde:** `especificacion.md`, CA-019; `tareas.md`, T-005 (b). Art. 5 y 13.
- **Corrección:** añadir CA-019 (cabeceras de respuesta iguales, `Set-Cookie` incluida) a la lista de T-005 (b).

## Sospechas (no comprobadas)

- **Copia en Enviados:** el SMTP de Gmail suele guardar copia en Enviados y los filtros no actúan sobre lo enviado; T-P3 (7) probablemente acabe en «cambio de vía». El plan cierra en fallo (sin correo).
- **Alcance de la contraseña de aplicación:** además de IMAP y POP, puede valer para CalDAV o CardDAV. T-P3.13 debería anotarlos.

## Se puede implementar

- **Marca (A-15):** sí, en cuanto se corrija M-24 antes de T-007 y T-008 y quede aprobada T-005 (b) y anotada en P1.
- **Excepción A-14:** sí. La pone una persona en T-003, con T-P3 (7) y (13), V-111 y V-107 con `verificar-decision` antes del envío real. Si algo falla, no hay correo. La vía preferente necesita diseño, dictamen y P1 propios.

## No comprobado

Comportamiento real de la marca y su cookie, la concurrencia de los contadores, la configuración real de Google Workspace y la respuesta real de la API de gestión para el SMTP.
