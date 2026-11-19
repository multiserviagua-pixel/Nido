# 002 · Dictamen de seguridad del diseño (segunda vuelta)

Autor: `auditor-seguridad` · Fecha: 19/11/2026 · Sobre: `diseno.md`, tercera versión (19/11/2026). Transcrito por el orquestador, porque el auditor es de solo lectura. Las líneas citadas son las de esa versión.

**Veredicto: APTO CON CONDICIONES.** Sin bloqueantes; 6 mayores y 6 menores. Los 22 hallazgos de la primera vuelta están cerrados en el diseño, cada uno con su prueba. Cuatro dependen de aceptaciones escritas del responsable que aún no existen: A-1, A-3, A-4 y A-14 d. Mientras falten esas aceptaciones y las correcciones de los mayores 1 a 6, P1 no debe abrirse por delegación.

Ejecutado por el auditor: `node scripts/comprobar-specs.mjs` (SUPERADO), `npm view` de cada paquete, `git remote -v`, `git ls-remote` (no devolvió ramas ni etiquetas; causa sin averiguar).

## Cierre de la primera vuelta

| Hallazgo | Dónde se resuelve | PRUEBA- | Estado |
| --- | --- | --- | --- |
| B1 | Origen del código (l. 95-101); comprobación 10 (l. 145) | 017 | Cerrado; alcance real en MAYOR 1 |
| B2 | Órdenes de la persona (l. 153-157) | 020, 021 | Cerrado como «dificulta, no impide»; producción condicionada a A-3. Ver MAYOR 4 |
| B3, M10 | Reservadas y comparación (l. 138, 141) | 018 | Cerrado |
| M1, M2 | Batería y suministro (l. 123, 127) | 005-007 | Cerrado; resto en m-4 |
| M3 | Credenciales (l. 193, 198) | 031 | Cerrado, con el límite declarado |
| M4, M5 | Secretos y copia (l. 127, 229) | 009, 010 | Cerrado; falta `github_pat_` (MAYOR 5) |
| M6 | Declaraciones (l. 149) | 019 | Cerrado |
| M7 | Regla de errores (l. 173) | 046, 047 | Cerrado en el código; A-1 mal tramitada (MAYOR 6) |
| M8 | Asunto A-4 | 050 | Falta aceptación del responsable |
| M9 | Sello, verificador y copia (l. 98, 229) | 023 | Cerrado |
| m-a a m-i | l. 333 | 012, 038, 014, 006, 045, 050, 021 | Cerrados; m-f depende de A-14 d |

## Hallazgos

| N.º | Hallazgo | Artículo | Gravedad | Apartado que corregir |
| --- | --- | --- | --- | --- |
| 1 | Evidencia de batería solo declarada; producción no la repite | 13, 3 | MAYOR | Esqueleto (`control`), Integración, Despliegue |
| 2 | El arranque entra en `main` sin revisión ni dictamen | 6 | MAYOR | Orden de construcción, Arranque |
| 3 | `delegacion` cubre más que D-019; vigencia falsificable | 14, 13 | MAYOR | Integración (de puerta), Delegación |
| 4 | `aceptacion-riesgo` sin asunto; `cuenta-separada` sin condiciones comprobables | 3, 14 | MAYOR | Aprobaciones, Órdenes de la persona, Orden de construcción |
| 5 | Credencial de GitHub fuera del inventario; subida al remoto no forzada | 4, 3, 14 | MAYOR | Copia y remoto, Credenciales, Secretos |
| 6 | A-1 es aceptación de riesgo y gasto, tramitada por delegación | 13, 14 | MAYOR | Asuntos y pendientes, Supervisión |
| m-1 | `--solo` sin reglas de salida ni de evidencia | 13 | MENOR | Batería |
| m-2 | «`x-vercel-id` con `arn1`» se cumple con la función en otra región | 3 | MENOR | Despliegue, paso 6 |
| m-3 | Campo `transaction` del evento de Sentry no fijado | 1 | MENOR | Supervisión |
| m-4 | Restos que permiten rebajar la batería | 3 | MENOR | Batería, Integración |
| m-5 | «Altas firmadas» ambiguo | 14 | MENOR | Integración, Aprobaciones |
| m-6 | `aclaraciones.md` (l. 152) contradice la línea 151 del diseño | 13 | MENOR | Coordinación |

