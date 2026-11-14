# 020 · Sistema de diseño y armazón de los dashboards

Estado: PLANIFICADA
Fase: 3 · Fecha: 12/11/2026 · Autor: `especificador`

Estados posibles: PROPUESTA → APROBADA → DISEÑADA → PLANIFICADA → EN CURSO → VERIFICADA → CERRADA.

## Para qué

Los dos dashboards (superadmin en la fase 3 y cliente en la fase 5) necesitan una misma base: un armazón de pantalla, unos componentes y unas reglas de texto, formato, accesibilidad y veracidad que se cumplan siempre, no pantalla a pantalla. Esta función convierte `docs/DISENO.md` en requisitos comprobables, para que las funciones 021 a 024 y las de la fase 5 construyan sus vistas encima sin repetir decisiones ni rebajar el nivel. No contiene datos de negocio ni pantallas concretas.

Las medidas en píxeles (px) de este documento son píxeles CSS a un zum del 100 %.

## Quién la usa y cómo

- Como **superadmin**, quiero un panel que me diga primero si los agentes funcionan y qué necesita mi atención, y que pueda usar desde el móvil, para actuar sin abrir el ordenador.
- Como **persona que usa teclado, lector de pantalla o ampliación**, quiero usar todo el panel sin ratón y sin perder información, para trabajar en igualdad de condiciones.
- Como **cliente** (fase 5), quiero ver el mismo sistema reducido a lo mío, para entenderlo sin aprender otro diseño.
- Como **revisor de la puerta P5**, quiero ver todos los componentes en todos sus estados sin datos reales, para comprobar accesibilidad, móvil y textos sin depender de un entorno con datos.
- Como **equipo que construye las funciones 021 a 024 y las de la fase 5**, quiero componentes que ya cumplen estas reglas, para que cada vista solo tenga que aportar sus datos.

## Requisitos

### Armazón

| ID | Requisito |
| --- | --- |
| REQ-001 | Todas las vistas de los dos dashboards comparten el mismo armazón: menú lateral, cabecera y cuerpo. |
| REQ-002 | El menú lateral es oscuro y resalta el área actual con un indicador que no depende solo del color; el área actual se anuncia como actual a los lectores de pantalla. Las entradas del menú están en el mismo orden en todas las vistas. |
| REQ-003 | El menú solo ofrece áreas que existen y que el usuario puede usar. En la fase 3, para superadmin, son exactamente: Resumen, Clientes, Órdenes, Auditoría y Ajustes. No hay entradas desactivadas, «próximamente» ni de áreas de fases posteriores. Ocultar una entrada no se considera control de acceso: la autorización la decide el servidor. |
| REQ-004 | Con un ancho de ventana de 1023 px o menos, el menú se pliega en un cajón que se abre y se cierra con un botón con nombre accesible; con 1024 px o más está siempre visible. Con el cajón abierto, el foco queda dentro, Escape lo cierra y el foco vuelve al botón; cerrado, sus enlaces no reciben el foco. Elegir un área cierra el cajón. |
| REQ-005 | La cabecera muestra el título de la vista y la cuenta del usuario con sesión iniciada. El título del documento del navegador es distinto en cada vista y describe la vista. |
| REQ-006 | Solo las vistas que lo declaren en su especificación muestran un selector de periodo en la cabecera. El selector dice el periodo activo con palabras y fechas, se maneja con teclado, se aplica a todas las cifras de la vista y su cambio se anuncia. |
| REQ-007 | El cuerpo se organiza en rejilla: primero la fila de tarjetas de cifras, después gráficos y tablas, y las alertas a la derecha en anchos grandes o al final en anchos pequeños. El orden de lectura y de foco coincide con el orden visual. |
| REQ-008 | El contenido tiene un ancho máximo, fijado en el diseño, y la página nunca se desplaza en horizontal en anchos de 320 px o más. |
| REQ-009 | Cada vista ofrece, como primer elemento alcanzable con el teclado, un enlace para saltar al contenido principal. |
| REQ-010 | El armazón y los componentes admiten otro conjunto de áreas (el del dashboard de cliente) sin cambiar su aspecto ni su comportamiento. |

### Componentes base

| ID | Requisito |
| --- | --- |
| REQ-011 | La tarjeta de cifra muestra etiqueta, valor y, cuando la vista lo pide, variación con signo y el periodo con el que se compara. El lector de pantalla la lee como una unidad con esas partes. |
| REQ-012 | La etiqueta de estado muestra siempre una palabra; el color la acompaña. Existe un catálogo cerrado de estados con una sola palabra por estado («Sin señal», «En pausa», «Con avisos», …) que usan igual los dos dashboards. |
| REQ-013 | La tabla tiene encabezados de columna, permite ordenar por las columnas que la vista declare ordenables, anuncia el orden actual, pagina los resultados e indica la posición («Del 26 al 50 de 1.234»). Ordenar y paginar se hacen con teclado, ratón o táctil. |
| REQ-014 | Hay gráfico de líneas y de barras. Cada gráfico tiene un título que dice la medida o la conclusión y ejes con unidad; la serie principal va en el color de acento y las demás se distinguen también sin color. Ningún dato del gráfico exige arrastrar o pasar el puntero por encima para consultarse. |
| REQ-015 | Cada gráfico tiene una tabla equivalente, accesible con teclado y lector de pantalla, con los mismos valores que el gráfico. |
| REQ-016 | La lista de alertas muestra en cada alerta su gravedad con palabra, el momento y, si la tiene, una única acción con un botón que dice lo que hace. |
| REQ-017 | El diálogo de confirmación dice qué va a pasar, a qué o a quién afecta y cuándo se aplicará («Se aplicará en la siguiente revisión de cada agente»). El botón de confirmar dice la acción («Pausar agente»), nunca «Aceptar» o «Sí». Siempre hay una opción de cancelar. |
| REQ-018 | Mientras el diálogo de confirmación está abierto, el foco no sale de él; Escape lo cierra sin hacer nada; al cerrarse, el foco vuelve al elemento que lo abrió. Pulsar Intro nada más abrirlo no ejecuta la acción. |
| REQ-019 | Cada campo de formulario tiene una etiqueta visible y permanente; los obligatorios lo indican con palabra, no solo con un símbolo o un color. |
| REQ-020 | Los errores de formulario aparecen junto al campo, quedan asociados a él y se anuncian; al enviar con errores, el foco va al primer error y lo ya escrito se conserva. Todos los mensajes de validación los da la aplicación en español, nunca el navegador. |
| REQ-021 | El aviso temporal se anuncia sin mover el foco, se puede cerrar con teclado, permanece mientras el puntero o el foco están sobre él y dura al menos el tiempo mínimo fijado en el diseño, nunca menos de 5 segundos. Solo se usa para confirmar resultados que también quedan visibles en la vista; un error o algo que pida actuar nunca se comunica solo con un aviso que desaparece. |
| REQ-022 | El estado vacío dice qué pasa y qué se puede hacer a continuación, con la acción correspondiente si el usuario puede realizarla. |
| REQ-023 | El esqueleto de carga reproduce la forma aproximada del contenido, se anuncia una sola vez como carga y, al llegar los datos, no provoca desplazamientos de diseño por encima del umbral de REQ-064. |
| REQ-024 | Los botones dicen lo que hacen con verbo y objeto. Mientras una acción está en curso, su botón lo indica con palabra y no puede lanzarla otra vez. |

