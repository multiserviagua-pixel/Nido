# Agentes de correo HumanaIA: suscripción y dashboards

Sistema que sustituye la carpeta `panel` de los agentes de correo por un conector MCP con licencia, una base de datos en la UE con aislamiento por cliente, un dashboard superadmin y un dashboard por cliente. Es un producto final publicable, no un MVP.

**Estado:** fase 0 cerrada el 12/11/2026. Todavía no hay código de aplicación. Cada fase se trabaja en su propio chat; el reparto y lo que puede ir en paralelo están en `docs/PLAN.md`.

## Antes de actuar

Lee, por este orden:

1. La constitución (importada abajo).
2. `docs/TECNOLOGIAS.md`: registro de decisiones. Una decisión en estado VERIFICAR no se usa sin comprobarla antes (skill `verificar-decision`).
3. La carpeta `specs/NNN-…/` de la función en curso y los ADR que cite.

@docs/CONSTITUCION.md

## Cómo se trabaja

- Ciclo SDD por función: especificar → aclarar → diseñar → planificar → implementar → revisar → verificar → cerrar. Cada paso tiene su skill (`sdd-*`, `cerrar-fase`).
- La sesión principal hace de **orquestador** (skill `orquestar`): reparte el trabajo entre los subagentes de `.claude/agents/`, aplica las puertas y no escribe código de producto.
- Tres puertas las abre la persona responsable: aprobar la especificación, aprobar diseño y plan, cerrar. Nunca se da una puerta por abierta sin su respuesta expresa.
- Se implementa una sola tarea `T-NNN` cada vez, con su prueba delante.
- Rutas críticas: OAuth y licencias, RLS y migraciones, webhooks y entrega del prompt. Cualquier cambio en ellas necesita dictamen de `auditor-seguridad` además del `revisor`.
- Al informar: qué se hizo, comandos ejecutados y su resultado, qué no se pudo comprobar, riesgos y vuelta atrás.

## Equipo y modelos

Roles, responsabilidades y enrutado de modelos en `docs/EQUIPO.md`. El modelo de cada agente está en la cabecera de su archivo.

## Mapa

| Ruta | Contenido |
| --- | --- |
| `docs/` | Constitución, plan, decisiones, arquitectura, seguridad, diseño, calidad, equipo, ADR |
| `specs/` | Una carpeta por función; plantillas en `specs/_plantillas/` |
| `contratos/` | Esquemas JSON del informe y de las herramientas del conector |
| `scripts/` | Comprobador de trazabilidad y patrones de secretos |
| `.claude/` | Agentes, skills, reglas por ruta, gancho y ajustes |
| `docs/referencia/` | Prompt 1.2 del agente y captura de referencia visual |

La estructura del código que se creará a partir de la fase 1 está en `docs/ESQUELETO.md`.

## Comandos

```bash
node scripts/comprobar-specs.mjs
```

Comprueba trazabilidad, archivos obligatorios, contratos, cabeceras de agentes y skills, y ausencia de secretos. Debe terminar sin errores antes de cerrar cualquier paso.

```bash
node scripts/probar-modelo.mjs
```

Ejecuta `docs/MODELO-DATOS.sql` en un Postgres de prueba (PGlite) y comprueba el aislamiento entre clientes. Necesita instalar antes `@electric-sql/pglite`; el propio script dice cómo.

Los comandos de la aplicación (instalar, probar, desplegar) se añadirán aquí cuando exista código.

## Entorno

Windows 11 con PowerShell y Git Bash. Node 26 y npm 11. No hay Docker, pnpm, Deno ni CLI de Supabase o Vercel instaladas: las pruebas pgTAP se ejecutan en CI.
