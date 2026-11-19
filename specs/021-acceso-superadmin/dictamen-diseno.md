# 021 · Dictamen de seguridad del diseño (primera vuelta)

Autor: `auditor-seguridad` · Fecha: 14/11/2026 · Sobre: `specs/021-acceso-superadmin/diseno.md` (versión del 13/11/2026)

Guardado por el orquestador de la fase 3 a partir de la respuesta del auditor, que no escribe archivos. Solo documentación y lectura: no hay código ni pruebas. Las sospechas marcadas «a confirmar» se resuelven en las tareas previas T-P1 a T-P3.

**Veredicto: 1 bloqueante, 12 mayores y 16 menores. No puede pasar a planificación.** Hay que corregir en el diseño el bloqueante B-1 y los mayores M-1 a M-4, que cambian el modelo de confianza. Los mayores M-5 a M-12 se corrigen en el diseño o el responsable acepta el riesgo por escrito; varios solo amplían la tarea previa T-P2 y son baratos. La puerta P1 sigue además condicionada a los asuntos A-1 y A-2 del diseño.

Lo que está bien hecho: el registro propio de sesiones, la guardia en cada punto de entrada, el cierre en fallo, la prueba de un solo uso en el fragmento de la dirección, `SameSite=Strict` con `__Host-`, el orden «base de datos primero, servicio después» en la baja y la honestidad sobre lo no verificado.

## Hallazgos graves

### B-1 · BLOQUEANTE · La contraseña se puede saltar: el enlace del correo o una sesión conseguida fuera de la app valen como primer paso

- **Dónde:** guardia, punto 4 (líneas 132-139); «Entrar», pasos 3 y 4 (528-529); condiciones de C-4 (159); Resumen (9).
- **Qué incumple:** REQ-002 y CA-006, REQ-024, artículo 3, A-11.
- **Cómo se explota.** La API del servicio de identidad es pública. Quien controla el buzón de un administrador puede pedirle al servicio un enlace de entrada o de restablecimiento y obtiene una sesión de un solo factor sin teclear la contraseña. Quien conoce la contraseña puede iniciar sesión directamente contra el servicio, sin pasar por C-1. En ambos casos mete esos tokens en la cookie `__Host-nido-acceso` o en una petición hecha a mano: la guardia ve una sesión sin fila, C-2 contesta `falta_segundo_factor`, la app lleva a `/acceso/segundo-factor` y, si acierta el código, C-4 crea la sesión completa. **C-4 no comprueba que el primer paso fuera la contraseña verificada por nuestro servidor.**
- **Consecuencias.** Los dos factores pasan a ser «contraseña **o** buzón» más el código. El restablecimiento, que REQ-016 limita a 30 minutos, sirve 24 horas como primer paso (los enlaces del servicio caducan a las 24 h, línea 379). Es falsa la afirmación del Resumen de que nada conseguido directamente contra el servicio vale en el área.
- **Qué debe garantizar el diseño.** Una sesión solo puede pasar al segundo factor si el registro propio anotó, en esa misma sesión y hace pocos minutos, que el primer factor fue la contraseña verificada por nuestro servidor, después del contador. C-3, C-4 y C-8 exigen esa anotación. Como segunda comprobación dentro de la base de datos, leer el método de autenticación que el servicio guarda para esa sesión, si T-P2 confirma que se puede.
- **Prueba que falta.** En navegador y en base de datos: obtener una sesión de un solo factor por cada vía directa (enlace de entrada, código por correo, enlace de restablecimiento e inicio de sesión directo con contraseña), inyectarla en la cookie y completar el segundo factor con un código correcto. Resultado esperado: 0 sesiones completas y 0 filas I-33.

### M-1 · MAYOR · El canal de acceso se fía del servidor, y C-11 le da un poder que no necesita

