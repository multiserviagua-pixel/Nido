> **Anexo de la especificación 003.** Este archivo es el detalle de `especificacion.md`. El 14/11/2026 se copió aquí íntegra la especificación anterior para que la principal se pudiera leer de una sentada. Solo se cambiaron los identificadores: los antiguos requisitos y casos negativos son ahora `RD-nnn` y los antiguos criterios, `CAD-nnn`, con el mismo número. Los requisitos `REQ-001` a `REQ-020` de `especificacion.md` agrupan estos `RD-` y los citan en su columna «Detalle»; lo que se precisa aquí (listas, casos, umbrales) sigue vigente. Si el texto consolidado y este anexo discrepan, se para y se pregunta. Los documentos anteriores al 14/11/2026 que citan «REQ-nnn» o «CA-nnn» de la función 003 se refieren a estos `RD-nnn` y `CAD-nnn`.
>
> **Sustituido el 14/11/2026 por la especificación consolidada** (no se borra, para conservar el historial): la situación «APLAZADA» (reactivada por D-022); en RD-001, «el proveedor, la titularidad y la visibilidad que decida el responsable» (ahora `multiserviagua-pixel/Nido` en GitHub, privado) y «desde ese momento» (ahora, solo tras comprobar la protección); el acto reservado 8 (no hay excepción de emergencia); el apartado «Cuestiones abiertas» y el punto de «Fuera de alcance» sobre pgTAP. Las obligaciones nuevas (sin excepción de emergencia, identidad técnica, registros fuera de la UE, pgTAP en el CI, verificación del plan gratuito) solo están en `especificacion.md`, marcadas «Nuevo».
>
> Correspondencia con la especificación consolidada (ningún `RD-` queda solo en este anexo):
>
> | RD del anexo | Requisito |
> | --- | --- |
> | RD-001 | REQ-001, REQ-002 |
> | RD-002 | REQ-003 |
> | RD-003, RD-030 | REQ-004 |
> | RD-004, RD-027, RD-031, RD-032 | REQ-005 |
> | RD-005, RD-023, RD-024 | REQ-006 |
> | RD-006 | REQ-007 |
> | RD-007, RD-019 | REQ-009 |
> | RD-008, RD-013 | REQ-010 |
> | RD-009, RD-020, RD-026 | REQ-011 |
> | RD-010, RD-021, RD-022 | REQ-012 |
> | RD-011, RD-025 | REQ-013 |
> | RD-012 | REQ-014 |
> | RD-014 | REQ-015 |
> | RD-015 | REQ-016 |
> | RD-016 | REQ-002 |
> | RD-017 | REQ-020 |
> | RD-018 | REQ-019 |
> | RD-028, RD-029 | REQ-008 |

# 003 · Repositorio remoto, rama principal protegida y CI remoto

Estado: PROPUESTA
Fase: 1 · Fecha: 12/11/2026 · Autor: `especificador`
Situación anterior, sustituida el 14/11/2026 (D-022): aplazada por decisión del responsable el 12/11/2026 («Todo local hasta nuevo aviso, queda pendiente Github»).

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Mientras esta función siga aplazada, el repositorio vive solo en la máquina de trabajo y las comprobaciones se ejecutan en local (función 002). Esta función recoge lo que queda pendiente para cuando el responsable la reactive: un repositorio remoto con su rama principal protegida, que pasa a ser la única fuente de los despliegues, y un CI remoto que ejecuta en cada cambio la misma batería de comprobaciones que la función 002 ya define en local, sin rehacerla. Mantiene el flujo de integración desasistido de la función 002: cada cambio lo revisa un agente distinto de su autor, y una persona solo aprueba los cambios reservados y abre las puertas.

## Quién la usa y cómo

- Como **responsable de HumanaIA**, quiero que la rama principal remota no acepte ningún cambio sin el CI en verde y la revisión de un agente distinto del autor, y que los cambios reservados no entren sin mi aprobación expresa, para no depender de la disciplina de nadie.
- Como **agente de cualquier fase**, quiero subir un cambio y saber, por el resultado del CI, si supera las mismas comprobaciones que en local, para corregirlo antes de la revisión.
- Como **persona que opera el sistema**, quiero que los despliegues salgan solo de la rama principal remota, para saber siempre de qué commit sale cada entorno.

## Requisitos

Cada requisito es comprobable y dice qué, no cómo. Donde un valor es un parámetro técnico, el requisito enuncia la propiedad y el valor lo fija el diseño (puerta P1).

