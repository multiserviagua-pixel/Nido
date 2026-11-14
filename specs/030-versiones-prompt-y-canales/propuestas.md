# 030 · Propuestas para coordinación

Cambios que esta función necesitaría en documentos compartidos. El chat de la fase 4 no los edita: los anota aquí para el chat de coordinación. Ninguno está aplicado.

Fecha: 12/11/2026 · Autor: orquestador de la fase 4, a partir del informe del `especificador`.

## Fronteras con otras fases (a confirmar)

| N.º | Asunto | Qué supone hoy la 030 | Quién debería confirmarlo |
| --- | --- | --- | --- |
| 1 | Quién asigna el canal de cada cliente | Lo exige la 030 (REQ-012, REQ-013), porque la ficha de cliente de `docs/DISENO.md` no lo incluye | Fase 3 y coordinación. Si va en la ficha de cliente de la fase 3, esos requisitos se trasladan |
| 2 | Cómo queda registrada la versión 1.3 antes de que exista el registro automático | La fase 2 la pone en servicio por su cuenta; la 030 la incorpora al registro sin cambiar lo que reciben los agentes (REQ-035) | Fase 2 |
| 3 | Qué estado recibe un agente cuando no hay versión aplicable | El modelo de referencia devuelve `pausada`, que mezcla «pausa» con «no hay versión» | Fases 1 y 2 (contrato `obtener-instrucciones`) y D-013 |

## Cambios propuestos en documentos compartidos

| Documento | Cambio | Motivo |
| --- | --- | --- |
| `docs/PLAN.md`, fase 4 | Añadir «Funciones previstas: `030-versiones-prompt-y-canales`, `031-metricas-por-version`, `032-alertas-y-pausa-global`, `033-cliente-piloto-en-paralelo`» | Las demás fases con funciones las listan |
| `docs/SEGURIDAD.md` | Añadir dos amenazas: mover clientes al canal `prueba` para que una versión no promovida llegue a muchos; cambiar los destinatarios del aviso de publicación | Ni A-11 ni A-12 las cubren. La 030 las trata en REQ-013, REQ-025 y REQ-059 y en la cuestión abierta 6 |
| `docs/DISENO.md` | Incluir el canal en la ficha de cliente, o decir que se gestiona en la pantalla de versiones | Ver frontera 1 |
| `docs/MODELO-DATOS.sql` | Historial de publicaciones de solo adición también en los datos (hoy solo lo protegen los permisos); las condiciones de publicación (permanencia, versión ya vigente, simultaneidad, destino de la vuelta atrás) no pueden depender solo de la interfaz; auditoría del registro de versiones | El modelo deja que un superadmin inserte publicaciones directamente. Lo resolverá el diseño de la 030; se avisa para que la fase 2 no lo dé por cerrado |
| `.claude/skills/version-prompt/SKILL.md` | Alinear el formato del número de versión con el contrato del informe (tercer número opcional), y aclarar quién publica en `estable` | La skill dice `mayor.menor` y «lo aprueba el responsable»; ADR-0005 y la arquitectura dicen que publica un superadmin. Pendiente de las cuestiones abiertas 3 y 14 |
| `docs/TECNOLOGIAS.md` | Anotar como decisiones las respuestas del responsable a las cuestiones abiertas 1 a 6, 10 y 14, cuando las dé | Skill `sdd-aclarar`, paso 6 |

## Decisión en VERIFICAR

V-111 (proveedor de correo para avisos, con alojamiento en la UE) no se ha usado. Se verifica con la skill `verificar-decision` en el paso de diseño, si el responsable elige el correo como canal del aviso (cuestión abierta 4).
