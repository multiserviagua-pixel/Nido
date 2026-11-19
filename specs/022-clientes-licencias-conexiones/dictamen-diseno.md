# 022 · Dictamen de seguridad del diseño (primera vuelta)

Autor: `auditor-seguridad` · Fecha: 14/11/2026 · Sobre: `specs/022-clientes-licencias-conexiones/diseno.md`, versión del 14/11/2026 (862 líneas, sin commit; SHA-256 `ef79fdc38fdd…`), con las decisiones por delegación anotadas ese día en `aclaraciones.md`.

Revisión independiente y de solo lectura. Leídos enteros: `diseno.md`, `especificacion.md`, `aclaraciones.md`, `docs/CONSTITUCION.md`, `docs/SEGURIDAD.md`, `docs/CALIDAD.md`, `docs/TECNOLOGIAS.md`, y los dos dictámenes de la 021 como modelo. Solo los apartados citados: `docs/MODELO-DATOS.sql` (tablas, `es_admin`, `resolver_token`, disparadores, permisos), `docs/ARQUITECTURA.md` (flujo 1, datos admitidos), el diseño de la 021 («La regla de acceso», «Funciones de operación con sesión completa»), el de la 001 (código de activación, activación, tokens, `generar_codigo`), el de la 020 (muestra fuera de producción) y REQ-010 de la 010. No hay código, migraciones ni pruebas: nada de comportamiento se ha ejecutado. Ejecutado: `node scripts/comprobar-specs.mjs` (resultado al final). Lo marcado «sospecha» no está comprobado.

**Veredicto: 1 bloqueante, 2 mayores y 9 menores. No puede ir a planificar todavía.** El bloqueante B-1 no es un defecto del diseño, que lo declara bien: es la enmienda del artículo 2, reservada a una persona y sin aplicar. Los mayores M-1 y M-2 se corrigen en el diseño, con cambios pequeños y localizados. Corregidos esos dos y aplicada la enmienda, puede ir a la puerta P1; los menores pueden corregirse en el diseño o pasar al plan como condiciones de tarea.

Lo que está bien hecho: ninguna escritura directa y once funciones transaccionales con `es_admin()` dentro; estado de la licencia derivado de hechos con fecha, sin tarea periódica; las dos causas de suspensión separadas; código sorteado en la app, guardado solo como HMAC y con la columna ilegible para toda sesión; «pendiente esperado» en lugar de anular a ciegas; nombre tecleado comprobado en la base de datos contra el nombre actual; búsqueda fuera de la dirección; fuente ficticia imposible de activar en producción; lecturas que no dependen de políticas ajenas (DD-17); y la honestidad sobre lo que no se puede cerrar sin la fase 2.

## Bloqueante

### B-1 · BLOQUEANTE · El identificador de cliente como entrada choca con el texto vigente del artículo 2

- **Dónde:** Resumen (línea 19); H-1 (27); «Rutas y pantallas» (123); entradas `cliente` de O-2 a O-11 (348-360); comprobación del artículo 2 (738); asunto A-1 (838).
- **Incumple:** artículo 2 («El identificador del cliente nunca se acepta como entrada»), REQ-074; también `.claude/rules/interfaz.md`, línea 22 («Ningún dato en la URL que no sea un identificador propio del usuario»).
- **Por qué:** la ficha lleva el identificador en la dirección y cada operación lo recibe. El uso que hace el diseño es correcto (elige, nunca concede: el permiso sale de `es_admin()` y el objeto se comprueba contra el cliente dentro de la base de datos), pero la constitución sigue en la versión 1.0 sin la nota aclaratoria que el responsable eligió el 12/11/2026. Según «Cómo se aplica», un incumplimiento es bloqueante; D-019 no delega cambios de la constitución, y `aclaraciones.md` lo deja «reservado a una persona, sin decidir».
- **Corrección mínima:** ninguna en el diseño. El responsable aplica la nota del artículo 2 con fecha, motivo y versión (y su anotación en `docs/TECNOLOGIAS.md`), y coordinación ajusta `.claude/rules/interfaz.md`. Hasta entonces, ninguna página con `[cliente]` se implementa, como ya dice «Orden obligado».
- **Prueba:** documental: versión de `docs/CONSTITUCION.md` con la nota; después, PRUEBA-022 y CA-044 (el identificador solo cambia el cliente mostrado).

