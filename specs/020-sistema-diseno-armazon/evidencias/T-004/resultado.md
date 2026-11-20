# T-004 (020) · Muestra fuera de producción al compilar: evidencias

Fecha: 20/11/2026. Rama `tarea/020-T-004` desde `main` (d0ba2b0). Agente: `plataforma`. Ruta crítica y reservada: pendiente de `revisor` y `auditor-seguridad`.

## Qué se cambió

- `next.config.ts`: `pageExtensions` vale `["tsx", "ts", "jsx", "js"]` (las de Next por defecto) y solo añade `muestra.tsx` si `leerEntorno()` devuelve `desarrollo` o `preproduccion`. Si `leerEntorno()` lanza, la muestra queda fuera y la configuración carga igual. `next.config.ts` no lee `process.env`. Las cabeceras no cambian.
- `src/lib/plataforma/configuracion.ts`: nueva `leerEntorno(): Entorno | undefined`, el nombre que ya usan los árboles sembrados de T-003 (`tests/unit/diseno/apoyo/arbol-limpio.ts`). Lee solo `ENTORNO` y no valida el resto del grupo. Devuelve el valor exacto de la lista. `desarrollo` exige además el predicado único que ya existía (sin `VERCEL*` y `NODE_ENV` distinto de `production`). En cualquier otro caso devuelve `undefined`.
- `tests/unit/plataforma/extensiones-muestra.test.ts` (nuevo, 29 casos). Se subió primero en rojo (commit e7b4494, 29 de 29 fallaban) y después pasó a verde.

### Decisión que deben revisar `revisor` y `auditor-seguridad`

No se usa `cargarConfiguracion()` porque, fuera de `desarrollo`, exige `SUPERVISION_DSN`, `COMMIT_DESPLEGADO`, `VERCEL` y `VERCEL_ENV`. Con ella, la compilación local con `ENTORNO=preproduccion` (`playwright.config.ts`, T-002) y el caso positivo de T-003 dejarían la muestra siempre cerrada. `leerEntorno()` solo puede cerrar: nunca abre con un valor que no sea exacto.

Una consecuencia: como `next build` y `next start` fuerzan `NODE_ENV=production`, con `ENTORNO=desarrollo` la muestra solo entra con `next dev`. En las compilaciones entra solo con `preproduccion`.

## Comandos (código de salida real)

| Orden | Salida | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/plataforma/extensiones-muestra.test.ts` (antes del cambio) | 1 | 29 de 29 en rojo |
| `npm run tipos` | 0 | |
| `npm run estilo` | 0 | prettier y eslint sin avisos |
| `npx vitest run --maxWorkers=3` | 0 | 51 archivos, 1186 pruebas en verde |
| `node scripts/comprobar-specs.mjs` | 0 | SUPERADO |
| `npm run build` (sin `ENTORNO`, árbol limpio) | 0 | rutas `/`, `/_not-found`, `/api/salud` |

## PRUEBA-024, control 1

- El caso de T-003 «con desarrollo y preproduccion la muestra sí entra (control positivo)» ya se ejecuta y está en verde: `T004_HECHA` es verdadero.
- El caso «con los cinco valores de la prueba y otros desconocidos» sigue en verde.
- Siguen «NO APLICABLE AÚN» los cuatro casos del control 2 que esperan a que exista `src/app/muestra` (T-005). No se han tocado.

### Compilación real con una muestra temporal

Se crearon dos archivos temporales, fuera de los commits: `src/app/muestra/page.muestra.tsx` y `valores/page.muestra.tsx`, que importan `_datos/testigo.ts` con la cadena `TESTIGO-T004-MUESTRA-7f3a`. Se borraron al terminar.

| `ENTORNO` en `next build` | Salida | Rutas `/muestra` | Archivos de `.next` con la cadena testigo |
| --- | --- | --- | --- |
| `produccion` | 0 | 0 | 0 |
| `Produccion` | 0 | 0 | 0 |
| `produccion ` | 0 | 0 | 0 |
| `prod` | 0 | 0 | 0 |
| sin valor | 0 | 0 | 0 |
| `desarrollo` (en compilación) | 0 | 0 | 0 |
| `preproduccion` | 0 | `/muestra`, `/muestra/valores` | 4 |

Esto resuelve el «no verificado» del diseño (§Cómo no existe en producción): en Next.js 16.4.6, `pageExtensions` sí excluye rutas del directorio `app`. El control 1 es una capa real.

### Servido

| Modo | `/muestra` | `/muestra/valores` | Dirección inexistente |
| --- | --- | --- | --- |
| `next start`, compilación `produccion` | 404, sin testigo | 404 | 404. El cuerpo es igual al de `/muestra` tras quitar las huellas hexadecimales |
| `next start`, compilación `preproduccion` | 200, con testigo | 200 | 404 |
| `next dev`, `ENTORNO=desarrollo` | 200, con testigo | 200 | 404 |
| `next dev`, `ENTORNO=produccion` | 404 | 404 | 404 |

En modo desarrollo, el cuerpo del 404 de `/muestra` no es idéntico al de la dirección inexistente; no se investigó. No afecta a producción.

## No comprobado

- El control 2 y el control positivo sobre la muestra real: van con T-005.
- La compilación en Vercel y la parte de producción: van con T-021, T-022 y la 002.
- La igualdad byte a byte de los cuerpos 404: solo se comparó tras quitar las huellas hexadecimales.

## Incidencias

- `next dev` añadió por su cuenta un bloque a `AGENTS.md`. Se revirtió y no está en el commit.
- Un primer intento de servir reutilizó el puerto del servidor anterior, que seguía vivo, y dio un falso 404 en preproducción. Se descartó y se repitió con un puerto por modo, parando cada servidor por su PID. Los resultados de arriba son los de la repetición.

## Vuelta atrás

`git revert` de los dos commits de T-004. `pageExtensions` vuelve al valor por defecto y la muestra queda fuera de cualquier compilación, que es el lado seguro.
