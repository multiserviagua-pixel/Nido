# T-124 y CI · Vuelta corta del auditor-seguridad (21/11/2026, commits 7bc7d74 y fe0b202)

Guardado por el orquestador a partir del informe del `auditor-seguridad`.

**Dictamen: APTO CON CONDICIONES, sin bloqueantes.** Cerrados el MAYOR 1 (CODEOWNERS con 20 rutas, última coincidencia sin huecos, prueba con mutaciones) y los menores 3, 4 y 5. Dependabot: sin automerge, `fetch-metadata`, `pull_request_target` ni `workflow_run`; flujo con `contents: read` y sin secretos; cada subida toca `/.github/`, con propietario. El menor 2 (protección de rama y autoaprobación) sigue en manos de una persona.

## Hallazgos nuevos (menores; el orquestador los acepta por ahora y los deja anotados)
1. CODEOWNERS (arts. 2, 3, 9, 14): sin propietario `src/lib/oauth/`, `src/app/oauth/`, `src/app/.well-known/`, `src/lib/licencias/`, `src/lib/supabase/`, `src/mcp/`, `src/app/api/mcp/`, `supabase/tests/`, `tests/unit/bd/`, `tests/conector/`, `CLAUDE.md`, `AGENTS.md`, `tsconfig.json`, `postcss.config.mjs`, `playwright.config.ts`, `.vercelignore`, `.node-version`. Corrección mínima: `* @multiserviagua-pixel` como primera línea y exigirla en la prueba. Sin efecto hasta activar la protección de rama.
2. `acciones-fijadas.test.ts:8`: recorrer `.github/` entero (`*.yml`, `*.yaml`), no solo `workflows/`.
3. `acciones-fijadas.test.ts:11`: clave YAML con escapes (`"\x75ses"`) no detectada; usar un parser ya presente.
4. `dependabot.yml`: opcional `cooldown: { default-days: 7 }` y `open-pull-requests-limit: 2`.

## No comprobado
Comportamiento real de CODEOWNERS, protección de rama, Dependabot y permisos de la cuenta propietaria en GitHub.
