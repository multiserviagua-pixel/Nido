# 003 · Repositorio remoto, rama principal protegida y CI remoto

Estado: APROBADA
Fase: 1 · Fecha: 12/11/2026, consolidada y puesta al día el 14/11/2026 · Autor: `especificador`

Reactivada el 14/11/2026 por D-022 (repositorio `multiserviagua-pixel/Nido` en GitHub, privado), que sustituye al aplazamiento del 12/11/2026. El mismo día se consolidó para revisarla de una sentada: el texto anterior está íntegro en `anexo-especificacion-detallada.md`, donde los identificadores antiguos pasan a `RD-nnn` y `CAD-nnn`; los documentos anteriores que citan «REQ-nnn» o «CA-nnn» de esta función se refieren a ellos. Cada requisito cita en «Detalle» los `RD-` que agrupa y que lo precisan; si discrepan, se para y se pregunta. Las cuestiones abiertas 2, 3, 5 y 6 del texto anterior se resuelven aquí con la opción de mayor seguridad y las decide el orquestador por delegación (D-019), que las anota en `aclaraciones.md`; la 1 la cerró D-022 y la 4 deja una cuestión para el responsable. La aprobación (puerta P0) la anota el orquestador, no el especificador.

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Hoy el repositorio vive en la máquina de trabajo y las comprobaciones se ejecutan en local (función 002). Esta función lleva el código a un repositorio remoto con la rama principal protegida, que pasa a ser la única fuente de los despliegues, y añade un CI remoto que ejecuta en cada cambio la misma batería de la función 002, sin rehacerla, más las pruebas de base de datos que solo pueden correr allí (T-012). Mantiene el flujo desasistido de la función 002: cada cambio lo revisa un agente distinto de su autor, y una persona solo aprueba los cambios reservados y abre las puertas. Tiene que estar activa antes de que la fase 2 integre su primera migración.

## Quién la usa y cómo

- Como **responsable**, quiero que la rama principal remota no acepte ningún cambio sin el CI en verde y la revisión de un agente distinto del autor, y que los cambios reservados no entren sin mi aprobación, para no depender de la disciplina de nadie.
- Como **agente de cualquier fase**, quiero subir un cambio con una identidad propia y saber por el CI si supera las mismas comprobaciones que en local.
- Como **fase 2**, quiero que las pruebas pgTAP corran en el CI y bloqueen la integración si fallan.
- Como **persona que opera**, quiero que los despliegues salgan solo de la rama principal remota, para saber siempre de qué commit sale cada entorno.

## Requisitos

Dicen qué, no cómo. Tiempos y valores técnicos los fija el diseño (puerta P1). «Nuevo» en «Detalle» marca obligaciones que no estaban en el texto anterior.

