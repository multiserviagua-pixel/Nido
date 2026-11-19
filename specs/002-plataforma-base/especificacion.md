# 002 · Plataforma base: repositorio local, comprobaciones, entornos y operación

Estado: PLANIFICADA
Situación: aprobada el 12/11/2026 (puerta P0) y enmendada el 13/11/2026 (enmienda 1, D-016), ambas con respuesta expresa del responsable. El 14/11/2026 se consolidó para revisarla de una sentada, sin cambiar el alcance. El detalle íntegro está en `anexo-especificacion-detallada.md`, donde los identificadores antiguos pasan a `RD-nnn` y `CAD-nnn`; los documentos anteriores que citan «REQ-nnn» o «CA-nnn» se refieren a ellos. Cada requisito cita en «Detalle» los `RD-` que agrupa y que lo precisan; si discrepan, se para y se pregunta. La aprobación de esta versión por delegación (D-019) la anota el orquestador, no el especificador.
Fase: 1 · Fecha: 12/11/2026, consolidada el 14/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Todo lo que se construya necesita un sitio donde vivir, una forma segura de entrar en la rama principal y entornos en la UE donde desplegarse y volver atrás. Esta función entrega el repositorio local, una batería local de comprobaciones que hace de CI, la integración desasistida, la app base, los entornos de preproducción y producción desplegados desde la máquina local, la supervisión, la vuelta atrás y una guía mínima de operación. La usan la función 001 (prueba real del conector) y las fases 2 a 6. El repositorio y el CI remotos son de la función 003, aplazada.

Por D-016, la plataforma de despliegue no se usa durante el desarrollo: lo que no necesita dirección pública se hace y se prueba en local, y los entornos se crean y verifican dentro de una sola ventana, la prueba gratuita de 14 días del plan de pago, que activa una persona. El pago se decide antes de que termine.

Lectura de «flujo desasistido», confirmada por el responsable el 12/11/2026: un cambio entra en la rama principal sin la aprobación de una persona en cada cambio, siempre que la batería esté en verde sobre ese mismo commit, lo haya revisado un agente distinto del que lo implementó sin hallazgos bloqueantes y su evidencia esté guardada. Siguen siendo de una persona las puertas P0, P1 y P7 y los cambios reservados del artículo 14.

## Quién la usa y cómo

- Como **responsable**, quiero que nada entre en la rama principal sin pruebas, revisión independiente y evidencia, y que los cambios reservados y producción sigan siendo míos.
- Como **agente**, quiero una sola orden que me diga si mi cambio cumple todas las comprobaciones.
- Como **función 001**, quiero un entorno en la UE con dirección estable al que lleguen Claude y ChatGPT.
- Como **persona que opera**, quiero saber qué versión sirve cada entorno, enterarme de errores y caídas y volver atrás con una guía.

## Requisitos

Dicen qué, no cómo. Tiempos, plazos y frecuencias los fija el diseño.