## Mayores

### M-1 · MAYOR · Un código caducado sin usar sigue «vivo» y bloquea generar otro para esa licencia

- **Dónde:** D-3 (línea 295: `vivo`, «verdadero mientras pueda llegar a usarse», con índice único parcial); «Estado derivado» (309: «No hay tarea periódica»; 315: estado del código); «La operación», pasos 1 a 3 (200-204); O-10 (359); AM-04 (516).
- **Incumple:** REQ-020 y REQ-068 (se puede generar un código para una licencia activa), CA-014, CA-042 y CA-046 («generar uno nuevo funciona»); artículo 10.
- **Por qué:** `vivo` no puede ser una columna generada que dependa de la hora (las generadas exigen funciones inmutables y `now()` no lo es), así que es un booleano guardado que solo baja al usarse o anularse. El caso más común de la instalación, un código que caduca a los 15 minutos sin usarse, deja `vivo = true` para siempre. La ficha lo pinta «Caducado» (regla derivada), el diálogo no avisa de ningún pendiente y la vista envía `pendiente_esperado` vacío. En la base de datos pasa una de dos cosas, según cómo se implemente el paso 1: si «pendiente» se lee como `vivo`, el caducado es «un pendiente distinto del esperado» y la operación responde `estado_cambiado` siempre; si se lee como derivado, el insert choca con el índice único y el resultado es un error no reconocido, es decir `incierta`. En los dos casos esa licencia no vuelve a admitir un código. Quien lo implemente «lo arreglará» anulando el caducado (fila I-11 falsa y estado «Anulado» en lugar de «Caducado», contra CA-016) o quitando el índice (pierde REQ-068 y DD-03).
- **Corrección mínima:** definir «pendiente» como `vivo` y `caduca_en > now()` del reloj de la base de datos. En O-10, con el cerrojo de la licencia tomado, retirar los códigos vivos ya caducados poniendo `vivo = false` sin `anulado_en` y sin fila de auditoría (D-5 ya permite bajar `vivo`); después aplicar el paso 1 solo contra un pendiente no caducado. La activación (D-11, punto 3) rechaza por `caduca_en` aunque el código siga vivo. `estado_codigo` no depende de `vivo`. Decirlo también en el caso límite: si el esperado caducó entre la lectura y la operación, se retira y se crea el nuevo.
- **Prueba:** PRUEBA-016 ampliada: generar, dejar pasar la caducidad (reloj de prueba o restricción solo de prueba) y generar otro con `pendiente_esperado` vacío y con el identificador del caducado: «hecha» las dos veces, el anterior queda «Caducado» y no «Anulado», 0 filas I-11 y un solo código vivo. Lo mismo con 20 repeticiones de dos generaciones a la vez sobre una licencia con un caducado vivo.

### M-2 · MAYOR · Los valores recibidos pueden salir en los errores de restricción y en los registros de Postgres