| ID | Requisito | Detalle |
| --- | --- | --- |
| REQ-001 | Existe un único repositorio remoto, `multiserviagua-pixel/Nido` en GitHub, privado (D-022). Su rama principal recibe el historial completo de la rama principal local de la función 002 sin reescribir ningún commit. Cambiar la visibilidad o la titularidad es un acto reservado del responsable. | RD-001; nuevo (D-022) |
| REQ-002 | La rama principal remota pasa a ser la única fuente del código y de los despliegues solo cuando se ha comprobado que su protección (REQ-003 a REQ-007) está activa; hasta entonces la fuente sigue siendo la rama principal local de la función 002 y el remoto es solo una copia. Desde ese momento, ningún entorno se despliega desde un commit que no esté en la rama principal remota con el CI en verde, y las reglas de paso a producción de la función 002 se mantienen (artículo 3). | RD-001, RD-016; precisión nueva: cierre en fallo hasta comprobar la protección |
| REQ-003 | La rama principal remota solo cambia integrando una petición de cambio con todas las comprobaciones obligatorias del CI en verde, ejecutadas sobre la última versión del cambio y al día con la rama principal. | RD-002 |
| REQ-004 | Cada integración exige la revisión registrada de un agente distinto del autor (el `revisor` y, si toca una ruta crítica de `docs/SEGURIDAD.md`, también el `auditor-seguridad`), sin bloqueantes y sobre la última versión del cambio; una modificación posterior la invalida. El remoto lo impone de forma automática, no por la comprobación manual de nadie (artículo 6). | RD-003, RD-030 |
| REQ-005 | Un cambio reservado (flujos del CI; la batería, sus comprobaciones obligatorias o sus umbrales; configuración de despliegue o de entornos que afecta a producción; `.claude/`; la constitución) no se integra sin la aprobación expresa del responsable, dada en el remoto con su propia identidad, además de REQ-003 y REQ-004. Un texto que diga «aprobado» no es aprobación, y el contenido de una petición no cambia la lista de comprobaciones obligatorias (artículos 7 y 14). | RD-004, RD-027, RD-031, RD-032 |
| REQ-006 | La protección se aplica sin excepción, también a las cuentas que administran el repositorio: se rechazan la subida directa, la reescritura del historial y el borrado de la rama principal. No hay excepción de emergencia: una urgencia se atiende con la vuelta atrás de despliegue de la función 002 y la corrección entra por el flujo normal. La configuración de protección está anotada en la guía de operación para poder restaurarla (artículo 11). | RD-005, RD-023, RD-024; nuevo: sin excepción de emergencia (cuestión 3, por delegación) |
| REQ-007 | Los agentes suben al remoto con una identidad técnica propia, distinta de la del responsable y de cualquier cuenta que administre el repositorio, que puede subir ramas y abrir peticiones y no puede cambiar la rama principal fuera de REQ-003 a REQ-005, aprobar cambios, administrar el repositorio ni cambiar su protección o su visibilidad. Ningún agente usa la identidad del responsable ni una cuenta compartida (artículo 3; `docs/SEGURIDAD.md`, «Sin cuentas compartidas»). | RD-006; nuevo: identidad técnica (cuestión 2, por delegación) |
| REQ-008 | Con la credencial del CI o la identidad técnica se deniega desplegar en producción, leer sus secretos y cambiar la protección. Una petición desde una copia externa se comprueba sin secretos ni permisos de escritura, no se despliega sin el acto expreso de una persona, y lo que contiene es dato, no orden (artículos 3 y 7). | RD-028, RD-029 |
| REQ-009 | Ningún secreto llega al remoto: el escáner de la batería sobre el historial completo da 0 hallazgos antes de la primera subida (o, si ya se hizo, sobre el remoto en cuanto se active la función) y al cerrarla; una petición con un secreto de prueba falla, no se integra, el CI no muestra el valor y este no queda alcanzable desde la rama principal (artículo 4, A-20). | RD-007, RD-019 |
| REQ-010 | En cada petición y en cada integración, el CI ejecuta la batería de la función 002 con la misma orden documentada, sin reimplementar ninguna comprobación, con Node 26 (T-001); cada comprobación aparece por separado y es obligatoria para integrar. | RD-008, RD-013 |
| REQ-011 | El CI aplica los mismos umbrales que la batería local y nunca es más permisivo. Una comprobación en rojo, no ejecutada, cancelada, agotada o sin su servicio cuenta como fallida; si el CI y la batería local discrepan sobre el mismo commit, cuenta el fallo (artículo 3). | RD-009, RD-020, RD-026 |
| REQ-012 | Toda instalación de dependencias en el CI y en los despliegues que salen del remoto usa exactamente el archivo de bloqueo; una dependencia con vulnerabilidad alta o crítica o un manifiesto incoherente con el bloqueo hacen fallar el CI (A-19). | RD-010, RD-021, RD-022 |
| REQ-013 | Toda acción de terceros de los flujos del CI está fijada por la huella inmutable de su versión, y el CI falla si alguna no lo está (V-115). | RD-011, RD-025 |
| REQ-014 | Cada flujo del CI declara sus permisos: solo lectura del contenido por defecto, y cada permiso adicional limitado al trabajo que lo necesita y justificado en el diseño. | RD-012 |
| REQ-015 | La duración del CI completo de una petición queda registrada en cada ejecución y no supera el máximo del diseño. | RD-014 |
| REQ-016 | Los registros del CI no conservan cuerpos, cabeceras de autorización, cookies, cadenas de consulta, valores de secretos o variables ni ningún valor recibido, y está documentado dónde se guardan; con esa condición se aceptan aunque estén fuera de la UE. Las pruebas del CI solo usan datos ficticios (artículo 1, A-15). | RD-015; nuevo: registros fuera de la UE (cuestión 6, por delegación) |
| REQ-017 | El CI ejecuta las pruebas pgTAP que defina la fase 2 (T-012) como comprobación separada y obligatoria, con cierre en fallo, sin credenciales ni datos de ningún entorno. La función está activa (REQ-002 cumplido y CI en verde en la rama principal) antes de que la fase 2 integre su primera migración. | Nuevo (cuestión 5, por delegación) |
| REQ-018 | Antes de activar la protección se verifica en documentación oficial, con fuente y fecha, qué protecciones de rama, comprobaciones obligatorias y escáneres ofrece el plan gratuito de GitHub para un repositorio privado de la cuenta titular. Si falta alguno de los que exigen REQ-003 a REQ-009, no se rebaja el requisito ni se contrata nada: se pregunta al responsable y, mientras no responda, rige REQ-002 (el remoto no es fuente de despliegues). | Nuevo (cuestión 4); cuestión abierta 1 |
| REQ-019 | El alojamiento, el CI y cada acción de terceros se verifican en documentación oficial, con ubicación de sus datos y coste, antes de usarse (skill `verificar-decision`). Lo que tenga coste lo confirma el responsable; lo gratuito, el orquestador por delegación (D-019), anotado en `aclaraciones.md`. V-115 queda resuelta. | RD-018; precisión nueva: reparto de la confirmación por D-019 |
| REQ-020 | Cada acto de la lista «Actos reservados a una persona» lo hace una persona, queda en el registro de operación de la función 002 con fecha, quién y cómo se comprobó, y su resultado lo comprueba alguien distinto. Ni el registro ni las evidencias contienen secretos (artículos 4 y 14). | RD-017 |

