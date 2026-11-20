# Relevo del chat de coordinación · 20/11/2026, 12:45

Reescrito entero. La historia está en `git log` y en `docs/TECNOLOGIAS.md` (D-023 a D-036). Lee también la memoria del proyecto (relevos automáticos, tablero de Figma, límite de subagentes).

## Papel
Coordinación (D-015): no escribe código de producto. Mantiene `docs/PLAN.md`, `docs/TECNOLOGIAS.md`, la constitución, `contratos/`, `.claude/` y `scripts/`; commitea los documentos de los chats de fase que no commitean; lanza, vigila y relanza los orquestadores de fase en pestañas de terminal; decide por delegación (D-036) y mantiene el tablero de Figma.

## Estado (comprobado a las 12:45)
- `main` en `66fc807` (sin push). Ramas de tareas en `.claude/worktrees/`.
- **Delegación D-036** (constitución 1.1): la coordinación aprueba integración en `main`, decisiones con opción recomendada, P0, P1, P7 y cambios de permisos, CI y límites del agente. Reservado al responsable: push, cuentas, secretos, gasto, producción y pasos de una persona. Informarle en cada resumen de lo aprobado en su nombre.
- **Fases en marcha** (pestañas de terminal; el chat nuevo no las ve con sus herramientas de terminal, pero puede leer su estado por los relevos y `git`, y cerrar sus procesos con PowerShell):
  - Fase 1 d (`claude -n "Fase 1 d"`, desde 12:26): integrar en `main` T-003-menores, T-004, T-101, T-102; T-005 con tres endurecimientos aprobados; retirar la prueba de fechas (D-034); ajustar el diseño de la 001 a D-035; anotar el aviso de la 010 (propuesta 25) en T-103 y T-114; después T-103. Relevo: `specs/001-conector-prueba-real/relevo.md`.
  - Fase 2 c (`-n "Fase 2 c"`, desde 11:52): retoques del diseño de la 010 y T-001 de la 010. Relevo: `specs/010-base-datos-rls/relevo.md`.
  - **Fase 3 PAUSADA a las 12:45** por uso (ventana de 5 h al 65 %, D-032 pide volver a dos fases por encima del 60 %). Estaba en la revisión de 020·T-002: rama `tarea/020-T-002`, commits `ddaa483` y `e0ff69e`, `npm run verificar` en verde (52 pruebas). Al reanudar: repetir revisor y `auditor-seguridad` sobre esa rama, integrar por D-036, y quitar `scripts/generar-fechas-bloqueo.mjs` con su línea de `docs/TECNOLOGIAS.md`. Reanudar cuando la ventana baje del 60 % (se reinicia a las 13:30 UTC, 14:30 en Madrid). Relevo: `specs/020-sistema-diseno-armazon/relevo-fase-3.md` (no recoge la pausa).
- Los chats de fase en marcha cargaron las reglas antes de D-036 y aún pueden pararse a preguntar al responsable; desde su próximo relevo arrancan con D-036.

## Cómo se relanza una fase
1. Comprobar que el chat terminó (relevo reescrito y quieto) y leer el relevo.
2. Cerrar su proceso y su consola con PowerShell: `claude.exe` con `-n "<nombre>"` en la línea de órdenes y su proceso padre (la consola de la pestaña).
3. Lanzar en una pestaña nueva: `claude --agent orquestador --permission-mode auto -n "<Fase N x>" "<encargo en ASCII>"`, citando el relevo, D-029, D-031, D-034, D-035, D-036, un solo subagente opus a la vez, código en su copia de trabajo y rama, carpeta principal en `main`, carpetas de `specs/` de las otras fases sin tocar, sin push ni cuentas ni secretos, y relevo al llegar a 150k.
4. Si el relevo deja una decisión con opción recomendada y criterios cumplidos, decidir por D-036 y escribirla en el encargo; si es reservada, preguntar al responsable.

## Vigilancia
Script `vigia.sh` del chat anterior (en su carpeta temporal): avisa cuando un relevo cambia y queda quieto 4 min, o cuando nada cambia en 12 min. El chat nuevo debe montar el suyo.

## Pendiente de coordinación
- Actualizar el tablero de Figma (fileKey `UBZGXG0xKi3IKGkuqlvpxh`) cuando entre la tanda de la fase 1 en `main`: incluye 020·T-001 (ya en `main`).
- `specs/010-base-datos-rls/propuestas.md` n.º 17 a 32: trasladar a los documentos compartidos (la 29 ya está aplicada como D-035).
- Decisiones del responsable sin respuesta: «Nido» como nombre visible; correo `accesos@humannaia.com` (dos enes sin confirmar); push al remoto (sin él no corre el CI de D-030 ni el `bd.yml` de la 010); AR-01, DP-1 y DP-2 de la 001.
