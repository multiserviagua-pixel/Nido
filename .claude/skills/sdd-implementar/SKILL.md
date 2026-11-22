---
name: sdd-implementar
description: Paso 5 del ciclo SDD. Encarga la implementación de una tarea T- al ingeniero que le corresponde, con la prueba delante, y comprueba el resultado. Úsala cuando una función esté PLANIFICADA o EN CURSO y queden tareas pendientes.
argument-hint: "[NNN-nombre de la función] [T-NNN opcional]"
---

# Implementar una tarea

Sale: el código y las pruebas de una tarea `T-NNN`, listos para revisión.

## Pasos

1. Si la función está PLANIFICADA, cámbiala a `Estado: EN CURSO`.
2. Elige la tarea: la indicada, o la primera `pendiente` cuyas dependencias estén `hecha`. Pueden ir varias a la vez solo si todas llevan `[P]`.
3. Marca la tarea `en curso` en `tareas.md`.
4. Encarga al agente que figura en la tarea (`ingeniero-bd`, `ingeniero-backend`, `ingeniero-frontend`, `disenador-ui`, `qa` o `plataforma`):
   - «Función NNN, tarea T-NNN», con el texto de la tarea.
   - Leer: la tarea, sus requisitos en `especificacion.md`, `diseno.md` y los contratos que toque.
   - Entregar: el cambio y sus pruebas. Prueba primero.
   - Antes de entregar (D-043): repasar la lista de su ruta (las skills `migracion-bd`, `herramienta-mcp` o `revision-privacidad` que toquen, y la regla de `.claude/rules/` de su ruta con sus «Lecciones de revisión») y decir en el informe, punto por punto, qué comprobó.
   - No tocar: nada fuera del alcance de la tarea; ni contratos, ni CI, ni secretos, ni otras tareas.
   - Informar: archivos tocados, qué prueba cubre cada requisito, comandos y resultados, lo no ejecutado, riesgos, vuelta atrás, y si toca una ruta crítica.
5. Comprueba tú:
   - Lee el cambio. Corresponde a la tarea y solo a ella.
   - El informe trae el repaso de la lista de su ruta. Si falta, devuélvelo antes de revisar.
   - Ejecuta las pruebas que el agente dice haber pasado.
   - `node scripts/comprobar-specs.mjs`.
6. Marca la tarea `en revisión` y sigue con `sdd-revisar`.

## Si falla

- Primer fallo: devuélvelo al mismo agente con el error concreto.
- Segundo fallo: repite con esfuerzo `high`.
- Tercero: sube al modelo del nivel superior y anótalo en la tabla de escalados de `tareas.md`.
- Si el fallo es del diseño o del contrato, no lo parchees: vuelve al `arquitecto`.

## No

- No implementes tú.
- No des una tarea por hecha aquí: falta la revisión.
- No aceptes «las pruebas pasan» sin haberlas ejecutado tú.
- No dejes que una tarea cambie un contrato o una decisión por su cuenta.
