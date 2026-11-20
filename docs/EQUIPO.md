# Equipo: roles, orquestador y enrutado de modelos

## Roles

| Agente | Función | Puede escribir en | Modelo | Esfuerzo |
| --- | --- | --- | --- | --- |
| `orquestador` | Conduce el ciclo SDD, reparte tareas, aplica puertas, informa al responsable | `specs/` (coordinación), `docs/PLAN.md`, `docs/TECNOLOGIAS.md` | `sonnet` | `medium` |
| `arquitecto` | Diseño técnico, ADR, contratos, plan y tareas | `specs/`, `docs/adr/`, `contratos/` | `opus` | `high` |
| `especificador` | Requisitos medibles, casos negativos, criterios de aceptación | `specs/` | `opus` | `high` |
| `auditor-seguridad` | Amenazas de la función y dictamen en rutas críticas | Nada | `opus` | `high` |
| `revisor` | Revisión independiente contra especificación, contratos y constitución | Nada | `opus` | `high` |
| `ingeniero-bd` | Migraciones, RLS, funciones, pruebas pgTAP | `supabase/` | `sonnet` | `medium` |
| `ingeniero-backend` | Conector, autorización, webhooks, tareas periódicas | `src/` de servidor, `tests/unit/` | `sonnet` | `medium` |
| `ingeniero-frontend` | Dashboards | `src/app/`, `src/components/`, `tests/unit/` | `sonnet` | `medium` |
| `disenador-ui` | Sistema de diseño, accesibilidad, revisión visual | `docs/DISENO.md`, estilos y componentes base | `sonnet` | `medium` |
| `qa` | Pruebas de integración y extremo a extremo; ejecuta la verificación | `tests/`, `specs/NNN/evidencias/`, `verificacion.md` | `sonnet` | `medium` |
| `plataforma` | CI/CD, entornos, supervisión, guías de operación | `.github/`, configuración de despliegue, `docs/` de operación | `sonnet` | `medium` |
| `explorador` | Búsquedas y comprobaciones mecánicas | Nada | `haiku` | `low` |

Los permisos de escritura de cada agente están descritos en su archivo. Las herramientas disponibles sí se limitan en la cabecera: los agentes de solo lectura no tienen herramientas de edición, y ninguno, salvo el orquestador, puede lanzar otros agentes.

## Responsabilidades

R = ejecuta, A = autoridad, C = consultado.

| Acción | Orquestador | Especificador | Arquitecto | Ingenieros | QA | Revisor | Auditor | Persona |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Especificar | C | R | C | — | C | — | — | A |
| Diseñar y planificar | C | — | R | C | C | — | C | A |
| Implementar una tarea | C | — | C | R | — | — | — | — |
| Escribir y ejecutar pruebas | — | — | — | R | R | — | — | — |
| Revisar un cambio | — | — | — | NO (el propio) | — | R | R en rutas críticas | — |
| Cambiar constitución, permisos, CI o secretos | NO | NO | NO | NO | NO | NO | NO | A |
| Abrir las puertas P0, P1 y P7 | NO | NO | NO | NO | NO | NO | NO | A |
| Autorizar la publicación | NO | NO | NO | NO | NO | NO | NO | A |

El dictamen del revisor no sustituye a la protección de la rama ni a la aprobación humana.

## Enrutado de modelos

El criterio es el coste de equivocarse, no el tamaño de la tarea.

| Nivel | Modelo | Para qué | Por qué |
| --- | --- | --- | --- |
| 1 | `opus` (arquitecto, especificador, auditor, revisor); `fable` solo por escalado anotado | Decisiones caras de deshacer y juicio independiente | Un error aquí se multiplica en todo lo que viene después |
| 2 | `sonnet` | Implementar con especificación, contrato y prueba delante | El trabajo está acotado y se comprueba con pruebas y revisión |
| 3 | `haiku` | Buscar, listar, comprobar cabeceras, dar formato | No requiere juicio y se repite mucho |

Reglas:

1. **Rutas críticas** (lista en `docs/SEGURIDAD.md`): siempre dictamen del `auditor-seguridad`, además del `revisor`.
2. **Escalado**: si una tarea falla dos veces en su nivel, se repite con esfuerzo `high`; si vuelve a fallar, pasa al modelo del nivel superior. Se anota en `tareas.md`.
3. **Independencia**: quien revisa no ha escrito el cambio, y revisa con el código delante, no con el resumen del autor.
4. **Ningún modelo es el único árbitro de seguridad**: deciden las pruebas y los escáneres del CI.
5. **Contexto mínimo por tarea**: constitución, decisiones que apliquen, la especificación, el contrato, los archivos afectados y sus pruebas. Se pasan rutas, no historiales pegados.
6. **Paralelo** solo entre tareas marcadas `[P]` en `tareas.md`, que no comparten archivos.

### Cómo cambiar el enrutado

El modelo y el esfuerzo se fijan en la cabecera de cada archivo de `.claude/agents/` (`model`, `effort`). Para cambiar un rol, edita su archivo y esta tabla.

