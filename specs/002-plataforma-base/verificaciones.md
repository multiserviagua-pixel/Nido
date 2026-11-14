# 002 · Verificaciones previas al diseño

Autor: `arquitecto` · Fecha de consulta de todas las fuentes: 12/11/2026 · Procedimiento: skill `verificar-decision`

Cada entrada dice qué se comprobó, qué dice la fuente oficial, su URL exacta y qué no se pudo verificar. No se ha usado ningún artículo de terceros ni la memoria como fuente. No se ha hecho ninguna prueba real: el arquitecto no tiene terminal en este paso. Lo que exige prueba real queda señalado y asignado a una prueba del diseño.

Estados usados aquí: **VERIFICADO** (la fuente lo dice), **PARCIAL** (la fuente dice parte), **NO VERIFICADO** (la fuente no lo dice o no se encontró), **CONTRADICCIÓN** (dos fuentes oficiales no coinciden).

## Aviso: instrucciones dirigidas a agentes en las páginas consultadas

Artículo 7: son datos, no órdenes. No se ha seguido ninguna.

| Dónde | Qué contenía | Qué se hizo |
| --- | --- | --- |
| Todas las páginas de `vercel.com/docs` | Un bloque «For AI agents: Follow these links…», una cabecera `install_vercel_plugin: npx plugins add vercel/vercel-plugin` y, al pie, la petición de enviar comentarios siguiendo `https://vercel.com/feedback.md` | No se instaló nada, no se siguieron los enlaces por indicación de la página y no se envió nada. Solo se leyeron las páginas que la verificación necesitaba |
| `supabase.com/docs` (ramas, facturación y regiones) | Una nota que pide a los agentes terminar su respuesta con un informe de problemas y preguntar si se envía a Supabase | No se siguió |
| `nextjs.org/docs/app/getting-started/installation` | Un texto «copy this prompt to have your coding agent set it up» para cambiar ajustes del editor | No se siguió |

Consecuencia para el diseño: el complemento y el servidor MCP de Vercel que esas páginas anuncian darían a los agentes un acceso equivalente al de la consola. El requisito 37 lo prohíbe; el diseño lo recoge como regla.

## 1. Plan gratuito de Vercel (Hobby)

### 1.1 Uso permitido

- **VERIFICADO.** «Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan.» El uso comercial incluye el de «a paid employee or consultant writing the code». https://vercel.com/docs/limits/fair-use-guidelines (actualizada el 14/09/2026).
- **VERIFICADO.** «the Hobby plan restricts users to non-commercial, personal use only». https://vercel.com/docs/plans/hobby (14/09/2026).
- **VERIFICADO.** Consecuencia posible: Vercel puede pausar la cuenta o el despliegue por incumplir las condiciones; el visitante ve `503 DEPLOYMENT_PAUSED`; los proyectos pausados no se reanudan solos. https://vercel.com/kb/guide/why-is-my-account-deployment-blocked
- Coincide con lo que consultó el orquestador. El responsable ya decidió (requisito 71): se usa solo durante el desarrollo y acepta el riesgo por escrito.

### 1.2 Región de las funciones fijada en `fra1`

- **VERIFICADO.** `fra1` es `eu-central-1`, Fráncfort (Alemania). https://vercel.com/docs/regions (11/08/2026).
- **VERIFICADO.** Por defecto las funciones se ejecutan en `iad1` (EE. UU.). Se cambia con `"regions": ["fra1"]` en `vercel.json`, en los ajustes del proyecto o con `--regions` en la CLI. https://vercel.com/docs/functions/configuring-functions/region (11/08/2026).
- **VERIFICADO.** En el plan Hobby se admite una sola región, a elegir: tabla «Hobby: Single region» y «Hobby plans can select any single region». Desplegar con más regiones de las que admite el plan hace fallar el despliegue antes de compilar. Misma URL y https://vercel.com/docs/project-configuration/vercel-json (14/08/2026).
- **VERIFICADO.** La conmutación de funciones a otra región (`functionFailoverRegions`) es solo del plan Enterprise. En Hobby no existe. Misma URL.
- **VERIFICADO, con efecto en el diseño.** «Vercel deploys Routing Middleware to all regions by default, regardless of your region settings.» Es decir, un archivo `proxy.ts` (antes `middleware.ts`) se ejecutaría fuera de `fra1`. Misma URL. Next.js 16 confirma que `proxy` «in optimized cases [is] deployed to your CDN». https://nextjs.org/docs/app/api-reference/file-conventions/proxy (06/11/2026).
- **VERIFICADO.** El contenido estático lo sirve la red de distribución desde el punto más cercano al visitante, en cualquier país; la terminación TLS también. https://vercel.com/docs/regions. No afecta al requisito 26, que habla de las funciones de servidor, pero se anota.
- **VERIFICADO.** La región de ejecución se observa desde fuera en la cabecera de respuesta `x-vercel-id`: «contains a list of Vercel regions your request hit, as well as the region the function was executed in». https://vercel.com/docs/headers/response-headers (11/08/2026). Dentro de la función, la variable de sistema `VERCEL_REGION` da «The ID of the Region where the app is running» (solo en ejecución). https://vercel.com/docs/environment-variables/system-environment-variables (15/07/2026).
- **NO VERIFICADO.** El formato exacto de `x-vercel-id` (qué segmento es la región de la función). La página no da ejemplo. Se fija con la primera respuesta real (PRUEBA-021).

### 1.3 Dominio propio con el DNS en otro proveedor

- **VERIFICADO.** Un subdominio se añade al proyecto y se configura con un registro **CNAME** en el proveedor de DNS; cada proyecto tiene su propio valor de CNAME, que muestra la consola («Each project has a unique CNAME record»). No hace falta mover los servidores de nombres. https://vercel.com/docs/domains/working-with-domains/add-a-domain (16/09/2026).
- **VERIFICADO.** Hobby admite 50 dominios por proyecto y 200 proyectos. https://vercel.com/docs/limits (16/09/2026) y https://vercel.com/docs/plans/hobby.
- **VERIFICADO.** Solo se pide un registro TXT de verificación (`_vercel` en el dominio raíz) si el dominio ya lo usa otra cuenta de Vercel. Misma URL del primer punto.
- **VERIFICADO.** El certificado se emite y renueva solo; HTTP se redirige a HTTPS con un `308` que no se puede desactivar; los dominios propios llevan `Strict-Transport-Security: max-age=63072000`. https://vercel.com/docs/cdn-security/encryption (15/09/2026).
- **NO VERIFICADO.** Que el panel de Axarnet admita un CNAME en un subdominio con el valor que da Vercel. No se ha consultado a Axarnet (no se envían datos del proyecto a terceros y no hay fuente pública que citar sin el dominio). Lo comprueba el responsable al crear los registros (acto reservado 3).

### 1.4 Dirección estable de preproducción, distinta de la de producción

Tres vías documentadas en https://vercel.com/docs/deployments/environments (17/09/2026):

