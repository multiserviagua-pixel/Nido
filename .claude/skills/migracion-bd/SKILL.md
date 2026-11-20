---
name: migracion-bd
description: Lista de comprobación para cualquier cambio del esquema de la base de datos, es decir, tablas, columnas, políticas de RLS, funciones, vistas y roles. Úsala al crear o revisar una migración en supabase/migrations.
---

# Migración de base de datos

Toda migración es ruta crítica: pasa por el `revisor` y el `auditor-seguridad`.

## Antes

- La tarea `T-NNN` y el diseño dicen qué cambia. Si el diseño no lo cubre, para.
- Mira cómo está resuelto en `docs/MODELO-DATOS.sql`: es la referencia.

## La migración

1. Un archivo por cambio en `supabase/migrations/`, numerado. No se edita una migración ya aplicada: se escribe otra.
2. Lleva su vuelta atrás, escrita y probada, o una nota de por qué no se puede y cómo se recupera.
3. **Tabla nueva**, en el mismo archivo:
   - `enable row level security`.
   - Políticas: superadmin con `(select privado.es_admin())`; cliente con `cliente_id in (select privado.clientes_del_usuario())`, solo lectura.
   - Índice en las columnas que usan las políticas.
   - `revoke all` y después solo los permisos necesarios. El permiso limita la operación; la política, las filas.
   - Si nadie debe llegar por la API: RLS activado y ninguna política.
4. **Columnas**: sin texto libre en informes ni reglas (artículo 1). Lo enumerado es un tipo `enum` o un `check`. Los rangos llevan `check`.
5. **Funciones `security definer`**: en el esquema `privado`, `set search_path = pg_catalog, pg_temp` (`pg_temp` el último, D-035), nombres calificados con su esquema, `revoke all … from public, anon, authenticated` y `grant execute` solo al rol que la necesita.
6. **Funciones del conector**: reciben el HMAC del token y derivan el cliente dentro. Ningún parámetro `cliente_id` ni `licencia_id`.
7. **Vistas**: `with (security_invoker = true)`.
8. **Secretos**: tokens y códigos, solo como HMAC en hexadecimal. Ningún secreto en SQL.
9. **Solo inserción**: `versiones_prompt` y `auditoria` no se modifican ni se borran.

## Las pruebas (pgTAP, en `supabase/tests/`)

- Usuario del cliente A no lee ni escribe filas del cliente B, en la tabla y en las vistas que la usan.
- `anon` no lee nada.
- Superadmin sin doble factor no lee ni escribe; con doble factor, sí.
- Las funciones del esquema `privado` no son invocables por `anon` ni `authenticated`, salvo las de política.
- El rol `conector` no puede leer tablas.
- Lo que tiene `check`, rechaza el valor fuera de rango.

## Comprobar

- En esta máquina no hay Docker: pgTAP corre en CI. Dilo en el informe; no anotes las pruebas como superadas.
- Sí se puede comprobar aquí que el SQL es válido y que el RLS básico funciona: `node scripts/probar-modelo.mjs` lo ejecuta en PGlite con un preámbulo que simula Supabase. No sustituye a pgTAP.
- Si cambia el modelo, actualiza `docs/MODELO-DATOS.sql`.

## Nunca

- Aplicar una migración a producción sin aprobación del responsable.
- Desactivar RLS «un momento».
- Usar `user_metadata` para autorizar.