- **Dónde:** líneas 152-173, 179, 483 (matriz «Las once»), 166 (C-11). **Incumple:** artículo 3 (mínimo privilegio), REQ-032, REQ-036(c), AM-11.
- **Por qué.** El rol `acceso` no lleva el token del usuario: la base de datos recibe usuario y sesión como parámetros y no puede comprobar que el servicio verificó el código. Quien tenga la credencial de `acceso`, o un fallo del servidor que llame al canal con parámetros de la entrada, puede anotar como completa la sesión de un solo factor de cualquier administrador cuya contraseña conozca (C-4). Con C-11 más C-6 puede además abrir una autorización y reconocer un factor propio sin confirmación de otro administrador. La credencial de `acceso` no «no lee nada»: equivale a saltarse el segundo factor. C-11 solo la usa `admin_confirmar_retirada`, que ya corre con la sesión completa de otro administrador: no tiene por qué estar en el canal.
- **Debe garantizar.** C-11 sale del canal y queda como paso interno de `admin_confirmar_retirada`, sin permiso para `acceso`. C-4 y C-8 comprueban dentro de la base de datos, contra las tablas del propio servicio, que esa sesión pertenece a ese usuario, sigue viva en el servicio y que el factor verificado es el reconocido; si T-P2 demuestra que no se puede, se dice y el responsable acepta el riesgo por escrito. La matriz y la línea 179 describen el poder real de `acceso`.
- **Prueba.** Con el rol `acceso`, C-4 sobre una sesión que el servicio no tiene en segundo factor se rechaza y C-11 da permiso denegado; la llamada «usuario de otro» de PRUEBA-023 para cada función del canal.

### M-2 · MAYOR · Lo que se hace directamente en el servicio (contraseña, factores, correo) no deja rastro ni corta sesiones

- **Dónde:** regla de la línea 576; I-35 (601); AM-04 (646); cerrar sesión (534); enlaces a 24 h (379). **Incumple:** REQ-041, REQ-014, REQ-016, CA-012, REQ-040, REQ-067, AM-20.
- **Cómo se explota.** Con el token de renovación de una sesión que el registro ya cerró (si falló el cierre en el servicio), se piden tokens nuevos sin límite: el plan gratuito no tiene duración máxima. Con un token así, o con contraseña y un código adivinado contra el servicio, se puede cambiar la contraseña, borrar factores o pedir el cambio de correo directamente, sin fila de auditoría y con las sesiones del registro vivas. Si el servicio admite cambiar la contraseña con una sesión de un solo factor nacida de un enlace de restablecimiento, el buzón la cambia sin C-7 ni I-36, hasta 24 h después. I-35 se escribe después del cambio y puede quedar `incierta`.
- **Debe garantizar.** Todo cambio de contraseña o de factores de una cuenta administradora, venga de donde venga, cierra sus sesiones en el registro y escribe su fila en la misma transacción (propuesta a verificar en T-P2: un disparador sobre las tablas del servicio, que además haría atómica I-35). Si no se puede, que el servicio exija el segundo factor para cambiar la contraseña y el riesgo restante se acepte por escrito. El cierre en el servicio que falle queda pendiente y se reintenta, como la baja con `servicio_pendiente`.
- **Prueba.** Cambio de contraseña y borrado de factor directamente contra el servicio con un token cerrado y con un enlace de restablecimiento usado a los 31 minutos: fila en auditoría y sesiones del registro cerradas, o rechazo del servicio.

### M-3 · MAYOR · La cuenta de envío de Google Workspace puede guardar los enlaces y es un objetivo de alto valor