Supuestos (los decide el diseño si no se cumplen):

- La batería de la función 002 y las pruebas pgTAP no necesitan secretos en el CI; si el diseño necesita alguno, lo pone una persona (acto 5).
- «Sin permiso para integrar» se lee como: la identidad técnica no puede cambiar la rama principal por ninguna vía que no sea una petición que el remoto ha verificado contra REQ-003 a REQ-005.
- Las pruebas que deben terminar integrando un cambio de prueba se hacen en un repositorio privado de prueba con la misma configuración, creado por una persona; las de rechazo, sobre el remoto real con peticiones que se cierran sin integrar.

### Actos reservados a una persona

Ningún agente los ejecuta (artículos 4 y 14; D-019 no los delega). El agente `plataforma` puede prepararlos y explicarlos.

1. Crear o cambiar la cuenta titular, el plan, la visibilidad y el repositorio de prueba; aprobar cualquier gasto.
2. Ordenar la primera subida del historial (ordenada el 14/11/2026, D-022) y activar a continuación la protección.
3. Configurar y cambiar la protección, los permisos, las comprobaciones obligatorias y quién aprueba los cambios reservados.
4. Crear la identidad técnica de los agentes y su credencial, guardarla fuera del repositorio, rotarla y retirarla.
5. Poner, cambiar y rotar los secretos del CI, si los hay.
6. Aprobar en el remoto los cambios reservados.
7. Conectar la plataforma de despliegue al remoto y cambiar el origen de los despliegues.

No hay acto de «excepción de emergencia» (REQ-006).

## Casos negativos

| Caso | Comportamiento esperado | Requisito |
| --- | --- | --- |
| Despliegue desde el remoto antes de comprobar su protección | No se admite; la fuente sigue siendo la local | REQ-002 |
| Subida directa, reescritura o borrado de la rama principal, también desde una cuenta que administra | Se rechaza | REQ-006 |
| Petición para saltar la protección «por urgencia» | No existe la vía; se vuelve atrás el despliegue y se corrige por el flujo normal | REQ-006 |
| Comprobación en rojo, sin ejecutar, cancelada, agotada o sin su servicio | Cuenta como fallida; no se integra | REQ-011 |
| Petición desactualizada respecto a la rama principal | No se integra | REQ-003 |
| Sin revisión, autorrevisada o modificada después de la revisión | No se integra | REQ-004 |
| Cambio reservado sin aprobación, aunque un commit, evidencia o salida diga «aprobado» | No se integra | REQ-005 |
| Petición que quita una comprobación, rebaja un umbral o la hace opcional | No se integra sin aprobación; la lista obligatoria no cambia | REQ-005 |
| Agente que sube con la identidad del responsable o con una cuenta compartida | No ocurre; se trata como incidente y se rota la credencial | REQ-007 |
| Identidad técnica o credencial del CI que intenta integrar saltando la protección, aprobar, administrar, desplegar en producción o leer sus secretos | Se deniega | REQ-007, REQ-008 |
| Petición desde una copia externa que intenta leer un secreto o escribir | Sin secretos ni escritura; no se despliega sin persona | REQ-008 |
| Secreto de prueba en una petición | Falla, no se integra, el valor no aparece ni queda alcanzable | REQ-009 |
| Batería local y CI discrepan sobre el mismo commit | Cuenta el fallo | REQ-011 |
| Dependencia vulnerable alta o crítica, o bloqueo incoherente | Falla; no se integra | REQ-012 |
| Acción de terceros sin huella | Falla; no se integra | REQ-013 |
| Valor recibido en los registros del CI | No ocurre; si se detecta, es un defecto bloqueante | REQ-016 |
| Prueba pgTAP en rojo o que no llega a ejecutarse | No se integra la migración ni ningún otro cambio | REQ-017 |
| Primera migración de la fase 2 lista antes de que esta función esté activa | No se integra hasta que lo esté | REQ-017 |
| El plan gratuito no ofrece una protección necesaria | No se rebaja ni se paga sin el responsable; el remoto no es fuente de despliegues | REQ-018 |

