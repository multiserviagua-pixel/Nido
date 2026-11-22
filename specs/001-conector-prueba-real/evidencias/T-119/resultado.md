# T-119 · Resultado de la preparación sin despliegue (22/11/2026)

Autor: `qa`. Copia `.claude/worktrees/t-119`, rama `tarea/T-119`. Alcance de esta pasada: **solo lo que se puede preparar sin despliegue**. No se ha ejecutado nada contra Vercel, `pre-nido` ni `Nido`; no se ha ejecutado la batería completa, ni el build, ni Playwright (artículo 13).

## Pruebas ejecutadas en esta pasada

| Prueba | Qué prueba | Entorno | Comando | Resultado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Lógica del script de ráfaga (41 casos, tras la revisión) | Cuenta códigos; SUPERADA con 429 o 403 solo si la primera limitada es la n.º 2 a la 104; NO CONCLUYENTE si es la n.º 1 (403 desde la primera) o pasa de la 104 (límite de 180, cambio de ventana a mitad); una 302 no se sigue (`redirect: "error"`; el servidor de destino recibe 0); FALLIDA sin límite (sin regla, `Equals`, una sola ruta); NO CONCLUYENTE con cambio de ventana y 120, servidor caído o ráfaga lenta; sin credenciales ni cookie; salida sin dirección, puerto ni cuerpos; 14 configuraciones rechazadas con 0 peticiones (sin `pre-`, http, ruta, consulta, puerto, usuario, fuera de 101 a 400, TLS apagado) | local, servidor falso en 127.0.0.1 | `npx vitest run tests/unit/plataforma/rafaga-waf.test.ts --maxWorkers=1` | superada (41 de 41); antes de corregir el script, 5 de 41 en rojo | `a/vitest-rafaga.txt`, `a/vitest-rafaga-rojo.txt` |
| La prueba falla si el código está mal | 3 mutaciones en la primera pasada y 4 en la corrección (`redirect: "follow"`, sin el caso n.º 1, sin el tope de 104, sin cota inferior) | local | el mismo, una vez por mutación | superada (7 de 7 detectadas) | `a/mutaciones.txt` |
| Estilo y tipos de lo tocado | eslint y prettier de los dos archivos; `tsc --noEmit` del proyecto | local | ver `a/estilo-tipos.txt` | superada (código 0 en los tres, en las dos pasadas) | `a/estilo-tipos.txt` |
| Arnés: trazabilidad, contratos y escáner de secretos | documental, no prueba comportamiento | local | `node scripts/comprobar-specs.mjs` | superada (salida 0, «RESULTADO: SUPERADO»; «Sin secretos en el repositorio»; 37 avisos de tamaño ajenos a T-119, D-023) | `comprobar-specs.txt` |

Lo que esto **no** prueba: que el WAF de `pre-nido` limite. Eso es a1 del guion, sin ejecutar.

## Preparado / falta

| Parte | PRUEBA | Preparado | Falta | Quién y cuándo |
| --- | --- | --- | --- | --- |
| (a) a1 | ráfaga del WAF | `scripts/conector/rafaga-waf.mjs` y su prueba; pasos y criterios en `guion-operativo.md`; plantilla en `a/resultado.md` | **No ejecutada.** Lanzarlo contra `pre-nido` y anotar los aciertos en Firewall, Overview. Necesita las reglas publicadas en 429 o 403 (no Log) y el gasto aceptado | persona, tras T-117 (b) |
| (a) a2 | PRUEBA-009 (R) | procedimiento con DCR por `curl` y navegador real, criterio que distingue `Origin` aceptado («código no válido», 200) de rechazado («solicitud no válida», 400) | **No ejecutada.** No se puede en local: `next start` no tiene base en esta máquina (sin Docker) y sin base la pantalla no abre solicitud. La parte B ya existe (pruebas citadas en el guion). No se ha escrito prueba nueva para PRUEBA-009: lo que falta solo lo muestra un navegador real | persona con su navegador (AR-16), antes del paso 3 |
| (a) a3 | PRUEBA-006 (V-6) | procedimiento con `curl` y seis `x-vercel-forwarded-for` falsas de rangos de documentación; criterio de falsificable o no | **No ejecutada.** Sin herramienta propia: a mano es delicado (campos ocultos y tarro de cookies en la terminal). Propuesta: un script como el de la ráfaga que abra la solicitud, mande los seis POST y solo imprima códigos | persona, tras a2; el script, en otra pasada si la coordinación lo pide |
| (a) a4 | PRUEBA-010 (V) | 12 comprobaciones por estado, con su criterio WCAG y su relación con M1 a M5 | **No ejecutada.** Se puede adelantar sin despliegue sobre el HTML regenerado de T-113 (filas 1 a 5 y 10 a 12), pero no sustituye a la pasada en `pre-nido`. M1 a M3 siguen sin decidir y sin tocar (`pantalla.ts`, otra tarea con auditor) | persona y `qa`; decisión de M1 a M5, coordinación |
| (b) | PRUEBA-040, 041 (inicio) | pasos exactos, qué anotar (incluidos `resource` y `scope` de V-6), criterios, plantilla | **No ejecutada.** | persona (AR-11), tras (a) y T-118 (b) |
| (c) | PRUEBA-042, 049 (paso 7), 045 | ídem, con los nombres exactos de las operaciones de `operar` | **No ejecutada.** Espera AR-09 | persona |
| (d) | PRUEBA-043, 044, 050, 048 (diaria) | ídem, tabla por bloque de 24 h | **No ejecutada.** Espera `calendario.md` aprobado (AR-08) y día D | persona; `qa` cada día |
| (e) | PRUEBA-046 | ídem | **No ejecutada.** | persona (AR-11) |
| (f) | PRUEBA-052, 023, 041 (final) | ídem | **No ejecutada.** Espera AR-10 y AR-12 | persona y `qa` |
| (g) | PRUEBA-051, 053 | ídem | **No ejecutada.** Espera (f) y AR-15 | `qa`; decisión del responsable |

