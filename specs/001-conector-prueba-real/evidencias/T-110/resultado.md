# T-110 · Evidencia de integración (21/11/2026)

Aprobado por delegación D-036, 21/11/2026.

## Qué pasó
El código de T-110 (commits 2d0e7b8, 6a09c16 y 215a023 de la rama) entró en `main` dentro del commit e44def3 de la 020 por un incidente de índice compartido (ver `relevo.md`). No se reescribe el historial. Este commit añade lo que faltaba: dictámenes, correcciones de la vuelta corta y evidencia completa.

## Dictámenes
- Revisor, primera vuelta: APTO CON MENORES. Vuelta corta sobre 215a023: APTO CON MENORES (`revision-vuelta-correcciones.md`).
- Auditor-seguridad, primera vuelta: APTO CON CONDICIONES. Vuelta corta: APTO CON CONDICIONES con 1 MAYOR nuevo (una caída del almacén en `/oauth/autorizar` no llegaba a supervisión, art. 10) y 2 menores (`state` vacío, comentarios) (`auditoria-vuelta-correcciones.md`).
- Cierre: commit eaff1bb (ingeniero-backend) corrige el mayor (registro `error` y `enviarEvento`, con pruebas en GET y POST), el `state` no vacío y los comentarios; diseño C-2 ajustado. Leído por el orquestador.
- Condición abierta que no es código: regla de límite por IP del WAF de Vercel en `/oauth/*` (cupo global de `abrir_solicitud`), la pone la coordinación antes de T-117 y se comprueba en T-119.

## Evidencia (rama rebasada sobre main, copia `.claude/worktrees/t-110`, con el candado de suite)
| Comprobación | Resultado |
| --- | --- |
| `npx vitest run --maxWorkers=3` | 3069 en verde, 3 fallos por falta de memoria o tiempo (`vitest-completo.txt`) |
| Los 3 archivos fallidos, solos (`--maxWorkers=1`): `m06.test.ts`, `registro-clientes.test.ts`, `servidor.test.ts` | 120 de 120 en verde (`vitest-repeticion-3-archivos.txt`) |
| `npm run tipos` | 0 |
| `npm run estilo` | 0 |
| `npm run aislamiento` | 0 |
| `npm run arnes` | 0 |
| `npm run build` | 0 |

Los tres fallos de la suite completa son `RangeError: Array buffer allocation failed`, `PGlite failed to initialize` y un tiempo de espera de 60 s, todos con la máquina sin memoria; la repetición en serie los supera. No se ha ejecutado una segunda suite completa limpia.

## No comprobado
Comportamiento en navegador real y en Vercel (T-119); regla WAF; carreras reales de la base (PRUEBA-008 en `Nido`).