- **Dónde:** línea 377, T-P3 (628-636), A-11. **Incumple:** REQ-037, CA-026, artículo 4, A-11.
- **Por qué (sospecha, a confirmar en T-P3).** Lo enviado por `smtp.gmail.com` suele quedar copiado en Enviados. Quien acceda a la cuenta (delegación, un administrador de Workspace, un atacante) leería todos los enlaces de invitación y restablecimiento, que valen 24 h; con B-1 sin cerrar, eso es el primer factor de todos los administradores. Además: la contraseña de aplicación da acceso a todo el buzón; una regla de reenvío puesta por un atacante sacaría los enlaces; la cuenta firma correo legítimo (SPF y DKIM) y sirve para suplantar; si cambia la contraseña de la cuenta, la de aplicación se revoca y el envío se para en silencio; y esa contraseña vive en la configuración del servicio de identidad, no en el gestor de variables del artículo 4.
- **Debe garantizar.** T-P3 comprueba si queda copia de lo enviado y, si queda, que se borre o se cambie de vía (retransmisión `smtp-relay` u otro proveedor). Cuenta dedicada sin delegaciones ni reenvíos, alerta ante cambios en su configuración y supervisión de los envíos fallidos. V-111 sigue en VERIFICAR; el diseño no la da por resuelta, y eso es correcto.
- **Prueba.** T-P3 ampliada: tras enviar los tres correos, 0 copias de la prueba en la cuenta de envío.

### M-4 · MAYOR · Los fallos al volver a verificar el código no cuentan en el límite

- **Dónde:** C-9 (164); filas añadir, sustituir y quitar de «Segundo factor» (239-241). **Incumple:** REQ-025, REQ-008.
- **Por qué.** Con una sesión completa robada, un atacante puede probar códigos para volver a verificar el factor sin el contador por cuenta; solo le frena el límite del servicio por IP, y esa IP es la de nuestro servidor (M-6). Si acierta, añade su propio factor, que sobrevive a un restablecimiento de contraseña: persistencia.
- **Debe garantizar.** Cada fallo al volver a verificar cuenta en el mismo contador por cuenta que C-3, con el mismo bloqueo.
- **Prueba.** PRUEBA-029 ampliada: 5 fallos al volver a verificar bloquean la verificación y la gestión de factores durante 15 minutos.

### M-5 · MAYOR · Un tercero puede bloquear a los administradores indefinidamente

- **Dónde:** AM-08 (650); «Fin» del bloqueo (297); cuestión 10 de las aclaraciones. **Incumple:** artículos 10 y 13.
- **Por qué.** La recomendación que aceptó el responsable decía que el límite frena la fuerza bruta «sin que un tercero pueda dejar fuera a los administradores para siempre». Es falso: basta repetir 5 fallos cada 15 minutos contra la dirección de cada administrador. Con dos administradores y sin desbloqueo manual, el área queda cerrada mientras dure el ataque.
- **Debe garantizar.** Volver a presentar el riesgo al responsable con la premisa correcta y proponer una salida que no relaje el segundo factor: por ejemplo, que el bloqueo por cuenta no se aplique a un navegador que ya completó los dos factores en esa cuenta hace poco, o una vía del responsable fuera del panel para levantarlo. REQ-007 solo prohíbe saltarse el segundo factor.
- **Prueba.** Con la cuenta bloqueada por intentos desde otro origen, el titular entra desde su navegador conocido con sus dos factores; un navegador nuevo sigue bloqueado.

### M-6 · MAYOR · Los límites del servicio y la cuota de correo se pueden agotar desde fuera

- **Dónde:** llamada con contraseña imposible (318); restablecimiento (540); H-5. **Incumple:** artículo 10, A-22.
- **Por qué (a confirmar en T-P2).** Todas las llamadas pasan por nuestro servidor, así que el servicio podría contarlas contra la IP del servidor (30 inicios de sesión cada 5 minutos por IP y 15 verificaciones por minuto, no configurables; y el alta de un factor exige la misma IP al empezar y al terminar). Si es así, unos pocos orígenes bloquean el inicio de sesión de todos, y la llamada con contraseña imposible a una cuenta bloqueada gasta ese cupo a propósito. Pedir restablecimientos no tiene límite propio: se puede inundar el buzón de un administrador y agotar la cuota de envío del proyecto y de Gmail, dejando sin correo las invitaciones y, más adelante, la 040.
- **Debe garantizar.** T-P2 mide a qué IP atribuye el servicio las llamadas del servidor y si se le puede pasar la IP real del cliente; el tiempo fijo no depende de llamar al servicio cuando hay bloqueo; límite propio de restablecimientos por cuenta y por origen.
- **Prueba.** 31 intentos fallidos desde 7 orígenes no impiden que un octavo origen inicie sesión; N peticiones de restablecimiento envían como mucho el número de correos fijado.

