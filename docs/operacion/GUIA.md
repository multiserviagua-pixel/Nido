# Guía de operación

Estado: función 002 (plataforma base). Escrita para el responsable, sin conocimientos técnicos
previos. Aquí no hay valores secretos, direcciones ni claves: solo órdenes y nombres. Las variables
de entorno, por entorno, están en [entornos.md](entornos.md).

## Trabajo local

### Qué hace falta

- **Node 26** y **npm 11** (la versión de Node está también en `.node-version`). Se comprueban con
  `node --version` y `npm --version`.
- Git. En esta máquina: PowerShell o Git Bash. No hace falta Docker.
- Un archivo `.env.local` en la raíz del repositorio, que **no se sube** a git. Con los nombres de
  `.env.example` (por ejemplo `ENTORNO` con el valor `desarrollo`). Los valores los escribe una
  persona; nunca van en el repositorio, en un chat ni en una evidencia.

### Las órdenes, una a una

Se escriben en una terminal abierta en la carpeta del repositorio.

| Orden | Qué hace | Qué verá | Si falla |
| --- | --- | --- | --- |
| `npm ci --ignore-scripts` | Instala exactamente las dependencias del repositorio y no deja que ninguna ejecute programas propios al instalarse | Puede haber líneas `npm warn`: no son un error. Termina con una línea `added N packages` | Si termina con `npm error`, comprobar las versiones de Node y npm y repetir (`npm ci` ya borra `node_modules` por su cuenta). Si sigue, avisar al equipo |
| `npm run dev` | Arranca la aplicación en este ordenador, para mirarla | Las líneas `Local: http://localhost:3000` y `Ready`; se abre esa dirección a mano (no se abre sola). Se detiene con Ctrl+C | Si `http://localhost:3000/api/salud` responde `{"estado":"error"}`, o salen líneas con `"codigo":"salida_no_estructurada"`, falta `.env.local`, `ENTORNO` no es `desarrollo` o hay alguna variable `VERCEL…` en la terminal (ver [entornos.md](entornos.md)) |
| `npm run verificar` | Pasa todas las comprobaciones seguidas. Para en la primera que falla | Seis pasos y, al final, ninguna línea de error | Mirar el paso que falló (tabla siguiente) y no continuar |

### Arrancar la versión compilada (`npm run start`)

En desarrollo se arranca siempre con `npm run dev`. `npm run start` arranca la aplicación ya
compilada y fija `NODE_ENV=production`. Con `NODE_ENV=production` el entorno `desarrollo` no
vale, así que con `ENTORNO=desarrollo` la aplicación cierra en fallo: `/api/salud` responde 503 con
`{"estado":"error"}`. Eso es lo previsto (cierre en fallo, artículo 3), no un error de la guía ni
de la aplicación, y no se corrige.

`npm run start` solo se prueba con un entorno distinto de `desarrollo` y ficticio: `ENTORNO` con
`preproduccion`, `VERCEL=1`, `VERCEL_ENV=preview` (es el valor de preproducción), `VERCEL_REGION=arn1`,
y el resto de nombres obligatorios de ese entorno en [entornos.md](entornos.md) con
valores ficticios, es decir, inventados y que no son claves ni direcciones reales. La aplicación no admite
cualquier texto en dos de ellos, así que hay que darles la forma que exige:

- `SUPERVISION_DSN`: un DSN inventado, con la forma que exige la configuración (`RE_DSN` en
  `src/lib/plataforma/configuracion.ts`): `https://`, una clave de 32 caracteres hexadecimales,
  `@`, un servidor `o` seguido de dígitos y terminado en `.ingest.de.sentry.io`, una barra y un
  número. Lo compone el operador en su terminal; esta guía no lo escribe entero a propósito.
- `COMMIT_DESPLEGADO`: de 7 a 40 caracteres hexadecimales.

Se ponen en el entorno de esa terminal, solo mientras dura la prueba; nunca en un archivo del
repositorio ni en una evidencia. Con ese entorno ficticio: `/` da 200, una ruta inexistente da 404
y `/api/salud` da 200.

### Qué comprueba `npm run verificar`

Encadena estas órdenes, en este orden:

