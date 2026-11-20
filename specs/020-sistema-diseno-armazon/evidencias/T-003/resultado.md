# Evidencia de T-003 (020): fronteras, comprobación estática y control de acceso de la muestra

- Fecha: 20/11/2026
- Entorno: Windows 11, Node 26.13.0, npm 11, Vitest 5.1.0; sin Docker, sin navegador, sin compilación con cada `ENTORNO`.
- Commit: el de la rama `tarea/020-T-003` que contiene este archivo (`git log -1 -- specs/020-sistema-diseno-armazon/evidencias/T-003/resultado.md`).
- Datos de prueba: ficticios (árboles temporales con nombres inventados; hosts `.invalid` y `example`).

| Prueba | Parte | Comando | Resultado |
| --- | --- | --- | --- |
| PRUEBA-008 | Fronteras sobre el grafo (T-003 a) | `npx vitest run tests/unit/diseno/fronteras.test.ts` | Superada: `src/` sin hallazgos; los fallos sembrados de la segunda y la tercera vuelta detectados (R1 transitiva por puentes y reexportaciones, `await` obligatorio, reexportaciones y archivos `use server` sin entradas, metadatos de ruta y `generateMetadata` en la muestra); excepciones = las tres del diseño |
| PRUEBA-008 | Iconos en `LICENCIAS.md`, SVG del logotipo, inventario igual al de la muestra | — | No ejecutada: los archivos no existen (T-006, T-007, T-005) |
| PRUEBA-036 | Comprobación estática, cuatro archivos sembrados (T-003 b) | `npx vitest run tests/unit/diseno/estatica-pruebas.test.ts` | Superada: los cuatro fallan, las formas prohibidas se ven (incluye `testInfo.fail()`, `test.info().fail()`, `const { skip } = test` y `describe.configure({ retries })`), lo legítimo no falla, los archivos reales están limpios |
| PRUEBA-036 | Tres candidatos en copia de prueba; baja de la cuenta respecto de `main` | — | No ejecutada: depende de la 002 (diseño, PRUEBA-036) |
| PRUEBA-037 | Lista de paquetes de cliente (T-003 b) | `npx vitest run tests/unit/diseno/paquetes-de-cliente.test.ts` | Superada: lista declarada (vacía) = lista del grafo y el bloqueo (vacía); un paquete nuevo la hace fallar |
| PRUEBA-037 | Navegador de prueba alterado | — | No ejecutada: depende de la 002 |
| PRUEBA-024 | Control 1 con los cinco valores de `ENTORNO` sobre `next.config.ts` (T-003 c) | `npx vitest run tests/unit/diseno/acceso-muestra.test.ts` | Superada (parte negativa y estructura de archivos) |
| PRUEBA-024 | Control 1 positivo (desarrollo y preproduccion abren) | ídem | NO APLICABLE AÚN: `next.config.ts` no declara la muestra (T-004). No ejecutada |
| PRUEBA-024 | Control 2 en cada punto de entrada, Host y X-Forwarded-Host falsificado, control positivo, sobre la muestra real | ídem | NO APLICABLE AÚN: no existe `src/app/muestra/` (T-005). No ejecutada |
| PRUEBA-024 | Mismo recorrido contra una muestra sembrada (correcta y doce defectos) | ídem | Superada: la correcta no da fallos (también con `default` comprobado); los doce defectos se ven |
| PRUEBA-024 | Compilación con cada `ENTORNO`, inventario de rutas, `/muestra` y `/muestra/valores` = 404, cadena testigo en la salida; nombre de servidor en Vercel; producción | — | No ejecutada: pide compilación, T-004/T-005 y la 002 |

Archivos de salida:

- `verificar.txt`: `npm run verificar` completo en la copia de trabajo (16 archivos, 426 pruebas en verde, termina con «SALIDA: 0»; sin timeouts). Recuento honesto: de las 426, 5 son «NO APLICABLE AÚN» y NO se han ejecutado de verdad (solo avisan; no prueban nada): el control 1 positivo y los cuatro de control 2 sobre la muestra real. Por tanto 421 pruebas con comprobación real y 5 sin ejecutar.
- `diseno-detalle.txt`: las 196 pruebas de `tests/unit/diseno` (191 con comprobación real y 5 «NO APLICABLE AÚN», todas con la marca en el nombre) con el informe detallado y los avisos «NO EJECUTADA».
- `mutacion-tercera-vuelta.txt`: mutaciones de la tercera vuelta (reexposiciones, `generate*` extra, `default` de `use server`, alias de `expect`; y enumeración de acciones solo estática en control 2): 15 pruebas fallan en fronteras y estática y 4 en el control 2. Las pruebas nuevas pueden fallar.
- `mutacion-reglas-neutralizadas.txt` (de la segunda vuelta, sin regenerar): la misma batería con las reglas R1, R4/R8 y R7 de fronteras y la detección de la comprobación estática neutralizadas a propósito: 89 pruebas fallan (2 archivos). Las pruebas pueden fallar.