| Vía | Disponible en Hobby | Observaciones |
| --- | --- | --- |
| Entorno personalizado (`staging`) con su dominio y sus variables | **No.** «Custom environments are available on Enterprise and Pro plans» | Pro incluye 1 por proyecto |
| Dominio asignado a una rama dentro del entorno «Preview» | **Sí** («All plans, including Hobby») | «Branch-specific domains require a deployment associated with the configured Git branch. Git integrations supply this association automatically»; con la CLI hay que pasar metadatos de un proveedor Git (`--meta githubCommitRef=…`), pensados para proyectos enlazados a GitHub, GitLab o Bitbucket. https://vercel.com/docs/cli/alias y https://vercel.com/docs/cli/deploy (18/09/2026). Sin repositorio remoto, la asociación no está documentada. Además, producción y preproducción compartirían proyecto y, por tanto, credencial (ver 1.7) |
| Segundo proyecto: preproducción es el entorno «Production» de su propio proyecto | **Sí** (200 proyectos) | El dominio de un proyecto se asigna a sus despliegues de producción sin depender de ramas. Variables, dominios, protección y credencial quedan separados por proyecto |

- **VERIFICADO.** «The first deployment of a new project is always a production deployment», también con la CLI sin `--prod`. Misma URL.

### 1.5 Protección de acceso y cómo dejar preproducción abierta a internet

- **VERIFICADO.** Los proyectos nuevos nacen con «Standard Protection» y «Vercel Authentication»: protege todas las direcciones **salvo los dominios de producción** («Your production domains stay public»). Disponible en todos los planes. https://vercel.com/docs/deployment-protection (15/09/2026) y https://vercel.com/docs/deployment-protection/usage-and-pricing (15/09/2026).
- **VERIFICADO.** En un diseño de dos proyectos, `pre-nido.<dominio>` es el dominio de producción del proyecto de preproducción y, por tanto, queda público sin tocar nada. Las direcciones generadas de cada despliegue (`*.vercel.app`) siguen protegidas.
- **VERIFICADO.** Alternativa de un solo proyecto: «Deployment Protection Exceptions» para dominios de vista previa, disponible en todos los planes. https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/deployment-protection-exceptions
- **VERIFICADO.** Para comprobar un despliegue protegido sin persona existe «Protection Bypass for Automation», en todos los planes: un secreto por proyecto que se envía en la cabecera `x-vercel-protection-bypass`. Vercel lo expone además en los despliegues como variable de sistema. https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation (16/09/2026).
- **VERIFICADO.** `vercel curl` (CLI 48.8.0 o posterior) añade esa cabecera él solo: usa, por este orden, la opción `--protection-bypass`, la variable de entorno del secreto de paso o «an existing or newly created automation bypass token from the project's settings». Necesita `curl` en el sistema. https://vercel.com/docs/cli/curl (02/10/2026).
- **NO VERIFICADO.** Que una credencial limitada a un proyecto pueda leer el secreto de paso ya creado. Si no puede, el secreto se pone en el entorno de la máquina (PRUEBA-024).

### 1.6 Despliegue desde la máquina local con la CLI, sin repositorio remoto

- **VERIFICADO.** `vercel deploy` despliega la carpeta sin integración con Git. Opciones usadas por el diseño: `--prod`, `--skip-domain` («Must be used with `--prod`… will disable the automatic promotion (aliasing)»), `--yes`, `--meta CLAVE=valor`, `--logs`, `--token`, `--project`. La salida estándar es la dirección del despliegue; un código de salida distinto de 0 es error. https://vercel.com/docs/cli/deploy (18/09/2026).
- **VERIFICADO.** Despliegue preparado y promoción: `vercel --prod --skip-domain` y después `vercel promote <url>`. La promoción de un despliegue de producción preparado «doesn't require a rebuild». https://vercel.com/docs/cli/deploying-from-cli (08/09/2026) y https://vercel.com/docs/deployments/promoting-a-deployment (26/06/2026).
- **VERIFICADO.** La versión de Node de la compilación y de las funciones se fija con `"engines": {"node": "26.x"}` en `package.json`; `26.x` está disponible y es la versión por defecto. https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (27/02/2026).
- **VERIFICADO.** Con `package-lock.json`, Vercel ejecuta por defecto `npm install`, no `npm ci`. Se cambia con `"installCommand"` en `vercel.json`. Con Node 26 usa npm 11. https://vercel.com/docs/package-managers (11/08/2026).
- **VERIFICADO.** Límites: 100 MB de archivos fuente por despliegue con la CLI en Hobby; 15 000 archivos; 45 minutos de compilación; 1 despliegue simultáneo en Hobby. https://vercel.com/docs/limits.
- **NO VERIFICADO.** Qué metadatos del repositorio local (autor y mensaje del commit) envía la CLI por su cuenta. La página dice «The CLI reads Git metadata from the local checkout» sin enumerarlos. El diseño despliega desde una copia exportada sin carpeta `.git`, con lo que no hay metadatos que enviar.
- **NO VERIFICADO.** Que `vercel inspect` acepte un dominio propio como argumento para saber qué despliegue lo sirve; la página habla de «deployment URL or ID». https://vercel.com/docs/cli/inspect (PRUEBA-027).

### 1.7 Alcance de las credenciales (requisito 60)

- **VERIFICADO.** Desde el 30/07/2026 un token de acceso se puede limitar a **un proyecto**: «Project: Limited to a single project within a team. The token can only read and write resources belonging to that one project.» «A project-scoped token denies any request to another project, to a user-level resource, or to a team-level resource.» Se elige caducidad al crearlo; el valor se muestra una sola vez; un token de proyecto no puede crear otros tokens. https://vercel.com/docs/accounts/access-tokens (08/09/2026) y https://vercel.com/changelog/project-scoped-tokens (30/07/2026).
- **VERIFICADO (por ausencia).** No existe un alcance por **entorno** dentro de un proyecto. Un token de proyecto puede desplegar en cualquier entorno de ese proyecto y leer sus variables de tipo Config.
- **Conclusión.** El requisito 60 solo se puede cumplir con **dos proyectos**: la credencial de preproducción se limita al proyecto de preproducción y no puede desplegar en el de producción ni leer sus variables. Con un único proyecto (ramas o entornos) no se cumple en ningún plan, porque la credencial alcanzaría los dos entornos.
- **NO VERIFICADO: posible bloqueo.** Ninguna de las dos páginas dice en qué planes están disponibles los tokens de proyecto. No consta restricción, pero tampoco consta que Hobby los tenga. Se comprueba antes que nada, cuando el responsable cree el primer token (PRUEBA-022). Si Hobby no los ofrece, el requisito 60 no se puede cumplir en plan gratuito y hay que llevarlo al responsable (asunto abierto A-2 del diseño).
- **CONTRADICCIÓN menor entre dos páginas oficiales**, sin efecto en el diseño: sobre qué tipo de token puede crear otros tokens desde la CLI, https://vercel.com/docs/accounts/access-tokens y https://vercel.com/docs/cli/tokens no dicen exactamente lo mismo. El diseño no crea tokens desde la CLI: los crea una persona en la consola.

### 1.8 Vuelta atrás y despliegue fallido