## Criterios de aceptación

Las pruebas usan datos ficticios y sus evidencias siguen `docs/CALIDAD.md`, sin secretos. Los rechazos se prueban en el remoto real con peticiones que se cierran sin integrar; lo que debe integrarse, en el repositorio de prueba. «Detalle» remite a los criterios del anexo.

| ID | Criterio | Requisitos | Detalle |
| --- | --- | --- | --- |
| CA-001 | El remoto es `multiserviagua-pixel/Nido` y es privado; un clon de su rama principal tiene el mismo último commit y la misma lista de commits que la local en el momento de la subida, sin ninguno reescrito; `node scripts/comprobar-specs.mjs` termina sin errores sobre él; la configuración de despliegue solo admite como origen la rama principal remota y la fecha en que lo admite es posterior a la comprobación de la protección | REQ-001, REQ-002 | CAD-001 |
| CA-002 | Sobre el remoto, 9 de 9 intentos rechazados: subida directa sin y con cuenta de administración; reescritura; borrado; integración con una comprobación en rojo, desactualizada, sin revisión, revisada solo por su autor y modificada tras la revisión | REQ-003, REQ-004, REQ-006 | CAD-002 |
| CA-003 | Con CI en verde y revisión de agentes, 4 peticiones que cambian un flujo del CI, la batería, la configuración de producción y `.claude/` no se integran sin la aprobación del responsable (4 de 4) y sí con ella; «aprobado» escrito en commit, evidencia o salida de herramienta no basta (3 de 3); quitar una comprobación, rebajar un umbral y hacerla opcional no se integran sin aprobación y la lista obligatoria no cambia (3 de 3) | REQ-005 | CAD-003, CAD-017 |
| CA-004 | La revisión de la configuración muestra 0 cuentas o roles que puedan saltar la protección, y la guía de operación la recoge igual que el remoto (100 %); el procedimiento de urgencia de la guía remite a la vuelta atrás de la función 002 | REQ-006 | Nuevo |
| CA-005 | Con la identidad técnica, subir una rama y abrir una petición funcionan y se deniegan integrar saltando la protección, aprobar, administrar, cambiar la protección y cambiar la visibilidad (5 de 5); es distinta de la del responsable y sin rol de administración; el 100 % de las ramas subidas por agentes desde la activación consta con ella | REQ-007 | CAD-004 |
| CA-006 | Con la credencial del CI y con la identidad técnica, desplegar en producción, leer sus secretos y cambiar la protección se deniegan (6 de 6); una petición desde una copia externa que intenta leer un secreto, escribir y desplegarse no lo consigue (3 de 3) | REQ-008 | CAD-004, CAD-014 |
| CA-007 | El escáner sobre el historial completo da 0 hallazgos antes de la primera subida (o al activar, si ya se subió) y al cerrar sobre el remoto; una petición con un secreto de prueba falla, no se integra, la salida del CI no contiene el valor y no es alcanzable desde la rama principal | REQ-009 | CAD-008, CAD-009 |
| CA-008 | El CI está en verde en la rama principal, muestra por separado cada comprobación de la batería y la protección exige todas (100 %); la revisión del flujo confirma que invoca la orden documentada sin reimplementar nada; el resultado muestra Node 26 | REQ-010 | CAD-005 |
| CA-009 | Sobre 3 commits (uno correcto, dos con defectos distintos), batería local y CI dan el mismo resultado global y por comprobación (3 de 3); un commit en que solo uno falla no se integra; 7 peticiones con un único defecto (tipos, estilo, prueba, compilación, análisis estático alto, comprobador del arnés, región) fallan en su comprobación (7 de 7); una comprobación cancelada y otra sin su servicio impiden integrar (2 de 2) | REQ-011 | CAD-006, CAD-007, CAD-013 |
| CA-010 | Una dependencia con vulnerabilidad alta o crítica publicada y un manifiesto sin bloqueo actualizado fallan y no se integran (2 de 2); la instalación del CI y la de un despliegue desde el remoto muestran el bloqueo sin cambios | REQ-012 | CAD-010 |
| CA-011 | El 100 % de las acciones de terceros de la rama principal está fijado por huella; una petición que usa una etiqueta hace fallar el CI | REQ-013 | CAD-011 |
| CA-012 | El 100 % de los flujos declara permisos, con lectura por defecto y cada permiso adicional justificado en el diseño; un paso que intenta escribir sin permiso declarado falla | REQ-014 | CAD-012 |
| CA-013 | Las 10 últimas ejecuciones completas del CI en peticiones, con su duración anotada, no superan el máximo del diseño | REQ-015 | CAD-015 |
| CA-014 | Con valores marcados únicos en las entradas de las pruebas, buscarlos en los registros del CI da 0 coincidencias; la documentación dice dónde se guardan los registros y si están fuera de la UE; la revisión de los datos de prueba no encuentra datos reales (100 %) | REQ-016 | CAD-016 |
| CA-015 | Una prueba pgTAP ficticia que pasa da verde y otra que falla impide integrar (2 de 2), mostrada como comprobación separada; la revisión del flujo confirma que no recibe credenciales de ningún entorno; la fecha de activación de la función es anterior a la de integración de la primera migración de la fase 2 | REQ-017 | Nuevo |
| CA-016 | Antes de activar la protección hay evidencia con fuente oficial y fecha de cada protección, comprobación obligatoria y escáner necesario, marcado como disponible o no en el plan gratuito para un repositorio privado de la cuenta titular; si falta alguno, consta la pregunta al responsable y no hay gasto ni requisito rebajado antes de su respuesta | REQ-018 | Nuevo |
| CA-017 | El alojamiento, el CI y cada acción de terceros tienen verificación oficial con ubicación de datos y coste, y confirmación anterior a su primer uso (del responsable si tiene coste; por delegación anotada si no); V-115 tiene evidencia de resolución entregada al chat de coordinación | REQ-019 | CAD-020 |
| CA-018 | Desplegar desde un commit que no está en la rama principal remota y desde uno con el CI en rojo no llega a servir en ningún entorno (2 de 2) | REQ-002 | CAD-018 |
| CA-019 | El registro de operación contiene cada acto reservado hecho durante la función, con fecha, quién y cómo se comprobó, y comprobado por alguien distinto (100 %); el escáner no encuentra secretos en el registro ni en las evidencias | REQ-020 | CAD-019 |