## Avisos para la coordinación

1. **Falso fallo posible en el procedimiento de despliegue.** El apartado 8 de `docs/operacion/despliegue-preproduccion.md` propone «un bucle de 120 `curl`». Con ventana fija de 60 s, si la ventana cambia a mitad de la ráfaga, 120 peticiones pueden quedar en 60 y 60 y no ver ningún 429 con la regla bien puesta. Con 201 o más no pasa. El script usa 210 y da NO CONCLUYENTE (no FALLIDA) por debajo de 201. No se ha editado el procedimiento.
2. **Decisión pendiente de la coordinación: cómo entra la URL.** Hoy va por variable de entorno (`RAFAGA_URL_BASE`), como se pidió, y **no se ha cambiado** (MENOR-4 de la revisión). Las demás órdenes del conector piden la dirección sin eco (`entrada.mjs`) para que no quede en el historial. La dirección de `pre-nido` no es un secreto y el script nunca la escribe en la salida, pero sí queda en el historial de PowerShell. Opciones: mantener la variable (y que el guion la borre en a1.5, como ya dice) o pasar a la entrada sin eco (cambio pequeño, con prueba). Estado: **pendiente**; la decide la coordinación.
6. **Criterio de SUPERADA del script (MAYOR-1 de la revisión).** Ya no basta con algún 429/403: la primera limitada tiene que ser la n.º 2 a la 104 (`MINIMO + CONCURRENCIA − 1`). Limitada desde la n.º 1 o a partir de la 105 es NO CONCLUYENTE. Consecuencia: un cambio de ventana a mitad de la ráfaga, que antes daba SUPERADA, ahora pide repetir. El guion pide además anotar en a1.1 el límite y la ventana que muestra el panel.
7. **El control `pre-` no es de autorización (MENOR-3).** Solo evita equivocarse de destino; la cabecera del script lo dice.
3. **Orden de la parte (a).** a2 y a3 cuentan intentos fallidos de activación desde la IP de la persona, y a3 la deja bloqueada 15 minutos (5 fallos, `001_estado.sql`). El paso 3 no puede empezar antes. a1 limita durante 60 s todo `/api/`, también `/api/operacion`.
4. **«Antes del paso 3» se mantiene tal cual.** El paso 4 real también es un GET y un POST en navegador real, pero `tareas.md` y el diseño piden PRUEBA-009 (R) antes del paso 3. Por eso a2 usa una solicitud propia por DCR y no la reinterpreta.
5. **Carpeta de evidencias.** `tareas.md` escribe `ev/T-119/`. En disco solo existe `evidencias/`, así que se ha usado `evidencias/T-119/`.

## No comprobado en esta pasada

- `node scripts/comprobar-specs.mjs` **se ejecutó** en la corrección de la revisión (22/11/2026), con todos los cambios de esta tarea en la copia de trabajo: salida 0, «RESULTADO: SUPERADO», escáner sin secretos (`comprobar-specs.txt`). En la primera pasada no se había ejecutado. Es documental: no prueba comportamiento. Los hosts de las pruebas se componen en ejecución con `*.ejemplo.invalid`, y las IP de a3 son de los rangos de documentación.
- La batería completa no se ha ejecutado. El archivo nuevo vive en `tests/unit/plataforma/`, que el CI ejecuta (D-030). No usa red real, solo 127.0.0.1.
- Revisión independiente: primera vuelta del `revisor` hecha (1 MAYOR y 8 MENORES, corregidos en esta pasada salvo MENOR-4, que queda como decisión pendiente); falta la vuelta de comprobación. El script no toca rutas críticas: solo hace peticiones sin credenciales.