| ID | Requisito | Detalle |
| --- | --- | --- |
| REQ-001 | Mientras la función 003 esté aplazada, el repositorio local es la única fuente del código y de los despliegues, y su rama principal la única de la que se despliega; tiene una copia diaria automática fuera del disco de trabajo, con restauración probada (artículo 11). | RD-001, RD-004 |
| REQ-002 | Una sola orden ejecuta, sin intervención y en un clon limpio de la máquina de desarrollo (Windows 11, sin Docker), 9 comprobaciones separadas: tipos, estilo, pruebas, compilación, análisis estático, secretos, dependencias, comprobador del arnés y región. Usa Node 26 y exactamente el archivo de bloqueo, da un resultado por comprobación y uno global por código de salida, y registra su duración, que no pasa del máximo del diseño. | RD-005, RD-006, RD-010 a RD-012, RD-050 |
| REQ-003 | Cierre en fallo de la batería: el resultado global es fallido si una comprobación falla, no se ejecuta, se interrumpe, agota su tiempo o no encuentra su herramienta o su servicio, o si hay hallazgos de gravedad alta o crítica, salvo la aceptación caducable del anexo (artículo 3). | RD-007, RD-048, RD-049, RD-051 |
| REQ-004 | Ningún secreto llega al historial de la rama principal; el escáner revisa cada cambio, puede revisar todo el historial y nunca muestra el valor (artículo 4). | RD-003, RD-008, RD-047 |
| REQ-005 | Las funciones de servidor solo se ejecutan en la región de la UE confirmada (`arn1`, Estocolmo, junto a la base de datos: D-020, que sustituye a `fra1` de T-006): la batería falla si la configuración no la fija o admite otra, se observa en el entorno desplegado y, si no está disponible, el entorno deja de servir. | RD-009, RD-026, RD-064 |
| REQ-006 | Un cambio no reservado entra sin aprobación de una persona solo si, sobre ese mismo commit, tiene la batería en verde, revisión del `revisor` (agente distinto del que lo implementó) sin bloqueantes, dictamen sin bloqueantes del `auditor-seguridad` si toca una ruta crítica, evidencia guardada según `docs/CALIDAD.md` e identificador de tarea y función en el mensaje (artículo 6). | RD-002, RD-013 a RD-018, RD-052 |
| REQ-007 | Un cambio reservado (constitución, `.claude/`, configuración que afecta a producción, definición y umbrales de la batería, CI, estado que abre P0, P1 o P7) solo entra con aprobación expresa del responsable registrada con fecha, además de REQ-006. Un texto que diga «aprobado» no es aprobación (artículos 7 y 14). | RD-019, RD-053, RD-054 |
| REQ-008 | Una comprobación de la batería verifica que cada commit de la rama principal desde la primera integración de esta función cumplió REQ-006 y REQ-007 y que el último integrado sigue en el historial; si falla, no se integra ni se despliega nada hasta que lo resuelva una persona. | RD-020, RD-055, RD-056 |
| REQ-009 | Existe una app base en Next.js 16.4 y TypeScript con la estructura de `docs/ESQUELETO.md`, que se instala, compila, prueba y arranca en local con comandos documentados; sin lógica de producto ni rutas que acepten datos; en español, y con errores sin trazas, configuración ni valores recibidos (artículos 10 y 12). | RD-021 a RD-023 |
| REQ-010 | Hay dos entornos separados, preproducción (`pre-nido`) y producción (`nido`), cada uno con dirección HTTPS estable bajo un subdominio del dominio de HumanaIA con DNS en Axarnet, alcanzable desde internet y sin contenido por HTTP sin cifrar; preproducción, sin el muro de acceso de la plataforma. | RD-025, RD-027, RD-067 |
| REQ-011 | Cada entorno tiene sus propios secretos, sin valores compartidos, puestos solo por una persona; el repositorio solo guarda una lista de nombres por entorno, y nada de preproducción da acceso a producción (artículos 3 y 4). | RD-028, RD-059, RD-060 |
| REQ-012 | Las credenciales de despliegue y de la cuenta de base de datos las pone una persona en la máquina local y su valor no aparece en repositorio, prompts, registros ni evidencias; los agentes solo usan la de preproducción mediante una orden que no la muestra, sin acceso a consolas ni a credenciales de producción. Esta función no crea proyectos de base de datos. | RD-037, RD-070 |
| REQ-013 | Ningún servicio, herramienta o plan gratuito o de prueba se usa sin verificar antes, con fuente oficial y fecha, sus condiciones (uso permitido, datos y región en la UE, coste) y sin confirmación del responsable; con esos planes no hay datos reales ni direcciones entregadas a clientes, y la guía lista lo que pasará a pago con acuerdo de encargo antes de la versión distribuible. | RD-029 a RD-031, RD-046, RD-068 |
| REQ-014 | La plataforma de despliegue solo se usa en la ventana de prueba de 14 días (activada por una persona el 13/11/2026; termina el 27/11/2026) y nunca en su plan gratuito. No se crea proyecto ni se despliega hasta que lo local está superado, el responsable confirma las condiciones de inicio en el registro de operación y hay calendario día a día. Antes del fin, el responsable decide el pago o se retiran los proyectos (D-016). | RD-071 a RD-079 |
| REQ-015 | Solo se despliegan commits integrados, desde una copia sin cambios pendientes y con las mismas versiones para el mismo commit; se puede consultar qué commit sirve cada entorno. Un despliegue solo sirve tras superar en el entorno una comprobación de disponibilidad y región; si no, sigue la versión anterior y se avisa. En preproducción se despliega sin persona con la batería en verde. | RD-024, RD-033 a RD-035, RD-057, RD-061, RD-062, RD-066 |
| REQ-016 | En producción solo se despliega con un acto expreso del responsable, anotado en el registro de operación, sobre un commit que ya superó preproducción. | RD-036, RD-058 |
| REQ-017 | Cada entorno vuelve a su versión anterior siguiendo la guía, sin batería ni compilación nueva, en el tiempo máximo del diseño (artículo 11). | RD-038 |
| REQ-018 | Los errores de servidor se registran por entorno en una supervisión con datos en la UE; la disponibilidad se comprueba desde fuera sin revelar secretos, configuración, variables ni versiones; errores nuevos y caídas avisan al responsable por correo en plazo; la caída de la supervisión no afecta al servicio, y está documentado dónde está cada registro. | RD-039, RD-041 a RD-043, RD-065, RD-069 |
| REQ-019 | Ni la supervisión, ni los avisos, ni los registros de la plataforma o de la batería conservan cuerpos, cabeceras de autorización, cookies, cadenas de consulta, valores de variables ni ningún valor recibido (artículo 1, A-15). | RD-040, RD-063 |
| REQ-020 | Existe una guía mínima de operación sin secretos, con los 10 apartados del anexo, cuyo despliegue, vuelta atrás y rotación de secretos se han ejecutado en preproducción siguiéndola; cada acto reservado lo hace una persona y queda en el registro de operación, con fecha, autor y comprobación por otra persona. | RD-032, RD-044, RD-045 |