### MAYOR 1. Evidencia de batería solo declarada; producción no la repite
- **Dónde:** l. 54-55, 143-145, 202-215; amenaza A-16; REQ-006, 008, 016.
- **Cómo se explota:** `npm run control` toma la línea `control` del `package.json` de la copia de trabajo y resuelve `git show main:`. Se puede ejecutar otro código con una etiqueta `main` (git busca antes en `refs/tags`), un `NODE_OPTIONS` de usuario o editando la línea `control`. Ese código escribe un `bateria.md` «SUPERADA» y mueve `main`; también con `git update-ref` y un M a mano. La comprobación 10 solo valida la forma del archivo. Así entra un cambio no reservado que falla pruebas o escáner y llega a preproducción y, promovido, a producción. «Mover `main` a mano se detecta» (l. 101) no se cumple para lo no reservado.
- **Corrección:** `desplegar produccion` y `sellar` repiten la batería completa con el control sellado, en un clon limpio, antes de pedir nada. `control` usa `refs/heads/main` y `git -c core.fsmonitor=false --no-pager`. El diseño declara que las órdenes de control lanzadas por agentes no son barrera: su batería solo vale como evidencia si la repite una orden sellada o el CI de la 003.
- **Prueba:** M a mano con prueba que falla y `bateria.md` copiado de otro M: `desplegar produccion` se niega (doble de la CLI). Con etiqueta `main` sembrada, `control` sigue ejecutando el lanzador de `refs/heads/main`.

### MAYOR 2. El arranque entra en `main` sin revisión independiente
- **Dónde:** l. 89-91. Todo el código de control llega con el ancla; solo hay `bateria:propia` (autoevaluación) y el responsable firma `ancla` sobre código que no puede revisar entero. Rutas críticas exigen `revisor` y `auditor-seguridad`.
- **Corrección:** cada T del arranque lleva `revision.md` y `dictamen.md` en `evidencias/arranque/`; `ancla` cita sus huellas; `comprobar-inicio` y `sellar` comprueban que existen.
- **Prueba:** un ancla sin el dictamen de una T: la comprobación 10 lo nombra y `sellar` se niega.

### MAYOR 3. `delegacion` cubre más que D-019; vigencia falsificable
- **Dónde:** l. 139, 149, 151. D-019 delega decidir cuestiones abiertas y abrir P0, P1 y P7 en las fases 1 y 3; P7 solo «cuando todos los CA tengan evidencia real».
- **Fallos:** a) entra «editar, borrar o renombrar una especificación aprobada», incluida la 002; b) no se dice cómo se pasa de fase a especificación (si se deduce de `docs/PLAN.md`, no reservado, un agente puede mover una especificación a una fase delegada); c) la cita «decidido por delegación (D-019)» es texto libre que el mismo agente añade a `aclaraciones.md`; d) la caducidad se compara con la fecha del commit, falsificable, y con la de hoy deja la comprobación 10 en rojo para siempre; e) la condición de P7 no se comprueba.
- **Corrección:** `delegacion` enumera carpetas de especificación, no fases. Solo cubre cambios de `Estado:` de P0, P1 y P7; editar, borrar o renombrar una aprobada sigue necesitando firma. Vigencia por posición en la línea de primeros padres (desde el commit que cita `delegacion` hasta una `fin-delegacion` firmada o un `integrado/NNNN` máximo), nunca por fechas. `CERRADA` por delegación exige `comprobar-specs` verde y evidencia por CA.
- **Prueba:** ampliar PRUEBA-018: se rechazan especificación fuera de lista, commit con fecha retrasada, borrado de una aprobada y `CERRADA` con un CA sin evidencia.

### MAYOR 4. `aceptacion-riesgo` sin asunto; `cuenta-separada` sin condiciones comprobables
- **Dónde:** l. 89, 149, 157, 204, 326.
- **Fallos:** a) campos «tipo, commit, fecha»: sin `asunto`, una aceptación vigente de A-4 o A-14 d también desbloquea producción; b) `cuenta-separada` no dice qué declara (si la cuenta de los agentes es administradora o lee el perfil del responsable, no sirve); c) la clave se crea en el paso 0, antes de separar cuentas, dentro de la cuenta de los agentes.
- **Corrección:** `aceptacion-riesgo` lleva `asunto` de lista cerrada (A-1, A-3, A-4, A-14 d) y caducidad; producción exige `asunto = A-3`. `cuenta-separada` enumera: la cuenta de los agentes no está en Administradores; no lee la carpeta sellada ni `~\.ssh` del responsable; Claude Code no corre en la cuenta del responsable; `comprobar-inicio` lo comprueba desde la cuenta de los agentes. La clave se crea tras separar cuentas o se rota con firma y se vuelve a firmar el ancla.
- **Prueba:** con A-4 aceptada y vigente pero sin A-3, producción se niega. Desde la cuenta de los agentes, leer la clave da acceso denegado (con persona).