- **VERIFICADO.** «Instant Rollback» reasigna los dominios a un despliegue anterior sin compilar. «Hobby users can roll back to the immediately previous deployment»; para ir más atrás la CLI responde `To rollback further than the previous production deployment, upgrade to pro.` Solo son elegibles los despliegues que ya sirvieron un dominio de producción. https://vercel.com/docs/instant-rollback (07/07/2026) y https://vercel.com/docs/cli/rollback (17/03/2026).
- **VERIFICADO.** Tras una vuelta atrás, Vercel desactiva la asignación automática de dominios; se restablece al promover un despliegue con `vercel promote`. Misma URL.
- **VERIFICADO.** Las variables de entorno no se actualizan en una vuelta atrás: el despliegue anterior conserva los valores con los que se compiló. Misma URL.
- **VERIFICADO.** Solo hay una operación de promoción o de vuelta atrás a la vez por proyecto: una vuelta atrás nueva se rechaza (`409 Conflict`) mientras otra sigue en curso; una promoción nueva sustituye a la que está en curso; pasados 3 minutos una operación se considera caducada. Misma URL.
- **VERIFICADO.** Un despliegue cuya compilación falla termina con error y no recibe dominios; con `--skip-domain`, un despliegue correcto tampoco los recibe hasta que se promueve. Mientras tanto, el dominio sigue sirviendo el despliegue anterior. https://vercel.com/docs/cli/deploy.
- **NO VERIFICADO.** Si «immediately previous deployment» cuenta solo los despliegues que llegaron a servir o también los preparados que nunca se promovieron. Lo decide la prueba de vuelta atrás (PRUEBA-031).

### 1.9 Variables por entorno y cómo se marcan como secretas

- **VERIFICADO.** Cada variable se asigna a Production, Preview o Development; se cifran en reposo; un cambio solo afecta a los despliegues nuevos. Límites: 1 000 variables por entorno y 64 KB en total. https://vercel.com/docs/environment-variables (17/09/2026) y https://vercel.com/docs/limits.
- **VERIFICADO.** Hay dos tipos: **Config** (legible después por quien tenga acceso) y **Secret** («write-only after saving»). Los valores Secret de 32 caracteres o más se sustituyen por `[REDACTED]` en los registros de compilación. Existe una política opcional de equipo, «Separate Production Secret Values», que obliga a que cada secreto tenga en producción un valor distinto. https://vercel.com/docs/environment-variables/sensitive-environment-variables (28/08/2026).
- **VERIFICADO.** Las variables de sistema (`VERCEL_REGION`, `VERCEL_ENV`…) hay que activarlas en el proyecto. https://vercel.com/docs/environment-variables/system-environment-variables.
- **NO VERIFICADO.** Que la política «Separate Production Secret Values» exista en Hobby. Con dos proyectos no hace falta.

### 1.10 Registros de ejecución: dónde y cuánto tiempo

- **VERIFICADO.** Registros de compilación: «stored indefinitely for each deployment». Registros de ejecución: **1 hora** en Hobby (1 día en Pro). https://vercel.com/docs/limits y https://vercel.com/docs/logs/runtime (28/08/2026).
- **VERIFICADO, con efecto en un requisito.** Cada entrada del registro de ejecución guarda, entre otros campos, «Request Path», «**Search Params**: Search parameters of the request path», «Request User Agent», «Host», método, código y región; y la consola permite filtrar «matching your IP address and User Agent», lo que indica que también guarda la dirección IP de origen. No figuran cuerpos de petición, cabeceras de autorización ni cookies. https://vercel.com/docs/logs/runtime. **La plataforma conserva los valores de la cadena de consulta durante el plazo de retención**, y la documentación no ofrece cómo desactivarlo. Choca con la letra de los requisitos 40 y 63 (asunto abierto A-1 del diseño).
- **VERIFICADO.** La exportación de registros («Drains») no está en Hobby. https://vercel.com/docs/plans/hobby.
- **NO VERIFICADO.** En qué país se almacenan los registros. Ninguna página consultada lo dice. Para el requisito 43 se documenta como «ubicación no declarada por el proveedor; se asume fuera de la UE».
- **VERIFICADO.** Las alertas de Vercel («Alerts») son de «Enterprise and Pro plans with Observability Plus». En Hobby no hay avisos de errores. https://vercel.com/docs/alerts (09/09/2026).

### 1.11 Límites que afectan a una prueba de 3 días con una llamada cada hora desde dos asistentes

Uso estimado: 2 asistentes × 24 ejecuciones × 3 días = 144 ejecuciones; con descubrimiento, renovación de token y tres herramientas, unas 10 peticiones por ejecución: unas 1 500 invocaciones. La comprobación de disponibilidad cada 5 minutos en dos entornos añade unas 17 300 al mes.

| Recurso | Incluido en Hobby | Uso estimado | Fuente |
| --- | --- | --- | --- |
| Invocaciones de funciones | 1 000 000 al mes | Menos de 20 000 | https://vercel.com/docs/plans/hobby |
| CPU activa | 4 horas al mes | Minutos | Misma |
| Duración máxima de una función | 300 s | Menos de 5 s | Misma |
| Despliegues al día | 100 | Menos de 20 | https://vercel.com/docs/limits |
| Compilaciones por hora | 100 | Menos de 10 | Misma |
| Despliegues simultáneos | 1 | 1 | Misma |
| Registros de ejecución | 1 hora | Insuficiente para revisar 3 días | https://vercel.com/docs/logs/runtime |

- **VERIFICADO.** Al superar un límite en Hobby hay que esperar 30 días; la pausa no se levanta sola. https://vercel.com/docs/plans/hobby.
- **VERIFICADO.** No hay pausa por inactividad en Vercel: la guía de pausas no la menciona entre las causas. https://vercel.com/kb/guide/why-is-my-account-deployment-blocked.
- **Aviso para la función 001.** Su criterio 24 pide revisar los registros del servidor de los 3 días de prueba. Con 1 hora de retención y sin exportación, los registros de la plataforma no sirven para eso. Lo tiene que resolver el diseño de la 001.

### 1.12 Las seis condiciones del requisito 31, resumidas

| Condición | Vercel Hobby |
| --- | --- |
| Uso permitido | Solo no comercial. Riesgo aceptado por el responsable (requisito 71) |
| Región fijada en la UE | Sí: una región, `fra1`, sin conmutación |
| Pausa por inactividad | No existe; sí por límites o por incumplir las condiciones |
| Copias | No aplica: la plataforma no guarda datos de la aplicación |
| Dominio propio | Sí, con CNAME en el proveedor de DNS |
| Dirección estable para preproducción | Sí, con un segundo proyecto |

## 2. Supervisión de errores (V-112)

Requisitos que debe cumplir: datos en la UE, plan gratuito, no capturar cuerpos, cabeceras ni cookies, separación por entorno, aviso por correo ante un error nuevo.

### Opción A. Sentry, región de la UE, plan Developer