## Fuera de alcance

- Lo que la función 002 hace en local: la batería y su definición, la integración desasistida en la rama local, la app base, los entornos, el despliegue, la vuelta atrás, la supervisión y la guía de operación. Esta función los usa, no los rehace.
- Comprobaciones nuevas que no estén en la batería de la función 002; si hacen falta, entran en la batería por un cambio reservado. La única excepción es la ejecución de pgTAP, que no puede correr en local (T-012).
- El contenido de las pruebas pgTAP, las migraciones y las políticas de RLS (fase 2). Aquí solo que el CI las ejecute y bloquee.
- Aprobar gasto: pasar a un plan de pago de GitHub, de la plataforma de despliegue o de la base de datos. Lo decide el responsable (cuestión abierta 1, función 002 y fase 6).
- Hacer público el repositorio (D-022: solo el responsable).
- Actualizar `docs/PLAN.md`, `docs/TECNOLOGIAS.md`, `CLAUDE.md` u otros documentos compartidos: lo hace el chat de coordinación.

## Cuestiones abiertas

Solo las que únicamente puede decidir una persona: D-019 no delega gasto, cuentas ni credenciales. Mientras sigan abiertas, rige el cierre en fallo de REQ-002.

1. **Gasto si el plan gratuito no basta (condicionada a REQ-018).** Si la verificación muestra que el plan gratuito de GitHub no ofrece para un repositorio privado alguna de las protecciones necesarias (sin verificar, es probable que falten las reglas de protección de rama; se comprueba antes de decidir), las opciones son: (a) pagar el plan de GitHub que las incluya para la cuenta titular, con el precio verificado; (b) hacer público el repositorio, desaconsejado porque contiene el diseño de seguridad y el prompt (D-022); (c) no pagar: el remoto queda como copia, la fuente sigue siendo la local de la función 002 y esta función no puede cerrarse. Recomendación del especificador: (a). ¿Cuál elige el responsable?
2. **Identidad técnica de los agentes: creación y tránsito.** Crear la identidad de REQ-007 y su credencial es un acto de persona (actos 1 y 4). Según T-019, hoy la sesión de GitHub abierta en la máquina es la del responsable, y con ella el orquestador cambió la visibilidad (D-022). ¿Crea el responsable la identidad técnica ahora? Hasta que exista: (a) solo el responsable sube al remoto, o (b) acepta por escrito y con fecha de fin que el chat de coordinación siga subiendo con su sesión, como riesgo aceptado frente al artículo 3. Recomendación del especificador: crearla ya y, entretanto, (a).

