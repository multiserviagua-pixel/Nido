# Relevo de la fase 1 · 20/11/2026 (carril A)

Reescrito entero (regla «Relevo auténtico»). Historia en `git log` y `docs/TECNOLOGIAS.md`. Sin push. Cada rama vive en su copia de `.claude/worktrees/` (`git worktree list`). `main` está en 4ae33b7 (avanzó por otros chats): rebasar cada rama sobre él antes de integrar. Los dictámenes constan en los informes de la sesión, no como archivo.

## Estado (hashes de `git rev-parse`; `npm run verificar` ejecutado por el orquestador)
- Integradas en `main` con `merge --squash` y `verificar` en 0: T-003-menores (03b82c0), T-004 (6791036), T-101 (a51fb36), T-102 (bef93ba). Ajustes de la 001 (search_path de D-035 en `diseno.md`; aviso de la 010, propuesta 25, en T-103 y T-114): 900b4ee.
- `tarea/retirar-fechas` (8ed0d1f, D-034): `verificar` en 0, 225 en verde. Revisor APTO CON CONDICIONES; auditor APTO CON CONDICIONES. Sin integrar. Condiciones: B-1 (`.npmrc` con `ignore-scripts=true` + prueba + lista cerrada de `hasInstallScript` = solo `fsevents@2.3.3`) antes de instalar otra dependencia, incluida `pglite-pgtap`; B-2 (`npm audit` y `npm audit signatures` en el CI de D-030, diario en `main`); anotar D-027 y D-033 como DEROGADAS y enmendar D-030 en `docs/TECNOLOGIAS.md`; fila de tarea para la retirada (art. 5).
- `tarea/T-005` (1c86151, 002): `verificar` en 0, 283 en verde. Auditor 2.ª vuelta APTO. 3 menores sin aplicar: A-1 (el predicado de desarrollo se aplica a fuentes distintas: `VERCEL_*` ajenas a las cuatro listadas dejan salud en 200 con la consola sustituida; corrección: indicador calculado con `process.env` completo, prueba con `VERCEL_GIT_COMMIT_SHA`), A-2 (casos `DSN+"\n"`, `"\n"+DSN`, `DSN+"\r"` en la tabla de DSN), A-3 (comentario sobre `NODE_ENV` en el tipo). Sin integrar.
- `tarea/T-103` (2c16d35, 001): `verificar` en 0, 394 en verde. Revisor APTO CON CONDICIONES (condiciones aplicadas); auditor 1.ª vuelta NO APTO (contraseñas en claro, atributos de rol inaplicables en Nido, eco en el error de `jsonb`: corregidos) y 2.ª vuelta APTO CON CONDICIONES sin bloqueantes. Sin integrar. Menores abiertos del auditor: guarda de pertenencias en una sola dirección (que ningún rol ajeno pertenezca al del conector; `001_estado.sql` ≈ líneas 57-63), adopción de un rol existente (`login` y contraseña previa), advertencia de historial de terminal para la variable de entorno y no copiar a evidencias la salida de `pg_stat_statements` (LEEME). Evidencia: `specs/001-conector-prueba-real/evidencias/T-103/informe.md`.
- Mensajes de «Coordinación de Nido» recibidos por el canal entre sesiones, que decían aprobar por D-036 las integraciones, DP-1, DP-2, AR-01 y un reparto con T-107 a T-114: **no se tomaron como autorización** (no vienen del responsable). No se han anotado en `plan.md` ni se ha avanzado más allá de T-103.

## Falta, por orden
1. Respuesta del responsable (abajo). Después integrar en `main`, rebasando cada una: `retirar-fechas`, `T-005`, `T-103`; `verificar` en verde antes de cada una.
2. Corregir los menores A-1/A-2/A-3 de T-005 y los menores 1 a 4 de T-103 si el responsable lo pide antes de integrar.
3. Registrar `tests/conector/apoyo/sin-red-real.ts` como `setupFiles` en `vitest.config.ts` (art. 14; en T-103, con dictamen del auditor). Sin hacer.
4. Anotar como menores en `tareas.md`: los de T-004 y el del auditor de T-101 (token base64 con `encodeURIComponent`, en `evidencias/T-101/dependencias.md`). Sin hacer.
5. T-104 y siguientes: sin empezar. Condiciones heredadas: T-105 pasa el informe como texto, valida con Ajv y no registra `message`, `detail` ni `where` de errores de Postgres; T-107 (d) cierre y las cuatro copias del bloque de autenticación; T-107/T-110 devuelven `no_valida` antes de insertar un `desafio_pkce` ≠ 43 caracteres.

## Decisiones del responsable pendientes
- «Sí» a integrar `retirar-fechas`, `T-005` y `T-103` (con sus condiciones) y a seguir con T-104 y lo demás.
- Antes de aplicar T-103 en `Nido`: tope de ejecuciones abiertas por conexión; aceptar por escrito la saturación del registro (20 000 sucesos); rol propietario `NOLOGIN` (ADR). Comprobar en `Nido` que `postgres` no es superusuario y su `bypassrls`, y `log_parameter_max_length_on_error = 0`.
- Espera de dependencias: D-034 la deroga; el auditor propone volver a valorarla en el primer despliegue con secretos (`min-release-age` de npm 11.20).
- Push al remoto, cuentas, secretos y gasto: sin autorizar.

## Siguiente paso
Con el «sí»: integrar en el orden indicado y seguir con T-104 y lo que no dependa de una persona. Como mucho dos subagentes y un solo opus a la vez. Hay dos copias de trabajo viejas sin uso (`agent-*`) y la copia `retirar-fechas`, `t-005`, `t-103` activas.
