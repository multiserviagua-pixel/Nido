# 022 · Dictamen de seguridad del diseño (última vuelta, 22/11/2026)

Autor: `auditor-seguridad`. Archivado por la coordinación. **0 bloqueantes, 0 mayores, 7 menores.** MA-1 y m-10 a m-20 de `dictamen-diseno-2.md`: corregidos. Sin hallazgo en DD-33, DD-34 (modo `for no key update` correcto frente al `for share` del conector, M08 L154), regla de `suspension_manual_en`, D-10 sin migración propia y `privado.ajustes_rol_previos`.

Los siete menores se integran como condiciones de tarea (no hay tercera vuelta):

| N.º | Condición | Va a |
| --- | --- | --- |
| N-1 | Revocación frente a llamada en curso: tras el `for share` del cliente, el conector vuelve a comprobar conexión y licencia sin revocar (o repite `resolver_token`); PRUEBA-018: llamada resuelta antes de O-11 devuelve `autorizado: false`, sin `ultimo_uso_en` posterior a `revocada_en` | P-52, PRUEBA-018, T-033 |
| N-2 | Regla global: toda función que escriba en `clientes`, `licencias`, `codigos_activacion` o `conexiones` toma cliente y luego licencia antes de su primera fila de auditoría; la fase 2 trata `40P01` en reutilización como denegación con reintento; PRUEBA-018 con un anotador de prueba | P-52, P-53 (c) |
| N-3 | O-2 toma el cliente `for update` en el paso 2 (una columna generada con índice único puede subir el cerrojo, sin comprobar); PRUEBA-018 con renombre contra inserción hija | T-013, PRUEBA-018 |
| N-4 | La lista local de transacción no la puede sembrar la sesión: tabla en `privado` con clave `pg_current_xact_id()` y comprobación en `public.auditoria`; PRUEBA-015 y 017 siembran a mano y esperan `reactivacion_sin_auditoria`/`baja_sin_auditoria` | P-53 (a) |
| N-5 | `privado.ajustes_rol_previos` con `check` de los cuatro ajustes, `%I` y `%L`, sin sobrescribir un valor previo, la reversión vacía la tabla; PRUEBA-019 | T-017 |
| N-6 | O-3 bloquea en el paso 2 la licencia vigente, sus conexiones activas y el código pendiente; PRUEBA-018: sin esperas en `pg_locks` tras la I-03 | T-011, T-012 |
| N-7 | Tras revertir D-4b, una baja se rechaza entera (sin baja ni revocaciones a medias) | PRUEBA-019 |

No comprobado: columnas generadas y modo de cerrojo (N-3); lista local de la 024 con agrupador de conexiones (N-4); fase 2, 023, 025 y fase 6 (N-2); T-P1 a T-P4 y `pgaudit`. Nada ejecutado (sin migraciones ni pgTAP).
