# 021 · Dictamen de seguridad (cuarta vuelta: correcciones, plan y tareas)

Autor: `auditor-seguridad` (solo lectura; guardado y resumido por el orquestador) · 21/11/2026 · Sobre: correcciones de `dictamen-diseno-3.md`, `plan.md` y `tareas.md`. Comprobado: Next 16.4.6 instalado, `scripts/patrones-secretos.mjs`, `comprobar-specs.mjs` (SUPERADO, documental). No se ejecutó ninguna prueba ni se probó el servicio de identidad.

**Veredicto: 0 bloqueantes, 3 mayores (M-17 a M-19), 8 menores (m-37 a m-44).** Cerrados en el texto: M-15, M-16, m-30 a m-36.

## Mayores
- **M-17 · PRUEBA-055 pide lo imposible en RSC y acciones** (`plan.md` ~97; art. 13, 3; AM-39). Next solo escapa (`htmlEscapeJsonString`) al incrustar en HTML; RSC y acción salen en crudo como `text/x-component`. Corrección: separar criterios por tipo de respuesta. HTML (carga completa y 404): los actuales. RSC y acción: `Content-Type` exactamente `text/x-component`, `X-Content-Type-Options: nosniff` y 0 ejecuciones al abrir la dirección como documento. Añadir `%0D%0A` a los testigos para comprobar que no se parte `Location`.
- **M-18 · Secretos en evidencias del servicio real** (`tareas.md` T-001, T-002, T-012; `plan.md` T-P2.8 y T-P2.13; art. 4, 13; AM-18). El escáner no detecta `otpauth://`, hashes `$2a$/$2b$/$2y$`, códigos de recuperación ni tokens de renovación, valores `ACCESO_HMAC_*` ni cookies `__Host-nido-*`. Corrección: las evidencias de T-001, T-002, T-004 y T-012 guardan solo booleanos, recuentos, nombres de columnas y huellas truncadas; nunca tokens, hashes, semillas, códigos ni el SVG/QR. Ampliar `patrones-secretos.mjs` con esos cinco patrones y una prueba que siembre un ejemplo de cada uno (en T-010 c o tarea propia).
- **M-19 · PRUEBA-043, 052 y 054 no corren contra el servicio real** (`tareas.md` T-009; art. 13, 3; AM-26, AM-38). PGlite no tiene el esquema `auth`. Corrección: tipo R para 043, 052 (casos 2, 3, 6 y 9) y 054, ejecutadas contra el proyecto de desarrollo antes de integrar T-009; incluidas en la batería periódica como PRUEBA-046; el simulado de PGlite se deriva de la evidencia de T-P2.13 y lo dice; mientras no se ejecuten, «no ejecutada».

## Menores
- **m-37:** un factor atado a un anuncio que se rechaza o caduca sin reconocerse debe tratarse como «sin anuncio» (cerrar todo y escribir (c)); caso (10) de PRUEBA-052.
- **m-38:** `propuestas.md` (líneas ~179-181) contradice el diseño: `Location` del mismo origen, sin consulta, empezando por `/admin`; la redirección es opcional, no es el control de H-1.
- **m-39:** precisar quién usa la clave secreta (la pone una persona; solo la del proyecto de desarrollo; los agentes la cargan del entorno sin leerla ni copiarla; nunca la de preproducción ni producción) y con qué credencial se leen las tablas del servicio en T-P2.12.
- **m-40:** mover a T-007 la ampliación de la lista cerrada, el cambio de `04_funciones` y PRUEBA-048 (hoy en T-008 b); PRUEBA-048 recorre `pg_proc` en todos los esquemas no del sistema para `PUBLIC`, `anon`, `authenticated` y `acceso`; cada migración con su `revoke`.
- **m-41:** marcas A-13 incoherentes entre `plan.md` (T-006 a T-016) y `tareas.md` (T-010, T-011, T-015, T-016); T-014 hace el caso 8 de PRUEBA-052 sin depender de T-009.
- **m-42:** T-005 (enmienda) debe pasar a dictamen D (el auditor comprueba el texto frente a `diseno.md` 165-190).
- **m-43:** constancia de A-13 y A-15 en `docs/TECNOLOGIAS.md` (lo hace la coordinación).
- **m-44:** el reintento de `cierre_servicio_pendiente` no tiene tarea ni privilegio; si usa la clave secreta es una operación S-6 nueva con dictamen antes de P1.

## Plan y tareas
Criterios de PRUEBA-052 se mantienen salvo m-37 y M-19. Cada tarea de ruta crítica lleva dictamen salvo m-42. Orden y dependencias correctos salvo m-40 y m-41. Faltan: tarea de AM-18 (M-18) y la del reintento (m-44). Constitución 1.4: no afecta a la 021.

## No comprobado
Escrituras reales del servicio (alta en dos pasos, borrado de caducados, recifrado, `aal` tras borrar factor), inscripción con token robado (m-37), serialización real de 307/404, contenido de PRUEBA-048, necesidad de clave secreta en el reintento.
