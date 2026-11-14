# ADR (borrador): Plataforma local, dos proyectos de despliegue y aprobaciones firmadas

Estado: BORRADOR del `arquitecto`, 12/11/2026, puesto al día el 13/11/2026 con la segunda versión del diseño (enmienda 1 de la especificación y dictamen de seguridad). No es una decisión: lo registra el chat de coordinación, con el número que corresponda, cuando el responsable apruebe el diseño de la función 002 (puerta P1).

Decisiones relacionadas: D-002, T-001, T-002, T-006, V-112, las respuestas del responsable del 12/11/2026 recogidas en `specs/002-plataforma-base/aclaraciones.md`. Matiza ADR-0001.

## Contexto

El responsable decidió el 12/11/2026 que, hasta nuevo aviso, todo es local y con planes gratuitos: sin repositorio remoto, sin CI remoto y con integración desasistida. La frontera «Repositorio → producción» de `docs/ARQUITECTURA.md` descansaba en una rama protegida, revisión obligatoria y CI, que dejan de existir hasta la función 003. La verificación en documentación oficial (`specs/002-plataforma-base/verificaciones.md`) añade tres hechos: en Vercel una credencial se puede limitar a un proyecto pero no a un entorno; el código de `proxy.ts` se ejecuta en todas las regiones; y la conmutación entre regiones solo existe en el plan Enterprise. El 13/11/2026 el responsable decidió (D-016) que la plataforma de despliegue no se usa durante el desarrollo ni en su plan gratuito: los entornos se crean dentro de la prueba gratuita de 14 días del plan Pro, abierta ese día.

## Decisión

1. **Repositorio local con integración por orden.** A `main` solo se entra con `integrar`, que ejecuta la batería sobre el commit candidato en un clon limpio y exige revisión guardada sobre ese mismo commit. Cada commit de integración lleva sus evidencias y una etiqueta `integrado/NNNN`. Una comprobación de la batería recorre la rama y bloquea integrar y desplegar si algo no cuadra. **Las reglas, los firmantes, los verificadores y el código de las órdenes se leen de `main`, nunca del candidato ni de la copia de trabajo.**
2. **Aprobaciones, órdenes y declaraciones firmadas.** Los cambios reservados (artículo 14), las órdenes de despliegue en producción y lo que solo el responsable puede declarar o aceptar son archivos firmados con su clave SSH, cada tipo en su espacio de nombres. Un texto que afirma una aprobación no cuenta. Las órdenes que ejecuta la persona salen de una carpeta sellada fuera del repositorio.
3. **Dos proyectos de despliegue**, uno por entorno, con la misma app. Cada uno tiene su dominio, sus variables, su protección y su credencial limitada al proyecto.
4. **Despliegue preparado, comprobado y promovido.** Se compila sin servir, se comprueba en el propio entorno (disponibilidad y región) y solo entonces se asigna el dominio. La vuelta atrás reasigna el dominio al despliegue anterior sin compilar.
5. **Sin `proxy.ts`** mientras la región deba ser solo `fra1`.
6. **Supervisión con envío propio**, sin SDK: el módulo solo puede escribir una lista cerrada de campos.
7. **Entornos solo dentro de la ventana de prueba o con el plan de pago contratado.** No se despliega hasta que el responsable firma la confirmación de las condiciones de inicio; al terminar la ventana, o se contrata el plan o se retiran los proyectos. Nada se sirve desde el plan gratuito de la plataforma.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| Un proyecto con preproducción en una rama o entorno | La credencial alcanzaría producción: los tokens se limitan a un proyecto, no a un entorno |
| Ejecutar las órdenes desde la copia de trabajo, o juzgar al candidato con sus propias reglas | Un candidato podría quitarse de la lista de reservados y rebajar la batería en el mismo commit |
| Aprobación como texto, etiqueta sin firma o anotación | La puede escribir un agente |
| Reactivar ya la función 003 | El responsable la aplazó |
| SDK de supervisión con capturas desactivadas | Lo que captura por defecto cambia con cada versión |

## Consecuencias

- Dentro del procedimiento, un candidato no entra con una aprobación sin firma válida ni puede cambiar las reglas que lo juzgan. Fuera de él, mientras la persona y los agentes compartan cuenta de Windows, los controles dificultan y dejan rastro, pero no impiden que un proceso que actúe a propósito capture lo que la persona teclea o reescriba la rama. Qué barrera se pone (cuenta aparte para los agentes, llave física o aceptación escrita) lo decide el responsable: asunto A-3 del diseño. El resto se cierra con la función 003.
- Desde el ancla, todos los chats integran por la misma orden, también el de coordinación.
- En la plataforma, los dos entornos son «Production» de su proyecto: el código distingue el entorno por la variable `ENTORNO`, no por la de la plataforma.
- Los registros de ejecución de la plataforma guardan la ruta, la cadena de consulta, el agente de usuario y el origen durante su retención (30 días en la prueba): ningún secreto, dato personal ni dato de correo puede viajar en la ruta ni en la consulta. Queda pendiente de la decisión del responsable sobre el asunto A-1 del diseño.
- No hay conmutación de región: si `fra1` cae, el servicio se detiene en vez de salir de la UE. Con el plan Pro la plataforma ya no rechaza una configuración con varias regiones: lo impide la comprobación de región de la batería.
- Contratar el plan de pago no cambia este diseño: los entornos siguen como están.
- ADR-0001 dice «un solo despliegue» y «Vercel Pro»: pasa a ser una app en dos proyectos, que existen solo dentro de la ventana de prueba o con el plan contratado (requisitos 71 a 79 de la función 002).