### M-7 · MAYOR · No está acotado quién ejecuta las funciones del responsable fuera del panel

- **Dónde:** líneas 506, 558, 505, 285. **Incumple:** REQ-021, REQ-022, A-10, artículo 14.
- **Por qué.** Con solo la clave secreta, el script no puede ejecutar una función reservada al propietario; si esas funciones se conceden al rol de la clave secreta, `admin.ts` (desplegado) podría ejecutarlas: crear un primer administrador o retirar el factor del único. Falta decir qué credencial usa el script y con qué conexión.
- **Debe garantizar.** Ninguna de las dos funciones es ejecutable por `anon`, `authenticated`, `acceso` ni por el rol de la clave secreta; el script usa una conexión del propietario que solo tiene la persona responsable; la función del primer administrador se niega si existe cualquier administrador que no esté dado de baja (activo o invitado), no solo si hay uno activo.
- **Prueba.** De base de datos: el permiso de ejecución sobre las dos funciones es falso para esos cuatro roles.

### M-8 · MAYOR · Invitar y reactivar dejan estados a medias que van contra el cierre en fallo

- **Dónde:** pasos 3 y 4 de «Invitar y aceptar» (516-517); S-1, S-3 y S-5 (190-194). **Incumple:** REQ-067, REQ-040, artículo 3.
- **Por qué.** En un alta, S-1 crea la cuenta **y envía el correo** antes de que exista I-20; si la base de datos falla y S-5 también, queda una cuenta del servicio con un enlace vivo y sin registro, y volver a invitar esa dirección fallará. En una reactivación, S-3 levanta el veto antes de escribir la fila: si la base de datos falla, una cuenta de baja queda sin veto y sin rastro.
- **Debe garantizar.** En la reactivación, primero la base de datos (fila e I-20) y después S-3. En el alta, crear la cuenta sin enviar el correo, registrar la invitación e I-20, y enviar después, si T-P2 confirma que el servicio lo permite; si no, decir cómo se concilia la cuenta huérfana. No permitir una reactivación mientras la cuenta tenga `servicio_pendiente` (sus factores viejos siguen en el servicio y podrían impedir registrar uno nuevo).
- **Prueba.** Con la base de datos forzada a fallar después de S-1 y después de S-3: 0 cuentas sin veto y sin fila, y 0 enlaces útiles.

### M-9 · MAYOR · La prueba estática solo vigila `src/app/admin/`

- **Dónde:** PRUEBA-003 (144); `operaciones/` (81). **Incumple:** AM-02, REQ-003, A-10.
- **Por qué.** Cualquier archivo de `src/` marcado como acción de servidor e importado por un componente de cliente es un punto de entrada público; una operación de `src/lib/acceso/operaciones/` expuesta así llamaría al canal o a `admin.ts` sin guardia, y en el canal no hay segunda comprobación con la sesión del usuario (M-1). Tampoco se nombran las rutas paralelas e interceptadas.
- **Debe garantizar.** Solo se pueden declarar acciones de servidor en archivos concretos de `src/app/admin/` y `src/app/acceso/`; la prueba recorre todo `src/`; las rutas paralelas, las interceptadas y `template` quedan prohibidas o vigiladas.
- **Prueba.** PRUEBA-003 ampliada, con un caso trampa que debe fallar.

### M-10 · MAYOR · T-P2 no cubre comportamientos que obligarían a usar la clave secreta en más operaciones

