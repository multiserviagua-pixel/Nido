# 002 · Plan

Autor: `arquitecto` · Fecha: 19/11/2026 · Camino corto por D-025 (`docs/TECNOLOGIAS.md`) y `specs/001-conector-prueba-real/relevo.md`, «Plan recortado». Sustituye al plan de 53 tareas del 19/11, que no se sigue (sigue en el historial de git).

## Orden de trabajo

Diez tareas en cuatro bloques, más T-011 y T-012 (bloque 5, 21/11/2026, §Correcciones tras la 1.ª pasada de T-010). Cada una en su rama `tarea/T-NNN`, con la prueba delante, y entra en `main` por diseño §Integración (`verificar` por quien no implementa, `revisor`, `auditor-seguridad` si es crítica, «sí» del responsable, `merge --squash`).

1. **Esqueleto** (T-001 → T-002 → T-003): manifiesto y configuraciones; páginas base, que hacen falta para `next build`; `npm run verificar`. En serie: comparten `package.json` o son la puerta de las siguientes.
2. **Errores, configuración y entornos sin secretos** (T-004 → T-005 → T-006): manejador, errores, registro y `/api/salud`; `configuracion.ts`; `.env.example` y la lista de variables por entorno. En serie: cada una usa el archivo de la anterior.
3. **Base de datos en local** (T-007 → T-008): migración base desde `docs/MODELO-DATOS.sql`, su reversión y sus pruebas. **Bloqueadas por el asunto R-1.**
4. **Cierre del plan** (T-009 → T-010): guía de trabajo local; comprobación del historial integrado.

Paralelo, como mucho dos subagentes (D-024, memoria del proyecto): tras T-003, `T-004 [P]` con `T-007 [P]` (si R-1 lo permite); `T-009` no es `[P]` porque documenta lo que dejan T-004 a T-006. El trabajo puede ir a la vez; la entrada en `main` es de una en una, rebasando la siguiente (diseño §Integración, paso 5).

**Puerta mientras no existe `verificar`.** T-001 entra con las órdenes que crea (`tipos`, `estilo`, `test`, `arnes`); T-002, además, con `build`. Desde T-003, siempre `npm run verificar`.

**Lo que toma la 001.** Tras T-006, la 001 tiene app, errores sin valores, configuración cerrada y `verificar`. No necesita T-007 ni T-008: su estado vive en el esquema `conector_prueba` con su propio `001_estado.sql`, sin tocar `supabase/migrations/` (diseño de la 001, §Datos).

## Cobertura

REQ → tarea → prueba. Las pruebas `PRUEBA-0NN` son las de diseño §Mapa; las nuevas (055 a 059) se definen en `tareas.md`.

| REQ | Tareas | Pruebas | Cobertura en este plan |
| --- | --- | --- | --- |
| REQ-002, REQ-003 | T-001, T-003 | 055 | Parcial: `verificar` en lugar de la batería de 10 comprobaciones |
| REQ-004 | T-003 | 055 | Parcial: escáner del arnés y `merge --squash`; sin Gitleaks ni purga |
| REQ-005 | T-005 | 012 (parte L: 503 sin `VERCEL_REGION`) | Parcial: guardia en la app; sin `vercel.json` ni comprobación de región |
| REQ-006 | T-003, T-009, T-010 | 059 | Procedimiento de D-025 |
| REQ-007 | T-009, T-010 | 059 | «Sí» expreso; firmas aplazadas a la 003 |
| REQ-008 | T-010 | 059 | Comprobación 10 a mano |
| REQ-009 | T-001, T-002, T-004, T-009 | 024, 025, 026 | Completa en local |
| REQ-011 | T-005, T-006 | 028 (parte L) | Lista de nombres; los valores y los proyectos, persona |
| REQ-012 | T-006 | 028 (parte L) | Sin valores en el repositorio; ningún agente usa credenciales en este plan |
| REQ-019 | T-004, T-005 | 026, 044 (parte L) | Errores y salud sin valores; sin Sentry |
| REQ-020 | T-009 | 048 (parte L) | Solo la guía de trabajo local |
| — (asunto R-1) | T-007, T-008 | 056, 057, 058 | Base de datos en local, fuera de los REQ de la 002 |

