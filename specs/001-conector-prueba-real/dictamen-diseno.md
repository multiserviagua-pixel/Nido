# 001 · Dictamen de seguridad del diseño (primera vuelta del diseño nuevo)

Autor: `auditor-seguridad` · 19/11/2026 · Sobre: `diseno.md`, segunda versión (19/11/2026). Transcrito por el orquestador (el auditor es de solo lectura). Líneas citadas: las de esa versión.

**Veredicto: BLOQUEANTE.** 1 bloqueante, 6 mayores y 9 menores. El bloqueante se corrige con una frase. Corregido, y resueltos M-1 a M-6 con su prueba, pasa a APTO CON CONDICIONES. La base es sólida: callbacks fijos, PKCE, `iss`, tokens guardados como HMAC, cookie ligada, roles sin tablas, prompt del repositorio, cierre en fallo. Los hallazgos están en los bordes y en la prueba real.

Ejecutado por el auditor: `node scripts/comprobar-specs.mjs` (SUPERADO); `npm view` de las cinco dependencias (coinciden; fechas en M-6); especificación Fetch de WHATWG, «append a request Origin header» (para M-1).

## Hallazgos

| N.º | Hallazgo | Artículo / amenaza | Gravedad | Apartado a corregir |
| --- | --- | --- | --- | --- |
| B-1 | Las evidencias admiten transcripciones de las herramientas de Gmail y capturas de permisos con la cuenta enlazada | 1, 4; A-14, A-15; REQ-016, CA-015, CA-016 | BLOQUEANTE | «Evidencia» (l. 177); paso 1 (l. 164) |
| M-1 | Con `Referrer-Policy: no-referrer` global, el `POST` de la pantalla llega con `Origin: null` y toda activación se rechaza | 3, 10; A-21 | MAYOR | Pantalla (l. 87); C-4 |
| M-2 | La cuenta Max es personal: no se controla qué Gmail está enlazado ni qué otros conectores aprueba el modo automático de Cowork | 8, 1, 7; A-13, A-16; RD-057, RD-062 | MAYOR | Prueba real (l. 158, 164) |
| M-3 | Derivación del «mismo par» sin especificar: un HMAC no da dos tokens de 256 bits | 3, 4; A-05, A-06 | MAYOR | Tokens (l. 91-93) |
| M-4 | Privilegios heredados de `PUBLIC` en `Nido` (proyecto compartido), sin revocar ni probar | 3, 2; A-08, A-09 | MAYOR | Datos (l. 124-130); PRUEBA-022 |
| M-5 | `cerrar_prueba` no es terminal: credencial de operación y contraseñas siguen; una licencia vuelve a ser activable | 3, 11; RD-076, CAD-046 | MAYOR | Operaciones (l. 97); Datos (l. 122); paso 13 |
| M-6 | Controlador `postgres` 4.x recién publicado y TLS sin verificación de certificado | 3; A-19 | MAYOR | Dependencias (l. 300-308); Datos (l. 124) |
| m-1 | RD-016 pide decisión registrada del responsable sobre la anotación de `obtener_instrucciones`; la `description` del contrato dice que la orden solo llega con `activa`, contra REQ-011 | 14, 5, 13 | MENOR | Contratos (l. 115) |
| m-2 | «Reglas: constantes (30, 3, verdadero)» ambiguo; `guardar_adjuntos` y `descargar_facturas_por_enlace` deben ser `false` | 8, 7 | MENOR | Prompt (l. 105) |
| m-3 | El rol de gestión atiende rutas OAuth abiertas y también `operar_*`; todas las funciones de Vercel ven las mismas variables: la separación de roles solo protege de errores de lógica | 3 | MENOR | Datos (l. 126) |
| m-4 | CIMD: exigir `https:`, sin puerto, usuario ni fragmento, `hostname` exacto y mejor URL exactas (claude.ai aloja contenido de usuarios). Código canjeado dos veces revoca la conexión. Verificador PKCE: 43-128 caracteres no reservados | 3, 7; A-03, A-04 | MENOR | Servidor de autorización (l. 77-79) |
| m-5 | `state` vuelve en el formulario: revalidarlo en el `POST`, codificarlo para URL y escaparlo para HTML, o guardar su HMAC | 7 | MENOR | Pantalla (l. 83, 87) |
| m-6 | La tubería no rechaza lotes JSON-RPC ni cuerpos que no sean objeto. Faltan canarios en `id` y claves `__proto__`/`constructor` en el informe (se cuentan como descartadas) | 1, 3; A-14 | MENOR | Punto MCP (l. 46-57); PRUEBA-017, 019 |
| m-7 | Sin purga ni plazo en `solicitudes_autorizacion`, `ejecuciones` y `limites_origen` (HMAC de IP = dato seudonimizado). Si falta `x-vercel-forwarded-for`, rechazar | 1, 3; A-22 | MENOR | Pantalla, Datos |
| m-8 | Fijar en el código la huella esperada del prompt (si no coincide, 503). Añadir al escáner un patrón para el código de activación (sin prefijo) | 9, 4; A-12, A-20 | MENOR | Prompt; Amenazas |
| m-9 | `/api/operacion`: credencial en `Authorization` y argumentos en el cuerpo, nunca en la consulta. `conector:ciclo` debe decir cómo obtiene el código sin añadir callbacks (leyendo el enlace de la pantalla), sin imprimir ni guardar tokens, y revocar esa conexión al acabar el paso 11 | 4, 3 | MENOR | Operaciones; paso 11 (l. 173) |