- **VERIFICADO.** Región de la UE en Fráncfort (Alemania); se elige al crear la organización y no se puede cambiar. https://docs.sentry.io/organization/data-storage-location/
- **VERIFICADO.** En la región elegida se guardan los eventos de error. Se guardan **siempre en EE. UU.**: cuentas de usuario, ajustes de la organización y de los proyectos, claves DSN, registros de auditoría y datos de uso. Las comprobaciones de disponibilidad de Sentry «may be stored outside» la región. Misma URL.
- **VERIFICADO.** Plan Developer: gratuito, 1 usuario, 5 000 errores al mes, 30 días de consulta, alertas por correo, 1 monitor de disponibilidad. Plan Team: 29 $ al mes. https://sentry.io/pricing/
- **PARCIAL.** Acuerdo de encargo: existe, pero hay que aceptarlo expresamente («opt-in»); la página no dice si alcanza al plan gratuito. Mecanismo de transferencia: Marco de Privacidad de Datos UE-EE. UU. y, en su defecto, cláusulas contractuales tipo. https://sentry.io/legal/dpa/. Coherente con el requisito 29: mientras el plan sea gratuito no hay datos reales.
- **VERIFICADO.** Cómo no capturar: Sentry admite eventos enviados directamente a su punto de entrada de sobres (`POST /api/<proyecto>/envelope/`), con un cuerpo JSON cuyos únicos campos obligatorios son `event_id`, `timestamp` y `platform`. Enviando el evento desde código propio, sin SDK, solo sale lo que ese código escribe. https://develop.sentry.dev/sdk/data-model/envelopes/ y https://develop.sentry.dev/sdk/data-model/event-payloads/
- **VERIFICADO.** En el servidor hay limpieza de datos activada por defecto y un ajuste para no almacenar direcciones IP, en «Security & Privacy» de la organización y del proyecto. https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/
- **VERIFICADO.** Alertas: condición «A new issue is created», acción de notificar a un miembro, por defecto «on every trigger» (intervalo mínimo configurable de 5 minutos). https://docs.sentry.io/product/alerts/create-alerts/issue-alert-config/
- **NO VERIFICADO.** Códigos de respuesta del punto de entrada (la página de sobres solo cita 401, 403 y 404) y si un proyecto nuevo trae ya una alerta por defecto. Se fijan en PRUEBA-034.
- **CONTRADICCIÓN** en la documentación de Sentry sobre el tiempo de espera de sus comprobaciones de disponibilidad (10 s en un apartado, hasta 30 s en otro). https://docs.sentry.io/product/uptime-monitoring/. No afecta: no se usa esa función.

### Opción B. GlitchTip alojado, región de la UE

- **VERIFICADO.** Plan gratuito de 1 000 eventos al mes y 30 días de retención; primer plan de pago, 15 $ al mes; alojamiento «in both the US and EU (Germany)»; enlaza un acuerdo de encargo. https://glitchtip.com/pricing
- **NO VERIFICADO.** Avisos por correo ante un error nuevo, compatibilidad del punto de entrada con el de Sentry y proveedor de infraestructura. La página de precios no lo dice y no se ha encontrado otra fuente oficial en esta consulta.

### Opción C. Better Stack (seguimiento de errores)

- **PARCIAL.** Se declara compatible con los SDK de Sentry. https://betterstack.com/docs/errors/start/
- **NO VERIFICADO.** Región de los datos, límites del plan gratuito y avisos por correo. El plan gratuito se describe como «Free for personal projects». https://betterstack.com/pricing. Sin región de la UE verificada no cumple el requisito 39.

### Opción D. No añadir ningún servicio

- **VERIFICADO: no basta.** En Hobby, Vercel guarda los registros de ejecución 1 hora, no avisa de errores (las alertas son de Pro con Observability Plus) y no dice dónde los almacena. No se cumplen los requisitos 39 (datos en la UE) ni 42 (aviso por correo).

**Recomendación para V-112:** opción A, con envío propio y sin SDK. Su estado en el registro es PROPUESTO hasta que el responsable la confirme (requisito 46).

## 3. Comprobación externa de disponibilidad y avisos por correo

| Servicio | Plan gratuito | Uso | Datos | Fuente |
| --- | --- | --- | --- | --- |
| UptimeRobot | 50 monitores, intervalo de 5 minutos, avisos por correo | «UptimeRobot is available for any use, including commercial and business use» | Empresa de la UE (UptimeRobot s. r. o., Bratislava; ley eslovaca). **NO VERIFICADO** dónde se alojan | https://uptimerobot.com/pricing/ y https://uptimerobot.com/terms/ |
| Sentry (monitor de disponibilidad) | 1 monitor; cada monitor adicional, 1 $ | Sin restricción declarada | Los resultados pueden guardarse fuera de la región. Crea la incidencia tras 3 fallos seguidos | https://sentry.io/pricing/ y https://docs.sentry.io/product/uptime-monitoring/ |
| Better Stack | 10 monitores, avisos por correo | «Free for personal projects» | **NO VERIFICADO** intervalo del plan gratuito ni región | https://betterstack.com/pricing |

- Hacen falta 2 monitores (uno por entorno). El monitor único de Sentry no alcanza sin pagar.
- **NO VERIFICADO.** Que el plan gratuito de UptimeRobot incluya el aviso por correo en la tabla comparativa (el texto de la página lo lista como canal) y cuántas comprobaciones fallidas espera antes de avisar. Se mide en PRUEBA-037.
- Los datos que guarda este servicio son la dirección de cada entorno, el resultado de cada comprobación y el correo de aviso del responsable. No hay datos de terceros.
- **Recomendación:** UptimeRobot, plan gratuito, 2 monitores HTTPS cada 5 minutos, aviso al correo que ponga el responsable. PROPUESTO hasta su confirmación.

## 4. Entorno de preproducción de la base de datos (V-114)

Esta función no crea proyectos; deja la verificación hecha.

- **VERIFICADO.** Plan gratuito: 2 proyectos («You are granted two free projects», contados entre todas las organizaciones donde se es propietario o administrador); los proyectos pausados no cuentan; pausa tras 1 semana sin actividad; 500 MB de base de datos; sin copias automáticas. https://supabase.com/pricing y https://supabase.com/docs/guides/platform/billing-on-supabase
- **VERIFICADO.** Regiones de la UE: `eu-west-1` (Irlanda), `eu-west-3` (París), `eu-central-1` (Fráncfort), `eu-north-1` (Estocolmo). Londres y Zúrich no son UE. https://supabase.com/docs/guides/platform/regions
- **NO VERIFICADO.** Que el plan gratuito permita elegir región (la página de regiones no distingue por plan; T-003 ya anotó que la región no se puede cambiar después).
- **VERIFICADO.** Ramas: cada rama es un entorno aparte con su propia instancia y credenciales; hay ramas efímeras y persistentes; las persistentes no se pausan ni se borran solas; se crean con la integración de GitHub o desde el panel («currently in beta»); no copian datos por defecto; el esquema se construye a partir de las migraciones. https://supabase.com/docs/guides/deployment/branching
- **VERIFICADO.** Las ramas no están en el plan gratuito: «Pro y superiores», a 0,01344 $ por rama y hora (unos 9,7 $ al mes una rama persistente). https://supabase.com/pricing
- **VERIFICADO.** Plan Pro: 25 $ al mes por organización, con 10 $ de crédito de cómputo que cubren una instancia Micro; cada proyecto adicional añade su cómputo (unos 10 $ al mes en Micro); copias diarias de 7 días; no se pausa. No se pueden mezclar planes dentro de una organización. Mismas URL.
- **NO VERIFICADO.** En qué región se crea una rama (la página no lo dice).