## Segunda vuelta (dictamen NO APTO sobre f67c501)

Corregidos, cada uno con su caso sembrado visto primero en rojo: M-1 (R1 transitiva: cada origen sigue puentes fuera de `src/lib/` y exige excepción válida para sí mismo), M-2 (`await comprobarAccesoMuestra()` obligatorio como primera instrucción), M-3 (reexportación en `use server` de la muestra y archivo `use server` sin entradas analizables: hallazgo en la regla R7 y fallo en el recorrido de control 2), M-4 (`fail`/`fails` con cualquier raíz salvo `expect` y `assert`, incluidas cadenas con llamadas), M-5 (marca y recuento honesto). Menores: m-1 (carpetas temporales en `node_modules/.cache`), m-2 (metadatos de ruta y `generateMetadata` en la muestra), m-4 en parte (extensiones `.cjs`/`.cts`/`.jsx`, `const { skip } = test`, `describe.configure({ retries })`), m-8 (la prueba del grafo ya no depende de `src/app/api/salud/route.ts`).

## Tercera vuelta (dictamen NO APTO sobre fc732df)

Cada caso sembrado se vio primero en rojo con el código anterior de `apoyo/` (17 pruebas fallaban) y luego en verde.

- M-6: R7 enumera todas las exportaciones de un archivo `use server`, también las de por defecto (`export default ident`, `export { x as default }`, `export default async () => ...`, `export default function`), y las desestructuradas; `{ x as default }` ya no devuelve el nombre local. El recorrido de control 2 enumera las acciones con `Object.keys` del módulo cargado (incluido `default`), no por análisis estático; una exportación que no es función falla («no exporta la función default»). Sembrados en `fronteras.test.ts` (cuatro formas mixtas y valor por defecto no función) y en los defectos de `acceso-muestra.test.ts` (tres formas mixtas, valor por defecto no función, archivo sin exportaciones), más el caso positivo con `default` comprobado.
- m-a: `expect` y `assert` solo se eximen si no son alias de un ejecutor (`import { test as expect }`, `import * as expect`, `const expect = test`).
- m-b: `const { fail } = test`, `const { fails } = it` y desestructuración anidada se detectan; `const { fail } = expect` (aserción real) no.
- m-d: un origen con excepción (`acceso-muestra.ts`, `muestra/servidor/`) no puede reexponer lo exceptuado: `export { x } from`, `export { x as e }` de algo importado, `export default x` o `export const y = x` dan hallazgo «R1 reexpone src/lib desde un origen exceptuado». Las excepciones para cualquier origen (`referencia.ts`) quedan fuera de la regla.
- m-e: R7 ve también `generateViewport`, `generateImageMetadata` y `generateSitemaps` (declarados o con `export { }`) en páginas y capas de la muestra.
- m-f: `verificar.txt` regenerado con el código de salida real al final.

## Lo que no cubre (límites conocidos)

- m-3: no se restringe qué nombres importa `acceso-muestra.ts` de `configuracion.ts` (solo el archivo, no la función). Hace falta conocer el nombre de la función que devuelve el entorno, que aún no existe, y el cambio iría en `excepciones.ts`, protegido por el «sí» del responsable.
- m-4: un alias de `violations` (`const v = r.violations; v.filter(...)`), `Array.prototype.filter.call(violations, ...)`, importaciones dinámicas con texto no literal y `annotations.push({ type: "skip" })` no se ven en la comprobación estática.
- m-5: el grafo de dependencias no desarrolla `next`, `react`, `react-dom` ni las dependencias opcionales, y el `jsx-runtime` es implícito (no aparece como importación).
- m-6: `clasificarAccion` da por cerrada una acción que devuelve `undefined`, aunque no haya llamado a `notFound()` (una acción que no comprueba y no devuelve nada se vería cerrada; la regla R7 estática sí exige la comprobación).
- m-7: falta el caso positivo de `pre-nido.<dominio>` (control positivo de un host real de preproducción); no se puede escribir sin el dominio definitivo.
- m-d (resto): la regla de reexposición sigue alias directos; formas indirectas (`export const y = { x }`, funciones que envuelven `x`) no se siguen.
- m-a/m-b (resto): alias por asignación posterior (`let expect; expect = test`) y desestructuración en parámetros de funciones no se ven con exactitud.
- En `use server` de la muestra se cierra en fallo ante cualquier reexportación, aunque la acción reexportada sí comprobase el acceso: se prefiere un falso positivo.
- Sigue sin ejecutarse todo lo marcado «NO APLICABLE AÚN» y lo que depende de la compilación, T-004/T-005 y la 002.
