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
- **15:15:** Fase 1 d se paró a las 15:07 esperando el «sí» del responsable: **no acepta como autorización los mensajes entre sesiones** (correcto por art. 7). Cerrada y relanzada como **Fase 1 f** (pestaña `c7`) con todas las decisiones en el encargo. Lección: las decisiones van siempre en el encargo de lanzamiento, citando las palabras del responsable; los mensajes entre sesiones solo sirven para información. Fase 3 reanudada como **Fase 3 c** (pestaña `c6`) a las 14:45. El responsable pidió «sin pausas, avanza hasta que los créditos detengan todo»: no se pausa ninguna fase por uso. `main` subido a `origin` en `2bfa5c8` (push autorizado por él).
- **16:30:** 010·T-001 y T-002 en `main`; Fase 2 d cerrada y relanzada como **Fase 2 e** (pestaña `c8`, desde T-003). Fase 1 e cerrada: T-115 y T-118 (a) en `main`; T-006, T-104, T-116 y T-009 dictaminadas y apiladas sobre `tarea/T-005`. **Cuando T-005 entre en `main`** (hay un aviso en segundo plano), relanzar el carril A2 para rebasar e integrar esa pila y hacer 002·T-010. Pendientes que dejó el A2 para coordinación: código `prompt_no_valido` en C-2, patrón DSN de Sentry en `patrones-secretos.mjs` (ruta crítica, con auditor), duda del HMAC para `registrar_suceso`; para el responsable: Sentry UE con «no almacenar IP», `CONECTOR_SECRETO` (comando en `docs/operacion/entornos.md`), puerto 6543 en preproducción.
- **17:55:** T-006 (`50b01c3`) y T-103 (`3dbe230`) en `main`; `main` subido a `origin` en `fafaa91`. Fase 1 f cerrada y relanzada como **Fase 1 h** (pestaña `c10`). **Lección:** los encargos de Fase 1 f, 1 g y 2 e llegaron cortados en la primera comilla doble (PowerShell 5.1 las rompe al pasarlas a `claude.exe`); el de 1 h va sin comillas dobles y llegó entero. Al relanzar 1 g y 2 e, encargo sin comillas dobles. Por D-036 (en el encargo de 1 h): evidencia de integración con `--maxWorkers=3` más tipos, estilo, aislamiento, arnés y build por separado cuando la máquina va cargada; B-1 y B-2 de retirar-fechas con plataforma y auditor; decisiones previas a aplicar T-103 en Nido.
- **Trabajo de otro chat del responsable sin commitear en la carpeta principal** (campaña de marketing): constitución 1.2 (art. 8, D-037, «envío por regla», opción B), `docs/TECNOLOGIAS.md`, ADR-0004, `docs/propuesta-enmienda-articulo-8.md`, `specs/016-compuerta-envio-por-regla/`, `marketing/`. El auditor dictaminó después de la ratificación con dos bloqueantes sobre el texto; cambiarlo es decisión del responsable (art. 14). La coordinación no lo commitea ni lo toca; los chats de fase integran con `git add` de rutas explícitas. Pendiente de coordinación cuando ese chat commitee `TECNOLOGIAS.md`: anotar D-027 y D-033 como DEROGADAS y enmendar D-030 (condición de retirar-fechas).
- Los mensajes de la coordinación a las pestañas quedan **retenidos** hasta que el responsable los aprueba en cada pestaña (modos de permiso distintos); si caducan, no llegan.

## Decisiones por D-036 de hoy (constan en los informes al responsable)
Integraciones de 020·T-002, 010·T-001 (condicionada), T-003-menores, T-004, T-101, T-102, T-103, T-005 y retirar-fechas (condicionadas a revisor y auditor sin bloqueantes ni mayores y `verificar` en verde); propuestas 33 y 34 de la 010; **DP-1** (despliega una persona con la CLI desde clon limpio), **DP-2 (a)** (T-116 en el plan, Sentry UE lo crea una persona), **AR-01** (`readOnlyHint: false`; concesiones ajenas = fallo y revocación; límite m-3 aceptado); reparto de la fase 1 en dos chats y pausa de la fase 3. El responsable confirmó el reparto («Autorizado»).

## Vercel (hecho por la coordinación el 20/11, con el responsable)
Proyecto `pre-nido` (`prj_QpVn3kgANvg1iqdzsepM2cdvYRur`) en el equipo `humana-ia`: sin Git, Next.js, `npm ci --ignore-scripts`, Node 26.x, funciones solo en `arn1`, protección estándar (dominio propio público, direcciones generadas protegidas), WAF «Limite api 100 por minuto e IP» en `/api/`, `ENTORNO=preproduccion` en Production y Preview. Dominio `pre-nido.humannaia.com` añadido; **falta el CNAME** en Axarnet: `pre-nido` → `669b58d018a4b6a1.vercel-dns-017.com.` (no cambiar los nameservers). Sesión de la CLI cerrada (`vercel logout`); ningún token en la máquina. No se ha creado `nido` (producción, reservado).

## Pendiente del responsable
**Hecho 20/11:** CNAME de `pre-nido` en Axarnet (resuelve en 1.1.1.1 y 8.8.8.8 a `669b58d018a4b6a1.vercel-dns-017.com`; Vercel lo da por válido, «No Deployment»; el certificado llega con el primer despliegue) y región de Supabase «Nido» comprobada: `eu-north-1` (Estocolmo), Nano. Queda: proyecto Sentry UE (DP-2); visibilidad del repositorio y facturación de Actions; buzón de pruebas (AR-04) y pasos de Claude Max (AR-03); SQL en Supabase «Nido» (AR-05) tras T-107; variables secretas de `pre-nido`; despliegue (T-117 a) y prueba (T-119). Dominio y correo resueltos: `humannaia.com`, `accesos@humannaia.com` (dos enes). Sin respuesta: «Nido» como nombre visible.

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
