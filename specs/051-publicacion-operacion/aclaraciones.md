# 051 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

**Estado: presentadas al responsable el 12/11/2026. Ninguna respondida todavía.** La especificación sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`. Las recomendaciones son del orquestador y no son decisiones.

## A. Las decide el responsable

### 1 · Quién hace la revisión de seguridad independiente

| Opción | Consecuencia |
| --- | --- |
| A. El agente `auditor-seguridad`, con los escáneres y las pruebas de CI | Sin coste añadido. Revisa en parte sus propios dictámenes de las fases anteriores, y la norma dice que ningún modelo es el único árbitro de seguridad |
| B. Lo anterior y, además, una auditoría externa de las rutas críticas, con prueba de intrusión sobre el entorno previo | Revisión de verdad independiente. Tiene coste y plazo de contratación: conviene pedir presupuesto pronto |
| C. Solo la auditoría externa | Se pierde la revisión interna, que es barata y encuentra lo evidente antes |

Recomendación: **B para la publicación general**. El producto entrega instrucciones a agentes con acceso al correo de los clientes; un fallo ahí es el peor caso. Si se publica por etapas (cuestión 10), el piloto puede salir con A y la auditoría externa ser condición de la publicación general. Alcance: las rutas críticas, no el nivel 2 completo de OWASP ASVS.

### 3 · Pérdida de datos y tiempo de recuperación aceptables

Recomendación: **hasta 24 horas de datos perdidos y servicio recuperado en una jornada laboral**. Es lo que da la copia diaria del plan contratado. Los datos son cifras y estados; mientras el servicio está caído, los agentes no reciben instrucciones y no tocan el correo. Aceptar menos de 24 horas exige copias continuas, con un coste mensual que no está en B-002 y que habría que verificar.

### 4 · Con qué datos se prueba la restauración

| Opción | Consecuencia |
| --- | --- |
| A. Copia real de producción en un entorno de prueba aislado, como excepción expresa | Prueba las copias reales. Saca datos reales de producción, aunque sea con acceso restringido y borrado al terminar |
| B. Copia real de producción restaurada en un entorno separado que se trata como producción: mismas reglas de acceso, solo personas, y se elimina al terminar | Prueba las copias reales sin romper la regla. Las comprobaciones las hace una persona, por recuentos |
| C. Solo una copia del entorno previo, con datos ficticios | Prueba el procedimiento, no las copias de producción |

Recomendación: **B**, y hacer la primera prueba antes de que haya clientes reales en producción.

### 5 · Qué pasa con los clientes tras una restauración real

Recomendación: al restaurar, **pausa global activa, todas las conexiones invalidadas y cada cliente vuelve a activar su conector con un código nuevo**; una persona repasa licencias, administradores y versión del prompt antes de levantar la pausa. Es lo más seguro y lo más simple con pocos clientes. La alternativa, reaplicar los cambios desde un registro que sobreviva a la copia, evita molestar a los clientes pero es bastante más compleja. Restaurar producción lo decide el responsable.

### 6 y 8 · Quién recibe las alertas y quiénes son los superadmin

Datos que debe dar el responsable: nombres de quienes reciben las alertas, quién le sustituye en ausencias y quiénes tendrán cuenta de superadmin.

Recomendación: dos personas como mínimo en ambos casos, cada una con su cuenta, y no más de tres superadmin. Alertas por correo y un aviso al móvil para las críticas; atención en horario laboral, sin compromiso de 24 horas. Es aceptable porque el sistema cierra en fallo: con el conector caído, los agentes no hacen nada.

### 9 · Aviso a los clientes en un incidente

Recomendación: avisa el responsable o su sustituto, por el canal habitual con cada cliente y fuera del programa, con plantillas en la guía de incidentes. Se avisa si el agente de un cliente lleva más de 24 horas sin servicio o si el incidente afecta a su licencia o a su conexión. Las obligaciones legales de aviso las confirma el profesional de la función 052.

### 10 · Publicación en un paso o por etapas

| Opción | Consecuencia |
| --- | --- |
| A. El piloto es una publicación limitada, con autorización propia y un subconjunto de la lista (acceso, aislamiento, secretos y revisión interna de las rutas críticas). La publicación general exige la lista completa | Permite el piloto de la fase 4 con garantías. Son dos autorizaciones |
| B. El piloto se hace fuera de producción, sin datos reales | No sirve para comparar las cifras con la carpeta `panel`, que es su objetivo |
| C. El piloto se retrasa hasta después de la autorización general | Se publica sin haber visto el sistema con un agente real |

Recomendación: **A**, y que el piloto sea, si es posible, una cuenta de correo de la propia HumanaIA y no la de un cliente. Afecta a la fase 4: está en `propuestas.md`, P-02.

### 11 · Simulacro de incidente

Recomendación: en el entorno previo, con clientes y agentes ficticios, anunciado, con el responsable y su sustituto, e incluyendo el ejercicio de brechas de la función 052 como un solo ejercicio.

### 15 · Canal para comunicar vulnerabilidades

Recomendación: **sí, mínimo**: una dirección de contacto publicada, que atiende el responsable. Cuesta poco y es lo esperable en un producto publicado.

## B. Detalles, con valor recomendado

Se pueden aceptar en bloque o corregir uno a uno. Sin respuesta expresa siguen abiertos.

| N.º | Cuestión | Recomendación |
| --- | --- | --- |
| 2 | Correspondencia entre escalas de gravedad | Crítico y alto equivalen a BLOQUEANTE; medio, a MAYOR; bajo, a MENOR. Los menores se anotan y el responsable ve la lista al autorizar, sin aceptación escrita uno por uno |
| 7 | Dónde se provocan las alertas de prueba | Las seis en el entorno previo. En producción, además, la de conector caído y una alerta marcada como prueba, antes de que haya clientes reales |
| 12 | Cuándo deja de valer una evidencia | Cuando un cambio posterior toca lo que prueba. Las automáticas se repiten en CI sobre el commit que se publica. Las manuales (restauración, simulacro) valen 90 días |
| 13 | Evidencia de secretos distintos y rotados | Declaración de la persona con nombre del secreto, entorno y fecha, más la comprobación de que el valor anterior deja de funcionar. Se acepta que el piloto tenga que volver a activar su conector |
| 14 | Objetivos de servicio | Los fija el responsable en esta fase con los valores propuestos en la arquitectura (99,5 % y 1 segundo) como objetivos iniciales. No son condición para publicar y se revisan a los 3 meses |
| 16 | Registro de un incidente real | Fuera del repositorio, en el archivo documental de HumanaIA con acceso restringido. Plazo, el que fije la función 052 |
| 17 | Cambios urgentes tras la autorización | Todo commit distinto necesita autorización. Es abreviada (diferencia y CI en verde) si no toca rutas críticas; si las toca, además revisión de seguridad |
| 18 | Datos y cuentas de prueba en producción | Se retiran todos antes de publicar. Como mucho queda un cliente ficticio marcado «de supervisión», si el diseño lo necesita. Ninguna cuenta de superadmin de prueba |
| 19 | Repetición después de publicar | Restauración cada 6 meses; simulacro y revisión de guías, una vez al año |
| 20 | Quién ejecuta las guías en el entorno previo | Puede hacerlo el agente `qa` en los pasos que no exigen una persona. El responsable ejecuta en persona, al menos, restauración, rotación de secretos e incidentes |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1 | Revisión de seguridad independiente | Pendiente | | |
| 3 | Pérdida de datos y recuperación | Pendiente | | |
| 4 | Datos para la restauración | Pendiente | | |
| 5 | Clientes tras una restauración | Pendiente | | |
| 6, 8 | Destinatarios de alertas y superadmin | Pendiente | | |
| 9 | Aviso a clientes en un incidente | Pendiente | | |
| 10 | Publicación por etapas | Pendiente | | |
| 11 | Simulacro | Pendiente | | |
| 15 | Canal de vulnerabilidades | Pendiente | | |
| 2, 7, 12 a 14, 16 a 20 | Detalles del bloque B | Pendiente | | |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Las anota el chat de coordinación a partir de `propuestas.md`.

- Quién hace la revisión de seguridad final y con qué alcance.
- Objetivos de pérdida de datos y de tiempo de recuperación.
- Publicación por etapas (afecta a B-003 y a la fase 4).