### Estados de cada vista

| ID | Requisito |
| --- | --- |
| REQ-025 | Cada vista y cada bloque de datos tiene cinco estados: carga, vacío, error, sin permiso y datos parciales. Una vista sin alguno no pasa la puerta P5. |
| REQ-026 | El estado de error dice qué ha pasado, en lenguaje llano, y ofrece reintentar sin recargar la página. El menú y la cabecera siguen funcionando. |
| REQ-027 | El estado sin permiso muestra un mensaje genérico y un camino de vuelta al Resumen. No muestra el nombre, el identificador ni ningún dato del recurso, y es indistinguible del que se muestra cuando el recurso no existe. |
| REQ-028 | En datos parciales, la vista muestra lo que sí se ha cargado, marca con palabra cada parte que ha fallado y permite reintentar solo esa parte. |

### Valores visuales

| ID | Requisito |
| --- | --- |
| REQ-029 | Se parte de los valores iniciales de `docs/DISENO.md`. El `disenador-ui` puede ajustarlos sin una aprobación por color, manteniendo el tono de la referencia y el acento morado (D-004). La paleta final queda documentada, con sus diferencias respecto a los iniciales, y cada combinación usada cumple 4,5:1 en todo texto (también el grande) y 3:1 en bordes de controles, indicadores de estado y de foco, iconos con significado y series de gráficos. |
| REQ-030 | Hay un único color de acento, que puede presentarse plano o como degradado suave entre tonos vecinos (REQ-085). Los colores de correcto, aviso y error siempre van con palabra o icono con nombre accesible. |
| REQ-031 | La tipografía es sin remates, del sistema o abierta y alojada en el dominio propio. Las cifras usan números tabulares. El texto es visible en todo momento, también mientras carga la fuente o si no llega a cargar. |
| REQ-032 | En tiempo de ejecución no se carga ningún recurso de terceros: ni fuentes, ni iconos, ni imágenes, ni hojas de estilo, ni guiones, ni analítica. Las únicas conexiones fuera del dominio propio son las de los servicios de datos que el diseño declare. |
| REQ-033 | La marca, los textos y la iconografía son propios o de licencia abierta anotada. No se usa la marca, los nombres, los textos ni la iconografía de la captura de referencia. |

### Accesibilidad (WCAG 2.2 AA)

| ID | Requisito |
| --- | --- |
| REQ-034 | El armazón, todos los componentes y todos sus estados cumplen los criterios de nivel A y AA de WCAG 2.2. |
| REQ-035 | Todo se puede usar solo con teclado. El orden de foco es lógico y sigue el visual. El foco solo queda retenido dentro de un diálogo o del cajón abierto, y siempre con salida por Escape. |
| REQ-036 | El foco siempre es visible, con contraste de al menos 3:1 con su entorno, y nunca queda oculto por completo por la cabecera, el cajón, un aviso u otro elemento superpuesto. |
| REQ-037 | Todo objetivo de pulsación mide al menos 24 por 24 px o cumple la excepción de espaciado de la norma; los enlaces dentro de un párrafo quedan exentos, como admite la norma. |
| REQ-038 | Ninguna información depende solo del color: estados, variaciones, series, errores, área actual y enlaces dentro de texto. |
| REQ-039 | Con la preferencia de reducir movimiento activada no hay animaciones de desplazamiento, de esqueleto ni de transición que no sean esenciales. Nada destella más de 3 veces por segundo, con o sin la preferencia. |
| REQ-040 | Cada vista declara el español como idioma del documento. |
| REQ-041 | Sin pérdida de contenido ni de función: con el texto ampliado al 200 %, con el zum al 400 % sobre una ventana de 1280 px, con el espaciado de texto aumentado según la norma, en vertical y en horizontal, y con el gesto de ampliar del móvil, que no se bloquea. |
| REQ-042 | Cada vista tiene regiones identificadas (navegación, cabecera, contenido principal) y encabezados jerárquicos. Se anuncian a los lectores de pantalla la carga, el error, los avisos, el cambio de periodo y el cambio de orden de una tabla. |
| REQ-043 | Con los colores forzados del sistema (alto contraste), siguen siendo visibles los bordes de controles, el foco, el área actual, los estados y las series de los gráficos. |

### Uso en móvil

| ID | Requisito |
| --- | --- |
| REQ-044 | El armazón y todos los componentes se usan por completo, con táctil, en anchos de 320, 375, 414, 768, 1024, 1280, 1440, 1920 y 2560 px, sin desplazamiento horizontal de página. |
| REQ-045 | Si una tabla necesita más ancho que la pantalla, solo se desplaza la tabla, dentro de su propia región, que tiene nombre accesible y se puede desplazar con teclado; la página no se desplaza en horizontal. |

### Textos y formatos

| ID | Requisito |
| --- | --- |
| REQ-046 | Todos los textos están en español de España, con trato de tú y frases cortas; ninguno queda en otro idioma, tampoco los de estados internos de los componentes («Cargando», «Cerrar», «Página siguiente»). |
| REQ-047 | Las fechas con hora se muestran como `12 nov 2026, 08:04`: día sin cero inicial, mes abreviado en minúscula sin punto, año con cuatro cifras y hora de 24 horas con dos cifras. Las abreviaturas de los meses son una lista cerrada: ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov y dic. |
| REQ-048 | Los números usan punto para los miles, también en los de cuatro cifras («1.234»), y coma para los decimales; los porcentajes, un espacio que no se parte antes del signo («28,4 %»); las variaciones llevan siempre signo explícito, más o menos. |
| REQ-049 | Toda fecha y hora se muestra en la hora de Madrid, con el cambio de horario aplicado, sea cual sea la zona horaria del dispositivo. Cada vista con fechas lo indica una vez («Horas en horario de Madrid»). En la hora que se repite al cambiar el horario en octubre, cada hora de ese intervalo lleva además «hora de verano» u «hora de invierno». |
| REQ-050 | Un valor cero se muestra como «0». Un valor ausente se muestra con la palabra «Sin datos», nunca como cero, guion solo o hueco vacío. |

