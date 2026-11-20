# 001 · Plan

Autor: `arquitecto` (opus) · Fecha: 19/11/2026 · Camino corto por D-025 (`docs/TECNOLOGIAS.md`) y `relevo.md`, «Plan recortado». Sustituye al plan de las 20:12, que dependía del plan de la 002 con firmas (historial de git). Fuente: `diseno.md` (cuarta versión). Tareas en `tareas.md`; `AR-` son acciones de una persona; `DP-` son decisiones pendientes; «002·T-nnn», tareas de `specs/002-plataforma-base/tareas.md`, que se citan y no se repiten.

Numeración desde **T-101**, para que ramas (`tarea/T-NNN`), commits y evidencias no repitan los identificadores de la 002.

## Orden de trabajo

| Bloque | Tareas | Empieza tras | Contenido |
| --- | --- | --- | --- |
Tareas reagrupadas por D-029 el 20/11/2026 (de 64 a 19; equivalencias al final de `tareas.md`).

| Bloque | Tareas | Empieza tras | Contenido |
| --- | --- | --- | --- |
| 1 · Base del conector | T-101 a T-104 | 002·T-003 (T-104: 002·T-006) | Dependencias, escáner, apoyo de pruebas, `001_estado.sql` con RLS y las funciones SQL de las tres herramientas, configuración C-1 y C-2, secretos, contratos, prompt |
| 2 · Herramientas y punto MCP | T-105, T-106 | Bloque 1 | Almacén, sucesos, las tres herramientas una a una, servidor, filtro, tubería; trazado y región. **Hito** (T-105): las tres herramientas responden por `/api/mcp` en local con tokens sembrados |
| 3 · Autorización OAuth y operación | T-107 a T-111 | Bloque 2 (SQL: T-103) | Metadatos, CIMD, DCR, pantalla, activación, tokens, operaciones y órdenes de la persona |
| 4 · Transversales en local y `Nido` | T-112 a T-114 | Bloque 3, AR-05, AR-06 | Inventario, aislamiento, fallos, hostiles, ciclo completo, WCAG; pruebas L con credenciales locales que después mueren |
| 5 · Contratos y despliegue en Vercel (`arn1`) | T-115 a T-117 | AR-01, DP-1, DP-2, bloque 4 | Contratos, supervisión, procedimiento, primer despliegue |
| 6 · Prueba real con Claude Max | T-118, T-119 | T-117, AR-03, AR-04, AR-08 | Guion, navegador real, pasos 1 a 13, resultados |

Las herramientas van **una a una** y en ese orden dentro de T-103 (funciones SQL) y de T-105 (herramientas): cada una, con su prueba en verde antes de empezar la siguiente (relevo, punto 2). La autorización va después del hito; despliegue y prueba real, al final.

**Dos carriles en serie.** Base de datos (`ingeniero-bd`, un solo archivo `001_estado.sql`): T-103, T-107. App (`ingeniero-backend`; `ingeniero-frontend` en T-109). El carril de base de datos puede adelantarse al de la app dentro de lo que permiten las dependencias.

**`[P]`** (archivos disjuntos, dependencias cumplidas; como mucho dos subagentes a la vez, D-024, y las revisiones `opus` cuentan): T-101, T-102, T-104, T-107, T-109, T-112, T-113, T-115, T-116, T-118. Parejas útiles: T-101 ∥ T-102; T-104 ∥ T-103; T-107 ∥ T-105; T-112 ∥ T-111; T-113 con T-111 o T-112; T-115, T-116 y T-118 con cualquiera.

**Sin la respuesta de AR-01 (resuelta por delegación D-036, 20/11/2026; ADR-0007).** Ninguna tarea de código lee el valor de `readOnlyHint` ni la `description`: el filtro copia el contrato vigente y PRUEBA-003 compara con él. Solo T-115 (a) espera a AR-01, y solo T-117 (b) espera a T-115 (CA-009 pide las mismas anotaciones desde el paso 5 hasta el final).

## Frontera con la 002

Para empezar ya por 002·T-001 sin ambigüedad:

