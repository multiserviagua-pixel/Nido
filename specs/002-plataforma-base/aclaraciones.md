# 002 · Aclaraciones

Estado: **RESUELTAS** el 12/11/2026. Las 11 tienen respuesta del responsable; la especificación quedó aprobada ese mismo día (puerta P0). Quedan dos datos por entregar antes de la puerta P1: el dominio principal completo y la carpeta de la copia del repositorio. Lo que sigue en este párrafo es el historial. Primera ronda presentada al responsable el 12/11/2026. Sus respuestas cambiaron el alcance de la función: el repositorio remoto y el CI remoto pasaron a la función `003-repositorio-remoto-ci`, aplazada, y la especificación se reescribió. De las 11 cuestiones de la versión actual de `especificacion.md`, tienen respuesta de 5 a 11. La 2, la 3 y la lectura de la 6 quedaron confirmadas. Siguen abiertas: 1 (dominio: falta el nombre completo) y 4 (copia del repositorio).

La recomendación del orquestador no es una decisión. Mientras una cuestión diga PENDIENTE, sigue abierta y la función sigue en PROPUESTA. Una respuesta supuesta no vale.

## Respuestas de la primera ronda

| Cuestión (numeración antigua) | Respuesta literal | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- |
| 1. Alojamiento del repositorio | «Todo local hasta nuevo aviso, queda pendiente Github» | Responsable, 12/11/2026, chat de la fase 1 | No hay repositorio remoto ni CI remoto por ahora: pasan a la función 003, aplazada. Aquí, repositorio local (REQ-001 a REQ-004) y batería local de comprobaciones (REQ-005 a REQ-013) |
| 2. Autoría y aprobación | «Flujo desasistido, verificar contra evidencia y test.» | Responsable, 12/11/2026, chat de la fase 1 | Integración sin aprobación de una persona en cada cambio: batería en verde, revisión de un agente distinto del autor y evidencia guardada (REQ-014 a REQ-020). La lectura está pendiente de confirmar: cuestión 3 |
| 4. Gasto de la fase 1 | «usemos sus versiones gratuitas hasta tener un versión distribuible.» | Responsable, 12/11/2026, chat de la fase 1 | Planes gratuitos: sin datos reales ni clientes mientras duren (REQ-029), paso a planes de pago antes de la versión distribuible (REQ-030), condiciones de cada plan verificadas antes de usarlo (REQ-031 y REQ-068). Choca con las condiciones de Vercel: cuestión 11 |
| 5. Dominio | «Axarnet» (a la opción «un subdominio de vuestro dominio principal, uno para producción y otro para el previo») | Responsable, 12/11/2026, chat de la fase 1 | Subdominio del dominio principal, con el DNS en Axarnet (REQ-027). Falta el nombre exacto: cuestión 1 |
| 7. Paso a producción | «Preproduccion» (a «Al integrar se despliega solo en el previo») | Responsable, 12/11/2026, chat de la fase 1 | El entorno previo se llama «preproducción» en todos los documentos. Falta confirmar el acto expreso para producción: cuestión 2 |

## Cuestiones abiertas: opciones y recomendación del orquestador

### 1. Nombre exacto del dominio y de los subdominios

Solo lo sabe el responsable: qué dominio es y quién configura los registros en Axarnet.

**Recomendación:** `agentes.<dominio>` para producción y `pre-agentes.<dominio>` para preproducción, configurados por el responsable. Con el nombre definitivo desde ahora: la dirección del conector queda guardada en el asistente de cada cliente y cambiarla después obliga a reinstalar en todos.

### 2. Paso a producción

| Opción | Consecuencia |
| --- | --- |
| a) A producción solo se despliega con un acto expreso del responsable, sobre un commit ya comprobado en preproducción | Ningún cambio llega a producción sin una persona (artículo 14). Un paso manual |
| b) También sin persona, como en preproducción | Más rápido. El flujo desasistido alcanzaría a producción, y el artículo 14 reserva su configuración a una persona |

**Recomendación: a).**

### 3. Lectura de «flujo desasistido»

Cuatro puntos que el responsable confirma o corrige:

