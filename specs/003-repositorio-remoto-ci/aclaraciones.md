# 003 · Aclaraciones

Estado: decididas por delegación (D-019) el 14/11/2026 salvo dos, que solo puede responder el responsable. El orquestador eligió en cada caso la opción de mayor seguridad y legibilidad. El responsable puede revisar y cambiar cualquiera.

| N.º | Cuestión | Respuesta | Quién y cuándo | Efecto |
| --- | --- | --- | --- | --- |
| 1 | Proveedor, cuenta y visibilidad | GitHub, `multiserviagua-pixel/Nido`, privado (D-022) | Responsable, 14/11/2026 | REQ-001; la función se reactiva |
| 2 | Identidad con la que suben los agentes | Identidad técnica distinta de la del responsable, sin permiso para administrar ni para integrar sin pasar por la protección. Crearla y poner su credencial es acto de una persona | Decidido por delegación (D-019), 14/11/2026. Motivo: mínimo privilegio y artículo 6 | REQ-007. **Sigue abierto** crearla y qué se hace mientras no exista (mientras, solo el responsable sube al remoto) |
| 3 | Excepción de emergencia | Ninguna; una urgencia se resuelve con la vuelta atrás de despliegue | Decidido por delegación (D-019). Motivo: sin agujeros en la protección | REQ-006 |
| 4 | Coste del plan del repositorio | **No decidido.** Gasto no delegable. REQ-018 obliga a verificar qué da el plan gratuito para un repositorio privado | Pendiente del responsable | Si falta protección de ramas, opciones: pagar (recomendado), hacerlo público (desaconsejado) o dejar el remoto como copia |
| 5 | Cuándo se activa | Ya; debe estar activa antes de la primera migración de la fase 2 | Decidido por delegación (D-019). Motivo: pgTAP corre en el CI | REQ-017 |
| 6 | Registros del CI fuera de la UE | Se aceptan si no llevan valores recibidos | Decidido por delegación (D-019). Misma regla que la decisión 9 de la 002 | REQ-016 |

## Contradicciones señaladas por el especificador

- La sesión de GitHub abierta en esta máquina es la del responsable (T-019) y se usó para poner el repositorio en privado (D-022): choca con mínimo privilegio. Se corrige creando la identidad técnica.
- pgTAP no corre en local sin Docker: la batería de la 002 debe informar esa comprobación sin fallar en local. Lo resuelve el diseño de la 002 o de la fase 2.
- Un solo usuario técnico impide a GitHub distinguir revisor y autor: lo resuelve el diseño de la 003.
- La 002 asumía la 003 aplazada: ajuste pedido en `propuestas.md`.
