# Relevo del chat de coordinación · 20/11/2026, 14:45

Reescrito entero. La historia está en `git log` y en `docs/TECNOLOGIAS.md` (D-023 a D-036). Lee también la memoria del proyecto (relevos automáticos, tablero de Figma, límite de subagentes).

## Papel
Coordinación (D-015): no escribe código de producto. Mantiene `docs/PLAN.md`, `docs/TECNOLOGIAS.md`, la constitución, `contratos/`, `.claude/` y `scripts/`; commitea los documentos de los chats de fase que no commitean; lanza, vigila y relanza los orquestadores de fase en pestañas de terminal; decide por delegación (D-036) y mantiene el tablero de Figma (se edita en su sitio el diagrama detallado, leyenda `6:723`; nunca se añade otro).

## Prioridad (responsable, 20/11/2026)
Tener algo funcional la semana del 23/11: **la prueba real del conector (001) es la prioridad máxima**. Autonomía total salvo lo reservado; no pedirle autorizaciones. La prueba Pro de Vercel va del **13/11 al 27/11** (comprobado en Billing): T-117 (despliegue) como tarde el 25/11 y T-119 (prueba real) el 26/11, día de `decision-pago` (AR-15). Tras el 27/11 pasa a Pro de pago (20 $/mes, tarjeta del equipo) salvo que el responsable lo baje.

## Estado (14:45)
- `main` en `f70b30f`. **Remoto**: `origin` = `github.com/multiserviagua-pixel/Nido`; el responsable autorizó el push y el CI, y lo hizo **público**; la coordinación le recomendó volver a privado (prompt del agente, captura de terceros y diseño de seguridad expuestos) y arreglar la facturación de Actions (en privado no arrancaba por pago fallido o límite de gasto). El arnés pasó en verde en público.
- **Fases en marcha** (orquestador en pestaña de terminal):
  - **Fase 1 d** (`-n "Fase 1 d"`, consola del chat anterior, sin pestaña de esta sesión): ruta crítica T-103 → T-107 → T-105 → T-106 → T-108 → T-109 → T-110 → T-111 → T-112/T-113 → T-114 → T-117 (a); además T-005 y `tarea/retirar-fechas` (puede sobrar: la 020 T-002 ya retiró las fechas en `3c0df33`). Relevo: `specs/001-…/relevo.md`.
  - **Fase 1 e** (`-n "Fase 1 e"`, desde 13:59): paralelo de la 001: 002·T-006 → 001·T-104 → T-116 → T-115, luego T-118 (a), 002·T-009 y T-010. Relevo: `specs/001-…/relevo-paralelo.md`.
  - **Fase 2 d** (`-n "Fase 2 d"`, desde 13:42): 010, última pasada de T-001, integrarla, T-002 y T-003 (la enmienda de `search_path` ya estaba en `main`, `9eb19fd`). Relevo: `specs/010-…/relevo.md`.
  - **Fase 3 PAUSADA por prioridad** desde las 14:00: T-002 de la 020 integrada (`3c0df33`); siguiente, T-003. Relevo: `specs/020-…/relevo-fase-3.md`. Reabrir cuando la ruta crítica de la fase 1 lo permita.
- Los mensajes de la coordinación a las pestañas quedan **retenidos** hasta que el responsable los aprueba en cada pestaña (modos de permiso distintos); si caducan, no llegan.

## Decisiones por D-036 de hoy (constan en los informes al responsable)
Integraciones de 020·T-002, 010·T-001 (condicionada), T-003-menores, T-004, T-101, T-102, T-103, T-005 y retirar-fechas (condicionadas a revisor y auditor sin bloqueantes ni mayores y `verificar` en verde); propuestas 33 y 34 de la 010; **DP-1** (despliega una persona con la CLI desde clon limpio), **DP-2 (a)** (T-116 en el plan, Sentry UE lo crea una persona), **AR-01** (`readOnlyHint: false`; concesiones ajenas = fallo y revocación; límite m-3 aceptado); reparto de la fase 1 en dos chats y pausa de la fase 3. El responsable confirmó el reparto («Autorizado»).

## Vercel (hecho por la coordinación el 20/11, con el responsable)
Proyecto `pre-nido` (`prj_QpVn3kgANvg1iqdzsepM2cdvYRur`) en el equipo `humana-ia`: sin Git, Next.js, `npm ci --ignore-scripts`, Node 26.x, funciones solo en `arn1`, protección estándar (dominio propio público, direcciones generadas protegidas), WAF «Limite api 100 por minuto e IP» en `/api/`, `ENTORNO=preproduccion` en Production y Preview. Dominio `pre-nido.humannaia.com` añadido; **falta el CNAME** en Axarnet: `pre-nido` → `669b58d018a4b6a1.vercel-dns-017.com.` (no cambiar los nameservers). Sesión de la CLI cerrada (`vercel logout`); ningún token en la máquina. No se ha creado `nido` (producción, reservado).

## Pendiente del responsable
CNAME de `pre-nido`; proyecto Sentry UE (DP-2); visibilidad del repositorio y facturación de Actions; buzón de pruebas (AR-04) y pasos de Claude Max (AR-03); SQL en Supabase «Nido» (AR-05) tras T-107; variables secretas de `pre-nido`; despliegue (T-117 a) y prueba (T-119). Dominio y correo resueltos: `humannaia.com`, `accesos@humannaia.com` (dos enes). Sin respuesta: «Nido» como nombre visible.

## Cómo se relanza una fase
1. Comprobar que el chat terminó (relevo reescrito y quieto) y leer el relevo.
2. Cerrar su proceso y su consola (`claude.exe` con `-n "<nombre>"` y su consola padre), o su pestaña con `stop_terminal_tab`.
3. Lanzar con un script `.ps1` en la carpeta temporal (una línea larga en la pestaña falla): `claude --agent orquestador --permission-mode auto -n '<Fase N x>' $encargo`, con el encargo en ASCII y sin comillas dobles dentro, citando el relevo, D-029, D-031, D-034, D-035, D-036, un solo subagente opus a la vez, código en su copia de trabajo y rama, carpeta principal en `main`, carpetas de `specs/` de otras fases sin tocar, sin push ni cuentas ni secretos, y relevo al llegar a 150k.
4. Si el relevo deja una decisión con opción recomendada y criterios cumplidos, decidir por D-036 y escribirla en el encargo.

## Vigilancia
Vigía en segundo plano (`vigia.sh` en la carpeta temporal de la sesión): avisa cuando un relevo (incluido `relevo-paralelo.md`) cambia y queda quieto 4 min, o cuando nada cambia en 12 min. Además, aviso de inactividad por sesión (`notify_when_idle`).

## Otros pendientes de coordinación
- `specs/010-base-datos-rls/propuestas.md` n.º 17 a 33: trasladar a los documentos compartidos.
- Retirar las copias de trabajo de las ramas ya integradas.
- Actualizar el tablero de Figma en cada hito (próximo: T-103 en `main`).