### La cifra primero y nada que no sea verdad

| ID | Requisito |
| --- | --- |
| REQ-051 | Cada vista declara en su especificación la pregunta que responde, y sus cifras principales van antes que cualquier gráfico, tabla o alerta, en orden visual y de lectura. |
| REQ-052 | Ninguna cifra, gráfico ni tendencia es decorativa: todo valor visible procede de los datos del periodo mostrado. Si no hay datos, se dice. |
| REQ-053 | Una variación solo se muestra si existe el valor de comparación del periodo anterior completo. Con valor anterior cero no se muestra porcentaje. En los demás casos se muestra «Sin datos para comparar». |
| REQ-054 | Los gráficos no deforman los datos: el eje de valores de las barras empieza en cero, un punto sin dato aparece como hueco y no como cero, y si hay menos datos que el mínimo que fije la vista, se muestra «Sin datos suficientes» en lugar del gráfico. |
| REQ-055 | El sentido de una variación no implica por sí mismo que sea buena o mala: el color de valoración lo declara la vista para cada medida, y el signo y la palabra se muestran siempre. |

### Privacidad, aislamiento y cierre en fallo

| ID | Requisito |
| --- | --- |
| REQ-056 | Todo texto que llega como dato (nombres, estados, mensajes, etiquetas) se muestra literalmente como texto, nunca se interpreta como marcado, enlace ni código, en cualquier lugar: cuerpo, título del documento, diálogos, avisos, alertas, gráficos, tabla equivalente y textos para lectores de pantalla. |
| REQ-057 | Ningún mensaje visible ni texto para lectores de pantalla muestra datos internos: mensajes técnicos del servidor o de la base de datos, trazas, nombres de tablas o columnas, rutas internas, identificadores internos, valores recibidos ni credenciales. Los mensajes de error muestran una referencia opaca, sin datos internos, con la que se puede localizar el fallo en los registros. |
| REQ-058 | El navegador no conserva datos de negocio en almacenamiento persistente; solo preferencias de presentación sin datos, enumeradas en el diseño. |
| REQ-059 | La dirección de la página nunca contiene nombres, correos ni texto escrito por el usuario. Sí puede contener identificadores internos (por ejemplo, el del cliente en su ficha) y valores de listas cerradas (página, orden, periodo). Un identificador en la dirección solo elige qué se muestra: nunca concede permiso, que sale siempre de la sesión. |
| REQ-060 | Si se pierde la conexión, el armazón lo indica con palabra y lo anuncia, y los datos ya visibles se marcan con la hora en que se cargaron; no se presentan como actuales. |

### Muestra de componentes

| ID | Requisito |
| --- | --- |
| REQ-061 | Existe una muestra que permite ver el armazón (con las áreas de superadmin y con las de cliente) y cada componente en cada uno de sus estados, con datos ficticios que incluyen casos límite, y activar cada estado sin servidor ni base de datos. La muestra existe en desarrollo y en el entorno previo; no se publica en producción. |
| REQ-062 | Una comprobación automática de accesibilidad recorre todos los estados de la muestra en 320 y 1280 px dentro del CI, y el CI falla si encuentra una infracción de nivel A o AA. |
| REQ-063 | Una revisión manual de accesibilidad, con teclado, lector de pantalla en escritorio y en móvil, ampliación y móvil real, se hace sobre la muestra y queda como evidencia de la puerta P5. La hace una persona: cuando la muestra está lista, el orquestador avisa al responsable, que la hace o designa a quien la haga, con una guía de pasos escrita. Mientras no esté hecha, los criterios que dependen de ella figuran como «no ejecutada». |

### Rendimiento

| ID | Requisito |
| --- | --- |
| REQ-064 | Medidas en laboratorio con perfil de móvil de gama media (procesador ralentizado cuatro veces y red móvil simulada) sobre las vistas de la muestra: elemento principal pintado en 2,5 s o menos, desplazamiento acumulado de diseño de 0,1 o menos y respuesta a cualquier interacción en 200 ms o menos. Umbrales aceptados por el responsable el 12/11/2026 como medida de laboratorio; los de uso real se fijan en la fase 4. |

### Dirección visual, temas, logotipo y navegadores

Añadidos el 12/11/2026 con las respuestas del responsable a las cuestiones 1, 2, 3 y 12 (`aclaraciones.md`).

| ID | Requisito |
| --- | --- |
| REQ-085 | El sistema visual usa degradados suaves como recurso de estilo, dentro de la gama del acento y de los neutros, en superficies y elementos destacados (por ejemplo, el menú, el área actual, los botones primarios o el relleno bajo la línea de un gráfico). Un degradado nunca es el único medio de transmitir una información; el texto y los iconos situados sobre un degradado cumplen los contrastes de REQ-029 en su punto más desfavorable; y con los colores forzados del sistema se sustituyen por colores planos sin pérdida de información. |
| REQ-086 | El aspecto es actual y coherente: colores, degradados, tipografía, espaciado, radios de esquina y sombras salen de una escala documentada de valores, sin valores sueltos fuera de ella. Antes de construir las vistas, el responsable valida una propuesta visual con la paleta, los degradados, el logotipo y al menos tres vistas de la muestra. |
| REQ-087 | El logotipo es propio y se crea en esta función: representa un nido de aves con estética tecnológica. El responsable elige entre al menos tres propuestas. El elegido se entrega en formato vectorial, con variantes para fondo oscuro (menú), para fondo claro y para el icono de la pestaña; se reconoce a 16 y a 32 px; cumple 3:1 de contraste con su fondo; tiene nombre accesible donde informa y se oculta a los lectores de pantalla donde es decorativo; y no reproduce ni imita la marca de la captura de referencia ni la de terceros. El nombre que lo acompaña es «Nido: Agentes de Correo»: se muestra junto al logotipo en el menú y forma parte del título de la pestaña del navegador en todas las vistas. |
| REQ-088 | Hay tema claro y tema oscuro. La interfaz sigue la preferencia de tema del sistema del usuario y cambia con ella sin recargar ni perder el estado de la vista; no hay selector manual. Todos los requisitos de este documento se cumplen en los dos temas, en particular el contraste (REQ-029), el foco (REQ-036), no depender solo del color (REQ-038), los colores forzados (REQ-043), los degradados (REQ-085) y el logotipo (REQ-087). La paleta de cada tema queda documentada. |
| REQ-089 | Se admiten, y con ellos se prueba: las dos últimas versiones de Chrome, Edge, Firefox y Safari en escritorio, Safari en iOS y Chrome en Android; y los lectores de pantalla NVDA en Windows y VoiceOver en iOS. |

