# Plan de fases

Producto final publicable. Cada fase se divide en funciones, y cada función sigue el ciclo SDD en su carpeta `specs/NNN-nombre/`.

La prueba real del conector va antes que la base de datos: es el mayor riesgo del proyecto y cuesta poco descubrirlo pronto.

En todas las fases se aplican la constitución, las puertas de `docs/CALIDAD.md` y los controles de `docs/SEGURIDAD.md`.

## Reparto en chats y trabajo en paralelo

Decisión D-015. Cada fase tiene su propio chat, que hace de orquestador de esa fase. El chat de la fase 0 queda como **coordinación**: mantiene este plan, el registro de decisiones, la constitución, los contratos y el arnés.

**En paralelo desde el cierre de la fase 0**: especificar, aclarar, diseñar y planificar cada fase. Cada chat escribe solo en las carpetas `specs/` de su rango, así que no se pisan.

**El código respeta las dependencias:**

| Fase | Rango en `specs/` | Puede implementar cuando |
| --- | --- | --- |
| 1 | 001 a 009 | Su plan esté aprobado (puerta P1) |
| 2 | 010 a 019 | Puerta P1 propia. Trabaja a la vez que la fase 1, con la que comparte desarrollo (D-017) |
| 3 | 020 a 029 | Puerta P1 propia, y las migraciones de la fase 2 estén en el entorno de desarrollo |
| 4 | 030 a 039 | Puerta P1 propia. Trabaja a la vez que las fases 1 y 2, con las que comparte desarrollo (D-017). Sus pantallas del panel necesitan el sistema de diseño de la fase 3 |
| 5 | 040 a 049 | Puerta P1 propia, la fase 2 cerrada y el sistema de diseño de la fase 3 hecho |
| 6 | 050 a 059 | Puerta P1 propia, las fases 2 y 3 cerradas y B-001 resuelta |

**Vercel (D-016).** Se desarrolla en local. La prueba gratuita de 14 días del plan Pro se activa una sola vez, cuando el conector de la fase 1 esté listo para la prueba real, y la activa una persona. Las fases 2 y 4 organizan su plan para probar en esa misma ventana lo suyo que necesite Vercel, si llegan a tiempo; si no, se prueba después de decidir el pago, al cerrar la fase 1.

**Reparto entre las fases 2 y 4 (D-017).** Comparten dos temas. Quedan repartidos así, confirmado por el responsable el 13/11/2026:

| Tema | Fase 2 | Fase 4 |
| --- | --- | --- |
| Versiones del prompt | Registro de cada versión en el despliegue, inmutable y con huella, y su entrega por el conector (015) | Canales, publicación, permanencia en prueba, vuelta atrás y aviso de publicación (030) |
| Alertas | Latido de ejecuciones y las dos alertas que salen de él: sin señal y ejecución sin informe (013) | El resto de alertas, la gestión de todas en el panel y la pausa global (032) |

Lo que una fase necesite de la otra se anota en su `propuestas.md`.

**Reglas mientras los chats comparten carpeta**

- Cada chat escribe solo en su rango de `specs/`. Fuera de él, solo toca lo que figure en su plan aprobado (puerta P1).
- Los documentos compartidos del arnés (`docs/PLAN.md`, `docs/TECNOLOGIAS.md`, la constitución, `contratos/`, `.claude/`, `scripts/`) los actualiza el chat de coordinación. Un chat de fase que necesite un cambio lo anota en `specs/NNN/propuestas.md`.
- Los chats de fase no hacen commits ni cambian de rama.
- Las puertas P0, P1 y P7 las abre el responsable en el chat de cada fase.
- Diseñar antes de que esté cerrada la fase de la que se depende tiene un riesgo: si esa fase cambia un contrato o el modelo de datos, el diseño se revisa. Cada `diseno.md` anota de qué supone que depende.
- Las fases se cierran en orden, cuando se cumplen sus criterios.
- Ahorro de uso (D-018): como mucho dos fases trabajando a la vez; chats cortos, uno por función, que se relevan con `specs/NNN/relevo.md`; los chats se abren con Sonnet. Detalle en `docs/EQUIPO.md`.

## Fase 0. Arnés, verificación y esqueleto

**Estado:** cerrada el 12/11/2026 por el responsable.

**Entrega**