### MAYOR 5. Credencial de GitHub fuera del inventario; subida al remoto no forzada
- **Dónde:** l. 191-198, 229, 314; D-022 y T-019.
- **Cómo se explota:** la sesión de `gh` tiene alcance de cuenta y no está en la tabla de credenciales. Nada obliga a «solo `main` e `integrado/*`», «solo coordinación» ni «tras `--historial`»: `git push origin tarea/…` sube un candidato rechazado con un secreto; `gh repo edit --visibility public` publica el diseño de seguridad y el prompt, irreversible (D-022). `patrones-secretos.mjs` reconoce `gh[pousr]_` pero no `github_pat_`.
- **Corrección:** orden `subir-copia` (de la persona o sellada) con referencias explícitas `refs/heads/main` y `refs/tags/integrado/*`, sin `--force`, `--all`, `--tags` ni `--mirror`, con batería `--historial` en la misma ejecución. Token de grano fino limitado a `Nido`, escritura de contenidos y sin administración, en DPAPI. Cerrar la sesión de `gh` de alcance de cuenta en la cuenta de los agentes. Fila en la tabla de credenciales y patrón `github_pat_`.
- **Prueba:** subir `tarea/*` o una etiqueta no `integrado/*` se rechaza. El token no puede cambiar la visibilidad (con persona). Un canario `github_pat_` hace fallar la comprobación 6.

### MAYOR 6. A-1 es aceptación de riesgo y gasto, tramitada por delegación
- **Dónde:** diseño l. 185, 322, 328; `aclaraciones.md` l. 169; REQ-019, CA-021.
- **Problema:** Vercel guarda fuera de la UE ruta, consulta, IP y agente; con el texto actual de CA-021, PRUEBA-047 no puede darse por superada en lo que toca a la consulta. Admitirlo rebaja REQ-019 y es aceptar un riesgo, que D-019 no delega (aclaraciones l. 165). Observability Plus en `pre-nido` es gasto. La regla «nada secreto, personal ni de correo en ruta ni consulta» no cubre IP ni agente, datos personales de los usuarios.
- **Corrección:** pasar A-1 a la lista del responsable como `aceptacion-riesgo` firmada con `asunto = A-1`, que nombre ruta, consulta, IP y agente, más la enmienda de REQ-019 y CA-021 aprobada por él. Observability Plus a la lista de gastos. `comprobar-inicio` avisa mientras falte.

### Menores
- **m-1. `--solo`** (l. 85, 105): incompatible con `--evidencia`; la previa se ejecuta siempre; la salida dice «RESULTADO PARCIAL», nunca «GLOBAL»; la comprobación 10 rechaza un `bateria.md` parcial; la 003 exige los 11 pasos. Prueba: `--solo 3 --evidencia` da error; un `bateria.md` parcial pone en rojo la comprobación 10.
- **m-2. `x-vercel-id`** (l. 210): sospecha no comprobada; la cabecera lleva región de borde y de función, así que buscar `arn1` se cumple con la función en otra región. Leer el segmento de la función y comprobar el formato en PRUEBA-013.
- **m-3. `transaction`** (l. 181): fijarlo a la plantilla de la ruta, no a la ruta pedida. PRUEBA-046 con un valor marcado en un segmento de la ruta.
- **m-4. Restos para rebajar la batería** (l. 123, 138): `// @ts-nocheck` y `@ts-ignore` desactivan `tsc` por archivo; añadir `@typescript-eslint/ban-ts-comment` a `eslint.seguridad.config.mjs`. Nombrar en `reglas-integracion.json` las «configuraciones de la raíz»: `tsconfig.json`, `vitest.config.ts`, `eslint*.mjs`, `.prettierrc.json`, `.prettierignore`, `.gitleaks.toml`, `.gitattributes`, `.node-version`, `.vercelignore`.
- **m-5. «Altas firmadas»** (l. 138, 149): definirlas como archivo nuevo en `ordenes/` o `declaraciones/` con `.sig` válido; `firmantes-autorizados`, `entornos.json` y `excepciones-dependencias.json` piden firma en cualquier cambio. Prueba: añadir una línea de clave sin firma se rechaza.
- **m-6. Contradicción** (`aclaraciones.md` l. 152 dice que un cambio reservado puede aprobarlo el «orquestador por delegación», contra l. 151 del diseño): coordinación añade una línea que lo deje sin efecto.

## No comprobado
Formato de `x-vercel-id`; región de compilación de Vercel (no hay datos personales, pero ve las variables de compilación); protección de despliegue ante `Host` falsificado en rutas de diagnóstico (PRUEBA-025); alcance real de la sesión de `gh`; por qué `git ls-remote origin` no devolvió nada. No hay código ni pruebas que ejecutar.

## Versiones comprobadas con `npm view` (19/11/2026)
`next` 16.4.6 · `react` 19.3.1 · `eslint` 10.15.0 · `eslint-config-next` 16.4.6 (pide eslint>=9) · `eslint-plugin-security` 4.2.1 · `prettier` 3.10.1 · `typescript-eslint` 8.73.0 (pide TypeScript <6.1.0) · `vitest` 5.1.1 · `vercel` 66.2.0 · `typescript` 6.0.3 (última 6.0.x; la última publicada es 7.0.2).

**Sin bloqueantes.**