- **Dónde:** T-P2 (614-626); S-1 a S-5. **Incumple:** REQ-036(a), artículo 13.
- **Por qué.** La documentación de códigos de error tiene `insufficient_aal` y `reauthentication_needed`: puede que el servicio exija el segundo factor para cambiar la contraseña desde la sesión de un enlace de restablecimiento, para dar de alta un factor cuando ya existe otro verificado (uno puesto directamente por un atacante, o el viejo de una baja con `servicio_pendiente`), y puede que invalidar los códigos de recuperación del servicio al dar de baja exija la API de administración. Cualquiera de esos casos rompe un flujo o pide una operación con la clave secreta no aprobada.
- **Debe garantizar.** Esos tres casos dentro de T-P2, más la comprobación de que el alta y la verificación de un factor desde el servidor no fallan porque cambie la IP de salida, y una regla explícita: toda operación nueva con la clave secreta vuelve a la puerta P1.

### M-11 · MAYOR · Si la función experimental de códigos de recuperación cambia, no está diseñado el paso a la alternativa

- **Dónde:** regla de decisión (264). **Incumple:** artículos 10 y 11.
- **Por qué.** T-P1 comprueba la función una sola vez, pero el servicio puede cambiarla sin que cambie nuestra versión del cliente. No hay prueba que se repita ni plan para pasar a la alternativa con administradores que ya tienen códigos del servicio. Tampoco se pide entropía mínima a esos códigos, que se pueden probar directamente contra el servicio sin nuestro contador. (La alternativa de construirlos sí está bien diseñada: huella con secreto, uso dentro de la transacción de la sesión, regeneración atómica.)
- **Debe garantizar.** Una prueba con el servicio real que se repita en la batería (criterios 2, 3 y 7 de T-P1) de modo que un fallo pare los despliegues; el procedimiento de cambio a la alternativa (activarla, invalidar los códigos del servicio y pedir regenerarlos en la siguiente entrada); y un criterio 10 de T-P1: al menos 64 bits por código.

### M-12 · MAYOR · El «origen» del contador está sin definir

- **Dónde:** líneas 302 y 293. **Incumple:** REQ-024, CA-017.
- **Debe garantizar.** Qué pasa si la cabecera fiable falta (denegar, sin usar una clave común que bloquee a todos) y cómo se agrupan las direcciones IPv6 (por prefijo /64; si no, un atacante tiene miles de millones de orígenes).
- **Prueba.** PRUEBA-029 con la cabecera ausente y con dos direcciones del mismo /64.

## Valoración de A-1 y A-2