- **Dónde:** «Cerrojos y simultaneidad», nombre único (386: «una gana y la otra recibe el error de campo `repetido`», sin decir cómo); D-1 (293: la restricción de caracteres en la tabla); D-5 (297: disparadores que rechazan); búsqueda (134) y confirmación tecleada (193: «no se guarda y no se registra»); AM-17 (529); PRUEBA-025 (585).
- **Incumple:** artículo 1 y skill `revision-privacidad` (ningún error devuelve ni registra el valor recibido), REQ-036, REQ-053 y CA-035 (error junto al campo), REQ-055 y CA-036.
- **Por qué:** Postgres incluye el valor en el detalle de los errores de restricción: el índice único da `Key (nombre_clave)=(garcia sl) already exists`, la restricción de comprobación da `Failing row contains (…)` con la fila entera, y el índice de `codigo_hmac` daría el HMAC. Si la función no captura esas excepciones, el detalle viaja en la respuesta de la API de datos (`details`) hasta el servidor, queda en el registro de Postgres del proyecto y, si `fuente-bd.ts` pasa el objeto de error a `registrarFallo` o lo captura la supervisión, sale también allí. Además, el resultado sería un error no reconocido: el perdedor de dos altas simultáneas vería `incierta` en lugar de `repetido`. Sospecha, sin comprobar: si el proyecto registra sentencias lentas, Postgres escribe sus parámetros (búsqueda, nombre tecleado) en el registro. El diseño afirma que esos textos «no se registran» y su prueba solo mira la salida de la app y la supervisión. No es bloqueante porque el valor es el nombre comercial, que ya se guarda, y no contenido de correo; pero el nombre de un autónomo es un dato personal y la regla es la misma.
- **Corrección mínima:** (1) O-1 y O-2 validan nombre y frecuencia dentro de la función antes de escribir, y capturan `unique_violation` y `check_violation` para devolver el error de campo de lista cerrada; ninguna restricción ni disparador de D-1 a D-5 lanza un mensaje con valores (solo un código fijo). (2) `fuente-bd.ts` traduce los errores solo por código SQLSTATE y descarta `message`, `details` y `hint`; nunca entrega el objeto de error a `registro.ts` ni a la supervisión (añadirlo a PRUEBA-005 como búsqueda estática). (3) T-P1 o T-P4 comprueban qué registra el proyecto de desarrollo (errores con detalle, sentencias lentas con parámetros) y, si registra parámetros, se desactiva para este proyecto o se acepta por escrito.
- **Prueba:** PRUEBA-025 ampliada a los registros de Postgres y de la API de datos del proyecto de desarrollo, con una cadena testigo en un nombre repetido por alta simultánea, en un nombre con un carácter prohibido enviado por llamada directa a la función, en una búsqueda y en un nombre tecleado: 0 apariciones fuera de la tabla `clientes`. PRUEBA-002: el perdedor de cada carrera recibe `repetido`, nunca `incierta`.

## Menores