## Casos negativos

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| REQ-065 | Nombre de cliente de 120 caracteres, con espacios y sin ningún espacio, en título, cuenta, tabla, tarjeta, diálogo y aviso | Sin desplazamiento horizontal ni solapes; si se acorta a la vista, el nombre completo queda disponible con teclado, táctil y lector de pantalla |
| REQ-066 | Tabla sin filas | Se muestra el estado vacío, no una tabla vacía ni una paginación «Del 0 al 0» |
| REQ-067 | Tabla con 10.000 filas | En pantalla nunca hay más de una página; la posición usa miles con punto; cambiar de página o de orden cumple el umbral de respuesta de REQ-064 |
| REQ-068 | Fallo al cargar datos (red, error del servidor o respuesta mal formada) | Estado de error con reintento; ninguna cifra aparece como cero ni con un valor anterior presentado como actual |
| REQ-069 | Carga lenta | A los 10 s se indica y se anuncia que tarda más de lo normal; a los 30 s pasa a estado de error con reintento; nunca hay carga indefinida. Plazos aceptados por el responsable el 12/11/2026 |
| REQ-070 | La fuente no carga | El texto se ve desde el primer momento con la tipografía de respaldo, sin pérdida de contenido ni desplazamiento por encima del umbral de REQ-064 |
| REQ-071 | Dato con etiquetas de marcado, guiones, enlaces con esquemas peligrosos, entidades o caracteres de control de dirección del texto | Se muestra el texto literal; no se ejecuta nada, no se crea ningún elemento ni enlace, y los caracteres de dirección no alteran el texto que los rodea (por ejemplo, el de un diálogo de confirmación) |
| REQ-072 | Dos avisos temporales a la vez, y cinco | Todos legibles, sin solaparse entre sí, anunciados todos en orden y sin tapar por completo el elemento con foco |
| REQ-073 | Pérdida de conexión a mitad de una acción que cambia algo | No se afirma que haya funcionado; el mensaje dice que no se sabe si se aplicó y cómo comprobarlo; no se repite sola; lo escrito en el formulario se conserva |
| REQ-074 | Doble pulsación, Intro repetido o doble envío en una acción | Se envía una sola vez |
| REQ-075 | Valor de estado fuera del catálogo cerrado, o respuesta con campos de más | La etiqueta muestra «Estado desconocido» con estilo neutro, nunca un estado favorable; los campos de más no se muestran en ningún sitio |
| REQ-076 | Cifra ausente, negativa donde no cabe o no numérica | Se muestra «Sin datos»; nunca cero ni el valor recibido en bruto |
| REQ-077 | Dirección de un área que no existe en la fase (por ejemplo, la de versiones en la fase 3) o de un recurso inexistente | El mismo estado que sin permiso (REQ-027), dentro del armazón y sin datos internos |
| REQ-078 | El servidor rechaza una acción por permisos insuficientes | Mensaje de que no está permitido, sin afirmar ningún cambio ni mostrar datos internos; la vista vuelve a mostrar el estado real |
| REQ-079 | Dispositivo en otra zona horaria, e instantes alrededor de los cambios de horario | Las horas siguen en hora de Madrid, con el cambio aplicado |
| REQ-080 | Navegador o sistema configurado en otro idioma | Textos, mensajes de validación y formatos de fecha y número siguen en español de España |
| REQ-081 | Cifra de 999.999.999 en una tarjeta a 320 px | Se ve completa, sin cortar ni abreviar |
| REQ-082 | Diálogo de confirmación en una ventana de poca altura (568 por 320 px) o con zum al 400 % | Todo su texto se puede leer desplazando dentro del diálogo y los botones se alcanzan con teclado y táctil |
| REQ-083 | Parámetros añadidos a la dirección para cambiar el usuario o el cliente que muestra el armazón | Se ignoran; la cuenta y el contexto mostrados salen solo de la sesión |
| REQ-084 | La muestra de componentes recibe o intenta pedir datos reales | No tiene acceso a datos de ningún entorno: sus datos son solo los ficticios incluidos en ella |

## Criterios de aceptación

Cada criterio se puede ejecutar y tiene un umbral. «La muestra» es la de REQ-061.