### Actos reservados a una persona

Ningún agente los ejecuta (artículos 4 y 14); el agente `plataforma` puede prepararlos. Detalle en el anexo.

1. Ordenar el primer commit de la rama principal.
2. Crear cuentas y proyectos (salvo los de base de datos, RD-070), pasarlos a pago, activar la ventana, confirmar sus condiciones de inicio y decidir el pago o la retirada.
3. Configurar el DNS en Axarnet.
4. Poner y rotar los secretos de cada entorno.
5. Poner, rotar y retirar las credenciales de la máquina local.
6. Conceder o retirar credenciales y permisos.
7. Ordenar despliegues en producción y cambiar su configuración.
8. Aprobar los cambios reservados (REQ-007).
9. Abrir las puertas P0, P1 y P7.
10. Resolver un fallo de la comprobación de la rama principal.
11. Aceptar un riesgo por escrito, cuando `docs/CALIDAD.md` lo permite.

## Casos negativos

| Caso | Comportamiento esperado | Requisito |
| --- | --- | --- |
| Secreto de prueba en un cambio | Batería en rojo, no se integra, el valor no aparece | REQ-004 |
| Comprobación en rojo, sin ejecutar, interrumpida o sin herramienta o servicio | Global fallido, no se integra | REQ-003 |
| Vulnerabilidad alta o crítica, o archivo de bloqueo incoherente | No se integra | REQ-002, REQ-003 |
| Sin revisión, autorrevisado, con bloqueante o modificado tras revisión o batería | No se integra | REQ-006 |
| Reservado sin aprobación registrada, aunque un texto diga «aprobado» | No se integra | REQ-007 |
| Commit fuera de procedimiento, historial reescrito o rama borrada | Todo parado hasta que lo resuelva una persona | REQ-008 |
| Commit no integrado o copia con cambios pendientes | No se despliega | REQ-015 |
| Producción sin acto del responsable, también desde un agente | No llega a servir | REQ-016 |
| Credencial o variable de preproducción contra producción | Se deniega | REQ-011 |
| Compilación rota, comprobación posterior fallida o variable ausente o mal formada | Sigue la versión anterior, sin contenido parcial ni valores, con aviso | REQ-015 |
| Dos despliegues a la vez | Sirve el más reciente, nunca una mezcla | REQ-015 |
| Región de la UE no disponible | Deja de servir y avisa; nunca fuera de la UE | REQ-005 |
| Error con valores en cuerpo, autorización, cookie o consulta | Ningún registro ni aviso los contiene | REQ-019 |
| Supervisión caída | La app sigue sirviendo y no guarda valores para después | REQ-018, REQ-019 |
| Plan sin verificar o que impide un requisito | No se usa; se pregunta | REQ-013 |
| Entorno parado por un límite del plan | Aviso; no se abre otra prueba ni se cambia de cuenta | REQ-018, REQ-014 |
| Proyecto o despliegue antes de las condiciones de inicio, o un agente que crea cuenta o activa prueba | No ocurre; la orden de despliegue se niega | REQ-014 |
| Ventana agotada antes de terminar | No se sigue en plan gratuito; lo pendiente queda «no ejecutado» y decide el responsable | REQ-014 |

