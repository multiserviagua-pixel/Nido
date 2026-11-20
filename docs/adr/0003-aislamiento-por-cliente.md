# ADR-0003: Aislamiento por cliente

Estado: CONFIRMADO; conexión con rol propio en VERIFICAR (V-107) · Fecha: 12/11/2026 · Decisiones: T-004, T-005

## Contexto

El aislamiento entre clientes es un requisito del producto (artículo 2). En Supabase, la clave secreta salta RLS: si el servidor la usa para todo, el aislamiento depende de que ningún fragmento de código olvide un filtro.

## Decisión

1. **RLS en todas las tablas**, activado en la misma migración que crea la tabla.
2. **Dashboards con la sesión del usuario**: clave publicable y RLS. Las políticas se apoyan en `usuarios_cliente` y `administradores`, nunca en datos editables por el usuario. Las de superadmin exigen además doble factor.
3. **Vistas con `security_invoker`**, para que apliquen el RLS de quien consulta.
4. **El conector no consulta tablas.** Se conecta con un rol de Postgres propio cuyo único permiso es ejecutar tres funciones `security definer` en un esquema no expuesto. Cada función recibe el HMAC del token y deriva el cliente dentro de la base de datos. El identificador del cliente nunca es un parámetro.
5. **Clave secreta confinada** a `src/lib/supabase/admin.ts`, para lo que no tiene alternativa. Ninguna lectura o escritura de datos de clientes en los dashboards pasa por ella.
6. Las funciones `security definer` llevan `search_path = pg_catalog, pg_temp` (`pg_temp` el último; todo lo que no sea de `pg_catalog`, calificado con su esquema; D-035) y sus permisos se revocan a todos y se conceden solo al rol que las necesita.
7. **Pruebas pgTAP bloqueantes** en CI: acceso cruzado en tablas y vistas, funciones del conector no invocables por la API pública, tablas internas ilegibles.

## Alternativas

| Alternativa | Por qué no |
| --- | --- |
| Filtrar por cliente en el código del servidor con la clave secreta | Un filtro olvidado expone a todos los clientes |
| Una base de datos por cliente | Coste y operación desproporcionados |
| Autorización por claims del token de sesión | Los claims pueden quedar desactualizados hasta que se renueva el token |

## Consecuencias

- Más lógica en SQL: las tres funciones del conector son ruta crítica y llevan sus propias pruebas.
- Hay que verificar cómo conectar con un rol propio desde Vercel (V-107). Si no fuera viable, el plan alternativo es la clave secreta confinada en un módulo exclusivo del conector, con las mismas funciones.
- El modelo de referencia está en `docs/MODELO-DATOS.sql`.