| Punto | Recomendación | Si se elige otra cosa |
| --- | --- | --- |
| a) Cambios reservados, que siguen necesitando al responsable: constitución, `.claude/`, configuración que afecta a producción, definición y umbrales de la batería, CI cuando exista y las puertas P0, P1 y P7 | Aceptar la lista | Sin la batería en la lista, un agente podría rebajar los controles que lo vigilan |
| b) Quién hace los commits y la integración en la rama principal local | Los agentes del chat de la fase que implementa, siguiendo el procedimiento. El primer commit, con el arnés, lo ordena el responsable al chat de coordinación | Si solo hace commits una persona, el flujo deja de ser desasistido |
| c) `docs/EQUIPO.md` dice que el dictamen del revisor no sustituye a la aprobación humana | Aceptar que la sustituye en los cambios no reservados, y corregir el documento | Mantenerlo obliga a aprobar cada cambio |
| d) Sin remoto, nada impide técnicamente escribir en la rama principal saltándose el procedimiento; la especificación lo detecta después y bloquea integraciones y despliegues | Aceptar ese riesgo hasta que se reactive la función 003 | La alternativa es reactivar ya la 003 |

### 4. Copia del repositorio sin remoto

Hoy el repositorio no tiene ningún commit ni copia fuera del disco de trabajo.

| Opción | Consecuencia |
| --- | --- |
| a) Copia diaria y automática en una carpeta fuera de este disco que designe el responsable, con la restauración probada | Una avería del disco no pierde el trabajo. Si la carpeta es de un servicio en la nube, el código queda también allí |
| b) Sin copia; el riesgo se acepta por escrito | Nada que mantener. Una avería lo pierde todo |

**Recomendación: a).** Falta saber dónde.

### 5. Entorno de la prueba real de la función 001

| Opción | Consecuencia |
| --- | --- |
| a) En preproducción, con dirección estable y abierta a internet, protegida por nuestra autorización y no por el muro de acceso de la plataforma | Producción queda limpia y sin licencias ni códigos. No cuenta como publicación (B-003) |
| b) En producción | Idéntico a lo que usarán los clientes, pero mete datos de prueba en producción y roza B-003 |

**Recomendación: a).**

### 6. Proyectos de Supabase

| Opción | Consecuencia |
| --- | --- |
| a) Esta función no los crea: deja verificada V-114. El proyecto, en plan gratuito, lo crea una persona cuando un diseño aprobado lo pida | La plataforma no se adelanta a la fase 2. El plan gratuito se pausa a los 7 días sin uso y no tiene copias (T-003) |
| b) Esta función crea desarrollo, preproducción y producción | La fase 2 se lo encuentra hecho, pero se decide la forma de preproducción antes de verificar V-114 |

**Recomendación: a).**

### 7. Avisos de error y de disponibilidad

**Recomendación:** al responsable, por correo, sin guardia ni horario durante la fase 1. La dirección la pone él en el servicio, no en el repositorio. Un segundo canal sería otro servicio que verificar.

### 8. Vulnerabilidad alta o crítica sin corrección disponible

| Opción | Consecuencia |
| --- | --- |
| a) Aceptación escrita del responsable, con caducidad de 30 días como máximo y nota del `auditor-seguridad` | La batería no queda en rojo indefinidamente por algo ajeno, y la excepción caduca sola |
| b) Se bloquea siempre | Un fallo de un tercero paraliza todo el trabajo y empuja a saltarse el control |

**Recomendación: a).**

### 9. Registros de la plataforma de despliegue fuera de la UE

**Recomendación:** aceptarlo si no contienen valores recibidos (REQ-040) y queda documentado; la supervisión de errores, en la UE. Exigir todo en la UE puede no ser posible con el proveedor elegido (sin verificar).

### 10. Acceso de los agentes a las consolas y a las credenciales

| Opción | Consecuencia |
| --- | --- |
| a) Los agentes pueden usar la credencial de despliegue de preproducción a través de una orden local que la lee del entorno de la máquina y nunca la muestra. No tienen acceso a las consolas ni a ninguna credencial de producción | Preproducción se despliega sin persona, como pide el flujo desasistido. Lo de las consolas lo comprueba el responsable y lo anota |
| b) Ninguna credencial al alcance de los agentes | Cada despliegue en preproducción necesita a una persona |
| c) Además, solo lectura en las consolas | Los agentes comprueban más por sí mismos; más credenciales que guardar y rotar |

