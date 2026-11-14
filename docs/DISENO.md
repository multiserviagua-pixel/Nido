# Diseño: sistema visual, páginas y accesibilidad

Estado: PROPUESTA de referencia. Los valores exactos se fijan en la fase 3 con el `disenador-ui` y se validan con un comprobador de contraste.

## Referencia

`docs/referencia/dashboard-referencia.jpg` (D-004). Se toma su estructura y su tono: menú lateral oscuro, fila de tarjetas de cifras, gráficos en morado, lista de tareas y alertas. Es una captura de un producto de terceros: no se copian su marca, sus nombres, sus textos ni su iconografía.

## Principios

1. **La cifra primero.** Cada pantalla responde a una pregunta: ¿funcionan los agentes?, ¿qué necesita mi atención? Lo demás va debajo.
2. **Estado con palabra, no solo con color.** «Sin señal», «En pausa», «Con avisos». El color acompaña.
3. **Nada que no sea verdad.** Sin cifras de adorno ni tendencias sin datos suficientes. Si no hay datos, se dice.
4. **Sobrio.** Un color de acento, tipografía clara, poca decoración.
5. **Mismo sistema en los dos dashboards.** El de cliente es un subconjunto, no otro diseño.

## Estructura de pantalla

- Menú lateral fijo a la izquierda, oscuro, con el área actual resaltada. En móvil se pliega en un cajón.
- Cabecera con título, selector de periodo cuando aplique y cuenta del usuario.
- Cuerpo en rejilla: fila de tarjetas de cifras, luego gráficos y tablas, y a la derecha o al final, alertas.
- Ancho máximo de contenido; nunca desplazamiento horizontal de página.

## Valores iniciales

| Uso | Valor | Nota |
| --- | --- | --- |
| Menú lateral | `#0B1230` | Texto claro encima |
| Acento | `#6C3CE9` | Botones primarios, serie principal de los gráficos |
| Acento suave | `#EFE9FF` | Fondos de selección e iconos |
| Fondo de página | `#F8FAFC` | |
| Superficie | `#FFFFFF` | Tarjetas, con borde `#E5E7EB` y esquinas redondeadas |
| Texto | `#0F172A` | |
| Texto secundario | `#64748B` | |
| Correcto | `#15803D` | Siempre con icono o palabra |
| Aviso | `#B45309` | Siempre con icono o palabra |
| Error | `#B91C1C` | Siempre con icono o palabra |

Tipografía sin remates del sistema o una fuente abierta alojada en nuestro dominio (no se cargan fuentes de terceros en tiempo de ejecución). Cifras con números tabulares.

## Componentes base

Tarjeta de cifra (etiqueta, valor, variación con signo y periodo), etiqueta de estado, tabla con orden y paginación, gráfico de líneas y de barras, lista de alertas con acción, diálogo de confirmación para acciones que cambian algo (pausar, revocar, publicar, volver atrás), formulario con errores junto al campo, aviso temporal, estado vacío, esqueleto de carga.

Toda acción que afecta a agentes de clientes pide confirmación y dice qué va a pasar y cuándo («Se aplicará en la siguiente revisión de cada agente»).

## Estados obligatorios de cada vista

Carga, vacío (con qué hacer a continuación), error (qué ha pasado y cómo reintentar), sin permiso y datos parciales. Una vista sin estos estados no pasa la puerta P5.

## Páginas

**Superadmin**

| Página | Contenido |
| --- | --- |
| Resumen | Clientes activos, agentes sin señal, informes de hoy, alertas abiertas, versión en cada canal, impagos |
| Clientes | Lista con estado, y ficha: licencia, códigos de activación, conexiones, informes, órdenes, reglas, suscripción |
| Versiones | Versiones registradas, qué sirve cada canal, publicar, volver atrás, métricas por versión |
| Órdenes | Pausar y reanudar, con su estado de entrega y confirmación |
| Alertas | Abiertas y resueltas, por tipo y gravedad |
| Facturación | Estado de cobro por cliente, gracia, estado manual, enlace a Stripe |
| Auditoría | Quién hizo qué y cuándo |
| Ajustes | Pausa global, administradores |

**Cliente**

| Página | Contenido |
| --- | --- |
| Resumen | Estado del agente, última revisión, cifras del periodo, si está en pausa |
| Actividad | Histórico de cifras por revisión |
| Suscripción | Estado y acceso al portal de Stripe |
| Cuenta | Sus datos de acceso |

## Gráficos

- Un gráfico, una idea. Título que dice la conclusión o la medida, ejes con unidad.
- La serie principal en el acento; las demás en grises o tonos distinguibles también sin color.
- Cada gráfico tiene una tabla equivalente accesible.
- Antes de crear un gráfico se carga la skill de visualización de datos disponible en la sesión.

## Accesibilidad (WCAG 2.2 AA)

- Contraste mínimo 4,5:1 en texto y 3:1 en componentes y gráficos.
- Todo se puede usar con teclado; foco visible; orden de foco lógico.
- Objetivos táctiles de al menos 24 por 24 píxeles.
- Formularios con etiqueta visible, errores asociados al campo y anunciados.
- Nada depende solo del color.
- Respeta la preferencia de reducir movimiento.
- Idioma de la página declarado como español.

## Textos y formatos

- Español de España, trato de tú, frases cortas, sin jerga técnica en el dashboard de cliente.
- Fechas `12 nov 2026, 08:04`; miles con punto y decimales con coma; hora de Madrid indicada cuando haya duda.
- Los botones dicen lo que hacen: «Pausar agente», «Revocar conexión», «Publicar en prueba».
- Los errores dicen qué ha pasado y qué se puede hacer. Nunca muestran datos internos.
