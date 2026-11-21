# 021 · Revisión de plan y tareas (revisor, 21/11/2026; resumida por el orquestador)

Resultado: 0 bloqueantes, 5 mayores y 18 menores. Comprobado por el revisor: 83 REQ y 35 CA con tarea; cada PRUEBA 001–055 (sin 036–040) con tarea; dependencias externas existen; sin ciclos explícitos; 18 tareas.

## Mayores (corregidos por el arquitecto el 21/11; sin ver aún por el revisor)
1. A-15 no cabe en D-036 (contradice aclaraciones.md:73): pasa a reservada al responsable.
2. Evidencias y escáner sin cubrir tokens de enlaces (T-003, T-015, T-016, patrón nuevo en T-017).
3. Falta T-012 (b) → T-006 (d).
4. La regla «qué prueba bloquea» dejaba sin bloquear la prueba R de T-018 (M-19).
5. Parte «por forma» de T-017 sin dueño y con ciclo implícito: separada como T-017 (b).

## Menores
Corregidos: 1, 2, 3, 4, 5, 9, 16, 18. **Pendientes (texto íntegro):**
- **6.** m-43 sin hacer: A-13 y A-15 no constan en `docs/TECNOLOGIAS.md` (coordinación).
- **7.** `tareas.md` T-018: dice que S-6 «necesita diseño y dictamen antes de P1», pero P1 se anota ahora; la nota de P1 debe decir que excluye S-6 y que, si aparece, se reabre el diseño.
- **8.** T-010 (b) escribe PRUEBA-020, 033 y 051 (en navegador) aunque la convención dice que las escribe `qa` en T-011: dejar constancia de excepción o pasarlas a T-011.
- **10.** T-009 no cita PRUEBA-048 «en verde», aunque sus funciones de disparador entran en la regla de T-007.
- **11.** Tabla de tareas de persona de `plan.md` incompleta: faltan T-009 y T-018.
- **12.** `diseno.md` ≈40,1 KB (D-023/D-031); `especificacion.md` 52 KB y T-005 la amplía: T-005 debe decir cómo aplica D-031.
- **13.** T-008 (36 REQ), T-012 (31 REQ, ~16 archivos) y T-011 (~25 pruebas) son grandes: valorar partirlas (T-008 en canal y operaciones; T-012 en (a)-(b) y (c)-(d)).
- **14.** Dependencia de la 024: citar I-42 a I-44 de `specs/024-auditoria/diseno.md`:324 y una fila en «Lo que bloquea».
- **15.** Encargado de tratamiento sin tarea: Google Workspace trata las direcciones de los administradores; ninguna tarea actualiza la lista de encargados (052 / `SEGURIDAD.md`).
- **17.** `@supabase/supabase-js` 2.119.0 sin entrada en `docs/TECNOLOGIAS.md` (coordinación).