| ID | Criterio | Requisitos |
| --- | --- | --- |
| CA-001 | En la muestra a 1280 px, el 100 % de las vistas presentan menú lateral, cabecera y cuerpo; el área actual se distingue con la pantalla en escala de grises y el lector de pantalla la anuncia como actual; el orden de las entradas del menú es idéntico en todas las vistas | REQ-001, REQ-002 |
| CA-002 | Con la configuración de superadmin de la fase 3, el menú tiene exactamente 5 entradas (Resumen, Clientes, Órdenes, Auditoría, Ajustes) y 0 entradas desactivadas o «próximamente». Con la configuración de cliente de la muestra, el armazón solo difiere en las entradas | REQ-003, REQ-010 |
| CA-003 | A 320, 375 y 768 px el menú está plegado; se abre y se cierra con teclado y con táctil; Escape lo cierra y devuelve el foco al botón; cerrado, 0 enlaces del menú reciben foco con el tabulador. A 1024, 1280 y 1920 px está visible sin hacer nada | REQ-004 |
| CA-004 | El título visible coincide con el encabezado principal; 0 títulos de documento repetidos entre las vistas de la muestra; la cuenta del usuario se alcanza en un paso a 320 px. El selector de periodo aparece solo en las vistas que lo declaran; cambiarlo con teclado actualiza el 100 % de las cifras de la vista y el lector lo anuncia | REQ-005, REQ-006 |
| CA-005 | A 1280 px las alertas quedan a la derecha o al final, y a 375 px al final; las cifras principales preceden a gráficos, tablas y alertas; en revisión manual, 0 discrepancias entre el orden visual y los de foco y lectura | REQ-007, REQ-051 |
| CA-006 | En todas las vistas y estados de la muestra, en 320, 375, 414, 768, 1024, 1280, 1440, 1920 y 2560 px, el ancho del documento no supera el de la ventana; a 1920 y 2560 px el contenido no supera el ancho máximo fijado en el diseño | REQ-008, REQ-044 |
| CA-007 | La primera pulsación del tabulador en cada vista muestra el enlace de saltar al contenido, y al activarlo el foco pasa al contenido principal | REQ-009 |
| CA-008 | En la muestra, la tarjeta de cifra en sus variantes (variación positiva, negativa, nula, valor anterior cero, sin comparación, sin dato) presenta etiqueta, valor, variación con signo y periodo, y el lector las lee juntas; con valor anterior cero no hay porcentaje | REQ-011, REQ-053 |
| CA-009 | El catálogo de estados está documentado con una palabra por estado; en la muestra cada estado muestra su palabra; una búsqueda en los textos de la interfaz encuentra 0 estados nombrados con dos palabras distintas | REQ-012 |
| CA-010 | La tabla se ordena por cada columna ordenable con teclado, ratón y táctil, y el lector anuncia el orden; la paginación indica la posición con miles con punto; con 0 filas aparece el estado vacío; con 10.000 filas hay como máximo una página en pantalla y cambiar de página u orden responde en 200 ms o menos | REQ-013, REQ-066, REQ-067 |
| CA-011 | Cada gráfico de la muestra tiene título y ejes con unidad; una prueba automática encuentra el 100 % de los valores del gráfico en su tabla equivalente; las series se distinguen en escala de grises; las barras empiezan en cero; un punto sin dato se ve como hueco; con menos datos que el mínimo aparece «Sin datos suficientes»; ningún valor exige arrastrar o pasar el puntero | REQ-014, REQ-015, REQ-054 |
| CA-012 | Cada alerta de la muestra tiene gravedad con palabra, momento con el formato de REQ-047 y, si tiene acción, un botón con verbo que se usa con teclado | REQ-016 |
| CA-013 | El diálogo dice qué, a qué y cuándo; su botón de confirmar contiene un verbo de acción y 0 diálogos usan «Aceptar» o «Sí»; con el diálogo abierto, 50 pulsaciones del tabulador no sacan el foco; Escape cierra sin efecto; el foco vuelve al elemento de origen; Intro nada más abrir no ejecuta la acción | REQ-017, REQ-018 |
| CA-014 | En el formulario de la muestra, el 100 % de los campos tienen etiqueta visible y los obligatorios lo dicen con palabra; al enviarlo vacío aparece un error junto a cada obligatorio, el lector lo anuncia, el foco va al primero y lo escrito se conserva; con el navegador en inglés aparecen 0 mensajes de validación en inglés | REQ-019, REQ-020, REQ-080 |
| CA-015 | Un aviso se anuncia sin mover el foco, dura al menos 5 s, no desaparece con el puntero o el foco encima y se cierra con teclado; con 2 y con 5 avisos simultáneos, 0 solapes, todos anunciados y el foco nunca tapado por completo; 0 errores comunicados solo con un aviso temporal | REQ-021, REQ-072 |
| CA-016 | El estado vacío de cada bloque de la muestra dice qué pasa y qué hacer; el esqueleto se anuncia una vez como carga; el desplazamiento de diseño al llegar los datos es de 0,1 o menos | REQ-022, REQ-023 |
| CA-017 | Dos pulsaciones en menos de 300 ms, o Intro repetido, sobre una acción de la muestra producen exactamente 1 envío; el botón dice que la acción está en curso; una revisión de textos encuentra 0 botones genéricos («Aceptar», «Enviar», «OK», «Haz clic aquí») | REQ-024, REQ-074 |
| CA-018 | El 100 % de las vistas y bloques de datos de la muestra se pueden poner en carga, vacío, error, sin permiso y datos parciales | REQ-025 |
| CA-019 | Forzando fallo de red, error del servidor y respuesta mal formada, la vista muestra el estado de error con qué ha pasado y un reintento que funciona sin recargar; 0 cifras aparecen como cero; el menú y la cabecera siguen usables | REQ-026, REQ-068 |
| CA-020 | Un recurso denegado y uno inexistente (incluida la dirección de un área de otra fase) producen el mismo contenido visible y el mismo texto accesible (comparación automática, 0 diferencias); 0 apariciones del nombre o identificador del recurso en el documento en ningún momento de la carga; hay enlace al Resumen | REQ-027, REQ-077 |
| CA-021 | Con una de tres fuentes de datos fallando, la vista muestra las otras dos, marca con palabra la que falla y reintenta solo esa; 0 valores de la parte fallida aparecen como cero | REQ-028 |
| CA-022 | El informe del comprobador de contraste cubre el 100 % de las combinaciones usadas y todas cumplen 4,5:1 en texto y 3:1 en bordes de controles, estados, foco, iconos con significado y series; la paleta final está documentada con sus diferencias respecto a los valores iniciales; hay 1 solo color de acento, plano o en degradado suave, y los colores de estado van siempre con palabra o icono con nombre | REQ-029, REQ-030 |
| CA-023 | Bloqueando la descarga de la fuente (si es alojada), el texto es visible desde el primer pintado, sin pérdida de contenido y con desplazamiento de 0,1 o menos; en una columna con 1.111 y 8.888, las cifras ocupan el mismo ancho | REQ-031, REQ-070 |
| CA-024 | El registro de peticiones de red al recorrer toda la muestra contiene 0 peticiones a dominios distintos del propio y de los servicios de datos declarados en el diseño; la revisión de marca, iconos y textos encuentra 0 elementos de la captura de referencia y el 100 % de los iconos con licencia anotada | REQ-032, REQ-033 |
| CA-025 | La comprobación automática de accesibilidad se ejecuta en el CI sobre el 100 % de los estados de la muestra en 320 y 1280 px con 0 infracciones de nivel A o AA, y una infracción introducida a propósito hace fallar el CI | REQ-034, REQ-062 |
| CA-026 | Existe un informe de revisión manual que evalúa cada criterio de nivel A y AA de WCAG 2.2 (cumple o no aplica) con teclado, lector de pantalla en escritorio y en móvil, texto al 200 %, zum al 400 %, espaciado de texto, colores forzados y reducción de movimiento: 0 incumplimientos | REQ-034 a REQ-043, REQ-063 |
| CA-027 | Recorriendo la muestra solo con teclado se completa el 100 % de las acciones; el foco es visible en el 100 % de los elementos con contraste de 3:1 o más; el foco no queda retenido fuera de un diálogo o del cajón; 0 casos de foco oculto por completo | REQ-035, REQ-036 |
| CA-028 | Una medición automática encuentra el 100 % de los objetivos de pulsación con 24 por 24 px o más, o dentro de las excepciones de la norma | REQ-037 |
| CA-029 | Con la muestra en escala de grises, en revisión manual, 0 casos en que estados, variaciones, series, errores, área actual o enlaces dentro de texto se confundan | REQ-038, REQ-055 |
| CA-030 | Con la preferencia de reducir movimiento activada, 0 animaciones de desplazamiento, de esqueleto o de transición no esenciales; con o sin ella, 0 elementos que destellen más de 3 veces por segundo | REQ-039 |
| CA-031 | El 100 % de las vistas declaran el español como idioma del documento | REQ-040 |
| CA-032 | A 1280 px con zum al 200 % y al 400 %, con texto al 200 % y con espaciado de texto aumentado, el 100 % del contenido y de las funciones de la muestra siguen disponibles; a 375 por 667 px en vertical y en horizontal también; el gesto de ampliar funciona en móvil | REQ-041 |
| CA-033 | Con lector de pantalla, cada vista expone navegación, cabecera y contenido principal como regiones, encabezados sin saltos de nivel y anuncios de carga, error, aviso, cambio de periodo y cambio de orden | REQ-042 |
| CA-034 | Con los colores forzados del sistema, en revisión manual, bordes de controles, foco, área actual, estados y series siguen visibles en el 100 % de los componentes | REQ-043 |
| CA-035 | En un móvil real de cada sistema admitido (iOS con Safari y Android con Chrome), a 320 y 375 px, se completa el 100 % de esta lista solo con táctil y sin desplazar la página en horizontal: abrir el menú e ir a cada área, ordenar y paginar una tabla, desplazar una tabla ancha dentro de su región, leer la tabla equivalente de un gráfico, confirmar y cancelar un diálogo, corregir un formulario con error y cerrar un aviso | REQ-044, REQ-045, REQ-089 |
| CA-036 | La revisión de todos los textos de la muestra encuentra 0 textos en otro idioma, 0 tratamientos de usted y 0 textos de componentes sin traducir; con el navegador en inglés, 0 textos en inglés | REQ-046, REQ-080 |
| CA-037 | Las pruebas automáticas de formato dan: el 12 de noviembre de 2026 a las 08:04 de Madrid, «12 nov 2026, 08:04»; los doce meses según la lista cerrada; 1234, «1.234»; 1234567, «1.234.567»; 0,5, «0,5»; 28,4 por ciento, «28,4 %» con espacio que no se parte; variaciones con «+» o signo menos. 0 fallos | REQ-047, REQ-048 |
| CA-038 | Con el dispositivo en UTC, en Nueva York y en Tokio: el instante 2026-11-12 07:04 UTC se muestra «12 nov 2026, 08:04»; 2026-07-01 06:04 UTC, «1 jul 2026, 08:04»; 2026-03-29 01:30 UTC, «29 mar 2026, 03:30». Cada vista con fechas muestra una vez «Horas en horario de Madrid». Los instantes 2026-10-25 00:30 UTC y 2026-10-25 01:30 UTC se muestran como «25 oct 2026, 02:30», el primero con «hora de verano» y el segundo con «hora de invierno». 0 fallos | REQ-049, REQ-079 |
| CA-039 | Un valor 0 se ve como «0»; un valor ausente, negativo donde no cabe o no numérico se ve como «Sin datos» con ese mismo texto accesible; 0 casos en que se vea cero o el valor en bruto | REQ-050, REQ-076 |
| CA-040 | Vaciando todas las fuentes de datos de la muestra, 0 cifras, gráficos o tendencias quedan visibles: todo pasa a estado vacío o «Sin datos». Con un periodo anterior incompleto, la variación dice «Sin datos para comparar» | REQ-052, REQ-053 |
| CA-041 | Introduciendo en cada texto de la muestra una batería de cadenas (etiquetas de marcado, guion, imagen con evento, enlace con esquema peligroso, entidades, comillas, caracteres de control de dirección, emoji, 120 caracteres sin espacios): 0 ejecuciones, 0 elementos o enlaces creados, el texto se ve literal y los caracteres de dirección no alteran el texto vecino, en el cuerpo, el título del documento, diálogos, avisos, alertas, gráficos, tabla equivalente y textos accesibles | REQ-056, REQ-071 |
| CA-042 | Forzando errores cuyo mensaje interno contiene una cadena testigo, la cadena aparece 0 veces en la página, el título, los textos accesibles y los avisos; el 100 % de los mensajes de error muestra una referencia opaca que localiza el fallo en los registros | REQ-057 |
| CA-043 | Tras recorrer la muestra, el almacenamiento persistente del navegador contiene 0 datos de negocio y solo las preferencias enumeradas en el diseño | REQ-058 |
| CA-044 | Recorriendo la muestra, búsquedas incluidas, la dirección contiene 0 nombres, correos o textos escritos; añadiendo a la dirección parámetros de usuario o de cliente, la cuenta y el contexto mostrados no cambian | REQ-059, REQ-083 |
| CA-045 | Al cortar la red, el armazón muestra y anuncia «Sin conexión» y marca los datos visibles con su hora de carga. Cortándola justo después de confirmar una acción: 0 mensajes de éxito, un mensaje dice que no se sabe si se aplicó y cómo comprobarlo, 0 reintentos automáticos y lo escrito se conserva | REQ-060, REQ-073 |
| CA-046 | El inventario de componentes y estados del diseño coincide al 100 % con la muestra; cada estado se activa sin servidor; los datos incluyen los casos límite de este documento; el registro de red de la muestra contiene 0 peticiones de datos a ningún entorno; en producción, la dirección de la muestra responde como un recurso inexistente | REQ-061, REQ-084 |
| CA-047 | La medición de laboratorio con el perfil de REQ-064 sobre cada vista de la muestra da elemento principal en 2,5 s o menos, desplazamiento de 0,1 o menos y respuesta a interacción en 200 ms o menos, en el 100 % de las vistas | REQ-064 |
| CA-048 | Con un retraso simulado, a los 10 s se ve y se anuncia que tarda más de lo normal, y a los 30 s aparece el estado de error con reintento; 0 cargas indefinidas | REQ-069 |
| CA-049 | Con el nombre de 120 caracteres, con y sin espacios, en título, cuenta, tabla, tarjeta, diálogo y aviso, a 320 y 1280 px: 0 desplazamientos horizontales de página, 0 solapes y el nombre completo disponible con teclado, táctil y lector | REQ-065 |
| CA-050 | La cifra 999.999.999 se ve completa en una tarjeta a 320 px | REQ-081 |
| CA-051 | Un valor de estado fuera del catálogo se muestra como «Estado desconocido» con estilo neutro; una respuesta con 3 campos de más no muestra ninguno de ellos en ningún sitio | REQ-075 |
| CA-052 | Ante un rechazo por permisos del servidor, el mensaje dice que no está permitido, 0 mensajes afirman un cambio, 0 datos internos visibles, y la vista muestra el estado real tras releer | REQ-078 |
| CA-053 | A 568 por 320 px y a 1280 px con zum al 400 %, el 100 % del texto del diálogo se lee desplazando dentro de él y sus botones se alcanzan con teclado y táctil | REQ-082 |
| CA-054 | El informe del comprobador de contraste mide el texto y los iconos situados sobre cada degradado en su punto más desfavorable: el 100 % cumple 4,5:1 en texto y 3:1 en iconos e indicadores; con la muestra en escala de grises, 0 informaciones dependen solo de un degradado; con los colores forzados del sistema, 0 degradados visibles y 0 pérdidas de información | REQ-085 |
| CA-055 | Una comprobación automática de los estilos encuentra 0 valores de color, degradado, espaciado, radio o sombra fuera de la escala documentada; y existe la validación escrita del responsable de la propuesta visual (paleta, degradados, logotipo y 3 vistas de la muestra), con fecha anterior a la primera tarea de vistas | REQ-086 |
| CA-056 | Se presentan al responsable al menos 3 propuestas de logotipo y su elección queda anotada con fecha; el elegido existe en formato vectorial en sus 3 variantes; en capturas a 16 y a 32 px se reconoce la figura; el contraste con su fondo es de 3:1 o más en las 3 variantes; el lector de pantalla lo anuncia una vez donde informa y no lo anuncia donde es decorativo; la revisión no encuentra parecido con la marca de la captura de referencia; el nombre «Nido: Agentes de Correo» aparece junto al logotipo en el menú y en el título de la pestaña del 100 % de las vistas de la muestra | REQ-087 |
| CA-057 | Con la preferencia del sistema en oscuro: el informe del comprobador de contraste cubre el 100 % de las combinaciones del tema oscuro con los umbrales de REQ-029; la comprobación automática de accesibilidad recorre el 100 % de los estados de la muestra en 320 y 1280 px con 0 infracciones de nivel A o AA; la revisión manual de CA-026 se hace en los dos temas; y al cambiar la preferencia del sistema con una vista abierta, la interfaz cambia de tema sin recargar y conserva el 100 % del estado de la vista | REQ-088 |