- **002·T-001 se implementa tal como está en su fila** y no incluye nada de la 001: ni `@modelcontextprotocol/*`, `ajv` ni `postgres` (T-101), ni `@electric-sql/pglite` (002·T-003), ni órdenes `operar`, `conector:*` o `pruebas-bd` (T-111), ni `outputFileTracingIncludes` (T-106), ni excepciones de ESLint para `src/mcp/entrada.ts` (T-105).
- **Sí incluye**, porque está en 002 diseño §App base, que su fila cita: la cabecera `Referrer-Policy: same-origin` solo en `/oauth/autorizar` y `no-referrer` en el resto, con la regla global excluyendo esa ruta en su `source` (C-4, N-4), y su caso en `cabeceras.test.ts`. La ruta aún no existe; T-112 lo comprueba contra la ruta real.
- `tsconfig.json` debe incluir `tests/**` (T-001 ya tiene pruebas en `tests/unit/plataforma/`: así `tsc` no se queda sin entradas). El `include` de Vitest de 002·T-001 (`tests/**`) ya cubre `tests/unit/conector/` y `tests/conector/`: la 001 no lo toca.
- La primera tarea de la 001 es **T-101** y empieza cuando 002·T-003 esté en `main` (comparte `package.json` y necesita `verificar`). Puede ir en paralelo con 002·T-004.

**T-101, dimensionada** (parte (a); el escáner, parte (b), en `tareas.md`). Solo `package.json`, `package-lock.json` y `tests/unit/conector/humo-sdk.test.ts`.
1. Con `verificar-decision`, para `@modelcontextprotocol/server` 2.4.0, `ajv` 8.20.0, `postgres` 3.4.9 y `@modelcontextprotocol/client` 2.4.0: fecha de publicación en `registry.npmjs.org/<paquete>` (campo `time`), licencia y `engines`, con fuente y fecha en `evidencias/T-101/dependencias.md`. Con menos de 7 días publicada, se toma la última que cumpla; si cambia la API que usa el diseño (`createMcpHandler`, `legacy: 'stateless'`, `responseMode: 'json'`), para y pregunta.
2. Prueba en rojo, en su commit: en Node 26 y en proceso, un manejador `stateless` y `json` con una herramienta de entrada abierta responde a `initialize` con 2025-11-25 y con 2026-07-28 y a `tools/list` (V-1; PRUEBA-002, parte); Ajv 2020-12 estricto compila `contratos/informe.schema.json` (V-4, parte).
3. `npm install --save-exact --ignore-scripts`: las tres primeras en `dependencies`, el cliente en `devDependencies`. Sin `zod` directo, `mcp-handler` ni `@electric-sql/pglite` (la pone 002·T-003). `npm audit`: alta o crítica, para (RD-049); el resultado, en la evidencia.
4. No toca `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts` ni `scripts`. `npm run verificar` en verde. RC `C` y reservada (manifiesto y bloqueo).

| De la 002 | Lo usa | Para |
| --- | --- | --- |
| 002·T-001 (manifiesto, TypeScript, Vitest, cabeceras) | Todas | Esqueleto |
| 002·T-002 (páginas base) | T-117 | `next build` y despliegue |
| 002·T-003 (`npm run verificar`, PGlite, reglas de ESLint) | Todas | Puerta de cada tarea |
| 002·T-004 (`manejador.ts`, `entrada.ts`, `registro.ts`, `codigos.ts`) | T-104, T-105 y cada `route.ts` | Errores sin valores |
| 002·T-005 (`configuracion.ts`, guardia de región) | T-104, T-116 | C-1 |
| 002·T-006 (`.env.example`, `entornos.md`) | T-104 | Nombres del grupo «conector» |

002·T-007 a T-010 no hacen falta: el estado de la 001 vive en `conector_prueba` con su `001_estado.sql`, sin tocar `supabase/migrations/` (diseño §Datos).

**Cambios pedidos a la 002 (diseño §Lo que toma de la 002).** C-1 y C-2 → T-104. C-3 → T-111: sin carpeta sellada (aplazada, D-025), la persona ejecuta las órdenes desde un clon limpio de `main` (002 diseño §Aplazado a la 003). C-4 → 002·T-001 (cabecera), T-106 (trazado) y T-112 (inventario). C-5 → T-118 (`calendario.md`). C-6 → condición sobre la fase 2: la anota el orquestador. E-1 (RD-023) la aplica el orquestador.