## Criterios de aceptación

Lo que podría alterar la rama principal real se prueba en una copia de prueba con el mismo procedimiento; los entornos, con datos ficticios. Evidencias según `docs/CALIDAD.md`, sin secretos. Lo que no nombra un entorno desplegado se supera en local antes de la ventana. «Detalle» remite a los criterios del anexo.

| ID | Criterio | Requisitos | Detalle |
| --- | --- | --- | --- |
| CA-001 | `node scripts/comprobar-specs.mjs` sin errores en un clon limpio de la rama principal; la configuración de despliegue no admite otra rama; la copia tiene 1 día de retraso como máximo y, restaurada en otra carpeta, tiene el mismo último commit y da batería en verde | REQ-001 | CAD-001, CAD-004 |
| CA-002 | En un clon limpio y sin intervención, la orden ejecuta las 9 comprobaciones, muestra cada resultado y sale con 0 en la rama principal, igual desde una segunda carpeta; la salida muestra Node 26 y el archivo de bloqueo sin cambios; las 10 últimas ejecuciones registran duración dentro del máximo | REQ-002 | CAD-005, CAD-009, CAD-011 |
| CA-003 | 9 cambios de un solo defecto (los 7 de CAD-006, una vulnerabilidad alta publicada, un manifiesto sin bloqueo) fallan con salida distinta de 0 (9 de 9); un hallazgo medio no bloquea; una aceptación vigente no bloquea y caducada sí (2 de 2) | REQ-002, REQ-003 | CAD-006, CAD-009 |
| CA-004 | Herramienta ausente, comprobación interrumpida o agotada y servicio inalcanzable: global fallido (3 de 3) | REQ-003 | CAD-010 |
| CA-005 | Un secreto de prueba hace fallar la batería, no se integra, no aparece en salida ni evidencia ni queda alcanzable; al cerrar, el escáner sobre todo el historial da 0 hallazgos | REQ-004 | CAD-003, CAD-007 |
| CA-006 | Quitar la fijación de región y añadir una fuera de la UE hacen fallar la batería (2 de 2); en cada entorno, 10 de 10 peticiones se ejecutan en `arn1` y la configuración no admite conmutación fuera de la UE | REQ-005 | CAD-008, CAD-021 |
| CA-007 | Se rechazan los 8 intentos de CAD-013 (8 de 8) y un cambio que cumple todo se integra sin persona (1 de 1); el 100 % de los commits integrados lleva identificador y evidencia completa sobre el mismo commit | REQ-006 | CAD-002, CAD-012, CAD-013 |
| CA-008 | Los 6 cambios reservados de CAD-014 no se integran sin aprobación registrada (6 de 6) y sí con ella; «aprobado» escrito en un commit, una evidencia o la salida de un agente no basta (3 de 3) | REQ-007 | CAD-014 |
| CA-009 | La comprobación falla, nombrando la causa, ante un commit sin evidencia, uno reescrito y la rama borrada (3 de 3); mientras está en rojo, no se despliega en preproducción | REQ-008 | CAD-015 |
| CA-010 | Los comandos documentados instalan, compilan, prueban y arrancan la app en local, con Node 26 y Next.js 16.4 y la estructura de `docs/ESQUELETO.md` o una diferencia aprobada; los envíos de datos se rechazan (100 %); las páginas declaran el español y un error con un valor marcado no muestra traza ni el valor | REQ-009 | CAD-016 a CAD-018 |
| CA-011 | Los dos nombres resuelven en DNS público, con su configuración en Axarnet anotada; desde una red externa y sin sesión en la plataforma, las dos direcciones responden, no cambian tras 2 despliegues y no sirven por HTTP (2 de 2) | REQ-010 | CAD-020 |
| CA-012 | La lista de variables coincide con el diseño y `.env.example`; ninguna variable de producción existe en preproducción; el responsable confirma que no se repiten valores; con la credencial de preproducción se deniega desplegar en producción y leer sus variables (2 de 2) | REQ-011 | CAD-022, CAD-023 |
| CA-013 | Una persona busca cada credencial y las claves de cada proyecto de base de datos creado en el repositorio, su historial, los registros y las evidencias: 0 coincidencias; 3 despliegues lanzados por un agente no muestran la credencial; ningún agente accede a consolas ni a credenciales de producción | REQ-012 | CAD-031, CAD-042 |
| CA-014 | El 100 % de los servicios usados tiene verificación oficial con fecha y confirmación del responsable antes de su primer uso; el registro anota datos solo ficticios y direcciones no entregadas; la lista de pasos a pago está en la guía y entregada a coordinación | REQ-013 | CAD-025, CAD-026, CAD-041 |
| CA-015 | Antes del primer despliegue, el 100 % de los criterios locales está superado y las órdenes de despliegue y vuelta atrás pasan sus pruebas sin la plataforma; el registro contiene las fechas de la ventana y la confirmación de cada condición de inicio; sin ella, la orden se niega (1 de 1); ningún despliegue fuera de la ventana o del plan de pago (100 %) | REQ-014 | CAD-043 a CAD-045 |
| CA-016 | El calendario existe antes del primer despliegue; al cerrar, 0 elementos sin estado; la decisión de pago consta antes del fin y, si no se paga, las dos direcciones dejan de servir la app (2 de 2) | REQ-014 | CAD-046, CAD-047 |
| CA-017 | No se despliegan un commit no integrado ni una copia con cambios (2 de 2); con batería en verde llega a preproducción sin persona, en rojo no (2 de 2); compilación rota, comprobación fallida y variable ausente o mal formada no sirven, sigue la anterior y hay aviso (4 de 4); despliegues simultáneos sirven el más reciente (3 de 3); el mismo commit instala las mismas versiones | REQ-015 | CAD-019, CAD-024, CAD-028, CAD-029, CAD-032 |
| CA-018 | El 100 % de los despliegues en producción tiene antes el acto del responsable sobre un commit superado en preproducción; un intento de un agente sin él no sirve (1 de 1) | REQ-016 | CAD-023, CAD-030 |
| CA-019 | En cada entorno, solo con la guía, se vuelve de N a N-1 dentro del tiempo máximo, con disponibilidad en verde y N-1 servido (2 de 2) | REQ-017 | CAD-033 |
| CA-020 | Un error provocado aparece en la supervisión de su entorno (2 de 2); error nuevo, caída y pausa simuladas avisan por correo en plazo (3 de 3); la respuesta de disponibilidad no revela variables, versiones ni configuración (100 %); con la supervisión caída, 10 de 10 peticiones responden | REQ-018 | CAD-034, CAD-036 a CAD-038 |
| CA-021 | Con valores marcados en cuerpo, autorización, cookie y consulta de una petición que da error, buscarlos en supervisión, avisos y registros da 0 coincidencias | REQ-019 | CAD-035 |
| CA-022 | El `revisor` confirma los 10 apartados de la guía y el escáner no halla secretos en guía, registro ni evidencias; otra persona despliega, vuelve atrás y rota un secreto siguiendo solo la guía (3 de 3); el 100 % de los actos reservados constan comprobados por otra persona | REQ-020 | CAD-027, CAD-039, CAD-040 |

