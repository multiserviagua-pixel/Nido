# 002 y 003 · Propuestas de cambio a documentos compartidos

Fecha: 12/11/2026 · Autor: orquestador de la fase 1, con los hallazgos del `especificador` · Estado: PROPUESTA

Cambios que las funciones 002 (plataforma base) y 003 (repositorio remoto y CI, aplazada) necesitan fuera de sus carpetas. No se han aplicado. Los decide el chat de coordinación con el responsable. Las referencias de línea se comprobaron el 12/11/2026.

## Decisiones del responsable que hay que registrar

Dadas el 12/11/2026 en el chat de la fase 1. El texto literal está en `aclaraciones.md`.

| N.º | Decisión | Efecto en el registro |
| --- | --- | --- |
| 1 | «usemos sus versiones gratuitas hasta tener un versión distribuible.» | Cambia el alcance de T-003, T-006, B-002 y de la entrada «Plan gratuito de Supabase o Hobby de Vercel» de «Descartado». Para Vercel, el responsable añadió después: «usar versión gratis de vercel para desarrollo.», sabiendo que su documentación limita ese plan al uso no comercial. Queda como riesgo aceptado, solo para el desarrollo (requisito 71 de la 002) |
| 2 | «Todo local hasta nuevo aviso, queda pendiente Github» | Decisión nueva. El repositorio remoto y el CI remoto se aplazan (función 003) |
| 3 | «Flujo desasistido, verificar contra evidencia y test.» | Decisión nueva. Lectura confirmada por el responsable el 12/11/2026: no aprueba cada cambio; siguen siendo suyas las puertas P0, P1 y P7 y los cambios reservados; los commits los hacen los agentes del chat de la fase que implementa y el primero lo ordena él; a producción solo se despliega con su orden expresa |
| 4 | Dominio: «Axarnet» | Decisión nueva cuando el responsable dé el nombre exacto: subdominio del dominio principal, DNS en Axarnet |
| 5 | «Preproduccion» | El entorno «previo» pasa a llamarse «preproducción» en todos los documentos |
| 6 | «lo crea el agente para la base de datos» | Decisión nueva: los proyectos de base de datos los crea el agente de base de datos, no una persona. **Afecta a la fase 2**, que es quien tiene el proyecto de Supabase en su entrega. Límites que la 002 mantiene (artículos 4 y 14): la cuenta y su credencial las pone una persona, las contraseñas y claves no pasan por el repositorio ni los prompts, y el proyecto de producción necesita acto expreso del responsable. Lectura confirmada por el responsable el 12/11/2026 |
| 7 | «Sí, las acepto», sobre las recomendaciones presentadas | Avisos al responsable por correo; aceptación escrita con caducidad de 30 días para vulnerabilidades sin corrección; registros de la plataforma de despliegue fuera de la UE admitidos si no llevan valores recibidos; los agentes usan la credencial de preproducción sin verla; la prueba real se hace en preproducción |

## Cambios propuestos

