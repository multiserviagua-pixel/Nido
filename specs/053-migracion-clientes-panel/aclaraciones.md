# 053 · Aclaraciones

Cada cuestión abierta de la especificación, con la respuesta del responsable. Una respuesta supuesta no vale: si no hay respuesta, la cuestión sigue abierta.

**Estado: presentadas al responsable el 12/11/2026. Ninguna respondida todavía.** La especificación sigue en PROPUESTA.

La numeración es la del apartado «Cuestiones abiertas» de `especificacion.md`. Las recomendaciones son del orquestador y no son decisiones.

## A. Datos que debe aportar el responsable

| N.º | Dato |
| --- | --- |
| 1 | Cuántos clientes tienen hoy el agente con seguimiento de HumanaIA y, de cada uno, asistente, plan, almacenamiento, frecuencia y versión del prompt. El inventario con nombres se guarda fuera del repositorio |
| 6 | Si hay clientes con el agente de Apps Script, solo o junto con el prompt 1.2 |
| 8 | Cómo pagan hoy los clientes |
| 20 | Con qué cuentas de HumanaIA están compartidas hoy las carpetas `panel` (personales de quien instaló o una común) |

## B. Las decide el responsable

### 2 · Histórico de la carpeta `panel`

| Opción | Consecuencia |
| --- | --- |
| A. Empezar de cero en el conector | La función se simplifica mucho (desaparecen los requisitos de importación). Las cifras del panel nuevo empiezan el día de la migración; los archivos antiguos siguen en la nube del cliente |
| B. Importar solo cifras y estados | Hay continuidad en las métricas. Los `problemas` antiguos se pierden igualmente, porque son frases libres y no pueden entrar. Más trabajo y una vía más de entrada de datos que vigilar |

Recomendación: **A**.

### 6 · Agente de Apps Script

Recomendación: **fuera de esta migración**. Quien lo tenga sigue igual. Para quien tenga los dos, que el prompt servido conserve la regla de no tratar el correo ya etiquetado es asunto del prompt 1.3 (`propuestas.md`, P-07).

### 8 · Cobro al migrar

Recomendación: **migrar primero y pasar a Stripe después**, como segundo paso y con Stripe en observación. Así no coinciden dos cambios en el mismo cliente. Mientras tanto, el cliente migrado no tiene suscripción registrada y el cobro no toca su licencia.

### 9 · Cliente piloto

Es la misma cuestión que la 10 de la función 051. Recomendación: que el piloto sea una cuenta de correo de la propia HumanaIA, con una autorización limitada del responsable antes de empezar.

### 11 · Quién manda las órdenes durante el paralelo

| Opción | Consecuencia |
| --- | --- |
| A. La carpeta `panel` hasta el corte | No cambia nada para el agente hasta el final. La pausa por el conector y la pausa global no se prueban ni alcanzan al cliente durante el paralelo |
| B. El conector desde que empieza el paralelo; la carpeta solo recibe el archivo de salud | El canal definitivo se ejercita antes del corte y la pausa global ya alcanza al cliente. Una pausa vigente en la carpeta se traslada al conector al empezar |
| C. Una pausa por cualquiera de los dos canales pausa; solo la fuente reanuda | Lo más prudente ante un despiste, pero complica el prompt de transición |

Recomendación: **B**.

### 12 · Versión de transición del prompt

Para comparar las mismas revisiones por los dos canales hace falta una versión registrada que siga al conector y además deje el archivo de salud en la carpeta. Hoy no existe ni está especificada.

Recomendación: **sí, crearla**, por despliegue revisado como cualquier versión. Quién la especifica lo decide la coordinación (`propuestas.md`, P-01); la necesita antes la fase 4 para su piloto. Sin ella no hay paralelo y habría que validar a todos los clientes como en la cuestión 13.

### 13 · Clientes sin carpeta `panel`

Recomendación: validarlos con **7 días de revisiones correctas por el conector y sin alertas**, sin crear una carpeta temporal. Crear y compartir una carpeta solo para comparar añade una exposición que hoy no tienen.

### 4 · Quién instala y cómo

Recomendación: una persona de HumanaIA **con el cliente, en persona o por videollamada** con su pantalla, porque el código se introduce en el momento y los límites se fijan en el asistente del cliente. La lista de límites la rellena quien instala; antes del corte la repite otra persona si hay dos superadmin, o la misma otro día.

## C. Números y detalles, con valor recomendado

Se pueden aceptar en bloque o corregir uno a uno. Sin respuesta expresa siguen abiertos.

| N.º | Cuestión | Recomendación |
| --- | --- | --- |
| 3 | Paralelo | 7 días seguidos y al menos 5 revisiones comparadas; coincidencia del 100 % en las cifras, porque salen de la misma revisión; diferencia de una revisión como máximo en el recuento |
| 5 | Carpeta `panel` tras el corte | Se ofrece conservarla sin compartir o borrarla. Se recomienda dejar de compartirla al acabar el plazo de vuelta atrás. Decide el cliente |
| 7 | Fecha límite | Sin fecha fija en la especificación. Objetivo: todos en un estado final a los 60 días de la publicación general |
| 10 | Herramientas internas y copias | Dejan de usarse para cada cliente en su corte y se retiran cuando no quede ninguno en `panel`. Las copias de archivos de salud que tenga HumanaIA se eliminan al acabar el plazo de vuelta atrás de cada cliente |
| 15 | Tandas | Hasta 5 clientes por tanda. Para pasar a la siguiente, ninguna vuelta atrás por causa del sistema. Al menos 7 días entre tandas |
| 16 | Plazo de vuelta atrás | 14 días tras el corte |
| 17 | Aviso previo | 7 días antes, por el canal habitual con cada cliente. La aceptación de condiciones sigue lo que se decida en la función 052 |
| 18 | Versiones anteriores a la 1.2 | Se migran directamente, sin pasar antes por la 1.2 |
| 19 | Motivos de lista cerrada | Se mantiene en `panel`: asistente no admitido, plan sin conectores, plan sin ejecución desatendida, decisión del cliente, otro. Vuelta atrás: fallo de instalación, cifras que no coinciden, incidencia de seguridad, petición del cliente, otro |
| 21 | Clientes que no responden | Dos recordatorios. Después se mantiene en `panel` 30 días más y el responsable decide. Nunca se migra a nadie sin su participación |

## D. No son de esta función

| N.º | Cuestión | Adónde va |
| --- | --- | --- |
| 14 | Si el cliente en pausa puede ordenar una revisión hablando con su agente | Decisión D-013, abierta en la función 001. `propuestas.md`, P-06 |

## Respuestas

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto en la especificación |
| --- | --- | --- | --- | --- |
| 1, 6, 8, 20 | Datos de los clientes actuales | Pendiente | | |
| 2 | Histórico | Pendiente | | |
| 4 | Quién instala | Pendiente | | |
| 6 | Agente de Apps Script | Pendiente | | |
| 8 | Cobro al migrar | Pendiente | | |
| 9 | Cliente piloto | Pendiente | | |
| 11 | Fuente de órdenes en el paralelo | Pendiente | | |
| 12 | Versión de transición | Pendiente | | |
| 13 | Clientes sin carpeta | Pendiente | | |
| 3, 5, 7, 10, 15 a 19, 21 | Detalles del bloque C | Pendiente | | |

## Decisiones que salen de aquí

Las que deban quedar en `docs/TECNOLOGIAS.md`, con su identificador. Las anota el chat de coordinación a partir de `propuestas.md`.

- Importar o no el histórico de la carpeta `panel`.
- Versión de transición del prompt y quién la especifica.
- Fuente de órdenes durante el paralelo.