| Vía para preproducción | Mientras todo sea gratuito | En la versión distribuible (Pro) |
| --- | --- | --- |
| Segundo proyecto | **Posible.** 0 $. Consume los 2 proyectos gratuitos (preproducción y producción); no queda un tercero para desarrollo. Pausa a los 7 días sin uso; sin copias | Unos 10 $ al mes más (cómputo Micro del segundo proyecto) |
| Rama persistente | **No disponible** | Unos 9,7 $ al mes; depende de GitHub o de una función en beta |

**Conclusión para el responsable:** con planes gratuitos la única vía es el segundo proyecto. La decisión es suya; el estado de V-114 pasa a «verificada, pendiente de elección».

## 5. Batería local en Windows 11 sin Docker, con Node 26 y npm 11

Versiones leídas del registro oficial de npm (`registry.npmjs.org/<paquete>/latest`) y de las publicaciones oficiales de cada proyecto.

### 5.1 Escáner de secretos

- **Lo que ya hay.** `scripts/patrones-secretos.mjs` tiene 9 patrones propios del proyecto y nunca devuelve el valor. Lo usan el gancho y `comprobar-specs.mjs`. **No basta solo:** no cubre credenciales de otros proveedores ni el historial, y su propio comentario dice que es «una barrera de ayuda, no una garantía».
- **VERIFICADO. Gitleaks 8.30.1** (publicada el 21/03/2026). Licencia MIT. Binario para Windows (`gitleaks_8.30.1_windows_x64.zip`) con archivo de sumas (`gitleaks_8.30.1_checksums.txt`); no necesita Docker. Órdenes `git` (historial, con `--log-opts`), `dir` (carpeta) y `stdin`; `--redact` oculta el valor en la salida; código de salida 1 si hay hallazgos; configuración en `.gitleaks.toml`. https://github.com/gitleaks/gitleaks y https://api.github.com/repos/gitleaks/gitleaks/releases/latest
- **VERIFICADO: mantenimiento limitado.** «Gitleaks is feature complete… I'm not merging new features»; en adelante solo recibirá parches de seguridad. Misma URL. Es aceptable para una herramienta de patrones; se revisa al reactivar la función 003.
- **NO VERIFICADO.** Compatibilidad con Node 26: no aplica, es un binario independiente. Que el informe en archivo de Gitleaks también oculte el valor con `--redact`: el diseño no conserva ese archivo.

### 5.2 Escáner de dependencias

- **VERIFICADO.** `npm audit` viene con npm 11. `--audit-level` fija «the minimum level of vulnerability for npm audit to exit with a non-zero exit code» (`info`, `low`, `moderate`, `high`, `critical`, `none`) y «does not filter the report output». Exige archivo de bloqueo. `npm audit signatures` verifica las firmas del registro. https://docs.npmjs.com/cli/v11/commands/npm-audit
- **VERIFICADO.** `npm ci` «will exit with an error» si el archivo de bloqueo no coincide con `package.json` y «will never write to package.json or any of the package-locks». https://docs.npmjs.com/cli/v11/commands/npm-ci
- **NO VERIFICADO.** El código de salida de `npm audit` cuando no llega al registro. El diseño no depende de él: si no hay un informe JSON válido, la comprobación cuenta como fallida.

### 5.3 Análisis estático para TypeScript y Next.js 16

- **VERIFICADO.** Next.js 16 ya no ejecuta el linter al compilar y `next lint` se ha retirado: se usa la CLI de ESLint con `eslint.config.mjs`. https://nextjs.org/docs/app/getting-started/installation (02/10/2026).

| Herramienta | Versión | Licencia | Node admitido | Notas |
| --- | --- | --- | --- | --- |
| `eslint` | 10.14.0 | MIT | `^20.19.0 \|\| ^22.13.0 \|\| >=24` | Incluye Node 26 |
| `typescript-eslint` | 8.72.2 | MIT | `>=21.1.0` | Exige `typescript >=4.8.4 <6.1.0` y `eslint ^8.57 \|\| ^9 \|\| ^10` |
| `eslint-config-next` | 16.4.6 | MIT | — | Exige `eslint >=9.0.0`; trae `@next/eslint-plugin-next` 16.4.6 |
| `eslint-plugin-security` | 4.2.1 | Apache-2.0 | `>=21.1.0` | Mantenido por `eslint-community` |
| `prettier` | 3.10.1 | MIT | `>=14` | Formato |
| `typescript` | 7.0.2 (`latest`) | Apache-2.0 | `>=16.20.0` | Ver nota |
| `vitest` | 5.1.0 | MIT | `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` | Pruebas |
| `vercel` (CLI) | 65.15.0 | Apache-2.0 | `>= 20` | Despliegue |

- **Incompatibilidad encontrada.** La última versión de TypeScript es 7.0.2, pero `typescript-eslint` 8.72.2 solo admite versiones anteriores a 6.1.0. Hay que fijar la última 6.0.x. **NO VERIFICADO** su número exacto: se lee con `npm view typescript versions` al instalar (T-001 pide volver a comprobar al instalar).
- **NO VERIFICADO.** Que todos los complementos que arrastra `eslint-config-next` (`eslint-plugin-react`, `-import`, `-jsx-a11y`) funcionen con ESLint 10. Si alguno no lo admite, se fija la última ESLint 9.x. Se comprueba al instalar.
- **VERIFICADO. Semgrep en Windows está en fase beta** («Windows (beta)») y necesita Python 3.10 o posterior instalado aparte; la guía de inicio pasa por `semgrep login`. https://docs.semgrep.dev/getting-started/quickstart. **NO VERIFICADO** su licencia en esa página. No se adopta en la batería local: añade Python a una máquina que no lo tiene y su soporte de Windows no es estable.
- Todas las herramientas elegidas son paquetes de npm, quedan fijadas por el archivo de bloqueo y funcionan en Windows sin Docker.

## 6. Next.js 16.4 y Node 26

- **VERIFICADO.** Next.js 16.4 se publicó el 06/10/2026. La versión estable vigente en npm es **16.4.6** (licencia MIT, `node >=20.9.0`, React `^19.0.0`). La última publicación de seguridad es del 03/11/2026. https://nextjs.org/blog y https://registry.npmjs.org/next/latest
- **VERIFICADO.** Requisitos: Node 20.9 como mínimo; Windows admitido; TypeScript 5.1 como mínimo; el empaquetador por defecto es Turbopack. https://nextjs.org/docs/app/getting-started/installation
- **VERIFICADO.** React estable: 19.3.1 (MIT). https://registry.npmjs.org/react/latest
- **VERIFICADO.** Node 26 («Lithium») es LTS; última versión, **v26.13.1**. https://nodejs.org/en/about/previous-releases. La página no da fechas de fin de vida.
- **VERIFICADO.** `instrumentation.ts` con `onRequestError(error, request, context)` es estable desde la 15.0.0; `context.routePath` es la ruta del archivo (por ejemplo, `/app/blog/[dynamic]`) y `request.path` es la ruta pedida **con su cadena de consulta**. https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation (09/06/2026).
- **VERIFICADO.** Un manejador de ruta responde `405 Method Not Allowed` a un método que no implementa, y los `GET` son dinámicos por defecto desde la 15. https://nextjs.org/docs/app/api-reference/file-conventions/route (30/04/2026).
- **NO VERIFICADO.** Qué responde una **página** del App Router a un método de escritura. No se ha encontrado documentación oficial. El diseño lo fija con una prueba (PRUEBA-017) y no añade `proxy.ts` para resolverlo.
- T-001 y T-002 siguen siendo válidas. Se vuelven a leer las versiones exactas en el momento de instalar.

