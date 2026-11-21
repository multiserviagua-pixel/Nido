# Relevo del chat de coordinación · 21/11/2026, 17:20

Reescrito entero. La historia está en `git log` y en `docs/TECNOLOGIAS.md` (D-023 a D-037). Lee también la memoria del proyecto (relevos automáticos, tablero de Figma, límite de subagentes, título de las pestañas).

## Papel
Coordinación (D-015): no escribe código de producto. Mantiene `docs/PLAN.md`, `docs/TECNOLOGIAS.md`, la constitución, `contratos/`, `.claude/` y `scripts/`; commitea los documentos de los chats de fase que no commitean; lanza, vigila y relanza los orquestadores de fase en pestañas de terminal; decide por delegación (D-036); sube `main` a `origin` tras `node scripts/comprobar-specs.mjs` (push autorizado por el responsable); mantiene el tablero de Figma (se edita en su sitio el diagrama detallado, leyenda `6:723`; nunca se añade otro).

## Prioridad (responsable)
La prueba real del conector (001) es la prioridad máxima. Autonomía total salvo lo reservado; no pedirle autorizaciones («no preguntes, avanza con autonomía», «sin pausas, avanza hasta que los créditos detengan todo»). La prueba Pro de Vercel acaba el **27/11**: T-117 (despliegue) como tarde el 25/11 y T-119 (prueba real) el 26/11.

## Estado (17:20)
- `main` en `origin` hasta `e68af7f`. Local por encima: `e44def3`, `c50f065`, `f6f1e07` y lo que integren los chats. **No subir `e44def3` sin el commit de evidencia de T-110** (ver incidente).
- Constitución **1.3** en `main` (D-037, art. 8 con la redacción del auditor; ratificada por el responsable).
- Avance por tareas: 001 al ~60 % (T-101 a T-110 menos evidencia de T-110, T-115, T-116, T-118 a, T-120 a T-123); 002 casi cerrada (T-007/T-008 bloqueadas por R-1); 010: T-001 a T-005; 020: T-002 a T-008, T-009 a medias.
- **Chats en marcha** (pestañas de esta sesión; el título puede mostrarse como «Terminal N»):
  - **Fase 1 n** (`c25`, 19:20): relanzada porque Fase 1 m se paró por memoria baja esperando aviso; ahora reintenta sola. Sigue con la evidencia de T-124 y luego T-111, T-112, T-113, T-117 (a), y redacta los pasos de T-114 para que la coordinación ejecute el SQL en Supabase. Pestaña vieja `c21` (Fase 1 m) con el proceso matado: la cierra el responsable.
  - (Anterior) **Fase 1 m** (`c21`): vuelta corta de revisor y auditor sobre las correcciones de T-110, evidencia completa en `main` y commit de evidencia; luego T-124 (`agentRules: false`), CI (SHA y CODEOWNERS), T-111, T-112, T-113, T-117 (a). Relevo: `specs/001-…/relevo.md`.
  - **Fase 2 j** (`c26`, 19:30): relanzada porque Fase 2 i se paró por memoria esperando el visto bueno de la suite de T-007 (revisada, copia `010-t-007`). Visto bueno dado por D-036; reintenta sola y, si no puede, integra con las pruebas de la rama y lo anota. Después T-008.
  - (Anterior) **Fase 2 i** (`c22`, cerrada): 010·T-006 (M08, M09, M10) desde `.claude/worktrees/010-t-006`. Relevo: `specs/010-…/relevo.md`.
  - **Fase 3 f** (`c20`): termina 020·T-009 (copia `c-020-t009a`) y sigue con T-010. Relevo: `specs/020-…/relevo-fase-3.md`. **Su encargo no lleva las reglas A, B y C**: al relanzarla, incluirlas.
  - **Fase 3 g** (`c23`, carril C2, pedido por el responsable): solo documentación, diseño, plan y P1 por D-036 de la 021 a la 025 (punto 5 del relevo de la 020, que pasa a este carril). Escribe solo en `specs/021…025`. A-11 y A-14 reservadas al responsable (fichas en su relevo). Relevo: `specs/021-acceso-superadmin/relevo-c2.md`. **Al relanzar Fase 3 f, quitarle ese punto 5.**
  - Carril A2 de la fase 1 **terminado** (`relevo-paralelo.md`): no relanzar salvo tarea nueva.
- **Incidente 16:40:** Fase 1 l dejó `git merge --squash tarea/T-110` en el índice de `main` mientras pasaba la suite; el sistema la mató por memoria y Fase 3 f hizo `e44def3` («020: plan.md anota H-1…»), que arrastró los 22 archivos de T-110. No se reescribe el historial; Fase 1 m hace el commit de evidencia explicándolo.
- **Cierres inesperados:** Fase 2 f y 2 g se cerraron solas; 2 h salió tras abrirse el asistente de configuración del modo automático; una actualización de la app cerró todos a las ~10:00; el responsable cerró por error la pestaña de Fase 3 e. Comprobar siempre el proceso (`claude.exe` con `-n "Fase …"`) antes de relanzar.
- **Memoria:** la máquina tiene 16 GB y se queda sin memoria con dos suites completas a la vez (Vitest y `next build`). Tres chats a la vez es el máximo razonable.
- Trabajo de otro chat sin commitear en la carpeta principal: `specs/016-compuerta-envio-por-regla/` y `marketing/`. No se tocan; los chats integran con rutas explícitas.