**Lo que la 002 no da en su plan corto y el despliegue necesita** (002 plan, asunto R-3): `vercel.json` (T-106), `supervision.ts` (T-116, DP-2) y una vía de despliegue a preproducción (T-117, DP-1).

## Integración (D-025)

Por cada tarea, 002 diseño §Integración: rama `tarea/T-1NN` desde `main`; la prueba en su commit y en rojo, después el código; `npm run verificar` en verde, ejecutado por el orquestador sobre el commit final; `revisor` sin bloqueantes; `auditor-seguridad` sobre el código si la tarea es `C`; «sí» del responsable en el chat, que nombre la tarea o el grupo (y las reservadas como tales), pedido agrupado; `git merge --squash` con mensaje `T-1NN (001): …`. Evidencias en `evidencias/T-1NN/` (`verificar.md`, `revision.md`, `dictamen.md` si es `C`, `aprobacion.md`). Sin `push`, cuentas ni secretos. Firmas, ancla, delegaciones, `aprobar` y calendario firmado: aplazados a la 003.

## Cobertura

| REQ | Tareas | PRUEBA- | CA |
| --- | --- | --- | --- |
| REQ-001 | T-101, T-105, T-108, T-111, T-112, T-114, T-117, T-119 | 001, 002, 004, 040 | CA-001, CA-021 |
| REQ-002 | T-106, T-111, T-114, T-117 | 047 | CA-002 |
| REQ-003 | T-107, T-108, T-110, T-115 | 005 | CA-003 |
| REQ-004 | T-107, T-108, T-110, T-114, T-119 | 006, 007, 008, 040 | CA-004, CA-021 |
| REQ-005 | T-109, T-110, T-112, T-113, T-119 | 009, 010 | CA-005 |
| REQ-006 | T-107, T-110, T-111, T-112, T-119 | 012, 013, 046 | CA-007, CA-008, CA-021 |
| REQ-007 | T-103, T-105, T-110, T-119 | 011, 043 | CA-006, CA-023 |
| REQ-008 | T-104, T-107, T-110, T-114, T-115, T-119 | 007, 008, 012, 019, 044 | CA-007, CA-023 |
| REQ-009 | T-101, T-104, T-105, T-106, T-115, T-119 | 003, 041 | CA-009 |
| REQ-010 | T-102, T-103, T-112, T-114 | 014, 022, 040 | CA-010, CA-021 |
| REQ-011 | T-103, T-105, T-115, T-119 | 015, 045 | CA-011, CA-020 |
| REQ-012 | T-104, T-105, T-106, T-112 | 016 | CA-012 |
| REQ-013 | T-103, T-105, T-112, T-114 | 007, 008, 017 | CA-013 |
| REQ-014 | T-103, T-104, T-105, T-107, T-108, T-110, T-112, T-114, T-116 | 018 | CA-014 |
| REQ-015 | T-101 a T-105, T-111, T-112, T-114, T-116, T-119 | 019, 022, 051 | CA-015, CA-016 |
| REQ-016 | T-118, T-119 | 048, 049, 051, 053 | CA-016, CA-025 |
| REQ-017 | T-107, T-108, T-111 | 020 | CA-017 |
| REQ-018 | T-104, T-118, T-119 | 042, 043, 045, 049, 050 | CA-018, CA-019, CA-020, CA-022 |
| REQ-019 | T-103, T-104, T-107, T-108, T-117, T-118, T-119 | 004, 021, 023, 052 | CA-001, CA-024 |
| REQ-020 | T-118, T-119 | 040 a 053 | CA-021, CA-022, CA-023, CA-025 |

Las 37 pruebas del mapa del diseño (001 a 023 y 040 a 053) tienen tarea. Las R y las V con persona las ejecuta el responsable con `qa` delante. Una prueba no ejecutada se anota «no ejecutada» (artículo 13; RD-080).

