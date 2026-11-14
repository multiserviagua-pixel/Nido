# 041 · Propuestas de cambio a documentos compartidos

Fecha: 12/11/2026 · Autor: orquestador de la fase 5 (a partir del informe del `especificador`) · Estado: PROPUESTA

Cambios que la función 041 necesita fuera de su carpeta. No se ha aplicado ninguno. Los decide el chat de coordinación con el responsable. Cada punto lo he comprobado leyendo el documento citado.

## Cambios propuestos

| N.º | Documento | Cambio propuesto | Por qué |
| --- | --- | --- | --- |
| 1 | `docs/MODELO-DATOS.sql`, vista `resumen_cliente` | Que el resumen del cliente dé el mismo estado que recibe su agente: licencia, baja del cliente, orden de pausa propia, pausa general y falta de versión aplicable, distinguiendo la pausa pendiente de la ya aplicada. Sin dar al usuario acceso a los ajustes globales | Hoy `en_pausa` solo mira la orden propia. En una pausa general el panel diría que el agente no está en pausa. El usuario de cliente no recibe ninguna fila de `ajustes_globales`, así que una vista que se ejecuta con su sesión no puede calcularlo |
| 2 | `docs/MODELO-DATOS.sql`, políticas «Usuario de un cliente» y permisos | Que la sesión de un usuario de cliente solo pueda leer los datos de la lista cerrada de la 041 (lista A). Hoy las políticas dan filas enteras de `clientes`, `licencias`, `ordenes`, `ejecuciones` e `informes`, todo `catalogo_problemas` y las vistas `resumen_cliente` y `metricas_version` | Con su sesión puede pedir a la API de datos lo que el panel no pinta: canal, estado manual y caducidad de la licencia, autor de una orden, conexión y versión de cada ejecución, campos descartados y versión del prompt de cada informe. El criterio de la fase 5 «no ve datos internos» se incumpliría aunque la interfaz no los muestre |
| 3 | `contratos/informe.schema.json` y prompt 1.3 (función 012) | Describir si `sin_tratar`, `facturas_pendientes` y `urgentes` cuentan lo nuevo de cada revisión o lo que queda pendiente | Sin esa definición no se pueden agregar de forma verdadera en el Resumen (cuestión abierta 7). Es un cambio de descripción, no de campos |
| 4 | `docs/PLAN.md`, fase 5 | En la entrega, separar el estado de la suscripción del Resumen (ahora es de la función 042). En los criterios, cambiar «las conexiones de otros» por «ninguna conexión», si el responsable lo confirma | Coincide con la propuesta 10 de la función 010 |
| 5 | `docs/DISENO.md` | Decir cuándo se muestra la variación de una tarjeta de cifra y si las páginas de cliente llevan gráfico, según la cuestión abierta 8 | La tarjeta de cifra lleva variación con signo, en tensión con el principio 3 («nada que no sea verdad») |
| 6 | Funciones 013 y 032 (alerta «sin señal») | Usar un único criterio de «sin señal» para la alerta del superadmin y para el panel de cliente | Si difieren, los dos paneles se contradicen |

## Coordinación con otras fases

| Fase | Qué hay que acordar |
| --- | --- |
| 2 (función 010) | La 010 deja a su diseño la lista de lo que lee el usuario de cliente (su cuestión abierta 5). La 041 fija esa lista para sus vistas. Hay que decidir cuál manda; propongo que mande la lista de la fase 5, porque es la que responde al criterio «no ve datos internos», y que la 010 la aplique |
| 4 (funciones 030 y 032) | El informe trae el número de versión del prompt. Si el responsable decide mostrarlo, hay que aclarar que no es el registro de versiones, que la 030 reserva al superadmin. La pausa general es de la 032 |
| 5 (función 040) | La prueba de acceso cruzado de extremo a extremo está en las dos: la 040 cubre el marco y las pantallas de acceso; la 041, los datos. La lista de datos visibles debe quedar en un solo sitio al aplicar las respuestas del responsable |