## Fuera de alcance

- Pantallas concretas y sus datos: acceso, doble factor, sesión y administradores (021); clientes, licencias, códigos y conexiones (022); informes, resumen y órdenes (023); auditoría (024). Esta función solo da el armazón, los componentes y las reglas que esas funciones usan.
- Política de contenido, cookies, protección contra incrustación y caducidad de la sesión (amenaza A-21 y función 021). Esta función solo exige que no se carguen recursos de terceros (REQ-032).
- Cómo se avisa antes de que caduque la sesión y qué pasa con lo escrito en un formulario si caduca: lo decide la 021.
- Mínimos de datos para mostrar una tendencia en cada medida y valoración de cada variación como buena o mala: los fija la especificación de cada vista (REQ-054, REQ-055).
- Elección de librerías de interfaz y de gráficos (V-110, en VERIFICAR): se decide en el diseño, no aquí.
- Áreas de fases posteriores: versiones y alertas (fase 4), facturación (fase 6) y las páginas del dashboard de cliente (fase 5). La pausa global de Ajustes es de la fase 4.
- Campana o centro de notificaciones, selector de cliente en la cabecera, saludo personal y bloque de plan en el menú, que aparecen en la captura de referencia.
- Formato de importes de dinero: se fija en la fase 6.
- Otros idiomas, marca blanca por cliente, impresión, exportación de datos y funcionamiento sin conexión.
- Selector manual de tema: el tema sigue la preferencia del sistema (REQ-088).
- Declaración pública de accesibilidad.