| N.º | Documento | Cambio propuesto | Por qué |
| --- | --- | --- | --- |
| 1 | `docs/PLAN.md`, fase 1 (líneas 62, 63 y 67) | Añadir `002-plataforma-base` y `003-repositorio-remoto-ci` a las funciones previstas; decir que «Repositorio remoto con rama protegida y CI» queda aplazado y que por ahora lo sustituyen el repositorio local y la batería local de comprobaciones | Decisión 2. Tal como está, la fase 1 no podría cerrarse sin el remoto |
| 2 | `docs/PLAN.md`, fase 1, criterios de aceptación (líneas 69 a 77) | Añadir criterios de plataforma: la batería en verde rechaza un secreto de prueba; los dos entornos se ejecutan en la UE; la vuelta atrás de despliegue está probada | La entrega de la fase incluye plataforma, pero ningún criterio de la fase la comprueba |
| 3 | `docs/PLAN.md`, «Reglas mientras los chats comparten carpeta» (línea 30) | Decir quién hace el primer commit, con el arnés, y permitir que el chat de la fase que implementa haga commits en la rama principal local siguiendo el procedimiento de la 002 | Hoy los chats de fase no hacen commits, y la integración desasistida los necesita. El repositorio no tiene ningún commit. Depende de la cuestión 3 de la 002 |
| 4 | **Fase 2**: `docs/TECNOLOGIAS.md` T-012, `CLAUDE.md` («las pruebas pgTAP se ejecutan en CI») y `docs/SEGURIDAD.md`, «Lista de publicación» | Decidir dónde se ejecutan las pruebas pgTAP mientras no haya CI remoto, antes de que la fase 2 implemente su primera migración | Sin Docker en la máquina y sin CI, la fase 2 no tiene dónde demostrar el aislamiento entre clientes (artículo 2). Es la consecuencia más seria de aplazar la 003. Cuestión 5 de la 003 |
| 5 | `docs/EQUIPO.md` (línea 37 y regla 4 del enrutado) | Decir que, en los cambios no reservados, la revisión de un agente distinto del autor sustituye a la aprobación humana, y que mientras no haya CI deciden las pruebas y los escáneres de la batería local | Decisión 3. Depende de la cuestión 3 de la 002 |
| 6 | `docs/CALIDAD.md` (campo `entorno` de las evidencias), `docs/ARQUITECTURA.md` (tabla «Entornos»), `docs/PLAN.md` (línea 63) y `docs/TECNOLOGIAS.md` (V-114) | Sustituir «previo» por «preproducción» | Decisión 5 |
| 7 | `docs/ARQUITECTURA.md`, tabla «Entornos» (líneas 117 y 118) | Decir que preproducción tiene una dirección estable, no un despliegue de vista previa cualquiera, y que producción no tiene datos reales mientras use un plan gratuito y B-003 siga bloqueado | La 001 necesita una dirección que no cambie; «Datos reales» no encaja con los planes gratuitos |
| 8 | `docs/adr/0001-pila-tecnologica.md`, «Consecuencias» (línea 28) | Decir que la región se comprueba en la batería local, y en el CI cuando exista | Decisión 2 |
| 9 | `docs/TECNOLOGIAS.md`, D-002 (línea 20) | Aclarar «Crear cuentas y proyectos en la fase 1» | `docs/PLAN.md` (línea 85) pone el proyecto de Supabase en la fase 2. Depende de la cuestión 6 de la 002 |
| 10 | `docs/TECNOLOGIAS.md`, «Pendiente de verificar» | Añadir, para la fase 1: condiciones de cada plan gratuito (uso permitido, región en la UE, dominio propio, dirección estable de preproducción, pausa por inactividad); dónde guarda sus registros la plataforma de despliegue. Mover V-115 a la función 003 | Supuestos de la 002 sin verificar; se resuelven con `verificar-decision` en el diseño |
| 11 | `docs/SEGURIDAD.md`, «Lista de publicación» | Añadir «Todos los servicios en plan de pago, con su acuerdo de encargo de tratamiento» como condición de la versión distribuible | Requisito 30 de la 002 |
| 12 | `docs/CALIDAD.md`, puerta P6 (línea 15) | Aclarar qué canal de avisos basta antes de la fase 4 | P6 pide alertas y el único canal previsto es V-111, de la fase 4. Depende de la cuestión 7 de la 002 |
| 13 | `CLAUDE.md`, «Comandos» | Añadir la orden de la batería y los comandos de la app cuando la 002 los cree | Lo anuncia el propio archivo |
| 14 | `.github/workflows/arnes.yml` y `.github/PULL_REQUEST_TEMPLATE.md` | Dejarlos como plantillas de la función 003, sin uso hasta que se reactive | Decisión 2 |

## Para las fases 2 y 4 (D-017) y para coordinación, 13/11/2026

- **La ventana de 14 días ya está abierta.** La cuenta de la plataforma de despliegue existe desde el 13/11/2026 con la prueba gratuita en curso; termina el 27/11/2026. D-016 daba por hecho que aún no se había activado: conviene corregir su «próxima acción» en `docs/TECNOLOGIAS.md`.
- **Prioridad dentro de la ventana:** la prueba real del conector (función 001). Las fases 2 y 4 pueden probar lo suyo si queda sitio en el calendario; si no, después de decidir el pago.
- **No se despliega nada** hasta que el responsable confirme las condiciones de inicio (requisito 74 de la 002) y apruebe el calendario.
- **Estructura de la app, provisional** (diseño de la 002 sin aprobar y pendiente de rehacer): una sola app Next.js en la raíz, con `src/app/`, `src/lib/plataforma/` (único lugar que lee variables de entorno), `src/lib/registro/` (único lugar con `console`), `scripts/bateria/`, `scripts/plataforma/` y `tests/`. Funciones solo en `fra1`, sin `proxy.ts` ni `middleware`. Los cambios entran por una orden de integración con batería y revisión.
- **Base de datos:** el proyecto `nido-desarrollo` de Supabase (plan gratuito, `eu-central-1`) está preparado en la consola y lo crea el responsable. Afecta a la fase 2.