- Arnés de ingeniería: constitución, equipo, ciclo SDD, puertas, controles automáticos.
- Decisiones verificadas en documentación oficial (`docs/TECNOLOGIAS.md`).
- Diseño de alto nivel: arquitectura, seguridad, diseño, modelo de datos de referencia.
- Estructura propuesta del código (`docs/ESQUELETO.md`).
- Primera especificación en estado PROPUESTA (`specs/001-conector-prueba-real/`).

**Criterios de aceptación**

- [x] El responsable ratifica la constitución (D-012). Ratificada el 12/11/2026.
- [x] El responsable aprueba la estructura de `docs/ESQUELETO.md` (D-014). Aprobada el 12/11/2026, con el cierre de la fase.
- [x] Ninguna decisión necesaria para la fase 1 queda sin estado; lo pendiente tiene fase asignada. (`docs/TECNOLOGIAS.md`)
- [x] `node scripts/comprobar-specs.mjs` termina sin errores. (`docs/EVIDENCIAS-FASE-0.md`, apartados 2 y 4)
- [x] El modelo de datos de referencia se ejecuta sin errores y las consultas de prueba confirman el aislamiento entre clientes. (`docs/EVIDENCIAS-FASE-0.md`, apartado 1; en un Postgres simulado, no en Supabase)
- [x] Los agentes, las skills, el gancho de secretos y la regla de permisos se cargan en una sesión abierta en la carpeta (antes V-105; `docs/EVIDENCIAS-FASE-0.md`, apartado 5). El gancho hubo que corregirlo. Las reglas por ruta no se pueden comprobar hasta que existan archivos en esas rutas: pasan a V-116, fase 1.

## Fase 1. Plataforma y prueba real del conector

**Objetivo:** saber, con hechos, si el conector funciona en Claude y en ChatGPT, en conversación y sin nadie delante, antes de construir el resto.

**Entrega**

- Repositorio remoto con rama protegida y CI: tipos, estilo, pruebas, escáner de secretos, de dependencias y análisis estático.
- Entornos previo y de producción, los dos en la UE.
- Conector mínimo: activación con código de un solo uso, autorización OAuth, las 3 herramientas con datos ficticios.
- Guion de prueba ejecutado en los dos asistentes.

**Funciones previstas:** `001-conector-prueba-real`.

**Criterios de aceptación**

- [ ] El conector se añade y se autoriza desde Claude y desde ChatGPT.
- [ ] Completa ejecuciones programadas durante al menos 3 días seguidos sin que nadie apruebe nada, con token de acceso de 5 minutos.
- [ ] Dos ejecuciones simultáneas no rompen la renovación de tokens.
- [ ] Una licencia no activa recibe el estado y nada más.
- [ ] Un informe con campos de más se acepta sin ellos.
- [ ] V-101 a V-104 quedan resueltas con evidencia.
- [ ] Decisión de sí/no por asistente, con plan B si alguno no admite la ejecución desatendida, aprobada por el responsable.

**Riesgo principal:** que ChatGPT no permita escritura desatendida en los planes de los clientes. Planes B a valorar: ChatGPT solo en conversación; unir `confirmar_orden` en `enviar_informe`; mantener la carpeta `panel` para esos clientes.

## Fase 2. Datos y conector completo

**Entrega**

- Proyecto Supabase en `eu-central-1`, migraciones a partir de `docs/MODELO-DATOS.sql`, datos ficticios.
- RLS en todas las tablas y pruebas pgTAP en CI.
- Conector sobre la base de datos, con rol de Postgres propio.
- Prompt 1.3: sustituye el apartado «Panel de salud» por el conector y añade el arranque local con cierre en fallo.
- Latido de ejecuciones, límite de intentos de activación y auditoría.

**Criterios de aceptación**

- [ ] Un usuario del cliente A no lee ni escribe nada del cliente B, ni en tablas ni en vistas (pgTAP en CI).
- [ ] Las funciones del conector no son invocables por `anon` ni por `authenticated`.
- [ ] Un informe con campos de más se guarda sin ellos y sin registrar sus nombres ni valores.
- [ ] Una ejecución sin informe genera alerta en el plazo previsto.
- [ ] La reutilización de un token de renovación fuera de la ventana de gracia revoca esa conexión y genera alerta.
- [ ] Los registros del servidor no contienen valores recibidos (revisión de privacidad).

## Fase 3. Dashboard superadmin

**Entrega**

