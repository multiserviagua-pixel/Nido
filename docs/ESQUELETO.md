# Estructura propuesta del repositorio

Estado: APROBADA por el responsable el 12/11/2026, al cerrar la fase 0 (decisión D-014). El código se crea a partir de la fase 1; hoy solo existe la parte del arnés. Un cambio de esta estructura se propone en el diseño de la función que lo necesite.

Una sola app Next.js y un solo despliegue. Sin monorepo: no hay un segundo servicio que lo justifique.

## Árbol

```
agentes-correo-humanaia/
├── CLAUDE.md  AGENTS.md  README.md
├── .env.example  .gitignore
├── package.json  tsconfig.json  next.config.ts
├── vercel.json                     # regions: ["fra1"]; tareas periódicas
│
├── docs/                           # constitución, plan, decisiones, diseño de alto nivel, ADR
├── specs/                          # una carpeta por función (ciclo SDD)
├── contratos/                      # esquemas JSON: fuente de verdad de las herramientas
├── scripts/                        # comprobador, registro de versiones del prompt
│
├── prompts/
│   └── agente-ia/
│       ├── arranque.md             # texto local del cliente: llama al conector y conserva los límites
│       ├── 1.2.md                  # versión actual, con carpeta panel
│       └── 1.3.md                  # primera versión servida por el conector
│
├── supabase/
│   ├── config.toml
│   ├── migrations/                 # SQL numerado, escrito a mano
│   ├── tests/                      # pgTAP: aislamiento, permisos de funciones, inmutabilidad
│   └── seed.sql                    # datos ficticios
│
├── src/
│   ├── app/
│   │   ├── acceso/                 # inicio de sesión y doble factor
│   │   ├── admin/                  # dashboard superadmin
│   │   │   ├── clientes/  versiones/  ordenes/  alertas/
│   │   │   └── facturacion/  auditoria/  ajustes/
│   │   ├── panel/                  # dashboard de cliente
│   │   ├── oauth/
│   │   │   ├── autorizar/          # pantalla de activación
│   │   │   ├── token/
│   │   │   └── registro/
│   │   ├── .well-known/            # metadatos OAuth
│   │   └── api/
│   │       ├── mcp/route.ts        # conector
│   │       ├── stripe/webhook/route.ts
│   │       └── cron/alertas/route.ts
│   │
│   ├── mcp/
│   │   ├── servidor.ts             # registro de herramientas
│   │   ├── herramientas/           # obtener-instrucciones, enviar-informe, confirmar-orden
│   │   └── esquemas/               # validación generada a partir de contratos/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── navegador.ts        # clave publicable
│   │   │   ├── servidor.ts         # sesión del usuario + RLS
│   │   │   ├── conector.ts         # rol de Postgres propio del conector
│   │   │   └── admin.ts            # ÚNICO lugar con la clave secreta
│   │   ├── oauth/                  # códigos, tokens, rotación, HMAC
│   │   ├── licencias/
│   │   ├── stripe/
│   │   ├── alertas/
│   │   └── registro/               # registros sin valores recibidos
│   │
│   └── components/                 # sistema de diseño
│
├── tests/
│   ├── unit/                       # esquemas, tokens, licencias
│   └── e2e/                        # acceso cruzado entre clientes, flujos de panel
│
├── .github/
│   ├── workflows/                  # CI: tipos, estilo, pruebas, pgTAP, escáneres
│   └── PULL_REQUEST_TEMPLATE.md
│
└── .claude/                        # agentes, skills, reglas, gancho, ajustes
```

## Convenciones

- **Idioma**: nombres de dominio en español (`licencias`, `ordenes`, `informes`), sin tildes ni eñes en identificadores, archivos y rutas. Los términos propios de las librerías se dejan como son.
- **Clave secreta**: solo `src/lib/supabase/admin.ts` la lee. Se usa para lo que no tiene alternativa (alta de usuarios, registro de versiones en el despliegue). Los dashboards leen y escriben con la sesión del usuario.
- **Conector**: `src/mcp/` no importa nada de `src/lib/supabase/admin.ts` ni de `servidor.ts`. Solo `conector.ts`.
- **Contratos**: `contratos/*.schema.json` manda. La validación del servidor y las restricciones de la base de datos se derivan de ahí; si no coinciden, es un defecto.
- **Migraciones**: una por cambio, numeradas, reversibles. Tabla nueva y su RLS en la misma migración.
- **Pruebas**: junto a cada herramienta del conector, una prueba de «campos de más» y otra de «token de otro cliente».
- **Commits**: en español, con el identificador de la tarea (`T-012: …`).

## Qué queda fuera del repositorio

Secretos, datos reales, cargas de eventos de Stripe y cualquier dato de correo de clientes.