## Cuestiones abiertas

Todas resueltas el 12/11/2026. Las respuestas literales del responsable están en `aclaraciones.md`. Resumen: 1, tema claro y tema oscuro según el sistema (REQ-088); 2, logotipo propio y nombre «Nido: Agentes de Correo» (REQ-087); 3, lista aceptada (REQ-089); 4, umbrales aceptados (REQ-064, REQ-069); 5, muestra solo fuera de producción (REQ-061); 6, la hace una persona, con aviso al responsable (REQ-063); 7, «1.234» (REQ-048); 8, «sep» (REQ-047); 9, indicación en cada vista (REQ-049); 10, identificadores internos y valores de listas cerradas (REQ-059: el identificador de cliente, por la nota aclaratoria del artículo 2; la página, el orden y el periodo, a propuesta del orquestador, confirmados al aprobar esta especificación); 11, referencia opaca (REQ-057); 12, paleta ajustable con degradados suaves (REQ-029, REQ-030, REQ-085, REQ-086). El texto original de cada cuestión se conserva debajo.

1. **Tema oscuro.** ¿Hay solo tema claro (con el menú oscuro), o también uno oscuro? Opciones: (a) solo claro: menos trabajo y una sola verificación de contraste; (b) claro y oscuro según la preferencia del sistema: duplica la verificación de contraste y la revisión de P5; (c) además, un selector manual: lo anterior más guardar la preferencia (REQ-058 lo permite como preferencia de presentación).
2. **Nombre y logotipo del menú.** ¿Qué nombre y qué logotipo se muestran arriba del menú y en el icono de la pestaña, y quién entrega el archivo? Opciones: (a) logotipo de HumanaIA en vigor, entregado por el responsable con sus derechos de uso; (b) solo el nombre en texto, sin logotipo, hasta tenerlo; (c) un nombre de producto propio para los dashboards, distinto de la marca de la empresa. Sin respuesta, no se puede cerrar REQ-033. **Respondida el 12/11/2026:** el logotipo se crea en esta función y el nombre es «Nido: Agentes de Correo» (REQ-087).
3. **Navegadores, lectores de pantalla y dispositivos.** ¿Qué se admite y con qué se prueba? Propuesta para decidir: las dos últimas versiones de Chrome, Edge, Firefox y Safari en escritorio, Safari en iOS y Chrome en Android; lectores NVDA en Windows y VoiceOver en iOS. Ampliar la lista aumenta el coste de P5; reducirla deja usuarios sin garantía. CA-035 depende de esta respuesta.
4. **Umbrales de rendimiento y de carga lenta.** ¿Se aceptan los propuestos (REQ-064: 2,5 s, 0,1 y 200 ms con perfil de móvil de gama media; REQ-069: aviso a los 10 s y error a los 30 s)? Opciones: (a) aceptarlos; (b) fijar otros; (c) medirlos solo en laboratorio en esta fase y fijar también umbrales con usuarios reales en la fase 4, con los objetivos de servicio. Son una propuesta del especificador sin datos de uso detrás.
5. **Muestra de componentes en producción.** Opciones: (a) solo en desarrollo y en el entorno previo: nada de más en producción; (b) también en producción, tras el acceso de superadmin con doble factor: permite revisar en el entorno real, a cambio de más superficie expuesta; (c) también en producción y pública: no se recomienda, porque expone la estructura del panel. REQ-084 se cumple en las tres.
6. **Quién hace la revisión manual de accesibilidad.** Los agentes no pueden usar un lector de pantalla ni un móvil reales. Opciones: (a) el responsable u otra persona del equipo, con una guía de pasos; (b) una auditoría externa: más garantía y coste; (c) (a) en esta fase y (b) antes de publicar en la fase 6. CA-026 y CA-035 dependen de esta respuesta. **Respondida el 12/11/2026:** la hace una persona y el orquestador avisa al responsable en ese punto (REQ-063).
7. **Números de cuatro cifras.** `docs/DISENO.md` dice «miles con punto» y la captura usa «6.482», pero la norma académica y la configuración regional habitual del español escriben 1234 sin punto. Opciones: (a) siempre con punto, también en cuatro cifras: alinea mejor en columnas; (b) sin punto en cuatro cifras: sigue la norma. CA-037 se ajusta a la respuesta.
8. **Abreviatura de septiembre.** ¿«sep» o «sept»? Las demás abreviaturas de tres letras sin punto no plantean duda. Afecta a la lista cerrada de REQ-047.
9. **Indicación de la hora de Madrid.** `docs/DISENO.md` dice «cuando haya duda», que no se puede probar. Opciones: (a) siempre, una vez por vista; (b) solo cuando la zona del dispositivo no es la de Madrid; (c) nunca, salvo en la hora repetida del cambio de horario de octubre (por ejemplo, 25 oct 2026 entre las 02:00 y las 03:00), donde dos instantes se verían iguales. En (a) y (b) también hay que decidir cómo se distinguen esos dos instantes.
10. **Estado de la vista en la dirección.** La regla de interfaz dice «ningún dato en la URL que no sea un identificador propio del usuario». ¿Pueden ir en la dirección la página, el orden, el periodo o el identificador de un cliente en su ficha? Opciones: (a) sí, solo identificadores y valores de listas cerradas: el botón de volver y los enlaces compartidos funcionan; (b) no, nada: cada vista vuelve a su estado inicial al recargar. REQ-059 ya prohíbe nombres, correos y texto escrito en los dos casos.
11. **Referencia de error para soporte.** ¿Los mensajes de error muestran una referencia opaca (sin datos internos) para que soporte encuentre el fallo en los registros? Opciones: (a) sí: facilita la operación, y hay que asegurar que no revela nada (REQ-057); (b) no: menos superficie, más difícil diagnosticar lo que cuente un usuario.
12. **Ajuste de los colores iniciales.** Algunos colores iniciales parecen no cumplir los umbrales en algunas combinaciones (ver «Dependencias»). La captura de referencia es decisión del responsable (D-004). ¿Puede el `disenador-ui` ajustar los valores para cumplir el contraste sin una nueva aprobación, siempre que se mantengan el tono y el acento morado, o cada cambio de color necesita la del responsable? **Respondida el 12/11/2026:** el `disenador-ui` ajusta la paleta, con degradados suaves y un aspecto actual (REQ-029, REQ-030, REQ-085, REQ-086).

