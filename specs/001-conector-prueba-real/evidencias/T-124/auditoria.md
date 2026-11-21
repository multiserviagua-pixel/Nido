# T-124 y CI · Dictamen del auditor-seguridad (21/11/2026, commit da9a97b)

Texto guardado por el orquestador a partir del informe del `auditor-seguridad` (sin herramienta de escritura).

**Dictamen: APTO CON CONDICIONES, sin bloqueantes.** No relaja los artículos 1 a 4 ni el 8; añade controles contra A-19.

## Comprobado y bien
- SHA de `actions/checkout` y `actions/setup-node` = etiqueta v4.4.0 (`git ls-remote`, repetido por el auditor); organización `actions`.
- `arnes.yml`: `contents: read`, `persist-credentials: false`, sin `pull_request_target`, `workflow_run` ni `secrets.*`, sin interpolar `github.event.*` en `run:`, sin `cache:`.
- `next.config.ts`: `agentRules: false` es una clave suelta; cabeceras, CSP y trazado sin cambios; sin efecto de seguridad (A-21).
- `ci-npm.test.ts` no se debilita (las pruebas por mutación siguen fallando si la mutación no cambia el texto).

## Hallazgos
1. **MAYOR** (`.github/CODEOWNERS:5-8`, A-19, A-20, A-12; arts. 3, 4, 9, 14): el alcance no cubre lo que neutraliza el propio CI (`scripts/comprobar-specs.mjs`, `scripts/patrones-secretos.mjs`, `tests/unit/plataforma/**`, `vitest.config.ts`) ni otras rutas críticas (`vercel.json`, `package.json`, `next.config.ts`, `supabase/migrations/`, `supabase/reversiones/`, `prompts/`, `docs/CONSTITUCION.md`, `.claude/`). Corrección: ampliar CODEOWNERS y la prueba.
2. **MENOR**: CODEOWNERS no surte efecto hasta que una persona activa la protección de rama con «revisión de propietarios de código»; si el propietario es también quien abre los PR, GitHub no acepta su propia aprobación (bloquea o se salta como administrador). Lo decide la persona.
3. **MENOR** (`acciones-fijadas.test.ts:16`): el filtro `uses:` no detecta claves con comillas, `uses :` ni forma en línea. Corrección: ampliar la expresión y añadir una mutación.
4. **MENOR** (`arnes.yml:5-10`, art. 13): comentarios desfasados (siguen listando fijar por huella y V-115 como pendientes).
5. **MENOR**: sin `.github/dependabot.yml` para `github-actions`; posible retirada de Node 20 en la línea v4 de las acciones (operación, no comprobado).

## No comprobado
Comportamiento real de CODEOWNERS y de la protección de rama; permisos de la cuenta propietaria; vistas previas de Vercel por PR; que cada SHA sea commit (etiquetas ligeras, sin línea `^{}`).