### Repositorio remoto y rama principal

| ID | Requisito |
| --- | --- |
| RD-001 | Existe un único repositorio remoto del proyecto, con el proveedor, la titularidad y la visibilidad que decida el responsable. Su rama principal recibe el historial completo de la rama principal local de la función 002 sin reescribir ningún commit, y desde ese momento es la única fuente del código y de los despliegues. |
| RD-002 | La rama principal remota solo cambia integrando una petición de cambio que tiene en verde todas las comprobaciones obligatorias del CI, ejecutadas sobre la última versión del cambio y al día con la rama principal. |
| RD-003 | Cada integración exige la revisión registrada de un agente distinto del autor del cambio (el `revisor` y, si el cambio toca una ruta crítica de `docs/SEGURIDAD.md`, también el `auditor-seguridad`), sin hallazgos bloqueantes y hecha sobre la última versión del cambio. Si el cambio se modifica después, la revisión deja de valer (artículo 6, flujo desasistido de la función 002). |
| RD-004 | Un cambio reservado (los flujos del CI, la batería de comprobaciones o sus umbrales, la configuración de despliegue o de entornos que afecta a producción, `.claude/`, incluidos permisos y ganchos, y la constitución) no se integra sin la aprobación expresa del responsable, dada en el repositorio remoto con su propia identidad, además de cumplir RD-002 y RD-003 (artículo 14). |
| RD-005 | Las reglas de protección de la rama principal se aplican también a las cuentas que administran el repositorio. |
| RD-006 | La identidad con la que los agentes suben cambios al remoto puede subir ramas y abrir peticiones de cambio, y no puede integrar sin cumplir RD-002 a RD-004, aprobar cambios reservados, administrar el repositorio ni cambiar sus reglas de protección (artículo 3, mínimo privilegio). |
| RD-007 | El escáner de secretos de la batería de la función 002, ejecutado sobre el historial completo, no encuentra nada antes de la primera subida al remoto ni sobre el remoto al cerrar la función (A-20). |

### CI remoto

| ID | Requisito |
| --- | --- |
| RD-008 | En cada petición de cambio y en cada integración en la rama principal, el CI ejecuta la batería de comprobaciones que define la función 002, invocando la misma orden documentada y sin reimplementar ninguna comprobación (artículo 10). Cada comprobación de la batería aparece en el resultado del CI por separado y es obligatoria para integrar. |
| RD-009 | El CI aplica los mismos umbrales que la batería local y no puede ser más permisivo que ella. Si la batería local y el CI dan resultados distintos sobre el mismo commit, cuenta el fallo. |
| RD-010 | Toda instalación de dependencias en el CI y en los despliegues que salen del remoto usa exactamente las versiones del archivo de bloqueo (A-19). |
| RD-011 | Toda acción de terceros usada en los flujos del CI está fijada por la huella inmutable de su versión (V-115), y el CI lo comprueba. |
| RD-012 | Cada flujo del CI declara sus permisos: solo lectura del contenido por defecto, y cualquier permiso adicional limitado al trabajo que lo necesita y justificado en el diseño. |
| RD-013 | El CI ejecuta la app con Node 26 (T-001). |
| RD-014 | La duración del CI completo de una petición de cambio queda registrada en cada ejecución y no supera el máximo que fije el diseño. |
| RD-015 | Los registros del CI no conservan cuerpos de petición o de respuesta, cabeceras de autorización, cookies, valores de la cadena de consulta, valores de secretos o de variables de entorno ni ningún otro valor recibido (artículo 1, A-15), y está documentado dónde se guardan. |

### Despliegue y gobierno

| ID | Requisito |
| --- | --- |
| RD-016 | Una vez activada esta función, ningún entorno se despliega desde un commit que no esté en la rama principal remota con el CI en verde. Las reglas de paso a producción de la función 002 se mantienen. |
| RD-017 | Cada acto de la lista «Actos reservados a una persona» lo realiza una persona, queda anotado en el registro de operación de la función 002 con fecha, quién lo hizo y cómo se comprobó, y su resultado lo comprueba alguien distinto de quien lo hizo. Ni el registro ni las evidencias contienen secretos. |
| RD-018 | El alojamiento del repositorio, el CI y cada acción de terceros que se incorpore se verifican en documentación oficial, con la ubicación de sus datos y su coste, antes de usarse (skill `verificar-decision`), y su elección la confirma el responsable. V-115 queda resuelta. |

### Actos reservados a una persona