Sin tarea en este plan (destino, asunto R-3): REQ-001 (copia diaria y remoto), REQ-010 (proyectos y DNS), REQ-013 (verificaciones con fecha), REQ-014 a REQ-018 (ventana, despliegue, producción, vuelta atrás, supervisión) y el resto de REQ-002 a REQ-005. La 002 no puede pasar a VERIFICADA hasta que los cubra otro plan.

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| Integración sin barrera técnica hasta la 003 | Commit en `main` sin carpeta de evidencias o sin `aprobacion.md` | Comprobación 10 a mano antes de cada «sí» (T-010 la prueba); para y avisa |
| PGlite no es Supabase: roles, `auth` y extensiones simulados | Algo pasa en PGlite y falla en `Nido` o en pgTAP | El preámbulo de `probar-modelo.mjs` se mantiene; pgTAP escritas y NO EJECUTADAS hasta el CI; nada se aplica a `Nido` en este plan |
| Versiones en VERIFICAR (`@types/*`, TypeScript 6.0.x, ESLint 10 con `eslint-config-next`, JSX en Vitest) | `npm ci` o `tipos` fallan | T-001 las fija con la skill `verificar-decision`, con fuente y fecha; ESLint 9.x si la 10 no se admite (diseño §Esqueleto) |
| Plan que empieza a crecer otra vez | Tarea que necesita otra pieza de la batería o del despliegue | Se anota para R-3; no se amplía la tarea |
| `verificar` lento | Más de 5 minutos en esta máquina | Se mide en T-003 y T-010; si pasa, se informa, sin quitar órdenes |

## Entornos y despliegue

- **L (local)**: Windows 11, Node 26, npm 11, sin Docker. Todo el plan se prueba aquí. La base de datos, solo en PGlite (proceso de Node, en memoria); no se crea ni se toca ningún proyecto de Supabase, y `Nido` no se usa.
- **CI (003, aplazada)**: pgTAP de T-008 y lo que diga el asunto R-3.
- **Despliegue**: ninguno en este plan. Preproducción llega con el plan de la 001 (relevo, punto 2); producción, aplazada (diseño §Aplazado a la 003; asunto R-4).
- **Vuelta atrás**: de código, `git revert` del commit de la tarea por el mismo camino (diseño §Integración, paso 7). De la base de datos en local: el archivo de reversión de T-007, probado con aplicar → revertir → aplicar (PRUEBA-057).

## Puertas que aplican

P1 (este plan), P2, P3 y P4 en cada tarea. P5: hay interfaz (T-002), con accesibilidad básica. P6: toca datos (T-007, T-008), sin despliegue. P7 de la 002, no en este plan (asunto R-3).

## Rutas críticas tocadas

Necesitan `auditor-seguridad` además del `revisor` (diseño §Integración, «Críticas»; `docs/SEGURIDAD.md`):

- **Migraciones, RLS, funciones `security definer` y roles**: T-007, T-008 (`supabase/**`; reglas de `.claude/rules/bd.md`).
- **Manifiesto, bloqueo y configuraciones de la raíz** (suministro): T-001, T-003.
- **Puerta de calidad y aislamiento** (`verificar`, `aislamiento`): T-003.
- **Código de la plataforma** (`src/lib/plataforma/**`, `src/lib/registro/**`): T-004, T-005.
- **Secretos y entornos** (`.env.example`): T-006.

Reservadas, que el «sí» nombra como tales: T-001 y T-003 (configuraciones de la raíz y claves de `package.json`), T-006 y T-009 (`docs/operacion/**`).

## Dependencias nuevas y verificaciones previas

Las de diseño §Esqueleto, más `@electric-sql/pglite` 0.5.17 (diseño §Integración, fuente anotada). En T-001, con `verificar-decision` y fuente: `@types/node`, `@types/react`, `@types/react-dom`, TypeScript 6.0.x, ESLint 10 frente a `eslint-config-next` y JSX en Vitest. En T-007: VERIFICAR el nombre de archivo de migración que acepta la CLI de Supabase; hasta verificarlo en la 003, la migración se nombra `supabase/migrations/0001_base.sql` y no se usa con la CLI.

## Correcciones tras la 1.ª pasada de T-010 (coordinación, D-036, 21/11/2026)