## 7. Copia del repositorio sin remoto

- **VERIFICADO.** `git bundle create <archivo> --all` empaqueta todas las referencias y sus commits en un solo archivo; `git bundle verify <archivo>` lo valida (código 0 si es correcto); `git clone <archivo> <carpeta>` lo restaura. No incluye el índice, la copia de trabajo, el stash, la configuración del repositorio ni los ganchos. https://git-scm.com/docs/git-bundle (documentación vigente hasta la 2.56.1).
- **VERIFICADO.** Por defecto, `git clone` clona las etiquetas. https://git-scm.com/docs/git-clone. **NO VERIFICADO** si clona las etiquetas que apuntan a commits que ninguna rama alcanza; lo decide PRUEBA-013.
- **VERIFICADO.** Programación diaria en Windows: `schtasks /create /sc daily /tn <nombre> /tr <orden> /st HH:mm`, que se ejecuta con el usuario actual y privilegios limitados. https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/schtasks-create
- **VERIFICADO.** Para que la tarea se ejecute al encender el equipo si estaba apagado a su hora hace falta el ajuste `-StartWhenAvailable` de `New-ScheduledTaskSettingsSet` («Task Scheduler can start the task at any time after its scheduled time has passed»), que `schtasks` no ofrece. https://learn.microsoft.com/en-us/powershell/module/scheduledtasks/new-scheduledtasksettingsset
- **Lo que la copia no cubre**, por construcción: archivos sin versionar (`.env.local`, `node_modules`), ganchos y configuración local. Es lo correcto: los secretos no deben estar en la copia.

## 8. Firma de las aprobaciones del responsable (lo necesita el diseño; no estaba en el encargo)

- **VERIFICADO.** `ssh-keygen -Y sign -f <clave> -n <espacio> <archivo>` firma un archivo y deja la firma en `<archivo>.sig`; `ssh-keygen -Y verify -f <firmantes> -I <identidad> -n <espacio> -s <archivo>.sig` la verifica leyendo el archivo por la entrada estándar y termina con código 0 si la firma es válida y el firmante está autorizado. El archivo de firmantes admite `namespaces=` y periodos de validez. https://man.openbsd.org/ssh-keygen
- **VERIFICADO.** El cliente OpenSSH es una característica de Windows 10 (1809) y posteriores; se comprueba con `Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'`. https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse
- **NO VERIFICADO.** Que esté instalado en esta máquina y su versión (la firma de archivos exige OpenSSH 8.1 o posterior, dato no confirmado en fuente oficial en esta consulta). Git para Windows trae su propio `ssh-keygen`. Se comprueba en PRUEBA-010.

## 9. Lo que queda sin verificar, reunido

| N.º | Qué | Dónde se resuelve |
| --- | --- | --- |
| 1 | Tokens de proyecto disponibles en Hobby (**posible bloqueo** del requisito 60) | PRUEBA-022, antes de crear nada más; asunto abierto A-2 |
| 2 | Formato exacto de `x-vercel-id` | PRUEBA-021 |
| 3 | Qué responde una página del App Router a un método de escritura | PRUEBA-017 |
| 4 | País donde Vercel guarda los registros | No hay fuente; se documenta como no declarado |
| 5 | Lectura del secreto de paso con un token de proyecto | PRUEBA-024 |
| 6 | `vercel inspect` con un dominio propio | PRUEBA-027 |
| 7 | Alcance de «despliegue inmediatamente anterior» en la vuelta atrás de Hobby | PRUEBA-031 |
| 8 | Respuestas del punto de entrada de Sentry y alerta por defecto de un proyecto nuevo | PRUEBA-034 |
| 9 | Acuerdo de encargo de Sentry en el plan gratuito | Fase 6 (plan de pago) |
| 10 | Alojamiento de los datos de UptimeRobot y número de fallos antes de avisar | PRUEBA-037 |
| 11 | Elección de región en el plan gratuito de Supabase; región de una rama | Quien cree el primer proyecto (fase 2) |
| 12 | Versión exacta de TypeScript 6.0.x; ESLint 10 con los complementos de `eslint-config-next` | Al instalar (tarea de la app base) |
| 13 | CNAME de subdominio en el panel de Axarnet | El responsable, al crear los registros |
| 14 | OpenSSH instalado en la máquina y su versión | PRUEBA-010 |
| 15 | Etiquetas no alcanzables en un clon | PRUEBA-013 |

## 10. Decisiones del registro afectadas (para el chat de coordinación)

| Decisión | Resultado de esta verificación |
| --- | --- |
| T-001 Node 26 | Sigue válida: LTS, v26.13.1; `26.x` es el valor por defecto en Vercel |
| T-002 Next.js 16.4 | Sigue válida: 16.4.6 |
| T-006 Vercel con funciones en `fra1` | Válida en Hobby con una región. Añadir: sin `proxy.ts`; dos proyectos; registros de ejecución con cadena de consulta |
| V-112 Supervisión de errores | Resuelta como PROPUESTO: Sentry en la UE con envío propio, sin SDK |
| V-114 Preproducción de la base de datos | Verificada, con opciones y coste; elige el responsable |
| «Descartado»: planes gratuitos | Ya cambiado por decisión del responsable; aquí están las condiciones verificadas |
| Nuevas, PROPUESTO | UptimeRobot (disponibilidad); Gitleaks 8.30.1; ESLint 10 con `eslint-plugin-security`; TypeScript 6.0.x; Vitest 5; Prettier 3; CLI de Vercel 65 como dependencia de desarrollo; firma de aprobaciones con `ssh-keygen` |

## 11. Añadido el 13/11/2026: prueba gratuita del plan Pro y hechos que pedía el dictamen

Autor: `arquitecto` · Fecha de consulta de todas las fuentes de este apartado: 13/11/2026 · Mismo procedimiento y mismos estados. Motivo: la enmienda 1 de la especificación (D-016) y el dictamen de seguridad del diseño. Los apartados 1.1 y 1.12 hablan del plan gratuito, que ya no se usa (requisito 71); se conservan como historial. No se ha hecho ninguna prueba real.