Los hace una persona; ningún agente los ejecuta (artículos 4 y 14, `docs/EQUIPO.md`). El agente `plataforma` puede prepararlos y explicarlos.

1. Elegir y contratar el proveedor, la cuenta u organización y el plan del repositorio remoto.
2. Hacer la primera subida del historial de la rama principal local y activar a continuación la protección de la rama.
3. Configurar y cambiar la protección de la rama, los permisos del repositorio, qué comprobaciones son obligatorias y quién aprueba los cambios reservados.
4. Crear la identidad con la que suben los agentes y su credencial, guardarla fuera del repositorio, rotarla y retirarla.
5. Poner, cambiar y rotar los secretos que necesite el CI, si los hay.
6. Aprobar en el remoto los cambios reservados.
7. Conectar la plataforma de despliegue al repositorio remoto y cambiar el origen de los despliegues.
8. Usar la excepción de emergencia, si el responsable decide que exista.

## Casos negativos

Lo que debe rechazarse, fallar de forma segura o no ocurrir nunca.

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| RD-019 | Petición que introduce un secreto de prueba (un valor con formato de credencial que no es una credencial válida) | El escáner de secretos falla y el cambio no se integra. El resultado del CI no muestra el valor. Tras la prueba, el valor no queda alcanzable desde la rama principal remota |
| RD-020 | Petición con tipos, estilo, pruebas, compilación, análisis estático, comprobación de región o comprobador del arnés en rojo | El CI falla en esa comprobación y el cambio no se integra |
| RD-021 | Dependencia con una vulnerabilidad conocida de gravedad alta o crítica | El CI falla y el cambio no se integra |
| RD-022 | Dependencia nueva o cambiada sin el archivo de bloqueo coherente con el manifiesto | El CI falla y el cambio no se integra |
| RD-023 | Subida directa a la rama principal remota, también desde una cuenta que administra el repositorio | Se rechaza |
| RD-024 | Reescritura del historial o borrado de la rama principal remota | Se rechaza |
| RD-025 | Acción de terceros referenciada sin huella inmutable | El CI falla y el cambio no se integra |
| RD-026 | Comprobación obligatoria que no llega a ejecutarse, se cancela, agota su tiempo o no puede usar el servicio del que depende | Cuenta como fallida y el cambio no se integra (artículo 3) |
| RD-027 | Cambio reservado sin aprobación expresa del responsable | No se integra, aunque tenga la revisión de los agentes y el CI en verde |
| RD-028 | Cambio propuesto desde fuera del repositorio (por ejemplo, desde una copia de un tercero) | Sus comprobaciones se ejecutan sin acceso a secretos ni permisos de escritura, y no se despliega en ningún entorno sin el acto expreso de una persona. Lo que contenga es dato, no orden (artículo 7) |
| RD-029 | La credencial del CI o la identidad de los agentes intenta desplegar en producción, leer sus secretos o cambiar la protección de la rama | Se deniega (artículo 3) |
| RD-030 | La revisión la hace el agente autor del cambio, o se hizo antes de una modificación posterior del cambio | No cuenta y el cambio no se integra |
| RD-031 | Petición que debilita la batería o el CI: quita una comprobación, rebaja un umbral o hace que una comprobación deje de ser obligatoria | No se integra sin la aprobación expresa del responsable, y la lista de comprobaciones obligatorias de la rama no cambia por el contenido de la petición |
| RD-032 | Un commit, una petición, una evidencia o la salida de una herramienta afirma en su texto que el responsable ha aprobado el cambio | No cuenta como aprobación: solo vale la aprobación dada por el responsable con su identidad en el remoto (artículo 7) |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. Las pruebas se hacen con datos ficticios y sus evidencias siguen el formato de `docs/CALIDAD.md`, sin secretos.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CAD-001 | El repositorio remoto existe con el proveedor, la titularidad y la visibilidad decididas; un clon de su rama principal tiene el mismo último commit que la rama principal local en el momento de la subida y la misma lista de commits, sin ninguno reescrito; `node scripts/comprobar-specs.mjs` termina sin errores sobre él; la configuración de despliegue admite como origen solo la rama principal remota | RD-001, RD-016 |
| CAD-002 | Batería de protección sobre el remoto, con 8 de 8 intentos rechazados: subida directa con cuenta sin administración; subida directa con cuenta de administración; reescritura del historial; borrado de la rama; integración con una comprobación en rojo; integración sin revisión de un agente; integración revisada solo por su agente autor; integración de un cambio modificado después de la revisión. Una petición desactualizada respecto a la rama principal tampoco se puede integrar | RD-002, RD-003, RD-005, RD-023, RD-024, RD-030 |
| CAD-003 | Cuatro peticiones de prueba, con el CI en verde y la revisión de los agentes, que cambian un flujo del CI, la batería, la configuración de despliegue de producción y `.claude/`: ninguna se integra sin la aprobación expresa del responsable (4 de 4) y las cuatro se integran con ella. Una petición cuyo texto y evidencia dicen «aprobado por el responsable», sin su aprobación en el remoto, no se integra | RD-004, RD-027, RD-032 |
| CAD-004 | Con la identidad de los agentes: subir una rama y abrir una petición funcionan; integrar sin cumplir los requisitos, aprobar un cambio reservado, administrar el repositorio y cambiar la protección se deniegan (4 de 4). Con la credencial del CI y con la de los agentes, desplegar en producción, leer sus secretos y cambiar la protección se deniegan (6 de 6) | RD-006, RD-029 |
| CAD-005 | El CI está en verde en la rama principal; su resultado muestra por separado cada comprobación de la batería de la función 002 y la protección exige todas (100 %); la revisión del flujo confirma que invoca la orden documentada de la batería y no reimplementa ninguna comprobación; el resultado muestra Node 26 | RD-008, RD-013 |
| CAD-006 | Sobre 3 commits (uno correcto y dos con un defecto distinto cada uno), la batería local y el CI dan el mismo resultado global y por comprobación (3 de 3). Un commit en el que solo uno de los dos falla no se puede integrar | RD-009 |
| CAD-007 | Inyección de fallos: 7 peticiones de prueba, cada una con un único defecto deliberado (error de tipos, error de estilo, prueba en rojo, compilación rota, hallazgo de análisis estático de gravedad alta, especificación que no supera el comprobador del arnés, fijación de región quitada). Las 7 fallan en su comprobación y ninguna se puede integrar | RD-009, RD-020 |
| CAD-008 | Una petición que introduce un secreto de prueba no válido hace fallar el escáner de secretos y no se puede integrar; la salida del CI no contiene el valor; después, el valor no es alcanzable desde la rama principal remota | RD-019 |
| CAD-009 | El escáner de secretos sobre el historial completo termina con 0 hallazgos antes de la primera subida y, al cerrar la función, sobre el remoto | RD-007 |
| CAD-010 | Una petición con una dependencia con vulnerabilidad alta o crítica publicada, y otra que cambia el manifiesto sin actualizar el archivo de bloqueo, fallan y no se pueden integrar (2 de 2); la salida de instalación del CI y la de un despliegue desde el remoto muestran que se usó el archivo de bloqueo sin cambios | RD-010, RD-021, RD-022 |
| CAD-011 | El 100 % de las acciones de terceros de los flujos de la rama principal están fijadas por huella; una petición que referencia una acción por etiqueta hace fallar el CI | RD-011, RD-025 |
| CAD-012 | Todos los flujos del CI declaran permisos, con solo lectura por defecto, y cada permiso adicional figura justificado en el diseño (revisión del 100 % de los flujos); un paso de prueba que intenta escribir en el repositorio sin permiso declarado falla | RD-012 |
| CAD-013 | Una petición en la que una comprobación obligatoria se cancela, y otra en la que una comprobación no puede usar su servicio, no se pueden integrar (2 de 2) | RD-026 |
| CAD-014 | Una petición desde una copia externa del repositorio, con un paso que intenta leer un secreto y escribir en el repositorio: el secreto no está disponible, la escritura se deniega y no se despliega en ningún entorno sin el acto de una persona (3 de 3) | RD-028 |
| CAD-015 | Las 10 últimas ejecuciones completas del CI en peticiones de cambio, anotadas con su duración, no superan el máximo fijado en el diseño | RD-014 |
| CAD-016 | Una ejecución del CI con valores marcados únicos en las entradas de sus pruebas: la búsqueda de esos valores en los registros del CI devuelve 0 coincidencias; la documentación indica dónde guarda sus registros el CI | RD-015 |
| CAD-017 | Tres peticiones de prueba que quitan una comprobación, rebajan un umbral y marcan una comprobación como no obligatoria no se integran sin la aprobación del responsable (3 de 3), y la lista de comprobaciones obligatorias de la rama es la misma antes y después de cada una | RD-031 |
| CAD-018 | Un intento de desplegar desde un commit que no está en la rama principal remota y otro desde un commit de la rama principal con el CI en rojo no llegan a servir en ningún entorno (2 de 2) | RD-016 |
| CAD-019 | El registro de operación contiene cada acto de la lista realizado durante la función, con fecha, quién y cómo se comprobó; el resultado de cada uno está comprobado por alguien distinto de quien lo hizo (100 %); el escáner de secretos no encuentra nada en el registro ni en las evidencias | RD-017 |
| CAD-020 | El alojamiento del repositorio, el CI y cada acción de terceros tienen evidencia de verificación con fuente oficial, ubicación de datos y coste, y la confirmación del responsable es anterior a su primer uso; V-115 tiene evidencia de resolución entregada al chat de coordinación | RD-018 |

