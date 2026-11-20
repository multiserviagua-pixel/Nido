---
name: herramienta-mcp
description: Lista de comprobación para crear o cambiar una herramienta del conector MCP (obtener_instrucciones, enviar_informe, confirmar_orden) o su contrato. Úsala al tocar src/mcp, src/app/api/mcp o contratos.
---

# Herramienta del conector

Las herramientas del conector son ruta crítica: pasan por el `revisor` y el `auditor-seguridad`.

## Contrato primero

1. El contrato está en `contratos/<herramienta>.schema.json`: entrada, salida y anotaciones. Se cambia ahí antes que en el código, y el cambio viene del diseño.
2. La validación del servidor se deriva del contrato. Si el código y el contrato no coinciden, es un defecto.
3. Añadir una herramienta nueva o un campo de texto libre exige decisión del responsable (artículos 1 y 14).

## Entrada

- Lista cerrada: enteros acotados, booleanos, enumerados, identificadores con formato. Nada de texto libre.
- **Ningún identificador de cliente o de licencia.** El cliente se deriva del token dentro de la base de datos.
- Lo que no esté en el contrato se descarta antes de validar. Se cuenta cuántos campos eran; no se guardan ni se registran sus nombres ni sus valores.
- Un valor de tipo o rango incorrecto se rechaza con un motivo de lista cerrada.

## Ejecución

- La herramienta llama a una función del esquema `privado` con el HMAC del token. No consulta tablas.
- `src/mcp/` solo usa `src/lib/supabase/conector.ts`. No importa `admin.ts` ni `servidor.ts`.
- Repetir la misma llamada no duplica nada.
- **Cierre en fallo**: ante cualquier error, la respuesta no contiene prompt, reglas ni datos. `obtener_instrucciones` devuelve siempre un estado explícito.

## Salida

- Solo los campos del contrato.
- Los errores llevan un código de lista cerrada. Nunca el valor recibido, ni detalles internos, ni trazas.
- El prompt se entrega tal como está registrado, con su versión y su huella.

## Registros

Ruta, herramienta, resultado, código de error y duración. Nunca argumentos, cabeceras de autorización, tokens ni cuerpos.

## Anotaciones

Las de `contratos/`. Ninguna herramienta es de solo lectura (`readOnlyHint: false` en las tres; AR-01 por D-036, 20/11/2026; ADR-0007, punto 11): `obtener_instrucciones` también escribe (ejecución y orden entregada). No se cambia una anotación para evitar una confirmación del asistente.

## Pruebas obligatorias por herramienta

1. Caso correcto.
2. **Campos de más**: se guarda sin ellos y se cuentan.
3. **Token de otro cliente**: no puede leer ni escribir nada del primero.
4. Sin token, token caducado, token revocado y token de otro recurso.
5. Tipo incorrecto y valor fuera de rango: rechazo sin eco del valor.
6. Repetición de la misma llamada.
7. Dos llamadas a la vez.
8. Licencia suspendida y pausa: estado explícito y ninguna instrucción.
9. Los registros generados por las pruebas no contienen los valores enviados.
