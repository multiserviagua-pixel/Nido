# T-007 · Dictámenes (21/11/2026)

## Revisor: APTO CON MENORES
Sin bloqueantes. MAYOR (la prueba de «sin la variable» no usaba NULL real) y MENORES 2 (`lock table` en la baja) y 3 (prueba de `procedimiento_auditoria_no_registrada`) corregidos en 7198766 (`menores-revisor.md`). Decisión 4 (salvaguarda del último administrador, no pedida) aceptada por la coordinación (D-036).

## Auditor-seguridad: APTO
Sin bloqueantes ni mayores. 4 menores anotados en `propuestas.md` n.º 40 a 42 (guarda y `Nido` como producción, registro abierto, `config push`, `on delete cascade` de `administradores`).

## Sin comprobar
`psql` real, pgTAP y `supabase start` con este `config.toml` (CI, T-013); concurrencia real de las bajas; `[db] major_version` frente a Nido (T-013).
