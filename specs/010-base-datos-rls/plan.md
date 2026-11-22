# 010 · Plan

Autor: `arquitecto` · Fecha: 20/11/2026 · Fuentes: `diseno.md` («Lo que queda para el plan», «Pruebas», «Flujo», «Dudas para el responsable»), `dictamen-diseno-2.md` (condiciones 1 a 4, N-1 a N-8). Tareas y reparto de las condiciones: `tareas.md`.

## Orden de trabajo

Quince tareas, con los números del diseño. Se implementa una cada vez (CLAUDE.md). `[P]` solo indica que el orden entre ellas es libre porque no comparten archivos. Como mucho dos subagentes a la vez (`docs/EQUIPO.md`, D-018, regla 5).

| Bloque | Tareas | Por qué en este orden |
| --- | --- | --- |
| 1 · Migraciones sobre PGlite | T-001 → T-002 → T-003 → T-004 → T-005 → T-006 | Cadena estricta: cada migración usa lo de la anterior (diseño D-1). Las tablas nacen con RLS y sin permisos, y los permisos llegan en M07 |
| 2 · Datos y scripts | T-007 `[P]` (tras T-006) · T-012 `[P]` (tras T-003) | El seed necesita todas las tablas y M10. Los scripts solo necesitan saber cuáles son las migraciones protegidas |
| 3 · pgTAP, escrito y NO EJECUTADO | T-008 → T-009 `[P]` y T-010 `[P]` → T-011 | Las pruebas usan los identificadores fijos del seed y las ayudas de T-008. T-011 escribe `declaradas.json` con todos los recuentos |
| 4 · CI y entornos | T-013 → cierre de T-011 → T-014 → T-015 | El CI exige P1-a. La enumeración de R-2 y R-3 sale de su primera ejecución. `Nido` exige CI en verde y el «sí» del responsable (D-025) |

Las tareas 1 a 12 avanzan con el arnés PGlite y las pruebas locales L 1 a 14. Ninguna se da por cerrada contra un `CA-` hasta la primera ejecución de T-013: si esa ejecución falla, la tarea de origen se reabre.

**Decisiones del responsable que bloquean una tarea**

| Decisión | Antes de | Motivo |
| --- | --- | --- |
| P1-f, con el alcance de N-1 (condición 1) | T-003 | Es la primera tarea con funciones en `privado`. Hoy `.claude/rules/bd.md:13`, `.claude/agents/ingeniero-bd.md:23` y `.claude/skills/migracion-bd/SKILL.md:26` mandan `search_path = ''` |
| Aviso a la 001 (condición 1) | Cualquier SQL de la 001 en `Nido` | Las funciones `security definer` de la 001 con `''` y el `temporary` heredado (N-1) |
| P1-c, P1-d | T-005 | Baja no reactivable. `service_role` solo con permisos sobre `versiones_prompt` |
| P1-g (condición 3) | T-011 | Cómo se leen CA-009 y REQ-012 con la lista residual de D-9 |
| P1-a | T-013 | CI y protección de `main` (artículo 14). La 003 está aplazada (D-024): sin un remoto con CI no se cierra ningún criterio |
| P1-b | T-013, opcional | `@electric-sql/pglite-pgtap` 0.0.18, no antes del 26/11/2026 (D-027) |
| P1-h | T-014 | `pg_net` en `Nido` y `log_statement = 'ddl'` |
| P1-e, P1-i | Ninguna tarea de la 010 | Afectan a la 021 y a la fase 4 |

**Traspaso de la 002 (R-1).** T-007 de la 002 pasa a T-001 a T-006 (migraciones y arnés) y T-008 de la 002 pasa a T-008 a T-011. Que la 002 los marque como trasladados es cosa de su chat (`propuestas.md`, n.º 17).

**Choques con reglas vigentes que se resuelven en P1.** La regla de la tarea manda sobre la del agente solo si el responsable lo acepta:

- `search_path`: P1-f.
- `.claude/rules/bd.md:18` y `.claude/agents/ingeniero-bd.md:22` y `:27` piden políticas y prueba pgTAP en la misma migración o cambio. El diseño D-1 deja las políticas en M07 y el pgTAP en T-008 a T-011. Mientras tanto, las tablas nacen cerradas (RLS y `revoke all`), cada tarea trae sus casos del arnés, con acceso cruzado desde T-005, y nada llega a `Nido` antes de T-013 en verde.
- `ingeniero-bd` solo escribe en `supabase/` (`docs/EQUIPO.md`), pero el diseño le asigna `scripts/bd/`, `tests/unit/bd/` y dos guías de `docs/operacion/`. El encargo de cada tarea lo dirá, salvo que en P1 se decida pasar esas rutas a `plataforma`.

## Riesgos y cómo se reducen