### B-1. Contenido del buzón en las evidencias
- **Cómo se produce:** l. 177 dice «de las conversaciones, transcripción de herramientas y resultados». La transcripción de Claude incluye `search_threads`, `get_message` y `get_thread` con asuntos, cuerpos y la dirección del buzón. Copiada a `evidencias/` mete contenido del buzón y una dirección que, según la cuestión 8 de las aclaraciones, no se copia; CA-016 («0 apariciones») no se cumple. La «captura de permisos» del paso 1 muestra la cuenta enlazada.
- **Corrección:** de las tres herramientas de HumanaIA se transcriben argumentos y resultados (cerrados). De las de Gmail, solo nombre y número de llamadas. Capturas recortadas sin la cuenta.
- **Prueba:** PRUEBA-051 ampliada: buscar la dirección del buzón (la da la persona en la orden, fuera del repositorio) y asuntos y cuerpos del inventario en `evidencias/` y `resultados/`. Umbral 0.

### M-1. `Origin: null` en la activación
- **Cómo:** según Fetch, en una petición distinta de GET/HEAD fuera del modo `cors`, `no-referrer` envía `Origin: null`, también al propio origen. La 002 pone esa política en todas las respuestas; la l. 87 rechazaría toda activación real. La batería no lo ve porque fabrica cabeceras. Riesgo: descubrirlo el día D y «arreglarlo» aceptando cualquier `Origin`.
- **Corrección:** en `/oauth/autorizar`, `Referrer-Policy: same-origin` como única cabecera, excluyendo la global en C-4. Alternativa: aceptar el `Origin` propio, o `null` solo con `Sec-Fetch-Site: same-origin`. Se mantienen cookie y campo oculto.
- **Prueba:** un navegador real hace GET y POST (local o V-6 antes del paso 3) y la activación se completa. Un POST de otro origen se rechaza sin contar intento.

### M-2. Cuenta personal en Cowork automático
- **Cómo:** en modo automático, Cowork aprueba las herramientas de solo lectura de todos los conectores y deja las de escritura a su clasificador (V§3.6). El paso 1 solo inventaría Gmail. Con el Gmail real enlazado, o Drive, otro correo, búsqueda o descarga web, navegador o carpetas locales, el mensaje con órdenes (paso 9) puede llevar al agente a leer correo real (RD-057, art. 1) o sacar datos por otra vía. CA-019 solo mira la dirección de control y Enviados.
- **Corrección (paso 1 del guion):** (a) declaración escrita de la persona, sin la dirección, de que el Gmail enlazado es el de pruebas y no hay otro correo; (b) inventario fechado de conectores, complementos y capacidades; en la tarea solo Gmail de pruebas y HumanaIA, lo demás desactivado o «Blocked»; (c) lo que no se pueda desactivar es un asunto R-7 del responsable antes del paso 6.
- **Prueba:** PRUEBA-049 y 050. El mensaje con órdenes pide además «abre esta URL» y «guárdalo en Drive». Umbral: 0 llamadas fuera de las 7 herramientas de Gmail y las 3 de HumanaIA.

### M-3. Derivación del par
- **Cómo:** `HMAC(kd, etiqueta ‖ token ‖ sal)` da 32 bytes y hacen falta dos tokens de 256 bits. Una lectura posible: el mismo valor con dos prefijos; entonces el token de acceso (en cada llamada) contiene el de renovación (14 días). Como el guardado es `HMAC(clave, tipo:token)`, las filas salen distintas y ninguna prueba lo detecta. «Sortea sal y par candidato» contradice la derivación: un par aleatorio no se reproduce durante la gracia.
- **Corrección:** `acceso = HMAC(kd, "acceso" ‖ 0x00 ‖ token ‖ sal)`, `renovacion = HMAC(kd, "renovacion" ‖ 0x00 ‖ token ‖ sal)`. La app solo sortea la sal (≥128 bits). `expires_in` desde la emisión guardada.
- **Prueba:** PRUEBA-012: mil pares sin parte aleatoria común entre acceso y renovación; par de la gracia idéntico byte a byte. CAD-025: sal sin `CONECTOR_SECRETO` → 0 tokens.