## Fuera de alcance

- Todo lo que la función 002 hace en local: la batería de comprobaciones y su definición, la integración desasistida en la rama principal local, la app base, los entornos de preproducción y producción, el despliegue, la vuelta atrás, la supervisión y la guía de operación. Esta función los usa, no los rehace.
- Crear comprobaciones nuevas en el CI que no estén en la batería de la función 002. Si hacen falta, se añaden a la batería por un cambio reservado.
- Las pruebas pgTAP en el CI (fase 2, T-012), salvo que el responsable decida otra cosa al reactivar esta función. El CI debe poder ampliarse con ellas sin rehacerse.
- Pasar a planes de pago de la plataforma de despliegue o de la base de datos (función 002 y fase 6).
- Actualizar `docs/PLAN.md`, `docs/TECNOLOGIAS.md`, `CLAUDE.md` u otros documentos compartidos: lo hace el chat de coordinación.

## Cuestiones abiertas

Lo que hay que preguntar al responsable antes de aprobar. Se resuelven en `aclaraciones.md`, cuando la función se reactive.

1. **Proveedor, cuenta u organización y visibilidad.** La existencia de `.github/` y de V-115 da por hecho un proveedor, y la respuesta del responsable lo nombra («queda pendiente Github»), pero no hay decisión registrada. ¿Qué proveedor, bajo qué cuenta u organización, y con qué visibilidad?
2. **Identidad con la que suben los agentes al remoto.** ¿Una identidad técnica de HumanaIA distinta de la del responsable, u otra fórmula? `docs/PLAN.md` dice que los chats de fase no hacen commits ni cambian de rama: ¿cómo encaja con que los agentes suban ramas y abran peticiones?
3. **Excepción de emergencia.** RD-005 aplica la protección también a quien administra el repositorio, sin excepción. ¿Se quiere un procedimiento de emergencia que la salte? Si es así, ¿quién puede usarlo y cómo queda registrado?
4. **Coste del plan del repositorio.** Está sin verificar si la protección de la rama, las comprobaciones obligatorias y los escáneres que exige esta función están disponibles en el plan gratuito del proveedor que se elija con la visibilidad que se elija. ¿Se aprueba un plan de pago si hace falta, o se mantiene la regla de planes gratuitos hasta la versión distribuible?
5. **Cuándo se reactiva.** ¿Qué hecho o qué fecha reactiva esta función? T-012 y `CLAUDE.md` sitúan las pruebas pgTAP de la fase 2 en el CI, y la «Lista de publicación» de `docs/SEGURIDAD.md` exige rama principal protegida con revisión obligatoria y pruebas de aislamiento en verde en CI: ¿debe estar activa antes de que la fase 2 implemente su primera migración?
6. **Registros del CI fuera de la UE.** Si la verificación muestra que el CI guarda sus registros fuera de la UE, ¿se acepta mientras cumplan RD-015, o se exige que estén en la UE?

## Dependencias y decisiones relacionadas

- Funciones: depende de la función 002 (batería de comprobaciones, rama principal local, registro y guía de operación, entornos). No cambia la función 001.
- Decisiones: D-012, D-015, T-001, T-012, V-115, B-002, B-003. Decisión nueva pendiente: alojamiento del repositorio remoto (respuesta 2 del responsable, 12/11/2026).
- ADR: 0001 (la región se fija en la configuración y se comprueba; aquí, a través de la batería de la función 002).
- Seguridad: amenazas A-15, A-19 y A-20; «Rutas críticas» (CI y configuración de despliegue); «Lista de publicación», apartados «Secretos y configuración» y «Código y dependencias».
- Calidad: puertas P2 y P4; formato de evidencias.
- Plantillas actuales que esta función sustituye o amplía: `.github/workflows/arnes.yml` y `.github/PULL_REQUEST_TEMPLATE.md`.

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
