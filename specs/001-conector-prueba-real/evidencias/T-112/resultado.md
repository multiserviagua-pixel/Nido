# T-112 · Resultado de la evidencia (22/11/2026)

commit base: 660f7854cb6b7a661ddb921a8d46a7ea71b1b954 (rama `tarea/T-112`, copia `.claude/worktrees/t-112`) · entorno: Windows 11, Node v26.13.0, Vitest 5.1.0, PGlite, sin red ni Docker · fecha: 22/11/2026

| Prueba | Archivo | Comando | Resultado |
| --- | --- | --- | --- |
| PRUEBA-009 (parte estática: `same-origin` solo en `/oauth/autorizar`), inventario | `tests/unit/plataforma/inventario-001.test.ts` + `tests/plataforma/inventario-rutas-001.json` | `npx vitest run <archivo> --maxWorkers=1` | superada: 12 casos |
| PRUEBA-009 (parte contra `next start`) | mismo archivo, bloque `describe.skipIf(INVENTARIO_BASE_URL)` | requiere `npm run build`, `npm run start` y `INVENTARIO_BASE_URL=http://localhost:3000` | **no ejecutada** (9 casos omitidos): necesita build y servidor; se ejecutará en T-114 o en la verificación previa al despliegue, con la máquina libre |
| PRUEBA-025 de la 002 | `tests/unit/api/salud.test.ts`, `rutas.test.ts`, `cabeceras.test.ts`, `tests/unit/app/paginas.test.tsx` | idem | superada (en la misma ejecución) |
| PRUEBA-014 (CAD-015 entero, B idéntico) y PRUEBA-013 | `tests/conector/aislamiento.test.ts` | idem | superada: 7 casos |
| PRUEBA-018 (cada variable, paso y punto) y PRUEBA-016 | `tests/conector/fallos.test.ts` | idem | superada: 43 casos |
| PRUEBA-017 y PRUEBA-019 | `tests/conector/hostiles.test.ts` | idem | superada: 66 casos |
| PRUEBA-004 (B), PRUEBA-002 (2 de 2), PRUEBA-001 (CAD-002) | `tests/conector/ciclo.test.ts` | idem | superada: 4 casos |

Ejecución conjunta (`vitest-salida.txt`): 9 archivos, 187 casos superados, 9 omitidos (los de `next start`), 0 fallidos. Además: `npm run tipos` y `npm run estilo` en 0.

## Pruebas que pueden fallar (mutaciones aplicadas a mano en la copia y revertidas, sin commit)

| Mutación | Archivo mutado | Prueba que la detecta |
| --- | --- | --- |
| M1 `mcp_confirmar_orden` sin filtro de licencia | `001_estado.sql` | aislamiento: «orden de B…» falla |
| M2 `mcp_enviar_informe` sin exigir la misma conexión | `001_estado.sql` | aislamiento: «ejecucion_id de B…» falla |
| M4 `operar_revocar_conexion` revoca la licencia entera | `001_estado.sql` | aislamiento: PRUEBA-013 falla |
| M5 sin validar `OPERACION_HUELLA` | `configuracion.ts` | fallos: 3 casos de esa variable fallan |
| M8 prompt servido con un byte más | `obtener-instrucciones.ts` | fallos: PRUEBA-016 falla |
| M9 el saneado no cuenta lo descartado | `sanear-informe.ts` | hostiles: 2 casos fallan |
| M10 `informes` con `on conflict do update` (gana el último) | `001_estado.sql` | hostiles: «el mismo informe dos veces» falla |
| M11 el aviso de consola añade consulta y `user-agent` | `entrada.ts` | hostiles: PRUEBA-019 «marcas» falla |
| M14 metadato `authorization_response_iss_parameter_supported` en `false` | `metadatos.ts` | ciclo: PRUEBA-001 falla |
| M15 ventana de gracia de 0 s o de 600 s | `001_estado.sql` | ciclo: los dos ciclos fallan (la primera versión de la prueba no la detectaba con el reloj congelado; se corrigió avanzando 30 s y 31 s) |
| M17 `same-origin` sustituido por `no-referrer` en `/oauth/autorizar` | `next.config.ts` | inventario: 2 casos fallan |
| M18 `source` global sin la exclusión de `/oauth/autorizar` | `next.config.ts` | inventario: 1 caso falla |

Mutaciones citadas en las cabeceras de las pruebas y no aplicadas a mano en T-112 (pendientes, sin resultado): M3, M6, M7 y M16. Las cabeceras lo indican.

Diferencia observada (no es defecto de aislamiento): revocar una conexión inexistente da 404 `conexion_desconocida` y revocar una ya revocada da 200 `sin_cambio`; la prueba fija ambos. Se pidió que fueran iguales: decide el revisor si es aceptable.

No se mutó (límite): el bloqueo de fila bajo concurrencia real. PGlite tiene una sola conexión y `bd.como` serializa, así que «diez a la vez» comprueba el «el primero gana» y los resultados `repetido`/`repetida`, no el `for update`; eso es PRUEBA-008 (T-114, contra `Nido` por el 6543).

## Evidencia de integración (22/11/2026)
Rama `tarea/T-112` rebasada sobre `main`, con candado de suite y `esperar-memoria.sh 4000` (regla D).
- **Suite completa (`npx vitest run --maxWorkers=2`): NO EJECUTADA.** Tres intentos: el sistema mató el primero por memoria baja, el segundo no dejó resumen (solo la línea «RUN», no vale) y el tercero murió de nuevo por memoria (el segundo con «Zone Allocation failed»). Se integra con lo que fija la regla D.
- Archivos de la tarea (`aislamiento`, `fallos`, `hostiles`, `ciclo` de `tests/conector/`, `inventario-001` y `manifiesto`) con `--maxWorkers=1`: 6 archivos, 149 pruebas superadas, 9 omitidas (los casos contra `next start`, sin `INVENTARIO_BASE_URL`), 0 fallidas (`salida/vitest-tarea.txt`).
- `npm run tipos`, `estilo`, `aislamiento`, `arnes` y `build`: 0 en la pasada del mismo estado (`salida/codigos.txt`); `AGENTS.md` sin cambios.
- Decisión de la orquestación (D-036): que revocar una conexión inexistente dé 404 (`conexion_desconocida`) y una ya revocada 200 (`sin_cambio`) se acepta; la orden la usa solo la persona por terminal, no es una vía entre clientes.
