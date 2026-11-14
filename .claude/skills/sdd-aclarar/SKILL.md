---
name: sdd-aclarar
description: Paso 2 del ciclo SDD y puerta P0. Resuelve con el responsable las cuestiones abiertas de una especificación y le pide que la apruebe. Úsala cuando una función esté en estado PROPUESTA.
argument-hint: "[NNN-nombre de la función]"
---

# Aclarar y aprobar la especificación

Sale: `specs/NNN/aclaraciones.md` y, si el responsable aprueba, la especificación en estado APROBADA.

## Pasos

1. Lee `especificacion.md` y reúne las cuestiones abiertas. Añade las que veas tú: contradicciones con el plan, con la arquitectura o con la constitución; requisitos ambiguos; criterios sin umbral.
2. Descarta las que puedas resolver leyendo el repositorio o el registro de decisiones. Lo que quede es lo que solo el responsable puede decidir.
3. Pregunta al responsable. Pocas preguntas cada vez, cada una entendible por sí sola, con las opciones y su consecuencia. Si recomiendas una, dilo.
4. Anota cada respuesta en `aclaraciones.md` (plantilla en `specs/_plantillas/`): cuestión, respuesta literal, quién y cuándo, efecto en la especificación.
5. Aplica los efectos en `especificacion.md`: requisitos y criterios nuevos o cambiados. Si son muchos, encárgaselo al `especificador`.
6. Si una respuesta es una decisión del proyecto, anótala en `docs/TECNOLOGIAS.md` con su identificador y estado CONFIRMADO.
7. **Puerta P0**: presenta al responsable un resumen de una pantalla (para qué, requisitos clave, criterios, fuera de alcance) y pídele que apruebe.
8. Solo con su aprobación expresa: cambia `Estado: APROBADA`, rellena la tabla de aprobación con fecha y ejecuta `node scripts/comprobar-specs.mjs`.

## No

- Una respuesta supuesta no vale. Si no hay respuesta, la cuestión sigue abierta y la función sigue en PROPUESTA.
- No conviertas una recomendación tuya en una decisión.
- No pases a diseñar sin la puerta abierta.
