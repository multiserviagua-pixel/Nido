# 053 · Propuestas para el chat de coordinación

Cambios que esta función necesitaría fuera del rango 050 a 059. El chat de la fase 6 no los aplica: los anota aquí para que los valore el chat de coordinación (documentos compartidos) o el chat de la fase dueña del archivo.

Estado de todas: **PROPUESTA**, sin aplicar. Varias dependen de las respuestas del responsable en `aclaraciones.md`.

Fecha: 12/11/2026 · Origen: especificación de la función 053 e informe del `especificador`.

## La más importante: el periodo en paralelo no es posible tal como está planteado

El plan (fase 4 y fase 6) prevé clientes funcionando «en paralelo con la carpeta `panel`». Pero el prompt 1.3 de la fase 2 sustituye el apartado «Panel de salud» por el conector, y el prompt 1.2 desaconseja dos agentes sobre el mismo correo. Para comparar las mismas revisiones por los dos canales hace falta una **versión de transición** del prompt, registrada como cualquier otra, que siga al conector y además deje el archivo de salud en la carpeta. Nadie la ha especificado.

| N.º | Para quién | Qué se propone |
| --- | --- | --- |
| P-01 | Coordinación, fase 2 (prompt 1.3) y fase 4 (versiones y piloto) | Decidir quién especifica la versión de transición. Propuesta: la escribe la fase 2 junto con el prompt 1.3, y la fase 4 la registra y la sirve al piloto. La fase 4 la necesita antes que la 6 |

## Documentos compartidos

| N.º | Archivo | Qué se propone | Motivo |
| --- | --- | --- | --- |
| P-02 | `docs/PLAN.md`, fase 6, criterios de aceptación | Añadir un criterio para la migración, por ejemplo: «Todos los clientes del inventario están en un estado final (migrado, se mantiene en `panel` por decisión del responsable, o baja)» | La migración figura como entrega, pero no tiene ningún criterio |
| P-03 | `docs/PLAN.md`, fase 4, criterio «Las cifras del cliente piloto coinciden con las de su carpeta `panel`» | Darle umbral (días, porcentaje de coincidencia) y aclarar qué es el piloto y en qué entorno funciona | Sin umbral no se puede comprobar. El piloto real antes de B-003 choca con la arquitectura (ver también `specs/051-publicacion-operacion/propuestas.md`, P-02) |
| P-04 | `docs/INSTALACION-CLIENTE.md` | Añadir la variante para clientes que ya tienen el agente: desactivar la tarea programada del prompt 1.2 (riesgo de dos tareas sobre el mismo correo), cómo volver a la carpeta `panel`, y qué hacer con ella tras el corte | La guía está pensada para clientes nuevos y sigue en BORRADOR hasta cerrar la fase 1 |
| P-05 | `docs/PLAN.md` o `docs/ARQUITECTURA.md` | Reconocer que no todos los clientes tienen carpeta `panel`: en el prompt 1.2 es opcional | El plan da por hecho que todos la tienen |

## Otras fases

| N.º | Fase | Qué se necesita saber o coordinar |
| --- | --- | --- |
| P-06 | 1 (función 001, decisión D-013) | Si el cliente en pausa puede ordenar una revisión hablando con su agente. El prompt 1.2 lo permite; la guía de instalación dice que la pausa se pide a HumanaIA. La 053 lo necesita para el aviso previo al cliente |
| P-07 | 2 (prompt 1.3) | Si el prompt servido por el conector mantiene la regla de convivencia con el agente de Apps Script (no tratar el correo ya etiquetado) |
| P-08 | 2 (modelo de datos) | El modelo de referencia no tiene estado de migración por cliente ni fuente de órdenes vigente |
| P-09 | 3 (panel superadmin) | Que el panel muestre la fuente de órdenes de cada cliente y no dé por emitida una orden por el conector a un cliente cuya fuente sigue siendo la carpeta |
| P-10 | 4 (pausa global) | La pausa global no alcanza a los clientes que aún se rigen por la carpeta `panel`. Conviene decirlo en su especificación y en la guía de incidentes |

## Nota sobre formatos (para el diseño, sin cambio en contratos)

El archivo de salud del prompt 1.2 no casa con `contratos/informe.schema.json`: lleva `cliente` y `fecha`, sus `problemas` son frases y no códigos, y `asistente` y `almacenamiento` van con mayúscula inicial. La comparación del paralelo y una posible importación tienen que tenerlo en cuenta. No se propone cambiar el contrato.
