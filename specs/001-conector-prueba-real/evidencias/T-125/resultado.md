# T-125 · Resultado (22/11/2026)

Ejecutada en la copia `.claude/worktrees/t-125`, rama `tarea/T-125`, con `node_modules` enlazado a la carpeta principal. Sin candado de suite: solo las pruebas de plataforma, sin la suite completa ni Playwright.

## Prueba delante

`npx vitest run tests/unit/plataforma/acciones-fijadas.test.ts --maxWorkers=1` con la prueba nueva y la configuración sin tocar: 2 fallos, 34 superadas (`vitest-rojo.txt`). Fallan «`* @multiserviagua-pixel` es la primera línea efectiva…» y «espera 7 días y abre como mucho 2 PR». La aserción del recorrido (`dependabot.yml` entre los archivos revisados) no podía cumplirse con el recorrido anterior, que solo leía `workflows/`; se cambió a la vez que la prueba, así que no consta una ejecución en rojo de esa aserción.

## Tras el cambio

| Orden | Código |
| --- | --- |
| `npx vitest run tests/unit/plataforma --maxWorkers=1` | 1 (27 archivos: 26 superados, 1 fallido; 535 pruebas superadas, 1 fallida, 9 omitidas) |
| `npx tsc --noEmit` | 0 |
| `npx eslint tests/unit/plataforma/acciones-fijadas.test.ts` | 0 |
| `node scripts/comprobar-specs.mjs` | 0 (SUPERADO; solo avisos de tamaño en specs ajenas) |

`acciones-fijadas.test.ts` pasa entero. El fallo es de `trazado.test.ts` («la traza de next build de /api/mcp…»): sin traza previa, esa prueba lanza `npx next build`, y en esta copia Turbopack no encuentra `next/package.json` porque `node_modules` es un enlace a otra carpeta, fuera de la raíz de la copia. No tiene relación con los archivos de T-125. Ese build lo lanzó la propia prueba y no se pidió. Falló antes de compilar; la carpeta `.next` que dejó, ignorada por git, se borró, y `AGENTS.md` no cambió.

Salidas en este directorio: `vitest-rojo.txt`, `vitest.txt`, `tipos.txt`, `estilo.txt`.

## Verificado en documentación oficial

En la referencia de opciones de Dependabot de GitHub (docs.github.com, consultada el 22/11/2026):
- `cooldown.default-days` está admitido para `github-actions`. Si no se pone, la espera por defecto es de 3 días.
- Ni la espera ni `open-pull-requests-limit` afectan a las actualizaciones de seguridad, que tienen su propio tope fijo de 10.
- El valor por defecto de `open-pull-requests-limit` es 5.

## No comprobado

- El comportamiento real en GitHub de CODEOWNERS (incluida la línea `*`), de Dependabot con `cooldown` y del tope de PR: no hay remoto ni push. CODEOWNERS no tiene efecto mientras una persona no active la revisión de propietarios en la protección de rama de `main`.
- `trazado.test.ts` en esta copia (ver arriba).
- El hallazgo 3 de la auditoría (clave YAML con escapes): fuera de alcance, porque no hay ningún parser YAML entre las dependencias directas de `package.json`.

## Vuelta atrás

`git revert` del commit de T-125. Restaura el CODEOWNERS sin `*`, el `dependabot.yml` sin espera ni tope y el recorrido limitado a `workflows/`.
