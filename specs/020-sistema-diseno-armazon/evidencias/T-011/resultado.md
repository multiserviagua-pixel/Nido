# T-011 (a)(b)(c) · Resultado

Rama `tarea/020-T-011`, commit `82abe9d` (autor `disenador-ui`), 22/11/2026. Revisor: APTO CON MENORES (con T-012). Razonamiento de diseño en `propuesta-visual.md`.

## Qué entrega

(a) Paleta y escala sin cambios (ya cumplían); papel de velo `--sombra-velo` / `bg-velo` con sus pares en `PARES_CON_VELO`; umbral de 38 rem de la cabecera validado. (b) Pila del sistema, sin fuentes ni licencias. (c) Tres propuestas de logotipo (A, B, C) con tres SVG cada una y `logotipos.test.ts` (21 pruebas).

## Órdenes y resultado (ejecución final del 22/11/2026 sobre `ff33a8a`, con T-012)

| Orden | Código | Resultado |
| --- | --- | --- |
| `npx vitest run tests/unit/diseno --maxWorkers=2` | 0 | 31 archivos, 1098 pruebas en verde |
| `npm run tipos` | 0 | sin errores |
| `eslint` sobre `src` y `tests` | 0 | sin hallazgos |
| `npx playwright test --config playwright.config.ts` (oficial, puerto 3100, compila dentro; `tests/e2e` completo), Chromium, 1 worker | 0 | **939 ejecutadas sin fallo**, 0 saltadas, 0 intermitentes, 211 s |

No ejecutado: vitest completo (lo pasa la coordinación) y `npm run aislamiento` (no toca la base de datos).

## Menores del revisor (anotados, no bloquean)

1. `logotipos.test.ts:122-123` afirma lo que no mide (el extremo `#5B2BD6` del icono sobre la página oscura da 2,48:1): medir los 33 puntos de `FONDO_ICONO` o quitar la afirmación. 2. Icono de la propuesta A: ojo blanco sobre cabeza blanca, invisible; decírselo al responsable. 3. Sin prueba de navegador que ate `bg-velo` y los bordes de `CajonMenu` y `PanelModal` a los pares del velo (abrir cajón y panel y medir overlay y borde). 4. Nombre contradictorio en `contraste.test.ts:372`. 5. Comentario de `Maquetas.tsx:5` («el menú y los iconos sí son los reales»). 6. `propuesta-visual.md:86` apunta a T-013 para el velo real: debe apuntar a la prueba del punto 3. 7. `stroke-width` con ruido de coma flotante (`4.800000000000001`, `5.6000000000000005`) en los SVG de C y en `logotipos.ts`. 8. Esta evidencia faltaba (ya está). 9. La maqueta de superadmin entre 1024 y 1279 px no muestra menú ni botón: mirar la propuesta a 1280 px o más.

## Saldo de los menores en T-015 (23/11/2026)

El responsable eligió el logotipo C (22/11/2026): **solo se arregla el elegido; los menores de A y B se retiran** (el 2, que es de A, no se arregla; los SVG de A y B se conservan como registro de la propuesta).

| Menor | Saldo |
| --- | --- |
| 1 | Arreglado: `logotipos.test.ts` mide los 33 puntos del degradado del icono sobre la página clara y deja dicho (y fijado) que sobre la oscura solo llega el extremo claro (2,48:1 el oscuro) |
| 2 | Retirado (propuesta A) |
| 3 | Sigue abierto (no es de logotipo ni de valores): falta una prueba de navegador que mida overlay y borde del cajón y del panel |
| 4, 5 | Siguen abiertos (nombre en `contraste.test.ts:372`, comentario de `Maquetas.tsx:5`): no son de logotipo ni de valores |
| 6 | Arreglado: `propuesta-visual.md` ya no apunta a T-013 para el velo real |
| 7 | Arreglado en los tres SVG de C y en `logotipos.ts` (`4.8` y `5.6`); los de A y B no tenían ruido |
| 8, 9 | Sin cambio (9 es una limitación de la maqueta) |

