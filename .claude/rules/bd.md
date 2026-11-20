---
paths:
  - "supabase/**"
  - "docs/MODELO-DATOS.sql"
---

# Reglas al tocar la base de datos

Ruta crítica: todo cambio pasa por el `revisor` y el `auditor-seguridad`. Sigue la skill `migracion-bd`.

- RLS activado en la misma migración que crea la tabla. Nunca se desactiva.
- Ninguna columna de texto libre en informes ni reglas.
- Funciones `security definer`: esquema `privado`, `search_path = pg_catalog, pg_temp` (`pg_temp` el último; todo lo que no sea de `pg_catalog`, calificado con su esquema; D-035), permisos revocados a todos y concedidos solo al rol que las necesita.
- Las funciones del conector reciben el HMAC del token. Ningún `cliente_id` ni `licencia_id` de entrada.
- Vistas con `security_invoker = true`.
- `versiones_prompt` y `auditoria` son de solo inserción.
- Tokens y códigos, solo como HMAC. Ningún secreto en SQL.
- Cada cambio lleva su prueba pgTAP de acceso cruzado entre dos clientes.
- Aquí no hay Docker: pgTAP corre en CI. No anotes esas pruebas como superadas en local.
- No se aplica nada a producción sin aprobación del responsable.
