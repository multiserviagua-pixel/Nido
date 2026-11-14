---
name: sdd-disenar
description: Paso 3 del ciclo SDD. Produce el diseño técnico de una función aprobada, con sus contratos, sus amenazas y la comprobación de la constitución. Úsala cuando una función esté en estado APROBADA.
argument-hint: "[NNN-nombre de la función]"
---

# Diseñar

Sale: `specs/NNN/diseno.md`, contratos nuevos o cambiados en `contratos/`, ADR si cambia una frontera. La función pasa a DISEÑADA.

## Pasos

1. Comprueba que la especificación está APROBADA. Si no, vuelve a `sdd-aclarar`.
2. Mira qué decisiones de `docs/TECNOLOGIAS.md` necesita la función. Las que estén en VERIFICAR se resuelven antes con la skill `verificar-decision`.
3. Encarga al agente `arquitecto`:
   - Leer: la carpeta de la función, `docs/ARQUITECTURA.md`, `docs/SEGURIDAD.md`, `docs/ESQUELETO.md`, `docs/MODELO-DATOS.sql`, los ADR y las decisiones que apliquen.
   - Entregar: `specs/NNN/diseno.md` con la plantilla completa; contratos; ADR si hace falta.
   - No tocar: código, `specs/NNN/especificacion.md`, constitución, registro de decisiones.
4. Encarga al agente `auditor-seguridad` las amenazas del diseño. Dale el `diseno.md`, no un resumen. Pide la tabla de amenazas con control y prueba, y los hallazgos con gravedad.
5. Devuelve los hallazgos al `arquitecto` para que corrija el diseño. Repite hasta que no haya BLOQUEANTES.
6. Comprueba tú:
   - La tabla de la constitución está completa, artículo por artículo, sin incumplimientos.
   - Ninguna entrada acepta un identificador de cliente; todas las entradas son listas cerradas.
   - Cada dependencia nueva tiene motivo, versión y fuente.
   - Los contratos son JSON válido y coinciden con lo que dice el diseño.
   - Hay vuelta atrás para datos y despliegue.
7. Cambia `Estado: DISEÑADA` y ejecuta `node scripts/comprobar-specs.mjs`.
8. Sigue con `sdd-planificar`.

## No

- No diseñes tú: el diseño es del `arquitecto`.
- No aceptes un diseño «para salir del paso»: es un producto final (artículo 10).
- No cambies un contrato sin que quede reflejado en `contratos/`.
