# Propuesta de la coordinación para la 011: el `GET` a `/api/mcp` (23/11/2026)

Origen: prueba real de la 001 (T-119, `evidencias/T-119/paso-9-periodo-programado.md`). `exportar_sucesos` del 23/11/2026 dio 47 sucesos, 16 rechazados y **los 16 con el código `metodo_no_permitido`**: el cliente de Claude envía un `GET` a `/api/mcp` (para abrir el flujo opcional de eventos del transporte HTTP de MCP) y el conector, sin estado por diseño (T-007), contesta 405. Petición del responsable: darle la mejor utilidad posible.

Estado: **PROPUESTA** para el `especificador` y el `arquitecto` de la 011.

## Qué hacer con ello (por orden de valor)
1. **No contarlo como rechazo.** Registrarlo con un código propio (por ejemplo `flujo_eventos_no_ofrecido`) y resultado `correcto` o `no_aplicable`, para que las métricas de rechazos del panel (fases 3 y 4) y las alertas no se inflen ni se disparen por una conducta esperada. Mantener el 405 en la respuesta HTTP.
2. **Usarlo como señal de salud del cliente:** el `GET` aparece en cada conexión de Claude, así que su ausencia o su aumento anómalo puede indicar un cliente raro. Medirlo aparte, sin alerta.
3. **Valor de ofrecer el flujo de eventos: bajo hoy.** Serviría para empujar órdenes (pausa) al instante en lugar de entregarlas en la siguiente ejecución horaria, pero exige conexiones largas y estado en funciones sin estado. Recomendación: **no ofrecerlo** en la 011; las órdenes se entregan en `obtener_instrucciones` en la siguiente revisión (1 h como máximo con tarea horaria). Revisarlo solo si el responsable pide pausa inmediata.
4. Dejar una prueba que fije que `GET` a `/api/mcp` devuelve 405 con `Allow: POST` y queda registrado con el código propio (sin contenido, art. 1).

## A comprobar
- Contra la especificación del transporte Streamable HTTP vigente (2026-07-28): que contestar 405 al `GET` es válido para un servidor que no ofrece flujo de eventos (V-: verificar-decision antes de especificar).
- Cuántos `GET` hace cada cliente (en la prueba: 4 o 5 por conexión).