- **m-1 · AM-12, REQ-073, D-5 (297), «Cerrojos» (388), D-11 punto 3 (394).** Con lectura confirmada, el disparador «no se inserta una conexión activa en una licencia revocada» no ve la revocación aún no confirmada: una activación concurrente con O-8 puede dejar una conexión «Activa» en una licencia revocada (el conector la rechaza igual, porque comprueba la licencia en cada llamada; el daño es de datos y de lo que muestra la ficha). Corrección: el disparador lee la licencia con `for share`, que espera al cerrojo de O-8 y vuelve a leer. Además, como la conexión no referencia al código, ningún disparador cubre la carrera de la activación con la baja, la suspensión o la anulación: D-11 punto 3 debe exigir que la activación vuelva a comprobar todas sus condiciones después de tomar los cerrojos y marque el código usado con una actualización condicionada (vivo, sin uso, sin anulación, no caducado). Prueba: PRUEBA-018 con activación y revocación a la vez (etapa C o con la función de activación en pgTAP).
- **m-2 · REQ-043, «Operaciones» (339-340).** `es_admin()` se comprueba antes de tomar los cerrojos; si la sesión se cierra o el administrador se da de baja mientras espera el cerrojo, la operación sigue. Volver a comprobarla después de tomarlos (mismo hallazgo que m-1 de la 021, ya aceptado allí). Prueba: una baja de administrador mientras su O-8 espera el cerrojo de otra operación: `no_permitida` y 0 cambios.
- **m-3 · AM-10, A-09, REQ-010 de la 010; D-6, D-9 (298, 301), T-P4 (505).** El diseño no fija los permisos de sus 18 funciones ni dice si las lecturas son `security definer`. Postgres concede `execute` a todos por defecto en cada función nueva. Fijar, como hace la 021: ningún permiso para `anon` ni para el grupo de todos los roles, `execute` solo para `authenticated`, `search_path` vacío, `es_admin()` antes de leer parámetros; añadir las 18 a la lista cerrada de la PRUEBA-048 de la 021; y la función interna de revocación que comparten O-11 y el conector (D-11 punto 5), sin permiso para `authenticated` (ella no comprueba `es_admin()`).
- **m-4 · REQ-027, AM-11, D-11 punto 1 (392).** La lista de «cada llamada y cada renovación» omite el canje del código de autorización por tokens (`grant_type=authorization_code`) de la 001, que ocurre después de crear la conexión. Si la conexión o su licencia se revocan entre la activación y el canje, el canje debe rechazarse. Añadirlo, con su prueba en la fase 2.
- **m-5 · REQ-051, AM-13, DD-06; «Qué se rechaza» (223-233).** La lista, escrita de memoria, deja pasar caracteres que se ven en blanco: U+2800 (patrón braille vacío), los de uso privado (U+E000 a U+F8FF y planos 15 y 16), los no caracteres (U+FDD0 a U+FDEF, U+FFFE, U+FFFF y equivalentes) y los ignorables sin asignar (U+2065, U+FFF0 a U+FFF8, U+E0000 a U+E0FFF fuera de las etiquetas). Con U+2800 al final, «Acme» y «Acme⠀» conviven y se ven iguales. Añadirlos y contrastar toda la lista con `DerivedCoreProperties.txt` (Default_Ignorable_Code_Point) en T-P1.
- **m-6 · Artículo 13; Resumen (9), AM-09 (521).** «Una segunda capa de disparadores impide deshacer lo que es definitivo […] incluso a quien llegara con más privilegio» es más de lo que da: el propietario de las tablas (la consola de Supabase) puede desactivar disparadores. Decir «incluso a la clave secreta; no al propietario de la base de datos, que queda fuera de este modelo».
- **m-7 · A-6, AM-19; `aclaraciones.md` (101); diseño de la 001 (335, 509).** La decisión delegada («si la orden `generar_codigo` se mantiene, escribe la misma fila») no basta: con un insert propio, esa vía se salta las condiciones de O-10 (cliente activo, licencia activa), el cerrojo, la anulación del pendiente (chocaría con el índice de `vivo`) y `creado_por` obligatorio. Si se mantiene, debe llamar a la misma función interna que O-10, con origen `responsable_fuera_del_panel` y su entrada en la 024.
- **m-8 · REQ-022, AM-03; `DialogoCodigo` (214), T-P3 (504).** T-P3 y CA-015 prueban con el diálogo cerrado. Falta el caso del diálogo abierto y una navegación atrás y adelante: la caché de páginas del navegador y, en Next.js 16, la conservación del estado de rutas anteriores en la navegación del cliente (sospecha, sin comprobar en la versión fijada) podrían volver a pintar el código sin generar otro. Borrar el código también al desmontar u ocultar el componente y en `pagehide`, y añadir ese caso a T-P3.
- **m-9 · DD-15, artículo 3; mapa de archivos (104), «Fuente ficticia» (260).** `src/app/muestra/clientes/` debe seguir las reglas de la muestra de la 020: archivos `page.muestra.tsx`, `comprobarAccesoMuestra()` como primera instrucción de cada página y acción, y sin registro ni supervisión. Decirlo y añadir la ruta a PRUEBA-024 de la 020; los códigos ficticios del diálogo, con una forma que no valga como código (por ejemplo, una letra fuera del alfabeto Crockford).

## Valoración de las decisiones por delegación