**Condiciones de los dictámenes**: N-1 → T-103 (`LEEME.md`), T-107, AR-12, T-119 (f); N-2 → T-103, T-105, T-114; N-3 → T-104; N-4 → 002·T-001, T-112, T-119 (a); M-4 → T-103, T-114, AR-01; R-7 → AR-09; R-8 → AR-10 (si se conserva el grupo, tarea nueva sobre C-1 antes de T-119 (f)).

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| La ventana no alcanza: 19 tareas (D-029), cada una con `verificar`, revisión y «sí», y casi todas con dictamen | El 22/11 por la noche no está el hito (T-105) | Avisar ya al responsable (DP-5, diseño R-5). No se recortan pruebas (RD-079); lo no hecho, «no ejecutado» |
| Integración sin barrera técnica hasta la 003 | Commit en `main` sin carpeta de evidencias completa | Comprobación 10 a mano antes de cada «sí» (002 diseño §Integración, paso 6); para y avisa |
| PGlite no es Supabase (roles, bloqueos, `now()`) | Verde en B, rojo en L | T-114 repite en `Nido` lo que depende de roles y bloqueos (V-5); en B se anota el límite |
| V-107: el agrupador no acepta `[rol].[referencia]` | T-114 no conecta | Se para; decide el responsable (AR-14); nunca el rol `postgres` |
| V-1: el SDK 2.4.0 no cuadra con Node 26 o Next.js 16.4.6 | T-101 en rojo | Se para y se pregunta; no se cambia a `mcp-handler` sin decisión |
| Enfriamiento de 7 días | Una dependencia publicada hace menos de 7 días | T-101 usa la última con 7 días o más, con fuente y fecha; si cambia la API, para (ver DP-3 para PGlite) |
| Supervisión ausente en preproducción | `/api/salud` 503 por `SUPERVISION_DSN` (002·T-005) | DP-2 antes de T-117 |
| R-8 cambia C-1 | AR-10 elige conservar el grupo sin `OPERACION_HUELLA` | Tarea nueva sobre `configuracion.ts`, con revisión y dictamen, antes de T-119 (f) |
| Credenciales locales de `Nido` (artículo 4, límite; 002 asunto A-3) | — | Solo en T-114 (a) y (b); mueren con AR-06; T-114 (c) lo prueba |

## Entornos y despliegue

- **B** (batería): local, PGlite y sin red (doble de red), en `tests/unit/conector/` y `tests/conector/`. PGlite no entra en `src/`.
- **L**: la app local contra `Nido` con `PRUEBAS_CONECTOR_BD_URL` y `PRUEBAS_AUTORIZACION_BD_URL`, que pone la persona (AR-05), por `npm run pruebas-bd` (T-111).
- **V/R**: proyecto `pre-nido` en Vercel, funciones en `arn1` (D-020), dentro de la ventana (13 a 27/11/2026). Producción, aplazada a la 003 (002 plan, R-4): sin despliegue ni variables del conector.
- **Despliegue** (DP-1): lo ejecuta **una persona** con la CLI de Vercel desde un clon limpio de `main` en el commit aprobado, según el procedimiento de T-117 (a); el agente solo comprueba desde fuera (T-117 (b)). En el periodo programado solo se despliegan correcciones del conector.
- **Vuelta atrás**: código, `git revert` por el mismo camino; SQL, `001_estado.reversion.sql` aplicado por una persona con `LEEME.md` y probado (PRUEBA-022); despliegue, `vercel rollback` por la persona, probado en T-117 (b).

## Puertas que aplican

P1 (este plan; la parte del contrato, solo con AR-01 expresa). P2, P3 y P4 en cada tarea. P5: hay interfaz (pantalla de activación: T-109, T-113, T-119 (a)). P6: toca datos (`Nido`), despliegue y prompt. P7: cierre, tras T-119 y AR-15.

## Rutas críticas tocadas

`C` en `tareas.md` = `revisor` y `auditor-seguridad` sobre el código. Lo es todo lo que toca código, SQL, configuración o despliegue (diseño §Orden de construcción).