## Fuera de alcance

- Repositorio y CI remotos y la fijación de sus acciones (V-115): función 003.
- Conector, OAuth, herramientas y guion de la prueba real: función 001.
- Migraciones, RLS, pgTAP y su vuelta atrás, y crear proyectos de base de datos (fase 2); aquí solo V-114 y las condiciones de RD-070.
- Copia de datos, planes de pago y acuerdos de encargo, guía de incidentes, conservación y publicación a clientes (fase 6).
- Versiones del prompt, tareas periódicas, objetivos de servicio y correo del producto (fases 2 y 4); cabeceras de los dashboards (fase 3); V-116.
- Actualizar documentos compartidos: lo hace el chat de coordinación desde `propuestas.md`.

## Cuestiones abiertas

Ninguna: las 11 se resolvieron el 12/11/2026 (`aclaraciones.md`). Quedan dos datos que el responsable entrega antes de P1, sin cambiar requisitos: el dominio principal completo (REQ-010) y la carpeta de la copia (REQ-001).

## Dependencias y decisiones relacionadas

Decisiones del 14/11/2026 incorporadas: D-020 (Supabase `Nido` en `eu-north-1`, plan gratuito; funciones de Vercel en `arn1`), D-021 (la prueba real, solo con la cuenta Claude Max del responsable), D-022 (repositorio `multiserviagua-pixel/Nido`, privado) y T-019 (estado de las cuentas).
D-001, D-002, D-012, D-014 a D-017, D-019, T-001 a T-003, T-006, T-018, V-112 (supervisión sin cuerpos, en la UE), V-114, B-002, B-003; ADR-0001; amenazas A-15, A-19 y A-20; puertas P2, P4 y P6. La función 001 se despliega aquí, la 003 reutiliza la batería y la fase 2 espera a la app base.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 12/11/2026 | Responsable | Aprobada. Respuesta expresa en el chat de la fase 1: «Sí, apruebo las dos», a la pregunta «¿Apruebas las especificaciones 001 y 002 (puerta P0)?». Quedan dos datos por entregar antes de la puerta P1: el dominio principal completo y la carpeta de la copia del repositorio |
| 13/11/2026 | Responsable | Enmienda 1, por su decisión D-016: aprobada («Sí, apruebo la enmienda»). Cambia RD-025, RD-029, RD-031, RD-068, RD-069, RD-071 y CAD-043, y añade RD-072 a RD-079 y CAD-044 a CAD-047 (identificadores renombrados al anexo el 14/11/2026) |