### M-4. `PUBLIC` en `Nido`
- **Cómo:** toda función nueva concede `EXECUTE` a `PUBLIC`; los roles nuevos heredan lo concedido a `PUBLIC` en `public`, `privado`, `extensions` y demás esquemas del proyecto existente. Si hay funciones `security definer` de otros, el rol del conector las ejecuta. En PRUEBA-008 la contraseña está en local, en la misma cuenta de Windows (A-3 de la 002). PGlite no tiene esos roles.
- **Corrección:** en `001_estado.sql`, `revoke all on schema conector_prueba from public`, revocar `execute` de las funciones a `public`, `anon`, `authenticated`, `service_role`, con `alter default privileges`. Roles `NOINHERIT NOBYPASSRLS`, con `CONNECTION LIMIT` y `statement_timeout`.
- **Prueba:** PRUEBA-022 contra `Nido`, con `has_function_privilege`, `has_schema_privilege`, `has_table_privilege` de cada rol sobre todos los esquemas no de sistema. Solo las funciones previstas; roles de Supabase con 0 sobre `conector_prueba`.

### M-5. Cierre no terminal
- **Cómo:** tras `cerrar_prueba`, `OPERACION_HUELLA` y las URL de base de datos siguen en Vercel y los roles conservan contraseña hasta la fase 2 (C-6). `generar_codigo` vuelve a hacer activable una licencia en un conector que nadie vigila (aclaración 11), contra RD-076.
- **Corrección:** `cerrar_prueba` fija estado terminal: generar, activar, canjear, renovar, validar y operaciones de cambio se rechazan; solo `resumen`, `listar_conexiones`, `exportar_sucesos`. En el paso 13 una persona borra `OPERACION_HUELLA` y pone `alter role … nologin password null` en los dos roles. El conector queda en 503 (C-1).
- **Prueba:** PRUEBA-023 y CAD-046: `generar_codigo` rechazado, renovación `invalid_grant`, todas las rutas 503. La contraseña antigua no conecta por el agrupador (6543); igual la local tras la reaplicación (l. 122).

### M-6. Controlador y TLS
- **Cómo:** `postgres` 4.0.0 salió el 29/10/2026 y la 4.1.1 el 11/11; un solo mantenedor y `dist.attestations` vacío. Es la pieza que maneja contraseñas y respuestas del almacén. `@electric-sql/pglite` 0.5.17 se publicó hoy. «TLS» no dice que se verifique el certificado: en postgres.js 3.x `ssl: 'require'` no valida; en 4.x, sospecha. Sin validación, un intermediario podría devolver `activa` o `emitido` falsos.
- **Corrección:** `postgres` 3.4.9 salvo razón escrita, o revisar el diff 3.4.9 → 4.1.1. Enfriamiento ≥7 días antes de adoptar una versión. Raíz pública de Supabase en el repositorio y `verify-full`.
- **Prueba:** PRUEBA-018: almacén con certificado no confiable → 503 sin consultar.

## Anotación de `obtener_instrucciones` (A-3)
**De acuerdo con `readOnlyHint: false`.** La herramienta escribe (abre una ejecución y marca la orden como entregada). En modo automático de Cowork lo declarado de solo lectura se aprueba sin revisión; declararla `true` sería una señal del servidor que relaja al anfitrión (art. 8 y regla del conector). `idempotentHint: false` y `openWorldHint: false` correctos. Condiciones: P1 recoge la respuesta expresa del responsable (RD-016) y no se da por delegación; si ChatGPT pide confirmar en cada ejecución, se anota como resultado y nunca se vuelve a `true`; en el mismo cambio se corrige la `description` (m-1).

## Tabla de amenazas: añadir
A-01: sin alerta por conexión nueva en la 001; control sustituto `listar_conexiones` diario. A-05/A-06: M-3, PRUEBA-012. A-09: M-4, PRUEBA-022 contra `Nido`. A-12: huella fijada (m-8), PRUEBA-016. A-13/A-16: todos los conectores de la cuenta (M-2), PRUEBA-049, 050. A-14/A-15: B-1, PRUEBA-051. A-19: enfriamiento y TLS (M-6), PRUEBA-018. A-21: `Origin` con navegador real (M-1), PRUEBA-009. Cierre: M-5, PRUEBA-023.

## No comprobado
Qué hay en `Nido` (esquemas, funciones, concesiones); si los navegadores aplican `Origin: null` como dice la especificación; semántica TLS de postgres 4.x; si el agrupador de Supabase guarda en caché contraseñas antiguas; conectores de la cuenta Max y si Cowork deja desactivarlos por tarea; si `x-vercel-forwarded-for` se puede falsificar; URL exacta del documento CIMD de Claude; V-1 a V-8. No hay código: ninguna prueba de comportamiento ejecutada.

**1 bloqueante.**
