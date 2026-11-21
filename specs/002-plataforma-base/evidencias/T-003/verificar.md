# T-003 (002): verificación

Commits: `12044a1`, `03b82c0`.
La carpeta de T-002 apunta al mismo commit `12044a1`.

- Commits: `12044a1` (20/11/2026), compartido con T-002, y `03b82c0` (20/11/2026), «T-003 (002): menores del revisor (pruebas del manifiesto, ESLint y D-027)». Fuente: git log. `03b82c0` se admite dentro de esta carpeta (D-036, 21/11/2026, según `tareas.md`).
- Resultado de `npm run verificar`: no consta en los mensajes de commit.
- Pruebas añadidas por `12044a1` (fuente: git show --stat): `tests/unit/plataforma/verificar.test.ts` y `tests/unit/plataforma/reglas-eslint.test.ts`; `03b82c0` modifica `manifiesto.test.ts` y `reglas-eslint.test.ts`.
- Negativas de PRUEBA-055: `specs/002-plataforma-base/verificar-negativas.md` (lo añade `12044a1`) dice que se ejecutaron el 20/11/2026 en un clon temporal fuera del repositorio (commit `f76d617`, que no está en la primera línea de `main`) y marca sus negativas como SUPERADA. No se re-ejecutaron para esta evidencia.
- Número de pruebas, versiones de Node y npm y quién ejecutó: no consta.

Fuentes: `git log --first-parent main` (mensaje del commit), la fila de la tarea en `specs/002-plataforma-base/tareas.md` y `specs/001-conector-prueba-real/relevo-paralelo.md`. Evidencia a posteriori (T-012, 21/11/2026): solo lo que consta en esas fuentes; «no consta» donde falta (art. 13). Sin valores ni secretos.
