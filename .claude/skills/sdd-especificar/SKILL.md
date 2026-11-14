---
name: sdd-especificar
description: Paso 1 del ciclo SDD. Crea o completa la especificación de una función (requisitos REQ-, casos negativos, criterios de aceptación CA-). Úsala cuando haya que empezar una función nueva del plan o completar un borrador de especificación.
argument-hint: "[NNN-nombre de la función]"
---

# Especificar

Sale: `specs/NNN-nombre/especificacion.md` en estado PROPUESTA.

## Pasos

1. Comprueba en `docs/PLAN.md` a qué fase pertenece la función y qué criterios de la fase debe cubrir. Especificar y diseñar puede ir en paralelo con otras fases; implementar, solo cuando se cumplan las dependencias de la fase (tabla «Reparto en chats» del plan).
2. Elige el número: el siguiente libre dentro del rango de `specs/` de la fase (misma tabla). Nombre corto, en minúsculas y con guiones.
3. Encarga al agente `especificador`:
   - Leer: `docs/PLAN.md` (la fase), `docs/ARQUITECTURA.md`, `docs/SEGURIDAD.md`, las decisiones de `docs/TECNOLOGIAS.md` que apliquen, y el borrador si existe.
   - Entregar: `specs/NNN-nombre/especificacion.md` con la plantilla `specs/_plantillas/especificacion.md`.
   - No tocar: nada fuera de `specs/`.
4. Lee el resultado y comprueba:
   - Cada requisito dice qué, no cómo, y se puede probar.
   - Hay casos negativos: token de otro cliente, campos de más, repetición, concurrencia, servicio caído, permisos insuficientes.
   - Cada `REQ-` aparece en al menos un `CA-`.
   - Los artículos 1, 2 y 3 de la constitución están convertidos en requisitos concretos.
   - Hay apartado «Fuera de alcance» y las cuestiones abiertas están sin contestar.
5. Ejecuta `node scripts/comprobar-specs.mjs`.
6. Sigue con `sdd-aclarar`.

## No

- No aceptes una especificación de más de unos 20 requisitos o 5 cuestiones abiertas: divide la función o devuélvela al `especificador`.
- No apruebes la especificación: eso es la puerta P0.
- No contestes tú las cuestiones abiertas.
- No dejes que entren decisiones técnicas (librerías, tablas, rutas): son del diseño.
