# Administradores: alta y baja

Estado: función 010 (T-007). Aquí solo hay **procedimientos y nombres**: ningún valor secreto, ni de ejemplo. Cumple REQ-060 y REQ-063 y se ejecuta en CI para CA-037.

Diseño de referencia: `specs/010-base-datos-rls/diseno.md` (D-3, D-5, D-10).

## Principio

El alta y la baja de administradores se hacen **fuera de la API**, por una persona con acceso privilegiado (el rol `postgres` de la base) y con el procedimiento escrito en `supabase/procedimientos/administradores.sql`. Ningún perfil de la API (`anon`, `authenticated`, `service_role`, `conector`), incluido el superadmin con doble factor, puede insertar, modificar ni borrar en `public.administradores`: no tienen permiso y la política no existe. Tampoco lo hace el panel: la función 021 no da de alta administradores (propuesta 22).

## Requisitos previos

- El usuario ya existe en `auth.users` (se crea por la vía normal de Supabase Auth). Si no existe, el alta falla por la clave ajena.
- Se conoce su identificador (`uuid`). No se escribe en ningún archivo del repositorio.
- Quien lo ejecuta abre `psql` con su propia conexión privilegiada, desde una terminal propia. La cadena de conexión no se pone en el repositorio ni en el historial compartido (artículo 4). Nunca el editor SQL del panel para esto.

## Alta

```
psql -v ON_ERROR_STOP=1 -v accion=alta -v usuario=<uuid del usuario> -f supabase/procedimientos/administradores.sql
```

## Baja

```
psql -v ON_ERROR_STOP=1 -v accion=baja -v usuario=<uuid del usuario> -f supabase/procedimientos/administradores.sql
```

## Qué hace y qué garantiza

- Una sola transacción: ante cualquier fallo no cambia nada.
- Exige que el rol sea `postgres` (`procedimiento_rol_no_permitido`) y que la acción sea `alta` o `baja` (`procedimiento_accion_desconocida`). Si falta una variable, `psql` no la sustituye y la sentencia falla.
- La baja falla si el usuario no es administrador (`procedimiento_administrador_inexistente`) y **si es el último** (`procedimiento_ultimo_administrador`): sin administradores nadie entraría al panel. Para retirar al último hay que dar de alta antes a su sustituto.
- Cada cambio deja **exactamente una fila de auditoría** (`insert` o `delete` sobre `administradores`), que escribe el disparador de la tabla y no depende de este archivo. El procedimiento lo comprueba y, si no la encuentra, lo deshace todo (`procedimiento_auditoria_no_registrada`).
- La fila de auditoría no lleva el nombre ni el correo del administrador: solo su identificador.

## Comprobaciones

| Qué | Dónde |
| --- | --- |
| Alta y baja de un administrador ficticio, con 1 fila de auditoría por cambio | `supabase/tests/pglite/seed.test.ts` (local, PGlite) y, en CI, el paso del procedimiento de administradores (T-013) |
| Ningún perfil de la API puede insertar, modificar ni borrar administradores, con 0 filas de auditoría | pgTAP `09_administradores` (CI, T-011) |
| El archivo no lleva secretos, órdenes de `psql` ni más de dos interpolaciones | `tests/unit/bd/seed-config.test.ts` |

En CI, el usuario ficticio es AD3 del seed (existe en `auth.users` y no es administrador). Las pruebas pgTAP no se han ejecutado todavía: corren en CI (T-013). Las de PGlite comprueban SQL válido y comportamiento, y no sustituyen a las de CI.

## Aviso sobre el seed

`supabase/seed.sql` y `supabase/datos/volumen.sql` crean administradores ficticios. Solo se cargan con `app.entorno` en `ci` o `desarrollo`. Esa guarda protege de accidentes, no de quien actúa a propósito con `postgres`, que puede fijar la variable (N-8). En producción no se fija la variable ni se carga el seed, y `config.toml` desactiva la carga automática (`[db.seed] enabled = false`).