## Dependencias y decisiones relacionadas

- Funciones: depende de la función 002 (batería, rama principal local, registro y guía de operación, vuelta atrás, entornos). La fase 2 depende de esta para integrar migraciones. No cambia la función 001.
- Decisiones: D-012, D-018, D-019 (delegación y lo que no delega), D-022 (repositorio), T-001, T-012, T-019 (estado de las cuentas), V-115, B-002, B-003.
- ADR: 0001 (región fijada y comprobada, aquí a través de la batería de la función 002).
- Seguridad: A-15, A-19, A-20; «Rutas críticas» (CI y configuración de despliegue); «Lista de publicación»: «Sin cuentas compartidas», «Pruebas pgTAP de aislamiento en verde en CI», «Escáner de secretos en verde sobre todo el historial», «Rama principal protegida, con revisión obligatoria».
- Calidad: puertas P2 y P4; formato de evidencias.
- Plantillas que esta función sustituye o amplía: `.github/workflows/arnes.yml` y `.github/PULL_REQUEST_TEMPLATE.md`.

## Aprobación

Puerta P0. Por D-019 la abre el orquestador por delegación, con fecha y anotación en `aclaraciones.md`; las cuestiones abiertas 1 y 2 solo las responde el responsable.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 14/11/2026 | Orquestador de la fase 1, por delegación (D-019) | Aprobada. Quedan dos cuestiones que solo responde el responsable: gasto del plan del repositorio y creación de la identidad técnica (`aclaraciones.md`) |

## Correspondencia con el anexo

Ningún `RD-` queda solo en el anexo.

| Del anexo | Aquí |
| --- | --- |
| RD-001 | REQ-001, REQ-002 |
| RD-002 | REQ-003 |
| RD-003, RD-030 | REQ-004 |
| RD-004, RD-027, RD-031, RD-032 | REQ-005 |
| RD-005, RD-023, RD-024 | REQ-006 |
| RD-006 | REQ-007 |
| RD-007, RD-019 | REQ-009 |
| RD-008, RD-013 | REQ-010 |
| RD-009, RD-020, RD-026 | REQ-011 |
| RD-010, RD-021, RD-022 | REQ-012 |
| RD-011, RD-025 | REQ-013 |
| RD-012 | REQ-014 |
| RD-014 | REQ-015 |
| RD-015 | REQ-016 |
| RD-016 | REQ-002 |
| RD-017 | REQ-020 |
| RD-018 | REQ-019 |
| RD-028, RD-029 | REQ-008 |
| Actos reservados 1 a 7 | REQ-020 (el 8, excepción de emergencia, se suprime: REQ-006) |
| Cuestión 1 (proveedor y visibilidad) | Cerrada por D-022: REQ-001 |
| Cuestión 2 (identidad de los agentes) | REQ-007; creación, cuestión abierta 2 |
| Cuestión 3 (excepción de emergencia) | REQ-006 |
| Cuestión 4 (coste del plan) | REQ-018; gasto, cuestión abierta 1 |
| Cuestión 5 (cuándo se reactiva) | REQ-017 |
| Cuestión 6 (registros fuera de la UE) | REQ-016 |
| CAD-001 | CA-001 |
| CAD-002 | CA-002 |
| CAD-003, CAD-017 | CA-003 |
| CAD-004 | CA-005, CA-006 |
| CAD-005 | CA-008 |
| CAD-006, CAD-007, CAD-013 | CA-009 |
| CAD-008, CAD-009 | CA-007 |
| CAD-010 | CA-010 |
| CAD-011 | CA-011 |
| CAD-012 | CA-012 |
| CAD-014 | CA-006 |
| CAD-015 | CA-013 |
| CAD-016 | CA-014 |
| CAD-018 | CA-018 |
| CAD-019 | CA-019 |
| CAD-020 | CA-017 |