- Sistema de diseño según `docs/DISENO.md`.
- Acceso con doble factor obligatorio.
- Clientes, licencias, códigos de activación, conexiones, informes y órdenes pausar/reanudar.
- Auditoría de todas las acciones.

**Criterios de aceptación**

- [ ] Una orden creada en el panel llega al agente en su siguiente revisión y vuelve confirmada.
- [ ] Revocar una conexión la deja sin acceso de inmediato.
- [ ] Sin doble factor no se puede leer ni cambiar nada.
- [ ] Pasa la revisión de accesibilidad (WCAG 2.2 AA) y se usa en móvil.
- [ ] Cada acción de superadmin deja una fila de auditoría.

## Fase 4. Versiones, métricas y alertas

**Entrega**

- Registro de versiones del prompt desde el despliegue, inmutables y con huella.
- Canales `prueba` y `estable`, publicación, vuelta atrás y pausa global.
- Métricas por versión: estados, correos tratados y sin tratar, borradores, facturas pendientes.
- Alertas: sin señal, ejecución sin informe, estado `error`, versión antigua, orden sin confirmar, conexión nueva.
- Aviso fuera del panel en cada publicación.
- Al final de la fase, un cliente piloto funciona en paralelo con la carpeta `panel` actual.

**Criterios de aceptación**

- [ ] Publicar en `prueba` solo afecta a los clientes del canal de prueba.
- [ ] La vuelta atrás se aplica en la siguiente revisión de cada agente.
- [ ] El texto de una versión registrada no se puede modificar, tampoco desde el panel.
- [ ] La pausa global detiene todos los agentes en su siguiente revisión.
- [ ] Las cifras del cliente piloto coinciden con las de su carpeta `panel`.

## Fase 5. Dashboard de cliente

**Entrega**

- Alta por invitación, acceso con sus credenciales.
- Resumen propio: estado del agente, última revisión, cifras, pausa, estado de la suscripción.

**Criterios de aceptación**

- [ ] No puede ver datos de otro cliente ni cambiando la URL o los identificadores (prueba de extremo a extremo).
- [ ] No ve el texto del prompt, las conexiones de otros ni datos internos.
- [ ] Pasa la revisión de accesibilidad y se usa en móvil.

## Fase 6. Facturación y publicación

**Entrega**

- Stripe Billing: primero en modo observación; después, suspensión por impago con periodo de gracia y estado manual.
- Revisión de seguridad independiente.
- Restauración de una copia probada.
- Política de privacidad, aviso legal, plazos de conservación y encargados de tratamiento documentados.
- Guías de operación e incidentes.
- Migración de los clientes actuales desde la carpeta `panel`.

**Criterios de aceptación**

- [ ] Un impago de prueba suspende la licencia al acabar la gracia y el pago la reactiva.
- [ ] El webhook rechaza firmas inválidas y un evento repetido no se procesa dos veces.
- [ ] B-001 (factura legal) está resuelta por el responsable.
- [ ] La lista de publicación de `docs/SEGURIDAD.md` está completa, con evidencias.
- [ ] El responsable autoriza la publicación (B-003).

## Seguimiento

| Fase | Estado | Cerrada por | Fecha |
| --- | --- | --- | --- |
| 0 | Cerrada | Responsable | 12/11/2026 |
| 1 | Especificada (001 y 002, en PROPUESTA). Puerta P0 a la espera del responsable | — | — |
| 2 | Especificada (010 a 014, en PROPUESTA). Puerta P0 a la espera del responsable | — | — |
| 3 | Especificada (020 a 024, en PROPUESTA). Puerta P0 a la espera del responsable | — | — |
| 4 | Especificada (030 a 033, en PROPUESTA). Puerta P0 a la espera del responsable | — | — |
| 5 | Especificada (040 a 042, en PROPUESTA). Puerta P0 a la espera del responsable | — | — |
| 6 | Especificada (050 a 053, en PROPUESTA). Puerta P0 a la espera del responsable | — | — |

El primer arranque de los seis chats a la vez, el 12/11/2026, agotó el límite de uso de 5 horas de la cuenta antes de que ninguno escribiera nada. Con el límite renovado, el responsable decidió reanudar los seis a la vez. Cada chat lanza como mucho dos especificadores a la vez y comprueba que cada archivo queda en disco antes de seguir, para que un nuevo corte no pierda lo hecho.