- **OAuth y licencias**: T-104 (b), T-107 a T-111, T-115.
- **RLS y migraciones** (`supabase/conector-prueba/`): T-103, T-107, T-114, T-119 (f).
- **Entrega del prompt**: T-104 (d) y (e), T-105 (c), T-106 (a).
- **Conector** (tubería, filtro, herramientas, almacén, registros): T-102, T-104 (c), T-105, T-112.
- **Suministro, configuración y despliegue**: T-101, T-104 (a), T-106 (b), T-116, T-117, T-119 (a).
- **Reservadas** (el «sí» las nombra): T-101, T-104, T-105, T-106, T-111, T-117.

## Dependencias nuevas y verificaciones previas

Las de diseño §Dependencias nuevas, en T-101, sin añadir ninguna; PGlite la instala 002·T-003 (DP-3). Antes de instalar, `verificar-decision` de la fecha de publicación (7 días o más) y licencia de cada una, con fuente. Dónde se cierra cada verificación: V-1 en T-101 y T-105; V-2 en T-108; V-3 en T-106 y T-117; V-4 en T-101 y T-104; V-5 y V-10 en T-114; V-6 en T-119 (a) (la URL del documento CIMD de Claude, antes de T-108 (b): sin ella, la lista queda vacía y se usa DCR); V-7 en T-118 (b) y T-119 (b) a (d); V-8 en T-119 (g); V-9 (comprobador), el orquestador antes de P1. CLI de Vercel (versión y opciones): T-117 (a).

## Acciones de una persona

No se asignan a ningún agente ni se delegan (D-019: cuentas, proyectos, secretos, gasto, activar Vercel). Ninguna se da por hecha sin respuesta expresa.

| ID | Acción | Cuándo | Desbloquea |
| --- | --- | --- | --- |
| AR-01 | P1: respuesta expresa a `readOnlyHint: false` (RD-016); qué hacer si PRUEBA-022 halla concesiones ajenas a `PUBLIC`; aceptar el límite m-3 | Resuelta por delegación D-036, 20/11/2026 (ADR-0007), revocable | T-115 → T-117 |
| AR-02 | R-1: `<dominio>` para `URL_PUBLICA` y el CNAME de `pre-nido` (la alternativa `vercel.app` está en VERIFICAR) | Ya | T-117 |
| AR-03 | R-3: en Claude Max, pasos 1 y 2 del guion (Gmail con sus 7 herramientas y el resto «Blocked»; declaración sin la dirección; inventario fechado; arranque instalado) | Antes del día D | T-118 (b) |
| AR-04 | Buzón de pruebas: mensajes `HIA-PRUEBA-NN`, etiquetas, `prueba-revisado` vacía, mensaje con órdenes, dirección de control (fuera del repositorio), inventario fechado | Antes del día D | T-118 (b) |
| AR-05 | En `Nido`, con `LEEME.md` y el editor SQL: aplicar `001_estado.sql` y `semilla.sql`; contraseñas locales de los dos roles; `PRUEBAS_*` en la máquina | Tras T-107 | T-114 |
| AR-06 | Revertir y reaplicar en `Nido`; contraseñas nuevas solo en Vercel; grupo «conector» y variables base de `pre-nido`; crear la credencial `hia_op_` y guardar solo su SHA-256 | Tras T-114 (b) | T-114 (c), T-117 (b) |
| AR-07 | Vercel: proyecto `pre-nido` en la prueba Pro, CNAME, protección de serie, WAF de `/api/*` (002 diseño §Entornos); proyecto Sentry UE si DP-2 (a); ejecutar el despliegue y la vuelta atrás de T-117 (a) | Tras T-117 (a) | T-117 (b) |
| AR-08 | Aprobar `calendario.md` con un «sí» (RD-080; documento normal por D-025) | Antes del primer paso | T-118 (b) |
| AR-09 | R-7: si algo de la cuenta Max no se puede desactivar para la tarea, ¿se prueba igual? | Antes del paso 6 | T-119 (c) |
| AR-10 | R-8: enmendar CAD-046 o conservar el grupo sin `OPERACION_HUELLA` | Antes del paso 13 | T-119 (f) |
| AR-11 | Durante la prueba: `npm run operar -- preproduccion …`, teclear el código, alta y activación en Claude, tarea programada, `conector:ciclo` en el paso 11 | Pasos 3 a 11 | T-119 (b) a (e) |
| AR-12 | Paso 13, actos 2 a 4 (N-1): borrar el grupo «conector», redesplegar el mismo commit, `nologin password null` y `pg_terminate_backend` | Tras `cerrar_prueba` | T-119 (f) |
| AR-13 | R-4 (opcional, por escrito), R-5, R-6 | Cuando toque | Calendario; RD-078 |
| AR-14 | Decidir si V-107 falla o si PRUEBA-022 halla concesiones ajenas | Si ocurre | T-114 |
| AR-15 | Decisión sí o no con fecha, declaración de datos ficticios y plan B (CA-025); `decision-pago` el 26/11 | Tras T-119 | P7 |
| AR-16 | Navegador real para PRUEBA-009 (GET y POST) | Antes del paso 3 | T-119 (a) |
| AR-17 | «Sí» de integración de cada tarea (D-025), pedido agrupado | Al integrar | Paso a `main` |