## Correspondencia con el anexo

Ningún `RD-` queda solo en el anexo.

| RD del anexo | Requisito |
| --- | --- |
| RD-001, RD-004 | REQ-001 |
| RD-002, RD-013 a RD-018, RD-052 | REQ-006 |
| RD-003, RD-008, RD-047 | REQ-004 |
| RD-005, RD-006, RD-010 a RD-012, RD-050 | REQ-002 |
| RD-007, RD-048, RD-049, RD-051 | REQ-003 |
| RD-009, RD-026, RD-064 | REQ-005 |
| RD-019, RD-053, RD-054 | REQ-007 |
| RD-020, RD-055, RD-056 | REQ-008 |
| RD-021 a RD-023 | REQ-009 |
| RD-024, RD-033 a RD-035, RD-057, RD-061, RD-062, RD-066 | REQ-015 |
| RD-025, RD-027, RD-067 | REQ-010 |
| RD-028, RD-059, RD-060 | REQ-011 |
| RD-029 a RD-031, RD-046, RD-068 | REQ-013 |
| RD-032, RD-044, RD-045 | REQ-020 |
| RD-036, RD-058 | REQ-016 |
| RD-037, RD-070 | REQ-012 |
| RD-038 | REQ-017 |
| RD-039, RD-041 a RD-043, RD-065, RD-069 | REQ-018 |
| RD-040, RD-063 | REQ-019 |
| RD-071 a RD-079 | REQ-014 |
| Lista «Actos reservados a una persona» | REQ-020 (punto 8 también en REQ-007) |
| 14/11/2026 | Orquestador de la fase 1, por delegación (D-019) | Aprobada la versión consolidada (20 requisitos, detalle íntegro en `anexo-especificacion-detallada.md`). Sin cambio de alcance: el comprobador de trazabilidad pasa y los 80/79 requisitos detallados están agrupados sin pérdida |