| Riesgo | Señal de que ocurre | Qué se hace |
| --- | --- | --- |
| No hay CI (003 aplazada) | P1-a sin respuesta | Las tareas quedan «hecha (local)», no se aplica nada en `Nido` y ningún `CA-` se anota |
| PGlite no se comporta como el Postgres de Supabase (B-1, permisos por defecto de la plataforma) | Verde en local y rojo en CI | El arnés no es evidencia (REQ-028). La primera ejecución de T-013 reabre la tarea de origen |
| La CLI no envuelve cada archivo en una transacción, o el nombre o el seed son distintos | Un VERIFICAR de T-001 sin fuente oficial | Queda VERIFICAR hasta T-013. CA-025 lo prueba en CI y, si falla, se añaden `begin; … commit;` |
| `pg_prove` no admite `\ir` | Las ayudas fallan en CI | Se repiten en cada archivo, generadas igual en todos, y el `revisor` comprueba que son idénticas |
| El agente aplica su regla y no la del diseño (`''`, políticas en M02) | Aparece en el diff | Precondición P1-f. El encargo cita D-1 y D-3, y el `revisor` lo trata como bloqueante |
| N-1, N-2, N-3, N-4 y N-7 añaden aserciones y CA-023 compara con el número del diseño | `declaradas.json` distinto de «Pruebas» | Cada añadido se anota con su origen. El `arquitecto` corrige el apartado «Pruebas» antes de T-015 |
| La plataforma cambia la lista residual o sus esquemas | 01 o 04 en rojo sin cambio nuestro | Nueva aceptación nominal del `auditor-seguridad`, en una tarea nueva con dictamen |
| La 001 aplica en `Nido` funciones con `''` | Lo encuentra la consulta N-1 de T-014 | Aviso antes de que lo aplique (condición 1). La lista va a la 001 |
| Una tarea grande (T-005, T-011, T-012) falla en revisión | Dos vueltas sin APTO | Escalado de `docs/EQUIPO.md` (regla 2), anotado en `tareas.md` |
| p95 por encima de 500 ms en el plan gratuito | CA-027 en rojo | Plan de consulta con `explain analyze` antes de tocar índices. El cambio va en una migración nueva con su prueba |
| La contraseña del conector aparece en los registros (M-3) | Una línea con el verificador o con `password` en los registros de `Nido` | Se para, se rota por el mismo procedimiento y se avisa al responsable |

## Entornos y despliegue

- **Local** (Windows, sin Docker): arnés PGlite en `supabase/tests/pglite/` (corre dentro de `npm test`) y L 1 a 14 en `tests/unit/bd/`. No es evidencia de ningún `CA-` (REQ-028). El pgTAP solo corre aquí con `@electric-sql/pglite-pgtap` si se aprueba P1-b, y aun así figura como «no ejecutada en CI».
- **CI** (`bd.yml`, T-013): `npx supabase start` y todo lo de diseño «Flujo», 2. Es la única evidencia de los `CA-`, salvo CA-001, CA-026, CA-027 y CA-032, y de lo de «Fuera de CI».
- **`Nido`** (T-014): una persona ejecuta `npx supabase db push` tras P1, el CI en verde y su «sí», y después fija `app.entorno = 'desarrollo'` y carga el seed y el volumen con `psql`. No se toca `conector_prueba`.
- **Producción**: no existe en la fase 2. CA-026 y CA-032 se cierran en simulación (T-012).
- **Integración por tarea**: el procedimiento de la 002 (diseño, «Integración», D-025):
  - rama `tarea/T-NNN`, con la prueba primero, en su commit y en rojo;
  - `npm run verificar`, ejecutado por quien no implementó;
  - `revisor` y `auditor-seguridad`;
  - «sí» del responsable;
  - `merge --squash` con el mensaje `T-NNN (010): …`.

  Las evidencias van en `specs/010-base-datos-rls/evidencias/T-NNN/`. Desde T-013, también el CI en verde en la rama.
- **Vuelta atrás**:
  - Del código: `git revert` del commit integrado.
  - De la base, en CI y en `Nido`: `revertir.mjs` en orden inverso. M04 y M05 solo se revierten en CI; en `Nido` y en producción se corrigen con una migración nueva (REQ-053).
  - Revertir M01 con objetos se niega. Tras revertir y volver a aplicar, el rol `conector` queda sin inicio de sesión: es un fallo seguro.

## Puertas que aplican

| Puerta | Cómo se cumple aquí | Quién |
| --- | --- | --- |
| P2 Código | En cada tarea: `npm run verificar` en verde, con la prueba primero | Ingeniero de la tarea; la ejecuta el orquestador |
| P3 Integración | Primera ejecución de T-013: pgTAP 01 a 09, ciclo, concurrencia y procedimiento de administradores | `qa`, `ingeniero-bd` |
| P4 Seguridad | Todas las tareas: `revisor` y `auditor-seguridad`. Escáner en CI (T-013) y CA-020 (T-015) | `revisor`, `auditor-seguridad` |
| P6 Operación (toca datos) | Vuelta atrás probada (CA-024, CA-025, CA-031), reversión de las protegidas en simulación (CA-032), guías `docs/operacion/rol-conector.md`, `administradores.md` y `migraciones.md`, supervisión (`log_statement`, N-5) | `plataforma` da el visto; las evidencias las reúne T-015 |
| P7 Cierre | Todos los `CA-` con evidencia | Persona |

P5 no aplica: la función no tiene interfaz.

## Rutas críticas tocadas

Todas las tareas pasan por `revisor` y `auditor-seguridad` (D-029).

- **RLS y migraciones**: T-001 a T-012.
- **Licencias** (`resolver_token`, funciones del conector): T-006.
- **Entrega del prompt** (versiones inmutables, huella): T-003.
- **CI**: T-013, reservada (artículo 14).
- **Credencial del conector y configuración de `Nido`**: T-014, reservada.

Aceptaciones nominales del `auditor-seguridad`:

- T-011: R-2, R-3 y la lista de esquemas de la plataforma.
- T-015: CA-020.

## Aprobación

Puerta P1. La abre el responsable, con fecha.

| Fecha | Quién | Resultado |
| --- | --- | --- |
| 20/11/2026 | Responsable (respuesta expresa en el chat) | P1 APROBADA: diseño y plan (15 tareas). P1-a: `bd.yml` y protección de `main`, sí. P1-b: `@electric-sql/pglite-pgtap` 0.0.18 ya (D-034). P1-f/g: enmienda de `search_path = pg_catalog, pg_temp` con alcance N-1 y CA-009/REQ-012 con lista residual. P1-c/d/e: sí. P1-h/i y desviaciones del plan (políticas en M07, pgTAP en T-008 a T-011, rutas de `ingeniero-bd`): sí. |