## Dependencias y decisiones relacionadas

- Decisiones: D-004 (estilo de la captura de referencia), D-005 (producto final), D-012 (constitución, artículos 1, 2, 3, 7, 10, 12 y 13). V-110 (librería de interfaz y de gráficos) está en VERIFICAR: no se usa hasta verificarla en el diseño.
- Respuestas del responsable del 12/11/2026 (`aclaraciones.md`): logotipo propio, dirección visual con degradados suaves y aspecto actual, y aviso al responsable para la revisión manual de accesibilidad. Para el diseño: se usan las skills de diseño disponibles en la sesión, y las librerías de interfaz y de gráficos (V-110) se eligen entre proyectos abiertos actuales y mantenidos, verificados antes de usarlos.
- Nota aclaratoria del artículo 2 de la constitución, aprobada por el responsable el 12/11/2026 (el identificador elige sobre quién se actúa; el permiso sale siempre de la sesión): la aplica coordinación, con fecha y versión. REQ-059 se apoya en ella.
- Documentos: `docs/DISENO.md` (fuente principal), `docs/CALIDAD.md` (puerta P5), `.claude/rules/interfaz.md`, `docs/SEGURIDAD.md` (amenaza A-21, que cubre la 021).
- Funciones que dependen de esta: 021, 022, 023 y 024 (fase 3) y las del dashboard de cliente (fase 5, que según `docs/PLAN.md` necesita «el sistema de diseño de la fase 3 hecho»). La 021 aporta el contenido de la cuenta del usuario en la cabecera y las reglas de sesión.
- Contraste de los colores iniciales, calculado a mano por el especificador (sin herramienta; lo debe confirmar el comprobador de REQ-029): texto secundario `#64748B` sobre fondo de página `#F8FAFC`, unos 4,55:1 (cumple por muy poco); el mismo texto sobre acento suave `#EFE9FF`, unos 4,0:1 (no cumple 4,5:1); borde `#E5E7EB` sobre superficie blanca, unos 1,25:1 (vale como borde decorativo de tarjeta, no como borde de un campo de formulario, que necesita 3:1); acento `#6C3CE9` sobre menú `#0B1230`, unos 3,05:1 (cumple 3:1 por muy poco como indicador del área actual).

## Aprobación

Puerta P0. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 12/11/2026 | Responsable | Aprobada. Respuesta expresa en el chat de la fase 3: «Apruebo la 020» |
