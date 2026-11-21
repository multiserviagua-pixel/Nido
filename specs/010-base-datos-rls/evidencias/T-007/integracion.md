# T-007 · Evidencia de integración (21/11/2026)

Rama `tarea/010-T-007` rebasada sobre `main` (6d2bdcc), en su copia de trabajo, con candado de suite y `esperar-memoria.sh 4000` (4559 MB libres).

| Comprobación | Resultado |
| --- | --- |
| `npx vitest run --maxWorkers=2` (suite completa) | 105 de 106 archivos, 3325 de 3326 pruebas superadas |
| El fallo único | `tests/unit/plataforma/trazado.test.ts:135` ejecuta `next build` en la copia de trabajo, que no puede (junction a `node_modules`, raíz de Turbopack). No es de T-007; el `build` se comprueba en la carpeta principal tras el squash |
| `m08_m10`, `seed`, `seed-config` tras los arreglos de estilo | 3 archivos, 147 pruebas superadas |
| `npm run tipos` | 0 errores |
| `npm run estilo` | 0 avisos tras formatear `m08_m10`, `seed` y `seed-config` con Prettier (el formato de `m08_m10` coincide con el commit 2001742 de la fase 1) y quitar dos variables sin uso en `m08_m10` (sin cambio de comportamiento) |
| `npm run aislamiento` | 45 de 45 superadas |
| `node scripts/comprobar-specs.mjs` | SUPERADO |
| Build | pendiente en la carpeta principal tras el squash |