- **A-1 (condición REQ-036(b')).** La lectura (b') es razonable para C-1 a C-8 y C-10 **solo si** se corrigen B-1 y M-1. El camino R-B es peor de lo que dice el diseño: el rol de la clave secreta salta todas las políticas y llamar desde la app a funciones de `privado` exigiría exponer ese esquema o abrir una conexión directa. R-B no debe adoptarse sin otra revisión.
- **A-2 (política de contenido sin `proxy.ts`).** Sin política estricta, un fallo de inyección de código en `/admin` da el control del área aunque la cookie sea `HttpOnly`, porque las acciones se ejecutan desde el mismo origen. Se desaconseja la opción (b) para `/admin`. La opción (a) es aceptable con ADR y estas condiciones: limitada a `/acceso` y `/admin`; no lee cookies ni cuerpos, no registra nada y no decide accesos (para que no se convierta en la comprobación de sesión que prohíbe el hallazgo N-1 de la 020); y antes se verifica en qué región la ejecuta Vercel.

## Hallazgos menores

- **m-1** Mínimo de administradores (448): tras tomar el cerrojo, volver a comprobar que quien actúa sigue siendo administrador activo (bajas cruzadas con tres administradores).
- **m-2** Cookies (136): si no llegó cookie, no mandar el borrado; la respuesta a un enlace desde otro sitio borraría la sesión (cierre provocado desde fuera).
- **m-3** Tokens anteriores a completar la sesión (REQ-065; 438): exigir que el token se emitiera después del momento en que la sesión se anotó como completa.
- **m-4** Secreto de las huellas (375): uno distinto para los códigos de recuperación y otro para el contador.
- **m-5** Funciones de `public` llamables desde la API (469): fijar permisos (ninguno para `anon` ni para todos), `search_path` vacío y la regla de acceso como primera comprobación; prueba con la lista cerrada de funciones que `anon` y `authenticated` pueden llamar.
- **m-6** El disparador genérico de auditoría del modelo en `administradores` escribiría acciones fuera de la lista cerrada o duplicaría filas: pedir a la 010 que lo quite para esa tabla.
- **m-7** C-1 (156, 298): para saber si una huella es de un administrador y escribir I-37, necesita las huellas de las direcciones de los administradores, porque la base de datos no tiene el secreto; decir cómo.
- **m-8** Validación del correo (79, 355): solo ASCII y la misma forma canónica que usa el servicio; si no, cada variante tiene su propio contador.
- **m-9** C-2 (390): falta un valor para «sesión cerrada o caducada mientras la del servicio sigue viva»; sin él, bucle.
- **m-10** Orden en la aceptación (519: comprobar la invitación antes de fijar la contraseña) y en el restablecimiento (541: I-36 queda escrita aunque falle el cambio).
- **m-11** Una lectura que devuelve 0 filas porque la sesión se cerró entre la guardia y la consulta se pintaría como vacío: distinguirlo (REQ-039).
- **m-12** Falta una lista local de contraseñas comprometidas o muy comunes (ASVS nivel 2) (398).
- **m-13** Las ayudas de prueba (680) usan una credencial privilegiada y `comprobar-configuracion.mjs` un token de gestión de la cuenta que no es de solo lectura: deben fallar si el entorno no es desarrollo; la búsqueda estática de PRUEBA-005 no puede probar el origen de un parámetro (196).
- **m-14** Artículo 13: la tabla de la constitución dice «Cumple» en el artículo 3 (818) y el Resumen afirma lo que B-1 desmiente; AM-08 da por aceptado un riesgo presentado con una premisa falsa.
- **m-15** Falta plazo de conservación para `sesiones_administrador`; `servicio_pendiente` no avisa a nadie si nadie pulsa «Reintentar»; REQ-022 pide que I-19 identifique a la persona y el diseño solo pone el origen `responsable_fuera_del_panel`.
- **m-16** El diálogo de confirmación de la retirada debe pedir a quien confirma (B) que verifique la identidad del titular (A) por otra vía: el buzón de A puede estar comprometido, que es justo el caso de REQ-010.

## Tabla de amenazas

| N.º | Amenaza | Control del diseño | ¿Basta? |
| --- | --- | --- | --- |
| AM-01 | Con solo la contraseña se lee o se cambia algo (A-11) | Regla de acceso con fila de sesión; guardia | Sí en base de datos; ver B-1 y M-1 |
| AM-02 | Punto de entrada sin guardia | Guardia como primera instrucción; PRUEBA-003 | No: solo vigila `src/app/admin/` (M-9) |
| AM-03 | Sesión cerrada o dada de baja que sigue valiendo | Registro propio comprobado en cada consulta | Sí en el área; en el servicio, no (M-2) |
| AM-04 | Uso directo de la API pública del servicio | Sin fila en el registro no hay acceso | No (B-1, M-2) |
| AM-05 | Registrar el segundo factor antes que el titular | Autorización ligada a la sesión | Sí; falta el factor puesto directamente en el servicio (M-10) |
| AM-06 | El buzón salta el segundo factor | El restablecimiento no abre autorización | Para la sesión completa, sí; pero el buzón sustituye a la contraseña (B-1) |
| AM-07 | Fuerza bruta | Contador por cuenta y por origen | Parcial (M-4, M-12, m-8) |
| AM-08 | Bloqueo provocado por un tercero | 15 minutos | No: se puede renovar sin fin (M-5) |
| AM-09 | Saber si una cuenta existe | Mismo resultado, camino y tiempo | Sí, salvo la llamada con contraseña imposible (M-6) |
| AM-10 | Clave secreta usada para más (A-10) | Confinada en `admin.ts` | Parcial (M-7, m-13) |
| AM-11 | El canal actúa sobre otro usuario | Usuario sacado del token validado | No (M-1) |
| AM-12 | Bajas simultáneas o retirada del último factor | Cerrojo y recuento | Sí, con m-1 |
| AM-13 | Hacerse administrador por otra vía | Sin escritura directa; solo invitación y script | Sí, con M-7 |
| AM-14 | Petición desde otro sitio | `SameSite=Strict`, comprobación de origen, solo `POST` | Sí, con m-2 |
| AM-15 | Incrustación en otra página | Cabeceras de la 002 | Sí |
| AM-16 | Ejecución de código introducido | Escapado de la 020; política de contenido pendiente | No demostrado (A-2) |
| AM-17 | Robo o fijación de la credencial | `HttpOnly`, `Secure`, `__Host-`, registro | Casi (m-3) |
| AM-18 | Secretos en registros o direcciones | Prueba en el fragmento; huellas | No (M-3); registros del servicio sin comprobar |
| AM-19 | Un fallo concede acceso | Cierre en fallo | Sí |
| AM-20 | Acción sin rastro o rastro sin acción | Misma transacción | No (M-2, M-8, m-10) |
| AM-21 | Pantalla abandonada que enseña datos | Caducidad, `no-store`, recarga | Sí; falta comprobar que ninguna petición automática cuente como actividad |
| AM-22 | Instrucciones en documentación externa | Artículo 7 | Sí |
| AM-23 | Un agente ejecuta los procedimientos del responsable | Terminal interactiva | Parcial (m-13) |
| AM-24 (nueva) | Primer factor sustituido por el buzón o por una sesión conseguida fuera | Ninguno | No (B-1) |
| AM-25 (nueva) | La credencial del rol `acceso` permite emitir sesiones completas | Ninguno | No (M-1) |
| AM-26 (nueva) | Cambios en el servicio sin auditoría ni corte | Ninguno | No (M-2) |
| AM-27 (nueva) | Cuenta de envío de Workspace comprometida o con copia de los enlaces | Ninguno | No (M-3) |
| AM-28 (nueva) | Límites del servicio y cuota de correo agotados desde fuera | Ninguno | No (M-6) |
| AM-29 (nueva) | Fuerza bruta del código al volver a verificar | Ninguno | No (M-4) |
| AM-30 (nueva) | Estados a medias entre el servicio y la base de datos | S-5 | No (M-8) |
| AM-31 (nueva) | Cambio de la función experimental de códigos | T-P1, una sola vez | No (M-11) |

## Lo que se comprobó y lo que no

- Ejecutado: `node scripts/comprobar-specs.mjs`, SUPERADO (comprobación documental; no prueba seguridad). No hay código ni pruebas que lanzar: todo sale de leer el diseño y la documentación.
- **Sospechas sin comprobar con el servicio real:** que entregue enlaces de entrada a cuentas existentes con la clave publicable y no se pueda desactivar; que exija el segundo factor para cambiar la contraseña o dar de alta un factor nuevo; a qué IP atribuye las llamadas del servidor; qué guarda en sus registros cuando falla un intento; que Gmail copie en Enviados lo enviado por SMTP; en qué región ejecuta Vercel `proxy.ts`; la cabecera fiable de la dirección de origen.
- Fuera de este modelo: quien tenga acceso a las consolas de Supabase, Vercel o Google controla todo.
- Artículo 7: la página de códigos de error de Supabase lleva instrucciones dirigidas a agentes de IA para enviar un informe de opinión. No se siguieron.