**Instrucciones dirigidas a agentes encontradas hoy**, tratadas como datos (artículo 7) y no seguidas: todas las páginas de `vercel.com/docs` consultadas siguen trayendo el bloque «For AI agents: Follow these links…», la cabecera `install_vercel_plugin: npx plugins add vercel/vercel-plugin`, un apartado final que invita a ejecutar `npx vercel@latest docs search` y la petición de enviar comentarios siguiendo `https://vercel.com/feedback.md`. No se instaló ni se ejecutó nada, y no se envió nada. En las páginas de Gitleaks, Microsoft, git, npm y OpenBSD no se encontró ninguna.

### 11.1 Prueba gratuita del plan Pro (complementa T-018)

- **VERIFICADO.** «There is a limit of one Pro plan trial per user account.» Límites de la prueba: 1 propietario, 10 miembros, 200 proyectos, 16 horas de CPU activa, 1 440 GB-hora de memoria, 1 000 000 de invocaciones al mes, 50 dominios por proyecto; incluye 20 $ de crédito. https://vercel.com/docs/plans/pro-plan/trials (14/09/2026).
- **VERIFICADO, con efecto en el diseño.** «Once your usage of Active CPU, Provisioned Memory, or Function Invocations exceeds or reaches 100% of the Pro trial usage, your trial will be paused.» «Your trial finishes after 14 days or once your team exceeds the usage limits, whichever happens first.» Misma URL. Agotar la prueba la termina antes de tiempo.
- **VERIFICADO, con efecto en el diseño.** «Without a payment method, your account reverts to a Hobby plan when the trial ends.» «All team members will be removed from your team, and all Hobby limits will apply to your team.» También se puede terminar la prueba a mano con el botón «Downgrade». Misma URL. Por eso, si no se contrata, los proyectos se retiran **antes** del fin de la prueba.
- **VERIFICADO.** No están disponibles durante la prueba: «Drains», «Account webhooks», el dominio gratuito del primer año y las regiones de conmutación de Sandbox. Misma URL.
- **VERIFICADO.** «Observability Plus is enabled by default during the Pro trial. On-demand Observability Plus event usage counts against the $20 Pro trial credit.» Misma URL.
- **NO VERIFICADO.** Qué ocurre exactamente con los proyectos y sus dominios propios al pasar la cuenta al plan gratuito. El diseño no depende de ello: no deja ningún proyecto.

### 11.2 Tokens de acceso

- **VERIFICADO.** Tres alcances: cuenta, equipo y proyecto. «A project-scoped token denies any request to another project, to a user-level resource, or to a team-level resource.» El valor se muestra una sola vez; «Personal access tokens begin with the prefix `vcp_`»; la caducidad se elige al crearlo; «A project-scoped token cannot mint new tokens». https://vercel.com/docs/accounts/access-tokens (08/09/2026).
- **VERIFICADO.** La CLI admite el token por la opción `--token` o por la variable `VERCEL_TOKEN`, y recomienda la variable porque los argumentos se ven en la lista de procesos. https://vercel.com/docs/cli/global-options (28/05/2026).
- **VERIFICADO.** El registro de actividad del equipo («Activity Log») está en todos los planes, y la API devuelve cuándo se usó un token por última vez. Primera URL.
- **NO VERIFICADO.** En qué planes se puede crear un token de proyecto: la página sigue sin decirlo (PRUEBA-022, asunto A-2). Qué caducidades ofrece la consola y cuál es la más corta. Si un token de proyecto puede borrar o detener su propio proyecto; el diseño lo da por posible.

### 11.3 Registros de ejecución y «Observability Plus»

- **VERIFICADO.** Retención: 1 hora en el plan gratuito, 1 día en Pro, 30 días en Pro con «Observability Plus» (con una ventana de consulta de 14 días seguidos). https://vercel.com/docs/logs/runtime (28/08/2026).
- **VERIFICADO.** Campos de cada entrada, entre otros: «Request Path», «Search Params: Search parameters of the request path», «Request User Agent», «Host», método, código y región. El filtro «Logs from your browser» funciona «by matching your IP address and User Agent against incoming requests». Se guarda además lo que la función escriba por la salida estándar y la de errores. Misma URL. La página no ofrece ninguna forma de no guardar la cadena de consulta.
- **VERIFICADO.** «For teams created or upgraded to Pro on or after April 3, 2026, Observability Plus is enabled by default.» Se puede desactivar para el equipo o excluir proyecto por proyecto; un proyecto excluido vuelve a la retención normal. Lo hace quien tiene el papel de propietario. Precio: 1,20 $ por millón de eventos. https://vercel.com/docs/observability/observability-plus (06/07/2026).
- **NO VERIFICADO.** En qué país se guardan. Sigue sin declararse.

### 11.4 Regiones con el plan Pro

- **VERIFICADO.** Regiones por plan: «Hobby: Single region», «Pro: 5 regions», «Enterprise: All regions». «Deploying to more regions than your plan allows causes the deployment to fail before the build step.» La conmutación a otra región sigue siendo solo de Enterprise. https://vercel.com/docs/functions/configuring-functions/region (11/08/2026). Con Pro, una configuración con varias regiones ya no la rechaza la plataforma.
- **CONTRADICCIÓN menor**, sin efecto: esa misma página enlaza una nota de cambios titulada «Pro customers can now configure up to 3 regions» y su tabla dice 5. El diseño configura una.

### 11.5 Vuelta atrás con el plan Pro

- **VERIFICADO.** «For teams on a Pro or Enterprise plan, all deployments previously aliased to a production domain are eligible to roll back. Hobby users can roll back to the immediately previous deployment.» Sigue habiendo una sola operación a la vez por proyecto, con `409 Conflict`. https://vercel.com/docs/instant-rollback (07/07/2026).

### 11.6 Gitleaks: lo que el dictamen dejó sin comprobar

- **VERIFICADO.** Orden de prioridad de la configuración: la opción `--config`, la variable `GITLEAKS_CONFIG`, la variable `GITLEAKS_CONFIG_TOML` y, por último, un `.gitleaks.toml` en la carpeta analizada. Opciones: `--gitleaks-ignore-path` («path to .gitleaksignore file or folder containing one (default ".")») e `--ignore-gitleaks-allow` («ignore gitleaks:allow comments»). https://github.com/gitleaks/gitleaks/blob/master/README.md
- **VERIFICADO.** `--redact`: «redact secrets from logs and stdout». No menciona los informes en archivo. Misma URL.
- **VERIFICADO.** Formatos de informe: `json`, `csv`, `junit`, `sarif` y `template`, este con `--report-template` y una plantilla de texto de Go. El ejemplo de la página incluye el campo `Secret`; una plantilla propia puede no incluirlo. Misma URL.
- **VERIFICADO.** La configuración por defecto no tiene ninguna regla para los tokens de Vercel. Tiene tres para Sentry (`sentry-access-token`, `sentry-org-token`, `sentry-user-token`) y ninguna reconoce un DSN. https://raw.githubusercontent.com/gitleaks/gitleaks/master/config/gitleaks.toml
- **NO VERIFICADO.** La lista completa de campos disponibles en una plantilla; se fija al escribirla (PRUEBA-047). La forma exacta de un DSN; se fija con el primero real, sin escribirlo.

### 11.7 CLI de despliegue: sesión guardada, proyecto y órdenes de proyecto