| Decisión | Valoración |
| --- | --- |
| DD-01 (toda escritura por función; sin permisos de escritura; disparadores) | Correcta y necesaria. Con m-1, m-3 y m-6 |
| DD-02 (solo se anula el pendiente esperado) | Correcta y más segura que anular a ciegas. Depende de M-1: sin él, un código caducado bloquea la licencia |
| DD-03 (índice único además del cerrojo) | Correcta, con M-1 |
| DD-04 (HMAC ilegible para toda sesión) | Correcta. Si las lecturas son `security definer`, el control real es la lista de columnas de L-4, que ya excluye el HMAC; PRUEBA-013 lo cubre |
| DD-05, DD-06 y A-7 (regla de nombres) | Correctas; riesgo de alfabetos mezclados aceptado y declarado. Con m-5 |
| DD-07 (nombre de baja reservado) | Correcta |
| DD-08 (nombre tecleado comprobado en la base de datos) | Correcta |
| DD-09 (cliente de baja: solo revocar) | Correcta; ante la duda, se deniega |
| DD-10 (hora ambigua rechazada; 10 años) | Correcta |
| DD-11 (diálogo del código solo se cierra con su botón) | Aceptable: el código se sustituye al caducar y la 021 vacía la pantalla al caducar la sesión. Con m-8 |
| DD-12 (búsqueda expresa y fuera de la dirección) | Correcta |
| DD-13, DD-18 | Sin efecto en seguridad |
| DD-14 y A-2 (una fila principal más las vinculadas) | Correcta; es la que más rastro deja |
| DD-15 (fuente ficticia fuera del producto) | Correcta. Con m-9 |
| DD-16 (aviso permanente de baja con credenciales vivas) | Correcta; hace visible el riesgo aceptado |
| DD-17 (lecturas con `es_admin()` propia) | Correcta |
| DD-19 (revocar dos veces: «ya estaba hecho») | Correcta |
| A-3 (usuario de cliente sin filas en la fase 3) | Correcta; exige quitar `clientes_propio` y `licencias_propio` del modelo de referencia (pedido a la fase 2) |
| A-5 (15 minutos también en la 001) | Correcta: es lo aprobado por el responsable. Exposición algo mayor que 10 minutos, acotada por el límite de intentos de la 001 |
| A-6 (la orden `generar_codigo` audita si se mantiene) | Insuficiente tal como está: ver m-7 |
| A-8 (alerta de conexión nueva en la fase 4) | Aceptable, porque la fase 4 va antes de publicar. Que la lista de publicación de `docs/SEGURIDAD.md` la exija (A-01 ya la nombra como control) |
| A-1 y A-4 (reservados) | A-1 es B-1. A-4 impide pasar a VERIFICADA, no a planificar |

## Tabla de amenazas: cambios

| N.º | Cambio |
| --- | --- |
| AM-03 | Añadir el diálogo abierto con navegación atrás y adelante (m-8). ¿Basta? Casi |
| AM-04 | Añadir el código caducado que sigue vivo (M-1). ¿Basta? No, hasta corregir M-1 |
| AM-09 | Corregir el alcance de los disparadores (m-6). ¿Basta? Sí frente a la API y la clave secreta |
| AM-10 | Permisos explícitos y lista cerrada (m-3). ¿Basta? Sí, con m-3 y T-P4 |
| AM-11 | Añadir el canje del código de autorización (m-4) |
| AM-12 | El disparador necesita leer la licencia con cerrojo; la activación vuelve a comprobar tras los cerrojos (m-1). ¿Basta? No, hasta m-1 y el diseño de la fase 2 |
| AM-14 | Señalar que, sin la política de contenido de la 021 (su M-14), un guion inyectado en `/admin` puede llamar a «Generar código» y leer el código de la respuesta: es la acción de esta función que entrega una credencial. ¿Basta? Parcial |
| AM-17 | Añadir errores de restricción y registros de Postgres (M-2). ¿Basta? No, hasta M-2 |
| AM-19 | La orden de operación debe usar la misma función interna que O-10 (m-7) |
| AM-28 (nueva) | Una licencia queda sin poder generar códigos tras caducar uno sin usar. Control: M-1. Prueba: PRUEBA-016 ampliada |
| AM-29 (nueva) | Valores recibidos en el detalle de los errores de restricción y en los registros de la base de datos. Control: M-2. Prueba: PRUEBA-025 ampliada |
| AM-30 (nueva) | Una operación sigue adelante tras perder la sesión mientras espera un cerrojo. Control: m-2 |
| AM-31 (nueva) | Caracteres que se ven en blanco y no están en la lista (U+2800, uso privado, sin asignar). Control: m-5. Prueba: PRUEBA-001 y PRUEBA-002 con esos vectores |