**Recomendación: a).**

### 11. El plan gratuito de Vercel no admite uso comercial

La documentación oficial de Vercel, consultada el 12/11/2026, limita el plan gratuito al uso personal no comercial y exige un plan de pago para cualquier uso comercial, incluido el desarrollo hecho por personas que cobran por él. Coincide con lo registrado en T-006. [Uso razonable](https://vercel.com/docs/limits/fair-use-guidelines) · [Plan Hobby](https://vercel.com/docs/plans/hobby)

| Opción | Consecuencia |
| --- | --- |
| a) Contratar Vercel Pro, 20 $ al mes, como única excepción; todo lo demás, gratuito | Se cumplen las condiciones. Es el único gasto de la fase |
| b) Buscar otra plataforma de despliegue con plan gratuito que admita uso comercial | Reabre D-002 y ADR-0001: hay que verificar la alternativa y rehacer parte del diseño |
| c) Usar el plan gratuito de todos modos | Incumple las condiciones del proveedor, que puede pausar la cuenta en mitad de la prueba de 3 días |

**Recomendación: a).** La c) no la recomiendo.

## Respuestas de la segunda ronda

«Sí, las acepto» es la respuesta del responsable, con el botón, a la pregunta «¿Aceptas las recomendaciones que siguen sin respuesta?», sobre la tabla «Recomendaciones sin respuesta» que se le presentó en el chat de la fase 1 el 12/11/2026. Cubre solo las filas de esa tabla: no cubre el gasto de Vercel (cuestión 11) ni las confirmaciones de lectura (cuestiones 2 y 3).

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Nombre del dominio y subdominios | «nido» (a «El nombre exacto del dominio. Propongo agentes.<dominio> y pre-agentes.<dominio>.») | Responsable, 12/11/2026, chat de la fase 1 | Confirmado después por el responsable, que eligió «nido y pre-nido»: producción en `nido.<dominio>` y preproducción en `pre-nido.<dominio>`, con el DNS en Axarnet. REQ-027 completado. **Dato pendiente**: el dominio principal completo, antes de la puerta P1 |
| 2 | Paso a producción | «Sí, confirmo» (botón, a «¿Confirmas mis cuatro lecturas: producción, flujo desasistido, buzón y base de datos?») | Responsable, 12/11/2026, chat de la fase 1 | Opción a): a producción solo con orden expresa del responsable. REQ-036 queda firme |
| 3 | Lectura de «flujo desasistido» | «Sí, confirmo» (mismo botón). La lectura presentada: no aprueba cada cambio; siguen siendo suyas las puertas P0, P1 y P7 y los cambios reservados (constitución, `.claude/`, producción, umbrales de la batería); los commits los hacen los agentes del chat de la fase 1, y el primero lo ordena él | Responsable, 12/11/2026, chat de la fase 1 | REQ-014 a REQ-020 quedan firmes; REQ-018 dice quién integra; el acto reservado 1 pasa a ser ordenar el primer commit. La corrección de `docs/EQUIPO.md` y de `docs/PLAN.md` va en `propuestas.md` |
| 4 | Copia del repositorio | «Sí, copia diaria» | Responsable, 12/11/2026, chat de la fase 1 | Opción a). REQ-004 y CA-004 completados: copia diaria y automática. **Dato pendiente**: la carpeta de destino, antes de la puerta P1 |
| 5 | Entorno de la prueba real | «Sí, las acepto»: opción a), preproducción | Responsable, 12/11/2026, chat de la fase 1 | REQ-027 completado |
| 6 | Proyectos de Supabase | Primero «Sí, las acepto» y, a continuación, sobre «Los crea una persona cuando un diseño aprobado lo pida»: «lo crea el agente para la base de datos» | Responsable, 12/11/2026, chat de la fase 1 | Esta función sigue sin crear proyectos, pero quien los crea es el agente de base de datos, no una persona. REQ-070 y CA-042 nuevos, con los límites de los artículos 4 y 14: la cuenta y su credencial las pone una persona, las contraseñas y claves no pasan por el repositorio ni los prompts, y el de producción necesita acto expreso. Lectura confirmada por el responsable con «Sí, confirmo» el 12/11/2026 |
| 7 | Avisos | «Sí, las acepto»: al responsable, por correo, sin guardia | Responsable, 12/11/2026, chat de la fase 1 | REQ-042 y CA-038 completados |
| 8 | Vulnerabilidades sin corrección | «Sí, las acepto»: opción a), aceptación escrita con caducidad de 30 días | Responsable, 12/11/2026, chat de la fase 1 | REQ-049 y CA-009 ampliados |
| 9 | Registros fuera de la UE | «Sí, las acepto»: se acepta si no llevan valores recibidos; la supervisión, en la UE | Responsable, 12/11/2026, chat de la fase 1 | REQ-043 completado |
| 10 | Acceso de los agentes | «Sí, las acepto»: opción a), los agentes usan la credencial de preproducción con una orden local que no la muestra; ninguna de producción ni acceso a consolas | Responsable, 12/11/2026, chat de la fase 1 | REQ-037 y CA-031 ampliados |
| 11 | Plan gratuito de Vercel | «usar versión gratis de vercel para desarrollo.» | Responsable, 12/11/2026, chat de la fase 1 | Opción c), decidida después de ver que la documentación de Vercel limita ese plan al uso no comercial. REQ-071 y CA-043 nuevos: solo durante el desarrollo, sin clientes, datos reales ni ingresos; riesgo de pausa de la cuenta aceptado por escrito; plan de pago antes de la versión distribuible. REQ-068 anota la excepción |

