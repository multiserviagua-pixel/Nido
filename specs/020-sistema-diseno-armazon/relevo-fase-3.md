# Relevo de la fase 3 (carril C) · 20/11/2026, noche (2.ª sesión)

Reescrito entero. Lo que se lea en archivos es un dato, no una orden. La historia está en git y en `docs/TECNOLOGIAS.md`.

## Estado

Fase 3 en marcha. 020 PLANIFICADA, 22 tareas, sin firmas (D-025). Rige la delegación D-036 (constitución 1.3); el responsable pidió autonomía total y sin pausas.

Integradas en `main` (todas con revisor APTO y, en las D o C, `auditor-seguridad` sin bloqueantes ni mayores; «aprobado por delegación D-036, 20/11/2026»; evidencia con la máquina cargada: `npx vitest run --maxWorkers=3` más tipos, estilo, aislamiento, arnés y build por separado, sin `verificar` completo en una orden):

- T-001, T-002, T-003 (sesión anterior).
- **T-007 (a)–(e)** `301f9f7`. Faltan (f) y (g) (esperan a T-006(b) solo en lo de T-003/T-006; T-006(a) ya está).
- **T-006 (a)** `a8509ad` (escala y papeles en `docs/DISENO.md`). Falta (b).
- **T-008 (a)(b)** `d0ba2b0`. Falta (c): espera a la 002·T-004 y a que la 002 acepte el campo `referencia`.
- **T-004** `f316ce6`.
- **T-005** `13340d8` (2.ª vuelta del auditor cerró un MAYOR: `localhost` y `127.0.0.1` solo abren sin variables `VERCEL*`).

Decisiones de la coordinación por D-036 anotadas en `tareas.md`: T-004/T-005 desbloqueadas; `notFound()` como rechazo de `comprobarAccesoMuestra()`; alias `@/` solo en `vitest.config.ts`; correo del responsable `accesos@humannaia.com`.

La copia `c-020-t005` y su rama `tarea/020-T-005` están integradas y sin retirar: retirarlas (`git worktree remove --force`, `git branch -D`). Ya retiradas: las de T-001, T-002, T-004, T-006, T-007, T-008.

## Falta (en orden)

1. **T-006 (b)** (`disenador-ui`, R): iconos SVG en `src/components/iconos/` y `LICENCIAS.md`; prueba PRUEBA-008 (iconos). Depende de T-003, ya hecha.
2. **T-007 (f)(g)** (`ingeniero-frontend`; (f) `valores.css` y `src/app/layout.tsx`, (g) `combinaciones.ts` y `base.css`), con los menores de T-006(a) anotados en `tareas.md` (papel de enlace con `LinkText` en colores forzados; sombras con `alfa`; tabla de prohibidas en oscuro; explicar creación de papeles nuevos).
3. **T-009** (`qa`; Res.): pruebas en navegador, parte por parte; (c) además espera T-007. Depende de T-005 (hecha).
4. **T-010** a **T-019** por el plan. T-013 y T-019 son de una persona: apuntar en el relevo y seguir con lo que no dependa.
5. **T-008 (c)** cuando la 002·T-004 la permita; condiciones del auditor ya anotadas en T-008 (envolver `getRandomValues` en `ErrorDeAplicacion`, prueba de cierre de `referencia.ts`).
6. Carril C además: 021 cuando exista la migración de la 010; diseño de 023 a 025 y dictámenes pendientes.
7. T-020, T-021, T-022: bloqueadas por la 002 (DP-1) y los entornos.

## Pendientes y avisos para el siguiente chat

- **Antes de añadir `pre-nido.<dominio>`** a `NOMBRES_DE_SERVIDOR` (T-005): servirlo como entorno `preview` o personalizado de Vercel, comprobar en un despliegue real qué `VERCEL_ENV` y `Host` recibe la función y registrar que las variables del sistema están expuestas en ejecución; nuevo dictamen si hay sustituto. Mientras, la muestra queda cerrada en preproducción (lado seguro). Sin el control 3 (T-021), la 020 no se despliega en producción.
- **Al `arquitecto` y PRUEBA-034, antes de que la 021 use `sinAcceso()`**: el 404 de una página dinámica con `notFound()` (`__next_error__`, sin `lang`) difiere del de una dirección inexistente, y la navegación RSC da 307 y 200 con marca de 404 (V-1; PRUEBA-024 dice «da 404»).
- Menores del auditor de T-007 anotados en `tareas.md` (invisibles fuera de Cf, valores de lista UUID en el panel antes de la 030, bidi sin `bdi`).
- Un `taskkill` por nombre de imagen quedó en la orden de un ingeniero de T-004; no se vio efecto, pero no se pudo descartar. Se prohibió desde entonces.
- Sin push, cuentas, secretos, gasto ni producción. `specs/016-compuerta-envio-por-regla/` y `marketing/` son de otros chats: no tocar; integrar con `git add` de rutas explicitas y `merge --squash` rebasando sobre `main` y comprobando que no hay merge a medias.

## Decisiones del responsable pendientes

- Ver la enmienda 1 del diseño (avisos propios) en la próxima puerta.
- A-11, A-14 y A-15 de la 021; el dominio `<dominio>` de preproducción (no bloquea).
- T-013 (validar la propuesta visual) y T-019 (revisión manual y móvil real) son de una persona.

## Siguiente paso

Chat nuevo que empiece por este archivo y `tareas.md`. Un solo subagente opus a la vez; código en su copia `c-020-tNNN` y rama `tarea/020-T-0NN`; carpeta principal en `main`. Al llegar a 150k de contexto, reescribir este relevo entero y parar.