Las demás (AM-01, AM-02, AM-05 a AM-08, AM-13, AM-15, AM-16, AM-18, AM-20 a AM-27) bastan como están, con sus riesgos restantes declarados.

## Cumplimiento de la constitución

| Artículo | Resultado |
| --- | --- |
| 1 Privacidad | Cumple en lo que guarda; pendiente de M-2 en lo que puede registrar |
| 2 Aislamiento | **No cumple mientras no se aplique la nota** (B-1). El uso del identificador es correcto |
| 3 Cierre en fallo | Cumple, con m-1, m-2 y m-3 |
| 4 Secretos | Cumple: solo HMAC, clave fuera de la base de datos; supervisión pendiente de V-112 |
| 5 Especificación | Cumple |
| 6 Revisión independiente | Cumple: este dictamen y la puerta P1 |
| 7 Entradas no confiables | Cumple. No se encontraron instrucciones dirigidas a agentes en los documentos leídos |
| 8 y 9 | No aplican |
| 10 Producto final | Pendiente de M-1 (el flujo de instalación más común se rompe) |
| 11 Reversibilidad | Cumple, con el límite declarado de M-4 |
| 12 Español | Cumple |
| 13 Evidencias honestas | Cumple, salvo la afirmación de m-6 |
| 14 Cambios reservados | Cumple: la enmienda y los documentos compartidos se piden, no se hacen |

## Lo que se comprobó y lo que no

- **Ejecutado:** `node scripts/comprobar-specs.mjs` desde la raíz del repositorio, el 14/11/2026 y con este dictamen ya escrito: **SUPERADO** (12 de 12 comprobaciones en OK; 26 funciones, 180 archivos revisados sin secretos; código de salida 0). Es una comprobación documental; no prueba seguridad ni comportamiento.
- **Comprobado leyendo:** el diseño completo; cada REQ y CA citado en los hallazgos; el modelo de referencia en lo citado (permisos de escritura de `authenticated` sobre las cuatro tablas, disparador genérico, políticas `*_propio`, `resolver_token`); la regla de acceso y las funciones de la 021; el código de activación, la activación y los tokens de la 001; los controles de la muestra de la 020; REQ-010 de la 010; que `docs/CONSTITUCION.md` sigue en la versión 1.0 sin la nota del artículo 2.
- **Sospechas sin comprobar:** qué registra el proyecto de Supabase de desarrollo (errores con detalle, sentencias lentas con parámetros) (M-2); que Next.js 16 conserve el estado de una ruta anterior en la navegación del cliente y pueda volver a pintar el diálogo abierto (m-8); que la propiedad Default_Ignorable_Code_Point cubra exactamente los rangos de m-5 en la versión de Unicode del proyecto.
- **No comprobado:** ningún comportamiento real de Postgres, de la API de datos, de Next.js ni del navegador; nada de la fase 2, que no tiene diseño (010, 011, 014), ni de la 023, la 024 y la 025. Si esos diseños cambian lo que este supone, el dictamen se revisa.
- **Fuera de este modelo:** quien tenga acceso a las consolas de Supabase, Vercel o GitHub, o al secreto del conector, controla todo.
