# T-103 (001): informe de las correcciones tras el dictamen del revisor

## Qué se hizo, por apartado

1. **Matriz negativa de autenticación (MAYOR, art. 3, REQ-007, CA-006).** Prueba nueva `tests/unit/conector/bd/autenticacion.test.ts`: una matriz de 12 casos sobre las cuatro funciones (`validar_acceso`, `mcp_obtener_instrucciones`, `mcp_enviar_informe`, `mcp_confirmar_orden`), 48 pruebas. Casos: token vigente (control), vida de 299 s (acepta), vida de 300 s recién emitido (acepta: la cota `<=` es inclusiva), vida de 300 s presentado exactamente en su caducidad (rechaza; reloj parado), vida de 301 s y de 1 hora (rechaza), emitido en el futuro, token de renovación, token de otro recurso, token revocado, conexión revocada y licencia revocada. Cada rechazo devuelve el resultado cerrado (`false` o `no_autorizado`) y la huella de las doce tablas no cambia.
   - Nota de interpretación: «vida exactamente 300 s (rechazado)» se ha entendido como un token de 300 s presentado en el instante de su caducidad. Con el SQL actual, un token de vida 300 s recién emitido SÍ se acepta (la cota es `caduca_en <= creado_en + 300 s`); la prueba lo fija así.
   - **Mutaciones** (en el SQL, con restauración desde copia; no queda ninguna). Cada una se aplicó a las cuatro copias del bloque a la vez y la prueba falló en las cuatro funciones:
     - quitar `t.tipo = 'acceso'`: 4 fallos (renovación);
     - quitar `t.revocado_en is null`: 4 fallos;
     - quitar `t.creado_en <= now()`: 4 fallos;
     - quitar la cota de 300 s: 8 fallos (301 s y 1 hora);
     - quitar `t.recurso = p_recurso`: 4 fallos;
     - quitar `c.revocada_en is null`: 4 fallos;
     - quitar `l.estado <> 'revocada'`: 4 fallos;
     - `caduca_en > now()` por `>= now()`: 4 fallos (caducidad exacta). La primera versión de la prueba NO lo detectaba (el reloj avanzaba entre consultas); se corrigió fijando el reloj y se repitió.
2. **`version_prompt`.** Tabla y `informe_es_valido` usan `^[0-9]+\.[0-9]+(\.[0-9]+)?$` con `char_length <= 12`, como el contrato. Pruebas: «12345.0» se guarda; «1234567890.12» (13 caracteres) se rechaza en la función y en el check de la columna. La prueba de esquema (check acotado) admite ahora «regex + longitud acotada».
3. **`p_revision` pasa a `p_ejecucion`** en `mcp_enviar_informe`, en comentarios, en `LEEME.md` y en `informe.test.ts`. `validar.test.ts` limita la prohibición de nombres de parámetro a `cliente|licencia|conexion`.
4. **UUID en mayúsculas**: `~*` en `mcp_enviar_informe` y `mcp_confirmar_orden`. Pruebas nuevas en `informe.test.ts` y `confirmar.test.ts`: guardar/confirmar con el identificador en mayúsculas funciona y repetir en minúsculas da `repetido`. Rojo comprobado contra el SQL anterior (fallaron las dos).
5. **`LEEME.md`**: tabla «Archivos» reunida; punto 3 de «Cierre de la prueba» dice que el estado terminal llega con T-107 (d); nueva sección «Límites conocidos» (semilla con licencia revocada falla por el id fijo: usar revertir y reaplicar; «al día» de `registrar_suceso` es una ventana móvil de 24 h; su recuento no se serializa y puede pasar algo de 20 000 con concurrencia, lo cubre la 008).
6. **Comentario de `esquema.test.ts`**: `sucesos.codigo` es un patrón acotado, no una lista cerrada.

## Comandos y resultados reales

- `npx vitest run --config vitest.config.ts tests/unit/conector/bd/autenticacion.test.ts`: 48 de 48 pasan sobre el SQL final. Las siete primeras mutaciones se ejecutaron con la prueba antes de fijar el reloj (ya detectaban); la octava, con el reloj fijado.
- `npx vitest run --config vitest.config.ts tests/unit/conector/bd`: 7 archivos, 132 pruebas (incluidas las 48 nuevas de la matriz), todas pasan tras los cambios.
- Rojo previo de los apartados 2 y 4: con el SQL anterior fallaban 4 pruebas (mayúsculas en ambas funciones, «12345.0» y la forma de la función con el nombre nuevo del parámetro).
- `npm run verificar`: termina con código 0 (tipos, estilo, 19 archivos y 360 pruebas de vitest, aislamiento PGlite, arnés «SUPERADO», build). El arnés lista avisos de tamaño de especificaciones ajenas (010 a 053); no son de esta tarea.

## PRUEBA-007 parte B

No demuestra carreras: una sola conexión de PGlite y `clock_timestamp` reescrito a un `now()` estable. Las carreras reales quedan para la 008 (condición del dictamen de T-102).

## No comprobado

- pgTAP: no se puede ejecutar aquí (sin Docker); corre en CI.
- Postgres real de Supabase: todo lo anterior es PGlite.
- Concurrencia real (dos peticiones a la vez): solo la 008.
- La URL de la raíz de Supabase en la documentación oficial (solo se comprobó el archivo y su huella; ver `LEEME.md`).

## Notas para tareas posteriores

- **T-107 (d)**: el estado terminal y el cierre; las cuatro copias del bloque de autenticación (`validar_acceso` y las tres `mcp_*`) deben cambiar a la vez. La matriz nueva las cubre.
- `desafio_pkce`: la tabla exige exactamente 43 caracteres (S256) frente al «43 a 128» del diseño. T-107 y T-110 deben devolver `no_valida` antes de insertar.
- `sucesos.codigo`: pasar a lista cerrada cuando exista la de C-2, en T-104.
- T-105: si el SQL no lo hiciera ya, pasar los uuid a minúsculas (ahora el SQL los acepta en ambas formas).

## Correcciones tras el dictamen del auditor-seguridad

- **T-105 (almacen.ts) y mcp_enviar_informe**: el parámetro `p_informe` es ahora `text`, no `jsonb`. El almacén debe pasar el informe como texto (`JSON.stringify`), validarlo con Ajv antes de llamar y no registrar nunca `message`, `detail` ni `where` de un error de Postgres (pueden llevar contenido).
- **T-104**: `sucesos.codigo` y `sucesos.ruta` siguen como patrón (`^[a-z0-9_]{1,40}$`, `^[a-z0-9_/-]{1,60}$`); pasar a lista cerrada cuando exista el catálogo. `sucesos.herramienta` ya es lista cerrada (`obtener_instrucciones`, `enviar_informe`, `confirmar_orden`).
- **Contraseñas (art. 4)**: se pega solo el verificador SCRAM calculado con `scripts/conector/verificador-scram.mjs`.

## Pendientes de decisión (NO hechos en esta tanda)

- Tope de ejecuciones abiertas por conexión: T-105 o decisión del responsable.
- Saturación del registro con 20 000 sucesos en 24 horas: requiere aceptación expresa del responsable.
- Rol propietario NOLOGIN de las funciones `security definer`: es un cambio de diseño.

## Vuelta atrás

`git revert` de los commits «T-103 (001)» de esta tanda. En Supabase, nada se ha aplicado: la reversión de la prueba sigue siendo `001_estado.reversion.sql`.