La 1.ª pasada de T-010 (20/11/2026, `evidencias/T-010/informe.md`) no se superó. La coordinación decide, por delegación D-036 (constitución 1.3):

1. **PRUEBA-059 reformulada** (`tareas.md`): D-036 sustituyó el «sí» por tarea de D-025; la aprobación consta en el mensaje del commit. La carpeta `evidencias/T-NNN/` completa es obligatoria desde T-005; T-001 a T-004 llevan evidencia mínima a posteriori, con «no consta» donde falte (art. 13). Como en `main` tampoco existen las de T-005, T-006 y T-009, T-012 las rellena con la misma regla. Se mantiene el detector del paso 6. Se admite que T-002 y T-003 compartan commit.
2. **PRUEBA-024 reformulada**: en desarrollo, `npm run dev`; `npm run start`, solo con entorno no de desarrollo ficticio. El cierre en fallo de `ENTORNO=desarrollo` con `NODE_ENV=production` no se toca. La guía la corrige T-011 (también su línea 79); `docs/operacion/**` queda autorizada para T-011 por D-036, con `plataforma` y `revisor`.
3. **Hallazgo ajeno**: el tiempo agotado de `tests/unit/diseno/acceso-muestra.test.ts` es de la función 020 (Fase 3 d); aquí no se arregla.
4. **Repetición de T-010** con `qa` en un clon limpio de `main` tras T-011 y T-012, con el criterio de `tareas.md`, «Repetición de T-010».

Orden: T-011 y T-012 en paralelo (no comparten archivos) → T-010. Reservada: T-011 (`docs/operacion/**`).

## Pendiente de decidir (responsable)

- **R-1. Alcance de la base de datos.** La especificación aprobada de la 002 deja fuera «migraciones, RLS, pgTAP y su vuelta atrás» (§Fuera de alcance) y la 010 está en PROPUESTA; D-024 y el relevo piden Supabase local con la migración base. Sin especificación aprobada no se implementa (artículo 5), así que T-007 y T-008 quedan **bloqueadas**. Opciones: a) enmienda de la 002 que incorpore la migración base y las pruebas de aislamiento en local (vuelve a P0); b) aprobar la 010, o la parte mínima, y mover allí T-007 y T-008; c) dejarlas fuera ahora: `aislamiento` sigue probando `docs/MODELO-DATOS.sql` (T-003). La 001 no depende de ellas. Este plan no elige.
- **R-2. Quién ejecuta el paso a `main`** tras el «sí»: el orquestador o el responsable. Propuesta: el orquestador, que nunca lo hace sin un «sí» que nombre la tarea.
- **R-3. Destino de los REQ sin tarea** (lista de §Cobertura): el plan de la 001 (despliegue en `pre-nido`), un segundo plan de la 002 o el CI de la 003.
- **R-4. Producción aplazada hasta la 003**, consecuencia de aplazar las firmas (diseño §Aplazado a la 003). Confirmarlo.
- **R-5. Quién escribe `scripts/` y las pruebas de la plataforma**: `docs/EQUIPO.md` no se lo asigna a nadie; este plan lo da a `plataforma`. Cambiar `EQUIPO.md` es reservado.
- **R-6. Comandos en `CLAUDE.md`**: tras T-009, añadir `npm ci --ignore-scripts`, `npm run dev` y `npm run verificar` (archivo reservado).

## Aprobación

Puerta P1. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 19/11/2026 | Orquestador, por delegación (D-019) | P1 abierta para T-001 a T-006, T-009 y T-010. Comprobador SUPERADO; diseño 38 KB. T-007 y T-008 (migración base y RLS) **siguen bloqueadas por R-1**: la especificación aprobada deja fuera las migraciones y enmendarla no se decide por delegación. R-2: el orquestador hace el `merge --squash`, solo tras el «sí» expreso del responsable. R-5: `plataforma` escribe `scripts/` y pruebas de plataforma. R-3, R-4 y R-6 quedan para el responsable |
| 21/11/2026 | Coordinación, por delegación (D-036) | PRUEBA-059 y PRUEBA-024 reformuladas; T-011 y T-012 añadidas; repetición de T-010 pendiente (§Correcciones tras la 1.ª pasada de T-010) |