- **VERIFICADO.** `--global-config` (o `-Q`) fija la carpeta de configuración global. https://vercel.com/docs/cli/global-options
- **VERIFICADO.** En Windows esa carpeta está en `%APPDATA%\Roaming\xdg.data\com.vercel.cli` y contiene `config.json` y `auth.json`; sobre este último: «it allows an attacker to gain access to your provider accounts». https://vercel.com/docs/project-configuration/global-configuration (25/08/2026).
- **VERIFICADO.** El proyecto se indica con `--project`, con `VERCEL_PROJECT_ID` y `VERCEL_ORG_ID`, o con la carpeta `.vercel`, por ese orden. Códigos de salida: 0, éxito; 1, fallo de operación; 2, error de uso. Primera URL.
- **VERIFICADO.** `vercel project delete` borra el proyecto y sus despliegues y pide teclear su nombre, salvo con `--confirm-name`. `vercel project pause` detiene el tráfico de producción y solo funciona en una terminal interactiva; `vercel project resume` lo reanuda. https://vercel.com/docs/cli/project (01/09/2026). Sirve para simular la pausa del criterio 38; lo hace una persona.
- Dato de la página, anotado: «When the CLI detects that it is running under an agent, non-interactive mode is the default.»

### 11.8 Límite por dirección

- **VERIFICADO.** «WAF Rate Limiting is available on all plans.» En Pro: 40 reglas por proyecto, claves de recuento por dirección IP y por huella JA4, ventana fija de 10 segundos a 10 minutos, acción por defecto 429, precio por uso. Los contadores son por región. Se configura en la consola. https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting (28/08/2026).
- **NO VERIFICADO.** Su coste exacto durante la prueba.

### 11.9 Almacén cifrado en Windows

- **VERIFICADO.** `ConvertFrom-SecureString`, sin clave: «If no key is specified, the Windows Data Protection API (DPAPI) is used to encrypt the standard string representation.» `Read-Host -AsSecureString` lee sin mostrar lo tecleado. https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/convertfrom-securestring
- **NO VERIFICADO en esa página.** Que lo cifrado así solo lo descifre la misma cuenta en la misma máquina. Es la propiedad por la que se elige; se comprueba en PRUEBA-046 con una segunda cuenta si el responsable elige la opción 1 del asunto A-3.

### 11.10 git, npm y firmas

- **VERIFICADO.** git: `-c <nombre>=<valor>` («The value given will override values from configuration files»), `--no-pager`, y las variables `GIT_CONFIG_GLOBAL` y `GIT_CONFIG_NOSYSTEM`. https://git-scm.com/docs/git (documentación de la 2.56.0).
- **VERIFICADO.** npm 11: `ignore-scripts` («If true, npm does not run scripts specified in package.json files»), `userconfig`, `globalconfig` y `registry` (por defecto `https://registry.npmjs.org/`); la línea de órdenes tiene prioridad sobre las variables `npm_config_*` y estas sobre los archivos `.npmrc`; en Windows, `npm run` usa `cmd.exe`. https://docs.npmjs.com/cli/v11/using-npm/config
- **VERIFICADO.** `ssh-keygen`: el espacio de nombres de `-Y sign` y `-Y verify` existe «to prevent signature confusion across different domains of use»; el archivo de firmantes admite `namespaces=`. Claves de llave física: `ecdsa-sk` y `ed25519-sk`, con `-O verify-required` («require user verification for each signature»). https://man.openbsd.org/ssh-keygen
- **NO VERIFICADO en documentación.** Las opciones de git que propone el dictamen (`core.fsmonitor`, `core.hooksPath`, `--no-ext-diff`, `--no-textconv`, `--text`): se toman del dictamen y se comprueban en PRUEBA-042. Que `ssh-keygen -Y sign` funcione con una llave física en Windows: la página no lo dice.

### 11.11 Lo que queda sin verificar, añadido a la tabla del apartado 9

| N.º | Qué | Dónde se resuelve |
| --- | --- | --- |
| 16 | Tokens de proyecto disponibles en esta cuenta (sustituye al punto 1) | PRUEBA-022, lo primero en la ventana; asunto A-2 |
| 17 | Caducidad más corta de un token; si un token de proyecto puede borrar o detener su proyecto | Al crear el primer token; se anota |
| 18 | Qué pasa con proyectos y dominios al acabar la prueba sin pago | No se llega a ver: los proyectos se retiran antes |
| 19 | Qué `Host` recibe una función y si puede imitar `x-vercel-id` | PRUEBA-017 y PRUEBA-021 |
| 20 | Si lo que escribe Next.js al escaparse un error pasa por `console` | PRUEBA-035 |
| 21 | Campos de la plantilla de informe de Gitleaks; forma exacta del DSN | PRUEBA-047 y PRUEBA-048 |
| 22 | Opciones de git del dictamen; firma con llave física en Windows | PRUEBA-042; solo si se elige la opción 2 del asunto A-3 |
| 23 | Que la app de escritorio cargue el arnés en una segunda cuenta de Windows | Solo si se elige la opción 1 del asunto A-3 |
| 24 | Que el alias de `npm run` con tubería hacia `node --input-type=module -` funcione en `cmd.exe` | PRUEBA-041 |

### 11.12 Las seis condiciones del requisito 31, para la prueba gratuita del plan Pro

Sustituye a la tabla del apartado 1.12, que era del plan gratuito.

| Condición | Prueba gratuita del plan Pro |
| --- | --- |
| Uso permitido | **PARCIAL.** La restricción al uso no comercial es del plan gratuito (apartado 1.1); la página de la prueba no añade ninguna restricción de uso. No hay una frase que diga expresamente que la prueba admite uso comercial |
| Región fijada en la UE | Sí: `fra1` como única región configurada. El plan admitiría hasta cinco: lo impide la batería (11.4) |
| Pausa por inactividad | No existe. Sí hay pausa, y fin de la prueba, por agotar la CPU, la memoria o las invocaciones (11.1) |
| Copias | No aplica: la plataforma no guarda datos de la aplicación |
| Dominio propio | Sí, con CNAME en el proveedor de DNS; 50 dominios por proyecto (1.3 y 11.1) |
| Dirección estable para preproducción | Sí, con un segundo proyecto (1.4) |

Condición propia de la prueba, que no está en la lista del requisito: dura 14 días, hay una sola por cuenta de usuario y, sin método de pago, la cuenta pasa al plan gratuito al terminar.

### 11.13 Decisiones del registro afectadas (para el chat de coordinación)

| Decisión | Resultado |
| --- | --- |
| T-018 | Añadir: agotar la CPU, la memoria o las invocaciones termina la prueba; «Observability Plus» viene activado y da 30 días de registros; «Drains» no está en la prueba |
| T-006 | Con Pro, hasta 5 regiones: la plataforma ya no rechaza una configuración con varias. Se mantiene `fra1` como única |
| D-016 | Su «próxima acción» está superada: la cuenta existe y la prueba corre desde el 13/11/2026 |
| Nuevas, PROPUESTO | Regla de límite por dirección del cortafuegos de la plataforma; almacén cifrado con DPAPI para las credenciales de la máquina |