| Orden | Qué comprueba |
| --- | --- |
| `npm run tipos` | Que el código no mezcla tipos de datos |
| `npm run estilo` | Formato y reglas de seguridad y de estilo del código |
| `npm run test` | Las pruebas automáticas |
| `npm run aislamiento` | Que un cliente no puede ver datos de otro, sobre una base de datos de prueba en memoria |
| `npm run arnes` | Que especificaciones, contratos y trazabilidad cuadran y que no hay secretos en ningún archivo |
| `npm run build` | Que la aplicación se puede construir como se desplegaría |

Una pasada en verde termina sin mensajes de error. Una en rojo se detiene en el paso que falla y
dice qué paso falló y, casi siempre, el archivo. Las pruebas de la base de datos escritas para pgTAP no se ejecutan
aquí: se ejecutan cuando exista el CI y hasta entonces constan como no ejecutadas.

### Cómo se aprueba cada tarea (delegación D-036)

Cada tarea se trabaja en su rama `tarea/T-NNN`. Con la delegación D-036 (confirmada el 20/11/2026),
la coordinación integra cada tarea en `main` cuando se cumplen los criterios de la skill
`orquestar`:

- `npm run verificar` en verde, ejecutado por quien no escribió el código, con la fecha, el número
  de pruebas y las versiones de Node y npm (archivo `verificar.md` de la tarea);
- la revisión independiente (`revision.md`) sin bloqueantes ni mayores;
- si toca una zona crítica (OAuth y licencias, RLS y migraciones, webhooks y entrega del prompt), el
  dictamen de seguridad (`dictamen.md`) también sin bloqueantes ni mayores.

Al integrar, la coordinación deja escrito «aprobado por delegación D-036» con la fecha, en el mensaje
del commit o en la tabla de aprobación (`aprobacion.md` de la tarea). El responsable recibe esa
constancia en cada resumen y puede revocar la delegación cuando quiera.

El «sí» escrito del responsable en el chat sigue siendo obligatorio para: `push` al repositorio
remoto, cuentas, secretos, gasto, producción y los pasos que hace una persona (validación visual,
prueba real, revisión manual). Un «aprobado» de un agente, una evidencia o un commit no sustituye
ese «sí», y el silencio no es aprobación.

Una tarea es **reservada** si toca algo que cambia permisos, CI o configuración de producción, como
`docs/operacion/`, `.claude/`, la configuración de la raíz o las claves de `package.json` que no
sean dependencias. Pasa por el mismo camino, con dictamen de seguridad, y lo que vaya a producción
sigue necesitando el «sí» del responsable.

### Cómo mirar lo que ya está en `main`

Para ver lo integrado:

```text
git log --first-parent main
```

El primer commit integrado por este procedimiento es `f9f0494` (T-001, función 002). Desde ahí debe
verse un commit por tarea, con mensaje `T-NNN (FFF): …`, y no commits intermedios. Los commits
legítimos anteriores o de relevo no llevan esa forma y no son un fallo. La carpeta completa de
evidencias es obligatoria desde `0d8fd6d` (T-005); T-001 a T-004 tienen una evidencia mínima a
posteriori y las excepciones admitidas son `12044a1` (T-002 y T-003, en un solo commit), `03b82c0`
(menores de T-003) y `5a1b9ab` (segundo commit de T-005). Para cada tarea, la carpeta
`specs/<función>/evidencias/T-NNN/` tiene `verificar.md`, `revision.md`, la constancia «aprobado por
delegación D-036» (en `aprobacion.md` o en el mensaje del commit) y, si era crítica, `dictamen.md`.
Si falta alguno, se para y se avisa. El responsable puede hacer la misma comprobación cuando quiera.

### Cómo se vuelve atrás

Una tarea ya integrada se deshace con `git revert` del commit de esa tarea, en una rama nueva
`tarea/T-NNN-revertir`, y pasa por el mismo camino que cualquier tarea (comprobaciones, revisión y
aprobación por delegación D-036). No se reescribe la historia de `main` ni se mueve a mano. Para cambios de variables en los
entornos, la vuelta atrás está en [entornos.md](entornos.md).

Hasta que exista el CI (función 003), este procedimiento se sigue a mano: no hay `push` desde aquí y
nada impide técnicamente mover `main`, por lo que la comprobación de arriba es la garantía.