- **D-039 (21/11, 19:45):** el responsable respondió A-15 (navegador reconocido), A-11 (Google Workspace) y A-14 (excepción al art. 4 acotada y con rotación); anotado en `specs/021-…/aclaraciones.md` (59bed21). Fase 3 g aún las ve abiertas en su relevo: al relanzarla o en el próximo encargo de la 021, indicarle D-039.

## Reglas en los encargos (D-036, 21/11)
- **A. Candado de suite:** `until mkdir C:/dev/agentes-correo-humanaia/.git/suite-completa.lock 2>/dev/null; do sleep 30; done` antes de la suite completa o `build`; `rmdir` al terminar; si tiene más de 45 min, está abandonado.
- **B.** La evidencia completa se pasa en la rama rebasada, en su copia de trabajo, nunca con cambios preparados en `main`.
- **C.** Integrar = `git merge --squash` y `git commit -m … -- <rutas>` seguidos; comprobar antes que `git diff --cached --stat` está vacío.
- Reescribir el relevo cada vez que se integra una tarea.
- No arrancar `next dev` en la carpeta principal (escribe en `AGENTS.md`; si aparece, `git checkout -- AGENTS.md`). Lo arregla T-124.
- Evidencia con la máquina cargada: `npx vitest run --maxWorkers=3` más tipos, estilo, aislamiento, arnés y build por separado.

## Vercel (hecho por la coordinación el 20/11, con el responsable)
Proyecto `pre-nido` (`prj_QpVn3kgANvg1iqdzsepM2cdvYRur`) en el equipo `humana-ia`: sin Git, Next.js, `npm ci --ignore-scripts`, Node 26.x, funciones solo en `arn1`, variables de sistema expuestas, `ENTORNO=preproduccion` en Production y Preview, WAF «Limite api 100 por minuto e IP» en `/api/`. Dominio `pre-nido.humannaia.com` con CNAME válido (sin despliegue aún, el certificado llega con el primero). No se ha creado `nido` (producción, reservado). Ningún token de la CLI en la máquina.

## Pendiente de la coordinación
- **Reglas WAF en `pre-nido`** para `/api/operacion` (condición de T-108) y `/oauth/*` (condición del auditor en T-110: un solo origen puede llenar el cupo global de solicitudes por GET).
- Subir `main` cuando entre el commit de evidencia de T-110.
- `docs/TECNOLOGIAS.md`: anotar D-027 y D-033 como DEROGADAS y enmendar D-030.
- Tablero de Figma: marcar hechas T-105 a T-110, T-120 a T-123; 010 T-003 a T-005; 020 T-004 a T-008; 002 T-010 a T-012.
- `specs/010-base-datos-rls/propuestas.md` n.º 17 a 33: trasladar a los documentos compartidos.
- Clones `C:\dev\qa-t010\` y `C:\dev\qa-t010b\`: se pueden borrar.

## Pendiente del responsable
Variables de `pre-nido` puestas por el responsable el 21/11 y comprobadas por la coordinación (solo nombres, tipo y entornos, Production y Preview): `ENTORNO`, `SUPERVISION_DSN`, `CONECTOR_SECRETO`, `URL_PUBLICA`; faltan `CONECTOR_BD_URL` y `AUTORIZACION_BD_URL` (tras el SQL de Supabase) y `OPERACION_HUELLA` (T-117). Proyecto Sentry `pre-nido` lo creó la coordinación el 21/11 en la sesión del responsable: plataforma Node sin SDK, ingesta `ingest.de.sentry.io`, «no almacenar IP» activado y comprobado por la API, alerta de incidencias de prioridad alta por correo creada de serie; DSN en Settings → Projects → pre-nido → Client Keys); `CONECTOR_SECRETO` y demás variables secretas de `pre-nido`; SQL en Supabase «Nido» (AR-05, AR-06, endurecimiento de T-123 b; Fase 1 m prepara los pasos); buzón de pruebas y Claude Max (AR-03, AR-04, AR-08); revisiones visuales T-013 y T-019 de la 020; visibilidad del repositorio (público ahora); seguir con Vercel Pro tras el 27/11.

## Cómo se relanza una fase
1. Comprobar que el proceso terminó (no basta con que el vigía avise: los chats reescriben el relevo a menudo) y leer el relevo y la copia de trabajo de la tarea en curso (trabajo sin commitear).
2. Cerrar su proceso (`claude.exe` con `-n "<nombre>"`) o su pestaña con `stop_terminal_tab`. Si el responsable escribió en la pestaña, la herramienta no la cierra: matar el proceso y pedirle que cierre la pestaña.
3. Lanzar con un script `.ps1` en la carpeta temporal: `claude --agent orquestador --permission-mode auto -n '<Fase N x>' $encargo`, encargo en ASCII y **sin comillas dobles** (PowerShell 5.1 corta ahí), con la situación exacta, las decisiones por D-036 citando las palabras del responsable, y las reglas A, B y C. Comprobar con `grep -c '"'` y `grep -cP '[^\x00-\x7F]'`.
4. `run_in_terminal` con `cwd` = carpeta de notas y **`title` = nombre de la fase**. Máximo 6 pestañas por sesión.

## Vigilancia
Vigía en segundo plano (`vigia.sh` en la carpeta temporal de la sesión): avisa cuando un relevo cambia y queda quieto 4 min, o cuando nada cambia en 12 min. Al avisar, relanzarlo tras revisar.