Orden de prioridad que aplica Claude Code: el modelo indicado en la llamada al agente, después la cabecera del agente, después la variable `CLAUDE_CODE_SUBAGENT_MODEL` y, por último, el modelo de la conversación. Si esa variable está definida en el entorno con `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`, anula este enrutado: no debe estarlo. `CLAUDE_CODE_EFFORT_LEVEL` anula el esfuerzo de las cabeceras.

Alias vigentes el 12/11/2026: `fable` es Fable 5.2, `opus` es Opus 5.5, `sonnet` es Sonnet 5.5 y `haiku` es Haiku 5.5.

## Orquestador

Hay dos maneras de trabajar como orquestador:

- **En la app de escritorio**: la sesión principal ejecuta la skill `/orquestar`. Es la forma habitual.
- **En terminal**: `claude --agent orquestador` arranca la sesión con la definición `.claude/agents/orquestador.md`, que limita qué subagentes puede lanzar.

No se fija la clave `agent` en `.claude/settings.json`, porque convertiría cualquier sesión en orquestador.

Lo que hace el orquestador en cada vuelta:

1. Lee `docs/PLAN.md` y la carpeta de la función en curso, y determina en qué paso del ciclo está.
2. Ejecuta la skill de ese paso, que indica a qué subagente lanzar y con qué encargo.
3. Comprueba el resultado él mismo (lee los archivos, ejecuta el comprobador). El informe de un subagente no es una prueba.
4. Si el paso termina en una puerta de persona, se detiene y pregunta. No continúa sin respuesta expresa.
5. Anota el avance y sigue.

Lo que no hace: escribir código de producto, aprobar su propio trabajo, saltarse una puerta, cambiar la constitución.

## Ahorro de uso (D-018)

Medido el 14/11/2026: el gasto no venía del trabajo útil, sino de chats muy largos (hasta 851.000 tokens de contexto, que se reenvían en cada mensaje), de orquestar con Fable en todos los chats, de especificaciones de más de 300 KB y de seis fases a la vez. Reglas desde entonces:

1. **Chats cortos.** Un chat por función y por tramo del ciclo, no uno por fase. Al terminar un paso, o al pasar de unos 150.000 tokens de contexto, el orquestador escribe `specs/NNN/relevo.md` y el trabajo sigue en un chat nuevo que empieza leyendo ese archivo. El estado vive en disco, no en la conversación.
2. **Orquestar con Sonnet.** Los chats de fase y de coordinación se abren con Sonnet (`.claude/settings.json` fija `sonnet` por defecto; en la terminal, `claude --agent orquestador`). Opus para `arquitecto`, `especificador`, `auditor-seguridad` y `revisor`. Fable solo por escalado anotado (D-023).
3. **Especificaciones acotadas.** Como mucho unos 20 requisitos y 5 cuestiones abiertas por función. Si no cabe, la función se divide.
4. **Encargos que citan el apartado exacto.** Se pasa la ruta y el apartado que hay que leer, no documentos enteros. `docs/MODELO-DATOS.sql` solo se lee completo en tareas de base de datos.
5. **Dos fases a la vez como mucho**, y dos subagentes a la vez por chat.
6. **No se rehace lo ya escrito** para ajustarlo a estas reglas: las especificaciones anteriores se recortan al diseñarlas.

### Segunda medición (19/11/2026, D-023)

Del 12 al 14/11 el gasto fue de unos 117 millones de unidades ponderadas: el 77 % con Fable y el 21 % con Opus. Los chats de orquestación, abiertos con Fable y de hasta 850.000 tokens, se llevaron cerca del 60 %. Los diseños llegaron a 100–275 KB por función, y cada arquitecto, auditor y revisor los releía enteros. Hubo 35 encargos al especificador y trabajo repetido por tener dos chats en la misma fase. Las reglas de arriba existían, pero solo como texto. Desde D-023 se hacen cumplir:

7. **Tamaños con aviso automático.** `diseno.md` ≤ 40 KB; `especificacion.md`, `plan.md` y `tareas.md` ≤ 25 KB. `node scripts/comprobar-specs.mjs` lista los que se pasan. Los límites rigen para documentos nuevos o que se reescriben; un documento aprobado que se pasa solo se recorta cuando se vaya a reescribir de todos modos (D-031).
8. **Correcciones por apartado.** Tras un dictamen se cambian solo los apartados afectados, y la segunda vuelta revisa solo lo cambiado.
9. **Un solo orquestador por fase.** Antes de abrir uno, se cierra el anterior. Nunca dos chats sobre la misma función.
10. **Sin esperas que gastan.** El orquestador no lanza bucles con `sleep` para vigilar archivos: espera el aviso del subagente.

No se rebaja el modelo ni el esfuerzo de `auditor-seguridad` y `revisor`, ni se quita ninguna puerta o prueba.

## Estado de la carga en la app de escritorio

Comprobado el 12/11/2026 en una sesión abierta en esta carpeta (T-017): los 12 agentes y las 14 skills aparecen listados; el `explorador` se lanzó y solo disponía de sus tres herramientas de lectura; la skill `cerrar-fase` se invocó y se cargó.

No se ha observado directamente con qué modelo se ejecuta cada agente: el listado de la sesión no lo muestra. Si en algún momento los agentes del proyecto no estuvieran disponibles, el orquestador los sustituye por el agente general con el encargo del archivo correspondiente e indica el modelo en la llamada.