## Pendiente de decidir (responsable)

Este plan no las decide.

- **DP-1. Vía de despliegue a preproducción.** El plan corto de la 002 no tiene `desplegar` ni el almacén de credenciales (002 REQ-012, REQ-015). Propuesta: lo ejecuta una persona con la CLI desde un clon limpio de `main` (T-117 (a)), y el agente comprueba desde fuera; el token de Vercel no lo tiene ningún agente. Alternativa: adelantar `desplegar` de la 002 (más tareas antes de la prueba). Sin decidir, T-117 queda bloqueada.
- **DP-2. Supervisión en preproducción.** 002·T-005 exige `SUPERVISION_DSN` fuera de `desarrollo` y `supervision.ts` no tiene tarea. Opciones: (a) T-116 en este plan y proyecto Sentry UE creado por una persona (propuesta: artículo 10); (b) otro plan de la 002 antes de T-117. Sin decidir, T-116 queda bloqueada.
- **DP-3. Versión de PGlite.** 002 diseño fija 0.5.17 (publicada el 19/11/2026); el diseño de la 001 exige 7 días de enfriamiento. Una sola versión para las dos funciones, fijada antes de 002·T-003.
- **DP-4. Destino de lo que este plan toma de la 002** (`vercel.json`, `supervision.ts`, despliegue): confirmar que la 002 lo da por asignado aquí (002 plan, R-3).
- **DP-5. Calendario.** Con este tamaño, empezar antes del 22/11 no es realista y el 23/11 a las 08:00 está en riesgo: decidir pronto R-5 (cerrar con lo probado o contratar Pro un mes) y `decision-pago` (26/11).
- **Del diseño**, siguen abiertas: R-1 (AR-02), R-7 (AR-09), R-8 (AR-10), R-2, R-3, R-6; E-1 y C-6, del orquestador.

## Aprobación

Puerta P1. La abre el responsable, con fecha. La parte del contrato (T-115 (a)) exigía su respuesta expresa a RD-016; AR-01 decidida por delegación D-036, 20/11/2026 (ADR-0007), revocable.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 19/11/2026 | Orquestador, por delegación (D-019) | P1 **parcial**: abierta para T-101 a T-149 y T-151 (depende de la 002). **Sin abrir**: T-150 y lo que dependa de AR-01 (RD-016), que no se delega; ni DP-1, DP-2 ni DP-4. Estado de la 001 sigue DISEÑADA hasta la respuesta del responsable. Alerta: 64 tareas; el calendario del 23/11 está en riesgo (DP-5) |
| 20/11/2026 | Coordinación, por delegación (D-036), en nombre del responsable | AR-01 aprobada por delegación D-036, 20/11/2026, revocable: `readOnlyHint: false` en las tres herramientas; si PRUEBA-022 halla concesiones ajenas a `PUBLIC`, la prueba falla y se revocan (ADR-0007 punto 12); se acepta el límite m-3, vigente solo hasta el cierre de la 001. Dictamen del auditor: condición de RD-016 levantada |
| 20/11/2026 | Coordinación, por delegación (D-036) | DP-1 y DP-2 (a) decididas: despliega una persona con la CLI desde un clon limpio de `main`; T-116 en este plan y proyecto Sentry UE creado por una persona |