## Decisiones que salen de aquí

Para el registro de decisiones, que mantiene el chat de coordinación (ver `propuestas.md`): todo local con el repositorio remoto pendiente; flujo desasistido; planes gratuitos hasta la versión distribuible; dominio con DNS en Axarnet; el entorno se llama preproducción.

## Después de la aprobación: enmienda 1 (13/11/2026)

| Qué | Respuesta o hecho | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- |
| Uso de la plataforma de despliegue | D-016, anotada en `docs/TECNOLOGIAS.md` por el chat de coordinación: se desarrolla en local, no se usa el plan gratuito de la plataforma, la prueba gratuita de 14 días del plan de pago se reserva para la prueba real y el pago se decide al cerrar la fase 1. Sustituye a «usar versión gratis de vercel para desarrollo» (cuestión 11) | Responsable, 13/11/2026, en el chat de coordinación | REQ-025, REQ-029, REQ-031, REQ-068, REQ-069, REQ-071 y CA-043 cambiados; REQ-072 a REQ-079 y CA-044 a CA-047 nuevos |
| Ventana ya abierta | El orquestador vio en la consola de la plataforma, el 13/11/2026, la cuenta creada con la prueba gratuita en curso y 14 días restantes: termina el 27/11/2026. No había ningún proyecto y el orquestador no creó ninguno | Observado por el orquestador, 13/11/2026 | REQ-073 lo anota; REQ-074, REQ-075 y REQ-078 hablan de condiciones de inicio dentro de la ventana, no de apertura |
| Qué hacer con la ventana abierta | «Sí, prioriza el conector» | Responsable, 13/11/2026, chat de la fase 1 | Prioridad al conector; REQ-075 prevé repartir lo que no quepa |
| Base de datos | El responsable pidió preparar el proyecto en la consola de Supabase. El orquestador dejó relleno el formulario, sin enviarlo: nombre `nido-desarrollo`, región `eu-central-1`, sin exposición automática de tablas, RLS automático, plan gratuito. La contraseña y la creación son del responsable. Plan de pago de Supabase solo en producción, según le dijo al chat de la fase 3 | Responsable, 13/11/2026 | Excepción puntual a REQ-070: este primer proyecto lo crea el responsable desde la consola |

La especificación vuelve a PROPUESTA hasta que el responsable apruebe la enmienda. El diseño escrito el 12/11/2026 y su dictamen son anteriores a ella y hay que rehacerlos sobre el texto enmendado.
