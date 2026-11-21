# 021 · Dictamen de seguridad del diseño (tercera vuelta)

Autor: `auditor-seguridad` (solo lectura; guardado por el orquestador, resumido) · Fecha: 21/11/2026 · Sobre: cambios de `diseno.md` y `propuestas.md` (sección del 21/11) frente a `dictamen-diseno-2.md`. Comprobado leyendo Next 16.4.6 instalado, la 020 y las migraciones M02 y M07 de la 010; no se arrancó Next ni se probó el servicio de identidad (sospechas marcadas).

**Veredicto: 0 bloqueantes, 2 mayores (M-15, M-16), 7 menores (m-30 a m-36).** M-14 cerrado en el texto; M-13 cerrado en lo pedido pero abre M-16; m-17 a m-29 corregidos; m-26 sigue en A-14 (responsable). Se corrigen M-15 y M-16 antes de planificar.

## Mayores

### M-15 · H-1: «no reflejar» descansa en una premisa falsa; las pruebas piden lo imposible y se contradicen
- **Dónde:** diseño, «Dirección reflejada», V-1 («mismo HTML crudo», «`Location` = ruta pedida»), PRUEBA-055, AM-39. **Art. 3 y 13.**
- **Comprobado:** Next serializa la ruta y la consulta en todos los cuerpos (`c`, `q`, árbol de segmentos; página, 404, 307, RSC y acción; `app-render.js`). Que la comodín no lea sus segmentos no evita que Next los serialice. El riesgo real es bajo: `htmlEscapeJsonString` escapa `& < > U+2028 U+2029`.
- **Sospecha:** el árbol de segmentos de una ruta real denegada difiere del de la comodín (oráculo de rutas; las rutas no son secretas).
- **Corrección mínima:** (1) el código de la aplicación nunca lee ni repite la consulta ni los segmentos fuera de las listas de `entradas.ts`; (2) lo que serializa Next se declara riesgo residual de AM-39, controlado por su escapado; (3) V-1: «mismo HTML crudo salvo ruta pedida, árbol de segmentos y valores por petición»; oráculo aceptado; (4) la redirección por consulta pasa a opcional y la reserva del `proxy.ts` no cubre las rutas.
- **PRUEBA-055 redefinida:** testigos hostiles en consulta y en ruta (`</script>`, `<!--<script>`, U+2028, comillas, `\`): 0 ejecuciones; 0 apariciones fuera de `self.__next_f`; `<` y `>` siempre escapados; ninguna cabecera salvo `Location` del mismo origen que empiece por `/admin` o `/acceso`; se repite en cada actualización de Next.

### M-16 · El anuncio de un solo uso no encaja con las escrituras de un alta (reabre M-13)
- **Dónde:** diseño, apartados del anuncio y del disparador; `propuestas.md`, fila «tipo `factor`». **Art. 3, 10 y 13.**
- **Sospecha fundada (T-P2.13 sin ejecutar):** un alta son dos escrituras en `auth.mfa_factors` (inserción `unverified`, luego `verified`); si la inserción consume el anuncio, el paso a `verified` cierra todas las sesiones. El servicio puede borrar factores sin verificar caducados al inscribir (consumiría el anuncio). La tabla no tiene columna de sesión.
- **Corrección mínima:** definir «casar»: alta = el anuncio se ata al primer `factor_id` que aparece y cubre sus cambios de estado y su borrado si se cancela hasta que `admin_reconocer_factor` o `admin_sustituir_factor` lo cierran o pasan 5 min; borrado = solo el `factor_id` anunciado; un factor no registrado (sin verificar) nunca consume ni dispara; otro `factor_id` en la ventana = sin anuncio; la ligadura a la sesión la comprueba la función del panel, no el disparador.
- **PRUEBA-052 ampliada:** inscribir y verificar desde el panel: 0 cierres y una I-25; con un factor sin verificar antiguo: 0 cierres; segundo alta con otro `factor_id` en la ventana: cierra todo y escribe (c).

## Menores

- **m-30 · `layout.tsx`:** se pinta en paralelo y no lo cubre `exigirValorPolitica()`. Debe comprobar el valor (si no es válido, armazón sin áreas ni cuenta y sin BD) y leer el estado solo con `leerEstadoAcceso()` y `sesion_estado()`; PRUEBA-003 cubre `layout.tsx` y `not-found.tsx` (este no lee nada).
- **m-31 · 404 de respaldo:** sin `proxy.ts` lleva guiones en línea sin `script-src`; AM-37 lo dice y `admin/not-found.tsx` solo pinta texto fijo.
- **m-32 · `search_path`:** el diseño dice «vacío»; D-035 fija `pg_catalog, pg_temp`.
- **m-33 · Alcance de A-15:** lo que contradice una respuesta del responsable es REQ-024 y CA-017 (5 fallos y bloqueo de 15 min; con marca, 10). La presentación al responsable lo incluye; se aprueba el texto que escriba el `especificador`, no la descripción.
- **m-34 · `aclaraciones.md:125`:** dice A-13 «reservado a una persona»; contradice la decisión D-036.
- **m-35 · T-P2.13:** comprobar si el servicio recifra `encrypted_password` al iniciar sesión (contaría como «contraseña sin anuncio»); en «Sustituir», verificar el factor nuevo en la sesión actual antes de borrar el anterior (el borrado puede bajar `aal`); probarlo en PRUEBA-052.
- **m-36 · H-1 en acciones:** las respuestas de acción llevan `q`; declararlo en AM-39 o incluir acciones en PRUEBA-055 (no explotable con `SameSite=Strict` y `comprobarOrigen()`).

## H-1 de la 020 (dictamen que pedía su `plan.md`)

No es vulnerabilidad explotable en la 020: Next escapa la consulta y la prueba de la 020 muestra 0 ejecuciones. MENOR informativo. La 021 puede avanzar en H-1 si corrige M-15. Recomendación a la 020: añadir U+2028 y `<!--<script>` y un testigo en la ruta a su cadena hostil.

## V-1

Bien recogido salvo el criterio «mismo HTML crudo» (M-15).

## A-13 y A-15 por D-036

A-13: aceptable por delegación (opción conservadora, no acepta riesgo); condición m-34. A-15: aceptable con m-33 (texto escrito y presentación expresa, incluido el umbral de REQ-024 y CA-017).

## Artículos

1 cumple · 2 cumple · 3 pendiente de M-15, M-16, T-P2.12, T-P2.13 y T-P4 · 4 cumple salvo A-14 · 5 pendiente de la enmienda escrita · 6 correcto · 13 M-15, M-16, m-34 · 14 A-14 reservado, correcto.
